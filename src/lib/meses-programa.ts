// ─── Abrir y cerrar mes del PROGRAMA (Bloque D · D20a, remate c) ──────────────
// Las rutas /api/admin/alumnos/[id]/desbloquear-mes y /cerrar-mes escriben por
// public.alumno_mover_mes() (migración 20260928120000): un solo escritor, con
// candado de fila, idempotente por `operacion_id` y con bitácora
// (alumno_mes_eventos: acción, mes, antes → después, actor y fecha).
// Aquí vive lo puro: el cuerpo de la petición, el mapeo de errores y el texto
// «Último: …» de la ficha. Sin `server-only`: lo importan la ficha y las pruebas.

export type AccionMes = 'abrir' | 'cerrar'

/** Un evento de la bitácora, como lo devuelve el GET de la ficha. */
export interface EventoMes {
  accion: AccionMes
  mes: number
  antes: number
  despues: number
  actor_nombre: string | null
  actor_rol: string | null
  created_at: string
}

/** Lo que la RPC devuelve (una fila). */
export interface FilaMoverMes {
  meses_ahora: number
  mes_movido: number
  meses_antes: number
  repetido: boolean
  quien: string | null
  quien_rol: string | null
  cuando: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * El cuerpo que manda la ficha: lo que vio (`antes`) y el id de la operación
 * (uno por apertura del modal). Una ficha vieja (caché) no los manda: la ruta
 * usa entonces lo que lee de la base y un id nuevo — sin protección de doble
 * clic para esa pestaña, pero con bitácora.
 */
export function leerCuerpoMes(body: unknown): { antes: number | null; operacionId: string | null } {
  const b = (typeof body === 'object' && body !== null && !Array.isArray(body) ? body : {}) as Record<string, unknown>
  const antes = typeof b.antes === 'number' && Number.isInteger(b.antes) && b.antes >= 0 && b.antes <= 600 ? b.antes : null
  const operacionId = typeof b.operacion_id === 'string' && UUID_RE.test(b.operacion_id) ? b.operacion_id : null
  return { antes, operacionId }
}

type ErrorPg = { code?: string | null; message?: string | null } | null | undefined

/** La base no tiene la migración D20a (la RPC no existe): la ruta degrada al UPDATE condicionado. */
export function sinRpcMes(error: ErrorPg): boolean {
  return error?.code === 'PGRST202' || error?.code === '42883'
}

/** La tabla de la bitácora no existe (base sin D20a): la ficha no pinta «Último: …». */
export function faltaBitacoraMes(error: ErrorPg): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}

/**
 * Error de alumno_mover_mes → respuesta HTTP. Los mensajes de la función están
 * escritos para el personal de la escuela y se muestran tal cual; cualquier
 * otro error se registra y sale genérico.
 */
export function errorRpcMes(error: ErrorPg): { status: number; mensaje: string } {
  const msg = error?.message ?? ''
  switch (error?.code) {
    case '42501': return { status: 403, mensaje: msg || 'Solo el personal de la escuela puede abrir o cerrar meses.' }
    // PT409: el alumno cambió en medio (la función NO usa 40001: PostgREST lo reintenta sin fin).
    case 'PT409':
    case '40001': return { status: 409, mensaje: msg || 'El alumno cambió mientras tanto. Recarga la ficha y vuelve a intentarlo.' }
    case '22023': return { status: 400, mensaje: msg || 'No se pudo mover el mes.' }
    case 'P0002': return { status: 404, mensaje: 'Alumno no encontrado' }
    default:      return { status: 500, mensaje: 'No se pudo mover el mes. Intenta de nuevo.' }
  }
}

/** El mensaje de la ruta sin la RPC cuando el UPDATE condicionado no tocó nada. */
export const AVISO_CAMBIO_EN_MEDIO = 'El alumno cambió mientras tanto. Recarga la ficha y vuelve a intentarlo.'

/** Rol guardado (en minúsculas) → como se lee en la ficha. */
export function etiquetaRol(rol: string | null | undefined): string {
  const r = (rol ?? '').trim().toLowerCase()
  if (r === 'admin') return 'Administrador'
  if (r === 'secretario') return 'Secretario'
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : ''
}

/** Fecha y hora cortas en español de México (la zona es la del navegador). */
export function fechaHoraCorta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * «Último: abrió el mes 3 (2 → 3) · 26 sep 2026, 10:42 · María López (Secretario)».
 * `fmt` se inyecta para que la prueba no dependa de la zona horaria.
 */
export function textoUltimoMes(ev: EventoMes, fmt: (iso: string) => string = fechaHoraCorta): string {
  const verbo = ev.accion === 'abrir' ? 'abrió' : 'quitó'
  const partes = [`Último: ${verbo} el mes ${ev.mes} (${ev.antes} → ${ev.despues})`]
  const cuando = fmt(ev.created_at)
  if (cuando) partes.push(cuando)
  const nombre = (ev.actor_nombre ?? '').trim()
  const rol = etiquetaRol(ev.actor_rol)
  if (nombre) partes.push(rol ? `${nombre} (${rol})` : nombre)
  else if (rol) partes.push(rol)
  return partes.join(' · ')
}

/** Id de una operación (uno por apertura del modal). */
export function nuevoIdOperacion(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Navegadores viejos sin randomUUID (o http sin contexto seguro): v4 a mano.
  const b = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
