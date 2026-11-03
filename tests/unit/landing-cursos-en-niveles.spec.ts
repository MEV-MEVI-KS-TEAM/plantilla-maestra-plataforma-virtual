import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Regla MEV (3-nov-2026): si la escuela tiene cursos o diplomados, en la
 * portada van DENTRO de la sección de niveles, justo después de sus niveles
 * (Secundaria, Preparatoria, licenciaturas…), NUNCA en una sección aparte.
 * Vale para las dos portadas, la animada y la clásica.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')

const PORTADAS = [
  { archivo: 'src/components/landing/animada/LandingAnimada.tsx', inicioNiveles: '<section id="niveles"', siguiente: '<section id="planes"' },
  { archivo: 'src/components/landing/LandingClient.tsx', inicioNiveles: '{/* ── PRECIOS ──', siguiente: '{/* ── VALIDEZ OFICIAL' },
]

for (const { archivo, inicioNiveles, siguiente } of PORTADAS) {
  test(`${archivo}: los cursos viven dentro de la sección de niveles, después de los niveles`, () => {
    const src = leer(archivo)
    expect(src, 'sin sección de cursos suelta').not.toMatch(/<section[^>]*id="diplomados"/)
    const ini = src.indexOf(inicioNiveles)
    const fin = src.indexOf(siguiente, ini)
    const cursos = src.indexOf('id="diplomados"')
    expect(ini).toBeGreaterThan(-1)
    expect(fin).toBeGreaterThan(ini)
    expect(cursos, 'el bloque #diplomados va dentro de la sección de niveles').toBeGreaterThan(ini)
    expect(cursos).toBeLessThan(fin)
  })
}

test('portada animada: el menú lleva «Cursos» justo después de «Niveles»', () => {
  const src = leer('src/components/landing/animada/LandingAnimada.tsx')
  expect(src).toMatch(/etiqueta: 'Niveles' \},\n\s*\.\.\.\(hayCatalogo \? \[\{ href: '#diplomados', etiqueta: 'Cursos' \}\] : \[\]\),\n\s*\{ href: '#planes'/)
})
