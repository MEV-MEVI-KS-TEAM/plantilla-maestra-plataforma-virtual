import { test, expect } from '@playwright/test'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { repartirPaginas } from '../../scripts/entrega/paginar.mjs'

/**
 * El paginador del Documento de Entrega Oficial (Bug 185).
 *
 * En producción corre dentro de Chromium y mide `scrollHeight`. Aquí corre sobre
 * un DOM de mentira donde cada bloque tiene una altura fija y el cuerpo de cada
 * página una capacidad: sin navegador, como el resto de `tests/unit`. Solo
 * implementa lo que `paginar.mjs` usa del DOM.
 *
 * Lo que protegen estas pruebas:
 *   - HTI #205: una tabla que no cabía junto a su título generaba 408 páginas
 *     vacías (el bloque se movía en bucle con su rótulo «(continúa)»);
 *   - que ninguna fila ni bloque se pierda o se duplique al repartir;
 *   - que un bloque indivisible se reporte en vez de disparar un bucle.
 */

type Opciones = { clase?: string; altura?: number; texto?: string; capacidad?: number }

class Nodo {
  tagName: string
  className: string
  altura: number
  textContent: string
  capacidad?: number
  children: Nodo[] = []
  parent: Nodo | null = null

  constructor(tag: string, { clase = '', altura = 0, texto = '', capacidad }: Opciones = {}) {
    this.tagName = tag.toUpperCase()
    this.className = clase
    this.altura = altura
    this.textContent = texto
    this.capacidad = capacidad
  }

  get classList() { return { contains: (c: string) => this.className.split(/\s+/).includes(c) } }
  get firstChild() { return this.children[0] ?? null }
  get firstElementChild() { return this.children[0] ?? null }
  get lastElementChild() { return this.children[this.children.length - 1] ?? null }
  get nextSibling(): Nodo | null {
    if (!this.parent) return null
    const hermanos = this.parent.children
    return hermanos[hermanos.indexOf(this) + 1] ?? null
  }
  set innerHTML(_: string) {
    for (const h of this.children) h.parent = null
    this.children = []
  }

  /** Una tabla mide lo que sus filas; cualquier otro bloque, su altura fija. */
  get alto(): number {
    return this.tagName === 'TABLE' ? this.children.reduce((a, h) => a + h.alto, 0) : this.altura
  }
  get scrollHeight() { return this.children.reduce((a, h) => a + h.alto, 0) }
  get clientHeight() { return this.capacidad ?? this.scrollHeight }

  private soltar() {
    if (!this.parent) return
    this.parent.children.splice(this.parent.children.indexOf(this), 1)
    this.parent = null
  }
  insertBefore(nodo: Nodo, ref: Nodo | null) {
    nodo.soltar()
    const i = ref ? this.children.indexOf(ref) : -1
    if (i < 0) this.children.push(nodo)
    else this.children.splice(i, 0, nodo)
    nodo.parent = this
    return nodo
  }
  appendChild(nodo: Nodo) { return this.insertBefore(nodo, null) }
  after(nodo: Nodo) {
    const padre = this.parent!
    nodo.soltar()
    padre.children.splice(padre.children.indexOf(this) + 1, 0, nodo)
    nodo.parent = padre
  }
  remove() { this.soltar() }
  cloneNode(profundo: boolean): Nodo {
    const copia = new Nodo(this.tagName, { clase: this.className, altura: this.altura, texto: this.textContent, capacidad: this.capacidad })
    if (profundo) for (const h of this.children) copia.appendChild(h.cloneNode(true))
    return copia
  }

  /** Selectores simples (`tag`, `.clase`, `tag.clase`), listas con coma y descendientes con espacio. */
  matches(selector: string): boolean {
    return selector.split(',').some(parte => {
      const pasos = parte.trim().split(/\s+/)
      if (!Nodo.simple(this, pasos[pasos.length - 1])) return false
      let ancestro = this.parent
      for (let i = pasos.length - 2; i >= 0; i--) {
        while (ancestro && !Nodo.simple(ancestro, pasos[i])) ancestro = ancestro.parent
        if (!ancestro) return false
        ancestro = ancestro.parent
      }
      return true
    })
  }
  private static simple(nodo: Nodo, selector: string) {
    const [tag, ...clases] = selector.split('.')
    return (!tag || nodo.tagName === tag.toUpperCase()) && clases.every(c => nodo.classList.contains(c))
  }
  querySelectorAll(selector: string): Nodo[] {
    const salida: Nodo[] = []
    const recorrer = (n: Nodo) => n.children.forEach(h => { if (h.matches(selector)) salida.push(h); recorrer(h) })
    recorrer(this)
    return salida
  }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null }
}

const CAPACIDAD = 100

