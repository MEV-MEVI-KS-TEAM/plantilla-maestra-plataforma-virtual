import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  etiquetaDuracionModalidad,
  getDefaultModalidadId,
  getDuracionOferta,
  getLabelByModalidad,
  getMateriasPorMesByModalidad,
  getMesesByModalidad,
  getModalidadesPrimaria,
  modalidadPorNivel,
  planesDeclaradosPorNivel,
  planesPorNivel,
  primariaActiva,
} from '@/lib/modalidades'
import { calcularDisponibilidad, materiasPorMesDePlan, type MateriaVentana } from '@/lib/acceso-materias'
import { catalogoDeRegistro, getOpcionesNivel, nivelesPermitidos } from '@/lib/niveles'
import { validarCorreccionPlan, NIVELES_CORREGIBLES } from '@/lib/corregir-plan'
import { certificacionDelAlumno, getPlanNombre, inscripcionDelAlumno } from '@/lib/licenciatura-utils'
import {
  AVISO_MENORES_FABRICA,
  LIMITES_PRI,
  certificacionPrimariaDe,
  inscripcionPrimariaDe,
  preciosDePrimaria,
  primariaEfectiva,
  textoAvisoMenores,
} from '@/lib/precios-primaria'
import { certificacionDe, inscripcionDe, totalPlanDe } from '@/lib/precios-nivel'
import {
  EDAD_MAYORIA,
  MENSAJES_EDAD_TUTOR as M,
  edadEnAnios,
  fechaValida,
  pideEdadYTutor,
  revisarEdadTutor,
} from '@/lib/registro-reglas'
import { CLAVES_EDITABLES, mergeSiteConfig, toLandingConfig } from '@/lib/site-config-core'
import { recortarOverrides, validarOverrides } from '@/lib/site-config-validacion'
import { hayCambiosDePreciosOPlanes, hayCambiosDePrimaria, ofrecePrimaria } from '@/lib/site-config-editor'
import { restaurarDiseno } from '@/lib/site-config-restaurar'
import { NIVELES } from '@/lib/estructura-contenido'
import {
  filasModalidadesMensual,
  frasesMensuales,
  lineasPreciosMensualWhatsApp,
  nivelesSinPlanes,
  planesDeNivel,
  tablaPreciosMensual,
} from '../../scripts/entrega/planes.mjs'

/**
 * El nivel Primaria (18 materias, planes de 3, 6 y 9 meses).
 *
 * Dos promesas: con el add-on APAGADO, que es como nace la plantilla, nada cambia;
 * y con el add-on ENCENDIDO, las tres modalidades abren exactamente lo que dice el
 * plan aprobado (tests/unit/fixtures/primaria-plan.json, copia de
 * banco-materias-sec-prepa/primaria/plan.json).
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const PLAN = JSON.parse(leer('tests/unit/fixtures/primaria-plan.json')) as {
  orden_apertura: string[]
  modalidades: Record<string, { meses: number; materias_por_mes: number }>
  tablas_apertura: Record<string, string[][]>
}

type ConPrimaria = { primaria: Record<string, unknown>; niveles: readonly string[]; modalidades: readonly { activa: boolean }[] }

/** Enciende Primaria solo durante `fn`. Los helpers leen CONFIG al llamarse. */
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

type TablaPrueba = { activa: boolean; inscripcion: number; certificacion: number; avisoMenores: string; modalidades: { id: string; mensualidad: number }[] }
const tablaEncendida = () => ({ ...(CONFIG as unknown as ConPrimaria).primaria, activa: true }) as unknown as TablaPrueba

// ─── Apagado: un combo sin Primaria queda igual ──────────────────────────────

test('1. la plantilla nace con Primaria apagada y sin nada de ella en la oferta', () => {
  expect(primariaActiva()).toBe(false)
  expect(ofrecePrimaria()).toBe(false)
  expect(getOpcionesNivel(false).map(o => o.value)).not.toContain('primaria')
  expect(nivelesPermitidos(false)).not.toContain('primaria')
  expect(catalogoDeRegistro().niveles).not.toContain('primaria')
  expect(getModalidadesPrimaria()).toEqual([])
  expect(planesDeclaradosPorNivel('primaria')).toEqual([])
  expect(CONFIG.niveles).toEqual(['secundaria', 'preparatoria', 'licenciatura'])
})

