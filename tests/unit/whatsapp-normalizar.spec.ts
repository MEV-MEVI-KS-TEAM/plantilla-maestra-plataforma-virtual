import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  mensajeWhatsAppInvalido,
  normalizarUrlWhatsApp,
  normalizarWhatsApp,
  urlWhatsAppEscuela,
  whatsappEscuelaDisponible,
} from '@/lib/contacto-ui'
import { mergeSiteConfig, type BaseSiteConfig } from '@/lib/site-config-core'
import { validarOverrides } from '@/lib/site-config-validacion'

/**
 * A2 · «Validar WhatsApp». UNA regla para el número de la escuela, al guardar
 * desde el panel y al leer lo ya publicado:
 *
 *   · se quitan espacios, guiones, paréntesis y «+»;
 *   · 10 dígitos → celular mexicano sin lada: se le antepone 52;
 *   · 12 dígitos con 52 y 13 con 521 → tal cual;
 *   · otro número internacional de 8 a 15 dígitos → tal cual;
 *   · vacío → '' (la escuela no usa WhatsApp);
 *   · lo demás → no es un número.
 *
 * El caso que la motiva: el panel aceptaba 10 dígitos y publicaba
 * `https://wa.me/3312345678`, un enlace que WhatsApp lee como de otro país.
 */

const BASE = () => mergeSiteConfig(CONFIG, {})

test.describe('normalizarWhatsApp: la regla', () => {
  test('10 dígitos → se antepone 52, con o sin separadores', () => {
    expect(normalizarWhatsApp('3312345678')).toBe('523312345678')
    expect(normalizarWhatsApp('33 1234 5678')).toBe('523312345678')
    expect(normalizarWhatsApp('(33) 1234-5678')).toBe('523312345678')
    expect(normalizarWhatsApp(' 33-1234-5678 ')).toBe('523312345678')
  })

  test('12 dígitos con 52 y 13 con 521 → tal cual (sin separadores)', () => {
    expect(normalizarWhatsApp('523312345678')).toBe('523312345678')
    expect(normalizarWhatsApp('+52 33 1234 5678')).toBe('523312345678')
    expect(normalizarWhatsApp('5213312345678')).toBe('5213312345678')
    expect(normalizarWhatsApp('+52 1 (33) 1234-5678')).toBe('5213312345678')
  })

  test('otros internacionales de 8 a 15 dígitos → tal cual', () => {
    expect(normalizarWhatsApp('+1 (415) 555-2671')).toBe('14155552671') // EE. UU.
    expect(normalizarWhatsApp('502 1234 5678')).toBe('50212345678') // Guatemala
    expect(normalizarWhatsApp('12345678')).toBe('12345678') // 8
    expect(normalizarWhatsApp('123456789012345')).toBe('123456789012345') // 15
  })

  test('vacío → cadena vacía: la escuela no usa WhatsApp', () => {
    expect(normalizarWhatsApp('')).toBe('')
    expect(normalizarWhatsApp('   ')).toBe('')
    expect(normalizarWhatsApp(' - ')).toBe('')
    expect(normalizarWhatsApp(null)).toBe('')
    expect(normalizarWhatsApp(undefined)).toBe('')
  })

  test('lo que no es un número → null', () => {
    expect(normalizarWhatsApp('1234567')).toBeNull() // 7 dígitos
    expect(normalizarWhatsApp('1234567890123456')).toBeNull() // 16
    expect(normalizarWhatsApp('33.1234.5678')).toBeNull() // puntos
    expect(normalizarWhatsApp('WhatsApp')).toBeNull()
    expect(normalizarWhatsApp('0445512345678')).toBeNull() // 044 + celular
    expect(normalizarWhatsApp('52 33 1234 567a')).toBeNull()
  })

  test('es idempotente', () => {
    for (const x of ['3312345678', '523312345678', '5213312345678', '14155552671', '', '33 1234 5678']) {
      const una = normalizarWhatsApp(x) as string
      expect(normalizarWhatsApp(una), x).toBe(una)
    }
  })

  test('normalizarUrlWhatsApp arregla un wa.me de 10 dígitos y conserva el ?text', () => {
    expect(normalizarUrlWhatsApp('https://wa.me/3312345678')).toBe('https://wa.me/523312345678')
    expect(normalizarUrlWhatsApp('https://wa.me/3312345678?text=Hola')).toBe('https://wa.me/523312345678?text=Hola')
    expect(normalizarUrlWhatsApp('https://wa.me/5213312345678')).toBe('https://wa.me/5213312345678')
    // Lo que no es un wa.me/<dígitos> se deja como está.
    expect(normalizarUrlWhatsApp('https://wa.me/')).toBe('https://wa.me/')
    expect(normalizarUrlWhatsApp('https://api.whatsapp.com/send?phone=3312345678'))
      .toBe('https://api.whatsapp.com/send?phone=3312345678')
  })
})

