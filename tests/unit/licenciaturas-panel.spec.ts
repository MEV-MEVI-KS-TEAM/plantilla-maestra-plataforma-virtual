import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { esSoloCursos } from '@/lib/modo'
import type { SiteConfigOverrides } from '@/lib/site-config-core'
import { campoPorClave, LIMITES } from '@/lib/site-config-campos'
import {
  hayCambiosDeLicenciatura,
  hayCambiosDePrecio,
  hayCambiosDePreciosOPlanes,
  hayCambiosDeSecPrepa,
  licenciaturaDeBorrador,
  ofreceLicenciaturas,
  precioLicenciaturaEfectivo,
  estadoSeccionLicenciatura,
  seccionLicenciaturaVisible,
  textoVacioErrorLicenciatura,
  textoVacioLicenciatura,
  textoVacioNivel,
  tituloSecPrepa,
} from '@/lib/site-config-editor'
import { nivelesTexto } from '@/lib/niveles-ui'
import { landingAnimadaActiva } from '@/lib/landing-estilo'
import {
  AVISO_LIC_FORMA_PROPIA,
  AVISO_LIC_PORTADA_CLASICA,
  AYUDA_INSCRIPCION_SEC_PREPA,
  AYUDA_INSCRIPCION_SEC_PREPA_SIN_CAMPO,
  AYUDA_INSCRIPCION_TAMBIEN_LIC,
  AVISO_LIC_SIN_SECCION,
  TEXTO_CONFIRMA_LIC_SIN_SECCION,
  AYUDA_LIC_INSCRIPCION,
  AYUDA_LIC_MENSUALIDAD,
  AYUDA_LIC_MENSUALIDAD_CERO,
  AYUDA_LIC_PLANES_FORMA_PROPIA,
  AYUDA_LIC_SIN_PLANES,
  AYUDA_LIC_TITULACION,
  TEXTO_CONFIRMA_LIC_ANIMADA,
  TEXTO_CONFIRMA_LIC_CLASICA,
  confirmacionDePrecios,
  notaPreciosLicenciatura,
  textoConfirmaPrecios,
} from '@/lib/site-config-textos'

/**
 * Bloque B, B3 — la tarjeta «Licenciaturas» de la pestaña Precios.
 *
 * El runner no renderiza JSX: helpers puros y guardianes de fuente. Los datos
 * se construyen aquí (estas pruebas corren también en los clones).
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '')

const PESTANA = 'src/components/admin/personalizar/PestanaPrecios.tsx'
type Plano = Record<string, unknown>

const LIC = () => ({
  activas: true,
  inscripcion: 1500,
  certificacion: 38000,
  carreras: [{ slug: 'derecho', nombre: 'Licenciatura en Derecho', cuatrimestres: 8, totalMaterias: 32, icono: 'Scale', desc: 'x', incluye: [] }],
  modalidades: [
    { id: '12_meses', label: 'Ejecutivo 12 meses', sublabel: '12 meses', meses: 12, mensualidad: 1450, activa: true, materiasPorMes: 2.67 },
    { id: '18_meses', label: 'Extendido 18 meses', sublabel: '18 meses', meses: 18, mensualidad: 0, activa: true, materiasPorMes: 1.78 },
  ],
})

/** Cambia `CONFIG.licenciaturas` solo mientras corre `fn` (el config.ts de un cliente). */
function conLic<T>(lic: unknown, fn: () => T): T {
  const cfg = CONFIG as unknown as Plano
  const habia = Object.prototype.hasOwnProperty.call(cfg, 'licenciaturas')
  const antes = cfg.licenciaturas
  try {
    cfg.licenciaturas = lic
    return fn()
  } finally {
    if (habia) cfg.licenciaturas = antes
    else delete cfg.licenciaturas
  }
}

// ─── 1. ¿La escuela vende licenciaturas? ─────────────────────────────────────

