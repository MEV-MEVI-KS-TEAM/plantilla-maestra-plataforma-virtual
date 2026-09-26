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
