import { exigirSeccion } from '@/lib/permisos-panel'

/**
 * D22a · El contenido académico es solo del admin: el secretario ya no ve «Nueva
 * materia» ni el error de la API. Cubre también /admin/contenido/[id].
 * Al secretario lo manda a su pantalla (/admin/alumnos); la regla vive en
 * src/lib/permisos-panel.ts.
 */
export default async function ContenidoLayout({ children }: { children: React.ReactNode }) {
  await exigirSeccion('/admin/contenido')
  return <>{children}</>
}
