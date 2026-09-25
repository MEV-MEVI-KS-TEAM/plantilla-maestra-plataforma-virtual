import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { veredictoObjetivoAlumno } from '@/lib/admin-alumno'
import { esPublicaAunConSesion } from '@/lib/rutas-sesion'

/**
 * Guardianes de tres huecos que encontró la Fase 2 de MEDERI (sep-2026):
 *
 *  (a) `DELETE /api/admin/alumnos/[id]?definitivo=true` borraba `usuarios` y la
 *      cuenta de Auth de CUALQUIER id, incluido otro admin o un secretario.
 *  (b) `PATCH /api/admin/alumnos/[id]/datos` podía cambiar el correo de acceso
 *      de otro admin o secretario (secuestro de cuenta).
 *  (c) El middleware redirigía `/validar` y `/api/validar` al panel cuando
 *      había sesión abierta.
 */
const leer = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

// ── Regla pura ──────────────────────────────────────────────────────────────
test('guarda: solo un alumno con fila en alumnos pasa', () => {
  expect(veredictoObjetivoAlumno({ rol: 'alumno' }, true)).toEqual({ ok: true })
  expect(veredictoObjetivoAlumno({ rol: 'ALUMNO' }, true)).toEqual({ ok: true })
})

test('guarda: admin y secretario se rechazan con 403 aunque tengan fila en alumnos', () => {
  for (const rol of ['admin', 'ADMIN', 'secretario', 'SECRETARIO', null, '']) {
    const v = veredictoObjetivoAlumno({ rol }, true)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.status).toBe(403)
  }
})

test('guarda: sin usuario o sin fila en alumnos → 404', () => {
  for (const [u, fila] of [[null, true], [undefined, false], [{ rol: 'alumno' }, false], [{ rol: 'admin' }, false]] as const) {
    const v = veredictoObjetivoAlumno(u, fila)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.status).toBe(404)
  }
})

// ── (a) Borrado definitivo ──────────────────────────────────────────────────
test('(a) DELETE valida que el id sea un alumno ANTES de tocar alumnos, usuarios o Auth', () => {
  const s = leer('src/app/api/admin/alumnos/[id]/route.ts')
  const del = s.slice(s.indexOf('export async function DELETE'))
  const guarda = del.indexOf('cargarAlumnoObjetivo(admin, params.id)')
  expect(guarda).toBeGreaterThan(-1)
  expect(del).toContain("if ('error' in objetivo) return objetivo.error")
  for (const peligro of [".from('alumnos')", ".from('usuarios').delete()", 'auth.admin.deleteUser']) {
    expect(del.indexOf(peligro)).toBeGreaterThan(guarda)
  }
  expect(del).toContain('params.id === user.id')
})

// ── (b) Editar datos / correo ───────────────────────────────────────────────
test('(b) PATCH datos valida que el id sea un alumno ANTES de cambiar el correo de Auth', () => {
  const s = leer('src/app/api/admin/alumnos/[id]/datos/route.ts')
  const guarda = s.indexOf('cargarAlumnoObjetivo(admin, params.id)')
  expect(guarda).toBeGreaterThan(-1)
  expect(s).toContain("if ('error' in objetivo) return objetivo.error")
  expect(s.indexOf('auth.admin.updateUserById')).toBeGreaterThan(guarda)
  expect(s.indexOf(".from('usuarios').update(")).toBeGreaterThan(guarda)
})

// ── (c) /validar con sesión abierta ─────────────────────────────────────────
test('(c) /validar y /api/validar no redirigen con sesión abierta', () => {
  for (const ruta of ['/validar', '/validar/', '/api/validar', '/api/validar/MEV-2026-000123']) {
    expect(esPublicaAunConSesion(ruta)).toBe(true)
  }
  // Las excepciones previas se conservan.
  expect(esPublicaAunConSesion('/')).toBe(true)
  expect(esPublicaAunConSesion('/diplomados')).toBe(true)
  expect(esPublicaAunConSesion('/diplomados/algun-curso')).toBe(true)
  // Y las públicas de acceso siguen mandando al panel a quien ya tiene sesión.
  for (const ruta of ['/login', '/register', '/forgot-password', '/reset-password', '/validarX']) {
    expect(esPublicaAunConSesion(ruta)).toBe(false)
  }
})

test('(c) el middleware usa esPublicaAunConSesion y /validar sigue siendo pública', () => {
  const s = leer('src/lib/supabase/middleware.ts')
  expect(s).toContain('!esPublicaAunConSesion(request.nextUrl.pathname)')
  expect(s).toContain("'/validar'")
  expect(s).toContain("'/api/validar'")
})
