/**
 * Bug B1 (nov-2026): los quizzes (645cc40) y los exámenes (37ae4ac) se escribieron
 * para otro temario. Hoy estos dos seeds se GENERAN desde banco-materias-sec-prepa,
 * donde `scripts/validar_cobertura.py` revisa que cada reactivo corresponda a su semana.
 * Esta prueba cuida que nadie los edite a mano ni cambie su forma.
 */
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const leer = (ruta: string) => readFileSync(join(process.cwd(), ruta), 'utf8')

test('el seed de quizzes viene del banco y trae 576 filas repartidas por materia', () => {
  const seed = leer('scripts/seed-quiz-semanal-universal.sql')
  expect(seed).toContain('GENERADO desde banco-materias-sec-prepa')
  expect(seed.match(/^\s*\(v_semana_id, '/gm)?.length).toBe(576)
  // Cada bloque: materia + nivel + semana, igual que antes.
  expect(seed.match(/AND s\.numero_semana = \d+/g)?.length).toBe(192)
  // Una sola clave por fila; ninguna materia se carga a una letra.
  const claves = [...seed.matchAll(/, '([abcd])', [123], '/g)].map(m => m[1])
  expect(claves.length).toBe(576)
  for (const letra of 'abcd') expect(claves.filter(c => c === letra).length).toBe(144)
})

test('el seed de exámenes viene del banco: 10 por materia, más las 25 del demo', () => {
  const seed = leer('scripts/seed-preguntas-evaluaciones-universal.sql')
  expect(seed).toContain('GENERADO desde banco-materias-sec-prepa')
  expect(seed.match(/^INSERT INTO preguntas/gm)?.length).toBe(265)
  const porMateria = new Map<string, number>()
  for (const m of seed.matchAll(/WHERE m\.nombre = '((?:[^']|'')*)'/g)) {
    porMateria.set(m[1], (porMateria.get(m[1]) ?? 0) + 1)
  }
  expect(porMateria.size).toBe(25)
  for (const [materia, n] of porMateria) expect(n, materia).toBe(materia === 'Tutoría de Ingreso I' ? 25 : 10)
})

test('la semana 8 ya no es un texto compartido entre materias', () => {
  const seed = leer('scripts/seed-contenido-semanas.sql')
  const guias = new Set<string>()
  let filas = 0
  for (const m of seed.matchAll(/UPDATE semanas SET contenido = '((?:[^']|'')*)'\s*WHERE titulo = 'Repaso general y preparación para examen final'/g)) {
    guias.add(m[1])
    filas++
  }
  expect(filas).toBe(25) // 24 materias + demo
  expect(guias.size).toBe(25)
})
