import { test, expect } from '@playwright/test'
import { esNombreLargo, LIMITE_NOMBRE_CORTO } from '../../src/lib/marca'

/**
 * Nombre de marca largo (IELAD #313): la landing cambia de tipografía cuando
 * `CONFIG.nombre` es una frase. El corte es estricto: 28 caracteres todavía es
 * nombre corto, 29 ya es largo.
 */
test.describe('esNombreLargo', () => {
  test('28 caracteres es corto, 29 es largo', () => {
    expect(LIMITE_NOMBRE_CORTO).toBe(28)
    expect(esNombreLargo('a'.repeat(28))).toBe(false)
    expect(esNombreLargo('a'.repeat(29))).toBe(true)
  })

  test('vacío o nulo no es largo; los espacios de los extremos no cuentan', () => {
    expect(esNombreLargo(null)).toBe(false)
    expect(esNombreLargo(undefined)).toBe(false)
    expect(esNombreLargo('')).toBe(false)
    expect(esNombreLargo(`  ${'a'.repeat(28)}  `)).toBe(false)
  })

  test('nombre completo de una escuela real', () => {
    expect(esNombreLargo('Instituto de Educación en Línea y a Distancia de México')).toBe(true)
    expect(esNombreLargo('UVEP')).toBe(false)
  })
})
