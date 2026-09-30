import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { CLAVES_EDITABLES, mergeSiteConfig } from '@/lib/site-config-core'
import { recortarOverrides, validarOverrides } from '@/lib/site-config-validacion'
import { prepararParaPublicar } from '@/lib/site-config-editor'
import {
  CLAVES_DISENO,
  CLAVES_LOGO_BRANDING,
  CLAVES_NEGOCIO,
  logosABorrar,
  restaurarDiseno,
} from '@/lib/site-config-restaurar'

/**
 * #279 — «Restaurar diseño original» regresa SOLO el diseño (decisión de Kevin,
 * 30-sep-2026). Lo que protegen estas pruebas:
 *   · que TODA clave editable esté clasificada (diseño o negocio) y una sola vez;
 *   · que cada clave de negocio sobreviva con su valor y cada clave de diseño se vaya;
 *   · que la fila restaurada siga siendo publicable y que el merge (lo que pinta
 *     la landing) muestre el negocio EDITADO y el diseño de fábrica;
 *   · que solo se borren del bucket los logos sin referencia y anteriores al restaurar;
 *   · que la API y el editor usen esto (y el editor no vuelva a {} tras restaurar,
 *     porque su siguiente «Publicar» reemplazaría la fila y borraría el negocio).
 *
 * ⚠️ Se importa de '@/lib/site-config-core', NUNCA de '@/lib/site-config'
 * (lleva `server-only`).
 */

type Obj = Record<string, unknown>
const RAIZ = process.cwd()
const leer = (rel: string) => readFileSync(join(RAIZ, rel), 'utf8')
const BASE = mergeSiteConfig(CONFIG, {})

function poner(obj: Obj, ruta: string, valor: unknown): void {
  const partes = ruta.split('.')
  let actual = obj
  for (const p of partes.slice(0, -1)) {
    if (typeof actual[p] !== 'object' || actual[p] === null) actual[p] = {}
    actual = actual[p] as Obj
  }
  actual[partes[partes.length - 1]] = valor
}

function tomar(obj: Obj, ruta: string): unknown {
  let actual: unknown = obj
  for (const p of ruta.split('.')) {
    if (typeof actual !== 'object' || actual === null) return undefined
    actual = (actual as Obj)[p]
  }
  return actual
}

function tiene(obj: Obj, ruta: string): boolean {
  const partes = ruta.split('.')
  const padre = partes.length === 1 ? obj : tomar(obj, partes.slice(0, -1).join('.'))
  return typeof padre === 'object' && padre !== null && partes[partes.length - 1] in (padre as Obj)
}

/** Una fila sintética con un valor distinto en CADA clave editable. */
function filaCompleta(): Obj {
  const fila: Obj = {}
  for (const ruta of CLAVES_EDITABLES) {
    if (ruta === 'modalidades') poner(fila, ruta, { '3_meses': { mensualidad: 1234, activa: false } })
    else if (ruta === 'licenciaturas.modalidades') poner(fila, ruta, { lic_4_meses: { mensualidad: 999 } })
    else poner(fila, ruta, `valor:${ruta}`)
  }
  return fila
}

// ─── 1. Partición ────────────────────────────────────────────────────────────

test('1. diseño y negocio reparten TODAS las claves editables, sin repetir', () => {
  const diseno = new Set<string>(CLAVES_DISENO)
  const negocio = new Set<string>(CLAVES_NEGOCIO)
  expect(diseno.size).toBe(CLAVES_DISENO.length)
  expect(negocio.size).toBe(CLAVES_NEGOCIO.length)
  for (const c of diseno) expect(negocio.has(c), `${c} está en las dos listas`).toBe(false)
  const union = new Set([...diseno, ...negocio])
  // Una clave editable nueva sin clasificar hace fallar esta prueba: hay que
  // decidir de qué lado va (regla de Kevin: si es dudosa, se CONSERVA).
  expect([...union].sort()).toEqual([...CLAVES_EDITABLES].sort())
  // Los grupos que el editor escribe juntos quedan del mismo lado.
  for (const grupo of [
    ['whatsapp', 'whatsappUrl', 'whatsappDisplay', 'contactoTelefono'],
    ['email', 'contactoEmail'],
    ['cct', 'landing.cct'],
    ['logo', 'logoOscuro'],
  ]) {
    const lados = new Set(grupo.map((c) => (negocio.has(c) ? 'negocio' : 'diseno')))
    expect(lados.size, grupo.join(', ')).toBe(1)
  }
  expect([...CLAVES_LOGO_BRANDING].every((c) => diseno.has(c))).toBe(true)
})

