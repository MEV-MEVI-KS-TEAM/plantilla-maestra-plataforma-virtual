/**
 * Acento del PANEL (admin, secretario y alumno), distinto del de la portada.
 * Llave OPCIONAL `CONFIG.coloresPanel`.
 *
 * Por qué existe: el acento de la portada es el color con el que la marca
 * VENDE, y en el panel ese mismo color puede chocar con los colores de estado.
 * En CAAIV #288 el amarillo de marca (#FCCC60) queda a 1.04 del ámbar de
 * «Pendiente»: un botón de marca se leía como un aviso. Con `coloresPanel` el
 * panel usa otro acento (el navy) y la portada sigue con el suyo.
 *
 * ⚠️ SIN LA LLAVE NO SE DEVUELVE NADA (`{}`): las variables del panel son las
 * de siempre, las que inyecta src/app/layout.tsx desde `colores`.
 * Los tres derivados se calculan igual que en src/app/layout.tsx.
 */
import { CONFIG } from '@/lib/config'
import { colorLegibleSobre, oscurecerHasta } from '@/lib/contraste'

export type ColoresPanel = {
  acento: string
  acentoHover: string
  textoSobreAcento: string
  acentoClaro: string
}

const esHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v.trim())

/**
 * Los fondos OSCUROS fijos que todavía usan pantallas del panel (tablas,
 * tarjetas y modales heredados del tema oscuro). Encima pintan letra
 * `var(--color-acento)`: con el azul de fábrica se lee, con un acento de panel
 * oscuro (el navy de CAAIV) queda a ~1.2:1. Dentro de ellos, globals.css
 * cambia el acento por `--color-acento-en-oscuro` y la letra de los botones por
 * `--color-texto-sobre-acento-en-oscuro` (regla `.panel-acento-propio`).
 *
 * ⚠️ Si aparece otro fondo oscuro fijo en el panel, agrégalo aquí Y en
 * globals.css: lo vigila tests/unit/landing-estructura.spec.ts (grupo 5).
 */
export const FONDOS_OSCUROS_PANEL = [
  '#0B0D11', '#0D1017', '#12161F', '#141824', '#181C26', '#1A1F2E',
  '#1E2230', '#1E2330', '#1E2430', '#1E2535', '#2A2F3E',
] as const

/** El más claro de la lista: si la letra cumple ahí, cumple en todos. */
const OSCURO_MAS_CLARO = '#2A2F3E'

/** Clase que lleva el contenedor del panel cuando hay `coloresPanel`. */
export const CLASE_PANEL_ACENTO_PROPIO = 'panel-acento-propio'

/** Las variables CSS que el contenedor del panel sobrescribe. `{}` sin la llave. */
export function variablesPanel(
  panel: Partial<ColoresPanel> | null | undefined,
  superficie: string,
): Record<string, string> {
  if (!panel || !esHex(panel.acento)) return {}
  const acento = panel.acento.trim()
  const profundo = oscurecerHasta(acento, '#FFFFFF', 7)
  const vars: Record<string, string> = {
    '--color-acento': acento,
    '--color-acento-texto': colorLegibleSobre(acento, superficie, 4.5),
    '--color-acento-profundo': profundo,
    '--color-acento-sobre-oscuro': colorLegibleSobre(acento, profundo, 4.5),
    // Dentro de los fondos oscuros fijos (FONDOS_OSCUROS_PANEL).
    '--color-acento-en-oscuro': colorLegibleSobre(acento, OSCURO_MAS_CLARO, 4.5),
    '--color-texto-sobre-acento-en-oscuro': acento,
  }
  if (esHex(panel.acentoHover)) vars['--color-acento-hover'] = panel.acentoHover.trim()
  if (esHex(panel.textoSobreAcento)) vars['--color-texto-sobre-acento'] = panel.textoSobreAcento.trim()
  if (esHex(panel.acentoClaro)) {
    vars['--color-acento-claro'] = panel.acentoClaro.trim()
    vars['--color-fondo-alt'] = panel.acentoClaro.trim()
  }
  return vars
}

/** `variablesPanel` con el `CONFIG` del cliente. */
export function variablesPanelDeConfig(): Record<string, string> {
  const panel = (CONFIG as { coloresPanel?: Partial<ColoresPanel> }).coloresPanel
  return variablesPanel(panel, CONFIG.colores.superficie)
}

/**
 * El acento que leen como HEX (no como variable CSS) los componentes del panel
 * que lo pasan por `colorLegibleSobre` (aula del curso, roadmap de lecciones).
 * Con `coloresPanel`, el del panel; sin la llave, `colores.acento` / `acentoHover`
 * de siempre.
 */
export function acentoDelPanel(): { acento: string; acentoHover: string } {
  const panel = (CONFIG as { coloresPanel?: Partial<ColoresPanel> }).coloresPanel
  const c = CONFIG.colores as { acento: string; acentoHover?: string }
  if (panel && esHex(panel.acento)) {
    return { acento: panel.acento.trim(), acentoHover: esHex(panel.acentoHover) ? panel.acentoHover.trim() : panel.acento.trim() }
  }
  return { acento: c.acento, acentoHover: c.acentoHover ?? c.acento }
}
