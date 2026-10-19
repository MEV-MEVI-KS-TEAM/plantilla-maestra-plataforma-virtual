/**
 * Estructura de la portada ANIMADA: qué piezas lleva según el modo.
 *
 * Módulo PURO (sin React, sin CONFIG, sin Supabase) para poder probarlo:
 * `LandingAnimada` le pasa lo que ya calculó y pinta lo que devuelve.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────────
 *
 * La portada nació para escuelas de Secundaria y Preparatoria, y en modo
 * `solo_cursos` seguía pintando Niveles, Planes, el menú «Niveles · Planes», las
 * tarjetas del hero por nivel, la franja «Secundaria y Preparatoria» y un
 * WhatsApp que pedía informes de esos niveles (encontrado en CAAIV #288).
 *
 * 🛑 EN MODO TRADICIONAL TODO SALE EXACTAMENTE COMO ANTES: cada función devuelve
 *    los mismos literales que estaban escritos en el JSX. Lo vigila
 *    tests/unit/landing-estructura.spec.ts.
 * 🟠 Las llaves nuevas de `landing` (servicios_*, catalogoGrupos, tarjetasHero,
 *    indicadores, whatsapp2, horario) son OPCIONALES con default vacío: sin
 *    ellas la portada no cambia ni un píxel.
 */
import type { IdSeccion } from './tokens'

/** Nombres de ícono de `lucide-react`; el componente los traduce a su ícono. */
export type IconoPortada =
  | 'Laptop' | 'ShieldCheck' | 'BadgeCheck' | 'GraduationCap' | 'BookOpen' | 'Clock'
  | 'Users' | 'ClipboardList' | 'HeartHandshake' | 'Sparkles' | 'Video'

export type EnlaceMenu = { href: string; etiqueta: string }
export type Indicador = { icono: IconoPortada; dato: string }
export type TarjetaHero = { icono: IconoPortada; titulo: string; detalle: string }

/* ─── Menú ────────────────────────────────────────────────────────────────── */

export function menuPortada(o: {
  soloCursos: boolean; hayCatalogo: boolean; hayServicios: boolean
  hayLicenciaturas: boolean; validez: boolean; hayFaq: boolean
}): EnlaceMenu[] {
  if (!o.soloCursos) {
    return [
      { href: '#niveles', etiqueta: 'Niveles' },
      { href: '#planes', etiqueta: 'Planes' },
      ...(o.hayLicenciaturas ? [{ href: '#licenciaturas', etiqueta: 'Licenciaturas' }] : []),
      ...(o.validez ? [{ href: '#validez', etiqueta: 'Validez oficial' }] : []),
      ...(o.hayFaq ? [{ href: '#preguntas', etiqueta: 'Preguntas' }] : []),
      { href: '#contacto', etiqueta: 'Contacto' },
    ]
  }
  // Solo cursos: no hay niveles ni planes que enlazar; los cursos son lo que se vende.
  return [
    ...(o.hayCatalogo ? [{ href: '#diplomados', etiqueta: 'Cursos' }] : []),
    ...(o.hayServicios ? [{ href: '#servicios', etiqueta: 'Servicios' }] : []),
    ...(o.validez ? [{ href: '#validez', etiqueta: 'Validez oficial' }] : []),
    ...(o.hayFaq ? [{ href: '#preguntas', etiqueta: 'Preguntas' }] : []),
    { href: '#contacto', etiqueta: 'Contacto' },
  ]
}

/* ─── Franja de indicadores ───────────────────────────────────────────────── */

const ICONOS_FRANJA: readonly IconoPortada[] = ['Laptop', 'GraduationCap', 'BadgeCheck', 'Clock']

