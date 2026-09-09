'use client'

/**
 * Barra fija de abajo: el estado del borrador y las dos acciones que escriben
 * en la base.
 *
 * Está SIEMPRE a la vista (no al final del formulario) porque las pestañas son
 * largas: sin ella, un admin que cambia un precio en la pestaña de Precios y
 * baja a mirar los textos no tiene ni idea de que su cambio sigue sin
 * publicarse.
 *
 * Solo se pinta para quien puede editar; el secretario ve el editor en modo
 * lectura y una barra con botones apagados solo sería ruido.
 */
import { ExternalLink, Loader2, RotateCcw, UploadCloud } from 'lucide-react'
import { BORDE, ROJO, TXT_SUAVE, TXT_TENUE } from './Comunes'

export interface BarraPublicarProps {
  dirty: boolean
  publicando: boolean
  restaurando: boolean
  /** Se enciende tras publicar con éxito, para ofrecer el enlace a la página. */
  publicado: boolean
  onPublicar: () => void
  onRestaurar: () => void
}

export function BarraPublicar({
  dirty, publicando, restaurando, publicado, onPublicar, onRestaurar,
}: BarraPublicarProps) {
  const ocupado = publicando || restaurando

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[80] px-4 py-3"
      style={{ background: 'rgba(13,16,23,0.96)', borderTop: `1px solid ${BORDE}`, backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {dirty ? (
            <>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} aria-hidden="true" />
              <span className="text-sm font-medium" style={{ color: TXT_SUAVE }}>Cambios sin publicar</span>
            </>
          ) : publicado ? (
            <span className="text-sm flex items-center gap-3 flex-wrap" style={{ color: TXT_SUAVE }}>
              Publicado.
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline"
                style={{ color: 'var(--color-acento)' }}
              >
                Ver mi página <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <span className="text-xs" style={{ color: TXT_TENUE }}>
                Los cambios pueden tardar unos segundos en verse.
              </span>
            </span>
          ) : (
            <span className="text-sm" style={{ color: TXT_TENUE }}>Todo publicado</span>
          )}
        </div>

        <button
          type="button"
          onClick={onRestaurar}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: `1px solid ${BORDE}`, color: ROJO }}
        >
          {restaurando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="w-4 h-4" aria-hidden="true" />}
          Restaurar diseño original
        </button>

        <button
          type="button"
          onClick={onPublicar}
          disabled={ocupado || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
        >
          {publicando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-4 h-4" aria-hidden="true" />}
          Publicar cambios
        </button>
      </div>
    </div>
  )
}
