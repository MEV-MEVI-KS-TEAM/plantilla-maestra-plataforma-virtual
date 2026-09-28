import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * Bloque D · D22c — por PostgREST nadie escribe `pagos` ni lee el directorio del
 * personal (decisiones K1-K4, K6 y K7 de Kevin):
 *  - pagos: sin INSERT/UPDATE/DELETE para anon/authenticated (tabla y columna);
 *    SELECT propio o admin, con techo RESTRICTIVE (K2, K3).
 *  - curso_registrar_pago (legado) y registrar_cuota_semanal: solo el servidor;
 *    la segunda, además, con guarda interna (K4).
 *  - El trigger de reversión solo toca la semana del pago borrado (K6).
 *  - usuarios: SELECT propio o admin, con techo RESTRICTIVE (K1, K7).
 */
const raiz = process.cwd()
const leer = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const sinComentariosTs = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const normal = (sql: string) => sinComentariosSql(sql).replace(/\/\*[\s\S]*?\*\//g, '').replace(/"/g, '').toLowerCase()
const plano = (s: string) => s.replace(/[\s()]/g, '').replace(/public\./g, '').toLowerCase()

const MIG = '20260928160000_d22c_postgrest_directo.sql'
const DIR_MIG = join('supabase', 'migrations')
const ROL = join(DIR_MIG, '20260716130000_rol_secretario.sql')
const PAGOS = join(DIR_MIG, '20260716120000_pagos.sql')
const B3 = join(DIR_MIG, '20260730140000_b3_abrir_mes_y_pagos_curso.sql')
const PER = join(DIR_MIG, '20260910130000_periodicidad_semanal.sql')
const SCHEMA = join('scripts', 'schema.sql')
const SB_SCHEMA = join('supabase', 'schema.sql')
const migracion = () => leer(DIR_MIG, MIG)

// ¿Este SQL le da a una sesión (anon, authenticated o PUBLIC) escritura sobre pagos?
const A_SESION = String.raw`\bto\s+[^;]*\b(anon|authenticated|public)\b`
const escribePagos = (sql: string) => new RegExp(
  String.raw`grant\s[^;]*?\b(all|insert|update|delete|truncate)\b[^;]*?\bon\s+(table\s+)?(public\.)?pagos\b[^;]*?` + A_SESION).test(normal(sql))
const abreFuncion = (sql: string, fn: string) => new RegExp(
  String.raw`grant\s[^;]*?\bon\s+((all\s+(functions|routines)\s+in\s+schema\s+public)|((function|routine)\s+(public\.)?${fn}\b))[^;]*?` + A_SESION).test(normal(sql))
// La política CREATE POLICY "<nombre>" … ; de un texto (la primera).
const politica = (sql: string, nombre: string) => sql.match(new RegExp(`CREATE POLICY "${nombre.replace(/[()]/g, '\\$&')}"[^;]*;`))?.[0] ?? ''

test('1. Migración: transaccional, preflight (S2, FORCE RLS, dueño) y epílogo', () => {
  const s = sinComentariosSql(migracion())
  expect(s).toMatch(/^BEGIN;/m)
  expect(s).toMatch(/^COMMIT;/m)
  expect(s).toContain("NOTIFY pgrst, 'reload schema';")
  expect(s).toContain("p.prosecdef AND p.prosrc ~* 'lower\\s*\\(\\s*rol\\s*\\)'")
  expect(s).toContain('AND c.relforcerowsecurity')
  expect(s).toContain("AND p.proowner <> t.relowner AND NOT (o.rolbypassrls OR o.rolsuper)")
  // Epílogo: privilegio real (tabla y columna), la función legada, la guarda K4 y los dos techos.
  expect(s).toContain("OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, 'public.pagos', pv.p))")
  expect(s).toContain("AND has_function_privilege(ro.rol, p.oid, 'EXECUTE')")
  expect(s).toContain("strpos(p.prosrc, 'D22c (K4)') = 0")
  expect(s).toContain("policyname IN ('usuarios: techo propio o admin (D22c)', 'pagos: techo propio o admin (D22c)')")
})

test('2. H1: pagos sin escritura por PostgREST (tabla y columna); SELECT se queda', () => {
  const s = sinComentariosSql(migracion())
  expect(s).toContain('REVOKE ALL ON public.pagos FROM anon;')
  expect(s).toContain('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pagos FROM authenticated;')
  expect(s).toContain("EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.pagos FROM anon, authenticated', r.attname);")
  expect(s).toContain('GRANT SELECT ON public.pagos TO authenticated;')
  // Las fuentes: el REVOKE va DESPUÉS de cada CREATE TABLE pagos (los GRANT de fábrica llegan al crear).
  for (const f of [PAGOS, SCHEMA, SB_SCHEMA]) {
    const t = sinComentariosSql(leer(f))
    const iCrea = t.indexOf('CREATE TABLE IF NOT EXISTS public.pagos (')
    const iRevoke = t.indexOf('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pagos FROM authenticated;')
    expect(iCrea, f).toBeGreaterThanOrEqual(0)
    expect(iRevoke, f).toBeGreaterThan(iCrea)
    expect(t, f).toContain('REVOKE ALL ON public.pagos FROM anon;')
  }
  // Ninguna fuente le devuelve escritura a una sesión (en cualquier forma).
  const fuentes = [...readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql')).map(f => join(DIR_MIG, f)), SCHEMA, SB_SCHEMA]
  for (const f of fuentes) expect(escribePagos(leer(f)), f).toBe(false)
  for (const sql of ['GRANT ALL ON public.pagos TO authenticated;', 'grant insert on table "public"."pagos" to anon;',
    'GRANT INSERT (monto) ON pagos TO authenticated;', 'GRANT UPDATE ON public.pagos TO PUBLIC;']) expect(escribePagos(sql), sql).toBe(true)
  expect(escribePagos('GRANT SELECT ON public.pagos TO authenticated;')).toBe(false)
})

test('3. H3: curso_registrar_pago solo para el servidor, en B3 y en la migración (todas sus firmas)', () => {
  const b3 = leer(B3)
  const FIRMA = 'public.curso_registrar_pago(UUID, NUMERIC, TEXT, TEXT, TEXT, DATE, BOOLEAN, INTEGER)'
  expect(b3).toContain(`EXECUTE 'REVOKE ALL ON FUNCTION ${FIRMA} FROM PUBLIC';`)
  expect(b3).toContain(`EXECUTE 'REVOKE ALL ON FUNCTION ${FIRMA} FROM anon';`)
  expect(b3).toContain(`EXECUTE 'REVOKE ALL ON FUNCTION ${FIRMA} FROM authenticated';`)
  expect(b3).toContain(`EXECUTE 'GRANT EXECUTE ON FUNCTION ${FIRMA} TO service_role';`)
  const s = sinComentariosSql(migracion())
  expect(s).toContain("WHERE n.nspname = 'public' AND p.proname = 'curso_registrar_pago'")
  expect(s).toContain("EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_firma);")
  // Ninguna fuente la reabre a una sesión (tampoco las que la reescriben: D7b, C3b, D20e).
  for (const f of [...readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql')).map(f => join(DIR_MIG, f)), SCHEMA, SB_SCHEMA]) {
    expect(abreFuncion(leer(f), 'curso_registrar_pago'), f).toBe(false)
  }
  // Nada de la app la llama.
  const src: string[] = []
  const recorrer = (d: string) => { for (const e of readdirSync(join(raiz, d), { withFileTypes: true })) e.isDirectory() ? recorrer(join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) && src.push(join(d, e.name)) }
  recorrer('src')
  for (const f of src) expect(sinComentariosTs(readFileSync(join(raiz, f), 'utf8')), f).not.toContain("'curso_registrar_pago'")
})

test('4. K4: la MISMA guarda interna en periodicidad, scripts/schema.sql y la migración', () => {
  const guarda = (t: string) => {
    const f = t.indexOf('CREATE OR REPLACE FUNCTION public.registrar_cuota_semanal(')
    const i = t.indexOf('-- D22c (K4)', f)
    const j = t.indexOf("IF NOT public.calendario_pagos_autorizado() THEN\n    RAISE EXCEPTION 'permiso denegado: solo el personal administrativo registra cuotas'", f)
    expect(f).toBeGreaterThanOrEqual(0)
    expect(i).toBeGreaterThan(f)
    expect(j).toBeGreaterThan(i)
    return t.slice(i, j)
  }
  const enPer = guarda(leer(PER))
  expect(guarda(leer(SCHEMA))).toBe(enPer)
  const mig = migracion()
  const v = mig.slice(mig.indexOf('$g$') + 3, mig.indexOf('$g$;'))
  expect(v).toBe(enPer)
  expect(enPer).toContain("AND (current_setting('request.jwt.claims', true)::jsonb ->> 'role') IS DISTINCT FROM 'service_role' THEN")
  expect(enPer).toContain("USING ERRCODE = '42501';")
  // Se inserta antes de la guardia de rol de la función instalada; idempotente por la marca.
  const s = sinComentariosSql(mig)
  expect(s).toContain("IF strpos(r.prosrc, 'D22c (K4)') > 0 THEN CONTINUE; END IF;")
  expect(s).toContain("v_i := strpos(v_def, 'IF NOT public.calendario_pagos_autorizado() THEN');")
  expect(s).toContain('EXECUTE substr(v_def, 1, v_i - 1) || v_guarda || substr(v_def, v_i);')
})

test('5. K6: el mismo trigger (solo la semana del pago borrado) en las tres', () => {
  const cuerpo = (t: string) => {
    const i = t.indexOf('CREATE OR REPLACE FUNCTION public.calendario_pagos_revertir_al_borrar()')
    expect(i).toBeGreaterThanOrEqual(0)
    return t.slice(i, t.indexOf('END;', i))
  }
  const per = cuerpo(leer(PER))
  expect(per).toContain('AND (pago_id IS NULL OR pago_id = OLD.id);   -- D22c (K6)')
  expect(cuerpo(leer(SCHEMA))).toBe(per)
  expect(cuerpo(migracion())).toBe(per)
})

test('6. K1 + K7: usuarios propio o admin y el techo, igual en todas las fuentes', () => {
  const PERFIL = plano('id = auth.uid() OR es_admin()')
  for (const f of [ROL, SCHEMA, SB_SCHEMA, join(DIR_MIG, MIG)]) {
    const t = sinComentariosSql(leer(f))
    const perfil = politica(t, 'usuarios: ver propio perfil')
    expect(perfil, f).not.toBe('')
    expect(plano(perfil), f).toBe(plano(`CREATE POLICY "usuarios: ver propio perfil" ON public.usuarios FOR SELECT USING (${'id = auth.uid() OR public.es_admin()'});`))
    const techo = politica(t, 'usuarios: techo propio o admin (D22c)')
    expect(plano(techo), f).toBe(plano('CREATE POLICY "usuarios: techo propio o admin (D22c)" ON public.usuarios AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (id = auth.uid() OR public.es_admin());'))
    expect(plano(techo), f).toContain(PERFIL)
  }
  // Ninguna migración vuelve a crear «ver propio perfil» con el personal.
  for (const f of readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql'))) {
    const p = politica(sinComentariosSql(leer(DIR_MIG, f)), 'usuarios: ver propio perfil')
    if (p) expect(p, f).not.toMatch(/es_staff|is_staff/)
  }
})

test('7. K2: pagos propio o admin y el techo, igual en todas las fuentes', () => {
  for (const f of [ROL, SCHEMA, SB_SCHEMA, join(DIR_MIG, MIG)]) {
    const t = sinComentariosSql(leer(f))
    const ini = f.endsWith(MIG) ? 0 : t.indexOf("IF to_regclass('public.pagos') IS NOT NULL THEN\n    DROP POLICY IF EXISTS \"pagos: ver propios\"")
    expect(ini, f).toBeGreaterThanOrEqual(0)
    const bloque = t.slice(ini)
    expect(plano(politica(bloque, 'pagos: ver propios')), f).toBe(plano('CREATE POLICY "pagos: ver propios" ON public.pagos FOR SELECT USING (alumno_id = auth.uid() OR public.es_admin());'))
    expect(plano(politica(bloque, 'pagos: techo propio o admin (D22c)')), f).toBe(
      plano('CREATE POLICY "pagos: techo propio o admin (D22c)" ON public.pagos AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (alumno_id = auth.uid() OR public.es_admin());'))
  }
  for (const f of readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql'))) {
    for (const m of sinComentariosSql(leer(DIR_MIG, f)).matchAll(/CREATE POLICY "pagos: ver propios"[^;]*;/g)) expect(m[0], f).not.toMatch(/es_staff|is_staff/)
  }
})

test('8. La app: pagos solo con el service role; usuarios con la sesión, solo la fila propia', () => {
  const archivos: string[] = []
  const recorrer = (d: string) => { for (const e of readdirSync(join(raiz, d), { withFileTypes: true })) e.isDirectory() ? recorrer(join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) && archivos.push(join(d, e.name)) }
  recorrer('src')
  let pagos = 0, propias = 0
  for (const f of archivos) {
    const t = sinComentariosTs(readFileSync(join(raiz, f), 'utf8'))
    const rel = relative(raiz, f).split(sep).join('/')
    // Identificadores que en ESTE archivo son el service role; cualquier otro cuenta como sesión.
    // «admin» lo es por convención en todo src (también como parámetro, p. ej. deshacerAlta):
    // por eso ningún archivo puede declarar un «admin» que NO salga de createAdminClient/getServiceClient.
    // (createServiceClient = el createClient de supabase-js, solo con SUPABASE_SERVICE_ROLE_KEY.)
    const esServicio = (decl: string) => /^(await\s+)?(createAdminClient|getServiceClient)\(/.test(decl)
      || /^createServiceClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!?\s*[,)]/.test(decl)
    const decls = [...t.matchAll(/(?:const|let)\s+(\w+)\s*=\s*([^;]{0,200})/g)]
    const servicio = new Set(['admin', ...decls.filter(m => esServicio(m[2])).map(m => m[1])])
    for (const m of decls.filter(m => m[1] === 'admin')) expect(esServicio(m[2]), `${rel}: «admin» que no es el service role`).toBe(true)
    for (const m of t.matchAll(/(\w+)\s*\.from\(\s*['"`](pagos|usuarios)['"`]\s*\)([\s\S]{0,600})/g)) {
      const [, cli, tabla, ventana] = m
      // La sentencia termina en la primera línea en blanco o en la siguiente sentencia (el repo no usa «;»).
      const corte = ventana.search(/\n\s*\n|\bconst\s|\blet\s|\bawait\s|\breturn\b|\bif\s*\(/)
      const resto = corte < 0 ? ventana : ventana.slice(0, corte)
      if (servicio.has(cli)) { if (tabla === 'pagos') pagos++; continue }
      expect(tabla, `${rel}: pagos con un cliente que no es el service role («${cli}»)`).toBe('usuarios')
      expect(resto, `${rel}: usuarios con la sesión solo se LEE`).toMatch(/^\s*\.select\(/)
      expect(resto, `${rel}: usuarios con la sesión, solo la fila propia`).toMatch(/\.eq\(\s*'id'\s*,\s*(user\.id|userId|user!\.id)\s*\)/)
      propias++
    }
  }
  expect(pagos).toBeGreaterThan(10)
  expect(propias).toBeGreaterThan(10)
})

test('9. CHECK 26 y 27 después del 25; SETUP: fila 22 y la nota del paso 7', () => {
  const check = leer('scripts', 'post-setup-check.sql')
  const i25 = check.indexOf('─── CHECK 25'), i26 = check.indexOf('─── CHECK 26'), i27 = check.indexOf('─── CHECK 27')
  expect(i25).toBeGreaterThan(0)
  expect(i26).toBeGreaterThan(i25)
  expect(i27).toBeGreaterThan(i26)
  const c26 = check.slice(i26, i27), c27 = check.slice(i27)
  expect(c26).toContain("OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, 'public.pagos', pv.p)))")
  expect(c26).toContain("p.proname IN ('curso_registrar_pago', 'registrar_cuota_semanal')")
  expect(c26).toContain("!~ 'request\\.jwt\\.claims.*IS DISTINCT FROM ''service_role'''")
  expect(c26).toContain("IN ('alumno_id=auth.uidores_admin', 'alumno_id=auth.uid')")
  expect(c26).toContain("p.prosrc ~ 'pago_id\\s+IS\\s+NULL\\s+OR\\s+pago_id\\s*=\\s*OLD\\.id'")
  expect(c26).toContain(`supabase/migrations/${MIG} (idempotente)`)
  expect(c27).toContain("IN ('id=auth.uidores_admin', 'id=auth.uid')")
  expect(c27).toContain("permissive = 'RESTRICTIVE' AND cmd = 'SELECT'")
  expect(c27).toContain(`supabase/migrations/${MIG} (idempotente)`)
  // Los techos: el USING normalizado del CHECK es el de las fuentes.
  expect(plano('(id = auth.uid()) OR es_admin()')).toBe('id=auth.uidores_admin')
  const setup = leer('SETUP.md')
  const i21 = setup.indexOf('   | 21 | `20260928150000_d22b_cobranza_solo_admin.sql`')
  const i22 = setup.indexOf(`   | 22 | \`${MIG}\``)
  expect(i21).toBeGreaterThan(0)
  expect(i22).toBeGreaterThan(i21)
  const fila = setup.slice(i22, setup.indexOf('\n', i22))
  expect(fila).toContain('**Aplica a TODA base, venda o no diplomados**')
  expect(fila).toContain('(CHECK 26 y 27)')
  const paso7 = setup.slice(setup.indexOf('7. **Parches de seguridad (obligatorios)**'), setup.indexOf('7bis.'))
  expect(paso7).toContain('después de 7bis corre su **fila 22**')
  expect(readdirSync(join(raiz, DIR_MIG))).toContain(MIG)
})
