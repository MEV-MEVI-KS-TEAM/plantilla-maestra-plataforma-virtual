/**
 * R2 (soporte IVS, 8-oct-2026) — cada explotación que se cerró en IVS, intentada
 * contra un Postgres de verdad, con la sesión de un alumno (rol authenticated,
 * RLS real) o sin sesión (anon), dentro de BEGIN … ROLLBACK.
 *
 * Arma bases en un cluster LOCAL y desechable (nunca uno de Supabase):
 *
 *   antes      = la cadena de la plantilla en `R2_ANTES_REF` (por omisión 260fb8a,
 *                el main anterior a la R2): supabase/schema.sql + el módulo
 *                Cursos + todas sus migraciones. Aquí varias explotaciones PASAN:
 *                prueba que el arnés las detecta.
 *   migrada    = antes + la migración R2 de este árbol, DOS veces (idempotente):
 *                un cliente ya desplegado que corre la migración. Es la base que
 *                prueba la migración sola (su schema es el viejo).
 *   copia_vieja= migrada + una copia vieja de 20260402140000 (vuelve a crear
 *                «logros: insertar propios» y las de racha): sin privilegio quedan
 *                inertes y nada se reabre.
 *   despues    = la cadena de este árbol completa (instalador nuevo + migraciones,
 *                la R2 otra vez al final).
 *   instalador = supabase/schema.sql solo (un cliente nuevo por la línea Solo-Cursos).
 *   combo      = scripts/schema.sql solo (un cliente nuevo por el combo, antes de 7bis).
 *
 * En cada base siembra dos alumnos (A y B) y un admin con el flujo real (el alta
 * de auth.users dispara handle_new_user), intenta cada explotación y cada
 * operación legítima, y corre los CHECK 32, 33 y 34 de post-setup-check.sql.
 * Escribe la foto en tests/unit/fixtures/explotaciones-r2.json con el sha256 de
 * la migración R2; tests/unit/r2-escritura-solo-servidor.spec.ts la lee en cada
 * `pnpm test:unit` y exige que sea de la migración vigente.
 *
 * Uso (ver scripts/verificar-schema/README.md):
 *   PG_BIN="C:/Program Files/PostgreSQL/18/bin" PGPORT=55440 \
 *     node scripts/verificar-schema/explotaciones-r2.mjs
 * Crea y borra las bases r2_*. Se niega a correr en los puertos de Supabase.
 */
import { spawnSync, execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '../..')
const PSQL = path.join(process.env.PG_BIN || '', process.platform === 'win32' ? 'psql.exe' : 'psql')
const PUERTO = process.env.PGPORT || ''
const HOST = '127.0.0.1'
const REF_ANTES = process.env.R2_ANTES_REF || '260fb8a'
const MIG_R2 = 'supabase/migrations/20261008120000_r2_escritura_solo_servidor.sql'
const VIEJA = 'supabase/migrations/20260402140000_logros_racha_alumno_policies.sql'
const FOTO = path.join(RAIZ, 'tests/unit/fixtures/explotaciones-r2.json')

if (!process.env.PG_BIN || !/^\d+$/.test(PUERTO)) {
  console.error('Falta PG_BIN (carpeta de psql) o PGPORT (puerto del cluster LOCAL desechable).')
  process.exit(2)
}
if (PUERTO === '5432' || PUERTO === '6543') {
  console.error(`PGPORT=${PUERTO}: usa un cluster local desechable en otro puerto (p. ej. 55440).`)
  process.exit(2)
}

function correr(db, args, { cwd = RAIZ, entrada, parar = true } = {}) {
  return spawnSync(PSQL, ['-h', HOST, '-p', PUERTO, '-U', 'postgres', '-d', db, '-v', `ON_ERROR_STOP=${parar ? 1 : 0}`, '-X', '-q', ...args],
    { cwd, encoding: 'utf8', input: entrada, env: { ...process.env, PGCLIENTENCODING: 'UTF8', PGOPTIONS: '-c client_min_messages=warning -c lc_messages=C' }, maxBuffer: 1 << 28 })
}
function psql(db, args, opts = {}) {
  const r = correr(db, args, opts)
  if (r.status !== 0) throw new Error(`psql ${args.join(' ').slice(0, 200)} en ${db} salió con ${r.status}:\n${(r.stderr || '').slice(-3000)}`)
  return r.stdout
}

