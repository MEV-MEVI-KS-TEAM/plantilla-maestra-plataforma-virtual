/**
 * "Personalizar mi página" (F4) — logo del sitio.
 *
 *   POST   /api/admin/configuracion/logo?variante=claro|oscuro   (multipart, campo `file`)
 *   DELETE /api/admin/configuracion/logo?variante=claro|oscuro
 *
 * Es la ÚNICA vía por la que `site_config.data.logo` / `logoOscuro` cambian:
 * el PUT de /configuracion IGNORA esas dos claves del cuerpo y conserva
 * siempre las de la fila (ver el encabezado de ../route.ts). Así el editor no
 * puede pisar un logo con un estado viejo de su formulario, y todo lo que
 * acaba en el `<img src>` de la landing pública pasó por aquí: tipo declarado
 * Y firma de bytes, tamaño, filtro de contenido si es SVG, y re-codificación.
 *
 * TODO SE GUARDA COMO PNG O JPEG. El bucket solo contiene mapas de bits: no
 * hay ni un SVG ni un WebP dentro. Tres razones, y ninguna es estética:
 *
 *   1. SVG = CÓDIGO. El bucket es público y sirve desde el ORIGEN de Supabase;
 *      un `<img src>` no ejecuta el SVG, pero ABRIR la URL directa sí, y ahí
 *      el `<script>` correría en ese origen. `svgEsSeguro` (src/lib/svg-seguro.ts)
 *      lo rechaza antes, pero un filtro de texto es una carrera contra el
 *      parser del navegador; rasterizar la termina: lo que se guarda son
 *      píxeles, no un documento.
 *   2. EL RECIBO PDF. `src/lib/pdf/recibo-pago.tsx` pinta el logo con el
 *      `<Image>` de react-pdf, que solo rasteriza PNG y JPEG. Un SVG o un WebP
 *      en la fila dejaban el recibo sin logo (o reventaban el render).
 *   3. Re-codificar descarta lo que no sean píxeles (EXIF, chunks raros, colas
 *      de archivo) y de paso limita el logo a 512 px por lado: 4000 px en la
 *      cabecera de cada página es un despropósito.
 *
 * Se aceptan PNG, JPG, WebP y SVG a la ENTRADA (es lo que el admin tiene a
 * mano); PNG y JPEG conservan su formato, WebP y SVG salen como PNG (con alfa,
 * que es lo que un logo necesita). El SVG se rasteriza a 300 DPI para que el
 * trazo llegue limpio a 512 px. Si la librería de imágenes del despliegue no
 * trajera soporte de SVG, la subida responde 400 y el admin puede subir un PNG:
 * degrada, no rompe.
 *
 * `runtime = 'nodejs'` porque sharp es nativo (no corre en Edge) y
 * `force-dynamic` porque escribe en cada petición.
 */
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig, revalidateSiteConfig } from '@/lib/site-config'
import { recortarAEditables } from '@/lib/site-config-validacion'
import { svgEsSeguro } from '@/lib/svg-seguro'
import { BUCKET_BRANDING, borrarLogoSiEsDelBucket, urlPublicaBranding } from '@/lib/site-config-storage'
import {
  MENSAJE_SITE_CONFIG_SIN_MIGRAR,
  SITE_CONFIG_SIN_MIGRAR,
  esErrorTablaInexistente,
} from '@/lib/site-config-errores'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Mismo límite que el bucket (file_size_limit = 2097152 en la migración). */
const LOGO_MAX_BYTES = 2 * 1024 * 1024
/** Lado máximo del logo rasterizado. Cabe en cualquier cabecera y en retina. */
const LOGO_LADO_MAX = 512
/**
 * Tope de píxeles de ENTRADA (`limitInputPixels` de sharp). Un PNG de 40 kB
 * puede declarar 30000×30000 y tumbar el proceso al descomprimirlo; con esto
 * sharp falla y se responde 400.
 *
 * 16 MP y no 30: es una BOMBA DE DESCOMPRESIÓN, y el número tiene que ser el
 * techo de lo razonable para un LOGO, no el de sharp. 30 MP en RGBA son ~120 MB
 * de mapa de bits en memoria por petición — suficiente para tumbar una lambda
 * de 1 GB con dos subidas simultáneas, y todo eso para acabar encajando la
 * imagen en 512 px. 16 MP (~64 MB) siguen sobrando: un logo de 4000×4000 px
 * pasa de largo, y quien tenga algo mayor tiene un póster, no un logo.
 */
