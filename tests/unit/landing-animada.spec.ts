import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { ratioContraste } from '@/lib/contraste'
import { resolverEstiloLanding } from '@/lib/landing-estilo'
import {
  BLANCO,
  ORDEN_SECCIONES,
  SECCIONES_OPCIONALES,
  paletaDesde,
  secuenciaSecciones,
  secuenciaValida,
  tokensDe,
  type SeccionOpcional,
  type Variante,
} from '@/components/landing/animada/tokens'

/**
 * Guardianes de la portada ANIMADA.
 *
 * Esta portada la comparten todas las escuelas nuevas, cada una con su paleta, y
 * ahí está el riesgo que vigila esta suite: un color de marca que se lee sobre
 * blanco puede ser ilegible sobre otro color de marca, o como letra sobre el
 * papel, o dentro del bloque oscuro. Ninguna de esas tres cosas se ve en un
 * build ni en una captura del cliente de turno: se ven midiendo, y con paletas
 * REALES de la flota, que es lo que hace el grupo `b`.
 *
 * Las paletas de abajo son las de clientes entregados (navy + rojo, navy + oro,
 * azul + morado, celeste, monocromática, dorada sobre negro). Si una futura
 * marca rompe un mínimo, se agrega aquí y se corrige `tokens.ts`: la portada
 * tiene que aguantar la paleta, no al revés.
 */

const RAIZ = join(__dirname, '..', '..')
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf8')
const LANDING = 'src/components/landing/animada/LandingAnimada.tsx'
const LICENCIATURAS = 'src/components/landing/animada/Licenciaturas.tsx'
const PIEZAS = 'src/components/landing/animada/piezas.tsx'
const ANIMACION = 'src/components/landing/animada/animacion.tsx'
const TEXTOS_LIC = 'src/components/landing/animada/textos-licenciatura.ts'
const CSS = 'src/app/landing-animada.css'

const VARIANTES: readonly Variante[] = ['claro', 'suave', 'oscuro']
const todas = (): Record<SeccionOpcional, boolean> =>
  Object.fromEntries(SECCIONES_OPCIONALES.map(id => [id, true])) as Record<SeccionOpcional, boolean>

/** Paletas reales de la flota, con el nombre del cliente del que salieron. */
const PALETAS: Array<{ nombre: string; colores: Record<string, string> }> = [
  { nombre: 'plantilla (azul de fábrica)', colores: { primario: '#0F172A', secundario: '#1E293B', acento: '#3B82F6', texto: '#0F172A', textoSecundario: '#525252', fondo: '#F8FAFC', borde: '#E5E7EB' } },
  { nombre: 'azul + morado', colores: { primario: '#7B2FBE', secundario: '#1A6FD4', acento: '#7B2FBE', texto: '#1E2140', textoSecundario: '#565B73', fondo: '#F4F7FD', borde: '#DDE3F0' } },
  { nombre: 'navy + rojo', colores: { primario: '#1B2F6E', secundario: '#C8102E', acento: '#1B2F6E', texto: '#1B2F6E', textoSecundario: '#525C74', fondo: '#F4F6FB', borde: '#DDE3EE' } },
  { nombre: 'navy + oro', colores: { primario: '#1B2A4A', secundario: '#D4AF37', acento: '#1B2A4A', texto: '#1B2A4A', textoSecundario: '#4A5568', fondo: '#F5F7FA', borde: '#DCE3EC' } },
  { nombre: 'celeste', colores: { primario: '#0F2440', secundario: '#8EC0E2', acento: '#0F2440', texto: '#0F2440', textoSecundario: '#4A5568', fondo: '#F2F7FB', borde: '#D9E4EF' } },
  { nombre: 'monocromática', colores: { primario: '#000000', secundario: '#333333', acento: '#000000', texto: '#000000', textoSecundario: '#5A5A5A', fondo: '#F5F5F4', borde: '#D9D9D9' } },
  { nombre: 'dorado sobre oscuro', colores: { primario: '#111111', secundario: '#C9A227', acento: '#C9A227', texto: '#111111', textoSecundario: '#5A5A5A', fondo: '#F6F5F2', borde: '#E2DFD6' } },
]

