import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Soporte IVS 7-oct-2026 (PLAYBOOK Bugs 272 y 273).
 *
 * 1. «En documentos no aparece el acta de nacimiento»: el tipo existía en la
 *    API, en la etiqueta y en el expediente del admin, pero no en las listas
 *    que ve el alumno de secundaria y prepa.
 * 2. Lecciones cortadas en el primer apóstrofo (Bug 154) y explicaciones del
 *    quiz que nombran una opción distinta de su clave: el alumno contesta bien,
 *    ve ✓ y debajo «Only option D…». Estas pruebas leen los seeds tal cual.
 */

const raiz = process.cwd()
// LF siempre: con core.autocrlf=true los fuentes llegan con CRLF a Windows.
const leer = (p: string) =>
  readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')

const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const LIT = /'((?:[^']|'')*)'/g
const literales = (s: string) => [...s.matchAll(LIT)].map(m => m[1].replace(/''/g, "'"))

test('el alumno de secundaria y de prepa ve «Acta de nacimiento» en sus documentos', () => {
  const page = leer('src/app/(dashboard)/alumno/documentos/page.tsx')
  for (const lista of ['TIPOS_PREPA', 'TIPOS_SECUNDARIA']) {
    const ini = page.indexOf(`const ${lista}`)
    expect(ini, lista).toBeGreaterThan(-1)
    const abre = page.indexOf('= [', ini)   // salta el `DocTipo[]` del tipo
    const bloque = sinComentarios(page.slice(abre, page.indexOf(']', abre)))
    expect(bloque, lista).toContain("'acta_nacimiento'")
  }
  // y la API acepta el tipo que la pantalla ofrece
  expect(leer('src/app/api/alumno/documentos/route.ts')).toContain("'acta_nacimiento'")
})

test('ninguna lección del seed queda cortada en un apóstrofo', () => {
  const seed = leer('scripts/seed-contenido-semanas.sql')
  const cortadas: string[] = []
  const lineas = seed.split('\n').filter(l => l.startsWith('UPDATE semanas'))
  let revisadas = 0
  for (const linea of lineas) {
    const m = linea.match(/^UPDATE semanas SET contenido = '((?:[^']|'')*)' WHERE titulo = '((?:[^']|'')*)'/)
    if (!m) continue
    revisadas++
    const texto = m[1].replace(/''/g, "'")
    // Una cita que cierra («…es la paz.'») es legítima; un apóstrofo sin cierre de frase es el corte.
    if (/'$/.test(texto) && !/[.!?]'$/.test(texto)) cortadas.push(m[2].replace(/''/g, "'"))
  }
  // Si el formato del seed cambia, la prueba no puede quedar en verde sin revisar nada.
  expect(lineas.length).toBeGreaterThan(0)
  expect(revisadas).toBe(lineas.length)
  expect(cortadas).toEqual([])
})

test('ninguna explicación del quiz nombra una opción distinta de su clave', () => {
  const seed = leer('scripts/seed-quiz-semanal-universal.sql')
  const contradicen: string[] = []
  let filas = 0
  for (const linea of seed.split('\n')) {
    if (!/^\s*\(v_semana_id, '/.test(linea)) continue
    // (v_semana_id, pregunta, a, b, c, d, clave, orden, explicacion) — opcion_d puede faltar
    const lits = literales(linea)
    expect(lits.length, `fila del quiz sin parsear: ${linea.slice(0, 80)}`).toBeGreaterThanOrEqual(6)
    filas++
    const clave = lits[lits.length - 2].trim().toLowerCase()
    const explicacion = lits[lits.length - 1]
    // Letra MAYÚSCULA («option D», «opción B») o minúscula con paréntesis («inciso c)»):
    // así «la respuesta a la pregunta» o «la opción a seguir» no cuentan.
    const menciones = [
      ...explicacion.matchAll(/(?:[Oo]ption|[Oo]pci[oó]n|[Ii]nciso)\s+\(?([A-D])\)?(?![\wá-ú])/g),
      ...explicacion.matchAll(/(?:[Oo]ption|[Oo]pci[oó]n|[Ii]nciso)\s+([a-d])\)/g),
    ]
    for (const m of menciones) {
      if (m[1].toLowerCase() !== clave) contradicen.push(`${lits[0]} → clave ${clave}, explicación dice ${m[0]}`)
    }
  }
  expect(filas).toBeGreaterThan(0)
  expect(contradicen).toEqual([])
})
