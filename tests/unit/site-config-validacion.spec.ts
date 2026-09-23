import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'
import { etiquetaNivel } from '@/lib/niveles-ui'
import { planesPorNivel } from '@/lib/modalidades'
import { mensualidadDe } from '@/lib/precios-nivel'
import { CLAVES_EDITABLES, mergeSiteConfig } from '@/lib/site-config-core'
import {
  validarOverrides,
  recortarAEditables,
  recortarOverrides,
  pathDesdeUrlBranding,
  normalizarOrigen,
  PREFIJO_PUBLICO_BRANDING,
  type ResultadoValidacion,
} from '@/lib/site-config-validacion'

/**
 * F4 — validación del cuerpo del editor (site-config-validacion.ts).
 *
 * Lo que protegen estas pruebas: que NADA fuera de la lista blanca se guarde
 * (a ninguna profundidad, ni con nombres de prototipo), que cada tipo de campo
 * aplique la regla del catálogo (longitud, hex, URL de red, teléfono, entero),
 * que los arreglos respeten forma y tamaño, que `whatsappUrl` se derive y no
 * se escriba a mano, que el logo solo pueda venir del bucket, y que el objeto
 * devuelto sea el LIMPIO (trim, hex en mayúsculas, nulls fuera).
 *
 * ⚠️ Se importa de '@/lib/site-config-core' y '@/lib/site-config-validacion',
 * NUNCA de '@/lib/site-config' (lleva `server-only`).
 */

const ORIGEN = 'https://abcdefghij.supabase.co'
const BASE = () => mergeSiteConfig(CONFIG, {})

function v(body: unknown, origenStorage?: string): ResultadoValidacion {
  return validarOverrides(body, BASE(), origenStorage ? { origenStorage } : {})
}

/**
 * Para las pruebas de FORMA (lista blanca, limpieza, recorte): sin Secundaria
 * ni Preparatoria en la base, la regla del escalón (F2-7) no evalúa nada. Los
 * precios de cada clon son otros, y una cifra fija como 2500 puede invertir
 * su escalón (Búfalo cobra 2800 a 6 meses); esa regla tiene sus pruebas (26 bis).
 */
function vSinEscalon(body: unknown, origenStorage?: string): ResultadoValidacion {
  const base = { ...BASE(), niveles: [] } as unknown as ReturnType<typeof BASE>
  return validarOverrides(body, base, origenStorage ? { origenStorage } : {})
}

/** Afirma error y devuelve el mensaje para inspecciones extra. */
function error(r: ResultadoValidacion, clave?: string, fragmento?: string | RegExp): string {
  expect(r.ok, `se esperaba error y fue ok: ${JSON.stringify(r)}`).toBe(false)
  if (r.ok) throw new Error('unreachable')
  if (clave !== undefined) expect(r.clave).toBe(clave)
  if (fragmento !== undefined) expect(r.error).toMatch(fragmento)
  return r.error
}

function ok(r: ResultadoValidacion) {
  expect(r.ok, `se esperaba ok y fue error: ${JSON.stringify(r)}`).toBe(true)
  if (!r.ok) throw new Error('unreachable')
  return r.overrides as Record<string, unknown>
}

// ─── Cuerpo y lista blanca ───────────────────────────────────────────────────

test('1. body {} → ok con overrides {}', () => {
  expect(ok(v({}))).toEqual({})
})

test('2. cuerpo que no es objeto plano → error', () => {
  error(v(null), undefined, /objeto/)
  error(v('x'), undefined, /objeto/)
  error(v([]), undefined, /objeto/)
  error(v(42), undefined, /objeto/)
})

test('3. claves fuera de la lista blanca → "Clave no editable" con la ruta', () => {
  error(v({ modo: 'solo_cursos' }), 'modo', 'Clave no editable: modo')
  error(v({ prefijoMatricula: 'X' }), 'prefijoMatricula', 'Clave no editable: prefijoMatricula')
  error(v({ licenciaturas: { activas: true } }), 'licenciaturas', 'Clave no editable: licenciaturas')
  error(v({ landing: { mostrarCatalogoCursos: false } }), 'landing.mostrarCatalogoCursos',
    'Clave no editable: landing.mostrarCatalogoCursos')
  error(v({ colores: { inventado: '#000000' } }), 'colores.inventado', 'Clave no editable: colores.inventado')
  error(v({ precios: { plan3mMensualidad: 1 } }), 'precios.plan3mMensualidad')
  error(v({ redes: { tiktok: 'https://tiktok.com/x' } }), 'redes.tiktok')
  error(v({ landing: { convenios: ['x'] } }), 'landing.convenios')
})

test('4. __proto__ / constructor / prototype se rechazan a cualquier profundidad', () => {
  error(v(JSON.parse('{"__proto__": {"polluted": true}}')), '__proto__', 'Clave no editable: __proto__')
  error(v(JSON.parse('{"constructor": {"prototype": {}}}')), 'constructor')
  error(v(JSON.parse('{"colores": {"__proto__": {}}}')), 'colores.__proto__')
  error(v(JSON.parse('{"landing": {"prototype": "x"}}')), 'landing.prototype')
  error(v(JSON.parse('{"modalidades": {"__proto__": {"activa": false}}}')), 'modalidades.__proto__')
  error(v(JSON.parse('{"modalidades": {"3_meses": {"__proto__": {}}}}')), 'modalidades.3_meses.__proto__')
  error(v(JSON.parse('{"landing": {"faq_items": [{"q": "a", "a": "b", "__proto__": {}}]}}')), 'landing.faq_items')
  // Y el resultado nunca contamina el prototipo.
  expect(({} as Record<string, unknown>).polluted).toBeUndefined()
})

test('5. intermedio que no es objeto → error; intermedio null → se ignora', () => {
  error(v({ colores: 'rojo' }), 'colores', /objeto/)
  error(v({ landing: ['x'] }), 'landing', /objeto/)
  expect(ok(v({ colores: null, landing: null, precios: null, redes: null }))).toEqual({})
})

// ─── Textos ──────────────────────────────────────────────────────────────────

test('6. texto con < o > → error (sin HTML)', () => {
  error(v({ nombre: '<script>alert(1)</script>' }), 'nombre', /< ni >/)
  error(v({ landing: { hero_titulo: 'Hola <b>x</b>' } }), 'landing.hero_titulo', /< ni >/)
  error(v({ landing: { faq_items: [{ q: 'ok', a: '<img src=x>' }] } }), 'landing.faq_items', /< ni >/)
  error(v({ landing: { hero_badges: ['<x>'] } }), 'landing.hero_badges', /< ni >/)
})

test('7. longitud: nombre 41 → error, 40 ok; hero_titulo 61 → error, 60 ok', () => {
  error(v({ nombre: 'a'.repeat(41) }), 'nombre', /supera los 40/)
  expect(ok(v({ nombre: 'a'.repeat(40) })).nombre).toBe('a'.repeat(40))
  error(v({ landing: { hero_titulo: 'a'.repeat(61) } }), 'landing.hero_titulo', /supera los 60/)
  ok(v({ landing: { hero_titulo: 'a'.repeat(60) } }))
  error(v({ nombreCompleto: 'a'.repeat(81) }), 'nombreCompleto')
  error(v({ tagline: 'a'.repeat(91) }), 'tagline')
  error(v({ landing: { hero_subtitulo: 'a'.repeat(161) } }), 'landing.hero_subtitulo')
})

