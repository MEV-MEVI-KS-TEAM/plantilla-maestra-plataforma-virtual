import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * El nombre de la escuela se escribe como la escuela lo escribe. Login,
 * registro y el PDF de entrega lo pasaban por toUpperCase(): «OCEA Academy»
 * salía «OCEA ACADEMY», contra la grafía que el cliente aprobó (OCEA #297).
 * Las versalitas, si una escuela las quiere, son decisión de su logo.
 */
const ARCHIVOS = [
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'scripts/entrega/documento.mjs',
]

test('guardián: ni el login, ni el registro, ni el PDF de entrega ponen el nombre en MAYÚSCULAS', () => {
  for (const f of ARCHIVOS) {
    const s = readFileSync(join(process.cwd(), f), 'utf8')
    expect(s, f).not.toMatch(/nombre(Completo)?\s*\.\s*toUpperCase\s*\(/)
  }
})
