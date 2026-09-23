import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig, type BaseSiteConfig } from '@/lib/site-config-core'
import { filasPlanSemanal, type FilaAjuste } from '@/lib/plan-semanal-core'
import type { ModalidadPrograma } from '@/lib/modalidades'

/**
 * BUG 165 — el plan semanal que llega a `public.ajustes` sale del config
 * PUBLICADO, no del de fábrica.
 *
 * El corte: panel → site_config ✓ → landing, registro y /api/alumno/pagos ✓,
 * pero `sincronizarPlanSemanal()` → `ajustes` ✗ → `generar_calendario_por_nivel`
 * cobraba con `CONFIG.modalidades`. El alumno veía una cuota y el calendario le
 * cobraba otra.
 *
 * `plan-semanal.ts` no se importa aquí: lee `getSiteConfig()`, que lleva
 * `import 'server-only'`. Se prueba su parte pura (`plan-semanal-core.ts`) con
 * el MISMO `mergeSiteConfig` que usa `getSiteConfig()`, y el cableado con
 * comprobaciones sobre el fuente, como corregir-plan.spec.ts.
 *
 * Los planes se construyen aquí y no se lee el flag `esSemanal()`: estas
 * pruebas corren en los ~144 clones, cada uno con su propio CONFIG.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
/**
 * El código sin comentarios: los de cabecera citan la llamada vieja y el
 * `import 'server-only'` para explicar el bug. Ingenuo con `//` o `/*` dentro
 * de un string; hoy ninguno de los dos archivos los tiene.
 */
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const NIVELES = ['secundaria', 'preparatoria'] as const
const AHORA = '2026-09-22T12:00:00.000Z'