// ── Las cadenas ─────────────────────────────────────────────────────────────
const HARNESS = fs.readFileSync(path.join(AQUI, 'harness-supabase.sql'), 'utf8')
const git = (...a) => execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 28 })
const leerAhora = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8')
const leerAntes = (rel) => git('show', `${REF_ANTES}:${rel}`)
const filas = (txt) => txt.split(/\r?\n/).filter(Boolean)
const migracionesAhora = fs.readdirSync(path.join(RAIZ, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => `supabase/migrations/${f}`)
const migracionesAntes = filas(git('ls-tree', '--name-only', REF_ANTES, 'supabase/migrations/')).filter((f) => f.endsWith('.sql')).sort()
if (migracionesAntes.includes(MIG_R2)) throw new Error(`${REF_ANTES} ya trae ${MIG_R2}: no sirve de «antes».`)

// Cada archivo con el lector de su versión: [ruta, leer].
const cadenaAntes = ['supabase/schema.sql', 'scripts/migracion-cursos-diplomados.sql', ...migracionesAntes].map((r) => [r, leerAntes])
const cadenaAhora = ['supabase/schema.sql', 'scripts/migracion-cursos-diplomados.sql', ...migracionesAhora].map((r) => [r, leerAhora])
const BASES = {
  // Un cliente ya desplegado con 260fb8a, tal cual.
  antes:       cadenaAntes,
  // ESE cliente después de correr la migración R2 (dos veces: idempotente). Es lo
  // que prueba la migración sola: su supabase/schema.sql es el viejo.
  migrada:     [...cadenaAntes, [MIG_R2, leerAhora], [MIG_R2, leerAhora]],
  // …y si después alguien corre una copia vieja de 20260402140000 (recrea
  // «logros: insertar propios» y las de racha): sin privilegio quedan inertes.
  copia_vieja: [...cadenaAntes, [MIG_R2, leerAhora], [VIEJA, leerAntes]],
  // La cadena de este árbol completa (instalador nuevo + todas las migraciones).
  despues:     [...cadenaAhora, [MIG_R2, leerAhora]],
  // Clientes nuevos: cada instalador solo.
  instalador:  [['supabase/schema.sql', leerAhora]],
  combo:       [['scripts/schema.sql', leerAhora]],
}

// ── Datos ───────────────────────────────────────────────────────────────────
const uuid = (s) => { const h = crypto.createHash('md5').update(s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}` }
const A = uuid('r2-alumno-a'), B = uuid('r2-alumno-b'), ADM = uuid('r2-admin'), C = uuid('r2-alumno-c')
const M1 = uuid('r2-materia-1'), M2 = uuid('r2-materia-2'), MC1 = uuid('r2-mes-1')
const S1 = uuid('r2-semana-1'), S2 = uuid('r2-semana-2'), E1 = uuid('r2-eval-1')
const P1 = uuid('r2-preg-1'), Q1 = uuid('r2-quiz-1'), DOC_A = uuid('r2-doc-a'), DOC_B = uuid('r2-doc-b')

// Como postgres (superusuario: salta la RLS); el alta de auth.users dispara handle_new_user.
const SIEMBRA = `
ALTER ROLE service_role BYPASSRLS;   -- como en Supabase
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('${A}', 'a@r2.test', '{"nombre":"A","rol":"admin"}'),   -- S1: el metadata pide admin
  ('${B}', 'b@r2.test', '{"nombre":"B"}'),
  ('${ADM}', 'adm@r2.test', '{"nombre":"Admin"}'),
  ('${C}', 'c@r2.test', '{"nombre":"C"}');                   -- sin fila en alumnos: la da de alta el servidor
UPDATE public.usuarios SET rol = 'admin' WHERE id = '${ADM}';
INSERT INTO public.alumnos (id, nivel, modalidad, meses_desbloqueados, inscripcion_pagada) VALUES
  ('${A}', 'preparatoria', '6_meses', 1, true), ('${B}', 'preparatoria', '6_meses', 1, true);
INSERT INTO public.materias (id, nombre, nivel, orden) VALUES ('${M1}', 'R2 Mate', 'preparatoria', 1), ('${M2}', 'R2 Hist', 'preparatoria', 2);
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo) VALUES ('${MC1}', '${M1}', 1, 'Mes 1');
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo) VALUES ('${S1}', '${MC1}', 1, 'S1'), ('${S2}', '${MC1}', 2, 'S2');
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo) VALUES ('${E1}', '${M1}', '${MC1}', 'Examen 1');
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
  VALUES ('${P1}', '${E1}', '¿2+2?', '4', '3', '5', '6', 'a', 1);
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion)
  VALUES ('${Q1}', '${S1}', '¿Capital?', 'Lima', 'CDMX', 'Quito', 'Bogotá', 'b', 1, 'Es CDMX');
