import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cargarAlumnoAcceso, tieneAccesoSemana } from '@/lib/acceso-materias'
import {
  indiceDeLetra,
  indiceRespuesta,
  letraDe,
  opcionesQuiz,
  preguntaPublica,
  veredictoQuiz,
  type QuizSemanaRow,
  type ResultadoQuiz,
} from '@/lib/quiz/quiz-semana'

/**
 * Quiz por semana. El acceso se gatea por pertenencia de la semana a una materia
 * accesible para el alumno (semana → mes_id → meses_contenido → materia, con el
 * criterio canon de lib/acceso-materias).
 *
 * D22d-1 (K-d1): la clave y la explicación ya NO viajan al navegador antes de
 * contestar, y califica el SERVIDOR pregunta por pregunta:
 *   * GET  → preguntas por lista blanca (lib/quiz/quiz-semana) + el veredicto de
 *            las que el alumno YA contestó (su primera respuesta, recalculada
 *            contra la clave).
 *   * POST { pregunta_id, respuesta } → califica UNA pregunta. Candado de primera
 *            respuesta: si ya la contestó, devuelve ese veredicto y no escribe.
 *   * POST { respuestas: { id: índice } } → compatibilidad con el bundle anterior
 *            (K-d12, una versión): todo o nada, con las mismas validaciones.
 * Todo con el service role DESPUÉS del gate: D22d-2 deja al alumno sin lectura de
 * quiz_semana y sin escritura de quiz_respuestas por /rest/v1.
 *
 * Se lee select('*') para las dos formas históricas (opcion_a..d con letra, u
 * `opciones` JSONB con índice); lo que SALE es la lista blanca.
 */

/** ¿El error dice que la tabla es de la otra forma (JSONB por semana vs. filas por pregunta)? */
function esOtraForma(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('semana_id') || msg.includes('respuestas') || msg.includes('column') ||
    error.code === 'PGRST204' || error.code === '42703'
}

/**
 * Primera respuesta del alumno a cada pregunta (índice por quiz_id).
 * Forma JSONB: una fila por semana con `respuestas`. Forma de filas: la MÁS
 * ANTIGUA por pregunta (la `fecha` la pone la base al insertar).
 */
async function leerRespuestasAlumno(
  admin: SupabaseClient,
  alumnoId: string,
  semanaId: string,
  preguntaIds: string[],
): Promise<{ respuestas: Record<string, number>; forma: 'jsonb' | 'filas' }> {
  const jsonb = await admin
    .from('quiz_respuestas')
    .select('respuestas')
    .eq('alumno_id', alumnoId)
    .eq('semana_id', semanaId)
    .maybeSingle()
  if (!jsonb.error) {
    const crudo = (jsonb.data as { respuestas?: unknown } | null)?.respuestas
    const respuestas: Record<string, number> = {}
    if (crudo && typeof crudo === 'object') {
      for (const [id, v] of Object.entries(crudo as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0) respuestas[id] = v
      }
    }
    return { respuestas, forma: 'jsonb' }
  }
  if (!esOtraForma(jsonb.error)) throw new Error(jsonb.error.message)

  const respuestas: Record<string, number> = {}
  if (preguntaIds.length === 0) return { respuestas, forma: 'filas' }
  const { data, error } = await admin
    .from('quiz_respuestas')
    .select('quiz_id, respuesta, fecha')
    .eq('alumno_id', alumnoId)
    .in('quiz_id', preguntaIds)
    .order('fecha', { ascending: true })
  if (error) throw new Error(error.message)
  for (const a of data ?? []) {
    const r = a as { quiz_id: string; respuesta: unknown }
    const idx = indiceDeLetra(r.respuesta)
    // La primera cuenta (candado): las siguientes no la reemplazan.
    if (idx !== null && respuestas[r.quiz_id] === undefined) respuestas[r.quiz_id] = idx
  }
  return { respuestas, forma: 'filas' }
}

