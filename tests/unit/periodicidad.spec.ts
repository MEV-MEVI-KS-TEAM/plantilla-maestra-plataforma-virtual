import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  esSemanal,
  destinoSiEsRutaDePagoAjena,
  etiquetaCuota,
  unidadCuota,
  descripcionPlazos,
  RUTA_PAGOS_ALUMNO_SEMANAL,
  RUTA_PAGOS_ALUMNO_MENSUAL,
  RUTA_COBRANZA_ADMIN,
} from '@/lib/periodicidad'
import { subtotalCuotas, getTotalPlan, type ModalidadPrograma } from '@/lib/modalidades'
import { formatoMXN, formatoPrecio, formatoMonto } from '@/lib/formato'
import { validarOverrides, recortarAEditables, recortarOverrides } from '@/lib/site-config-validacion'
import { mergeSiteConfig } from '@/lib/site-config-core'
import { ES_PLANTILLA } from './es-plantilla'

/**
 * PERIODICIDAD DE COBRO — semanal / mensual.
 *
 * El invariante que protegen estas pruebas: con la periodicidad en 'mensual'
 * (el default, y el estado de los ~144 clientes) NADA cambia. Ni una ruta, ni
 * una cifra, ni una etiqueta.
 *
 * La conducta SEMANAL se prueba con datos construidos aquí, no encendiendo el
 * flag: `esSemanal()` lee `CONFIG` en cada llamada, y mutarlo lo dejaría
 * mutado para el resto del archivo contaminando las demás pruebas. Es la misma
 * nota que dejó `modo-b7.spec.ts`.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const MIGRACION = 'supabase/migrations/20260910130000_periodicidad_semanal.sql'

/**
 * La config ENSANCHADA, que es lo que espera el validador. `CONFIG` lleva
 * `as const` y sus arreglos son `readonly`: pasarlo tal cual no compila.
 * Mismo recurso que `BASE()` en site-config-validacion.spec.ts.
 */
const BASE = () => mergeSiteConfig(CONFIG, {})

/** Un plan MENSUAL: la forma de las ~144 escuelas. */
const MENSUAL: ModalidadPrograma = {
  id: '6_meses', label: '6 Meses', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true,
}

/** Un plan SEMANAL, con la forma de CAU #200: 24 × $350. */
const SEMANAL: ModalidadPrograma = {
  id: '6_meses', label: '6 Meses', meses: 6, mensualidad: 0, materiasPorMes: 2, activa: true,
  semanas: 24, cuotaSemanal: 350,
}

// ─── 1. El default no mueve nada ─────────────────────────────────────────────

test('1. la periodicidad viene en mensual por default', () => {
  // GUARDIÁN del config de FÁBRICA (ver tests/unit/es-plantilla.ts): si esto
  // cambiara en la plantilla, se les movería el módulo de pagos a ~144 escuelas
  // al actualizar. En el clon de una escuela semanal no significa nada — su
  // config dice 'semanal' con toda la razón — así que ahí no corre.
  //
  // ⚠️ Aceptar los dos valores, que era la versión anterior, no protegía NADA:
  // la aserción pasaba con cualquier config posible.
  if (!ES_PLANTILLA) test.skip()
  expect(CONFIG.periodicidad).toBe('mensual')
})

// Las tres de abajo describen la conducta de una escuela MENSUAL y se saltan
// en un clon semanal: no es un guardián de fábrica, es que ahí la premisa no
// existe. Lo que vale en los dos escenarios son las pruebas 2-8, que pasan los
// datos como parámetro en vez de leerlos de CONFIG.
test('1b. con periodicidad mensual, esSemanal() es falso', () => {
  if (CONFIG.periodicidad !== 'mensual') test.skip()
  expect(esSemanal()).toBe(false)
})

test('1c. en una escuela mensual, la ruta de pago de siempre NO se redirige', () => {
  if (CONFIG.periodicidad !== 'mensual') test.skip()
  expect(destinoSiEsRutaDePagoAjena(RUTA_PAGOS_ALUMNO_MENSUAL)).toBeNull()
  expect(destinoSiEsRutaDePagoAjena('/alumno/pagar/confirmar')).toBeNull()
  // Y ninguna otra ruta de la app se toca.
  for (const r of ['/alumno', '/alumno/materias', '/admin', '/admin/pagos', '/admin/estado-cuenta']) {
    expect(destinoSiEsRutaDePagoAjena(r)).toBeNull()
  }
})

