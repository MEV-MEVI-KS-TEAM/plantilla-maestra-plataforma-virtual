import { exigirSeccion } from '@/lib/permisos-panel'

/**
 * D22a · El personal (Usuarios) es solo del admin. La página ya mostraba «Acceso
 * denegado» en el cliente; ahora no se llega a pintar.
 * Al secretario lo manda a su pantalla (/admin/alumnos); la regla vive en
 * src/lib/permisos-panel.ts.
 */
export default async function UsuariosLayout({ children }: { children: React.ReactNode }) {
  await exigirSeccion('/admin/usuarios')
  return <>{children}</>
}
