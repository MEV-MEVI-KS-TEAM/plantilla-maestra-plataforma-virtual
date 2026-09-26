import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Bloque D · D10 — #207-2a: borrar un pago.
 *  - Sin B1 (sin `pagos.curso_inscripcion_id`) pedir esa columna tumbaba el
 *    select y el pago salía «no encontrado»: 404 falso, imposible de borrar.
 *  - «Este pago abrió acceso» se decidía por `mes_desbloqueado`, que pasa a ser
 *    el mes que el pago CUBRE (D0 decisión 5). Ahora sale de la bitácora: el
 *    evento de apertura de la MISMA transacción del cobro tiene su mismo
 *    created_at (now() = inicio de la transacción; comprobado en el cluster
 *    scratch con curso_registrar_pago abriendo mes).
 *  - La ficha muestra el aviso (antes la API lo mandaba y nadie lo pintaba).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const RUTA = sinComentarios(leer('src/app/api/admin/pagos/[id]/route.ts'))

test('1. sin B1 el pago se lee sin la columna de curso (no más 404 falso)', () => {
  expect(RUTA).toContain(".select('id, curso_inscripcion_id, mes_desbloqueado, concepto, created_at')")
  expect(RUTA).toContain('if (faltaFkCurso(lectura.error)) {')
  expect(RUTA).toContain(".select('id, mes_desbloqueado, concepto, created_at')")
  expect(RUTA).toContain("return error.code === '42703' || /curso_inscripcion_id/.test(error.message ?? '')")
  // Un error de lectura de verdad ya no se disfraza de «no encontrado».
  expect(RUTA).toMatch(/if \(lectura\.error\) \{[\s\S]*?status: 500/)
  expect(RUTA).toMatch(/if \(!lectura\.data\) \{\s*return NextResponse\.json\(\{ error: 'Pago no encontrado' \}, \{ status: 404 \}\)/)
  // Borrar sigue siendo solo del admin.
  expect(RUTA).toContain('const denied = await verifyAdmin(supabase, user.id)')
})

test('2. el aviso sale de la bitácora (mismo created_at), no de mes_desbloqueado', () => {
  expect(RUTA).toContain(".from('curso_inscripcion_eventos')")
  expect(RUTA).toContain(".eq('inscripcion_id', inscripcionId)")
  expect(RUTA).toContain(".eq('created_at', p.created_at)")
  expect(RUTA).toContain(".in('tipo', ['abrir_mes', 'abrir_todo'])")
  expect(RUTA).not.toMatch(/abrioMes|p\.mes_desbloqueado !== null/)
  // Los dos avisos: abrió todo → «Quitar acceso total»; abrió un mes → «Cerrar mes».
  expect(RUTA).toContain('ABRIÓ TODO EL CURSO')
  expect(RUTA).toContain('usa «Quitar acceso total» en su inscripción')
  expect(RUTA).toContain('SIGUE ABIERTO')
  expect(RUTA).toContain('usa «Cerrar mes» en su inscripción')
  // Sin bitácora legible no se afirma nada.
  expect(RUTA).toContain('if (!errEv) abrio =')
  // Y borrar NO revoca: la ruta no toca curso_inscripciones.
  expect(RUTA).not.toContain(".from('curso_inscripciones')")
})

test('3. la ficha muestra el aviso de la API al borrar', () => {
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain("if (typeof data.aviso === 'string' && data.aviso) showToast(data.aviso, 'error', 12000)")
})