test('8. cadena vacía: error donde el default NO es vacío; ok donde sí lo es', () => {
  error(v({ nombre: '' }), 'nombre', /no puede quedar vacío/)
  error(v({ nombre: '   ' }), 'nombre', /no puede quedar vacío/)
  error(v({ landing: { hero_titulo: '' } }), 'landing.hero_titulo', /no puede quedar vacío/)
  // `email` sigue la MISMA regla que anuncia el titulo de esta prueba, pero la
  // linea estaba escrita al reves: fijaba "error" a mano, dando por hecho que
  // toda escuela publica un correo. Hay escuelas que solo atienden por WhatsApp
  // y lo traen vacio en su config.ts; para ellas el vacio es el dato correcto, y
  // rechazarlo dejaba inservible el panel ENTERO de "Personalizar mi pagina",
  // porque el editor manda el formulario completo y un campo invalido tumba el
  // guardado. Se deriva de CONFIG, igual que dos lineas mas abajo con `ciudad`.
  // Es el mismo defecto que el Bug 179 en `whatsapp`, en el campo de al lado.
  // Se ensancha a `string` a proposito: `CONFIG` lleva `as const`, asi que
  // `CONFIG.email` tiene el tipo LITERAL del correo de este repo y `tsc` marca la
  // comparacion como imposible... justo en la suite que tambien corre en el clon
  // de un cliente, donde el valor es otro.
  const correoBase: string = CONFIG.email
  if (correoBase === '') {
    expect(ok(v({ email: '' }))).toEqual({ email: '' })
  } else {
    error(v({ email: '' }), 'email')
  }
  expect(CONFIG.landing.ciudad).toBe('')
  expect(ok(v({ landing: { ciudad: '' } }))).toEqual({ landing: { ciudad: '' } })
  expect(ok(v({ cct: '' }))).toEqual({ cct: '' })
  expect(ok(v({ landing: { cct: '' } }))).toEqual({ landing: { cct: '' } })
  expect(ok(v({ redes: { facebook: '', instagram: '' } }))).toEqual({ redes: { facebook: '', instagram: '' } })
})

test('8b. correo: el vacío se admite solo si la BASE lo trae vacío, y el formato se sigue exigiendo', () => {
  // La regla entera, sin depender de lo que traiga el CONFIG de este repo — esta
  // suite corre también en el clon de cada cliente, y ahí el dato cambia.
  const baseSinCorreo = mergeSiteConfig(CONFIG, { email: '', contactoEmail: '' })
  const vv = (body: Record<string, unknown>) => validarOverrides(body, baseSinCorreo)

  // Base vacía → vaciarlo es una respuesta válida, y el trim la normaliza.
  expect(ok(vv({ email: '' }))).toEqual({ email: '' })
  expect(ok(vv({ email: '   ' }))).toEqual({ email: '' })
  expect(ok(vv({ contactoEmail: '' }))).toEqual({ contactoEmail: '' })

  // Pero admitir el vacío NO es dejar de validar: un correo mal escrito sigue
  // siendo un error, con base vacía o sin ella.
  error(vv({ email: 'no-es-correo' }), 'email')
  error(vv({ email: 'a@' }), 'email')
  error(vv({ email: 42 as unknown as string }), 'email')
  expect(ok(vv({ email: 'hola@escuela.mx' }))).toEqual({ email: 'hola@escuela.mx' })

  // Y con una base que SÍ trae correo, vaciarlo sigue siendo un error: una
  // escuela que publica correo no puede borrarlo por accidente desde el panel.
  const baseConCorreo = mergeSiteConfig(CONFIG, { email: 'hola@escuela.mx' })
  error(validarOverrides({ email: '' }, baseConCorreo), 'email')
})

test('9. null elimina la clave (vuelve al default) y los intermedios vacíos desaparecen', () => {
  expect(ok(v({ nombre: null }))).toEqual({})
  expect(ok(v({ nombre: 'X', tagline: null }))).toEqual({ nombre: 'X' })
  expect(ok(v({ colores: { acento: null } }))).toEqual({})
  expect(ok(v({ colores: {} }))).toEqual({})
  expect(ok(v({ landing: { hero_titulo: null, faq_items: null } }))).toEqual({})
  expect(ok(v({ landing: { hero_titulo: 'Hola', hero_highlight: null } }))).toEqual({ landing: { hero_titulo: 'Hola' } })
  expect(ok(v({ logo: null, logoOscuro: null, whatsappUrl: null }))).toEqual({})
})

test('10. salto de línea: ok en textarea (hero_subtitulo), error en texto (nombre)', () => {
  const r = ok(v({ landing: { hero_subtitulo: 'Línea uno.\nLínea dos.' } }))
  expect((r.landing as Record<string, unknown>).hero_subtitulo).toBe('Línea uno.\nLínea dos.')
  // \r\n se normaliza a \n en textarea
  const r2 = ok(v({ landing: { hero_subtitulo: 'Uno.\r\nDos.' } }))
  expect((r2.landing as Record<string, unknown>).hero_subtitulo).toBe('Uno.\nDos.')
  error(v({ nombre: 'Uno\nDos' }), 'nombre', /saltos de línea/)
  error(v({ landing: { hero_titulo: 'Uno\tDos' } }), 'landing.hero_titulo')
  // Otros controles se rechazan también en textarea
  error(v({ landing: { hero_subtitulo: 'Uno\u0000Dos' } }), 'landing.hero_subtitulo', /no permitidos/)
  error(v({ landing: { hero_subtitulo: 'Uno\u001BDos' } }), 'landing.hero_subtitulo')
})

test('11. trim aplicado en textos, listas y subcampos', () => {
  expect(ok(v({ nombre: '  MEV  ' })).nombre).toBe('MEV')
  const r = ok(v({ landing: { hero_badges: ['  uno ', 'dos  '], faq_items: [{ q: ' ¿Q? ', a: ' R ' }] } }))
  const landing = r.landing as Record<string, unknown>
  expect(landing.hero_badges).toEqual(['uno', 'dos'])
  expect(landing.faq_items).toEqual([{ q: '¿Q?', a: 'R' }])
  expect(ok(v({ email: '  a@b.co ' })).email).toBe('a@b.co')
  expect(ok(v({ whatsapp: ' 5212345678901 ' })).whatsapp).toBe('5212345678901')
})

test('12. tipo incorrecto en una hoja → error con la clave', () => {
  error(v({ nombre: 42 }), 'nombre', /debe ser texto/)
  error(v({ nombre: ['MEV'] }), 'nombre')
  error(v({ nombre: { x: 1 } }), 'nombre')
  error(v({ landing: { hero_badges: 'no es lista' } }), 'landing.hero_badges', /lista/)
  error(v({ precios: { inscripcion: '599' } }), 'precios.inscripcion')
})

// ─── Colores ─────────────────────────────────────────────────────────────────

test('13. hex inválido → error; minúsculas se normalizan a mayúsculas', () => {
  error(v({ colores: { acento: '#GGGGGG' } }), 'colores.acento', /hex/)
  error(v({ colores: { acento: 'red' } }), 'colores.acento')
  error(v({ colores: { acento: '#FFF' } }), 'colores.acento')
  error(v({ colores: { acento: '#FFFFFF00' } }), 'colores.acento')
  error(v({ colores: { acento: 'FFFFFF' } }), 'colores.acento')
  error(v({ colores: { acento: 255 } }), 'colores.acento')
  error(v({ colores: { themeColor: 'blue' } }), 'colores.themeColor')
  expect(ok(v({ colores: { acento: '#ff00aa' } }))).toEqual({ colores: { acento: '#FF00AA' } })
  expect(ok(v({ colores: { themeColor: '#0b0d11' } }))).toEqual({ colores: { themeColor: '#0B0D11' } })
})

test('14. los 12 tokens de color pasan juntos', () => {
  const colores: Record<string, string> = {}
  for (const ruta of CLAVES_EDITABLES) {
    if (ruta.startsWith('colores.')) colores[ruta.slice('colores.'.length)] = '#abcdef'
  }
  expect(Object.keys(colores)).toHaveLength(12)
  const r = ok(v({ colores }))
  for (const k of Object.keys(colores)) expect((r.colores as Record<string, string>)[k]).toBe('#ABCDEF')
})

// ─── Listas ──────────────────────────────────────────────────────────────────

test('15. testimonios: 7 → error, 6 ok, quote 301 → error, 0 ok (sin minItems)', () => {
  const t = (quote = 'Muy bien') => ({ name: 'Ana', age: '32', nivel: 'Preparatoria', initials: 'AN', quote })
  error(v({ landing: { testimonios: Array.from({ length: 7 }, () => t()) } }), 'landing.testimonios', /máximo 6/)
  ok(v({ landing: { testimonios: Array.from({ length: 6 }, () => t()) } }))
  error(v({ landing: { testimonios: [t('a'.repeat(301))] } }), 'landing.testimonios', /supera los 300/)
  ok(v({ landing: { testimonios: [t('a'.repeat(300))] } }))
  expect(ok(v({ landing: { testimonios: [] } }))).toEqual({ landing: { testimonios: [] } })
})

