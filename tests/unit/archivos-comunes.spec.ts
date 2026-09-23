import { test, expect } from '@playwright/test'
import { slugDeNombre, sanitizeFilename } from '@/lib/archivos-comunes'

/**
 * `slugDeNombre` — el nombre de la escuela dentro de un nombre de archivo.
 *
 * Lo estrena el Excel de Reportes (`api/admin/reportes/excel`), que antes
 * armaba su slug con un `replace(/[^a-z0-9]+/g, '-')` a pelo. Ese regex NO
 * convierte la «í» en «i»: la BORRA, y el reporte de «Aula Raíz» (#208) se
 * descargaba como `reportes-aula-ra-z-2026-09-15.xlsx`. El cliente lo ve cada
 * vez que baja su reporte, y la mitad de las escuelas de la flota llevan tilde
 * en el nombre.
 *
 * La clave es normalizar a NFD y quitar los diacríticos ANTES de limpiar.
 */

test('las tildes se convierten en su letra, no se borran', () => {
  expect(slugDeNombre('Aula Raíz')).toBe('aula-raiz')
  expect(slugDeNombre('Instituto Educativo Ángel')).toBe('instituto-educativo-angel')
  expect(slugDeNombre('Colegio Ávila Camacho')).toBe('colegio-avila-camacho')
})

test('la ñ y la diéresis tampoco desaparecen', () => {
  // La ñ descompone en n + tilde combinante: sin NFD se perdía entera.
  expect(slugDeNombre('Niños Héroes')).toBe('ninos-heroes')
  expect(slugDeNombre('Pingüino')).toBe('pinguino')
})

test('lo demás se comporta como un slug de nombre de archivo', () => {
  expect(slugDeNombre('  MEV  ')).toBe('mev')
  expect(slugDeNombre('C.E.C.Y.T.E. #14')).toBe('c-e-c-y-t-e-14')
  expect(slugDeNombre('Guion—raya y  espacios')).toBe('guion-raya-y-espacios')
})

test('un nombre que se queda sin nada usable no produce un slug vacío', () => {
  // Sin el `|| 'escuela'`, el archivo saldría como `reportes--2026-09-15.xlsx`.
  expect(slugDeNombre('###')).toBe('escuela')
  expect(slugDeNombre('')).toBe('escuela')
  expect(slugDeNombre('   ')).toBe('escuela')
})

test('sanitizeFilename sigue intacto: este cambio no lo toca', () => {
  // El helper que ya existía se usa para los archivos que SUBE el alumno, y
  // ahí el criterio es otro: conserva el punto de la extensión.
  expect(sanitizeFilename('acta de nacimiento.pdf')).toBe('acta-de-nacimiento.pdf')
  expect(sanitizeFilename('Constancia Raíz.pdf')).toBe('constancia-raiz.pdf')
})
