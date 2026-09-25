import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  LIMITES_LIC,
  bloqueLicEditable,
  licenciaturaEfectiva,
  planesLicEditables,
} from '@/lib/precios-licenciatura'
import { LIMITES } from '@/lib/site-config-campos'
import { mergeSiteConfig, toLandingConfig, type BaseSiteConfig, type SiteConfig } from '@/lib/site-config-core'
import { recortarOverrides, validarOverrides, type ResultadoValidacion } from '@/lib/site-config-validacion'
import {
  certificacionDelAlumno,
  getDesglosesLicenciatura,
  inscripcionDelAlumno,
  tablaLicenciaturas,
} from '@/lib/licenciatura-utils'
import { getModalidadesLicenciatura } from '@/lib/modalidades'

/**
 * Bloque B, B2 — los precios de licenciatura se publican desde el panel.
 *
 * Claves en su sitio: `licenciaturas.inscripcion`, `licenciaturas.certificacion`
 * (la titulación) y `licenciaturas.modalidades` (mapa por id, APARTE del de
 * Sec/Prepa, solo `mensualidad`). Vacío = la cifra de config.ts.
 *
 * El invariante: con NADA publicado todo es exactamente lo de antes; y lo
 * publicado solo se aplica sobre la forma estándar de la plantilla.
 *
 * Los datos se construyen aquí: estas pruebas corren también en los clones.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')

type Plano = Record<string, unknown>

/** La forma estándar de la plantilla, encendida. '6_meses' choca A PROPÓSITO con Sec/Prepa (Bug 121). */
const LIC = () => ({
  activas: true,
  inscripcion: 1500,
  certificacion: 38000,
  carreras: [{ slug: 'derecho', nombre: 'Licenciatura en Derecho', cuatrimestres: 8, totalMaterias: 32, icono: 'Scale', desc: 'x', incluye: ['Título'] }],
  modalidades: [
    { id: '12_meses', label: 'Ejecutivo 12 meses', sublabel: '12 meses', meses: 12, mensualidad: 1450, activa: true, materiasPorMes: 2.67 },
    { id: '18_meses', label: 'Extendido 18 meses', sublabel: '18 meses', meses: 18, mensualidad: 1050, activa: true, materiasPorMes: 1.78 },
    { id: '6_meses', label: 'Intensivo 6 meses', sublabel: '6 meses', meses: 6, mensualidad: 2500, activa: true, materiasPorMes: 5.34 },
  ],
})

const PUBLICADO = { inscripcion: 1700, certificacion: 39000, modalidades: { '12_meses': { mensualidad: 1500 }, '6_meses': { mensualidad: 2700 } } }

/** El config del repo con otra tabla de licenciatura (un cliente nuevo con el add-on). */
const baseCon = (lic: unknown) => ({ ...mergeSiteConfig(CONFIG, {}), licenciaturas: lic }) as unknown as BaseSiteConfig
const licDe = (cfg: SiteConfig) => (cfg as unknown as { licenciaturas: Plano & { modalidades: Plano[] } }).licenciaturas

/** Cambia `CONFIG.licenciaturas` solo mientras corre `fn` (simula el config.ts de un cliente). */
function conLicEnConfig<T>(lic: unknown, fn: () => T): T {
  const cfg = CONFIG as unknown as Plano
  const habia = Object.prototype.hasOwnProperty.call(cfg, 'licenciaturas')
  const antes = cfg.licenciaturas
  try {
    cfg.licenciaturas = lic
    return fn()
  } finally {
    if (habia) cfg.licenciaturas = antes
    else delete cfg.licenciaturas
  }
}

// ─── 1. La regla de publicación (módulo puro) ────────────────────────────────

test('1. sin nada publicado, la tabla es la MISMA referencia (la invariancia del PDF depende de esto)', () => {
  const lic = LIC()
  for (const ov of [undefined, null, {}, 'x', 42, [], { modalidades: {} }, { otra: 1 }]) {
    expect(licenciaturaEfectiva(lic, ov), JSON.stringify(ov)).toBe(lic)
  }
})

