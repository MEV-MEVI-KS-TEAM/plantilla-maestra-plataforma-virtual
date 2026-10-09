'use client'

import { useRef } from 'react'
import { Check, Lock } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { CONFIG } from '@/lib/config'
import { withAlpha } from '@/lib/utils'
import { colorLegibleSobre } from '@/lib/contraste'

gsap.registerPlugin(useGSAP)

// El roadmap vive en la tarjeta oscura de la materia (#181C26). Un acento de
// marca oscuro (p. ej. el petróleo de EDUVA) desaparecía ahí: «Semana 1», el
// número del nodo y «En curso» quedaban ilegibles. Si el acento ya cumple, no
// cambia; si no, se aclara conservando el tono (contraste.ts).
const ACENTO = colorLegibleSobre(CONFIG.colores.acento, '#181C26')

interface WeekRoadmapProps {
  semanas: Array<{
    id: string
    numero: number
    titulo: string
    titulo_en?: string
  }>
  semanasCompletadas: Set<string>
  semanaActivaId?: string
  onSemanaClick: (semanaId: string) => void
  lang: string
  esDemo?: boolean
  /**
   * Visor de cursos (aula tipo materia): el rótulo de cada paso («Lección»)
   * y la numeración la pone quien llama. Sin esto: «Semana» / «Paso».
   */
  etiqueta?: string
  /**
   * Visor de cursos: ningún paso se bloquea por avance (las lecciones de un
   * curso se abren libres; lo que no se ve lo decide la ventana de pago, que
   * ni siquiera manda esos módulos). Los pendientes se pintan con su número y
   * el seleccionado se resalta. Sin esto: la cadena de la materia.
   */
  libre?: boolean
}

type EstadoSemana = 'completado' | 'activo' | 'bloqueado' | 'pendiente'

function getEstado(
  semanaId: string,
  index: number,
  semanas: WeekRoadmapProps['semanas'],
  semanasCompletadas: Set<string>
): EstadoSemana {
  if (semanasCompletadas.has(semanaId)) return 'completado'

  // Primera semana no completada → activo
  for (let i = 0; i < semanas.length; i++) {
    if (!semanasCompletadas.has(semanas[i].id)) {
      return i === index ? 'activo' : 'bloqueado'
    }
  }

  return 'bloqueado'
}