test('1. la tarjeta sale con el add-on encendido y carreras; nunca por CONFIG.niveles', () => {
  const vende = !esSoloCursos()
  expect(ofreceLicenciaturas(LIC())).toBe(vende)
  expect(ofreceLicenciaturas({ ...LIC(), activas: false })).toBe(false)
  expect(ofreceLicenciaturas({ ...LIC(), activas: 'true' })).toBe(false)
  expect(ofreceLicenciaturas({ ...LIC(), carreras: [] })).toBe(false)
  // Solo diplomados montados en el riel (SFX): no vende licenciaturas. Es la
  // regla del registro, que tampoco ofrece «Licenciatura» ahí.
  expect(ofreceLicenciaturas({ ...LIC(), carreras: [{ slug: 'd', nombre: 'Diplomado', esDiplomado: true }] })).toBe(false)
  expect(ofreceLicenciaturas({ ...LIC(), carreras: [...LIC().carreras, { slug: 'd', nombre: 'Diplomado', esDiplomado: true }] })).toBe(vende)
  expect(ofreceLicenciaturas(undefined)).toBe(false)
  expect(ofreceLicenciaturas(null)).toBe(false)
  // La plantilla trae 'licenciatura' en niveles con el add-on APAGADO: sin tarjeta.
  const lic = (CONFIG as unknown as { licenciaturas?: { activas?: unknown } }).licenciaturas
  if (lic?.activas !== true) expect(ofreceLicenciaturas()).toBe(false)
})

test('1b. con licenciaturas, las tarjetas de Sec/Prepa dicen de qué nivel son; sin ellas, igual que siempre', () => {
  expect(tituloSecPrepa('Inscripción', false)).toBe('Inscripción')
  expect(tituloSecPrepa('Planes', false, ['secundaria', 'preparatoria'])).toBe('Planes')
  expect(tituloSecPrepa('Inscripción', true, ['secundaria', 'preparatoria', 'licenciatura'])).toMatch(/^Inscripción · \S+ y \S+$/)
  expect(tituloSecPrepa('Inscripción', true, ['preparatoria', 'licenciatura'])).not.toContain(' y ')
  // Sin Sec/Prepa en `niveles` (GreenHill), el respaldo también respeta la etiqueta de cada nivel («Bachillerato»).
  expect(tituloSecPrepa('Certificación', true, [])).toBe(`Certificación · ${nivelesTexto(['secundaria', 'preparatoria'])}`)
  // Siempre «Secundaria y Preparatoria», aunque el config los liste al revés.
  const alReves = tituloSecPrepa('Planes', true, ['preparatoria', 'secundaria'])
  expect(alReves).toBe(tituloSecPrepa('Planes', true, ['secundaria', 'preparatoria']))
})

// ─── 2. Lo que cobra cada campo ──────────────────────────────────────────────

test('2. vacío = la cifra de config.ts; lo escrito manda; la misma regla del merge', () => {
  conLic(LIC(), () => {
    const insc = { clave: 'licenciaturas.inscripcion', tipo: 'inscripcion' } as const
    const tit = { clave: 'licenciaturas.certificacion', tipo: 'titulacion' } as const
    const m12 = { clave: 'licenciaturas.modalidades.12_meses', tipo: 'mensualidad', planId: '12_meses' } as const
    const ov: SiteConfigOverrides = { licenciaturas: { inscripcion: 1700, certificacion: 39000, modalidades: { '12_meses': { mensualidad: 1500 } } } }
    expect(precioLicenciaturaEfectivo({}, insc)).toBe(1500)
    expect(precioLicenciaturaEfectivo(ov, insc)).toBe(1700)
    expect(precioLicenciaturaEfectivo(ov, insc, { vacio: true })).toBe(1500)
    expect(precioLicenciaturaEfectivo(ov, tit)).toBe(39000)
    expect(precioLicenciaturaEfectivo(ov, m12)).toBe(1500)
    expect(precioLicenciaturaEfectivo(ov, m12, { vacio: true })).toBe(1450)
    // Vaciar un campo no toca los otros.
    const sinInsc = licenciaturaDeBorrador(ov, 'licenciaturas.inscripcion') as Plano
    expect(sinInsc.inscripcion).toBe(1500)
    expect(sinInsc.certificacion).toBe(39000)
    // Lo que el merge ignoraría (una mensualidad 0 escrita a mano), aquí también.
    expect(precioLicenciaturaEfectivo({ licenciaturas: { modalidades: { '12_meses': { mensualidad: 0 } } } }, m12)).toBe(1450)
  })
})

