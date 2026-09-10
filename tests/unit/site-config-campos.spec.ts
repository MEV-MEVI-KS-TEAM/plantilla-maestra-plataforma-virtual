import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { CLAVES_EDITABLES, PLACEHOLDERS, type ClaveEditable } from '@/lib/site-config-core'
import {
  CAMPOS,
  CAMPOS_POR_SECCION,
  LIMITES,
  SECCIONES,
  campoPorClave,
  type Campo,
  type SeccionCampo,
  type TipoCampo,
  type TipoSubcampo,
} from '@/lib/site-config-campos'

/**
 * F3 — catálogo declarativo de campos editables (site-config-campos.ts).
 *
 * Lo que protegen estas pruebas: que el catálogo y la lista blanca sean la
 * MISMA lista (una clave editable sin descriptor sería ineditable en el
 * editor; un descriptor sin clave sería un control que guarda a la nada), que
 * los límites del brief sean los que son, y que los defaults de config.ts
 * quepan en sus límites (si no, el editor prellenado no dejaría guardar).
 *
 * ⚠️ Se importa de '@/lib/site-config-core', NUNCA de '@/lib/site-config'
 * (lleva `server-only`).
 */

const TIPOS: ReadonlyArray<TipoCampo> = [
  'texto', 'textarea', 'hex', 'url', 'telefono', 'email', 'entero', 'decimal', 'lista-texto', 'lista-objetos', 'modalidades',
]
const TIPOS_SUB: ReadonlyArray<TipoSubcampo> = ['texto', 'textarea', 'entero']
const SECCIONES_VALIDAS: ReadonlyArray<SeccionCampo> = [
  'identidad', 'contacto', 'redes', 'colores', 'landing', 'precios', 'modalidades',
]

function leer(ruta: string): unknown {
  let actual: unknown = JSON.parse(JSON.stringify(CONFIG))
  for (const seg of ruta.split('.')) actual = (actual as Record<string, unknown>)[seg]
  return actual
}

function campo(clave: ClaveEditable): Campo {
  const c = campoPorClave(clave)
  if (!c) throw new Error(`sin descriptor: ${clave}`)
  return c
}

test('1. toda ClaveEditable tiene exactamente un descriptor y ninguno sobra', () => {
  const claves = CAMPOS.map((c) => c.clave)
  expect(new Set(claves).size, 'hay claves duplicadas en CAMPOS').toBe(claves.length)
  expect([...claves].sort()).toEqual([...CLAVES_EDITABLES].sort())
  for (const clave of CLAVES_EDITABLES) expect(campoPorClave(clave)?.clave).toBe(clave)
  expect(campoPorClave('inventada')).toBeUndefined()
  expect(campoPorClave('modo')).toBeUndefined()
})

test('2. los límites del brief son los indicados', () => {
  expect(campo('nombre').max).toBe(40)
  expect(campo('nombreCompleto').max).toBe(80)
  expect(campo('tagline').max).toBe(90)
  expect(campo('landing.hero_titulo').max).toBe(60)
  expect(campo('landing.hero_highlight').max).toBe(40)
  expect(campo('landing.hero_subtitulo').max).toBe(160)
  // badges: 30 por elemento; hero_badges como mucho 4
  expect(campo('landing.hero_badges').max).toBe(30)
  expect(campo('landing.hero_badges').maxItems).toBe(4)
  expect(campo('landing.respaldo_badges').max).toBe(30)
  // testimonios: máx 6 y quote 300
  expect(campo('landing.testimonios').maxItems).toBe(6)
  expect(campo('landing.testimonios').campos!.find((s) => s.clave === 'quote')!.max).toBe(300)
  // transformación: el brief decía 30 "como badge", pero los defaults son
  // oraciones de 51-58 caracteres; con 30 el editor rechazaría la landing tal
  // cual se ve hoy (lo comprueba la prueba 6). Ver LIMITES.bullet.
  expect(LIMITES.bullet).toBeGreaterThanOrEqual(60)
  expect(campo('landing.transformacion_sin').max).toBe(LIMITES.bullet)
  expect(campo('landing.transformacion_con').max).toBe(LIMITES.bullet)
  // precios: enteros 0..50000, también la mensualidad de modalidades
  for (const clave of ['precios.inscripcion', 'precios.certificacionSecundaria', 'precios.certificacionPreparatoria', 'modalidades'] as const) {
    expect(campo(clave).min, clave).toBe(0)
    expect(campo(clave).max, clave).toBe(50000)
  }
  // el resto de máximos de lista
  expect(campo('landing.contadores').maxItems).toBe(4)
  expect(campo('landing.dolor_items').maxItems).toBe(6)
  expect(campo('landing.proceso_pasos').maxItems).toBe(6)
  expect(campo('landing.beneficios_items').maxItems).toBe(6)
  expect(campo('landing.faq_items').maxItems).toBe(8)
  expect(campo('landing.transformacion_sin').maxItems).toBe(6)
  expect(campo('landing.transformacion_con').maxItems).toBe(6)
  expect(campo('landing.faq_items').campos!.find((s) => s.clave === 'q')!.max).toBe(120)
  expect(campo('landing.faq_items').campos!.find((s) => s.clave === 'a')!.max).toBe(500)
})

