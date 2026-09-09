/**
 * QA de "Personalizar mi página" (F4) — API, sin la UI del editor.
 *
 * Todo se ejerce contra los endpoints reales:
 *   GET/PUT/DELETE /api/admin/configuracion
 *   POST/DELETE    /api/admin/configuracion/logo?variante=claro|oscuro
 * más la RLS de `public.site_config` y del bucket `branding` atacada de frente
 * con la ANON KEY (que es lo que tendría un visitante cualquiera).
 *
 * CUATRO IDENTIDADES, cuatro contextos de red:
 *   ADMIN       → storageState acuñado por globalSetup (e2e/.auth/admin.json)
 *   SECRETARIO  → sesión acuñada aquí con mintSession (ve el editor, no edita)
 *   ALUMNO      → sesión acuñada aquí (no debe ver ni tocar nada)
 *   ANÓNIMO     → contexto sin cookies
 *
 * ⚠️ DESTRUCTIVA: deja `site_config.data = {}` y VACÍA el bucket `branding`
 * para partir de una pizarra limpia. La fila se guarda en `beforeAll` y se
 * restaura en `afterAll`, pero los BYTES de un logo que estuviera en el bucket
 * no se pueden restaurar. Es la misma premisa que el resto de la suite
 * (globalSetup ya cambia la contraseña del alumno y borra cursos): corre
 * SOLO contra la base de QA. Ver e2e/README-QA.md.
 *
 * SERIE a propósito: cada caso deja un estado que el siguiente da por hecho
 * (y la fila es única: id = 1, no hay forma de aislar en paralelo).
 */
import { test, expect, request as apiRequest, type APIRequestContext } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { svc, mintSession, storageStateFromSession, ALUMNO_EMAIL, SUPABASE_URL, ANON_KEY } from './_helpers'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig } from '@/lib/site-config-core'

// ─── Constantes de entorno ───────────────────────────────────────────────────

/** El mismo de playwright.config.ts (baseURL + webServer). */
const BASE_URL = 'http://localhost:3000'
const ADMIN_STATE = join(process.cwd(), 'e2e', '.auth', 'admin.json')
const SHOT = (n: string) => join('e2e', 'screenshots', `${n}.png`)

/** Igual que _helpers: Playwright no carga .env.local, se lee a mano. */
function envLocal(clave: string): string | undefined {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const linea of raw.split(/\r?\n/)) {
      const m = linea.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && m[1] === clave) return m[2]
    }
  } catch { /* sin .env.local: se usa process.env */ }
  return undefined
}

/** Usuario con rol SECRETARIO de la base de QA (configurable por cliente). */
const SECRETARIO_EMAIL =
  envLocal('QA_SECRETARIO_EMAIL') || process.env.QA_SECRETARIO_EMAIL || 'laura.sanchez@example.com'

const BUCKET = 'branding'
const PREFIJO_PUBLICO = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

/** PNG 1×1 válido (firma 89 50 4E 47…). Para los casos que ni llegan a sharp. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const SVG_CON_SCRIPT = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><script>alert(1)</script><rect width="64" height="64"/></svg>',
  'utf8',
)
const SVG_LEGITIMO = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="6" fill="#047857"/></svg>',
  'utf8',
)

// ─── Tipos de las respuestas (solo lo que se afirma) ─────────────────────────

interface ModalidadEditable {
  id: string
  label: string
  meses: number
  mensualidad: number
  materiasPorMes: number
  activa: boolean
}

interface ConfigEditable {
  nombre: string
  logo: string
  logoOscuro: string
  colores: Record<string, string>
  landing: Record<string, unknown>
  precios: Record<string, number>
  modalidades: ModalidadEditable[]
}

interface RespuestaGet {
  defaults: ConfigEditable
  overrides: Record<string, unknown>
  merged: ConfigEditable
  puedeEditar: boolean
  updatedAt: string | null
  updatedBy: string | null
}

interface RespuestaPut {
  ok: true
  merged: ConfigEditable
  overrides: Record<string, unknown>
  logosIgnorados: boolean
  nota: string
}

interface RespuestaLogo {
  ok: true
  url: string
  variante: string
  merged: ConfigEditable
}

interface RespuestaError {
  error: string
  clave?: string
}

interface Plan {
  id: string
  nombre: string
  duracion_meses: number
  precio_mensual: number
}

/** Error de PostgREST: lo que interesa es el `code` (42501 = RLS / permisos). */
interface ErrorPostgrest {
  code?: string
  message?: string
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Cuerpo JSON tipado, con el texto crudo en el mensaje si no parsea. */
async function json<T>(res: { json(): Promise<unknown>; text(): Promise<string>; status(): number }): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new Error(`Respuesta ${res.status()} sin JSON: ${(await res.text()).slice(0, 500)}`)
  }
}

