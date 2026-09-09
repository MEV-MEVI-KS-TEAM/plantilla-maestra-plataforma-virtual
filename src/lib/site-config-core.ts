/**
 * "Personalizar mi página" (F1) — núcleo ISOMORFO de la configuración del sitio.
 *
 * Aquí viven los tipos, la lista blanca de claves editables, el merge y el
 * recorte público. NADA de `server-only`, `next/cache` ni Supabase: este archivo
 * lo importan el servidor (site-config.ts), el provider cliente
 * (site-config-provider.tsx), la API del editor y las pruebas unitarias. Si
 * entrara `next/cache` por aquí, se colaría al bundle del navegador por la
 * cadena del provider — la misma trampa que engordó la landing de 11.3 kB a
 * 25.4 kB cuando la purga vivía en catalogo.ts (ver src/lib/cursos/purga.ts).
 *
 * ARQUITECTURA (no negociable):
 *
 *   config.ts (defaults)  ⟵ deep-merge ⟵  public.site_config.data (overrides)
 *     └── getSiteConfig()  [server-only, cacheado por tag 'site-config']
 *
 * INVARIANTE SAGRADO: ~144 clientes clonan esta plantilla. Con la tabla vacía o
 * inexistente, `mergeSiteConfig(CONFIG, {})` tiene que ser deep-equal a CONFIG
 * — ni una clave distinta — para que la app renderice pixel-idéntica a hoy. Por
 * eso el merge es aditivo, la lista blanca es cerrada y los alias de precios
 * SOLO se sincronizan cuando el override correspondiente está presente.
 */
import { CONFIG } from '@/lib/config'

// ─── Tipos ───────────────────────────────────────────────────────────────────

/**
 * Ensancha los literales de `CONFIG`.
 *
 * `CONFIG` lleva `as const`, así que `nombre` es el literal `'MEV'` y
 * `precios.inscripcion` es el literal `599`. Los overrides que escribe el admin
 * son string/number/boolean arbitrarios: un `SiteConfig` tipado con literales
 * no podría contenerlos. Se ensancha recursivamente y, de paso, se quita el
 * `readonly` (el resultado del merge es un clon nuestro, no CONFIG).
 *
 * ARREGLO VACÍO LITERAL. Un `[]` bajo `as const` es la tupla `readonly []`, cuyo
 * elemento es `never`; ensancharla "al pie de la letra" daría `never[]`, un
 * arreglo al que no se le puede asignar NADA. En CONFIG hay dos así
 * (`landing.convenios`, `landing.respaldo_badges`) y los dos son listas de
 * etiquetas, así que se ensanchan a `string[]`. Si algún día un `[]` de CONFIG
 * guarda objetos, hay que tiparlo en config.ts con `as Array<…>`, como ya hace
 * `landing.testimonios`.
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends ReadonlyArray<infer U>
        ? [U] extends [never]
          ? string[]
          : Widen<U>[]
        : T extends object
          ? { -readonly [K in keyof T]: Widen<T[K]> }
          : T

/**
 * `readonly` recursivo. Es el tipo con el que viaja la config al navegador:
 * hoy `CONFIG` es `as const` (todo readonly) y los componentes ya viven con
 * eso; `useSiteConfig()` no debe ser MENOS estricto que lo que reemplaza, o un
 * `hero_badges.push(...)` compilaría y contaminaría al resto de consumidores
 * del mismo objeto de contexto.
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

/** La configuración YA fusionada (defaults + overrides). Es lo que consume la app. */
export type SiteConfig = Widen<typeof CONFIG>

/** `CONFIG` tal cual (literales) o una config ya ensanchada: las dos sirven de base. */
export type BaseSiteConfig = typeof CONFIG | SiteConfig

/** Un testimonio de la landing, con la forma que `LandingClient` pinta. */
export type Testimonio = SiteConfig['landing']['testimonios'][number]

/**
 * Rutas con puntos hasta la HOJA de un objeto (`'colores.acento'`,
 * `'landing.hero_badges'`). Los arreglos cuentan como hoja: se reemplazan
 * enteros, nunca se edita "el segundo badge".
 *
 * Existe para que `CLAVES_EDITABLES` se compruebe en COMPILACIÓN contra CONFIG:
 * una ruta con typo en la lista blanca no rompería nada visible, solo dejaría
 * ese campo silenciosamente ineditable en 144 escuelas.
 */
