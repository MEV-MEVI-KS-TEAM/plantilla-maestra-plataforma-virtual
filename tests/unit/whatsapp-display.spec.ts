import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { formatearWhatsApp, whatsappDisplayCuadra } from '@/lib/contacto-ui'
import {
  CLAVES_PUBLICAS,
  mergeSiteConfig,
  toLandingConfig,
  toPublicSiteConfig,
  type BaseSiteConfig,
} from '@/lib/site-config-core'
import { CLAVES_NUMERO_WHATSAPP, escribirNumeroWhatsApp } from '@/lib/site-config-editor'
import { validarOverrides } from '@/lib/site-config-validacion'

/**
 * A3 · «El número que se ve sigue al número».
 *
 * El panel tenía dos campos independientes: el número (`whatsapp`) y cómo se
 * muestra (`whatsappDisplay`). La escuela cambiaba su WhatsApp y la portada, el
 * pie de página, las legales y el recibo seguían enseñando el número VIEJO. Ahora:
 *   · capturar el número llena «como se muestra» con el número formateado;
 *   · al leer, si los dígitos del texto no son los del número, se enseña el
 *     número formateado.
 */

const BASE = () => mergeSiteConfig(CONFIG, {})

test.describe('formatearWhatsApp', () => {
  test('México: sin lada de país, LADA de 2 o de 3 dígitos', () => {
    expect(formatearWhatsApp('523312345678')).toBe('33 1234 5678')
    expect(formatearWhatsApp('3312345678')).toBe('33 1234 5678') // 10 dígitos → se normaliza
    expect(formatearWhatsApp('525512345678')).toBe('55 1234 5678')
    expect(formatearWhatsApp('528119092234')).toBe('81 1909 2234')
    expect(formatearWhatsApp('527774416667')).toBe('777 441 6667')
    expect(formatearWhatsApp('5215512345678')).toBe('55 1234 5678') // 521 + celular
  })

  test('otro país: con su «+»', () => {
    expect(formatearWhatsApp('12107923638')).toBe('+1 210 792 3638')
    expect(formatearWhatsApp('50212345678')).toBe('+50212345678')
  })

  test('sin número válido: vacío', () => {
    expect(formatearWhatsApp('')).toBe('')
    expect(formatearWhatsApp(null)).toBe('')
    expect(formatearWhatsApp('33.1234.5678')).toBe('')
  })
})

test.describe('whatsappDisplayCuadra', () => {
  test('cuadra con o sin lada de país, con cualquier separador', () => {
    expect(whatsappDisplayCuadra('33 1234 5678', '523312345678')).toBe(true)
    expect(whatsappDisplayCuadra('+52 33 1234 5678', '523312345678')).toBe(true)
    expect(whatsappDisplayCuadra('(33) 1234-5678', '523312345678')).toBe(true)
    expect(whatsappDisplayCuadra('523312345678', '523312345678')).toBe(true) // dígitos crudos
    expect(whatsappDisplayCuadra('521 234-567-8901', '5212345678901')).toBe(true) // el de fábrica
    expect(whatsappDisplayCuadra('+1 (210) 792-3638', '12107923638')).toBe(true)
  })

  test('no cuadra: otro número, vacío o sin número', () => {
    expect(whatsappDisplayCuadra('55 0000 1111', '523312345678')).toBe(false)
    expect(whatsappDisplayCuadra('', '523312345678')).toBe(false)
    expect(whatsappDisplayCuadra(undefined, '523312345678')).toBe(false)
    expect(whatsappDisplayCuadra('33 1234 5678', '')).toBe(false)
  })
})

