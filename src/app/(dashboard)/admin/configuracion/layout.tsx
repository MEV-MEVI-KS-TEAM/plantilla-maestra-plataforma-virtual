import { exigirSeccion } from '@/lib/permisos-panel'

/**
 * D22a · «Personalizar mi página» es solo del admin: el secretario ya no ve el editor
 * en solo lectura (su GET también pasó a solo admin).
 * Al secretario lo manda a su pantalla (/admin/alumnos); la regla vive en
 * src/lib/permisos-panel.ts.
 */
export default async function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  await exigirSeccion('/admin/configuracion')
  return <>{children}</>
}
