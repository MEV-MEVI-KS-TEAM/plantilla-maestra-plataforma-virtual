/**
 * Rutas públicas que se sirven TAL CUAL aunque haya sesión abierta.
 *
 * El middleware manda al panel a quien, con sesión, abre una ruta pública
 * (`/login`, `/register`…). Estas son la excepción porque son páginas de
 * CONSULTA que se abren con y sin sesión indistintamente:
 *
 *  - `/`             landing.
 *  - `/diplomados`   catálogo público (B5); su link circula por WhatsApp.
 *  - `/validar` y `/api/validar`: validación pública de constancias. El admin
 *    o el propio alumno también comprueban folios con la sesión abierta; sin
 *    esta excepción la página los botaba a su panel y la API respondía un 307
 *    hacia HTML en vez del JSON (hueco encontrado en la Fase 2 de MEDERI).
 *
 * Módulo puro (sin Supabase) para poder probarlo en la suite unitaria.
 */
const PREFIJOS_CONSULTA = ['/diplomados', '/validar', '/api/validar'] as const

export function esPublicaAunConSesion(pathname: string): boolean {
  if (pathname === '/') return true
  return PREFIJOS_CONSULTA.some(p => pathname === p || pathname.startsWith(p + '/'))
}
