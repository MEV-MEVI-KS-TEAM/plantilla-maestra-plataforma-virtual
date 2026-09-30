import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()
    // #187: esta ruta es de ALUMNOS. Sobre personal (admin o secretario) o sobre
    // uno mismo → 403, con el rol leído de la BD y ANTES de escribir nada.
    const objetivo = await cargarAlumnoObjetivo(admin, params.id, user.id)
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    // Solo marca inscripcion_pagada = true — NO toca meses_desbloqueados
    const { error } = await admin
      .from('alumnos')
      .update({ inscripcion_pagada: true })
      .eq('id', objetivo.alumno.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/alumnos/[id]/inscripcion]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
