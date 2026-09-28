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
const guardia = (sql: string) => {
  const i = sql.indexOf('CREATE OR REPLACE FUNCTION public.calendario_pagos_autorizado()')
  expect(i).toBeGreaterThanOrEqual(0)
  return sql.slice(i, sql.indexOf('$$;', i) > 0 ? sql.indexOf('$$;', i) : sql.indexOf('$$\n$guarda$', i))
}

test('1. API: toda acción que no sea «pagar» pide verifyAdmin, antes del service role', () => {
  const t = sinComentariosTs(leer('src', 'app', 'api', 'admin', 'cobranza', '[alumnoId]', 'route.ts'))
  expect(t).toContain("import { verifyAdmin, verifyStaff } from '@/lib/supabase/verify-admin'")
  const post = t.slice(t.indexOf('export async function POST'))
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
    const s = sinComentariosSql(sql)
    for (const fn of FUNCIONES) {
      expect(s, `${nombre}: ${fn} con GRANT a una sesión`).not.toMatch(new RegExp(`GRANT[^;]*FUNCTION public\\.${fn}\\([^;]*\\b(anon|authenticated)\\b`, 'i'))
    }
  }
})

test('6. Ninguna otra migración reabre las cuatro ni redefine la guardia', () => {
  const dir = join('supabase', 'migrations')
  for (const f of readdirSync(join(raiz, dir)).filter(f => f.endsWith('.sql'))) {
    const s = sinComentariosSql(leer(dir, f))
    for (const fn of FUNCIONES) {
      expect(s, `${f}: GRANT de ${fn} a una sesión`).not.toMatch(new RegExp(`GRANT[^;]*FUNCTION public\\.${fn}\\([^;]*\\b(anon|authenticated)\\b`, 'i'))
    }
    if (s.includes('FUNCTION public.calendario_pagos_autorizado()') && s.includes('CREATE OR REPLACE FUNCTION public.calendario_pagos_autorizado()')) {
      expect([PERIODICIDAD, MIG], f).toContain(f)
    }
  }
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
      expect(t, `${f}: ${fn} con la sesión`).not.toMatch(new RegExp(`supabase\\s*\\.rpc\\(\\s*'${fn}'`))
      llamadas += (t.match(new RegExp(`admin\\.rpc\\(\\s*'${fn}'`, 'g')) ?? []).length
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
