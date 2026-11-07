import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { EDAD_MINIMA_PRIMARIA, hoyEnMexico, revisarEdadTutor } from '@/lib/registro-reglas'
import { TEXTOS_SOLO_PRIMARIA, aplicarLandingMixtoPrimaria, ofertaMixtaPrimaria, textosMixtoPrimaria, validezDeLaOferta } from '@/lib/landing-solo-primaria'
import { mergeSiteConfig, type BaseSiteConfig } from '@/lib/site-config-core'
import { CAMPOS } from '@/lib/site-config-campos'
import { validarOverrides } from '@/lib/site-config-validacion'
import { getDuracionOferta } from '@/lib/modalidades'
import { armarBoletin } from '@/lib/boletin'
import { soloPrimariaEntrega } from '../../scripts/entrega/planes.mjs'

/**
 * Primaria, por CONDUCTA: lo que queda escrito en la base y lo que se ve en pantalla, con
 * las rutas y las páginas reales (tests/arnes-rutas). Nació de una revisión adversarial
 * en la que 12 de 14 mutaciones pasaban porque las pruebas buscaban texto en el fuente.
 *
 * Lo que solo Postgres puede decir (CHECK, la columna generada, los seeds cargados) no
 * está aquí: aquí se lee la definición y se compara contra el plan.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const PLAN = JSON.parse(leer('tests/unit/fixtures/primaria-plan.json')) as {
  orden_apertura: string[]
  modalidades: Record<string, { meses: number; materias_por_mes: number }>
  materias: { codigo: string; nombre: string }[]
}

const [mayor, menor] = process.versions.node.split('.').map(Number)
const nodeSirve = mayor > 23 || (mayor === 23 && menor >= 6)

const correrArnes = (archivo: string, ...args: string[]) => JSON.parse(execFileSync(
  process.execPath, ['--no-warnings', `tests/arnes-rutas/${archivo}`, ...args],
  { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, NODE_ENV: 'production' } },
))

type Fila = Record<string, unknown> | null
type CasoRuta = { status: number; cuerpo: Record<string, unknown> | null; rpc: string[]; escrituras: { op: string; valores: Record<string, unknown> }[]; alumno: Fila; nuevo: Fila; log: string }
type Rutas = Record<string, CasoRuta> & {
  ficha: Record<'apagado' | 'apagadoConDatos' | 'encendido', { status: number; claves: string[]; tutor?: string; duracion?: number }>
  documentosPrimaria: string
  documentosSecundaria: string
  ritmoPlanApagado: { meses: number; porMes: number; abreTodo: number; etiqueta: string; oferta: string[] }
  ritmoAddOnApagado: Record<string, { meses: number; porMes: number; abreTodo: number; etiqueta: string }> & { oferta: string[]; defecto: string }
  abrirMesApagado: { status: number; tope: number }
}

const TUTOR_LIMPIO = { fecha_nacimiento: '2012-03-10', tutor_nombre: 'Rosa López', tutor_telefono: '3312345678', tutor_parentesco: 'Madre' }
const VACIO = { fecha_nacimiento: null, tutor_nombre: null, tutor_telefono: null, tutor_parentesco: null }
const PREVIO = { fecha_nacimiento: '2000-01-01', tutor_nombre: 'Previo', tutor_telefono: '5500000000', tutor_parentesco: 'Padre' }

test.describe('rutas reales: lo que queda escrito', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 })
  test.skip(!nodeSirve, 'el arnés necesita Node 23.6 o mayor')
  let r: Rutas
  test.beforeAll(() => { r = correrArnes('primaria-rutas.mjs') })

  test('R1. el registro público guarda fecha y tutor; sin tutor, 400 y nada escrito', () => {
    expect(r.registroMenor.status).toBe(200)
    expect(r.registroMenor.nuevo).toMatchObject({ nivel: 'primaria', modalidad: '9_meses_pri', ...TUTOR_LIMPIO })
    expect(r.registroSinTutor.status).toBe(400)
    expect(r.registroSinTutor.escrituras).toEqual([])
  })

  test('R2. el alta del admin guarda fecha y tutor; sin tutor, 400 y sin cuenta', () => {
    expect(r.altaMenor.status).toBe(201)
    expect(r.altaMenor.nuevo).toMatchObject({ nivel: 'primaria', modalidad: '6_meses_pri', ...TUTOR_LIMPIO })
    expect(r.altaSinTutor.status).toBe(400)
    expect(r.altaSinTutor.nuevo).toBeNull()
  })

  test('R3. «Corregir plan» deja juntos el plan y el tutor', () => {
    expect(r.corregirOk.status).toBe(200)
    expect(r.corregirOk.alumno).toMatchObject({ nivel: 'primaria', modalidad: '3_meses_pri', ...TUTOR_LIMPIO })
  })

  test('R4. si el plan no se corrige, el tutor vuelve a como estaba; sin tutor guardado, el plan no se toca', () => {
    for (const caso of [r.corregirCandado, r.corregirRpcError]) {
      expect(caso.status).toBeGreaterThanOrEqual(400)
      expect(caso.alumno).toMatchObject({ nivel: 'secundaria', modalidad: '3_meses', ...PREVIO })
    }
    expect(r.corregirCandado.status).toBe(409)
    expect(r.corregirTutorFalla.status).toBe(500)
    expect(r.corregirTutorFalla.rpc).not.toContain('corregir_plan_estudio')
    expect(r.corregirTutorFalla.alumno).toMatchObject({ nivel: 'secundaria', modalidad: '3_meses', ...VACIO })
  })

  test('R4b. con un candado puesto no se escribe nada: un menor no pierde a su tutor aunque la vuelta falle', () => {
    for (const caso of [r.corregirCandadoPrevio, r.corregirCandadoPrevioError]) {
      expect(caso.escrituras).toEqual([])
      expect(caso.rpc).not.toContain('corregir_plan_estudio')
      expect(caso.alumno).toMatchObject({ nivel: 'secundaria', modalidad: '3_meses', tutor_nombre: 'Previo' })
    }
    expect(r.corregirCandadoPrevio.status).toBe(409)
    expect(r.corregirCandadoPrevio.cuerpo).toMatchObject({ candado: 'pagos' })
    expect(r.corregirCandadoPrevio.alumno).toMatchObject({ fecha_nacimiento: '2012-03-10' })
    expect(r.corregirCandadoPrevioError.status).toBe(500)
  })

  test('R4c. la RPC confirma y se pierde la respuesta: no se restaura y responde éxito', () => {
    for (const caso of [r.corregirPerdidaError, r.corregirPerdidaVacia, r.corregirPerdidaExcepcion]) {
      expect(caso.status).toBe(200)
      expect(caso.cuerpo).toMatchObject({ ok: true })
      expect(caso.alumno).toMatchObject({ nivel: 'primaria', modalidad: '3_meses_pri', ...TUTOR_LIMPIO })
    }
  })

  test('R4d. sin poder releer la fila no se restaura: se registra y responde error', () => {
    const c = r.corregirSinRelectura
    expect(c.status).toBe(500)
    expect(c.alumno).toMatchObject({ nivel: 'primaria', modalidad: '3_meses_pri', ...TUTOR_LIMPIO })
    expect(c.log).toContain('no se pudo releer')
    expect(c.escrituras).toHaveLength(1)
  })

  test('R4e. sin respuesta y con el plan igual, el tutor vuelve; con otro plan, no se toca y se avisa', () => {
    expect(r.corregirPerdidaSinCambio.status).toBe(500)
    expect(r.corregirPerdidaSinCambio.alumno).toMatchObject({ nivel: 'secundaria', modalidad: '3_meses', ...PREVIO })
    expect(r.corregirOtroPlan.status).toBe(409)
    expect(r.corregirOtroPlan.alumno).toMatchObject({ nivel: 'primaria', modalidad: '6_meses_pri', ...TUTOR_LIMPIO })
    expect(r.corregirOtroPlan.escrituras).toHaveLength(1)
  })

  test('R4f. un CHECK que rechaza la corrección no manda fecha ni tutor a los logs', () => {
    expect(r.corregirCheck.status).toBe(500)
    expect(r.corregirCheck.log).toContain('23514')
    expect(r.corregirCheck.log).not.toContain('Rosa')
    expect(r.corregirCheck.log).not.toContain('3312345678')
    // Sin el add-on, el registro de siempre.
    expect(r.corregirApagadoCheck.log).toContain('Failing row')
  })

  test('R5. sin el add-on no se lee ni se escribe nada de edad o tutor', () => {
    expect(r.registroApagadoPrimaria.status).toBe(400)
    expect(r.registroApagadoPrimaria.escrituras).toEqual([])
    expect(r.registroApagadoSecundaria.status).toBe(200)
    expect(Object.keys(r.registroApagadoSecundaria.escrituras[0].valores).filter(k => k in VACIO)).toEqual([])
    expect(r.altaApagadoSecundaria.status).toBe(201)
    expect(Object.keys(r.altaApagadoSecundaria.escrituras[0].valores).filter(k => k in VACIO)).toEqual([])
    expect(r.corregirApagado.status).toBe(200)
    expect(r.corregirApagado.escrituras).toEqual([])
    expect(r.corregirApagado.rpc).toEqual(['corregir_plan_estudio'])
  })

  test('R6. un CHECK que rechaza la fila no manda fecha ni tutor a los logs', () => {
    expect(r.registroCheckFalla.status).toBe(500)
    expect(r.registroCheckFalla.log).toContain('23514')
    expect(r.registroCheckFalla.log).not.toContain('Rosa')
    expect(r.registroCheckFalla.log).not.toContain('3312345678')
  })

  test('R7. la ficha no gana claves sin el add-on, y conserva lo que ya estaba capturado', () => {
    expect(r.ficha.apagado).toEqual({ status: 200, claves: [] })
    const CUATRO = ['fecha_nacimiento', 'tutor_nombre', 'tutor_telefono', 'tutor_parentesco']
    expect(r.ficha.encendido.claves).toEqual(CUATRO)
    expect(r.ficha.apagadoConDatos.claves).toEqual(CUATRO)
    expect(r.ficha.apagadoConDatos.tutor).toBe('Rosa López')
  })

  test('R8. quien ya está inscrito conserva su ritmo si se apaga el plan o el add-on; la oferta sí se filtra', () => {
    expect(r.ritmoPlanApagado).toMatchObject({ meses: 9, porMes: 2, abreTodo: 18, etiqueta: '9 meses — Extendido' })
    expect(r.ritmoPlanApagado.oferta).toEqual(['3_meses_pri', '6_meses_pri'])
    for (const [id, p] of Object.entries(PLAN.modalidades)) {
      expect(r.ritmoAddOnApagado[id], id).toMatchObject({ meses: p.meses, porMes: p.materias_por_mes, abreTodo: 18 })
    }
    expect(r.ritmoAddOnApagado.oferta).toEqual([])
    expect(r.abrirMesApagado).toEqual({ status: 200, tope: 9 })
    // Y lo de siempre no se mueve: un id desconocido cae al primer plan del programa.
    expect(r.ritmoAddOnApagado.secundaria).toEqual({ meses: 3, porMes: 4 })
    expect(r.ritmoAddOnApagado.desconocido).toEqual({ meses: 3, porMes: 4, etiqueta: 'x' })
    expect(r.ritmoAddOnApagado.defecto).toBe('3_meses')
  })

  test('R9. la API de documentos reconoce a Primaria', () => {
    expect(r.documentosPrimaria).toBe('Primaria')
    expect(r.documentosSecundaria).toBe('Secundaria')
  })
})

// ─── Lo que se ve ────────────────────────────────────────────────────────────

type Portal = {
  animada: string; clasica: string; login: string; registro: string; aviso: string; terminos: string
  constanciaPrimaria: string; constanciaSecundaria: string
  documentosPrimaria: string; documentosSecundaria: string; documentosPreparatoria: string
  adminDocumentos: string; mensajesAvance: string[]; errores: string[]
}
const sinEtiquetas = (h: string) => h.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
/** Lo que no puede leer un alumno de Primaria. */
const PROHIBIDO = /\bSEP\b|\bINEA\b|Secretar[ií]a de Educaci|validez|certificado oficial|Acreditaci[oó]n|\bCCT\b/i
/**
 * La leyenda de Primaria (Kevin, 7-nov-2026). Escrita aquí a mano, no importada: si alguien cambia
 * la constante, estas pruebas lo ven. La de la constancia es el texto exacto; en las portadas va
 * con «La» porque ahí no hay constancia a la vista.
 */
