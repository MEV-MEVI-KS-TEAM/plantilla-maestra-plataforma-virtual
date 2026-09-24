import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { CONFIG } from '@/lib/config'
import { canalEscuela, faqSegunWhatsApp, mailtoEscuela } from '@/lib/contacto-ui'
import { canalDiplomado, mensajeDiplomado } from '@/lib/cursos/catalogo'
import { mensajeRegistro } from '@/lib/registro-mensajes'
import { mergeSiteConfig } from '@/lib/site-config-core'

/**
 * A1 · «Contacto por un solo camino».
 *
 * Cada pantalla armaba a mano su enlace de WhatsApp (`https://wa.me/${…}` o
 * `href={cfg.whatsappUrl}`) y su `mailto:`. Con eso, un número de 10 dígitos
 * no llegaba a nadie en 9 lectores, y una escuela sin número o sin correo
 * publicaba botones con `href=""`, `wa.me/` vacío o `mailto:` sin
 * destinatario, y textos como «escríbenos al .». Ahora TODO pasa por
 * `contacto-ui.ts`, que normaliza el número y devuelve `null` cuando no hay
 * canal.
 */

const RAIZ = join(process.cwd(), 'src')

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const r = join(dir, n)
    return statSync(r).isDirectory() ? archivos(r) : /\.(ts|tsx)$/.test(n) ? [r] : []
  })
}

/** El CÓDIGO, sin comentarios (los comentarios explican la regla y la citan). */
const sinComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\w])\/\/.*$/gm, '$1')

const FUENTES = archivos(RAIZ).map((a) => ({
  ruta: relative(RAIZ, a).split(sep).join('/'),
  codigo: sinComentarios(readFileSync(a, 'utf8')),
}))

// Los ÚNICOS sitios que pueden escribir `wa.me`. Los de admin/alumnos y
// admin/cobranza arman el enlace al teléfono del ALUMNO, no el de la escuela.
const WA_ME_PERMITIDO = new Set([
  'lib/contacto-ui.ts',
  'lib/whatsapp.ts',
  'lib/config.ts',
  'lib/site-config-validacion.ts', // deriva whatsappUrl del número ya normalizado
  'lib/site-config-campos.ts', // texto de ayuda del campo «Enlace de WhatsApp»
  'components/admin/personalizar/PestanaIdentidad.tsx', // la ayuda enseña el enlace
  'app/(dashboard)/admin/alumnos/page.tsx',
  'app/(dashboard)/admin/alumnos/[id]/page.tsx',
  'app/(dashboard)/admin/cobranza/page.tsx',
])

test.describe('guardianes: un solo camino para el contacto de la escuela', () => {
  test('ningún archivo arma `wa.me` a mano fuera de contacto-ui (salvo los enlaces al ALUMNO)', () => {
    const fuera = FUENTES.filter((f) => /wa\.me/.test(f.codigo) && !WA_ME_PERMITIDO.has(f.ruta)).map((f) => f.ruta)
    expect(fuera).toEqual([])
  })

  test('ningún archivo arma `mailto:` a mano fuera de contacto-ui', () => {
    const fuera = FUENTES.filter((f) => /mailto:/.test(f.codigo) && f.ruta !== 'lib/contacto-ui.ts').map((f) => f.ruta)
    expect(fuera).toEqual([])
  })

  test('nadie pinta el `whatsappUrl` de la config: el enlace sale del número', () => {
    const fuera = FUENTES
      .filter((f) => /\b(cfg|config|CONFIG)\.whatsappUrl\b/.test(f.codigo) && !f.ruta.startsWith('lib/site-config'))
      .map((f) => f.ruta)
    expect(fuera).toEqual([])
  })

  test('«Mis pagos» lee el contacto PUBLICADO, no config.ts', () => {
    const pagos = FUENTES.find((f) => f.ruta === 'app/(dashboard)/alumno/pagos/page.tsx')!.codigo
    expect(pagos).not.toMatch(/CONFIG\.whatsapp/)
    expect(pagos).toContain('useSiteConfig()')
    expect(pagos).toContain('canalEscuela(')
  })

  test('cada lector del bloque pasa por los helpers', () => {
    const usa = (ruta: string, helper: string) =>
      expect(FUENTES.find((f) => f.ruta === ruta)!.codigo, `${ruta} → ${helper}`).toContain(helper)
    usa('components/landing/LandingClient.tsx', 'urlWhatsAppEscuela(')
    usa('components/landing/LandingClient.tsx', 'mailtoEscuela(')
    usa('components/landing/LandingClient.tsx', 'faqSegunWhatsApp(')
    usa('components/landing/animada/LandingAnimada.tsx', 'faqSegunWhatsApp(')
    usa('components/landing/animada/LandingAnimada.tsx', 'mailtoEscuela(')
    usa('app/(auth)/login/page.tsx', 'urlWhatsAppEscuela(')
    usa('app/(auth)/register/page.tsx', 'urlWhatsAppEscuela(')
    usa('app/(auth)/register/page.tsx', 'mensajeRegistro(')
    usa('app/(dashboard)/alumno/page.tsx', 'canalEscuela(')
    usa('app/(dashboard)/alumno/pagar/page.tsx', 'canalEscuela(')
    usa('app/(dashboard)/alumno/perfil/page.tsx', 'mailtoEscuela(')
    usa('app/(dashboard)/alumno/perfil/page.tsx', 'urlWhatsAppEscuela(')
    usa('components/layout/footer.tsx', 'mailtoEscuela(')
    usa('components/layout/footer.tsx', 'urlWhatsAppEscuela(')
    usa('app/(legal)/aviso-de-privacidad/page.tsx', 'mailtoEscuela(')
    usa('app/(legal)/terminos-y-condiciones/page.tsx', 'urlWhatsAppEscuela(')
    usa('app/diplomados/page.tsx', 'canalEscuela(')
    usa('app/diplomados/[id]/page.tsx', 'canalDiplomado(')
  })

  test('los registros de WhatsApp del registro ya no son literales fijos', () => {
    const registro = FUENTES.find((f) => f.ruta === 'app/(auth)/register/page.tsx')!.codigo
    expect(registro).not.toMatch(/setError\('[^']*WhatsApp/)
  })

  test('la ayuda del correo no promete «avisos del sistema»', () => {
    const identidad = FUENTES.find((f) => f.ruta === 'components/admin/personalizar/PestanaIdentidad.tsx')!.codigo
    expect(identidad).not.toContain('avisos del sistema')
  })
})

