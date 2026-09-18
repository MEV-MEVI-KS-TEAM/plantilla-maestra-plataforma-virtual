import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { hexToRgb, luminanciaRelativa, ratioContraste } from '@/lib/contraste'
import { COLORES_DE_FABRICA } from '@/lib/landing-textos'
import { PALETA_ORIGINAL, paletaLanding } from '@/components/landing/paleta'

/**
 * `paletaLanding()` — los 18 colores con los que se pinta la portada clásica.
 *
 * Es la función más apalancada de la landing y no tenía ni una prueba, porque
 * vivía dentro de un componente que llama a `next/font/google` en el cuerpo del
 * módulo y no se puede importar fuera del build de Next. Ya vive en
 * `src/components/landing/paleta.ts`, y esto es lo que protege:
 *
 *   grupo A  la paleta de FÁBRICA sigue dando el mismo hex, letra por letra.
 *            Es el invariante de las escuelas que nunca tocaron `colores`: para
 *            ellas `esPaletaPersonalizada` es `false` y no se deriva nada.
 *
 *   grupo B  un acento CLARO ya no rompe el texto de las secciones oscuras.
 *            Este es el Bug P-4: los tres fondos oscuros salían de
 *            `oscurecer(acento, k)`, que solo da un tono oscuro si el acento ya
 *            era oscuro. Con el amarillo de una escuela real (#F5C400) el
 *            "fondo oscuro" acabó siendo un dorado medio, `colorLegibleConAlpha`
 *            lo tomó por fondo CLARO (luminancia 0.24 > 0.18) y devolvió su
 *            último recurso, `#000000`, como color del TEXTO CLARO: títulos
 *            negros sobre secciones casi negras.
 */

/** El umbral con el que `colorLegibleConAlpha` decide si un fondo es claro. */
const UMBRAL_FONDO_CLARO = 0.18

/** Los seis tonos que la landing usa como FONDO de una sección oscura. */
const FONDOS_OSCUROS = ['aurora3', 'conFin', 'ctaFin', 'dolorInicio', 'prepaFin', 'footer'] as const

/** `hex` pintado con `alpha` sobre `fondo`. Misma fórmula que `mezclarSobre`. */
function mezclar(hex: string, fondo: string, alpha: number): string {
  const c = hexToRgb(hex), b = hexToRgb(fondo)
  if (!c || !b) return hex
  const m = (x: number, y: number) => Math.round(x * alpha + y * (1 - alpha))
  return '#' + [m(c.r, b.r), m(c.g, b.g), m(c.b, b.b)]
    .map(v => v.toString(16).padStart(2, '0')).join('')
}

/**
 * El alpha con el que la landing pinta `ice` DE VERDAD. Réplica de `iceSuave()`
 * en LandingClient: arranca en el alpha que pide el diseño y lo sube de 0.05 en
 * 0.05 hasta que la mezcla sobre `refOscuro` cumple AA.
 *
 * Se replica en vez de dar por hecho un alpha fijo porque eso probaría otra
 * cosa: con un neutro claro, el .45 del diseño no llega a 4.5 ni con `ice` en
 * blanco puro, y quien resuelve eso es `iceSuave`, no `paletaLanding`.
 */
function alphaReal(ice: string, refOscuro: string, pedido = 0.45): number {
  for (let a = pedido; a <= 1.0001; a += 0.05) {
    const m = Math.min(a, 1)
    if (ratioContraste(mezclar(ice, refOscuro, m), refOscuro) >= 4.5) return m
  }
  return 1
}

/**
 * Una config de colores completa: los 6 tokens de la paleta + los 6 que no se
 * derivan (texto, fondo, superficie, borde...).
 *
 * El parametro NO es `Partial<typeof CONFIG.colores>`: `CONFIG` lleva `as const`,
 * asi que ese tipo exige los hex LITERALES de la plantilla y rechaza cualquier
 * otro color — que es justo lo que estas pruebas necesitan pasar. Se relaja a
 * `string` por clave, que es lo que `paletaLanding` recibe en produccion desde
 * la config fusionada con los overrides de la base.
 */
type Colores = Record<keyof typeof CONFIG.colores, string>

