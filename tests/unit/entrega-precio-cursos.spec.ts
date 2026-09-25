import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { cursos, personalizar, paleta } from '../../scripts/entrega/documento.mjs'
import { precioCursoNumerico as reglaEntrega, TEXTO_SIN_PRECIO as sinPrecioEntrega } from '@/lib/cursos/precio-regla'
import { precioCatalogo, precioCursoNumerico, TEXTO_SIN_PRECIO } from '@/lib/cursos/precio-curso'

/**
 * Bloque C · C4: el documento y el WhatsApp de entrega dicen del precio de un
 * curso lo MISMO que la página. Antes, un curso sin precio salía «Lo defines tú»
 * en el PDF mientras la página ya decía «Pide informes», y los textos del
 * módulo hablaban de «apertura mes a mes» aunque el curso fuera de pago único.
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

test('1. la entrega y la página usan la MISMA regla (precio-regla.ts, sin imports)', () => {
  expect(reglaEntrega).toBe(precioCursoNumerico)
  expect(sinPrecioEntrega).toBe(TEXTO_SIN_PRECIO)
  for (const [i, m] of [[2490, 0], [1500, 900], [0, 700], [0, 0], [-1, 0]] as const) {
    expect(reglaEntrega({ precio_inscripcion: i, precio_mensualidad: m }).tipo).toBe(precioCatalogo({ precio_inscripcion: i, precio_mensualidad: m }).tipo)
  }
  // Sin imports: la entrega lo importa con el type stripping de Node, sin alias '@/'.
  expect(leer('src/lib/cursos/precio-regla.ts')).not.toMatch(/^\s*import\s/m)
})

test('2. un curso sin precio sale «Pide informes» en el PDF, nunca «Lo defines tú»', () => {
  const html = texto(cursos({ ...BASE, cursosPublicados: 2, cursosLista: [
    { nombre: 'Curso de ingreso al EXANI-II', precio: '$2,490 de pago único' },
    { nombre: 'Curso sin precio', precio: '' },
  ] }))
  expect(html).toContain('$2,490 de pago único')
  expect(html).toContain('Curso sin precio Pide informes')
  expect(html).not.toContain('Lo defines tú')
  expect(leer('scripts/entrega/documento.mjs')).not.toMatch(/'Lo defines tú'\]/)
})

test('3. los textos del módulo dicen cómo se abre un curso de pago único', () => {
  const html = texto(cursos({ ...BASE, cursosPublicados: 1, cursosLista: [{ nombre: 'EXANI-II', precio: '$2,490 de pago único' }] }))
  expect(html).toContain('un curso de pago único se le abre completo')
  expect(html).toContain('Cuando un alumno te pague, asígnalo en')
  expect(html).not.toContain('Apertura de contenido mes a mes, igual que en el programa')
  expect(texto(personalizar({ ...BASE, sinWhatsApp: false }))).toContain('el precio de cada curso se cambia en su ficha')
})

test('4. el generador: la misma regla, y el add-on no se niega en silencio', () => {
  const g = sinComentarios(leer('scripts/entrega/generar-entrega.mjs'))
  expect(g).toContain("path.join(RAIZ, 'src/lib/cursos/precio-regla.ts')")
  expect(g).toMatch(/function precioDeCurso\(c\) \{\s*const p = precioCursoNumerico\(/)
  expect(g).toContain('return TEXTO_SIN_PRECIO')
  // Con el add-on encendido y sin inventario, aborta (el documento negaría lo vendido).
  expect(g).toMatch(/if \(addon && !INV\.cursosLista\) \{\s*abortar\(/)
  // La línea del WhatsApp siempre lleva el precio (o «Pide informes»).
  expect(g).toContain('`• ${c.nombre} — ${precioDeCurso(c)}: ${URL_BASE}/diplomados`')
  // El inventario lee .env.local con la lectura CRLF-safe.
  const inv = g.slice(g.indexOf('async function inventario()'), g.indexOf("log('· Leyendo inventario"))
  expect(inv).toContain('const vars = leerEnvLocal()')
  expect(leer('scripts/entrega/README.md')).not.toContain('| Cursos de ingreso | `src/lib/config.ts` |')
})
