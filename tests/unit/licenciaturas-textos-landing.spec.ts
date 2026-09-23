import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig } from '@/lib/site-config-core'
import { validarOverrides } from '@/lib/site-config-validacion'
import {
  resolverTextosLicenciaturas,
  textosAutoLicenciaturas,
} from '@/components/landing/animada/textos-licenciatura'
import type { DesgloseLicenciatura } from '@/lib/licenciatura-utils'

/**
 * Textos editables de la sección de licenciaturas (TICKET-2026-09-22-08,
 * CONECTM EDU). Vacío = el texto automático de siempre; el nombre de carrera
 * editado es solo el VISIBLE en la tarjeta (se casa por slug, no lo cambia).
 */

const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`

const CARRERAS = [
  { slug: 'derecho', nombre: 'Licenciatura en Derecho', desc: 'Desc. derecho.' },
  { slug: 'administracion', nombre: 'Licenciatura en Administración', desc: 'Desc. admin.' },
]

const PLAN = (meses: number, mensualidad: number): DesgloseLicenciatura => ({
  modalidadId: `${meses}_meses`,
  etiqueta: `${meses} meses`,
  meses,
  mensualidad,
  inscripcion: 1500,
  colegiatura: meses * mensualidad,
  titulacion: 20000,
  total: 1500 + meses * mensualidad + 20000,
}) as DesgloseLicenciatura

const PLANES = [PLAN(12, 1200), PLAN(18, 1000)]
const AUTO = textosAutoLicenciaturas(CARRERAS, PLANES, 'Licenciatura', fmt)

test('los automáticos son los textos de siempre, con la inscripción calculada', () => {
  expect(AUTO.kicker).toBe('Nivel superior')
  expect(AUTO.titulo).toBe('Licenciaturas')
  expect(AUTO.bajada).toBe('Dos carreras con título y cédula profesional, 100% en línea, con planes de 12 o 18 meses.')
  expect(AUTO.pasos).toHaveLength(4)
  expect(AUTO.pasos[0]).toEqual({ titulo: 'Inscríbete', desc: `Inscripción única de ${fmt(1500)}.` })
  expect(AUTO.pasos[1].desc).toBe('12 o 18 meses, según tu ritmo.')
  expect(AUTO.carreras.derecho).toEqual({ nombre: 'Licenciatura en Derecho', desc: 'Desc. derecho.' })
})

test('sin overrides (o vacíos) se pinta exactamente lo automático', () => {
  expect(resolverTextosLicenciaturas(AUTO, undefined)).toEqual(AUTO)
  expect(resolverTextosLicenciaturas(AUTO, {})).toEqual(AUTO)
  expect(resolverTextosLicenciaturas(AUTO, {
    licenciaturas_kicker: '', licenciaturas_titulo: '   ', licenciaturas_subtitulo: '',
    licenciaturas_carreras: [], licenciaturas_pasos: [],
  })).toEqual(AUTO)
})

test('cada texto propio reemplaza SOLO su campo; los vacíos conservan el automático', () => {
  const r = resolverTextosLicenciaturas(AUTO, {
    licenciaturas_kicker: 'Universidad',
    licenciaturas_subtitulo: 'Estudia en {nombre}.',
    licenciaturas_carreras: [{ slug: 'derecho', nombre: 'Derecho Corporativo', desc: '' }],
    licenciaturas_pasos: [{ titulo: '', desc: 'Paga tu inscripción.' }, { titulo: 'Escoge', desc: '' }],
  }, (s) => s.replace('{nombre}', 'CONECTM'))
  expect(r.kicker).toBe('Universidad')
  expect(r.titulo).toBe(AUTO.titulo)
  expect(r.bajada).toBe('Estudia en CONECTM.')
  // Nombre visible cambia; la descripción vacía se queda con la del config.
  expect(r.carreras.derecho).toEqual({ nombre: 'Derecho Corporativo', desc: 'Desc. derecho.' })
  expect(r.carreras.administracion).toEqual(AUTO.carreras.administracion)
  expect(r.pasos[0]).toEqual({ titulo: 'Inscríbete', desc: 'Paga tu inscripción.' })
  expect(r.pasos[1]).toEqual({ titulo: 'Escoge', desc: AUTO.pasos[1].desc })
  expect(r.pasos[2]).toEqual(AUTO.pasos[2])
  expect(r.pasos[3]).toEqual(AUTO.pasos[3])
})

test('una carrera con slug que ya no existe en el config se ignora (no agrega tarjetas)', () => {
  const r = resolverTextosLicenciaturas(AUTO, {
    licenciaturas_carreras: [{ slug: 'medicina', nombre: 'Medicina', desc: 'x' }],
  })
  expect(Object.keys(r.carreras).sort()).toEqual(['administracion', 'derecho'])
  expect(r.carreras).toEqual(AUTO.carreras)
})

test('la plantilla trae las claves vacías (= automático) y el merge las aplica', () => {
  expect(CONFIG.landing.licenciaturas_kicker).toBe('')
  expect(CONFIG.landing.licenciaturas_carreras).toEqual([])
  const cfg = mergeSiteConfig(CONFIG, {
    landing: {
      licenciaturas_titulo: 'Nuestras carreras',
      licenciaturas_carreras: [{ slug: 'derecho', nombre: 'Derecho', desc: '' }],
      licenciaturas_pasos: [{ titulo: 'Regístrate', desc: '' }],
    },
  })
  expect(cfg.landing.licenciaturas_titulo).toBe('Nuestras carreras')
  expect(cfg.landing.licenciaturas_carreras).toEqual([{ slug: 'derecho', nombre: 'Derecho', desc: '' }])
  expect(cfg.landing.licenciaturas_pasos).toEqual([{ titulo: 'Regístrate', desc: '' }])
  // Un elemento malformado rechaza la lista entera (fail-closed del merge).
  const malo = mergeSiteConfig(CONFIG, { landing: { licenciaturas_carreras: [{ slug: 'derecho' }] } })
  expect(malo.landing.licenciaturas_carreras).toEqual([])
})

test('la API acepta campos vacíos en carreras y pasos (vacío = automático) y exige el slug', () => {
  const base = mergeSiteConfig(CONFIG, {})
  const ok = validarOverrides({
    landing: {
      licenciaturas_kicker: '',
      licenciaturas_carreras: [{ slug: 'derecho', nombre: 'Derecho', desc: '' }],
      licenciaturas_pasos: [{ titulo: '', desc: 'Texto propio' }],
    },
  }, base)
  expect(ok.ok).toBe(true)

  const sinSlug = validarOverrides({ landing: { licenciaturas_carreras: [{ slug: '', nombre: 'X', desc: '' }] } }, base)
  expect(sinSlug.ok).toBe(false)

  const cincoPasos = validarOverrides({
    landing: { licenciaturas_pasos: Array.from({ length: 5 }, () => ({ titulo: 'a', desc: 'b' })) },
  }, base)
  expect(cincoPasos.ok).toBe(false)

  // No abre `licenciaturas.*`: el producto (carreras reales, precios) sigue fuera.
  const producto = validarOverrides({ licenciaturas: { activas: true } }, base)
  expect(producto.ok).toBe(false)
})
