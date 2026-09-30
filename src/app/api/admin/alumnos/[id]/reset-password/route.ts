import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Verificar que es ADMIN
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!usuario || (usuario.rol as string | undefined)?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // #187: SOLO cuentas de alumno. Antes bastaba con una fila en `alumnos`, y
    // un admin ascendido desde alumno (o una fila fabricada por PostgREST) la
    // tiene: cualquier admin le ponía contraseña y entraba como él. Sobre
    // personal o sobre uno mismo → 403 (la propia se cambia en «Mi cuenta»).
    const admin = createAdminClient()
    const objetivo = await cargarAlumnoObjetivo(admin, params.id, user.id)
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    // IVS: alumnos.id = auth.users.id
    const { error: updateError } = await admin.auth.admin.updateUserById(
      objetivo.alumno.id,
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