test('2. lo que Kevin nombró está del lado correcto', () => {
  for (const c of ['logo', 'logoOscuro', 'colores.primario', 'colores.acento', 'landing.hero_titulo',
    'landing.hero_subtitulo', 'landing.faq_items', 'landing.cta_titulo', 'landing.testimonios']) {
    expect(CLAVES_DISENO as ReadonlyArray<string>, c).toContain(c)
  }
  for (const c of ['nombre', 'whatsapp', 'contactoEmail', 'email', 'contactoTelefono', 'redes.facebook',
    'redes.instagram', 'precios.inscripcion', 'precios.mensualidadSecundaria3Meses', 'modalidades',
    'licenciaturas.inscripcion', 'licenciaturas.modalidades', 'tipoCambioMXN',
    // dudosos → se conservan
    'tagline', 'landing.ciudad', 'landing.cct']) {
    expect(CLAVES_NEGOCIO as ReadonlyArray<string>, c).toContain(c)
  }
})

// ─── 2. restaurarDiseno ──────────────────────────────────────────────────────

test('3. cada clave de negocio sobrevive con su valor; cada clave de diseño desaparece', () => {
  const fila = filaCompleta()
  const antes = JSON.stringify(fila)
  const r = restaurarDiseno(fila)
  for (const c of CLAVES_NEGOCIO) expect(tomar(r, c), c).toEqual(tomar(fila, c))
  for (const c of CLAVES_DISENO) expect(tiene(r, c), c).toBe(false)
  // colores se queda sin nada → la cáscara vacía se poda; landing conserva ciudad y cct.
  expect('colores' in r).toBe(false)
  expect(Object.keys(r.landing as Obj).sort()).toEqual(['cct', 'ciudad'])
  expect(JSON.stringify(fila)).toBe(antes) // no muta la entrada
})

test('4. fila vacía sigue vacía; lo que no es objeto da {}', () => {
  expect(restaurarDiseno({})).toEqual({})
  for (const v of [null, undefined, [], 'x', 3, true]) expect(restaurarDiseno(v)).toEqual({})
})

test('5. una fila con SOLO datos del negocio no cambia (y no es la misma referencia)', () => {
  const soloNegocio: Obj = {}
  for (const c of CLAVES_NEGOCIO) {
    if (c === 'modalidades') poner(soloNegocio, c, { '6_meses': { activa: false } })
    else if (c === 'licenciaturas.modalidades') poner(soloNegocio, c, { lic: { mensualidad: 1 } })
    else poner(soloNegocio, c, `n:${c}`)
  }
  const r = restaurarDiseno(soloNegocio)
  expect(r).toEqual(soloNegocio)
  expect(r).not.toBe(soloNegocio)
})

test('6. lo que no está en la lista blanca se conserva tal cual (dudoso → se conserva)', () => {
  const fila = { claveVieja: { a: 1 }, landing: { algoNuevo: 'x', hero_titulo: 'QA' }, colores: { primario: '#111111', raro: 'y' } }
  expect(restaurarDiseno(fila)).toEqual({ claveVieja: { a: 1 }, landing: { algoNuevo: 'x' }, colores: { raro: 'y' } })
})

// ─── 3. Con el validador y el merge reales (la plantilla) ────────────────────

