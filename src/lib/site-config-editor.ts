/**
 * "Personalizar mi página" (F5) — helpers PUROS del editor.
 *
 * Todo lo que el editor necesita pensar y que no es JSX vive aquí: escribir y
 * borrar rutas del objeto de overrides, aplicar una paleta, decidir qué paleta
 * está activa, calcular las advertencias de contraste, formatear pesos y
 * preparar el cuerpo del PUT.
 *
 * ISOMORFO a propósito (sin React, sin `server-only`, sin `next/*`): así estas
 * reglas se prueban en tests/unit sin montar un navegador, que es la única
 * forma de verificarlas en este repo — la API del editor necesita service role
 * y en local no hay.
 *
 * INMUTABILIDAD. `escribirRuta`/`quitarRuta`/`aplicarPaleta` devuelven objetos
 * NUEVOS y comparten estructura con el original en las ramas que no tocan. El
 * editor guarda los overrides en `useState`: mutar en sitio no volvería a
 * pintar, y peor, ensuciaría la copia "como se cargó" contra la que se calcula
 * si hay cambios sin publicar.
 *
 * QUÉ NO ESTÁ AQUÍ: la validación. Es exactamente la misma que aplica el
 * servidor y ya vive en `site-config-validacion.ts` (isomorfa); el editor la
 * importa tal cual para prevalidar antes de mandar el PUT. Duplicarla sería
 * abrir la puerta a que el navegador acepte lo que el servidor rechaza.
 */
import type { Moneda } from './moneda'
import { CONFIG } from '@/lib/config'
import { CLAVE_MENSUALIDAD_POR_NIVEL, inscripcionDe, mensualidadDe, type NivelConPrecio } from '@/lib/precios-nivel'
import { mergeSiteConfig, type OverrideModalidad, type SiteConfigOverrides } from '@/lib/site-config-core'
import { esSoloCursos } from '@/lib/modo'
import type { ModalidadPrograma } from '@/lib/modalidades'
import {
  PALETAS,
  PARES_CONTRASTE,
  TOKENS_COLORES,
  detectarPaleta,
  type Paleta,
  type TokensColores,
} from '@/lib/site-config-paletas'
import { aclarar, oscurecer, ratioContraste, sugerirTextoSobre } from '@/lib/contraste'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ObjetoPlano = Record<string, unknown>

/** Una modalidad tal como la devuelve el GET (`ConfigEditable['modalidades'][n]`). */
export interface ModalidadEditable {
  id: string
  label: string
  meses: number
  mensualidad: number
  /**
   * Cifras del cobro SEMANAL, solo en las escuelas que lo usan. Opcionales
   * porque el `CONFIG` de fábrica es mensual y no las declara.
   *
   * `semanas` viaja para poder MOSTRARLA junto al plan, no para editarla: es
   * estructura, igual que `meses` y `materiasPorMes`.
   */
  semanas?: number
  cuotaSemanal?: number
  /** Solo en una oferta asimétrica: el nivel al que aplica el plan (ver `planesPorNivel`). */
  nivel?: string
  materiasPorMes: number
  activa: boolean
}

/** Cambio propuesto por una advertencia de contraste: qué token y a qué valor. */
export interface SugerenciaContraste {
  token: keyof TokensColores
  valor: string
}

export interface AdvertenciaContraste {
  /** El par de `PARES_CONTRASTE` que no cumple (trae `etiqueta` para la UI). */
  par: (typeof PARES_CONTRASTE)[number]
  /** Ratio actual, redondeado a un decimal (es lo que se le enseña al admin). */
  ratio: number
  minimo: number
  /** `null` si ni oscureciendo ni aclarando al 90 % se alcanza el mínimo. */
  sugerencia: SugerenciaContraste | null
}

/**
 * `null` en un campo = QUITAR ese override (el mismo lenguaje que entiende la
 * API: una hoja en `null` vuelve al default de config.ts).
 */
export interface ParcialModalidad {
  mensualidad?: number | null
  /** La cuota de una semana, en las escuelas de cobro semanal. */
  cuotaSemanal?: number | null
  activa?: boolean | null
}

// ─── Utilidades internas ─────────────────────────────────────────────────────

function esObjetoPlano(v: unknown): v is ObjetoPlano {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Segmentos que nunca se escriben, pase lo que pase. Las rutas del editor
 * salen de `CLAVES_EDITABLES`, así que esto no debería dispararse jamás; está
 * porque `escribirRuta` construye objetos por nombre y un `__proto__` que se
 * colara por un `clave` de la respuesta del servidor contaminaría el prototipo
 * de todo el bundle.
 */
const SEGMENTOS_PROHIBIDOS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype'])

function rutaSegura(ruta: string): string[] | null {
  const segs = ruta.split('.')
  if (segs.length === 0 || segs.some((s) => s === '' || SEGMENTOS_PROHIBIDOS.has(s))) return null
  return segs
}

/** Clon profundo por JSON. Los overrides son JSON puro por definición. */
function clonar<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/**
 * JSON con las claves ORDENADAS, recursivamente. Comparar `JSON.stringify` a
 * secas haría depender la igualdad del orden de inserción: `{a,b}` y `{b,a}`
 * son el mismo override, pero el editor los construye en el orden en que el
 * admin toca los campos y el servidor los devuelve en el de la lista blanca.
 * Sin esto, abrir el editor y no tocar nada ya marcaría "cambios sin publicar".
 */
function canonico(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonico)
  if (esObjetoPlano(v)) {
    const salida: ObjetoPlano = {}
    for (const k of Object.keys(v).sort()) salida[k] = canonico(v[k])
    return salida
  }
  return v
}

