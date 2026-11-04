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

/**
 * Mensajes del 400. Los dos primeros son los mismos del formulario. Los otros
 * no dicen «recarga y vuelve a elegir»: a esta altura la cuenta de Auth YA
 * existe, y reintentar con el mismo correo solo da «ya existe una cuenta» (#217).
 */
const COMPLETAR = 'Tu cuenta quedó creada: comunícate con la escuela para completar tu inscripción.'
export const MENSAJES_PLAN_REGISTRO = {
  sinModalidad: 'Selecciona la modalidad.',
  sinCarrera:   'Selecciona tu carrera.',
  nivel:        `Ese nivel educativo no está disponible en esta escuela. ${COMPLETAR}`,
  modalidad:    `Esa modalidad no corresponde al nivel que elegiste. ${COMPLETAR}`,
  carrera:      `Esa carrera no está disponible. ${COMPLETAR}`,
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
  const motivo = motivoPlanInvalido(pedido, catalogo)
  return motivo ? MENSAJES_PLAN_REGISTRO[motivo] : null
}

/** Por qué un plan no cabe; cada puerta pone su propio mensaje. */
export type MotivoPlan = 'nivel' | 'sinModalidad' | 'modalidad' | 'sinCarrera' | 'carrera'

/**
 * La regla ESTRUCTURAL de arriba, sin mensaje: la usan el registro público
 * (`errorDePlanDeRegistro`) y el alta del admin (D9, #199-admin), cada una con
 * sus palabras. Mismas exenciones: sin nivel y 'diplomado' no se juzgan aquí.
 */
export function motivoPlanInvalido(
  pedido: { nivel: unknown; modalidad: string | null; carrera: string | null },
  catalogo: CatalogoRegistro,
): MotivoPlan | null {
  const { nivel, modalidad, carrera } = pedido
  if (nivel === null || nivel === undefined || nivel === 'diplomado') return null
  if (typeof nivel !== 'string' || !catalogo.niveles.includes(nivel)) return 'nivel'
  if (!modalidad) return 'sinModalidad'
  if (!(catalogo.planes[nivel] ?? []).includes(modalidad)) return 'modalidad'
  if (nivel === 'licenciatura') {
    if (!carrera) return 'sinCarrera'
    if (!catalogo.carreras.includes(carrera)) return 'carrera'
  }
  return null
}

// ─── Edad y tutor (combos con Primaria) ──────────────────────────────────────

/** Los niveles a los que se les pide fecha de nacimiento, con Primaria encendida. */
export const NIVELES_CON_EDAD: readonly string[] = ['primaria', 'secundaria']

export const EDAD_MAYORIA = 18
export const EDAD_MINIMA_REGISTRO = 5

/** Los parentescos que ofrece el formulario. */
export const PARENTESCOS_TUTOR = ['Madre', 'Padre', 'Tutor o tutora legal', 'Abuela o abuelo', 'Otro familiar'] as const

/** Hoy en México, `YYYY-MM-DD`: el cumpleaños no depende de la zona horaria del servidor. */
export function hoyEnMexico(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(ahora)
}

/** `YYYY-MM-DD` válido, o null: rechaza «2026-02-30» y cualquier otra forma. */
export function fechaValida(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!m) return null
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(anio, mes - 1, dia))
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia ? m[0] : null
}

/** Años cumplidos a una fecha. Solo compara texto: no hay zona horaria que lo mueva. */
export function edadEnAnios(fechaNacimiento: string, hoy: string = hoyEnMexico()): number {
  const anios = Number(hoy.slice(0, 4)) - Number(fechaNacimiento.slice(0, 4))
  return hoy.slice(5) < fechaNacimiento.slice(5) ? anios - 1 : anios
}

/** Lo que llega del formulario. Todo opcional: la regla decide qué falta. */
export interface DatosEdadTutor {
  fecha_nacimiento?: unknown
  tutor_nombre?: unknown
  tutor_telefono?: unknown
  tutor_parentesco?: unknown
}

