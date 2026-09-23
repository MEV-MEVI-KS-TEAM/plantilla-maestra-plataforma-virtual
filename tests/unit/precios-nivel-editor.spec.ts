import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { esSoloCursos } from '@/lib/modo'
import { mergeSiteConfig, type SiteConfigOverrides } from '@/lib/site-config-core'
import { campoPorClave, LIMITES } from '@/lib/site-config-campos'
import { mensualidadGeneralDe, inscripcionGeneral } from '@/lib/precios-nivel'
import { validarOverrides } from '@/lib/site-config-validacion'
import { mensualidadQA } from '../../e2e/_precios-qa'
import {
  claveASenalar,
  clavesPorNivelDePlan,
  escribirRuta,
  formatoDinero,
  hayCambiosDePrecio,
  planDeClaveNivel,
  planSobrescrito,
  precioNivelEfectivo,
  precioNivelSobrescrito,
  preciosPorNivelVisibles,
  restaurarPlan,
  textoVacioNivel,
} from '@/lib/site-config-editor'
import {
  AVISO_PRECIO_POR_NIVEL,
  NOTA_PRECIOS_POR_NIVEL,
  confirmacionDePrecios,
  textoConfirmaPrecios,
} from '@/lib/site-config-textos'

/**
 * F2-9 — la pestaña Precios captura las seis claves por nivel.
 *
 * Vacío = sigue la general de hoy. El marcador del campo vacío dice CUÁNTO
 * cobraría el nivel (con el mismo resolver que la landing), nunca «$0»; el
 * «Restaurar plan» se lleva también los precios por nivel de su duración; y un
 * error del escalón (F2-7) señala un campo que el admin puede corregir en la
 * pestaña.
 *
 * Todo lo que depende del config se calcula con el config de ESTE repo: la
 * suite corre igual en la plantilla y en los ~144 clones.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '')

const PESTANA = 'src/components/admin/personalizar/PestanaPrecios.tsx'
const PRECIOS = CONFIG.precios as unknown as Record<string, unknown>

/** Cambia una clave de `CONFIG.precios` solo mientras corre `fn` (simula un clon). */
function conPrecio<T>(clave: string, valor: unknown, fn: () => T): T {
  const habia = Object.prototype.hasOwnProperty.call(PRECIOS, clave)
  const antes = PRECIOS[clave]
  try {
    if (valor === undefined) delete PRECIOS[clave]
    else PRECIOS[clave] = valor
    return fn()
  } finally {
    if (habia) PRECIOS[clave] = antes
    else delete PRECIOS[clave]
  }
}

// ─── 1. El precio que se enseña con el campo vacío ───────────────────────────

test('1. campo vacío (clave ausente o null en el clon): «usa la general $599», no «$0»', () => {
  const ov: SiteConfigOverrides = { precios: { inscripcion: 599 } }
  for (const clave of ['inscripcionSecundaria', 'inscripcionPreparatoria'] as const) {
    const nivel = clave === 'inscripcionSecundaria' ? 'secundaria' : 'preparatoria'
    for (const enElClon of [undefined, null]) {
      const monto = conPrecio(clave, enElClon, () =>
        precioNivelEfectivo(ov, { clave: `precios.${clave}`, nivel }, { vacio: true }))
      expect(monto, `${clave} = ${enElClon}`).toBe(599)
      const texto = textoVacioNivel(monto, 'MXN')
      expect(texto).toBe(`Vacío: usa la general, ${formatoDinero(599, 'MXN')}`)
      expect(texto).not.toContain('$0')
    }
  }
  // Una general en 0 se dice «sin costo», no «$0».
  expect(textoVacioNivel(0, 'MXN')).toBe('Vacío: usa la general, sin costo')
  // El clon que ya trae la clave con cifra en su config.ts: vaciar vuelve a ESA.
  expect(textoVacioNivel(1200, 'MXN', 'fabrica')).toBe(`Vacío: usa el de fábrica, ${formatoDinero(1200, 'MXN')}`)
  // SAMEX: la secundaria vacía sigue su alias, no la «Mensualidad general» del plan.
  expect(textoVacioNivel(2700, 'MXN', 'hoy')).toBe(`Vacío: usa la de hoy, ${formatoDinero(2700, 'MXN')}`)
  expect(conPrecio('inscripcionSecundaria', 1200, () =>
    precioNivelEfectivo(ov, { clave: 'precios.inscripcionSecundaria', nivel: 'secundaria' }, { vacio: true }))).toBe(1200)
})

