/**
 * QA de «Actividades interactivas + PDF» (materia del alumno).
 *
 * Dos casos, el mismo recorrido:
 *   1. escritorio (1366×900, el viewport del proyecto)
 *   2. celular 375×812 (táctil): además, sin scroll horizontal y botones
 *      de al menos 44 px de alto (cómodos con el pulgar)
 *
 * Recorrido: login REAL del alumno → primera materia DISPONIBLE cuya API traiga
 * una semana con `actividades` → abre esa semana → responde bien una actividad
 * de opción múltiple o de verdadero/falso → «Revisar» → ve «Correcto» y el
 * puntaje completo → el botón «Descargar PDF» abre en pestaña nueva
 * (target=_blank, rel con noopener) y su URL responde 200 application/pdf.
 *
 * NO ESCRIBE EN LA BASE: solo lee (las respuestas viven en el localStorage del
 * navegador). Pero corre con el resto de la suite y su globalSetup, que SÍ
 * escribe (fija la contraseña del alumno de QA, borra diplomas de QA): córrela
 * SOLO contra una base de QA desechable. Ver e2e/README-QA.md.
 *
 * Requisitos: QA_ALUMNO_EMAIL / QA_ALUMNO_PASSWORD (como el resto de la suite)
 * y, en esa base, la migración 20261021120000_actividades_pdf.sql + el seed
 * scripts/seed-actividades-sec-prepa.sql (o un banco de cursos/licenciaturas
 * con actividades). Opcional: QA_ACTIVIDADES_MATERIA_ID para fijar la materia.
 * Sin las variables QA_* la spec se SALTA (y globalSetup no aborta si es lo
 * único que se corre: `npx playwright test e2e/actividades.spec.ts`).
 *
 *   pnpm build && npx playwright test e2e/actividades.spec.ts
 */
import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { join } from 'path'
import { ALUMNO_EMAIL, ALUMNO_PASSWORD } from './_helpers'

const SHOT = (n: string) => join('e2e', 'screenshots', `${n}.png`)
const MATERIA_FIJA = process.env.QA_ACTIVIDADES_MATERIA_ID || ''
const QA_LISTO = Boolean(ALUMNO_EMAIL && ALUMNO_PASSWORD)

// ── Lo mínimo de la API que se usa aquí ──────────────────────────────────────
interface ReactivoOM { id: string; correcta: number }
type ActividadQA =
  | { id: string; tipo: 'opcion_multiple'; items: ReactivoOM[] }
  | { id: string; tipo: 'verdadero_falso'; items: { id: string; respuesta: boolean }[] }
  | { id: string; tipo: string }
interface SemanaQA {
  id: string
  numero: number
  actividades: { unidad: { id: string }; actividades: ActividadQA[] } | null
  actividades_pdf_url: string | null
}
interface MateriaQA { id: string; nivel: string; semanas: SemanaQA[]; cuaderno_pdf_url?: string | null }

async function loginAlumno(page: Page) {
  await page.goto('/login')
  await page.getByRole('textbox').first().fill(ALUMNO_EMAIL)
  await page.locator('input[type="password"]').fill(ALUMNO_PASSWORD)
  await page.getByRole('button', { name: /Iniciar sesión/i }).click()
  await page.waitForURL(/\/alumno(\/|$)/, { timeout: 45_000 })
}

/** Primera materia disponible (con la sesión del alumno) que trae al menos una semana con actividades. */
async function materiaConActividades(api: APIRequestContext): Promise<MateriaQA> {
  let ids: string[]
  if (MATERIA_FIJA) {
    ids = [MATERIA_FIJA]
  } else {
    const r = await api.get('/api/alumno/materias')
    expect(r.ok(), `GET /api/alumno/materias → ${r.status()}`).toBe(true)
    const { materias } = (await r.json()) as { materias: { id: string; disponible: boolean }[] }
    ids = materias.filter(m => m.disponible).map(m => m.id)
  }
  for (const id of ids) {
    const r = await api.get(`/api/alumno/materia/${id}`)
    if (!r.ok()) continue
    const m = (await r.json()) as MateriaQA
    if (m.semanas?.some(s => s.actividades)) return m
  }
  throw new Error(
    'Ninguna materia disponible del alumno de QA trae semanas con actividades. ¿Se aplicó la migración ' +
    '20261021120000_actividades_pdf.sql y el seed scripts/seed-actividades-sec-prepa.sql en la base de QA? ' +
    '(o define QA_ACTIVIDADES_MATERIA_ID)',
  )
}

