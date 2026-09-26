import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { exigeCursoEnRegistro } from '@/lib/registro-reglas'
import { nivelForzadoDeRegistro } from '@/lib/modo'

/**
 * #213 — en solo_cursos nadie podía registrarse: el servidor fuerza
 * nivel='diplomado' (B7) y desde 9dbb819 exigía diplomado_id a todo nivel
 * 'diplomado', pero el formulario de solo_cursos no tiene selector de curso.
 * Respuesta: 400 después de signUp(), con la cuenta de Auth ya creada.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

test('solo_cursos (nivel forzado) no exige elegir curso', () => {
  expect(exigeCursoEnRegistro('diplomado', 'diplomado')).toBe(false)
})

test('tradicional con «Curso o diplomado» sí lo exige; los demás niveles no', () => {
  expect(exigeCursoEnRegistro('diplomado', null)).toBe(true)
  for (const nivel of ['secundaria', 'preparatoria', 'licenciatura', null]) {
    expect(exigeCursoEnRegistro(nivel, null), String(nivel)).toBe(false)
  }
})

test('en tradicional (el default de la plantilla) la regla queda como antes', () => {
  // nivelForzadoDeRegistro() es null en tradicional: el servidor exige el curso
  // exactamente en el mismo caso que antes del arreglo (nivel === 'diplomado').
  expect(nivelForzadoDeRegistro()).toBeNull()
  expect(exigeCursoEnRegistro('diplomado', nivelForzadoDeRegistro())).toBe(true)
})

test('el servidor usa la regla y el curso, si llega, se sigue validando contra los publicados', () => {
  const src = sinComentarios(leer('src/app/api/auth/register-complete/route.ts'))
  expect(src).toContain("if (exigeCursoEnRegistro(nivel, nivelForzado) && !(typeof body.diplomado_id === 'string' && body.diplomado_id))")
  // La guarda vieja, que no distinguía el nivel forzado, no vuelve.
  expect(src).not.toMatch(/if \(nivel === 'diplomado' && !\(typeof body\.diplomado_id/)
  // Un diplomado_id que llegue (curl en solo_cursos incluido) solo inscribe si está publicado.
  expect(src).toMatch(/\.eq\('id', body\.diplomado_id\)\s*\.eq\('estado', 'publicado'\)/)
})
