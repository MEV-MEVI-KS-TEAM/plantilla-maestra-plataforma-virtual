import { test, expect } from '@playwright/test'
// @ts-expect-error — el generador es JS puro, sin tipos: se prueba tal cual corre.
import { soporte } from '../../scripts/entrega/documento.mjs'

/**
 * El folio de validación en el Documento de Entrega Oficial.
 *
 * 🛑 `validez` y «tiene folio» NO son lo mismo. La primera dice si la escuela
 * vende su certificado con validez oficial; la segunda, si además tiene un
 * folio que un prospecto pueda teclear en el portal SIGED de la SEP.
 *
 * La landing ya las separa: gatea el bloque «Verifícalo tú mismo» por
 * `folio !== ''`. El documento no lo hacía y anunciaba «folio de ejemplo y
 * enlace directo al portal SIGED» en TODAS las escuelas. En una que entrega sin
 * folio propio —AULA RAÍZ #208, cuya red comparte una acreditación que no es
 * suya y que por eso no se copia a su config— eso es un documento oficial que
 * promete lo que su propia página no muestra: el cliente lo reenvía, un
 * prospecto pide verificar y no hay nada que teclear.
 *
 * Un documento de entrega que contradice a la plataforma es peor que no tenerlo.
 */

/** Lo mínimo que `soporte()` necesita aparte de lo que se prueba aquí. */
const BASE = {
  soporte: { horario: 'L-V 9-18', respuesta: '24 h', canal: 'WhatsApp' },
  tutoriales: ['Playlist completa: https://example.com/playlist'],
  primerosPasos: ['Entra al panel y recorre el menú con calma'],
}

test('CON folio: el documento ofrece verificarlo en el portal SIGED', () => {
  const html = soporte({ ...BASE, validez: true, folioVerificable: true })
  expect(html).toContain('Verifícalo tú mismo')
  expect(html).toContain('SIGED')
})

test('SIN folio: no se promete ningún folio, pero la sección de validez sigue estando', () => {
  const html = soporte({ ...BASE, validez: true, folioVerificable: false })
  // La escuela SÍ tiene validez oficial y sus dos documentos: eso no se quita.
  expect(html).toContain('Validez oficial y respaldo')
  expect(html).toContain('dos documentos oficiales')
  // Lo que no puede aparecer es la promesa de un folio que no existe.
  expect(html).not.toContain('Verifícalo tú mismo')
  expect(html).not.toContain('folio')
})

test('sin validez oficial no hay sección, con folio o sin él', () => {
  for (const folioVerificable of [true, false]) {
    const html = soporte({ ...BASE, validez: false, folioVerificable })
    expect(html).not.toContain('Validez oficial y respaldo')
    expect(html).not.toContain('folio')
    // El soporte técnico sigue saliendo: es lo único que queda de este bloque.
    expect(html).toContain('Soporte técnico MEV')
  }
})
