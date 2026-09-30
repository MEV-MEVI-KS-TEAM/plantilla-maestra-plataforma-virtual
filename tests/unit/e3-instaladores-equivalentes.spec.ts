import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * GUARDIÁN DE EQUIVALENCIA (Bloque E3): supabase/schema.sql = todas las migraciones.
 *
 * `supabase/schema.sql` instala la línea Solo-Cursos y `supabase db reset`. Hasta
 * el 29-sep-2026 se había quedado atrás de las migraciones en 9 puntos (es_admin
 * sin S2 #253, sin contactado_whatsapp, sin columnas de licenciatura ni
 * 6_meses_lic, sin periodicidad semanal, sin idx_pagos_fecha_pago, sin los
 * UNIQUE de preguntas y documentos, CHECK de moneda con otro nombre) y los
 * guardianes no lo veían: miraban scripts/schema.sql.
 *
 * La prueba de fondo es con Postgres: scripts/verificar-schema/comparar-instaladores.mjs
 * arma la base por cada camino y compara el catálogo completo (cuerpos de
 * función, políticas, permisos por columna, buckets). Esta spec es su parte
 * estática, la que corre en cada `pnpm test:unit`:
 *   1. todo objeto de una migración que no es del módulo Cursos está en B;
 *   2. los UNIQUE y CHECK con nombre que la app y los seeds necesitan;
 *   3. es_admin()/es_staff() de B son los de la S2;
 *   4. los buckets que crean los instaladores son EXACTAMENTE los que usa el código.
 */

const raiz = process.cwd()
const leer = (f: string) => readFileSync(join(raiz, f), 'utf8')
const DIR_MIG = 'supabase/migrations'
const MIGRACIONES = readdirSync(join(raiz, DIR_MIG)).filter(f => f.endsWith('.sql')).sort()

function sinComentarios(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '').replace(/[ \t]--.*$/gm, '')
}

// Módulo Cursos: B no lo trae a propósito; lo instalan
// scripts/migracion-cursos-diplomados.sql y estas migraciones, solo a quien lo usa.
const DE_CURSOS = new Set([
  '20260728120000_examen_final_cursos.sql',
  '20260729122000_fix_portadas_storage_policy.sql',
  '20260730120000_b1_fundacion_solo_cursos.sql',
  '20260730130000_b2_gate_ventana_cursos.sql',
  '20260730140000_b3_abrir_mes_y_pagos_curso.sql',
  '20260730150000_b4_constancia_y_eventos.sql',
  '20260730160000_b6_reportes_por_vertical.sql',
  '20260730170000_b7_estado_cuenta_excluye_diplomado.sql',
  '20260730180000_b82_emision_manual_con_actor.sql',
  '20260926120000_c3b_acceso_total_cursos.sql',
  '20260927120000_d7b_secretario_abre_cursos.sql',
  '20260927130000_d8_activar_segun_ficha.sql',
  '20260927140000_d16_curso_cobrar.sql',
  '20260928130000_d20b_constancia_staff.sql',
])
// Objetos sueltos de migraciones mixtas que viven en tablas del módulo.
const OBJETOS_DE_CURSOS = new Set(['curso_examen_preguntas: techo solo admin (D22d)'])

function objetos(sql: string): string[] {
  const s = sinComentarios(sql)
  const out: string[] = []
  for (const m of s.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)/g)) out.push(m[1])
  for (const m of s.matchAll(/CREATE (?:OR REPLACE )?FUNCTION (?:public\.)?(\w+)\s*\(/g)) out.push(m[1])
  for (const m of s.matchAll(/CREATE TRIGGER (\w+)/g)) out.push(m[1])
  for (const m of s.matchAll(/CREATE POLICY "([^"]+)"/g)) out.push(m[1])
  for (const m of s.matchAll(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?(\w+)/g)) out.push(m[1])
  for (const m of s.matchAll(/ADD COLUMN (?:IF NOT EXISTS )?(\w+)/g)) out.push(m[1])
  for (const m of s.matchAll(/ADD CONSTRAINT (\w+)/g)) out.push(m[1])
  return out
}

test('1. todo objeto de las migraciones (fuera del módulo Cursos) está en supabase/schema.sql', () => {
  const b = sinComentarios(leer('supabase/schema.sql'))
  const faltan: string[] = []
  for (const mig of MIGRACIONES) {
    if (DE_CURSOS.has(mig)) continue
    for (const o of objetos(leer(`${DIR_MIG}/${mig}`))) {
      if (OBJETOS_DE_CURSOS.has(o)) continue
      if (!b.includes(o)) faltan.push(`${o} (${mig})`)
    }
  }
  expect(faltan, 'Objetos de migraciones que una base instalada con supabase/schema.sql no tiene. ' +
    'Refléjalos (y corre scripts/verificar-schema/comparar-instaladores.mjs):\n  ' + faltan.join('\n  ')).toEqual([])
})

test('1b. las listas del módulo Cursos apuntan a migraciones que existen', () => {
  for (const mig of DE_CURSOS) expect(existsSync(join(raiz, DIR_MIG, mig)), mig).toBe(true)
})