test('2. apagada, los helpers responden lo de siempre aunque llegue un id _pri', () => {
  // El respaldo de un id desconocido sigue siendo el primer plan del programa.
  expect(getMesesByModalidad('3_meses_pri')).toBe(CONFIG.modalidades[0].meses)
  expect(getMateriasPorMesByModalidad('3_meses_pri')).toBe(CONFIG.modalidades[0].materiasPorMes)
  expect(getDefaultModalidadId()).toBe(CONFIG.modalidades[0].id)
  expect(getLabelByModalidad('3_meses_pri')).toBe('3_meses_pri')
  expect(getDuracionOferta()).toBe('3 o 6 meses')
  // Sec/Prepa no se mueven.
  expect(getMateriasPorMesByModalidad('3_meses')).toBe(4)
  expect(getMateriasPorMesByModalidad('6_meses')).toBe(2)
  expect(CONFIG.modalidades.map(m => m.id)).toEqual(['3_meses', '6_meses'])
})

test('3. apagada, el registro no pide edad ni tutor y «Corregir plan» rechaza Primaria', () => {
  for (const nivel of ['primaria', 'secundaria', 'preparatoria', 'licenciatura', 'diplomado', null]) {
    expect(pideEdadYTutor(nivel, primariaActiva()), String(nivel)).toBe(false)
  }
  expect(NIVELES_CORREGIBLES).toEqual(['secundaria', 'preparatoria', 'licenciatura'])
  expect(validarCorreccionPlan({ nivel: 'primaria', carrera: null, modalidad: '3_meses_pri' }).ok).toBe(false)
})

test('4. apagada, el merge no toca el bloque y la landing no recibe nada nuevo', () => {
  const sinNada = mergeSiteConfig(CONFIG, {}) as unknown as { primaria: unknown }
  expect(sinNada.primaria).toEqual((CONFIG as unknown as ConPrimaria).primaria)
  // Aunque la fila traiga precios: sin add-on nadie los vería.
  const conFila = mergeSiteConfig(CONFIG, { primaria: { inscripcion: 900 } }) as unknown as { primaria: { inscripcion: number } }
  expect(conFila.primaria.inscripcion).toBe(599)
  expect('primaria' in toLandingConfig(mergeSiteConfig(CONFIG, {}))).toBe(false)
  const res = validarOverrides({ primaria: { inscripcion: 900 } }, mergeSiteConfig(CONFIG, {}))
  expect(res.ok).toBe(false)
})

// ─── Modalidades ─────────────────────────────────────────────────────────────

test('5. encendida, los tres planes resuelven su duración y su ritmo', () => {
  conPrimaria(() => {
    for (const [id, p] of Object.entries(PLAN.modalidades)) {
      expect(getMesesByModalidad(id), id).toBe(p.meses)
      expect(getMateriasPorMesByModalidad(id), id).toBe(p.materias_por_mes)
      expect(etiquetaDuracionModalidad(id), id).toBe(`${p.meses} meses`)
    }
    expect(getLabelByModalidad('9_meses_pri')).toBe('9 meses — Extendido')
    // Sec/Prepa siguen en lo suyo, encendida o no.
    expect(getMateriasPorMesByModalidad('3_meses')).toBe(4)
    expect(getMateriasPorMesByModalidad('6_meses')).toBe(2)
  })
})

test('6. encendida, Primaria no ve los planes de Sec/Prepa ni al revés', () => {
  conPrimaria(() => {
    expect(planesPorNivel('primaria')).toEqual([])
    expect(planesDeclaradosPorNivel('primaria')).toEqual(['3_meses_pri', '6_meses_pri', '9_meses_pri'])
    expect(planesDeclaradosPorNivel('secundaria')).toEqual(['3_meses', '6_meses'])
    expect(planesPorNivel('secundaria').map(m => m.id)).toEqual(['3_meses', '6_meses'])
    expect(modalidadPorNivel('primaria')).toBeUndefined()
    expect(catalogoDeRegistro().planes.primaria).toEqual(['3_meses_pri', '6_meses_pri', '9_meses_pri'])
    expect(getOpcionesNivel(false).map(o => o.value)).toContain('primaria')
  })
})

