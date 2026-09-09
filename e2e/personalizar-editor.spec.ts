/**
 * QA de "Personalizar mi página" (F5) — el EDITOR, por la interfaz.
 *
 * El hermano de e2e/personalizar-api.spec.ts: aquél ataca los endpoints y la
 * RLS; éste hace lo que hace el admin de una escuela con el ratón — abrir
 * /admin/configuracion, elegir una paleta, cambiar un texto y dos precios,
 * pulsar "Publicar cambios" y COMPROBAR QUE LA PÁGINA PÚBLICA CAMBIÓ SIN
 * REDEPLOY. Ése es el argumento de venta del módulo, así que es exactamente lo
 * que se prueba de punta a punta.
 *
 * CUATRO IDENTIDADES, cuatro contextos de navegador:
 *   ADMIN       → storageState acuñado por globalSetup (e2e/.auth/admin.json)
 *   ANÓNIMO     → contexto sin cookies (la landing y /register)
 *   ALUMNO      → login REAL por formulario (QA_ALUMNO_EMAIL/PASSWORD)
 *   SECRETARIO  → sesión acuñada aquí (ve el editor, no lo edita)
 *
 * UNA SOLA PÁGINA DE ADMIN PARA c1..c5 y (d-ui). El borrador del editor vive
 * SOLO EN MEMORIA (ver el comentario de `beforeunload` en la página): si cada
 * caso abriera su propia pestaña, la paleta de c2 y el texto de c3 no
 * llegarían vivos a la publicación de c5. Por eso la página se crea en
 * `beforeAll` y se comparte, y por eso el describe es `.serial`.
 *
 * ⚠️ DESTRUCTIVA, igual que la suite de API: deja `site_config.data = {}` y
 * VACÍA el bucket `branding` para partir de una pizarra limpia. La fila se
 * guarda en `beforeAll` y se repone en `afterAll` (los BYTES de un logo que
 * estuviera en el bucket no se pueden restaurar). Corre SOLO contra la base de
 * QA. Ver e2e/README-QA.md.
 */
import {
  test,
  expect,
  request as apiRequest,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { svc, mintSession, storageStateFromSession, ALUMNO_EMAIL, ALUMNO_PASSWORD } from './_helpers'
import { PALETAS } from '@/lib/site-config-paletas'
import { campoPorClave } from '@/lib/site-config-campos'

// ─── Constantes de entorno ───────────────────────────────────────────────────

/** El mismo de playwright.config.ts (baseURL + webServer). */
const BASE_URL = 'http://localhost:3000'
const ADMIN_STATE = join(process.cwd(), 'e2e', '.auth', 'admin.json')
const SHOT = (n: string) => join('e2e', 'screenshots', `${n}.png`)
/** El del proyecto `chromium` de playwright.config.ts: ≥1024 px → hay columna de vista previa. */
const VIEWPORT = { width: 1366, height: 900 }

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

// ─── Datos que escribe esta suite ────────────────────────────────────────────

const TEXTO_HERO_QA = 'Certifícate con nosotros QA'
const MENSUALIDAD_QA = 2500
const INSCRIPCION_QA = 750

/** Texto EXACTO del modal de precios (page.tsx → CONFIRMA_PRECIOS). */
const CONFIRMA_PRECIOS =
  'Estos precios se actualizarán en tu página pública, en el registro de alumnos y en los montos sugeridos del sistema. ¿Confirmar?'

/** Texto EXACTO del modal de restaurar (page.tsx → CONFIRMA_RESTAURAR). */
const CONFIRMA_RESTAURAR =
  'Se borrarán todos tus cambios y tu logo; tu página volverá al diseño de la plantilla. ¿Continuar?'

/** Las cinco pestañas del editor, en el orden de PESTANAS (page.tsx). */
const PESTANAS = ['Identidad', 'Colores', 'Textos de mi página', 'Precios', 'Cuenta'] as const

// ─── Tipos de la respuesta del API (solo lo que se afirma) ───────────────────

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
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

async function json<T>(res: { json(): Promise<unknown>; text(): Promise<string>; status(): number }): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new Error(`Respuesta ${res.status()} sin JSON: ${(await res.text()).slice(0, 500)}`)
  }
}