/** Guarda respuestas NUEVAS (las ya contestadas nunca se reemplazan). */
async function guardarRespuestas(
  admin: SupabaseClient,
  alumnoId: string,
  semanaId: string,
  forma: 'jsonb' | 'filas',
  previas: Record<string, number>,
  nuevas: { fila: QuizSemanaRow; idx: number }[],
): Promise<{ error: string | null }> {
  if (nuevas.length === 0) return { error: null }
  if (forma === 'jsonb') {
    const respuestas: Record<string, number> = {}
    for (const n of nuevas) respuestas[n.fila.id] = n.idx
    Object.assign(respuestas, previas)          // lo ya contestado gana: candado
    const { error } = await admin.from('quiz_respuestas').upsert(
      { alumno_id: alumnoId, semana_id: semanaId, respuestas, completado_en: new Date().toISOString() },
      { onConflict: 'alumno_id,semana_id', ignoreDuplicates: false },
    )
    return { error: error?.message ?? null }
  }
  const { error } = await admin.from('quiz_respuestas').insert(
    nuevas.map(n => ({
      alumno_id: alumnoId,
      quiz_id: n.fila.id,
      respuesta: letraDe(n.idx),
      // Informativo: el veredicto se RECALCULA siempre contra la clave al leer.
      correcta: veredictoQuiz(n.fila, n.idx).correcta,
    })),
  )
  return { error: error?.message ?? null }
}

