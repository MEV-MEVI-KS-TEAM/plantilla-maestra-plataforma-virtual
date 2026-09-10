'use client'

import { AvisoMoneda, Equivalencia } from '@/components/moneda-equivalencia'
import { formatearMoneda } from '@/lib/moneda'
import { Fragment, useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogIn, Instagram, Facebook } from 'lucide-react'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { planesPorNivel, getDuracionLabel, getPlanLabelConDuracion, getTotalPlan } from '@/lib/modalidades'
import { interpolar, type LandingConfig } from '@/lib/site-config-core'
import { esPaletaPersonalizada, resolverLanding } from '@/lib/landing-textos'
import { aclarar, oscurecer, hexToRgb, ratioContraste, luminanciaRelativa, colorLegibleSobre, colorLegibleConAlpha, oscurecerHasta } from '@/lib/contraste'
import { precioPublico } from '@/lib/cursos/catalogo'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700', '900'], display: 'swap' })
const dmSans   = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

/* ─── Paleta ──────────────────────────────────────────────────────────── */

/**
 * Paleta de la landing. Los siete tonos base (hero…white) son los de siempre;
 * los siete derivados eran hex sueltos en el JSX y ahora salen de aquí para
 * que, cuando el admin cambie los colores desde el editor, se muevan con ellos.
 */
type Paleta = {
  hero: string; navy: string; royal: string
  bright: string; azure: string; ice: string; white: string
  /** '#90caf9': segundo tono de los gradientes de texto (hero, dolor, CTA). */
  textoClaro: string
  /** '#0d2060': tercer blob de aurora del hero. */
  aurora3: string
  /** '#0a1020': arranque del degradado de la sección Dolor. */
  dolorInicio: string
  /** '#091830': cierre del degradado de la tarjeta Preparatoria. */
  prepaFin: string
  /** '#0a1f4a': cierre del degradado de la columna "Con". */
  conFin: string
  /** '#0d3080': cierre del degradado del CTA final. */
  ctaFin: string
  /** '#050a14': fondo del footer. */
  footer: string
  /**
   * '#FFFFFF': el color que va ENCIMA del acento (el avatar del testimonio).
   * Es lo único que necesita contrastar con `royal`, no con el papel.
   */
  sobreAcento: string
  /**
   * '#0D1B3E88': el tono de los textos SECUNDARIOS sobre el papel. Con la
   * paleta original es el literal de siempre; con una personalizada se garantiza
   * que cumpla AA, porque `navy` a media opacidad sobre blanco se queda corto en
   * cuanto el color de marca no es un azul muy oscuro.
   */
  navySuave: string
  /**
   * '#1565C0': cierre del degradado del numerito 01..04 del proceso. Arranca en
   * `navy` (oscuro), así que este extremo tiene que admitir el MISMO color de
   * texto: con una paleta personalizada se oscurece el acento hasta lograrlo.
   */
  stepFin: string
  /** '#ffffff': el texto de ese numerito, legible en los dos extremos. */
  sobreStep: string
  /**
   * El fondo oscuro MÁS CLARO que llega a pintar la landing (las secciones
   * apilan capas translúcidas sobre `navy`). Es contra el que hay que medir un
   * texto secundario, no contra el hero.
   */
  refOscuro: string
  /** `false` en la paleta de fábrica: ahí no se ajusta nada y el pixel no cambia. */
  personalizada: boolean
  /**
   * '#1565C0': el acento AJUSTADO para servir de color de texto sobre el papel.
   * Idéntico a `royal` cuando el acento ya cumple AA sobre blanco, que es el
   * caso del azul de fábrica.
   */
  royalTexto: string
}

/**
 * La paleta de SIEMPRE, literal por literal (los derivados en minúsculas tal
 * cual estaban en el JSX). Es la que ve todo cliente cuya site_config no toque
 * los colores — incluido el que elija la paleta "Original" del editor, que
 * escribe los mismos valores que trae CONFIG.
 */
const PALETA_ORIGINAL: Paleta = {
  hero: '#080F1E', navy: '#0D1B3E', royal: '#1565C0',
  bright: '#1E88E5', azure: '#42A5F5', ice: '#E3F2FD', white: '#FFFFFF',
  textoClaro: '#90caf9',
  aurora3: '#0d2060',
  dolorInicio: '#0a1020',
  prepaFin: '#091830',
  conFin: '#0a1f4a',
  ctaFin: '#0d3080',
  footer: '#050a14',
  // El azul de fábrica ya cumple AA sobre blanco (4.6), así que `royalTexto`
  // ES `royal`: con la paleta original no cambia ni un byte de lo pintado.
  sobreAcento: '#FFFFFF',
  royalTexto: '#1565C0',
  navySuave: '#0D1B3E88',
  stepFin: '#1565C0',
  sobreStep: '#ffffff',
  refOscuro: '#0D1B3E',
  personalizada: false,
}

/**
 * Paleta que pinta la landing para una config dada.
 *
 * Se compara contra CONFIG (el config.ts del cliente), NO contra un azul fijo:
 * hoy la landing ignora CONFIG.colores (viste su propio azul) y eso no cambia.
 * Solo cuando el admin cambió algún color desde el editor la landing se viste
 * con la marca; si no tocó nada — o eligió la paleta "Original", que escribe
 * los mismos valores — conserva sus hex de siempre.
 *
 * MAPEO con paleta personalizada:
 *   hero   ← colores.primario          navy   ← colores.secundario
 *   royal  ← colores.acento            bright ← colores.acentoHover
 *   azure  ← aclarar(acento, 0.35)     ice    ← colores.acentoClaro
 *   white  ← colores.textoSobreAcento
 * Derivados (el factor conserva la relación que hoy guardan con el azul):
 *   textoClaro  ← aclarar(azure, 0.45)    #90caf9 ≈ azure un 45 % más claro
 *   dolorInicio ← oscurecer(navy, 0.48)   #0a1020 ≈ navy a la mitad
 *   prepaFin    ← oscurecer(navy, 0.22)   #091830 ≈ navy un quinto más oscuro
 *   footer      ← oscurecer(navy, 0.68)   #050a14 ≈ navy a un tercio
 *   aurora3     ← oscurecer(royal, 0.50)  #0d2060 ≈ royal a la mitad
 *   conFin      ← oscurecer(royal, 0.61)  #0a1f4a ≈ royal a dos quintos
 *   ctaFin      ← oscurecer(royal, 0.33)  #0d3080 ≈ royal a dos tercios
 * Los tres oscuros que hoy rondan el navy (dolor, prepa, footer) se derivan
 * de navy y los tres más azules (aurora, con, cta) de royal: cada uno queda
 * del lado del tono al que hoy se parece.
 * Los rgba sueltos (rgba(21,101,192,…), (66,165,245,…), (227,242,253,…),
 * (8,15,30,…)) van por `conAlpha` sobre royal / azure / ice / hero.
 * Los alfas por concatenación (`${C.royal}55`) siguen valiendo: aclarar /
 * oscurecer devuelven siempre #RRGGBB.
 *
 * El interruptor —`esPaletaPersonalizada`— vive en src/lib/landing-textos.ts:
 * es lógica pura, compara los hex NORMALIZADOS (trim + mayúsculas, para que
 * `#3b82f6` y `#3B82F6` cuenten como el mismo color) y así se prueba sin montar
 * el componente. Es el mismo interruptor que decide si se inyectan las
 * variables CSS de `variablesLanding`: uno solo, para que no puedan discrepar.
 */
