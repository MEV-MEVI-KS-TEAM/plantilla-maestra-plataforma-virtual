import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TEXTO_SIN_PRECIO, precioCatalogo, precioPublico } from '@/lib/cursos/catalogo'

/**
 * A4 · «Un curso sin precio no se anuncia gratis».
 *
 * La tabla `cursos` guarda `DEFAULT 0` en los dos precios y los bancos siembran
 * el curso PUBLICADO sin precio. La portada animada lo anunciaba «Sin costo» y
 * `/diplomados` ponía «$0». No existe un campo explícito de «gratis»: con los
 * dos precios en 0 el catálogo dice «Pide informes».
 */

const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')
const sinComentarios = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\w])\/\/.*$/gm, '$1')

test.describe('precioCatalogo', () => {
  test('los dos precios en 0 (o sin capturar) → «Pide informes», nunca gratis', () => {
    expect(precioCatalogo({ precio_inscripcion: 0, precio_mensualidad: 0 })).toEqual({ tipo: 'informes' })
    expect(precioCatalogo({ precio_inscripcion: null, precio_mensualidad: null })).toEqual({ tipo: 'informes' })
    expect(precioCatalogo({ precio_inscripcion: -5, precio_mensualidad: 0 })).toEqual({ tipo: 'informes' })
    expect(TEXTO_SIN_PRECIO).toBe('Pide informes')
  })

  test('con mensualidad: mensual (y la inscripción si la hay)', () => {
    expect(precioCatalogo({ precio_inscripcion: 1500, precio_mensualidad: 900 })).toEqual({
      tipo: 'mensual', mensualidad: precioPublico(900), inscripcion: precioPublico(1500),
    })
    expect(precioCatalogo({ precio_inscripcion: 0, precio_mensualidad: 700 })).toEqual({
      tipo: 'mensual', mensualidad: precioPublico(700), inscripcion: null,
    })
  })

  test('solo inscripción: pago único', () => {
    expect(precioCatalogo({ precio_inscripcion: 2500, precio_mensualidad: 0 })).toEqual({ tipo: 'unico', monto: precioPublico(2500) })
  })
})

test.describe('guardianes: nadie anuncia un curso sin precio como gratis', () => {
  test('la portada animada no tiene «Sin costo» y usa precioCatalogo', () => {
    const src = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
    expect(src).not.toContain("'Sin costo'")
    expect(src).toContain('precioCatalogo(')
  })

  test('/diplomados y la ficha del curso usan precioCatalogo (sin «$0»)', () => {
    const indice = sinComentarios(leer('src/app/diplomados/page.tsx'))
    expect(indice).toContain('precioCatalogo(')
    expect(indice).not.toMatch(/precioPublico\(c\.precio_inscripcion\)/)
    const ficha = sinComentarios(leer('src/app/diplomados/[id]/page.tsx'))
    expect(ficha).toContain("precioCatalogo(curso).tipo === 'informes'")
    expect(ficha).toContain('TEXTO_SIN_PRECIO')
  })

  test('cambiar un precio purga también el ÍNDICE /diplomados', () => {
    const purga = sinComentarios(leer('src/lib/cursos/purga.ts'))
    expect(purga).toContain("revalidatePath('/diplomados')")
  })

  test('el formulario del curso no promete un «monto propuesto» que no existe', () => {
    const form = leer('src/components/admin/cursos/CursoDatosForm.tsx')
    expect(form).not.toContain('se propone al registrar el pago')
  })
})
