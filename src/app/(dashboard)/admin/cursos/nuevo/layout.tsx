import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Crear un curso es SOLO del admin. Desde D7b el layout de /admin/cursos deja
 * pasar al secretario (asigna y abre desde la pestaña Alumnos): aquí se le
 * devuelve a la lista. La API (POST /api/admin/cursos) lo rechaza igual.
 */
export default async function NuevoCursoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/alumno')
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if ((usuario?.rol as string | undefined)?.toLowerCase() !== 'admin') redirect('/admin/cursos')
  return <>{children}</>
}
