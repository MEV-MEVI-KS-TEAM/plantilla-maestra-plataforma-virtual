import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import {
  mergeSiteConfig,
  resolverLogos,
  toPublicSiteConfig,
  toLandingConfig,
  type SiteConfig,
} from '@/lib/site-config-core'

/**
 * Personalizar mi página — regla de resolución de `logo` / `logoOscuro`.
 *
 * El bug que estas pruebas cierran: el admin subía SOLO su logo claro y la
 * landing (cabecera, hero, footer) seguía enseñando el placeholder, porque
 * pintaba `logoOscuro || logo` y `logoOscuro` se quedaba en el default de
 * config.ts. Ahora la decisión vive en el merge (`resolverLogos`) y los
 * componentes leen los dos valores ya resueltos.
 *
 * ⚠️ Se importa de '@/lib/site-config-core', NUNCA de '@/lib/site-config':
 * aquél lleva `import 'server-only'`.
 */

const CLARO = 'https://qa.supabase.co/storage/v1/object/public/branding/logo-claro-1.png'
const OSCURO = 'https://qa.supabase.co/storage/v1/object/public/branding/logo-oscuro-2.png'

/** CONFIG como JSON plano, sin `readonly` de tipo. */
const esperado = () => JSON.parse(JSON.stringify(CONFIG)) as SiteConfig

// ─── Los cuatro casos de la regla ────────────────────────────────────────────

test('1. sin override de logos → exactamente config.ts (invariante de la BD vacía)', () => {
  const r = mergeSiteConfig(CONFIG, {})
  expect(r.logo).toBe(CONFIG.logo)
  expect(r.logoOscuro).toBe(CONFIG.logoOscuro)
  expect(r).toEqual(esperado())

  // Con otros overrides que no son de logo, los logos siguen de fábrica.
  const r2 = mergeSiteConfig(CONFIG, { nombre: 'X', colores: { acento: '#047857' } })
  expect(r2.logo).toBe(CONFIG.logo)
  expect(r2.logoOscuro).toBe(CONFIG.logoOscuro)
})

test('2. solo `logo` → logoOscuro efectivo = logo (el claro sirve en ambos fondos)', () => {
  const r = mergeSiteConfig(CONFIG, { logo: CLARO })
  expect(r.logo).toBe(CLARO)
  expect(r.logoOscuro, 'la landing pinta logoOscuro: tiene que ser el logo subido, no el placeholder').toBe(CLARO)
  // Nada más cambió.
  const e = esperado()
  e.logo = CLARO
  e.logoOscuro = CLARO
  expect(r).toEqual(e)
})

test('3. solo `logoOscuro` → logo NO cambia (regla asimétrica: se queda el de config.ts)', () => {
  // En la flota `/logo.png` es el logo REAL del cliente y la variante oscura
  // suele ser un lockup blanco: no puede propagarse al login ni al recibo.
  const r = mergeSiteConfig(CONFIG, { logoOscuro: OSCURO })
  expect(r.logoOscuro).toBe(OSCURO)
  expect(r.logo, 'login, recibo y vista previa siguen con el claro de config.ts').toBe(CONFIG.logo)
  const e = esperado()
  e.logoOscuro = OSCURO
  expect(r).toEqual(e)
})

test('4. los dos → cada uno el suyo', () => {
  const r = mergeSiteConfig(CONFIG, { logo: CLARO, logoOscuro: OSCURO })
  expect(r.logo).toBe(CLARO)
  expect(r.logoOscuro).toBe(OSCURO)
})

// ─── Bordes ──────────────────────────────────────────────────────────────────

test('`logoOscuro: ""` ("sin variante oscura") se resuelve al claro, con y sin logo subido', () => {
  // Sin logo subido: cae al default de config.ts, no queda un <img src="">.
  expect(mergeSiteConfig(CONFIG, { logoOscuro: '' }).logoOscuro).toBe(CONFIG.logo)
  // Con logo subido: cae al subido.
  const r = mergeSiteConfig(CONFIG, { logo: CLARO, logoOscuro: '' })
  expect(r.logo).toBe(CLARO)
  expect(r.logoOscuro).toBe(CLARO)
})

