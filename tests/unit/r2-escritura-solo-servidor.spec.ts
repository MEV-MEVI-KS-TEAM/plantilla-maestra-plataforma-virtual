import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { validarEnvio, type PreguntaEvaluacion } from '@/lib/evaluaciones/examen-mensual'

/**
 * R2 (soporte IVS, 8-oct-2026) — lo que da avance, logros, calificación o acceso
 * solo lo escribe el servidor; la clave no sale por envíos parciales ni por
 * carreras. Es el cierre que se hizo en IVS (02-migracion-seguridad + 02c),
 * portado de vuelta a la plantilla.
 *
 * La prueba con RLS REAL corre contra un Postgres de verdad:
 * scripts/verificar-schema/explotaciones-r2.mjs arma la cadena de 260fb8a
 * («antes»), la de este árbol («después», con la migración R2 dos veces), cada
 * instalador solo y una copia vieja de 20260402140000 encima; siembra alumnos con
 * el alta real (handle_new_user) y, con la sesión de un alumno (rol
 * authenticated) o sin sesión (anon), intenta cada explotación dentro de
 * BEGIN … ROLLBACK. Guarda la foto en tests/unit/fixtures/explotaciones-r2.json
 * con el sha256 de la migración. Esta spec corre en cada `pnpm test:unit` sin
 * base de datos: lee esa foto y exige que sea de la migración vigente.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--.*$/gm, '')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const MIG = 'supabase/migrations/20261008120000_r2_escritura_solo_servidor.sql'

interface Resultado { resultado: string; detalle: string }
interface Base {
  explotaciones: Record<string, Resultado>
  legitimas: Record<string, Resultado & { ok: boolean }>
  checks: Record<string, { ok: boolean; resultado: string; valor: string }>
  rolAltaConMetadataAdmin: string
}
const FOTO = JSON.parse(leer('tests/unit/fixtures/explotaciones-r2.json')) as {
  migracionSha256: string; refAntes: string; explotaciones: { id: string }[]; legitimas: { id: string }[]
  bases: Record<'antes' | 'migrada' | 'despues' | 'instalador' | 'combo' | 'copia_vieja', Base>
  duplicados: { aborta: boolean; mensaje: string; filasQuiz: number; sinCambios: boolean }
}

// La lista de la auditoría (a-i del ticket). Si agregas una al arnés, agrégala aquí.
const EXPLOTACIONES = [
  'a_intento_forjado', 'a_calificacion_forjada', 'a_calificacion_acreditada',
  'b_clave_examen', 'b_clave_quiz', 'b_clave_quiz_anon',
  'd_quiz_carrera', 'd_intento_doble',
  'e_quiz_respuesta_forjada', 'e_progreso_insert', 'e_progreso_update', 'e_progreso_delete', 'e_logro_insert',
  'e_racha_update', 'e_racha_insert', 'e_documento_autoaprobado', 'e_documento_insert_verificado', 'e_documento_delete',
  'e_constancia_forjada', 'e_alumno_meses', 'e_alumno_delete', 'e_nota_ajena', 'e_nota_delete',
  'e_lee_progreso_ajeno', 'e_lee_constancia_ajena', 'e_contenido_update',
  'f_usuario_rol', 'f_usuario_insert', 'f_usuario_delete',
  'h_matricula_anon', 'h_matricula_alumno',
  'i_anon_truncate', 'i_anon_insert_contenido', 'i_anon_delete_alumnos', 'i_alumno_truncate',
]
// Las que en 260fb8a PASABAN (los huecos que cierra la R2): prueba que el arnés las ve.
const ABIERTAS_ANTES = [
  'd_quiz_carrera', 'd_intento_doble', 'e_progreso_insert', 'e_progreso_update', 'e_logro_insert',
  'e_racha_update', 'e_racha_insert', 'h_matricula_anon', 'h_matricula_alumno', 'i_anon_truncate', 'i_alumno_truncate',
]
// Las lecturas ajenas se frenan por filas (0), no por privilegio.
const POR_FILAS = ['e_lee_progreso_ajeno', 'e_lee_constancia_ajena']
const CARRERAS = ['d_quiz_carrera', 'd_intento_doble']

test('0. la foto es de la migración R2 vigente y trae todas las explotaciones (si cambias la migración, vuelve a correr el arnés)', () => {
  const sha = createHash('sha256').update(leer(MIG)).digest('hex')
  expect(FOTO.migracionSha256, 'corre scripts/verificar-schema/explotaciones-r2.mjs').toBe(sha)
  expect(FOTO.explotaciones.map(e => e.id)).toEqual(EXPLOTACIONES)
  expect(Object.keys(FOTO.bases).sort()).toEqual(['antes', 'combo', 'copia_vieja', 'despues', 'instalador', 'migrada'])
})

test('1. ANTES (260fb8a): los huecos de la auditoría estaban abiertos y los tres CHECK R2 los marcan', () => {
  const b = FOTO.bases.antes
  const pasan = Object.entries(b.explotaciones).filter(([, v]) => v.resultado.startsWith('PASA')).map(([k]) => k).sort()
  expect(pasan).toEqual([...ABIERTAS_ANTES].sort())
  for (const c of Object.values(b.checks)) expect(c.ok, c.resultado).toBe(false)
  // Lo que ya estaba cerrado (D22c/D22d, #185, Bug 52, S1) sigue cerrado también antes.
  for (const id of ['a_intento_forjado', 'b_clave_examen', 'b_clave_quiz', 'e_quiz_respuesta_forjada', 'f_usuario_rol', 'f_usuario_insert', 'e_documento_insert_verificado']) {
    expect(b.explotaciones[id].resultado, id).toBe('rechazado:42501')
  }
  expect(b.rolAltaConMetadataAdmin).toBe('alumno')
})

for (const nombre of ['migrada', 'copia_vieja', 'despues', 'instalador', 'combo'] as const) {
  test(`2. ${nombre}: ninguna explotación pasa, con privilegio (42501) o índice único (23505); lo legítimo funciona; CHECK 32-34 en ✅`, () => {
    const b = FOTO.bases[nombre]
    expect(Object.keys(b.explotaciones)).toEqual(EXPLOTACIONES)
    for (const id of EXPLOTACIONES) {
      const r = b.explotaciones[id].resultado
      if (POR_FILAS.includes(id)) expect(r, id).toBe('sin efecto (0 filas)')
      else if (CARRERAS.includes(id)) expect(r, id).toBe('rechazado:23505')
      // Dos capas: ya no es la RLS la que frena («0 filas» o «violates row-level security»),
      // es el privilegio. La nota ajena es la excepción: el alumno sí escribe notas (las suyas).
      else if (id === 'e_nota_ajena') expect(r, id).toBe('rechazado:42501')
      else {
        expect(r, id).toBe('rechazado:42501')
        expect(b.explotaciones[id].detalle, id).toMatch(/^permission denied for (table|function) /)
      }
    }
    for (const [id, v] of Object.entries(b.legitimas)) expect(v.ok, `${id}: ${v.resultado} ${v.detalle}`).toBe(true)
    expect(Object.keys(b.legitimas).sort()).toEqual(FOTO.legitimas.map(l => l.id).sort())
    expect(Object.keys(b.checks)).toHaveLength(3)
    for (const c of Object.values(b.checks)) expect(c.ok, c.resultado).toBe(true)
    expect(b.rolAltaConMetadataAdmin).toBe('alumno')
  })
}

test('2b. con respuestas repetidas del quiz la migración ABORTA: no borra filas de alumnos ni deja nada a medias', () => {
  const d = FOTO.duplicados
  expect(d.aborta).toBe(true)
  expect(d.mensaje).toContain('R2: quiz_respuestas tiene respuestas repetidas')
  expect(d.filasQuiz).toBe(2)
  expect(d.sinCambios, 'la transacción completa se revirtió').toBe(true)
})

test('3. la migración: transaccional, idempotente, aborta (sin borrar) ante duplicados, y nombra el despliegue previo', () => {
  const m = leer(MIG)
  const s = sinComentariosSql(m)
  expect(s.trim().startsWith('BEGIN;')).toBe(true)
  expect(s.trim().endsWith('COMMIT;')).toBe(true)
  // Cada CREATE POLICY con nombre lleva su DROP POLICY IF EXISTS antes.
  for (const p of s.matchAll(/CREATE POLICY "([^"]+)" ON (public\.\w+)/g)) {
    const drop = s.indexOf(`DROP POLICY IF EXISTS "${p[1]}" ON ${p[2]}`)
    expect(drop, p[1]).toBeGreaterThanOrEqual(0)
    expect(drop, p[1]).toBeLessThan(p.index!)
  }
  expect(s, 'CREATE UNIQUE INDEX sin IF NOT EXISTS').not.toMatch(/CREATE UNIQUE INDEX (?!IF NOT EXISTS)/)
  expect(s).toContain('CREATE UNIQUE INDEX IF NOT EXISTS quiz_respuestas_alumno_quiz_uniq')
  expect(s).toContain('CREATE UNIQUE INDEX IF NOT EXISTS intentos_evaluacion_alumno_eval_num_uniq')
  // No borra datos de alumnos: ante duplicados, aborta.
  expect(s).not.toMatch(/\bDELETE\s+FROM\b/i)
  expect(s).not.toMatch(/\bTRUNCATE\s+public\./i)
  expect(s).toMatch(/RAISE EXCEPTION 'R2: quiz_respuestas tiene respuestas repetidas/)
  expect(m).toContain('CÓRRELA SOLO DESPUÉS DE DESPLEGAR LA APP DE ESTA RAMA')
  // keep_alive_log (Bug 46) conserva el INSERT de anon: lo decide una política TO anon.
  expect(s).toContain("p.roles @> ARRAY['anon']::name[]")
})

test('4. los dos instaladores nacen con la R2 (sin las políticas de escritura propia; con techos, índices y REVOKE)', () => {
  for (const f of ['supabase/schema.sql', 'scripts/schema.sql']) {
    const s = sinComentariosSql(leer(f))
    for (const p of ['progreso: registrar propio progreso', 'progreso: actualizar propio progreso', 'logros: insertar propios',
      'racha: insertar propia', 'racha: actualizar propia', 'documentos: subir propios']) {
      expect(s, `${f}: ${p}`).not.toMatch(new RegExp(`CREATE POLICY "${p}"`))
      expect(s, `${f}: ${p}`).toContain(`DROP POLICY IF EXISTS "${p}"`)
    }
    for (const t of ['calificaciones', 'progreso', 'logros', 'racha', 'documentos', 'constancias', 'alumnos', 'notas']) {
      expect(s, `${f}: techo ${t}`).toContain(`CREATE POLICY "${t}: techo propio o admin (R2)"`)
    }
    expect(s, f).toContain('CREATE UNIQUE INDEX IF NOT EXISTS quiz_respuestas_alumno_quiz_uniq')
    expect(s, f).toContain('CREATE UNIQUE INDEX IF NOT EXISTS intentos_evaluacion_alumno_eval_num_uniq')
    expect(s, f).toContain('REVOKE EXECUTE ON FUNCTION public.generar_matricula() FROM PUBLIC, anon, authenticated;')
    expect(s, f).toMatch(/"usuarios: actualizar propio perfil"[^;]*WITH CHECK \(\(?id = auth\.uid\(\)\)?\)/)
    expect(s, f).toMatch(/"notas: actualizar propias"[^;]*WITH CHECK \(\(?alumno_id = auth\.uid\(\)\)?\)/)
  }
})

test('5. post-setup-check: CHECK 32, 33 y 34 siguen al 31 y mandan a la migración R2', () => {
  const s = leer('scripts/post-setup-check.sql')
  const nums = [...s.matchAll(/^-- ─── CHECK (\d+):/gm)].map(m => Number(m[1]))
  expect(nums).toEqual(Array.from({ length: nums.length }, (_, i) => i + 1))
  expect(nums[nums.length - 1]).toBe(34)
  const desde32 = s.slice(s.indexOf('-- ─── CHECK 32:'))
  expect((desde32.match(/20261008120000_r2_escritura_solo_servidor\.sql/g) ?? []).length).toBeGreaterThanOrEqual(3)
  for (const n of ["'Avance, logros y calificación solo los escribe el servidor (R2)'",
    "'Índices únicos contra envíos simultáneos (R2)'", "'anon sin escritura en public; generar_matricula solo el servidor (R2)'"]) {
    expect(desde32).toContain(n)
  }
})

// ─── La app: lo que la migración le quita a la sesión, el servidor lo escribe ──
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
const esServicio = (decl: string) => /^(await\s+)?(createAdminClient|getServiceClient)\(/.test(decl)
  || /^createServiceClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!?\s*[,)]/.test(decl)
const ESCRITURAS = /(\w+|\))\s*\.from\(\s*['"`](progreso_semanas|logros_alumno|racha_actividad|calificaciones|alumnos|documentos_alumno|constancias|usuarios)['"`]\s*\)\s*\.(insert|upsert|update|delete)\(/g

test('6. progreso, logros, racha, calificaciones, alumnos, documentos, constancias y usuarios solo los ESCRIBE el service role', () => {
  let n = 0
  for (const f of archivosSrc()) {
    const t = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    const rel = relative(raiz, f).split(sep).join('/')
    const decls = [...t.matchAll(/(?:const|let)\s+(\w+)\s*=\s*([^;]{0,200})/g)]
    const servicio = new Set(['admin', ...decls.filter(m => esServicio(m[2])).map(m => m[1])])
    for (const m of decls.filter(m => m[1] === 'admin')) expect(esServicio(m[2]), `${rel}: «admin» que no es el service role`).toBe(true)
    for (const m of t.matchAll(ESCRITURAS)) {
      // constancia-folio recibe el cliente por parámetro: su llamador le pasa el service role (abajo).
      if (rel === 'src/lib/constancia-folio.ts' && m[1] === 'db') { n++; continue }
      expect(servicio.has(m[1]), `${rel}: ${m[3]} en ${m[2]} con «${m[1]}»`).toBe(true)
      n++
    }
  }
  expect(n).toBeGreaterThan(20)
  for (const f of archivosSrc()) {
    const t = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    if (f.endsWith('constancia-folio.ts')) continue   // la definición
    for (const m of t.matchAll(/obtenerOEmitirFolio\(\s*([^,]+),/g)) expect(m[1].trim(), f).toBe('createAdminClient()')
  }
  // Las tres rutas que antes escribían con la sesión.
  const semana = sinComentarios(leer('src/app/api/alumno/progreso/semana/route.ts'))
  expect(semana.indexOf('const admin = createAdminClient()')).toBeGreaterThan(semana.indexOf('await tieneAccesoSemana(supabase, alumno, semana_id)'))
  expect(semana).not.toMatch(/supabase\s*\.from\('(progreso_semanas|logros_alumno|racha_actividad)'\)/)
  const tiempo = sinComentarios(leer('src/app/api/alumno/progreso/tiempo/route.ts'))
  expect(tiempo.indexOf('const admin = createAdminClient()')).toBeGreaterThan(tiempo.indexOf('await tieneAccesoSemana(supabase, alumno, semana_id)'))
  expect(tiempo).not.toMatch(/supabase\s*\.from\('progreso_semanas'\)/)
  const enviar = sinComentarios(leer('src/app/api/alumno/evaluacion/[id]/enviar/route.ts'))
  expect(enviar).not.toMatch(/supabase\s*\.from\('logros_alumno'\)/)
})

// ─── Examen: envío completo (Bug 69 / bits de la clave) ────────────────────────
const banco = (n: number, extra: Partial<PreguntaEvaluacion>[] = []): PreguntaEvaluacion[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`, orden: i + 1, pregunta: `¿P${i + 1}?`, opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D',
    respuesta_correcta: 'a', ...(extra[i] ?? {}),
  }))

test('7. validarEnvio: rechaza vacío, PARCIAL, ids ajenos e índices inválidos; acepta el completo', () => {
  const b = banco(3, [{}, {}, { opcion_d: null }])
  for (const malo of [undefined, null, [], 'x', {}]) expect(validarEnvio(b, malo).ok, JSON.stringify(malo)).toBe(false)
  // Parcial: con 3 intentos, contestar una sola dejaba sacar «bits» de la clave.
  expect(validarEnvio(b, { p1: 0 })).toEqual({ ok: false, error: 'Contesta todas las preguntas antes de enviar la evaluación.' })
  expect(validarEnvio(b, { p1: 0, p2: 1 }).ok).toBe(false)
  expect(validarEnvio(b, { p1: 0, p2: 1, p3: 2, otra: 0 })).toEqual({ ok: false, error: 'Respuestas inválidas.' })
  expect(validarEnvio(b, { p1: 0, p2: 1, p3: 3 }).ok).toBe(false)      // la 3 tiene 3 opciones
  expect(validarEnvio(b, { p1: '0', p2: 1, p3: 2 }).ok).toBe(false)
  expect(validarEnvio(b, { p1: 0.5, p2: 1, p3: 2 }).ok).toBe(false)
  expect(validarEnvio(b, { p1: 0, p2: 1, p3: 2 })).toEqual({ ok: true, respuestas: { p1: 0, p2: 1, p3: 2 } })
})

test('8. validarEnvio: una pregunta archivada a mitad del examen no se exige, pero si se contestó cuenta', () => {
  const b = banco(3, [{}, {}, { activa: false }])
  expect(validarEnvio(b, { p1: 0, p2: 1 })).toEqual({ ok: true, respuestas: { p1: 0, p2: 1 } })
  expect(validarEnvio(b, { p1: 0, p2: 1, p3: 2 })).toEqual({ ok: true, respuestas: { p1: 0, p2: 1, p3: 2 } })
  expect(validarEnvio(b, { p3: 2 }).ok).toBe(false)
})

test('9. rutas: el envío se valida ANTES de calificar y del INSERT; 23505 del examen → 409; el quiz responde con la PRIMERA guardada', () => {
  const enviar = sinComentarios(leer('src/app/api/alumno/evaluacion/[id]/enviar/route.ts'))
  const iVal = enviar.indexOf('const validado = validarEnvio(pregs, ')
  expect(iVal).toBeGreaterThan(enviar.indexOf("leerPreguntasEvaluacion(admin, params.id, { soloActivas: false })"))
  expect(iVal).toBeLessThan(enviar.indexOf('const previo = calificarEvaluacion('))
  expect(enviar).not.toContain('previo.contestadas === 0')
  expect(enviar).toMatch(/if \(intentoError\.code === '23505'\) \{\s*return NextResponse\.json\(\{ error: 'Este intento ya se registró\. Recarga la página\.' \}, \{ status: 409 \}\)/)

  const quiz = sinComentarios(leer('src/app/api/alumno/quiz/[semanaId]/route.ts'))
  const post = quiz.slice(quiz.indexOf('export async function POST'))
  const iGuardar = post.indexOf('guardarRespuestas(admin, alumnoId, semanaId, forma, previas, [{ fila: row, idx }])')
  const iRelee = post.indexOf('leerRespuestasAlumno(admin, alumnoId, semanaId, [row.id])', iGuardar)
  expect(iRelee).toBeGreaterThan(iGuardar)
  // El veredicto de la NUEVA solo sale si es la que quedó guardada.
  expect(post.indexOf('return NextResponse.json(veredictoQuiz(row, idx))')).toBeGreaterThan(post.indexOf('if (ganadora !== undefined && ganadora !== idx)'))
  expect(post).toContain('return NextResponse.json({ ...veredictoQuiz(row, ganadora), ya_respondida: true })')
  expect(post).toContain('if (g.error && !esRepetida(g.error))')
  // Compat de filas: una por una, sin que un 23505 tire el lote.
  expect(post).toContain("const lotes = forma === 'filas' ? nuevas.map(n => [n]) : [nuevas]")
  expect(quiz).toMatch(/\.order\('fecha', \{ ascending: true \}\)\s*\.order\('id', \{ ascending: true \}\)/)
})
