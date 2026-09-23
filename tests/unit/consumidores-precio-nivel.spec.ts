import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ES_PLANTILLA } from './es-plantilla'
import { getTotalPlan, type ModalidadPrograma } from '@/lib/modalidades'
import { inscripcionDe, mensualidadPropiaDe } from '@/lib/precios-nivel'

/**
 * F2-6 — los consumidores que faltaban leen el precio del NIVEL: la landing
 * clásica (la portada de la flota), el estado de cuenta semanal
 * (api/alumno/pagos) y el modal «Marcar inscripción pagada» de la ficha.
 *
 * Con las claves por nivel vacías cada uno da exactamente lo de antes; eso lo
 * cuida la regla de los resolvers (precios-nivel.spec) y, aquí, que ninguno
 * vuelva a leer el precio general a pelo ni pierda su respaldo de siempre.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')

const LANDING = 'src/components/landing/LandingClient.tsx'
const RESPALDO_SEC = "m.id === '3_meses' ? p.secundaria_3meses_normal : p.secundaria_6meses_normal"

test('1. la tarjeta de Secundaria conserva su respaldo por id y solo ANTEPONE la clave nueva', () => {
  // 🛑 El "idéntico para la flota": con la clave vacía, la mensualidad de
  // secundaria sigue saliendo del alias elegido por id, como siempre.
  const fuente = leer(LANDING)
  // En el clon de una escuela con landing PROPIA (CAU #200) la tarjeta no existe.
  if (!ES_PLANTILLA && !fuente.includes('planesSec.map')) test.skip()
  const conRespaldo = `mensualidadPropiaDe('secundaria', m, p) ?? (${RESPALDO_SEC})`
  // Fila del plan y fila del total, las dos.
  expect(fuente.split(conRespaldo).length - 1).toBe(2)
  expect(fuente).toContain(`cuotaDe(m, ${conRespaldo})`)
  expect(fuente).toContain(`{ ...m, mensualidad: ${conRespaldo} }`)
  // Y el respaldo no aparece suelto en ningún otro sitio (nadie lo usa sin la clave delante).
  expect(fuente.split(RESPALDO_SEC).length - 1).toBe(2)
})

test('2. la tarjeta de Preparatoria antepone su clave a la mensualidad del plan', () => {
  const fuente = leer(LANDING)
  if (!ES_PLANTILLA && !fuente.includes('planesPrepa.map')) test.skip()
  expect(fuente).toContain("cuotaDe(m, mensualidadPropiaDe('preparatoria', m, p) ?? undefined)")
  expect(fuente).toContain("{ ...m, mensualidad: mensualidadPropiaDe('preparatoria', m, p) ?? m.mensualidad }")
  expect(fuente).toContain("inscripcionDe('preparatoria', p)), unit: '' }))")
  expect(fuente).toContain("inscripcionDe('secundaria', p),\n")
  // Cada tarjeta, los precios de SU nivel: se corta el fuente (sin comentarios)
  // por tarjeta. Cruzar Prepa y Secundaria no se nota con las claves vacías
  // —las dos valen la general—, así que solo lo puede ver esta guarda.
  const src = sinComentarios(fuente)
  const iPrepa = src.indexOf('>Preparatoria</h3>')
  const iSec = src.indexOf('>Secundaria</h3>')
  const fin = src.indexOf('</section>', iSec)
  expect(iPrepa).toBeGreaterThan(-1)
  expect(iSec).toBeGreaterThan(iPrepa)
  expect(fin).toBeGreaterThan(iSec)
  const tarjetas = { preparatoria: src.slice(iPrepa, iSec), secundaria: src.slice(iSec, fin) }
  for (const [nivel, bloque] of Object.entries(tarjetas)) {
    const otro = nivel === 'preparatoria' ? 'secundaria' : 'preparatoria'
    expect(bloque, nivel).toContain(`Inscripción: {fmt(inscripcionDe('${nivel}', p))}`)
    expect(bloque.split(`inscripcionDe('${nivel}', p)`).length - 1, nivel).toBe(2)
    expect(bloque.split(`mensualidadPropiaDe('${nivel}', m, p)`).length - 1, nivel).toBe(2)
    expect(bloque, nivel).not.toContain(`inscripcionDe('${otro}'`)
    expect(bloque, nivel).not.toContain(`mensualidadPropiaDe('${otro}'`)
  }
})

test('3. ningún consumidor lee la inscripción general a pelo, salvo el comodín {inscripcion}', () => {
  // Las lecturas permitidas son las que ALIMENTAN `vars.inscripcion` (la general,
  // a propósito). «Mis pagos» pinta la del nivel que le da la API (F2-6b) y no
  // lee ninguna del config.
  const permitidas: Record<string, string[]> = {
    [LANDING]: ['inscripcion: fmt(p.inscripcion),'],
    'src/components/landing/animada/LandingAnimada.tsx': [
      'const inscripcionTexto = textoInscripcion(precios.inscripcion as number, { minusculas: true })',
    ],
    'src/app/api/alumno/pagos/route.ts': [],
    'src/app/(dashboard)/admin/alumnos/[id]/page.tsx': [],
    'src/app/(dashboard)/alumno/pagos/page.tsx': [],
  }
  const lectura = /\b(?:p|precios|cfg\.precios|config\.precios)\.inscripcion\b(?!\w)|\bprecios\.inscripcion\b(?!\w)/
  for (const [archivo, lista] of Object.entries(permitidas)) {
    const fuente = sinComentarios(leer(archivo))
    if (!ES_PLANTILLA && archivo === LANDING && !fuente.includes('planesSec.map')) continue
    const lineas = fuente.split('\n').map((l) => l.trim()).filter((l) => lectura.test(l))
    expect(lineas, archivo).toEqual(lista)
  }
  // Y en la animada, `inscripcionTexto` (la general) solo va al comodín.
  const animada = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(animada.match(/\binscripcionTexto\b/g)).toHaveLength(2)
  expect(animada).toContain('inscripcion: inscripcionTexto,')
})

test('4. api/alumno/pagos: total_plan con la inscripción del nivel y el campo aditivo `inscripcion`', () => {
  const ruta = leer('src/app/api/alumno/pagos/route.ts')
  expect(ruta).toContain('inscripcion:   inscripcionDe(nivel, precios),')
  expect(ruta).toContain('total_plan:    plan ? getTotalPlan(plan, inscripcionDe(nivel, precios)) : 0,')
  // Sigue leyendo el config PUBLICADO (plan-semanal.spec 4 lo exige).
  expect(ruta).toMatch(/import \{[^}]*\bgetSiteConfig\b[^}]*\} from '@\/lib\/site-config'/)

  // Lo que calcula esa expresión, con un plan semanal de 12 × 250.
  const plan = { id: '3_meses', label: '3', meses: 3, semanas: 12, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 4, activa: true } as unknown as ModalidadPrograma
  const sinClaves = { inscripcion: 500, inscripcionSecundaria: null, inscripcionPreparatoria: null }
  const conClaves = { inscripcion: 500, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500 }
  const total = (nivel: string | null, p: Record<string, unknown>) => getTotalPlan(plan, inscripcionDe(nivel, p))
  const cuotas = getTotalPlan(plan, 0)
  // Sin claves: lo de antes, `Number(precios.inscripcion ?? 0)`, en cualquier nivel.
  for (const nivel of ['secundaria', 'preparatoria', 'licenciatura', null]) {
    expect(total(nivel, sinClaves)).toBe(getTotalPlan(plan, Number(sinClaves.inscripcion ?? 0)))
  }
  // Con claves: cada nivel suma la suya; el que no tiene precio propio, la general.
  expect(total('secundaria', conClaves)).toBe(1000 + cuotas)
  expect(total('preparatoria', conClaves)).toBe(1500 + cuotas)
  expect(total('licenciatura', conClaves)).toBe(500 + cuotas)
})

test('5. la ficha confirma la inscripción del nivel del alumno, con el mismo formato crudo', () => {
  const ficha = leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx')
  expect(ficha).toContain("<span style={{ color: 'var(--color-acento)' }}>${inscripcionDe(alumno.nivel, cfg.precios)}</span>?")
  // Sin claves por nivel es la cifra de siempre (la e2e del editor busca `$750`).
  expect(`$${inscripcionDe('secundaria', { inscripcion: 750, inscripcionSecundaria: null })}`).toBe('$750')
  expect(`$${inscripcionDe(null, { inscripcion: 750 })}`).toBe('$750')
})

test('6. la mensualidad propia solo existe con clave: sin ella, cada tarjeta usa su respaldo de siempre', () => {
  const plan3 = { meses: 3, mensualidad: 2000 }
  const sinClaves = { mensualidadSecundaria3Meses: null, mensualidadPreparatoria3Meses: null }
  expect(mensualidadPropiaDe('secundaria', plan3, sinClaves)).toBeNull()
  expect(mensualidadPropiaDe('preparatoria', plan3, {})).toBeNull()
  expect(mensualidadPropiaDe('secundaria', plan3, { mensualidadSecundaria3Meses: 2700 })).toBe(2700)
})