test('un override de logo RECHAZADO cuenta como ausente', () => {
  // `logo: ''` lo rechaza SIN_VACIO; `logo: 123` no es compatible con string.
  // En ninguno de los dos hay "override de logo", así que no se toca el oscuro
  // y el claro se queda con el de config.ts (regla asimétrica).
  const vacio = mergeSiteConfig(CONFIG, { logo: '', logoOscuro: OSCURO })
  expect(vacio.logoOscuro).toBe(OSCURO)
  expect(vacio.logo, 'el claro de config.ts se conserva').toBe(CONFIG.logo)

  const numero = mergeSiteConfig(CONFIG, { logo: 123 as unknown as string })
  expect(numero.logo).toBe(CONFIG.logo)
  expect(numero.logoOscuro).toBe(CONFIG.logoOscuro)
})

test('config.ts de un cliente con logoOscuro null o vacío: sin override se rellena con logo', () => {
  // Es lo que los consumidores pintaban con su antiguo `logoOscuro || logo`:
  // el HTML no cambia, pero ya no viaja un `null` que acabe en <img src>.
  const base = esperado() as unknown as Record<string, unknown>
  base.logoOscuro = null
  const r = mergeSiteConfig(base as unknown as SiteConfig, {})
  expect(r.logoOscuro).toBe(CONFIG.logo)

  base.logoOscuro = ''
  expect(mergeSiteConfig(base as unknown as SiteConfig, {}).logoOscuro).toBe(CONFIG.logo)

  // Y si ese cliente sube solo el claro, el claro manda en los dos.
  base.logoOscuro = null
  const subido = mergeSiteConfig(base as unknown as SiteConfig, { logo: CLARO })
  expect(subido.logo).toBe(CLARO)
  expect(subido.logoOscuro).toBe(CLARO)
})

test('config.ts con variante oscura PROPIA: se conserva sin overrides y cede ante el logo subido', () => {
  const base = esperado()
  base.logoOscuro = '/logo-oscuro.png'
  // Sin overrides, exactamente lo de fábrica.
  const r = mergeSiteConfig(base, {})
  expect(r.logo).toBe('/logo.png')
  expect(r.logoOscuro).toBe('/logo-oscuro.png')
  // El admin sube su logo nuevo: el oscuro de fábrica es el logo VIEJO y se
  // deja de usar hasta que suba su variante oscura.
  const nuevo = mergeSiteConfig(base, { logo: CLARO })
  expect(nuevo.logo).toBe(CLARO)
  expect(nuevo.logoOscuro).toBe(CLARO)
})

test('resolverLogos por sí solo: no toca nada cuando los dos valores existen y no hay overrides', () => {
  const cfg = esperado()
  cfg.logo = '/a.png'
  cfg.logoOscuro = '/b.png'
  const r = resolverLogos(cfg, { logo: false, logoOscuro: false })
  expect(r).toBe(cfg) // muta y devuelve el mismo objeto (es el clon del merge)
  expect(r.logo).toBe('/a.png')
  expect(r.logoOscuro).toBe('/b.png')
  // Solo el oscuro aplicado: el claro se queda (asimetría).
  resolverLogos(cfg, { logo: false, logoOscuro: true })
  expect(cfg.logo).toBe('/a.png')
  expect(cfg.logoOscuro).toBe('/b.png')
  // Solo un config.ts ROTO (logo vacío) toma el oscuro: es lo que hacía el recibo.
  cfg.logo = ''
  resolverLogos(cfg, { logo: false, logoOscuro: false })
  expect(cfg.logo).toBe('/b.png')
  // Con los dos vacíos no inventa nada.
  cfg.logo = ''
  cfg.logoOscuro = ''
  resolverLogos(cfg, { logo: false, logoOscuro: false })
  expect(cfg.logo).toBe('')
  expect(cfg.logoOscuro).toBe('')
})

test('lo resuelto es lo que viaja al navegador y a la landing', () => {
  const r = mergeSiteConfig(CONFIG, { logo: CLARO })
  expect(toPublicSiteConfig(r).logoOscuro).toBe(CLARO)
  expect(toLandingConfig(r).logoOscuro).toBe(CLARO)
})