const APARTE = 'No sustituye al certificado de estudios; la certificación se tramita por separado con la institución.'
const LEYENDA = `Esta constancia acredita el avance del alumno en la plataforma. ${APARTE}`
const NOTA = `La constancia acredita el avance del alumno en la plataforma. ${APARTE}`
const NOTA_ACOTADA = `En Primaria, la constancia acredita el avance del alumno en la plataforma. ${APARTE}`
/** La leyenda vieja contradecía el precio de certificación: no queda en ninguna parte. */
const VIEJA = /no incluye certificado oficial|Entrega constancia de avance|No constituye certificación oficial ni es válido para trámites\.|Consulta con tu escuela el proceso/i

/** La tarjeta `<article>` de un nivel en la portada animada. */
const tarjetaAnimada = (html: string, nivel: string) => {
  const t = html.split('<article').find(a => a.includes(`>${nivel}</h3>`))
  expect(t, `tarjeta de ${nivel}`).toBeDefined()
  return sinEtiquetas(t!.slice(0, t!.indexOf('</article>')))
}
/** La tarjeta de un nivel en la portada clásica: de su título al siguiente. */
const tarjetaClasica = (html: string, nivel: string) => {
  const i = html.indexOf(`>${nivel}</h3>`)
  expect(i, `tarjeta de ${nivel}`).toBeGreaterThan(-1)
  const j = html.indexOf('</h3>', i + nivel.length + 6)
  return sinEtiquetas(html.slice(i, j === -1 ? undefined : j))
}

