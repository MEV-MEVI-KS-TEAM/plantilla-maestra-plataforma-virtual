'use client'

/**
 * Movimiento de la landing de UVEP (#209).
 *
 * Las primitivas de movimiento que comparte toda la página: revelado al scroll,
 * contadores, acordeón, parallax del puntero, barra de avance y el botón de
 * copiar el folio. Nacieron en AULA RAÍZ (#208) y aquí se quedan tal cual, sin
 * sus dibujos de raíces: esta marca no cuenta esa historia. Lo propio de UVEP
 * —el arco navy, la banda roja y la mascota— vive en landing-animada.css, porque son
 * formas y una imagen, no trazos.
 *
 * ── Criterios ────────────────────────────────────────────────────────────────
 *
 *  - Solo se anima `transform` / `translate` / `scale` / `opacity`: nada mueve
 *    el layout. Curvas ease-out fuertes (`--la-ease-out` en landing-animada.css). La única
 *    excepción es el acordeón de preguntas.
 *  - NADA depende del JavaScript para VERSE. El HTML del servidor trae todo
 *    visible; el revelado solo se activa (clase `la-anim` en <html>) después de
 *    marcar como visible lo que ya está en pantalla, así que no hay parpadeo.
 *  - Toda forma es `aria-hidden` y `pointer-events: none`.
 *  - `prefers-reduced-motion`: sin desplazamientos ni bucles; los contadores
 *    muestran la cifra final.
 *
 * 🛑 CERO HEXADECIMALES AQUÍ: los colores llegan por props desde tokens.ts.
 */

import {
  useEffect, useLayoutEffect, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject,
} from 'react'
import { Check, Copy, MessageCircle, Plus } from 'lucide-react'
import type { TokensSeccion } from './tokens'

const reducirMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** useLayoutEffect sin el aviso de React en el servidor. */
const useEfectoAntesDePintar = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Retraso escalonado para `data-la-reveal` (stagger corto: 60–90 ms). */
export const retraso = (i: number, paso = 80): CSSProperties => ({ ['--la-delay' as string]: `${i * paso}ms` })

/** Índice para los trazos escalonados (`--la-i`) y las formas numeradas. */
export const indice = (i: number): CSSProperties => ({ ['--la-i' as string]: i })

/** Una variable CSS suelta, sin colarse a `style` un tipo que React no acepta. */
export const variable = (nombre: string, valor: string | number): CSSProperties =>
  ({ [nombre as string]: valor })

/* ═══ PRIMITIVAS ══════════════════════════════════════════════════════════ */

/**
 * Revelado al entrar en pantalla de todo `[data-la-reveal]`.
 *
 * Primero marca como visible lo que ya está a la vista y DESPUÉS enciende
 * `la-anim`: si fuera al revés, el primer pantallazo parpadearía en blanco.
 */
export function useRevelado(): void {
  useEffect(() => {
    const raiz = document.documentElement
    const nodos = Array.from(document.querySelectorAll<HTMLElement>('[data-la-reveal]'))
    const alto = window.innerHeight
    const pendientes: HTMLElement[] = []
    for (const n of nodos) {
      if (n.getBoundingClientRect().top < alto * 0.92) n.classList.add('la-visible')
      else pendientes.push(n)
    }
    raiz.classList.add('la-anim')
    if (!('IntersectionObserver' in window)) {
      pendientes.forEach(n => n.classList.add('la-visible'))
      return () => raiz.classList.remove('la-anim')
    }
    const io = new IntersectionObserver(
      entradas => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue
          e.target.classList.add('la-visible')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    )
    pendientes.forEach(n => io.observe(n))
    return () => {
      io.disconnect()
      raiz.classList.remove('la-anim')
    }
  }, [])
}

/** `true` en cuanto la página baja más de `umbral` px. Un solo rAF por scroll. */
export function useDesplazado(umbral: number): boolean {
  const [pasado, setPasado] = useState(false)
  useEffect(() => {
    let raf = 0
    const medir = () => {
      raf = 0
      setPasado(window.scrollY > umbral)
    }
    const alScroll = () => {
      if (!raf) raf = requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', alScroll)
      cancelAnimationFrame(raf)
    }
  }, [umbral])
  return pasado
}

/**
 * La sección que cruza la franja central de la pantalla, para subrayar su
 * enlace en el menú. Recibe ids sin `#`.
 */
