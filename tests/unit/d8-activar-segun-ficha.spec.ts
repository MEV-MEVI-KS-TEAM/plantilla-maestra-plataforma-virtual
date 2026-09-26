import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EVENTOS_DE_ACCESO, estaPorActivar } from '@/lib/cursos/bitacora'

/**
 * Bloque D · D8 — «Activar según la ficha» (obs-b; decisiones 11, 12 y 6).
 * El registro público crea la inscripción con 0 meses; la escuela, al cobrar,
 * era empujada a «+ Abrir mes» aunque la ficha fuera de pago único. Ahora una
 * función SQL abre lo que dice la ficha HOY (la regla de «Asignar») a quien está
 * POR ACTIVAR, admin o secretario, con un evento con origen y actor.
 *
 * El comportamiento real (secretario, doble clic, concurrencia, re-correr las
 * migraciones viejas, foto del candado) está en el cluster scratch (prueba-d8.sh).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const MIG = '20260927130000_d8_activar_segun_ficha.sql'
const SQL = sinComentariosSql(leer(`supabase/migrations/${MIG}`))

test('1. la función: staff, FOR UPDATE, solo «por activar», la regla de C3b y un evento con origen', () => {
  expect(SQL.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(SQL.trimEnd().endsWith('COMMIT;')).toBe(true)
  expect(SQL).toMatch(/CREATE OR REPLACE FUNCTION public\.curso_activar_segun_ficha\(\s*p_inscripcion_id UUID,\s*p_regla_esperada TEXT DEFAULT NULL\s*\)/)
  expect(SQL).toContain('SECURITY DEFINER')
  expect(SQL).toContain('SET search_path = public')
  expect(SQL).toContain('IF NOT public.es_staff() THEN')
  expect(SQL).not.toContain('public.es_admin()')
  expect(SQL).toMatch(/WHERE ci\.id = p_inscripcion_id\s*FOR UPDATE;/)
  expect(SQL).toContain("v_regla := public.curso_regla_apertura(v_ins, v_men);")
  expect(SQL).toContain("IF p_regla_esperada IS NOT NULL AND p_regla_esperada <> v_regla THEN")
  expect(SQL.match(/'origen', 'activar_segun_ficha'/g)?.length).toBe(2)
  expect(SQL).toContain("'precio_inscripcion', v_ins, 'precio_mensualidad', v_men")
  expect(SQL.match(/auth\.uid\(\)\);/g)?.length).toBe(2)
  // Solo LEE funciones de C3b: no redefine ninguna, y no toca el CHECK de tipos.
  expect(SQL.match(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)).toEqual(['CREATE OR REPLACE FUNCTION public.curso_activar_segun_ficha'])
  expect(SQL).not.toMatch(/ALTER TABLE|CHECK \(tipo/)
  // Permisos y recarga de PostgREST.
  expect(SQL).toContain('REVOKE ALL ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) FROM PUBLIC;')
  expect(SQL).toContain("REVOKE ALL ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) FROM anon")
  expect(SQL).toContain("GRANT EXECUTE ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) TO authenticated")
  expect(SQL).toContain("NOTIFY pgrst, 'reload schema';")
})

test('2. «por activar»: la regla de la pantalla es la MISMA que la del SQL', () => {
  // Los tipos que cuentan como «ya tuvo acceso», iguales en TS y en SQL.
  const lista = /e\.tipo IN \(([^)]*)\)/.exec(SQL)?.[1] ?? ''
  expect([...lista.matchAll(/'(\w+)'/g)].map(m => m[1]).sort()).toEqual([...EVENTOS_DE_ACCESO].sort())
  expect(SQL).toContain('IF v_total OR COALESCE(v_meses, 0) > 0 OR EXISTS (')
  expect(SQL).toContain("IF v_estado <> 'activa' THEN")
  // La función de la pantalla, caso por caso.
  const base = { estado: 'activa', acceso_total: false, meses_desbloqueados: 0 }
  expect(estaPorActivar(base, false)).toBe(true)
  expect(estaPorActivar(base, true)).toBe(false) // ya tuvo eventos de acceso
  expect(estaPorActivar({ ...base, acceso_total: true }, false)).toBe(false)
  expect(estaPorActivar({ ...base, meses_desbloqueados: 1 }, false)).toBe(false)
  expect(estaPorActivar({ ...base, estado: 'suspendida' }, false)).toBe(false)
  expect(estaPorActivar({ ...base, meses_desbloqueados: null }, false)).toBe(true)
})

test('3. la ruta: con la sesión, la regla esperada validada y 503 si falta la migración', () => {
  const ruta = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/activar/route.ts'))
  expect(ruta).toContain("supabase.rpc('curso_activar_segun_ficha', {")
  expect(ruta).toContain('p_regla_esperada: esperada ?? null,')
  expect(ruta).toContain("esperada !== 'total' && esperada !== 'mes1'")
  expect(ruta).toContain("if (error.code === 'PGRST202') {")
  expect(ruta).toContain(MIG)
  expect(ruta).not.toContain('createAdminClient')
})

test('4. el detalle del curso marca «por activar» con la bitácora (sin ella, nadie)', () => {
  const api = sinComentarios(leer('src/app/api/admin/cursos/[id]/route.ts'))
  expect(api).toContain('conEventosDeAcceso(admin, inscIds),')
  expect(api).toContain('por_activar: conAcceso !== null && estaPorActivar(row, conAcceso.has(row.id)),')
})

test('5. AlumnosTab: «Activar según la ficha» es el botón principal; confirma doble solo si abre TODO', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).toMatch(/\{i\.por_activar && \(\s*<button\s+onClick=\{\(\) => pedirActivar\(i\)\}/)
  expect(tab).toContain('Activar según la ficha')
  // «+ Abrir mes» pasa a secundario (contorno) cuando está por activar.
  expect(tab).toMatch(/style=\{i\.por_activar\s*\?\s*\{ border:[^}]*\}\s*:\s*\{ background: 'var\(--color-acento\)'/)
  // Pago único → doble confirmación con el aviso; mes 1 → directo (decisión 12).
  expect(tab).toContain("if (apertura === 'total') setConfirmActivar({ i, paso: 1 })")
  expect(tab).toContain('else void activar(i)')
  expect(tab).toMatch(/open=\{confirmActivar\?\.paso === 2\}[\s\S]{0,200}?danger[\s\S]{0,300}?\{AVISO_PAGO_UNICO\}/)
  // Lo que la pantalla dijo viaja al servidor.
  expect(tab).toContain('body: JSON.stringify({ regla_esperada: apertura }),')
  // «Asignar» con 409 no activa nada: remite al botón de la fila.
  expect(tab).toContain('Si está «por activar», usa «Activar según la ficha» en su fila.')
})

test('6. /admin/alumnos: «Por activar» visible (el camino «¿Cuál?» del registro)', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  expect(api.match(/anexarPorActivar\(admin, await anexarCursoIngreso\(admin, \w+, puedeGestionarCursos\)\)/g)?.length).toBe(3)
  expect(api).toContain(".eq('estado', 'activa').eq('meses_desbloqueados', 0)")
  expect(api).toContain("'acceso_total' in i && i.acceso_total !== true")
  expect(api).toContain('estaPorActivar(i, conEventos.has(i.id))')
  const page = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  // Móvil y escritorio: un enlace al curso (o a la lista si son varios).
  expect(page.match(/Por activar: \{a\.cursos_por_activar!\.map\(c => c\.nombre\)\.join\(', '\)\}/g)?.length).toBe(2)
  expect(page.match(/a\.cursos_por_activar!\.length === 1 \? `\/admin\/cursos\/\$\{a\.cursos_por_activar!\[0\]\.id\}` : '\/admin\/cursos'/g)?.length).toBe(2)
})

test('7. el guardián: CHECK 17, SETUP 7bis y la excepción del onboarding', () => {
  const check = leer('scripts/post-setup-check.sql')
  const c17 = check.slice(check.indexOf('CHECK 17'))
  expect(c17).toContain("to_regprocedure('public.curso_activar_segun_ficha(uuid,text)')")
  // Sin casts constantes a regprocedure: se evalúan al planear y truenan si falta la función.
  expect(c17).not.toContain("'::regprocedure")
  expect(c17).toContain("has_function_privilege('anon', 'public.curso_activar_segun_ficha(uuid,text)', 'EXECUTE')")
  expect(leer('SETUP.md')).toContain(`| 16 | \`${MIG}\` | **D8**`)
  expect(leer('tests/unit/guardian-schema-onboarding.spec.ts')).toContain(`'${MIG}':     'módulo Cursos: aplicación aparte'`)
})