test('1b. aplica inscripción, titulación y mensualidad por id, sin mutar la tabla de entrada', () => {
  const lic = LIC()
  const copia = JSON.parse(JSON.stringify(lic))
  const r = licenciaturaEfectiva(lic, PUBLICADO) as ReturnType<typeof LIC>
  expect(r).not.toBe(lic)
  expect(lic).toEqual(copia)
  expect(r.inscripcion).toBe(1700)
  expect(r.certificacion).toBe(39000)
  expect(r.modalidades.map(m => m.mensualidad)).toEqual([1500, 1050, 2700])
  // Lo demás, intacto y compartido: duración, materias, carreras.
  expect(r.modalidades.map(m => [m.id, m.meses, m.materiasPorMes, m.activa]))
    .toEqual(lic.modalidades.map(m => [m.id, m.meses, m.materiasPorMes, m.activa]))
  expect(r.carreras).toBe(lic.carreras)
  expect(r.modalidades[1]).toBe(lic.modalidades[1])
})

test('1c. valores que el panel no admite se ignoran: 0 en mensualidad, negativos, texto, NaN, id desconocido', () => {
  const lic = LIC()
  for (const ov of [
    { inscripcion: -1 }, { inscripcion: 0 }, { certificacion: 0 }, { inscripcion: '1500' }, { inscripcion: NaN }, { certificacion: Infinity },
    { modalidades: { '12_meses': { mensualidad: 0 } } },
    { modalidades: { '12_meses': { mensualidad: -5 } } },
    { modalidades: { '12_meses': { mensualidad: '1500' } } },
    { modalidades: { '12_meses': 1500 } },
    { modalidades: { '24_meses': { mensualidad: 1500 } } },
    { modalidades: JSON.parse('{"__proto__": {"mensualidad": 1}}') },
  ]) {
    expect(licenciaturaEfectiva(lic, ov), JSON.stringify(ov)).toBe(lic)
  }
})

test('1d. fail-closed: formas propias de la flota no se tocan', () => {
  const casos: Array<[string, Plano]> = [
    ['add-on apagado', { ...LIC(), activas: false }],
    ['`rutas` que duplican los planes (SÉNDERI)', { ...LIC(), rutas: [] }],
    ['titulacionIncluida', { ...LIC(), titulacionIncluida: true }],
    ['modalidadesDiplomado', { ...LIC(), modalidadesDiplomado: [] }],
    // Como Universidad Azteca: sin `inscripcion` arriba, tarifas en `precios`.
    ['precios por tarifa (Universidad Azteca)', { activas: true, modalidadUnica: true, certificacion: 35000,
      precios: { normal: { inscripcion: 4000, mensualidad: 1500, label: 'Normal' }, beca: { inscripcion: 2000, mensualidad: 1100, label: 'Beca' } },
      becaCondicion: 'x', carreras: LIC().carreras, modalidades: LIC().modalidades }],
    // Como Academia Invictoss: pago único y titulación por plan.
    ['pago único y titulación por plan (Invictoss)', { activas: true, inscripcion: 500, pagoUnico: 62000, carreras: LIC().carreras,
      modalidades: LIC().modalidades.map((m) => ({ ...m, certificacion: 20000 })) }],
    ['carrera con precio propio (TOTAL ACADEMY)', { ...LIC(), carreras: [{ slug: 'x', nombre: 'X', mensualidad: 1490 }] }],
    ['carrera con preciosPorModalidad (The Living Faith)', { ...LIC(), carreras: [{ slug: 'x', nombre: 'X', preciosPorModalidad: {} }] }],
    ['sin tabla de planes', { ...LIC(), modalidades: undefined }],
  ]
  for (const [nombre, lic] of casos) {
    expect(bloqueLicEditable(lic), nombre).toBe(false)
    expect(licenciaturaEfectiva(lic, PUBLICADO), nombre).toBe(lic)
  }
  // Caso sintético (no está en la flota): sin `certificacion` arriba y titulación
  // en cada plan. Ni la titulación ni esos planes se publican; la inscripción sí.
  const invictoss: Plano = { ...LIC(), modalidades: LIC().modalidades.map((m) => ({ ...m, certificacion: 20000 })) }
  delete invictoss.certificacion
  const ri = licenciaturaEfectiva(invictoss, PUBLICADO) as Plano & { modalidades: Plano[] }
  expect(ri.inscripcion).toBe(1700)
  expect('certificacion' in ri).toBe(false)
  expect(ri.modalidades).toBe(invictoss.modalidades)
  // Una pieza con forma propia se salta; lo demás sí se aplica.
  const conObjeto = { ...LIC(), inscripcion: { mxn: 1000, usd: 75 }, certificacion: null }
  const r = licenciaturaEfectiva(conObjeto, PUBLICADO) as Plano & { modalidades: Plano[] }
  expect(r.inscripcion).toEqual({ mxn: 1000, usd: 75 })
  expect(r.certificacion).toBeNull()
  expect(r.modalidades[0].mensualidad).toBe(1500)
})

