import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'

/**
 * Bloque B, B5 — el CHECK de `alumnos.modalidad` admite todos los planes que
 * la escuela vende (clase Bug 68: un id fuera del CHECK hace fallar el alta con
 * 23514 y la ruta borra el usuario de Auth que acababa de crear).
 *
 * Dos instaladores tienen que estar de acuerdo con config.ts:
 *   - scripts/schema.sql (el del onboarding: NO corre supabase/migrations);
 *   - la migración 20260925120000 (para las bases que ya existen).
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const MIGRACION = 'supabase/migrations/20260925120000_licenciatura_plan_6_meses.sql'
const sinComentariosSql = (s: string) => s.replace(/--.*$/gm, '')

/** Los ids que admite el CHECK de scripts/schema.sql. */
function idsDelInstalador(): string[] {
  const m = /CONSTRAINT alumnos_modalidad_check CHECK \(\(modalidad IS NULL OR modalidad = ANY \(ARRAY\[([^\]]+)\]\)\)\)/.exec(leer('scripts/schema.sql'))
  expect(m, 'no encontré alumnos_modalidad_check en scripts/schema.sql').not.toBeNull()
  return [...m![1].matchAll(/'([^']+)'::text/g)].map((x) => x[1])
}

/** Los ids canónicos que la migración garantiza (su `v_ids` inicial). */
function idsDeLaMigracion(): string[] {
  const m = /v_ids\s+text\[\] := ARRAY\[([^\]]+)\]/.exec(leer(MIGRACION))
  expect(m, 'no encontré v_ids en la migración').not.toBeNull()
  return [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

test('1. el instalador y la migración admiten los mismos ids, y los dos incluyen 6_meses_lic', () => {
  const instalador = idsDelInstalador()
  const migracion = idsDeLaMigracion()
  expect([...instalador].sort()).toEqual([...migracion].sort())
  expect(instalador).toContain('6_meses_lic')
  // Los 7 de la migración de licenciaturas (20260812) siguen ahí.
  for (const id of ['3_meses', '6_meses', '9_meses', '12_meses', '18_meses', '24_meses', '36_meses']) {
    expect(instalador, id).toContain(id)
  }
})

test('2. cada plan de config.ts (programa y licenciatura) cabe en los dos', () => {
  // En un clon con ids propios ('4_meses', 'acceso_completo', '_dip') su base
  // los admite por una migración propia que su scripts/schema.sql no refleja:
  // aquí se exige solo en la plantilla.
  test.skip(!ES_PLANTILLA, 'Los clones con ids propios los admiten por migración propia.')
  const cfg = CONFIG as unknown as {
    modalidades: ReadonlyArray<{ id: string }>
    licenciaturas?: { modalidades?: ReadonlyArray<{ id: string }> }
  }
  const ids = [...cfg.modalidades.map((m) => m.id), ...(cfg.licenciaturas?.modalidades ?? []).map((m) => m.id)]
  const instalador = idsDelInstalador()
  const migracion = idsDeLaMigracion()
  for (const id of ids) {
    expect(instalador, `${id} en scripts/schema.sql`).toContain(id)
    expect(migracion, `${id} en la migración`).toContain(id)
  }
})

test('3. duracion_meses del instalador: 6_meses_lic vale 6 (explícito) y el respaldo sigue en ELSE 6', () => {
  const schema = leer('scripts/schema.sql')
  const i = schema.indexOf('duracion_meses integer GENERATED ALWAYS AS (')
  expect(i).toBeGreaterThan(-1)
  const expr = schema.slice(i, schema.indexOf('END) STORED', i))
  expect(expr).toContain("WHEN '6_meses_lic'::text THEN 6")
  expect(expr).toMatch(/ELSE 6\s*$/)
})

test('4. la migración es la variante mínima: aditiva, por catálogo, fail-closed y atómica', () => {
  const sql = sinComentariosSql(leer(MIGRACION))
  // Atómica e idempotente.
  expect(sql).toMatch(/^\s*BEGIN;/m)
  expect(sql).toMatch(/^\s*COMMIT;\s*$/m)
  // No toca duracion_meses: el ELSE 6 de 20260812 ya resuelve 6.
  expect(sql).not.toMatch(/duracion_meses/i)
  expect(sql).not.toMatch(/DROP\s+COLUMN/i)
  // Por catálogo (conkey), no por nombre (Bug 72).
  expect(sql).toContain('conkey = ARRAY[v_attnum]')
  expect(sql).not.toMatch(/DROP CONSTRAINT IF EXISTS alumnos_modalidad_check/)
  // Unión de lo que ya admitía, y fail-closed ante otra forma.
  expect(sql).toMatch(/UNION\s+SELECT \(regexp_matches\(c\.def/)
  expect(sql).toContain("RAISE EXCEPTION 'CHECK % sobre alumnos.modalidad con forma desconocida: %'")
  // Un CHECK de varias columnas no se toca: se avisa.
  expect(sql).toContain("RAISE WARNING 'CHECK % también restringe modalidad y NO se amplió: %'")
  // Sin ningún CHECK (re-corrida fallida de la 20260812), se crea sin dejar
  // fuera a ningún alumno: canónicos + los ids en uso.
  expect(sql).toMatch(/IF v_n = 0 THEN[\s\S]*SELECT modalidad FROM public\.alumnos WHERE modalidad IS NOT NULL/)
  expect(sql).toContain("NOTIFY pgrst, 'reload schema';")
})

test('5. la migración nueva va DESPUÉS de la de licenciaturas y con otro nombre que las de los clones', () => {
  const nombre = MIGRACION.split('/').pop()!
  expect(nombre > '20260812120000_licenciaturas.sql').toBe(true)
  // 13 clones tienen su propia migración de '6_meses_lic' con estos nombres:
  // una sincronización no debe pisarla.
  expect(nombre).not.toBe('20260917120000_modalidad_6_meses_lic.sql')
  expect(nombre).not.toBe('20260918120000_modalidad_6_meses_lic.sql')
})
