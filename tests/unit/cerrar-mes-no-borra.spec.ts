import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { armarBoletin, resumirBoletin } from '@/lib/boletin'
import type { AlumnoAcceso, MateriaVentana } from '@/lib/acceso-materias'

/**
 * Candado: `cerrar-mes` NO borra avance del alumno.
 *
 * La ruta hacía cuatro DELETE duros —quiz_respuestas, progreso_semanas,
 * intentos_evaluacion y calificaciones— sin respaldo, sin bitácora y sin
 * filtrar `acreditado`, así que se llevaba materias YA GANADAS. Medido en IVS
 * con `pg_stat_statements` (reset 2026-04-01, o sea toda la vida del proyecto):
 * 6 ejecuciones, 7 calificaciones y 7 intentos destruidos. El alumno
 * IVS-2026-0020 acreditó los meses 1 y 3-6 el 01-may y su mes 2 reapareció con
 * fecha 29-jul: se lo borraron y lo rehizo. Sin PITR ni respaldos, nada de eso
 * se pudo restaurar.
 *
 * Revocar el acceso nunca necesitó borrar: la ventana de `acceso-materias` ya
 * oculta lo no pagado y el canon del Bug 54 respeta la acreditada ganada.
 *
 * REGLA: ninguna acción de admin borra avance del alumno.
 */

const raiz = process.cwd()
// Normaliza CRLF → LF antes de mirar el texto (ver Bug 118).
const leer = (p: string) =>
  readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')

const RUTA_CERRAR_MES = 'src/app/api/admin/alumnos/[id]/cerrar-mes/route.ts'

// ── El candado sobre el código ───────────────────────────────────────────────

test('cerrar-mes no contiene ningún .delete()', () => {
  expect(leer(RUTA_CERRAR_MES)).not.toContain('.delete(')
})

for (const tabla of ['calificaciones', 'intentos_evaluacion', 'progreso_semanas', 'quiz_respuestas']) {
  test(`cerrar-mes no toca ${tabla} más que para leer`, () => {
    const src = leer(RUTA_CERRAR_MES)
    // Si alguna vez vuelve a nombrarse la tabla, que no sea junto a un delete.
    const bloques = src.split('\n\n').filter(b => b.includes(tabla))
    for (const b of bloques) expect(b).not.toContain('.delete(')
  })
}

test('la única escritura de cerrar-mes es meses_desbloqueados', () => {
  const src = leer(RUTA_CERRAR_MES)
  const escrituras = src.match(/\.update\(\{[^}]*\}/g) ?? []
  expect(escrituras).toHaveLength(1)
  expect(escrituras[0]).toContain('meses_desbloqueados')
})

// ── 'Bloqueada': la materia no desaparece al bajar el contador ───────────────

const ALUMNO: AlumnoAcceso = {
  nivel: 'preparatoria',
  modalidad: '6_meses',
  duracion_meses: 6,
  meses_desbloqueados: 2,
  inscripcion_pagada: true,
}

const PLAN: MateriaVentana[] = Array.from({ length: 12 }, (_, i) => ({
  id: `prepa-${i + 1}`,
  nombre: `Materia ${i + 1}`,
  nivel: 'preparatoria',
  orden: i + 1,
  numero_mes: Math.floor(i / 2) + 1,
}))

test('sin la bandera, una materia fuera de la ventana no se lista (constancia)', () => {
  const filas = armarBoletin(ALUMNO, PLAN, [], new Set())
  expect(filas.map(f => f.materia.id)).not.toContain('prepa-12')
  expect(filas.some(f => f.estado === 'Bloqueada')).toBe(false)
})

test('con la bandera, se lista como Bloqueada y conserva su mes', () => {
  const filas = armarBoletin(ALUMNO, PLAN, [], new Set(), true)
  const fila = filas.find(f => f.materia.id === 'prepa-12')
  expect(fila?.estado).toBe('Bloqueada')
  expect(fila?.mes_numero).toBe(6)
  // Ninguna materia del plan se cae de la lista.
  expect(filas).toHaveLength(PLAN.length)
})

test('quitar un mes NO borra materias de la lista: solo cambian de estado', () => {
  const antes   = armarBoletin(ALUMNO, PLAN, [], new Set(), true)
  const despues = armarBoletin({ ...ALUMNO, meses_desbloqueados: 1 }, PLAN, [], new Set(), true)

  expect(despues.map(f => f.materia.id)).toEqual(antes.map(f => f.materia.id))

  const rAntes   = resumirBoletin(antes)
  const rDespues = resumirBoletin(despues)
  expect(rDespues.total_materias_plan).toBe(rAntes.total_materias_plan)
  // Lo que antes era Pendiente pasa a Bloqueada, no a la nada.
  expect(rDespues.materias_pendientes).toBeLessThan(rAntes.materias_pendientes)
  expect(rDespues.materias_bloqueadas).toBeGreaterThan(rAntes.materias_bloqueadas)
  expect(rDespues.materias_pendientes + rDespues.materias_bloqueadas)
    .toBe(rAntes.materias_pendientes + rAntes.materias_bloqueadas)
})

/** La línea de la llamada a `armarBoletin(` en esa ruta. */
const llamadaBoletin = (ruta: string) => {
  const linea = leer(ruta).split('\n').find(l => l.includes('armarBoletin('))
  expect(linea, `${ruta} no llama a armarBoletin`).toBeTruthy()
  return linea!
}

test('la bandera incluirBloqueadas la pide calificaciones y NO la constancia', () => {
  // El 5.º argumento en true. La constancia se queda con el default: ahí una
  // materia sin calificar no existe (canon Bug 54, igual que la demo).
  expect(llamadaBoletin('src/app/api/alumno/calificaciones/route.ts'))
    .toMatch(/acreditadas,\s*true\s*\)/)
  expect(llamadaBoletin('src/app/api/alumno/constancia/route.ts'))
    .not.toMatch(/,\s*true\s*\)/)
})
