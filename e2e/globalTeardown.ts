import { svc, ALUMNO_EMAIL, DIPLOMA_NOMBRE } from './_helpers'

/**
 * Deja la demo lista para el cliente: el diploma queda publicado, con sus 2
 * lecciones y asignado al alumno de QA, pero en 0% → borra SOLO el progreso
 * que el alumno marcó durante los tests. No borra el diploma (queda como demo).
 */
export default async function globalTeardown() {
  const s = svc()
  const { data: alu } = await s.from('usuarios').select('id').eq('email', ALUMNO_EMAIL).single()
  const { data: curso } = await s.from('cursos').select('id').eq('nombre', DIPLOMA_NOMBRE).maybeSingle()
  if (!alu || !curso) { console.log('[globalTeardown] nada que limpiar'); return }

  // Lecciones del diploma
  const { data: mods } = await s.from('curso_modulos').select('id').eq('curso_id', curso.id)
  const modIds = (mods ?? []).map(m => m.id as string)
  if (modIds.length === 0) return
  const { data: lecs } = await s.from('curso_lecciones').select('id').in('modulo_id', modIds)
  const lecIds = (lecs ?? []).map(l => l.id as string)
  if (lecIds.length === 0) return

  const { error } = await s.from('curso_progreso').delete().eq('alumno_id', alu.id).in('leccion_id', lecIds)
  console.log(error ? `[globalTeardown] error borrando progreso: ${error.message}` : '[globalTeardown] progreso del alumno borrado (demo en 0%)')
}
