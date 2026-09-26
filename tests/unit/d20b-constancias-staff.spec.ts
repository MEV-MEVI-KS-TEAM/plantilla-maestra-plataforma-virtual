import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describirMovimiento } from '@/lib/cursos/bitacora'
import { textoConstancia } from '@/components/admin/alumnos/CursosDelAlumno'

/**
 * Bloque D · D20b (remates a y b) — decisión de Kevin: el SECRETARIO también
 * emite constancias con folio. El folio guarda quién lo emitió (nombre y rol),
 * visible en la ficha y en la bitácora; una inscripción CANCELADA no recibe
 * folio (en el servidor); en su fila solo queda «Reactivar». Y re-correr B4 (o
 * B8.2) ya no revierte la emisión vigente.
 *
 * El comportamiento real (secretario con su sesión, cancelada, carrera entre
 * cancelar y emitir, re-correr B4 y B8.2 solos, foto del candado) está en el
 * cluster scratch (prueba-d20b.sh).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const MIG = '20260928130000_d20b_constancia_staff.sql'
const CRUDO = leer(`supabase/migrations/${MIG}`)
const SQL = sinComentariosSql(CRUDO)
const B4 = leer('supabase/migrations/20260730150000_b4_constancia_y_eventos.sql')
const B82 = leer('supabase/migrations/20260730180000_b82_emision_manual_con_actor.sql')
const MARCA = 'NOT public.es_staff() THEN  -- D20b:'
const HUELLA_B82 = 'IF v_mejor < v_minima THEN'
const RETURNS = 'RETURNS TABLE (id UUID, folio TEXT, emitido_en TIMESTAMPTZ, ya_existia BOOLEAN)'

test('1. la migración: staff, candado, cancelada sin folio, el folio al final y con su autor', () => {
  expect(SQL.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(SQL.trimEnd().endsWith('COMMIT;')).toBe(true)
  expect(SQL).toContain("NOTIFY pgrst, 'reload schema';")
  expect(SQL).not.toContain("'::regprocedure")
  expect(SQL.match(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)).toEqual(['CREATE OR REPLACE FUNCTION public.curso_emitir_constancia'])
  // La marca (ASCII: la busca strpos) y la MISMA firma de B4/B8.2.
  expect(CRUDO).toContain(`IF ${MARCA} tambien el secretario emite`)
  expect(CRUDO.slice(CRUDO.indexOf(MARCA) - 3, CRUDO.indexOf(MARCA) + 60)).toMatch(/^[ -~]+$/)
  expect(SQL).toContain(RETURNS)
  expect(B82).toContain(RETURNS)
  expect(SQL).not.toContain('public.es_admin()')
  // Orden: permiso → candado de la inscripción → idempotencia → cancelada → aprobación → folio.
  const orden = [
    'IF NOT public.es_staff() THEN',
    'FOR UPDATE;',
    'FROM public.curso_constancias c WHERE c.inscripcion_id = p_inscripcion_id;',
    "IF v_estado = 'cancelada' THEN",
    HUELLA_B82,
    'v_folio := public.generar_folio_constancia(p_prefijo);',
    'INSERT INTO public.curso_constancias',
  ].map(t => SQL.indexOf(t, SQL.indexOf('CREATE OR REPLACE FUNCTION public.curso_emitir_constancia(')))
  for (const i of orden) expect(i).toBeGreaterThan(0)
  expect([...orden].sort((a, b) => a - b)).toEqual(orden)
  // El autor: foto en la constancia y en el evento.
  for (const c of ['emitida_por UUID', 'emitida_por_nombre TEXT', 'emitida_por_rol TEXT']) {
    expect(SQL).toContain(`ALTER TABLE public.curso_constancias ADD COLUMN IF NOT EXISTS ${c};`)
  }
  expect(SQL).toContain('emitida_por, emitida_por_nombre, emitida_por_rol)')
  expect(SQL).toContain('auth.uid(), v_actor_nom, v_actor_rol)')
  expect(SQL).toContain("'actor_nombre', v_actor_nom, 'actor_rol', v_actor_rol")
  // La sesión: authenticated entra, anon no.
  expect(SQL).toContain("EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) TO authenticated';")
  expect(SQL).toContain("EXECUTE 'REVOKE ALL ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) FROM anon';")
})

test('2. re-correr B4 NO revierte la emisión vigente (B8.2 o D20b): prólogo, epílogo y el EXECUTE', () => {
  const cuerpo = sinComentariosSql(B4)
  const guarda = cuerpo.indexOf('CREATE TEMP TABLE b82_vigente AS')
  const crea = cuerpo.lastIndexOf('CREATE OR REPLACE FUNCTION public.curso_emitir_constancia(')
  const revoca = cuerpo.indexOf("EXECUTE 'REVOKE ALL ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) FROM authenticated';")
  const restaura = cuerpo.indexOf('SELECT * INTO r FROM pg_temp.b82_vigente;')
  const commit = cuerpo.lastIndexOf('COMMIT;')
  expect(guarda).toBeGreaterThan(0)
  expect(crea).toBeGreaterThan(guarda)
  expect(revoca).toBeGreaterThan(crea)
  expect(restaura).toBeGreaterThan(revoca)
  expect(commit).toBeGreaterThan(restaura)
  // La huella es la guarda de aprobación (la del CHECK 20); B4 nunca la trae.
  expect(cuerpo).toContain(`AND strpos(pg_get_functiondef(p.oid), '${HUELLA_B82}') > 0;`)
  const b4Fn = cuerpo.slice(crea, cuerpo.indexOf('$$;', crea))
  expect(b4Fn).not.toContain(HUELLA_B82)
  // El ACL: se devuelve el EXECUTE a authenticated si lo tenía.
  expect(cuerpo.slice(restaura)).toContain("EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) TO authenticated';")
  expect(cuerpo).toContain('DROP TABLE IF EXISTS pg_temp.b82_vigente;')
  // Los epílogos de antes siguen (C3b y D7b).
  expect(cuerpo).toContain('FROM pg_temp.c3b_vigentes')
  expect(cuerpo).toContain('v_n := public.d7b_staff_abre();')
})

test('3. re-correr B8.2 NO le quita la emisión al secretario (D20b): en transacción, guarda y restaura', () => {
  const cuerpo = sinComentariosSql(B82)
  expect(cuerpo.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(cuerpo.trimEnd().endsWith('COMMIT;')).toBe(true)
  const guarda = cuerpo.indexOf('CREATE TEMP TABLE d20b_vigente AS')
  const crea = cuerpo.indexOf('CREATE OR REPLACE FUNCTION public.curso_emitir_constancia(')
  const restaura = cuerpo.indexOf('SELECT def INTO v_def FROM pg_temp.d20b_vigente;')
  expect(guarda).toBeGreaterThan(0)
  expect(crea).toBeGreaterThan(guarda)
  expect(restaura).toBeGreaterThan(cuerpo.lastIndexOf("TO service_role'"))
  // La marca lleva «--»: se busca en el archivo crudo (sinComentariosSql la cortaría).
  expect(B82).toContain(`strpos(pg_get_functiondef(p.oid), '${MARCA}') > 0;`)
  // B8.2 sigue siendo B8.2 (lo fija emision-b82.spec.ts): solo gana prólogo y epílogo.
  expect(cuerpo).toContain('IF NOT public.es_admin() THEN')
})

test('4. el guardián: CHECK 16 ya no la trata como solo admin; CHECK 20 la vigila; SETUP y onboarding', () => {
  const check = leer('scripts/post-setup-check.sql')
  const c16 = check.slice(check.indexOf('CHECK 16'), check.indexOf('CHECK 17'))
  expect(c16).not.toContain("'curso_emitir_constancia(uuid,text,numeric)'")
  expect(c16).toContain("unnest(ARRAY['curso_cambiar_estado(uuid,text,text)', 'curso_borrar_modulo(uuid)'])")
  const c20 = check.slice(check.indexOf('CHECK 20'))
  expect(c20).not.toContain("'::regprocedure")
  for (const h of [HUELLA_B82, MARCA, "IF v_estado = ''cancelada'' THEN", 'FOR UPDATE', 'emitida_por_rol']) {
    expect(c20).toContain(`'${h}') > 0`)
  }
  expect(c20).toContain("has_function_privilege('authenticated', 'public.curso_emitir_constancia(uuid,text,numeric)', 'EXECUTE')")
  expect(c20).toContain("(SELECT count(*) FROM pg_proc WHERE proname = 'curso_emitir_constancia') AS versiones")
  expect(leer('SETUP.md')).toContain(`| 19 | \`${MIG}\` | **D20b**`)
  expect(leer('tests/unit/guardian-schema-onboarding.spec.ts')).toContain(`'${MIG}':      'módulo Cursos: aplicación aparte'`)
})

test('5. la ruta: admin o secretario, con la sesión', () => {
  const r = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/constancia/route.ts'))
  expect(r).toContain('const denied = await verifyStaff(supabase, user.id)')
  expect(r).not.toContain('verifyAdmin')
  expect(r).toContain("supabase.rpc('curso_emitir_constancia'")
})

test('6. AlumnosTab: «Constancia» para el personal; en una cancelada solo queda «Reactivar»', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).not.toMatch(/\{esAdmin && \(\s*<button\s+onClick=\{\(\) => emitirConstancia/)
  expect(tab).toContain("const CANCELADA_TITULO = 'Inscripción cancelada: reactívala primero'")
  // Cada acción de la fila, apagada en una cancelada.
  for (const onClick of [
    'onClick={() => cobrarDe(i)}',
    "onClick={() => cambiarAccesoTotal(i, 'quitar-acceso-total')}",
    'onClick={() => pedirActivar(i)}',
    "onClick={() => moverMes(i.inscripcion_id, 'cerrar-mes', i.meses_desbloqueados, i.nombre)}",
    'onClick={() => emitirConstancia(i.inscripcion_id, i.nombre)}',
  ]) {
    const i = tab.indexOf(onClick)
    expect(i, onClick).toBeGreaterThan(0)
    expect(tab.slice(i, i + 260), onClick).toMatch(/disabled=\{[^}]*i\.estado === 'cancelada'\}/)
  }
  // «+ Abrir mes» y «Abrir todo» ya estaban apagadas fuera de 'activa'.
  for (const onClick of ["onClick={() => moverMes(i.inscripcion_id, 'abrir-mes', i.meses_desbloqueados, i.nombre)}", 'onClick={() => setConfirmAbrirTodo({ i, paso: 1 })}']) {
    const i = tab.indexOf(onClick)
    expect(tab.slice(i, i + 200), onClick).toContain("i.estado !== 'activa'")
  }
  // «Reactivar» sigue (solo admin) y el aviso de la emisión dice el folio.
  expect(tab).toMatch(/\{esAdmin && i\.estado === 'cancelada' && \(\s*<button\s+onClick=\{\(\) => reactivar\(i\)\}/)
  expect(tab).toContain('`${nombre}: constancia emitida, folio ${json.folio}`')
})

test('7. el autor del folio en la bitácora y en la ficha', () => {
  expect(describirMovimiento({ tipo: 'constancia_emitida', meses_antes: 3, meses_despues: 3, folio: 'DIP-00012' })).toBe('emitió la constancia DIP-00012')
  expect(describirMovimiento({ tipo: 'constancia_emitida', meses_antes: 3, meses_despues: 3 })).toBe('emitió la constancia')
  expect(leer('src/lib/cursos/bitacora.ts')).toContain(".select('inscripcion_id, tipo, meses_antes, meses_despues, actor, created_at, detalle')")

  expect(textoConstancia({ constancia: null })).toBeNull()
  const t = textoConstancia({ constancia: { folio: 'DIP-00012', emitido_en: null, emitida_por_nombre: 'Ana López', emitida_por_rol: 'secretario' } })
  expect(t).toBe('Constancia DIP-00012 · emitida por Ana López (secretaría)')
  // Emitida antes de D20b sin evento: sin autor, sin inventarlo.
  expect(textoConstancia({ constancia: { folio: 'DIP-00001', emitido_en: null, emitida_por_nombre: null, emitida_por_rol: null } })).toBe('Constancia DIP-00001')

  const g = leer('src/app/api/admin/alumnos/[id]/cursos/route.ts')
  expect(g).toContain("await leer('inscripcion_id, folio, emitido_en, emitida_por_nombre, emitida_por_rol')")
  expect(g).toContain("if (error?.code === '42703') ({ data, error } = await leer('inscripcion_id, folio, emitido_en'))")
  expect(g).toContain('constancia: constancias.get(i.id) ?? null,')
  expect(leer('src/components/admin/alumnos/CursosDelAlumno.tsx')).toContain('{textoConstancia(f)}')
})

test('8. los textos del rol dicen la verdad', () => {
  expect(leer('src/app/(dashboard)/admin/usuarios/page.tsx')).not.toContain('registra pagos y ve alumnos (solo lectura)')
  expect(leer('SOLO-CURSOS-ARQUITECTURA.md')).toContain('403 (`es_staff()`)')
  expect(leer('src/lib/cursos/constancia.ts')).toContain('el PERSONAL (admin o secretario, D20b) emite la constancia')
})