test.describe('al LEER: «como se muestra» sigue al número', () => {
  test('la escuela cambió el número y no el texto: se enseña el número nuevo', () => {
    const m = mergeSiteConfig(CONFIG, { whatsapp: '523312345678', contactoTelefono: '523312345678' })
    expect(m.whatsappDisplay).toBe('33 1234 5678')
  })

  test('un texto que SÍ es el número se respeta como lo escribió la escuela', () => {
    const m = mergeSiteConfig(CONFIG, { whatsapp: '523312345678', whatsappDisplay: '(33) 1234-5678' })
    expect(m.whatsappDisplay).toBe('(33) 1234-5678')
  })

  test('un texto con OTRO número se sustituye por el número formateado', () => {
    const m = mergeSiteConfig(CONFIG, { whatsapp: '523312345678', whatsappDisplay: '55 0000 1111' })
    expect(m.whatsappDisplay).toBe('33 1234 5678')
  })

  test('sin WhatsApp, o con el marcador de ceros, no se enseña ningún número', () => {
    expect(mergeSiteConfig(CONFIG, { whatsapp: '', contactoTelefono: '', whatsappUrl: '' }).whatsappDisplay).toBe('')
    expect(mergeSiteConfig(CONFIG, { whatsapp: '520000000000', contactoTelefono: '520000000000' }).whatsappDisplay).toBe('')
  })

  test('un config.ts sin la clave, o con el texto vacío, enseña el número formateado', () => {
    const sinClave = { ...CONFIG, whatsapp: '527774416667', contactoTelefono: '527774416667', whatsappDisplay: undefined }
    expect(mergeSiteConfig(sinClave as unknown as BaseSiteConfig, {}).whatsappDisplay).toBe('777 441 6667')
    const vacio = { ...CONFIG, whatsapp: '527774416667', contactoTelefono: '527774416667', whatsappDisplay: '' }
    expect(mergeSiteConfig(vacio as unknown as BaseSiteConfig, {}).whatsappDisplay).toBe('777 441 6667')
  })

  test('el config.ts de este repo, si su texto ya cuadra, sale igual', () => {
    if (whatsappDisplayCuadra(CONFIG.whatsappDisplay, CONFIG.whatsapp)) {
      expect(BASE().whatsappDisplay).toBe(CONFIG.whatsappDisplay)
    }
  })

  test('llega a los dos recortes: el público (pie, legales) y el de la landing', () => {
    expect(CLAVES_PUBLICAS).toContain('whatsappDisplay')
    const m = mergeSiteConfig(CONFIG, { whatsapp: '523312345678' })
    expect(toPublicSiteConfig(m).whatsappDisplay).toBe('33 1234 5678')
    expect(toLandingConfig(m).whatsappDisplay).toBe('33 1234 5678')
  })
})

test.describe('en el PANEL: capturar el número llena «como se muestra»', () => {
  test('escribe las tres claves, con el texto formateado', () => {
    const ov = escribirNumeroWhatsApp({}, '33 1234 5678')
    expect(ov).toEqual({ whatsapp: '3312345678', contactoTelefono: '3312345678', whatsappDisplay: '33 1234 5678' })
    expect([...CLAVES_NUMERO_WHATSAPP].sort()).toEqual(Object.keys(ov).sort())
  })

  test('el admin puede retocar el texto después; si borra el número, el texto queda vacío', () => {
    const ov = escribirNumeroWhatsApp({ whatsappDisplay: 'viejo' }, '')
    expect(ov.whatsapp).toBe('')
    expect(ov.whatsappDisplay).toBe('')
  })

  test('lo que se publica con ese borrador enseña el número con su formato', () => {
    const r = validarOverrides(escribirNumeroWhatsApp({}, '3312345678'), BASE())
    expect(r.ok, JSON.stringify(r)).toBe(true)
    if (!r.ok) return
    const m = mergeSiteConfig(CONFIG, r.overrides)
    expect(m.whatsapp).toBe('523312345678')
    expect(m.whatsappDisplay).toBe('33 1234 5678')
  })

  test('guardián: el campo del número usa escribirNumeroWhatsApp', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/admin/personalizar/PestanaIdentidad.tsx'), 'utf8')
    expect(src).toContain('escribirNumeroWhatsApp(prev, v)')
  })
})

test('guardián: pie, recibo, legales y portada animada leen el texto PUBLICADO, no el de config.ts', () => {
  const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')
  for (const archivo of [
    'src/components/layout/footer.tsx',
    'src/lib/pdf/recibo-pago.tsx',
    'src/app/(legal)/aviso-de-privacidad/page.tsx',
    'src/app/(legal)/terminos-y-condiciones/page.tsx',
    'src/components/landing/animada/LandingAnimada.tsx',
  ]) {
    const src = leer(archivo)
    expect(src, archivo).toContain('whatsappDisplay')
    expect(src, archivo).not.toContain('CONFIG.whatsappDisplay')
  }
})
