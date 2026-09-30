/**
 * #187 (Bugs 229 y 230 del PLAYBOOK) — las rutas de GESTIÓN DE ALUMNOS solo
 * operan sobre cuentas de ALUMNO.
 *
 * El hueco: las rutas de /api/admin/alumnos/[id]/… identifican al objetivo por
 * el id del path y solo revisaban el rol de QUIEN llama (verifyAdmin /
 * verifyStaff), nunca el de la cuenta objetivo. Con el id de otro admin o de un
 * secretario (GET /api/admin/usuarios lo devuelve):
 *   - DELETE …/[id]?definitivo=true le borraba su fila de `usuarios` y su cuenta
 *     de Auth (la escuela podía quedarse sin panel);
 *   - PATCH …/[id]/datos le cambiaba el CORREO DE ACCESO (bloqueo o secuestro
 *     con «olvidé mi contraseña»);
 *   - POST …/[id]/reset-password le ponía una contraseña si la cuenta tenía una
 *     fila en `alumnos` (un admin ascendido desde alumno, o una fila fabricada
 *     por PostgREST): secuestro directo.
 *
 * LA REGLA (decisión de Kevin, 30-sep-2026): esas acciones SOLO afectan a
 * usuarios con rol `alumno`. Sobre personal (cualquier otro rol) responden 403,
 * las llame el admin o el secretario. El personal se gestiona solo en
 * /admin/usuarios y solo por el admin. Nadie se da de baja, se borra ni se
 * edita a sí mismo por las rutas de alumnos.
 *
 * Se decide en el SERVIDOR, con el rol leído de la BD con el service role
 * (nunca del cuerpo ni del cliente), ANTES de cualquier escritura u operación
 * de Auth. Todas las rutas usan este mismo helper: una sola regla y una sola
 * normalización.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const MENSAJE_SOLO_ALUMNOS =
  'Esta acción solo aplica a cuentas de alumno. El personal (admin y secretario) se gestiona en Usuarios.'
export const MENSAJE_A_SI_MISMO =
  'No puedes aplicarte esta acción a ti mismo desde la gestión de alumnos.'
export const MENSAJE_NO_ENCONTRADO = 'Alumno no encontrado'
export const MENSAJE_SIN_VERIFICAR = 'No se pudo verificar la cuenta. Intenta de nuevo.'
export const MENSAJE_PERSONAL_NO_SE_REGISTRA =
  'Esta cuenta es de personal de la escuela y no se puede registrar como alumno.'

/** El rol de `usuarios` es de alumno. Cualquier otra cosa (null incluido) no lo es: falla cerrado. */
export function esRolAlumno(rol: unknown): boolean {
  return typeof rol === 'string' && rol.trim().toLowerCase() === 'alumno'
}

/**
 * Forma canónica de un UUID para compararlo: sin llaves ni guiones y en
 * minúsculas. Postgres acepta `ABC…`, `{abc…}` y sin guiones como el mismo
 * uuid, así que una comparación de cadenas exactas se salta con mayúsculas.
 */
export function uuidCanonico(id: unknown): string {
  return typeof id === 'string' ? id.trim().replace(/[{}-]/g, '').toLowerCase() : ''
}

export function mismaCuenta(a: unknown, b: unknown): boolean {
  const x = uuidCanonico(a)
  return x !== '' && x === uuidCanonico(b)
}

export interface DatosObjetivo {
  /** Hay fila en `usuarios` con ese id. */
  existeUsuario: boolean
  /** `usuarios.rol` tal como está en la BD. */
  rol: unknown
  /** Hay fila en `alumnos` con ese id. */
  tieneFilaAlumno: boolean
}

export type VeredictoObjetivo =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string }

/**
 * La regla, pura. El orden importa:
 *  1. uno mismo → 403 (aunque su rol fuera de alumno);
 *  2. personal → 403, TENGA O NO fila en `alumnos` (una fila fabricada no lo
 *     convierte en alumno);
 *  3. sin cuenta o sin fila en `alumnos` → 404;
 *  4. alumno de verdad → ok.
 */
