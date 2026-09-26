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

/** Lee `site_config.data` (fila id = 1). Nunca lanza: devuelve el estado. */
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
    // Una URL mal escrita hace que supabase-js lance aquí («Invalid supabaseUrl»).
    return { estado: 'url-invalida', data: {}, detalle: String(e?.message ?? e) }
  }
  let r
  try {
    r = await sb.from('site_config').select('data').eq('id', 1).maybeSingle()
  } catch (e) {
    return { estado: 'error', data: {}, detalle: String(e?.message ?? e) }
  }
  const { data, error } = r ?? {}
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
