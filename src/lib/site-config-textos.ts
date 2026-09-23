/**
 * Textos del editor "Personalizar mi página" que PROMETEN algo sobre lo que
 * hace la plataforma (Fase 2, F2-3).
 *
 * Viven aquí y no en `configuracion/page.tsx` por dos razones:
 *   - un `page.tsx` de Next 14 no admite exports arbitrarios, así que las
 *     pruebas no podían leer las constantes;
 *   - la e2e del editor compara el modal contra ESTA misma fuente, en vez de
 *     una copia que se quedaba vieja.
 *
 * 🛑 Cada frase tiene que ser verdad para cualquier escuela. Las versiones
 * anteriores prometían cosas que la plataforma no hace:
 *   - "en el registro de alumnos": el registro no pinta precios de
 *     Secundaria/Preparatoria;
 *   - "en los montos sugeridos del sistema": no existen; el monto de cada pago
 *     se captura a mano;
 *   - "al instante": la propia barra de publicar dice que tarda unos segundos;
 *   - "cada alumno conserva la cuota con la que se inscribió": "Regenerar" en
 *     Cobranza rehace las semanas pendientes y vencidas con la cuota vigente.
 */

export interface OpcionesConfirmaPrecios {
  /** La escuela cobra por semana (`esSemanal()`). */
  semanal: boolean
  /** El cambio incluye el tipo de cambio (solo en escuelas que no cobran en pesos). */
  cambiaTipoCambio: boolean
}

/** El modal que sale al publicar un cambio de precios, planes o tipo de cambio. */
export function textoConfirmaPrecios({ semanal, cambiaTipoCambio }: OpcionesConfirmaPrecios): string {
  const base = semanal
    ? 'La cuota nueva se verá en tu página pública en unos segundos y se usará en el calendario de quien se inscriba a partir de ahora. Tus alumnos ya inscritos la verán como referencia en «Mis pagos», pero sus semanas ya generadas conservan su monto hasta que regeneres su calendario en Cobranza (ahí se recalculan las pendientes y vencidas).'
    : 'Los precios nuevos se verán en tu página pública en unos segundos. Los pagos que ya registraste no cambian. Si apagaste o encendiste un plan, también cambia lo que se ofrece al registrarse.'
  const tipoCambio = cambiaTipoCambio
    ? ' El tipo de cambio nuevo solo cambia la equivalencia en pesos que se muestra; los pagos ya registrados conservan la suya.'
    : ''
  return `${base}${tipoCambio} ¿Publicar?`
}

export const TITULO_CONFIRMA_PRECIOS = 'Vas a cambiar precios'
export const TITULO_CONFIRMA_TIPO_CAMBIO = 'Vas a cambiar el tipo de cambio'

/** El modal cuando lo ÚNICO que cambia es el tipo de cambio: sin hablar de precios ni cuotas. */
export const TEXTO_CONFIRMA_SOLO_TIPO_CAMBIO =
  'El tipo de cambio nuevo solo cambia la equivalencia en pesos que se muestra; los pagos ya registrados conservan la suya. ¿Publicar?'

/**
 * Título y texto del modal de publicar, según lo que cambió. Si solo cambió el
 * tipo de cambio, el modal no habla de precios ni de cuotas que nadie tocó.
 */
export function confirmacionDePrecios({
  semanal,
  cambiaPrecios,
  cambiaTipoCambio,
}: OpcionesConfirmaPrecios & { cambiaPrecios: boolean }): { titulo: string; mensaje: string } {
  if (!cambiaPrecios && cambiaTipoCambio) {
    return { titulo: TITULO_CONFIRMA_TIPO_CAMBIO, mensaje: TEXTO_CONFIRMA_SOLO_TIPO_CAMBIO }
  }
  return { titulo: TITULO_CONFIRMA_PRECIOS, mensaje: textoConfirmaPrecios({ semanal, cambiaTipoCambio }) }
}

/**
 * El modal de "Restaurar diseño original". El DELETE deja `site_config.data`
 * en `{}`: la página vuelve al config.ts DE LA ESCUELA (no "a la plantilla") y
 * se revierten también precios, planes y tipo de cambio.
 */
export const TEXTO_CONFIRMA_RESTAURAR =
  'Se borrarán todos tus cambios (textos, colores, precios, planes apagados y tipo de cambio) y el logo que subiste. Tu página y tus precios volverán a como se entregaron. Los pagos y calendarios ya generados no cambian. ¿Continuar?'

/** Ayuda bajo los planes de una escuela SEMANAL (pestaña Precios). */
export const AYUDA_CUOTA_SEMANAL =
  'Cambiar la cuota no modifica las semanas que ya se generaron. La cuota nueva se usa en el calendario de quien se inscriba a partir de ahora y en los que regeneres desde Cobranza, donde se recalculan las semanas pendientes y vencidas. Tus alumnos ya inscritos la ven como referencia en «Mis pagos», pero sus semanas conservan su monto hasta que regeneres su calendario.'

/** Nota al pie de la pestaña Precios. */
export const NOTA_PRECIOS =
  'Estos precios se muestran en tu página pública. Cambiarlos no modifica los pagos ya registrados. El precio de cada curso o diplomado se edita en su propia ficha.'

/** Subtítulo del editor. */
export const SUBTITULO_EDITOR =
  'Tu logo, colores, textos y precios. Se publican sin tocar código y se ven en unos segundos.'
