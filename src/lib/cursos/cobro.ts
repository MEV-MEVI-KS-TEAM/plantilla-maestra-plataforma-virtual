import { precioCursoNumerico, type PreciosCurso } from './precio-regla'

/**
 * El cobro de un curso (Bloque D · D16, #207-5): cuánto se ha pagado, qué falta
 * y qué precarga el modal «Cobrar». PURO: lo usan la API (GET de cursos del
 * alumno) y la pantalla, con las mismas reglas que la función curso_cobrar.
 *
 * Dos precios distintos, a propósito (decisión 10):
 *  - `referencia`: con qué precio se le VENDIÓ —la foto del evento
 *    'inscripcion' (C3b) o, si no hay (registro público o anterior a C3b), la
 *    ficha de hoy, diciendo cuál—. De aquí salen el saldo y los montos.
 *  - `ficha`: la ficha HOY. De aquí sale la regla de abrir (pago único → todo;
 *    mensual o sin precio → mes a mes), igual que en la base: curso_cobrar la
 *    revalida con la ficha de hoy.
 *
 * ¿Pagar abre? Solo si quien cobra lo pide y solo en tres casos (decisión 1):
 * la primera activación de una inscripción «por activar», la mensualidad del
 * mes siguiente al último abierto, y el pago único de una ficha de pago único.
 * La casilla sale marcada solo si lo pagado ACUMULADO cubre; admin y
 * secretario pueden abrir (decisión 6).
 */
export type ConceptoCobro = 'curso_pago_unico' | 'curso_inscripcion' | 'curso_mensualidad' | 'curso_otro'

export type PagoDeCurso = { monto: number | string | null; concepto: string | null; mes_desbloqueado: number | null }

export type EstadoCobro = {
  estado: string | null
  meses: number
  acceso_total: boolean
  por_activar: boolean
  /** La ficha HOY: la regla de abrir. */
  ficha: PreciosCurso
  /** El precio con que se le vendió, y de dónde salió. */
  referencia: { precios: PreciosCurso; origen: 'inscripcion' | 'ficha' }
  pagos: readonly PagoDeCurso[]
  /** Hasta qué mes se puede abrir (curso_tope_meses); null = no se sabe (no se limita aquí). */
  tope?: number | null
  /** ¿El mes 1 tiene qué mostrar (módulos y módulos por mes)? Sin él, activar mes 1 lo rechaza la base. */
  hayMes1?: boolean
}

export type ResumenCobro = {
  /** La forma del precio de REFERENCIA. */
  tipo: 'unico' | 'mensual' | 'informes'
  /** Qué abre la ficha HOY (la regla de curso_regla_apertura). */
  regla: 'total' | 'mes1'
  pagado: number
  /** Pago único: lo que falta (0 si ya pagó todo). Mensual o sin precio: null. */
  saldo: number | null
  /** Los meses que cubren sus mensualidades pagadas, sin repetir, de menor a mayor. */
  mesesCubiertos: number[]
  /** Pagó algo que abre y no se le abrió: la insignia «Pagado · falta abrir». */
  pagadoFaltaAbrir: boolean
}

export type PrecargaCobro = {
  concepto: ConceptoCobro
  /** null = monto libre (ficha sin precio, o ya pagado completo). */
  monto: number | null
  /** El mes que CUBRE (solo la mensualidad). */
  mes: number | null
  /** ¿Aparece la casilla «abrir»? */
  puedeAbrir: boolean
  /** ¿Sale marcada? (lo pagado acumulado cubre). */
  abrirPorDefecto: boolean
  /** La regla que la pantalla le manda al servidor (p_regla_esperada). */
  regla: 'total' | 'mes1'
  aviso: string | null
}

