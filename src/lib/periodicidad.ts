/**
 * Periodicidad de cobro — el interruptor de las escuelas que cobran por semana.
 *
 * Un solo lugar decide qué significa cada periodicidad. Si esta lógica se
 * repartiera entre el sidebar, el middleware y los dashboards, en tres meses
 * habría tres respuestas distintas a "¿este cliente cobra por semana?".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL INVARIANTE, y no es negociable:
 *
 *   Con `periodicidad: 'mensual'` (el default) la plataforma es IDÉNTICA a la
 *   de antes. Mismos menús, mismas rutas, mismas cifras. ~144 clientes
 *   comparten esta plantilla y actualizarla no puede moverles nada.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * QUÉ CAMBIA Y QUÉ NO. La periodicidad describe CÓMO SE COBRA, no cuánto dura
 * el programa: `meses` y `materiasPorMes` siguen gobernando el acceso
 * académico exactamente igual. En CAU (#200) la Secundaria son 3 meses
 * académicos Y 12 semanas de cobro — cuatro semanas por mes — y las dos cifras
 * conviven sin contradecirse.
 *
 * 🛑 Si una cuota semanal se trata como mensualidad, la escuela cobra UNA
 * CUARTA PARTE de lo que vendió. Es el modo de fallo que justifica todo este
 * archivo, y es silencioso: nadie ve un error, solo entra menos dinero.
 *
 * Tres clientes llegaron aquí antes que la plantilla y lo parchearon a mano:
 * RHEMA #193, EDUHCO #197 y CAU #200.
 */
import { CONFIG } from '@/lib/config'
import type { Periodicidad } from '@/lib/config'

export type { Periodicidad }

/** ¿Esta escuela cobra por semana? */
export function esSemanal(): boolean {
  return CONFIG.periodicidad === 'semanal'
}

/* ─── Rutas de pago ─────────────────────────────────────────────────────────
 *
 * Cada periodicidad tiene su par de pantallas y la otra no significa nada. No
 * es cosmética: ocultar una entrada del menú es UX, pero la URL sigue
 * existiendo y se comparte por WhatsApp. Se atajan en el middleware
 * (server-side) para que un enlace directo no aterrice en una pantalla que
 * consulta una tabla que este cliente nunca llenó.
 *
 * Se REDIRIGE a la pantalla EQUIVALENTE, no al dashboard: quien abrió un
 * enlace de "mis pagos" quiere ver sus pagos, y en esta escuela viven en otra
 * ruta. Mandarlo al inicio lo obliga a buscarlos otra vez.
 */

/** "Mis Pagos" del alumno: el calendario de semanas. */
export const RUTA_PAGOS_ALUMNO_SEMANAL = '/alumno/pagos'
/** "Pagar" del alumno: el flujo mensual de siempre. */
export const RUTA_PAGOS_ALUMNO_MENSUAL = '/alumno/pagar'
/** "Cobranza de la semana" del admin. */
export const RUTA_COBRANZA_ADMIN = '/admin/cobranza'

/**
 * ¿Esta ruta es la de la OTRA periodicidad? Devuelve el destino equivalente, o
 * null si la ruta es válida en esta escuela.
 *
 * Se compara con `===` o con `startsWith(ruta + '/')`, NUNCA con
 * `startsWith(ruta)` a secas: `'/alumno/pagos'.startsWith('/alumno/pagar')` es
 * false por poco, pero la regla escrita a secas atrapa rutas hermanas por
 * accidente en cuanto alguien añade una. Es la misma nota que dejó `modo.ts`.
 *
 * ⚠️ `/admin/estado-cuenta` NO se ataja en una escuela semanal. El estado de
 * cuenta sigue listando pagos reales y al admin le sirve; lo que cambia es que
 * además tiene "Cobranza". Redirigirlo sería quitarle una pantalla que
 * funciona.
 */
export function destinoSiEsRutaDePagoAjena(pathname: string): string | null {
  const coincide = (base: string) => pathname === base || pathname.startsWith(`${base}/`)

  if (esSemanal()) {
    // El destino nunca se redirige a sí mismo: cinturón sobre el tirante, para
    // que una regla futura mal escrita muera aquí en vez de convertirse en un
    // ERR_TOO_MANY_REDIRECTS en producción.
    if (coincide(RUTA_PAGOS_ALUMNO_SEMANAL)) return null
    if (coincide(RUTA_PAGOS_ALUMNO_MENSUAL)) return RUTA_PAGOS_ALUMNO_SEMANAL
    return null
  }

  if (coincide(RUTA_PAGOS_ALUMNO_MENSUAL)) return null
  if (coincide(RUTA_PAGOS_ALUMNO_SEMANAL)) return RUTA_PAGOS_ALUMNO_MENSUAL
  if (coincide(RUTA_COBRANZA_ADMIN))       return '/admin/estado-cuenta'
  return null
}

/* ─── Vocabulario ───────────────────────────────────────────────────────────
 *
 * 🛑 En una escuela semanal la palabra "mensualidad" no debe aparecer en
 * ninguna pantalla. No es una preferencia de estilo: un alumno que lee
 * "mensualidad $250" entiende que paga $250 al mes cuando paga $250 a la
 * semana, y descubre la diferencia cuando ya debe cuatro.
 */

/** Cómo se llama UNA cuota en esta escuela. */
export function etiquetaCuota(): string {
  return esSemanal() ? 'Cuota semanal' : 'Mensualidad'
}

/** El sufijo de un precio recurrente: "$250/semana" o "$1,000/mes". */
export function unidadCuota(): string {
  return esSemanal() ? '/semana' : '/mes'
}

/** "12 pagos semanales" / "6 mensualidades", para describir un plan completo. */
export function descripcionPlazos(n: number): string {
  if (esSemanal()) return `${n} ${n === 1 ? 'pago semanal' : 'pagos semanales'}`
  return `${n} ${n === 1 ? 'mensualidad' : 'mensualidades'}`
}
