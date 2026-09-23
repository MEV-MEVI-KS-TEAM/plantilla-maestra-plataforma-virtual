import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { normalizarWhatsApp, normalizarWhatsAppUrl, waNumero, waUrl } from '@/lib/whatsapp'
import { mergeSiteConfig } from '@/lib/site-config-core'
import { validarOverrides } from '@/lib/site-config-validacion'
import { whatsappEscuelaDisponible, urlWhatsAppEscuela } from '@/lib/contacto-ui'

/**
 * WhatsApp capturado SIN lada de país (CONECTM EDU, 22-sep-2026).
 *
 * "Personalizar mi página" aceptaba 10 dígitos (`5580803210`) y los guardaba
 * así: el enlace derivado salía `https://wa.me/5580803210` —WhatsApp lo toma
 * con otra lada y no llega a nadie— y el botón de la escuela, que exige 11–13
 * dígitos, desaparecía. Se normaliza al guardar y al leer: 10 dígitos → 52.
 */

test('normalizarWhatsApp: 10 dígitos → se antepone 52', () => {
  expect(normalizarWhatsApp('5580803210')).toBe('525580803210')
  expect(normalizarWhatsApp('55 8080 3210')).toBe('525580803210')
  expect(normalizarWhatsApp('(55) 8080-3210')).toBe('525580803210')
})

test('normalizarWhatsApp: con lada de país o cualquier otra longitud, no se toca (solo dígitos)', () => {
  expect(normalizarWhatsApp('525580803210')).toBe('525580803210')
  expect(normalizarWhatsApp('5215580803210')).toBe('5215580803210')
  expect(normalizarWhatsApp('+52 1 55 8080 3210')).toBe('5215580803210')
  expect(normalizarWhatsApp('12345')).toBe('12345')
})

test('normalizarWhatsApp: vacío / nulo → cadena vacía', () => {
  expect(normalizarWhatsApp('')).toBe('')
  expect(normalizarWhatsApp('   ')).toBe('')
  expect(normalizarWhatsApp(null)).toBe('')
  expect(normalizarWhatsApp(undefined)).toBe('')
})

test('normalizarWhatsApp es idempotente', () => {
  for (const x of ['5580803210', '525580803210', '5215580803210', '', '12345']) {
    expect(normalizarWhatsApp(normalizarWhatsApp(x))).toBe(normalizarWhatsApp(x))
  }
})

test('waNumero / waUrl usan la misma normalización', () => {
  expect(waNumero('5580803210')).toBe('525580803210')
  expect(waNumero('')).toBeNull()
  expect(waUrl('5580803210')).toBe('https://wa.me/525580803210')
  expect(waUrl('5580803210', 'Hola')).toBe('https://wa.me/525580803210?text=Hola')
  expect(waUrl(null)).toBeNull()
})

test('normalizarWhatsAppUrl: arregla un wa.me de 10 dígitos y conserva el ?text', () => {
  expect(normalizarWhatsAppUrl('https://wa.me/5580803210')).toBe('https://wa.me/525580803210')
  expect(normalizarWhatsAppUrl('https://wa.me/5580803210?text=Hola')).toBe('https://wa.me/525580803210?text=Hola')
  expect(normalizarWhatsAppUrl('https://wa.me/5215580803210')).toBe('https://wa.me/5215580803210')
  // Lo que no es un wa.me/<dígitos> se deja tal cual.
  expect(normalizarWhatsAppUrl('https://api.whatsapp.com/send?phone=5580803210'))
    .toBe('https://api.whatsapp.com/send?phone=5580803210')
})

test('al GUARDAR: validarOverrides guarda 10 dígitos con 52 y deriva el enlace con 52', () => {
  const r = validarOverrides({ whatsapp: '5580803210', contactoTelefono: '5580803210' }, mergeSiteConfig(CONFIG, {}))
  expect(r.ok).toBe(true)
  if (!r.ok) return
  expect(r.overrides.whatsapp).toBe('525580803210')
  expect(r.overrides.contactoTelefono).toBe('525580803210')
  expect(r.overrides.whatsappUrl).toBe('https://wa.me/525580803210')
})

test('al LEER: una fila vieja con 10 dígitos sale con 52 y el botón de la escuela se muestra', () => {
  const cfg = mergeSiteConfig(CONFIG, {
    whatsapp: '5580803210',
    contactoTelefono: '5580803210',
    whatsappUrl: 'https://wa.me/5580803210',
  })
  expect(cfg.whatsapp).toBe('525580803210')
  expect(cfg.contactoTelefono).toBe('525580803210')
  expect(cfg.whatsappUrl).toBe('https://wa.me/525580803210')
  expect(whatsappEscuelaDisponible(cfg.whatsapp)).toBe(true)
  expect(urlWhatsAppEscuela(cfg.whatsapp)).toBe('https://wa.me/525580803210')
})

test('al LEER: un número completo o vacío no se toca', () => {
  const cfg = mergeSiteConfig(CONFIG, {
    whatsapp: '5215580803210',
    whatsappUrl: 'https://wa.me/5215580803210',
  })
  expect(cfg.whatsapp).toBe('5215580803210')
  expect(cfg.whatsappUrl).toBe('https://wa.me/5215580803210')
  // Sin overrides, el contacto de la base de la plantilla sale intacto.
  const base = mergeSiteConfig(CONFIG, {})
  expect(base.whatsapp).toBe(CONFIG.whatsapp)
  expect(base.whatsappUrl).toBe(CONFIG.whatsappUrl)
  expect(base.contactoTelefono).toBe(CONFIG.contactoTelefono)
})
