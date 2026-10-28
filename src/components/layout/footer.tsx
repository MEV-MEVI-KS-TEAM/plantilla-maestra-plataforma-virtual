'use client'

import { CONFIG } from '@/lib/config'
import { getNivelLabel } from '@/lib/modalidades'
import { getCarrerasDiplomado, getCarrerasLicenciatura, licenciaturasActivas } from '@/lib/licenciatura-utils'
import { useSiteConfig } from '@/components/site-config-provider'
import { mailtoEscuela, urlWhatsAppEscuela } from '@/lib/contacto-ui'

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
    // Licenciaturas y diplomados viajan por el mismo riel pero se anuncian
    // aparte: el alumno de licenciatura no compró «cursos y diplomados».
    const lic = getCarrerasLicenciatura()
    const dip = getCarrerasDiplomado()
    if (lic.length > 0) partes.push(lic.length === 1 ? lic[0].nombre : `${lic.length} licenciaturas`)
    if (dip.length > 0) partes.push(dip.length === 1 ? dip[0].nombre : `${dip.length} diplomados`)
  }
  partes.push('100% en línea')
  return partes.join(' · ')
}

export function Footer() {
  // Nombre y contacto son editables desde "Personalizar mi página". `dominio`
  // no lo es y sigue saliendo de CONFIG.
  const cfg = useSiteConfig()
  const mailto = mailtoEscuela(cfg.contactoEmail)
  const wa = urlWhatsAppEscuela(cfg.contactoTelefono)
  return (
    <footer
      className="mt-auto px-4 py-6 text-center space-y-1.5"
      style={{
        background: '#0D0F14',
        borderTop: '1px solid #2A2F3E',
      }}
    >
      <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
        {cfg.nombre}
      </p>
      <p className="text-xs" style={{ color: '#94A3B8' }}>
        {ofertaDelCliente()}
      </p>
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1">
        <a
          href={`https://${CONFIG.dominio}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8' }}
        >
          {CONFIG.dominio}
        </a>
        {/* Sin correo público no hay `mailto:` vacío; sin WhatsApp real, no hay
            `wa.me/` que no lleve a nadie. */}
        {mailto && (
          <>
            <span style={{ color: '#2A2F3E' }}>·</span>
            <a
              href={mailto}
              className="text-xs transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8' }}
            >
              {cfg.contactoEmail}
            </a>
          </>
        )}
        {wa && (
          <>
            <span style={{ color: '#2A2F3E' }}>·</span>
            <a
              href={wa}
              className="text-xs transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8' }}
            >
              {cfg.whatsappDisplay || cfg.contactoTelefono}
            </a>
          </>
        )}
      </div>
      <p className="text-xs" style={{ color: '#94A3B8' }}>
        © {new Date().getFullYear()} {cfg.nombre}. Todos los derechos reservados.
      </p>
    </footer>
  )
}
