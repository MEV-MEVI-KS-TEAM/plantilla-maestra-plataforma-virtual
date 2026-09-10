import type { SupabaseClient } from '@supabase/supabase-js'
import { CONFIG } from '@/lib/config'
import { esSemanal } from '@/lib/periodicidad'
import { modalidadPorNivel } from '@/lib/modalidades'

/**
 * Deja en `public.ajustes` el plan semanal de cada nivel: cuántas semanas y de
 * cuánto es la cuota.
 *
 * Es el gemelo de `sincronizarPrefijoMatricula()` y por la misma razón: una
 * función de Postgres no puede leer el config del front, así que lo que
 * necesita saber se refleja en `ajustes`. La fuente de verdad sigue siendo
 * `src/lib/config.ts`; esto solo lo copia.
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

  const ahora = new Date().toISOString()
  const filas: { clave: string; valor: string; updated_at: string }[] = []

  for (const nivel of CONFIG.niveles as readonly string[]) {
    const plan = modalidadPorNivel(nivel)
    // Sin plan único para el nivel, o sin cifras semanales, no se escribe nada:
    // la RPC lo lee como "este nivel no lleva calendario" y devuelve 0. Escribir
    // una clave a medias haría que fallara ruidosamente en el alta.
    if (!plan?.semanas || !plan?.cuotaSemanal) continue
    filas.push(
      { clave: `plan_semanas_${nivel}`, valor: String(plan.semanas),      updated_at: ahora },
      { clave: `plan_cuota_${nivel}`,   valor: String(plan.cuotaSemanal), updated_at: ahora },
    )
  }

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
