import { test, expect } from '@playwright/test'
import {
  MENSAJE_SITE_CONFIG_SIN_MIGRAR,
  SITE_CONFIG_SIN_MIGRAR,
  esErrorTablaInexistente,
} from '@/lib/site-config-errores'

/**
 * El detector de "a este cliente le falta la migración de F1".
 *
 * Lo que decide es si la API del editor responde 503 con instrucciones o 500
 * "Error interno del servidor". Con ~144 escuelas ya desplegadas y ninguna con
 * la tabla hasta que alguien corra el SQL, este es el fallo MÁS FRECUENTE del
 * módulo — y el único que el admin puede resolver leyendo la respuesta.
 */

// ─── Los tres formatos con los que llega ─────────────────────────────────────

test('1. PostgrestError crudo con PGRST205 (la tabla no está en la caché de PostgREST)', () => {
  expect(
    esErrorTablaInexistente({
      code: 'PGRST205',
      message: "Could not find the table 'public.site_config' in the schema cache",
      details: null,
      hint: null,
    }),
  ).toBe(true)
})

test('2. PostgrestError con el código de Postgres 42P01', () => {
  expect(
    esErrorTablaInexistente({
      code: '42P01',
      message: 'relation "public.site_config" does not exist',
      details: null,
      hint: null,
    }),
  ).toBe(true)
})

test('3. Error con el mensaje ya compuesto por los helpers de las rutas', () => {
  // `leerFila` / `guardarFila` hacen `throw new Error(\`${code}: ${message}\`)`,
  // así que ESTE es el formato que llega de verdad al catch de cada handler:
  // sin `code`, todo dentro del texto.
  expect(esErrorTablaInexistente(new Error('42P01: relation "public.site_config" does not exist')))
    .toBe(true)
  expect(
    esErrorTablaInexistente(
      new Error("PGRST205: Could not find the table 'public.site_config' in the schema cache"),
    ),
  ).toBe(true)
})

test('4. sin código pero con el texto delator (por si PostgREST renombra el suyo)', () => {
  expect(esErrorTablaInexistente(new Error('sin-codigo: relation "site_config" does not exist')))
    .toBe(true)
  expect(esErrorTablaInexistente("Could not find the table 'public.site_config'")).toBe(true)
})

// ─── Lo que NO debe confundir con una migración pendiente ────────────────────

test('5. cualquier otro fallo sigue siendo un 500 opaco', () => {
  const otros: unknown[] = [
    null,
    undefined,
    '',
    42,
    {},
    { code: '23505', message: 'duplicate key value violates unique constraint' },
    { code: '42501', message: 'permission denied for table site_config' },
    new Error('fetch failed'),
    new Error('TypeError: Cannot read properties of undefined'),
  ]
  for (const e of otros) {
    expect(esErrorTablaInexistente(e), String(e)).toBe(false)
  }
})

test('6. el contrato de la respuesta 503 no se mueve sin darse cuenta', () => {
  // El editor compara este código exacto para dar la instrucción concreta
  // (src/app/(dashboard)/admin/configuracion/page.tsx) y el e2e lo asertará.
  expect(SITE_CONFIG_SIN_MIGRAR).toBe('SITE_CONFIG_SIN_MIGRAR')
  // El mensaje NOMBRA el archivo a correr: es lo único que hay que hacer.
  expect(MENSAJE_SITE_CONFIG_SIN_MIGRAR).toContain('20260908120000_site_config.sql')
})
