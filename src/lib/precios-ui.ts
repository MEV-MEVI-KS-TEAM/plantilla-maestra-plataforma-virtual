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
import { etiquetaNivel, listaConY, nivelesTexto } from '@/lib/niveles-ui'
import {
  inscripcionDe, inscripcionGeneral, inscripcionesIguales, mensualidadDe as mensualidadDeNivel,
  type PlanMinimo, type Precios,
} from './precios-nivel'

/**
 * ¿La escuela OFRECE certificación? (`CONFIG.ofreceCertificacion`, Bug 194.)
 *
 * Se compara con `!== false`, nunca por falsy: la mayoría de la flota no trae
 * la clave y para ella la respuesta es «sí», como antes de que existiera.
 *
 * 🛑 Con `false`, ninguna portada ANUNCIA certificación: ni la fila de precio de
 * la clásica, ni la línea «Certificación» de la tarjeta de nivel ni el recuadro
 * «pago único al concluir» de la animada (#165, A6). Los precios de
 * certificación siguen en el config a propósito: los leen pagos y reportes.
 */
export function escuelaCertifica(cfg: { readonly ofreceCertificacion?: unknown } = CONFIG): boolean {
  return cfg.ofreceCertificacion !== false
}

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

/**
 * El precio de cada NIVEL (mensualidad, total, inscripción y certificación)
 * vive en `precios-nivel.ts`, que es puro para que también lo importe el PDF de
 * entrega desde Node. Se reexporta aquí con las mismas firmas para que las
 * pantallas sigan importando de `@/lib/precios-ui` (Fase 2, F2-4).
 *
 * ⚠️ EN AULA RAÍZ LOS DOS NIVELES CUESTAN DISTINTO —secundaria $2,500/$1,250 y
 *    preparatoria $3,000/$1,500— así que `mensualidadDe` no es un detalle: sin
 *    el desvío al alias de secundaria, un alumno de secundaria vería $3,000 en
 *    el registro, en su estado de cuenta y en su recibo.
 */
export {
  CLAVE_INSCRIPCION_POR_NIVEL,
  CLAVE_MENSUALIDAD_POR_NIVEL,
  certificacionDe,
  inscripcionDe,
  inscripcionGeneral,
  inscripcionPropiaDe,
  inscripcionesIguales,
  mensualidadDe,
  mensualidadGeneralDe,
  mensualidadPropiaDe,
  totalPlanDe,
  varsInscripcionPorNivel,
  type NivelConPrecio,
  type PlanMinimo,
  type Precios,
} from './precios-nivel'

/**
 * Cómo nombra la landing animada la inscripción cuando la frase abarca VARIOS
 * niveles (FAQ de planes, bajada de «Programas»), Fase 2 · F2-5.
 *
 * Con las claves por nivel vacías todos los niveles pagan la general: `comun`
 * es verdad, `textoComun` es el `{inscripcion}` de siempre y `subtituloVale`
 * siempre dice que sí, así que la landing sale exactamente como antes.
 *
 * 🛑 «Iguales entre sí» NO basta para el subtítulo de fábrica («Inscripción
 *    única {inscripcion}»): `{inscripcion}` es la GENERAL, y dos niveles que
 *    pagan 1,500 cada uno con una general de 599 lo harían decir «$599».
 *
 * La usan las DOS landings. `formatear` escribe un monto > 0 con el formato
 * de cada una (la clásica lleva el código de moneda fuera de MXN); un 0 es
 * siempre «sin costo», nunca «$0».
 */
