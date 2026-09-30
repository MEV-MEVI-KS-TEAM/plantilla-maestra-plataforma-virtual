'use client'

import { parseVideoUrl } from '@/lib/cursos/parse-video-url'
import { CONFIG } from '@/lib/config'
import { MarcoEmbebido } from '@/components/cursos/MarcoEmbebido'

const DOMINIOS_HTML = CONFIG.contenidoHtml?.dominios ?? []

const PROVIDER_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  loom: 'Loom',
  html: 'Página de tu escuela',
}

/**
 * Preview embebido instantáneo para el form de lección. Si la URL no se
 * reconoce, muestra el mensaje orientativo sin bloquear nada.
 */
export function VideoPreview({ url, titulo }: { url: string; titulo?: string }) {
  const trimmed = url.trim()
  if (!trimmed) return null

  const parsed = parseVideoUrl(trimmed, DOMINIOS_HTML)

  if (!parsed) {
    return (
      <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>
        Pega un enlace de YouTube, Vimeo o Loom{DOMINIOS_HTML.length > 0 && <>, o de una página de {DOMINIOS_HTML.join(', ')} (con https)</>}. (Puedes guardar la lección de todas formas.)
      </p>
    )
  }

  return (
    <div className="mt-2">
      <span
        className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
        style={{ background: 'rgba(27,48,104,0.08)', color: 'var(--color-primario)' }}
      >
        {PROVIDER_LABEL[parsed.provider]}
      </span>
      <MarcoEmbebido
        parsed={parsed}
        title={titulo?.trim() ? `${parsed.provider === 'html' ? 'Contenido' : 'Video'}: ${titulo}` : 'Vista previa de la lección'}
      />
    </div>
  )
}
