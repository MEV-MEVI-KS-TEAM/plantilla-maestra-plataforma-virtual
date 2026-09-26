/**
 * Precio de un curso o diplomado: la regla ÚNICA para todas las superficies
 * (las dos portadas, /diplomados, la ficha y el registro).
 *
 * Módulo PURO: sin Supabase ni next. Existe aparte de catalogo.ts porque el
 * registro y la landing clásica son 'use client', y catalogo.ts importa el
 * cliente admin. catalogo.ts re-exporta todo lo de aquí, así que sus imports
 * de siempre siguen valiendo.
 */
import { CONFIG } from '@/lib/config'
import { formatearMoneda } from '@/lib/moneda'

// La regla numérica, el texto sin precio y lo que anuncia el registro de una
// oferta viven en precio-regla.ts, sin imports, para que el generador de la
// entrega (Node, sin alias '@/') use los MISMOS.
import {
  precioCursoNumerico, resolverPrecioOferta, TEXTO_SIN_PRECIO, AVISO_PAGO_UNICO,
  type PreciosCurso, type PrecioNumerico, type PrecioOferta, type OfertaConPrecio,
} from './precio-regla'
export {
  precioCursoNumerico, resolverPrecioOferta, TEXTO_SIN_PRECIO, AVISO_PAGO_UNICO,
  type PreciosCurso, type PrecioNumerico, type PrecioOferta, type OfertaConPrecio,
}

/**
 * Precio de catálogo, sin decimales — los precios de la plantilla son enteros.
 *
 * Se llamaba `precioMXN` y forzaba pesos. El nombre era el bug: en una escuela
 * que cobra en dólares anunciaba un diplomado de 450 USD como "$450", en la
 * misma página y con el mismo aspecto que los precios en pesos del resto de la
 * flota.
 */
export function precioPublico(n: number): string {
  return formatearMoneda(n, CONFIG, { conCodigo: true })
}

/** `precioCursoNumerico` con los montos ya formateados, para pintarlos. */
export type PrecioCatalogo =
  | { tipo: 'mensual'; mensualidad: string; inscripcion: string | null }
  | { tipo: 'unico'; monto: string }
  | { tipo: 'informes' }

/** Formatea un precio ya resuelto (de la ficha o de una oferta). */
export function formatearPrecio(p: PrecioNumerico): PrecioCatalogo {
  if (p.tipo === 'mensual') {
    return { tipo: 'mensual', mensualidad: precioPublico(p.mensualidad), inscripcion: p.inscripcion !== null ? precioPublico(p.inscripcion) : null }
  }
  if (p.tipo === 'unico') return { tipo: 'unico', monto: precioPublico(p.monto) }
  return { tipo: 'informes' }
}

export function precioCatalogo(c: PreciosCurso): PrecioCatalogo {
  return formatearPrecio(precioCursoNumerico(c))
}

/**
 * El precio en UNA línea: «$2,490 · pago único», «$900 al mes», «Pide
 * informes». La usan la portada animada y el registro, para que digan lo mismo
 * con las mismas palabras. La inscripción de un mensual no va aquí: el
 * registro la pinta en su propia línea (con la equivalencia junto a SU monto).
 */
export function lineaPrecio(p: PrecioCatalogo): string {
  if (p.tipo === 'mensual') return `${p.mensualidad} al mes`
  if (p.tipo === 'unico') return `${p.monto} · pago único`
  return TEXTO_SIN_PRECIO
}

/**
 * Precio del curso elegido en el registro («¿Cuál?»). Si ese curso es, él solo,
 * una oferta de Cursos de Ingreso (no un paquete), sale con la MISMA regla que la
 * tarjeta de esa oferta, para que la pantalla no dé dos cifras del mismo curso
 * (ficha en 0/0 y config.ts con precio: las dos dicen el de config.ts). Si no,
 * con la regla del catálogo.
 */
export function precioDeCursoElegido(
  cursoId: string,
  ofertas: readonly OfertaConPrecio[],
  publicados: ReadonlyMap<string, PreciosCurso>,
): PrecioNumerico {
  const oferta = ofertas.find(o => !o.esPaquete && o.cursoIds.length === 1 && o.cursoIds[0] === cursoId)
  if (oferta) return resolverPrecioOferta(oferta, publicados)
  return precioCursoNumerico(publicados.get(cursoId) ?? {})
}
