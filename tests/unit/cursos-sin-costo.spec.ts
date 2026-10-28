import { test, expect } from '@playwright/test'
import { TEXTO_SIN_COSTO, TEXTO_SIN_PRECIO, textoSinPrecioDe } from '../../src/lib/cursos/precio-regla'

// Un curso en 0/0 solo dice «Sin costo» si su id está en CONFIG.cursosSinCosto;
// sin la lista (el caso de la flota) sigue siendo «Pide informes».
test('cursosSinCosto: solo los ids declarados dicen «Sin costo»', () => {
  expect(textoSinPrecioDe('a', ['a'])).toBe(TEXTO_SIN_COSTO)
  expect(textoSinPrecioDe('b', ['a'])).toBe(TEXTO_SIN_PRECIO)
  expect(textoSinPrecioDe('a', undefined)).toBe(TEXTO_SIN_PRECIO)
  expect(textoSinPrecioDe(undefined, ['a'])).toBe(TEXTO_SIN_PRECIO)
  expect(textoSinPrecioDe('', [''])).toBe(TEXTO_SIN_PRECIO)
})
