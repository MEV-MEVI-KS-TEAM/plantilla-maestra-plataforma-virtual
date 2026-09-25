import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  canalEscuela,
  faqSegunWhatsApp,
  lineaContactoRecibo,
  urlWhatsAppEscuela,
  whatsappComoSeVera,
  whatsappVisible,
} from '@/lib/contacto-ui'
import { mergeSiteConfig, type BaseSiteConfig, type SiteConfigOverrides } from '@/lib/site-config-core'
import {
  PLACEHOLDER_SIN_WHATSAPP,
  escribirNumeroWhatsApp,
  pasoAlPublicar,
  placeholderWhatsAppDisplay,
  prepararParaPublicar,
} from '@/lib/site-config-editor'
import { validarOverrides } from '@/lib/site-config-validacion'

/**
 * A7 · «Se puede quitar el WhatsApp».
 *
 * La QA del Bloque A (24-sep-2026) encontró que una escuela NO podía quitar su
 * WhatsApp desde el panel: al borrar el número, A3 vacía también «como se
 * muestra», y el validador exigía ese texto porque su default de fábrica
 * («521 234-567-8901») no es vacío. «Publicar cambios» respondía «El campo
 * WhatsApp (como se muestra) no puede quedar vacío» y no mandaba nada.
 *
 * Ninguna prueba lo vio: las de A2 validaban `{ whatsapp: '', contactoTelefono: '' }`
 * SIN el texto, y las de A3 miraban el borrador sin validarlo. Aquí va el ciclo
 * entero, con las mismas funciones que usa el panel: capturar → vaciar →
 * validar y publicar → leer lo publicado → capturar otra vez.
 *
 * La escuela es FIJA (con WhatsApp y con correo) y no el config.ts del repo: en
 * un clon sin número o sin correo de fábrica estas pruebas tienen que decir lo
 * mismo.
 */

const NUMERO_FABRICA = '5212345678901'
const TEXTO_FABRICA = '521 234-567-8901'
const FABRICA = {
  ...CONFIG,
  whatsapp: NUMERO_FABRICA,
  whatsappUrl: `https://wa.me/${NUMERO_FABRICA}`,
  whatsappDisplay: TEXTO_FABRICA,
  contactoTelefono: NUMERO_FABRICA,
  email: 'contacto@escuela.mx',
  contactoEmail: 'contacto@escuela.mx',
} as unknown as BaseSiteConfig
const BASE = () => mergeSiteConfig(FABRICA, {})
const leer = (ov: SiteConfigOverrides) => mergeSiteConfig(FABRICA, ov)
const SITIO = 'https://mev-edu.online'

/** Lo que el PUT guarda: el cuerpo que arma el editor, validado como en el servidor. */
function publicar(borrador: SiteConfigOverrides): SiteConfigOverrides {
  const r = validarOverrides(prepararParaPublicar(borrador), BASE())
  expect(r.ok, JSON.stringify(r)).toBe(true)
  if (!r.ok) throw new Error(r.error)
  return r.overrides
}
const conNumero = () => publicar(escribirNumeroWhatsApp({}, '3312345678'))
const sinNumero = () => publicar(escribirNumeroWhatsApp(conNumero(), ''))

