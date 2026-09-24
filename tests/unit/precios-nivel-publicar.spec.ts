import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { esSoloCursos } from '@/lib/modo'
import { mergeSiteConfig, type SiteConfigOverrides } from '@/lib/site-config-core'
import { validarOverrides } from '@/lib/site-config-validacion'
import { etiquetaNivel } from '@/lib/niveles-ui'
import { pasoAlPublicar, prepararParaPublicar, preciosPorNivelVisibles } from '@/lib/site-config-editor'
import { ROJO, estiloBorde } from '@/components/admin/personalizar/Comunes'

/**
 * F2-9, verificación M0 y M6 en base desechable (23-sep-2026). Tres defectos
 * que el guion vio a mano y que ninguna prueba cubría:
 *
 *  - M6 a/b: «Publicar cambios» abría «Vas a cambiar precios» ANTES de validar;
 *    el admin tenía que confirmar para enterarse de que el borrador no se podía
 *    publicar. Ahora `pasoAlPublicar` valida primero (grupo `a`).
 *  - M6 a: el campo señalado por un error se veía AZUL mientras tenía el foco,
 *    porque el foco se pintaba escribiendo en el DOM. Ahora `estiloBorde` hace
 *    que el rojo gane (grupo `b`).
 *  - M0: a 1366 px el marcador «Vacío: usa la general, $2,000» se cortaba en un
 *    input de 224 px (grupo `c`).
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const PAGINA = 'src/app/(dashboard)/admin/configuracion/page.tsx'
const CAMPOS = 'src/components/admin/personalizar/CampoTexto.tsx'

// La misma base que el servidor (`DEFAULTS()` de la API) y que la página.
const BASE = () => mergeSiteConfig(CONFIG, {})
const planDe = (meses: number) =>
  BASE().modalidades.find((m) => m.meses === meses && !(m as { nivel?: string }).nivel && m.activa)
const escalon = (nivel: string, vCorto: number, vLargo: number) =>
  `La mensualidad de ${etiquetaNivel(nivel)} a 3 meses (${vCorto}) no puede ser menor que la de 6 meses (${vLargo}): el plan corto no puede costar menos al mes.`

// Fábrica: dos planes mensuales sin nivel (3 y 6 meses) y los dos niveles.
const conPorNivel = () => preciosPorNivelVisibles() && !esSoloCursos() && Boolean(planDe(3) && planDe(6))

/** Lo que validaría el servidor con ese borrador, para comparar el veredicto exacto. */
const servidor = (b: SiteConfigOverrides) => validarOverrides(prepararParaPublicar(b), BASE())

