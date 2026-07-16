/**
 * Lectura de cursos del alumno con la SESIÓN DEL USUARIO (RLS activo, sin
 * service role). La RLS garantiza que solo se devuelven cursos publicados en
 * los que el alumno está inscrito (o todo, si es_admin() → vista previa).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { SIGNED_URL_TTL } from './storage'
import { BUCKET_CURSOS } from './archivos'
import type { LeccionAlumno, ModuloAlumno } from '@/types/cursos-alumno'

async function signed(supabase: SupabaseClient, path: string | null): Promise<string | null> {
  if (!path) return null
  const { data } = await supabase.storage.from(BUCKET_CURSOS).createSignedUrl(path, SIGNED_URL_TTL)
  return data?.signedUrl ?? null
}

/** Ids de las lecciones de un curso accesible (ordenadas), vía RLS. */
export async function leccionesDeCurso(
  supabase: SupabaseClient,
  cursoId: string
): Promise<{ moduloId: string; leccionId: string }[]> {
  const { data: modulos } = await supabase
    .from('curso_modulos')
    .select('id')
    .eq('curso_id', cursoId)
  const moduloIds = (modulos ?? []).map(m => m.id as string)
  if (moduloIds.length === 0) return []

  const { data: lecciones } = await supabase
    .from('curso_lecciones')
    .select('id, modulo_id')
    .in('modulo_id', moduloIds)
  return (lecciones ?? []).map(l => ({ moduloId: l.modulo_id as string, leccionId: l.id as string }))
}

/** Set de leccion_id completadas por el usuario actual en un conjunto de lecciones. */
export async function completadasDe(
  supabase: SupabaseClient,
  userId: string,
  leccionIds: string[]
): Promise<Set<string>> {
  if (leccionIds.length === 0) return new Set()
  const { data } = await supabase
    .from('curso_progreso')
    .select('leccion_id')
    .eq('alumno_id', userId)
    .eq('completada', true)
    .in('leccion_id', leccionIds)
  return new Set((data ?? []).map(r => r.leccion_id as string))
}

/** Estructura completa de módulos+lecciones de un curso, con progreso y URLs firmadas. */
export async function modulosConProgreso(
  supabase: SupabaseClient,
  userId: string,
  cursoId: string
): Promise<{ modulos: ModuloAlumno[]; total: number; completadas: number }> {
  const { data: modulosRaw } = await supabase
    .from('curso_modulos')
    .select('id, nombre, orden')
    .eq('curso_id', cursoId)
    .order('orden', { ascending: true })
    .order('id', { ascending: true })

  const moduloIds = (modulosRaw ?? []).map(m => m.id as string)
  if (moduloIds.length === 0) return { modulos: [], total: 0, completadas: 0 }

  const { data: leccionesRaw } = await supabase
    .from('curso_lecciones')
    .select('id, modulo_id, titulo, video_url, contenido_texto, material_path, orden')
    .in('modulo_id', moduloIds)
    .order('orden', { ascending: true })
    .order('id', { ascending: true })

  const todas = (leccionesRaw ?? [])
  const completadasSet = await completadasDe(supabase, userId, todas.map(l => l.id as string))

  const lecciones: LeccionAlumno[] = await Promise.all(
    todas.map(async l => ({
      id: l.id as string,
      titulo: l.titulo as string,
      video_url: (l.video_url as string | null) ?? null,
      contenido_texto: (l.contenido_texto as string | null) ?? null,
      materialUrl: await signed(supabase, l.material_path as string | null),
      tieneMaterial: Boolean(l.material_path),
      orden: (l.orden as number) ?? 0,
      completada: completadasSet.has(l.id as string),
    }))
  )

  const modulos: ModuloAlumno[] = (modulosRaw ?? []).map(m => ({
    id: m.id as string,
    nombre: m.nombre as string,
    orden: (m.orden as number) ?? 0,
    lecciones: lecciones.filter(l => todas.find(t => t.id === l.id)?.modulo_id === m.id),
  }))

  return { modulos, total: todas.length, completadas: completadasSet.size }
}

export const portadaFirmada = signed
