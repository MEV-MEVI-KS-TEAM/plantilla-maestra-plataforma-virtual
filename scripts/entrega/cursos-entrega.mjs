/**
 * Los cursos en la entrega (Bloque C · C4), sin efectos: se prueba tal cual corre.
 *
 * Tres preguntas, con las MISMAS reglas que la página y el registro:
 *   1. ¿Se pudieron leer los cursos publicados? (leerCursosPublicados)
 *   2. ¿Qué precio se pinta de cada uno? (precioDeCurso, con precioCursoNumerico)
 *   3. ¿El documento contradice lo que vende el registro? (revisarCursos, con
 *      normalizarOfertas y resolverPrecioOferta, los del registro)
 *
 * 🛑 UN DOCUMENTO OFICIAL QUE NIEGA LO VENDIDO ES PEOR QUE NO TENERLO. Si la
 * lectura falla (llave de otro proyecto, proyecto pausado, red caída), o si el
 * registro vende algo que el documento diría distinto, se aborta con el motivo:
 * antes, un error de lectura se trataba como «0 cursos» y el PDF salía con «Crea
 * tus propios cursos» a una escuela que acababa de comprar el add-on.
 */
import { precioCursoNumerico, resolverPrecioOferta, TEXTO_SIN_PRECIO } from '../../src/lib/cursos/precio-regla.ts'
import { normalizarOfertas } from '../../src/lib/cursos/oferta-regla.ts'

/** La columna no existe (base sin la migración B1): el mismo criterio que acceso-total.ts. */
export const esColumnaFaltante = (e) => e?.code === '42703' || e?.code === 'PGRST204'
/** La tabla no existe (base sin el módulo de cursos). */
export const esTablaFaltante = (e) => e?.code === '42P01' || e?.code === 'PGRST205'

/**
 * Los cursos publicados, con nombre y precio. Devuelve:
 *   · `lista`: los cursos; `null` si NO se pudieron leer (y `error` dice por qué);
 *   · `sinPrecio`: la base no tiene las columnas de precio (B1): se leyó solo el nombre;
 *   · `sinTabla`: la base no tiene la tabla `cursos` (sin módulo): lista vacía legítima.
 * El respaldo sin columnas de precio se usa SOLO si falta una columna: cualquier
 * otro error (timeout, 5xx, llave inválida) es un fallo de lectura, no «sin precio».
 */
export async function leerCursosPublicados(sb) {
  const campos = 'id, nombre, tipo, precio_inscripcion, precio_mensualidad, duracion_meses, orden'
  let { data, error } = await sb.from('cursos').select(campos).eq('estado', 'publicado').order('orden')
  let sinPrecio = false
  if (error && esColumnaFaltante(error)) {
    sinPrecio = true
    ;({ data, error } = await sb.from('cursos').select('id, nombre, tipo').eq('estado', 'publicado').order('nombre'))
  }
  if (error && esTablaFaltante(error)) return { lista: [], error: null, sinPrecio: false, sinTabla: true }
  if (error) return { lista: null, error: error.message || error.code || 'error desconocido', sinPrecio, sinTabla: false }
  return {
    lista: (data || []).map(c => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      inscripcion: Number(c.precio_inscripcion ?? 0),
      mensualidad: Number(c.precio_mensualidad ?? 0),
      meses: Number(c.duracion_meses ?? 0),
    })),
    error: null,
    sinPrecio,
    sinTabla: false,
  }
}

const preciosDe = (c) => ({ precio_inscripcion: c.inscripcion, precio_mensualidad: c.mensualidad })

/**
 * Los cursos que pinta el documento: los leídos, o ninguno si no hubo inventario
 * o no se pudieron leer (revisarCursos ya abortó o avisó en ese caso).
 */
export function cursosParaDocumento(lectura) {
  return lectura && Array.isArray(lectura.lista) ? lectura.lista : []
}

/**
 * «$2,490 de pago único», «$1,500 de inscripción + $800 al mes × 3 meses», o
 * «Pide informes» si no hay precio: la MISMA regla que la página
 * (precioCursoNumerico). Un curso sin mensualidad se cobra una sola vez: decirlo
 * evita la duda de si además hay algo mensual, que es la objeción del prospecto.
 */
export function precioDeCurso(c, mxn) {
  const p = precioCursoNumerico(preciosDe(c))
  if (p.tipo === 'unico') return `${mxn(p.monto)} de pago único`
  if (p.tipo === 'mensual') {
    const mes = c.meses > 0 ? `${mxn(p.mensualidad)} al mes × ${c.meses} ${c.meses === 1 ? 'mes' : 'meses'}` : `${mxn(p.mensualidad)} al mes`
    return p.inscripcion !== null ? `${mxn(p.inscripcion)} de inscripción + ${mes}` : mes
  }
  return TEXTO_SIN_PRECIO
}

