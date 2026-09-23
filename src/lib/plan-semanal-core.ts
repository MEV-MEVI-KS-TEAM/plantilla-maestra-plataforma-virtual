import { modalidadPorNivel, type ModalidadPrograma } from '@/lib/modalidades'

/**
 * La parte PURA de `sincronizarPlanSemanal()`: de los niveles y los planes de la
 * escuela, las filas que se dejan en `public.ajustes`.
 *
 * Vive aparte de `plan-semanal.ts` por la misma razón que `site-config-core.ts`
 * vive aparte de `site-config.ts`: aquél lee el config publicado con
 * `getSiteConfig()`, que lleva `import 'server-only'` y revienta fuera de un
 * servidor de Next. Esto no importa nada de servidor, así que se prueba en
 * tests/unit como cualquier función.
 *
 * 🛑 `mods` es OBLIGATORIO a propósito (Bug 165). La versión anterior llamaba
 * `modalidadPorNivel(nivel)` sin planes, que por default lee `CONFIG.modalidades`
 * de FÁBRICA: la cuota semanal que el admin publicaba en "Personalizar mi
 * página" la anunciaban la landing, el registro y /api/alumno/pagos, pero el
 * calendario la cobraba con la de config.ts. Sin default, quien llame tiene que
 * decidir de dónde salen los planes.
 */
export type FilaAjuste = { clave: string; valor: string; updated_at: string }

export function filasPlanSemanal(
  niveles: readonly string[],
  mods: readonly ModalidadPrograma[],
  ahora: string,
): FilaAjuste[] {
  const filas: FilaAjuste[] = []

  for (const nivel of niveles) {
    const plan = modalidadPorNivel(nivel, mods)
    // Sin plan único para el nivel, o sin cifras semanales, no se escribe nada:
    // la RPC lo lee como "este nivel no lleva calendario" y devuelve 0. Escribir
    // una clave a medias haría que fallara ruidosamente en el alta.
    if (!plan?.semanas || !plan?.cuotaSemanal) continue
    filas.push(
      { clave: `plan_semanas_${nivel}`, valor: String(plan.semanas),      updated_at: ahora },
      { clave: `plan_cuota_${nivel}`,   valor: String(plan.cuotaSemanal), updated_at: ahora },
    )
  }

  return filas
}
