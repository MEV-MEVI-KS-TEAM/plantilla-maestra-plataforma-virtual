'use client'

/**
 * "Cobranza de la semana" — el panel que Erika y Cinthya abren cada lunes.
 *
 * Lista los alumnos con cuotas semanales vencidas, de más a menos, con el
 * botón de WhatsApp a la mano. Al abrir un alumno se ve su calendario completo
 * y se puede cobrar una semana, condonarla o regenerar el calendario.
 *
 * Se reportan HECHOS: "3 semanas vencidas" quiere decir tres cuotas cuya fecha
 * ya pasó y que no tienen pago registrado. Puede ser un pago sin capturar; por
 * eso nunca se escribe "debe" ni "moroso".
 */

import { useCallback, useEffect, useState } from 'react'
import { CONFIG } from '@/lib/config'
import { formatoMXN } from '@/lib/formato'
import { MessageCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'

const C = CONFIG.colores

type Alumno = {
  id: string; nombre_completo: string; email: string; telefono: string | null
  matricula: string | null; nivel: string | null
  semanas_total: number; semanas_pagadas: number; semanas_condonadas: number
  semanas_vencidas: number; semanas_pendientes: number
  monto_pagado: number; monto_vencido: number; saldo_pendiente: number
  proxima_semana: number | null; proxima_fecha: string | null
}

type Semana = {
  numero_semana: number; total_semanas: number; fecha_vencimiento: string
  monto: number; estado: 'pendiente' | 'pagado' | 'vencido' | 'condonado'
  condonado_motivo: string | null
}

function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Mensaje de cobranza listo para WhatsApp. Se abre el chat; no se envía solo. */
function enlaceWhatsApp(a: Alumno): string {
  const tel = (a.telefono ?? '').replace(/\D/g, '')
  const destino = tel.length >= 10 ? (tel.length === 10 ? `52${tel}` : tel) : ''
  const texto = encodeURIComponent(
    `Hola ${a.nombre_completo.split(' ')[0]}, te saludamos de ${CONFIG.nombre}. ` +
    `Tienes ${a.semanas_vencidas} ${a.semanas_vencidas === 1 ? 'semana pendiente' : 'semanas pendientes'} ` +
    `por ${formatoMXN(a.monto_vencido)}. ¿Te ayudamos a ponerte al corriente?`,
  )
  return destino ? `https://wa.me/${destino}?text=${texto}` : `https://wa.me/?text=${texto}`
}

export default function CobranzaPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soloVencidas, setSoloVencidas] = useState(true)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargar = useCallback(() => {
    setCargando(true)
    fetch('/api/admin/cobranza')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'No se pudo cargar')
        return d
      })
      .then(d => { setAlumnos(d.alumnos ?? []); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function abrirAlumno(id: string) {
    if (abierto === id) { setAbierto(null); setSemanas([]); return }
    setAbierto(id); setSemanas([])
    const r = await fetch(`/api/admin/cobranza/${id}`)
    const d = await r.json()
    if (r.ok) setSemanas(d.semanas ?? [])
  }

  async function accion(alumnoId: string, cuerpo: Record<string, unknown>, exito: string) {
    setTrabajando(true); setAviso(null)
    try {
      const r = await fetch(`/api/admin/cobranza/${alumnoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'No se pudo completar la acción')
      setAviso(exito)
      const r2 = await fetch(`/api/admin/cobranza/${alumnoId}`)
      const d2 = await r2.json()
      if (r2.ok) setSemanas(d2.semanas ?? [])
      cargar()
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Error')
    } finally {
      setTrabajando(false)
    }
  }

  const lista = soloVencidas ? alumnos.filter(a => a.semanas_vencidas > 0) : alumnos
  const totalVencido = alumnos.reduce((s, a) => s + a.monto_vencido, 0)

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: C.primario, marginBottom: 4 }}>
        Cobranza de la semana
      </h1>
      <p style={{ color: C.textoSecundario, fontSize: 14, marginBottom: 20 }}>
        Alumnos con cuotas semanales cuya fecha ya pasó y no tienen pago registrado.
        Puede tratarse de un pago aún sin capturar.
      </p>

      <div style={{
        display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
        background: C.fondo, borderRadius: 14, padding: '14px 18px', marginBottom: 20,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: C.textoSecundario, textTransform: 'uppercase', letterSpacing: '.06em' }}>Con semanas vencidas</p>
          <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 700, color: C.primario }}>
            {alumnos.filter(a => a.semanas_vencidas > 0).length}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: C.textoSecundario, textTransform: 'uppercase', letterSpacing: '.06em' }}>Monto vencido</p>
          <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 700, color: C.primario }}>{formatoMXN(totalVencido)}</p>
        </div>
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.texto }}>
          <input type="checkbox" checked={soloVencidas} onChange={e => setSoloVencidas(e.target.checked)} />
          Solo con semanas vencidas
        </label>
        <button onClick={cargar} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          borderRadius: 10, border: `1px solid ${C.borde}`, background: '#FFFFFF',
          color: C.primario, fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {aviso && (
        <p style={{
          background: '#FFFFFF', border: `1px solid ${C.borde}`, borderLeft: `4px solid ${C.primario}`,
          borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.texto, marginBottom: 16,
        }}>{aviso}</p>
      )}

      {cargando && <p style={{ color: C.textoSecundario }}>Cargando…</p>}
      {error && <p style={{ color: '#B91C1C' }}>{error}</p>}

      {!cargando && !error && lista.length === 0 && (
        <p style={{ color: C.textoSecundario, fontSize: 14 }}>
          {soloVencidas ? 'Nadie tiene semanas vencidas. Todo al corriente.' : 'Todavía no hay alumnos con calendario.'}
        </p>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {lista.map(a => (
          <div key={a.id} style={{ background: '#FFFFFF', border: `1px solid ${C.borde}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
              <button onClick={() => abrirAlumno(a.id)} aria-label="Ver calendario"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primario, display: 'flex' }}>
                {abierto === a.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              <div style={{ minWidth: 200, flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, color: C.texto, fontSize: 15 }}>{a.nombre_completo}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textoSecundario }}>
                  {a.matricula ?? 'sin matrícula'} · {a.nivel ?? '—'} · {a.semanas_total} semanas
                </p>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <p style={{ margin: 0, fontSize: 12, color: C.textoSecundario }}>Vencidas</p>
                <p style={{ margin: 0, fontWeight: 700, color: a.semanas_vencidas ? '#B91C1C' : C.texto }}>
                  {a.semanas_vencidas} · {formatoMXN(a.monto_vencido)}
                </p>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <p style={{ margin: 0, fontSize: 12, color: C.textoSecundario }}>Pagadas</p>
                <p style={{ margin: 0, fontWeight: 600, color: C.texto }}>
                  {a.semanas_pagadas}/{a.semanas_total}
                </p>
              </div>
              <a href={enlaceWhatsApp(a)} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 10, background: C.primario, color: '#FFFFFF',
                  fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}>
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>

            {abierto === a.id && (
              <div style={{ borderTop: `1px solid ${C.borde}`, padding: '14px 16px', background: '#FCFAFB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.textoSecundario }}>
                    Próxima: semana {a.proxima_semana ?? '—'} · {fechaCorta(a.proxima_fecha)}
                  </p>
                  <button
                    disabled={trabajando}
                    onClick={() => {
                      const f = window.prompt('Fecha de inicio del calendario (AAAA-MM-DD). Vacío = hoy:')
                      if (f === null) return
                      accion(a.id, { accion: 'regenerar', fecha_inicio: f.trim() || undefined },
                        'Calendario regenerado. Las semanas ya pagadas o condonadas se conservaron.')
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.borde}`,
                      background: '#FFFFFF', color: C.primario, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                    Regenerar calendario
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                    <thead>
                      <tr style={{ color: C.textoSecundario, textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Semana</th>
                        <th style={{ padding: '6px 8px' }}>Vence</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Monto</th>
                        <th style={{ padding: '6px 8px' }}>Estado</th>
                        <th style={{ padding: '6px 8px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semanas.map(s => (
                        <tr key={s.numero_semana} style={{ borderTop: `1px solid ${C.borde}` }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: C.texto }}>{s.numero_semana}</td>
                          <td style={{ padding: '8px', color: C.textoSecundario }}>{fechaCorta(s.fecha_vencimiento)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: C.texto }}>{formatoMXN(s.monto)}</td>
                          <td style={{ padding: '8px', color: s.estado === 'pagado' ? C.primario : C.texto }}>
                            {s.estado}
                            {s.condonado_motivo ? ` · ${s.condonado_motivo}` : ''}
                          </td>
                          <td style={{ padding: '8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {s.estado !== 'pagado' && (
                              <button disabled={trabajando}
                                onClick={() => {
                                  const metodo = window.prompt('Método de pago: EFECTIVO, TRANSFERENCIA, TARJETA u OTRO', 'EFECTIVO')
                                  if (!metodo) return
                                  accion(a.id, { accion: 'pagar', numero_semana: s.numero_semana, metodo_pago: metodo },
                                    `Semana ${s.numero_semana} registrada como pagada.`)
                                }}
                                style={{
                                  padding: '4px 10px', borderRadius: 8, border: 'none',
                                  background: C.primario, color: '#FFFFFF', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                Marcar pagada
                              </button>
                            )}
                            {s.estado !== 'pagado' && (
                              <button disabled={trabajando}
                                onClick={() => {
                                  const condonar = s.estado !== 'condonado'
                                  const motivo = condonar ? window.prompt('Motivo de la condonación (opcional):') ?? '' : ''
                                  accion(a.id, { accion: 'condonar', numero_semana: s.numero_semana, motivo, condonar },
                                    condonar ? `Semana ${s.numero_semana} condonada.` : `Semana ${s.numero_semana} de vuelta a pendiente.`)
                                }}
                                style={{
                                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${C.borde}`,
                                  background: '#FFFFFF', color: C.texto, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                {s.estado === 'condonado' ? 'Quitar condonación' : 'Condonar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
