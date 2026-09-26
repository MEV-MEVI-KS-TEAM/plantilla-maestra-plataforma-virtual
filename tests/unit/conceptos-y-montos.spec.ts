import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONCEPTOS_PROGRAMA, CONCEPTOS_PROGRAMA_LECTURA, CONCEPTOS_CURSO, esConceptoCurso, esConceptoPrograma,
  etiquetaConcepto, verticalDePago,
} from '@/lib/pagos/conceptos'
import * as inscripciones from '@/lib/cursos/inscripciones'
import { codigoMoneda, formatearMoneda, avisoMoneda, tieneEquivalencia, equivalenteMXN, type ConfigMoneda } from '@/lib/moneda'
import { mensajeRecibo } from '@/lib/whatsapp'

/**
 * Bloque D · D4 — etiquetas de concepto con una sola fuente (#207-1), el monto de
 * «Confirmar pago» con formato de moneda (#203) y la moneda guardada como objeto
 * sin tronar (A1, hallazgo coacma).
 */
const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
function archivos(dir: string): string[] {
  return readdirSync(join(raiz, dir)).flatMap(n => {
    const rel = `${dir}/${n}`
    return statSync(join(raiz, rel)).isDirectory() ? archivos(rel) : /\.(ts|tsx|mjs)$/.test(n) ? [rel] : []
  })
}

test('#207-1 · guardián: ningún mapa de conceptos fuera del módulo (había 6)', () => {
  const culpables = archivos('src').filter(f => f !== 'src/lib/pagos/conceptos.ts').filter(f => {
    const s = sinComentarios(leer(f))
    return /CONCEPTO_LABELS\s*[:=]/.test(s) || /\binscripcion\s*:\s*'[Ii]nscripci[oó]n'/.test(s) || /\bmensualidad\s*:\s*'[Mm]ensualidad'/.test(s)
  })
  expect(culpables).toEqual([])
})

test('#207-1 · las etiquetas del programa son EXACTAMENTE las de las copias que reemplaza', () => {
  expect(CONCEPTOS_PROGRAMA.map(c => etiquetaConcepto(c))).toEqual(['Inscripción', 'Mensualidad', 'Otro'])
  expect(['inscripcion', 'mensualidad', 'cuota_semanal', 'certificacion', 'otro'].map(c => etiquetaConcepto(c, 'mensaje')))
    .toEqual(['inscripción', 'mensualidad', 'cuota semanal', 'certificación', 'pago'])
  // El PDF ya no pinta crudos los del calendario semanal y la certificación.
  expect(etiquetaConcepto('cuota_semanal')).toBe('Cuota semanal')
  expect(etiquetaConcepto('certificacion')).toBe('Certificación')
  // Desconocido: tal cual (lo que hacían las copias con `?? p.concepto`); vacío sin concepto.
  expect(etiquetaConcepto('raro')).toBe('raro')
  expect(etiquetaConcepto(null)).toBe('')
})

test('#207-1 · cada concepto de curso tiene etiqueta propia, en TS y en la lista SQL de B3', () => {
  for (const c of CONCEPTOS_CURSO) {
    expect(etiquetaConcepto(c), c).not.toBe(c)
    expect(etiquetaConcepto(c, 'mensaje'), c).not.toBe(c)
  }
  const b3 = leer('supabase/migrations/20260730140000_b3_abrir_mes_y_pagos_curso.sql')
  const lista = /IF p_concepto NOT IN \(([^)]*)\)/.exec(b3)?.[1] ?? ''
  const sql = [...lista.matchAll(/'(\w+)'/g)].map(m => m[1]).sort()
  expect(sql).toEqual([...CONCEPTOS_CURSO].sort())
  // Los de curso nunca son del programa, y viceversa.
  for (const c of CONCEPTOS_CURSO) expect(esConceptoPrograma(c), c).toBe(false)
  for (const c of CONCEPTOS_PROGRAMA_LECTURA) expect(esConceptoCurso(c), c).toBe(false)
  // El mensaje del recibo nunca dice «de pago de pago».
  for (const c of CONCEPTOS_CURSO) {
    const m = mensajeRecibo({ alumnoNombre: 'Ana', conceptoLabel: etiquetaConcepto(c, 'mensaje'), montoFmt: '$1', url: 'u' })
    expect(m, c).not.toMatch(/pago de pago/)
  }
  // cursos/inscripciones.ts re-exporta lo MISMO (no una copia).
  expect(inscripciones.CONCEPTOS_CURSO).toBe(CONCEPTOS_CURSO)
  expect(inscripciones.esConceptoCurso).toBe(esConceptoCurso)
})

