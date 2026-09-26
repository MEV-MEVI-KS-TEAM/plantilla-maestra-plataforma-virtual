/**
 * publicado.mjs — lo publicado en «Personalizar mi página» (tabla `site_config`)
 * leído para el Documento de Entrega, y la POLÍTICA de qué hacer cuando no se
 * puede leer (Bloque D · D12, #201; decisiones 17 y 18 de Kevin).
 *
 * La entrega usa TODO lo publicado, con la MISMA fusión que la app
 * (`mergeSiteConfig(CONFIG, site_config.data)`, igual que getSiteConfig): los
 * precios de Secundaria/Preparatoria, los planes, el WhatsApp, los textos, los
 * colores y el logo. Antes solo aplicaba la licenciatura (B2) y el PDF que
 * recibía el cliente no coincidía con su página.
 *
 * Si no se puede leer lo publicado (sin .env.local, sin llaves, base caída,
 * pausada, llave inválida) se ABORTA: un documento oficial que quizá no dice lo
 * que dice la página es peor que no tenerlo. `--solo-config` genera con
 * config.ts a sabiendas, y lo deja escrito en «REVISA ANTES DE ENVIAR».
 *
 * JS puro: `leerSiteConfig` recibe `crearCliente` (las pruebas le pasan uno falso).
 */

/**
 * @typedef {{ estado: 'ok' | 'sin-fila' | 'sin-tabla' | 'solo-config' | 'sin-env' | 'sin-llaves' | 'url-invalida' | 'error',
 *             data: Record<string, unknown>, detalle?: string }} Lectura
 */

/**
 * Lee `site_config.data` (fila id = 1). Nunca lanza: devuelve el estado.
 * @param {{ soloConfig: boolean,
 *           vars: Record<string, string> | null | undefined,
 *           crearCliente: (url: string, key: string) => Promise<any> }} opciones
 * @returns {Promise<Lectura>}
 */
export async function leerSiteConfig({ soloConfig, vars, crearCliente }) {
  if (soloConfig) return { estado: 'solo-config', data: {} }
  if (!vars) return { estado: 'sin-env', data: {} }
  // Basta la anon key: `site_config` se lee en abierto (la landing la lee así).
  const url = vars.NEXT_PUBLIC_SUPABASE_URL
  const key = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY || vars.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { estado: 'sin-llaves', data: {} }
  let sb
  try {
    sb = await crearCliente(url, key)
  } catch (e) {
    const msg = String(e?.message ?? e)
    // Sin la dependencia no es la URL: que el mensaje no mande a revisar .env.local.
    if (/Cannot find (package|module)|ERR_MODULE_NOT_FOUND/.test(msg)) return { estado: 'error', data: {}, detalle: `falta @supabase/supabase-js (pnpm install): ${msg}` }
    // Una URL mal escrita hace que supabase-js lance aquí («Invalid supabaseUrl»).
    return { estado: 'url-invalida', data: {}, detalle: msg }
  }
  let r
  try {
    r = await sb.from('site_config').select('data').eq('id', 1).maybeSingle()
  } catch (e) {
    return { estado: 'error', data: {}, detalle: String(e?.message ?? e) }
  }
  const { data, error, status } = r ?? {}
  // postgrest-js convierte algunas respuestas malas en «sin error»: un 404 con el
  // cuerpo vacío llega como 204, uno con `[]` como 200 con un ARREGLO, y un 500
  // con `null` como status 500 sin error. Leídas como «nada publicado» darían un
  // documento solo con config.ts sin decir nada (lo que D12 evita): son error.
  if (!error && (typeof status !== 'number' || status !== 200 || Array.isArray(data))) {
    return { estado: 'error', data: {}, detalle: `respuesta inesperada de la base (HTTP ${status ?? '?'})` }
  }
  if (error) {
    // Base sin la tabla: nadie ha publicado nada. Mismos códigos que site-config.ts.
    if (error.code === 'PGRST205' || error.code === '42P01') return { estado: 'sin-tabla', data: {} }
    return { estado: 'error', data: {}, detalle: error.message ?? String(error) }
  }
  const pub = data?.data
  if (!pub) return { estado: 'sin-fila', data: {} }
  return { estado: 'ok', data: typeof pub === 'object' && !Array.isArray(pub) ? pub : {} }
}

