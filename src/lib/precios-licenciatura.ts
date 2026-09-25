/**
 * El precio de LICENCIATURA: inscripción y titulación del programa (#164).
 *
 * ── Por qué un módulo aparte ────────────────────────────────────────────────
 *
 * Es PURO a propósito, igual que precios-nivel.ts: no importa nada. Hoy lo usa
 * la app (a través de licenciatura-utils.ts), y así lo puede cargar también el
 * generador del PDF de entrega, que corre en Node sin el alias `@/`. (La
 * entrega todavía resuelve licenciatura con su propia regla en
 * scripts/entrega/licenciaturas.mjs.)
 *
 * 🛑 NO agregues aquí un import de valor, `enum` ni `namespace`: Node los
 *    rechaza al quitar los tipos. Lo vigila
 *    tests/unit/inscripcion-licenciatura.spec.ts.
 *
 * ── La regla ────────────────────────────────────────────────────────────────
 *
 * La tabla de licenciatura es el bloque `licenciaturas` del config, aparte de
 * `precios` (que es de Secundaria y Preparatoria). Una cifra cuenta solo si:
 *   - el add-on está encendido (`activas === true`), la misma condición de
 *     `getDesglosesLicenciatura`;
 *   - es un número finito >= 0, o una cadena numérica. El 0 SÍ es cifra: es
 *     «sin inscripción», lo mismo que ya anuncian la landing y la entrega.
 * Cualquier otra forma da `null` y quien llama decide su respaldo: un objeto
 * por moneda (`{ mxn, usd }`) o por tarifa (`{ base, pagoUnico }`), NaN, un
 * negativo, '' o la clave ausente. Así nunca se pinta «$NaN».
 */

export type LicenciaturaPrecios = {
  readonly activas?: unknown
  readonly inscripcion?: unknown
  readonly certificacion?: unknown
} | null | undefined

/** Número finito >= 0 (o cadena numérica); cualquier otra cosa, `null`. */
const cifra = (v: unknown): number | null => {
  if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** La inscripción del programa, o `null` con el add-on apagado o sin una cifra única. */
export const inscripcionLicenciaturaDe = (lic: LicenciaturaPrecios): number | null =>
  lic?.activas === true ? cifra(lic.inscripcion) : null

/** La titulación (título y cédula; en el config se llama `certificacion`), con la misma regla. */
export const titulacionLicenciaturaDe = (lic: LicenciaturaPrecios): number | null =>
  lic?.activas === true ? cifra(lic.certificacion) : null
