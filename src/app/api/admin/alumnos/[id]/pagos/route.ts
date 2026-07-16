import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'

/**
 * GET /api/admin/alumnos/[id]/pagos
 * Historial de pagos de un alumno, más reciente primero.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Staff: el secretario necesita el historial + total para registrar pagos
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()

    const { data: pagos, error } = await admin
      .from('pagos')
      .select('id, monto, concepto, mes_desbloqueado, metodo_pago, referencia, created_at')
      .eq('alumno_id', params.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    type PagoRow = { monto: number | string }
    const total_pagado = ((pagos ?? []) as PagoRow[]).reduce((s, p) => s + Number(p.monto ?? 0), 0)

    return NextResponse.json({ pagos: pagos ?? [], total_pagado })
  } catch (err) {
    console.error('[GET /api/admin/alumnos/[id]/pagos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
