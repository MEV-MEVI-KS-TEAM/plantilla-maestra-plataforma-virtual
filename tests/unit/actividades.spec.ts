import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  aFraccion, calificar, calificarNumero, enOrden, huecoCorrecto, leerNumero, normalizarTexto, ordenInicial,
  opcionesRelacionar, totalEvaluable, type EstadoActividad,
} from '@/components/actividades/corregir'
import type {
  Actividad, ActividadesUnidad, Completar, Numerico, OpcionMultiple, Ordenar, Relacionar, VerdaderoFalso,
} from '@/components/actividades/tipos'
import { NOMBRE_TIPO } from '@/components/actividades/tipos'
import { faltanColumnasActividades, leerActividades, urlPdf, vistaActividades } from '@/components/actividades/datos'
import { BotonDescargaPdf } from '@/components/actividades/Descargas'
import SeccionActividades from '@/components/actividades/SeccionActividades'

/**
 * Actividades interactivas + PDF (migración 20261021120000_actividades_pdf.sql).
 *
 *   A. Corrección de CADA tipo con unidades REALES del sistema de actividades
 *      (tests/unit/fixtures/actividades/: Secundaria, curso EXANI-II y
 *      licenciatura en Derecho).
 *   B. Sin datos no se pinta NADA (ni títulos vacíos ni botones muertos).
 *   C. Contrato de base de datos: migración idempotente, espejos, seed de
 *      Sec/Prepa en setup.sql y las API que lo leen con respaldo sin migración.
 */

const raiz = process.cwd()
const leer = (f: string) => readFileSync(join(raiz, f), 'utf8')
const DIR_FIX = 'tests/unit/fixtures/actividades'
const UNIDADES: { archivo: string; datos: ActividadesUnidad }[] = readdirSync(join(raiz, DIR_FIX))
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(archivo => ({ archivo, datos: JSON.parse(leer(`${DIR_FIX}/${archivo}`)) as ActividadesUnidad }))

const unidad = (parte: string) => {
  const u = UNIDADES.find(x => x.archivo.includes(parte))
  if (!u) throw new Error(`falta la unidad de prueba ${parte}`)
  return u.datos
}
function actividad<T extends Actividad['tipo']>(u: ActividadesUnidad, tipo: T): Extract<Actividad, { tipo: T }> {
  const a = u.actividades.find(x => x.tipo === tipo)
  if (!a) throw new Error(`${u.unidad.id} no trae ${tipo}`)
  return a as Extract<Actividad, { tipo: T }>
}

/** Lo que contestaría quien se lo sabe todo (la PRIMERA respuesta aceptada en cada hueco). */
function contestarBien(a: Actividad): EstadoActividad {
  const r: Record<string, string> = {}
  switch (a.tipo) {
    case 'opcion_multiple': a.items.forEach(q => (r[q.id] = String(q.correcta))); break
    case 'verdadero_falso': a.items.forEach(it => (r[it.id] = it.respuesta ? 'v' : 'f')); break
    case 'relacionar': a.pares.forEach(p => (r[p.id] = p.derecha)); break
    case 'completar': a.items.forEach(it => it.respuestas.forEach((acept, k) => (r[`${it.id}/${k}`] = acept[0]))); break
    case 'numerico':
      a.ejercicios.forEach(ej => {
        const f = ej.formato === 'fraccion' && !Number.isInteger(ej.respuesta) ? aFraccion(ej.respuesta) : null
        r[ej.id] = f ? `${f[0]}/${f[1]}` : String(ej.respuesta)
      })
      break
    case 'ordenar': return { r, revisada: true, orden: a.elementos.map((_, i) => i) }
    case 'abierta': break
  }
  return { r, revisada: true }
}

// ═══════════════════════════ A. Corrección ═══════════════════════════

