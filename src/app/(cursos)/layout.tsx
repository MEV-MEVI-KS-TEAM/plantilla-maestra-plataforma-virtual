import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CLASE_PANEL_ACENTO_PROPIO, variablesPanelDeConfig } from '@/lib/colores-panel'

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

  const varsPanel = variablesPanelDeConfig()
  return (
    // `coloresPanel` (opcional): el visor es zona de panel, con su acento. Sin la llave, `{}`.
    <div className={`min-h-screen${Object.keys(varsPanel).length ? ` ${CLASE_PANEL_ACENTO_PROPIO}` : ''}`}
      style={{ background: 'var(--color-fondo)', ...varsPanel } as React.CSSProperties}>
      {children}
    </div>
  )
}
