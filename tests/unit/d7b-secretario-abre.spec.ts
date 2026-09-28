import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describirMovimiento, etiquetaRolActor, quienHizo } from '@/lib/cursos/bitacora'

/**
 * Bloque D · D7b — decisión 6 de Kevin: EL SECRETARIO TAMBIÉN ABRE.
 * Asigna (una y a todos), abre un mes, abre todo, cobra abriendo el mes, cierra
 * un mes y quita el acceso total, igual que el admin. SOLO ADMIN: estado y
 * cancelación de inscripciones, borrar módulos, precios y fichas, Personalizar,
 * borrar pagos, borrar inscripciones, «Corregir plan», staff. (Las constancias
 * pasaron al personal con D20b: tests/unit/d20b-constancias-staff.spec.ts.)
 *
 * El comportamiento real (sesión de un secretario con RLS, re-correr B2/B3/B4/B6/C3b,
 * foto del candado) se prueba en el cluster scratch (prueba-d7b.sh): aquí se fija
 * que el código y el SQL digan lo mismo y que nadie lo deshaga en silencio.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const MIG = '20260927120000_d7b_secretario_abre_cursos.sql'
const D7B = leer(`supabase/migrations/${MIG}`)

// Las siete de apertura: firma → archivo con su versión vigente (la que D7b reescribe).
const APERTURA: Record<string, { firma: string; nombre: string; fuente: string }> = {
  curso_inscribir: { firma: 'public.curso_inscribir(uuid,uuid)', nombre: 'curso_inscribir', fuente: '20260926120000_c3b_acceso_total_cursos.sql' },
  curso_inscribir_todos: { firma: 'public.curso_inscribir_todos(uuid,integer,text,boolean)', nombre: 'curso_inscribir_todos', fuente: '20260926120000_c3b_acceso_total_cursos.sql' },
  curso_abrir_todo: { firma: 'public.curso_abrir_todo(uuid)', nombre: 'curso_abrir_todo', fuente: '20260926120000_c3b_acceso_total_cursos.sql' },
  curso_quitar_acceso_total: { firma: 'public.curso_quitar_acceso_total(uuid,text)', nombre: 'curso_quitar_acceso_total', fuente: '20260926120000_c3b_acceso_total_cursos.sql' },
  curso_abrir_mes: { firma: 'public.curso_abrir_mes(uuid,integer)', nombre: 'curso_abrir_mes', fuente: '20260926120000_c3b_acceso_total_cursos.sql' },
  curso_cerrar_mes: { firma: 'public.curso_cerrar_mes(uuid,integer)', nombre: 'curso_cerrar_mes', fuente: '20260926120000_c3b_acceso_total_cursos.sql' },
  curso_registrar_pago: { firma: 'public.curso_registrar_pago(uuid,numeric,text,text,text,date,boolean,integer)', nombre: 'curso_registrar_pago', fuente: '20260730140000_b3_abrir_mes_y_pagos_curso.sql' },
}
const SOLO_ADMIN = ['curso_cambiar_estado', 'curso_borrar_modulo']

/** Las filas (firma, guarda vieja, guarda nueva, mensaje viejo, mensaje nuevo) de d7b_staff_abre(). */
function filasD7b(): string[][] {
  const bloque = D7B.slice(D7B.indexOf('SELECT * FROM (VALUES'), D7B.indexOf(') AS t(firma'))
  // (firma, exige, corre, guarda vieja, guarda nueva, mensaje viejo, mensaje nuevo) → sin exige/corre.
  return [...bloque.matchAll(/\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g)]
    .map(m => [m[1], m[4], m[5], m[6], m[7], m[2]])
}

/** El cuerpo de la ÚLTIMA definición de una función en un archivo de migración. */
function cuerpo(archivo: string, nombre: string): string {
  const sql = leer(`supabase/migrations/${archivo}`)
  const i = sql.lastIndexOf(`CREATE OR REPLACE FUNCTION public.${nombre}(`)
  expect(i, `${archivo}: ${nombre}`).toBeGreaterThan(-1)
  const ini = sql.indexOf('$$', i)
  return sql.slice(ini, sql.indexOf('$$', ini + 2))
}

