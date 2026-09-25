/**
 * Lectura de `curso_inscripciones` con `acceso_total` (C3b) que no rompe una
 * base sin esa migración.
 *
 * El código de la plantilla puede llegar a un cliente antes que la migración
 * 20260926120000_c3b_acceso_total_cursos.sql. Pedir una columna que no existe
 * tumba el `select` entero en PostgREST (42703), y cada lector lo tragaba a su
 * manera: el editor del curso decía «Alumnos asignados (0)», el visor volvía a
 * «no tiene lecciones» y el examen quedaba cerrado para todos. Aquí, si la
 * columna no existe, se lee sin ella: sin acceso total, que es exactamente lo
 * que había antes de C3b.
 *
 * ⚠️ Solo tolera la columna FALTANTE. Cualquier otro error se devuelve tal cual.
 */

export interface ErrorPostgrest { code?: string; message?: string }

/** ¿El error es «esa columna no existe» por `acceso_total`? */
export function faltaAccesoTotal(error: ErrorPostgrest | null | undefined): boolean {
  if (!error) return false
  return error.code === '42703' || /acceso_total/.test(error.message ?? '')
}

/**
 * Corre `consulta(campos + ', acceso_total')`; si la base no tiene la columna,
 * la repite con `campos` solos (las filas salen sin `acceso_total`: la ventana
 * por meses de siempre). `T` es la forma de las filas que espera quien llama:
 * con una lista de campos dinámica, el cliente de Supabase no la puede inferir.
 */
export async function conAccesoTotal<T>(
  campos: string,
  consulta: (campos: string) => PromiseLike<{ data: unknown; error: ErrorPostgrest | null }>,
): Promise<{ data: T | null; error: ErrorPostgrest | null }> {
  let r = await consulta(`${campos}, acceso_total`)
  if (faltaAccesoTotal(r.error)) r = await consulta(campos)
  return { data: (r.data ?? null) as T | null, error: r.error }
}
