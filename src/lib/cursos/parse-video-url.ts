/**
 * parseVideoUrl — reconoce enlaces de YouTube, Vimeo y Loom y los convierte
 * en URLs embebibles. Núcleo del flujo "videos por link" del módulo Cursos.
 *
 * Retorna null si el enlace no se reconoce (la UI no bloquea el guardado,
 * solo muestra un mensaje orientativo).
 *
 * ⚠️ INVARIANTE DE SEGURIDAD: video_url se guarda CRUDO en la DB. Cualquier
 * consumidor (este panel y el visor del alumno de Fase 3) debe renderizar
 * SIEMPRE a través de parseVideoUrl — nunca meter video_url directo a un
 * iframe/href. Esta función whitelistea hosts, exige http(s) y reconstruye
 * el embedUrl con IDs validados por regex.
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'loom' | 'html'

export interface ParsedVideo {
  provider: VideoProvider
  embedUrl: string
}

/** Convierte "1h2m30s", "90s", "90" → segundos. Retorna null si no es válido. */
function parseTimeParam(t: string | null): number | null {
  if (!t) return null
  const trimmed = t.trim()
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match || (!match[1] && !match[2] && !match[3])) return null
  const h = parseInt(match[1] ?? '0', 10)
  const m = parseInt(match[2] ?? '0', 10)
  const s = parseInt(match[3] ?? '0', 10)
  return h * 3600 + m * 60 + s
}

/** IDs de video de YouTube: exactamente 11 chars [A-Za-z0-9_-] */
const YT_ID = /^[A-Za-z0-9_-]{11}$/

function youtubeEmbed(id: string, start: number | null): ParsedVideo {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' })
  if (start && start > 0) params.set('start', String(start))
  return {
    provider: 'youtube',
    // youtube-nocookie: mismo dominio que usa VideoEmbed del flujo académico
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
  }
}

/**
 * ¿`host` es uno de los dominios de la escuela o un subdominio suyo?
 * «senderi.mx» acepta senderi.mx y semillas.senderi.mx, pero NO
 * otrosenderi.mx ni senderi.mx.evil.com.
 */
function hostPermitido(host: string, dominios: readonly string[]): boolean {
  return dominios.some(d => {
    const dom = d.trim().toLowerCase().replace(/^\.+/, '')
    return !!dom && (host === dom || host.endsWith(`.${dom}`))
  })
}

/**
 * @param dominiosHtml  Dominios de la escuela cuyas páginas pueden mostrarse
 *   dentro de la lección (`CONFIG.contenidoHtml.dominios`). Solo https, y solo
 *   si el link no es de un proveedor de video.
 */
export function parseVideoUrl(url: string, dominiosHtml: readonly string[] = []): ParsedVideo | null {
  if (!url || typeof url !== 'string') return null

  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  const path = parsed.pathname

  // ── YouTube ────────────────────────────────────────────────────────────────
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const start = parseTimeParam(parsed.searchParams.get('t') ?? parsed.searchParams.get('start'))

    // watch?v=ID
    if (path === '/watch') {
      const id = parsed.searchParams.get('v')
      if (id && YT_ID.test(id)) return youtubeEmbed(id, start)
      return null
    }
    // shorts/ID  ·  embed/ID  ·  live/ID
    const pathMatch = path.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)
    if (pathMatch && YT_ID.test(pathMatch[1])) return youtubeEmbed(pathMatch[1], start)
    return null
  }

  // youtu.be/ID
  if (host === 'youtu.be') {
    const id = path.slice(1).split('/')[0]
    const start = parseTimeParam(parsed.searchParams.get('t'))
    if (id && YT_ID.test(id)) return youtubeEmbed(id, start)
    return null
  }

  // ── Vimeo ──────────────────────────────────────────────────────────────────
  // vimeo.com/{id}  ·  vimeo.com/{id}/{hash}  ·  player.vimeo.com/video/{id}
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const vimeoMatch = path.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/)
    if (vimeoMatch) {
      const id = vimeoMatch[1]
      const hash = vimeoMatch[2]
      return {
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`,
      }
    }
    return null
  }

  // ── Loom ───────────────────────────────────────────────────────────────────
  // loom.com/share/{id}  ·  loom.com/embed/{id}
  if (host === 'loom.com') {
    const loomMatch = path.match(/^\/(?:share|embed)\/([a-f0-9]{16,40})/i)
    if (loomMatch) {
      return {
        provider: 'loom',
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      }
    }
    return null
  }

  // ── Página HTML de la escuela ──────────────────────────────────────────────
  // Va al final: un link de YouTube/Vimeo/Loom nunca cae aquí. Solo https y
  // solo dominios declarados; el embedUrl sale de URL.href (normalizado), no
  // del texto crudo, y sin credenciales en la URL.
  if (
    parsed.protocol === 'https:' &&
    !parsed.username && !parsed.password &&
    hostPermitido(parsed.hostname.toLowerCase(), dominiosHtml)
  ) {
    return { provider: 'html', embedUrl: parsed.href }
  }

  return null
}