type RutasHoja<T, Prefijo extends string = ''> = {
  [K in keyof T & string]: T[K] extends ReadonlyArray<unknown>
    ? `${Prefijo}${K}`
    : T[K] extends object
      ? RutasHoja<T[K], `${Prefijo}${K}.`>
      : `${Prefijo}${K}`
}[keyof T & string]

// ─── Lista blanca ────────────────────────────────────────────────────────────

/**
 * Lo ÚNICO que el admin puede sobrescribir desde su panel en F1. Cualquier otra
 * clave que aparezca en `site_config.data` se ignora en silencio (defensa en
 * profundidad: la API valida antes de guardar, y el merge vuelve a filtrar al
 * leer, por si alguien escribe la fila a mano).
 *
 * QUÉ VALIDA EL MERGE Y QUÉ NO. Al leer se comprueba la FORMA: tipo de cada
 * hoja (ver `compatible`), forma de cada elemento de los arreglos (ver
 * `normalizarArreglo`), precios finitos y >= 0, y cadena no vacía donde un
 * `''` rompería el HTML (ver `SIN_VACIO`). NO se valida el VALOR: que un color
 * sea hex, que `whatsappUrl` sea una URL, que el logo exista. Eso es de la API
 * del editor (Fase 4), que rechaza antes de guardar y puede explicárselo al
 * admin; aquí ya no hay a quién avisar.
 *
 * FUERA DE F1 A PROPÓSITO — cambiar esto es cambiar el producto, no la marca, y
 * cada uno arrastra migraciones, rutas o lógica de cobro que un override en la
 * BD no puede acompañar:
 *   modo, niveles, prefijoMatricula, dominio, urlBase, licenciaturas.*,
 *   pagos.*, cursosIngreso.*, diploma.*, documentosRequeridos,
 *   landing.mostrarCatalogoCursos, landing.convenios.
 *
 * `modalidades` tiene semántica ESPECIAL (ver `SiteConfigOverrides`): en la BD
 * es un objeto por id, y solo se admiten `mensualidad` y `activa`.
 *
 * F3 convirtió en configurables los textos que estaban como literales en la
 * landing (`landing.hero_badge_superior` … `landing.cta_whatsapp`). Los
 * límites de longitud y la forma para el editor viven en
 * `site-config-campos.ts`; aquí solo la lista blanca y la forma que exige el
 * merge. Si se añade un ARREGLO, hay que darle normalizador en
 * `ELEMENTOS_ARREGLO` o el merge lo rechazará siempre (fail-closed; lo vigila
 * una prueba unitaria) y darle descriptor en el catálogo (otra prueba).
 */
export const CLAVES_EDITABLES = [
  // identidad
  'nombre',
  'nombreCompleto',
  'tagline',
  'cct',
  'landing.cct',
  // assets
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
  // textos de la landing (F2)
  'landing.hero_titulo',
  'landing.hero_highlight',
  'landing.hero_subtitulo',
  'landing.hero_badges',
  'landing.ciudad',
  'landing.respaldo_titulo',
  'landing.respaldo_badges',
  'landing.testimonios',
  'landing.catalogoTitulo',
  'landing.catalogoSubtitulo',
  // textos de la landing (F3): una clave por literal que antes vivía en el JSX
  'landing.hero_badge_superior',
  'landing.hero_cta_primario',
  'landing.hero_cta_whatsapp',
  'landing.contadores',
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
  // precios canónicos (los alias legacy se derivan de estos, ver derivarAliasPrecios)
  'precios.inscripcion',
  'precios.certificacionSecundaria',
  'precios.certificacionPreparatoria',
  // modalidades (semántica especial)
  'modalidades',
] as const satisfies ReadonlyArray<RutasHoja<SiteConfig>>

export type ClaveEditable = (typeof CLAVES_EDITABLES)[number]

/**
 * Subclaves de `landing` que están en la lista blanca (`'hero_titulo'`,
 * `'faq_items'`…). Se DERIVA de `CLAVES_EDITABLES` para que
 * `SiteConfigOverrides` no arrastre una segunda lista que haya que mantener a
 * mano: añadir la ruta arriba ya la mete aquí.
 */
