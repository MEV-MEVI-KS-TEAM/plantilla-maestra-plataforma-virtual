/**
 * Examen mensual (evaluaciones + preguntas) — lectura y calificación en el
 * servidor. Bloque D · D22d-1.
 *
 * SEGURIDAD — la clave (`preguntas.respuesta_correcta`) la lee SOLO el servidor,
 * con el service role, DESPUÉS del gate de acceso de la ruta. Mismo molde que el
 * examen final de curso (`lib/cursos/examen.ts`):
 *   * Lo que sale al navegador mientras el alumno contesta es la pregunta
 *     sanitizada (lista blanca: sin clave).
 *   * La revisión de un envío es DIFERIDA (decisión K-d3 de Kevin): mientras el
 *     alumno pueda volver a presentar, solo ve su puntaje. El ✓/✗ por pregunta y
 *     la respuesta correcta —solo de lo que contestó— llegan cuando el examen se
 *     CIERRA: aprobó (y aprobar cierra, K-d2) o usó su último intento. Con el ✓/✗
 *     en cada intento, contestar «a», luego «b» en lo fallado y luego «c»
 *     aprobaba sin estudiar.
 *
 * Este archivo no importa nada de servidor: se prueba en tests/unit.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Calificación mínima del examen mensual (porcentaje). */
export const MINIMO_APROBATORIO_MENSUAL = 60

const LETRAS = ['a', 'b', 'c', 'd'] as const

/** Fila de `preguntas` tal como la lee el SERVIDOR: con la clave. Nunca sale tal cual. */
export interface PreguntaEvaluacion {
  id: string
  orden: number | null
  pregunta: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string | null
  respuesta_correcta: string
  /** La que el alumno ve mientras contesta (el GET sirve solo las activas). */
  activa?: boolean | null
}

/** Lo único que ve el alumno mientras contesta (forma que consume EvaluacionClient). */
export interface PreguntaEvaluacionPublica {
  id: string
  numero: number
  pregunta: string
  texto: string
  texto_en: string
  tipo: 'OPCION_MULTIPLE'
  opciones: string[]
  opciones_en: string[]
  puntos: number
}

/** Una pregunta en la revisión de un envío. */
export interface DetalleEvaluacion {
  pregunta_id: string
  numero: number
  texto: string
  texto_en: string
  tipo: 'opcion_multiple'
  opciones: string[]
  opciones_en: string[]
  /** Índice que mandó el alumno, o -1 si no contestó (o mandó un índice inválido). */
  respuesta_alumno: number
  /** Lo decide el servidor: una respuesta fuera de rango no cuenta como contestada. */
  contestada: boolean
  retroalimentacion: ''
  /** Solo si el examen se cerró con este envío (revelar). */
  es_correcta?: boolean
  /** Solo si el examen se cerró Y el alumno contestó esta pregunta. */
  respuesta_correcta?: number
}

/**
 * Lee las preguntas de una evaluación con el service role (con la clave).
 *
 * `soloActivas`: el LISTADO que ve el alumno sirve solo las activas; la
 * CALIFICACIÓN no filtra `activa` a propósito: si el admin archiva una pregunta
 * con el examen abierto, filtrar al calificar le cambiaría la nota.
 */
export async function leerPreguntasEvaluacion(
  admin: SupabaseClient,
  evaluacionId: string,
  { soloActivas }: { soloActivas: boolean },
): Promise<{ preguntas: PreguntaEvaluacion[]; error: string | null }> {
  let q = admin
    .from('preguntas')
    .select('id, orden, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, activa')
    .eq('evaluacion_id', evaluacionId)
  if (soloActivas) q = q.eq('activa', true)
  const { data, error } = await q.order('orden')
  if (error) return { preguntas: [], error: error.message }
  return { preguntas: (data ?? []) as unknown as PreguntaEvaluacion[], error: null }
}

export const opcionesDe = (p: Pick<PreguntaEvaluacion, 'opcion_a' | 'opcion_b' | 'opcion_c' | 'opcion_d'>): string[] =>
  [p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d].filter(Boolean) as string[]

/** Lista blanca: la única forma en que una pregunta del examen mensual sale al navegador antes de contestar. */
export function sanitizarPreguntaEvaluacion(p: PreguntaEvaluacion, i: number): PreguntaEvaluacionPublica {
  const opciones = opcionesDe(p)
  return {
    id: p.id,
    numero: p.orden ?? i + 1,
    pregunta: p.pregunta,
    texto: p.pregunta,
    texto_en: p.pregunta,
    tipo: 'OPCION_MULTIPLE',
    opciones,
    opciones_en: opciones,
    puntos: 1,
  }
}