test('1d. en una escuela mensual, las rutas semanales mandan a la equivalente', () => {
  if (CONFIG.periodicidad !== 'mensual') test.skip()
  // No se manda al dashboard: quien abrió un enlace de "mis pagos" quiere ver
  // sus pagos, y aquí viven en otra ruta.
  expect(destinoSiEsRutaDePagoAjena(RUTA_PAGOS_ALUMNO_SEMANAL)).toBe(RUTA_PAGOS_ALUMNO_MENSUAL)
  expect(destinoSiEsRutaDePagoAjena(RUTA_COBRANZA_ADMIN)).toBe('/admin/estado-cuenta')
})

test('1e. el destino de un redirect nunca es la ruta que se está redirigiendo', () => {
  // Cinturón contra ERR_TOO_MANY_REDIRECTS: si una regla futura devolviera la
  // misma ruta, el navegador cortaría el bucle y el alumno vería un error.
  for (const r of [RUTA_PAGOS_ALUMNO_SEMANAL, RUTA_PAGOS_ALUMNO_MENSUAL, RUTA_COBRANZA_ADMIN]) {
    expect(destinoSiEsRutaDePagoAjena(r)).not.toBe(r)
  }
})

test('1f. las rutas de las dos periodicidades son distintas entre sí', () => {
  const rutas = [RUTA_PAGOS_ALUMNO_SEMANAL, RUTA_PAGOS_ALUMNO_MENSUAL, RUTA_COBRANZA_ADMIN]
  expect(new Set(rutas).size).toBe(rutas.length)
})

// ─── 2. Lo que suma un plan ──────────────────────────────────────────────────

test('2. un plan mensual suma meses × mensualidad, como siempre', () => {
  expect(subtotalCuotas(MENSUAL)).toBe(6000)
  expect(getTotalPlan(MENSUAL, 599)).toBe(6599)
})

test('2b. un plan semanal suma semanas × cuota', () => {
  // 24 × 350 = 8,400. Si se tratara como mensualidad daría 0 (o meses × cuota
  // = 2,100): una CUARTA parte de lo que la escuela vendió.
  expect(subtotalCuotas(SEMANAL)).toBe(8400)
  expect(getTotalPlan(SEMANAL, 1000)).toBe(9400)
})

test('2c. meses × cuota NO es la fórmula, y por eso semanas es un dato', () => {
  // RHEMA vende 3 meses en 13 semanas y CAU los vende en 12. Derivar `meses × 4`
  // le cobraría a uno de los dos una semana de más por plan.
  const rhema: ModalidadPrograma = { ...SEMANAL, meses: 3, semanas: 13, cuotaSemanal: 470 }
  const cau:   ModalidadPrograma = { ...SEMANAL, meses: 3, semanas: 12, cuotaSemanal: 250 }
  expect(subtotalCuotas(rhema)).toBe(6110)
  expect(subtotalCuotas(cau)).toBe(3000)
  expect(rhema.semanas).not.toBe(cau.semanas)
})

test('2d. sin plan devuelve 0 en vez de reventar', () => {
  expect(subtotalCuotas(undefined)).toBe(0)
})

test('2e. un plan a medio declarar cae a la fórmula mensual, no a cero', () => {
  // Semanas sin cuota (o al revés) es config incompleta. Cobrar 0 sería peor
  // que cobrar lo del plan mensual declarado.
  const aMedias: ModalidadPrograma = { ...MENSUAL, semanas: 24 }
  expect(subtotalCuotas(aMedias)).toBe(6000)
})

// ─── 3. Precio vs monto — la lección de RHEMA ────────────────────────────────

test('3. un PRECIO de 0 es "Gratis"; un MONTO de 0 es una cifra', () => {
  // En RHEMA un helper único imprimió «Pagado: Incluido de $6,500» en la
  // pantalla de un alumno que no había pagado nada.
  expect(formatoPrecio(0)).toBe('Gratis')
  expect(formatoMXN(0)).toContain('0')
  expect(formatoMXN(0)).not.toBe('Gratis')
})

test('3b. el texto del cero lo decide quien llama, no el helper', () => {
  expect(formatoMonto(0, 'Aún sin pagos')).toBe('Aún sin pagos')
  expect(formatoMonto(0, 'Al corriente')).toBe('Al corriente')
  expect(formatoMonto(0)).toBe(formatoMXN(0))
  expect(formatoMonto(250, 'Aún sin pagos')).toBe(formatoMXN(250))
})

// ─── 4. Vocabulario ──────────────────────────────────────────────────────────

