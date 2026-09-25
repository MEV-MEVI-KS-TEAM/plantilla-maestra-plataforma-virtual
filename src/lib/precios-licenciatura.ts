/**
 * El precio de LICENCIATURA: la tabla del add-on y lo que el admin publica
 * encima (#164, Bloque B).
 *
 * ── Por qué un módulo aparte ────────────────────────────────────────────────
 *
 * Es PURO a propósito, igual que precios-nivel.ts: no importa nada. Así lo
 * usan la app (el merge de site-config-core.ts, licenciatura-utils.ts) y el
 * generador del PDF de entrega, que corre en Node sin el alias `@/`. Una sola
 * regla de publicación para la plataforma y para el documento.
 *
 * 🛑 NO agregues aquí un import de valor, `enum` ni `namespace`: Node los
 *    rechaza al quitar los tipos. Lo vigila
 *    tests/unit/inscripcion-licenciatura.spec.ts.
 *
 * ── Las claves ──────────────────────────────────────────────────────────────
 *
 * Se editan EN SU SITIO, sin claves nuevas en config.ts:
 *   licenciaturas.inscripcion    · licenciaturas.certificacion (la titulación)
 *   licenciaturas.modalidades    → en la BD, un objeto por id:
 *                                  `{ '12_meses': { mensualidad: 1450 } }`
 * Es el mapa de planes de LICENCIATURA, aparte del de Sec/Prepa
 * (`modalidades`): un '6_meses' de licenciatura y el '6_meses' de preparatoria
 * nunca se pisan (Bug 121). Solo se publica la `mensualidad`: duración,
 * materias por mes y `activa` son el producto y siguen en config.ts.
 *
 * Vacío = la clave no está publicada = la cifra de config.ts, exactamente como
 * antes. A diferencia de la Fase 2 no hay un «general» al que caer ni claves en
 * `null`: la cifra de config.ts YA es la de licenciatura.
 *
 * ── El «alias» ──────────────────────────────────────────────────────────────
 *
 * La plantilla no tiene alias legacy de licenciatura. Lo que mantiene a todos
 * los lectores sincronizados es el BLOQUE EFECTIVO (`licenciaturaEfectiva`):
 * el merge lo escribe en `cfg.licenciaturas`, y de ahí leen la ficha, «Mis
 * pagos», /api/admin/planes y la landing; el PDF lo arma igual con la fila de
 * site_config.
 *
 * ── Fail-closed ─────────────────────────────────────────────────────────────
 *
 * Solo se publica sobre la forma ESTÁNDAR de la plantilla. Hay clones con
 * formas propias (objeto por moneda, precio por carrera, `rutas` que duplican
 * los planes, planes con `opciones` o `total`…) donde sustituir una cifra
 * dejaría otra copia diciendo lo contrario; ahí nada se aplica y los precios se
 * cambian con soporte.
 */

export type LicenciaturaPrecios = {
  readonly activas?: unknown
  readonly inscripcion?: unknown
  readonly certificacion?: unknown
  readonly modalidades?: unknown
} | null | undefined

/** Lo publicado de licenciatura (`site_config.data.licenciaturas`). */
export interface OverrideLicenciaturas {
  inscripcion?: number
  /** La titulación (título y cédula profesional). */
  certificacion?: number
  modalidades?: { [id: string]: OverrideModalidadLicenciatura }
}

/** Override de UN plan de licenciatura: solo su mensualidad. */
export interface OverrideModalidadLicenciatura {
  mensualidad?: number
}

type Plano = Record<string, unknown>

const esPlano = (v: unknown): v is Plano => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Número finito y >= 0: lo único que se publica como precio. */
const esPrecio = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

/** Lo mínimo que se publica desde el panel: una cifra finita >= 1. */
const esPublicable = (v: unknown): v is number => esPrecio(v) && v >= 1

