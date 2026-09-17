import { test, expect } from '@playwright/test'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import {
  unirConY, soloLicenciaturas, titulacionAparte, desglosesLicenciatura,
  porcentajeTitulacionTexto, nombrarProgramas,
} from '../../scripts/entrega/licenciaturas.mjs'
import { construirHTML } from '../../scripts/entrega/documento.mjs'

/**
 * El Documento de Entrega Oficial de una escuela con licenciaturas cuya
 * titulación se cobra aparte.
 *
 * INSPIRA #203 y UVEP #209 publican en su página el costo completo —la
 * titulación es más de la mitad— y el documento que archivaban decía «Total del
 * plan $26,400» (solo la colegiatura), «Certificación profesional» y «tus 3
 * programas de pago único» para licenciaturas que se pagan mes a mes. Se parchó
 * a mano en los dos clones.
 */

const CARRERAS = [
  { slug: 'derecho', nombre: 'Licenciatura en Derecho', cuatrimestres: 8, totalMaterias: 32, tipo: 'licenciatura' },
  { slug: 'administracion', nombre: 'Licenciatura Ejecutiva en Administración', cuatrimestres: 8, totalMaterias: 32, tipo: 'licenciatura' },
  { slug: 'pedagogia', nombre: 'Licenciatura en Pedagogía', cuatrimestres: 8, totalMaterias: 32, tipo: 'licenciatura' },
]

// La oferta de UVEP #209.
const UVEP = {
  activas: true,
  etiqueta: 'Licenciatura Ejecutiva',
  inscripcion: 1000,
  certificacion: 40000,
  carreras: CARRERAS,
  modalidades: [
    { id: '12_meses', label: 'Regular 12 meses', meses: 12, mensualidad: 2200, activa: true, materiasPorMes: 2.67 },
    { id: '18_meses', label: 'Extendido 18 meses', meses: 18, mensualidad: 1700, activa: true, materiasPorMes: 1.78 },
    { id: '24_meses', label: 'Pausado 24 meses', meses: 24, mensualidad: 1400, activa: false, materiasPorMes: 1.34 },
  ],
}

type Desglose = {
  id: string; label: string; meses: number; mensualidad: number; inscripcion: number
  colegiatura: number; titulacion: number; total: number; porcentaje: number
}
const desgloses = (lic: object, carreras?: object[]) =>
  desglosesLicenciatura(lic, carreras) as unknown as Desglose[]

test('el costo de cada plan suma inscripción + mensualidades + titulación', () => {
  const planes = desgloses(UVEP)
  expect(planes.map(p => p.id)).toEqual(['12_meses', '18_meses']) // la inactiva no se anuncia
  expect(planes.map(p => [p.colegiatura, p.total])).toEqual([[26400, 67400], [30600, 71600]])
  expect(planes.map(p => p.porcentaje)).toEqual([59, 56])
  expect(porcentajeTitulacionTexto(planes)).toBe('entre el 56 y el 59 %')
  expect(porcentajeTitulacionTexto(planes.slice(0, 1))).toBe('el 59 %')
  expect(porcentajeTitulacionTexto([])).toBe('')
})

test('sin titulación aparte no hay desglose: la tabla de siempre sigue siendo verdad', () => {
  // Titulación incluida en el plan (DIDASKOMX #205).
  expect(titulacionAparte({ ...UVEP, titulacionIncluida: true })).toBe(false)
  // Sin precio de titulación.
  expect(titulacionAparte({ ...UVEP, certificacion: 0 })).toBe(false)
  // Con rutas de titulación: cada una trae su precio y su tabla.
  expect(titulacionAparte({ ...UVEP, rutas: [{ nombre: 'SEP', activa: true }] })).toBe(false)
  // Una ruta apagada no cuenta.
  expect(titulacionAparte({ ...UVEP, rutas: [{ nombre: 'SEP', activa: false }] })).toBe(true)
  // Puros diplomados: su `certificacion` no es una titulación.
  const dips = [{ nombre: 'Diplomado en Docencia', tipo: 'diplomado' }]
  expect(titulacionAparte({ ...UVEP, carreras: dips })).toBe(false)
  expect(desgloses({ ...UVEP, carreras: dips })).toEqual([])
  expect(titulacionAparte(null)).toBe(false)
})

