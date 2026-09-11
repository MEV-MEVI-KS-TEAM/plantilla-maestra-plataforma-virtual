/**
 * planes.mjs — la oferta de una escuela que cobra POR SEMANA, contada para el
 * Documento de Entrega Oficial y el mensaje de WhatsApp.
 *
 * Existe porque `generar-entrega.mjs` nació mensual y simétrico: cruzaba
 * `niveles × modalidades` y le ponía «/mes» a todo. En una escuela semanal eso
 * miente tres veces en el papel que el cliente archiva y reenvía:
 *   · «$250/mes» donde cobra $250 a la semana: una cuarta parte de lo que vende;
 *   · «Total del plan $1,750» (3 × 250) donde son 12 × 250 = $3,000;
 *   · «Preparatoria · plan 3 meses» cuando ese nivel solo se vende en 6.
 * Le pasó a EDUHCO (#197), que lo parchó solo en su clon, y a CAU (#200).
 *
 * JS puro y sin importar `src/`: aquellos módulos usan el alias `@/`, que Node
 * no resuelve fuera de Next. Replica la regla de `planesPorNivel()` de
 * `src/lib/modalidades.ts` (una modalidad sin `nivel` aplica a todos los
 * niveles) y `tests/unit/entrega-semanal.spec.ts` la compara con la original.
 */
import { mxn, cap } from './documento.mjs'

