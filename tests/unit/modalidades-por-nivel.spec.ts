import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'
import {
  getModalidadesActivas,
  getDuracionLabel,
  getDuracionLabelPorNivel,
  modalidadPorNivel,
  planesPorNivel,
  type ModalidadPrograma,
} from '@/lib/modalidades'

/**
 * Oferta ASIMÉTRICA — `modalidades[].nivel`.
 *
 * El invariante que protegen estas pruebas: mientras ninguna modalidad declare
 * `nivel`, `planesPorNivel(n)` es `getModalidadesActivas()` para CUALQUIER
 * nivel. Son ~144 escuelas compartiendo esta plantilla y ninguna lo declara;
 * si esto cambiara, se les movería la landing y el registro a todas a la vez.
 *
 * La conducta asimétrica se prueba con tablas CONSTRUIDAS aquí, no encendiendo
 * nada en `CONFIG`: estas mismas pruebas corren en los clones, y un cliente
 * que sí declare `nivel` —EDUHCO, CAU— dejaría en rojo un archivo que no tiene
 * ningún problema. La premisa se construye, no se supone.
 */

/** La tabla del repo donde corre esta prueba, sea cual sea. */
const BASE = CONFIG.modalidades as readonly ModalidadPrograma[]

/** Dos planes sin `nivel`: la forma de las ~144 escuelas. */
const SIMETRICA: readonly ModalidadPrograma[] = [
  { id: '3_meses', label: '3 Meses', meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 Meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
]

/** La oferta de EDUHCO #197: cada nivel con UNA sola duración. */
const ASIMETRICA: readonly ModalidadPrograma[] = [
  { id: '3_meses', label: '3 Meses', nivel: 'secundaria',   meses: 3, mensualidad: 250, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 Meses', nivel: 'preparatoria', meses: 6, mensualidad: 250, materiasPorMes: 2, activa: true },
]

/** Mixta: un plan atado a un nivel y otro abierto a todos. */
const MIXTA: readonly ModalidadPrograma[] = [
  { id: '3_meses', label: '3 Meses', nivel: 'secundaria', meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 Meses',                      meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
]

const NIVELES = ['secundaria', 'preparatoria', 'licenciatura']

// ─── 1. El invariante: sin `nivel`, nada cambia ──────────────────────────────

test('1. ninguna modalidad de esta plantilla declara nivel', () => {
  // GUARDIÁN del config de FÁBRICA (ver tests/unit/es-plantilla.ts): si alguien
  // declarara un nivel aquí, se lo llevarían las ~144 escuelas al clonar y su
  // landing empezaría a esconder planes que sí venden.
  //
  // En el clon de una escuela asimétrica —EDUHCO, CAU— no significa nada: ahí
  // TODAS lo declaran, y con razón. La versión anterior aceptaba "ninguna o
  // todas", que pasaba en cualquier repo y por tanto no protegía nada.
  if (!ES_PLANTILLA) test.skip()
  expect(BASE.filter(m => m.nivel)).toEqual([])
})

test('1b. sin nivel declarado, planesPorNivel es getModalidadesActivas para todo nivel', () => {
  const activas = getModalidadesActivas(SIMETRICA)
  for (const n of NIVELES) {
    expect(planesPorNivel(n, SIMETRICA)).toEqual(activas)
  }
  // Y sin nivel tampoco filtra: es la llamada de un catálogo general.
  expect(planesPorNivel(null, SIMETRICA)).toEqual(activas)
  expect(planesPorNivel(undefined, SIMETRICA)).toEqual(activas)
})

test('1c. sin parámetro `mods` sigue leyendo CONFIG.modalidades', () => {
  // El default del parámetro es lo que hace que los llamadores de siempre no
  // cambien de conducta.
  expect(planesPorNivel(null)).toEqual(getModalidadesActivas())
})

// ─── 2. Oferta asimétrica ────────────────────────────────────────────────────

test('2. cada nivel ve solo sus planes', () => {
  expect(planesPorNivel('secundaria', ASIMETRICA).map(m => m.id)).toEqual(['3_meses'])
  expect(planesPorNivel('preparatoria', ASIMETRICA).map(m => m.id)).toEqual(['6_meses'])
})

test('2b. un nivel que no vende nada devuelve lista vacía, no el catálogo entero', () => {
  // El modo de fallo que importa: si al no encontrar planes se devolviera todo,
  // la landing ofrecería a licenciatura los planes de secundaria.
  expect(planesPorNivel('licenciatura', ASIMETRICA)).toEqual([])
})

test('2c. un plan sin nivel sigue aplicando a todos los niveles', () => {
  for (const n of NIVELES) {
    expect(planesPorNivel(n, MIXTA).map(m => m.id)).toContain('6_meses')
  }
  expect(planesPorNivel('preparatoria', MIXTA).map(m => m.id)).toEqual(['6_meses'])
  expect(planesPorNivel('secundaria', MIXTA).map(m => m.id)).toEqual(['3_meses', '6_meses'])
})

test('2d. un plan apagado desaparece del nivel', () => {
  const apagada = ASIMETRICA.map(m => (m.id === '3_meses' ? { ...m, activa: false } : m))
  expect(planesPorNivel('secundaria', apagada)).toEqual([])
  expect(planesPorNivel('preparatoria', apagada).map(m => m.id)).toEqual(['6_meses'])
})

// ─── 3. Deducir el plan cuando solo hay uno ──────────────────────────────────

test('3. modalidadPorNivel deduce el plan único', () => {
  expect(modalidadPorNivel('secundaria', ASIMETRICA)?.id).toBe('3_meses')
  expect(modalidadPorNivel('preparatoria', ASIMETRICA)?.id).toBe('6_meses')
})

test('3b. con 0 o con 2+ planes devuelve undefined y NO adivina', () => {
  // Adivinar aquí es elegir por el alumno cuánto paga.
  expect(modalidadPorNivel('licenciatura', ASIMETRICA)).toBeUndefined()
  expect(modalidadPorNivel('secundaria', SIMETRICA)).toBeUndefined()
  expect(modalidadPorNivel('secundaria', MIXTA)).toBeUndefined()
})

// ─── 4. La frase de duración por nivel ───────────────────────────────────────

test('4. la duración se cuenta por nivel, no por escuela', () => {
  // Con la lista plana, las dos portadas dirían "3 o 6 meses" aunque cada nivel
  // tenga una sola duración posible.
  expect(getDuracionLabel(ASIMETRICA)).toBe('3 o 6 meses')
  expect(getDuracionLabelPorNivel('secundaria', ASIMETRICA)).toBe('3 meses')
  expect(getDuracionLabelPorNivel('preparatoria', ASIMETRICA)).toBe('6 meses')
})

test('4b. en una escuela simétrica dice lo mismo que siempre', () => {
  for (const n of NIVELES) {
    expect(getDuracionLabelPorNivel(n, SIMETRICA)).toBe(getDuracionLabel(SIMETRICA))
  }
})

test('4c. un nivel sin planes no inventa una duración', () => {
  expect(getDuracionLabelPorNivel('licenciatura', ASIMETRICA)).toBe('')
})