test.describe('páginas reales: lo que se ve', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 })
  test.skip(!nodeSirve, 'el arnés necesita Node 23.6 o mayor')
  const combos: Record<string, Portal> = {}
  const conValidez: Record<string, Portal> = {}
  test.beforeAll(() => {
    for (const c of ['apagado', 'mixto', 'mixto-sec', 'solo', 'sin-cifras']) combos[c] = correrArnes('primaria-portal.mjs', c)
    for (const c of ['mixto', 'mixto-sec']) conValidez[c] = correrArnes('primaria-portal.mjs', c, 'con-validez')
  })

  test('V1. todas las páginas se pintan sin errores', () => {
    for (const [c, p] of Object.entries(combos)) expect(p.errores, c).toEqual([])
  })

  test('V2. apagado: ni tarjeta, ni nota, ni documento, ni texto nuevo', () => {
    const p = combos.apagado
    for (const portada of [p.animada, p.clasica]) {
      expect(portada).not.toContain('>Primaria</h3>')
      expect(portada).not.toContain(NOTA)
    }
    expect(p.adminDocumentos).not.toContain('Comprobante de Domicilio')
    expect(p.adminDocumentos).toContain('Certificado de Primaria')
    for (const original of ['Acompañamiento para tu certificado SEP', 'Centro de Apoyo para la Acreditación de Conocimientos', 'CENTRO DE APOYO', 'Acreditación de Conocimientos']) {
      expect(p.login, original).toContain(original)
      expect(p.registro, original).toContain(original)
    }
    expect(p.login).toContain('obtén acompañamiento en tu certificación')
    expect(p.aviso).not.toContain('consentimiento, compartiremos')
    expect(p.aviso).toContain('Autoridades educativas (SEP / instituciones convenio)')
  })

  test('V3. la constancia de un alumno de Primaria no nombra autoridad, CCT ni certificación oficial', () => {
    for (const c of ['apagado', 'mixto', 'solo']) {
      const texto = sinEtiquetas(combos[c].constanciaPrimaria)
      // Sin excepción: la leyenda nueva no niega nada que haya que quitar antes de buscar.
      expect(texto, c).not.toMatch(PROHIBIDO)
      expect(texto, c).toContain(LEYENDA)
      expect(texto, c).not.toMatch(VIEJA)
      expect(texto, c).not.toContain('Este documento es de carácter informativo')
      expect(texto, c).not.toContain('Se certifica')
      expect(texto, c).toContain('Constancia de avance')
      expect(texto, c).not.toContain('CCT-DE-PRUEBA')
    }
    // Los demás niveles, palabra por palabra lo de siempre.
    const sec = sinEtiquetas(combos.apagado.constanciaSecundaria)
    expect(sec).toContain('Centro de Apoyo para la Acreditación de Conocimientos · CCT: CCT-DE-PRUEBA')
    expect(sec).toContain('Se certifica que el alumno')
    expect(sec).toContain('Constancia de Estudios')
    expect(sec).toContain('Este documento es de carácter informativo y refleja el avance académico del alumno dentro de la plataforma. '
      + 'No constituye certificación oficial ni es válido para trámites ante la SEP u otras instituciones. '
      + 'Para obtener el certificado oficial con validez SEP, debe completar el proceso de certificación correspondiente.')
    expect(sec).not.toContain(APARTE)
  })

  test('V4. login y registro con Primaria: sin SEP, sin acreditación, sin certificación', () => {
    for (const c of ['mixto', 'mixto-sec', 'solo']) {
      for (const pagina of ['login', 'registro'] as const) {
        const texto = sinEtiquetas(combos[c][pagina])
        expect(texto, `${c} ${pagina}`).not.toMatch(PROHIBIDO)
        expect(texto, `${c} ${pagina}`).not.toMatch(/en tu certificación|CENTRO DE APOYO/)
      }
    }
  })

  test('V5. portada animada mixta: la tarjeta de Primaria trae sus cifras, no las generales', () => {
    const pri = tarjetaAnimada(combos.mixto.animada, 'Primaria')
    expect(pri).toContain('Certificación: $3,000')
    expect(pri).not.toContain('$5,900')
    expect(pri).toContain(NOTA)
    expect(pri).toContain('$700')
    const sec = tarjetaAnimada(combos.mixto.animada, 'Secundaria')
    expect(sec).toContain('Certificación: $4,900')
    expect(sec).not.toContain(NOTA)
    expect(tarjetaAnimada(combos.mixto.animada, 'Preparatoria')).toContain('Certificación: $5,900')
    expect(sinEtiquetas(combos.mixto.animada)).toContain('$450')
  })

  test('V6. portada clásica mixta: la tarjeta de Primaria trae sus cifras y su nota', () => {
    const pri = tarjetaClasica(combos.mixto.clasica, 'Primaria')
    expect(pri).toContain('Inscripción: $450')
    expect(pri).toContain('Certificación')
    expect(pri).toContain('$3,000')
    expect(pri).toContain(NOTA)
    expect(pri).not.toContain('$599')
  })

  test('V7. sin cifra en la tabla no se anuncia «$0», en ninguna portada', () => {
    const clasica = tarjetaClasica(combos['sin-cifras'].clasica, 'Primaria')
    expect(clasica).not.toContain('$0')
    expect(clasica).not.toContain('Certificación')
    expect(clasica).not.toContain('Inscripción: ')
    const animada = tarjetaAnimada(combos['sin-cifras'].animada, 'Primaria')
    expect(animada).not.toContain('$0')
    expect(animada).not.toContain('Certificación:')
  })

  test('V8. portadas mixtas, con y sin la validez encendida: lo que nombra a la SEP dice a qué niveles aplica', () => {
    const FRASE = /[^.?!¿]*(?:\bSEP\b|validez|certificado oficial)[^.?!]*[.?!]?/gi
    /**
     * Fuera: la tarjeta de Primaria, que ya es suya, y la sección de validez, cuyo título dice
     * de qué niveles es (en la clásica, el folio va en una segunda banda justo después).
     */
    const sinPropias = (h: string) => h
      .replace(/<article(?:(?!<\/article>)[\s\S])*?>Primaria<\/h3>[\s\S]*?<\/article>/, '')
      .replace(/>Primaria<\/h3>[\s\S]*?<\/h3>/, '')
      .replace(/<section id="validez"[\s\S]*?<\/section>(?:\s*<section(?:(?!<\/section>)[\s\S])*?Folio de ejemplo[\s\S]*?<\/section>)?/, '')
    for (const [c, nombres] of [['mixto', /Secundaria y Preparatoria|Secundaria o Preparatoria|Sec y Prepa/], ['mixto-sec', /Secundaria/]] as const) {
      for (const p of [combos[c], conValidez[c]]) {
        for (const portada of [p.animada, p.clasica]) {
          const frases = sinEtiquetas(sinPropias(portada)).match(FRASE) ?? []
          expect(frases.length, c).toBeGreaterThan(0)
          for (const frase of frases) {
            // La FAQ y el paso del proceso la nombran seguida: «…corresponde a la SEP» es la misma respuesta.
            if (/mientras la validez oficial corresponde a la SEP/.test(frase)) continue
            expect(frase, c).toMatch(nombres)
          }
        }
      }
    }
    expect(sinEtiquetas(combos['mixto-sec'].clasica)).not.toContain('Con certificado oficial en Secundaria y Preparatoria')
    // Y el título de la sección sí lo dice, en las dos portadas.
    for (const portada of [conValidez.mixto.animada, conValidez.mixto.clasica]) {
      expect(sinEtiquetas(portada)).toContain('Tu certificado de Secundaria y Preparatoria vale en México y USA')
    }
  })

  test('V8b. el menú y la franja acotan la sección de validez en un combo mixto', () => {
    const menu = (h: string) => [...h.matchAll(/href="#validez"[^>]*>([^<]*)</g)].map(m => m[1])
    expect(menu(conValidez.mixto.animada).length).toBeGreaterThan(0)
    for (const etiqueta of menu(conValidez.mixto.animada)) expect(etiqueta).toBe('Validez oficial en Sec y Prepa')
    for (const etiqueta of menu(conValidez['mixto-sec'].animada)) expect(etiqueta).toBe('Validez oficial en Secundaria')
    // La franja: ninguna «Validez oficial» suelta.
    expect(sinEtiquetas(conValidez.mixto.animada).match(/Validez oficial(?! en Sec y Prepa| de Secundaria y Preparatoria)/g) ?? []).toEqual([])
    // Sin la sección, ni el menú la anuncia.
    expect(menu(combos.mixto.animada)).toEqual([])
  })

  test('V8c. la caja de certificación con varios niveles dice que la nota es de Primaria', () => {
    const caja = (h: string) => {
      const i = h.indexOf('Certificación · pago único al concluir')
      expect(i).toBeGreaterThan(-1)
      return sinEtiquetas(h.slice(i, h.indexOf('</p>', h.indexOf('no está incluida en el total del plan', i))))
    }
    expect(caja(combos.mixto.animada)).toContain(`La certificación no está incluida en el total del plan. ${NOTA_ACOTADA}`)
    expect(caja(combos['mixto-sec'].animada)).toContain(NOTA_ACOTADA)
    // Sola en la caja no hace falta aclarar.
    expect(caja(combos.solo.animada)).toContain(`La certificación no está incluida en el total del plan. ${NOTA}`)
    expect(caja(combos.solo.animada)).not.toContain('En Primaria,')
  })

  test('V8d. la leyenda vieja no queda en ninguna página y la nueva dice lo mismo en portadas, FAQ y constancia', () => {
    for (const c of ['mixto', 'mixto-sec', 'solo', 'sin-cifras']) {
      const p = combos[c]
      for (const [nombre, html] of Object.entries({ animada: p.animada, clasica: p.clasica, aviso: p.aviso, terminos: p.terminos, constancia: p.constanciaPrimaria })) {
        expect(sinEtiquetas(html), `${c} ${nombre}`).not.toMatch(VIEJA)
      }
      // La tarjeta de Primaria trae la nota en las dos portadas, con o sin cifras.
      expect(tarjetaAnimada(p.animada, 'Primaria'), c).toContain(NOTA)
      expect(sinEtiquetas(p.clasica), c).toContain(NOTA)
    }
    // La FAQ de fábrica de un combo mixto termina con la misma idea, acotada a Primaria y más corta:
    // el editor admite 500 caracteres por respuesta (X5 la publica completa con validarOverrides).
    for (const n of [['secundaria', 'preparatoria'], ['secundaria'], ['preparatoria']]) {
      const faq = Object.values(textosMixtoPrimaria(n)).find(t => t.includes('Fungimos como Centro de Apoyo')) ?? ''
      expect(faq.endsWith(` En Primaria, la constancia acredita el avance y ${APARTE.charAt(0).toLowerCase()}${APARTE.slice(1)}`), n.join('+')).toBe(true)
      expect(faq.length, n.join('+')).toBeLessThanOrEqual(500)
    }
    // Y el aviso de un combo mixto con cifra: la certificación de Primaria con la institución, sin autoridad.
    const parrafo = sinEtiquetas(combos.mixto.aviso).match(/Certificación de Primaria\.[^.]*\./)?.[0] ?? ''
    expect(parrafo).toContain('compartiremos con la institución con la que se gestione')
    expect(parrafo).not.toMatch(PROHIBIDO)
    // Apagado: ni la nota nueva.
    for (const portada of [combos.apagado.animada, combos.apagado.clasica]) expect(sinEtiquetas(portada)).not.toContain(APARTE)
  })

  test('V9. portadas mixtas: la duración, los documentos y los ritmos incluyen a Primaria', () => {
    for (const portada of [combos.mixto.animada, combos.mixto.clasica]) {
      const texto = sinEtiquetas(portada)
      expect(texto).toContain('3, 6 o 9 meses')
      expect(texto).toContain('Primaria: Acta de Nacimiento, CURP, Identificación Oficial y Comprobante de Domicilio')
    }
    const animada = sinEtiquetas(combos.mixto.animada)
    expect(animada).toContain('En Primaria, el plan de 3 meses lleva 6 materias al mes')
    expect(animada).toContain('el plan de 9 meses lleva 2 materias al mes')
    expect(animada).toContain('En Secundaria y Preparatoria, el plan de')
  })

  test('V10. Solo-Primaria: portadas y legales sin autoridad ni validez, y con la nota de la constancia', () => {
    const p = combos.solo
    for (const portada of [p.animada, p.clasica]) {
      // Sin excepción: la nota nueva no nombra autoridad ni validez.
      expect(sinEtiquetas(portada)).not.toMatch(PROHIBIDO)
      expect(sinEtiquetas(portada)).toContain(NOTA)
    }
    for (const legal of [p.aviso, p.terminos]) {
      expect(sinEtiquetas(legal)).not.toMatch(/\bSEP\b|\bINEA\b|Secretar[ií]a de Educaci/)
    }
  })

  test('V11. el alumno de Primaria ve la lista de Primaria, no cae en la de Preparatoria', () => {
    const pri = sinEtiquetas(combos.mixto.documentosPrimaria)
    for (const doc of ['Acta de Nacimiento', 'CURP', 'Identificación Oficial', 'Comprobante de Domicilio']) expect(pri, doc).toContain(doc)
    expect(pri).not.toContain('Certificado de Secundaria')
    expect(pri).not.toContain('Certificado de Primaria')
    expect(sinEtiquetas(combos.mixto.documentosPreparatoria)).toContain('Certificado de Secundaria')
    expect(sinEtiquetas(combos.mixto.documentosPreparatoria)).not.toContain('Comprobante de Domicilio')
    expect(sinEtiquetas(combos.mixto.documentosSecundaria)).not.toContain('Comprobante de Domicilio')
  })

  test('V12. el filtro del panel ofrece el comprobante solo con el add-on', () => {
    expect(combos.mixto.adminDocumentos).toContain('Comprobante de Domicilio')
    expect(combos.solo.adminDocumentos).toContain('Comprobante de Domicilio')
    expect(combos.apagado.adminDocumentos).not.toContain('Comprobante de Domicilio')
  })

  test('V13. el aviso: la certificación de Primaria va aparte del artículo 37, con consentimiento y solo con cifra', () => {
    for (const c of ['mixto', 'solo']) {
      const aviso = combos[c].aviso
      const parrafo = aviso.indexOf('da su consentimiento')
      expect(parrafo, c).toBeGreaterThan(-1)
      expect(parrafo, c).toBeGreaterThan(aviso.indexOf('artículo 37'))
      expect(aviso.lastIndexOf('<p>', parrafo), c).toBeGreaterThan(aviso.lastIndexOf('<li>', parrafo))
      expect(sinEtiquetas(aviso), c).toContain('madre, padre o tutor la solicita')
    }
    expect(combos['sin-cifras'].aviso).not.toContain('da su consentimiento')
    expect(combos.apagado.aviso).not.toContain('da su consentimiento')
    expect(sinEtiquetas(combos.solo.aviso)).not.toContain('Certificación de Primaria.')
    expect(sinEtiquetas(combos.mixto.aviso)).toContain('Certificación de Primaria.')
    expect(combos.mixto.aviso).not.toContain('Instituciones con las que se gestione')
  })

})

