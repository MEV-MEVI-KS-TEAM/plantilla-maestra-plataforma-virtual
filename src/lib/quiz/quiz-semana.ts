/**
 * Quiz semanal — forma pública de las preguntas y calificación en el servidor.
 * Bloque D · D22d-1 (decisión K-d1 de Kevin).
 *
 * Antes el GET mandaba al navegador `respuesta_correcta` y `explicacion` de
 * TODAS las preguntas antes de contestar, y el navegador calificaba. Ahora:
 *   * el navegador recibe la pregunta por LISTA BLANCA (id, texto, opciones,
 *     orden): nunca la clave ni la explicación antes de contestar;
 *   * califica el SERVIDOR, pregunta por pregunta, con candado de PRIMERA
 *     respuesta: la que cuenta es la primera que el alumno dio, y el veredicto
 *     se recalcula siempre contra la clave (nunca se confía en un `correcta`
 *     guardado);
 *   * no hay letra por defecto: una clave ilegible no se convierte en «a», y un
 *     índice fuera de las opciones se rechaza en vez de recortarse.
 *
 * Soporta las dos formas históricas de `quiz_semana`: columnas opcion_a..d con
 * clave en letra, y `opciones` JSONB con clave numérica.
 *
 * Este archivo no importa nada de servidor: se prueba en tests/unit.
 */

/** Fila cruda de quiz_semana (las dos formas históricas). Solo el servidor la ve. */
export interface QuizSemanaRow {
  id: string
  semana_id?: string
  pregunta: string
  orden: number | null
  opciones?: unknown
  respuesta_correcta?: unknown
  explicacion?: string | null
  opcion_a?: string | null
  opcion_b?: string | null
  opcion_c?: string | null
  opcion_d?: string | null
}

/** Lo único que ve el alumno antes de contestar. */
export interface PreguntaQuizPublica {
  id: string
  pregunta: string
  opciones: string[]
  orden: number
}

/** El veredicto de UNA pregunta ya contestada (lo calcula el servidor). */
export interface ResultadoQuiz {
  tu_respuesta: number
  correcta: boolean
  explicacion?: string
}

/** Opciones de la fila, en cualquiera de las dos formas; null si no trae ninguna. */
export function opcionesQuiz(row: QuizSemanaRow): string[] | null {
  if (row.opcion_a != null && row.opcion_b != null && row.opcion_c != null) {
    // opcion_d es opcional (preguntas legacy de 3 opciones)
    return [row.opcion_a, row.opcion_b, row.opcion_c, row.opcion_d]
      .filter((o): o is string => o != null && o !== '')
      .map(String)
  }
  if (Array.isArray(row.opciones)) return row.opciones.map(String)
  return null
}

/** Lista blanca: la única forma en que una pregunta del quiz sale al navegador. */
export function preguntaPublica(row: QuizSemanaRow): PreguntaQuizPublica | null {
  const opciones = opcionesQuiz(row)
  if (!opciones) return null
  return { id: row.id, pregunta: row.pregunta ?? '', opciones, orden: row.orden ?? 0 }
}

/**
 * Índice de la clave (0-3), desde letra a-d, número 0-3 o texto "0".."3".
 * null si no se entiende: SIN letra por defecto (antes caía en «a»).
 */
export function claveQuiz(row: QuizSemanaRow): number | null {
  const rc = row.respuesta_correcta
  if (typeof rc === 'number' && Number.isInteger(rc) && rc >= 0 && rc <= 3) return rc
  const s = String(rc ?? '').trim().toLowerCase()
  const i = ['a', 'b', 'c', 'd'].indexOf(s)
  if (i >= 0) return i
  const j = ['0', '1', '2', '3'].indexOf(s)
  return j >= 0 ? j : null
}

/** Índice de la respuesta si es un entero dentro de las opciones de ESTA pregunta; si no, null. */
export function indiceRespuesta(v: unknown, nOpciones: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < nOpciones ? v : null
}

/** Letra a-d de un índice (la forma legacy de quiz_respuestas guarda la letra). */
export const letraDe = (i: number): string => String.fromCharCode(97 + i)

/** Índice de una letra guardada (a-d); null si no se entiende. */
export function indiceDeLetra(letra: unknown): number | null {
  const i = ['a', 'b', 'c', 'd'].indexOf(String(letra ?? '').trim().toLowerCase())
  return i >= 0 ? i : null
}

/**
 * Veredicto de una respuesta YA contestada: si fue correcta y la explicación de
 * ESA pregunta. Una clave ilegible nunca da por buena una respuesta.
 */
export function veredictoQuiz(row: QuizSemanaRow, idx: number): ResultadoQuiz {
  const clave = claveQuiz(row)
  const exp = typeof row.explicacion === 'string' && row.explicacion.trim() !== '' ? row.explicacion.trim() : undefined
  return { tu_respuesta: idx, correcta: clave !== null && idx === clave, ...(exp ? { explicacion: exp } : {}) }
}