test('2b. los marcadores nunca dicen «$0» ni «NaN»; un plan en 0 es «sin precio»', () => {
  expect(textoVacioLicenciatura(1500, 'inscripcion', 'MXN')).toBe('Vacío: usa el de fábrica, $1,500')
  expect(textoVacioLicenciatura(0, 'inscripcion', 'MXN')).toBe('Vacío: usa el de fábrica, sin costo')
  expect(textoVacioLicenciatura(0, 'mensualidad', 'MXN')).toBe('Vacío: sin precio')
  expect(textoVacioErrorLicenciatura(0, 'mensualidad', 'MXN')).toBe('el plan sin precio (tu página no lo muestra)')
  expect(textoVacioErrorLicenciatura(38000, 'titulacion', 'MXN')).toBe('el de fábrica, $38,000')
  for (const t of [textoVacioLicenciatura(0, 'titulacion', 'MXN'), textoVacioLicenciatura(NaN, 'mensualidad', 'MXN')]) {
    expect(t).not.toMatch(/\$0\b|NaN/)
  }
  // Cabe en el campo (max-w-xs, 340 px): el más largo posible —la titulación en su
  // techo— mide a lo más un carácter más que el más largo de la Fase 2 ($50,000).
  const masLargo = textoVacioLicenciatura(LIMITES.titulacionMax, 'titulacion', 'MXN')
  expect(masLargo).toBe('Vacío: usa el de fábrica, $100,000')
  expect(masLargo.length).toBeLessThanOrEqual(textoVacioNivel(LIMITES.precioMax, 'MXN', 'fabrica').length + 1)
})

test('2c. la sección de la landing se pinta con carreras y al menos un plan con mensualidad (en el borrador)', () => {
  const sinPrecio = { ...LIC(), modalidades: LIC().modalidades.map((m) => ({ ...m, mensualidad: 0 })) }
  conLic(sinPrecio, () => {
    expect(seccionLicenciaturaVisible({})).toBe(false)
    // Con la mensualidad que el admin está por publicar, sí.
    expect(seccionLicenciaturaVisible({ licenciaturas: { modalidades: { '12_meses': { mensualidad: 1450 } } } })).toBe(true)
  })
  conLic({ ...LIC(), carreras: [] }, () => expect(seccionLicenciaturaVisible({})).toBe(false))
  conLic(LIC(), () => expect(seccionLicenciaturaVisible({})).toBe(true))
  // El estado que comparten la nota y el modal.
  const animada = landingAnimadaActiva()
  conLic(sinPrecio, () => expect(estadoSeccionLicenciatura({})).toBe(animada ? 'sinSeccion' : 'clasica'))
  conLic(LIC(), () => expect(estadoSeccionLicenciatura({})).toBe(animada ? 'animada' : 'clasica'))
  // Atado a la condición REAL de la landing: si cambia allá, esta prueba lo avisa.
  const landing = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(landing).toContain('const carrerasLic = getCarrerasLicenciatura()')
  expect(landing).toContain('const planesLic = getDesglosesLicenciatura(config.licenciaturas)')
  expect(landing).toContain('const hayLicenciaturas = carrerasLic.length > 0 && planesLic.length > 0')
})

// ─── 3. Detección de cambios y modal ─────────────────────────────────────────

test('3. cambiar un precio de licenciatura pide confirmar precios', () => {
  const antes: SiteConfigOverrides = {}
  const despues: SiteConfigOverrides = { licenciaturas: { modalidades: { '12_meses': { mensualidad: 1500 } } } }
  expect(hayCambiosDeLicenciatura(antes, despues)).toBe(true)
  expect(hayCambiosDePreciosOPlanes(antes, despues)).toBe(true)
  expect(hayCambiosDePrecio(antes, despues, 'MXN')).toBe(true)
  expect(hayCambiosDeLicenciatura(despues, JSON.parse(JSON.stringify(despues)))).toBe(false)
  // Un cambio de Sec/Prepa no se confunde con uno de licenciatura, ni al revés.
  expect(hayCambiosDeLicenciatura({}, { precios: { inscripcion: 1 } })).toBe(false)
  expect(hayCambiosDeSecPrepa(antes, despues)).toBe(false)
  expect(hayCambiosDeSecPrepa({}, { modalidades: { '3_meses': { mensualidad: 1 } } })).toBe(true)
})