test('7. publicar diseño + negocio → restaurar: la fila se puede volver a publicar y el merge muestra el negocio EDITADO', () => {
  const cuerpo = {
    colores: { primario: '#123456', acento: '#ABCDEF' },
    landing: { hero_titulo: 'Título de prueba 279', cta_titulo: 'Llamado QA', ciudad: 'Puebla' },
    tagline: 'Lema QA',
    whatsapp: '525511223344',
    contactoEmail: 'informes@qa-279.test',
    email: 'informes@qa-279.test',
    redes: { facebook: 'https://facebook.com/qa279' },
    precios: { inscripcion: Number(BASE.precios.inscripcion) + 11 },
    tipoCambioMXN: 18.5,
  }
  const publicado = validarOverrides(cuerpo, BASE)
  expect(publicado.ok, publicado.ok ? '' : `${publicado.error} (${publicado.clave})`).toBe(true)
  if (!publicado.ok) return
  const fila = publicado.overrides as Obj

  const restaurada = restaurarDiseno(fila)
  const overrides = recortarOverrides(restaurada, BASE)
  // El siguiente «Publicar cambios» del editor (mismo cuerpo que manda) pasa.
  const otraVez = validarOverrides(prepararParaPublicar(overrides), BASE)
  expect(otraVez.ok, otraVez.ok ? '' : `${otraVez.error} (${otraVez.clave})`).toBe(true)

  const m = mergeSiteConfig(CONFIG, overrides)
  // diseño → fábrica
  expect(m.colores.primario).toBe(BASE.colores.primario)
  expect(m.colores.acento).toBe(BASE.colores.acento)
  expect(m.landing.hero_titulo).toBe(BASE.landing.hero_titulo)
  expect(m.landing.cta_titulo).toBe(BASE.landing.cta_titulo)
  expect(m.logo).toBe(BASE.logo)
  // negocio → lo editado (no lo de la ficha)
  expect(m.whatsapp).toBe('525511223344')
  expect(String(m.whatsappUrl)).toContain('525511223344')
  expect(m.contactoEmail).toBe('informes@qa-279.test')
  expect(m.email).toBe('informes@qa-279.test')
  expect(m.redes.facebook).toBe('https://facebook.com/qa279')
  expect(m.precios.inscripcion).toBe(Number(BASE.precios.inscripcion) + 11)
  expect(m.tipoCambioMXN).toBe(18.5)
  expect(m.tagline).toBe('Lema QA')
  expect(m.landing.ciudad).toBe('Puebla')
})

// ─── 4. Bucket branding ──────────────────────────────────────────────────────

test('8. solo se borran logos sin referencia y subidos antes de restaurar', () => {
  const inicio = 1_000_000
  const nombres = [
    'logo-claro-900000.png', // viejo y sin referencia → se borra
    'logo-oscuro-900001.jpg', // viejo y sin referencia → se borra
    'logo-claro-900002.png', // viejo pero referenciado → se queda
    'logo-claro-1000001.png', // subido DESPUÉS de empezar a restaurar → se queda
    'favicon.png', // no es un logo de la ruta de subida → se queda
    'hack-logo-claro-1.png',
    'logo-claro-abc.png',
    'logo-medio-900003.png',
  ]
  expect(logosABorrar(nombres, new Set(['logo-claro-900002.png']), inicio)).toEqual([
    'logo-claro-900000.png',
    'logo-oscuro-900001.jpg',
  ])
  expect(logosABorrar([], new Set(), inicio)).toEqual([])
})

// ─── 5. La API y el editor usan esto ─────────────────────────────────────────

test('9. el DELETE restaura solo el diseño y ya no vacía la fila ni el bucket', () => {
  const ruta = leer('src/app/api/admin/configuracion/route.ts')
  const del = ruta.slice(ruta.indexOf('export async function DELETE'))
  expect(del).toContain('restaurarDiseno(fila?.data)')
  expect(del).toContain('borrarLogosSinReferencia(admin, referencia, inicio)')
  expect(del).not.toContain('guardarFila(admin, {}')
  expect(del).not.toContain('limpiarBucketBranding')
  expect(del).toContain('pendiente')
})

test('10. tras restaurar, el editor adopta los overrides que devuelve la API (no {})', () => {
  const pagina = leer('src/app/(dashboard)/admin/configuracion/page.tsx')
  const ini = pagina.indexOf('const restaurarTodo')
  const fin = pagina.indexOf('}, [showToast, irAlCampo])', ini)
  expect(ini).toBeGreaterThan(-1)
  expect(fin).toBeGreaterThan(ini)
  const bloque = pagina.slice(ini, fin)
  expect(bloque).toContain('data.overrides')
  expect(bloque).not.toContain('setOverrides({})')
  expect(bloque).not.toContain('setOverridesBase({})')
})