-- (completada = false: así el trigger no le crea racha a B y «e_racha_insert» mide la política, no el UNIQUE)
INSERT INTO public.progreso_semanas (alumno_id, semana_id, completada) VALUES ('${A}', '${S1}', false), ('${B}', '${S1}', false);
INSERT INTO public.logros_alumno (alumno_id, tipo_logro) VALUES ('${A}', 'primera_semana');
INSERT INTO public.racha_actividad (alumno_id, racha_actual, racha_maxima, ultima_actividad) VALUES ('${A}', 1, 1, CURRENT_DATE)
  ON CONFLICT (alumno_id) DO NOTHING;
INSERT INTO public.documentos_alumno (id, alumno_id, tipo_documento, verificado) VALUES ('${DOC_A}', '${A}', 'curp', false), ('${DOC_B}', '${B}', 'curp', false);
INSERT INTO public.calificaciones (alumno_id, materia_id, evaluacion_id, acreditado) VALUES ('${A}', '${M1}', '${E1}', false);
INSERT INTO public.constancias (alumno_id, folio) VALUES ('${B}', 'R2-FOLIO-B');
INSERT INTO public.notas_alumno (alumno_id, semana_id, contenido) VALUES ('${A}', '${S1}', 'mi nota');
`

// ── Sesiones ────────────────────────────────────────────────────────────────
function sesion(quien) {
  if (quien === 'anon') {
    return `SELECT set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claim.role', 'anon', true),
       set_config('request.jwt.claims', '{"role":"anon"}', true);\nSET LOCAL ROLE anon;`
  }
  if (quien === 'service_role') {
    return `SELECT set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claim.role', 'service_role', true),
       set_config('request.jwt.claims', '{"role":"service_role"}', true);\nSET LOCAL ROLE service_role;`
  }
  const uid = { A, B, ADM }[quien]
  return `SELECT set_config('request.jwt.claim.sub', '${uid}', true), set_config('request.jwt.claim.role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);\nSET LOCAL ROLE authenticated;`
}
const dml = (sql) => `WITH x AS (${sql} RETURNING 1) SELECT 'FILAS:' || count(*) FROM x;`
const sel = (sql) => `SELECT 'FILAS:' || count(*) FROM (${sql}) s;`

