import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ORDEN_SIN_DEFINIR,
  contarVisibles,
  cursoCompletoVisible,
  hayModuloVisible,
  limiteVentana,
  mesDeLiberacion,
  modulosPorAbrir,
  modulosVisibles,
  motivoBloqueo,
  posicionEnCurso,
  posicionesVentana,
  tieneAccesoModulo,
  topeMeses,
} from '@/lib/cursos/acceso'

/**
 * #255 — La ventana de cursos cuenta la POSICIÓN del módulo, no su `orden` crudo.
 *
 * Los seeds de los bancos anteriores al 25-sep-2026 escribieron `orden` en base 1
 * (Bug 238, #204): con el `orden` crudo cada mes abría un módulo menos y el último
 * podía no abrirse nunca, mientras el examen final sí se abría y el reporte decía
 * 10/10. Decisión de Kevin (30-sep-2026): opción 3 con «dense».
 *
 * La paridad TS↔SQL corre contra la FOTO de un Postgres de verdad
 * (tests/unit/fixtures/ventana-255.json), que arma
 * scripts/verificar-schema/paridad-ventana-255.mjs con la cadena de bf7fd7f
 * («antes») y la de este árbol («después»), sembrando con curso_inscribir y
 * curso_abrir_mes y contando con la sesión del alumno (RLS real).
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--.*$/gm, '')
const sinComentariosTs = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const MIG = 'supabase/migrations/20260930120000_fix255_ventana_por_posicion.sql'
// Las migraciones que deciden la ventana: si cambia cualquiera, la foto es vieja.
const DE_LA_VENTANA = [
  'supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql',
  'supabase/migrations/20260730140000_b3_abrir_mes_y_pagos_curso.sql',
  'supabase/migrations/20260730160000_b6_reportes_por_vertical.sql',
  'supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql',
  MIG,
]
const SQL_MAX_INT = 2147483647

interface Caso {
  id: string; n: number; porMes: number; duracion: number | null; forma: string; precio: string; cursoEstado: string
  ordenes: number[]; meses: number; accesoTotal: boolean; estado: string; vence: string | null
  limite: number; tope: number; reporte: number; reporteAntes: number; totales: number
  veAntes: number[]; ve: number[]
}
const FOTO = JSON.parse(leer('tests/unit/fixtures/ventana-255.json')) as { migracionSha256: string; deLaVentana: string[]; casos: Caso[] }
const hoyMas = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)
const inscripcionDe = (c: Caso) => ({
  meses_desbloqueados: c.meses, estado: c.estado, acceso_total: c.accesoTotal,
  fecha_vencimiento: c.vence === 'ayer' ? hoyMas(-1) : c.vence === 'futura' ? hoyMas(30) : null,
})
const cursoDe = (c: Caso) => ({ modulos_por_mes: c.porMes, estado: c.cursoEstado })
const vigente = (c: Caso) => c.cursoEstado === 'publicado' && ['activa', 'completada'].includes(c.estado) && c.vence !== 'ayer'

test('0. la foto SQL es de las migraciones vigentes de la ventana (si cambias una, vuelve a correr el arnés)', () => {
  expect(FOTO.deLaVentana).toEqual(DE_LA_VENTANA)
  const sha = createHash('sha256').update(DE_LA_VENTANA.map(leer).join('\n-- ──\n')).digest('hex')
  expect(FOTO.migracionSha256, 'corre scripts/verificar-schema/paridad-ventana-255.mjs').toBe(sha)
  // La matriz de 216 del diagnóstico está completa dentro de la foto.
  const sub = FOTO.casos.filter(c => ['base0', 'base1', 'hueco'].includes(c.forma)
    && ['mensual', 'unico'].includes(c.precio) && /\|r\d\|/.test(c.id))
  expect(sub.length).toBe(216)
  // …y antes de #255, 86 de esas 216 veían de menos (49 en base 1 y 37 con huecos).
  const malAntes = sub.filter(c => c.veAntes.length !== Math.min(c.accesoTotal ? c.n : c.limite, c.n))
  expect(malAntes.length).toBe(86)
  expect(FOTO.casos.length).toBeGreaterThanOrEqual(504)
})

test('1. PARIDAD TS↔SQL: el techo, lo que ve (módulo por módulo), el reporte y el examen', () => {
  for (const c of FOTO.casos) {
    const insc = inscripcionDe(c)
    const curso = cursoDe(c)
    const lim = limiteVentana(insc, curso)
    // El techo: el de SQL usa max int4 para el acceso total; el TS, ORDEN_SIN_DEFINIR.
    expect(lim === ORDEN_SIN_DEFINIR ? SQL_MAX_INT : lim, c.id).toBe(c.limite)
    // Lo que ve, módulo por módulo (índices dentro del curso).
    const mods = c.ordenes.map((orden, i) => ({ orden, i }))
    expect(modulosVisibles(mods, insc, curso).map(m => m.i), c.id).toEqual(c.ve)
    for (const m of mods) {
      expect(tieneAccesoModulo({ inscripcion: insc, curso, modulo: m, ordenesDelCurso: c.ordenes }), `${c.id} #${m.i}`).toBe(c.ve.includes(m.i))
    }
    // El reporte (sin filtros de estado, como reporte_curso_inscripciones).
    const techoReporte = c.accesoTotal ? ORDEN_SIN_DEFINIR : Math.max(c.meses * c.porMes, 0)
    expect(contarVisibles(c.ordenes, techoReporte), c.id).toBe(c.reporte)
    // Examen final: solo con el curso COMPLETO a la vista.
    expect(cursoCompletoVisible(c.ordenes, lim), c.id).toBe(c.ve.length === c.n && lim > 0)
    // «Activado» / motivo del visor: con el mismo eje.
    expect(hayModuloVisible(c.ordenes, lim), c.id).toBe(c.n === 0 ? lim > 0 : c.ve.length > 0)
    if (c.n > 0) expect(motivoBloqueo({ inscripcion: insc, curso, modulosTotales: c.n, ordenes: c.ordenes }) === null, c.id).toBe(c.ve.length > 0)
    // La banda «Quedan N por abrir» cuenta los que no ve.
    const banda = modulosPorAbrir({ ordenes: c.ordenes, limite: lim, porMes: c.porMes, tope: topeMeses(c.duracion, c.n, c.porMes), estado: c.estado })
    expect(banda.bloqueados, c.id).toBe(c.n - c.ve.length)
    expect(topeMeses(c.duracion, c.n, c.porMes), c.id).toBe(c.tope)
  }
})

test('2. NADIE ve menos que con bf7fd7f, y en base 0 nada cambia', () => {
  for (const c of FOTO.casos) {
    for (const i of c.veAntes) expect(c.ve, `${c.id}: perdió el módulo #${i}`).toContain(i)
    if (c.forma === 'base0') {
      expect(c.ve, c.id).toEqual(c.veAntes)
      expect(c.reporte, c.id).toBe(c.reporteAntes)
    }
  }
})

test('3. con todo abierto se ve el ÚLTIMO módulo; el examen nunca se abre sin él; el reporte dice lo que ve', () => {
  for (const c of FOTO.casos.filter(vigente)) {
    const lim = limiteVentana(inscripcionDe(c), cursoDe(c))
    if (c.accesoTotal || c.meses >= c.tope) expect(c.ve.length, `${c.id}: con todo abierto`).toBe(c.n)
    if (c.n > 0) {
      const ultimo = c.ordenes.indexOf(Math.max(...c.ordenes))
      if (c.accesoTotal || c.meses >= c.tope) expect(c.ve, c.id).toContain(ultimo)
      if (cursoCompletoVisible(c.ordenes, lim)) expect(c.ve, `${c.id}: examen sin el último`).toContain(ultimo)
    } else {
      // Un curso sin módulos (solo examen): el examen pide la ventana abierta.
      expect(cursoCompletoVisible(c.ordenes, lim), c.id).toBe(lim > 0)
    }
    expect(c.reporte, `${c.id}: reporte vs lo que ve`).toBe(c.ve.length)
  }
  // Fuera de vigencia (suspendida, cancelada, vencida, borrador) no ve nada.
  for (const c of FOTO.casos.filter(x => !vigente(x))) expect(c.ve, c.id).toEqual([])
})

test('4. posicionesVentana: «dense», base 0, NULL bloqueado', () => {
  expect(posicionesVentana([0, 1, 2, 3])).toEqual([0, 1, 2, 3])          // base 0: igual al orden
  expect(posicionesVentana([1, 2, 3, 4])).toEqual([0, 1, 2, 3])          // base 1
  expect(posicionesVentana([0, 2, 3, 7])).toEqual([0, 1, 2, 3])          // huecos
  expect(posicionesVentana([0, 0, 1, 2])).toEqual([0, 0, 1, 2])          // repetidos comparten posición
  expect(posicionesVentana([3, 1, 2])).toEqual([2, 0, 1])                // conserva el orden de entrada
  expect(posicionesVentana([0, null, 1, undefined])).toEqual([0, ORDEN_SIN_DEFINIR, 1, ORDEN_SIN_DEFINIR])
  expect(posicionesVentana([])).toEqual([])
  expect(posicionEnCurso(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(9)
  expect(posicionEnCurso(null, [0, 1])).toBe(ORDEN_SIN_DEFINIR)
  // Un orden NULL no se cuela ni con acceso total ni con la ventana abierta de par en par.
  expect(modulosVisibles([{ orden: 0 }, { orden: null }], { meses_desbloqueados: 1, estado: 'activa', acceso_total: true }, { modulos_por_mes: 2, estado: 'publicado' })).toHaveLength(1)
  // El mes de liberación va por posición: el último de un curso en base 1 sale en el mes 5, no en el 6.
  expect(mesDeLiberacion(posicionEnCurso(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { modulos_por_mes: 2 })).toBe(5)
  expect(mesDeLiberacion(ORDEN_SIN_DEFINIR, { modulos_por_mes: 2 })).toBeNull()
})

test('5. PROPIEDAD: con orden ≥ 0, la posición nunca pasa del orden (nadie ve menos), sobre 5000 cursos al azar', () => {
  let semilla = 255
  const azar = (k: number) => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla % k }
  const malas: string[] = []
  for (let t = 0; t < 5000; t++) {
    const n = 1 + azar(14)
    const ordenes = Array.from({ length: n }, () => azar(20))
    const pos = posicionesVentana(ordenes)
    for (let i = 0; i < n; i++) if (pos[i] > ordenes[i]) malas.push(JSON.stringify({ ordenes, i }))
    for (let lim = 0; lim <= n + 2; lim++) {
      if (contarVisibles(ordenes, lim) < ordenes.filter(o => o < lim).length) malas.push(JSON.stringify({ ordenes, lim }))
    }
  }
  expect(malas).toEqual([])
  // Y con `orden` 0..N-1 seguidos (la convención), idéntico.
  for (let n = 0; n <= 15; n++) {
    const base0 = Array.from({ length: n }, (_, i) => i)
    expect(posicionesVentana(base0)).toEqual(base0)
  }
})

test('6. la migración: posición dense, comparación ESTRICTA (nunca <=), compuerta y permisos', () => {
  const m = leer(MIG)
  const sql = sinComentariosSql(m)
  expect(m).toMatch(/^\s*BEGIN;/m)
  expect(m).toMatch(/^\s*COMMIT;/m)
  expect(sql).toContain("NOTIFY pgrst, 'reload schema';")
  expect(sql).toContain('CREATE OR REPLACE FUNCTION public.curso_modulo_posicion(p_modulo_id UUID)')
  expect(sql).toMatch(/count\(DISTINCT m2\.orden\)[\s\S]*?m2\.curso_id = m\.curso_id[\s\S]*?m2\.orden < m\.orden/)
  // La ventana: posición < techo, estricto. El `<=` es la regla del Bug 238.
  const ventana = sql.slice(sql.indexOf('FUNCTION public.curso_modulo_en_ventana'), sql.indexOf('FUNCTION public.reporte_curso_inscripciones'))
  expect(ventana).toMatch(/public\.curso_modulo_posicion\(m\.id\)\s*<\s*public\.curso_ventana_limite\(m\.curso_id, auth\.uid\(\)\)/)
  expect(ventana).not.toContain('<=')
  expect(ventana).not.toMatch(/COALESCE\(m\.orden/)
  expect(ventana).not.toMatch(/curso_progreso/)               // Bug 61: la ventana no mira el progreso
  expect(ventana).toMatch(/SECURITY DEFINER\s+SET search_path = public/)
  // El reporte: modulos_visibles por la misma posición, sin LEAST.
  const reporte = sql.slice(sql.indexOf('FUNCTION public.reporte_curso_inscripciones'))
  expect(reporte).toContain('public.curso_modulo_posicion(m.id) <')
  expect(reporte).not.toMatch(/LEAST\(/)
  // La compuerta: nadie ve menos o no se cambia nada.
  expect(sql).toMatch(/IF v_menos > 0 THEN\s+RAISE EXCEPTION/)
  // curso_modulo_posicion solo la ejecuta el service role (la ventana la llama como el dueño).
  expect(sql).toContain('REVOKE ALL ON FUNCTION public.curso_modulo_posicion(UUID) FROM PUBLIC;')
  expect(sql).toContain("REVOKE ALL ON FUNCTION public.curso_modulo_posicion(UUID) FROM authenticated")
  // Preflight sin casts constantes a regprocedure (#241).
  expect(sql).not.toMatch(/'::regprocedure/)
  // Nombre y fecha: después de todo lo que había y fuera del camino de #287.
  const migs = readdirMigraciones()
  expect(migs[migs.length - 1]).toBe('20260930120000_fix255_ventana_por_posicion.sql')
})

function archivosTs(dir: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs')
  const out: string[] = []
  for (const e of fs.readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`
    if (e.isDirectory()) out.push(...archivosTs(rel))
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(rel)
  }
  return out
}

function readdirMigraciones(): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs')
  return fs.readdirSync(join(process.cwd(), 'supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
}

test('7. Bug 239: B2 y C3b conservan la versión de #255 al re-correrse; el CHECK 31 lo vigila', () => {
  for (const [rel, fn] of [
    ['supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql', 'public.curso_modulo_en_ventana(uuid)'],
    ['supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql', 'public.reporte_curso_inscripciones()'],
  ] as const) {
    const sql = sinComentariosSql(leer(rel))
    const guarda = sql.indexOf('CREATE TEMP TABLE f255_vigentes')
    const restaura = sql.indexOf('FOR v_def IN SELECT def FROM pg_temp.f255_vigentes LOOP')
    const define = sql.indexOf(`CREATE OR REPLACE FUNCTION ${fn.replace('(uuid)', '(p_modulo_id UUID)')}`)
    expect(guarda, rel).toBeGreaterThan(0)
    expect(define, rel).toBeGreaterThan(guarda)                 // guarda ANTES de pisar…
    expect(restaura, rel).toBeGreaterThan(define)               // …y restaura DESPUÉS
    expect(restaura, rel).toBeLessThan(sql.lastIndexOf('COMMIT;'))
    expect(sql.slice(guarda, guarda + 400), rel).toContain(`to_regprocedure('${fn}')`)
    expect(sql.slice(guarda, guarda + 400), rel).toContain("strpos(pg_get_functiondef(p.oid), 'curso_modulo_posicion') > 0")
  }
  const check = leer('scripts/post-setup-check.sql')
  const i30 = check.indexOf('─── CHECK 30'), i31 = check.indexOf('─── CHECK 31')
  expect(i31).toBeGreaterThan(i30)
  const c31 = check.slice(i31)
  expect(c31).toContain("'Ventana de cursos por posición (#255)'")
  expect(c31).toContain("ARRAY['curso_modulo_en_ventana(uuid)', 'reporte_curso_inscripciones()']")
  expect(c31).toContain("'count(DISTINCT m2.orden)'")
  expect(c31).toContain('20260930120000_fix255_ventana_por_posicion.sql')
  expect(c31).toMatch(/❌ VENTANA VIEJA/)
})

test('8. el espejo TS: un solo eje; nadie compara el `orden` crudo con el límite', () => {
  const acceso = sinComentariosTs(leer('src/lib/cursos/acceso.ts'))
  expect(acceso).not.toMatch(/resolverOrden\([^)]*\)\s*<\s*limite/)
  expect(acceso).not.toMatch(/orden\s*<\s*(args\.)?limite/)
  // El examen final y la vista por inscripción usan el mismo helper.
  const examen = sinComentariosTs(leer('src/lib/cursos/examen.ts'))
  expect(examen).toContain('return cursoCompletoVisible(')
  expect(examen).not.toMatch(/limite >= \(count/)
  expect(examen).toMatch(/if \(errMods \|\| !mods\) return false/)       // falla cerrado
  const insc = sinComentariosTs(leer('src/app/api/admin/inscripciones/[id]/route.ts'))
  expect(insc).toContain('modulos_visibles: contarVisibles(ordenes, accesoTotal ? ORDEN_SIN_DEFINIR : Math.max(meses * porMes, 0))')
  expect(insc).not.toMatch(/Math\.min\(meses \* porMes/)
  // En TODO src/: nadie compara un `orden` (ni su resolución) con un límite.
  for (const rel of archivosTs('src')) {
    expect(sinComentariosTs(leer(rel)), rel).not.toMatch(/\.?orden\)?\s*<=?\s*\w*[lL]imite/)
    expect(sinComentariosTs(leer(rel)), rel).not.toMatch(/Math\.min\(\s*meses\s*\*\s*porMes/)
  }
  // Las lecturas de módulos que alimentan la posición fallan cerrado.
  expect(sinComentariosTs(leer('src/lib/cursos/alumno-data.ts'))).toMatch(/if \(errMods\) return null/)
  expect(sinComentariosTs(leer('src/app/api/admin/alumnos/route.ts'))).toMatch(/if \(errMs\) idsCursos\.forEach\(id => ordenes\.set\(id, \[null\]\)\)/)
})