test('7. combo SOLO Primaria: sin planes del programa, los respaldos salen de los suyos', () => {
  conPrimaria(() => {
    expect(getDefaultModalidadId()).toBe('3_meses_pri')
    expect(getMesesByModalidad(null)).toBe(3)
    expect(getMateriasPorMesByModalidad(null)).toBe(6)
    expect(getDuracionOferta()).toBe('3, 6 o 9 meses')
    expect(getOpcionesNivel(false).map(o => o.value)).toEqual(['primaria'])
    const cfg = { modalidades: CONFIG.modalidades.map(m => ({ ...m, activa: false })), primaria: tablaEncendida() }
    expect(planesDeNivel(cfg, 'primaria').map((m: { id: string }) => m.id)).toEqual(['3_meses_pri', '6_meses_pri', '9_meses_pri'])
  }, { niveles: ['primaria'], modalidades: CONFIG.modalidades.map(m => ({ ...m, activa: false })) })
})

test('8. el documento de entrega usa la misma regla que la plataforma', () => {
  const apagada = { modalidades: CONFIG.modalidades, primaria: { ...tablaEncendida(), activa: false } }
  expect(planesDeNivel(apagada, 'primaria')).toEqual([])
  const encendida = { modalidades: CONFIG.modalidades, primaria: tablaEncendida() }
  expect(planesDeNivel(encendida, 'primaria')).toHaveLength(3)
  // Y Sec/Prepa no se enteran.
  expect(planesDeNivel(encendida, 'secundaria').map((m: { id: string }) => m.id)).toEqual(['3_meses', '6_meses'])
  const gen = leer('scripts/entrega/generar-entrega.mjs')
  expect(gen).toContain("CONFIG.modo !== 'solo_cursos' && CONFIG.primaria?.activa !== true")
})

test('8b. las tablas del documento de entrega incluyen a Primaria con sus cifras', () => {
  const cfg = { modalidades: CONFIG.modalidades, primaria: tablaEncendida(), precios: CONFIG.precios, ofreceCertificacion: true }
  const niveles = ['primaria', 'secundaria', 'preparatoria']
  const precios = {
    insc: (n: string) => (n === 'primaria' ? 750 : 599),
    mens: (_: string, m: { mensualidad: number }) => m.mensualidad,
    cert: (n: string) => (n === 'primaria' ? 3000 : 4900),
  }
  expect(nivelesSinPlanes(cfg, niveles)).toEqual([])
  const tabla = JSON.stringify(tablaPreciosMensual(cfg, niveles, precios))
  expect(tabla).toContain('9 meses')
  expect(tabla).toContain('$750')
  const filas = JSON.stringify(filasModalidadesMensual(cfg, niveles, { mens: precios.mens, ritmo: () => 'r' }))
  expect(filas).toContain('9 meses')
  expect(() => frasesMensuales(cfg, niveles, precios)).not.toThrow()
  expect(lineasPreciosMensualWhatsApp(cfg, niveles, precios).join('\n')).toContain('Primaria')
})

test('8c. un combo solo Primaria publica sin toparse con «al menos una modalidad activa»', () => {
  conPrimaria(() => {
    const base = mergeSiteConfig(CONFIG, {})
    const r = validarOverrides({ nombre: 'Escuela', primaria: { inscripcion: 800 } }, base)
    expect(r.ok, JSON.stringify(r)).toBe(true)
  }, { niveles: ['primaria'], modalidades: CONFIG.modalidades.map(m => ({ ...m, activa: false })) })
})

// ─── La ventana: 18 materias, tres cortes de una sola lista ──────────────────

const materiasDelPlan = (): MateriaVentana[] => PLAN.orden_apertura.map((codigo, i) => ({
  id: codigo, nombre: codigo, nivel: 'primaria', orden: 25 + i, numero_mes: Math.ceil((i + 1) / 2),
}))

test('9. cada modalidad abre, mes a mes, exactamente la tabla del plan', () => {
  conPrimaria(() => {
    const materias = materiasDelPlan()
    for (const [id, p] of Object.entries(PLAN.modalidades)) {
      const base = { nivel: 'primaria', modalidad: id, duracion_meses: p.meses }
      expect(materiasPorMesDePlan(base, 18), id).toBe(p.materias_por_mes)
      const abiertasAntes = new Set<string>()
      expect(PLAN.tablas_apertura[id], id).toHaveLength(p.meses)
      PLAN.tablas_apertura[id].forEach((fila, i) => {
        const mes = i + 1
        fila.forEach(c => abiertasAntes.add(c))
        const disp = calcularDisponibilidad({ ...base, meses_desbloqueados: mes }, materias, new Set())
        const abiertas = materias.filter(m => disp.get(m.id)).map(m => m.id)
        expect(new Set(abiertas), `${id} mes ${mes}`).toEqual(abiertasAntes)
      })
      expect(abiertasAntes.size, `${id}: al final abre las 18`).toBe(18)
    }
  })
})