/** Un documento con sus páginas; cada página, su número y su cuerpo con capacidad fija. */
function documento(paginas: Nodo[][]) {
  const raiz = new Nodo('main')
  paginas.forEach((bloques, i) => {
    const pagina = new Nodo('section', { clase: 'page' })
    pagina.appendChild(new Nodo('span', { clase: 'pg', texto: `Pág. ${i + 1}` }))
    const cuerpo = pagina.appendChild(new Nodo('div', { clase: 'body', capacidad: CAPACIDAD }))
    bloques.forEach(b => cuerpo.appendChild(b))
    raiz.appendChild(pagina)
  })
  const doc = {
    querySelectorAll: (s: string) => raiz.querySelectorAll(s),
    createElement: (tag: string) => new Nodo(tag),
  }
  const cuerpos = () => raiz.querySelectorAll('.page').map(p => p.querySelector('.body')!)
  return { doc, cuerpos, raiz }
}

const h2 = (texto: string) => new Nodo('h2', { altura: 10, texto })
const h3 = (texto: string) => new Nodo('h3', { altura: 10, texto })
const p = (altura: number, texto = '') => new Nodo('p', { altura, texto })
function tabla(filas: number, alto = 4) {
  const t = new Nodo('table', { clase: 'dt' })
  t.appendChild(new Nodo('tr', { altura: alto, texto: 'encabezado' }))
  for (let i = 1; i <= filas; i++) t.appendChild(new Nodo('tr', { altura: alto, texto: `fila ${i}` }))
  return t
}
const esRelleno = (n: Nodo) => n.classList.contains('cont') || /^H[1-4]$/.test(n.tagName)

test('Bug 185: una tabla que no cabe junto a su título se parte por filas, sin páginas vacías', () => {
  // HTI #205: «Contenido cargado» con 10 licenciaturas (dos filas por carrera).
  const { doc, cuerpos, raiz } = documento([
    [h2('Tu plataforma'), p(20), p(30), h3('Contenido cargado'), tabla(40)],
    [h2('Precios'), p(30)],
  ])
  const r = repartirPaginas(doc)

  expect(r.paginas).toBeLessThanOrEqual(5)
  expect(r.rebeldes).toEqual([])
  // Ninguna página queda solo con un rótulo o un título.
  for (const c of cuerpos()) expect(c.children.filter(n => !esRelleno(n)).length).toBeGreaterThan(0)
  // Cada parte de la tabla repite el encabezado; ninguna fila se pierde ni se duplica.
  const partes = raiz.querySelectorAll('table.dt')
  expect(partes.length).toBeGreaterThan(1)
  for (const t of partes) expect(t.children[0].textContent).toBe('encabezado')
  const filas = partes.flatMap(t => t.children.slice(1).map(f => f.textContent))
  expect(filas).toEqual(Array.from({ length: 40 }, (_, i) => `fila ${i + 1}`))
  // La sección que venía después sigue ahí, entera.
  expect(raiz.querySelectorAll('h2').map(h => h.textContent)).toContain('Precios')
  // Números renumerados después de repartir.
  expect(raiz.querySelectorAll('.pg').map(n => n.textContent))
    .toEqual(Array.from({ length: r.paginas }, (_, i) => `Pág. ${i + 1}`))
})

test('un bloque indivisible más alto que la página se queda y se reporta: no hay bucle', () => {
  const { doc, cuerpos } = documento([[h2('Programa · Licenciaturas'), p(20), p(300, 'gigante')]])
  const r = repartirPaginas(doc)

  expect(r.paginas).toBe(2)
  expect(r.rebeldes).toHaveLength(1)
  expect(r.rebeldes[0].pagina).toBe(2)
  const [, segunda] = cuerpos()
  expect(segunda.children.map(n => n.className || n.tagName)).toEqual(['cont', 'P'])
  expect(segunda.children[0].textContent).toBe('Programa · Licenciaturas (continúa)')
})

test('lo que cabe no se toca', () => {
  const { doc, cuerpos } = documento([[h2('Uno'), p(50)], [h2('Dos'), p(80)]])
  const r = repartirPaginas(doc)

  expect(r).toEqual({ paginas: 2, movidos: 0, rebeldes: [] })
  expect(cuerpos().map(c => c.children.length)).toEqual([2, 2])
})

test('un subtítulo no se queda huérfano al pie, y la página nueva lleva su rótulo', () => {
  const { doc, cuerpos } = documento([[h2('Tu plataforma'), p(40), p(30), h3('Accesos'), p(30)]])
  const r = repartirPaginas(doc)

  expect(r.paginas).toBe(2)
  expect(r.rebeldes).toEqual([])
  const [primera, segunda] = cuerpos()
  expect(primera.lastElementChild!.tagName).toBe('P')
  // Un <h3> no dice de qué sección viene la página: se rotula igual.
  expect(segunda.children.map(n => n.className || n.tagName)).toEqual(['cont', 'H3', 'P'])
})

test('una tabla de encabezado y una fila que no cabe no se parte: se reporta', () => {
  const { doc } = documento([[h2('Datos'), new Nodo('table', { clase: 'dt' })]])
  const t = doc.querySelectorAll('table.dt')[0]
  t.appendChild(new Nodo('tr', { altura: 60, texto: 'encabezado' }))
  t.appendChild(new Nodo('tr', { altura: 60, texto: 'fila 1' }))
  const r = repartirPaginas(doc)

  expect(r.paginas).toBe(1)
  expect(r.rebeldes).toHaveLength(1)
})
