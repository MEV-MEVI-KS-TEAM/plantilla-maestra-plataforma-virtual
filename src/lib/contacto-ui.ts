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

/**
 * El WhatsApp de la escuela tal como se guarda y como va en `wa.me/…`.
 *
 * UNA sola regla para el panel (al guardar), para la config ya publicada (al
 * leer, en `mergeSiteConfig`) y para todo botón que arme el enlace:
 *
 *   · se quitan espacios, guiones, paréntesis y «+»;
 *   · vacío → `''`: la escuela no usa WhatsApp, y es una respuesta válida;
 *   · 10 dígitos → celular mexicano sin lada de país: se le antepone `52`;
 *   · 12 dígitos que empiezan con `52` y 13 que empiezan con `521` → tal cual;
 *   · cualquier otro número internacional de 8 a 15 dígitos → tal cual;
 *   · lo demás → `null` (no es un número: letras, puntos, muy corto o muy
 *     largo, o empieza con 0, que ninguna lada de país hace).
 *
 * 🛑 Por qué el 52. El panel aceptaba 10 dígitos y el enlace salía
 *    `https://wa.me/3312345678`: WhatsApp lo lee como un número de otro país y
 *    el alumno escribe a nadie. Solo la landing animada agregaba el 52; los
 *    demás botones (login, registro, pie de página, inicio del alumno, legales,
 *    diplomados) quedaban rotos.
 *
 * Idempotente: normalizar lo ya normalizado da lo mismo.
 */
export function normalizarWhatsApp(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return ''
  const limpio = valor.replace(/[\s()+-]/g, '')
  if (limpio === '') return ''
  if (!/^\d+$/.test(limpio)) return null
  if (limpio.length === 10) return `52${limpio}`
  if (limpio.length === 12 && limpio.startsWith('52')) return limpio
  if (limpio.length === 13 && limpio.startsWith('521')) return limpio
  if (limpio.length >= 8 && limpio.length <= 15 && !limpio.startsWith('0')) return limpio
  return null
}

/**
 * Qué se le dice al admin cuando el número no pasa `normalizarWhatsApp`. Lo usan
 * el servidor (al rechazar el guardado) y el editor (bajo el campo), con la
 * etiqueta del campo que toque.
 */
export function mensajeWhatsAppInvalido(etiqueta: string): string {
  return `El campo ${etiqueta} debe ser un celular de 10 dígitos (p. ej. 33 1234 5678) ` +
    'o un número con lada de país, de 8 a 15 dígitos (p. ej. 52 33 1234 5678). ' +
    'Déjalo vacío si la escuela no usa WhatsApp.'
}

/**
 * Un `https://wa.me/<dígitos>…` con el número pasado por `normalizarWhatsApp`,
 * conservando lo que venga detrás (`?text=…`). Para el `whatsappUrl` que se
 * guardó antes de esta regla (`wa.me/3312345678`). Lo que no sea un enlace
 * `wa.me/<dígitos>`, o un número que no se pueda normalizar, se deja tal cual.
 */
export function normalizarUrlWhatsApp(url: string): string {
  const m = /^(https?:\/\/wa\.me\/)(\d+)(.*)$/.exec(url)
  if (!m) return url
  const n = normalizarWhatsApp(m[2])
  return n ? `${m[1]}${n}${m[3]}` : url
}

/** LADAs de dos dígitos en México (CDMX, Guadalajara, Monterrey); las demás son de tres. */
const LADA_DE_DOS = /^(33|55|56|81)/

/**
 * El WhatsApp de la escuela como se LEE: «33 1234 5678», «777 441 6667»,
 * «+1 210 792 3638». `''` si no hay un número válido.
 *
 * Un número mexicano (52 + 10, o 521 + 10) se escribe sin la lada de país,
 * que es como lo dicta cualquiera en México; el de otro país lleva su «+».
 */
export function formatearWhatsApp(numero: string | null | undefined): string {
  const n = normalizarWhatsApp(numero)
  if (!n) return ''
  const mx = n.length === 12 && n.startsWith('52') ? n.slice(2)
    : n.length === 13 && n.startsWith('521') ? n.slice(3)
      : null
  if (mx) {
    return LADA_DE_DOS.test(mx)
      ? `${mx.slice(0, 2)} ${mx.slice(2, 6)} ${mx.slice(6)}`
      : `${mx.slice(0, 3)} ${mx.slice(3, 6)} ${mx.slice(6)}`
  }
  if (n.length === 11 && n.startsWith('1')) return `+1 ${n.slice(1, 4)} ${n.slice(4, 7)} ${n.slice(7)}`
  return `+${n}`
}

/**
 * ¿El texto «como se muestra» dice ESE número? Se comparan los dígitos: basta
 * con que coincidan los últimos diez (con o sin lada de país, con el 1 del
 * celular o sin él, con cualquier separador).
 */
