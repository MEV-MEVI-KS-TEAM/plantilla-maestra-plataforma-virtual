import type { SupabaseClient } from '@supabase/supabase-js'
import { CONFIG } from '@/lib/config'
import { esSemanal } from '@/lib/periodicidad'
import { getSiteConfig } from '@/lib/site-config'
import { filasPlanSemanal } from '@/lib/plan-semanal-core'

/**
 * Deja en `public.ajustes` el plan semanal de cada nivel: cuántas semanas y de
 * cuánto es la cuota.
 *
 * Es el gemelo de `sincronizarPrefijoMatricula()` y por la misma razón: una
 * función de Postgres no puede leer el config del front, así que lo que
 * necesita saber se refleja en `ajustes`. La fuente de verdad es el config
 * FUSIONADO —`src/lib/config.ts` más lo publicado en "Personalizar mi página"—,
 * el mismo que lee /api/alumno/pagos; esto solo lo copia.
 *
 * 🛑 Bug 165: antes leía `CONFIG.modalidades` de fábrica. Una cuota semanal
 * publicada desde el panel salía en la landing, en el registro y en los pagos
 * del alumno, pero el calendario se generaba con la de config.ts. Publicar NO
 * resincroniza por sí solo: la cuota nueva llega a `ajustes` en la siguiente
 * alta o al pulsar "regenerar", que es cuando esto se llama.
 *
 * ⚠️ "Regenerar" a un alumno YA inscrito le rehace las semanas pendientes y
 * vencidas con lo que haya en `ajustes` (`generar_calendario_pagos` las borra y
 * las vuelve a crear; las pagadas y condonadas no se borran). Después de
 * publicar otra cuota, eso le cambia el monto de lo que aún debe.
 *
 * ⚠️ POR QUÉ EL PLAN VIVE EN LA BD Y NO VIAJA COMO ARGUMENTO.
 * `generar_calendario_por_nivel()` lee las semanas y la cuota de aquí, no las
 * recibe. Una versión anterior en EDUHCO (#197) sí las recibía —validando el
 * nivel del alumno, pero confiando en las cifras— y una llamada con los valores
 * cruzados le generó a un alumno de preparatoria un calendario de 12 semanas en
 * vez de 24: $3,000 menos, sin ningún error. La guardia de rol impedía que lo
 * hiciera un alumno, no que lo hiciera un servidor mal configurado. Con el plan
 * guardado en la BD no hay parámetro que falsificar.
 *
 * Se llama justo antes de generar un calendario, no en un paso de despliegue,
 * para que no exista un paso manual que se pueda olvidar.
 *
 * Nunca lanza. Si el upsert falla, la RPC de abajo fallará con un mensaje
 * claro ("el plan semanal de X está incompleto") y el alta del alumno no debe
 * caerse por esto.
 *
 * Requiere un cliente con service role: `ajustes` tiene RLS sin políticas.
 *
 * No hace nada en una escuela mensual: se puede llamar siempre.
 */
export async function sincronizarPlanSemanal(admin: SupabaseClient): Promise<void> {
  if (!esSemanal()) return

  // Nunca lanza: si no puede leer site_config, devuelve config.ts tal cual.
  const cfg = await getSiteConfig()
  const ahora = new Date().toISOString()
  // El plan de cada nivel sale de config.ts y la cuota de lo publicado (ver
  // plan-semanal-core.ts: el interruptor `activa` no decide lo que se cobra).
  const filas = filasPlanSemanal(CONFIG.niveles as readonly string[], CONFIG.modalidades, cfg.modalidades, ahora)

  if (filas.length === 0) return

  try {
    const { error } = await admin.from('ajustes').upsert(filas, { onConflict: 'clave' })
    if (error) console.error('[plan-semanal] no se pudo sincronizar el plan:', error.message)
  } catch (err) {
    console.error('[plan-semanal] excepción al sincronizar el plan:', err)
  }
}

/**
 * Genera el calendario semanal de un alumno recién dado de alta.
 *
 * Sincroniza primero y llama después: los dos pasos van juntos siempre, y
 * separarlos es cómo se llega a una RPC que lee un plan viejo.
 *
 * 🛑 Usa `generar_calendario_por_nivel`, que NO recibe el plan. Para un alumno
 * con plan a medida (fuera del catálogo) existe `generar_calendario_pagos`, que
 * sí lo recibe porque ese es justo su caso de uso — pero no se llama desde el
 * registro.
 *
 * Nunca lanza: un alumno sin calendario se arregla desde el panel con un clic;
 * un alta que revienta deja una cuenta de Auth creada y un prospecto que no
 * puede ni reintentar con el mismo correo.
 */
export async function generarCalendarioSemanal(
  admin: SupabaseClient,
  alumnoId: string,
  fechaInicio?: string,
): Promise<number> {
  if (!esSemanal()) return 0

  await sincronizarPlanSemanal(admin)

  try {
    const { data, error } = await admin.rpc('generar_calendario_por_nivel', {
      p_alumno_id: alumnoId,
      ...(fechaInicio ? { p_fecha_inicio: fechaInicio } : {}),
    })
    if (error) {
      console.error('[plan-semanal] no se pudo generar el calendario:', error.message)
      return 0
    }
    return Number(data ?? 0)
  } catch (err) {
    console.error('[plan-semanal] excepción al generar el calendario:', err)
    return 0
  }
}
