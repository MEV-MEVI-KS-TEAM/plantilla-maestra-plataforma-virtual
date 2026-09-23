import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig, type SiteConfigOverrides } from '@/lib/site-config-core'
import { parseDecimal, validarOverrides } from '@/lib/site-config-validacion'
import { campoPorClave } from '@/lib/site-config-campos'
import { escribirModalidad, escribirRuta, hayCambioDeTipoCambio, hayCambiosDePrecio, hayCambiosDePreciosOPlanes } from '@/lib/site-config-editor'
import {
  AYUDA_CUOTA_SEMANAL,
  NOTA_PRECIOS,
  SUBTITULO_EDITOR,
  TEXTO_CONFIRMA_RESTAURAR,
  TEXTO_CONFIRMA_SOLO_TIPO_CAMBIO,
  TITULO_CONFIRMA_PRECIOS,
  TITULO_CONFIRMA_TIPO_CAMBIO,
  confirmacionDePrecios,
  textoConfirmaPrecios,
} from '@/lib/site-config-textos'

/**
 * F2-3 — el editor no promete lo que la plataforma no hace.
 *
 * Los textos de "Personalizar mi página" decían que un precio publicado se
 * actualiza "al instante" "en el registro" y "en los montos sugeridos", y que
 * cada alumno semanal "conserva la cuota con la que se inscribió". Ninguna de
 * las cuatro cosas es cierta: la página tarda unos segundos, el registro no
 * pinta precios de Secundaria/Preparatoria, el monto de cada pago se captura a
 * mano y "Regenerar" en Cobranza rehace las semanas pendientes y vencidas con
 * la cuota vigente.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')

const MENSUAL = textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false })
const SEMANAL = textoConfirmaPrecios({ semanal: true, cambiaTipoCambio: false })
const TODOS = [
  MENSUAL,
  SEMANAL,
  textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: true }),
  textoConfirmaPrecios({ semanal: true, cambiaTipoCambio: true }),
  TEXTO_CONFIRMA_RESTAURAR,
  AYUDA_CUOTA_SEMANAL,
  NOTA_PRECIOS,
  SUBTITULO_EDITOR,
]

// ─── 1. Los textos ───────────────────────────────────────────────────────────

test('1. el modal mensual dice que los pagos ya registrados no cambian', () => {
  expect(MENSUAL).toContain('Los pagos que ya registraste no cambian')
  expect(MENSUAL).toContain('en unos segundos')
  expect(MENSUAL.endsWith('¿Publicar?')).toBe(true)
})

test('2. el modal semanal nombra las semanas pendientes y vencidas, y Cobranza', () => {
  expect(SEMANAL).toContain('pendientes y vencidas')
  expect(SEMANAL).toContain('Cobranza')
  expect(SEMANAL.endsWith('¿Publicar?')).toBe(true)
  expect(AYUDA_CUOTA_SEMANAL).toContain('pendientes y vencidas')
  expect(AYUDA_CUOTA_SEMANAL).toContain('Cobranza')
})

test('3. el tipo de cambio se menciona solo cuando cambió', () => {
  for (const semanal of [false, true]) {
    const sin = textoConfirmaPrecios({ semanal, cambiaTipoCambio: false })
    const con = textoConfirmaPrecios({ semanal, cambiaTipoCambio: true })
    expect(sin).not.toContain('tipo de cambio')
    expect(con).toContain('El tipo de cambio nuevo solo cambia la equivalencia en pesos')
    expect(con.endsWith('¿Publicar?')).toBe(true)
  }
})

test('4. ningún texto promete lo que la plataforma no hace', () => {
  for (const t of TODOS) {
    expect(t).not.toContain('al instante')
    expect(t).not.toContain('montos sugeridos')
    expect(t).not.toContain('conserva la cuota con la que se inscribió')
    expect(t).not.toContain('diseño de la plantilla')
  }
  // Restaurar vuelve al config.ts DE LA ESCUELA, y dice qué revierte.
  expect(TEXTO_CONFIRMA_RESTAURAR).toContain('precios, planes apagados y tipo de cambio')
  expect(TEXTO_CONFIRMA_RESTAURAR).toContain('volverán a como se entregaron')
  expect(TEXTO_CONFIRMA_RESTAURAR.endsWith('¿Continuar?')).toBe(true)
})

// ─── 2. Las pantallas usan esta fuente, no copias ────────────────────────────

test('5. el editor, la pestaña Precios, el catálogo y la e2e leen los textos de aquí', () => {
  const pagina = leer('src/app/(dashboard)/admin/configuracion/page.tsx')
  expect(pagina).toContain('confirmacionDePrecios(')
  expect(pagina).toContain('TEXTO_CONFIRMA_RESTAURAR')
  expect(pagina).toContain('{SUBTITULO_EDITOR}')
  expect(pagina).not.toContain('montos sugeridos')
  expect(pagina).not.toContain('al instante')

  const pestana = leer('src/components/admin/personalizar/PestanaPrecios.tsx')
  expect(pestana).toContain('{AYUDA_CUOTA_SEMANAL}')
  expect(pestana).toContain('{NOTA_PRECIOS}')
  expect(pestana).not.toContain('montos sugeridos')
  expect(pestana).not.toContain('conserva la cuota con la que se')

  expect(leer('src/lib/site-config-campos.ts')).not.toContain('NO altera los calendarios')

  // La e2e compara el modal contra la misma función (se edita, no se corre aquí).
  const e2e = leer('e2e/personalizar-editor.spec.ts')
  expect(e2e).toContain("from '@/lib/site-config-textos'")
  expect(e2e).not.toContain('montos sugeridos del sistema. ¿Confirmar?')
})

test('6. PestanaPrecios: tipo de cambio solo fuera de MXN; cursos solo con permiso', () => {
  const pestana = leer('src/components/admin/personalizar/PestanaPrecios.tsx')
  /** El bloque JSX `{condicion && ( … )}`: desde la condición hasta su `)}`. */
  const bloque = (condicion: string) => {
    const i = pestana.indexOf(`{${condicion} && (`)
    expect(i, `falta el bloque {${condicion} && (…)}`).toBeGreaterThan(-1)
    return pestana.slice(i, pestana.indexOf('\n      )}', i))
  }
  expect(bloque("CONFIG.moneda !== 'MXN'")).toContain('{campoTipoCambio()}')
  const cursos = bloque('puedeEditar')
  expect(cursos).toContain('href="/admin/cursos"')
  // Otra pestaña: el borrador del editor no sobrevive a una navegación interna.
  expect(cursos).toContain('target="_blank"')
  expect(cursos).toContain("esSoloCursos() ? 'Ir a Diplomados' : 'Ir a Gestionar cursos'")
  // Y fuera de esos bloques no hay otra copia que se salte la condición.
  expect(pestana.split('{campoTipoCambio()}').length - 1).toBe(1)
  expect(pestana.split('href="/admin/cursos"').length - 1).toBe(1)
})