test('las licenciaturas mensuales no son «de pago único»', () => {
  expect(nombrarProgramas(CARRERAS)).toBe('tus 3 licenciaturas')
  expect(nombrarProgramas(CARRERAS.slice(0, 1))).toBe('tu licenciatura')
  const mixto = [...CARRERAS.slice(0, 1), { nombre: 'Diplomado en Docencia', tipo: 'diplomado' }]
  expect(soloLicenciaturas(mixto)).toBe(false)
  expect(nombrarProgramas(mixto)).toBe('tus 2 programas')
  // Solo cuando TODOS tienen precio único y ninguno mensualidad.
  const unicos = [
    { nombre: 'Diplomado A', tipo: 'diplomado', precio: { publico: 9000 } },
    { nombre: 'Diplomado B', tipo: 'diplomado', precio: { publico: 9000 } },
  ]
  expect(nombrarProgramas(unicos)).toBe('tus 2 programas de pago único')
  expect(nombrarProgramas([unicos[0], { ...unicos[1], precio: { publico: 9000, mensual: 1500 } }])).toBe('tus 2 programas')
  expect(nombrarProgramas([])).toBe('')
})

test('listas en español: «A, B y C»', () => {
  expect(unirConY(['A'])).toBe('A')
  expect(unirConY(['A', 'B'])).toBe('A y B')
  expect(unirConY(['A', 'B', 'C'])).toBe('A, B y C')
  expect(unirConY([])).toBe('')
})

/* ── Documento ──────────────────────────────────────────────────────────── */

function documento(licenciaturas: object) {
  return construirHTML({
    nombre: 'UVEP', nombreCompleto: 'UNIVERSIDAD VIRTUAL', marcaEncabezado: '<b>UVEP</b>',
    tagline: '', taglineCierre: '', colores: { primario: '#1B2F6E', acento: '#1B2F6E' },
    url: 'https://uvep.online', adminNombre: 'Marco Antonio Ruiz',
    adminEmail: 'admin@cliente.com', adminPassword: 'x', contenido: [], incluye: ['Programa'],
    frasePrograma: 'tu universidad en línea', fraseIntro: '', frasePrecios: '', notaPrecios: '',
    preciosCols: ['Concepto'], preciosFilas: [], funcionalidad: [], modalidadesCols: ['Modalidad'],
    modalidadesFilas: [], notaModalidades: '', cursosPublicados: 0, validez: false,
    soporte: { horario: '', respuesta: '', canal: '' }, tutoriales: [], primerosPasos: [],
    palabraInstitucion: 'universidad', logoData: null, isotipoData: null, infra: null,
    fuentes: { tituloCSS: 'serif', cuerpoCSS: 'sans-serif', link: '' },
    licenciaturas, anclaProgramas: 'licenciaturas', etiquetaProgramas: 'Licenciaturas',
  })
}

test('el documento publica el costo completo y la titulación con su nombre', () => {
  const html = documento(UVEP)
  expect(html).toContain('Planes y costo total')
  expect(html).toContain('$67,400')
  expect(html).toContain('$71,600')
  expect(html).toContain('Titulación (se paga al concluir)')
  expect(html).toContain('entre el 56 y el 59 %')
  expect(html).toContain('https://uvep.online/#licenciaturas')
  // Lo que decía antes.
  expect(html).not.toContain('Total del plan')
  expect(html).not.toContain('Certificación profesional')
  expect(html).not.toContain('$26,400/mes')
  // `cuatrimestres` es una clave interna: ni «Módulos» ni la palabra prohibida.
  expect(html).not.toMatch(/M[oó]dulos/)
  expect(html).not.toMatch(/cuatrimestre/i)
})

test('con la titulación incluida el documento conserva la tabla de siempre', () => {
  const html = documento({ ...UVEP, titulacionIncluida: true, certificacion: 0 })
  expect(html).toContain('Planes configurados')
  expect(html).toContain('Total del plan')
  expect(html).not.toContain('Planes y costo total')
  expect(html).not.toMatch(/M[oó]dulos/)
})