// ─── Sin arnés ───────────────────────────────────────────────────────────────

test('D1. el mes de `duracion_meses` de cada plan sale del plan aprobado, en la migración y en los instaladores', () => {
  const casos: [string, RegExp][] = [
    ['supabase/migrations/20261104120000_nivel_primaria.sql', /WHEN ''(\d+_meses_pri)''::text THEN (\d+)/g],
    ['scripts/schema.sql', /WHEN '(\d+_meses_pri)'(?:::text)? THEN (\d+)/g],
    ['supabase/schema.sql', /WHEN '(\d+_meses_pri)'(?:::text)? THEN (\d+)/g],
  ]
  for (const [archivo, re] of casos) {
    const hallados = Object.fromEntries([...leer(archivo).matchAll(re)].map(m => [m[1], Number(m[2])]))
    const esperados = Object.fromEntries(Object.entries(PLAN.modalidades).map(([id, p]) => [id, p.meses]))
    expect(hallados, archivo).toEqual(esperados)
  }
})

test('D2. «hoy» es el de México, no el de UTC: un cumpleaños no se adelanta en la noche', () => {
  // 21:00 del 4 de noviembre en México son ya las 03:00 del 5 en UTC.
  const noche = new Date('2026-11-05T03:00:00Z')
  expect(hoyEnMexico(noche)).toBe('2026-11-04')
  expect(hoyEnMexico(new Date('2026-11-05T07:00:00Z'))).toBe('2026-11-05')
  // Cumple 12 mañana: hoy todavía no entra a Primaria.
  const tutor = { tutor_nombre: 'Rosa López', tutor_telefono: '3312345678', tutor_parentesco: 'Madre' }
  const fecha = `${2026 - EDAD_MINIMA_PRIMARIA}-11-05`
  expect(revisarEdadTutor({ ...tutor, fecha_nacimiento: fecha }, 'primaria', hoyEnMexico(noche)).ok).toBe(false)
  expect(revisarEdadTutor({ ...tutor, fecha_nacimiento: fecha }, 'primaria', hoyEnMexico(new Date('2026-11-05T07:00:00Z'))).ok).toBe(true)
})