function paletaLanding(colores: LandingConfig['colores']): Paleta {
  if (!esPaletaPersonalizada(colores)) return PALETA_ORIGINAL
  const navy = colores.secundario
  const royal = colores.acento
  const azure = aclarar(royal, 0.35)

  // 🛑 `white` ES EL PAPEL DE LA LANDING, no "el texto sobre el acento".
  //
  // Aquí vivía el peor fallo de la personalización: `white` salía de
  // `colores.textoSobreAcento`. Ese token contrasta con el ACENTO, que es otra
  // pregunta. GRATIA (#198) lo tiene en verde petróleo —correcto: sobre su oro
  // el blanco da 2.67 y el verde 5.34— y la landing lo tomó como su blanco.
  // Resultado: `background: C.white` pintó la página entera de verde petróleo y
  // los títulos del hero, que van en `C.white` sobre ese mismo verde, quedaron
  // en **ratio 1.00**: texto invisible, no "poco contraste". Diez nodos, el
  // nombre de la escuela y el h1 entre ellos.
  //
  // El papel es `superficie` (blanco en la plantilla y en todo cliente en light
  // mode). Y como también sirve de texto sobre los fondos oscuros de la
  // landing, se garantiza que sea legible sobre el más claro de los dos.
  const white = colorLegibleSobre(colores.superficie, navy, 4.5)

  // 🛑 `bright` ES "EL ACENTO UN PASO MÁS CLARO", no el color de hover.
  //
  // Salía de `colores.acentoHover`, y por convención de la plantilla ese token
  // es el acento un paso más OSCURO (para el hover de un botón). Eso INVIERTE
  // la relación que tiene con `royal` en el diseño original (#1E88E5 es más
  // claro que #1565C0) y rompe los degradados `royal → bright`: en GRATIA el
  // botón "Crear cuenta" iba de oro a oro oscuro, y ningún color de texto sirve
  // para los dos extremos a la vez — el blanco falla en el oro y el verde falla
  // en el oro oscuro. Derivándolo se conserva la relación y el degradado entero
  // admite el mismo texto.
  const bright = aclarar(royal, 0.12)

  // El acento como TEXTO sobre el papel. Un acento de marca no siempre sirve:
  // el oro de GRATIA da 2.67 sobre blanco. Se oscurece lo justo y el token de
  // marca (`royal`) queda intacto para rellenos, bordes y barras.
  const royalTexto = colorLegibleSobre(royal, white, 5.2)

  // `ice` es texto claro sobre los fondos OSCUROS (hero, navy, footer), casi
  // siempre con alpha. `acentoClaro` puede ser cualquier cosa —el oro suave de
  // GRATIA es casi blanco y funciona, pero un cliente con acentoClaro medio
  // dejaría ilegible medio hero—, así que se exige que cumpla sobre `hero`.
  // `ice` nunca se pinta sólido: va con alpha entre .45 y .75 sobre los fondos
  // oscuros. Exigirle contraste en sólido no basta —el tono aguanta, la mezcla
  // no—, así que se comprueba ya mezclado al alpha MÁS BAJO que usa la landing.
  // El fondo de referencia NO es `hero`: la landing apila capas translúcidas
  // sobre `navy` y las secciones intermedias acaban bastante más claras que el
  // hero (medido: hasta un 20 % por encima). Se calibra contra ese peor caso o
  // el texto cumple en la portada y falla tres secciones más abajo.
  const candidatosOscuros = [aclarar(navy, 0.22), oscurecer(royal, 0.33), oscurecer(royal, 0.61)]
  const fondoOscuroMasClaro = candidatosOscuros.reduce((a, b) =>
    luminanciaRelativa(a) >= luminanciaRelativa(b) ? a : b)
  const ice = colorLegibleConAlpha(colores.acentoClaro, fondoOscuroMasClaro, 0.45, 4.5)

  return {
    hero: colores.primario, navy, royal,
    bright, azure, ice, white,
    textoClaro: aclarar(azure, 0.45),
    aurora3: oscurecer(royal, 0.5),
    dolorInicio: oscurecer(navy, 0.48),
    prepaFin: oscurecer(navy, 0.22),
    conFin: oscurecer(royal, 0.61),
    ctaFin: oscurecer(royal, 0.33),
    footer: oscurecer(navy, 0.68),
    sobreAcento: colores.textoSobreAcento,
    royalTexto,
    navySuave: colorLegibleSobre(navy, white, 4.5),
    // El degradado del numerito arranca en `navy`, que es oscuro. Se oscurece
    // el acento hasta que el mismo blanco que ya funciona sobre `navy` funcione
    // también en el cierre: un degradado que va de oscuro a claro no admite
    // ningún color de texto en todo su recorrido.
    stepFin: colorLegibleSobre(royal, white, 4.5) === royal
      ? royal
      : oscurecerHasta(royal, white, 4.5),
    sobreStep: white,
    refOscuro: fondoOscuroMasClaro,
    personalizada: true,
  }
}

/**
 * `rgba(r,g,b,a)` a partir de un hex de la paleta. Sustituye los
 * `rgba(66,165,245,0.22)` que estaban escritos a mano. Sin espacios y con el
 * alpha tal cual se pasa, para que con la paleta original el string sea
 * BYTE-idéntico al literal de antes: el HTML prerenderizado es el invariante.
 * Hex irreconocible → se devuelve tal cual, igual que aclarar/oscurecer.
 */
/**
 * Texto SECUNDARIO sobre los fondos oscuros de la landing.
 *
 * Con la paleta de fábrica devuelve el rgba de siempre, byte a byte. Con una
 * personalizada sube el alpha lo justo para llegar a AA: bajar la opacidad es
 * una decisión de diseño legítima —así se lee "secundario"— pero por debajo de
 * cierto punto el texto deja de ser secundario y pasa a ser ilegible, y dónde
 * está ese punto depende de lo oscuro que sea el fondo de cada marca.
 *
 * Se sube en pasos de 0.05 y nunca se pasa de 1: si ni opaco cumpliera, el
 * problema sería el tono `ice`, que ya se garantiza en `paletaLanding`.
 */
function iceSuave(C: Paleta, alpha: number): string {
  if (!C.personalizada) return conAlpha(C.ice, alpha)
  for (let a = alpha; a <= 1.0001; a += 0.05) {
    const mezclado = mezclarSobre(C.ice, C.refOscuro, Math.min(a, 1))
    if (ratioContraste(mezclado, C.refOscuro) >= 4.5) return conAlpha(C.ice, Math.min(a, 1))
  }
  return iceSuave(C, 1)
}

