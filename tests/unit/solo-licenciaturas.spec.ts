import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { esSoloLicenciaturas } from '@/lib/licenciatura-utils'
import { mergeSiteConfig, toLandingConfig } from '@/lib/site-config-core'
import { secuenciaSecciones, secuenciaValida, SECCIONES_OPCIONALES } from '@/components/landing/animada/tokens'

/**
 * Soporte Solo-Licenciaturas (#311). `esSoloLicenciaturas()` decide si la app
 * apaga TODO lo de Secundaria/Preparatoria. Con Sec/Prepa en `niveles` tiene que
 * dar `false` siempre: así las escuelas de fábrica no cambian ni una letra.
 */
type Cfg = { niveles: unknown; licenciaturas: unknown }
const cfg = CONFIG as unknown as Cfg
const CARRERA = { slug: 'derecho', nombre: 'Licenciatura en Derecho', cuatrimestres: 8, totalMaterias: 32, icono: 'Scale', desc: '', incluye: [] }

function conConfig(niveles: string[], activas: boolean, carreras: unknown[] = [CARRERA]) {
  return conConfigHaz(niveles, activas, esSoloLicenciaturas, carreras)
}

function conConfigHaz<T>(niveles: string[], activas: boolean, fn: () => T, carreras: unknown[] = [CARRERA]): T {
  const antes = { niveles: cfg.niveles, licenciaturas: cfg.licenciaturas }
  cfg.niveles = niveles
  cfg.licenciaturas = { ...(antes.licenciaturas as object), activas, carreras }
  try { return fn() } finally {
    cfg.niveles = antes.niveles
    cfg.licenciaturas = antes.licenciaturas
  }
}

test('1. Sec/Prepa con el add-on apagado → false', () => {
  expect(conConfig(['preparatoria', 'secundaria'], false)).toBe(false)
})

test('2. Sec/Prepa con el add-on encendido → false', () => {
  expect(conConfig(['preparatoria', 'secundaria'], true)).toBe(false)
  expect(conConfig(['preparatoria'], true)).toBe(false)
  expect(conConfig(['secundaria', 'licenciatura'], true)).toBe(false)
})

test('3. solo licenciatura con el add-on encendido → true', () => {
  expect(conConfig(['licenciatura'], true)).toBe(true)
  expect(conConfig([], true)).toBe(true)
})

test('4. solo licenciatura con el add-on apagado (o sin carreras) → false', () => {
  expect(conConfig(['licenciatura'], false)).toBe(false)
  expect(conConfig(['licenciatura'], true, [])).toBe(false)
  expect(conConfig(['licenciatura'], true, [{ ...CARRERA, esDiplomado: true }])).toBe(false)
})

test('5. secuenciaSecciones sin omitidas da el orden de siempre', () => {
  const todas = Object.fromEntries(SECCIONES_OPCIONALES.map(s => [s, true]))
  expect(secuenciaSecciones(todas, [])).toEqual(secuenciaSecciones(todas))
})

test('6. sin niveles ni planes la secuencia sigue alternando fondos', () => {
  for (let mask = 0; mask < 1 << SECCIONES_OPCIONALES.length; mask++) {
    const presentes = Object.fromEntries(SECCIONES_OPCIONALES.map((s, i) => [s, Boolean(mask & (1 << i))]))
    const s = secuenciaSecciones(presentes, ['niveles', 'planes'])
    expect(s.some(x => x.id === 'niveles' || x.id === 'planes')).toBe(false)
    expect(secuenciaValida(s)).toBe(true)
  }
})

test('7. el HTML público de una escuela Solo-Licenciaturas no lleva claves ni textos de Sec/Prepa', () => {
  const solo = conConfigHaz(['licenciatura'], true, () => toLandingConfig(mergeSiteConfig(CONFIG, {})))
  expect(Object.keys(solo.precios).filter(k => /secundaria|preparatoria|prepa/i.test(k))).toEqual([])
  expect(Object.keys(solo.landing).filter(k => /secundaria|preparatoria/i.test(k))).toEqual([])
  const validez = (solo.landing as unknown as { validezOficial?: { activa?: unknown } }).validezOficial
  if (validez && validez.activa !== true) expect(validez).toEqual({ activa: false })
  // Los TEXTOS de `landing` los reescribe cada escuela en su config.ts; aquí
  // solo se mide lo que la plantilla manda por su cuenta (claves y validez).
  expect(JSON.stringify(validez ?? {})).not.toMatch(/\bSEP\b/)
})

test('8. una escuela Sec/Prepa recibe el payload público intacto', () => {
  conConfigHaz(['secundaria', 'preparatoria'], false, () => {
    const cfgMerge = mergeSiteConfig(CONFIG, {})
    const pub = toLandingConfig(cfgMerge)
    expect(pub.landing).toBe(cfgMerge.landing)
    expect(pub.precios).toBe(cfgMerge.precios)
  })
})
