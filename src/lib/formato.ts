import { CONFIG } from '@/lib/config'
import { formatearMoneda } from '@/lib/moneda'

/**
 * Formato de dinero para las pantallas.
 *
 * ⚠️ DOS funciones, no una, y la distinción NO es cosmética: aplicar la regla
 * de "Gratis" a un MONTO produce frases falsas.
 *
 *   formatoPrecio() → PRECIOS de catálogo. 0 significa "no se cobra" → "Gratis".
 *   formatoMonto()  → MONTOS reales (pagado, saldo, vencido). 0 es una cifra
 *                     legítima y se escribe como cifra.
 *
 * En RHEMA (#193) un helper único imprimió «Pagado: Incluido de $6,500» en la
 * pantalla de un alumno que no había pagado nada: el 0 de "monto pagado" pasó
 * por la regla de los precios. En EDUHCO (#197) volvió a aparecer al revés.
 * Por eso están separadas y por eso `formatoMonto` acepta el texto que se dice
 * cuando el monto es cero, en lugar de inventarlo.
 *
 * Las dos respetan la moneda de la escuela (`CONFIG.moneda`), así que en una
 * escuela en pesos producen exactamente la cadena de siempre.
 */

/** MONTOS reales. 0 → "$0" (una cifra, no una promesa comercial). */
export function formatoMXN(monto: number): string {
  return formatearMoneda(monto, { moneda: CONFIG.moneda, tipoCambioMXN: 0 })
}

/** PRECIOS de catálogo. 0 → "Gratis": la escuela lo vende como argumento. */
export function formatoPrecio(precio: number): string {
  if (!precio) return 'Gratis'
  return formatoMXN(precio)
}

/**
 * Un MONTO acumulado, con el texto que corresponde cuando todavía es cero.
 *
 * 🛑 `siCero` lo decide quien llama porque solo él sabe qué significa el cero en
 * su pantalla: «Aún sin pagos» en un historial, «Al corriente» en un saldo
 * vencido. Un texto genérico aquí sería tan falso como el «$0» que evita.
 */
export function formatoMonto(monto: number, siCero?: string): string {
  if (!monto && siCero) return siCero
  return formatoMXN(monto)
}
