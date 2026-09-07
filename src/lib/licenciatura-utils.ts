import { CONFIG } from '@/lib/config'

/**
 * Helpers del add-on de licenciaturas.
 *
 * Existen sobre todo por el ternario que la plantilla repetía en media docena
 * de pantallas:
 *
 *   alumno.nivel === 'preparatoria' ? 'Preparatoria' : 'Secundaria'
 *
 * Con un tercer programa ese ternario etiqueta a los alumnos de licenciatura
 * como "Secundaria". `getPlanNombre` es el reemplazo, y devuelve el nombre de
 * la carrera cuando lo hay.
 */

type CarreraCfg = {
  slug: string
  nombre: string
  cuatrimestres: number
  totalMaterias: number
  icono: string
  desc: string
  incluye: readonly string[]
  /**
   * Un diplomado montado sobre los rieles de licenciatura: se guarda como
   * `nivel='licenciatura'` + su `carrera`, y hereda modalidades, precios,
   * materias y constancia del add-on. Lo único que cambia es cómo se le
   * presenta al prospecto (TICKET-2026-09-07-52).
   */
  esDiplomado?: boolean
}

function cfgLic() {
  return (CONFIG as { licenciaturas?: { activas?: boolean; carreras?: readonly CarreraCfg[] } }).licenciaturas
}

export function licenciaturasActivas(): boolean {
  return cfgLic()?.activas === true
}

export function getCarreras(): readonly CarreraCfg[] {
  return cfgLic()?.carreras ?? []
}

/**
 * Carreras de licenciatura propiamente dichas — sin los diplomados.
 *
 * ⚠️ NO sustituye a `getCarreras()`: esa sigue devolviendo TODO, porque el resto
 * de la plataforma (materias, constancia, scoping por carrera) trata a un
 * diplomado exactamente igual que a una licenciatura y necesita verlo. La
 * separación es solo de cara al prospecto.
 */
export function getCarrerasLicenciatura(): readonly CarreraCfg[] {
  return getCarreras().filter(c => c.esDiplomado !== true)
}

/** Solo los diplomados montados sobre el riel de licenciaturas. */
export function getCarrerasDiplomado(): readonly CarreraCfg[] {
  return getCarreras().filter(c => c.esDiplomado === true)
}

/**
 * Cómo llama la escuela a su oferta de licenciatura. Por defecto «Licenciatura»;
 * un cliente que venda «Licenciatura ejecutiva» lo pone en
 * `CONFIG.licenciaturas.etiqueta` y el formulario lo llama igual que su landing.
 */
export function getEtiquetaLicenciatura(): string {
  const cfg = cfgLic() as { etiqueta?: string } | undefined
  return cfg?.etiqueta?.trim() || 'Licenciatura'
}

export function esAlumnoLicenciatura(alumno: { nivel?: string | null }): boolean {
  return alumno?.nivel === 'licenciatura'
}

export function getNombreCarrera(carrera: string | null | undefined): string {
  if (!carrera) return 'Licenciatura'
  return getCarreras().find(c => c.slug === carrera)?.nombre ?? carrera
}

/** Etiqueta del programa del alumno. Reemplaza al ternario Prepa/Secundaria. */
export function getPlanNombre(
  nivel: string | null | undefined,
  carrera?: string | null,
): string {
  if (nivel === 'licenciatura') return getNombreCarrera(carrera)
  if (nivel === 'preparatoria') return 'Preparatoria'
  if (nivel === 'secundaria')   return 'Secundaria'
  if (nivel === 'demo')         return 'Demo'
  return nivel ?? '—'
}

/** Cuatrimestre al que pertenece una materia por su orden (4 materias c/u). */
export function getCuatrimestreDeOrden(orden: number): number {
  return Math.max(1, Math.ceil(orden / 4))
}

export function agruparPorCuatrimestre<T extends { orden?: number | null }>(
  materias: readonly T[],
): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const m of materias) {
    const c = getCuatrimestreDeOrden(m.orden ?? 1)
    if (!mapa.has(c)) mapa.set(c, [])
    mapa.get(c)!.push(m)
  }
  return mapa
}