/** Explotaciones: lo que un alumno (o un visitante) intenta y NO debe lograr. */
const EXPLOTACIONES = [
  ['a_intento_forjado', 'A', dml(`INSERT INTO public.intentos_evaluacion (alumno_id, evaluacion_id, numero_intento, puntaje, acreditado) VALUES ('${A}', '${E1}', 1, 100, true)`)],
  ['a_calificacion_forjada', 'A', dml(`INSERT INTO public.calificaciones (alumno_id, materia_id, acreditado) VALUES ('${A}', '${M2}', true)`)],
  ['a_calificacion_acreditada', 'A', dml(`UPDATE public.calificaciones SET acreditado = true WHERE alumno_id = '${A}'`)],
  ['b_clave_examen', 'A', sel(`SELECT respuesta_correcta FROM public.preguntas`)],
  ['b_clave_quiz', 'A', sel(`SELECT respuesta_correcta, explicacion FROM public.quiz_semana`)],
  ['b_clave_quiz_anon', 'anon', sel(`SELECT respuesta_correcta FROM public.quiz_semana`)],
  ['d_quiz_carrera', 'service_role', `INSERT INTO public.quiz_respuestas (alumno_id, quiz_id, respuesta, correcta) VALUES ('${A}', '${Q1}', 'a', false);\n`
    + dml(`INSERT INTO public.quiz_respuestas (alumno_id, quiz_id, respuesta, correcta) VALUES ('${A}', '${Q1}', 'b', true)`)],
  ['d_intento_doble', 'service_role', `INSERT INTO public.intentos_evaluacion (alumno_id, evaluacion_id, numero_intento, puntaje, acreditado) VALUES ('${A}', '${E1}', 3, 40, false);\n`
    + dml(`INSERT INTO public.intentos_evaluacion (alumno_id, evaluacion_id, numero_intento, puntaje, acreditado) VALUES ('${A}', '${E1}', 3, 40, false)`)],
  ['e_quiz_respuesta_forjada', 'A', dml(`INSERT INTO public.quiz_respuestas (alumno_id, quiz_id, respuesta, correcta) VALUES ('${A}', '${Q1}', 'b', true)`)],
  ['e_progreso_insert', 'A', dml(`INSERT INTO public.progreso_semanas (alumno_id, semana_id, completada) VALUES ('${A}', '${S2}', true)`)],
  ['e_progreso_update', 'A', dml(`UPDATE public.progreso_semanas SET completada = true, tiempo_visto_minutos = 999 WHERE alumno_id = '${A}'`)],
  ['e_progreso_delete', 'A', dml(`DELETE FROM public.progreso_semanas WHERE alumno_id = '${A}'`)],
  ['e_logro_insert', 'A', dml(`INSERT INTO public.logros_alumno (alumno_id, tipo_logro) VALUES ('${A}', 'materia_completada')`)],
  ['e_racha_update', 'A', dml(`UPDATE public.racha_actividad SET racha_actual = 99, racha_maxima = 99 WHERE alumno_id = '${A}'`)],
  ['e_racha_insert', 'B', dml(`INSERT INTO public.racha_actividad (alumno_id, racha_actual, racha_maxima) VALUES ('${B}', 50, 50)`)],
  ['e_documento_autoaprobado', 'A', dml(`UPDATE public.documentos_alumno SET verificado = true WHERE id = '${DOC_A}'`)],
  ['e_documento_insert_verificado', 'A', dml(`INSERT INTO public.documentos_alumno (alumno_id, tipo_documento, verificado) VALUES ('${A}', 'acta_nacimiento', true)`)],
  ['e_documento_delete', 'A', dml(`DELETE FROM public.documentos_alumno WHERE id = '${DOC_A}'`)],
  ['e_constancia_forjada', 'A', dml(`INSERT INTO public.constancias (alumno_id, folio) VALUES ('${A}', 'R2-FOLIO-A')`)],
  ['e_alumno_meses', 'A', dml(`UPDATE public.alumnos SET meses_desbloqueados = 99, inscripcion_pagada = true WHERE id = '${A}'`)],
  ['e_alumno_delete', 'A', dml(`DELETE FROM public.alumnos WHERE id = '${A}'`)],
  ['e_nota_ajena', 'A', dml(`INSERT INTO public.notas_alumno (alumno_id, semana_id, contenido) VALUES ('${B}', '${S2}', 'x')`)],
  ['e_nota_delete', 'A', dml(`DELETE FROM public.notas_alumno WHERE alumno_id = '${A}'`)],
  ['e_lee_progreso_ajeno', 'A', sel(`SELECT 1 FROM public.progreso_semanas WHERE alumno_id = '${B}'`)],
  ['e_lee_constancia_ajena', 'A', sel(`SELECT 1 FROM public.constancias WHERE alumno_id = '${B}'`)],
  ['e_contenido_update', 'A', dml(`UPDATE public.semanas SET titulo = 'x'`)],
  ['f_usuario_rol', 'A', dml(`UPDATE public.usuarios SET rol = 'admin' WHERE id = '${A}'`)],
  ['f_usuario_insert', 'A', dml(`INSERT INTO public.usuarios (id, email, rol) VALUES ('${A}', 'a2@r2.test', 'admin') ON CONFLICT (id) DO UPDATE SET rol = 'admin'`)],
  ['f_usuario_delete', 'A', dml(`DELETE FROM public.usuarios WHERE id = '${A}'`)],
  ['h_matricula_anon', 'anon', sel(`SELECT public.generar_matricula()`)],
  ['h_matricula_alumno', 'A', sel(`SELECT public.generar_matricula()`)],
  ['i_anon_truncate', 'anon', `TRUNCATE public.progreso_semanas CASCADE;\nSELECT 'FILAS:1';`],
  ['i_anon_insert_contenido', 'anon', dml(`INSERT INTO public.materias (nombre, nivel) VALUES ('anon', 'preparatoria')`)],
  ['i_anon_delete_alumnos', 'anon', dml(`DELETE FROM public.alumnos`)],
  ['i_alumno_truncate', 'A', `TRUNCATE public.notas_alumno;\nSELECT 'FILAS:1';`],
]