test('16. hero_badges: 5 → error, 4 ok, badge de 31 → error, elemento vacío → error', () => {
  error(v({ landing: { hero_badges: ['a', 'b', 'c', 'd', 'e'] } }), 'landing.hero_badges', /máximo 4/)
  ok(v({ landing: { hero_badges: ['a', 'b', 'c', 'd'] } }))
  error(v({ landing: { hero_badges: ['a'.repeat(31)] } }), 'landing.hero_badges', /supera los 30/)
  ok(v({ landing: { hero_badges: ['a'.repeat(30)] } }))
  error(v({ landing: { hero_badges: ['ok', ''] } }), 'landing.hero_badges', /vacío/)
  error(v({ landing: { hero_badges: [42] } }), 'landing.hero_badges')
  // hero_badges no tiene minItems: [] es válido
  ok(v({ landing: { hero_badges: [] } }))
})

test('17. minItems: transformacion_sin / faq_items / contadores vacíos → error', () => {
  error(v({ landing: { transformacion_sin: [] } }), 'landing.transformacion_sin', /al menos 1/)
  error(v({ landing: { faq_items: [] } }), 'landing.faq_items', /al menos 1/)
  error(v({ landing: { contadores: [] } }), 'landing.contadores', /al menos 1/)
  error(v({ landing: { proceso_pasos: [] } }), 'landing.proceso_pasos')
  error(v({ landing: { beneficios_items: [] } }), 'landing.beneficios_items')
  error(v({ landing: { dolor_items: [] } }), 'landing.dolor_items')
})

test('18. faq_items: item sin "a" → error; clave extra → error; elemento no objeto → error', () => {
  error(v({ landing: { faq_items: [{ q: '¿Q?' }] } }), 'landing.faq_items', /"a"/)
  error(v({ landing: { faq_items: [{ q: '¿Q?', a: 'R', extra: 'x' }] } }), 'landing.faq_items', /"extra"/)
  error(v({ landing: { faq_items: ['texto'] } }), 'landing.faq_items')
  error(v({ landing: { faq_items: [null] } }), 'landing.faq_items')
  error(v({ landing: { faq_items: [{ q: 'a'.repeat(121), a: 'R' }] } }), 'landing.faq_items', /supera los 120/)
  error(v({ landing: { faq_items: [{ q: '¿Q?', a: 'a'.repeat(501) }] } }), 'landing.faq_items', /supera los 500/)
  error(v({ landing: { faq_items: [{ q: '', a: 'R' }] } }), 'landing.faq_items', /vacío/)
  // 9 → error (maxFaq 8)
  const item = { q: '¿Q?', a: 'R' }
  error(v({ landing: { faq_items: Array.from({ length: 9 }, () => item) } }), 'landing.faq_items', /máximo 8/)
  expect(ok(v({ landing: { faq_items: [item] } }))).toEqual({ landing: { faq_items: [item] } })
  // La respuesta es textarea: admite \n
  ok(v({ landing: { faq_items: [{ q: '¿Q?', a: 'Uno.\nDos.' }] } }))
  error(v({ landing: { faq_items: [{ q: 'Uno\nDos', a: 'R' }] } }), 'landing.faq_items')
})

test('19. contadores: valor -1 → error, 100001 → error, decimal → error, sufijo "" ok', () => {
  const c = (valor: number) => ({ valor, sufijo: '%', etiqueta: 'En línea', sub: 'A tu ritmo' })
  error(v({ landing: { contadores: [c(-1)] } }), 'landing.contadores', /entre 0 y 100000/)
  error(v({ landing: { contadores: [c(100001)] } }), 'landing.contadores')
  error(v({ landing: { contadores: [c(1.5)] } }), 'landing.contadores')
  error(v({ landing: { contadores: [{ ...c(1), valor: '1' }] } }), 'landing.contadores', /"valor"/)
  ok(v({ landing: { contadores: [c(0)] } }))
  // El default trae sufijo '' en el primer contador: '' se admite en sufijo…
  ok(v({ landing: { contadores: [{ valor: 2, sufijo: '', etiqueta: 'Niveles', sub: 'Sec · Prepa' }] } }))
  // …pero no en etiqueta (ningún default la trae vacía)
  error(v({ landing: { contadores: [{ valor: 2, sufijo: '', etiqueta: '', sub: 'x' }] } }), 'landing.contadores', /vacío/)
  // 5 → error (maxContadores 4)
  error(v({ landing: { contadores: Array.from({ length: 5 }, () => c(1)) } }), 'landing.contadores', /máximo 4/)
})

test('20. dolor_items / proceso_pasos / beneficios_items exigen exactamente sus subcampos', () => {
  ok(v({ landing: { dolor_items: [{ icono: '⏰', titulo: 'T', desc: 'D' }] } }))
  error(v({ landing: { dolor_items: [{ titulo: 'T', desc: 'D' }] } }), 'landing.dolor_items', /"icono"/)
  error(v({ landing: { dolor_items: [{ icono: 'a'.repeat(9), titulo: 'T', desc: 'D' }] } }), 'landing.dolor_items', /supera los 8/)
  ok(v({ landing: { proceso_pasos: [{ titulo: 'T', desc: 'D' }] } }))
  error(v({ landing: { proceso_pasos: [{ titulo: 'T', desc: 'D', icono: 'x' }] } }), 'landing.proceso_pasos', /"icono"/)
  ok(v({ landing: { beneficios_items: [{ titulo: 'T', desc: 'D' }] } }))
  error(v({ landing: { beneficios_items: [{ titulo: 'T' }] } }), 'landing.beneficios_items', /"desc"/)
  error(v({ landing: { transformacion_con: Array.from({ length: 7 }, () => 'x') } }), 'landing.transformacion_con', /máximo 6/)
  error(v({ landing: { transformacion_con: ['a'.repeat(81)] } }), 'landing.transformacion_con', /supera los 80/)
})

test('21. los defaults de CONFIG (recortados) pasan la validación sin cambios', () => {
  // El editor prellenado con los defaults tiene que poder guardar sin tocar nada.
  const defaults = recortarAEditables(BASE()) as unknown as Record<string, unknown>
  // `modalidades` en el cuerpo va por id, no como arreglo; `whatsappUrl` se deriva.
  const cuerpo: Record<string, unknown> = { ...defaults }
  cuerpo.modalidades = Object.fromEntries(
    CONFIG.modalidades.map((m) => [m.id, { mensualidad: m.mensualidad, activa: m.activa }]),
  )
  const r = ok(v(cuerpo, ORIGEN))
  expect(r.nombre).toBe(CONFIG.nombre)
  expect(r.logo).toBe(CONFIG.logo)
  expect(r.whatsappUrl).toBe(`https://wa.me/${CONFIG.whatsapp}`)
  expect((r.landing as Record<string, unknown>).faq_items).toEqual(CONFIG.landing.faq_items)
  expect((r.landing as Record<string, unknown>).hero_subtitulo).toBe(CONFIG.landing.hero_subtitulo)
  // Y el merge de lo devuelto es deep-equal a CONFIG: guardar los defaults no cambia nada.
  expect(mergeSiteConfig(CONFIG, r)).toEqual(JSON.parse(JSON.stringify(CONFIG)))
})

test('21 bis. controles C1, separadores de línea y bidi → error; invisibles = vacío', () => {
  // U+0085 (NEL) y demás C1: el navegador los trata como salto de línea y
  // String.trim no los quita. El filtro viejo (C0 + DEL) los dejaba pasar.
  error(v({ nombre: 'Escuela\u0085X' }), 'nombre', /caracteres de control/)
  error(v({ nombre: 'Escuela\u009BX' }), 'nombre')
  // U+2028 / U+2029: saltos de línea invisibles que además rompen literales JS
  error(v({ nombre: 'Escuela\u2028X' }), 'nombre')
  error(v({ landing: { hero_titulo: 'A\u2029B' } }), 'landing.hero_titulo')
  // U+202E y los aislantes bidi: el admin vería un texto y la landing otro
  error(v({ nombre: 'Escuela\u202EX' }), 'nombre')
  error(v({ landing: { hero_titulo: 'A\u2066B' } }), 'landing.hero_titulo')
  // En textarea el salto de línea de verdad sigue valiendo; el resto no
  ok(v({ landing: { faq_items: [{ q: '¿Q?', a: 'Uno.\nDos.' }] } }))
  error(v({ landing: { faq_items: [{ q: '¿Q?', a: 'Uno\u2028Dos' }] } }), 'landing.faq_items')
  // Ancho cero: no se prohíben, pero un campo hecho SOLO de ellos está vacío
  error(v({ nombre: '\u200B' }), 'nombre', /no puede quedar vacío/)
  error(v({ nombre: '\u200B\u200E\uFEFF ' }), 'nombre', /no puede quedar vacío/)
  error(v({ landing: { hero_titulo: '\u2060' } }), 'landing.hero_titulo', /no puede quedar vacío/)
  // …y donde el vacío SÍ se admite, se guarda como cadena vacía de verdad
  expect(ok(v({ cct: '\u200B' }))).toEqual({ cct: '' })
})

