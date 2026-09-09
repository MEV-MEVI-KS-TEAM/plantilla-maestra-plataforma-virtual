/**
 * "Personalizar mi página" (F1) — lectura de la configuración del sitio en el
 * SERVIDOR.
 *
 *   config.ts (defaults)  ⟵ deep-merge ⟵  public.site_config.data (overrides)
 *     └── getSiteConfig()  ← este archivo
 *           ├── layout.tsx → CSS vars + themeColor + <SiteConfigProvider>
 *           ├── Server Components / API routes → getSiteConfig()
 *           └── Client Components → useSiteConfig() (provider)
 *
 * `import 'server-only'` hace que importar este archivo desde un componente
 * cliente falle en BUILD, no en producción. Es a propósito: aquí entra
 * `next/cache`, y `next/cache` jamás debe estar en la cadena de imports de un
 * componente cliente — cuando pasó con la purga del catálogo, la landing de
 * los 144 clientes engordó de 11.3 kB a 25.4 kB con código de caché de
 * servidor que el navegador no puede ejecutar (ver src/lib/cursos/purga.ts).
 * Por eso el provider cliente importa SOLO de site-config-core.ts.
 *
 * INVARIANTE SAGRADO: con la tabla vacía, inexistente o inalcanzable, esta
 * función devuelve `mergeSiteConfig(CONFIG, {})` — deep-equal a CONFIG — y la
 * app renderiza pixel-idéntica a hoy. Nunca rompe el render.
 */
import 'server-only'

import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '@/lib/config'
import {
  mergeSiteConfig,
  toPublicSiteConfig,
  SITE_CONFIG_TAG,
  type SiteConfig,
  type PublicSiteConfig,
} from '@/lib/site-config-core'

export {
  CLAVES_EDITABLES,
  CLAVES_PUBLICAS,
  SITE_CONFIG_TAG,
  esClaveEditable,
  mergeSiteConfig,
  normalizarArreglo,
  toPublicSiteConfig,
  toLandingConfig,
  derivarAliasPrecios,
} from '@/lib/site-config-core'
export type {
  SiteConfig,
  PublicSiteConfig,
  LandingConfig,
  SiteConfigOverrides,
  OverrideModalidad,
  ClaveEditable,
  PreciosAplicados,
  Testimonio,
} from '@/lib/site-config-core'

/**
 * Tras un fallo de lectura, cuánto esperar antes de volver a consultar.
 *
 * Un cliente legacy (sin la tabla todavía) fallaría en CADA render dinámico
 * — una consulta a PostgREST que devuelve 404 y un warn por petición. Como
 * el fallo no se cachea (ver abajo), este recuerdo en memoria del proceso es
 * lo que evita ese goteo. Es corto a propósito: en cuanto el cliente corre la
 * migración, a lo sumo un minuto después ya se lee la fila.
 *
 * Vive en el MÓDULO, no en la caché de Next: cada instancia (lambda de Vercel,
 * proceso de `next start`) lleva la suya. `revalidateSiteConfig` lo pone a
 * cero en la instancia que purga (ver allí por qué importa); las demás
 * expiran solas en menos de un minuto.
 */
const REINTENTO_TRAS_FALLO_MS = 60_000
let ultimoFalloMs = 0

/**
 * Lectura CACHEADA de la fila de overrides.
 *
 * POR QUÉ UN CLIENTE PÚBLICO Y NO `@/lib/supabase/server`. Dentro de
 * `unstable_cache` no hay request scope: `cookies()` lanza. Y esto corre
 * también en el BUILD de la landing estática, donde tampoco hay petición.
 * La fila es pública por diseño (la lee el navegador de cualquiera al pintar
 * la landing), así que la anon key sin sesión es exactamente el privilegio
 * que toca — y la RLS de la tabla debe permitir SELECT a `anon`.
 *
 * POR QUÉ EL THROW VA DENTRO Y EL CATCH FUERA. `unstable_cache` guarda lo que
 * la función DEVUELVE. Si aquí se atrapara el error y se devolviera `{}`, ese
 * `{}` quedaría cacheado bajo el tag hasta la siguiente purga: una caída de
 * red de un segundo dejaría a la escuela sin su personalización hasta que el
 * admin volviera a guardar. Lanzando, Next no cachea nada y la siguiente
 * petición vuelve a intentar. `getSiteConfig` atrapa fuera de la caché y ahí
 * sí degrada a los defaults, solo para ESA petición.
 */
