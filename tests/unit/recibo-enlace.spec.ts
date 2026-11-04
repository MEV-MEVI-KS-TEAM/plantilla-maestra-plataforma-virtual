import { test, expect } from '@playwright/test'
import { firmarEnlaceRecibo, enlaceReciboValido, RECIBO_ENLACE_TTL_SEG } from '@/lib/pagos/recibo-enlace'
import { rebotaConSesion } from '@/lib/supabase/middleware'

/**
 * TICKET-2026-11-04-03 — el WhatsApp del recibo lleva el dominio de la escuela
 * (`/recibo/<pago>?e=&t=`) en vez de la URL firmada de Supabase Storage.
 */

const SECRETO = 'service-role-de-prueba'
const PAGO = '7732ecfa-e994-4a8a-acd2-bfb2df9fbb11'
const AHORA = 1_800_000_000

function partes(url: string) {
  const u = new URL(url)
  return { u, id: u.pathname.split('/').pop()!, e: u.searchParams.get('e'), t: u.searchParams.get('t') }
}

test('el enlace sale del dominio de la escuela y no lleva la ref de Supabase', () => {
  const url = firmarEnlaceRecibo('https://topang.online/', PAGO, SECRETO, AHORA)
  const { u } = partes(url)
  expect(u.origin).toBe('https://topang.online')
  expect(u.pathname).toBe(`/recibo/${PAGO}`)
  expect(url).not.toContain('supabase')
  expect(url.length).toBeLessThan(120)
})

test('la firma valida su propio enlace y caduca', () => {
  const { id, e, t } = partes(firmarEnlaceRecibo('https://x.online', PAGO, SECRETO, AHORA))
  expect(enlaceReciboValido(id, e, t, SECRETO, AHORA)).toBe(true)
  expect(enlaceReciboValido(id, e, t, SECRETO, AHORA + RECIBO_ENLACE_TTL_SEG)).toBe(true)
  expect(enlaceReciboValido(id, e, t, SECRETO, AHORA + RECIBO_ENLACE_TTL_SEG + 1)).toBe(false)
})

test('no sirve con otro pago, otra expiración, otro secreto o datos rotos', () => {
  const { id, e, t } = partes(firmarEnlaceRecibo('https://x.online', PAGO, SECRETO, AHORA))
  expect(enlaceReciboValido('11111111-2222-4333-8444-555555555555', e, t, SECRETO, AHORA)).toBe(false)
  expect(enlaceReciboValido(id, String(Number(e) + 999_999), t, SECRETO, AHORA)).toBe(false)
  expect(enlaceReciboValido(id, e, t, 'otro-secreto', AHORA)).toBe(false)
  expect(enlaceReciboValido(id, e, t, '', AHORA)).toBe(false)
  expect(enlaceReciboValido(id, null, t, SECRETO, AHORA)).toBe(false)
  expect(enlaceReciboValido(id, e, null, SECRETO, AHORA)).toBe(false)
  expect(enlaceReciboValido(id, e, t!.slice(0, -1), SECRETO, AHORA)).toBe(false)
  expect(enlaceReciboValido('no-es-uuid', e, t, SECRETO, AHORA)).toBe(false)
  expect(enlaceReciboValido(id, 'abc', t, SECRETO, AHORA)).toBe(false)
})

test('con sesión abierta /recibo/<pago> no rebota al panel; /reciboX sí', () => {
  expect(rebotaConSesion(`/recibo/${PAGO}`)).toBe(false)
  expect(rebotaConSesion('/reciboX')).toBe(true)
  expect(rebotaConSesion('/recibos')).toBe(true)
})