// ─── Redes ───────────────────────────────────────────────────────────────────

test('22. redes.facebook / instagram: https + dominio en lista; el resto error', () => {
  ok(v({ redes: { facebook: 'https://www.facebook.com/x' } }))
  ok(v({ redes: { facebook: 'https://facebook.com/x' } }))
  ok(v({ redes: { facebook: 'https://m.facebook.com/x' } }))
  ok(v({ redes: { facebook: 'https://fb.com/x' } }))
  ok(v({ redes: { instagram: 'https://www.instagram.com/x/' } }))
  ok(v({ redes: { instagram: 'https://instagram.com/x?hl=es' } }))
  error(v({ redes: { facebook: 'https://evil.com/facebook.com' } }), 'redes.facebook', /facebook\.com/)
  error(v({ redes: { facebook: 'http://facebook.com' } }), 'redes.facebook', /https/)
  error(v({ redes: { instagram: 'https://instagram.com.evil.com/x' } }), 'redes.instagram')
  error(v({ redes: { instagram: 'https://notinstagram.com/x' } }), 'redes.instagram')
  error(v({ redes: { facebook: 'https://user:pass@facebook.com/x' } }), 'redes.facebook', /credenciales/)
  error(v({ redes: { facebook: 'javascript:alert(1)' } }), 'redes.facebook')
  error(v({ redes: { facebook: 'facebook.com/x' } }), 'redes.facebook', /URL completa/)
  error(v({ redes: { facebook: 'https://facebook.com/<x>' } }), 'redes.facebook')
  error(v({ redes: { facebook: `https://facebook.com/${'a'.repeat(300)}` } }), 'redes.facebook', /supera los 300/)
  error(v({ redes: { facebook: 42 } }), 'redes.facebook')
})

// ─── Contacto ────────────────────────────────────────────────────────────────

test('23. whatsapp: dígitos 10-13; whatsappUrl SIEMPRE derivado', () => {
  error(v({ whatsapp: '52123' }), 'whatsapp', /10 y 13/)
  error(v({ whatsapp: '52123456789012' }), 'whatsapp')
  error(v({ whatsapp: '+5212345678901' }), 'whatsapp')
  error(v({ whatsapp: '521 234 5678' }), 'whatsapp')
  error(v({ whatsapp: 5212345678901 }), 'whatsapp')
  expect(ok(v({ whatsapp: '5212345678901' }))).toEqual({
    whatsapp: '5212345678901',
    whatsappUrl: 'https://wa.me/5212345678901',
  })
  expect(ok(v({ whatsapp: '5551234567' })).whatsappUrl).toBe('https://wa.me/5551234567')
  // whatsappUrl propio se ignora y se sobreescribe
  expect(ok(v({ whatsapp: '5212345678901', whatsappUrl: 'https://evil.com' })).whatsappUrl)
    .toBe('https://wa.me/5212345678901')
  // whatsappUrl sin whatsapp → error
  error(v({ whatsappUrl: 'https://wa.me/5212345678901' }), 'whatsappUrl', 'whatsappUrl se deriva de whatsapp')
  // whatsappUrl null sin whatsapp = "quitar override": ok
  expect(ok(v({ whatsappUrl: null }))).toEqual({})
})

test('24. contactoTelefono, whatsappDisplay, email y contactoEmail', () => {
  ok(v({ contactoTelefono: '5212345678901' }))
  error(v({ contactoTelefono: '123' }), 'contactoTelefono')
  ok(v({ whatsappDisplay: '521 234-567-8901' }))
  error(v({ whatsappDisplay: 'a'.repeat(31) }), 'whatsappDisplay', /supera los 30/)
  ok(v({ email: 'contacto@escuela.edu.mx', contactoEmail: 'hola@x.co' }))
  error(v({ email: 'no-es-correo' }), 'email', /correo/)
  error(v({ contactoEmail: 'a@b' }), 'contactoEmail', /correo/)
  error(v({ email: `${'a'.repeat(120)}@x.co` }), 'email', /supera los 120/)
  error(v({ email: 42 }), 'email')
})

// ─── Precios ─────────────────────────────────────────────────────────────────

test('25. precios: entero 0..50000', () => {
  error(v({ precios: { inscripcion: 50001 } }), 'precios.inscripcion', /entre 0 y 50000/)
  error(v({ precios: { inscripcion: -1 } }), 'precios.inscripcion')
  error(v({ precios: { inscripcion: 599.5 } }), 'precios.inscripcion')
  error(v({ precios: { inscripcion: NaN } }), 'precios.inscripcion')
  error(v({ precios: { inscripcion: Infinity } }), 'precios.inscripcion')
  error(v({ precios: { inscripcion: '599' } }), 'precios.inscripcion')
  expect(ok(v({ precios: { inscripcion: 0 } }))).toEqual({ precios: { inscripcion: 0 } })
  expect(ok(v({ precios: { inscripcion: 50000, certificacionSecundaria: 4900, certificacionPreparatoria: 5900 } })))
    .toEqual({ precios: { inscripcion: 50000, certificacionSecundaria: 4900, certificacionPreparatoria: 5900 } })
  error(v({ precios: { certificacionSecundaria: 50001 } }), 'precios.certificacionSecundaria')
  error(v({ precios: { certificacionPreparatoria: -5 } }), 'precios.certificacionPreparatoria')
})

/** La otra duración del mismo nivel, para probar el rango sin tocar el escalón (F2-7). */
const PAREJA: Record<string, string> = {
  mensualidadSecundaria3Meses: 'mensualidadSecundaria6Meses', mensualidadSecundaria6Meses: 'mensualidadSecundaria3Meses',
  mensualidadPreparatoria3Meses: 'mensualidadPreparatoria6Meses', mensualidadPreparatoria6Meses: 'mensualidadPreparatoria3Meses',
}

test('25 bis. precios POR NIVEL: entero 1..50000, o vacío (null) = usa el general', () => {
  // Fase 2. El 0 NO es "sin costo" aquí: vacío ya significa "el general", y un
  // 0 escrito dejaría al nivel anunciando $0 mientras la general cobra.
  for (const k of [
    'inscripcionSecundaria', 'inscripcionPreparatoria',
    'mensualidadSecundaria3Meses', 'mensualidadSecundaria6Meses',
    'mensualidadPreparatoria3Meses', 'mensualidadPreparatoria6Meses',
  ]) {
    const clave = `precios.${k}`
    // F2-7: una mensualidad por nivel SOLA puede invertir el escalón (3 meses a
    // $1 bajo 6 meses a $1,000), así que el rango se prueba con su pareja a la
    // misma cifra, sobre la base sintética de planes 3 y 6 (un clon con 12 meses
    // seguiría invirtiendo contra ese plan): lo único que se mide es el rango.
    const conPareja = (n: number) => (PAREJA[k] ? { [k]: n, [PAREJA[k]]: n } : { [k]: n })
    error(v({ precios: { [k]: 0 } }), clave, /entre 1 y 50000/)
    expect(ok(validarOverrides({ precios: conPareja(1) }, baseEscalon()))).toEqual({ precios: conPareja(1) })
    expect(ok(validarOverrides({ precios: conPareja(50000) }, baseEscalon()))).toEqual({ precios: conPareja(50000) })
    error(v({ precios: { [k]: 50001 } }), clave)
    error(v({ precios: { [k]: -1 } }), clave)
    error(v({ precios: { [k]: 599.5 } }), clave)
    error(v({ precios: { [k]: '599' } }), clave)
    // null = "sin override": no es error y no se guarda nada.
    expect(ok(v({ precios: { [k]: null } }))).toEqual({})
  }
})

// ─── Modalidades ─────────────────────────────────────────────────────────────

