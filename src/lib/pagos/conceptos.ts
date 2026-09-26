/**
 * Conceptos de pago: la ÚNICA fuente de sus etiquetas y de sus listas
 * (Bloque D · D4, #207).
 *
 * Había seis copias de CONCEPTO_LABELS (la ficha del alumno, /admin/pagos,
 * Reportes, la ruta del recibo, el Excel y el PDF del recibo), cada una con su
 * propia lista y ninguna con los conceptos de curso: un pago de curso salía
 * como «curso_mensualidad» y el PDF pintaba «cuota_semanal» o «certificacion»
 * crudos. Aquí viven las etiquetas y los dominios; los demás archivos importan.
 *
 * Puro: sin CONFIG ni Supabase, para que lo usen por igual el servidor, los
 * componentes cliente y el PDF.
 *
 * La vertical de un pago (programa o curso) NO se decide por el concepto sino
 * por la FK `pagos.curso_inscripcion_id`, igual que B6 y B7: ver verticalDePago.
 */

/** Los que registra el modal del PROGRAMA (Sec/Prepa/Licenciatura). */
export const CONCEPTOS_PROGRAMA = ['inscripcion', 'mensualidad', 'otro'] as const
export type ConceptoPrograma = (typeof CONCEPTOS_PROGRAMA)[number]

/** Los del programa que solo se LEEN (los escribe el calendario semanal y el alta). */
export const CONCEPTOS_PROGRAMA_LECTURA = [...CONCEPTOS_PROGRAMA, 'cuota_semanal', 'certificacion'] as const

/** Conceptos de pago propios de la vertical de cursos. */
export const CONCEPTOS_CURSO = ['curso_mensualidad', 'curso_inscripcion', 'curso_otro'] as const
export type ConceptoCurso = (typeof CONCEPTOS_CURSO)[number]

export function esConceptoPrograma(v: unknown): v is ConceptoPrograma {
  return typeof v === 'string' && (CONCEPTOS_PROGRAMA as readonly string[]).includes(v)
}

export function esConceptoCurso(v: unknown): v is ConceptoCurso {
  return typeof v === 'string' && (CONCEPTOS_CURSO as readonly string[]).includes(v)
}

/**
 * Dos formas de decirlo:
 *  - 'titulo': para tablas, filtros, el Excel y el PDF («Mensualidad»);
 *  - 'mensaje': para el WhatsApp del recibo, dentro de una frase («tu recibo de
 *    mensualidad»; el genérico es «pago»).
 * Las del programa son EXACTAMENTE las de las copias que reemplaza.
 */
const TITULO: Readonly<Record<string, string>> = {
  inscripcion:       'Inscripción',
  mensualidad:       'Mensualidad',
  otro:              'Otro',
  cuota_semanal:     'Cuota semanal',
  certificacion:     'Certificación',
  curso_inscripcion: 'Inscripción de curso',
  curso_mensualidad: 'Mensualidad de curso',
  curso_otro:        'Otro pago de curso',
}

const MENSAJE: Readonly<Record<string, string>> = {
  inscripcion:       'inscripción',
  mensualidad:       'mensualidad',
  otro:              'pago',
  cuota_semanal:     'cuota semanal',
  certificacion:     'certificación',
  curso_inscripcion: 'inscripción del curso',
  curso_mensualidad: 'mensualidad del curso',
  // «tu recibo de pago de curso»: con «pago del curso» la frase decía «de pago de pago».
  curso_otro:        'curso',
}

/**
 * La etiqueta de un concepto. Un concepto desconocido sale tal cual (como hacían
 * las copias con `?? p.concepto`): mejor el dato crudo que una cadena vacía.
 */
export function etiquetaConcepto(
  concepto: string | null | undefined,
  forma: 'titulo' | 'mensaje' = 'titulo',
): string {
  const k = String(concepto ?? '')
  return (forma === 'mensaje' ? MENSAJE : TITULO)[k] ?? k
}

/** ¿De qué vertical es el pago? Por la FK, no por el concepto (B6/B7). */
export function verticalDePago(p: { curso_inscripcion_id?: string | null }): 'programa' | 'curso' {
  return p.curso_inscripcion_id ? 'curso' : 'programa'
}