test('#207-1 · la vertical sale de la FK, no del concepto', () => {
  expect(verticalDePago({ curso_inscripcion_id: 'x' })).toBe('curso')
  expect(verticalDePago({ curso_inscripcion_id: null })).toBe('programa')
  expect(verticalDePago({})).toBe('programa')
})

test('#207-1 · los consumidores importan del módulo', () => {
  for (const f of ['src/app/(dashboard)/admin/alumnos/[id]/page.tsx', 'src/app/(dashboard)/admin/pagos/page.tsx',
    'src/app/(dashboard)/admin/reportes/page.tsx', 'src/app/api/admin/pagos/[id]/recibo/route.ts',
    'src/app/api/admin/reportes/excel/route.ts', 'src/lib/pdf/recibo-pago.tsx']) {
    expect(leer(f), f).toMatch(/import \{[^}]*\betiquetaConcepto\b[^}]*\} from '@\/lib\/pagos\/conceptos'/)
  }
  const api = sinComentarios(leer('src/app/api/admin/pagos/route.ts'))
  expect(api).toContain('const CONCEPTOS = CONCEPTOS_PROGRAMA')
  expect(sinComentarios(leer('src/app/api/admin/pagos/[id]/recibo/route.ts'))).toContain("etiquetaConcepto(pago.concepto ?? 'mensualidad', 'mensaje')")
})

test('#203 · «Confirmar pago» con el formato de moneda; sin monto si es 0 o alumno de curso', () => {
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain("{alumno.monto_inscripcion > 0 && alumno.nivel !== 'diplomado' ? (")
  expect(ficha).toContain("<span style={{ color: 'var(--color-acento)' }}>{fmtMoneda(alumno.monto_inscripcion)}</span>?")
  expect(ficha).toContain('¿Confirmas que el alumno ya cubrió su inscripción?')
  // La frase que usan la e2e del editor y el arnés, en la rama con monto.
  expect(ficha).toContain("¿Confirmas que el alumno pagó su inscripción de{' '}")
  // Nunca el número crudo con un «$» pegado.
  expect(ficha).not.toContain('${alumno.monto_inscripcion}')
  // fmtMoneda da lo que busca la e2e («$750»), con separador y decimales.
  const cfg: ConfigMoneda = { moneda: 'MXN', tipoCambioMXN: 0 }
  expect(formatearMoneda(750, cfg, { decimales: 2, conCodigo: true })).toBe('$750.00')
  expect(formatearMoneda(1800, cfg, { decimales: 2, conCodigo: true })).toBe('$1,800.00')
})

test('A1 · la moneda guardada como objeto (coacma) no truena: se normaliza a su código', () => {
  const coacma = { moneda: { codigo: 'USD', simbolo: '$', locale: 'en-US', etiqueta: 'USD' }, tipoCambioMXN: 17 } as unknown as ConfigMoneda
  expect(() => formatearMoneda(79, coacma, { decimales: 2, conCodigo: true })).not.toThrow()
  expect(formatearMoneda(79, coacma, { decimales: 2, conCodigo: true })).toBe('$79.00 USD')
  expect(avisoMoneda(coacma)).not.toBeNull()
  expect(tieneEquivalencia(coacma)).toBe(true)
  expect(() => equivalenteMXN(79, coacma)).not.toThrow()
  // Las formas que se aceptan, y el respaldo.
  expect(codigoMoneda('USD')).toBe('USD')
  expect(codigoMoneda(' usd ')).toBe('USD')
  expect(codigoMoneda({ code: 'mxn' })).toBe('MXN')
  // Otro código ISO se conserva (antes llegaba tal cual a Intl); lo que no es código, al respaldo.
  expect(codigoMoneda({ codigo: 'EUR' })).toBe('EUR')
  expect(codigoMoneda('eur')).toBe('EUR')
  expect(formatearMoneda(10, { moneda: 'EUR', tipoCambioMXN: 0 } as unknown as ConfigMoneda, { decimales: 2 }))
    .toBe(new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(10))
  expect(codigoMoneda('pesos')).toBe('MXN')
  expect(codigoMoneda({ codigo: 'dolares' }, 'USD')).toBe('USD')
  expect(codigoMoneda(undefined, 'USD')).toBe('USD')
  expect(codigoMoneda(null)).toBe('MXN')
  // Un objeto irreconocible no truena: cae al respaldo.
  const raro = { moneda: { foo: 1 }, tipoCambioMXN: 0 } as unknown as ConfigMoneda
  expect(formatearMoneda(10, raro, { decimales: 2 })).toBe('$10.00')
  // La etiqueta «Monto (…)» del modal «Registrar pago» de la ficha tampoco pinta el objeto.
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain('Monto ({codigoMoneda(CONFIG.moneda)})')
  expect(ficha).not.toContain('{CONFIG.moneda}')
})
