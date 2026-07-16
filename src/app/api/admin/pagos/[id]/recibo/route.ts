import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { renderReciboPdf } from '@/lib/pdf/recibo-pago'
import { waUrl } from '@/lib/whatsapp'

// Misma ventana que las constancias (86400s = 24h): el alumno abre el link
// desde WhatsApp, a veces horas después de recibirlo.
const SIGNED_URL_TTL = 86400

const CONCEPTO_LABELS: Record<string, string> = {
  inscripcion: 'inscripción',
  mensualidad: 'mensualidad',
  otro:        'pago',
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
    const { data: pago, error: pagoErr } = await admin
      .from('pagos')
      .select('id, alumno_id, monto, concepto, mes_desbloqueado, metodo_pago, referencia, registrado_por, created_at')
      .eq('id', params.id)
      .single()
    if (pagoErr || !pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

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
        fechaPago: pago.created_at,
        registradoPor,
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
    const conceptoLabel = CONCEPTO_LABELS[pago.concepto ?? 'mensualidad'] ?? pago.concepto
    const montoFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number(pago.monto))
    const mensaje = `Hola ${alumnoNombre}, aquí está tu recibo de pago de ${conceptoLabel} por ${montoFmt}: ${signed.signedUrl}`
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