/** ¿Dos objetos de overrides tienen el mismo contenido? (orden de claves aparte) */
export function mismoContenido(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonico(a)) === JSON.stringify(canonico(b))
}

/** Quita, EN SITIO, los objetos que quedaron sin ninguna hoja. */
function podarVacios(obj: ObjetoPlano): void {
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v === undefined) {
      delete obj[k]
      continue
    }
    if (esObjetoPlano(v)) {
      podarVacios(v)
      if (Object.keys(v).length === 0) delete obj[k]
    }
  }
}

// ─── Rutas ───────────────────────────────────────────────────────────────────

/** Valor en una ruta con puntos, o `undefined` si el camino se corta. */
export function leerRuta(obj: unknown, ruta: string): unknown {
  const segs = rutaSegura(ruta)
  if (!segs) return undefined
  let actual: unknown = obj
  for (const seg of segs) {
    if (!esObjetoPlano(actual)) return undefined
    actual = actual[seg]
  }
  return actual
}

/**
 * Copia de `overrides` con `valor` escrito en `ruta`, creando los intermedios
 * que falten. No muta nada: solo se clonan los objetos del CAMINO, el resto de
 * ramas se comparten por referencia (barato aunque el admin teclee letra a
 * letra en un textarea).
 */
export function escribirRuta(
  overrides: SiteConfigOverrides,
  ruta: string,
  valor: unknown,
): SiteConfigOverrides {
  const segs = rutaSegura(ruta)
  if (!segs) return overrides

  const raiz: ObjetoPlano = { ...(overrides as ObjetoPlano) }
  let actual = raiz
  for (const seg of segs.slice(0, -1)) {
    const hijo = actual[seg]
    actual[seg] = esObjetoPlano(hijo) ? { ...hijo } : {}
    actual = actual[seg] as ObjetoPlano
  }
  actual[segs[segs.length - 1]] = valor
  return raiz as SiteConfigOverrides
}

/**
 * Copia de `overrides` SIN la ruta, podando los objetos intermedios que se
 * queden vacíos. Es el "Restaurar" de cada campo: quitar la clave (y no
 * ponerla en `''`) es lo único que hace que el merge caiga al default de
 * config.ts.
 */
export function quitarRuta(overrides: SiteConfigOverrides, ruta: string): SiteConfigOverrides {
  const segs = rutaSegura(ruta)
  if (!segs) return overrides
  if (leerRuta(overrides, ruta) === undefined) return overrides

  const raiz: ObjetoPlano = { ...(overrides as ObjetoPlano) }
  let actual = raiz
  for (const seg of segs.slice(0, -1)) {
    const hijo = actual[seg]
    if (!esObjetoPlano(hijo)) return raiz as SiteConfigOverrides
    actual[seg] = { ...hijo }
    actual = actual[seg] as ObjetoPlano
  }
  delete actual[segs[segs.length - 1]]
  podarVacios(raiz)
  return raiz as SiteConfigOverrides
}

/**
 * Valor que se pinta en el control: el override si lo hay, y si no el de la
 * config `base`.
 *
 * OJO CON QUÉ SE PASA COMO `base`. El editor pasa los **defaults**, no el
 * `merged` del GET: `merged` ya lleva aplicados los overrides guardados, así
 * que un campo recién restaurado seguiría enseñando el valor viejo en vez del
 * de fábrica. `merged` solo sirve para lo que el PUT no toca (los logos).
 */
export function valorEfectivo(base: unknown, overrides: SiteConfigOverrides, ruta: string): unknown {
  const propio = leerRuta(overrides, ruta)
  return propio === undefined ? leerRuta(base, ruta) : propio
}

/** ¿El admin cambió este campo respecto del default? (para pintar "Restaurar") */
export function estaSobrescrito(overrides: SiteConfigOverrides, ruta: string): boolean {
  return leerRuta(overrides, ruta) !== undefined
}

// ─── Teléfono ────────────────────────────────────────────────────────────────

/** Máximo de dígitos que admite `validarTelefono` (acepta de 10 a 13). */
export const MAX_DIGITOS_TELEFONO = 13

