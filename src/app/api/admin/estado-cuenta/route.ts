import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'

/**
 * GET /api/admin/estado-cuenta
 * Situación de pagos de todos los alumnos activos, agregada server-side
 * (función SQL estado_cuenta_alumnos). Staff: admin y secretario — es la
 * misma información que ya ven alumno por alumno, solo agregada en una vista.
 *
 * Nota de redacción: se reportan hechos (meses sin pago registrado), nunca
 * conclusiones financieras — el sistema no puede distinguir un pago no
 * capturado de una cortesía o un error.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()
    const { data, error } = await admin.rpc('estado_cuenta_alumnos')

    if (error) {
      console.error('[GET /api/admin/estado-cuenta] rpc:', error.message)
      return NextResponse.json(
        { error: 'No se pudo calcular el estado de cuenta. ¿Está aplicada la migración 20260716160000_estado_cuenta.sql?' },
        { status: 500 }
      )
    }

    type Row = {
      alumno_id: string; nombre: string | null; apellidos: string | null; email: string | null
      matricula: string | null; nivel: string | null; modalidad: string | null
      meses_desbloqueados: number; meses_con_pago: number; meses_sin_pago_registrado: number
      inscripcion_pagada: boolean; fecha_ultimo_pago: string | null
    }

    const alumnos = ((data ?? []) as Row[]).map(r => ({
      id: r.alumno_id,
      nombre_completo: [r.nombre, r.apellidos].filter(Boolean).join(' ') || '—',
      email: r.email ?? '—',
      matricula: r.matricula ?? null,
      nivel: r.nivel ?? null,
      modalidad: r.modalidad ?? null,
      meses_desbloqueados: r.meses_desbloqueados ?? 0,
      meses_con_pago: r.meses_con_pago ?? 0,
      meses_sin_pago_registrado: r.meses_sin_pago_registrado ?? 0,
      inscripcion_pagada: Boolean(r.inscripcion_pagada),
      fecha_ultimo_pago: r.fecha_ultimo_pago ?? null,
    }))

    return NextResponse.json({ alumnos })
  } catch (err) {
    console.error('[GET /api/admin/estado-cuenta]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
