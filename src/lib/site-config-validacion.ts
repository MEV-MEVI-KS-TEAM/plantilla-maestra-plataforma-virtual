/**
 * "Personalizar mi página" (F4) — VALIDACIÓN del cuerpo que manda el editor.
 *
 * Es la frontera entre lo que escribe el admin en su navegador y lo que acaba
 * en `public.site_config.data`. El merge (site-config-core.ts) vuelve a filtrar
 * al LEER, pero ahí ya no hay a quién explicarle nada: un valor rechazado se
 * ignora en silencio y el admin ve "no guardó". Aquí se rechaza ANTES de
 * guardar y con un mensaje en español y la clave del campo, para que el editor
 * lo pinte junto al control.
 *
 * ISOMORFO a propósito: sin `server-only`, sin `next/cache`, sin Supabase.
 * Lo consumen la API (route.ts) y las pruebas unitarias, y el editor (Fase 5)
 * puede prevalidar en el navegador con exactamente la misma regla. Lo único
 * que depende del entorno — el origen del Storage donde viven los logos — se
 * recibe como parámetro (`opciones.origenStorage`).
 *
 * SEMÁNTICA DEL CUERPO: es el objeto COMPLETO de overrides. Se REEMPLAZA la
 * fila, no se fusiona con la anterior: lo que no viene, no queda. `null` en una
 * hoja significa "sin override" (vuelve al default de config.ts); los objetos
 * intermedios que queden vacíos se eliminan.
 *
 * QUÉ SE DEVUELVE: el objeto LIMPIO (texto con trim, hex en mayúsculas,
 * `whatsappUrl` derivado, nulls fuera), listo para el upsert. Nunca el cuerpo
 * tal cual: el cuerpo lo escribió el cliente.
 */
import { z } from 'zod'
import {
  CLAVES_EDITABLES,
  esClaveEditable,
  normalizarArreglo,
  type ClaveEditable,
  type ClaveLandingEditable,
  type SiteConfig,
  type SiteConfigOverrides,
} from '@/lib/site-config-core'
import { campoPorClave, type Campo, type Subcampo } from '@/lib/site-config-campos'

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export interface OpcionesValidacion {
  /**
   * Origen (`https://xxx.supabase.co`) del Storage donde la ruta de subida deja
   * los logos. Sin él, `logo` / `logoOscuro` solo admiten el default y
   * `/logo.png`: en la API se pasa desde `NEXT_PUBLIC_SUPABASE_URL`.
   */
  origenStorage?: string
}

export type ResultadoValidacion =
  | { ok: true; overrides: SiteConfigOverrides }
  | { ok: false; error: string; clave?: string }

/**
 * La config recortada a lo que el editor muestra: solo rutas de
 * `CLAVES_EDITABLES`, con `modalidades` como el ARREGLO completo (el editor
 * pinta id/label/meses/materiasPorMes aunque solo edite mensualidad/activa).
 */
export interface ConfigEditable {
  nombre: string
  nombreCompleto: string
  tagline: string
  cct: string
  logo: string
  logoOscuro: string
  colores: SiteConfig['colores']
  whatsapp: string
  whatsappUrl: string
  whatsappDisplay: string
  contactoTelefono: string
  email: string
  contactoEmail: string
  redes: SiteConfig['redes']
  landing: Pick<SiteConfig['landing'], ClaveLandingEditable>
  precios: Pick<SiteConfig['precios'], 'inscripcion' | 'certificacionSecundaria' | 'certificacionPreparatoria'>
  modalidades: SiteConfig['modalidades']
  tipoCambioMXN: number
}

/**
 * ⚠️ `moneda` NO está aquí a propósito. Lo que sale de `recortarAEditables` es
 * exactamente lo que el editor puede reenviar en su PUT, y una clave fuera de
 * `CLAVES_EDITABLES` se rechaza con "Clave no editable" (fail-closed). Los
 * componentes del editor que necesitan la moneda para FORMATEAR la leen de
 * `CONFIG` directamente: no se puede sobrescribir, así que siempre es la misma.
 */

// ─── Storage de branding (helpers isomorfos) ─────────────────────────────────

/** Prefijo del path de una URL pública del bucket `branding` de Supabase Storage. */
export const PREFIJO_PUBLICO_BRANDING = '/storage/v1/object/public/branding/'

/**
 * Un objeto del bucket es UN archivo en la raíz con nombre "seguro": lo que
 * escribe la ruta de subida (`logo-claro-1712345678.png`). Sin subcarpetas ni
 * `..`, sin espacios ni caracteres que un `<img src>` pudiera interpretar.
 */
const NOMBRE_OBJETO_BRANDING = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/

/** Origen normalizado (`https://host[:puerto]`) o `undefined` si no es una URL. */
export function normalizarOrigen(origen: string | undefined | null): string | undefined {
  if (!origen) return undefined
  try {
    return new URL(origen).origin
  } catch {
    return undefined
  }
}

