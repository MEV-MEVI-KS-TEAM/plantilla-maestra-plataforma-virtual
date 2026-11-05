/**
 * Lo que el arnés necesita, además de hooks.mjs, para pintar páginas: compila los .tsx
 * con TypeScript y sustituye lo que solo existe dentro de Next. El resto (las páginas y
 * los componentes) es el código de la app tal cual, con React de verdad.
 *
 *   next/font/google  → clases vacías (descargaría fuentes)
 *   next/navigation   → un router que no hace nada
 *   next/link, next/image → <a> y <img> (solo importa el texto)
 *   gsap y @gsap/react → nada (son efectos del navegador)
 *   *.css             → vacío
 *   react             → el de verdad, con `useState` sembrable: renderToStaticMarkup no
 *                       corre efectos, así que sin esto una página que carga por fetch
 *                       nunca pasaría del «Cargando…». `globalThis.__estados` es la lista
 *                       de valores iniciales, en el orden en que la página llama a useState.
 */
import { registerHooks, createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { RAIZ } from './hooks.mjs'

const requerir = createRequire(path.join(RAIZ, 'package.json'))
const REACT_CJS = requerir.resolve('react')
const REACT_REAL = pathToFileURL(REACT_CJS).href
const CLAVES_REACT = Object.keys(requerir('react')).filter((k) => /^[A-Za-z_]+$/.test(k) && k !== 'useState' && k !== 'default')

// Las fuentes que usa la app: una nueva da un error claro de import, no un falso verde.
const FUENTES = ['Playfair_Display', 'DM_Sans', 'Manrope']
const FONT = `const fuente = () => ({ className: '', variable: '', style: {} })\n${FUENTES.map((n) => `export const ${n} = fuente`).join('\n')}\n`

const STUBS = {
  'next/font/google': FONT,
  'next/navigation':
    'const router = { push() {}, replace() {}, refresh() {}, back() {}, prefetch() {} }\n' +
    'export function useRouter() { return router }\n' +
    "export function usePathname() { return '/' }\n" +
    'export function useSearchParams() { return new URLSearchParams() }\n' +
    'export function redirect() {}\n',
  'next/link':
    "import { createElement } from 'react'\n" +
    'export default function Link({ href, children, prefetch, replace, scroll, shallow, ...resto }) {\n' +
    "  return createElement('a', { href: String(href), ...resto }, children)\n" +
    '}\n',
  'next/image':
    "import { createElement } from 'react'\n" +
    'export default function Image({ src, alt, priority, fill, quality, placeholder, blurDataURL, loader, unoptimized, ...resto }) {\n' +
    "  return createElement('img', { src: String(src), alt, ...resto })\n" +
    '}\n',
  'next/dynamic': "export default function dynamic() { return () => null }\n",
  gsap:
    'const g = new Proxy(function () {}, { get: () => g, apply: () => g })\n' +
    'export default g\nexport const gsap = g\n',
  '@gsap/react': 'export function useGSAP() { return { context: () => {}, contextSafe: (f) => f } }\n',
  'gsap/ScrollTrigger': 'export const ScrollTrigger = {}\n',
  'gsap/SplitText': 'export const SplitText = {}\n',
  react:
    `import real from ${JSON.stringify(REACT_REAL + '?real')}\n` +
    'export default real\n' +
    CLAVES_REACT.map((k) => `export const ${k} = real.${k}`).join('\n') +
    '\nexport function useState(inicial) {\n' +
    '  const lista = globalThis.__estados\n' +
    '  if (lista && lista.length) return real.useState(lista.shift())\n' +
    '  return real.useState(inicial)\n' +
    '}\n',
}

registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (Object.prototype.hasOwnProperty.call(STUBS, especificador)) {
      return { url: `portal:${especificador}`, shortCircuit: true }
    }
    if (especificador.endsWith('.css')) return { url: 'portal:css', shortCircuit: true }
    return siguiente(especificador, contexto)
  },
  load(url, contexto, siguiente) {
    if (url === 'portal:css') return { format: 'module', source: 'export default {}\n', shortCircuit: true }
    if (url.startsWith('portal:')) return { format: 'module', source: STUBS[url.slice('portal:'.length)], shortCircuit: true }
    if (url === REACT_REAL + '?real') {
      return { format: 'module', source: `import { createRequire } from 'node:module'\nexport default createRequire(${JSON.stringify(pathToFileURL(path.join(RAIZ, 'package.json')).href)})('react')\n`, shortCircuit: true }
    }
    if (url.startsWith('file:') && url.endsWith('.tsx')) {
      const archivo = fileURLToPath(url)
      const { outputText } = ts.transpileModule(fs.readFileSync(archivo, 'utf8'), {
        fileName: archivo,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          verbatimModuleSyntax: false,
        },
      })
      return { format: 'module', source: outputText, shortCircuit: true }
    }
    return siguiente(url, contexto)
  },
})
