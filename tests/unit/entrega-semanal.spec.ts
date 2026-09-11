import { test, expect } from '@playwright/test'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import {
  planesDeNivel, planesSemanales, unPlanPorNivel, tablaPrecios, filasModalidades,
  frasesSemanales, lineasPreciosWhatsApp, ofertaInformativa,
} from '../../scripts/entrega/planes.mjs'
import { construirHTML, paleta } from '../../scripts/entrega/documento.mjs'
import { planesPorNivel } from '@/lib/modalidades'
import { CONFIG } from '@/lib/config'

/**
 * El Documento de Entrega Oficial de una escuela que cobra POR SEMANA.
 *
 * Con el generador mensual, el de EDUHCO (#197) decía «$250/mes» —una cuarta
 * parte de lo que cobra— y el de CAU (#200) habría dicho «Total del plan
 * $1,750» donde son $3,000, más una «Preparatoria 3 meses» que no existe. Es el
 * papel que el cliente archiva y le reenvía a su equipo.
 */

type Plan = {
  nivel: string
  plan: { id: string; meses: number; semanas: number; cuotaSemanal: number }
  colegiatura: number
  totalPlan: number
  total: number
}
type Mods = Parameters<typeof planesPorNivel>[1]

const NIVELES = ['secundaria', 'preparatoria']

