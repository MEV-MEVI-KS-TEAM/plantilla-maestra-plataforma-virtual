'use client'

/**
 * Sección de LICENCIATURAS de la landing animada.
 *
 * Se pinta sola cuando `CONFIG.licenciaturas` trae carreras y planes; con el
 * add-on apagado no existe y la página no cambia en nada.
 *
 * Lo que esta sección tiene decidido, y por qué:
 *
 *   1. EL COSTO COMPLETO, NO LA MENSUALIDAD SOLA. En una licenciatura la
 *      titulación suele ser la parte más grande de la inversión (56–70 % en los
 *      clientes medidos). Cada plan lleva su desglose —inscripción +
 *      mensualidades + titulación = total— y su porcentaje, y la titulación
 *      tiene bloque propio con la cifra al tamaño de la mensualidad. Anunciar
 *      «$1,050/mes» con la titulación en letra chica deja el costo real
 *      escondido hasta el final.
 *   2. MÁS LARGO NO ES MÁS BARATO. Cuando los planes forman escalera —cada uno
 *      más largo baja la mensualidad y sube el total— se dice con sus cifras,
 *      CALCULADO (`comparacionPlanes`), para que nadie elija el largo creyendo
 *      que paga menos en total.
 *   3. EL PANEL DEL COSTO ES OSCURO Y NO LLEVA BOTONES. Dentro de un bloque
 *      oscuro el CTA sería blanco, y la inscripción tiene que ser el CTA de
 *      acento: va FUERA, sobre el fondo claro de la sección.
 *   4. «Resolver una duda» sale de `canalEscuela()`: WhatsApp si la escuela
 *      tiene número real, correo si no. 🛑 Nunca un wa.me armado a mano.
 *   5. LOS TEXTOS SE EDITAN desde "Textos de mi página" (TICKET-2026-09-22-08):
 *      encabezado, título, bajada, nombre visible y descripción de cada
 *      carrera y los 4 pasos llegan ya resueltos en `textos`
 *      (`resolverTextosLicenciaturas`). Vacío = el texto automático de siempre.
 *      Las cifras del panel del costo NO son editables: salen del desglose.
 *
 * 🛑 CERO HEXADECIMALES: los colores salen de tokens.ts.
 * 🛑 Nunca la palabra del periodo de cuatro meses: la ficha habla de materias y
 *    meses (la clave `cuatrimestres` del config es solo del tipo y nadie la pinta).
 */

import {
  ArrowRight, BookOpen, BookOpenCheck, Brain, Briefcase, CheckCircle2, Clock, Cpu, FileCheck2,
  Gavel, GraduationCap, HeartPulse, Landmark, Mail, MessageCircle, Palette, Scale, Stethoscope,
  Users, type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

import type { CanalEscuela } from '@/lib/contacto-ui'
import {
  getCarrerasLicenciatura,
  getDesglosesLicenciatura,
  porcentajeTitulacion,
  type DesgloseLicenciatura,
} from '@/lib/licenciatura-utils'
import { retraso } from './animacion'
import { BOTON, CONTENEDOR, Encabezado, estiloBoton } from './piezas'
import { comparacionPlanes, diferenciasTexto, titulacionEsLaMayor, unirConO, type TextosLicenciaturas } from './textos-licenciatura'
import type { TokensSeccion } from './tokens'

type Dinero = (n: number) => string
type Carrera = ReturnType<typeof getCarrerasLicenciatura>[number]

/**
 * Los íconos que puede nombrar `carreras[].icono` en el config. Un nombre que no
 * esté aquí cae en el birrete, así que una carrera nueva nunca rompe la página.
 * 🛑 Antes de usar uno clínico (`Stethoscope`, `Brain`, `HeartPulse`), revisa que
 *    la escuela venda ese programa: en una escuela con «Terapéutico» en el nombre
 *    que solo vende Psicología como licenciatura, un cerebro se lee como oferta
 *    de terapia (CIDAT #210).
 */
const ICONOS: Record<string, LucideIcon> = {
  Users, BookOpen, GraduationCap, Scale, Gavel, Briefcase, Landmark, Palette, Cpu,
  Stethoscope, Brain, HeartPulse,
}

/**
 * Los documentos de Preparatoria con el certificado de bachillerato en lugar del
 * de secundaria: «Mis documentos» ya se lo pide así a un alumno de licenciatura.
 */
const REQUISITOS = ['Certificado de Bachillerato o Preparatoria', 'CURP', 'Acta de nacimiento', 'Identificación oficial', 'Fotografía reciente']

/** Clases estáticas (Tailwind no ve clases armadas al vuelo). */
const COLUMNAS: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }

