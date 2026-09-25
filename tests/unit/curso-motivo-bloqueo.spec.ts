import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { limiteVentana, motivoBloqueo, modulosPorAbrir, topeMeses, hayModuloVisible, modulosVisibles, type MotivoBloqueo } from '@/lib/cursos/acceso'
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

test('2. paridad con el candado: motivo null ⇔ ve al menos un módulo (el eje de la RLS)', () => {
  const estados = ['activa', 'completada', 'suspendida', 'cancelada', '', null]
  const cursos = [publicado, { ...publicado, estado: 'borrador' }, { modulos_por_mes: 1, estado: 'publicado' }, { modulos_por_mes: 0, estado: 'publicado' }, null]
  const juegos = [[0, 1, 2, 3, 4], [1, 2, 3, 4, 5]]   // base 0 y base 1 (#204)
  for (const estado of estados) for (const meses of [0, 1, 3, null]) for (const venc of [null, ayer, manana]) for (const curso of cursos) for (const ordenes of juegos) {
    const inscripcion = { meses_desbloqueados: meses, estado, fecha_vencimiento: venc }
    const m = motivoBloqueo({ inscripcion, curso, modulosTotales: ordenes.length, ordenes })
    const ve = modulosVisibles(ordenes.map(orden => ({ orden })), inscripcion, curso).length > 0
    expect(m === null, JSON.stringify({ estado, meses, venc, curso, ordenes })).toBe(ve)
    expect(m === null).toBe(hayModuloVisible(ordenes, limiteVentana(inscripcion, curso)))
  }
  // Sin `ordenes` se queda en la regla de la ventana sola (límite > 0).
  for (const meses of [0, 1]) {
    const inscripcion = { meses_desbloqueados: meses, estado: 'activa' }
    expect(motivoBloqueo({ inscripcion, curso: publicado, modulosTotales: 5 }) === null).toBe(limiteVentana(inscripcion, publicado) > 0)
  }
  // Base 1 con un módulo por mes y 1 mes pagado: ventana 1, nada visible → espera, no «sin lecciones».
  const base1 = { inscripcion: { meses_desbloqueados: 1, estado: 'activa' }, curso: { modulos_por_mes: 1, estado: 'publicado' }, modulosTotales: 5, ordenes: [1, 2, 3, 4, 5] }
  expect(motivoBloqueo(base1)).toBe('sin_apertura')
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
  // Con acceso (motivo null) pero lo abierto sin lecciones: NO es un pago pendiente.
  for (const v of [{ motivo: null }, null]) {
    const r = textoSinLecciones(12, v, 'curso')
    expect(r.esperaPago, JSON.stringify(v)).toBe(false)
    expect(r.texto).not.toMatch(/pago|no está abierto/)
  }
})

test('3b. la banda cuenta con el eje de la RLS (orden < límite) y no promete un mes que no se abre', () => {
  // Base 0, 10 módulos, 2 por mes, 1 mes: ve 0-1, quedan 8, el siguiente con el mes 2.
  const base0 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  expect(modulosPorAbrir({ ordenes: base0, limite: 2, porMes: 2, tope: 5, estado: 'activa' })).toEqual({ bloqueados: 8, proximoMes: 2 })
  // Base 1 (#204), 1 mes: la RLS muestra solo el orden 1 → quedan 9 (antes la banda decía 8).
  const base1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const insc = { meses_desbloqueados: 1, estado: 'activa' }
  const curso = { modulos_por_mes: 2, estado: 'publicado' }
  const lim = limiteVentana(insc, curso)
  const visibles = modulosVisibles(base1.map(orden => ({ orden })), insc, curso).length
  expect(modulosPorAbrir({ ordenes: base1, limite: lim, porMes: 2, tope: 5, estado: 'activa' }).bloqueados).toBe(base1.length - visibles)
  // Base 1 en el tope (5 meses): el orden 10 sigue oculto; la banda lo cuenta y NO promete el mes 6.
  expect(modulosPorAbrir({ ordenes: base1, limite: 10, porMes: 2, tope: 5, estado: 'activa' })).toEqual({ bloqueados: 1, proximoMes: null })
  // duracion_meses = 6 con 13 módulos: el mes 7 no se puede abrir.
  const trece = Array.from({ length: 13 }, (_, i) => i)
  expect(topeMeses(6, 13, 2)).toBe(6)
  expect(modulosPorAbrir({ ordenes: trece, limite: 12, porMes: 2, tope: topeMeses(6, 13, 2), estado: 'activa' })).toEqual({ bloqueados: 1, proximoMes: null })
  // Completada con ventana parcial: curso_abrir_mes solo abre 'activa'.
  expect(modulosPorAbrir({ ordenes: base0, limite: 4, porMes: 2, tope: 5, estado: 'completada' })).toEqual({ bloqueados: 6, proximoMes: null })
  // Espejo de curso_tope_meses: duracion manda; si no, ceil(módulos / por mes); nunca negativo.
  expect(topeMeses(null, 11, 2)).toBe(6)
  expect(topeMeses(null, 10, 0)).toBe(0)
  expect(topeMeses(-3, 10, 2)).toBe(0)
  // «Activado» exige ver al menos un módulo: base 1 con un módulo por mes y 1 mes no ve nada.
  expect(hayModuloVisible(base1, 1)).toBe(false)
  expect(hayModuloVisible(base0, 1)).toBe(true)
  expect(hayModuloVisible(base0, 0)).toBe(false)
})

