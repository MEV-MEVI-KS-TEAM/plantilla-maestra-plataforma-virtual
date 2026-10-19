/**
 * Cómo se llaman los cursos en el panel y en el menú (llave OPCIONAL
 * `CONFIG.etiquetaCursos`).
 *
 * En modo solo_cursos la plantilla rotula todo como «Diplomados» / «Mis
 * Diplomados». Una escuela que vende cursos (no diplomados) declara
 * `etiquetaCursos: { plural: 'Cursos', miPlural: 'Mis cursos' }`.
 *
 * ⚠️ SIN LA LLAVE, LOS RÓTULOS DE SIEMPRE: las escuelas ya entregadas no cambian.
 * 🛑 Solo cambia lo que se LEE. La ruta `/diplomados` no se renombra (purga,
 *    enlaces y catálogo dependen de ella), ni el valor técnico `nivel = 'diplomado'`.
 */
import { CONFIG } from '@/lib/config'

export type EtiquetasCursos = {
  /** Menú del admin y del secretario: «Diplomados». */
  plural: string
  /** Menú del alumno en solo_cursos: «Mis Diplomados». */
  miPlural: string
  /** ¿La escuela declaró la llave? Para los títulos que hoy dicen «Cursos y Diplomados». */
  propias: boolean
}

export function etiquetasCursos(): EtiquetasCursos {
  const e = (CONFIG as { etiquetaCursos?: { plural?: string; miPlural?: string } }).etiquetaCursos
  const plural = e?.plural?.trim() ?? ''
  const miPlural = e?.miPlural?.trim() ?? ''
  return {
    plural: plural || 'Diplomados',
    miPlural: miPlural || 'Mis Diplomados',
    propias: plural !== '' || miPlural !== '',
  }
}

/**
 * Cómo se nombra la institución en los avisos al alumno («tu escuela»). Llave
 * OPCIONAL `CONFIG.palabraInstitucion`; sin ella, 'escuela' como siempre. Un
 * centro de apoyo que no es escuela (CAAIV #288) declara 'centro'.
 */
export function palabraInstitucion(): string {
  const p = (CONFIG as { palabraInstitucion?: string }).palabraInstitucion
  return p?.trim() || 'escuela'
}

/** «la escuela» / «el centro»: el artículo por la terminación (-a → la). */
export function institucionConArticulo(): string {
  const p = palabraInstitucion()
  return `${/a$/i.test(p) ? 'la' : 'el'} ${p}`
}
