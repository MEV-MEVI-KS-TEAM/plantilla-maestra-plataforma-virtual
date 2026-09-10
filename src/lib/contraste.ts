/**
 * Contraste de color según WCAG 2.1.
 *
 * Módulo PURO e isomorfo: sin imports, sin `window`, sin `document`. Se usa
 * igual en el editor (cliente, validación en vivo), en el server action que
 * guarda la paleta (para rechazar combinaciones ilegibles) y en las pruebas
 * unitarias, que corren sin navegador.
 *
 * Fórmulas: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance y
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/** Umbral AA para texto normal (< 18pt). Para componentes de UI basta 3.0. */
export const AA_MINIMO = 4.5

/**
 * Parsea `#RRGGBB` o `#RGB` (mayúsculas o minúsculas). Devuelve null si no es
 * un hex reconocible, en lugar de tirar: el editor valida mientras el admin
 * escribe y a media captura el valor casi siempre está incompleto.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== 'string') return null
  const limpio = hex.trim().replace(/^#/, '')
  const m6 = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(limpio)
  if (m6) {
    return { r: parseInt(m6[1], 16), g: parseInt(m6[2], 16), b: parseInt(m6[3], 16) }
  }
  const m3 = /^([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(limpio)
  if (m3) {
    // #ABC equivale a #AABBCC: cada dígito se duplica.
    return {
      r: parseInt(m3[1] + m3[1], 16),
      g: parseInt(m3[2] + m3[2], 16),
      b: parseInt(m3[3] + m3[3], 16),
    }
  }
  return null
}

/**
 * Linealiza un canal sRGB (0..255 → 0..1). El umbral 0.04045 es el de WCAG
 * 2.1; la 2.0 usaba 0.03928 y la diferencia solo se nota en el tercer decimal.
 */
function linealizar(canal: number): number {
  const c = canal / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * Luminancia relativa (0 = negro, 1 = blanco). Los pesos 0.2126 / 0.7152 /
 * 0.0722 son los del espacio sRGB: el ojo percibe el verde mucho más claro
 * que el azul con el mismo valor numérico.
 *
 * Hex inválido → NaN. Así cualquier comparación posterior da `false` y nunca
 * un falso "cumple".
 */
export function luminanciaRelativa(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return NaN
  return 0.2126 * linealizar(rgb.r) + 0.7152 * linealizar(rgb.g) + 0.0722 * linealizar(rgb.b)
}

/**
 * Ratio de contraste entre dos colores, 1 (idénticos) .. 21 (negro/blanco).
 * El orden no importa: siempre va el más claro arriba.
 *
 * Si alguno es inválido devuelve 1, el peor ratio posible, para que el editor
 * pinte la advertencia en vez de un NaN.
 */
export function ratioContraste(a: string, b: string): number {
  const la = luminanciaRelativa(a)
  const lb = luminanciaRelativa(b)
  if (Number.isNaN(la) || Number.isNaN(lb)) return 1
  const claro = Math.max(la, lb)
  const oscuro = Math.min(la, lb)
  // El +0.05 evita dividir entre cero con el negro puro y modela el reflejo
  // ambiente de una pantalla real.
  return (claro + 0.05) / (oscuro + 0.05)
}

export function cumpleAA(a: string, b: string): boolean {
  return ratioContraste(a, b) >= AA_MINIMO
}

function aHex2(n: number): string {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase()
}

function limitar01(factor: number): number {
  if (Number.isNaN(factor)) return 0
  return Math.min(1, Math.max(0, factor))
}

/**
 * Mezcla lineal hacia blanco. factor 0 = igual, 1 = blanco puro. Sirve para
 * derivar `acentoClaro` (fondo de badges) desde el acento del cliente.
 * Hex inválido → se devuelve tal cual, para no inventar un color.
 */
export function aclarar(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const f = limitar01(factor)
  return '#' + aHex2(rgb.r + (255 - rgb.r) * f) + aHex2(rgb.g + (255 - rgb.g) * f) + aHex2(rgb.b + (255 - rgb.b) * f)
}

/**
 * Mezcla lineal hacia negro. factor 0 = igual, 1 = negro puro. Sirve para
 * derivar `acentoHover` (un paso más oscuro que el acento).
 */
export function oscurecer(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const f = limitar01(factor)
  return '#' + aHex2(rgb.r * (1 - f)) + aHex2(rgb.g * (1 - f)) + aHex2(rgb.b * (1 - f))
}

/**
 * Blanco o casi negro, el que contraste más con el fondo dado. Es el
 * `textoSobreAcento` que se propone cuando el admin cambia el acento: sobre
 * un amarillo va texto oscuro, sobre un azul marino va blanco.
 *
 * Se usa #0A0A0A y no #000000 porque el negro absoluto sobre color vibra en
 * pantalla; es el mismo override que ya documenta CONFIG.colores.
 */
export function sugerirTextoSobre(fondo: string): '#FFFFFF' | '#0A0A0A' {
  const conBlanco = ratioContraste(fondo, '#FFFFFF')
  const conNegro = ratioContraste(fondo, '#0A0A0A')
  return conBlanco >= conNegro ? '#FFFFFF' : '#0A0A0A'
}

/**
 * Solo la forma canónica `#RRGGBB`. El `#RGB` corto se acepta al PARSEAR
 * (hexToRgb) pero no al GUARDAR: la config y las CSS variables se comparan
 * como texto, y dos escrituras del mismo color romperían `detectarPaleta`.
 */
export function esHexValido(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v)
}

