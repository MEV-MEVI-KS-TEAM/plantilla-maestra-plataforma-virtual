/**
 * Convención wa.me del proyecto (misma que waContactarUrl en admin/alumnos):
 * se limpian no-dígitos y a los números de 10 dígitos (MX) se les antepone 52.
 */
export function waNumero(telefono: string | null | undefined): string | null {
  if (!telefono) return null
  const limpio = telefono.replace(/\D/g, '')
  if (!limpio) return null
  return limpio.length === 10 ? `52${limpio}` : limpio
}

/** URL wa.me con mensaje prellenado opcional. null si no hay teléfono. */
export function waUrl(telefono: string | null | undefined, mensaje?: string): string | null {
  const numero = waNumero(telefono)
  if (!numero) return null
  return mensaje
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/${numero}`
}
