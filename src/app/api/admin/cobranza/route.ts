/**
 * GET /api/admin/cobranza
 *
 * "Cobranza de la semana": alumnos con cuotas semanales vencidas, ordenados de
 * más a menos deuda. Sale de `estado_cuenta_semanal()`, que devuelve HECHOS
 * (semanas pendientes con fecha ya pasada), nunca conclusiones financieras: el
 * sistema no distingue un pago sin capturar de una cortesía.
 *
 * Staff (admin y secretario): el secretario es quien cobra.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'

export const dynamic = 'force-dynamic'

type Row = {
  alumno_id: string; nombre: string | null; apellidos: string | null
  email: string | null; telefono: string | null; matricula: string | null
  nivel: string | null; modalidad: string | null; inscripcion_pagada: boolean
  semanas_total: number; semanas_pagadas: number; semanas_condonadas: number
  semanas_vencidas: number; semanas_pendientes: number
  monto_pagado: number; monto_vencido: number; saldo_pendiente: number
  proxima_semana: number | null; proxima_fecha: string | null
  fecha_ultimo_pago: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()
    const { data, error } = await admin.rpc('estado_cuenta_semanal')

    if (error) {
      console.error('[GET /api/admin/cobranza] rpc:', error.message)
      return NextResponse.json(
        { error: 'No se pudo calcular la cobranza. ¿Está aplicada la migración 20260910130000_periodicidad_semanal.sql?' },
        { status: 500 },
      )
    }

    const alumnos = ((data ?? []) as Row[]).map(r => ({
      id: r.alumno_id,
      nombre_completo: [r.nombre, r.apellidos].filter(Boolean).join(' ') || '—',
      email: r.email ?? '—',
      telefono: r.telefono ?? null,
      matricula: r.matricula ?? null,
      nivel: r.nivel ?? null,
      inscripcion_pagada: r.inscripcion_pagada,
      semanas_total: r.semanas_total ?? 0,
      semanas_pagadas: r.semanas_pagadas ?? 0,
      semanas_condonadas: r.semanas_condonadas ?? 0,
      semanas_vencidas: r.semanas_vencidas ?? 0,
      semanas_pendientes: r.semanas_pendientes ?? 0,
      monto_pagado: Number(r.monto_pagado ?? 0),
      monto_vencido: Number(r.monto_vencido ?? 0),
      saldo_pendiente: Number(r.saldo_pendiente ?? 0),
      proxima_semana: r.proxima_semana,
      proxima_fecha: r.proxima_fecha,
      fecha_ultimo_pago: r.fecha_ultimo_pago,
    }))

    return NextResponse.json({
      alumnos,
      con_vencidas: alumnos.filter(a => a.semanas_vencidas > 0).length,
      monto_vencido_total: alumnos.reduce((s, a) => s + a.monto_vencido, 0),
    })
  } catch (e) {
    console.error('[GET /api/admin/cobranza] error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
