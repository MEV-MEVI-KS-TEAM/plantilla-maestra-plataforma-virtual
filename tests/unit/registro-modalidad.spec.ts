import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { modalidadDeRegistro } from '@/lib/registro-reglas'

/**
 * #212 — el registro público con «Curso o diplomado» (o solo con un curso de
 * ingreso) no se podía completar:
 *  - el formulario exigía «Selecciona la modalidad.» aunque un curso no tiene;
 *  - y mandaba `modalidad: ''`, que el servidor guardaba tal cual y
 *    `alumnos_modalidad_check` rechazaba → 500 con la cuenta de Auth ya creada.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

// Los ids que admite alumnos_modalidad_check (migraciones 20260812 y 20260925).
const IDS_CHECK = ['3_meses', '6_meses', '6_meses_lic', '9_meses', '12_meses', '18_meses', '24_meses', '36_meses']
const pasaCheck = (m: string | null) => m === null || IDS_CHECK.includes(m)

test('lo que manda el formulario nunca rompe el CHECK de alumnos', () => {
  for (const nivel of ['secundaria', 'preparatoria', 'licenciatura', 'diplomado', null]) {
    for (const pedida of ['', '   ', null, undefined, 0, {}, '3_meses', '6_meses_lic']) {
      const m = modalidadDeRegistro(nivel, pedida, null)
      expect(pasaCheck(m), `${nivel} + ${JSON.stringify(pedida)} → ${m}`).toBe(true)
    }
  }
})

test('un curso no lleva modalidad: nivel diplomado o nivel forzado → null', () => {
  expect(modalidadDeRegistro('diplomado', '3_meses', null)).toBeNull()
  expect(modalidadDeRegistro('diplomado', '', null)).toBeNull()
  // solo_cursos (B7): el servidor fuerza el nivel y anula la modalidad, venga lo que venga.
  expect(modalidadDeRegistro('diplomado', '6_meses', 'diplomado')).toBeNull()
  expect(modalidadDeRegistro('preparatoria', '6_meses', 'diplomado')).toBeNull()
})

test('Sec/Prepa/Lic conservan la modalidad elegida; vacía → null', () => {
  expect(modalidadDeRegistro('secundaria', '3_meses', null)).toBe('3_meses')
  expect(modalidadDeRegistro('licenciatura', '6_meses_lic', null)).toBe('6_meses_lic')
  expect(modalidadDeRegistro('preparatoria', ' 6_meses ', null)).toBe('6_meses')
  // Solo el curso de ingreso, sin plan: nivel null y modalidad '' → null.
  expect(modalidadDeRegistro(null, '', null)).toBeNull()
})

test('el formulario no pide modalidad a un curso y nunca manda ""', () => {
  const src = sinComentarios(leer('src/app/(auth)/register/page.tsx'))
  expect(src).toContain("if (!soloCursos && nivel && !esDiplomado && !modalidad) { setError('Selecciona la modalidad.')")
  expect(src).toContain('modalidad: esDiplomado ? null : (modalidad || null),')
  // La vieja regla, sin la excepción del curso, no vuelve.
  expect(src).not.toContain('if (!soloCursos && nivel && !modalidad)')
})

test('el servidor usa la regla y no guarda body.modalidad crudo', () => {
  const src = sinComentarios(leer('src/app/api/auth/register-complete/route.ts'))
  expect(src).toContain('modalidadDeRegistro(nivel, body.modalidad, nivelForzado)')
  expect(src).not.toMatch(/body\.modalidad\s*\?\?/)
})
