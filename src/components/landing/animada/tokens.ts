/**
 * Tokens de la landing ANIMADA.
 *
 * ── Qué resuelve este archivo ────────────────────────────────────────────────
 *
 * La landing tiene tres caras —`claro`, `suave` y `oscuro`— y cada sección
 * declara la suya. Aquí se decide qué color lleva CADA cosa en cada cara, y se
 * decide MIDIENDO: ningún token sale de un hexadecimal escrito a mano, todos se
 * derivan de `CONFIG.colores` (lo que el cliente configura y puede cambiar desde
 * «Personalizar mi página») y pasan por `colorLegibleSobre`, que devuelve el
 * color intacto cuando ya cumple y lo ajusta cuando no.
 *
 * Por eso la misma landing sirve para una marca navy, una monocromática o una
 * de dos colores vivos: lo que cambia es la paleta de entrada.
 *
 * ── Las dos lecciones que están cableadas aquí ───────────────────────────────
 *
 * 1. 🛑 DOS COLORES DE MARCA NO SIEMPRE CONTRASTAN ENTRE SÍ. Un azul y un morado
 *    vivos pueden dar 1.43 entre ellos aunque los dos se lean sobre blanco: un
 *    botón de acento dentro de un bloque de primario se empasta. Por eso DENTRO
 *    de `oscuro` no entra ningún color de marca: el botón es blanco con letra
 *    del propio fondo, y los realces son tintes derivados del fondo oscuro.
 * 2. 🛑 UN ACENTO QUE PASA AA POR POCO NO SIRVE PARA TODO. El acento se usa como
 *    RELLENO de botón (con letra encima) y como LETRA sobre el papel, y esos dos
 *    usos piden cosas distintas. Se calculan por separado (`btnFondo` /
 *    `acentoTexto`) en vez de reutilizar el mismo hex.
 *
 * 🛑 En los `.tsx` de la landing no hay un solo hexadecimal: todo llega de aquí.
 */
import { aclarar, colorLegibleSobre, oscurecer, oscurecerHasta, ratioContraste, sugerirTextoSobre } from '@/lib/contraste'

export type Variante = 'claro' | 'suave' | 'oscuro'

/** Blanco: la letra sobre los bloques oscuros y el papel de la página. */
export const BLANCO = '#FFFFFF'

/** Paleta de respaldo, por si un cliente deja una clave vacía. */
const RESPALDO = {
  primario: '#0F172A',
  acento: '#3B82F6',
  texto: '#0F172A',
  textoSecundario: '#525252',
  fondo: '#F8FAFC',
  borde: '#E5E7EB',
} as const

export type Paleta = {
  /** El color de marca de los títulos y de los bloques oscuros. */
  marca: string
  /** Fondo de las secciones oscuras: el primario oscurecido hasta que el blanco se lea (≥ 7). */
  marcaProfunda: string
  /** El acento como RELLENO de botón, con `accionTexto` encima. */
  accion: string
  accionTexto: string
  accionHover: string
  /** El acento como LETRA sobre el papel (no siempre es el mismo hex que `accion`). */
  acentoTexto: string
  /** Realce DENTRO de los bloques oscuros. 🛑 Nunca un color de marca crudo. */
  realceOscuro: string
  /** Secundario dentro de los bloques oscuros (el equivalente al gris, pero claro). */
  suaveOscuro: string
  tinta: string
  grisTexto: string
  superficie: string
  blanco: string
  bordeClaro: string
  bordeOscuro: string
  /** ¿El acento y el primario son el mismo color? Entonces el CTA secundario va de contorno. */
  marcaYAccionIguales: boolean
}

type ColoresEditables = Partial<Readonly<Record<
  'primario' | 'secundario' | 'acento' | 'texto' | 'textoSecundario' | 'fondo' | 'borde', string
>>>

const hex = (v: string | undefined, respaldo: string) =>
  typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v.trim()) ? v.trim().toUpperCase() : respaldo

/**
 * La paleta de la landing a partir de los colores editables.
 *
 * Cada letra se mide contra el fondo MÁS exigente en el que se usa: las de las
 * secciones claras contra la superficie (más oscura que el blanco) y las de las
 * oscuras contra el fondo profundo.
 */
