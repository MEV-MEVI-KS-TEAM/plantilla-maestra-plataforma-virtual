import { exigirSeccion } from '@/lib/permisos-panel'

/**
 * D22a · Documentos es solo del admin (decisión 3): el secretario ya no ve los
 * filtros con «Error al cargar documentos» debajo.
 * Al secretario lo manda a su pantalla (/admin/alumnos); la regla vive en
 * src/lib/permisos-panel.ts.
 */
export default async function DocumentosLayout({ children }: { children: React.ReactNode }) {
  await exigirSeccion('/admin/documentos')
  return <>{children}</>
}