const leerOverridesCacheado = unstable_cache(
  async (): Promise<unknown> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { data, error } = await supabase
      .from('site_config')
      .select('data')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      // PGRST205 / 42P01 = la tabla no existe (cliente que aún no corre la
      // migración de F1). Es el caso esperado en la flota; se degrada a
      // defaults sin drama.
      throw new Error(`${error.code ?? 'sin-codigo'}: ${error.message}`)
    }
    // Sin fila (o con `data` NULL) = sin overrides. `mergeSiteConfig` ya
    // tolera cualquier cosa que no sea objeto plano; aquí solo se normaliza.
    return data?.data ?? {}
  },
  ['site-config-overrides'],
  { tags: [SITE_CONFIG_TAG] },
)

function describirError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * Config del sitio ya fusionada: defaults de config.ts + overrides de la BD.
 * Servidor únicamente. Nunca lanza; ante cualquier fallo devuelve los defaults
 * y deja un warn con prefijo `[site-config]`.
 *
 * SIN MEMO POR PETICIÓN A PROPÓSITO. Cada llamador (layout, page, cada Server
 * Component) recibe su propio clon: lo caro — la lectura de la BD — ya lo
 * memoiza `unstable_cache`, y lo que queda es un round-trip por JSON de unos
 * pocos KB. Se evaluó envolver esto en `cache()` de React y se descartó por
 * dos razones: (1) `cache` no está en los tipos de @types/react 18 (solo en
 * react/canary.d.ts) y (2) un memo por petición devolvería la config VIEJA
 * dentro de la misma petición que la purga — justo el flujo de la API del
 * editor (Fase 4): guardar → `revalidateSiteConfig()` → responder con la
 * config recién leída. Si algún día hace falta, va en el llamador, no aquí.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  let overrides: unknown = {}
  const ahora = Date.now()
  if (ahora - ultimoFalloMs >= REINTENTO_TRAS_FALLO_MS) {
    try {
      overrides = await leerOverridesCacheado()
      ultimoFalloMs = 0
    } catch (e) {
      ultimoFalloMs = ahora
      console.warn(
        `[site-config] no se pudieron leer los overrides; se usa config.ts tal cual (${describirError(e)})`,
      )
    }
  }
  return mergeSiteConfig(CONFIG, overrides)
}

/** Recorte público de `getSiteConfig()`: lo que layout.tsx pasa al provider. */
export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  return toPublicSiteConfig(await getSiteConfig())
}

/**
 * Purga la config cacheada. Se llama desde la mutación de admin que guarda
 * `site_config` (Fase 4): el dato nuevo y la purga viajan juntos, sin ventana
 * de reloj.
 *
 * Dos capas, porque son dos cachés distintas:
 *   - `revalidateTag`: la Data Cache de `leerOverridesCacheado`. Sin esto, la
 *     siguiente lectura seguiría devolviendo la fila vieja.
 *   - `revalidatePath('/', 'layout')`: la Full Route Cache de TODAS las rutas
 *     bajo el layout raíz — la landing estática incluida. Purgar solo el tag
 *     dejaría el HTML prerenderizado con el logo y los colores viejos hasta
 *     el siguiente deploy (Bug 81 del PLAYBOOK, el mismo del catálogo).
 *
 * Lección Bug 82 (no la repitas aquí ni en layout.tsx): NO intentes resolver
 * la frescura con `export const revalidate = <expresión>`. La config de
 * segmento de Next se extrae ESTÁTICAMENTE en build y un export no-literal se
 * ignora en silencio: parece aplicado y no existe. La purga explícita desde la
 * mutación es la única vía que se verificó contra `next start`.
 *
 * Lección purga.ts: esta función arrastra `next/cache`. Jamás la importes
 * desde un componente cliente ni desde un módulo que uno importe — por eso el
 * provider vive sobre site-config-core.ts y no sobre este archivo.
 *
 * Y una tercera capa, que no es caché de Next: el recuerdo de fallo de
 * `getSiteConfig` (`ultimoFalloMs`). Escenario real del primer uso: el cliente
 * legacy acaba de correr la migración, la última lectura falló hace menos de
 * un minuto (la tabla no existía) y el admin guarda desde el editor. Sin este
 * reset, la instancia que atiende la respuesta seguiría devolviendo defaults
 * hasta que venciera la ventana y el admin vería que "no guardó". Solo afecta
 * a ESTA instancia; las demás pueden tardar hasta `REINTENTO_TRAS_FALLO_MS`
 * en volver a consultar, lo cual es tolerable y no requiere coordinación.
 */
export function revalidateSiteConfig(): void {
  ultimoFalloMs = 0
  revalidateTag(SITE_CONFIG_TAG)
  revalidatePath('/', 'layout')
}