export const esSemanal = (config) => config?.periodicidad === 'semanal'

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
const meses = (n) => plural(n, 'mes', 'meses')
const pagos = (n) => plural(n, 'pago semanal', 'pagos semanales')
const enLista = (xs) => xs.length > 1
  ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`
  : (xs[0] ?? '')

/** Los planes activos que vende un nivel. La misma regla que `planesPorNivel()`. */
export function planesDeNivel(config, nivel) {
  return (config?.modalidades || [])
    .filter(m => m && typeof m === 'object' && m.activa)
    .filter(m => !m.nivel || m.nivel === nivel)
}

/**
 * Cada plan que la escuela VENDE, con sus cifras resueltas.
 *
 * Un plan sin semanas o sin cuota no es un plan semanal: se deja fuera en vez de
 * anunciarlo como «Gratis». `insc` y `cert` llegan de `generar-entrega.mjs`,
 * que ya sabe leer los precios por nivel.
 */
export function planesSemanales(config, niveles, { insc, cert }) {
  const contraEntrega = config?.ofertaPublica?.certificacionContraEntrega || []
  return niveles.flatMap(nivel => planesDeNivel(config, nivel)
    .filter(plan => plan.semanas > 0 && plan.cuotaSemanal > 0)
    .map(plan => {
      const inscripcion = insc(nivel) || 0
      const certificacion = cert(nivel) || 0
      const colegiatura = plan.semanas * plan.cuotaSemanal
      return {
        nivel, plan, inscripcion, certificacion, colegiatura,
        totalPlan: inscripcion + colegiatura,
        total: inscripcion + colegiatura + certificacion,
        contraEntrega: contraEntrega.includes(nivel),
      }
    }))
}

/** ¿Cada nivel vende UN solo plan? Entonces la duración la trae el nivel. */
export const unPlanPorNivel = (planes, niveles) =>
  niveles.every(n => planes.filter(p => p.nivel === n).length === 1)

const certificacionTxt = (p) =>
  `${mxn(p.certificacion)}${p.certificacion && p.contraEntrega ? ' (contra entrega)' : ''}`

/**
 * Tabla de precios. Con un plan por nivel, una columna por nivel, como la
 * mensual; con varios, una fila por plan, para no inventar combinaciones.
 */
export function tablaPrecios(planes, niveles) {
  const hayCert = planes.some(p => p.certificacion)
  if (unPlanPorNivel(planes, niveles)) {
    const de = (n) => planes.find(p => p.nivel === n)
    const fila = (concepto, valor) => [concepto, ...niveles.map(n => valor(de(n)))]
    const filas = [
      fila('Plan', p => meses(p.plan.meses)),
      fila('Inscripción (pago único)', p => mxn(p.inscripcion)),
      fila('Cuota semanal', p => mxn(p.plan.cuotaSemanal)),
      fila('Número de pagos', p => pagos(p.plan.semanas)),
      fila('Total del plan (inscripción + cuotas)', p => mxn(p.totalPlan)),
    ]
    if (hayCert) filas.push(fila('Certificación', certificacionTxt))
    filas.push({
      total: true,
      celdas: fila(hayCert ? 'Costo total del programa (con certificación)' : 'Costo total del programa',
        p => mxn(p.total)),
    })
    return { cols: ['Concepto', ...niveles.map(cap)], filas }
  }
  return {
    cols: ['Plan', 'Inscripción', 'Cuotas', 'Total del plan', ...(hayCert ? ['Con certificación'] : [])],
    filas: planes.map(p => [
      `${cap(p.nivel)} · ${meses(p.plan.meses)}`,
      mxn(p.inscripcion),
      `${pagos(p.plan.semanas)} de ${mxn(p.plan.cuotaSemanal)}`,
      mxn(p.totalPlan),
      ...(hayCert ? [mxn(p.total)] : []),
    ]),
  }
}

/** Resumen de modalidades de la página de cursos: una fila por plan real. */
export const colsModalidades = ['Modalidad', 'Duración', 'Cuota semanal', 'Ritmo de apertura']
export function filasModalidades(planes) {
  return planes.map(p => [
    `${cap(p.nivel)} — plan ${p.plan.label || p.plan.id}`,
    `${meses(p.plan.meses)} · ${p.plan.semanas} semanas`,
    `${mxn(p.plan.cuotaSemanal)} a la semana`,
    `${p.plan.materiasPorMes} materia${p.plan.materiasPorMes === 1 ? '' : 's'} por mes`,
  ])
}

/** Las frases del documento que en una escuela mensual hablan de mensualidades. */
export function frasesSemanales(planes, niveles) {
  const uno = unPlanPorNivel(planes, niveles)
  const hayCert = planes.some(p => p.certificacion)
  const lista = enLista(planes.map(p => `${cap(p.nivel)} en ${meses(p.plan.meses)}`))
  return {
    frasePrecios: uno
      ? `Tu escuela cobra por semana y cada nivel tiene su propia duración: ${lista}. Así quedó cargado en la plataforma:`
      : `Tu escuela cobra por semana, con ${planes.length} planes: ${lista}. Así quedaron cargados:`,
    notaPrecios: `El cobro es semanal: el total suma la inscripción${
      hayCert ? ', todas las cuotas del plan y la certificación' : ' y todas las cuotas del plan'
    }. Al inscribirse, la plataforma le genera al alumno su calendario completo de pagos con la fecha de cada semana; él lo consulta en «Mis Pagos» y tú marcas cada semana pagada desde Cobranza.`,
    notaModalidades: uno
      ? 'La duración la trae el nivel, así que el alumno no elige plan al registrarse: la plataforma se lo asigna y le genera su calendario de pagos semanales.'
      : 'El alumno elige su plan al registrarse y la plataforma le genera su calendario de pagos semanales.',
    incluye: `${lista}, con cobro semanal`,
  }
}

/** El bloque de precios del mensaje de WhatsApp. */
export function lineasPreciosWhatsApp(planes, niveles) {
  const L = []
  for (const p of planes) {
    L.push(`${cap(p.nivel)} — ${meses(p.plan.meses)}`)
    L.push(`   Inscripción: ${mxn(p.inscripcion)}`)
    L.push(`   ${pagos(p.plan.semanas)} de ${mxn(p.plan.cuotaSemanal)}`)
    if (p.certificacion) L.push(`   Certificación: ${certificacionTxt(p)}`)
    L.push(`   Total del programa: ${mxn(p.total)}`)
  }
  L.push('', unPlanPorNivel(planes, niveles)
    ? 'Cada nivel tiene su propia duración, así que el alumno no elige plan: al registrarse, la plataforma le arma su calendario completo de pagos semanales y tú marcas cada semana pagada desde Cobranza.'
    : 'El alumno elige su plan al registrarse, la plataforma le arma su calendario de pagos semanales y tú marcas cada semana pagada desde Cobranza.',
  '')
  return L
}

/**
 * Lo que la página pública ANUNCIA sin venderlo en línea: planes atendidos por
 * WhatsApp y un catálogo solo informativo (CAU #200).
 *
 * `CONFIG.ofertaPublica` no existe en la plantilla: lo declaran los clones que
 * lo construyeron. Si el cliente pagó por eso y el documento no lo nombra, tiene
 * razón en quejarse (Bug 157). Sin nada que contar devuelve null.
 */
export function ofertaInformativa(config) {
  const o = config?.ofertaPublica
  if (!o) return null
  const personalizados = (o.planesPersonalizados || [])
    .filter(p => p?.nivel && p?.meses)
    .map(p => p.semanas && p.cuotaSemanal
      ? `${cap(p.nivel)} ${meses(p.meses)} (${pagos(p.semanas)} de ${mxn(p.cuotaSemanal)})`
      : `${cap(p.nivel)} ${meses(p.meses)}`)
  const areas = (o.licenciaturas || []).filter(a => a?.programas?.length)
  const programas = areas.reduce((n, a) => n + a.programas.length, 0)
  if (!personalizados.length && !programas) return null
  return { personalizados, programas, areas: areas.length }
}
