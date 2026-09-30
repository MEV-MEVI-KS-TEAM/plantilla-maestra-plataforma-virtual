import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'

/**
 * GET /api/admin/alumnos/pendientes-count
 * Retorna el número de alumnos con inscripcion_pagada=false y contactado_whatsapp=false
 * (los que todavía no han sido contactados por Control Escolar).
 * Devuelve { count: 0 } en caso de error para no romper el sidebar.
 * D21a: lo ve el PERSONAL (admin y secretario): contactar es tarea de recepción,
 * y es el mismo número que el secretario ya ve en la pestaña «Pendientes de contactar».
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    const denied = await verifyStaff(supabase, user.id)
    if (denied) return NextResponse.json({ count: 0 })

    const admin = createAdminClient()

    // #187: el mismo criterio que la lista: el personal con fila en `alumnos` no
    // cuenta como pendiente (no sale en la lista ni se puede marcar contactado).
    const { count, error } = await admin
      .from('alumnos')
      .select('id, usuarios!inner(rol)', { count: 'exact', head: true })
      .eq('inscripcion_pagada', false)
      .eq('contactado_whatsapp', false)
      .eq('usuarios.rol', 'alumno')

    if (error) {
      console.error('[GET /api/admin/alumnos/pendientes-count]', error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch (err) {
    console.error('[GET /api/admin/alumnos/pendientes-count]', err)
    return NextResponse.json({ count: 0 })
  }
}
