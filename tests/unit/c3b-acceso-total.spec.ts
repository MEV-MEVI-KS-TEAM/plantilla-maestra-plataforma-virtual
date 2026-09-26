import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  ORDEN_SIN_DEFINIR, aperturaAlAsignar, limiteVentana, modulosVisibles, motivoBloqueo,
} from '@/lib/cursos/acceso'
import { precioCursoNumerico } from '@/lib/cursos/precio-curso'
import { conAccesoTotal, faltaAccesoTotal } from '@/lib/cursos/acceso-total'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'
import { avisoMes1 } from '@/lib/cursos/aviso-asignar'

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
  // Se interpreta el CASE tal como está escrito:
  //   WHEN COALESCE(NULLIF(p, 'NaN'), 0) > 0 THEN '...' … ELSE '...'.
  // En Postgres NaN es MAYOR que todo; NULLIF lo vuelve NULL → 0, como en TS,
  // donde NaN > 0 es falso. Parámetro por parámetro, sin atajos.
  const whens = [...sql.matchAll(/WHEN COALESCE\(NULLIF\((p_\w+), 'NaN'\), 0\) > 0 THEN '(\w+)'/g)].map(m => [m[1], m[2]] as const)
  const otro = /ELSE '(\w+)'/.exec(sql)?.[1]
  expect(whens).toEqual([['p_mensualidad', 'mes1'], ['p_inscripcion', 'total']])
  expect(otro).toBe('mes1')
  expect(sql.match(/WHEN /g)?.length).toBe(2)
  expect(sql).not.toMatch(/= 'NaN'/)
  const evalSql = (ins: number | null, men: number | null) => {
    const v: Record<string, number | null> = { p_inscripcion: ins, p_mensualidad: men }
    for (const [param, res] of whens) {
      const x = v[param]
      if ((x === null || Number.isNaN(x) ? 0 : x) > 0) return res
    }
    return otro
  }
  const valores = [null, Number.NaN, -5, 0, 0.01, 1, 900, 2490]
  for (const ins of valores) for (const men of valores) {
    const c = { precio_inscripcion: ins, precio_mensualidad: men }
    const ts = aperturaAlAsignar(c)
    expect(ts, JSON.stringify(c)).toBe(evalSql(ins, men))
    // Y es la regla del catálogo: «pago único» ⇔ acceso total.
    expect(ts === 'total').toBe(precioCursoNumerico(c).tipo === 'unico')
  }
  // NaN (revisión, ronda 2): 2490/NaN es pago único en el catálogo y en SQL.
  expect(aperturaAlAsignar({ precio_inscripcion: 2490, precio_mensualidad: Number.NaN })).toBe('total')
  expect(aperturaAlAsignar({ precio_inscripcion: Number.NaN, precio_mensualidad: 0 })).toBe('mes1')
  expect(evalSql(2490, Number.NaN)).toBe('total')
  expect(evalSql(Number.NaN, 900)).toBe('mes1')
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

