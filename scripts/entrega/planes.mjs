/**
 * planes.mjs — la oferta de una escuela, contada para el Documento de Entrega
 * Oficial y el mensaje de WhatsApp: la que cobra POR SEMANA y, desde la Fase 2
 * (F2-8), también la MENSUAL (ver «Cobro MENSUAL», abajo).
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
 * Los PRECIOS de cada nivel no se replican: llegan por parámetro desde
 * `generar-entrega.mjs`, que los resuelve con `src/lib/precios-nivel.ts`, el
 * mismo módulo que usa la plataforma (lo prueba entrega-precios-nivel.spec).
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

/* ── Cobro MENSUAL (Fase 2, F2-8) ──────────────────────────────────────────────
 * La rama mensual vivía en `generar-entrega.mjs`, sin pruebas y con resolvers
 * propios, y cruzaba `niveles × modalidades`: en una oferta asimétrica
 * (Secundaria solo 3 meses, Preparatoria solo 6) inventaba «Secundaria · plan 6
 * meses» y «Preparatoria · plan 3 meses», que nadie vende.
 *
 * Aquí, como la semanal: cada nivel con SUS planes (`planesDeNivel`), y cada
 * cifra del resolver único de la plataforma (`src/lib/precios-nivel.ts`:
 * inscripcionDe, mensualidadDe, certificacionDe), que llega por parámetro
 * (`{ insc, mens, cert }`) para que este archivo siga sin importar `src/`.
 *
 * 🛑 OFERTA SIMÉTRICA —toda escuela cuyos planes no llevan `nivel`, o sea la
 *    flota—: la tabla, el resumen, las frases y el WhatsApp salen IGUAL que
 *    antes, fila por fila y en el mismo orden. Solo cambia de dónde sale cada
 *    cifra.
 */

/**
 * ¿Algo en los precios que el resolver no sabe leer? Devuelve el motivo, o null.
 * La inscripción general y la mensualidad de cada plan MENSUAL tienen que ser
 * números: la forma de objeto `{ secundaria, preparatoria }` y la grafía
 * `inscripcion_<nivel>` ya no se leen (la plataforma nunca las leyó; el
 * documento sí, y podía contradecirla). Sin este aviso, un nivel saldría
 * «Gratis». `modalidades` va vacía en una escuela semanal (no cobra mensualidad).
 */
export function problemaDePrecios(precios, modalidades = []) {
  const i = precios?.inscripcion
  if (!(typeof i === 'number' && Number.isFinite(i))) {
    return 'CONFIG.precios.inscripcion tiene que ser un número: la inscripción general. ' +
      'Si cada nivel cobra una inscripción distinta, deja ahí la general y pon la de cada nivel en ' +
      'precios.inscripcionSecundaria y precios.inscripcionPreparatoria (la forma { secundaria, preparatoria } ya no se lee).'
  }
  const conObjeto = (modalidades || []).filter(m => m && typeof m === 'object' && m.activa
    && m.mensualidad != null && typeof m.mensualidad === 'object')
  if (conObjeto.length) {
    return `CONFIG.modalidades[].mensualidad tiene que ser un número (${conObjeto.map(m => m.id).join(', ')}): ` +
      'la forma { secundaria, preparatoria } ya no se lee y ese nivel saldría «Gratis». Deja ahí la del plan y pon la de ' +
      'cada nivel en precios.mensualidadSecundaria<n>Meses y precios.mensualidadPreparatoria<n>Meses (planes de 3 o 6 meses) ' +
      'o, para Secundaria, en precios.secundaria_<n>meses_normal.'
  }
  return null
}

/**
 * Los niveles del programa que no venden NINGÚN plan activo. El documento no
 * los puede contar: saldría una tabla vacía y «Preparatoria en  meses» (un
 * `nivel: 'media'` que no es nivel del programa deja al nivel sin planes).
 */
export const nivelesSinPlanes = (config, niveles) => niveles.filter(n => !planesDeNivel(config, n).length)

/** Los planes activos de la escuela, en su orden (los que aplican a algún nivel o a todos). */
const planesActivos = (config) => (config?.modalidades || []).filter(m => m && typeof m === 'object' && m.activa)

/** ¿Cada nivel vende TODOS los planes activos? Es la oferta de toda escuela cuyos planes no llevan `nivel`. */
export function ofertaSimetrica(config, niveles) {
  const todos = planesActivos(config).length
  return niveles.every(n => planesDeNivel(config, n).length === todos)
}