// ─── 3. El tipo de cambio: se lee igual en el editor y en el servidor ────────

test('7. parseDecimal acepta coma decimal y rechaza lo que no es número', () => {
  expect(parseDecimal('16,90')).toBe(16.9)
  expect(parseDecimal('16.90')).toBe(16.9)
  expect(parseDecimal(' 17 ')).toBe(17)
  expect(parseDecimal(16.9)).toBe(16.9)
  expect(parseDecimal('abc')).toBeNull()
  expect(parseDecimal(Number.NaN)).toBeNull()
  expect(parseDecimal(Number.POSITIVE_INFINITY)).toBeNull()
  expect(parseDecimal(true)).toBeNull()
  // Vacío = 0 = "no mostrar equivalencia", igual que antes de extraerla.
  expect(parseDecimal('')).toBe(0)
})

test('8. parseDecimal y el validador del servidor dicen lo mismo', () => {
  // El CampoDecimal propaga solo lo que parseDecimal lee dentro del rango; el
  // servidor tiene que aceptar exactamente eso (y redondea a 4 decimales).
  const campoMin = campoPorClave('tipoCambioMXN')!.min!
  const campoMax = campoPorClave('tipoCambioMXN')!.max!
  for (const entrada of ['16,90', '16.90', ' 18,5 ', '0', '', '1000', '1000,01', '-1', 'abc', '1e3', '16,9050']) {
    const leido = parseDecimal(entrada)
    const r = validarOverrides({ tipoCambioMXN: entrada }, mergeSiteConfig(CONFIG, {}))
    const aceptaEditor = leido !== null && leido >= campoMin && leido <= campoMax
    expect(r.ok, `"${entrada}"`).toBe(aceptaEditor)
    if (r.ok && leido !== null) {
      expect((r.overrides as { tipoCambioMXN?: number }).tipoCambioMXN).toBe(Math.round(leido * 10000) / 10000)
    }
  }
})