/** Lo que el registro anuncia de una oferta, en palabras. */
function textoAnuncio(anuncio, mxn) {
  if (anuncio.tipo === 'unico') return `${mxn(anuncio.monto)} de pago único`
  if (anuncio.tipo === 'mensual') {
    return precioDeCurso({ inscripcion: anuncio.inscripcion ?? 0, mensualidad: anuncio.mensualidad, meses: 0 }, mxn)
  }
  return TEXTO_SIN_PRECIO
}

/**
 * ¿El documento puede salir? Devuelve `{ abortar: { msg, ayuda } | null, avisos: [] }`.
 *
 * @param lectura el resultado de leerCursosPublicados, o `null` si no hubo
 *   inventario (sin .env.local o sin la service role)
 * @param ing     CONFIG.cursosIngreso tal cual
 * @param menu    el nombre del menú de cursos del panel ('Gestionar Cursos' o, en
 *   solo_cursos, 'Diplomados')
 */
export function revisarCursos({ lectura, ing, mxn, menu = 'Gestionar Cursos' }) {
  const avisos = []
  const errores = []
  const addon = Boolean(ing && (ing.activa ?? ing.activos))
  const fichaPrecio = `${menu} → el curso → Contenido → Precios y ritmo`
  const salir = (msg, ayuda) => ({ abortar: { msg, ayuda }, avisos })

  if (lectura === null) {
    if (addon) {
      return salir('CONFIG.cursosIngreso está encendido y no hay inventario de cursos (falta .env.local o sus llaves).',
        'El documento diría «Crea tus propios cursos» a una escuela que compró el add-on.\nPon NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local y vuelve a correr.')
    }
    return { abortar: null, avisos }
  }
  if (lectura.lista === null) {
    // Con el add-on, el documento negaría lo vendido: se aborta. Sin él, el
    // módulo se describe sin inventario, como sin .env.local, y se avisa fuerte.
    if (addon) {
      return salir(`No se pudieron leer los cursos publicados: ${lectura.error}.`,
        'El documento diría que no hay cursos, o los pintaría sin precio. Revisa que el proyecto de Supabase no esté pausado y que la\nSUPABASE_SERVICE_ROLE_KEY de .env.local sea de ESE proyecto; luego vuelve a correr.')
    }
    avisos.push(`No se pudieron leer los cursos publicados (${lectura.error}): el documento describe el módulo de cursos vacío. Si la escuela ya tiene cursos publicados, NO lo envíes: revisa que el proyecto no esté pausado y la SUPABASE_SERVICE_ROLE_KEY de .env.local, y vuelve a correr.`)
    return { abortar: null, avisos }
  }
  if (lectura.sinTabla) {
    if (addon) {
      return salir('CONFIG.cursosIngreso está encendido y la base no tiene la tabla cursos.',
        'Falta el módulo de Cursos y Diplomados (scripts/migracion-cursos-diplomados.sql) y sus cursos: el documento negaría lo vendido.')
    }
    return { abortar: null, avisos }
  }
  const lista = lectura.lista
  if (lectura.sinPrecio && lista.length) {
    return salir('La base no tiene las columnas de precio de los cursos (migración B1).',
      'El documento pintaría cada curso sin precio. Aplica supabase/migrations/20260730120000_b1_fundacion_solo_cursos.sql\n(pooler en modo sesión, 5432) y vuelve a correr.')
  }

  for (const c of lista) {
    if (precioCursoNumerico(preciosDe(c)).tipo === 'informes') {
      avisos.push(`«${c.nombre}» no tiene precio: /diplomados y este documento dicen «${TEXTO_SIN_PRECIO}», y al asignarlo se abre solo el mes 1. Si se vende, ponle precio en ${fichaPrecio}.`)
    }
  }

  if (!addon) return { abortar: null, avisos }

  if (!lista.length) {
    return salir('CONFIG.cursosIngreso está encendido y no hay cursos publicados.',
      'El documento diría «Crea tus propios cursos» a una escuela que compró el add-on. Siembra y publica sus cursos,\no apaga CONFIG.cursosIngreso en config.ts si no se vendió, y vuelve a correr.')
  }

  const ofertas = normalizarOfertas(ing)
  if (!ofertas.length) {
    avisos.push('CONFIG.cursosIngreso está encendido, pero ninguna oferta trae cursoIds: el registro no muestra ninguna.')
  }
  const porId = new Map(lista.map(c => [c.id, c]))
  const precios = new Map(lista.map(c => [c.id, preciosDe(c)]))

  for (const o of ofertas) {
    const faltan = o.cursoIds.filter(id => !porId.has(id))
    if (faltan.length) {
      errores.push(`«${o.nombre}» apunta a ${faltan.length === 1 ? 'un curso que no está publicado' : `${faltan.length} cursos que no están publicados`} (${faltan.join(', ')}): el registro la vende, /diplomados no la muestra y «Asignar» fallaría o abriría un curso que nadie ve.`)
      continue
    }
    const anuncio = resolverPrecioOferta(o, precios)
    const cursos = o.cursoIds.map(id => porId.get(id))

    // Paquete u oferta de varios cursos: el registro vende UNA cifra (config.ts);
    // la ficha de cada curso decide qué abre «Asignar».
    if (o.esPaquete || o.cursoIds.length > 1) {
      // Con una ficha en 0/0, /diplomados y este documento dirían «Pide informes»
      // de un curso que el registro ya vende dentro de la oferta: mismo criterio
      // que la oferta de un curso.
      const sinPrecio = cursos.filter(c => precioCursoNumerico(preciosDe(c)).tipo === 'informes').map(c => `«${c.nombre}»`)
      if (anuncio.tipo !== 'informes' && sinPrecio.length) {
        errores.push(`«${o.nombre}»: el registro la vende a ${textoAnuncio(anuncio, mxn)}, pero ${sinPrecio.join(', ')} no ${sinPrecio.length === 1 ? 'tiene' : 'tienen'} precio en su ficha: /diplomados y este documento dirían «${TEXTO_SIN_PRECIO}», y «Asignar» abriría solo el mes 1. Pon su precio en ${fichaPrecio}.`)
        continue
      }
      const mes1 = cursos.filter(c => precioCursoNumerico(preciosDe(c)).tipo !== 'unico').map(c => `«${c.nombre}»`)
      avisos.push(`«${o.nombre}»: el registro lo vende en una sola oferta a ${textoAnuncio(anuncio, mxn)}; este documento lista cada curso con el precio de su ficha. ${
        mes1.length
          ? `Al asignarlo, ${mes1.join(', ')} ${mes1.length === 1 ? 'abre' : 'abren'} solo el mes 1 (su ficha es mensual o no tiene precio): si cobraste la oferta completa, usa «Abrir todo» en su fila.`
          : 'Al asignarlo, cada curso se abre completo (su ficha es de pago único).'}`)
      continue
    }

    const c = cursos[0]
    // Ficha en 0/0 con precio en config.ts: el registro vende el pago único de
    // config.ts, pero /diplomados y este documento dirían «Pide informes» y
    // «Asignar» abriría solo el mes 1 (la regla de acceso lee la ficha).
    if (anuncio.tipo !== 'informes' && anuncio.fuente === 'config') {
      errores.push(`«${c.nombre}»: su ficha no tiene precio, pero el registro lo vende a ${textoAnuncio(anuncio, mxn)} (config.ts es el respaldo). /diplomados y este documento dirían «${TEXTO_SIN_PRECIO}», y «Asignar» abriría solo el mes 1. Pon ${mxn(o.precio)} de inscripción y 0 de mensualidad en ${fichaPrecio}.`)
      continue
    }
    // Ficha con precio: el registro y este documento anuncian el de la ficha;
    // config.ts solo es un respaldo viejo.
    if (o.precio > 0) {
      const f = precioCursoNumerico(preciosDe(c))
      if (!(f.tipo === 'unico' && f.monto === o.precio)) {
        avisos.push(`«${c.nombre}»: config.ts dice ${mxn(o.precio)}, pero el registro y este documento anuncian el precio de su ficha: ${precioDeCurso(c, mxn)}. Si el bueno es el de config.ts, cámbialo en ${fichaPrecio}.`)
      }
    }
  }

  if (errores.length) {
    return salir(`El documento contradiría lo que vende el registro:\n  · ${errores.join('\n  · ')}`,
      'Corrige la ficha del curso (o CONFIG.cursosIngreso) y vuelve a correr.')
  }
  return { abortar: null, avisos }
}

/**
 * La fila «Cursos propios» de la tabla resumen de modalidades, con la regla del
 * precio de CADA curso: un curso de pago único no tiene mensualidad y se abre
 * completo al asignarlo (C3b); uno mensual o sin precio se abre mes a mes.
 */
export function filaResumenCursos(lista) {
  if (!lista.length) {
    return ['Cursos propios (módulo vacío)', 'La define cada curso', 'Según el curso', 'Completo (pago único) o mes a mes']
  }
  const tipos = new Set(lista.map(c => precioCursoNumerico(preciosDe(c)).tipo))
  const soloUnico = tipos.size === 1 && tipos.has('unico')
  const sinUnico = !tipos.has('unico')
  return [
    `Cursos propios (${lista.length} publicado${lista.length === 1 ? '' : 's'})`,
    'La define cada curso',
    soloUnico ? 'Sin mensualidad (pago único)'
      : tipos.size === 1 && tipos.has('mensual') ? 'Por curso (mensual)'
      : tipos.size === 1 && tipos.has('informes') ? TEXTO_SIN_PRECIO
      : 'Según el curso',
    soloUnico ? 'Completo al asignar' : sinUnico ? 'Mes a mes' : 'Completo (pago único) o mes a mes',
  ]
}
