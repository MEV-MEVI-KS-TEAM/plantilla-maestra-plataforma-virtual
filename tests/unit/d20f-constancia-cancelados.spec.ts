import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cursosConConstancia, repartirInscripciones, type ResumenPagosCurso } from '@/lib/cursos/pagos-alumno'

/**
 * Bloque D · D20f — respuesta de Kevin a la parada de D20: un egresado cuya
 * inscripción se canceló sigue viendo su constancia YA emitida. En «Cursos
 * cancelados» sale el enlace a /cursos/[id]/constancia solo si existe (no se
 * puede emitir otra: el servidor niega el folio a una cancelada desde D20b).
 * Una cancelada SIN pagos pero CON constancia (becado) también va al bloque.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const pago = (pagado: number): ResumenPagosCurso => ({ pagado, ultimo: null })

test('1. el reparto: una cancelada con constancia va al bloque aunque no haya pagado', () => {
  const filas = [
    { id: 'i1', curso_id: 'c1', estado: 'activa' },
    { id: 'i2', curso_id: 'c2', estado: 'cancelada' }, // pagó
    { id: 'i3', curso_id: 'c3', estado: 'cancelada' }, // becado con constancia
    { id: 'i4', curso_id: 'c4', estado: 'cancelada' }, // ni pagó ni constancia
  ]
  const pagos = new Map([['c2', pago(1500)]])
  const r = repartirInscripciones(filas, pagos, new Set(['c3']))
  expect(r).toEqual({ vigentes: ['c1'], canceladas: ['c2', 'c3'] })
  // Sin el tercer argumento (compatibilidad), como antes: solo con pagos.
  expect(repartirInscripciones(filas, pagos)).toEqual({ vigentes: ['c1'], canceladas: ['c2'] })
})

test('2. cursosConConstancia: solo sus inscripciones CANCELADAS', () => {
  const filas = [
    { id: 'i1', curso_id: 'c1', estado: 'activa' },
    { id: 'i3', curso_id: 'c3', estado: 'cancelada' },
  ]
  const s = cursosConConstancia(filas, [
    { inscripcion_id: 'i1' },     // vigente: no es de este bloque
    { inscripcion_id: 'i3' },
    { inscripcion_id: 'otra' },   // no es suya
    { inscripcion_id: null },
  ])
  expect([...s]).toEqual(['c3'])
})

test('3. la API: lee las constancias con la SESIÓN y las pasa al reparto y al bloque', () => {
  const r = sinComentarios(leer('src/app/api/alumno/cursos/route.ts'))
  expect(r).toContain("await supabase\n        .from('curso_constancias')\n        .select('inscripcion_id')\n        .in('inscripcion_id', idsCanceladas)")
  expect(r).not.toMatch(/admin\s*\.from\('curso_constancias'\)/)
  expect(r).toContain('repartirInscripciones(filas, pagosPorCurso, conConstancia)')
  expect(r).toContain('if (!pagos && !constancia) continue')
  expect(r).toContain('cancelados.push({ id: c.id as string, nombre: c.nombre as string, tipo: c.tipo as CursoTipo, pagos, constancia })')
  // El menú, con la misma regla.
  const t = sinComentarios(leer('src/app/api/alumno/cursos/tiene/route.ts'))
  expect(t).toContain('repartirInscripciones(filas, pagos, conConstancia)')
  // También con la SESIÓN (la RLS da solo las suyas), nunca con el cliente admin.
  expect(t).toContain("await supabase\n        .from('curso_constancias')\n        .select('inscripcion_id')\n        .in('inscripcion_id', idsCanceladas)")
  for (const src of [r, t]) expect(src).not.toMatch(/(admin|createAdminClient\(\))\s*\.from\('curso_constancias'\)/)
})

test('4. la página: «Ver mi constancia» solo con constancia, y sin pagos no pinta «Pagado»', () => {
  const p = sinComentarios(leer('src/app/(dashboard)/alumno/cursos/page.tsx'))
  const bloque = p.slice(p.indexOf('Cursos cancelados'))
  expect(bloque).toContain('{c.constancia && (')
  expect(bloque).toContain('href={`/cursos/${c.id}/constancia`}')
  expect(bloque).toContain('Ver mi constancia')
  expect(bloque).toContain('{resumenPagosCurso(c.pagos, fmtCurso) && (')
  expect(leer('src/types/cursos-alumno.ts')).toContain('constancia: boolean')
})