/**
 * El color de marca, ajustado LO JUSTO para ser legible sobre un fondo dado —
 * aclarándolo si el fondo es oscuro y oscureciéndolo si es claro.
 *
 * ⚠️ POR QUÉ HACE FALTA. Un acento de marca casi nunca sirve como color de
 * texto sobre las dos caras de la landing. El oro de GRATIA (#C09852) da 5.34
 * sobre su verde petróleo pero **2.67 sobre blanco**: en los kickers y los
 * precios de las tarjetas claras el texto desaparecía. Subir el tamaño no
 * arregla nada: 18 px con peso 600 NO cuenta como texto grande para WCAG.
 *
 * Se mueve en pasos del 5 % en vez de saltar a blanco o negro para CONSERVAR EL
 * TONO: el oro se vuelve un oro más oscuro, no un gris. Así el token de marca
 * queda intacto para rellenos, bordes y trazos —que es lo que el manual del
 * cliente custodia— y solo se declara una variante para texto.
 *
 * Si ni el blanco ni el negro cumplieran (imposible con un mínimo de 4.5, pero
 * el bucle no lo asume) se devuelve el extremo al que iba.
 */
export function colorLegibleSobre(color: string, fondo: string, minimo: number = AA_MINIMO): string {
  if (!hexToRgb(color) || !hexToRgb(fondo)) return color
  if (ratioContraste(color, fondo) >= minimo) return color
  // Un fondo claro pide texto más oscuro, y al revés. El umbral es la
  // luminancia a la que el blanco y el negro empatan aproximadamente.
  const fondoEsClaro = luminanciaRelativa(fondo) > 0.18
  const mover = fondoEsClaro ? oscurecer : aclarar
  for (let f = 0.05; f <= 1.0001; f += 0.05) {
    const candidato = mover(color, f)
    if (ratioContraste(candidato, fondo) >= minimo) return candidato
  }
  return fondoEsClaro ? '#000000' : '#FFFFFF'
}

/**
 * Como `colorLegibleSobre`, pero para un color que se va a pintar CON ALPHA.
 *
 * Un tono puede cumplir de sobra en sólido y quedarse corto al 45 % de
 * opacidad, que es como la landing pinta sus textos secundarios sobre los
 * fondos oscuros: el subtítulo del hero, las etiquetas de los indicadores y las
 * filas de precio de la tarjeta oscura. Se comprueba el color YA MEZCLADO al
 * alpha más bajo en que se vaya a usar, y se ajusta el tono base hasta que la
 * mezcla cumple.
 */
export function colorLegibleConAlpha(
  color: string,
  fondo: string,
  alpha: number,
  minimo: number = AA_MINIMO,
): string {
  const bg = hexToRgb(fondo)
  if (!hexToRgb(color) || !bg) return color
  const a = Math.min(Math.max(alpha, 0.05), 1)
  const mezclado = (hex: string): string => {
    const c = hexToRgb(hex)
    if (!c) return hex
    const m = (x: number, y: number) => Math.round(x * a + y * (1 - a))
    return (
      '#' +
      [m(c.r, bg.r), m(c.g, bg.g), m(c.b, bg.b)]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    )
  }
  if (ratioContraste(mezclado(color), fondo) >= minimo) return color
  const fondoEsClaro = luminanciaRelativa(fondo) > 0.18
  const mover = fondoEsClaro ? oscurecer : aclarar
  for (let f = 0.05; f <= 1.0001; f += 0.05) {
    const candidato = mover(color, f)
    if (ratioContraste(mezclado(candidato), fondo) >= minimo) return candidato
  }
  return fondoEsClaro ? '#000000' : '#FFFFFF'
}

/**
 * El color OSCURECIDO lo justo para que `texto` se lea encima.
 *
 * Es la operación inversa de `colorLegibleSobre`: ahí se mueve el texto para
 * que quepa en el fondo; aquí se mueve el FONDO para que quepa un texto que no
 * se puede cambiar. Hace falta en los degradados: si un extremo es oscuro y el
 * otro es el acento claro, ningún color de letra sirve para todo el recorrido,
 * y lo que hay que ceder es el extremo claro.
 */
export function oscurecerHasta(fondo: string, texto: string, minimo: number = AA_MINIMO): string {
  if (!hexToRgb(fondo) || !hexToRgb(texto)) return fondo
  if (ratioContraste(fondo, texto) >= minimo) return fondo
  for (let f = 0.05; f <= 1.0001; f += 0.05) {
    const candidato = oscurecer(fondo, f)
    if (ratioContraste(candidato, texto) >= minimo) return candidato
  }
  return '#000000'
}
