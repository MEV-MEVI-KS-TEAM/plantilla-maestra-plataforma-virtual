import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { esAdmin } from '@/lib/rol-staff'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Verificar que es ADMIN
    // El rol se lee con el service role (src/lib/rol-staff.ts). Leerlo con la
    // sesión lo dejaba sujeto a RLS: un fallo transitorio devolvía 403/404 a
    // un administrador legítimo, y al recargar funcionaba.

    if (!(await esAdmin(user.id))) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const { data: alumno, error: alumnoError } = await supabase
      .from('alumnos')
      .select('id')
      .eq('id', params.id)
      .single()

    if (alumnoError || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    // IVS: alumnos.id = auth.users.id
    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(
      (alumno as { id: string }).id,
      { password: newPassword }
    )

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
