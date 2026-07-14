'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Globe, PencilLine } from 'lucide-react'
import type { Curso } from '@/types/cursos'

interface PublicacionTabProps {
  curso: Curso
  numInscritos: number
  onChanged: (mensaje?: string) => void | Promise<void>
  onError: (mensaje: string) => void
}

export function PublicacionTab({ curso, numInscritos, onChanged, onError }: PublicacionTabProps) {
  const [cambiando, setCambiando] = useState(false)
  const publicado = curso.estado === 'publicado'

  async function toggleEstado() {
    setCambiando(true)
    try {
      const nuevo = publicado ? 'borrador' : 'publicado'
      const res = await fetch(`/api/admin/cursos/${curso.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
      })
      const json = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) throw new Error(json.error ?? 'Error al cambiar el estado')
      onChanged(nuevo === 'publicado' ? 'Curso publicado 🎉' : 'Curso pasado a borrador')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al cambiar el estado')
    } finally {
      setCambiando(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-6 max-w-2xl"
      style={{ background: '#fff', border: '1px solid #E8F0F7', boxShadow: '0 2px 8px rgba(27,58,87,0.06)' }}
    >
      <div>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-primario)' }}>Publicación</h2>
        <p className="text-sm" style={{ color: '#525252' }}>
          Tus alumnos asignados solo ven cursos <strong>publicados</strong>. Mientras el curso
          esté en borrador, puedes editarlo con calma sin que nadie lo vea.
        </p>
      </div>

      {/* Toggle de estado */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-4 py-4"
        style={{
          background: publicado ? 'rgba(16,185,129,0.06)' : 'rgba(180,83,9,0.06)',
          border: `1px solid ${publicado ? 'rgba(16,185,129,0.3)' : 'rgba(180,83,9,0.25)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          {publicado
            ? <Globe className="w-5 h-5 flex-shrink-0" style={{ color: '#059669' }} />
            : <PencilLine className="w-5 h-5 flex-shrink-0" style={{ color: '#B45309' }} />}
          <div>
            <p className="text-sm font-bold" style={{ color: publicado ? '#059669' : '#B45309' }}>
              {publicado ? 'Publicado' : 'Borrador'}
            </p>
            <p className="text-xs" style={{ color: '#525252' }}>
              {publicado
                ? `Visible para tus ${numInscritos} alumno(s) asignados.`
                : 'Oculto para los alumnos (aunque estén asignados).'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleEstado}
          disabled={cambiando}
          role="switch"
          aria-checked={publicado}
          aria-label={publicado ? 'Pasar a borrador' : 'Publicar curso'}
          className="relative flex-shrink-0 rounded-full transition-colors disabled:opacity-50"
          style={{
            width: 52, height: 28,
            background: publicado ? '#059669' : '#D1D5DB',
          }}
        >
          <span
            className="absolute top-1 rounded-full transition-all"
            style={{
              width: 20, height: 20, background: '#fff',
              left: publicado ? 28 : 4,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </button>
      </div>

      {/* Ver como alumno — abre el visor en modo vista previa de admin */}
      <div className="flex items-center gap-3">
        <Link
          href={`/cursos/${curso.id}?from=admin`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ border: '1px solid rgba(27,48,104,0.25)', color: 'var(--color-primario)', background: '#fff' }}
        >
          <Eye className="w-4 h-4" />
          Ver como alumno
        </Link>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>
          Se abre en modo vista previa{publicado ? '' : ' (incluso en borrador)'}.
        </span>
      </div>
    </div>
  )
}