/** `hex` pintado con `alpha` encima de `fondo`, resuelto a un hex sólido. */
function mezclarSobre(hex: string, fondo: string, alpha: number): string {
  const c = hexToRgb(hex), b = hexToRgb(fondo)
  if (!c || !b) return hex
  const m = (x: number, y: number) => Math.round(x * alpha + y * (1 - alpha))
  return '#' + [m(c.r, b.r), m(c.g, b.g), m(c.b, b.b)].map(v => v.toString(16).padStart(2, '0')).join('')
}

function conAlpha(hex: string, alpha: number | string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

/**
 * Variables CSS que la landing le pasa a globals.css.
 *
 * Los azules de marca de las clases que SOLO usa esta landing (.cjvb-*, .faq-*,
 * .testi-card, .benefit-card, .scroll-progress) están escritos en CSS y no
 * pueden leer `C`. Cada uno quedó como `var(--landing-x, <su literal de
 * siempre>)`, y aquí van los valores que sustituyen a esos literales.
 *
 * Solo se inyectan con la paleta personalizada: sin ellas cada regla cae a su
 * fallback y el CSS pinta exactamente lo de siempre. Por eso el sitio de un
 * cliente que no toca colores —los ~144— no cambia ni un byte, ni en el HTML
 * (el style del div raíz no crece) ni en lo pintado.
 *
 * El alpha va con el MISMO texto que el fallback ('.22' como string, 0.08 como
 * número) para que el rgba resultante sea byte a byte el de la regla CSS.
 * Solo aparecen los tonos que el CSS realmente usa: hero y bright no salen
 * porque ninguna de esas clases los lleva.
 */
function variablesLanding(C: Paleta): CSSProperties {
  return {
    ['--landing-navy'  as string]: C.navy,
    ['--landing-royal' as string]: C.royal,
    ['--landing-azure' as string]: C.azure,
    ['--landing-ice'   as string]: C.ice,
    ['--landing-white' as string]: C.white,
    // Tonos que garantizan contraste con una paleta personalizada. Los
    // fallbacks de cada regla siguen siendo los literales de siempre, así que
    // sin paleta propia el CSS pinta exactamente lo de antes.
    ['--landing-sobre-acento' as string]: C.sobreAcento,
    ['--landing-royal-texto'  as string]: C.royalTexto,
    ['--landing-navy-suave'   as string]: C.navySuave,
    ['--landing-step-fin'     as string]: C.stepFin,
    ['--landing-sobre-step'   as string]: C.sobreStep,
    ['--landing-royal-10' as string]: conAlpha(C.royal, 0.1),
    ['--landing-royal-12' as string]: conAlpha(C.royal, 0.12),
    ['--landing-azure-10' as string]: conAlpha(C.azure, '.1'),
    ['--landing-azure-22' as string]: conAlpha(C.azure, '.22'),
    ['--landing-azure-45' as string]: conAlpha(C.azure, '.45'),
    ['--landing-azure-60' as string]: conAlpha(C.azure, 0.6),
    ['--landing-navy-08'  as string]: conAlpha(C.navy, 0.08),
    ['--landing-navy-13'  as string]: conAlpha(C.navy, 0.13),
    ['--landing-navy-35'  as string]: conAlpha(C.navy, '.35'),
    ['--landing-navy-68'  as string]: conAlpha(C.navy, '.68'),
  }
}

/* ─── Modalidades ─────────────────────────────────────────────────────── */

/**
 * F3B — aquí vivían copias locales de `modalidadesActivas` / `duracionLabel` /
 * `planLabel`, porque los helpers de '@/lib/modalidades' leían `CONFIG` sin
 * parámetros y la landing necesita las modalidades del config FUSIONADO
 * (`mensualidad` y `activa` los edita el admin desde su panel). Ya no: los
 * helpers aceptan la tabla como parámetro y se les pasa `config.modalidades`
 * en cada llamada. Misma lógica, una sola fuente.
 */

const fmt = (n: number) => formatearMoneda(n, CONFIG, { conCodigo: true })

/* ─── Scroll Progress ─────────────────────────────────────────────────── */
function ScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      setPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <div className="scroll-progress" style={{ width: `${pct}%` }} />
}