/** Cada plan mensual que VENDE cada nivel, con sus cifras resueltas. */
export function planesMensuales(config, niveles, { insc, mens, cert }) {
  return niveles.flatMap(nivel => planesDeNivel(config, nivel).map(plan => {
    const inscripcion = insc(nivel) || 0
    const mensualidad = mens(nivel, plan) || 0
    const certificacion = cert(nivel) || 0
    const colegiatura = mensualidad * (plan.meses || 0)
    return {
      nivel, plan, inscripcion, mensualidad, certificacion, colegiatura,
      totalPlan: inscripcion + colegiatura,
      total: inscripcion + colegiatura + certificacion,
    }
  }))
}

const etiquetaPlan = (m) => m.label || m.id

/**
 * Tabla de precios mensual.
 *   · Simétrica: la de siempre, una columna por nivel y las filas de antes.
 *   · Un plan por nivel: una columna por nivel, como la semanal.
 *   · Varios planes y no los mismos: una fila por plan REAL.
 */
export function tablaPreciosMensual(config, niveles, { insc, mens, cert }) {
  const hayCert = niveles.some(n => cert(n))
  if (ofertaSimetrica(config, niveles)) {
    const mods = planesActivos(config)
    const fila = (concepto, valor) => [concepto, ...niveles.map(valor)]
    const filas = [fila('Inscripción (pago único)', n => mxn(insc(n)))]
    for (const m of mods)
      filas.push(fila(`Plan ${etiquetaPlan(m)} · ${m.meses} ${m.meses === 1 ? 'mes' : 'meses'}`, n => `${mxn(mens(n, m))}/mes`))
    // El total del PLAN, sin certificación: es la cifra con la que el alumno decide.
    for (const m of mods)
      filas.push(fila(`Total del plan ${etiquetaPlan(m)}`, n => mxn(insc(n) + mens(n, m) * (m.meses || 0))))
    if (hayCert) filas.push(fila('Certificación', n => mxn(cert(n))))
    for (const m of mods) {
      // El total INCLUYE la certificación (lo dice la nota), y la etiqueta lo dice.
      const sufijo = hayCert ? ' (con certificación)' : ''
      const etiqueta = mods.length > 1
        ? `Costo total — plan ${etiquetaPlan(m)}${sufijo}`
        : `Costo total del programa completo${sufijo}`
      filas.push({ total: true, celdas: fila(etiqueta, n => mxn(insc(n) + mens(n, m) * (m.meses || 0) + cert(n))) })
    }
    return { cols: ['Concepto', ...niveles.map(cap)], filas }
  }
  const planes = planesMensuales(config, niveles, { insc, mens, cert })
  if (unPlanPorNivel(planes, niveles)) {
    const de = (n) => planes.find(p => p.nivel === n)
    const fila = (concepto, valor) => [concepto, ...niveles.map(n => valor(de(n)))]
    const filas = [
      fila('Plan', p => `${etiquetaPlan(p.plan)} · ${meses(p.plan.meses)}`),
      fila('Inscripción (pago único)', p => mxn(p.inscripcion)),
      fila('Mensualidad', p => `${mxn(p.mensualidad)}/mes`),
      fila('Total del plan (inscripción + mensualidades)', p => mxn(p.totalPlan)),
    ]
    if (hayCert) filas.push(fila('Certificación', p => mxn(p.certificacion)))
    filas.push({
      total: true,
      celdas: fila(hayCert ? 'Costo total del programa (con certificación)' : 'Costo total del programa', p => mxn(p.total)),
    })
    return { cols: ['Concepto', ...niveles.map(cap)], filas }
  }
  return {
    cols: ['Plan', 'Inscripción', 'Mensualidad', 'Total del plan', ...(hayCert ? ['Con certificación'] : [])],
    filas: planes.map(p => [
      `${cap(p.nivel)} · plan ${etiquetaPlan(p.plan)} · ${meses(p.plan.meses)}`,
      mxn(p.inscripcion),
      `${mxn(p.mensualidad)}/mes`,
      mxn(p.totalPlan),
      ...(hayCert ? [mxn(p.total)] : []),
    ]),
  }
}

/**
 * Resumen de modalidades: una fila por plan que el nivel vende de verdad.
 * (La simétrica conserva «N meses» tal cual la de antes; la asimétrica, que es
 * nueva, dice «1 mes» como la tabla.)
 */
export function filasModalidadesMensual(config, niveles, { mens, ritmo }) {
  const simetrica = ofertaSimetrica(config, niveles)
  return niveles.flatMap(n => planesDeNivel(config, n).map(m =>
    [`${cap(n)} — plan ${etiquetaPlan(m)}`, simetrica ? `${m.meses} meses` : meses(m.meses), `${mxn(mens(n, m))}/mes`, ritmo(m.materiasPorMes)]))
}

