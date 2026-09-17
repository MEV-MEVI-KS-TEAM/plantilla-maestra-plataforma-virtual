/**
 * Identidad escrita de la escuela — piezas puras, sin React ni servidor.
 *
 * Una escuela que se presenta en dos renglones tiene un nombre de marca
 * (`CONFIG.nombre`) y un subtítulo, y ese subtítulo no es una clave nueva: se
 * DERIVA de `nombreCompleto`, que sí existe en el editor de «Personalizar mi
 * página». Si el admin cambia su nombre completo desde el panel, el subtítulo
 * lo sigue sin redeploy.
 *
 * Dos formas de nombre completo, las dos vistas en la flota:
 *
 *   · la marca DELANTE: «Aula Raíz, Centro Educativo» → «Centro Educativo»
 *     (en AULA RAÍZ #208 los dos son «Aula Raíz» y no hay subtítulo);
 *   · la SIGLA DETRÁS, entre paréntesis: «Universidad Virtual en Educación
 *     Profesional (UVEP)» con nombre «UVEP» → «Universidad Virtual en Educación
 *     Profesional» (UVEP #209).
 *
 * Cualquier otra combinación devuelve cadena vacía: no se adivina un subtítulo.
 */
export function subtituloMarca(nombre: string, nombreCompleto: string): string {
  const n = (nombre ?? '').trim()
  const c = (nombreCompleto ?? '').trim()
  if (!n || !c || c === n) return ''
  if (c.startsWith(n)) return c.slice(n.length).replace(/^[\s,.\-–—|]+/, '').trim()
  const sigla = `(${n})`
  if (c.endsWith(sigla)) return c.slice(0, c.length - sigla.length).replace(/[\s,.\-–—|]+$/, '').trim()
  return ''
}
