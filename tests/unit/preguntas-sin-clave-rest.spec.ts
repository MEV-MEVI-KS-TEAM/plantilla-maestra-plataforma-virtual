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
  const src = leer('src/app/api/alumno/evaluacion/[id]/enviar/route.ts')
  expect(src).toMatch(/createAdminClient\(\)\s*\.from\('preguntas'\)/)
})

for (const archivo of ['supabase/migrations/20260924140000_preguntas_sin_clave_rest.sql', 'supabase/schema.sql', 'scripts/schema.sql']) {
  test(`${archivo}: revoca SELECT de tabla y re-otorga sin respuesta_correcta`, () => {
    const sql = leer(archivo)
    expect(sql).toContain("REVOKE SELECT ON public.preguntas FROM anon, authenticated")
    expect(sql).toContain("column_name <> 'respuesta_correcta'")
  })
}
