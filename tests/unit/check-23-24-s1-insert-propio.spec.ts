import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * CHECK 23 (S1: el alta nunca toma el rol del metadata) y CHECK 24 (#185: nadie
 * inserta con su sesión en usuarios ni en documentos_alumno), la fila del paso 7
 * de SETUP para la migración de #185 y la regla de conexión del Bug 228. Pruebas
 * de TEXTO: la conducta de los dos CHECK (12 mutaciones, cliente viejo y cadena
 * completa) se probó en un Postgres de pruebas.
 */
const raiz = process.cwd()
const leer = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n')
const CHECK = leer('scripts', 'post-setup-check.sql')
const SETUP = leer('SETUP.md')
const c23 = CHECK.slice(CHECK.indexOf('─── CHECK 23'), CHECK.indexOf('─── CHECK 24'))
const c24 = CHECK.slice(CHECK.indexOf('─── CHECK 24'))

test('1. CHECK 23 y 24 van después del 22, en orden, y no escriben nada', () => {
  const i22 = CHECK.indexOf('─── CHECK 22')
  expect(i22).toBeGreaterThan(0)
  expect(CHECK.indexOf('─── CHECK 23')).toBeGreaterThan(i22)
  expect(CHECK.indexOf('─── CHECK 24')).toBeGreaterThan(CHECK.indexOf('─── CHECK 23'))
  // El post-setup solo lee: se corre también contra clientes en producción.
  expect(CHECK).not.toMatch(/^\s*(insert|update|delete|create|drop|alter|grant|revoke|truncate)\b/im)
})

test('2. CHECK 23 lee el cuerpo SIN comentarios (el de S1 menciona el metadata en uno) y pide el trigger', () => {
  expect(c23).toContain("to_regprocedure('public.handle_new_user()')")
  expect(c23).toContain("regexp_replace(regexp_replace(p.prosrc, '/\\*.*?\\*/', '', 'g'), '--[^\\n]*', '', 'g') AS cuerpo")
  // ->>, -> y #>> '{rol}', con o sin espacios, con cast ::jsonb o entre paréntesis, y jsonb_extract_path(_text).
  expect(c23).toContain("cuerpo ~* 'raw_user_meta_data\\s*\\)?\\s*(::\\s*jsonb\\s*\\)?\\s*)?(->>?|#>>?)\\s*''\\{?rol\\}?'''")
  expect(c23).toContain("OR cuerpo ~* 'jsonb_extract_path(_text)?\\s*\\(\\s*(new\\s*\\.\\s*)?raw_user_meta_data\\s*(::\\s*jsonb\\s*)?,\\s*''rol'''")
  expect(c23).toContain("cuerpo ~ '''alumno'''")
  // Que se DISPARE en un signUp: modo origen ('O'/'A'; 'R' solo corre en réplica), de fila y en INSERT.
  expect(c23).toMatch(/t\.tgrelid = to_regclass\('auth\.users'\) AND NOT t\.tgisinternal\s+AND t\.tgfoid = f\.oid AND t\.tgenabled IN \('O', 'A'\)\s+AND \(t\.tgtype & 1\) = 1 AND \(t\.tgtype & 4\) = 4\)/)
  expect(c23).not.toContain("tgenabled <> 'D'")
  // No el ILIKE crudo que marcaba como vulnerable a una base ya corregida.
  expect(c23).not.toContain("ILIKE '%raw_user_meta_data%rol%'")
  expect(c23).toContain('supabase/migrations/20260729120000_fix_s1_rol_alta.sql')
})

