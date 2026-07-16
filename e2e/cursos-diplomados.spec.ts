import { test, expect, devices, type Page } from '@playwright/test'
import { join } from 'path'
import {
  ALUMNO_EMAIL, ALUMNO_PASSWORD, DIPLOMA_NOMBRE, SUPABASE_URL, ANON_KEY,
} from './_helpers'

const SHOT = (n: string) => join('e2e', 'screenshots', `${n}.png`)
const FIX = (f: string) => join(process.cwd(), 'e2e', '.fixtures', f)
const YOUTUBE = 'https://www.youtube.com/watch?v=M7lc1UVf-VE' // demo embebible de la API de YouTube
// iPhone 13 sin defaultBrowserType (no se puede forzar navegador dentro de un describe)
const { defaultBrowserType: _dbt, ...IPHONE13 } = devices['iPhone 13']

// Comparte el id/URL del diploma entre las partes (workers:1, orden de archivo)
let cursoUrl = ''
let cursoId = ''

async function loginAlumno(page: Page) {
  await page.goto('/login')
  await page.getByRole('textbox').first().fill(ALUMNO_EMAIL)
  await page.locator('input[type="password"]').fill(ALUMNO_PASSWORD)
  await page.getByRole('button', { name: /Iniciar sesión/i }).click()
  await page.waitForURL(/\/alumno(\/|$)/, { timeout: 45_000 })
}

