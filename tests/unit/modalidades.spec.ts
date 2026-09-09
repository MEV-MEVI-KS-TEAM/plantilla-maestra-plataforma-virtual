import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig, toPublicSiteConfig, type PublicSiteConfig } from '@/lib/site-config-core'
import {
  getModalidad,
  getMesesByModalidad,
  getMensualidadByModalidad,
  getModalidadesActivas,
  isModalidadActiva,
  getLabelByModalidad,
  getMateriasPorMesByModalidad,
  getDefaultModalidadId,
  getDuracionLabel,
  getPlanLabel,
  type ModalidadPrograma,
  desglosePlan,
} from '@/lib/modalidades'

/**
 * F3B — "precios con fuente única": los helpers de modalidades aceptan la
 * tabla YA FUSIONADA (config.ts + overrides de "Personalizar mi página").
 *
 * Dos invariantes:
 *
 *  1. SIN el parámetro nada cambia. Los ~144 clientes que clonan esta
 *     plantilla llaman a estos helpers desde 11 rutas de API y varias
 *     pantallas; si el default dejara de ser `CONFIG.modalidades`, cambiaría
 *     la ventana académica de todos ellos a la vez.
 *
 *  2. CON el parámetro mandan las modalidades del merge: apagar un plan desde
 *     el panel lo saca del catálogo comercial y cambiarle la mensualidad
 *     cambia el precio que se muestra — sin redeploy.
 *
 * ⚠️ Se importa de '@/lib/site-config-core' y NO de '@/lib/site-config':
 * aquél lleva `import 'server-only'`, que lanza fuera de un Server Component.
 */

/** Las modalidades del merge, tipadas como las recibe cualquier helper. */
function mods(overrides: unknown): readonly ModalidadPrograma[] {
  return mergeSiteConfig(CONFIG, overrides).modalidades
}

/** El programa de la plantilla trae 3_meses y 6_meses, las dos activas. */
const SIN_6 = mods({ modalidades: { '6_meses': { activa: false } } })
const SIN_3 = mods({ modalidades: { '3_meses': { activa: false } } })
const MENSUALIDAD_2500 = mods({ modalidades: { '3_meses': { mensualidad: 2500 } } })
const TODAS_INACTIVAS = mods({
  modalidades: { '3_meses': { activa: false }, '6_meses': { activa: false } },
})

// ─── 1. Sin parámetro: idéntico a antes ──────────────────────────────────────

test('1. sin parámetro los helpers siguen leyendo CONFIG.modalidades', () => {
  const activasConfig = CONFIG.modalidades.filter(m => m.activa)

  expect(getModalidadesActivas()).toEqual(activasConfig)
  expect(getDefaultModalidadId()).toBe(activasConfig[0].id)

  for (const m of activasConfig) {
    expect(getModalidad(m.id)).toEqual(m)
    expect(getMesesByModalidad(m.id)).toBe(m.meses)
    expect(getMensualidadByModalidad(m.id)).toBe(m.mensualidad)
    expect(getMateriasPorMesByModalidad(m.id)).toBe(m.materiasPorMes)
    expect(isModalidadActiva(m.id)).toBe(m.activa)
    expect(getLabelByModalidad(m.id)).toBe(m.label)
  }
})

test('1b. sin parámetro es lo mismo que pasar CONFIG.modalidades explícito', () => {
  // Blinda el default: si alguien lo cambia por otra tabla, esto se pone rojo.
  expect(getModalidadesActivas()).toEqual(getModalidadesActivas(CONFIG.modalidades))
  expect(getDuracionLabel()).toBe(getDuracionLabel(CONFIG.modalidades))
  expect(getDefaultModalidadId()).toBe(getDefaultModalidadId(CONFIG.modalidades))
})

test('1c. con overrides vacíos el merge no mueve ningún helper', () => {
  // El invariante sagrado de F1, visto desde estos helpers: site_config vacía
  // ⇒ la app se comporta EXACTAMENTE como config.ts.
  const vacio = mods({})
  expect(getModalidadesActivas(vacio)).toEqual(getModalidadesActivas())
  expect(getDuracionLabel(vacio)).toBe(getDuracionLabel())
  expect(getDefaultModalidadId(vacio)).toBe(getDefaultModalidadId())
  expect(getMensualidadByModalidad('3_meses', vacio)).toBe(getMensualidadByModalidad('3_meses'))
})

