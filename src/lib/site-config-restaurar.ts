/**
 * «Restaurar diseño original» (#279, decisión de Kevin del 30-sep-2026):
 * regresa SOLO el DISEÑO publicado. Lo que el cliente editó como dato de su
 * negocio en «Personalizar mi página» se CONSERVA con su valor publicado.
 *
 * Antes el DELETE dejaba `site_config.data = {}`: además del diseño, el
 * cliente perdía su WhatsApp, su correo, sus redes, sus precios, sus planes
 * apagados y su tipo de cambio por deshacer un color.
 *
 * Las dos listas de abajo reparten TODAS las claves de `CLAVES_EDITABLES` (lo
 * vigila tests/unit/site-config-restaurar.spec.ts: una clave editable nueva
 * hace fallar la prueba hasta que alguien decida de qué lado va). Regla de
 * Kevin para los casos dudosos: se CONSERVAN. Lo que no está en la lista
 * blanca (claves viejas o escritas a mano en la fila) tampoco se toca: el
 * merge ya lo ignora y borrarlo no deshace ningún diseño.
 *
 * Favicon, fuentes, estilo de la landing (animada/clásica), orden y visibilidad
 * de secciones, horarios, dirección y enlaces de cobro NO viven en site_config
 * (son de config.ts): Restaurar no los toca.
 *
 * Módulo PURO (sin red ni Supabase) para poder probarlo solo; la ruta
 * DELETE /api/admin/configuracion lo usa para escribir la fila y decidir qué
 * logos del bucket `branding` quedan sin referencia.
 */
import type { ClaveEditable } from '@/lib/site-config-core'

/** DISEÑO: lo que Restaurar regresa al de fábrica (config.ts de la escuela). */
export const CLAVES_DISENO = [
  // logos (el archivo del bucket se borra si nadie más lo referencia)
  'logo',
  'logoOscuro',
  // colores
  'colores.primario',
  'colores.secundario',
  'colores.acento',
  'colores.acentoClaro',
  'colores.acentoHover',
  'colores.textoSobreAcento',
  'colores.texto',
  'colores.textoSecundario',
  'colores.fondo',
  'colores.superficie',
  'colores.borde',
  'colores.themeColor',
  // textos del hero
  'landing.hero_badge_superior',
  'landing.hero_titulo',
  'landing.hero_highlight',
  'landing.hero_subtitulo',
  'landing.hero_badges',
  'landing.hero_cta_primario',
  'landing.hero_cta_whatsapp',
  'landing.contadores',
  // textos de las secciones
  'landing.respaldo_titulo',
  'landing.respaldo_badges',
  'landing.catalogoTitulo',
  'landing.catalogoSubtitulo',
  'landing.dolor_kicker',
  'landing.dolor_titulo',
  'landing.dolor_items',
  'landing.dolor_cierre',
  'landing.dolor_cierre_sub',
  'landing.programas_kicker',
  'landing.programas_titulo',
  'landing.programas_subtitulo',
  'landing.programas_popular',
  'landing.programas_cta',
  'landing.transformacion_kicker',
  'landing.transformacion_titulo',
  'landing.transformacion_sin',
  'landing.transformacion_con',
  'landing.proceso_kicker',
  'landing.proceso_titulo',
  'landing.proceso_pasos',
  'landing.testimonios',
  'landing.testimonios_kicker',
  'landing.testimonios_titulo',
  'landing.testimonios_subtitulo',
  'landing.beneficios_titulo',
  'landing.beneficios_subtitulo',
  'landing.beneficios_items',
  'landing.faq_kicker',
  'landing.faq_titulo',
  'landing.faq_items',
  'landing.cta_titulo',
  'landing.cta_highlight',
  'landing.cta_subtitulo',
  'landing.cta_boton',
  'landing.cta_whatsapp',
  // textos de la sección de licenciaturas: solo lo que se VE en la tarjeta
  // (el nombre real de la carrera y sus precios viven en otro lado)
  'landing.licenciaturas_kicker',
  'landing.licenciaturas_titulo',
  'landing.licenciaturas_subtitulo',
  'landing.licenciaturas_carreras',
  'landing.licenciaturas_pasos',
] as const satisfies ReadonlyArray<ClaveEditable>

/**
 * NEGOCIO: lo que Restaurar CONSERVA. Los marcados «dudoso» se quedan aquí por
 * la regla de Kevin («campo dudoso → se conserva»).
 */
