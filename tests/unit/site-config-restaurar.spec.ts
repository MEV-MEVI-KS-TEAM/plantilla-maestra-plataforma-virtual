import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CONFIG } from '@/lib/config'
import { CLAVES_EDITABLES, mergeSiteConfig, type SiteConfigOverrides } from '@/lib/site-config-core'
import { recortarOverrides, validarOverrides } from '@/lib/site-config-validacion'
import { prepararParaPublicar } from '@/lib/site-config-editor'
import { borrarLogosSinReferencia } from '@/lib/site-config-storage'
import {
  CLAVES_DISENO,
  CLAVES_LOGO_BRANDING,
  CLAVES_NEGOCIO,
  MARGEN_LOGOS_MS,
  conservarNegocioDelBorrador,
  logosABorrar,
  restaurarDiseno,
  verificarConservados,
} from '@/lib/site-config-restaurar'

/**
 * #279 — «Restaurar diseño original» regresa SOLO el diseño (decisión de Kevin,
 * 30-sep-2026). Lo que protegen estas pruebas:
 *   · que TODA clave editable esté clasificada (diseño o negocio) y una sola vez;
 *   · que cada clave de negocio sobreviva con su valor y cada clave de diseño se vaya;
 *   · que la fila restaurada siga siendo publicable y que el merge (lo que pinta
 *     la landing) muestre el negocio EDITADO y el diseño de fábrica;
 *   · que el editor conserve lo que el admin tecleó en campos del negocio sin publicar;
 *   · que solo se borren del bucket los logos sin referencia y fuera del margen;
 *   · que la API, el editor y los textos de entrega usen esto.
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

test('2. lo nombrado por Kevin y los dudosos están del lado correcto', () => {
  // Diseño que Kevin nombró: logo, colores y los textos de hero y secciones.
  for (const c of ['logo', 'logoOscuro', 'colores.primario', 'colores.acento', 'landing.hero_titulo',
    'landing.hero_subtitulo', 'landing.cta_titulo', 'landing.faq_titulo', 'landing.programas_titulo']) {
    expect(CLAVES_DISENO as ReadonlyArray<string>, c).toContain(c)
  }
  // Negocio que Kevin nombró.
  for (const c of ['nombre', 'whatsapp', 'contactoEmail', 'email', 'contactoTelefono', 'redes.facebook',
    'redes.instagram', 'precios.inscripcion', 'precios.mensualidadSecundaria3Meses', 'modalidades',
    'licenciaturas.inscripcion', 'licenciaturas.modalidades', 'tipoCambioMXN']) {
    expect(CLAVES_NEGOCIO as ReadonlyArray<string>, c).toContain(c)
  }
  // Dudosos → se conservan (identidad y contenido con datos de la escuela).
  for (const c of ['tagline', 'landing.ciudad', 'landing.cct', 'landing.contadores', 'landing.testimonios',
    'landing.faq_items', 'landing.proceso_pasos', 'landing.respaldo_badges',
    'landing.licenciaturas_carreras', 'landing.licenciaturas_pasos']) {
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
  // colores se queda sin nada → la cáscara vacía se poda; landing conserva lo del negocio.
  expect('colores' in r).toBe(false)
  expect(Object.keys(r.landing as Obj).sort()).toEqual([
    'cct', 'ciudad', 'contadores', 'faq_items', 'licenciaturas_carreras', 'licenciaturas_pasos',
    'proceso_pasos', 'respaldo_badges', 'testimonios',
  ])
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
    landing: {
      hero_titulo: 'Título de prueba 279',
      cta_titulo: 'Llamado QA',
      ciudad: 'Puebla',
      faq_items: [{ q: '¿Cuál es el horario?', a: 'Lunes a viernes de 9 a 18 h.' }],
    },
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
  // Los logos los escribe la ruta de subida, no el PUT: se agregan como ella.
  const fila = {
    ...(publicado.overrides as Obj),
    logo: 'https://qa279.supabase.co/storage/v1/object/public/branding/logo-claro-1.png',
    logoOscuro: 'https://qa279.supabase.co/storage/v1/object/public/branding/logo-oscuro-2.png',
  }

  const restaurada = restaurarDiseno(fila)
  expect(restaurada).not.toHaveProperty('logo')
  expect(restaurada).not.toHaveProperty('logoOscuro')
  const overrides = recortarOverrides(restaurada, BASE)
  // El siguiente «Publicar cambios» del editor (mismo cuerpo que manda) pasa.
  const otraVez = validarOverrides(prepararParaPublicar(overrides), BASE)
  expect(otraVez.ok, otraVez.ok ? '' : `${otraVez.error} (${otraVez.clave})`).toBe(true)
  expect(verificarConservados(overrides, BASE)).toBeNull()

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
  expect(JSON.stringify(m.landing.faq_items)).toContain('Lunes a viernes de 9 a 18 h.')
})

test('8. un dato del negocio conservado que no pasa la validación queda como `pendiente` con su campo', () => {
  const pend = verificarConservados({ contactoEmail: 'no-es-correo' } as SiteConfigOverrides, BASE)
  expect(pend).not.toBeNull()
  expect(pend?.clave).toBe('contactoEmail')
  expect(verificarConservados({}, BASE)).toBeNull()
})

// ─── 4. El borrador del editor ───────────────────────────────────────────────

test('9. tras restaurar, el borrador conserva lo que el admin CAMBIÓ en campos del negocio y suelta el diseño', () => {
  // Lo que la pestaña cargó (publicado en ese momento).
  const base = {
    whatsapp: '525511223344',
    precios: { inscripcion: 700 },
    redes: { facebook: 'https://facebook.com/a' },
    colores: { primario: '#222222' },
    landing: { hero_titulo: 'x' },
  } as unknown as SiteConfigOverrides
  const conservados = { whatsapp: '525511223344', precios: { inscripcion: 700 }, redes: { facebook: 'https://facebook.com/a' } } as SiteConfigOverrides
  const borrador = {
    whatsapp: '523312345678', // tecleado y sin publicar → se queda
    redes: { facebook: 'https://facebook.com/a' },
    // precios.inscripcion quitado con el «Restaurar» del campo → también sin precio
    colores: { primario: '#111111' }, // diseño en el borrador → se va
    landing: { hero_titulo: 'x', faq_items: [{ q: 'q', a: 'a' }] }, // FAQ nueva sin publicar → se queda
  } as unknown as SiteConfigOverrides
  const r = conservarNegocioDelBorrador(conservados, borrador, base) as Obj
  expect(r.whatsapp).toBe('523312345678')
  expect(r).not.toHaveProperty('precios')
  expect(r).not.toHaveProperty('colores')
  expect(r.landing).toEqual({ faq_items: [{ q: 'q', a: 'a' }] })
  expect(r.redes).toEqual({ facebook: 'https://facebook.com/a' })
  // Sin nada sin publicar, el borrador queda idéntico a lo conservado.
  expect(conservarNegocioDelBorrador(conservados, conservados, conservados)).toEqual(conservados)
  expect(conservarNegocioDelBorrador({}, {}, {})).toEqual({})
})

test('9b. una pestaña desfasada no reinyecta valores viejos: lo que el admin no tocó sigue lo conservado', () => {
  // La pestaña cargó WhatsApp viejo y sin Facebook; otra pestaña publicó después
  // WhatsApp nuevo, Facebook y una inscripción nueva. El admin no tocó nada.
  const base = { whatsapp: '5211111', precios: { inscripcion: 1500 } } as SiteConfigOverrides
  const borrador = { whatsapp: '5211111', precios: { inscripcion: 1500 }, colores: { primario: '#111111' } } as unknown as SiteConfigOverrides
  const conservados = {
    whatsapp: '5212222',
    precios: { inscripcion: 1800 },
    redes: { facebook: 'https://facebook.com/nuevo' },
  } as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(conservados, borrador, base)).toEqual(conservados)
  // Si el admin sí cambió el correo, ese grupo (los dos correos) se pone encima.
  const conCorreo = { ...borrador, email: 'nuevo@escuela.test', contactoEmail: 'nuevo@escuela.test' } as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(conservados, conCorreo, base)).toEqual({
    ...conservados,
    email: 'nuevo@escuela.test',
    contactoEmail: 'nuevo@escuela.test',
  })
})

test('9d. los dos correos y los dos CCT van como grupo: nunca mitad de una pestaña y mitad de otra', () => {
  // La otra pestaña publicó los dos correos en «c»; aquí el borrador cambió solo
  // `email` (el otro coincidía con lo cargado). Campo por campo quedaría b + c.
  const correo = conservarNegocioDelBorrador(
    { email: 'c@x.test', contactoEmail: 'c@x.test' } as SiteConfigOverrides,
    { email: 'b@x.test', contactoEmail: 'a@x.test' } as SiteConfigOverrides,
    { email: 'a@x.test', contactoEmail: 'a@x.test' } as SiteConfigOverrides,
  )
  expect(correo).toEqual({ email: 'b@x.test', contactoEmail: 'a@x.test' })
  const cct = conservarNegocioDelBorrador(
    { cct: 'C', landing: { cct: 'C' } } as unknown as SiteConfigOverrides,
    { cct: 'B', landing: { cct: 'A' } } as unknown as SiteConfigOverrides,
    { cct: 'A', landing: { cct: 'A' } } as unknown as SiteConfigOverrides,
  )
  expect(cct).toEqual({ cct: 'B', landing: { cct: 'A' } })
})

test('9c. los planes se fusionan plan por plan y campo por campo; los grupos del editor van enteros', () => {
  // Planes: la pestaña cargó {} y otra publicó 6m apagado + 3m a 1000. Aquí el
  // admin solo cambió la mensualidad de 3m. Nada de lo ajeno se pierde.
  const base = {} as SiteConfigOverrides
  const borrador = { modalidades: { '3_meses': { mensualidad: 1200 } } } as unknown as SiteConfigOverrides
  const conservados = {
    modalidades: { '3_meses': { mensualidad: 1000, activa: true }, '6_meses': { activa: false } },
  } as unknown as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(conservados, borrador, base)).toEqual({
    modalidades: { '3_meses': { mensualidad: 1200, activa: true }, '6_meses': { activa: false } },
  })
  // Quitar con «Restaurar plan» el único override que cargó no borra los planes ajenos.
  const base2 = { modalidades: { '3_meses': { mensualidad: 900 } } } as unknown as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(conservados, {}, base2)).toEqual({
    modalidades: { '3_meses': { activa: true }, '6_meses': { activa: false } },
  })
  // Lo mismo en licenciaturas.
  const lic = conservarNegocioDelBorrador(
    { licenciaturas: { modalidades: { a: { mensualidad: 1 }, b: { mensualidad: 2 } } } } as unknown as SiteConfigOverrides,
    { licenciaturas: { modalidades: { a: { mensualidad: 5 } } } } as unknown as SiteConfigOverrides,
    { licenciaturas: { modalidades: { a: { mensualidad: 1 } } } } as unknown as SiteConfigOverrides,
  ) as Obj
  expect(lic).toEqual({ licenciaturas: { modalidades: { a: { mensualidad: 5 }, b: { mensualidad: 2 } } } })

  // WhatsApp: el NÚMERO manda.
  const baseW = { whatsapp: '521111', contactoTelefono: '521111', whatsappDisplay: '52 1111' } as SiteConfigOverrides
  const consW = { whatsapp: '522222', contactoTelefono: '522222', whatsappDisplay: '52 2222', whatsappUrl: 'https://wa.me/522222' } as SiteConfigOverrides
  // (a) Otra pestaña publicó otro número y aquí solo se retocó el texto: el
  //     retoque era del número viejo → se queda TODO lo del servidor.
  const soloTexto = { whatsapp: '521111', contactoTelefono: '521111', whatsappDisplay: '(52) 1111' } as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(consW, soloTexto, baseW)).toEqual(consW)
  // (a') Igual si la pestaña cargó sin WhatsApp y solo escribió un texto.
  expect(conservarNegocioDelBorrador(consW, { whatsappDisplay: '33 1234 5678' } as SiteConfigOverrides, {})).toEqual(consW)
  // (b) Mismo número en el servidor y retoque del texto: el texto del borrador vale.
  const mismoNumero = { ...baseW, whatsappUrl: 'https://wa.me/521111' } as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(mismoNumero, soloTexto, baseW)).toEqual({ ...mismoNumero, whatsappDisplay: '(52) 1111' })
  // (c) El admin capturó otro número: número y texto del borrador (la URL la deriva el servidor al publicar).
  const nuevo = { whatsapp: '523333', contactoTelefono: '523333', whatsappDisplay: '52 3333' } as SiteConfigOverrides
  expect(conservarNegocioDelBorrador(consW, nuevo, baseW)).toEqual({ ...nuevo, whatsappUrl: 'https://wa.me/522222' })
  // (d) Sin tocar nada del WhatsApp, se queda el del servidor completo.
  expect(conservarNegocioDelBorrador(consW, baseW, baseW)).toEqual(consW)
})

// ─── 5. Bucket branding ──────────────────────────────────────────────────────

test('10. solo se borran logos sin referencia y subidos antes del corte', () => {
  const corte = 1_000_000
  const nombres = [
    'logo-claro-900000.png', // viejo y sin referencia → se borra
    'logo-oscuro-900001.jpg', // viejo y sin referencia → se borra
    'logo-claro-900002.png', // viejo pero referenciado → se queda
    'logo-claro-1000001.png', // después del corte → se queda
    'favicon.png', // no es un logo de la ruta de subida → se queda
    'hack-logo-claro-1.png',
    'logo-claro-abc.png',
    'logo-medio-900003.png',
  ]
  expect(logosABorrar(nombres, new Set(['logo-claro-900002.png']), corte)).toEqual([
    'logo-claro-900000.png',
    'logo-oscuro-900001.jpg',
  ])
  expect(logosABorrar([], new Set(), corte)).toEqual([])
  expect(MARGEN_LOGOS_MS).toBeGreaterThanOrEqual(60_000)
  // Uno reciente que la fila de ANTES usaba ya estaba aplicado: el margen no lo protege.
  expect(logosABorrar(nombres, new Set(['logo-claro-900002.png']), corte, new Set(['logo-claro-1000001.png']))).toEqual([
    'logo-claro-900000.png',
    'logo-oscuro-900001.jpg',
    'logo-claro-1000001.png',
  ])
  // …pero si la fila de DESPUÉS lo vuelve a referenciar, se queda.
  expect(logosABorrar(['logo-claro-1000001.png'], new Set(['logo-claro-1000001.png']), corte, new Set(['logo-claro-1000001.png']))).toEqual([])
})

function adminFalso(paginas: Array<Array<{ name: string; id: string | null }>>, opciones: { errorLista?: boolean; errorBorrar?: boolean } = {}) {
  const listados: number[] = []
  const borrados: string[][] = []
  const admin = {
    storage: {
      from: () => ({
        list: async (_prefijo: string, o: { limit: number; offset: number }) => {
          listados.push(o.offset)
          if (opciones.errorLista) return { data: null, error: { message: 'sin permiso' } }
          return { data: paginas[o.offset / o.limit] ?? [], error: null }
        },
        remove: async (lote: string[]) => {
          borrados.push(lote)
          return { error: opciones.errorBorrar ? { message: 'falló' } : null }
        },
      }),
    },
  } as unknown as SupabaseClient
  return { admin, listados, borrados }
}

test('11. borrarLogosSinReferencia: pagina, ignora carpetas, respeta la referencia y borra por lotes', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://qa279.supabase.co'
  const pagina1 = Array.from({ length: 1000 }, (_, i) => ({ name: `logo-claro-${1000 + i}.png`, id: `id${i}` }))
  const pagina2 = [
    { name: 'logo-oscuro-5000.png', id: 'x1' }, // referenciado por la fila → se queda
    { name: 'otro.png', id: 'x2' }, // no es logo → se queda
    { name: 'logo-oscuro-1500.png', id: null }, // carpeta virtual (aunque se llame como logo) → se ignora
    { name: `logo-claro-${Date.now()}.png`, id: 'x3' }, // después del corte → se queda
  ]
  const { admin, listados, borrados } = adminFalso([pagina1, pagina2])
  const fila = { logoOscuro: 'https://qa279.supabase.co/storage/v1/object/public/branding/logo-oscuro-5000.png' }
  await borrarLogosSinReferencia(admin, fila, Date.now() - 60_000)
  expect(listados).toEqual([0, 1000])
  expect(borrados.length).toBe(1)
  expect(borrados[0].length).toBe(1000)
  expect(borrados.flat()).not.toContain('logo-oscuro-5000.png')
  expect(borrados.flat()).not.toContain('otro.png')
  expect(borrados.flat()).not.toContain('logo-oscuro-1500.png')
})

test('11b. borrarLogosSinReferencia: el logo reciente que la fila previa usaba sí se borra', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://qa279.supabase.co'
  const reciente = `logo-claro-${Date.now()}.png`
  const aMedioCamino = `logo-oscuro-${Date.now()}.png`
  const { admin, borrados } = adminFalso([[{ name: reciente, id: 'a' }, { name: aMedioCamino, id: 'b' }]])
  const previa = { logo: `https://qa279.supabase.co/storage/v1/object/public/branding/${reciente}` }
  await borrarLogosSinReferencia(admin, {}, Date.now() - MARGEN_LOGOS_MS, previa)
  expect(borrados).toEqual([[reciente]])
})

test('12. borrarLogosSinReferencia: si no puede listar, no borra; si no puede borrar, no lanza', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://qa279.supabase.co'
  const sinLista = adminFalso([[{ name: 'logo-claro-1.png', id: 'a' }]], { errorLista: true })
  await borrarLogosSinReferencia(sinLista.admin, {}, Date.now())
  expect(sinLista.borrados).toEqual([])
  const sinBorrar = adminFalso([[{ name: 'logo-claro-1.png', id: 'a' }]], { errorBorrar: true })
  await expect(borrarLogosSinReferencia(sinBorrar.admin, {}, Date.now())).resolves.toBeUndefined()
  expect(sinBorrar.borrados).toEqual([['logo-claro-1.png']])
})

// ─── 6. La API, el editor y los textos de entrega usan esto ──────────────────

test('13. el DELETE restaura solo el diseño y ya no vacía la fila ni el bucket', () => {
  const ruta = leer('src/app/api/admin/configuracion/route.ts')
  const del = ruta.slice(ruta.indexOf('export async function DELETE'))
  expect(del).toContain('restaurarDiseno(previa?.data)')
  expect(del).toContain('borrarLogosSinReferencia(admin, fila, inicio - MARGEN_LOGOS_MS, usados)')
  expect(del).toContain('previa && esObjetoPlano(previa.data) ? previa.data : null')
  expect(del).toContain('if (fila) await borrarLogosSinReferencia')
  expect(del).toContain('verificarConservados(overrides')
  expect(del).not.toContain('guardarFila(admin, {}')
  expect(leer('src/lib/site-config-storage.ts')).not.toContain('limpiarBucketBranding')
})

test('14. tras restaurar, el editor parte de lo conservado y le pone encima el negocio sin publicar', () => {
  const pagina = leer('src/app/(dashboard)/admin/configuracion/page.tsx')
  const ini = pagina.indexOf('const restaurarDisenoOriginal')
  const fin = pagina.indexOf('}, [showToast, irAlCampo])', ini)
  expect(ini).toBeGreaterThan(-1)
  expect(fin).toBeGreaterThan(ini)
  const bloque = pagina.slice(ini, fin)
  // Lee el borrador VIGENTE (lo tecleado mientras el DELETE estaba en vuelo cuenta).
  expect(bloque).toContain('conservarNegocioDelBorrador(conservados, overridesVigentes.current, baseVigente.current)')
  const efecto = pagina.slice(pagina.indexOf('overridesVigentes.current = overrides'))
  expect(efecto.slice(0, 200)).toContain('baseVigente.current = overridesBase')
  expect(efecto.slice(0, 200)).toContain('}, [overrides, overridesBase])')
  expect(bloque).toContain('setOverrides(borrador)')
  expect(bloque).toContain('setOverridesBase(conservados)')
  // El aviso se calcula sobre el borrador que queda, no solo sobre lo publicado.
  expect(bloque).toContain('verificarConservados(borrador, mergeSiteConfig(CONFIG, {}))')
  expect(bloque).not.toContain('setOverrides({})')
  expect(bloque).not.toContain('setOverridesBase({})')
})

test('15. el PDF y el mensaje de entrega ya no prometen que Restaurar regresa todo', () => {
  const doc = leer('scripts/entrega/documento.mjs')
  expect(doc).not.toContain('exactamente a como se te entregó')
  expect(doc).toContain('se quedan como')
  const msg = leer('scripts/entrega/generar-entrega.mjs')
  expect(msg).not.toContain('devuelve todo a como se te entregó')
  expect(msg).toContain('no cambian; cada campo tiene además su propio «Restaurar»')
  // Las dos piezas dicen lo mismo que el modal: frases DE VENTA, y nombran el
  // contenido que se queda — DENTRO del párrafo de Restaurar, no en todo el archivo.
  const recorte = (texto: string, desde: string, hasta: string) => {
    const i = texto.indexOf(desde)
    const j = texto.indexOf(hasta, i)
    expect(i, desde).toBeGreaterThan(-1)
    expect(j, hasta).toBeGreaterThan(i)
    return texto.slice(i, j)
  }
  const parrafoDoc = recorte(doc.replace(/\s+/g, ' '), 'Restaurar diseño original</b> devuelve', 'Nada de lo que pruebes')
  const parrafoMsg = recorte(msg, '«Restaurar diseño original» devuelve', 'probar sin miedo')
  for (const [nombre, texto] of [['documento.mjs', parrafoDoc], ['generar-entrega.mjs', parrafoMsg]]) {
    for (const f of ['frases de venta', 'tus planes', 'preguntas frecuentes', 'testimonios', 'cifras', 'pasos', 'respaldos', 'carreras']) {
      expect(texto, `${nombre}: ${f}`).toContain(f)
    }
  }
})
