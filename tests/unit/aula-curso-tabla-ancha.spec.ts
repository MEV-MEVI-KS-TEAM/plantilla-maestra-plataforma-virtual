import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Columna de la lección estirada a 375 px (Bug 303). Misma causa y mismo arreglo
 * en la columna de la semana de `/alumno/materia/[id]` (casos 6 y 7).
 *
 * El aula es `flex flex-col md:flex-row … items-start`. En columna (móvil),
 * `items-start` deja a cada hijo en fit-content y `min-w-0` no lo impide: sin
 * `w-full`, un `pre` de líneas largas o una tabla que no se puede comprimir más
 * estiraban la columna, y con ella todos los párrafos (ING-02, módulo 12, lección
 * 2: 1158 px, por un `pre` de 1113). Las envolturas que sí se desplazan nunca
 * llegaban a hacerlo, porque les cabía su contenido entero.
 *
 * Esta prueba lee el código: la config de `test:unit` no abre navegador, así que no
 * detecta todo lo que rompería la pantalla. Para medir de verdad, en /alumno/curso
 * el desborde se ve en `main.scrollWidth`, no en `document.body.scrollWidth`:
 * `<main>` tiene `overflow-y-auto`, que calcula `overflow-x: auto`, y body se queda
 * en 375. El registro del bug explica cómo se midió.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const AULA = 'src/components/cursos/AulaCurso.tsx'
const MARKDOWN = 'src/components/ContenidoMarkdown.tsx'

function clasesDeLaColumna() {
  const m = leer(AULA).match(/<div\b[^>]*\bref=\{leccionRef\}[^>]*\bclassName="([^"]*)"/)
  expect(m, 'no se encontró la columna de la lección (ref={leccionRef})').not.toBeNull()
  return m![1].split(/\s+/)
}

test('1. en móvil la columna de la lección ocupa el ancho del aula', () => {
  const clases = clasesDeLaColumna()
  expect(clases).toContain('w-full')
  // Nada que la devuelva a fit-content en algún ancho (`max-md:w-fit`, `md:w-…`).
  expect(clases.filter(c => /(^|:)w-/.test(c))).toEqual(['w-full'])
})

test('2. en escritorio la sigue mandando flex-1 y puede encogerse', () => {
  const clases = clasesDeLaColumna()
  // `flex: 1 1 0%`: en fila el `flex-basis` manda sobre `width`, así que w-full no
  // cambia nada desde md. Con `flex-none` o `basis-*`, sí se saldría de la fila.
  expect(clases).toContain('flex-1')
  expect(clases).toContain('min-w-0')
  expect(clases.filter(c => /(^|:)(flex-none|flex-auto|basis-|shrink-0|flex-shrink-0)/.test(c))).toEqual([])
})

test('3. una palabra o URL larga se parte dentro de la columna', () => {
  // Ya no ensancha la columna: sin esto se saldría de la tarjeta oscura hacia el
  // fondo claro, donde el texto casi no se ve.
  expect(clasesDeLaColumna()).toContain('break-words')
  // `anywhere` sí reduce el min-content: comprimiría las tablas en vez de desplazarlas.
  expect(leer(AULA)).not.toContain('overflow-wrap:anywhere')
})

test('4. la premisa sigue en pie: el aula apila en móvil y alinea al inicio', () => {
  // Si este contenedor cambia, hay que volver a medir a 375 px.
  const m = leer(AULA).match(/className="([^"]*)">\s*\{\/\* Columna izquierda: roadmap/)
  expect(m, 'no se encontró el contenedor de las dos columnas').not.toBeNull()
  const clases = m![1].split(/\s+/)
  expect(clases).toEqual(expect.arrayContaining(['flex', 'flex-col', 'md:flex-row']))
})

test('5. tablas y `pre` del Markdown conservan su propio desplazamiento', () => {
  const md = leer(MARKDOWN)
  const envoltura = md.match(/table: \(\{ children \}\) => \(\s*<div className="([^"]*)">\s*<table/)
  expect(envoltura, 'no se encontró la envoltura de las tablas').not.toBeNull()
  const clases = envoltura![1].split(/\s+/)
  expect(clases.some(c => c === 'overflow-x-auto' || c === 'overflow-x-scroll')).toBe(true)
  expect(clases.filter(c => /overflow-(x-)?(visible|hidden|clip)/.test(c))).toEqual([])
  // `.prose pre` ya trae overflow-x: auto de la tipografía; nadie debe quitárselo.
  expect(md).not.toMatch(/prose-pre:(overflow|whitespace)/)
})

const MATERIA = 'src/app/(dashboard)/alumno/materia/[id]/page.tsx'

function clasesDeLaColumnaDeSemana() {
  const m = leer(MATERIA).match(/Columna derecha: contenido de la semana[\s\S]*?\*\/\}\s*<div className="([^"]*)">/)
  expect(m, 'no se encontró la columna de la semana en la vista de materia').not.toBeNull()
  return m![1].split(/\s+/)
}

test('6. en la materia la columna de la semana lleva el mismo arreglo', () => {
  const clases = clasesDeLaColumnaDeSemana()
  expect(clases.filter(c => /(^|:)w-/.test(c))).toEqual(['w-full'])
  expect(clases).toEqual(expect.arrayContaining(['flex-1', 'min-w-0', 'break-words']))
  expect(clases.filter(c => /(^|:)(flex-none|flex-auto|basis-|shrink-0|flex-shrink-0)/.test(c))).toEqual([])
})

test('7. la premisa de la materia sigue en pie: apila en móvil', () => {
  const m = leer(MATERIA).match(/className="([^"]*)">\s*\{\/\* Columna izquierda: roadmap/)
  expect(m, 'no se encontró el contenedor de las dos columnas de la materia').not.toBeNull()
  expect(m![1].split(/\s+/)).toEqual(expect.arrayContaining(['flex', 'flex-col', 'md:flex-row']))
  expect(leer(MATERIA)).not.toContain('overflow-wrap:anywhere')
})