test.describe('al GUARDAR (validarOverrides)', () => {
  test('10 dígitos se guardan con 52 en los dos campos y el enlace sale con 52', () => {
    const r = validarOverrides({ whatsapp: '33 1234 5678', contactoTelefono: '3312345678' }, BASE())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.overrides.whatsapp).toBe('523312345678')
    expect(r.overrides.contactoTelefono).toBe('523312345678')
    expect(r.overrides.whatsappUrl).toBe('https://wa.me/523312345678')
  })

  test('vacío se guarda: sin WhatsApp y sin enlace', () => {
    const r = validarOverrides({ whatsapp: '', contactoTelefono: '' }, BASE())
    expect(r.ok, JSON.stringify(r)).toBe(true)
    if (!r.ok) return
    expect(r.overrides.whatsapp).toBe('')
    expect(r.overrides.whatsappUrl).toBe('')
  })

  test('un número inválido se rechaza con un mensaje claro, en español', () => {
    const r = validarOverrides({ whatsapp: '33 1234' }, BASE())
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.clave).toBe('whatsapp')
    expect(r.error).toBe(mensajeWhatsAppInvalido('WhatsApp (número)'))
    expect(r.error).toContain('10 dígitos')
    expect(r.error).toContain('Déjalo vacío si la escuela no usa WhatsApp')
  })
})

test.describe('al LEER (mergeSiteConfig): lo ya publicado con 10 dígitos', () => {
  test('una fila guardada con 10 dígitos sale con 52, y su enlace también', () => {
    const m = mergeSiteConfig(CONFIG, {
      whatsapp: '3312345678',
      contactoTelefono: '3312345678',
      whatsappUrl: 'https://wa.me/3312345678',
    })
    expect(m.whatsapp).toBe('523312345678')
    expect(m.contactoTelefono).toBe('523312345678')
    expect(m.whatsappUrl).toBe('https://wa.me/523312345678')
  })

  test('un config.ts con 10 dígitos también', () => {
    const base = {
      ...CONFIG,
      whatsapp: '3312345678',
      contactoTelefono: '3312345678',
      whatsappUrl: 'https://wa.me/3312345678',
    } as unknown as BaseSiteConfig
    const m = mergeSiteConfig(base, {})
    expect(m.whatsapp).toBe('523312345678')
    expect(m.whatsappUrl).toBe('https://wa.me/523312345678')
  })

  test('sin WhatsApp publicado: el enlace queda vacío, no vuelve el de config.ts', () => {
    const m = mergeSiteConfig(CONFIG, { whatsapp: '', contactoTelefono: '', whatsappUrl: '' })
    expect(m.whatsapp).toBe('')
    expect(m.whatsappUrl).toBe('')
  })

  test('un número ya completo no cambia', () => {
    const m = mergeSiteConfig(CONFIG, { whatsapp: '5213312345678', whatsappUrl: 'https://wa.me/5213312345678' })
    expect(m.whatsapp).toBe('5213312345678')
    expect(m.whatsappUrl).toBe('https://wa.me/5213312345678')
    // Y el config.ts de este repo sale como la regla lo deja (en la plantilla, igual).
    expect(BASE().whatsapp).toBe(normalizarWhatsApp(CONFIG.whatsapp) ?? CONFIG.whatsapp)
  })
})

test.describe('los botones de la escuela usan la misma regla', () => {
  test('urlWhatsAppEscuela: 10 dígitos → wa.me con 52; vacío, marcador o inválido → sin botón', () => {
    expect(urlWhatsAppEscuela('3312345678')).toBe('https://wa.me/523312345678')
    expect(urlWhatsAppEscuela('33 1234 5678', 'Hola')).toBe('https://wa.me/523312345678?text=Hola')
    expect(urlWhatsAppEscuela('')).toBeNull()
    expect(urlWhatsAppEscuela('520000000000')).toBeNull()
    expect(urlWhatsAppEscuela('0445512345678')).toBeNull()
    expect(whatsappEscuelaDisponible('14155552671')).toBe(true)
  })

  test('guardián: ni el validador ni el editor tienen su propia regla de dígitos', () => {
    const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')
    const validacion = leer('src/lib/site-config-validacion.ts')
    const identidad = leer('src/components/admin/personalizar/PestanaIdentidad.tsx')
    // La regla vieja (`^\d{10,13}$`) aceptaba 10 dígitos sin lada.
    expect(validacion).not.toMatch(/\\d\{10,13\}/)
    expect(identidad).not.toMatch(/\\d\{10,13\}/)
    expect(validacion).toContain('normalizarWhatsApp(')
    expect(identidad).toContain('normalizarWhatsApp(')
  })
})
