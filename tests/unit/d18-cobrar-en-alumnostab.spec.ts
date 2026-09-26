import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cobroPorInscripcion } from '@/lib/cursos/cobro-servidor'

/**
 * Bloque D · D18 — #207-7: «Cobrar» (atajo) e insignia «Pagado · falta abrir»
 * en la pestaña Alumnos del curso. Mismas reglas puras que la ficha
 * (lib/cursos/cobro.ts) y el mismo modal (D17).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

type Filas = Record<string, Array<Record<string, unknown>>>
/** Un cliente admin falso: .from(t).select().in(col, lote)[.eq()] → las filas de t cuyo `col` está en el lote. */
function falso(tablas: Filas, fallar: string[] = []) {
  const llamadas: string[] = []
  const admin = {
    from(t: string) {
      let col = '', lote: string[] = [], tipo: string | null = null, desde = 0, hasta = Infinity
      const q = {
        select: () => q,
        order: () => q,
        range: (d: number, h: number) => { desde = d; hasta = h; return q },
        eq: (c: string, v: string) => { if (c === 'tipo') tipo = v; return q },
        in: (c: string, l: string[]) => { col = c; lote = l; return q },
        then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => {
          llamadas.push(`${t}:${lote.length}`)
          if (fallar.includes(t)) return Promise.resolve({ data: null, error: { code: '42703', message: 'x' } }).then(res, rej)
          const data = (tablas[t] ?? []).filter(f => lote.includes(String(f[col])) && (tipo === null || f.tipo === tipo))
          return Promise.resolve({ data: data.slice(desde, hasta + 1), error: null }).then(res, rej)
        },
      }
      return q
    },
  }
  return { admin, llamadas }
}
const ins = (id: string, o: Partial<{ estado: string; meses_desbloqueados: number; acceso_total: boolean; por_activar: boolean }> = {}) =>
  ({ id, estado: 'activa', meses_desbloqueados: 1, acceso_total: false, por_activar: false, ...o })

test('1. lo pagado y «falta abrir» por inscripción, con la foto del precio al asignar', async () => {
  const { admin } = falso({
    pagos: [
      { curso_inscripcion_id: 'u1', monto: 2490, concepto: 'curso_pago_unico', mes_desbloqueado: null },
      { curso_inscripcion_id: 'm1', monto: 1500, concepto: 'curso_mensualidad', mes_desbloqueado: 2 },
    ],
    curso_inscripcion_eventos: [
      // Se le vendió a 2490 (pago único) aunque la ficha de hoy cobre otra cosa.
      { inscripcion_id: 'u1', tipo: 'inscripcion', detalle: { precio_inscripcion: 2490, precio_mensualidad: 0 }, created_at: '2026-09-01T00:00:00Z' },
    ],
  })
  // Ficha de hoy: mensual (0 + 1500/mes).
  const m = await cobroPorInscripcion(admin as never, { precio_inscripcion: 0, precio_mensualidad: 1500 }, [
    ins('u1', { meses_desbloqueados: 0 }),      // pagó el pago único completo y no se le abrió
    ins('m1', { meses_desbloqueados: 1 }),      // pagó el mes 2 y solo tiene 1 abierto
    ins('x1', { meses_desbloqueados: 1 }),      // nada pagado
    ins('c1', { estado: 'cancelada' }),         // cancelada: nunca «falta abrir»
  ])
  expect(m.get('u1')).toEqual({ pagado: 2490, pagado_falta_abrir: true })
  expect(m.get('m1')).toEqual({ pagado: 1500, pagado_falta_abrir: true })
  expect(m.get('x1')).toEqual({ pagado: 0, pagado_falta_abrir: false })
  expect(m.get('c1')).toEqual({ pagado: 0, pagado_falta_abrir: false })
})

