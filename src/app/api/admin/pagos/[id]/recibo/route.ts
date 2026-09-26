import type { SupabaseClient } from '@supabase/supabase-js'
import { CONFIG } from '@/lib/config'
import { codigoMoneda, formatearMoneda } from '@/lib/moneda'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { renderReciboPdf } from '@/lib/pdf/recibo-pago'
import { mensajeRecibo, waUrl } from '@/lib/whatsapp'
import { conceptoMensajeRecibo } from '@/lib/pagos/conceptos'

// Misma ventana que las constancias (86400s = 24h): el alumno abre el link
// desde WhatsApp, a veces horas después de recibirlo.
const SIGNED_URL_TTL = 86400


/**
 * Cuántas semanas tiene el calendario de este alumno, para el «de M» del
 * recibo. Devuelve 0 si no lleva calendario (escuela mensual): el recibo se
 * queda en «Semana N» en vez de anunciar un total inventado.
 */
async function totalSemanasDe(
  admin: SupabaseClient,
  alumnoId: string,
): Promise<number> {
  try {
    const { data } = await admin
      .from('calendario_pagos')
      .select('total_semanas')
      .eq('alumno_id', alumnoId)
      .limit(1)
      .maybeSingle()
    return Number(data?.total_semanas ?? 0)
  } catch {
    // La tabla puede no existir en un cliente sin la migración: el recibo se
    // emite igual, que es lo que la persona está esperando.
    return 0
  }
}

