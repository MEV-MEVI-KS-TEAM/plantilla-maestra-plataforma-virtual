import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Bloque D · D1 — la «Última actualización» de los Términos sigue al texto.
 *
 * #208 cambió la política de reembolsos (excepción del pago único) y la página
 * seguía diciendo «11 de mayo de 2025». La fecha es la del último cambio del
 * TEXTO del contrato; el aviso de privacidad tiene su propia constante y no
 * cambió (decisión 14).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('Términos: la fecha es la del cambio de #208 y se sigue pintando', () => {
  const t = sinComentarios(leer('src/app/(legal)/terminos-y-condiciones/page.tsx'))
  expect(t).toContain("const FECHA_VIGENCIA = '26 de septiembre de 2026'")
  expect(t).toContain('Última actualización: {FECHA_VIGENCIA}')
  expect(t).not.toContain('11 de mayo de 2025')
})

test('Términos: el pago único deja de ser reembolsable cuando se ACTIVA el acceso, no al asignar', () => {
  const t = sinComentarios(leer('src/app/(legal)/terminos-y-condiciones/page.tsx')).replace(/\s+/g, ' ')
  expect(t).toContain('dan acceso completo a todo su contenido en cuanto se activa su acceso y no son reembolsables una vez dado ese acceso')
  expect(t).not.toContain('en cuanto se asignan al alumno')
  // Lo demás de la viñeta, igual.
  expect(t).toContain('Mientras el acceso no se haya activado, aplica la cancelación antes del inicio.')
})

test('el aviso de privacidad no se toca en D1', () => {
  expect(leer('src/app/(legal)/aviso-de-privacidad/page.tsx')).toContain("const FECHA_VIGENCIA = '11 de mayo de 2025'")
})
