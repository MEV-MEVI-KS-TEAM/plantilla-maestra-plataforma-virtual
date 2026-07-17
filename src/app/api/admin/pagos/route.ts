import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'

const CONCEPTOS = ['inscripcion', 'mensualidad', 'otro'] as const
const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'] as const

/**
 * POST /api/admin/pagos
 * Registra un pago manual de un alumno (siempre capturado por admin).
 * Body: { alumno_id, monto, concepto?, mes_desbloqueado?, metodo_pago, referencia? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Staff: el secretario también registra pagos (el DELETE sigue admin-only)
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const body = await request.json()
    const { alumno_id, monto, referencia } = body
    const concepto = body.concepto ?? 'mensualidad'
    const metodo_pago = body.metodo_pago

    // fecha_pago editable (YYYY-MM-DD). Si no viene o es inválida, la BD usa
    // CURRENT_DATE por default. Permite registrar pagos con fecha real/retroactiva.
    let fechaPago: string | undefined
    if (body.fecha_pago !== undefined && body.fecha_pago !== null && body.fecha_pago !== '') {
      const f = String(body.fecha_pago)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || Number.isNaN(new Date(`${f}T12:00:00`).getTime())) {
        return NextResponse.json({ error: 'fecha_pago inválida. Usa el formato YYYY-MM-DD' }, { status: 400 })
      }
      fechaPago = f
    }

    if (typeof alumno_id !== 'string' || !alumno_id) {
      return NextResponse.json({ error: 'El campo alumno_id es requerido' }, { status: 400 })
    }
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return NextResponse.json({ error: 'El monto debe ser un número mayor a 0' }, { status: 400 })
    }
    if (!CONCEPTOS.includes(concepto)) {
      return NextResponse.json({ error: `Concepto inválido. Usa: ${CONCEPTOS.join(', ')}` }, { status: 400 })
    }
    if (typeof metodo_pago !== 'string' || !METODOS.includes(metodo_pago.toUpperCase() as typeof METODOS[number])) {
      return NextResponse.json({ error: `Método de pago inválido. Usa: ${METODOS.join(', ')}` }, { status: 400 })
    }

    // mes_desbloqueado solo aplica a mensualidades; NULL para inscripción/otro
    let mesDesbloqueado: number | null = null
    if (concepto === 'mensualidad' && body.mes_desbloqueado !== undefined && body.mes_desbloqueado !== null && body.mes_desbloqueado !== '') {
      const mes = Number(body.mes_desbloqueado)
      if (!Number.isInteger(mes) || mes <= 0) {
        return NextResponse.json({ error: 'mes_desbloqueado debe ser un entero mayor a 0' }, { status: 400 })
      }
      mesDesbloqueado = mes
    }

    const admin = createAdminClient()

    // Validar que el alumno exista antes de insertar
    const { data: alumno, error: alumnoErr } = await admin
      .from('alumnos')
      .select('id')
      .eq('id', alumno_id)
      .single()
    if (alumnoErr || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    const { data: pago, error } = await admin
      .from('pagos')
      .insert({
        alumno_id,
        monto: montoNum,
        concepto,
        mes_desbloqueado: mesDesbloqueado,
        metodo_pago: metodo_pago.toUpperCase(),
        referencia: typeof referencia === 'string' && referencia.trim() !== '' ? referencia.trim() : null,
        registrado_por: user.id,
        ...(fechaPago ? { fecha_pago: fechaPago } : {}),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, pago }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/pagos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
