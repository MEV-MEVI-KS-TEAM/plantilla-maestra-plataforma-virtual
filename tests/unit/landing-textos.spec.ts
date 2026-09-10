import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'
import {
  CLAVES_LANDING_PINTADAS,
  CLAVES_PALETA,
  LISTAS_LANDING,
  COLORES_DE_FABRICA,
  esPaletaPersonalizada,
  resolverLanding,
} from '@/lib/landing-textos'

/**
 * Hardening de F3 — `src/lib/landing-textos.ts`.
 *
 * Lo que protegen estas pruebas es que la landing de un cliente cuyo
 * `config.ts` NO tenga todas las claves siga pintándose. Son ~144 escuelas con
 * su propio config clonado en fechas distintas, y F3 estrenó 35 claves de
 * golpe: sin `resolverLanding`, un `L.contadores.map(...)` sobre `undefined`
 * tira la página entera de esa escuela.
 *
 * ⚠️ Se importa de '@/lib/landing-textos' (módulo puro e isomorfo), nunca del
 * componente: `LandingClient` es 'use client' y arrastra next/font y next/image.
 */

/** Las 35 claves que estrenó F3: exactamente las que un config.ts viejo NO tiene. */
const CLAVES_F3 = [
  'hero_badge_superior', 'hero_cta_primario', 'hero_cta_whatsapp', 'contadores',
  'dolor_kicker', 'dolor_titulo', 'dolor_items', 'dolor_cierre', 'dolor_cierre_sub',
  'programas_kicker', 'programas_titulo', 'programas_subtitulo', 'programas_popular', 'programas_cta',
  'transformacion_kicker', 'transformacion_titulo', 'transformacion_sin', 'transformacion_con',
  'proceso_kicker', 'proceso_titulo', 'proceso_pasos',
  'testimonios_kicker', 'testimonios_titulo', 'testimonios_subtitulo',
  'beneficios_titulo', 'beneficios_subtitulo', 'beneficios_items',
  'faq_kicker', 'faq_titulo', 'faq_items',
  'cta_titulo', 'cta_highlight', 'cta_subtitulo', 'cta_boton', 'cta_whatsapp',
] as const

/** `CONFIG.landing` como JSON plano y mutable, para poder quitarle claves. */
const landingBase = () => JSON.parse(JSON.stringify(CONFIG.landing)) as Record<string, unknown>

// ─── (a) Entradas degeneradas ────────────────────────────────────────────────

test('a. resolverLanding(undefined) y resolverLanding({}) no lanzan y devuelven los defaults', () => {
  for (const entrada of [undefined, null, {}] as const) {
    const r = resolverLanding(entrada)
    expect(Object.keys(r).sort()).toEqual([...CLAVES_LANDING_PINTADAS].sort())
    for (const clave of CLAVES_LANDING_PINTADAS) {
      expect(r[clave], `${String(entrada)} → ${clave}`).toEqual(landingBase()[clave])
    }
  }
})

test('a2. una entrada que ni siquiera es objeto plano cae entera a los defaults', () => {
  // La config del cliente es código suyo, pero esta función es el único punto
  // donde la landing lee `landing.*`: si algún día le llega otra cosa, que
  // degrade a la plantilla en vez de tirar el render.
  for (const raro of ['texto', 42, true, [], () => {}]) {
    const r = resolverLanding(raro as never)
    expect(r.hero_titulo).toBe(CONFIG.landing.hero_titulo)
    expect(Array.isArray(r.contadores)).toBe(true)
  }
})

// ─── (b) Config.ts viejo: le faltan las claves de F3 ─────────────────────────

test('b. un config.ts SIN las claves de F3 recibe los defaults y conserva lo que sí trae', () => {
  const viejo = landingBase()
  for (const clave of CLAVES_F3) delete viejo[clave]
  // Y una clave pre-F3 personalizada por el cliente, que NO se puede pisar.
  viejo.hero_titulo = 'Título del cliente'
  viejo.ciudad = 'Tuxtla Gutiérrez'

  const r = resolverLanding(viejo as never)

  // Lo ausente vuelve del default de la plantilla…
  for (const clave of CLAVES_F3) {
    expect(r[clave], clave).toEqual(landingBase()[clave])
    expect(r[clave], `${clave} no puede quedar undefined`).not.toBeUndefined()
  }
  // …y lo presente se respeta.
  expect(r.hero_titulo).toBe('Título del cliente')
  expect(r.ciudad).toBe('Tuxtla Gutiérrez')
  // Siguen estando las 42.
  expect(Object.keys(r).sort()).toEqual([...CLAVES_LANDING_PINTADAS].sort())
})

