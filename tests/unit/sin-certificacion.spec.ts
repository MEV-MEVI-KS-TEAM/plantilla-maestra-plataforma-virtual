import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// El generador de la entrega es JS puro, sin tipos: se prueba tal cual corre.
import {
  certificacionEntrega, frasesMensuales, frasesSemanales, lineasPreciosMensualWhatsApp, lineasPreciosWhatsApp,
  ofreceCertificacion, planesSemanales, tablaPrecios, tablaPreciosMensual,
} from '../../scripts/entrega/planes.mjs'
import { certificacionDe, inscripcionDe, mensualidadDe } from '@/lib/precios-nivel'
import { escuelaCertifica } from '@/lib/precios-ui'

/**
 * A6 · «Sin certificación, no se anuncia certificación» (#165, parte A).
 *
 * Con `ofreceCertificacion: false` (hoy, CEIJ) las dos portadas y el PDF y el
 * WhatsApp de entrega seguían anunciando «Certificación $5,500», totales «(con
 * certificación)», la nota «… + certificación» y la sección de validez. Los
 * precios de certificación SIGUEN en el config (los leen pagos y reportes): lo
 * que se apaga es el anuncio. Sin la clave, todo queda EXACTAMENTE igual.
 */

// El vocabulario que una escuela sin certificación no puede usar (Nota 199).
const VETADO = /certificad|certificaci|validez oficial|\bSEP\b|apostilla|CENEVAL/i

type Precios = Record<string, unknown>
type Config = Record<string, unknown> & { precios: Precios; modalidades: Record<string, unknown>[]; niveles: string[] }
const NIVELES = ['secundaria', 'preparatoria']