test('4. el visor usa el motivo y pinta los módulos por abrir; ya no escribe la frase a mano', () => {
  const page = sinComentarios(leer('src/app/(cursos)/cursos/[id]/page.tsx'))
  expect(page).not.toContain('todavía no tiene lecciones')
  expect(page).toContain('textoSinLecciones(detalle.totalLecciones, detalle.ventana, curso.tipo)')
  expect(page).toMatch(/ventana\.limite > 0 && ventana\.modulos_bloqueados > 0/)
  expect(page).toMatch(/Pregúntale a tu escuela/)
  const data = sinComentarios(leer('src/lib/cursos/alumno-data.ts'))
  expect(data).toContain('motivo: motivoBloqueo({ inscripcion, curso: cursoV, modulosTotales: totales, ordenes })')
  // La banda sale de modulosPorAbrir (eje de la RLS + tope), no de «totales − límite».
  expect(data).toContain('modulosPorAbrir({')
  expect(data).toContain('tope: topeMeses(cursoV?.duracion_meses, totales, porMes)')
  expect(data).not.toMatch(/totales - Math\.min\(limite/)
})

test('5. «Activado» sale de la ventana real, no de que exista la fila (Bug 106)', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  expect(api).toContain("import { limiteVentana, hayModuloVisible } from '@/lib/cursos/acceso'")
  expect(api).toMatch(/hayModuloVisible\(ordenes\.get\(id\) \?\? \[\], limiteVentana\(ya\.get\(id\), cursos\.get\(id\)\)\)/)
  expect(api).toContain('curso_activado:          inscritoEnTodos && conAcceso')
  expect(api).toContain('curso_acceso_pendiente:  inscritoEnTodos && !conAcceso')
  const page = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(page.match(/>\s*Acceso pendiente\s*</g)?.length).toBe(4) // móvil y tabla, con y sin enlace
  expect(page).not.toContain('✓ Curso activado')
  // El botón ya no promete «Activar»: asignar crea la inscripción, no abre el acceso.
  // Ni texto ni título «Activar» (los nombres internos activarCurso y setActivando no cuentan).
  expect(page).not.toMatch(/\bActivar\b|\bActivando\b|No se pudo activar|al activar el curso/)
  expect(page.match(/'Asignando…' : 'Asignar'/g)?.length).toBe(2)
})

test('5b. el SECRETARIO no recibe botón ni enlace a /admin/cursos (lo manda a /alumno)', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  expect(api).toContain('const esAdmin = await checkAdmin(user.id)')
  expect(api.match(/anexarCursoIngreso\(admin, \w+, esAdmin\)/g)?.length).toBe(3)
  expect(api).toContain('curso_puede_gestionar:   puedeGestionar')
  const page = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  // Cada enlace y cada botón de curso van detrás de curso_puede_gestionar.
  expect(page.match(/a\.curso_acceso_pendiente && a\.curso_puede_gestionar \? \(\s*<a href=\{a\.curso_solicitado_ids/g)?.length).toBe(2)
  expect(page.match(/a\.curso_puede_gestionar \? \(\s*<button\s+onClick=\{\(\) => activarCurso\(a\)\}/g)?.length).toBe(2)
  expect(page.match(/onClick=\{\(\) => activarCurso\(a\)\}/g)?.length).toBe(2)
})

test('6. el formulario del curso ya no promete que el contenido «se libera solo»', () => {
  const form = leer('src/components/admin/cursos/CursoDatosForm.tsx')
  expect(form).not.toContain('para liberar contenido solo')
  expect(form).toMatch(/PAGO ÚNICO[^"]*mensualidad en 0/)
  // El precio que cobra /register en los cursos de ingreso sale de config.ts, no de este campo.
  expect(form).not.toContain('como los de ingreso')
})