/**
 * El WhatsApp tal como se guarda: SOLO dígitos y 13 como mucho.
 *
 * SE LIMPIA ANTES DE RECORTAR, y no al revés. Con el tope puesto en el
 * `maxlength` del input, pegar '+5219991234567' (14 caracteres) dejaba en el
 * campo '+521999123456' y de ahí salía '521999123456': doce dígitos, que pasan
 * el `^\d{10,13}$` del validador y publican un número TRUNCADO. El admin ve un
 * campo verde, y el enlace de WhatsApp de toda su landing no lleva a nadie.
 * Quitando primero los separadores, '+521 999 123 4567' se guarda entero.
 */
export function normalizarTelefono(v: string): string {
  return v.replace(/\D/g, '').slice(0, MAX_DIGITOS_TELEFONO)
}

// ─── Modalidades ─────────────────────────────────────────────────────────────

/**
 * Copia de `overrides` con el parcial aplicado a la modalidad `id`. `null` en
 * un campo lo QUITA; si la modalidad se queda sin ningún override, se borra su
 * entrada (y si `modalidades` se queda vacío, la clave entera).
 *
 * `modalidades` no es una ruta con puntos: en la BD es un objeto indexado por
 * id y solo admite `mensualidad` y `activa` (ver `SiteConfigOverrides`).
 */
export function escribirModalidad(
  overrides: SiteConfigOverrides,
  id: string,
  parcial: ParcialModalidad,
): SiteConfigOverrides {
  if (SEGMENTOS_PROHIBIDOS.has(id)) return overrides

  const mods: Record<string, OverrideModalidad> = { ...(overrides.modalidades ?? {}) }
  const actual: OverrideModalidad = { ...(mods[id] ?? {}) }

  if (parcial.mensualidad === null) delete actual.mensualidad
  else if (parcial.mensualidad !== undefined) actual.mensualidad = parcial.mensualidad

  if (parcial.cuotaSemanal === null) delete actual.cuotaSemanal
  else if (parcial.cuotaSemanal !== undefined) actual.cuotaSemanal = parcial.cuotaSemanal

  if (parcial.activa === null) delete actual.activa
  else if (parcial.activa !== undefined) actual.activa = parcial.activa

  if (Object.keys(actual).length === 0) delete mods[id]
  else mods[id] = actual

  const raiz: ObjetoPlano = { ...(overrides as ObjetoPlano) }
  if (Object.keys(mods).length === 0) delete raiz.modalidades
  else raiz.modalidades = mods
  return raiz as SiteConfigOverrides
}

/**
 * Las tres inscripciones que pinta la vista previa, sobre el BORRADOR.
 *
 * La general sale como siempre (el número efectivo, o 0). La de cada nivel
 * sigue la misma regla que la landing (`inscripcionDe`): la propia si la hay;
 * si no, la general. Con las claves por nivel vacías, las tres valen lo mismo
 * (Fase 2).
 */
export function inscripcionesDeBorrador(
  base: unknown,
  overrides: SiteConfigOverrides,
): { inscripcion: number; inscripcionSecundaria: number; inscripcionPreparatoria: number } {
  const general = valorEfectivo(base, overrides, 'precios.inscripcion')
  const precios = {
    inscripcion: general,
    inscripcionSecundaria: valorEfectivo(base, overrides, 'precios.inscripcionSecundaria'),
    inscripcionPreparatoria: valorEfectivo(base, overrides, 'precios.inscripcionPreparatoria'),
  }
  return {
    inscripcion: typeof general === 'number' ? general : 0,
    inscripcionSecundaria: inscripcionDe('secundaria', precios),
    inscripcionPreparatoria: inscripcionDe('preparatoria', precios),
  }
}

/**
 * Las modalidades como se verán publicadas: las de config.ts con la
 * mensualidad y el `activa` que el admin tenga sin publicar. Conserva orden y
 * longitud de la base — el editor no agrega ni quita planes, eso cambiaría el
 * producto (ver `SiteConfigOverrides`).
 */
export function modalidadesEfectivas(
  base: ReadonlyArray<ModalidadEditable>,
  overrides: SiteConfigOverrides['modalidades'],
): ModalidadEditable[] {
  return base.map((m) => {
    const ov = overrides?.[m.id]
    return {
      ...m,
      mensualidad: typeof ov?.mensualidad === 'number' ? ov.mensualidad : m.mensualidad,
      // Sin esto, el input de la cuota semanal no reflejaría lo que el admin
      // acaba de teclear: el estado lo guarda pero la pantalla sigue pintando
      // el valor de config.ts.
      ...(typeof m.cuotaSemanal === 'number' || typeof ov?.cuotaSemanal === 'number'
        ? { cuotaSemanal: typeof ov?.cuotaSemanal === 'number' ? ov.cuotaSemanal : m.cuotaSemanal }
        : {}),
      activa: typeof ov?.activa === 'boolean' ? ov.activa : m.activa,
    }
  })
}

/**
 * ¿Se puede apagar este plan? No, si es el único activo: sin modalidades no
 * hay nada que vender — la landing se queda sin tarjetas de precio y el
 * registro sin plan que elegir.
 */
