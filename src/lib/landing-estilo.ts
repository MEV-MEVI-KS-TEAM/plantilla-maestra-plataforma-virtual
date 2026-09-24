/**
 * Qué portada se sirve: la ANIMADA o la CLÁSICA.
 *
 * Vive en su propio archivo —y no como un `CONFIG.estiloLanding` leído a secas—
 * por una razón de compatibilidad: las ~144 escuelas ya entregadas tienen su
 * copia de `config.ts` SIN esta clave, y para ellas la respuesta correcta es
 * 'clasica'. Cambiar la portada de una escuela viva tiene que ser una decisión
 * suya, no lo que pasa la próxima vez que alguien redespliega por otra cosa.
 *
 * Por eso:
 *   · falta la clave  → 'clasica'  (escuela entregada antes de la portada nueva)
 *   · valor inválido  → 'clasica'  (nadie se queda sin portada por una errata)
 *   · 'animada'       → la portada nueva, SALVO en una escuela semanal o que no
 *                       cobra en MXN (ver `animadaSabeCobrar`): ahí, la clásica
 *
 * La plantilla declara `estiloLanding: 'animada'`, así que todo clon NUEVO nace
 * con ella. Una escuela ya entregada la enciende agregando esa misma clave.
 */
import { CONFIG } from '@/lib/config'

export type EstiloLandingResuelto = 'animada' | 'clasica'

/** Lo que la portada animada necesita saber de la escuela para poder servirse. */
export interface CobroEscuela {
  readonly periodicidad?: unknown
  readonly moneda?: unknown
}

/**
 * ¿La portada animada sabe anunciar el cobro de esta escuela?
 *
 * 🛑 GUARDA (A5). La animada todavía no conoce la cuota semanal ni otra moneda:
 * pinta «/mes», «N mensualidades» y cifras sin código ni equivalencia. En una
 * escuela semanal anunciaba una mensualidad que no existe; en una que cobra en
 * dólares, precios sin moneda. Hasta que la animada aprenda las dos cosas, esas
 * escuelas se quedan con la clásica, que sí las maneja, AUNQUE su config.ts
 * diga 'animada'.
 *
 * Falta la clave → mensual y en pesos: así nacieron las escuelas entregadas
 * antes de esas opciones, y para ellas no cambia nada.
 */
export function animadaSabeCobrar(cobro: CobroEscuela): boolean {
  const semanal = cobro.periodicidad === 'semanal'
  const otraMoneda = cobro.moneda !== undefined && cobro.moneda !== null && cobro.moneda !== 'MXN'
  return !semanal && !otraMoneda
}

/** La regla, aparte de CONFIG para poder probarla con cualquier valor. */
export function resolverEstiloLanding(declarado: unknown, cobro: CobroEscuela = {}): EstiloLandingResuelto {
  return declarado === 'animada' && animadaSabeCobrar(cobro) ? 'animada' : 'clasica'
}

export function estiloLanding(): EstiloLandingResuelto {
  const cfg = CONFIG as { estiloLanding?: unknown; periodicidad?: unknown; moneda?: unknown }
  return resolverEstiloLanding(cfg.estiloLanding, { periodicidad: cfg.periodicidad, moneda: cfg.moneda })
}

/** Azúcar para el `page.tsx` y para los guardianes. */
export function landingAnimadaActiva(): boolean {
  return estiloLanding() === 'animada'
}
