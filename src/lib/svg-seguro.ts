/**
 * "Personalizar mi página" (F4) — filtro de contenido para el SVG que sube el
 * admin como logo.
 *
 * POR QUÉ EXISTE. Un SVG no es una imagen: es un documento XML que el
 * navegador ejecuta. Servido desde el ORIGEN del Storage (que es público y
 * comparte host con la API de Supabase), abrirlo directo ejecutaría sus
 * `<script>`, sus atributos `on*` y su `<foreignObject>` con HTML dentro. La
 * ruta de subida además lo rasteriza a PNG (ver el encabezado de
 * `api/admin/configuracion/logo/route.ts`), así que este filtro es la PRIMERA
 * de dos capas: si el archivo trae algo raro, ni siquiera se rasteriza.
 *
 * ISOMORFO a propósito: sin `server-only`, sin Node, sin `Buffer`. Lo consumen
 * la API y las pruebas unitarias, y el editor puede prevalidar en el navegador
 * con exactamente la misma regla antes de gastar una subida.
 *
 * POR QUÉ NO BASTA UN `indexOf('javascript:')`. El navegador decodifica el
 * documento ANTES de interpretarlo, así que el atacante puede escribir lo
 * mismo de muchas formas y todas llegan al mismo sitio:
 *
 *   javascript&#58;alert(1)     entidad numérica del ':'
 *   &#106;avascript:alert(1)    entidad numérica de la 'j'
 *   &#x6A;avascript:alert(1)    la misma, en hexadecimal
 *   javascript&colon;alert(1)   entidad CON NOMBRE del ':'
 *   java&#9;script:alert(1)     un tabulador DENTRO del esquema
 *   java\tscript:alert(1)       el mismo tabulador, literal
 *
 * De ahí las tres reglas de este módulo:
 *   1. TODA entidad numérica (`&#`) se rechaza de plano. Un logo no necesita
 *      ninguna, y decodificarlas bien (decimal, hex, con y sin `;`) es
 *      exactamente donde fallan los filtros caseros.
 *   2. Las entidades con NOMBRE básicas se decodifican antes de escanear, y se
 *      vuelve a buscar `&#` después (por `&amp;#x6A;`).
 *   3. Los esquemas se buscan sobre una copia SIN espacios ni controles, así
 *      que `java\tscript:` y `href = "//evil"` se ven como `javascript:` y
 *      `href="//evil"`.
 *
 * LISTA CERRADA Y FAIL-CLOSED: ante la duda se rechaza. Un `data:` o un
 * `@import` en un logo institucional es un falso positivo asumible; un
 * `<script>` que pasa, no.
 */

export type ResultadoSvg = { ok: true } | { ok: false; motivo: string }

/**
 * Entidades con nombre que se decodifican antes de escanear. Un documento XML
 * sin DTD solo define las cinco primeras, pero el resto son baratas de cubrir
 * y son las que usan los evasores (`&colon;`, `&sol;`, `&Tab;`, `&NewLine;`).
 */
const ENTIDADES_NOMBRADAS: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  colon: ':',
  sol: '/',
  tab: '\t',
  newline: '\n',
  lpar: '(',
  rpar: ')',
  semi: ';',
  nbsp: ' ',
}

/** `;` opcional: los navegadores toleran `&colon` sin cerrar. */
const ENTIDAD_NOMBRADA = /&([a-z]+);?/gi

/** Cualquier entidad numérica, decimal (`&#58;`) o hex (`&#x3A;`). */
const ENTIDAD_NUMERICA = /&#/

/** `&amp;#x6A;` necesita dos vueltas; tres es holgado y termina siempre. */
const PASADAS_DECODIFICACION = 3

function decodificarNombradas(texto: string): string {
  return texto.replace(ENTIDAD_NOMBRADA, (todo, nombre: string) => {
    const valor = ENTIDADES_NOMBRADAS[nombre.toLowerCase()]
    return valor === undefined ? todo : valor
  })
}

interface Patron {
  re: RegExp
  motivo: string
}

