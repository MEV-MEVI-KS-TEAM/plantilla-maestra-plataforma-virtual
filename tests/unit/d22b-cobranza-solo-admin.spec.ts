import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Bloque D · D22b — cobranza semanal: «pagar» es de todo el personal; condonar,
 * quitar la condonación, regenerar y el plan a medida son SOLO del admin
 * (decisión 5 de Kevin), en las tres capas:
 *  - API: /api/admin/cobranza/[alumnoId] pide verifyAdmin para toda acción que
 *    no sea 'pagar' (condición positiva), antes de tocar el service role.
 *  - Pantalla: Condonar y Regenerar solo se pintan con viewer_rol === 'ADMIN'.
 *  - Base: las cuatro funciones del calendario con EXECUTE solo para
 *    service_role (K5) y su guardia común con es_admin() fuera de service_role.
 */
const raiz = process.cwd()
const leer = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosTs = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')

const MIG = '20260928150000_d22b_cobranza_solo_admin.sql'
const PERIODICIDAD = '20260910130000_periodicidad_semanal.sql'
const FUNCIONES = ['registrar_cuota_semanal', 'condonar_semana', 'generar_calendario_pagos', 'generar_calendario_por_nivel']
const FIRMAS = [
  'generar_calendario_pagos(UUID, INTEGER, NUMERIC, DATE)',
  'generar_calendario_por_nivel(UUID, DATE)',
  'registrar_cuota_semanal(UUID, INTEGER, TEXT, UUID, TEXT, DATE, NUMERIC, TEXT, NUMERIC)',
  'condonar_semana(UUID, INTEGER, UUID, TEXT, BOOLEAN)',
]
// SQL normalizado para buscar GRANT/CREATE en cualquier forma: sin comentarios ni comillas dobles, en minúsculas.
const normal = (sql: string) => sinComentariosSql(sql).replace(/\/\*[\s\S]*?\*\//g, '').replace(/"/g, '').toLowerCase()
// ¿Este SQL le da EXECUTE a una sesión (anon, authenticated o PUBLIC) sobre `fn`? Con o sin esquema y lista de
// argumentos, por ALL FUNCTIONS/ROUTINES IN SCHEMA public, o con un GRANT dinámico sobre UNA FUNCIÓN
// (format('GRANT EXECUTE ON FUNCTION %s …')). Un GRANT dinámico de otra cosa (p. ej. el de columnas de
// preguntas de #186) no cuenta: antes lo marcaba cualquier archivo que solo nombrara la función.
const A_SESION = String.raw`\bto\s+[^;]*\b(anon|authenticated|public)\b`
const reabre = (sql: string, fn: string) => {
  const n = normal(sql)
  return new RegExp(String.raw`grant\s[^;]*?\bon\s+((all\s+(functions|routines)\s+in\s+schema\s+public)|((function|routine)\s+(public\.)?${fn}\b))[^;]*?` + A_SESION).test(n)
    || (n.includes(fn) && new RegExp(String.raw`grant\s+(execute|all(\s+privileges)?)\s+on\s+(function|routine)\s+%[si][^;']*` + A_SESION).test(n))
}
const crea = (sql: string, fn: string) => (normal(sql).match(new RegExp(String.raw`create\s+(or\s+replace\s+)?function\s+(public\.)?${fn}\s*\(`, 'g')) ?? []).length
const guardia = (sql: string) => {
  const i = sql.indexOf('CREATE OR REPLACE FUNCTION public.calendario_pagos_autorizado()')
  expect(i).toBeGreaterThanOrEqual(0)
  return sql.slice(i, sql.indexOf('$$;', i) > 0 ? sql.indexOf('$$;', i) : sql.indexOf('$$\n$guarda$', i))
}

test('1. API: toda acción que no sea «pagar» pide verifyAdmin, antes del service role', () => {
  const t = sinComentariosTs(leer('src', 'app', 'api', 'admin', 'cobranza', '[alumnoId]', 'route.ts'))
  expect(t).toContain("import { verifyAdmin, verifyStaff } from '@/lib/supabase/verify-admin'")
  const post = t.slice(t.indexOf('export async function POST'))
  // El prólogo EXACTO: sesión → staff → cuerpo → guarda por acción → service role, sin nada en medio.
  expect(post).toContain(`  const denied = await verifyStaff(supabase, user.id)
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const accion = String(body.accion ?? '')
  if (accion !== 'pagar') {
    const soloAdmin = await verifyAdmin(supabase, user.id)
    if (soloAdmin) return soloAdmin
  }
  const admin = createAdminClient()
`)
  expect(post.match(/body\.accion/g)?.length).toBe(1)
  const iStaff = post.indexOf('const denied = await verifyStaff(supabase, user.id)')
  const iAdmin = post.indexOf("if (accion !== 'pagar') {\n    const soloAdmin = await verifyAdmin(supabase, user.id)\n    if (soloAdmin) return soloAdmin\n  }")
  expect(iStaff).toBeGreaterThan(0)
  expect(iAdmin).toBeGreaterThan(iStaff)
  // Nada del service role antes de la guarda por acción.
  expect(post.indexOf('createAdminClient()')).toBeGreaterThan(iAdmin)
  expect(post.indexOf('admin.rpc(')).toBeGreaterThan(iAdmin)
  // Una sola excepción, y es 'pagar': ninguna otra acción se salta la guarda.
  expect(post.match(/accion !== '/g)?.length).toBe(1)
  expect(post.match(/verifyAdmin\(/g)?.length).toBe(1)
  // Toda rama por acción va DESPUÉS de la guarda.
  for (const m of post.matchAll(/accion === '/g)) expect(m.index!).toBeGreaterThan(iAdmin)
  // La rama 'pagar' (la única del secretario) solo registra la cuota: nada de regenerar ni condonar por ahí.
  const pagar = post.slice(post.indexOf("if (accion === 'pagar') {"), post.indexOf("if (accion === 'condonar') {"))
  expect(pagar.match(/\.rpc\(/g)).toEqual(['.rpc('])
  expect(pagar).toContain("admin.rpc('registrar_cuota_semanal'")
  for (const x of ['generarCalendarioSemanal(', 'sincronizarPlanSemanal(', 'condonar_semana', 'generar_calendario_']) expect(pagar, x).not.toContain(x)
  // Las cuatro acciones siguen existiendo y cada una llama a su función.
  for (const [accion, fn] of [['pagar', 'registrar_cuota_semanal'], ['condonar', 'condonar_semana'],
    ['regenerar', 'generar_calendario_por_nivel'], ['plan_a_medida', 'generar_calendario_pagos']]) {
    const i = post.indexOf(`if (accion === '${accion}') {`)
    expect(i, accion).toBeGreaterThan(iAdmin)
    expect(post.indexOf(`admin.rpc('${fn}'`, i), fn).toBeGreaterThan(i)
  }
  // El GET del calendario sigue siendo del personal.
  const get = t.slice(t.indexOf('export async function GET'), t.indexOf('export async function POST'))
  expect(get).toContain('const denied = await verifyStaff(supabase, user.id)')
  expect(get).not.toContain('verifyAdmin(')
})

test('2. La lista le dice a la pantalla el rol del visor, cayendo cerrado', () => {
  const t = sinComentariosTs(leer('src', 'app', 'api', 'admin', 'cobranza', 'route.ts'))
  expect(t).toContain("const viewerRol = (await getUserRol(supabase, user.id)) === 'ADMIN' ? 'ADMIN' : 'SECRETARIO'")
  expect(t).toContain('viewer_rol: viewerRol,')
  expect(t.indexOf('const viewerRol')).toBeGreaterThan(t.indexOf('const denied = await verifyStaff(supabase, user.id)'))
})

test('3. Pantalla: Condonar y Regenerar solo con viewer_rol ADMIN; «Marcar pagada» para todo el personal', () => {
  const t = sinComentariosTs(leer('src', 'app', '(dashboard)', 'admin', 'cobranza', 'page.tsx'))
  expect(t).toContain('const [esAdmin, setEsAdmin] = useState(false)')
  expect(t).toContain("setEsAdmin(d.viewer_rol === 'ADMIN')")
  const iRegen = t.indexOf('Regenerar calendario\n')
  expect(t.lastIndexOf('{esAdmin && <button', iRegen)).toBeGreaterThan(t.lastIndexOf('</p>', iRegen))
  const iCond = t.indexOf("{s.estado === 'condonado' ? 'Quitar condonación' : 'Condonar'}")
  expect(t.lastIndexOf("{esAdmin && s.estado !== 'pagado' && (", iCond)).toBeGreaterThan(t.indexOf('Marcar pagada'))
  // «Marcar pagada» no depende del rol.
  const iPagar = t.indexOf('Marcar pagada')
  const bloquePagar = t.slice(t.lastIndexOf("{s.estado !== 'pagado' && (", iPagar), iPagar)
  expect(bloquePagar).not.toContain('esAdmin')
  expect(t.match(/esAdmin &&/g)?.length).toBe(2)
})

test('4. Migración D22b: guardia con es_admin(), EXECUTE solo a service_role en todas las firmas, epílogo', () => {
  const sql = leer('supabase', 'migrations', MIG)
  const s = sinComentariosSql(sql)
  expect(s).toMatch(/^BEGIN;/m)
  expect(s).toMatch(/^COMMIT;/m)
  expect(s).toContain("NOTIFY pgrst, 'reload schema';")
  // Sin cobro semanal: avisa y sale; con él a medias: aborta.
  expect(s).toContain("IF to_regprocedure('public.calendario_pagos_autorizado()') IS NULL THEN")
  // Preflight S2.
  expect(s).toContain("p.prosecdef AND p.prosrc ~* 'lower\\s*\\(\\s*rol\\s*\\)'")
  // Guardia: es_admin(), nunca es_staff().
  const g = sinComentariosSql(guardia(sql))
  expect(g).toContain('RETURN public.es_admin();')
  expect(g).not.toMatch(/es_staff\s*\(/)
  // Las cuatro, por NOMBRE (todas sus sobrecargas).
  expect(s).toContain("FOREACH v_fn IN ARRAY ARRAY['registrar_cuota_semanal', 'condonar_semana',\n                               'generar_calendario_pagos', 'generar_calendario_por_nivel'] LOOP")
  expect(s).toContain("WHERE n.nspname = 'public' AND p.proname = v_fn")
  expect(s).toContain("EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_firma);")
  expect(s).toContain("EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_firma);")
  // Ningún GRANT a anon o authenticated en todo el archivo.
  expect(s).not.toMatch(/GRANT[^;]*\b(anon|authenticated)\b/i)
  // Epílogo: comprueba el privilegio real y el cuerpo de la guardia.
  expect(s).toContain("AND has_function_privilege(r.rol, p.oid, 'EXECUTE')")
  expect(s).toContain("p.prosrc ~ 'es_staff\\s*\\(' OR p.prosrc !~ 'es_admin\\s*\\('")
})

test('5. Fuentes: periodicidad y scripts/schema.sql nacen cerradas, con la MISMA guardia que la migración', () => {
  const mig = guardia(leer('supabase', 'migrations', MIG)).trim()
  for (const f of [['supabase', 'migrations', PERIODICIDAD], ['scripts', 'schema.sql']]) {
    const sql = leer(...f)
    const nombre = f.join('/')
    expect(guardia(sql).trim(), nombre).toBe(mig)
    for (const firma of FIRMAS) {
      expect(sql, `${nombre}: ${firma}`).toContain(
        `REVOKE ALL ON FUNCTION public.${firma} FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.${firma} TO service_role;`)
    }
    for (const fn of FUNCIONES) {
      expect(reabre(sql, fn), `${nombre}: ${fn} con EXECUTE para una sesión`).toBe(false)
      // Una sola definición (una sobrecarga nueva nace con EXECUTE de fábrica: tendría que traer su REVOKE).
      expect(crea(sql, fn), `${nombre}: definiciones de ${fn}`).toBe(1)
    }
    expect(crea(sql, 'calendario_pagos_autorizado'), `${nombre}: definiciones de la guardia`).toBe(1)
  }
})

test('6. Ninguna otra migración reabre, crea ni redefine las cuatro o la guardia', () => {
  const dir = join('supabase', 'migrations')
  const fuentes = [...readdirSync(join(raiz, dir)).filter(f => f.endsWith('.sql')).map(f => join(dir, f)),
    join('scripts', 'schema.sql'), join('supabase', 'schema.sql')]
  for (const f of fuentes) {
    const sql = leer(f)
    const nombre = f.split(/[\\/]/).pop()!
    for (const fn of FUNCIONES) {
      expect(reabre(sql, fn), `${f}: EXECUTE de ${fn} para una sesión`).toBe(false)
      if (crea(sql, fn)) expect([PERIODICIDAD, 'schema.sql'], `${f} crea ${fn}`).toContain(nombre)
    }
    if (crea(sql, 'calendario_pagos_autorizado')) expect([PERIODICIDAD, MIG, 'schema.sql'], `${f} redefine la guardia`).toContain(nombre)
  }
  // El detector sí ve las formas habituales de reabrir (que la prueba no sea vacía).
  for (const sql of [
    'GRANT EXECUTE ON FUNCTION public.condonar_semana TO authenticated;',
    'grant execute on function "public"."condonar_semana"(uuid, integer, uuid, text, boolean) to anon;',
    'GRANT EXECUTE ON FUNCTION condonar_semana(UUID) TO PUBLIC;',
    'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;',
    "EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', 'public.condonar_semana(uuid)');",
  ]) expect(reabre(sql, 'condonar_semana'), sql).toBe(true)
  expect(reabre('GRANT EXECUTE ON FUNCTION public.condonar_semana(UUID) TO service_role;', 'condonar_semana')).toBe(false)
  // Un GRANT dinámico de OTRA cosa en un archivo que nombra la función (el de columnas de preguntas de #186).
  expect(reabre("-- condonar_semana\nSELECT 1 FROM x WHERE f = 'condonar_semana'; EXECUTE format('GRANT SELECT (%s) ON public.preguntas TO authenticated', cols);", 'condonar_semana')).toBe(false)
  expect(crea('create function PUBLIC.Condonar_Semana (p uuid)', 'condonar_semana')).toBe(1)
})

test('7. La app nunca llama las cuatro con la sesión del usuario', () => {
  const archivos: string[] = []
  const recorrer = (d: string) => {
    for (const e of readdirSync(join(raiz, d), { withFileTypes: true })) {
      if (e.isDirectory()) recorrer(join(d, e.name))
      else if (/\.(ts|tsx)$/.test(e.name)) archivos.push(join(d, e.name))
    }
  }
  recorrer('src')
  let llamadas = 0
  for (const f of archivos) {
    const t = sinComentariosTs(readFileSync(join(raiz, f), 'utf8'))
    for (const fn of FUNCIONES) {
      // Toda llamada, con el cliente que sea, tiene que ser `admin.rpc(` (el service role).
      const todas = (t.match(new RegExp(String.raw`\.rpc\(\s*['"${'`'}]${fn}['"${'`'}]`, 'g')) ?? []).length
      const deAdmin = (t.match(new RegExp(String.raw`\badmin\.rpc\(\s*'${fn}'`, 'g')) ?? []).length
      expect(todas, `${f}: ${fn} con un cliente que no es el service role`).toBe(deAdmin)
      llamadas += deAdmin
    }
    // Los ayudantes de plan-semanal tragan el error (nunca lanzan): con la sesión fallarían en silencio.
    if (!f.endsWith('plan-semanal.ts')) {
      for (const m of t.matchAll(/(generarCalendarioSemanal|sincronizarPlanSemanal)\(\s*(\w+)/g)) {
        expect(m[2], `${f}: ${m[1]} con «${m[2]}»`).toBe('admin')
        expect(t, `${f}: «admin» no es el service role`).toContain('const admin = createAdminClient()')
      }
    }
  }
  // route.ts (pagar, condonar, regenerar, plan a medida) + plan-semanal.ts (alta y registro).
  expect(llamadas).toBe(5)
})

test('8. CHECK 25 después del 24: privilegio real de las cuatro y la guardia sin comentarios', () => {
  const check = leer('scripts', 'post-setup-check.sql')
  const i24 = check.indexOf('─── CHECK 24'), i25 = check.indexOf('─── CHECK 25')
  expect(i24).toBeGreaterThan(0)
  expect(i25).toBeGreaterThan(i24)
  const c25 = check.slice(i25)
  expect(c25).toContain("to_regprocedure('public.calendario_pagos_autorizado()')")
  expect(c25).toContain("FROM unnest(ARRAY['registrar_cuota_semanal', 'condonar_semana',\n                      'generar_calendario_pagos', 'generar_calendario_por_nivel']) AS fn")
  expect(c25).toContain("AND has_function_privilege(r.rol, p.oid, 'EXECUTE')")
  expect(c25).toContain("regexp_replace(regexp_replace(p.prosrc, '/\\*.*?\\*/', '', 'g'), '--[^\\n]*', '', 'g') AS cuerpo")
  expect(c25).toContain("cuerpo ~ 'es_admin\\s*\\(' AND cuerpo !~ 'es_staff\\s*\\('")
  expect(c25).toContain(`supabase/migrations/${MIG} (idempotente)`)
  expect(c25).toContain('✅ OK (esta base no tiene el calendario semanal: no aplica)')
})

test('9. SETUP: fila 21 de 7bis, después de D20e, con el CHECK 25', () => {
  const setup = leer('SETUP.md')
  const i20 = setup.indexOf('   | 20 | `20260928140000_d20e_conflicto_pt409.sql`')
  const i21 = setup.indexOf(`   | 21 | \`${MIG}\``)
  expect(i20).toBeGreaterThan(0)
  expect(i21).toBeGreaterThan(i20)
  const fila = setup.slice(i21, setup.indexOf('\n', i21))
  expect(fila).toContain('**Aplica a toda base con cobro semanal**')
  expect(fila).toContain('(CHECK 25)')
  expect(readdirSync(join(raiz, 'supabase', 'migrations'))).toContain(MIG)
})
