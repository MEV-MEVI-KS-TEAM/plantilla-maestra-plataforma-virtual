import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'
import { LIMITES_LIC, bloqueLicEditable, inscripcionLicEditable, planesLicEditables, titulacionLicEditable } from '@/lib/precios-licenciatura'
import { rangoMateriasDelMes } from '@/lib/acceso-materias'
import { getDesglosesLicenciatura } from '@/lib/licenciatura-utils'

/**
 * Bloque B, B4 — precios SUGERIDOS de licenciatura en el config.ts de la
 * plantilla: el paquete que ya venden varias escuelas de la flota. Con el
 * add-on apagado no se ven; al encenderlo, la tarjeta «Licenciaturas» los edita.
 *
 * Solo en la PLANTILLA: cada clon trae su propia tabla (o ninguna).
 */

type Plan = { id: string; label: string; sublabel: string; meses: number; mensualidad: number; activa: boolean; materiasPorMes: number }
type Tabla = { activas: boolean; inscripcion: number; certificacion: number; carreras: readonly unknown[]; modalidades: readonly Plan[] }
const lic = () => (CONFIG as unknown as { licenciaturas: Tabla }).licenciaturas
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')

test.skip(!ES_PLANTILLA, 'Los sugeridos son de la plantilla; cada clon trae su tabla.')

test('1. los sugeridos: inscripción 1,500 · 6 meses 2,500 · 12 meses 1,450 · 18 meses 1,050 · titulación 38,000', () => {
  const l = lic()
  expect(l.activas).toBe(false) // el add-on sigue apagado: la plantilla no cambia para nadie
  expect(l.inscripcion).toBe(1500)
  expect(l.certificacion).toBe(38000)
  expect(l.modalidades.map((m) => [m.id, m.meses, m.mensualidad, m.activa])).toEqual([
    ['6_meses_lic', 6, 2500, true],
    ['12_meses', 12, 1450, true],
    ['18_meses', 18, 1050, true],
  ])
  // Nunca por periodos de cuatro meses: por su duración.
  for (const m of l.modalidades) {
    expect(m.sublabel).toBe(`${m.meses} meses`)
    expect(`${m.label} ${m.sublabel}`).not.toMatch(/cuatrimestr/i)
  }
})

test('2. el plan de 6 meses usa su propio id, nunca el de Sec/Prepa (B5)', () => {
  // '6_meses' es el plan del programa: un alumno de licenciatura heredaría su
  // ritmo y su precio (Bug 121). El de licenciatura es '6_meses_lic', que la
  // migración 20260925120000 (y scripts/schema.sql) admiten.
  const seis = lic().modalidades.filter((m) => m.meses === 6)
  expect(seis.map((m) => m.id)).toEqual(['6_meses_lic'])
  expect(lic().modalidades.some((m) => m.id === '6_meses')).toBe(false)
  expect(seis[0].materiasPorMes).toBe(5.34)
})

test('3. cada plan cabe en el CHECK de alumnos.modalidad del instalador', () => {
  // Un id fuera del CHECK hace fallar el alta con 23514 y la ruta borra el
  // usuario de Auth que acababa de crear (Bug 68).
  const schema = leer('scripts/schema.sql')
  const m = /CONSTRAINT alumnos_modalidad_check CHECK \(\(modalidad IS NULL OR modalidad = ANY \(ARRAY\[([^\]]+)\]\)\)\)/.exec(schema)
  expect(m, 'no encontré el CHECK en scripts/schema.sql').not.toBeNull()
  const admitidos = [...m![1].matchAll(/'([^']+)'::text/g)].map((x) => x[1])
  for (const p of lic().modalidades) expect(admitidos, p.id).toContain(p.id)
})

test('4. el ritmo abre las 32 materias de una carrera del banco en el último mes', () => {
  // Con la ventana REAL de acceso-materias.ts: en el mes n se abren los índices
  // [desde, hasta] (base 0) de las materias regulares.
  for (const m of lic().modalidades) {
    const ultimo = rangoMateriasDelMes(m.meses, m.materiasPorMes)
    expect(ultimo.hasta, `${m.id}: mes ${m.meses}`).toBeGreaterThanOrEqual(31) // la materia 32 abre en el último mes
    const penultimo = rangoMateriasDelMes(m.meses - 1, m.materiasPorMes)
    expect(penultimo.hasta, `${m.id}: mes ${m.meses - 1}`).toBeLessThan(31) // y no antes
    // Ningún mes se queda sin materia nueva.
    for (let mes = 1; mes <= m.meses; mes++) {
      const r = rangoMateriasDelMes(mes, m.materiasPorMes)
      expect(r.hasta, `${m.id}: mes ${mes}`).toBeGreaterThanOrEqual(r.desde)
    }
  }
})

test('5. al encender el add-on con una carrera, la tarjeta los edita y la landing arma su desglose', () => {
  const encendida = { ...lic(), activas: true, carreras: [{ slug: 'derecho', nombre: 'Licenciatura en Derecho' }] }
  // Forma estándar: la tarjeta «Licenciaturas» los muestra como campos.
  expect(bloqueLicEditable(encendida)).toBe(true)
  expect(inscripcionLicEditable(encendida)).toBe(true)
  expect(titulacionLicEditable(encendida)).toBe(true)
  expect(planesLicEditables(encendida).map((p) => p.id)).toEqual(['6_meses_lic', '12_meses', '18_meses'])
  // Dentro de lo que el panel publica.
  const l = lic()
  expect(l.inscripcion).toBeGreaterThanOrEqual(LIMITES_LIC.min)
  expect(l.inscripcion).toBeLessThanOrEqual(LIMITES_LIC.precioMax)
  expect(l.certificacion).toBeLessThanOrEqual(LIMITES_LIC.titulacionMax)
  for (const m of l.modalidades) expect(m.mensualidad).toBeLessThanOrEqual(LIMITES_LIC.precioMax)
  // El costo completo que anunciaría la landing.
  expect(getDesglosesLicenciatura(encendida).map((d) => [d.modalidadId, d.total])).toEqual([
    ['6_meses_lic', 1500 + 6 * 2500 + 38000],
    ['12_meses', 1500 + 12 * 1450 + 38000],
    ['18_meses', 1500 + 18 * 1050 + 38000],
  ])
})