test('b2. un `\'\'` explícito se respeta: en ciudad significa "no lo muestres"', () => {
  const r = resolverLanding({ ...landingBase(), ciudad: '' } as never)
  expect(r.ciudad).toBe('')
})

// ─── (c) Las listas SIEMPRE son arreglos ─────────────────────────────────────

test('c. cada lista es un arreglo aunque llegue null, undefined o de otro tipo', () => {
  const rotos: unknown[] = [null, undefined, 'no soy lista', 42, {}, true]
  for (const roto of rotos) {
    const entrada = landingBase()
    for (const lista of LISTAS_LANDING) entrada[lista] = roto
    const r = resolverLanding(entrada as never)
    for (const lista of LISTAS_LANDING) {
      expect(Array.isArray(r[lista]), `${lista} con ${JSON.stringify(roto)}`).toBe(true)
      // Y no es un arreglo vacío por accidente: cae al default de la plantilla.
      expect(r[lista]).toEqual(landingBase()[lista])
    }
  }
})

test('c2. sin la clave NI default (config.ts sin ella) una lista sigue siendo [] y un texto \'\'', () => {
  // `resolverLanding` rellena desde CONFIG.landing, así que el único modo de
  // quedarse sin default es que la plantilla tampoco tenga la clave. No pasa
  // hoy, pero es el fail-safe que impide el TypeError pase lo que pase.
  const r = resolverLanding({} as never)
  for (const lista of LISTAS_LANDING) expect(Array.isArray(r[lista])).toBe(true)
  for (const clave of CLAVES_LANDING_PINTADAS) expect(r[clave]).not.toBeUndefined()
})

test('c3. una lista VÁLIDA del cliente se respeta tal cual (misma referencia, no se clona)', () => {
  const faq = [{ q: '¿Uno?', a: 'Sí.' }]
  const r = resolverLanding({ ...landingBase(), faq_items: faq } as never)
  expect(r.faq_items).toBe(faq)
})

// ─── (d) La lista no se desincroniza del JSX ─────────────────────────────────

test('d. cada clave de CLAVES_LANDING_PINTADAS existe en CONFIG.landing', () => {
  for (const clave of CLAVES_LANDING_PINTADAS) {
    expect(Object.prototype.hasOwnProperty.call(CONFIG.landing, clave), clave).toBe(true)
  }
  // Sin duplicados: un `Set` del mismo tamaño que el arreglo.
  expect(new Set(CLAVES_LANDING_PINTADAS).size).toBe(CLAVES_LANDING_PINTADAS.length)
})

test('d2. CLAVES_LANDING_PINTADAS coincide EXACTAMENTE con los `L.x` de LandingClient', () => {
  // El guardián de verdad. `LandingClient` hace `const L = resolverLanding(...)`
  // y pinta con `L.<clave>`: si alguien añade un `L.nuevo` al JSX y no lo mete
  // en la lista, ese campo vuelve a ser un `undefined` en producción para todo
  // cliente cuyo config.ts no lo traiga — que es justo el bug que esto cierra.
  const jsx = readFileSync(
    join(process.cwd(), 'src', 'components', 'landing', 'LandingClient.tsx'),
    'utf8',
  )
  const enElJsx = new Set<string>()
  for (const m of jsx.matchAll(/\bL\.([A-Za-z_][A-Za-z0-9_]*)/g)) enElJsx.add(m[1])

  expect(enElJsx.size, 'no se encontró ningún `L.x`: ¿cambió el nombre de la variable?')
    .toBeGreaterThan(30)
  expect([...enElJsx].sort()).toEqual([...CLAVES_LANDING_PINTADAS].sort())
})

test('d3. LISTAS_LANDING es subconjunto de las pintadas y todas son arreglo en CONFIG', () => {
  for (const lista of LISTAS_LANDING) {
    expect(CLAVES_LANDING_PINTADAS as ReadonlyArray<string>).toContain(lista)
    expect(Array.isArray((CONFIG.landing as Record<string, unknown>)[lista]), lista).toBe(true)
  }
  // Y no falta ninguna: toda clave pintada que sea arreglo en CONFIG está en
  // LISTAS_LANDING. Sin esto, una lista nueva se resolvería como texto y
  // volvería el `.map` sobre `''`.
  for (const clave of CLAVES_LANDING_PINTADAS) {
    if (Array.isArray((CONFIG.landing as Record<string, unknown>)[clave])) {
      expect(LISTAS_LANDING as ReadonlyArray<string>, clave).toContain(clave)
    }
  }
})

// ─── Punto 3: la paleta se compara normalizada ───────────────────────────────

