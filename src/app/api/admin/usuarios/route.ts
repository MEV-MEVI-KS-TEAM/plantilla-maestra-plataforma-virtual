import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'

// Roles de staff que gestiona esta pantalla (convención BD: minúsculas)
const ROLES_STAFF = ['admin', 'secretario'] as const

/**
 * GET /api/admin/usuarios
 * Lista las cuentas de staff (admin + secretario). SOLO ADMIN.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()
    const { data: usuarios, error } = await admin
      .from('usuarios')
      .select('id, nombre, apellidos, email, rol, created_at')
      .in('rol', [...ROLES_STAFF])
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ usuarios: usuarios ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/usuarios]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * POST /api/admin/usuarios
 * Crea una cuenta de staff (admin o secretario). SOLO ADMIN — un secretario
 * recibe 403 aunque llame directo a la API.
 * Body: { nombre, apellidos?, email, password?, rol }
 * Si no se envía password, se genera una temporal y se devuelve UNA vez.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const body = await request.json()
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    const apellidos = typeof body.apellidos === 'string' ? body.apellidos.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const rol = typeof body.rol === 'string' ? body.rol.trim().toLowerCase() : ''

    if (!nombre) return NextResponse.json({ error: 'El campo nombre es requerido' }, { status: 400 })
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!ROLES_STAFF.includes(rol as typeof ROLES_STAFF[number])) {
      return NextResponse.json({ error: `Rol inválido. Usa: ${ROLES_STAFF.join(', ')}` }, { status: 400 })
    }

    // Password: la del form, o una temporal generada que se muestra una sola vez
    let password = typeof body.password === 'string' ? body.password : ''
    let passwordTemporal: string | null = null
    if (!password) {
      passwordTemporal = randomBytes(9).toString('base64url')
      password = passwordTemporal
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Crear en Supabase Auth (SERVICE_ROLE, solo servidor)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, rol },
    })

    if (authError) {
      if (authError.message.includes('already')) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const newUserId = authData.user.id

    // Upsert en usuarios — el trigger handle_new_user puede haberla creado ya;
    // el upsert garantiza rol/nombre/apellidos correctos.
    const { error: usuarioError } = await admin
      .from('usuarios')
      .upsert(
        { id: newUserId, nombre, apellidos, email, rol },
        { onConflict: 'id' }
      )

    if (usuarioError) {
      await admin.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: usuarioError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      usuario: { id: newUserId, nombre, apellidos, email, rol },
      password_temporal: passwordTemporal,
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/usuarios]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
