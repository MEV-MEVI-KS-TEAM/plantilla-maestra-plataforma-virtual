import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import {
  calificarEvaluacion, indiceValido, sanitizarPreguntaEvaluacion, type PreguntaEvaluacion,
} from '@/lib/evaluaciones/examen-mensual'
import {
  claveQuiz, indiceRespuesta, preguntaPublica, veredictoQuiz, type QuizSemanaRow,
} from '@/lib/quiz/quiz-semana'

/**
 * Bloque D · D22d-1 — la respuesta correcta solo la lee el servidor (la app).
 * Decisiones de Kevin: K-d1 (quiz calificado por el servidor, pregunta por
 * pregunta, candado de primera respuesta), K-d2 (aprobar cierra los dos
 * exámenes), K-d3 (revisión diferida: con reintento, solo puntaje y desglose;
 * ✓/✗ y clave al cerrar), K-d12 (el POST del quiz en bloque, una versión).
 * La base (RLS, privilegios, K4) va en D22d-2.
 */
const raiz = process.cwd()
const leer = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const RUTA_EV = ['src', 'app', 'api', 'alumno', 'evaluacion', '[id]', 'route.ts']
const RUTA_ENVIAR = ['src', 'app', 'api', 'alumno', 'evaluacion', '[id]', 'enviar', 'route.ts']
const RUTA_QUIZ = ['src', 'app', 'api', 'alumno', 'quiz', '[semanaId]', 'route.ts']
const RUTA_CURSO_GET = ['src', 'app', 'api', 'alumno', 'cursos', '[id]', 'examen', 'route.ts']
const RUTA_CURSO_ENVIAR = ['src', 'app', 'api', 'alumno', 'cursos', '[id]', 'examen', 'enviar', 'route.ts']

const banco = (n: number, claves = 'abcd'): PreguntaEvaluacion[] => Array.from({ length: n }, (_, i) => ({
  id: `p${i + 1}`, orden: i + 1, pregunta: `¿P${i + 1}?`,
  opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D', respuesta_correcta: claves[i % claves.length],
}))
const clavesIdx = (b: PreguntaEvaluacion[]) => Object.fromEntries(b.map(p => [p.id, 'abcd'.indexOf(p.respuesta_correcta)]))

// ─── Examen mensual (lib pura) ──────────────────────────────────────────────────
test('1. mensual: sin revelar no viaja ni el ✓/✗ ni ninguna clave (K-d3)', () => {
  const b = banco(10)
  const r = calificarEvaluacion(b, clavesIdx(b), { revelar: false })
  expect(r.correctas).toBe(10)
  expect(r.puntaje).toBe(100)
  const cable = JSON.parse(JSON.stringify(r.detalle))
  for (const d of cable) {
    expect(d).not.toHaveProperty('es_correcta')
    expect(d).not.toHaveProperty('respuesta_correcta')
    expect(d.contestada).toBe(true)
  }
  expect(JSON.stringify(cable)).not.toMatch(/es_correcta|respuesta_correcta/)
})

test('2. mensual: al cerrar, el ✓/✗ de todo y la clave SOLO de lo contestado', () => {
  const b = banco(10)
  const resp = { p1: 0, p2: 0, p3: 3 }            // p1 bien (a), p2 mal (clave b), p3 mal (clave c)
  const r = calificarEvaluacion(b, resp, { revelar: true })
  expect(r.contestadas).toBe(3)
  expect(r.correctas).toBe(1)
  const d = Object.fromEntries(r.detalle.map(x => [x.pregunta_id, x]))
  expect(d.p1).toMatchObject({ es_correcta: true, respuesta_correcta: 0, respuesta_alumno: 0 })
  expect(d.p2).toMatchObject({ es_correcta: false, respuesta_correcta: 1 })
  expect(d.p3).toMatchObject({ es_correcta: false, respuesta_correcta: 2 })
  for (const id of ['p4', 'p5', 'p10']) {
    expect(d[id].es_correcta).toBe(false)
    expect(d[id]).not.toHaveProperty('respuesta_correcta')
    expect(d[id].contestada).toBe(false)
  }
})