test('D3. el seed abre las materias en el orden del plan: `orden` 25 a 42, una por lugar', () => {
  const seed = leer('scripts/seed-primaria.sql')
  const nombrePorCodigo = new Map(PLAN.materias.map(m => [m.codigo, m.nombre]))
  const filas = [...seed.matchAll(/INSERT INTO public\.materias \([^)]*\) VALUES \('[0-9a-f-]{36}', '((?:[^']|'')*)', '(?:[^']|'')*', 'primaria', (\d+),/g)]
    .map(m => ({ nombre: m[1].replace(/''/g, "'"), orden: Number(m[2]) }))
  expect(filas).toHaveLength(18)
  const porOrden = [...filas].sort((a, b) => a.orden - b.orden)
  expect(porOrden.map(f => f.orden)).toEqual(Array.from({ length: 18 }, (_, i) => 25 + i))
  expect(porOrden.map(f => f.nombre)).toEqual(PLAN.orden_apertura.map(c => nombrePorCodigo.get(c)))
})

test('D4. setup-primaria: siembra antes de las actividades, la auditoría al final, y no toca la materia demo', () => {
  const pri = leer('scripts/setup-primaria.sql')
  const pos = (s: string) => { const k = pri.indexOf(s); expect(k, s).toBeGreaterThan(-1); return k }
  expect(pos('IS DISTINCT FROM')).toBeLessThan(pos('\\i seed-primaria.sql'))
  expect(pos('\\i seed-primaria.sql')).toBeLessThan(pos('\\i seed-actividades-primaria.sql'))
  expect(pos('\\i seed-actividades-primaria.sql')).toBeLessThan(pos('\\i post-setup-primaria-check.sql'))
  // En un combo mixto, Sec y Prepa siguen viendo su Tutoría tal cual.
  expect(pri.replace(/^--.*$/gm, '')).not.toMatch(/\bUPDATE\b/i)
  expect(leer('scripts/post-setup-primaria-check.sql')).not.toContain("m.nivel = 'demo'")
})

test('D8. el mes del boletín en cada plan es la tabla de primaria/plan.json', () => {
  const tablas = (PLAN as unknown as { tablas_apertura: Record<string, string[][]> }).tablas_apertura
  const catalogo = PLAN.orden_apertura.map((codigo, i) => ({
    id: codigo, nombre: codigo, nivel: 'primaria', orden: 25 + i, numero_mes: Math.ceil((i + 1) / 2),
  }))
  for (const [id, plan] of Object.entries(PLAN.modalidades)) {
    const esperado = new Map(tablas[id].flatMap((fila, i) => fila.map(codigo => [codigo, i + 1] as const)))
    const alumno = { nivel: 'primaria', modalidad: id, duracion_meses: plan.meses, meses_desbloqueados: 1 }
    // Una acreditada del último lugar, con su mes de referencia: también sale con el del plan.
    const ultima = catalogo[17]
    const califs = [{ materia_id: ultima.id, acreditado: true, materia: { ...ultima } }]
    const filas = armarBoletin(alumno, catalogo, califs, new Set([ultima.id]), true)
    expect(filas, id).toHaveLength(18)
    for (const f of filas) expect(f.mes_numero, `${id} ${f.materia.id} ${f.estado}`).toBe(esperado.get(f.materia.id))
    expect(new Set(filas.map(f => f.mes_numero)).size, id).toBe(plan.meses)
    expect(new Set(filas.map(f => f.estado)), id).toEqual(new Set(['Acreditada', 'Pendiente', 'Bloqueada']))
  }
})

