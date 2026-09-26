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

/**
 * Los de curso que se LEEN: los de arriba más el pago único (`curso_pago_unico`,
 * decisión 2), que escribe el cobro por la ficha (D16). `CONCEPTOS_CURSO` sigue
 * siendo la lista del escritor viejo (B3) y su prueba de paridad con el SQL.
 */
export const CONCEPTOS_CURSO_LECTURA = [...CONCEPTOS_CURSO, 'curso_pago_unico'] as const

/** Todo concepto que puede tener una fila de `pagos` (el filtro de /admin/pagos). */
export const CONCEPTOS_LECTURA = [...CONCEPTOS_PROGRAMA_LECTURA, ...CONCEPTOS_CURSO_LECTURA] as const

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
  curso_pago_unico:  'Pago único de curso',
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
  curso_pago_unico:  'pago único del curso',
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

/** Un pago con su curso, ya aplanado (ver lib/pagos/con-curso.ts). */
export type PagoConCurso = {
  curso_inscripcion_id?: string | null
  curso_nombre?: string | null
  curso_tipo?: string | null
  mes_desbloqueado?: number | null
}

/**
 * «Aplica a» (D14, #207-3): «Programa» o el curso, con su tipo. Por la FK: un
 * pago con `curso_inscripcion_id` es del curso aunque su concepto diga otra cosa.
 */
export function aplicaA(p: PagoConCurso): string {
  const v = etiquetaVertical(p)
  return p.curso_inscripcion_id && p.curso_nombre ? `${v} «${p.curso_nombre}»` : v
}

/** La vertical dicha: «Programa», «Curso» o «Diplomado» (por `cursos.tipo`). */
export function etiquetaVertical(p: PagoConCurso): 'Programa' | 'Curso' | 'Diplomado' {
  if (!p.curso_inscripcion_id) return 'Programa'
  return p.curso_tipo === 'diplomado' ? 'Diplomado' : 'Curso'
}

/**
 * «Mes que cubre» (decisión 5): `mes_desbloqueado` es el mes que el pago CUBRE,
 * en las dos verticales. En un curso se dice que es del curso («mes 2 del
 * curso»), para no confundirlo con el mes 2 del programa.
 */
export function mesQueCubre(p: PagoConCurso): string {
  if (p.mes_desbloqueado == null) return '—'
  return p.curso_inscripcion_id ? `mes ${p.mes_desbloqueado} del curso` : String(p.mes_desbloqueado)
}

/**
 * El concepto del RECIBO (D15, #207-4). Del programa, EXACTAMENTE el de antes
 * («Mensualidad — Mes 2»). De un curso, con su nombre y lo que cubre:
 * «Curso «EXANI-II» · pago único», «Curso «EXANI-II» · mensualidad, mes 2 del
 * curso». Sin nombre legible, la vertical sola («Curso · inscripción»).
 */
export function conceptoDeRecibo(p: PagoConCurso & { concepto?: string | null }): string {
  const concepto = p.concepto ?? 'mensualidad'
  if (!p.curso_inscripcion_id) {
    const e = etiquetaConcepto(concepto)
    return p.mes_desbloqueado ? `${e} — Mes ${p.mes_desbloqueado}` : e
  }
  const detalle =
    concepto === 'curso_mensualidad' ? (p.mes_desbloqueado ? `mensualidad, mes ${p.mes_desbloqueado} del curso` : 'mensualidad')
    : concepto === 'curso_pago_unico' ? 'pago único'
    : concepto === 'curso_inscripcion' ? 'inscripción'
    : concepto === 'curso_otro' ? 'otro pago'
    : etiquetaConcepto(concepto)
  return `${aplicaA(p)} · ${detalle}`
}

/**
 * Lo mismo, dentro de la frase del WhatsApp («tu recibo de …»). Del programa,
 * la forma 'mensaje' de siempre; de un curso, con su nombre.
 */
export function conceptoMensajeRecibo(p: PagoConCurso & { concepto?: string | null }): string {
  const base = etiquetaConcepto(p.concepto ?? 'mensualidad', 'mensaje')
  return p.curso_inscripcion_id && p.curso_nombre ? `${base} «${p.curso_nombre}»` : base
}

/** Los totales partidos por vertical (la ficha, /admin/pagos). */
export function totalesPorVertical(pagos: ReadonlyArray<{ monto: number | string | null; curso_inscripcion_id?: string | null }>): {
  total: number; programa: number; cursos: number
} {
  let programa = 0, cursos = 0
  for (const p of pagos) {
    const m = Number(p.monto ?? 0)
    if (!Number.isFinite(m)) continue
    if (p.curso_inscripcion_id) cursos += m
    else programa += m
  }
  return { total: programa + cursos, programa, cursos }
}
