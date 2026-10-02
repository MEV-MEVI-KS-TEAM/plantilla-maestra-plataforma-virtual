import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { soporte } from '../../scripts/entrega/documento.mjs'

/**
 * CIMA #251 (2-oct-2026): cuatro arreglos genéricos que salieron de un combo con
 * «Internacional / México Americano» en el nombre, validez SOLO SEP y domicilio
 * real de oficina.
 *
 *  1. Con la validez solo SEP (sin documentos), el PDF y el mensaje NO prometen
 *     «México y Estados Unidos» ni «dos documentos».
 *  2. 🛑 La entrega lleva SOLO el dominio final (regla 28b): el generador aborta
 *     si el PDF o el mensaje contienen un host provisional (`*.vercel.app`).
 *  3. La constancia se imprimía corrida ~285 px: un ancestro con `transform` era
 *     el bloque contenedor del `position: absolute` de impresión.
 *  4. `CONFIG.domicilio` (opt-in) llega al recibo PDF y a la constancia; sin la
 *     clave no cambia nada.
 */

const GEN = readFileSync(join('scripts', 'entrega', 'generar-entrega.mjs'), 'utf8')
const SOPORTE_BASE = { soporte: { horario: 'h', respuesta: 'r', canal: 'c' }, tutoriales: [], primerosPasos: [] }

test('1a validez solo SEP: el bloque del PDF no nombra Estados Unidos ni «dos documentos»', () => {
  const html = soporte({ ...SOPORTE_BASE, validez: true, folioVerificable: false, validezDocumentos: 0 })
  expect(html).toContain('Validez oficial ante la SEP')
  expect(html).not.toMatch(/Estados Unidos|dos países|dos documentos/)
})

test('1b con documentos (lo de siempre) el bloque sigue igual', () => {
  const html = soporte({ ...SOPORTE_BASE, validez: true, folioVerificable: false, validezDocumentos: 2 })
  expect(html).toContain('Un certificado, dos países')
  expect(html).toContain('dos bloques')
})

test('1c el resumen y el mensaje se apagan con VALIDEZ_SOLO_SEP en sus tres textos', () => {
  expect(GEN).toMatch(/const VALIDEZ_SOLO_SEP =/)
  expect(GEN.match(/VALIDEZ_SOLO_SEP \?/g)?.length).toBeGreaterThanOrEqual(2)
  expect(GEN).toMatch(/VALIDEZ && \(VALIDEZ_SOLO_SEP\n/)
  expect(GEN).toMatch(/validezDocumentos: VALIDEZ_SOLO_SEP \? 0 : 2/)
})

test('2 🛑 candado: el PDF y el mensaje pasan por sinHostProvisional ANTES de escribirse', () => {
  expect(GEN).toMatch(/function sinHostProvisional\(texto, que\)/)
  const iPdf = GEN.indexOf("sinHostProvisional(HTML_ENTREGA, 'El PDF')")
  const iHtml = GEN.indexOf('fs.writeFileSync(htmlPath, HTML_ENTREGA')
  expect(iPdf).toBeGreaterThan(0)
  expect(iPdf).toBeLessThan(iHtml)
  const iMsg = GEN.indexOf("sinHostProvisional(L.join('\\n'), 'El mensaje de WhatsApp')")
  const iTxt = GEN.indexOf("fs.writeFileSync(txt, L.join('\\n')")
  expect(iMsg).toBeGreaterThan(0)
  expect(iMsg).toBeLessThan(iTxt)
  expect(GEN).toMatch(/const HOSTS_PROVISIONALES = \[[^\]]*'vercel\.app'/)
})

test('3 constancia: al imprimir ningún ancestro transforma ni anima', () => {
  const src = readFileSync(join('src', 'app', '(dashboard)', 'alumno', 'constancia', 'page.tsx'), 'utf8')
  const print = src.slice(src.indexOf('@media print'))
  expect(print).toMatch(/\*:has\(#constancia-print\) \{\s*transform: none !important;\s*animation: none !important;/)
})

test('4 domicilio opt-in: recibo y constancia lo leen de CONFIG.domicilio (vacío = nada)', () => {
  for (const ruta of [join('src', 'lib', 'pdf', 'recibo-pago.tsx'), join('src', 'app', '(dashboard)', 'alumno', 'constancia', 'page.tsx')]) {
    const src = readFileSync(ruta, 'utf8')
    expect(src, ruta).toMatch(/\.domicilio\?\.completo \?\? ''\)\.trim\(\)/)
    expect(src, ruta).toMatch(/DOMICILIO (!== '' )?&&/)
  }
})
