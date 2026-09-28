'use client'

import { CONFIG } from '@/lib/config'
import { formatearMoneda } from '@/lib/moneda'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, CreditCard, Search, FileText, MessageCircle, TrendingUp, Receipt } from 'lucide-react'
import { etiquetaNivel } from '@/lib/niveles-ui'
import { CONCEPTOS_LECTURA, CONCEPTOS_PROGRAMA_LECTURA, aplicaA, etiquetaConcepto, mesQueCubre } from '@/lib/pagos/conceptos'

interface Pago {
  id: string
  alumno_id: string
  monto: number
  concepto: string
  mes_desbloqueado: number | null
  metodo_pago: string
  referencia: string | null
  fecha_pago: string | null
  created_at: string
  alumno_nombre: string
  alumno_nivel: string | null
  matricula: string | null
  tiene_telefono: boolean
  // D14 (#207-3): el curso del pago (null = programa), por la FK.
  curso_inscripcion_id?: string | null
  curso_nombre?: string | null
  curso_tipo?: string | null
}

type PorVertical = { programa: number; cursos: number }
// D22a (decisión 4): los ingresos solo llegan si quien ve es admin; al
// secretario la API le manda solo «Pagos registrados».
interface Kpis {
  ingresosMes?: number; ingresosTotales?: number; pagosRegistrados: number
  porVertical?: { mes: PorVertical; total: PorVertical }
}



const mxn = (n: number) =>
  formatearMoneda(n, CONFIG, { decimales: 2, conCodigo: true })

