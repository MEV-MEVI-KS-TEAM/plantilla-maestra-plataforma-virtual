import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { interpolar, PLACEHOLDERS } from '@/lib/site-config-core'
import { textoInscripcion } from '@/lib/precios-ui'
import { CONFIG } from '@/lib/config'
import { formatearMoneda } from '@/lib/moneda'
import {
  COMODINES_LICENCIATURA, resolverTextosLicenciaturas, usaComodinLicenciaturaFuera, usaInscripcionGeneral, varsLicenciatura,
  type TextosLicenciaturas,
} from '@/components/landing/animada/textos-licenciatura'

/**
 * Bloque D · D7 — #195: en los textos de la sección de licenciaturas
 * `{inscripcion}` pintaba la inscripción de Secundaria/Preparatoria y no había
 * comodín para la de licenciatura ni para la titulación. Ahora hay dos comodines
 * DE SECCIÓN, con la tabla efectiva; `{inscripcion}` sigue siendo la general.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const fmt = (n: number) => textoInscripcion(n, { minusculas: true })
// Las cifras de la sección (la tarjeta del costo): «$0», nunca «sin costo».
const dinero = (n: number) => formatearMoneda(n, CONFIG)

// La QA del Bloque B: licenciatura en 1800 y Sec/Prepa en 650, titulación 38000.
const PLANES = [{ inscripcion: 1800, titulacion: 38000 }, { inscripcion: 1800, titulacion: 38000 }]
const VARS_PAGINA = { duracion: '3 o 6 meses', nombre: 'X', nombreCompleto: 'X', whatsapp: '', inscripcion: fmt(650),
  inscripcionSecundaria: fmt(650), inscripcionPreparatoria: fmt(650) }
const AUTO: TextosLicenciaturas = {
  kicker: 'Nivel superior', titulo: 'Licenciaturas', bajada: 'auto',
  pasos: [{ titulo: 'Inscríbete', desc: 'auto' }, { titulo: 'b', desc: 'b' }, { titulo: 'c', desc: 'c' }, { titulo: 'd', desc: 'd' }],
  carreras: { derecho: { nombre: 'Derecho', desc: 'auto' } },
}

test('#195 · los comodines de sección valen la inscripción y la titulación de licenciatura', () => {
  expect(COMODINES_LICENCIATURA).toEqual(['inscripcionLicenciatura', 'titulacion'])
  expect(varsLicenciatura(PLANES, fmt, dinero)).toEqual({ inscripcionLicenciatura: fmt(1800), titulacion: dinero(38000) })
  // Sin cobro: la inscripción dice «sin costo» como {inscripcion}; la titulación, la
  // cifra de la sección («$0»): el comodín no anuncia una titulación gratis.
  expect(varsLicenciatura([{ inscripcion: 0, titulacion: 0 }], fmt, dinero)).toEqual({ inscripcionLicenciatura: 'sin costo', titulacion: dinero(0) })
  expect(dinero(0)).not.toBe('sin costo')
  // Sin planes no hay valores (la sección tampoco se pinta).
  expect(varsLicenciatura([], fmt)).toEqual({})
})

test('#195 · en la sección, {inscripcion} sigue siendo la general y los nuevos dan la de licenciatura', () => {
  const vars = { ...VARS_PAGINA, ...varsLicenciatura(PLANES, fmt, dinero) }
  const t = resolverTextosLicenciaturas(AUTO, {
    licenciaturas_subtitulo: 'Sec/Prepa {inscripcion} · Lic {inscripcionLicenciatura} · Titulación {titulacion}',
    licenciaturas_pasos: [{ titulo: '', desc: 'Inscripción única de {inscripcionLicenciatura}.' }],
    licenciaturas_carreras: [{ slug: 'derecho', nombre: '', desc: 'Titúlate por {titulacion}.' }],
  }, (s) => interpolar(s, vars))
  expect(t.bajada).toBe(`Sec/Prepa ${fmt(650)} · Lic ${fmt(1800)} · Titulación ${dinero(38000)}`)
  expect(t.pasos[0].desc).toBe(`Inscripción única de ${fmt(1800)}.`)
  expect(t.carreras.derecho.desc).toBe(`Titúlate por ${dinero(38000)}.`)
})

test('#195 · no son globales: fuera de la sección se quedan literales', () => {
  for (const c of COMODINES_LICENCIATURA) expect(PLACEHOLDERS as readonly string[]).not.toContain(c)
  expect(interpolar('Lic {inscripcionLicenciatura} · {titulacion}', VARS_PAGINA)).toBe('Lic {inscripcionLicenciatura} · {titulacion}')
})

test('#195 · la landing animada interpola la sección con sus comodines y la tabla efectiva', () => {
  const src = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(src).toContain('const varsLic = { ...vars, ...varsLicenciatura(planesLic, (monto) => textoInscripcion(monto, { minusculas: true }), dinero) }')
  expect(src).toContain('const planesLic = getDesglosesLicenciatura(config.licenciaturas)')
  expect(src).toMatch(/resolverTextosLicenciaturas\(\s*textosAutoLicenciaturas\(carrerasLic, planesLic, getEtiquetaLicenciatura\(\), dinero\),\s*config\.landing as unknown as OverridesLicenciaturasLanding,\s*\(s\) => interpolar\(s, varsLic\),\s*\)/)
})

test('#195 · el editor avisa si un texto de licenciatura usa {inscripcion}', () => {
  expect(usaInscripcionGeneral({})).toBe(false)
  expect(usaInscripcionGeneral(null)).toBe(false)
  expect(usaInscripcionGeneral({ licenciaturas_kicker: 'Desde {inscripcion}' })).toBe(true)
  expect(usaInscripcionGeneral({ licenciaturas_pasos: [{ titulo: '', desc: 'Inscripción de {inscripcion}' }] })).toBe(true)
  expect(usaInscripcionGeneral({ licenciaturas_carreras: [{ slug: 'x', nombre: '', desc: '{inscripcion}' }] })).toBe(true)
  // El comodín bueno no dispara el aviso.
  expect(usaInscripcionGeneral({ licenciaturas_subtitulo: 'Inscripción de {inscripcionLicenciatura}' })).toBe(false)
  const pestana = sinComentarios(leer('src/components/admin/personalizar/PestanaTextos.tsx'))
  expect(pestana).toContain("{grupo.id === 'licenciaturas' && <ComodinesLicenciatura defaults={defaults} overrides={overrides} />}")
  const tarjeta = sinComentarios(leer('src/components/admin/personalizar/TextosLicenciaturas.tsx'))
  // El aviso mira el texto EFECTIVO (config.ts + borrador), no solo lo escrito en el panel.
  expect(tarjeta).toContain('const efectivo = (k: string) => valorEfectivo(defaults, overrides, `landing.${k}`)')
  expect(tarjeta).toContain('usaInscripcionGeneral(landing)')
  expect(tarjeta).toContain("{'{inscripcionLicenciatura}'}")
  expect(tarjeta).toContain("{'{titulacion}'}")
})

test('#195 · el editor avisa si los comodines de licenciatura se usan FUERA de su sección', () => {
  expect(usaComodinLicenciaturaFuera(null)).toBe(false)
  expect(usaComodinLicenciaturaFuera({ licenciaturas_subtitulo: '{titulacion}' })).toBe(false)
  expect(usaComodinLicenciaturaFuera({ hero_subtitulo: 'Desde {inscripcionLicenciatura}' })).toBe(true)
  expect(usaComodinLicenciaturaFuera({ faq_items: [{ q: '¿Cuánto?', a: 'La titulación cuesta {titulacion}' }] })).toBe(true)
  // {inscripcion} y los de nivel sí valen en toda la página.
  expect(usaComodinLicenciaturaFuera({ hero_subtitulo: '{inscripcion} · {inscripcionSecundaria}' })).toBe(false)
  const pestana = sinComentarios(leer('src/components/admin/personalizar/PestanaTextos.tsx'))
  expect(pestana).toContain('const comodinLicFuera = usaComodinLicenciaturaFuera(')
  expect(pestana).toContain('{comodinLicFuera && (')
})
