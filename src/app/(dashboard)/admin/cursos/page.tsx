'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GraduationCap, Layers, FileText, Users, Plus, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/cursos/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/ui/toast'
import type { CursoListItem } from '@/types/cursos'

function EstadoBadge({ estado }: { estado: string }) {
  const publicado = estado === 'publicado'
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: publicado ? 'rgba(16,185,129,0.12)' : 'rgba(180,83,9,0.12)',
        color: publicado ? '#10B981' : '#F59E0B',
      }}
    >
      {publicado ? 'Publicado' : 'Borrador'}
    </span>
  )
}

function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'rgba(27,48,104,0.1)', color: 'var(--color-primario)' }}
    >
      {tipo === 'diplomado' ? 'Diplomado' : 'Curso'}
    </span>
  )
}

export default function AdminCursosPage() {
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToast()
  const [cursos, setCursos] = useState<CursoListItem[] | null>(null)
  // D7b: el secretario entra a asignar y abrir; crear y eliminar cursos es del admin.
  // D21b: null mientras no llega el rol (y si la carga falla): lo que es solo del
  // admin NO se pinta «por si acaso»; antes el secretario veía un instante «Nuevo curso».
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null)
  // Si la carga falla no se sabe el rol ni si hay cursos: se dice eso y se ofrece
  // reintentar, en vez de «Aún no hay cursos» con el texto de uno de los dos roles.
  const [falloCarga, setFalloCarga] = useState(false)
  const [aEliminar, setAEliminar] = useState<CursoListItem | null>(null)
  const [borrando, setBorrando] = useState(false)

  const cargar = useCallback(async () => {
    setFalloCarga(false)
    try {
      const res = await fetch('/api/admin/cursos')
      if (!res.ok) throw new Error()
      setEsAdmin(res.headers.get('x-rol-visor') !== 'SECRETARIO')
      setCursos(await res.json())
    } catch {
      setCursos([])
      setFalloCarga(true)
      showToast('No se pudieron cargar los cursos', 'error')
    }
  }, [showToast])

  useEffect(() => { cargar() }, [cargar])

  async function eliminarCurso() {
    if (!aEliminar) return
    setBorrando(true)
    try {
      const res = await fetch(`/api/admin/cursos/${aEliminar.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Error al eliminar')
      }
      showToast(`Curso "${aEliminar.nombre}" eliminado`, 'success')
      setAEliminar(null)
      await cargar()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al eliminar', 'error')
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primario)' }}>
            Cursos y Diplomados
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario, #525252)' }}>
            {esAdmin === null ? ' '
              : esAdmin ? 'Crea cursos con módulos y lecciones, y asígnalos a tus alumnos.'
              : 'Asigna cursos a tus alumnos, abre sus meses y registra sus cobros.'}
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={() => router.push('/admin/cursos/nuevo')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
          >
            <Plus className="w-4 h-4" />
            Nuevo curso
          </button>
        )}
      </div>

      {/* Estado de carga */}
      {cursos === null && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--color-superficie)', border: '1px solid #E8F0F7' }}>
          <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Cargando cursos…</p>
        </div>
      )}

      {falloCarga && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--color-superficie)', border: '1px solid #E8F0F7' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--color-texto-secundario)' }}>
            No se pudieron cargar los cursos.
          </p>
          <button
            onClick={() => { setCursos(null); void cargar() }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: '1px solid rgba(27,48,104,0.3)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Vacío */}
      {cursos !== null && cursos.length === 0 && !falloCarga && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--color-superficie)', border: '1px solid #E8F0F7' }}>
          <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-primario)', opacity: 0.4 }} />
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--color-primario)' }}>
            Aún no hay cursos
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-texto-secundario)' }}>
            {esAdmin ? 'Crea tu primer curso o diplomado para empezar.'
              : 'Cuando el administrador cree un curso, aparecerá aquí para que asignes alumnos.'}
          </p>
          {esAdmin && (
            <Link
              href="/admin/cursos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
            >
              <Plus className="w-4 h-4" />
              Nuevo curso
            </Link>
          )}
        </div>
      )}

      {/* Grid de cursos */}
      {cursos !== null && cursos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map(curso => (
            <div
              key={curso.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: 'var(--color-superficie)', border: '1px solid #E8F0F7', boxShadow: '0 2px 8px rgba(27,58,87,0.06)' }}
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
                    <GraduationCap className="w-10 h-10" style={{ color: 'rgba(245,240,232,0.5)' }} />
                  </div>
                )}
              </div>

              {/* Cuerpo */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-bold leading-snug" style={{ color: 'var(--color-primario)' }}>
                    {curso.nombre}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <TipoBadge tipo={curso.tipo} />
                  <EstadoBadge estado={curso.estado} />
                </div>

                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{curso.numModulos} {curso.numModulos === 1 ? 'módulo' : 'módulos'}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{curso.numLecciones} {curso.numLecciones === 1 ? 'lección' : 'lecciones'}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{curso.numAlumnos} {curso.numAlumnos === 1 ? 'alumno' : 'alumnos'}</span>
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  <Link
                    href={`/admin/cursos/${curso.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
                  >
                    {esAdmin ? <Pencil className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    {esAdmin ? 'Editar' : 'Alumnos'}
                  </Link>
                  {esAdmin && (
                    <button
                      onClick={() => setAEliminar(curso)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ border: '1px solid rgba(220,38,38,0.3)', color: '#EF4444', background: 'var(--color-superficie)' }}
                      aria-label={`Eliminar ${curso.nombre}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de eliminación (escribir el nombre para confirmar) */}
      <ConfirmDialog
        open={aEliminar !== null}
        danger
        title="Eliminar curso"
        message={
          <>
            Vas a eliminar <strong>{aEliminar?.nombre}</strong> con sus módulos, lecciones,
            materiales y las asignaciones de {aEliminar?.numAlumnos ?? 0} alumno(s).
            <br />Esta acción no se puede deshacer.
          </>
        }
        requireText={aEliminar?.nombre}
        confirmLabel="Eliminar definitivamente"
        busy={borrando}
        onConfirm={eliminarCurso}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  )
}