test('1e. planes que no se publican: apagados, de diplomado (*_dip) o con claves propias', () => {
  const lic = LIC() as Plano & { modalidades: Plano[] }
  lic.modalidades = [
    { id: '12_meses', label: 'A', meses: 12, mensualidad: 1450, activa: false, materiasPorMes: 3 },
    { id: '6_meses_dip', label: 'B', meses: 6, mensualidad: 0, activa: true, materiasPorMes: 1 },
    { id: '18_meses', label: 'C', meses: 18, mensualidad: 1050, activa: true, materiasPorMes: 2, total: 20000 },
    { id: '9_meses', label: 'D', meses: 9, mensualidad: 0, activa: true, materiasPorMes: 4 },
  ]
  expect(planesLicEditables(lic).map(m => m.id)).toEqual(['9_meses'])
  const ov = { modalidades: { '12_meses': { mensualidad: 1 }, '6_meses_dip': { mensualidad: 1 }, '18_meses': { mensualidad: 1 }, '9_meses': { mensualidad: 1600 } } }
  const r = licenciaturaEfectiva(lic, ov) as Plano & { modalidades: Plano[] }
  // El de 0 = «sin precio todavía» es justo el que el admin completa.
  expect(r.modalidades.map(m => m.mensualidad)).toEqual([1450, 0, 1050, 1600])
})

// ─── 2. El merge ─────────────────────────────────────────────────────────────

test('2. con {} el merge deja la tabla idéntica', () => {
  const base = baseCon(LIC())
  expect(licDe(mergeSiteConfig(base, {}))).toEqual(LIC())
  expect(mergeSiteConfig(CONFIG, {})).toEqual(JSON.parse(JSON.stringify(CONFIG)))
})

test('2b. lo publicado queda DENTRO de `licenciaturas`; Sec/Prepa y sus alias no se mueven (Bug 121)', () => {
  const base = baseCon(LIC())
  const sin = mergeSiteConfig(base, {})
  const con = mergeSiteConfig(base, { licenciaturas: PUBLICADO })
  expect(licDe(con).inscripcion).toBe(1700)
  expect(licDe(con).certificacion).toBe(39000)
  expect(licDe(con).modalidades.map(m => m.mensualidad)).toEqual([1500, 1050, 2700])
  // El '6_meses' de licenciatura no es el de preparatoria: ni el plan ni los
  // alias que `derivarAliasPrecios` elige por meses.
  expect(con.modalidades).toEqual(sin.modalidades)
  expect(con.precios).toEqual(sin.precios)
  expect(con.landing).toEqual(sin.landing)
})

test('2c. el bucle genérico no aplica licenciatura: sobre una base null o de otra forma no entra nada', () => {
  // `compatible()` acepta cualquier primitivo sobre una base null; la regla
  // propia exige una cifra numérica en config.ts.
  const base = baseCon({ ...LIC(), certificacion: null })
  const r = mergeSiteConfig(base, { licenciaturas: { certificacion: 39000, activas: false, carreras: [] } })
  expect(licDe(r).certificacion).toBeNull()
  expect(licDe(r).activas).toBe(true)
  expect((licDe(r).carreras as unknown[]).length).toBe(1)
})

// ─── 3. Validación y recorte ─────────────────────────────────────────────────

