'use client'

import { GraduationCap, DollarSign } from 'lucide-react'
import type { FilaCursoAlumno } from '@/lib/cursos/cobro'

/**
 * Tarjeta «Cursos» de la ficha del alumno (Bloque D · D17, #207-6; decisión 4).
 *
 * Una fila por inscripción: el curso, su acceso, el precio de REFERENCIA y de
 * dónde salió (la foto al asignar o la ficha de hoy, decisión 10), lo pagado,
 * el saldo (pago único), la insignia «Pagado · falta abrir» y «Cobrar». La ven
 * y la usan el admin y el secretario (decisión 6): en una escuela solo_cursos
 * es la única pantalla del secretario para cobrar.
 *
 * No calcula nada: pinta lo que devuelve GET /api/admin/alumnos/[id]/cursos,
 * que sale de lib/cursos/cobro.ts (las mismas reglas que curso_cobrar).
 */
const CARD_STYLE = { background: '#181C26', border: '1px solid #2A2F3E' }

export function accesoDeCurso(f: Pick<FilaCursoAlumno, 'estado' | 'acceso_total' | 'meses_desbloqueados' | 'por_activar'>): string {
  if (f.estado && f.estado !== 'activa') return f.estado === 'cancelada' ? 'Cancelada' : f.estado === 'suspendida' ? 'Suspendida' : 'Completada'
  if (f.acceso_total) return 'Acceso total'
  if (f.por_activar) return 'Por activar'
  const n = f.meses_desbloqueados
  return `${n} ${n === 1 ? 'mes abierto' : 'meses abiertos'}`
}

export function precioDeReferencia(f: Pick<FilaCursoAlumno, 'precio_referencia' | 'resumen'>, fmt: (n: number) => string): string {
  const { inscripcion, mensualidad, origen } = f.precio_referencia
  const de = origen === 'inscripcion' ? 'precio al asignar' : 'ficha de hoy'
  if (f.resumen.tipo === 'unico') return `${fmt(inscripcion)} pago único · ${de}`
  if (f.resumen.tipo === 'mensual') return `${inscripcion > 0 ? `${fmt(inscripcion)} + ` : ''}${fmt(mensualidad)}/mes · ${de}`
  return f.precio_referencia.origen === 'inscripcion' ? 'Sin precio al asignar' : 'Sin precio en la ficha de hoy'
}

export function CursosDelAlumno({
  filas,
  fmt,
  onCobrar,
}: {
  filas: FilaCursoAlumno[]
  fmt: (n: number) => string
  onCobrar: (f: FilaCursoAlumno) => void
}) {
  if (filas.length === 0) return null
  return (
    <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #2A2F3E' }}>
        <GraduationCap className="w-4 h-4" style={{ color: '#A78BFA' }} />
        <h3 className="text-sm font-semibold text-gray-100">Cursos</h3>
        <span className="text-xs" style={{ color: '#94A3B8' }}>Lo que se cobra aquí va al curso, no al programa</span>
      </div>
      <div className="divide-y" style={{ borderColor: '#2A2F3E' }}>
        {filas.map(f => (
          <div key={f.inscripcion_id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderTop: '1px solid rgba(42,47,62,0.5)' }}>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                {f.curso_tipo === 'diplomado' ? 'Diplomado' : 'Curso'} «{f.curso_nombre}»
                <span className="ml-2 text-xs font-medium" style={{ color: f.por_activar ? '#FBBF24' : '#94A3B8' }}>{accesoDeCurso(f)}</span>
              </p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{precioDeReferencia(f, fmt)}</p>
              <p className="text-xs" style={{ color: '#CBD5E1' }}>
                Pagado {fmt(f.resumen.pagado)}
                {f.resumen.saldo !== null && <> · Saldo {fmt(f.resumen.saldo)}</>}
                {f.resumen.mesesCubiertos.length > 0 && <> · Mensualidades pagadas: {f.resumen.mesesCubiertos.join(', ')}</>}
              </p>
              {f.resumen.pagadoFaltaAbrir && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                  Pagado · falta abrir
                </span>
              )}
            </div>
            <button
              onClick={() => onCobrar(f)}
              aria-label={`Cobrar ${f.curso_tipo === 'diplomado' ? 'el diplomado' : 'el curso'} ${f.curso_nombre}`}
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Cobrar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
