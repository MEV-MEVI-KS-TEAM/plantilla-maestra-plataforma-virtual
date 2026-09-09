'use client'

/**
 * Confirmación de las dos acciones del editor que no se pueden deshacer con
 * un clic: publicar un cambio de PRECIOS (se ve al instante en la página
 * pública, en el registro y en los montos sugeridos) y restaurar el diseño
 * original (borra todo, incluido el logo).
 *
 * No reutiliza `admin/cursos/ConfirmDialog` a propósito: aquél se pinta con
 * las variables de color de la ESCUELA (`--color-superficie`), que es
 * justamente lo que el admin está cambiando en esta pantalla; un modal que
 * cambia de color mientras se edita la paleta se lee como un error.
 */
import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BORDE, ROJO, TXT, TXT_SUAVE } from './Comunes'

export interface ModalConfirmarProps {
  abierto: boolean
  titulo: string
  mensaje: string
  etiquetaConfirmar?: string
  peligro?: boolean
  ocupado?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalConfirmar({
  abierto,
  titulo,
  mensaje,
  etiquetaConfirmar = 'Confirmar',
  peligro = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmarProps) {
  const botonRef = useRef<HTMLButtonElement>(null)

  // Foco al abrir (el teclado debe caer dentro del diálogo) y Escape para
  // salir sin ejecutar nada.
  useEffect(() => {
    if (!abierto) return
    botonRef.current?.focus()
    function alPulsar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !ocupado) onCancelar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto, ocupado, onCancelar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="absolute inset-0 bg-black/60" onClick={ocupado ? undefined : onCancelar} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: '#181C26', border: `1px solid ${BORDE}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          {peligro && <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: ROJO }} aria-hidden="true" />}
          <h3 className="text-base font-bold" style={{ color: TXT }}>{titulo}</h3>
        </div>
        <p className="text-sm leading-relaxed mb-5" style={{ color: TXT_SUAVE }}>{mensaje}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ border: `1px solid ${BORDE}`, color: TXT_SUAVE }}
          >
            Cancelar
          </button>
          <button
            ref={botonRef}
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              peligro
                ? { background: ROJO, color: '#FFFFFF' }
                : { background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }
            }
          >
            {ocupado ? 'Procesando…' : etiquetaConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
