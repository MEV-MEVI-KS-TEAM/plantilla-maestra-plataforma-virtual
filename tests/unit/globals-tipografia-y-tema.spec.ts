import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guardianes de `src/app/globals.css` — la tipografía de la app y el tema.
 *
 * Los dos defectos que vigilan estas pruebas se le escaparon a un build verde, a
 * la suite entera y a las capturas del cliente, porque ninguno de los tres mira
 * qué fuente se PINTA ni qué pasa con el sistema en oscuro:
 *
 *   P-9  `body { font-family: Arial, Helvetica, sans-serif }` pisaba a next/font.
 *        El layout declaraba la variable, el navegador descargaba el .woff… y la
 *        página se pintaba en Arial. Una tipografía completa bajada en cada visita
 *        y sin usar, en TODA la flota. La portada no lo delataba porque se aplica
 *        sus familias por className en el JSX; lo que iba en Arial era el panel,
 *        el dashboard del alumno, las pantallas de acceso, la constancia y los
 *        recibos.
 *
 *   P-6  un `prefers-color-scheme: dark` que repintaba SOLO `--background` y
 *        `--foreground`. Esas dos las lee únicamente `body`; las ~30 pantallas de
 *        panel y dashboard leen `--color-superficie` / `--color-texto`. Con el
 *        sistema en oscuro salía el papel negro y las tarjetas blancas con letra
 *        negra encima.
 *
 * Se lee el CSS como texto a propósito: es el mismo archivo que se sirve, y así
 * la prueba corre sin navegador, igual que `landing-animada.spec.ts` con el JSX.
 */

const raiz = process.cwd()
/**
 * Sin comentarios. Estos dos CSS documentan el defecto CITANDO la regla vieja
 * («decía `font-family: Arial, Helvetica, sans-serif` y pisaba a next/font»), y
 * un parser ingenuo lee la cita como si fuera una declaración de verdad.
 */
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')

const CSS = sinComentarios(readFileSync(join(raiz, 'src', 'app', 'globals.css'), 'utf8'))
const LAYOUT = readFileSync(join(raiz, 'src', 'app', 'layout.tsx'), 'utf8')
const CSS_LANDING = sinComentarios(readFileSync(join(raiz, 'src', 'app', 'landing-animada.css'), 'utf8'))

/** El cuerpo de la primera regla cuyo selector sea exactamente `sel`. */
function reglaDe(sel: string): string {
  const re = new RegExp(`(^|\\})\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm')
  const m = CSS.match(re)
  expect(m, `no encuentro la regla \`${sel}\` en globals.css`).toBeTruthy()
  return m![2]
}

// ─── P-9 · la tipografía que el layout descarga es la que se pinta ──────────

test('P-9. `body` NO fija Arial: consume la variable de next/font', () => {
  const body = reglaDe('body')
  const familia = body.match(/font-family\s*:\s*([^;]+);/)
  expect(familia, '`body` sin font-family: la app heredaría la del navegador').toBeTruthy()

  const valor = familia![1].trim()
  // El defecto exacto: Arial como PRIMERA familia. Como respaldo dentro del
  // `var()` es correcto y deseable — es lo que se pinta en el primer frame.
  expect(valor, `body font-family = "${valor}"`).not.toMatch(/^\s*Arial\b/i)
  expect(valor).toContain('var(--font-body-stack)')
})

test('P-9. los h1-h6 también salen de la variable, y no de cada componente', () => {
  // La regla va en globals.css y no por componente PORQUE así la heredan las
  // ~30 rutas de panel y dashboard, cuyos h1-h6 son de Tailwind y no llevan
  // ninguna className de fuente.
  const titulos = reglaDe('h1, h2, h3, h4, h5, h6')
  expect(titulos).toContain('var(--font-heading-stack)')
})

test('P-9. los dos stacks se declaran DONDE la variable de next/font existe', () => {
  // Una custom property se SUSTITUYE en el elemento que la declara, no donde se
  // usa. `--font-geist-sans` la cuelga next/font de la className del <body>, así
  // que un `--font-body-stack: var(--font-geist-sans), …` puesto en `:root`
  // (= <html>) queda *guaranteed-invalid* y hereda vacío: el `font-family` se
  // invalida y el cuerpo cae en la fuente por defecto del navegador. Se ve en el
  // build, no en el código, así que se vigila desde aquí.
  const body = reglaDe('body')
  for (const stack of ['--font-body-stack', '--font-heading-stack']) {
    expect(body, `${stack} tiene que declararse dentro de la regla \`body\``)
      .toContain(`${stack}:`)
  }
})

