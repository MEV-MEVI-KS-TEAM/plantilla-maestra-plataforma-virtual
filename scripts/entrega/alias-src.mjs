/**
 * alias-src.mjs — deja que la entrega (Node puro, con el type stripping nativo)
 * cargue módulos de `src/` que importan con el alias `@/…` del tsconfig:
 * `@/lib/x` → `<raíz>/src/lib/x.ts` (o .tsx, .mjs, .js, /index.ts).
 *
 * Existe para que el documento use la MISMA fusión que la app
 * (`mergeSiteConfig` de src/lib/site-config-core.ts) sin copiarla ni tocar el
 * tsconfig de la app (D12, #201; decisión 19). `module.registerHooks` es
 * síncrono y está desde Node 23.5; la entrega ya exige 23.6.
 *
 * Importarlo ANTES de cualquier módulo de `src/` que use `@/`.
 */
import { registerHooks } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const EXTENSIONES = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts']

/** La URL del archivo de `src/` al que apunta `@/…`, o null si no es un alias o no existe. */
export function resolverAlias(especificador) {
  if (typeof especificador !== 'string' || !especificador.startsWith('@/')) return null
  const base = path.join(RAIZ, 'src', especificador.slice(2))
  for (const ext of EXTENSIONES) {
    const f = base + ext
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return pathToFileURL(f).href
  }
  return null
}

registerHooks({
  resolve(especificador, contexto, siguiente) {
    const url = resolverAlias(especificador)
    return url ? { url, shortCircuit: true } : siguiente(especificador, contexto)
  },
})