test('4b. re-correr una migración vieja NO revierte C3b: guarda y restaura sus funciones; nadie lee el techo por RPC', () => {
  // Toda migración anterior que redefina una función de C3b la guarda al empezar
  // (si la base ya tiene la columna) y la restaura al final. Se deduce de los
  // archivos: una migración nueva que pise otra función de C3b tiene que entrar.
  const deC3b = new Set([...MIG.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)\(/g)].map(m => m[1]))
  const firmas: Record<string, string> = {
    curso_ventana_limite: 'curso_ventana_limite(uuid,uuid)',
    curso_abrir_mes: 'curso_abrir_mes(uuid,integer)',
    curso_cerrar_mes: 'curso_cerrar_mes(uuid,integer)',
    reporte_curso_inscripciones: 'reporte_curso_inscripciones()',
  }
  const viejas = readdirSync(join(process.cwd(), 'supabase/migrations'))
    .filter(f => f.endsWith('.sql') && f < '20260926120000_c3b_acceso_total_cursos.sql')
  let cubiertas = 0
  for (const f of viejas) {
    const sql = sinComentariosSql(leer(`supabase/migrations/${f}`))
    const pisa = [...sql.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)\(/g)].map(m => m[1]).filter(n => deC3b.has(n))
    if (pisa.length === 0) continue
    cubiertas++
    const guarda = sql.indexOf('CREATE TEMP TABLE c3b_vigentes AS')
    const restaura = sql.indexOf('FOR v_def IN SELECT def FROM pg_temp.c3b_vigentes LOOP')
    expect(guarda, f).toBeGreaterThan(-1)
    expect(restaura, f).toBeGreaterThan(-1)
    for (const n of new Set(pisa)) {
      expect(firmas[n], `${f}: ${n} sin firma conocida`).toBeTruthy()
      const lista = sql.slice(guarda, sql.indexOf(';', guarda))
      expect(lista, `${f} guarda ${n}`).toContain(`'public.${firmas[n]}'`)
      // Se guarda ANTES de pisarla y se restaura DESPUÉS de la última vez que la pisa.
      expect(guarda, `${f}: ${n}`).toBeLessThan(sql.indexOf(`CREATE OR REPLACE FUNCTION public.${n}(`))
      expect(restaura, `${f}: ${n}`).toBeGreaterThan(sql.lastIndexOf(`CREATE OR REPLACE FUNCTION public.${n}(`))
    }
    // La guarda solo actúa con C3b, solo guarda lo que trae su huella (una
    // versión ya revertida no se «conserva») y, si falta alguna, avisa.
    const captura = sql.slice(guarda, sql.indexOf(';', guarda))
    expect(captura, f).toContain("column_name = 'acceso_total'")
    expect(captura, f).toContain("AND strpos(pg_get_functiondef(p.oid), 'acceso_total') > 0")
    expect(sql, f).toContain("RAISE WARNING 'Esta base tiene C3b, pero % ya no trae su versión")
    // En transacción (la tabla temporal es de la sesión; una corrida cortada se
    // deshace), con la restauración antes del COMMIT.
    expect(sql, f).toMatch(/^\s*BEGIN;/m)
    expect(sql.indexOf('BEGIN;'), f).toBeLessThan(guarda)
    expect(restaura, f).toBeLessThan(sql.lastIndexOf('COMMIT;'))
    expect(sql, f).not.toContain("RAISE WARNING 'Esta base ya tiene C3b")
  }
  expect(cubiertas).toBe(4)   // B2, B3, B4 y B6
  // B2 le da EXECUTE del techo a authenticated: al restaurar, se lo vuelve a quitar.
  const b2 = B2.slice(B2.indexOf('FOR v_def IN SELECT def FROM pg_temp.c3b_vigentes LOOP'))
  expect(B2.indexOf("GRANT EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) TO authenticated")).toBeLessThan(B2.indexOf('FOR v_def IN SELECT def FROM pg_temp.c3b_vigentes LOOP'))
  expect(b2).toContain("REVOKE EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) FROM authenticated")
  const b4 = plano(sinComentariosSql(leer('supabase/migrations/20260730150000_b4_constancia_y_eventos.sql')))
  expect(b4).toContain("'inscripcion', 'abrir_todo', 'quitar_acceso_total'")
  expect(MIG).toContain('REVOKE EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) FROM PUBLIC;')
  expect(MIG).toContain("REVOKE EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) FROM authenticated")
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
  // …y dice qué abrió cada curso (con el aviso de ficha sin precio) y por qué falló.
  expect(post).toMatch(/cursos_resultado: cursosResultado/)
  expect(post).toMatch(/sin_precio: precioCursoNumerico\(curso\)\.tipo === 'informes',\n/)
  expect(post).toContain('cursosError ??= errorDeRpcCurso(insError).mensaje')
  const alumnosPag = sinComentariosTs(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(alumnosPag).toContain('data.cursos_resultado')
  expect(alumnosPag).toContain('data.cursos_error')
  // «Asignar curso» muestra la causa del servidor (p. ej. el 503 de la migración)
  // y avisa si el registro le anunció un pago único y se abrió el mes 1.
  expect(alumnosPag).toMatch(/causa \? `: \$\{causa\}`/)
  // El aviso de mes 1 sale de avisoMes1 en las dos puertas; en «Asignar curso»,
  // con el anuncio de HOY y solo si el catálogo llegó, y aunque otro curso falle.
  expect(alumnosPag).toContain('const aviso = avisoMes1(resultado, null)')
  // …y el aviso SE MUESTRA en las dos (rojo y 10 s), sin condiciones extra.
  expect(alumnosPag.match(/\n\s*if \(aviso\) showToast\(aviso, 'error', AVISO_MS\)\n/g)?.length).toBe(2)
  expect(alumnosPag).toContain('const anuncio = oferta && catalogoOk ? resolverPrecioOferta(oferta, preciosPublicados) : null')
  const activar = alumnosPag.slice(alumnosPag.indexOf('async function activarCurso'), alumnosPag.indexOf('async function handleMarcarContactado'))
  expect(activar.indexOf('const aviso = avisoMes1(nuevos, anuncio)')).toBeGreaterThan(activar.indexOf('if (fallos.length) {'))
  expect(activar).not.toMatch(/\} else \{[\s\S]*avisoMes1/)
  // Un 409 (ya estaba) no cuenta como «acceso total» de esta asignación.
  expect(activar).toContain("if (res.status === 409) { yaEstaban++; continue }")
  // La ruta no afirma «sin precio» si no leyó la ficha o si abrió todo.
  expect(ruta).toMatch(/const sinPrecio = !errCurso && curso != null && fila\?\.acceso_total !== true/)
  // /admin/alumnos «Asignar» reusa la ruta de arriba.
  expect(leer('src/app/(dashboard)/admin/alumnos/page.tsx')).toContain('/api/admin/cursos/${cursoId}/inscripciones')
  // El registro público: prospecto que no ha pagado → 0 meses, sin acceso total, sin la función.
  const reg = sinComentariosTs(leer('src/app/api/auth/register-complete/route.ts'))
  expect(reg).not.toContain('curso_inscribir')
  expect(reg).not.toContain('acceso_total')
  expect(reg).toMatch(/meses_desbloqueados:\s*0/)
})

