import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AulaCurso from '@/components/cursos/AulaCurso'

/**
 * /cursos/[id] — vista previa del ADMIN («Ver como alumno» en Publicación).
 *
 * El alumno estudia el curso en /alumno/curso/[id], dentro de su portal y con
 * la navegación de una materia (TICKET-2026-10-09-02). Aquí solo se le
 * reenvía: enlaces viejos, el «volver» del examen y de la constancia, y
 * cualquier marcador siguen llevando al aula correcta.
 */
export default async function VisorCursoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  const rol = (usuario?.rol as string | undefined)?.toUpperCase()

  // Sin fila o ALUMNO: es un alumno (mismo criterio que el layout de /alumno).
  if (!rol || rol === 'ALUMNO') redirect(`/alumno/curso/${params.id}`)

  return <AulaCurso cursoId={params.id} vistaAdmin />
}
