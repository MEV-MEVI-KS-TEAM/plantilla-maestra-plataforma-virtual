import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'

/**
 * Guardianes de los DOS DOCUMENTOS LEGALES (Bug P-8).
 *
 * No son textos de marketing: son un contrato y un aviso de privacidad, y
 * obligan a la escuela que los publica. Traían sin gatear dos cosas que no toda
 * escuela puede sostener:
 *
 *   · una «Garantía de Certificación» con sus condiciones detalladas, y la
 *     descripción del servicio como la obtención de certificados avalados por la
 *     SEP mediante convenio con instituciones incorporadas. En una escuela sin
 *     ese convenio el contrato la obligaba, por escrito, a entregar un documento
 *     que no puede entregar — y detallaba las condiciones de la garantía, que es
 *     lo que un alumno citaría para reclamarla;
 *
 *   · una TRANSFERENCIA de datos a «Autoridades educativas (SEP / instituciones
 *     convenio)» que, si la escuela no tramita nada, no ocurre. Declarar un
 *     destinatario al que no se le envía nada es exactamente lo que la LFPDPPP
 *     pide no hacer, en el documento que se presenta como el cumplimiento de esa
 *     ley.
 *
 * Y cinco `mailto:` sin gatear: con `email: ''` quedaban como `mailto:` a secas,
 * con el texto visible vacío. Tres de ellos son la única vía que el Aviso ofrece
 * para ejercer derechos ARCO y pedir la oposición a finalidades secundarias; uno
 * es la única para pedir un REEMBOLSO dentro del plazo.
 *
 * Se lee el TSX como texto: estas páginas son Server Components asíncronos que
 * llaman a `getSiteConfig()` (y con ella a Supabase), así que no se pueden
 * montar en una prueba unitaria. Lo que se vigila aquí es la ESTRUCTURA del
 * gateo; que el texto renderizado con la bandera encendida no se mueva ni un
 * byte se comprueba aparte, comparando el HTML prerenderizado del build.
 */

const raiz = process.cwd()
const RUTAS = {
  'terminos-y-condiciones': join(raiz, 'src', 'app', '(legal)', 'terminos-y-condiciones', 'page.tsx'),
  'aviso-de-privacidad': join(raiz, 'src', 'app', '(legal)', 'aviso-de-privacidad', 'page.tsx'),
}
const FUENTE = Object.fromEntries(
  Object.entries(RUTAS).map(([k, p]) => [k, readFileSync(p, 'utf8')]),
) as Record<keyof typeof RUTAS, string>

/** El TSX sin comentarios: aquí se documenta el defecto citando el texto viejo. */
const sinComentarios = (s: string) =>
  s.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

// ─── La bandera ─────────────────────────────────────────────────────────────

test('P-8. `ofreceCertificacion` existe y nace en `true`', () => {
  // El default es lo que protege a las escuelas ya entregadas: con `true` los
  // dos documentos salen exactamente como salían antes de que la clave
  // existiera. Si alguien la cambia a `false` en la PLANTILLA, cambia el
  // contrato de toda la flota nueva de golpe.
  expect(CONFIG).toHaveProperty('ofreceCertificacion')
  expect(CONFIG.ofreceCertificacion).toBe(true)
})

test('P-8. la bandera NO es editable desde "Personalizar mi página"', () => {
  // Encender desde un panel una certificación que la escuela no gestiona es
  // afirmar algo falso en su nombre, y quien lo pulse no tiene forma de saber
  // que lo está haciendo. Va con `landing.validezOficial` y `diploma.*` en la
  // lista de claves que quedan fuera del editor.
  const campos = readFileSync(join(raiz, 'src', 'lib', 'site-config-campos.ts'), 'utf8')
  expect(campos).not.toContain('ofreceCertificacion')
})

// ─── El gateo del vocabulario de certificación ─────────────────────────────

/**
 * Frases que SOLO puede publicar una escuela que certifica. Se busca cada una y
 * se exige que esté dentro de una rama de `CERTIFICA`.
 */
const SOLO_SI_CERTIFICA: Record<keyof typeof RUTAS, string[]> = {
  'terminos-y-condiciones': [
    'garantía de certificación',
    'Garantía de Certificación',
    'mediante convenio con instituciones incorporadas',
    'Gestión y trámite del proceso de acreditación ante la SEP',
    'Demoras en la emisión del certificado oficial',
  ],
  'aviso-de-privacidad': [
    'Brindar acompañamiento durante el proceso de acreditación ante la SEP',
    'gestionar el certificado oficial',
    'Autoridades educativas (SEP / instituciones convenio)',
  ],
}

