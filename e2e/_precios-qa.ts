/**
 * La mensualidad que las e2e de "Personalizar mi página" publican en un plan.
 *
 * Antes era un 2500 fijo. Desde el escalón (Fase 2, F2-7) el servidor rechaza
 * un plan corto que cueste menos al mes que uno largo del mismo nivel, y 2500
 * no cumple en toda escuela: donde el plan de 6 meses cobra más, el PUT de la
 * suite daba 400 y la e2e fallaba por su dato, no por la plataforma.
 *
 * La cifra sale de la config de ESTA escuela y la aprueba el MISMO validador
 * que corre el servidor (`validarOverrides` contra `mergeSiteConfig(CONFIG, {})`,
 * igual que `DEFAULTS()` en la API): nada de reimplementar la regla aquí.
 *
 * Preferencia: 2500 si pasa y es un precio NUEVO: distinto de todas las
 * mensualidades que la landing ya enseña, POR NIVEL (`mensualidadDe`: la
 * secundaria de CEIJ o AULA RAÍZ ya sale a $2,500 por su alias), para que la
 * landing pruebe que llegó la cifra publicada y no otra igual. Si no, la más
 * cercana en saltos de 50.
 * Si ninguna pasa, la actual del plan: publicarla no cambia nada y el escalón
 * la perdona (misma cifra que la base).
 */
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig } from '@/lib/site-config-core'
import { LIMITES } from '@/lib/site-config-campos'
import { mensualidadDe } from '@/lib/precios-nivel'
import { validarOverrides } from '@/lib/site-config-validacion'

export const MENSUALIDAD_QA_PREFERIDA = 2500

export function mensualidadQA(planId: string, preferida = MENSUALIDAD_QA_PREFERIDA): number {
  const base = mergeSiteConfig(CONFIG, {})
  const planes = Array.isArray(base.modalidades) ? base.modalidades : []
  const plan = planes.find((m) => m.id === planId)
  const actual = Number(plan?.mensualidad ?? 0)
  const precios = base.precios as unknown as Record<string, unknown>
  const niveles = (Array.isArray(base.niveles) ? base.niveles : []) as readonly string[]
  const yaSeVen = new Set(planes.flatMap((m) => [Number(m.mensualidad), ...niveles.map((n) => mensualidadDe(n, m, precios))]))
  const pasa = (v: number) =>
    v >= LIMITES.precioMin && v <= LIMITES.precioMax && !yaSeVen.has(v)
    && validarOverrides({ modalidades: { [planId]: { mensualidad: v } } }, base).ok
  if (pasa(preferida)) return preferida
  for (let d = 50; d <= LIMITES.precioMax; d += 50) {
    if (pasa(preferida + d)) return preferida + d
    if (pasa(preferida - d)) return preferida - d
  }
  return actual
}
