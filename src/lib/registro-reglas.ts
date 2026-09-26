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
 * - Sin nivel (solo el curso de ingreso) → null: un plan sin nivel no es de
 *   ningún programa. El formulario nunca lo manda; un POST a mano lo guardaba (#199).
 *
 * No valida que el id corresponda al nivel: eso lo hace `errorDePlanDeRegistro()`
 * con el catálogo de config.ts (#199).
 */
export function modalidadDeRegistro(
  nivel: string | null,
  pedida: unknown,
  nivelForzado: string | null,
): string | null {
  if (nivelForzado || !nivel || nivel === 'diplomado') return null
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

/**
 * Lo que el formulario del registro PUEDE ofrecer según config.ts. Lo arma
 * `catalogoDeRegistro()` (src/lib/niveles.ts) y se pasa desde fuera para que la
 * regla de abajo siga siendo pura.
 */
export interface CatalogoRegistro {
  /** Niveles de programa que el desplegable puede ofrecer ('diplomado' no: ese lo decide el curso publicado). */
  niveles: readonly string[]
  /** Ids de plan que config.ts DECLARA para cada uno de esos niveles, sin mirar `activa`. */
  planes: Readonly<Record<string, readonly string[]>>
  /** Slugs de carrera que config.ts declara: licenciaturas y diplomados del riel. */
  carreras: readonly string[]
}

/** Mensajes del 400. Los dos primeros son los mismos del formulario. */
export const MENSAJES_PLAN_REGISTRO = {
  sinModalidad: 'Selecciona la modalidad.',
  sinCarrera:   'Selecciona tu carrera.',
  nivel:        'Ese nivel educativo no está disponible en esta escuela. Recarga la página y vuelve a elegir.',
  modalidad:    'Esa modalidad no corresponde al nivel que elegiste. Recarga la página y vuelve a elegir.',
  carrera:      'Esa carrera no está disponible. Recarga la página y vuelve a elegir.',
} as const

/**
 * #199 — ¿El nivel, el plan y la carrera que llegan al registro son algo que el
 * formulario PUDO ofrecer? Devuelve el mensaje del 400, o null si pasa.
 *
 * Antes el servidor guardaba el plan tal como llegaba y solo lo frenaba el CHECK
 * de la base, que admite los 8 ids para cualquier nivel: un POST a mano con
 * `{"nivel":"secundaria","modalidad":"6_meses_lic"}` creaba un alumno de
 * Secundaria con el ritmo de licenciatura. Y sus hermanos: un nivel que la
 * escuela no vende, Sec/Prepa/Lic sin plan, y una carrera inválida que se volvía
 * NULL en silencio (el alumno entraba a un catálogo vacío).
 *
 * ⚠️ La regla es ESTRUCTURAL a propósito: planes que config.ts declara para el
 * nivel, SIN mirar `activa`. Este 400 llega DESPUÉS de signUp: rechazar algo que
 * el formulario pintó deja una cuenta de Auth sin alumno (#217). Mirar `activa`
 * rechazaría al aspirante que abrió el formulario antes de que el admin apagara
 * el plan, o al que lo cargó cuando getSiteConfig cayó a config.ts. El panel solo
 * publica precio y `activa` de cada plan, nunca ids ni niveles: todo lo que el
 * formulario puede ofrecer está en el catálogo.
 *
 * No juzga: nivel null (solo curso de ingreso: lo cubre la regla plan-o-curso),
 * 'diplomado' (lo cubre el curso publicado) ni el nivel forzado de solo_cursos,
 * que siempre es 'diplomado'.
 */
export function errorDePlanDeRegistro(
  pedido: { nivel: unknown; modalidad: string | null; carrera: string | null },
  catalogo: CatalogoRegistro,
): string | null {
  const { nivel, modalidad, carrera } = pedido
  if (nivel === null || nivel === undefined || nivel === 'diplomado') return null
  if (typeof nivel !== 'string' || !catalogo.niveles.includes(nivel)) return MENSAJES_PLAN_REGISTRO.nivel
  if (!modalidad) return MENSAJES_PLAN_REGISTRO.sinModalidad
  if (!(catalogo.planes[nivel] ?? []).includes(modalidad)) return MENSAJES_PLAN_REGISTRO.modalidad
  if (nivel === 'licenciatura') {
    if (!carrera) return MENSAJES_PLAN_REGISTRO.sinCarrera
    if (!catalogo.carreras.includes(carrera)) return MENSAJES_PLAN_REGISTRO.carrera
  }
  return null
}
