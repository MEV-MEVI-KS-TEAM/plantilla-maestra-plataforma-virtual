'use client'

/**
 * Pestaña «Datos de pago» (pedido de un cliente, #295): banco, titular, CLABE, tarjeta y
 * cuenta para que el alumno pague por transferencia o depósito. Se ven SOLO en
 * /alumno/pagar, con sesión.
 *
 * 🛑 Se guardan APARTE de «Publicar cambios»: viven en la tabla `datos_pago`
 * (solo servidor), nunca en el JSON de site_config, que es público. Por eso esta
 * pestaña tiene su propio botón y no toca el borrador del editor.
 */
import { useEffect, useState } from 'react'
import { Landmark, Loader2 } from 'lucide-react'
import {
  DATOS_PAGO_VACIOS, clabeValida, soloDigitos, tarjetaValida, type DatosPago,
} from '@/lib/datos-pago-core'
import { BORDE, INPUT_STYLE, TXT, TXT_SUAVE, TXT_TENUE } from './Comunes'

export interface PestanaDatosPagoProps {
  puedeEditar: boolean
  onMensaje: (texto: string, tipo: 'success' | 'error') => void
}

const CAMPOS: ReadonlyArray<{ clave: keyof Omit<DatosPago, 'activo'>; etiqueta: string; ayuda?: string; numerico?: boolean }> = [
  { clave: 'banco', etiqueta: 'Banco' },
  { clave: 'titular', etiqueta: 'Titular de la cuenta', ayuda: 'Vacío = no se muestra.' },
  { clave: 'clabe', etiqueta: 'CLABE interbancaria (18 dígitos)', numerico: true },
  { clave: 'tarjeta', etiqueta: 'Tarjeta para depósito en ventanilla u OXXO (16 dígitos)', numerico: true },
  { clave: 'cuenta', etiqueta: 'Número de cuenta', ayuda: 'Vacío = no se muestra.', numerico: true },
  { clave: 'nota', etiqueta: 'Nota para el alumno' },
]

export function PestanaDatosPago({ puedeEditar, onMensaje }: PestanaDatosPagoProps) {
  const [datos, setDatos] = useState<DatosPago>(DATOS_PAGO_VACIOS)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/configuracion/datos-pago', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: DatosPago | null) => { if (d) setDatos({ ...DATOS_PAGO_VACIOS, ...d }) })
      .catch(() => setError('No se pudieron leer los datos de pago.'))
      .finally(() => setCargando(false))
  }, [])

  // Avisos en vivo (el servidor vuelve a validar al guardar).
  const avisos: string[] = []
  const clabe = soloDigitos(datos.clabe)
  const tarjeta = soloDigitos(datos.tarjeta)
  if (clabe && !clabeValida(clabe)) avisos.push('La CLABE no es válida (18 dígitos con su dígito verificador).')
  if (tarjeta && !tarjetaValida(tarjeta)) avisos.push('La tarjeta no es válida (16 dígitos).')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeEditar) return
    setError(null)
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/configuracion/datos-pago', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'No se pudieron guardar.'); return }
      setDatos({ ...DATOS_PAGO_VACIOS, ...d })
      onMensaje('Datos de pago guardados', 'success')
    } catch {
      setError('Ocurrió un error inesperado.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden max-w-xl" style={{ background: '#181C26', border: `1px solid ${BORDE}` }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${BORDE}` }}>
        <Landmark className="w-4 h-4" style={{ color: TXT_SUAVE }} aria-hidden="true" />
        <h3 className="text-sm font-semibold" style={{ color: TXT }}>Datos de pago</h3>
      </div>
      <form onSubmit={guardar} className="p-5 space-y-4">
        <p className="text-xs" style={{ color: TXT_TENUE }}>
          Se muestran solo a tus alumnos con sesión, en «Pagos». Nunca en tu página pública. Se guardan con su propio botón.
        </p>
        {cargando ? (
          <p className="text-sm" style={{ color: TXT_SUAVE }}>Cargando…</p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm" style={{ color: TXT }}>
              <input type="checkbox" checked={datos.activo} disabled={!puedeEditar}
                onChange={e => setDatos(p => ({ ...p, activo: e.target.checked }))} />
              Mostrar «Transferencia o depósito» a los alumnos
            </label>
            {CAMPOS.map(c => (
              <div key={c.clave} className="space-y-1.5">
                <label htmlFor={`dp-${c.clave}`} className="block text-sm font-medium" style={{ color: TXT_SUAVE }}>{c.etiqueta}</label>
                <input id={`dp-${c.clave}`} value={datos[c.clave]} disabled={!puedeEditar}
                  inputMode={c.numerico ? 'numeric' : undefined} autoComplete="off"
                  onChange={e => setDatos(p => ({ ...p, [c.clave]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={INPUT_STYLE} />
                {c.ayuda && <p className="text-xs" style={{ color: TXT_TENUE }}>{c.ayuda}</p>}
              </div>
            ))}
          </>
        )}
        {[...avisos, ...(error ? [error] : [])].map(a => (
          <p key={a} role="alert" className="text-sm rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>⚠ {a}</p>
        ))}
        <button type="submit" disabled={guardando || cargando || !puedeEditar}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold disabled:opacity-60"
          style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}>
          {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Guardar datos de pago'}
        </button>
      </form>
    </div>
  )
}
