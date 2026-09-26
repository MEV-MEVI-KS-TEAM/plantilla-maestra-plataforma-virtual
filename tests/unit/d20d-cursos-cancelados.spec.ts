import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repartirInscripciones } from '@/lib/cursos/pagos-alumno'

/**
 * Bloque D · D20d (remate f) — «Mis Diplomados» sin inscripciones canceladas:
 *  - la cancelada sale de la cuadrícula (no se abre: el visor solo diría «no
 *    está activa»);
 *  - si pagó algo, sale aparte en «Cursos cancelados» con lo pagado;
 *  - sin `estado` (base sin B1) todo es vigente, como antes.
 * No toca SQL ni RLS: el contenido de la cancelada ya se niega (ventana).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const pagado = (n: number) => ({ pagado: n, ultimo: { fecha: '2026-09-12', monto: n } })

test('1. el reparto: la cancelada sale de la cuadrícula y solo va al bloque si pagó', () => {
  const pagos = new Map([['c2', pagado(1500)], ['c4', pagado(300)]])
  const r = repartirInscripciones([
    { id: 'i1', curso_id: 'c1', estado: 'activa' },
    { id: 'i2', curso_id: 'c2', estado: 'cancelada' },   // pagó 1500
    { id: 'i3', curso_id: 'c3', estado: 'cancelada' },   // no pagó: no sale en ningún lado
    { id: 'i4', curso_id: 'c4', estado: 'suspendida' },  // sigue en la cuadrícula
    { id: 'i5', curso_id: 'c5', estado: 'completada' },  // sigue en la cuadrícula
    { id: 'i6', curso_id: 'c6' },                        // base sin B1: vigente
  ], pagos)
  expect(r.vigentes).toEqual(['c1', 'c4', 'c5', 'c6'])
  expect(r.canceladas).toEqual(['c2'])
})

test('1b. sin pagos legibles (falló la lectura) la cancelada no sale; un resumen en 0 no es un pago', () => {
  const r = repartirInscripciones([
    { id: 'i1', curso_id: 'c1', estado: 'cancelada' },
    { id: 'i2', curso_id: 'c2', estado: null },
  ], new Map())
  expect(r).toEqual({ vigentes: ['c2'], canceladas: [] })
  const cero = new Map([['c1', { pagado: 0, ultimo: null }]])
  expect(repartirInscripciones([{ id: 'i1', curso_id: 'c1', estado: 'cancelada' }], cero).canceladas).toEqual([])
})

test('2. la API: lee `estado` sin exigirla, reparte DESPUÉS de los pagos y responde { cursos, cancelados }', () => {
  const r = sinComentarios(leer('src/app/api/alumno/cursos/route.ts'))
  // `*` y no 'id, curso_id, estado': una base sin B1 no tiene la columna.
  expect(r).toMatch(/\.from\('curso_inscripciones'\)\s*\.select\('\*'\)\s*\.eq\('alumno_id', user\.id\)/)
  const reparto = r.indexOf('repartirInscripciones(filas, pagosPorCurso)')
  expect(reparto).toBeGreaterThan(0)
  expect(r.indexOf(".from('pagos')")).toBeGreaterThan(0)
  expect(r.indexOf(".from('pagos')")).toBeLessThan(reparto)
  // La cuadrícula: solo las vigentes, con la sesión (la RLS sigue exigiendo publicado).
  expect(r).toMatch(/await supabase\s*\.from\('cursos'\)\s*\.select\('id, nombre, descripcion, tipo, portada_path, orden, created_at'\)\s*\.in\('id', vigentes\)/)
  expect(r).not.toMatch(/\.in\('id', cursoIds\)/)
  expect(r.indexOf(".in('id', vigentes)")).toBeGreaterThan(reparto)
  // Las canceladas: admin (el curso pudo volver a borrador), solo nombre y tipo.
  expect(r).toMatch(/admin\s*\.from\('cursos'\)\s*\.select\('id, nombre, tipo'\)\s*\.in\('id', canceladas\)/)
  // Siempre un objeto, también sin inscripciones.
  expect(r).toContain('NextResponse.json({ cursos: [], cancelados: [] }')
  expect(r).toContain('NextResponse.json({ cursos: items, cancelados }')
  expect(r).not.toContain('NextResponse.json([])')
  expect(r).not.toContain('NextResponse.json(items)')
})

test('3. la página: «Cursos cancelados» sin enlace y con lo pagado; tolera la respuesta vieja', () => {
  const p = sinComentarios(leer('src/app/(dashboard)/alumno/cursos/page.tsx'))
  expect(p).toContain('setCursos(Array.isArray(json) ? json : Array.isArray(json?.cursos) ? json.cursos : [])')
  expect(p).toContain('setCancelados(Array.isArray(json?.cancelados) ? json.cancelados : [])')
  const i = p.indexOf('Cursos cancelados')
  expect(i).toBeGreaterThan(p.indexOf('router.push('))
  const bloque = p.slice(i)
  expect(bloque).toContain('cancelados.map(')
  expect(bloque).toContain('<TipoBadge tipo={c.tipo} />')
  expect(bloque).toContain('{resumenPagosCurso(c.pagos, fmtCurso)}')
  expect(bloque).toContain('Tu inscripción a estos cursos se canceló. Lo que pagaste queda registrado; si tienes dudas, habla con tu escuela.')
  // No se abre: ni navegación ni botón ni enlace.
  expect(bloque).not.toContain('router.push')
  expect(bloque).not.toContain('<button')
  expect(bloque).not.toContain('href=')
  // Solo cancelados: el vacío no dice «aún no tienes cursos».
  expect(p).toContain("{cancelados.length > 0 ? 'No tienes cursos activos' : 'Aún no tienes cursos asignados'}")
})
