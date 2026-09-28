import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Bloque D · D22d-2 — la respuesta correcta solo la lee el servidor (BD).
 * Decisiones K-d4 a K-d10 de Kevin (la app, D22d-1, ya lee los bancos y escribe
 * intentos y respuestas con el service role después del gate):
 *  - preguntas, quiz_semana y curso_examen_preguntas: RLS encendida + techo
 *    RESTRICTIVE solo-admin (K-d4, K-d7, K-d8) y SELECT por LISTA BLANCA de
 *    columnas (K-d5): ninguna sesión lee respuesta_correcta, explicacion ni
 *    retroalimentacion; anon, nada.
 *  - curso_examen_resultados.respuestas (el ✓/✗ guardado) sin SELECT con sesión (K-d3).
 *  - K4 (K-d6): sin INSERT/UPDATE/DELETE con sesión en intentos_evaluacion y
 *    quiz_respuestas.
 *  - CHECK 28, 29 y 30 separados (K-d10); fila 23 de 7bis: «desplegar la app ANTES».
 */
const raiz = process.cwd()
const leer = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const normal = (sql: string) => sinComentariosSql(sql).replace(/\/\*[\s\S]*?\*\//g, '').replace(/"/g, '').toLowerCase()
const plano = (s: string) => s.replace(/[\s()]/g, '').replace(/public\./g, '').toLowerCase()

const MIG = '20260928170000_d22d_claves_solo_servidor.sql'
const DIR_MIG = join('supabase', 'migrations')
const P6 = join(DIR_MIG, '20260728120000_examen_final_cursos.sql')
const M186 = join(DIR_MIG, '20260924140000_preguntas_sin_clave_rest.sql')
const SCHEMA = join('scripts', 'schema.sql')
const SB_SCHEMA = join('supabase', 'schema.sql')
const migracion = () => leer(DIR_MIG, MIG)

const REVELADORAS = ['respuesta_correcta', 'explicacion', 'retroalimentacion']
const LISTA_PREGUNTAS = ['id', 'evaluacion_id', 'pregunta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'orden', 'activa', 'created_at']
const LISTA_QUIZ = ['id', 'semana_id', 'pregunta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'opciones', 'orden', 'activa']
const LISTA_CURSO = ['id', 'curso_id', 'orden', 'tema', 'enunciado', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d']
const LISTA_RESULTADOS = ['id', 'curso_id', 'alumno_id', 'aciertos', 'total', 'porcentaje', 'desglose_temas', 'created_at']

// ARRAY['a', 'b'] → ['a', 'b'] (la constante de nombre `nombre` en un texto).
const arreglo = (t: string, nombre: string) => {
  const m = t.match(new RegExp(`${nombre}\\s+CONSTANT TEXT\\[\\] := ARRAY\\[([^\\]]*)\\]`))
  expect(m, nombre).not.toBeNull()
  return m![1].split(',').map(s => s.trim().replace(/^'|'$/g, ''))
}
// GRANT SELECT (a, b) ON public.<tabla> TO authenticated; → ['a', 'b']
const grantColumnas = (t: string, tabla: string) => {
  const m = t.match(new RegExp(`GRANT\\s+SELECT \\(([^)]*)\\)\\s+ON public\\.${tabla} TO authenticated;`))
  expect(m, tabla).not.toBeNull()
  return m![1].split(/,\s*/)
}
// La política CREATE POLICY "<nombre>" … ; de un texto (la primera).
const politica = (sql: string, nombre: string) => sql.match(new RegExp(`CREATE POLICY "${nombre.replace(/[()]/g, '\\$&')}"[^;]*;`))?.[0] ?? ''
const TECHO_PROPIO = (tabla: string, prefijo: string) => `CREATE POLICY "${prefijo}: techo propio o admin (D22d)" ON public.${tabla} AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (alumno_id = auth.uid() OR public.es_admin());`
const TECHO = (tabla: string) => `CREATE POLICY "${tabla}: techo solo admin (D22d)" ON public.${tabla} AS RESTRICTIVE FOR ALL TO anon, authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());`

// ¿Este SQL le da a una sesión SELECT de TABLA (o ALL) sobre una de estas tablas? El SELECT
// por columnas (GRANT SELECT (a, b) ON …) es la lista blanca y no cuenta.
const SESION = String.raw`\bto\s+[^;]*\b(anon|authenticated|public)\b`
// «on [table] a, b, c to …»: la tabla en CUALQUIER lugar de la lista de objetos.
const OBJETOS = (tablas: string) => String.raw`\bon\s+(table\s+)?[^;]*?\b(public\.)?(${tablas})\b[^;]*?\bto\s`
const abreLectura = (sql: string, tablas: string) => {
  for (const g of normal(sql).match(/\bgrant\s[^;]*;/g) ?? []) {
    if (!new RegExp(SESION).test(g)) continue
    if (/\bon\s+all\s+tables\s+in\s+schema\s+public\b/.test(g) && /\b(all|select)\b/.test(g.split(/\bon\b/)[0])) return true
    if (!new RegExp(OBJETOS(tablas)).test(g)) continue
    const privs = g.slice(g.indexOf('grant') + 5, g.search(/\bon\s/))
    if (/\ball\b/.test(privs) || /\bselect\b(?!\s*\()/.test(privs)) return true
  }
  return false
}
const abreEscritura = (sql: string, tablas: string) => {
  for (const g of normal(sql).match(/\bgrant\s[^;]*;/g) ?? []) {
    if (!new RegExp(SESION).test(g)) continue
    const privs = g.slice(g.indexOf('grant') + 5, g.search(/\bon\s/))
    if (!/\b(all|insert|update|delete|truncate)\b/.test(privs)) continue
    if (/\bon\s+all\s+tables\s+in\s+schema\s+public\b/.test(g)) return true
    if (new RegExp(OBJETOS(tablas)).test(g)) return true
  }
  return false
}
const BANCOS = 'preguntas|quiz_semana|curso_examen_preguntas'
const K4 = 'intentos_evaluacion|quiz_respuestas'
// Toda fuente que instala o migra: las migraciones, los dos schemas y los .sql de scripts/.
// Fuera: los instaladores legados de la raíz (EDVEX-SUPABASE-SETUP.sql, migration-quiz-notas.sql)
// y la serie CEEVA (supabase/schema-0*.sql): issue #272 (retirarlos); D22d los cierra al migrar.
const fuentes = () => [
  ...readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql')).map(f => join(DIR_MIG, f)),
  ...readdirSync(join(raiz, 'scripts')).filter(f => f.endsWith('.sql')).map(f => join('scripts', f)),
  SB_SCHEMA,
]

test('1. Migración: transaccional, «app ANTES», preflight, epílogo y reversa de 4 partes', () => {
  const crudo = migracion()
  expect(crudo).toContain('⚠️ CÓRRELA SOLO DESPUÉS DE DESPLEGAR LA APP DE D22d')
  const s = sinComentariosSql(crudo)
  expect(s).toMatch(/^BEGIN;/m)
  expect(s).toMatch(/^COMMIT;/m)
  expect(s.indexOf("NOTIFY pgrst, 'reload schema';")).toBeGreaterThan(s.indexOf('$d22d$;'))
  // Preflight: tablas, S2, FORCE RLS y DEFINER ajena ejecutable con sesión.
  expect(s).toContain("IF to_regclass('public.preguntas') IS NULL OR to_regclass('public.quiz_semana') IS NULL THEN")
  expect(s).toContain("p.prosecdef AND p.prosrc ~* 'lower\\s*\\(\\s*rol\\s*\\)'")
  expect(s).toContain('AND c.relforcerowsecurity')
  expect(s).toContain("AND p.proowner <> t.relowner AND NOT (o.rolbypassrls OR o.rolsuper)")
  expect(s).toMatch(/IF r\.con_sesion THEN\s+RAISE EXCEPTION/)
  // Epílogo: columnas reveladoras, fuera de lista y anon; ✓/✗ guardado; RLS y techo; K4.
  expect(s).toContain("AND has_column_privilege(ro.rol, c.oid, a.attnum, 'SELECT')")
  expect(s).toContain("AND (a.attname = ANY (c_reveladoras)")
  expect(s).toContain("OR ro.rol = 'anon');")
  expect(s).toContain("has_column_privilege('authenticated', 'public.curso_examen_resultados', 'respuestas', 'SELECT')")
  expect(s).toContain("RAISE EXCEPTION 'D22d: sin RLS o sin techo solo-admin: %.', v_malas;")
  expect(s).toContain("OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, to_regclass('public.' || x), pv.p)) END;")
  // Cada verificación del epílogo ABORTA (y la transacción se deshace); ninguna se queda en aviso.
  const iEpilogo = s.indexOf("SELECT string_agg(DISTINCT ro.rol || ' → ' || c.relname")
  expect(iEpilogo).toBeGreaterThan(0)
  const epilogo = s.slice(iEpilogo)
  for (const m of ["'D22d: tras el REVOKE una sesión todavía lee (%)", "'D22d: curso_examen_resultados.respuestas sigue legible con sesión.'",
    "'D22d: sin RLS o sin techo solo-admin: %.'", "'D22d: intentos o respuestas del quiz siguen escribibles con sesión (%).'",
    "'D22d: sin RLS o sin techo de lectura propio o admin: %.'"]) {
    expect(epilogo, m).toContain(`RAISE EXCEPTION ${m}`)
  }
  expect(epilogo).not.toMatch(/RAISE NOTICE 'D22d: [^']*(sigue|siguen|todavía|sin RLS)/)
  // Reversa de emergencia en la cabecera: cuatro partes, solo lo que la app anterior usa con la
  // sesión; la (1) quita los techos; el upsert JSONB del quiz necesita UPDATE; nada del módulo
  // Cursos (la app anterior ya lo leía con el service role, y así corre en una base sin él).
  const rev = crudo.slice(crudo.indexOf('-- REVERSA DE EMERGENCIA'), crudo.indexOf('BEGIN;'))
  for (const n of ['(1)', '(2)', '(3)', '(4)']) expect(rev).toContain(`--   ${n} `)
  expect(rev).not.toContain('--   (5) ')
  expect(rev).toContain('DROP POLICY IF EXISTS "preguntas: techo solo admin (D22d)"')
  expect(rev).toContain('DROP POLICY IF EXISTS "quiz_semana: techo solo admin (D22d)"')
  expect(rev).toContain('GRANT SELECT ON public.preguntas, public.quiz_semana TO authenticated;')
  expect(rev).toContain('GRANT INSERT ON public.intentos_evaluacion, public.quiz_respuestas TO authenticated;')
  expect(rev).toContain('GRANT UPDATE ON public.quiz_respuestas TO authenticated;')
  expect(rev.split('\n').filter(l => /^--\s{3,}(\(\d\) )?(DROP|CREATE|GRANT)/.test(l)).join('\n')).not.toMatch(/curso_/)
})

test('2. Capa 1: fuera «lectura autenticados»; RLS encendida (CEEVA) y techo solo-admin en los tres bancos', () => {
  const s = sinComentariosSql(migracion())
  expect(s).toContain('DROP POLICY IF EXISTS "preguntas: lectura autenticados" ON public.preguntas;')
  expect(s).toContain('DROP POLICY IF EXISTS "quiz_semana: lectura autenticados" ON public.quiz_semana;')
  expect(plano(politica(s, 'preguntas: techo solo admin (D22d)'))).toBe(plano(TECHO('preguntas')))
  expect(plano(politica(s, 'quiz_semana: techo solo admin (D22d)'))).toBe(plano(TECHO('quiz_semana')))
  // El de curso, solo si existe la tabla (base sin módulo Cursos) y por EXECUTE.
  const iCurso = s.indexOf("IF to_regclass('public.curso_examen_preguntas') IS NOT NULL THEN")
  expect(iCurso).toBeGreaterThan(0)
  expect(plano(politica(s.slice(iCurso), 'curso_examen_preguntas: techo solo admin (D22d)').replace('$p$', ''))).toBe(
    plano(TECHO('curso_examen_preguntas')))
  // K-d8: la RLS apagada se enciende, y si falta la permisiva del admin, se crea.
  expect(s).toContain("EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_t);")
  expect(s).toContain("EXECUTE format('CREATE POLICY %I ON public.%I USING (public.es_admin())', v_t || ': admin gestiona', v_t);")
  // K-d9: las permisivas de drift se listan, no se borran.
  expect(s).not.toMatch(/DROP POLICY[^;]*(read_quiz|preguntas_select)/)
})

test('3. Capa 2: lista blanca sin columnas reveladoras; REVOKE a anon, PUBLIC y el SELECT de tabla', () => {
  const s = sinComentariosSql(migracion())
  expect(arreglo(s, 'c_preguntas')).toEqual(LISTA_PREGUNTAS)
  expect(arreglo(s, 'c_quiz')).toEqual(LISTA_QUIZ)
  expect(arreglo(s, 'c_curso')).toEqual(LISTA_CURSO)
  expect(arreglo(s, 'c_reveladoras')).toEqual(REVELADORAS)
  for (const l of [LISTA_PREGUNTAS, LISTA_QUIZ, LISTA_CURSO, LISTA_RESULTADOS]) for (const r of [...REVELADORAS, 'respuestas']) expect(l).not.toContain(r)
  expect(s).toContain("EXECUTE format('REVOKE ALL ON public.%I FROM anon, PUBLIC', r.tabla);")
  expect(s).toContain("EXECUTE format('REVOKE SELECT ON public.%I FROM authenticated', r.tabla);")
  expect(s).toContain("EXECUTE format('GRANT SELECT (%s) ON public.%I TO authenticated', v_cols, r.tabla);")
  expect(s).toContain('AND a.attname = ANY (r.lista);')
  // K-d3: todo menos `respuestas` en los resultados del examen de curso.
  expect(s).toContain('REVOKE SELECT ON public.curso_examen_resultados FROM authenticated;')
  expect(s).toContain("AND a.attname <> 'respuestas';")
})

test('4. K4: sin escritura con sesión en intentos_evaluacion y quiz_respuestas; el SELECT propio se queda', () => {
  const s = sinComentariosSql(migracion())
  expect(s).toContain('DROP POLICY IF EXISTS "intentos: registrar propio intento" ON public.intentos_evaluacion;')
  expect(s).toContain('DROP POLICY IF EXISTS "quiz_respuestas: registrar propia" ON public.quiz_respuestas;')
  expect(arreglo(s, 'c_k4')).toEqual(['intentos_evaluacion', 'quiz_respuestas'])
  expect(s).toContain("EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', v_t);")
  expect(s).toContain("EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_t);")
  // H5: cada quien lee lo suyo — RLS encendida y techo RESTRICTIVE «propio o admin», igual en las fuentes.
  // (en la sección de K4: la de los bancos es otra)
  const k4 = s.slice(s.indexOf('DROP POLICY IF EXISTS "intentos: registrar propio intento" ON public.intentos_evaluacion;'))
  expect(k4).toContain("EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_t);")
  expect(k4).toContain("EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (alumno_id = auth.uid() OR public.es_admin())',")
  for (const f of [join(DIR_MIG, MIG), SCHEMA, SB_SCHEMA]) {
    const t = sinComentariosSql(leer(f))
    expect(plano(politica(t, 'intentos: techo propio o admin (D22d)')), f).toBe(plano(TECHO_PROPIO('intentos_evaluacion', 'intentos')))
    expect(plano(politica(t, 'quiz_respuestas: techo propio o admin (D22d)')), f).toBe(plano(TECHO_PROPIO('quiz_respuestas', 'quiz_respuestas')))
  }
  expect(migracion()).not.toContain('No delata claves')
  // Ninguna fuente vuelve a crear el INSERT propio.
  for (const f of [SCHEMA, SB_SCHEMA, ...readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql')).map(f => join(DIR_MIG, f))]) {
    const t = sinComentariosSql(leer(f))
    expect(t, f).not.toContain('CREATE POLICY "intentos: registrar propio intento"')
    expect(t, f).not.toContain('CREATE POLICY "quiz_respuestas: registrar propia"')
  }
})

test('5. Fuentes: los dos schemas y el paso 6 nacen cerrados, con el MISMO techo y la MISMA lista blanca', () => {
  for (const f of [SCHEMA, SB_SCHEMA]) {
    const t = sinComentariosSql(leer(f))
    expect(t, f).not.toMatch(/CREATE POLICY "(preguntas|quiz_semana): lectura autenticados"/)
    expect(plano(politica(t, 'preguntas: techo solo admin (D22d)')), f).toBe(plano(TECHO('preguntas')))
    expect(plano(politica(t, 'quiz_semana: techo solo admin (D22d)')), f).toBe(plano(TECHO('quiz_semana')))
    // La lista blanca estática = la de la migración ∩ columnas de la tabla en ese schema.
    expect(grantColumnas(t, 'preguntas'), f).toEqual(LISTA_PREGUNTAS)
    expect(grantColumnas(t, 'quiz_semana'), f).toEqual(LISTA_QUIZ.filter(c => c !== 'opciones'))
    // El bloque de privilegios va DESPUÉS de cada CREATE TABLE (los GRANT de fábrica llegan al crear).
    const iPriv = t.indexOf('REVOKE SELECT ON public.preguntas FROM authenticated;')
    for (const tabla of ['preguntas', 'quiz_semana', 'intentos_evaluacion', 'quiz_respuestas']) {
      const iCrea = t.search(new RegExp(`CREATE TABLE (IF NOT EXISTS )?public\\.${tabla} \\(`))
      expect(iCrea, `${f} ${tabla}`).toBeGreaterThanOrEqual(0)
      expect(iPriv, `${f} ${tabla}`).toBeGreaterThan(iCrea)
    }
    for (const tabla of ['preguntas', 'quiz_semana']) {
      const iAnon = t.indexOf(`REVOKE ALL    ON public.${tabla} FROM anon, PUBLIC;`)
      const iAut = t.indexOf(`REVOKE SELECT ON public.${tabla} FROM authenticated;`)
      const iGrant = t.search(new RegExp(`GRANT\\s+SELECT \\([^)]*\\)\\s+ON public\\.${tabla} TO authenticated;`))
      expect(iAnon, `${f} ${tabla}`).toBeGreaterThanOrEqual(0)
      expect(iAut, `${f} ${tabla}`).toBeGreaterThanOrEqual(0)
      expect(iGrant, `${f} ${tabla}`).toBeGreaterThan(Math.max(iAnon, iAut))
    }
    for (const tabla of ['intentos_evaluacion', 'quiz_respuestas']) {
      expect(t, f).toContain(`REVOKE ALL ON public.${tabla} FROM anon, PUBLIC;`)
      expect(t, f).toContain(`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.${tabla} FROM authenticated;`)
    }
    // Sin el bloque viejo de #186 (su lista negra calculada dejaba pasar retroalimentacion).
    expect(t, f).not.toContain("column_name <> 'respuesta_correcta'")
  }
  // scripts/schema.sql: antes del NOTIFY final.
  const s = sinComentariosSql(leer(SCHEMA))
  expect(s.indexOf('REVOKE SELECT ON public.quiz_semana FROM authenticated;')).toBeLessThan(s.lastIndexOf("NOTIFY pgrst, 'reload schema';"))
  // Paso 6: techo + lista blanca; re-correrlo ya no reabre (CHECK 29).
  const p6 = sinComentariosSql(leer(P6))
  expect(plano(politica(p6, 'curso_examen_preguntas: techo solo admin (D22d)'))).toBe(plano(TECHO('curso_examen_preguntas')))
  expect(grantColumnas(p6, 'curso_examen_preguntas')).toEqual(LISTA_CURSO)
  expect(grantColumnas(p6, 'curso_examen_resultados')).toEqual(LISTA_RESULTADOS)
  for (const tabla of ['curso_examen_preguntas', 'curso_examen_resultados']) {
    const pad = tabla === 'curso_examen_preguntas' ? ' ' : ''
    const iAnon = p6.indexOf(`REVOKE ALL    ON public.${tabla} ${pad}FROM anon, PUBLIC;`)
    const iAut = p6.indexOf(`REVOKE SELECT ON public.${tabla} ${pad}FROM authenticated;`)
    const iGrant = p6.search(new RegExp(`GRANT\\s+SELECT \\([^)]*\\)\\s+ON public\\.${tabla} TO authenticated;`))
    expect(iAnon, tabla).toBeGreaterThanOrEqual(0)
    expect(iAut, tabla).toBeGreaterThanOrEqual(0)
    expect(iGrant, tabla).toBeGreaterThan(Math.max(iAnon, iAut))
  }
  expect(p6).toContain("to_regproc('public.es_admin') IS NULL")
  // La migración de #186 no se toca (historia de MEDERI).
  expect(leer(M186)).toContain("REVOKE SELECT ON public.preguntas FROM anon, authenticated")
})

test('6. Ninguna fuente le devuelve a una sesión el SELECT de tabla de un banco ni escritura de intentos', () => {
  for (const f of fuentes()) {
    const t = leer(f)
    expect(abreLectura(t, `${BANCOS}|curso_examen_resultados`), f).toBe(false)
    expect(abreEscritura(t, K4), f).toBe(false)
  }
  // Controles del detector.
  for (const sql of ['GRANT SELECT ON public.preguntas TO authenticated;', 'grant all on table "public"."quiz_semana" to anon;',
    'GRANT SELECT, INSERT ON public.curso_examen_preguntas TO authenticated;', 'GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;',
    'GRANT SELECT ON public.curso_examen_resultados TO PUBLIC;', 'GRANT SELECT ON public.materias, public.quiz_semana TO authenticated;']) {
    expect(abreLectura(sql, `${BANCOS}|curso_examen_resultados`), sql).toBe(true)
  }
  for (const sql of ['GRANT SELECT (id, pregunta) ON public.preguntas TO authenticated;', 'GRANT ALL ON public.preguntas TO service_role;',
    'GRANT INSERT, UPDATE, DELETE ON public.curso_examen_preguntas TO authenticated;']) expect(abreLectura(sql, BANCOS), sql).toBe(false)
  for (const sql of ['GRANT INSERT ON public.intentos_evaluacion TO authenticated;', 'GRANT UPDATE (correcta) ON quiz_respuestas TO authenticated;',
    'GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;', 'GRANT INSERT ON public.notas_alumno, public.quiz_respuestas TO authenticated;']) {
    expect(abreEscritura(sql, K4), sql).toBe(true)
  }
  expect(abreEscritura('GRANT SELECT ON public.intentos_evaluacion TO authenticated;', K4)).toBe(false)
})

test('7. CHECK 28, 29 y 30 después del 27: privilegio real columna por columna, techo y remedio «app primero»', () => {
  const check = leer('scripts', 'post-setup-check.sql')
  const i27 = check.indexOf('─── CHECK 27'), i28 = check.indexOf('─── CHECK 28'), i29 = check.indexOf('─── CHECK 29'), i30 = check.indexOf('─── CHECK 30')
  expect(i27).toBeGreaterThan(0)
  expect(i28).toBeGreaterThan(i27)
  expect(i29).toBeGreaterThan(i28)
  expect(i30).toBeGreaterThan(i29)
  const c28 = check.slice(i28, i29), c29 = check.slice(i29, i30), c30 = check.slice(i30)
  const lista = (t: string, tabla: string) => {
    const m = t.match(new RegExp(`\\('${tabla}',\\s+ARRAY\\[([^\\]]*)\\]\\)`))
    expect(m, tabla).not.toBeNull()
    return m![1].split(',').map(s => s.trim().replace(/^'|'$/g, ''))
  }
  expect(lista(c28, 'preguntas')).toEqual(LISTA_PREGUNTAS)
  expect(lista(c28, 'quiz_semana')).toEqual(LISTA_QUIZ)
  for (const c of [c28, c29]) {
    expect(c).toContain("AND has_column_privilege(ro.rol, b.oid, a.attnum, 'SELECT')")
    expect(c).toContain("a.attname::text IN ('respuesta_correcta', 'explicacion', 'retroalimentacion')")
    expect(c).toContain("OR NOT (a.attname::text = ANY (b.lista)) OR ro.rol = 'anon')")
    expect(c).toContain("AND p.cmd IN ('ALL', 'SELECT')")
    expect(c).toContain("IN ('es_admin', 'is_admin')")
    expect(c).toContain('primero despliega el código de D22d')
    expect(c).toContain(`supabase/migrations/${MIG} (idempotente)`)
  }
  expect(c29).toContain("ARRAY['id', 'curso_id', 'orden', 'tema', 'enunciado', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d'] AS lista")
  expect(c29).toContain("THEN has_column_privilege(ro.rol, b.res, 'respuestas', 'SELECT') ELSE false END")
  expect(c29).toContain('no aplica')
  expect(c29).toContain('20260728120000_examen_final_cursos.sql es vieja')
  expect(c30).toContain("OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, to_regclass('public.' || x.tabla), pv.p)) END")
  expect(c30).toContain('❌ INTENTO FABRICABLE')
  expect(c30).toContain("IN ('alumno_id=auth.uidores_admin', 'alumno_id=auth.uid')) AS techo")
  expect(c30).toContain("(SELECT string_agg(tabla, ', ' ORDER BY tabla) FROM l WHERE NOT rls OR NOT techo) AS ajenas")
  expect(c30).toMatch(/WHEN ajenas IS NOT NULL\s+THEN '❌ RESPUESTAS AJENAS A LA VISTA/)
  // El techo del CHECK reconoce el de las fuentes (USING normalizado).
  expect(plano('(public.es_admin())')).toBe('es_admin')
})

test('8. SETUP: fila 23 después de la 22, con «la app ANTES»; nota del paso 7; la frase de D22c intacta', () => {
  const setup = leer('SETUP.md')
  const i22 = setup.indexOf('   | 22 | `20260928160000_d22c_postgrest_directo.sql`')
  const i23 = setup.indexOf(`   | 23 | \`${MIG}\``)
  expect(i22).toBeGreaterThan(0)
  expect(i23).toBeGreaterThan(i22)
  const fila = setup.slice(i23, setup.indexOf('\n', i23))
  expect(fila).toContain('**Aplica a TODA base.**')
  expect(fila).toContain('⚠️ **Desplegar la app de D22d ANTES**')
  expect(fila).toContain('(CHECK 28, 29 y 30)')
  expect(fila).toContain('Incluye lo de #186 (Bug 221)')
  const paso7 = setup.slice(setup.indexOf('7. **Parches de seguridad (obligatorios)**'), setup.indexOf('7bis.'))
  expect(paso7).toContain('después de 7bis corre su **fila 22**')
  expect(paso7).toContain('**Y en toda base, después de desplegar la app de D22d:** su **fila 23**')
  expect(leer('INSTRUCCIONES-SOLO-CURSOS.md')).toContain('las filas 15 a 23 de la tabla 7bis de `SETUP.md` (D7b → D22d)')
  expect(readdirSync(join(raiz, DIR_MIG))).toContain(MIG)
})