/**
 * GET /api/admin/pagos/[id]/recibo
 * Genera (una sola vez) el PDF de recibo del pago, lo sube a Storage
 * (recibos/{alumno_id}/{pago_id}.pdf) y devuelve un signed URL fresco +
 * la URL wa.me con el mensaje prellenado. Staff: admin y secretario.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()

    // ── Pago + datos para el recibo ──────────────────────────────────────────
    // select('*'): `moneda` (#198) y `curso_inscripcion_id` (B1) no existen en
    // toda base, y pedirlos por nombre tumbaba la consulta (404 falso).
    const { data: pagoRaw, error: pagoErr } = await admin
      .from('pagos')
      .select('*')
      .eq('id', params.id)
      .single()
    if (pagoErr || !pagoRaw) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }
    const pago = pagoRaw as {
      id: string; alumno_id: string; monto: number | string; concepto: string | null; mes_desbloqueado: number | null
      numero_semana?: number | null; metodo_pago: string; referencia: string | null; registrado_por: string | null
      fecha_pago: string | null; created_at: string; moneda?: unknown; curso_inscripcion_id?: string | null
    }

    // D15 (#207-4): el curso del pago, para el recibo y el WhatsApp. Dos lecturas
    // simples (sin embed). Si una FALLA no se genera nada: el PDF se guarda una
    // sola vez y se quedaría para siempre sin el nombre del curso.
    let curso: { nombre: string | null; tipo: string | null } | null = null
    if (pago.curso_inscripcion_id) {
      const { data: ins, error: errIns } = await admin.from('curso_inscripciones').select('curso_id').eq('id', pago.curso_inscripcion_id).maybeSingle()
      const cursoId = (ins as { curso_id?: string } | null)?.curso_id
      const { data: c, error: errCurso } = cursoId
        ? await admin.from('cursos').select('nombre, tipo').eq('id', cursoId).maybeSingle()
        : { data: null, error: null }
      if (errIns || errCurso) {
        console.error('[GET recibo] curso del pago:', (errIns ?? errCurso)?.message)
        return NextResponse.json({ error: 'No se pudo leer el curso de este pago. Intenta de nuevo en un momento.' }, { status: 503 })
      }
      curso = { nombre: (c as { nombre?: string } | null)?.nombre ?? null, tipo: (c as { tipo?: string } | null)?.tipo ?? null }
    }
    const conCurso = {
      concepto: pago.concepto ?? 'mensualidad',
      mes_desbloqueado: pago.mes_desbloqueado ?? null,
      curso_inscripcion_id: pago.curso_inscripcion_id ?? null,
      curso_nombre: curso?.nombre ?? null,
      curso_tipo: curso?.tipo ?? null,
    }
    // La moneda REAL del pago (congelada al registrarlo); sin columna, la de la escuela.
    // ⚠️ El cobro de curso viejo (B3, curso_registrar_pago) NO escribe la moneda:
    // su fila se queda con el DEFAULT 'MXN' aunque la escuela cobre en dólares. En
    // una fila de curso, un 'MXN' que contradice a la escuela es ese default, no
    // una moneda congelada (el cobro de D16 siempre escribe la de la escuela).
    const monedaEscuela = codigoMoneda(CONFIG.moneda)
    const monedaFila = codigoMoneda(pago.moneda, monedaEscuela)
    const monedaPago = pago.curso_inscripcion_id && monedaFila === 'MXN' ? monedaEscuela : monedaFila

    const [{ data: alumnoUsuario }, { data: alumnoRow }, { data: registrador }] = await Promise.all([
      admin.from('usuarios').select('nombre, apellidos, telefono').eq('id', pago.alumno_id).single(),
      admin.from('alumnos').select('matricula').eq('id', pago.alumno_id).single(),
      admin.from('usuarios').select('nombre, apellidos').eq('id', pago.registrado_por).single(),
    ])

    const alumnoNombre = [alumnoUsuario?.nombre, alumnoUsuario?.apellidos].filter(Boolean).join(' ') || 'Alumno'
    const registradoPor = [registrador?.nombre, registrador?.apellidos].filter(Boolean).join(' ') || 'Administración'
    const folio = `REC-${String(pago.id).slice(0, 8).toUpperCase()}`
    const storagePath = `${pago.alumno_id}/${pago.id}.pdf`

    // ── Idempotente: si ya existe, solo firmar; si no, generar y subir ──────
    let { data: signed } = await admin.storage
      .from('recibos')
      .createSignedUrl(storagePath, SIGNED_URL_TTL)

    if (!signed?.signedUrl) {
      const pdf = await renderReciboPdf({
        folio,
        alumnoNombre,
        matricula: alumnoRow?.matricula ?? null,
        concepto: pago.concepto ?? 'mensualidad',
        mesDesbloqueado: pago.mes_desbloqueado ?? null,
        monto: Number(pago.monto),
        metodoPago: pago.metodo_pago,
        referencia: pago.referencia ?? null,
        fechaPago: pago.fecha_pago ?? pago.created_at,
        registradoPor,
        cursoInscripcionId: conCurso.curso_inscripcion_id,
        cursoNombre: conCurso.curso_nombre,
        cursoTipo: conCurso.curso_tipo,
        moneda: monedaPago,
      })

      const { error: uploadErr } = await admin.storage
        .from('recibos')
        .upload(storagePath, pdf, { contentType: 'application/pdf', upsert: false })
      // 'Duplicate' = otra petición lo subió en paralelo — no es error real
      if (uploadErr && !uploadErr.message.toLowerCase().includes('duplicate')) {
        return NextResponse.json({ error: `Error al subir recibo: ${uploadErr.message}` }, { status: 500 })
      }

      const { data: signed2, error: signErr } = await admin.storage
        .from('recibos')
        .createSignedUrl(storagePath, SIGNED_URL_TTL)
      if (signErr || !signed2?.signedUrl) {
        return NextResponse.json({ error: `Error al firmar recibo: ${signErr?.message ?? 'sin URL'}` }, { status: 500 })
      }
      signed = signed2
    }

    // ── URL de WhatsApp con mensaje prellenado (convención Contactar) ───────
    let conceptoLabel = conceptoMensajeRecibo(conCurso)
    // 🛑 En un cobro semanal el recibo tiene que decir QUÉ semana cubre. "Cuota
    // semanal" a secas no le sirve a un alumno con veinticuatro recibos
    // iguales, ni a la escuela cuando el alumno reclama que ya pagó esa.
    if (pago.concepto === 'cuota_semanal' && pago.numero_semana) {
      const total = await totalSemanasDe(admin, pago.alumno_id)
      conceptoLabel = total
        ? `Semana ${pago.numero_semana} de ${total}`
        : `Semana ${pago.numero_semana}`
    }
    const montoFmt = formatearMoneda(Number(pago.monto), { moneda: monedaPago, tipoCambioMXN: 0 }, { decimales: 2, conCodigo: true })
    const mensaje = mensajeRecibo({
      alumnoNombre,
      conceptoLabel,
      montoFmt,
      url: signed.signedUrl,
    })
    const whatsappUrl = waUrl(alumnoUsuario?.telefono, mensaje)

    return NextResponse.json({
      signedUrl: signed.signedUrl,
      whatsappUrl, // null si el alumno no tiene teléfono
      folio,
    })
  } catch (err) {
    console.error('[GET /api/admin/pagos/[id]/recibo]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
