import { CONFIG } from '@/lib/config'
// El normalizador (y sus tipos) vive en oferta-regla.ts, sin imports, para que
// el generador de la entrega use el MISMO. Ver la historia de los tres formatos ahí.
import { normalizarOfertas, type OfertaIngreso, type CursoConfig } from './oferta-regla'
export { normalizarOfertas, type OfertaIngreso, type CursoConfig }

/**
 * Lista de ofertas activas. Vacía si el cliente no vende cursos de ingreso, lo
 * que hace que el bloque del registro simplemente no se muestre.
 */
export function getOfertasIngreso(): OfertaIngreso[] {
  return normalizarOfertas((CONFIG as { cursosIngreso?: Record<string, unknown> }).cursosIngreso)
}

/** Busca una oferta por id. `null` si no existe: sirve de whitelist en la API. */
export function getOfertaIngreso(id: string | null | undefined): OfertaIngreso | null {
  if (!id) return null
  return getOfertasIngreso().find(o => o.id === id) ?? null
}

/** true si el cliente vende al menos una oferta. */
export function hayOfertasIngreso(): boolean {
  return getOfertasIngreso().length > 0
}
