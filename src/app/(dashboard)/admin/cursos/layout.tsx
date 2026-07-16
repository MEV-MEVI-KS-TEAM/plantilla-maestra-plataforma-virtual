import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Guard server-side de la sección Cursos y Diplomados (defensa en profundidad:
 * el middleware y el layout de /admin ya protegen, pero esta sección re-verifica).
 * Sin sesión o rol != 'admin' (case-insensitive, consistente con LOWER(rol)
 * de es_admin() en producción) → dashboard del alumno.
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

  if ((usuario?.rol as string | undefined)?.toLowerCase() !== 'admin') redirect('/alumno')

  return <>{children}</>
}
