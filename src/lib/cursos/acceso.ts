/**
 * Ventana de pago de Solo-Cursos — FUENTE ÚNICA DE VERDAD del lado de la app.
 *
 *   módulos visibles = curso_inscripciones.meses_desbloqueados
 *                    × cursos.modulos_por_mes
 *   como TECHO ABSOLUTO sobre la POSICIÓN del módulo en su curso (#255): cuántos
 *   `orden` DISTINTOS del curso hay por debajo del suyo. Ver `posicionesVentana`.
 *
 * ⚠️ Esto NO es el candado. El candado es la RLS
 * (supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql, con la
 * posición de 20260930120000_fix255_ventana_por_posicion.sql), porque el
 * navegador tiene la anon key y puede consultar PostgREST directo. Este módulo
 * es defensa en profundidad + la UX de "disponible al abrir el mes N", y es el
 * gate REAL únicamente en las rutas que usan service_role (los 3 endpoints de
 * examen), que son invisibles a la RLS.
 *
 * Las funciones exportadas de cálculo son las ÚNICAS permitidas. Cualquier
 * `orden ?? algo` suelto en otro archivo es el Bug 61 volviendo a entrar, y
 * cualquier `orden < límite` suelto es el #255: compara el número crudo y no la
 * posición.
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
 * Posición de cada módulo dentro de su curso, base 0 (#255). ESPEJO EXACTO de
 * public.curso_modulo_posicion
 * (supabase/migrations/20260930120000_fix255_ventana_por_posicion.sql): la
 * posición es cuántos `orden` DISTINTOS del curso hay por debajo del suyo
 * («dense»). Recibe los `orden` de TODOS los módulos del curso y devuelve la
 * posición de cada uno, en el mismo orden de entrada.
 *
 * Por qué no el `orden` crudo: la ventana cuenta MÓDULOS (meses × módulos por
 * mes) y el `orden` no siempre empieza en 0 ni va seguido. Los seeds de los
 * bancos anteriores al 25-sep-2026 lo escribieron en base 1 (Bug 238, #204), y
 * un borrado a mano deja huecos: con el `orden` crudo cada mes abría un módulo
 * menos y el último podía no abrirse nunca.
 *
 * Por qué «dense» y no «rank» (decisión de Kevin, 30-sep-2026):
 *  - Con `orden` 0..N-1 seguidos (la convención de la app) la posición ES el
 *    `orden`: nada cambia en un curso sano.
 *  - Con `orden` ≥ 0 la posición nunca pasa del `orden` (debajo de un `orden` k
 *    hay a lo más k valores distintos): NADIE ve menos que con el `orden` crudo.
 *  - Dos módulos con el mismo `orden` comparten posición y se abren juntos, como
 *    antes. «rank» los separaba y a alguien le quitaba uno.
 *
 * Un `orden` sin definir no tiene posición: devuelve ORDEN_SIN_DEFINIR (queda
 * BLOQUEADO, también con acceso total) y no cuenta para los demás. La
 * comparación con el límite sigue siendo ESTRICTA (`<`): cambiarla a `<=`
 * regalaría un módulo por mes (regla del Bug 238).
 */
export function posicionesVentana(ordenes: readonly (number | null | undefined)[]): number[] {
  const resueltos = ordenes.map(o => resolverOrden({ orden: o }))
  const distintos = Array.from(new Set(resueltos.filter(o => o !== ORDEN_SIN_DEFINIR))).sort((a, b) => a - b)
  return resueltos.map(o => {
    if (o === ORDEN_SIN_DEFINIR) return ORDEN_SIN_DEFINIR
    // Cuántos distintos hay por debajo de `o` (búsqueda binaria del primero ≥ o).
    let bajo = 0
    let alto = distintos.length
    while (bajo < alto) {
      const medio = (bajo + alto) >> 1
      if (distintos[medio] < o) bajo = medio + 1
      else alto = medio
    }
    return bajo
  })
}

/** Posición (ver `posicionesVentana`) de UN módulo, dados los `orden` de su curso. */
export function posicionEnCurso(
  orden: number | null | undefined,
  ordenesDelCurso: readonly (number | null | undefined)[]
): number {
  return posicionesVentana([orden, ...ordenesDelCurso])[0]
}

/**
 * Techo de la ventana: cuántos módulos, contados por su POSICIÓN desde 0, puede ver.
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
 * ¿El alumno puede ver este módulo? Es la regla de public.curso_modulo_en_ventana:
 * su POSICIÓN en el curso (`posicionesVentana`) por debajo del límite, ESTRICTO.
 * 1 mes × 2 módulos/mes = límite 2 → se ven las posiciones 0 y 1, no la 2.
 * Por eso pide los `orden` de TODO el curso: la posición depende de los demás.
 *
 * ⚠️ NO recibe ni mira el progreso, y es a propósito. El techo va sobre la
 * posición; un módulo completado SIGUE OCUPANDO la suya. Contar pendientes en vez
 * de usar la posición es exactamente el ratchet del Bug 61: cada módulo aprobado
 * revelaba el siguiente y con un mes pagado se abría el curso entero.
 */
