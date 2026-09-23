import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guardián de las variables CSS de la paleta.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────────
 *
 * 🛑 Una variable CSS sin declarar NO se degrada a un color por defecto. La
 * propiedad se queda sin valor y el elemento **hereda la del padre**. El fallo
 * no se ve como «un tono raro»: se ve como texto del color equivocado, y cuando
 * el padre es un bloque de marca, como texto de marca sobre marca.
 *
 * Lo encontró AULA RAÍZ (#208), cuya landing usa `var(--color-acento-claro)`
 * sin fallback: el badge del nivel heredó el verde del menú y quedó en 3.53
 * sobre verde. `tsc` no dice nada —una variable CSS no es un símbolo—, el build
 * pasa, el smoke por HTTP pasa, y solo se ve mirando la pantalla.
 *
 * ── Qué comprueba ───────────────────────────────────────────────────────────
 *
 *   1. toda `var(--color-…)` SIN fallback está declarada en algún sitio de `src`
 *   2. toda `var(--color-…)` CON fallback también, para que el fallback sea una
 *      red de seguridad y no el valor que se ve siempre
 *
 * El punto 2 no es teórico: `alumno/pagar` pintaba su botón «Pagar en línea»
 * con `var(--color-texto-sobre-primario, #fff)` y sus tarjetas con
 * `var(--color-fondo-alt, #F8FAFC)`. Como ninguna de las dos se declaraba, esas
 * pantallas llevaban años usando el fallback: blanco fijo y un gris que no es
 * de ninguna escuela.
 *
 * ⚠️ Esta prueba corre igual en los ~144 clones: lee los archivos del repo, no
 * `CONFIG`. Si un cliente añade una variable a su landing y no la declara en
 * `layout.tsx`, se le pone la suite en rojo ANTES de entregar.
 */

const EXTENSIONES = ['.ts', '.tsx', '.css']

function archivosDe(dir: string): string[] {
  const salida: string[] = []
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) salida.push(...archivosDe(ruta))
    else if (EXTENSIONES.some(e => ruta.endsWith(e))) salida.push(ruta)
  }
  return salida
}

/**
 * Declaración: `--color-x:` en un CSS, o `'--color-x':` en el objeto de estilos
 * de un componente. Cubre las dos formas porque las dos declaran de verdad.
 */
const DECLARA = /(?:^|[\s{;'"])(--color-[a-z0-9-]+)\s*'?\s*:/gm
/** Uso: `var(--color-x)` o `var(--color-x, fallback)`. La coma los distingue. */
const USA = /var\(\s*(--color-[a-z0-9-]+)\s*(,)?/g

const ARCHIVOS = archivosDe('src')

const declaradas = new Set<string>()
const sinFallback = new Map<string, Set<string>>()
const conFallback = new Map<string, Set<string>>()

for (const ruta of ARCHIVOS) {
  const texto = readFileSync(ruta, 'utf8')
  for (const m of texto.matchAll(DECLARA)) declaradas.add(m[1])
  for (const m of texto.matchAll(USA)) {
    const donde = m[2] ? conFallback : sinFallback
    if (!donde.has(m[1])) donde.set(m[1], new Set())
    donde.get(m[1])!.add(ruta)
  }
}

/** Las huérfanas, con los archivos que las usan, para que el error sea accionable. */
function huerfanas(usos: Map<string, Set<string>>): string[] {
  return [...usos.entries()]
    .filter(([v]) => !declaradas.has(v))
    .map(([v, donde]) => `${v} ← ${[...donde].sort().join(', ')}`)
    .sort()
}

test('el escaneo encontró algo: si no, la prueba no está probando nada', () => {
  // Sin esto, mover `src/` o cambiar las extensiones dejaría dos pruebas verdes
  // que no miran ningún archivo.
  expect(ARCHIVOS.length).toBeGreaterThan(50)
  expect(declaradas.size).toBeGreaterThan(10)
  expect(sinFallback.size + conFallback.size).toBeGreaterThan(10)
})

test('toda variable de color usada SIN fallback está declarada', () => {
  // Estas son las que producen texto heredado del padre: el fallo invisible.
  expect(huerfanas(sinFallback)).toEqual([])
})

test('toda variable de color usada CON fallback está declarada', () => {
  // Un fallback que nunca se sustituye no es un fallback: es el valor real, y
  // es un valor que no sale de la paleta del cliente.
  expect(huerfanas(conFallback)).toEqual([])
})

test('las variables que inyecta layout.tsx cubren las que declara globals.css', () => {
  // `globals.css` trae un `:root` con la paleta de fábrica para que nada quede
  // sin pintar antes de la hidratación. Si declara una variable que `layout.tsx`
  // NO inyecta, esa variable se queda en el color de fábrica para siempre: el
  // cliente cambia su paleta y ese elemento no se mueve.
  const enRoot = new Set(
    [...readFileSync('src/app/globals.css', 'utf8').matchAll(DECLARA)].map(m => m[1]),
  )
  const enLayout = new Set(
    [...readFileSync('src/app/layout.tsx', 'utf8').matchAll(DECLARA)].map(m => m[1]),
  )
  expect([...enRoot].filter(v => !enLayout.has(v)).sort()).toEqual([])
})
