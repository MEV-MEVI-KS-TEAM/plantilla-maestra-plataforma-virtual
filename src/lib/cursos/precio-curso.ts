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

/** Los dos precios de la ficha del curso (tabla `cursos`). */
export interface PreciosCurso {
  precio_inscripcion?: number | null
  precio_mensualidad?: number | null
}

/**
 * Qué se cobra, en números.
 *
 * 🛑 UN CURSO SIN PRECIO NO ES UN CURSO GRATIS. La tabla `cursos` guarda
 * `DEFAULT 0` en los dos precios, y los bancos de cursos siembran el curso
 * PUBLICADO sin precio: la portada animada lo anunciaba «Sin costo» y
 * `/diplomados` ponía «$0» hasta que alguien se acordara de capturarlo. La tabla
 * no tiene un campo explícito de «gratis», así que con los dos precios en 0 (o
 * negativos) el curso dice «Pide informes» y el visitante pregunta.
 *
 *   · mensualidad > 0 → `mensual` (con la inscripción, si la hay);
 *   · solo inscripción > 0 → `unico` (pago único);
 *   · ninguno → `informes`.
 */
export type PrecioNumerico =
  | { tipo: 'mensual'; mensualidad: number; inscripcion: number | null }
  | { tipo: 'unico'; monto: number }
  | { tipo: 'informes' }

export function precioCursoNumerico(c: PreciosCurso): PrecioNumerico {
  const mensualidad = Number(c.precio_mensualidad ?? 0)
  const inscripcion = Number(c.precio_inscripcion ?? 0)
  if (mensualidad > 0) return { tipo: 'mensual', mensualidad, inscripcion: inscripcion > 0 ? inscripcion : null }
  if (inscripcion > 0) return { tipo: 'unico', monto: inscripcion }
  return { tipo: 'informes' }
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

/** Lo que el catálogo dice de un curso SIN precio capturado. */
export const TEXTO_SIN_PRECIO = 'Pide informes'

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
 * Precio que anuncia el registro para una oferta de Cursos de Ingreso
 * (CONFIG.cursosIngreso). Hasta el Bloque C salía SOLO de config.ts: la escuela
 * cambiaba el precio en /admin/cursos/[id] y la portada lo mostraba, pero el
 * registro seguía con el número viejo. Ahora, en orden:
 *
 *   1. PAQUETE → `precioPaquete` de config.ts: la tabla no tiene precio de
 *      paquete. Sin él, «Pide informes».
 *   2. Oferta de UN curso publicado con precio en su ficha → manda la ficha,
 *      con la misma regla que el catálogo (la mensualidad gana).
 *   3. Si la ficha está en 0/0 (o el curso no está publicado, o no llegó el
 *      catálogo), el `precio` de config.ts es el respaldo: lo de siempre.
 *   4. Nada → «Pide informes». Nunca «$0».
 *
 * Una oferta de varios cursos que NO es paquete no tiene una ficha que mande:
 * salta el paso 2 (falla cerrado hacia config.ts).
 */
export type PrecioOferta =
  | (Exclude<PrecioNumerico, { tipo: 'informes' }> & { fuente: 'tabla' | 'config' })
  | { tipo: 'informes' }

export interface OfertaConPrecio { cursoIds: readonly string[]; precio: number; esPaquete: boolean }

export function resolverPrecioOferta(
  oferta: OfertaConPrecio,
  publicados: ReadonlyMap<string, PreciosCurso> | null,
): PrecioOferta {
  const respaldo: PrecioOferta = oferta.precio > 0
    ? { tipo: 'unico', monto: oferta.precio, fuente: 'config' }
    : { tipo: 'informes' }
  if (oferta.esPaquete) return respaldo
  if (oferta.cursoIds.length === 1 && publicados) {
    const fila = publicados.get(oferta.cursoIds[0])
    if (fila) {
      const p = precioCursoNumerico(fila)
      if (p.tipo !== 'informes') return { ...p, fuente: 'tabla' }
    }
  }
  return respaldo
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
