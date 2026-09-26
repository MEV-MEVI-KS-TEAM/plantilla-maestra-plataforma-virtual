'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, X, DollarSign } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/cursos/ConfirmDialog'
import { AVISO_PAGO_UNICO } from '@/lib/cursos/precio-regla'
import { cubreElCobro, queAbre, type ConceptoCobro, type FilaCursoAlumno } from '@/lib/cursos/cobro'
import { etiquetaConcepto } from '@/lib/pagos/conceptos'

/**
 * «Cobrar» un curso (Bloque D · D17, #207-6). Lo abren la tarjeta «Cursos» de
 * la ficha, «¿A qué se aplica?» del modal del programa y la pestaña Alumnos
 * del curso (D18). Escribe con POST /api/admin/inscripciones/[id]/pago →
 * curso_cobrar (D16), el único escritor de cobros de curso.
 *
 *  - Precarga (lib/cursos/cobro.ts): pago único → el saldo; mensual → la
 *    inscripción si falta, o la mensualidad del primer mes sin pago; sin precio
 *    → monto libre con aviso.
 *  - La casilla «abrir» solo aparece si hay algo que abrir con ESE concepto y
 *    ese mes; sale marcada si lo acumulado cubre y se desmarca sola en un abono
 *    (hasta que quien cobra la toque). Admin y secretario (decisión 6).
 *  - Si abre TODO el curso: doble confirmación con AVISO_PAGO_UNICO.
 *  - `pago_id` se genera UNA vez al abrir el modal: el doble clic o un
 *    reintento no cobran dos veces (curso_cobrar es idempotente por él).
 */
const CARD_STYLE = { background: '#181C26', border: '1px solid #2A2F3E' }
const INPUT_STYLE = { background: '#0B0D11', border: '1px solid #2A2F3E', color: '#F1F5F9' }
const CONCEPTOS: ConceptoCobro[] = ['curso_pago_unico', 'curso_inscripcion', 'curso_mensualidad', 'curso_otro']
const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO']

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nuevoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
}

