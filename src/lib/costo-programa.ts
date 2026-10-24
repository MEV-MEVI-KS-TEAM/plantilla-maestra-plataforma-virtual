import { tablaLicenciaturas } from '@/lib/licenciatura-utils'
import {
  bloqueLicEditable, inscripcionLicenciaturaDe, planLicEditable, titulacionLicenciaturaDe,
} from '@/lib/precios-licenciatura'

/**
 * Lo que cuesta el programa de LICENCIATURA de un alumno (#202, Bloque D · D13;
 * decisión 22).
 *
 * El alumno de licenciatura no veía en ningún lado cuánto cuesta su programa:
 * en una escuela mensual «Mis pagos» redirige a los enlaces de cobro, y en una
 * semanal la API ya leía la inscripción y la titulación publicadas pero la
 * pantalla las descartaba.
 *
 * Sobre la config PUBLICADA (`getSiteConfig()`: el merge escribe la tabla
 * efectiva en `cfg.licenciaturas`): la inscripción y la titulación de la tabla
 * y la mensualidad de SU plan, con lo que el admin publicó. Con la forma
 * estándar son exactamente las cifras de la ficha del admin
 * (`inscripcionDelAlumno` / `certificacionDelAlumno`) y de la landing.
 *
 * Una tarjeta con un total equivocado es PEOR que ninguna. `null` —y la
 * pantalla no pinta nada— si:
 *  - no es licenciatura o no tiene plan;
 *  - la tabla no tiene la forma ESTÁNDAR del add-on (`bloqueLicEditable`, la
 *    misma que el panel puede publicar): los clones con formas propias (precio
 *    por moneda o por carrera, `rutas`, `titulacionIncluida`, planes con
 *    `total` u `opciones`) calculan su precio de otra manera;
 *  - la inscripción o la titulación no son cifras (no se cae a la general);
 *  - su carrera es un DIPLOMADO montado en el riel (`esDiplomado`) o su plan es
 *    `*_dip`: ahí `certificacion` no es un título y cédula;
 *  - su plan no es estándar, está apagado en config.ts (el precio publicado ya
 *    no se le aplica: se mostraría uno que quizá no es el que se le vendió) o
 *    no tiene meses y mensualidad.
 *
 * Solo dice QUÉ cuesta; cuándo se paga cada cosa (la titulación, sobre todo) lo
 * decide cada escuela, y aquí no se afirma.
 */
export type CostoPrograma = {
  modalidadId: string
  /** El nombre del plan como lo nombra el config. */
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

export type AlumnoPrograma = {
  nivel?: string | null
  modalidad?: string | null
  carrera?: string | null
}

const esPlano = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function costoProgramaAlumno(alumno: AlumnoPrograma, cfg: object): CostoPrograma | null {
  const { nivel, modalidad, carrera } = alumno
  if (nivel !== 'licenciatura' || !modalidad) return null
  const tabla = tablaLicenciaturas(cfg)
  const lic: unknown = tabla
  if (!bloqueLicEditable(lic)) return null
  const suCarrera = (lic.carreras as unknown[]).find(c => esPlano(c) && c.slug === carrera)
  if (esPlano(suCarrera) && suCarrera.esDiplomado === true) return null
  const p = (lic.modalidades as unknown[]).find(m => esPlano(m) && m.id === modalidad)
  if (!planLicEditable(p) || !Number.isInteger(p.meses) || p.mensualidad <= 0) return null
  const inscripcion = inscripcionLicenciaturaDe(tabla)
  const titulacion = titulacionLicenciaturaDe(tabla)
  if (inscripcion === null || titulacion === null) return null
  const colegiatura = p.mensualidad * p.meses
  const label = typeof p.label === 'string' && p.label.trim() ? p.label.trim() : `${p.meses} meses`
  return {
    modalidadId: modalidad,
    // La tarjeta «Tu programa» antepone «Plan»: con un label «Plan 18 meses» decía
    // «Plan Plan 18 meses» (visto en #258 y #261). Se quita el «Plan» inicial.
    plan: label.replace(/^plan\s+/i, ''),
    meses: p.meses,
    mensualidad: p.mensualidad,
    inscripcion,
    colegiatura,
    titulacion,
    total: inscripcion + colegiatura + titulacion,
  }
}
