import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { interpolar, PLACEHOLDERS } from '@/lib/site-config-core'
import { textoInscripcion } from '@/lib/precios-ui'
import {
  COMODINES_LICENCIATURA, resolverTextosLicenciaturas, usaInscripcionGeneral, varsLicenciatura,
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
  expect(varsLicenciatura(PLANES, fmt)).toEqual({ inscripcionLicenciatura: fmt(1800), titulacion: fmt(38000) })
  // Sin cobro: el mismo «sin costo» que {inscripcion}.
  expect(varsLicenciatura([{ inscripcion: 0, titulacion: 0 }], fmt)).toEqual({ inscripcionLicenciatura: 'sin costo', titulacion: 'sin costo' })
  // Sin planes no hay valores (la sección tampoco se pinta).
  expect(varsLicenciatura([], fmt)).toEqual({})
})

test('#195 · en la sección, {inscripcion} sigue siendo la general y los nuevos dan la de licenciatura', () => {
  const vars = { ...VARS_PAGINA, ...varsLicenciatura(PLANES, fmt) }
  const t = resolverTextosLicenciaturas(AUTO, {
    licenciaturas_subtitulo: 'Sec/Prepa {inscripcion} · Lic {inscripcionLicenciatura} · Titulación {titulacion}',
    licenciaturas_pasos: [{ titulo: '', desc: 'Inscripción única de {inscripcionLicenciatura}.' }],
    licenciaturas_carreras: [{ slug: 'derecho', nombre: '', desc: 'Titúlate por {titulacion}.' }],
  }, (s) => interpolar(s, vars))
  expect(t.bajada).toBe(`Sec/Prepa ${fmt(650)} · Lic ${fmt(1800)} · Titulación ${fmt(38000)}`)
  expect(t.pasos[0].desc).toBe(`Inscripción única de ${fmt(1800)}.`)
  expect(t.carreras.derecho.desc).toBe(`Titúlate por ${fmt(38000)}.`)
})

test('#195 · no son globales: fuera de la sección se quedan literales', () => {
  for (const c of COMODINES_LICENCIATURA) expect(PLACEHOLDERS as readonly string[]).not.toContain(c)
  expect(interpolar('Lic {inscripcionLicenciatura} · {titulacion}', VARS_PAGINA)).toBe('Lic {inscripcionLicenciatura} · {titulacion}')
})

test('#195 · la landing animada interpola la sección con sus comodines y la tabla efectiva', () => {
  const src = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(src).toContain('const varsLic = { ...vars, ...varsLicenciatura(planesLic, (monto) => textoInscripcion(monto, { minusculas: true })) }')
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
