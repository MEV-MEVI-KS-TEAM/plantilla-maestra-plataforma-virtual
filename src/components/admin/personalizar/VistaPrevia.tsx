'use client'

/**
 * Vista previa en vivo del borrador.
 *
 * NO es una miniatura de la landing: es una MUESTRA de las tres cosas que el
 * admin está tocando y que dan casi todos los tickets — el logo y el nombre,
 * los colores (fondo primario, resaltado y botón con su texto encima) y los
 * textos del hero. Reproducir la landing entera aquí sería duplicar
 * LandingClient y garantizar que se desincronicen; esto responde la pregunta
 * real ("¿se lee el botón?", "¿el logo se ve en oscuro?") sin publicar nada.
 *
 * Se pinta con los valores del FORMULARIO, no con los publicados: es lo que se
 * verá al pulsar "Publicar cambios".
 */
import { interpolar } from '@/lib/site-config-core'
import { getDuracionLabel } from '@/lib/modalidades'
import { formatoDinero, type ModalidadEditable } from '@/lib/site-config-editor'
import type { Moneda } from '@/lib/moneda'
import type { TokensColores } from '@/lib/site-config-paletas'
import { BORDE, TXT, TXT_SUAVE, TXT_TENUE } from './Comunes'

export interface VistaPreviaProps {
  colores: TokensColores
  logo: string
  nombre: string
  nombreCompleto: string
  tagline: string
  whatsapp: string
  heroTitulo: string
  heroHighlight: string
  heroSubtitulo: string
  heroCtaPrimario: string
  inscripcion: number
  modalidades: ModalidadEditable[]
  /** Moneda de cobro de la escuela: la previa tiene que enseñar lo que verá el alumno. */
  moneda: Moneda
}

export function VistaPrevia({
  colores, logo, nombre, nombreCompleto, tagline, whatsapp,
  heroTitulo, heroHighlight, heroSubtitulo, heroCtaPrimario, inscripcion, modalidades, moneda,
}: VistaPreviaProps) {
  // Los mismos placeholders y en el mismo orden que LandingClient: si aquí se
  // vieran las llaves sin sustituir, el admin creería que su texto está roto.
  const vars = {
    duracion: getDuracionLabel(modalidades),
    nombre,
    nombreCompleto,
    whatsapp,
    inscripcion: formatoDinero(inscripcion, moneda),
  }
  const t = (s: string) => interpolar(s, vars)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: TXT }}>Vista previa</h3>
        <span className="text-xs" style={{ color: TXT_TENUE }}>Sin publicar</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDE}` }}>
        {/* Hero: fondo primario con el título y el botón de acento. */}
        <div className="px-5 py-6" style={{ background: colores.primario }}>
          <p
            className="text-lg font-extrabold leading-tight"
            style={{ color: '#FFFFFF' }}
          >
            {t(heroTitulo)}{' '}
            <span style={{ color: colores.acento }}>{t(heroHighlight)}</span>
          </p>
          <p
            className="text-xs mt-2 leading-relaxed whitespace-pre-line"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            {t(heroSubtitulo)}
          </p>
          <button
            type="button"
            // Decorativo: la vista previa no navega a ningún lado.
            tabIndex={-1}
            aria-hidden="true"
            className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: colores.acento, color: colores.textoSobreAcento }}
          >
            {t(heroCtaPrimario)}
          </button>
        </div>

        {/* Tarjeta sobre el fondo de la página: superficie, borde y textos. */}
        <div className="p-4" style={{ background: colores.fondo }}>
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: colores.superficie, border: `1px solid ${colores.borde}` }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 p-1"
              style={{ background: colores.fondo }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={`Logo de ${nombre}`}
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: colores.texto }}>{nombre}</p>
              <p className="text-xs truncate" style={{ color: colores.textoSecundario }}>
                {tagline || nombreCompleto}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: TXT_SUAVE }}>
        Es una muestra del logo, los colores y los textos del inicio. La página
        completa se ve al publicar.
      </p>
    </div>
  )
}