for (const [pagina, frases] of Object.entries(SOLO_SI_CERTIFICA) as Array<[keyof typeof RUTAS, string[]]>) {
  test(`P-8. en ${pagina}, el vocabulario de certificación va dentro de una rama de CERTIFICA`, () => {
    const src = sinComentarios(FUENTE[pagina])
    expect(src, 'la página no lee CONFIG.ofreceCertificacion').toContain('CONFIG.ofreceCertificacion')

    for (const frase of frases) {
      const i = src.indexOf(frase)
      expect(i, `la frase «${frase}» ya no está en ${pagina}: ¿se reescribió el documento?`)
        .toBeGreaterThan(-1)
      // Tiene que haber un `CERTIFICA` ABIERTO por delante de la frase: o el
      // ternario de la sección, o el `&&` del bullet.
      const antes = src.slice(0, i)
      const ultimoGate = Math.max(antes.lastIndexOf('CERTIFICA ?'), antes.lastIndexOf('CERTIFICA &&'))
      expect(ultimoGate, `«${frase}» se publica SIN gatear en ${pagina}`).toBeGreaterThan(-1)
    }
  })
}

test('P-8. la rama SIN certificación no se queda en un hueco: declara el alcance real', () => {
  // Quien no certifica tiene que DECIR que no certifica. Borrar los párrafos y
  // dejar el silencio es peor: el alumno sigue sin saber qué compra, y el aviso
  // de privacidad deja de explicar qué NO pasa con sus documentos.
  const terminos = sinComentarios(FUENTE['terminos-y-condiciones'])
  expect(terminos).toContain('No emite certificados con validez oficial')
  expect(terminos).toContain('Compromiso Académico')

  const aviso = sinComentarios(FUENTE['aviso-de-privacidad'])
  expect(aviso).toContain('No transferimos tus datos a autoridades educativas')
})

test('P-8. la numeración de las secciones no cambia entre las dos ramas', () => {
  // Un contrato con las secciones 2, 4, 5 se lee como un documento al que le
  // falta una página. La sección 3 sigue siendo la 3, con otro título.
  const terminos = FUENTE['terminos-y-condiciones']
  const titulos = [...terminos.matchAll(/<Section title=(?:"([^"]+)"|\{[^}]*?'(\d+\.[^']+)'[^}]*\})/g)]
    .map(m => (m[1] ?? m[2] ?? '').trim())
    .filter(Boolean)
  const numeros = titulos.map(t => Number(t.split('.')[0])).filter(n => !Number.isNaN(n))
  expect(numeros.length, 'no encuentro las secciones numeradas').toBeGreaterThan(5)
  // Consecutivas desde 1, sin huecos ni repeticiones.
  expect(numeros).toEqual([...numeros].sort((a, b) => a - b))
  expect(new Set(numeros).size).toBe(numeros.length)
  expect(numeros[0]).toBe(1)
  expect(numeros[numeros.length - 1]).toBe(numeros.length)
})

// ─── El gateo del correo ───────────────────────────────────────────────────

for (const pagina of Object.keys(RUTAS) as Array<keyof typeof RUTAS>) {
  test(`P-8c. en ${pagina} el correo sale de mailtoEscuela y solo lo pinta el componente Contacto`, () => {
    const src = sinComentarios(FUENTE[pagina])

    // Desde A1 (Bloque A) la página ya no arma `mailto:` a mano: lo arma
    // `mailtoEscuela`, que devuelve `null` si no hay destinatario. Un `mailto:`
    // literal aquí sería un enlace que se salta esa comprobación.
    expect(src, `hay un mailto: literal en ${pagina}`).not.toMatch(/mailto:/)
    expect(src).toMatch(/const MAILTO\s*=\s*mailtoEscuela\(EMAIL\)/)

    // El enlace de correo solo lo pinta `const Contacto = …`, colgado del dato
    // (`MAILTO`), con el WhatsApp como alternativa y, sin ninguno de los dos,
    // un texto sin enlace.
    const iContacto = src.indexOf('const Contacto =')
    expect(iContacto, `${pagina} no define el componente Contacto`).toBeGreaterThan(-1)
    // El cuerpo de Contacto llega hasta el `return (` del componente de página.
    const finContacto = src.indexOf('return (', iContacto)
    const cuerpoContacto = src.slice(iContacto, finContacto)
    expect(cuerpoContacto).toMatch(/MAILTO\s*$|MAILTO\s*\n/m)
    expect(cuerpoContacto).toContain('WHATSAPP_URL')
    expect(cuerpoContacto).toContain('los medios de contacto publicados en')
    const enlacesCorreo = [...src.matchAll(/href=\{MAILTO\}/g)].map(m => m.index!)
    expect(enlacesCorreo.length, `${pagina} no pinta ningún enlace de correo: ¿se borró el contacto?`).toBeGreaterThan(0)
    for (const i of enlacesCorreo) {
      expect(i >= iContacto && i < finContacto,
        `hay un enlace de correo suelto en ${pagina} (posición ${i}), fuera de Contacto`).toBe(true)
    }
  })
}
