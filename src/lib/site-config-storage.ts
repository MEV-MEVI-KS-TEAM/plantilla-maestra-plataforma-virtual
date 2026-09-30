/**
 * "Personalizar mi página" (F4) — helpers del bucket `branding` (los logos que
 * sube el admin). SOLO para API routes: reciben el admin client con service
 * role porque el bucket no tiene política de escritura para nadie más (ver
 * supabase/migrations/20260908120000_site_config.sql).
 *
 * A diferencia de storage-comun.ts (buckets privados, signed URLs), este
 * bucket es PÚBLICO a propósito: el logo lo pinta un `<img src>` en la landing
 * sin sesión. La URL pública es estable y se guarda tal cual en
 * `site_config.data.logo`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeFolder } from '@/lib/storage-comun'
import { normalizarOrigen, pathDesdeUrlBranding } from '@/lib/site-config-validacion'
import { CLAVES_LOGO_BRANDING, logosABorrar } from '@/lib/site-config-restaurar'

export const BUCKET_BRANDING = 'branding'

/** URL pública de un objeto del bucket. No consulta la red: la compone el SDK. */
export function urlPublicaBranding(path: string, admin: SupabaseClient = createAdminClient()): string {
  return admin.storage.from(BUCKET_BRANDING).getPublicUrl(path).data.publicUrl
}

/**
 * Inverso de `urlPublicaBranding`: el path dentro del bucket, o `null` si la
 * URL no apunta a NUESTRO bucket (otro origen, `/logo.png`, un CDN externo…).
 * El origen se compara contra `NEXT_PUBLIC_SUPABASE_URL`, que es el mismo con
 * el que el SDK compone la URL pública.
 */
export function pathDesdeUrlPublica(url: unknown): string | null {
  return pathDesdeUrlBranding(url, normalizarOrigen(process.env.NEXT_PUBLIC_SUPABASE_URL))
}

/**
 * Borra el objeto al que apunta `url` SI Y SOLO SI es del bucket. `/logo.png`
 * (el default en /public) o una URL externa se ignoran sin error. Un fallo al
 * borrar se registra y no se propaga: el logo nuevo ya está guardado y un
 * huérfano en el bucket es preferible a un 500 tras un guardado exitoso.
 */
export async function borrarLogoSiEsDelBucket(admin: SupabaseClient, url: unknown): Promise<void> {
  const path = pathDesdeUrlPublica(url)
  if (!path) return
  const { error } = await admin.storage.from(BUCKET_BRANDING).remove([path])
  if (error) console.error(`[branding] no se pudo borrar ${path}:`, error.message)
}

/**
 * «Restaurar diseño original» (#279): borra de la RAÍZ del bucket los logos que
 * la fila (releída después de restaurar) ya no referencia y que se subieron
 * antes de `antesDeMs`. Nada más: otros objetos, subcarpetas, un logo que la
 * fila siga usando o uno recién subido se dejan (ver `logosABorrar`).
 *
 * Primero lista TODO (paginado de a 1000) y después borra, para que el borrado
 * no mueva las páginas mientras se recorren. Un fallo se registra y no se
 * propaga: la fila ya quedó restaurada y un huérfano en el bucket es
 * preferible a un 500 después de un guardado exitoso.
 */
export async function borrarLogosSinReferencia(
  admin: SupabaseClient,
  fila: Record<string, unknown>,
  antesDeMs: number,
): Promise<void> {
  const referenciados = new Set<string>()
  for (const clave of CLAVES_LOGO_BRANDING) {
    const path = pathDesdeUrlPublica(fila[clave])
    if (path) referenciados.add(path)
  }

  const nombres: string[] = []
  for (let offset = 0; offset < 100000; offset += 1000) {
    const { data: entries, error } = await admin.storage
      .from(BUCKET_BRANDING)
      .list('', { limit: 1000, offset })
    if (error) {
      console.error('[branding] no se pudo listar el bucket:', error.message)
      return
    }
    if (!entries || entries.length === 0) break
    // Los archivos reales traen id; las carpetas virtuales traen id null.
    for (const entry of entries) if (entry.id) nombres.push(entry.name)
    if (entries.length < 1000) break
  }

  const aBorrar = logosABorrar(nombres, referenciados, antesDeMs)
  for (let i = 0; i < aBorrar.length; i += 1000) {
    const lote = aBorrar.slice(i, i + 1000)
    const { error } = await admin.storage.from(BUCKET_BRANDING).remove(lote)
    if (error) console.error('[branding] no se pudieron borrar logos viejos:', error.message)
  }
}

/**
 * Vacía el bucket entero (raíz + cualquier subcarpeta). Ya NO lo usa
 * «Restaurar diseño original» (desde #279 solo se borran los logos sin
 * referencia, con `borrarLogosSinReferencia`); queda para limpiezas manuales.
 *
 * Misma mecánica que `removeFolder` de storage-comun.ts pero sobre la RAÍZ:
 * `list('')` pagina de a 1000 y aquí se va borrando lo listado, así que se
 * repite sin offset hasta que no quede nada o una pasada no avance.
 */
export async function limpiarBucketBranding(admin: SupabaseClient): Promise<void> {
  for (let pasada = 0; pasada < 20; pasada++) {
    const { data: entries, error } = await admin.storage.from(BUCKET_BRANDING).list('', { limit: 1000 })
    if (error) {
      console.error('[branding] no se pudo listar el bucket:', error.message)
      return
    }
    if (!entries || entries.length === 0) return

    const archivos: string[] = []
    const carpetas: string[] = []
    for (const entry of entries) {
      // Los archivos reales traen id; las carpetas virtuales traen id null.
      if (entry.id) archivos.push(entry.name)
      else carpetas.push(entry.name)
    }

    let avance = false
    if (archivos.length > 0) {
      const { error: rmError } = await admin.storage.from(BUCKET_BRANDING).remove(archivos)
      if (rmError) console.error('[branding] error borrando la raíz del bucket:', rmError.message)
      else avance = true
    }
    for (const sub of carpetas) {
      await removeFolder(admin, BUCKET_BRANDING, sub)
      avance = true
    }
    if (!avance) return
    if (entries.length < 1000 && carpetas.length === 0) return
  }
}
