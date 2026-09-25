import { CONFIG } from '@/lib/config'
import { certificacionDe, inscripcionDe, type Precios } from '@/lib/precios-nivel'
import {
  inscripcionLicenciaturaDe,
  titulacionLicenciaturaDe,
  type LicenciaturaPrecios,
} from '@/lib/precios-licenciatura'

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

// ─── Costo completo del programa ────────────────────────────────────────────
//
// La tabla vive en CONFIG.licenciaturas y sus TRES PRECIOS (inscripción,
// titulación y la mensualidad de cada plan) se publican desde «Personalizar mi
// página» (Bloque B, precios-licenciatura.ts). El desglose recibe la tabla
// efectiva; sin argumento, la de config.ts. Lo pinta la landing animada; el
// registro y el alta solo ofrecen los planes, sin cifras.
//
// La titulación entra en el total a propósito. En la licenciatura suele ser la
// parte más grande de la inversión (62–65 % en UNIVERSIDAD INSPIRA #203, 56–59 %
// en UVEP #209): anunciar la mensualidad sola, con la titulación aparte, deja el
// costo real en letra chica. (Mismos helpers que LIBERATING KING ACADEMY #202 e
// INSPIRA #203.)

type ModalidadLicCfg = {
  id: string
  label: string
  meses: number
  mensualidad: number
  activa?: boolean
}

/** La tabla de precios de licenciatura, en la forma que lee el desglose. */
type TablaLic = {
  readonly activas?: unknown
  readonly inscripcion?: unknown
  readonly certificacion?: unknown
  readonly modalidades?: unknown
} | null | undefined

function cfgPrecios(): TablaLic {
  return (CONFIG as { licenciaturas?: TablaLic }).licenciaturas
}

export type DesgloseLicenciatura = {
  modalidadId: string
  /** Como la nombra el config (ej. «Regular 12 meses»). */
  etiqueta: string
  meses: number
  mensualidad: number
  inscripcion: number
  /** mensualidad × meses */
  colegiatura: number
  /** Título y cédula profesional (cuándo se paga lo dice cada escuela). */
  titulacion: number
  /** inscripción + colegiatura + titulación: el programa completo. */
  total: number
}

/**
 * El desglose de cada plan ACTIVO, en el orden del config. Vacío con el add-on
 * apagado. `lic` es la tabla efectiva (con lo publicado); sin ella, la de
 * config.ts. La regla de lectura es la de siempre, sin normalizar formas
 * propias: con nada publicado, el desglose es exactamente el de antes.
 */
export function getDesglosesLicenciatura(lic: TablaLic = cfgPrecios()): DesgloseLicenciatura[] {
  if (!lic?.activas) return []
  const inscripcion = Number(lic.inscripcion ?? 0)
  const titulacion = Number(lic.certificacion ?? 0)
  return ((lic.modalidades ?? []) as readonly ModalidadLicCfg[])
    .filter(m => m.activa !== false && m.meses > 0 && m.mensualidad > 0)
    .map(m => {
      const colegiatura = m.mensualidad * m.meses
      return {
        modalidadId: m.id,
        etiqueta: m.label,
        meses: m.meses,
        mensualidad: m.mensualidad,
        inscripcion,
        colegiatura,
        titulacion,
        total: inscripcion + colegiatura + titulacion,
      }
    })
}

/** El desglose de un plan. `lic`: la tabla efectiva, como en `getDesglosesLicenciatura`. */
export function getDesgloseLicenciatura(
  modalidadId: string | null | undefined,
  lic: TablaLic = cfgPrecios(),
): DesgloseLicenciatura | null {
  if (!modalidadId) return null
  return getDesglosesLicenciatura(lic).find(d => d.modalidadId === modalidadId) ?? null
}

/**
 * El total común a TODOS los planes, o `null` si alguno difiere o hay menos de
 * dos. «Los planes cuestan lo mismo» solo se afirma con esto: se CALCULA de los
 * precios en vez de confiar en una bandera del config, así que el día que cambie
 * un precio la frase desaparece sola en vez de quedar mintiendo.
 */
export function getTotalComunLicenciatura(
  desgloses: readonly DesgloseLicenciatura[] = getDesglosesLicenciatura(),
): number | null {
  if (desgloses.length < 2) return null
  return desgloses.every(d => d.total === desgloses[0].total) ? desgloses[0].total : null
}

/**
 * La parte que la titulación representa del costo total del plan, redondeada
 * (56 % y 59 % en UVEP). `null` sin titulación o sin total.
 */
export function porcentajeTitulacion(d: DesgloseLicenciatura | null | undefined): number | null {
  if (!d || d.total <= 0 || d.titulacion <= 0) return null
  return Math.round((d.titulacion / d.total) * 100)
}

// ─── Lo que paga UN alumno según su nivel (#164) ─────────────────────────────
//
// `inscripcionDe` y `certificacionDe` (precios-nivel.ts) son de Secundaria y
// Preparatoria: a cualquier otro nivel le dan la inscripción general y la
// certificación de preparatoria. Todo lo que le cobra o le confirma una cifra a
// UN alumno pasa por aquí, que manda a licenciatura a su propia tabla.
//
// `precios` y `lic` son los del config FUSIONADO (`getSiteConfig()`), nunca
// CONFIG a pelo: por eso `lic` no tiene default.

/**
 * La tabla de licenciatura de un config (el FUSIONADO). Con cast, como el resto
 * del add-on (`cfgLic`, `modalidadesLic`): hay clones cuyo config.ts no declara
 * `licenciaturas`, y `cfg.licenciaturas` a secas no compilaría allí.
 */
export function tablaLicenciaturas(cfg: object): LicenciaturaPrecios {
  return (cfg as { licenciaturas?: LicenciaturaPrecios }).licenciaturas
}

/**
 * La inscripción del alumno. Licenciatura: la de su programa. Si el add-on está
 * apagado o el clon la guarda con una forma propia (objeto por moneda o por
 * tarifa), la de antes: `inscripcionDe`. Cualquier otro nivel, `inscripcionDe`
 * sin cambio (diplomado y sin nivel siguen con la general).
 */
export function inscripcionDelAlumno(
  nivel: string | null | undefined,
  precios: Precios,
  lic: LicenciaturaPrecios,
): number {
  return (nivel === 'licenciatura' ? inscripcionLicenciaturaDe(lic) : null) ?? inscripcionDe(nivel, precios)
}

/**
 * La certificación del alumno (#162). Secundaria y preparatoria: la canónica.
 * Licenciatura: su titulación. Diplomado y sin nivel: 0, para no anunciarles la
 * certificación de preparatoria.
 */
export function certificacionDelAlumno(
  nivel: string | null | undefined,
  precios: Precios,
  lic: LicenciaturaPrecios,
): number {
  if (nivel === 'licenciatura') return titulacionLicenciaturaDe(lic) ?? 0
  return nivel === 'secundaria' || nivel === 'preparatoria' ? certificacionDe(nivel, precios) : 0
}
