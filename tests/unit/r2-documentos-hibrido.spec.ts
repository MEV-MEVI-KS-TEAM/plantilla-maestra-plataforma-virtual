import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  aplicarDocEstado,
  buildDocEstadoUpdates,
  contarDocumentosPendientes,
  esColumnaInexistente,
  ordenDocEstadoUpdates,
} from '@/lib/admin/documentos-admin'

/**
 * Soporte IVS ronda 2 (8-oct-2026) — aprobar un documento escribe `verificado`
 * también en una base HÍBRIDA (estado/comentario_admin/revisado_en + verificado).
 *
 * Antes: se intentaba `nuevo` (sin verificado) y solo si fallaba, `legacy`. En la
 * base híbrida de IVS `nuevo` siempre funcionaba: 4 documentos aprobados se
 * quedaron con verificado=false y el contador «Docs. pendientes» (que contaba
 * verificado=false) los seguía contando. Ahora: híbrido → nuevo → legacy, y solo
 * se pasa al siguiente si la columna no existe (42703 / PGRST204).
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')

/** Simula una tabla con estas columnas: un UPDATE con una columna ajena da PGRST204. */
function tabla(columnas: string[], otroError?: { message: string; code: string }) {
  const llamadas: Record<string, unknown>[] = []
  let fila: Record<string, unknown> = {}
  const actualizar = async (payload: Record<string, unknown>) => {
    llamadas.push(payload)
    if (otroError) return { error: otroError }
    const ajena = Object.keys(payload).find(k => !columnas.includes(k))
    if (ajena) return { error: { message: `Could not find the '${ajena}' column`, code: 'PGRST204' } }
    fila = { ...fila, ...payload }
    return { error: null }
  }
  return { llamadas, actualizar, fila: () => fila }
}

const HIBRIDA = ['estado', 'comentario_admin', 'revisado_en', 'verificado']
const NUEVA = ['estado', 'comentario_admin', 'revisado_en']
const CANONICA = ['verificado', 'notas', 'fecha_verificacion']

test('1. base híbrida (IVS): aprobar escribe estado Y verificado=true en un solo UPDATE', async () => {
  const t = tabla(HIBRIDA)
  const r = await aplicarDocEstado('aprobado', 'ok', t.actualizar)
  expect(r.error).toBeNull()
  expect(t.llamadas).toHaveLength(1)
  expect(t.fila()).toMatchObject({ estado: 'aprobado', verificado: true, comentario_admin: 'ok' })
  for (const estado of ['rechazado', 'pendiente'] as const) {
    const u = tabla(HIBRIDA)
    await aplicarDocEstado(estado, null, u.actualizar)
    expect(u.fila(), estado).toMatchObject({ estado, verificado: false })
  }
})

test('2. esquema nuevo puro (sin verificado): cae a `nuevo`; canónico de la plantilla: cae a `legacy`', async () => {
  const n = tabla(NUEVA)
  expect((await aplicarDocEstado('aprobado', null, n.actualizar)).error).toBeNull()
  expect(n.llamadas).toHaveLength(2)
  expect(n.fila()).toMatchObject({ estado: 'aprobado' })
  expect(n.fila()).not.toHaveProperty('verificado')

  const c = tabla(CANONICA)
  expect((await aplicarDocEstado('aprobado', 'visto', c.actualizar)).error).toBeNull()
  expect(c.llamadas).toHaveLength(3)
  expect(c.fila()).toMatchObject({ verificado: true, notas: 'visto' })
})

test('3. un error que NO es de columna inexistente no se tapa con el del payload siguiente', async () => {
  const t = tabla(HIBRIDA, { message: 'permission denied for table documentos_alumno', code: '42501' })
  const r = await aplicarDocEstado('aprobado', null, t.actualizar)
  expect(r.error?.code).toBe('42501')
  expect(t.llamadas).toHaveLength(1)
  expect(esColumnaInexistente({ code: '42703' })).toBe(true)
  expect(esColumnaInexistente({ code: 'PGRST204' })).toBe(true)
  expect(esColumnaInexistente({ code: '42501' })).toBe(false)
  expect(esColumnaInexistente(null)).toBe(false)
  // El orden es el de IVS.
  const u = buildDocEstadoUpdates('aprobado', null)
  expect(ordenDocEstadoUpdates(u)).toEqual([u.hibrido, u.nuevo, u.legacy])
  expect(u.hibrido).toMatchObject({ estado: 'aprobado', verificado: true })
})

/** Cliente falso: `estado` existe o no; cuenta lo que diga la tabla. */
function clienteConteo(filas: Record<string, unknown>[], conEstado: boolean) {
  const pedidos: string[] = []
  const cliente = {
    from: () => ({
      select: () => ({
        eq: async (col: string, v: unknown) => {
          pedidos.push(`${col}=${String(v)}`)
          if (col === 'estado' && !conEstado) {
            return { count: null, error: { message: 'column documentos_alumno.estado does not exist', code: '42703' } }
          }
          return { count: filas.filter(f => f[col] === v).length, error: null }
        },
      }),
    }),
  }
  return { cliente: cliente as unknown as SupabaseClient, pedidos }
}

test('4. «Docs. pendientes»: por estado donde existe; por verificado en el esquema canónico', async () => {
  // Híbrida (IVS): 2 aprobados con verificado=false de antes del arreglo, 1 rechazado, 1 pendiente.
  const ivs = clienteConteo([
    { estado: 'aprobado', verificado: false }, { estado: 'aprobado', verificado: false },
    { estado: 'rechazado', verificado: false }, { estado: 'pendiente', verificado: false },
  ], true)
  expect(await contarDocumentosPendientes(ivs.cliente)).toBe(1)
  expect(ivs.pedidos).toEqual(['estado=pendiente'])

  const canonica = clienteConteo([{ verificado: false }, { verificado: true }, { verificado: false }], false)
  expect(await contarDocumentosPendientes(canonica.cliente)).toBe(2)
  expect(canonica.pedidos).toEqual(['estado=pendiente', 'verificado=false'])
})

test('5. las dos rutas que cambian el estado y los dos contadores usan los helpers', () => {
  for (const ruta of ['src/app/api/admin/documentos/[id]/route.ts', 'src/app/api/admin/documentos/[id]/verificar/route.ts']) {
    const t = leer(ruta)
    expect(t, ruta).toContain('await aplicarDocEstado(estado, comentario ?? null, payload =>')
    expect(t, ruta).not.toMatch(/\.update\((nuevo|legacy)\)/)
  }
  for (const f of ['src/app/(dashboard)/admin/page.tsx', 'src/app/api/admin/stats/route.ts']) {
    const t = leer(f)
    expect(t, f).toContain('contarDocumentosPendientes(')
    expect(t, f).not.toContain(".eq('verificado', false)")
  }
})
