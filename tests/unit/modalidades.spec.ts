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
  getPlanLabelPublico,
  getPlanLabelConDuracion,
  getTotalPlan,
  type ModalidadPrograma,
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

/**
 * Las modalidades con un rótulo COMPUESTO ("3 meses — Express"), pase lo que
 * pase en el `config.ts` de este repo.
 *
 * `getPlanLabel` recorta el sufijo tras el guion largo cuando solo queda un
 * plan, y las pruebas de esa regla necesitan un label que TENGA sufijo. La
 * plantilla lo trae de fábrica, pero estas mismas pruebas corren en los ~144
 * clones, y una escuela que venda "3 Meses" a secas —como SAMEX (#199)— las
 * dejaba en rojo sin tener ningún problema. La premisa se construye aquí en
 * vez de darla por supuesta.
 */
const CON_SUFIJO = mods({}).map(m => ({
  ...m,
  label: `${m.meses} meses — ${m.meses === 3 ? 'Express' : 'Estándar'}`,
})) as readonly ModalidadPrograma[]

/** Los mismos rótulos compuestos, con 6_meses apagado. */
const CON_SUFIJO_SIN_6 = CON_SUFIJO.map(m => (m.id === '6_meses' ? { ...m, activa: false } : m))

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
  // retirado sigue pudiendo nombrarlo. Se comprueba contra la tabla que se le
  // pasa, no contra un literal del config de este repo.
  expect(getLabelByModalidad('6_meses', SIN_6))
    .toBe(SIN_6.find(m => m.id === '6_meses')!.label)
  expect(getLabelByModalidad('6_meses', CON_SUFIJO_SIN_6)).toBe('6 meses — Estándar')
})

test('2b. getDuracionLabel con una sola activa dice "3 meses"', () => {
  expect(getDuracionLabel(SIN_6)).toBe('3 meses')
  expect(getDuracionLabel(SIN_3)).toBe('6 meses')
  // Con las dos activas, la frase de siempre.
  expect(getDuracionLabel(mods({}))).toBe('3 o 6 meses')
})

test('2c. getPlanLabel quita el sufijo cuando solo queda un plan', () => {
  const tresMeses = CON_SUFIJO.find(m => m.id === '3_meses')!
  // Sin competencia el "— Express" sobra.
  expect(getPlanLabel(tresMeses, CON_SUFIJO_SIN_6)).toBe('3 meses')
  // Con las dos activas se conserva el label completo.
  expect(getPlanLabel(tresMeses, CON_SUFIJO)).toBe('3 meses — Express')

  // Y un label SIN sufijo se devuelve intacto en los dos casos: una escuela
  // que vende "3 Meses" a secas no pierde su rótulo al apagar el otro plan.
  const simple = { ...tresMeses, label: '3 Meses' }
  expect(getPlanLabel(simple, [simple])).toBe('3 Meses')
  expect(getPlanLabel(simple, CON_SUFIJO)).toBe('3 Meses')
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

// ─── Rótulo público y total del plan (#198) ──────────────────────────────────

test('getPlanLabelPublico: sin labelPublico devuelve exactamente lo de siempre', () => {
  // INVARIANTE de la flota: ~144 escuelas no lo declaran y su landing no cambia.
  const mods = [
    { id: '3_meses', label: '3 meses — Express',  meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 meses — Estándar', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
  ]
  for (const m of mods) {
    expect(getPlanLabelPublico(m, mods)).toBe(getPlanLabel(m, mods))
  }
})

test('getPlanLabelPublico: con labelPublico, la landing dice el comercial y el resto el interno', () => {
  // GRATIA (#198): "Express"/"Regular" de cara al público, "3 Meses"/"6 Meses"
  // en registro, pagos y constancias — el alumno firma una duración.
  const mods = [
    { id: '3_meses', label: '3 Meses', labelPublico: 'Express', meses: 3, mensualidad: 300, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 Meses', labelPublico: 'Regular', meses: 6, mensualidad: 150, materiasPorMes: 2, activa: true },
  ]
  expect(getPlanLabelPublico(mods[0], mods)).toBe('Express')
  expect(getPlanLabelPublico(mods[1], mods)).toBe('Regular')
  expect(getPlanLabel(mods[0], mods)).toBe('3 Meses')
  expect(getPlanLabel(mods[1], mods)).toBe('6 Meses')
})

test('getPlanLabelPublico: un labelPublico vacío o de espacios NO tapa el interno', () => {
  const mods = [{ id: '3_meses', label: '3 Meses', labelPublico: '   ', meses: 3, mensualidad: 300, materiasPorMes: 4, activa: true }]
  expect(getPlanLabelPublico(mods[0], mods)).toBe('3 Meses')
})

test('getTotalPlan: inscripción + todas las mensualidades', () => {
  const tres = { id: '3_meses', label: '3 Meses', meses: 3, mensualidad: 300, materiasPorMes: 4, activa: true }
  const seis = { id: '6_meses', label: '6 Meses', meses: 6, mensualidad: 150, materiasPorMes: 2, activa: true }
  expect(getTotalPlan(tres, 50)).toBe(950)
  expect(getTotalPlan(seis, 50)).toBe(950)
  // El caso que motivó la función: dos ritmos, el mismo precio.
  expect(getTotalPlan(tres, 50)).toBe(getTotalPlan(seis, 50))
  // Una inscripción inválida no propaga NaN a la landing.
  expect(getTotalPlan(tres, Number.NaN)).toBe(900)
})

test('getPlanLabelConDuracion: con nombre comercial dice CUÁNTO DURA', () => {
  // El fallo que lo motivó: la landing ofrecía "Plan Express $300/mes" y "Plan
  // Regular $150/mes" sin decir en ninguna parte que uno son 3 meses y el otro
  // 6. Dos precios distintos y ninguna forma de saber qué se compra.
  const mods = [
    { id: '3_meses', label: '3 Meses', labelPublico: 'Express', meses: 3, mensualidad: 300, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 Meses', labelPublico: 'Regular', meses: 6, mensualidad: 150, materiasPorMes: 2, activa: true },
  ]
  expect(getPlanLabelConDuracion(mods[0], mods)).toBe('Express · 3 meses')
  expect(getPlanLabelConDuracion(mods[1], mods)).toBe('Regular · 6 meses')
})

test('getPlanLabelConDuracion: INVARIANTE — sin nombre comercial no añade nada', () => {
  // El label interno YA dice la duración: "3 Meses · 3 meses" sería ruido, y
  // son ~144 escuelas las que no declaran `labelPublico`.
  const mods = [
    { id: '3_meses', label: '3 meses — Express',  meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 meses — Estándar', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
  ]
  for (const m of mods) {
    expect(getPlanLabelConDuracion(m, mods)).toBe(getPlanLabel(m, mods))
  }
})

test('getPlanLabelConDuracion: singular cuando el plan dura un mes', () => {
  const mods = [{ id: '1_mes', label: '1 Mes', labelPublico: 'Intensivo', meses: 1, mensualidad: 900, materiasPorMes: 8, activa: true }]
  expect(getPlanLabelConDuracion(mods[0], mods)).toBe('Intensivo · 1 mes')
})