export function whatsappDisplayCuadra(display: string | null | undefined, numero: string | null | undefined): boolean {
  const d = String(display ?? '').replace(/\D/g, '')
  const n = normalizarWhatsApp(numero)
  if (!n || d.length < Math.min(10, n.length)) return false
  return d === n || d.slice(-10) === n.slice(-10)
}

/**
 * ¿Ese número es un WhatsApp REAL de la escuela?
 *
 * UVEP (#209) llegó con el placeholder `520000000000` en el intake: un número
 * con forma válida que no existe. `waUrl()` solo mira que haya dígitos, así que
 * con él armaba un enlace de WhatsApp perfectamente formado que no lleva a
 * nadie. Aquí se exige además que no sea un marcador:
 *
 *   · que pase `normalizarWhatsApp()` (10 dígitos mexicanos → con 52 delante)
 *     y no quede vacío;
 *   · y que sus últimos diez dígitos no sean todos ceros (el marcador).
 *
 * 🛑 Solo para el WhatsApp DE LA ESCUELA. El recibo por WhatsApp va al número
 *    del alumno y no pasa por aquí.
 */
export function whatsappEscuelaDisponible(numero: string | null | undefined): boolean {
  const n = normalizarWhatsApp(numero)
  if (!n) return false
  return !/^0{10}$/.test(n.slice(-10))
}

/** `https://wa.me/…` de la escuela, o `null` si no tiene un número real. */
export function urlWhatsAppEscuela(numero: string | null | undefined, mensaje?: string): string | null {
  if (!whatsappEscuelaDisponible(numero)) return null
  const n = normalizarWhatsApp(numero) as string
  return mensaje ? `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/${n}`
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
  const correo = (cfg.contactoEmail || cfg.email || '').trim()
  const mailto = mailtoEscuela(correo, mensaje)
  if (mailto) {
    return {
      tipo: 'correo',
      href: mailto,
      etiqueta: 'Escríbenos por correo',
      valor: correo,
    }
  }
  return null
}

/**
 * El WhatsApp de la escuela tal como se LEE, el mismo en toda la plataforma:
 * el texto publicado («33 1234 5678», que ya sigue al número) o, si faltara,
 * el número formateado. `''` sin número.
 *
 * El perfil del alumno y la FAQ de la landing clásica pintaban los dígitos
 * crudos («523312345678») mientras el pie y la portada animada enseñaban el
 * número con su formato.
 */
export function whatsappVisible(cfg: ConfigContacto): string {
  return cfg.whatsappDisplay || formatearWhatsApp(cfg.whatsapp || cfg.contactoTelefono || '')
}

/**
 * Lo que la página enseñará con ESE número y ESE texto, con la misma regla que
 * aplica la lectura (`normalizarContactoWhatsApp`): el texto si dice ese
 * número; si no, el número formateado; sin WhatsApp real, nada. Para lo que
 * todavía no se publica (la vista previa del panel).
 */
export function whatsappComoSeVera(numero: string | null | undefined, display: string | null | undefined): string {
  if (whatsappDisplayCuadra(display, numero)) return String(display)
  return whatsappEscuelaDisponible(numero) ? formatearWhatsApp(numero) : ''
}

/**
 * La línea de contacto del encabezado del recibo PDF: el sitio y, SOLO si la
 * escuela tiene WhatsApp, «· WhatsApp 33 1234 5678».
 *
 * Sin número el recibo imprimía «https://… · WhatsApp » con la palabra
 * colgando: una escuela que quitó su WhatsApp lo seguía anunciando, vacío, en
 * cada comprobante nuevo.
 */
export function lineaContactoRecibo(urlBase: string, cfg: ConfigContacto): string {
  const visible = whatsappVisible(cfg)
  return whatsappEscuelaDisponible(cfg.whatsapp || cfg.contactoTelefono || '') && visible
    ? `${urlBase} · WhatsApp ${visible}`
    : urlBase
}

/**
 * `mailto:` del correo PÚBLICO de la escuela, o `null` si no tiene. Sin esto
 * cada pantalla armaba `mailto:${correo}` a mano y, con el correo vacío,
 * publicaba un enlace sin destinatario y con el texto visible vacío.
 */
export function mailtoEscuela(correo: string | null | undefined, asunto?: string): string | null {
  const c = String(correo ?? '').trim()
  if (!c) return null
  return asunto ? `mailto:${c}?subject=${encodeURIComponent(asunto)}` : `mailto:${c}`
}

/**
 * Las preguntas de la FAQ que dan el número (`{whatsapp}`), FUERA si la escuela
 * no tiene WhatsApp. La plantilla trae «Contamos con canal directo de atención
 * por WhatsApp al {whatsapp}.»: sin número salía «…por WhatsApp al .», una
 * promesa de atención por un canal que no existe.
 */
export function faqSegunWhatsApp<T extends { readonly q: string; readonly a: string }>(
  items: readonly T[],
  hayWhatsApp: boolean,
): T[] {
  if (hayWhatsApp) return [...items]
  return items.filter((f) => !f.q.includes('{whatsapp}') && !f.a.includes('{whatsapp}'))
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
