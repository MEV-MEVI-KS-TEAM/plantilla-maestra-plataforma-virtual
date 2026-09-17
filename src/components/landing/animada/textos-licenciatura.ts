/**
 * Lo que la sección de Licenciaturas afirma CON CIFRAS.
 *
 * Vive fuera del componente para poder probarlo. Toda frase con un número sale
 * del desglose que calcula `getDesglosesLicenciatura()`: si mañana cambia un
 * precio en `CONFIG.licenciaturas`, la portada y sus preguntas frecuentes
 * cambian con él y ninguna queda afirmando algo que ya no es cierto.
 *
 * ⚠️ Lo que no está confirmado no se afirma: por ejemplo, CUÁNDO se paga la
 *    titulación. Si una escuela lo confirma, va a sus preguntas frecuentes.
 * 🛑 Nunca la palabra del periodo de cuatro meses: se habla de materias y meses.
 */
import { getTotalComunLicenciatura, type DesgloseLicenciatura } from '@/lib/licenciatura-utils'

type Dinero = (n: number) => string

export type PreguntaLicenciatura = { q: string; a: string }

/** «12 o 18» · «6, 12 o 18». */
export function unirConO(xs: readonly string[]): string {
  if (xs.length <= 1) return xs[0] ?? ''
  return `${xs.slice(0, -1).join(', ')} o ${xs[xs.length - 1]}`
}

/** «A y B» · «A, B y C». */
export function unirConY(xs: readonly string[]): string {
  if (xs.length <= 1) return xs[0] ?? ''
  return `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`
}

/** «Licenciatura Ejecutiva» → «Licenciaturas Ejecutivas», para el título con varias carreras. */
export function pluralEtiqueta(etiqueta: string): string {
  return etiqueta
    .split(' ')
    .map(w => (/[aeiouáéíóú]$/i.test(w) ? `${w}s` : w))
    .join(' ')
}

export type ComparacionPlanes = {
  /** El plan más corto: el de mensualidad más alta y total más bajo. */
  corto: DesgloseLicenciatura
  /** Los demás, de menor a mayor duración, con su diferencia frente al corto. */
  largos: Array<{ plan: DesgloseLicenciatura; menosAlMes: number; masEnTotal: number }>
}

/**
 * Lo que el prospecto no ve a simple vista: mientras más largo el plan, MENOS
 * paga al mes y MÁS paga en total (por ejemplo, +$2,400 a 12 meses y +$3,900 a 18
 * frente al de 6). `null` si los planes no guardan EXACTAMENTE esa relación en
 * toda la escalera —por ejemplo, el día que dos totales coincidan—, para que la
 * frase desaparezca en vez de quedar mintiendo.
 */
export function comparacionPlanes(planes: readonly DesgloseLicenciatura[]): ComparacionPlanes | null {
  if (planes.length < 2) return null
  const orden = [...planes].sort((a, b) => a.meses - b.meses)
  for (let i = 1; i < orden.length; i++) {
    const [antes, ahora] = [orden[i - 1], orden[i]]
    if (!(ahora.meses > antes.meses && ahora.mensualidad < antes.mensualidad && ahora.total > antes.total)) return null
  }
  const corto = orden[0]
  return {
    corto,
    largos: orden.slice(1).map(plan => ({
      plan, menosAlMes: corto.mensualidad - plan.mensualidad, masEnTotal: plan.total - corto.total,
    })),
  }
}

/** «el de 12 meses suma $2,400 más y el de 18 meses $3,900 más». */
export function diferenciasTexto(c: ComparacionPlanes, fmt: Dinero): string {
  return unirConY(c.largos.map((l, i) =>
    i === 0 ? `el de ${l.plan.meses} meses suma ${fmt(l.masEnTotal)} más` : `el de ${l.plan.meses} meses ${fmt(l.masEnTotal)} más`))
}

/**
 * ¿La titulación pesa más que la colegiatura en TODOS los planes? Solo entonces
 * se dice «es la parte más grande de tu inversión» (56–70 % en los clientes medidos).
 */
export function titulacionEsLaMayor(planes: readonly DesgloseLicenciatura[]): boolean {
  return planes.length > 0 && planes.every(p => p.titulacion > p.colegiatura && p.titulacion > p.inscripcion)
}

/** Las preguntas frecuentes del add-on, con las cifras del config. */
export function preguntasLicenciatura(
  planes: readonly DesgloseLicenciatura[],
  carreras: readonly { nombre: string }[],
  fmt: Dinero,
): PreguntaLicenciatura[] {
  if (planes.length === 0 || carreras.length === 0) return []
  const ritmos = unirConO(planes.map(p => String(p.meses)))
  const { titulacion } = planes[0]
  const comparacion = comparacionPlanes(planes)
  const totalComun = getTotalComunLicenciatura(planes)
  const juntas = carreras.length === 2 ? ', ambas' : carreras.length > 2 ? ', todas' : ','

  const preguntas: Array<PreguntaLicenciatura | null> = [
    {
      q: carreras.length === 1 ? '¿Qué licenciatura ofrecen?' : '¿Qué licenciaturas ofrecen?',
      a: `${unirConY(carreras.map(c => c.nombre))}${juntas} 100% en línea, con planes de ${ritmos} meses.`,
    },
    {
      q: '¿Cuánto cuesta una licenciatura en total?',
      a: planes
        .map(p => `Plan de ${p.meses} meses: ${fmt(p.inscripcion)} de inscripción + ${p.meses} mensualidades de ${fmt(p.mensualidad)} + ${fmt(p.titulacion)} de titulación = ${fmt(p.total)}.`)
        .join(' '),
    },
    comparacion
      ? {
          q: '¿Qué plan de licenciatura me conviene?',
          a: `Mientras más largo el plan, más baja la mensualidad pero más alto el total: frente al plan de ${comparacion.corto.meses} meses, ${diferenciasTexto(comparacion, fmt)}. Si puedes sostener los ${fmt(comparacion.corto.mensualidad)} al mes, terminas antes y pagas menos en total; si prefieres holgura mes a mes, los planes largos te la dan.`,
        }
      : totalComun !== null
        ? {
            q: '¿Qué plan de licenciatura me conviene?',
            a: `Los planes cuestan lo mismo en total (${fmt(totalComun)}): lo que cambia es cuánto pagas cada mes y en cuánto tiempo terminas.`,
          }
        : null,
    {
      q: `¿Por qué la titulación cuesta ${fmt(titulacion)}?`,
      a: `Porque incluye el trámite completo y toda la gestión administrativa hasta que tengas tu título y tu cédula profesional.${
        titulacionEsLaMayor(planes)
          ? ' Es la parte más grande de tu inversión y por eso la publicamos con todas sus letras, en lugar de dejarla en letra chica.'
          : ''
      }`,
    },
    {
      q: `¿El plan de ${planes.slice().sort((a, b) => a.meses - b.meses)[0].meses} meses tiene las mismas materias?`,
      a: `Sí. Las materias de tu carrera son las mismas en los ${planes.length === 2 ? 'dos' : planes.length === 3 ? 'tres' : planes.length} planes; lo que cambia es el ritmo: en el plan más corto avanzas más materias cada mes.`,
    },
  ]
  return preguntas.filter((x): x is PreguntaLicenciatura => x !== null)
}