export function puedeDesactivar(mods: ReadonlyArray<ModalidadEditable>, id: string): boolean {
  const mod = mods.find((m) => m.id === id)
  if (!mod || !mod.activa) return false
  return mods.filter((m) => m.activa).length > 1
}

// ─── Paletas ─────────────────────────────────────────────────────────────────

/** La paleta marcada `original` (la que calca CONFIG.colores de la plantilla). */
function paletaOriginal(): Paleta {
  return PALETAS.find((p) => p.original) ?? PALETAS[0]
}

/**
 * Id de la paleta original. El editor lo compara contra `paletaActiva` para
 * decidir si enseña advertencias de contraste (ver `advertenciasContraste`).
 */
export const ID_PALETA_ORIGINAL: string = paletaOriginal().id

/**
 * Aplica una paleta al objeto de overrides.
 *
 * LA ORIGINAL NO ESCRIBE COLORES, LOS QUITA. Los 12 tokens de la paleta
 * original son los de la PLANTILLA, pero el cliente pudo salir de fábrica con
 * otros en su config.ts (un morado, un guinda…). Escribirle los de la
 * plantilla sería "personalizar" cuando el admin pidió lo contrario; quitar
 * `colores` devuelve exactamente lo que el cliente tenía antes de tocar nada,
 * que es lo que "Original" promete.
 */
export function aplicarPaleta(overrides: SiteConfigOverrides, paleta: Paleta): SiteConfigOverrides {
  if (paleta.original) {
    const raiz: ObjetoPlano = { ...(overrides as ObjetoPlano) }
    delete raiz.colores
    return raiz as SiteConfigOverrides
  }
  const colores: Record<string, string> = {}
  for (const token of TOKENS_COLORES) colores[token] = paleta.colores[token]
  return { ...overrides, colores: colores as unknown as SiteConfigOverrides['colores'] }
}

/**
 * Los 12 colores que se verán publicados: los del cliente con los que el admin
 * tenga sin publicar encima.
 */
export function coloresEfectivos(
  base: TokensColores,
  overrides: SiteConfigOverrides,
): TokensColores {
  const salida = { ...base }
  const propios = overrides.colores
  if (propios) {
    for (const token of TOKENS_COLORES) {
      const v = (propios as Partial<TokensColores>)[token]
      if (typeof v === 'string') salida[token] = v
    }
  }
  return salida
}

/**
 * Id de la paleta que hay que marcar en el grid, o `null` para "Personalizada".
 *
 * Sin `colores` en los overrides la respuesta es la ORIGINAL, aunque los
 * colores del cliente no coincidan con ninguna paleta curada: es la contraparte
 * exacta de `aplicarPaleta` (elegir "Original" borra `colores`), y si no,
 * elegirla dejaría la tarjeta sin marcar y parecería que no hizo nada.
 *
 * DE AHÍ QUE LA TARJETA "ORIGINAL" NO SE PINTE CON `PALETAS[0].colores`. Esos
 * son los colores de la PLANTILLA; los del cliente son `defaults.colores` y
 * pueden ser otros (un morado, un guinda). El editor pinta sus muestras con
 * `defaults.colores`, que es lo que esa tarjeta realmente aplica.
 */
export function paletaActiva(
  overrides: SiteConfigOverrides,
  defaults: { colores: TokensColores },
): string | null {
  const propios = overrides.colores
  if (!propios || Object.keys(propios).length === 0) return paletaOriginal().id
  return detectarPaleta(coloresEfectivos(defaults.colores, overrides))
}

// ─── Contraste ───────────────────────────────────────────────────────────────

/**
 * Busca un color que cumpla moviendo `base` hacia negro o hacia blanco en
 * pasos del 10 %. Se para en el primero que llega al mínimo: el objetivo es
 * arreglar la legibilidad tocando lo MENOS posible el color que eligió el
 * admin. `null` si ni al 90 % se llega (pasa cuando el otro color del par está
 * a media luz y no hay margen ni por arriba ni por abajo).
 */
function buscarAjuste(base: string, referencia: string, minimo: number): string | null {
  // ¿La referencia es clara u oscura? Se decide por con cuál de los dos
  // extremos contrasta menos: contra un fondo claro hay que oscurecer, contra
  // uno oscuro (la paleta "Dorado sobre negro") hay que aclarar.
  const haciaNegro = ratioContraste(referencia, '#000000') > ratioContraste(referencia, '#FFFFFF')
  for (let paso = 1; paso <= 9; paso++) {
    const candidato = haciaNegro ? oscurecer(base, paso / 10) : aclarar(base, paso / 10)
    if (ratioContraste(candidato, referencia) >= minimo) return candidato
  }
  return null
}

