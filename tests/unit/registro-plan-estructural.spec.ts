import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  errorDePlanDeRegistro, modalidadDeRegistro, MENSAJES_PLAN_REGISTRO as M, type CatalogoRegistro,
} from '@/lib/registro-reglas'
import { catalogoDeRegistro, getOpcionesNivel, nivelDeOpcion, esOpcionDiplomadoLic } from '@/lib/niveles'
import { planesPorNivel, planesDeclaradosPorNivel, getModalidadesLicenciatura, type ModalidadPrograma } from '@/lib/modalidades'
import { getCarrerasLicenciatura, getCarrerasDiplomado } from '@/lib/licenciatura-utils'

/**
 * Bloque D · D5 — #199: el registro público valida nivel, plan y carrera contra
 * lo que el formulario PUDO ofrecer (regla estructural de config.ts, sin mirar
 * «activa»), antes de escribir nada. Y los huecos hermanos: nivel que la escuela
 * no vende, Sec/Prepa/Lic sin plan, carrera inválida que se volvía NULL.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// Un catálogo de escuela asimétrica: Secundaria solo 3 meses, Preparatoria 3 o 6,
// licenciatura con su tabla. Independiente del config.ts de la plantilla.
const CAT: CatalogoRegistro = {
  niveles: ['secundaria', 'preparatoria', 'licenciatura'],
  planes: { secundaria: ['3_meses'], preparatoria: ['3_meses', '6_meses'], licenciatura: ['6_meses_lic', '12_meses'] },
  carreras: ['derecho', 'diplomado-docencia'],
}
const pide = (nivel: unknown, modalidad: string | null, carrera: string | null = null) =>
  errorDePlanDeRegistro({ nivel, modalidad, carrera }, CAT)

test('#199 · el caso del issue: Secundaria con el plan de licenciatura → 400', () => {
  expect(pide('secundaria', '6_meses_lic')).toBe(M.modalidad)
  // Y los de siempre de la misma familia: un plan de otro nivel.
  expect(pide('secundaria', '6_meses')).toBe(M.modalidad)
  expect(pide('licenciatura', '3_meses', 'derecho')).toBe(M.modalidad)
  // Lo que sí corresponde pasa.
  expect(pide('secundaria', '3_meses')).toBeNull()
  expect(pide('preparatoria', '6_meses')).toBeNull()
  expect(pide('licenciatura', '12_meses', 'derecho')).toBeNull()
  expect(pide('licenciatura', '6_meses_lic', 'diplomado-docencia')).toBeNull()
})

test('#199 · huecos hermanos: nivel no vendido, sin plan, carrera', () => {
  // Nivel que la escuela no vende (o que ni existe).
  expect(errorDePlanDeRegistro({ nivel: 'preparatoria', modalidad: '6_meses', carrera: null },
    { ...CAT, niveles: ['secundaria'] })).toBe(M.nivel)
  expect(pide('maestria', '6_meses')).toBe(M.nivel)
  expect(pide('', '3_meses')).toBe(M.nivel)
  expect(pide(7, '3_meses')).toBe(M.nivel)
  expect(pide({ nivel: 'secundaria' }, '3_meses')).toBe(M.nivel)
  // Sec/Prepa/Lic sin plan: el mismo mensaje que el formulario.
  expect(pide('secundaria', null)).toBe(M.sinModalidad)
  expect(pide('licenciatura', null, 'derecho')).toBe(M.sinModalidad)
  // Licenciatura sin carrera o con una que no está: antes se volvía NULL en silencio.
  expect(pide('licenciatura', '12_meses', null)).toBe(M.sinCarrera)
  expect(pide('licenciatura', '12_meses', 'medicina')).toBe(M.carrera)
  // Fuera de licenciatura la carrera no se juzga (el servidor la guarda NULL).
  expect(pide('secundaria', '3_meses', 'medicina')).toBeNull()
})

test('#199 · no juzga lo que cubren otras reglas: sin nivel, curso, solo_cursos', () => {
  // Solo curso de ingreso: la regla plan-o-curso de la ruta.
  expect(pide(null, null)).toBeNull()
  expect(pide(undefined, null)).toBeNull()
  // «Curso o diplomado» (y solo_cursos, que siempre fuerza 'diplomado'): el curso publicado.
  expect(pide('diplomado', null)).toBeNull()
  // Sin nivel, un plan no se guarda: no es de ningún programa.
  expect(modalidadDeRegistro(null, '3_meses', null)).toBeNull()
  expect(modalidadDeRegistro(null, ' 6_meses_lic ', null)).toBeNull()
})

test('#199 · la regla es ESTRUCTURAL: los planes apagados de config.ts siguen valiendo', () => {
  const mods = [
    { id: '3_meses', label: '3', meses: 3, mensualidad: 1, materiasPorMes: 4, activa: false },
    { id: '6_meses', label: '6', meses: 6, mensualidad: 1, materiasPorMes: 2, activa: true, nivel: 'preparatoria' },
  ] as unknown as readonly ModalidadPrograma[]
  // Apagado: el formulario NO lo ofrece hoy, pero pudo ofrecerlo a quien abrió la página antes.
  expect(planesDeclaradosPorNivel('secundaria', mods)).toEqual(['3_meses'])
  expect(planesDeclaradosPorNivel('preparatoria', mods)).toEqual(['3_meses', '6_meses'])
  expect(planesDeclaradosPorNivel('diplomado', mods)).toEqual([])
  expect(planesDeclaradosPorNivel(null, mods)).toEqual([])
  // config.ts legado con modalidades en texto (['3_meses', '6_meses']): no declara planes con id,
  // y el formulario tampoco le ofrece ninguno (filtra por `activa`).
  const legado = ['3_meses', '6_meses'] as unknown as readonly ModalidadPrograma[]
  expect(planesDeclaradosPorNivel('secundaria', legado)).toEqual([])
  expect(planesPorNivel('secundaria', legado)).toEqual([])
})

test('#199 · todo lo que el formulario de ESTA plantilla puede ofrecer pasa, con cualquier «activa» del panel', () => {
  const cat = catalogoDeRegistro()
  expect(cat.niveles).not.toContain('diplomado')
  // El panel publica `activa` por id: se prueba con todo encendido (el máximo que puede pintar).
  const todoEncendido = (CONFIG.modalidades as readonly ModalidadPrograma[]).map(m => ({ ...m, activa: true }))
  let combos = 0
  for (const o of getOpcionesNivel(true)) {
    if (o.nivel === 'diplomado') { expect(errorDePlanDeRegistro({ nivel: 'diplomado', modalidad: null, carrera: null }, cat)).toBeNull(); continue }
    const esLic = o.nivel === 'licenciatura'
    const planes = esLic ? getModalidadesLicenciatura() : planesPorNivel(nivelDeOpcion(o.value), todoEncendido)
    const carreras = esLic ? (esOpcionDiplomadoLic(o.value) ? getCarrerasDiplomado() : getCarrerasLicenciatura()).map(c => c.slug) : [null]
    for (const p of planes) for (const c of carreras) {
      combos++
      expect(errorDePlanDeRegistro({ nivel: nivelDeOpcion(o.value), modalidad: p.id, carrera: c }, cat), `${o.value}/${p.id}/${c}`).toBeNull()
    }
  }
  expect(combos).toBeGreaterThan(0)
})

test('#199 · con licenciaturas y diplomados del riel activos, todo lo que el formulario ofrece también pasa', () => {
  // La plantilla trae el add-on apagado: se enciende aquí (y se restaura) para
  // recorrer la rama de licenciatura con las MISMAS funciones que usa el formulario.
  const cfg = CONFIG as unknown as { licenciaturas?: unknown }
  const antes = cfg.licenciaturas
  cfg.licenciaturas = {
    activas: true,
    carreras: [
      { slug: 'derecho', nombre: 'Derecho' },
      { slug: 'diplomado-docencia', nombre: 'Docencia', esDiplomado: true },
    ],
    modalidades: [
      { id: '12_meses', label: '12', meses: 12, mensualidad: 1, materiasPorMes: 3, activa: true },
      { id: '6_meses_lic', label: '6', meses: 6, mensualidad: 1, materiasPorMes: 5, activa: false },
    ],
  }
  try {
    const cat = catalogoDeRegistro()
    expect(cat.niveles).toContain('licenciatura')
    // Estructural: el plan apagado también vale.
    expect(cat.planes.licenciatura).toEqual(['12_meses', '6_meses_lic'])
    let lic = 0
    for (const o of getOpcionesNivel(true).filter(x => x.nivel === 'licenciatura')) {
      const carreras = (esOpcionDiplomadoLic(o.value) ? getCarrerasDiplomado() : getCarrerasLicenciatura()).map(c => c.slug)
      expect(carreras.length, o.value).toBeGreaterThan(0)
      for (const p of getModalidadesLicenciatura()) for (const c of carreras) {
        lic++
        expect(errorDePlanDeRegistro({ nivel: 'licenciatura', modalidad: p.id, carrera: c }, cat), `${o.value}/${p.id}/${c}`).toBeNull()
      }
    }
    // «Licenciatura» y «Diplomados» (diplomado_lic), cada uno con su carrera.
    expect(lic).toBe(2)
    // Y lo que no cabe se sigue rechazando.
    expect(errorDePlanDeRegistro({ nivel: 'licenciatura', modalidad: '3_meses', carrera: 'derecho' }, cat)).toBe(M.modalidad)
    expect(errorDePlanDeRegistro({ nivel: 'licenciatura', modalidad: '12_meses', carrera: 'medicina' }, cat)).toBe(M.carrera)
  } finally {
    cfg.licenciaturas = antes
  }
})

test('#199 · los mensajes del 400 no mandan a recargar: la cuenta ya existe (#217)', () => {
  for (const m of [M.nivel, M.modalidad, M.carrera]) {
    expect(m).not.toMatch(/[Rr]ecarga/)
    expect(m).toContain('comunícate con la escuela')
  }
})

test('#199 · la ruta valida ANTES de escribir nada y responde 400', () => {
  const src = sinComentarios(leer('src/app/api/auth/register-complete/route.ts'))
  expect(src).toContain("import { catalogoDeRegistro } from '@/lib/niveles'")
  expect(src).toMatch(/const errorPlan = errorDePlanDeRegistro\(\s*\{ nivel, modalidad, carrera: carreraPedida \|\| null \},\s*catalogoDeRegistro\(\),\s*\)\s*if \(errorPlan\) \{\s*return Response\.json\(\{ error: errorPlan \}, \{ status: 400 \}\)/)
  // Antes de la primera escritura (usuarios) y de cualquier consulta al admin.
  const i = src.indexOf('errorDePlanDeRegistro(')
  expect(i).toBeGreaterThan(0)
  expect(i).toBeLessThan(src.indexOf("from('usuarios')"))
  expect(i).toBeLessThan(src.indexOf('createAdminClient()'))
})