test('esPaletaPersonalizada: el mismo hex en minúsculas NO enciende la paleta derivada', () => {
  const base = { ...CONFIG.colores, acento: '#3B82F6' }
  const igualEnMinusculas = { ...base, acento: '#3b82f6' }

  expect(esPaletaPersonalizada(igualEnMinusculas, base)).toBe(false)
  // Y al revés, por si el config.ts es el que los tiene en minúsculas.
  expect(esPaletaPersonalizada(base, igualEnMinusculas)).toBe(false)
  // Espacios sobrantes tampoco cuentan como "otro color".
  expect(esPaletaPersonalizada({ ...base, acento: '  #3b82f6  ' }, base)).toBe(false)
})

test('esPaletaPersonalizada: un color DISTINTO sí la enciende, clave por clave', () => {
  const base = { ...CONFIG.colores }
  expect(esPaletaPersonalizada(base, base)).toBe(false)
  for (const k of CLAVES_PALETA) {
    expect(esPaletaPersonalizada({ ...base, [k]: '#010203' }, base), k).toBe(true)
  }
})

test('esPaletaPersonalizada: REGRESIÓN — el config.ts del cliente NO puede ser la referencia', () => {
  // EDUHCO (#197) y GRATIA (#198): la escuela declara su paleta en config.ts,
  // no toca el panel, despliega… y la portada sale con el azul de la plantilla.
  // La causa era comparar contra `CONFIG.colores`, que en el repo de un cliente
  // YA SON sus colores: "iguales" → false → PALETA_ORIGINAL.
  const gratia = {
    primario:         '#053030',
    secundario:       '#0A4444',
    acento:           '#C09852',
    acentoHover:      '#8F6B2E',
    acentoClaro:      '#F7EFE2',
    textoSobreAcento: '#053030',
  }
  // Con la referencia correcta, una paleta propia enciende la landing…
  expect(esPaletaPersonalizada(gratia)).toBe(true)
  // …y comparada contra sí misma (el bug) daría false. Este es el caso que
  // rompía: el clon del cliente evaluaba exactamente esto.
  expect(esPaletaPersonalizada(gratia, gratia)).toBe(false)
})

test('esPaletaPersonalizada: INVARIANTE — la paleta de fábrica no enciende nada', () => {
  // Las ~144 escuelas que nunca tocaron `colores` tienen que ver su landing
  // exactamente igual que antes de este fix.
  expect(esPaletaPersonalizada(COLORES_DE_FABRICA)).toBe(false)
  for (const k of CLAVES_PALETA) {
    expect(COLORES_DE_FABRICA[k], `falta ${k} en COLORES_DE_FABRICA`).toMatch(/^#[0-9A-F]{6}$/)
  }
})

test('COLORES_DE_FABRICA sigue sincronizada con el config.ts de la PLANTILLA', () => {
  // Solo puede comprobarse en la plantilla maestra: en el repo de un cliente
  // `CONFIG.colores` son los suyos y esta comparación no significa nada. Se
  // salta ahí, y en la plantilla actúa de guardián de la sincronía.
  if (!ES_PLANTILLA) return
  for (const k of CLAVES_PALETA) {
    expect(COLORES_DE_FABRICA[k], k).toBe((CONFIG.colores as Record<string, string>)[k])
  }
})

test('esPaletaPersonalizada: base por defecto = paleta de fábrica', () => {
  // ⚠️ SE PRUEBA CONTRA `COLORES_DE_FABRICA`, NO CONTRA `CONFIG.colores`. Es lo
  // que afirma el nombre de la prueba, y es lo único que significa algo en el
  // repo de un cliente: ahí `CONFIG.colores` SON los suyos, así que esperar
  // `false` era esperar que su paleta propia no fuera propia. Reventaba en el
  // clon de cualquier escuela con colores —SAMEX (#199) lo destapó— mientras
  // en la plantilla pasaba de casualidad, porque ahí las dos coinciden.
  expect(esPaletaPersonalizada(COLORES_DE_FABRICA)).toBe(false)
  expect(esPaletaPersonalizada({ ...COLORES_DE_FABRICA, acento: '#010203' })).toBe(true)
  // Una clave AUSENTE cuenta como distinta (es el comportamiento de siempre):
  // el cliente tiene menos colores que la plantilla y no se puede afirmar que
  // sean los mismos.
  const sinAcento = { ...COLORES_DE_FABRICA } as Record<string, string | undefined>
  delete sinAcento.acento
  expect(esPaletaPersonalizada(sinAcento as never)).toBe(true)
  expect(esPaletaPersonalizada(undefined)).toBe(true)
})