// La oferta de CAU #200: un plan por nivel, y no el mismo.
const ASIMETRICA = {
  periodicidad: 'semanal',
  modalidades: [
    { id: '3_meses', label: '3 Meses', nivel: 'secundaria', meses: 3, semanas: 12, cuotaSemanal: 250, mensualidad: 250, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 Meses', nivel: 'preparatoria', meses: 6, semanas: 24, cuotaSemanal: 350, mensualidad: 350, materiasPorMes: 2, activa: true },
  ],
  ofertaPublica: {
    planesPersonalizados: [{ nivel: 'secundaria', meses: 2, semanas: 8, cuotaSemanal: 375 }],
    certificacionContraEntrega: ['preparatoria'],
    licenciaturas: [
      { area: 'Educación', programas: ['Pedagogía', 'Ciencias de la Educación'] },
      { area: 'Negocios', programas: ['Administración'] },
    ],
  },
}

// Dos planes que valen para todos los niveles: el alumno sí elige.
const SIMETRICA = {
  periodicidad: 'semanal',
  modalidades: [
    { id: '3_meses', label: '3 Meses', meses: 3, semanas: 13, cuotaSemanal: 300, mensualidad: 300, materiasPorMes: 4, activa: true },
    { id: '6_meses', label: '6 Meses', meses: 6, semanas: 26, cuotaSemanal: 200, mensualidad: 200, materiasPorMes: 2, activa: true },
    { id: '9_meses', label: '9 Meses', meses: 9, semanas: 39, cuotaSemanal: 150, mensualidad: 150, materiasPorMes: 2, activa: false },
  ],
}

const PRECIOS = { insc: () => 1000, cert: () => 3000 }
const planesDe = (config: object, precios = PRECIOS) =>
  planesSemanales(config, NIVELES, precios) as unknown as Plan[]
const todo = (x: unknown) => JSON.stringify(x)

test('solo se anuncian los planes que cada nivel vende', () => {
  // Nada de «Secundaria 6 meses» ni «Preparatoria 3 meses»: el producto
  // cartesiano niveles × modalidades los inventaba.
  const planes = planesDe(ASIMETRICA)
  expect(planes.map(p => `${p.nivel}-${p.plan.meses}`)).toEqual(['secundaria-3', 'preparatoria-6'])
  expect(unPlanPorNivel(planes, NIVELES)).toBe(true)
})

test('el total suma TODAS las cuotas semanales, no meses × cuota', () => {
  const [sec, prepa] = planesDe(ASIMETRICA)
  expect([sec.colegiatura, sec.totalPlan, sec.total]).toEqual([3000, 4000, 7000])
  expect([prepa.colegiatura, prepa.totalPlan, prepa.total]).toEqual([8400, 9400, 12400])
})

test('la tabla de precios: pagos semanales, total con certificación y nada de «/mes»', () => {
  const { cols, filas } = tablaPrecios(planesDe(ASIMETRICA), NIVELES)
  expect(cols).toEqual(['Concepto', 'Secundaria', 'Preparatoria'])
  expect(filas).toContainEqual(['Cuota semanal', '$250', '$350'])
  expect(filas).toContainEqual(['Número de pagos', '12 pagos semanales', '24 pagos semanales'])
  expect(filas).toContainEqual(['Total del plan (inscripción + cuotas)', '$4,000', '$9,400'])
  expect(filas).toContainEqual(['Certificación', '$3,000', '$3,000 (contra entrega)'])
  expect(filas).toContainEqual({ total: true, celdas: ['Costo total del programa (con certificación)', '$7,000', '$12,400'] })
  expect(todo(filas)).not.toMatch(/\/mes|mensualidad/i)
})

test('lo que no se cobra dice «Gratis» y sin certificación no hay fila de certificación', () => {
  const { filas } = tablaPrecios(planesDe(ASIMETRICA, { insc: () => 0, cert: () => 0 }), NIVELES)
  expect(filas).toContainEqual(['Inscripción (pago único)', 'Gratis', 'Gratis'])
  expect(todo(filas)).not.toContain('$0')
  expect(todo(filas)).not.toContain('Certificación')
  expect(filas).toContainEqual({ total: true, celdas: ['Costo total del programa', '$3,000', '$8,400'] })
})

test('un plan sin semanas o sin cuota no se anuncia', () => {
  const incompleta = {
    periodicidad: 'semanal',
    modalidades: [
      { ...ASIMETRICA.modalidades[0], cuotaSemanal: 0 },
      ASIMETRICA.modalidades[1],
    ],
  }
  expect(planesDe(incompleta).map(p => p.nivel)).toEqual(['preparatoria'])
})

test('con varios planes por nivel: una fila por plan, y el alumno sí elige', () => {
  const planes = planesDe(SIMETRICA)
  expect(planes).toHaveLength(4)  // el de 9 meses está apagado
  expect(unPlanPorNivel(planes, NIVELES)).toBe(false)
  const { cols, filas } = tablaPrecios(planes, NIVELES)
  expect(cols[0]).toBe('Plan')
  expect(filas[0]).toEqual(['Secundaria · 3 meses', '$1,000', '13 pagos semanales de $300', '$4,900', '$7,900'])
  expect(frasesSemanales(planes, NIVELES).notaModalidades).toContain('elige su plan')
  expect(lineasPreciosWhatsApp(planes, NIVELES).join('\n')).toContain('elige su plan')
})

test('el resumen de modalidades da la cuota a la semana, una fila por plan real', () => {
  expect(filasModalidades(planesDe(ASIMETRICA))).toEqual([
    ['Secundaria — plan 3 Meses', '3 meses · 12 semanas', '$250 a la semana', '4 materias por mes'],
    ['Preparatoria — plan 6 Meses', '6 meses · 24 semanas', '$350 a la semana', '2 materias por mes'],
  ])
})

test('las frases no prometen elegir plan donde lo trae el nivel', () => {
  const f = frasesSemanales(planesDe(ASIMETRICA), NIVELES)
  expect(f.frasePrecios).toContain('Secundaria en 3 meses y Preparatoria en 6 meses')
  expect(f.incluye).toBe('Secundaria en 3 meses y Preparatoria en 6 meses, con cobro semanal')
  expect(f.notaModalidades).toContain('no elige plan')
  expect(f.notaPrecios).toContain('Cobranza')
  expect(todo(f)).not.toMatch(/\/mes|mensualidad/i)
})

test('el mensaje de WhatsApp da cada plan en pagos semanales y su total', () => {
  const msg = lineasPreciosWhatsApp(planesDe(ASIMETRICA), NIVELES).join('\n')
  expect(msg).toContain('Secundaria — 3 meses')
  expect(msg).toContain('12 pagos semanales de $250')
  expect(msg).toContain('24 pagos semanales de $350')
  expect(msg).toContain('Certificación: $3,000 (contra entrega)')
  expect(msg).toContain('Total del programa: $7,000')
  expect(msg).toContain('Total del programa: $12,400')
  expect(msg).toContain('no elige plan')
  expect(msg).not.toMatch(/\/mes|mensualidad/i)
})

test('planesDeNivel aplica la misma regla que planesPorNivel de la plataforma', () => {
  // El generador no puede importar src/lib (alias @/): si una de las dos reglas
  // cambia y la otra no, el documento anuncia otra oferta que la plataforma.
  const ids = (xs: ReadonlyArray<{ id: string }>) => xs.map(m => m.id)
  for (const nivel of NIVELES) {
    expect(ids(planesDeNivel(ASIMETRICA, nivel))).toEqual(ids(planesPorNivel(nivel, ASIMETRICA.modalidades as unknown as Mods)))
    expect(ids(planesDeNivel(SIMETRICA, nivel))).toEqual(ids(planesPorNivel(nivel, SIMETRICA.modalidades as unknown as Mods)))
  }
  for (const nivel of CONFIG.niveles as readonly string[])
    expect(ids(planesDeNivel(CONFIG, nivel))).toEqual(ids(planesPorNivel(nivel)))
})

test('lo que la página anuncia sin venderlo en línea se cuenta; sin eso, nada', () => {
  expect(ofertaInformativa(ASIMETRICA)).toEqual({
    personalizados: ['Secundaria 2 meses (8 pagos semanales de $375)'],
    programas: 3,
    areas: 2,
  })
  expect(ofertaInformativa({})).toBeNull()
  expect(ofertaInformativa({ ofertaPublica: { planesPersonalizados: [], licenciaturas: [] } })).toBeNull()
})

/* ── Documento: lo que CAU destapó en documento.mjs ────────────────────────── */

function documento(extra: Record<string, unknown> = {}) {
  return construirHTML({
    nombre: 'CAU', nombreCompleto: 'CENTRO ACADÉMICO UNIÓN', marcaEncabezado: '<b>CAU</b>',
    tagline: '', taglineCierre: '', colores: { primario: '#6B4700', acento: '#6B4700' },
    url: 'https://centroacademicounion.online', adminNombre: 'Sergio Olvera',
    adminEmail: 'admin@cliente.com', adminPassword: 'x', contenido: [], incluye: ['Programa'],
    frasePrograma: 'tu centro en línea', fraseIntro: '', frasePrecios: '', notaPrecios: '',
    preciosCols: ['Concepto'], preciosFilas: [], funcionalidad: [], modalidadesCols: ['Modalidad'],
    modalidadesFilas: [], notaModalidades: '', cursosPublicados: 0, validez: false,
    soporte: { horario: '', respuesta: '', canal: '' }, tutoriales: [], primerosPasos: [],
    palabraInstitucion: 'centro académico', logoData: null, isotipoData: null, infra: null,
    fuentes: { tituloCSS: 'serif', cuerpoCSS: 'sans-serif', link: '' },
    ...extra,
  })
}

test('sin eslogan no se imprimen comillas vacías y el pie lleva el nombre', () => {
  const html = documento()
  expect(html).not.toContain('""')
  expect(html).toContain('<div class="ftr">CENTRO ACADÉMICO UNIÓN</div>')
  // Con eslogan, todo como siempre.
  const con = documento({ tagline: 'Aprende a tu ritmo', taglineCierre: 'Aprende a tu ritmo' })
  expect(con).toContain('"Aprende a tu ritmo"')
  expect(con).toContain('<div class="ftr">Aprende a tu ritmo</div>')
})

test('una marca de un solo tono no deja el documento sin números de página', () => {
  // CAU usa la misma tinta de primario y de acento: el número de página iba en
  // acento sobre la banda, a contraste 1.0.
  expect(paleta({ primario: '#6B4700', acento: '#6B4700' }).acentoSobreBanda).toBe('#FFFFFF')
  // Donde el acento sí se lee sobre la banda, no cambia nada.
  expect(paleta({ primario: '#0F172A', acento: '#FFB800' }).acentoSobreBanda).toBe('#FFB800')
})

test('varios alumnos de prueba: cada uno con su nivel y SU matrícula', () => {
  const html = documento({
    alumnosPrueba: [
      { email: 'prueba@gmail.com', password: '12345678', nivel: 'secundaria', matricula: 'CAU-2026-0002' },
      { email: 'prepa@gmail.com', password: '12345678', nivel: 'preparatoria', matricula: 'CAU-2026-0001' },
    ],
  })
  expect(html).toContain('Alumno de prueba — Secundaria')
  expect(html).toContain('prueba@gmail.com / 12345678 · matrícula CAU-2026-0002')
  expect(html).toContain('prepa@gmail.com / 12345678 · matrícula CAU-2026-0001')
  expect(html).not.toContain('Matrícula del alumno')
  // Con un solo alumno, la tabla de accesos es la de siempre.
  const uno = documento({ alumnoEmail: 'prueba@gmail.com', alumnoPassword: '12345678', matricula: 'MEV-2026-0001' })
  expect(uno).toContain('Matrícula del alumno')
})
