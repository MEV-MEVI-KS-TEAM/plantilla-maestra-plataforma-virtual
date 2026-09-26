import { baseSinPagosDeCurso } from '@/lib/cursos/inscripciones'

/**
 * Pagos CON su curso (D14, #207-3): la vertical y el nombre del curso en la
 * ficha, /admin/pagos, Reportes y el Excel.
 *
 * El curso de un pago sale de la FK `pagos.curso_inscripcion_id` (B1) →
 * `curso_inscripciones.curso_id` → `cursos`. Se pide en la MISMA consulta con
 * un embed de PostgREST (una sola FK en cada salto: sin ambigüedad), y se
 * aplana a `curso_inscripcion_id`, `curso_nombre` y `curso_tipo`.
 *
 * ⚠️ Una base SIN B1 no tiene la columna ni la relación: pedirlas tumba la
 * consulta entera (42703 / PGRST200). Ahí se relee sin ellas y todos los pagos
 * son del programa, como siempre fueron. Cualquier OTRO error se devuelve tal
 * cual: quien llama decide (no se disfraza de «sin pagos»).
 */
export const COLUMNAS_CURSO = 'curso_inscripcion_id, curso_inscripciones(cursos(nombre, tipo))'

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

/**
 * Lee con `columnas` + el curso; sin B1, solo `columnas` (y el curso en null).
 * `consulta(select)` arma la consulta completa (filtros, orden, límite).
 */
export async function leerPagosConCurso<T extends Record<string, unknown>>(
  consulta: (select: string) => PromiseLike<Resultado>,
  columnas: string,
): Promise<{ data: Array<Omit<T, 'curso_inscripciones'> & CursoDePago>; error: Resultado['error']; sinB1: boolean }> {
  const r = await consulta(`${columnas}, ${COLUMNAS_CURSO}`)
  if (r.error && baseSinPagosDeCurso(r.error)) {
    const r2 = await consulta(columnas)
    const filas = (Array.isArray(r2.data) ? r2.data : []) as T[]
    return {
      data: filas.map(f => ({ ...f, curso_inscripcion_id: null, curso_nombre: null, curso_tipo: null })),
      error: r2.error,
      sinB1: true,
    }
  }
  const filas = (Array.isArray(r.data) ? r.data : []) as T[]
  return { data: filas.map(f => aplanarCurso(f)), error: r.error, sinB1: false }
}
