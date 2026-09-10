'use client'

/**
 * Los dos trozos de interfaz que aparecen cuando la escuela NO cobra en pesos:
 * la equivalencia aproximada bajo cada precio y el aviso legal de la sección.
 *
 * ⚠️ LOS DOS DEVUELVEN `null` EN UNA ESCUELA EN PESOS. Ese es el punto: se
 * pueden dejar puestos en la landing, el registro y el estado de cuenta de la
 * plantilla sin cambiar ni un píxel para los ~144 clientes que cobran en MXN.
 * Nadie tiene que acordarse de añadirlos cuando llegue el siguiente cliente en
 * otra moneda; ya están.
 *
 * 🛑 EL PRECIO REAL VA PRIMERO Y MÁS GRANDE. La equivalencia es de referencia y
 * se pinta debajo, más chica y en el color de texto suave. Al revés —el peso
 * grande y el dólar de nota al pie— es exactamente la lectura que hace que un
 * alumno crea que va a pagar 950 pesos cuando va a pagar 950 dólares.
 */

import { useSiteConfig } from '@/components/site-config-provider'
import { avisoMoneda, equivalenteMXN } from '@/lib/moneda'

/**
 * '≈ $5,070 MXN' bajo un precio, o nada.
 *
 * `tipoCambio` acepta el histórico de un pago (`tipo_cambio_aplicado`) para que
 * un recibo de hace tres meses siga enseñando la equivalencia de aquel día.
 * Sin él usa el vigente, que es lo correcto para un precio de catálogo.
 */
export function Equivalencia({
  monto,
  tipoCambio,
  className,
  style,
}: {
  monto: number
  tipoCambio?: number | null
  className?: string
  style?: React.CSSProperties
}) {
  const cfg = useSiteConfig()
  const texto = equivalenteMXN(monto, cfg, tipoCambio)
  if (!texto) return null
  return (
    <span
      className={className ?? 'block text-xs font-medium tabular-nums'}
      style={{ color: 'var(--color-texto-secundario)', ...style }}
    >
      {texto}
    </span>
  )
}

/**
 * 'Equivalencia aproximada. El cargo se realiza en dólares (USD).'
 *
 * Obligatorio junto a los precios de la landing, en el registro y en el estado
 * de cuenta: sin él, un alumno puede sostener que se le cotizó en pesos.
 */
export function AvisoMoneda({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const cfg = useSiteConfig()
  const texto = avisoMoneda(cfg)
  if (!texto) return null
  return (
    <p
      className={className ?? 'text-xs leading-snug'}
      style={{ color: 'var(--color-texto-secundario)', ...style }}
    >
      {texto}
    </p>
  )
}
