import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { cursos, personalizar, paleta, mxn } from '../../scripts/entrega/documento.mjs'
import {
  leerCursosPublicados, precioDeCurso, revisarCursos, filaResumenCursos, esColumnaFaltante, esTablaFaltante,
  cursosParaDocumento,
} from '../../scripts/entrega/cursos-entrega.mjs'
import {
  precioCursoNumerico as reglaEntrega, TEXTO_SIN_PRECIO as sinPrecioEntrega, resolverPrecioOferta as anuncioEntrega,
} from '@/lib/cursos/precio-regla'
import { normalizarOfertas as ofertasEntrega } from '@/lib/cursos/oferta-regla'
import { precioCatalogo, precioCursoNumerico, TEXTO_SIN_PRECIO, resolverPrecioOferta } from '@/lib/cursos/precio-curso'
import { normalizarOfertas } from '@/lib/cursos/oferta'

/**
 * Bloque C · C4: el documento y el WhatsApp de entrega dicen de un curso lo MISMO
 * que la página y el registro, y no niegan lo vendido. Antes, un curso sin
 * precio salía «Lo defines tú» en el PDF mientras la página ya decía «Pide
 * informes»; un error al leer los cursos salía como «0 cursos» («Crea tus propios
 * cursos») aunque la escuela hubiera comprado el add-on; y el aviso al operador
 * afirmaba que el registro anuncia el precio de la ficha también con la ficha en
 * 0/0, cuando el registro anuncia el de config.ts.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const texto = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const BASE = {
  url: 'https://escuela.mx',
  P: paleta(undefined),
  modalidadesCols: ['Modalidad', 'Duración'],
  modalidadesFilas: [['Plan 3 meses', '3 meses']],
  cursosPublicados: 0,
  cursosLista: [] as { nombre: string; precio: string }[],
}

type Curso = { id: string; nombre: string; tipo: string; inscripcion: number; mensualidad: number; meses: number }
const curso = (id: string, inscripcion: number, mensualidad: number, meses = 0): Curso =>
  ({ id, nombre: `Curso ${id}`, tipo: 'curso', inscripcion, mensualidad, meses })
const lectura = (lista: Curso[] | null, extra: Record<string, unknown> = {}) =>
  ({ lista, error: lista === null ? 'fetch failed' : null, sinPrecio: false, sinTabla: false, ...extra })

/** Un cliente de Supabase falso: devuelve, en orden, las respuestas dadas, y anota qué se pidió. */
function sbFalso(respuestas: Array<{ data?: unknown; error?: unknown }>) {
  const pedidas: string[] = []
  const consultas: { tabla: string; campos: string; eq: [string, unknown][] }[] = []
  const sb = {
    from: (tabla: string) => ({
      select: (campos: string) => {
        pedidas.push(campos)
        const c = { tabla, campos, eq: [] as [string, unknown][] }
        consultas.push(c)
        const r = respuestas.shift() ?? { data: [] }
        const q = {
          eq: (col: string, v: unknown) => { c.eq.push([col, v]); return q },
          order: () => Promise.resolve({ data: r.data ?? null, error: r.error ?? null }),
        }
        return q
      },
    }),
  }
  return { sb, pedidas, consultas }
}