test.describe('el ciclo completo del panel: número → vacío → publicar → número otra vez', () => {
  test('con un número publicado, vaciarlo deja las tres claves en blanco y SE PUEDE publicar', () => {
    const publicado = conNumero()
    const borrador = escribirNumeroWhatsApp(publicado, '')
    expect(borrador).toMatchObject({ whatsapp: '', contactoTelefono: '', whatsappDisplay: '' })

    // «Publicar cambios» valida ANTES de todo con la regla del servidor.
    expect(pasoAlPublicar(publicado, borrador, BASE())).toEqual({ paso: 'publicar' })

    expect(publicar(borrador)).toMatchObject({ whatsapp: '', contactoTelefono: '', whatsappDisplay: '', whatsappUrl: '' })
  })

  test('lo publicado sin número: ningún botón de WhatsApp y el canal pasa al correo', () => {
    const m = leer(sinNumero())
    expect(m.whatsapp).toBe('')
    expect(m.contactoTelefono).toBe('')
    expect(m.whatsappUrl).toBe('')
    expect(m.whatsappDisplay).toBe('')
    expect(urlWhatsAppEscuela(m.whatsapp)).toBeNull()
    expect(urlWhatsAppEscuela(m.contactoTelefono)).toBeNull()
    expect(whatsappVisible(m)).toBe('')
    expect(canalEscuela(m)).toMatchObject({ tipo: 'correo', href: 'mailto:contacto@escuela.mx' })
    // La pregunta que da el número se va, en vez de decir «…al .».
    const FAQ = [
      { q: '¿Qué pasa si tengo dudas?', a: 'Contamos con atención por WhatsApp al {whatsapp}.' },
      { q: '¿Es en línea?', a: 'Sí, 100% en línea.' },
    ]
    expect(faqSegunWhatsApp(FAQ, urlWhatsAppEscuela(m.whatsapp) !== null)).toEqual([FAQ[1]])
  })

  test('y volver a poner el número lo regresa todo, con su 52 y su formato', () => {
    const publicado = sinNumero()
    const borrador = escribirNumeroWhatsApp(publicado, '3312345678')
    expect(pasoAlPublicar(publicado, borrador, BASE())).toEqual({ paso: 'publicar' })
    const m = leer(publicar(borrador))
    expect(m.whatsapp).toBe('523312345678')
    expect(m.whatsappUrl).toBe('https://wa.me/523312345678')
    expect(m.whatsappDisplay).toBe('33 1234 5678')
    expect(canalEscuela(m)).toMatchObject({ tipo: 'whatsapp', href: 'https://wa.me/523312345678', valor: '33 1234 5678' })
  })

  test('con número, «como se muestra» sigue siendo obligatorio (como hoy)', () => {
    const r = validarOverrides({ whatsapp: '3312345678', contactoTelefono: '3312345678', whatsappDisplay: '' }, BASE())
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('El campo WhatsApp (como se muestra) no puede quedar vacío')
    // Tampoco sin mandar el número: el de la base sigue ahí.
    expect(validarOverrides({ whatsappDisplay: '' }, BASE()).ok).toBe(false)
  })

  test('un número inválido no cuenta como «sin WhatsApp»: el texto vacío se rechaza igual', () => {
    // El texto va PRIMERO en el cuerpo: si «inválido» contara como «sin
    // WhatsApp», el texto pasaría y el error sería el del número.
    const r = validarOverrides({ whatsappDisplay: '', whatsapp: 'abc', contactoTelefono: 'abc' }, BASE())
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('El campo WhatsApp (como se muestra) no puede quedar vacío')
  })

  test('control: una escuela sin WhatsApp de fábrica ya podía mandar el texto vacío', () => {
    const sinWa = { ...FABRICA, whatsapp: '', whatsappUrl: '', whatsappDisplay: '', contactoTelefono: '' }
    expect(validarOverrides({ whatsappDisplay: '' }, mergeSiteConfig(sinWa as unknown as BaseSiteConfig, {})).ok).toBe(true)
  })
})

test.describe('vacíos, los campos del WhatsApp no enseñan el número de fábrica', () => {
  test('el marcador es un texto neutro; con número, el número capturado con su formato', () => {
    expect(PLACEHOLDER_SIN_WHATSAPP).toBe('Sin WhatsApp')
    expect(placeholderWhatsAppDisplay('')).toBe('Sin WhatsApp')
    expect(placeholderWhatsAppDisplay('3312345678')).toBe('33 1234 5678')
    expect(placeholderWhatsAppDisplay('523312345678')).toBe('33 1234 5678')
    // El marcador de ceros de algunos config.ts no es un número que enseñar.
    expect(placeholderWhatsAppDisplay('520000000000')).toBe('Sin WhatsApp')
    expect(placeholderWhatsAppDisplay('abc')).toBe('Sin WhatsApp')
    expect(PLACEHOLDER_SIN_WHATSAPP.replace(/\D/g, '')).toBe('')
  })

  test('guardián: la pestaña Identidad no pinta de placeholder el número de config.ts', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/admin/personalizar/PestanaIdentidad.tsx'), 'utf8')
    expect(src).not.toContain('placeholder={defaults.whatsapp}')
    expect(src).not.toContain('placeholder={defaults.whatsappDisplay}')
    expect(src).toContain('placeholder={PLACEHOLDER_SIN_WHATSAPP}')
    expect(src).toContain('placeholder={placeholderWhatsAppDisplay(whatsapp)}')
  })
})

