import { test, expect } from '@playwright/test'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { mxn, fijarMoneda } from '../../scripts/entrega/documento.mjs'

/**
 * El formateo de dinero del Documento de Entrega Oficial y del mensaje de
 * WhatsApp. Los dos salen de aquí, así que lo que se arregle en `mxn` se
 * arregla en los dos a la vez.
 */

test.afterEach(() => fijarMoneda('MXN'))

test('un concepto que no se cobra dice "Gratis", nunca "$0"', () => {
  // Le pasa a cualquier escuela que regale la inscripción o la certificación:
  // DPAZ (#191), EDUHCO (#197) y SAMEX (#199). Un "$0" en un documento de
  // entrega oficial se lee como un error del papel, no como un regalo — y es
  // justo lo que la escuela está vendiendo.
  expect(mxn(0)).toBe('Gratis')
  expect(mxn(null)).toBe('Gratis')
  expect(mxn(undefined)).toBe('Gratis')
  expect(mxn(0)).not.toContain('$')
})

test('los importes normales no cambian ni un carácter', () => {
  // El invariante de las ~144 escuelas: su documento sale idéntico.
  expect(mxn(2700)).toBe('$2,700')
  expect(mxn(1400)).toBe('$1,400')
  expect(mxn(9000)).toBe('$9,000')
  expect(mxn(599)).toBe('$599')
})

test('en otra moneda, "Gratis" sigue siendo "Gratis" y el resto lleva su código', () => {
  fijarMoneda('USD')
  expect(mxn(300)).toBe('$300 USD')
  // 🛑 "Gratis USD" no significa nada: gratis no tiene moneda.
  expect(mxn(0)).toBe('Gratis')
})