test('3. tipos y secciones válidos; toda lista tiene maxItems; lista-objetos tiene campos con max', () => {
  for (const c of CAMPOS) {
    expect(TIPOS, `${c.clave}: tipo '${c.tipo}'`).toContain(c.tipo)
    expect(SECCIONES_VALIDAS, `${c.clave}: seccion '${c.seccion}'`).toContain(c.seccion)
    expect(c.etiqueta.trim().length, `${c.clave}: etiqueta vacía`).toBeGreaterThan(0)

    const esLista = c.tipo === 'lista-texto' || c.tipo === 'lista-objetos'
    if (esLista) {
      expect(c.maxItems, `${c.clave}: lista sin maxItems`).toBeGreaterThan(0)
      if (c.minItems !== undefined) expect(c.minItems).toBeLessThanOrEqual(c.maxItems!)
    } else {
      expect(c.maxItems, `${c.clave}: maxItems en algo que no es lista`).toBeUndefined()
      expect(c.minItems, `${c.clave}: minItems en algo que no es lista`).toBeUndefined()
    }

    if (c.tipo === 'lista-objetos') {
      expect(c.campos?.length, `${c.clave}: lista-objetos sin campos`).toBeGreaterThan(0)
      const subclaves = c.campos!.map((s) => s.clave)
      expect(new Set(subclaves).size).toBe(subclaves.length)
      for (const s of c.campos!) {
        expect(TIPOS_SUB, `${c.clave}.${s.clave}: tipo '${s.tipo}'`).toContain(s.tipo)
        expect(s.max, `${c.clave}.${s.clave}: sin max`).toBeGreaterThan(0)
        expect(s.etiqueta.trim().length).toBeGreaterThan(0)
      }
    } else {
      expect(c.campos, `${c.clave}: campos fuera de lista-objetos`).toBeUndefined()
    }

    if (c.tipo === 'lista-texto') expect(c.max, `${c.clave}: lista-texto sin max por elemento`).toBeGreaterThan(0)
    if (c.tipo === 'entero' || c.tipo === 'decimal' || c.tipo === 'modalidades') {
      expect(c.min, `${c.clave}: sin min`).toBeDefined()
      expect(c.max, `${c.clave}: sin max`).toBeDefined()
      expect(c.min!).toBeLessThanOrEqual(c.max!)
    }
    if (['texto', 'textarea', 'hex', 'url', 'telefono', 'email'].includes(c.tipo)) {
      expect(c.max, `${c.clave}: texto sin max`).toBeGreaterThan(0)
      expect(c.min, `${c.clave}: min en un texto`).toBeUndefined()
    }
    for (const p of c.placeholders ?? []) expect(PLACEHOLDERS).toContain(p)
  }
})

test('4. el tipo del descriptor coincide con el tipo del default en CONFIG', () => {
  for (const c of CAMPOS) {
    const v = leer(c.clave)
    switch (c.tipo) {
      case 'entero':
      case 'decimal':
        expect(typeof v, c.clave).toBe('number')
        break
      case 'lista-texto':
        expect(Array.isArray(v), c.clave).toBe(true)
        for (const el of v as unknown[]) expect(typeof el, c.clave).toBe('string')
        break
      case 'lista-objetos': {
        expect(Array.isArray(v), c.clave).toBe(true)
        // Cada elemento del default tiene EXACTAMENTE los subcampos declarados
        // (el normalizador del merge proyecta a esos mismos campos).
        const esperadas = c.campos!.map((s) => s.clave).sort()
        for (const el of v as Record<string, unknown>[]) {
          expect(Object.keys(el).sort(), c.clave).toEqual(esperadas)
          for (const s of c.campos!) {
            expect(typeof el[s.clave], `${c.clave}.${s.clave}`).toBe(s.tipo === 'entero' ? 'number' : 'string')
          }
        }
        break
      }
      case 'modalidades':
        expect(Array.isArray(v), c.clave).toBe(true)
        break
      default:
        expect(typeof v, c.clave).toBe('string')
    }
  }
})

test('5. noVisibleEnLanding marca exactamente lo que la landing no pinta', () => {
  const ocultas = CAMPOS.filter((c) => c.noVisibleEnLanding).map((c) => c.clave).sort()
  expect(ocultas).toEqual(['landing.hero_badges', 'landing.respaldo_badges', 'landing.respaldo_titulo'])
})

