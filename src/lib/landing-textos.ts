/**
 * "Personalizar mi página" — resolución de lo que la LANDING pinta.
 *
 * Módulo PURO e ISOMORFO: sin `server-only`, sin `next/cache`, sin Supabase y
 * sin React. Lo importan `LandingClient` (componente cliente) y las pruebas
 * unitarias; si algún día entrara aquí un import de servidor se colaría al
 * bundle del navegador por la cadena de la landing (la trampa de
 * src/lib/cursos/purga.ts, que engordó la landing de 11.3 kB a 25.4 kB).
 *
 * POR QUÉ EXISTE (hardening de F3). `LandingClient` leía `config.landing.x`
 * directo, así que una clave AUSENTE tiraba la página entera:
 * `L.contadores.map(...)` sobre `undefined` es un TypeError, y el hero completo
 * de esa escuela desaparece. No es hipotético: son ~144 clientes con su propio
 * `config.ts` clonado en fechas distintas, y F3 estrenó 35 claves de golpe
 * (`hero_badge_superior` … `cta_whatsapp`). Un cliente legacy que porte la
 * landing sin actualizar su `config.ts` — o un onboarding a medias — no tiene
 * ninguna de ellas.
 *
 * `resolverLanding` cierra ese hueco en UN sitio: devuelve las 42 claves que la
 * landing pinta, rellenando desde `CONFIG.landing` (el default de la PLANTILLA,
 * que sí las tiene todas) lo que falte, y garantizando que toda lista sea un
 * arreglo. La landing deja de tener que preguntarse por cada campo.
 *
 * NO valida FORMA ni contenido: de eso ya se encarga `mergeSiteConfig`
 * (site-config-core.ts) con los overrides de la BD. Aquí la entrada es el
 * `config.ts` del propio cliente, que es código suyo y no de un desconocido:
 * lo único que puede faltarle son claves.
 */
import { CONFIG } from '@/lib/config'
import type { DeepReadonly, SiteConfig } from '@/lib/site-config-core'

type Landing = SiteConfig['landing']

// ─── Claves que la landing pinta ─────────────────────────────────────────────

/**
 * Subclaves de `landing.*` que `LandingClient` LEE (cada `L.x` del JSX).
 *
 * Es la lista que `resolverLanding` garantiza. Está comprobada en COMPILACIÓN
 * contra `CONFIG.landing` (`satisfies ReadonlyArray<keyof Landing>`: un typo no
 * compila) y en PRUEBA contra el propio JSX de `LandingClient`
 * (tests/unit/landing-textos.spec.ts extrae los `L.x` del archivo y exige que
 * coincidan). Si añades un `L.x` nuevo al JSX y no lo pones aquí, esa prueba
 * falla — que es justo el aviso que hace falta, porque ese campo sería el
 * siguiente `undefined` en producción.
 *
 * NO están `hero_badges`, `respaldo_titulo`, `respaldo_badges`, `convenios`,
 * `cct`, `certificacion_*` ni `mostrarCatalogoCursos`: existen en `CONFIG` y
 * varias son editables, pero esta landing no las pinta.
 */
export const CLAVES_LANDING_PINTADAS = [
  // hero
  'hero_badge_superior',
  'ciudad',
  'hero_titulo',
  'hero_highlight',
  'hero_subtitulo',
  'hero_cta_primario',
  'hero_cta_whatsapp',
  'contadores',
  // dolor / PAS
  'dolor_kicker',
  'dolor_titulo',
  'dolor_items',
  'dolor_cierre',
  'dolor_cierre_sub',
  // programas (precios)
  'programas_kicker',
  'programas_titulo',
  'programas_subtitulo',
  'programas_popular',
  'programas_cta',
  // transformación (before / after)
  'transformacion_kicker',
  'transformacion_titulo',
  'transformacion_sin',
  'transformacion_con',
  // proceso (cómo funciona)
  'proceso_kicker',
  'proceso_titulo',
  'proceso_pasos',
  // testimonios
  'testimonios',
  'testimonios_kicker',
  'testimonios_titulo',
  'testimonios_subtitulo',
  // beneficios
  'beneficios_titulo',
  'beneficios_subtitulo',
  'beneficios_items',
  // catálogo de diplomados
  'catalogoTitulo',
  'catalogoSubtitulo',
  // FAQ
  'faq_kicker',
  'faq_titulo',
  'faq_items',
  // CTA final
  'cta_titulo',
  'cta_highlight',
  'cta_subtitulo',
  'cta_boton',
  'cta_whatsapp',
] as const satisfies ReadonlyArray<keyof Landing>