const num = (v: unknown): number => {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** A centavos: 100.10 + 200.20 no es 300.3 en coma flotante, y un pago único de 300.30 no se daba por cubierto. */
const centavos = (n: number) => Math.round(n * 100) / 100

const suma = (pagos: readonly PagoDeCurso[], filtro: (p: PagoDeCurso) => boolean = () => true) =>
  centavos(pagos.filter(filtro).reduce((s, p) => s + num(p.monto), 0))

export const AVISO_SIN_PRECIO = 'La ficha de este curso no tiene precio: escribe el monto que cobraste.'
export const AVISO_YA_PAGADO = 'Ya pagó el precio completo del curso. Si es un pago extra, escribe el monto.'

export function reglaDeFicha(ficha: PreciosCurso): 'total' | 'mes1' {
  return precioCursoNumerico(ficha).tipo === 'unico' ? 'total' : 'mes1'
}

export function resumenCobro(e: EstadoCobro): ResumenCobro {
  const ref = precioCursoNumerico(e.referencia.precios)
  const regla = reglaDeFicha(e.ficha)
  const pagado = suma(e.pagos)
  const mesesCubiertos = [...new Set(
    e.pagos.filter(p => p.concepto === 'curso_mensualidad' && Number.isInteger(p.mes_desbloqueado) && (p.mes_desbloqueado ?? 0) >= 1)
      .map(p => p.mes_desbloqueado as number),
  )].sort((a, b) => a - b)
  const activa = e.estado === 'activa'
  let saldo: number | null = null
  let pagadoFaltaAbrir = false
  if (ref.tipo === 'unico') {
    saldo = Math.max(0, centavos(ref.monto - pagado))
    pagadoFaltaAbrir = activa && !e.acceso_total && pagado >= centavos(ref.monto)
  } else if (ref.tipo === 'mensual') {
    // Un mes pagado que el curso ya no tiene (tope conocido) no se puede abrir:
    // no deja la insignia encendida para siempre.
    const abrible = (m: number) => m > e.meses && (e.tope == null || e.tope <= 0 || m <= e.tope)
    pagadoFaltaAbrir = activa && !e.acceso_total && (mesesCubiertos.some(abrible) || (e.por_activar && pagado > 0))
  } else {
    pagadoFaltaAbrir = activa && e.por_activar && pagado > 0
  }
  return { tipo: ref.tipo, regla, pagado, saldo, mesesCubiertos, pagadoFaltaAbrir }
}

export function precargaCobro(e: EstadoCobro): PrecargaCobro {
  const ref = precioCursoNumerico(e.referencia.precios)
  const r = resumenCobro(e)
  const activa = e.estado === 'activa'
  const base = { regla: r.regla, aviso: null as string | null }

  if (ref.tipo === 'unico') {
    const falta = r.saldo ?? 0
    const monto = falta > 0 ? falta : null
    const puedeAbrir = activa && !e.acceso_total && r.regla === 'total'
    return {
      ...base,
      concepto: 'curso_pago_unico',
      monto,
      mes: null,
      puedeAbrir,
      abrirPorDefecto: puedeAbrir && monto !== null && centavos(r.pagado + monto) >= centavos(ref.monto),
      aviso: monto === null ? AVISO_YA_PAGADO : null,
    }
  }

  if (ref.tipo === 'mensual') {
    const inscripcionPagada = e.pagos.some(p => p.concepto === 'curso_inscripcion')
    // Lo mismo que rechaza la base: activar el mes 1 sin contenido, o abrir más allá del tope.
    const sePuedeActivar = r.regla === 'total' || e.hayMes1 !== false
    if (ref.inscripcion !== null && !inscripcionPagada) {
      const puedeAbrir = activa && e.por_activar && sePuedeActivar
      return { ...base, concepto: 'curso_inscripcion', monto: ref.inscripcion, mes: null, puedeAbrir, abrirPorDefecto: puedeAbrir }
    }
    // K = la primera mensualidad SIN pago. Tras asignar (1 mes abierto, nada
    // pagado) K = 1: se cobra el mes 1 y NO se abre el 2.
    let k = 1
    while (r.mesesCubiertos.includes(k)) k++
    const dentroDelTope = e.tope == null || e.tope <= 0 || k <= e.tope
    const puedeAbrir = activa && !e.acceso_total && dentroDelTope
      && ((e.por_activar && k === 1 && r.regla === 'mes1' && sePuedeActivar) || (!e.por_activar && k === e.meses + 1))
    return { ...base, concepto: 'curso_mensualidad', monto: ref.mensualidad, mes: k, puedeAbrir, abrirPorDefecto: puedeAbrir }
  }

  // Sin precio (0/0): monto libre; abre solo la primera activación (mes 1), sin marcar.
  return {
    ...base,
    concepto: 'curso_otro',
    monto: null,
    mes: null,
    puedeAbrir: activa && e.por_activar && e.hayMes1 !== false,
    abrirPorDefecto: false,
    aviso: AVISO_SIN_PRECIO,
  }
}

/**
 * ¿El monto que se está capturando cubre? Re-evalúa la casilla cuando quien
 * cobra cambia el monto (un abono no abre por omisión).
 */
export function cubreElCobro(e: EstadoCobro, concepto: ConceptoCobro, monto: number): boolean {
  const ref = precioCursoNumerico(e.referencia.precios)
  if (!Number.isFinite(monto) || monto <= 0) return false
  if (concepto === 'curso_pago_unico') return ref.tipo === 'unico' && centavos(resumenCobro(e).pagado + monto) >= centavos(ref.monto)
  if (concepto === 'curso_mensualidad') return ref.tipo === 'mensual' && monto >= ref.mensualidad
  if (concepto === 'curso_inscripcion') return ref.tipo === 'mensual' && ref.inscripcion !== null && monto >= ref.inscripcion
  return false
}
