'use client'

import { AvisoMoneda, Equivalencia } from '@/components/moneda-equivalencia'
import { formatearMoneda } from '@/lib/moneda'
import { useEffect, useState } from 'react'
import { CONFIG } from '@/lib/config'
import { useSiteConfig } from '@/components/site-config-provider'

/**
 * Pagos del alumno.
 *
 * El cliente preguntó "¿y los enlaces de pago dónde están?" porque no estaban
 * en ningún lado: existían solo en su panel de Clip y se los habían mandado por
 * WhatsApp. Esta pantalla existía desde el onboarding pero era huérfana —no
 * figuraba en el menú— y solo decía "contacta a tu asesor"
 *.
 *
 * La plataforma NO cobra ni confirma nada: abre el enlace de Clip que le toca
 * al alumno según su nivel, y el pago lo sigue registrando el admin a mano en
 * /admin/pagos. Por eso el aviso de mandar el comprobante es parte de la
 * pantalla y no un detalle de letra chica.
 */

type Perfil = { nivel?: string; carrera?: string }

const fmt = (n: number) =>
  formatearMoneda(n, CONFIG, { conCodigo: true })

export default function PagarPage() {
  const [nivel, setNivel]       = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  // Nombre y WhatsApp son editables desde "Personalizar mi página"; `pagos`
  // (enlaces de cobro) no lo es y sigue leyendo CONFIG.
  const cfg = useSiteConfig()

  useEffect(() => {
    fetch('/api/alumno/perfil')
      .then(r => (r.ok ? r.json() : null))
      .then((d: Perfil | null) => setNivel(d?.nivel?.toLowerCase() ?? null))
      .catch(() => setNivel(null))
      .finally(() => setCargando(false))
  }, [])

  const cfgPagos = CONFIG.pagos
  // Mientras carga el perfil no se filtra por nivel: es preferible que el
  // alumno vea de más un instante a que la pantalla parezca vacía.
  const enlaces = (cfgPagos?.enlaces ?? []).filter(e =>
    e.niveles.length > 0 && (nivel === null ? true : e.niveles.includes(nivel)),
  )

  const wa = cfg.whatsappUrl || (cfg.whatsapp ? `https://wa.me/${cfg.whatsapp}` : '')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-texto)' }}>Pagos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
          Paga en línea con tarjeta desde aquí. Después envía tu comprobante para que
          registremos el pago en tu cuenta.
        </p>
      </div>

      {!cfgPagos?.activo || enlaces.length === 0 ? (
        <div className="rounded-xl p-5"
          style={{ background: 'var(--color-fondo-alt, #F8FAFC)', border: '1px solid var(--color-borde)' }}>
          <p className="text-sm" style={{ color: 'var(--color-texto)' }}>
            {cargando
              ? 'Cargando tus opciones de pago…'
              : 'Todavía no hay enlaces de pago para tu programa. Escríbenos y te decimos cómo hacer tu pago.'}
          </p>
          {!cargando && wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-block px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#25D366', color: '#fff' }}>
              💬 Escríbenos por WhatsApp
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {enlaces.map(e => (
              <div key={e.id}
                className="rounded-xl p-5 flex flex-wrap items-center justify-between gap-4"
                style={{ background: '#fff', border: '1px solid var(--color-borde)' }}>
                <div className="min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--color-texto)' }}>{e.concepto}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>
                    {e.detalle}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {e.monto !== null && (
                    <span className="text-lg font-bold text-right" style={{ color: 'var(--color-texto)' }}>
                      {fmt(e.monto)}
                      <Equivalencia monto={e.monto} />
                    </span>
                  )}
                  <a href={e.url} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap"
                    style={{ background: 'var(--color-primario)', color: 'var(--color-texto-sobre-primario, #fff)' }}>
                    Pagar en línea →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Obligatorio donde el alumno ve lo que va a pagar. Se pinta solo si
              la escuela cobra en una moneda distinta del peso. */}
          <AvisoMoneda className="text-xs px-1" />

          <div className="rounded-xl p-5 space-y-3"
            style={{ background: 'var(--color-fondo-alt, #F8FAFC)', border: '1px solid var(--color-borde)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-texto)' }}>
              Después de pagar
            </p>
            <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
              Envíanos tu comprobante por WhatsApp para registrar el pago en tu cuenta y
              abrirte el siguiente mes. El pago no se refleja solo.
            </p>
            {cfgPagos.emisor && (
              <p className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                Al abrir el enlace verás el cobro a nombre de <strong>{cfgPagos.emisor}</strong>,
                que es quien procesa los pagos de {cfg.nombre}.
              </p>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#25D366', color: '#fff' }}>
                💬 Enviar mi comprobante
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}