export const CLAVES_NEGOCIO = [
  // identidad
  'nombre',
  'nombreCompleto',
  'tagline', // dudoso: es el lema de la marca (sección Identidad) aunque se lea en el hero
  'cct',
  'landing.cct', // dudoso: se pinta en la landing, pero es la clave oficial del centro
  'landing.ciudad', // dudoso: es un sufijo del badge del hero, pero es la ciudad de la escuela
  // contacto
  'whatsapp',
  'whatsappUrl',
  'whatsappDisplay',
  'contactoTelefono',
  'email',
  'contactoEmail',
  // redes
  'redes.facebook',
  'redes.instagram',
  // precios y planes
  'tipoCambioMXN',
  'precios.inscripcion',
  'precios.inscripcionSecundaria',
  'precios.inscripcionPreparatoria',
  'precios.certificacionSecundaria',
  'precios.certificacionPreparatoria',
  'precios.mensualidadSecundaria3Meses',
  'precios.mensualidadSecundaria6Meses',
  'precios.mensualidadPreparatoria3Meses',
  'precios.mensualidadPreparatoria6Meses',
  'modalidades',
  'licenciaturas.inscripcion',
  'licenciaturas.certificacion',
  'licenciaturas.modalidades',
] as const satisfies ReadonlyArray<ClaveEditable>

/** Las claves que guardan la URL de un logo del bucket `branding`. */
export const CLAVES_LOGO_BRANDING = ['logo', 'logoOscuro'] as const

type ObjetoPlano = Record<string, unknown>

function esObjetoPlano(v: unknown): v is ObjetoPlano {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Copia profunda de lo que puede traer una columna JSONB. */
function copiaJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/**
 * Quita la ruta (con puntos) del objeto. Si el contenedor inmediato queda
 * vacío (`colores: {}`, `landing: {}`) también se quita, para que la fila
 * restaurada no arrastre cáscaras vacías.
 */
function quitarRuta(obj: ObjetoPlano, ruta: string): void {
  const partes = ruta.split('.')
  const hoja = partes.pop() as string
  let actual: ObjetoPlano = obj
  const cadena: Array<[ObjetoPlano, string]> = []
  for (const parte of partes) {
    const sig = actual[parte]
    if (!esObjetoPlano(sig)) return
    cadena.push([actual, parte])
    actual = sig
  }
  if (!(hoja in actual)) return
  delete actual[hoja]
  for (let i = cadena.length - 1; i >= 0; i--) {
    const [padre, clave] = cadena[i]
    const hijo = padre[clave]
    if (esObjetoPlano(hijo) && Object.keys(hijo).length === 0) delete padre[clave]
    else break
  }
}

/**
 * La fila que deja «Restaurar diseño original»: la publicada SIN las claves de
 * diseño. Todo lo demás (negocio, dudosos y lo que no está en la lista blanca)
 * queda tal cual, con su valor publicado. No valida ni recorta: no inventa ni
 * corrige nada que el cliente haya publicado.
 *   · fila vacía o que no es objeto → `{}`
 *   · fila con solo datos del negocio → la misma fila
 */
export function restaurarDiseno(data: unknown): ObjetoPlano {
  if (!esObjetoPlano(data)) return {}
  const salida = copiaJson(data)
  for (const ruta of CLAVES_DISENO) quitarRuta(salida, ruta)
  return salida
}

/**
 * Nombre de un objeto de logo tal como lo sube POST /api/admin/configuracion/logo
 * (`logo-<claro|oscuro>-<milisegundos>.<ext>`, en la raíz del bucket).
 */
const RE_OBJETO_LOGO = /^logo-(claro|oscuro)-(\d+)\.[a-z0-9]+$/

/**
 * Qué objetos de la RAÍZ del bucket `branding` borrar al restaurar: solo los
 * logos (lo único que es diseño ahí) que la fila ya no referencia y que se
 * subieron ANTES de empezar a restaurar (`antesDeMs`). Un logo subido mientras
 * se restauraba (otra pestaña, otro admin) se deja: su fila puede estar a
 * punto de apuntarle. Cualquier otro objeto se deja.
 */
export function logosABorrar(
  nombresEnRaiz: ReadonlyArray<string>,
  referenciados: ReadonlySet<string>,
  antesDeMs: number,
): string[] {
  return nombresEnRaiz.filter((n) => {
    const m = RE_OBJETO_LOGO.exec(n)
    return m !== null && Number(m[2]) < antesDeMs && !referenciados.has(n)
  })
}
