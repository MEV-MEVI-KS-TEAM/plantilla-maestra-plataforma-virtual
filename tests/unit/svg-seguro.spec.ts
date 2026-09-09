import { test, expect } from '@playwright/test'
import { svgEsSeguro } from '@/lib/svg-seguro'

/**
 * F4 — filtro de contenido del SVG que sube el admin como logo
 * (src/lib/svg-seguro.ts).
 *
 * Lo que protegen estas pruebas es UNA cosa: que no haya forma de colar un
 * SVG ejecutable al bucket público. El filtro anterior (una lista de patrones
 * sobre el texto crudo) se saltaba con cualquiera de las codificaciones que un
 * navegador decodifica antes de interpretar el documento — entidades
 * numéricas, entidades con nombre, un tabulador partiendo el esquema — y esos
 * son justo los casos de aquí abajo.
 *
 * Y el otro lado de la moneda: TRES logos legítimos (paths, degradados con
 * `<defs>`, `<use xlink:href="#id">` interno) tienen que pasar. Un filtro que
 * rechaza todo es seguro y también es inútil.
 *
 * Los caracteres de control se escriben con `String.fromCharCode`: un tabulador
 * literal dentro de un string de prueba es invisible en la revisión, y este
 * archivo trata precisamente de lo que no se ve.
 */

const TAB = String.fromCharCode(9)
const NL = String.fromCharCode(10)
const CR = String.fromCharCode(13)

/** Envuelve un fragmento en un SVG por lo demás normal. */
const env = (interior: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${interior}</svg>`

/** Afirma rechazo y devuelve el motivo, para inspecciones extra. */
function rechaza(svg: string, pista = ''): string {
  const r = svgEsSeguro(svg)
  expect(r.ok, `se esperaba RECHAZO ${pista}: ${svg.slice(0, 140)}`).toBe(false)
  return r.ok ? '' : r.motivo
}

function acepta(svg: string): void {
  const r = svgEsSeguro(svg)
  expect(r.ok, `se esperaba ACEPTAR, motivo: ${r.ok ? '' : r.motivo}`).toBe(true)
}

// ─── Evasiones por codificación ──────────────────────────────────────────────

test('1. entidades numéricas: decimal, hex y con ceros a la izquierda', () => {
  // El ':' escapado (el patrón /javascript:/ del filtro viejo no lo veía)
  rechaza(env('<a href="javascript&#58;alert(1)"><text>x</text></a>'), 'javascript&#58;')
  // La 'j' escapada, en decimal y en hex
  rechaza(env('<a href="&#106;avascript:alert(1)"><text>x</text></a>'), '&#106;')
  rechaza(env('<a href="&#x6A;avascript:alert(1)"><text>x</text></a>'), '&#x6A;')
  rechaza(env('<a href="&#X6A;avascript:alert(1)"><text>x</text></a>'), '&#X6A; mayúscula')
  // Ceros a la izquierda y sin punto y coma: el navegador los admite igual
  rechaza(env('<a href="&#0000106;avascript:alert(1)"><text>x</text></a>'), 'ceros a la izquierda')
  rechaza(env('<a href="&#106avascript:alert(1)"><text>x</text></a>'), 'sin ;')
  // Cualquier entidad numérica basta, aunque el resto sea inofensivo
  expect(rechaza(env('<title>&#65;&#66;</title>'), 'entidad numérica suelta')).toMatch(/numéricas/)
})

test('2. entidad numérica escondida tras &amp; (doble decodificación)', () => {
  rechaza(env('<a href="&amp;#x6A;avascript:alert(1)"><text>x</text></a>'), '&amp;#x6A;')
  rechaza(env('<a href="&amp;#106;avascript:alert(1)"><text>x</text></a>'), '&amp;#106;')
})

test('3. entidades con NOMBRE: &colon; &sol; &Tab; &NewLine;', () => {
  rechaza(env('<a href="javascript&colon;alert(1)"><text>x</text></a>'), '&colon;')
  rechaza(env('<a href="javascript&COLON;alert(1)"><text>x</text></a>'), '&COLON;')
  rechaza(env('<a href="java&Tab;script:alert(1)"><text>x</text></a>'), '&Tab;')
  rechaza(env('<a href="java&NewLine;script:alert(1)"><text>x</text></a>'), '&NewLine;')
  rechaza(env('<a href="https&colon;&sol;&sol;evil.example/x"><text>x</text></a>'), '&sol;&sol;')
})

test('4. espacios, tabuladores y saltos de línea DENTRO del esquema', () => {
  rechaza(env(`<a href="java${TAB}script:alert(1)"><text>x</text></a>`), 'tab')
  rechaza(env(`<a href="java${NL}script:alert(1)"><text>x</text></a>`), 'salto de línea')
  rechaza(env(`<a href="java${CR}script:alert(1)"><text>x</text></a>`), 'retorno de carro')
  rechaza(env('<a href="java script:alert(1)"><text>x</text></a>'), 'espacio')
  rechaza(env(`<a href="${TAB}${NL} javascript:alert(1)"><text>x</text></a>`), 'sangría antes del esquema')
  // …y el mismo truco alrededor del '='
  rechaza(env(`<a href ${TAB} = ${NL} "//evil.example/x"><text>x</text></a>`), 'href separado del =')
})

// ─── Estructuras prohibidas ──────────────────────────────────────────────────

test('5. <style> con @import a otro origen', () => {
  rechaza(env('<style>@import url("https://evil.example/x.css");</style><rect width="4" height="4"/>'), '@import')
  rechaza(env('<style>@import "https://evil.example/x.css";</style>'), '@import sin url()')
  rechaza(env('<style>.a{background:url(//evil.example/x.png)}</style>'), 'url() protocolo-relativo')
})

test('6. DOCTYPE y declaraciones de entidad', () => {
  rechaza(`<!DOCTYPE svg SYSTEM "http://evil.example/x.dtd">${env('<rect width="4" height="4"/>')}`, 'DOCTYPE externo')
  rechaza(
    `<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>${env('<text>&xxe;</text>')}`,
    'ENTITY (XXE)',
  )
})

test('7. animación de un atributo de evento (<set attributeName="onload">)', () => {
  rechaza(env('<rect width="4" height="4"><set attributeName="onload" to="alert(1)"/></rect>'), '<set>')
  rechaza(env('<rect width="4" height="4"><animate attributeName = " onmouseover" to="alert(1)"/></rect>'), '<animate>')
})

test('8. los clásicos: script, on*, foreignObject, iframe, embed, object', () => {
  rechaza(env('<script>alert(1)</script>'), '<script>')
  rechaza(env('<script type="text/ecmascript">alert(1)</script>'), '<script type>')
  rechaza('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="4" height="4"/></svg>', 'onload')
  rechaza(env('<rect width="4" height="4" onmouseover="alert(1)"/>'), 'onmouseover')
  rechaza(env(`<rect width="4" height="4" onclick${TAB}=${TAB}"alert(1)"/>`), 'onclick con tabs')
  rechaza(env('<foreignObject width="4" height="4"><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject>'), '<foreignObject>')
  rechaza(env('<iframe src="//evil.example"></iframe>'), '<iframe>')
  rechaza(env('<embed src="//evil.example"/>'), '<embed>')
  rechaza(env('<object data="//evil.example"></object>'), '<object>')
})

test('9. enlaces a otro origen y data:', () => {
  rechaza(env('<use xlink:href="http://evil.example/x.svg#a"/>'), 'xlink:href http')
  rechaza(env('<use xlink:href="https://evil.example/x.svg#a"/>'), 'xlink:href https')
  rechaza(env('<a href="//evil.example/x"><text>x</text></a>'), 'href protocolo-relativo')
  rechaza(env('<image href="https://evil.example/x.png" width="4" height="4"/>'), 'href SVG 2')
  rechaza(env('<a href="data:text/html;base64,PHNjcmlwdD4="><text>x</text></a>'), 'data:text/html')
  rechaza(env('<image href="data:image/png;base64,AAAA" width="4" height="4"/>'), 'data: (se rechaza entero)')
})

test('10. no es un SVG / está vacío', () => {
  rechaza('', 'vacío')
  rechaza('   ', 'solo espacios')
  rechaza('<html><body>hola</body></html>', 'HTML')
  rechaza('<?xml version="1.0"?><rect/>', 'XML sin <svg>')
})

// ─── Logos legítimos ─────────────────────────────────────────────────────────

test('11. logo simple con paths → se acepta', () => {
  acepta(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img">` +
      `<title>Logo de la escuela</title>` +
      `<path d="M8 8h48v48H8z" fill="#0F172A"/>` +
      `<path d="M20 32 L28 42 L46 20" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round"/>` +
      `</svg>`,
  )
})

