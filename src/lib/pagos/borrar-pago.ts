/**
 * Borrar un pago (D10, #207-2a): qué decirle al admin, sin tocar la base.
 *
 * Borrar el pago NO cierra el mes ni quita el acceso total, y es deliberado: el
 * acceso solo se mueve por «Abrir mes» / «Cerrar mes» / «Quitar acceso total»,
 * que aplican tope, estado y protección de doble clic. Pero el admin tiene que
 * ENTERARSE si el acceso que ese pago abrió sigue abierto; y no hay que decírselo
 * si ya lo cerró, porque seguir el consejo le quitaría un mes pagado.
 */

type ErrorPg = { code?: string; message?: string } | null | undefined

/**
 * El evento de apertura que el cobro dejó en su misma transacción (mismo
 * created_at). Hoy lo deja el cobro con «abrir mes» (curso_registrar_pago, B3);
 * `abrir_todo` llega con el cobro que abre según la ficha (D16).
 */
export type AperturaDelPago = { tipo: string; meses_despues: number | null }

/** Cómo está HOY la inscripción (lo que se lee justo antes de borrar). */
export type InscripcionHoy = { meses_desbloqueados?: number | null; acceso_total?: boolean | null }

/** «Esa columna no existe» (PostgREST 42703) por `curso_inscripcion_id`: base sin B1. */
export function faltaFkCurso(error: ErrorPg): boolean {
  if (!error) return false
  return error.code === '42703' || /curso_inscripcion_id/.test(error.message ?? '')
}

/** Un id que no es UUID (Postgres 22P02): es «no encontrado», no un error del servidor. */
export function idInvalido(error: ErrorPg): boolean {
  return error?.code === '22P02'
}

/** La tabla no existe (sin B4 no hay bitácora): no hay nada que avisar ni que registrar. */
export function faltaTabla(error: ErrorPg): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|Could not find the table/i.test(error.message ?? '')
}

export const AVISO_ABRIO_TODO =
  'Se borró el pago, pero ese pago ABRIÓ TODO EL CURSO y el alumno conserva el acceso total. Si querías revocarlo, usa «Quitar acceso total» en su inscripción (pestaña Alumnos del curso).'

export function avisoAbrioMes(mes: number): string {
  return `Se borró el pago, pero ese pago abrió el mes ${mes} del curso, que SIGUE ABIERTO: el alumno conserva el acceso. Si querías revocarlo, usa «Cerrar mes» en su inscripción (pestaña Alumnos del curso).`
}

/**
 * El aviso, solo si lo que el pago abrió SIGUE abierto hoy. Sin evento (pago que
 * no abrió nada, o base sin bitácora) o sin la inscripción, no se afirma nada.
 */
export function avisoAlBorrarPago(abrio: AperturaDelPago | null, hoy: InscripcionHoy | null): string | null {
  if (!abrio || !hoy) return null
  if (abrio.tipo === 'abrir_todo') return hoy.acceso_total === true ? AVISO_ABRIO_TODO : null
  if (abrio.tipo === 'abrir_mes') {
    const mes = abrio.meses_despues
    if (mes == null || mes < 1) return null
    // Con acceso total, cerrar el mes no revoca nada: el aviso sería engañoso.
    if (hoy.acceso_total === true) return null
    return (hoy.meses_desbloqueados ?? 0) >= mes ? avisoAbrioMes(mes) : null
  }
  return null
}
