/**
 * «Restaurar diseño original» (#279, decisión de Kevin del 30-sep-2026):
 * regresa SOLO el DISEÑO publicado. Lo que el cliente editó como dato de su
 * negocio en «Personalizar mi página» se CONSERVA con su valor publicado.
 *
 * Antes el DELETE dejaba `site_config.data = {}`: además del diseño, el
 * cliente perdía su WhatsApp, su correo, sus redes, sus precios, sus planes
 * apagados, su tipo de cambio, sus testimonios y sus preguntas frecuentes por
 * deshacer un color.
 *
 * Las dos listas de abajo reparten TODAS las claves de `CLAVES_EDITABLES` (lo
 * vigila tests/unit/site-config-restaurar.spec.ts: una clave editable nueva
 * hace fallar la prueba hasta que alguien decida de qué lado va). Regla de
 * Kevin para los casos dudosos: se CONSERVAN. El criterio:
 *   · DISEÑO = la presentación: logos, colores y los títulos, kickers, bajadas,
 *     botones y frases de venta de la landing.
 *   · NEGOCIO = lo que afirma un hecho de la escuela: identidad, contacto,
 *     redes, precios y planes, y el CONTENIDO que el cliente escribe con datos
 *     suyos (cifras, testimonios, preguntas frecuentes, pasos de inscripción,
 *     respaldos, tarjetas de carreras).
 * Lo que no está en la lista blanca (claves viejas o escritas a mano en la
 * fila) tampoco se toca: el merge ya lo ignora y borrarlo no deshace ningún
 * diseño.
 *
 * Favicon (archivo estático), fuentes (next/font), estilo de la landing
 * (config.ts), orden de las secciones (fijo en el JSX) y links de cobro
 * (config.ts) no se editan desde el panel ni viven en site_config: Restaurar
 * no los toca. Horarios y dirección no existen como dato: si el cliente los
 * escribió en el contenido que se conserva (p. ej. la FAQ), se quedan; en un
 * título o una frase de venta, esa frase vuelve a la de fábrica.
 *
 * Módulo sin red ni Supabase para poder probarlo solo: lo usan la ruta
 * DELETE /api/admin/configuracion (fila, logos, `pendiente`) y el editor
 * (conservar lo que el admin tecleó y no ha publicado).
 */
import type { ClaveEditable, SiteConfig, SiteConfigOverrides } from '@/lib/site-config-core'
import { validarOverrides } from '@/lib/site-config-validacion'
import { mismoContenido, prepararParaPublicar } from '@/lib/site-config-editor'

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
  // presentación del hero
  'landing.hero_badge_superior',
  'landing.hero_titulo',
  'landing.hero_highlight',
  'landing.hero_subtitulo',
  'landing.hero_badges',
  'landing.hero_cta_primario',
  'landing.hero_cta_whatsapp',
  // presentación de las secciones (títulos, kickers, bajadas, botones, frases de venta)
  'landing.respaldo_titulo',
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
  'landing.testimonios_kicker',
  'landing.testimonios_titulo',
  'landing.testimonios_subtitulo',
  'landing.beneficios_titulo',
  'landing.beneficios_subtitulo',
  'landing.beneficios_items',
  'landing.faq_kicker',
  'landing.faq_titulo',
  'landing.cta_titulo',
  'landing.cta_highlight',
  'landing.cta_subtitulo',
  'landing.cta_boton',
  'landing.cta_whatsapp',
  'landing.licenciaturas_kicker',
  'landing.licenciaturas_titulo',
  'landing.licenciaturas_subtitulo',
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
  // contenido con datos de la escuela (todos dudosos → se conservan)
  'landing.contadores', // cifras propias: «1500+ egresados», «15 años»
  'landing.testimonios', // alumnos reales; el de fábrica es [] (restaurar los borraría sin vuelta)
  'landing.faq_items', // requisitos, políticas, horarios, canales de contacto
  'landing.proceso_pasos', // cómo inscribirse y pagar en ESA escuela
  'landing.respaldo_badges', // instituciones y convenios que la respaldan
  'landing.licenciaturas_carreras', // la oferta: nombre visible y descripción de cada carrera
  'landing.licenciaturas_pasos', // cómo funciona la licenciatura en ESA escuela
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
 * Quita la ruta (con puntos) del objeto. Si un contenedor queda vacío por
 * ESTE borrado (`colores: {}`, `landing: {}`) también se quita, para que la
 * fila restaurada no arrastre cáscaras vacías.
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

/** ¿La ruta existe? Y su valor. */
function leerRuta(obj: ObjetoPlano, ruta: string): { hay: boolean; valor?: unknown } {
  let actual: unknown = obj
  for (const parte of ruta.split('.')) {
    if (!esObjetoPlano(actual) || !(parte in actual)) return { hay: false }
    actual = actual[parte]
  }
  return { hay: true, valor: actual }
}

