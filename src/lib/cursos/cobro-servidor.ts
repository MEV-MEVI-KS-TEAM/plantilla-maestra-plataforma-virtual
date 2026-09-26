import type { SupabaseClient } from '@supabase/supabase-js'
import { resumenCobro, type EstadoCobro, type PagoDeCurso } from './cobro'
import type { PreciosCurso } from './precio-regla'

/**
 * Lo pagado y «Pagado · falta abrir» de CADA inscripción de un curso (Bloque D ·
 * D18, #207-7): la insignia de la pestaña Alumnos. Con las MISMAS reglas puras
 * de lib/cursos/cobro.ts (y el mismo precio de referencia que la ficha: la foto
 * del evento 'inscripcion' o la ficha de hoy, y el mismo tope del curso).
 *
 * Lee por lotes de ids (la URL de .in() tiene tope) y, dentro de cada lote, por
 * páginas de 1000 (PostgREST corta ahí SIN avisar: un diplomado de 12 meses con
 * 100 alumnos pasa de 1000 pagos por lote). Si algo falla —base sin B1 o sin
 * bitácora, red— devuelve un mapa vacío y lo deja en el log: la pestaña se queda
 * como antes (sin insignia), nunca un 500.
 */
const LOTE_IDS = 100
const PAGINA = 1000

export type InscripcionParaCobro = {
  id: string
  estado: string | null
  meses_desbloqueados: number
  acceso_total: boolean
  por_activar: boolean
}

export type CobroDeFila = { pagado: number; pagado_falta_abrir: boolean }

type Consulta = (lote: string[], desde: number, hasta: number) => PromiseLike<{ data: unknown; error: { message?: string } | null }>

/** Todas las filas de todos los lotes, página por página. null si una lectura falla. */
async function leerPorLotes<T>(ids: string[], leer: Consulta): Promise<T[] | null> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += LOTE_IDS) {
    const lote = ids.slice(i, i + LOTE_IDS)
    for (let desde = 0; ; desde += PAGINA) {
      const { data, error } = await leer(lote, desde, desde + PAGINA - 1)
      if (error) {
        console.error('[cobroPorInscripcion]', error.message)
        return null
      }
      const filas = (Array.isArray(data) ? data : []) as T[]
      out.push(...filas)
      if (filas.length < PAGINA) break
    }
  }
  return out
}

const cifra = (v: unknown): number | null => {
  const n = Number(v)
  return v !== null && v !== undefined && Number.isFinite(n) ? n : null
}

export async function cobroPorInscripcion(
  admin: SupabaseClient,
  ficha: PreciosCurso,
  inscripciones: readonly InscripcionParaCobro[],
  tope: number | null = null,
): Promise<Map<string, CobroDeFila>> {
  const mapa = new Map<string, CobroDeFila>()
  const ids = inscripciones.map(i => i.id)
  if (ids.length === 0) return mapa
  try {
    const [pagos, eventos] = await Promise.all([
      leerPorLotes<PagoDeCurso & { curso_inscripcion_id: string }>(ids, (lote, desde, hasta) => admin
        .from('pagos').select('id, curso_inscripcion_id, monto, concepto, mes_desbloqueado')
        .in('curso_inscripcion_id', lote).order('id', { ascending: true }).range(desde, hasta)),
      leerPorLotes<{ inscripcion_id: string; detalle: Record<string, unknown> | null; created_at: string }>(ids, (lote, desde, hasta) => admin
        .from('curso_inscripcion_eventos').select('id, inscripcion_id, detalle, created_at')
        .eq('tipo', 'inscripcion').in('inscripcion_id', lote).order('id', { ascending: true }).range(desde, hasta)),
    ])
    if (!pagos) return mapa
    // Agrupados una vez (no un filtro por fila).
    const pagosDe = new Map<string, PagoDeCurso[]>()
    for (const p of pagos) {
      const l = pagosDe.get(p.curso_inscripcion_id) ?? []
      l.push(p)
      pagosDe.set(p.curso_inscripcion_id, l)
    }
    const fotoDe = new Map<string, { ins: number | null; men: number | null; created_at: string }>()
    for (const e of eventos ?? []) {
      if (!e.detalle) continue
      const f = { ins: cifra(e.detalle.precio_inscripcion), men: cifra(e.detalle.precio_mensualidad), created_at: e.created_at }
      if (f.ins === null && f.men === null) continue
      const prev = fotoDe.get(e.inscripcion_id)
      if (!prev || f.created_at > prev.created_at) fotoDe.set(e.inscripcion_id, f)
    }
    for (const i of inscripciones) {
      const foto = fotoDe.get(i.id)
      const estado: EstadoCobro = {
        estado: i.estado,
        meses: i.meses_desbloqueados,
        acceso_total: i.acceso_total,
        por_activar: i.por_activar,
        ficha,
        referencia: foto
          ? { precios: { precio_inscripcion: foto.ins ?? 0, precio_mensualidad: foto.men ?? 0 }, origen: 'inscripcion' }
          : { precios: ficha, origen: 'ficha' },
        pagos: pagosDe.get(i.id) ?? [],
        tope,
      }
      const r = resumenCobro(estado)
      mapa.set(i.id, { pagado: r.pagado, pagado_falta_abrir: r.pagadoFaltaAbrir })
    }
  } catch (e) {
    console.error('[cobroPorInscripcion]', e)
    return new Map()
  }
  return mapa
}