const MAX_PIXELES_ENTRADA = 16_000_000
/** DPI con el que se rasteriza el SVG antes de encajarlo en 512 px. */
const DENSIDAD_SVG = 300

/** Lo que el admin puede subir. */
type FormatoEntrada = 'png' | 'jpeg' | 'webp' | 'svg'
/** Lo que acaba en el bucket. Nunca otra cosa (ver el encabezado). */
type FormatoSalida = 'png' | 'jpeg'

const FORMATO_SALIDA: Readonly<Record<FormatoEntrada, FormatoSalida>> = {
  png: 'png',
  jpeg: 'jpeg',
  // react-pdf no lee WebP y el SVG no se guarda como documento: los dos a PNG.
  webp: 'png',
  svg: 'png',
}

const SALIDA: Readonly<Record<FormatoSalida, { mime: string; ext: string }>> = {
  png: { mime: 'image/png', ext: 'png' },
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
}

const ERR_FORMATO = 'Formato no permitido (png, jpg, webp o svg)'
const ERR_PESO = 'El logo pesa más de 2 MB'
const ERR_SVG = 'El SVG contiene contenido no permitido'
const ERR_SVG_INICIO = 'El SVG debe empezar por <svg o <?xml'
const ERR_PROCESO = 'La imagen está dañada o no se pudo procesar'

/**
 * MIMEs que NO dicen NADA del contenido y por tanto no se contrastan con la
 * firma: manda lo que digan los bytes.
 *
 *   ''                        el navegador no supo tipar el archivo, o el
 *                             cliente no mandó `type=` (curl, un fetch a mano).
 *   application/octet-stream  el genérico de "aquí van bytes". Lo ponen varios
 *                             clientes HTTP y algunos gestores de archivos
 *                             cuando la extensión no les suena; rechazarlo
 *                             obligaba al admin a renombrar un PNG perfecto.
 *
 * No se ablanda nada: la firma de bytes ya decidió qué es el archivo antes de
 * mirar el MIME, y un SVG sigue pasando además por `svgEsSeguro` y por el
 * rasterizado. Lo que este conjunto evita es rechazar archivos VÁLIDOS por lo
 * que el cliente no supo declarar.
 */
const MIME_SIN_INFORMACION: ReadonlySet<string> = new Set(['', 'application/octet-stream'])

/** El MIME tal como llega, normalizado: sin parámetros, sin espacios, en minúsculas. */
function normalizarMime(mime: string): string {
  return mime.toLowerCase().split(';')[0].trim()
}

/** El MIME que declara el navegador, normalizado. `image/jpg` es un alias frecuente. */
function formatoDeclarado(mime: string): FormatoEntrada | null {
  switch (normalizarMime(mime)) {
    case 'image/png': return 'png'
    case 'image/jpeg':
    case 'image/jpg': return 'jpeg'
    case 'image/webp': return 'webp'
    case 'image/svg+xml': return 'svg'
    default: return null
  }
}

/** Los primeros bytes como texto, sin BOM ni espacios delante. Para el XML. */
function cabeceraTexto(buf: Buffer): string {
  return buf.subarray(0, 512).toString('utf8').replace(/^\uFEFF/, '').trimStart().toLowerCase()
}

