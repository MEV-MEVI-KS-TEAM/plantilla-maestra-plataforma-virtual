/**
 * Quién entra a cada sección de /admin (Bloque D · D22a).
 *
 * El middleware y el layout de /admin solo exigen «personal» (ADMIN o
 * SECRETARIO); el nivel de cada sección se decide AQUÍ, en el servidor y antes
 * de pintar. Antes, el secretario abría por URL pantallas que no son suyas: el
 * Dashboard (leído con service role, «Bienvenido, Administrador»), el editor de
 * «Personalizar mi página» en solo lectura, «Nueva materia» en Contenido, los
 * filtros de Documentos o el error sin salida de Informes.
 *
 * No va en el middleware: su matcher se salta las rutas con extensión (un
 * `/admin/contenido/x.html` no pasaría por él), la matriz es por sección (en
 * /admin/cursos la lista sí y «nuevo» no) y así no se toca el archivo que
 * cambia #187.
 *
 * Las API NO dependen de esto: cada handler revisa el rol por su cuenta
 * (verifyAdmin / verifyStaff, o la función SQL con la sesión). Lo vigila la
 * prueba guardián de D22a, que también exige que toda página de /admin caiga
 * en una sección de esta tabla.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type NivelPanel = 'admin' | 'staff'

/** Adonde va el secretario si abre algo que no es suyo: su pantalla de siempre. */
export const INICIO_SECRETARIO = '/admin/alumnos'

/** Cada sección de /admin y quién entra (la sección más larga que coincide manda). */
export const SECCIONES_PANEL = {
  '/admin': 'admin',                // Dashboard: conteos de toda la escuela (decisión 1)
  '/admin/alumnos': 'staff',        // altas y «Marcar contactado» (D21a)
  '/admin/estado-cuenta': 'staff',
  '/admin/pagos': 'staff',          // sin los KPIs de ingresos para el secretario (decisión 4)
  '/admin/cobranza': 'staff',       // cobrar sí; condonar, regenerar y plan a medida, solo admin (D22b)
  '/admin/cursos': 'staff',         // la lista y la pestaña Alumnos (D7b)
  '/admin/cursos/nuevo': 'admin',   // su layout (D7b) lo devuelve a la lista
  '/admin/contenido': 'admin',
  '/admin/documentos': 'admin',     // decisión 3
  '/admin/reportes': 'admin',       // decisión 2
  '/admin/usuarios': 'admin',
  '/admin/configuracion': 'admin',  // «Personalizar mi página»
} as const satisfies Record<string, NivelPanel>

export type SeccionPanel = keyof typeof SECCIONES_PANEL

/**
 * Pura: adonde mandar a quien tiene `rol` si abre una sección de `nivel`, o
 * null si pasa. El rol llega crudo de la base (en mayúsculas o no). Sin rol
 * legible, a /login, como el layout de /admin; el alumno, a su panel.
 */
export function destinoSinPermiso(nivel: NivelPanel, rol: string | null | undefined): string | null {
  const r = (rol ?? '').trim().toLowerCase()
  if (r === 'admin') return null
  if (r === 'secretario') return nivel === 'staff' ? null : INICIO_SECRETARIO
  return r === 'alumno' ? '/alumno' : '/login'
}

/** En el servidor (layout o página): redirige si el rol no alcanza para la sección. */
export async function exigirSeccion(seccion: SeccionPanel): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const destino = destinoSinPermiso(SECCIONES_PANEL[seccion], usuario?.rol as string | undefined)
  if (destino) redirect(destino)
}