export default function WeekRoadmap({
  semanas,
  semanasCompletadas,
  semanaActivaId,
  onSemanaClick,
  lang,
  esDemo = false,
  etiqueta,
  libre = false,
}: WeekRoadmapProps) {
  const loc = (es: string, en?: string) => lang === 'en' && en ? en : es
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    // Nodos: entran desde la izquierda con stagger
    const nodes = containerRef.current.querySelectorAll('.roadmap-node')
    gsap.from(nodes, {
      opacity: 0,
      x: -20,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power2.out',
    })

    // Líneas: se dibujan de arriba hacia abajo
    const lines = containerRef.current.querySelectorAll('.roadmap-line')
    gsap.from(lines, {
      scaleY: 0,
      transformOrigin: 'top center',
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.inOut',
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex flex-col">
      {semanas.map((semana, index) => {
        // En demo: todas las semanas están desbloqueadas
        const estado: EstadoSemana = libre
          ? (semanasCompletadas.has(semana.id) ? 'completado' : semana.id === semanaActivaId ? 'activo' : 'pendiente')
          : esDemo
          ? (semanasCompletadas.has(semana.id) ? 'completado' : 'activo')
          : getEstado(semana.id, index, semanas, semanasCompletadas)
        const esUltima = index === semanas.length - 1
        const clickable = estado !== 'bloqueado'
        // En modo libre, el seleccionado se marca aunque ya esté completado.
        const seleccionado = libre && semana.id === semanaActivaId
        // En demo: "Paso N" en vez de "Semana N"
        const labelPrefijo = etiqueta ?? (esDemo ? 'Paso' : (lang === 'en' ? 'Week' : 'Semana'))

        return (
          <div key={semana.id} className="roadmap-node flex gap-4">
            {/* Columna izquierda: nodo + línea conectora */}
            <div className="flex flex-col items-center">
              {/* Nodo */}
              <button
                onClick={() => clickable && onSemanaClick(semana.id)}
                disabled={!clickable}
                aria-label={`${labelPrefijo} ${semana.numero}: ${loc(semana.titulo, semana.titulo_en)}`}
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 relative z-10 border-2',
                  estado === 'activo' ? 'animate-pulse' : '',
                  estado === 'bloqueado' || estado === 'pendiente' ? 'bg-transparent border-slate-600' : '',
                  clickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed',
                ].join(' ')}
                style={
                  estado === 'completado'
                    ? { backgroundColor: CONFIG.colores.primario, borderColor: seleccionado ? ACENTO : CONFIG.colores.primario, boxShadow: seleccionado ? `0 0 0 3px ${withAlpha(ACENTO, 0.35)}` : undefined }
                    : estado === 'activo'
                    ? { backgroundColor: withAlpha(ACENTO, 0.15), borderColor: ACENTO }
                    : undefined
                }
              >
                {estado === 'completado' && (
                  <Check className="w-5 h-5" style={{ color: '#fff' }} strokeWidth={2.5} />
                )}
                {estado === 'activo' && (
                  <span className="text-sm font-bold" style={{ color: ACENTO }}>
                    {semana.numero}
                  </span>
                )}
                {estado === 'bloqueado' && (
                  <Lock className="w-4 h-4" style={{ color: '#475569' }} />
                )}
                {estado === 'pendiente' && (
                  <span className="text-sm font-bold" style={{ color: '#94A3B8' }}>
                    {semana.numero}
                  </span>
                )}
              </button>

              {/* Línea conectora */}
              {!esUltima && (
                <div
                  className={[
                    'roadmap-line w-0.5 flex-1 min-h-[2rem] my-0.5 transition-all duration-500',
                    estado === 'completado'
                      ? ''
                      : 'border-l-2 border-dashed border-slate-600 bg-transparent w-0',
                  ].join(' ')}
                  style={estado === 'completado' ? { backgroundColor: CONFIG.colores.primario } : undefined}
                />
              )}
            </div>

            {/* Columna derecha: info de la semana */}
            <button
              onClick={() => clickable && onSemanaClick(semana.id)}
              disabled={!clickable}
              className={[
                'flex-1 flex flex-col justify-start pb-8 text-left transition-all duration-500',
                !esUltima ? '' : 'pb-0',
                clickable ? 'cursor-pointer' : 'cursor-not-allowed',
              ].join(' ')}
            >
              {/* Número + Badge */}
              <div className="flex items-center gap-2 mb-0.5 mt-1.5">
                <span
                  className="text-xs font-mono transition-all duration-500"
                  style={{ color: estado === 'bloqueado' || estado === 'pendiente' ? '#94A3B8' : ACENTO }}
                >
                  {labelPrefijo} {semana.numero}
                </span>

                {estado === 'activo' && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: withAlpha(ACENTO, 0.15), color: ACENTO }}
                  >
                    {libre ? 'Viendo' : lang === 'en' ? 'In progress' : 'En curso'}
                  </span>
                )}
                {estado === 'completado' && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}
                  >
                    {lang === 'en' ? 'Completed' : 'Completada'}
                  </span>
                )}
              </div>

              {/* Título */}
              <p
                className={[
                  'text-sm transition-all duration-500 leading-snug',
                  estado === 'completado' ? 'font-medium' : '',
                  estado === 'activo' ? 'font-bold' : '',
                  estado === 'bloqueado' ? 'opacity-40' : '',
                ].join(' ')}
                style={{
                  color: estado === 'bloqueado' ? '#94A3B8' : estado === 'pendiente' ? '#CBD5E1' : '#F1F5F9',
                }}
              >
                {loc(semana.titulo, semana.titulo_en)}
              </p>

              {/* El candado es de avance, no de pago: sin este texto el alumno
                  cree que le falta pagar y escribe a soporte. */}
              {estado === 'bloqueado' && (
                <p className="text-xs mt-1 leading-snug" style={{ color: '#64748B' }}>
                  {lang === 'en'
                    ? 'Complete the previous week to unlock this one'
                    : 'Completa la semana anterior para desbloquear esta'}
                </p>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
