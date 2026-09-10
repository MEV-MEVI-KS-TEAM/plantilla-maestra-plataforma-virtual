import { test, expect } from '@playwright/test'
import {
  MAX_DIGITOS_TELEFONO,
  advertenciasContraste,
  aplicarPaleta,
  coloresEfectivos,
  escribirModalidad,
  escribirRuta,
  estaSobrescrito,
  formatoDinero,
  hayCambiosDePrecio,
  leerRuta,
  mismoContenido,
  modalidadesEfectivas,
  normalizarTelefono,
  paletaActiva,
  parseEntero,
  prepararParaPublicar,
  puedeDesactivar,
  quitarRuta,
  sincronizarLogos,
  valorEfectivo,
  type ModalidadEditable,
} from '@/lib/site-config-editor'
import { PALETAS, TOKENS_COLORES, paletaPorId, type TokensColores } from '@/lib/site-config-paletas'
import { ratioContraste } from '@/lib/contraste'
import type { SiteConfigOverrides } from '@/lib/site-config-core'

/**
 * Personalizar mi página (F5) — helpers del editor.
 *
 * Lo que estas pruebas protegen: el editor construye a mano el objeto que
 * acaba en `site_config.data` de ~144 escuelas. Un `escribirRuta` que mute el
 * estado anterior, un "Restaurar" que deje `{ colores: {} }` o un
 * `prepararParaPublicar` que mande `whatsappUrl` sin número se manifiestan en
 * producción como "el panel no guarda" — sin traza y sin nadie a quien
 * preguntarle. Aquí no hay red, ni service role, ni navegador: son funciones
 * puras y se comprueban como tales.
 */

const ORIGINAL = PALETAS[0]

function coloresBase(): TokensColores {
  return { ...ORIGINAL.colores }
}

