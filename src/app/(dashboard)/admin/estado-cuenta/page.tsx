'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Loader2, Wallet, Search, CheckCircle2 } from 'lucide-react'

interface EstadoAlumno {
  id: string
  nombre_completo: string
  email: string
  matricula: string | null
  nivel: string | null
  modalidad: string | null
  meses_desbloqueados: number
  meses_con_pago: number
  meses_sin_pago_registrado: number
  inscripcion_pagada: boolean
  fecha_ultimo_pago: string | null
}

type FiltroEstado = 'todos' | 'sin_pago_registrado' | 'al_corriente'
type Orden = 'nombre' | 'estado'

const CARD = { background: '#181C26', border: '1px solid #2A2F3E' }
const INPUT_STYLE = { background: '#0B0D11', border: '1px solid #2A2F3E', color: '#F1F5F9' }

const NIVEL_LABELS: Record<string, string> = {
  secundaria: 'Secundaria',
  preparatoria: 'Preparatoria',
  licenciatura: 'Licenciatura',
}

const MODALIDAD_LABELS: Record<string, string> = {
  '3_meses': '3 meses',
  '6_meses': '6 meses',
}

export default function EstadoCuentaPage() {
  const [alumnos, setAlumnos] = useState<EstadoAlumno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [orden, setOrden] = useState<Orden>('estado')

  useEffect(() => {
    fetch('/api/admin/estado-cuenta')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setAlumnos(data.alumnos ?? [])
      })
      .catch(() => setError('Error al cargar el estado de cuenta'))
      .finally(() => setLoading(false))
  }, [])

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let lista = alumnos
    if (q) {
      lista = lista.filter(a =>
        a.nombre_completo.toLowerCase().includes(q)
        || a.email.toLowerCase().includes(q)
        || (a.matricula ?? '').toLowerCase().includes(q)
      )
    }
    if (filtro === 'sin_pago_registrado') lista = lista.filter(a => a.meses_sin_pago_registrado > 0)
    if (filtro === 'al_corriente') lista = lista.filter(a => a.meses_sin_pago_registrado === 0)
    return [...lista].sort((a, b) =>
      orden === 'estado'
        ? b.meses_sin_pago_registrado - a.meses_sin_pago_registrado || a.nombre_completo.localeCompare(b.nombre_completo)
        : a.nombre_completo.localeCompare(b.nombre_completo)
    )
  }, [alumnos, busqueda, filtro, orden])

  const conMesesSinPago = alumnos.filter(a => a.meses_sin_pago_registrado > 0).length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-acento)' }} />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Estado de Cuenta</h2>
        <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
          Situación de pagos de los alumnos activos — meses desbloqueados vs. pagos de mensualidad registrados
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o matrícula..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={INPUT_STYLE}
            onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-acento)' }}
            onBlur={e => { e.currentTarget.style.border = '1px solid #2A2F3E' }}
          />
        </div>
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value as FiltroEstado)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={INPUT_STYLE}
        >
          <option value="todos">Todos ({alumnos.length})</option>
          <option value="sin_pago_registrado">Con meses sin pago registrado ({conMesesSinPago})</option>
          <option value="al_corriente">Al corriente ({alumnos.length - conMesesSinPago})</option>
        </select>
        <select
          value={orden}
          onChange={e => setOrden(e.target.value as Orden)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={INPUT_STYLE}
        >
          <option value="estado">Ordenar: meses sin pago primero</option>
          <option value="nombre">Ordenar: por nombre</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={CARD}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2A2F3E' }}>
          <Wallet className="w-4 h-4" style={{ color: 'var(--color-acento)' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            {filas.length} alumno{filas.length !== 1 ? 's' : ''}
          </h3>
        </div>
        {filas.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: '#94A3B8' }}>
            Sin alumnos que coincidan con el filtro
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2F3E' }}>
                  {['Alumno', 'Nivel / Modalidad', 'Meses desbloqueados', 'Meses con pago', 'Inscripción', 'Último pago', 'Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map(a => (
                  <tr
                    key={a.id}
                    style={{ borderBottom: '1px solid rgba(42,47,62,0.5)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(21,101,192,0.04)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/alumnos/${a.id}`} className="block group">
                        <span className="font-medium group-hover:underline" style={{ color: '#F1F5F9' }}>{a.nombre_completo}</span>
                        {a.matricula && (
                          <span className="block font-mono text-xs mt-0.5" style={{ color: '#64748B' }}>{a.matricula}</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>
                      {a.nivel ? (NIVEL_LABELS[a.nivel] ?? a.nivel) : '—'}
                      {a.modalidad ? ` · ${MODALIDAD_LABELS[a.modalidad] ?? a.modalidad}` : ''}
                    </td>
                    <td className="px-4 py-3 font-semibold text-center" style={{ color: '#F1F5F9' }}>{a.meses_desbloqueados}</td>
                    <td className="px-4 py-3 font-semibold text-center" style={{ color: '#F1F5F9' }}>{a.meses_con_pago}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={a.inscripcion_pagada
                          ? { background: 'rgba(16,185,129,0.15)', color: '#10B981' }
                          : { background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }
                        }
                      >
                        {a.inscripcion_pagada ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>
                      {a.fecha_ultimo_pago
                        ? new Date(`${a.fecha_ultimo_pago.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Sin pagos registrados'}
                    </td>
                    <td className="px-4 py-3">
                      {a.meses_sin_pago_registrado === 0 ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Al corriente
                        </span>
                      ) : (
                        // Informativo, no alarma: el sistema solo sabe que no hay
                        // pago capturado — no si es cortesía, omisión o error.
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
                        >
                          {a.meses_sin_pago_registrado} mes{a.meses_sin_pago_registrado !== 1 ? 'es' : ''} sin pago registrado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
