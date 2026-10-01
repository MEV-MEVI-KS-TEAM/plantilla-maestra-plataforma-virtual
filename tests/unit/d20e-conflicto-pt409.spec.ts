import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { PostgrestError } from '@supabase/supabase-js'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

/**
 * Bloque D · D20e — «alguien lo cambió en medio» responde 409 y no se cuelga.
 *
 * Con RAISE … USING ERRCODE = '40001' (serialization_failure) PostgREST cree
 * que la falla es pasajera y reintenta la transacción SIN FIN (documentado por
 * Supabase; se arregla hasta PostgREST 16): el doble clic, la otra pestaña o el
 * precio que cambió colgaban la petición. Las funciones usan PT409, que
 * PostgREST traduce a HTTP 409. La migración reescribe las instaladas; el
 * comportamiento real está en el cluster scratch (prueba-d20e.sh).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const MIG = '20260928140000_d20e_conflicto_pt409.sql'

test('1. ninguna migración ni instalador lanza 40001', () => {
  const archivos = [
    ...readdirSync(join(process.cwd(), 'supabase', 'migrations')).filter(f => f.endsWith('.sql')).map(f => `supabase/migrations/${f}`),
    'scripts/schema.sql', 'supabase/schema.sql',
  ]
  // Sin comentarios (los encabezados cuentan la historia del 40001).
  const con40001 = archivos.filter(f => /ERRCODE\s*=\s*'40001'/.test(leer(f).replace(/--[^\n]*/g, '')))
  expect(con40001).toEqual([])
  // Y los conflictos siguen existiendo, ahora con PT409.
  for (const f of ['20260926120000_c3b_acceso_total_cursos.sql', '20260927130000_d8_activar_segun_ficha.sql', '20260927140000_d16_curso_cobrar.sql']) {
    expect(leer(`supabase/migrations/${f}`), f).toContain("USING ERRCODE = 'PT409'")
  }
})

test('2. la migración: reescribe las instaladas, en transacción, idempotente, con NOTIFY', () => {
  const sql = leer(`supabase/migrations/${MIG}`)
  const cuerpo = sql.replace(/--[^\n]*/g, '')
  expect(cuerpo.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(cuerpo.trimEnd().endsWith('COMMIT;')).toBe(true)
  expect(cuerpo).toContain("AND strpos(p.prosrc, 'ERRCODE = ''40001''') > 0")
  expect(cuerpo).toContain("EXECUTE replace(r.def, 'ERRCODE = ''40001''', 'ERRCODE = ''PT409''');")
  expect(cuerpo).toContain("n.nspname = 'public'")
  expect(cuerpo).toContain("NOTIFY pgrst, 'reload schema';")
  expect(cuerpo).not.toContain("'::regprocedure")
})

test('3. la app traduce PT409 a 409 (y 40001, por compatibilidad)', () => {
  const e = (code: string) => ({ code, message: 'La inscripción ya tiene 2 meses abiertos (esperabas 1).', details: '', hint: '' }) as unknown as PostgrestError
  expect(errorDeRpcCurso(e('PT409'))).toEqual({ status: 409, mensaje: 'La inscripción ya tiene 2 meses abiertos (esperabas 1).' })
  expect(errorDeRpcCurso(e('40001')).status).toBe(409)
})

test('4. el guardián: CHECK 21 para toda base y la fila de SETUP', () => {
  const check = leer('scripts/post-setup-check.sql')
  // Solo el CHECK 21 (hasta el 22): los de módulo que vengan después sí miran hay_cursos.
  const c21 = check.slice(check.indexOf('CHECK 21'), check.indexOf('─── CHECK 22'))
  expect(c21).toContain("AND strpos(p.prosrc, 'ERRCODE = ''40001''') > 0")
  // Los mismos filtros que la migración: lo que el CHECK marca es lo que D20e arregla.
  expect(c21).toContain("AND p.prokind = 'f'")
  expect(c21).toContain("AND p.prolang = (SELECT l.oid FROM pg_language l WHERE l.lanname = 'plpgsql')")
  expect(c21).not.toContain("'::regprocedure")
  expect(c21).not.toContain('hay_cursos')
  expect(leer('SETUP.md')).toContain(`| 20 | \`${MIG}\` | **D20e**`)
})