test('2. supabase/schema.sql trae los UNIQUE y CHECK con nombre que usan los seeds y la app', () => {
  const b = sinComentarios(leer('supabase/schema.sql'))
  // Bug 33: seed-preguntas-evaluaciones-universal.sql → ON CONFLICT (evaluacion_id, pregunta).
  expect(b).toMatch(/ADD CONSTRAINT preguntas_evaluacion_pregunta_unique\s+UNIQUE \(evaluacion_id, pregunta\)/)
  expect(leer('scripts/seed-preguntas-evaluaciones-universal.sql')).toContain('ON CONFLICT (evaluacion_id, pregunta)')
  // «Mis documentos»: upsert con onConflict 'alumno_id,tipo_documento'.
  expect(b).toMatch(/ADD CONSTRAINT documentos_alumno_alumno_tipo_unique\s+UNIQUE \(alumno_id, tipo_documento\)/)
  expect(leer('src/app/api/alumno/documentos/route.ts')).toContain("onConflict: 'alumno_id,tipo_documento'")
  // Moneda: los nombres de 20260910120000 (con otro nombre, re-correrla duplicaba el CHECK).
  for (const f of ['supabase/schema.sql', 'scripts/schema.sql']) {
    const s = sinComentarios(leer(f))
    expect(s, f).toContain('CONSTRAINT pagos_moneda_iso CHECK')
    expect(s, f).toContain('CONSTRAINT pagos_tipo_cambio_positivo CHECK')
  }
})

test('3. es_admin() y es_staff() de supabase/schema.sql son los de la S2 (#253)', () => {
  const cuerpo = (sql: string, fn: string) =>
    (sinComentarios(sql).match(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(\\)[\\s\\S]*?\\$\\$;`))?.[0] ?? '')
      .replace(/\s+/g, ' ').trim()
  const s2 = leer(`${DIR_MIG}/20260729121000_fix_s2_es_admin.sql`)
  const b = leer('supabase/schema.sql')
  for (const fn of ['es_admin', 'es_staff']) {
    expect(cuerpo(s2, fn), fn).not.toBe('')
    expect(cuerpo(b, fn), fn).toBe(cuerpo(s2, fn))
  }
  expect(sinComentarios(b)).toContain('GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated;')
  expect(sinComentarios(b)).toContain('GRANT EXECUTE ON FUNCTION public.es_staff() TO anon, authenticated;')
})

// ── 4. Buckets ──────────────────────────────────────────────────────────────
function bucketsCreados(sql: string): Set<string> {
  const ids = new Set<string>()
  for (const m of sinComentarios(sql).matchAll(/INSERT INTO storage\.buckets[^;]*?VALUES([\s\S]*?)(?:ON CONFLICT|;)/g)) {
    for (const t of m[1].matchAll(/\(\s*'([a-z0-9_-]+)'/g)) ids.add(t[1])
  }
  return ids
}

function archivosTs(dir: string): string[] {
  return readdirSync(join(raiz, dir)).flatMap((e) => {
    const p = `${dir}/${e}`
    if (statSync(join(raiz, p)).isDirectory()) return archivosTs(p)
    return /\.(ts|tsx)$/.test(e) ? [p] : []
  })
}

function bucketsDelCodigo(): Set<string> {
  const ids = new Set<string>()
  const constantes = new Map<string, string>()
  const fuentes = archivosTs('src').map((f) => leer(f))
  for (const s of fuentes) for (const m of s.matchAll(/const (BUCKET_\w+)\s*=\s*'([a-z0-9_-]+)'/g)) constantes.set(m[1], m[2])
  for (const s of fuentes) {
    for (const m of s.matchAll(/storage\s*\.from\(\s*'([a-z0-9_-]+)'\s*\)/g)) ids.add(m[1])
    for (const m of s.matchAll(/storage\s*\.from\(\s*(BUCKET_\w+)\s*\)/g)) {
      const v = constantes.get(m[1])
      expect(v, `constante ${m[1]} sin valor literal`).toBeTruthy()
      ids.add(v as string)
    }
  }
  return ids
}

test('4. los buckets que crean los instaladores son EXACTAMENTE los que usa el código (hoy 6)', () => {
  const codigo = bucketsDelCodigo()
  expect([...codigo].sort()).toEqual(['avatars', 'branding', 'cursos', 'documentos', 'materias', 'recibos'])
  const cursos = bucketsCreados(leer('scripts/migracion-cursos-diplomados.sql'))
  expect([...cursos]).toEqual(['cursos'])
  // Ruta Solo-Cursos: supabase/schema.sql + el módulo.
  const rutaB = new Set([...bucketsCreados(leer('supabase/schema.sql')), ...cursos])
  expect([...rutaB].sort(), 'supabase/schema.sql + módulo Cursos').toEqual([...codigo].sort())
  // Ruta del combo: scripts/schema.sql (sin storage) + módulo + TODAS las migraciones.
  expect([...bucketsCreados(leer('scripts/schema.sql'))]).toEqual([])
  const rutaS = new Set([...cursos, ...MIGRACIONES.flatMap((m) => [...bucketsCreados(leer(`${DIR_MIG}/${m}`))])])
  expect([...rutaS].sort(), 'migraciones + módulo Cursos').toEqual([...codigo].sort())
})

test('5. el comparador con Postgres existe y cubre los tres caminos', () => {
  const cmp = leer('scripts/verificar-schema/comparar-instaladores.mjs')
  for (const c of ["B: [['supabase/schema.sql']]", 'BS:', 'BM:', 'SM:']) expect(cmp).toContain(c)
  expect(existsSync(join(raiz, 'scripts/verificar-schema/foto-esquema.sql'))).toBe(true)
  expect(existsSync(join(raiz, 'scripts/verificar-schema/harness-supabase.sql'))).toBe(true)
})
