/**
 * Cómo se ESCRIBEN los precios de cara a la persona.
 *
 * Nació en DIDASKOMX (#205, inscripción sin costo), lo reutilizó INEDI (#207,
 * dos planes que suman casi lo mismo) y aquí gana la pieza que le faltaba:
 * distinguir «casi lo mismo» de «exactamente lo mismo».
 *
 * ── Por qué AULA RAÍZ (#208) necesita `totalesIguales` ──────────────────────
 *
 * En esta escuela los dos planes de un nivel suman el MISMO total al céntimo:
 * secundaria $499 + 3×$2,500 = $499 + 6×$1,250 = $7,999, y preparatoria $499 +
 * 3×$3,000 = $499 + 6×$1,500 = $9,499. Eso permite decir «Mismo precio total,
 * tú eliges el ritmo» y que sea literalmente verdad, que es el argumento de
 * venta del combo.
 *
 * `totalesCasiIguales` (de INEDI) no sirve para esa frase: da `true` con una
 * diferencia de hasta el 1 %, y afirmar «mismo precio» con $3 de diferencia es
 * engañoso. Son dos preguntas distintas y se responden por separado:
 *
 *   totalesIguales()      → ¿son EXACTAMENTE iguales? → «Mismo precio total»
 *   totalesCasiIguales()  → ¿difieren ≤ 1 %?          → «suman prácticamente lo mismo»
 *
 * 🛑 NINGUNA DE LAS DOS FRASES SE ESCRIBE A MANO en la landing. Se calculan de
 *    los precios, así que el día que el cliente cambie una mensualidad desde
 *    «Personalizar mi página» la frase se apaga sola en vez de quedarse
 *    mintiendo en la portada.
 * 🛑 Y ninguna se convierte en «ahorro», «descuento», «oferta» ni «precio
 *    especial»: no hay tal cosa, los dos planes cuestan lo mismo.
 *
 * ── Inscripción ─────────────────────────────────────────────────────────────
 *
 * 🛑 Una escuela que no cobra inscripción no puede mostrar «$0» —se lee como un
 *    error del sistema— ni «gratis». La fórmula es «Sin costo», y toda interfaz
 *    que nombre la inscripción pasa por `textoInscripcion()`. AULA RAÍZ cobra
 *    $499, así que aquí devuelve el monto; el camino se conserva porque es el
 *    que usan las pantallas compartidas.
 *
 * Todo lo de aquí es puro: lo importan componentes cliente, rutas de servidor y
 * las pruebas unitarias.
 */
import { CONFIG } from '@/lib/config'
import { formatearMoneda } from '@/lib/moneda'

/** ¿La inscripción cuesta algo? Con 0, vacío o un valor inválido: no. */
export function inscripcionRequierePago(monto: number | string | null | undefined): boolean {
  const n = Number(monto)
  return Number.isFinite(n) && n > 0
}

/**
 * La inscripción como texto. «Sin costo» cuando no se cobra; el monto con
 * formato de moneda cuando sí. `minusculas` es para usarla a media frase
 * («Inscripción sin costo»).
 */
export function textoInscripcion(
  monto: number | string | null | undefined,
  opciones: { minusculas?: boolean } = {},
): string {
  if (!inscripcionRequierePago(monto)) return opciones.minusculas ? 'sin costo' : 'Sin costo'
  return formatearMoneda(Number(monto), CONFIG)
}

type PreciosPlanos = Readonly<Record<string, unknown>>
type PlanMinimo = { readonly meses: number; readonly mensualidad: number | string }

