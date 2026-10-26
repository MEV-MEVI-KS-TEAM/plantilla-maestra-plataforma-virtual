import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AA_MINIMO, colorLegibleSobre, ratioContraste } from '@/lib/contraste'

// Bug 291: la ficha pública (/diplomados/[id]) pinta una tarjeta BLANCA fija y la
// caja de precio en `fondo`, con la letra de la paleta tal cual. Con una paleta
// oscura editada desde «Personalizar mi página» la descripción quedaba en 1.1:1.
const FUENTE = readFileSync(join(process.cwd(), 'src/app/diplomados/[id]/page.tsx'), 'utf8')

const OSCURA = { primario: '#3F2E06', texto: '#F5F1E6', textoSecundario: '#B3AC9C', fondo: '#0B0B0F' }
const CLARA = { primario: '#1A5FA8', texto: '#1F2937', textoSecundario: '#4B5563', fondo: '#F7F8FA' }

test.describe('Bug 291 · ficha del diplomado legible con cualquier paleta', () => {
  test('la letra sale de --ficha-* (ajustada por superficie), no de la paleta cruda', () => {
    expect(FUENTE).not.toMatch(/color: 'var\(--color-(primario|texto|texto-secundario)\)'/)
    expect(FUENTE).toContain("letraSobre('#FFFFFF')")
    expect(FUENTE).toContain('letraSobre(fondo)')
  })

  test('paleta oscura: todo cumple AA sobre la tarjeta blanca y sobre el fondo', () => {
    for (const sup of ['#FFFFFF', OSCURA.fondo]) {
      for (const c of [OSCURA.primario, OSCURA.texto, OSCURA.textoSecundario]) {
        expect(ratioContraste(colorLegibleSobre(c, sup), sup)).toBeGreaterThanOrEqual(AA_MINIMO)
      }
    }
  })

  test('paleta clara: sobre la tarjeta blanca no cambia nada', () => {
    for (const c of [CLARA.primario, CLARA.texto, CLARA.textoSecundario]) {
      expect(colorLegibleSobre(c, '#FFFFFF')).toBe(c)
    }
  })
})
