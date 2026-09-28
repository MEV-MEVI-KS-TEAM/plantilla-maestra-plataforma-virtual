import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { baseSinPagosDeCurso } from '@/lib/cursos/inscripciones'

/**
 * Bloque D · D11 — #207-2b (decisión 7): borrar una inscripción CON PAGOS → 409
 * «cancélala», y «Cancelar inscripción» en la pestaña Alumnos (solo admin), con
 * «Reactivar» para deshacerla. La FK pagos.curso_inscripcion_id es ON DELETE
 * SET NULL (B1): borrar dejaba los pagos sin curso y Reportes/Excel/estado de
 * cuenta los contaban como del PROGRAMA. Lo mismo al borrar el CURSO entero
 * (sus inscripciones se van en cascada).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('1. la FK de pagos es SET NULL: por eso borrar con pagos se bloquea', () => {
  expect(leer('supabase/migrations/20260730120000_b1_fundacion_solo_cursos.sql'))
    .toContain('REFERENCES public.curso_inscripciones(id) ON DELETE SET NULL')
})

test('2. DELETE de la inscripción: 409 si tiene pagos, ANTES de borrar; falla cerrado; sin B1 sigue', () => {
  const r = sinComentarios(leer('src/app/api/admin/cursos/[id]/inscripciones/[alumnoId]/route.ts'))
  const chequeo = r.indexOf(".from('pagos')")
  expect(chequeo).toBeGreaterThan(0)
  expect(chequeo).toBeLessThan(r.indexOf('.delete({ count: \'exact\' })'))
  expect(r).toContain(".eq('curso_inscripcion_id', (insc as { id: string }).id)")
  // Sin `head` (los errores traen cuerpo) y cualquier error que no sea «sin B1» → 500, sin borrar.
  expect(r).toContain(".select('id', { count: 'exact' })")
  expect(r).not.toContain('head: true')
  expect(r).toMatch(/if \(errPagos && !baseSinPagosDeCurso\(errPagos\)\) \{[\s\S]{0,400}?status: 500 \}\)/)
  expect(r).toMatch(/tiene_pagos: true,\s*\}, \{ status: 409 \}\)/)
  expect(r).toContain('Usa «Cancelar inscripción»')
  // Si ya está cancelada no se le manda a un botón que no está en su fila.
  expect(r).toContain("const yaCancelada = (insc as { estado?: string }).estado === 'cancelada'")
  expect(r).toContain('Ya está cancelada: así se queda, con su historial.')
  // La inscripción se lee sin exigir `estado` (llega con B1).
  expect(r).toMatch(/\.from\('curso_inscripciones'\)\s*\.select\('\*'\)/)
  // Borrar sigue siendo solo del admin.
  expect(r).toContain('const denied = await verifyAdmin(supabase, user.id)')
})

test('2b. DELETE del curso: tampoco con pagos en sus inscripciones (una consulta por la relación)', () => {
  const r = sinComentarios(leer('src/app/api/admin/cursos/[id]/route.ts'))
  const del = r.slice(r.indexOf('export async function DELETE'))
  const chequeo = del.indexOf(".select('id, curso_inscripciones!inner(curso_id)', { count: 'exact' })")
  expect(chequeo).toBeGreaterThan(0)
  expect(chequeo).toBeLessThan(del.indexOf(".from('cursos').delete()"))
  expect(del).toContain(".eq('curso_inscripciones.curso_id', params.id)")
  expect(del).toMatch(/if \(errPagosCurso && !baseSinPagosDeCurso\(errPagosCurso\)\) \{[\s\S]{0,400}?status: 500 \}\)/)
  expect(del).toMatch(/Pásalo a borrador[\s\S]{0,120}?tiene_pagos: true,\s*\}, \{ status: 409 \}\)/)
})

test('2c. «sin pagos de curso» solo cuando la base no tiene B1; lo demás no prueba nada', () => {
  expect(baseSinPagosDeCurso({ code: '42703', message: 'column pagos.curso_inscripcion_id does not exist' })).toBe(true)
  expect(baseSinPagosDeCurso({ code: 'PGRST200', message: "Could not find a relationship between 'pagos' and 'curso_inscripciones' in the schema cache" })).toBe(true)
  // Timeout, red o la respuesta vacía de un error con head: NO son «sin pagos».
  expect(baseSinPagosDeCurso({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(false)
  expect(baseSinPagosDeCurso({ message: '' })).toBe(false)
  expect(baseSinPagosDeCurso(null)).toBe(false)
})

test('3. AlumnosTab: «Cancelar inscripción» y «Reactivar» (solo admin) por curso_cambiar_estado; el 409 de «Quitar» se lee con calma', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).toMatch(/\{esAdmin && i\.estado !== 'cancelada' && \(\s*<button\s+onClick=\{\(\) => cancelar\(i\)\}/)
  expect(tab).toContain("body: JSON.stringify({ estado: 'cancelada', motivo: 'Cancelada desde la pestaña Alumnos' }),")
  // La cancelación se deshace desde la misma fila (antes era un callejón sin salida).
  expect(tab).toMatch(/\{esAdmin && i\.estado === 'cancelada' && \(\s*<button\s+onClick=\{\(\) => reactivar\(i\)\}/)
  expect(tab).toContain("body: JSON.stringify({ estado: 'activa', motivo: 'Reactivada desde la pestaña Alumnos' }),")
  expect(tab).toContain('«Reactivar» los recupera')
  expect(tab.match(/fetch\(`\/api\/admin\/inscripciones\/\$\{i\.inscripcion_id\}`, \{\n        method: 'PATCH',/g)?.length).toBe(2)
  expect(tab).toContain('const duracion = res.status === 409 ? AVISO_MS : undefined')
  // El PATCH de estado sigue siendo del admin y pasa por la función con evento.
  const patch = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/route.ts'))
  expect(patch.slice(patch.indexOf('export async function PATCH'))).toContain('await verifyAdmin(supabase, user.id)')
  expect(patch).toContain("supabase.rpc('curso_cambiar_estado', {")
})

test('4. una sola llave de «ocupado» por fila: «Cancelar», «Reactivar» y «Quitar» no se cruzan', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  // D21b: `ocupada(id)` = ocupadoId === id, o la fila con un mes en vuelo.
  expect(tab).toMatch(/onClick=\{\(\) => quitar\(i\)\}\s*disabled=\{ocupada\(i\.inscripcion_id\)\}/)
  expect(tab).toContain('const ocupada = (id: string) => ocupadoId === id || moviendo.has(id)')
  expect(tab).not.toContain('disabled={ocupadoId === i.alumno_id}')
  const quitar = tab.slice(tab.indexOf('async function quitar('))
  expect(quitar.slice(0, 600)).toContain('setOcupadoId(i.inscripcion_id)')
  expect(quitar.slice(0, 600)).not.toContain('setOcupadoId(alumnoId)')
})