test('1. la entrega y la página usan la MISMA regla, y Node la importa tal cual (sin imports ni sintaxis de TS que no se borra)', () => {
  expect(reglaEntrega).toBe(precioCursoNumerico)
  expect(sinPrecioEntrega).toBe(TEXTO_SIN_PRECIO)
  expect(anuncioEntrega).toBe(resolverPrecioOferta)
  expect(ofertasEntrega).toBe(normalizarOfertas)
  for (const [i, m] of [[2490, 0], [1500, 900], [0, 700], [0, 0], [-1, 0]] as const) {
    expect(reglaEntrega({ precio_inscripcion: i, precio_mensualidad: m }).tipo).toBe(precioCatalogo({ precio_inscripcion: i, precio_mensualidad: m }).tipo)
  }
  // El candado de los módulos que la entrega importa con el type stripping de
  // Node: el mismo que precios-nivel.ts e inscripcion-licenciatura.ts.
  for (const f of ['src/lib/cursos/precio-regla.ts', 'src/lib/cursos/oferta-regla.ts']) {
    const src = sinComentarios(leer(f))
    expect(src, f).not.toMatch(/^\s*import\s/m)
    expect(src, f).not.toMatch(/^\s*export\b[^;]*?\bfrom\b/m)
    expect(src, f).not.toMatch(/\brequire\(|from '@\//)
    expect(src, f).not.toMatch(/\benum\b|\bnamespace\b|\bdeclare\b/)
  }
  // …y de verdad: Node carga el módulo de cursos de la entrega (y con él los dos .ts).
  const url = pathToFileURL(join(process.cwd(), 'scripts/entrega/cursos-entrega.mjs')).href
  const salida = execFileSync(process.execPath, ['--input-type=module', '-e',
    `const m = await import(${JSON.stringify(url)}); console.log(Object.keys(m).sort().join(','))`],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  expect(salida.trim()).toBe('cursosParaDocumento,esColumnaFaltante,esTablaFaltante,filaResumenCursos,leerCursosPublicados,precioDeCurso,revisarCursos')
})

test('2. el precio que se pinta de cada curso: la regla de la página, en palabras', () => {
  expect(precioDeCurso(curso('a', 2490, 0), mxn)).toBe('$2,490 de pago único')
  expect(precioDeCurso(curso('b', 1500, 900, 3), mxn)).toBe('$1,500 de inscripción + $900 al mes × 3 meses')
  expect(precioDeCurso(curso('c', 0, 700), mxn)).toBe('$700 al mes')
  expect(precioDeCurso(curso('d', 0, 700, 1), mxn)).toBe('$700 al mes × 1 mes')
  for (const [i, m] of [[0, 0], [-1, 0], [Number.NaN, 0]] as const) {
    expect(precioDeCurso(curso('e', i, m), mxn)).toBe(TEXTO_SIN_PRECIO)
  }
  // Y el PDF lo pinta tal cual, sin una segunda copia del texto de «sin precio».
  const html = texto(cursos({ ...BASE, cursosPublicados: 2, cursosLista: [
    { nombre: 'Curso de ingreso al EXANI-II', precio: precioDeCurso(curso('x', 2490, 0), mxn) },
    { nombre: 'Curso sin precio', precio: precioDeCurso(curso('y', 0, 0), mxn) },
  ] }))
  expect(html).toContain('$2,490 de pago único')
  expect(html).toContain('Curso sin precio Pide informes')
  expect(html).not.toContain('Lo defines tú')
  expect(leer('scripts/entrega/documento.mjs')).not.toMatch(/'Pide informes'|'Lo defines tú'\]/)
})

test('3. leer los cursos: un error NO es «0 cursos»; el respaldo sin precio es solo para una columna que falta', async () => {
  const fila = { id: 'u1', nombre: 'EXANI', tipo: 'curso', precio_inscripcion: 2490, precio_mensualidad: 0, duracion_meses: null }
  let f = sbFalso([{ data: [fila] }])
  expect(await leerCursosPublicados(f.sb)).toEqual({ lista: [curso('u1', 2490, 0)].map(c => ({ ...c, nombre: 'EXANI' })), error: null, sinPrecio: false, sinTabla: false })
  // Solo los PUBLICADOS de la tabla cursos: un borrador no se vende.
  expect(f.consultas).toEqual([{ tabla: 'cursos', campos: 'id, nombre, tipo, precio_inscripcion, precio_mensualidad, duracion_meses, orden', eq: [['estado', 'publicado']] }])
  // Llave inválida, 5xx, red caída: lista null, con el motivo; sin respaldo.
  for (const error of [{ code: '', message: 'TypeError: fetch failed' }, { code: 'PGRST301', message: 'JWT invalid' }, { code: '57014', message: 'timeout' }]) {
    f = sbFalso([{ error }, { data: [fila] }])
    const r = await leerCursosPublicados(f.sb)
    expect(r.lista).toBeNull()
    expect(r.error).toBe(error.message)
    expect(f.pedidas.length).toBe(1)
  }
  // Base sin B1: se lee solo el nombre y se marca.
  f = sbFalso([{ error: { code: '42703', message: 'column cursos.precio_inscripcion does not exist' } }, { data: [{ id: 'u1', nombre: 'EXANI', tipo: 'curso' }] }])
  const sinB1 = await leerCursosPublicados(f.sb)
  expect(sinB1.sinPrecio).toBe(true)
  expect(sinB1.lista).toEqual([{ id: 'u1', nombre: 'EXANI', tipo: 'curso', inscripcion: 0, mensualidad: 0, meses: 0 }])
  expect(f.pedidas).toEqual(['id, nombre, tipo, precio_inscripcion, precio_mensualidad, duracion_meses, orden', 'id, nombre, tipo'])
  expect(f.consultas.map(c => [c.tabla, c.eq])).toEqual([['cursos', [['estado', 'publicado']]], ['cursos', [['estado', 'publicado']]]])
  // …y si el respaldo también falla, es un fallo de lectura.
  f = sbFalso([{ error: { code: '42703', message: 'x' } }, { error: { code: '', message: 'fetch failed' } }])
  expect((await leerCursosPublicados(f.sb)).lista).toBeNull()
  // Sin la tabla (sin módulo): lista vacía legítima.
  f = sbFalso([{ error: { code: 'PGRST205', message: 'Could not find the table' } }])
  expect(await leerCursosPublicados(f.sb)).toEqual({ lista: [], error: null, sinPrecio: false, sinTabla: true })
  expect(esColumnaFaltante({ code: '42703' })).toBe(true)
  expect(esColumnaFaltante({ code: '57014' })).toBe(false)
  expect(esTablaFaltante({ code: '42P01' })).toBe(true)
  // Lo que pinta el documento: los leídos, o ninguno si no se pudieron leer.
  expect(cursosParaDocumento({ lista: [curso('a', 1, 0)] })).toEqual([curso('a', 1, 0)])
  expect(cursosParaDocumento({ lista: null })).toEqual([])
  expect(cursosParaDocumento(null)).toEqual([])
  expect(cursosParaDocumento(undefined)).toEqual([])
})

test('4. revisar los cursos: se aborta antes que negar lo vendido o contradecir al registro', () => {
  const ing = (cursos: unknown[], extra: Record<string, unknown> = {}) => ({ activa: true, cursos, ...extra })
  const U = curso('U', 2490, 0), Z = curso('Z', 0, 0), M = curso('M', 0, 900), P = curso('P', 1990, 0)
  const r = (args: Omit<Parameters<typeof revisarCursos>[0], 'mxn'>) => revisarCursos({ mxn, ...args })

  // Sin add-on: sin inventario, sin cursos, sin tabla o sin B1 sin cursos, sale.
  expect(r({ lectura: null, ing: undefined }).abortar).toBeNull()
  expect(r({ lectura: lectura([]), ing: undefined }).abortar).toBeNull()
  expect(r({ lectura: lectura([], { sinTabla: true }), ing: undefined })).toEqual({ abortar: null, avisos: [] })
  expect(r({ lectura: lectura([], { sinPrecio: true }), ing: undefined })).toEqual({ abortar: null, avisos: [] })
  // …y con un error de lectura, sale pero AVISA fuerte (describe el módulo vacío).
  const falla = r({ lectura: lectura(null), ing: undefined })
  expect(falla.abortar).toBeNull()
  expect(falla.avisos[0]).toMatch(/^No se pudieron leer los cursos publicados \(fetch failed\): el documento describe el módulo de cursos vacío\. Si la escuela ya tiene cursos publicados, NO lo envíes/)
  // Base sin B1 con cursos: aborta (los pintaría sin precio).
  expect(r({ lectura: lectura([U], { sinPrecio: true }), ing: undefined }).abortar?.msg).toMatch(/columnas de precio/)
  // Un curso sin precio: aviso (también al asignar: mes 1).
  expect(r({ lectura: lectura([Z]), ing: undefined }).avisos[0]).toMatch(/«Curso Z» no tiene precio: .*se abre solo el mes 1/)

  // Con add-on (las dos formas de la bandera: `activa` y `activos`): sin
  // inventario, con la lectura fallida o sin cursos publicados → aborta.
  const activos = (cursos: unknown[], extra: Record<string, unknown> = {}) => ({ activos: true, cursos, ...extra })
  for (const forma of [ing, activos]) {
    expect(r({ lectura: null, ing: forma([{ id: 'u', precio: 2490, cursoIds: ['U'] }]) }).abortar?.msg).toMatch(/no hay inventario de cursos/)
    expect(r({ lectura: lectura(null), ing: forma([{ id: 'u', precio: 2490, cursoIds: ['U'] }]) }).abortar?.msg).toMatch(/No se pudieron leer los cursos publicados: fetch failed/)
    expect(r({ lectura: lectura([]), ing: forma([{ id: 'u', precio: 2490, cursoIds: ['U'] }]) }).abortar?.msg).toMatch(/no hay cursos publicados/)
  }
  expect(r({ lectura: lectura([]), ing: ing([{ id: 'u', precio: 2490, cursoIds: ['U'] }]) }).abortar?.msg).toMatch(/no hay cursos publicados/)
  expect(r({ lectura: lectura([], { sinTabla: true }), ing: ing([]) }).abortar?.msg).toMatch(/no tiene la tabla cursos/)

  // Todo cuadra: ficha 2490/0 y config 2490 → ni aborto ni aviso.
  expect(r({ lectura: lectura([U]), ing: ing([{ id: 'u', precio: 2490, cursoIds: ['U'] }]) })).toEqual({ abortar: null, avisos: [] })

  // Ficha 0/0 con precio en config.ts: el registro vende $2,490 (respaldo), el
  // documento diría «Pide informes» y «Asignar» abriría el mes 1 → aborta, y lo dice.
  const cero = r({ lectura: lectura([Z]), ing: ing([{ id: 'z', precio: 2490, cursoIds: ['Z'] }]) })
  expect(resolverPrecioOferta({ cursoIds: ['Z'], precio: 2490, esPaquete: false }, new Map([['Z', { precio_inscripcion: 0, precio_mensualidad: 0 }]])))
    .toEqual({ tipo: 'unico', monto: 2490, fuente: 'config' })
  expect(cero.abortar?.msg).toMatch(/«Curso Z»: su ficha no tiene precio, pero el registro lo vende a \$2,490 de pago único/)
  expect(cero.abortar?.msg).toMatch(/«Asignar» abriría solo el mes 1\. Pon \$2,490 de inscripción y 0 de mensualidad en Gestionar Cursos → el curso → Contenido → Precios y ritmo\./)
  expect(cero.abortar?.msg).not.toMatch(/anuncian el de la ficha/)

  // Ficha con OTRO precio: el registro y el documento dicen el de la ficha → solo aviso, y es verdad.
  const otro = r({ lectura: lectura([P]), ing: ing([{ id: 'p', precio: 2490, cursoIds: ['P'] }]) })
  expect(otro.abortar).toBeNull()
  expect(otro.avisos[0]).toBe('«Curso P»: config.ts dice $2,490, pero el registro y este documento anuncian el precio de su ficha: $1,990 de pago único. Si el bueno es el de config.ts, cámbialo en Gestionar Cursos → el curso → Contenido → Precios y ritmo.')

  // Una oferta que apunta a un curso sin publicar: el registro la vende → aborta.
  expect(r({ lectura: lectura([U]), ing: ing([{ id: 'f', precio: 1999, cursoIds: ['NOPE'] }]) }).abortar?.msg).toMatch(/apunta a un curso que no está publicado \(NOPE\)/)

  // Paquete (la forma real, EVOCONTUCER): el registro vende una cifra; se avisa
  // qué abre «Asignar» en cada curso.
  const paq = r({ lectura: lectura([U, M]), ing: activos([{ slug: 'u', examen: 'EXANI-II', cursoIds: ['U'] }, { slug: 'm', cursoIds: ['M'] }], { precioPaquete: 4990 }) })
  expect(paq.abortar).toBeNull()
  expect(paq.avisos[0]).toMatch(/el registro lo vende en una sola oferta a \$4,990 de pago único/)
  expect(paq.avisos[0]).toMatch(/«Curso M» abre solo el mes 1/)
  // …pero con una ficha en 0/0 aborta, como la oferta de un curso.
  const paqCero = r({ lectura: lectura([U, Z]), ing: activos([{ slug: 'u', cursoIds: ['U'] }, { slug: 'z', cursoIds: ['Z'] }], { precioPaquete: 4990 }) })
  expect(paqCero.abortar?.msg).toMatch(/el registro la vende a \$4,990 de pago único, pero «Curso Z» no tiene precio en su ficha/)
  // Oferta de varios cursos SIN paquete: mismo trato (aviso; aborto si una ficha está en 0/0).
  const combo = r({ lectura: lectura([U, M]), ing: ing([{ id: 'c', nombre: 'Combo', precio: 3000, cursoIds: ['U', 'M'] }]) })
  expect(combo.abortar).toBeNull()
  expect(combo.avisos[0]).toMatch(/^«Combo»: el registro lo vende en una sola oferta a \$3,000 de pago único/)
  expect(r({ lectura: lectura([U, Z]), ing: ing([{ id: 'c', nombre: 'Combo', precio: 3000, cursoIds: ['U', 'Z'] }]) }).abortar?.msg).toMatch(/«Combo»: el registro la vende a \$3,000/)
  // Un paquete sin cursoIds no se muestra en el registro: no se inventa un aviso de paquete.
  const sinIds = r({ lectura: lectura([U]), ing: ing([{ slug: 'u' }], { precioPaquete: 4990 }) })
  expect(sinIds.avisos.join(' ')).not.toMatch(/una sola oferta/)
  expect(sinIds.avisos.join(' ')).toMatch(/ninguna oferta trae cursoIds/)

  // En solo_cursos el menú se llama «Diplomados».
  expect(r({ lectura: lectura([Z]), ing: undefined, menu: 'Diplomados' }).avisos[0]).toMatch(/en Diplomados → el curso → Contenido → Precios y ritmo/)
})

test('5. la tabla resumen: un curso de pago único no tiene mensualidad ni se abre «por módulos»', () => {
  expect(filaResumenCursos([curso('a', 2490, 0), curso('b', 1990, 0)])).toEqual(['Cursos propios (2 publicados)', 'La define cada curso', 'Sin mensualidad (pago único)', 'Completo al asignar'])
  expect(filaResumenCursos([curso('a', 0, 900)])).toEqual(['Cursos propios (1 publicado)', 'La define cada curso', 'Por curso (mensual)', 'Mes a mes'])
  expect(filaResumenCursos([curso('a', 2490, 0), curso('b', 0, 900)])).toEqual(['Cursos propios (2 publicados)', 'La define cada curso', 'Según el curso', 'Completo (pago único) o mes a mes'])
  expect(filaResumenCursos([curso('a', 0, 0)])).toEqual(['Cursos propios (1 publicado)', 'La define cada curso', TEXTO_SIN_PRECIO, 'Mes a mes'])
  expect(filaResumenCursos([])).toEqual(['Cursos propios (módulo vacío)', 'La define cada curso', 'Según el curso', 'Completo (pago único) o mes a mes'])
  for (const l of [[curso('a', 2490, 0)], [], [curso('a', 0, 900)], [curso('a', 0, 0)], [curso('a', 2490, 0), curso('b', 0, 900)]]) {
    expect(filaResumenCursos(l).join(' ')).not.toContain('Por módulos')
  }
})

test('6. los textos del módulo: cómo se abre un curso, el alumno que se registró solo y el menú del modo', () => {
  const html = texto(cursos({ ...BASE, cursosPublicados: 1, cursosLista: [{ nombre: 'EXANI-II', precio: '$2,490 de pago único' }] }))
  expect(html).toContain('un curso de pago único se le abre completo')
  expect(html).toContain('Cuando un alumno te pague, asígnalo en Gestionar Cursos → el curso → Alumnos')
  expect(html).toContain('Si se registró desde tu página eligiendo el curso, ya está en esa lista sin acceso: pulsa Abrir todo (pago único) o + Abrir mes (mensual)')
  expect(html).toContain('Contenido → Precios y ritmo')
  expect(html).not.toContain('curso de preparación para examen')
  // Con el add-on, el otro camino del registro: lo pidió y se asigna en Alumnos.
  const conIngreso = texto(cursos({ ...BASE, vendeIngreso: true, cursosPublicados: 1, cursosLista: [{ nombre: 'EXANI-II', precio: '$2,490 de pago único' }] }))
  expect(conIngreso).toContain('Si lo pidió como curso de preparación para examen, aparece en Alumnos con lo que solicitó: pulsa Asignar ahí')
  expect(html).not.toContain('Apertura de contenido mes a mes, igual que en el programa')
  expect(texto(personalizar({ ...BASE, sinWhatsApp: false }))).toContain('el precio de cada curso se cambia en su ficha, en Gestionar Cursos')
  // solo_cursos: el menú del panel es «Diplomados».
  const solo = texto(cursos({ ...BASE, menuCursos: 'Diplomados', cursosPublicados: 1, cursosLista: [{ nombre: 'X', precio: '$1 de pago único' }] }))
  expect(solo).toContain('asígnalo en Diplomados → el curso → Alumnos')
  expect(solo).not.toContain('Gestionar Cursos')
  expect(texto(cursos({ ...BASE, menuCursos: 'Diplomados' }))).toContain('Entra a Diplomados en el menú de tu panel')
  expect(texto(personalizar({ ...BASE, menuCursos: 'Diplomados', sinWhatsApp: false }))).toContain('en Diplomados)')
})

test('7. el generador: usa el módulo de cursos, no se niega en silencio y repite los avisos junto al ✓', () => {
  const g = sinComentarios(leer('scripts/entrega/generar-entrega.mjs'))
  // Se importa DESPUÉS de revisar la versión de Node (arrastra .ts).
  expect(g).toContain("await import('./cursos-entrega.mjs')")
  expect(g.indexOf("await import('./cursos-entrega.mjs')")).toBeGreaterThan(g.indexOf('NODE_MAJOR < 23'))
  expect(g).not.toMatch(/^import[^\n]*cursos-entrega/m)
  // Una sola regla: el generador ya no la reescribe.
  expect(g).not.toMatch(/precioCursoNumerico|TEXTO_SIN_PRECIO|ing\.cursos/)
  expect(g).toContain('inv.cursosLectura = await leerCursosPublicados(sb)')
  expect(g).toMatch(/const r = revisarCursos\(\{ lectura: INV\.cursosLectura \?\? null, ing: CONFIG\.cursosIngreso, mxn, menu: MENU_CURSOS \}\)\s*for \(const a of r\.avisos\) avisar\(a\)\s*if \(r\.abortar\) abortar\(r\.abortar\.msg, r\.abortar\.ayuda\)/)
  expect(g).toContain("const MENU_CURSOS = CONFIG.modo === 'solo_cursos' ? 'Diplomados' : 'Gestionar Cursos'")
  expect(g).toContain('menuCursos: MENU_CURSOS,')
  expect(g).toContain('modalidadesFilas.push(filaResumenCursos(CURSOS_PUBLICADOS))')
  // La línea del WhatsApp siempre lleva el precio (o «Pide informes»).
  expect(g).toContain('`• ${c.nombre} — ${precioDeCurso(c)}: ${URL_BASE}/diplomados`')
  expect(g).toContain('a quien ya se registró desde tu página eligiendo el curso, con «Abrir todo» o «+ Abrir mes»')
  expect(g).toContain('a quien se registró desde tu página eligiendo el curso, con «Abrir todo» (pago único) o «+ Abrir mes» (mensual)')
  expect(g).toContain("a quien pidió un curso de preparación para examen, con «Asignar» en Alumnos")
  // Lo leído llega al documento por UN camino: cursosParaDocumento(INV.cursosLectura).
  expect(g).toContain('const CURSOS_PUBLICADOS = cursosParaDocumento(INV.cursosLectura)')
  expect(g.match(/INV\.cursosLectura/g)?.length).toBe(2)
  expect(g.indexOf('const r = revisarCursos(')).toBeLessThan(g.indexOf('const CURSOS_PUBLICADOS = '))
  // Los avisos se acumulan y se repiten TODOS al final: después del volcado del
  // WhatsApp y antes del «✓ Entrega lista».
  expect(g).toMatch(/const avisar = \(msg\) => \{ AVISOS\.push\(msg\); log\(`  ⚠ \$\{msg\}`\) \}/)
  const revisa = g.indexOf('REVISA ANTES DE ENVIAR')
  expect(revisa).toBeGreaterThan(g.indexOf('hasta aquí'))
  expect(revisa).toBeLessThan(g.indexOf('✓ Entrega lista'))
  expect(g.slice(revisa, g.indexOf('✓ Entrega lista'))).toMatch(/for \(const a of AVISOS\) log\(/)
  // De verdad: con un Node viejo (versión simulada y sin type stripping), el
  // generador sale con su mensaje ANTES de cargar ningún .ts.
  const dir = mkdtempSync(join(tmpdir(), 'c4-node-'))
  try {
    const viejo = join(dir, 'node-viejo.mjs')
    writeFileSync(viejo, "Object.defineProperty(process.versions, 'node', { value: '22.11.0' })\n")
    const corrida = spawnSync(process.execPath, ['--no-experimental-strip-types', '--import', pathToFileURL(viejo).href, 'scripts/entrega/generar-entrega.mjs'],
      { cwd: process.cwd(), encoding: 'utf8', timeout: 60000 })
    expect(corrida.status).toBe(1)
    expect(corrida.stderr).toContain('Este script necesita Node >= 23.6 (tienes 22.11.0)')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  // El inventario lee .env.local con la lectura CRLF-safe.
  const inv = g.slice(g.indexOf('async function inventario()'), g.indexOf("log('· Leyendo inventario"))
  expect(inv).toContain('const vars = leerEnvLocal()')
  expect(leer('scripts/entrega/README.md')).not.toContain('| Cursos de ingreso | `src/lib/config.ts` |')
})