/** «Secundaria en 3 meses y Preparatoria en 6 meses»: lo que vende cada nivel. */
function duracionesPorNivel(config, niveles) {
  return enLista(niveles.map(n => {
    const ms = [...new Set(planesDeNivel(config, n).map(m => m.meses))]
    return `${cap(n)} en ${ms.join(' o ')} ${ms.length === 1 && ms[0] === 1 ? 'mes' : 'meses'}`
  }))
}

/**
 * Las frases mensuales del documento y del WhatsApp. En la oferta simétrica,
 * las de siempre; en la asimétrica, contadas por nivel.
 *
 * `notaPrecios` ya no promete que «el panel te sugiere el monto correcto»: esa
 * sugerencia no existe, el monto de cada pago se captura a mano. Lo que sí es
 * verdad desde F2-6 es que la ficha, al marcar la inscripción, muestra la cifra
 * del nivel del alumno. Tampoco dice «y en el registro»: el registro no pinta
 * precios de Secundaria ni de Preparatoria.
 */
export function frasesMensuales(config, niveles, { insc }) {
  const mods = planesActivos(config)
  const inscDistinta = new Set(niveles.map(insc)).size > 1
  const notaPrecios = 'El total suma inscripción + mensualidades del plan + certificación. Los montos se muestran solos en tu página pública. ' +
    'Al marcar la inscripción como pagada, el panel muestra la cifra del nivel del alumno. El monto de cada pago lo capturas tú.'
  if (ofertaSimetrica(config, niveles)) {
    const dur = mods.map(m => `${m.meses}`).join(' o ')
    const uno = mods.length === 1
    return {
      frasePrecios: uno
        ? `Tu escuela opera con un plan único de ${mods[0].meses} meses${inscDistinta ? ' y una inscripción diferenciada por nivel' : ''}. Así quedó cargado en la plataforma:`
        : `Tu escuela ofrece ${mods.length} planes de ${dur} meses${inscDistinta ? ', con inscripción diferenciada por nivel' : ''}. Así quedaron cargados:`,
      notaPrecios,
      notaModalidades: uno
        ? 'Tu plataforma ofrece un solo plan, así que el alumno no elige duración al registrarse: se le asigna automáticamente.'
        : 'El alumno elige su plan al registrarse, y el ritmo de apertura de materias se ajusta solo.',
      incluye: uno ? `Plan único de ${mods[0].meses} meses` : `${mods.length} planes de estudio (${dur} meses)`,
      planesDisponibles: uno
        ? `Plan único de ${mods[0].meses} meses.`
        : `Planes disponibles: ${mods.map(etiquetaPlan).join(' y ')}.`,
    }
  }
  const unoPorNivel = niveles.every(n => planesDeNivel(config, n).length === 1)
  const porNivel = duracionesPorNivel(config, niveles)
  return {
    frasePrecios: unoPorNivel
      ? `Cada nivel tiene su propia duración: ${porNivel}${inscDistinta ? ', con inscripción diferenciada por nivel' : ''}. Así quedó cargado en la plataforma:`
      : `Cada nivel tiene sus propios planes: ${porNivel}${inscDistinta ? ', con inscripción diferenciada por nivel' : ''}. Así quedaron cargados:`,
    notaPrecios,
    notaModalidades: unoPorNivel
      ? 'La duración la trae el nivel, así que el alumno no elige plan al registrarse: la plataforma se lo asigna.'
      : 'El alumno elige su plan al registrarse, entre los de su nivel, y el ritmo de apertura de materias se ajusta solo.',
    incluye: `Planes por nivel: ${porNivel}`,
    planesDisponibles: `Planes por nivel: ${porNivel}.`,
  }
}

/** El bloque de precios mensual del mensaje de WhatsApp. */
export function lineasPreciosMensualWhatsApp(config, niveles, { insc, mens, cert }) {
  const simetrica = ofertaSimetrica(config, niveles)
  const L = []
  for (const n of niveles) {
    const mods = simetrica ? planesActivos(config) : planesDeNivel(config, n)
    // Con varios planes en la escuela se nombra cada uno; en la asimétrica,
    // también cuando el nivel vende uno solo (si no, no se sabe cuál es).
    const nombrar = simetrica ? mods.length > 1 : true
    const partes = [`inscripción ${mxn(insc(n))}`]
    for (const m of mods)
      partes.push(nombrar ? `${etiquetaPlan(m)}: ${mxn(mens(n, m))}/mes` : `${mxn(mens(n, m))}/mes`)
    if (cert(n)) partes.push(`certificación ${mxn(cert(n))}`)
    L.push(`${cap(n)}: ${partes.join(' · ')}`)
  }
  L.push(frasesMensuales(config, niveles, { insc }).planesDisponibles, '')
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
