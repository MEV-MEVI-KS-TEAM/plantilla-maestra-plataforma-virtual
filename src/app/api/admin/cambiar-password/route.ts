import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyStaff } from '@/lib/supabase/verify-admin'

// El PERSONAL (admin o secretario; D22a, decisión 6) cambia SU PROPIA
// contraseña — nunca la de otro: usa la sesión, no el service role. Antes era
// solo del admin, y el secretario únicamente podía cambiarla por
// /api/alumno/cambiar-password, sin estos endurecimientos; esa ruta ahora es
// solo de alumnos. Réplica de /api/alumno/cambiar-password
// con dos endurecimientos, porque esta es la cuenta que controla toda la
// escuela: mínimo 8 caracteres (el de alumno pide 6) y la nueva debe ser
// distinta de la actual. Igual que allá, se exige la contraseña actual
// reautenticando con signInWithPassword — sin SMTP configurado (ningún cliente
// MEV lo tiene) el "¿Olvidaste tu contraseña?" del login no entrega correos,
// así que esta pantalla es el único camino real de rotación.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Se requieren contraseña actual y nueva contraseña' }, { status: 400 })
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'La nueva contraseña debe ser distinta de la actual' }, { status: 400 })
    }

    // Verificar contraseña actual intentando re-autenticar
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
    }

    // Con el cliente de la PROPIA sesión — nunca admin.auth.admin.updateUserById:
    // este endpoint solo puede tocar la cuenta que lo llama.
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar la contraseña: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
