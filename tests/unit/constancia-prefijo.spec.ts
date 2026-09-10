import { test, expect } from '@playwright/test'

/**
 * Prefijo del código de materia en la constancia (F2.8).
 *
 * La versión anterior tomaba la inicial de cada palabra del slug, lo que dejaba
 * los slugs de UNA palabra en una sola letra — y dos carreras del mismo cliente
 * con la misma inicial producían códigos IDÉNTICOS, que es justo lo que este
 * prefijo existe para evitar.
 *
 * Se replica aquí la función de src/app/api/alumno/constancia/route.ts: es
 * privada del route y el objetivo es fijar la REGLA, no importar el módulo (que
 * arrastra Supabase y `server-only`).
 */
function prefijoCodigo(nivel: string | null, carrera: string | null): string {
  if (nivel === 'preparatoria') return 'PREP'
  if (nivel === 'secundaria')   return 'SECU'
  if (nivel === 'demo')         return 'TUT'
  if (!carrera) return 'GEN'

  const palabras = carrera.split('-').filter(Boolean)
  if (palabras.length === 0) return 'GEN'
  const prefijo = palabras.length > 1
    ? palabras.map(p => p[0]).join('')
    : palabras[0].slice(0, 4)
  return prefijo.toUpperCase().slice(0, 4)
}

test('los niveles del programa conservan su prefijo de siempre', () => {
  expect(prefijoCodigo('preparatoria', null)).toBe('PREP')
  expect(prefijoCodigo('secundaria', null)).toBe('SECU')
  expect(prefijoCodigo('demo', null)).toBe('TUT')
  expect(prefijoCodigo('licenciatura', null)).toBe('GEN')
})

test('un slug de VARIAS palabras sigue dando sus iniciales (sin cambio)', () => {
  expect(prefijoCodigo('licenciatura', 'ingenieria-industrial')).toBe('II')
  expect(prefijoCodigo('licenciatura', 'ciencias-politicas')).toBe('CP')
  expect(prefijoCodigo('licenciatura', 'relaciones-internacionales')).toBe('RI')
})

test('un slug de UNA palabra ya no queda en una sola letra', () => {
  expect(prefijoCodigo('licenciatura', 'administracion')).toBe('ADMI')
  expect(prefijoCodigo('licenciatura', 'contaduria')).toBe('CONT')
  expect(prefijoCodigo('licenciatura', 'derecho')).toBe('DERE')
  expect(prefijoCodigo('licenciatura', 'criminologia')).toBe('CRIM')
})

test('dos carreras con la MISMA inicial ya no colisionan', () => {
  // Antes las dos daban 'C' y sus constancias eran indistinguibles.
  const a = prefijoCodigo('licenciatura', 'contaduria')
  const b = prefijoCodigo('licenciatura', 'criminologia')
  expect(a).not.toBe(b)
})

test('nunca pasa de 4 caracteres ni devuelve vacío', () => {
  for (const c of ['administracion', 'ingenieria-industrial', 'a-b-c-d-e-f', 'x', '', '-', null]) {
    const p = prefijoCodigo('licenciatura', c)
    expect(p.length).toBeGreaterThan(0)
    expect(p.length).toBeLessThanOrEqual(4)
  }
})
