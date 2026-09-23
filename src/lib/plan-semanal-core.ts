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
 *
 * 🛑 Del config publicado se toma SOLO la cuota. QUÉ plan le toca a cada nivel
 * y CUÁNTAS semanas dura salen de `fabrica` (config.ts), igual que antes. Si el
 * plan se eligiera con la tabla publicada, el interruptor `activa` del panel
 * decidiría qué se escribe en `ajustes`: apagar uno de dos planes haría que un
 * nivel pasara de "sin calendario" a "calendario del otro plan", y al volver a
 * encenderlo la fila quedaría ahí (el upsert no borra), cobrándole a cada alta
 * nueva un plan que no eligió. Eso rompe la REGLA DE ALCANCE de modalidades.ts:
 * apagar un plan lo oculta del catálogo, no cambia lo que se cobra.
 */
export type FilaAjuste = { clave: string; valor: string; updated_at: string }

export function filasPlanSemanal(
  niveles: readonly string[],
  fabrica: readonly ModalidadPrograma[],
  publicados: readonly ModalidadPrograma[],
  ahora: string,
): FilaAjuste[] {
  const filas: FilaAjuste[] = []

  for (const nivel of niveles) {
    const plan = modalidadPorNivel(nivel, fabrica)
    // La cuota publicada del MISMO plan. `mergeSiteConfig` conserva el orden y
    // la longitud de la base, así que se busca por posición y se confirma por
    // id; si no cuadra, se queda la de config.ts.
    const i = plan ? fabrica.indexOf(plan) : -1
    const publicado = i >= 0 && publicados[i]?.id === plan?.id ? publicados[i] : undefined
    const cuota = publicado?.cuotaSemanal ?? plan?.cuotaSemanal
    // Sin plan único para el nivel, o sin cifras semanales, no se escribe nada:
    // la RPC lo lee como "este nivel no lleva calendario" y devuelve 0. Escribir
    // una clave a medias haría que fallara ruidosamente en el alta.
    if (!plan?.semanas || !cuota) continue
    filas.push(
      { clave: `plan_semanas_${nivel}`, valor: String(plan.semanas), updated_at: ahora },
      { clave: `plan_cuota_${nivel}`,   valor: String(cuota),        updated_at: ahora },
    )
  }

  return filas
}
