/**
 * El precio de un NIVEL: inscripción, mensualidad, total y certificación
 * (Fase 2, F2-4).
 *
 * ── Por qué un módulo aparte ────────────────────────────────────────────────
 *
 * Es PURO a propósito: solo trae un `import type` relativo, igual que
 * config.ts. Así lo importan sin cambios la app (a través de precios-ui.ts)
 * y el generador del PDF de entrega, que corre en Node sin el alias `@/` y
 * carga config.ts con `await import(...)`. Una sola definición de la regla, en
 * vez de un espejo en scripts/entrega que puede contradecir a la plataforma.
 *
 * 🛑 NO agregues aquí un import de valor, `enum` ni `namespace`: Node los
 *    rechaza al quitar los tipos y el PDF deja de generarse. Lo vigila
 *    tests/unit/precios-nivel.spec.ts.
 *
 * ── La regla ────────────────────────────────────────────────────────────────
 *
 * Seis claves canónicas en `precios`, que nacen en `null` (= VACÍO):
 *   inscripcionSecundaria · inscripcionPreparatoria
 *   mensualidadSecundaria3Meses · mensualidadSecundaria6Meses
 *   mensualidadPreparatoria3Meses · mensualidadPreparatoria6Meses
 *
 * Vacío = se usa el valor GENERAL de hoy, exactamente como antes de la Fase 2:
 *   - inscripción:   `precios.inscripcion`;
 *   - mensualidad:   la de hoy de `mensualidadDe` — para secundaria, su alias
 *                    `secundaria_<n>meses_normal` si es > 0 (SAMEX, AULA RAÍZ);
 *                    si no, `plan.mensualidad`.
 * Solo los planes de 3 y 6 meses tienen precio por nivel; los demás, el general.
 * Un nivel que no es secundaria ni preparatoria (licenciatura, diplomado,
 * null) recibe siempre el general.
 *
 * Con las seis claves vacías o ausentes (el caso de los ~144 clones), cada
 * función da EXACTAMENTE lo mismo que antes de la Fase 2.
 */
import type { CONFIG } from './config'

type ClavePrecio = keyof (typeof CONFIG)['precios']

/** Los niveles que tienen precio propio. */
export type NivelConPrecio = 'secundaria' | 'preparatoria'
export type Precios = Readonly<Record<string, unknown>>
export type PlanMinimo = { readonly meses: number; readonly mensualidad: number | string }
type Nivel = string | null | undefined

export const CLAVE_INSCRIPCION_POR_NIVEL = {
  secundaria: 'inscripcionSecundaria',
  preparatoria: 'inscripcionPreparatoria',
} as const satisfies Record<NivelConPrecio, ClavePrecio>

export const CLAVE_MENSUALIDAD_POR_NIVEL = {
  secundaria: { 3: 'mensualidadSecundaria3Meses', 6: 'mensualidadSecundaria6Meses' },
  preparatoria: { 3: 'mensualidadPreparatoria3Meses', 6: 'mensualidadPreparatoria6Meses' },
} as const satisfies Record<NivelConPrecio, Record<3 | 6, ClavePrecio>>

/** Número finito y > 0; cualquier otra cosa (null, '', 0, NaN, negativo) = vacío. */
const positivo = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

const conPrecio = (n: Nivel): NivelConPrecio | null =>
  n === 'secundaria' || n === 'preparatoria' ? n : null

/** La inscripción general: lo que sumaba `totalPlanDe` antes de la Fase 2. */
export const inscripcionGeneral = (p: Precios): number => positivo(p.inscripcion) ?? 0

/** La inscripción propia del nivel, o `null` si está vacía o el nivel no tiene. */
export function inscripcionPropiaDe(nivel: Nivel, p: Precios): number | null {
  const n = conPrecio(nivel)
  return n ? positivo(p[CLAVE_INSCRIPCION_POR_NIVEL[n]]) : null
}

/** La inscripción de un nivel: la propia si la hay; si no, la general. */
export const inscripcionDe = (nivel: Nivel, p: Precios): number =>
  inscripcionPropiaDe(nivel, p) ?? inscripcionGeneral(p)

/**
 * La mensualidad propia del nivel en ese plan, o `null`. Existe para que un
 * consumidor anteponga SOLO la clave nueva y conserve su respaldo de siempre.
 */
export function mensualidadPropiaDe(nivel: Nivel, plan: PlanMinimo, p: Precios): number | null {
  const n = conPrecio(nivel)
  const m = plan.meses
  return n && (m === 3 || m === 6) ? positivo(p[CLAVE_MENSUALIDAD_POR_NIVEL[n][m]]) : null
}

/**
 * EXACTAMENTE lo que devolvía `mensualidadDe` antes de la Fase 2: el "valor
 * general de hoy". `modalidades[].mensualidad` guarda una sola cifra, la de
 * preparatoria por convención; la de secundaria vive en
 * `precios.secundaria_<meses>meses_normal`. Leer la del plan a secas le
 * mostraba a secundaria la tarifa de preparatoria (SÉNDERI #194).
 */
export function mensualidadGeneralDe(nivel: Nivel, plan: PlanMinimo, p: Precios): number {
  if (nivel === 'secundaria') {
    const alias = positivo(p[`secundaria_${plan.meses}meses_normal`])
    if (alias !== null) return alias
  }
  return Number(plan.mensualidad) || 0
}

/** La mensualidad REAL de un nivel en un plan: la propia si la hay; si no, la de hoy. */
export const mensualidadDe = (nivel: Nivel, plan: PlanMinimo, p: Precios): number =>
  mensualidadPropiaDe(nivel, plan, p) ?? mensualidadGeneralDe(nivel, plan, p)

/** Inscripción + todas las mensualidades del plan, para un nivel. */
export const totalPlanDe = (nivel: Nivel, plan: PlanMinimo, p: Precios): number =>
  inscripcionDe(nivel, p) + plan.meses * mensualidadDe(nivel, plan, p)

/**
 * Certificación por nivel (pago único al concluir, fuera del total del plan).
 * Mudada tal cual desde precios-ui.ts: todo lo que no es secundaria cuenta como
 * preparatoria, y se aceptan también los alias viejos con guion bajo.
 */
export function certificacionDe(nivel: Nivel, precios: Precios): number {
  const claves = nivel === 'secundaria'
    ? ['certificacionSecundaria', 'certificacion_secundaria']
    : ['certificacionPreparatoria', 'certificacion_preparatoria']
  for (const clave of claves) {
    const v = positivo(precios[clave])
    if (v !== null) return v
  }
  return 0
}