export function SeccionLicenciaturas({ t, tOscuro, fmt, canal, variante, textos }: {
  /** Tokens de la sección (clara). */
  t: TokensSeccion
  /** Tokens oscuros para el panel del costo. */
  tOscuro: TokensSeccion
  fmt: Dinero
  /** El canal real de la escuela para «Resolver una duda»: WhatsApp o correo. */
  canal: CanalEscuela | null
  variante: string
  /** Textos ya resueltos (automáticos + los que escribió la escuela). */
  textos: TextosLicenciaturas
}) {
  const carreras = getCarrerasLicenciatura()
  const planes = getDesglosesLicenciatura()
  if (carreras.length === 0 || planes.length === 0) return null

  const ritmos = `${unirConO(planes.map(p => String(p.meses)))} meses`
  const incluye = Array.from(new Set(carreras.flatMap(c => c.incluye)))
  const pasos = textos.pasos

  return (
    <section id="licenciaturas" data-variant={variante} style={{ background: t.fondo, color: t.texto, scrollMarginTop: 80 }}>
      <div className={CONTENEDOR}>
        <Encabezado t={t} kicker={textos.kicker} titulo={textos.titulo} bajada={textos.bajada} />

        {/* Las carreras */}
        <div className={`grid gap-6 mt-12 max-w-4xl mx-auto ${COLUMNAS[carreras.length] ?? COLUMNAS[3]}`}>
          {carreras.map((c, i) => (
            <div key={c.slug} data-la-reveal="sube" style={retraso(i, 100)}>
              <FichaCarrera t={t} carrera={c} ritmos={ritmos} visible={textos.carreras[c.slug]} />
            </div>
          ))}
        </div>

        {/* Cómo funciona. El número va en el color de marca con su letra encima. */}
        <ol aria-label="Cómo funciona" className={`grid gap-5 mt-8 ${COLUMNAS[pasos.length]}`}>
          {pasos.map((paso, i) => (
            <li key={i} data-la-reveal="sube" className="rounded-2xl p-6 flex gap-4 items-start"
              style={{ ...retraso(i, 90), background: t.superficie, border: `1px solid ${t.borde}` }}>
              <span aria-hidden className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                style={{ width: 40, height: 40, background: t.btn2Fondo, color: t.btn2Texto }}>
                {i + 1}
              </span>
              <span>
                <span className="block font-bold" style={{ color: t.titulo }}>{paso.titulo}</span>
                <span className="block mt-1 text-sm leading-relaxed" style={{ color: t.textoSuave }}>{paso.desc}</span>
              </span>
            </li>
          ))}
        </ol>

        <PanelCosto t={tOscuro} planes={planes} fmt={fmt} />

        {/* Lo que incluye y lo que se pide */}
        <div className="grid md:grid-cols-2 gap-10 mt-14 max-w-4xl mx-auto">
          <Lista t={t} titulo="Todo lo que incluye" Icono={BookOpenCheck} items={incluye} />
          <div>
            <Lista t={t} titulo="Requisitos para inscribirte" Icono={FileCheck2} items={REQUISITOS} />
            <p className="mt-4 flex items-center gap-2 text-sm" style={{ color: t.textoSuave }}>
              <Clock size={15} aria-hidden style={{ color: t.titulo, flexShrink: 0 }} />
              Puedes iniciar mientras entregas tus documentos.
            </p>
          </div>
        </div>

        {/* 🛑 El CTA de acento, sobre el fondo claro: FUERA del panel oscuro. */}
        <div data-la-reveal className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" data-testid="lic-cta" className={`${BOTON} la-btn-color`}
            style={estiloBoton(t.btnFondo, t.btnTexto, t.btnFondo, t.btnHover)}>
            Inscribirme a una licenciatura<ArrowRight size={18} aria-hidden className="la-flecha" />
          </Link>
          {canal && (
            <a href={canal.href} {...(canal.tipo === 'whatsapp' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={BOTON} style={estiloBoton(t.btn2Fondo, t.btn2Texto, t.btn2Borde)}>
              {canal.tipo === 'whatsapp' ? <MessageCircle size={18} aria-hidden /> : <Mail size={18} aria-hidden />}
              Resolver una duda
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * El costo completo, en el bloque oscuro. Sin botones a propósito (ver cabecera).
 */
function PanelCosto({ t, planes, fmt }: { t: TokensSeccion; planes: readonly DesgloseLicenciatura[]; fmt: Dinero }) {
  const comparacion = comparacionPlanes(planes)
  const { titulacion } = planes[0]
  const porcentajes = Array.from(new Set(planes.map(p => porcentajeTitulacion(p)).filter((x): x is number => x !== null))).sort((a, b) => a - b)
  const extraDe = (id: string) => comparacion?.largos.find(l => l.plan.modalidadId === id)
  return (
    <div data-variant="oscuro" data-la-reveal className="la-panel-lic relative overflow-hidden rounded-3xl mt-16 px-5 py-12 sm:px-10 sm:py-14"
      style={{ background: t.fondo, color: t.texto }}>
      <div aria-hidden className="la-halo la-halo--der" style={{ ['--la-color' as string]: t.decorativo }} />
      <header className="relative text-center max-w-2xl mx-auto">
        <p className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: t.titulo }}>
          <span aria-hidden className="la-filete" style={{ background: t.decorativo }} />
          Costo completo del programa
          <span aria-hidden className="la-filete" style={{ background: t.decorativo }} />
        </p>
        <h3 className="mt-4 font-bold" style={{ color: t.titulo, fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', lineHeight: 1.2 }}>
          Aquí está todo, sin sorpresas al final
        </h3>
        <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: t.textoSuave }}>
          {comparacion
            ? `Mientras más largo el plan, más baja la mensualidad pero más alto el total: frente al plan de ${comparacion.corto.meses} meses, ${diferenciasTexto(comparacion, fmt)}. Cada plan incluye la inscripción y la titulación.`
            : 'Cada plan incluye la inscripción y la titulación.'}
        </p>
      </header>

      {/* Mismo tratamiento para todos los planes: ninguno se destaca sobre otro. */}
      <div className={`relative grid gap-6 mt-10 ${COLUMNAS[planes.length] ?? COLUMNAS[2]}`}>
        {planes.map(p => {
          const extra = extraDe(p.modalidadId)
          const pct = porcentajeTitulacion(p)
          return (
            <article key={p.modalidadId} className="rounded-2xl p-6 sm:p-7 flex flex-col"
              style={{ background: t.superficie, border: `1px solid ${t.borde}` }}>
              <h4 className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: t.acentoTexto, fontFamily: 'var(--font-body)' }}>
                {p.etiqueta}
              </h4>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <span className="text-4xl font-bold" style={{ color: t.titulo, fontFamily: 'var(--font-heading)' }}>{fmt(p.mensualidad)}</span>
                <span className="text-base" style={{ color: t.textoSuave }}>al mes</span>
              </p>
              <p className="mt-2 text-sm" style={{ color: t.textoSuave }}>Terminas en {p.meses} meses</p>
              <dl className="mt-6 text-sm sm:text-base">
                <Fila t={t} etiqueta="Inscripción" monto={fmt(p.inscripcion)} />
                <Fila t={t} etiqueta={`${p.meses} mensualidades`} monto={fmt(p.colegiatura)} />
                <Fila t={t} etiqueta="Titulación" monto={fmt(p.titulacion)} />
              </dl>
              <div className="mt-4 pt-4 flex items-baseline justify-between gap-4" style={{ borderTop: `1px solid ${t.titulo}` }}>
                <span className="font-bold" style={{ color: t.titulo }}>Total</span>
                <strong className="text-2xl sm:text-3xl" style={{ color: t.titulo, fontFamily: 'var(--font-heading)' }}>{fmt(p.total)}</strong>
              </div>
              <div className="mt-4 space-y-1.5 text-sm leading-relaxed">
                {pct !== null && <p style={{ color: t.textoSuave }}>La titulación es el {pct} % del total.</p>}
                {extra && (
                  <p style={{ color: t.acentoTexto }}>
                    {fmt(extra.menosAlMes)} menos al mes, pero {fmt(extra.masEnTotal)} más en total que el plan de {comparacion!.corto.meses} meses.
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* El bloque dedicado a la titulación: la cifra al tamaño de la mensualidad. */}
      <div className="relative rounded-2xl p-6 sm:p-8 mt-6 grid md:grid-cols-[minmax(0,1fr)_auto] gap-6 md:items-center"
        style={{ background: t.superficie, border: `1px solid ${t.borde}` }}>
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: t.acentoTexto }}>
            <GraduationCap size={17} aria-hidden /> Sobre la titulación
          </p>
          <p className="mt-3 text-lg font-semibold" style={{ color: t.titulo }}>Tu título y tu cédula profesional</p>
          <p className="mt-2 leading-relaxed" style={{ color: t.textoSuave }}>
            Incluye el trámite completo y la gestión administrativa hasta obtener tu título y tu cédula profesional.
            {titulacionEsLaMayor(planes)
              ? ` Es ${porcentajes.length === 1 ? `el ${porcentajes[0]} % del costo total, ` : porcentajes.length > 1 ? `entre el ${porcentajes[0]} y el ${porcentajes[porcentajes.length - 1]} % del costo total, ` : ''}la parte más grande de tu inversión, y por eso la publicamos con todas sus letras desde el primer día.`
              : ''}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-sm font-semibold" style={{ color: t.textoSuave }}>Titulación</p>
          <p className="mt-1 text-4xl sm:text-5xl font-bold" style={{ color: t.titulo, fontFamily: 'var(--font-heading)' }}>{fmt(titulacion)}</p>
        </div>
      </div>
    </div>
  )
}

function Fila({ t, etiqueta, monto }: { t: TokensSeccion; etiqueta: string; monto: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5" style={{ borderBottom: `1px solid ${t.borde}` }}>
      <dt style={{ color: t.textoSuave }}>{etiqueta}</dt>
      <dd className="font-semibold" style={{ color: t.titulo }}>{monto}</dd>
    </div>
  )
}

function FichaCarrera({ t, carrera, ritmos, visible }: {
  t: TokensSeccion; carrera: Carrera; ritmos: string
  /** Nombre y descripción que se PINTAN (editables); el slug y el nombre real no cambian. */
  visible?: { nombre: string; desc: string }
}) {
  const Icono = ICONOS[carrera.icono] ?? GraduationCap
  return (
    <article className="la-card rounded-2xl flex flex-col h-full overflow-hidden"
      style={{ background: t.superficie, border: `1px solid ${t.borde}` }}>
      <div aria-hidden className="la-surco" style={{ height: 4, background: t.decorativo }} />
      <div className="p-7 flex flex-col flex-1">
        <span aria-hidden className="la-icono-card flex items-center justify-center rounded-2xl"
          style={{ width: 52, height: 52, background: t.btn2Fondo, color: t.btn2Texto }}>
          <Icono size={24} />
        </span>
        <h3 className="mt-5 text-xl font-bold" style={{ color: t.titulo }}>{visible?.nombre ?? carrera.nombre}</h3>
        <p className="mt-2 text-base leading-relaxed flex-1" style={{ color: t.textoSuave }}>{visible?.desc ?? carrera.desc}</p>
        <ul aria-label="En resumen" className="mt-5 flex flex-wrap gap-2">
          {[`${carrera.totalMaterias} materias`, ritmos, '100% en línea'].map(x => (
            <li key={x} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ border: `1px solid ${t.titulo}`, color: t.titulo }}>{x}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function Lista({ t, titulo, Icono, items }: { t: TokensSeccion; titulo: string; Icono: LucideIcon; items: readonly string[] }) {
  return (
    <div>
      <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.14em]" style={{ color: t.titulo }}>
        <span aria-hidden className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: t.btn2Fondo, color: t.btn2Texto }}>
          <Icono size={18} />
        </span>
        {titulo}
      </p>
      <ul className="mt-5 space-y-2.5">
        {items.map(item => (
          <li key={item} className="flex items-start gap-2.5" style={{ color: t.texto }}>
            <CheckCircle2 size={18} aria-hidden className="mt-0.5" style={{ color: t.titulo, flexShrink: 0 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
