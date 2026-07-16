import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Env (Playwright no carga .env.local; lo parseamos a mano) ──
function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) out[m[1]] = m[2]
    }
  } catch { /* usar process.env */ }
  return out
}

const env = loadEnv()
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
export const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
export const REF = SUPABASE_URL.replace(/^https:\/\//, '').split('.')[0]

// Credenciales/datos de QA POR CLIENTE — se configuran por variables de entorno
// (en .env.local o el entorno de CI). Nada de datos de un cliente concreto aquí.
//   QA_ALUMNO_EMAIL / QA_ALUMNO_PASSWORD → alumno de prueba (login real por UI)
//   QA_ADMIN_EMAIL                       → admin del cliente (sesión acuñada sin password)
//   QA_DIPLOMA_NOMBRE                    → nombre del curso demo que crea/consume la suite
export const ALUMNO_EMAIL = env.QA_ALUMNO_EMAIL || process.env.QA_ALUMNO_EMAIL || ''
export const ALUMNO_PASSWORD = env.QA_ALUMNO_PASSWORD || process.env.QA_ALUMNO_PASSWORD || ''
export const ADMIN_EMAIL = env.QA_ADMIN_EMAIL || process.env.QA_ADMIN_EMAIL || ''
export const DIPLOMA_NOMBRE = env.QA_DIPLOMA_NOMBRE || process.env.QA_DIPLOMA_NOMBRE || 'Diplomado de prueba (QA)'

export function svc(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Acuña una sesión (sin contraseña) vía generateLink + verifyOtp. */
export async function mintSession(email: string) {
  const s = svc()
  const { data: link, error: le } = await s.auth.admin.generateLink({ type: 'magiclink', email })
  if (le || !link?.properties?.hashed_token) throw new Error('generateLink: ' + (le?.message ?? 'sin token'))
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await anon.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (error || !data?.session) throw new Error('verifyOtp: ' + (error?.message ?? 'sin sesión'))
  return data.session
}

/** Construye un storageState de Playwright con la cookie de @supabase/ssr. */
export function storageStateFromSession(session: unknown) {
  const value = 'base64-' + Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  const name = `sb-${REF}-auth-token`
  const CHUNK = 3180
  const pairs: [string, string][] = value.length <= CHUNK
    ? [[name, value]]
    : (() => { const out: [string, string][] = []; let i = 0, rest = value; while (rest.length) { out.push([`${name}.${i}`, rest.slice(0, CHUNK)]); rest = rest.slice(CHUNK); i++ } return out })()
  return {
    cookies: pairs.map(([n, v]) => ({
      name: n, value: v, domain: 'localhost', path: '/',
      expires: Math.floor(Date.now() / 1000) + 3600, httpOnly: false, secure: false, sameSite: 'Lax' as const,
    })),
    origins: [],
  }
}
