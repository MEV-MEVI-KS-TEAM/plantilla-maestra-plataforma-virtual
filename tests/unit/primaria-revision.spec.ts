import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { NIVELES, nivelesValidos, validarMateria } from '@/lib/estructura-contenido'
import {
  EDAD_MINIMA_PRIMARIA,
  MENSAJES_EDAD_TUTOR as M,
  revisarEdadTutor,
} from '@/lib/registro-reglas'

/**
 * Segunda ronda de Primaria, tras la revisión adversarial: lo que un combo SIN
 * Primaria no debe notar (condición dura) y lo que un alumno CON Primaria no debe ver.
 * Cada bloque corresponde a un hallazgo de esa revisión.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')

type ConPrimaria = { primaria: Record<string, unknown>; niveles: readonly string[]; modalidades: readonly { activa: boolean }[] }

function conPrimaria<T>(fn: () => T, cambios: Partial<ConPrimaria> = {}): T {
  const cfg = CONFIG as unknown as ConPrimaria
  const antes = { primaria: cfg.primaria, niveles: cfg.niveles, modalidades: cfg.modalidades }
  cfg.primaria = { ...antes.primaria, activa: true }
  cfg.niveles = ['primaria', 'secundaria', 'preparatoria']
  Object.assign(cfg, cambios)
  try {
    return fn()
  } finally {
    Object.assign(cfg, antes)
  }
}

const HOY = '2026-11-04'
const TUTOR = { tutor_nombre: 'Rosa López', tutor_telefono: '33 1234 5678', tutor_parentesco: 'Madre' }

// ─── Condición dura: add-on apagado ──────────────────────────────────────────

test('A1. materia de Primaria con el add-on apagado: el mismo 400 y el mismo texto que en main', () => {
  const r = validarMateria({ nombre: 'Lengua', nivel: 'primaria' }, { crear: true })
  expect(r).toEqual({ ok: false, error: 'nivel debe ser uno de: secundaria, preparatoria, demo, licenciatura' })
  expect(nivelesValidos()).toEqual(['secundaria', 'preparatoria', 'demo', 'licenciatura'])
  // `NIVELES` sigue siendo el CHECK de la base, que sí admite el valor.
  expect(NIVELES).toContain('primaria')
})

test('A2. con el add-on encendido, la materia de Primaria se acepta', () => {
  conPrimaria(() => {
    const r = validarMateria({ nombre: 'Lengua', nivel: 'primaria' }, { crear: true })
    expect(r.ok).toBe(true)
    expect(nivelesValidos()).toContain('primaria')
  })
})

test('A3. el comprobante de domicilio solo se recibe con el add-on encendido', () => {
  const ruta = leer('src/app/api/alumno/documentos/route.ts')
  expect(ruta).toContain("...(primariaActiva() ? ['comprobante_domicilio'] : [])")
  // Y ya no está en la lista que vale siempre.
  const lista = ruta.slice(ruta.indexOf('const tiposValidos'), ruta.indexOf('if (!tiposValidos'))
  expect(lista.replace("...(primariaActiva() ? ['comprobante_domicilio'] : [])", '')).not.toContain('comprobante_domicilio')
})

// ─── Edad mínima ─────────────────────────────────────────────────────────────

test('E1. Primaria rechaza a menores de 12 con un mensaje claro y respetuoso', () => {
  expect(EDAD_MINIMA_PRIMARIA).toBe(12)
  // 11 años: un día antes de cumplir 12.
  expect(revisarEdadTutor({ ...TUTOR, fecha_nacimiento: '2014-11-05' }, 'primaria', HOY))
    .toEqual({ ok: false, error: M.menorDeDoce })
  expect(M.menorDeDoce).toContain('12 años en adelante')
  // El día que los cumple ya pasa.
  expect(revisarEdadTutor({ ...TUTOR, fecha_nacimiento: '2014-11-04' }, 'primaria', HOY).ok).toBe(true)
})

test('E2. Secundaria conserva su regla: con 11 años pasa si trae tutor', () => {
  expect(revisarEdadTutor({ ...TUTOR, fecha_nacimiento: '2015-01-01' }, 'secundaria', HOY).ok).toBe(true)
  // Una fecha imposible sigue siendo error de fecha, también en Primaria.
  expect(revisarEdadTutor({ ...TUTOR, fecha_nacimiento: '2026-10-01' }, 'primaria', HOY))
    .toEqual({ ok: false, error: M.fechaFutura })
})

test('E3. registro público y alta manual le pasan el nivel a la regla', () => {
  expect(leer('src/app/(auth)/register/page.tsx')).toContain('}, nivelDeOpcion(nivel))')
  expect(leer('src/app/(dashboard)/admin/alumnos/page.tsx')).toContain('revisarEdadTutor(form, form.nivel)')
  expect(leer('src/app/api/auth/register-complete/route.ts')).toContain('revisarEdadTutor(body as DatosEdadTutor, nivel)')
  expect(leer('src/app/api/admin/alumnos/route.ts')).toContain('revisarEdadTutor(body as DatosEdadTutor, nivelElegido)')
})

// ─── Videos y logs ───────────────────────────────────────────────────────────

test('V1. update-videos sin --nivel no toca Primaria; con --nivel primaria sí', () => {
  const s = leer('scripts/update-videos.mjs')
  expect(s).toContain("const nivelFilter = nivelArg ? `&nivel=eq.${nivelArg}` : '&or=(nivel.is.null,nivel.neq.primaria)'")
})

test('L1. el perfil no manda a los logs la fila de alumnos, que trae fecha y tutor', () => {
  const ruta = leer('src/app/api/alumno/perfil/route.ts')
  expect(ruta).not.toContain('JSON.stringify(data)')
  expect(ruta).not.toContain('JSON.stringify(data2)')
})
