import {
  certificacionDelAlumno, inscripcionDelAlumno, tablaLicenciaturas,
} from '@/lib/licenciatura-utils'
import { etiquetaDuracionModalidad } from '@/lib/modalidades'

/**
 * Lo que cuesta el programa de LICENCIATURA de un alumno (#202, Bloque D · D13;
 * decisión 22).
 *
 * El alumno de licenciatura no veía en ningún lado cuánto cuesta su programa:
 * en una escuela mensual «Mis pagos» redirige a los enlaces de cobro, y en una
 * semanal la API ya leía la inscripción y la titulación publicadas pero la
 * pantalla las descartaba.
 *
 * Mismas lecturas que la ficha del admin y que «Mis pagos» semanal
 * (`inscripcionDelAlumno` / `certificacionDelAlumno`), sobre la config
 * PUBLICADA (`getSiteConfig()`): la inscripción y la titulación de su tabla, y
 * la mensualidad de SU plan con lo que el admin publicó (el merge escribe la
 * tabla efectiva en `cfg.licenciaturas`).
 *
 * `null` —y la pantalla no pinta nada— si no es licenciatura, si el add-on está
 * apagado, si su plan no está en la tabla o no tiene meses y mensualidad, o si
 * alguna cifra no es un número (clones con formas propias): nunca «NaN» ni un
 * total inventado. Un plan que el admin apagó DESPUÉS de inscribirlo sí se
 * muestra: el alumno lo sigue pagando.
 *
 * Solo dice QUÉ cuesta; cuándo se paga cada cosa (la titulación, sobre todo) lo
 * decide cada escuela, y aquí no se afirma.
 */
export type CostoPrograma = {
  modalidadId: string
  /** El nombre del plan como lo nombra el config, o su duración («12 meses»). */
  plan: string
  meses: number
  mensualidad: number
  inscripcion: number
  /** mensualidad × meses */
  colegiatura: number
  /** Título y cédula profesional. */
  titulacion: number
  /** inscripción + colegiatura + titulación */
  total: number
}

type PlanLic = { id?: unknown; label?: unknown; meses?: unknown; mensualidad?: unknown }

const cifra = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null

export function costoProgramaAlumno(
  nivel: string | null | undefined,
  modalidad: string | null | undefined,
  cfg: object,
): CostoPrograma | null {
  if (nivel !== 'licenciatura' || !modalidad) return null
  const lic = tablaLicenciaturas(cfg)
  if (lic?.activas !== true || !Array.isArray(lic.modalidades)) return null
  const p = (lic.modalidades as readonly PlanLic[]).find(m => m && typeof m === 'object' && m.id === modalidad)
  if (!p) return null
  const meses = cifra(p.meses)
  const mensualidad = cifra(p.mensualidad)
  if (!meses || !mensualidad || !Number.isInteger(meses)) return null
  const precios = (cfg as { precios?: unknown }).precios as Parameters<typeof inscripcionDelAlumno>[1]
  const inscripcion = cifra(inscripcionDelAlumno('licenciatura', precios, lic))
  const titulacion = cifra(certificacionDelAlumno('licenciatura', precios, lic))
  if (inscripcion === null || titulacion === null) return null
  const colegiatura = mensualidad * meses
  const label = typeof p.label === 'string' && p.label.trim() ? p.label.trim() : etiquetaDuracionModalidad(modalidad)
  return {
    modalidadId: modalidad,
    plan: label,
    meses,
    mensualidad,
    inscripcion,
    colegiatura,
    titulacion,
    total: inscripcion + colegiatura + titulacion,
  }
}
