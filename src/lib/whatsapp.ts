/**
 * El número de WhatsApp listo para `wa.me`: solo dígitos y, si quedan
 * EXACTAMENTE 10 (un celular mexicano capturado sin lada de país), con `52`
 * delante. Cualquier otra longitud se devuelve tal cual (solo dígitos): no se
 * adivina la lada de nadie más. Vacío → `''`.
 *
 * 🛑 Por qué existe (CONECTM EDU, 22-sep-2026): "Personalizar mi página"
 * aceptaba 10 dígitos (`5580803210`) y los guardaba así; el enlace derivado
 * salía `https://wa.me/5580803210` —WhatsApp lo interpreta con otra lada y no
 * llega a nadie— y el botón de la escuela, que exige 11–13 dígitos, se
 * escondía. Se normaliza al GUARDAR (validación del editor) y al LEER
 * (`mergeSiteConfig`), así que también se corrigen los números que ya estaban
 * guardados con 10 dígitos, sin tocar la BD.
 *
 * Idempotente: `normalizarWhatsApp(normalizarWhatsApp(x)) === normalizarWhatsApp(x)`.
 */
export function normalizarWhatsApp(telefono: string | null | undefined): string {
  if (typeof telefono !== 'string') return ''
  const limpio = telefono.replace(/\D/g, '')
  return limpio.length === 10 ? `52${limpio}` : limpio
}

/**
 * Convención wa.me del proyecto (misma que waContactarUrl en admin/alumnos):
 * se limpian no-dígitos y a los números de 10 dígitos (MX) se les antepone 52.
 */
export function waNumero(telefono: string | null | undefined): string | null {
  return normalizarWhatsApp(telefono) || null
}

/**
 * `https://wa.me/<número>` con el número ya normalizado, conservando lo que
 * venga detrás del número (`?text=…`). Para arreglar un `whatsappUrl` guardado
 * antes de la normalización. Si no es un enlace `wa.me/<dígitos>` se devuelve
 * tal cual.
 */
export function normalizarWhatsAppUrl(url: string): string {
  const m = /^(https?:\/\/wa\.me\/)(\d+)(.*)$/.exec(url.trim())
  if (!m) return url
  return `${m[1]}${normalizarWhatsApp(m[2])}${m[3]}`
}

/**
 * El mensaje con el que se manda un recibo por WhatsApp.
 *
 * 🛑 CON `concepto = 'otro'` LA FRASE DECÍA «tu recibo de pago de pago» (P-11).
 * La plantilla de la frase ya trae la palabra «pago» —«aquí está tu recibo de
 * pago de …»— y la etiqueta de `otro` en el catálogo de conceptos es,
 * precisamente, `'pago'`. Con los otros cuatro conceptos la frase lee bien
 * («…de mensualidad», «…de inscripción», «…de cuota semanal», «…de
 * certificación»); `otro` es un concepto que el panel SÍ ofrece en su selector,
 * así que no era un caso inalcanzable: lo produce cualquier cobro que no encaje
 * en los demás, y lo lee un alumno en su WhatsApp.
 *
 * Se arregla armando la frase según el concepto en vez de renombrar la etiqueta:
 * `'pago'` es la palabra correcta en el resto de la interfaz (el selector del
 * panel, el PDF, el estado de cuenta), y cambiarla ahí para arreglar una frase
 * de WhatsApp habría movido cuatro sitios para no repetir una palabra en uno.
 *
 * Vive aquí, y no dentro de la ruta, para que se pueda probar: la ruta importa
 * el cliente de Supabase en el cuerpo del módulo.
 */
export function mensajeRecibo(opciones: {
  alumnoNombre: string
  /** La etiqueta ya resuelta del concepto: 'mensualidad', 'Semana 3 de 24', 'pago'… */
  conceptoLabel: string
  /** El monto ya formateado, con moneda. */
  montoFmt: string
  url: string
}): string {
  const { alumnoNombre, conceptoLabel, montoFmt, url } = opciones
  // Un concepto genérico no se nombra dos veces: la frase ya dice «de pago».
  const deConcepto = conceptoLabel.trim().toLowerCase() === 'pago'
    ? ''
    : ` de ${conceptoLabel}`
  return `Hola ${alumnoNombre}, aquí está tu recibo de pago${deConcepto} por ${montoFmt}: ${url}`
}

/** URL wa.me con mensaje prellenado opcional. null si no hay teléfono. */
export function waUrl(telefono: string | null | undefined, mensaje?: string): string | null {
  const numero = waNumero(telefono)
  if (!numero) return null
  return mensaje
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/${numero}`
}