export function paletaDesde(colores?: ColoresEditables | null): Paleta {
  const superficie = hex(colores?.fondo, RESPALDO.fondo)
  const primario = hex(colores?.primario, RESPALDO.primario)
  const acento = hex(colores?.acento, RESPALDO.acento)

  // El bloque oscuro: el primario oscurecido hasta que el blanco se lea con
  // holgura (7), porque encima van textos secundarios más claros.
  const marcaProfunda = oscurecerHasta(primario, BLANCO, 7)

  // El acento como RELLENO: si la letra que le toca encima no llega a AA, se
  // oscurece el relleno hasta que sí (un amarillo pasa a ámbar, no a gris).
  const letraSobreAcento = sugerirTextoSobre(acento)
  const accion = ratioContraste(letraSobreAcento, acento) >= 4.5
    ? acento
    : oscurecerHasta(acento, letraSobreAcento, 4.5)
  const accionTexto = sugerirTextoSobre(accion)
  // El hover del botón: un punto más oscuro, y si eso deja la letra corta, se
  // ajusta la letra (no el hover) para no cambiar el color de marca.
  const accionHover = oscurecer(accion, 0.14)

  return {
    marca: colorLegibleSobre(primario, superficie, 4.5),
    marcaProfunda,
    accion,
    accionTexto: colorLegibleSobre(accionTexto, accion, 4.5),
    accionHover: ratioContraste(accionTexto, accionHover) >= 4.5 ? accionHover : accion,
    acentoTexto: colorLegibleSobre(acento, superficie, 4.5),
    // 🛑 Los realces del bloque oscuro NO son editables ni son colores de marca:
    // son el propio fondo aclarado hasta que se lee encima. Un acento crudo aquí
    // es justo lo que se empasta cuando los dos colores de marca están cerca.
    realceOscuro: colorLegibleSobre(aclarar(marcaProfunda, 0.62), marcaProfunda, 4.5),
    suaveOscuro: colorLegibleSobre(aclarar(marcaProfunda, 0.78), marcaProfunda, 4.5),
    tinta: colorLegibleSobre(hex(colores?.texto, RESPALDO.texto), superficie, 4.5),
    grisTexto: colorLegibleSobre(hex(colores?.textoSecundario, RESPALDO.textoSecundario), superficie, 4.5),
    superficie,
    blanco: BLANCO,
    bordeClaro: hex(colores?.borde, RESPALDO.borde),
    bordeOscuro: aclarar(marcaProfunda, 0.22),
    // Con `acento === primario` (pasa cuando la escuela reserva su segundo color
    // para otra cosa) los dos CTA saldrían idénticos: el secundario va de contorno.
    marcaYAccionIguales: ratioContraste(primario, accion) < 1.2,
  }
}

export type TokensSeccion = {
  fondo: string
  /** Tarjetas y bloques dentro de la sección. */
  superficie: string
  titulo: string
  texto: string
  textoSuave: string
  /** Enlaces y palabras destacadas. 🛑 Nunca párrafos enteros. */
  acentoTexto: string
  borde: string
  /** CTA primario. */
  btnFondo: string
  btnTexto: string
  btnHover: string
  /** CTA secundario. */
  btn2Fondo: string
  btn2Texto: string
  btn2Borde: string
  /** SOLO formas, filetes e íconos decorativos. */
  decorativo: string
  chipFondo: string
  chipTexto: string
}

/**
 * Los colores de una sección según su variante.
 *
 * `claro` es fondo blanco con tarjetas en superficie; `suave` es fondo
 * superficie con tarjetas blancas. Así dos secciones claras seguidas nunca
 * quedan idénticas.
 */
export function tokensDe(variante: Variante, p: Paleta): TokensSeccion {
  if (variante === 'oscuro') {
    return {
      fondo: p.marcaProfunda,
      superficie: 'rgba(255,255,255,0.08)',
      titulo: BLANCO,
      texto: BLANCO,
      textoSuave: p.suaveOscuro,
      acentoTexto: p.realceOscuro,
      borde: p.bordeOscuro,
      // 🛑 Dentro del bloque oscuro el botón es BLANCO con letra del fondo: un
      // botón del color de acento puede quedar a 1.4 del fondo (ver cabecera).
      btnFondo: BLANCO,
      btnTexto: p.marcaProfunda,
      btnHover: p.suaveOscuro,
      btn2Fondo: 'transparent',
      btn2Texto: BLANCO,
      btn2Borde: BLANCO,
      decorativo: p.realceOscuro,
      chipFondo: BLANCO,
      chipTexto: p.marcaProfunda,
    }
  }
  const suave = variante === 'suave'
  return {
    fondo: suave ? p.superficie : p.blanco,
    superficie: suave ? p.blanco : p.superficie,
    titulo: p.marca,
    texto: p.tinta,
    textoSuave: p.grisTexto,
    // En `suave` el acento de texto es la marca: sobre la superficie un acento
    // vivo suele quedarse corto, y el título ya está medido contra ese fondo.
    acentoTexto: suave ? p.marca : p.acentoTexto,
    borde: p.bordeClaro,
    btnFondo: p.accion,
    btnTexto: p.accionTexto,
    btnHover: p.accionHover,
    // El secundario es la MARCA sólida; si la marca y el acento son el mismo
    // color, va de contorno para que los dos botones no se confundan.
    btn2Fondo: p.marcaYAccionIguales ? 'transparent' : p.marca,
    btn2Texto: p.marcaYAccionIguales ? p.marca : colorLegibleSobre(sugerirTextoSobre(p.marca), p.marca, 4.5),
    btn2Borde: p.marca,
    decorativo: suave ? p.marca : p.acentoTexto,
    chipFondo: p.accion,
    chipTexto: p.accionTexto,
  }
}