test('4. en una escuela mensual el vocabulario es el de siempre', () => {
  if (CONFIG.periodicidad !== 'mensual') test.skip()
  expect(etiquetaCuota()).toBe('Mensualidad')
  expect(unidadCuota()).toBe('/mes')
  expect(descripcionPlazos(6)).toBe('6 mensualidades')
  expect(descripcionPlazos(1)).toBe('1 mensualidad')
})

// ─── 5. El panel puede editar la cuota semanal ───────────────────────────────

test('5. la validación acepta una cuota semanal válida', () => {
  const r = validarOverrides(
    { modalidades: { [CONFIG.modalidades[0].id]: { cuotaSemanal: 350 } } },
    BASE(),
  )
  expect(r.ok).toBeTruthy()
})

test('5b. rechaza una cuota semanal fuera de rango, con su propio tope', () => {
  // 🛑 El tope de la MENSUALIDAD (50,000) aplicado a una cuota semanal deja
  // pasar cifras que solo pueden ser un error de tecleo — y se multiplican por
  // 24 semanas antes de que nadie lo note.
  const r = validarOverrides(
    { modalidades: { [CONFIG.modalidades[0].id]: { cuotaSemanal: 40000 } } },
    BASE(),
  )
  expect(r.ok).toBeFalsy()
})

test('5c. `semanas` NO es editable desde el panel', () => {
  // Es estructura del plan, igual que `meses`: cambiarla descuadraría los
  // calendarios ya generados sin que el admin lo pida.
  const r = validarOverrides(
    { modalidades: { [CONFIG.modalidades[0].id]: { semanas: 30 } } },
    BASE(),
  )
  expect(r.ok).toBeFalsy()
})

test('5d. el merge sin overrides sigue siendo deep-equal a CONFIG', () => {
  // El invariante que `docs/personalizar-mi-pagina.md` llama "la
  // personalización es aditiva o no es".
  expect(mergeSiteConfig(CONFIG, {}).modalidades).toEqual(
    CONFIG.modalidades.map(m => ({ ...m })),
  )
})

// ─── 6. La migración: lo que NO hace ─────────────────────────────────────────

test('6. la firma peligrosa de la RPC se elimina, no se deja obsoleta', () => {
  // La versión de 6 argumentos validaba el nivel pero recibía las cifras. Una
  // llamada con los valores cruzados generó en EDUHCO un calendario de 12
  // semanas en vez de 24 sin ningún error. Mientras exista, es invocable.
  const sql = leer(MIGRACION)
  expect(sql).toContain('DROP FUNCTION IF EXISTS public.generar_calendario_por_nivel(UUID, INTEGER, NUMERIC, INTEGER, NUMERIC, DATE)')
  // Y la que queda no recibe el plan: solo alumno y fecha.
  expect(sql).toContain('CREATE OR REPLACE FUNCTION public.generar_calendario_por_nivel(\n  p_alumno_id    UUID,\n  p_fecha_inicio DATE DEFAULT CURRENT_DATE\n)')
})

test('6b. la migración NO toca el default ni el CHECK de pagos.concepto', () => {
  // `concepto` es TEXT libre en toda la flota. Imponerle una lista cerrada a
  // 144 bases con datos que nadie ha inventariado revienta la migración.
  const sql = leer(MIGRACION)
  expect(sql).not.toContain('ALTER COLUMN concepto SET DEFAULT')
  expect(sql).not.toContain('pagos_concepto_check')
})

test('6c. la migración no siembra ningún plan de fábrica', () => {
  // Un valor por defecto sería el plan de OTRA escuela. Si la sincronización no
  // ha corrido, esto debe fallar ruidosamente, no cobrar cifras inventadas.
  const sql = leer(MIGRACION)
  expect(sql).not.toMatch(/INSERT INTO public\.ajustes[\s\S]{0,200}plan_semanas_/)
})