test('D9. Sec y Prepa conservan su `numero_mes`, aunque en un plan corto no sea el suyo', () => {
  const catalogo = [1, 2, 3, 4, 5, 6].map(n => ({ id: `P${n}`, nombre: `P${n}`, nivel: 'preparatoria', orden: n, numero_mes: n }))
  const filas = armarBoletin({ nivel: 'preparatoria', modalidad: '3_meses', duracion_meses: 3, meses_desbloqueados: 1 }, catalogo, [], new Set(), true)
  expect(filas.map(f => f.mes_numero)).toEqual([1, 2, 3, 4, 5, 6])
  // Y un alumno de otro nivel con una materia de Primaria en su historial, igual.
  const pri = { id: 'X', nombre: 'X', nivel: 'primaria', orden: 25, numero_mes: 7 }
  const sec = armarBoletin({ nivel: 'secundaria', modalidad: '3_meses', duracion_meses: 3, meses_desbloqueados: 1 }, [], [{ materia_id: 'X', acreditado: true, materia: pri }], new Set(['X']))
  expect(sec.map(f => f.mes_numero)).toEqual([7])
})

test('D10. re-correr setup.sql no pisa lecciones de Primaria: cada título que coincide está acotado', () => {
  const contenido = leer('scripts/seed-contenido-semanas.sql')
  const primaria = leer('scripts/seed-primaria.sql')
  const titulos = new Set([...primaria.matchAll(/VALUES \('[0-9a-f-]{36}', '[0-9a-f-]{36}', \d+, '((?:[^']|'')*)'/g)].map(m => m[1]))
  const materias = new Set([...primaria.matchAll(/INSERT INTO public\.materias \([^)]*\) VALUES \('[0-9a-f-]{36}', '((?:[^']|'')*)'/g)].map(m => m[1]))
  expect(titulos.size).toBeGreaterThan(100)
  expect(materias.size).toBe(18)
  const sentencias = [...contenido.matchAll(/WHERE titulo = '((?:[^']|'')*)'([^;]*);/g)]
  expect(sentencias.length).toBeGreaterThan(100)
  const coinciden = sentencias.filter(s => titulos.has(s[1]))
  expect(new Set(coinciden.map(s => s[1]))).toEqual(new Set(['Los derechos humanos', 'Repaso general y preparación para examen final']))
  for (const s of coinciden) {
    const deUnaMateria = /WHERE m\.nombre = '((?:[^']|'')*)'/.exec(s[2])?.[1]
    if (deUnaMateria !== undefined) {
      // Acotada a una materia de otro nivel: no llega a Primaria.
      expect(materias.has(deUnaMateria), `${s[1]} · ${deUnaMateria}`).toBe(false)
    } else {
      expect(s[2].replace(/\s+/g, ' '), s[1]).toContain("AND mes_id NOT IN (SELECT mc.id FROM meses_contenido mc JOIN materias m ON m.id = mc.materia_id WHERE m.nivel = 'primaria')")
    }
  }
})

test('D6. la migración lleva lock_timeout antes de tomar la primera tabla', () => {
  const sql = leer('supabase/migrations/20261104120000_nivel_primaria.sql').replace(/--.*$/gm, '')
  const candado = sql.indexOf("SET LOCAL lock_timeout = '10s';")
  expect(candado).toBeGreaterThan(sql.indexOf('BEGIN;'))
  expect(candado).toBeLessThan(sql.indexOf('ALTER TABLE'))
})

test('D7. la fila 26 de SETUP sigue dentro de la tabla de migraciones', () => {
  const lineas = leer('SETUP.md').split('\n')
  const i = lineas.findIndex(l => l.startsWith('   | 26 | `20261104120000_nivel_primaria.sql`'))
  expect(i).toBeGreaterThan(0)
  expect(lineas[i - 1]).toMatch(/^ {3}\| 25 \| /)
})

// ─── La materia demo ─────────────────────────────────────────────────────────

type Via = { status: number; error: string | null }
type VistaDemo = Record<string, Via> & {
  catalogo: string[]; lista: string[]; disponibles: string[]; boletin: string[]; constancia: string[]
  meses: { demo: boolean; materia_demo_id?: string | null; total?: number; abiertos?: number; nombres?: string[] }
  tablero: string; misMaterias: string; mensajesDeLaMateria: string[] | null
  boletinMeses: [string, number, string][]; constanciaFilas: [string, number, string][]
  calificaciones: string; constanciaPagina: string
}
/** Todas las vías por las que un alumno llegaría a la materia demo o a una tutoría ajena. */
const VIAS = ['materiaDemo', 'materiaTutoriaPrepa', 'glosarioDemo', 'quizVer', 'quizEnviar', 'examenVer', 'examenEnviar', 'marcarSemana', 'tiempoSemana', 'material']
const TUTORIA = /Tutor[ií]a|TUT101|modo demo|Explorar demo|bachillerato/i