/** Lo legítimo: tiene que seguir funcionando. [id, quien, sql, mínimo de filas] */
const LEGITIMAS = [
  ['servidor_marca_semana_y_racha', 'service_role',
    `INSERT INTO public.progreso_semanas (alumno_id, semana_id, completada, fecha_completada) VALUES ('${B}', '${S2}', true, NOW());\n`
    + sel(`SELECT 1 FROM public.racha_actividad WHERE alumno_id = '${B}' AND racha_actual >= 1`), 1],
  ['servidor_logro', 'service_role', dml(`INSERT INTO public.logros_alumno (alumno_id, tipo_logro) VALUES ('${B}', 'primera_semana')`), 1],
  ['servidor_intento_y_calificacion', 'service_role',
    `INSERT INTO public.intentos_evaluacion (alumno_id, evaluacion_id, numero_intento, puntaje, acreditado) VALUES ('${B}', '${E1}', 1, 80, true);\n`
    + dml(`INSERT INTO public.calificaciones (alumno_id, materia_id, evaluacion_id, acreditado) VALUES ('${B}', '${M1}', '${E1}', true)`), 1],
  ['servidor_aprueba_documento', 'service_role', dml(`UPDATE public.documentos_alumno SET verificado = true WHERE id = '${DOC_A}'`), 1],
  // El alta del servidor: trg_asignar_matricula llama a generar_matricula() con los
  // privilegios de quien inserta (el service role), que conserva el EXECUTE.
  ['servidor_alta_con_matricula', 'service_role',
    `WITH x AS (INSERT INTO public.alumnos (id, nivel, modalidad) VALUES ('${C}', 'preparatoria', '6_meses') RETURNING matricula)
     SELECT 'FILAS:' || count(*) FROM x WHERE matricula IS NOT NULL AND matricula <> '';`, 1],
  ['alumno_lee_lo_suyo', 'A',
    sel(`SELECT 1 FROM public.progreso_semanas WHERE alumno_id = '${A}' UNION ALL SELECT 1 FROM public.logros_alumno WHERE alumno_id = '${A}'
         UNION ALL SELECT 1 FROM public.racha_actividad WHERE alumno_id = '${A}' UNION ALL SELECT 1 FROM public.documentos_alumno WHERE alumno_id = '${A}'
         UNION ALL SELECT 1 FROM public.calificaciones WHERE alumno_id = '${A}' UNION ALL SELECT 1 FROM public.alumnos WHERE id = '${A}'
         UNION ALL SELECT 1 FROM public.usuarios WHERE id = '${A}' UNION ALL SELECT 1 FROM public.notas_alumno WHERE alumno_id = '${A}'`), 8],
  ['alumno_lee_el_banco_sin_clave', 'A', sel(`SELECT id, pregunta, opcion_a FROM public.preguntas`), 0],
  ['alumno_escribe_su_nota', 'A',
    dml(`INSERT INTO public.notas_alumno (alumno_id, semana_id, contenido) VALUES ('${A}', '${S1}', 'nueva') ON CONFLICT (alumno_id, semana_id) DO UPDATE SET contenido = EXCLUDED.contenido`), 1],
  ['alumno_edita_su_perfil', 'A', dml(`UPDATE public.usuarios SET nombre = 'A2', telefono = '555' WHERE id = '${A}'`), 1],
  ['admin_lee_todo', 'ADM', sel(`SELECT 1 FROM public.progreso_semanas UNION ALL SELECT 1 FROM public.constancias UNION ALL SELECT 1 FROM public.documentos_alumno`), 4],
  ['admin_lee_el_banco', 'ADM', sel(`SELECT id FROM public.preguntas`), 1],
  ['anon_latido', 'anon', dml(`INSERT INTO public.keep_alive_log (source) VALUES ('r2')`), 1],
]