test('P-9. los stacks apuntan a una variable que el layout DECLARA de verdad', () => {
  for (const stack of ['--font-body-stack', '--font-heading-stack']) {
    const decl = CSS.match(new RegExp(`${stack}\\s*:\\s*([^;]+);`))
    expect(decl, `${stack} no está declarada en globals.css`).toBeTruthy()

    const valor = decl![1]
    // Tiene que apoyarse en una variable de next/font…
    const refs = [...valor.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map(m => m[1])
    expect(refs.length, `${stack} = "${valor}" no referencia ninguna variable`).toBeGreaterThan(0)

    // …y esa variable la tiene que declarar de verdad el layout, o el `var()`
    // cae siempre al respaldo y volvemos a pintar en Arial sin que nada avise.
    for (const ref of refs) {
      expect(LAYOUT, `layout.tsx no declara ${ref}, que usa ${stack}`)
        .toContain(`variable: "${ref}"`)
    }

    // …y con un respaldo real detrás, para el primer frame del render de
    // servidor, antes de que la clase del <body> aterrice.
    expect(valor, `${stack} sin familia de respaldo`).toMatch(/,\s*[\w"' -]+/)
    expect(valor).toMatch(/sans-serif|serif|monospace/)
  }
})

test('P-9. landing-animada.css NO viste la app entera: sus fuentes van acotadas', () => {
  // Este archivo lo importa layout.tsx SIEMPRE y DESPUÉS de globals.css, así que
  // una regla suya sin ámbito gana por orden de importación y se lleva por
  // delante la tipografía de la app: con la portada encendida los h1-h3 del
  // panel salían en Playfair Display, y con la clásica —sin las variables
  // colgadas— en el respaldo, Georgia. Su propia cabecera promete que «todo
  // cuelga de .la-landing»; esto lo exige.
  const reglas = [...CSS_LANDING.matchAll(/(^|\})\s*([^{}@]+)\{([^}]*)\}/g)]
  let revisadas = 0
  for (const [, , selector, cuerpo] of reglas) {
    if (!/font-family\s*:/.test(cuerpo)) continue
    const sel = selector.trim()
    revisadas++
    // El ámbito de este archivo es el prefijo `.la-`: o la raíz de la portada
    // (`.la-landing`, también vía `:has()`) o una de sus piezas (`.la-faq__boton`).
    // Lo que no puede haber es un selector de ELEMENTO pelado — `body`, `h1, h2,
    // h3 —, que se aplica a la plataforma entera.
    expect(sel, `la regla \`${sel}\` de landing-animada.css fija font-family sin acotar a la portada`)
      .toMatch(/\.la-/)
  }
  // Si un refactor renombra las clases y el bucle deja de mirar nada, esto avisa.
  expect(revisadas, 'ninguna regla con font-family: ¿cambió el formato del archivo?')
    .toBeGreaterThan(0)
})

test('P-9. la variable de la app NO es la de display de la portada animada', () => {
  // `--font-heading` / `--font-body` son Playfair y Manrope, y layout.tsx solo
  // las cuelga del <body> cuando la portada animada está encendida. Usarlas aquí
  // pondría Playfair Display en cada h1-h6 del panel, y en una escuela con la
  // portada clásica no existirían: el `var()` caería al respaldo.
  for (const stack of ['--font-body-stack', '--font-heading-stack']) {
    const valor = CSS.match(new RegExp(`${stack}\\s*:\\s*([^;]+);`))![1]
    expect(valor, `${stack} usa una variable de la portada animada`)
      .not.toMatch(/var\(\s*--font-(heading|body)\s*\)/)
  }
})

// ─── P-6 · medio tema oscuro es peor que ninguno ───────────────────────────

test('P-6. no hay un `prefers-color-scheme: dark` que repinte solo el papel', () => {
  const bloques = [...CSS.matchAll(/@media\s*\([^)]*prefers-color-scheme\s*:\s*dark[^)]*\)\s*\{/g)]
  if (bloques.length === 0) return   // el estado correcto hoy: no hay tema oscuro

  // Si algún día se declara, tiene que ser un tema COMPLETO. Las ~30 pantallas
  // de panel y dashboard no leen --background/--foreground: leen estas.
  const DEBEN_REPINTARSE = [
    '--color-superficie', '--color-texto', '--color-fondo',
    '--color-borde', '--color-texto-secundario',
  ]
  for (const b of bloques) {
    // Se recorta desde la apertura del @media hasta equilibrar las llaves.
    let i = b.index! + b[0].length, nivel = 1
    while (i < CSS.length && nivel > 0) {
      if (CSS[i] === '{') nivel++
      else if (CSS[i] === '}') nivel--
      i++
    }
    const cuerpo = CSS.slice(b.index!, i)
    for (const v of DEBEN_REPINTARSE) {
      expect(cuerpo, `el bloque dark no repinta ${v}: sería medio tema (Bug P-6)`)
        .toContain(v)
    }
  }
})
