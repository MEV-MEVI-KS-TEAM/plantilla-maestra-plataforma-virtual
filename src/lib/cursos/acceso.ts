/**
 * Ventana de pago de Solo-Cursos — FUENTE ÚNICA DE VERDAD del lado de la app.
 *
 *   módulos visibles = curso_inscripciones.meses_desbloqueados
 *                    × cursos.modulos_por_mes
 *   como TECHO ABSOLUTO sobre curso_modulos.orden.
 *
 * ⚠️ Esto NO es el candado. El candado es la RLS
 * (supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql), porque el
 * navegador tiene la anon key y puede consultar PostgREST directo. Este módulo
 * es defensa en profundidad + la UX de "disponible al abrir el mes N", y es el
 * gate REAL únicamente en las rutas que usan service_role (los 3 endpoints de
 * examen), que son invisibles a la RLS.
 *
 * Las dos funciones exportadas de cálculo son las ÚNICAS permitidas. Cualquier
 * `orden ?? algo` suelto en otro archivo es el Bug 61 volviendo a entrar.
 */

import { precioCursoNumerico, type PreciosCurso } from './precio-curso'

/**
 * `orden` sin definir va al FINAL, o sea BLOQUEADO — nunca 0, que lo pondría
 * primero y lo abriría.
 *
 * Este valor y su semántica son deliberadamente idénticos a
 * `ORDEN_SIN_DEFINIR` de src/lib/acceso-materias.ts. Allá la divergencia entre
 * el `?? 0` del listado y el `?? 9999` de los gates hizo que una materia sin
 * orden se listara y se bloqueara a la vez, regalando una unidad en 142
 * clientes. El análogo SQL en la RLS es 2147483647 (max int4).
 */
export const ORDEN_SIN_DEFINIR = Number.MAX_SAFE_INTEGER

/** Estados de inscripción que conceden acceso a la ventana ya liberada. */
const ESTADOS_CON_ACCESO = ['activa', 'completada'] as const

export interface InscripcionVentana {
  meses_desbloqueados?: number | null
  estado?: string | null
  fecha_vencimiento?: string | null
  /** Pago único (C3b): foto del contrato al asignar. Ver `limiteVentana`. */
  acceso_total?: boolean | null
}

export interface CursoVentana {
  modulos_por_mes?: number | null
  estado?: string | null
}

export interface ModuloVentana {
  orden?: number | null
}

/**
 * Orden efectivo de un módulo o lección. **Único lugar** donde se resuelve el
 * fallback: listado, ordenamiento y gates tienen que llamar aquí.
 */
export function resolverOrden(item: ModuloVentana | null | undefined): number {
  const n = item?.orden
  return typeof n === 'number' && Number.isFinite(n) ? n : ORDEN_SIN_DEFINIR
}

/**
 * Techo de la ventana: cuántos módulos, contados desde `orden` 0, puede ver.
 * Devuelve 0 cuando no hay acceso a nada.
 *
 * FALLA CERRADO en todos los casos: sin inscripción, sin curso, sin
 * `meses_desbloqueados`, sin `modulos_por_mes`, curso no publicado, inscripción
 * suspendida/cancelada o vencida → 0. Nunca "sin dato = pase libre".
 *
 * `meses_desbloqueados = 0` → 0 módulos. No hay módulo de muestra gratis: eso
 * sería una decisión de producto, no un default técnico.
 */
export function limiteVentana(
  inscripcion: InscripcionVentana | null | undefined,
  curso: CursoVentana | null | undefined
): number {
  if (!inscripcion || !curso) return 0

  if (curso.estado !== 'publicado') return 0

  const estado = inscripcion.estado ?? ''
  if (!(ESTADOS_CON_ACCESO as readonly string[]).includes(estado)) return 0

  // NULL = sin vencimiento. Fecha pasada = sin acceso.
  // Se compara por día (no por instante) para que el último día siga valiendo.
  if (inscripcion.fecha_vencimiento) {
    const hoy = new Date().toISOString().slice(0, 10)
    if (inscripcion.fecha_vencimiento < hoy) return 0
  }

  // Pago único (C3b): la FOTO del contrato al asignar abre el curso completo,
  // pero SOLO aquí, después de los filtros que fallan cerrado (publicado,
  // estado, vencimiento): el mismo lugar que el CASE de curso_ventana_limite
  // en SQL. ORDEN_SIN_DEFINIR (análogo de 2147483647) deja un `orden` sin
  // definir bloqueado. `=== true`: null o ausente es la ventana por meses.
  if (inscripcion.acceso_total === true) return ORDEN_SIN_DEFINIR

  const meses = inscripcion.meses_desbloqueados
  const porMes = curso.modulos_por_mes
  if (typeof meses !== 'number' || !Number.isFinite(meses) || meses <= 0) return 0
  if (typeof porMes !== 'number' || !Number.isFinite(porMes) || porMes <= 0) return 0

  return Math.max(0, Math.floor(meses) * Math.floor(porMes))
}

