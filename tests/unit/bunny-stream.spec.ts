import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  parseBunnyUrl, bunnyEmbedFirmado, canonizarVideoUrl, bunnyCaducada, esHostBunny, VIDEO_NO_DISPONIBLE, VIDEO_CADUCADO,
} from '@/lib/video/bunny-url'
import { tokenBunny, firmarUrlVideo, configBunnyDe, BUNNY_VIGENCIA_S } from '@/lib/video/bunny-firma-core'
import { parseVideoUrl } from '@/lib/cursos/parse-video-url'
import { validarSemanaPatch } from '@/lib/contenido-semana'
import VideoEmbed, { esVideoReproducible } from '@/components/alumno/VideoEmbed'
import { VideoPlayer } from '@/components/cursos/VideoPlayer'

/**
 * Bunny Stream — videos propios (CLASES MEV EN VIDEO).
 *
 * La biblioteca tiene "embed view token authentication": una URL sin
 * token/expires responde 403. El servidor firma (SHA256_HEX(llave + video_id +
 * expires)) DESPUÉS de validar el acceso del alumno; en la BD queda SIEMPRE la
 * URL canónica; el navegador solo monta el iframe si la URL viene firmada y,
 * si no, pinta un aviso neutro. La llave nunca llega al navegador.
 */

const LIB = '123456'
const GUID = '32d140e2-e4f4-4eec-9d53-20371e9be607'
const CANONICA = `https://player.mediadelivery.net/embed/${LIB}/${GUID}`
const TOKEN64 = 'a'.repeat(64)
const FUTURO = 4102444800 // 2100-01-01: firma vigente

// ─── Reconocer URLs ─────────────────────────────────────────────────────────

test('reconoce las URLs de embed válidas (player e iframe, con o sin «/» final)', () => {
  for (const url of [
    CANONICA,
    `${CANONICA}/`,
    `https://iframe.mediadelivery.net/embed/${LIB}/${GUID}`,
    `https://PLAYER.mediadelivery.net/embed/${LIB}/${GUID.toUpperCase()}`,
    `${CANONICA}?autoplay=false&preload=true`,
  ]) {
    const v = parseBunnyUrl(url)
    expect(v, url).not.toBeNull()
    expect(v!.libraryId).toBe(LIB)
    expect(v!.videoId).toBe(GUID)
    expect(v!.token).toBeNull()
  }
})

test('http se acepta pero se reconstruye SIEMPRE en https', () => {
  const v = parseBunnyUrl(`http://player.mediadelivery.net/embed/${LIB}/${GUID}?token=${TOKEN64}&expires=${FUTURO}`)
  expect(bunnyEmbedFirmado(v!)).toBe(`${CANONICA}?token=${TOKEN64}&expires=${FUTURO}`)
  expect(canonizarVideoUrl(`http://iframe.mediadelivery.net/embed/${LIB}/${GUID}`)).toBe(CANONICA)
})

test('rechaza hosts, esquemas, rutas e IDs inválidos', () => {
  for (const url of [
    `https://player.mediadelivery.net.evil.com/embed/${LIB}/${GUID}`, // sufijo
    `https://evilmediadelivery.net/embed/${LIB}/${GUID}`,
    `https://mediadelivery.net/embed/${LIB}/${GUID}`,
    `https://video.bunnycdn.com/embed/${LIB}/${GUID}`,
    `https://player.mediadelivery.net/play/${LIB}/${GUID}`,          // otra ruta
    `https://player.mediadelivery.net/embed/abc/${GUID}`,            // biblioteca no numérica
    `https://player.mediadelivery.net/embed/${LIB}/not-a-guid`,
    `https://player.mediadelivery.net/embed/${LIB}/${GUID}/extra`,
    `https://player.mediadelivery.net/embed/${LIB}/${GUID}x`,
    `https://user:pw@player.mediadelivery.net/embed/${LIB}/${GUID}`,
    `https://player.mediadelivery.net:8443/embed/${LIB}/${GUID}`,
    `javascript:alert(1)//player.mediadelivery.net/embed/${LIB}/${GUID}`,
    `data:text/html,<script>alert(1)</script>`,
    '', '   ',
  ]) {
    expect(parseBunnyUrl(url), url).toBeNull()
  }
  expect(parseBunnyUrl(null)).toBeNull()
  expect(parseBunnyUrl(undefined)).toBeNull()
})