/**
 * Los pares de `PARES_CONTRASTE` que NO cumplen, con una sugerencia concreta
 * para cada uno. Es la red de seguridad de "Ajustes avanzados": las 12 paletas
 * curadas ya cumplen (lo verifica tests/unit/paletas.spec.ts), pero ahí el
 * admin puede escribir cualquier hex.
 *
 * `esOriginal` = el admin no ha tocado `colores` y se está viendo la config de
 * fábrica del cliente. Ahí NO se advierte nada aunque algún par falle: esos
 * colores llevan meses en producción, no los eligió él en esta pantalla, y
 * pintarle cinco alertas rojas al abrir la pestaña le diría que rompió algo
 * que no rompió. Si toca un token, la paleta deja de ser la original y las
 * advertencias aparecen.
 */
export function advertenciasContraste(
  colores: TokensColores,
  esOriginal: boolean,
): AdvertenciaContraste[] {
  if (esOriginal) return []

  const salida: AdvertenciaContraste[] = []
  for (const par of PARES_CONTRASTE) {
    // `a` puede ser el blanco literal del menú lateral, que no es un token.
    const colorA = par.a === '#FFFFFF' ? '#FFFFFF' : colores[par.a]
    const colorB = colores[par.b]
    const ratio = ratioContraste(colorA, colorB)
    if (ratio >= par.minimo) continue

    let sugerencia: SugerenciaContraste | null = null
    if (par.b === 'textoSobreAcento') {
      // El texto de un botón es blanco o casi negro, no un tono intermedio:
      // se propone el que más contraste con el acento (o su hover).
      sugerencia = { token: 'textoSobreAcento', valor: sugerirTextoSobre(colorA) }
    } else if (par.a === '#FFFFFF') {
      // El blanco del menú lateral no se puede cambiar: se ajusta el fondo.
      const valor = buscarAjuste(colorB, '#FFFFFF', par.minimo)
      if (valor) sugerencia = { token: par.b, valor }
    } else {
      // Texto sobre fondo/superficie y acento sobre superficie: se mueve el
      // color de delante, que es el que el admin espera que cambie.
      const valor = buscarAjuste(colorA, colorB, par.minimo)
      if (valor) sugerencia = { token: par.a, valor }
    }

    salida.push({ par, ratio: Math.round(ratio * 10) / 10, minimo: par.minimo, sugerencia })
  }
  return salida
}

// ─── Números ─────────────────────────────────────────────────────────────────

/**
 * '$2,000', o '$300 USD' si la escuela cobra en dólares. SIN centavos: todos
 * los precios de la plataforma son enteros (ver `LIMITES.precioMax`) y el admin
 * los captura así.
 *
 * Se arma con `toLocaleString` y no con `style: 'currency'` porque el formato
 * de moneda de es-MX añade decimales y, según el ICU del entorno, puede
 * prefijar 'MX$' — el editor tiene que enseñar lo mismo que la landing.
 *
 * El parámetro tiene default 'MXN' a propósito: así los llamadores de una
 * escuela en pesos producen exactamente la cadena de antes de #198.
 */
export function formatoDinero(n: number, moneda: Moneda = 'MXN'): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return moneda === 'MXN' ? '$0' : '$0 ' + moneda
  const texto = '$' + Math.round(n).toLocaleString('es-MX', { maximumFractionDigits: 0 })
  return moneda === 'MXN' ? texto : `${texto} ${moneda}`
}

/**
 * Entero >= 0 de lo que el admin tecleó, o `null` si no es un número. Se
 * toleran los separadores que él mismo ve en pantalla ('$2,000' pegado desde
 * otro lado); nada más. Negativos y decimales devuelven `null` en vez de
 * redondear: un precio mal capturado tiene que verse rojo, no arreglarse solo.
 *
 * 🛑 La coma SOLO vale como separador de miles bien formado («1,500»,
 * «12,345»). «499,00» o «4,5» son una coma DECIMAL —así se escribe en
 * México, y el tipo de cambio de la misma pestaña la acepta— y quitarla
 * multiplicaba el precio por 100 sin marcar nada en rojo (499,00 → 49900).
 */
export function parseEntero(texto: string): number | null {
  if (typeof texto !== 'string') return null
  const sinEspacios = texto.replace(/[\s$]/g, '')
  if (sinEspacios.includes(',') && !/^\d{1,3}(,\d{3})+$/.test(sinEspacios)) return null
  const limpio = sinEspacios.replace(/,/g, '')
  if (!/^\d+$/.test(limpio)) return null
  const n = Number(limpio)
  return Number.isSafeInteger(n) ? n : null
}