test('3b. el modal: igual que siempre sin licenciatura; en portada clásica avisa que no se verán', () => {
  for (const semanal of [false, true]) for (const porNivel of [false, true]) {
    const base = textoConfirmaPrecios({ semanal, cambiaTipoCambio: false, porNivel })
    expect(textoConfirmaPrecios({ semanal, cambiaTipoCambio: false, porNivel, licenciaturas: 'animada' })).toBe(base)
    expect(textoConfirmaPrecios({ semanal, cambiaTipoCambio: false, porNivel, licenciaturas: 'clasica' }))
      .toBe(base.replace(' ¿Publicar?', ` ${AVISO_LIC_PORTADA_CLASICA} ¿Publicar?`))
  }
  expect(confirmacionDePrecios({ semanal: false, cambiaPrecios: true, cambiaTipoCambio: false, licenciaturas: 'clasica' }).mensaje)
    .toContain(AVISO_LIC_PORTADA_CLASICA)
  // Si lo ÚNICO que cambió es licenciatura, un texto propio: sin la frase de
  // Sec/Prepa (que en la clásica se contradecía) ni cuotas o calendarios (semanal).
  for (const semanal of [false, true]) {
    expect(textoConfirmaPrecios({ semanal, cambiaTipoCambio: false, porNivel: true, licenciaturas: 'animada', soloLicenciaturas: true }))
      .toBe(`${TEXTO_CONFIRMA_LIC_ANIMADA} ¿Publicar?`)
    expect(textoConfirmaPrecios({ semanal, cambiaTipoCambio: false, licenciaturas: 'clasica', soloLicenciaturas: true }))
      .toBe(`${TEXTO_CONFIRMA_LIC_CLASICA} ¿Publicar?`)
  }
  expect(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false, licenciaturas: 'sinSeccion', soloLicenciaturas: true }))
    .toBe(`${TEXTO_CONFIRMA_LIC_SIN_SECCION} ¿Publicar?`)
  // Mixto (cambió también Sec/Prepa) en una animada sin sección: el aviso.
  expect(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false, licenciaturas: 'sinSeccion' }))
    .toBe(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false }).replace(' ¿Publicar?', ` ${AVISO_LIC_SIN_SECCION} ¿Publicar?`))
  for (const t of [TEXTO_CONFIRMA_LIC_ANIMADA, TEXTO_CONFIRMA_LIC_CLASICA, TEXTO_CONFIRMA_LIC_SIN_SECCION]) {
    expect(t).not.toMatch(/cuota|calendario|Cobranza|nivel/i)
  }
  // Nota y modal dicen lo mismo del caso «sin sección».
  expect(notaPreciosLicenciatura('sinSeccion')).toBe(AVISO_LIC_SIN_SECCION)
  // `soloLicenciaturas` sin `licenciaturas` no cambia nada.
  expect(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false, soloLicenciaturas: true }))
    .toBe(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false }))
  // La portada clásica de verdad no tiene sección de licenciaturas: si algún día
  // la tiene, este aviso miente y hay que quitarlo.
  expect(leer('src/components/landing/LandingClient.tsx')).not.toMatch(/licenciatura/i)
})

test('3c. los textos no dicen cuatrimestre ni cuándo se paga la titulación, y no prometen de más', () => {
  const textos = [AVISO_LIC_FORMA_PROPIA, AVISO_LIC_PORTADA_CLASICA, AYUDA_INSCRIPCION_SEC_PREPA, AYUDA_INSCRIPCION_SEC_PREPA_SIN_CAMPO,
    AYUDA_LIC_INSCRIPCION, AYUDA_LIC_MENSUALIDAD, AYUDA_LIC_MENSUALIDAD_CERO, AYUDA_LIC_PLANES_FORMA_PROPIA,
    AYUDA_LIC_SIN_PLANES, AYUDA_LIC_TITULACION, TEXTO_CONFIRMA_LIC_ANIMADA, TEXTO_CONFIRMA_LIC_CLASICA,
    TEXTO_CONFIRMA_LIC_SIN_SECCION, AVISO_LIC_SIN_SECCION, AYUDA_INSCRIPCION_TAMBIEN_LIC,
    notaPreciosLicenciatura('animada'), notaPreciosLicenciatura('clasica'), notaPreciosLicenciatura('sinSeccion')]
  for (const t of textos) {
    expect(t, t).not.toMatch(/cuatrimestr/i)
    expect(t, t).not.toMatch(/al (concluir|terminar|egresar)|al final del/i)
    expect(t, t).not.toMatch(/al instante|inmediatamente/i)
    expect(t, t).not.toMatch(/\$\s?0\b/)
  }
  // «Sin mensualidad… el registro sí lo ofrece» está atado al código: la landing
  // filtra `mensualidad > 0` y el registro solo `activa`.
  expect(leer('src/lib/licenciatura-utils.ts')).toContain('.filter(m => m.activa !== false && m.meses > 0 && m.mensualidad > 0)')
  expect(leer('src/lib/modalidades.ts')).toContain('return modalidadesLic(lic === undefined ? undefined : (lic as TablaLic)).filter(m => m.activa !== false)')
})