type SubclaveLanding<C> = C extends `landing.${infer K}` ? K : never
export type ClaveLandingEditable = SubclaveLanding<ClaveEditable>

/** Etiqueta de caché de Next para la fila de overrides. La usa site-config.ts. */
export const SITE_CONFIG_TAG = 'site-config'

/** ¿La ruta (con puntos) está en la lista blanca? Útil para la API del editor. */
export function esClaveEditable(ruta: string): ruta is ClaveEditable {
  return (CLAVES_EDITABLES as ReadonlyArray<string>).includes(ruta)
}

// ─── Forma de los overrides (lo que vive en site_config.data) ───────────────

/**
 * Override de UNA modalidad. Solo estos dos campos: `id`, `meses`, `label` y
 * `materiasPorMes` definen el producto y siguen viviendo en config.ts.
 */
export interface OverrideModalidad {
  mensualidad?: number
  activa?: boolean
}

/**
 * Objeto anidado PARCIAL que espeja CONFIG solo en las claves de la lista
 * blanca. Todo opcional: lo que no venga se toma de config.ts.
 *
 * `modalidades` NO es un arreglo sino un objeto indexado por id
 * (`{ '3_meses': { mensualidad: 2500 } }`). Con un arreglo sería posible
 * agregar o quitar modalidades, reordenarlas o cambiar `meses` desde la BD, y
 * eso sí cambia el producto (cuántas materias se abren por mes, cuántos pagos
 * hay). Con un objeto por id, lo peor que puede pasar es un id desconocido, y
 * ese se ignora.
 */
export interface SiteConfigOverrides {
  nombre?: string
  nombreCompleto?: string
  tagline?: string
  cct?: string
  logo?: string
  logoOscuro?: string
  colores?: Partial<SiteConfig['colores']>
  whatsapp?: string
  whatsappUrl?: string
  whatsappDisplay?: string
  contactoTelefono?: string
  email?: string
  contactoEmail?: string
  redes?: Partial<SiteConfig['redes']>
  landing?: Partial<Pick<SiteConfig['landing'], ClaveLandingEditable>>
  precios?: Partial<
    Pick<SiteConfig['precios'], 'inscripcion' | 'certificacionSecundaria' | 'certificacionPreparatoria'>
  >
  modalidades?: { [id: string]: OverrideModalidad }
}

// ─── Utilidades internas ─────────────────────────────────────────────────────

type ObjetoPlano = Record<string, unknown>