/* ─── Floating Particles ──────────────────────────────────────────────── */
function FloatingParticles({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    // Se parsea una vez, fuera del loop: son 70 partículas por frame.
    const rgb = hexToRgb(color) ?? { r: 66, g: 165, b: 245 }
    let animId: number
    type P = { x: number; y: number; r: number; vx: number; vy: number; op: number }
    const ps: P[] = []
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    for (let i = 0; i < 70; i++)
      ps.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height,
        r: Math.random()*2+0.4, vx: (Math.random()-.5)*.25, vy: -(Math.random()*.4+.1),
        op: Math.random()*.55+.08 })
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of ps) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.op})`; ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.y < -10) { p.y = canvas.height+10; p.x = Math.random()*canvas.width }
        if (p.x < -10) p.x = canvas.width+10
        if (p.x > canvas.width+10) p.x = -10
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [color])
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 w-full h-full" />
}

/* ─── Animated Counter ────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (done) return
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      setDone(true); obs.disconnect()
      const t0 = Date.now(), dur = 1800
      const tick = () => {
        const prog = Math.min((Date.now()-t0)/dur, 1)
        setVal(Math.round((1-Math.pow(1-prog,3))*to))
        if (prog < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: .5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, done])
  return <span ref={ref}>{val}{suffix}</span>
}

/* ─── Scroll Reveal ───────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sr-visible'); obs.unobserve(e.target) } })
    }, { threshold: .1, rootMargin: '0px 0px -32px 0px' })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ─── 3D Card ─────────────────────────────────────────────────────────── */
function Card3D({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const rx = ((e.clientY-r.top-r.height/2)/(r.height/2))*-9
    const ry = ((e.clientX-r.left-r.width/2)/(r.width/2))*9
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.025,1.025,1.025)`
  }
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)' }
  return (
    <div ref={ref} className={className}
      style={{ ...style, transition: 'transform .18s cubic-bezier(.4,0,.2,1)', transformStyle: 'preserve-3d', willChange: 'transform' }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

/* ─── FAQ Item ────────────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const toggle = useCallback(() => setOpen(v => !v), [])
  useEffect(() => {
    const el = bodyRef.current; if (!el) return
    el.style.maxHeight = open ? `${el.scrollHeight}px` : '0px'
  }, [open])
  return (
    <div className="faq-item">
      <button className="faq-btn" onClick={toggle} aria-expanded={open}>
        <span>{q}</span>
        <span className={`faq-icon${open ? ' open' : ''}`}>+</span>
      </button>
      <div ref={bodyRef} className={`faq-body${open ? ' open' : ''}`}>
        <p className="faq-body-inner">{a}</p>
      </div>
    </div>
  )
}

/* ─── Floating WA ─────────────────────────────────────────────────────── */
function FloatingWA({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="float-wa" aria-label="Contáctanos por WhatsApp">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="#fff" aria-hidden>
        <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.73 1.79 6.72L2 30l7.5-1.77A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.4 19.4c-.35-.18-2.07-1.02-2.39-1.14-.32-.12-.55-.18-.78.18-.23.35-.9 1.14-1.1 1.37-.2.23-.4.26-.76.09-.36-.18-1.52-.56-2.9-1.8-1.07-.97-1.8-2.16-2.01-2.52-.21-.36-.02-.55.16-.73.16-.16.36-.41.53-.62.18-.2.24-.35.36-.59.12-.23.06-.44-.03-.62-.09-.18-.78-1.87-1.07-2.56-.28-.67-.56-.58-.77-.59h-.65c-.23 0-.6.09-.91.44-.32.35-1.2 1.17-1.2 2.85s1.23 3.31 1.4 3.54c.18.23 2.43 3.71 5.88 5.21.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.03-.83 2.32-1.63.28-.8.28-1.49.2-1.63-.09-.15-.32-.23-.67-.41z"/>
      </svg>
    </a>
  )
}

/* ─── Inline SVGs ─────────────────────────────────────────────────────── */
const CheckIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="M2.5 7L5.5 10L11.5 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
    <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.73 1.79 6.72L2 30l7.5-1.77A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.4 19.4c-.35-.18-2.07-1.02-2.39-1.14-.32-.12-.55-.18-.78.18-.23.35-.9 1.14-1.1 1.37-.2.23-.4.26-.76.09-.36-.18-1.52-.56-2.9-1.8-1.07-.97-1.8-2.16-2.01-2.52-.21-.36-.02-.55.16-.73.16-.16.36-.41.53-.62.18-.2.24-.35.36-.59.12-.23.06-.44-.03-.62-.09-.18-.78-1.87-1.07-2.56-.28-.67-.56-.58-.77-.59h-.65c-.23 0-.6.09-.91.44-.32.35-1.2 1.17-1.2 2.85s1.23 3.31 1.4 3.54c.18.23 2.43 3.71 5.88 5.21.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.03-.83 2.32-1.63.28-.8.28-1.49.2-1.63-.09-.15-.32-.23-.67-.41z"/>
  </svg>
)

/* ══════════════════════════════════════════════════════════════════════ */
export interface CursoCatalogo {
  id: string
  nombre: string
  descripcion: string | null
  tipo: string
  horas: number | null
  duracion_meses: number | null
  precio_inscripcion: number
  precio_mensualidad: number
}

/**
 * Landing pública. Es un componente CLIENTE (animaciones, canvas del hero,
 * acordeón del FAQ), así que NO consulta la base de datos: el catálogo llega ya
 * resuelto desde el Server Component de src/app/page.tsx.
 *
 * Ese reparto no es estético. El invariante de B2 es que NINGÚN componente
 * cliente lee tablas `curso_*`: el navegador tiene la anon key y podría repetir
 * la consulta a mano. Aquí solo se pinta lo que el servidor ya decidió mostrar.
 *
 * `config` ("Personalizar mi página", F1) llega también desde page.tsx: es
 * config.ts fusionado con los overrides de site_config, recortado a lo público
 * MÁS `landing` (`toLandingConfig`). Esta es la única pantalla que pinta los
 * textos de landing.*, y por eso los recibe por props en vez de por el
 * provider: así no viajan en el HTML de las demás rutas. Todo lo EDITABLE
 * (logo, nombre, contacto, redes, colores, textos, precios, modalidades) se lee
 * de ahí; CONFIG queda solo para lo que no se edita (niveles, dominio). Con
 * site_config vacía `config` es config.ts tal cual y la página no cambia ni un
 * byte.
 */
export function LandingClient({ catalogo, config }: { catalogo: CursoCatalogo[]; config: LandingConfig }) {
  const p = config.precios
  const wa = config.whatsappUrl
  // Los textos pasan por `resolverLanding`: rellena desde CONFIG.landing lo que
  // el config.ts del cliente no traiga y garantiza que toda lista sea arreglo.
  // Sin esto, un cliente legacy sin las 35 claves de F3 se queda sin landing
  // (`L.contadores.map` sobre undefined es un TypeError que tira la página).
  const L = resolverLanding(config.landing)
  const testimonios = L.testimonios
  const mods = config.modalidades
  // Los planes de CADA tarjeta salen de su nivel, no de la lista entera.
  //
  // Con `getModalidadesActivas(mods)` las dos tarjetas pintaban los mismos
  // planes, que es correcto mientras la escuela venda todo a todos. En una
  // oferta asimétrica —EDUHCO #197: Secundaria solo 3 meses, Preparatoria solo
  // 6— eso anuncia dos planes que no existen, y el aspirante que hace clic
  // aterriza en un registro donde no están. Mientras ninguna modalidad declare
  // `nivel`, las dos listas son idénticas a `activas` y la página no cambia.
  const planesPrepa = planesPorNivel('preparatoria', mods)
  const planesSec   = planesPorNivel('secundaria', mods)
  const C = paletaLanding(config.colores)
  // La acreditación NO es branding: sale de `CONFIG`, no de la config editable.
  // Nadie debe poder encender desde un panel una validez oficial que la escuela
  // no tiene, ni cambiar el folio que la persona va a teclear en el portal.
  const VALIDEZ = CONFIG.landing.validezOficial
  // Con la paleta personalizada el div raíz reparte los tonos a las clases de
  // globals.css (ver variablesLanding). Sin ella no se inyecta ninguna
  // variable: el style queda idéntico al de siempre y el CSS usa sus fallbacks.
  const varsPaleta = esPaletaPersonalizada(config.colores) ? variablesLanding(C) : undefined
  // Placeholders de los textos editables ({duracion}, {nombre}, {inscripcion}…).
  // Se sustituyen en TODOS los textos de landing.*, no solo en los que hoy los
  // traen: el editor los ofrece en cualquier campo. Un texto sin llaves sale
  // intacto.
  const vars = {
    duracion: getDuracionLabel(mods),
    nombre: config.nombre,
    nombreCompleto: config.nombreCompleto,
    whatsapp: config.whatsapp,
    inscripcion: fmt(p.inscripcion),
  }
  // `s?: string` a propósito: `resolverLanding` ya garantiza las 42 claves,
  // pero DENTRO de las listas (`contadores[i].etiqueta`, `faq_items[i].a`…) los
  // campos siguen viniendo del config.ts del cliente. Un campo que falte pinta
  // vacío en lugar de escribir "undefined" en la página.
  const texto = (s?: string) => interpolar(s ?? '', vars)
  useScrollReveal()

  return (
    <div className={dmSans.className} style={{ background: C.white, color: C.navy, minHeight: '100vh', ...varsPaleta }}>
      <ScrollProgress />
      <FloatingWA href={wa} />

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-10 h-[68px]"
        style={{ background: conAlpha(C.hero, 0.85), backdropFilter: 'blur(20px)', borderBottom: `1px solid ${conAlpha(C.azure, 0.1)}` }}>
        <Link href="/" className="flex items-center gap-3 min-w-0">
          {/* `logoOscuro` llega YA RESUELTO por el merge (`resolverLogos`): si el
              admin subió solo el logo claro, aquí viene ese logo. Nada de
              `logoOscuro || logo` en los componentes. */}
          <Image src={config.logoOscuro} alt={config.nombreCompleto} width={180} height={60} className="h-12 md:h-14 w-auto object-contain flex-shrink-0" priority />
          <span className={`hidden sm:inline font-semibold text-[15px] ${playfair.className}`} style={{ color: C.white, letterSpacing: '.02em' }}>
            {config.nombreCompleto}
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {/* El alpha va como texto ('.22') para conservar el literal de siempre byte a byte. */}
          <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ color: C.azure, border: `1px solid ${conAlpha(C.azure, '.22')}`, background: 'transparent' }}>
            <LogIn size={15} />Iniciar sesión
          </Link>
          <Link href="/register" className="px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: `linear-gradient(135deg,${C.royal},${C.bright})`, color: C.sobreAcento, boxShadow: `0 4px 14px ${C.royal}55` }}>
            Crear cuenta →
          </Link>
        </nav>
      </header>

      <main style={{ paddingTop: 68 }}>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="relative min-h-[calc(100dvh-68px)] flex flex-col justify-center items-center px-4 sm:px-8 py-20 overflow-hidden text-center"
          style={{ background: C.hero }}>

          {/* Aurora blobs */}
          <div aria-hidden className="aurora-blob aurora-1" style={{ width: 520, height: 520, background: `${C.royal}`, top: '-15%', left: '-10%' }} />
          <div aria-hidden className="aurora-blob aurora-2" style={{ width: 400, height: 400, background: `${C.bright}`, bottom: '-10%', right: '-8%' }} />
          <div aria-hidden className="aurora-blob aurora-3" style={{ width: 300, height: 300, background: C.aurora3, top: '40%', left: '60%' }} />

          {/* Grain texture */}
          <svg aria-hidden className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.032]">
            <filter id="grain-hero"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
            <rect width="100%" height="100%" filter="url(#grain-hero)"/>
          </svg>

          {/* Particles */}
          <FloatingParticles color={C.azure} />

          {/* Watermark */}
          <div aria-hidden className={`pointer-events-none absolute inset-0 flex items-center justify-center select-none ${playfair.className}`}
            style={{ fontSize: 'clamp(140px,32vw,420px)', fontWeight: 900, color: conAlpha(C.royal, 0.042), letterSpacing: '-0.06em', lineHeight: 1 }}>
            {config.nombre}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto w-full">
            {/* Logo con glow premium */}
            <div className="flex justify-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-3xl bg-white/30 rounded-full scale-90" />
                <Image
                  src={config.logoOscuro}
                  alt={config.nombreCompleto}
                  width={500} height={500} priority
                  className="relative w-[260px] md:w-[380px] lg:w-[480px] h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                />
              </div>
            </div>

            <div className="flex justify-center mb-7">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
                style={{ background: conAlpha(C.royal, 0.22), color: C.azure, border: `1px solid ${conAlpha(C.azure, 0.22)}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                {texto(L.hero_badge_superior)}
                {L.ciudad ? ` · ${L.ciudad}` : ''}
              </span>
            </div>

            <h1 className={`${playfair.className} hero-title font-bold mb-2`}
              style={{ fontSize: 'clamp(1.7rem,4.5vw,3.75rem)', lineHeight: 1.08, color: C.white, whiteSpace: 'nowrap' }}>
              {texto(L.hero_titulo)}
            </h1>
            <p className={`${playfair.className} font-bold mb-7`}
              style={{ fontSize: 'clamp(1.7rem,4.5vw,3.75rem)', lineHeight: 1.08,
                background: `linear-gradient(135deg,${C.azure},${C.textoClaro})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', whiteSpace: 'nowrap' }}>
              {texto(L.hero_highlight)}
            </p>

            {/* El '\n' del texto es el <br> de siempre entre líneas. El espacio
                delante de cada línea siguiente es el que había en el JSX: en
                móvil (br oculto) es lo que separa "trabajo." de "Con". */}
            <p className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: iceSuave(C, 0.75) }}>
              {texto(L.hero_subtitulo).split('\n').map((linea, i) => (
                i === 0 ? linea : <Fragment key={i}><br className="hidden sm:block" />{` ${linea}`}</Fragment>
              ))}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register" className="cjvb-btn-white w-full sm:w-auto">{texto(L.hero_cta_primario)}</Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="cjvb-btn-outline w-full sm:w-auto">
                <WaIcon />{` ${texto(L.hero_cta_whatsapp)}`}
              </a>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t pt-10" style={{ borderColor: conAlpha(C.azure, 0.14) }}>
              {L.contadores.map((s, i) => (
                <div key={i}>
                  <div className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.azure }}>
                    <Counter to={s.valor} suffix={s.sufijo} />
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: C.white }}>{texto(s.etiqueta)}</div>
                  <div className="text-xs mt-0.5" style={{ color: iceSuave(C, 0.45) }}>{texto(s.sub)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DOLOR / PAS ──────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-4 sm:px-8 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg,${C.dolorInicio} 0%,${C.navy} 100%)` }}>
          <div aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 100%,${C.royal}28,transparent 65%)` }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <div data-reveal className="text-center mb-12">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: C.azure }}>{texto(L.dolor_kicker)}</p>
              <h2 className={`text-2xl sm:text-3xl font-bold ${playfair.className}`} style={{ color: C.white }}>
                {texto(L.dolor_titulo)}
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 mb-12">
              {L.dolor_items.map((it, i) => (
                <div key={i} className="pain-card" data-reveal data-d={String(i+1)}>
                  <div className="text-3xl mb-3">{it.icono}</div>
                  <h3 className="font-semibold text-[15px] mb-2" style={{ color: C.ice }}>{texto(it.titulo)}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: iceSuave(C, 0.55) }}>{texto(it.desc)}</p>
                </div>
              ))}
            </div>
            <div data-reveal className="text-center">
              <p className={`text-xl sm:text-2xl font-bold ${playfair.className}`} style={{ color: C.white }}>
                {texto(L.dolor_cierre)}{' '}
                <span style={{ background: `linear-gradient(135deg,${C.azure},${C.textoClaro})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {config.nombreCompleto}
                </span>
              </p>
              <p className="mt-3 text-sm sm:text-base" style={{ color: iceSuave(C, 0.6) }}>
                {texto(L.dolor_cierre_sub)}
              </p>
            </div>
          </div>
        </section>

        {/* ── PRECIOS ──────────────────────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-8" style={{ background: '#EEF2FF' }}>
          <div className="max-w-5xl mx-auto">
            <div data-reveal className="text-center mb-14">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ background: `${C.royal}15`, color: C.royalTexto }}>{texto(L.programas_kicker)}</span>
              <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.navy }}>
                {texto(L.programas_titulo)}
              </h2>
              <p className="mt-3 text-sm sm:text-base max-w-md mx-auto" style={{ color: C.navySuave }}>
                {texto(L.programas_subtitulo)}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {(CONFIG.niveles as readonly string[]).includes('preparatoria') && (
              <div data-reveal data-d="1">
                <Card3D className="rounded-2xl p-8 sm:p-10 h-full flex flex-col"
                  style={{ background: `linear-gradient(150deg,${C.navy} 0%,${C.prepaFin} 100%)`,
                    boxShadow: `0 32px 80px ${C.navy}50`, border: `1px solid ${conAlpha(C.azure, 0.18)}` }}>
                  <div className="flex justify-between items-start mb-5">
                    <h3 className={`text-2xl font-bold ${playfair.className}`} style={{ color: C.white }}>Preparatoria</h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: `${C.bright}22`, color: C.azure, border: `1px solid ${C.azure}30` }}>{texto(L.programas_popular)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-6" style={{ color: C.azure }}>Inscripción: {fmt(p.inscripcion)}</p>
                  <div className="space-y-3 flex-1">
                    {[
                      // Rótulo PÚBLICO: la escuela puede vender "Express" lo que por
                      // dentro es "3 Meses". El registro y la constancia siguen con el interno.
                      ...planesPrepa.map(m => ({ label: `Plan ${getPlanLabelConDuracion(m, mods)}`, price: m.mensualidad, unit: '/mes' })),
                      // Total del plan: apagado por defecto en toda la flota (ver
                      // landing.mostrarTotalPlan). Encendido, es lo que deja ver que dos
                      // planes de ritmos distintos pueden costar exactamente lo mismo.
                      ...(CONFIG.landing.mostrarTotalPlan
                        ? planesPrepa.map(m => ({ label: `Total ${getPlanLabelConDuracion(m, mods)}`, price: getTotalPlan(m, p.inscripcion), unit: '' }))
                        : []),
                      { label: 'Certificación', price: p.certificacionPreparatoria, unit: ' único' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-sm" style={{ color: iceSuave(C, 0.7) }}>{row.label}</span>
                        <span className={`text-base font-bold ${playfair.className}`} style={{ color: C.azure }}>
                          {fmt(row.price)}<span className="text-xs font-normal opacity-70">{row.unit}</span>
                          <Equivalencia monto={row.price} style={{ color: iceSuave(C, 0.55) }} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" className="mt-8 block w-full text-center py-3.5 rounded-xl font-bold transition-all"
                    style={{ background: `linear-gradient(135deg,${C.royal},${C.bright})`, color: C.sobreAcento, boxShadow: `0 8px 28px ${C.royal}55` }}>
                    {texto(L.programas_cta)}
                  </Link>
                </Card3D>
              </div>
              )}
              {(CONFIG.niveles as readonly string[]).includes('secundaria') && (
              <div data-reveal data-d="2">
                <Card3D className="rounded-2xl p-8 sm:p-10 h-full flex flex-col"
                  style={{ background: C.white, boxShadow: `0 24px 60px ${C.navy}12`, border: `1px solid ${conAlpha(C.royal, 0.12)}` }}>
                  <div className="mb-5">
                    <h3 className={`text-2xl font-bold ${playfair.className}`} style={{ color: C.navy }}>Secundaria</h3>
                  </div>
                  <p className="text-xs font-semibold mb-6" style={{ color: C.royalTexto }}>Inscripción: {fmt(p.inscripcion)}</p>
                  <div className="space-y-3 flex-1">
                    {[
                      // Alias legacy a propósito: el merge los deriva de la mensualidad cuando el admin la cambia.
                      ...planesSec.map(m => ({ label: `Plan ${getPlanLabelConDuracion(m, mods)}`, price: m.id === '3_meses' ? p.secundaria_3meses_normal : p.secundaria_6meses_normal, unit: '/mes' })),
                      ...(CONFIG.landing.mostrarTotalPlan
                        ? planesSec.map(m => ({
                            label: `Total ${getPlanLabelConDuracion(m, mods)}`,
                            price: getTotalPlan(
                              { ...m, mensualidad: m.id === '3_meses' ? p.secundaria_3meses_normal : p.secundaria_6meses_normal },
                              p.inscripcion,
                            ),
                            unit: '',
                          }))
                        : []),
                      { label: 'Certificación', price: p.certificacionSecundaria, unit: ' único' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: `${C.royal}08`, border: `1px solid ${C.royal}14` }}>
                        <span className="text-sm" style={{ color: C.navySuave }}>{row.label}</span>
                        <span className={`text-base font-bold ${playfair.className}`} style={{ color: C.royalTexto }}>
                          {fmt(row.price)}<span className="text-xs font-normal opacity-60">{row.unit}</span>
                          <Equivalencia monto={row.price} style={{ color: C.navySuave }} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" className="mt-8 block w-full text-center py-3.5 rounded-xl font-bold text-white transition-all"
                    style={{ background: C.navy, boxShadow: `0 8px 24px ${C.navy}30` }}>
                    {texto(L.programas_cta)}
                  </Link>
                </Card3D>
              </div>
              )}
            </div>
            {/* Solo se pinta si la escuela NO cobra en pesos (ver AvisoMoneda). */}
            <AvisoMoneda className="mt-8 text-center text-xs" style={{ color: C.navySuave }} />
          </div>
        </section>

        {/* ── VALIDEZ OFICIAL: los documentos y el folio verificable ──
            Portado de imc-digital-school (bloques «VALIDEZ OFICIAL B y C»).
            🛑 Solo se pinta si la escuela COMPARTE el convenio de la red
            (`landing.validezOficial.activa`). Apagada, no existe: no se le
            atribuye a nadie una acreditación que no tiene. */}
        {VALIDEZ.activa && (
        <>
        {/* El id NO es decorativo: el mensaje de entrega que genera
            `pnpm entrega` enlaza a `<dominio>/#validez`. Sin ancla, ese enlace
            no lleva a ningún lado en ningún cliente con validez oficial. */}
        <section id="validez" className="py-20 md:py-28 px-4 sm:px-8" style={{ background: C.white }}>
          <div className="max-w-6xl mx-auto">
            <div data-reveal className="text-center">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${playfair.className}`} style={{ color: C.navy }}>
                {texto(VALIDEZ.titulo)}
              </h2>
              <p className="text-lg mt-5" style={{ color: C.navySuave }}>{texto(VALIDEZ.subtitulo)}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-12">
              {VALIDEZ.documentos.map((d, i) => (
                <div key={d.img} data-reveal data-d={String(i + 1)}
                  className="rounded-2xl p-5 md:p-7"
                  style={{ background: C.white, border: `1px solid ${conAlpha(C.royal, 0.14)}`, boxShadow: `0 18px 44px ${C.navy}12` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.img} alt={d.alt} loading="lazy" className="w-full h-auto rounded-lg" />
                  <p className="text-center text-sm mt-4" style={{ color: C.navySuave }}>{d.pie}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 px-4 sm:px-8" style={{ background: C.navy }}>
          <div className="max-w-3xl mx-auto">
            <h2 data-reveal className={`text-3xl sm:text-4xl font-bold text-center leading-tight ${playfair.className}`} style={{ color: C.white }}>
              {texto(VALIDEZ.verificaTitulo)} — <span style={{ color: C.ice }}>{texto(VALIDEZ.verificaResalte)}</span>
            </h2>
            <p data-reveal data-d="1" className="text-lg text-center mt-6" style={{ color: iceSuave(C, 0.78) }}>
              {texto(VALIDEZ.verificaTexto)}
            </p>

            <div data-reveal data-d="2" className="mt-12 rounded-2xl py-8 md:py-10 px-6 md:px-10"
              style={{ background: conAlpha(C.hero, 0.6), border: `2px solid ${conAlpha(C.royal, 0.3)}` }}>
              <p className="text-center text-sm uppercase tracking-widest mb-4" style={{ color: iceSuave(C, 0.7) }}>
                {texto(VALIDEZ.folioEtiqueta)}
              </p>
              {/* 🛑 EL FOLIO VA A MÁXIMO CONTRASTE, no en el color de acento:
                  es el dato que la persona copia a mano en el portal de la SEP.
                  Un folio mal leído no verifica nada. */}
              <p className="text-center font-mono font-bold text-2xl md:text-4xl lg:text-5xl break-all"
                style={{ color: C.white, letterSpacing: '0.22em' }}>
                {VALIDEZ.folio}
              </p>
            </div>

            <p data-reveal data-d="3" className="text-base text-center mt-6 max-w-xl mx-auto" style={{ color: iceSuave(C, 0.7) }}>
              {texto(VALIDEZ.folioNota)}
            </p>

            <div data-reveal data-d="4" className="text-center mt-10">
              <a href={VALIDEZ.portalUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-base md:text-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: C.royal, color: C.sobreAcento, boxShadow: `0 8px 28px ${C.royal}55` }}>
                {texto(VALIDEZ.portalTexto)}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>
        </>
        )}

        {/* ── BEFORE / AFTER ───────────────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div data-reveal className="text-center mb-14">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ background: `${C.royal}10`, color: C.royalTexto }}>{texto(L.transformacion_kicker)}</span>
              <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.navy }}>
                {texto(L.transformacion_titulo)}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              {/* Before */}
              <div data-reveal data-d="1" className="rounded-2xl p-8"
                style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: '#FEE2E2', color: '#B91C1C' }}>✕</div>
                  <span className="font-bold text-sm uppercase tracking-wider" style={{ color: '#B91C1C' }}>{`Sin ${config.nombre}`}</span>
                </div>
                {L.transformacion_sin.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 mb-4">
                    <span className="mt-0.5 flex-shrink-0 text-red-700 text-sm">✕</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#7f1d1d' }}>{texto(t)}</p>
                  </div>
                ))}
              </div>
              {/* After */}
              <div data-reveal data-d="2" className="rounded-2xl p-8"
                style={{ background: `linear-gradient(145deg,${C.navy},${C.conFin})`, border: `1px solid ${conAlpha(C.azure, 0.2)}` }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: conAlpha(C.azure, 0.2), color: C.ice }}>✓</div>
                  <span className="font-bold text-sm uppercase tracking-wider" style={{ color: C.azure }}>{`Con ${config.nombre}`}</span>
                </div>
                {L.transformacion_con.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 mb-4">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: '#4ade80', fontSize: 14 }}>✓</span>
                    <p className="text-sm leading-relaxed" style={{ color: iceSuave(C, 0.8) }}>{texto(t)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
        <section className="py-24 sm:py-28 px-4 sm:px-8" style={{ background: '#F8FAFF' }}>
          <div className="max-w-4xl mx-auto">
            <div data-reveal className="text-center mb-16">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ background: `${C.royal}10`, color: C.royalTexto }}>{texto(L.proceso_kicker)}</span>
              <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.navy }}>
                {texto(L.proceso_titulo)}
              </h2>
            </div>
            <ol className="space-y-9 sm:space-y-11">
              {L.proceso_pasos.map((item, i) => (
                <li key={i} className="flex gap-5 sm:gap-7 items-start" data-reveal data-d={String(i+1)}>
                  {/* El número 01..04 sale del índice, no se guarda. */}
                  <div className={`cjvb-step-num ${playfair.className}`}>{String(i+1).padStart(2, '0')}</div>
                  <div className="pt-1">
                    <h3 className="text-lg sm:text-xl font-semibold mb-1.5" style={{ color: C.navy }}>{texto(item.titulo)}</h3>
                    <p className="text-sm sm:text-base leading-relaxed" style={{ color: C.navySuave }}>{texto(item.desc)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── TESTIMONIOS ──────────────────────────────────────────── */}
        {testimonios.length > 0 && (
        <section className="py-24 sm:py-32 px-4 sm:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div data-reveal className="text-center mb-14">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ background: `${C.royal}10`, color: C.royalTexto }}>{texto(L.testimonios_kicker)}</span>
              <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.navy }}>
                {texto(L.testimonios_titulo)}
              </h2>
              <p className="mt-3 text-sm sm:text-base max-w-md mx-auto" style={{ color: `${C.navy}77` }}>
                {texto(L.testimonios_subtitulo)}
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {testimonios.map((t, i) => (
                <div key={t.name} className="testi-card" data-reveal data-d={String(i+1)}>
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, s) => (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-sm leading-relaxed flex-1" style={{ color: C.navySuave }}>&ldquo;{t.quote}&rdquo;</p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: `${C.royal}12` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg,${C.royal},${C.bright})`, color: C.sobreAcento }}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: C.navy }}>{t.name}, {t.age}</p>
                      <p className="text-xs" style={{ color: C.royalTexto }}>{t.nivel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── BENEFICIOS ───────────────────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-8 relative overflow-hidden" style={{ background: C.navy }}>
          <div aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 65% 55% at 50% 105%,${C.royal}38,transparent 65%)` }} />
          <div className="max-w-6xl mx-auto relative z-10">
            <div data-reveal className="text-center mb-14">
              <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.white }}>
                {texto(L.beneficios_titulo)}
              </h2>
              <p className="mt-3 text-sm sm:text-base max-w-md mx-auto" style={{ color: iceSuave(C, 0.55) }}>
                {texto(L.beneficios_subtitulo)}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {L.beneficios_items.map((b, i) => (
                <div key={i} className="benefit-card" data-reveal data-d={String((i%3)+1)}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: conAlpha(C.royal, 0.3) }}>
                    <CheckIcon color={C.azure} />
                  </div>
                  <h3 className="font-semibold text-[15px] mb-2" style={{ color: C.white }}>{texto(b.titulo)}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: iceSuave(C, 0.52) }}>{texto(b.desc)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATÁLOGO DE DIPLOMADOS ───────────────────────────────── */}
        {/*
          Solo se renderiza si el cliente encendió el flag Y hay cursos
          publicados. Con catalogo vacío no queda un hueco ni un título
          huérfano: la sección no existe.
        */}
        {catalogo.length > 0 && (
          <section id="diplomados" className="py-24 sm:py-32 px-4 sm:px-8" style={{ background: '#F8FAFF' }}>
            <div className="max-w-6xl mx-auto">
              <div data-reveal className="text-center mb-12">
                <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                  style={{ background: `${C.royal}10`, color: C.royalTexto }}>Programas</span>
                <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.navy }}>
                  {texto(L.catalogoTitulo)}
                </h2>
                <p className="text-sm sm:text-base mt-3 max-w-xl mx-auto" style={{ color: '#64748B' }}>
                  {texto(L.catalogoSubtitulo)}
                </p>
              </div>

              {/* Móvil primero: una columna, y solo a partir de sm se reparte. */}
              <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {catalogo.map(c => (
                  <Link
                    key={c.id}
                    href={`/diplomados/${c.id}`}
                    className="flex flex-col rounded-2xl p-6 bg-white transition-shadow hover:shadow-lg"
                    style={{ border: '1px solid #E2E8F0' }}
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: C.royalTexto }}>
                      {c.tipo === 'diplomado' ? 'Diplomado' : 'Curso'}
                    </span>
                    <h3 className="text-lg font-bold leading-snug mb-2" style={{ color: C.navy }}>
                      {c.nombre}
                    </h3>
                    {c.descripcion && (
                      <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: '#64748B' }}>
                        {c.descripcion}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4" style={{ color: '#94A3B8' }}>
                      {c.horas !== null && <span>{c.horas} horas</span>}
                      {c.duracion_meses !== null && (
                        <span>{c.duracion_meses} {c.duracion_meses === 1 ? 'mes' : 'meses'}</span>
                      )}
                    </div>

                    <div className="mt-auto pt-4" style={{ borderTop: '1px solid #F1F5F9' }}>
                      {/* Un curso sin mensualidad se cobra de una vez: decir
                          «Inscripción $X» lo haría parecer un anticipo. */}
                      {c.precio_mensualidad > 0 ? (
                        <>
                          <p className="text-sm font-bold" style={{ color: C.navy }}>
                            {precioPublico(c.precio_mensualidad)}
                            <span className="font-normal text-xs" style={{ color: '#94A3B8' }}> / mes</span>
                          </p>
                          {c.precio_inscripcion > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                              Inscripción {precioPublico(c.precio_inscripcion)}
                            </p>
                          )}
                        </>
                      ) : c.precio_inscripcion > 0 ? (
                        <>
                          <p className="text-sm font-bold" style={{ color: C.navy }}>
                            {precioPublico(c.precio_inscripcion)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Pago único</p>
                        </>
                      ) : null}
                      <p className="text-xs font-semibold mt-2" style={{ color: C.royalTexto }}>Ver temario →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-8 bg-white">
          <div className="max-w-2xl mx-auto">
            <div data-reveal className="text-center mb-14">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ background: `${C.royal}10`, color: C.royalTexto }}>{texto(L.faq_kicker)}</span>
              <h2 className={`text-3xl sm:text-4xl font-bold ${playfair.className}`} style={{ color: C.navy }}>
                {texto(L.faq_titulo)}
              </h2>
            </div>
            <div data-reveal>
              {L.faq_items.map((f, i) => <FAQItem key={i} q={texto(f.q)} a={texto(f.a)} />)}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-8 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(140deg,${C.hero} 0%,${C.navy} 45%,${C.ctaFin} 100%)` }}>
          <div aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 55% 65% at 50% 50%,${C.bright}1a,transparent 70%)` }} />
          <div aria-hidden className={`pointer-events-none absolute inset-0 flex items-center justify-center select-none ${playfair.className}`}
            style={{ fontSize: 'clamp(100px,22vw,300px)', fontWeight: 900, color: conAlpha(C.royal, 0.04), letterSpacing: '-0.06em' }}>
            {config.nombre}
          </div>
          <div className="max-w-2xl mx-auto relative z-10">
            <div data-reveal>
              <h2 className={`text-3xl sm:text-5xl font-bold mb-6 leading-tight ${playfair.className}`} style={{ color: C.white }}>
                {texto(L.cta_titulo)}<br />
                <span style={{ background: `linear-gradient(135deg,${C.azure},${C.textoClaro})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {texto(L.cta_highlight)}
                </span>
              </h2>
              <p className="mb-10 text-base sm:text-lg" style={{ color: iceSuave(C, 0.7) }}>
                {texto(L.cta_subtitulo)}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="cjvb-btn-white w-full sm:w-auto">{texto(L.cta_boton)}</Link>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="cjvb-btn-wa w-full sm:w-auto">
                  <WaIcon />{` ${texto(L.cta_whatsapp)}`}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer className="py-12 px-4 sm:px-8 text-center" style={{ background: C.footer, color: iceSuave(C, 0.45) }}>
          <div className="flex justify-center mb-4">
            {/* `brightness-0 invert` fuerza el logo a blanco puro. Sirve cuando
                el cliente NO entregó variante para fondo oscuro y `logoOscuro`
                cae en el mismo archivo que `logo` (un lockup oscuro sería
                invisible sobre este footer). Pero si el cliente SÍ entregó su
                variante clara, el filtro le borra los colores de marca y la
                deja toda blanca — por eso solo se aplica en el caso de
                fallback. Ver Bug 97 del playbook.
                El merge (`resolverLogos`) ya dejó `logoOscuro` = `logo` cuando
                no hay variante oscura propia, así que "fallback" aquí es
                simplemente que los dos coincidan. */}
            <Image src={config.logoOscuro} alt={config.nombreCompleto} width={200} height={80}
              className={`h-16 md:h-20 w-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] object-contain${
                config.logoOscuro !== config.logo ? '' : ' brightness-0 invert'}`} />
          </div>
          <p className="text-sm font-semibold" style={{ color: C.ice }}>{config.nombreCompleto}</p>
          <p className="text-xs mt-1.5">{CONFIG.dominio}</p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap text-xs" style={{ color: iceSuave(C, 0.4) }}>
            <a href={`mailto:${config.contactoEmail}`} className="hover:text-white transition-colors">{config.contactoEmail}</a>
            <span>·</span>
            <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
          </div>
          {/* Redes sociales */}
          <div className="flex items-center justify-center gap-5 mt-5">
            {config.redes?.instagram && (
              <a href={config.redes.instagram} target="_blank" rel="noopener noreferrer"
                aria-label="Instagram" className="hover:opacity-70 transition-opacity">
                <Instagram className="w-5 h-5" style={{ color: C.azure }} />
              </a>
            )}
            {config.redes?.facebook && (
              <a href={config.redes.facebook} target="_blank" rel="noopener noreferrer"
                aria-label="Facebook" className="hover:opacity-70 transition-opacity">
                <Facebook className="w-5 h-5" style={{ color: C.azure }} />
              </a>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs flex-wrap" style={{ color: iceSuave(C, 0.35) }}>
            <Link href="/aviso-de-privacidad" className="hover:text-white transition-colors">Aviso de Privacidad</Link>
            <span>·</span>
            <Link href="/terminos-y-condiciones" className="hover:text-white transition-colors">Términos y Condiciones</Link>
          </div>
          <p className="text-xs mt-3 opacity-40">© {new Date().getFullYear()} {config.nombreCompleto}. Todos los derechos reservados.</p>
        </footer>

      </main>
    </div>
  )
}
