import type { CursoCatalogoItem } from '@/types/cursos-alumno'

/**
 * «Mis Diplomados» (Bloque D · D19, #207-8; decisión 8): el resumen de lo que el
 * alumno ha pagado a un curso, sin recibo descargable. null sin pagos.
 */
export function resumenPagosCurso(p: CursoCatalogoItem['pagos'], fmt: (n: number) => string): string | null {
  if (!p || !(p.pagado > 0)) return null
  const fecha = p.ultimo?.fecha
    ? new Date(`${p.ultimo.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  return `Pagado ${fmt(p.pagado)}${fecha ? ` · último pago ${fecha}` : ''}`
}

export type PagoCursoAlumno = { curso_inscripcion_id: string; monto: number | string | null; fecha_pago: string | null; created_at: string | null }
export type ResumenPagosCurso = { pagado: number; ultimo: { fecha: string; monto: number } | null }

/**
 * Lo pagado y el último pago de cada CURSO, con los pagos de SUS inscripciones.
 * Un pago cuya inscripción no está en `cursoDeInscripcion` (de otro alumno, o de
 * un curso que no se le lista) no cuenta. Centavos redondeados.
 */
export function pagosPorCurso(
  cursoDeInscripcion: ReadonlyMap<string, string>,
  pagos: readonly PagoCursoAlumno[],
): Map<string, ResumenPagosCurso> {
  const out = new Map<string, ResumenPagosCurso>()
  for (const p of pagos) {
    const cursoId = cursoDeInscripcion.get(p.curso_inscripcion_id)
    if (!cursoId) continue
    const monto = Number(p.monto)
    if (!Number.isFinite(monto) || monto <= 0) continue
    const fecha = (p.fecha_pago ?? p.created_at ?? '').slice(0, 10)
    const acc = out.get(cursoId) ?? { pagado: 0, ultimo: null }
    acc.pagado = Math.round((acc.pagado + monto) * 100) / 100
    if (!acc.ultimo || fecha > acc.ultimo.fecha) acc.ultimo = { fecha, monto }
    out.set(cursoId, acc)
  }
  return out
}

/** Una fila de `curso_inscripciones` del alumno. `estado` llega con B1. */
export type InscripcionAlumno = { id: string; curso_id: string; estado?: string | null }

/**
 * D20d (remate f): a dónde va cada inscripción en «Mis Diplomados». La cancelada
 * sale de la cuadrícula y pasa al bloque «Cursos cancelados» SOLO si pagó algo
 * (sin pagos no hay nada que enseñarle). Sin `estado` (base sin B1) todo es
 * vigente, como antes. suspendida y completada siguen en la cuadrícula: el visor
 * ya explica por qué no ve el contenido. Devuelve ids de CURSO, en el orden de
 * entrada (una inscripción por curso: UNIQUE (curso_id, alumno_id)).
 */
export function repartirInscripciones(
  inscripciones: readonly InscripcionAlumno[],
  pagos: ReadonlyMap<string, ResumenPagosCurso>,
): { vigentes: string[]; canceladas: string[] } {
  const vigentes: string[] = []
  const canceladas: string[] = []
  for (const i of inscripciones) {
    if (i.estado !== 'cancelada') vigentes.push(i.curso_id)
    else if ((pagos.get(i.curso_id)?.pagado ?? 0) > 0) canceladas.push(i.curso_id)
  }
  return { vigentes, canceladas }
}
