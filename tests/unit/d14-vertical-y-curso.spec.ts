import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONCEPTOS_CURSO, CONCEPTOS_CURSO_LECTURA, CONCEPTOS_LECTURA, CONCEPTOS_PROGRAMA_LECTURA,
  aplicaA, etiquetaConcepto, etiquetaVertical, mesQueCubre, totalesPorVertical,
} from '@/lib/pagos/conceptos'
import { COLUMNAS_CURSO, aplanarCurso, leerPagosConCurso, olvidarSinB1 } from '@/lib/pagos/con-curso'

/**
 * Bloque D · D14 — #207-3: la vertical (por la FK) y el nombre del curso en la
 * ficha, /admin/pagos, Reportes, el Excel y el CSV de cursos, más «Mes que
 * cubre» (decisión 5). Antes un pago de curso se veía como uno del programa y
 * «Total pagado» los sumaba juntos.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('1. etiquetas puras: «Aplica a», la vertical, «Mes que cubre» y el pago único', () => {
  expect(aplicaA({ curso_inscripcion_id: null })).toBe('Programa')
  expect(aplicaA({ curso_inscripcion_id: 'ci', curso_nombre: 'EXANI-II', curso_tipo: 'curso' })).toBe('Curso «EXANI-II»')
  expect(aplicaA({ curso_inscripcion_id: 'ci', curso_nombre: 'Docencia', curso_tipo: 'diplomado' })).toBe('Diplomado «Docencia»')
  // Con FK pero sin nombre legible: la vertical sola, nunca «Programa».
  expect(aplicaA({ curso_inscripcion_id: 'ci', curso_nombre: null })).toBe('Curso')
  expect(etiquetaVertical({ curso_inscripcion_id: 'ci', curso_tipo: 'diplomado' })).toBe('Diplomado')
  expect(mesQueCubre({ mes_desbloqueado: 2, curso_inscripcion_id: null })).toBe('2')
  expect(mesQueCubre({ mes_desbloqueado: 2, curso_inscripcion_id: 'ci' })).toBe('mes 2 del curso')
  expect(mesQueCubre({ mes_desbloqueado: null, curso_inscripcion_id: 'ci' })).toBe('—')
  // El pago único (D16 lo escribe) ya tiene etiqueta; el escritor viejo (B3) no cambia.
  expect(etiquetaConcepto('curso_pago_unico')).toBe('Pago único de curso')
  expect(etiquetaConcepto('curso_pago_unico', 'mensaje')).toBe('pago único del curso')
  expect([...CONCEPTOS_CURSO]).toEqual(['curso_mensualidad', 'curso_inscripcion', 'curso_otro'])
  expect([...CONCEPTOS_CURSO_LECTURA]).toEqual([...CONCEPTOS_CURSO, 'curso_pago_unico'])
  expect([...CONCEPTOS_LECTURA]).toEqual([...CONCEPTOS_PROGRAMA_LECTURA, ...CONCEPTOS_CURSO_LECTURA])
  for (const c of CONCEPTOS_LECTURA) expect(etiquetaConcepto(c), c).not.toBe(c)
})

test('2. los totales por vertical van por la FK, no por el concepto', () => {
  const t = totalesPorVertical([
    { monto: 1000, curso_inscripcion_id: null },
    { monto: '500', curso_inscripcion_id: 'ci' },
    { monto: 250, curso_inscripcion_id: null },
    { monto: null, curso_inscripcion_id: 'ci' },
    { monto: 'x', curso_inscripcion_id: 'ci' },
  ])
  expect(t).toEqual({ total: 1750, programa: 1250, cursos: 500 })
})

test('3. el embed del curso se aplana; sin B1 se relee sin él (todo es programa); otro error se devuelve', async () => {
  expect(aplanarCurso({ id: 'p', curso_inscripcion_id: 'ci', curso_inscripciones: { cursos: { nombre: 'X', tipo: 'curso' } } }))
    .toEqual({ id: 'p', curso_inscripcion_id: 'ci', curso_nombre: 'X', curso_tipo: 'curso' })
  expect(aplanarCurso({ id: 'p', curso_inscripcion_id: 'ci', curso_inscripciones: [{ cursos: [{ nombre: 'Y', tipo: 'diplomado' }] }] }))
    .toEqual({ id: 'p', curso_inscripcion_id: 'ci', curso_nombre: 'Y', curso_tipo: 'diplomado' })
  expect(aplanarCurso({ id: 'p', curso_inscripcion_id: null, curso_inscripciones: null }))
    .toEqual({ id: 'p', curso_inscripcion_id: null, curso_nombre: null, curso_tipo: null })

  const pedidos: string[] = []
  const falsa = (respuestas: Array<{ data: unknown; error: { code?: string; message?: string } | null }>) =>
    (select: string) => { pedidos.push(select); return Promise.resolve(respuestas.shift()!) }

  // Con B1: una sola consulta, con el embed.
  pedidos.length = 0
  const ok = await leerPagosConCurso(falsa([{ data: [{ id: 'a', curso_inscripcion_id: null, curso_inscripciones: null }], error: null }]), 'id')
  expect(pedidos).toEqual([`id, ${COLUMNAS_CURSO}`])
  expect(ok).toEqual({ data: [{ id: 'a', curso_inscripcion_id: null, curso_nombre: null, curso_tipo: null }], error: null, sinB1: false })

  // Sin la COLUMNA (42703, base sin B1): segunda consulta sin el curso; todo es programa.
  olvidarSinB1()
  pedidos.length = 0
  const sinB1 = await leerPagosConCurso(falsa([{ data: null, error: { code: '42703', message: 'x' } }, { data: [{ id: 'b' }], error: null }]), 'id')
  expect(pedidos).toEqual([`id, ${COLUMNAS_CURSO}`, 'id'])
  expect(sinB1).toEqual({ data: [{ id: 'b', curso_inscripcion_id: null, curso_nombre: null, curso_tipo: null }], error: null, sinB1: true })
  // …y se recuerda: la siguiente lectura va directo sin el curso (sin la consulta fallida).
  pedidos.length = 0
  await leerPagosConCurso(falsa([{ data: [], error: null }]), 'id')
  expect(pedidos).toEqual(['id'])
  olvidarSinB1()

  // Sin la RELACIÓN (PGRST200: sin módulo de cursos o caché de esquema atrasada): se relee
  // con la columna sola. La vertical se conserva (va por la FK); solo se pierde el nombre.
  pedidos.length = 0
  const sinRel = await leerPagosConCurso(falsa([
    { data: null, error: { code: 'PGRST200', message: 'Could not find a relationship' } },
    { data: [{ id: 'c', curso_inscripcion_id: 'ci-9' }], error: null },
  ]), 'id')
  expect(pedidos).toEqual([`id, ${COLUMNAS_CURSO}`, 'id, curso_inscripcion_id'])
  expect(sinRel).toEqual({ data: [{ id: 'c', curso_inscripcion_id: 'ci-9', curso_nombre: null, curso_tipo: null }], error: null, sinB1: false })
  // PGRST200 y luego tampoco hay columna: sin B1.
  pedidos.length = 0
  const ninguna = await leerPagosConCurso(falsa([
    { data: null, error: { code: 'PGRST200', message: 'x' } },
    { data: null, error: { code: '42703', message: 'column pagos.curso_inscripcion_id does not exist' } },
    { data: [{ id: 'd' }], error: null },
  ]), 'id')
  expect(pedidos).toEqual([`id, ${COLUMNAS_CURSO}`, 'id, curso_inscripcion_id', 'id'])
  expect(ninguna.sinB1).toBe(true)
  olvidarSinB1()
  // El embed lleva la columna de cada FK como pista (sin ambigüedad PGRST201).
  expect(COLUMNAS_CURSO).toBe('curso_inscripcion_id, curso_inscripciones!curso_inscripcion_id(cursos!curso_id(nombre, tipo))')

  // Cualquier otro error NO es «sin B1»: se devuelve tal cual.
  pedidos.length = 0
  const mal = await leerPagosConCurso(falsa([{ data: null, error: { code: '57014', message: 'timeout' } }]), 'id')
  expect(pedidos).toHaveLength(1)
  expect(mal.error).toEqual({ code: '57014', message: 'timeout' })
})

test('4. la ficha: «Aplica a», «Mes que cubre» y el total partido', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/[id]/pagos/route.ts'))
  expect(api).toContain('await leerPagosConCurso<')
  expect(api).toContain('total_programa: t.programa,')
  expect(api).toContain('total_cursos:   t.cursos,')
  const f = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(f).toContain("{['Fecha', 'Concepto', 'Aplica a', 'Mes', 'Monto', 'Método', 'Referencia', ''].map((h, i) => (")
  expect(f).toContain('{aplicaA(p)}')
  expect(f).toContain('{mesQueCubre(p)}')
  expect(f).not.toContain("{p.mes_desbloqueado ?? '—'}")
  expect(f).toMatch(/\{totalCursos > 0 && \(\s*<span> · Programa \{fmtMoneda\(totalPrograma\)\} · Cursos \{fmtMoneda\(totalCursos\)\}<\/span>/)
  // «Marcar inscripción pagada» NO se oculta al alumno de curso: es lo único que
  // escribe inscripcion_pagada (lista «Sin pagar», «Pendientes», contador del
  // menú) y su modal ya tiene el texto para él (#203). Ocultarlo lo dejaba
  // «Sin pagar» para siempre (revisión D14).
  expect(f).toContain('{alumno.inscripcion_pagada ? (')
  expect(f).not.toContain('tieneProgramaEscolar')
})

test('5. /admin/pagos: el filtro acepta cursos y la vertical; KPIs partidos; insignia', () => {
  const api = sinComentarios(leer('src/app/api/admin/pagos/route.ts'))
  // El POST sigue siendo del programa (D4); el FILTRO del GET acepta todo.
  expect(api).toContain('const CONCEPTOS = CONCEPTOS_PROGRAMA')
  expect(api).toContain('const CONCEPTOS_FILTRO = CONCEPTOS_LECTURA')
  expect(api).toContain("if (concepto && !CONCEPTOS_FILTRO.includes(concepto as typeof CONCEPTOS_FILTRO[number])) {")
  expect(api).toContain("const VERTICALES = ['programa', 'curso'] as const")
  expect(api).toMatch(/query = vertical === 'curso'\s*\? query\.not\('curso_inscripcion_id', 'is', null\)\s*: query\.is\('curso_inscripcion_id', null\)/)
  expect(api).toContain("const pagos = sinB1 && vertical === 'curso' ? [] : leidos")
  expect(api).toContain('porVertical: {')
  const page = sinComentarios(leer('src/app/(dashboard)/admin/pagos/page.tsx'))
  expect(page).toContain("if (vertical) qs.set('vertical', vertical)")
  expect(page).toContain('}, [concepto, vertical, desde, hasta])')
  expect(page).toContain('<option value="curso">Cursos</option>')
  expect(page).toContain('{aplicaA(p)}')
})

test('6. Reportes: «Aplica a» en los últimos pagos y el aviso «¿era de un curso?» FUERA de la sección de cursos', () => {
  const api = sinComentarios(leer('src/app/api/admin/reportes/route.ts'))
  expect(api).toContain(".select('id, meses_desbloqueados, activo, nivel')")
  expect(api).toContain("const deCurso = new Set(alumnosList.filter(a => a.nivel === 'diplomado').map(a => a.id))")
  expect(api).toContain('const sospechosos = pagosList.filter(p => !p.curso_inscripcion_id && deCurso.has(p.alumno_id))')
  expect(api).toContain('programa_de_alumnos_de_curso: programaDeAlumnosDeCurso,')
  const page = sinComentarios(leer('src/app/(dashboard)/admin/reportes/page.tsx'))
  const aviso = page.indexOf('{programaDeCurso && programaDeCurso.pagos > 0 && (')
  expect(aviso).toBeGreaterThan(0)
  // La sección de cursos solo sale con datos de cursos; el cobro mal capturado justo no los genera.
  expect(aviso).toBeLessThan(page.indexOf('{mostrarSeccionCursos && cursos && ('))
  expect(page).toContain("{['Fecha', 'Alumno', 'Concepto', 'Aplica a', 'Monto', 'Método', 'Referencia'].map(h => (")
})

test('7. Excel y CSV: «Aplica a», «Curso», «Mes que cubre», Resumen partido; el CSV conserva la clave y agrega la etiqueta', () => {
  const x = sinComentarios(leer('src/app/api/admin/reportes/excel/route.ts'))
  expect(x).toContain("'Aplica a':       etiquetaVertical(p),")
  expect(x).toContain("'Curso':          p.curso_nombre ?? '',")
  expect(x).toContain("'Mes que cubre':  p.mes_desbloqueado ?? '',")
  expect(x).not.toContain('Mes que abrió')
  expect(x).toContain("['Fecha', 'Alumno', 'Matrícula', 'Nivel', 'Aplica a', 'Curso', 'Concepto', 'Mes que cubre', COL_MONTO, 'Método', 'Referencia', 'Registrado por']")
  expect(x).toContain('{ Concepto: `Ingresos totales · programa (${M})`, Valor: porVertical.programa },')
  expect(x).toContain('{ Concepto: `Ingresos totales · diplomados (${M})`, Valor: porVertical.cursos },')
  const csv = sinComentarios(leer('src/app/api/admin/reportes/export/route.ts'))
  expect(csv).toContain("'Concepto', 'Concepto (etiqueta)', 'Monto'")
  expect(csv).toContain("r.concepto, etiquetaConcepto(String(r.concepto ?? '')), r.monto")
  expect(csv).toContain("'Mes que cubre'")
})
