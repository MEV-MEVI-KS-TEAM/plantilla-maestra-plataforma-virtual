import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inscripcionVigente } from '@/lib/cursos/acceso'
import { AVISO_NO_REEMBOLSABLE, cuandoVeraTodo } from '@/lib/cursos/textos-alumnos'

/**
 * «Cobrar y abrir todo» (CobrarCursoModal): la 2ª confirmación decía «Acceso
 * completo inmediato» aunque el curso estuviera en borrador o la inscripción
 * vencida. Mismo criterio que «Abrir todo» (D21b · OS1): el aviso con
 * «inmediato» y «desde ya» solo si hoy lo vería; si no, «No reembolsable una vez
 * activado» y cuándo lo verá.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const MODAL = sinComentarios(leer('src/components/admin/alumnos/CobrarCursoModal.tsx'))

test('1. inscripcionVigente: activa o completada y sin vencer (la parte de la inscripción del candado)', () => {
  const hoy = '2026-09-27'
  expect(inscripcionVigente({ estado: 'activa', fecha_vencimiento: null }, hoy)).toBe(true)
  expect(inscripcionVigente({ estado: 'completada', fecha_vencimiento: null }, hoy)).toBe(true)
  expect(inscripcionVigente({ estado: 'activa', fecha_vencimiento: hoy }, hoy)).toBe(true)          // vence hoy: todavía ve
  expect(inscripcionVigente({ estado: 'activa', fecha_vencimiento: '2026-09-26' }, hoy)).toBe(false) // ya venció
  for (const e of ['suspendida', 'cancelada', '', null]) {
    expect(inscripcionVigente({ estado: e, fecha_vencimiento: null }, hoy), String(e)).toBe(false)
  }
})

test('2. la ruta de los cursos del alumno manda si hoy lo vería', () => {
  const r = sinComentarios(leer('src/app/api/admin/alumnos/[id]/cursos/route.ts'))
  expect(r).toContain("curso_publicado: c?.estado === 'publicado',")
  expect(r).toContain('vigente_hoy: inscripcionVigente({ estado: estado.estado, fecha_vencimiento: i.fecha_vencimiento ?? null }),')
  // Las dos columnas se leen con select('*'): estado del curso y vencimiento de la inscripción.
  expect(r).toContain("admin.from('cursos').select('*')")
  expect(r).toMatch(/\.from\('curso_inscripciones'\)\s*\.select\('\*'\)/)
  const tipo = leer('src/lib/cursos/cobro.ts')
  expect(tipo).toMatch(/curso_publicado: boolean\s*vigente_hoy: boolean/)
})

test('3. el modal: «inmediato» solo con «desde ya»; si no, el aviso sin «inmediato» y cuándo lo verá', () => {
  expect(MODAL).toContain('const cuando = cuandoVeraTodo(fila.curso_publicado, fila.vigente_hoy, esAdmin)')
  // La 2ª confirmación: una sola vez cada aviso, en las dos ramas del mismo ternario.
  expect(MODAL).toContain("{cuando === 'desde ya' ? <>{AVISO_PAGO_UNICO}</> : <>{AVISO_NO_REEMBOLSABLE}. Lo verá {cuando}.</>}")
  expect(MODAL.match(/\{AVISO_PAGO_UNICO\}/g)?.length).toBe(1)
  // El paso 1 tampoco promete acceso inmediato si hoy no lo vería.
  expect(MODAL).toContain("completo{cuando === 'desde ya' ? '' : ` (lo verá ${cuando})`}.")
  expect(AVISO_NO_REEMBOLSABLE).not.toMatch(/inmediato/i)
  // Los textos que resultan, según quién cobra.
  expect(cuandoVeraTodo(true, true, false)).toBe('desde ya')
  expect(cuandoVeraTodo(false, true, true)).toBe('cuando lo publiques')
  expect(cuandoVeraTodo(false, true, false)).toBe('cuando el administrador lo publique')
  expect(cuandoVeraTodo(true, false, true)).toBe('cuando su inscripción esté activa y vigente')
  // En borrador Y sin vigencia, publicar no basta: se dicen las dos cosas.
  expect(cuandoVeraTodo(false, false, true)).toBe('cuando lo publiques y su inscripción esté activa y vigente')
  expect(cuandoVeraTodo(false, false, false)).toBe('cuando el administrador lo publique y su inscripción esté activa y vigente')
  // El aviso de éxito dice lo mismo que las confirmaciones.
  expect(MODAL).toContain("+ (json.abrio && cuando !== 'desde ya' ? ` (lo verá ${cuando})` : '')")
})

test('5. AlumnosTab le pasa a cuandoVeraTodo la vigencia de la INSCRIPCIÓN, no «lo ve hoy»', () => {
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  // accesoVigente(i, publicado) ya es false en borrador: con él, un curso en borrador y una
  // inscripción vigente dirían «… y su inscripción esté activa y vigente», que es falso.
  expect(tab).not.toMatch(/cuandoVeraTodo\([^)]*accesoVigente\(/)
  expect(tab.match(/cuandoVeraTodo\(/g)?.length).toBe(4)
  expect(tab.match(/inscripcionVigente\(/g)?.length).toBe(4)
  // Los textos «en borrador» de la fila y del paso 1 usan la misma regla.
  expect(tab).toContain('lo verá ${cuandoVeraTodo(false, inscripcionVigente(i), esAdmin)}')
  expect(tab).toContain(' (lo verá ${cuandoVeraTodo(false, i ? inscripcionVigente(i) : true, esAdmin)})')
  expect(tab).toContain('<strong>borrador</strong>: lo verá {cuandoActivar}. </>')
  expect(tab).toContain('<strong>borrador</strong>: lo verá {cuandoAbrirTodo}. </>')
})

test('4. los dos lugares que abren el modal le dicen quién cobra', () => {
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  const tab = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
  for (const [nombre, f] of [['ficha', ficha], ['AlumnosTab', tab]] as const) {
    const i = f.indexOf('<CobrarCursoModal')
    expect(i, nombre).toBeGreaterThan(0)
    expect(f.slice(i, i + 400), nombre).toContain('esAdmin={esAdmin}')
  }
  // En la ficha, esAdmin es la condición POSITIVA de D21a (si viewer_rol faltara, no es admin).
  expect(ficha).toContain("const esAdmin = alumno.viewer_rol === 'ADMIN'")
})
