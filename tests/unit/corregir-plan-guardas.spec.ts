import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MENSAJE_SIN_CAMBIOS, MENSAJES_CANDADO } from '@/lib/corregir-plan'

/**
 * Bug 231 — guardas de «Corregir plan de estudio» (subidas desde MEDERI).
 *
 *  1. 'sin_cambios': el mismo plan NO pasa (antes borraba notas y dejaba un
 *     evento vacío en la bitácora). SQL lo detecta tras el FOR UPDATE y antes
 *     de candados/escrituras; la ruta lo traduce a 400, no a 409.
 *  2. La ruta exige que el id de la URL sea un ALUMNO antes de la RPC.
 *  3. alumno_plan_eventos: REVOKE ALL a authenticated antes del GRANT SELECT.
 *
 * La migración vieja (20260817120000) no se edita: la corrige una NUEVA.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')

const MIGRACION = 'supabase/migrations/20260925120000_corregir_plan_guardas.sql'
const RUTA_POST = 'src/app/api/admin/alumnos/[id]/corregir-plan/route.ts'
const SCHEMAS   = ['supabase/schema.sql', 'scripts/schema.sql']

const funcionCorregir = (sql: string) =>
  sql.match(/CREATE OR REPLACE FUNCTION public\.corregir_plan_estudio\([\s\S]*?\$\$;/)?.[0] ?? ''

function verificarSinCambios(fn: string, origen: string) {
  expect(fn, `${origen}: sin corregir_plan_estudio`).not.toBe('')
  const posLock      = fn.indexOf('FOR UPDATE')
  const posSin       = fn.indexOf("'sin_cambios'")
  const posCandados  = fn.indexOf('candado_corregir_plan(p_alumno)')
  const posDelete    = fn.indexOf('DELETE FROM public.notas_alumno')
  const posInsert    = fn.indexOf('INSERT INTO public.alumno_plan_eventos')
  expect(posSin, origen).toBeGreaterThan(posLock)
  expect(posCandados, origen).toBeGreaterThan(posSin)
  expect(posDelete, origen).toBeGreaterThan(posSin)
  expect(posInsert, origen).toBeGreaterThan(posSin)
  // NULL-safe: carrera es NULL fuera de licenciatura
  for (const campo of ['nivel', 'carrera', 'modalidad']) {
    expect(fn, `${origen}: ${campo}`).toMatch(new RegExp(`v_antes\\.${campo}\\s+IS NOT DISTINCT FROM p_${campo}`))
  }
}

test('SQL: sin_cambios va tras el FOR UPDATE y antes de candados, borrado de notas y bitácora', () => {
  verificarSinCambios(funcionCorregir(leer(MIGRACION)), MIGRACION)
  for (const s of SCHEMAS) verificarSinCambios(funcionCorregir(leer(s)), s)
})

test('SQL: la migración nueva es un solo bloque, idempotente y re-cierra EXECUTE (Bug 77)', () => {
  const sql = leer(MIGRACION)
  expect(sql.match(/^BEGIN;$/gm)?.length).toBe(1)
  expect(sql.match(/^COMMIT;$/gm)?.length).toBe(1)
  expect(sql).not.toMatch(/CREATE TABLE(?! IF NOT EXISTS)/)
  expect(sql).not.toMatch(/\b(DROP TABLE|DELETE FROM public\.(?!notas_alumno)|TRUNCATE)\b/)
  expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.corregir_plan_estudio\([^)]*\)\s+FROM PUBLIC, anon, authenticated/)
  expect(sql).toContain('SECURITY DEFINER')
  expect(sql).toContain('SET search_path = public, pg_temp')
})

test('SQL: la bitácora hace REVOKE ALL a authenticated ANTES del GRANT SELECT (migración y schemas)', () => {
  for (const archivo of [MIGRACION, ...SCHEMAS]) {
    const sql = leer(archivo)
    const posRevoke = sql.indexOf("REVOKE ALL ON public.alumno_plan_eventos FROM authenticated")
    const posGrant  = sql.indexOf("GRANT SELECT ON public.alumno_plan_eventos TO authenticated")
    expect(posRevoke, archivo).toBeGreaterThan(-1)
    expect(posGrant, archivo).toBeGreaterThan(posRevoke)
  }
})

test('ruta: sesión → verifyAdmin → guarda de alumno → RPC; sin_cambios responde 400', () => {
  const src = leer(RUTA_POST)
  const posVerify  = src.indexOf('await verifyAdmin(supabase')
  const posUsuario = src.indexOf("from('usuarios').select('id, rol').eq('id', params.id)")
  const posAlumno  = src.indexOf("from('alumnos').select('id').eq('id', params.id)")
  const posRol     = src.indexOf("!== 'alumno'")
  const posRpc     = src.indexOf("rpc('corregir_plan_estudio'")
  expect(posVerify).toBeGreaterThan(-1)
  expect(posUsuario).toBeGreaterThan(posVerify)
  expect(posAlumno).toBeGreaterThan(posVerify)
  expect(posRol).toBeGreaterThan(posUsuario)
  expect(posRpc).toBeGreaterThan(posRol)
  expect(src).toContain('{ status: 403 }')
  const bloque = src.slice(src.indexOf("resultado.candado === 'sin_cambios'"))
  expect(src).toContain("resultado.candado === 'sin_cambios'")
  expect(bloque.slice(0, 200)).toContain('{ status: 400 }')
})

test('sin_cambios tiene su propio mensaje y NO es un candado', () => {
  expect(MENSAJE_SIN_CAMBIOS).toContain('mismo')
  expect(Object.keys(MENSAJES_CANDADO)).not.toContain('sin_cambios')
})
