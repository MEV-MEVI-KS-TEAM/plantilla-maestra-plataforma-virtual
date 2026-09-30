import type { ParsedVideo } from '@/lib/cursos/parse-video-url'

/**
 * Iframe de una lección: video (YouTube/Vimeo/Loom) en 16:9, o una página HTML
 * de la escuela (TICKET-2026-09-28-13) en formato de página.
 *
 * La página HTML corre con `sandbox`: puede ejecutar sus scripts y usar SU
 * propio origen (fuentes, formularios, ligas), pero nunca el de la plataforma,
 * ni navegar la ventana principal.
 */
export function MarcoEmbebido({ parsed, title }: { parsed: ParsedVideo; title: string }) {
  if (parsed.provider === 'html') {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-borde, #E8DED0)', background: '#fff' }}>
        <iframe
          src={parsed.embedUrl}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          style={{ display: 'block', width: '100%', height: '75vh', minHeight: 480, border: 'none' }}
        />
      </div>
    )
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-primario)' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={parsed.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