test('6. quien calcula la ventana lee acceso_total, y una base sin C3b no se rompe', async () => {
  for (const f of ['src/lib/cursos/alumno-data.ts', 'src/lib/cursos/examen.ts', 'src/app/api/admin/alumnos/route.ts',
    'src/app/api/admin/cursos/[id]/route.ts', 'src/app/api/admin/inscripciones/[id]/route.ts',
    'src/app/api/admin/inscripciones/[id]/pago/route.ts']) {
    const src = sinComentariosTs(leer(f))
    expect(src, f).toMatch(/conAccesoTotal<[\s\S]*?>\(\s*'[^']*'\s*,\s*campos => admin\s*\.from\('curso_inscripciones'\)\s*\.select\(campos\)/)
    expect(src, f).not.toMatch(/from\('curso_inscripciones'\)\s*\.select\('[^']*acceso_total/)
  }
  // El pago lee el booleano con el cliente admin (el secretario no ve la fila por RLS).
  expect(sinComentariosTs(leer('src/app/api/admin/inscripciones/[id]/pago/route.ts'))).toContain('const admin = createAdminClient()')
  // El lector: pide acceso_total; si la columna no existe (42703), repite sin ella.
  const pedidas: string[] = []
  const falsa = (campos: string) => {
    pedidas.push(campos)
    return Promise.resolve(campos.includes('acceso_total')
      ? { data: null, error: { code: '42703', message: 'column curso_inscripciones.acceso_total does not exist' } }
      : { data: { meses_desbloqueados: 1 }, error: null })
  }
  const r = await conAccesoTotal<{ meses_desbloqueados: number }>('meses_desbloqueados', falsa)
  expect(pedidas).toEqual(['meses_desbloqueados, acceso_total', 'meses_desbloqueados'])
  expect(r.data).toEqual({ meses_desbloqueados: 1 })
  // Otro error NO se esconde.
  const otro = await conAccesoTotal('x', () => Promise.resolve({ data: null, error: { code: '42501', message: 'permiso' } }))
  expect(otro.error?.code).toBe('42501')
  expect(faltaAccesoTotal({ code: 'PGRST116' })).toBe(false)
})

test('6b. errores de las funciones: 23505 → 409, 22P02 → 400, función ausente → 503 con qué migración', () => {
  const e = (code: string, message = 'x') => errorDeRpcCurso({ code, message, details: '', hint: '', name: 'PostgrestError' } as never)
  expect(e('23505').status).toBe(409)
  expect(e('22P02').status).toBe(400)
  expect(e('42501').status).toBe(403)
  expect(e('P0002').status).toBe(404)
  expect(e('PGRST202').status).toBe(503)
  expect(e('PGRST202').mensaje).toContain('20260926120000_c3b_acceso_total_cursos.sql')
})

test('7. la pestaña Alumnos: acceso total, abrir todo / quitar, y la masiva dice cuántos y qué (D3)', () => {
  const tab = sinComentariosTs(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  expect(tab).toContain('Acceso total')
  expect(tab).toContain("cambiarAccesoTotal(i, 'abrir-todo')")
  expect(tab).toContain("cambiarAccesoTotal(i, 'quitar-acceso-total')")
  // «Vigente» con los MISMOS filtros del candado, curso publicado incluido.
  expect(tab).toContain('function accesoVigente(i: CursoInscrito, publicado: boolean): boolean')
  expect(tab).toContain('if (!publicado) return false')
  expect(tab).not.toMatch(/accesoVigente\(i\)/)
  expect(tab).toMatch(/accesoVigente\(i, publicado\) \? \(\s*<span[\s\S]{0,300}?Acceso total\s*</)
  expect(tab).toContain('if (json.sin_precio && !json.acceso_total) {')
  // Las acciones de la fila hacen wrap (4 botones no caben a 360 px).
  expect(tab).toContain('<div className="flex flex-wrap items-center gap-1">')
  // Antes del clic se dice qué abre «Asignar»; el aviso de ficha sin precio va
  // en rojo y dura lo bastante para leerse.
  expect(tab).toMatch(/apertura === 'total'\s*\?\s*<>Este curso es de <strong>pago único<\/strong>/)
  expect(tab).toMatch(/if \(json\.sin_precio && !json\.acceso_total\) \{\s*onError\([\s\S]*?, AVISO_MS\)/)
  expect(tab).toContain("onError('No hay alumnos activos que asignar')")
  expect(tab).not.toMatch(/alumnos activos \(\{totalActivos\}\)/)
  // «+ Abrir mes» y «−» no se ofrecen con acceso total.
  expect(tab).toMatch(/i\.acceso_total \? \(\s*<button[\s\S]*?Quitar acceso total[\s\S]*?\) : \(\s*<>[\s\S]*?\+ Abrir mes/)
  // La confirmación masiva da el número de nuevos y, en pago único, ACCESO TOTAL.
  expect(tab.match(/\{nuevosActivos\}/g)?.length).toBeGreaterThanOrEqual(3)
  expect(tab).toContain('ACCESO TOTAL')
  // …y ese número lo cuenta el SERVIDOR (simulación), no la lista de alumnos, y
  // viaja de vuelta como `esperados` para que el SQL rechace si cambió.
  expect(tab).toContain('/inscripciones?simular=todos')
  expect(tab).toContain('const nuevosActivos = simulacion?.nuevos ?? 0')
  expect(tab).toContain('JSON.stringify({ todos_activos: true, esperados: simulacion?.nuevos, regla_esperada: simulacion?.regla })')
  expect(tab).not.toMatch(/filter\(a => a\.activo && !inscritosIds\.has\(a\.id\)\)/)
  const ruta = sinComentariosTs(leer('src/app/api/admin/cursos/[id]/inscripciones/route.ts'))
  expect(ruta).toContain("supabase.rpc('curso_inscribir_todos', { p_curso_id: params.id, p_simular: true })")
  expect(ruta).toMatch(/p_esperados: esperados/)
  // Número Y regla son obligatorios, en la ruta y en SQL (una llamada a mano no
  // abre acceso total sin confirmación), y el 40001 habla en palabras.
  expect(ruta).toMatch(/if \(reglaEsperada === null\) \{\s*return NextResponse\.json\([^\n]*\{ status: 400 \}\)/)
  const todos = plano(cuerpo(MIG, 'curso_inscribir_todos'))
  expect(todos).toContain("IF p_esperados IS NULL OR p_regla_esperada IS NULL OR p_regla_esperada NOT IN ('total', 'mes1') THEN RAISE EXCEPTION")
  expect(todos.indexOf('IF p_simular THEN')).toBeLessThan(todos.indexOf('IF p_esperados IS NULL'))
  expect(todos).toContain('IF p_esperados <> v_n THEN RAISE EXCEPTION')
  expect(todos).toContain("CASE v_regla WHEN 'total' THEN 'el curso completo (acceso total)' ELSE 'solo el mes 1' END")
  const pagina = sinComentariosTs(leer('src/app/(dashboard)/admin/cursos/[id]/page.tsx'))
  expect(pagina).toContain('apertura={aperturaAlAsignar(curso)}')
  expect(pagina).toContain('publicado={publicado}')
})

test('7b. el aviso de «se abrió solo el mes 1»: su tabla de verdad', () => {
  const unico = { tipo: 'unico', monto: 2490, fuente: 'config' } as const
  const mensual = { tipo: 'mensual', mensualidad: 900, inscripcion: null, fuente: 'tabla' } as const
  const A = (nombre: string, acceso_total: boolean, sin_precio = false) => ({ nombre, acceso_total, sin_precio })
  // Paquete (o ficha 0/0 con precio de config.ts): se anuncia pago único y un curso abrió el mes 1.
  expect(avisoMes1([A('EXANI', false), A('UNAM', true)], unico)).toMatch(/^Ojo: hoy esta oferta se anuncia como pago único, pero en EXANI se abrió solo el mes 1/)
  // Ficha 0/0 sin oferta que diga otra cosa (el alta, o catálogo sin cargar).
  expect(avisoMes1([A('ING-05', false, true)], null)).toMatch(/^Ojo: ING-05 no tiene precio en su ficha/)
  // Mensual anunciado como mensual: nada que avisar.
  expect(avisoMes1([A('ING-05', false)], mensual)).toBeNull()
  expect(avisoMes1([A('ING-05', false)], null)).toBeNull()
  // Todo con acceso total: nada.
  expect(avisoMes1([A('EXANI', true), A('UNAM', true, true)], unico)).toBeNull()
  // Nada asignado ahora (todo 409 o todo falló): nada.
  expect(avisoMes1([], unico)).toBeNull()
  // Sin precio pero con acceso total (no puede abrir menos): nada.
  expect(avisoMes1([A('X', true, true)], null)).toBeNull()
})

test('8. CHECK 15 detecta un C3b revertido, no solo uno ausente', () => {
  const chk = leer('scripts/post-setup-check.sql')
  const c15 = chk.slice(chk.indexOf('CHECK 15'))
  for (const f of ['curso_ventana_limite(uuid,uuid)', 'curso_abrir_mes(uuid,integer)', 'curso_cerrar_mes(uuid,integer)', 'reporte_curso_inscripciones()']) {
    expect(c15).toContain(`'${f}'`)
  }
  expect(c15).toContain("strpos(pg_get_functiondef(to_regprocedure('public.' || f)), 'acceso_total') = 0")
  expect(c15).toContain("has_function_privilege('authenticated', 'public.curso_ventana_limite(uuid,uuid)', 'EXECUTE')")
  expect(c15).toContain('❌ C3b REVERTIDO')
})