function esObjetoPlano(v: unknown): v is ObjetoPlano {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Número finito y no negativo: lo único que tiene sentido como precio. */
function esPrecio(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
}

/** string, number finito o boolean. Lo que puede ser una hoja editable. */
function esHojaPrimitiva(v: unknown): v is string | number | boolean {
  return (
    typeof v === 'string' ||
    typeof v === 'boolean' ||
    (typeof v === 'number' && Number.isFinite(v))
  )
}

/**
 * Clon profundo por JSON. `structuredClone` sería más fiel, pero este módulo
 * corre también en el navegador (fallback del provider) y CONFIG es JSON puro
 * por diseño — viaja al cliente tal cual —, así que el round-trip no pierde
 * nada y funciona en cualquier runtime.
 */
function clonar<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/**
 * `Object.freeze` recursivo sobre objetos planos y arreglos. Lo usa el provider
 * cliente para su fallback de módulo (compartido por todos los consumidores
 * sin provider): mutarlo por accidente debe fallar en el acto, no contaminar
 * al siguiente componente que lea el contexto.
 */
export function congelarProfundo<T>(v: T): T {
  if (Array.isArray(v)) {
    for (const el of v) congelarProfundo(el)
    return Object.freeze(v)
  }
  if (esObjetoPlano(v)) {
    for (const k of Object.keys(v)) congelarProfundo(v[k])
    return Object.freeze(v)
  }
  return v
}

function leerRuta(obj: unknown, ruta: string): unknown {
  let actual: unknown = obj
  for (const seg of ruta.split('.')) {
    if (!esObjetoPlano(actual)) return undefined
    actual = actual[seg]
  }
  return actual
}

/**
 * Escribe en una ruta con puntos creando los intermedios que falten. Las rutas
 * salen SIEMPRE de `CLAVES_EDITABLES` (nunca del override), así que aquí no
 * entra un `__proto__` ni nada que no esté en la lista.
 */
function escribirRuta(obj: ObjetoPlano, ruta: string, valor: unknown): void {
  const segs = ruta.split('.')
  let actual: ObjetoPlano = obj
  for (const seg of segs.slice(0, -1)) {
    if (!esObjetoPlano(actual[seg])) actual[seg] = {}
    actual = actual[seg] as ObjetoPlano
  }
  actual[segs[segs.length - 1]] = valor
}

/**
 * ¿El override tiene el mismo tipo que el default? Un `nombre: 42` en la BD no
 * debe llegar a un `.toLowerCase()` en la landing.
 *
 * BASE AUSENTE O `null`. Un config.ts de cliente viejo puede no tener la clave
 * (p. ej. `landing.ciudad`, que se añadió después) o tenerla en `null` a
 * propósito. En los dos casos se acepta cualquier hoja primitiva o arreglo —
 * lo que el admin escriba desde el editor es mejor que nada — y se rechaza un
 * objeto, que abriría claves fuera de la lista. Los arreglos pasan después por
 * `normalizarArreglo`, que sí exige forma por ruta.
 */
function compatible(base: unknown, valor: unknown): boolean {
  if (base === undefined || base === null) return esHojaPrimitiva(valor) || Array.isArray(valor)
  if (typeof base === 'string') return typeof valor === 'string'
  if (typeof base === 'number') return typeof valor === 'number' && Number.isFinite(valor)
  if (typeof base === 'boolean') return typeof valor === 'boolean'
  if (Array.isArray(base)) return Array.isArray(valor)
  return false
}

/**
 * Claves de texto donde la cadena VACÍA se rechaza en el merge.
 *
 * Son las que acaban en un atributo que el navegador interpreta: `<img src="">`
 * vuelve a pedir la propia página y `<a href="">` la recarga. Un admin que
 * "borre" el logo desde el editor no quiere eso; quiere el default, y eso se
 * consigue NO mandando la clave (la API de Fase 4 la omite o manda `null`).
 *
 * `logoOscuro` NO está aquí a propósito: `''` significa "no hay variante para
 * fondo oscuro" y `LandingClient` cae a `logo` con un filtro de inversión.
 * Tampoco `landing.ciudad` ni `cct`: vacío = se omite el segmento en la UI.
 *
 * `whatsappUrl` SALIÓ de esta lista. Estaba por el `<a href="">` que recargaba
 * la página, pero ese enlace ya no se pinta sin número: la landing gatea los
 * tres CTA y el botón flotante. Ahora `''` significa lo mismo que en
 * `logoOscuro` — la escuela no tiene ese canal — y tenerlo aquí impedía
 * guardarlo, que es justo lo que necesita una escuela sin WhatsApp.
 */
const SIN_VACIO: ReadonlySet<ClaveEditable> = new Set<ClaveEditable>(['logo'])

// ─── Elementos de los arreglos editables ─────────────────────────────────────

/**
 * Normalizador de UN elemento: devuelve el elemento limpio, o `undefined` si
 * no tiene la forma que el consumidor espera.
 */
type NormalizadorElemento = (el: unknown) => unknown

const normalizarEtiqueta: NormalizadorElemento = (el) => (typeof el === 'string' ? el : undefined)

/** Forma de un campo de un elemento-objeto: cadena, o número finito >= 0. */
type FormaCampo = 'texto' | 'numero'

/**
 * Fabrica el normalizador de un objeto con campos fijos. Un elemento válido es
 * un objeto plano con TODOS los campos y del tipo indicado; se PROYECTA a esos
 * campos, así que una clave extra en la fila no viaja al navegador (el
 * provider serializa `landing` entero en el HTML de cada página).
 *
 * Cada uso lleva `satisfies Record<keyof Elemento, FormaCampo>`: comprueba en
 * compilación las dos direcciones — que cada campo exista en el tipo y que no
 * falte ninguno si alguien amplía el tipo en config.ts.
 */
function normalizadorObjeto(forma: Record<string, FormaCampo>): NormalizadorElemento {
  const campos = Object.keys(forma)
  return (el) => {
    if (!esObjetoPlano(el)) return undefined
    const limpio: Record<string, string | number> = {}
    for (const campo of campos) {
      const v = el[campo]
      if (forma[campo] === 'texto' ? typeof v !== 'string' : !esPrecio(v)) return undefined
      limpio[campo] = v as string | number
    }
    return limpio
  }
}

type Landing = SiteConfig['landing']

const normalizarTestimonio = normalizadorObjeto({
  name: 'texto', age: 'texto', nivel: 'texto', initials: 'texto', quote: 'texto',
} satisfies Record<keyof Testimonio, FormaCampo>)

const normalizarContador = normalizadorObjeto({
  valor: 'numero', sufijo: 'texto', etiqueta: 'texto', sub: 'texto',
} satisfies Record<keyof Landing['contadores'][number], FormaCampo>)

const normalizarDolorItem = normalizadorObjeto({
  icono: 'texto', titulo: 'texto', desc: 'texto',
} satisfies Record<keyof Landing['dolor_items'][number], FormaCampo>)

const normalizarPaso = normalizadorObjeto({
  titulo: 'texto', desc: 'texto',
} satisfies Record<keyof Landing['proceso_pasos'][number], FormaCampo>)

const normalizarBeneficio = normalizadorObjeto({
  titulo: 'texto', desc: 'texto',
} satisfies Record<keyof Landing['beneficios_items'][number], FormaCampo>)

const normalizarFaq = normalizadorObjeto({
  q: 'texto', a: 'texto',
} satisfies Record<keyof Landing['faq_items'][number], FormaCampo>)

/**
 * Forma exigida a CADA elemento de los arreglos editables, por ruta.
 * `compatible` solo mira la hoja ("¿es arreglo?"); esto mira adentro. Sin esto,
 * un `testimonios: [null]` escrito a mano en la fila pasaría íntegro y el
 * `testimonios.map(t => t.name)` de la landing tiraría la página entera de la
 * escuela (500) — exactamente lo que la defensa en profundidad promete evitar.
 *
 * Toda ruta de `CLAVES_EDITABLES` que sea arreglo en CONFIG NECESITA entrada
 * aquí (lo vigila una prueba); sin ella, `normalizarArreglo` rechaza.
 */
const ELEMENTOS_ARREGLO: Partial<Record<ClaveEditable, NormalizadorElemento>> = {
  'landing.hero_badges': normalizarEtiqueta,
  'landing.respaldo_badges': normalizarEtiqueta,
  'landing.testimonios': normalizarTestimonio,
  'landing.contadores': normalizarContador,
  'landing.dolor_items': normalizarDolorItem,
  'landing.transformacion_sin': normalizarEtiqueta,
  'landing.transformacion_con': normalizarEtiqueta,
  'landing.proceso_pasos': normalizarPaso,
  'landing.beneficios_items': normalizarBeneficio,
  'landing.faq_items': normalizarFaq,
}

/**
 * Devuelve un arreglo NUEVO con cada elemento normalizado, o `undefined` si la
 * ruta no admite arreglos o algún elemento no cumple. Se rechaza el arreglo
 * ENTERO en vez de filtrar: un elemento roto delata una fila escrita a mano
 * (la API de Fase 4 no lo deja pasar), y ante eso es más honesto mostrar los
 * defaults que media lista. Exportado para que la API valide con la misma
 * regla que el merge.
 */
export function normalizarArreglo(ruta: ClaveEditable, valor: ReadonlyArray<unknown>): unknown[] | undefined {
  const normalizar = ELEMENTOS_ARREGLO[ruta]
  if (!normalizar) return undefined
  const salida: unknown[] = []
  for (const el of valor) {
    const limpio = normalizar(el)
    if (limpio === undefined) return undefined
    salida.push(limpio)
  }
  return salida
}

// ─── Merge ───────────────────────────────────────────────────────────────────

/**
 * Lo que `derivarAliasPrecios` necesita saber: qué overrides de precio se
 * APLICARON de verdad (presentes y válidos). Un override ausente o rechazado
 * no deriva nada.
 */
export interface PreciosAplicados {
  certificacionSecundaria?: number
  certificacionPreparatoria?: number
  /** Una entrada por modalidad cuya mensualidad se sobrescribió. `meses` sale de la BASE, no del id. */
  mensualidades?: ReadonlyArray<{ meses: number; mensualidad: number }>
}

/**
 * Sincroniza los alias legacy de precios con los valores canónicos recién
 * aplicados. MUTA `cfg` (que es siempre el clon fresco del merge) y lo devuelve.
 *
 * POR QUÉ SOLO CON OVERRIDE PRESENTE. config.ts arrastra alias históricos
 * (`precios.certificacion_secundaria`, `landing.certificacion_secundaria`, los
 * `*_3meses_*` / `*_6meses_*`, `plan3mMensualidad`…) que distintas pantallas
 * siguen leyendo. Un cliente puede tenerlos divergentes A PROPÓSITO en su
 * config.ts (precio sindicalizado distinto del normal, p. ej.). Si se
 * "normalizaran" siempre, con la BD vacía la app cambiaría — y ese es el
 * invariante que no se rompe. Solo cuando el admin toca el canónico desde el
 * editor es razonable que los alias lo sigan: es lo que él ve en pantalla.
 *
 * MENSUALIDADES: los alias se eligen por los `meses` de la modalidad en la
 * base, NO por el id. Un cliente puede tener ids distintos de '3_meses' /
 * '6_meses'; lo que define a qué plan pertenece el precio es la duración. Una
 * modalidad con otros `meses` (9, 12…) no tiene alias legacy y no deriva nada.
 */
export function derivarAliasPrecios(cfg: SiteConfig, aplicados: PreciosAplicados): SiteConfig {
  if (aplicados.certificacionSecundaria !== undefined) {
    cfg.precios.certificacion_secundaria = aplicados.certificacionSecundaria
    cfg.landing.certificacion_secundaria = aplicados.certificacionSecundaria
  }
  if (aplicados.certificacionPreparatoria !== undefined) {
    cfg.precios.certificacion_preparatoria = aplicados.certificacionPreparatoria
    cfg.landing.certificacion_preparatoria = aplicados.certificacionPreparatoria
  }
  for (const { meses, mensualidad } of aplicados.mensualidades ?? []) {
    if (meses === 3) {
      cfg.precios.plan3mMensualidad = mensualidad
      cfg.precios.secundaria_3meses_normal = mensualidad
      cfg.precios.secundaria_3meses_sindicalizado = mensualidad
      cfg.precios.preparatoria_3meses_normal = mensualidad
      cfg.precios.preparatoria_3meses_sindicalizado = mensualidad
    } else if (meses === 6) {
      cfg.precios.plan6mMensualidad = mensualidad
      cfg.precios.secundaria_6meses_normal = mensualidad
      cfg.precios.secundaria_6meses_sindicalizado = mensualidad
      cfg.precios.preparatoria_6meses_normal = mensualidad
      cfg.precios.preparatoria_6meses_sindicalizado = mensualidad
    }
    // Otros `meses`: sin alias legacy, no se deriva nada.
  }
  return cfg
}

/**
 * Aplica `overrides.modalidades` (objeto por id) sobre el arreglo del clon.
 * El resultado conserva orden y longitud de la base; solo cambian
 * `mensualidad` y `activa` de los ids que existan. Devuelve las mensualidades
 * aplicadas (con los `meses` de la base) para derivar alias.
 */
function aplicarModalidades(
  cfg: SiteConfig,
  overrides: unknown,
): ReadonlyArray<{ meses: number; mensualidad: number }> {
  if (!esObjetoPlano(overrides)) return []
  const aplicadas: Array<{ meses: number; mensualidad: number }> = []
  for (const modalidad of cfg.modalidades) {
    const ov = overrides[modalidad.id]
    if (!esObjetoPlano(ov)) continue
    if (esPrecio(ov.mensualidad)) {
      modalidad.mensualidad = ov.mensualidad
      aplicadas.push({ meses: modalidad.meses, mensualidad: ov.mensualidad })
    }
    if (typeof ov.activa === 'boolean') {
      modalidad.activa = ov.activa
    }
  }
  return aplicadas
}

/**
 * Fusiona los defaults de config.ts con los overrides de la BD.
 *
 *  - NUNCA muta `base`: devuelve un clon profundo nuevo.
 *  - Solo aplica claves de `CLAVES_EDITABLES`; el resto se ignora en silencio.
 *  - `undefined` / `null` en un override = "sin override" para esa clave.
 *  - Un override de tipo distinto al default se ignora (ver `compatible`).
 *  - Los arreglos (hero_badges, testimonios, faq_items…) se reemplazan
 *    completos y cada elemento debe tener la forma esperada
 *    (`normalizarArreglo`); si uno falla, se ignora el arreglo entero. El
 *    editor no edita "un badge": manda la lista entera.
 *  - `''` se ignora en las claves de `SIN_VACIO` (logo, whatsappUrl).
 *  - `modalidades` y los alias de precios tienen su semántica aparte
 *    (`aplicarModalidades`, `derivarAliasPrecios`).
 *  - `overrides` que no sea un objeto plano (null, string, número, arreglo…)
 *    → se devuelve el clon de la base sin lanzar. La fila de la BD la puede
 *    haber escrito cualquiera; el render no se rompe por eso.
 *
 * El resultado no comparte referencias ni con `base` ni con `overrides`: las
 * hojas primitivas se copian por valor y los arreglos salen nuevos de
 * `normalizarArreglo`. Importa porque la fila leída la reutiliza
 * `unstable_cache` entre renders.
 *
 * Con `overrides = {}` el resultado es deep-equal a `base` (lo protegen las
 * pruebas de tests/unit/site-config.spec.ts).
 */
export function mergeSiteConfig(base: BaseSiteConfig, overrides: unknown): SiteConfig {
  const resultado = clonar(base) as SiteConfig
  if (!esObjetoPlano(overrides)) return resultado

  const aplicados: PreciosAplicados = {}

  for (const ruta of CLAVES_EDITABLES) {
    if (ruta === 'modalidades') continue // semántica aparte, abajo
    const valor = leerRuta(overrides, ruta)
    if (valor === undefined || valor === null) continue
    const actual = leerRuta(resultado, ruta)
    if (!compatible(actual, valor)) continue
    if (typeof valor === 'string' && SIN_VACIO.has(ruta) && valor.trim() === '') continue
    // Los precios exigen además ser >= 0; un número negativo no es un precio.
    if (ruta.startsWith('precios.') && !esPrecio(valor)) continue

    const final = Array.isArray(valor) ? normalizarArreglo(ruta, valor) : valor
    if (final === undefined) continue
    escribirRuta(resultado as unknown as ObjetoPlano, ruta, final)

    if (ruta === 'precios.certificacionSecundaria') aplicados.certificacionSecundaria = valor as number
    if (ruta === 'precios.certificacionPreparatoria') aplicados.certificacionPreparatoria = valor as number
  }

  aplicados.mensualidades = aplicarModalidades(resultado, overrides.modalidades)

  return derivarAliasPrecios(resultado, aplicados)
}

// ─── Subconjunto público (lo que viaja al navegador) ────────────────────────

/**
 * Claves de `SiteConfig` que se exponen al cliente vía `SiteConfigProvider`.
 * Nada más: lo no editable (niveles, dominio, modo, pagos, licenciaturas…) los
 * componentes lo siguen leyendo de CONFIG como hoy, y así el provider no
 * duplica en el HTML cosas que ya vienen en el bundle.
 *
 * `landing` NO está aquí A PROPÓSITO (hardening). El provider serializa este
 * objeto en el HTML de CADA página de la app —dashboard del alumno, panel de
 * admin, login…— y `landing` es con diferencia la clave más pesada (42 textos,
 * testimonios, FAQ, beneficios: varios kB por página). Ningún consumidor de
 * `useSiteConfig()` la lee: la ÚNICA pantalla que pinta `landing` es la landing
 * pública, y la recibe por PROPS desde su Server Component (ver
 * `toLandingConfig` y src/app/page.tsx). Si algún día un componente cliente
 * necesitara un texto de `landing`, que se lo pasen por props igual — volver a
 * meterla aquí es pagar el peso en las ~30 rutas que no la usan.
 */
export const CLAVES_PUBLICAS = [
  'nombre',
  'nombreCompleto',
  'tagline',
  'cct',
  'logo',
  'logoOscuro',
  'colores',
  'whatsapp',
  'whatsappUrl',
  'whatsappDisplay',
  'email',
  'contactoEmail',
  'contactoTelefono',
  'redes',
  'precios',
  'modalidades',
] as const

/**
 * Lo que recibe el navegador. `DeepReadonly` porque es un objeto de contexto
 * compartido por todos los componentes de la página: ver el comentario del
 * tipo.
 */
export type PublicSiteConfig = DeepReadonly<Pick<SiteConfig, (typeof CLAVES_PUBLICAS)[number]>>

/**
 * Recorta la config fusionada a `PublicSiteConfig`. Se toma clave por clave
 * (no con spread + delete) para que una clave nueva en CONFIG no salga al
 * navegador sin que alguien la agregue a `CLAVES_PUBLICAS` a propósito.
 *
 * COMPARTE referencias con `cfg` (`pub.colores === cfg.colores`): no clona.
 * Es correcto porque `cfg` es siempre un clon fresco de `mergeSiteConfig` que
 * nadie más retiene, y clonar aquí sería pagar dos veces. Si algún día `cfg`
 * viniera de una caché compartida, habría que clonar.
 */
export function toPublicSiteConfig(cfg: SiteConfig): PublicSiteConfig {
  return {
    nombre: cfg.nombre,
    nombreCompleto: cfg.nombreCompleto,
    tagline: cfg.tagline,
    cct: cfg.cct,
    logo: cfg.logo,
    logoOscuro: cfg.logoOscuro,
    colores: cfg.colores,
    whatsapp: cfg.whatsapp,
    whatsappUrl: cfg.whatsappUrl,
    whatsappDisplay: cfg.whatsappDisplay,
    email: cfg.email,
    contactoEmail: cfg.contactoEmail,
    contactoTelefono: cfg.contactoTelefono,
    redes: cfg.redes,
    precios: cfg.precios,
    modalidades: cfg.modalidades,
  }
}

/**
 * Lo que recibe la LANDING pública: el recorte público + `landing`.
 *
 * Es la única pantalla que pinta los textos de `landing.*`, y los recibe por
 * PROPS desde su Server Component (src/app/page.tsx) en vez de por el contexto
 * — así el peso de esos 42 textos se paga en la ruta que los usa y en ninguna
 * otra (ver `CLAVES_PUBLICAS`).
 */
export type LandingConfig = PublicSiteConfig & { landing: DeepReadonly<SiteConfig['landing']> }

/**
 * `toPublicSiteConfig` + `landing`. Mismas reglas que aquél: no clona, comparte
 * referencias con `cfg` (que es siempre un clon fresco del merge).
 */
export function toLandingConfig(cfg: SiteConfig): LandingConfig {
  return { ...toPublicSiteConfig(cfg), landing: cfg.landing }
}

// ─── Placeholders de los textos de la landing ────────────────────────────────

/**
 * Los `{x}` que la landing sustituye al pintar. Qué vale cada uno:
 *   duracion       → getDuracionLabel() con las modalidades del config FUSIONADO
 *   nombre         → cfg.nombre
 *   nombreCompleto → cfg.nombreCompleto
 *   whatsapp       → cfg.whatsapp
 *   inscripcion    → cfg.precios.inscripcion formateado como hoy (fmt de la landing)
 * La lista es cerrada: el editor la muestra como ayuda y el catálogo
 * (`site-config-campos.ts`) la referencia por tipo.
 */
export const PLACEHOLDERS = ['duracion', 'nombre', 'nombreCompleto', 'whatsapp', 'inscripcion'] as const

export type Placeholder = (typeof PLACEHOLDERS)[number]

/**
 * Sustituye cada `{clave}` de `texto` por `vars[clave]`. Un placeholder que no
 * esté en `vars` se deja TAL CUAL: es más honesto que un hueco, y así un texto
 * escrito por el admin con llaves "de verdad" no desaparece. Isomorfo a
 * propósito: lo usa LandingClient (cliente) y cualquier Server Component.
 *
 * Solo cuenta como placeholder un identificador (`{duracion}`, `{nombre}`):
 * `{}` o `{1 mes}` no se tocan. Se consulta con `hasOwnProperty` para que un
 * `{constructor}` no pesque algo del prototipo del objeto de vars.
 */
export function interpolar(texto: string, vars: Record<string, string | number>): string {
  return texto.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (todo, clave: string) => {
    if (!Object.prototype.hasOwnProperty.call(vars, clave)) return todo
    const v = vars[clave]
    return v === undefined || v === null ? todo : String(v)
  })
}