const fecha = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function PagosPage() {
  const [pagos, setPagos]   = useState<Pago[]>([])
  // null hasta la primera respuesta: no se pinta la rejilla de tarjetas, así el
  // secretario no ve «$0» de ingresos un instante ni el admin ve 1 tarjeta y luego 3.
  const [kpis, setKpis]     = useState<Kpis | null>(null)
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [concepto, setConcepto] = useState('')
  const [vertical, setVertical] = useState('')
  const [desde, setDesde]       = useState('')
  const [hasta, setHasta]       = useState('')

  // Qué recibo se está generando, para no dejar el botón mudo mientras el PDF
  // se renderiza y se sube a Storage (la primera vez tarda).
  const [generando, setGenerando] = useState<string | null>(null)

  const cargar = useCallback(() => {
    const qs = new URLSearchParams()
    if (concepto) qs.set('concepto', concepto)
    if (vertical) qs.set('vertical', vertical)
    if (desde)    qs.set('desde', desde)
    if (hasta)    qs.set('hasta', hasta)
    setLoad(true)
    fetch(`/api/admin/pagos?${qs}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setError(null)
        setPagos(d.pagos ?? [])
        setKpis(d.kpis ?? { pagosRegistrados: 0 })
      })
      .catch(() => setError('Error al cargar el historial de pagos'))
      .finally(() => setLoad(false))
  }, [concepto, vertical, desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  // La búsqueda por texto se filtra en el cliente para que escribir no dispare
  // una petición por tecla; concepto y fechas sí van al servidor.
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return pagos
    return pagos.filter(p =>
      p.alumno_nombre.toLowerCase().includes(q)
      || (p.matricula  ?? '').toLowerCase().includes(q)
      || (p.referencia ?? '').toLowerCase().includes(q)
    )
  }, [pagos, busqueda])

  const totalFiltrado = useMemo(() => filas.reduce((a, p) => a + p.monto, 0), [filas])

  async function recibo(pagoId: string, accion: 'pdf' | 'whatsapp') {
    setGenerando(pagoId + accion)
    try {
      const r = await fetch(`/api/admin/pagos/${pagoId}/recibo`)
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? 'No se pudo generar el recibo'); return }
      if (accion === 'pdf') { window.open(d.signedUrl, '_blank', 'noopener'); return }
      if (!d.whatsappUrl) {
        alert('Este alumno no tiene teléfono registrado. Agrégalo en su ficha para enviarle el recibo por WhatsApp.')
        return
      }
      window.open(d.whatsappUrl, '_blank', 'noopener')
    } catch {
      alert('Error de red al generar el recibo')
    } finally {
      setGenerando(null)
    }
  }

  // D14: el subtítulo «Programa · Cursos», solo cuando hay pagos de cursos.
  const partido = (v?: PorVertical) => (v && v.cursos > 0 ? `Programa ${mxn(v.programa)} · Cursos ${mxn(v.cursos)}` : null)
  // D22a (decisión 4): solo quien recibió los ingresos de la API (el admin) los ve,
  // en las tarjetas y en el «Total» del pie de la tabla.
  const verIngresos = kpis?.ingresosMes !== undefined && kpis?.ingresosTotales !== undefined
  const KPI = !kpis ? [] : [
    ...(verIngresos ? [
      { label: 'Ingresos del mes',  valor: mxn(kpis.ingresosMes ?? 0),     Icon: TrendingUp, sub: partido(kpis.porVertical?.mes) },
      { label: 'Ingresos totales',  valor: mxn(kpis.ingresosTotales ?? 0), Icon: CreditCard, sub: partido(kpis.porVertical?.total) },
    ] : []),
    { label: 'Pagos registrados', valor: String(kpis.pagosRegistrados), Icon: Receipt, sub: null },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-primario)' }}>Pagos</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>
          Historial global de pagos registrados — busca, filtra, descarga el recibo o envíalo por WhatsApp
        </p>
      </div>

      {/* KPIs (se pintan cuando llega la primera respuesta) */}
      {KPI.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {KPI.map(k => (
          <div key={k.label} className="rounded-2xl p-5"
            style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)' }}>
              <k.Icon size={17} style={{ color: 'var(--color-acento)' }} aria-hidden />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primario)' }}>{k.valor}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>{k.label}</p>
            {k.sub && <p className="text-xs mt-1" style={{ color: 'var(--color-texto-secundario)' }}>{k.sub}</p>}
          </div>
        ))}
      </div>}

      {/* Controles */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-texto-secundario)' }} />
          <input
            type="text"
            placeholder="Buscar por alumno, matrícula o referencia…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)' }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>
            Concepto
            <select value={concepto} onChange={e => setConcepto(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)' }}>
              <option value="">Todos</option>
              {/* D14: también los de curso (el filtro los acepta). */}
              <optgroup label="Programa">
                {CONCEPTOS_PROGRAMA_LECTURA.map(c => (
                  <option key={c} value={c}>{etiquetaConcepto(c)}</option>
                ))}
              </optgroup>
              <optgroup label="Cursos">
                {CONCEPTOS_LECTURA.filter(c => !(CONCEPTOS_PROGRAMA_LECTURA as readonly string[]).includes(c)).map(c => (
                  <option key={c} value={c}>{etiquetaConcepto(c)}</option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="text-xs font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>
            Aplica a
            <select value={vertical} onChange={e => setVertical(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)' }}>
              <option value="">Todo</option>
              <option value="programa">Programa</option>
              <option value="curso">Cursos</option>
            </select>
          </label>
          <label className="text-xs font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>
            Desde
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)' }} />
          </label>
          <label className="text-xs font-semibold" style={{ color: 'var(--color-texto-secundario)' }}>
            Hasta
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)' }} />
          </label>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[240px]">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-acento)' }} />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm py-8 text-center" style={{ color: '#DC2626' }}>{error}</p>
      )}

      {!loading && !error && filas.length === 0 && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
          <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
            {pagos.length === 0
              ? 'Todavía no hay pagos registrados. Se capturan desde la ficha de cada alumno.'
              : 'Ningún pago coincide con la búsqueda.'}
          </p>
        </div>
      )}

      {!loading && !error && filas.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
          {/* Tabla ancha: scroll dentro de su propio contenedor, para que la
              página nunca desborde de lado en teléfono. */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-borde)' }}>
                  {['Alumno', 'Concepto', 'Monto', 'Método', 'Referencia', 'Fecha', 'Recibo'].map(h => (
                    <th key={h} className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--color-texto-secundario)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/alumnos/${p.alumno_id}`} className="font-semibold hover:underline"
                        style={{ color: 'var(--color-acento)' }}>
                        {p.alumno_nombre}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>
                        {p.matricula ?? 'sin matrícula'}
                        {p.alumno_nivel ? ` · ${etiquetaNivel(p.alumno_nivel)}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-texto)' }}>
                      {etiquetaConcepto(p.concepto)}
                      {p.mes_desbloqueado ? (
                        <span className="text-xs ml-1" style={{ color: 'var(--color-texto-secundario)' }}>· {p.curso_inscripcion_id ? mesQueCubre(p) : `mes ${p.mes_desbloqueado}`}</span>
                      ) : null}
                      {/* D14: la insignia de la vertical (por la FK). */}
                      {p.curso_inscripcion_id ? (
                        <span className="block text-xs mt-0.5 font-semibold" style={{ color: '#7C3AED' }}>{aplicaA(p)}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: 'var(--color-primario)' }}>{mxn(p.monto)}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-texto-secundario)' }}>{p.metodo_pago}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-texto-secundario)' }}>{p.referencia ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-texto-secundario)' }}>{fecha(p.fecha_pago ?? p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => recibo(p.id, 'pdf')} disabled={generando === p.id + 'pdf'}
                          title="Descargar recibo en PDF"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          style={{ background: 'var(--color-superficie)', color: 'var(--color-acento)', border: '1px solid var(--color-acento)' }}>
                          {generando === p.id + 'pdf'
                            ? <Loader2 size={13} className="animate-spin" />
                            : <FileText size={13} />}
                          PDF
                        </button>
                        <button onClick={() => recibo(p.id, 'whatsapp')} disabled={generando === p.id + 'whatsapp'}
                          title={p.tiene_telefono ? 'Enviar recibo por WhatsApp' : 'El alumno no tiene teléfono registrado'}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          style={{ background: '#25D366', color: '#fff' }}>
                          {generando === p.id + 'whatsapp'
                            ? <Loader2 size={13} className="animate-spin" />
                            : <MessageCircle size={13} />}
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-texto-secundario)' }}>
                    {filas.length} {filas.length === 1 ? 'pago' : 'pagos'}
                  </td>
                  {verIngresos ? (
                    <>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-texto-secundario)' }}>Total</td>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-primario)' }}>{mxn(totalFiltrado)}</td>
                      <td colSpan={4} />
                    </>
                  ) : <td colSpan={6} />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
