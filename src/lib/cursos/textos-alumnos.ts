/**
 * Textos de la pestaña «Alumnos» de un curso que dependen de la FICHA del curso
 * o de QUIÉN los lee (admin o secretario) — Bloque D · D21b.
 *
 * Funciones puras para que las pruebas fijen el criterio y no la redacción de
 * cada rama del JSX.
 */
import type { PrecioNumerico } from './precio-regla'

/** Cómo cobra la ficha del curso hoy (precioCursoNumerico(curso).tipo). */
export type TipoPrecioCurso = PrecioNumerico['tipo']

/**
 * OS1 · ¿La 2ª confirmación de «Abrir todo» lleva el aviso «no reembolsable»?
 * SOLO cuando la ficha es de PAGO ÚNICO con precio > 0 (tipo 'unico'): es la
 * misma regla que acompaña a AVISO_PAGO_UNICO en precio-regla.ts. En un curso
 * mensual o sin precio no hay un pago único que deje de reembolsarse, y el aviso
 * sería falso.
 */
export function llevaAvisoNoReembolsable(tipo: TipoPrecioCurso): boolean {
  return tipo === 'unico'
}

/**
 * OS1 · La 2ª confirmación de «Abrir todo» fuera del pago único: sigue siendo
 * doble (decisión de Kevin) y dice lo que de verdad pasa.
 */
export function textoAbrirTodoSinPagoUnico(tipo: Exclude<TipoPrecioCurso, 'unico'>): string {
  return tipo === 'mensual'
    ? 'Con acceso total verá todo el curso, también los módulos que se agreguen, aunque no haya pagado las mensualidades que faltan. Solo se deshace con «Quitar acceso total».'
    : 'Este curso no tiene precio en su ficha. Con acceso total verá todo el curso, también los módulos que se agreguen. Solo se deshace con «Quitar acceso total».'
}

/**
 * OS2 · El final del aviso «este curso no tiene precio en su ficha…». El precio
 * lo pone SOLO el administrador (PATCH del curso con verifyAdmin); al secretario
 * no se le pide algo que no puede hacer.
 */
export function finalFichaSinPrecio(esAdmin: boolean): string {
  return esAdmin
    ? 'y ponle precio al curso en Contenido → Precios y ritmo.'
    : 'y pide al administrador que le ponga precio al curso.'
}

/** OS2 · Lo mismo en la confirmación de «Asignar a todos». */
export function precioAntesDeAsignar(esAdmin: boolean): string {
  return esAdmin
    ? 'ponle precio antes de asignar.'
    : 'pide al administrador que le ponga precio antes de asignar.'
}

/**
 * «…cuando lo publiques»: el secretario no publica cursos (PATCH del curso con
 * verifyAdmin), así que a él se le dice quién lo hará.
 */
export function cuandoSePublique(esAdmin: boolean): string {
  return esAdmin ? 'cuando lo publiques' : 'cuando el administrador lo publique'
}

/**
 * La 2ª confirmación de pago único cuando HOY no lo vería (borrador o inscripción
 * no vigente): AVISO_PAGO_UNICO dice «Acceso completo inmediato», y eso sería
 * falso; lo que sigue siendo cierto es que ya no se reembolsa.
 */
export const AVISO_NO_REEMBOLSABLE = 'No reembolsable una vez activado'

/**
 * «… verá todo el curso ___» en la 2ª confirmación de pago único: «desde ya»
 * solo si hoy lo vería (curso publicado e inscripción vigente, los filtros del
 * candado); si no, cuándo.
 */
export function cuandoVeraTodo(publicado: boolean, vigente: boolean, esAdmin: boolean): string {
  if (!publicado) return cuandoSePublique(esAdmin)
  if (!vigente) return 'cuando su inscripción esté activa y vigente'
  return 'desde ya'
}

/**
 * El motivo de un botón apagado porque la inscripción no está activa. Reactivar
 * una inscripción es solo del administrador: al secretario no se le pide.
 */
export function tituloNoActiva(estado: string, esAdmin: boolean, paraAbrirMeses = false): string {
  if (!esAdmin) return `Inscripción ${estado}: solo el administrador puede reactivarla`
  return paraAbrirMeses ? `Inscripción ${estado}: reactívala para abrir meses` : `Inscripción ${estado}: reactívala primero`
}

/** El title de «−»: sin meses abiertos no hay un «mes 0» que cerrar. */
export function tituloCerrarMes(meses: number): string {
  return meses <= 0 ? 'No tiene meses abiertos que cerrar' : `Cerrar el mes ${meses} (quita acceso)`
}

/**
 * El title de «+ Abrir mes» en el tope (OS9): en singular si el curso dura un mes,
 * y sin «los N meses» si el curso se acortó y ya tiene abiertos más de N.
 */
export function tituloTopeAlcanzado(tope: number, meses: number): string {
  if (meses > tope) return `El curso ahora dura ${tope} ${tope === 1 ? 'mes' : 'meses'} y ya tiene abiertos ${meses}: no hay más que abrir`
  return tope === 1
    ? 'Ya tiene abierto el único mes del curso: no hay más que abrir'
    : `Ya tiene abiertos los ${tope} meses del curso: no hay más que abrir`
}

/**
 * OS3 · Lo que hace «−» HOY: si ve el curso, le quita acceso; si no lo ve
 * (borrador, inscripción suspendida o vencida), no le quita nada hoy.
 */
export function efectoCerrarMes(conAccesoHoy: boolean): string {
  return conAccesoHoy
    ? 'Esto le quita acceso que ya tenía: los módulos de ese mes dejarán de verse.'
    : 'Hoy no ve el curso (en borrador o con la inscripción no vigente); cuando vuelva a verlo, ese mes ya no estará abierto.'
}

/**
 * OS3 · El final del confirm de «−»: promete «+ Abrir mes» solo si ese botón va
 * a estar encendido después de cerrar (inscripción activa y por debajo del tope).
 */
export function comoReabrir(estado: string, mesesDespues: number, tope: number | null): string {
  if (estado !== 'activa') return 'Su avance no se borra; para volver a abrirlo, la inscripción tiene que estar activa.'
  if (tope !== null && mesesDespues >= tope) return 'Su avance no se borra.'
  return 'Su avance no se borra y puedes volver a abrirlo con «+ Abrir mes».'
}