test('10. sin registrar la tabla, un plan _pri se quedaría en 12 de 18 (la clase del Bug 121)', () => {
  // El caso que justifica los ids propios: con el ritmo de Sec/Prepa no termina.
  const materias = materiasDelPlan()
  const disp = calcularDisponibilidad({ nivel: 'primaria', modalidad: '3_meses_pri', duracion_meses: 3, meses_desbloqueados: 3 }, materias, new Set())
  expect([...disp.values()].filter(Boolean)).toHaveLength(12)
})

// ─── Menores ─────────────────────────────────────────────────────────────────

const HOY = '2026-11-04'
const MENOR = { fecha_nacimiento: '2012-03-10', tutor_nombre: 'Rosa López', tutor_telefono: '33 1234 5678', tutor_parentesco: 'Madre' }

test('11. la edad se cuenta bien, también el día del cumpleaños', () => {
  expect(edadEnAnios('2008-11-04', HOY)).toBe(18)
  expect(edadEnAnios('2008-11-05', HOY)).toBe(17)
  expect(edadEnAnios('2012-02-29', '2026-02-28')).toBe(13)
  expect(edadEnAnios('2012-02-29', '2026-03-01')).toBe(14)
  expect(fechaValida('2026-02-30')).toBeNull()
  expect(fechaValida('04/11/2012')).toBeNull()
  expect(fechaValida(' 2012-11-04 ')).toBe('2012-11-04')
  expect(EDAD_MAYORIA).toBe(18)
})

test('12. solo se pide en combos con Primaria, a alumnos de Primaria y Secundaria', () => {
  expect(pideEdadYTutor('primaria', true)).toBe(true)
  expect(pideEdadYTutor('secundaria', true)).toBe(true)
  for (const nivel of ['preparatoria', 'licenciatura', 'diplomado', null, undefined]) {
    expect(pideEdadYTutor(nivel, true), String(nivel)).toBe(false)
  }
})

test('13. un menor necesita los tres datos del tutor, y se guardan limpios', () => {
  const ok = revisarEdadTutor(MENOR, 'secundaria', HOY)
  expect(ok).toEqual({
    ok: true,
    datos: { fecha_nacimiento: '2012-03-10', tutor_nombre: 'Rosa López', tutor_telefono: '3312345678', tutor_parentesco: 'Madre' },
  })
  const falta = (cambio: object) => revisarEdadTutor({ ...MENOR, ...cambio }, 'secundaria', HOY)
  expect(falta({ fecha_nacimiento: '' })).toEqual({ ok: false, error: M.sinFecha })
  expect(falta({ fecha_nacimiento: '2026-02-30' })).toEqual({ ok: false, error: M.sinFecha })
  expect(falta({ fecha_nacimiento: '2030-01-01' })).toEqual({ ok: false, error: M.fechaFutura })
  expect(falta({ tutor_nombre: ' ' })).toEqual({ ok: false, error: M.sinTutorNombre })
  expect(falta({ tutor_telefono: '123' })).toEqual({ ok: false, error: M.sinTutorTelefono })
  expect(falta({ tutor_parentesco: 'Vecino' })).toEqual({ ok: false, error: M.sinParentesco })
})

test('14. un mayor de edad no guarda datos de tutor aunque lleguen', () => {
  expect(revisarEdadTutor({ ...MENOR, fecha_nacimiento: '2008-11-04' }, 'secundaria', HOY)).toEqual({
    ok: true,
    datos: { fecha_nacimiento: '2008-11-04', tutor_nombre: null, tutor_telefono: null, tutor_parentesco: null },
  })
})

