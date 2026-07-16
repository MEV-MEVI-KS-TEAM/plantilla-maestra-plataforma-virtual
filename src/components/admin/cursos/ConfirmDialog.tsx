'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** Si se define, el usuario debe escribir este texto exacto para confirmar. */
  requireText?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  danger = false, requireText, busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  if (!open) return null

  const textOk = !requireText || typed.trim() === requireText

  function handleCancel() {
    setTyped('')
    onCancel()
  }
  function handleConfirm() {
    if (!textOk || busy) return
    setTyped('')
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : handleCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#EF4444' }} />}
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-primario)' }}>{title}</h3>
          </div>
          <button onClick={handleCancel} disabled={busy} className="p-1 rounded-lg disabled:opacity-40" style={{ color: '#9CA3AF' }} aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm mb-4" style={{ color: 'var(--color-texto-secundario, #525252)' }}>
          {message}
        </div>

        {requireText && (
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-texto-secundario)' }}>
              Escribe <span className="font-bold" style={{ color: '#EF4444' }}>{requireText}</span> para confirmar:
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ border: '1px solid var(--color-borde)', color: 'var(--color-primario)' }}
              placeholder={requireText}
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--color-borde)', color: 'var(--color-texto-secundario)', background: 'var(--color-superficie)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!textOk || busy}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: danger ? '#EF4444' : 'var(--color-acento)',
              color: '#fff',
            }}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
