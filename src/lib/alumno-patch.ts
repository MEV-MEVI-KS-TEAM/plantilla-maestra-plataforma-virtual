/**
 * Qué puede cambiar cada rol con PATCH /api/admin/alumnos/[id] — Bloque D · D21a.
 *
 * Ese PATCH escribe UN solo dato: `contactado_whatsapp` (la pestaña «Pendientes
 * de contactar»). Desde D21a lo hace también el SECRETARIO, porque contactar a
 * quien se registró es tarea de recepción (decisión de Kevin, 27-sep-2026).
 *
 * La regla del secretario es una LISTA BLANCA: si el cuerpo trae CUALQUIER otra
 * clave (plan, nivel, meses, activo, rol, datos…), se rechaza con 403 antes de
 * escribir nada, aunque también traiga `contactado_whatsapp`. Así, si mañana el
 * admin gana otro campo en este PATCH, el secretario no lo hereda sin querer.
 * El admin conserva lo de siempre: se aplica `contactado_whatsapp` y lo demás se
 * ignora. El plan, los datos, el estado, la inscripción, las notas y la
 * contraseña viven en otras rutas, y todas siguen siendo solo del admin.
 *
 * La base no cambia: la política UPDATE de `alumnos` sigue en es_admin() y el
 * REVOKE UPDATE a authenticated sigue en pie; la ruta escribe con service_role.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getUserRol } from '@/lib/supabase/verify-admin'

/** Lo único que el secretario puede mandar en este PATCH. */
export const CAMPOS_PATCH_SECRETARIO = ['contactado_whatsapp'] as const

export const MENSAJE_SOLO_CONTACTADO = 'El secretario solo puede marcar si el alumno fue contactado.'

export type ReglaPatchAlumno =
  | { ok: true; updates: { contactado_whatsapp: boolean } }
  | { ok: false; status: 400 | 403; error: string }

/** Rol normalizado (ADMIN / SECRETARIO / …) de quien llama, o null. */
export function rolDeQuienEdita(supabase: SupabaseClient, userId: string): Promise<string | null> {
  return getUserRol(supabase, userId)
}

/** ¿Es personal de la escuela? (admin o secretario). */
export function esPersonal(rol: string | null | undefined): boolean {
  const r = (rol ?? '').trim().toUpperCase()
  return r === 'ADMIN' || r === 'SECRETARIO'
}

/**
 * La regla completa, pura (sin base de datos), para poder probarla a fondo.
 * `cuerpo` es lo que devolvió `request.json()`.
 */
export function reglaPatchAlumno(rol: string | null | undefined, cuerpo: unknown): ReglaPatchAlumno {
  const r = (rol ?? '').trim().toUpperCase()
  if (r !== 'ADMIN' && r !== 'SECRETARIO') return { ok: false, status: 403, error: 'Acceso denegado' }
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return { ok: false, status: 400, error: 'Cuerpo inválido: se esperaba un objeto JSON' }
  }
  const b = cuerpo as Record<string, unknown>
  if (r === 'SECRETARIO') {
    const permitidas: readonly string[] = CAMPOS_PATCH_SECRETARIO
    // Object.keys ve las claves PROPIAS, también «__proto__» cuando viene de JSON.parse.
    if (Object.keys(b).some(k => !permitidas.includes(k))) {
      return { ok: false, status: 403, error: MENSAJE_SOLO_CONTACTADO }
    }
  }
  if (typeof b.contactado_whatsapp !== 'boolean') {
    return { ok: false, status: 400, error: 'No hay campos para actualizar' }
  }
  return { ok: true, updates: { contactado_whatsapp: b.contactado_whatsapp } }
}
