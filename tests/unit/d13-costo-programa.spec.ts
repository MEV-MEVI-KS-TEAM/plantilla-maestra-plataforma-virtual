import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig } from '@/lib/site-config-core'
import { costoProgramaAlumno } from '@/lib/costo-programa'
import { inscripcionDelAlumno, certificacionDelAlumno, getDesgloseLicenciatura, tablaLicenciaturas } from '@/lib/licenciatura-utils'
import { CostoProgramaCard, renglonesCostoPrograma } from '@/components/alumno/CostoProgramaCard'
import { formatoMXN } from '@/lib/formato'

/**
 * Bloque D · D13 — #202 (decisión 22): el alumno de LICENCIATURA ve cuánto
 * cuesta su programa, con lo publicado y con la misma lectura que la ficha.
 *  - Mensual: tarjeta en el inicio (/alumno/pagos sigue redirigido).
 *  - Semanal: tarjeta en «Mis pagos», sin «al mes».
 *  - La titulación en su renglón y sin decir cuándo se paga. Nunca NaN.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const LIC = {
  activas: true,
  inscripcion: 1500,
  certificacion: 25000,
  carreras: [{ slug: 'derecho', nombre: 'Derecho' }, { slug: 'docencia', nombre: 'Docencia', esDiplomado: true }],
  modalidades: [
    { id: '12_meses', label: 'Regular 12 meses', meses: 12, mensualidad: 1450, materiasPorMes: 3, activa: true },
    { id: '9_meses', label: 'Intensivo', meses: 9, mensualidad: 1900, materiasPorMes: 4, activa: false },
    { id: '6_meses_lic', label: 'Gratis', meses: 6, mensualidad: 0, materiasPorMes: 5, activa: true },
    { id: '6_meses_dip', label: 'Diplomado', meses: 6, mensualidad: 900, materiasPorMes: 5, activa: true },
  ],
}
const cfg = (lic: unknown, precios: unknown = { inscripcion: 800 }) => ({ precios, licenciaturas: lic })
const lic = (modalidad: string | null, carrera: string | null = 'derecho') => ({ nivel: 'licenciatura', modalidad, carrera })

test('1. el costo: inscripción + mensualidad × meses + titulación, del plan del alumno', () => {
  expect(costoProgramaAlumno(lic('12_meses'), cfg(LIC))).toEqual({
    modalidadId: '12_meses', plan: 'Regular 12 meses', meses: 12, mensualidad: 1450,
    inscripcion: 1500, colegiatura: 17400, titulacion: 25000, total: 43900,
  })
  // Sin carrera (alumno viejo): se calcula igual.
  expect(costoProgramaAlumno(lic('12_meses', null), cfg(LIC))?.total).toBe(43900)
})

test('2. null en vez de un total equivocado: otro nivel, sin plan, add-on apagado, plan sin precio o apagado', () => {
  for (const nivel of ['secundaria', 'preparatoria', 'diplomado', null, undefined]) {
    expect(costoProgramaAlumno({ nivel, modalidad: '12_meses', carrera: null }, cfg(LIC)), String(nivel)).toBeNull()
  }
  expect(costoProgramaAlumno(lic(null), cfg(LIC))).toBeNull()
  expect(costoProgramaAlumno(lic('no-existe'), cfg(LIC))).toBeNull()
  expect(costoProgramaAlumno(lic('12_meses'), cfg({ ...LIC, activas: false }))).toBeNull()
  expect(costoProgramaAlumno(lic('12_meses'), cfg(undefined))).toBeNull()
  // Mensualidad 0 (la página no lo vende): no hay colegiatura que anunciar.
  expect(costoProgramaAlumno(lic('6_meses_lic'), cfg(LIC))).toBeNull()
  // Plan apagado en config.ts: lo publicado ya no se le aplica; mejor nada que otro precio.
  expect(costoProgramaAlumno(lic('9_meses'), cfg(LIC))).toBeNull()
})

test('2b. el diplomado montado en el riel no tiene «título y cédula»: sin tarjeta', () => {
  // Carrera de diplomado (esDiplomado) con un plan de licenciatura, o un plan *_dip.
  expect(costoProgramaAlumno(lic('12_meses', 'docencia'), cfg(LIC))).toBeNull()
  expect(costoProgramaAlumno(lic('6_meses_dip', 'docencia'), cfg(LIC))).toBeNull()
  expect(costoProgramaAlumno(lic('6_meses_dip'), cfg(LIC))).toBeNull()
})

test('2c. formas propias del add-on: sin tarjeta (su precio se calcula de otra manera)', () => {
  const casos: Record<string, unknown> = {
    'titulación por moneda': { ...LIC, certificacion: { MXN: 25000 } },
    'titulación en texto': { ...LIC, certificacion: 'mucho' },
    'inscripción por moneda': { ...LIC, inscripcion: { MXN: 1500 } },
    'sin inscripción declarada': { ...LIC, inscripcion: undefined },
    'titulacionIncluida': { ...LIC, titulacionIncluida: true },
    'rutas': { ...LIC, rutas: [{ id: 'x' }] },
    'precio por carrera': { ...LIC, carreras: [{ slug: 'derecho', nombre: 'Derecho', precio: 1000 }] },
    'plan con total': { ...LIC, modalidades: [{ ...LIC.modalidades[0], total: 20000 }] },
    'mensualidad por moneda': { ...LIC, modalidades: [{ ...LIC.modalidades[0], mensualidad: { MXN: 1450 } }] },
    'meses en texto': { ...LIC, modalidades: [{ ...LIC.modalidades[0], meses: '12' }] },
  }
  for (const [nombre, l] of Object.entries(casos)) expect(costoProgramaAlumno(lic('12_meses'), cfg(l)), nombre).toBeNull()
})

test('3. la MISMA cifra que la ficha (inscripcionDelAlumno / certificacionDelAlumno) y que la landing', () => {
  for (const l of [LIC, { ...LIC, inscripcion: 0 }, { ...LIC, certificacion: 0 }]) {
    const c = cfg(l)
    const r = costoProgramaAlumno(lic('12_meses'), c)!
    expect(r.inscripcion).toBe(inscripcionDelAlumno('licenciatura', c.precios as never, tablaLicenciaturas(c)))
    expect(r.titulacion).toBe(certificacionDelAlumno('licenciatura', c.precios as never, tablaLicenciaturas(c)))
    // La landing: el desglose de ese plan.
    expect(r.total).toBe(getDesgloseLicenciatura('12_meses', tablaLicenciaturas(c) as never)!.total)
  }
})

test('4. con lo PUBLICADO: la mensualidad, la inscripción y la titulación del panel', () => {
  const c = CONFIG as unknown as { licenciaturas?: unknown }
  const antes = c.licenciaturas
  c.licenciaturas = LIC
  try {
    const publicado = { licenciaturas: { inscripcion: 1777, certificacion: 30000, modalidades: { '12_meses': { mensualidad: 1600 } } } }
    const r = costoProgramaAlumno(lic('12_meses'), mergeSiteConfig(CONFIG as never, publicado))!
    expect(r).toMatchObject({ inscripcion: 1777, mensualidad: 1600, colegiatura: 19200, titulacion: 30000, total: 1777 + 19200 + 30000 })
    // Sin nada publicado, config.ts.
    expect(costoProgramaAlumno(lic('12_meses'), mergeSiteConfig(CONFIG as never, {}))?.total).toBe(43900)
  } finally {
    c.licenciaturas = antes
  }
})

test('5. los renglones: mensual con «al mes», semanal sin él; titulación aparte y sin decir cuándo se paga', () => {
  const p = costoProgramaAlumno(lic('12_meses'), cfg(LIC))!
  const mensual = renglonesCostoPrograma(p, false)
  expect(mensual).toEqual([
    ['Inscripción', formatoMXN(1500)],
    [`Colegiatura: ${formatoMXN(1450)} al mes × 12 meses`, formatoMXN(17400)],
    ['Titulación (título y cédula profesional)', formatoMXN(25000)],
  ])
  const semanal = renglonesCostoPrograma(p, true)
  expect(semanal[1]).toEqual(['Colegiatura del plan de 12 meses', formatoMXN(17400)])
  expect(JSON.stringify(semanal)).not.toMatch(/al mes|mensual/i)
  for (const filas of [mensual, semanal]) expect(JSON.stringify(filas)).not.toMatch(/al concluir|se paga|al terminar/i)
  // Inscripción y titulación en 0 no se pintan.
  const sinExtras = renglonesCostoPrograma({ ...p, inscripcion: 0, titulacion: 0, total: p.colegiatura }, false)
  expect(sinExtras.map(f => f[0])).toEqual([`Colegiatura: ${formatoMXN(1450)} al mes × 12 meses`])
})

test('6. la tarjeta pinta exactamente esos renglones y el total', () => {
  // El runner de pruebas transforma el JSX de los .tsx para sus pruebas de
  // componentes: no se puede renderizar aquí. La tarjeta no decide nada: pinta
  // renglonesCostoPrograma (probado arriba) y el total.
  expect(typeof CostoProgramaCard).toBe('function')
  const card = sinComentarios(leer('src/components/alumno/CostoProgramaCard.tsx'))
  const cuerpo = card.slice(card.indexOf('export function CostoProgramaCard('))
  expect(cuerpo).toContain('{renglonesCostoPrograma(programa, semanal).map(([concepto, monto]) => (')
  expect(cuerpo).toContain('Total del programa')
  expect(cuerpo).toContain('{formatoMXN(programa.total)}')
  expect(cuerpo).toContain('Plan {programa.plan}')
})

test('7. el cableado: /api/alumno/pagos y /api/alumno/perfil lo devuelven; mensual en el inicio, semanal en «Mis pagos»', () => {
  const pagos = sinComentarios(leer('src/app/api/alumno/pagos/route.ts'))
  expect(pagos).toContain('programa:      costoProgramaAlumno({ nivel, modalidad: alumno?.modalidad, carrera: alumno?.carrera }, cfg),')
  // '*': la carrera (para reconocer el diplomado del riel) no existe en toda base.
  expect(pagos).toMatch(/\.from\('alumnos'\)\s*\.select\('\*'\)/)
  const perfil = sinComentarios(leer('src/app/api/alumno/perfil/route.ts'))
  // getSiteConfig solo en la rama de licenciatura.
  const fn = perfil.slice(perfil.indexOf('async function programaDe('))
  expect(fn.indexOf("if (a.nivel !== 'licenciatura') return null")).toBeGreaterThan(0)
  expect(fn.indexOf("if (a.nivel !== 'licenciatura') return null")).toBeLessThan(fn.indexOf('await getSiteConfig()'))
  expect(perfil.match(/programa:\s+await programaDe\(/g)?.length).toBe(2)
  const inicio = sinComentarios(leer('src/app/(dashboard)/alumno/page.tsx'))
  expect(inicio).toMatch(/\{!demo && !esSemanal\(\) && perfil\.programa && \(\s*<CostoProgramaCard programa=\{perfil\.programa\} semanal=\{false\} \/>/)
  const mis = sinComentarios(leer('src/app/(dashboard)/alumno/pagos/page.tsx'))
  const sinCal = mis.slice(mis.indexOf('if (!datos || !datos.periodicidad) {'), mis.indexOf('const { resumen, semanas } = datos'))
  expect(sinCal).toMatch(/\{datos\?\.programa && \([\s\S]*?<CostoProgramaCard programa=\{datos\.programa\} semanal \/>/)
})
