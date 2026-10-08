/**
 * Normaliza filas de `documentos_alumno` entre schema IVS (legacy) y el modelo del panel admin.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type DocEstadoAdmin = 'pendiente' | 'aprobado' | 'rechazado'

export type AdminDocumentoListItem = {
  id: string
  alumno_id: string
  tipo: string
  nombre_archivo: string
  estado: DocEstadoAdmin
  comentario_admin: string | null
  subido_en: string
  url: string | null
}

export function mapDocumentoAlumnoRow(row: Record<string, unknown>): AdminDocumentoListItem {
  const id = String(row.id ?? '')
  const alumno_id = String(row.alumno_id ?? '')
  const tipo = String(row.tipo ?? row.tipo_documento ?? 'curp')
  const nombre_archivo = String(row.nombre_archivo ?? 'archivo.pdf')
  const url =
    row.url != null && String(row.url).trim() !== ''
      ? String(row.url)
      : row.url_archivo != null && String(row.url_archivo).trim() !== ''
        ? String(row.url_archivo)
        : null

  let estado: DocEstadoAdmin = 'pendiente'
  if (typeof row.estado === 'string' && ['pendiente', 'aprobado', 'rechazado'].includes(row.estado)) {
    estado = row.estado as DocEstadoAdmin
  } else if (row.verificado === true) {
    estado = 'aprobado'
  }

  const comentario_admin =
    (row.comentario_admin as string | null | undefined) ??
    (row.notas as string | null | undefined) ??
    null

  const subido_en =
    row.subido_en != null
      ? String(row.subido_en)
      : row.fecha_subida != null
        ? String(row.fecha_subida)
        : new Date().toISOString()

  return { id, alumno_id, tipo, nombre_archivo, estado, comentario_admin, subido_en, url }
}

/** Ruta en bucket `documentos`: {alumnoId}/{tipo}.{ext} */
export function documentoStoragePath(alumnoId: string, tipo: string, nombreArchivo: string): string {
  const raw = nombreArchivo?.trim() || 'file.pdf'
  const ext = raw.includes('.') ? (raw.split('.').pop() ?? 'pdf').toLowerCase() : 'pdf'
  return `${alumnoId}/${tipo}.${ext}`
}

/**
 * Payloads para aprobar / rechazar / regresar a pendiente un documento.
 *
 * Regla: aprobado ⇒ verificado = true; rechazado o pendiente ⇒ verificado = false.
 *
 * Hay tres formas de `documentos_alumno` en la flota:
 *   * canónica de la plantilla (legacy): tipo_documento / verificado / notas /
 *     fecha_verificacion, sin `estado`;
 *   * nueva pura: estado / comentario_admin / revisado_en, sin `verificado`;
 *   * HÍBRIDA (IVS, soporte 8-oct-2026): las columnas nuevas Y `verificado`.
 * Antes se intentaba `nuevo` y, si fallaba, `legacy`. En una base híbrida `nuevo`
 * siempre funciona, así que aprobar nunca escribía `verificado` y el contador
 * «Docs. pendientes» seguía contando los aprobados. Por eso el orden es
 * híbrido → nuevo → legacy (`ordenDocEstadoUpdates`), y solo se pasa al
 * siguiente si el error dice que la columna no existe (`esColumnaInexistente`).
 */
export function buildDocEstadoUpdates(estado: DocEstadoAdmin, comentario: string | null) {
  const ts = new Date().toISOString()
  const nuevo: Record<string, unknown> = {
    estado,
    comentario_admin: comentario,
    revisado_en: ts,
  }
  return {
    hibrido: {
      ...nuevo,
      verificado: estado === 'aprobado',
    } as Record<string, unknown>,
    nuevo,
    legacy: {
      verificado: estado === 'aprobado',
      notas: comentario,
      fecha_verificacion: ts,
    } as Record<string, unknown>,
  }
}

/** Orden de intento: híbrido (IVS) → nuevo → legacy (canónico de la plantilla). */
export function ordenDocEstadoUpdates(
  u: ReturnType<typeof buildDocEstadoUpdates>,
): Record<string, unknown>[] {
  return [u.hibrido, u.nuevo, u.legacy]
}

/**
 * ¿El error dice que una columna no existe en ESTE esquema? 42703 lo devuelve
 * Postgres (filtro u orden por una columna inexistente); PGRST204, PostgREST
 * (columna inexistente en el cuerpo de un UPDATE/INSERT). Solo con esos dos se
 * prueba la forma siguiente: cualquier otro error se devuelve tal cual, sin
 * taparlo con el de un payload que tampoco aplica.
 */
export function esColumnaInexistente(error: { code?: string | null } | null | undefined): boolean {
  return !!error && (error.code === '42703' || error.code === 'PGRST204')
}

/**
 * Aplica el cambio de estado de un documento probando las tres formas en orden.
 * `actualizar` hace el UPDATE con un payload (la ruta le pone sus filtros).
 */
export async function aplicarDocEstado(
  estado: DocEstadoAdmin,
  comentario: string | null,
  actualizar: (payload: Record<string, unknown>) => PromiseLike<{ error: { message: string; code?: string } | null }>,
): Promise<{ error: { message: string; code?: string } | null }> {
  let error: { message: string; code?: string } | null = null
  for (const payload of ordenDocEstadoUpdates(buildDocEstadoUpdates(estado, comentario))) {
    error = (await actualizar(payload)).error
    if (!error || !esColumnaInexistente(error)) break
  }
  return { error }
}

/**
 * «Docs. pendientes» del dashboard: cuenta por `estado = 'pendiente'` (la fuente
 * de verdad que pintan /admin/documentos y el expediente) donde la columna
 * existe — en una base híbrida `verificado` se desfasa (aprobados con false, un
 * re-subido vuelve a 'pendiente' sin tocarlo) y además contaba los rechazados.
 * En el esquema canónico (sin `estado`, 42703) cuenta `verificado = false`, que
 * es lo único que ese esquema sabe. Lee con el service role (quien llama).
 */
export async function contarDocumentosPendientes(db: SupabaseClient): Promise<number> {
  const porEstado = await db.from('documentos_alumno').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
  if (!porEstado.error) return porEstado.count ?? 0
  if (!esColumnaInexistente(porEstado.error)) {
    console.error('[contarDocumentosPendientes] estado:', porEstado.error.message)
  }
  const porVerificado = await db.from('documentos_alumno').select('*', { count: 'exact', head: true }).eq('verificado', false)
  if (porVerificado.error) console.error('[contarDocumentosPendientes] verificado:', porVerificado.error.message)
  return porVerificado.count ?? 0
}
