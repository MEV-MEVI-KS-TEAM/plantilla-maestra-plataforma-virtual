'use client'

import { useState } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'

/**
 * Modal de edición de los datos del alumno.
 *
 * Hasta ahora el panel solo tenía acciones de un campo, así que un dato mal
 * capturado en el alta se quedaba mal para siempre (TICKET-2026-09-16-10).
 *
 * Vive en su propio archivo a propósito: la ficha del alumno ya pasa de 2 000
 * líneas y meterle otro formulario la vuelve intocable.
 *
 * 🛑 El correo es la LLAVE DE ACCESO del alumno, no un dato de contacto. Por eso
 * la advertencia es visible en el formulario y no letra chica: quien lo cambie
 * tiene que saber que a partir de ese momento el alumno entra con el nuevo.
 */

export interface DatosEditables {
  nombre: string
  apellidos: string
  email: string
  telefono: string
}

interface Props {
  alumnoId: string
  inicial: DatosEditables
  /** Se llama tras guardar bien, para que la ficha recargue. */
  onGuardado: (mensaje: string) => void
  onCerrar: () => void
}

export function EditarDatosAlumno({ alumnoId, inicial, onGuardado, onCerrar }: Props) {
  const [form, setForm] = useState<DatosEditables>(inicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiaCorreo =
    form.email.trim().toLowerCase() !== (inicial.email ?? '').trim().toLowerCase()

  function set<K extends keyof DatosEditables>(campo: K, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.nombre.trim()) {
      setError('El nombre no puede quedar vacío.')
      return
    }

    setGuardando(true)
    try {
      // Solo se mandan los campos que CAMBIARON: así un PATCH no pisa con
      // cadena vacía un dato que el admin ni tocó.
      const cuerpo: Record<string, string> = {}
      for (const campo of ['nombre', 'apellidos', 'email', 'telefono'] as const) {
        if (form[campo] !== inicial[campo]) cuerpo[campo] = form[campo].trim()
      }

      if (Object.keys(cuerpo).length === 0) {
        onCerrar()
        return
      }

      const res = await fetch(`/api/admin/alumnos/${alumnoId}/datos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'No se pudieron guardar los cambios.')
        return
      }

      onGuardado(
        json.email_de_acceso_actualizado
          ? 'Datos actualizados. El alumno ahora entra con el correo nuevo.'
          : 'Datos actualizados.',
      )
    } catch {
      setError('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const campo = 'w-full rounded-lg border px-3 py-2 text-sm'
  const estiloCampo: React.CSSProperties = {
    borderColor: 'var(--color-borde, #E2E8F0)',
    background: 'var(--color-fondo, #FFFFFF)',
    color: 'var(--color-texto, #0F172A)',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--color-fondo, #FFFFFF)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-primario)' }}>
            Editar datos del alumno
          </h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} style={{ color: '#94A3B8' }} />
          </button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#64748B' }}>
              Nombre
            </label>
            <input
              className={campo} style={estiloCampo} value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#64748B' }}>
              Apellidos
            </label>
            <input
              className={campo} style={estiloCampo} value={form.apellidos}
              onChange={e => set('apellidos', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#64748B' }}>
              Teléfono
            </label>
            <input
              className={campo} style={estiloCampo} value={form.telefono}
              onChange={e => set('telefono', e.target.value)}
              inputMode="tel"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#64748B' }}>
              Correo (con este entra a la plataforma)
            </label>
            <input
              className={campo} style={estiloCampo} value={form.email} type="email"
              onChange={e => set('email', e.target.value)}
            />
          </div>

          {cambiaCorreo && (
            <div
              className="flex gap-2 rounded-lg p-3 text-xs"
              style={{ background: 'rgba(234,179,8,0.12)', color: '#854D0E' }}
            >
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Estás cambiando el correo de acceso. A partir de que guardes, el alumno
                tendrá que entrar con <strong>{form.email.trim() || '—'}</strong>. Avísale.
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-lg p-3 text-xs" style={{ background: 'rgba(239,68,68,0.10)', color: '#B91C1C' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ color: '#64748B' }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={guardando}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--color-primario)' }}
            >
              <Save size={16} />
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