test('1. D7b abre al secretario EXACTAMENTE las siete de apertura, y ninguna de solo admin', () => {
  const filas = filasD7b()
  expect(filas.map(f => f[0]).sort()).toEqual(Object.values(APERTURA).map(a => a.firma).sort())
  for (const n of SOLO_ADMIN) expect(D7B.slice(D7B.indexOf('SELECT * FROM (VALUES'), D7B.indexOf(') AS t(firma'))).not.toContain(n)
  for (const [, vieja, nueva] of filas) {
    expect(vieja).toContain('NOT public.es_admin() THEN')
    // Marca SIN acentos: la busca strpos y no puede depender de la codificación.
    expect(nueva).toBe(vieja.replace('public.es_admin()', 'public.es_staff()') + '  -- D7b: tambien el secretario (decision 6)')
    expect(nueva).toMatch(/^[ -~]+$/)
  }
  // Exige la versión vigente: las seis de C3b conocen el acceso total; el cobro, B3.
  for (const f of filas) expect(f[5], f[0]).toBe(f[0].includes('curso_registrar_pago') ? 'p_abrir_mes' : 'acceso_total')
  expect(D7B).toContain('IF strpos(v_def, r.exige) = 0 THEN')
})

test('2. cada guarda y cada mensaje que D7b reescribe está UNA vez en la versión vigente (si C3b/B3 cambian, esto avisa)', () => {
  for (const [firma, vieja, , msgViejo] of filasD7b()) {
    const a = Object.values(APERTURA).find(x => x.firma === firma)!
    const c = cuerpo(a.fuente, a.nombre)
    expect(c.split(vieja).length - 1, `${firma}: guarda`).toBe(1)
    expect(c.split(msgViejo).length - 1, `${firma}: mensaje`).toBe(1)
  }
})

test('3. las de SOLO ADMIN siguen pidiendo es_admin() en su versión vigente', () => {
  expect(cuerpo('20260730150000_b4_constancia_y_eventos.sql', 'curso_cambiar_estado')).toContain('IF NOT public.es_admin() THEN')
  expect(cuerpo('20260730140000_b3_abrir_mes_y_pagos_curso.sql', 'curso_borrar_modulo')).toContain('IF NOT public.es_admin() THEN')
})