test.describe('la materia demo: Primaria no la ve; Sec y Prepa, igual que hoy', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 })
  test.skip(!nodeSirve, 'el arnés necesita Node 23.6 o mayor')
  let d: Record<'mixto' | 'apagado', Record<string, VistaDemo>>
  test.beforeAll(() => { d = correrArnes('primaria-demo.mjs') })

  test('T1. Primaria no entra por ninguna vía: 403, con el mismo mensaje que una materia ajena', () => {
    for (const combo of ['mixto', 'apagado'] as const) {
      for (const alumno of ['primariaSinPagar', 'primariaPagada', 'primariaConDemo']) {
        const v = d[combo][alumno]
        for (const via of VIAS) expect(v[via].status, `${combo} ${alumno} ${via}`).toBe(403)
        expect(v.materiaAjena.status).toBe(403)
        expect(v.materiaDemo.error, `${combo} ${alumno}`).toBe(v.materiaAjena.error)
        expect(v.materiaDemo.error).toBe('Esta materia no corresponde a tu nivel')
      }
    }
  })

  test('T2. Primaria no la lista: ni catálogo, ni Mis Materias, ni tablero, ni boletín, ni constancia', () => {
    for (const combo of ['mixto', 'apagado'] as const) {
      for (const alumno of ['primariaSinPagar', 'primariaPagada', 'primariaConDemo']) {
        const v = d[combo][alumno]
        expect(v.catalogo, `${combo} ${alumno}`).toHaveLength(18)
        expect(v.lista, `${combo} ${alumno}`).toHaveLength(18)
        for (const lista of [v.catalogo, v.lista, v.disponibles, v.boletin, v.constancia, v.meses.nombres ?? []]) {
          expect(lista.join(' '), `${combo} ${alumno}`).not.toMatch(/Tutor/)
        }
        expect(v.meses.demo, `${combo} ${alumno}`).toBe(false)
        expect(sinEtiquetas(v.tablero), `${combo} ${alumno}`).not.toMatch(TUTORIA)
        expect(sinEtiquetas(v.misMaterias), `${combo} ${alumno}`).not.toMatch(TUTORIA)
      }
    }
  })

  test('T3. Primaria sin pagar: el aviso de pago normal y sus meses con candado, sin vacíos', () => {
    for (const combo of ['mixto', 'apagado'] as const) {
      const v = d[combo].primariaSinPagar
      const tablero = sinEtiquetas(v.tablero)
      expect(tablero).toContain('Inscripción pendiente de pago')
      expect(tablero).toContain('Meses del programa')
      expect(tablero).toContain('6 materias')
      expect(v.meses).toMatchObject({ demo: false, total: 3, abiertos: 0 })
      expect(v.meses.nombres).toHaveLength(18)
      expect(v.disponibles).toEqual([])
      // Mis Materias enseña las 18, ninguna abierta.
      const mias = sinEtiquetas(v.misMaterias)
      expect(mias).toContain('Lectura y comprensión I')
      expect(mias).toContain('Primaria 18')
    }
  })

  test('T4. Primaria que ya pagó: su primera materia abierta, sin aviso de pago', () => {
    const v = d.mixto.primariaPagada
    expect(sinEtiquetas(v.tablero)).not.toContain('Inscripción pendiente de pago')
    expect(sinEtiquetas(v.tablero)).toContain('Continuar estudiando')
    expect(v.disponibles).toHaveLength(6)
    expect(v.meses).toMatchObject({ demo: false, total: 3, abiertos: 1 })
  })

  test('T5. Sec y Prepa en un combo mixto la ven y entran, igual que con el add-on apagado', () => {
    for (const alumno of ['secundariaSinPagar', 'secundariaPagada', 'preparatoriaSinPagar']) {
      expect(d.mixto[alumno], alumno).toEqual(d.apagado[alumno])
      const v = d.mixto[alumno]
      for (const via of VIAS) expect(v[via].status, `${alumno} ${via}`).not.toBe(403)
      expect(v.materiaDemo.status).toBe(200)
      expect(v.quizVer.status).toBe(200)
      expect(v.examenVer.status).toBe(200)
      expect(v.material.status).toBe(302)
      expect(v.catalogo).toContain('Tutoría de Ingreso I')
    }
  })

  test('T5b. el mensaje al terminar una semana depende del nivel del alumno, no del combo', () => {
    for (const combo of ['mixto', 'apagado'] as const) {
      const pri = d[combo].primariaPagada.mensajesDeLaMateria
      expect(pri?.length, combo).toBeGreaterThan(0)
      expect((pri ?? []).join(' '), combo).not.toMatch(/certific/i)
      for (const alumno of ['secundariaPagada', 'preparatoriaPagada']) {
        expect(d[combo][alumno].mensajesDeLaMateria, `${combo} ${alumno}`).toContain('Un paso más cerca de tu certificado.')
      }
    }
  })

  test('T7. boletín y constancia dicen el mes del plan del alumno, no el de referencia', () => {
    const nombre = (i: number) => (i === 0 ? 'Lectura y comprensión I' : `Primaria ${i + 1}`)
    for (const [alumno, porMes] of [['primariaPagada', 6], ['primaria6Meses', 3], ['primaria9Meses', 2]] as const) {
      const v = d.mixto[alumno]
      expect(v.boletinMeses, alumno).toHaveLength(18)
      expect(v.boletinMeses.map(f => [f[0], f[1]]), alumno).toEqual(Array.from({ length: 18 }, (_, i) => [nombre(i), Math.ceil((i + 1) / porMes)]))
    }
    // Acreditada, pendiente y bloqueada: las tres con el mismo cálculo.
    const seis = d.mixto.primaria6Meses
    expect(seis.boletinMeses[0]).toEqual(['Lectura y comprensión I', 1, 'Acreditada'])
    expect(seis.boletinMeses[7]).toEqual(['Primaria 8', 3, 'Acreditada'])
    expect(seis.boletinMeses[1]).toEqual(['Primaria 2', 1, 'Pendiente'])
    expect(seis.boletinMeses[17]).toEqual(['Primaria 18', 6, 'Bloqueada'])
    // La constancia, en la columna y en el código.
    expect(seis.constanciaFilas).toEqual([
      ['Lectura y comprensión I', 1, 'PRIM-M1-01'],
      ['Primaria 2', 1, 'PRIM-M1-02'],
      ['Primaria 3', 1, 'PRIM-M1-03'],
      ['Primaria 8', 3, 'PRIM-M3-01'],
    ])
    // El add-on apagado no le mueve el mes a quien ya está inscrito.
    expect(d.apagado.primaria6Meses.boletinMeses).toEqual(seis.boletinMeses)
    // Sec y Prepa conservan su `numero_mes`: en el arnés, todas en el 1.
    for (const alumno of ['secundariaPagada', 'preparatoriaPagada']) {
      for (const fila of d.mixto[alumno].boletinMeses) expect(fila[1], `${alumno} ${fila[0]}`).toBe(1)
    }
  })

  test('T8. el boletín y la constancia dicen «Primaria» en el encabezado, solo a su alumno', () => {
    /** Lo que va entre el título y la bajada del boletín. */
    const encabezado = (h: string) => {
      const t = sinEtiquetas(h)
      const i = t.indexOf('Mis Calificaciones') + 'Mis Calificaciones'.length
      return t.slice(i, t.indexOf('Estado de acreditación por materia')).trim()
    }
    for (const combo of ['mixto', 'apagado'] as const) {
      expect(encabezado(d[combo].primaria6Meses.calificaciones), combo).toBe('Primaria')
      expect(sinEtiquetas(d[combo].primaria6Meses.constanciaPagina), combo).toMatch(/\bPrimaria\b/)
      for (const alumno of ['secundariaPagada', 'preparatoriaPagada']) {
        expect(encabezado(d[combo][alumno].calificaciones), `${combo} ${alumno}`).toBe('')
        expect(sinEtiquetas(d[combo][alumno].constanciaPagina), `${combo} ${alumno}`).not.toMatch(/\bPrimaria\b/)
      }
    }
    expect(sinEtiquetas(d.mixto.secundariaPagada.constanciaPagina)).toContain('Secundaria')
  })

  test('T6. Sec y Prepa sin pagar siguen en modo demo, con su banner y su enlace', () => {
    for (const combo of ['mixto', 'apagado'] as const) {
      for (const alumno of ['secundariaSinPagar', 'preparatoriaSinPagar']) {
        const v = d[combo][alumno]
        expect(v.meses).toEqual({ demo: true, materia_demo_id: 'f0551b82-1c3e-4286-bfb4-878842bc6eff' })
        expect(v.lista).toContain('Tutoría de Ingreso I')
        const tablero = sinEtiquetas(v.tablero)
        expect(tablero).toContain('Estás en modo demo')
        expect(tablero).toContain('Explorar demo')
        expect(tablero).not.toContain('Inscripción pendiente de pago')
      }
    }
    // Pagado, la demo deja de listarse pero sigue abierta: lo de siempre.
    expect(d.apagado.secundariaPagada.lista).not.toContain('Tutoría de Ingreso I')
    expect(d.apagado.secundariaPagada.materiaDemo.status).toBe(200)
  })
})