test('9. un cambio de tipo de cambio pide confirmación solo si la escuela no cobra en pesos', () => {
  const antes: SiteConfigOverrides = {}
  const despues = escribirRuta(antes, 'tipoCambioMXN', 18.25)
  expect(hayCambioDeTipoCambio(antes, despues)).toBe(true)
  expect(hayCambiosDePrecio(antes, despues, 'USD')).toBe(true)
  expect(hayCambiosDePrecio(antes, despues, 'MXN')).toBe(false)
  // Lo de siempre sigue igual: un texto no pide confirmación; un precio, sí.
  expect(hayCambiosDePrecio(antes, escribirRuta(antes, 'landing.hero_titulo', 'Otro'), 'USD')).toBe(false)
  expect(hayCambiosDePrecio(antes, escribirRuta(antes, 'precios.inscripcion', 799), 'MXN')).toBe(true)
})

// ─── 4. Fase 2, F2-5: lo que ve el alumno inscrito y el modal del tipo de cambio ──

test('10. cuota semanal: el alumno inscrito la ve como referencia en «Mis pagos», sus semanas no cambian', () => {
  // Verificado en el código: /api/alumno/pagos toma `cuota` y `total_plan` del
  // plan PUBLICADO (resumen «N cuotas de $X» / «plan de $total»), y cada semana
  // de la tabla trae su `monto` congelado hasta que se regenera el calendario.
  for (const t of [SEMANAL, AYUDA_CUOTA_SEMANAL]) {
    expect(t).toContain('«Mis pagos»')
    expect(t).toContain('como referencia')
    expect(t).toMatch(/conservan su monto hasta que regeneres su calendario/)
  }
  // Una escuela mensual no tiene «Mis pagos»: su texto no lo menciona.
  expect(MENSUAL).not.toContain('Mis pagos')
})

test('11. si lo único que cambia es el tipo de cambio, el modal no habla de precios ni de cuotas', () => {
  for (const semanal of [false, true]) {
    const solo = confirmacionDePrecios({ semanal, cambiaPrecios: false, cambiaTipoCambio: true })
    expect(solo.titulo).toBe(TITULO_CONFIRMA_TIPO_CAMBIO)
    expect(solo.titulo).toBe('Vas a cambiar el tipo de cambio')
    expect(solo.mensaje).toBe(TEXTO_CONFIRMA_SOLO_TIPO_CAMBIO)
    expect(solo.mensaje).toContain('equivalencia en pesos')
    expect(solo.mensaje).not.toMatch(/precio|cuota|plan/i)

    // Con precios (con o sin tipo de cambio), el modal de siempre.
    for (const cambiaTipoCambio of [false, true]) {
      const conPrecios = confirmacionDePrecios({ semanal, cambiaPrecios: true, cambiaTipoCambio })
      expect(conPrecios.titulo).toBe(TITULO_CONFIRMA_PRECIOS)
      expect(conPrecios.titulo).toBe('Vas a cambiar precios')
      expect(conPrecios.mensaje).toBe(textoConfirmaPrecios({ semanal, cambiaTipoCambio }))
    }
  }
})

test('12. hayCambiosDePreciosOPlanes separa precios y planes del tipo de cambio', () => {
  const antes: SiteConfigOverrides = {}
  expect(hayCambiosDePreciosOPlanes(antes, escribirRuta(antes, 'tipoCambioMXN', 18.25))).toBe(false)
  expect(hayCambiosDePreciosOPlanes(antes, escribirRuta(antes, 'precios.inscripcion', 799))).toBe(true)
  expect(hayCambiosDePreciosOPlanes(antes, escribirRuta(antes, 'precios.inscripcionSecundaria', 900))).toBe(true)
  expect(hayCambiosDePreciosOPlanes(antes, escribirModalidad(antes, '3_meses', { activa: false }))).toBe(true)
  // La página arma el modal con esto: título y texto salen de la misma fuente.
  const pagina = leer('src/app/(dashboard)/admin/configuracion/page.tsx')
  expect(pagina).toContain('cambiaPrecios: hayCambiosDePreciosOPlanes(overridesBase, overrides)')
  expect(pagina).not.toContain('titulo="Vas a cambiar precios"')
})