test('3. mensual: índice inválido = no contestada (-1); sin letra por defecto', () => {
  const b = [...banco(4), { ...banco(1)[0], id: 'tres', opcion_d: null, respuesta_correcta: 'a' }]
  const r = calificarEvaluacion(b, { p1: 7, p2: -5, p3: 1.5, p4: '1', tres: 3 }, { revelar: true })
  expect(r.contestadas).toBe(0)
  for (const d of r.detalle) {
    expect(d.respuesta_alumno).toBe(-1)
    expect(d.contestada).toBe(false)
    expect(d).not.toHaveProperty('respuesta_correcta')
  }
  expect(indiceValido(2, 3)).toBe(2)
  expect(indiceValido(3, 3)).toBe(-1)
  // Una clave ilegible nunca da por buena una respuesta ni se revela.
  const raro = calificarEvaluacion([{ ...banco(1)[0], respuesta_correcta: 'x' }], { p1: 0 }, { revelar: true })
  expect(raro.correctas).toBe(0)
  expect(raro.detalle[0]).not.toHaveProperty('respuesta_correcta')
})

test('4. mensual: 60 % acredita; el denominador son TODAS las preguntas', () => {
  const b = banco(10)
  const seis = Object.fromEntries(b.slice(0, 6).map(p => [p.id, 'abcd'.indexOf(p.respuesta_correcta)]))
  expect(calificarEvaluacion(b, seis, { revelar: false })).toMatchObject({ puntaje: 60, acreditado: true, total: 10 })
  const cinco = Object.fromEntries(b.slice(0, 5).map(p => [p.id, 'abcd'.indexOf(p.respuesta_correcta)]))
  expect(calificarEvaluacion(b, cinco, { revelar: false })).toMatchObject({ puntaje: 50, acreditado: false })
  expect(calificarEvaluacion(b, {}, { revelar: false }).contestadas).toBe(0)
})

test('5. mensual: lo que sale antes de contestar es lista blanca (sin clave)', () => {
  const pub = sanitizarPreguntaEvaluacion(banco(1)[0], 0)
  expect(Object.keys(pub).sort()).toEqual(['id', 'numero', 'opciones', 'opciones_en', 'pregunta', 'puntos', 'texto', 'texto_en', 'tipo'])
  expect(JSON.stringify(pub)).not.toContain('respuesta_correcta')
})

