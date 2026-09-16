'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, ShieldAlert, Search, Loader2 } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * Página PÚBLICA de validación de constancias (TICKET-2026-09-16-11).
 *
 * Quien la usa no es el alumno: es un tercero con el papel delante —una empresa
 * que contrata, otra escuela— que teclea el folio impreso y confirma que el
 * documento salió de esta institución.
 *
 * 🛑 Muestra SOLO nombre, programa, fecha y el sí/no. Nada de correo, teléfono,
 * matrícula ni calificaciones: es una página abierta a internet.
 */

type Resultado =
  | { valida: true; folio: string; alumno: string; programa: string; fecha_emision: string; institucion: string }
  | { valida: false; folio: string }

export default function ValidarPage() {
  const [folio, setFolio] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [buscando, setBuscando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor = folio.trim()
    if (!valor) return

    setBuscando(true)
    setResultado(null)
    try {
      const res = await fetch(`/api/validar/${encodeURIComponent(valor)}`)
      setResultado(await res.json())
    } catch {
      setResultado({ valida: false, folio: valor })
    } finally {
      setBuscando(false)
    }
  }

  function fecha(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: '#F8FAFC' }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          {CONFIG.logo && (
            <Image
              src={CONFIG.logo} alt={CONFIG.nombre}
              width={140} height={60}
              className="mb-4 h-auto w-auto" style={{ maxHeight: 64 }}
              priority
            />
          )}
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            Validación de constancias
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#64748B' }}>
            Captura el folio impreso en el documento para comprobar que fue
            emitido por {CONFIG.nombre}.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
        >
          <label htmlFor="folio" className="mb-2 block text-xs font-semibold" style={{ color: '#64748B' }}>
            Folio del documento
          </label>
          <div className="flex gap-2">
            <input
              id="folio" value={folio}
              onChange={e => setFolio(e.target.value.toUpperCase())}
              placeholder={`${(CONFIG.prefijoMatricula ?? 'MEV').toUpperCase()}-2026-000000`}
              className="flex-1 rounded-lg px-3 py-2.5 text-sm tracking-wide"
              style={{ border: '1px solid #CBD5E1', color: '#0F172A' }}
              autoComplete="off" spellCheck={false}
            />
            <button
              type="submit" disabled={buscando || !folio.trim()}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--color-primario, #1E3A8A)' }}
            >
              {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {buscando ? 'Buscando…' : 'Validar'}
            </button>
          </div>
        </form>

        {resultado && (
          <div
            className="mt-5 rounded-2xl p-6"
            style={
              resultado.valida
                ? { background: '#F0FDF4', border: '1px solid #86EFAC' }
                : { background: '#FEF2F2', border: '1px solid #FCA5A5' }
            }
          >
            {resultado.valida ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={22} style={{ color: '#15803D' }} />
                  <span className="font-bold" style={{ color: '#15803D' }}>
                    Documento válido
                  </span>
                </div>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold" style={{ color: '#64748B' }}>Alumno</dt>
                    <dd style={{ color: '#0F172A' }}>{resultado.alumno}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold" style={{ color: '#64748B' }}>Programa cursado</dt>
                    <dd style={{ color: '#0F172A' }}>{resultado.programa}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold" style={{ color: '#64748B' }}>Fecha de emisión</dt>
                    <dd style={{ color: '#0F172A' }}>{fecha(resultado.fecha_emision)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold" style={{ color: '#64748B' }}>Folio</dt>
                    <dd className="tracking-wide" style={{ color: '#0F172A' }}>{resultado.folio}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <ShieldAlert size={22} className="mt-0.5 flex-shrink-0" style={{ color: '#B91C1C' }} />
                <div>
                  <p className="font-bold" style={{ color: '#B91C1C' }}>No encontramos ese folio</p>
                  <p className="mt-1 text-sm" style={{ color: '#7F1D1D' }}>
                    Revisa que esté capturado tal como aparece en el documento.
                    Si el folio es correcto y sigue sin aparecer, comunícate con
                    la institución.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs" style={{ color: '#94A3B8' }}>
          {CONFIG.nombre}
        </p>
      </div>
    </main>
  )
}
