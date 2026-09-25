import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { CLAVES_EDITABLES } from '@/lib/site-config-core'
import * as nivel from '@/lib/precios-nivel'
import * as ui from '@/lib/precios-ui'
import { ES_PLANTILLA } from './es-plantilla'

/**
 * F2-4 — el precio de un NIVEL (src/lib/precios-nivel.ts).
 *
 * El invariante que no se negocia: con las seis claves por nivel VACÍAS
 * (`null`) o AUSENTES —el estado de los ~144 clones—, `mensualidadDe`,
 * `totalPlanDe` y `certificacionDe` dan EXACTAMENTE lo mismo que antes de la
 * Fase 2. La vara de medir es una copia literal de las funciones de main antes
 * de este cambio, no una expectativa escrita a mano.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')

type Precios = Record<string, unknown>
type Plan = { meses: number; mensualidad: number | string }

// ─── COPIA LITERAL de src/lib/precios-ui.ts en main c5c7bf7 (antes de F2-4) ──
const numeroPositivoMain = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}
function mensualidadDeMain(nivel: string, plan: Plan, precios: Precios): number {
  if (nivel === 'secundaria') {
    const propia = numeroPositivoMain(precios[`secundaria_${plan.meses}meses_normal`])
    if (propia !== null) return propia
  }
  return Number(plan.mensualidad) || 0
}
function certificacionDeMain(nivel: string, precios: Precios): number {
  const claves = nivel === 'secundaria'
    ? ['certificacionSecundaria', 'certificacion_secundaria']
    : ['certificacionPreparatoria', 'certificacion_preparatoria']
  for (const clave of claves) {
    const v = numeroPositivoMain(precios[clave])
    if (v !== null) return v
  }
  return 0
}
function totalPlanDeMain(nivel: string, plan: Plan, precios: Precios): number {
  const inscripcion = numeroPositivoMain(precios.inscripcion) ?? 0
  return inscripcion + plan.meses * mensualidadDeMain(nivel, plan, precios)
}
// ─────────────────────────────────────────────────────────────────────────────

const CLAVES_NUEVAS = [
  'inscripcionSecundaria', 'inscripcionPreparatoria',
  'mensualidadSecundaria3Meses', 'mensualidadSecundaria6Meses',
  'mensualidadPreparatoria3Meses', 'mensualidadPreparatoria6Meses',
] as const

/** Las dos formas de "vacío": las seis claves AUSENTES (un clon) o en `null` (la plantilla). */
const sinClaves = (p: Precios): Precios =>
  Object.fromEntries(Object.entries(p).filter(([k]) => !(CLAVES_NUEVAS as readonly string[]).includes(k)))
const conClavesNull = (p: Precios): Precios => ({ ...sinClaves(p), ...Object.fromEntries(CLAVES_NUEVAS.map((k) => [k, null])) })

/** SAMEX (#199): secundaria 2,700 / 1,400 en sus alias; el plan lleva la de preparatoria. */
const SAMEX = {
  precios: {
    inscripcion: 500, certificacionSecundaria: 4900, certificacionPreparatoria: 5900,
    secundaria_3meses_normal: 2700, secundaria_6meses_normal: 1400,
    preparatoria_3meses_normal: 3000, preparatoria_6meses_normal: 1500,
  } as Precios,
  planes: [{ meses: 3, mensualidad: 3000 }, { meses: 6, mensualidad: 1500 }] as Plan[],
}

/** AULA RAÍZ (#208): secundaria $2,500/$1,250 y preparatoria $3,000/$1,500, inscripción $499. */
const AULA_RAIZ = {
  precios: {
    inscripcion: 499, certificacion_secundaria: 3500, certificacionPreparatoria: 0,
    secundaria_3meses_normal: 2500, secundaria_6meses_normal: 1250,
    preparatoria_3meses_normal: 3000, preparatoria_6meses_normal: 1500,
  } as Precios,
  planes: [{ meses: 3, mensualidad: 3000 }, { meses: 6, mensualidad: 1500 }] as Plan[],
}

const NIVELES: ReadonlyArray<string | null | undefined> = [
  ...(CONFIG.niveles as readonly string[]),
  'secundaria', 'preparatoria', 'licenciatura', 'diplomado', '', null, undefined,
]

// ─── 1. El invariante ────────────────────────────────────────────────────────