const ok = (r: ResultadoValidacion) => {
  expect(r.ok, r.ok ? '' : `${r.error} (${r.clave})`).toBe(true)
  return r.ok ? r.overrides : {}
}
const falla = (r: ResultadoValidacion, clave: string, fragmento?: RegExp) => {
  expect(r.ok).toBe(false)
  if (r.ok) return
  expect(r.clave).toBe(clave)
  if (fragmento) expect(r.error).toMatch(fragmento)
}

test('3. el PUT acepta los tres precios sobre la forma estándar', () => {
  const base = mergeSiteConfig(baseCon(LIC()), {})
  const r = ok(validarOverrides({ licenciaturas: PUBLICADO }, base))
  expect(r.licenciaturas).toEqual(PUBLICADO)
  // `null` = quitar el override.
  expect(ok(validarOverrides({ licenciaturas: { inscripcion: null, modalidades: { '12_meses': { mensualidad: null } } } }, base)))
    .toEqual({})
})

test('3b. el PUT rechaza lo que no es un precio publicable, con la clave exacta', () => {
  const base = mergeSiteConfig(baseCon(LIC()), {})
  const v = (lic: unknown) => validarOverrides({ licenciaturas: lic }, base)
  falla(v({ modalidades: { '12_meses': { mensualidad: 0 } } }), 'licenciaturas.modalidades.12_meses', /entre 1 y 50000/)
  falla(v({ modalidades: { '12_meses': { mensualidad: 50001 } } }), 'licenciaturas.modalidades.12_meses')
  falla(v({ modalidades: { '12_meses': { mensualidad: 1450.5 } } }), 'licenciaturas.modalidades.12_meses')
  falla(v({ modalidades: { '12_meses': { activa: false } } }), 'licenciaturas.modalidades.12_meses.activa', /Clave no editable/)
  falla(v({ modalidades: { '24_meses': { mensualidad: 1 } } }), 'licenciaturas.modalidades.24_meses', /desconocido/)
  falla(v({ modalidades: JSON.parse('{"__proto__": {}}') }), 'licenciaturas.modalidades.__proto__')
  falla(v({ modalidades: [] }), 'licenciaturas.modalidades')
  falla(v({ inscripcion: -1 }), 'licenciaturas.inscripcion')
  falla(v({ inscripcion: 50001 }), 'licenciaturas.inscripcion')
  falla(v({ certificacion: 100001 }), 'licenciaturas.certificacion')
  // El 0 no se publica: la sección diría «$0 de inscripción» o «¿Por qué la titulación cuesta $0?».
  falla(v({ inscripcion: 0 }), 'licenciaturas.inscripcion')
  falla(v({ certificacion: 0 }), 'licenciaturas.certificacion')
  expect(ok(v({ certificacion: 100000, inscripcion: 1 }))).toEqual({ licenciaturas: { certificacion: 100000, inscripcion: 1 } })
  falla(v({ activas: true }), 'licenciaturas.activas', /Clave no editable/)
  falla(v({ carreras: [] }), 'licenciaturas.carreras', /Clave no editable/)
})

test('3c. con una forma propia, el PUT lo dice en vez de guardar algo que nadie verá', () => {
  for (const lic of [{ ...LIC(), rutas: [] }, { ...LIC(), activas: false }, { ...LIC(), inscripcion: { mxn: 1 } }]) {
    const base = mergeSiteConfig(baseCon(lic), {})
    falla(validarOverrides({ licenciaturas: { inscripcion: 1700 } }, base), 'licenciaturas.inscripcion', /soporte/)
  }
  // La plantilla nace con el add-on apagado: no se publica nada de licenciatura.
  if ((CONFIG as unknown as { licenciaturas?: { activas?: boolean } }).licenciaturas?.activas !== true) {
    falla(validarOverrides({ licenciaturas: { certificacion: 1 } }, mergeSiteConfig(CONFIG, {})), 'licenciaturas.certificacion', /soporte/)
  }
})