test.describe('recibo PDF sin número', () => {
  test('sin WhatsApp el encabezado es solo el sitio: nada de «WhatsApp» colgando', () => {
    const linea = lineaContactoRecibo(SITIO, leer(sinNumero()))
    expect(linea).toBe(SITIO)
    expect(linea).not.toContain('WhatsApp')
    // El marcador de ceros tampoco es un WhatsApp.
    expect(lineaContactoRecibo(SITIO, { whatsapp: '520000000000', whatsappDisplay: '00 0000 0000' })).toBe(SITIO)
  })

  test('con WhatsApp, el número vigente y con su formato', () => {
    const m = leer(publicar(escribirNumeroWhatsApp({}, '7774416667')))
    expect(lineaContactoRecibo(SITIO, m)).toBe(`${SITIO} · WhatsApp 777 441 6667`)
  })

  test('guardián: el recibo arma esa línea con lineaContactoRecibo', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/pdf/recibo-pago.tsx'), 'utf8')
    expect(src).toContain('lineaContactoRecibo(CONFIG.urlBase, cfg)')
    expect(src).not.toContain('· WhatsApp {cfg.whatsappDisplay}')
  })
})

test.describe('el número se lee igual en toda la plataforma', () => {
  test('whatsappVisible: el texto publicado, o el número con su formato; nunca dígitos crudos', () => {
    expect(whatsappVisible(leer(conNumero()))).toBe('33 1234 5678')
    expect(whatsappVisible({ whatsapp: '523312345678' })).toBe('33 1234 5678')
    expect(whatsappVisible({ contactoTelefono: '3312345678' })).toBe('33 1234 5678')
    expect(whatsappVisible({})).toBe('')
  })

  test('whatsappComoSeVera (vista previa): la misma regla que la lectura', () => {
    expect(whatsappComoSeVera('3312345678', '33 1234 5678')).toBe('33 1234 5678')
    expect(whatsappComoSeVera('3312345678', '(33) 1234-5678')).toBe('(33) 1234-5678') // cuadra: se respeta
    expect(whatsappComoSeVera('3312345678', '55 1111 2222')).toBe('33 1234 5678') // otro número: se corrige
    expect(whatsappComoSeVera('', '')).toBe('')
    expect(whatsappComoSeVera('520000000000', '')).toBe('')
    // Idéntico a lo que queda publicado con ese borrador.
    for (const [n, d] of [['3312345678', '55 1111 2222'], ['7774416667', '777 441 6667'], ['', '']] as const) {
      const m = leer(publicar({ whatsapp: n, contactoTelefono: n, whatsappDisplay: d }))
      expect(whatsappComoSeVera(n, d)).toBe(m.whatsappDisplay)
    }
  })

  test('guardián: perfil, FAQ de la clásica y vista previa no pintan dígitos crudos', () => {
    const leerSrc = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')
    const perfil = leerSrc('src/app/(dashboard)/alumno/perfil/page.tsx')
    expect(perfil).toContain('{whatsappVisible(cfg)}')
    expect(perfil).not.toContain('{cfg.contactoTelefono}')
    const clasica = leerSrc('src/components/landing/LandingClient.tsx')
    expect(clasica).toContain('whatsapp: whatsappVisible(config),')
    expect(clasica).not.toContain('whatsapp: config.whatsapp,')
    const panel = leerSrc('src/app/(dashboard)/admin/configuracion/page.tsx')
    expect(panel).toContain("whatsapp: whatsappComoSeVera(txt('whatsapp'), txt('whatsappDisplay')),")
  })

  test('guardián: el aviso sin correo no repite «WhatsApp: WhatsApp (…)»', () => {
    const aviso = readFileSync(join(process.cwd(), 'src/app/(legal)/aviso-de-privacidad/page.tsx'), 'utf8')
    expect(aviso).not.toContain("'WhatsApp:'")
    expect(aviso).toContain("MAILTO ? 'Correo electrónico:' : 'Contacto:'")
  })
})
