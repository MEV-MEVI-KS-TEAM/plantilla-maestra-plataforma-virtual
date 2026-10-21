/**
 * Lectura DEFENSIVA de lo que llega de la base para las actividades (sin React,
 * sin CSS: lo usan las pantallas, las API y las pruebas unitarias).
 *
 * Contrato de columnas (migración 20261021120000_actividades_pdf.sql):
 *   semanas.actividades jsonb · semanas.actividades_pdf_url text
 *   materias.cuaderno_pdf_url text
 *   curso_lecciones.actividades jsonb · curso_lecciones.actividades_pdf_url text
 *   cursos.cuaderno_pdf_url text
 * Todas NULL por defecto. NULL, vacío o con otra forma = «no hay»: la pantalla
 * no pinta nada (ni títulos vacíos ni botones que llevan a ningún lado).
 */
import type { ActividadesUnidad } from './tipos'

const esObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

/**
 * El JSON «actividades/1» si tiene la forma mínima que la pantalla necesita
 * para no reventar; null en cualquier otro caso (NULL, texto, otro esquema,
 * piezas faltantes). PostgREST entrega jsonb ya parseado, pero si alguien lo
 * guardó como texto JSON también se acepta.
 */
export function leerActividades(valor: unknown): ActividadesUnidad | null {
  let x = valor
  if (typeof x === 'string') {
    try { x = JSON.parse(x) } catch { return null }
  }
  if (!esObjeto(x) || x.esquema !== 'actividades/1') return null
  const u = x.unidad, e = x.esencial, a = x.actividades, auto = x.autoevaluacion
  if (!esObjeto(u) || typeof u.id !== 'string' || !u.id || typeof u.titulo !== 'string') return null
  if (!esObjeto(e) || typeof e.intro !== 'string' || !Array.isArray(e.puntos)) return null
  if (!Array.isArray(a) || !a.every(it => esObjeto(it) && typeof it.id === 'string' && typeof it.tipo === 'string')) return null
  if (!esObjeto(auto) || !Array.isArray(auto.reactivos)) return null
  // Sin nada que hacer no hay sección: ni actividades ni autoevaluación.
  if (a.length === 0 && auto.reactivos.length === 0) return null
  return x as unknown as ActividadesUnidad
}

/**
 * URL de un PDF publicable en un enlace: SOLO https absoluta. Cualquier otra
 * cosa (NULL, vacío, `javascript:`, http, relativa) → null y no se pinta botón.
 */
export function urlPdf(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const t = valor.trim()
  if (!t) return null
  try {
    const u = new URL(t)
    return u.protocol === 'https:' && u.hostname ? u.toString() : null
  } catch {
    return null
  }
}

/** Qué pinta una semana / lección. */
export type VistaActividades =
  | { tipo: 'nada' }
  | { tipo: 'solo-pdf'; pdfUrl: string }
  | { tipo: 'actividades'; datos: ActividadesUnidad; pdfUrl: string | null }

export function vistaActividades(actividades: unknown, pdf: unknown): VistaActividades {
  const datos = leerActividades(actividades)
  const pdfUrl = urlPdf(pdf)
  if (datos) return { tipo: 'actividades', datos, pdfUrl }
  if (pdfUrl) return { tipo: 'solo-pdf', pdfUrl }
  return { tipo: 'nada' }
}

/**
 * ¿El error de PostgREST dice que la base aún no tiene las columnas de esta
 * migración? (42703 en Postgres, PGRST204 en PostgREST.) Un cliente con el
 * código nuevo y la base sin migrar debe seguir viendo todo lo demás: se
 * reintenta la misma consulta sin las columnas.
 */
export function faltanColumnasActividades(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  const msg = (error.message ?? '').toLowerCase()
  return error.code === '42703' || error.code === 'PGRST204' ||
    msg.includes('actividades') || msg.includes('cuaderno_pdf_url')
}