test('26. modalidades: solo ids de la base, solo mensualidad/activa', () => {
  expect(ok(vSinEscalon({ modalidades: { '3_meses': { mensualidad: 2500 } } })))
    .toEqual({ modalidades: { '3_meses': { mensualidad: 2500 } } })
  error(v({ modalidades: { inventada: { mensualidad: 1 } } }), 'modalidades.inventada', /desconocida/)
  error(v({ modalidades: { '3_meses': { meses: 4 } } }), 'modalidades.3_meses.meses', 'Clave no editable: modalidades.3_meses.meses')
  error(v({ modalidades: { '3_meses': { label: 'x' } } }), 'modalidades.3_meses.label')
  error(v({ modalidades: { '3_meses': { mensualidad: 50001 } } }), 'modalidades.3_meses', /entre 0 y 50000/)
  error(v({ modalidades: { '3_meses': { mensualidad: -1 } } }), 'modalidades.3_meses')
  error(v({ modalidades: { '3_meses': { mensualidad: 10.5 } } }), 'modalidades.3_meses')
  error(v({ modalidades: { '3_meses': { mensualidad: '2500' } } }), 'modalidades.3_meses')
  error(v({ modalidades: { '3_meses': { activa: 'no' } } }), 'modalidades.3_meses', /verdadero o falso/)
  error(v({ modalidades: { '3_meses': 'x' } }), 'modalidades.3_meses')
  error(v({ modalidades: ['3_meses'] }), 'modalidades', /objeto/)
  error(v({ modalidades: 'x' }), 'modalidades')
  // null / {} / valores null = sin override
  expect(ok(v({ modalidades: { '3_meses': null } }))).toEqual({})
  expect(ok(v({ modalidades: { '3_meses': {} } }))).toEqual({})
  expect(ok(v({ modalidades: { '3_meses': { mensualidad: null, activa: null } } }))).toEqual({})
  expect(ok(v({ modalidades: {} }))).toEqual({})
})

// ─── Regla del escalón (Fase 2, F2-7) ────────────────────────────────────────

type Base = ReturnType<typeof BASE>
type Plan = { id: string; label: string; meses: number; mensualidad: number; materiasPorMes: number; activa: boolean; nivel?: string; semanas?: number; cuotaSemanal?: number }

/**
 * Una base SINTÉTICA para el escalón: no depende del config.ts del clon.
 * Planes 3m 2000 / 6m 1000, alias alineados con el plan, claves por nivel vacías.
 */
function baseEscalon(o: { semanal?: boolean; niveles?: string[]; modalidades?: Plan[]; precios?: Record<string, unknown> } = {}): Base {
  const b = BASE() as unknown as { niveles: string[]; periodicidad: string; modalidades: Plan[]; precios: Record<string, unknown> }
  b.niveles = o.niveles ?? ['secundaria', 'preparatoria']
  b.periodicidad = o.semanal ? 'semanal' : 'mensual'
  b.modalidades = o.modalidades ?? [
    { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
  ]
  // Fuera los alias por nivel y duración del clon (p. ej. secundaria_12meses_normal):
  // abajo se reponen solo los de 3 y 6 meses, alineados con el plan.
  for (const k of Object.keys(b.precios)) if (/^(secundaria|preparatoria)_\d+meses_/.test(k)) delete b.precios[k]
  Object.assign(b.precios, {
    plan3mMensualidad: 2000, plan6mMensualidad: 1000,
    secundaria_3meses_normal: 2000, secundaria_3meses_sindicalizado: 2000, secundaria_6meses_normal: 1000, secundaria_6meses_sindicalizado: 1000,
    preparatoria_3meses_normal: 2000, preparatoria_3meses_sindicalizado: 2000, preparatoria_6meses_normal: 1000, preparatoria_6meses_sindicalizado: 1000,
    inscripcionSecundaria: null, inscripcionPreparatoria: null,
    mensualidadSecundaria3Meses: null, mensualidadSecundaria6Meses: null,
    mensualidadPreparatoria3Meses: null, mensualidadPreparatoria6Meses: null,
  }, o.precios ?? {})
  return b as unknown as Base
}
const e = (body: unknown, base: Base = baseEscalon()) => validarOverrides(body, base)
const msg = (nivel: string, corto: number, vCorto: number, largo: number, vLargo: number, semanal = false) =>
  `${semanal ? 'La cuota semanal' : 'La mensualidad'} de ${etiquetaNivel(nivel)} a ${corto} meses (${vCorto}) no puede ser menor que la de ${largo} meses (${vLargo}): el plan corto no puede costar menos ${semanal ? 'a la semana' : 'al mes'}.`

// La SAMEX (#199): secundaria 2700/1400 en sus alias; el plan lleva la de preparatoria.
const SAMEX = () => baseEscalon({
  modalidades: [
    { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 3000, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1500, materiasPorMes: 2, activa: true },
  ],
  precios: {
    plan3mMensualidad: 3000, plan6mMensualidad: 1500,
    secundaria_3meses_normal: 2700, secundaria_3meses_sindicalizado: 2700, secundaria_6meses_normal: 1400, secundaria_6meses_sindicalizado: 1400,
    preparatoria_3meses_normal: 3000, preparatoria_3meses_sindicalizado: 3000, preparatoria_6meses_normal: 1500, preparatoria_6meses_sindicalizado: 1500,
  },
})

test('26 bis. escalón: un plan más corto no cuesta menos al mes (y la igualdad vale)', () => {
  // 3 < 6 da error en el plan corto; los alias alineados siguen al plan, así que
  // el primer nivel evaluado (Secundaria) ya lo ve.
  error(e({ modalidades: { '3_meses': { mensualidad: 900 } } }), 'modalidades.3_meses', msg('secundaria', 3, 900, 6, 1000))
  expect(ok(e({ modalidades: { '3_meses': { mensualidad: 1000 } } }))).toEqual({ modalidades: { '3_meses': { mensualidad: 1000 } } })
  // Subir el LARGO por encima del corto también: el error señala el plan corto.
  error(e({ modalidades: { '6_meses': { mensualidad: 2500 } } }), 'modalidades.3_meses', msg('secundaria', 3, 2000, 6, 2500))
})

test('26 bis. escalón por nivel: la clave del nivel del plan corto, si viene en el cuerpo', () => {
  error(e({ precios: { mensualidadSecundaria3Meses: 900 } }), 'precios.mensualidadSecundaria3Meses', msg('secundaria', 3, 900, 6, 1000))
  // Preparatoria no se toca: Secundaria es la única que viola.
  ok(e({ precios: { mensualidadSecundaria3Meses: 1000 } }))
  // Si la que invierte es la del plan LARGO, la del corto no viene: el error va al plan.
  error(e({ precios: { mensualidadPreparatoria6Meses: 2500 } }), 'modalidades.3_meses', msg('preparatoria', 3, 2000, 6, 2500))
  // Un nivel con sus dos claves en orden (500 ≥ 400): nada que reportar.
  ok(e({ precios: { mensualidadSecundaria3Meses: 500, mensualidadSecundaria6Meses: 400 } }))
  // La de Preparatoria, con SU clave (no la de Secundaria).
  error(e({ precios: { mensualidadPreparatoria3Meses: 900 } }), 'precios.mensualidadPreparatoria3Meses', msg('preparatoria', 3, 900, 6, 1000))
})

test('26 bis. escalón: un plan apagado no cuenta; planes de niveles distintos no forman par', () => {
  ok(e({ modalidades: { '3_meses': { mensualidad: 900, activa: false } } }))
  const apagado = baseEscalon()
  ;(apagado.modalidades as unknown as Plan[])[1].activa = false
  ok(e({ modalidades: { '3_meses': { mensualidad: 900 } } }, apagado))
  // Oferta asimétrica: Secundaria solo 3 meses, Preparatoria solo 6. No hay par.
  const asimetrica = baseEscalon({
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 500, materiasPorMes: 4, activa: true, nivel: 'secundaria' },
      { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true, nivel: 'preparatoria' },
    ],
    precios: { secundaria_3meses_normal: 500, secundaria_3meses_sindicalizado: 500 },
  })
  ok(e({ modalidades: { '3_meses': { mensualidad: 400 } } }, asimetrica))
  // Una escuela sin Secundaria ni Preparatoria no evalúa nada.
  ok(e({ modalidades: { '3_meses': { mensualidad: 1 } } }, baseEscalon({ niveles: ['licenciatura'] })))
})