// ─── Combo mixto: la regla del mapa ──────────────────────────────────────────

const clon = (cambios: object) => JSON.parse(JSON.stringify({ ...CONFIG, ...cambios })) as BaseSiteConfig
const PRI_ON = { ...(CONFIG as unknown as { primaria: object }).primaria, activa: true }

test('X1. cada texto del mapa mixto es el de fábrica de hoy: si config.ts cambia, esto avisa', () => {
  const fabrica = JSON.stringify(CONFIG.landing) + JSON.stringify(CONFIG.tagline)
  for (const original of Object.keys(textosMixtoPrimaria(['secundaria', 'preparatoria']))) {
    expect(fabrica.includes(JSON.stringify(original).slice(1, -1)), original).toBe(true)
  }
})

test('X2. mixto: solo cambia el texto de fábrica exacto; lo que el cliente editó se respeta', () => {
  const propio = 'Con el certificado de nuestra escuela, SEP incluida.'
  const mixto = () => clon({ niveles: ['primaria', 'secundaria', 'preparatoria'], primaria: PRI_ON })
  expect(mergeSiteConfig(mixto(), { landing: { hero_subtitulo: propio } }).landing.hero_subtitulo).toBe(propio)
  expect(mergeSiteConfig(mixto(), {}).landing.hero_subtitulo).toContain('certificado SEP en Secundaria y Preparatoria.')
  expect(mergeSiteConfig(mixto(), {}).landing.contadores[0]).toMatchObject({ valor: 3, sub: 'Pri · Sec · Prepa' })
  expect(mergeSiteConfig(clon({ niveles: ['primaria', 'preparatoria'], primaria: PRI_ON }), {}).landing.contadores[0]).toMatchObject({ valor: 2, sub: 'Pri · Prepa' })
})

test('X3. apagado: el mismo objeto, sin escribir nada, aunque `niveles` venga vacío', () => {
  const apagada = clon({})
  const copia = JSON.stringify(apagada)
  expect(aplicarLandingMixtoPrimaria(apagada)).toBe(apagada)
  expect(JSON.stringify(apagada)).toBe(copia)
  expect(ofertaMixtaPrimaria(apagada)).toBe(false)
  const validez = CONFIG.landing.validezOficial
  expect(validezDeLaOferta(CONFIG, validez)).toBe(validez)
  expect(getDuracionOferta()).toBe('3 o 6 meses')
  // Solo Primaria no es mixto: tiene su propia regla.
  expect(ofertaMixtaPrimaria({ niveles: ['primaria'], primaria: PRI_ON })).toBe(false)
})

test('X5. todo lo que las portadas ponen de fábrica cabe en el editor: guardar otra fila no da 400', () => {
  const EDITABLES = CAMPOS.map(c => c.clave).filter(c => c.startsWith('landing.')).map(c => c.slice('landing.'.length))
  const COMBOS: { niveles: string[]; mapa?: Readonly<Record<string, string>> }[] = [
    { niveles: ['primaria', 'secundaria', 'preparatoria'], mapa: textosMixtoPrimaria(['secundaria', 'preparatoria']) },
    { niveles: ['primaria', 'secundaria'], mapa: textosMixtoPrimaria(['secundaria']) },
    { niveles: ['primaria', 'preparatoria'], mapa: textosMixtoPrimaria(['preparatoria']) },
    { niveles: ['primaria'], mapa: TEXTOS_SOLO_PRIMARIA },
  ]
  for (const { niveles, mapa } of COMBOS) {
    const base = mergeSiteConfig(clon({ niveles, primaria: PRI_ON }), {})
    const landing = base.landing as unknown as Record<string, unknown>
    // Cada texto del mapa está en lo que se va a validar: no se escapa ninguno.
    const todo = JSON.stringify(landing) + JSON.stringify(base.tagline)
    for (const texto of Object.values(mapa ?? {})) expect(todo.includes(JSON.stringify(texto).slice(1, -1)), texto).toBe(true)
    for (const campo of EDITABLES) {
      const valor = landing[campo]
      if (valor === undefined || valor === '') continue
      const r = validarOverrides({ landing: { [campo]: valor } }, base)
      expect(r.ok, `${niveles.join('+')} ${campo}: ${JSON.stringify(r)}`).toBe(true)
    }
    expect(validarOverrides({ tagline: base.tagline }, base).ok, niveles.join('+')).toBe(true)
    // El caso real: edita otra fila de «Con» y guarda la lista entera.
    const con = [...(landing.transformacion_con as string[])]
    con[1] = 'Otro texto del cliente.'
    expect(validarOverrides({ landing: { transformacion_con: con } }, base).ok, niveles.join('+')).toBe(true)
  }
})

test('X4. la validez de una portada mixta dice de qué niveles es', () => {
  const v = validezDeLaOferta({ niveles: ['primaria', 'secundaria', 'preparatoria'], primaria: PRI_ON }, CONFIG.landing.validezOficial)
  expect(v.titulo).toBe('Tu certificado de Secundaria y Preparatoria vale en México y USA')
  expect(v.subtitulo).toBe('Al terminar Secundaria o Preparatoria recibes DOS documentos oficiales')
})

// ─── Documento de entrega ────────────────────────────────────────────────────

test('E1. el PDF y el WhatsApp de entrega no anuncian validez en un combo solo Primaria', () => {
  expect(soloPrimariaEntrega({ niveles: ['primaria'], primaria: { activa: true } })).toBe(true)
  expect(soloPrimariaEntrega({ niveles: ['primaria', 'secundaria'], primaria: { activa: true } })).toBe(false)
  // Sin Primaria, la regla de siempre, aunque `niveles` venga vacío (solo cursos).
  expect(soloPrimariaEntrega({ niveles: [], primaria: { activa: false } })).toBe(false)
  expect(soloPrimariaEntrega({ niveles: ['secundaria'] })).toBe(false)
  expect(leer('scripts/entrega/generar-entrega.mjs')).toContain('const VALIDEZ = D.validez !== false && CERTIFICA && !soloPrimariaEntrega(CONFIG)')
})
