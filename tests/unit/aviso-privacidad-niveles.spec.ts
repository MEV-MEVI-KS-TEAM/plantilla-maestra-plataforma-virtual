import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { getNivelLabel } from '@/lib/modalidades'
import { licenciaturasActivas } from '@/lib/licenciatura-utils'

/**
 * Bug 283 (CÚSPIDE #285): el aviso de privacidad decía fijo «Secundaria o
 * Preparatoria» aunque la escuela vendiera un solo nivel. Ahora el programa sale
 * de CONFIG.niveles (+ licenciatura solo con el add-on activo), con el texto de
 * siempre como respaldo.
 */
const etiqueta = (niveles: readonly string[], lic: boolean) =>
  getNivelLabel([
    ...['secundaria', 'preparatoria'].filter(n => niveles.includes(n)),
    ...(lic ? ['licenciatura'] : []),
  ]) || 'Secundaria o Preparatoria'

test('el aviso lee los niveles del config (sin texto fijo)', () => {
  const src = readFileSync(join('src', 'app', '(legal)', 'aviso-de-privacidad', 'page.tsx'), 'utf8')
  expect(src).toContain('programa de {NIVELES_AVISO}.')
  expect(src).not.toContain('programa de Secundaria o Preparatoria.</li>')
})

test('🛑 de fábrica el texto NO cambia (los dos niveles, add-on apagado)', () => {
  expect(licenciaturasActivas()).toBe(false)
  expect(etiqueta(CONFIG.niveles as readonly string[], licenciaturasActivas())).toBe('Secundaria o Preparatoria')
})

test('un solo nivel, licenciatura y solo cursos', () => {
  expect(etiqueta(['preparatoria'], false)).toBe('Preparatoria')
  expect(etiqueta(['secundaria'], false)).toBe('Secundaria')
  expect(etiqueta(['preparatoria'], true)).toBe('Preparatoria o Licenciatura')
  expect(etiqueta(['secundaria', 'preparatoria', 'licenciatura'], false)).toBe('Secundaria o Preparatoria')
  expect(etiqueta([], false)).toBe('Secundaria o Preparatoria')
})