export function useSeccionActiva(ids: readonly string[]): string | null {
  const [activa, setActiva] = useState<string | null>(null)
  const clave = ids.join('|')
  useEffect(() => {
    const orden = clave.split('|').filter(Boolean)
    const nodos = orden.map(id => document.getElementById(id)).filter((n): n is HTMLElement => n !== null)
    if (!nodos.length || !('IntersectionObserver' in window)) return
    const dentro = new Set<string>()
    const io = new IntersectionObserver(
      entradas => {
        for (const e of entradas) {
          if (e.isIntersecting) dentro.add(e.target.id)
          else dentro.delete(e.target.id)
        }
        setActiva(orden.find(id => dentro.has(id)) ?? null)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    nodos.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [clave])
  return activa
}

/**
 * Cifra que sube al entrar en pantalla. El servidor pinta la cifra FINAL (así
 * la lee un buscador y quien no tiene JavaScript); el conteo es un adorno.
 */
export function Contador({ hasta, sufijo = '', duracion = 1400 }: { hasta: number; sufijo?: string; duracion?: number }) {
  const [valor, setValor] = useState(hasta)
  const ref = useRef<HTMLSpanElement>(null)
  // Antes de pintar: si el conteo va a correr, arranca en 0 sin enseñar
  // primero la cifra final.
  useEfectoAntesDePintar(() => {
    if (!reducirMovimiento() && 'IntersectionObserver' in window) setValor(0)
  }, [hasta])
  useEffect(() => {
    const nodo = ref.current
    if (!nodo || reducirMovimiento() || !('IntersectionObserver' in window)) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        io.disconnect()
        const inicio = performance.now()
        const paso = (t: number) => {
          const p = Math.min((t - inicio) / duracion, 1)
          setValor(Math.round(hasta * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(paso)
        }
        raf = requestAnimationFrame(paso)
      },
      { threshold: 0.5 },
    )
    io.observe(nodo)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [hasta, duracion])
  return (
    <span ref={ref} className="tabular-nums" aria-label={`${hasta}${sufijo}`}>
      <span aria-hidden>{valor}{sufijo}</span>
    </span>
  )
}

/** Barra de avance de lectura: `scaleX`, nunca `width` (no mueve el layout). */
export function BarraAvance({ fondo }: { fondo: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const pintar = () => {
      raf = 0
      const recorrido = document.documentElement.scrollHeight - window.innerHeight
      const p = recorrido > 0 ? Math.min(window.scrollY / recorrido, 1) : 0
      if (ref.current) ref.current.style.transform = `scaleX(${p})`
    }
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(pintar)
    }
    pintar()
    window.addEventListener('scroll', pedir, { passive: true })
    window.addEventListener('resize', pedir)
    return () => {
      window.removeEventListener('scroll', pedir)
      window.removeEventListener('resize', pedir)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div aria-hidden className="la-barra-avance">
      <div ref={ref} className="la-barra-avance__relleno" style={{ background: fondo }} />
    </div>
  )
}

/**
 * Botón flotante de WhatsApp: aparece al bajar del hero, con un pulso suave.
 *
 * 🟠 Hoy no se pinta —la escuela todavía no capturó su número— pero el componente se queda:
 * en cuanto el cliente capture su WhatsApp en «Personalizar mi página» aparece
 * solo, y tiene que verse bien sin tocar código.
 */
export function WhatsAppFlotante({ href, etiqueta, fondo, icono, anillo }: {
  href: string; etiqueta: string; fondo: string; icono: string; anillo: string
}) {
  const visible = useDesplazado(520)
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={etiqueta} title={etiqueta}
      aria-hidden={!visible} tabIndex={visible ? 0 : -1}
      className={`la-wa-flotante${visible ? ' la-wa-flotante--visible' : ''}`}
      style={{ background: fondo, color: icono, ['--la-anillo' as string]: anillo }}>
      <MessageCircle size={26} aria-hidden />
    </a>
  )
}

/**
 * Pregunta frecuente con acordeón animado (`grid-template-rows` 0fr → 1fr). Es
 * un `<button>` real con `aria-expanded`: se abre con teclado y lector de
 * pantalla. Sin `role="region"`: con más de seis preguntas llenaría la página
 * de landmarks.
 */
export function PreguntaFrecuente({ id, pregunta, respuesta, t }: {
  id: string; pregunta: string; respuesta: string; t: TokensSeccion
}) {
  const [abierta, setAbierta] = useState(false)
  return (
    <div className="la-faq" style={{ borderBottom: `1px solid ${t.borde}` }}>
      <h3 className="la-faq__titulo">
        <button type="button" id={`${id}-boton`} aria-expanded={abierta} aria-controls={`${id}-panel`}
          onClick={() => setAbierta(v => !v)} className="la-faq__boton" style={{ color: t.titulo }}>
          <span>{pregunta}</span>
          <span aria-hidden className={`la-faq__icono${abierta ? ' la-faq__icono--abierta' : ''}`}
            style={abierta
              ? { background: t.btnFondo, color: t.btnTexto, border: `1px solid ${t.btnFondo}` }
              : { background: t.superficie, color: t.titulo, border: `1px solid ${t.borde}` }}>
            <Plus size={16} />
          </span>
        </button>
      </h3>
      <div id={`${id}-panel`} aria-hidden={!abierta}
        className={`la-faq__panel${abierta ? ' la-faq__panel--abierta' : ''}`}>
        <div className="la-faq__interior">
          <p className="pb-5 pr-12 text-base leading-relaxed" style={{ color: t.textoSuave }}>{respuesta}</p>
        </div>
      </div>
    </div>
  )
}

/** Inclinación 3D sutil siguiendo al puntero (solo mouse; ≤ 5°). */
export function Inclinable({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const mover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse' || reducirMovimiento()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`
  }
  const soltar = () => {
    if (ref.current) ref.current.style.transform = ''
  }
  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={soltar} className={`la-inclinable ${className}`} style={style}>
      {children}
    </div>
  )
}

/**
 * Parallax del puntero sobre un contenedor: escribe `--la-px` / `--la-py`
 * (-0.5…0.5) y el CSS desplaza las formas con su propia profundidad. Solo con
 * mouse y sin «reducir movimiento». Las formas son tres nodos: recalcular la
 * variable en el contenedor no cuesta nada.
 */
export function useParallaxPuntero(ref: RefObject<HTMLElement>): void {
  useEffect(() => {
    const el = ref.current
    if (!el || reducirMovimiento() || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return
    let raf = 0
    let x = 0
    let y = 0
    const pintar = () => {
      raf = 0
      el.style.setProperty('--la-px', x.toFixed(3))
      el.style.setProperty('--la-py', y.toFixed(3))
    }
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      x = (e.clientX - r.left) / r.width - 0.5
      y = (e.clientY - r.top) / r.height - 0.5
      if (!raf) raf = requestAnimationFrame(pintar)
    }
    const salir = () => {
      x = 0
      y = 0
      if (!raf) raf = requestAnimationFrame(pintar)
    }
    el.addEventListener('pointermove', mover)
    el.addEventListener('pointerleave', salir)
    return () => {
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerleave', salir)
      cancelAnimationFrame(raf)
    }
  }, [ref])
}

/**
 * Copia un valor —el folio verificable— y confirma con un cambio de ícono
 * difuminado.
 *
 * El folio es el dato que la persona teclea en el portal de la SEP: copiarlo
 * evita errores de lectura. Si no hay permiso de portapapeles, sigue a la vista.
 */
export function BotonCopiar({ valor, etiqueta, fondo, texto, borde, className = '' }: {
  valor: string; etiqueta: string; fondo: string; texto: string; borde: string; className?: string
}) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    if (!copiado) return
    const id = setTimeout(() => setCopiado(false), 1800)
    return () => clearTimeout(id)
  }, [copiado])
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
    } catch {
      /* sin permiso de portapapeles: el folio sigue a la vista para copiarlo a mano */
    }
  }
  return (
    <button type="button" onClick={copiar} className={`la-btn la-copiar ${className}`}
      style={{ background: fondo, color: texto, border: `2px solid ${borde}`, outlineColor: borde }}>
      <span className="la-copiar__iconos" aria-hidden>
        <Copy size={18} className={`la-copiar__icono${copiado ? ' la-copiar__icono--oculto' : ''}`} />
        <Check size={18} className={`la-copiar__icono${copiado ? '' : ' la-copiar__icono--oculto'}`} />
      </span>
      <span aria-live="polite">{copiado ? 'Folio copiado' : etiqueta}</span>
    </button>
  )
}
