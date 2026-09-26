/**
 * Pagos CON su curso (D14, #207-3): la vertical y el nombre del curso en la
 * ficha, /admin/pagos, Reportes y el Excel.
 *
 * El curso de un pago sale de la FK `pagos.curso_inscripcion_id` (B1) →
 * `curso_inscripciones.curso_id` → `cursos`. Se pide en la MISMA consulta con
 * un embed de PostgREST, con la columna de cada FK como pista
 * (`!curso_inscripcion_id`, `!curso_id`): si un día hubiera otra relación entre
 * esas tablas, no se vuelve ambigua (PGRST201). Se aplana a
 * `curso_inscripcion_id`, `curso_nombre` y `curso_tipo`.
 *
 * Degradación, de más a menos:
 *  1. Con B1 y la relación: vertical y nombre.
 *  2. PostgREST no ve la relación (PGRST200: base sin el módulo de cursos, o su
 *     caché de esquema todavía no la carga tras una migración): se relee con la
 *     COLUMNA sola. La vertical sigue siendo correcta (va por la FK); solo se
 *     pierde el nombre del curso.
 *  3. Sin la columna (42703, base sin B1): se relee sin ella y todos los pagos
 *     son del programa, como siempre fueron. Esto se recuerda unos minutos
 *     para no pagar una consulta fallida en cada lectura.
 * Cualquier OTRO error se devuelve tal cual: quien llama decide (no se
 * disfraza de «sin pagos»).
 */
export const COLUMNAS_CURSO = 'curso_inscripcion_id, curso_inscripciones!curso_inscripcion_id(cursos!curso_id(nombre, tipo))'

export type CursoDePago = {
  curso_inscripcion_id: string | null
  curso_nombre: string | null
  curso_tipo: string | null
}

type Embed = { cursos?: { nombre?: unknown; tipo?: unknown } | Array<{ nombre?: unknown; tipo?: unknown }> | null } | null

/** Aplana el embed `curso_inscripciones(cursos(nombre, tipo))` de una fila. */
export function aplanarCurso<T extends Record<string, unknown>>(fila: T): Omit<T, 'curso_inscripciones'> & CursoDePago {
  const { curso_inscripciones: ci, ...resto } = fila as T & { curso_inscripciones?: Embed | Embed[] }
  const insc = Array.isArray(ci) ? ci[0] : ci
  const c = insc?.cursos
  const curso = Array.isArray(c) ? c[0] : c
  const id = typeof resto.curso_inscripcion_id === 'string' ? resto.curso_inscripcion_id : null
  return {
    ...(resto as Omit<T, 'curso_inscripciones'>),
    curso_inscripcion_id: id,
    curso_nombre: id && typeof curso?.nombre === 'string' ? curso.nombre : null,
    curso_tipo: id && typeof curso?.tipo === 'string' ? curso.tipo : null,
  }
}

type Resultado = { data: unknown; error: { code?: string; message?: string } | null }

const esSinColumna = (e: Resultado['error']) => !!e && (e.code === '42703' || /curso_inscripcion_id/.test(e.message ?? ''))
const esSinRelacion = (e: Resultado['error']) => !!e && e.code === 'PGRST200'

/** «Esta base no tiene B1»: se recuerda un rato (el proceso vive poco; una migración nueva se nota pronto). */
const RECUERDO_SIN_B1_MS = 10 * 60 * 1000
let sinB1Hasta = 0

/** Solo para pruebas: olvida lo recordado. */
export function olvidarSinB1(): void { sinB1Hasta = 0 }

/**
 * Lee con `columnas` + el curso, degradando como dice arriba.
 * `consulta(select)` arma la consulta completa (filtros, orden, límite).
 */
export async function leerPagosConCurso<T extends Record<string, unknown>>(
  consulta: (select: string) => PromiseLike<Resultado>,
  columnas: string,
): Promise<{ data: Array<Omit<T, 'curso_inscripciones'> & CursoDePago>; error: Resultado['error']; sinB1: boolean }> {
  const sinCurso = async () => {
    const r = await consulta(columnas)
    const filas = (Array.isArray(r.data) ? r.data : []) as T[]
    return {
      data: filas.map(f => ({ ...f, curso_inscripcion_id: null, curso_nombre: null, curso_tipo: null }) as Omit<T, 'curso_inscripciones'> & CursoDePago),
      error: r.error,
      sinB1: true,
    }
  }
  const aplanadas = (r: Resultado) =>
    ((Array.isArray(r.data) ? r.data : []) as T[]).map(f => aplanarCurso(f))

  if (Date.now() < sinB1Hasta) return sinCurso()

  const r = await consulta(`${columnas}, ${COLUMNAS_CURSO}`)
  if (esSinColumna(r.error)) {
    sinB1Hasta = Date.now() + RECUERDO_SIN_B1_MS
    return sinCurso()
  }
  if (esSinRelacion(r.error)) {
    const r2 = await consulta(`${columnas}, curso_inscripcion_id`)
    if (esSinColumna(r2.error)) {
      sinB1Hasta = Date.now() + RECUERDO_SIN_B1_MS
      return sinCurso()
    }
    return { data: aplanadas(r2), error: r2.error, sinB1: false }
  }
  return { data: aplanadas(r), error: r.error, sinB1: false }
}
