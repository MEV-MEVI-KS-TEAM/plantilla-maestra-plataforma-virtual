'use client'

/**
 * Landing ANIMADA — la portada por defecto de la plantilla.
 *
 * ── Qué es ──────────────────────────────────────────────────────────────────
 *
 * La portada que nació cliente por cliente (ILCOT #201 → AULA RAÍZ #208 → UVEP
 * #209 → HUMAN TECH #205 → CIDAT #210) y que aquí queda como la de TODOS: hero
 * blanco con el logo, una escena que sangra por el borde y sigue al puntero,
 * secciones que se revelan al desplazar, franja de indicadores, niveles, planes,
 * licenciaturas, validez oficial, antes y después, cómo funciona, testimonios,
 * beneficios, catálogo, preguntas, cierre y pie.
 *
 * Todo sale de la config del cliente —colores, logo, textos, precios, niveles,
 * carreras— y de lo que publique en «Personalizar mi página»: esta página no
 * tiene ni un dato de ninguna escuela escrito a mano.
 *
 * Se elige con `CONFIG.estiloLanding`. Con `'clasica'` se sirve `LandingClient`,
 * que se conserva intacto: las escuelas ya entregadas no cambian de portada.
 *
 * ── Reglas duras ────────────────────────────────────────────────────────────
 *
 * 🛑 CERO HEXADECIMALES EN ESTE ARCHIVO. Cada sección declara su variante
 *    (`claro` / `suave` / `oscuro`) y los colores salen de `tokens.ts`, que los
 *    deriva de la paleta del cliente MIDIENDO el contraste. Ahí está escrito por
 *    qué dentro de un bloque oscuro no entra ningún color de marca.
 * 🛑 Ningún botón de WhatsApp se arma a mano: pasa por `urlWhatsAppEscuela()` /
 *    `canalEscuela()`, que devuelven null o el correo cuando la escuela no tiene
 *    número real. Una escuela sin WhatsApp no pinta un enlace que no lleva a nadie.
 * 🛑 Las frases con cifras se CALCULAN de los precios (`totalesIguales`,
 *    `comparacionPlanes`): el día que el cliente cambie un precio desde su panel,
 *    la frase se apaga sola en vez de quedarse mintiendo.
 * 🟠 Lo que la escuela no tiene no se pinta: sin eslogan, sin redes, sin
 *    domicilio, sin catálogo o sin licenciaturas, esas piezas no existen.
 */

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle, ArrowRight, BadgeCheck, BookOpen, Briefcase, CalendarDays, CheckCircle2, Clock,
  FileCheck, GraduationCap, Laptop, Mail, Menu, MessageCircle, Quote,
  ShieldCheck, X, XCircle, type LucideIcon,
} from 'lucide-react'

import { CONFIG } from '@/lib/config'
import { formatearMoneda } from '@/lib/moneda'
import { planesPorNivel, getDuracionLabel, getPlanLabelPublico, getPlanLabelConDuracion } from '@/lib/modalidades'
import { interpolar, type LandingConfig, type Placeholder } from '@/lib/site-config-core'
import { resolverLanding } from '@/lib/landing-textos'
import { precioPublico, type CursoCatalogoPublico } from '@/lib/cursos/catalogo'
import { canalEscuela, faqSegunWhatsApp, mailtoEscuela, urlWhatsAppEscuela } from '@/lib/contacto-ui'
import { getCarrerasLicenciatura, getDesglosesLicenciatura, getEtiquetaLicenciatura } from '@/lib/licenciatura-utils'
import { subtituloMarca } from '@/lib/marca'
import { etiquetaNivel, etiquetaNivelConArticulo, listaConY, nivelesTexto } from '@/lib/niveles-ui'
import {
  certificacionDe, etiquetasPlan, fraseMensualidades, inscripcionEnLanding, mensualidadDe, textoInscripcion,
  totalPlanDe, totalesIguales, varsInscripcionPorNivel,
} from '@/lib/precios-ui'
import {
  BarraAvance, BotonCopiar, Contador, Inclinable, PreguntaFrecuente, WhatsAppFlotante,
  indice, retraso, useDesplazado, useParallaxPuntero, useRevelado, useSeccionActiva, variable,
} from './animacion'
import { BOTON, CONTENEDOR, Encabezado, estiloBoton, sinFlecha } from './piezas'
import { SeccionLicenciaturas } from './Licenciaturas'
import {
  pluralEtiqueta, preguntasLicenciatura, resolverTextosLicenciaturas, textosAutoLicenciaturas, unirConO,
  type OverridesLicenciaturasLanding,
} from './textos-licenciatura'
import {
  paletaDesde, secuenciaSecciones, tokensDe,
  type IdSeccion, type SeccionOpcional, type TokensSeccion,
} from './tokens'

/**
 * Los niveles del programa académico, en el orden en que se presentan. Se
 * intersecan con `CONFIG.niveles`, así que una escuela que solo venda uno pinta
 * una sola tarjeta y nunca nombra el otro.
 */
const NIVELES = ['secundaria', 'preparatoria'] as const

/**
 * Medidas nominales del logo para `next/image`. El archivo real puede tener
 * cualquier proporción: la altura la fija el CSS y `w-auto` respeta el ancho.
 */
const LOGO = { ancho: 512, alto: 512 }

const dinero = (n: number) => formatearMoneda(n, CONFIG)

/** «3 meses», «3 o 6 meses», «3, 6 o 9 meses». */
function duracionesTexto(meses: readonly number[]): string {
  const unicos = Array.from(new Set(meses)).sort((a, b) => a - b)
  if (unicos.length === 0) return ''
  if (unicos.length === 1) return `${unicos[0]} meses`
  return `${unicos.slice(0, -1).join(', ')} o ${unicos[unicos.length - 1]} meses`
}

/** Los emojis de `dolor_items` que trae la entrega, dibujados como íconos de la marca. */
const ICONO_DOLOR: Record<string, LucideIcon> = { '⏰': Clock, '💼': Briefcase, '📅': CalendarDays }

/** Clases estáticas (Tailwind no ve clases armadas al vuelo) para los pasos en una fila. */
const COLUMNAS_PROCESO: Record<number, string> = {
  2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5',
}

/**
 * A quién va dirigido cada nivel. Es un hecho del expediente —secundaria pide el
 * certificado de primaria y preparatoria el de secundaria— y por eso vive aquí y
 * no en los textos editables. Un nivel que no esté en el mapa simplemente no
 * pinta la línea.
 */
const PARA_QUIEN: Partial<Record<(typeof NIVELES)[number], string>> = {
  secundaria: 'Para quien ya concluyó la primaria.',
  preparatoria: 'Para quien ya concluyó la secundaria.',
}

/* ─── Piezas ──────────────────────────────────────────────────────────────── */

/**
 * Tarjeta de contacto.
 *
 * ⚠️ `grande` existe porque hoy esta escuela tiene UN solo canal —el correo— y
 * una tarjeta normal sola en su columna deja un hueco que se lee como algo que
 * falta por cargar.
 */
function TarjetaContacto({ t, href, externo = false, destacada = false, grande = false, Icono, etiqueta, valor, nota, accion }: {
  t: TokensSeccion; href: string; externo?: boolean; destacada?: boolean; grande?: boolean
  Icono: LucideIcon; etiqueta: string; valor: string; nota?: string
  /** Rótulo del botón que va DENTRO de la tarjeta (la tarjeta entera es el enlace). */
  accion?: string
}) {
  // Destacada (WhatsApp, cuando exista): fondo de marca con letra legible
  // encima. La normal: superficie clara con el ícono en un chip de marca.
  const fondo = destacada ? t.btn2Fondo : t.superficie
  const letra = destacada ? t.btn2Texto : t.titulo
  const suave = destacada ? t.btn2Texto : t.textoSuave
  return (
    <a href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`la-card flex rounded-2xl ${grande ? 'flex-col gap-5 p-7 sm:p-9' : 'items-center gap-4 p-5'}`}
      style={{ background: fondo, border: `1px solid ${destacada ? t.btn2Fondo : t.borde}` }}>
      <span className="la-icono-card flex items-center justify-center rounded-2xl flex-shrink-0"
        style={{ width: grande ? 64 : 48, height: grande ? 64 : 48, background: destacada ? 'transparent' : t.btn2Fondo, border: `1.5px solid ${destacada ? letra : t.btn2Fondo}` }}>
        <Icono size={grande ? 28 : 22} aria-hidden style={{ color: destacada ? letra : t.btn2Texto }} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium" style={{ color: suave }}>{etiqueta}</span>
        {/* `anywhere` y no `break-word`: solo el primero reduce el ancho mínimo,
            y sin él un correo largo empuja la columna fuera de la pantalla. */}
        <span className={`block font-bold ${grande ? 'text-xl sm:text-2xl' : 'text-lg'}`}
          style={{ color: letra, overflowWrap: 'anywhere', fontFamily: grande ? 'var(--font-heading)' : undefined }}>
          {valor}
        </span>
        {nota && <span className="mt-2 block text-sm" style={{ color: suave }}>{nota}</span>}
        {/* Aspecto de botón, pero es un <span>: la tarjeta entera ya es el enlace
            y un enlace dentro de otro no es HTML válido. */}
        {accion && (
          <span className="la-btn-falso mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            style={{ background: t.btnFondo, color: t.btnTexto }}>
            <Icono size={18} aria-hidden />{accion}
          </span>
        )}
      </span>
    </a>
  )
}

