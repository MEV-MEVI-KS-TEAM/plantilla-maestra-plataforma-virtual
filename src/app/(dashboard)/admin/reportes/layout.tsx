import { exigirSeccion } from '@/lib/permisos-panel'

/**
 * D22a · Informes es solo del admin (decisión 2): el secretario ya no ve el error
 * rojo sin salida.
 * Al secretario lo manda a su pantalla (/admin/alumnos); la regla vive en
 * src/lib/permisos-panel.ts.
 */
export default async function ReportesLayout({ children }: { children: React.ReactNode }) {
  await exigirSeccion('/admin/reportes')
  return <>{children}</>
}
