import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Bloque D · D20g — re-correr rol_secretario (fila 2 de 7bis) ya no revierte S2.
 *
 * SETUP.md corre el paso 7 (fix S2: es_admin()/es_staff() con LOWER(rol) y
 * SET search_path = public) ANTES de la tabla 7bis, cuya fila 2 es
 * 20260716130000_rol_secretario.sql. Esa migración recreaba es_staff() SIN
 * LOWER y SIN search_path: revertía S2 en silencio y la D7b (fila 15) abortaba
 * en su preflight («public.es_staff() falta o no normaliza el rol (LOWER)»).
 * En orden de timestamps no pasa (S2 es posterior), por eso la cadena scratch
 * nunca lo vio. La prueba real, en el orden de SETUP, está en el cluster
 * scratch (prueba-d20g.sh).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/--[^\n]*/g, '')
const ROL = 'supabase/migrations/20260716130000_rol_secretario.sql'
const S2 = 'supabase/migrations/20260729121000_fix_s2_es_admin.sql'

/** Cada CREATE [OR REPLACE] FUNCTION public.<fn>() … $$; del archivo, con los espacios colapsados. */
function definiciones(sql: string, fn: 'es_admin' | 'es_staff'): string[] {
  const re = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${fn}\\(\\)[\\s\\S]*?\\$\\$[\\s\\S]*?\\$\\$;`, 'g')
  return (sinComentarios(sql).match(re) ?? []).map(d => d.replace(/\s+/g, ' ').trim())
}

/** Para comparar SQL escrito a mano con el de pg_dump: sin espacios ni paréntesis. */
const plano = (s: string) => s.replace(/[\s()]+/g, '')

test('0. la premisa: SETUP corre S2 en el paso 7 y rol_secretario DESPUÉS (fila 2 de 7bis)', () => {
  const setup = leer('SETUP.md')
  const paso7 = setup.indexOf('7. **Parches de seguridad (obligatorios)**')
  const s2 = setup.indexOf('`supabase/migrations/20260729121000_fix_s2_es_admin.sql`', paso7)
  const fila2 = setup.indexOf('| 2 | `20260716130000_rol_secretario.sql` |')
  expect(paso7).toBeGreaterThan(0)
  expect(s2).toBeGreaterThan(paso7)
  expect(fila2).toBeGreaterThan(s2)
})

test('1. rol_secretario define es_staff() EXACTAMENTE como S2 (LOWER + search_path)', () => {
  const rol = definiciones(leer(ROL), 'es_staff')
  const s2 = definiciones(leer(S2), 'es_staff')
  expect(rol).toHaveLength(1)
  expect(s2).toHaveLength(1)
  expect(rol[0]).toBe(s2[0])
  expect(rol[0]).toContain('LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$')
  expect(rol[0]).toContain("WHERE id = auth.uid() AND LOWER(rol) IN ('admin', 'secretario')")
  // es_admin() no se toca aquí (la endurece S2).
  expect(definiciones(leer(ROL), 'es_admin')).toEqual([])
})

test('2. rol_secretario otorga los mismos GRANT que S2', () => {
  const grant = 'GRANT EXECUTE ON FUNCTION public.es_staff() TO anon, authenticated;'
  expect(sinComentarios(leer(S2))).toContain(grant)
  expect(sinComentarios(leer(ROL))).toContain(grant)
})

test('3. ninguna migración ni scripts/schema.sql define es_admin()/es_staff() sin LOWER ni search_path', () => {
  // supabase/schema.sql (instalador de Solo-Cursos) todavía trae las versiones
  // previas a S2 y queda FUERA a propósito: SIEMPRE lo sigue el paso 7, que las
  // reemplaza, y nada lo corre después.
  const archivos = [
    ...readdirSync(join(process.cwd(), 'supabase', 'migrations')).filter(f => f.endsWith('.sql')).map(f => `supabase/migrations/${f}`),
    'scripts/schema.sql',
  ]
  const sinS2: string[] = []
  let vistas = 0
  for (const f of archivos) {
    for (const fn of ['es_admin', 'es_staff'] as const) {
      for (const d of definiciones(leer(f), fn)) {
        vistas++
        if (!d.includes('LOWER(rol)') || !/SET search_path (=|TO) '?public'?/.test(d) || !d.includes('SECURITY DEFINER')) {
          sinS2.push(`${f} → ${fn}()`)
        }
      }
    }
  }
  expect(sinS2).toEqual([])
  // S2 (las dos) + rol_secretario (es_staff) + scripts/schema.sql (las dos).
  expect(vistas).toBe(5)
})

test('4. lo demás que toca rol_secretario ya es el estado final (scripts/schema.sql): nada que revertir', () => {
  const rol = sinComentarios(leer(ROL))
  const schema = sinComentarios(leer('scripts/schema.sql'))
  // CHECK de usuarios.rol: los mismos tres roles.
  const roles = "ARRAY['alumno'::text, 'admin'::text, 'secretario'::text]"
  expect(rol).toContain(`ADD CONSTRAINT usuarios_rol_check\n  CHECK (rol = ANY (${roles}));`)
  expect(schema).toContain(`CONSTRAINT usuarios_rol_check CHECK ((rol = ANY (${roles})))`)
  // «usuarios: ver propio perfil»: la propia fila o el personal.
  const perfil = (s: string) => plano(s.match(/CREATE POLICY "usuarios: ver propio perfil"[^;]*;/)?.[0] ?? '')
  expect(perfil(rol)).not.toBe('')
  expect(perfil(rol)).toBe(perfil(schema))
  // Políticas de pagos: el mismo bloque condicional (SELECT propio o admin con techo desde D22c,
  // INSERT staff y UPDATE/DELETE admin, inertes para PostgREST sin GRANT).
  const bloquePagos = (s: string) => {
    const ini = s.indexOf("IF to_regclass('public.pagos') IS NOT NULL THEN\n    DROP POLICY IF EXISTS \"pagos: ver propios\"")
    return ini < 0 ? '' : plano(s.slice(ini, s.indexOf('END IF;', ini)))
  }
  expect(bloquePagos(rol)).toContain('CREATEPOLICY"pagos:staffregistra"ONpublic.pagosFORINSERTWITHCHECKpublic.es_staff;')
  expect(bloquePagos(rol)).toBe(bloquePagos(schema))
})

test('5. el guardián: CHECK 22 revisa LOWER, search_path y SECURITY DEFINER de las dos; SETUP lo nombra', () => {
  const check = leer('scripts/post-setup-check.sql')
  expect(check.indexOf('─── CHECK 22')).toBeGreaterThan(check.indexOf('─── CHECK 21'))
  const c22 = check.slice(check.indexOf('─── CHECK 22'))
  expect(c22).toContain("FROM unnest(ARRAY['es_admin()', 'es_staff()']) AS f")
  // El mismo patrón que el preflight de D7b: lo que el CHECK marca es lo que D7b rechaza.
  expect(c22).toContain("p.prosrc ~* 'lower\\s*\\(\\s*rol\\s*\\)'")
  expect(leer('supabase/migrations/20260927120000_d7b_secretario_abre_cursos.sql')).toContain("!~* 'lower\\s*\\(\\s*rol\\s*\\)'")
  expect(c22).toContain("c LIKE 'search_path=public%'")
  expect(c22).toContain('p.prosecdef')
  expect(c22).toContain('❌ S2 REVERTIDO')
  expect(c22).toContain('supabase/migrations/20260729121000_fix_s2_es_admin.sql')
  // Toda base (sin la condición de cursos) y sin casts constantes que revienten si falta.
  expect(c22).not.toContain("'::regprocedure")
  expect(c22).not.toContain('hay_cursos')
  const setup = leer('SETUP.md')
  expect(setup).toContain('| 2 | `20260716130000_rol_secretario.sql` | rol acotado. Su `es_staff()` es la misma de S2')
  expect(setup).toContain('(**D20g**, CHECK 22)')
})
