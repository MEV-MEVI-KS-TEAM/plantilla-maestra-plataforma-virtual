import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import {
  planesSemanales, tablaPrecios, lineasPreciosWhatsApp,
  problemaDePrecios, nivelesSinPlanes, ofertaSimetrica, tablaPreciosMensual, filasModalidadesMensual, frasesMensuales,
  lineasPreciosMensualWhatsApp,
} from '../../scripts/entrega/planes.mjs'
import { mxn } from '../../scripts/entrega/documento.mjs'
import { ritmoDeApertura } from '../../scripts/entrega/licenciaturas.mjs'
import { certificacionDe, inscripcionDe, mensualidadDe } from '@/lib/precios-nivel'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'

/**
 * F2-8 — el Documento de Entrega Oficial con el precio de CADA NIVEL, del mismo
 * resolver que la plataforma (src/lib/precios-nivel.ts).
 *
 * Lo que protegen: que la flota (oferta simétrica, claves vacías) reciba EL
 * MISMO papel de siempre; que una clave por nivel salga en su columna; que una
 * oferta asimétrica no invente combinaciones; y que el papel no anuncie una
 * cifra que la plataforma no cobra.
 */

type Precios = Record<string, unknown>
type Config = { niveles: string[]; periodicidad?: string; modalidades: Record<string, unknown>[]; precios: Precios }

const R = (p: Precios) => ({
  insc: (n: string) => inscripcionDe(n, p),
  mens: (n: string, m: { meses: number; mensualidad: number }) => mensualidadDe(n, m, p),
  cert: (n: string) => certificacionDe(n, p),
})
const NIVELES = ['secundaria', 'preparatoria']

