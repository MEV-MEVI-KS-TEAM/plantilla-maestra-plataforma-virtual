import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { certificacionDe, inscripcionDe } from '@/lib/precios-nivel'
import { inscripcionLicenciaturaDe, titulacionLicenciaturaDe } from '@/lib/precios-licenciatura'
import { certificacionDelAlumno, inscripcionDelAlumno, tablaLicenciaturas } from '@/lib/licenciatura-utils'

/**
 * #164 — el alumno de licenciatura confirma y paga la inscripción de SU
 * programa (`licenciaturas.inscripcion`), no la general de Sec/Prepa. Y #162:
 * la certificación de «Mis pagos» usa la regla canónica.
 *
 * Los datos se construyen aquí: estas pruebas corren también en los clones,
 * cada uno con su propio CONFIG.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')

function archivosDe(dir: string): string[] {
  const out: string[] = []
  for (const nombre of readdirSync(join(raiz, dir))) {
    const rel = `${dir}/${nombre}`
    if (statSync(join(raiz, rel)).isDirectory()) out.push(...archivosDe(rel))
    else if (/\.tsx?$/.test(nombre)) out.push(rel)
  }
  return out
}

/** El add-on encendido. Sin default en `certificacion`: `undefined` tiene que llegar tal cual. */
const encendida = (inscripcion: unknown, ...certificacion: unknown[]) =>
  ({ activas: true, inscripcion, certificacion: certificacion.length ? certificacion[0] : 0 })
const NIVELES = ['secundaria', 'preparatoria', 'licenciatura', 'diplomado', '', null, undefined]

// Formas de la flota que NO son una cifra única: se ignoran, nunca «$NaN».
const FORMAS_RARAS: unknown[] = [
  { mxn: 1000, usd: 75 },            // Liceo Académico Digital
  { base: 8900, pagoUnico: 8455 },   // AYR
  undefined,                         // ICCYDEH, Universidad Azteca
  null, NaN, Infinity, -5, '', '  ', 'mil', [1000], true,
]

// ─── 1. El resolver de la tabla de licenciatura ─────────────────────────────

test('1. una cifra finita >= 0 cuenta; el 0 es «sin inscripción»', () => {
  expect(inscripcionLicenciaturaDe(encendida(1000))).toBe(1000)
  expect(inscripcionLicenciaturaDe(encendida(0))).toBe(0)
  expect(inscripcionLicenciaturaDe(encendida('1500'))).toBe(1500)
  expect(titulacionLicenciaturaDe(encendida(0, 38000))).toBe(38000)
})

test('1b. las formas propias de la flota dan null', () => {
  for (const v of FORMAS_RARAS) {
    expect(inscripcionLicenciaturaDe(encendida(v)), String(JSON.stringify(v))).toBeNull()
    expect(titulacionLicenciaturaDe(encendida(0, v)), String(JSON.stringify(v))).toBeNull()
  }
})

test('1c. con el add-on apagado (o sin bloque) no hay cifra de licenciatura', () => {
  for (const lic of [{ activas: false, inscripcion: 1000, certificacion: 38000 }, { activas: 'true', inscripcion: 1000 },
    { inscripcion: 1000 }, null, undefined]) {
    expect(inscripcionLicenciaturaDe(lic), JSON.stringify(lic)).toBeNull()
    expect(titulacionLicenciaturaDe(lic), JSON.stringify(lic)).toBeNull()
  }
})

// ─── 2. Lo que paga un alumno ────────────────────────────────────────────────

const PRECIOS = { inscripcion: 399, inscripcionSecundaria: 500, inscripcionPreparatoria: 600 }

test('2. licenciatura paga la inscripción de su programa (Habsburgo: 1000, no 399)', () => {
  expect(inscripcionDelAlumno('licenciatura', PRECIOS, encendida(1000))).toBe(1000)
  // CIEB, EDU-CEL, 10 de Agosto: su licenciatura no cobra inscripción.
  expect(inscripcionDelAlumno('licenciatura', PRECIOS, encendida(0))).toBe(0)
})

