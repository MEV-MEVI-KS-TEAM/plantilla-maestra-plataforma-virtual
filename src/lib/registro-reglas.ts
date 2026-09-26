/**
 * Reglas del registro público que tienen que valer IGUAL en el formulario
 * (/register) y en /api/auth/register-complete. Puras: sin config ni Supabase,
 * para poder probarlas sin levantar nada.
 */

/**
 * La modalidad que se guarda en `alumnos` al registrarse.
 *
 * - Con el nivel forzado por el servidor (solo_cursos) o con nivel 'diplomado'
 *   va null: la modalidad es la duración del PROGRAMA escolar, y el ritmo de un
 *   curso lo fija el propio curso con `modulos_por_mes`.
 * - Vacía o que no es texto → null. El formulario mandaba '' cuando el alumno
 *   elegía «Curso o diplomado», y `alumnos_modalidad_check` solo admite NULL o
 *   un id de modalidad: el alta caía con 500 y dejaba la cuenta a medias (#212).
 *
 * No valida que el id exista ni que corresponda al nivel: eso lo hace el CHECK
 * de la base (y lo segundo está pendiente en #199).
 */
export function modalidadDeRegistro(
  nivel: string | null,
  pedida: unknown,
  nivelForzado: string | null,
): string | null {
  if (nivelForzado || nivel === 'diplomado') return null
  if (typeof pedida !== 'string') return null
  const id = pedida.trim()
  return id || null
}

/**
 * ¿El registro exige que el alumno diga a qué curso se inscribe (diplomado_id)?
 *
 * Solo cuando el nivel 'diplomado' lo ELIGIÓ él: la opción «Curso o diplomado»
 * del modo tradicional, que convierte la modalidad en «¿Cuál?».
 *
 * En solo_cursos el nivel 'diplomado' lo pone el SERVIDOR a todos (B7) y el
 * formulario no tiene selector de curso: el alumno se registra y el admin le
 * asigna sus cursos. Exigirlo ahí dejaba a la escuela sin registro público —
 * 400 después de crear la cuenta de Auth, que ya no podía reintentar (#213).
 */
export function exigeCursoEnRegistro(nivel: string | null, nivelForzado: string | null): boolean {
  return !nivelForzado && nivel === 'diplomado'
}
