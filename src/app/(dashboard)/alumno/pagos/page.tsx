'use client'

/**
 * "Mis Pagos" — calendario de cuotas SEMANALES del alumno.
 *
 * EDUHCO cobra $250 a la semana: 12 semanas en Secundaria ($3,000) y 24 en
 * Preparatoria ($6,000). El total y el número de semanas se leen del plan del
 * alumno, NUNCA se escriben a mano: son distintos según el nivel.
 *
 * 🛑 En esta pantalla no aparece la palabra "mensualidad" ni "al mes".
 * 🛑 Ningún badge con fondo cyan sólido y texto blanco (1.87, ilegible).
 */

import { useEffect, useState } from 'react'
import { CONFIG } from '@/lib/config'
import { formatoMXN, formatoPrecio } from '@/lib/formato'

type Estado = 'pendiente' | 'pagado' | 'vencido' | 'condonado'

type Semana = {
  numero_semana: number
  total_semanas: number
  fecha_vencimiento: string
  monto: number
  estado: Estado
  condonado_motivo: string | null
}

type Datos = {
  periodicidad: 'semanal' | null
  nivel: string | null
  semanas_total: number
  cuota: number
  total_plan: number
  certificacion: number
  inscripcion_pagada: boolean
  resumen: {
    pagadas: number
    condonadas: number
    vencidas: number
    monto_pagado: number
    monto_vencido: number
    saldo_pendiente: number
    proxima_semana: number | null
    proxima_fecha: string | null
  }
  semanas: Semana[]
}

const C = CONFIG.colores

/** Estilos de badge. El cyan solo como relleno CLARO con texto oscuro. */
const BADGE: Record<Estado, { bg: string; color: string; borde: string; label: string }> = {
  pagado:    { bg: C.acentoClaro, color: C.texto,           borde: C.acento,  label: 'Pagado'    },
  pendiente: { bg: '#FFFFFF',   color: C.textoSecundario, borde: C.borde, label: 'Pendiente' },
  vencido:   { bg: '#FEF2F2',   color: '#B91C1C',         borde: '#FCA5A5', label: 'Vencido' },
  condonado: { bg: C.fondo,     color: C.textoSecundario, borde: C.borde, label: 'Condonado' },
}

function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MisPagosPage() {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/alumno/pagos')
      .then(r => r.ok ? r.json() : null)
      .then(d => setDatos(d))
      .catch(() => setDatos(null))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <div style={{ padding: 24, color: C.textoSecundario }}>Cargando tus pagos…</div>
  }

  if (!datos || !datos.periodicidad) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.primario, marginBottom: 8 }}>Mis Pagos</h1>
        <p style={{ color: C.textoSecundario, fontSize: 14 }}>
          Tu inscripción no lleva calendario de cuotas semanales. Si tienes dudas sobre tus
          pagos, escríbenos por WhatsApp.
        </p>
      </div>
    )
  }

  const { resumen, semanas } = datos
  const cubiertas = resumen.pagadas + resumen.condonadas
  const pct = datos.semanas_total ? Math.round((cubiertas / datos.semanas_total) * 100) : 0

  return (
    <div style={{ padding: '24px 16px', maxWidth: 880, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: C.primario, marginBottom: 4 }}>Mis Pagos</h1>
      <p style={{ color: C.textoSecundario, fontSize: 14, marginBottom: 24 }}>
        Tu plan se paga <strong style={{ color: C.texto }}>a la semana</strong>:{' '}
        {datos.semanas_total} cuotas de {formatoMXN(datos.cuota)}.
      </p>

      {/* ── Resumen ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', border: `1px solid ${C.borde}`, borderRadius: 16,
        padding: 20, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: C.textoSecundario, margin: 0 }}>Pagado</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.primario, margin: '2px 0 0' }}>
              {/* ⚠️ Un monto de 0 NO se escribe "$0" ni "Gratis": lo primero es
                  lo que el cliente pidió no ver en ningún lado, y lo segundo
                  sería falso (el plan sí cuesta). Se dice lo que pasa. */}
              {resumen.monto_pagado > 0 ? (
                <>
                  {formatoMXN(resumen.monto_pagado)}{' '}
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.textoSecundario }}>
                    de {formatoMXN(datos.total_plan)}
                  </span>
                </>
              ) : (
                <>
                  Aún sin pagos{' '}
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.textoSecundario }}>
                    · plan de {formatoMXN(datos.total_plan)}
                  </span>
                </>
              )}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: C.textoSecundario, margin: 0 }}>Avance</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.texto, margin: '2px 0 0' }}>
              Semana {Math.min(cubiertas + 1, datos.semanas_total)} de {datos.semanas_total}
            </p>
          </div>
        </div>

        {/* Barra de avance con la línea de marca (sin texto encima). */}
        <div style={{ marginTop: 16, height: 10, borderRadius: 999, background: C.borde, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 999,
            background: `linear-gradient(90deg, ${C.acento}, ${C.acento})`,
            transition: 'width .4s ease',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16, fontSize: 13 }}>
          <span style={{ color: C.textoSecundario }}>
            Inscripción:{' '}
            <strong style={{ color: datos.inscripcion_pagada ? C.primario : C.texto }}>
              {formatoPrecio(CONFIG.precios.inscripcion)}
            </strong>
          </span>
          <span style={{ color: C.textoSecundario }}>
            Saldo pendiente: <strong style={{ color: C.texto }}>{formatoMXN(resumen.saldo_pendiente)}</strong>
          </span>
          {resumen.vencidas > 0 && (
            <span style={{ color: '#B91C1C', fontWeight: 600 }}>
              {resumen.vencidas} {resumen.vencidas === 1 ? 'semana vencida' : 'semanas vencidas'}
            </span>
          )}
          {resumen.proxima_fecha && (
            <span style={{ color: C.textoSecundario }}>
              Próximo pago: <strong style={{ color: C.texto }}>{fechaLarga(resumen.proxima_fecha)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* ── Calendario ──────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: `1px solid ${C.borde}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 460 }}>
            <thead>
              <tr style={{ background: C.fondo }}>
                {['Semana', 'Vence', 'Monto', 'Estado'].map(h => (
                  <th key={h} style={{
                    textAlign: h === 'Monto' ? 'right' : 'left', padding: '12px 16px',
                    fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em',
                    color: C.primario, fontWeight: 700,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {semanas.map(s => {
                const b = BADGE[s.estado]
                return (
                  <tr key={s.numero_semana} style={{ borderTop: `1px solid ${C.borde}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: C.texto }}>{s.numero_semana}</td>
                    <td style={{ padding: '12px 16px', color: C.textoSecundario }}>{fechaLarga(s.fecha_vencimiento)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: C.texto }}>
                      {formatoMXN(s.monto)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: 999,
                        fontSize: 12, fontWeight: 700,
                        background: b.bg, color: b.color, border: `1px solid ${b.borde}`,
                      }}>{b.label}</span>
                      {s.estado === 'condonado' && s.condonado_motivo && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: C.textoSecundario }}>
                          {s.condonado_motivo}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 12, color: C.textoSecundario, marginTop: 16 }}>
        Los pagos se registran en la escuela. Si ya pagaste una semana y sigue apareciendo como
        pendiente, avísanos por WhatsApp al {CONFIG.whatsappDisplay}.
      </p>
    </div>
  )
}