test('2b. sin cifra única de licenciatura, la de antes; nunca NaN', () => {
  for (const v of FORMAS_RARAS) {
    const r = inscripcionDelAlumno('licenciatura', PRECIOS, encendida(v))
    expect(r, String(JSON.stringify(v))).toBe(inscripcionDe('licenciatura', PRECIOS))
    expect(Number.isFinite(r)).toBe(true)
  }
  expect(inscripcionDelAlumno('licenciatura', PRECIOS, { activas: false, inscripcion: 1000 })).toBe(399)
})

test('2c. cualquier otro nivel recibe exactamente inscripcionDe, sea cual sea la tabla de licenciatura', () => {
  const tablas = [encendida(1000), encendida(0), ...FORMAS_RARAS.map(v => encendida(v)), { activas: false }, null, undefined]
  const precios = [PRECIOS, { inscripcion: 750 }, { inscripcion: 750, inscripcionSecundaria: null }, {}]
  for (const n of NIVELES.filter(x => x !== 'licenciatura')) {
    for (const p of precios) for (const lic of tablas) {
      expect(inscripcionDelAlumno(n, p, lic), `${String(n)} ${JSON.stringify(p)}`).toBe(inscripcionDe(n, p))
    }
  }
})

// ─── 3. Certificación (#162) ─────────────────────────────────────────────────

// COPIA LITERAL de la función local de src/app/api/alumno/pagos/route.ts en 122e2ea.
function certificacionRutaMain(nivel: string | null, p: Record<string, unknown>): number {
  if (nivel === 'secundaria')   return Number(p.certificacionSecundaria ?? p.certificacion_secundaria ?? 0)
  if (nivel === 'preparatoria') return Number(p.certificacionPreparatoria ?? p.certificacion_preparatoria ?? 0)
  return 0
}

test('3. Sec/Prepa: la canónica, que coincide con la copia vieja en las formas de la flota', () => {
  const formas: Record<string, unknown>[] = [
    { certificacionSecundaria: 4900, certificacionPreparatoria: 5900 },                         // la plantilla
    { certificacionSecundaria: 3000, certificacion_secundaria: 3000,
      certificacionPreparatoria: 3000, certificacion_preparatoria: 3000 },                      // CAU
    { certificacionSecundaria: 0, certificacionPreparatoria: 0 },                              // RHEMA
    { certificacion_secundaria: 4000, certificacion_preparatoria: 5500 },                      // solo alias
    {},
  ]
  for (const p of formas) for (const n of ['secundaria', 'preparatoria']) {
    expect(certificacionDelAlumno(n, p, encendida(0, 38000)), `${n} ${JSON.stringify(p)}`).toBe(certificacionDe(n, p))
    expect(certificacionDelAlumno(n, p, encendida(0, 38000)), `${n} ${JSON.stringify(p)}`).toBe(certificacionRutaMain(n, p))
  }
})

test('3b. las diferencias con la copia vieja son solo las del #162', () => {
  // Canónica en 0 y alias > 0: la copia daba 0 (`??` no salta el 0).
  const p = { certificacionSecundaria: 0, certificacion_secundaria: 4900 }
  expect(certificacionRutaMain('secundaria', p)).toBe(0)
  expect(certificacionDelAlumno('secundaria', p, null)).toBe(4900)
  // Negativo o texto: la copia los devolvía tal cual (o NaN).
  expect(Number.isNaN(certificacionRutaMain('preparatoria', { certificacionPreparatoria: 'x' }))).toBe(true)
  expect(certificacionDelAlumno('preparatoria', { certificacionPreparatoria: 'x' }, null)).toBe(0)
  expect(certificacionDelAlumno('preparatoria', { certificacionPreparatoria: -5 }, null)).toBe(0)
})

test('3c. licenciatura: su titulación; diplomado y sin nivel: 0 (no la de preparatoria)', () => {
  const p = { certificacionSecundaria: 4900, certificacionPreparatoria: 5900 }
  expect(certificacionDelAlumno('licenciatura', p, encendida(1000, 38000))).toBe(38000)
  expect(certificacionDelAlumno('licenciatura', p, { activas: false, certificacion: 38000 })).toBe(0)
  for (const v of FORMAS_RARAS) expect(certificacionDelAlumno('licenciatura', p, encendida(0, v))).toBe(0)
  for (const n of ['diplomado', '', null, undefined]) expect(certificacionDelAlumno(n, p, encendida(0, 38000)), String(n)).toBe(0)
})