export function indicadoresPortada(o: {
  soloCursos: boolean
  validez: boolean
  /** Tradicional: ¿los planes de cada nivel suman lo mismo? */
  mismoTotal: boolean
  hayLicenciaturas: boolean
  /** «Secundaria y Preparatoria». */
  nivelesTexto: string
  /** «Secundaria y Preparatoria» o «Secundaria, Preparatoria y Licenciaturas». */
  programasTexto: string
  /** `landing.indicadores` (solo se usa en solo_cursos). */
  propios: readonly string[]
  /** Cursos publicados en el catálogo. */
  cursos: number
}): Indicador[] {
  if (!o.soloCursos) {
    return [
      { icono: 'Laptop', dato: '100% en línea' },
      ...(o.validez ? [{ icono: 'ShieldCheck' as const, dato: 'Validez oficial' }] : []),
      ...(o.mismoTotal
        ? [{ icono: 'BadgeCheck' as const, dato: o.hayLicenciaturas ? `Mismo precio total en ${o.nivelesTexto}` : 'Mismo precio total en ambos planes' }]
        : []),
      { icono: 'GraduationCap', dato: o.programasTexto },
    ]
  }
  const datos = o.propios.length > 0
    ? o.propios
    : ['100 % en línea', ...(o.cursos > 0 ? [o.cursos === 1 ? '1 curso' : `${o.cursos} cursos`] : []), 'A tu ritmo, las 24 horas']
  return datos.map((dato, i) => ({ icono: ICONOS_FRANJA[i % ICONOS_FRANJA.length], dato }))
}

/* ─── Tarjetas del hero ───────────────────────────────────────────────────── */

const ICONOS_HERO: readonly IconoPortada[] = ['GraduationCap', 'BookOpen', 'Video']

export function tarjetasHeroPortada(o: {
  soloCursos: boolean
  /** Tradicional: una por nivel, con su duración y precio ya calculados. */
  niveles: ReadonlyArray<{ titulo: string; detalle: string }>
  /** Tradicional: la tarjeta de licenciaturas, si las hay. */
  licenciatura: { titulo: string; detalle: string } | null
  /** `landing.tarjetasHero` (solo se usa en solo_cursos). */
  propias: ReadonlyArray<{ titulo: string; detalle: string }>
  /** Solo cursos: el catálogo, con su línea de precio. */
  catalogo: ReadonlyArray<{ titulo: string; detalle: string }>
}): TarjetaHero[] {
  if (!o.soloCursos) {
    return [
      ...o.niveles.map(n => ({ icono: 'BookOpen' as const, titulo: n.titulo, detalle: n.detalle })),
      o.licenciatura
        ? { icono: 'GraduationCap', titulo: o.licenciatura.titulo, detalle: o.licenciatura.detalle }
        : { icono: 'Laptop', titulo: '100% en línea', detalle: 'A tu ritmo, las 24 horas' },
    ]
  }
  if (o.propias.length > 0) {
    return o.propias.map((t, i) => ({ icono: ICONOS_HERO[i % ICONOS_HERO.length], titulo: t.titulo, detalle: t.detalle }))
  }
  if (o.catalogo.length > 0) {
    return o.catalogo.slice(0, 3).map(c => ({ icono: 'BookOpen' as const, titulo: c.titulo, detalle: c.detalle }))
  }
  return [{ icono: 'Laptop', titulo: '100% en línea', detalle: 'A tu ritmo, las 24 horas' }]
}

/* ─── WhatsApp general ────────────────────────────────────────────────────── */

export function mensajeWhatsAppGeneral(o: {
  soloCursos: boolean
  nombre: string
  /** Tradicional: «la Secundaria y la Preparatoria» (ya con artículo y unidos). */
  niveles: string
}): string {
  return o.soloCursos
    ? `Hola, quiero información sobre los cursos de ${o.nombre}.`
    : `Hola, quiero información sobre ${o.niveles} en línea de ${o.nombre}.`
}

/** Mensaje del botón «Pedir informes» de un servicio. */
export function mensajeWhatsAppServicio(servicio: string, nombre: string): string {
  return `Hola, quiero informes sobre ${servicio} de ${nombre}.`
}

/* ─── Secciones ───────────────────────────────────────────────────────────── */

/** Lo que no existe en solo_cursos: el programa académico. */
export function seccionesOmitidas(soloCursos: boolean): IdSeccion[] {
  return soloCursos ? ['niveles', 'planes'] : []
}

/* ─── Llaves opcionales nuevas de `landing` ───────────────────────────────── */

