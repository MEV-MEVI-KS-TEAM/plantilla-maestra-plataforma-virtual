import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Guard server-side de la sección Cursos y Diplomados (defensa en profundidad:
 * el middleware y el layout de /admin ya protegen, pero esta sección re-verifica).
 * Sin sesión o sin rol de staff (case-insensitive, consistente con LOWER(rol) de
 * es_admin()/es_staff() en producción) → dashboard del alumno.
 *
 * D7b (decisión 6): el SECRETARIO entra — asigna, abre, cobra y (desde D20b) emite
 * la constancia desde la pestaña Alumnos, que es lo único que la página del curso
 * le muestra. Todo lo que edita el curso (crear, editar, publicar, contenido,
 * examen) y cancelar, reactivar o quitar una inscripción sigue con verifyAdmin en
 * su API, y /admin/cursos/nuevo tiene su propio guard de admin.
 */
export default async function AdminCursosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/alumno')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = (usuario?.rol as string | undefined)?.toLowerCase()
  if (rol !== 'admin' && rol !== 'secretario') redirect('/alumno')

  return <>{children}</>
}
