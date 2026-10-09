'use client'

import { parseVideoUrl } from '@/lib/cursos/parse-video-url'
import { BunnyVistaPrevia } from '@/components/admin/BunnyVistaPrevia'

const PROVIDER_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  loom: 'Loom',
  bunny: 'Bunny Stream',
}

/**
 * Preview embebido instantáneo para el form de lección. Si la URL no se
 * reconoce, muestra el mensaje orientativo sin bloquear nada.
 */
export function VideoPreview({ url, titulo }: { url: string; titulo?: string }) {
  const trimmed = url.trim()
  if (!trimmed) return null

  const parsed = parseVideoUrl(trimmed)

  if (!parsed) {
    return (
      <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>
        Pega un enlace de YouTube, Vimeo, Loom o Bunny Stream. (Puedes guardar la lección de todas formas.)
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
      {parsed.provider === 'bunny' ? (
        // Bunny exige firma y la llave vive en el servidor: la vista previa la
        // pide firmada a /api/admin/video-firmado. Se usa la canónica (sin el
        // token que pudiera traer lo pegado).
        <BunnyVistaPrevia url={parsed.canonica} titulo={titulo} />
      ) : (
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-primario)' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={parsed.embedUrl}
            title={titulo?.trim() ? `Video: ${titulo}` : 'Vista previa del video de la lección'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
      )}
    </div>
  )
}