/* ─── Landing ─────────────────────────────────────────────────────────────── */

export function LandingAnimada({ catalogo, config }: { catalogo: CursoCatalogoPublico[]; config: LandingConfig }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  useRevelado()
  useParallaxPuntero(heroRef)
  const desplazado = useDesplazado(8)

  const L = resolverLanding(config.landing)
  const precios = config.precios as unknown as Record<string, unknown>
  const paleta = paletaDesde(config.colores)

  // Validez oficial: no es branding, es una acreditación. Sale de CONFIG y no se
  // edita desde el panel. El folio es la acreditación COMPARTIDA de la red
  // (00 §11) y va a máximo contraste.
  const VALIDEZ = CONFIG.landing.validezOficial
  const validezActiva = Boolean(VALIDEZ.activa)
  const folio = String(VALIDEZ.folio ?? '')
  const hayCatalogo = Boolean(CONFIG.landing.mostrarCatalogoCursos) && catalogo.length > 0

  const subtitulo = subtituloMarca(config.nombre, config.nombreCompleto)
  const niveles = NIVELES.filter(n => (CONFIG.niveles as readonly string[]).includes(n))
  const planesDe = (nivel: string) => planesPorNivel(nivel, config.modalidades)
  const nivelReferencia = niveles.includes('preparatoria') ? 'preparatoria' : (niveles[0] ?? 'preparatoria')
  const planes = planesDe(nivelReferencia)
  const nombrePlan = (m: (typeof planes)[number]) => getPlanLabelPublico(m, config.modalidades)

  const inscripcionTexto = textoInscripcion(precios.inscripcion as number, { minusculas: true })
  // Inscripción POR NIVEL (Fase 2). Con las claves por nivel vacías todos los
  // niveles pagan la general, `ins.comun` es verdad y cada frase sale
  // exactamente como antes (ver `inscripcionEnLanding`).
  const ins = inscripcionEnLanding(niveles, precios)
  const minimaDe = (nivel: string) => {
    const montos = planesDe(nivel).map(m => mensualidadDe(nivel, m, precios)).filter(n => n > 0)
    return montos.length > 0 ? Math.min(...montos) : 0
  }

  // ⭐ EL ARGUMENTO DE ESTA ESCUELA, calculado y no escrito: en cada nivel los dos
  // planes suman lo mismo. Si el admin cambia una mensualidad desde su panel, la
  // frase se apaga sola en vez de quedarse mintiendo.
  const totalesPorNivel = niveles.map(n => planesDe(n).map(m => totalPlanDe(n, m, precios)))
  const mismoTotalPorNivel = totalesPorNivel.length > 0 && totalesPorNivel.every(totalesIguales)

  // ⚠️ HAY ESCUELAS CON PRECIO DISTINTO POR NIVEL: cuando los planes no
  // coinciden entre niveles, los planes se pintan POR NIVEL y cada
  // cifra sale de `mensualidadDe(nivel, …)`: leer `modalidad.mensualidad` a secas
  // le muestra a secundaria la tarifa de preparatoria (SÉNDERI #194).
  const planesIguales = niveles.every(n =>
    planesDe(n).length === planes.length &&
    planes.every(m => mensualidadDe(n, m, precios) === mensualidadDe(nivelReferencia, m, precios)))

  const vars = {
    duracion: getDuracionLabel(config.modalidades),
    nombre: config.nombre,
    nombreCompleto: config.nombreCompleto,
    whatsapp: config.whatsappDisplay || config.whatsapp,
    inscripcion: inscripcionTexto,
    ...varsInscripcionPorNivel(precios, (monto) => textoInscripcion(monto, { minusculas: true })),
  } satisfies Record<Placeholder, string>
  // `satisfies`: un comodín de PLACEHOLDERS sin su valor aquí no compila (saldría literal).
  const texto = (s?: string) => interpolar(s ?? '', vars)

  // 🟠 WhatsApp de la ESCUELA. Vacío o con el marcador del intake esto es null y
  // ningún botón de WhatsApp se pinta: hero, contacto, pie y botón flotante.
  // ⚠️ El envío de recibos por WhatsApp NO pasa por aquí: usa el número del
  //    ALUMNO y sigue activo en el panel.
  const urlWhatsApp = urlWhatsAppEscuela(
    config.whatsapp,
    `Hola, quiero información sobre ${listaConY(niveles.map(etiquetaNivelConArticulo))} en línea de ${config.nombre}.`,
  )
  const telefonoVisible = config.whatsappDisplay || config.whatsapp
  const correo = config.contactoEmail || config.email
  const mailto = mailtoEscuela(correo)
  const anio = new Date().getFullYear()

  // Sobre los bloques oscuros va `logoOscuro`. Cuando la escuela entrega un solo
  // archivo, el merge deja `logoOscuro === logo` y no sabemos si ese arte se lee
  // sobre el color de marca: se pinta dentro de una PLACA blanca, que funciona
  // con cualquier logo. Con variante oscura propia, se pinta directo.
  const logoEnPlaca = config.logoOscuro === config.logo

  // ── Add-on Licenciaturas V3.7 ─────────────────────────────────────────────
  // Los planes de licenciatura no se editan desde el panel: salen de
  // CONFIG.licenciaturas con su desglose COMPLETO (la titulación va dentro del
  // total). Sin carreras o sin planes, la sección y su tarjeta no existen.
  const carrerasLic = getCarrerasLicenciatura()
  const planesLic = getDesglosesLicenciatura()
  const hayLicenciaturas = carrerasLic.length > 0 && planesLic.length > 0
  const etiquetaLic = hayLicenciaturas ? (carrerasLic.length > 1 ? pluralEtiqueta(getEtiquetaLicenciatura()) : getEtiquetaLicenciatura()) : ''
  const ritmosLic = hayLicenciaturas ? `${unirConO(planesLic.map(p => String(p.meses)))} meses` : ''
  /** «Secundaria y Preparatoria» · «Secundaria, Preparatoria y Licenciaturas». */
  const programasTexto = hayLicenciaturas
    ? `${niveles.map(etiquetaNivel).join(', ')} y ${carrerasLic.length > 1 ? 'Licenciaturas' : 'Licenciatura'}`
    : nivelesTexto(niveles)
  // Textos de la sección: los automáticos de siempre, con lo que la escuela
  // haya escrito en "Textos de mi página" encima, campo por campo
  // (TICKET-2026-09-22-08). Las cifras del panel del costo no se editan.
  const textosLic = hayLicenciaturas
    ? resolverTextosLicenciaturas(
        textosAutoLicenciaturas(carrerasLic, planesLic, getEtiquetaLicenciatura(), dinero),
        config.landing as unknown as OverridesLicenciaturasLanding,
        texto,
      )
    : null
  // «Resolver una duda» de la sección: WhatsApp si la escuela tiene número real,
  // si no el correo. 🛑 Nunca un wa.me armado a mano.
  const canal = canalEscuela(config, 'Tengo una duda sobre las licenciaturas')

  // Pregunta sobre los planes, CALCULADA de los precios: si el admin cambia uno,
  // la respuesta cambia con él y la página no afirma algo que ya no es cierto.
  const faqPlanes: Array<{ q: string; a: string }> = []
  if (planes.length >= 2) {
    const materias = planes.map(m => m.meses * m.materiasPorMes)
    const mismasMaterias = materias.every(x => x === materias[0])
    const detalle = planes
      .map(m => `el plan de ${nombrePlan(m)} dura ${m.meses} meses con ${m.materiasPorMes} materias al mes`)
      .join(' y ')
    // Una frase por nivel cuando las mensualidades difieren (ver `fraseMensualidades`).
    const mensualidades = fraseMensualidades({
      niveles, planes, planesDe, nivelReferencia, precios, nombrePlan, dinero, planesIguales,
    })
    const comunes = [
      mismasMaterias ? 'las mismas materias' : '',
      // La inscripción solo se dice COMÚN si de verdad lo es en todos los niveles.
      ins.comun && ins.montoComun > 0 ? `la inscripción de ${ins.textoComun}` : '',
    ].filter(Boolean)
    faqPlanes.push({
      q: `¿Qué diferencia hay entre ${listaConY(planes.map(m => `el plan de ${nombrePlan(m)}`))}?`,
      a: `${comunes.length ? `Los dos incluyen ${listaConY(comunes)}. ` : ''}` +
        `${detalle.charAt(0).toUpperCase()}${detalle.slice(1)}. ${mensualidades} ` +
        (ins.comun ? '' : `La inscripción es ${ins.textoPorNivel}. `) +
        (mismoTotalPorNivel
          ? `Al final pagas lo mismo con cualquiera de los dos (${niveles.map(n =>
            `${dinero(totalPlanDe(n, planesDe(n)[0], precios))} en ${etiquetaNivel(n)}`).join(' y ')}): eliges ritmo, no precio.`
          : 'Tú eliges si prefieres pagar menos al mes o concluir en menos tiempo.'),
    })
  }
  // Las preguntas de licenciatura se CALCULAN de sus precios (no se guardan en
  // `faq_items`: el editor admite 8 y quedarían desfasadas si cambia un precio).
  const faqLicenciatura = hayLicenciaturas ? preguntasLicenciatura(planesLic, carrerasLic, dinero) : []
  // Sin WhatsApp, la pregunta que da el número (`{whatsapp}`) no se publica: saldría «al .».
  const faqs = [...faqSegunWhatsApp(L.faq_items, urlWhatsApp !== null).map(f => ({ q: texto(f.q), a: texto(f.a) })), ...faqPlanes, ...faqLicenciatura]

  const testimonios = L.testimonios ?? []

  /* ── Orden y colores de cada sección ─────────────────────────────────── */
  const presentes: Record<SeccionOpcional, boolean> = {
    dolor: L.dolor_items.length > 0,
    licenciaturas: hayLicenciaturas,
    validez: validezActiva,
    transformacion: L.transformacion_sin.length > 0 || L.transformacion_con.length > 0,
    proceso: L.proceso_pasos.length > 0,
    testimonios: testimonios.length > 0,
    beneficios: L.beneficios_items.length > 0,
    catalogo: hayCatalogo,
    faq: faqs.length > 0,
  }
  const secciones = secuenciaSecciones(presentes)
  const seccion = (id: IdSeccion) => secciones.find(s => s.id === id) ?? { id, variante: 'claro' as const }
  const tokens = (id: IdSeccion) => tokensDe(seccion(id).variante, paleta)
  /** `data-variant`, fondo y letra de una sección, y el margen para el menú fijo. */
  const marco = (id: IdSeccion) => {
    const t = tokens(id)
    return { 'data-variant': seccion(id).variante, style: { background: t.fondo, color: t.texto, scrollMarginTop: 80 } }
  }

  const tHeader = tokensDe('claro', paleta)
  const tOscuro = tokensDe('oscuro', paleta)
  const tHero = tokens('hero')
  const tFranja = tokens('franja')
  const tDolor = tokens('dolor')
  const tNiveles = tokens('niveles')
  const tPlanes = tokens('planes')
  const tLic = tokens('licenciaturas')
  const tValidez = tokens('validez')
  const tTransf = tokens('transformacion')
  const tProceso = tokens('proceso')
  const tTestim = tokens('testimonios')
  const tBenef = tokens('beneficios')
  const tCatalogo = tokens('catalogo')
  const tFaq = tokens('faq')
  const tCta = tokens('cta')
  const tContacto = tokens('contacto')
  const tPie = tokens('pie')

  const enlacesMenu = [
    { href: '#niveles', etiqueta: 'Niveles' },
    { href: '#planes', etiqueta: 'Planes' },
    ...(hayLicenciaturas ? [{ href: '#licenciaturas', etiqueta: 'Licenciaturas' }] : []),
    ...(validezActiva ? [{ href: '#validez', etiqueta: 'Validez oficial' }] : []),
    ...(presentes.faq ? [{ href: '#preguntas', etiqueta: 'Preguntas' }] : []),
    { href: '#contacto', etiqueta: 'Contacto' },
  ]
  const activa = useSeccionActiva(enlacesMenu.map(e => e.href.slice(1)))

  // La franja oscura. 🛑 Ni colores de marca ni el gris del papel: letra
  // blanca, íconos en el realce del bloque y divisores en su borde.
  const indicadores: Array<{ Icono: LucideIcon; dato: string }> = [
    { Icono: Laptop, dato: '100% en línea' },
    ...(validezActiva ? [{ Icono: ShieldCheck, dato: 'Validez oficial' }] : []),
    // ⚠️ Con licenciaturas, «en ambos planes» dejaría de ser verdad para TODOS
    // los planes de la página (los de licenciatura no suman lo mismo): se dice
    // de qué programas es.
    ...(mismoTotalPorNivel
      ? [{ Icono: BadgeCheck, dato: hayLicenciaturas ? `Mismo precio total en ${nivelesTexto(niveles)}` : 'Mismo precio total en ambos planes' }]
      : []),
    { Icono: GraduationCap, dato: programasTexto },
  ]

  // Tarjetas de la escena del hero: lo que vende, con precios y duraciones
  // CALCULADOS. 🛑 Ninguna ofrece servicios que el combo no incluye.
  const tarjetasHero: Array<{ Icono: LucideIcon; titulo: string; detalle: string }> = [
    ...niveles.map(n => ({
      Icono: BookOpen,
      titulo: etiquetaNivel(n),
      detalle: [duracionesTexto(planesDe(n).map(m => m.meses)), minimaDe(n) > 0 && `desde ${dinero(minimaDe(n))}/mes`]
        .filter(Boolean).join(' · '),
    })),
    // Con licenciaturas la tercera tarjeta es el nivel superior (tres golpes,
    // como HTI #205); sin ellas, «100% en línea».
    hayLicenciaturas
      ? { Icono: GraduationCap, titulo: etiquetaLic, detalle: `${carrerasLic.length === 2 ? 'Dos carreras' : `${carrerasLic.length} carreras`} · ${ritmosLic}` }
      : { Icono: Laptop, titulo: '100% en línea', detalle: 'A tu ritmo, las 24 horas' },
  ]

  const precioCurso = (n: number) => (n > 0 ? precioPublico(n) : 'Sin costo')

  return (
    <div className="la-landing" style={{ background: paleta.blanco, color: paleta.tinta, minHeight: '100vh' }}>
      <BarraAvance fondo={paleta.accion} />

      <a href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded-lg focus:px-4 focus:py-2"
        style={{ background: tHeader.btn2Fondo, color: tHeader.btn2Texto }}>
        Saltar al contenido
      </a>

      {/* ── 1. HEADER (blanco) ─────────────────────────────────────────────
          Logo + nombre de la escuela. Los enlaces van en tinta y se
          subrayan con el acento al pasar; «Iniciar sesión» va de contorno
          y «Inscríbete» en el acento sólido. */}
      <header data-variant="claro" className={`la-header sticky top-0 z-50${desplazado ? ' la-header--desplazado' : ''}`}
        style={{ background: tHeader.fondo, borderBottom: `1px solid ${tHeader.borde}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0" onClick={() => setMenuAbierto(false)}
            aria-label={`${config.nombreCompleto}, inicio`}>
            {/* Logo + nombre escrito. Un lockup que ya trae el nombre se lee
                dos veces, pero a 44 px el texto de un lockup no se lee ninguna:
                el nombre al lado es lo que funciona con cualquier arte. */}
            <Image src={config.logo} alt="" aria-hidden width={LOGO.ancho} height={LOGO.alto} priority
              className="h-11 w-auto object-contain flex-shrink-0" />
            <span className="font-bold truncate" style={{ color: tHeader.titulo, fontFamily: 'var(--font-heading)', fontSize: '1.35rem', letterSpacing: '0.04em' }}>
              {config.nombre}
            </span>
          </Link>

          <nav aria-label="Secciones" className="hidden xl:flex items-center gap-1">
            {enlacesMenu.map(e => (
              <a key={e.href} href={e.href} aria-current={activa === e.href.slice(1) ? 'true' : undefined}
                className="la-nav-link px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
                style={{ color: tHeader.texto, ...variable('--la-subrayado', tHeader.decorativo), ...variable('--la-hover-texto', tHeader.acentoTexto) }}>
                {e.etiqueta}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="la-btn px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ color: tHeader.titulo, border: `1.5px solid ${tHeader.titulo}` }}>
                Iniciar sesión
              </Link>
              <Link href="/register" className="la-btn la-btn-color px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ ...estiloBoton(tHeader.btnFondo, tHeader.btnTexto, tHeader.btnFondo, tHeader.btnHover), borderWidth: 1.5 }}>
                Inscríbete
              </Link>
            </div>
            <button type="button" className="la-btn xl:hidden p-2 rounded-lg"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuAbierto} aria-controls="menu-movil"
              onClick={() => setMenuAbierto(v => !v)} style={{ color: tHeader.titulo }}>
              {menuAbierto ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
            </button>
          </div>
        </div>

        {menuAbierto && (
          <div id="menu-movil" className="la-menu-movil xl:hidden px-4 pb-5"
            style={{ borderTop: `1px solid ${tHeader.borde}`, background: tHeader.fondo }}>
            <nav aria-label="Secciones" className="flex flex-col py-2 max-w-7xl mx-auto">
              {enlacesMenu.map((e, i) => (
                <a key={e.href} href={e.href} onClick={() => setMenuAbierto(false)}
                  className="la-entrada py-3 text-base font-semibold"
                  style={{ ...retraso(i, 35), color: tHeader.texto, borderBottom: `1px solid ${tHeader.borde}` }}>
                  {e.etiqueta}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
              <Link href="/login" className="la-btn text-center px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ color: tHeader.titulo, border: `1.5px solid ${tHeader.titulo}` }}>
                Iniciar sesión
              </Link>
              <Link href="/register" className="la-btn la-btn-color text-center px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ ...estiloBoton(tHeader.btnFondo, tHeader.btnTexto, tHeader.btnFondo, tHeader.btnHover), borderWidth: 1.5 }}>
                Inscríbete
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="contenido">

        {/* ── 2. HERO (blanco): el logo manda ──────────────────────────────────
            🛑 ZONA LIMPIA. En escritorio el texto vive en la columna izquierda y
            la escena —arco de marca, tarjetas y círculo de acento— a la derecha: nada
            queda detrás del logo, del nombre, del eslogan ni de la propuesta.
            🛑 El círculo NO toca el arco: hay papel de por medio y los dos se
            mueven con la MISMA profundidad de parallax, así que el aire no cambia
            al mover el puntero. Dos colores de marca vecinos y pegados se empastan.
            🛑 En MÓVIL la escena baja DESPUÉS de los botones, con un arco chico
            detrás de las tarjetas y sin círculo.
            🛑 Se verifica CON CAPTURA en escritorio Y en móvil. */}
        <section id="inicio" ref={heroRef} data-variant={seccion('hero').variante}
          className="la-hero relative overflow-hidden" style={{ background: tHero.fondo, color: tHero.texto }}>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-16 sm:pt-14 lg:pt-12 lg:pb-20 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-y-12 lg:gap-x-10 items-center">
            <div className="la-hero-contenido relative" style={{ zIndex: 1 }}>
              {L.hero_badge_superior && (
                <p className="la-entrada inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold"
                  style={{ background: tHero.superficie, color: tHero.titulo, border: `1px solid ${tHero.borde}` }}>
                  <GraduationCap size={16} aria-hidden style={{ color: tHero.decorativo, flexShrink: 0 }} />
                  {texto(L.hero_badge_superior)}
                </p>
              )}

              {/* Logo + nombre como un solo bloque. El <h1> es TEXTO REAL —lo leen
                  los buscadores y los lectores de pantalla— con el subtítulo
                  derivado del nombre completo debajo. */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <Image src={config.logo} alt={`Logotipo de ${config.nombreCompleto}`}
                  width={LOGO.ancho} height={LOGO.alto} priority
                  sizes="(min-width: 640px) 200px, 150px"
                  className="la-entrada la-entrada--escala la-logo-hero w-auto h-[120px] sm:h-[150px] lg:h-[160px] flex-shrink-0 self-start sm:self-center" />
                <div className="min-w-0">
                  <h1 className="la-entrada font-bold"
                    style={{ ...retraso(1, 90), color: tHero.titulo, fontSize: 'clamp(2.75rem, 7vw, 4.25rem)', lineHeight: 1.02, letterSpacing: '0.08em' }}>
                    {config.nombre}
                    {subtitulo && <span className="sr-only"> {subtitulo}</span>}
                  </h1>
                  {subtitulo && (
                    <p aria-hidden className="la-entrada mt-2 font-medium"
                      style={{ ...retraso(2, 90), color: tHero.textoSuave, fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem, 1.6vw, 1.2rem)', lineHeight: 1.4 }}>
                      {subtitulo}
                    </p>
                  )}
                </div>
              </div>

              {/* ✅ Eslogan real del cliente, literal. */}
              {config.tagline && (
                <p className="la-entrada mt-6 italic"
                  style={{ ...retraso(2, 90), color: tHero.texto, fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.35rem, 2.5vw, 1.8rem)', lineHeight: 1.3 }}>
                  {config.tagline}
                </p>
              )}

              {/* ⭐ LÍNEA DE PROPUESTA, con su filete decorativo encima: el nombre
                  dice «Terapéutico» y aquí se lee qué se vende. Sale de
                  `hero_titulo` + `hero_highlight` —los campos que el editor enseña
                  en su vista previa— y el remate lleva un subrayado de acento
                  (decorativo: la letra sigue en tinta, 15.59). Debajo, más chico,
                  `hero_subtitulo`. */}
              {(L.hero_titulo || L.hero_highlight) && (
                <div className="la-entrada mt-6 max-w-[38rem]" style={retraso(3, 90)}>
                  <span aria-hidden className="la-filete-hero block rounded-full" style={{ width: 48, height: 4, background: tHero.decorativo }} />
                  <p className="mt-4 font-medium"
                    style={{ color: tHero.texto, fontFamily: 'var(--font-body)', fontSize: 'clamp(1.2rem, 2.1vw, 1.5rem)', lineHeight: 1.45 }}>
                    {texto(L.hero_titulo)}{L.hero_titulo && L.hero_highlight ? ' ' : ''}
                    {L.hero_highlight && (
                      <span className="la-subrayado la-subrayado--entrada" style={variable('--la-color', tHero.decorativo)}>
                        {texto(L.hero_highlight)}
                      </span>
                    )}
                  </p>
                  {L.hero_subtitulo && (
                    <p className="mt-3 text-base sm:text-lg" style={{ color: tHero.textoSuave }}>
                      {texto(L.hero_subtitulo).split('\n').map((linea, i) => (i === 0 ? linea : <span key={i}><br className="hidden sm:block" />{linea}</span>))}
                    </p>
                  )}
                </div>
              )}

              {/* CTAs: acento y marca, con aire entre los
                  dos (gap). 🟠 Sin WhatsApp mientras la escuela no dé su número. */}
              <div className="la-entrada mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3" style={retraso(5, 90)}>
                <Link href="/register" className={`${BOTON} la-btn-color whitespace-nowrap`}
                  style={estiloBoton(tHero.btnFondo, tHero.btnTexto, tHero.btnFondo, tHero.btnHover)}>
                  {sinFlecha(texto(L.hero_cta_primario))}<ArrowRight size={18} aria-hidden className="la-flecha" />
                </Link>
                <a href="#planes" className={`${BOTON} whitespace-nowrap`} style={estiloBoton(tHero.btn2Fondo, tHero.btn2Texto, tHero.btn2Borde)}>
                  Conoce los planes
                </a>
                {urlWhatsApp && (
                  <a href={urlWhatsApp} target="_blank" rel="noopener noreferrer" className={`${BOTON} whitespace-nowrap`}
                    style={estiloBoton('transparent', tHero.titulo, tHero.titulo)}>
                    <MessageCircle size={18} aria-hidden />{texto(L.hero_cta_whatsapp)}
                  </a>
                )}
              </div>

              {L.contadores.length > 0 && (
                <div className="la-entrada mt-10 grid grid-cols-3 max-w-xl" style={retraso(6, 90)}>
                  {L.contadores.map((c, i) => (
                    <div key={i} className={`min-w-0 ${i > 0 ? 'pl-3 sm:pl-4 border-l' : 'pr-3 sm:pr-4'}`} style={{ borderColor: tHero.borde }}>
                      <p className="font-bold"
                        style={{ color: tHero.titulo, fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', lineHeight: 1.1 }}>
                        <Contador hasta={Number(c.valor) || 0} sufijo={c.sufijo} />
                      </p>
                      <p className="mt-1 text-[13px] sm:text-sm font-semibold" style={{ color: tHero.texto }}>{texto(c.etiqueta)}</p>
                      <p className="mt-0.5 text-xs" style={{ color: tHero.textoSuave }}>{texto(c.sub)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* La escena. `aria-hidden`: repite lo que dicen la franja y los
                planes, y un lector de pantalla no necesita oírlo dos veces. */}
            <div aria-hidden className="la-escena relative mx-auto w-full max-w-[400px]">
              <div className="la-forma la-arco" style={{ background: tOscuro.fondo }} />
              <div className="la-forma la-circulo" style={{ background: tHero.btnFondo }} />
              <ul className="la-tarjetas relative">
                {tarjetasHero.map(({ Icono, titulo, detalle }, i) => (
                  <li key={titulo} className={`la-tarjeta-hero la-tarjeta-hero--${i + 1}`}>
                    <div className="la-tarjeta-hero__cuerpo flex items-center gap-3 sm:gap-4 rounded-2xl px-4 sm:px-5 py-4"
                      style={{ background: tHero.fondo, border: `1px solid ${tHero.borde}` }}>
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: tOscuro.fondo }}>
                        <Icono size={22} style={{ color: tOscuro.titulo }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold" style={{ color: tHero.titulo, fontFamily: 'var(--font-heading)', fontSize: '1.15rem', lineHeight: 1.25 }}>
                          {titulo}
                        </span>
                        <span className="mt-0.5 block text-sm" style={{ color: tHero.textoSuave }}>{detalle}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 3. FRANJA DE INDICADORES (oscuro) ──────────────────────────────
            🛑 Letra BLANCA, íconos y divisores en los realces del bloque. Ni
            colores de marca ni el gris del papel. Móvil: 2 × 2 sin divisores. */}
        <section id="indicadores" aria-label="En resumen" data-variant={seccion('franja').variante}
          style={{ background: tFranja.fondo, color: tFranja.texto }}>
          <ul className="max-w-6xl mx-auto px-4 sm:px-8 py-7 grid grid-cols-2 lg:grid-cols-4 gap-y-5">
            {indicadores.map(({ Icono, dato }, i) => (
              <li key={dato} data-la-reveal="escala"
                className={`flex items-center justify-center gap-2.5 px-3 text-center text-sm sm:text-base font-semibold ${i > 0 ? 'lg:border-l' : ''}`}
                style={{ ...retraso(i), borderColor: tFranja.borde }}>
                <Icono size={20} aria-hidden style={{ color: tFranja.decorativo, flexShrink: 0 }} />
                <span>{dato}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── ¿TE IDENTIFICAS? ───────────────────────────────────────────── */}
        {presentes.dolor && (
          <section id="dolor" {...marco('dolor')}>
            <div className={CONTENEDOR}>
              <Encabezado t={tDolor} kicker={texto(L.dolor_kicker)} titulo={texto(L.dolor_titulo)} />
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {L.dolor_items.map((it, i) => {
                  const Icono = ICONO_DOLOR[it.icono]
                  return (
                    <article key={i} data-la-reveal="sube" className="la-card rounded-2xl p-7"
                      style={{ ...retraso(i, 90), background: tDolor.superficie, border: `1px solid ${tDolor.borde}` }}>
                      <span aria-hidden className="la-icono-card flex items-center justify-center rounded-2xl text-2xl"
                        style={{ width: 52, height: 52, background: tDolor.btn2Fondo, color: tDolor.btn2Texto }}>
                        {Icono ? <Icono size={24} /> : it.icono}
                      </span>
                      <h3 className="mt-5 text-xl font-bold" style={{ color: tDolor.titulo }}>{texto(it.titulo)}</h3>
                      <p className="mt-2 text-base leading-relaxed" style={{ color: tDolor.textoSuave }}>{texto(it.desc)}</p>
                    </article>
                  )
                })}
              </div>
              {L.dolor_cierre && (
                <div data-la-reveal className="mt-14 text-center max-w-3xl mx-auto">
                  <p className="font-bold" style={{ color: tDolor.titulo, fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', lineHeight: 1.3 }}>
                    {texto(L.dolor_cierre)}{' '}
                    <span className="la-subrayado" style={variable('--la-color', tDolor.decorativo)}>{config.nombre}</span>
                  </p>
                  {L.dolor_cierre_sub && (
                    <p className="mt-4 text-base sm:text-lg" style={{ color: tDolor.textoSuave }}>{texto(L.dolor_cierre_sub)}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 4. NIVELES (blanco) ──────────────────────────────────────────────
            Tarjetas en superficie con filete superior decorativo. Títulos en la
            marca, cuerpo en tinta y datos secundarios en gris. Cada
            cifra se lee con `mensualidadDe(nivel, …)`, que respeta el precio
            por nivel. */}
        <section id="niveles" {...marco('niveles')}>
          <div className={CONTENEDOR}>
            <Encabezado t={tNiveles} kicker={hayLicenciaturas ? 'Programas' : 'Niveles'} titulo={programasTexto}
              bajada={hayLicenciaturas
                ? 'Estudia en línea, a tu propio ritmo, con el mismo acompañamiento en todos los programas.'
                : 'Estudia en línea, a tu propio ritmo, con el mismo acompañamiento en los dos niveles.'} />
            <div className={`grid gap-6 mt-12 ${hayLicenciaturas ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
              {niveles.map((nivel, i) => {
                const planesNivel = planesDe(nivel)
                const certificacion = certificacionDe(nivel, precios)
                const totales = planesNivel.map(m => totalPlanDe(nivel, m, precios))
                const totalUnico = totalesIguales(totales)
                return (
                  <article key={nivel} data-la-reveal={i === 0 ? 'izq' : 'der'} className="la-card rounded-2xl flex flex-col overflow-hidden"
                    style={{ ...retraso(i + 1), background: tNiveles.superficie, border: `1px solid ${tNiveles.borde}` }}>
                    {/* El filete superior decorativo: se abre de izquierda a derecha. */}
                    <div aria-hidden className="la-surco" style={{ height: 4, background: tNiveles.decorativo }} />
                    <div className="p-7 sm:p-8 flex flex-col flex-1">
                      <span className="la-icono-card inline-flex">
                        <GraduationCap size={30} aria-hidden style={{ color: tNiveles.titulo }} />
                      </span>
                      <h3 className="mt-4 text-2xl font-bold" style={{ color: tNiveles.titulo }}>{etiquetaNivel(nivel)}</h3>
                      <p className="mt-2 text-base" style={{ color: tNiveles.texto }}>
                        Concluye tu {etiquetaNivel(nivel).toLowerCase()} en {duracionesTexto(planesNivel.map(m => m.meses))}.
                      </p>
                      <p className="mt-1 text-sm" style={{ color: tNiveles.textoSuave }}>{PARA_QUIEN[nivel]}</p>
                      <ul className="mt-5 space-y-2.5">
                        {planesNivel.map(m => (
                          <li key={m.id} className="flex items-start gap-2.5 text-sm sm:text-base" style={{ color: tNiveles.texto }}>
                            <CheckCircle2 size={18} aria-hidden className="mt-0.5" style={{ color: tNiveles.titulo, flexShrink: 0 }} />
                            <span>
                              {getPlanLabelConDuracion(m, config.modalidades)} · <strong style={{ color: tNiveles.titulo }}>{dinero(mensualidadDe(nivel, m, precios))}</strong>/mes
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 pt-5 text-sm flex-1 space-y-1.5" style={{ borderTop: `1px solid ${tNiveles.borde}` }}>
                        {totalUnico && (
                          <p style={{ color: tNiveles.textoSuave }}>
                            Total del plan: <strong className="text-lg" style={{ color: tNiveles.titulo }}>{dinero(totales[0])}</strong>
                          </p>
                        )}
                        {certificacion > 0 && (
                          <p style={{ color: tNiveles.textoSuave }}>
                            Certificación: <strong className="text-lg" style={{ color: tNiveles.titulo }}>{dinero(certificacion)}</strong>
                          </p>
                        )}
                      </div>
                      {/* Enlace en el color de marca: la tarjeta va sobre superficie, donde
                          un acento vivo suele quedarse corto. */}
                      <a href="#planes" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                        style={{ color: tNiveles.titulo }}>
                        Ver planes<ArrowRight size={15} aria-hidden />
                      </a>
                    </div>
                  </article>
                )
              })}
              {/* Tercer programa (add-on V3.7). 🛑 La tarjeta NO anuncia solo la
                  mensualidad: dice la titulación y el costo total desde el que
                  arranca, porque la titulación es el 65–70 % del programa. */}
              {hayLicenciaturas && (() => {
                const totalMin = Math.min(...planesLic.map(p => p.total))
                return (
                  <article data-la-reveal="der" className="la-card rounded-2xl flex flex-col overflow-hidden md:col-span-2 lg:col-span-1"
                    style={{ ...retraso(3), background: tNiveles.superficie, border: `1px solid ${tNiveles.borde}` }}>
                    <div aria-hidden className="la-surco" style={{ height: 4, background: tNiveles.decorativo }} />
                    <div className="p-7 sm:p-8 flex flex-col flex-1">
                      <span className="la-icono-card inline-flex">
                        <GraduationCap size={30} aria-hidden style={{ color: tNiveles.titulo }} />
                      </span>
                      <h3 className="mt-4 text-2xl font-bold" style={{ color: tNiveles.titulo }}>{etiquetaLic}</h3>
                      <p className="mt-2 text-base" style={{ color: tNiveles.texto }}>
                        {carrerasLic.length === 1 ? carrerasLic[0].nombre : unirConO(carrerasLic.map(c => c.nombre.replace(/^Licenciatura en /, ''))).replace(/ o /, ' y ')} con título y cédula profesional.
                      </p>
                      <p className="mt-1 text-sm" style={{ color: tNiveles.textoSuave }}>Para quien ya concluyó la preparatoria.</p>
                      <ul className="mt-5 space-y-2.5">
                        {planesLic.map(p => (
                          <li key={p.modalidadId} className="flex items-start gap-2.5 text-sm sm:text-base" style={{ color: tNiveles.texto }}>
                            <CheckCircle2 size={18} aria-hidden className="mt-0.5" style={{ color: tNiveles.titulo, flexShrink: 0 }} />
                            <span>{p.meses} meses · <strong style={{ color: tNiveles.titulo }}>{dinero(p.mensualidad)}</strong>/mes</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 pt-5 text-sm flex-1 space-y-1.5" style={{ borderTop: `1px solid ${tNiveles.borde}` }}>
                        <p style={{ color: tNiveles.textoSuave }}>
                          Titulación: <strong className="text-lg" style={{ color: tNiveles.titulo }}>{dinero(planesLic[0].titulacion)}</strong>
                        </p>
                        <p style={{ color: tNiveles.textoSuave }}>
                          Costo total {planesLic.length > 1 ? 'desde ' : ''}<strong className="text-lg" style={{ color: tNiveles.titulo }}>{dinero(totalMin)}</strong>
                        </p>
                      </div>
                      <a href="#licenciaturas" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                        style={{ color: tNiveles.titulo }}>
                        Ver licenciaturas<ArrowRight size={15} aria-hidden />
                      </a>
                    </div>
                  </article>
                )
              })()}
            </div>
          </div>
        </section>

        {/* ── 5. PLANES Y PRECIOS (suave) ─────────────────────────────────────
            ⭐ Aquí vive el argumento de la escuela: en cada nivel, los dos totales
            lado a lado. Un bloque por nivel porque los niveles cuestan distinto.
            🛑 Todas las tarjetas llevan el mismo tratamiento: ninguna se destaca y
            ninguna lleva insignia de preferencia. Cada una dice solo lo que es
            verdad de ella (chips calculados por `etiquetasPlan`). */}
        <section id="planes" {...marco('planes')}>
          <div className={CONTENEDOR}>
            <Encabezado t={tPlanes}
              kicker={texto(L.programas_kicker)}
              titulo={mismoTotalPorNivel ? texto(L.programas_titulo) : 'Elige tu plan'}
              // El subtítulo de fábrica dice "Inscripción única {inscripcion}": solo
              // se usa si esa general es la que de verdad pagan todos los niveles.
              // Uno propio que no usa {inscripcion} se respeta (`subtituloVale`).
              bajada={mismoTotalPorNivel && ins.subtituloVale(L.programas_subtitulo)
                ? texto(L.programas_subtitulo)
                : `Inscripción ${ins.comun ? `de ${ins.textoComun}` : ins.textoPorNivel}. Cambia en cuánto tiempo concluyes y cuánto pagas al mes.`} />

            <div className="mt-12 space-y-14">
              {niveles.map((nivel, iNivel) => {
                const planesNivel = planesDe(nivel)
                const totales = planesNivel.map(m => totalPlanDe(nivel, m, precios))
                const etiquetasNivel = etiquetasPlan(planesNivel.map(m => ({
                  id: m.id, meses: m.meses, mensualidad: mensualidadDe(nivel, m, precios),
                })))
                return (
                  <div key={nivel} className="max-w-4xl mx-auto">
                    <div data-la-reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-bold" style={{ color: tPlanes.titulo, fontSize: 'clamp(1.6rem, 2.6vw, 2rem)' }}>
                        {etiquetaNivel(nivel)}
                      </h3>
                      {totalesIguales(totales) && (
                        <p className="text-sm sm:text-base font-semibold" style={{ color: tPlanes.textoSuave }}>
                          Cualquier plan: <span style={{ color: tPlanes.titulo }}>{dinero(totales[0])}</span> en total
                        </p>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 mt-5">
                      {planesNivel.map((plan, i) => {
                        const mensualidad = mensualidadDe(nivel, plan, precios)
                        const total = totalPlanDe(nivel, plan, precios)
                        return (
                          <div key={plan.id} data-la-reveal="sube" style={retraso(iNivel + i + 1, 110)}>
                            <Inclinable className="h-full">
                              <article className="la-card rounded-2xl flex flex-col h-full overflow-hidden"
                                style={{ background: tPlanes.superficie, border: `1px solid ${tPlanes.borde}` }}>
                                {/* Barra superior MORADA de 4 px. */}
                                <div aria-hidden className="la-surco" style={{ height: 4, background: tPlanes.titulo }} />
                                <div className="p-7 sm:p-8 flex flex-col flex-1">
                                  <h4 className="text-sm font-bold uppercase tracking-[0.16em]"
                                    style={{ color: tPlanes.titulo, fontFamily: 'var(--font-body)' }}>
                                    {nombrePlan(plan)}
                                  </h4>
                                  <p className="mt-1 text-base font-semibold" style={{ color: tPlanes.textoSuave }}>
                                    {plan.materiasPorMes} {plan.materiasPorMes === 1 ? 'materia' : 'materias'} al mes
                                  </p>

                                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2" style={{ color: tPlanes.titulo }}>
                                    <span className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                                      {dinero(mensualidad)}
                                    </span>
                                    <span className="text-base" style={{ color: tPlanes.textoSuave }}>/ mes</span>
                                  </p>

                                  <ul className="mt-5 space-y-2 text-sm sm:text-base" style={{ color: tPlanes.texto }}>
                                    <li className="flex items-center gap-2">
                                      <CheckCircle2 size={17} aria-hidden style={{ color: tPlanes.titulo, flexShrink: 0 }} />
                                      {plan.meses} mensualidades
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <CheckCircle2 size={17} aria-hidden style={{ color: tPlanes.titulo, flexShrink: 0 }} />
                                      + inscripción {ins.textoDe(nivel)}
                                    </li>
                                  </ul>

                                  <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${tPlanes.borde}` }}>
                                    <p className="flex items-baseline justify-between gap-4" style={{ color: tPlanes.texto }}>
                                      <span className="text-sm sm:text-base">Total del plan</span>
                                      <strong className="text-3xl" style={{ color: tPlanes.titulo, fontFamily: 'var(--font-heading)' }}>{dinero(total)}</strong>
                                    </p>
                                  </div>

                                  {/* Chips del acento, con su letra medida, sobre la tarjeta. */}
                                  <div className="mt-6 flex flex-wrap gap-2 flex-1 items-end">
                                    {(etiquetasNivel[plan.id] ?? []).map(e => (
                                      <span key={e} className="rounded-full px-3.5 py-1.5 text-sm font-semibold"
                                        style={{ background: tPlanes.chipFondo, color: tPlanes.chipTexto }}>
                                        {e}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </article>
                            </Inclinable>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* La certificación va aparte: se paga al concluir y NO forma parte
                del total del plan. */}
            <div data-la-reveal className="mt-14 max-w-4xl mx-auto rounded-2xl p-6 sm:p-8"
              style={{ ...retraso(3, 110), background: tPlanes.superficie, border: `1px solid ${tPlanes.borde}` }}>
              <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: tPlanes.titulo }}>
                Certificación · pago único al concluir
              </p>
              <dl className="mt-4 grid sm:grid-cols-2 gap-3">
                {niveles.map(n => (
                  <div key={n} className="flex items-baseline justify-between gap-4 rounded-xl px-4 py-3" style={{ background: tPlanes.fondo }}>
                    <dt style={{ color: tPlanes.texto }}>{etiquetaNivel(n)}</dt>
                    <dd className="text-lg font-bold" style={{ color: tPlanes.titulo }}>{dinero(certificacionDe(n, precios))}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 flex items-start gap-2 text-sm" style={{ color: tPlanes.textoSuave }}>
                <AlertCircle size={16} aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: tPlanes.titulo }} />
                La certificación no está incluida en el total del plan.
              </p>
            </div>

            <div data-la-reveal className="mt-10 text-center">
              <Link href="/register" className={`${BOTON} la-btn-color`}
                style={estiloBoton(tPlanes.btnFondo, tPlanes.btnTexto, tPlanes.btnFondo, tPlanes.btnHover)}>
                {sinFlecha(texto(L.programas_cta))}<ArrowRight size={18} aria-hidden className="la-flecha" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── LICENCIATURAS (claro, con panel oscuro dentro) — add-on ────── */}
        {hayLicenciaturas && textosLic && (
          <SeccionLicenciaturas t={tLic} tOscuro={tOscuro} fmt={dinero} canal={canal} variante={seccion('licenciaturas').variante} textos={textosLic} />
        )}

        {/* ── 6. VALIDEZ OFICIAL MX + USA (oscuro) ────────────────────────────
            🛑 NINGÚN COLOR DE MARCA AQUÍ. Documentos, verificación y botones en
            blanco y en los realces del bloque.
            🛑 El folio va a máximo contraste (blanco sobre el fondo del bloque) y en
            ancho fijo: es el dato que la persona teclea en el portal de la SEP. */}
        {validezActiva && (
          <section id="validez" {...marco('validez')} className="relative overflow-hidden">
            <div aria-hidden className="la-halo la-halo--izq" style={variable('--la-color', tValidez.decorativo)} />
            <div className={`relative ${CONTENEDOR}`}>
              <Encabezado t={tValidez} kicker={`Validez oficial de ${nivelesTexto(niveles)}`} titulo={texto(VALIDEZ.titulo)} bajada={texto(VALIDEZ.subtitulo)} />
              <div className="grid md:grid-cols-2 gap-6 mt-12">
                {VALIDEZ.documentos.map((d, i) => (
                  <figure key={d.img} data-la-reveal={i % 2 === 0 ? 'izq' : 'der'} className="la-card la-documento rounded-2xl p-4 sm:p-5"
                    style={{ ...retraso(i + 1, 110), background: tValidez.superficie, border: `1px solid ${tValidez.borde}` }}>
                    <div className="overflow-hidden rounded-lg" style={{ background: paleta.blanco }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.img} alt={d.alt} loading="lazy" className="la-documento__img w-full h-auto" />
                    </div>
                    <figcaption className="mt-4 flex items-center justify-center gap-2 text-sm text-center" style={{ color: tValidez.textoSuave }}>
                      <FileCheck size={18} aria-hidden style={{ color: tValidez.decorativo, flexShrink: 0 }} />
                      {d.pie}
                    </figcaption>
                  </figure>
                ))}
              </div>

              {folio !== '' && (
                <div className="mt-16 max-w-3xl mx-auto text-center">
                  <p data-la-reveal className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: tValidez.titulo }}>
                    <ShieldCheck size={18} aria-hidden style={{ color: tValidez.decorativo }} /> {texto(VALIDEZ.folioEtiqueta)}
                  </p>
                  <h3 data-la-reveal className="mt-4 font-bold"
                    style={{ ...retraso(1), color: tValidez.titulo, fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', lineHeight: 1.2 }}>
                    {texto(VALIDEZ.verificaTitulo)} — <em style={{ color: tValidez.acentoTexto }}>{texto(VALIDEZ.verificaResalte)}</em>
                  </h3>
                  {VALIDEZ.verificaTexto && (
                    <p data-la-reveal className="mt-5 text-base sm:text-lg leading-relaxed" style={{ ...retraso(2), color: tValidez.textoSuave }}>
                      {texto(VALIDEZ.verificaTexto)}
                    </p>
                  )}

                  <div data-la-reveal="escala" className="mt-10 rounded-2xl px-5 py-8 sm:px-10"
                    style={{ ...retraso(3), background: tValidez.superficie, border: `1px solid ${tValidez.borde}` }}>
                    <p data-la-reveal className="la-folio font-mono font-bold text-2xl sm:text-3xl md:text-4xl"
                      style={{ color: tValidez.titulo, letterSpacing: '0.16em', overflowWrap: 'anywhere' }}>
                      {Array.from(folio).map((car, i) => (
                        <span key={i} className="la-folio-car" style={indice(i)}>{car}</span>
                      ))}
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                      <BotonCopiar valor={folio} etiqueta="Copiar folio" fondo="transparent"
                        texto={tValidez.titulo} borde={tValidez.titulo} className="w-full sm:w-auto" />
                      <a href={VALIDEZ.portalUrl} target="_blank" rel="noopener noreferrer" className={`${BOTON} la-btn-color`}
                        style={estiloBoton(tValidez.btnFondo, tValidez.btnTexto, tValidez.btnFondo, tValidez.btnHover)}>
                        {texto(VALIDEZ.portalTexto)}<ArrowRight size={18} aria-hidden className="la-flecha" />
                      </a>
                    </div>
                  </div>

                  {VALIDEZ.folioNota && (
                    <p data-la-reveal className="mt-6 text-sm max-w-xl mx-auto" style={{ ...retraso(4), color: tValidez.textoSuave }}>
                      {texto(VALIDEZ.folioNota)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── ANTES Y DESPUÉS ───────────────────────────────────────────────
            ⚠️ La columna «Con {nombre}» es una TARJETA oscura dentro de una sección
            clara, no una sección oscura pegada a otra. Dentro de ella rige lo
            mismo que en cualquier bloque oscuro: blanco y realces. */}
        {presentes.transformacion && (
          <section id="transformacion" {...marco('transformacion')}>
            <div className={CONTENEDOR}>
              <Encabezado t={tTransf} kicker={texto(L.transformacion_kicker)} titulo={texto(L.transformacion_titulo)} />
              <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-5xl mx-auto">
                <div data-la-reveal="izq" className="rounded-2xl p-7 sm:p-8"
                  style={{ background: tTransf.superficie, border: `1px solid ${tTransf.borde}` }}>
                  <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em]" style={{ color: tTransf.textoSuave }}>
                    <XCircle size={18} aria-hidden /> Sin {config.nombre}
                  </p>
                  <ul className="mt-6 space-y-4">
                    {L.transformacion_sin.map((s, i) => (
                      <li key={i} data-la-reveal className="flex gap-3" style={retraso(i + 1, 80)}>
                        <XCircle size={20} aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: tTransf.textoSuave }} />
                        <span style={{ color: tTransf.texto }}>{texto(s)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div data-la-reveal="der" data-variant="oscuro" className="la-card rounded-2xl p-7 sm:p-8"
                  style={{ ...retraso(1), background: tOscuro.fondo, border: `1px solid ${tOscuro.fondo}` }}>
                  <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em]" style={{ color: tOscuro.titulo }}>
                    <GraduationCap size={18} aria-hidden style={{ color: tOscuro.decorativo }} /> Con {config.nombre}
                  </p>
                  <ul className="mt-6 space-y-4">
                    {L.transformacion_con.map((s, i) => (
                      <li key={i} data-la-reveal className="flex gap-3" style={retraso(i + 2, 80)}>
                        <CheckCircle2 size={20} aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: tOscuro.decorativo }} />
                        <span style={{ color: tOscuro.texto }}>{texto(s)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── CÓMO FUNCIONA ─────────────────────────────────────────────────
            La línea que une los pasos se dibuja de izquierda a derecha. Los
            círculos llevan el color de MARCA con su letra encima: la sección puede
            caer en suave, donde un acento vivo como fondo de un número pequeño
            se queda corto. */}
        {presentes.proceso && (
          <section id="proceso" {...marco('proceso')}>
            <div className={CONTENEDOR}>
              <Encabezado t={tProceso} kicker={texto(L.proceso_kicker)} titulo={texto(L.proceso_titulo)} />
              <div className="relative mt-14">
                {COLUMNAS_PROCESO[L.proceso_pasos.length] && (
                  <div aria-hidden data-la-reveal="linea" className="hidden lg:block absolute"
                    style={{ top: 27, left: `${50 / L.proceso_pasos.length}%`, right: `${50 / L.proceso_pasos.length}%`, height: 2, background: tProceso.borde }} />
                )}
                <ol className={`relative grid sm:grid-cols-2 gap-10 sm:gap-8 ${COLUMNAS_PROCESO[L.proceso_pasos.length] ?? 'lg:grid-cols-4'}`}>
                  {L.proceso_pasos.map((p, i) => (
                    <li key={i} className="text-center lg:px-2">
                      <span data-la-reveal="escala" className="mx-auto flex items-center justify-center rounded-full text-lg font-bold"
                        style={{ ...retraso(i, 150), width: 56, height: 56, background: tProceso.btn2Fondo, color: tProceso.btn2Texto, boxShadow: `0 0 0 8px ${tProceso.fondo}` }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 data-la-reveal className="mt-5 text-lg font-bold"
                        style={{ ...retraso(i, 150), color: tProceso.titulo }}>{texto(p.titulo)}</h3>
                      <p data-la-reveal className="mt-2 text-sm sm:text-base leading-relaxed" style={{ ...retraso(i, 150), color: tProceso.textoSuave }}>{texto(p.desc)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONIOS (solo si la escuela publica alguno) ─────────────── */}
        {presentes.testimonios && (
          <section id="testimonios" {...marco('testimonios')}>
            <div className={CONTENEDOR}>
              <Encabezado t={tTestim} kicker={texto(L.testimonios_kicker)} titulo={texto(L.testimonios_titulo)} bajada={texto(L.testimonios_subtitulo)} />
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {testimonios.map((tm, i) => (
                  <figure key={i} data-la-reveal="sube" className="la-card rounded-2xl p-7 flex flex-col"
                    style={{ ...retraso(i % 3, 100), background: tTestim.superficie, border: `1px solid ${tTestim.borde}` }}>
                    <Quote size={28} aria-hidden style={{ color: tTestim.decorativo }} />
                    <blockquote className="mt-4 flex-1 italic leading-relaxed" style={{ color: tTestim.texto }}>{tm.quote}</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span aria-hidden className="flex items-center justify-center rounded-full text-sm font-bold"
                        style={{ width: 44, height: 44, background: tTestim.btn2Fondo, color: tTestim.btn2Texto }}>
                        {tm.initials}
                      </span>
                      <span>
                        <span className="block font-semibold" style={{ color: tTestim.titulo }}>{tm.name}</span>
                        <span className="block text-sm" style={{ color: tTestim.textoSuave }}>{[tm.age, tm.nivel].filter(Boolean).join(' · ')}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── BENEFICIOS (oscuro) ────────────────────────────────────────────
            🛑 Los íconos van en chips BLANCOS con letra del propio fondo: dentro
            del bloque oscuro, un chip del acento puede empastarse. */}
        {presentes.beneficios && (
          <section id="beneficios" {...marco('beneficios')} className="relative overflow-hidden">
            <div aria-hidden className="la-halo la-halo--izq" style={variable('--la-color', tBenef.decorativo)} />
            <div aria-hidden className="la-halo la-halo--der" style={variable('--la-color', tBenef.textoSuave)} />
            <div className={`relative ${CONTENEDOR}`}>
              <Encabezado t={tBenef} kicker="Beneficios" titulo={texto(L.beneficios_titulo)} bajada={texto(L.beneficios_subtitulo)} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
                {L.beneficios_items.map((b, i) => (
                  <article key={i} data-la-reveal="sube" className="la-card rounded-2xl p-6"
                    style={{ ...retraso(i % 3, 100), background: tBenef.superficie, border: `1px solid ${tBenef.borde}` }}>
                    <span aria-hidden className="la-icono-card flex items-center justify-center rounded-xl"
                      style={{ width: 44, height: 44, background: tBenef.chipFondo, color: tBenef.chipTexto }}>
                      <CheckCircle2 size={22} />
                    </span>
                    <h3 className="mt-4 text-lg font-bold" style={{ color: tBenef.titulo }}>{texto(b.titulo)}</h3>
                    <p className="mt-2 text-sm sm:text-base leading-relaxed" style={{ color: tBenef.textoSuave }}>{texto(b.desc)}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CATÁLOGO (solo con cursos publicados) ────────────────────────── */}
        {hayCatalogo && (
          <section id="diplomados" {...marco('catalogo')}>
            <div className={CONTENEDOR}>
              <Encabezado t={tCatalogo} kicker="Cursos" titulo={texto(L.catalogoTitulo)} bajada={texto(L.catalogoSubtitulo)} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {catalogo.map((c, i) => (
                  <div key={c.id} data-la-reveal="sube" style={retraso(i % 3, 100)}>
                    <Link href={`/diplomados/${c.id}`} className="la-card rounded-2xl p-6 block h-full"
                      style={{ background: tCatalogo.superficie, border: `1px solid ${tCatalogo.borde}`, color: tCatalogo.texto }}>
                      <h3 className="text-lg font-bold" style={{ color: tCatalogo.titulo }}>{c.nombre}</h3>
                      {c.descripcion && (
                        <p className="mt-2 text-sm line-clamp-3" style={{ color: tCatalogo.textoSuave }}>{c.descripcion}</p>
                      )}
                      <p className="mt-4 text-sm font-semibold flex items-center gap-1.5" style={{ color: tCatalogo.titulo }}>
                        {Number(c.precio_mensualidad) > 0
                          ? `${precioCurso(Number(c.precio_mensualidad))} al mes`
                          : `${precioCurso(Number(c.precio_inscripcion))} · pago único`}
                        <ArrowRight size={15} aria-hidden />
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PREGUNTAS FRECUENTES ──────────────────────────────────────────── */}
        {presentes.faq && (
          <section id="preguntas" {...marco('faq')}>
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
              <Encabezado t={tFaq} kicker={texto(L.faq_kicker)} titulo={texto(L.faq_titulo)} />
              <div className="mt-12" style={{ borderTop: `1px solid ${tFaq.borde}` }}>
                {faqs.map((f, i) => (
                  <div key={i} data-la-reveal style={retraso(Math.min(i, 5), 60)}>
                    <PreguntaFrecuente id={`faq-${i}`} pregunta={f.q} respuesta={f.a} t={tFaq} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA FINAL (oscuro): EL HERO INVERTIDO ──────────────────────────
            Allá un arco de marca sobre papel; aquí un disco BLANCO sobre el color
            de marca, con el logo encima, que sobre su propio color se leería a medias.
            🛑 Botón BLANCO con letra del fondo: dentro del bloque oscuro no va acento.
            ⚠️ VA ANTES DEL CONTACTO: si no, el pie oscuro quedaría pegado a él. */}
        <section id="empieza" {...marco('cta')} className="relative overflow-hidden">
          <div aria-hidden className="la-aro la-aro--1" style={{ borderColor: tCta.decorativo }} />
          <div aria-hidden className="la-aro la-aro--2" style={{ borderColor: tCta.textoSuave }} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20 grid md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-center">
            <div className="text-center md:text-left">
              <h2 data-la-reveal className="font-bold" style={{ color: tCta.titulo, fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
                {texto(L.cta_titulo)}
                {L.cta_highlight && <><br /><em style={{ color: tCta.acentoTexto }}>{texto(L.cta_highlight)}</em></>}
              </h2>
              {L.cta_subtitulo && (
                <p data-la-reveal className="mt-5 text-base sm:text-lg" style={{ ...retraso(1), color: tCta.textoSuave }}>{texto(L.cta_subtitulo)}</p>
              )}
              <div data-la-reveal className="mt-9 flex flex-col sm:flex-row gap-3 justify-center md:justify-start" style={retraso(2)}>
                <Link href="/register" className={`${BOTON} la-btn-color`}
                  style={estiloBoton(tCta.btnFondo, tCta.btnTexto, tCta.btnFondo, tCta.btnHover)}>
                  {sinFlecha(texto(L.cta_boton))}<ArrowRight size={18} aria-hidden className="la-flecha" />
                </Link>
                {urlWhatsApp && (
                  <a href={urlWhatsApp} target="_blank" rel="noopener noreferrer" className={BOTON}
                    style={estiloBoton(tCta.btn2Fondo, tCta.btn2Texto, tCta.btn2Borde)}>
                    <MessageCircle size={18} aria-hidden />{texto(L.cta_whatsapp)}
                  </a>
                )}
              </div>
            </div>
            <div data-la-reveal="der" aria-hidden className="la-escena-cierre relative mx-auto w-full max-w-[360px]">
              <div className="la-disco" style={{ background: paleta.blanco }} />
              <Image src={config.logo} alt="" width={LOGO.ancho} height={LOGO.alto}
                sizes="(min-width: 1024px) 240px, 200px"
                className="la-marca-cierre relative w-[200px] lg:w-[240px] h-auto" />
            </div>
          </div>
        </section>

        {/* ── 7. CONTACTO (blanco) ────────────────────────────────────────────
            🟠 HOY UN SOLO CANAL: el correo. Sin WhatsApp (no hay número), sin
            domicilio (100 % en línea) y sin redes. Por eso la tarjeta del correo
            va en grande. 🛑 Sin formularios de agenda. */}
        <section id="contacto" {...marco('contacto')}>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <div className="min-w-0">
              <Encabezado t={tContacto} centrado={false} kicker="Contacto" titulo="¿Tienes dudas? Te orientamos"
                bajada="Escríbenos y te ayudamos a elegir el nivel y el plan que mejor te acomoda." />
              <div data-la-reveal className="mt-8" style={retraso(3)}>
                <Link href="/register" className={`${BOTON} la-btn-color`}
                  style={estiloBoton(tContacto.btnFondo, tContacto.btnTexto, tContacto.btnFondo, tContacto.btnHover)}>
                  {sinFlecha(texto(L.hero_cta_primario))}<ArrowRight size={18} aria-hidden className="la-flecha" />
                </Link>
              </div>
            </div>

            <ul className="space-y-4 min-w-0">
              {urlWhatsApp && (
                <li data-la-reveal="der" style={retraso(1)}>
                  <TarjetaContacto t={tContacto} href={urlWhatsApp} externo destacada Icono={MessageCircle} etiqueta="WhatsApp" valor={telefonoVisible} />
                </li>
              )}
              {correo && mailto && (
                <li data-la-reveal="der" style={retraso(2)}>
                  <TarjetaContacto t={tContacto} href={mailto} Icono={Mail} etiqueta="Escríbenos por correo"
                    valor={correo} grande={!urlWhatsApp} accion={urlWhatsApp ? undefined : 'Escríbenos'}
                    nota={urlWhatsApp ? undefined : 'Te respondemos para orientarte sobre niveles, planes y documentos.'} />
                </li>
              )}
            </ul>
          </div>
        </section>
      </main>

      {/* ── 8. PIE (oscuro) ─────────────────────────────────────────────────────
          Logo en `logoOscuro`, y en PLACA BLANCA cuando la escuela entregó un
          solo archivo. Filete superior en el realce del bloque.
          🛑 Ningún color de marca en el pie. 🟠 Sin domicilio, redes ni WhatsApp si la escuela no los tiene. */}
      <footer data-variant={seccion('pie').variante} className="relative overflow-hidden"
        style={{ background: tPie.fondo, color: tPie.texto, borderTop: `3px solid ${tPie.decorativo}` }}>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-14 grid gap-10 md:grid-cols-2">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {logoEnPlaca ? (
              <span className="inline-flex rounded-xl p-3 flex-shrink-0 self-start" style={{ background: paleta.blanco }}>
                <Image src={config.logoOscuro} alt={`Logotipo de ${config.nombreCompleto}`} width={LOGO.ancho} height={LOGO.alto}
                  className="h-16 w-auto" />
              </span>
            ) : (
              <Image src={config.logoOscuro} alt={`Logotipo de ${config.nombreCompleto}`}
                width={LOGO.ancho} height={LOGO.alto}
                className="h-20 w-auto flex-shrink-0 self-start" />
            )}
            <div>
              <p className="font-semibold leading-snug" style={{ color: tPie.titulo, fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>{config.nombreCompleto}</p>
              {config.tagline && (
                <p className="mt-2 italic" style={{ color: tPie.textoSuave, fontFamily: 'var(--font-heading)' }}>{config.tagline}</p>
              )}
              <p className="mt-2 text-sm" style={{ color: tPie.textoSuave }}>
                {programasTexto} en línea
              </p>
            </div>
          </div>

          <div className="md:justify-self-end">
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: tPie.textoSuave }}>Contacto</p>
            <ul className="mt-4 space-y-2 text-sm">
              {urlWhatsApp && (
                <li>
                  <a href={urlWhatsApp} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline underline-offset-4" style={{ color: tPie.texto }}>
                    <MessageCircle size={16} aria-hidden style={{ color: tPie.decorativo }} />WhatsApp {telefonoVisible}
                  </a>
                </li>
              )}
              {correo && mailto && (
                <li>
                  <a href={mailto} className="inline-flex items-center gap-2 hover:underline underline-offset-4 break-all"
                    style={{ color: tPie.texto }}>
                    <Mail size={16} aria-hidden style={{ color: tPie.decorativo }} />{correo}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="relative" style={{ borderTop: `1px solid ${tPie.borde}` }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs"
            style={{ color: tPie.textoSuave }}>
            <p>© {anio} {config.nombreCompleto}</p>
            <nav aria-label="Legal" className="flex gap-5">
              <Link href="/aviso-de-privacidad" className="hover:underline underline-offset-4" style={{ color: tPie.textoSuave }}>
                Aviso de privacidad
              </Link>
              <Link href="/terminos-y-condiciones" className="hover:underline underline-offset-4" style={{ color: tPie.textoSuave }}>
                Términos
              </Link>
            </nav>
          </div>
        </div>
      </footer>

      {urlWhatsApp && (
        <WhatsAppFlotante href={urlWhatsApp} etiqueta={`Escríbenos por WhatsApp al ${telefonoVisible}`}
          fondo={tOscuro.fondo} icono={tOscuro.titulo} anillo={tOscuro.textoSuave} />
      )}
    </div>
  )
}
