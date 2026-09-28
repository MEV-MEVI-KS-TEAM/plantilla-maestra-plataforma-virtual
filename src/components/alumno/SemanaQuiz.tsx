'use client'

import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { CONFIG } from '@/lib/config'
import { withAlpha } from '@/lib/utils'

gsap.registerPlugin(useGSAP)

/**
 * Quiz de refuerzo de la semana. D22d-1 (K-d1): la pregunta llega SIN la
 * respuesta correcta ni la explicación; cada respuesta se manda al servidor, que
 * califica, guarda y devuelve el veredicto de ESA pregunta. La primera respuesta
 * es la que cuenta (el servidor la bloquea), así que el avance sobrevive a una
 * recarga.
 */
interface Pregunta {
  id: string
  pregunta: string
  opciones: string[]
  orden: number
}

interface Resultado {
  tu_respuesta: number
  correcta: boolean
  explicacion?: string
}

interface SemanaQuizProps {
  semanaId: string
  /** Reservado para futuras llamadas con RLS desde cliente; el API usa la sesión del servidor */
  alumnoId?: string
  lang: string
}

const CARD = { background: '#181C26', border: '1px solid #2A2F3E' }

export default function SemanaQuiz({ semanaId, lang }: SemanaQuizProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [resultados, setResultados] = useState<Record<string, Resultado>>({})
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [verResumen, setVerResumen] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const preguntaRef = useRef<HTMLDivElement>(null)

  const loc = (es: string, en: string) => lang === 'en' ? en : es

  useEffect(() => {
    fetch(`/api/alumno/quiz/${semanaId}`)
      .then(async r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        const lista: Pregunta[] = data.preguntas ?? []
        const res: Record<string, Resultado> = data.resultados ?? {}
        setPreguntas(lista)
        setResultados(res)
        if (data.completado) setVerResumen(true)
        else {
          // Arranca en la primera pregunta sin contestar.
          const i = lista.findIndex(p => !res[p.id])
          if (i > 0) setCurrentIdx(i)
        }
      })
      .catch(() => setErrorCarga(true))
      .finally(() => setLoading(false))
  }, [semanaId])

  // Animar entrada de cada pregunta
  useGSAP(() => {
    if (preguntaRef.current && !verResumen) {
      gsap.fromTo(
        preguntaRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }, { dependencies: [currentIdx], scope: cardRef })

  if (loading) {
    return (
      <div className="rounded-xl p-4 mt-2 flex items-center gap-2 text-xs" style={CARD}>
        <span style={{ color: '#94A3B8' }}>{loc('Cargando refuerzo…', 'Loading practice…')}</span>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="rounded-xl p-4 mt-2 text-xs leading-relaxed" style={CARD}>
        <p style={{ color: '#94A3B8' }}>
          {loc('No se pudo cargar el quiz de refuerzo. Recarga la página para intentarlo de nuevo.',
            "The practice quiz couldn't load. Reload the page to try again.")}
        </p>
      </div>
    )
  }

  if (preguntas.length === 0) {
    return (
      <div className="rounded-xl p-4 mt-2 text-xs leading-relaxed" style={CARD}>
        <p className="font-semibold mb-1" style={{ color: '#94A3B8' }}>
          {loc('Quiz de refuerzo', 'Practice quiz')}
        </p>
        <p style={{ color: '#64748B' }}>
          {loc(
            'Aún no hay preguntas para esta semana. Tu avance no se ve afectado.',
            'No practice questions for this week yet. Your progress is not affected.',
          )}
        </p>
      </div>
    )
  }

  const pregunta = preguntas[currentIdx]
  const total = preguntas.length
  const resultado = resultados[pregunta.id]
  const yaRespondida = resultado !== undefined
  const todasContestadas = preguntas.every(p => resultados[p.id])

  const handleOpcion = async (idx: number) => {
    if (yaRespondida || enviando) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const r = await fetch(`/api/alumno/quiz/${semanaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta_id: pregunta.id, respuesta: idx }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErrorEnvio(data.error ?? loc('No se pudo guardar tu respuesta. Intenta de nuevo.', "Your answer couldn't be saved. Try again."))
        return
      }
      setResultados(prev => ({
        ...prev,
        [pregunta.id]: { tu_respuesta: data.tu_respuesta, correcta: data.correcta === true, explicacion: data.explicacion },
      }))
    } catch {
      setErrorEnvio(loc('No se pudo guardar tu respuesta. Revisa tu conexión.', "Your answer couldn't be saved. Check your connection."))
    } finally {
      setEnviando(false)
    }
  }

  const handleNext = () => {
    if (currentIdx < total - 1) setCurrentIdx(i => i + 1)
    else if (todasContestadas) setVerResumen(true)
  }

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1)
  }

  // Vista de resultados (quiz completado): el conteo sale de los veredictos del servidor.
  if (verResumen) {
    const correct = preguntas.filter(p => resultados[p.id]?.correcta).length

    return (
      <div className="rounded-xl p-5 space-y-3 mt-2" style={CARD}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
              {loc('Comprueba lo que aprendiste', 'Check what you learned')}
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {loc('No afecta tu calificación', "Doesn't affect your grade")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: correct === total ? '#10B981' : '#F1F5F9' }}
            >
              {correct}/{total}
            </div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              {loc(`¡${correct} de ${total} correctas!`, `${correct} out of ${total} correct!`)}
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => { setVerResumen(false); setCurrentIdx(0) }}
            className="px-3 py-1.5 text-xs rounded-lg"
            style={{ border: '1px solid #2A2F3E', color: '#94A3B8', background: 'transparent' }}
          >
            {loc('Repasar respuestas', 'Review answers')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={cardRef} className="rounded-xl p-5 space-y-4 mt-2" style={CARD}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            {loc('Comprueba lo que aprendiste', 'Check what you learned')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
            {loc('No afecta tu calificación', "Doesn't affect your grade")}
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full flex-shrink-0"
          style={{ background: withAlpha(CONFIG.colores.primario, 0.15), color: withAlpha(CONFIG.colores.primario, 0.65) }}
        >
          {loc(`${currentIdx + 1} de ${total}`, `${currentIdx + 1} of ${total}`)}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2A2F3E' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / total) * 100}%`, background: withAlpha(CONFIG.colores.primario, 0.65) }}
        />
      </div>

      {/* Pregunta + opciones */}
      <div ref={preguntaRef} className="space-y-3">
        <p className="text-sm font-medium leading-relaxed" style={{ color: '#E2E8F0' }}>
          {pregunta.pregunta}
        </p>

        <div className="space-y-2">
          {pregunta.opciones.map((opcion, i) => {
            const esSeleccionada = resultado?.tu_respuesta === i

            let bg = 'rgba(255,255,255,0.03)'
            let borderColor = '#2A2F3E'
            let textColor = '#94A3B8'

            // Solo se estiliza la opción que eligió el alumno: la correcta no se
            // revela (el servidor ni siquiera la manda).
            if (yaRespondida && esSeleccionada) {
              if (resultado.correcta) {
                bg = 'rgba(16,185,129,0.1)'
                borderColor = '#10B981'
                textColor = '#86EFAC'
              } else {
                bg = 'rgba(239,68,68,0.1)'
                borderColor = '#EF4444'
                textColor = '#FCA5A5'
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleOpcion(i)}
                disabled={yaRespondida || enviando}
                className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all disabled:cursor-default"
                style={{
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  cursor: yaRespondida || enviando ? 'default' : 'pointer',
                  opacity: enviando && !yaRespondida ? 0.6 : 1,
                }}
              >
                <span
                  className="font-semibold mr-2"
                  style={{
                    color:
                      yaRespondida && esSeleccionada && resultado.correcta
                        ? '#10B981'
                        : yaRespondida && esSeleccionada
                          ? '#EF4444'
                          : withAlpha(CONFIG.colores.primario, 0.65),
                  }}
                >
                  {String.fromCharCode(65 + i)}.
                </span>
                {opcion}
              </button>
            )
          })}
        </div>

        {errorEnvio && (
          <p className="text-xs" style={{ color: '#FCA5A5' }}>{errorEnvio}</p>
        )}

        {/* Retroalimentación: el veredicto del servidor, solo de esta pregunta */}
        {yaRespondida && (
          <div
            className="px-4 py-3 rounded-lg text-sm leading-relaxed"
            style={{
              background: resultado.correcta ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${resultado.correcta ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: '#CBD5E1',
            }}
          >
            <span className="font-semibold mr-1">{resultado.correcta ? '✓' : '✗'}</span>
            {resultado.explicacion
              ? resultado.explicacion
              : resultado.correcta
                ? loc('¡Correcto!', 'Correct!')
                : loc('Incorrecto', 'Incorrect')}
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-3 py-1.5 text-xs rounded-lg transition-all disabled:opacity-30"
          style={{ border: '1px solid #2A2F3E', color: '#94A3B8', background: 'transparent' }}
        >
          ← {loc('Anterior', 'Previous')}
        </button>

        {yaRespondida && (currentIdx < total - 1 || todasContestadas) && (
          <button
            onClick={handleNext}
            className="px-4 py-1.5 text-xs rounded-lg font-semibold transition-all"
            style={{ background: CONFIG.colores.primario, color: '#fff', border: 'none' }}
          >
            {currentIdx === total - 1
              ? loc('Ver resultado →', 'See results →')
              : loc('Siguiente →', 'Next →')}
          </button>
        )}
      </div>
    </div>
  )
}
