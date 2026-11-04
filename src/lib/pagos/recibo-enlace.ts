import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Enlace del recibo de pago con el dominio de la escuela.
 *
 * El WhatsApp del recibo llevaba la URL firmada de Supabase Storage
 * (`<ref>.supabase.co/storage/v1/object/sign/recibos/…?token=…`): un renglón y
 * medio de texto con la ref del proyecto, que la escuela no reconoce como suya
 * (Topang, TICKET-2026-11-04-03). Ahora el mensaje lleva
 * `<origen>/recibo/<pago_id>?e=<expira>&t=<firma>` y la ruta pública
 * `/recibo/[id]` entrega el PDF desde el dominio de la escuela.
 *
 * La firma es un HMAC-SHA256 de `recibo:<pago_id>:<expira>` con la service
 * role del proyecto: sólo el servidor puede emitirla, no se guarda en la base
 * y caduca sola. Sin firma válida la ruta responde 404, igual que un pago que
 * no existe, para no confirmar ids.
 */

/** Vigencia del enlace: el alumno lo abre desde WhatsApp días después. */
export const RECIBO_ENLACE_TTL_SEG = 30 * 24 * 60 * 60

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function firma(secreto: string, pagoId: string, expira: number): string {
  return createHmac('sha256', secreto)
    .update(`recibo:${pagoId.toLowerCase()}:${expira}`)
    .digest('base64url')
    .slice(0, 32)
}

export function firmarEnlaceRecibo(
  origen: string,
  pagoId: string,
  secreto: string,
  ahoraSeg: number = Math.floor(Date.now() / 1000),
): string {
  const expira = ahoraSeg + RECIBO_ENLACE_TTL_SEG
  const base = origen.replace(/\/+$/, '')
  return `${base}/recibo/${pagoId}?e=${expira}&t=${firma(secreto, pagoId, expira)}`
}

export function enlaceReciboValido(
  pagoId: string,
  expira: string | null,
  token: string | null,
  secreto: string,
  ahoraSeg: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!secreto || !UUID.test(pagoId) || !expira || !token) return false
  if (!/^\d{1,12}$/.test(expira)) return false
  const exp = Number(expira)
  if (exp < ahoraSeg) return false
  const esperado = Buffer.from(firma(secreto, pagoId, exp))
  const dado = Buffer.from(token)
  return dado.length === esperado.length && timingSafeEqual(dado, esperado)
}
