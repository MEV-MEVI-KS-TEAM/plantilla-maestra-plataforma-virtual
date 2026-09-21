import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Rol del usuario, leído SIEMPRE con el service role.
 *
 * ⚠️ POR QUÉ NO SE LEE CON LA SESIÓN DEL USUARIO.
 *
 * Hasta el 21-sep-2026 cada endpoint de administración comprobaba el rol así:
 *
 *     const supabase = await createClient()      // cliente CON la sesión
 *     const { data } = await supabase.from('usuarios').select('rol')…
 *
 * es decir, una lectura sujeta a RLS, mientras el resto de la operación ya usaba
 * el service role. Si esa única consulta fallaba por algo transitorio —un token
 * en plena renovación, una cookie que todavía no se refresca, un corte de red—
 * `data` llegaba vacío, el guard concluía «no es admin» y el endpoint respondía
 * 403 o 404 a un administrador legítimo. Al recargar la página funcionaba.
 *
 * Executive Vertex Education reportó los tres síntomas por separado, sin saber
 * que eran el mismo defecto: «Error al cargar alumnos», «Alumno no encontrado»
 * y «Acceso denegado» al abrir el Mes 1 de un alumno. Su cuenta tenía
 * `rol = 'admin'` correctamente asignado en la base.
 *
 * 🛑 ESTO NO DEBILITA LA SEGURIDAD. Quien llama sigue obligado a presentar una
 * sesión válida: el endpoint hace `getUser()` ANTES y responde 401 si no hay
 * usuario. Lo único que cambia es que, una vez comprobado QUIÉN llama, la
 * consulta de su rol ya no puede quedar bloqueada por una política de RLS.
 */
async function rolDe(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single()
  return (data?.rol as string | undefined)?.toUpperCase() ?? null
}

/** true si el usuario es administrador. Para operaciones de escritura. */
export async function esAdmin(userId: string): Promise<boolean> {
  return (await rolDe(userId)) === 'ADMIN'
}

/**
 * true si el usuario es ADMIN o SECRETARIO.
 *
 * El secretario registra pagos y consulta alumnos; NO abre ni cierra meses, no
 * reinicia contraseñas y no ve notas internas ni documentos. Cada endpoint que
 * use este helper debe seguir distinguiendo los dos roles donde corresponda.
 */
export async function esStaff(userId: string): Promise<boolean> {
  const rol = await rolDe(userId)
  return rol === 'ADMIN' || rol === 'SECRETARIO'
}

/** El rol en mayúsculas, para los endpoints que necesitan distinguirlos. */
export async function rolStaff(userId: string): Promise<string | null> {
  return rolDe(userId)
}
