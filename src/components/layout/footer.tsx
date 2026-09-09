'use client'

import { CONFIG } from '@/lib/config'
import { getNivelLabel } from '@/lib/modalidades'
import { getCarreras, licenciaturasActivas } from '@/lib/licenciatura-utils'
import { useSiteConfig } from '@/components/site-config-provider'

/**
 * Qué vende el cliente, leído de su config.
 *
 * Estaba escrito a mano como "Preparatoria · Secundaria · 100% en línea", así
 * que un cliente que solo vendiera secundaria anunciaba prepa, y el alumno de
 * un curso o diplomado leía al pie de su portal dos programas que no cursa.
 */
function ofertaDelCliente(): string {
  const partes: string[] = []
  const niveles = getNivelLabel()
  if (niveles) partes.push(niveles)
  if (licenciaturasActivas()) {
    const n = getCarreras().length
    if (n > 0) partes.push(n === 1 ? getCarreras()[0].nombre : `${n} cursos y diplomados`)
  }
  partes.push('100% en línea')
  return partes.join(' · ')
}

export function Footer() {
  // Nombre y contacto son editables desde "Personalizar mi página". `dominio`
  // no lo es y sigue saliendo de CONFIG.
  const cfg = useSiteConfig()
  return (
    <footer
      className="mt-auto px-4 py-6 text-center space-y-1.5"
      style={{
        background: '#0D0F14',
        borderTop: '1px solid #2A2F3E',
      }}
    >
      <p className="text-xs font-semibold" style={{ color: '#475569' }}>
        {cfg.nombre}
      </p>
      <p className="text-xs" style={{ color: '#374151' }}>
        {ofertaDelCliente()}
      </p>
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1">
        <a
          href={`https://${CONFIG.dominio}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs transition-colors"
          style={{ color: '#374151' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1565C0' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#374151' }}
        >
          {CONFIG.dominio}
        </a>
        <span style={{ color: '#2A2F3E' }}>·</span>
        <a
          href={`mailto:${cfg.contactoEmail}`}
          className="text-xs transition-colors"
          style={{ color: '#374151' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1565C0' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#374151' }}
        >
          {cfg.contactoEmail}
        </a>
        {cfg.contactoTelefono && (
          <>
            <span style={{ color: '#2A2F3E' }}>·</span>
            <a
              href={`https://wa.me/${cfg.contactoTelefono}`}
              className="text-xs transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1565C0' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#374151' }}
            >
              {cfg.whatsappDisplay ?? cfg.contactoTelefono}
            </a>
          </>
        )}
      </div>
      <p className="text-xs" style={{ color: '#374151' }}>
        © {new Date().getFullYear()} {cfg.nombre}. Todos los derechos reservados.
      </p>
    </footer>
  )
}