test('4. la migración: en transacción, idempotente, sin EXECUTE para nadie, NOTIFY pgrst', () => {
  const sql = sinComentariosSql(D7B)
  expect(sql.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true)
  expect(sql).toContain('CONTINUE WHEN strpos(v_def, r.guarda_nueva) > 0;')
  expect(sql).toContain("REVOKE ALL ON FUNCTION public.d7b_staff_abre() FROM PUBLIC;")
  for (const rol of ['anon', 'authenticated', 'service_role']) expect(sql).toContain(`REVOKE ALL ON FUNCTION public.d7b_staff_abre() FROM ${rol}`)
  expect(sql).toContain("NOTIFY pgrst, 'reload schema';")
  // Aborta si la versión instalada no es la vigente o la guarda no está exactamente
  // una vez; el mensaje se cambia si está (una base con otra codificación no lo
  // encontraría) y aborta solo si aparece más de una vez.
  expect(sql.match(/IF v_veces <> 1 THEN/g)?.length).toBe(1)
  expect(sql.match(/IF v_veces > 1 THEN/g)?.length).toBe(1)
  // No define ninguna función de apertura a mano: la regla vive en un solo lugar.
  expect(sql.match(/CREATE OR REPLACE FUNCTION public\.(\w+)\(/g)).toEqual(['CREATE OR REPLACE FUNCTION public.d7b_staff_abre('])
})

test('5. re-correr una migración vieja NO le quita la apertura al secretario: toda la que pisa una de las siete termina llamando a d7b_staff_abre()', () => {
  const viejas = readdirSync(join(process.cwd(), 'supabase/migrations')).filter(f => f.endsWith('.sql') && f < MIG)
  let cubiertas = 0
  for (const f of viejas) {
    const sql = sinComentariosSql(leer(`supabase/migrations/${f}`))
    const pisa = Object.keys(APERTURA).filter(n => sql.includes(`CREATE OR REPLACE FUNCTION public.${n}(`))
    if (pisa.length === 0) continue
    cubiertas++
    const epi = sql.lastIndexOf("IF to_regprocedure('public.d7b_staff_abre()') IS NOT NULL THEN")
    expect(epi, f).toBeGreaterThan(-1)
    expect(sql.slice(epi, epi + 200), f).toContain('v_n := public.d7b_staff_abre();')
    for (const n of pisa) expect(epi, `${f}: ${n}`).toBeGreaterThan(sql.lastIndexOf(`CREATE OR REPLACE FUNCTION public.${n}(`))
    // …y antes de su COMMIT.
    expect(epi, f).toBeLessThan(sql.lastIndexOf('COMMIT;'))
  }
  expect(cubiertas).toBe(3) // B3, B4 y C3b
})

test('6. el guardián: CHECK 16, SETUP 7bis y la excepción del onboarding', () => {
  const check = leer('scripts/post-setup-check.sql')
  const c16 = check.slice(check.indexOf('CHECK 16'))
  for (const a of Object.values(APERTURA)) expect(c16).toContain(`'${a.firma.replace('public.', '')}'`)
  for (const n of SOLO_ADMIN) expect(c16).toContain(`'${n}(`)
  expect(c16).toContain("'NOT public.es_staff() THEN  -- D7b:'")
  expect(c16).toContain("has_function_privilege('authenticated', 'public.d7b_staff_abre()', 'EXECUTE')")
  expect(leer('SETUP.md')).toContain(`| 15 | \`${MIG}\` | **D7b**`)
  expect(leer('tests/unit/guardian-schema-onboarding.spec.ts')).toContain(`'${MIG}': 'módulo Cursos: aplicación aparte'`)
})

test('7. rutas: lo de abrir es del staff; lo de solo admin sigue con verifyAdmin', () => {
  const ruta = (p: string) => sinComentarios(leer(`src/app/api/${p}`))
  // Programa: abrir y cerrar mes.
  for (const p of ['admin/alumnos/[id]/desbloquear-mes/route.ts', 'admin/alumnos/[id]/cerrar-mes/route.ts']) {
    expect(ruta(p), p).toContain('const denied = await verifyStaff(supabase, user.id)')
    expect(ruta(p), p).not.toMatch(/toLowerCase\(\) === 'admin'/)
  }
  // Cursos: asignar (GET simula, POST asigna), la lista y el detalle.
  expect(ruta('admin/cursos/[id]/inscripciones/route.ts').match(/await verifyStaff\(supabase, user\.id\)/g)?.length).toBe(2)
  expect(ruta('admin/cursos/[id]/inscripciones/route.ts')).not.toContain('verifyAdmin')
  const lista = ruta('admin/cursos/route.ts')
  expect(lista.slice(0, lista.indexOf('export async function POST'))).toContain('await verifyStaff(supabase, user.id)')
  expect(lista.slice(lista.indexOf('export async function POST'))).toContain('await verifyAdmin(supabase, user.id)')
  const detalle = ruta('admin/cursos/[id]/route.ts')
  expect(detalle.slice(detalle.indexOf('export async function GET'), detalle.indexOf('export async function PATCH'))).toContain('await verifyStaff(supabase, user.id)')
  expect(detalle.slice(detalle.indexOf('export async function PATCH'))).toMatch(/authAdmin\(\)[\s\S]*authAdmin\(\)/)
  const insc = ruta('admin/inscripciones/[id]/route.ts')
  expect(insc.slice(0, insc.indexOf('export async function PATCH'))).toContain('await verifyStaff(supabase, user.id)')
  expect(insc.slice(insc.indexOf('export async function PATCH'))).toContain('await verifyAdmin(supabase, user.id)')
  // SOLO ADMIN: precios/fichas (PATCH del curso), borrar pagos, quitar a un alumno del curso,
  // «Corregir plan», Personalizar y usuarios staff. D21a suma lo que escribe sobre un alumno
  // y NO pasó al secretario: editar datos, activar/desactivar, marcar inscripción, notas.
  for (const p of ['admin/pagos/[id]/route.ts', 'admin/cursos/[id]/inscripciones/[alumnoId]/route.ts',
    'admin/alumnos/[id]/corregir-plan/route.ts', 'admin/usuarios/route.ts',
    'admin/alumnos/[id]/datos/route.ts', 'admin/alumnos/[id]/activar/route.ts',
    'admin/alumnos/[id]/inscripcion/route.ts', 'admin/alumnos/[id]/notas/route.ts']) {
    expect(ruta(p), p).toContain('verifyAdmin(')
    expect(ruta(p), p).not.toContain('verifyStaff(')
  }
  // Resetear contraseña lleva su guarda en línea: rol 'ADMIN' exacto.
  expect(ruta('admin/alumnos/[id]/reset-password/route.ts')).toContain("?.toUpperCase() !== 'ADMIN'")
  // D21a: en la ruta del alumno, PUT (activo) y DELETE (baja/borrado) siguen con verifyAdmin;
  // el PATCH («Marcar contactado») pasa al personal con su lista blanca (d21a-permisos-secretario).
  const ficha = ruta('admin/alumnos/[id]/route.ts')
  const tramo = (a: string, b?: string) => ficha.slice(ficha.indexOf(a), b ? ficha.indexOf(b) : undefined)
  expect(tramo('export async function PUT', 'export async function PATCH')).toContain('await verifyAdmin(supabase, user.id)')
  expect(tramo('export async function DELETE')).toContain('await verifyAdmin(supabase, user.id)')
  // D21a: el alta de alumnos (POST) es del personal.
  const alta = ruta('admin/alumnos/route.ts')
  expect(alta.slice(alta.indexOf('export async function POST'))).toContain('const denied = await verifyStaff(supabase, user.id)')
})

test('8. interfaz: el secretario ve los botones de abrir; los de solo admin no', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).toContain('esAdmin: boolean')
  // D20b: la constancia ya no es solo del admin.
  expect(tab).not.toMatch(/\{esAdmin && \(\s*<button\s+onClick=\{\(\) => emitirConstancia/)
  expect(tab).toContain('onClick={() => emitirConstancia(i.inscripcion_id, i.nombre)}')
  expect(tab).toMatch(/\{esAdmin && \(\s*<button\s+onClick=\{\(\) => quitar\(/)
  // Abrir mes, cerrar mes, abrir todo y quitar acceso total: sin condición de rol.
  for (const b of ["moverMes(i.inscripcion_id, 'abrir-mes'", "moverMes(i.inscripcion_id, 'cerrar-mes'", 'setConfirmAbrirTodo({ i, paso: 1 })', "cambiarAccesoTotal(i, 'quitar-acceso-total')"]) {
    expect(tab).toContain(b)
  }
  // «Abrir todo»: doble confirmación y la segunda lleva el aviso del pago único.
  expect(tab).toContain("import { AVISO_PAGO_UNICO } from '@/lib/cursos/precio-regla'")
  expect(tab).toMatch(/open=\{confirmAbrirTodo\?\.paso === 1\}/)
  expect(tab).toMatch(/open=\{confirmAbrirTodo\?\.paso === 2\}[\s\S]{0,200}?danger[\s\S]{0,300}?\{AVISO_PAGO_UNICO\}/)
  // D21b (OS1): el aviso «no reembolsable» SOLO en la rama de pago único; la otra no lo menciona.
  const segunda = tab.slice(tab.indexOf('open={confirmAbrirTodo?.paso === 2}'), tab.indexOf('confirmLabel="Abrir todo"'))
  expect(segunda).toMatch(/\{llevaAvisoNoReembolsable\(tipoPrecio\)\s*\?\s*<>\{cuandoAbrirTodo === 'desde ya' \? <strong>\{AVISO_PAGO_UNICO\}\.<\/strong> : <strong>\{AVISO_NO_REEMBOLSABLE\}\.<\/strong>\}/)
  expect(segunda.slice(segunda.indexOf(': <>'))).not.toMatch(/reembols|AVISO_PAGO_UNICO/)
  // La bitácora dice quién (nombre y rol) — D21b (OS5): la línea completa, también en el title.
  expect(tab).toContain('title={textoUltimoMovimiento(i.ultimo_movimiento)}>')
  expect(tab).toContain('{textoUltimoMovimiento(i.ultimo_movimiento)}')

  const curso = sinComentarios(leer('src/app/(dashboard)/admin/cursos/[id]/page.tsx'))
  expect(curso).toContain("const esAdmin = detalle.viewer_rol !== 'SECRETARIO'")
  expect(curso).toContain("const tabs = esAdmin ? TABS : TABS.filter(t => t.id === 'alumnos')")
  expect(curso).toContain('esAdmin={esAdmin}')
  const lista = sinComentarios(leer('src/app/(dashboard)/admin/cursos/page.tsx'))
  expect(lista).toContain("setEsAdmin(res.headers.get('x-rol-visor') !== 'SECRETARIO')")
  expect(lista.match(/\{esAdmin && \(/g)?.length).toBe(3) // «Nuevo curso» ×2 y «Eliminar»

  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain('Abrir Mes {alumno.meses_desbloqueados + 1}')
  expect(ficha).not.toMatch(/\{!esSecretario && \(\s*<div className="flex items-center gap-2 flex-wrap">\s*\{todosBloqueados/)
  expect(ficha).toContain('{alumno.meses_desbloqueados > 0 && (')

  // En los dos menús del secretario está el módulo de cursos (solo_cursos: es su única otra pantalla).
  const sb = leer('src/components/layout/sidebar.tsx')
  const secretarios = [...sb.matchAll(/SECRETARIO: \[([\s\S]*?)\n  \],/g)].map(m => m[1])
  expect(secretarios).toHaveLength(2)
  for (const s of secretarios) expect(s).toContain("href: '/admin/cursos'")
})

test('9. la bitácora dice quién, con su rol', () => {
  // D21b (OS4): una sola etiqueta por rol en todo el panel (la de la barra lateral).
  expect(etiquetaRolActor('admin')).toBe('Administrador')
  expect(etiquetaRolActor('SECRETARIO')).toBe('Secretario')
  expect(etiquetaRolActor(null)).toBe('')
  expect(quienHizo({ actor_nombre: 'Ana López', actor_rol: 'secretario' })).toBe('Ana López (Secretario)')
  expect(quienHizo({ actor_nombre: 'Luis', actor_rol: 'admin' })).toBe('Luis (Administrador)')
  expect(quienHizo({ actor_nombre: null, actor_rol: null })).toBe('el sistema')
  expect(describirMovimiento({ tipo: 'abrir_mes', meses_antes: 1, meses_despues: 2 })).toBe('abrió el mes 2')
  expect(describirMovimiento({ tipo: 'cerrar_mes', meses_antes: 3, meses_despues: 2 })).toBe('cerró el mes 3')
  expect(describirMovimiento({ tipo: 'abrir_todo', meses_antes: 0, meses_despues: 0 })).toBe('abrió todo el curso')
  expect(describirMovimiento({ tipo: 'inscripcion', meses_antes: 0, meses_despues: 1 })).toBe('asignó el curso (mes 1)')
  // Las rutas que la leen le ponen nombre y rol al actor.
  expect(leer('src/app/api/admin/cursos/[id]/route.ts')).toMatch(/ultimosMovimientos\(admin, (\(inscripciones \?\? \[\]\)\.map\(i => i\.id\)|inscIds)\)/)
  expect(leer('src/app/api/admin/inscripciones/[id]/route.ts')).toContain('const eventos = await conActores(admin,')
})

test('10. revisión: el secretario entra a /admin/cursos, sin contenido del curso ni «nuevo», y ve los avisos', () => {
  // El layout de la sección deja pasar al staff; crear un curso sigue siendo del admin.
  const layout = sinComentarios(leer('src/app/(dashboard)/admin/cursos/layout.tsx'))
  expect(layout).toContain("if (rol !== 'admin' && rol !== 'secretario') redirect('/alumno')")
  const nuevo = sinComentarios(leer('src/app/(dashboard)/admin/cursos/nuevo/layout.tsx'))
  expect(nuevo).toContain("!== 'admin') redirect('/admin/cursos')")
  // La ficha (precio, estado) se lee con el cliente admin: la RLS de `cursos` es de
  // admin o inscritos y con la sesión del secretario salía null (sin aviso de «sin precio»).
  const insc = sinComentarios(leer('src/app/api/admin/cursos/[id]/inscripciones/route.ts'))
  expect(insc.match(/await createAdminClient\(\)\s*\.from\('cursos'\)/g)?.length).toBe(2)
  expect(insc).not.toMatch(/await supabase\s*\.from\('cursos'\)/)
  // El detalle no le entrega al secretario lecciones, videos ni materiales.
  const detalle = sinComentarios(leer('src/app/api/admin/cursos/[id]/route.ts'))
  expect(detalle).toContain("const conContenido = viewerRol === 'ADMIN'")
  expect(detalle).toContain('const { data: modulosRaw } = !conContenido ? { data: [] } : await admin')
  // La bitácora se lee completa, de mil en mil.
  const bit = leer('src/lib/cursos/bitacora.ts')
  expect(bit).toContain('.range(desde, hasta))')
  expect(bit).toContain('if (data.length < TAM) break')
})
