import { test, expect } from '@playwright/test'
import {
  AVISO_MONEDA,
  avisoMoneda,
  equivalenteMXN,
  formatearMoneda,
  tieneEquivalencia,
  tipoCambioValido,
  type ConfigMoneda,
} from '@/lib/moneda'

const PESOS: ConfigMoneda = { moneda: 'MXN', tipoCambioMXN: 0 }
const DOLARES: ConfigMoneda = { moneda: 'USD', tipoCambioMXN: 16.9 }

// ─── El invariante que protege a la flota ────────────────────────────────────

test('1. INVARIANTE: en MXN la salida es idéntica al Intl.NumberFormat que sustituye', () => {
  // Son ~144 clientes en producción. Si esta prueba falla, el PR de la moneda
  // les cambió el formato del dinero a todos sin que nadie lo pidiera.
  const viejoDosDecimales = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n)
  const viejoSinDecimales = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
    }).format(n)

  for (const n of [0, 1, 50, 599, 1000, 2000, 4900, 12345, 50000, 1234567]) {
    expect(formatearMoneda(n, PESOS, { decimales: 2 }), `2 decimales · ${n}`).toBe(viejoDosDecimales(n))
    expect(formatearMoneda(n, PESOS), `sin decimales · ${n}`).toBe(viejoSinDecimales(n))
  }
})

test('2. INVARIANTE: en MXN `conCodigo` no añade nada — nadie escribe "$300 MXN" en una landing', () => {
  expect(formatearMoneda(300, PESOS, { conCodigo: true })).toBe(formatearMoneda(300, PESOS))
})

test('3. INVARIANTE: en MXN no hay equivalencia ni aviso que pintar', () => {
  expect(equivalenteMXN(300, PESOS)).toBeNull()
  expect(avisoMoneda(PESOS)).toBeNull()
  expect(tieneEquivalencia(PESOS)).toBe(false)
  // Ni siquiera con un tipo de cambio cargado: la moneda manda.
  expect(equivalenteMXN(300, { moneda: 'MXN', tipoCambioMXN: 16.9 })).toBeNull()
})

// ─── Dólares ─────────────────────────────────────────────────────────────────

test('4. en USD el importe lleva el código: sin él, $300 se lee como 300 pesos', () => {
  expect(formatearMoneda(300, DOLARES, { conCodigo: true })).toBe('$300 USD')
  expect(formatearMoneda(950, DOLARES, { conCodigo: true })).toBe('$950 USD')
  expect(formatearMoneda(1400, DOLARES, { conCodigo: true })).toBe('$1,400 USD')
  expect(formatearMoneda(1500, DOLARES, { decimales: 2, conCodigo: true })).toBe('$1,500.00 USD')
})

test('5. en USD se formatea con locale en-US, no con es-MX', () => {
  // `Intl` con es-MX y currency USD produce "USD 1,500.00": el código delante y
  // sin símbolo. No es como se lee un precio en dólares en ningún lado.
  expect(formatearMoneda(1500, DOLARES)).toContain('$')
  expect(formatearMoneda(1500, DOLARES).startsWith('USD')).toBe(false)
})

test('6. la equivalencia usa el tipo de cambio vigente y redondea a pesos enteros', () => {
  // Las cifras del brief de GRATIA (#198), a 16.90.
  expect(equivalenteMXN(300, DOLARES)).toBe('≈ $5,070 MXN')
  expect(equivalenteMXN(150, DOLARES)).toBe('≈ $2,535 MXN')
  expect(equivalenteMXN(950, DOLARES)).toBe('≈ $16,055 MXN')
  expect(equivalenteMXN(50, DOLARES)).toBe('≈ $845 MXN')
})

test('7. un tipo de cambio HISTÓRICO gana sobre el vigente: el recibo viejo no se reescribe', () => {
  // El admin actualiza el tipo de cambio a 18.50; un pago de hace tres meses
  // tiene que seguir enseñando la equivalencia que se le mostró al alumno.
  const hoy: ConfigMoneda = { moneda: 'USD', tipoCambioMXN: 18.5 }
  expect(equivalenteMXN(300, hoy)).toBe('≈ $5,550 MXN')
  expect(equivalenteMXN(300, hoy, 16.9)).toBe('≈ $5,070 MXN')
})

test('8. sin tipo de cambio utilizable no se inventa una equivalencia', () => {
  expect(equivalenteMXN(300, { moneda: 'USD', tipoCambioMXN: 0 })).toBeNull()
  expect(equivalenteMXN(300, { moneda: 'USD', tipoCambioMXN: -1 })).toBeNull()
  expect(equivalenteMXN(300, { moneda: 'USD', tipoCambioMXN: Number.NaN })).toBeNull()
  expect(equivalenteMXN(300, DOLARES, 0)).toBeNull()
  expect(equivalenteMXN(Number.NaN, DOLARES)).toBeNull()
})

test('9. el aviso solo aparece donde hace falta, y es el texto exacto', () => {
  expect(avisoMoneda(DOLARES)).toBe(AVISO_MONEDA)
  expect(AVISO_MONEDA).toBe('Equivalencia aproximada. El cargo se realiza en dólares (USD).')
})

// ─── Entrada del admin ───────────────────────────────────────────────────────

test('10. tipoCambioValido acepta lo que el admin teclea y rechaza lo que rompería los precios', () => {
  expect(tipoCambioValido(16.9)).toBe(16.9)
  expect(tipoCambioValido('16.90')).toBe(16.9)
  expect(tipoCambioValido('18,78')).toBe(18.78)   // teclado con coma decimal
  // La coma es SIEMPRE decimal (igual que en validarDecimal): '1,690' es 1.69,
  // no mil seiscientos noventa. Las dos lecturas tienen que coincidir o el
  // admin vería guardado algo distinto de lo que tecleó.
  expect(tipoCambioValido('1,690')).toBe(1.69)
  expect(tipoCambioValido(0)).toBeNull()          // 0 = "sin equivalencia", no un cambio
  expect(tipoCambioValido(-3)).toBeNull()
  expect(tipoCambioValido(5000)).toBeNull()       // dedazo de 16.90 a 1690 o peor
  expect(tipoCambioValido('abc')).toBeNull()
  expect(tipoCambioValido(null)).toBeNull()
  expect(tipoCambioValido(undefined)).toBeNull()
})

test('11. un importe no finito no tumba la pantalla', () => {
  expect(formatearMoneda(Number.NaN, PESOS)).toBe(formatearMoneda(0, PESOS))
  expect(formatearMoneda(Number.POSITIVE_INFINITY, DOLARES, { conCodigo: true })).toBe('$0 USD')
})
