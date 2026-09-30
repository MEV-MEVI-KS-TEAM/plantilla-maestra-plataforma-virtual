/**
 * Arnés de rutas (#187) — carga los route.ts REALES de src/app/api en Node puro
 * (type stripping nativo, Node ≥ 23.6) con el alias `@/…` y sustituye solo lo
 * que necesita un servidor de Next o un Supabase de verdad:
 *
 *   @/lib/supabase/server  → cliente de la SESIÓN del escenario (supabase-falso.mjs)
 *   @/lib/supabase/admin   → cliente de SERVICIO del escenario
 *   next/headers, next/cache, server-only → vacíos
 *   next/server            → el de verdad (next/server.js)
 *
 * Lo demás (verifyAdmin/verifyStaff, lib/alumno-patch, las reglas puras…) es el
 * código de la app tal cual. Importarlo ANTES de cualquier route.ts.
 */
import { registerHooks } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// ARNES_RAIZ permite correr la MISMA matriz contra otro árbol (p. ej. main, para
// el «antes» de un arreglo). Por defecto, el repo donde vive el arnés.
export const RAIZ = process.env.ARNES_RAIZ
  ? path.resolve(process.env.ARNES_RAIZ)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const EXTENSIONES = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts']

const STUBS = {
  '@/lib/supabase/server': 'export async function createClient() { return globalThis.__arnes.clienteSesion() }\n',
  '@/lib/supabase/admin': 'export function createAdminClient() { return globalThis.__arnes.clienteServicio() }\n',
  // Hay rutas que arman su propio cliente de servicio con supabase-js.
  '@supabase/supabase-js': 'export function createClient() { return globalThis.__arnes.clienteServicio() }\n',
  'server-only': 'export {}\n',
  'next/headers':
    'export function cookies() { return { get() { return undefined }, getAll() { return [] }, set() {} } }\n' +
    'export function headers() { return new Headers() }\n',
  'next/cache':
    'export function revalidatePath() {}\nexport function revalidateTag() {}\n' +
    'export function unstable_cache(fn) { return fn }\nexport function unstable_noStore() {}\n',
}

function resolverAlias(especificador) {
  const base = path.join(RAIZ, 'src', especificador.slice(2))
  for (const ext of EXTENSIONES) {
    const f = base + ext
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return pathToFileURL(f).href
  }
  return null
}

registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (Object.prototype.hasOwnProperty.call(STUBS, especificador)) {
      return { url: `arnes:${especificador}`, shortCircuit: true }
    }
    if (especificador === 'next/server') return siguiente('next/server.js', contexto)
    if (especificador.startsWith('@/')) {
      const url = resolverAlias(especificador)
      if (url) return { url, shortCircuit: true }
    }
    // Importes relativos sin extensión dentro de src/ (TypeScript los permite).
    if (especificador.startsWith('.') && contexto.parentURL?.startsWith('file:') && path.extname(especificador) === '') {
      const base = path.resolve(path.dirname(fileURLToPath(contexto.parentURL)), especificador)
      for (const ext of EXTENSIONES.slice(1)) {
        const f = base + ext
        if (fs.existsSync(f) && fs.statSync(f).isFile()) return { url: pathToFileURL(f).href, shortCircuit: true }
      }
    }
    return siguiente(especificador, contexto)
  },
  load(url, contexto, siguiente) {
    if (url.startsWith('arnes:')) {
      return { format: 'module', source: STUBS[url.slice('arnes:'.length)], shortCircuit: true }
    }
    // El package.json no declara "type": los .ts de src/ son ESM con tipos.
    if (url.startsWith('file:') && url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return siguiente(url, { ...contexto, format: 'module-typescript' })
    }
    return siguiente(url, contexto)
  },
})