/** Las cifras de FÁBRICA de la plantilla (config.ts), escritas a mano: la prueba no depende del clon. */
const PRECIOS_FABRICA: Precios = {
  inscripcion: 599,
  inscripcionSecundaria: null, inscripcionPreparatoria: null,
  mensualidadSecundaria3Meses: null, mensualidadSecundaria6Meses: null,
  mensualidadPreparatoria3Meses: null, mensualidadPreparatoria6Meses: null,
  certificacionSecundaria: 4900, certificacionPreparatoria: 5900,
  secundaria_3meses_normal: 2000, secundaria_6meses_normal: 1000,
  preparatoria_3meses_normal: 2000, preparatoria_6meses_normal: 1000,
}
const PLANES_FABRICA = [
  { id: '3_meses', label: '3 meses — Express', meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 meses — Estándar', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
]
const fabrica = (precios: Precios = {}, modalidades: Config['modalidades'] = PLANES_FABRICA): Config =>
  ({ niveles: ['secundaria', 'preparatoria', 'licenciatura'], modalidades, precios: { ...PRECIOS_FABRICA, ...precios } })

const tabla = (c: Config) => tablaPreciosMensual(c, NIVELES, R(c.precios))
const whatsapp = (c: Config) => lineasPreciosMensualWhatsApp(c, NIVELES, R(c.precios))

test('1. con la FÁBRICA, la tabla sale exactamente como hoy, fila por fila y en el mismo orden', () => {
  const t = tabla(fabrica())
  expect(t.cols).toEqual(['Concepto', 'Secundaria', 'Preparatoria'])
  expect(t.filas).toEqual([
    ['Inscripción (pago único)', '$599', '$599'],
    ['Plan 3 meses — Express · 3 meses', '$2,000/mes', '$2,000/mes'],
    ['Plan 6 meses — Estándar · 6 meses', '$1,000/mes', '$1,000/mes'],
    ['Total del plan 3 meses — Express', '$6,599', '$6,599'],
    ['Total del plan 6 meses — Estándar', '$6,599', '$6,599'],
    ['Certificación', '$4,900', '$5,900'],
    { total: true, celdas: ['Costo total — plan 3 meses — Express (con certificación)', '$11,499', '$12,499'] },
    { total: true, celdas: ['Costo total — plan 6 meses — Estándar (con certificación)', '$11,499', '$12,499'] },
  ])
  expect(ofertaSimetrica(fabrica(), NIVELES)).toBe(true)
  // El WhatsApp de fábrica, línea por línea como hoy.
  expect(whatsapp(fabrica())).toEqual([
    'Secundaria: inscripción $599 · 3 meses — Express: $2,000/mes · 6 meses — Estándar: $1,000/mes · certificación $4,900',
    'Preparatoria: inscripción $599 · 3 meses — Express: $2,000/mes · 6 meses — Estándar: $1,000/mes · certificación $5,900',
    'Planes disponibles: 3 meses — Express y 6 meses — Estándar.',
    '',
  ])
  // Y las frases de siempre.
  const f = frasesMensuales(fabrica(), NIVELES, R(fabrica().precios))
  expect(f.frasePrecios).toBe('Tu escuela ofrece 2 planes de 3 o 6 meses. Así quedaron cargados:')
  expect(f.incluye).toBe('2 planes de estudio (3 o 6 meses)')
  expect(f.notaModalidades).toBe('El alumno elige su plan al registrarse, y el ritmo de apertura de materias se ajusta solo.')
  // El resumen de modalidades, fila por fila y en el orden de siempre (nivel, luego plan).
  expect(filasModalidadesMensual(fabrica(), NIVELES, { mens: R(fabrica().precios).mens, ritmo: ritmoDeApertura })).toEqual([
    ['Secundaria — plan 3 meses — Express', '3 meses', '$2,000/mes', '4 materias por mes'],
    ['Secundaria — plan 6 meses — Estándar', '6 meses', '$1,000/mes', '2 materias por mes'],
    ['Preparatoria — plan 3 meses — Express', '3 meses', '$2,000/mes', '4 materias por mes'],
    ['Preparatoria — plan 6 meses — Estándar', '6 meses', '$1,000/mes', '2 materias por mes'],
  ])
})

test('1 ter. un solo plan: sin nombrarlo, y «plan único» como hoy', () => {
  const c = fabrica({}, [PLANES_FABRICA[0]])
  expect(whatsapp(c)).toEqual([
    'Secundaria: inscripción $599 · $2,000/mes · certificación $4,900',
    'Preparatoria: inscripción $599 · $2,000/mes · certificación $5,900',
    'Plan único de 3 meses.',
    '',
  ])
  const t = tabla(c)
  expect(t.filas.map((f: unknown) => (Array.isArray(f) ? f : (f as { celdas: string[] }).celdas)[0])).toEqual([
    'Inscripción (pago único)', 'Plan 3 meses — Express · 3 meses', 'Total del plan 3 meses — Express', 'Certificación',
    'Costo total del programa completo (con certificación)',
  ])
  expect(frasesMensuales(c, NIVELES, R(c.precios)).frasePrecios).toBe('Tu escuela opera con un plan único de 3 meses. Así quedó cargado en la plataforma:')
})

test('1 bis. esas cifras de fábrica son las del config.ts de la plantilla', () => {
  test.skip(!ES_PLANTILLA, 'en un clon manda su config.ts')
  const p = CONFIG.precios as unknown as Precios
  for (const k of Object.keys(PRECIOS_FABRICA)) expect(p[k], k).toBe(PRECIOS_FABRICA[k])
  expect(CONFIG.modalidades.map((m) => [m.id, m.label, m.meses, m.mensualidad, m.materiasPorMes, m.activa]))
    .toEqual(PLANES_FABRICA.map((m) => [m.id, m.label, m.meses, m.mensualidad, m.materiasPorMes, m.activa]))
})

test('2. una clave vacía da la general, y editar la general mueve los dos niveles', () => {
  const t = tabla(fabrica({ inscripcion: 800 }))
  expect(t.filas[0]).toEqual(['Inscripción (pago único)', '$800', '$800'])
  // Con la clave de Secundaria, solo Secundaria cambia; Preparatoria sigue con la general.
  expect(tabla(fabrica({ inscripcion: 800, inscripcionSecundaria: 1000 })).filas[0]).toEqual(['Inscripción (pago único)', '$1,000', '$800'])
  // Y la frase lo nota.
  expect(frasesMensuales(fabrica({ inscripcionSecundaria: 1000 }), NIVELES, R(fabrica({ inscripcionSecundaria: 1000 }).precios)).frasePrecios)
    .toContain('con inscripción diferenciada por nivel')
})

test('3. caso Moreta: 1000 + 1500×3 / 900×6 en Secundaria; 1500 + 4900×3 / 2900×6 en Preparatoria', () => {
  const c = fabrica({
    inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500,
    mensualidadSecundaria3Meses: 1500, mensualidadSecundaria6Meses: 900,
    mensualidadPreparatoria3Meses: 4900, mensualidadPreparatoria6Meses: 2900,
  })
  const filas = tabla(c).filas as unknown[]
  expect(filas[0]).toEqual(['Inscripción (pago único)', '$1,000', '$1,500'])
  expect(filas[1]).toEqual(['Plan 3 meses — Express · 3 meses', '$1,500/mes', '$4,900/mes'])
  expect(filas[2]).toEqual(['Plan 6 meses — Estándar · 6 meses', '$900/mes', '$2,900/mes'])
  expect(filas[3]).toEqual(['Total del plan 3 meses — Express', '$5,500', '$16,200'])
  expect(filas[4]).toEqual(['Total del plan 6 meses — Estándar', '$6,400', '$18,900'])
  expect(whatsapp(c)).toContain('Secundaria: inscripción $1,000 · 3 meses — Express: $1,500/mes · 6 meses — Estándar: $900/mes · certificación $4,900')
})

test('4. caso SAMEX: Secundaria con sus alias (2700/1400), Preparatoria con el plan (3000/1500)', () => {
  const c = fabrica({
    inscripcion: 1000,
    secundaria_3meses_normal: 2700, secundaria_6meses_normal: 1400,
    preparatoria_3meses_normal: 3000, preparatoria_6meses_normal: 1500,
  }, [
    { ...PLANES_FABRICA[0], mensualidad: 3000 },
    { ...PLANES_FABRICA[1], mensualidad: 1500 },
  ])
  const filas = tabla(c).filas as unknown[]
  expect(filas[1]).toEqual(['Plan 3 meses — Express · 3 meses', '$2,700/mes', '$3,000/mes'])
  expect(filas[2]).toEqual(['Plan 6 meses — Estándar · 6 meses', '$1,400/mes', '$1,500/mes'])
  expect(filas[3]).toEqual(['Total del plan 3 meses — Express', '$9,100', '$10,000'])
  // El resumen de modalidades no puede contradecir a la tabla del mismo documento.
  expect(filasModalidadesMensual(c, NIVELES, { mens: R(c.precios).mens, ritmo: ritmoDeApertura }).map((f: string[]) => f[2]))
    .toEqual(['$2,700/mes', '$1,400/mes', '$3,000/mes', '$1,500/mes'])
})

test('4 bis. el alias de PREPARATORIA no se lee: la plataforma cobra el plan', () => {
  // El PDF viejo leía `preparatoria_<n>meses_normal`; la app (y el cobro) no.
  const c = fabrica({ preparatoria_3meses_normal: 2600, preparatoria_6meses_normal: 1300 })
  const filas = tabla(c).filas as unknown[]
  expect(filas[1]).toEqual(['Plan 3 meses — Express · 3 meses', '$2,000/mes', '$2,000/mes'])
  expect(filas[2]).toEqual(['Plan 6 meses — Estándar · 6 meses', '$1,000/mes', '$1,000/mes'])
})

test('5. oferta asimétrica: sin combinaciones inventadas, ni en la tabla ni en el WhatsApp', () => {
  const c = fabrica({}, [
    { ...PLANES_FABRICA[0], nivel: 'secundaria' },
    { ...PLANES_FABRICA[1], nivel: 'preparatoria' },
  ])
  expect(ofertaSimetrica(c, NIVELES)).toBe(false)
  const t = tabla(c)
  // Un plan por nivel: una columna por nivel, con SU plan.
  expect(t.cols).toEqual(['Concepto', 'Secundaria', 'Preparatoria'])
  expect(t.filas[0]).toEqual(['Plan', '3 meses — Express · 3 meses', '6 meses — Estándar · 6 meses'])
  expect(t.filas[2]).toEqual(['Mensualidad', '$2,000/mes', '$1,000/mes'])
  // Ni «Secundaria · 6 meses» ni «Preparatoria · 3 meses» en ningún lado: cada
  // línea del WhatsApp y cada columna de la tabla, con SU plan y nada más.
  const lineas = whatsapp(c)
  expect(lineas.find((l: string) => l.startsWith('Secundaria:'))).toBe('Secundaria: inscripción $599 · 3 meses — Express: $2,000/mes · certificación $4,900')
  expect(lineas.find((l: string) => l.startsWith('Preparatoria:'))).toBe('Preparatoria: inscripción $599 · 6 meses — Estándar: $1,000/mes · certificación $5,900')
  const columna = (i: number) => t.filas.map((f: unknown) => (Array.isArray(f) ? f : (f as { celdas: string[] }).celdas)[i]).join(' | ')
  expect(columna(1)).not.toContain('6 meses')
  expect(columna(2)).not.toContain('3 meses')
  // El resumen de modalidades, igual: una fila por plan que el nivel vende.
  const filas = filasModalidadesMensual(c, NIVELES, { mens: R(c.precios).mens, ritmo: ritmoDeApertura })
  expect(filas.map((f: string[]) => f[0])).toEqual(['Secundaria — plan 3 meses — Express', 'Preparatoria — plan 6 meses — Estándar'])
  // Y varios planes por nivel, pero no los mismos: una fila por plan REAL.
  const varios = fabrica({}, [
    { ...PLANES_FABRICA[0], nivel: 'secundaria' },
    { ...PLANES_FABRICA[1], nivel: 'secundaria' },
    { ...PLANES_FABRICA[1], id: '6_meses_p', nivel: 'preparatoria' },
  ])
  expect(tabla(varios).filas.map((f: unknown) => (f as string[])[0])).toEqual([
    'Secundaria · plan 3 meses — Express · 3 meses', 'Secundaria · plan 6 meses — Estándar · 6 meses', 'Preparatoria · plan 6 meses — Estándar · 6 meses',
  ])
})

/** Claves por nivel llenas y distintas de las de fábrica (caso Moreta). */
const LLENAS: Precios = {
  inscripcion: 500, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500,
  mensualidadSecundaria3Meses: 1500, mensualidadSecundaria6Meses: 900, mensualidadPreparatoria3Meses: 4900, mensualidadPreparatoria6Meses: 2900,
}

test('5 bis. asimétrica con un plan por nivel: la tabla, el resumen, las frases y el WhatsApp completos', () => {
  const uno = fabrica(LLENAS, [{ ...PLANES_FABRICA[0], nivel: 'secundaria' }, { ...PLANES_FABRICA[1], nivel: 'preparatoria' }])
  expect(tabla(uno)).toEqual({
    cols: ['Concepto', 'Secundaria', 'Preparatoria'],
    filas: [
      ['Plan', '3 meses — Express · 3 meses', '6 meses — Estándar · 6 meses'],
      ['Inscripción (pago único)', '$1,000', '$1,500'],
      ['Mensualidad', '$1,500/mes', '$2,900/mes'],
      ['Total del plan (inscripción + mensualidades)', '$5,500', '$18,900'],
      ['Certificación', '$4,900', '$5,900'],
      { total: true, celdas: ['Costo total del programa (con certificación)', '$10,400', '$24,800'] },
    ],
  })
  expect(filasModalidadesMensual(uno, NIVELES, { mens: R(uno.precios).mens, ritmo: ritmoDeApertura })).toEqual([
    ['Secundaria — plan 3 meses — Express', '3 meses', '$1,500/mes', '4 materias por mes'],
    ['Preparatoria — plan 6 meses — Estándar', '6 meses', '$2,900/mes', '2 materias por mes'],
  ])
  // Ni «2 planes de 3 o 6 meses» ni «el alumno elige su plan»: lo que decía la rama vieja.
  const f = frasesMensuales(uno, NIVELES, R(uno.precios))
  expect(f.frasePrecios).toBe('Cada nivel tiene su propia duración: Secundaria en 3 meses y Preparatoria en 6 meses, con inscripción diferenciada por nivel. Así quedó cargado en la plataforma:')
  expect(f.incluye).toBe('Planes por nivel: Secundaria en 3 meses y Preparatoria en 6 meses')
  expect(f.notaModalidades).toBe('La duración la trae el nivel, así que el alumno no elige plan al registrarse: la plataforma se lo asigna.')
  expect(whatsapp(uno)).toEqual([
    'Secundaria: inscripción $1,000 · 3 meses — Express: $1,500/mes · certificación $4,900',
    'Preparatoria: inscripción $1,500 · 6 meses — Estándar: $2,900/mes · certificación $5,900',
    'Planes por nivel: Secundaria en 3 meses y Preparatoria en 6 meses.',
    '',
  ])
})

test('5 ter. asimétrica con varios planes: una fila por plan REAL, y sus frases', () => {
  const varios = fabrica(LLENAS, [
    { ...PLANES_FABRICA[0], nivel: 'secundaria' },
    { ...PLANES_FABRICA[1], nivel: 'secundaria' },
    { ...PLANES_FABRICA[1], id: '6_meses_p', nivel: 'preparatoria' },
  ])
  expect(tabla(varios)).toEqual({
    cols: ['Plan', 'Inscripción', 'Mensualidad', 'Total del plan', 'Con certificación'],
    filas: [
      ['Secundaria · plan 3 meses — Express · 3 meses', '$1,000', '$1,500/mes', '$5,500', '$10,400'],
      ['Secundaria · plan 6 meses — Estándar · 6 meses', '$1,000', '$900/mes', '$6,400', '$11,300'],
      ['Preparatoria · plan 6 meses — Estándar · 6 meses', '$1,500', '$2,900/mes', '$18,900', '$24,800'],
    ],
  })
  const f = frasesMensuales(varios, NIVELES, R(varios.precios))
  expect(f.frasePrecios).toBe('Cada nivel tiene sus propios planes: Secundaria en 3 o 6 meses y Preparatoria en 6 meses, con inscripción diferenciada por nivel. Así quedaron cargados:')
  expect(f.notaModalidades).toBe('El alumno elige su plan al registrarse, entre los de su nivel, y el ritmo de apertura de materias se ajusta solo.')
  expect(whatsapp(varios).at(-2)).toBe('Planes por nivel: Secundaria en 3 o 6 meses y Preparatoria en 6 meses.')
  // Dos planes del mismo nivel con la misma duración: «6 meses», no «6 o 6 meses».
  const dup = fabrica({}, [
    { ...PLANES_FABRICA[1], id: 'normal', label: 'Normal', nivel: 'secundaria' },
    { ...PLANES_FABRICA[1], id: 'becado', label: 'Becado', nivel: 'secundaria' },
    { ...PLANES_FABRICA[0], nivel: 'preparatoria' },
  ])
  expect(frasesMensuales(dup, NIVELES, R(dup.precios)).frasePrecios)
    .toBe('Cada nivel tiene sus propios planes: Secundaria en 6 meses y Preparatoria en 3 meses. Así quedaron cargados:')
})

test('6. `inscripcion` como objeto (o no numérica) da error: nombra las claves por nivel', () => {
  expect(problemaDePrecios({ inscripcion: 599 })).toBeNull()
  expect(problemaDePrecios({ inscripcion: 0 })).toBeNull()
  for (const mala of [{ secundaria: 1000, preparatoria: 1500 }, '599', null, undefined, NaN]) {
    const p = problemaDePrecios({ inscripcion: mala })
    expect(p, String(mala)).toMatch(/inscripcionSecundaria/)
    expect(p).toMatch(/inscripcionPreparatoria/)
  }
  // La mensualidad de un plan mensual como objeto: saldría «Gratis» para un nivel.
  const obj = problemaDePrecios({ inscripcion: 599 }, [{ id: '6_meses', activa: true, mensualidad: { secundaria: 1000, preparatoria: 2000 } }])
  expect(obj).toMatch(/6_meses/)
  expect(obj).toMatch(/mensualidadSecundaria<n>Meses/)
  // null (plan semanal sin mensualidad) y 0 (pago único, como Habsburgo) no son objeto.
  expect(problemaDePrecios({ inscripcion: 599 }, [{ id: 'x', activa: true, mensualidad: null }])).toBeNull()
  expect(problemaDePrecios({ inscripcion: 399 }, [{ id: 'acceso', activa: true, mensualidad: 0 }])).toBeNull()
  // Un plan APAGADO no cuenta.
  expect(problemaDePrecios({ inscripcion: 599 }, [{ id: 'viejo', activa: false, mensualidad: { secundaria: 1 } }])).toBeNull()
})

test('6 bis. un nivel del programa sin NINGÚN plan se detecta (la tabla saldría vacía)', () => {
  // Forma ISFP: planes con nivel 'media' y 'licenciatura', que no son niveles del programa.
  const isfp = fabrica({}, [
    { ...PLANES_FABRICA[0], nivel: 'media' }, { ...PLANES_FABRICA[1], nivel: 'media' },
    { id: '12', label: 'Ejecutivo 12', meses: 12, mensualidad: 8990, materiasPorMes: 1, activa: true, nivel: 'licenciatura' },
  ])
  expect(nivelesSinPlanes(isfp, NIVELES)).toEqual(['secundaria', 'preparatoria'])
  expect(nivelesSinPlanes(fabrica({}, [{ ...PLANES_FABRICA[0], nivel: 'preparatoria' }]), NIVELES)).toEqual(['secundaria'])
  expect(nivelesSinPlanes(fabrica(), NIVELES)).toEqual([])
})

test('7. semanal con inscripción por nivel: $1,000 y $1,500', () => {
  const c = {
    periodicidad: 'semanal',
    niveles: NIVELES,
    modalidades: [
      { id: '3_meses', label: '3 Meses', nivel: 'secundaria', meses: 3, semanas: 12, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 4, activa: true },
      { id: '6_meses', label: '6 Meses', nivel: 'preparatoria', meses: 6, semanas: 24, cuotaSemanal: 350, mensualidad: 350, materiasPorMes: 2, activa: true },
    ],
    precios: { ...PRECIOS_FABRICA, inscripcion: 500, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500 },
  }
  const planes = planesSemanales(c, NIVELES, R(c.precios))
  expect(tablaPrecios(planes, NIVELES).filas[1]).toEqual(['Inscripción (pago único)', '$1,000', '$1,500'])
  expect(lineasPreciosWhatsApp(planes, NIVELES)).toContain('   Inscripción: $1,000')
  expect(lineasPreciosWhatsApp(planes, NIVELES)).toContain('   Inscripción: $1,500')
})

test('8. una clave null o 0 nunca imprime «Gratis» si la general cobra', () => {
  for (const vacia of [null, 0, undefined, -5, NaN]) {
    const t = tabla(fabrica({ inscripcionSecundaria: vacia, mensualidadSecundaria3Meses: vacia }))
    expect(JSON.stringify(t), String(vacia)).not.toContain('Gratis')
    expect(t.filas[0]).toEqual(['Inscripción (pago único)', '$599', '$599'])
  }
  // Solo la general en 0 es «Gratis» (el caso real de DPAZ / EDUHCO).
  expect(tabla(fabrica({ inscripcion: 0 })).filas[0]).toEqual(['Inscripción (pago único)', mxn(0), mxn(0)])
})

test('9. el generador usa el resolver único y ya no promete lo que no existe', () => {
  const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
  const gen = leer('scripts/entrega/generar-entrega.mjs')
  const sinComentarios = gen.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  expect(sinComentarios).toMatch(/const \{ inscripcionDe, mensualidadDe, certificacionDe \} =\s*await import\(pathToFileURL\(path\.join\(RAIZ, 'src\/lib\/precios-nivel\.ts'\)\)\.href\)/)
  expect(sinComentarios).toContain('const insc = (nivel) => inscripcionDe(nivel, CONFIG.precios)')
  expect(sinComentarios).toContain('const mens = (nivel, m) => mensualidadDe(nivel, m, CONFIG.precios)')
  expect(sinComentarios).toContain('const cert = (nivel) => certificacionDe(nivel, CONFIG.precios)')
  // Los resolvers propios y las lecturas que la plataforma no hace, fuera.
  for (const viejo of ['const porNivel', 'const rango', 'inscripcion_${', '_${meses}meses_normal', 'meses}meses_normal']) {
    expect(sinComentarios, viejo).not.toContain(viejo)
  }
  // El cableado: cada consumidor recibe los resolvers de la plataforma, y ninguno otro.
  for (const cable of [
    'const PRECIOS = { insc, mens, cert }',
    'frasesMensuales(CONFIG, nivelesPrograma, PRECIOS)',
    'tablaPreciosMensual(CONFIG, nivelesPrograma, PRECIOS)',
    'lineasPreciosMensualWhatsApp(CONFIG, nivelesPrograma, PRECIOS)',
    'filasModalidadesMensual(CONFIG, nivelesPrograma, { mens, ritmo: ritmoDeApertura })',
    'planesSemanales(CONFIG, nivelesPrograma, { insc, cert })',
  ]) expect(sinComentarios, cable).toContain(cable)
  // Ni el cruce niveles × modalidades en la rama mensual: `modalidadesActivas`
  // solo sirve para abortar sin planes, no para armar filas.
  expect(sinComentarios).not.toMatch(/nivelesPrograma\.(flatMap|map|forEach)\([^)]*=>\s*modalidadesActivas/)
  expect(sinComentarios).not.toMatch(/for \(const n of nivelesPrograma\)\s*\n\s*for \(const m of modalidadesActivas\)/)
  // Los dos abortos, cableados tal cual.
  expect(sinComentarios).toContain('const problemaPrecios = nivelesPrograma.length ? problemaDePrecios(CONFIG.precios, esSemanal(CONFIG) ? [] : modalidadesActivas) : null\nif (problemaPrecios) abortar(problemaPrecios)\n')
  expect(sinComentarios).toContain('const SIN_PLANES = esSemanal(CONFIG) || !modalidadesActivas.length ? [] : nivelesSinPlanes(CONFIG, nivelesPrograma)\nif (SIN_PLANES.length)\n  abortar(')
  // La nota nueva es verdad desde F2-6; la vieja prometía una sugerencia que no existe.
  const nota = frasesMensuales(fabrica(), NIVELES, R(fabrica().precios)).notaPrecios
  expect(nota).toContain('Al marcar la inscripción como pagada, el panel muestra la cifra del nivel del alumno. El monto de cada pago lo capturas tú.')
  expect(nota).not.toMatch(/sugiere|en el registro/)
  // «al instante»: la propia barra de publicar dice que tarda unos segundos.
  expect(gen).not.toContain('al instante')
  expect(leer('scripts/entrega/documento.mjs')).not.toContain('al instante')
})

test('10. el README nombra las claves reales y ya no documenta la forma de objeto', () => {
  const readme = readFileSync(join(process.cwd(), 'scripts/entrega/README.md'), 'utf8')
  expect(readme).toContain('inscripcionSecundaria')
  expect(readme).toContain('mensualidadSecundaria3Meses')
  expect(readme).not.toContain('las mismas claves que usa el registro')
  expect(readme).not.toMatch(/inscripcion: \{secundaria, preparatoria\}/)
})
