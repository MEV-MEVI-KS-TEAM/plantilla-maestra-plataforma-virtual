import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EVENTOS_DE_ACCESO } from '@/lib/cursos/bitacora'

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
  expect(SQL.match(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)).toEqual([
    'CREATE OR REPLACE FUNCTION public.curso_activar_segun_ficha',
    'CREATE OR REPLACE FUNCTION public.curso_inscripciones_por_activar',
  ])
  // El mes 1 tiene que verse: módulos y módulos por mes, no solo el tope.
  expect(SQL).toContain('OR NOT EXISTS (SELECT 1 FROM public.curso_modulos m WHERE m.curso_id = v_curso)')
  expect(SQL).toContain('OR COALESCE((SELECT c.modulos_por_mes FROM public.cursos c WHERE c.id = v_curso), 0) <= 0 THEN')
  expect(SQL).not.toContain("'::regprocedure")
  expect(SQL).not.toMatch(/ALTER TABLE|CHECK \(tipo/)
  // Permisos y recarga de PostgREST.
  expect(SQL).toContain('REVOKE ALL ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) FROM PUBLIC;')
  expect(SQL).toContain("REVOKE ALL ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) FROM anon")
  expect(SQL).toContain("GRANT EXECUTE ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) TO authenticated")
  expect(SQL).toContain("NOTIFY pgrst, 'reload schema';")
})

test('2. «por activar»: el MISMO predicado en la función que activa y en la que lista', () => {
  const listas = [...SQL.matchAll(/e\.tipo IN \(([^)]*)\)/g)].map(m => [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1]).sort())
  expect(listas).toHaveLength(2)
  for (const l of listas) expect(l).toEqual([...EVENTOS_DE_ACCESO].sort())
  // La que activa: activa, sin acceso total, 0 meses y sin eventos.
  expect(SQL).toContain('IF v_total OR COALESCE(v_meses, 0) > 0 OR EXISTS (')
  expect(SQL).toContain("IF v_estado <> 'activa' THEN")
  // La que lista: lo mismo, en un WHERE (sin traer ids a la URL de la app).
  const lista = SQL.slice(SQL.indexOf('CREATE OR REPLACE FUNCTION public.curso_inscripciones_por_activar'))
  expect(lista).toContain("AND ci.estado = 'activa'")
  expect(lista).toContain('AND ci.acceso_total = false')
  expect(lista).toContain('AND COALESCE(ci.meses_desbloqueados, 0) = 0')
  expect(lista).toContain('AND NOT EXISTS (')
  // Solo el servidor la llama.
  expect(SQL).toContain("REVOKE ALL ON FUNCTION public.curso_inscripciones_por_activar(UUID) FROM authenticated")
  expect(SQL).toContain("GRANT EXECUTE ON FUNCTION public.curso_inscripciones_por_activar(UUID) TO service_role")
  expect(SQL).not.toMatch(/GRANT EXECUTE ON FUNCTION public\.curso_inscripciones_por_activar\(UUID\) TO authenticated/)
})

test('3. la ruta: con la sesión, la regla esperada validada y 503 si falta la migración', () => {
  const ruta = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/activar/route.ts'))
  expect(ruta).toContain("supabase.rpc('curso_activar_segun_ficha', {")
  expect(ruta).toContain('p_regla_esperada: esperada ?? null,')
  expect(ruta).toContain("esperada !== 'total' && esperada !== 'mes1'")
  expect(ruta).toContain("if (error.code === 'PGRST202') {")
  expect(ruta).toContain(MIG)
  // El cliente admin solo LEE la ficha para el aviso de «sin precio» (el de «Asignar»).
  expect(ruta).toContain("sinPrecio = !errCurso && curso != null && precioCursoNumerico(curso).tipo === 'informes'")
  expect(ruta).toContain('sin_precio: sinPrecio,')
  expect(ruta).not.toMatch(/admin\s*\.rpc\(/)
})

test('4. el detalle del curso marca «por activar» con la lista de la base (sin D8, nadie)', () => {
  const api = sinComentarios(leer('src/app/api/admin/cursos/[id]/route.ts'))
  expect(api).toContain('porActivar(admin, params.id),')
  // `inscIds` son los ids de las INSCRIPCIONES del curso (los que lee la bitácora).
  expect(api).toContain('const inscIds = (inscripciones ?? []).map(i => i.id)')
  expect(api).toContain('ultimosMovimientos(admin, inscIds),')
  expect(api).toContain('por_activar: porActivarIds.has(row.id),')
  const bit = sinComentarios(leer('src/lib/cursos/bitacora.ts'))
  expect(bit).toContain("admin.rpc('curso_inscripciones_por_activar', cursoId ? { p_curso_id: cursoId } : {})")
  expect(bit).toContain('if (error || !Array.isArray(data)) return null')
  // La bitácora se lee por lotes de ids (la URL de .in() tiene tope).
  expect(bit).toContain('const LOTE_IDS = 100')
  expect(bit).toContain('inscripcionIds.slice(i, i + LOTE_IDS)')
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
  // Ficha sin precio: el mismo aviso rojo de «Asignar», con tiempo para leerlo.
  expect(tab).toMatch(/if \(json\.sin_precio && !json\.acceso_total\) \{\s*onError\(`Ojo: este curso no tiene precio en su ficha[\s\S]*?, AVISO_MS\)/)
})

test('6. /admin/alumnos: «Por activar» visible (el camino «¿Cuál?» del registro)', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  expect(api.match(/anexarPorActivar\(admin, await anexarCursoIngreso\(admin, \w+, puedeGestionarCursos\)\)/g)?.length).toBe(3)
  expect(api).toContain('for (const p of (await porActivar(admin)) ?? []) {')
  expect(api).not.toContain(".from('curso_inscripcion_eventos')")
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