test('solo cuenta como firmada con token de 64 hex y expires UNIX en segundos', () => {
  expect(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}&expires=1700000000`)!.token).toBe(TOKEN64)
  expect(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}&expires=1700000000000`)!.token).toBeNull() // ms
  expect(parseBunnyUrl(`${CANONICA}?token=abc&expires=1700000000`)!.token).toBeNull()
  expect(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}`)!.token).toBeNull()
  expect(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}"><script>&expires=1700000000`)!.token).toBeNull()
})

test('el iframe se RECONSTRUYE: nunca arrastra parámetros extra de la URL', () => {
  const v = parseBunnyUrl(`https://iframe.mediadelivery.net/embed/${LIB}/${GUID}?token=${TOKEN64}&expires=1700000000&autoplay=true&x="onload=alert(1)`)
  expect(bunnyEmbedFirmado(v!)).toBe(`${CANONICA}?token=${TOKEN64}&expires=1700000000`)
  expect(bunnyEmbedFirmado(parseBunnyUrl(CANONICA)!)).toBeNull()
})

test('al guardar, Bunny queda canónica (sin token) y lo demás tal cual', () => {
  expect(canonizarVideoUrl(`https://iframe.mediadelivery.net/embed/${LIB}/${GUID.toUpperCase()}/?token=${TOKEN64}&expires=1700000000`)).toBe(CANONICA)
  expect(canonizarVideoUrl('https://www.youtube.com/watch?v=Nyts_ereM4Y')).toBe('https://www.youtube.com/watch?v=Nyts_ereM4Y')
  expect(canonizarVideoUrl(null)).toBeNull()

  const r = validarSemanaPatch({ video_url: `${CANONICA}?token=${TOKEN64}&expires=1700000000`, video_url_2: 'https://youtu.be/Nyts_ereM4Y', video_url_3: '' })
  expect(r.ok).toBe(true)
  if (r.ok) {
    expect(r.update.video_url).toBe(CANONICA)
    expect(r.update.video_url_2).toBe('https://youtu.be/Nyts_ereM4Y')
  }
})

// ─── Firma ──────────────────────────────────────────────────────────────────

test('firma determinista: caso conocido (entradas del ejemplo de la doc de Bunny; hash calculado aparte)', () => {
  // SHA256_HEX("4742a81b-…" + "32d140e2-…" + "1623440202"), calculado aparte con Python hashlib.
  // La compatibilidad REAL con Bunny la prueban el arnés (tests/arnes-rutas/bunny-videos.mjs) y
  // el smoke /api/health/video: Bunny responde 200 a la firmada y 403 a la canónica.
  expect(tokenBunny('4742a81b-bf15-42fe-8b1c-8fcb9024c550', '32d140e2-e4f4-4eec-9d53-20371e9be607', 1623440202))
    .toBe('a8617f6df2e9b55b65ac7112138c70417766d80614bfe146d0d9bb2bd21fef87')
})

test('firmarUrlVideo: Bunny se firma 6 h; YouTube/Vimeo/Loom pasan intactos', () => {
  const cfg = { libraryId: LIB, tokenKey: 'llave-de-prueba' }
  const ahora = 1_800_000_000
  const r = firmarUrlVideo(`https://iframe.mediadelivery.net/embed/${LIB}/${GUID}`, cfg, ahora)
  expect(r.error).toBeNull()
  const exp = ahora + BUNNY_VIGENCIA_S
  expect(BUNNY_VIGENCIA_S).toBe(21600)
  expect(r.url).toBe(`${CANONICA}?token=${tokenBunny('llave-de-prueba', GUID, exp)}&expires=${exp}`)
  expect(r.url).not.toContain('llave-de-prueba')

  for (const u of ['https://www.youtube.com/watch?v=Nyts_ereM4Y', 'https://vimeo.com/123456789', 'https://www.loom.com/share/0123456789abcdef0123']) {
    expect(firmarUrlVideo(u, cfg, ahora)).toEqual({ url: u, error: null })
  }
})

