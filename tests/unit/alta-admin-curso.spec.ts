import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getOpcionesNivel, getOpcionesNivelAdmin, esOpcionCurso } from '@/lib/niveles'

/**
 * El alumno de CURSO tiene que poder darse de alta por las DOS puertas.
 *
 * ⚠️ POR QUÉ EXISTEN ESTAS PRUEBAS. La escuela crea sus cursos en
 * /admin/cursos y después no los encuentra al registrar alumnos. Seis clientes
 * lo reportaron —Edunova e IMN el 25-ago, SIE el 27-ago, Instituto 10 de Agosto
 * el 31-ago, Fili Cano el 4-sep y My Way el 10-sep— y las tres veces que se
 * arregló, se arregló en el clon del cliente y nunca subió aquí.
 *
 * El invariante que se clava: **si hay cursos publicados, la opción existe en
 * el registro público Y en el alta del admin, y el alta los inscribe de
 * verdad**. Si alguien vuelve a fijar el flag a `false` o a escribir las
 * opciones a mano en un <select>, esto se pone rojo.
 */

const raiz = process.cwd()
const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const paginaAlta = sinComentarios(
  readFileSync(join(raiz, 'src/app/(dashboard)/admin/alumnos/page.tsx'), 'utf8'),
)
const apiAlta = sinComentarios(
  readFileSync(join(raiz, 'src/app/api/admin/alumnos/route.ts'), 'utf8'),
)

// ─── La opción existe en las dos puertas ─────────────────────────────────────

test('con cursos publicados, la opción de curso aparece en el REGISTRO PÚBLICO', () => {
  const valores = getOpcionesNivel(true).map(o => o.value)
  expect(valores.some(esOpcionCurso)).toBe(true)
})

test('con cursos publicados, la opción de curso aparece en el ALTA DEL ADMIN', () => {
  const valores = getOpcionesNivelAdmin(true).map(o => o.value)
  expect(valores.some(esOpcionCurso)).toBe(true)
})

test('sin cursos publicados NO se ofrece, o el admin llega a un selector vacío', () => {
  expect(getOpcionesNivelAdmin(false).map(o => o.value).some(esOpcionCurso)).toBe(false)
  expect(getOpcionesNivel(false).map(o => o.value).some(esOpcionCurso)).toBe(false)
})

test('la opción de curso persiste nivel "diplomado" y pide el campo curso', () => {
  const opcion = getOpcionesNivelAdmin(true).find(o => esOpcionCurso(o.value))!
  expect(opcion.nivel).toBe('diplomado')
  expect(opcion.campos).toContain('curso')
})

// ─── La pantalla del admin no puede volver a quedarse ciega ──────────────────

test('el alta del admin consulta el catálogo real, no una lista del config', () => {
  expect(paginaAlta).toContain('/api/catalogo-publico')
})

test('el alta del admin pasa el flag de cursos publicados a las opciones', () => {
  // `getOpcionesNivelAdmin()` sin argumento vuelve al bug: el default es false.
  expect(paginaAlta).toMatch(/getOpcionesNivelAdmin\(\s*cursos\.length\s*>\s*0\s*\)/)
  expect(paginaAlta).not.toMatch(/getOpcionesNivelAdmin\(\s*\)/)
})

test('el desplegable de nivel no trae opciones escritas a mano', () => {
  // Regla del encabezado de src/lib/niveles.ts: 🛑 nada de <option> a mano.
  for (const nivel of ['secundaria', 'preparatoria', 'licenciatura']) {
    expect(paginaAlta).not.toContain(`<option value="${nivel}"`)
  }
})

// ─── El alta inscribe de verdad ──────────────────────────────────────────────

test('el API acepta cursos_ids en el alta', () => {
  expect(apiAlta).toContain('cursos_ids')
})

test('el API valida los cursos contra los PUBLICADOS antes de inscribir', () => {
  expect(apiAlta).toMatch(/from\('cursos'\)[\s\S]{0,200}estado'?\s*,\s*'publicado'/)
})

test('el API inscribe en curso_inscripciones DENTRO del POST', () => {
  // `curso_inscripciones` ya se leía en el GET para derivar «curso activado»:
  // buscarlo en todo el archivo daría positivo sin que el alta inscriba nada.
  const post = apiAlta.slice(apiAlta.indexOf('export async function POST'))
  expect(post).toContain("from('curso_inscripciones')")
  expect(post).toMatch(/curso_inscripciones'\)[\s\S]{0,120}\.insert\(/)
})

test('un alta de curso sin curso seleccionado se rechaza antes de crear el usuario', () => {
  const iRechazo = apiAlta.indexOf('Selecciona al menos un curso')
  const iAuth    = apiAlta.indexOf('auth.admin.createUser')
  expect(iRechazo).toBeGreaterThan(-1)
  expect(iRechazo).toBeLessThan(iAuth)
})

test('un alumno de curso NO se lleva una modalidad del programa escolar', () => {
  // `duracion_meses` es GENERATED a partir de la modalidad: darle la de por
  // defecto le fabrica «0 de 3 meses» de un plan que no cursa (Bug 94).
  expect(apiAlta).toMatch(/nivelElegido\s*===\s*'diplomado'\s*\)\s*\n?\s*\?\s*null/)
})