const numeroPositivo = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * La mensualidad REAL de un nivel en un plan.
 *
 * `modalidades[].mensualidad` guarda una sola cifra, la de preparatoria por
 * convención de la plantilla; la de secundaria vive en
 * `precios.secundaria_<meses>meses_normal`. Leer la del plan a secas le muestra
 * a secundaria la tarifa de preparatoria (SÉNDERI #194).
 *
 * ⚠️ EN AULA RAÍZ LOS DOS NIVELES CUESTAN DISTINTO —secundaria $2,500/$1,250 y
 *    preparatoria $3,000/$1,500— así que esto no es un detalle: sin este
 *    desvío, un alumno de secundaria vería $3,000 en el registro, en su estado
 *    de cuenta y en su recibo.
 */
export function mensualidadDe(nivel: string, plan: PlanMinimo, precios: PreciosPlanos): number {
  if (nivel === 'secundaria') {
    const propia = numeroPositivo(precios[`secundaria_${plan.meses}meses_normal`])
    if (propia !== null) return propia
  }
  return Number(plan.mensualidad) || 0
}

/** Certificación por nivel (pago único al concluir, fuera del total del plan). */
export function certificacionDe(nivel: string, precios: PreciosPlanos): number {
  const claves = nivel === 'secundaria'
    ? ['certificacionSecundaria', 'certificacion_secundaria']
    : ['certificacionPreparatoria', 'certificacion_preparatoria']
  for (const clave of claves) {
    const v = numeroPositivo(precios[clave])
    if (v !== null) return v
  }
  return 0
}

/** Inscripción + todas las mensualidades del plan, para un nivel. */
export function totalPlanDe(nivel: string, plan: PlanMinimo, precios: PreciosPlanos): number {
  const inscripcion = numeroPositivo(precios.inscripcion) ?? 0
  return inscripcion + plan.meses * mensualidadDe(nivel, plan, precios)
}

/** Lo que es verdad de cada plan. 🛑 Ni «ahorro» ni «recomendado». */
export const ETIQUETA_MAS_RAPIDO = 'Terminas más rápido'
export const ETIQUETA_MENSUALIDAD_BAJA = 'Mensualidad más baja'

/**
 * ¿Los totales de los planes son EXACTAMENTE iguales?
 *
 * La pregunta que habilita «Mismo precio total, tú eliges el ritmo». En AULA
 * RAÍZ la respuesta es sí en los dos niveles ($7,999 y $9,499). Con un solo
 * plan activo devuelve `false`: no hay nada que comparar y la frase no tendría
 * sentido.
 */
export function totalesIguales(totales: readonly number[]): boolean {
  const validos = totales.filter(t => Number.isFinite(t) && t > 0)
  if (validos.length < 2) return false
  return validos.every(t => t === validos[0])
}

/**
 * ¿Los totales son PRÁCTICAMENTE iguales? (diferencia ≤ `tolerancia` del mayor).
 *
 * Para la escuela cuyos planes suman $6,393 y $6,396: puede decir «suman
 * prácticamente lo mismo». 🛑 Pero NO «mismo precio» —no es exacto— ni
 * «ahorro»: por $3 sería engañoso. Para esa frase existe `totalesIguales`.
 */
export function totalesCasiIguales(totales: readonly number[], tolerancia = 0.01): boolean {
  const validos = totales.filter(t => Number.isFinite(t) && t > 0)
  if (validos.length < 2) return false
  const max = Math.max(...validos)
  return max - Math.min(...validos) <= max * tolerancia
}

/**
 * Qué dice cada tarjeta de plan, CALCULADO de los precios.
 *
 * 🛑 No se anuncia ningún plan como ahorro ni «recomendado». Lo que sí es verdad
 *    de cada uno es lo único que se dice: el más corto termina antes y el de
 *    mensualidad menor deja la cuota más baja. Una etiqueta escrita a mano
 *    mentiría en cuanto el admin cambie un precio desde su panel; esta no.
 */
export function etiquetasPlan(
  planes: ReadonlyArray<{ id: string; meses: number; mensualidad: number }>,
): Record<string, string[]> {
  const salida: Record<string, string[]> = Object.fromEntries(planes.map(p => [p.id, [] as string[]]))
  if (planes.length < 2) return salida
  const menorMeses = Math.min(...planes.map(p => p.meses))
  const menorMensualidad = Math.min(...planes.map(p => p.mensualidad))
  const unico = <T,>(lista: T[]) => (lista.length === 1 ? lista[0] : null)
  const rapido = unico(planes.filter(p => p.meses === menorMeses))
  const barato = unico(planes.filter(p => p.mensualidad === menorMensualidad))
  if (rapido) salida[rapido.id].push(ETIQUETA_MAS_RAPIDO)
  if (barato) salida[barato.id].push(ETIQUETA_MENSUALIDAD_BAJA)
  return salida
}
