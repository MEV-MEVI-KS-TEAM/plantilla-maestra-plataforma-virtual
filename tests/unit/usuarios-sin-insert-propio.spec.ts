import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

// Bug 220: nadie inserta su propia fila en usuarios (sería rol='admin' a voluntad).
const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')

for (const archivo of ['supabase/schema.sql', 'scripts/schema.sql',
                       'supabase/migrations/20260924120000_usuarios_sin_insert_propio.sql']) {
  test(`${archivo}: sin INSERT propio en usuarios ni documentos_alumno`, () => {
    const sql = leer(archivo)
    expect(sql).toContain('REVOKE INSERT ON public.usuarios FROM anon, authenticated')
    expect(sql).toContain('REVOKE INSERT ON public.documentos_alumno FROM anon, authenticated')
    const pol = sql.match(/CREATE POLICY "usuarios: admin puede insertar"[\s\S]*?;/)?.[0] ?? ''
    expect(pol).toContain('es_admin()')
    expect(pol).not.toContain('auth.uid()')
  })
}

test('las escrituras de usuarios y documentos_alumno van con service_role', () => {
  for (const r of ['src/app/api/auth/register-complete/route.ts', 'src/app/api/alumno/documentos/route.ts']) {
    expect(leer(r), r).toContain('createAdminClient')
  }
})
