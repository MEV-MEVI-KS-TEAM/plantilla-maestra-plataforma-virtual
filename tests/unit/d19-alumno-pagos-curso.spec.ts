import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resumenPagosCurso } from '@/lib/cursos/pagos-alumno'

/**
 * Bloque D · D19 — #207-8, el lado del alumno (decisión 8):
 *  - «Mis Diplomados»: lo pagado a cada curso y su último pago (sin recibo
 *    descargable; «Mis pagos» y «Pagos» del programa no se tocan).
 *  - /alumno/pagar: quien se registró eligiendo un curso (nivel NULL) no ve los
 *    enlaces de cobro del PROGRAMA.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const fmt = (n: number) => `$${n}`

test('1. el resumen: «Pagado $X · último pago <fecha>»; nada si no ha pagado', () => {
  expect(resumenPagosCurso({ pagado: 2490, ultimo: { fecha: '2026-09-12', monto: 2490 } }, fmt)).toMatch(/^Pagado \$2490 · último pago 12 sept?\.? 2026$/)
  expect(resumenPagosCurso({ pagado: 500, ultimo: null }, fmt)).toBe('Pagado $500')
  expect(resumenPagosCurso({ pagado: 0, ultimo: null }, fmt)).toBeNull()
  expect(resumenPagosCurso(null, fmt)).toBeNull()
  expect(resumenPagosCurso(undefined, fmt)).toBeNull()
})

test('2. la API: sus pagos de curso por la FK, con el cliente admin y SIEMPRE por el alumno de la sesión', () => {
  const r = sinComentarios(leer('src/app/api/alumno/cursos/route.ts'))
  expect(r).toMatch(/\.from\('curso_inscripciones'\)\s*\.select\('id, curso_id'\)\s*\.eq\('alumno_id', user\.id\)/)
  expect(r).toMatch(/\.from\('pagos'\)\s*\.select\('curso_inscripcion_id, monto, fecha_pago, created_at'\)\s*\.eq\('alumno_id', user\.id\)\s*\.not\('curso_inscripcion_id', 'is', null\)/)
  // Sin B1 (o un error) no hay resumen: el catálogo sale como siempre.
  expect(r).toContain('if (!errPagos) {')
  expect(r).toContain('pagos: pagosPorCurso.get(curso.id as string) ?? null,')
  const page = sinComentarios(leer('src/app/(dashboard)/alumno/cursos/page.tsx'))
  expect(page).toContain('{resumenPagosCurso(curso.pagos, fmtCurso)}')
})

test('3. /alumno/pagar: sin nivel (se inscribió a un curso) no ve los enlaces del programa; un fallo de red no cuenta', () => {
  const p = sinComentarios(leer('src/app/(dashboard)/alumno/pagar/page.tsx'))
  expect(p).toContain('.then((d: Perfil | null) => { setNivel(d?.nivel?.toLowerCase() ?? null); setPerfilLeido(d !== null) })')
  expect(p).toContain('const sinPrograma = perfilLeido && nivel === null')
  expect(p).toContain('const enlaces = sinPrograma ? [] : (cfgPagos?.enlaces ?? []).filter(e =>')
  expect(p).toContain('Los pagos de tu curso los registra tu escuela.')
  // «Mis pagos» y «Pagos» del programa no se tocan (D13 ya pinta su costo aparte).
  expect(leer('src/app/api/alumno/pagos/route.ts')).not.toContain('curso_inscripcion_id')
})
