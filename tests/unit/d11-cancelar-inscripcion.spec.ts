import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Bloque D · D11 — #207-2b (decisión 7): borrar una inscripción CON PAGOS → 409
 * «cancélala», y «Cancelar inscripción» en la pestaña Alumnos (solo admin).
 * La FK pagos.curso_inscripcion_id es ON DELETE SET NULL (B1): borrar dejaba los
 * pagos sin curso y Reportes/Excel/estado de cuenta los contaban como del PROGRAMA.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('1. la FK de pagos es SET NULL: por eso borrar con pagos se bloquea', () => {
  expect(leer('supabase/migrations/20260730120000_b1_fundacion_solo_cursos.sql'))
    .toContain('REFERENCES public.curso_inscripciones(id) ON DELETE SET NULL')
})

test('2. DELETE de la inscripción: 409 si tiene pagos, ANTES de borrar; sin B1 sigue', () => {
  const r = sinComentarios(leer('src/app/api/admin/cursos/[id]/inscripciones/[alumnoId]/route.ts'))
  const chequeo = r.indexOf(".from('pagos')")
  expect(chequeo).toBeGreaterThan(0)
  expect(chequeo).toBeLessThan(r.indexOf('.delete({ count: \'exact\' })'))
  expect(r).toContain(".eq('curso_inscripcion_id', (insc as { id: string }).id)")
  expect(r).toContain('if (!errPagos && (nPagos ?? 0) > 0) {')
  expect(r).toMatch(/tiene_pagos: true,\s*\}, \{ status: 409 \}\)/)
  expect(r).toContain('Usa «Cancelar inscripción»')
  // Borrar sigue siendo solo del admin.
  expect(r).toContain('const denied = await verifyAdmin(supabase, user.id)')
})

test('3. AlumnosTab: «Cancelar inscripción» (solo admin) por curso_cambiar_estado; el 409 de «Quitar» se lee con calma', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).toMatch(/\{esAdmin && i\.estado !== 'cancelada' && \(\s*<button\s+onClick=\{\(\) => cancelar\(i\)\}/)
  expect(tab).toContain("body: JSON.stringify({ estado: 'cancelada', motivo: 'Cancelada desde la pestaña Alumnos' }),")
  expect(tab).toContain("fetch(`/api/admin/inscripciones/${i.inscripcion_id}`, {\n        method: 'PATCH',")
  expect(tab).toContain('const duracion = res.status === 409 ? AVISO_MS : undefined')
  // El PATCH de estado sigue siendo del admin y pasa por la función con evento.
  const patch = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/route.ts'))
  expect(patch.slice(patch.indexOf('export async function PATCH'))).toContain('await verifyAdmin(supabase, user.id)')
  expect(patch).toContain("supabase.rpc('curso_cambiar_estado', {")
})
