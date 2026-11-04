/**
 * El precio de PRIMARIA: la tabla del add-on y lo que el admin publica encima.
 *
 * ── Por qué un módulo aparte ────────────────────────────────────────────────
 *
 * Es PURO a propósito, igual que precios-licenciatura.ts y precios-nivel.ts: no
 * importa nada. Así lo usan la app (el merge de site-config-core.ts,
 * licenciatura-utils.ts) y el generador del PDF de entrega, que corre en Node sin
 * el alias `@/`. Una sola regla para la plataforma y para el documento.
 *
 * 🛑 NO agregues aquí un import de valor, `enum` ni `namespace`: Node los rechaza
 *    al quitar los tipos. Lo vigila tests/unit/primaria.spec.ts.
 *
 * ── Por qué NO usa `NivelConPrecio` ni los alias de precios-nivel.ts ────────────
 *
 * Primaria tiene tres planes propios ('3_meses_pri', '6_meses_pri', '9_meses_pri')
 * con su propia tabla. `NivelConPrecio` solo cabe en 3 y 6 meses y arrastraría los
 * alias `secundaria_<n>meses_*`. Extenderlo tocaría la validación y lo que cobran
 * Secundaria y Preparatoria. Por eso va aparte, como licenciatura.
 *
 * ── Las claves ──────────────────────────────────────────────────────────────
 *
 * Se editan EN SU SITIO, en `site_config.data.primaria`:
 *   primaria.inscripcion    · primaria.certificacion
 *   primaria.modalidades    → un objeto por id: `{ '3_meses_pri': { mensualidad: 2000 } }`
 *   primaria.avisoMenores   → el párrafo del aviso de privacidad sobre menores.
 *
 * Solo se publica la `mensualidad` de cada plan: duración, materias por mes y
 * `activa` son el producto y siguen en config.ts. Vacío = la clave no está
 * publicada = la cifra de config.ts.
 */

export type PrimariaPrecios = {
  readonly activa?: unknown
  readonly inscripcion?: unknown
  readonly certificacion?: unknown
  readonly modalidades?: unknown
  readonly avisoMenores?: unknown
} | null | undefined

/** Lo publicado de Primaria (`site_config.data.primaria`). */
export interface OverridePrimaria {
  inscripcion?: number
  certificacion?: number
  modalidades?: { [id: string]: OverrideModalidadPrimaria }
  avisoMenores?: string
}

/** Override de UN plan de Primaria: solo su mensualidad. */
export interface OverrideModalidadPrimaria {
  mensualidad?: number
}

type Plano = Record<string, unknown>

const esPlano = (v: unknown): v is Plano => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Número finito y >= 0: lo único que se publica como precio. */
const esPrecio = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

/**
 * Los límites de lo que se PUBLICA. Viven aquí (y no solo en el catálogo) para que
 * el merge, el validador y el PDF usen los mismos.
 */
export const LIMITES_PRI = {
  /** Nada se publica en 0: la tarjeta diría «$0». */
  min: 1,
  /** El mismo techo que `LIMITES.precioMax`. */
  precioMax: 50000,
  /** El párrafo del aviso de privacidad sobre datos de menores. */
  avisoMenoresMax: 1500,
} as const

/**
 * El párrafo de fábrica del aviso de privacidad. Se edita desde «Personalizar mi
 * página» y solo se pinta con Primaria encendida.
 *
 * ⚠️ Es un texto legal: la escuela debe validarlo con quien lleve lo legal antes
 * de vender. No es asesoría jurídica.
 */
export const AVISO_MENORES_FABRICA =
  'Si el alumno es menor de 18 años, tratamos sus datos personales con el consentimiento de su madre, padre o tutor. ' +
  'Durante la inscripción pedimos el nombre, el teléfono y el parentesco de esa persona, y la fecha de nacimiento del alumno. ' +
  'Usamos estos datos solo para la inscripción, la comunicación con la familia y el seguimiento académico. ' +
  'La madre, el padre o el tutor puede ejercer los derechos de acceso, rectificación, cancelación y oposición en nombre del menor.'

/** Entero en [min, max]: lo único que se publica desde el panel. */
const esPublicable = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= LIMITES_PRI.min && v <= max