function ponerRuta(obj: ObjetoPlano, ruta: string, valor: unknown): void {
  const partes = ruta.split('.')
  const hoja = partes.pop() as string
  let actual = obj
  for (const parte of partes) {
    if (!esObjetoPlano(actual[parte])) actual[parte] = {}
    actual = actual[parte] as ObjetoPlano
  }
  actual[hoja] = copiaJson(valor)
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
 * El borrador del editor DESPUÉS de restaurar: lo conservado en la fila, más
 * los datos del negocio que el admin cambió en su borrador y aún no publica
 * (tecleados, o quitados con el «Restaurar» de su campo). Sin esto, restaurar
 * descartaba en silencio un WhatsApp o un precio escrito y no publicado,
 * justo después de que el modal promete que NO cambian. El diseño del borrador
 * sí se descarta: eso es lo que se restauró.
 *
 * Fusión a tres bandas contra `base` (lo publicado que el editor cargó): solo
 * cuenta como cambio del admin la ruta donde el borrador difiere de `base`. En
 * las demás manda lo conservado en la fila, que puede ser MÁS NUEVO que lo que
 * esta pestaña cargó (otra pestaña u otro admin publicó en medio); tomar el
 * borrador completo reinyectaba esos valores viejos y el siguiente «Publicar»
 * los devolvía a la fila.
 */
export function conservarNegocioDelBorrador(
  conservados: SiteConfigOverrides,
  borrador: SiteConfigOverrides,
  base: SiteConfigOverrides,
): SiteConfigOverrides {
  const salida = copiaJson((conservados ?? {}) as ObjetoPlano)
  const fuente = (borrador ?? {}) as ObjetoPlano
  const cargado = (base ?? {}) as ObjetoPlano
  for (const ruta of CLAVES_NEGOCIO) {
    const b = leerRuta(fuente, ruta)
    const c = leerRuta(cargado, ruta)
    if (b.hay === c.hay && (!b.hay || mismoContenido(b.valor, c.valor))) continue
    if (b.hay) ponerRuta(salida, ruta, b.valor)
    else quitarRuta(salida, ruta)
  }
  return salida as SiteConfigOverrides
}

/**
 * Un dato del negocio conservado puede no pasar la validación de hoy (p. ej.
 * escrito a mano en la fila). Restaurar ya no lo limpia (regla de Kevin), así
 * que se avisa cuál es: si no, el siguiente «Publicar cambios» del editor lo
 * rechazaría sin decir por qué. Misma validación que el PUT, sobre el mismo
 * cuerpo que manda el editor. `null` = todo publicable.
 */
export function verificarConservados(
  overrides: SiteConfigOverrides,
  base: SiteConfig,
  origenStorage?: string,
): { error: string; clave: string | null } | null {
  const v = validarOverrides(prepararParaPublicar(overrides), base, { origenStorage })
  return v.ok ? null : { error: v.error, clave: v.clave ?? null }
}

/**
 * Un logo subido poco antes de restaurar puede estar a medio aplicar (la ruta
 * de subida fija el nombre, sube el archivo y después escribe la fila). Los de
 * los últimos minutos se dejan, salvo los que la fila de ANTES de restaurar ya
 * referenciaba (esos ya estaban aplicados): un huérfano en el bucket es
 * preferible a una landing apuntando a un archivo borrado.
 */
export const MARGEN_LOGOS_MS = 5 * 60 * 1000

/**
 * Nombre de un objeto de logo tal como lo sube POST /api/admin/configuracion/logo
 * (`logo-<claro|oscuro>-<milisegundos>.<ext>`, en la raíz del bucket).
 */
const RE_OBJETO_LOGO = /^logo-(claro|oscuro)-(\d+)\.[a-z0-9]+$/

/**
 * Qué objetos de la RAÍZ del bucket `branding` borrar al restaurar: solo los
 * logos (lo único que es diseño ahí) que la fila ya no referencia y que, o bien
 * su nombre marca una subida anterior a `antesDeMs`, o bien la fila de antes de
 * restaurar los usaba (`previos`: ya estaban aplicados, el margen no los
 * protege de nada). Cualquier otro objeto se deja.
 */
export function logosABorrar(
  nombresEnRaiz: ReadonlyArray<string>,
  referenciados: ReadonlySet<string>,
  antesDeMs: number,
  previos: ReadonlySet<string> = new Set(),
): string[] {
  return nombresEnRaiz.filter((n) => {
    const m = RE_OBJETO_LOGO.exec(n)
    return m !== null && !referenciados.has(n) && (Number(m[2]) < antesDeMs || previos.has(n))
  })
}
