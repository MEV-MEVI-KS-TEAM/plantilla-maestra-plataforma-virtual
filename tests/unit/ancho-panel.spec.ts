import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guardián del bug de ancho del panel (DIDAKTO #278, 14-oct-2026).
 *
 * `dashboard-layout.tsx` pinta `<main className="flex-1 …">` a todo el ancho; una
 * página que limita su contenedor con `max-w-*` SIN `mx-auto` queda pegada a la
 * izquierda y en pantallas anchas sobra una franja vacía a la derecha (a 1920 px,
 * 521–657 px). Listas y tableros van `w-full max-w-7xl mx-auto`; lectura y
 * formularios conservan su ancho, centrados.
 */
function recorrer(dir: string, alArchivo: (ruta: string, txt: string) => void) {
  for (const f of readdirSync(dir)) {
    const ruta = join(dir, f)
    if (statSync(ruta).isDirectory()) recorrer(ruta, alArchivo)
    else if (/\.tsx$/.test(f)) alArchivo(ruta, readFileSync(ruta, 'utf8'))
  }
}

test('ningún contenedor max-w-* de (dashboard) queda sin mx-auto', () => {
  const malos: string[] = []
  recorrer(join('src', 'app', '(dashboard)'), (ruta, txt) => {
    for (const m of txt.matchAll(/className="([^"]*\bmax-w-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl)\b[^"]*)"/g)) {
      if (!/\bmx-auto\b/.test(m[1])) malos.push(`${ruta}: ${m[1]}`)
    }
  })
  expect(malos).toEqual([])
})

test('red de seguridad: html y body recortan el desborde horizontal con clip (no hidden)', () => {
  const css = readFileSync(join('src', 'app', 'globals.css'), 'utf8')
  expect(css).toMatch(/html,\s*body\s*\{[^}]*overflow-x:\s*clip/)
})
