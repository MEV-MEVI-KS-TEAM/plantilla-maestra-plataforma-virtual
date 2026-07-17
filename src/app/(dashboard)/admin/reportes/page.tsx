'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, DollarSign, TrendingUp, BarChart3, Loader2, BookOpen, Award } from 'lucide-react'

interface Stats {
  total_alumnos: number
  alumnos_activos: number
  total_ingresos: number
  promedio_meses: number
}

interface RendimientoMateria {
  materia_id: string
  codigo: string
  nombre: string
  total_cursaron: number
  aprobados: number
  reprobados: number
  porcentaje_aprobacion: number
}

interface PagoReciente {
  alumno: string
  monto: number
  concepto?: string
  metodo_pago: string
  referencia?: string | null
  fecha_pago: string
}

const CONCEPTO_LABELS: Record<string, string> = {
  inscripcion: 'Inscripción',
  mensualidad: 'Mensualidad',
  otro:        'Otro',
}

interface IngresoSemana {
  semana_inicio: string // fecha del lunes (YYYY-MM-DD)
  total: number
}

interface IngresoMes {
  mes: string // YYYY-MM
  total: number
}

const fmtSemana = (iso: string) => {
  // iso es un date puro (YYYY-MM-DD); anclar a mediodía evita el corrimiento de TZ
  const d = new Date(`${iso}T12:00:00`)
  return `Sem del ${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
}

const fmtMes = (yyyymm: string) => {
  const d = new Date(`${yyyymm}-15T12:00:00`)
  const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Tabla de barras simple (sin librería de charts — no hay ninguna en el proyecto)
function TablaBarras({ titulo, icono: Icono, filas }: {
  titulo: string
  icono: React.ElementType
  filas: { etiqueta: string; total: number; actual?: boolean }[]
}) {
  const max = Math.max(...filas.map(f => f.total), 1)
  return (
    <div className="rounded-xl overflow-hidden" style={CARD}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2A2F3E' }}>
        <Icono className="w-4 h-4" style={{ color: '#10B981' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{titulo}</h3>
      </div>
      {filas.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm" style={{ color: '#94A3B8' }}>
          Sin datos (aplica la migración 20260716150000_reporte_ingresos.sql)
        </div>
      ) : (
        <div className="p-5 space-y-2.5">
          {filas.map(f => (
            <div key={f.etiqueta} className="flex items-center gap-3">
              <span className="w-36 flex-shrink-0 text-xs" style={{ color: f.actual ? '#F1F5F9' : '#94A3B8', fontWeight: f.actual ? 600 : 400 }}>
                {f.etiqueta}{f.actual ? ' •' : ''}
              </span>
              <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: '#0B0D11' }}>
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${Math.max((f.total / max) * 100, f.total > 0 ? 2 : 0)}%`, background: f.actual ? '#10B981' : 'rgba(16,185,129,0.45)' }}
                />
              </div>
              <span className="w-28 flex-shrink-0 text-right text-xs font-semibold" style={{ color: f.total > 0 ? '#10B981' : '#475569' }}>
                {fmt(f.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CARD = { background: '#181C26', border: '1px solid #2A2F3E' }

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

export default function ReportesPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ingresosMes, setIngresosMes] = useState(0)
  const [rendimiento, setRendimiento] = useState<RendimientoMateria[]>([])
  const [pagos, setPagos] = useState<PagoReciente[]>([])
  const [ingresosSemanas, setIngresosSemanas] = useState<IngresoSemana[]>([])
  const [ingresosMeses, setIngresosMeses] = useState<IngresoMes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/reportes')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setStats(data.stats)
        setIngresosMes(data.ingresos_mes_actual ?? 0)
        setRendimiento(data.rendimiento_materias ?? [])
        setPagos(data.ultimos_pagos ?? data.pagos_recientes ?? [])
        setIngresosSemanas(data.ingresos_ultimas_8_semanas ?? [])
        setIngresosMeses(data.ingresos_ultimos_6_meses ?? [])
      })
      .catch(() => setError('Error al cargar reportes'))
      .finally(() => setLoading(false))
  }, [])

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

  const statCards = [
    { label: 'Total Alumnos', value: String(stats?.total_alumnos ?? 0), icon: Users, color: 'var(--color-acento)', bg: 'rgba(21,101,192,0.15)' },
    { label: 'Alumnos Activos', value: String(stats?.alumnos_activos ?? 0), icon: UserCheck, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Ingresos del Mes', value: fmt(ingresosMes), icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Ingresos Totales', value: fmt(stats?.total_ingresos ?? 0), icon: DollarSign, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Promedio Meses', value: String(stats?.promedio_meses ?? 0), icon: TrendingUp, color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reportes y Estadísticas</h2>
        <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Resumen general de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-5 flex items-center gap-4" style={CARD}>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold truncate" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tendencia de ingresos — semana / mes (Fase 4, admin-only como toda esta página) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablaBarras
          titulo="Ingresos — últimas 8 semanas"
          icono={TrendingUp}
          filas={ingresosSemanas.map((s, i) => ({
            etiqueta: fmtSemana(s.semana_inicio),
            total: s.total,
            actual: i === ingresosSemanas.length - 1,
          }))}
        />
        <TablaBarras
          titulo="Ingresos — últimos 6 meses"
          icono={BarChart3}
          filas={ingresosMeses.map((m, i) => ({
            etiqueta: fmtMes(m.mes),
            total: m.total,
            actual: i === ingresosMeses.length - 1,
          }))}
        />
      </div>

      {/* Rendimiento por materia */}
      <div className="rounded-xl overflow-hidden" style={CARD}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2A2F3E' }}>
          <BookOpen className="w-4 h-4" style={{ color: 'var(--color-acento)' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Rendimiento por Materia</h3>
        </div>
        {rendimiento.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: '#94A3B8' }}>
            Sin datos de calificaciones registradas aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2F3E' }}>
                  {['Código', 'Materia', 'Cursaron', 'Aprobados', 'Reprobados', '% Aprobación'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rendimiento.map(r => (
                  <tr
                    key={r.materia_id}
                    style={{ borderBottom: '1px solid rgba(42,47,62,0.5)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(21,101,192,0.04)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-acento)' }}>{r.codigo}</td>
                    <td className="px-4 py-3 font-medium max-w-xs" style={{ color: '#F1F5F9' }}>
                      <span className="block truncate">{r.nombre}</span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#F1F5F9' }}>{r.total_cursaron}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#10B981' }}>{r.aprobados}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#EF4444' }}>{r.reprobados}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[80px]" style={{ background: '#2A2F3E' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${r.porcentaje_aprobacion}%`,
                              background: r.porcentaje_aprobacion >= 60 ? '#10B981' : '#EF4444',
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold" style={{
                          color: r.porcentaje_aprobacion >= 60 ? '#10B981' : '#EF4444'
                        }}>
                          {r.porcentaje_aprobacion}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de ingresos */}
      <div className="rounded-xl overflow-hidden" style={CARD}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2A2F3E' }}>
          <Award className="w-4 h-4" style={{ color: '#F59E0B' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Historial de Ingresos Recientes</h3>
        </div>
        {pagos.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: '#94A3B8' }}>
            Sin pagos registrados aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2F3E' }}>
                  {['Fecha', 'Alumno', 'Concepto', 'Monto', 'Método', 'Referencia'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagos.map((p, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid rgba(42,47,62,0.5)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(21,101,192,0.04)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td className="px-4 py-3" style={{ color: '#94A3B8' }}>
                      {new Date(`${p.fecha_pago}T12:00:00`).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#F1F5F9' }}>{p.alumno}</td>
                    <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{p.concepto ? (CONCEPTO_LABELS[p.concepto] ?? p.concepto) : '—'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#10B981' }}>{fmt(Number(p.monto))}</td>
                    <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{p.metodo_pago}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#64748B' }}>{p.referencia ?? '—'}</td>
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