const AYUDA = 'El documento tiene que decir lo mismo que la página de la escuela: precios, WhatsApp,\n' +
  'textos, colores y logo que el admin haya publicado en «Personalizar mi página».\n' +
  'Baja las variables del proyecto (vercel env pull .env.local) y vuelve a correr, o, si sabes\n' +
  'que la escuela no ha publicado nada, usa --solo-config para generar solo con config.ts.'

/**
 * Qué hacer con la lectura: seguir (con un renglón en consola), avisar en
 * «REVISA ANTES DE ENVIAR», o abortar con ayuda.
 * @param {Lectura} l
 * @returns {{ log?: string, aviso?: string, abortar?: { msg: string, ayuda: string } }}
 */
export function politicaPublicado(l) {
  switch (l?.estado) {
    case 'ok':
      return { log: '  · con lo publicado en el panel (precios, planes, contacto, textos, colores y logo)' }
    case 'sin-fila':
      return { log: '  · el panel no ha publicado nada: el documento sale de config.ts' }
    case 'sin-tabla':
      return { log: '  · la base no tiene site_config (nada publicado): el documento sale de config.ts' }
    case 'solo-config':
      return {
        log: '  · --solo-config: TODO sale de config.ts, sin mirar lo publicado',
        aviso: 'Generado con --solo-config: el documento NO refleja lo publicado en el panel (precios, WhatsApp, textos, colores, logo). Envíalo solo si sabes que la escuela no ha publicado nada.',
      }
    case 'sin-env':
      return { abortar: { msg: 'Sin .env.local no se puede leer lo publicado en el panel (site_config).', ayuda: AYUDA } }
    case 'sin-llaves':
      return { abortar: { msg: '.env.local sin NEXT_PUBLIC_SUPABASE_URL o sin llave: no se puede leer lo publicado en el panel.', ayuda: AYUDA } }
    case 'url-invalida':
      return { abortar: { msg: `.env.local con una URL de Supabase inválida (${l.detalle ?? ''}).`, ayuda: AYUDA } }
    default:
      return { abortar: { msg: `No se pudo leer lo publicado en el panel (site_config): ${l?.detalle ?? 'error desconocido'}`, ayuda: AYUDA } }
  }
}

/* ── ¿De QUÉ proyecto se leyó, y es de esta escuela? (Bloque D · D20c) ──────
 *
 * Un .env.local de OTRA escuela (se bajó el de otro proyecto, se copió el repo de
 * un clon a otro) se leía sin decir nada: el documento salía con los precios, el
 * WhatsApp, el logo y los textos de otra escuela, y el operador no tenía forma de
 * notarlo. Ahora el script dice de qué proyecto leyó y qué escuela está
 * publicada ahí, y si el nombre publicado no es el de config.ts, aborta (salvo
 * --forzar-proyecto: la escuela cambió su nombre en el panel a propósito).
 */

/** El ref del proyecto (el subdominio de `https://<ref>.supabase.co`), o null. */
export function refDeProyecto(url) {
  const m = String(url ?? '').trim().replace(/\/+$/, '').match(/^https?:\/\/([a-z0-9-]+)\.supabase\.(?:co|in)$/i)
  return m ? m[1] : null
}

/** Lo que se imprime del proyecto leído: el ref; con dominio propio, el host; sin URL, null. */
export function proyectoLeido(vars) {
  const url = vars?.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  return refDeProyecto(url) ?? (() => { try { return new URL(url).host } catch { return String(url) } })()
}