function intentar(db, quien, sql) {
  const r = correr(db, ['-tA'], { parar: true, entrada: `\\set VERBOSITY verbose\nBEGIN;\n${sesion(quien)}\n${sql}\nROLLBACK;\n` })
  const err = (r.stderr || '').match(/ERROR:\s+([0-9A-Z]{5}):\s*([^\n]*)/)
  if (err) return { resultado: `rechazado:${err[1]}`, detalle: err[2].slice(0, 160) }
  if (r.status !== 0) throw new Error(`psql salió con ${r.status} sin ERROR reconocible en ${db}:\n${r.stderr}`)
  const m = (r.stdout || '').match(/FILAS:(\d+)/g)
  const n = m ? Number(m[m.length - 1].slice(6)) : -1
  return n > 0 ? { resultado: `PASA:${n}`, detalle: '' } : { resultado: 'sin efecto (0 filas)', detalle: '' }
}

function checks(db) {
  const txt = psql(db, ['-tA', '-F', '|', '-f', 'scripts/post-setup-check.sql'])
  const out = {}
  for (const l of filas(txt)) {
    const [nombre, valor, resultado] = l.split('|')
    if (/\(R2\)$/.test(nombre || '')) out[nombre] = { ok: (resultado || '').startsWith('✅'), resultado: (resultado || '').slice(0, 220), valor: (valor || '').slice(0, 400) }
  }
  return out
}

const salida = { generado: new Date().toISOString().slice(0, 10), refAntes: REF_ANTES,
  migracionSha256: crypto.createHash('sha256').update(leerAhora(MIG_R2).replace(/\r\n/g, '\n')).digest('hex'),
  explotaciones: EXPLOTACIONES.map(([id, quien]) => ({ id, quien })), legitimas: LEGITIMAS.map(([id, quien, , min]) => ({ id, quien, min })),
  bases: {} }

for (const [nombre, archivos] of Object.entries(BASES)) {
  const db = `r2_${nombre}`
  process.stdout.write(`armando ${db} (${archivos.length} archivos)… `)
  psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
  psql('postgres', ['-c', `CREATE DATABASE ${db}`])
  psql(db, [], { entrada: HARNESS })
  for (const [rel, leerVersion] of archivos) {
    const cwd = rel.startsWith('scripts/') ? path.join(RAIZ, 'scripts') : RAIZ
    try { psql(db, [], { entrada: leerVersion(rel), cwd }) } catch (e) { throw new Error(`[${db}] falló ${rel}\n${e.message}`) }
  }
  psql(db, [], { entrada: SIEMBRA })
  const rolA = filas(psql(db, ['-tAc', `SELECT rol FROM public.usuarios WHERE id = '${A}'`]))[0]
  const res = { explotaciones: {}, legitimas: {}, checks: checks(db), rolAltaConMetadataAdmin: rolA }
  for (const [id, quien, sql] of EXPLOTACIONES) res.explotaciones[id] = intentar(db, quien, sql)
  for (const [id, quien, sql, min] of LEGITIMAS) {
    const r = intentar(db, quien, sql)
    const n = r.resultado.startsWith('PASA:') ? Number(r.resultado.slice(5)) : 0
    res.legitimas[id] = { ...r, ok: !r.resultado.startsWith('rechazado') && n >= min }
  }
  salida.bases[nombre] = res
  const pasan = Object.entries(res.explotaciones).filter(([, v]) => v.resultado.startsWith('PASA')).map(([k]) => k)
  const malas = Object.entries(res.legitimas).filter(([, v]) => !v.ok).map(([k]) => k)
  console.log(`${pasan.length} explotación(es) PASAN${pasan.length ? ' (' + pasan.join(', ') + ')' : ''}; legítimas rotas: ${malas.length ? malas.join(', ') : 'ninguna'}; CHECK R2: ${Object.values(res.checks).map(c => c.ok ? '✅' : '❌').join(' ')}`)
  if (!process.env.VERIF_CONSERVAR) psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
}