test('3. CHECK 24: privilegio de tabla Y de columna, para anon y authenticated, y la política sin auth.uid()', () => {
  expect(c24).toContain("has_any_column_privilege(r.rol, 'public.' || t.tabla, 'INSERT')")
  expect(c24).toContain("unnest(ARRAY['anon', 'authenticated'])")
  expect(c24).toContain("unnest(ARRAY['usuarios', 'documentos_alumno'])")
  expect(c24).toContain("tablename = 'usuarios' AND cmd IN ('INSERT', 'ALL')")
  expect(c24).toContain("~* 'auth\\.uid\\(\\)'")
  expect(c24).toContain('supabase/migrations/20260924120000_usuarios_sin_insert_propio.sql (idempotente)')
})

test('4. SETUP: la migración de #185 es el 4º parche del paso 7 (toda base, no solo Solo-Cursos)', () => {
  const paso7 = SETUP.slice(SETUP.indexOf('7. **Parches de seguridad (obligatorios)**'), SETUP.indexOf('7bis.'))
  expect(paso7).toContain('correr los cuatro, en este orden:')
  const orden = [...paso7.matchAll(/^ {3}- `supabase\/migrations\/(\d{14}_[a-z0-9_]+\.sql)`/gm)].map(m => m[1])
  expect(orden).toEqual([
    '20260729120000_fix_s1_rol_alta.sql',
    '20260729121000_fix_s2_es_admin.sql',
    '20260729122000_fix_portadas_storage_policy.sql',
    '20260924120000_usuarios_sin_insert_propio.sql',
  ])
  expect(paso7).toContain('Lo vigila el CHECK 23')
  expect(paso7).toContain('Lo vigila el CHECK 24.')
  // Cada archivo nombrado existe.
  const migraciones = readdirSync(join(raiz, 'supabase', 'migrations'))
  for (const f of orden) expect(migraciones, f).toContain(f)
  // No se duplica en la tabla de 7bis.
  expect(SETUP.slice(SETUP.indexOf('7bis.'))).not.toContain('20260924120000')
})

test('5. regla de conexión (Bug 228): pooler en modo sesión sí; nunca el 6543', () => {
  expect(SETUP).toContain('Nunca el 6543')
  expect(SETUP).not.toContain('nunca el pooler (6543)')
  // Los scripts de retrofit a los que mandan SETUP y el CHECK 23, y los ejemplos de psql.
  for (const partes of [['scripts', 'fix-s1-s2-roles.sql'], ['scripts', 'fix-escalada-rol.sql'], ['scripts', 'README.md'], ['scripts', 'migrations', '2026-05-add-opcion-d-quiz-semana.sql']]) {
    const t = leer(...partes)
    const nombre = partes.join('/')
    expect(t, nombre).not.toMatch(/NUNCA el pooler(?! 6543)/i)
    expect(t, nombre).not.toMatch(/pooler\.supabase\.com:6543/)
    expect(t, nombre).toMatch(/nunca el 6543/i)
  }
  // Solo-Cursos: los cuatro parches del paso 7, no tres.
  const solo = leer('INSTRUCCIONES-SOLO-CURSOS.md')
  expect(solo).toContain('los cuatro del paso 7 de `SETUP.md`')
  expect(solo).not.toContain('| Parches de seguridad | los tres `20260729*` |')
  for (const f of ['20260924120000_usuarios_sin_insert_propio.sql', '20260910130000_periodicidad_semanal.sql']) {
    const m = leer('supabase', 'migrations', f)
    expect(m, f).not.toMatch(/nunca el pooler[).]/i)
    expect(m, f).toContain('nunca el 6543 (Bug 228)')
  }
})

test('6. la consulta de detección de fix-s1-s2-roles.sql quita los comentarios antes de buscar', () => {
  const fix = leer('scripts', 'fix-s1-s2-roles.sql')
  expect(fix).not.toContain("AND p.prosrc ILIKE '%raw_user_meta_data%rol%';")
  expect(fix).toContain("--  CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(p.prosrc, '/\\*.*?\\*/', '', 'g'), '--[^\\n]*', '', 'g') AS cuerpo) c")
  expect(fix).toContain("--      OR c.cuerpo ~* 'jsonb_extract_path(_text)?")
})