test('15. las dos puertas validan ANTES de crear la cuenta', () => {
  const registro = leer('src/app/(auth)/register/page.tsx')
  expect(registro.indexOf('revisarEdadTutor({')).toBeGreaterThan(-1)
  expect(registro.indexOf('revisarEdadTutor({')).toBeLessThan(registro.indexOf('supabase.auth.signUp('))
  const alta = leer('src/app/api/admin/alumnos/route.ts')
  expect(alta.indexOf('revisarEdadTutor(body')).toBeGreaterThan(-1)
  expect(alta.indexOf('revisarEdadTutor(body')).toBeLessThan(alta.indexOf('admin.auth.admin.createUser('))
  // Y el servidor público la repite: el formulario se puede saltar.
  const servidor = leer('src/app/api/auth/register-complete/route.ts')
  expect(servidor).toContain('pideEdadYTutor(nivel, primariaActiva())')
  expect(servidor.indexOf('revisarEdadTutor(body')).toBeLessThan(servidor.indexOf(".from('alumnos')"))
})

test('16. el aviso de privacidad habla de menores solo con Primaria, y el párrafo se puede editar', () => {
  const aviso = leer('src/app/(legal)/aviso-de-privacidad/page.tsx')
  expect(aviso).toContain('const CON_MENORES = primariaActiva()')
  expect(aviso).toContain('textoAvisoMenores(tablaPrimaria(cfg))')
  expect(CLAVES_EDITABLES).toContain('primaria.avisoMenores')
  expect(textoAvisoMenores(tablaEncendida())).toBe(AVISO_MENORES_FABRICA)
  expect(textoAvisoMenores({ ...tablaEncendida(), avisoMenores: '  Propio.  ' })).toBe('Propio.')
  expect(AVISO_MENORES_FABRICA).toContain('consentimiento')
})

// ─── Documentos ──────────────────────────────────────────────────────────────

test('17. Primaria pide acta, CURP, identificación y domicilio; nunca un certificado', () => {
  const pagina = leer('src/app/(dashboard)/alumno/documentos/page.tsx')
  const lista = /const TIPOS_PRIMARIA: DocTipo\[\] = \[([\s\S]*?)\]/.exec(pagina)?.[1] ?? ''
  expect([...lista.matchAll(/'([a-z_]+)'/g)].map(m => m[1])).toEqual(['acta_nacimiento', 'curp', 'identificacion_oficial', 'comprobante_domicilio'])
  // Se elige antes del respaldo, que sigue siendo Preparatoria.
  expect(pagina.indexOf("plan.includes('rimaria')")).toBeLessThan(pagina.indexOf(': TIPOS_PREPA'))
  const ruta = leer('src/app/api/alumno/documentos/route.ts')
  expect(ruta).toContain("a.nivel === 'primaria'     ? 'Primaria'")
  expect(ruta).toContain("'comprobante_domicilio'")
  // Los lugares donde vive un tipo de documento. El filtro del panel lo recibe de
  // `documentosSoloPrimaria()`: sin el add-on no lo ve ni viaja en su chunk (V12).
  for (const f of [
    'src/app/(dashboard)/alumno/documentos/page.tsx',
    'src/app/api/alumno/documentos/route.ts',
    'src/app/(dashboard)/admin/alumnos/[id]/page.tsx',
    'src/lib/modalidades.ts',
    'src/lib/config.ts',
  ]) {
    expect(/comprobante_domicilio|Comprobante de Domicilio/.test(leer(f)), f).toBe(true)
  }
  const ficha = leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx')
  expect(ficha).toContain("alumno.nivel === 'primaria' ? DOC_TIPOS_PRIMARIA : DOC_TIPOS")
  // La lista de siempre no gana un documento nuevo.
  const siempre = /const DOC_TIPOS: DocTipo\[\] = \[([\s\S]*?)\]/.exec(ficha)?.[1] ?? ''
  expect(siempre).not.toContain('comprobante_domicilio')
  // La etiqueta no se escribe en la página del panel: es lo que la mete en el chunk.
  expect(leer('src/app/(dashboard)/admin/documentos/page.tsx')).not.toContain('Comprobante de Domicilio')
})

// ─── Precios ─────────────────────────────────────────────────────────────────

