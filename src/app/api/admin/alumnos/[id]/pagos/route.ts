import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { leerPagosConCurso } from '@/lib/pagos/con-curso'
import { totalesPorVertical } from '@/lib/pagos/conceptos'

/**
 * GET /api/admin/alumnos/[id]/pagos
 * Historial de pagos de un alumno, más reciente primero.
 *
 * D14 (#207-3): cada pago trae su curso (o null = programa) y el total se parte
 * por vertical. Antes «Total pagado» sumaba programa y cursos juntos.
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

    const { data: pagos, error } = await leerPagosConCurso<{ monto: number | string }>(
      (select) => admin
        .from('pagos')
        .select(select)
        .eq('alumno_id', params.id)
        .order('fecha_pago', { ascending: false })
        .order('created_at', { ascending: false }),
      'id, monto, concepto, mes_desbloqueado, metodo_pago, referencia, fecha_pago, created_at',
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const t = totalesPorVertical(pagos)
    return NextResponse.json({
      pagos,
      total_pagado:   t.total,
      total_programa: t.programa,
      total_cursos:   t.cursos,
    })
  } catch (err) {
    console.error('[GET /api/admin/alumnos/[id]/pagos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