export function inscripcionEnLanding(
  niveles: readonly string[],
  precios: Precios,
  formatear: (monto: number) => string = (monto) => textoInscripcion(monto, { minusculas: true }),
) {
  const textoDe = (nivel: string) => {
    const monto = inscripcionDe(nivel, precios)
    return inscripcionRequierePago(monto) ? formatear(monto) : textoInscripcion(monto, { minusculas: true })
  }
  const comun = inscripcionesIguales(niveles, precios)
  const nivelComun = niveles[0] ?? 'preparatoria'
  const montoComun = inscripcionDe(nivelComun, precios)
  // Sin niveles (solo licenciatura o solo cursos) ninguna tarjeta afirma otra
  // cifra: el subtítulo se queda como está.
  const unicaEsGeneral = niveles.length === 0 || (comun && montoComun === inscripcionGeneral(precios))
  return {
    /** Todos los niveles pagan la misma inscripción. */
    comun,
    /** El monto común (el del primer nivel); solo significa algo si `comun`. */
    montoComun,
    /** «$599» o «sin costo»: el monto común, para usarlo a media frase. */
    textoComun: textoDe(nivelComun),
    /** La inscripción de un nivel, a media frase. */
    textoDe,
    /**
     * «de $1,000 en Secundaria y de $1,500 en Preparatoria», o «sin costo en
     * Secundaria y de $1,500 en Preparatoria»: cada nivel lleva su preposición
     * para que el 0 no salga como «de sin costo». Solo se usa si NO es común.
     */
    textoPorNivel: listaConY(niveles.map((n) =>
      `${inscripcionDe(n, precios) > 0 ? 'de ' : ''}${textoDe(n)} en ${etiquetaNivel(n)}`)),
    /**
     * ¿Se puede pintar este subtítulo? Uno que interpola `{inscripcion}` (el de
     * fábrica lo hace) solo si esa general es la que de verdad pagan todos. Uno
     * que no la usa —p. ej. con `{inscripcionSecundaria}`— no afirma una
     * inscripción única y se respeta.
     */
    subtituloVale: (subtitulo: string | undefined) => unicaEsGeneral || !(subtitulo ?? '').includes('{inscripcion}'),
  }
}

/**
 * El subtítulo de «Programas» de la landing CLÁSICA (F2-6b), sobre sus
 * tarjetas de Preparatoria y Secundaria.
 *
 * Se pinta el del admin (interpolado con `texto`) salvo que afirme una
 * inscripción única que no es la de las tarjetas (`subtituloVale`); entonces,
 * una frase por nivel. Con las claves por nivel vacías devuelve SIEMPRE
 * `texto(subtitulo)`: la portada de la flota no cambia.
 */
export function subtituloProgramasClasica(
  niveles: readonly string[],
  precios: Precios,
  subtitulo: string | undefined,
  texto: (s?: string) => string,
  formatear: (monto: number) => string,
): string {
  const ins = inscripcionEnLanding(niveles, precios, formatear)
  if (ins.subtituloVale(subtitulo)) return texto(subtitulo)
  return `Inscripción ${ins.comun ? `de ${ins.textoComun}` : ins.textoPorNivel} · Elige tu nivel y plan`
}

/**
 * La frase de mensualidades de la pregunta «¿Qué diferencia hay entre…?» de
 * la landing ANIMADA.
 *
 * - Mismas mensualidades en todos los niveles (`planesIguales`): «La
 *   mensualidad es de $2,000 al mes en … y $1,000 al mes en …, igual en
 *   Secundaria y Preparatoria.» Es la frase de siempre, byte por byte.
 * - Distintas: UNA FRASE POR NIVEL, «En Secundaria, la mensualidad es de
 *   $2,500 al mes en … y $1,250 al mes en …. En Preparatoria, la mensualidad
 *   es de …». Antes salía «La mensualidad es de en Secundaria, …» (desde que
 *   llegó la animada, 59a17d9): el «de» sobraba en SAMEX y AULA RAÍZ, que
 *   tienen la secundaria en su alias, y en toda escuela con precio por nivel.
 */
export function fraseMensualidades<P extends PlanMinimo>({
  niveles, planes, planesDe, nivelReferencia, precios, nombrePlan, dinero, planesIguales,
}: {
  niveles: readonly string[]
  /** Los planes del nivel de referencia (los de la tarjeta común). */
  planes: readonly P[]
  planesDe: (nivel: string) => readonly P[]
  nivelReferencia: string
  precios: Precios
  nombrePlan: (m: P) => string
  dinero: (monto: number) => string
  planesIguales: boolean
}): string {
  const lista = (nivel: string, ps: readonly P[]) =>
    listaConY(ps.map((m) => `${dinero(mensualidadDeNivel(nivel, m, precios))} al mes en ${nombrePlan(m)}`))
  if (planesIguales) {
    return `La mensualidad es de ${lista(nivelReferencia, planes)}${niveles.length > 1 ? `, igual en ${nivelesTexto(niveles)}` : ''}.`
  }
  // Un nivel sin planes activos (el admin apagó el único que tenía) no tiene
  // mensualidad que decir: se omite en vez de escribir «es de .».
  return niveles
    .filter((n) => planesDe(n).length > 0)
    .map((n) => `En ${etiquetaNivel(n)}, la mensualidad es de ${lista(n, planesDe(n))}.`)
    .join(' ')
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