// ─── 2. `activa: false` desde el panel ───────────────────────────────────────

test('2. apagar 6_meses deja solo 3_meses en el catálogo', () => {
  const activas = getModalidadesActivas(SIN_6)
  expect(activas.map(m => m.id)).toEqual(['3_meses'])

  expect(isModalidadActiva('6_meses', SIN_6)).toBe(false)
  expect(getModalidad('6_meses', SIN_6)).toBeUndefined()
  // El label NO depende de `activa`: la UI de un alumno ya inscrito en el plan
  // retirado sigue pudiendo nombrarlo.
  expect(getLabelByModalidad('6_meses', SIN_6)).toBe('6 meses — Estándar')
})

test('2b. getDuracionLabel con una sola activa dice "3 meses"', () => {
  expect(getDuracionLabel(SIN_6)).toBe('3 meses')
  expect(getDuracionLabel(SIN_3)).toBe('6 meses')
  // Con las dos activas, la frase de siempre.
  expect(getDuracionLabel(mods({}))).toBe('3 o 6 meses')
})

test('2c. getPlanLabel quita el sufijo cuando solo queda un plan', () => {
  const tresMeses = mods({}).find(m => m.id === '3_meses')!
  // Sin competencia el "— Express" sobra.
  expect(getPlanLabel(tresMeses, SIN_6)).toBe('3 meses')
  // Con las dos activas se conserva el label completo de config.ts.
  expect(getPlanLabel(tresMeses, mods({}))).toBe('3 meses — Express')
})

test('2d. getDefaultModalidadId es la primera ACTIVA del merge', () => {
  expect(getDefaultModalidadId(SIN_6)).toBe('3_meses')
  expect(getDefaultModalidadId(SIN_3)).toBe('6_meses')
})

// ─── 3. Mensualidad editada desde el panel ───────────────────────────────────

test('3. getMensualidadByModalidad devuelve el precio del merge', () => {
  expect(getMensualidadByModalidad('3_meses', MENSUALIDAD_2500)).toBe(2500)
  // La otra modalidad no se toca.
  expect(getMensualidadByModalidad('6_meses', MENSUALIDAD_2500)).toBe(
    CONFIG.modalidades.find(m => m.id === '6_meses')!.mensualidad,
  )
  // Y CONFIG sigue intacto: el merge clona, nunca muta la base.
  expect(getMensualidadByModalidad('3_meses')).toBe(
    CONFIG.modalidades.find(m => m.id === '3_meses')!.mensualidad,
  )
})

test('3b. editar la mensualidad no toca meses ni materiasPorMes', () => {
  // Son el PRODUCTO, no el precio: no se editan desde el panel.
  expect(getMesesByModalidad('3_meses', MENSUALIDAD_2500)).toBe(3)
  expect(getMateriasPorMesByModalidad('3_meses', MENSUALIDAD_2500)).toBe(4)
})

// ─── 4. Config rota: los fallbacks siguen sin lanzar ─────────────────────────

test('4. con TODAS las modalidades inactivas los fallbacks aguantan', () => {
  // Un admin puede apagar los dos planes desde el panel. Nada debe lanzar y
  // los últimos recursos (3 meses / 0 / 2 materias) siguen en pie.
  expect(getModalidadesActivas(TODAS_INACTIVAS)).toEqual([])
  expect(getDuracionLabel(TODAS_INACTIVAS)).toBe('')
  expect(getMesesByModalidad('3_meses', TODAS_INACTIVAS)).toBe(3)
  expect(getMesesByModalidad(null, TODAS_INACTIVAS)).toBe(3)
  expect(getMensualidadByModalidad('3_meses', TODAS_INACTIVAS)).toBe(0)
  expect(getMateriasPorMesByModalidad('3_meses', TODAS_INACTIVAS)).toBe(2)
  expect(getDefaultModalidadId(TODAS_INACTIVAS)).toBe('6_meses')
  expect(isModalidadActiva('3_meses', TODAS_INACTIVAS)).toBe(false)
  expect(getModalidad('3_meses', TODAS_INACTIVAS)).toBeUndefined()
})

