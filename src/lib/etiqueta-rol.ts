// ─── Cómo se lee quién hizo algo, en todo el panel (Bloque D · D21b, OS4) ───────
// Una sola etiqueta por rol: la misma de la barra lateral y de Usuarios
// («Administrador», «Secretario»). Antes la bitácora de cursos decía
// «(secretaría)» y la del programa «(Secretario)», en la misma ficha. Es solo
// presentación: la base guarda el rol crudo en minúsculas (actor_rol,
// emitida_por_rol) y no cambia. Sin `server-only`: lo importan pantallas y pruebas.

/** Rol guardado (en minúsculas o no) → como se lee en el panel. */
export function etiquetaRol(rol: string | null | undefined): string {
  const r = (rol ?? '').trim().toLowerCase()
  if (r === 'admin') return 'Administrador'
  if (r === 'secretario') return 'Secretario'
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : ''
}

/** «26 sep 2026, 10:42» (la zona es la del navegador). Vacío si la fecha no se lee. */
export function fechaHoraCorta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** «26 sep 2026». Vacío si la fecha no se lee. */
export function fechaCorta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * OS11 · «2 mes(es) abierto(s)» → «2 meses abiertos»; «1 mes(es) abierto(s)» →
 * «1 mes abierto». Los mensajes vienen de funciones SQL (alumno_mover_mes,
 * curso_cobrar) y se corrigen aquí, al mostrarlos, sin migración nueva. Si el
 * patrón no aparece, el mensaje queda igual.
 */
export function pluralMeses(mensaje: string): string {
  return mensaje.replace(/(\d+) mes\(es\) abierto(?:\(s\)|s)?/g, (_m, n: string) =>
    Number(n) === 1 ? `${n} mes abierto` : `${n} meses abiertos`)
}