test('2. por lotes de 100 ids (la URL de .in() tiene tope); sin pagos legibles, sin insignia', async () => {
  const muchos = Array.from({ length: 201 }, (_, k) => ins(`i${k}`))
  const { admin, llamadas } = falso({ pagos: [], curso_inscripcion_eventos: [] })
  const m = await cobroPorInscripcion(admin as never, { precio_inscripcion: 0, precio_mensualidad: 900 }, muchos)
  expect(m.size).toBe(201)
  expect(llamadas.filter(l => l.startsWith('pagos:'))).toEqual(['pagos:100', 'pagos:100', 'pagos:1'])
  // Dentro de cada lote, por páginas de 1000 (PostgREST corta ahí sin avisar).
  const fuente = leer('src/lib/cursos/cobro-servidor.ts')
  expect(fuente).toContain(".order('id', { ascending: true }).range(desde, hasta)),")
  expect(fuente).toContain('if (filas.length < PAGINA) break')
  // Base sin B1 (o un error): mapa vacío → la pestaña queda como antes.
  const roto = falso({}, ['pagos'])
  expect((await cobroPorInscripcion(roto.admin as never, { precio_inscripcion: 0, precio_mensualidad: 900 }, [ins('a')])).size).toBe(0)
  expect((await cobroPorInscripcion(roto.admin as never, { precio_inscripcion: 0, precio_mensualidad: 900 }, [])).size).toBe(0)
})

test('2b. un lote con MÁS de 1000 pagos se lee completo (páginas de 1000)', async () => {
  const pagos = Array.from({ length: 1200 }, (_, k) => ({ curso_inscripcion_id: `p${k % 100}`, monto: 1, concepto: 'curso_otro', mes_desbloqueado: null }))
  const { admin, llamadas } = falso({ pagos, curso_inscripcion_eventos: [] })
  const m = await cobroPorInscripcion(admin as never, { precio_inscripcion: 0, precio_mensualidad: 900 }, Array.from({ length: 100 }, (_, k) => ins(`p${k}`)))
  expect(llamadas.filter(l => l.startsWith('pagos:'))).toEqual(['pagos:100', 'pagos:100'])
  expect([...m.values()].reduce((s, v) => s + v.pagado, 0)).toBe(1200)
})

test('2c. el tope del curso: un mes pagado que el curso ya no tiene no enciende la insignia para siempre', async () => {
  const { admin } = falso({ pagos: [{ curso_inscripcion_id: 'm9', monto: 900, concepto: 'curso_mensualidad', mes_desbloqueado: 9 }], curso_inscripcion_eventos: [] })
  const conTope = await cobroPorInscripcion(admin as never, { precio_inscripcion: 0, precio_mensualidad: 900 }, [ins('m9', { meses_desbloqueados: 3 })], 3)
  expect(conTope.get('m9')?.pagado_falta_abrir).toBe(false)
  const sinTope = await cobroPorInscripcion(admin as never, { precio_inscripcion: 0, precio_mensualidad: 900 }, [ins('m9', { meses_desbloqueados: 3 })])
  expect(sinTope.get('m9')?.pagado_falta_abrir).toBe(true)
})

test('3. el detalle del curso suma pagado y pagado_falta_abrir a cada inscrito', () => {
  const api = sinComentarios(leer('src/app/api/admin/cursos/[id]/route.ts'))
  expect(api).toContain('const cobros = await cobroPorInscripcion(admin, {')
  expect(api).toContain('return c ? { ...x, pagado: c.pagado, pagado_falta_abrir: c.pagado_falta_abrir } : x')
  expect(leer('src/types/cursos.ts')).toContain('pagado_falta_abrir?: boolean')
})

test('4. la pestaña: «Cobrar» para admin y secretario, el modal de la ficha y la insignia', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  // No está detrás de esAdmin: el secretario también cobra (decisión 6).
  expect(tab).toMatch(/<div className="flex flex-wrap items-center gap-1">\s*<button\s+onClick=\{\(\) => cobrarDe\(i\)\}/)
  expect(tab).toContain('const res = await fetch(`/api/admin/alumnos/${i.alumno_id}/cursos`)')
  expect(tab).toContain('const fila = (json.cursos ?? []).find((c: FilaCursoAlumno) => c.inscripcion_id === i.inscripcion_id)')
  expect(tab).toContain('<CobrarCursoModal')
  // Dos clics rápidos: la respuesta vieja no abre el modal, y el modal se rehace por fila.
  expect(tab).toContain('if (peticion !== ultimoCobro.current) return')
  expect(tab).toContain('key={cobrando.fila.inscripcion_id}')
  expect(tab).toContain('onCobrado={(mensaje) => { setCobrando(null); onChanged(mensaje) }}')
  expect(tab).toMatch(/\{i\.pagado_falta_abrir && \(\s*<span[\s\S]{0,600}?Pagado · falta abrir/)
})