/**
 * Se buscan sobre la copia COMPACTA (sin espacios ni caracteres de control):
 * un esquema partido por un tabulador o un `href = "//x"` con espacios
 * alrededor del `=` son el mismo enlace para el navegador.
 *
 * `data:` se rechaza entero, no solo `data:text/html`: un logo no necesita
 * incrustar nada, y distinguir "data: inofensivo" de "data: ejecutable" es
 * justo el tipo de matiz que un filtro no acierta.
 */
const PATRONES_COMPACTOS: ReadonlyArray<Patron> = [
  { re: /javascript:/i, motivo: 'contiene el esquema javascript:' },
  { re: /vbscript:/i, motivo: 'contiene el esquema vbscript:' },
  { re: /data:/i, motivo: 'contiene el esquema data:' },
  { re: /href=["']?(?:https?:)?\/\//i, motivo: 'enlaza a otro origen (href a http(s):// o //)' },
  { re: /href=["']?https?:/i, motivo: 'enlaza a otro origen (href a http(s):)' },
]

/**
 * Se buscan sobre el texto DECODIFICADO (con sus espacios): son estructuras
 * XML/CSS, y ahí el espacio significa algo. El detector de atributos `on*`
 * exige un separador antes de `on` para no disparar con `contentScriptType=`
 * (atributo legítimo, aunque obsoleto).
 */
const PATRONES_TEXTO: ReadonlyArray<Patron> = [
  { re: /<script/i, motivo: 'contiene <script>' },
  { re: /(?:^|[\s"'<;/])on[a-z]+\s*=/i, motivo: 'contiene un atributo de evento (on…=)' },
  { re: /<foreignobject/i, motivo: 'contiene <foreignObject>' },
  { re: /<iframe/i, motivo: 'contiene <iframe>' },
  { re: /<embed/i, motivo: 'contiene <embed>' },
  { re: /<object/i, motivo: 'contiene <object>' },
  { re: /<!doctype/i, motivo: 'contiene un DOCTYPE' },
  { re: /<!entity/i, motivo: 'contiene una declaración de entidad (<!ENTITY)' },
  { re: /@import/i, motivo: 'contiene un @import de CSS' },
  { re: /url\(\s*["']?\s*(?:https?:)?\/\//i, motivo: 'contiene un url() a otro origen' },
  { re: /attributename\s*=\s*["']?\s*on/i, motivo: 'anima un atributo de evento (attributeName="on…")' },
  { re: /xlink:href\s*=\s*["']?\s*http/i, motivo: 'contiene un xlink:href a otro origen' },
  { re: /data:text\/html/i, motivo: 'contiene un data:text/html' },
]

/**
 * ¿El texto es un SVG que se puede aceptar? `{ ok: true }` o el `motivo` del
 * rechazo, en español y listo para acompañar al 400 de la API.
 *
 * El motivo NO se le enseña tal cual al admin (la API responde un mensaje
 * único y genérico): sirve para el log del servidor y para que las pruebas
 * digan QUÉ regla saltó.
 */
export function svgEsSeguro(texto: string): ResultadoSvg {
  if (typeof texto !== 'string' || texto.trim() === '') {
    return { ok: false, motivo: 'el archivo está vacío o no es texto' }
  }
  if (ENTIDAD_NUMERICA.test(texto)) {
    return { ok: false, motivo: 'contiene entidades numéricas (&#…)' }
  }

  let decodificado = texto
  for (let i = 0; i < PASADAS_DECODIFICACION; i++) {
    const siguiente = decodificarNombradas(decodificado)
    if (ENTIDAD_NUMERICA.test(siguiente)) {
      return { ok: false, motivo: 'contiene entidades numéricas (&#…) tras decodificar' }
    }
    if (siguiente === decodificado) break
    decodificado = siguiente
  }

  // El elemento raíz tiene que estar: un archivo que "parece" SVG por la
  // extensión pero no lo es no se sube (y no se rasteriza).
  if (!/<svg[\s>/]/i.test(decodificado)) {
    return { ok: false, motivo: 'no contiene el elemento <svg>' }
  }

  const compacto = decodificado.replace(/[\s\u0000-\u001F]/g, '')
  for (const p of PATRONES_COMPACTOS) {
    if (p.re.test(compacto)) return { ok: false, motivo: p.motivo }
  }
  for (const p of PATRONES_TEXTO) {
    if (p.re.test(decodificado)) return { ok: false, motivo: p.motivo }
  }
  return { ok: true }
}