test('26 bis. escalón: PERDÓN para lo que ya venía así en la base', () => {
  // Una base que ya viola (3m 900 < 6m 1000) no bloquea ninguna publicación…
  const viola = baseEscalon({
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 900, materiasPorMes: 4, activa: true },
      { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
    ],
    precios: {
      plan3mMensualidad: 900, secundaria_3meses_normal: 900, secundaria_3meses_sindicalizado: 900,
      preparatoria_3meses_normal: 900, preparatoria_3meses_sindicalizado: 900,
    },
  })
  ok(e({}, viola))
  ok(e({ nombre: 'Otra escuela' }, viola))
  // …ni si el editor la reenvía idéntica como override (la forma de la prueba 21).
  ok(e({ modalidades: { '3_meses': { mensualidad: 900, activa: true }, '6_meses': { mensualidad: 1000, activa: true } } }, viola))
  // Pero mover una cifra del par invertido ya no se perdona…
  error(e({ modalidades: { '6_meses': { mensualidad: 1100 } } }, viola), 'modalidades.3_meses', msg('secundaria', 3, 900, 6, 1100))
  // …ni siquiera un paso que lo deja «menos» invertido: el perdón exige los DOS valores de la base.
  error(e({ modalidades: { '6_meses': { mensualidad: 950 } } }, viola), 'modalidades.3_meses', msg('secundaria', 3, 900, 6, 950))
  // Encender un plan APAGADO que queda invertido tampoco: ese par nunca se publicó.
  const apagadoInvertido = baseEscalon({
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 900, materiasPorMes: 4, activa: false },
      { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
    ],
    precios: {
      plan3mMensualidad: 900, secundaria_3meses_normal: 900, secundaria_3meses_sindicalizado: 900,
      preparatoria_3meses_normal: 900, preparatoria_3meses_sindicalizado: 900,
    },
  })
  ok(e({}, apagadoInvertido))
  error(e({ modalidades: { '3_meses': { activa: true } } }, apagadoInvertido), 'modalidades.3_meses', msg('secundaria', 3, 900, 6, 1000))
})

test('26 bis. escalón semanal: se compara la cuota semanal entre planes del mismo nivel', () => {
  // Forma RHEMA: dos planes semanales sin `nivel`, para los dos niveles.
  const rhema = baseEscalon({
    semanal: true,
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, semanas: 12, cuotaSemanal: 300, mensualidad: 300, materiasPorMes: 4, activa: true },
      { id: '6_meses', label: '6 meses', meses: 6, semanas: 24, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 2, activa: true },
    ],
  })
  error(e({ modalidades: { '3_meses': { cuotaSemanal: 200 } } }, rhema), 'modalidades.3_meses', msg('secundaria', 3, 200, 6, 250, true))
  ok(e({ modalidades: { '3_meses': { cuotaSemanal: 250 } } }, rhema))
  // En semanal la mensualidad no se cobra: no entra en el escalón.
  ok(e({ modalidades: { '3_meses': { mensualidad: 1 } } }, rhema))
  // Forma CAU: un plan por nivel. No hay pares.
  const cau = baseEscalon({
    semanal: true,
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, semanas: 12, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 4, activa: true, nivel: 'secundaria' },
      { id: '6_meses', label: '6 meses', meses: 6, semanas: 24, cuotaSemanal: 350, mensualidad: 350, materiasPorMes: 2, activa: true, nivel: 'preparatoria' },
    ],
  })
  ok(e({ modalidades: { '3_meses': { cuotaSemanal: 1 } } }, cau))
})

test('26 bis. escalón: con el alias de secundaria divergente, manda el valor EFECTIVO', () => {
  // SAMEX: la secundaria a 3 meses cuesta 2,700 (su alias), no 3,000 (el plan).
  // Una mensualidad propia de 6 meses de 2,800 la deja por debajo: error, aunque
  // «el plan» (3,000) quede por encima. Evaluar lo declarado lo dejaría pasar.
  // El error señala la clave del LARGO: subir el plan de 3 meses no mueve el alias.
  error(e({ precios: { mensualidadSecundaria6Meses: 2800 } }, SAMEX()), 'precios.mensualidadSecundaria6Meses', msg('secundaria', 3, 2700, 6, 2800))
  ok(e({ precios: { mensualidadSecundaria6Meses: 2700 } }, SAMEX()))
  // Y al revés: bajar el plan de 3 meses a 1,450 no toca a Secundaria (su alias no
  // seguía al plan), pero sí a Preparatoria.
  error(e({ modalidades: { '3_meses': { mensualidad: 1450 } } }, SAMEX()), 'modalidades.3_meses', msg('preparatoria', 3, 1450, 6, 1500))
  // Forma BÚFALO: planes 3600/2800, alias de secundaria 3200 (no sigue al plan) y
  // 2800 (sí lo sigue). Subir el plan de 6 meses a 3300 deja la secundaria a 3
  // meses (3200) por debajo, y subir el de 3 meses no la movería: se señala el de 6.
  const bufalo = baseEscalon({
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 3600, materiasPorMes: 4, activa: true },
      { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 2800, materiasPorMes: 2, activa: true },
    ],
    precios: {
      plan3mMensualidad: 3600, plan6mMensualidad: 2800,
      secundaria_3meses_normal: 3200, secundaria_3meses_sindicalizado: 3200, secundaria_6meses_normal: 2800, secundaria_6meses_sindicalizado: 2800,
      preparatoria_3meses_normal: 3600, preparatoria_3meses_sindicalizado: 3600, preparatoria_6meses_normal: 2800, preparatoria_6meses_sindicalizado: 2800,
    },
  })
  error(e({ modalidades: { '6_meses': { mensualidad: 3300 } } }, bufalo), 'modalidades.6_meses', msg('secundaria', 3, 3200, 6, 3300))
  error(e({ modalidades: { '3_meses': { mensualidad: 50000 }, '6_meses': { mensualidad: 3300 } } }, bufalo), 'modalidades.6_meses', msg('secundaria', 3, 3200, 6, 3300))
})

