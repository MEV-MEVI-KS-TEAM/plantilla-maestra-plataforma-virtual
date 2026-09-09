'use client'

/**
 * Pestaña "Cuenta": cambiar la contraseña del admin.
 *
 * Es el ÚNICO bloque de la vieja pantalla de "Configuración" que hacía algo
 * (el resto era solo lectura). Se movió aquí tal cual — mismo endpoint, mismas
 * validaciones, mismos estilos — porque el editor ocupa esa ruta y esa entrada
 * del menú: si no viajara, la función desaparecería del panel sin que nadie lo
 * notara hasta que un admin necesitara cambiar su contraseña.
 *
 * Cambia la contraseña de LA CUENTA con la que se inició sesión, nunca la de
 * otro usuario.
 *
 * Y SOLO SI ES ADMIN. /api/admin/cambiar-password pasa por `verifyAdmin`, así
 * que al SECRETARIO —que entra al editor en solo lectura— el formulario le
 * devolvería un 403 después de teclear tres contraseñas. Se deshabilita con el
 * mismo `puedeEditar` que el resto del editor y se dice por qué.
 */
import { useState } from 'react'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { BORDE, INPUT_STYLE, TXT, TXT_SUAVE, TXT_TENUE } from './Comunes'

export interface PestanaCuentaProps {
  /** `false` = la sesión no es ADMIN: el endpoint responde 403. */
  puedeEditar: boolean
  onMensaje: (texto: string, tipo: 'success' | 'error') => void
}

export function PestanaCuenta({ puedeEditar, onMensaje }: PestanaCuentaProps) {
  const [passForm, setPassForm] = useState({ current: '', nueva: '', confirmar: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeEditar) return
    setPassError(null)

    if (passForm.nueva.length < 8) {
      setPassError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (passForm.nueva !== passForm.confirmar) {
      setPassError('Las contraseñas no coinciden.')
      return
    }
    if (passForm.nueva === passForm.current) {
      setPassError('La nueva contraseña debe ser distinta de la actual.')
      return
    }

    setPassLoading(true)
    try {
      const res = await fetch('/api/admin/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.nueva }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPassError(data.error ?? 'Error al cambiar contraseña.')
        return
      }
      setPassForm({ current: '', nueva: '', confirmar: '' })
      onMensaje('Contraseña actualizada correctamente', 'success')
    } catch {
      setPassError('Ocurrió un error inesperado.')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden max-w-xl" style={{ background: '#181C26', border: `1px solid ${BORDE}` }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${BORDE}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Lock className="w-4 h-4" style={{ color: '#F59E0B' }} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: TXT }}>Cambiar Contraseña</h3>
      </div>
      <div className="p-5">
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          {[
            { label: 'Contraseña actual',           key: 'current',   show: showCurrent,   toggle: () => setShowCurrent(v => !v) },
            { label: 'Nueva contraseña',            key: 'nueva',     show: showNueva,     toggle: () => setShowNueva(v => !v) },
            { label: 'Confirmar nueva contraseña',  key: 'confirmar', show: showConfirmar, toggle: () => setShowConfirmar(v => !v) },
          ].map(({ label, key, show, toggle }) => (
            <div key={key} className="space-y-1.5">
              <label htmlFor={`pass-${key}`} className="block text-sm font-medium" style={{ color: TXT_SUAVE }}>{label}</label>
              <div className="relative">
                <input
                  id={`pass-${key}`}
                  type={show ? 'text' : 'password'}
                  required
                  disabled={!puedeEditar}
                  placeholder="••••••••"
                  value={passForm[key as keyof typeof passForm]}
                  onChange={e => setPassForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-4 pr-11 py-3 rounded-lg text-sm outline-none transition-all disabled:cursor-not-allowed"
                  style={{ ...INPUT_STYLE, ...(puedeEditar ? {} : { opacity: 0.6 }) }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1px solid rgba(21,101,192,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21,101,192,0.1)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={toggle}
                  disabled={!puedeEditar}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#64748B' }}
                  aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs" style={{ color: TXT_TENUE }}>
            {puedeEditar
              ? 'Mínimo 8 caracteres. Esta es la cuenta que administra toda la escuela: usa una contraseña que no uses en otro sitio.'
              : 'Solo el administrador puede cambiar su contraseña desde aquí.'}
          </p>

          {passError && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
            >
              <span className="mt-px">⚠</span>
              <span>{passError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={passLoading || !puedeEditar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
          >
            {passLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cambiando...</> : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