test('2. con la clave escrita, el nivel cobra la suya; vacío, la general de hoy (con el alias de secundaria)', () => {
  const plan = mergeSiteConfig(CONFIG, {}).modalidades.find((m) => m.meses === 3 || m.meses === 6)
  test.skip(!plan, 'el config de este repo no tiene planes de 3 ni 6 meses')
  const meses = plan!.meses as 3 | 6
  // Un clon cuyo config.ts ya trajera esta clave con cifra: se simula vacía.
  conPrecio(`mensualidadSecundaria${meses}Meses`, null, () => mensualidadVacia(plan!.id, meses))
})

function mensualidadVacia(planId: string, meses: 3 | 6) {
  const claveSec = `precios.mensualidadSecundaria${meses}Meses`
  const ov = escribirRuta({}, claveSec, 2345)
  const destino = { clave: claveSec, nivel: 'secundaria' as const, planId }
  expect(precioNivelEfectivo(ov, destino)).toBe(2345)
  // Vacío: lo que la landing cobra hoy, calculado con la config fusionada.
  const general = () => {
    const cfg = mergeSiteConfig(CONFIG, {})
    const p = cfg.modalidades.find((m) => m.id === planId)!
    return mensualidadGeneralDe('secundaria', p, cfg.precios as unknown as Record<string, unknown>)
  }
  expect(precioNivelEfectivo(ov, destino, { vacio: true })).toBe(general())
  // SAMEX / AULA RAÍZ: la general de secundaria es su alias, no la del plan.
  conPrecio(`secundaria_${meses}meses_normal`, 1111, () => {
    expect(precioNivelEfectivo(ov, destino, { vacio: true })).toBe(1111)
    expect(precioNivelEfectivo({}, destino)).toBe(1111)
  })
  // Un plan que ya no existe no inventa un precio.
  expect(precioNivelEfectivo(ov, { ...destino, planId: 'no-existe' })).toBe(0)
}

test('3. la inscripción general del borrador manda sobre la de fábrica en el marcador', () => {
  const ov = escribirRuta({}, 'precios.inscripcion', 777)
  const inscSec = conPrecio('inscripcionSecundaria', null, () =>
    precioNivelEfectivo(ov, { clave: 'precios.inscripcionSecundaria', nivel: 'secundaria' }, { vacio: true }))
  expect(inscSec).toBe(777)
  // Sin override, la de config.ts de este repo.
  const fabrica = inscripcionGeneral(mergeSiteConfig(CONFIG, {}).precios as unknown as Record<string, unknown>)
  expect(conPrecio('inscripcionSecundaria', null, () =>
    precioNivelEfectivo({}, { clave: 'precios.inscripcionSecundaria', nivel: 'secundaria' }, { vacio: true }))).toBe(fabrica)
})

// ─── 2. «Restaurar plan» ─────────────────────────────────────────────────────

const PLANES = [
  { id: '3_meses', meses: 3 },
  { id: '6_meses', meses: 6 },
  { id: 'acceso_completo', meses: 6 },
  { id: '12_meses', meses: 12 },
]

const CON_TODO: SiteConfigOverrides = {
  precios: {
    inscripcion: 700,
    inscripcionSecundaria: 1000,
    mensualidadSecundaria3Meses: 2500,
    mensualidadPreparatoria3Meses: 3000,
    mensualidadSecundaria6Meses: 1250,
    mensualidadPreparatoria6Meses: 1500,
  },
  modalidades: { '3_meses': { mensualidad: 900, activa: false }, '6_meses': { mensualidad: 800 } },
} as unknown as SiteConfigOverrides