/** Un plan por nivel y no el mismo: la oferta de CAU #200. */
const SEMANAL: ModalidadPrograma[] = [
  { id: '3_meses', label: '3 Meses', nivel: 'secundaria',   meses: 3, semanas: 12, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 Meses', nivel: 'preparatoria', meses: 6, semanas: 24, cuotaSemanal: 350, mensualidad: 350, materiasPorMes: 2, activa: true },
]

/**
 * Una escuela MENSUAL con un plan por nivel y `semanas` declaradas (p. ej. para
 * la duración). Lo único que le falta para escribir filas es la cuota semanal:
 * si el merge se la inventara, la prueba 3 lo vería.
 */
const MENSUAL: ModalidadPrograma[] = [
  { id: '3_meses', label: '3 Meses', nivel: 'secundaria',   meses: 3, semanas: 12, mensualidad: 2000, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 Meses', nivel: 'preparatoria', meses: 6, semanas: 24, mensualidad: 1000, materiasPorMes: 2, activa: true },
]

/** El config del clon con otros planes, en la forma que recibe `mergeSiteConfig`. */
const baseCon = (modalidades: ModalidadPrograma[]) =>
  ({ ...mergeSiteConfig(CONFIG, {}), modalidades }) as unknown as BaseSiteConfig

/** Lo que hace `getSiteConfig()` con la fila de site_config: fusionar. */
const publicado = (modalidades: ModalidadPrograma[], overrides: unknown) =>
  mergeSiteConfig(baseCon(modalidades), overrides).modalidades as unknown as ModalidadPrograma[]

const valor = (filas: FilaAjuste[], clave: string) => filas.find(f => f.clave === clave)?.valor

// ─── 1. Lo publicado es lo que se cobra ──────────────────────────────────────

test('1. con la cuota de un nivel publicada, plan_cuota_<nivel> lleva la publicada', () => {
  const mods = publicado(SEMANAL, { modalidades: { '3_meses': { cuotaSemanal: 300 } } })
  const filas = filasPlanSemanal(NIVELES, mods, AHORA)

  expect(valor(filas, 'plan_cuota_secundaria')).toBe('300')
  // `semanas` no es editable desde el panel: sigue la de config.ts.
  expect(valor(filas, 'plan_semanas_secundaria')).toBe('12')
  // El otro nivel no se entera.
  expect(valor(filas, 'plan_cuota_preparatoria')).toBe('350')
  expect(valor(filas, 'plan_semanas_preparatoria')).toBe('24')
})

test('1b. contraste: con los planes sin fusionar sale la cuota de config.ts', () => {
  // Solo documenta el contraste con la prueba 1: es la cifra que cobraba el
  // calendario antes del arreglo. Quien vigila la regresión son 1, 4 y 4b.
  const filas = filasPlanSemanal(NIVELES, SEMANAL, AHORA)
  expect(valor(filas, 'plan_cuota_secundaria')).toBe('250')
})

// ─── 2. Sin override, lo mismo que hoy ───────────────────────────────────────

test('2. sin override se escriben exactamente las mismas filas que hoy', () => {
  expect(filasPlanSemanal(NIVELES, publicado(SEMANAL, {}), AHORA)).toEqual([
    { clave: 'plan_semanas_secundaria',   valor: '12',  updated_at: AHORA },
    { clave: 'plan_cuota_secundaria',     valor: '250', updated_at: AHORA },
    { clave: 'plan_semanas_preparatoria', valor: '24',  updated_at: AHORA },
    { clave: 'plan_cuota_preparatoria',   valor: '350', updated_at: AHORA },
  ])
})

test('2b. con el config de ESTE repo y sin override, igual que con config.ts', () => {
  // "Hoy" = los planes de config.ts. Vale en el clon que sea, semanal o mensual.
  const niveles = CONFIG.niveles as readonly string[]
  const hoy = filasPlanSemanal(niveles, CONFIG.modalidades, AHORA)
  const ahora = filasPlanSemanal(niveles, mergeSiteConfig(CONFIG, {}).modalidades, AHORA)
  expect(ahora).toEqual(hoy)
})

// ─── 3. Una escuela mensual no cambia ────────────────────────────────────────

test('3. en una escuela mensual no se escribe nada, aunque se publique una cuota semanal', () => {
  // `aplicarModalidades` no le mete cuota semanal a un plan que no la declara:
  // haría un plan híbrido que `subtotalCuotas()` cobraría por semanas.
  const mods = publicado(MENSUAL, { modalidades: { '3_meses': { cuotaSemanal: 300 }, '6_meses': { cuotaSemanal: 300 } } })
  expect(mods.map(m => m.cuotaSemanal)).toEqual([undefined, undefined])
  expect(filasPlanSemanal(NIVELES, mods, AHORA)).toEqual([])
})

test('3b. en una escuela mensual ni siquiera se lee site_config', () => {
  // La guardia de periodicidad va ANTES de la lectura: las ~144 escuelas
  // mensuales no suman una consulta al dar de alta a un alumno.
  const fuente = leer('src/lib/plan-semanal.ts')
  const cuerpo = fuente.slice(fuente.indexOf('export async function sincronizarPlanSemanal('))
  const guardia = cuerpo.indexOf('if (!esSemanal()) return')
  const lectura = cuerpo.indexOf('await getSiteConfig(')
  expect(guardia).toBeGreaterThan(-1)
  expect(lectura).toBeGreaterThan(guardia)
})

// ─── 4. El cableado ──────────────────────────────────────────────────────────

test('4. sincronizarPlanSemanal lee la misma fuente que /api/alumno/pagos', () => {
  const plan = leer('src/lib/plan-semanal.ts')
  const pagos = leer('src/app/api/alumno/pagos/route.ts')
  const importa = /import \{[^}]*\bgetSiteConfig\b[^}]*\} from '@\/lib\/site-config'/
  for (const fuente of [plan, pagos]) expect(fuente).toMatch(importa)
  // Y lo que se lee es lo que se le pasa a la parte pura.
  const lectura = plan.match(/const (\w+) = await getSiteConfig\(\)/)
  expect(lectura, 'sincronizarPlanSemanal ya no lee getSiteConfig()').not.toBeNull()
  expect(plan).toMatch(new RegExp(`filasPlanSemanal\\([^)]*\\b${lectura![1]}\\.modalidades\\b`))
})

test('4b. nadie vuelve a pedir el plan de un nivel sin pasarle los planes', () => {
  for (const archivo of ['src/lib/plan-semanal.ts', 'src/lib/plan-semanal-core.ts']) {
    expect(sinComentarios(leer(archivo)), archivo).not.toMatch(/modalidadPorNivel\(\s*nivel\s*\)/)
  }
  // Y la parte pura sí se los pasa.
  expect(sinComentarios(leer('src/lib/plan-semanal-core.ts'))).toContain('modalidadPorNivel(nivel, mods)')
})

test('4c. la parte pura no arrastra código de servidor', () => {
  // Si importara site-config.ts, esta misma spec dejaría de poder cargarla.
  // Cubre también los import de varias líneas (se mira el `from`).
  const core = sinComentarios(leer('src/lib/plan-semanal-core.ts'))
  expect(core).toMatch(/from\s+['"]@\/lib\/modalidades['"]/)
  expect(core).not.toMatch(/(from|import)\s+['"](server-only|@\/lib\/site-config)['"]/)
})