test('6. los defaults de config.ts caben en los límites del catálogo', () => {
  // Si esto falla, el editor prellenado con los defaults no dejaría guardar un
  // formulario sin tocar: el admin vería "no guarda" en un campo que nunca editó.
  for (const c of CAMPOS) {
    const v = leer(c.clave)
    switch (c.tipo) {
      case 'entero':
      case 'decimal':
        expect(v as number, c.clave).toBeGreaterThanOrEqual(c.min!)
        expect(v as number, c.clave).toBeLessThanOrEqual(c.max!)
        break
      case 'modalidades':
        for (const m of v as Array<{ id: string; mensualidad: number }>) {
          expect(m.mensualidad, `modalidades.${m.id}`).toBeGreaterThanOrEqual(c.min!)
          expect(m.mensualidad, `modalidades.${m.id}`).toBeLessThanOrEqual(c.max!)
        }
        break
      case 'lista-texto': {
        const arr = v as string[]
        expect(arr.length, c.clave).toBeLessThanOrEqual(c.maxItems!)
        expect(arr.length, c.clave).toBeGreaterThanOrEqual(c.minItems ?? 0)
        for (const el of arr) expect(el.length, `${c.clave}: "${el}"`).toBeLessThanOrEqual(c.max!)
        break
      }
      case 'lista-objetos': {
        const arr = v as Record<string, string | number>[]
        expect(arr.length, c.clave).toBeLessThanOrEqual(c.maxItems!)
        expect(arr.length, c.clave).toBeGreaterThanOrEqual(c.minItems ?? 0)
        for (const el of arr) {
          for (const s of c.campos!) {
            const x = el[s.clave]
            if (s.tipo === 'entero') {
              expect(x as number, `${c.clave}.${s.clave}`).toBeGreaterThanOrEqual(s.min ?? 0)
              expect(x as number, `${c.clave}.${s.clave}`).toBeLessThanOrEqual(s.max)
            } else {
              expect((x as string).length, `${c.clave}.${s.clave}: "${x}"`).toBeLessThanOrEqual(s.max)
            }
          }
        }
        break
      }
      default:
        expect((v as string).length, `${c.clave}: "${v}"`).toBeLessThanOrEqual(c.max!)
    }
  }
})

test('7. todo {x} que aparece en un default está declarado en placeholders del campo', () => {
  const re = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g
  const usados = (s: string) => [...s.matchAll(re)].map((m) => m[1])
  for (const c of CAMPOS) {
    const v = leer(c.clave)
    const textos: string[] = []
    if (typeof v === 'string') textos.push(v)
    else if (c.tipo === 'lista-texto') textos.push(...(v as string[]))
    else if (c.tipo === 'lista-objetos') {
      for (const el of v as Record<string, unknown>[]) {
        for (const x of Object.values(el)) if (typeof x === 'string') textos.push(x)
      }
    }
    for (const t of textos) {
      for (const p of usados(t)) {
        expect(c.placeholders ?? [], `${c.clave} usa {${p}} sin declararlo`).toContain(p)
      }
    }
  }
  // Y los defaults que el contrato dice que llevan placeholder, lo llevan.
  expect(usados(CONFIG.landing.programas_subtitulo)).toEqual(['inscripcion'])
  expect(usados(CONFIG.landing.transformacion_con[2])).toEqual(['duracion'])
  expect(usados(CONFIG.landing.beneficios_items[4].desc)).toEqual(['duracion'])
  expect(usados(CONFIG.landing.faq_items[0].a)).toEqual(['duracion'])
  expect(usados(CONFIG.landing.faq_items[4].a)).toEqual(['whatsapp'])
})

test('8. CAMPOS_POR_SECCION y SECCIONES cubren todo, sin repetir y en el orden de CAMPOS', () => {
  const planas = SECCIONES_VALIDAS.flatMap((s) => CAMPOS_POR_SECCION[s])
  expect(planas.length).toBe(CAMPOS.length)
  expect(new Set(planas.map((c) => c.clave)).size).toBe(CAMPOS.length)
  for (const s of SECCIONES_VALIDAS) {
    for (const c of CAMPOS_POR_SECCION[s]) expect(c.seccion).toBe(s)
    expect(CAMPOS_POR_SECCION[s].map((c) => c.clave)).toEqual(
      CAMPOS.filter((c) => c.seccion === s).map((c) => c.clave),
    )
  }
  expect(SECCIONES.map((s) => s.id).sort()).toEqual([...SECCIONES_VALIDAS].sort())
  // Ninguna sección queda vacía: si se retira la última clave de una, sobra la sección.
  for (const s of SECCIONES_VALIDAS) expect(CAMPOS_POR_SECCION[s].length, s).toBeGreaterThan(0)
})

test('9. el catálogo distingue los tres campos de precio y las modalidades como tipos propios', () => {
  expect(campo('precios.inscripcion').tipo).toBe('entero')
  expect(campo('modalidades').tipo).toBe('modalidades')
  expect(campo('colores.acento').tipo).toBe('hex')
  expect(campo('logo').tipo).toBe('url')
  expect(campo('email').tipo).toBe('email')
  expect(campo('whatsapp').tipo).toBe('telefono')
  expect(campo('landing.hero_subtitulo').tipo).toBe('textarea')
  expect(campo('landing.transformacion_sin').tipo).toBe('lista-texto')
  expect(campo('landing.faq_items').tipo).toBe('lista-objetos')
  // Los textos de identidad/contacto NO interpolan; los de landing sí.
  expect(campo('nombre').placeholders).toBeUndefined()
  expect(campo('landing.faq_items').placeholders).toEqual([...PLACEHOLDERS])
})