test('4. «Restaurar plan» quita el plan y los precios por nivel de SU duración, nada más', () => {
  const r = restaurarPlan(CON_TODO, PLANES[0], PLANES) as unknown as {
    precios: Record<string, number>
    modalidades?: Record<string, unknown>
  }
  expect(r.modalidades).toEqual({ '6_meses': { mensualidad: 800 } })
  expect(r.precios).toEqual({
    inscripcion: 700,
    inscripcionSecundaria: 1000,
    mensualidadSecundaria6Meses: 1250,
    mensualidadPreparatoria6Meses: 1500,
  })
  // No muta el borrador de entrada.
  expect((CON_TODO.precios as Record<string, number>).mensualidadSecundaria3Meses).toBe(2500)

  // Sale aunque solo esté sobrescrita UNA clave por nivel (sin override del plan).
  const soloUna = escribirRuta({}, 'precios.mensualidadPreparatoria3Meses', 3000)
  expect(planSobrescrito(soloUna, PLANES[0], PLANES)).toBe(true)
  expect(restaurarPlan(soloUna, PLANES[0], PLANES)).toEqual({})
  expect(planSobrescrito({}, PLANES[0], PLANES)).toBe(false)
  // `null` es VACÍO (el validador lo descarta): ni «Restaurar plan» ni «Restaurar» del campo.
  const nulo = escribirRuta({}, 'precios.mensualidadSecundaria3Meses', null)
  expect(planSobrescrito(nulo, PLANES[0], PLANES)).toBe(false)
  expect(precioNivelSobrescrito(nulo, 'precios.mensualidadSecundaria3Meses')).toBe(false)
  // Un 0 escrito a mano SÍ: es inválido y hay que poder quitarlo.
  expect(precioNivelSobrescrito(escribirRuta({}, 'precios.inscripcionSecundaria', 0), 'precios.inscripcionSecundaria')).toBe(true)
  expect(planSobrescrito(soloUna, PLANES[1], PLANES)).toBe(false)
})

test('5. dos planes de la misma duración: solo el primero lleva (y restaura) las claves por nivel', () => {
  // Habsburgo: «6 Meses» y «Acceso completo» duran 6 meses y comparten la clave.
  expect(clavesPorNivelDePlan(PLANES[1], PLANES)).toEqual([
    'precios.mensualidadSecundaria6Meses',
    'precios.mensualidadPreparatoria6Meses',
  ])
  expect(clavesPorNivelDePlan(PLANES[2], PLANES)).toEqual([])
  const r = restaurarPlan(CON_TODO, PLANES[2], PLANES) as unknown as { precios: Record<string, number> }
  expect(r.precios.mensualidadSecundaria6Meses).toBe(1250)
  expect(r.precios.mensualidadPreparatoria6Meses).toBe(1500)
  // Sin la lista, un plan solo se mira a sí mismo.
  expect(clavesPorNivelDePlan(PLANES[2])).toHaveLength(2)
})

test('6. claves por nivel: solo 3 y 6 meses, y un plan con nivel toca solo el suyo', () => {
  expect(clavesPorNivelDePlan({ id: 'x', meses: 12 })).toEqual([])
  expect(clavesPorNivelDePlan({ id: 'x', meses: 1 })).toEqual([])
  expect(clavesPorNivelDePlan({ id: 'x', meses: 3, nivel: 'secundaria' })).toEqual(['precios.mensualidadSecundaria3Meses'])
  expect(clavesPorNivelDePlan({ id: 'x', meses: 6, nivel: 'preparatoria' })).toEqual(['precios.mensualidadPreparatoria6Meses'])
  // ISFP: `nivel: 'media'` no tiene precio por nivel.
  expect(clavesPorNivelDePlan({ id: 'x', meses: 3, nivel: 'media' })).toEqual([])
  // Y todas las claves que salen existen en el catálogo, con mínimo 1 y opcionales.
  for (const clave of [
    ...clavesPorNivelDePlan({ id: 'a', meses: 3 }),
    ...clavesPorNivelDePlan({ id: 'b', meses: 6 }),
    'precios.inscripcionSecundaria',
    'precios.inscripcionPreparatoria',
  ]) {
    const campo = campoPorClave(clave)
    expect(campo, clave).toBeTruthy()
    expect(campo!.min).toBe(LIMITES.precioNivelMin)
    expect(LIMITES.precioNivelMin).toBe(1)
    expect(campo!.opcional).toBe(true)
    expect(campo!.ayuda).toContain('Vacío = sigue la general de hoy')
  }
})

// ─── 3. El error del escalón señala un campo que existe ──────────────────────

