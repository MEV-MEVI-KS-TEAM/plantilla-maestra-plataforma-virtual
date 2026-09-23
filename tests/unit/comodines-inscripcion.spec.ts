import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { interpolar, mergeSiteConfig, PLACEHOLDERS } from '@/lib/site-config-core'
import { inscripcionesIguales, varsInscripcionPorNivel } from '@/lib/precios-nivel'
import { escribirRuta, inscripcionesDeBorrador } from '@/lib/site-config-editor'
import { recortarAEditables } from '@/lib/site-config-validacion'
import { textoInscripcion } from '@/lib/precios-ui'

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
  const defaults = recortarAEditables(mergeSiteConfig(CONFIG, {}))
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

test('5. los TRES sitios que interpolan sustituyen los comodines nuevos', () => {
  expect(leer('src/components/landing/LandingClient.tsx')).toContain('...varsInscripcionPorNivel(p, fmt)')
  expect(leer('src/components/landing/animada/LandingAnimada.tsx')).toMatch(/\.\.\.varsInscripcionPorNivel\(precios,/)
  const previa = leer('src/components/admin/personalizar/VistaPrevia.tsx')
  expect(previa).toContain('inscripcionSecundaria: formatoDinero(inscripcionSecundaria, moneda)')
  expect(previa).toContain('inscripcionPreparatoria: formatoDinero(inscripcionPreparatoria, moneda)')
  expect(leer('src/app/(dashboard)/admin/configuracion/page.tsx')).toContain('...inscripcionesDeBorrador(defaults, overrides)')
})

test('6. la landing animada solo llama "común" a una inscripción que lo es', () => {
  const fuente = leer('src/components/landing/animada/LandingAnimada.tsx')
  // La tarjeta de cada plan lleva la inscripción de SU nivel.
  expect(fuente).toContain('+ inscripción {inscripcionTextoDe(nivel)}')
  // El subtítulo de fábrica ("Inscripción única {inscripcion}") solo si es común.
  expect(fuente).toContain('bajada={mismoTotalPorNivel && inscripcionComun')
  // Y la FAQ solo dice "Los dos incluyen la inscripción de X" si es común.
  expect(fuente).toContain('inscripcionComun && inscripcionDe(nivelComun, precios) > 0')
  expect(fuente).toContain("(inscripcionComun ? '' : `La inscripción es de ${inscripcionPorNivelTexto}. `)")
})
