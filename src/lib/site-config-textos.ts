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
 *
 * «Mis pagos» (api/alumno/pagos/route.ts) toma la cuota y el total del plan
 * PUBLICADO, pero solo si el nivel del alumno tiene UN plan activo
 * (`modalidadPorNivel`); con 0 o 2+ la pantalla dice que no hay calendario.
 * Licenciatura y diplomado solo cuentan un plan que los nombre con `nivel`.
 * Las filas de cada semana conservan su `monto` hasta que se regenera.
 */

export interface OpcionesConfirmaPrecios {
  /** La escuela cobra por semana (`esSemanal()`). */
  semanal: boolean
  /** El cambio incluye el tipo de cambio (solo en escuelas que no cobran en pesos). */
  cambiaTipoCambio: boolean
  /**
   * La pestaña Precios enseña los campos por nivel (`preciosPorNivelVisibles`,
   * F2-9). Opcional: sin él, el modal es el de antes de la Fase 2.
   */
  porNivel?: boolean
  /**
   * Cambió un precio de licenciatura (Bloque B), y en qué portada. Solo la
   * animada tiene sección de licenciaturas: en la clásica, «se verán en tu
   * página pública» sería falso para ellos. Sin él, el modal de siempre.
   */
  licenciaturas?: 'animada' | 'clasica' | 'sinSeccion'
  /**
   * Lo ÚNICO que cambió son precios de licenciatura: el modal no habla de
   * planes, cuotas ni calendarios de Secundaria y Preparatoria que nadie tocó.
   */
  soloLicenciaturas?: boolean
}

/** El modal que sale al publicar un cambio de precios, planes o tipo de cambio. */
export function textoConfirmaPrecios({ semanal, cambiaTipoCambio, porNivel = false, licenciaturas, soloLicenciaturas = false }: OpcionesConfirmaPrecios): string {
  const base = semanal
    ? 'La cuota nueva se verá en tu página pública en unos segundos y se usará en el calendario de quien se inscriba a partir de ahora. Tus alumnos ya inscritos la verán como referencia en «Mis pagos» (si su nivel tiene un solo plan activo), pero sus semanas ya generadas conservan su monto hasta que regeneres su calendario en Cobranza (ahí se recalculan las pendientes y vencidas).'
    : 'Los precios nuevos se verán en tu página pública en unos segundos. Los pagos que ya registraste no cambian. Si apagaste o encendiste un plan, también cambia lo que se ofrece al registrarse.'
  const tipoCambio = cambiaTipoCambio
    ? ' El tipo de cambio nuevo solo cambia la equivalencia en pesos que se muestra; los pagos ya registrados conservan la suya.'
    : ''
  if (soloLicenciaturas && licenciaturas) {
    const soloLic = licenciaturas === 'clasica' ? TEXTO_CONFIRMA_LIC_CLASICA
      : licenciaturas === 'sinSeccion' ? TEXTO_CONFIRMA_LIC_SIN_SECCION
      : TEXTO_CONFIRMA_LIC_ANIMADA
    return `${soloLic}${tipoCambio} ¿Publicar?`
  }
  // Solo en el mensual: en el semanal lo que se cobra es la cuota del plan,
  // que no tiene precio por nivel.
  const nivel = porNivel && !semanal ? ` ${AVISO_PRECIO_POR_NIVEL}` : ''
  const lic = licenciaturas === 'clasica' ? ` ${AVISO_LIC_PORTADA_CLASICA}`
    : licenciaturas === 'sinSeccion' ? ` ${AVISO_LIC_SIN_SECCION}`
    : ''
  return `${base}${nivel}${lic}${tipoCambio} ¿Publicar?`
}

/** El modal cuando lo único que cambió son precios de licenciatura, en la portada animada. */
export const TEXTO_CONFIRMA_LIC_ANIMADA =
  'Los precios nuevos de licenciatura se verán en su sección de tu página pública en unos segundos. Los pagos que ya registraste no cambian.'

