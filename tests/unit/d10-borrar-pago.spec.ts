import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  AVISO_ABRIO_TODO, avisoAbrioMes, avisoAlBorrarPago, faltaFkCurso, faltaTabla, idInvalido,
} from '@/lib/pagos/borrar-pago'

/**
 * Bloque D · D10 — #207-2a: borrar un pago.
 *  - Sin B1 (sin `pagos.curso_inscripcion_id`) pedir esa columna tumbaba el
 *    select y el pago salía «no encontrado»: 404 falso, imposible de borrar.
 *  - «Este pago abrió acceso» se decidía por `mes_desbloqueado`, que pasa a ser
 *    el mes que el pago CUBRE (D0 decisión 5). Ahora sale de la bitácora: el
 *    evento de apertura de la MISMA transacción del cobro tiene su mismo
 *    created_at (now() = inicio de la transacción; comprobado en el cluster
 *    scratch con curso_registrar_pago abriendo mes). Y solo si SIGUE abierto.
 *  - La ficha muestra el aviso (antes la API lo mandaba y nadie lo pintaba).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const RUTA = sinComentarios(leer('src/app/api/admin/pagos/[id]/route.ts'))

test('1. sin B1 el pago se lee sin la columna de curso (no más 404 falso); id inválido = 404', () => {
  expect(RUTA).toContain(".select('id, curso_inscripcion_id, mes_desbloqueado, concepto, created_at')")
  expect(RUTA).toContain('if (faltaFkCurso(lectura.error)) {')
  expect(RUTA).toContain(".select('id, mes_desbloqueado, concepto, created_at')")
  // Un id que no es UUID es «no encontrado»; un error de lectura de verdad, 500.
  expect(RUTA).toMatch(/if \(idInvalido\(lectura\.error\)\) \{\s*return NextResponse\.json\(\{ error: 'Pago no encontrado' \}, \{ status: 404 \}\)/)
  expect(RUTA.indexOf('idInvalido(lectura.error)')).toBeLessThan(RUTA.indexOf('if (lectura.error) {'))
  expect(RUTA).toMatch(/if \(lectura\.error\) \{[\s\S]*?status: 500/)
  expect(RUTA).toMatch(/if \(!lectura\.data\) \{\s*return NextResponse\.json\(\{ error: 'Pago no encontrado' \}, \{ status: 404 \}\)/)
  // Borrar sigue siendo solo del admin.
  expect(RUTA).toContain('const denied = await verifyAdmin(supabase, user.id)')
})

test('2. el aviso sale de la bitácora (mismo created_at) y del estado de HOY; la ruta no revoca', () => {
  expect(RUTA).toContain(".from('curso_inscripcion_eventos')")
  expect(RUTA).toContain(".eq('inscripcion_id', inscripcionId)")
  expect(RUTA).toContain(".eq('created_at', p.created_at)")
  expect(RUTA).toContain(".in('tipo', ['abrir_mes', 'abrir_todo'])")
  expect(RUTA).not.toMatch(/abrioMes|p\.mes_desbloqueado !== null/)
  // Lee la inscripción (sin depender de acceso_total) y NO la modifica.
  const ins = RUTA.slice(RUTA.indexOf(".from('curso_inscripciones')"))
  expect(ins.slice(0, 120)).toMatch(/^\.from\('curso_inscripciones'\)\s*\.select\('\*'\)\s*\.eq\('id', inscripcionId\)\s*\.maybeSingle\(\)/)
  expect(RUTA.match(/\.from\('curso_inscripciones'\)/g)?.length).toBe(1)
  expect(RUTA).not.toMatch(/\.from\('curso_inscripciones'\)[\s\S]{0,80}\.(update|delete|upsert|insert)\(/)
  // Un error de la bitácora que no sea «no existe» queda en el log.
  expect(RUTA).toContain("else if (!faltaTabla(ev.error)) console.error(")
  expect(RUTA).toContain('aviso: avisoAlBorrarPago(abrio, hoy),')
})

test('3. la ficha muestra el aviso de la API al borrar', () => {
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain("if (typeof data.aviso === 'string' && data.aviso) showToast(data.aviso, 'error', 12000)")
})

test('4. el aviso solo si lo que el pago abrió SIGUE abierto (no manda a cerrar un mes pagado)', () => {
  const mes3 = { tipo: 'abrir_mes', meses_despues: 3 }
  // Abrió el mes 3 y sigue en 3 (o más): avisa, con el número de mes.
  expect(avisoAlBorrarPago(mes3, { meses_desbloqueados: 3, acceso_total: false })).toBe(avisoAbrioMes(3))
  expect(avisoAlBorrarPago(mes3, { meses_desbloqueados: 4 })).toBe(avisoAbrioMes(3))
  expect(avisoAbrioMes(3)).toContain('abrió el mes 3 del curso, que SIGUE ABIERTO')
  expect(avisoAbrioMes(3)).toContain('usa «Cerrar mes» en su inscripción')
  // El caso de la revisión: cobró abriendo (2→3), cerró el mes (3→2) y luego
  // borra el pago. Ya está cerrado: decir «usa Cerrar mes» le quitaría el 2.
  expect(avisoAlBorrarPago(mes3, { meses_desbloqueados: 2, acceso_total: false })).toBeNull()
  // Con acceso total, cerrar un mes no revoca nada: no se sugiere.
  expect(avisoAlBorrarPago(mes3, { meses_desbloqueados: 3, acceso_total: true })).toBeNull()
  // Abrió todo: avisa solo si el acceso total sigue puesto.
  const todo = { tipo: 'abrir_todo', meses_despues: null }
  expect(avisoAlBorrarPago(todo, { meses_desbloqueados: 0, acceso_total: true })).toBe(AVISO_ABRIO_TODO)
  expect(AVISO_ABRIO_TODO).toContain('usa «Quitar acceso total» en su inscripción')
  expect(avisoAlBorrarPago(todo, { meses_desbloqueados: 0, acceso_total: false })).toBeNull()
  // Sin evento, sin inscripción legible o con un mes absurdo: no se afirma nada.
  expect(avisoAlBorrarPago(null, { meses_desbloqueados: 3 })).toBeNull()
  expect(avisoAlBorrarPago(mes3, null)).toBeNull()
  expect(avisoAlBorrarPago({ tipo: 'abrir_mes', meses_despues: null }, { meses_desbloqueados: 3 })).toBeNull()
  expect(avisoAlBorrarPago({ tipo: 'inscripcion', meses_despues: 0 }, { meses_desbloqueados: 3 })).toBeNull()
})

test('5. los errores de PostgREST se clasifican por su forma real', () => {
  // Sin B1: la columna pedida no existe.
  expect(faltaFkCurso({ code: '42703', message: 'column pagos.curso_inscripcion_id does not exist' })).toBe(true)
  expect(faltaFkCurso({ message: 'column pagos.curso_inscripcion_id does not exist' })).toBe(true)
  expect(faltaFkCurso({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(false)
  expect(faltaFkCurso(null)).toBe(false)
  // Id que no es UUID.
  expect(idInvalido({ code: '22P02', message: 'invalid input syntax for type uuid: "x"' })).toBe(true)
  expect(idInvalido({ code: '42703' })).toBe(false)
  // Sin B4: la tabla de la bitácora no existe (Postgres o caché de PostgREST).
  expect(faltaTabla({ code: '42P01', message: 'relation "public.curso_inscripcion_eventos" does not exist' })).toBe(true)
  expect(faltaTabla({ code: 'PGRST205', message: "Could not find the table 'public.curso_inscripcion_eventos' in the schema cache" })).toBe(true)
  expect(faltaTabla({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(false)
})
