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