export type ClaveLandingPintada = (typeof CLAVES_LANDING_PINTADAS)[number]

/**
 * Las claves pintadas que son LISTAS. Se declaran a mano en vez de deducirlas
 * de `CONFIG.landing` con `Array.isArray` a propósito: si el `config.ts` del
 * cliente no trae la clave, no hay default del que deducir nada, y el caso que
 * importa (`L.contadores.map(...)`) es exactamente ese. Comprobado en
 * compilación contra el tipo de cada clave.
 */
export const LISTAS_LANDING = [
  'contadores',
  'dolor_items',
  'transformacion_sin',
  'transformacion_con',
  'proceso_pasos',
  'testimonios',
  'beneficios_items',
  'faq_items',
] as const satisfies ReadonlyArray<
  { [K in ClaveLandingPintada]: Landing[K] extends ReadonlyArray<unknown> ? K : never }[ClaveLandingPintada]
>

/** Lo que `LandingClient` consume: las 42 claves, ninguna `undefined`. */
export type LandingResuelta = DeepReadonly<Pick<Landing, ClaveLandingPintada>>

const ES_LISTA: ReadonlySet<string> = new Set<string>(LISTAS_LANDING)

function esObjetoPlano(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Rellena desde `CONFIG.landing` lo que falte y devuelve las 42 claves que la
 * landing pinta.
 *
 *  - `undefined`, `null` o cualquier cosa que no sea objeto plano → todos los
 *    defaults (no lanza).
 *  - Lista ausente, `null` o de otro tipo → la de `CONFIG`, y si esa también
 *    falta, `[]`. NUNCA `undefined`.
 *  - Texto ausente o no-string → el de `CONFIG`, y si falta, `''`. Un `''`
 *    EXPLÍCITO del cliente se respeta: en `ciudad` y en `cct` significa "no lo
 *    muestres", no "no lo configuré".
 *  - No clona: comparte referencias con `landing` / `CONFIG.landing`. Es
 *    correcto porque `LandingClient` solo lee, y el objeto que le llega ya es
 *    un clon fresco de `mergeSiteConfig`.
 */
export function resolverLanding(
  landing: Partial<DeepReadonly<Landing>> | null | undefined,
): LandingResuelta {
  const origen: Record<string, unknown> = esObjetoPlano(landing) ? landing : {}
  const base = CONFIG.landing as unknown as Record<string, unknown>
  const salida: Record<string, unknown> = {}

  for (const clave of CLAVES_LANDING_PINTADAS) {
    const valor = origen[clave]
    const porDefecto = base[clave]
    if (ES_LISTA.has(clave)) {
      salida[clave] = Array.isArray(valor) ? valor : Array.isArray(porDefecto) ? porDefecto : []
    } else {
      salida[clave] = typeof valor === 'string' ? valor : typeof porDefecto === 'string' ? porDefecto : ''
    }
  }

  return salida as LandingResuelta
}

// ─── Paleta ──────────────────────────────────────────────────────────────────

/**
 * Claves de `colores` que, si difieren del `config.ts` del cliente, encienden
 * la paleta derivada de la landing (ver `paletaLanding` en LandingClient).
 */
export const CLAVES_PALETA = [
  'primario',
  'secundario',
  'acento',
  'acentoHover',
  'acentoClaro',
  'textoSobreAcento',
] as const

export type ClavePaleta = (typeof CLAVES_PALETA)[number]

/** Lo mínimo que hace falta para comparar dos paletas. */
type ColoresComparables = { readonly [K in ClavePaleta]?: string }

/**
 * Un hex comparable: sin espacios y en MAYÚSCULAS. `#3b82f6` y `#3B82F6` son
 * el mismo color y deben contar como iguales.
 */
function normalizarHex(v: string | undefined): string | undefined {
  return typeof v === 'string' ? v.trim().toUpperCase() : v
}

/**
 * La paleta con la que sale la plantilla de fábrica: el azul sobre pizarra que
 * lleva el diseño original de la landing (`PALETA_ORIGINAL` en LandingClient).
 *
 * ⚠️ SON LITERALES A PROPÓSITO, NO `CONFIG.colores`. En el repo de un cliente,
 * `CONFIG.colores` son los colores DE ESE CLIENTE, no los de fábrica; usarlo
 * como referencia era el bug que este bloque arregla (ver
 * `esPaletaPersonalizada`). Si algún día cambia la paleta de fábrica de la
 * plantilla, hay que cambiar estos seis valores a mano — y una prueba unitaria
 * avisa si se desincronizan del `config.ts` de la plantilla maestra.
 */
export const COLORES_DE_FABRICA: { readonly [K in ClavePaleta]: string } = {
  primario:         '#0F172A',
  secundario:       '#1E293B',
  acento:           '#3B82F6',
  acentoHover:      '#2563EB',
  acentoClaro:      '#DBEAFE',
  textoSobreAcento: '#FFFFFF',
}

/**
 * ¿Esta escuela tiene una paleta propia? Es decir: ¿hay que pintar la landing
 * con sus colores en vez de con el azul de fábrica?
 *
 * Es el interruptor de TODO lo personalizado de la landing —la paleta derivada
 * y las variables CSS que se inyectan para globals.css—, así que vive en un
 * solo sitio y no pueden discrepar.
 *
 * 🛑 SE COMPARA CONTRA LA PALETA DE FÁBRICA, NO CONTRA `CONFIG.colores`.
 * El default era `CONFIG.colores` y eso hacía que la landing IGNORARA la paleta
 * del cliente: en el repo de una escuela, `CONFIG.colores` ya SON sus colores,
 * así que sin overrides en la BD la comparación daba "iguales" → `false` → la
 * landing se pintaba con el azul de la plantilla. El cliente ponía su verde y
 * su oro en el config, desplegaba, y la portada seguía saliendo azul marino.
 * Lo reportó EDUHCO (#197, 9-sep-2026) y volvió a morder en GRATIA (#198).
 *
 * Para las ~144 escuelas que NUNCA tocaron `colores` en su `config.ts` el
 * resultado es exactamente el mismo que antes (su config ES el de fábrica), así
 * que su landing no cambia ni un píxel. Solo cambia —y a favor— la de quien ya
 * había declarado una paleta propia y no la estaba viendo.
 *
 * COMPARACIÓN NORMALIZADA (hardening). Antes se comparaba el hex tal cual, y
 * eso confundía "otro color" con "el mismo color escrito distinto": el editor
 * guarda los hex en MAYÚSCULAS (ver `site-config-validacion.ts`), así que un
 * cliente cuyo `config.ts` los tenga en minúsculas —lo habitual— pasaba a
 * paleta personalizada nada más volver a elegir SU PROPIO color en el panel, y
 * la landing se repintaba entera con los tonos derivados sin que nadie hubiera
 * cambiado nada. Con el trim + mayúsculas, reintroducir el mismo color deja la
 * landing pixel-idéntica, que es lo que el admin espera ver.
 */
export function esPaletaPersonalizada(
  colores: ColoresComparables | undefined,
  base: ColoresComparables = COLORES_DE_FABRICA,
): boolean {
  return CLAVES_PALETA.some((k) => normalizarHex(colores?.[k]) !== normalizarHex(base?.[k]))
}
