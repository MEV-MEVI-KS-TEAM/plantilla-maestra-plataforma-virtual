/**
 * El canal por el que la ESCUELA atiende a sus alumnos.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────────
 *
 * La plataforma da por hecho en varios sitios que la escuela tiene WhatsApp y
 * arma el enlace a mano: `https://wa.me/${cfg.whatsapp}`. Con el número vacío eso
 * no es un botón que falta, es un botón que MIENTE: abre WhatsApp en blanco, el
 * alumno cree que escribió a la escuela y se queda esperando una respuesta que
 * nadie va a mandar.
 *
 * AULA RAÍZ (#208) entró sin número —el intake traía un placeholder que no
 * existe— así que este caso dejó de ser hipotético. Y el arreglo no puede ser
 * esconder el botón sin más: los avisos donde aparece («estás en modo demo»,
 * «inscripción pendiente») existen para que la persona pueda PREGUNTAR. Quitarle
 * el único canal la deja peor que antes.
 *
 * Así que esto devuelve el canal que la escuela sí tiene, en orden de
 * preferencia: WhatsApp si hay número, y correo si no. `null` solo cuando no
 * hay ninguno de los dos, y ahí sí el botón desaparece porque no habría a dónde
 * mandar a nadie.
 *
 * ⚠️ ESTO ES EL CANAL DE LA ESCUELA, no el del alumno. El envío de recibos por
 * WhatsApp usa el número del ALUMNO y no pasa por aquí: sigue funcionando en una
 * escuela sin WhatsApp propio.
 *
 * Puro: lo importan componentes cliente, rutas de servidor y pruebas.
 */
import { waNumero, waUrl } from '@/lib/whatsapp'

/**
 * ¿Ese número es un WhatsApp REAL de la escuela?
 *
 * UVEP (#209) llegó con el placeholder `520000000000` en el intake: un número
 * con forma válida que no existe. `waUrl()` solo mira que haya dígitos, así que
 * con él armaba un enlace de WhatsApp perfectamente formado que no lleva a
 * nadie. Aquí se exige además que no sea un marcador:
 *
 *   · normalizado por `waNumero()` (10 dígitos mexicanos → con 52 delante);
 *   · entre 11 y 13 dígitos, que es lo que admite el editor del panel;
 *   · y que sus últimos diez dígitos no sean todos ceros (el marcador).
 *
 * 🛑 Solo para el WhatsApp DE LA ESCUELA. El recibo por WhatsApp va al número
 *    del alumno y no pasa por aquí.
 */
export function whatsappEscuelaDisponible(numero: string | null | undefined): boolean {
  const n = waNumero(numero)
  if (!n || n.length < 11 || n.length > 13) return false
  return !/^0{10}$/.test(n.slice(-10))
}

/** `https://wa.me/…` de la escuela, o `null` si no tiene un número real. */
export function urlWhatsAppEscuela(numero: string | null | undefined, mensaje?: string): string | null {
  return whatsappEscuelaDisponible(numero) ? waUrl(numero, mensaje) : null
}

export type CanalEscuela = {
  tipo: 'whatsapp' | 'correo'
  /** `https://wa.me/…` o `mailto:…`. */
  href: string
  /** Para el botón: «WhatsApp» / «Escríbenos por correo». */
  etiqueta: string
  /** El dato en sí, por si la interfaz lo enseña: el número o el correo. */
  valor: string
}

type ConfigContacto = {
  readonly whatsapp?: string | null
  readonly whatsappUrl?: string | null
  readonly whatsappDisplay?: string | null
  readonly contactoTelefono?: string | null
  readonly contactoEmail?: string | null
  readonly email?: string | null
}

/**
 * El canal de contacto de la escuela, o `null` si no tiene ninguno.
 *
 * `mensaje` prellena el chat de WhatsApp o el asunto del correo, así que quien
 * recibe sabe de qué va antes de abrirlo.
 */
export function canalEscuela(cfg: ConfigContacto, mensaje?: string): CanalEscuela | null {
  const numero = cfg.whatsapp || cfg.contactoTelefono || ''
  const wa = urlWhatsAppEscuela(numero, mensaje)
  if (wa) {
    return {
      tipo: 'whatsapp',
      href: wa,
      etiqueta: 'WhatsApp',
      valor: cfg.whatsappDisplay || numero,
    }
  }
  const correo = cfg.contactoEmail || cfg.email || ''
  if (correo) {
    return {
      tipo: 'correo',
      href: mensaje ? `mailto:${correo}?subject=${encodeURIComponent(mensaje)}` : `mailto:${correo}`,
      etiqueta: 'Escríbenos por correo',
      valor: correo,
    }
  }
  return null
}

/**
 * ¿La escuela tiene WhatsApp propio?
 *
 * Para decidir si se pinta el ícono de WhatsApp o el del sobre. 🛑 No la uses
 * para el envío de recibos: eso va al número del alumno.
 */
export function escuelaTieneWhatsApp(cfg: ConfigContacto): boolean {
  return whatsappEscuelaDisponible(cfg.whatsapp || cfg.contactoTelefono || '')
}