test('6d. las cuatro RPC llevan la guardia de rol', () => {
  const sql = leer(MIGRACION)
  const funciones = [
    'generar_calendario_pagos',
    'generar_calendario_por_nivel',
    'registrar_cuota_semanal',
    'condonar_semana',
  ]
  for (const fn of funciones) {
    const i = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${fn}(`)
    expect(i, `falta ${fn}`).toBeGreaterThan(-1)
    const cuerpo = sql.slice(i, i + 2000)
    expect(cuerpo, `${fn} sin guardia`).toContain('calendario_pagos_autorizado()')
    expect(cuerpo, `${fn} sin 42501`).toContain('42501')
  }
})

test('6e. el calendario NO se escribe desde una sesión de usuario', () => {
  // `pagos` es el libro de dinero real y el calendario su propia tabla; si
  // `authenticated` pudiera escribirla, un alumno se condonaría sus semanas.
  const sql = leer(MIGRACION)
  expect(sql).toContain('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.calendario_pagos FROM authenticated')
  expect(sql).toContain('GRANT  SELECT ON public.calendario_pagos TO authenticated')
})

// ─── 7. La landing no puede anunciar la unidad equivocada ────────────────────

test('7. la landing no lleva "/mes" escrito a mano en las tarjetas de plan', () => {
  // 🛑 Este era el hueco: las tarjetas pintaban `m.mensualidad` con la etiqueta
  // "/mes" pasara lo que pasara. En una escuela semanal eso publica una cifra
  // que no existe —o un 0, si no declara mensualidad— y el visitante calcula el
  // costo del programa con ella. La unidad tiene que salir de `unidadCuota()`.
  const landing = leer('src/components/landing/LandingClient.tsx')
  const tarjetas = landing
    .split('\n')
    .filter(l => l.includes('planesPrepa.map') || l.includes('planesSec.map'))
  expect(tarjetas.length).toBeGreaterThan(0)
  for (const linea of tarjetas) {
    expect(linea, 'unidad escrita a mano en una tarjeta de plan').not.toContain("'/mes'")
  }
})

test('7b. la unidad del precio sale de la periodicidad', () => {
  const landing = leer('src/components/landing/LandingClient.tsx')
  expect(landing).toContain("unidadCuota")
})

// ─── 8. Las claves del plan llegan al editor ─────────────────────────────────

test('8. recortarAEditables conserva nivel, semanas y cuotaSemanal', () => {
  // `recortarAEditables` copia las modalidades campo por campo, y las tres
  // claves opcionales se le habían quedado fuera. El editor de una escuela
  // semanal recibía un plan sin sus semanas y sin su cuota: la pestaña de
  // Precios no podía ni rotular el campo. Lo cazó el clon de CAU #200.
  const base = mergeSiteConfig(CONFIG, {}) as unknown as {
    modalidades: Array<Record<string, unknown>>
  }
  base.modalidades[0].nivel = 'secundaria'
  base.modalidades[0].semanas = 12
  base.modalidades[0].cuotaSemanal = 250

  const editable = recortarAEditables(base as never)
  const plan = (editable.modalidades as unknown as Array<Record<string, unknown>>)[0]

  expect(plan.nivel).toBe('secundaria')
  expect(plan.semanas).toBe(12)
  expect(plan.cuotaSemanal).toBe(250)
})

test('8b. el editor no gana ni pierde claves respecto del plan de origen', () => {
  // El invariante: el objeto que viaja al navegador lleva las seis claves de
  // siempre MÁS exactamente las opcionales que el plan declara. Ni una de más
  // con `undefined` dentro, ni una de menos.
  //
  // ⚠️ Se compara contra el plan de ORIGEN, no contra una lista fija: esta
  // prueba corre en los ~144 clones y en uno semanal —CAU #200— las tres
  // opcionales existen de verdad. Una lista fija lo dejaba en rojo sin tener
  // ningún problema, que es como se descubrió.
  const base = mergeSiteConfig(CONFIG, {})
  const editable = recortarAEditables(base)
  const planes = editable.modalidades as unknown as Array<Record<string, unknown>>
  const SIEMPRE = ['activa', 'id', 'label', 'materiasPorMes', 'mensualidad', 'meses']
  const OPCIONALES = ['nivel', 'semanas', 'cuotaSemanal']

  base.modalidades.forEach((origen, i) => {
    const o = origen as unknown as Record<string, unknown>
    const esperadas = [...SIEMPRE, ...OPCIONALES.filter((k) => o[k] !== undefined)].sort()
    expect(Object.keys(planes[i]).sort()).toEqual(esperadas)
    for (const v of Object.values(planes[i])) expect(v).not.toBeUndefined()
  })
})

test('8c. el GET del panel no pierde la cuota que el admin publicó', () => {
  // El override se guardaba en la fila pero `recortarOverrides` lo descartaba
  // al leerla: el admin publicaba su cuota, recargaba y volvía a ver la vieja.
  const id = CONFIG.modalidades[0].id
  const leido = recortarOverrides({
    modalidades: { [id]: { cuotaSemanal: 350, activa: true } },
  }) as { modalidades?: Record<string, Record<string, unknown>> }

  expect(leido.modalidades?.[id]?.cuotaSemanal).toBe(350)
  expect(leido.modalidades?.[id]?.activa).toBe(true)
})