test('A0. las unidades de prueba son reales y cubren los 7 tipos', () => {
  expect(UNIDADES.length).toBeGreaterThanOrEqual(4)
  const tipos = new Set(UNIDADES.flatMap(u => u.datos.actividades.map(a => a.tipo)))
  expect([...tipos].sort()).toEqual(Object.keys(NOMBRE_TIPO).sort())
  for (const { archivo, datos } of UNIDADES) {
    expect(leerActividades(datos), archivo).not.toBeNull()
    expect(datos.unidad.id, archivo).toMatch(/^(secundaria|preparatoria|cursos-ingreso|licenciaturas)\//)
  }
})

test('A1. todo bien contestado = todo correcto, en CADA actividad de CADA unidad real', () => {
  for (const { archivo, datos } of UNIDADES) {
    for (const a of datos.actividades) {
      const cal = calificar(a, contestarBien(a), datos.unidad.id)
      const donde = `${archivo} · ${a.id} (${a.tipo})`
      expect(cal.total, donde).toBe(totalEvaluable(a))
      expect(cal.correctas, donde).toBe(cal.total)
      expect(Object.values(cal.porCampo).every(Boolean), donde).toBe(true)
    }
    // La autoevaluación: la clave apunta a una opción que existe.
    for (const q of datos.autoevaluacion.reactivos) {
      expect(q.correcta, `${archivo} · auto ${q.id}`).toBeGreaterThanOrEqual(0)
      expect(q.correcta, `${archivo} · auto ${q.id}`).toBeLessThan(q.opciones.length)
    }
  }
})

test('A2. nada contestado = cero, sin reventar, en cada actividad real', () => {
  for (const { archivo, datos } of UNIDADES) {
    for (const a of datos.actividades) {
      if (a.tipo === 'ordenar') continue // sin tocar, «ordenar» parte de un revuelto (ver A6)
      const cal = calificar(a, { r: {}, revisada: true }, datos.unidad.id)
      expect(cal.correctas, `${archivo} · ${a.id}`).toBe(0)
    }
  }
})

test('A3. opción múltiple (Matemáticas 1 de Secundaria): una equivocada resta exactamente una', () => {
  const u = unidad('secundaria-matematicas'), a = actividad(u, 'opcion_multiple') as OpcionMultiple
  const e = contestarBien(a)
  const q = a.items[0]
  e.r[q.id] = String((q.correcta + 1) % q.opciones.length)
  const cal = calificar(a, e, u.unidad.id)
  expect(cal.porCampo[q.id]).toBe(false)
  expect(cal.correctas).toBe(a.items.length - 1)
})

test('A4. verdadero o falso (EXANI-II): invertir una respuesta la marca mal', () => {
  const u = unidad('leccion-01'), a = actividad(u, 'verdadero_falso') as VerdaderoFalso
  const e = contestarBien(a)
  const it = a.items[0]
  e.r[it.id] = it.respuesta ? 'f' : 'v'
  const cal = calificar(a, e, u.unidad.id)
  expect(cal.porCampo[it.id]).toBe(false)
  expect(cal.correctas).toBe(a.items.length - 1)
})

test('A5. relacionar (Matemáticas 1): elegir el distractor falla; las opciones traen todos los pares y distractores', () => {
  const u = unidad('secundaria-matematicas'), a = actividad(u, 'relacionar') as Relacionar
  const opciones = opcionesRelacionar(a, u.unidad.id)
  expect([...opciones].sort()).toEqual([...a.pares.map(p => p.derecha), ...(a.distractores ?? [])].sort())
  // Determinista: el mismo revuelto en pantalla, en el PDF y aquí.
  expect(opcionesRelacionar(a, u.unidad.id)).toEqual(opciones)
  const e = contestarBien(a)
  expect(a.distractores?.length).toBeGreaterThan(0)
  e.r[a.pares[0].id] = a.distractores![0]
  const cal = calificar(a, e, u.unidad.id)
  expect(cal.porCampo[a.pares[0].id]).toBe(false)
  expect(cal.correctas).toBe(a.pares.length - 1)
})

test('A6. ordenar (EXANI-II, lección 3): revuelto inicial sin pistas, al revés = 0, en orden = todo', () => {
  const u = unidad('leccion-03'), a = actividad(u, 'ordenar') as Ordenar
  const n = a.elementos.length
  const inicial = ordenInicial(a, u.unidad.id)
  expect([...inicial].sort()).toEqual(a.elementos.map((_, i) => i))
  expect(inicial.some((v, i) => v === i), 'ningún elemento empieza en su lugar').toBe(false)
  expect(ordenInicial(a, u.unidad.id)).toEqual(inicial)
  const alReves = a.elementos.map((_, i) => n - 1 - i)
  expect(enOrden(alReves).size).toBe(0)
  expect(calificar(a, { r: {}, revisada: true, orden: alReves }, u.unidad.id).correctas).toBe(n % 2) // solo el del centro, si n es impar
  expect(calificar(a, { r: {}, revisada: true, orden: a.elementos.map((_, i) => i) }, u.unidad.id).correctas).toBe(n)
})

test('A7. completar (Derecho): sin acentos, mayúsculas ni punto final también vale; otra palabra no', () => {
  const u = unidad('derecho'), a = actividad(u, 'completar') as Completar
  const it = a.items[0]
  expect(it.respuestas[0]).toContain('coacción')
  expect(huecoCorrecto(it.respuestas[0], 'COACCION.')).toBe(true)
  expect(huecoCorrecto(it.respuestas[0], '  La Coacción  ')).toBe(true)
  expect(huecoCorrecto(it.respuestas[0], 'doctrina')).toBe(false)
  expect(huecoCorrecto(it.respuestas[0], '')).toBe(false)
  expect(normalizarTexto('¿Coacción?')).toBe('coaccion')
  const e = contestarBien(a)
  e.r[`${it.id}/0`] = 'la doctrina'
  expect(calificar(a, e, u.unidad.id).porCampo[`${it.id}/0`]).toBe(false)
})

test('A8. numérico (Matemáticas 1): el error típico se reconoce y explica; formatos de captura mexicanos', () => {
  const u = unidad('secundaria-matematicas'), a = actividad(u, 'numerico') as Numerico
  const ej = a.ejercicios[0]
  expect(calificarNumero(ej, String(ej.respuesta)).ok).toBe(true)
  expect(ej.error_tipico).toBeDefined()
  const tipico = calificarNumero(ej, String(ej.error_tipico))
  expect(tipico.ok).toBe(false)
  expect(tipico.nota).toBe(ej.error_tipico_msg)
  expect(calificarNumero(ej, 'ochenta')).toEqual({ ok: false, nota: 'No se reconoce como número.' })
  expect(calificarNumero(ej, '').ok).toBe(false)
  // Punto decimal y coma de miles (México); fracciones, mixtos y porcentaje.
  expect(leerNumero('1,250.75')).toBe(1250.75)
  expect(leerNumero('0.125')).toBe(0.125)
  expect(leerNumero('3,5')).toBe(3.5)
  expect(leerNumero('3/4')).toBe(0.75)
  expect(leerNumero('-1 1/2')).toBe(-1.5)
  expect(leerNumero('25 %')).toBe(25)
  expect(leerNumero('abc')).toBeNull()
})

test('A9. numérico con formato fracción: se pide simplificada', () => {
  const ej = { id: 'x', enunciado: '', respuesta: 0.75, tolerancia: 0, formato: 'fraccion' as const, pasos: ['3/4'], verif: '' }
  expect(calificarNumero(ej, '3/4').ok).toBe(true)
  expect(calificarNumero(ej, '6/8').nota).toMatch(/simplificar/)
  expect(calificarNumero(ej, '0.75').nota).toMatch(/fracción/)
})

test('A10. respuesta abierta (Derecho): no se califica sola (se compara con la respuesta modelo)', () => {
  const u = unidad('derecho'), a = actividad(u, 'abierta')
  expect(totalEvaluable(a)).toBe(0)
  const cal = calificar(a, { r: { texto: 'cualquier cosa' }, revisada: true }, u.unidad.id)
  expect(cal).toMatchObject({ correctas: 0, total: 0 })
  expect(a.respuesta_modelo.length).toBeGreaterThan(0)
  expect(a.criterios.length).toBeGreaterThan(0)
})

// ═══════════════════════════ B. Sin datos, nada ═══════════════════════════

// Playwright compila el JSX de los .tsx que importa una prueba a objetos propios
// ({ __pw_type: 'jsx' }), no a elementos de React (ver bunny-stream.spec.ts). Se
// convierten, también los componentes anidados, a elementos reales.
const envueltos = new Map<unknown, unknown>()
function aReact(n: unknown): unknown {
  if (Array.isArray(n)) return n.map(aReact)
  if (n && typeof n === 'object' && (n as { __pw_type?: string }).__pw_type === 'jsx') {
    const { type, props, key } = n as { type: unknown; props: Record<string, unknown>; key?: string }
    const p: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props ?? {})) p[k] = aReact(v)
    return createElement(envolver(type) as string, { ...p, key })
  }
  return n
}
function envolver(t: unknown): unknown {
  if (typeof t !== 'function' || (t as { prototype?: { isReactComponent?: unknown } }).prototype?.isReactComponent) return t
  if (!envueltos.has(t)) {
    const fn = t as (p: unknown) => unknown
    envueltos.set(t, (p: unknown) => aReact(fn(p)))
  }
  return envueltos.get(t)
}
const html = (componente: unknown, props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(envolver(componente) as (p: unknown) => ReactElement, props))