test('1. INVARIANTE: con las claves vacías o ausentes, todo da lo mismo que en main', () => {
  const casos: Array<{ nombre: string; precios: Precios; planes: Plan[] }> = [
    { nombre: 'fábrica', precios: CONFIG.precios as unknown as Precios, planes: CONFIG.modalidades.map((m) => ({ meses: m.meses, mensualidad: m.mensualidad })) },
    { nombre: 'SAMEX', ...SAMEX },
    { nombre: 'AULA RAÍZ', ...AULA_RAIZ },
  ]
  let comparaciones = 0
  for (const caso of casos) {
    for (const [forma, precios] of [['ausentes', sinClaves(caso.precios)], ['null', conClavesNull(caso.precios)]] as const) {
      for (const plan of caso.planes) {
        for (const n of NIVELES) {
          const donde = `${caso.nombre} · claves ${forma} · ${plan.meses} meses · nivel ${String(n)}`
          const legacyNivel = n as string
          expect(nivel.mensualidadDe(n, plan, precios), `mensualidadDe ${donde}`).toBe(mensualidadDeMain(legacyNivel, plan, precios))
          expect(nivel.totalPlanDe(n, plan, precios), `totalPlanDe ${donde}`).toBe(totalPlanDeMain(legacyNivel, plan, precios))
          expect(nivel.certificacionDe(n, precios), `certificacionDe ${donde}`).toBe(certificacionDeMain(legacyNivel, precios))
          expect(nivel.inscripcionDe(n, precios), `inscripcionDe ${donde}`).toBe(numeroPositivoMain(precios.inscripcion) ?? 0)
          comparaciones++
        }
      }
    }
  }
  // Que el bucle recorrió todo (2 formas × todos los planes × todos los niveles).
  const planes = casos.reduce((s, c) => s + c.planes.length, 0)
  expect(comparaciones).toBe(2 * planes * NIVELES.length)
  expect(planes).toBeGreaterThanOrEqual(5)
})

test('1b. SAMEX y AULA RAÍZ: sin claves, la secundaria sigue saliendo de su alias', () => {
  expect(nivel.mensualidadDe('secundaria', SAMEX.planes[0], SAMEX.precios)).toBe(2700)
  expect(nivel.mensualidadDe('preparatoria', SAMEX.planes[0], SAMEX.precios)).toBe(3000)
  expect(nivel.totalPlanDe('secundaria', AULA_RAIZ.planes[0], AULA_RAIZ.precios)).toBe(7999)
  expect(nivel.totalPlanDe('secundaria', AULA_RAIZ.planes[1], AULA_RAIZ.precios)).toBe(7999)
  expect(nivel.totalPlanDe('preparatoria', AULA_RAIZ.planes[0], AULA_RAIZ.precios)).toBe(9499)
  expect(nivel.totalPlanDe('preparatoria', AULA_RAIZ.planes[1], AULA_RAIZ.precios)).toBe(9499)
})

// ─── 2. Con claves ───────────────────────────────────────────────────────────

test('2. con una clave > 0 gana la clave; con 0, NaN, negativo o vacío cae al general', () => {
  const plan3 = { meses: 3, mensualidad: 2000 }
  const base: Precios = { inscripcion: 599, secundaria_3meses_normal: 1800 }
  const con = { ...base, inscripcionSecundaria: 1000, mensualidadSecundaria3Meses: 1500, mensualidadPreparatoria3Meses: 2600 }
  expect(nivel.inscripcionDe('secundaria', con)).toBe(1000)
  expect(nivel.inscripcionDe('preparatoria', con)).toBe(599)
  expect(nivel.mensualidadDe('secundaria', plan3, con)).toBe(1500)
  expect(nivel.mensualidadDe('preparatoria', plan3, con)).toBe(2600)
  for (const vacio of [0, Number.NaN, -5, '', null, undefined, 'abc']) {
    const p = { ...base, inscripcionSecundaria: vacio, mensualidadSecundaria3Meses: vacio }
    expect(nivel.inscripcionDe('secundaria', p), `vacío=${String(vacio)}`).toBe(599)
    expect(nivel.mensualidadDe('secundaria', plan3, p), `vacío=${String(vacio)}`).toBe(1800)
    expect(nivel.inscripcionPropiaDe('secundaria', p)).toBeNull()
    expect(nivel.mensualidadPropiaDe('secundaria', plan3, p)).toBeNull()
  }
})

test('2b. una cadena numérica cuenta como precio (se lee con Number(), como certificacionDe)', () => {
  expect(nivel.inscripcionDe('secundaria', { inscripcion: 599, inscripcionSecundaria: '1500' })).toBe(1500)
})

test('2c. licenciatura, diplomado y null reciben el general aunque haya claves', () => {
  // Es la regla del RESOLVER de Sec/Prepa. Lo que paga un alumno de
  // licenciatura lo decide `inscripcionDelAlumno` con su propia tabla (#164).
  const plan3 = { meses: 3, mensualidad: 2000 }
  const p: Precios = { inscripcion: 599, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500, mensualidadSecundaria3Meses: 1500, mensualidadPreparatoria3Meses: 2600 }
  for (const n of ['licenciatura', 'diplomado', '', null, undefined]) {
    expect(nivel.inscripcionDe(n, p), String(n)).toBe(599)
    expect(nivel.mensualidadDe(n, plan3, p), String(n)).toBe(2000)
  }
})