export function CobrarCursoModal({
  fila,
  alumnoNombre,
  moneda,
  fmt,
  onClose,
  onCobrado,
}: {
  fila: FilaCursoAlumno
  alumnoNombre: string
  moneda: string
  fmt: (n: number) => string
  onClose: () => void
  onCobrado: (mensaje: string) => void
}) {
  const p = fila.precarga
  const [pagoId] = useState(nuevoId)
  const [concepto, setConcepto] = useState<ConceptoCobro>(p.concepto)
  const [monto, setMonto] = useState(p.monto !== null ? String(p.monto) : '')
  const [mes, setMes] = useState(p.mes !== null ? String(p.mes) : '')
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [referencia, setReferencia] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [abrirTocado, setAbrirTocado] = useState(false)
  const [abrirMarcado, setAbrirMarcado] = useState(p.abrirPorDefecto)
  const [confirmar, setConfirmar] = useState<0 | 1 | 2>(0)
  // La segunda confirmación no acepta el clic en su primer instante: el segundo
  // clic de un doble clic en «Continuar» caía en «Sí, cobrar y abrir todo».
  const [paso2Listo, setPaso2Listo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (confirmar !== 2) { setPaso2Listo(false); return }
    const t = setTimeout(() => setPaso2Listo(true), 600)
    return () => clearTimeout(t)
  }, [confirmar])

  // Escape cierra (salvo a medio envío: el resultado no se perdería en silencio).
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape' && !enviando && confirmar === 0) onClose() }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [enviando, confirmar, onClose])

  const mesNum = concepto === 'curso_mensualidad' && mes !== '' ? Number(mes) : null
  const abre = queAbre(fila, concepto, mesNum)
  const montoNum = Number(monto)
  // Sin tocar la casilla, sigue a lo que cubre el monto (un abono no abre).
  const abrir = abre !== null && (abrirTocado ? abrirMarcado : cubreElCobro(fila.cobro, concepto, montoNum) && p.abrirPorDefecto)

  const titulo = useMemo(() => `${fila.curso_tipo === 'diplomado' ? 'Diplomado' : 'Curso'} «${fila.curso_nombre}»`, [fila])

  async function enviar() {
    setError(null)
    setEnviando(true)
    try {
      const res = await fetch(`/api/admin/inscripciones/${fila.inscripcion_id}/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pago_id: pagoId,
          concepto,
          monto: montoNum,
          metodo_pago: metodo,
          mes: mesNum,
          abrir,
          meses_esperados: fila.meses_desbloqueados,
          regla_esperada: p.regla,
          referencia,
          fecha_pago: fecha,
        }),
      })
      const json = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) {
        setError(json.error ?? 'No se pudo registrar el cobro')
        setConfirmar(0)
        return
      }
      const abrio = json.abrio === 'todo' ? ' y se le abrió TODO el curso' : json.abrio === 'mes' ? ` y se le abrió el mes ${json.meses_desbloqueados}` : ''
      onCobrado(json.repetido
        ? `Ese cobro ya estaba registrado (no se cobró dos veces).`
        : `💵 ${alumnoNombre}: cobro de ${fmt(montoNum)} al ${titulo.toLowerCase().startsWith('diplomado') ? 'diplomado' : 'curso'}${abrio}`)
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
      setConfirmar(0)
    } finally {
      setEnviando(false)
    }
  }

  function pedir(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!Number.isFinite(montoNum) || montoNum <= 0) { setError('El monto debe ser mayor a 0.'); return }
    if (concepto === 'curso_mensualidad' && (!Number.isInteger(mesNum) || (mesNum ?? 0) < 1)) { setError('Escribe qué mes del curso cubre (1 o más).'); return }
    // Abrir TODO el curso: doble confirmación con el aviso del pago único.
    if (abrir && abre?.todo) { setConfirmar(1); return }
    void enviar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto" style={CARD_STYLE}
        role="dialog" aria-modal="true" aria-labelledby="cobrar-curso-titulo">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 id="cobrar-curso-titulo" className="text-lg font-bold text-gray-100">Cobrar</h3>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{titulo} · {alumnoNombre}</p>
          </div>
          <button onClick={onClose} disabled={enviando} className="p-1.5 rounded-lg disabled:opacity-40" style={{ color: '#94A3B8' }} aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={pedir} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium" style={{ color: '#94A3B8' }}>
              Concepto
              <select value={concepto} onChange={e => setConcepto(e.target.value as ConceptoCobro)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={INPUT_STYLE}>
                {CONCEPTOS.map(c => <option key={c} value={c}>{etiquetaConcepto(c)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: '#94A3B8' }}>
              Monto ({moneda})
              <input type="number" required min="0.01" step="0.01" value={monto} onChange={e => setMonto(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={INPUT_STYLE} />
            </label>
          </div>
          {concepto === 'curso_mensualidad' && (
            <label className="block text-sm font-medium" style={{ color: '#94A3B8' }}>
              Mes del curso que cubre
              <input type="number" min="1" step="1" value={mes} onChange={e => setMes(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={INPUT_STYLE} />
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium" style={{ color: '#94A3B8' }}>
              Método
              <select value={metodo} onChange={e => setMetodo(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={INPUT_STYLE}>
                {METODOS.map(m => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: '#94A3B8' }}>
              Fecha
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={INPUT_STYLE} />
            </label>
          </div>
          <label className="block text-sm font-medium" style={{ color: '#94A3B8' }}>
            Referencia (opcional)
            <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Folio, núm. de transferencia, etc."
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={INPUT_STYLE} />
          </label>

          {p.aviso && <p className="text-xs" style={{ color: '#FBBF24' }}>{p.aviso}</p>}
          {fila.resumen.pagadoFaltaAbrir && fila.resumen.tipo === 'unico' && (
            <p className="text-xs" style={{ color: '#FBBF24' }}>
              Ya pagó el curso completo y no se le ha abierto: ábrelo con «Abrir todo» en la pestaña Alumnos del curso, sin cobrar de nuevo.
            </p>
          )}
          {fila.estado && fila.estado !== 'activa' && (
            <p className="text-xs" style={{ color: '#FBBF24' }}>
              La inscripción está {fila.estado}: el cobro se registra, pero no abre nada.
            </p>
          )}

          {abre ? (
            <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: '#E2E8F0' }}>
              <input type="checkbox" className="mt-0.5" checked={abrir}
                onChange={e => { setAbrirTocado(true); setAbrirMarcado(e.target.checked) }} />
              <span>
                {abre.texto}
                {!abrir && <span className="block text-xs" style={{ color: '#94A3B8' }}>Sin marcar: solo se registra el cobro; el acceso no cambia.</span>}
              </span>
            </label>
          ) : (
            <p className="text-xs" style={{ color: '#64748B' }}>
              Esto solo registra el cobro del curso. El acceso se mueve con «Abrir mes» o «Abrir todo» en la pestaña Alumnos del curso.
            </p>
          )}

          {error && (
            <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={enviando} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid #2A2F3E' }}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ background: '#10B981', color: '#062B1F' }}>
              {enviando ? <><Loader2 className="w-4 h-4 animate-spin" />Registrando...</> : <><DollarSign className="w-4 h-4" />Cobrar</>}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmar === 1}
        title="Cobrar y abrir TODO el curso"
        message={<>Se registra el cobro de {Number.isFinite(montoNum) ? fmt(montoNum) : '—'} y {alumnoNombre} recibe acceso al {titulo} completo.</>}
        confirmLabel="Continuar"
        onConfirm={() => setConfirmar(2)}
        onCancel={() => setConfirmar(0)}
      />
      <ConfirmDialog
        open={confirmar === 2}
        danger
        title="¿Seguro? Segunda confirmación"
        message={<>Cobrar {Number.isFinite(montoNum) ? fmt(montoNum) : '—'} y abrir TODO el {titulo}. {AVISO_PAGO_UNICO}</>}
        confirmLabel="Sí, cobrar y abrir todo"
        busy={enviando || !paso2Listo}
        onConfirm={() => { void enviar() }}
        onCancel={() => setConfirmar(0)}
      />
    </div>
  )
}
