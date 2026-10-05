import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { getModalidadesDiplomado, getModalidadesLicenciatura } from '@/lib/modalidades'
import { getCarrerasDiplomado, getCarrerasLicenciatura, precioDiplomado } from '@/lib/licenciatura-utils'

/**
 * Diplomados de preparación CONOCER en el MISMO riel que una licenciatura
 * (#212, #222, #254). La plantilla trae el add-on apagado:
 * aquí se enciende un riel de ejemplo (y se restaura) para que las reglas corran.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const cfg = CONFIG as unknown as { licenciaturas: unknown }
const ANTES = cfg.licenciaturas
const RIEL = {
  activas: true, inscripcion: 1500, certificacion: 38000,
  carreras: [
    { slug: 'derecho', nombre: 'Licenciatura en Derecho', cuatrimestres: 8, totalMaterias: 32, icono: 'Scale', desc: '', incluye: [] },
    { slug: 'diplomado-x', nombre: 'Diplomado X', cuatrimestres: 8, totalMaterias: 24, icono: 'Users', desc: '', incluye: [], esDiplomado: true, precio: { publico: 3500 } },
  ],
  modalidades: [
    { id: '12_meses', label: 'Plan 12 meses', sublabel: '12 meses', meses: 12, mensualidad: 1450, activa: true, materiasPorMes: 2.67 },
    { id: '18_meses', label: 'Plan 18 meses', sublabel: '18 meses', meses: 18, mensualidad: 1050, activa: true, materiasPorMes: 1.78 },
    { id: '3_meses_dip', label: 'Plan 3 meses', sublabel: '3 meses', meses: 3, mensualidad: 0, activa: true, materiasPorMes: 0, soloDiplomado: true },
    { id: '6_meses_dip', label: 'Plan 6 meses', sublabel: '6 meses', meses: 6, mensualidad: 0, activa: true, materiasPorMes: 0, soloDiplomado: true },
  ],
}
test.beforeEach(() => { cfg.licenciaturas = RIEL })
test.afterEach(() => { cfg.licenciaturas = ANTES })

test('1. getModalidadesLicenciatura: con carrera filtra por programa; con objeto o sin argumento, todas', () => {
  expect(getModalidadesLicenciatura('derecho').map(m => m.id)).toEqual(['12_meses', '18_meses'])
  expect(getModalidadesLicenciatura(null).map(m => m.id)).toEqual(['12_meses', '18_meses'])
  expect(getModalidadesLicenciatura('diplomado-x').map(m => m.id)).toEqual(['3_meses_dip', '6_meses_dip'])
  expect(getModalidadesLicenciatura().map(m => m.id)).toHaveLength(4)
  expect(getModalidadesLicenciatura(RIEL).map(m => m.id)).toHaveLength(4)
  expect(getModalidadesDiplomado().map(m => m.id)).toEqual(['3_meses_dip', '6_meses_dip'])
})

test('2. el diplomado no aparece entre las licenciaturas y cobra SU precio, no la inscripción', () => {
  expect(getCarrerasLicenciatura().map(c => c.slug)).toEqual(['derecho'])
  expect(getCarrerasDiplomado().map(c => c.slug)).toEqual(['diplomado-x'])
  expect(precioDiplomado('diplomado-x')).toBe(3500)
})

test('3. la migración admite los _dip SIN perder 6_meses_lic, en un solo bloque, antes de fix255', () => {
  const m = leer('supabase/migrations/20260926120000_modalidades_diplomado.sql')
  for (const id of ['3_meses_dip', '6_meses_dip', '6_meses_lic', '12_meses', '18_meses']) expect(m).toContain(`'${id}'`)
  expect(m).toMatch(/^BEGIN;/m)
  expect(m).toMatch(/^COMMIT;/m)
  expect(m).toContain("WHEN '6_meses_dip' THEN 6")
})

test('4. register-complete rechaza un plan que no es del programa; la entrega no suma pagos únicos a la licenciatura', () => {
  expect(leer('src/app/api/auth/register-complete/route.ts')).toContain('getModalidadesLicenciatura(carrera).some(m => m.id === modalidad)')
  expect(leer('scripts/entrega/licenciaturas.mjs')).toContain('m.soloDiplomado !== true')
})