test('12. logo con <defs> y degradados → se acepta', () => {
  acepta(
    `<?xml version="1.0" encoding="UTF-8"?>${NL}` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">${NL}` +
      `  <defs>${NL}` +
      `    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">${NL}` +
      `      <stop offset="0%" stop-color="#2563EB"/>${NL}` +
      `      <stop offset="100%" stop-color="#7C3AED"/>${NL}` +
      `    </linearGradient>${NL}` +
      `    <clipPath id="c1"><rect width="120" height="40" rx="8"/></clipPath>${NL}` +
      `  </defs>${NL}` +
      `  <rect width="120" height="40" rx="8" fill="url(#g1)" clip-path="url(#c1)"/>${NL}` +
      `  <text x="12" y="26" font-family="Helvetica" font-size="16" fill="#FFFFFF">Escuela &amp; Co</text>${NL}` +
      `</svg>`,
  )
})

test('13. logo con xlink:href interno (#id) → se acepta', () => {
  acepta(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">` +
      `<defs><circle id="punto" cx="10" cy="10" r="4" fill="#111827"/></defs>` +
      `<use xlink:href="#punto" x="0" y="0"/>` +
      `<use xlink:href="#punto" x="30" y="0"/>` +
      `<use href="#punto" x="60" y="0"/>` +
      `<style>.t{font-family:Helvetica;font-size:10px}</style>` +
      `<text class="t" x="0" y="40">Sec &amp; Prepa</text>` +
      `</svg>`,
  )
})

test('14. el motivo del rechazo llega en español y sin el contenido del archivo', () => {
  const motivo = rechaza(env('<script>alert(1)</script>'))
  expect(motivo).toMatch(/script/)
  expect(motivo).not.toMatch(/alert/)
})
