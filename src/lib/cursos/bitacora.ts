/**
 * Bitácora de una inscripción a curso (curso_inscripcion_eventos, B4/C3b) leída
 * para el panel: qué pasó y QUIÉN lo hizo, con nombre y rol (Bloque D · D7b).
 *
 * Desde D7b el secretario también asigna, abre y cierra: la bitácora tiene que
 * decir si fue la administración o la secretaría. Cada evento ya guarda su actor
 * (auth.uid() de quien llamó la función SQL); aquí solo se le pone nombre.
 *
 * Sin la migración B4 no hay bitácora: `ultimosMovimientos` devuelve un mapa
 * vacío y la lista de alumnos sale igual.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface MovimientoInscripcion {
  tipo: string
  meses_antes: number | null
  meses_despues: number | null
  created_at: string
  /** null = sin actor (lo hizo el sistema o un proceso con service_role). */
  actor_nombre: string | null
  /** El rol tal como está en usuarios.rol (admin, secretario…), o null. */
  actor_rol: string | null
  /** D20b: el folio, si el evento es la emisión de la constancia. */
  folio?: string | null
}

type EventoFila = {
  inscripcion_id: string
  tipo: string
  meses_antes: number | null
  meses_despues: number | null
  actor: string | null
  created_at: string
  detalle?: { folio?: unknown; actor_nombre?: unknown; actor_rol?: unknown } | null
}

/** «administración», «secretaría»; otro rol tal cual; vacío sin rol. */
export function etiquetaRolActor(rol: string | null | undefined): string {
  const r = (rol ?? '').trim().toLowerCase()
  if (r === 'admin') return 'administración'
  if (r === 'secretario') return 'secretaría'
  return r
}

/** «Ana López (secretaría)» · «Ana López» · «el sistema». */
export function quienHizo(m: Pick<MovimientoInscripcion, 'actor_nombre' | 'actor_rol'>): string {
  const nombre = (m.actor_nombre ?? '').trim()
  const rol = etiquetaRolActor(m.actor_rol)
  if (!nombre && !rol) return 'el sistema'
  if (!nombre) return rol
  return rol ? `${nombre} (${rol})` : nombre
}

/** Qué pasó, en una frase corta para la fila del alumno. */
export function describirMovimiento(m: Pick<MovimientoInscripcion, 'tipo' | 'meses_antes' | 'meses_despues'> & { folio?: string | null }): string {
  const despues = m.meses_despues ?? 0
  const antes = m.meses_antes ?? 0
  switch (m.tipo) {
    case 'abrir_mes': return `abrió el mes ${despues}`
    case 'cerrar_mes': return `cerró el mes ${antes}`
    case 'abrir_todo': return 'abrió todo el curso'
    case 'quitar_acceso_total': return 'quitó el acceso total'
    case 'inscripcion': return despues > 0 ? `asignó el curso (mes ${despues})` : 'asignó el curso'
    case 'cambio_estado': return 'cambió el estado'
    case 'constancia_emitida': return m.folio ? `emitió la constancia ${m.folio}` : 'emitió la constancia'
    default: return m.tipo
  }
}

/** Pone nombre y rol a los actores de una lista de eventos. */
export async function conActores<T extends { actor: string | null }>(
  admin: SupabaseClient,
  eventos: readonly T[],
): Promise<Array<T & { actor_nombre: string | null; actor_rol: string | null }>> {
  const ids = [...new Set(eventos.map(e => e.actor).filter((x): x is string => !!x))]
  const porId = new Map<string, { nombre: string; rol: string | null }>()
  if (ids.length > 0) {
    const { data } = await admin.from('usuarios').select('id, nombre, apellidos, rol').in('id', ids)
    for (const u of (data ?? []) as { id: string; nombre?: string | null; apellidos?: string | null; rol?: string | null }[]) {
      porId.set(u.id, { nombre: [u.nombre, u.apellidos].filter(Boolean).join(' '), rol: u.rol ?? null })
    }
  }
  return eventos.map(e => {
    const u = e.actor ? porId.get(e.actor) : undefined
    return { ...e, actor_nombre: u?.nombre || null, actor_rol: u?.rol ?? null }
  })
}

