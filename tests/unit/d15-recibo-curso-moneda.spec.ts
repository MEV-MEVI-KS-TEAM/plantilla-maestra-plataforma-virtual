import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { conceptoDeRecibo, conceptoMensajeRecibo } from '@/lib/pagos/conceptos'
import { codigoMoneda } from '@/lib/moneda'
import { resolverEstiloLanding } from '@/lib/landing-estilo'

/**
 * Bloque D · D15 — #207-4: el recibo dice de QUÉ curso es el pago y en qué
 * moneda se cobró (`pagos.moneda`, congelada al registrarlo). Y lo que D4 dejó
 * pendiente: la moneda se escribe y se pinta por su CÓDIGO ISO (un config.ts
 * con la moneda como objeto —coacma— tronaba el CHECK con un 500 y pintaba
 * «[object Object]»).
 *
 * Los recibos ya generados NO se regeneran: el PDF se guarda la primera vez
 * (idempotente) y los siguientes solo se firman.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('1. el concepto del recibo: del programa, igual que antes; de un curso, con su nombre y lo que cubre', () => {
  // Programa: EXACTAMENTE el texto de antes (etiqueta + « — Mes N»).
  expect(conceptoDeRecibo({ concepto: 'mensualidad', mes_desbloqueado: 2, curso_inscripcion_id: null })).toBe('Mensualidad — Mes 2')
  expect(conceptoDeRecibo({ concepto: 'inscripcion', mes_desbloqueado: null, curso_inscripcion_id: null })).toBe('Inscripción')
  expect(conceptoDeRecibo({ concepto: null, mes_desbloqueado: null })).toBe('Mensualidad')
  // Curso: «Curso «X» · …».
  const c = { curso_inscripcion_id: 'ci', curso_nombre: 'EXANI-II', curso_tipo: 'curso' }
  expect(conceptoDeRecibo({ ...c, concepto: 'curso_pago_unico', mes_desbloqueado: null })).toBe('Curso «EXANI-II» · pago único')
  expect(conceptoDeRecibo({ ...c, concepto: 'curso_mensualidad', mes_desbloqueado: 2 })).toBe('Curso «EXANI-II» · mensualidad, mes 2 del curso')
  expect(conceptoDeRecibo({ ...c, concepto: 'curso_mensualidad', mes_desbloqueado: null })).toBe('Curso «EXANI-II» · mensualidad')
  expect(conceptoDeRecibo({ ...c, concepto: 'curso_inscripcion', mes_desbloqueado: null })).toBe('Curso «EXANI-II» · inscripción')
  expect(conceptoDeRecibo({ ...c, concepto: 'curso_otro', mes_desbloqueado: null })).toBe('Curso «EXANI-II» · otro pago')
  expect(conceptoDeRecibo({ curso_inscripcion_id: 'ci', curso_nombre: 'Docencia', curso_tipo: 'diplomado', concepto: 'curso_pago_unico' }))
    .toBe('Diplomado «Docencia» · pago único')
  // Sin nombre legible: la vertical sola, nunca «Programa».
  expect(conceptoDeRecibo({ curso_inscripcion_id: 'ci', curso_nombre: null, concepto: 'curso_inscripcion' })).toBe('Curso · inscripción')
  // El WhatsApp: la forma de siempre, con el nombre del curso.
  expect(conceptoMensajeRecibo({ concepto: 'mensualidad', curso_inscripcion_id: null })).toBe('mensualidad')
  expect(conceptoMensajeRecibo({ ...c, concepto: 'curso_mensualidad' })).toBe('mensualidad del curso «EXANI-II»')
  expect(conceptoMensajeRecibo({ ...c, concepto: 'curso_pago_unico' })).toBe('pago único del curso «EXANI-II»')
})

test('2. la ruta y el PDF: el curso del pago y su moneda REAL; select(*) (moneda y FK no existen en toda base)', () => {
  const r = sinComentarios(leer('src/app/api/admin/pagos/[id]/recibo/route.ts'))
  expect(r).toMatch(/\.from\('pagos'\)\s*\.select\('\*'\)\s*\.eq\('id', params\.id\)\s*\.single\(\)/)
  expect(r).toContain("admin.from('curso_inscripciones').select('curso_id').eq('id', pago.curso_inscripcion_id).maybeSingle()")
  expect(r).toContain("admin.from('cursos').select('nombre, tipo').eq('id', cursoId).maybeSingle()")
  expect(r).toContain('const monedaPago = codigoMoneda(pago.moneda, codigoMoneda(CONFIG.moneda))')
  expect(r).toContain('moneda: monedaPago,')
  expect(r).toContain('let conceptoLabel = conceptoMensajeRecibo(conCurso)')
  expect(r).toContain('formatearMoneda(Number(pago.monto), { moneda: monedaPago, tipoCambioMXN: 0 }, { decimales: 2, conCodigo: true })')
  const pdf = sinComentarios(leer('src/lib/pdf/recibo-pago.tsx'))
  expect(pdf).toContain('formatearMoneda(n, { moneda: codigoMoneda(moneda, codigoMoneda(CONFIG.moneda)), tipoCambioMXN: 0 }, { decimales: 2, conCodigo: true })')
  expect(pdf).toContain('{fmtMoneda(data.monto, data.moneda)}')
  expect(pdf).toContain('{conceptoDeRecibo({')
  // El PDF ya guardado solo se firma: no se regenera.
  expect(r).toContain("upsert: false")
})

test('3. la moneda se ESCRIBE por su código: un objeto { codigo: "USD" } ya no rompe el CHECK pagos_moneda_iso', () => {
  expect(codigoMoneda({ codigo: 'USD', simbolo: '$', locale: 'en-US', etiqueta: 'USD' })).toBe('USD')
  expect(codigoMoneda('USD')).toMatch(/^[A-Z]{3}$/)
  const pagos = sinComentarios(leer('src/app/api/admin/pagos/route.ts'))
  expect(pagos).toContain("...(codigoMoneda(CONFIG.moneda) !== 'MXN'")
  expect(pagos).toContain('? { moneda: codigoMoneda(CONFIG.moneda), tipo_cambio_aplicado: tipoCambioValido(cfgSitio.tipoCambioMXN) }')
  expect(pagos).not.toMatch(/\{ moneda: CONFIG\.moneda,/)
  const cob = sinComentarios(leer('src/app/api/admin/cobranza/[alumnoId]/route.ts'))
  expect(cob).toContain('const moneda = codigoMoneda(CONFIG.moneda)')
  expect(cob).toContain('? { p_moneda: moneda, p_tipo_cambio: tipoCambioValido(cfgSitio.tipoCambioMXN) }')
})

test('4. la moneda se PINTA por su código: nada de «[object Object]»', () => {
  expect(sinComentarios(leer('src/app/api/admin/reportes/excel/route.ts'))).toContain('const M = codigoMoneda(cfg.moneda)')
  const form = sinComentarios(leer('src/components/admin/cursos/CursoDatosForm.tsx'))
  expect(form).toContain('label={`Inscripción (${codigoMoneda(CONFIG.moneda)})`}')
  expect(form).toContain('label={`Mensualidad (${codigoMoneda(CONFIG.moneda)})`}')
  const precios = sinComentarios(leer('src/components/admin/personalizar/PestanaPrecios.tsx'))
  expect(precios).toContain('const MONEDA: Moneda = codigoMoneda(CONFIG.moneda)')
  expect(precios).not.toMatch(/moneda=\{CONFIG\.moneda\}|, CONFIG\.moneda[,)]/)
  // La animada: por el código. Un objeto en pesos es pesos; en dólares sigue siendo otra moneda.
  expect(resolverEstiloLanding('animada', { moneda: { codigo: 'MXN' } })).toBe('animada')
  expect(resolverEstiloLanding('animada', { moneda: { codigo: 'USD' } })).toBe('clasica')
  expect(resolverEstiloLanding('animada', { moneda: 'MXN' })).toBe('animada')
  expect(resolverEstiloLanding('animada', { moneda: 'USD' })).toBe('clasica')
})