/** Los precios de CEIJ (issue #165): certificación 4,500 y 5,500 en el config, aunque no certifica. */
const PRECIOS: Precios = {
  inscripcion: 499, inscripcionSecundaria: null, inscripcionPreparatoria: null,
  mensualidadSecundaria3Meses: null, mensualidadSecundaria6Meses: null,
  mensualidadPreparatoria3Meses: null, mensualidadPreparatoria6Meses: null,
  certificacionSecundaria: 4500, certificacionPreparatoria: 5500,
  secundaria_3meses_normal: 3000, secundaria_6meses_normal: 1500,
  preparatoria_3meses_normal: 3000, preparatoria_6meses_normal: 1500,
}
const MENSUAL = [
  { id: '3_meses', label: '3 meses — Express', meses: 3, mensualidad: 3000, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 meses — Estándar', meses: 6, mensualidad: 1500, materiasPorMes: 2, activa: true },
]
const SEMANAL = [
  { id: '3_meses', label: '3 Meses', meses: 3, semanas: 12, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 4, activa: true },
  { id: '6_meses', label: '6 Meses', meses: 6, semanas: 24, cuotaSemanal: 150, mensualidad: 150, materiasPorMes: 2, activa: true },
]
const escuela = (extra: Record<string, unknown>, modalidades = MENSUAL): Config =>
  ({ niveles: NIVELES, modalidades, precios: PRECIOS, ...extra })

/** Los resolvers que usa la entrega, con la certificación YA gateada por la bandera. */
const resolvers = (c: Config) => ({
  insc: (n: string) => inscripcionDe(n, c.precios),
  mens: (n: string, m: { meses: number; mensualidad: number }) => mensualidadDe(n, m, c.precios),
  cert: certificacionEntrega(c, certificacionDe),
})
/** Lo mismo, con el resolver de SIEMPRE (sin bandera): la referencia de «sin cambios». */
const resolversDeSiempre = (c: Config) => ({ ...resolvers(c), cert: (n: string) => certificacionDe(n, c.precios) })

const salidaMensual = (c: Config, r = resolvers(c)) => JSON.stringify({
  tabla: tablaPreciosMensual(c, NIVELES, r),
  frases: frasesMensuales(c, NIVELES, r),
  whatsapp: lineasPreciosMensualWhatsApp(c, NIVELES, r),
})
const salidaSemanal = (c: Config, r = resolvers(c)) => {
  const planes = planesSemanales(c, NIVELES, r)
  return JSON.stringify({ tabla: tablaPrecios(planes, NIVELES), frases: frasesSemanales(planes, NIVELES), whatsapp: lineasPreciosWhatsApp(planes, NIVELES) })
}

test.describe('la bandera', () => {
  test('solo `false` apaga la certificación; sin la clave, sí certifica', () => {
    expect(ofreceCertificacion({ ofreceCertificacion: false })).toBe(false)
    expect(ofreceCertificacion({ ofreceCertificacion: true })).toBe(true)
    expect(ofreceCertificacion({})).toBe(true)
    expect(ofreceCertificacion(undefined)).toBe(true)
    expect(escuelaCertifica({ ofreceCertificacion: false })).toBe(false)
    expect(escuelaCertifica({})).toBe(true)
    expect(escuelaCertifica({ ofreceCertificacion: 'false' })).toBe(true)
  })
})

test.describe('entrega: una escuela que NO certifica no la anuncia', () => {
  test('mensual: ni fila, ni «(con certificación)», ni nota, ni WhatsApp', () => {
    const c = escuela({ ofreceCertificacion: false })
    expect(certificacionEntrega(c, certificacionDe)('preparatoria')).toBe(0)
    const s = salidaMensual(c)
    expect(s).not.toMatch(VETADO)
    // Y el total sigue siendo el del plan (inscripción + mensualidades), sin «Gratis».
    expect(s).not.toContain('Gratis')
    expect(frasesMensuales(c, NIVELES, resolvers(c)).notaPrecios).toContain('El total suma inscripción + mensualidades del plan.')
  })

  test('semanal: tampoco', () => {
    const c = escuela({ ofreceCertificacion: false, periodicidad: 'semanal' }, SEMANAL)
    expect(salidaSemanal(c)).not.toMatch(VETADO)
  })

  test('los precios de certificación siguen en el config: se apaga el ANUNCIO, no el dato', () => {
    const c = escuela({ ofreceCertificacion: false })
    expect(certificacionDe('preparatoria', c.precios)).toBe(5500)
  })
})

test.describe('entrega: con la bandera en true o sin la clave, salida idéntica a la de siempre', () => {
  for (const [nombre, extra] of [['sin la clave', {}], ['en true', { ofreceCertificacion: true }]] as const) {
    test(`mensual ${nombre}`, () => {
      const c = escuela(extra)
      expect(salidaMensual(c)).toBe(salidaMensual(c, resolversDeSiempre(c)))
      expect(salidaMensual(c)).toContain('Certificación')
      expect(frasesMensuales(c, NIVELES, resolvers(c)).notaPrecios).toContain('+ certificación')
    })
    test(`semanal ${nombre}`, () => {
      const c = escuela({ ...extra, periodicidad: 'semanal' }, SEMANAL)
      expect(salidaSemanal(c)).toBe(salidaSemanal(c, resolversDeSiempre(c)))
    })
  }
})

test('guardián: el generador usa el resolver gateado y la validez exige certificación', () => {
  const gen = readFileSync(join(process.cwd(), 'scripts/entrega/generar-entrega.mjs'), 'utf8')
  expect(gen).toContain('const cert = certificacionEntrega(CONFIG, certificacionDe)')
  expect(gen).toContain('const VALIDEZ = D.validez !== false && CERTIFICA')
  // Ninguna otra lectura suelta de la validez que se salte la certificación.
  expect(gen.match(/D\.validez !== false/g)?.length).toBe(1)
})

test('guardián: las dos portadas preguntan escuelaCertifica() antes de anunciar certificación', () => {
  const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8')
  const clasica = leer('src/components/landing/LandingClient.tsx')
  expect(clasica).toContain('const certifica = escuelaCertifica()')
  expect(clasica).not.toMatch(/^\s*\{ label: 'Certificación'/m)
  expect(clasica.match(/\.\.\.\(certifica \? \[\{ label: 'Certificación'/g)?.length).toBe(2)
  const animada = leer('src/components/landing/animada/LandingAnimada.tsx')
  expect(animada).toContain('const certifica = escuelaCertifica()')
  expect(animada).toContain('const certificacion = certifica ? certificacionDe(nivel, precios) : 0')
  expect(animada).toMatch(/\{certifica && \(\s*<div data-la-reveal className="mt-14/)
})
