import type { SupabaseClient } from '@supabase/supabase-js'
import { resumenCobro, type EstadoCobro, type PagoDeCurso } from './cobro'
import type { PreciosCurso } from './precio-regla'

/**
 * Lo pagado y «Pagado · falta abrir» de CADA inscripción de un curso (Bloque D ·
 * D18, #207-7): la insignia de la pestaña Alumnos. Con las MISMAS reglas puras
 * de lib/cursos/cobro.ts (y el mismo precio de referencia que la ficha: la foto
 * del evento 'inscripcion' o la ficha de hoy).
 *
 * Lee por lotes de ids (la URL de .in() tiene tope, como la bitácora). Si algo
 * falla —base sin B1 o sin bitácora, red— devuelve un mapa vacío: la pestaña
 * se queda como antes (sin insignia), nunca un 500.
 */
const LOTE_IDS = 100

export type InscripcionParaCobro = {
  id: string
  estado: string | null
  meses_desbloqueados: number
  acceso_total: boolean
  por_activar: boolean
}

export type CobroDeFila = { pagado: number; pagado_falta_abrir: boolean }

async function porLotes<T>(ids: string[], leer: (lote: string[]) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[] | null> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += LOTE_IDS) {
    const { data, error } = await leer(ids.slice(i, i + LOTE_IDS))
    if (error) return null
    out.push(...((Array.isArray(data) ? data : []) as T[]))
  }
  return out
}

export async function cobroPorInscripcion(
  admin: SupabaseClient,
  ficha: PreciosCurso,
  inscripciones: readonly InscripcionParaCobro[],
): Promise<Map<string, CobroDeFila>> {
  const mapa = new Map<string, CobroDeFila>()
  const ids = inscripciones.map(i => i.id)
  if (ids.length === 0) return mapa
  try {
    const [pagos, eventos] = await Promise.all([
      porLotes<PagoDeCurso & { curso_inscripcion_id: string }>(ids, lote => admin
        .from('pagos').select('curso_inscripcion_id, monto, concepto, mes_desbloqueado').in('curso_inscripcion_id', lote)),
      porLotes<{ inscripcion_id: string; detalle: Record<string, unknown> | null; created_at: string }>(ids, lote => admin
        .from('curso_inscripcion_eventos').select('inscripcion_id, detalle, created_at').eq('tipo', 'inscripcion').in('inscripcion_id', lote)),
    ])
    if (!pagos) return mapa
    const cifra = (v: unknown): number | null => {
      const n = Number(v)
      return v !== null && v !== undefined && Number.isFinite(n) ? n : null
    }
    for (const i of inscripciones) {
      const foto = (eventos ?? []).filter(e => e.inscripcion_id === i.id && e.detalle)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(e => ({ ins: cifra(e.detalle?.precio_inscripcion), men: cifra(e.detalle?.precio_mensualidad) }))
        .find(p => p.ins !== null || p.men !== null)
      const estado: EstadoCobro = {
        estado: i.estado,
        meses: i.meses_desbloqueados,
        acceso_total: i.acceso_total,
        por_activar: i.por_activar,
        ficha,
        referencia: foto
          ? { precios: { precio_inscripcion: foto.ins ?? 0, precio_mensualidad: foto.men ?? 0 }, origen: 'inscripcion' }
          : { precios: ficha, origen: 'ficha' },
        pagos: pagos.filter(p => p.curso_inscripcion_id === i.id),
      }
      const r = resumenCobro(estado)
      mapa.set(i.id, { pagado: r.pagado, pagado_falta_abrir: r.pagadoFaltaAbrir })
    }
  } catch {
    return new Map()
  }
  return mapa
}