// ─── 4. La pestaña (guardianes de fuente) ────────────────────────────────────

test('4. la tarjeta solo con licenciaturas, sin interruptores ni claves de Sec/Prepa', () => {
  const codigo = sinComentarios(leer(PESTANA))
  expect(codigo).toContain('const conLic = ofreceLicenciaturas()')
  expect(codigo.split('<Tarjeta\n          titulo="Licenciaturas"').length - 1).toBe(1)
  const i = codigo.indexOf('{conLic && (\n        <Tarjeta\n          titulo="Licenciaturas"')
  expect(i).toBeGreaterThan(-1)
  const bloque = codigo.slice(i, codigo.indexOf('</Tarjeta>', i))
  for (const prohibido of ['Interruptor', 'role="switch"', 'escribirModalidad(', '`modalidades.${', 'activa:']) {
    expect(bloque, prohibido).not.toContain(prohibido)
  }
  expect(bloque).toContain('{!licEditable ? (')
  expect(bloque).toContain('<Ayuda>{AVISO_LIC_FORMA_PROPIA}</Ayuda>')
  expect(bloque).toContain("campoLic({ clave: 'licenciaturas.inscripcion', tipo: 'inscripcion' }, 'Inscripción de licenciatura', AYUDA_LIC_INSCRIPCION)")
  expect(bloque).toContain("campoLic({ clave: 'licenciaturas.certificacion', tipo: 'titulacion' }, 'Titulación', AYUDA_LIC_TITULACION)")
  expect(bloque).toContain("{ clave: `licenciaturas.modalidades.${p.id}`, tipo: 'mensualidad', planId: p.id }")
  // Con planes que no se editan, no dice «no tiene planes».
  expect(bloque).toContain('<Ayuda>{hayPlanesLic ? AYUDA_LIC_PLANES_FORMA_PROPIA : AYUDA_LIC_SIN_PLANES}</Ayuda>')
  // Por su duración: «6, 12 o 18 meses».
  expect(codigo).toContain('const ritmosLic = `${unirConO(')
})

test('4b. el campo: vacío quita la clave; el marcador y la cifra salen del bloque efectivo', () => {
  const codigo = sinComentarios(leer(PESTANA))
  const campo = codigo.slice(codigo.indexOf('function campoLic('), codigo.indexOf('function campoTipoCambio('))
  expect(campo).toContain('precioLicenciaturaEfectivo(overrides, campo, { vacio: true })')
  expect(campo).toContain('precioLicenciaturaEfectivo(overrides, campo)')
  expect(campo).toContain('onVaciar={() => actualizar((prev) => quitarRuta(prev, ruta))}')
  expect(campo).toContain('onRestaurar={() => actualizar((prev) => quitarRuta(prev, ruta))}')
  expect(campo).toContain('resaltado={claveConError === campo.clave}')
  expect(campo).not.toMatch(/escribirRuta\(prev, ruta, (null|0)\)/)
  // Junto al campo nunca «$0»: «Sin costo» o «Sin precio».
  expect(campo).toContain("sufijo={<CobraLicenciatura valor={cobra} moneda={CONFIG.moneda} mensualidad={campo.tipo === 'mensualidad'} />}")
  expect(codigo).toContain("{mensualidad ? 'Sin precio' : 'Sin costo'}")
  // Un plan sin `materiasPorMes` en su config no dice «undefined».
  expect(codigo).toContain("{typeof p.materiasPorMes === 'number' && ` · ${p.materiasPorMes} materias por mes`}")
})