// ── Una base con respuestas repetidas del quiz: la migración ABORTA sin borrar ──
{
  const db = 'r2_duplicados'
  process.stdout.write(`armando ${db}… `)
  psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
  psql('postgres', ['-c', `CREATE DATABASE ${db}`])
  psql(db, [], { entrada: HARNESS })
  for (const [rel, leerVersion] of cadenaAntes) psql(db, [], { entrada: leerVersion(rel), cwd: rel.startsWith('scripts/') ? path.join(RAIZ, 'scripts') : RAIZ })
  psql(db, [], { entrada: SIEMBRA + `
INSERT INTO public.quiz_respuestas (alumno_id, quiz_id, respuesta, correcta, fecha) VALUES
  ('${A}', '${Q1}', 'a', false, NOW() - INTERVAL '1 minute'), ('${A}', '${Q1}', 'b', true, NOW());` })
  const r = correr(db, [], { entrada: leerAhora(MIG_R2) })
  const filasQuiz = Number(filas(psql(db, ['-tAc', `SELECT count(*) FROM public.quiz_respuestas WHERE alumno_id = '${A}'`]))[0])
  const sigueAbierto = filas(psql(db, ['-tAc', `SELECT has_table_privilege('authenticated', 'public.progreso_semanas', 'INSERT')`]))[0] === 't'
  salida.duplicados = { aborta: r.status !== 0, mensaje: ((r.stderr || '').match(/ERROR:\s+([^\n]*)/) || [])[1] || '', filasQuiz, sinCambios: sigueAbierto }
  console.log(`aborta: ${salida.duplicados.aborta}; filas del quiz intactas: ${filasQuiz}; nada aplicado a medias: ${sigueAbierto}`)
  if (!process.env.VERIF_CONSERVAR) psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
}

fs.mkdirSync(path.dirname(FOTO), { recursive: true })
fs.writeFileSync(FOTO, JSON.stringify(salida, null, 2) + '\n')

// Veredicto: después de la R2 nada pasa y todo lo legítimo funciona; antes, sí pasaban.
let fallas = 0
for (const nombre of ['migrada', 'copia_vieja', 'despues', 'instalador', 'combo']) {
  const b = salida.bases[nombre]
  for (const [id, v] of Object.entries(b.explotaciones)) if (v.resultado.startsWith('PASA')) { console.log(`✘ ${nombre}: ${id} PASA`); fallas++ }
  for (const [id, v] of Object.entries(b.legitimas)) if (!v.ok) { console.log(`✘ ${nombre}: legítima ${id} → ${v.resultado} ${v.detalle}`); fallas++ }
  for (const [n, c] of Object.entries(b.checks)) if (!c.ok) { console.log(`✘ ${nombre}: ${n} → ${c.resultado}`); fallas++ }
  if (b.rolAltaConMetadataAdmin !== 'alumno') { console.log(`✘ ${nombre}: el alta con metadata admin dio rol ${b.rolAltaConMetadataAdmin}`); fallas++ }
}
if (Object.keys(salida.bases.despues.checks).length !== 3) { console.log('✘ no se encontraron los 3 CHECK R2'); fallas++ }
if (!(salida.duplicados.aborta && salida.duplicados.filasQuiz === 2 && salida.duplicados.sinCambios)) {
  console.log(`✘ con duplicados la migración debía abortar sin borrar ni aplicar nada: ${JSON.stringify(salida.duplicados)}`); fallas++
}
console.log(fallas ? `\n✘ ${fallas} falla(s); foto en ${path.relative(RAIZ, FOTO)}` : `\n✔ R2 verificada con RLS real; foto en ${path.relative(RAIZ, FOTO)}`)
process.exit(fallas ? 1 : 0)