/** Abre una semana con actividades: la que la página eligió sola o, si no, la primera que se pueda abrir. */
async function abrirSemanaConActividades(page: Page, materia: MateriaQA): Promise<SemanaQA> {
  const panel = page.locator('[data-actividades="interactivas"]')
  const conActividades = materia.semanas.filter(s => s.actividades)
  const etiqueta = materia.nivel === 'demo' ? 'Paso' : 'Semana'
  // La página elige sola la primera semana pendiente; si ya trae actividades, basta.
  await page.getByRole('button', { name: new RegExp(`^${etiqueta} \\d+:`) }).first().waitFor()
  await panel.first().waitFor({ timeout: 5_000 }).catch(() => {})
  const unidadVisible = (await panel.count())
    ? await panel.locator('[data-unidad]').first().getAttribute('data-unidad')
    : null
  const yaAbierta = conActividades.find(s => s.actividades!.unidad.id === unidadVisible)
  if (yaAbierta) return yaAbierta
  for (const s of conActividades) {
    const boton = page.getByRole('button', { name: new RegExp(`^${etiqueta} ${s.numero}:`) }).first()
    if (!(await boton.isEnabled().catch(() => false))) continue
    await boton.click()
    await expect(panel.locator(`[data-unidad="${s.actividades!.unidad.id}"]`)).toBeVisible()
    return s
  }
  throw new Error('Hay semanas con actividades, pero ninguna se puede abrir todavía (roadmap bloqueado).')
}

async function recorrido(page: Page, request: APIRequestContext, sufijo: string) {
  test.setTimeout(180_000)
  await loginAlumno(page)
  const materia = await materiaConActividades(page.request)
  await page.goto(`/alumno/materia/${materia.id}`)

  // Cuaderno completo en la cabecera: solo si la materia lo trae.
  const cuaderno = page.locator('[data-descarga="cuaderno"]')
  if (materia.cuaderno_pdf_url) {
    await expect(cuaderno).toBeVisible()
    await expect(cuaderno).toHaveAttribute('href', materia.cuaderno_pdf_url)
  } else {
    await expect(cuaderno).toHaveCount(0)
  }

  const semana = await abrirSemanaConActividades(page, materia)
  const panel = page.locator('[data-actividades="interactivas"]')
  await expect(panel.getByRole('heading', { level: 2 })).toBeVisible()
  await page.screenshot({ path: SHOT(`act-${sufijo}-1-semana`), fullPage: false })

  // ── Responder BIEN una actividad autocorregible ──
  const act = semana.actividades!.actividades.find(
    a => a.tipo === 'opcion_multiple' || a.tipo === 'verdadero_falso',
  ) as Extract<ActividadQA, { tipo: 'opcion_multiple' | 'verdadero_falso' }> | undefined
  expect(act, 'la semana no tiene una actividad de opción múltiple ni de verdadero/falso').toBeTruthy()
  const seccion = panel.locator(`section[data-actividad="${act!.id}"]`)
  await seccion.scrollIntoViewIfNeeded()
  for (const it of act!.items) {
    const valor = 'correcta' in it ? String(it.correcta) : it.respuesta ? 'v' : 'f'
    await seccion.locator(`[data-campo="${act!.id}/${it.id}"] input[type="radio"][value="${valor}"]`).check({ force: true })
  }
  const revisar = seccion.locator('button[data-accion="revisar"]')
  if (sufijo === 'celular') {
    const caja = await revisar.boundingBox()
    expect(caja?.height ?? 0, '«Revisar» cómodo con el pulgar').toBeGreaterThanOrEqual(44)
  }
  await revisar.click()

  const total = act!.items.length
  await expect(seccion.locator(`[data-puntaje="${total}/${total}"]`)).toBeVisible()
  await expect(seccion.getByText('¡Todo correcto!')).toBeVisible()
  await expect(seccion.getByText(/^Correct[oa]$/).first()).toBeVisible()
  await expect(seccion.locator('[data-resultado="incorrecto"]')).toHaveCount(0)
  await page.screenshot({ path: SHOT(`act-${sufijo}-2-correcta`), fullPage: false })

  // ── «Descargar PDF» de la semana ──
  const pdf = panel.getByRole('link', { name: /Descargar PDF/ })
  if (!semana.actividades_pdf_url) {
    await expect(pdf).toHaveCount(0)
  } else {
    await expect(pdf).toBeVisible()
    await expect(pdf).toHaveAttribute('target', '_blank')
    expect(await pdf.getAttribute('rel')).toContain('noopener')
    const href = await pdf.getAttribute('href')
    expect(href).toBe(semana.actividades_pdf_url)
    const r = await request.get(href!)
    expect(r.status(), `GET ${href}`).toBe(200)
    expect(r.headers()['content-type'] ?? '').toContain('application/pdf')
  }

  if (sufijo === 'celular') {
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(ancho, 'sin scroll horizontal a 375 px').toBeLessThanOrEqual(375)
  }
}

test.describe('Actividades interactivas + PDF', () => {
  test.skip(!QA_LISTO, 'Faltan QA_ALUMNO_EMAIL / QA_ALUMNO_PASSWORD (base de QA). Ver e2e/README-QA.md.')

  test('escritorio: abrir semana, responder, «Correcto» y PDF 200', async ({ page, request }) => {
    await recorrido(page, request, 'escritorio')
  })

  test.describe('celular 375×812', () => {
    test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })

    test('celular: abrir semana, responder, «Correcto» y PDF 200', async ({ page, request }) => {
      await recorrido(page, request, 'celular')
    })
  })
})