// ─── 4. Cableado ─────────────────────────────────────────────────────────────

test('4. la ficha pinta la cifra que calcula el servidor, con el config publicado', () => {
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain('${alumno.monto_inscripcion}</span>?')
  expect(ficha).not.toMatch(/\binscripcionDe\(/)
  const api = sinComentarios(leer('src/app/api/admin/alumnos/[id]/route.ts'))
  expect(api).toMatch(/import \{[^}]*\bgetSiteConfig\b[^}]*\} from '@\/lib\/site-config'/)
  expect(api).toContain('inscripcionDelAlumno(a.nivel as string | null, cfg.precios, tablaLicenciaturas(cfg))')
})

test('4b. ningún consumidor de src/app le pide a inscripcionDe la inscripción de un ALUMNO', () => {
  // Lo que se le cobra o se le confirma a un alumno va por inscripcionDelAlumno,
  // que manda a licenciatura a su tabla. inscripcionDe con un nivel fijo
  // ('secundaria', 'preparatoria') sigue permitido.
  for (const archivo of archivosDe('src/app')) {
    expect(sinComentarios(leer(archivo)), archivo).not.toMatch(/\binscripcionDe\(\s*(alumno\??\.nivel|nivel|a\.nivel)\b/)
  }
})

test('4c. una sola certificacionDe: la de precios-nivel.ts', () => {
  const con = archivosDe('src').filter(f => /function certificacionDe\b/.test(leer(f)))
  expect(con).toEqual(['src/lib/precios-nivel.ts'])
  const ruta = sinComentarios(leer('src/app/api/alumno/pagos/route.ts'))
  expect(ruta).toContain('certificacion: certificacionDelAlumno(nivel, precios, lic),')
})

test('4d. precios-licenciatura.ts se puede importar desde Node: sin imports de valor, sin enum ni namespace', () => {
  const codigo = sinComentarios(leer('src/lib/precios-licenciatura.ts'))
  // Solo se admite `import type { … } from './…'` de una línea.
  const inicios = codigo.match(/^\s*import\b/gm) ?? []
  const deTipo = codigo.match(/^import type \{[^}\n]*\} from '\.\/[\w-]+'$/gm) ?? []
  expect(inicios.length).toBe(deTipo.length)
  expect(codigo).not.toMatch(/^\s*export\b[^;]*?\bfrom\b/m)
  expect(codigo).not.toMatch(/\brequire\s*\(/)
  expect(codigo).not.toContain("from '@/")
  expect(codigo).not.toMatch(/\benum\b|\bnamespace\b|\bdeclare\b/)
})

test('4d2. la tabla de licenciatura se lee con cast: hay clones sin el bloque en su config.ts', () => {
  // `cfg.licenciaturas` a secas no compila en un clon cuyo config.ts no declara
  // la clave (SiteConfig = Widen<typeof CONFIG>). Todo acceso va por el helper.
  // Todo src/app. contenido/page.tsx lo CITA en un texto de la UI, no lo lee.
  const CITA = 'src/app/(dashboard)/admin/contenido/page.tsx'
  for (const archivo of archivosDe('src/app').filter((f) => f !== CITA)) {
    expect(sinComentarios(leer(archivo)), archivo).not.toMatch(/\b(cfg|config|CONFIG)\.licenciaturas\b/)
  }
  expect(leer(CITA)).toContain(' CONFIG.licenciaturas.carreras </span>')
  expect(tablaLicenciaturas({ licenciaturas: { activas: true, inscripcion: 1 } })).toEqual({ activas: true, inscripcion: 1 })
  expect(tablaLicenciaturas({})).toBeUndefined()
})

test('4e. con el CONFIG de ESTE repo, la inscripción de cualquier alumno es un número', () => {
  const cfg = CONFIG as unknown as { precios: Record<string, unknown>; licenciaturas?: Record<string, unknown> }
  for (const n of NIVELES) {
    expect(Number.isFinite(inscripcionDelAlumno(n, cfg.precios, cfg.licenciaturas)), String(n)).toBe(true)
    expect(Number.isFinite(certificacionDelAlumno(n, cfg.precios, cfg.licenciaturas)), String(n)).toBe(true)
  }
})
