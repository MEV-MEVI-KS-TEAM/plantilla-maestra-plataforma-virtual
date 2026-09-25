import { NextResponse } from 'next/server'

/**
 * Guarda compartida de las acciones del admin sobre UN alumno por id
 * (editar sus datos, darlo de baja, borrarlo definitivamente).
 *
 * 🛑 POR QUÉ EXISTE: los endpoints `/api/admin/alumnos/[id]/*` reciben el id por
 * la URL y operan con `service_role`. Sin esta guarda, el mismo endpoint servía
 * para tocar la cuenta de OTRO admin o de un secretario:
 *   - `DELETE ?definitivo=true` borraba su fila de `usuarios` y su cuenta de
 *     Auth (el delete de `alumnos` no encuentra fila, no da error, y sigue);
 *   - `PATCH …/datos` le cambiaba el correo de acceso = secuestro de la cuenta.
 * Lo encontró la Fase 2 de MEDERI (sep-2026). Aquí se exige que el id tenga
 * fila en `alumnos` Y rol 'alumno' en `usuarios`, antes de tocar nada.
 */

export type UsuarioObjetivo = {
  id: string
  email: string | null
  nombre: string | null
  apellidos: string | null
  telefono: string | null
  rol: string | null
}

export type VeredictoObjetivo =
  | { ok: true }
  | { ok: false; status: 404 | 403; error: string }

/**
 * Regla pura (sin BD): ¿el id apuntado es un alumno sobre el que el admin
 * puede actuar? Se separa para poder probarla sin Supabase.
 */
export function veredictoObjetivoAlumno(
  usuario: Pick<UsuarioObjetivo, 'rol'> | null | undefined,
  tieneFilaAlumno: boolean,
): VeredictoObjetivo {
  if (!usuario || !tieneFilaAlumno) {
    return { ok: false, status: 404, error: 'Alumno no encontrado' }
  }
  if ((usuario.rol ?? '').toLowerCase() !== 'alumno') {
    return { ok: false, status: 403, error: 'Esta acción solo aplica a cuentas de alumno.' }
  }
  return { ok: true }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteDb = { from(table: string): any }

/**
 * Carga la cuenta apuntada y aplica `veredictoObjetivoAlumno`. Devuelve el
 * usuario (para revertir/registrar) o la respuesta de error lista para
 * devolver.
 */
export async function cargarAlumnoObjetivo(
  admin: ClienteDb,
  id: string,
): Promise<{ usuario: UsuarioObjetivo } | { error: NextResponse }> {
  const [{ data: usuario }, { data: alumno }] = await Promise.all([
    admin.from('usuarios').select('id, email, nombre, apellidos, telefono, rol').eq('id', id).maybeSingle(),
    admin.from('alumnos').select('id').eq('id', id).maybeSingle(),
  ])
  const u = (usuario ?? null) as UsuarioObjetivo | null
  const veredicto = veredictoObjetivoAlumno(u, !!alumno)
  if (!veredicto.ok) {
    return { error: NextResponse.json({ error: veredicto.error }, { status: veredicto.status }) }
  }
  return { usuario: u as UsuarioObjetivo }
}
