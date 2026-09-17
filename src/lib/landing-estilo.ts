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
 *   · 'animada'       → la portada nueva
 *
 * La plantilla declara `estiloLanding: 'animada'`, así que todo clon NUEVO nace
 * con ella. Una escuela ya entregada la enciende agregando esa misma clave.
 */
import { CONFIG } from '@/lib/config'

export type EstiloLandingResuelto = 'animada' | 'clasica'

/** La regla, aparte de CONFIG para poder probarla con cualquier valor. */
export function resolverEstiloLanding(declarado: unknown): EstiloLandingResuelto {
  return declarado === 'animada' ? 'animada' : 'clasica'
}

export function estiloLanding(): EstiloLandingResuelto {
  return resolverEstiloLanding((CONFIG as { estiloLanding?: unknown }).estiloLanding)
}

/** Azúcar para el `page.tsx` y para los guardianes. */
export function landingAnimadaActiva(): boolean {
  return estiloLanding() === 'animada'
}
