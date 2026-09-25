import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  TEXTO_SIN_PRECIO, lineaPrecio, precioCatalogo, precioCursoNumerico, precioPublico, resolverPrecioOferta,
} from '@/lib/cursos/precio-curso'
import * as catalogo from '@/lib/cursos/catalogo'

/**
 * Bloque C · C2: el precio de un curso sale de UNA regla (precio-curso.ts) en
 * todas las superficies, y el registro anuncia el de la ficha del curso
 * (/admin/cursos/[id]) en vez del número fijo de config.ts.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

test('1. la regla numérica: mensualidad gana, solo inscripción = pago único, nada = informes', () => {
  expect(precioCursoNumerico({ precio_inscripcion: 2490, precio_mensualidad: 0 })).toEqual({ tipo: 'unico', monto: 2490 })
  expect(precioCursoNumerico({ precio_inscripcion: 1500, precio_mensualidad: 900 })).toEqual({ tipo: 'mensual', mensualidad: 900, inscripcion: 1500 })
  expect(precioCursoNumerico({ precio_inscripcion: 0, precio_mensualidad: 700 })).toEqual({ tipo: 'mensual', mensualidad: 700, inscripcion: null })
  for (const c of [{ precio_inscripcion: 0, precio_mensualidad: 0 }, { precio_inscripcion: null, precio_mensualidad: null }, {}, { precio_inscripcion: -5, precio_mensualidad: -1 }]) {
    expect(precioCursoNumerico(c), JSON.stringify(c)).toEqual({ tipo: 'informes' })
  }
})

test('2. precioCatalogo es la regla numérica formateada, y catalogo.ts re-exporta lo mismo', () => {
  const casos = [[2490, 0], [1500, 900], [0, 700], [0, 0], [-5, 0]] as const
  for (const [i, m] of casos) {
    const n = precioCursoNumerico({ precio_inscripcion: i, precio_mensualidad: m })
    const f = precioCatalogo({ precio_inscripcion: i, precio_mensualidad: m })
    expect(f.tipo).toBe(n.tipo)
    if (n.tipo === 'unico' && f.tipo === 'unico') expect(f.monto).toBe(precioPublico(n.monto))
    if (n.tipo === 'mensual' && f.tipo === 'mensual') {
      expect(f.mensualidad).toBe(precioPublico(n.mensualidad))
      expect(f.inscripcion).toBe(n.inscripcion === null ? null : precioPublico(n.inscripcion))
    }
  }
  // Los imports de siempre (portadas, /diplomados, la ficha) siguen valiendo.
  expect(catalogo.precioCatalogo).toBe(precioCatalogo)
  expect(catalogo.precioPublico).toBe(precioPublico)
  expect(catalogo.TEXTO_SIN_PRECIO).toBe(TEXTO_SIN_PRECIO)
})

test('3. lineaPrecio: una sola forma de decirlo (portada animada y registro)', () => {
  expect(lineaPrecio(precioCatalogo({ precio_inscripcion: 2490, precio_mensualidad: 0 }))).toBe(`${precioPublico(2490)} · pago único`)
  expect(lineaPrecio(precioCatalogo({ precio_inscripcion: 0, precio_mensualidad: 900 }))).toBe(`${precioPublico(900)} al mes`)
  expect(lineaPrecio(precioCatalogo({ precio_inscripcion: 0, precio_mensualidad: 0 }))).toBe('Pide informes')
})

test('4. resolverPrecioOferta: la ficha manda; config.ts es el respaldo; el paquete es de config', () => {
  const uno = (precio: number) => ({ cursoIds: ['c1'], precio, esPaquete: false })
  const tabla = (i: number, m: number) => new Map([['c1', { precio_inscripcion: i, precio_mensualidad: m }]])
  // La ficha con precio manda aunque config.ts diga otra cosa.
  expect(resolverPrecioOferta(uno(1450), tabla(2490, 0))).toEqual({ tipo: 'unico', monto: 2490, fuente: 'tabla' })
  expect(resolverPrecioOferta(uno(1450), tabla(1500, 900))).toEqual({ tipo: 'mensual', mensualidad: 900, inscripcion: 1500, fuente: 'tabla' })
  // Ficha en 0/0 → respaldo de config.ts; sin respaldo → informes (nunca «$0»).
  expect(resolverPrecioOferta(uno(1450), tabla(0, 0))).toEqual({ tipo: 'unico', monto: 1450, fuente: 'config' })
  expect(resolverPrecioOferta(uno(0), tabla(0, 0))).toEqual({ tipo: 'informes' })
  expect(resolverPrecioOferta(uno(0), tabla(-3, -1))).toEqual({ tipo: 'informes' })
  // Sin catálogo (falló) o el curso no está publicado → respaldo.
  expect(resolverPrecioOferta(uno(1450), null)).toEqual({ tipo: 'unico', monto: 1450, fuente: 'config' })
  expect(resolverPrecioOferta(uno(1450), new Map())).toEqual({ tipo: 'unico', monto: 1450, fuente: 'config' })
  // Paquete: la ficha no tiene precio de paquete; manda precioPaquete, o informes.
  const paquete = (precio: number) => ({ cursoIds: ['c1', 'c2'], precio, esPaquete: true })
  const ambas = new Map([['c1', { precio_inscripcion: 2490, precio_mensualidad: 0 }], ['c2', { precio_inscripcion: 2490, precio_mensualidad: 0 }]])
  expect(resolverPrecioOferta(paquete(6900), ambas)).toEqual({ tipo: 'unico', monto: 6900, fuente: 'config' })
  expect(resolverPrecioOferta(paquete(0), ambas)).toEqual({ tipo: 'informes' })
  // Varios cursos que NO son paquete: no hay una ficha que mande (falla cerrado a config.ts).
  expect(resolverPrecioOferta({ cursoIds: ['c1', 'c2'], precio: 3000, esPaquete: false }, ambas)).toEqual({ tipo: 'unico', monto: 3000, fuente: 'config' })
})

test('5. /api/catalogo-publico entrega el precio con lista explícita, nunca `...c`', () => {
  const src = sinComentarios(leer('src/app/api/catalogo-publico/route.ts'))
  expect(src).toContain("export const dynamic = 'force-dynamic'")
  expect(src).not.toMatch(/\.\.\.c\b/)
  const mapa = /catalogo\.map\(c => \(\{([\s\S]*?)\}\)\)/.exec(src)?.[1] ?? ''
  const campos = mapa.split(',').map(s => s.trim().split(':')[0]).filter(Boolean)
  expect(campos).toEqual(['id', 'nombre', 'tipo', 'precio_inscripcion', 'precio_mensualidad'])
})

test('6. el registro anuncia el precio de la ficha: bajo «¿Cuál?» y en las ofertas de cursos de ingreso', () => {
  const src = sinComentarios(leer('src/app/(auth)/register/page.tsx'))
  // Módulo puro: el registro es 'use client' y catalogo.ts trae el cliente admin.
  expect(src).toContain("from '@/lib/cursos/precio-curso'")
  expect(src).not.toContain("from '@/lib/cursos/catalogo'")
  // Bajo el select del curso, con la misma línea que la portada.
  expect(src).toContain('lineaPrecio(precioElegido)')
  // Las ofertas: el precio espera al catálogo y sale del resolver; ya no de o.precio a secas.
  expect(src).toContain('{catalogoListo && <PrecioDeOferta p={resolverPrecioOferta(o, preciosPublicados)} />}')
  expect(src).toContain('.finally(() => { if (vivo) setCatalogoListo(true) })')
  expect(src).not.toMatch(/formatearMoneda\(o\.precio/)
  // «Pago único» ya no se afirma de todas las ofertas en el texto general.
  expect(src).not.toMatch(/Pago único, independiente del plan/)
})

test('7. la portada clásica usa la regla única: sin precio dice «Pide informes»', () => {
  const src = sinComentarios(leer('src/components/landing/LandingClient.tsx'))
  expect(src).toContain("from '@/lib/cursos/precio-curso'")
  expect(src).not.toContain("from '@/lib/cursos/catalogo'")
  expect(src).toContain('const precio = precioCatalogo(curso)')
  expect(src).toContain('{TEXTO_SIN_PRECIO}')
  expect(src).toContain('<PrecioTarjetaClasica curso={c} color={C.navy} />')
  expect(src).not.toMatch(/precioPublico\(c\.precio_/)
})

test('8. /diplomados rotula el pago único; la ficha pide informes de «el curso» cuando es curso', () => {
  const indice = sinComentarios(leer('src/app/diplomados/page.tsx'))
  expect(indice).toMatch(/p\.tipo === 'unico'[\s\S]{0,200}· pago único/)
  const ficha = sinComentarios(leer('src/app/diplomados/[id]/page.tsx'))
  expect(ficha).toContain('canalDiplomado(cfg, curso.nombre, curso.tipo)')
  expect(catalogo.mensajeDiplomado('EXANI-II', 'curso')).toBe('Hola, me interesa el curso "EXANI-II". ¿Me dan informes?')
  expect(catalogo.mensajeDiplomado('Criminología', 'diplomado')).toBe('Hola, me interesa el diplomado "Criminología". ¿Me dan informes?')
  expect(catalogo.mensajeDiplomado('Sin tipo')).toContain('el diplomado')
  const animada = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(animada).toContain('lineaPrecio(precioCatalogo(c))')
})