/** Número finito >= 0 (o cadena numérica); cualquier otra cosa, `null`. */
const cifra = (v: unknown): number | null => {
  if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// ─── Lectura (ficha, «Mis pagos») ────────────────────────────────────────────
//
// Una cifra cuenta solo con el add-on encendido y si es un número finito >= 0. El
// 0 SÍ es cifra: «sin inscripción». Cualquier otra forma da `null` y quien llama
// decide su respaldo: nunca «$NaN».

export const inscripcionPrimariaDe = (pri: PrimariaPrecios): number | null =>
  pri?.activa === true ? cifra(pri.inscripcion) : null

export const certificacionPrimariaDe = (pri: PrimariaPrecios): number | null =>
  pri?.activa === true ? cifra(pri.certificacion) : null

/** El párrafo vigente: el publicado, o el de config.ts, o el de fábrica. */
export function textoAvisoMenores(pri: PrimariaPrecios): string {
  const v = pri?.avisoMenores
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : AVISO_MENORES_FABRICA
}

/**
 * Los `precios` que ve `inscripcionDe`, `certificacionDe` y `totalPlanDe` cuando el
 * nivel es Primaria. Esos resolvers le dan a un nivel sin precio propio la
 * inscripción general y la certificación de preparatoria; aquí esas dos claves
 * llevan las cifras de su tabla. Así las tarjetas se pintan con el mismo código y
 * Primaria nunca anuncia la certificación de otro nivel. Con el add-on apagado
 * devuelve `precios` tal cual.
 */
export function preciosDePrimaria<T extends Readonly<Record<string, unknown>>>(precios: T, pri: PrimariaPrecios): T {
  if (pri?.activa !== true) return precios
  const inscripcion = cifra(pri.inscripcion) ?? 0
  const certificacion = cifra(pri.certificacion) ?? 0
  return { ...precios, inscripcion, certificacionPreparatoria: certificacion, certificacion_preparatoria: certificacion }
}

// ─── Publicación ─────────────────────────────────────────────────────────────

/** ¿Los precios de este bloque se pueden publicar desde el panel? */
export function bloquePriEditable(pri: unknown): pri is Plano {
  return esPlano(pri) && pri.activa === true && Array.isArray(pri.modalidades)
}

export const inscripcionPriEditable = (pri: unknown): boolean => bloquePriEditable(pri) && esPrecio(pri.inscripcion)

export const certificacionPriEditable = (pri: unknown): boolean => bloquePriEditable(pri) && esPrecio(pri.certificacion)

/** ¿Se puede publicar la mensualidad de este plan? Plan `*_pri` activo con cifra numérica. */
export function planPriEditable(m: unknown): m is Plano & { id: string; meses: number; mensualidad: number } {
  return esPlano(m) && typeof m.id === 'string' && /_pri$/.test(m.id)
    && typeof m.meses === 'number' && Number.isFinite(m.meses) && m.meses > 0
    && esPrecio(m.mensualidad) && m.activa !== false
}

/** Los planes cuya mensualidad se puede publicar, en el orden del config. */
export function planesPriEditables(pri: unknown): Array<Plano & { id: string; meses: number; mensualidad: number }> {
  return bloquePriEditable(pri) ? (pri.modalidades as unknown[]).filter(planPriEditable) : []
}

/**
 * El bloque EFECTIVO: el de config.ts con lo publicado encima.
 *
 * Devuelve la MISMA referencia si no aplica nada, así una escuela sin Primaria o
 * sin nada publicado usa exactamente el objeto de config.ts. Si aplica algo,
 * devuelve un objeto NUEVO: nunca muta `pri`. Un id desconocido se ignora.
 */
export function primariaEfectiva<T>(pri: T, ov: unknown): T {
  if (!esPlano(ov) || !bloquePriEditable(pri)) return pri
  let salida: Plano | null = null
  const poner = (k: string, v: unknown) => {
    salida = salida ?? { ...pri }
    salida[k] = v
  }
  if (esPublicable(ov.inscripcion, LIMITES_PRI.precioMax) && esPrecio(pri.inscripcion)) poner('inscripcion', ov.inscripcion)
  if (esPublicable(ov.certificacion, LIMITES_PRI.precioMax) && esPrecio(pri.certificacion)) poner('certificacion', ov.certificacion)
  if (typeof ov.avisoMenores === 'string' && ov.avisoMenores.trim() !== '' && ov.avisoMenores.length <= LIMITES_PRI.avisoMenoresMax) {
    poner('avisoMenores', ov.avisoMenores.trim())
  }
  const mods = ov.modalidades
  if (esPlano(mods)) {
    let cambio = false
    const planes = (pri.modalidades as unknown[]).map((m) => {
      if (!planPriEditable(m) || !Object.prototype.hasOwnProperty.call(mods, m.id)) return m
      const o = mods[m.id]
      if (!esPlano(o) || !esPublicable(o.mensualidad, LIMITES_PRI.precioMax)) return m
      cambio = true
      return { ...m, mensualidad: o.mensualidad }
    })
    if (cambio) poner('modalidades', planes)
  }
  return (salida ?? pri) as T
}