/**
 * Qué hace un campo de entero cuando pierde el foco con basura (texto que no
 * es un entero en rango). Regla: el BORRADOR vuelve a como estaba AL ENTRAR,
 * y la pantalla también. Nunca se queda el último prefijo válido que se
 * propagó al teclear («60000» con tope 50,000 no deja 6000).
 *
 * - Si al entrar NO tenía override y el campo sabe quitar su clave
 *   (`puedeDescartar`), se quita SIEMPRE: escribir la cifra de fábrica
 *   dejaría un override fijo que ya no sigue al config.ts. Va ANTES del
 *   atajo de abajo: teclear «599,00» sobre un 599 de fábrica propaga 5, 59
 *   y 599, así que el valor acaba igual al de entrada pero la clave ya
 *   existe. Quitar una clave que no está no cambia nada.
 * - Si tenía override y el valor quedó igual, no se toca el borrador.
 * - Si no, se vuelve a escribir lo de al entrar TAL CUAL, aunque ya no
 *   quepa en el rango o ni siquiera sea número (la mensualidad decimal de
 *   CIEB, una fila de BD escrita a mano): el campo sigue en rojo y el
 *   validador lo señala, en vez de publicar un prefijo que nadie quiso.
 */
export function alSalirConBasura({
  alEntrar, actual, sobrescritoAlEntrar, puedeDescartar,
}: {
  alEntrar: unknown
  actual: unknown
  sobrescritoAlEntrar: boolean
  puedeDescartar: boolean
}): { accion: 'nada' | 'descartar' | 'escribir'; valor?: unknown; texto: string } {
  const textoDe = (v: unknown) => (v === undefined || v === null ? '' : String(v))
  const vacioAlEntrar = alEntrar === undefined || alEntrar === null
  if ((!sobrescritoAlEntrar || vacioAlEntrar) && puedeDescartar) {
    return { accion: 'descartar', texto: textoDe(alEntrar) }
  }
  if (Object.is(actual, alEntrar) || vacioAlEntrar) return { accion: 'nada', texto: textoDe(alEntrar) }
  return { accion: 'escribir', valor: alEntrar, texto: textoDe(alEntrar) }
}

// ─── Publicar ────────────────────────────────────────────────────────────────

/**
 * ¿Cambió algún precio entre dos estados del formulario? Dispara el modal de
 * confirmación: lo que se publica aquí se ve en la página pública, y el admin
 * tiene que saber qué cambia y qué no (los pagos ya registrados no cambian).
 *
 * Cuenta `precios.*` y `modalidades.*` — incluido el `activa`, porque apagar
 * un plan lo saca de la landing y del registro igual que cambiarle el precio —
 * y, si la escuela NO cobra en pesos, el tipo de cambio: mueve todas las
 * equivalencias en pesos que ve el alumno. En una escuela en MXN el tipo de
 * cambio no se pinta en ningún lado, así que no pide confirmación.
 */
export function hayCambiosDePrecio(
  antes: SiteConfigOverrides,
  despues: SiteConfigOverrides,
  moneda: Moneda = CONFIG.moneda,
): boolean {
  return (
    hayCambiosDePreciosOPlanes(antes, despues) ||
    (moneda !== 'MXN' && hayCambioDeTipoCambio(antes, despues))
  )
}

/**
 * ¿Cambió un precio o un plan (incluido el `activa`)? Separado del tipo de
 * cambio para que el modal sepa cuándo lo ÚNICO que cambia es la equivalencia
 * en pesos y no hable de precios que nadie tocó.
 */
export function hayCambiosDePreciosOPlanes(antes: SiteConfigOverrides, despues: SiteConfigOverrides): boolean {
  return (
    !mismoContenido(antes.precios, despues.precios) ||
    !mismoContenido(antes.modalidades, despues.modalidades)
  )
}

// ─── Precios por nivel (Fase 2, F2-9) ────────────────────────────────────────

/**
 * ¿La pestaña Precios enseña los campos por nivel? Solo si la escuela vende
 * Secundaria Y Preparatoria y no es de solo cursos: con un solo nivel, «por
 * nivel» y «general» son lo mismo, y el campo sobraría.
 */
export function preciosPorNivelVisibles(niveles: readonly string[] = CONFIG.niveles): boolean {
  return ['secundaria', 'preparatoria'].every((n) => niveles.includes(n)) && !esSoloCursos()
}

type PlanDelEditor = { id: string; meses: number; nivel?: string | null }

/**
 * Las claves por nivel de la mensualidad de un plan: solo los planes de 3 y 6
 * meses tienen precio por nivel (los demás usan el general), y un plan con
 * `nivel` solo toca la de su nivel.
 *
 * ⚠️ La clave se indexa por DURACIÓN, no por plan: si dos planes duran lo
 * mismo (Habsburgo: «6 Meses» y «Acceso completo»), comparten la clave. Con
 * `modalidades`, solo el PRIMERO de su duración la edita y la restaura; los
 * demás devuelven `[]` (un solo campo por clave: sin ids repetidos en la
 * pestaña, y el «Restaurar plan» de uno no borra en silencio lo del otro).
 */