/**
 * Lo que el archivo ES, por sus primeros bytes. El MIME lo pone el navegador a
 * partir de la extensión y cualquiera lo falsifica; la firma no.
 *   PNG  89 50 4E 47 0D 0A 1A 0A
 *   JPEG FF D8 FF
 *   WEBP 'RIFF' .... 'WEBP'
 *   SVG  texto que, tras BOM y espacios, empieza por '<svg' o '<?xml'
 */
function formatoPorFirma(buf: Buffer): FormatoEntrada | null {
  if (buf.length >= 8 &&
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp'
  const cabecera = cabeceraTexto(buf)
  if (cabecera.startsWith('<svg') || cabecera.startsWith('<?xml')) return 'svg'
  return null
}

/**
 * `file instanceof File` NO sirve: en Node 18 `File` no es global (llegó como
 * global en 20) y `undici` devuelve su propia clase. Lo que se necesita es un
 * Blob: algo con `arrayBuffer()`.
 */
function esArchivoSubido(v: unknown): v is Blob {
  return typeof v === 'object' && v !== null && typeof (v as Blob).arrayBuffer === 'function'
}

function esObjetoPlano(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Sesión + rol ADMIN. Devuelve el 401/403 listo para responder, o el usuario. */
async function autorizarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { denied: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const denied = await verifyAdmin(supabase, user.id)
  if (denied) return { denied }
  return { denied: null, user }
}

type Variante = 'claro' | 'oscuro'

function leerVariante(request: NextRequest): Variante | null {
  const v = request.nextUrl.searchParams.get('variante') ?? 'claro'
  return v === 'claro' || v === 'oscuro' ? v : null
}

type ClaveLogo = 'logo' | 'logoOscuro'

const claveDe = (variante: Variante): ClaveLogo => (variante === 'claro' ? 'logo' : 'logoOscuro')
const claveOpuesta = (variante: Variante): ClaveLogo => (variante === 'claro' ? 'logoOscuro' : 'logo')

type Admin = ReturnType<typeof createAdminClient>

/** La fila id=1 tal cual está en la BD. Lanza si la consulta falla. */
async function leerData(admin: Admin): Promise<Record<string, unknown>> {
  const { data: fila, error } = await admin.from('site_config').select('data').eq('id', 1).maybeSingle()
  if (error) throw new Error(`${error.code ?? 'sin-codigo'}: ${error.message}`)
  return esObjetoPlano(fila?.data) ? (fila!.data as Record<string, unknown>) : {}
}

async function guardarData(admin: Admin, data: Record<string, unknown>, userId: string): Promise<void> {
  const { error } = await admin
    .from('site_config')
    .upsert({ id: 1, data, updated_at: new Date().toISOString(), updated_by: userId }, { onConflict: 'id' })
  if (error) throw new Error(`${error.code ?? 'sin-codigo'}: ${error.message}`)
}

/**
 * Píxeles dentro, píxeles fuera. `.rotate()` sin argumentos aplica la
 * orientación EXIF (si no, un JPG del celular llega acostado) y `resize` encaja
 * el logo en 512 px sin deformarlo. Un raster pequeño NO se agranda (se vería
 * borroso); un SVG SÍ, porque es vectorial y ampliarlo no pierde nada.
 */
async function normalizarImagen(original: Buffer, entrada: FormatoEntrada): Promise<Buffer> {
  const pipeline = sharp(original, {
    failOn: 'error',
    limitInputPixels: MAX_PIXELES_ENTRADA,
    ...(entrada === 'svg' ? { density: DENSIDAD_SVG } : {}),
  })
    .rotate()
    .resize(LOGO_LADO_MAX, LOGO_LADO_MAX, { fit: 'inside', withoutEnlargement: entrada !== 'svg' })
  return FORMATO_SALIDA[entrada] === 'jpeg'
    ? pipeline.jpeg({ quality: 90 }).toBuffer()
    : pipeline.png().toBuffer()
}

/**
 * Escribe la clave de la variante en la fila y borra el objeto anterior si era
 * del bucket. `url = null` la QUITA (vuelve al default de config.ts).
 *
 * NO se borra el objeto anterior si la OTRA variante apunta a él: `logo` y
 * `logoOscuro` pueden compartir archivo (el mismo PNG subido dos veces, o un
 * cliente que solo tiene uno), y borrarlo dejaría a la otra clave apuntando a
 * un 404.
 *
 * Orden: primero la fila, después la limpieza. Al revés, un fallo del upsert
 * dejaría la landing apuntando a un objeto ya borrado.
 */
async function aplicarLogo(
  admin: Admin,
  variante: Variante,
  url: string | null,
  userId: string,
): Promise<Record<string, unknown>> {
  const actual = await leerData(admin)
  const clave = claveDe(variante)
  const anterior = actual[clave]
  const nueva = { ...actual }
  if (url === null) delete nueva[clave]
  else nueva[clave] = url

  await guardarData(admin, nueva, userId)
  revalidateSiteConfig()

  if (anterior !== nueva[clave] && anterior !== nueva[claveOpuesta(variante)]) {
    await borrarLogoSiEsDelBucket(admin, anterior)
  }
  return nueva
}

/**
 * Traduce lo que se escapó del `try` a una respuesta. Mismo criterio que
 * ../route.ts: si lo que falta es la tabla `site_config` (cliente de la flota
 * sin la migración de F1) se responde 503 diciendo qué correr, no un 500 opaco
 * que manda al admin a abrir un ticket.
 */
function respuestaDeError(e: unknown): NextResponse {
  if (esErrorTablaInexistente(e)) {
    return NextResponse.json(
      { error: MENSAJE_SITE_CONFIG_SIN_MIGRAR, codigo: SITE_CONFIG_SIN_MIGRAR },
      { status: 503 },
    )
  }
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}

// ─── POST /api/admin/configuracion/logo ──────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await autorizarAdmin()
    if (auth.denied) return auth.denied

    const variante = leerVariante(request)
    if (!variante) {
      return NextResponse.json({ error: 'variante debe ser "claro" u "oscuro"' }, { status: 400 })
    }

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Se esperaba multipart/form-data con el campo "file"' }, { status: 400 })
    }
    const file = form.get('file')
    if (!esArchivoSubido(file)) {
      return NextResponse.json({ error: 'Falta el archivo (campo "file")' }, { status: 400 })
    }
    if (file.size === 0) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    if (file.size > LOGO_MAX_BYTES) return NextResponse.json({ error: ERR_PESO }, { status: 400 })

    const original = Buffer.from(await file.arrayBuffer())
    if (original.length === 0) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    if (original.length > LOGO_MAX_BYTES) return NextResponse.json({ error: ERR_PESO }, { status: 400 })

    // Manda la FIRMA de bytes. El MIME solo tiene que no contradecirla, y
    // cuando no aporta nada (vacío o `application/octet-stream`, ver
    // MIME_SIN_INFORMACION) no hay qué contrastar: se acepta lo que digan los
    // bytes.
    const real = formatoPorFirma(original)
    if (!real) {
      const cabecera = cabeceraTexto(original)
      if (cabecera.startsWith('<!doctype') || cabecera.startsWith('<!--')) {
        return NextResponse.json({ error: ERR_SVG_INICIO }, { status: 400 })
      }
      return NextResponse.json({ error: ERR_FORMATO }, { status: 400 })
    }
    const mime = normalizarMime(file.type ?? '')
    if (!MIME_SIN_INFORMACION.has(mime)) {
      const declarado = formatoDeclarado(mime)
      if (!declarado || declarado !== real) {
        return NextResponse.json({ error: ERR_FORMATO }, { status: 400 })
      }
    }

    // Capa 1 del SVG: filtro de contenido (src/lib/svg-seguro.ts). Capa 2: no
    // se guarda como SVG, se rasteriza abajo como cualquier otra imagen.
    if (real === 'svg') {
      const veredicto = svgEsSeguro(original.toString('utf8'))
      if (!veredicto.ok) {
        console.error('[configuracion/logo] SVG rechazado:', veredicto.motivo)
        return NextResponse.json({ error: ERR_SVG }, { status: 400 })
      }
    }

    let salida: Buffer
    try {
      salida = await normalizarImagen(original, real)
    } catch (e) {
      // La firma era correcta pero el archivo está corrupto, truncado, declara
      // más píxeles de los permitidos, o (si es SVG) la librería de imágenes no
      // sabe rasterizarlo. En todos los casos es del archivo, no del servidor.
      console.error('[configuracion/logo] no se pudo procesar el archivo:', e)
      return NextResponse.json({ error: ERR_PROCESO }, { status: 400 })
    }
    if (salida.length === 0) return NextResponse.json({ error: ERR_PROCESO }, { status: 400 })
    if (salida.length > LOGO_MAX_BYTES) return NextResponse.json({ error: ERR_PESO }, { status: 400 })

    const { mime: mimeSalida, ext } = SALIDA[FORMATO_SALIDA[real]]
    const admin = createAdminClient()

    // Nombre único por marca de tiempo: se sube ANTES de tocar la fila y así
    // nunca hay un instante en que la landing apunte a un objeto borrado.
    const path = `logo-${variante}-${Date.now()}.${ext}`
    const { error: upError } = await admin.storage
      .from(BUCKET_BRANDING)
      .upload(path, salida, { contentType: mimeSalida, upsert: false, cacheControl: '3600' })
    if (upError) {
      console.error('[configuracion/logo] no se pudo subir:', upError.message)
      return NextResponse.json({ error: 'No se pudo guardar el archivo' }, { status: 500 })
    }
    const url = urlPublicaBranding(path, admin)

    let nueva: Record<string, unknown>
    try {
      nueva = await aplicarLogo(admin, variante, url, auth.user.id)
    } catch (e) {
      // La fila no cambió: el objeto recién subido no lo referencia nadie.
      await admin.storage.from(BUCKET_BRANDING).remove([path])
      throw e
    }

    return NextResponse.json({
      ok: true,
      url,
      variante,
      merged: recortarAEditables(mergeSiteConfig(CONFIG, nueva)),
      // La fila tal cual queda. El editor la necesita para saber qué variante
      // tiene override PROPIO: `merged` ya viene resuelto (`resolverLogos`) y
      // con un solo logo subido las dos variantes coinciden.
      overrides: nueva,
    })
  } catch (e) {
    console.error('[configuracion/logo]', e)
    return respuestaDeError(e)
  }
}