test.describe('a. la portada no trae colores ni datos de ninguna escuela', () => {
  test('a1. cero hexadecimales en los componentes: todo sale de tokens.ts', () => {
    const hex = /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|(?=[0-9]*[A-Fa-f])[0-9A-Fa-f]{3})\b/g
    for (const archivo of [LANDING, LICENCIATURAS, PIEZAS, ANIMACION, TEXTOS_LIC]) {
      expect(leer(archivo).match(hex) ?? [], archivo).toEqual([])
    }
  })

  test('a2. el CSS de la portada tampoco trae colores de marca', () => {
    const reglas = leer(CSS).replace(/\/\*[\s\S]*?\*\//g, '')
    expect(reglas.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []).toEqual([])
  })

  test('a3. ningún wa.me escrito a mano: el WhatsApp pasa por los helpers', () => {
    // Se mira el CÓDIGO, no los comentarios: la regla se explica ahí mismo.
    const sinComentarios = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    for (const archivo of [LANDING, LICENCIATURAS]) {
      expect(sinComentarios(leer(archivo)), archivo).not.toMatch(/wa\.me/)
    }
    expect(leer(LANDING)).toContain('urlWhatsAppEscuela(')
    expect(leer(LANDING)).toContain('canalEscuela(')
  })

  test('a4. nada de la portada nombra a una escuela concreta', () => {
    const fuente = [LANDING, LICENCIATURAS, PIEZAS, TEXTOS_LIC].map(leer).join('\n')
    // Los datos salen de `config`; un literal con el nombre de una escuela sería
    // el dato de OTRO cliente viajando en la plantilla (Bug 105).
    for (const vetada of [/\.online\b/, /supabase\.co/, /https:\/\/wa\.me/, /\bMEV-MEVI-KS-TEAM\b/]) {
      expect(fuente, String(vetada)).not.toMatch(vetada)
    }
  })
})