test('18. los precios sugeridos son los de Secundaria, y cada plan cubre lo suyo', () => {
  const t = (CONFIG as unknown as { primaria: { inscripcion: number; certificacion: number; modalidades: { id: string; mensualidad: number; materiasPorMes: number; meses: number }[] } }).primaria
  expect(t.inscripcion).toBe(CONFIG.precios.inscripcion)
  expect(t.certificacion).toBe(CONFIG.precios.certificacionSecundaria)
  expect(t.modalidades.map(m => [m.id, m.mensualidad])).toEqual([['3_meses_pri', 2000], ['6_meses_pri', 1000], ['9_meses_pri', 700]])
  for (const m of t.modalidades) expect(m.meses * m.materiasPorMes, m.id).toBe(18)
})

test('19. el merge publica sobre la tabla y nunca muta la de config.ts', () => {
  const pri = tablaEncendida()
  expect(primariaEfectiva(pri, undefined)).toBe(pri)
  expect(primariaEfectiva(pri, {})).toBe(pri)
  const ef = primariaEfectiva(pri, { inscripcion: 750, certificacion: 3000, modalidades: { '3_meses_pri': { mensualidad: 1800 }, nope: { mensualidad: 1 } } }) as TablaPrueba
  expect(ef).not.toBe(pri)
  expect(ef.inscripcion).toBe(750)
  expect(ef.certificacion).toBe(3000)
  expect(ef.modalidades.map(m => m.mensualidad)).toEqual([1800, 1000, 700])
  expect(pri.modalidades[0].mensualidad).toBe(2000)
  // Lo que el panel no publicaría se ignora.
  for (const malo of [0, -1, 1.5, '900', LIMITES_PRI.precioMax + 1, null]) {
    expect(primariaEfectiva(pri, { inscripcion: malo }), String(malo)).toBe(pri)
  }
})

test('20. un alumno de Primaria paga lo de su tabla; los demás, lo de siempre', () => {
  const precios = { inscripcion: 500, certificacionSecundaria: 4900, certificacionPreparatoria: 5900 }
  const pri = { activa: true, inscripcion: 750, certificacion: 3000 }
  expect(inscripcionDelAlumno('primaria', precios, null, pri)).toBe(750)
  expect(certificacionDelAlumno('primaria', precios, null, pri)).toBe(3000)
  // Sin tabla NUNCA la certificación de Preparatoria (el fallback silencioso).
  expect(certificacionDelAlumno('primaria', precios, null)).toBe(0)
  expect(certificacionDelAlumno('primaria', precios, null, { activa: false, certificacion: 3000 })).toBe(0)
  // El cuarto parámetro no mueve a nadie más.
  for (const n of ['secundaria', 'preparatoria', 'diplomado', null]) {
    expect(inscripcionDelAlumno(n, precios, null, pri), String(n)).toBe(inscripcionDelAlumno(n, precios, null))
    expect(certificacionDelAlumno(n, precios, null, pri), String(n)).toBe(certificacionDelAlumno(n, precios, null))
  }
  expect(inscripcionPrimariaDe({ activa: false, inscripcion: 750 })).toBeNull()
  expect(certificacionPrimariaDe({ activa: true, certificacion: 'x' })).toBeNull()
})

test('21. las tarjetas de portada resuelven Primaria con su tabla', () => {
  const precios = { inscripcion: 500, certificacionPreparatoria: 5900, certificacion_preparatoria: 5900 }
  const p = preciosDePrimaria(precios, { activa: true, inscripcion: 750, certificacion: 3000 })
  expect(inscripcionDe('primaria', p)).toBe(750)
  expect(certificacionDe('primaria', p)).toBe(3000)
  expect(totalPlanDe('primaria', { meses: 9, mensualidad: 700 }, p)).toBe(750 + 9 * 700)
  // Apagada: el mismo objeto, sin copia.
  expect(preciosDePrimaria(precios, { activa: false })).toBe(precios)
  expect(precios.inscripcion).toBe(500)
})

