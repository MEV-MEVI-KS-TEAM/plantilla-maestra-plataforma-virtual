import { test, expect } from '@playwright/test'
import { textosAcceso } from '@/lib/textos-acceso'

/**
 * Panel lateral de /login y /register (CAAIV #288). 🛑 De fábrica, los
 * literales que estaban escritos en las dos pantallas, letra por letra.
 */
const base = { oferta: 'Secundaria y Preparatoria', nombreCompleto: 'Escuela X' }

test('de fábrica (certifica, tradicional): los textos de siempre', () => {
  expect(textosAcceso({ ...base, soloCursos: false, certifica: true })).toEqual({
    beneficios: [
      'Acompañamiento para tu certificado SEP',
      'Estudia desde casa, a tu ritmo',
      'Centro de Apoyo para la Acreditación de Conocimientos',
      'Secundaria y Preparatoria',
    ],
    lemaLogin: 'Estudia desde la comodidad de tu hogar y obtén acompañamiento en tu certificación.',
    lemaRegistro: 'Únete a alumnos que han completado su trayectoria educativa con nosotros.',
    insignia: { arriba: 'CENTRO DE APOYO', abajo: 'Acreditación de Conocimientos' },
  })
})

for (const caso of [{ soloCursos: true, certifica: true }, { soloCursos: true, certifica: false }, { soloCursos: false, certifica: false }]) {
  test(`sin certificar o solo cursos (${JSON.stringify(caso)}): ni SEP, ni certificado, ni acreditación`, () => {
    const t = JSON.stringify(textosAcceso({ ...base, ...caso }))
    expect(t).not.toMatch(/SEP|certific|Acreditación/i)
    if (caso.soloCursos) expect(t).not.toMatch(/Secundaria|Preparatoria/)
    expect(textosAcceso({ ...base, ...caso }).insignia.abajo).toBe('Escuela X')
  })
}

test('las pantallas leen textosAccesoDeConfig, no listas propias', () => {
  const { readFileSync } = require('node:fs') as typeof import('node:fs')
  for (const f of ['src/app/(auth)/login/page.tsx', 'src/app/(auth)/register/page.tsx']) {
    const s = readFileSync(f, 'utf8')
    expect(s, f).toContain('textosAccesoDeConfig(')
    expect(s, f).not.toContain("'Acompañamiento para tu certificado SEP'")
  }
})
