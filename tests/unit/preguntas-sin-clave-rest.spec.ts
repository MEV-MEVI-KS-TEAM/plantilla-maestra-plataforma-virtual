import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

// Bug 221: la clave del examen mensual no se lee con la sesión del alumno.
const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')

test('el GET del examen no pide respuesta_correcta', () => {
  const src = leer('src/app/api/alumno/evaluacion/[id]/route.ts')
  expect(src).not.toMatch(/from\('preguntas'\)[\s\S]{0,120}respuesta_correcta/)
})

test('el envío califica leyendo preguntas con service_role', () => {
  // D22d-1: por lib/evaluaciones/examen-mensual, con el cliente admin de la ruta.
  const src = leer('src/app/api/alumno/evaluacion/[id]/enviar/route.ts')
  expect(src).toContain('const admin = createAdminClient()')
  expect(src).toContain('leerPreguntasEvaluacion(admin, params.id, { soloActivas: false })')
  expect(src).not.toMatch(/supabase\s*\.from\('preguntas'\)/)
  expect(leer('src/lib/evaluaciones/examen-mensual.ts')).toMatch(/admin\s*\.from\('preguntas'\)/)
})

// La migración de #186 no se toca: es la historia de MEDERI (D22d la corre encima).
test('la migración de #186: revoca SELECT de tabla y re-otorga sin respuesta_correcta', () => {
  const sql = leer('supabase/migrations/20260924140000_preguntas_sin_clave_rest.sql')
  expect(sql).toContain("REVOKE SELECT ON public.preguntas FROM anon, authenticated")
  expect(sql).toContain("column_name <> 'respuesta_correcta'")
})

// D22d: los schemas ya no llevan el bloque de #186 sino la LISTA BLANCA estática
// (K-d5): tampoco sale una columna nueva ni, en quiz_semana, la explicación.
for (const archivo of ['supabase/schema.sql', 'scripts/schema.sql']) {
  test(`${archivo}: revoca SELECT de tabla y re-otorga por lista blanca, sin la clave`, () => {
    const sql = leer(archivo).replace(/\r\n/g, '\n')
    expect(sql).toContain('REVOKE SELECT ON public.preguntas FROM authenticated;')
    expect(sql).toContain('REVOKE ALL    ON public.preguntas FROM anon, PUBLIC;')
    const grant = sql.match(/GRANT\s+SELECT \(([^)]*)\)\s+ON public\.preguntas TO authenticated;/)
    expect(grant).not.toBeNull()
    expect(grant![1].split(/,\s*/)).toEqual(['id', 'evaluacion_id', 'pregunta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'orden', 'activa', 'created_at'])
    expect(sql).not.toContain("column_name <> 'respuesta_correcta'")
  })
}