export function clavesPorNivelDePlan(
  plan: PlanDelEditor,
  modalidades?: ReadonlyArray<PlanDelEditor>,
): string[] {
  if (plan.meses !== 3 && plan.meses !== 6) return []
  if (modalidades) {
    const primero = modalidades.find((p) => p.meses === plan.meses && (p.nivel ?? null) === (plan.nivel ?? null))
    if (primero && primero.id !== plan.id) return []
  }
  const niveles: NivelConPrecio[] = !plan.nivel
    ? ['secundaria', 'preparatoria']
    : plan.nivel === 'secundaria' || plan.nivel === 'preparatoria' ? [plan.nivel] : []
  return niveles.map((n) => `precios.${CLAVE_MENSUALIDAD_POR_NIVEL[n][plan.meses as 3 | 6]}`)
}

/**
 * «Restaurar plan»: quita los overrides del plan (mensualidad, cuota semanal,
 * activa) Y las claves por nivel de su duración. Sin esto, una mensualidad
 * por nivel guardada seguiría mandando sobre el plan «restaurado».
 */
export function restaurarPlan(
  overrides: SiteConfigOverrides,
  plan: PlanDelEditor,
  modalidades?: ReadonlyArray<PlanDelEditor>,
): SiteConfigOverrides {
  let r = escribirModalidad(overrides, plan.id, { mensualidad: null, cuotaSemanal: null, activa: null })
  for (const clave of clavesPorNivelDePlan(plan, modalidades)) r = quitarRuta(r, clave)
  return r
}

/**
 * ¿Tiene precio propio este campo por nivel en el borrador? `null` cuenta
 * como VACÍO, no como override: el validador lo descarta al publicar y la
 * fila nunca lo guarda. Un 0 escrito a mano SÍ cuenta (es inválido y el
 * admin necesita el «Restaurar» para quitarlo).
 */
export function precioNivelSobrescrito(overrides: SiteConfigOverrides, clave: string): boolean {
  const v = valorEfectivo({}, overrides, clave)
  return v !== undefined && v !== null
}

/**
 * ¿Hay algo que «Restaurar plan» deshaga? El plan, o una de sus claves por
 * nivel: el botón sale aunque solo esté sobrescrita una de ellas.
 */
export function planSobrescrito(
  overrides: SiteConfigOverrides,
  plan: PlanDelEditor,
  modalidades?: ReadonlyArray<PlanDelEditor>,
): boolean {
  return overrides.modalidades?.[plan.id] !== undefined
    || clavesPorNivelDePlan(plan, modalidades).some((clave) => precioNivelSobrescrito(overrides, clave))
}

/**
 * El precio de un nivel en el BORRADOR, con el mismo resolver que la landing:
 * `mergeSiteConfig(CONFIG, …)` y después `inscripcionDe` o `mensualidadDe`.
 * Con `vacio`, sin la clave del campo: es lo que cobraría el nivel si el admin
 * lo deja vacío (la general de hoy).
 *
 * 🛑 No sale de `defaults` (no trae los alias de secundaria, que deciden la
 * «general» de ese nivel) ni de `valorEfectivo` (no aplica el merge).
 */
export function precioNivelEfectivo(
  overrides: SiteConfigOverrides,
  campo: { clave: string; nivel: NivelConPrecio; planId?: string },
  { vacio = false }: { vacio?: boolean } = {},
): number {
  const efectivo = mergeSiteConfig(CONFIG, prepararParaPublicar(vacio ? quitarRuta(overrides, campo.clave) : overrides))
  const precios = efectivo.precios as unknown as Record<string, unknown>
  if (!campo.planId) return inscripcionDe(campo.nivel, precios)
  const planes = efectivo.modalidades as unknown as readonly ModalidadPrograma[] | undefined
  const plan = Array.isArray(planes) ? planes.find((m) => m.id === campo.planId) : undefined
  return plan ? mensualidadDe(campo.nivel, plan, precios) : 0
}

/**
 * De dónde sale lo que cobra un nivel con el campo vacío:
 *   - 'general': la general que se ve en la misma tarjeta (inscripción
 *     general o «Mensualidad general» del plan);
 *   - 'hoy': la de hoy del nivel, que NO es esa general — la secundaria de
 *     SAMEX o AULA RAÍZ vive en su alias (2,700 frente a 3,000 del plan) y
 *     decir «la general» junto a otra cifra sería contradecirse;
 *   - 'fabrica': el clon cuyo config.ts ya trae la clave con cifra; vaciar
 *     el campo vuelve a ESA cifra.
 */
export type OrigenVacio = 'general' | 'hoy' | 'fabrica'

/** El marcador de un campo por nivel vacío: «Vacío: usa la general, $599». Nunca «$0». */
export function textoVacioNivel(monto: number, moneda: Moneda = CONFIG.moneda, origen: OrigenVacio = 'general'): string {
  const cifra = monto > 0 ? formatoDinero(monto, moneda) : 'sin costo'
  const cual = origen === 'fabrica' ? 'el de fábrica' : origen === 'hoy' ? 'la de hoy' : 'la general'
  return `Vacío: usa ${cual}, ${cifra}`
}

/**
 * El final del error del campo: «…o déjalo vacío para usar ___.». Con origen
 * 'general' es el texto del diseño (§7.3); con 'hoy' o 'fabrica' dice la
 * cifra, porque vacío NO da la general y, con el campo en rojo, el marcador
 * y la ayuda no se ven: el error es la única guía.
 */