test('7. claveASenalar: la clave por nivel si tiene campo; si no, la caja de su plan', () => {
  const mensual = { semanal: false, porNivel: true }
  const k = 'precios.mensualidadSecundaria3Meses'
  expect(claveASenalar(k, PLANES, mensual)).toBe(k)
  expect(claveASenalar('precios.mensualidadPreparatoria6Meses', PLANES, mensual)).toBe('precios.mensualidadPreparatoria6Meses')
  // Semanal o de un solo nivel: no hay subcampo.
  expect(claveASenalar(k, PLANES, { semanal: true, porNivel: true })).toBe('modalidades.3_meses')
  expect(claveASenalar(k, PLANES, { semanal: false, porNivel: false })).toBe('modalidades.3_meses')
  // Plan con nivel (EDUHCO, CAU): tampoco.
  const asim = [{ id: '3_meses', meses: 3, nivel: 'secundaria' }, { id: '6_meses', meses: 6, nivel: 'preparatoria' }]
  expect(claveASenalar(k, asim, mensual)).toBe('modalidades.3_meses')
  expect(planDeClaveNivel('precios.mensualidadPreparatoria3Meses', asim)).toBeNull()
  // Lo demás pasa tal cual.
  for (const otra of ['modalidades.3_meses', 'precios.inscripcion', 'precios.inscripcionSecundaria', 'landing.hero_titulo']) {
    expect(claveASenalar(otra, PLANES, mensual)).toBe(otra)
  }
  expect(claveASenalar(k, [], mensual)).toBe(k)
  expect(claveASenalar(k, undefined, mensual)).toBe(k)
})

