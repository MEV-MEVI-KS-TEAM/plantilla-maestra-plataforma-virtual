'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, BookOpen, Lock, Clock, ChevronRight, LayoutGrid } from 'lucide-react'

interface MateriaCard {
  id:            string
  nombre:        string
  descripcion:   string | null
  icono:         string
  color:         string
  orden:         number
  total_meses:   number
  total_semanas: number
  disponible:    boolean
}

interface ApiResponse {
  materias:            MateriaCard[]
  meses_desbloqueados: number
  nivel:               string
}

export default function MateriasPage() {
  const router  = useRouter()
  const [data,    setData]    = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/alumno/materias')
      .then(r => r.json())
      .then((json: ApiResponse) => setData(json))
      .catch(() => setError('Error al cargar las materias'))
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

  const materias = data?.materias ?? []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-primario)' }}>Mis Materias</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            {data?.nivel === 'preparatoria' ? 'Preparatoria' : data?.nivel === 'secundaria' ? 'Secundaria' : data?.nivel === 'diplomado' ? 'Curso' : 'Plan de estudios'}
            {data?.nivel !== 'diplomado' && (<>
              {' · '}Meses desbloqueados:{' '}
              <span className="font-semibold" style={{ color: 'var(--color-primario)' }}>{data?.meses_desbloqueados ?? 0}</span>
            </>)}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(21,101,192,0.1)', color: 'var(--color-acento)' }}>
          <LayoutGrid className="w-3.5 h-3.5" />
          {materias.length} {materias.length === 1 ? 'materia' : 'materias'}
        </div>
      </div>

      {/* Alumno solo-curso: su curso NO es una materia. Sin este aviso veía
          solo la Tutoría y concluía que su curso estaba cerrado
          (TICKET-2026-10-15-07). */}
      {data?.nivel === 'diplomado' && (
        <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: '#fff', border: '1.5px solid var(--color-acento)' }}>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: 'var(--color-primario)' }}>🎓 Tu curso está en «Cursos y Diplomados»</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-texto-secundario)' }}>
              Aquí solo aparece la Tutoría de ingreso. Los módulos, lecciones y el examen de tu curso están en su propia sección.
            </p>
          </div>
          <button type="button" onClick={() => router.push('/alumno/cursos')}
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}>
            Ir a mi curso <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sin materias */}
      {materias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
          <BookOpen className="w-10 h-10" style={{ color: '#CBD5E1' }} />
          <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>No hay materias disponibles</p>
          <p className="text-xs" style={{ color: '#CBD5E1' }}>
            Aún no se han asignado materias a tu nivel. Contacta a tu administrador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map(mat => (
            <MateriaCard
              key={mat.id}
              materia={mat}
              onClick={() => mat.disponible && router.push(`/alumno/materia/${mat.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Card individual ──────────────────────────────────────────────────────────
function MateriaCard({
  materia,
  onClick,
}: {
  materia:  MateriaCard
  onClick:  () => void
}) {
  const [hovered, setHovered] = useState(false)

  const accent      = materia.color || 'var(--color-acento)'
  const isAvailable = materia.disponible

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background:  '#fff',
        border:      `1px solid ${hovered && isAvailable ? accent : '#E2E8F0'}`,
        cursor:      isAvailable ? 'pointer' : 'default',
        boxShadow:   hovered && isAvailable
          ? `0 8px 24px ${accent}25`
          : '0 1px 4px rgba(0,0,0,0.06)',
        transform:   hovered && isAvailable ? 'translateY(-2px)' : 'none',
        opacity:     isAvailable ? 1 : 0.7,
      }}
    >
      {/* Barra de color superior */}
      <div style={{ height: 5, background: accent }} />

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Icono + badge estado */}
        <div className="flex items-start justify-between">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl text-2xl select-none"
            style={{ background: `${accent}18` }}>
            {materia.icono}
          </div>
          {isAvailable ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(100,116,139,0.1)', color: '#94A3B8' }}>
              <Lock className="w-3 h-3" />
              Bloqueada
            </span>
          )}
        </div>

        {/* Nombre */}
        <div className="flex-1">
          <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--color-primario)' }}>
            {materia.nombre}
          </h3>
          {materia.descripcion && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#64748B' }}>
              {materia.descripcion}
            </p>
          )}
        </div>

        {/* Métricas */}
        <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#94A3B8' }}>
            <BookOpen className="w-3.5 h-3.5" />
            <span>{materia.total_meses} {materia.total_meses === 1 ? 'mes' : 'meses'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#94A3B8' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>{materia.total_semanas} semanas</span>
          </div>
          {isAvailable && (
            <div className="ml-auto flex items-center gap-0.5 text-xs font-semibold"
              style={{ color: accent }}>
              Estudiar
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
