import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig } from '@/lib/site-config-core'
import { costoProgramaAlumno } from '@/lib/costo-programa'
import { inscripcionDelAlumno, certificacionDelAlumno, tablaLicenciaturas } from '@/lib/licenciatura-utils'
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
  carreras: [{ slug: 'derecho', nombre: 'Derecho' }],
  modalidades: [
    { id: '12_meses', label: 'Regular 12 meses', meses: 12, mensualidad: 1450, materiasPorMes: 3, activa: true },
    { id: '9_meses', label: 'Intensivo', meses: 9, mensualidad: 1900, materiasPorMes: 4, activa: false },
    { id: '6_meses_lic', label: 'Gratis', meses: 6, mensualidad: 0, materiasPorMes: 5, activa: true },
  ],
}
const cfg = (lic: unknown, precios: unknown = { inscripcion: 800 }) => ({ precios, licenciaturas: lic })

test('1. el costo: inscripción + mensualidad × meses + titulación, del plan del alumno', () => {
  expect(costoProgramaAlumno('licenciatura', '12_meses', cfg(LIC))).toEqual({
    modalidadId: '12_meses', plan: 'Regular 12 meses', meses: 12, mensualidad: 1450,
    inscripcion: 1500, colegiatura: 17400, titulacion: 25000, total: 43900,
  })
  // Un plan que el admin apagó DESPUÉS: el alumno lo sigue pagando, se muestra.
  expect(costoProgramaAlumno('licenciatura', '9_meses', cfg(LIC))?.total).toBe(1500 + 9 * 1900 + 25000)
})

test('2. null en vez de inventar: otro nivel, sin plan, add-on apagado, plan sin precio o cifras que no son números', () => {
  for (const nivel of ['secundaria', 'preparatoria', 'diplomado', null, undefined]) {
    expect(costoProgramaAlumno(nivel, '12_meses', cfg(LIC)), String(nivel)).toBeNull()
  }
  expect(costoProgramaAlumno('licenciatura', null, cfg(LIC))).toBeNull()
  expect(costoProgramaAlumno('licenciatura', 'no-existe', cfg(LIC))).toBeNull()
  expect(costoProgramaAlumno('licenciatura', '12_meses', cfg({ ...LIC, activas: false }))).toBeNull()
  expect(costoProgramaAlumno('licenciatura', '12_meses', cfg(undefined))).toBeNull()
  // Mensualidad 0 (la página no lo vende): no hay colegiatura que anunciar.
  expect(costoProgramaAlumno('licenciatura', '6_meses_lic', cfg(LIC))).toBeNull()
  // Formas propias: una mensualidad por moneda, meses en texto.
  const raro = { ...LIC, modalidades: [{ id: '12_meses', label: 'x', meses: '12', mensualidad: { MXN: 1450 } }] }
  expect(costoProgramaAlumno('licenciatura', '12_meses', cfg(raro))).toBeNull()
  // Nunca NaN en ningún campo.
  const r = costoProgramaAlumno('licenciatura', '12_meses', cfg({ ...LIC, inscripcion: { MXN: 1 }, certificacion: 'mucho' }))
  for (const v of Object.values(r ?? {})) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true)
})

test('3. la MISMA lectura que la ficha: inscripción y titulación por inscripcionDelAlumno / certificacionDelAlumno', () => {
  for (const lic of [LIC, { ...LIC, inscripcion: { MXN: 1500 } }, { ...LIC, certificacion: undefined }]) {
    const c = cfg(lic)
    const r = costoProgramaAlumno('licenciatura', '12_meses', c)!
    expect(r.inscripcion).toBe(inscripcionDelAlumno('licenciatura', c.precios as never, tablaLicenciaturas(c)))
    expect(r.titulacion).toBe(certificacionDelAlumno('licenciatura', c.precios as never, tablaLicenciaturas(c)))
  }
})

test('4. con lo PUBLICADO: la mensualidad, la inscripción y la titulación del panel', () => {
  const c = CONFIG as unknown as { licenciaturas?: unknown }
  const antes = c.licenciaturas
  c.licenciaturas = LIC
  try {
    const publicado = { licenciaturas: { inscripcion: 1777, certificacion: 30000, modalidades: { '12_meses': { mensualidad: 1600 } } } }
    const r = costoProgramaAlumno('licenciatura', '12_meses', mergeSiteConfig(CONFIG as never, publicado))!
    expect(r).toMatchObject({ inscripcion: 1777, mensualidad: 1600, colegiatura: 19200, titulacion: 30000, total: 1777 + 19200 + 30000 })
    // Sin nada publicado, config.ts.
    expect(costoProgramaAlumno('licenciatura', '12_meses', mergeSiteConfig(CONFIG as never, {}))?.total).toBe(43900)
  } finally {
    c.licenciaturas = antes
  }
})

test('5. los renglones: mensual con «al mes», semanal sin él; titulación aparte y sin decir cuándo se paga', () => {
  const p = costoProgramaAlumno('licenciatura', '12_meses', cfg(LIC))!
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
  expect(pagos).toContain('programa:      costoProgramaAlumno(nivel, alumno?.modalidad ?? null, cfg),')
  expect(pagos).toContain(".select('nivel, modalidad, inscripcion_pagada, matricula')")
  const perfil = sinComentarios(leer('src/app/api/alumno/perfil/route.ts'))
  // getSiteConfig solo en la rama de licenciatura.
  const fn = perfil.slice(perfil.indexOf('async function programaDe('))
  expect(fn.indexOf("if (nivel !== 'licenciatura') return null")).toBeGreaterThan(0)
  expect(fn.indexOf("if (nivel !== 'licenciatura') return null")).toBeLessThan(fn.indexOf('await getSiteConfig()'))
  expect(perfil.match(/programa:\s+await programaDe\(/g)?.length).toBe(2)
  const inicio = sinComentarios(leer('src/app/(dashboard)/alumno/page.tsx'))
  expect(inicio).toMatch(/\{!demo && !esSemanal\(\) && perfil\.programa && \(\s*<CostoProgramaCard programa=\{perfil\.programa\} semanal=\{false\} \/>/)
  const mis = sinComentarios(leer('src/app/(dashboard)/alumno/pagos/page.tsx'))
  const sinCal = mis.slice(mis.indexOf('if (!datos || !datos.periodicidad) {'), mis.indexOf('const { resumen, semanas } = datos'))
  expect(sinCal).toMatch(/\{datos\?\.programa && \([\s\S]*?<CostoProgramaCard programa=\{datos\.programa\} semanal \/>/)
})