test.describe('a) «Publicar cambios» valida ANTES de abrir el modal (M6 a/b)', () => {
  test('a1. escalón por nivel: error con el texto y la clave del servidor, y el modal NO se abre', () => {
    test.skip(!conPorNivel(), 'la plantilla de fábrica vende 3 y 6 meses a los dos niveles')
    const seis = planDe(6)!.mensualidad
    const borrador: SiteConfigOverrides = { precios: { mensualidadSecundaria3Meses: seis - 100 } }
    const paso = pasoAlPublicar({}, borrador, BASE())
    expect(paso).toEqual({ paso: 'error', error: escalon('secundaria', seis - 100, seis), clave: 'precios.mensualidadSecundaria3Meses' })
    // Mismo veredicto que el servidor, palabra por palabra.
    const s = servidor(borrador)
    expect(s.ok).toBe(false)
    if (!s.ok) expect(paso).toEqual({ paso: 'error', error: s.error, clave: s.clave })
  })

  test('a2. escalón en la «Mensualidad general»: también error antes del modal', () => {
    test.skip(!conPorNivel(), 'la plantilla de fábrica vende 3 y 6 meses a los dos niveles')
    const tres = planDe(3)!, seis = planDe(6)!.mensualidad
    const borrador: SiteConfigOverrides = { modalidades: { [tres.id]: { mensualidad: seis - 100 } } }
    const paso = pasoAlPublicar({}, borrador, BASE())
    expect(paso.paso).toBe('error')
    if (paso.paso === 'error') expect(paso.error.startsWith(escalon('secundaria', seis - 100, seis).split(':')[0])).toBe(true)
    const s = servidor(borrador)
    expect(s.ok).toBe(false)
    if (!s.ok) expect(paso).toEqual({ paso: 'error', error: s.error, clave: s.clave })
  })

  test('a3. fuera de rango y cambio que NO es de precio: error igual, nunca «publicar»', () => {
    const cero: SiteConfigOverrides = { precios: { inscripcionPreparatoria: 0 } }
    expect(pasoAlPublicar({}, cero, BASE()).paso).toBe('error')
    // Un texto de más: no toca precios, así que sin la validación previa se
    // publicaría directo; debe quedarse en error igual.
    const largo: SiteConfigOverrides = { landing: { hero_titulo: 'x'.repeat(5000) } }
    expect(servidor(largo).ok).toBe(false)
    expect(pasoAlPublicar({}, largo, BASE()).paso).toBe('error')
  })

  test('a4. borrador válido: con precio se abre el modal; sin precio se publica directo', () => {
    test.skip(!conPorNivel(), 'la plantilla de fábrica vende los dos niveles')
    expect(pasoAlPublicar({}, { precios: { inscripcionSecundaria: 1000 } }, BASE())).toEqual({ paso: 'modal' })
    expect(pasoAlPublicar({}, { landing: { hero_titulo: 'Hola' } }, BASE())).toEqual({ paso: 'publicar' })
    // Nada que cambie respecto a lo publicado: tampoco hay modal.
    const publicado: SiteConfigOverrides = { precios: { inscripcionSecundaria: 1000 } }
    expect(pasoAlPublicar(publicado, { precios: { inscripcionSecundaria: 1000 } }, BASE())).toEqual({ paso: 'publicar' })
  })

  test('a5. valida el cuerpo del PUT, no el borrador crudo (logo y whatsappUrl no cuentan)', () => {
    test.skip(!conPorNivel(), 'la plantilla de fábrica vende los dos niveles')
    // El borrador trae las claves que `sincronizarLogos` copia de la fila: el
    // PUT no las manda, así que no pueden bloquear la publicación.
    const borrador = { logo: '/logo.png', whatsappUrl: 'https://wa.me/5215555555555', precios: { inscripcionSecundaria: 1000 } } as SiteConfigOverrides
    expect(validarOverrides(borrador, BASE()).ok).toBe(false) // crudo, el validador lo rechaza
    expect(pasoAlPublicar({}, borrador, BASE())).toEqual({ paso: 'modal' })
  })

  test('a6. la página decide con `pasoAlPublicar` contra la base COMPLETA, y el modal va después', () => {
    const src = leer(PAGINA)
    const i = src.indexOf('function alPulsarPublicar()')
    expect(i).toBeGreaterThan(-1)
    const cuerpo = src.slice(i, src.indexOf('\n  }\n', i))
    const decide = cuerpo.indexOf('pasoAlPublicar(overridesBase, overrides, mergeSiteConfig(CONFIG, {}))')
    const abre = cuerpo.indexOf("setModal('precios')")
    expect(decide).toBeGreaterThan(-1)
    expect(abre).toBeGreaterThan(decide)
    // El error se enseña como los del servidor: toast y campo señalado.
    expect(cuerpo).toContain('showToast(paso.error')
    expect(cuerpo).toContain('irAlCampo(paso.clave)')
    // Ya no queda otro camino al modal que se salte la validación.
    expect(src).not.toMatch(/hayCambiosDePrecio\(/)
    expect(src.match(/setModal\('precios'\)/g)).toHaveLength(1)
  })
})

test.describe('b) con error, el campo es ROJO aunque tenga el foco (M6 a)', () => {
  test('b1. `estiloBorde`: el error gana al foco; sin error, el foco azul de siempre', () => {
    expect(estiloBorde(true, true).border).toBe(`1px solid ${ROJO}`)
    expect(estiloBorde(true, false)).toEqual({ border: `1px solid ${ROJO}` })
    expect(estiloBorde(false, true).border).toBe('1px solid rgba(21,101,192,0.6)')
    expect(estiloBorde(false, false)).toEqual({})
  })

  // Leído del fuente: el runner de estas pruebas compila el JSX de los
  // componentes a su propio formato y no se pueden renderizar aquí.
  test('b2. CampoEntero y CampoPrecioNivel toman el borde de `estiloBorde`, no del DOM', () => {
    const src = leer(CAMPOS)
    for (const [desde, hasta] of [
      ['export function CampoEntero(', 'export interface CampoPrecioNivelProps'],
      ['export function CampoPrecioNivel(', 'export interface CampoDecimalProps'],
    ]) {
      const cuerpo = src.slice(src.indexOf(desde), src.indexOf(hasta))
      expect(cuerpo).toContain('estiloBorde(resaltado || invalido, enfocado)')
      expect(cuerpo).not.toContain('focoHandlers(')
      expect(cuerpo).not.toContain('style.border')
    }
  })
})

test.describe('c) el marcador del campo por nivel se lee completo (M0)', () => {
  test('c1. el campo ocupa el renglón hasta 320 px y la cifra verde baja si no cabe', () => {
    const src = leer(CAMPOS)
    const cuerpo = src.slice(src.indexOf('export function CampoPrecioNivel('), src.indexOf('export interface CampoDecimalProps'))
    // 224 px (w-56) cortaba «Vacío: usa la general, $2,000» (215 px de texto
    // en 198 útiles). 320 px deja 294 útiles: cabe el más largo de la flota
    // («Vacío: usa el de fábrica, $1,500», Moreta) con holgura.
    expect(cuerpo).toContain('className="w-full max-w-xs px-3')
    expect(cuerpo).toContain('className="flex flex-wrap items-center gap-x-3 gap-y-1.5"')
    expect(cuerpo).not.toContain('w-56')
  })
})
