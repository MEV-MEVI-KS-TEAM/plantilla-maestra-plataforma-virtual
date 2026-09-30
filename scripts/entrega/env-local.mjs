/**
 * El `.env.local` de la entrega: UNA lectura para todo el generador.
 *
 * 🐞 #197: el inventario ya usaba `leerEnvLocal()`, pero la página de
 * Infraestructura seguía con su propia regex (`urlSupabaseDesdeEnv`), anclada
 * con `^` y sin quitar el BOM: con un `.env.local` guardado con BOM y la URL en
 * la primera línea, el documento salía sin el proyecto de Supabase. Ahora las
 * dos salen de aquí.
 *
 * Tolera CRLF (Windows), BOM, espacios y comillas alrededor del valor.
 *
 * `ENTREGA_ENV_LOCAL=<archivo>` lee otro archivo en vez de `<repo>/.env.local`:
 * lo usan las pruebas para no escribir en el repo.
 */
import fs from 'node:fs'
import path from 'node:path'

export function rutaEnvLocal(raiz) {
  return process.env.ENTREGA_ENV_LOCAL || path.join(raiz, '.env.local')
}

/** Las variables del `.env.local`, o `null` si no existe. */
export function leerEnvLocal(raiz) {
  const env = rutaEnvLocal(raiz)
  if (!fs.existsSync(env)) return null
  return Object.fromEntries(fs.readFileSync(env, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)
    // Un CR de más (\r\r\n, o un \r suelto al final) no tumba la línea.
    .map(l => l.replace(/\r+$/, '').match(/^\s*([A-Z0-9_]+)\s*=(.*)$/)).filter(Boolean)
    .map(m => [m[1], m[2].trim().replace(/^["']|["']$/g, '')]))
}

/** `NEXT_PUBLIC_SUPABASE_URL` del `.env.local`, o `''`. */
export function urlSupabaseDesdeEnv(raiz) {
  return String(leerEnvLocal(raiz)?.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
}
