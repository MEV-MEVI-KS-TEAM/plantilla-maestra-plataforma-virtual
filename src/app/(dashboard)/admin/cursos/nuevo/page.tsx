'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { validarPortada } from '@/lib/cursos/archivos'
import { subirArchivoCursos } from '@/lib/cursos/upload'

export default function NuevoCursoPage() {
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<'curso' | 'diplomado'>('curso')
  const [portada, setPortada] = useState<File | null>(null)
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Revocar el object URL vigente al desmontar (Cancelar o navegación)
  useEffect(() => {
    return () => {
      if (portadaPreview) URL.revokeObjectURL(portadaPreview)
    }
  }, [portadaPreview])

  function onPortadaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const valid = validarPortada(file)
    if (!valid.ok) {
      showToast(valid.error, 'error')
      e.target.value = ''
      return
    }
    setPortada(file)
    setPortadaPreview(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function quitarPortada() {
    setPortada(null)
    setPortadaPreview(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      showToast('El nombre es requerido', 'error')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, tipo }),
      })
      const json = await res.json().catch(() => ({} as { id?: string; error?: string }))
      if (!res.ok || !json.id) throw new Error(json.error ?? 'Error al crear el curso')

      // Portada opcional (signed URL directo a Storage). Un fallo aquí NO debe
      // dejar al usuario en este form (reintentar duplicaría el curso): se
      // navega SIEMPRE y el editor muestra el aviso vía ?portada=fallo.
      let portadaFallo = false
      if (portada) {
        try {
          const resultado = await subirArchivoCursos(`/api/admin/cursos/${json.id}/portada`, portada)
          if (!resultado.ok) portadaFallo = true
        } catch {
          portadaFallo = true
        }
      }

      router.push(`/admin/cursos/${json.id}${portadaFallo ? '?portada=fallo' : ''}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear el curso', 'error')
      setGuardando(false)
    }
  }

  const inputStyle = { border: '1px solid #E5E7EB', color: 'var(--color-primario)', background: '#fff' }

  return (
    <div className="max-w-2xl space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div>
        <Link
          href="/admin/cursos"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-3"
          style={{ color: 'var(--color-acento)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a cursos
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primario)' }}>Nuevo curso</h1>
        <p className="text-sm mt-1" style={{ color: '#525252' }}>
          Se crea como borrador: podrás agregar módulos y lecciones antes de publicarlo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 space-y-5"
        style={{ background: '#fff', border: '1px solid #E8F0F7', boxShadow: '0 2px 8px rgba(27,58,87,0.06)' }}
      >
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-primario)' }}>
            Nombre <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            maxLength={200}
            placeholder="Ej. Diplomado en Ventas Digitales"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-primario)' }}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={4}
            placeholder="¿De qué trata este curso?"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-y"
            style={inputStyle}
          />
        </div>

        <div>
          <span className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-primario)' }}>
            Tipo <span style={{ color: '#DC2626' }}>*</span>
          </span>
          <div className="flex gap-2">
            {(['curso', 'diplomado'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className="px-4 py-2 rounded-xl text-sm font-semibold capitalize"
                style={tipo === t
                  ? { background: 'var(--color-acento)', color: '#fff', border: '1px solid var(--color-acento)' }
                  : { background: '#fff', color: '#525252', border: '1px solid #E5E7EB' }}
                aria-pressed={tipo === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-primario)' }}>
            Portada <span className="font-normal text-xs" style={{ color: '#525252' }}>(opcional · JPG/PNG/WebP · máx 5MB)</span>
          </span>
          {portadaPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', maxWidth: 420 }}>
              {/* preview local de un blob: URL.createObjectURL — <img> nativo a propósito */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portadaPreview} alt="Vista previa de la portada" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={quitarPortada}
                className="absolute top-2 right-2 p-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                aria-label="Quitar portada"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium w-full justify-center"
              style={{ border: '2px dashed #D1D5DB', color: '#525252', background: '#FAFAFA' }}
            >
              <ImagePlus className="w-4 h-4" />
              Seleccionar imagen
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPortadaChange}
            className="hidden"
            aria-label="Archivo de portada"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/admin/cursos"
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: '1px solid #E5E7EB', color: '#525252' }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-acento)', color: '#fff' }}
          >
            {guardando ? 'Creando…' : 'Crear curso'}
          </button>
        </div>
      </form>
    </div>
  )
}