/**
 * ¿El alumno puede ver este módulo?
 *
 * `orden` es **0-BASED** (lo asigna `(max ?? -1) + 1` en la ruta de alta y lo
 * renumera `orden = i` el reordenador), así que la comparación es ESTRICTA:
 * 1 mes × 2 módulos/mes = límite 2 → se ven los órdenes 0 y 1, no el 2.
 *
 * ⚠️ NO recibe ni mira el progreso, y es a propósito. El techo va sobre `orden`;
 * un módulo completado SIGUE OCUPANDO su posición. Contar pendientes en vez de
 * usar el orden es exactamente el ratchet del Bug 61: cada módulo aprobado
 * revelaba el siguiente y con un mes pagado se abría el curso entero.
 */
export function tieneAccesoModulo(args: {
  inscripcion: InscripcionVentana | null | undefined
  curso: CursoVentana | null | undefined
  modulo: ModuloVentana | null | undefined
}): boolean {
  if (!args.modulo) return false
  return resolverOrden(args.modulo) < limiteVentana(args.inscripcion, args.curso)
}

/**
 * Filtra una lista de módulos a los visibles. Conserva el orden de entrada.
 * Azúcar sobre `tieneAccesoModulo` para que ninguna ruta reimplemente el filtro.
 */
export function modulosVisibles<T extends ModuloVentana>(
  modulos: readonly T[],
  inscripcion: InscripcionVentana | null | undefined,
  curso: CursoVentana | null | undefined
): T[] {
  const limite = limiteVentana(inscripcion, curso)
  return modulos.filter(m => resolverOrden(m) < limite)
}

/**
 * Mes en el que se libera un módulo, 1-based, para el mensaje
 * "disponible al abrir el mes N". Solo presentación: no autoriza nada.
 */
export function mesDeLiberacion(
  modulo: ModuloVentana | null | undefined,
  curso: CursoVentana | null | undefined
): number | null {
  const porMes = curso?.modulos_por_mes
  if (typeof porMes !== 'number' || !Number.isFinite(porMes) || porMes <= 0) return null
  const orden = resolverOrden(modulo)
  if (orden === ORDEN_SIN_DEFINIR) return null
  return Math.floor(orden / Math.floor(porMes)) + 1
}

/**
 * POR QUÉ el alumno no ve contenido (o parte de él). Solo presentación: no
 * autoriza nada — el candado sigue siendo la RLS y `limiteVentana`.
 *
 * El visor decía «Este curso todavía no tiene lecciones» ante CUALQUIER
 * ventana en 0, y el alumno creía que el curso estaba vacío cuando en realidad
 * esperaba su pago (issue #183). Este es el motivo que le da el texto correcto:
 *   'sin_contenido' → el curso de verdad no tiene módulos.
 *   'no_publicado'  → el curso no está publicado.
 *   'no_vigente'    → la inscripción está suspendida o cancelada.
 *   'vencida'       → la inscripción venció.
 *   'sin_apertura'  → inscrito y vigente, pero aún no se le abre nada.
 *   null            → tiene acceso (a todo o a una parte).
 *
 * Usa EXACTAMENTE los mismos filtros que `limiteVentana`, en el mismo orden,
 * para que el motivo y el candado no puedan discrepar. Con `ordenes` exige
 * además ver al menos un módulo (orden < límite), la misma regla que el
 * «Activado» de /admin/alumnos: con la ventana abierta pero ningún orden por
 * debajo del límite (base 1 con un módulo por mes, #204) no ve nada.
 */
export type MotivoBloqueo = 'sin_contenido' | 'no_publicado' | 'no_vigente' | 'vencida' | 'sin_apertura'