test('3d. el GET recorta la fila: solo números y solo planes que la escuela puede publicar', () => {
  const base = mergeSiteConfig(baseCon(LIC()), {})
  const fila = {
    licenciaturas: {
      inscripcion: 1700, certificacion: '39000', activas: false, carreras: [],
      modalidades: { '12_meses': { mensualidad: 1500, activa: false }, '24_meses': { mensualidad: 9 }, '18_meses': 'x' },
    },
  }
  expect(recortarOverrides(fila, base)).toEqual({ licenciaturas: { inscripcion: 1700, modalidades: { '12_meses': { mensualidad: 1500 } } } })
  // Si la tabla dejó de ser estándar, no se devuelve nada de licenciatura.
  expect(recortarOverrides(fila, mergeSiteConfig(baseCon({ ...LIC(), rutas: [] }), {}))).toEqual({})
})

test('3e. ids heredados, mapa vacío, `licenciaturas: {}` y `null`: nada se aplica y nada revienta', () => {
  const lic = LIC()
  // Un id que el mapa HEREDA (no propio) no cuenta: sin `hasOwnProperty` se aplicaría.
  expect(licenciaturaEfectiva(lic, { modalidades: Object.create({ '12_meses': { mensualidad: 1111 } }) })).toBe(lic)
  // En una base editable, quitar el override de un plan que no existe tampoco es un error.
  const editable = mergeSiteConfig(baseCon(LIC()), {})
  expect(ok(validarOverrides({ licenciaturas: { modalidades: { '24_meses': null, '6_meses_dip': {} } } }, editable))).toEqual({})
  falla(validarOverrides({ licenciaturas: { modalidades: { '24_meses': { mensualidad: 1 } } } }, editable), 'licenciaturas.modalidades.24_meses')
  const base = mergeSiteConfig(baseCon(LIC()), {})
  expect(ok(validarOverrides({ licenciaturas: {} }, base))).toEqual({})
  expect(ok(validarOverrides({ licenciaturas: null }, base))).toEqual({})
  // Sobre una base que NO se edita, un cuerpo que no cambia nada tampoco pide soporte.
  const apagada = mergeSiteConfig(baseCon({ ...LIC(), activas: false }), {})
  for (const cuerpo of [{ modalidades: {} }, { modalidades: { '12_meses': null } }, { modalidades: { '12_meses': {} } }, { inscripcion: null }]) {
    expect(ok(validarOverrides({ licenciaturas: cuerpo }, apagada)), JSON.stringify(cuerpo)).toEqual({})
  }
  // Una clave prohibida nunca pasa por el atajo.
  expect(validarOverrides({ licenciaturas: { modalidades: JSON.parse('{"__proto__": null}') } }, apagada).ok).toBe(false)
})

test('3f. lo que devuelve el GET siempre se puede reenviar: una fila escrita a mano no bloquea el editor', () => {
  const base = mergeSiteConfig(baseCon(LIC()), {})
  const fila = { licenciaturas: {
    inscripcion: 1500.5, certificacion: 200000,
    modalidades: { '12_meses': { mensualidad: 0 }, '18_meses': { mensualidad: 1450.5 }, '6_meses': { mensualidad: 2600 } },
  } }
  const r = recortarOverrides(fila, base)
  expect(r).toEqual({ licenciaturas: { modalidades: { '6_meses': { mensualidad: 2600 } } } })
  ok(validarOverrides(r, base))
  // Y el ciclo GET → PUT de lo publicado de verdad.
  ok(validarOverrides(recortarOverrides({ licenciaturas: PUBLICADO }, base), base))
  // Los topes, en los dos bordes.
  const r2 = (lic: unknown) => recortarOverrides({ licenciaturas: lic }, base).licenciaturas
  expect(r2({ inscripcion: 0 })).toBeUndefined()
  expect(r2({ inscripcion: 50000 })).toEqual({ inscripcion: 50000 })
  expect(r2({ inscripcion: 50001 })).toBeUndefined()
  expect(r2({ certificacion: 100000 })).toEqual({ certificacion: 100000 })
  expect(r2({ certificacion: 100001 })).toBeUndefined()
  expect(r2({ modalidades: { '12_meses': { mensualidad: 50000 } } })).toEqual({ modalidades: { '12_meses': { mensualidad: 50000 } } })
  expect(r2({ modalidades: { '12_meses': { mensualidad: 50001 } } })).toBeUndefined()
})