export function textoVacioError(monto: number, moneda: Moneda = CONFIG.moneda, origen: OrigenVacio = 'general'): string {
  if (origen === 'general') return 'el precio general'
  return textoVacioNivel(monto, moneda, origen).replace(/^Vacío: usa /, '')
}

/**
 * El plan cuya caja lleva el campo de una clave por nivel de mensualidad: el
 * primero de esa duración sin `nivel` o con el mismo nivel. `null` si no es
 * una clave de mensualidad por nivel o si ningún plan dura eso.
 */
export function planDeClaveNivel(clave: string, modalidades: ReadonlyArray<PlanDelEditor>): string | null {
  const m = /^precios\.mensualidad(Secundaria|Preparatoria)(3|6)Meses$/.exec(clave)
  if (!m) return null
  const nivel = m[1].toLowerCase()
  const meses = Number(m[2])
  return modalidades.find((p) => p.meses === meses && (!p.nivel || p.nivel === nivel))?.id ?? null
}

/**
 * La clave que hay que señalar en la pestaña Precios para un error del
 * servidor (F2-7). El escalón puede culpar a una clave por nivel de
 * mensualidad; si en la pestaña no hay campo para ella (plan con `nivel`,
 * escuela semanal o de un solo nivel), se señala la caja de su plan, cuyo
 * «Restaurar plan» la limpia. Cualquier otra clave pasa tal cual.
 */
export function claveASenalar(
  clave: string,
  modalidades: ReadonlyArray<PlanDelEditor> | undefined,
  { semanal, porNivel }: { semanal: boolean; porNivel: boolean },
): string {
  const planes = Array.isArray(modalidades) ? modalidades : []
  const id = planDeClaveNivel(clave, planes)
  if (id === null) return clave
  const plan = planes.find((p) => p.id === id)
  const tieneCampo = !semanal && porNivel && !!plan && !plan.nivel
  return tieneCampo ? clave : `modalidades.${id}`
}

/** ¿Cambió el tipo de cambio? El modal de precios lo menciona aparte. */
export function hayCambioDeTipoCambio(antes: SiteConfigOverrides, despues: SiteConfigOverrides): boolean {
  return !mismoContenido(antes.tipoCambioMXN, despues.tipoCambioMXN)
}

/**
 * El cuerpo del PUT a partir del estado del formulario.
 *
 * Se QUITAN tres claves:
 *   - `logo` / `logoOscuro`: son exclusivas de /api/admin/configuracion/logo y
 *     el PUT las ignora (las repone de la fila). Mandarlas no falla, pero el
 *     editor no tiene por qué enviar un estado que sabe viejo.
 *   - `whatsappUrl`: el servidor la DERIVA de `whatsapp`. Mandarla sin número
 *     es un 400 ("whatsappUrl se deriva de whatsapp"), y eso es exactamente lo
 *     que pasaría al restaurar el WhatsApp de un cliente que ya tenía las dos
 *     claves guardadas.
 *
 * Y se podan los objetos intermedios que queden vacíos, que la API descartaría
 * igual (`podarVacios`) pero que aquí ya ensuciarían la comparación de "hay
 * cambios sin publicar".
 */
export function prepararParaPublicar(overrides: SiteConfigOverrides): SiteConfigOverrides {
  const salida = clonar(overrides) as ObjetoPlano
  delete salida.logo
  delete salida.logoOscuro
  delete salida.whatsappUrl
  podarVacios(salida)
  return salida as SiteConfigOverrides
}

/**
 * Copia `logo` / `logoOscuro` de la FILA (lo que devuelve la ruta del logo en
 * `overrides`) al borrador, sin tocar nada más del borrador. Devuelve un
 * objeto nuevo.
 *
 * POR QUÉ. Subir o quitar un logo escribe la fila al instante y devuelve
 * `merged` + `overrides`. `merged` viene RESUELTO (`resolverLogos`): con solo
 * el logo claro subido, `merged.logoOscuro` es ese mismo logo, así que por
 * `merged` no se puede saber si la variante oscura tiene override propio — y
 * eso es lo que decide el badge "Personalizado" y el botón "Quitar" de su
 * tarjeta. Se aplica a `overrides` Y a `overridesBase` por igual, para que la
 * comparación "cambios sin publicar" no cambie (el logo no es parte del
 * borrador: `prepararParaPublicar` lo quita del cuerpo).
 */
export function sincronizarLogos(
  borrador: SiteConfigOverrides,
  fila: SiteConfigOverrides,
): SiteConfigOverrides {
  const salida = clonar(borrador) as ObjetoPlano
  for (const clave of ['logo', 'logoOscuro'] as const) {
    if (typeof fila[clave] === 'string') salida[clave] = fila[clave]
    else delete salida[clave]
  }
  return salida as SiteConfigOverrides
}
