/**
 * Alta de un alumno desde el panel (POST /api/admin/alumnos) — Bloque D · D21a.
 *
 * Desde D21a la da el PERSONAL: el administrador y el secretario (decisión de
 * Kevin, 27-sep-2026, que amplía la Dec. 6). Por eso lo que esta ruta escribe en
 * Auth y en `usuarios` sale de aquí y de ningún otro lado:
 *
 *  - la cuenta de Auth lleva EXACTAMENTE correo, contraseña y la confirmación.
 *    Sin `user_metadata` ni `app_metadata`: nada que un trigger o una lectura
 *    futura pudiera tomar como rol;
 *  - la fila de `usuarios` lleva el rol ROL_ALTA ('alumno'), una constante. El
 *    `rol` que venga en el cuerpo (o cualquier otra clave) se IGNORA: el alta no
 *    es una puerta para crear personal (eso es /api/admin/usuarios, solo admin).
 *
 * Las funciones leen el cuerpo campo por campo y nunca lo esparcen (`...body`):
 * una clave nueva en el formulario no llega a la base sin pasar por aquí.
 */

/** El único rol que puede salir de un alta de alumno, la dé quien la dé. */
export const ROL_ALTA = 'alumno' as const

/** La misma forma de correo que ya pide «Editar datos» (…/datos). */
const FORMA_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Correo tal como se guarda: sin espacios alrededor y en minúsculas, igual que
 * …/datos y /api/admin/usuarios. `null` si no parece un correo: no se crea una
 * cuenta YA CONFIRMADA con un correo que nadie podrá usar para entrar.
 */
export function normalizarCorreoAlta(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const correo = valor.trim().toLowerCase()
  return FORMA_CORREO.test(correo) ? correo : null
}

export type DatosAlta = {
  nombre: string
  apellidos: string
  /** Normalizado; null si falta o no tiene forma de correo. */
  email: string | null
  password: string
  telefono: string | null
}

/**
 * Lo único del cuerpo que va a Auth y a `usuarios`. `nombre_completo` se parte en
 * nombre (la primera palabra) y apellidos (el resto), como hacía la ruta.
 */
export function datosAltaDesdeCuerpo(cuerpo: unknown): DatosAlta {
  const b = (cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo) ? cuerpo : {}) as Record<string, unknown>
  const partes = typeof b.nombre_completo === 'string' ? b.nombre_completo.trim().split(/\s+/).filter(Boolean) : []
  const telefono = typeof b.telefono === 'string' && b.telefono.trim() ? b.telefono.trim() : null
  return {
    nombre: partes[0] ?? '',
    apellidos: partes.slice(1).join(' '),
    email: normalizarCorreoAlta(b.email),
    password: typeof b.password === 'string' ? b.password : '',
    telefono,
  }
}

/** Lo que recibe `admin.auth.admin.createUser`: exactamente tres claves. */
export function opcionesAuthAlta(email: string, password: string): { email: string; password: string; email_confirm: true } {
  return { email, password, email_confirm: true }
}

/** La fila de `usuarios` del alumno nuevo. El rol es SIEMPRE ROL_ALTA. */
export function filaUsuarioAlta(id: string, d: Pick<DatosAlta, 'nombre' | 'apellidos' | 'telefono'> & { email: string }) {
  return { id, nombre: d.nombre, apellidos: d.apellidos, email: d.email, telefono: d.telefono, rol: ROL_ALTA }
}

/**
 * ¿Se deshace el alta? Solo un alumno DE CURSO ('diplomado') al que no se le pudo
 * inscribir NINGÚN curso: quedaría «de curso sin curso», sin nada que ver y con
 * `nivel` write-once (p. ej. una base sin la migración D7b, donde el secretario
 * no puede inscribir). Aplica a los dos roles. Un alumno del programa escolar no
 * se deshace: su alta vale aunque falle algún curso marcado.
 */
export function revertirAltaSinCursos(nivelFinal: string | null | undefined, cursosAsignados: number): boolean {
  return nivelFinal === 'diplomado' && cursosAsignados === 0
}