/** Índice de la respuesta del alumno si es válido para ESTA pregunta (entero dentro de sus opciones); si no, -1. */
export function indiceValido(v: unknown, nOpciones: number): number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < nOpciones ? v : -1
}

/**
 * Valida el envío ANTES de calificar y ANTES de gastar un intento (R2, soporte
 * IVS 8-oct-2026, Bug 69). Rechaza —no recorta—:
 *   * que `respuestas` no sea un objeto;
 *   * un id que no es pregunta de ESTE examen;
 *   * un valor que no es un índice entero dentro de las opciones de esa pregunta;
 *   * un envío INCOMPLETO: tienen que venir TODAS las preguntas activas (las que
 *     sirve el GET y exige la pantalla). Con envíos parciales y 3 intentos se
 *     sacaban «bits» de la clave (contestar una sola, o cambiar una, y ver cuánto
 *     se movía el puntaje); el envío vacío era el caso extremo.
 * Una pregunta archivada a mitad del examen que el alumno sí contestó se acepta
 * (y se califica); una archivada sin contestar no se exige.
 */
export function validarEnvio(
  preguntas: PreguntaEvaluacion[],
  respuestas: unknown,
): { ok: true; respuestas: Record<string, number> } | { ok: false; error: string } {
  if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) {
    return { ok: false, error: 'Contesta todas las preguntas antes de enviar la evaluación.' }
  }
  const porId = new Map(preguntas.map(p => [p.id, p]))
  const limpias: Record<string, number> = {}
  for (const [id, v] of Object.entries(respuestas as Record<string, unknown>)) {
    const p = porId.get(id)
    if (!p) return { ok: false, error: 'Respuestas inválidas.' }
    const idx = indiceValido(v, opcionesDe(p).length)
    if (idx < 0) return { ok: false, error: 'Respuestas inválidas.' }
    limpias[id] = idx
  }
  const faltan = preguntas.filter(p => p.activa !== false && limpias[p.id] === undefined).length
  if (faltan > 0 || Object.keys(limpias).length === 0) {
    return { ok: false, error: 'Contesta todas las preguntas antes de enviar la evaluación.' }
  }
  return { ok: true, respuestas: limpias }
}

/** Índice (0-3) de la clave; -1 si la fila trae algo que no es a/b/c/d. */
export function indiceClave(clave: unknown): number {
  return LETRAS.indexOf(String(clave ?? '').trim().toLowerCase() as (typeof LETRAS)[number])
}

/**
 * Califica un envío. Una pregunta sin contestar o con un índice inválido cuenta
 * como incorrecta y no se omite del total (el denominador son todas las
 * preguntas, también las archivadas a mitad del examen).
 *
 * `revelar`: la ruta lo pone en `true` SOLO cuando el examen se cierra con este
 * envío. Con `false` no viaja ni el ✓/✗ ni ninguna clave.
 */
export function calificarEvaluacion(
  preguntas: PreguntaEvaluacion[],
  respuestas: Record<string, unknown>,
  { revelar }: { revelar: boolean },
): {
  correctas: number
  contestadas: number
  total: number
  puntaje: number
  acreditado: boolean
  detalle: DetalleEvaluacion[]
} {
  let correctas = 0
  let contestadas = 0
  const detalle = preguntas.map(p => {
    const opciones = opcionesDe(p)
    const idx = indiceValido(respuestas?.[p.id], opciones.length)
    const contestada = idx >= 0
    const clave = indiceClave(p.respuesta_correcta)
    const esCorrecta = contestada && clave >= 0 && idx === clave
    if (esCorrecta) correctas++
    if (contestada) contestadas++

    const base: DetalleEvaluacion = {
      pregunta_id: p.id,
      numero: p.orden ?? 0,
      texto: p.pregunta,
      texto_en: p.pregunta,
      tipo: 'opcion_multiple',
      opciones,
      opciones_en: opciones,
      respuesta_alumno: idx,
      contestada,
      retroalimentacion: '',
    }
    if (!revelar) return base
    // Cerrado: el ✓/✗ de todo, y la clave SOLO de lo contestado (sin contestar
    // no se regala: la clave se OMITE, no va como -1 ni null).
    return contestada && clave >= 0
      ? { ...base, es_correcta: esCorrecta, respuesta_correcta: clave }
      : { ...base, es_correcta: esCorrecta }
  })

  const total = preguntas.length
  const puntaje = total > 0 ? Math.round((correctas / total) * 100) : 0
  return { correctas, contestadas, total, puntaje, acreditado: puntaje >= MINIMO_APROBATORIO_MENSUAL, detalle }
}
