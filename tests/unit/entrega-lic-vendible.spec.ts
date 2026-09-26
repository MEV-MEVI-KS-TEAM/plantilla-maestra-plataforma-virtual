import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import {
  planLicVendible, planesLicSinMensualidad, desglosesLicenciatura,
} from '../../scripts/entrega/licenciaturas.mjs'
import { construirHTML } from '../../scripts/entrega/documento.mjs'
import { getDesglosesLicenciatura } from '@/lib/licenciatura-utils'

/**
 * Bloque D · D6 — #194: el Documento de Entrega anunciaba los planes de
 * licenciatura con mensualidad 0 como «6 × Gratis» (la página los esconde) y
 * afirmaba que «la titulación se paga al concluir», algo que la plataforma no
 * sabe. Misma regla de «plan vendible» que la landing en el desglose, en
 * «Planes configurados», en la tabla resumen y en el «Precio:» del WhatsApp.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')

test('#194 · paridad: el plan vendible del documento es EXACTAMENTE el de la landing', () => {
  const valores = {
    activa: [true, false, undefined],
    meses: [6, 0, -1, '6', null, undefined, Number.NaN],
    mensualidad: [1500, 0, -5, '1500', '0', null, undefined, Number.NaN],
  }
  let n = 0
  for (const activa of valores.activa) for (const meses of valores.meses) for (const mensualidad of valores.mensualidad) {
    const m = { id: 'x', label: 'X', activa, meses, mensualidad }
    const landing = getDesglosesLicenciatura({ activas: true, modalidades: [m] } as never).length === 1
    expect(planLicVendible(m), JSON.stringify(m)).toBe(landing)
    n++
  }
  expect(n).toBe(3 * 7 * 8)
  expect(planLicVendible(null)).toBe(false)
})

test('#194 · licenciaturas.mjs sigue sin importar nada (documento.mjs lo importa)', () => {
  expect(leer('scripts/entrega/licenciaturas.mjs')).not.toMatch(/^\s*import\s/m)
})

const CARRERAS = [{ slug: 'derecho', nombre: 'Licenciatura en Derecho', tipo: 'licenciatura' }]
const LIC = {
  activas: true, inscripcion: 1000, certificacion: 40000, carreras: CARRERAS,
  modalidades: [
    { id: '12_meses', label: 'Regular 12 meses', meses: 12, mensualidad: 2200, activa: true },
    { id: '6_meses_lic', label: 'Intensivo 6 meses', meses: 6, mensualidad: 0, activa: true },
    { id: '24_meses', label: 'Pausado 24 meses', meses: 24, mensualidad: 1400, activa: false },
  ],
}

test('#194 · el desglose con titulación omite el plan sin mensualidad (no más «6 × Gratis»)', () => {
  const planes = desglosesLicenciatura(LIC, CARRERAS) as { id: string }[]
  expect(planes.map(p => p.id)).toEqual(['12_meses'])
  // Y lo que se omitió por falta de mensualidad se puede avisar: el registro sí lo ofrece.
  expect((planesLicSinMensualidad(LIC) as { id: string }[]).map(m => m.id)).toEqual(['6_meses_lic'])
  expect(planesLicSinMensualidad({ ...LIC, modalidades: [LIC.modalidades[0]] })).toEqual([])
  expect(planesLicSinMensualidad(undefined)).toEqual([])
  // El plan de los diplomados del riel (`*_dip`) lleva su precio en la carrera: no se avisa.
  const dip = { ...LIC, modalidades: [...LIC.modalidades, { id: '6_meses_dip', label: 'Diplomado 6 meses', meses: 6, mensualidad: 0, activa: true }] }
  expect((planesLicSinMensualidad(dip) as { id: string }[]).map(m => m.id)).toEqual(['6_meses_lic'])
})

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

test('#194 · el documento: desglose sin el plan de $0 y sin afirmar cuándo se paga la titulación', () => {
  const html = documento(LIC)
  expect(html).toContain('Planes y costo total')
  expect(html).toContain('Regular 12 meses')
  expect(html).not.toContain('Intensivo 6 meses')
  // `mxn(0)` pinta «Gratis»: el documento anunciaba el plan como gratis.
  expect(html).not.toContain('× Gratis')
  expect(html).not.toContain('Gratis/mes')
  expect(html).not.toContain('se paga al concluir')
  expect(html).toContain('La titulación es el')
})

test('#194 · «Planes configurados» con la misma regla: sin el de $0 ni el apagado', () => {
  const html = documento({ ...LIC, titulacionIncluida: true, certificacion: 0 })
  expect(html).toContain('Planes configurados')
  expect(html).toContain('Regular 12 meses')
  expect(html).not.toContain('Intensivo 6 meses')
  expect(html).not.toContain('Pausado 24 meses')
  expect(html).not.toContain('Gratis/mes')
  // Si ninguno se vende, la sección no sale (antes salía con la lista cruda).
  const nada = documento({ ...LIC, titulacionIncluida: true, certificacion: 0,
    modalidades: [LIC.modalidades[1], LIC.modalidades[2]] })
  expect(nada).not.toContain('Planes configurados')
})

test('#194 · el generador: «Precio:», tabla resumen y aviso en REVISA con la misma regla', () => {
  const g = leer('scripts/entrega/generar-entrega.mjs')
  expect(g).toContain('const modsLic = (LIC.modalidades || []).filter(planLicVendible)')
  expect(g).toContain('for (const m of (LIC.modalidades || []).filter(planLicVendible)) {')
  expect(g).toContain('for (const m of planesLicSinMensualidad(LIC)) {')
  expect(g).toContain('const enPanel = PUEDE_PUBLICAR_LIC && planLicEditable(deConfig)')
  expect(g).toContain('avisar(`Licenciaturas: el plan «${m.label || m.id}» no tiene mensualidad.')
  // Ningún archivo de la entrega afirma cuándo se paga la titulación.
  for (const f of readdirSync(join(process.cwd(), 'scripts/entrega')).filter(x => x.endsWith('.mjs'))) {
    expect(leer(`scripts/entrega/${f}`), f).not.toMatch(/se paga al concluir/)
  }
})