/**
 * Si `url` apunta a un objeto del bucket `branding` del `origen` dado, devuelve
 * su path dentro del bucket (`logo-claro-1712345678.png`); si no, `null`. Es la
 * comprobación que comparten la validación de `logo` (aquí) y el borrado del
 * logo anterior (site-config-storage.ts): una sola definición de "es nuestro".
 */
export function pathDesdeUrlBranding(url: unknown, origen: string | undefined): string | null {
  if (typeof url !== 'string' || !origen) return null
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.origin !== origen) return null
  if (u.username || u.password) return null
  if (!u.pathname.startsWith(PREFIJO_PUBLICO_BRANDING)) return null
  let nombre: string
  try {
    nombre = decodeURIComponent(u.pathname.slice(PREFIJO_PUBLICO_BRANDING.length))
  } catch {
    return null
  }
  return NOMBRE_OBJETO_BRANDING.test(nombre) ? nombre : null
}

// ─── Utilidades internas ─────────────────────────────────────────────────────

type ObjetoPlano = Record<string, unknown>

function esObjetoPlano(v: unknown): v is ObjetoPlano {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function leerRuta(obj: unknown, ruta: string): unknown {
  let actual: unknown = obj
  for (const seg of ruta.split('.')) {
    if (!esObjetoPlano(actual)) return undefined
    actual = actual[seg]
  }
  return actual
}

/** Las rutas salen SIEMPRE de `CLAVES_EDITABLES`, nunca del cuerpo. */
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
 * Nombres que NUNCA se aceptan como clave, a ninguna profundidad. Un
 * `JSON.parse` los crea como propiedades propias y un `for…in` o un spread
 * posterior podrían contaminar el prototipo. Se rechazan antes de leerlos.
 */
const CLAVES_PROHIBIDAS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Objetos INTERMEDIOS de la lista blanca (`colores`, `landing`, `precios`,
 * `redes`): los únicos niveles por los que se puede bajar. Derivados de
 * `CLAVES_EDITABLES`, no escritos a mano.
 */
const PREFIJOS_INTERMEDIOS: ReadonlySet<string> = (() => {
  const s = new Set<string>()
  for (const ruta of CLAVES_EDITABLES) {
    const segs = ruta.split('.')
    for (let i = 1; i < segs.length; i++) s.add(segs.slice(0, i).join('.'))
  }
  return s
})()

type Fallo = { ok: false; error: string; clave?: string }
type Limpio<T> = { ok: true; valor: T }

function fallo(error: string, clave?: string): Fallo {
  return { ok: false, error, clave }
}

// ─── Reglas por tipo ─────────────────────────────────────────────────────────

/**
 * Caracteres que NUNCA deben viajar dentro de un texto de la landing, con o
 * sin el salto de línea (`\n`) según el tipo de control.
 *
 * No basta con C0 + DEL: el texto acaba en el HTML de TODAS las páginas (el
 * provider serializa `landing` entero) y en el JSON de la API.
 *   \u007F-\u009F  DEL y los controles C1. Incluye U+0085 (NEL), que el
 *                navegador trata como salto de línea y `String.trim` no toca.
 *   \u2028\u2029   separadores de línea y de párrafo: saltos de línea
 *                invisibles que además rompen literales de JavaScript.
 *   \u202A-\u202E  controles bidi de embedding y override. Con U+202E el
 *   \u2066-\u2069  admin vería un texto y la landing pintaría otro (el
 *                truco clásico del "archivo.exe" que se lee "archivo.txt").
 *
 * Los invisibles de ancho cero (U+200B…) NO se rechazan: se ignoran al medir
 * si el campo quedó vacío (ver `vacioTrasTrim`), que es el único daño que hacen.
 */
const CONTROL_SIN_NL = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/
const CONTROL_TODOS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/

/**
 * Invisibles de ancho cero y marcas de dirección que `String.prototype.trim`
 * NO quita (salvo el BOM). Un campo con SOLO estos está vacío para quien lo
 * lee: sin esto, un `nombre: '\u200B'` pasaría el "no puede quedar vacío" y
 * la cabecera de la escuela saldría en blanco.
 */
const INVISIBLES = /[\u200B-\u200F\u2060\uFEFF]/g

/** ¿El texto queda vacío una vez fuera lo invisible? */
function vacioTrasTrim(v: string): boolean {
  return v.replace(INVISIBLES, '').trim() === ''
}

interface ReglaTexto {
  etiqueta: string
  max: number
  /** textarea: admite `\n` (se normalizan `\r\n` y `\r`). */
  multilinea: boolean
  /** `''` se admite SOLO donde el default de config.ts es `''`. */
  admiteVacio: boolean
}

/**
 * Texto plano: string, trim, sin `<` ni `>` (nada de HTML: la landing lo pinta
 * como texto, pero un `<script>` guardado en la BD es una bomba esperando a un
 * consumidor que use `dangerouslySetInnerHTML`), sin caracteres de control y
 * dentro del máximo del descriptor.
 */
function validarTexto(valor: unknown, r: ReglaTexto): Limpio<string> | Fallo {
  if (typeof valor !== 'string') return fallo(`El campo ${r.etiqueta} debe ser texto`)
  let v = r.multilinea ? valor.replace(/\r\n?/g, '\n') : valor
  v = v.trim()
  if (vacioTrasTrim(v)) {
    return r.admiteVacio ? { ok: true, valor: '' } : fallo(`El campo ${r.etiqueta} no puede quedar vacío`)
  }
  if (/[<>]/.test(v)) return fallo(`El campo ${r.etiqueta} no admite los caracteres < ni >`)
  if ((r.multilinea ? CONTROL_SIN_NL : CONTROL_TODOS).test(v)) {
    return fallo(
      r.multilinea
        ? `El campo ${r.etiqueta} contiene caracteres no permitidos`
        : `El campo ${r.etiqueta} no admite saltos de línea ni caracteres de control`,
    )
  }
  if (v.length > r.max) return fallo(`El campo ${r.etiqueta} supera los ${r.max} caracteres`)
  return { ok: true, valor: v }
}

const HEX = /^#[0-9A-Fa-f]{6}$/

function validarHex(valor: unknown, etiqueta: string): Limpio<string> | Fallo {
  if (typeof valor !== 'string' || !HEX.test(valor.trim())) {
    return fallo(`El color ${etiqueta} debe ser un hex de 6 dígitos (#RRGGBB)`)
  }
  return { ok: true, valor: valor.trim().toUpperCase() }
}

const TELEFONO = /^\d{10,13}$/

function validarTelefono(valor: unknown, etiqueta: string): Limpio<string> | Fallo {
  if (typeof valor !== 'string' || !TELEFONO.test(valor.trim())) {
    return fallo(`El campo ${etiqueta} debe tener entre 10 y 13 dígitos, sin espacios ni signos`)
  }
  return { ok: true, valor: valor.trim() }
}

const esquemaEmail = z.email()

function validarEmail(valor: unknown, etiqueta: string, max: number): Limpio<string> | Fallo {
  if (typeof valor !== 'string') return fallo(`El campo ${etiqueta} debe ser texto`)
  const v = valor.trim()
  if (v.length > max) return fallo(`El campo ${etiqueta} supera los ${max} caracteres`)
  if (!esquemaEmail.safeParse(v).success) return fallo(`El campo ${etiqueta} no es un correo válido`)
  return { ok: true, valor: v }
}

/**
 * Número con hasta 4 decimales, para el tipo de cambio. Se acepta la cadena que
 * el admin teclea ('16.90', y también '16,90' porque su teclado tiene coma) y
 * se redondea a 4 decimales: más precisión que esa no la publica ningún banco y
 * guardarla invita a diferencias de un centavo entre pantallas.
 *
 * El 0 es válido y significa "no mostrar equivalencia": es la salida del admin
 * que no quiere anunciar un tipo de cambio que no puede mantener al día.
 */
function validarDecimal(valor: unknown, etiqueta: string, min: number, max: number): Limpio<number> | Fallo {
  const crudo = typeof valor === 'string' ? Number(valor.trim().replace(',', '.')) : valor
  const r = z.number().min(min).max(max).safeParse(crudo)
  if (!r.success || !Number.isFinite(r.data)) {
    return fallo(`El campo ${etiqueta} debe ser un número entre ${min} y ${max}`)
  }
  return { ok: true, valor: Math.round(r.data * 10000) / 10000 }
}

function validarEntero(valor: unknown, etiqueta: string, min: number, max: number): Limpio<number> | Fallo {
  const r = z.int().min(min).max(max).safeParse(valor)
  if (!r.success) return fallo(`El campo ${etiqueta} debe ser un entero entre ${min} y ${max}`)
  return { ok: true, valor: r.data }
}

/**
 * Dominios admitidos en `redes.*`: el host exacto o un subdominio (www., m.,
 * es-la.…). La lista es la misma para las dos claves a propósito: un enlace de
 * Facebook en el campo de Instagram es un error del admin, no un ataque, y el
 * icono que se pinta lo decide la clave, no la URL.
 */
const DOMINIOS_REDES: ReadonlyArray<string> = ['facebook.com', 'fb.com', 'instagram.com']

function hostPermitido(host: string, dominios: ReadonlyArray<string>): boolean {
  const h = host.toLowerCase()
  return dominios.some((d) => h === d || h.endsWith(`.${d}`))
}

/**
 * `''` (no se muestra el icono) o URL https a uno de los dominios de la lista,
 * sin credenciales embebidas (`https://user:pass@…`), dentro del máximo.
 */
function validarRed(valor: unknown, etiqueta: string, max: number): Limpio<string> | Fallo {
  if (typeof valor !== 'string') return fallo(`El campo ${etiqueta} debe ser texto`)
  const v = valor.trim()
  if (v === '') return { ok: true, valor: '' }
  if (v.length > max) return fallo(`El campo ${etiqueta} supera los ${max} caracteres`)
  if (CONTROL_TODOS.test(v) || /[<>"'\s]/.test(v)) return fallo(`El campo ${etiqueta} contiene caracteres no permitidos`)
  let u: URL
  try {
    u = new URL(v)
  } catch {
    return fallo(`El campo ${etiqueta} debe ser una URL completa (https://…)`)
  }
  if (u.protocol !== 'https:') return fallo(`El campo ${etiqueta} debe empezar por https://`)
  if (u.username || u.password) return fallo(`El campo ${etiqueta} no admite credenciales en la URL`)
  if (!hostPermitido(u.hostname, DOMINIOS_REDES)) {
    return fallo(`El campo ${etiqueta} debe apuntar a facebook.com, fb.com o instagram.com`)
  }
  return { ok: true, valor: v }
}

/**
 * `logo` / `logoOscuro` NO se escriben a mano: el archivo lo sube
 * `POST /api/admin/configuracion/logo` — que es quien escribe la URL — y lo
 * quita su `DELETE`. El PUT del editor IGNORA las dos claves y conserva las de
 * la fila, así que esta función ya no ve lo que manda el cliente: es DEFENSA EN
 * PROFUNDIDAD y la regla con la que se recorta lo que YA está guardado. Solo el
 * default, `/logo.png` o un objeto de NUESTRO bucket; cualquier otra URL — un
 * CDN ajeno, un `data:` — se rechaza: es lo que acaba en un `<img src>` de la
 * landing pública y en el `<Image>` del recibo PDF.
 *
 * `''` SOLO en `logoOscuro`: significa "no hay variante para fondo oscuro" y la
 * landing cae a `logo` (por eso `logoOscuro` no está en `SIN_VACIO`, ver
 * site-config-core.ts). En `logo`, `''` sería un `<img src="">`, que hace al
 * navegador volver a pedir la propia página.
 *
 * Se devuelve la forma CANÓNICA `origin + pathname`: sin query ni hash — un
 * `?v=2` pegado al final haría de dos guardados del mismo archivo dos URLs
 * distintas, y `borrarLogoSiEsDelBucket` compara por igualdad — y con el host
 * en minúsculas, que es como lo escribe el SDK al componer la URL pública.
 */
function validarLogo(
  valor: unknown,
  etiqueta: string,
  max: number,
  defaultBase: unknown,
  origenStorage: string | undefined,
  admiteVacio: boolean,
): Limpio<string> | Fallo {
  if (typeof valor !== 'string') return fallo(`El campo ${etiqueta} debe ser texto`)
  const v = valor.trim()
  if (v === '') {
    return admiteVacio ? { ok: true, valor: '' } : fallo(`El campo ${etiqueta} no puede quedar vacío`)
  }
  if (v.length > max) return fallo(`El campo ${etiqueta} supera los ${max} caracteres`)
  // Nada que un atributo HTML pudiera cerrar antes de tiempo, ni espacios.
  if (/[<>"'\s]/.test(v)) return fallo(`El campo ${etiqueta} contiene caracteres no permitidos`)
  if (v === '/logo.png' || (typeof defaultBase === 'string' && defaultBase !== '' && v === defaultBase)) {
    return { ok: true, valor: v }
  }
  if (pathDesdeUrlBranding(v, origenStorage) !== null) {
    const u = new URL(v)
    return { ok: true, valor: `${u.origin}${u.pathname}` }
  }
  return fallo(`El campo ${etiqueta} solo admite el logo por defecto o uno subido desde el editor`)
}

// ─── Listas ──────────────────────────────────────────────────────────────────

function validarTamanoLista(valor: unknown, campo: Campo): Limpio<unknown[]> | Fallo {
  if (!Array.isArray(valor)) return fallo(`El campo ${campo.etiqueta} debe ser una lista`)
  const min = campo.minItems ?? 0
  const max = campo.maxItems ?? Number.POSITIVE_INFINITY
  if (valor.length < min) {
    return fallo(`El campo ${campo.etiqueta} debe tener al menos ${min} ${min === 1 ? 'elemento' : 'elementos'}`)
  }
  if (valor.length > max) return fallo(`El campo ${campo.etiqueta} admite como máximo ${max} elementos`)
  return { ok: true, valor }
}

function validarListaTexto(valor: unknown, campo: Campo): Limpio<string[]> | Fallo {
  const lista = validarTamanoLista(valor, campo)
  if (!lista.ok) return lista
  const salida: string[] = []
  for (let i = 0; i < lista.valor.length; i++) {
    const r = validarTexto(lista.valor[i], {
      etiqueta: `${campo.etiqueta} (elemento ${i + 1})`,
      max: campo.max ?? Number.POSITIVE_INFINITY,
      multilinea: false,
      admiteVacio: false,
    })
    if (!r.ok) return r
    salida.push(r.valor)
  }
  return { ok: true, valor: salida }
}

/**
 * Un elemento de lista-objetos tiene EXACTAMENTE los subcampos declarados en
 * el catálogo: ni uno más (el provider serializa `landing` entero en el HTML
 * de cada página) ni uno menos (la landing lo leería como `undefined`). La
 * forma la exige `z.strictObject`; el contenido de cada subcampo, las mismas
 * reglas de texto/entero que las hojas.
 */
function esquemaElemento(campos: ReadonlyArray<Subcampo>) {
  const forma: Record<string, z.ZodType> = {}
  for (const c of campos) forma[c.clave] = c.tipo === 'entero' ? z.number() : z.string()
  return z.strictObject(forma)
}

/**
 * `''` en un subcampo se admite solo si algún elemento DEFAULT de esa lista lo
 * trae vacío (p. ej. `contadores[0].sufijo`): es la misma regla que en las
 * hojas, leída de la base y no de una lista escrita a mano.
 */
function subcampoAdmiteVacio(listaBase: unknown, subclave: string): boolean {
  if (!Array.isArray(listaBase)) return false
  return listaBase.some((el) => esObjetoPlano(el) && el[subclave] === '')
}

function validarListaObjetos(valor: unknown, campo: Campo, listaBase: unknown): Limpio<unknown[]> | Fallo {
  const lista = validarTamanoLista(valor, campo)
  if (!lista.ok) return lista
  const campos = campo.campos ?? []
  const esquema = esquemaElemento(campos)
  const salida: unknown[] = []
  for (let i = 0; i < lista.valor.length; i++) {
    const donde = `${campo.etiqueta} (elemento ${i + 1})`
    const el = lista.valor[i]
    if (esObjetoPlano(el)) {
      for (const k of Object.keys(el)) {
        if (CLAVES_PROHIBIDAS.has(k)) return fallo(`${donde}: clave no permitida "${k}"`)
      }
    }
    const forma = esquema.safeParse(el)
    if (!forma.success) {
      const issue = forma.error.issues[0]
      if (issue?.code === 'unrecognized_keys') {
        const keys = (issue as { keys?: string[] }).keys ?? []
        return fallo(`${donde}: clave no permitida "${keys[0] ?? '?'}"`)
      }
      const sub = issue?.path?.[0]
      return fallo(
        sub !== undefined
          ? `${donde}: falta o es inválido el campo "${String(sub)}"`
          : `${donde}: debe ser un objeto con ${campos.map((c) => c.clave).join(', ')}`,
      )
    }
    const limpio: Record<string, string | number> = {}
    for (const c of campos) {
      const crudo = forma.data[c.clave]
      if (c.tipo === 'entero') {
        const r = validarEntero(crudo, `${donde} · ${c.etiqueta}`, c.min ?? 0, c.max)
        if (!r.ok) return r
        limpio[c.clave] = r.valor
      } else {
        const r = validarTexto(crudo, {
          etiqueta: `${donde} · ${c.etiqueta}`,
          max: c.max,
          multilinea: c.tipo === 'textarea',
          admiteVacio: subcampoAdmiteVacio(listaBase, c.clave),
        })
        if (!r.ok) return r
        limpio[c.clave] = r.valor
      }
    }
    salida.push(limpio)
  }
  return { ok: true, valor: salida }
}

// ─── Modalidades ─────────────────────────────────────────────────────────────

const LIMITE_MENSUALIDAD = { min: 0, max: 50000 }

/**
 * Tope propio para la CUOTA SEMANAL, y no es una copia por simetría.
 *
 * Una cuota semanal es del orden de una cuarta parte de una mensualidad, así
 * que el techo de $50,000 pensado para mensualidades deja pasar cifras que en
 * una escuela semanal solo pueden ser un error de tecleo — y un error ahí se
 * multiplica por 12 o por 24 semanas antes de que nadie lo note.
 */
const LIMITE_CUOTA_SEMANAL = { min: 0, max: 15000 }

/**
 * `null` en `mensualidad` / `cuotaSemanal` / `activa` = quitar ese override.
 * Ninguna otra propiedad: `meses`, `label`, `materiasPorMes` y `semanas`
 * definen el PRODUCTO y viven en config.ts (ver `OverrideModalidad` en core).
 *
 * 🛑 `semanas` NO es editable, por la misma razón que `meses`: es la estructura
 * del plan, no su precio. Cambiarla desde el panel descuadraría los calendarios
 * ya generados sin que el admin lo pida.
 */
const esquemaOverrideModalidad = z.strictObject({
  mensualidad: z.int().min(LIMITE_MENSUALIDAD.min).max(LIMITE_MENSUALIDAD.max).nullable().optional(),
  cuotaSemanal: z.int().min(LIMITE_CUOTA_SEMANAL.min).max(LIMITE_CUOTA_SEMANAL.max).nullable().optional(),
  activa: z.boolean().nullable().optional(),
})

function validarModalidades(
  valor: unknown,
  campo: Campo,
  base: SiteConfig,
): Limpio<Record<string, { mensualidad?: number; cuotaSemanal?: number; activa?: boolean }>> | Fallo {
  if (!esObjetoPlano(valor)) return fallo(`El campo ${campo.etiqueta} debe ser un objeto por id de plan`, 'modalidades')
  const min = campo.min ?? LIMITE_MENSUALIDAD.min
  const max = campo.max ?? LIMITE_MENSUALIDAD.max
  const ids = new Set(base.modalidades.map((m) => m.id))
  const salida: Record<string, { mensualidad?: number; cuotaSemanal?: number; activa?: boolean }> = {}

  for (const id of Object.keys(valor)) {
    const clave = `modalidades.${id}`
    if (CLAVES_PROHIBIDAS.has(id)) return fallo(`Clave no editable: ${clave}`, clave)
    if (!ids.has(id)) return fallo(`Modalidad desconocida: ${id}`, clave)
    const ov = valor[id]
    if (ov === null || ov === undefined) continue
    if (esObjetoPlano(ov)) {
      for (const k of Object.keys(ov)) {
        if (CLAVES_PROHIBIDAS.has(k)) return fallo(`Clave no editable: ${clave}.${k}`, `${clave}.${k}`)
      }
    }
    const r = esquemaOverrideModalidad.safeParse(ov)
    if (!r.success) {
      const issue = r.error.issues[0]
      if (issue?.code === 'unrecognized_keys') {
        const keys = (issue as { keys?: string[] }).keys ?? []
        return fallo(`Clave no editable: ${clave}.${keys[0] ?? '?'}`, `${clave}.${keys[0] ?? '?'}`)
      }
      const sub = issue?.path?.[0]
      if (sub === 'mensualidad') {
        return fallo(`La mensualidad del plan ${id} debe ser un entero entre ${min} y ${max}`, clave)
      }
      if (sub === 'cuotaSemanal') {
        return fallo(
          `La cuota semanal del plan ${id} debe ser un entero entre ${LIMITE_CUOTA_SEMANAL.min} y ${LIMITE_CUOTA_SEMANAL.max}`,
          clave,
        )
      }
      if (sub === 'activa') return fallo(`"activa" del plan ${id} debe ser verdadero o falso`, clave)
      return fallo(`El plan ${id} debe ser un objeto con cuota y/o activa`, clave)
    }
    const limpio: { mensualidad?: number; cuotaSemanal?: number; activa?: boolean } = {}
    if (typeof r.data.mensualidad === 'number') {
      // El rango del catálogo manda si es más estrecho que el del esquema.
      if (r.data.mensualidad < min || r.data.mensualidad > max) {
        return fallo(`La mensualidad del plan ${id} debe ser un entero entre ${min} y ${max}`, clave)
      }
      limpio.mensualidad = r.data.mensualidad
    }
    if (typeof r.data.cuotaSemanal === 'number') {
      // La cuota semanal NO usa el rango del catálogo: `campo.min/max` describe
      // mensualidades, y aplicárselo a una cuota semanal sería el mismo error de
      // unidad que este PR viene a arreglar.
      if (r.data.cuotaSemanal < LIMITE_CUOTA_SEMANAL.min || r.data.cuotaSemanal > LIMITE_CUOTA_SEMANAL.max) {
        return fallo(
          `La cuota semanal del plan ${id} debe ser un entero entre ${LIMITE_CUOTA_SEMANAL.min} y ${LIMITE_CUOTA_SEMANAL.max}`,
          clave,
        )
      }
      limpio.cuotaSemanal = r.data.cuotaSemanal
    }
    if (typeof r.data.activa === 'boolean') limpio.activa = r.data.activa
    if (Object.keys(limpio).length > 0) salida[id] = limpio
  }

  // "Al menos una activa" se evalúa sobre el RESULTADO (base + overrides), no
  // sobre el cuerpo: desactivar la única activa cuando la otra ya venía
  // inactiva de config.ts dejaría el registro sin planes que ofrecer.
  const quedaActiva = base.modalidades.some((m) => salida[m.id]?.activa ?? m.activa)
  if (!quedaActiva) return fallo('Debe quedar al menos una modalidad activa', 'modalidades')

  return { ok: true, valor: salida }
}

// ─── Hoja por descriptor ─────────────────────────────────────────────────────

interface Contexto {
  base: SiteConfig
  origenStorage: string | undefined
}

function validarHoja(ruta: ClaveEditable, valor: unknown, ctx: Contexto): Limpio<unknown> | Fallo {
  const campo = campoPorClave(ruta)
  // Toda ClaveEditable tiene descriptor (lo vigila site-config-campos.spec);
  // si faltara, mejor rechazar que guardar sin límites.
  if (!campo) return fallo(`Clave sin descriptor: ${ruta}`, ruta)
  const defaultBase = leerRuta(ctx.base, ruta)
  const max = campo.max ?? Number.POSITIVE_INFINITY

  switch (campo.tipo) {
    case 'texto':
    case 'textarea':
      return validarTexto(valor, {
        etiqueta: campo.etiqueta,
        max,
        multilinea: campo.tipo === 'textarea',
        admiteVacio: defaultBase === '',
      })
    case 'hex':
      return validarHex(valor, campo.etiqueta)
    case 'telefono':
      return validarTelefono(valor, campo.etiqueta)
    case 'email':
      return validarEmail(valor, campo.etiqueta, max)
    case 'entero':
      return validarEntero(valor, campo.etiqueta, campo.min ?? 0, campo.max ?? Number.MAX_SAFE_INTEGER)
    case 'decimal':
      return validarDecimal(valor, campo.etiqueta, campo.min ?? 0, campo.max ?? Number.MAX_SAFE_INTEGER)
    case 'url':
      if (ruta === 'logo' || ruta === 'logoOscuro') {
        return validarLogo(valor, campo.etiqueta, max, defaultBase, ctx.origenStorage, ruta === 'logoOscuro')
      }
      if (ruta === 'redes.facebook' || ruta === 'redes.instagram') {
        return validarRed(valor, campo.etiqueta, max)
      }
      // 'whatsappUrl' se deriva en validarOverrides y no llega aquí.
      return fallo(`El campo ${campo.etiqueta} no se edita directamente`, ruta)
    case 'lista-texto':
      return validarListaTexto(valor, campo)
    case 'lista-objetos':
      return validarListaObjetos(valor, campo, defaultBase)
    case 'modalidades':
      return validarModalidades(valor, campo, ctx.base)
  }
}

// ─── Recorrido del cuerpo ────────────────────────────────────────────────────

/**
 * Baja por el cuerpo clave a clave. Solo se puede pisar una ruta de la lista
 * blanca o un intermedio de ella (`colores`, `landing`…); todo lo demás es
 * "Clave no editable" con la ruta completa, a cualquier profundidad.
 */
function recorrer(obj: ObjetoPlano, prefijo: string, salida: ObjetoPlano, ctx: Contexto): Fallo | null {
  for (const k of Object.keys(obj)) {
    const ruta = prefijo ? `${prefijo}.${k}` : k
    if (CLAVES_PROHIBIDAS.has(k)) return fallo(`Clave no editable: ${ruta}`, ruta)
    const valor = obj[k]

    if (esClaveEditable(ruta)) {
      if (valor === null || valor === undefined) continue // "sin override"
      if (ruta === 'whatsappUrl') continue // se deriva de `whatsapp`, abajo
      const r = validarHoja(ruta, valor, ctx)
      if (!r.ok) return { ok: false, error: r.error, clave: r.clave ?? ruta }
      if (Array.isArray(r.valor)) {
        // Segunda barrera: la MISMA regla con la que el merge acepta un arreglo
        // al leer. Si el merge lo rechazara, guardarlo sería guardar nada.
        const norm = normalizarArreglo(ruta, r.valor)
        if (norm === undefined) return fallo(`El campo ${ruta} no tiene la forma esperada`, ruta)
        escribirRuta(salida, ruta, norm)
      } else if (esObjetoPlano(r.valor) && Object.keys(r.valor).length === 0) {
        continue // modalidades sin ningún override efectivo
      } else {
        escribirRuta(salida, ruta, r.valor)
      }
      continue
    }

    if (PREFIJOS_INTERMEDIOS.has(ruta)) {
      if (valor === null || valor === undefined) continue
      if (!esObjetoPlano(valor)) return fallo(`El campo ${ruta} debe ser un objeto`, ruta)
      const err = recorrer(valor, ruta, salida, ctx)
      if (err) return err
      continue
    }

    return fallo(`Clave no editable: ${ruta}`, ruta)
  }
  return null
}

/** Quita los objetos intermedios que quedaron sin ninguna hoja. MUTA `obj`. */
function podarVacios(obj: ObjetoPlano): void {
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (esObjetoPlano(v)) {
      podarVacios(v)
      if (Object.keys(v).length === 0) delete obj[k]
    }
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Valida el cuerpo COMPLETO de overrides que manda el editor y devuelve el
 * objeto limpio listo para el upsert, o el primer error encontrado con la
 * clave del campo.
 *
 * `base` es la config sobre la que se evalúan las reglas que dependen de los
 * defaults (qué textos admiten `''`, qué ids de modalidad existen, cuál es el
 * logo por defecto): en la API es `mergeSiteConfig(CONFIG, {})`.
 */
export function validarOverrides(
  body: unknown,
  base: SiteConfig,
  opciones: OpcionesValidacion = {},
): ResultadoValidacion {
  if (!esObjetoPlano(body)) {
    return { ok: false, error: 'El cuerpo debe ser un objeto con los campos a guardar' }
  }
  const ctx: Contexto = { base, origenStorage: normalizarOrigen(opciones.origenStorage) }
  const salida: ObjetoPlano = {}

  const err = recorrer(body, '', salida, ctx)
  if (err) return err

  // `whatsappUrl` SIEMPRE se deriva del número: la landing pinta el enlace y
  // el número por separado y un admin que cambie uno olvidaría el otro. Si el
  // cuerpo trae un `whatsappUrl` propio, se ignora y se sobreescribe; si lo
  // trae SIN número, es un error (no hay de dónde derivarlo).
  if (typeof salida.whatsapp === 'string') {
    salida.whatsappUrl = `https://wa.me/${salida.whatsapp}`
  } else if (body.whatsappUrl !== undefined && body.whatsappUrl !== null) {
    return { ok: false, error: 'whatsappUrl se deriva de whatsapp', clave: 'whatsappUrl' }
  }

  podarVacios(salida)
  return { ok: true, overrides: salida as SiteConfigOverrides }
}

/**
 * Recorta una config fusionada a lo que el editor muestra (ver
 * `ConfigEditable`). Clona: el resultado no comparte referencias con `cfg`.
 */
export function recortarAEditables(cfg: SiteConfig): ConfigEditable {
  const salida: ObjetoPlano = {}
  for (const ruta of CLAVES_EDITABLES) {
    if (ruta === 'modalidades') continue
    const v = leerRuta(cfg, ruta)
    if (v === undefined) continue
    escribirRuta(salida, ruta, Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : v)
  }
  salida.modalidades = cfg.modalidades.map((m) => ({
    id: m.id,
    label: m.label,
    meses: m.meses,
    mensualidad: m.mensualidad,
    materiasPorMes: m.materiasPorMes,
    activa: m.activa,
  }))
  return salida as unknown as ConfigEditable
}

/**
 * Recorta lo que hay en `site_config.data` a la LISTA BLANCA. Es lo que el GET
 * devuelve como `overrides`.
 *
 * La fila la escribe esta misma API, pero también puede escribirla cualquiera
 * con la service role (un script de alta, una migración de cliente, un arreglo
 * a mano en el panel de Supabase). Sin este recorte, el editor mostraría — y
 * reenviaría en su siguiente PUT — una clave que la validación rechaza, y el
 * admin vería un "Clave no editable" por algo que él no escribió.
 *
 * NO valida valores (eso es `validarOverrides`): solo la FORMA de las claves,
 * el mismo criterio con el que el merge filtra al leer. `modalidades` se
 * recorta a `{ id: { mensualidad, activa } }`, que es su forma en la BD (ver
 * `SiteConfigOverrides` en site-config-core.ts).
 *
 * `base` es opcional y solo sirve para los ids de `modalidades`: con ella se
 * descartan los planes que ya no existen en config.ts (un cliente que renombró
 * sus modalidades), que si no volverían en el siguiente PUT del editor como
 * "Modalidad desconocida".
 */
export function recortarOverrides(data: unknown, base?: SiteConfig): SiteConfigOverrides {
  const salida: ObjetoPlano = {}
  if (!esObjetoPlano(data)) return salida as SiteConfigOverrides
  const ids = base ? new Set(base.modalidades.map((m) => m.id)) : null

  for (const ruta of CLAVES_EDITABLES) {
    if (ruta === 'modalidades') continue // objeto por id, no ruta con puntos
    const v = leerRuta(data, ruta)
    if (v === undefined || v === null) continue
    escribirRuta(salida, ruta, Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : v)
  }

  const mods = data.modalidades
  if (esObjetoPlano(mods)) {
    const limpias: ObjetoPlano = {}
    for (const id of Object.keys(mods)) {
      if (CLAVES_PROHIBIDAS.has(id)) continue
      if (ids && !ids.has(id)) continue
      const ov = mods[id]
      if (!esObjetoPlano(ov)) continue
      const limpio: { mensualidad?: number; activa?: boolean } = {}
      if (typeof ov.mensualidad === 'number') limpio.mensualidad = ov.mensualidad
      if (typeof ov.activa === 'boolean') limpio.activa = ov.activa
      if (Object.keys(limpio).length > 0) limpias[id] = limpio
    }
    if (Object.keys(limpias).length > 0) salida.modalidades = limpias
  }

  podarVacios(salida)
  return salida as SiteConfigOverrides
}