const MODALIDADES: ModalidadEditable[] = [
  { id: '3_meses', label: '3 meses — Express', meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 meses — Estándar', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true },
]

// ─── Rutas ───────────────────────────────────────────────────────────────────

test('escribirRuta crea los intermedios y NO muta el objeto anterior', () => {
  const antes: SiteConfigOverrides = {}
  const despues = escribirRuta(antes, 'landing.hero_titulo', 'Hola')

  expect(leerRuta(despues, 'landing.hero_titulo')).toBe('Hola')
  // El estado anterior es el que el editor usa para saber si hay cambios sin
  // publicar: si se mutara, "publicar" quedaría deshabilitado para siempre.
  expect(antes).toEqual({})
  expect(despues).not.toBe(antes)
})

test('escribirRuta conserva las ramas hermanas y no las clona por gusto', () => {
  const antes = escribirRuta({ colores: { acento: '#111111' } } as SiteConfigOverrides, 'nombre', 'MEV')
  const despues = escribirRuta(antes, 'nombre', 'MEVI')

  expect(despues.nombre).toBe('MEVI')
  // `colores` no se tocó: misma referencia, sin clon profundo innecesario.
  expect(despues.colores).toBe(antes.colores)
})

test('leerRuta devuelve undefined si el camino se corta o la ruta es peligrosa', () => {
  expect(leerRuta({ a: { b: 1 } }, 'a.b')).toBe(1)
  expect(leerRuta({ a: 1 }, 'a.b')).toBeUndefined()
  expect(leerRuta({}, 'no.existe')).toBeUndefined()
  expect(leerRuta({ a: 1 }, '__proto__.polucion')).toBeUndefined()
})

test('quitarRuta borra la hoja y poda los intermedios que quedan vacíos', () => {
  const con = escribirRuta({}, 'colores.acento', '#FF0000')
  const sin = quitarRuta(con, 'colores.acento')

  // Un `{ colores: {} }` residual no rompe la API, pero sí la comparación de
  // "cambios sin publicar": el editor lo vería distinto de `{}` para siempre.
  expect(sin).toEqual({})
  expect(con.colores).toEqual({ acento: '#FF0000' })
})

test('quitarRuta conserva las hojas hermanas del mismo objeto', () => {
  let ov = escribirRuta({}, 'colores.acento', '#FF0000')
  ov = escribirRuta(ov, 'colores.fondo', '#FFFFFF')
  const sin = quitarRuta(ov, 'colores.acento')

  expect(sin).toEqual({ colores: { fondo: '#FFFFFF' } })
})

test('valorEfectivo cae al default y estaSobrescrito distingue los dos casos', () => {
  const defaults = { nombre: 'MEV', landing: { hero_titulo: 'De fábrica' } }
  const ov = escribirRuta({}, 'landing.hero_titulo', 'Mío')

  expect(valorEfectivo(defaults, ov, 'landing.hero_titulo')).toBe('Mío')
  expect(valorEfectivo(defaults, ov, 'nombre')).toBe('MEV')
  expect(estaSobrescrito(ov, 'landing.hero_titulo')).toBe(true)
  expect(estaSobrescrito(ov, 'nombre')).toBe(false)
})

// ─── Teléfono ────────────────────────────────────────────────────────────────

test('normalizarTelefono limpia ANTES de recortar y guarda el número entero', () => {
  // El fallo que arregla: con el tope de 13 puesto en el `maxlength` del input,
  // pegar '+5219991234567' dejaba en el campo '+521999123456' y de ahí salía
  // '521999123456' — doce dígitos, que el validador ACEPTA. Se publicaba un
  // WhatsApp truncado, con el campo en verde y sin un solo error a la vista.
  expect(normalizarTelefono('+5219991234567')).toBe('5219991234567')
  expect(normalizarTelefono('+521 999 123 4567')).toBe('5219991234567')
  expect(normalizarTelefono('(999) 123-4567')).toBe('9991234567')
  expect(normalizarTelefono('')).toBe('')
})

test('normalizarTelefono corta en los 13 dígitos que admite el validador', () => {
  expect(MAX_DIGITOS_TELEFONO).toBe(13)
  expect(normalizarTelefono('12345678901234567')).toBe('1234567890123')
  // Lo que sale de aquí con lada completa pasa el `^\d{10,13}$` del servidor.
  expect(/^\d{10,13}$/.test(normalizarTelefono('+52 1 (999) 123 45 67'))).toBe(true)
})

// ─── Modalidades ─────────────────────────────────────────────────────────────

test('escribirModalidad fusiona por id y `null` quita el override', () => {
  let ov = escribirModalidad({}, '3_meses', { mensualidad: 2500 })
  expect(ov.modalidades).toEqual({ '3_meses': { mensualidad: 2500 } })

  ov = escribirModalidad(ov, '3_meses', { activa: false })
  expect(ov.modalidades).toEqual({ '3_meses': { mensualidad: 2500, activa: false } })

  ov = escribirModalidad(ov, '3_meses', { mensualidad: null })
  expect(ov.modalidades).toEqual({ '3_meses': { activa: false } })

  // Sin ningún override efectivo, la clave entera desaparece: es lo que hace
  // que el merge devuelva la modalidad tal cual viene de config.ts.
  ov = escribirModalidad(ov, '3_meses', { activa: null })
  expect(ov.modalidades).toBeUndefined()
})

test('modalidadesEfectivas aplica mensualidad y activa sin cambiar el orden', () => {
  const ov: SiteConfigOverrides = { modalidades: { '6_meses': { mensualidad: 1200, activa: false } } }
  const efectivas = modalidadesEfectivas(MODALIDADES, ov.modalidades)

  expect(efectivas.map((m) => m.id)).toEqual(['3_meses', '6_meses'])
  expect(efectivas[0]).toEqual(MODALIDADES[0])
  expect(efectivas[1].mensualidad).toBe(1200)
  expect(efectivas[1].activa).toBe(false)
  // La base no se toca: es la respuesta del GET, compartida por toda la página.
  expect(MODALIDADES[1].mensualidad).toBe(1000)
})

test('puedeDesactivar dice que no cuando queda una sola modalidad activa', () => {
  const dos = modalidadesEfectivas(MODALIDADES, undefined)
  expect(puedeDesactivar(dos, '3_meses')).toBe(true)

  const una = modalidadesEfectivas(MODALIDADES, { '6_meses': { activa: false } })
  expect(puedeDesactivar(una, '3_meses')).toBe(false)
  // La ya apagada no se puede "desactivar" otra vez, ni existe la inventada.
  expect(puedeDesactivar(una, '6_meses')).toBe(false)
  expect(puedeDesactivar(una, 'no_existe')).toBe(false)
})

// ─── Paletas ─────────────────────────────────────────────────────────────────

test('aplicarPaleta con la ORIGINAL quita `colores` en vez de escribirlo', () => {
  const con = aplicarPaleta({ nombre: 'MEV' }, PALETAS[1])
  expect(Object.keys(con.colores ?? {}).length).toBe(TOKENS_COLORES.length)

  const restaurada = aplicarPaleta(con, ORIGINAL)
  // Quitar `colores` devuelve los colores del cliente, que pueden no ser los
  // de la plantilla; escribir los de la paleta original se los cambiaría.
  expect(restaurada.colores).toBeUndefined()
  expect(restaurada.nombre).toBe('MEV')
})

test('aplicarPaleta escribe los 12 tokens exactos de la paleta elegida', () => {
  const guinda = paletaPorId('guinda')!
  const ov = aplicarPaleta({}, guinda)

  for (const token of TOKENS_COLORES) {
    expect(ov.colores?.[token]).toBe(guinda.colores[token])
  }
})

test('paletaActiva: sin colores es la original, con una curada su id, a mano null', () => {
  expect(paletaActiva({}, { colores: coloresBase() })).toBe(ORIGINAL.id)

  const morado = paletaPorId('morado')!
  expect(paletaActiva(aplicarPaleta({}, morado), { colores: coloresBase() })).toBe('morado')

  const aMano = escribirRuta(aplicarPaleta({}, morado), 'colores.acento', '#123456')
  expect(paletaActiva(aMano, { colores: coloresBase() })).toBeNull()
})

test('coloresEfectivos mezcla los del cliente con los que aún no se publican', () => {
  const base = coloresBase()
  const efectivos = coloresEfectivos(base, escribirRuta({}, 'colores.acento', '#FF0000'))

  expect(efectivos.acento).toBe('#FF0000')
  expect(efectivos.fondo).toBe(base.fondo)
})

// ─── Contraste ───────────────────────────────────────────────────────────────

test('advertenciasContraste calla con la paleta original aunque el par falle', () => {
  const rotos: TokensColores = { ...coloresBase(), texto: '#EEEEEE' }
  // Los colores de fábrica del cliente llevan meses en producción: el admin no
  // los eligió en esta pantalla y no se le acusa de haberlos roto.
  expect(advertenciasContraste(rotos, true)).toEqual([])
})

test('advertenciasContraste marca el par roto y su sugerencia sí cumple', () => {
  const rotos: TokensColores = { ...coloresBase(), texto: '#AAAAAA' }
  const avisos = advertenciasContraste(rotos, false)

  const aviso = avisos.find((a) => a.par.a === 'texto' && a.par.b === 'fondo')
  expect(aviso, 'texto #AAAAAA sobre un fondo casi blanco tiene que advertir').toBeTruthy()
  expect(aviso!.ratio).toBeLessThan(aviso!.minimo)
  expect(aviso!.sugerencia).toBeTruthy()
  expect(aviso!.sugerencia!.token).toBe('texto')
  // La sugerencia no es decorativa: aplicarla tiene que resolver el problema.
  expect(ratioContraste(aviso!.sugerencia!.valor, rotos.fondo)).toBeGreaterThanOrEqual(aviso!.minimo)
})

test('advertenciasContraste propone blanco o casi negro para el texto de los botones', () => {
  // Amarillo con texto blanco encima: el arreglo es cambiar el TEXTO, no el
  // acento que el admin acaba de elegir.
  const rotos: TokensColores = { ...coloresBase(), acento: '#FFD400', acentoHover: '#E6BE00' }
  const avisos = advertenciasContraste(rotos, false)

  const aviso = avisos.find((a) => a.par.b === 'textoSobreAcento')
  expect(aviso).toBeTruthy()
  expect(aviso!.sugerencia).toEqual({ token: 'textoSobreAcento', valor: '#0A0A0A' })
})

test('las 11 paletas nuevas no producen ni una advertencia; la original se calla por bandera', () => {
  for (const p of PALETAS) {
    if (p.original) {
      // EXCEPCIÓN DOCUMENTADA (la misma de tests/unit/paletas.spec.ts): la
      // paleta original calca CONFIG.colores de los ~144 clientes y su acento
      // #3B82F6 sobre blanco da 3.68 — cumple AA de componentes (3.0) pero no
      // de texto (4.5). Subirlo cambiaría el botón de toda la flota. Por eso
      // el editor la marca "Original" y `esOriginal` apaga las advertencias.
      expect(advertenciasContraste(p.colores, true), `paleta ${p.id}`).toEqual([])
      continue
    }
    // Las demás se evalúan como si el admin las acabara de elegir, que es
    // cuando el editor sí advierte, y no deben tener ni un par por debajo.
    expect(advertenciasContraste(p.colores, false), `paleta ${p.id}`).toEqual([])
  }
})

// ─── Números ─────────────────────────────────────────────────────────────────

test('formatoDinero pinta pesos sin centavos y aguanta un valor inválido', () => {
  expect(formatoDinero(2000)).toBe('$2,000')
  expect(formatoDinero(599)).toBe('$599')
  expect(formatoDinero(0)).toBe('$0')
  expect(formatoDinero(50000)).toBe('$50,000')
  expect(formatoDinero(Number.NaN)).toBe('$0')
})

test('formatoDinero sin moneda explícita es idéntico a pasarle MXN (invariante de la flota)', () => {
  for (const n of [0, 1, 599, 2000, 12345, 50000]) {
    expect(formatoDinero(n)).toBe(formatoDinero(n, 'MXN'))
  }
})

test('formatoDinero marca la moneda cuando la escuela NO cobra en pesos', () => {
  // Sin el código, un plan de 300 dólares se lee como 300 pesos: 17 veces
  // más barato de lo que el alumno va a pagar. Es el fallo que este PR cierra.
  expect(formatoDinero(300, 'USD')).toBe('$300 USD')
  expect(formatoDinero(1400, 'USD')).toBe('$1,400 USD')
  expect(formatoDinero(Number.NaN, 'USD')).toBe('$0 USD')
})

test('parseEntero acepta lo que el admin ve en pantalla y rechaza lo demás', () => {
  expect(parseEntero('2000')).toBe(2000)
  expect(parseEntero(' $2,000 ')).toBe(2000)
  expect(parseEntero('')).toBeNull()
  expect(parseEntero('abc')).toBeNull()
  // Un precio mal capturado tiene que verse rojo, no redondearse solo.
  expect(parseEntero('1500.50')).toBeNull()
  expect(parseEntero('-100')).toBeNull()
})

// ─── Publicar ────────────────────────────────────────────────────────────────

test('hayCambiosDePrecio detecta precios y modalidades, no los textos', () => {
  const base: SiteConfigOverrides = { precios: { inscripcion: 599 } }

  expect(hayCambiosDePrecio(base, escribirRuta(base, 'landing.hero_titulo', 'Otro'))).toBe(false)
  expect(hayCambiosDePrecio(base, escribirRuta(base, 'precios.inscripcion', 799))).toBe(true)
  // Apagar un plan lo saca de la landing y del registro: cuenta como cambio.
  expect(hayCambiosDePrecio(base, escribirModalidad(base, '3_meses', { activa: false }))).toBe(true)
})

test('prepararParaPublicar quita logo, logoOscuro y whatsappUrl', () => {
  const ov = {
    nombre: 'MEV',
    logo: 'https://x.supabase.co/storage/v1/object/public/branding/logo-claro-1.png',
    logoOscuro: '/logo.png',
    // Un cliente que ya guardó su WhatsApp tiene las dos claves en la fila; si
    // el admin restaura el número, mandar la URL sola es un 400 del servidor.
    whatsapp: '5219991234567',
    whatsappUrl: 'https://wa.me/5219991234567',
    colores: {},
  } as unknown as SiteConfigOverrides

  const cuerpo = prepararParaPublicar(ov)

  expect(cuerpo).toEqual({ nombre: 'MEV', whatsapp: '5219991234567' })
  // No muta el estado del formulario: el logo se sigue viendo en pantalla.
  expect((ov as Record<string, unknown>).logo).toBeTruthy()
})

test('sincronizarLogos copia solo logo/logoOscuro de la fila al borrador, sin tocar el resto', () => {
  const CLARO = 'https://x.supabase.co/storage/v1/object/public/branding/logo-claro-1.png'
  const borrador: SiteConfigOverrides = { nombre: 'Borrador', logoOscuro: '/viejo.png' }

  // Subió solo el claro: aparece `logo`, y `logoOscuro` (que la fila ya no
  // trae) se quita del borrador — es lo que decide el badge "Personalizado".
  const tras = sincronizarLogos(borrador, { logo: CLARO, nombre: 'Fila' })
  expect(tras).toEqual({ nombre: 'Borrador', logo: CLARO })
  expect(estaSobrescrito(tras, 'logo')).toBe(true)
  expect(estaSobrescrito(tras, 'logoOscuro')).toBe(false)

  // Quitó el claro: la fila viene sin logos y el borrador se queda sin ellos.
  expect(sincronizarLogos(tras, {})).toEqual({ nombre: 'Borrador' })

  // No muta la entrada.
  expect(borrador).toEqual({ nombre: 'Borrador', logoOscuro: '/viejo.png' })
})

test('mismoContenido ignora el orden de las claves', () => {
  // El servidor devuelve los overrides en el orden de la lista blanca y el
  // editor los reconstruye en el orden en que el admin toca los campos.
  expect(mismoContenido({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true)
  expect(mismoContenido({ a: 1 }, { a: 2 })).toBe(false)
})