/** Contexto de API con las cookies de una sesión acuñada (mismo truco que el admin). */
async function contextoDe(email: string): Promise<APIRequestContext> {
  const sesion = await mintSession(email)
  return apiRequest.newContext({ baseURL: BASE_URL, storageState: storageStateFromSession(sesion) })
}

/** La fila id=1 tal cual está en la BD (service role: salta la RLS). */
async function filaEnBD(): Promise<{ data: unknown; updated_by: string | null } | null> {
  const { data, error } = await svc()
    .from('site_config')
    .select('data, updated_by')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(`site_config select: ${error.message}`)
  return (data as { data: unknown; updated_by: string | null } | null) ?? null
}

/** `data` de la fila como objeto (`{}` si no hay fila). */
async function dataEnBD(): Promise<Record<string, unknown>> {
  const fila = await filaEnBD()
  return esObjeto(fila?.data) ? (fila!.data as Record<string, unknown>) : {}
}

/** Nombres de los ARCHIVOS del bucket (las carpetas virtuales traen id null). */
async function objetosBranding(prefijo = ''): Promise<string[]> {
  const { data, error } = await svc().storage.from(BUCKET).list('', { limit: 1000 })
  if (error) throw new Error(`${BUCKET}.list: ${error.message}`)
  return (data ?? []).filter((o) => o.id && o.name.startsWith(prefijo)).map((o) => o.name)
}

/**
 * Espera a que el HTML de `ruta` contenga (o deje de contener) `texto`.
 * `revalidatePath` no regenera al vuelo: la página se vuelve a construir en la
 * SIGUIENTE petición, así que se reintenta 30 s de segundo en segundo.
 */
async function esperarHtml(
  ctx: APIRequestContext,
  ruta: string,
  texto: string,
  debeAparecer: boolean,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const res = await ctx.get(ruta, { headers: { 'cache-control': 'no-cache' } })
        return (await res.text()).includes(texto)
      },
      {
        message:
          `El HTML de ${ruta} debía ${debeAparecer ? 'CONTENER' : 'YA NO contener'} "${texto}" ` +
          'tras la purga de caché (30 s de reintentos).',
        timeout: 30_000,
        intervals: [1000],
      },
    )
    .toBe(debeAparecer)
}

// ─── Estado compartido entre casos (serie, workers: 1) ───────────────────────

let admin: APIRequestContext
let secretario: APIRequestContext
let alumno: APIRequestContext
let anonimo: APIRequestContext
/** Contra Supabase directo, con la anon key en las cabeceras. */
let anonSupabase: APIRequestContext

let DEFAULTS: ConfigEditable
/** La fila que había antes de la suite; se repone en afterAll. */
let filaOriginal: { data: unknown; updated_by: string | null } | null = null
/** Ids de modalidad reales del cliente (no se asume '3_meses' / '6_meses'). */
let PLAN_3M = '3_meses'
let TODOS_LOS_PLANES: string[] = []
/** PNG 64×64 generado con sharp (el logo "de verdad" de las pruebas). */
let PNG_64: Buffer