export function veredictoObjetivoAlumno(
  actorId: string,
  objetivoId: string,
  datos: DatosObjetivo,
): VeredictoObjetivo {
  if (mismaCuenta(actorId, objetivoId)) return { ok: false, status: 403, error: MENSAJE_A_SI_MISMO }
  if (datos.existeUsuario && !esRolAlumno(datos.rol)) return { ok: false, status: 403, error: MENSAJE_SOLO_ALUMNOS }
  if (!datos.existeUsuario || !datos.tieneFilaAlumno) return { ok: false, status: 404, error: MENSAJE_NO_ENCONTRADO }
  return { ok: true }
}

export interface AlumnoObjetivo {
  /** El id TAL COMO está en la BD (minúsculas): con él se hacen las escrituras y las operaciones de Auth. */
  id: string
  email: string | null
  nombre: string | null
  apellidos: string | null
  telefono: string | null
}

export type ObjetivoCargado =
  | { ok: true; alumno: AlumnoObjetivo }
  | { ok: false; status: 403 | 404 | 500; error: string }

/**
 * Lee el objetivo con el cliente de SERVICIO (sin RLS de por medio) y aplica la
 * regla. Un id que no es UUID (22P02) no es un alumno: 404. Cualquier otro
 * error de lectura: 500 y NO se sigue (falla cerrado).
 */
export async function cargarAlumnoObjetivo(
  admin: SupabaseClient,
  objetivoId: string,
  actorId: string,
): Promise<ObjetivoCargado> {
  if (mismaCuenta(actorId, objetivoId)) return { ok: false, status: 403, error: MENSAJE_A_SI_MISMO }

  const [u, a] = await Promise.all([
    admin.from('usuarios').select('id, email, nombre, apellidos, telefono, rol').eq('id', objetivoId).maybeSingle(),
    admin.from('alumnos').select('id').eq('id', objetivoId).maybeSingle(),
  ])
  if (u.error?.code === '22P02' || a.error?.code === '22P02') {
    return { ok: false, status: 404, error: MENSAJE_NO_ENCONTRADO }
  }
  if (u.error || a.error) {
    console.error('[admin-alumno] no se pudo leer la cuenta objetivo:', (u.error ?? a.error)?.message)
    return { ok: false, status: 500, error: MENSAJE_SIN_VERIFICAR }
  }

  const usuario = u.data as (AlumnoObjetivo & { rol: unknown }) | null
  const v = veredictoObjetivoAlumno(actorId, objetivoId, {
    existeUsuario: !!usuario,
    rol: usuario?.rol,
    tieneFilaAlumno: !!a.data,
  })
  if (!v.ok) return v
  return {
    ok: true,
    alumno: {
      id: usuario!.id,
      email: usuario!.email ?? null,
      nombre: usuario!.nombre ?? null,
      apellidos: usuario!.apellidos ?? null,
      telefono: usuario!.telefono ?? null,
    },
  }
}

/**
 * Lo mismo para las rutas que reciben el id de una FILA del alumno (una
 * inscripción a un curso, un documento) en lugar del suyo: se lee su
 * `alumno_id` con el cliente de servicio y se aplica la misma regla. Sin fila
 * (o un id que no es UUID) → 404 con el mensaje de esa fila.
 */
export async function cargarAlumnoDeFila(
  admin: SupabaseClient,
  tabla: 'curso_inscripciones' | 'documentos_alumno',
  filaId: string,
  actorId: string,
  mensajeNoEncontrada: string,
): Promise<ObjetivoCargado> {
  const { data, error } = await admin.from(tabla).select('alumno_id').eq('id', filaId).maybeSingle()
  if (error?.code === '22P02' || (!error && !data)) return { ok: false, status: 404, error: mensajeNoEncontrada }
  if (error) {
    console.error(`[admin-alumno] no se pudo leer ${tabla}:`, error.message)
    return { ok: false, status: 500, error: MENSAJE_SIN_VERIFICAR }
  }
  const alumnoId = (data as { alumno_id?: unknown }).alumno_id
  if (typeof alumnoId !== 'string' || !alumnoId) return { ok: false, status: 404, error: mensajeNoEncontrada }
  return cargarAlumnoObjetivo(admin, alumnoId, actorId)
}

/** La respuesta HTTP de un objetivo que no pasa la regla. */
export function respuestaObjetivo(r: { status: number; error: string }): NextResponse {
  return NextResponse.json({ error: r.error }, { status: r.status })
}