/** Sesión + alumno + gate de la semana. Devuelve la respuesta de error o el alumno. */
async function autorizar(semanaIdCrudo: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

  const semanaId = typeof semanaIdCrudo === 'string' ? semanaIdCrudo.trim() : ''
  if (!semanaId) return { error: NextResponse.json({ error: 'semanaId requerido' }, { status: 400 }) }

  const alumno = await cargarAlumnoAcceso(supabase, user.id)
  if (!alumno) return { error: NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 }) }

  const gate = await tieneAccesoSemana(supabase, alumno, semanaId)
  if (!gate.encontrada) return { error: NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 }) }
  if (!gate.acceso) return { error: NextResponse.json({ error: 'No tienes acceso a este contenido' }, { status: 403 }) }

  return { alumnoId: alumno.id as string, semanaId }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { semanaId: string } }
) {
  try {
    const a = await autorizar(params?.semanaId)
    if ('error' in a) return a.error
    const { alumnoId, semanaId } = a

    const admin = createAdminClient()
    const { data: rawRows, error: quizErr } = await admin
      .from('quiz_semana')
      .select('*')
      .eq('semana_id', semanaId)
      // Solo las activas: una pregunta archivada deja de servirse, aunque lo
      // que el alumno ya respondió de ella se siga calificando igual.
      .eq('activa', true)
      .order('orden', { ascending: true })

    if (quizErr) {
      console.error('[quiz GET] quiz_semana', quizErr)
      return NextResponse.json({ error: 'Error al cargar preguntas' }, { status: 500 })
    }

    const filas = ((rawRows ?? []) as QuizSemanaRow[]).filter(f => preguntaPublica(f) !== null)
    const preguntas = filas.map(f => preguntaPublica(f)!)
    const { respuestas } = await leerRespuestasAlumno(admin, alumnoId, semanaId, filas.map(f => f.id))

    // El veredicto (y la explicación) SOLO de lo ya contestado.
    const resultados: Record<string, ResultadoQuiz> = {}
    for (const f of filas) {
      const idx = respuestas[f.id]
      if (idx !== undefined) resultados[f.id] = veredictoQuiz(f, idx)
    }
    const total = preguntas.length
    const contestadas = Object.keys(resultados).length
    return NextResponse.json({
      preguntas,
      resultados,
      completado: total > 0 && contestadas === total,
      aciertos: Object.values(resultados).filter(r => r.correcta).length,
      total,
    })
  } catch (e) {
    console.error('[quiz GET]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { semanaId: string } }
) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { pregunta_id?: unknown; respuesta?: unknown; respuestas?: unknown }
      | null

    // ── Mismo gate que el GET: guardar respuestas de una semana bloqueada
    // dejaría el hueco vivo por POST directo ─────────────────────────────────
    const a = await autorizar(params?.semanaId)
    if ('error' in a) return a.error
    const { alumnoId, semanaId } = a
    const admin = createAdminClient()

    // ── Forma actual: UNA pregunta ───────────────────────────────────────────
    if (body && typeof body.pregunta_id === 'string') {
      // SIN filtro de `activa` a propósito: califica lo que el alumno contestó.
      // Con filtro de semana: un id de otra semana (o de una bloqueada) no pasa.
      const { data: fila, error } = await admin
        .from('quiz_semana')
        .select('*')
        .eq('id', body.pregunta_id)
        .eq('semana_id', semanaId)
        .maybeSingle()
      if (error) return NextResponse.json({ error: 'Error al leer la pregunta' }, { status: 500 })
      if (!fila) return NextResponse.json({ error: 'La pregunta no es de esta semana.' }, { status: 400 })
      const row = fila as QuizSemanaRow
      const opciones = opcionesQuiz(row)
      const idx = opciones ? indiceRespuesta(body.respuesta, opciones.length) : null
      if (idx === null) return NextResponse.json({ error: 'Respuesta inválida.' }, { status: 400 })

      const { respuestas: previas, forma } = await leerRespuestasAlumno(admin, alumnoId, semanaId, [row.id])
      // Candado: la primera respuesta es la que cuenta.
      if (previas[row.id] !== undefined) {
        return NextResponse.json({ ...veredictoQuiz(row, previas[row.id]), ya_respondida: true })
      }
      const g = await guardarRespuestas(admin, alumnoId, semanaId, forma, previas, [{ fila: row, idx }])
      if (g.error) {
        console.error('[quiz POST] guardar', g.error)
        return NextResponse.json({ error: 'Error al guardar tu respuesta' }, { status: 500 })
      }
      return NextResponse.json(veredictoQuiz(row, idx))
    }

    // ── Compatibilidad (K-d12, una versión): el bundle anterior manda todo junto ──
    if (body && body.respuestas && typeof body.respuestas === 'object') {
      const enviadas = body.respuestas as Record<string, unknown>
      const ids = Object.keys(enviadas)
      if (ids.length === 0) return NextResponse.json({ error: 'respuestas requeridas' }, { status: 400 })
      // SIN filtro de `activa` (califica); CON filtro de semana.
      const { data: filas, error } = await admin
        .from('quiz_semana')
        .select('*')
        .eq('semana_id', semanaId)
        .in('id', ids)
      if (error) return NextResponse.json({ error: 'Error al leer las preguntas' }, { status: 500 })
      const porId = new Map(((filas ?? []) as QuizSemanaRow[]).map(f => [f.id, f]))
      const validas: { fila: QuizSemanaRow; idx: number }[] = []
      for (const id of ids) {
        const fila = porId.get(id)
        const opciones = fila ? opcionesQuiz(fila) : null
        const idx = fila && opciones ? indiceRespuesta(enviadas[id], opciones.length) : null
        // Todo o nada: un id ajeno o un índice inválido rechaza el envío completo.
        if (!fila || idx === null) {
          return NextResponse.json({ error: 'Respuestas inválidas.' }, { status: 400 })
        }
        validas.push({ fila, idx })
      }
      const { respuestas: previas, forma } = await leerRespuestasAlumno(admin, alumnoId, semanaId, ids)
      const nuevas = validas.filter(v => previas[v.fila.id] === undefined)
      const g = await guardarRespuestas(admin, alumnoId, semanaId, forma, previas, nuevas)
      if (g.error) {
        console.error('[quiz POST] guardar (compat)', g.error)
        return NextResponse.json({ error: 'Error al guardar respuestas' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'respuestas requeridas' }, { status: 400 })
  } catch (e) {
    console.error('[quiz POST]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
