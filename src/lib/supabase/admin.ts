import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      `Missing Supabase env vars: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Sin esto el Data Cache de Next guarda la primera respuesta (p. ej. el
    // catálogo vacío antes de publicar cursos) y la sirve aunque la base cambie
    // (EDUHCO #197, LKA #202, LION #204). El service role nunca se cachea.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}
