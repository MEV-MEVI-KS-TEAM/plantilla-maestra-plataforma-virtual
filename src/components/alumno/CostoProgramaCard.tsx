import type { CostoPrograma } from '@/lib/costo-programa'
import { formatoMXN } from '@/lib/formato'

const meses = (n: number) => `${n} ${n === 1 ? 'mes' : 'meses'}`

/**
 * Los renglones de «Tu programa» (#202, Bloque D · D13; decisión 22). Puro,
 * para que la tarjeta y sus pruebas digan lo mismo.
 *
 *  - Escuela MENSUAL: la colegiatura con su mensualidad («$1,450 al mes × 12
 *    meses»).
 *  - Escuela SEMANAL: sin «al mes» (esa escuela no cobra por mes): «Colegiatura
 *    del plan de 12 meses».
 *  - La titulación va en su propio renglón y NO dice cuándo se paga: eso lo
 *    decide cada escuela.
 *  - Inscripción y titulación en 0 no se pintan (no se cobran).
 */
export function renglonesCostoPrograma(p: CostoPrograma, semanal: boolean): Array<[string, string]> {
  const filas: Array<[string, string]> = []
  if (p.inscripcion > 0) filas.push(['Inscripción', formatoMXN(p.inscripcion)])
  filas.push(semanal
    ? [`Colegiatura del plan de ${meses(p.meses)}`, formatoMXN(p.colegiatura)]
    : [`Colegiatura: ${formatoMXN(p.mensualidad)} al mes × ${meses(p.meses)}`, formatoMXN(p.colegiatura)])
  if (p.titulacion > 0) filas.push(['Titulación (título y cédula profesional)', formatoMXN(p.titulacion)])
  return filas
}

/** «Tu programa»: lo que cuesta el programa de licenciatura del alumno, con lo publicado. */
export function CostoProgramaCard({ programa, semanal }: { programa: CostoPrograma; semanal: boolean }) {
  return (
    <section
      aria-labelledby="tu-programa"
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-superficie, #FFFFFF)', border: '1px solid var(--color-borde, #E5E7EB)' }}
    >
      <h2 id="tu-programa" className="font-bold text-base" style={{ color: 'var(--color-primario)' }}>Tu programa</h2>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario, #6B7280)' }}>
        Plan {programa.plan}
      </p>
      <dl className="mt-3 text-sm">
        {renglonesCostoPrograma(programa, semanal).map(([concepto, monto]) => (
          <div key={concepto} className="flex items-baseline justify-between gap-3 py-1.5"
            style={{ borderBottom: '1px solid var(--color-borde, #E5E7EB)' }}>
            <dt style={{ color: 'var(--color-texto, #111827)' }}>{concepto}</dt>
            <dd className="font-semibold whitespace-nowrap" style={{ color: 'var(--color-texto, #111827)' }}>{monto}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 pt-2">
          <dt className="font-bold" style={{ color: 'var(--color-texto, #111827)' }}>Total del programa</dt>
          <dd className="font-bold whitespace-nowrap" style={{ color: 'var(--color-primario)' }}>{formatoMXN(programa.total)}</dd>
        </div>
      </dl>
    </section>
  )
}