test('22. el panel valida y recorta los precios de Primaria', () => {
  conPrimaria(() => {
    const base = mergeSiteConfig(CONFIG, {})
    const ok = validarOverrides({
      primaria: { inscripcion: 800, certificacion: 3000, modalidades: { '6_meses_pri': { mensualidad: 900 } }, avisoMenores: 'Texto propio.' },
    }, base)
    expect(ok.ok, JSON.stringify(ok)).toBe(true)
    if (ok.ok) {
      expect(ok.overrides.primaria).toEqual({ inscripcion: 800, certificacion: 3000, modalidades: { '6_meses_pri': { mensualidad: 900 } }, avisoMenores: 'Texto propio.' })
    }
    const fuera = (primaria: object) => validarOverrides({ primaria }, base).ok
    expect(fuera({ inscripcion: 0 })).toBe(false)
    expect(fuera({ modalidades: { '3_meses': { mensualidad: 900 } } })).toBe(false)
    expect(fuera({ modalidades: { '3_meses_pri': { materiasPorMes: 9 } } })).toBe(false)
    expect(fuera({ activa: false })).toBe(false)
    expect(fuera({ avisoMenores: 'x'.repeat(LIMITES_PRI.avisoMenoresMax + 1) })).toBe(false)
    // Lo escrito a mano fuera de rango no vuelve en el siguiente guardado.
    const rec = recortarOverrides({ primaria: { inscripcion: -5, certificacion: 3000, modalidades: { '9_meses_pri': { mensualidad: 650 }, nope: { mensualidad: 1 } } } }, base)
    expect(rec.primaria).toEqual({ certificacion: 3000, modalidades: { '9_meses_pri': { mensualidad: 650 } } })
    // Publicado, sí llega a la landing.
    const conFila = mergeSiteConfig(CONFIG, { primaria: { inscripcion: 800 } })
    expect((conFila as unknown as { primaria: { inscripcion: number } }).primaria.inscripcion).toBe(800)
    expect(toLandingConfig(conFila).primaria).toBeDefined()
  })
})

test('23. el modal de precios cuenta Primaria, pero no el párrafo del aviso', () => {
  expect(hayCambiosDePrimaria({}, { primaria: { inscripcion: 800 } })).toBe(true)
  expect(hayCambiosDePreciosOPlanes({}, { primaria: { inscripcion: 800 } })).toBe(true)
  expect(hayCambiosDePrimaria({}, { primaria: { avisoMenores: 'x' } })).toBe(false)
  expect(hayCambiosDePreciosOPlanes({}, { primaria: { avisoMenores: 'x' } })).toBe(false)
})

test('24. «Restaurar diseño» conserva los precios y el texto legal de Primaria', () => {
  const fila = { primaria: { inscripcion: 800, avisoMenores: 'Propio.', modalidades: { '3_meses_pri': { mensualidad: 900 } } }, colores: { primario: '#000000' } }
  const r = restaurarDiseno(fila) as { primaria: unknown; colores?: unknown }
  expect(r.primaria).toEqual(fila.primaria)
  expect(r.colores).toBeUndefined()
})

// ─── «Corregir plan» ─────────────────────────────────────────────────────────

test('25. encendida, «Corregir plan» acepta Primaria solo con un plan suyo', () => {
  conPrimaria(() => {
    // Mayor de edad: la fecha basta (el tutor lo prueba primaria-revision.spec.ts).
    const adulto = { fecha_nacimiento: '1990-01-01' }
    expect(validarCorreccionPlan({ nivel: 'primaria', carrera: null, modalidad: '6_meses_pri', ...adulto }))
      .toEqual({ ok: true, plan: {
        nivel: 'primaria', carrera: null, modalidad: '6_meses_pri',
        edadTutor: { fecha_nacimiento: '1990-01-01', tutor_nombre: null, tutor_telefono: null, tutor_parentesco: null },
      } })
    expect(validarCorreccionPlan({ nivel: 'primaria', carrera: null, modalidad: '3_meses' }).ok).toBe(false)
    expect(validarCorreccionPlan({ nivel: 'secundaria', carrera: null, modalidad: '3_meses_pri' }).ok).toBe(false)
    expect(validarCorreccionPlan({ nivel: 'secundaria', carrera: null, modalidad: '3_meses', ...adulto }).ok).toBe(true)
  })
})

// ─── Etiquetas ───────────────────────────────────────────────────────────────

test('26. Primaria se llama Primaria en todo el panel', () => {
  expect(getPlanNombre('primaria')).toBe('Primaria')
  expect(NIVELES).toContain('primaria')
  expect(leer('src/app/api/alumno/constancia/route.ts')).toContain("if (nivel === 'primaria')     return 'PRIM'")
  expect(leer('src/components/layout/sidebar.tsx')).toContain("nivel === 'primaria' ? 'Primaria'")
  expect(leer('src/app/(dashboard)/alumno/materias/page.tsx')).toContain("data?.nivel === 'primaria' ? 'Primaria'")
  expect(leer('src/app/(dashboard)/admin/page.tsx')).toContain("nivel === 'primaria' || ['secundaria'")
})