test.describe.serial('Personalizar mi página — API (F4)', () => {
  test.beforeAll(async () => {
    // ── Identidades ──
    admin = await apiRequest.newContext({ baseURL: BASE_URL, storageState: ADMIN_STATE })
    anonimo = await apiRequest.newContext({ baseURL: BASE_URL })
    anonSupabase = await apiRequest.newContext({
      extraHTTPHeaders: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    })

    const s = svc()
    const { data: secre } = await s.from('usuarios').select('id, rol').eq('email', SECRETARIO_EMAIL).maybeSingle()
    if (!secre) {
      throw new Error(
        `No existe ${SECRETARIO_EMAIL} en usuarios. Define QA_SECRETARIO_EMAIL en .env.local con un usuario de rol SECRETARIO.`,
      )
    }
    const rolSecre = String((secre as { rol?: string }).rol ?? '').toUpperCase()
    if (rolSecre !== 'SECRETARIO') {
      throw new Error(`${SECRETARIO_EMAIL} tiene rol ${rolSecre || '(vacío)'}, se esperaba SECRETARIO.`)
    }
    secretario = await contextoDe(SECRETARIO_EMAIL)
    alumno = await contextoDe(ALUMNO_EMAIL)

    // ── Pizarra limpia ──
    filaOriginal = await filaEnBD()
    // El DELETE del admin hace las tres cosas de golpe: data = {}, bucket vacío
    // y purga de la caché de getSiteConfig(). Si fallara (cliente sin migración,
    // sesión caducada), se deja al menos la fila en {} con el service role.
    const limpieza = await admin.delete('/api/admin/configuracion')
    if (!limpieza.ok()) {
      const { error: upErr } = await s
        .from('site_config')
        .upsert({ id: 1, data: {}, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      throw new Error(
        `[beforeAll] DELETE /api/admin/configuracion devolvió ${limpieza.status()}: ${(await limpieza.text()).slice(0, 300)}` +
          (upErr ? ` (y el upsert de respaldo falló: ${upErr.message})` : ''),
      )
    }

    // ── Defaults del cliente (nada se hardcodea del config de la plantilla) ──
    const g = await json<RespuestaGet>(await admin.get('/api/admin/configuracion'))
    DEFAULTS = g.defaults
    TODOS_LOS_PLANES = DEFAULTS.modalidades.map((m) => m.id)
    PLAN_3M = DEFAULTS.modalidades.find((m) => m.meses === 3)?.id ?? TODOS_LOS_PLANES[0]

    PNG_64 = await sharp({
      create: { width: 64, height: 64, channels: 4, background: { r: 4, g: 120, b: 87, alpha: 1 } },
    })
      .png()
      .toBuffer()
  })

  test.afterAll(async () => {
    // ORDEN: primero el DELETE (vacía bucket + PURGA la caché), después se
    // repone la fila con el service role. Al revés el DELETE borraría lo
    // restaurado. Como la purga deja el tag vacío, la siguiente lectura de
    // getSiteConfig() ya ve la fila repuesta.
    try {
      await admin.delete('/api/admin/configuracion')
    } catch { /* el servidor puede haberse caído: se limpia igual abajo */ }

    const s = svc()
    const restos = await objetosBranding('logo-')
    if (restos.length > 0) await s.storage.from(BUCKET).remove(restos)

    const data = esObjeto(filaOriginal?.data) ? (filaOriginal!.data as Record<string, unknown>) : {}
    const { error } = await s
      .from('site_config')
      .upsert(
        { id: 1, data, updated_at: new Date().toISOString(), updated_by: filaOriginal?.updated_by ?? null },
        { onConflict: 'id' },
      )
    if (error) console.error('[afterAll] no se pudo restaurar site_config:', error.message)
    else console.log(`[afterAll] site_config restaurada (${Object.keys(data).length} claves) y bucket limpio`)

    for (const ctx of [admin, secretario, alumno, anonimo, anonSupabase]) {
      if (ctx) await ctx.dispose()
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // b1 — Permisos: quién puede leer, quién puede escribir
  // ══════════════════════════════════════════════════════════════════════════
  test('b1 — solo el ADMIN escribe; el SECRETARIO lee sin editar; el alumno y el anónimo no pasan', async () => {
    const cuerpo = { nombre: 'Intento no autorizado' }
    const logo = { file: { name: 'logo.png', mimeType: 'image/png', buffer: PNG_1X1 } }

    // ── PUT ──
    const putAlumno = await alumno.put('/api/admin/configuracion', { data: cuerpo })
    expect(putAlumno.status(), 'PUT como ALUMNO debe dar 403').toBe(403)
    const putSecre = await secretario.put('/api/admin/configuracion', { data: cuerpo })
    expect(putSecre.status(), 'PUT como SECRETARIO debe dar 403 (ve el editor, no guarda)').toBe(403)
    const putAnon = await anonimo.put('/api/admin/configuracion', { data: cuerpo })
    expect(putAnon.status(), 'PUT sin sesión debe dar 401').toBe(401)

    // ── DELETE ──
    expect((await alumno.delete('/api/admin/configuracion')).status(), 'DELETE como ALUMNO → 403').toBe(403)
    expect((await secretario.delete('/api/admin/configuracion')).status(), 'DELETE como SECRETARIO → 403').toBe(403)
    expect((await anonimo.delete('/api/admin/configuracion')).status(), 'DELETE sin sesión → 401').toBe(401)

    // ── POST logo ──
    const ruta = '/api/admin/configuracion/logo?variante=claro'
    expect((await alumno.post(ruta, { multipart: logo })).status(), 'POST logo como ALUMNO → 403').toBe(403)
    expect((await secretario.post(ruta, { multipart: logo })).status(), 'POST logo como SECRETARIO → 403').toBe(403)
    expect((await anonimo.post(ruta, { multipart: logo })).status(), 'POST logo sin sesión → 401').toBe(401)

    // ── DELETE logo ──
    expect((await alumno.delete(ruta)).status(), 'DELETE logo como ALUMNO → 403').toBe(403)
    expect((await secretario.delete(ruta)).status(), 'DELETE logo como SECRETARIO → 403').toBe(403)
    expect((await anonimo.delete(ruta)).status(), 'DELETE logo sin sesión → 401').toBe(401)

    // ── GET: el secretario SÍ lee, en solo lectura ──
    const getSecre = await secretario.get('/api/admin/configuracion')
    expect(getSecre.status(), 'GET como SECRETARIO → 200').toBe(200)
    const bodySecre = await json<RespuestaGet>(getSecre)
    expect(bodySecre.puedeEditar, 'El SECRETARIO no debe poder editar').toBe(false)
    expect(bodySecre.defaults.nombre, 'El GET del secretario trae los defaults').toBeTruthy()

    expect((await alumno.get('/api/admin/configuracion')).status(), 'GET como ALUMNO → 403').toBe(403)
    expect((await anonimo.get('/api/admin/configuracion')).status(), 'GET sin sesión → 401').toBe(401)

    // Nada de lo anterior tocó la fila.
    expect(await dataEnBD(), 'Ningún intento no autorizado debe haber escrito').toEqual({})
  })

  // ══════════════════════════════════════════════════════════════════════════
  // b2 — Validación: lo que el PUT del admin rechaza
  // ══════════════════════════════════════════════════════════════════════════
  test('b2 — el PUT del ADMIN rechaza claves fuera de la lista blanca y valores inválidos', async () => {
    async function rechaza(
      etiqueta: string,
      cuerpo: Record<string, unknown>,
      esperado: RegExp,
    ): Promise<RespuestaError> {
      const res = await admin.put('/api/admin/configuracion', { data: cuerpo })
      const body = await json<RespuestaError>(res)
      expect(res.status(), `${etiqueta}: se esperaba 400, llegó ${res.status()} (${JSON.stringify(body)})`).toBe(400)
      expect(body.error, `${etiqueta}: el mensaje debe explicar el motivo`).toMatch(esperado)
      return body
    }

    // Clave de producto, fuera de F1 a propósito.
    await rechaza('modo', { modo: 'solo_cursos' }, /modo/)

    // Subclave de landing que NO es editable (arrastra rutas y lógica de cobro).
    await rechaza(
      'landing.mostrarCatalogoCursos',
      { landing: { mostrarCatalogoCursos: false } },
      /landing\.mostrarCatalogoCursos/,
    )

    // Color que no es hex.
    await rechaza('colores.acento', { colores: { acento: 'rojo' } }, /hex|#RRGGBB/i)

    // HTML en un texto de la landing: ni `<` ni `>` viajan a la BD.
    await rechaza('landing.hero_titulo con <script>', { landing: { hero_titulo: '<script>alert(1)</script>' } }, /< ni >|caracteres/i)

    // Apagar TODAS las modalidades dejaría el registro sin planes que ofrecer.
    const todasApagadas = Object.fromEntries(TODOS_LOS_PLANES.map((id) => [id, { activa: false }]))
    await rechaza('modalidades todas inactivas', { modalidades: todasApagadas }, /al menos una/i)

    // Precio por encima del tope del catálogo (50 000).
    const precio = await rechaza('precios.inscripcion = 50001', { precios: { inscripcion: 50001 } }, /50000|entre/i)
    expect(precio.clave, 'El error debe señalar el campo para que el editor lo pinte').toBe('precios.inscripcion')

    // whatsappUrl se DERIVA del número: mandarlo suelto es un error.
    await rechaza('whatsappUrl sin whatsapp', { whatsappUrl: 'https://wa.me/1' }, /se deriva de whatsapp/i)

    // Ningún rechazo escribió nada.
    expect(await dataEnBD(), 'Un PUT rechazado no debe dejar rastro en la fila').toEqual({})
  })

  // ══════════════════════════════════════════════════════════════════════════
  // b3 — Guardado válido: fila, merge y alias derivados
  // ══════════════════════════════════════════════════════════════════════════
  test('b3 — el PUT válido guarda, fusiona y deriva los alias de precios', async () => {
    const cuerpo = {
      nombre: 'Escuela QA',
      colores: { acento: '#047857' },
      landing: { hero_titulo: 'Título QA' },
      modalidades: { [PLAN_3M]: { mensualidad: 2500 } },
      precios: { inscripcion: 750 },
    }

    const res = await admin.put('/api/admin/configuracion', { data: cuerpo })
    const put = await json<RespuestaPut>(res)
    expect(res.status(), `PUT válido debe dar 200 (${JSON.stringify(put)})`).toBe(200)

    expect(put.merged.nombre, 'El merge devuelve el nombre nuevo').toBe('Escuela QA')
    expect(put.merged.precios.inscripcion, 'Precio canónico de inscripción').toBe(750)
    expect(put.merged.colores.acento, 'El hex se normaliza a mayúsculas').toBe('#047857')
    expect(put.merged.landing.hero_titulo, 'Texto del hero').toBe('Título QA')

    const plan3Merged = put.merged.modalidades.find((m) => m.id === PLAN_3M)
    expect(plan3Merged?.mensualidad, `Mensualidad del plan ${PLAN_3M} en el merge`).toBe(2500)

    // ── ALIAS LEGACY (plan3mMensualidad, secundaria_3meses_normal…) ──
    // OJO: la respuesta de la API viene RECORTADA a CLAVES_EDITABLES
    // (recortarAEditables), y los alias NO están en la lista blanca: en
    // `merged.precios` solo viajan inscripcion / certificacionSecundaria /
    // certificacionPreparatoria. La derivación se comprueba sobre el merge
    // COMPLETO — el mismo `mergeSiteConfig` que corre en el servidor, aplicado
    // a los overrides que la API acaba de guardar.
    expect(
      put.merged.precios.plan3mMensualidad,
      'La API recorta a la lista blanca: los alias NO deben viajar en merged.precios',
    ).toBeUndefined()
    const completo = mergeSiteConfig(CONFIG, put.overrides)
    expect(completo.precios.plan3mMensualidad, 'Alias legacy plan3mMensualidad').toBe(2500)
    expect(completo.precios.secundaria_3meses_normal, 'Alias legacy secundaria_3meses_normal').toBe(2500)
    expect(completo.precios.inscripcion, 'El canónico sigue en el merge completo').toBe(750)

    // ── GET devuelve lo mismo ──
    const get = await json<RespuestaGet>(await admin.get('/api/admin/configuracion'))
    expect(get.overrides, 'El GET devuelve los overrides recién guardados').toEqual(put.overrides)
    expect(get.overrides).toMatchObject({
      nombre: 'Escuela QA',
      colores: { acento: '#047857' },
      landing: { hero_titulo: 'Título QA' },
      modalidades: { [PLAN_3M]: { mensualidad: 2500 } },
      precios: { inscripcion: 750 },
    })
    expect(get.merged, 'El merge del GET es idéntico al del PUT').toEqual(put.merged)
    expect(get.puedeEditar, 'El ADMIN sí puede editar').toBe(true)

    // ── La fila en la BD (service role) ──
    const fila = await filaEnBD()
    expect(esObjeto(fila?.data) ? (fila!.data as Record<string, unknown>).nombre : undefined).toBe('Escuela QA')
    expect(fila?.updated_by, 'updated_by debe quedar con el id del admin que guardó').toBeTruthy()
  })

  // ══════════════════════════════════════════════════════════════════════════
  // b4 — DECISIÓN (b): el PUT IGNORA logo / logoOscuro
  // ══════════════════════════════════════════════════════════════════════════
  test('b4 — el PUT descarta logo y logoOscuro del cuerpo y lo avisa con logosIgnorados', async () => {
    const res = await admin.put('/api/admin/configuracion', {
      data: {
        nombre: 'Escuela QA 2',
        logo: 'https://evil.com/x.png',
        logoOscuro: 'https://evil.com/y.png',
      },
    })
    const put = await json<RespuestaPut>(res)
    expect(res.status(), `Mandar logos NO es un error (${JSON.stringify(put)})`).toBe(200)
    expect(put.logosIgnorados, 'La respuesta avisa de que los logos se descartaron').toBe(true)
    expect(put.nota, 'La nota explica por dónde se cambian los logos').toMatch(/configuracion\/logo/)

    // Ni en la fila…
    const data = await dataEnBD()
    expect(data.nombre, 'El resto del cuerpo sí se guarda').toBe('Escuela QA 2')
    expect(data.logo, 'logo NO debe quedar en la fila').toBeUndefined()
    expect(data.logoOscuro, 'logoOscuro NO debe quedar en la fila').toBeUndefined()

    // …ni en el merge (sigue el default de config.ts: '/logo.png' en la plantilla).
    expect(put.merged.logo, 'merged.logo debe seguir siendo el default').toBe(DEFAULTS.logo)
    expect(put.merged.logo, 'Nada de un origen externo en el <img src> de la landing').not.toContain('evil.com')
    expect(put.merged.logoOscuro, 'merged.logoOscuro debe seguir siendo el default').toBe(DEFAULTS.logoOscuro)
  })

  // ══════════════════════════════════════════════════════════════════════════
  // b5 — RLS: la anon key no escribe ni la tabla ni el bucket
  // ══════════════════════════════════════════════════════════════════════════
  test('b5 — con la anon key se lee site_config pero no se escribe, y el bucket branding no admite subidas', async () => {
    const antes = await dataEnBD()
    const tabla = `${SUPABASE_URL}/rest/v1/site_config`

    // ── SELECT: abierto a propósito (la landing pública lee logo/colores) ──
    const get = await anonSupabase.get(`${tabla}?select=id,data`)
    expect(get.status(), 'La lectura con anon key debe funcionar (política "lectura abierta")').toBe(200)

    // ── INSERT: sin política → 42501 ──
    const post = await anonSupabase.post(tabla, {
      headers: { 'content-type': 'application/json', Prefer: 'return=representation' },
      data: { id: 1, data: { hackeado: true } },
    })
    const errPost = await json<ErrorPostgrest>(post)
    expect(
      [401, 403],
      `El INSERT anónimo debía ser rechazado, llegó ${post.status()}: ${JSON.stringify(errPost)}`,
    ).toContain(post.status())
    expect(errPost.code, 'Postgres debe rechazarlo por RLS/permisos (42501)').toBe('42501')

    // ── UPDATE: hay privilegio de tabla pero NINGUNA política → 0 filas ──
    const patch = await anonSupabase.fetch(`${tabla}?id=eq.1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Prefer: 'return=representation' },
      data: { data: { hackeado: true } },
    })
    expect(
      [200, 204],
      `El UPDATE anónimo no debe dar error, debe no afectar filas (llegó ${patch.status()}: ${(await patch.text()).slice(0, 300)})`,
    ).toContain(patch.status())
    if (patch.status() === 200) {
      expect(await json<unknown[]>(patch), 'El UPDATE anónimo debe afectar 0 filas').toEqual([])
    }
    expect(await dataEnBD(), 'La fila NO puede haber cambiado').toEqual(antes)

    // ── Storage: subir al bucket público sin política de INSERT ──
    const nombre = `hack-${Date.now()}.png`
    const subida = await anonSupabase.post(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${nombre}`, {
      headers: { 'content-type': 'image/png' },
      data: PNG_1X1,
    })
    const textoSubida = await subida.text()
    expect(
      [400, 403],
      `La subida anónima debía rechazarse, llegó ${subida.status()}: ${textoSubida.slice(0, 300)}`,
    ).toContain(subida.status())
    expect(textoSubida, 'El motivo debe ser la RLS del bucket').toMatch(/row[-\s]?level security/i)
    expect(await objetosBranding('hack-'), 'El bucket no debe tener el objeto del intento').toEqual([])
  })

  // ══════════════════════════════════════════════════════════════════════════
  // b6 — Logo: subir, reemplazar, borrar y rechazar lo que no es imagen
  // ══════════════════════════════════════════════════════════════════════════
  test('b6 — el logo se sube, reemplaza y borra por su propia ruta, y solo entran imágenes', async () => {
    const ruta = '/api/admin/configuracion/logo?variante=claro'

    // ── Subida ──
    const res1 = await admin.post(ruta, {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: PNG_64 } },
    })
    const logo1 = await json<RespuestaLogo>(res1)
    expect(res1.status(), `POST de un PNG válido debe dar 200 (${JSON.stringify(logo1)})`).toBe(200)
    expect(logo1.url, 'La URL debe ser pública, del bucket branding y de la variante clara').toContain(
      `${PREFIJO_PUBLICO}logo-claro-`,
    )
    expect(logo1.url.startsWith(`${PREFIJO_PUBLICO}logo-claro-`), 'La URL empieza por el prefijo público').toBe(true)
    expect(logo1.url.endsWith('.png'), 'Todo se guarda como mapa de bits (.png)').toBe(true)

    const getTrasSubida = await json<RespuestaGet>(await admin.get('/api/admin/configuracion'))
    expect(getTrasSubida.merged.logo, 'El merge ya apunta al logo subido').toBe(logo1.url)

    // ── Reemplazo: el objeto anterior se borra ──
    const res2 = await admin.post(ruta, {
      multipart: { file: { name: 'logo2.png', mimeType: 'image/png', buffer: PNG_64 } },
    })
    const logo2 = await json<RespuestaLogo>(res2)
    expect(res2.status(), 'Segunda subida → 200').toBe(200)
    expect(logo2.url, 'La segunda subida debe tener otra URL (marca de tiempo)').not.toBe(logo1.url)
    await expect
      .poll(async () => await objetosBranding('logo-claro-'), {
        message: 'Tras reemplazar solo puede quedar UN objeto logo-claro-* (el anterior se borra)',
        timeout: 15_000,
        intervals: [500],
      })
      .toHaveLength(1)
    expect(logo2.merged.logo, 'El merge apunta al logo nuevo').toBe(logo2.url)

    // ── Borrado: vuelve al default y no deja huérfanos ──
    const resDel = await admin.delete(ruta)
    const del = await json<RespuestaLogo>(resDel)
    expect(resDel.status(), `DELETE del logo → 200 (${JSON.stringify(del)})`).toBe(200)
    expect(del.merged.logo, 'Sin override, el merge cae al default de config.ts').toBe(DEFAULTS.logo)
    await expect
      .poll(async () => await objetosBranding('logo-claro-'), {
        message: 'El DELETE debe dejar el bucket sin objetos logo-claro-*',
        timeout: 15_000,
        intervals: [500],
      })
      .toHaveLength(0)
    expect((await dataEnBD()).logo, 'La clave logo desaparece de la fila (no queda en "")').toBeUndefined()

    // ── Formatos: .txt renombrado a .png ──
    const falso = await admin.post(ruta, {
      multipart: { file: { name: 'falso.png', mimeType: 'image/png', buffer: Buffer.from('hola', 'utf8') } },
    })
    expect(falso.status(), 'Manda la FIRMA de bytes, no la extensión ni el MIME').toBe(400)
    expect((await json<RespuestaError>(falso)).error).toMatch(/Formato no permitido/i)

    // ── SVG con <script> ──
    const svgMalo = await admin.post(ruta, {
      multipart: { file: { name: 'malo.svg', mimeType: 'image/svg+xml', buffer: SVG_CON_SCRIPT } },
    })
    expect(svgMalo.status(), 'Un SVG con <script> no entra al bucket público').toBe(400)
    expect((await json<RespuestaError>(svgMalo)).error).toMatch(/SVG/i)

    // ── SVG legítimo: entra rasterizado a PNG ──
    const resSvg = await admin.post(ruta, {
      multipart: { file: { name: 'bueno.svg', mimeType: 'image/svg+xml', buffer: SVG_LEGITIMO } },
    })
    const svgOk = await json<RespuestaLogo | RespuestaError>(resSvg)
    expect(
      resSvg.status(),
      `Un SVG limpio debe aceptarse y rasterizarse (${JSON.stringify(svgOk)}). ` +
        'Un 400 "no se pudo procesar" significa que el sharp de este despliegue no trae soporte de SVG.',
    ).toBe(200)
    const urlSvg = (svgOk as RespuestaLogo).url
    expect(urlSvg.endsWith('.png'), 'El SVG se guarda como PNG, nunca como documento').toBe(true)
    expect(urlSvg, 'También va al bucket branding, variante clara').toContain(`${PREFIJO_PUBLICO}logo-claro-`)

    // Nada de esto dejó basura: exactamente un objeto (el del SVG rasterizado).
    expect(await objetosBranding('logo-claro-'), 'Solo el último logo vive en el bucket').toHaveLength(1)
  })

  // ══════════════════════════════════════════════════════════════════════════
  // d — "Restaurar diseño original"
  // ══════════════════════════════════════════════════════════════════════════
  test('d — el DELETE restaura los defaults, vacía la fila y limpia el bucket', async () => {
    const res = await admin.delete('/api/admin/configuracion')
    const del = await json<{ ok: true; merged: ConfigEditable; overrides: Record<string, unknown> }>(res)
    expect(res.status(), `DELETE /api/admin/configuracion → 200 (${JSON.stringify(del.overrides)})`).toBe(200)

    expect(del.overrides, 'Sin overrides tras restaurar').toEqual({})
    expect(del.merged.nombre, 'El nombre vuelve al de config.ts').toBe(DEFAULTS.nombre)
    expect(del.merged, 'El merge completo debe ser idéntico a los defaults').toEqual(DEFAULTS)
    expect(del.merged.logo, 'Y el logo vuelve al del repo').toBe(DEFAULTS.logo)

    expect(await dataEnBD(), 'La fila queda en {}').toEqual({})
    await expect
      .poll(async () => await objetosBranding(), {
        message: 'Restaurar el diseño original vacía el bucket branding (ya nadie referencia esos logos)',
        timeout: 15_000,
        intervals: [500],
      })
      .toEqual([])

    // Y el GET lo confirma.
    const get = await json<RespuestaGet>(await admin.get('/api/admin/configuracion'))
    expect(get.overrides).toEqual({})
    expect(get.merged).toEqual(get.defaults)
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c-api — Frescura sin redeploy: el cambio llega a las páginas públicas
  // ══════════════════════════════════════════════════════════════════════════
  test('c-api — lo que guarda el admin aparece en la landing pública sin volver a desplegar', async ({ page }) => {
    // Dos esperas de hasta 30 s + capturas: el timeout de 120 s del config se queda corto.
    test.setTimeout(180_000)

    const TITULO = 'Título QA vivo'
    const res = await admin.put('/api/admin/configuracion', {
      data: {
        landing: { hero_titulo: TITULO },
        modalidades: { [PLAN_3M]: { mensualidad: 2500 } },
      },
    })
    const put = await json<RespuestaPut>(res)
    expect(res.status(), `PUT de frescura → 200 (${JSON.stringify(put)})`).toBe(200)

    // ── La landing pública (sin sesión) ya lo pinta ──
    await esperarHtml(anonimo, '/', TITULO, true)

    // ── /register: la etiqueta de la modalidad sigue saliendo del config ──
    const activa = DEFAULTS.modalidades.find((m) => m.id === PLAN_3M && m.activa) ?? DEFAULTS.modalidades.find((m) => m.activa)
    expect(activa, 'El cliente debe tener al menos una modalidad activa').toBeTruthy()
    const htmlRegister = await (await anonimo.get('/register')).text()
    expect(
      htmlRegister,
      `El <option> del plan "${activa!.label}" debe estar en el HTML de /register. ` +
        'Si el cliente corre en modo solo_cursos, ese bloque no se dibuja y este caso no aplica.',
    ).toContain(activa!.label)

    // ── El precio nuevo llega al panel (getSiteConfig purgado, no cacheado) ──
    await expect
      .poll(
        async () => {
          const planes = await json<Plan[]>(await admin.get('/api/admin/planes'))
          return planes.find((p) => p.id === PLAN_3M)?.precio_mensual
        },
        {
          message: `/api/admin/planes debe publicar la mensualidad nueva del plan ${PLAN_3M}`,
          timeout: 30_000,
          intervals: [1000],
        },
      )
      .toBe(2500)

    // Captura: es el único sitio donde el resultado se ve, no se deduce.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: TITULO })).toBeVisible()
    await page.screenshot({ path: SHOT('personalizar-landing-titulo-vivo'), fullPage: true })

    // ── Restaurar: el título desaparece igual de rápido ──
    const resDel = await admin.delete('/api/admin/configuracion')
    expect(resDel.status(), 'DELETE tras la prueba de frescura → 200').toBe(200)
    await esperarHtml(anonimo, '/', TITULO, false)
  })
})
