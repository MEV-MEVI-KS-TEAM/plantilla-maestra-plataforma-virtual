'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GraduationCap, Loader2, BookOpen } from 'lucide-react'
import { ProgressBar } from '@/components/cursos/ProgressBar'
import type { CursoCatalogoItem } from '@/types/cursos-alumno'

function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: 'rgba(27,48,104,0.1)', color: 'var(--color-primario)' }}
    >
      {tipo === 'diplomado' ? 'Diplomado' : 'Curso'}
    </span>
  )
}

export default function MisCursosPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<CursoCatalogoItem[] | null>(null)
  const [error, setError] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/alumno/cursos')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => { if (!cancelled) setCursos(Array.isArray(json) ? json : []) })
      .catch(() => { if (!cancelled) { setCursos([]); setError(true) } })
    return () => { cancelled = true }
  }, [])

  // Aviso cuando el visor redirige aquí por falta de acceso (?aviso=sin-acceso)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('aviso') === 'sin-acceso') {
      setAviso('Ese curso no está disponible para ti (aún no está publicado o no lo tienes asignado).')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  if (cursos === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-acento)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-primario)' }}>
          Mis Cursos y Diplomados
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
          Continúa donde lo dejaste.
        </p>
      </div>

      {aviso && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(180,83,9,0.25)', color: '#B45309' }}
        >
          {aviso}
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: '#EF4444' }}>No se pudieron cargar tus cursos. Intenta recargar.</p>
      )}

      {/* Estado vacío */}
      {!error && cursos.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl text-center px-6"
          style={{ background: '#fff', border: '1px solid #E2E8F0' }}
        >
          <GraduationCap className="w-10 h-10" style={{ color: '#CBD5E1' }} />
          <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Aún no tienes cursos asignados</p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            Cuando tu institución te asigne un curso o diplomado, aparecerá aquí.
          </p>
        </div>
      )}

      {/* Grid de cursos */}
      {cursos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map(curso => (
            <button
              key={curso.id}
              onClick={() => router.push(`/cursos/${curso.id}`)}
              className="text-left rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#fff', border: '1px solid #E8F0F7', boxShadow: '0 1px 4px rgba(27,58,87,0.06)' }}
            >
              {/* Portada */}
              <div className="relative w-full" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, var(--color-primario) 0%, color-mix(in srgb, var(--color-primario) 78%, #000) 100%)' }}>
                {curso.portadaUrl ? (
                  <Image
                    src={curso.portadaUrl}
                    alt={`Portada de ${curso.nombre}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="w-9 h-9" style={{ color: 'rgba(245,240,232,0.5)' }} />
                  </div>
                )}
                {curso.porcentaje >= 100 && (
                  <span
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#10B981', color: '#fff' }}
                  >
                    Completado
                  </span>
                )}
              </div>

              {/* Cuerpo */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <TipoBadge tipo={curso.tipo} />
                <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--color-primario)' }}>
                  {curso.nombre}
                </h3>
                {curso.descripcion && (
                  <p className="text-xs line-clamp-2" style={{ color: '#64748B' }}>
                    {curso.descripcion}
                  </p>
                )}

                <div className="mt-auto pt-3 space-y-1.5">
                  <ProgressBar porcentaje={curso.porcentaje} size="sm" />
                  <p className="flex items-center gap-1 text-[11px]" style={{ color: '#94A3B8' }}>
                    <BookOpen className="w-3 h-3" />
                    {curso.completadas}/{curso.totalLecciones} lecciones
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