test('sin config o con otra biblioteca: sale la canónica SIN firma y un error', () => {
  expect(firmarUrlVideo(`${CANONICA}?token=${TOKEN64}&expires=1700000000`, null)).toEqual({ url: CANONICA, error: 'sin_config' })
  expect(firmarUrlVideo(CANONICA, { libraryId: '999', tokenKey: 'k' })).toEqual({ url: CANONICA, error: 'otra_biblioteca' })
})

test('configBunnyDe: exige las dos variables y biblioteca numérica', () => {
  expect(configBunnyDe({})).toBeNull()
  expect(configBunnyDe({ BUNNY_LIBRARY_ID: LIB })).toBeNull()
  expect(configBunnyDe({ BUNNY_TOKEN_KEY: 'k' })).toBeNull()
  expect(configBunnyDe({ BUNNY_LIBRARY_ID: 'abc', BUNNY_TOKEN_KEY: 'k' })).toBeNull()
  expect(configBunnyDe({ BUNNY_LIBRARY_ID: ` ${LIB} `, BUNNY_TOKEN_KEY: ' k ' })).toEqual({ libraryId: LIB, tokenKey: 'k' })
})

// ─── parseVideoUrl (cursos): Bunny nuevo, los demás sin cambios ───────────────

test('parseVideoUrl: Bunny sin firma no tiene embedUrl; firmada sí', () => {
  expect(parseVideoUrl(CANONICA)).toEqual({ provider: 'bunny', embedUrl: null, canonica: CANONICA })
  expect(parseVideoUrl(`${CANONICA}?token=${TOKEN64}&expires=1700000000`)).toEqual({
    provider: 'bunny', embedUrl: `${CANONICA}?token=${TOKEN64}&expires=1700000000`, canonica: CANONICA,
  })
})

test('parseVideoUrl: YouTube, Vimeo y Loom quedan EXACTAMENTE igual', () => {
  expect(parseVideoUrl('https://www.youtube.com/watch?v=Nyts_ereM4Y&t=90')).toEqual({
    provider: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/Nyts_ereM4Y?rel=0&modestbranding=1&start=90',
  })
  expect(parseVideoUrl('https://youtu.be/Nyts_ereM4Y')).toEqual({
    provider: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/Nyts_ereM4Y?rel=0&modestbranding=1',
  })
  expect(parseVideoUrl('https://vimeo.com/123456789/abcdef12')).toEqual({
    provider: 'vimeo', embedUrl: 'https://player.vimeo.com/video/123456789?h=abcdef12',
  })
  expect(parseVideoUrl('https://www.loom.com/share/0123456789abcdef0123')).toEqual({
    provider: 'loom', embedUrl: 'https://www.loom.com/embed/0123456789abcdef0123',
  })
  expect(parseVideoUrl('https://evil.com/embed/123/abc')).toBeNull()
})

// ─── Lo que ve el alumno (render real de los componentes) ────────────────────

// Playwright compila el JSX de los .tsx que importa una prueba a objetos propios
// ({ __pw_type: 'jsx', type, props, key }), no a elementos de React. Se llama al
// componente (no usa hooks) y se convierte su árbol a elementos reales.
type Nodo = unknown
function aReact(n: Nodo): Nodo {
  if (Array.isArray(n)) return n.map(aReact)
  if (n && typeof n === 'object' && (n as { __pw_type?: string }).__pw_type === 'jsx') {
    const { type, props, key } = n as { type: string; props: Record<string, unknown>; key?: string }
    const { children, ...resto } = props ?? {}
    const hijos = children === undefined ? [] : Array.isArray(children) ? children.map(aReact) : [aReact(children)]
    return createElement(type, { ...resto, key }, ...(hijos as []))
  }
  return n
}
function html<P>(componente: (p: P) => unknown, props: P): string {
  // El componente se llama DENTRO del render de un envoltorio: así sus hooks
  // (useMemo de la caducidad) tienen a React como despachador.
  const Envoltorio = () => aReact(componente(props)) as ReturnType<typeof createElement>
  return renderToStaticMarkup(createElement(Envoltorio))
}

