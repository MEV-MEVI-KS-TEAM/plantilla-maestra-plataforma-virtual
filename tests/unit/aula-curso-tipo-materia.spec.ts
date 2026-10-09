import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Aula del curso con la navegación de una materia (TICKET-2026-10-09-02,
 * EDUVA): los cursos (p. ej. EXANI-I / EXANI-II) se estudian dentro del portal
 * del alumno, con pestañas Contenido · Examen · Información, roadmap y la
 * lección en tarjeta — igual que Secundaria / Preparatoria.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('1. el aula vive dentro del portal del alumno, junto a la materia', () => {
  const ruta = 'src/app/(dashboard)/alumno/curso/[id]/page.tsx'
  expect(existsSync(join(process.cwd(), ruta))).toBe(true)
  expect(sinComentarios(leer(ruta))).toContain('<AulaCurso cursoId={id} />')
  // El catálogo del alumno abre el aula nueva, no el visor suelto.
  const catalogo = sinComentarios(leer('src/app/(dashboard)/alumno/cursos/page.tsx'))
  expect(catalogo).toContain('router.push(`/alumno/curso/${curso.id}`)')
  expect(catalogo).not.toContain('router.push(`/cursos/${curso.id}`)')
})

test('2. /cursos/[id] queda para la vista previa del admin y reenvía al alumno', () => {
  const page = sinComentarios(leer('src/app/(cursos)/cursos/[id]/page.tsx'))
  expect(page).toContain("if (!rol || rol === 'ALUMNO') redirect(`/alumno/curso/${params.id}`)")
  expect(page).toContain('<AulaCurso cursoId={params.id} vistaAdmin />')
})

test('3. misma estructura que la materia: pestañas, roadmap, Markdown compartido', () => {
  const aula = sinComentarios(leer('src/components/cursos/AulaCurso.tsx'))
  expect(aula).toContain("{ key: 'contenido', label: 'Contenido' }")
  expect(aula).toContain("{ key: 'examen', label: 'Examen' }")
  expect(aula).toContain("{ key: 'informacion', label: 'Información' }")
  // El mismo roadmap de la materia, en modo libre (las lecciones no se encadenan).
  expect(aula).toMatch(/<WeekRoadmap[\s\S]*?etiqueta="Lección"[\s\S]*?libre[\s\S]*?\/>/)
  // El mismo render de apuntes que las semanas (y que el preview del editor).
  expect(aula).toContain('<ContenidoMarkdown texto={texto} />')
  expect(aula).toContain("'✅ Marcar lección como completada'")
  // La vista previa del admin no registra progreso.
  expect(aula).toContain('{!modoPreview && (')
})

test('4. WeekRoadmap: el modo libre no cambia la cadena de la materia', () => {
  const rm = sinComentarios(leer('src/components/alumno/WeekRoadmap.tsx'))
  expect(rm).toContain('libre = false,')
  // Sin `libre`, sigue mandando getEstado (completar la semana anterior desbloquea).
  expect(rm).toContain(': getEstado(semana.id, index, semanas, semanasCompletadas)')
  expect(rm).toContain("Completa la semana anterior para desbloquear esta")
  const materia = sinComentarios(leer('src/app/(dashboard)/alumno/materia/[id]/page.tsx'))
  expect(materia).not.toMatch(/<WeekRoadmap[^>]*\blibre\b/)
})

test('5. la pestaña activa se lee en el portal claro (materia y curso)', () => {
  for (const f of ['src/app/(dashboard)/alumno/materia/[id]/page.tsx', 'src/components/cursos/AulaCurso.tsx']) {
    const s = sinComentarios(leer(f))
    expect(s).not.toMatch(/color: tab === \w+\.key \? '#F1F5F9'/)
  }
})