// ─── DELETE /api/admin/configuracion/logo — quitar la variante ───────────────
/**
 * Quita `logo` / `logoOscuro` de la fila y borra el objeto del bucket si era
 * nuestro. Existe porque el PUT de /configuracion ya no toca esas claves: sin
 * esto no habría forma de volver al logo por defecto sin restaurar TODA la
 * configuración.
 *
 * Quitar la clave (no ponerla en `''`) es lo que hace que el merge caiga al
 * default de config.ts. En `logoOscuro`, además, `''` significa otra cosa: "no
 * hay variante oscura, usa la clara" (ver `SIN_VACIO` en site-config-core.ts).
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await autorizarAdmin()
    if (auth.denied) return auth.denied

    const variante = leerVariante(request)
    if (!variante) {
      return NextResponse.json({ error: 'variante debe ser "claro" u "oscuro"' }, { status: 400 })
    }

    const admin = createAdminClient()
    const nueva = await aplicarLogo(admin, variante, null, auth.user.id)

    return NextResponse.json({
      ok: true,
      variante,
      merged: recortarAEditables(mergeSiteConfig(CONFIG, nueva)),
      overrides: nueva,
    })
  } catch (e) {
    console.error('[configuracion/logo]', e)
    return respuestaDeError(e)
  }
}
