import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { limiteVentana, motivoBloqueo, type MotivoBloqueo } from '@/lib/cursos/acceso'
import { textoSinLecciones } from '@/lib/cursos/visor-textos'

/**
 * Bloque C · C3a (#183, sin cambiar el modelo de acceso): el visor ya no le
 * dice «Este curso todavía no tiene lecciones» a quien está inscrito esperando
 * su pago, y «Activado» en /admin/alumnos sale de la ventana REAL, no de que
 * exista la fila (Bug 106 del PLAYBOOK, que nunca había llegado a plantilla).
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
const manana = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
const publicado = { modulos_por_mes: 2, estado: 'publicado' }

test('1. motivoBloqueo: cada caso tiene su motivo', () => {
  const casos: [string, Parameters<typeof motivoBloqueo>[0], MotivoBloqueo | null][] = [
    ['curso sin módulos', { inscripcion: { meses_desbloqueados: 3, estado: 'activa' }, curso: publicado, modulosTotales: 0 }, 'sin_contenido'],
    ['curso en borrador', { inscripcion: { meses_desbloqueados: 3, estado: 'activa' }, curso: { ...publicado, estado: 'borrador' }, modulosTotales: 4 }, 'no_publicado'],
    ['suspendida', { inscripcion: { meses_desbloqueados: 3, estado: 'suspendida' }, curso: publicado, modulosTotales: 4 }, 'no_vigente'],
    ['cancelada', { inscripcion: { meses_desbloqueados: 3, estado: 'cancelada' }, curso: publicado, modulosTotales: 4 }, 'no_vigente'],
    ['vencida ayer', { inscripcion: { meses_desbloqueados: 3, estado: 'activa', fecha_vencimiento: ayer }, curso: publicado, modulosTotales: 4 }, 'vencida'],
    ['asignado con 0 meses (#183)', { inscripcion: { meses_desbloqueados: 0, estado: 'activa' }, curso: publicado, modulosTotales: 4 }, 'sin_apertura'],
    ['sin inscripción', { inscripcion: null, curso: publicado, modulosTotales: 4 }, 'sin_apertura'],
    ['mes 1 abierto', { inscripcion: { meses_desbloqueados: 1, estado: 'activa' }, curso: publicado, modulosTotales: 4 }, null],
    ['completada conserva lo abierto', { inscripcion: { meses_desbloqueados: 2, estado: 'completada', fecha_vencimiento: manana }, curso: publicado, modulosTotales: 4 }, null],
  ]
  for (const [nombre, args, esperado] of casos) expect(motivoBloqueo(args), nombre).toBe(esperado)
})

test('2. paridad con el candado: motivo null ⇔ limiteVentana > 0 (con contenido)', () => {
  const estados = ['activa', 'completada', 'suspendida', 'cancelada', '', null]
  const cursos = [publicado, { ...publicado, estado: 'borrador' }, { modulos_por_mes: 0, estado: 'publicado' }, null]
  for (const estado of estados) for (const meses of [0, 1, 3, null]) for (const venc of [null, ayer, manana]) for (const curso of cursos) {
    const inscripcion = { meses_desbloqueados: meses, estado, fecha_vencimiento: venc }
    const m = motivoBloqueo({ inscripcion, curso, modulosTotales: 5 })
    expect(m === null, JSON.stringify({ estado, meses, venc, curso })).toBe(limiteVentana(inscripcion, curso) > 0)
  }
})

test('3. el visor solo dice «no tiene lecciones» cuando de verdad no tiene', () => {
  expect(textoSinLecciones(0, null, 'curso').texto).toBe('Este curso todavía no tiene lecciones.')
  expect(textoSinLecciones(8, { motivo: 'sin_contenido' }, 'diplomado').texto).toBe('Este diplomado todavía no tiene lecciones.')
  const espera = textoSinLecciones(38, { motivo: 'sin_apertura' }, 'curso')
  expect(espera.texto).toMatch(/todavía no está abierto/)
  expect(espera.texto).not.toMatch(/no tiene lecciones/)
  expect(espera.esperaPago).toBe(true)
  expect(textoSinLecciones(38, { motivo: 'no_vigente' }, 'curso').texto).toMatch(/no está activa/)
  expect(textoSinLecciones(38, { motivo: 'vencida' }, 'curso').texto).toMatch(/venció/)
  expect(textoSinLecciones(38, { motivo: 'no_publicado' }, 'curso').texto).toMatch(/no está disponible/)
  // Sin ventana (datos incompletos) y con lecciones: jamás «no tiene lecciones».
  expect(textoSinLecciones(38, null, 'curso').texto).not.toMatch(/no tiene lecciones/)
})

test('4. el visor usa el motivo y pinta los módulos por abrir; ya no escribe la frase a mano', () => {
  const page = sinComentarios(leer('src/app/(cursos)/cursos/[id]/page.tsx'))
  expect(page).not.toContain('todavía no tiene lecciones')
  expect(page).toContain('textoSinLecciones(detalle.totalLecciones, detalle.ventana, curso.tipo)')
  expect(page).toMatch(/ventana\.limite > 0 && ventana\.modulos_bloqueados > 0/)
  const data = sinComentarios(leer('src/lib/cursos/alumno-data.ts'))
  expect(data).toContain('motivo: motivoBloqueo({ inscripcion, curso: cursoV, modulosTotales: totales })')
})

test('5. «Activado» sale de la ventana real, no de que exista la fila (Bug 106)', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  expect(api).toContain("import { limiteVentana } from '@/lib/cursos/acceso'")
  expect(api).toMatch(/limiteVentana\(ya\.get\(id\), cursos\.get\(id\)\) > 0/)
  expect(api).toContain('curso_activado:          inscritoEnTodos && conAcceso')
  expect(api).toContain('curso_acceso_pendiente:  inscritoEnTodos && !conAcceso')
  const page = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(page.match(/Acceso pendiente/g)?.length).toBe(2) // móvil y tabla
  expect(page).not.toContain('✓ Curso activado')
})

test('6. el formulario del curso ya no promete que el contenido «se libera solo»', () => {
  const form = leer('src/components/admin/cursos/CursoDatosForm.tsx')
  expect(form).not.toContain('para liberar contenido solo')
  expect(form).toMatch(/PAGO ÚNICO[^"]*mensualidad en 0/)
})
