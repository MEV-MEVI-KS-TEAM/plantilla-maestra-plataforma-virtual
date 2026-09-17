/**
 * Cómo se LLAMA cada nivel de cara a la persona.
 *
 * ⚠️ POR QUÉ EXISTE. El id interno de un nivel (`preparatoria`) lo usan el seed
 * del banco de materias, las RLS, los CHECK de `alumnos.nivel` y la lógica de
 * modalidades: renombrarlo rompería todo eso. Pero una escuela puede vender
 * «Bachillerato» y no poder enseñar la palabra «Preparatoria» en ninguna
 * pantalla, PDF, Excel ni mensaje (INEDI #207). Así que se separan las capas:
 *
 *   id en BD / config / rutas  → `preparatoria` (NO se toca)
 *   texto visible              → `etiquetaNivel('preparatoria')`
 *
 * El nombre visible sale de `CONFIG.etiquetasNivel`. AULA RAÍZ (#208) vende
 * «Secundaria» y «Preparatoria» con esos mismos nombres y no declara la clave,
 * así que aquí todo sale igual que de fábrica. El helper se porta de todos
 * modos porque la landing lo usa para armar frases con artículo («la
 * Secundaria y la Preparatoria») sin capitalizar ids a mano.
 *
 * 🛑 Ningún componente imprime `nivel` crudo ni lo capitaliza por su cuenta
 *    (`capitalize(nivel)`, `nivel.charAt(0).toUpperCase()`, la clase CSS
 *    `capitalize`): todo pasa por aquí.
 *
 * Puro: lo importan componentes cliente, rutas de servidor y pruebas.
 */
import { CONFIG } from '@/lib/config'

/** Los nombres de fábrica. Solo se usan si la escuela no declara el suyo. */
const DE_FABRICA: Readonly<Record<string, string>> = {
  secundaria: 'Secundaria',
  preparatoria: 'Preparatoria',
  licenciatura: 'Licenciatura',
  diplomado: 'Curso o diplomado',
}

function propias(): Readonly<Record<string, string | undefined>> {
  return (CONFIG as { etiquetasNivel?: Readonly<Record<string, string | undefined>> }).etiquetasNivel ?? {}
}

/** «Secundaria», «Bachillerato»… Vacío si no hay nivel. */
export function etiquetaNivel(nivel: string | null | undefined): string {
  const id = String(nivel ?? '').trim().toLowerCase()
  if (!id) return ''
  const propia = propias()[id]?.trim()
  if (propia) return propia
  return DE_FABRICA[id] ?? id.charAt(0).toUpperCase() + id.slice(1)
}

/**
 * El nombre con su artículo: «la Secundaria», «el Bachillerato». Por la
 * terminación del nombre VISIBLE (no del id): «Preparatoria» es femenino y
 * «Bachillerato» masculino.
 */
export function etiquetaNivelConArticulo(nivel: string | null | undefined): string {
  const e = etiquetaNivel(nivel)
  if (!e) return ''
  return `${/a$/i.test(e) ? 'la' : 'el'} ${e}`
}

/** «A», «A y B», «A, B y C». */
export function listaConY(items: readonly string[]): string {
  const limpios = items.filter(Boolean)
  if (limpios.length <= 1) return limpios[0] ?? ''
  return `${limpios.slice(0, -1).join(', ')} y ${limpios[limpios.length - 1]}`
}

/** «Secundaria y Bachillerato» con los niveles que recibe, en ese orden. */
export function nivelesTexto(niveles: readonly string[]): string {
  return listaConY(niveles.map(etiquetaNivel))
}