test('4b. id nulo o desconocido cae al fallback, no lanza', () => {
  expect(getModalidad(null, SIN_6)).toBeUndefined()
  expect(getLabelByModalidad(null, SIN_6)).toBe('')
  expect(getLabelByModalidad('99_meses', SIN_6)).toBe('99_meses')
  expect(isModalidadActiva(undefined, SIN_6)).toBe(false)
  // Fallback = primera ACTIVA del merge (3_meses: 3 meses, 4 materias).
  expect(getMesesByModalidad('99_meses', SIN_6)).toBe(3)
  expect(getMateriasPorMesByModalidad('99_meses', SIN_6)).toBe(4)
})

// ─── 5. El tipo del merge encaja sin cast ────────────────────────────────────

test('5. PublicSiteConfig["modalidades"] es asignable a ModalidadPrograma[]', () => {
  // La comprobación real la hace tsc (este archivo no compila si deja de
  // serlo): `PublicSiteConfig` es DeepReadonly, y es lo que reciben la landing
  // y todo componente cliente vía useSiteConfig(). Aquí se deja además
  // constancia en tiempo de ejecución de la forma.
  const publica: PublicSiteConfig['modalidades'] = toPublicSiteConfig(mergeSiteConfig(CONFIG, {})).modalidades
  const tabla: readonly ModalidadPrograma[] = publica
  expect(getModalidadesActivas(tabla)).toEqual(getModalidadesActivas())
  for (const m of tabla) {
    expect(typeof m.id).toBe('string')
    expect(typeof m.label).toBe('string')
    expect(typeof m.meses).toBe('number')
    expect(typeof m.mensualidad).toBe('number')
    expect(typeof m.materiasPorMes).toBe('number')
    expect(typeof m.activa).toBe('boolean')
  }
})

// ─── desglosePlan: lo que ve el aspirante antes de inscribirse ───────────────

test('6. desglosePlan suma inscripción + meses × mensualidad', () => {
  const m3 = { id: '3_meses', meses: 3, mensualidad: 2000 }
  const d = desglosePlan('preparatoria', m3, { inscripcion: 599 })
  expect(d).toEqual({ inscripcion: 599, mensualidad: 2000, meses: 3, total: 599 + 3 * 2000 })
})

test('6b. con tarifa por nivel, cada nivel ve la suya (el caso Moreta IED)', () => {
  const precios = {
    inscripcion: 1000,
    inscripcionSecundaria: 1000,
    inscripcionPreparatoria: 1500,
    secundaria_3meses_normal: 1500,
    secundaria_6meses_normal: 900,
  }
  const m3 = { id: '3_meses', meses: 3, mensualidad: 4900 }  // mensualidad = prepa
  const m6 = { id: '6_meses', meses: 6, mensualidad: 2900 }

  expect(desglosePlan('secundaria',   m3, precios)).toEqual({ inscripcion: 1000, mensualidad: 1500, meses: 3, total: 5500 })
  expect(desglosePlan('secundaria',   m6, precios)).toEqual({ inscripcion: 1000, mensualidad:  900, meses: 6, total: 6400 })
  expect(desglosePlan('preparatoria', m3, precios)).toEqual({ inscripcion: 1500, mensualidad: 4900, meses: 3, total: 16200 })
  expect(desglosePlan('preparatoria', m6, precios)).toEqual({ inscripcion: 1500, mensualidad: 2900, meses: 6, total: 18900 })
})

test('6c. sin claves por nivel cae a la tarifa única: las escuelas de siempre no cambian', () => {
  const m6 = { id: '6_meses', meses: 6, mensualidad: 1000 }
  const soloUna = { inscripcion: 599 }
  expect(desglosePlan('secundaria', m6, soloUna)).toEqual(desglosePlan('preparatoria', m6, soloUna))
  expect(desglosePlan('secundaria', m6, soloUna).total).toBe(599 + 6 * 1000)
})
