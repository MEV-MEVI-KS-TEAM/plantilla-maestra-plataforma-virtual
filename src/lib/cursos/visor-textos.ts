/** Textos del visor del curso (puros: sin React ni Supabase, para poder probarlos). */
import type { VentanaCurso } from '@/types/cursos-alumno'

/**
 * Qué decirle al alumno cuando no hay ninguna lección que mostrarle. Antes
 * era SIEMPRE «Este curso todavía no tiene lecciones», también a quien estaba
 * inscrito esperando su pago (#183): creía que el curso estaba vacío. Ahora
 * «no tiene lecciones» solo sale si el curso de verdad no tiene ninguna.
 */
export function textoSinLecciones(
  totalLecciones: number,
  ventana: Pick<VentanaCurso, 'motivo'> | null,
  tipo: string,
): { texto: string; esperaPago: boolean } {
  const cual = tipo === 'diplomado' ? 'diplomado' : 'curso'
  if (!(totalLecciones > 0) || ventana?.motivo === 'sin_contenido') {
    return { texto: `Este ${cual} todavía no tiene lecciones.`, esperaPago: false }
  }
  switch (ventana?.motivo) {
    case 'no_vigente':
      return { texto: `Tu inscripción a este ${cual} no está activa. Habla con tu escuela para reactivarla.`, esperaPago: false }
    case 'vencida':
      return { texto: `Tu acceso a este ${cual} ya venció. Habla con tu escuela si quieres renovarlo.`, esperaPago: false }
    case 'no_publicado':
      return { texto: `Este ${cual} no está disponible por ahora.`, esperaPago: false }
    case 'sin_apertura':
      return { texto: `Tu acceso a este ${cual} todavía no está abierto. Se abre cuando tu escuela registre tu pago.`, esperaPago: true }
    default:
      // Sin motivo (tiene acceso) o sin ventana: lo abierto no trae lecciones.
      // No es un pago pendiente, y decírselo sería el mismo aviso falso de #183 al revés.
      return { texto: `Los módulos que tienes abiertos todavía no tienen lecciones. Tu escuela está preparando el contenido.`, esperaPago: false }
  }
}