const PDF = 'https://aula-recursos.b-cdn.net/actividades/secundaria/matematicas-1/semana-01.pdf'

test('B1. la semana / lección SIN actividades ni PDF no pinta nada', () => {
  for (const actividades of [null, undefined, '', {}, [], 'texto', { esquema: 'otro/1' }, 42]) {
    for (const pdfUrl of [null, undefined, '', '   ', 'javascript:alert(1)', 'http://inseguro.mx/a.pdf', '/relativa.pdf']) {
      expect(vistaActividades(actividades, pdfUrl)).toEqual({ tipo: 'nada' })
      expect(html(SeccionActividades, { actividades, pdfUrl })).toBe('')
    }
  }
})

test('B2. JSON a medias (sin unidad, sin autoevaluación, sin nada que hacer) = no hay actividades', () => {
  const u = unidad('secundaria-matematicas')
  expect(leerActividades({ ...u, unidad: undefined })).toBeNull()
  expect(leerActividades({ ...u, autoevaluacion: undefined })).toBeNull()
  expect(leerActividades({ ...u, actividades: [{ tipo: 'opcion_multiple' }] })).toBeNull()
  expect(leerActividades({ ...u, actividades: [], autoevaluacion: { reactivos: [] } })).toBeNull()
  // Guardado como texto JSON también se lee.
  expect(leerActividades(JSON.stringify(u))?.unidad.id).toBe(u.unidad.id)
})