/** Para comparar nombres: sin acentos, sin mayúsculas y con los espacios colapsados. */
const normNombre = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * ¿Lo publicado es de ESTA escuela? Compara `nombre` y `nombreCompleto`
 * publicados (solo los que son texto) contra los de config.ts, sin distinguir
 * mayúsculas, acentos ni espacios. Con --solo-config no se leyó nada y no se
 * compara nada.
 *
 * Devuelve siempre `log` (el renglón de consola) y `revisa` (la primera línea
 * de «REVISA»); con una diferencia, `abortar`, o con `forzar`, un `aviso`.
 * @param {{ lectura: Lectura | null | undefined,
 *           configTs: { nombre?: unknown, nombreCompleto?: unknown } | null | undefined,
 *           proyecto: string | null | undefined, forzar?: boolean }} opciones
 * @returns {{ log: string, revisa: string, aviso?: string, abortar?: { msg: string, ayuda: string } }}
 */
export function revisarProyecto({ lectura, configTs, proyecto, forzar = false }) {
  const pub = lectura?.estado === 'ok' ? (lectura.data ?? {}) : {}
  const escuela = lectura?.estado === 'solo-config' ? 'no se leyó (--solo-config)'
    : typeof pub.nombre === 'string' ? `«${pub.nombre}»`
      : typeof pub.nombreCompleto === 'string' ? `«${pub.nombreCompleto}»`
        : `nada publicado (config.ts: «${configTs?.nombre ?? ''}»)`
  const revisa = `Proyecto de Supabase: ${proyecto ?? '— (sin .env.local)'} · Escuela publicada: ${escuela}`
  const difs = ['nombre', 'nombreCompleto']
    .filter(k => typeof pub[k] === 'string' && normNombre(pub[k]) !== normNombre(configTs?.[k]))
    .map(k => `${k} publicado «${pub[k]}» ≠ config.ts «${configTs?.[k] ?? ''}»`)
  const r = { log: `  · ${revisa}`, revisa }
  if (!difs.length) return r
  if (forzar) {
    return { ...r, aviso: `Generado con --forzar-proyecto: ${difs.join('; ')} (proyecto ${proyecto}). Confirma que .env.local es de esta escuela.` }
  }
  return { ...r, abortar: {
    msg: `Lo publicado en el proyecto ${proyecto} no es de esta escuela: ${difs.join('; ')}.`,
    ayuda: '.env.local apunta a otro proyecto (baja el correcto: vercel env pull .env.local), o la escuela cambió su nombre en\n' +
      '«Personalizar mi página». Si es lo segundo, vuelve a correr con --forzar-proyecto.',
  } }
}

/**
 * La página de Infraestructura nombra el proyecto de `supabaseUrl` en
 * entrega.local.json si viene, y todo lo demás se lee del de .env.local. Si
 * son proyectos distintos, el PDF diría uno y reflejaría otro: se aborta,
 * salvo --forzar-proyecto (y entonces queda en «REVISA»).
 * @param {{ urlDatos: unknown, urlEnv: unknown, forzar?: boolean }} opciones
 * @returns {{ aviso?: string, abortar?: { msg: string, ayuda: string } }}
 */
export function revisarProyectoInfra({ urlDatos, urlEnv, forzar = false }) {
  const deDatos = refDeProyecto(urlDatos), deEnv = refDeProyecto(urlEnv)
  if (!deDatos || !deEnv || deDatos === deEnv) return {}
  const msg = `"supabaseUrl" de entrega.local.json es del proyecto ${deDatos}, pero lo publicado y el inventario se leyeron del ${deEnv} (.env.local).`
  if (forzar) return { aviso: `Generado con --forzar-proyecto: ${msg} La página de Infraestructura nombra el ${deDatos}.` }
  return { abortar: { msg, ayuda: 'Quita "supabaseUrl" de entrega.local.json (sale de .env.local), o baja el .env.local del proyecto correcto\n(vercel env pull .env.local). Si de verdad son distintos a propósito, vuelve a correr con --forzar-proyecto.' } }
}
