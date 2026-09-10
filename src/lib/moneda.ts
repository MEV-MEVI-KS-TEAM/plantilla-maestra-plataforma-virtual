/**
 * Moneda de cobro de la escuela — ÚNICO lugar donde se formatea dinero.
 *
 * ⚠️ POR QUÉ EXISTE. Hasta GRATIA (#198) la flota entera cobraba en pesos y el
 * formateo estaba escrito a mano en 21 archivos: `Intl.NumberFormat('es-MX',
 * { currency: 'MXN' })` en el recibo, los reportes, la ficha del alumno y el
 * módulo de pagos; `toLocaleString('es-MX', …)` en la landing y en `/pagar`;
 * `precioMXN()` en el catálogo de diplomados; `formatoMXN()` en el editor de
 * personalización. Veintiún sitios que hay que encontrar uno por uno para
 * cambiar de moneda, y basta olvidar uno para que un plan de 300 dólares se
 * anuncie como 300 pesos: **17 veces más barato de lo que el alumno va a
 * pagar**. Ese es el fallo que este módulo hace imposible.
 *
 * ⚠️ ES ADITIVO O NO ES. Son ~144 clientes compartiendo esta plantilla. Con
 * `moneda: 'MXN'` —el default— cada función de aquí devuelve **exactamente**
 * la misma cadena que el `Intl.NumberFormat` que sustituye, y
 * `equivalenteMXN()` y `avisoMoneda()` devuelven `null`, así que no se pinta
 * ni un nodo nuevo. Una prueba unitaria compara las dos salidas carácter a
 * carácter para que siga siendo verdad.
 *
 * Módulo PURO y sin imports: lo comparten Server Components, Client
 * Components, las rutas API, el generador de PDF y las pruebas.
 */

export type Moneda = 'MXN' | 'USD'

/**
 * Lo mínimo que el helper necesita de la config. Se pide así —y no el `CONFIG`
 * entero— para que las pruebas puedan pasar un objeto literal y para que este
 * módulo no importe nada.
 */
export interface ConfigMoneda {
  readonly moneda: Moneda
  /** Pesos por unidad de la moneda de cobro. `0` = no mostrar equivalencia. */
  readonly tipoCambioMXN: number
}

export interface OpcionesMoneda {
  /**
   * `2` para importes contables (recibo, reportes, historial de pagos), `0`
   * para precios de catálogo. Default `0`.
   */
  readonly decimales?: 0 | 2
  /**
   * Añade el código ISO detrás del importe (`'$300 USD'`). Se ignora en MXN:
   * en México nadie escribe "$300 MXN" en una landing, y añadirlo rompería el
   * invariante de los clientes que ya están en producción.
   */
  readonly conCodigo?: boolean
}

/** Aviso legal obligatorio junto a cualquier precio con equivalencia. */
export const AVISO_MONEDA =
  'Equivalencia aproximada. El cargo se realiza en dólares (USD).'

const LOCALE: Record<Moneda, string> = { MXN: 'es-MX', USD: 'en-US' }

function opcionesIntl(moneda: Moneda, decimales: 0 | 2): Intl.NumberFormatOptions {
  return decimales === 2
    ? { style: 'currency', currency: moneda, minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { style: 'currency', currency: moneda, maximumFractionDigits: 0 }
}

/**
 * El importe en la moneda REAL de cobro. Todo monto que llegue a una pantalla
 * pasa por aquí.
 *
 * En USD se formatea con locale `en-US` a propósito: `Intl` con `es-MX` y
 * `currency: 'USD'` produce `"USD 1,500.00"` —el código delante y sin símbolo—,
 * que no es como se lee un precio en dólares en ningún lado.
 */
export function formatearMoneda(
  monto: number,
  cfg: ConfigMoneda,
  opciones: OpcionesMoneda = {},
): string {
  const n = Number.isFinite(monto) ? monto : 0
  const decimales = opciones.decimales ?? 0
  const moneda = cfg.moneda
  const texto = new Intl.NumberFormat(LOCALE[moneda], opcionesIntl(moneda, decimales)).format(n)
  // El código ISO solo se añade cuando la moneda NO es la del país: en MXN
  // sobra, y ponerlo cambiaría la cadena de 144 clientes en producción.
  return opciones.conCodigo && moneda !== 'MXN' ? `${texto} ${moneda}` : texto
}

/**
 * La equivalencia REFERENCIAL en pesos, o `null` si no aplica.
 *
 * Devuelve `null` —y quien llama no pinta nada— cuando la escuela ya cobra en
 * pesos o cuando no hay un tipo de cambio válido. Nunca es el cargo real: por
 * eso lleva `≈` y por eso el aviso de `avisoMoneda()` es obligatorio al lado.
 *
 * `tipoCambio` permite pasar el **histórico** del pago (`tipo_cambio_aplicado`)
 * en vez del vigente: un recibo emitido hace tres meses debe seguir mostrando
 * la equivalencia que tenía ese día, no reescribirse sola cada vez que el
 * admin actualiza el tipo de cambio.
 */
export function equivalenteMXN(
  monto: number,
  cfg: ConfigMoneda,
  tipoCambio?: number | null,
): string | null {
  if (cfg.moneda === 'MXN') return null
  const tc = tipoCambio ?? cfg.tipoCambioMXN
  if (!Number.isFinite(tc) || (tc as number) <= 0) return null
  if (!Number.isFinite(monto)) return null
  const pesos = Math.round(monto * (tc as number))
  const texto = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(pesos)
  return `≈ ${texto} MXN`
}

/**
 * El aviso que acompaña a los precios, o `null` si la escuela cobra en pesos y
 * no hay nada que aclarar.
 */
export function avisoMoneda(cfg: ConfigMoneda): string | null {
  return cfg.moneda === 'MXN' ? null : AVISO_MONEDA
}

/**
 * `true` si esta escuela cobra en una moneda distinta del peso, es decir, si
 * las pantallas tienen que hacerle sitio a la equivalencia y al aviso.
 */
export function tieneEquivalencia(cfg: ConfigMoneda): boolean {
  return cfg.moneda !== 'MXN' && Number.isFinite(cfg.tipoCambioMXN) && cfg.tipoCambioMXN > 0
}

/**
 * Tipo de cambio válido o `null`. Lo usan la API del editor y el registro de
 * pagos antes de guardar `tipo_cambio_aplicado`.
 *
 * ⚠️ LA COMA ES DECIMAL, NO SEPARADOR DE MILES: '16,90' es 16.90. Es la misma
 * lectura que hace `validarDecimal` en la validación del editor, y las dos
 * tienen que coincidir o el admin vería un valor guardado distinto del que
 * tecleó. Un tipo de cambio de cuatro cifras no existe en el rango que esto
 * admite (0–1000), así que interpretar '1,690' como mil seiscientos noventa
 * solo serviría para colar un dedazo: se rechaza.
 *
 * El 0 devuelve `null` a propósito: "sin equivalencia" no es un tipo de cambio,
 * y quien lo quiera lo guarda como 0 en la config, no aquí.
 */
export function tipoCambioValido(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 1000) return null
  return Math.round(n * 10000) / 10000
}