/**
 * Id del control de una clave. Copia literal de `idDeCampo` de
 * components/admin/personalizar/Comunes.tsx: se replica en vez de importarse
 * para no arrastrar un módulo 'use client' (con lucide-react dentro) al
 * proceso de Playwright. Si allá cambia la regla, este selector se cae y hay
 * que actualizarlo aquí.
 */
function idDeCampo(clave: string): string {
  return `pmp-${clave.replace(/[^A-Za-z0-9]+/g, '-')}`
}

/** '#047857' → 'rgb(4, 120, 87)', que es como getComputedStyle devuelve un color. */
function rgbDe(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`Hex no reconocido: ${hex}`)
  const n = parseInt(m[1], 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

/** El MISMO formateo de precios que LandingClient (`fmt`). */
function fmt(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

/** Una paleta del catálogo por id, con error claro si el catálogo cambió. */
function paleta(id: string) {
  const p = PALETAS.find((x) => x.id === id)
  if (!p) throw new Error(`No existe la paleta '${id}' en PALETAS (site-config-paletas.ts)`)
  return p
}

/** La fila id=1 tal cual está en la BD (service role: salta la RLS). */
async function filaEnBD(): Promise<{ data: unknown; updated_by: string | null } | null> {
  const { data, error } = await svc().from('site_config').select('data, updated_by').eq('id', 1).maybeSingle()
  if (error) throw new Error(`site_config select: ${error.message}`)
  return (data as { data: unknown; updated_by: string | null } | null) ?? null
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

/** El atributo style del <body> sin espacios: `--color-acento:#047857;…`. */
async function estiloDelBody(pagina: Page): Promise<string> {
  const crudo = await pagina.locator('body').getAttribute('style')
  return (crudo ?? '').replace(/\s+/g, '').toUpperCase()
}

// ─── Estado compartido entre casos (serie, workers: 1) ───────────────────────

/** Contexto y página del ADMIN: viven toda la suite para no perder el borrador. */
let ctxAdmin: BrowserContext
let editor: Page
/** Peticiones sueltas como admin (GET/DELETE del API) y como anónimo (HTML público). */
let adminApi: APIRequestContext
let anonApi: APIRequestContext

let DEFAULTS: ConfigEditable
/** El plan de 3 meses del cliente (no se asume el id '3_meses'). */
let PLAN_3M: ModalidadEditable
/** Título del hero de fábrica: es al que hay que volver al restaurar. */
let HERO_DEFAULT = ''
/** Id del alumno de QA (alumnos.id = usuarios.id en la plantilla). */
let ALUMNO_ID = ''
/** La fila que había antes de la suite; se repone en afterAll. */
let filaOriginal: { data: unknown; updated_by: string | null } | null = null

const MAX_HERO = campoPorClave('landing.hero_titulo')?.max ?? 60

// La sesión de admin la acuña globalSetup; el `page` de los casos que no
// comparten borrador (c6) entra ya como administrador.
test.use({ storageState: ADMIN_STATE })

// ⚠️ Con `test.use({ storageState })` a nivel de archivo, `browser.newContext()`
// dentro de un test HEREDA esa sesión de admin (Playwright aplica las opciones
// de contexto por defecto). Un contexto "anónimo" o "del alumno" debe pasar un
// storageState vacío explícito o /login lo redirige al panel del admin.
const SIN_SESION = { cookies: [], origins: [] }

test.describe.serial('Personalizar mi página — editor (F5)', () => {
  test.beforeAll(async ({ browser }) => {
    adminApi = await apiRequest.newContext({ baseURL: BASE_URL, storageState: ADMIN_STATE })
    anonApi = await apiRequest.newContext({ baseURL: BASE_URL })

    // ── Pizarra limpia (mismo procedimiento que personalizar-api.spec.ts) ──
    filaOriginal = await filaEnBD()
    const limpieza = await adminApi.delete('/api/admin/configuracion')
    if (!limpieza.ok()) {
      const { error: upErr } = await svc()
        .from('site_config')
        .upsert({ id: 1, data: {}, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      throw new Error(
        `[beforeAll] DELETE /api/admin/configuracion devolvió ${limpieza.status()}: ${(await limpieza.text()).slice(0, 300)}` +
          (upErr ? ` (y el upsert de respaldo falló: ${upErr.message})` : ''),
      )
    }

    // ── Defaults del cliente: nada de esta suite se hardcodea de la plantilla ──
    const g = await json<RespuestaGet>(await adminApi.get('/api/admin/configuracion'))
    DEFAULTS = g.defaults
    PLAN_3M = DEFAULTS.modalidades.find((m) => m.meses === 3) ?? DEFAULTS.modalidades[0]
    if (!PLAN_3M) throw new Error('[beforeAll] el cliente no declara ninguna modalidad en CONFIG.modalidades')
    HERO_DEFAULT = String(DEFAULTS.landing.hero_titulo ?? '')

    // ── Alumno de QA (para la ficha /admin/alumnos/[id] de c6) ──
    const { data: alu } = await svc().from('usuarios').select('id').eq('email', ALUMNO_EMAIL).single()
    if (!alu) throw new Error(`[beforeAll] no existe ${ALUMNO_EMAIL} en usuarios`)
    ALUMNO_ID = String((alu as { id: string }).id)

    // ── La pestaña del admin que sobrevive a todos los casos ──
    ctxAdmin = await browser.newContext({
      baseURL: BASE_URL,
      storageState: ADMIN_STATE,
      viewport: VIEWPORT,
    })
    editor = await ctxAdmin.newPage()
  })

  test.afterAll(async () => {
    // ORDEN: primero el DELETE (vacía bucket + PURGA la caché), después se
    // repone la fila con el service role. Al revés el DELETE borraría lo
    // restaurado.
    try {
      await adminApi.delete('/api/admin/configuracion')
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

    if (editor) await editor.close()
    if (ctxAdmin) await ctxAdmin.close()
    for (const ctx of [adminApi, anonApi]) if (ctx) await ctx.dispose()
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c1 — El editor carga entero
  // ══════════════════════════════════════════════════════════════════════════
  test('c1 — el editor carga con sus 5 pestañas, su barra y sin cambios pendientes', async () => {
    await editor.goto('/admin/configuracion')

    await expect(editor.getByRole('heading', { name: 'Personalizar mi página' })).toBeVisible()

    // Las cinco pestañas del tablist, ni una más.
    await expect(editor.getByRole('tab')).toHaveCount(PESTANAS.length)
    for (const etiqueta of PESTANAS) {
      await expect(editor.getByRole('tab', { name: etiqueta })).toBeVisible()
    }

    // Barra inferior: las dos acciones que escriben en la base.
    const publicar = editor.getByRole('button', { name: 'Publicar cambios' })
    await expect(publicar).toBeVisible()
    // Sin borrador no hay nada que publicar: el botón nace apagado.
    await expect(publicar).toBeDisabled()
    await expect(editor.getByRole('button', { name: 'Restaurar diseño original' })).toBeVisible()

    // Recién cargado no puede haber borrador.
    await expect(editor.getByText('Cambios sin publicar')).toHaveCount(0)
    await expect(editor.getByText('Todo publicado')).toBeVisible()

    // La entrada del menú lateral (el emoji va dentro del nombre accesible).
    await expect(editor.getByRole('link', { name: 'Personalizar mi página' })).toBeVisible()

    await editor.screenshot({ path: SHOT('personalizar-01-editor'), fullPage: true })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c2 — Paletas: la vista previa cambia de acento con cada una
  // ══════════════════════════════════════════════════════════════════════════
  test('c2 — elegir paleta marca la tarjeta, ensucia el borrador y repinta la vista previa', async () => {
    await editor.getByRole('tab', { name: 'Colores' }).click()

    // La vista previa es el <aside> que lleva el encabezado "Vista previa"; su
    // ÚNICO <button> es el CTA decorativo pintado con `colores.acento`.
    const previa = editor
      .locator('aside')
      .filter({ has: editor.getByRole('heading', { name: 'Vista previa' }) })
    const ctaPrevia = previa.locator('button')

    /** Clic en una tarjeta de paleta + las tres comprobaciones que importan. */
    async function elegirPaleta(id: string, archivo?: string) {
      const p = paleta(id)
      const tarjeta = editor.getByRole('button', { name: p.nombre })
      await tarjeta.click()
      // La tarjeta queda marcada (aria-pressed, que es lo que anuncia el check).
      await expect(tarjeta).toHaveAttribute('aria-pressed', 'true')
      // Y la vista previa YA enseña el acento de esa paleta (toHaveCSS lee
      // getComputedStyle del botón primario y reintenta hasta que React repinta).
      await expect(ctaPrevia).toHaveCSS('background-color', rgbDe(p.colores.acento))
      if (archivo) await editor.screenshot({ path: SHOT(archivo), fullPage: true })
    }

    await elegirPaleta('verde-esmeralda', 'personalizar-02-paleta-verde')
    // El borrador ya no está limpio: la barra tiene que decirlo.
    await expect(editor.getByText('Cambios sin publicar')).toBeVisible()
    await expect(editor.getByRole('button', { name: 'Publicar cambios' })).toBeEnabled()

    await elegirPaleta('guinda', 'personalizar-03-paleta-guinda')
    await elegirPaleta('morado', 'personalizar-04-paleta-morado')

    // Se publica la verde: es la que comprueban c6 y (d-ui).
    await elegirPaleta('verde-esmeralda')
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c3 — Textos: el título del hero y su contador
  // ══════════════════════════════════════════════════════════════════════════
  test('c3 — el título del hero se escribe y el contador mide lo que se va a publicar', async () => {
    await editor.getByRole('tab', { name: 'Textos de mi página' }).click()

    // `exact` obligatorio: existe también "Título del hero (línea resaltada)".
    const campo = editor.getByLabel('Título del hero', { exact: true })
    await campo.fill(TEXTO_HERO_QA)
    await expect(campo).toHaveValue(TEXTO_HERO_QA)

    // El contador vive en la cabecera del MISMO campo: se acota por el
    // contenedor más interno que envuelve al input (su id es determinista).
    const bloque = editor
      .locator('div')
      .filter({ has: editor.locator(`#${idDeCampo('landing.hero_titulo')}`) })
      .last()
    await expect(
      bloque.getByText(`${TEXTO_HERO_QA.length}/${MAX_HERO}`, { exact: true }),
    ).toBeVisible()
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c4 — Precios: mensualidad, inscripción y el candado del último plan activo
  // ══════════════════════════════════════════════════════════════════════════
  test('c4 — se editan mensualidad e inscripción y no se puede apagar el último plan', async () => {
    await editor.getByRole('tab', { name: 'Precios' }).click()

    // Mensualidad del plan de 3 meses: se acota a SU tarjeta porque todos los
    // planes tienen un campo etiquetado "Mensualidad".
    const tarjeta3m = editor.locator(`#${idDeCampo(`modalidades.${PLAN_3M.id}`)}`)
    const mensualidad = tarjeta3m.getByLabel('Mensualidad')
    await mensualidad.fill(String(MENSUALIDAD_QA))
    await expect(mensualidad).toHaveValue(String(MENSUALIDAD_QA))

    const inscripcion = editor.getByLabel('Inscripción', { exact: true })
    await inscripcion.fill(String(INSCRIPCION_QA))
    await expect(inscripcion).toHaveValue(String(INSCRIPCION_QA))

    // Se apagan todos los planes menos el de 3 meses…
    const apagados = DEFAULTS.modalidades.filter((m) => m.activa && m.id !== PLAN_3M.id)
    for (const m of apagados) {
      await editor.getByRole('switch', { name: `Apagar el plan ${m.label}` }).click()
    }

    // …y el que queda ya no se puede apagar: el interruptor cambia de etiqueta
    // ("Debe quedar al menos una modalidad activa") y se deshabilita.
    const ultimo = editor.getByRole('switch', { name: 'Debe quedar al menos una modalidad activa' })
    await expect(ultimo).toBeVisible()
    await expect(ultimo).toBeDisabled()

    // Se deja el estado de partida: todos los planes activos otra vez.
    for (const m of apagados) {
      await editor.getByRole('switch', { name: `Encender el plan ${m.label}` }).click()
    }
    for (const m of DEFAULTS.modalidades.filter((x) => x.activa)) {
      await expect(editor.getByRole('switch', { name: `Apagar el plan ${m.label}` })).toBeEnabled()
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c5 — Publicar: modal de precios, aviso y enlace a la página
  // ══════════════════════════════════════════════════════════════════════════
  test('c5 — publicar pide confirmación de precios y deja el borrador limpio', async () => {
    // Fuera del modal solo existe el botón de la barra.
    await editor.getByRole('button', { name: 'Publicar cambios' }).click()

    const modal = editor.getByRole('dialog', { name: 'Vas a cambiar precios' })
    await expect(modal).toBeVisible()
    // Texto EXACTO: es la promesa que se le hace al admin sobre dónde se mueven
    // esos precios (página pública, registro y montos sugeridos).
    await expect(modal.getByText(CONFIRMA_PRECIOS, { exact: true })).toBeVisible()

    await modal.getByRole('button', { name: 'Publicar cambios' }).click()

    await expect(
      editor.getByText('Cambios publicados. Pueden tardar unos segundos en verse.'),
    ).toBeVisible()

    const enlace = editor.getByRole('link', { name: 'Ver mi página' })
    await expect(enlace).toBeVisible()
    await expect(enlace).toHaveAttribute('href', '/')
    await expect(enlace).toHaveAttribute('target', '_blank')

    // Borrador y publicado vuelven a ser lo mismo.
    await expect(editor.getByText('Cambios sin publicar')).toHaveCount(0)

    await editor.screenshot({ path: SHOT('personalizar-05-publicado'), fullPage: true })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c6 — SIN REDEPLOY: la landing, el registro y la ficha del alumno ya cambiaron
  // ══════════════════════════════════════════════════════════════════════════
  test('c6 — lo publicado se ve en la landing, en /register y en la ficha del alumno', async ({
    browser,
    page,
  }) => {
    const acento = paleta('verde-esmeralda').colores.acento

    // ── Landing, como visitante sin cookies ──
    await esperarHtml(anonApi, '/', TEXTO_HERO_QA, true)
    await esperarHtml(anonApi, '/', fmt(MENSUALIDAD_QA), true)

    const ctxAnon = await browser.newContext({ baseURL: BASE_URL, viewport: VIEWPORT, storageState: SIN_SESION })
    const anon = await ctxAnon.newPage()
    try {
      await anon.goto('/')
      await expect(anon.getByRole('heading', { level: 1, name: TEXTO_HERO_QA })).toBeVisible()

      // Precios: la mensualidad del plan de 3 meses y la inscripción, con el
      // formato de `fmt` (es-MX, sin decimales).
      await expect(anon.getByText(fmt(MENSUALIDAD_QA)).first()).toBeVisible()
      await expect(anon.getByText(`Inscripción: ${fmt(INSCRIPCION_QA)}`).first()).toBeVisible()

      // El layout inyecta la paleta como variables CSS en el <body>.
      expect(await estiloDelBody(anon)).toContain(`--COLOR-ACENTO:${acento.toUpperCase()}`)

      await anon.screenshot({ path: SHOT('personalizar-06-landing'), fullPage: true })

      // ── Registro: la modalidad activa se ofrece con su etiqueta ──
      await esperarHtml(anonApi, '/register', PLAN_3M.label, true)
    } finally {
      await ctxAnon.close()
    }

    // ── Ficha del alumno: el aviso de inscripción usa el precio publicado ──
    // El importe solo se pinta en el modal "Confirmar pago", que únicamente
    // existe si la inscripción NO está marcada como pagada. Se fuerza ese
    // estado y se repone al terminar (el modal por sí solo no escribe nada).
    const s = svc()
    const { data: fila } = await s
      .from('alumnos')
      .select('inscripcion_pagada')
      .eq('id', ALUMNO_ID)
      .maybeSingle()
    const pagadaAntes = Boolean((fila as { inscripcion_pagada?: boolean } | null)?.inscripcion_pagada)
    if (pagadaAntes) await s.from('alumnos').update({ inscripcion_pagada: false }).eq('id', ALUMNO_ID)

    try {
      await expect
        .poll(
          async () => {
            await page.goto(`/admin/alumnos/${ALUMNO_ID}`)
            const boton = page.getByRole('button', { name: 'Marcar inscripción pagada' })
            await boton.waitFor({ state: 'visible', timeout: 10_000 })
            await boton.click()
            const aviso = page.locator('p').filter({ hasText: 'pagó su inscripción de' }).first()
            await aviso.waitFor({ state: 'visible', timeout: 5_000 })
            return (await aviso.textContent()) ?? ''
          },
          {
            message:
              'La ficha del alumno debía pintar la inscripción publicada ' +
              `(${INSCRIPCION_QA}) en el modal "Confirmar pago".`,
            timeout: 30_000,
            intervals: [1000],
          },
        )
        .toContain(`$${INSCRIPCION_QA}`)
    } finally {
      if (pagadaAntes) await s.from('alumnos').update({ inscripcion_pagada: true }).eq('id', ALUMNO_ID)
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // c7 — Control: cambiar la piel no rompe el acceso del alumno
  // ══════════════════════════════════════════════════════════════════════════
  test('c7 — el alumno sigue entrando por el formulario y ve su panel', async ({ browser }) => {
    const ctxAlumno = await browser.newContext({ baseURL: BASE_URL, viewport: VIEWPORT, storageState: SIN_SESION })
    const alumno = await ctxAlumno.newPage()
    try {
      // Mismo flujo que e2e/cursos-diplomados.spec.ts (`loginAlumno`).
      await alumno.goto('/login')
      await alumno.getByRole('textbox').first().fill(ALUMNO_EMAIL)
      await alumno.locator('input[type="password"]').fill(ALUMNO_PASSWORD)
      await alumno.getByRole('button', { name: /Iniciar sesión/i }).click()
      await alumno.waitForURL(/\/alumno(\/|$)/, { timeout: 45_000 })

      // El sidebar pinta el logo con el nombre de la escuela como texto alterno.
      await expect(alumno.getByRole('img', { name: DEFAULTS.nombre }).first()).toBeVisible()

      await alumno.screenshot({ path: SHOT('personalizar-07-alumno'), fullPage: true })
    } finally {
      await ctxAlumno.close()
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // d-ui — Restaurar el diseño original desde el editor
  // ══════════════════════════════════════════════════════════════════════════
  test('d-ui — "Restaurar diseño original" devuelve paleta, textos y landing a fábrica', async ({
    browser,
  }) => {
    // Se recarga para partir de lo PUBLICADO, no del estado en memoria de c5.
    await editor.goto('/admin/configuracion')
    await expect(editor.getByRole('heading', { name: 'Personalizar mi página' })).toBeVisible()

    await editor.getByRole('button', { name: 'Restaurar diseño original' }).click()

    const modal = editor.getByRole('dialog', { name: 'Restaurar diseño original' })
    await expect(modal).toBeVisible()
    await expect(modal.getByText(CONFIRMA_RESTAURAR, { exact: true })).toBeVisible()
    await modal.getByRole('button', { name: 'Sí, restaurar' }).click()

    await expect(editor.getByText('Tu página volvió al diseño original')).toBeVisible()

    // La paleta activa vuelve a ser la "Original" (que no escribe colores: los quita).
    await editor.getByRole('tab', { name: 'Colores' }).click()
    await expect(
      editor.getByRole('button', { name: 'Original (tus colores de fábrica)' }),
    ).toHaveAttribute('aria-pressed', 'true')

    // Y el título del hero vuelve al valor de fábrica del cliente.
    await editor.getByRole('tab', { name: 'Textos de mi página' }).click()
    await expect(editor.getByLabel('Título del hero', { exact: true })).toHaveValue(HERO_DEFAULT)

    // ── La página pública también, sin redeploy ──
    await esperarHtml(anonApi, '/', TEXTO_HERO_QA, false)
    await esperarHtml(anonApi, '/', HERO_DEFAULT, true)

    const ctxAnon = await browser.newContext({ baseURL: BASE_URL, viewport: VIEWPORT, storageState: SIN_SESION })
    const anon = await ctxAnon.newPage()
    try {
      await anon.goto('/')
      const estilo = await estiloDelBody(anon)
      const verde = paleta('verde-esmeralda').colores.acento.toUpperCase()
      expect(estilo).not.toContain(`--COLOR-ACENTO:${verde}`)
      expect(estilo).toContain(`--COLOR-ACENTO:${DEFAULTS.colores.acento.toUpperCase()}`)
      await anon.screenshot({ path: SHOT('personalizar-08-restaurado'), fullPage: true })
    } finally {
      await ctxAnon.close()
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // e — El SECRETARIO ve el editor en solo lectura
  // ══════════════════════════════════════════════════════════════════════════
  test('e — el SECRETARIO entra al editor pero no puede editar ni publicar', async ({ browser }) => {
    const { data: secre } = await svc()
      .from('usuarios')
      .select('id, rol')
      .eq('email', SECRETARIO_EMAIL)
      .maybeSingle()
    if (!secre) {
      throw new Error(
        `No existe ${SECRETARIO_EMAIL} en usuarios. Define QA_SECRETARIO_EMAIL en .env.local con un usuario de rol SECRETARIO.`,
      )
    }
    const rol = String((secre as { rol?: string }).rol ?? '').toUpperCase()
    if (rol !== 'SECRETARIO') {
      throw new Error(`${SECRETARIO_EMAIL} tiene rol ${rol || '(vacío)'}, se esperaba SECRETARIO.`)
    }

    const sesion = await mintSession(SECRETARIO_EMAIL)
    const ctxSecre = await browser.newContext({
      baseURL: BASE_URL,
      storageState: storageStateFromSession(sesion),
      viewport: VIEWPORT,
    })
    const secretario = await ctxSecre.newPage()
    try {
      await secretario.goto('/admin/configuracion')
      await expect(secretario.getByRole('heading', { name: 'Personalizar mi página' })).toBeVisible()

      // El aviso ámbar de arriba.
      await expect(secretario.getByText('Solo lectura:')).toBeVisible()

      // Los controles se pintan apagados (la seguridad la impone el servidor,
      // esto solo evita que escriba media página para nada).
      await secretario.getByRole('tab', { name: 'Textos de mi página' }).click()
      await expect(secretario.getByLabel('Título del hero', { exact: true })).toBeDisabled()

      // Y la barra de publicar ni se pinta.
      await expect(secretario.getByRole('button', { name: 'Publicar cambios' })).toHaveCount(0)
      await expect(secretario.getByRole('button', { name: 'Restaurar diseño original' })).toHaveCount(0)
    } finally {
      await ctxSecre.close()
    }
  })
})
