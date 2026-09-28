import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Verifica que el usuario autenticado tiene rol ADMIN.
 * Retorna un NextResponse 403 si no lo es, o null si la verificación pasa.
 */
export async function verifyAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<NextResponse | null> {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single()

  if (!usuario || (usuario.rol as string | undefined)?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere rol ADMIN.' }, { status: 403 })
  }
  return null
}

/**
 * Verifica que el usuario autenticado es staff: rol ADMIN o SECRETARIO.
 * Para lo que hace el personal: altas de alumnos, «Marcar contactado», cobros,
 * abrir meses y constancias (Dec. 6 + D7b + D20b + D21a). Lo que sigue siendo
 * solo del administrador va con verifyAdmin.
 * Retorna un NextResponse 403 si no lo es, o null si la verificación pasa.
 */
export async function verifyStaff(
  supabase: SupabaseClient,
  userId: string
): Promise<NextResponse | null> {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single()

  const rol = (usuario?.rol as string | undefined)?.toUpperCase()
  if (!usuario || (rol !== 'ADMIN' && rol !== 'SECRETARIO')) {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere rol ADMIN o SECRETARIO.' }, { status: 403 })
  }
  return null
}

/**
 * Devuelve el rol normalizado (mayúsculas) del usuario, o null si no existe.
 * Útil para respuestas condicionales por rol (ej. ocultar notas internas).
 */
export async function getUserRol(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single()
  return (usuario?.rol as string | undefined)?.toUpperCase() ?? null
}
