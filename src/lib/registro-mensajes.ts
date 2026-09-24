/**
 * Los avisos del registro que ofrecen el alta por WhatsApp.
 *
 * Tres errores del alta (límite de correos, fallo genérico y cuenta pendiente
 * de confirmar) terminaban con «escríbenos por WhatsApp y te damos de alta
 * nosotros». En una escuela SIN WhatsApp eso manda al aspirante a un canal que
 * no existe, justo cuando ya no puede registrarse solo. Aquí la frase solo va
 * si la escuela tiene número; con número, el texto es el de siempre, letra por
 * letra.
 *
 * Puro: lo importa la página del registro y lo prueban las unitarias.
 */
export type CasoRegistro = 'limite' | 'generico' | 'confirmar'

export function mensajeRegistro(caso: CasoRegistro, opciones: { hayWhatsApp: boolean; email?: string }): string {
  const { hayWhatsApp, email = '' } = opciones
  switch (caso) {
    case 'limite':
      return 'Hemos enviado demasiados correos en la última hora. Espera unos minutos y vuelve a intentarlo' +
        (hayWhatsApp ? ', o escríbenos por WhatsApp y te damos de alta nosotros.' : '.')
    case 'generico':
      return 'No pudimos crear tu cuenta en este momento. Vuelve a intentarlo' +
        (hayWhatsApp ? ' o escríbenos por WhatsApp.' : ' más tarde.')
    case 'confirmar':
      return 'Te enviamos un correo de confirmación a ' + email + '. Revísalo (y la carpeta de spam) para activar tu cuenta.' +
        (hayWhatsApp ? ' Si no te llega en unos minutos, escríbenos por WhatsApp y te damos de alta nosotros.' : '')
  }
}