// ─── Instalación ─────────────────────────────────────────────────────────────

test('27. la migración es aditiva, por catálogo y fail-closed', () => {
  const sql = leer('supabase/migrations/20261104120000_nivel_primaria.sql').replace(/--.*$/gm, '')
  expect(sql).toMatch(/^\s*BEGIN;/m)
  expect(sql).toMatch(/^\s*COMMIT;\s*$/m)
  expect(sql).toContain('conkey = ARRAY[v_attnum]')
  expect(sql).toContain("con forma desconocida")
  // Sin tocar filas: ni UPDATE ni DELETE sobre datos.
  expect(sql).not.toMatch(/\bUPDATE\s+public\./i)
  expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i)
  // `duracion_meses` se inyecta en la expresión vigente, y sin ELSE 6 aborta.
  expect(sql).toContain("strpos(v_expr, 'ELSE 6') = 0")
  for (const id of ['3_meses_pri', '6_meses_pri', '9_meses_pri']) expect(sql, id).toContain(id)
  for (const col of ['fecha_nacimiento', 'tutor_nombre', 'tutor_telefono', 'tutor_parentesco']) {
    expect(sql, col).toContain(`ADD COLUMN IF NOT EXISTS ${col}`)
  }
  // La fecha va después de las que recrean los CHECK con lista cerrada.
  for (const previa of ['20260730120000', '20260812120000', '20260820120000', '20261021120000']) {
    expect('20261104120000' > previa, previa).toBe(true)
  }
})

test('28. los dos instaladores traen lo mismo que la migración', () => {
  for (const f of ['scripts/schema.sql', 'supabase/schema.sql']) {
    const s = leer(f)
    for (const x of ["'primaria'", "'3_meses_pri'", "'6_meses_pri'", "'9_meses_pri'", 'tutor_nombre', 'tutor_telefono', 'tutor_parentesco', 'fecha_nacimiento']) {
      expect(s, `${x} en ${f}`).toContain(x)
    }
  }
})

test('29. el contenido de Primaria NO va en setup.sql: corre después de las migraciones', () => {
  const setup = leer('scripts/setup.sql')
  expect(setup).not.toMatch(/primaria/i)
  const pri = leer('scripts/setup-primaria.sql')
  expect(pri).toContain('\\set ON_ERROR_STOP on')
  expect(pri).toContain('20261104120000_nivel_primaria.sql')
  const pos = (s: string) => { const k = pri.indexOf(s); expect(k, s).toBeGreaterThan(-1); return k }
  expect(pos('\\i seed-primaria.sql')).toBeLessThan(pos('\\i seed-actividades-primaria.sql'))
  expect(pos('\\i seed-actividades-primaria.sql')).toBeLessThan(pos('\\i post-setup-primaria-check.sql'))
})

test('30. la auditoría de Primaria exige los conteos del plan, y el orden de apertura', () => {
  const c = leer('scripts/post-setup-primaria-check.sql')
  expect(c).toContain('COUNT(*) = 18')
  expect(c).toContain('COUNT(*) = 144')
  expect(c).toContain('COUNT(*) = 432')
  expect(c).toContain('COUNT(*) = 180')
  expect(c).toContain('HAVING COUNT(p.id) <> 10')
  // Sin video no es falla: se publican después.
  const videos = c.slice(c.indexOf('P12: Videos'))
  expect(videos).not.toContain('❌')
  expect(PLAN.orden_apertura).toHaveLength(18)
})

test('31. precios-primaria.ts sigue siendo puro: lo importa el PDF de entrega', () => {
  expect(leer('src/lib/precios-primaria.ts')).not.toMatch(/^\s*import\s/m)
})

test('32. ninguna materia de Primaria se confunde con un tutorial', () => {
  // `esTutorial` regala la materia si el nombre incluye «tutor».
  const plan = JSON.parse(leer('tests/unit/fixtures/primaria-plan.json')) as { materias: { nombre: string }[] }
  expect(plan.materias).toHaveLength(18)
  for (const m of plan.materias) expect(m.nombre.toLowerCase(), m.nombre).not.toContain('tutor')
})