/** Lo mismo, en la portada clásica, que no tiene sección de licenciaturas. */
export const TEXTO_CONFIRMA_LIC_CLASICA =
  'Los precios nuevos de licenciatura se aplican en unos segundos, pero tu portada no tiene sección de licenciaturas: no se verán en tu página pública. Los pagos que ya registraste no cambian.'

/** Lo mismo, en la animada, cuando con estos precios ningún plan tiene mensualidad. */
export const TEXTO_CONFIRMA_LIC_SIN_SECCION =
  'Los precios nuevos de licenciatura se aplican en unos segundos, pero con ellos tu página no mostrará la sección de licenciaturas: aparece cuando al menos un plan tiene mensualidad. Los pagos que ya registraste no cambian.'

/** Se añade al modal mixto (cambió también Sec/Prepa) en el caso de arriba. */
export const AVISO_LIC_SIN_SECCION =
  'Con estos precios, tu página no mostrará la sección de licenciaturas: aparece cuando al menos un plan tiene mensualidad.'

/**
 * Se añade al modal cuando cambió un precio de licenciatura y la escuela sirve
 * la portada CLÁSICA, que no tiene sección de licenciaturas.
 */
export const AVISO_LIC_PORTADA_CLASICA =
  'Tu portada no tiene sección de licenciaturas: los precios de licenciatura no se verán en tu página pública.'

/**
 * La frase del modal mensual cuando la escuela puede fijar precios por nivel
 * (F2-9). Remite al marcador del campo vacío («Vacío: usa…») porque ES lo que
 * se cobra: se calcula con el mismo resolver que la landing sobre el borrador.
 * Una regla con palabras fallaba en algún caso: «usa el precio general» es
 * falso con el alias de secundaria (SAMEX, AULA RAÍZ); «conserva lo que cobra
 * hoy», cuando la general cambia en la misma publicación; «sigue la general;
 * si ya cobraba una cifra distinta, la conserva», al vaciar un nivel con
 * precio propio.
 */