export const ICONOS_SERVICIO: readonly IconoPortada[] = ['Users', 'ClipboardList', 'HeartHandshake', 'Sparkles', 'GraduationCap', 'Video']

/** Un nombre de ícono fuera de la lista cerrada cae en `Sparkles`. Nunca un emoji. */
export function iconoServicio(nombre: unknown): IconoPortada {
  return typeof nombre === 'string' && (ICONOS_SERVICIO as readonly string[]).includes(nombre)
    ? nombre as IconoPortada
    : 'Sparkles'
}

export type ServicioPortada = { icono: IconoPortada; titulo: string; desc: string; puntos: string[] }
export type GrupoCatalogo = { titulo: string; subtitulo: string; ids: string[] }

export type ExtrasLanding = {
  servicios_kicker: string
  servicios_titulo: string
  servicios_subtitulo: string
  servicios_items: ServicioPortada[]
  catalogoGrupos: GrupoCatalogo[]
  catalogoGrupoResto: string
  tarjetasHero: Array<{ titulo: string; detalle: string }>
  indicadores: string[]
  whatsapp2: string
  whatsapp2Display: string
  horario: string
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : {}

/**
 * Las llaves opcionales de `landing` que no todas las escuelas traen, ya
 * normalizadas: una ausente, `null` o de otro tipo es su default vacío y nunca
 * `undefined` (un `config.ts` clonado antes de que existieran no las tiene).
 */
export function extrasLanding(landing: unknown): ExtrasLanding {
  const l = obj(landing)
  return {
    servicios_kicker: str(l.servicios_kicker),
    servicios_titulo: str(l.servicios_titulo),
    servicios_subtitulo: str(l.servicios_subtitulo),
    servicios_items: lista(l.servicios_items).map(obj)
      .map(s => ({ icono: iconoServicio(s.icono), titulo: str(s.titulo), desc: str(s.desc), puntos: lista(s.puntos).map(str).filter(Boolean) }))
      .filter(s => s.titulo !== ''),
    catalogoGrupos: lista(l.catalogoGrupos).map(obj)
      .map(g => ({ titulo: str(g.titulo), subtitulo: str(g.subtitulo), ids: lista(g.ids).map(str).filter(Boolean) }))
      .filter(g => g.titulo !== '' && g.ids.length > 0),
    catalogoGrupoResto: str(l.catalogoGrupoResto),
    tarjetasHero: lista(l.tarjetasHero).map(obj)
      .map(t => ({ titulo: str(t.titulo), detalle: str(t.detalle) }))
      .filter(t => t.titulo !== ''),
    indicadores: lista(l.indicadores).map(str).filter(Boolean),
    whatsapp2: str(l.whatsapp2),
    whatsapp2Display: str(l.whatsapp2Display),
    horario: str(l.horario),
  }
}

/**
 * El catálogo repartido en `catalogoGrupos`, en el orden de cada grupo. Lo que
 * no esté en ningún grupo va al final bajo `resto`. Un grupo sin cursos
 * publicados no aparece. Sin grupos: un solo grupo sin título (la lista plana).
 */
export function agruparCatalogo<T extends { id: string }>(
  catalogo: readonly T[], grupos: readonly GrupoCatalogo[], resto: string,
): Array<{ titulo: string; subtitulo: string; cursos: T[] }> {
  if (grupos.length === 0) return catalogo.length > 0 ? [{ titulo: '', subtitulo: '', cursos: [...catalogo] }] : []
  const porId = new Map(catalogo.map(c => [c.id, c]))
  const usados = new Set<string>()
  const salida: Array<{ titulo: string; subtitulo: string; cursos: T[] }> = []
  for (const g of grupos) {
    const cursos = g.ids.map(id => porId.get(id)).filter((c): c is T => c !== undefined && !usados.has(c.id))
    cursos.forEach(c => usados.add(c.id))
    if (cursos.length > 0) salida.push({ titulo: g.titulo, subtitulo: g.subtitulo, cursos })
  }
  const sobrantes = catalogo.filter(c => !usados.has(c.id))
  if (sobrantes.length > 0) salida.push({ titulo: resto, subtitulo: '', cursos: sobrantes })
  return salida
}
