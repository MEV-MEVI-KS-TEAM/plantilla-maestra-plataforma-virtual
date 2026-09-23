import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { interpolar, mergeSiteConfig, PLACEHOLDERS } from '@/lib/site-config-core'
import { inscripcionesIguales, varsInscripcionPorNivel } from '@/lib/precios-nivel'
import { escribirRuta, inscripcionesDeBorrador } from '@/lib/site-config-editor'
import { recortarAEditables } from '@/lib/site-config-validacion'
import { inscripcionEnLanding, textoInscripcion } from '@/lib/precios-ui'
import { etiquetaNivel } from '@/lib/niveles-ui'

/**
 * F2-5 — los comodines {inscripcionSecundaria} y {inscripcionPreparatoria}.
 *
 * Lo que protegen estas pruebas: que con las claves por nivel VACÍAS los
 * comodines valgan exactamente lo mismo que {inscripcion} (la flota no cambia),
 * que con claves cada nivel salga con la suya, y que los TRES sitios que
 * interpolan (LandingClient, LandingAnimada y VistaPrevia) los sustituyan: un
 * comodín sin `vars` en uno de ellos saldría literal en la página.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const fmt = (n: number) => `$${n}`

test('1. sin claves por nivel, los dos comodines valen lo mismo que {inscripcion}', () => {
  for (const p of [{ inscripcion: 599 }, { inscripcion: 0 }, { inscripcion: 599, inscripcionSecundaria: null, inscripcionPreparatoria: null }]) {
    const vars = { inscripcion: fmt(Number(p.inscripcion)), ...varsInscripcionPorNivel(p, fmt) }
    expect(vars.inscripcionSecundaria).toBe(vars.inscripcion)
    expect(vars.inscripcionPreparatoria).toBe(vars.inscripcion)
    expect(inscripcionesIguales(['secundaria', 'preparatoria'], p)).toBe(true)
  }
  // Con el formato de la landing animada ("sin costo" en minúsculas, a media frase).
  const animada = (n: number) => textoInscripcion(n, { minusculas: true })
  expect(varsInscripcionPorNivel({ inscripcion: 0 }, animada).inscripcionSecundaria).toBe(animada(0))
})

test('2. con claves, cada nivel sale con la suya y se detecta que difieren', () => {
  const p = { inscripcion: 599, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500 }
  expect(varsInscripcionPorNivel(p, fmt)).toEqual({ inscripcionSecundaria: '$1000', inscripcionPreparatoria: '$1500' })
  expect(inscripcionesIguales(['secundaria', 'preparatoria'], p)).toBe(false)
  // Un solo nivel vendido, o los dos con la misma cifra: iguales.
  expect(inscripcionesIguales(['secundaria'], p)).toBe(true)
  expect(inscripcionesIguales(['secundaria', 'preparatoria'], { ...p, inscripcionPreparatoria: 1000 })).toBe(true)
  // Solo uno con la suya: el otro paga la general, así que difieren.
  expect(inscripcionesIguales(['secundaria', 'preparatoria'], { inscripcion: 599, inscripcionSecundaria: 1000 })).toBe(false)
})

test('3. los comodines nuevos están en la lista cerrada y `interpolar` los sustituye', () => {
  expect(PLACEHOLDERS).toContain('inscripcionSecundaria')
  expect(PLACEHOLDERS).toContain('inscripcionPreparatoria')
  const vars = { inscripcion: '$599', ...varsInscripcionPorNivel({ inscripcion: 599, inscripcionSecundaria: 1000 }, fmt) }
  expect(interpolar('Sec {inscripcionSecundaria} · Prepa {inscripcionPreparatoria} · general {inscripcion}', vars))
    .toBe('Sec $1000 · Prepa $599 · general $599')
})

test('4. la vista previa calcula sobre el BORRADOR, con la misma regla que la landing', () => {
  // Premisa «sin claves por nivel», puesta a mano: un clon sembrado por el
  // Frente B ya las trae con cifra en su config.ts. Aquí se mide la regla.
  const fabrica = recortarAEditables(mergeSiteConfig(CONFIG, {}))
  const defaults = { ...fabrica, precios: { ...fabrica.precios, inscripcionSecundaria: null, inscripcionPreparatoria: null } }
  const general = Number(CONFIG.precios.inscripcion) || 0
  // Sin claves: las tres valen lo mismo (la general), como antes de la Fase 2.
  expect(inscripcionesDeBorrador(defaults, {})).toEqual({
    inscripcion: general, inscripcionSecundaria: general, inscripcionPreparatoria: general,
  })
  // Con la clave de secundaria en el borrador, solo cambia secundaria.
  const borrador = escribirRuta({}, 'precios.inscripcionSecundaria', 1234)
  expect(inscripcionesDeBorrador(defaults, borrador)).toEqual({
    inscripcion: general, inscripcionSecundaria: 1234, inscripcionPreparatoria: general,
  })
  // Y al mover la general, el nivel sin clave la sigue.
  const otraGeneral = escribirRuta(borrador, 'precios.inscripcion', 800)
  expect(inscripcionesDeBorrador(defaults, otraGeneral).inscripcionPreparatoria).toBe(800)
})

test('5. los TRES sitios que interpolan cubren TODOS los comodines (lo exige el compilador)', () => {
  // `satisfies Record<Placeholder, string>`: un comodín nuevo en PLACEHOLDERS
  // sin su valor en uno de los tres `vars` ya no compila, en vez de salir
  // literal en la página (el riesgo de §10 fila 5 del diseño).
  const sitios = [
    'src/components/landing/LandingClient.tsx',
    'src/components/landing/animada/LandingAnimada.tsx',
    'src/components/admin/personalizar/VistaPrevia.tsx',
  ]
  for (const sitio of sitios) {
    const fuente = leer(sitio)
    expect(fuente, sitio).toContain('} satisfies Record<Placeholder, string>')
    expect(fuente, sitio).toContain('...varsInscripcionPorNivel(')
  }
  expect(leer('src/app/(dashboard)/admin/configuracion/page.tsx')).toContain('...inscripcionesDeBorrador(defaults, overrides)')
})

const SUBTITULO_FABRICA = 'Inscripción única {inscripcion} · Elige tu nivel y plan'
const t = (n: number) => textoInscripcion(n, { minusculas: true })
const AMBOS = ['secundaria', 'preparatoria']

test('6. sin claves por nivel, la landing animada dice lo mismo que antes', () => {
  for (const general of [599, 0, 1500]) {
    const ins = inscripcionEnLanding(AMBOS, { inscripcion: general, inscripcionSecundaria: null })
    expect(ins.comun).toBe(true)
    expect(ins.montoComun).toBe(general)
    // Lo que antes era `textoInscripcion(precios.inscripcion)`.
    expect(ins.textoComun).toBe(t(general))
    expect(ins.textoDe('secundaria')).toBe(t(general))
    // El subtítulo de fábrica se sigue pintando.
    expect(ins.subtituloVale(SUBTITULO_FABRICA)).toBe(true)
  }
})

test('7. inscripciones distintas: una frase por nivel y sin «Inscripción única»', () => {
  const ins = inscripcionEnLanding(AMBOS, { inscripcion: 599, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500 })
  expect(ins.comun).toBe(false)
  expect(ins.textoPorNivel).toBe(`de ${t(1000)} en ${etiquetaNivel('secundaria')} y de ${t(1500)} en ${etiquetaNivel('preparatoria')}`)
  expect(ins.subtituloVale(SUBTITULO_FABRICA)).toBe(false)
  // Un subtítulo propio que no afirma UNA inscripción se respeta, también el
  // que usa los comodines por nivel que la ayuda del campo ofrece.
  expect(ins.subtituloVale('Secundaria {inscripcionSecundaria} · Prepa {inscripcionPreparatoria}')).toBe(true)
  expect(ins.subtituloVale('Elige tu nivel y plan')).toBe(true)
  expect(ins.subtituloVale(undefined)).toBe(true)
})

test('8. iguales entre sí pero distintos de la general: tampoco «Inscripción única $general»', () => {
  // {inscripcion} es la GENERAL: con los dos niveles en 1,500 y la general en
  // 599, el subtítulo de fábrica diría «$599» junto a tarjetas de «$1,500».
  const ins = inscripcionEnLanding(AMBOS, { inscripcion: 599, inscripcionSecundaria: 1500, inscripcionPreparatoria: 1500 })
  expect(ins.comun).toBe(true)
  expect(ins.montoComun).toBe(1500)
  expect(ins.textoComun).toBe(t(1500))
  expect(ins.subtituloVale(SUBTITULO_FABRICA)).toBe(false)
  // Escuela de un solo nivel con su propia cifra: lo mismo.
  const sola = inscripcionEnLanding(['preparatoria'], { inscripcion: 599, inscripcionPreparatoria: 1500 })
  expect(sola.comun).toBe(true)
  expect(sola.subtituloVale(SUBTITULO_FABRICA)).toBe(false)
})

test('9. un nivel sin costo no sale como «de sin costo»', () => {
  const ins = inscripcionEnLanding(AMBOS, { inscripcion: 0, inscripcionPreparatoria: 1500 })
  expect(ins.comun).toBe(false)
  expect(ins.textoPorNivel).toBe(`${t(0)} en ${etiquetaNivel('secundaria')} y de ${t(1500)} en ${etiquetaNivel('preparatoria')}`)
  expect(ins.textoPorNivel).not.toContain('de sin costo')
})

test('10. la landing animada usa el helper en la tarjeta, la FAQ y la bajada', () => {
  // La conducta la miden 6-9; esto solo ata el componente al helper (Playwright
  // no puede renderizar el componente en una prueba unitaria).
  const fuente = leer('src/components/landing/animada/LandingAnimada.tsx')
  expect(fuente).toContain('const ins = inscripcionEnLanding(niveles, precios)')
  expect(fuente).toContain('+ inscripción {ins.textoDe(nivel)}')
  expect(fuente).toContain('bajada={mismoTotalPorNivel && ins.subtituloVale(L.programas_subtitulo)')
  expect(fuente).toContain("(ins.comun ? '' : `La inscripción es ${ins.textoPorNivel}. `)")
  expect(fuente).toContain('ins.comun && ins.montoComun > 0 ?')
})