test('3f2. el merge aplica la MISMA regla que el GET y el PUT: nada fuera de rango sale en la página', () => {
  const lic = LIC()
  for (const ov of [
    { inscripcion: 1500.5 }, { inscripcion: 60000 }, { certificacion: 250000 }, { certificacion: 38000.5 },
    { modalidades: { '12_meses': { mensualidad: 99999 } } }, { modalidades: { '12_meses': { mensualidad: 1.5 } } },
  ]) {
    expect(licenciaturaEfectiva(lic, ov), JSON.stringify(ov)).toBe(lic)
  }
  // Los bordes sí.
  expect((licenciaturaEfectiva(lic, { inscripcion: 50000, certificacion: 100000 }) as Plano).certificacion).toBe(100000)
  // Un solo juego de límites: el del módulo puro y el del catálogo son el mismo.
  expect(LIMITES_LIC.precioMax).toBe(LIMITES.precioMax)
  expect(LIMITES_LIC.titulacionMax).toBe(LIMITES.titulacionMax)
  expect(LIMITES_LIC.min).toBe(LIMITES.precioNivelMin)
})

test('3g. un "6_meses" de licenciatura y uno de Sec/Prepa en el MISMO cuerpo: cada uno en su mapa', () => {
  const base = mergeSiteConfig(baseCon(LIC()), {})
  // El de Sec/Prepa se reenvía con la cifra que YA tiene: así no depende de la
  // regla del escalón de cada clon (3 meses no más barato que 6).
  const plan6 = (base.modalidades as ReadonlyArray<{ id: string; mensualidad: number }>).find(m => m.id === '6_meses')
  const cuerpo = { licenciaturas: { modalidades: { '6_meses': { mensualidad: 2700 } } }, ...(plan6 ? { modalidades: { '6_meses': { mensualidad: plan6.mensualidad } } } : {}) }
  const r = ok(validarOverrides(cuerpo, base))
  expect(r.licenciaturas).toEqual({ modalidades: { '6_meses': { mensualidad: 2700 } } })
  const m = mergeSiteConfig(baseCon(LIC()), r)
  expect(licDe(m).modalidades.find(p => p.id === '6_meses')?.mensualidad).toBe(2700)
  // El de Sec/Prepa no se contamina con el de licenciatura.
  if (plan6) expect((m.modalidades as ReadonlyArray<{ id: string; mensualidad: number }>).find(p => p.id === '6_meses')?.mensualidad).toBe(plan6.mensualidad)
})

// ─── 4. Los lectores leen lo PUBLICADO ───────────────────────────────────────

test('4. ficha y «Mis pagos»: la inscripción y la titulación del alumno salen de la tabla efectiva', () => {
  const cfg = mergeSiteConfig(baseCon(LIC()), { licenciaturas: PUBLICADO })
  const precios = cfg.precios as unknown as Record<string, unknown>
  expect(inscripcionDelAlumno('licenciatura', precios, tablaLicenciaturas(cfg))).toBe(1700)
  expect(certificacionDelAlumno('licenciatura', precios, tablaLicenciaturas(cfg))).toBe(39000)
  // Sec/Prepa no se enteran.
  const sin = mergeSiteConfig(baseCon(LIC()), {})
  expect(inscripcionDelAlumno('secundaria', precios, tablaLicenciaturas(cfg)))
    .toBe(inscripcionDelAlumno('secundaria', sin.precios as unknown as Record<string, unknown>, tablaLicenciaturas(sin)))
})

