'use client'

/**
 * "Personalizar mi página" (F1) — contexto CLIENTE de la configuración del
 * sitio.
 *
 * `layout.tsx` (Server Component) resuelve `getPublicSiteConfig()` y monta
 * `<SiteConfigProvider value={…}>`; cualquier componente `'use client'` lee
 * con `useSiteConfig()` en lugar de `CONFIG` para las claves editables.
 *
 * ⚠️ IMPORTA SOLO de '@/lib/config' y '@/lib/site-config-core'. El módulo de
 * servidor (site-config.ts) arrastra `next/cache` y `server-only`: traerlo
 * aquí rompería el build (server-only) o, peor, engordaría el bundle del
 * navegador de los 144 clientes (ver src/lib/cursos/purga.ts).
 *
 * SIN PROVIDER (pruebas, componentes aislados, páginas fuera del layout raíz)
 * `useSiteConfig()` devuelve los defaults de config.ts — el mismo objeto que
 * la app usaba antes de F1 —, así que un componente que migre a
 * `useSiteConfig()` no cambia de comportamiento donde el provider no llega.
 *
 * ⚠️ AQUÍ NO VIAJA `landing`. El valor se serializa en el HTML de CADA página,
 * y los 42 textos de la landing (más testimonios, FAQ y beneficios) son varios
 * kB que ninguna pantalla con provider lee. La landing pública los recibe por
 * PROPS desde su Server Component (`toLandingConfig`, src/app/page.tsx). Si un
 * componente cliente llegara a necesitar uno, que se lo pasen por props: no
 * devuelvas `landing` a `CLAVES_PUBLICAS`.
 */
import { createContext, useContext, type ReactNode } from 'react'
import { CONFIG } from '@/lib/config'
import {
  congelarProfundo,
  mergeSiteConfig,
  toPublicSiteConfig,
  type PublicSiteConfig,
} from '@/lib/site-config-core'

/**
 * Fallback calculado UNA vez al cargar el módulo. Con overrides vacíos el
 * merge es deep-equal a CONFIG, así que esto es "config.ts recortado a lo
 * público" — no cuesta más que un clon por JSON al arrancar.
 *
 * CONGELADO porque es un objeto ÚNICO compartido por todos los consumidores
 * sin provider. `PublicSiteConfig` ya es `DeepReadonly` en tipos (como
 * `CONFIG` con su `as const`); el freeze cubre el hueco que los tipos no
 * cubren — un cast, un `any` — y hace que una mutación accidental falle en el
 * acto en vez de contaminar al siguiente componente que lea el contexto. El
 * valor real que monta layout.tsx no se congela: llega serializado desde el
 * servidor y es distinto en cada render.
 */
const FALLBACK_PUBLICO: PublicSiteConfig = congelarProfundo(
  toPublicSiteConfig(mergeSiteConfig(CONFIG, {})),
)

const SiteConfigContext = createContext<PublicSiteConfig>(FALLBACK_PUBLICO)

export function SiteConfigProvider({
  value,
  children,
}: {
  value: PublicSiteConfig
  children: ReactNode
}) {
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>
}

/** Config pública del sitio (defaults + overrides). Sin provider, los defaults. */
export function useSiteConfig(): PublicSiteConfig {
  return useContext(SiteConfigContext)
}
