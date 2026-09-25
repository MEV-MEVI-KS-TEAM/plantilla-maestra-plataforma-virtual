import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ORDEN_SIN_DEFINIR, aperturaAlAsignar, limiteVentana, modulosVisibles, motivoBloqueo,
} from '@/lib/cursos/acceso'
import { precioCursoNumerico } from '@/lib/cursos/precio-curso'

/**
 * Bloque C · C3b (#183): el pago único da ACCESO TOTAL, fotografiado al asignar.
 * Estas pruebas atan el SQL (la migración, que es el candado) con su espejo en
 * TypeScript y con la regla del catálogo, y vigilan que las tres puertas del
 * admin asignen con la regla y el registro público no.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosTs = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const sinComentariosSql = (s: string) => s.replace(/--.*$/gm, '')
const plano = (s: string) => s.replace(/\s+/g, ' ').trim()

const MIG = sinComentariosSql(leer('supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql'))
const B2 = sinComentariosSql(leer('supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql'))

/** Cuerpo ($$ … $$) de una función en un .sql. */
function cuerpo(sql: string, nombre: string): string {
  const i = sql.indexOf(`FUNCTION public.${nombre}(`)
  expect(i, nombre).toBeGreaterThan(-1)
  const a = sql.indexOf('$$', i)
  const b = sql.indexOf('$$', a + 2)
  return sql.slice(a + 2, b)
}

test('1. paridad SQL ↔ TS ↔ catálogo: la regla de apertura al asignar', () => {
  const sql = plano(cuerpo(MIG, 'curso_regla_apertura'))
  // Se interpreta el CASE tal como está escrito: WHEN COALESCE(p, 0) > 0 THEN '...' … ELSE '...'.
  const whens = [...sql.matchAll(/WHEN COALESCE\((p_\w+), 0\) > 0 THEN '(\w+)'/g)].map(m => [m[1], m[2]] as const)
  const otro = /ELSE '(\w+)'/.exec(sql)?.[1]
  expect(whens).toEqual([['p_mensualidad', 'mes1'], ['p_inscripcion', 'total']])
  expect(otro).toBe('mes1')
  const evalSql = (ins: number | null, men: number | null) => {
    const v: Record<string, number | null> = { p_inscripcion: ins, p_mensualidad: men }
    for (const [param, res] of whens) if ((v[param] ?? 0) > 0) return res
    return otro
  }
  const valores = [null, -5, 0, 0.01, 1, 900, 2490]
  for (const ins of valores) for (const men of valores) {
    const c = { precio_inscripcion: ins, precio_mensualidad: men }
    const ts = aperturaAlAsignar(c)
    expect(ts, JSON.stringify(c)).toBe(evalSql(ins, men))
    // Y es la regla del catálogo: «pago único» ⇔ acceso total.
    expect(ts === 'total').toBe(precioCursoNumerico(c).tipo === 'unico')
  }
  // Las decisiones de Kevin: pago único → todo; mensual → mes 1; 0/0 → mes 1 (D2).
  expect(aperturaAlAsignar({ precio_inscripcion: 2490, precio_mensualidad: 0 })).toBe('total')
  expect(aperturaAlAsignar({ precio_inscripcion: 1500, precio_mensualidad: 900 })).toBe('mes1')
  expect(aperturaAlAsignar({ precio_inscripcion: 0, precio_mensualidad: 0 })).toBe('mes1')
})

test('2. el candado SQL: mismo cuerpo que B2 salvo el CASE, y el CASE dentro de los filtros', () => {
  const nuevo = plano(cuerpo(MIG, 'curso_ventana_limite'))
  const viejo = plano(cuerpo(B2, 'curso_ventana_limite'))
  const caso = 'CASE WHEN ci.acceso_total THEN 2147483647 ELSE ci.meses_desbloqueados * c.modulos_por_mes END'
  expect(nuevo).toContain(caso)
  expect(nuevo.replace(caso, 'ci.meses_desbloqueados * c.modulos_por_mes')).toBe(viejo)
  // Los filtros siguen ahí (fallan cerrado también con acceso total).
  for (const f of ["ci.estado IN ('activa', 'completada')", 'ci.fecha_vencimiento >= CURRENT_DATE', "c.estado = 'publicado'"]) {
    expect(nuevo).toContain(f)
  }
})