test('4b. landing: la tabla viaja solo si lo publicado difiere de config.ts, y el desglose la usa', () => {
  conLicEnConfig(LIC(), () => {
    // Nada publicado: la landing lee CONFIG como siempre (el bundle ya la trae).
    expect(toLandingConfig(mergeSiteConfig(CONFIG, {}))).not.toHaveProperty('licenciaturas')
    // Publicado igual a lo de config.ts: tampoco.
    expect(toLandingConfig(mergeSiteConfig(CONFIG, { licenciaturas: { inscripcion: 1500 } }))).not.toHaveProperty('licenciaturas')
    const lc = toLandingConfig(mergeSiteConfig(CONFIG, { licenciaturas: PUBLICADO }))
    expect(lc.licenciaturas).toBeDefined()
    const d = getDesglosesLicenciatura(lc.licenciaturas)
    expect(d.map(x => [x.modalidadId, x.inscripcion, x.mensualidad, x.titulacion, x.total])).toEqual([
      ['12_meses', 1700, 1500, 39000, 1700 + 12 * 1500 + 39000],
      ['18_meses', 1700, 1050, 39000, 1700 + 18 * 1050 + 39000],
      ['6_meses', 1700, 2700, 39000, 1700 + 6 * 2700 + 39000],
    ])
    // Sin tabla, el desglose es el de config.ts: exactamente lo de antes.
    expect(getDesglosesLicenciatura(undefined)).toEqual(getDesglosesLicenciatura())
    expect(getDesglosesLicenciatura()[0].inscripcion).toBe(1500)
  })
})

test('4c. /api/admin/planes: la mensualidad de cada plan de licenciatura es la publicada', () => {
  const cfg = mergeSiteConfig(baseCon(LIC()), { licenciaturas: PUBLICADO })
  expect(getModalidadesLicenciatura(tablaLicenciaturas(cfg)).map(m => m.mensualidad)).toEqual([1500, 1050, 2700])
  const ruta = sinComentarios(leer('src/app/api/admin/planes/route.ts'))
  expect(ruta).toContain('getModalidadesLicenciatura(tablaLicenciaturas(cfg)).map(')
})

test('4d. la sección de licenciaturas recibe el desglose de la landing, no lo recalcula', () => {
  const animada = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(animada).toContain('const planesLic = getDesglosesLicenciatura(config.licenciaturas)')
  expect(animada).toContain('textos={textosLic} planes={planesLic} />')
  const seccion = sinComentarios(leer('src/components/landing/animada/Licenciaturas.tsx'))
  expect(seccion).not.toMatch(/getDesglosesLicenciatura\s*\(/)
})

// ─── 5. La entrega (PDF y WhatsApp) ──────────────────────────────────────────

test('5. la entrega aplica lo publicado con la MISMA regla y solo toca la tabla de licenciatura', () => {
  const gen = sinComentarios(leer('scripts/entrega/generar-entrega.mjs'))
  expect(gen).toMatch(/const \{ licenciaturaEfectiva, bloqueLicEditable \} =\s*await import\(pathToFileURL\(path\.join\(RAIZ, 'src\/lib\/precios-licenciatura\.ts'\)\)\.href\)/)
  expect(gen).toContain('const LIC = licenciaturaEfectiva(CONFIG.licenciaturas, PUBLICADO.licenciaturas)')
  // Toda lectura de la tabla pasa por LIC: `CONFIG.licenciaturas` solo para decidir si la escuela
  // puede publicar, para definir LIC y para el aviso.
  expect(gen.match(/CONFIG\.licenciaturas/g)).toHaveLength(3)
  expect(gen).toContain('const PUEDE_PUBLICAR_LIC = bloqueLicEditable(CONFIG.licenciaturas)')
  // Aborta solo si la escuela puede publicar licenciatura; si no, avisa y sigue.
  expect(gen).toContain('if (PUEDE_PUBLICAR_LIC) abortar(motivo, ayuda)')
  expect(gen).toContain(".replace(/^\\uFEFF/, '')")
  // Un .env.local en CRLF también se lee, y hay salida a sabiendas.
  expect(gen).toContain('split(/\\r?\\n/)')
  expect(gen).toContain("flag('solo-config')")
  expect(gen).toContain(".from('site_config').select('data').eq('id', 1).maybeSingle()")
  // Sec/Prepa siguen saliendo de config.ts (decisión 14): se avisa, no se aplica.
  expect(gen).not.toMatch(/PUBLICADO\.precios\s*[,)]/)
  const readme = leer('scripts/entrega/README.md')
  expect(readme).toContain('--solo-config')
  expect(readme).toContain('src/lib/precios-licenciatura.ts')
})
