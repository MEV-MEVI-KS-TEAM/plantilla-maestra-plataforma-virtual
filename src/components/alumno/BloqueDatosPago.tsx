'use client'

/**
 * «Transferencia o depósito» en /alumno/pagar (pedido de un cliente, #295).
 *
 * Los datos llegan de /api/alumno/datos-pago (sesión obligatoria): nunca del
 * config ni del site_config, que son públicos. Colores del PANEL: la marca y el
 * blanco (`--color-*`); ningún color de la portada. Los dígitos en cifras
 * tabulares y con botón Copiar, que copia SIN espacios.
 */
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { formatoClabe, formatoTarjeta, type DatosPago } from '@/lib/datos-pago-core'

function Fila({ etiqueta, valor, copiar }: { etiqueta: string; valor: string; copiar?: string }) {
  const [copiado, setCopiado] = useState(false)
  async function alCopiar() {
    if (!copiar) return
    try {
      await navigator.clipboard.writeText(copiar)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sin permiso de portapapeles: el número sigue a la vista */ }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3" style={{ borderTop: '1px solid var(--color-borde)' }}>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-texto-secundario)' }}>{etiqueta}</p>
        <p className="mt-0.5 text-base font-bold" style={{ color: 'var(--color-texto)', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{valor}</p>
      </div>
      {copiar && (
        <button type="button" onClick={alCopiar}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'transparent', color: 'var(--color-acento)', border: '1.5px solid var(--color-acento)' }}
          aria-label={`Copiar ${etiqueta}`}>
          {copiado ? <><Check size={16} aria-hidden /> Copiado</> : <><Copy size={16} aria-hidden /> Copiar</>}
        </button>
      )}
    </div>
  )
}

export function BloqueDatosPago({ datos, comprobanteHref }: { datos: DatosPago; comprobanteHref: string | null }) {
  return (
    <section aria-labelledby="titulo-transferencia" className="rounded-xl p-5"
      style={{ background: 'var(--color-superficie, #fff)', border: '1px solid var(--color-borde)' }}>
      <h2 id="titulo-transferencia" className="text-base font-bold" style={{ color: 'var(--color-texto)' }}>
        Transferencia o depósito
      </h2>
      <div className="mt-3">
        {datos.banco && <Fila etiqueta="Banco" valor={datos.banco} />}
        {datos.titular && <Fila etiqueta="Titular" valor={datos.titular} />}
        {datos.clabe && <Fila etiqueta="CLABE interbancaria" valor={formatoClabe(datos.clabe)} copiar={datos.clabe} />}
        {datos.tarjeta && <Fila etiqueta="Tarjeta para depósito en ventanilla u OXXO" valor={formatoTarjeta(datos.tarjeta)} copiar={datos.tarjeta} />}
        {datos.cuenta && <Fila etiqueta="Cuenta" valor={datos.cuenta} copiar={datos.cuenta} />}
      </div>
      {datos.nota && (
        <p className="mt-3 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>{datos.nota}</p>
      )}
      {comprobanteHref && (
        <a href={comprobanteHref} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-block px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento, #fff)' }}>
          Enviar mi comprobante
        </a>
      )}
    </section>
  )
}