test('4c. las tres tarjetas de Sec/Prepa se rotulan; sus campos conservan la etiqueta que busca la e2e', () => {
  const codigo = sinComentarios(leer(PESTANA))
  for (const t of ['Inscripción', 'Planes', 'Certificación']) expect(codigo).toContain(`tituloSecPrepa('${t}', conLic)`)
  expect(codigo).toContain("campoPrecio('precios.inscripcion', porNivel ? 'Inscripción general' : undefined)")
  expect(codigo).toContain("etiqueta={semanal ? 'Cuota semanal' : conSubbloque ? 'Mensualidad general' : 'Mensualidad'}")
  // «…está en la tarjeta Licenciaturas» solo si ahí hay un campo; sin inscripción
  // propia, su alumno paga ÉSTA (inscripcionDelAlumno cae a la general).
  expect(codigo).toContain('descripcion={ayudaInscripcion}')
  expect(codigo).toContain('const inscripcionLicEnPanel = licEditable && inscripcionLicEditable(tablaLic)')
  expect(codigo).toMatch(/inscripcionLicEnPanel \? AYUDA_INSCRIPCION_SEC_PREPA\s*: inscripcionLicenciaturaDe\([^)]*\) !== null \? AYUDA_INSCRIPCION_SEC_PREPA_SIN_CAMPO\s*: AYUDA_INSCRIPCION_TAMBIEN_LIC/)
  // La nota y el modal usan el MISMO estado.
  expect(codigo).toContain('{conLic && ` ${notaPreciosLicenciatura(estadoSeccionLicenciatura(overrides))}`}')
  // Ninguna etiqueta de licenciatura casa con los rótulos anclados de la e2e.
  for (const etiqueta of ['Inscripción de licenciatura', 'Titulación', 'Mensualidad · Ejecutivo 12 meses']) {
    expect(etiqueta).not.toMatch(/^Inscripción( general)?$/)
    expect(etiqueta).not.toMatch(/^Mensualidad( general)?$/)
  }
  expect(campoPorClave('licenciaturas.modalidades')?.min).toBe(LIMITES.precioNivelMin)
})

test('4d. los ids de la tarjeta no chocan con los de los planes de Sec/Prepa (mismos ids en las dos tablas)', () => {
  // Copia literal de `idDeCampo` (Comunes.tsx), como la e2e.
  const idDeCampo = (clave: string) => `pmp-${clave.replace(/[^A-Za-z0-9]+/g, '-')}`
  expect(leer('src/components/admin/personalizar/Comunes.tsx')).toContain("return `pmp-${clave.replace(/[^A-Za-z0-9]+/g, '-')}`")
  for (const id of ['3_meses', '6_meses', '12_meses', '18_meses']) {
    expect(idDeCampo(`licenciaturas.modalidades.${id}`)).not.toBe(idDeCampo(`modalidades.${id}`))
  }
})

test('4f. ninguna pantalla calcula el desglose de licenciatura sin la tabla efectiva', () => {
  // Sin argumento, `getDesglosesLicenciatura()` lee config.ts y no ve lo que
  // el admin publicó (Bloque B). Solo licenciatura-utils puede usar el default.
  const archivosDe = (dir: string): string[] => {
    const out: string[] = []
    for (const n of readdirSync(join(raiz, dir))) {
      const rel = `${dir}/${n}`
      if (statSync(join(raiz, rel)).isDirectory()) out.push(...archivosDe(rel))
      else if (/\.tsx?$/.test(n)) out.push(rel)
    }
    return out
  }
  for (const archivo of [...archivosDe('src/app'), ...archivosDe('src/components')]) {
    const codigo = sinComentarios(leer(archivo))
    expect(codigo, archivo).not.toMatch(/getDesglosesLicenciatura\(\s*\)|getDesgloseLicenciatura\([^,)]*\)/)
  }
})

test('4e. un error de licenciatura lleva a la pestaña Precios y el modal sabe de la portada', () => {
  const pagina = sinComentarios(leer('src/app/(dashboard)/admin/configuracion/page.tsx'))
  expect(pagina).toContain("clave.startsWith('licenciaturas.')) return 'precios'")
  expect(pagina).toContain('? estadoSeccionLicenciatura(overrides)')
  expect(pagina).toContain('soloLicenciaturas: hayCambiosDeLicenciatura(overridesBase, overrides) && !hayCambiosDeSecPrepa(overridesBase, overrides),')
  // Los placeholders de «Textos de mi página» siguen el borrador de precios.
  const textos = sinComentarios(leer('src/components/admin/personalizar/TextosLicenciaturas.tsx'))
  expect(textos).toContain('getDesglosesLicenciatura(licenciaturaDeBorrador(overrides)')
  expect(sinComentarios(leer('src/components/admin/personalizar/PestanaTextos.tsx'))).toContain('autoLicenciaturas(overrides)')
})