test.describe('b. CUALQUIER paleta de la flota se lee: tokens medidos', () => {
  for (const { nombre, colores } of PALETAS) {
    test(`b. ${nombre}`, () => {
      const p = paletaDesde(colores)
      for (const variante of VARIANTES) {
        const t = tokensDe(variante, p)
        // La superficie del bloque oscuro es un velo translúcido sobre su fondo.
        const superficie = t.superficie.startsWith('rgba') ? t.fondo : t.superficie
        for (const clave of ['titulo', 'texto', 'textoSuave', 'acentoTexto'] as const) {
          expect(ratioContraste(t[clave], t.fondo), `${variante}.${clave} sobre el fondo`).toBeGreaterThanOrEqual(4.5)
          expect(ratioContraste(t[clave], superficie), `${variante}.${clave} sobre la tarjeta`).toBeGreaterThanOrEqual(4.5)
        }
        expect(ratioContraste(t.btnTexto, t.btnFondo), `${variante} botón primario`).toBeGreaterThanOrEqual(4.5)
        expect(ratioContraste(t.btnTexto, t.btnHover), `${variante} botón primario en hover`).toBeGreaterThanOrEqual(4.5)
        expect(ratioContraste(t.chipTexto, t.chipFondo), `${variante} chip`).toBeGreaterThanOrEqual(4.5)
        const fondo2 = t.btn2Fondo === 'transparent' ? t.fondo : t.btn2Fondo
        expect(ratioContraste(t.btn2Texto, fondo2), `${variante} botón secundario`).toBeGreaterThanOrEqual(4.5)
        // El botón secundario se tiene que DISTINGUIR del fondo: con contorno,
        // el borde es lo único que lo dibuja.
        if (t.btn2Fondo === 'transparent') {
          expect(ratioContraste(t.btn2Borde, t.fondo), `${variante} contorno del secundario`).toBeGreaterThanOrEqual(3)
        }
      }
    })
  }

  test('b1. el bloque oscuro se lee con blanco con holgura (≥ 7) en toda paleta', () => {
    for (const { nombre, colores } of PALETAS) {
      const t = tokensDe('oscuro', paletaDesde(colores))
      expect(ratioContraste(BLANCO, t.fondo), nombre).toBeGreaterThanOrEqual(7)
    }
  })

  test('b2. DENTRO DEL BLOQUE OSCURO no entra ningún color de marca', () => {
    // La trampa que costó un combo: dos colores de marca vivos pueden dar 1.4
    // entre ellos. Por eso el botón del bloque oscuro es blanco y los realces se
    // derivan del propio fondo, nunca del acento crudo.
    for (const { nombre, colores } of PALETAS) {
      const t = tokensDe('oscuro', paletaDesde(colores))
      for (const marca of [colores.primario, colores.secundario, colores.acento]) {
        for (const clave of ['btnFondo', 'acentoTexto', 'textoSuave', 'decorativo', 'chipFondo'] as const) {
          expect(String(t[clave]).toUpperCase(), `${nombre}: oscuro.${clave}`).not.toBe(marca.toUpperCase())
        }
      }
      expect(t.btnFondo).toBe(BLANCO)
    }
  })

  test('b3. los dos CTA se distinguen entre sí', () => {
    for (const { nombre, colores } of PALETAS) {
      const t = tokensDe('claro', paletaDesde(colores))
      const fondo2 = t.btn2Fondo === 'transparent' ? t.fondo : t.btn2Fondo
      // O bien difieren en relleno, o el secundario va de contorno sobre el papel.
      const distintos = t.btn2Fondo === 'transparent' || ratioContraste(t.btnFondo, fondo2) >= 1.3
      expect(distintos, `${nombre}: los dos botones se ven iguales`).toBe(true)
    }
  })

  test('b4. ningún token de letra es negro puro, ni siquiera con paleta negra', () => {
    for (const { nombre, colores } of PALETAS) {
      for (const variante of VARIANTES) {
        const t = tokensDe(variante, paletaDesde(colores))
        // El negro puro como LETRA está vetado en la línea; el de marca puede
        // seguir siendo el fondo de un bloque.
        expect(ratioContraste(t.texto, t.fondo), `${nombre} ${variante}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  test('b5. una config vacía o rota no deja la portada sin colores', () => {
    for (const rota of [undefined, null, {}, { primario: 'no-es-un-color', acento: '' }]) {
      const p = paletaDesde(rota as never)
      const t = tokensDe('claro', p)
      expect(ratioContraste(t.texto, t.fondo)).toBeGreaterThanOrEqual(4.5)
      expect(ratioContraste(t.btnTexto, t.btnFondo)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

test.describe('c. el orden de las secciones nunca deja dos fondos iguales pegados', () => {
  test('c1. válida para TODAS las combinaciones de secciones opcionales', () => {
    const n = SECCIONES_OPCIONALES.length
    for (let mascara = 0; mascara < (1 << n); mascara++) {
      const presentes = Object.fromEntries(
        SECCIONES_OPCIONALES.map((id, i) => [id, Boolean(mascara & (1 << i))]),
      ) as Record<SeccionOpcional, boolean>
      const secuencia = secuenciaSecciones(presentes)
      expect(secuenciaValida(secuencia), `máscara ${mascara}: ${secuencia.map(s => `${s.id}:${s.variante}`).join(' ')}`).toBe(true)
    }
  })

  test('c2. hero claro, franja e indicadores oscuros, planes suave, contacto claro y pie oscuro', () => {
    for (const presentes of [todas(), {}]) {
      const s = secuenciaSecciones(presentes)
      const de = (id: string) => s.find(x => x.id === id)?.variante
      expect(de('hero')).toBe('claro')
      expect(de('franja')).toBe('oscuro')
      expect(de('niveles')).toBe('claro')
      expect(de('planes')).toBe('suave')
      expect(de('contacto')).toBe('claro')
      expect(de('pie')).toBe('oscuro')
    }
  })

  test('c3. licenciaturas va tras Planes y el CTA antes del contacto', () => {
    const orden = [...ORDEN_SECCIONES]
    expect(orden.indexOf('licenciaturas')).toBe(orden.indexOf('planes') + 1)
    expect(orden.indexOf('validez')).toBeGreaterThan(orden.indexOf('licenciaturas'))
    expect(orden.indexOf('cta')).toBeLessThan(orden.indexOf('contacto'))
  })
})

test.describe('d. el interruptor de portada', () => {
  test('d1. la plantilla nace con la portada animada', () => {
    expect((CONFIG as { estiloLanding?: string }).estiloLanding).toBe('animada')
  })

  test('d2. una escuela SIN la clave se queda con la clásica', () => {
    // Las ~144 ya entregadas no tienen `estiloLanding` en su config: redesplegar
    // no puede cambiarles la portada.
    expect(resolverEstiloLanding(undefined)).toBe('clasica')
    expect(resolverEstiloLanding(null)).toBe('clasica')
    expect(resolverEstiloLanding('')).toBe('clasica')
    expect(resolverEstiloLanding('clasica')).toBe('clasica')
    expect(resolverEstiloLanding('Animada')).toBe('clasica')
    expect(resolverEstiloLanding('animada')).toBe('animada')
  })

  test('d3. `page.tsx` sirve las dos y les pasa lo mismo', () => {
    const page = leer('src/app/page.tsx')
    expect(page).toContain('landingAnimadaActiva()')
    expect(page).toContain('<LandingAnimada')
    expect(page).toContain('<LandingClient')
    // La portada clásica se conserva intacta.
    expect(leer('src/components/landing/LandingClient.tsx').length).toBeGreaterThan(1000)
  })

  test('d4. las tipografías de la portada animada solo se cuelgan con ella encendida', () => {
    const layout = leer('src/app/layout.tsx')
    expect(layout).toContain('landingAnimadaActiva()')
    expect(layout).toContain('Playfair_Display')
    expect(layout).toContain('Manrope')
    // Y el CSS lleva respaldo dentro del var(), así que sin las variables no
    // queda ninguna declaración inválida.
    expect(leer(CSS)).toContain('var(--font-body, system-ui)')
  })
})

test.describe('e. el movimiento es honesto', () => {
  test('e1. se apaga con prefers-reduced-motion', () => {
    const css = leer(CSS)
    const bloque = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(bloque.length).toBeGreaterThan(200)
    expect(bloque).toContain('animation: none !important')
    for (const clase of ['.la-arco', '.la-circulo', '.la-tarjeta-hero', '.la-halo', '.la-aro', '.la-entrada']) {
      expect(bloque, `${clase} sigue animándose`).toContain(clase)
    }
  })

  test('e2. nada depende del JavaScript para verse', () => {
    // El revelado se enciende DESPUÉS de marcar como visible lo que ya está en
    // pantalla: sin JS el HTML del servidor se ve completo.
    const css = leer(CSS)
    expect(css).toContain('.la-anim [data-la-reveal]')
    expect(leer(ANIMACION)).toContain('useRevelado')
  })
})