/**
 * Qué se abre al ASIGNAR un curso (C3b, decisiones D1 y D2 de Kevin):
 *   pago único (solo inscripción > 0)      → 'total': ve el curso completo;
 *   mensual, o sin precio (0/0)            → 'mes1': se abre el mes 1.
 * Espejo EXACTO de public.curso_regla_apertura (migración 20260926120000), y
 * sale de la MISMA regla del catálogo (precioCursoNumerico): lo que la portada
 * anuncia como «pago único» es lo que abre todo. La prueba de paridad está en
 * tests/unit/c3b-acceso-total.spec.ts.
 */
export type AperturaAlAsignar = 'total' | 'mes1'

export function aperturaAlAsignar(c: PreciosCurso): AperturaAlAsignar {
  return precioCursoNumerico(c).tipo === 'unico' ? 'total' : 'mes1'
}

/**
 * Espejo de public.curso_tope_meses (B3): hasta qué mes se puede abrir un
 * curso. `duracion_meses` manda; si es null, ceil(módulos / módulos por mes).
 * Nunca negativo. Solo presentación: el tope real lo aplica curso_abrir_mes.
 */
export function topeMeses(
  duracionMeses: number | null | undefined,
  modulosTotales: number,
  porMes: number | null | undefined,
): number {
  if (typeof duracionMeses === 'number' && Number.isFinite(duracionMeses)) return Math.max(Math.trunc(duracionMeses), 0)
  if (typeof porMes !== 'number' || !(porMes > 0)) return 0
  return Math.max(Math.ceil(modulosTotales / porMes), 0)
}

/**
 * Cuántos módulos quedan fuera de la ventana y con qué mes se abre el primero,
 * con el MISMO eje que la RLS de B2: un módulo se ve si `orden < límite` (NULL
 * al final). No supone que el orden sea 0..N-1: los clones sembrados en base 1
 * (#204) no lo cumplen, y `totales − límite` les daba un conteo falso.
 *
 * `proximoMes` es null cuando ese mes NO se puede abrir: la inscripción no está
 * 'activa' (curso_abrir_mes solo abre esas) o el mes pasa del tope del curso.
 * Así la banda del visor no le promete al alumno un pago que la escuela no
 * puede registrar.
 */
export function modulosPorAbrir(args: {
  ordenes: readonly (number | null | undefined)[]
  limite: number
  porMes: number | null | undefined
  tope: number
  estado: string | null | undefined
}): { bloqueados: number; proximoMes: number | null } {
  const fuera = args.ordenes
    .map(o => resolverOrden({ orden: o }))
    .filter(o => o >= args.limite)
  if (fuera.length === 0) return { bloqueados: 0, proximoMes: null }
  const mes = mesDeLiberacion({ orden: Math.min(...fuera) }, { modulos_por_mes: args.porMes })
  const abrible = mes !== null && args.estado === 'activa' && mes <= args.tope
  return { bloqueados: fuera.length, proximoMes: abrible ? mes : null }
}

/**
 * ¿Ve el alumno al menos un módulo? El mismo eje que la RLS de B2. Con la
 * ventana abierta pero ningún `orden` por debajo del límite (base 1 con un
 * módulo por mes, #204) el alumno no ve nada, así que eso no es «Activado».
 * Un curso sin módulos cuenta con la ventana sola: no hay nada que ocultarle.
 */
export function hayModuloVisible(ordenes: readonly (number | null | undefined)[], limite: number): boolean {
  if (!(limite > 0)) return false
  if (ordenes.length === 0) return true
  return ordenes.some(o => resolverOrden({ orden: o }) < limite)
}

export function motivoBloqueo(args: {
  inscripcion: InscripcionVentana | null | undefined
  curso: CursoVentana | null | undefined
  modulosTotales: number
  ordenes?: readonly (number | null | undefined)[]
}): MotivoBloqueo | null {
  const { inscripcion, curso, modulosTotales } = args
  if (!(modulosTotales > 0)) return 'sin_contenido'
  if (!curso || curso.estado !== 'publicado') return 'no_publicado'
  if (!inscripcion) return 'sin_apertura'
  if (!(ESTADOS_CON_ACCESO as readonly string[]).includes(inscripcion.estado ?? '')) return 'no_vigente'
  if (inscripcion.fecha_vencimiento) {
    const hoy = new Date().toISOString().slice(0, 10)
    if (inscripcion.fecha_vencimiento < hoy) return 'vencida'
  }
  const limite = limiteVentana(inscripcion, curso)
  if (!(limite > 0)) return 'sin_apertura'
  if (args.ordenes && !hayModuloVisible(args.ordenes, limite)) return 'sin_apertura'
  return null
}