// ─── Quiz (lib pura) ─────────────────────────────────────────────────────────────
const filaLetras: QuizSemanaRow = { id: 'q1', pregunta: '¿L?', orden: 1, opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D', respuesta_correcta: 'c', explicacion: 'Porque C.' }
const filaJsonb: QuizSemanaRow = { id: 'q2', pregunta: '¿J?', orden: 2, opciones: ['uno', 'dos', 'tres'], respuesta_correcta: 1, explicacion: '' }

test('6. quiz: la pregunta sale por lista blanca en las dos formas', () => {
  for (const f of [filaLetras, filaJsonb, { ...filaLetras, retroalimentacion: 'la C' } as QuizSemanaRow]) {
    const p = preguntaPublica(f)!
    expect(Object.keys(p).sort()).toEqual(['id', 'opciones', 'orden', 'pregunta'])
    expect(JSON.stringify(p)).not.toMatch(/respuesta_correcta|explicacion|retroalimentacion|Porque/)
  }
  expect(preguntaPublica(filaJsonb)!.opciones).toEqual(['uno', 'dos', 'tres'])
  expect(preguntaPublica({ id: 'x', pregunta: '?', orden: 0 })).toBeNull()
})

test('7. quiz: clave sin letra por defecto; índice fuera de rango rechazado', () => {
  expect(claveQuiz(filaLetras)).toBe(2)
  expect(claveQuiz(filaJsonb)).toBe(1)
  expect(claveQuiz({ ...filaLetras, respuesta_correcta: '3' })).toBe(3)
  for (const rc of ['x', null, undefined, 5, -1, 'e']) expect(claveQuiz({ ...filaLetras, respuesta_correcta: rc }), String(rc)).toBeNull()
  expect(indiceRespuesta(2, 3)).toBe(2)
  for (const v of [3, -1, 1.5, '1', null]) expect(indiceRespuesta(v, 3), String(v)).toBeNull()
})

test('8. quiz: el veredicto se recalcula contra la clave; la explicación, solo de ESA pregunta', () => {
  expect(veredictoQuiz(filaLetras, 2)).toEqual({ tu_respuesta: 2, correcta: true, explicacion: 'Porque C.' })
  expect(veredictoQuiz(filaLetras, 0)).toEqual({ tu_respuesta: 0, correcta: false, explicacion: 'Porque C.' })
  expect(veredictoQuiz(filaJsonb, 1)).toEqual({ tu_respuesta: 1, correcta: true })   // explicación vacía no viaja
  expect(veredictoQuiz({ ...filaLetras, respuesta_correcta: 'x' }, 0).correcta).toBe(false)
})

// ─── Rutas (estructura) ─────────────────────────────────────────────────────────
test('9. GET del mensual: el service role DESPUÉS del gate; preguntas solo si está abierto', () => {
  const t = sinComentarios(leer(...RUTA_EV))
  expect(t.indexOf('await tieneAccesoEvaluacion(supabase, alumno, ev)')).toBeGreaterThan(0)
  expect(t.indexOf('const admin = createAdminClient()')).toBeGreaterThan(t.indexOf('await tieneAccesoEvaluacion(supabase, alumno, ev)'))
  expect(t).toContain("if (estado === 'abierta') {")
  expect(t).toContain('leerPreguntasEvaluacion(admin, params.id, { soloActivas: true })')
  expect(t).toContain('preguntas = leidas.preguntas.map(sanitizarPreguntaEvaluacion)')
  expect(t).not.toMatch(/supabase\s*\.from\('(preguntas|intentos_evaluacion)'\)/)
})

test('10. envío del mensual: aprobar cierra (409) antes de leer; revela solo al cerrar; intento con admin', () => {
  const t = sinComentarios(leer(...RUTA_ENVIAR))
  const i409 = t.indexOf("{ error: 'Ya aprobaste este examen: no se puede volver a presentar.' }")
  expect(i409).toBeGreaterThan(t.indexOf('await tieneAccesoEvaluacion(supabase, alumno, ev)'))
  expect(t.indexOf('leerPreguntasEvaluacion(admin, params.id, { soloActivas: false })')).toBeGreaterThan(i409)
  expect(t).toContain('const previo = calificarEvaluacion(pregs, respuestasAlumno, { revelar: false })')
  expect(t).toContain('const revelar = previo.acreditado || numeroIntento >= ev.intentos_permitidos')
  expect(t).toContain('revelar ? calificarEvaluacion(pregs, respuestasAlumno, { revelar: true }) : previo')
  expect(t).toMatch(/admin\s*\.from\('intentos_evaluacion'\)\s*\.insert\(/)
  expect(t).not.toMatch(/supabase\s*\.from\('(preguntas|intentos_evaluacion)'\)/)
  expect(t).toContain('revision_completa: revelar,')
  // El envío vacío (y desde la R2, el parcial: soporte IVS 8-oct-2026) no consume
  // intento: validarEnvio corre antes de calificar y antes del INSERT.
  const iValida = t.indexOf('const validado = validarEnvio(pregs, ')
  expect(iValida).toBeGreaterThan(0)
  expect(iValida).toBeLessThan(t.indexOf('const previo = calificarEvaluacion('))
  expect(iValida).toBeLessThan(t.indexOf(".from('intentos_evaluacion')\n      .insert("))
})

test('11. quiz: gate antes del service role; una pregunta de ESTA semana; sin defaults; nada de la clave', () => {
  const t = sinComentarios(leer(...RUTA_QUIZ))
  const autorizar = t.slice(t.indexOf('async function autorizar('), t.indexOf('export async function GET'))
  expect(autorizar).toContain('await tieneAccesoSemana(supabase, alumno, semanaId)')
  for (const metodo of ['GET', 'POST']) {
    const cuerpo = t.slice(t.indexOf(`export async function ${metodo}`))
    expect(cuerpo.indexOf('await autorizar(params?.semanaId)'), metodo).toBeGreaterThan(0)
    expect(cuerpo.indexOf('createAdminClient()'), metodo).toBeGreaterThan(cuerpo.indexOf('await autorizar(params?.semanaId)'))
  }
  const post = t.slice(t.indexOf('export async function POST'))
  expect(post).toMatch(/\.eq\('id', body\.pregunta_id\)\s*\.eq\('semana_id', semanaId\)/)
  expect(post).toContain("{ error: 'La pregunta no es de esta semana.' }, { status: 400 }")
  expect(post).toContain('indiceRespuesta(body.respuesta, opciones.length)')
  expect(post).toContain('if (previas[row.id] !== undefined)')             // candado de primera respuesta
  expect(post).toMatch(/\.eq\('semana_id', semanaId\)\s*\.in\('id', ids\)/) // compat: también de esta semana
  expect(t).not.toMatch(/\?\?\s*'a'|Math\.min\(3|respuesta_correcta/)
  expect(t).not.toMatch(/supabase\s*\.from\(/)
  expect(t).toContain(".order('fecha', { ascending: true })")               // la PRIMERA respuesta cuenta

  // El candado contesta con la respuesta GUARDADA, nunca con la nueva (si no, sería oráculo),
  // y el veredicto de la nueva solo sale después de guardarla.
  expect(post).toContain('return NextResponse.json({ ...veredictoQuiz(row, previas[row.id]), ya_respondida: true })')
  expect(post.indexOf('veredictoQuiz(row, idx)')).toBeGreaterThan(
    post.indexOf('guardarRespuestas(admin, alumnoId, semanaId, forma, previas, [{ fila: row, idx }])'))

  // Compat (K-d12) todo o nada: el bucle rechaza sin escribir; se lee y guarda DESPUÉS del bucle.
  const c = post.slice(post.indexOf("if (body && body.respuestas && typeof body.respuestas === 'object')"))
  const iFor = c.indexOf('for (const id of ids)')
  const iLeer = c.indexOf('leerRespuestasAlumno(admin, alumnoId, semanaId, ids)')
  expect(iFor).toBeGreaterThan(0)
  expect(iLeer).toBeGreaterThan(iFor)
  const bucle = c.slice(iFor, iLeer)
  expect(bucle).toMatch(/if \(!fila \|\| idx === null\) \{\s*return NextResponse\.json\(\{ error: 'Respuestas inválidas\.' \}, \{ status: 400 \}\)/)
  expect(bucle).not.toMatch(/continue|guardarRespuestas|\.insert\(|\.update\(|\.upsert\(/)

  // GET: veredicto (y explicación) solo de lo contestado; la respuesta lleva exactamente estas claves.
  const get = t.slice(t.indexOf('export async function GET'), t.indexOf('export async function POST'))
  expect(get).toContain('if (idx !== undefined) resultados[f.id] = veredictoQuiz(f, idx)')
  expect(get).toMatch(/return NextResponse\.json\(\{\s*preguntas,\s*resultados,\s*completado: total > 0 && contestadas === total,\s*aciertos: Object\.values\(resultados\)\.filter\(r => r\.correcta\)\.length,\s*total,\s*\}\)/)
  // La explicación solo sale del servidor por veredictoQuiz (lib), nunca armada en la ruta.
  expect(t).not.toMatch(/explicacion/)
})

test('12. examen de curso: aprobar cierra (409) antes de calificar; GET no sirve el banco si ya aprobó', () => {
  const t = sinComentarios(leer(...RUTA_CURSO_ENVIAR))
  const i409 = t.indexOf("{ error: 'Ya aprobaste este examen: no se puede volver a presentar.', aprobado: true }")
  expect(i409).toBeGreaterThan(t.indexOf('await puedeExamenFinal(admin, params.id, alumnoId)'))
  expect(t.indexOf('const previo = calificar(preguntas, enviadas)')).toBeGreaterThan(i409)
  expect(t).toContain('revision_completa: revelarClaves,')
  // K-d3: la clave (y lo guardado con ✓/✗) solo cuando el examen se cierra con este envío.
  expect(t).toContain('const revelarClaves = previo.porcentaje >= minima || usados + 1 >= permitidos')
  expect(t).toContain('revelarClaves ? calificar(preguntas, enviadas, true) : previo')
  // La respuesta de éxito lleva exactamente estas claves: ni `respuestas` (lo guardado) ni otra.
  const exito = t.slice(t.indexOf('return NextResponse.json({\n      id: guardado.id'))
  const cuerpo = exito.slice(0, exito.indexOf('revision_completa: revelarClaves,') + 'revision_completa: revelarClaves,'.length)
  expect(cuerpo.length).toBeGreaterThan(40)
  expect([...cuerpo.matchAll(/^\s*(\w+)[,:]/gm)].map(m => m[1]).sort()).toEqual([
    'aciertos', 'aprobado', 'calificacion_minima', 'created_at', 'desglose_temas', 'id',
    'intentos_permitidos', 'intentos_usados', 'porcentaje', 'revision', 'revision_completa', 'total',
  ])
  const g = sinComentarios(leer(...RUTA_CURSO_GET))
  expect(g).toContain('preguntas: aprobado ? [] : preguntas.map(sanitizar),')
})

// ─── UI ─────────────────────────────────────────────────────────────────────────
test('13. UI: el quiz no conoce la clave y revisa r.ok; el mensual y el de curso respetan el cierre', () => {
  const quiz = sinComentarios(leer('src', 'components', 'alumno', 'SemanaQuiz.tsx'))
  expect(quiz).not.toContain('respuesta_correcta')
  expect(quiz).toContain('if (!r.ok)')
  expect(quiz).toContain('JSON.stringify({ pregunta_id: pregunta.id, respuesta: idx })')
  const ev = sinComentarios(leer('src', 'app', '(dashboard)', 'alumno', 'evaluacion', '[id]', 'EvaluacionClient.tsx'))
  expect(ev).not.toContain('console.log')
  expect(ev).toContain("data.estado === 'aprobada' || data.estado === 'sin_intentos'")
  expect(ev).toContain('const revisionCompleta = resultado.revision_completa !== false')
  expect(ev).toContain('!(d.contestada ?? d.respuesta_alumno >= 0)')
  // Revisión diferida: sin veredicto no hay ✓ ni ✗ (ícono neutro), y la opción elegida no se pinta de rojo.
  expect(ev).toMatch(/d\.es_correcta === undefined\s*\?\s*<AlertCircle/)
  expect(ev).not.toMatch(/es_correcta\s*!==\s*false/)
  expect(ev).toContain('if (esAlumno && d.es_correcta === false)')
  const curso = sinComentarios(leer('src', 'app', '(cursos)', 'cursos', '[id]', 'examen', 'page.tsx'))
  expect(curso).toContain('{!resultado.aprobado && <button')
  expect(curso).toContain('{!resultado && !aprobadoPrevio && preguntas && (')
  expect(curso).toContain("r.es_correcta === undefined")
  // K-d2 también en la página del curso: aprobado ya no ofrece «Volver a intentar».
  const pagCurso = sinComentarios(leer('src', 'app', '(cursos)', 'cursos', '[id]', 'page.tsx'))
  expect(pagCurso).toContain('aprobado: json.aprobado === true')
  expect(pagCurso).toContain("{examen.aprobado ? 'Ver resultado' : examen.mejor !== null ? 'Volver a intentar' : 'Presentar examen'}")
})

// ─── Guardianes sobre TODO src ────────────────────────────────────────────────────
const archivosSrc = (): string[] => {
  const out: string[] = []
  const rec = (d: string) => {
    for (const e of readdirSync(join(raiz, d), { withFileTypes: true })) {
      if (e.isDirectory()) rec(join(d, e.name))
      else if (/\.(ts|tsx)$/.test(e.name)) out.push(join(d, e.name))
    }
  }
  rec('src')
  return out
}
// Identificadores del service role en un archivo: «admin» por convención (se prohíbe declarar un
// «admin» de sesión) + los declarados con createAdminClient / getServiceClient / createServiceClient(key).
const esServicio = (decl: string) => /^(await\s+)?(createAdminClient|getServiceClient)\(/.test(decl)
  || /^createServiceClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!?\s*[,)]/.test(decl)
const serviciosDe = (t: string, rel: string) => {
  const decls = [...t.matchAll(/(?:const|let)\s+(\w+)\s*=\s*([^;]{0,200})/g)]
  for (const m of decls.filter(m => m[1] === 'admin')) expect(esServicio(m[2]), `${rel}: «admin» que no es el service role`).toBe(true)
  return new Set(['admin', ...decls.filter(m => esServicio(m[2])).map(m => m[1])])
}
const BANCOS = /(\w+|\))\s*\.from\(\s*['"`](preguntas|quiz_semana|curso_examen_preguntas)['"`]\s*\)/g
const ESCRITURAS = /(\w+|\))\s*\.from\(\s*['"`](intentos_evaluacion|quiz_respuestas)['"`]\s*\)\s*\.(insert|upsert|update|delete)\(/g

test('14. G1: los tres bancos de preguntas se leen SOLO con el service role (todo src, sin embeds)', () => {
  let n = 0
  for (const f of archivosSrc()) {
    const t = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    const rel = relative(raiz, f).split(sep).join('/')
    const servicio = serviciosDe(t, rel)
    for (const m of t.matchAll(BANCOS)) {
      expect(servicio.has(m[1]), `${rel}: ${m[2]} con «${m[1]}» (no es el service role)`).toBe(true)
      n++
    }
    // Ningún select embebe un banco (p. ej. evaluaciones?select=…,preguntas(…)).
    expect(t, `${rel}: embed de un banco de preguntas`).not.toMatch(/['"`][^'"`\n]*\b(preguntas|quiz_semana|curso_examen_preguntas)\s*\(/)
    // Ningún componente de navegador los toca.
    if (/^\s*['"]use client['"]/.test(t)) expect(t, `${rel}: componente de navegador con un banco`).not.toMatch(BANCOS)
    // .from(<variable>) solo en el contador de dependencias del editor (sus llamadores pasan admin).
    if (/['"`](preguntas|quiz_semana|curso_examen_preguntas)['"`]/.test(t) && /(?<!Array)\.from\(\s*[a-zA-Z_]\w*\s*\)/.test(t)) {
      expect(rel, `${rel}: .from(<variable>) en un archivo que nombra un banco`).toBe('src/lib/estructura-contenido.ts')
    }
  }
  expect(n).toBeGreaterThan(20)
  for (const f of archivosSrc()) {
    const t = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    for (const m of t.matchAll(/dependencias(Semana|Mes|Materia)\(\s*(\w+)/g)) {
      if (!f.endsWith('estructura-contenido.ts')) expect(m[2], `${f}: dependencias${m[1]} con «${m[2]}»`).toBe('admin')
    }
  }
})

test('15. G2: intentos_evaluacion y quiz_respuestas solo los ESCRIBE el service role', () => {
  let n = 0
  for (const f of archivosSrc()) {
    const t = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    const rel = relative(raiz, f).split(sep).join('/')
    const servicio = serviciosDe(t, rel)
    for (const m of t.matchAll(ESCRITURAS)) {
      expect(servicio.has(m[1]), `${rel}: ${m[3]} en ${m[2]} con «${m[1]}»`).toBe(true)
      n++
    }
  }
  expect(n).toBeGreaterThanOrEqual(3)
})