test('B3. solo PDF: un único botón «Descargar PDF» (pestaña nueva, noopener), sin el componente', () => {
  expect(vistaActividades(null, PDF)).toEqual({ tipo: 'solo-pdf', pdfUrl: PDF })
  const h = html(SeccionActividades, { actividades: null, pdfUrl: PDF })
  expect(h).toContain('data-actividades="solo-pdf"')
  expect(h).toContain(`href="${PDF}"`)
  expect(h).toContain('target="_blank"')
  expect(h).toMatch(/rel="noopener[^"]*"/)
  expect(h).toContain('Descargar PDF')
  expect(h).not.toContain('data-actividades="interactivas"')
  expect((h.match(/<a /g) ?? []).length).toBe(1)
})

test('B4. con actividades: se monta el componente con su PDF (o sin botón si no hay PDF)', () => {
  const u = unidad('secundaria-matematicas')
  const v = vistaActividades(u, PDF)
  expect(v.tipo).toBe('actividades')
  if (v.tipo === 'actividades') {
    expect(v.datos.unidad.id).toBe(u.unidad.id)
    expect(v.pdfUrl).toBe(PDF)
  }
  const sinPdf = vistaActividades(u, null)
  expect(sinPdf.tipo === 'actividades' && sinPdf.pdfUrl).toBeNull()
  // El componente no pinta el botón sin pdfUrl.
  expect(leer('src/components/actividades/Actividades.tsx')).toMatch(/\{pdfUrl && \(\s*<a className=\{s\.botonSecundario\} href=\{pdfUrl\} target="_blank" rel="noopener"/)
})

test('B5. «Descargar cuaderno completo»: solo con https válida', () => {
  for (const url of [null, undefined, '', 'ftp://x/y.pdf', 'javascript:void(0)', 'no es url']) {
    expect(html(BotonDescargaPdf, { url, texto: 'Descargar cuaderno completo', marca: 'cuaderno' })).toBe('')
  }
  const cuaderno = 'https://aula-recursos.b-cdn.net/actividades/secundaria/matematicas-1/cuaderno-completo.pdf'
  const h = html(BotonDescargaPdf, { url: cuaderno, texto: 'Descargar cuaderno completo', marca: 'cuaderno' })
  expect(h).toContain(`href="${cuaderno}"`)
  expect(h).toContain('target="_blank"')
  expect(h).toContain('rel="noopener"')
  expect(h).toContain('data-descarga="cuaderno"')
  expect(h).toContain('Descargar cuaderno completo')
  // Colores de «Personalizar mi página», nada fijo.
  expect(h).toContain('var(--color-acento-texto)')
  expect(urlPdf(' https://a.b/c.pdf ')).toBe('https://a.b/c.pdf')
})

test('B6. las pantallas solo pintan el cuaderno si la URL es válida (sin contenedor vacío)', () => {
  for (const f of ['src/app/(dashboard)/alumno/materia/[id]/page.tsx', 'src/components/cursos/AulaCurso.tsx']) {
    const s = leer(f)
    expect(s, f).toMatch(/\{urlPdf\((materia|curso)\.cuaderno_pdf_url\) && \(/)
    expect(s, f).toContain('texto="Descargar cuaderno completo"')
    expect(s, f).toMatch(/<SeccionActividades\s/)
  }
})

// ═══════════════════════════ C. Contrato de base de datos ═══════════════════════════

const MIGRACION = 'supabase/migrations/20261021120000_actividades_pdf.sql'
const sinComentarios = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '')
const COLUMNAS: [string, string, string][] = [
  ['semanas', 'actividades', 'jsonb'],
  ['semanas', 'actividades_pdf_url', 'text'],
  ['materias', 'cuaderno_pdf_url', 'text'],
  ['curso_lecciones', 'actividades', 'jsonb'],
  ['curso_lecciones', 'actividades_pdf_url', 'text'],
  ['cursos', 'cuaderno_pdf_url', 'text'],
]

test('C1. la migración agrega las 6 columnas NULL, idempotente, sin políticas nuevas, y recarga PostgREST', () => {
  const sql = sinComentarios(leer(MIGRACION))
  for (const [tabla, col, tipo] of COLUMNAS) {
    expect(sql, `${tabla}.${col}`).toMatch(new RegExp(
      `ALTER TABLE public\\.${tabla} ADD COLUMN IF NOT EXISTS ${col} ${tipo} NULL;`))
  }
  expect(sql).not.toMatch(/\bDEFAULT\b/i)
  expect(sql).not.toMatch(/CREATE POLICY|DROP POLICY|ALTER POLICY|GRANT |REVOKE /i)
  // El módulo de Cursos es opcional: sus tablas solo se tocan si existen.
  expect(sql).toContain("to_regclass('public.curso_lecciones') IS NOT NULL")
  expect(sql).toContain("to_regclass('public.cursos') IS NOT NULL")
  expect(sql).toMatch(/NOTIFY pgrst, 'reload schema';/)
  // El encabezado deja explícito el acceso (RLS heredado, sin escritura nueva).
  const cabecera = leer(MIGRACION).split('BEGIN;')[0]
  expect(cabecera).toContain('NO SE AGREGA NI SE CAMBIA NINGUNA POLÍTICA')
  expect(cabecera).toContain('tieneAccesoMateria')
})

test('C2. espejos: scripts/schema.sql, supabase/schema.sql, schema-01-tablas y el módulo de Cursos', () => {
  const tablaEn = (sql: string, tabla: string) =>
    sinComentarios(sql).match(new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?public\\.${tabla} \\(([\\s\\S]*?)\\n\\s*\\);`))?.[1] ?? ''
  for (const f of ['scripts/schema.sql', 'supabase/schema.sql', 'supabase/schema-01-tablas.sql']) {
    const sql = leer(f)
    expect(tablaEn(sql, 'semanas'), `${f} semanas`).toMatch(/\bactividades\s+jsonb/i)
    expect(tablaEn(sql, 'semanas'), `${f} semanas`).toMatch(/\bactividades_pdf_url\s+text/i)
    expect(tablaEn(sql, 'materias'), `${f} materias`).toMatch(/\bcuaderno_pdf_url\s+text/i)
  }
  const cursos = leer('scripts/migracion-cursos-diplomados.sql')
  expect(tablaEn(cursos, 'cursos')).toMatch(/\bcuaderno_pdf_url\s+TEXT/)
  expect(tablaEn(cursos, 'curso_lecciones')).toMatch(/\bactividades\s+JSONB/)
  expect(tablaEn(cursos, 'curso_lecciones')).toMatch(/\bactividades_pdf_url\s+TEXT/)
  for (const [tabla, col] of COLUMNAS.slice(3)) {
    expect(cursos, `${tabla}.${col} para bases con el módulo ya instalado`).toMatch(
      new RegExp(`ALTER TABLE public\\.${tabla}\\s+ADD COLUMN IF NOT EXISTS ${col}\\s`))
  }
})

test('C3. setup.sql siembra las actividades de Sec/Prepa DESPUÉS de seed-contenido-ivs.sql', () => {
  const setup = sinComentarios(leer('scripts/setup.sql'))
  const ivs = setup.indexOf('\\i seed-contenido-ivs.sql')
  const act = setup.indexOf('\\i seed-actividades-sec-prepa.sql')
  expect(ivs).toBeGreaterThan(-1)
  expect(act).toBeGreaterThan(ivs)
  expect(act).toBeLessThan(setup.indexOf('\\i seed-demo-materia.sql'))
  // Cursos y licenciaturas se siembran desde sus bancos, no desde aquí.
  expect(setup).not.toMatch(/curso_lecciones|cuaderno_pdf_url/)
})

test('C4. el seed de Sec/Prepa: solo UPDATE por id de las columnas del contrato, idempotente', () => {
  const seed = leer('scripts/seed-actividades-sec-prepa.sql')
  expect(seed.startsWith('-- Actividades interactivas y PDF — banco Sec/Prepa')).toBe(true)
  // Sentencias (inicio de línea), no el texto de las actividades: nada fuera de UPDATE / ALTER ADD COLUMN.
  expect(seed.match(/^\s*(INSERT|DELETE|TRUNCATE|DROP|CREATE|GRANT|REVOKE)\b.*$/gim) ?? []).toEqual([])
  expect((seed.match(/^ALTER TABLE .*$/gm) ?? []).every(l => / ADD COLUMN IF NOT EXISTS /.test(l))).toBe(true)
  const updates = [...seed.matchAll(/^UPDATE public\.(\w+) SET (.+?) WHERE id = '[0-9a-f-]{36}';$/gm)]
  expect(updates.length).toBeGreaterThanOrEqual(192 + 24)
  const semanas = updates.filter(m => m[1] === 'semanas')
  const materias = updates.filter(m => m[1] === 'materias')
  expect(semanas.length + materias.length).toBe(updates.length)
  expect(materias.every(m => /^cuaderno_pdf_url = 'https:\/\/aula-recursos\.b-cdn\.net\/actividades\/(secundaria|preparatoria)\/[a-z0-9-]+\/cuaderno-completo\.pdf'$/.test(m[2]))).toBe(true)
  expect(semanas.every(m => m[2].startsWith('actividades = $act${"esquema":"actividades/1"'))).toBe(true)
  // Toda fila que actualiza existe en el seed base que la inserta (si no, actualizaría 0 filas).
  const base = leer('scripts/seed-contenido-ivs.sql')
  const ids = new Set([...seed.matchAll(/WHERE id = '([0-9a-f-]{36})';$/gm)].map(m => m[1]))
  const faltan = [...ids].filter(id => !base.includes(id))
  expect(faltan).toEqual([])
})

test('C5. las API leen las columnas con respaldo para bases sin la migración (42703)', () => {
  const materia = leer('src/app/api/alumno/materia/[id]/route.ts')
  expect(materia).toContain(' actividades, actividades_pdf_url,')
  expect(materia).toContain('cuaderno_pdf_url')
  expect((materia.match(/faltanColumnasActividades\(/g) ?? []).length).toBe(2)
  const lecciones = leer('src/lib/cursos/alumno-data.ts')
  expect(lecciones).toContain('actividades, actividades_pdf_url')
  expect(lecciones).toContain('faltanColumnasActividades(')
  const curso = leer('src/app/api/alumno/cursos/[id]/route.ts')
  expect(curso).toContain('cuaderno_pdf_url')
  expect(curso).toContain('faltanColumnasActividades(')

  expect(faltanColumnasActividades({ code: '42703', message: 'column semanas_1.actividades does not exist' })).toBe(true)
  expect(faltanColumnasActividades({ code: 'PGRST204', message: '' })).toBe(true)
  expect(faltanColumnasActividades({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })).toBe(false)
  expect(faltanColumnasActividades(null)).toBe(false)
})

test('C6. el componente usa solo variables de color ya declaradas en layout.tsx', () => {
  const css = leer('src/components/actividades/Actividades.module.css')
  const layout = leer('src/app/layout.tsx')
  const usadas = new Set([...css.matchAll(/var\(\s*(--color-[a-z0-9-]+)/g)].map(m => m[1]))
  expect(usadas.size).toBeGreaterThan(5)
  for (const v of usadas) expect(layout, v).toContain(`'${v}':`)
})
