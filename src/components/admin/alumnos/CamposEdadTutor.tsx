'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  EDAD_MAYORIA,
  PARENTESCOS_TUTOR,
  edadEnAnios,
  fechaValida,
  hoyEnMexico,
  revisarEdadTutor,
} from '@/lib/registro-reglas'

/**
 * Fecha de nacimiento y datos del tutor, en la ficha del alumno. Solo existen en un
 * combo con Primaria, para Primaria y Secundaria: quien los usa lo pregunta antes con
 * `pideEdadYTutor`. La regla es la misma del registro (`revisarEdadTutor`).
 */

export interface ValoresEdadTutor {
  fecha_nacimiento: string
  tutor_nombre: string
  tutor_telefono: string
  tutor_parentesco: string
}

/** Lo guardado, en la forma de los campos: un dato sin capturar es cadena vacía. */
export function valoresEdadTutor(a: {
  fecha_nacimiento?: string | null
  tutor_nombre?: string | null
  tutor_telefono?: string | null
  tutor_parentesco?: string | null
}): ValoresEdadTutor {
  return {
    fecha_nacimiento: a.fecha_nacimiento ?? '',
    tutor_nombre: a.tutor_nombre ?? '',
    tutor_telefono: a.tutor_telefono ?? '',
    tutor_parentesco: a.tutor_parentesco ?? '',
  }
}

const ETIQUETA = { color: '#94A3B8' }
const CLASE_CAMPO = 'w-full px-3 py-2.5 rounded-lg text-sm outline-none'

export function CamposEdadTutor({ valores, onCambio, inputStyle }: {
  valores: ValoresEdadTutor
  onCambio: (campo: keyof ValoresEdadTutor, valor: string) => void
  inputStyle: CSSProperties
}) {
  const fecha = fechaValida(valores.fecha_nacimiento)
  const esMenor = fecha !== null && edadEnAnios(fecha) < EDAD_MAYORIA
  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" style={ETIQUETA}>Fecha de nacimiento</label>
        <input type="date" required value={valores.fecha_nacimiento} max={hoyEnMexico()}
          onChange={e => onCambio('fecha_nacimiento', e.target.value)}
          className={CLASE_CAMPO} style={inputStyle} />
      </div>
      {esMenor && (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={ETIQUETA}>Nombre de la madre, padre o tutor</label>
            <input type="text" required maxLength={160} value={valores.tutor_nombre}
              onChange={e => onCambio('tutor_nombre', e.target.value)}
              className={CLASE_CAMPO} style={inputStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={ETIQUETA}>Teléfono del tutor</label>
            <input type="tel" required maxLength={15} placeholder="10 dígitos" value={valores.tutor_telefono}
              onChange={e => onCambio('tutor_telefono', e.target.value)}
              className={CLASE_CAMPO} style={inputStyle} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={ETIQUETA}>Parentesco</label>
            <select required value={valores.tutor_parentesco}
              onChange={e => onCambio('tutor_parentesco', e.target.value)}
              className={CLASE_CAMPO} style={inputStyle}>
              <option value="">Selecciona...</option>
              {PARENTESCOS_TUTOR.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </>
      )}
    </>
  )
}

/** El modal de la ficha: corrige fecha y tutor de un alumno ya inscrito. */
export function EditarEdadTutor({ alumnoId, nivel, inicial, cardStyle, inputStyle, onGuardado, onCerrar }: {
  alumnoId: string
  nivel: string | null
  inicial: ValoresEdadTutor
  cardStyle: CSSProperties
  inputStyle: CSSProperties
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [valores, setValores] = useState(inicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const revision = revisarEdadTutor(valores, nivel)
    if (!revision.ok) { setError(revision.error); return }
    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/alumnos/${alumnoId}/datos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revision.datos),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'No se pudieron guardar los cambios.'); return }
      onGuardado()
    } catch {
      setError('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl" style={cardStyle}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-100">Fecha de nacimiento y tutor</h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={guardar} className="space-y-4">
          <CamposEdadTutor valores={valores} inputStyle={inputStyle}
            onCambio={(campo, valor) => setValores(prev => ({ ...prev, [campo]: valor }))} />
          {error && (
            <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCerrar} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid #2A2F3E' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}>
              {guardando ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
