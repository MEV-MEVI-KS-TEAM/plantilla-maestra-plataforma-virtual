import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPlanNombre } from '@/lib/licenciatura-utils'
import { etiquetaNivel } from '@/lib/niveles-ui'
import { etiquetaDuracionModalidad } from '@/lib/modalidades'
import { ES_PLANTILLA } from './es-plantilla'

/**
 * Bloque D · D3 — nada crudo en el panel (#218 y #200).
 *  - #218: /admin/alumnos pintaba «Plan: diplomado» (el id de la base) y «Meses 0»
 *    a un alumno de curso; cada pantalla le ponía su propio «Diplomado».
 *  - #200: el estado de cuenta y el Excel solo conocían 3_meses/6_meses y
 *    pintaban 12_meses, 18_meses o 6_meses_lic crudos.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('#218 · getPlanNombre da el nombre del nivel de la escuela al alumno de curso', () => {
  expect(getPlanNombre('diplomado')).toBe(etiquetaNivel('diplomado'))
  expect(getPlanNombre('diplomado')).not.toBe('diplomado')
  // El nombre de FÁBRICA solo se comprueba en la plantilla: un clon puede renombrar el nivel.
  if (ES_PLANTILLA) expect(getPlanNombre('diplomado')).toBe('Curso o diplomado')
  // Los demás, igual que siempre.
  expect(getPlanNombre('secundaria')).toBe('Secundaria')
  expect(getPlanNombre('preparatoria')).toBe('Preparatoria')
  expect(getPlanNombre('demo')).toBe('Demo')
  expect(getPlanNombre(null)).toBe('—')
})

test('#218 · sin ciclo de imports y sin «Diplomado» propio en la ficha ni en el perfil', () => {
  const lu = leer('src/lib/licenciatura-utils.ts')
  expect(lu).toContain("import { etiquetaNivel } from '@/lib/niveles-ui'")
  expect(lu).not.toMatch(/from '@\/lib\/niveles'/)
  expect(leer('src/lib/niveles-ui.ts')).not.toMatch(/from '@\/lib\/licenciatura-utils'/)
  for (const f of ['src/app/api/admin/alumnos/[id]/route.ts', 'src/app/api/alumno/perfil/route.ts']) {
    expect(sinComentarios(leer(f)), f).not.toContain("'Diplomado'")
  }
})

test('#218 · «Meses» dice «—» a quien no tiene plan escolar (lista y tablero)', () => {
  const lista = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(lista).toMatch(/\{!a\.nivel \|\| a\.nivel === 'diplomado' \? \(\s*<span[^>]*>—<\/span>/)
  const tablero = sinComentarios(leer('src/app/(dashboard)/admin/page.tsx'))
  expect(tablero).toMatch(/\{!a\.nivel \|\| a\.nivel === 'diplomado' \? \(\s*<span[^>]*>—<\/span>/)
  // La insignia del tablero con el nombre de la escuela, no su propio «Diplomado»,
  // y con 'diplomado' DENTRO de la lista (la guarda de B7 ya no puede apoyarse en
  // que la palabra aparezca en cualquier parte del archivo).
  expect(tablero).toContain("['secundaria', 'preparatoria', 'licenciatura', 'diplomado'].includes(nivel ?? '')")
  expect(tablero).toContain('etiquetaNivel(nivel)')
  expect(tablero).not.toContain("'Diplomado'")
})

test('#218 · la tarjeta móvil de /admin/alumnos no anuncia «meses abiertos» sin plan escolar', () => {
  const lista = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(lista).toMatch(/\{!\(!a\.nivel \|\| a\.nivel === 'diplomado'\) && \(\s*<>\s*<span>·<\/span>\s*<span>\s*\{a\.duracion_meses > 0/)
})

test('#218 · el sidebar le da al alumno de curso el mismo nombre que la ficha y el perfil', () => {
  const sb = sinComentarios(leer('src/components/layout/sidebar.tsx'))
  expect(sb).toContain("nivel === 'diplomado'   ? etiquetaNivel('diplomado')")
  expect(sb).not.toContain("'Diplomado'")
})

test('#200 · la duración sale del id, nunca el id crudo', () => {
  expect(etiquetaDuracionModalidad('12_meses')).toBe('12 meses')
  expect(etiquetaDuracionModalidad('18_meses')).toBe('18 meses')
  expect(etiquetaDuracionModalidad('6_meses_lic')).toBe('6 meses')
  expect(etiquetaDuracionModalidad('36_meses')).toBe('36 meses')
  expect(etiquetaDuracionModalidad('1_meses')).toBe('1 mes')
  // 3 y 6 meses: lo mismo que decían los mapas de antes.
  expect(etiquetaDuracionModalidad('3_meses')).toBe('3 meses')
  expect(etiquetaDuracionModalidad('6_meses')).toBe('6 meses')
  expect(etiquetaDuracionModalidad(null)).toBe('')
  expect(etiquetaDuracionModalidad('')).toBe('')
  // Id sin forma N_meses y que no está en ninguna tabla: «—», no el id.
  expect(etiquetaDuracionModalidad('id_que_no_existe_en_ninguna_tabla')).toBe('—')
})

test('#200 · paridad con la columna generada alumnos.duracion_meses para todos los ids del CHECK', () => {
  const sql = leer('supabase/migrations/20260812120000_licenciaturas.sql')
  const cuerpo = sql.slice(sql.indexOf('duracion_meses INTEGER GENERATED ALWAYS AS'))
  const casos = [...cuerpo.matchAll(/WHEN '(\w+)'\s+THEN (\d+)/g)].map(m => [m[1], Number(m[2])] as const)
  expect(casos.length).toBeGreaterThanOrEqual(7)
  const elseVal = Number(/ELSE (\d+)/.exec(cuerpo)?.[1])
  for (const [id, meses] of casos) {
    expect(etiquetaDuracionModalidad(id), id).toBe(`${meses} ${meses === 1 ? 'mes' : 'meses'}`)
  }
  // '6_meses_lic' (migración 20260925) cae en el ELSE de la columna.
  expect(etiquetaDuracionModalidad('6_meses_lic')).toBe(`${elseVal} meses`)
})

test('#200 · Excel, estado de cuenta y /admin/pagos usan las fuentes únicas', () => {
  const excel = sinComentarios(leer('src/app/api/admin/reportes/excel/route.ts'))
  expect(excel).not.toContain('MODALIDAD_LABELS')
  expect(excel).not.toContain('NIVEL_LABELS')
  expect(excel).toContain("'Modalidad':            etiquetaDuracionModalidad(a.modalidad)")
  expect(excel.match(/etiquetaNivel\(/g)?.length).toBe(2)
  const ec = sinComentarios(leer('src/app/(dashboard)/admin/estado-cuenta/page.tsx'))
  expect(ec).not.toContain('MODALIDAD_LABELS')
  expect(ec).not.toContain('NIVEL_LABELS')
  expect(ec).toContain('etiquetaDuracionModalidad(a.modalidad)')
  expect(ec).toContain('etiquetaNivel(a.nivel)')
  const pagos = sinComentarios(leer('src/app/(dashboard)/admin/pagos/page.tsx'))
  expect(pagos).not.toContain('NIVEL_LABELS')
  expect(pagos).toContain('etiquetaNivel(p.alumno_nivel)')
})