/* ─── Orden de la página ─────────────────────────────────────────────────── */

export type IdSeccion =
  | 'hero' | 'franja' | 'dolor' | 'niveles' | 'planes' | 'licenciaturas' | 'validez'
  | 'transformacion' | 'proceso' | 'testimonios' | 'beneficios'
  | 'catalogo' | 'faq' | 'cta' | 'contacto' | 'pie'

export type Seccion = { id: IdSeccion; variante: Variante }

/** Secciones que pueden faltar: listas vaciadas desde el panel, sin validez, sin cursos. */
export type SeccionOpcional = Exclude<IdSeccion, 'hero' | 'franja' | 'niveles' | 'planes' | 'cta' | 'contacto' | 'pie'>

/**
 * El orden de la página.
 *
 * ⭐ LICENCIATURAS VA JUSTO DESPUÉS DE PLANES: es el tercer programa y su costo
 * se lee al lado de los otros dos. Antes de la Validez Oficial, cuyo kicker dice
 * de qué niveles es —si no, la licenciatura podría leerse como cubierta por ese
 * folio—.
 *
 * ⚠️ EL CTA VA ANTES DEL CONTACTO: con el CTA al final quedarían dos bloques
 * oscuros pegados (CTA y pie). Una posición arriba la página cierra «CTA
 * (oscuro) · contacto (claro) · pie (oscuro)», y se lee mejor: primero
 * «inscríbete», luego «¿dudas?».
 */
export const ORDEN_SECCIONES: readonly IdSeccion[] = [
  'hero', 'franja', 'dolor', 'niveles', 'planes', 'licenciaturas', 'validez',
  'transformacion', 'proceso', 'testimonios', 'beneficios',
  'catalogo', 'faq', 'cta', 'contacto', 'pie',
]

export const SECCIONES_OPCIONALES: readonly SeccionOpcional[] = [
  'dolor', 'licenciaturas', 'validez', 'transformacion', 'proceso', 'testimonios', 'beneficios', 'catalogo', 'faq',
]

/** Las secciones de color. Todas las demás son claras (blanco o superficie). */
const OSCURAS: ReadonlySet<IdSeccion> = new Set<IdSeccion>(['franja', 'validez', 'beneficios', 'cta', 'pie'])

/**
 * Qué cara PREFIERE cada sección clara cuando no la obliga alternar con otra:
 * hero blanco, niveles blanco, planes suave y contacto blanco; el resto se
 * acomoda alrededor para que eso se cumpla con la página completa.
 */
const PREFERIDA: Partial<Record<IdSeccion, Exclude<Variante, 'oscuro'>>> = {
  hero: 'claro',
  dolor: 'suave',
  niveles: 'claro',
  planes: 'suave',
  licenciaturas: 'claro',
  transformacion: 'claro',
  proceso: 'suave',
  testimonios: 'claro',
  catalogo: 'claro',
  faq: 'suave',
  contacto: 'claro',
}

const esClara = (s?: Seccion): boolean => s !== undefined && s.variante !== 'oscuro'

/**
 * El orden real de la página y la variante de cada sección.
 *
 * 🛑 Entre dos bloques oscuros hay SIEMPRE uno claro o suave, y dos secciones
 *    claras seguidas alternan blanco y superficie: vaciar una lista desde el
 *    panel —que quita una sección entera— no deja dos fondos iguales pegados. Lo
 *    verifica `secuenciaValida` para las 512 combinaciones posibles.
 */
export function secuenciaSecciones(presentes: Partial<Record<SeccionOpcional, boolean>> = {}): Seccion[] {
  const ids = ORDEN_SECCIONES.filter(id =>
    !(SECCIONES_OPCIONALES as readonly IdSeccion[]).includes(id) || presentes[id as SeccionOpcional] === true)
  const salida: Seccion[] = []
  for (const id of ids) {
    const previa = salida[salida.length - 1]
    const quiereOscura = OSCURAS.has(id) && !(previa?.variante === 'oscuro')
    let variante: Variante
    if (quiereOscura) variante = 'oscuro'
    else if (esClara(previa)) variante = previa!.variante === 'claro' ? 'suave' : 'claro'
    else variante = PREFERIDA[id] ?? 'claro'
    salida.push({ id, variante })
  }
  return salida
}

/** Ni dos oscuros seguidos ni dos secciones con el mismo fondo pegadas. */
export function secuenciaValida(secuencia: readonly Seccion[]): boolean {
  return secuencia.every((s, i) => {
    const previa = secuencia[i - 1]
    if (!previa) return true
    return s.variante !== previa.variante
  })
}
