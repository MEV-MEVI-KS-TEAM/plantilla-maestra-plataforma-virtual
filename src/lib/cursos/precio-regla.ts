/**
 * La regla del precio de un curso, SIN imports.
 *
 * Existe aparte de precio-curso.ts porque la usa también el generador de la
 * entrega (scripts/entrega/generar-entrega.mjs), que corre en Node con el type
 * stripping nativo y no entiende los alias '@/' que importa precio-curso.ts
 * (config y moneda). Así la página, el registro y el PDF de entrega dicen lo
 * mismo del mismo curso: antes el PDF ponía «Lo defines tú» donde la página ya
 * decía «Pide informes».
 *
 * precio-curso.ts re-exporta todo lo de aquí.
 */

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

/** Lo que el catálogo dice de un curso SIN precio capturado. */
export const TEXTO_SIN_PRECIO = 'Pide informes'