export function tieneAccesoModulo(args: {
  inscripcion: InscripcionVentana | null | undefined
  curso: CursoVentana | null | undefined
  modulo: ModuloVentana | null | undefined
  ordenesDelCurso: readonly (number | null | undefined)[]
}): boolean {
  if (!args.modulo) return false
  return posicionEnCurso(args.modulo.orden, args.ordenesDelCurso) < limiteVentana(args.inscripcion, args.curso)
}

/**
 * Filtra una lista de módulos a los visibles. Conserva el orden de entrada.
 * La lista tiene que ser el curso COMPLETO: de ella sale la posición de cada uno.
 * Azúcar sobre `posicionesVentana` para que ninguna ruta reimplemente el filtro.
 */
export function modulosVisibles<T extends ModuloVentana>(
  modulos: readonly T[],
  inscripcion: InscripcionVentana | null | undefined,
  curso: CursoVentana | null | undefined
): T[] {
  const limite = limiteVentana(inscripcion, curso)
  const posiciones = posicionesVentana(modulos.map(m => m.orden))
  return modulos.filter((_, i) => posiciones[i] < limite)
}

/**
 * Cuántos módulos del curso caen por debajo de `limite`, por su posición. Es la
 * cuenta de `modulos_visibles` en public.reporte_curso_inscripciones y en la
 * vista por inscripción del panel: lo que el alumno ve con ese límite.
 */
export function contarVisibles(ordenes: readonly (number | null | undefined)[], limite: number): number {
  return posicionesVentana(ordenes).filter(p => p < limite).length
}

/**
 * ¿Ve el alumno el curso COMPLETO (todos sus módulos, el último incluido)? Es el
 * candado del examen final (`puedeExamenFinal`): no se presenta sin poder ver el
 * último módulo. Un curso sin módulos (solo examen) pide al menos la ventana
 * abierta (límite > 0).
 */
export function cursoCompletoVisible(ordenes: readonly (number | null | undefined)[], limite: number): boolean {
  if (!(limite > 0)) return false
  return posicionesVentana(ordenes).every(p => p < limite)
}

/**
 * Mes en el que se libera un módulo, 1-based, para el mensaje
 * "disponible al abrir el mes N". Recibe la POSICIÓN del módulo
 * (`posicionesVentana`), no su `orden`. Solo presentación: no autoriza nada.
 */
export function mesDeLiberacion(
  posicion: number | null | undefined,
  curso: CursoVentana | null | undefined
): number | null {
  const porMes = curso?.modulos_por_mes
  if (typeof porMes !== 'number' || !Number.isFinite(porMes) || porMes <= 0) return null
  if (typeof posicion !== 'number' || !Number.isFinite(posicion) || posicion === ORDEN_SIN_DEFINIR) return null
  return Math.floor(posicion / Math.floor(porMes)) + 1
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
 * además ver al menos un módulo (posición < límite), la misma regla que el
 * «Activado» de /admin/alumnos.
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
 * con el MISMO eje que la RLS: un módulo se ve si su POSICIÓN < límite (un
 * `orden` sin definir, nunca). Cuenta módulos, no posiciones: dos módulos con el
 * mismo `orden` son dos módulos por abrir.
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
  const fuera = posicionesVentana(args.ordenes).filter(p => p >= args.limite)
  if (fuera.length === 0) return { bloqueados: 0, proximoMes: null }
  const mes = mesDeLiberacion(Math.min(...fuera), { modulos_por_mes: args.porMes })
  const abrible = mes !== null && args.estado === 'activa' && mes <= args.tope
  return { bloqueados: fuera.length, proximoMes: abrible ? mes : null }
}

/**
 * ¿Ve el alumno al menos un módulo? El mismo eje que la RLS: la posición. Con
 * la ventana abierta, el primer módulo (posición 0) siempre entra, aunque el
 * curso venga en base 1 (#255); solo un curso cuyos `orden` estén todos sin
 * definir no muestra nada, y eso no es «Activado».
 * Un curso sin módulos cuenta con la ventana sola: no hay nada que ocultarle.
 */
export function hayModuloVisible(ordenes: readonly (number | null | undefined)[], limite: number): boolean {
  if (!(limite > 0)) return false
  if (ordenes.length === 0) return true
  return contarVisibles(ordenes, limite) > 0
}

/**
 * ¿La inscripción concede hoy lo que tiene abierto? Activa o completada, y sin
 * vencer (la fecha es la de hoy en UTC, como `motivoBloqueo`). Es la parte de
 * la inscripción del candado (curso_ventana_limite); la del curso es que esté
 * publicado.
 */
export function inscripcionVigente(
  inscripcion: Pick<InscripcionVentana, 'estado' | 'fecha_vencimiento'>,
  hoy: string = new Date().toISOString().slice(0, 10),
): boolean {
  if (!(ESTADOS_CON_ACCESO as readonly string[]).includes(inscripcion.estado ?? '')) return false
  return !(inscripcion.fecha_vencimiento && inscripcion.fecha_vencimiento < hoy)
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