test('26 bis. escalón: cubre también 9, 12 o más meses', () => {
  const tres = baseEscalon({
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
      { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
      { id: '12_meses', label: '12 meses', meses: 12, mensualidad: 800, materiasPorMes: 1, activa: true },
    ],
  })
  ok(e({}, tres))
  error(e({ modalidades: { '12_meses': { mensualidad: 1200 } } }, tres), 'modalidades.6_meses', msg('secundaria', 6, 1000, 12, 1200))
  // La clave de 6 meses también manda cuando es el plan corto del par.
  error(e({ precios: { mensualidadSecundaria6Meses: 700 } }, tres), 'precios.mensualidadSecundaria6Meses', msg('secundaria', 6, 700, 12, 800))
  // Perdón + 3 planes: el par (3, 6) viene invertido y se perdona, pero eso no
  // exime al par NO adyacente (3, 12). Comparar solo vecinos lo dejaría pasar.
  const perdonTres = baseEscalon({
    modalidades: [
      { id: '3_meses', label: '3 meses', meses: 3, mensualidad: 900, materiasPorMes: 4, activa: true },
      { id: '6_meses', label: '6 meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
      { id: '12_meses', label: '12 meses', meses: 12, mensualidad: 800, materiasPorMes: 1, activa: true },
    ],
    precios: {
      plan3mMensualidad: 900, secundaria_3meses_normal: 900, secundaria_3meses_sindicalizado: 900,
      preparatoria_3meses_normal: 900, preparatoria_3meses_sindicalizado: 900,
    },
  })
  ok(e({}, perdonTres))
  error(e({ modalidades: { '12_meses': { mensualidad: 950 } } }, perdonTres), 'modalidades.3_meses', msg('secundaria', 3, 900, 12, 950))
})

test('26 ter. paridad: el navegador y el servidor validan contra la MISMA base', () => {
  // Los dos lados arman `mergeSiteConfig(CONFIG, {})`.
  const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
  const pagina = leer('src/app/(dashboard)/admin/configuracion/page.tsx')
  const api = leer('src/app/api/admin/configuracion/route.ts')
  expect(pagina).toContain('validarOverrides(cuerpo, mergeSiteConfig(CONFIG, {}))')
  expect(pagina).not.toContain('validarOverrides(cuerpo, defaults')
  expect(api).toContain('const DEFAULTS = () => mergeSiteConfig(CONFIG, {})')
  expect(api).toMatch(/validarOverrides\(body, DEFAULTS\(\)/)
  // Esa base trae lo que la regla lee: los niveles vendidos y la periodicidad.
  const completa = mergeSiteConfig(CONFIG, {})
  expect(completa.niveles).toEqual(CONFIG.niveles)
  expect(completa.periodicidad).toBe(CONFIG.periodicidad)
  // Una base que NO los trae (la recortada) cae a CONFIG: la regla sigue viva.
  if (ES_PLANTILLA) {
    const sinNiveles = recortarAEditables(BASE()) as unknown as Base
    expect((sinNiveles as unknown as { niveles?: unknown }).niveles).toBeUndefined()
    error(validarOverrides({ modalidades: { '3_meses': { mensualidad: 1 } } }, sinNiveles), 'modalidades.3_meses')
  }
  // Por qué no basta la base RECORTADA que usaba la página: no trae los alias, y
  // el respaldo de secundaria pasa por ellos. En SAMEX daría el veredicto contrario.
  const recortada = recortarAEditables(SAMEX()) as unknown as Base
  expect(e({ precios: { mensualidadSecundaria6Meses: 2800 } }, SAMEX()).ok).toBe(false)
  expect(e({ precios: { mensualidadSecundaria6Meses: 2800 } }, recortada).ok).toBe(true)
})

test('26 quater. el config de FÁBRICA cumple el escalón (2000 ≥ 1000)', () => {
  test.skip(!ES_PLANTILLA, 'en un clon manda su config.ts; el perdón cubre lo que ya venía así')
  for (const nivel of ['secundaria', 'preparatoria']) {
    const planes = planesPorNivel(nivel, CONFIG.modalidades)
    for (const a of planes) for (const b of planes) {
      if (a.meses >= b.meses) continue
      const va = mensualidadDe(nivel, a, CONFIG.precios as unknown as Record<string, unknown>)
      const vb = mensualidadDe(nivel, b, CONFIG.precios as unknown as Record<string, unknown>)
      expect(va, `${nivel} ${a.meses} vs ${b.meses}`).toBeGreaterThanOrEqual(vb)
    }
  }
  // (No basta `ok(v({}))`: con el cuerpo vacío cada par trae los valores de la
  // base y el perdón lo omite. El guardián de la fábrica es el bucle de arriba.)
})

test('27. "al menos una activa" se evalúa sobre el resultado', () => {
  expect(CONFIG.modalidades.every((m) => m.activa)).toBe(true)
  error(v({ modalidades: { '3_meses': { activa: false }, '6_meses': { activa: false } } }),
    'modalidades', 'Debe quedar al menos una modalidad activa')
  expect(ok(v({ modalidades: { '3_meses': { activa: false } } })))
    .toEqual({ modalidades: { '3_meses': { activa: false } } })
  ok(v({ modalidades: { '6_meses': { activa: false } } }))
  ok(v({ modalidades: { '3_meses': { activa: false }, '6_meses': { activa: true } } }))
  // Con una base donde solo hay una activa, desactivarla es error aunque el
  // cuerpo no toque la otra.
  const base = BASE()
  base.modalidades[1].activa = false
  const r = validarOverrides({ modalidades: { '3_meses': { activa: false } } }, base)
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.error).toBe('Debe quedar al menos una modalidad activa')
  // …y reactivar la otra en el mismo cuerpo lo arregla.
  expect(validarOverrides({ modalidades: { '3_meses': { activa: false }, '6_meses': { activa: true } } }, base).ok).toBe(true)
})

// ─── Logo ────────────────────────────────────────────────────────────────────

test('28. logo: solo default, /logo.png o URL del bucket en el origen permitido', () => {
  const bucket = `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png`
  error(v({ logo: 'https://evil.com/x.png' }, ORIGEN), 'logo', /subido desde el editor/)
  error(v({ logo: `https://evil.com${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png` }, ORIGEN), 'logo')
  error(v({ logo: `${ORIGEN}/storage/v1/object/public/otro/logo.png` }, ORIGEN), 'logo')
  error(v({ logo: `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}` }, ORIGEN), 'logo')
  error(v({ logo: `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}../secreto.png` }, ORIGEN), 'logo')
  error(v({ logo: `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}sub/logo.png` }, ORIGEN), 'logo')
  error(v({ logo: `http://abcdefghij.supabase.co${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png` }, ORIGEN), 'logo')
  error(v({ logo: 'data:image/png;base64,AAAA' }, ORIGEN), 'logo')
  error(v({ logo: '' }, ORIGEN), 'logo', /vacío/)
  error(v({ logo: '/otro.png' }, ORIGEN), 'logo')
  error(v({ logo: 42 }, ORIGEN), 'logo')
  expect(ok(v({ logo: bucket }, ORIGEN))).toEqual({ logo: bucket })
  expect(ok(v({ logo: '/logo.png' }, ORIGEN))).toEqual({ logo: '/logo.png' })
  expect(ok(v({ logo: CONFIG.logo }))).toEqual({ logo: CONFIG.logo })
  // Sin origen configurado, la URL del bucket no se puede verificar → error
  error(v({ logo: bucket }), 'logo')
  // logoOscuro: mismas reglas salvo el vacío
  const oscuro = `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-oscuro-2.png`
  expect(ok(v({ logoOscuro: oscuro }, ORIGEN))).toEqual({ logoOscuro: oscuro })
  error(v({ logoOscuro: 'https://evil.com/x.svg' }, ORIGEN), 'logoOscuro')
  // El origen se normaliza (barra final, ruta extra)
  expect(ok(v({ logo: bucket }, `${ORIGEN}/`))).toEqual({ logo: bucket })
})

test('28 bis. logoOscuro admite \'\' (= sin variante oscura); logo no', () => {
  // '' en logoOscuro significa "no hay logo para fondo oscuro": la landing usa
  // el claro (por eso logoOscuro no está en SIN_VACIO, ver site-config-core).
  expect(ok(v({ logoOscuro: '' }, ORIGEN))).toEqual({ logoOscuro: '' })
  expect(ok(v({ logoOscuro: '   ' }, ORIGEN))).toEqual({ logoOscuro: '' })
  // El merge lo acepta y lo RESUELVE al claro (resolverLogos): el consumidor
  // nunca ve un `logoOscuro` vacío.
  expect(mergeSiteConfig(CONFIG, { logoOscuro: '' }).logoOscuro).toBe(CONFIG.logo)
  // En logo, '' sería un <img src=""> (el navegador vuelve a pedir la página).
  error(v({ logo: '' }, ORIGEN), 'logo', /vacío/)
  error(v({ logo: '   ' }, ORIGEN), 'logo', /vacío/)
})

test('28 ter. logo: se guarda la forma canónica (origin + pathname)', () => {
  const bucket = `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png`
  // Query y hash fuera: con ellos, dos guardados del MISMO archivo darían dos
  // cadenas distintas y borrarLogoSiEsDelBucket compara por igualdad.
  expect(ok(v({ logo: `${bucket}?t=1` }, ORIGEN))).toEqual({ logo: bucket })
  expect(ok(v({ logo: `${bucket}#x` }, ORIGEN))).toEqual({ logo: bucket })
  expect(ok(v({ logo: `${bucket}?t=1#x` }, ORIGEN))).toEqual({ logo: bucket })
  // Host en mayúsculas → minúsculas (es como lo escribe el SDK)
  expect(ok(v({ logo: `https://ABCDEFGHIJ.SUPABASE.CO${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png` }, ORIGEN)))
    .toEqual({ logo: bucket })
  expect(ok(v({ logoOscuro: `${ORIGEN.toUpperCase().replace('HTTPS', 'https')}${PREFIJO_PUBLICO_BRANDING}logo-oscuro-9.png` }, ORIGEN)))
    .toEqual({ logoOscuro: `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-oscuro-9.png` })
  // Nada que pudiera cerrar el atributo de un <img src> antes de tiempo
  error(v({ logo: `${bucket}"><script>x` }, ORIGEN), 'logo', /no permitidos/)
  error(v({ logo: `${bucket}'` }, ORIGEN), 'logo', /no permitidos/)
  error(v({ logo: `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo 1.png` }, ORIGEN), 'logo', /no permitidos/)
})

test('29. pathDesdeUrlBranding / normalizarOrigen', () => {
  expect(normalizarOrigen(ORIGEN)).toBe(ORIGEN)
  expect(normalizarOrigen(`${ORIGEN}/`)).toBe(ORIGEN)
  expect(normalizarOrigen('no-es-url')).toBeUndefined()
  expect(normalizarOrigen(undefined)).toBeUndefined()
  expect(normalizarOrigen('')).toBeUndefined()
  expect(pathDesdeUrlBranding(`${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png`, ORIGEN)).toBe('logo-claro-1.png')
  expect(pathDesdeUrlBranding(`${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png?t=1`, ORIGEN)).toBe('logo-claro-1.png')
  expect(pathDesdeUrlBranding('/logo.png', ORIGEN)).toBeNull()
  expect(pathDesdeUrlBranding('https://evil.com/x.png', ORIGEN)).toBeNull()
  expect(pathDesdeUrlBranding(`${ORIGEN}${PREFIJO_PUBLICO_BRANDING}a/b.png`, ORIGEN)).toBeNull()
  expect(pathDesdeUrlBranding(`${ORIGEN}${PREFIJO_PUBLICO_BRANDING}.env`, ORIGEN)).toBeNull()
  expect(pathDesdeUrlBranding(`${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo.png`, undefined)).toBeNull()
  expect(pathDesdeUrlBranding(null, ORIGEN)).toBeNull()
  expect(pathDesdeUrlBranding(42, ORIGEN)).toBeNull()
})

// ─── Objeto devuelto y recorte ───────────────────────────────────────────────

test('30. el objeto devuelto es limpio y el merge lo acepta íntegro', () => {
  const cuerpo = {
    nombre: '  Escuela X ',
    colores: { acento: '#ff0000', primario: null },
    whatsapp: '5219991234567',
    whatsappUrl: 'https://evil.com',
    landing: { hero_titulo: 'Título ', hero_badges: [' a '], ciudad: '', testimonios: null },
    precios: { inscripcion: 700 },
    modalidades: { '3_meses': { mensualidad: 2500, activa: null }, '6_meses': null },
    redes: { facebook: '' },
  }
  const r = ok(vSinEscalon(cuerpo))
  expect(r).toEqual({
    nombre: 'Escuela X',
    colores: { acento: '#FF0000' },
    whatsapp: '5219991234567',
    whatsappUrl: 'https://wa.me/5219991234567',
    landing: { hero_titulo: 'Título', hero_badges: ['a'], ciudad: '' },
    precios: { inscripcion: 700 },
    modalidades: { '3_meses': { mensualidad: 2500 } },
    redes: { facebook: '' },
  })
  // Todo lo devuelto lo aplica el merge (nada se ignora en silencio)
  const m = mergeSiteConfig(CONFIG, r)
  expect(m.nombre).toBe('Escuela X')
  expect(m.colores.acento).toBe('#FF0000')
  expect(m.whatsappUrl).toBe('https://wa.me/5219991234567')
  expect(m.landing.hero_titulo).toBe('Título')
  expect(m.landing.hero_badges).toEqual(['a'])
  expect(m.precios.inscripcion).toBe(700)
  expect(m.modalidades[0].mensualidad).toBe(2500)
  expect(m.precios.plan3mMensualidad).toBe(2500)
  // El primer error manda: se devuelve uno, con su clave
  const e = v({ nombre: '', colores: { acento: 'x' } })
  expect(e.ok).toBe(false)
  if (!e.ok) expect(e.clave).toBe('nombre')
})

test('31. recortarAEditables: solo claves editables, modalidades completas, sin referencias', () => {
  const cfg = BASE()
  const r = recortarAEditables(cfg) as unknown as Record<string, unknown>
  // Nada fuera de la lista
  expect(r).not.toHaveProperty('modo')
  expect(r).not.toHaveProperty('niveles')
  expect(r).not.toHaveProperty('dominio')
  expect(r).not.toHaveProperty('pagos')
  expect(r.landing).not.toHaveProperty('mostrarCatalogoCursos')
  expect(r.landing).not.toHaveProperty('convenios')
  expect(r.landing).not.toHaveProperty('certificacion_secundaria')
  // `precios` lleva EXACTAMENTE las claves de la lista blanca —ni un alias
  // legacy—, cada una con su valor de config.ts (los precios por nivel de la
  // Fase 2 nacen en `null`). La lista sale de CLAVES_EDITABLES para no tener que
  // tocar esta prueba cada vez que se abre un precio al editor.
  const clavesPrecios = CLAVES_EDITABLES.filter((c) => c.startsWith('precios.')).map((c) => c.slice('precios.'.length))
  const preciosDeConfig = CONFIG.precios as unknown as Record<string, unknown>
  expect(r.precios).toEqual(Object.fromEntries(clavesPrecios.map((k) => [k, preciosDeConfig[k]])))
  expect(Object.keys(r.colores as object).sort()).toEqual(Object.keys(CONFIG.colores).sort())
  // Toda clave editable está presente (salvo modalidades, que va como arreglo)
  for (const ruta of CLAVES_EDITABLES) {
    if (ruta === 'modalidades') continue
    let actual: unknown = r
    for (const seg of ruta.split('.')) actual = (actual as Record<string, unknown>)[seg]
    expect(actual, ruta).not.toBeUndefined()
  }
  expect(r.modalidades).toEqual(JSON.parse(JSON.stringify(CONFIG.modalidades)))
  // Sin referencias compartidas con la config de entrada
  expect(r.landing).not.toBe(cfg.landing)
  expect((r.landing as Record<string, unknown>).faq_items).not.toBe(cfg.landing.faq_items)
  expect(r.modalidades).not.toBe(cfg.modalidades)
  ;(r.modalidades as Array<{ mensualidad: number }>)[0].mensualidad = 1
  expect(cfg.modalidades[0].mensualidad).toBe(CONFIG.modalidades[0].mensualidad)
})

test('32. recortarOverrides: la fila que devuelve el GET va recortada a la lista blanca', () => {
  const bucket = `${ORIGEN}${PREFIJO_PUBLICO_BRANDING}logo-claro-1.png`
  const idConocido = CONFIG.modalidades[0].id
  // Una fila escrita con la service role: mezcla claves editables con otras
  // que la API rechazaría si el editor se las devolviera en su siguiente PUT.
  const fila = JSON.parse(JSON.stringify({
    nombre: 'Escuela X',
    modo: 'solo_cursos',
    prefijoMatricula: 'X',
    logo: bucket,
    colores: { acento: '#FF0000', inventado: '#000000' },
    landing: { hero_titulo: 'T', hero_badges: ['a', 'b'], mostrarCatalogoCursos: false, convenios: ['x'] },
    precios: { inscripcion: 700, plan3mMensualidad: 1 },
    redes: { facebook: 'https://facebook.com/x', tiktok: 'https://tiktok.com/x' },
    modalidades: {
      [idConocido]: { mensualidad: 2500, activa: true, meses: 99 },
      inventada: { activa: true },
      nula: null,
    },
  }))
  const r = recortarOverrides(fila, BASE()) as unknown as Record<string, unknown>
  expect(r).toEqual({
    nombre: 'Escuela X',
    logo: bucket,
    colores: { acento: '#FF0000' },
    landing: { hero_titulo: 'T', hero_badges: ['a', 'b'] },
    precios: { inscripcion: 700 },
    redes: { facebook: 'https://facebook.com/x' },
    modalidades: { [idConocido]: { mensualidad: 2500, activa: true } },
  })
  // Lo recortado se puede volver a guardar tal cual (es lo que hará el editor)
  ok(vSinEscalon(r, ORIGEN))

  // Sin `base` los ids no se filtran (solo la forma); con ella, sí.
  const soloForma = recortarOverrides(fila) as unknown as Record<string, unknown>
  expect(Object.keys(soloForma.modalidades as object).sort()).toEqual([idConocido, 'inventada'].sort())

  // Casos límite: nada que recortar, tipos raros y nombres de prototipo
  expect(recortarOverrides({})).toEqual({})
  expect(recortarOverrides(null)).toEqual({})
  expect(recortarOverrides('x')).toEqual({})
  expect(recortarOverrides([1, 2])).toEqual({})
  expect(recortarOverrides({ landing: 'no-es-objeto' })).toEqual({})
  expect(recortarOverrides({ modalidades: 'x' })).toEqual({})
  expect(recortarOverrides(JSON.parse('{"__proto__":{"polluted":true},"nombre":"A"}'))).toEqual({ nombre: 'A' })
  expect(recortarOverrides(JSON.parse(`{"modalidades":{"__proto__":{"activa":true}}}`))).toEqual({})
  expect(({} as Record<string, unknown>).polluted).toBeUndefined()

  // Clona: tocar el resultado no toca la fila leída
  const arreglo = (r.landing as Record<string, unknown>).hero_badges as string[]
  arreglo[0] = 'z'
  expect(fila.landing.hero_badges[0]).toBe('a')
})
