import { test, expect } from '@playwright/test'
import { mensajeRecibo, waUrl } from '@/lib/whatsapp'

/**
 * El mensaje con el que se manda un recibo por WhatsApp (Bug P-11).
 *
 * 🛑 «Hola Ana, aquí está tu recibo de pago **de pago** por $1.00». La plantilla
 * de la frase ya trae la palabra «pago» y la etiqueta del concepto `otro` en el
 * catálogo de la ruta es, precisamente, `'pago'`. Medido en producción:
 *
 *   https://wa.me/52…?text=Hola QA Ficticio, aquí está tu recibo de pago de pago
 *   por $1.00: https://…/recibos/….pdf
 *
 * `otro` es un concepto que el panel SÍ ofrece en su selector —lo produce
 * cualquier cobro que no encaje en los otros cuatro— y el mensaje lo lee un
 * alumno en su WhatsApp. Cosmético, pero en un documento de cobro.
 */

const BASE = {
  alumnoNombre: 'Ana',
  montoFmt: '$1,200.00 MXN',
  url: 'https://ejemplo.supabase.co/recibos/abc.pdf',
}

test('P-11. concepto genérico: la palabra "pago" no se repite', () => {
  const m = mensajeRecibo({ ...BASE, conceptoLabel: 'pago' })
  expect(m).toBe('Hola Ana, aquí está tu recibo de pago por $1,200.00 MXN: https://ejemplo.supabase.co/recibos/abc.pdf')
  expect(m).not.toContain('de pago de pago')
  // Y no se pierde nada de lo que el mensaje tiene que llevar.
  expect(m).toContain('Ana')
  expect(m).toContain('$1,200.00 MXN')
  expect(m).toContain(BASE.url)
})

test('P-11. los otros cuatro conceptos leen exactamente igual que antes', () => {
  // El fix no puede mover la frase de los conceptos que ya leían bien: son los
  // que salen en la inmensa mayoría de los recibos.
  const casos: Array<[string, string]> = [
    ['mensualidad',   'Hola Ana, aquí está tu recibo de pago de mensualidad por $1,200.00 MXN: ' + BASE.url],
    ['inscripción',   'Hola Ana, aquí está tu recibo de pago de inscripción por $1,200.00 MXN: ' + BASE.url],
    ['cuota semanal', 'Hola Ana, aquí está tu recibo de pago de cuota semanal por $1,200.00 MXN: ' + BASE.url],
    ['certificación', 'Hola Ana, aquí está tu recibo de pago de certificación por $1,200.00 MXN: ' + BASE.url],
  ]
  for (const [conceptoLabel, esperado] of casos) {
    expect(mensajeRecibo({ ...BASE, conceptoLabel }), conceptoLabel).toBe(esperado)
  }
})

test('P-11. la etiqueta de un cobro semanal, que no viene del catálogo, tampoco se toca', () => {
  // En una escuela semanal la ruta sustituye la etiqueta por «Semana N de M»
  // antes de llamar aquí. Es texto libre y tiene que pasar tal cual.
  expect(mensajeRecibo({ ...BASE, conceptoLabel: 'Semana 3 de 24' }))
    .toBe('Hola Ana, aquí está tu recibo de pago de Semana 3 de 24 por $1,200.00 MXN: ' + BASE.url)
})

test('P-11. "Pago" con mayúscula o con espacios cuenta igual: la comparación normaliza', () => {
  // La etiqueta viaja desde un catálogo que alguien puede editar. Si mañana
  // alguien la escribe con mayúscula, el bug no debe volver por la puerta de
  // atrás.
  for (const etiqueta of ['Pago', 'PAGO', '  pago  ']) {
    expect(mensajeRecibo({ ...BASE, conceptoLabel: etiqueta }), etiqueta)
      .toBe('Hola Ana, aquí está tu recibo de pago por $1,200.00 MXN: ' + BASE.url)
  }
})

test('P-11. el mensaje sobrevive al encodeURIComponent de wa.me', () => {
  // El mensaje acaba en una URL. Se comprueba de punta a punta, porque una
  // frase correcta que se rompe al codificar no sirve de nada.
  const m = mensajeRecibo({ ...BASE, conceptoLabel: 'pago' })
  const url = waUrl('3312345678', m)!
  expect(url.startsWith('https://wa.me/523312345678?text=')).toBe(true)
  expect(decodeURIComponent(url.split('?text=')[1])).toBe(m)
})