function colores(paleta: Partial<Colores>): Colores {
  return { ...CONFIG.colores, ...COLORES_DE_FABRICA, ...paleta }
}

// ─── Grupo A · la paleta de fábrica no se mueve ──────────────────────────────

test('A1. con los colores DE FÁBRICA devuelve PALETA_ORIGINAL, hex por hex', () => {
  const C = paletaLanding(colores({}))
  // Deep-equal contra el objeto literal: si alguien cambia un derivado, salta.
  // Es el invariante de las escuelas que nunca tocaron su paleta.
  expect(C).toEqual(PALETA_ORIGINAL)
  expect(C.personalizada).toBe(false)
  // Y los hex que estaban escritos a mano en el JSX antes de que existiera esta
  // función, uno a uno, para que el deep-equal siga significando algo si
  // PALETA_ORIGINAL se editara por error.
  expect(C.hero).toBe('#080F1E')
  expect(C.navy).toBe('#0D1B3E')
  expect(C.royal).toBe('#1565C0')
  expect(C.ice).toBe('#E3F2FD')
  expect(C.white).toBe('#FFFFFF')
  expect(C.aurora3).toBe('#0d2060')
  expect(C.conFin).toBe('#0a1f4a')
  expect(C.ctaFin).toBe('#0d3080')
  expect(C.footer).toBe('#050a14')
  expect(C.navySuave).toBe('#0D1B3E88')
})

test('A2. da igual la caja del hex: #3b82f6 sigue siendo la paleta de fábrica', () => {
  expect(paletaLanding(colores({ acento: '#3b82f6' }))).toEqual(PALETA_ORIGINAL)
})

// ─── Grupo B · Bug P-4: acentos que no son el azul de fábrica ───────────────

/**
 * Acentos reales. El amarillo es el de la escuela que destapó el bug (#212); el
 * ámbar y el verde menta son del tipo de acento claro que el editor acepta hoy
 * sin avisar; el azul marino es el caso contrario, para que no se cuele un fix
 * que solo funcione con acentos claros.
 */
const ACENTOS = [
  { nombre: 'amarillo claro', primario: '#1E1E1E', secundario: '#2B2B2B', acento: '#F5C400', acentoClaro: '#FFF4C2', acentoHover: '#E0B400', sobreAcento: '#1E1E1E' },
  { nombre: 'ámbar',          primario: '#1E1E1E', secundario: '#2B2B2B', acento: '#FFD54F', acentoClaro: '#FFF8E1', acentoHover: '#E6BC38', sobreAcento: '#1E1E1E' },
  { nombre: 'verde menta',    primario: '#1B1B1B', secundario: '#262626', acento: '#A5D6A7', acentoClaro: '#E8F5E9', acentoHover: '#8CC08E', sobreAcento: '#1B1B1B' },
  { nombre: 'azul marino',    primario: '#0B1220', secundario: '#12203C', acento: '#1D4ED8', acentoClaro: '#DBEAFE', acentoHover: '#1E40AF', sobreAcento: '#FFFFFF' },
]