/** Número finito >= 0 (o cadena numérica); cualquier otra cosa, `null`. */
const cifra = (v: unknown): number | null => {
  if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// ─── Lectura (ficha, «Mis pagos») ────────────────────────────────────────────
//
// Una cifra cuenta solo con el add-on encendido (`activas === true`, la misma
// condición de `getDesglosesLicenciatura`) y si es un número finito >= 0. El 0
// SÍ es cifra: «sin inscripción». Cualquier otra forma da `null` y quien llama
// decide su respaldo: nunca «$NaN».

/** La inscripción del programa, o `null` con el add-on apagado o sin una cifra única. */
export const inscripcionLicenciaturaDe = (lic: LicenciaturaPrecios): number | null =>
  lic?.activas === true ? cifra(lic.inscripcion) : null

/** La titulación (en el config se llama `certificacion`), con la misma regla. */
export const titulacionLicenciaturaDe = (lic: LicenciaturaPrecios): number | null =>
  lic?.activas === true ? cifra(lic.certificacion) : null

// ─── Publicación ─────────────────────────────────────────────────────────────

/** Las claves del bloque en la forma estándar de la plantilla. */
export const CLAVES_BLOQUE_LIC = [
  'activas', 'inscripcion', 'certificacion', 'carreras', 'modalidades', 'etiqueta', 'tema', 'incluye',
] as const

/** Las claves de un plan en la forma estándar de la plantilla. */
export const CLAVES_PLAN_LIC = ['id', 'label', 'sublabel', 'meses', 'mensualidad', 'activa', 'materiasPorMes'] as const

/** Claves con las que una CARRERA trae su propio precio (formas de la flota). */
const PRECIO_EN_CARRERA = [
  'precio', 'mensualidad', 'inscripcion', 'certificacion', 'titulacion', 'preciosPorModalidad', 'modalidadesRestringidas',
] as const

const soloClaves = (o: Plano, permitidas: readonly string[]): boolean =>
  Object.keys(o).every((k) => permitidas.includes(k))

/**
 * ¿Los precios de este bloque se pueden publicar desde el panel? Add-on
 * encendido y forma estándar: solo las claves de la plantilla, planes y
 * carreras como arreglos y ninguna carrera con precio propio.
 */
export function bloqueLicEditable(lic: unknown): lic is Plano {
  if (!esPlano(lic) || lic.activas !== true) return false
  if (!soloClaves(lic, CLAVES_BLOQUE_LIC)) return false
  if (!Array.isArray(lic.modalidades) || !Array.isArray(lic.carreras)) return false
  return lic.carreras.every((c) => esPlano(c) && !PRECIO_EN_CARRERA.some((k) => k in c))
}

/** ¿Se puede publicar la inscripción? Bloque editable y cifra numérica en config.ts. */
export const inscripcionLicEditable = (lic: unknown): boolean => bloqueLicEditable(lic) && esPrecio(lic.inscripcion)

/** ¿Se puede publicar la titulación? Misma regla que la inscripción. */
export const titulacionLicEditable = (lic: unknown): boolean => bloqueLicEditable(lic) && esPrecio(lic.certificacion)

/**
 * ¿Se puede publicar la mensualidad de este plan? Activo, con la forma
 * estándar y una mensualidad numérica (0 = «sin precio todavía» vale: es el
 * plan al que el admin le pone precio). Los planes de diplomado montados en el
 * riel (`*_dip`) quedan fuera.
 */
export function planLicEditable(m: unknown): m is Plano & { id: string; meses: number; mensualidad: number } {
  return esPlano(m) && typeof m.id === 'string' && !/_dip$/.test(m.id) && soloClaves(m, CLAVES_PLAN_LIC)
    && typeof m.meses === 'number' && Number.isFinite(m.meses) && m.meses > 0
    && esPrecio(m.mensualidad) && m.activa !== false
}

/** Los planes cuya mensualidad se puede publicar, en el orden del config. */
export function planesLicEditables(lic: unknown): Array<Plano & { id: string; meses: number; mensualidad: number }> {
  return bloqueLicEditable(lic) ? (lic.modalidades as unknown[]).filter(planLicEditable) : []
}

/**
 * El bloque EFECTIVO: el de config.ts con lo publicado encima.
 *
 * Devuelve la MISMA referencia si no aplica nada: sin override, con un bloque
 * de forma propia o con valores inválidos. Así una escuela sin nada publicado
 * usa exactamente el objeto de config.ts (la invariancia del PDF depende de
 * esto). Si aplica algo, devuelve un objeto NUEVO: nunca muta `lic`.
 *
 * Se aplica solo lo que admite el panel: cifras >= 1 sobre una cifra numérica
 * de config.ts (inscripción y titulación) o sobre un plan editable que ya
 * existe (mensualidad). Un 0 no se publica: la sección de la landing diría
 * «$0 de inscripción» o «¿Por qué la titulación cuesta $0?», y un plan en 0 se
 * esconde de la landing mientras el registro lo sigue ofreciendo. Una
 * licenciatura sin inscripción o sin titulación se configura en config.ts. Un
 * id desconocido se ignora.
 */
export function licenciaturaEfectiva<T>(lic: T, ov: unknown): T {
  if (!esPlano(ov) || !bloqueLicEditable(lic)) return lic
  let salida: Plano | null = null
  const poner = (k: string, v: unknown) => {
    salida = salida ?? { ...lic }
    salida[k] = v
  }
  if (esPublicable(ov.inscripcion) && esPrecio(lic.inscripcion)) poner('inscripcion', ov.inscripcion)
  if (esPublicable(ov.certificacion) && esPrecio(lic.certificacion)) poner('certificacion', ov.certificacion)
  const mods = ov.modalidades
  if (esPlano(mods)) {
    let cambio = false
    const planes = (lic.modalidades as unknown[]).map((m) => {
      if (!planLicEditable(m) || !Object.prototype.hasOwnProperty.call(mods, m.id)) return m
      const o = mods[m.id]
      if (!esPlano(o) || !esPublicable(o.mensualidad)) return m
      cambio = true
      return { ...m, mensualidad: o.mensualidad }
    })
    if (cambio) poner('modalidades', planes)
  }
  return (salida ?? lic) as T
}
