import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ROL_ALTA, datosAltaDesdeCuerpo, filaUsuarioAlta, normalizarCorreoAlta, opcionesAuthAlta, revertirAltaSinCursos,
} from '@/lib/alta-alumno'
import { CAMPOS_PATCH_SECRETARIO, MENSAJE_SOLO_CONTACTADO, esPersonal, reglaPatchAlumno } from '@/lib/alumno-patch'

/**
 * Bloque D · D21a — permisos del secretario (decisión de Kevin, 27-sep-2026, amplía la Dec. 6):
 *  1. el secretario DA ALTAS de alumnos, y el alta nunca crea personal (rol forzado a 'alumno');
 *  2. el secretario «Marca contactado», y SOLO eso (lista blanca de un campo; lo demás → 403);
 *  3. «Eliminar alumno definitivamente» se oculta a quien no es admin;
 *  4. el contador de «Pendientes de contactar» del menú también es suyo.
 * Las pruebas en vivo (sesión real de secretario en el desechable) van en el cuerpo del PR.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const API_ALTA = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
const POST = API_ALTA.slice(API_ALTA.indexOf('export async function POST'))
const API_ALUMNO = sinComentarios(leer('src/app/api/admin/alumnos/[id]/route.ts'))
const tramo = (s: string, a: string, b?: string) => s.slice(s.indexOf(a), b ? s.indexOf(b) : undefined)

// ── 1. Alta ───────────────────────────────────────────────────────────────

test('1a. el alta es del personal: verifyStaff ANTES de leer el cuerpo y de crear la cuenta', () => {
  const i = POST.indexOf('const denied = await verifyStaff(supabase, user.id)')
  expect(i).toBeGreaterThan(0)
  expect(i).toBeLessThan(POST.indexOf('await request.json()'))
  expect(i).toBeLessThan(POST.indexOf('admin.auth.admin.createUser('))
  expect(API_ALTA).not.toContain('checkAdmin(')
  expect(POST).not.toContain('verifyAdmin(')
})

test('1b. el cuerpo NUNCA se esparce ni aporta el rol: Auth y usuarios salen de lib/alta-alumno', () => {
  expect(POST).not.toMatch(/\.\.\.body\b/)
  expect(POST).not.toMatch(/body\.rol\b|body\[['"]rol['"]\]|user_metadata|app_metadata/)
  expect(POST).toContain('admin.auth.admin.createUser(opcionesAuthAlta(email, password))')
  expect(POST).toContain(".upsert(filaUsuarioAlta(newUserId, { ...datos, email }), { onConflict: 'id' })")
  // Se relee el rol y, si no quedó 'alumno', se deshace el alta completa.
  expect(POST).toMatch(/\.select\('rol'\)\s*\.single\(\)/)
  const relee = POST.indexOf('!== ROL_ALTA')
  expect(relee).toBeGreaterThan(0)
  expect(POST.slice(relee, relee + 200)).toContain('await admin.auth.admin.deleteUser(newUserId)')
})

test('1c. datosAltaDesdeCuerpo: solo nombre, apellidos, correo, contraseña y teléfono, pase lo que pase', () => {
  const adversarios: unknown[] = [
    { rol: 'admin' }, { rol: 'secretario' }, { rol: 'ADMIN ' }, { rol: ['admin'] }, { rol: {} },
    { id: '11111111-1111-4111-8111-111111111111' },
    { user_metadata: { rol: 'admin' } }, { app_metadata: { rol: 'admin' } }, { data: { rol: 'admin' } }, { options: { data: { rol: 'admin' } } },
    { __proto__: { rol: 'admin' } }, JSON.parse('{"__proto__":{"rol":"admin"}}'), { constructor: { rol: 'admin' } },
    { meses_desbloqueados: 99, inscripcion_pagada: true, activo: false, matricula: 'X', contactado_whatsapp: true },
  ]
  for (const extra of adversarios) {
    const cuerpo = { nombre_completo: '  Ana  María López ', email: '  Ana@Mail.COM ', password: 'x1', telefono: ' 55 ', ...(extra as object) }
    const d = datosAltaDesdeCuerpo(cuerpo)
    expect(Object.keys(d).sort(), JSON.stringify(extra)).toEqual(['apellidos', 'email', 'nombre', 'password', 'telefono'])
    expect(d).toEqual({ nombre: 'Ana', apellidos: 'María López', email: 'ana@mail.com', password: 'x1', telefono: '55' })
    const fila = filaUsuarioAlta('nuevo-id', { ...d, email: d.email! })
    expect(fila.rol).toBe('alumno')
    expect(fila.id).toBe('nuevo-id')
    expect(Object.keys(fila).sort()).toEqual(['apellidos', 'email', 'id', 'nombre', 'rol', 'telefono'])
  }
  // Cuerpos que no son objeto: todo vacío (la ruta responde 400).
  for (const raro of [null, undefined, 'x', 42, [], [{ email: 'a@b.co' }]]) {
    expect(datosAltaDesdeCuerpo(raro)).toEqual({ nombre: '', apellidos: '', email: null, password: '', telefono: null })
  }
  expect(ROL_ALTA).toBe('alumno')
})

test('1d. opcionesAuthAlta: exactamente correo, contraseña y confirmación (sin metadata)', () => {
  const o = opcionesAuthAlta('a@b.co', 'pw')
  expect(Object.keys(o).sort()).toEqual(['email', 'email_confirm', 'password'])
  expect(o).toEqual({ email: 'a@b.co', password: 'pw', email_confirm: true })
})

test('1e. correo: se normaliza y se valida antes de crear una cuenta confirmada', () => {
  expect(normalizarCorreoAlta('  Luis.QA@Escuela.MX ')).toBe('luis.qa@escuela.mx')
  for (const malo of ['', '   ', 'sin-arroba', 'a@b', '@b.co', 'a@.co', 'a b@c.co', 'a@b.co c', null, 42, {}]) {
    expect(normalizarCorreoAlta(malo), String(malo)).toBeNull()
  }
  const i = POST.indexOf("'El correo no tiene un formato válido.'")
  expect(i).toBeGreaterThan(0)
  expect(i).toBeLessThan(POST.indexOf('admin.auth.admin.createUser('))
})

test('1f. alta de curso sin NINGÚN curso inscrito: se deshace, para los dos roles', () => {
  expect(revertirAltaSinCursos('diplomado', 0)).toBe(true)
  expect(revertirAltaSinCursos('diplomado', 1)).toBe(false)
  for (const nivel of ['secundaria', 'preparatoria', 'licenciatura', null, undefined]) {
    expect(revertirAltaSinCursos(nivel, 0), String(nivel)).toBe(false)
  }
  const i = POST.indexOf('if (revertirAltaSinCursos(nivelElegido, cursosAsignados)) {')
  expect(i).toBeGreaterThan(POST.indexOf("supabase.rpc('curso_inscribir',"))
  expect(i).toBeLessThan(POST.indexOf('}, { status: 201 })'))
  expect(POST.slice(i, i + 200)).toContain('await admin.auth.admin.deleteUser(newUserId)')
  // No depende del rol: la condición no mira quién da el alta.
  expect(POST.slice(i - 400, i)).not.toMatch(/SECRETARIO|esAdmin|isAdmin/)
})

test('1g. el personal se sigue creando SOLO por /api/admin/usuarios, que es del admin', () => {
  const usuarios = sinComentarios(leer('src/app/api/admin/usuarios/route.ts'))
  expect(tramo(usuarios, 'export async function POST')).toContain('await verifyAdmin(supabase, user.id)')
  expect(usuarios).not.toContain('verifyStaff(')
})

// ── 2. «Marcar contactado» ─────────────────────────────────────────────────

test('2a. el secretario solo puede mandar contactado_whatsapp (booleano)', () => {
  expect([...CAMPOS_PATCH_SECRETARIO]).toEqual(['contactado_whatsapp'])
  for (const v of [true, false]) {
    expect(reglaPatchAlumno('SECRETARIO', { contactado_whatsapp: v })).toEqual({ ok: true, updates: { contactado_whatsapp: v } })
    expect(reglaPatchAlumno('secretario', { contactado_whatsapp: v })).toEqual({ ok: true, updates: { contactado_whatsapp: v } })
  }
})

test('2b. cualquier otra clave (sola o junto a contactado) → 403 para el secretario', () => {
  const extras: [string, unknown][] = [
    ['plan', '6_meses'], ['nivel', 'licenciatura'], ['modalidad', '3_meses'], ['carrera', 'derecho'],
    ['meses_desbloqueados', 99], ['activo', false], ['rol', 'admin'], ['inscripcion_pagada', true],
    ['notas_admin', 'x'], ['nombre', 'X'], ['email', 'x@y.co'], ['telefono', '1'], ['matricula', 'X'],
    ['id', '11111111-1111-4111-8111-111111111111'], ['constructor', {}], ['Contactado_WhatsApp', true],
  ]
  for (const [k, v] of extras) {
    for (const cuerpo of [{ [k]: v }, { contactado_whatsapp: true, [k]: v }]) {
      expect(reglaPatchAlumno('SECRETARIO', cuerpo), JSON.stringify(cuerpo)).toEqual({ ok: false, status: 403, error: MENSAJE_SOLO_CONTACTADO })
    }
  }
  // __proto__ llega como clave PROPIA desde JSON.parse.
  expect(reglaPatchAlumno('SECRETARIO', JSON.parse('{"contactado_whatsapp":true,"__proto__":{"rol":"admin"}}')))
    .toEqual({ ok: false, status: 403, error: MENSAJE_SOLO_CONTACTADO })
})

test('2c. valores y cuerpos inválidos → 400 (los dos roles)', () => {
  for (const v of ['true', 1, null]) expect(reglaPatchAlumno('SECRETARIO', { contactado_whatsapp: v })).toMatchObject({ ok: false, status: 400 })
  expect(reglaPatchAlumno('SECRETARIO', {})).toMatchObject({ ok: false, status: 400 })
  for (const rol of ['ADMIN', 'SECRETARIO']) {
    for (const raro of [null, [], [{ contactado_whatsapp: true }], 'x', 42]) {
      expect(reglaPatchAlumno(rol, raro), `${rol} ${JSON.stringify(raro)}`).toMatchObject({ ok: false, status: 400 })
    }
  }
})

test('2d. el admin conserva lo de siempre; quien no es personal → 403', () => {
  expect(reglaPatchAlumno('ADMIN', { contactado_whatsapp: true, activo: false, rol: 'admin' }))
    .toEqual({ ok: true, updates: { contactado_whatsapp: true } })
  expect(reglaPatchAlumno('ADMIN', {})).toMatchObject({ ok: false, status: 400 })
  for (const rol of [null, undefined, '', 'ALUMNO', 'alumno', 'profesor']) {
    expect(reglaPatchAlumno(rol, { contactado_whatsapp: true }), String(rol)).toMatchObject({ ok: false, status: 403 })
    expect(esPersonal(rol)).toBe(false)
  }
  expect(esPersonal('admin')).toBe(true)
  expect(esPersonal('SECRETARIO')).toBe(true)
})

test('2e. la ruta: regla ANTES de escribir, 404 si no es alumno; PUT y DELETE siguen del admin', () => {
  const patch = tramo(API_ALUMNO, 'export async function PATCH', 'export async function DELETE')
  expect(patch).not.toContain('verifyAdmin(')
  const iRegla = patch.indexOf('const regla = reglaPatchAlumno(rol, body)')
  expect(iRegla).toBeGreaterThan(0)
  expect(iRegla).toBeLessThan(patch.indexOf('createAdminClient()'))
  expect(iRegla).toBeLessThan(patch.indexOf('.update('))
  expect(patch).toContain('.update(regla.updates)')
  expect(patch).toMatch(/\.select\('id'\)/)
  expect(patch).toContain("{ error: 'Alumno no encontrado' }, { status: 404 }")
  expect(tramo(API_ALUMNO, 'export async function PUT', 'export async function PATCH')).toContain('await verifyAdmin(supabase, user.id)')
  expect(tramo(API_ALUMNO, 'export async function DELETE')).toContain('await verifyAdmin(supabase, user.id)')
})

test('2f. la base NO se abre: alumnos sigue con UPDATE solo del admin y sin UPDATE para authenticated', () => {
  for (const f of ['supabase/schema.sql', 'scripts/schema.sql']) {
    const sql = leer(f)
    expect(sql, f).toMatch(/REVOKE UPDATE ON public\.alumnos\s+FROM anon, authenticated;/)
    expect(sql, f).not.toMatch(/GRANT[^;]*UPDATE[^;]*ON public\.alumnos[^;]*authenticated/)
  }
})

// ── 3. «Eliminar alumno definitivamente» ──────────────────────────────────

test('3. la zona de riesgo y su modal solo para el admin (condición positiva), con el texto correcto', () => {
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain("const esAdmin = alumno.viewer_rol === 'ADMIN'")
  expect(ficha).toMatch(/\{esAdmin && \(\s*<div className="mt-10 rounded-2xl p-5"/)
  expect(ficha).toContain('{esAdmin && borrarAlumno && alumno && (')
  expect(ficha.match(/Eliminar alumno definitivamente/g)?.length).toBe(1)
  expect(ficha).not.toContain('Dar de baja')
  const zona = tramo(ficha, 'Eliminar alumno</p>', 'Eliminar alumno definitivamente')
  expect(zona).toContain('Desactivar alumno')
  expect(zona).not.toMatch(/deje de\s+aparecer en las listas/)
})

// ── 4. Contador del menú y aviso del alta ─────────────────────────────────

test('4. el contador de «Pendientes de contactar» es del personal; el modal avisa del plan', () => {
  const cuenta = sinComentarios(leer('src/app/api/admin/alumnos/pendientes-count/route.ts'))
  expect(cuenta).toContain('await verifyStaff(supabase, user.id)')
  expect(cuenta).not.toContain('verifyAdmin')
  const menu = sinComentarios(leer('src/components/layout/sidebar.tsx'))
  expect(menu).toContain("if (role !== 'ADMIN' && role !== 'SECRETARIO') return")
  expect(menu).toContain("fetch('/api/admin/alumnos/pendientes-count')")
  const lista = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(lista.replace(/\s+/g, ' ')).toContain('Revisa el nivel y la modalidad antes de crear: después solo el administrador puede corregirlos')
})
