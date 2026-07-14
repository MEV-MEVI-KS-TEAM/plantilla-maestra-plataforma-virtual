import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout del visor de cursos (/cursos/[id]). Fuera del layout del alumno a
 * propósito: aquí acceden tanto alumnos (inscritos, vía RLS) como el admin
 * (vista previa con es_admin()), sin el redirect a /admin del layout de alumno.
 * El middleware ya exige sesión; esto es defensa en profundidad.
 */
export default async function CursosViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFB' }}>
      {children}
    </div>
  )
}
