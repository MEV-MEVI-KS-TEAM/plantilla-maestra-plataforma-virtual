import type { SupabaseClient } from '@supabase/supabase-js'
import { revisarEdicionEdadTutor, type DatosEdadTutor, type EdadTutorLimpio } from '@/lib/registro-reglas'

/**
 * Lo único que el panel escribe en `alumnos` fuera de «Corregir plan»: las cuatro
 * columnas de edad y tutor de un combo con Primaria. Vive aparte para que la ruta de
 * datos siga sin poder tocar nivel, modalidad ni carrera (D9).
 */

/** Lee la fila y aplica la regla del registro sobre lo guardado con lo que llega encima. */
export async function revisarEdadTutorDelAlumno(
  admin: SupabaseClient,
  alumnoId: string,
  cuerpo: DatosEdadTutor,
): Promise<{ ok: true; datos: EdadTutorLimpio } | { ok: false; status: number; error: string }> {
  const { data: fila, error } = await admin
    .from('alumnos')
    .select('nivel, fecha_nacimiento, tutor_nombre, tutor_telefono, tutor_parentesco')
    .eq('id', alumnoId)
    .maybeSingle()
  if (error) {
    console.error('[admin/edad-tutor] lectura de alumnos:', error.message)
    return { ok: false, status: 500, error: error.message }
  }
  if (!fila) return { ok: false, status: 404, error: 'Alumno no encontrado' }
  const revision = revisarEdicionEdadTutor(cuerpo, fila)
  return revision.ok ? revision : { ok: false, status: 400, error: revision.error }
}

/** Lo que «Corregir plan» cambia en la fila. */
export type PlanAlumno = { nivel: string | null; modalidad: string | null; carrera: string | null }

export const mismoPlan = (a: PlanAlumno, b: PlanAlumno): boolean =>
  a.nivel === b.nivel && a.modalidad === b.modalidad && a.carrera === b.carrera

/** El plan de la fila tal como está. Con error, no se sabe: quien llama no debe suponer nada. */
export async function leerPlanAlumno(
  admin: SupabaseClient,
  alumnoId: string,
): Promise<{ ok: true; plan: PlanAlumno } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from('alumnos')
    .select('nivel, modalidad, carrera')
    .eq('id', alumnoId)
    .maybeSingle()
  if (error || !data) {
    const mensaje = error?.message ?? 'Alumno no encontrado'
    console.error('[admin/edad-tutor] lectura del plan:', mensaje)
    return { ok: false, error: mensaje }
  }
  const f = data as Partial<PlanAlumno>
  return { ok: true, plan: { nivel: f.nivel ?? null, modalidad: f.modalidad ?? null, carrera: f.carrera ?? null } }
}

/** Las cuatro columnas tal como están, para poder volver a ellas. */
export async function leerEdadTutor(
  admin: SupabaseClient,
  alumnoId: string,
): Promise<{ ok: true; datos: EdadTutorLimpio } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from('alumnos')
    .select('fecha_nacimiento, tutor_nombre, tutor_telefono, tutor_parentesco')
    .eq('id', alumnoId)
    .maybeSingle()
  if (error) {
    console.error('[admin/edad-tutor] lectura de alumnos:', error.message)
    return { ok: false, error: error.message }
  }
  const f = (data ?? {}) as Partial<EdadTutorLimpio>
  return {
    ok: true,
    datos: {
      fecha_nacimiento: f.fecha_nacimiento ?? null,
      tutor_nombre: f.tutor_nombre ?? null,
      tutor_telefono: f.tutor_telefono ?? null,
      tutor_parentesco: f.tutor_parentesco ?? null,
    },
  }
}

/** Guarda las cuatro columnas. Devuelve el mensaje de error, o null si quedó. */
export async function guardarEdadTutor(
  admin: SupabaseClient,
  alumnoId: string,
  datos: EdadTutorLimpio,
): Promise<string | null> {
  const { error } = await admin.from('alumnos').update(datos).eq('id', alumnoId)
  if (error) console.error('[admin/edad-tutor] escritura de alumnos:', error.message)
  return error ? error.message : null
}
