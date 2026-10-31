/**
 * Datos de pago por transferencia o depósito (pedido de un cliente, #295) — la parte PURA:
 * tipos, validación y formato. La usan el bloque del alumno, el editor del admin
 * y las dos APIs. Aquí NO hay datos de ninguna escuela: los valores viven solo en
 * la tabla `datos_pago` (ver la migración 20261030120000) y se leen con sesión.
 *
 * 🛑 Nunca en config.ts ni en site_config: los dos son públicos.
 */

export type DatosPago = {
  activo: boolean
  banco: string
  titular: string
  /** 18 dígitos, sin espacios. */
  clabe: string
  /** 16 dígitos, sin espacios (depósito en ventanilla u OXXO). */
  tarjeta: string
  /** Número de cuenta. Vacío = no se pinta. */
  cuenta: string
  nota: string
}

export const DATOS_PAGO_VACIOS: DatosPago = {
  activo: false, banco: '', titular: '', clabe: '', tarjeta: '', cuenta: '', nota: '',
}

/** Solo los dígitos: el admin pega «002 078 …» y se guarda «002078…». */
export const soloDigitos = (v: string) => v.replace(/\D/g, '')

/**
 * Dígito verificador de la CLABE (Banxico): pesos 3, 7, 1 sobre los 17 primeros
 * dígitos, cada producto módulo 10; el dígito 18 es (10 − suma mod 10) mod 10.
 */
export function clabeValida(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false
  const pesos = [3, 7, 1]
  let suma = 0
  for (let i = 0; i < 17; i++) suma += (Number(clabe[i]) * pesos[i % 3]) % 10
  return (10 - (suma % 10)) % 10 === Number(clabe[17])
}

/** Algoritmo de Luhn para la tarjeta de 16 dígitos. */
export function tarjetaValida(tarjeta: string): boolean {
  if (!/^\d{16}$/.test(tarjeta)) return false
  let suma = 0
  for (let i = 0; i < 16; i++) {
    let d = Number(tarjeta[15 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    suma += d
  }
  return suma % 10 === 0
}

/** CLABE agrupada como la imprime el banco: banco (3) · plaza (3) · cuenta (11) · verificador (1). */
export const formatoClabe = (c: string) =>
  c.length === 18 ? `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 17)} ${c.slice(17)}` : c

/** Tarjeta de 4 en 4. */
export const formatoTarjeta = (t: string) => t.replace(/(\d{4})(?=\d)/g, '$1 ')

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * Valida el cuerpo que manda el editor. Devuelve los datos normalizados o la
 * lista de errores (en español, para el admin). Campo vacío = no se pinta.
 */
export function validarDatosPago(cuerpo: unknown): { ok: true; datos: DatosPago } | { ok: false; errores: string[] } {
  const c = (typeof cuerpo === 'object' && cuerpo !== null ? cuerpo : {}) as Record<string, unknown>
  const datos: DatosPago = {
    activo: c.activo === true,
    banco: texto(c.banco, 80),
    titular: texto(c.titular, 120),
    clabe: soloDigitos(texto(c.clabe, 40)),
    tarjeta: soloDigitos(texto(c.tarjeta, 40)),
    cuenta: soloDigitos(texto(c.cuenta, 40)),
    nota: texto(c.nota, 300),
  }
  const errores: string[] = []
  if (datos.clabe && !clabeValida(datos.clabe)) errores.push('La CLABE debe tener 18 dígitos y su dígito verificador correcto.')
  if (datos.tarjeta && !tarjetaValida(datos.tarjeta)) errores.push('La tarjeta debe tener 16 dígitos válidos.')
  if (datos.cuenta && !/^\d{8,20}$/.test(datos.cuenta)) errores.push('La cuenta debe tener entre 8 y 20 dígitos.')
  if (datos.activo && !datos.clabe && !datos.tarjeta && !datos.cuenta) errores.push('Para mostrar el bloque, captura al menos la CLABE, la tarjeta o la cuenta.')
  if (datos.activo && !datos.banco) errores.push('Captura el nombre del banco.')
  return errores.length ? { ok: false, errores } : { ok: true, datos }
}