/**
 * Lee TODAS las filas de una consulta, de mil en mil (PostgREST corta cada
 * respuesta en 1000 por defecto: en un curso con mucha bitácora, los alumnos
 * con movimientos más viejos se quedaban sin su «Último:»). `null` si falla.
 * Con tope de páginas para no colgar la pantalla con una bitácora enorme.
 */
/** Cuántos ids caben en una consulta con .in() sin pasarse del largo de URL. */
const LOTE_IDS = 100

async function leerTodo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: unknown; error: unknown }>,
  maxPaginas = 20,
): Promise<T[] | null> {
  const TAM = 1000
  const out: T[] = []
  for (let p = 0; p < maxPaginas; p++) {
    const { data, error } = await pagina(p * TAM, p * TAM + TAM - 1)
    if (error || !Array.isArray(data)) return null
    out.push(...(data as T[]))
    if (data.length < TAM) break
  }
  return out
}

/**
 * El último movimiento de cada inscripción, con su actor. Mapa vacío si la base
 * no tiene bitácora (sin B4) o si falla la lectura: la lista no depende de esto.
 */
export async function ultimosMovimientos(
  admin: SupabaseClient,
  inscripcionIds: readonly string[],
): Promise<Map<string, MovimientoInscripcion>> {
  const out = new Map<string, MovimientoInscripcion>()
  if (inscripcionIds.length === 0) return out
  // Por lotes de ids: cada uno viaja en la URL (~39 caracteres) y PostgREST corta
  // las URL largas; con un curso de cientos de alumnos la consulta entera fallaba.
  const data: EventoFila[] = []
  for (let i = 0; i < inscripcionIds.length; i += LOTE_IDS) {
    const lote = inscripcionIds.slice(i, i + LOTE_IDS)
    const filas = await leerTodo<EventoFila>((desde, hasta) => admin
      .from('curso_inscripcion_eventos')
      .select('inscripcion_id, tipo, meses_antes, meses_despues, actor, created_at, detalle')
      .in('inscripcion_id', [...lote])
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(desde, hasta))
    if (!filas) return out
    data.push(...filas)
  }
  // Los lotes llegan cada uno ordenado; el último de cada inscripción está en su lote.
  const ultimos = new Map<string, EventoFila>()
  for (const e of data) if (!ultimos.has(e.inscripcion_id)) ultimos.set(e.inscripcion_id, e)
  for (const e of await conActores(admin, [...ultimos.values()])) {
    // D20b: la emisión guarda la FOTO de quién emitió (la misma que el folio y la
    // ficha); los eventos de antes no la traen y caen en el nombre de hoy.
    const foto = e.tipo === 'constancia_emitida' ? e.detalle : null
    out.set(e.inscripcion_id, {
      tipo: e.tipo, meses_antes: e.meses_antes, meses_despues: e.meses_despues, created_at: e.created_at,
      actor_nombre: typeof foto?.actor_nombre === 'string' ? foto.actor_nombre : e.actor_nombre,
      actor_rol: typeof foto?.actor_rol === 'string' ? foto.actor_rol : e.actor_rol,
      folio: e.tipo === 'constancia_emitida' && typeof e.detalle?.folio === 'string' ? e.detalle.folio : null,
    })
  }
  return out
}

// ─── «Por activar» (D8) ──────────────────────────────────────────────────────

/** Los tipos de evento que dan o quitan acceso (los mismos de las dos funciones SQL de D8). */
export const EVENTOS_DE_ACCESO = ['abrir_mes', 'cerrar_mes', 'abrir_todo', 'quitar_acceso_total'] as const

export type PorActivar = { inscripcion_id: string; alumno_id: string; curso_id: string; curso_nombre: string }

/**
 * Las inscripciones POR ACTIVAR (activa, sin acceso total, 0 meses y sin
 * eventos de acceso), de un curso o de todos. Las calcula la base
 * (curso_inscripciones_por_activar, el MISMO predicado que la función que
 * activa): así no se traen ids a la URL y no se corta en 1000 filas. `null` si
 * la base no tiene la función (sin D8) o falla: entonces no se ofrece el botón,
 * que respondería 503. Con el cliente admin (solo service_role la ejecuta).
 */
export async function porActivar(admin: SupabaseClient, cursoId?: string): Promise<PorActivar[] | null> {
  const { data, error } = await admin.rpc('curso_inscripciones_por_activar', cursoId ? { p_curso_id: cursoId } : {})
  if (error || !Array.isArray(data)) return null
  return data as PorActivar[]
}
