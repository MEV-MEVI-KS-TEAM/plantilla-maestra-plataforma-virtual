import { randomInt } from 'crypto'
import { CONFIG } from '@/lib/config'

/**
 * Folio verificable de las constancias.
 *
 * QUÉ ESTABA MAL
 * --------------
 * El folio se fabricaba en el NAVEGADOR con `Math.random()` dentro del
 * `useEffect` de la página, y no se guardaba en ningún lado. Es decir: cambiaba
 * cada vez que el alumno abría su constancia. Dos impresiones del mismo alumno
 * salían con folios distintos y ninguno correspondía a nada. El pie decía
 * «para verificar su autenticidad, contacte a administración» sin que hubiera
 * nada contra qué verificar.
 *
 * CÓMO QUEDA
 * ----------
 * El folio lo emite el SERVIDOR una sola vez por alumno, se guarda en la tabla
 * `constancias` (que ya existía en el esquema, sin usarse) y a partir de ahí es
 * el mismo para siempre. Eso es lo que hace posible la página pública /validar.
 *
 * 🛑 EL FOLIO NO ES SECUENCIAL A PROPÓSITO. La página de validación es pública:
 * con folios correlativos cualquiera podría teclear <PREFIJO>-2026-000001, 000002,
 * 000003… y sacar el nombre y el programa de todos los alumnos de la escuela.
 * Con 6 dígitos aleatorios criptográficos el espacio es lo bastante grande para
 * que enumerar no sea práctico, y la unicidad la garantiza el índice UNIQUE de
 * la columna, no la suerte: si dos coinciden, se reintenta.
 */

const INTENTOS_MAX = 5

function nuevoFolio(): string {
  const prefijo = (CONFIG.prefijoMatricula ?? 'MEV').toUpperCase()
  const anio = new Date().getFullYear()
  // randomInt de node:crypto, no Math.random: el folio es la credencial que
  // hace verificable el documento, no debe ser adivinable.
  const n = randomInt(0, 1_000_000).toString().padStart(6, '0')
  return `${prefijo}-${anio}-${n}`
}

type ClienteDb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (tabla: string) => any
}

/**
 * Devuelve el folio del alumno, emitiéndolo si aún no tiene.
 *
 * Idempotente: dos llamadas simultáneas no crean dos folios. Si el INSERT
 * choca con el UNIQUE por una carrera entre peticiones, se vuelve a leer y se
 * devuelve el que ganó.
 *
 * Se consulta la constancia GENERAL del alumno (`materia_id IS NULL`): la
 * tabla admite también constancias por materia, que son otra cosa.
 */
export async function obtenerOEmitirFolio(
  db: ClienteDb,
  alumnoId: string,
): Promise<string | null> {
  const leer = async (): Promise<string | null> => {
    const { data } = await db
      .from('constancias')
      .select('folio')
      .eq('alumno_id', alumnoId)
      .is('materia_id', null)
      .order('fecha_emision', { ascending: true })
      .limit(1)
      .maybeSingle()
    return (data as { folio?: string } | null)?.folio ?? null
  }

  const existente = await leer()
  if (existente) return existente

  for (let intento = 0; intento < INTENTOS_MAX; intento++) {
    const folio = nuevoFolio()
    const { error } = await db
      .from('constancias')
      .insert({ alumno_id: alumnoId, folio })

    if (!error) return folio

    // 23505 = unique_violation. Puede ser el folio (mala suerte) o que otra
    // petición emitió la constancia de este alumno primero: en ese caso el
    // folio bueno ya está en la tabla y hay que devolver ese, no uno nuevo.
    const yaEmitido = await leer()
    if (yaEmitido) return yaEmitido

    if (!`${error.code ?? ''}`.includes('23505')) {
      console.error('[constancia-folio] no se pudo emitir:', error.message)
      return null
    }
  }

  console.error('[constancia-folio] agotados los intentos de folio único')
  return null
}