test('3. el espejo TS: acceso total solo dentro de los filtros; un orden sin definir sigue bloqueado', () => {
  const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  const pub = { modulos_por_mes: 2, estado: 'publicado' }
  const total = { meses_desbloqueados: 0, estado: 'activa', acceso_total: true }
  expect(limiteVentana(total, pub)).toBe(ORDEN_SIN_DEFINIR)
  expect(limiteVentana({ ...total, estado: 'completada' }, pub)).toBe(ORDEN_SIN_DEFINIR)
  expect(limiteVentana({ ...total, estado: 'suspendida' }, pub)).toBe(0)
  expect(limiteVentana({ ...total, estado: 'cancelada' }, pub)).toBe(0)
  expect(limiteVentana({ ...total, fecha_vencimiento: ayer }, pub)).toBe(0)
  expect(limiteVentana(total, { ...pub, estado: 'borrador' })).toBe(0)
  expect(limiteVentana(total, null)).toBe(0)
  // null o ausente = ventana por meses (lo de siempre).
  expect(limiteVentana({ meses_desbloqueados: 1, estado: 'activa', acceso_total: null }, pub)).toBe(2)
  expect(limiteVentana({ meses_desbloqueados: 1, estado: 'activa', acceso_total: false }, pub)).toBe(2)
  // Con acceso total ve todos, incluido el último y uno agregado después; un orden NULL, no.
  const mods = [0, 1, 2, 3, 9, 40].map(orden => ({ orden })).concat([{ orden: null as unknown as number }])
  expect(modulosVisibles(mods, total, pub).length).toBe(6)
  expect(motivoBloqueo({ inscripcion: total, curso: pub, modulosTotales: 6, ordenes: [0, 1, 2, 3, 9, 40] })).toBeNull()
  // Base 1 (#204): el pago único ve también el último módulo.
  expect(modulosVisibles([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(orden => ({ orden })), total, pub).length).toBe(10)
})

test('4. la migración: idempotente, en transacción, NOTIFY, sin políticas, con los eventos nuevos', () => {
  expect(MIG).toMatch(/^\s*BEGIN;/m)
  expect(MIG).toMatch(/^\s*COMMIT;/m)
  expect(MIG).toContain("NOTIFY pgrst, 'reload schema';")
  expect(MIG).toContain('ADD COLUMN IF NOT EXISTS acceso_total BOOLEAN NOT NULL DEFAULT false')
  expect(MIG).not.toMatch(/CREATE POLICY|ALTER POLICY|DROP POLICY/i)
  expect(MIG).not.toMatch(/CREATE FUNCTION(?! OR REPLACE)/)
  const check = /CHECK \(tipo IN \(([^)]*)\)\)/.exec(plano(MIG))?.[1] ?? ''
  for (const t of ['abrir_mes', 'cerrar_mes', 'cambio_estado', 'constancia_emitida', 'inscripcion', 'abrir_todo', 'quitar_acceso_total']) {
    expect(check).toContain(`'${t}'`)
  }
  // Abrir/cerrar mes rechazan con acceso total; el reporte cuenta todo como visible.
  expect(plano(cuerpo(MIG, 'curso_abrir_mes'))).toContain('IF v_total THEN RAISE EXCEPTION')
  expect(plano(cuerpo(MIG, 'curso_cerrar_mes'))).toContain('IF v_total THEN RAISE EXCEPTION')
  expect(plano(cuerpo(MIG, 'reporte_curso_inscripciones'))).toContain('WHEN i.acceso_total THEN')
  // Las de admin comprueban es_admin(); ninguna se concede a anon.
  for (const f of ['curso_inscribir', 'curso_inscribir_todos', 'curso_abrir_todo', 'curso_quitar_acceso_total']) {
    expect(plano(cuerpo(MIG, f))).toContain('IF NOT public.es_admin() THEN')
  }
  expect(MIG).not.toMatch(/GRANT[^;]*TO anon/)
})

test('5. las tres puertas del ADMIN asignan con la regla; el registro público no', () => {
  const ruta = sinComentariosTs(leer('src/app/api/admin/cursos/[id]/inscripciones/route.ts'))
  expect(ruta).toContain("supabase.rpc('curso_inscribir',")
  expect(ruta).toContain("supabase.rpc('curso_inscribir_todos',")
  expect(ruta).not.toContain('createAdminClient')
  expect(ruta).not.toMatch(/\.insert\(/)
  const alta = sinComentariosTs(leer('src/app/api/admin/alumnos/route.ts'))
  const post = alta.slice(alta.indexOf('export async function POST'))
  expect(post).toContain("supabase.rpc('curso_inscribir',")
  expect(post).not.toMatch(/from\('curso_inscripciones'\)[\s\S]{0,80}\.insert\(/)
  // /admin/alumnos «Asignar» reusa la ruta de arriba.
  expect(leer('src/app/(dashboard)/admin/alumnos/page.tsx')).toContain('/api/admin/cursos/${cursoId}/inscripciones')
  // El registro público: prospecto que no ha pagado → 0 meses, sin acceso total, sin la función.
  const reg = sinComentariosTs(leer('src/app/api/auth/register-complete/route.ts'))
  expect(reg).not.toContain('curso_inscribir')
  expect(reg).not.toContain('acceso_total')
  expect(reg).toMatch(/meses_desbloqueados:\s*0/)
})

test('6. quien calcula la ventana lee acceso_total (sin él, el candado TS diría 0 a quien ve todo)', () => {
  for (const f of ['src/lib/cursos/alumno-data.ts', 'src/lib/cursos/examen.ts', 'src/app/api/admin/alumnos/route.ts',
    'src/app/api/admin/cursos/[id]/route.ts', 'src/app/api/admin/inscripciones/[id]/route.ts']) {
    expect(leer(f), f).toMatch(/from\('curso_inscripciones'\)\s*\.select\('[^']*acceso_total[^']*'\)/)
  }
})

test('7. la pestaña Alumnos: acceso total, abrir todo / quitar, y la masiva dice cuántos y qué (D3)', () => {
  const tab = sinComentariosTs(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).toContain('Acceso total')
  expect(tab).toContain("cambiarAccesoTotal(i.inscripcion_id, 'abrir-todo', i.nombre)")
  expect(tab).toContain("cambiarAccesoTotal(i.inscripcion_id, 'quitar-acceso-total', i.nombre)")
  // «+ Abrir mes» y «−» no se ofrecen con acceso total.
  expect(tab).toMatch(/i\.acceso_total \? \(\s*<button[\s\S]*?Quitar acceso total[\s\S]*?\) : \(\s*<>[\s\S]*?\+ Abrir mes/)
  // La confirmación masiva da el número de nuevos y, en pago único, ACCESO TOTAL.
  expect(tab.match(/\{nuevosActivos\}/g)?.length).toBeGreaterThanOrEqual(3)
  expect(tab).toContain('ACCESO TOTAL')
  const pagina = sinComentariosTs(leer('src/app/(dashboard)/admin/cursos/[id]/page.tsx'))
  expect(pagina).toContain('apertura={aperturaAlAsignar(curso)}')
})