// ══════════════════════ PARTE A — ADMIN ══════════════════════
test.describe('Parte A — Admin', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' })

  test('a1–a8 panel de administración', async ({ page }) => {
    // a1 — /admin/cursos con "Gestionar Cursos" en el sidebar
    await page.goto('/admin/cursos')
    await expect(page.getByRole('heading', { name: 'Cursos y Diplomados' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gestionar Cursos' })).toBeVisible()
    await page.screenshot({ path: SHOT('a1-admin-cursos-lista'), fullPage: true })

    // a2 — crear diplomado con portada
    await page.getByRole('button', { name: 'Nuevo curso' }).click()
    await page.waitForURL(/\/admin\/cursos\/nuevo/)
    await page.locator('#nombre').fill(DIPLOMA_NOMBRE)
    await page.locator('#descripcion').fill('Diplomado demostrativo del módulo Cursos y Diplomados de MEV.')
    await page.getByRole('button', { name: 'diplomado', exact: true }).click()
    await page.locator('input[type="file"]').setInputFiles(FIX('portada.png'))
    await expect(page.getByAltText('Vista previa de la portada')).toBeVisible()
    await page.screenshot({ path: SHOT('a2a-nuevo-form'), fullPage: true })
    await page.getByRole('button', { name: 'Crear curso' }).click()
    await page.waitForURL(/\/admin\/cursos\/[0-9a-f-]{36}$/, { timeout: 45_000 })
    cursoUrl = page.url()
    cursoId = cursoUrl.split('/').pop()!
    await expect(page.getByRole('heading', { name: DIPLOMA_NOMBRE })).toBeVisible()
    await page.screenshot({ path: SHOT('a2b-editor-creado'), fullPage: true })

    // a3 — módulo + lección con video YouTube (preview aparece)
    await page.getByPlaceholder('Nombre del nuevo módulo…').fill('Módulo 1: Bienvenida')
    await page.getByRole('button', { name: 'Agregar módulo' }).click()
    await expect(page.getByRole('heading', { name: 'Módulo 1: Bienvenida' })).toBeVisible()
    await page.getByRole('button', { name: 'Agregar lección' }).click()
    const modal = page.getByRole('dialog', { name: 'Nueva lección' })
    await modal.locator('#leccion-titulo').fill('Introducción')
    await modal.locator('#leccion-video').fill(YOUTUBE)
    await expect(modal.locator('iframe')).toBeVisible()
    await page.screenshot({ path: SHOT('a3-leccion-video-preview'), fullPage: true })
    await modal.getByRole('button', { name: 'Guardar lección' }).click()
    await expect(modal).toBeHidden()
    await expect(page.getByText('Introducción', { exact: true })).toBeVisible()

    // a4 — segunda lección + reordenar ↑↓ (se prueban ambos y se deja el orden
    // natural: Introducción(1) con video, Materiales(2) con PDF)
    await page.getByRole('button', { name: 'Agregar lección' }).click()
    const modal2 = page.getByRole('dialog', { name: 'Nueva lección' })
    await modal2.locator('#leccion-titulo').fill('Materiales del curso')
    await modal2.getByRole('button', { name: 'Guardar lección' }).click()
    await expect(modal2).toBeHidden()
    const tituloEnPos = (i: number) =>
      page.locator('[aria-label^="Editar lección"]').nth(i).getAttribute('aria-label')
    // Orden inicial: Introducción(1), Materiales(2). Subir Materiales → queda 1º.
    await page.getByRole('button', { name: 'Subir lección Materiales del curso' }).click()
    await expect.poll(() => tituloEnPos(0)).toContain('Materiales del curso')
    await page.screenshot({ path: SHOT('a4-reordenado'), fullPage: true })
    // Bajar Materiales → restaura el orden natural (Introducción 1º).
    await page.getByRole('button', { name: 'Bajar lección Materiales del curso' }).click()
    await expect.poll(() => tituloEnPos(0)).toContain('Introducción')

    // a5 — subir PDF ~6MB (valida el fix del límite 4.5MB de Vercel)
    await page.locator('[aria-label^="Editar lección Materiales del curso"]').click()
    const modalMat = page.getByRole('dialog', { name: 'Editar lección' })
    await modalMat.locator('input[type="file"][accept="application/pdf"]').setInputFiles(FIX('material.pdf'))
    await expect(modalMat.getByText('material.pdf')).toBeVisible()
    await modalMat.getByRole('button', { name: 'Guardar lección' }).click()
    await expect(modalMat).toBeHidden({ timeout: 60_000 })
    // el chip de PDF (icono FileText) aparece en la lección
    await expect(page.locator('[aria-label="Tiene PDF"]')).toBeVisible()
    await page.screenshot({ path: SHOT('a5-pdf-subido'), fullPage: true })

    // a6 — asignar alumno + mensaje amable de duplicado
    await page.getByRole('tab', { name: /Alumnos/ }).click()
    await page.getByLabel('Buscar alumnos por nombre o email').fill('prueba')
    await expect(page.getByText(ALUMNO_EMAIL)).toBeVisible()
    await page.getByRole('button', { name: 'Asignar', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Alumnos asignados \(1\)/ })).toBeVisible()
    // Duplicado: la UI ya no lo muestra en búsqueda (previene el dup); verificamos
    // el mensaje amable 409 del API directamente.
    const dup = await page.request.post(`/api/admin/cursos/${cursoId}/inscripciones`, {
      data: { alumno_id: await alumnoId(page) },
    })
    expect(dup.status()).toBe(409)
    expect((await dup.json()).error).toMatch(/ya está asignado/i)
    await page.screenshot({ path: SHOT('a6-alumno-asignado'), fullPage: true })

    // a7 — "Asignar a todos" → cancelar en la doble confirmación
    await page.getByRole('button', { name: /Asignar a todos los alumnos activos/ }).click()
    await expect(page.getByRole('dialog', { name: /Asignar a todos/ })).toBeVisible()
    await page.getByRole('button', { name: 'Sí, continuar' }).click()
    await expect(page.getByRole('dialog', { name: /Segunda confirmación/ })).toBeVisible()
    await page.screenshot({ path: SHOT('a7-doble-confirmacion'), fullPage: true })
    await page.getByRole('dialog', { name: /Segunda confirmación/ }).getByRole('button', { name: 'Cancelar' }).click()
    // sigue siendo 1 asignado (no cambió)
    await expect(page.getByRole('heading', { name: /Alumnos asignados \(1\)/ })).toBeVisible()

    // a8 — publicar + "Ver como alumno" (vista previa admin)
    await page.getByRole('tab', { name: 'Publicación' }).click()
    await page.getByRole('switch').click()
    await expect(page.getByText('Publicado', { exact: true }).first()).toBeVisible()
    await page.screenshot({ path: SHOT('a8a-publicado'), fullPage: true })
    await page.getByRole('link', { name: 'Ver como alumno' }).click()
    await page.waitForURL(/\/cursos\/[0-9a-f-]{36}/)
    await expect(page.getByText('Vista previa de administrador')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Marcar como completada' })).toHaveCount(0)
    await page.screenshot({ path: SHOT('a8b-vista-previa-admin'), fullPage: true })
  })
})

// Helper: id del alumno prueba (para el POST de duplicado)
async function alumnoId(page: Page): Promise<string> {
  const r = await page.request.get(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(ALUMNO_EMAIL)}&select=id`, {
    headers: { apikey: ANON_KEY },
  })
  // anon no puede leer usuarios ajenos; usamos el catálogo del alumno vía RLS no aplica aquí.
  // Fallback: leer del propio detalle. Como admin, el endpoint de inscripciones valida por alumno_id;
  // obtenemos el id desde la lista de asignados en el DOM.
  if (r.ok()) { const j = await r.json(); if (Array.isArray(j) && j[0]?.id) return j[0].id }
  return await page.evaluate(async (email) => {
    const res = await fetch('/api/admin/alumnos'); const arr = await res.json()
    return (arr.find((a: { email: string; id: string }) => a.email === email) || {}).id
  }, ALUMNO_EMAIL)
}

// ══════════════════════ PARTE B — ALUMNO (login real) ══════════════════════
test.describe('Parte B — Alumno', () => {
  test('b0–b8 visor del alumno', async ({ page }) => {
    // b0 — login REAL por formulario
    await loginAlumno(page)
    await page.screenshot({ path: SHOT('b0-login-ok'), fullPage: true })

    // b1 — ítem "Cursos y Diplomados" en el nav
    await expect(page.getByRole('link', { name: 'Cursos y Diplomados' })).toBeVisible()
    await page.screenshot({ path: SHOT('b1-nav-cursos'), fullPage: true })

    // b2 — catálogo con el diploma, portada y progreso 0%
    await page.goto('/alumno/cursos')
    const card = page.getByRole('button', { name: new RegExp(DIPLOMA_NOMBRE) })
    await expect(card).toBeVisible()
    await expect(card.getByRole('img')).toBeVisible()
    await expect(card.getByText('0%')).toBeVisible()
    await page.screenshot({ path: SHOT('b2-catalogo-0pct'), fullPage: true })

    // b3 — abrir curso → primera lección pendiente + iframe del video cargado
    const embedResp = page.waitForResponse(
      r => r.url().includes('youtube-nocookie.com/embed') && r.status() < 400,
      { timeout: 30_000 },
    ).catch(() => null)
    await card.click()
    await page.waitForURL(/\/cursos\/[0-9a-f-]{36}/)
    await expect(page.getByRole('heading', { name: 'Introducción' })).toBeVisible()
    const iframe = page.locator('iframe')
    await expect(iframe).toBeVisible()
    expect(await iframe.getAttribute('src')).toContain('youtube-nocookie.com/embed')
    const resp = await embedResp
    expect(resp, 'el embed de YouTube debe responder').not.toBeNull()
    await page.screenshot({ path: SHOT('b3-visor-video'), fullPage: true })

    // b4 — marcar completada → checkmark + progreso avanza (y NO 100%)
    await page.getByRole('button', { name: 'Marcar como completada' }).click()
    await expect(page.getByRole('button', { name: /Completada/ })).toBeVisible()
    await expect(page.getByText('50%').first()).toBeVisible()
    await expect(page.getByText('100%')).toHaveCount(0)
    await page.screenshot({ path: SHOT('b4-completada-50pct'), fullPage: true })

    // b5 — descargar material (signed URL responde 200 PDF). Ir a "Materiales del curso".
    await page.getByRole('button', { name: /Materiales del curso/ }).click()
    const link = page.getByRole('link', { name: /Descargar material/ })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    expect(href).toContain('/storage/v1/object/sign/')
    const dl = await page.request.get(href!)
    expect(dl.status()).toBe(200)
    expect(dl.headers()['content-type']).toContain('pdf')
    await page.screenshot({ path: SHOT('b5-material-descarga'), fullPage: true })

    // b6 — navegación Anterior/Siguiente
    await page.getByRole('button', { name: 'Anterior' }).click()
    await expect(page.getByRole('heading', { name: 'Introducción' })).toBeVisible()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByRole('heading', { name: 'Materiales del curso' })).toBeVisible()
    await page.screenshot({ path: SHOT('b6-navegacion'), fullPage: true })

    // b7 — ir a /admin/cursos como alumno → redirigido fuera (nunca renderiza el panel)
    await page.goto('/admin/cursos')
    await expect(page).toHaveURL(/\/alumno(\/|$)/)
    await expect(page.getByRole('link', { name: 'Gestionar Cursos' })).toHaveCount(0)
    await page.screenshot({ path: SHOT('b7-guard-admin'), fullPage: true })

    // b8 — control: página académica /alumno/materias renderiza igual
    await page.goto('/alumno/materias')
    await expect(page.getByRole('heading', { name: 'Mis Materias' })).toBeVisible()
    await page.screenshot({ path: SHOT('b8-materias-control'), fullPage: true })
  })
})

// ══════════════════════ PARTE C — MÓVIL (iPhone 13) ══════════════════════
test.describe('Parte C — Móvil', () => {
  test.use(IPHONE13)

  test('c1–c2 responsive móvil', async ({ page }) => {
    await loginAlumno(page)

    // c1 — catálogo apilado 1 columna, sin overflow horizontal
    await page.goto('/alumno/cursos')
    const card = page.getByRole('button', { name: new RegExp(DIPLOMA_NOMBRE) })
    await expect(card).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'no debe haber scroll horizontal').toBeLessThanOrEqual(1)
    await page.screenshot({ path: SHOT('c1-movil-catalogo'), fullPage: true })

    // c2 — visor móvil: drawer de índice, video full-width, botón completar full-width
    await card.click()
    await page.waitForURL(/\/cursos\/[0-9a-f-]{36}/)
    const vw = page.viewportSize()!.width
    // drawer de índice → navegar a "Introducción" (la lección con video)
    await page.getByRole('button', { name: 'Índice' }).click()
    await expect(page.getByText('Contenido del curso')).toBeVisible()
    await page.screenshot({ path: SHOT('c2b-movil-drawer'), fullPage: true })
    await page.getByRole('button', { name: 'Introducción' }).click()
    await expect(page.getByRole('heading', { name: 'Introducción' })).toBeVisible()
    const iframe = page.locator('iframe')
    await expect(iframe).toBeVisible()
    const box = await iframe.boundingBox()
    expect(box!.width, 'video ~full width').toBeGreaterThan(vw * 0.85)
    await page.screenshot({ path: SHOT('c2a-movil-visor'), fullPage: true })
    // botón de completar full-width (label "Marcar como completada" o "Completada")
    const btn = page.getByRole('button', { name: /completada/i }).first()
    await expect(btn).toBeVisible()
    const bb = await btn.boundingBox()
    expect(bb!.width, 'botón completar ~full width').toBeGreaterThan(vw * 0.85)
    await page.screenshot({ path: SHOT('c2c-movil-boton'), fullPage: true })
  })
})