test('8. el editor pasa la clave del servidor por claveASenalar antes de enfocarla', () => {
  const pagina = sinComentarios(leer('src/app/(dashboard)/admin/configuracion/page.tsx'))
  const i = pagina.indexOf('const irAlCampo = useCallback(')
  expect(i).toBeGreaterThan(-1)
  const cuerpo = pagina.slice(i, pagina.indexOf('}, [])', i))
  expect(cuerpo).toMatch(/const clave = claveASenalar\(claveDelError, mergeSiteConfig\(CONFIG, \{\}\)\.modalidades, \{/)
  expect(cuerpo).toContain('porNivel: preciosPorNivelVisibles()')
  // Todo lo de después usa la clave ya traducida.
  expect(cuerpo.indexOf('setClaveConError(clave)')).toBeGreaterThan(cuerpo.indexOf('claveASenalar('))
  expect(cuerpo).toContain('document.getElementById(idDeCampo(clave))')
  expect(cuerpo.match(/claveDelError/g)).toHaveLength(2)
})

// ─── 4. La pestaña ───────────────────────────────────────────────────────────

test('9. PestanaPrecios pinta un campo por clave nueva, y sigue con tipo de cambio y cursos', () => {
  const fuente = leer(PESTANA)
  const codigo = sinComentarios(fuente)
  // Inscripción: los dos niveles, en un subbloque que solo sale con porNivel.
  const insc = codigo.slice(codigo.indexOf('<Tarjeta titulo="Inscripción"'), codigo.indexOf('</Tarjeta>', codigo.indexOf('<Tarjeta titulo="Inscripción"')))
  expect(insc).toContain("campoPrecio('precios.inscripcion', porNivel ? 'Inscripción general' : undefined)")
  expect(insc).toContain('{porNivel && (')
  expect(insc).toContain('NIVELES_CON_PRECIO.map((n) => campoNivel(`precios.${CLAVE_INSCRIPCION_POR_NIVEL[n]}`, n))')
  // Mensualidad: los dos niveles de la duración del plan, solo en el dueño de la clave.
  expect(codigo).toContain('const clavesNivel = clavesPorNivelDePlan(m, mods)')
  expect(codigo).toContain('const conSubbloque = !semanal && porNivel && !m.nivel && clavesNivel.length > 0')
  expect(codigo).toContain('`precios.${CLAVE_MENSUALIDAD_POR_NIVEL[n][m.meses as 3 | 6]}`, n, m,')
  expect(codigo).toMatch(/\{conSubbloque && \(\s*<div className="space-y-3">\s*<Subtitulo>Precio por nivel \(opcional\)<\/Subtitulo>/)
  expect(codigo).toContain("etiqueta={semanal ? 'Cuota semanal' : conSubbloque ? 'Mensualidad general' : 'Mensualidad'}")
  expect(codigo.match(/campoNivel\(/g)).toHaveLength(3) // la definición + los dos usos
  expect(codigo).toContain("const NIVELES_CON_PRECIO: readonly NivelConPrecio[] = ['secundaria', 'preparatoria']")
  // El campo: vacío quita la clave; el marcador y la cifra salen del resolver.
  const campo = codigo.slice(codigo.indexOf('function campoNivel('), codigo.indexOf('function campoTipoCambio('))
  expect(campo).toContain('precioNivelEfectivo(overrides, destino, { vacio: true })')
  expect(campo).toContain('precioNivelEfectivo(overrides, destino)')
  expect(campo).toContain('onVaciar={() => actualizar((prev) => quitarRuta(prev, clave))}')
  expect(campo).toContain('valor={valorEfectivo({}, overrides, clave)}')
  expect(campo).toContain('sobrescrito={precioNivelSobrescrito(overrides, clave)}')
  expect(campo).toContain("plan && siVacio !== plan.mensualidad ? 'hoy' : 'general'")
  expect(campo).toContain("ayuda={origen === 'fabrica' ? AYUDA_NIVEL_DE_FABRICA : campo?.ayuda}")
  expect(campo).toContain("const origen = Number(valorEfectivo(defaults, {}, clave)) > 0 ? 'fabrica'")
  expect(campo).toContain('resaltado={claveConError === clave}')
  expect(campo).not.toMatch(/escribirRuta\(prev, clave, (null|0)\)/)
  // «Restaurar plan»: con las claves por nivel y aunque el plan no tenga override.
  expect(codigo).toContain('const restaurable = planSobrescrito(overrides, m, mods)')
  expect(codigo).toContain('onClick={() => actualizar((prev) => restaurarPlan(prev, m, mods))}')
  expect(codigo).not.toContain('{override && puedeEditar && (')
  // Siguen: tipo de cambio fuera de MXN, cursos con permiso, notas.
  expect(codigo).toContain("{CONFIG.moneda !== 'MXN' && (")
  expect(codigo.split('{campoTipoCambio()}').length - 1).toBe(1)
  expect(codigo.split('href="/admin/cursos"').length - 1).toBe(1)
  expect(codigo).toContain('{NOTA_PRECIOS}')
  expect(codigo).toContain('{porNivel && ` ${NOTA_PRECIOS_POR_NIVEL}`}')
  expect(codigo).toContain('const porNivel = preciosPorNivelVisibles()')
})

test('10. el campo por nivel: vacío es válido, 0 no, y el error dice que se puede dejar vacío', () => {
  const fuente = sinComentarios(leer('src/components/admin/personalizar/CampoTexto.tsx'))
  const i = fuente.indexOf('export function CampoPrecioNivel(')
  expect(i).toBeGreaterThan(-1)
  const campo = fuente.slice(i, fuente.indexOf('export interface CampoDecimalProps', i))
  expect(campo).toContain("const invalido = limpio !== '' && (numero === null || numero < min || numero > max)")
  expect(campo).toContain("if (t === '') return onVaciar()")
  expect(campo).toContain('placeholder={vacio}')
  expect(campo).toContain("Escribe un entero entre {min.toLocaleString('es-MX')} y {max.toLocaleString('es-MX')}, o déjalo vacío para usar el precio general.")
  expect(`${(1).toLocaleString('es-MX')} y ${LIMITES.precioMax.toLocaleString('es-MX')}`).toBe('1 y 50,000')
  // Un 0 escrito a mano se pinta (no se esconde como «vacío») y sale «Restaurar».
  expect(campo).toContain('useState(textoDe(valor))')
  expect(fuente).toContain("const textoDe = (v: unknown): string => (v === undefined || v === null ? '' : String(v))")
  expect(campo).toContain('sobrescrito && onRestaurar && !deshabilitado')
})

test('11. los campos por nivel salen solo con Secundaria Y Preparatoria (y fuera de solo cursos)', () => {
  expect(preciosPorNivelVisibles(['secundaria', 'preparatoria'])).toBe(!esSoloCursos())
  expect(preciosPorNivelVisibles(['preparatoria', 'secundaria'])).toBe(!esSoloCursos())
  expect(preciosPorNivelVisibles(['preparatoria'])).toBe(false)
  expect(preciosPorNivelVisibles(['secundaria'])).toBe(false)
  expect(preciosPorNivelVisibles(['licenciatura'])).toBe(false)
  expect(preciosPorNivelVisibles([])).toBe(false)
  expect(preciosPorNivelVisibles(['secundaria', 'preparatoria', 'licenciatura']))
    .toBe(preciosPorNivelVisibles(['preparatoria', 'secundaria']))
})

// ─── 5. Textos y detección de cambios ────────────────────────────────────────

test('12. el modal mensual y la nota dicen que un nivel sin precio propio usa el general', () => {
  const con = textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false, porNivel: true })
  const sin = textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false })
  expect(AVISO_PRECIO_POR_NIVEL).toBe('Un nivel sin precio propio usa el precio general.')
  expect(con).toBe(sin.replace(' ¿Publicar?', ` ${AVISO_PRECIO_POR_NIVEL} ¿Publicar?`))
  expect(con.endsWith('¿Publicar?')).toBe(true)
  expect(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: false, porNivel: false })).toBe(sin)
  // En el semanal lo que se cobra es la cuota del plan: el modal no cambia.
  expect(textoConfirmaPrecios({ semanal: true, cambiaTipoCambio: false, porNivel: true }))
    .toBe(textoConfirmaPrecios({ semanal: true, cambiaTipoCambio: false }))
  // Con tipo de cambio, las dos frases.
  expect(textoConfirmaPrecios({ semanal: false, cambiaTipoCambio: true, porNivel: true }))
    .toContain(`${AVISO_PRECIO_POR_NIVEL} El tipo de cambio nuevo`)
  expect(confirmacionDePrecios({ semanal: false, cambiaPrecios: true, cambiaTipoCambio: false, porNivel: true }).mensaje).toBe(con)
  expect(NOTA_PRECIOS_POR_NIVEL).toBe('Un nivel sin precio propio usa el general.')
  // El editor le pasa al modal si la pestaña enseña los campos por nivel.
  const pagina = sinComentarios(leer('src/app/(dashboard)/admin/configuracion/page.tsx'))
  expect(pagina).toMatch(/confirmacionDePrecios\(\{[^}]*porNivel: preciosPorNivelVisibles\(\),\s*\}\)/)
})