test('2d. solo los planes de 3 y 6 meses tienen precio por nivel', () => {
  const p: Precios = { mensualidadSecundaria3Meses: 1500, mensualidadSecundaria6Meses: 900 }
  expect(nivel.mensualidadDe('secundaria', { meses: 9, mensualidad: 700 }, p)).toBe(700)
  expect(nivel.mensualidadDe('secundaria', { meses: 12, mensualidad: 600 }, p)).toBe(600)
})

test('2e. el caso Moreta: inscripción y mensualidades distintas por nivel', () => {
  // b64e04d:tests/unit/modalidades.spec.ts, ahora con las claves canónicas.
  const p: Precios = {
    inscripcion: 999,
    inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500,
    mensualidadSecundaria3Meses: 1500, mensualidadSecundaria6Meses: 900,
    mensualidadPreparatoria3Meses: 4900, mensualidadPreparatoria6Meses: 2900,
  }
  const plan3 = { meses: 3, mensualidad: 4900 }
  const plan6 = { meses: 6, mensualidad: 2900 }
  expect(nivel.totalPlanDe('secundaria', plan3, p)).toBe(5500)
  expect(nivel.totalPlanDe('secundaria', plan6, p)).toBe(6400)
  expect(nivel.totalPlanDe('preparatoria', plan3, p)).toBe(16200)
  expect(nivel.totalPlanDe('preparatoria', plan6, p)).toBe(18900)
})

// ─── 3. El módulo ────────────────────────────────────────────────────────────

test('3. precios-nivel.ts se puede importar desde Node: sin @/, solo import type, sin enum ni namespace', () => {
  const fuente = leer('src/lib/precios-nivel.ts')
  const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  // TODO import (también los de varias líneas y los de efecto, `import './x'`)
  // tiene que ser un `import type { … } from './…'` de una línea.
  const inicios = codigo.match(/^\s*import\b/gm) ?? []
  const deTipo = codigo.match(/^import type \{[^}\n]*\} from '\.\/[\w-]+'$/gm) ?? []
  expect(inicios.length, 'hay un import que no es `import type` relativo de una línea').toBe(deTipo.length)
  expect(deTipo.length).toBeGreaterThan(0)
  // Ni reexports, ni require, ni `@/`, ni sintaxis que Node no sabe borrar.
  expect(codigo).not.toMatch(/^\s*export\b[^;]*?\bfrom\b/m)
  expect(codigo).not.toMatch(/\brequire\s*\(/)
  expect(codigo).not.toContain("from '@/")
  expect(codigo).not.toMatch(/\benum\b|\bnamespace\b|\bdeclare\b/)
})

test('3b. cada clave por nivel es editable y existe en config.ts', () => {
  const rutas = [
    ...Object.values(nivel.CLAVE_INSCRIPCION_POR_NIVEL),
    ...Object.values(nivel.CLAVE_MENSUALIDAD_POR_NIVEL).flatMap((porMeses) => Object.values(porMeses)),
  ]
  expect([...rutas].sort()).toEqual([...CLAVES_NUEVAS].sort())
  const precios = CONFIG.precios as unknown as Precios
  for (const k of rutas) {
    expect(CLAVES_EDITABLES as readonly string[], k).toContain(`precios.${k}`)
    expect(precios[k], `CONFIG.precios.${k}`).not.toBeUndefined()
  }
})

test('3c. en la plantilla las seis claves nacen vacías (null)', () => {
  // GUARDIÁN del config de FÁBRICA: un clon nuevo puede nacer con cifras que le
  // sembró el onboarding; la plantilla no.
  test.skip(!ES_PLANTILLA, 'solo en la plantilla')
  const precios = CONFIG.precios as unknown as Precios
  for (const k of CLAVES_NUEVAS) expect(precios[k], k).toBeNull()
})

test('3d. precios-ui reexporta las MISMAS funciones (no copias)', () => {
  expect(ui.mensualidadDe).toBe(nivel.mensualidadDe)
  expect(ui.totalPlanDe).toBe(nivel.totalPlanDe)
  expect(ui.certificacionDe).toBe(nivel.certificacionDe)
  expect(ui.inscripcionDe).toBe(nivel.inscripcionDe)
  expect(ui.mensualidadPropiaDe).toBe(nivel.mensualidadPropiaDe)
  expect(ui.inscripcionPropiaDe).toBe(nivel.inscripcionPropiaDe)
})