for (const a of ACENTOS) {
  test(`B · ${a.nombre}: los fondos oscuros SON oscuros y el texto claro se lee`, () => {
    const C = paletaLanding(colores({
      primario: a.primario, secundario: a.secundario, acento: a.acento,
      acentoClaro: a.acentoClaro, acentoHover: a.acentoHover,
      textoSobreAcento: a.sobreAcento, superficie: '#FFFFFF',
    }))

    expect(C.personalizada).toBe(true)

    // 1. El síntoma exacto que se medía antes del arreglo: `ice` es el TEXTO
    //    claro de las secciones oscuras, y volvía en negro.
    expect(C.ice.toUpperCase(), 'ice en negro = el texto claro de media landing, invisible')
      .not.toBe('#000000')
    //    Y no basta con que no sea exactamente negro: tiene que ser CLARO.
    expect(luminanciaRelativa(C.ice), `ice=${C.ice} no es un color claro`)
      .toBeGreaterThan(0.5)

    // 2. La causa: los seis fondos oscuros tienen que ser OSCUROS de verdad, o
    //    `colorLegibleConAlpha` los toma por papel y oscurece el texto en vez de
    //    aclararlo. 0.18 es el mismo umbral que usa esa función.
    for (const k of FONDOS_OSCUROS) {
      const lum = luminanciaRelativa(C[k])
      expect(lum, `${k}=${C[k]} tiene luminancia ${lum.toFixed(3)}: no es un fondo oscuro`)
        .toBeLessThanOrEqual(UMBRAL_FONDO_CLARO)
    }

    // 3. `refOscuro` es el fondo contra el que se calibra `ice`. Si no es
    //    oscuro, nada de lo de arriba sirve.
    expect(luminanciaRelativa(C.refOscuro)).toBeLessThanOrEqual(UMBRAL_FONDO_CLARO)

    // 4. Y el resultado, al alpha que la landing usa DE VERDAD (el que `iceSuave`
    //    encuentra sobre `refOscuro`): AA sobre los seis fondos oscuros.
    const alpha = alphaReal(C.ice, C.refOscuro)
    for (const k of FONDOS_OSCUROS) {
      const ratio = ratioContraste(mezclar(C.ice, C[k], alpha), C[k])
      expect(ratio, `ice al ${Math.round(alpha * 100)} % sobre ${k} (${C[k]}) da ${ratio.toFixed(2)}`)
        .toBeGreaterThanOrEqual(4.5)
    }

    // 5. Y el texto sólido sobre el papel, que es el otro extremo de la página.
    expect(ratioContraste(C.royalTexto, C.white)).toBeGreaterThanOrEqual(4.5)
    expect(ratioContraste(C.sobreStep, C.stepFin)).toBeGreaterThanOrEqual(4.5)
  })
}

test('B5. los tres fondos que dependían del acento ahora salen del NEUTRO', () => {
  // Dos configs que SOLO difieren en el acento. Si los fondos oscuros salieran
  // del acento, cambiarían; saliendo del neutro, son idénticos. Es la afirmación
  // de diseño del fix escrita como prueba: un FONDO oscuro es trabajo del
  // neutro y el acento acentúa.
  const base = {
    primario: '#1E1E1E', secundario: '#2B2B2B', superficie: '#FFFFFF',
    acentoClaro: '#FFF4C2', acentoHover: '#E0B400', textoSobreAcento: '#1E1E1E',
  }
  const amarilla = paletaLanding(colores({ ...base, acento: '#F5C400' }))
  const morada   = paletaLanding(colores({ ...base, acento: '#7E57C2' }))

  for (const k of FONDOS_OSCUROS) {
    expect(amarilla[k], `${k} cambió al cambiar solo el acento`).toBe(morada[k])
  }
  // Y el acento sí se mueve, claro: es lo que acentúa.
  expect(amarilla.royal).not.toBe(morada.royal)
  expect(amarilla.azure).not.toBe(morada.azure)
})

test('B6. el amarillo de #212: así estaba antes del fix, y así queda', () => {
  // El caso medido, con números en vez de adjetivos. `oscurecer(acento, 0.33)`
  // sobre #F5C400 da #A48300, luminancia 0.24 — por encima del umbral de 0.18,
  // así que `colorLegibleConAlpha` lo tomaba por FONDO CLARO. Eso es lo que
  // devolvía #000000 en `ice`.
  expect(luminanciaRelativa('#A48300')).toBeGreaterThan(UMBRAL_FONDO_CLARO)
  // Y el mismo factor sobre el NEUTRO de esa escuela sí da un fondo oscuro.
  expect(luminanciaRelativa('#1D1D1D')).toBeLessThanOrEqual(UMBRAL_FONDO_CLARO)

  const C = paletaLanding(colores({
    primario: '#1E1E1E', secundario: '#2B2B2B', acento: '#F5C400',
    acentoClaro: '#FFF4C2', acentoHover: '#E0B400',
    textoSobreAcento: '#1E1E1E', superficie: '#FFFFFF',
  }))
  expect(C.ctaFin.toUpperCase()).toBe('#1D1D1D')
  expect(C.ice.toUpperCase()).not.toBe('#000000')
})