test.describe('sin número o sin correo: ni botón ni enlace', () => {
  test('mailtoEscuela: sin correo → null; con correo → mailto con asunto opcional', () => {
    expect(mailtoEscuela('')).toBeNull()
    expect(mailtoEscuela('   ')).toBeNull()
    expect(mailtoEscuela(undefined)).toBeNull()
    expect(mailtoEscuela('hola@escuela.mx')).toBe('mailto:hola@escuela.mx')
    expect(mailtoEscuela(' hola@escuela.mx ', 'Informes')).toBe('mailto:hola@escuela.mx?subject=Informes')
  })

  test('la FAQ que da el número no se publica sin WhatsApp (nada de «al .»)', () => {
    const faq = [
      { q: '¿Tienen planes cortos?', a: 'Escríbenos por WhatsApp al {whatsapp}.' },
      { q: '¿Validez?', a: 'Sí, con certificado.' },
    ]
    expect(faqSegunWhatsApp(faq, false)).toEqual([faq[1]])
    expect(faqSegunWhatsApp(faq, true)).toEqual(faq)
  })

  test('canalEscuela: WhatsApp normalizado; sin número, el correo; sin nada, null', () => {
    expect(canalEscuela({ whatsapp: '3312345678' })?.href).toBe('https://wa.me/523312345678')
    expect(canalEscuela({ whatsapp: '', contactoEmail: 'a@b.mx' })?.href).toBe('mailto:a@b.mx')
    expect(canalEscuela({ whatsapp: '520000000000', contactoEmail: '' })).toBeNull()
    expect(canalEscuela({ whatsapp: '', contactoEmail: '  ', email: '' })).toBeNull()
  })

  test('diplomado: WhatsApp con el mensaje del curso, correo con ese asunto, o nada', () => {
    const conNumero = canalDiplomado({ whatsapp: '3312345678' }, 'Dactiloscopia Forense')
    expect(conNumero?.href).toBe(`https://wa.me/523312345678?text=${encodeURIComponent(mensajeDiplomado('Dactiloscopia Forense'))}`)
    const conCorreo = canalDiplomado({ whatsapp: '', contactoEmail: 'a@b.mx' }, 'Balística')
    expect(conCorreo?.tipo).toBe('correo')
    expect(decodeURIComponent(conCorreo!.href)).toContain('Balística')
    expect(canalDiplomado({ whatsapp: '' }, 'Balística')).toBeNull()
    // Con la config publicada de una escuela sin número ni correo, tampoco.
    const sinNada = mergeSiteConfig(CONFIG, { whatsapp: '', contactoTelefono: '', whatsappUrl: '', email: '', contactoEmail: '' })
    expect(canalDiplomado(sinNada, 'X')).toBeNull()
  })

  test('registro: la frase de WhatsApp solo va si hay número; con número, el texto de siempre', () => {
    expect(mensajeRegistro('limite', { hayWhatsApp: true })).toBe(
      'Hemos enviado demasiados correos en la última hora. Espera unos minutos y vuelve a intentarlo, o escríbenos por WhatsApp y te damos de alta nosotros.')
    expect(mensajeRegistro('generico', { hayWhatsApp: true })).toBe(
      'No pudimos crear tu cuenta en este momento. Vuelve a intentarlo o escríbenos por WhatsApp.')
    expect(mensajeRegistro('confirmar', { hayWhatsApp: true, email: 'x@y.mx' })).toBe(
      'Te enviamos un correo de confirmación a x@y.mx. Revísalo (y la carpeta de spam) para activar tu cuenta. Si no te llega en unos minutos, escríbenos por WhatsApp y te damos de alta nosotros.')
    for (const caso of ['limite', 'generico', 'confirmar'] as const) {
      expect(mensajeRegistro(caso, { hayWhatsApp: false, email: 'x@y.mx' })).not.toContain('WhatsApp')
    }
  })
})