/** Lo que se guarda en `alumnos`. */
export interface EdadTutorLimpio {
  fecha_nacimiento: string | null
  tutor_nombre: string | null
  tutor_telefono: string | null
  tutor_parentesco: string | null
}

export const VACIO_EDAD_TUTOR: EdadTutorLimpio = {
  fecha_nacimiento: null, tutor_nombre: null, tutor_telefono: null, tutor_parentesco: null,
}

export const MENSAJES_EDAD_TUTOR = {
  sinFecha:      'Escribe la fecha de nacimiento del alumno.',
  fechaFutura:   'Revisa la fecha de nacimiento: no puede ser una fecha futura ni de hace muy poco.',
  sinTutorNombre: 'El alumno es menor de 18 años: escribe el nombre de su madre, padre o tutor.',
  sinTutorTelefono: 'El alumno es menor de 18 años: escribe un teléfono de 10 dígitos de su madre, padre o tutor.',
  sinParentesco: 'El alumno es menor de 18 años: elige el parentesco de su madre, padre o tutor.',
} as const

const texto = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

/**
 * ¿A este alumno se le piden edad y tutor? Solo en un combo con Primaria y solo
 * para Primaria y Secundaria, que comparten el formulario. Sin Primaria, la
 * inscripción queda exactamente como siempre.
 */
export function pideEdadYTutor(nivel: unknown, primariaEncendida: boolean): boolean {
  return primariaEncendida && typeof nivel === 'string' && NIVELES_CON_EDAD.includes(nivel)
}

/**
 * Valida edad y tutor. Devuelve el mensaje de error o los datos limpios.
 *
 * ⚠️ Se llama ANTES de `signUp` en el formulario y de `createUser` en el alta: un
 * 400 después deja una cuenta de Auth sin alumno (registro-reglas, #217). El
 * servidor la repite porque el formulario se puede saltar.
 *
 * Un mayor de edad no guarda datos de tutor aunque el formulario los mande: no
 * hay consentimiento que acreditar y serían datos de un tercero de más.
 */
export function revisarEdadTutor(
  datos: DatosEdadTutor,
  hoy: string = hoyEnMexico(),
): { ok: true; datos: EdadTutorLimpio } | { ok: false; error: string } {
  const fecha = fechaValida(datos.fecha_nacimiento)
  if (!fecha) return { ok: false, error: MENSAJES_EDAD_TUTOR.sinFecha }
  const edad = edadEnAnios(fecha, hoy)
  if (edad < EDAD_MINIMA_REGISTRO || edad > 120) return { ok: false, error: MENSAJES_EDAD_TUTOR.fechaFutura }
  if (edad >= EDAD_MAYORIA) return { ok: true, datos: { ...VACIO_EDAD_TUTOR, fecha_nacimiento: fecha } }
  const tutor_nombre = texto(datos.tutor_nombre, 160)
  const tutor_telefono = texto(datos.tutor_telefono, 20).replace(/\D/g, '')
  const tutor_parentesco = texto(datos.tutor_parentesco, 40)
  if (tutor_nombre.length < 3) return { ok: false, error: MENSAJES_EDAD_TUTOR.sinTutorNombre }
  if (tutor_telefono.length !== 10) return { ok: false, error: MENSAJES_EDAD_TUTOR.sinTutorTelefono }
  if (!(PARENTESCOS_TUTOR as readonly string[]).includes(tutor_parentesco)) {
    return { ok: false, error: MENSAJES_EDAD_TUTOR.sinParentesco }
  }
  return { ok: true, datos: { fecha_nacimiento: fecha, tutor_nombre, tutor_telefono, tutor_parentesco } }
}

/** Mensajes del alta del admin (D9): a él sí se le puede pedir que corrija el formulario. */
export const MENSAJES_PLAN_ADMIN: Record<MotivoPlan, string> = {
  nivel:        'Ese nivel no está disponible en esta escuela.',
  sinModalidad: 'Selecciona la modalidad.',
  modalidad:    'Esa modalidad no corresponde al nivel elegido: elige una de las que se ofrecen para ese nivel.',
  sinCarrera:   'Selecciona la carrera.',
  carrera:      'Esa carrera no está en el catálogo de la escuela.',
}