export const AVISO_PRECIO_POR_NIVEL = 'Un nivel sin precio propio cobra lo que indica su campo vacío en la pestaña Precios.'

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
  porNivel,
  licenciaturas,
  soloLicenciaturas,
}: OpcionesConfirmaPrecios & { cambiaPrecios: boolean }): { titulo: string; mensaje: string } {
  if (!cambiaPrecios && cambiaTipoCambio) {
    return { titulo: TITULO_CONFIRMA_TIPO_CAMBIO, mensaje: TEXTO_CONFIRMA_SOLO_TIPO_CAMBIO }
  }
  return { titulo: TITULO_CONFIRMA_PRECIOS, mensaje: textoConfirmaPrecios({ semanal, cambiaTipoCambio, porNivel, licenciaturas, soloLicenciaturas }) }
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
  'Cambiar la cuota no modifica las semanas que ya se generaron. La cuota nueva se usa en el calendario de quien se inscriba a partir de ahora y en los que regeneres desde Cobranza, donde se recalculan las semanas pendientes y vencidas. Tus alumnos ya inscritos la ven como referencia en «Mis pagos» (si su nivel tiene un solo plan activo), pero sus semanas conservan su monto hasta que regeneres su calendario.'

/**
 * Se añade a la nota al pie de la pestaña Precios cuando la escuela puede
 * fijar precios por nivel (F2-9). Misma regla que `AVISO_PRECIO_POR_NIVEL`.
 */
export const NOTA_PRECIOS_POR_NIVEL = 'Un nivel sin precio propio cobra lo que indica su campo vacío («Vacío: usa…»).'

/**
 * Ayuda de un campo por nivel cuando el config.ts de la escuela YA trae esa
 * clave con cifra (Moreta): vaciar el campo no vuelve a la general sino a esa
 * cifra, y la ayuda de siempre («sigue la general de hoy») mentiría.
 */
export const AYUDA_NIVEL_DE_FABRICA = 'Vacío = vuelve al precio que trae la configuración de tu escuela para este nivel.'

/**
 * Se añade a la ayuda de un campo por nivel cuando «la general de hoy» de ese
 * nivel NO es la «Mensualidad general» de la misma tarjeta: la secundaria de
 * SAMEX, AULA RAÍZ, CEIJ o Búfalo vive en su alias (2,700 frente a 3,000).
 */
export const AYUDA_NIVEL_CIFRA_PROPIA = 'Este nivel ya cobra hoy una cifra distinta de la «Mensualidad general»: vacío la conserva.'

// ─── Tarjeta «Licenciaturas» (Bloque B, B3) ──────────────────────────────────
//
// 🛑 Nunca la palabra del periodo de cuatro meses: los planes se nombran por su
//    duración («6, 12 o 18 meses»). Tampoco se dice CUÁNDO se paga la
//    titulación: lo decide cada escuela.

/** Bajo la tarjeta «Inscripción · Secundaria y Preparatoria», si la escuela vende licenciaturas. */
export const AYUDA_INSCRIPCION_SEC_PREPA = 'No aplica a licenciatura: su inscripción está en la tarjeta «Licenciaturas».'

/** Lo mismo cuando la inscripción de licenciatura NO se edita desde el panel (forma propia). */
export const AYUDA_INSCRIPCION_SEC_PREPA_SIN_CAMPO = 'No aplica a licenciatura.'

/**
 * Cuando la licenciatura no trae una inscripción propia (ausente, o un objeto
 * por moneda): su alumno paga ESTA, la general (`inscripcionDelAlumno`).
 */
export const AYUDA_INSCRIPCION_TAMBIEN_LIC = 'También la pagan tus alumnos de licenciatura.'

export const AYUDA_LIC_INSCRIPCION =
  'Pago único al inscribirse, igual en todas las carreras. Vacío = vuelve al precio que trae la configuración de tu escuela.'

export const AYUDA_LIC_TITULACION =
  'Título y cédula profesional. Entra en el costo total de cada plan. Vacío = vuelve al precio que trae la configuración de tu escuela.'

export const AYUDA_LIC_MENSUALIDAD = 'Vacío = vuelve al precio que trae la configuración de tu escuela para este plan.'

/** Un plan de licenciatura sin mensualidad: la landing lo esconde (`m.mensualidad > 0`), el registro no. */
export const AYUDA_LIC_MENSUALIDAD_CERO =
  'Sin mensualidad, tu página no muestra este plan, aunque el registro sí lo ofrece.'

export const AYUDA_LIC_SIN_PLANES =
  'Tu escuela todavía no tiene planes de licenciatura. Los da de alta soporte (duración y materias por mes); después les pones precio aquí.'

/** Hay planes, pero ninguno con la forma estándar (opciones de pago, precio por moneda…). */
export const AYUDA_LIC_PLANES_FORMA_PROPIA =
  'Los planes de licenciatura de tu escuela tienen una forma propia: su mensualidad no se edita desde aquí. Pide el cambio a soporte.'

/** Una tabla con forma propia (precios por moneda, por carrera, rutas…): el merge no le aplicaría nada. */
export const AVISO_LIC_FORMA_PROPIA =
  'Los precios de licenciatura de tu escuela tienen una forma propia y no se editan desde aquí. Pide el cambio a soporte.'

/**
 * La nota al pie, según lo que la página pinta de verdad: solo la animada tiene
 * sección de licenciaturas, y solo la pinta con carreras y al menos un plan con
 * mensualidad.
 */
export function notaPreciosLicenciatura(estado: 'animada' | 'clasica' | 'sinSeccion'): string {
  if (estado === 'animada') {
    return 'Los precios de licenciatura se ven en su sección de tu página, con el costo total de cada plan: inscripción, mensualidades y titulación.'
  }
  return estado === 'clasica'
    ? 'Tu portada no tiene sección de licenciaturas: sus precios no se muestran en tu página pública.'
    : AVISO_LIC_SIN_SECCION
}

/** Nota al pie de la pestaña Precios. */
export const NOTA_PRECIOS =
  'Estos precios se muestran en tu página pública. Cambiarlos no modifica los pagos ya registrados. El precio de cada curso o diplomado se edita en su propia ficha.'

/** Subtítulo del editor. */
export const SUBTITULO_EDITOR =
  'Tu logo, colores, textos y precios. Se publican sin tocar código y se ven en unos segundos.'
