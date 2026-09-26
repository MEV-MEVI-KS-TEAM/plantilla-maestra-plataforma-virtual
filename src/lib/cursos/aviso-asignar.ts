/**
 * El aviso de «se abrió solo el mes 1» al asignar un curso (C3b, #183).
 *
 * «Asignar» abre con la regla de la FICHA del curso: pago único → todo; mensual
 * o sin precio → el mes 1. Pero la escuela pudo haber cobrado un pago único:
 *   · porque así se anuncia hoy la oferta (un paquete, o una ficha en 0/0 con el
 *     precio de config.ts), aunque la ficha de algún curso sea mensual; o
 *   · porque la ficha no tiene precio y no hay oferta que diga otra cosa.
 * En esos casos se avisa, para que el admin use «Abrir todo». El anuncio es el de
 * HOY (lo que el registro no guarda no se puede reconstruir): por eso el texto va
 * en presente.
 *
 * Es pura para probar su tabla de verdad (tests/unit/c3b-acceso-total.spec.ts).
 */
import type { PrecioOferta } from './precio-curso'

export interface CursoAsignado {
  nombre: string
  acceso_total: boolean
  sin_precio: boolean
}

/**
 * @param asignados los cursos que ESTA asignación inscribió (no los que ya
 *   estaban ni los que fallaron)
 * @param anuncio lo que hoy anuncia el registro para la oferta del alumno, o
 *   null si no hay oferta o no se sabe (catálogo sin cargar)
 * @returns el texto del aviso, o null si no hace falta
 */
export function avisoMes1(asignados: readonly CursoAsignado[], anuncio: PrecioOferta | null): string | null {
  const mes1 = asignados.filter(c => !c.acceso_total)
  if (mes1.length === 0) return null
  if (anuncio?.tipo === 'unico') {
    return `Ojo: hoy esta oferta se anuncia como pago único, pero en ${mes1.map(c => c.nombre).join(', ')} `
      + 'se abrió solo el mes 1 (su ficha es mensual o no tiene precio). Si cobraste un pago único, '
      + 'usa «Abrir todo» en Gestionar cursos → el curso → Alumnos.'
  }
  const sinPrecio = mes1.filter(c => c.sin_precio).map(c => c.nombre)
  if (sinPrecio.length) {
    return `Ojo: ${sinPrecio.join(', ')} no tiene precio en su ficha y se abrió solo el mes 1. `
      + 'Si cobraste un pago único, usa «Abrir todo» en Gestionar cursos → el curso → Alumnos, y ponle precio al curso.'
  }
  return null
}