test('VideoEmbed (materias): Bunny firmada → iframe de Bunny, NO de YouTube', () => {
  const firmada = `${CANONICA}?token=${TOKEN64}&expires=${FUTURO}`
  const h = html(VideoEmbed, { url: firmada, titulo: 'Semana 1', lang: 'es' })
  expect(h).toContain(`src="${CANONICA}?token=${TOKEN64}&amp;expires=${FUTURO}"`)
  expect(h).toContain('allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"')
  expect(h).toContain('allowfullscreen')
  expect(h).not.toContain('youtube')
})

test('VideoEmbed (materias): Bunny sin firmar → aviso neutro, sin iframe', () => {
  const h = html(VideoEmbed, { url: CANONICA, titulo: 'Semana 1', lang: 'es' })
  expect(h).toContain(VIDEO_NO_DISPONIBLE)
  expect(h).not.toContain('<iframe')
  expect(h).not.toContain('href=')
  expect(esVideoReproducible(CANONICA)).toBe(true) // el bloque se pinta (con el aviso)
})

test('VideoEmbed (materias): YouTube y el link externo no cambian', () => {
  const yt = html(VideoEmbed, { url: 'https://www.youtube.com/watch?v=Nyts_ereM4Y', titulo: 'x', lang: 'es' })
  expect(yt).toContain('src="https://www.youtube-nocookie.com/embed/Nyts_ereM4Y?rel=0&amp;modestbranding=1"')
  const ext = html(VideoEmbed, { url: 'https://vimeo.com/123456789', titulo: 'x', lang: 'es' })
  expect(ext).toContain('href="https://vimeo.com/123456789"')
  expect(ext).not.toContain('<iframe')
})

test('VideoPlayer (cursos): Bunny firmada → iframe; sin firmar → aviso; YouTube igual', () => {
  const firmada = `${CANONICA}?token=${TOKEN64}&expires=${FUTURO}`
  const a = html(VideoPlayer, { url: firmada, titulo: 'L1' })
  expect(a).toContain(`src="${CANONICA}?token=${TOKEN64}&amp;expires=${FUTURO}"`)
  expect(a).toContain('allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"')
  const b = html(VideoPlayer, { url: CANONICA, titulo: 'L1' })
  expect(b).toContain(VIDEO_NO_DISPONIBLE)
  expect(b).not.toContain('<iframe')
  expect(b).not.toContain('href=')
  const c = html(VideoPlayer, { url: 'https://youtu.be/Nyts_ereM4Y', titulo: 'L1' })
  expect(c).toContain('src="https://www.youtube-nocookie.com/embed/Nyts_ereM4Y?rel=0&amp;modestbranding=1"')
})

const SIETE_HORAS_MS = 7 * 3600 * 1000

test('firma vencida (pestaña abierta > 6 h): aviso para recargar, sin iframe', () => {
  const vencida = `${CANONICA}?token=${TOKEN64}&expires=1700000000`
  expect(bunnyCaducada(parseBunnyUrl(vencida)!, undefined, SIETE_HORAS_MS)).toBe(true)
  expect(bunnyCaducada(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}&expires=${FUTURO}`)!, undefined, SIETE_HORAS_MS)).toBe(false)
  expect(bunnyCaducada(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}&expires=1800000030`)!, 1_800_000_000, SIETE_HORAS_MS)).toBe(true) // margen 60 s
  const original = performance.now
  performance.now = () => SIETE_HORAS_MS
  try {
    for (const h of [
      html(VideoEmbed, { url: vencida, titulo: 'S1', lang: 'es' }),
      html(VideoPlayer, { url: vencida, titulo: 'L1' }),
    ]) {
      expect(h).toContain(VIDEO_CADUCADO)
      expect(h).not.toContain('<iframe')
    }
  } finally {
    performance.now = original
  }
})

test('reloj del alumno adelantado: con la página recién abierta NUNCA es «caducada»', () => {
  // expires ya pasó según el reloj local (adelantado), pero la página lleva 1 min abierta:
  // la URL se firmó después de cargarla, así que no puede haber vencido.
  expect(bunnyCaducada(parseBunnyUrl(`${CANONICA}?token=${TOKEN64}&expires=1700000000`)!, 1_900_000_000, 60_000)).toBe(false)
  const h = html(VideoEmbed, { url: `${CANONICA}?token=${TOKEN64}&expires=1700000000`, titulo: 'S1', lang: 'es' })
  expect(h).toContain('<iframe') // performance.now() del proceso de pruebas es chico
})