test('13. hayCambiosDePrecio ve cada clave por nivel', () => {
  for (const clave of [
    'precios.inscripcionSecundaria',
    'precios.inscripcionPreparatoria',
    'precios.mensualidadSecundaria3Meses',
    'precios.mensualidadSecundaria6Meses',
    'precios.mensualidadPreparatoria3Meses',
    'precios.mensualidadPreparatoria6Meses',
  ]) {
    expect(hayCambiosDePrecio({}, escribirRuta({}, clave, 1500), 'MXN'), clave).toBe(true)
  }
})

// ─── 6. La cifra que publican las e2e (se editan, no se corren aquí) ─────────

test('14. mensualidadQA: si 2500 rompe el escalón (Búfalo: 6 meses a 2800), elige una que el validador acepta', () => {
  const C = CONFIG as unknown as { modalidades: unknown; niveles: unknown; periodicidad?: unknown }
  const antes = { modalidades: C.modalidades, niveles: C.niveles, periodicidad: C.periodicidad }
  const plan = { label: 'x', materiasPorMes: 4, activa: true }
  try {
    C.niveles = ['secundaria', 'preparatoria']
    C.periodicidad = 'mensual'
    C.modalidades = [{ ...plan, id: '3_meses', meses: 3, mensualidad: 3600 }, { ...plan, id: '6_meses', meses: 6, mensualidad: 2800 }]
    const conClavesVacias = <T>(fn: () => T): T =>
      ['mensualidadSecundaria3Meses', 'mensualidadSecundaria6Meses', 'mensualidadPreparatoria3Meses', 'mensualidadPreparatoria6Meses']
        .reduce<() => T>((f, k) => () => conPrecio(k, null, f), fn)()
    conClavesVacias(() => {
      const base = mergeSiteConfig(CONFIG, {})
      const pasa = (v: number) => validarOverrides({ modalidades: { '3_meses': { mensualidad: v } } }, base).ok
      expect(pasa(2500)).toBe(false) // el 2500 fijo de antes: 400
      const qa = mensualidadQA('3_meses')
      expect(pasa(qa)).toBe(true)
      expect(qa).toBeGreaterThanOrEqual(2800)
      // Una cifra NUEVA: la landing prueba que llegó la publicada, no otra igual.
      expect([3600, 2800]).not.toContain(qa)
      // Donde 2500 sí cumple, se queda 2500.
      C.modalidades = [{ ...plan, id: '3_meses', meses: 3, mensualidad: 2000 }, { ...plan, id: '6_meses', meses: 6, mensualidad: 1000 }]
      expect(mensualidadQA('3_meses')).toBe(2500)
    })
  } finally {
    C.modalidades = antes.modalidades
    C.niveles = antes.niveles
    if (antes.periodicidad === undefined) delete C.periodicidad
    else C.periodicidad = antes.periodicidad
  }
})