test('http de Bunny en VideoEmbed: iframe de Bunny en https, nunca el extractor de YouTube', () => {
  const h = html(VideoEmbed, { url: `http://iframe.mediadelivery.net/embed/${LIB}/${GUID}?token=${TOKEN64}&expires=${FUTURO}`, titulo: 'S1', lang: 'es' })
  expect(h).toContain(`src="${CANONICA}?token=${TOKEN64}&amp;expires=${FUTURO}"`)
  expect(h).not.toContain('youtube')
})

test('un host de Bunny mal formado no cae en YouTube ni en un link: aviso', () => {
  for (const url of [
    `https://player.mediadelivery.net/play/${LIB}/${GUID}`,
    `https://iframe.mediadelivery.net/embed/${LIB}/no-es-guid`,
    `https://vz-abc.b-cdn.net.mediadelivery.net/embed/${LIB}/${GUID}`,
  ]) {
    expect(esHostBunny(url), url).toBe(true)
    for (const h of [html(VideoEmbed, { url, titulo: 'S1', lang: 'es' }), html(VideoPlayer, { url, titulo: 'L1' })]) {
      expect(h, url).toContain(VIDEO_NO_DISPONIBLE)
      expect(h, url).not.toContain('<iframe')
      expect(h, url).not.toContain('href=')
    }
  }
  expect(esHostBunny('https://evilmediadelivery.net/embed/1/2')).toBe(false)
})

test('VideoEmbed: el link externo solo acepta http(s) (antes pintaba javascript: crudo)', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hola', 'drive.google.com/file/d/abc']) {
    expect(html(VideoEmbed, { url, titulo: 'x', lang: 'es' }), url).toBe('')
    // y la pantalla no cuenta ni pinta el bloque para lo que el componente no pinta
    expect(esVideoReproducible(url), url).toBe(false)
  }
  expect(esVideoReproducible(`http://iframe.mediadelivery.net/embed/${LIB}/${GUID}`)).toBe(true)
  expect(esVideoReproducible(`https://player.mediadelivery.net/play/${LIB}/${GUID}`)).toBe(true) // pinta el aviso
})

// ─── La llave nunca llega al navegador ───────────────────────────────────────

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? archivos(p) : /\.(tsx?|jsx?|mjs)$/.test(e.name) ? [p] : []
  })
}

test('ningún módulo de navegador importa la firma, y no existe NEXT_PUBLIC_BUNNY_*', () => {
  const todos = archivos('src')
  for (const f of todos) {
    const s = fs.readFileSync(f, 'utf8')
    expect(s, f).not.toMatch(/NEXT_PUBLIC_BUNNY/)
    if (/^\s*['"]use client['"]/m.test(s)) {
      expect(s, `${f} es de navegador y no puede firmar`).not.toMatch(/bunny-firma/)
      expect(s, f).not.toMatch(/BUNNY_TOKEN_KEY/)
    }
  }
  const firma = fs.readFileSync('src/lib/video/bunny-firma.ts', 'utf8')
  expect(firma.split('\n')[0]).toBe("import 'server-only'")
  // el entorno BUNNY_* solo se lee en bunny-firma-core (configBunnyDe); nadie más lo toca directo
  const leen = todos.filter(f => /env\.BUNNY_|env\[['"]BUNNY_/.test(fs.readFileSync(f, 'utf8')) && !/bunny-firma-core\.ts$/.test(f))
  expect(leen).toEqual([])
  // y quien llama a configBunnyDe(process.env) es código de servidor
  for (const f of todos.filter(f => /configBunnyDe\(process\.env\)/.test(fs.readFileSync(f, 'utf8')))) {
    expect(f.split(path.sep).join('/'), f).toMatch(/src\/lib\/video\/bunny-firma\.ts$|src\/app\/api\/health\/video\/route\.ts$/)
  }
})

test('la firma se aplica después del control de acceso en la ruta de materia', () => {
  const s = fs.readFileSync('src/app/api/alumno/materia/[id]/route.ts', 'utf8')
  const acceso = s.indexOf('if (!acceso.acceso)')
  const firma = s.indexOf('firmarVideoUrl(')
  expect(acceso).toBeGreaterThan(0)
  expect(firma).toBeGreaterThan(acceso)
})
