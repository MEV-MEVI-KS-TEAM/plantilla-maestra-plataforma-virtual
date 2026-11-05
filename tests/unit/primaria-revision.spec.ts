import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { NIVELES, nivelesValidos, validarMateria } from '@/lib/estructura-contenido'
import {
  EDAD_MINIMA_PRIMARIA,
  MENSAJES_EDAD_TUTOR as M,
  hoyEnMexico,
  revisarEdadTutor,
  revisarEdicionEdadTutor,
} from '@/lib/registro-reglas'
import { validarCorreccionPlan } from '@/lib/corregir-plan'
import { TEXTOS_SOLO_PRIMARIA, ofertaSoloPrimaria } from '@/lib/landing-solo-primaria'
import { esSoloPrimaria } from '@/lib/modalidades'
import { AVISO_MENORES_FABRICA, LIMITES_PRI, preciosDePrimaria } from '@/lib/precios-primaria'
import { certificacionDe, inscripcionEnLanding, subtituloProgramasClasica, textoInscripcion, totalPlanDe } from '@/lib/precios-ui'
import { mergeSiteConfig, type BaseSiteConfig } from '@/lib/site-config-core'
import { inscripcionesDeBorrador } from '@/lib/site-config-editor'

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

// ─── SEP e INEA: textos de fábrica de la landing ─────────────────────────────

const base = (cambios: object) => JSON.parse(JSON.stringify({ ...CONFIG, ...cambios })) as BaseSiteConfig
const PRI_ON = { ...(CONFIG as unknown as ConPrimaria).primaria, activa: true }
const SOLO = () => base({ niveles: ['primaria'], primaria: PRI_ON })
const MIXTO = () => base({ niveles: ['primaria', 'secundaria', 'preparatoria'], primaria: PRI_ON })
/** Lo que nombraría a la autoridad o sugeriría validez oficial. */
const PROHIBIDO = /\bSEP\b|\bINEA\b|Secretar[ií]a de Educaci|validez|certificado oficial|Acreditaci[oó]n/i

test('S1. cada texto del mapa es el de fábrica de hoy: si config.ts cambia, esto avisa', () => {
  const fabrica = JSON.stringify(CONFIG.landing) + JSON.stringify(CONFIG.tagline)
  for (const original of Object.keys(TEXTOS_SOLO_PRIMARIA)) {
    expect(fabrica.includes(JSON.stringify(original).slice(1, -1)), original).toBe(true)
  }
})

test('S2. ningún texto neutral nombra a la autoridad ni promete validez', () => {
  for (const neutral of Object.values(TEXTOS_SOLO_PRIMARIA)) expect(neutral).not.toMatch(PROHIBIDO)
})

test('S3. Solo-Primaria: en toda la landing de fábrica ya no queda SEP ni validez', () => {
  const cfg = mergeSiteConfig(SOLO(), {})
  // La clave `validezOficial` se queda, apagada y sin sus textos.
  expect(cfg.landing.validezOficial).toEqual({ activa: false })
  expect(JSON.stringify(cfg.landing).replace('"validezOficial"', '')).not.toMatch(PROHIBIDO)
  expect(cfg.tagline).toBe('Tu Primaria con apoyo desde casa')
  expect(cfg.landing.hero_titulo).toBe('Tu Primaria')
  expect(cfg.landing.hero_subtitulo).not.toContain('SEP')
  expect(cfg.landing.programas_titulo).toBe('Primaria')
  // La FAQ de documentos pide lo que Primaria pide.
  const docs = cfg.landing.faq_items.find(f => f.q === '¿Qué documentos necesito para inscribirme?')
  expect(docs?.a).toContain('Comprobante de Domicilio')
  expect(docs?.a).not.toContain('Certificado de Primaria')
  // El contador de fábrica ya no dice «Sec · Prepa».
  expect(cfg.landing.contadores[0]).toMatchObject({ valor: 18, etiqueta: 'Materias', sub: 'Primaria' })
})

test('S4. Solo-Primaria: lo que el cliente editó se respeta, en config.ts y en el panel', () => {
  const propio = 'Con el certificado de nuestra escuela, SEP incluida.'
  // Desde el panel.
  expect(mergeSiteConfig(SOLO(), { landing: { hero_subtitulo: propio } }).landing.hero_subtitulo).toBe(propio)
  // Desde el config.ts del cliente.
  const conPropio = SOLO()
  ;(conPropio.landing as unknown as { dolor_cierre_sub: string }).dolor_cierre_sub = propio
  expect(mergeSiteConfig(conPropio, {}).landing.dolor_cierre_sub).toBe(propio)
  // Y si guardó el texto de fábrica tal cual, sigue siendo de fábrica.
  expect(mergeSiteConfig(SOLO(), { landing: { hero_titulo: 'Tu Secundaria o Preparatoria' } }).landing.hero_titulo).toBe('Tu Primaria')
})

test('S5. con Secundaria o Preparatoria no se neutralizan; sin el add-on, los textos no se tocan', () => {
  // Mixto: siguen nombrando el certificado, pero dicen de qué niveles (primaria-conducta.spec.ts).
  expect(mergeSiteConfig(MIXTO(), {}).landing.hero_titulo).toBe('Tu Primaria, Secundaria o Preparatoria')
  expect(mergeSiteConfig(MIXTO(), {}).landing.hero_subtitulo).toContain('certificado SEP en Secundaria y Preparatoria')
  expect(mergeSiteConfig(base({ niveles: ['primaria', 'secundaria'], primaria: PRI_ON }), {}).landing.hero_titulo).toBe('Tu Primaria o Secundaria')
  // Add-on apagado aunque `niveles` no traiga Sec ni Prepa (solo cursos): igual que main.
  const apagada = base({ niveles: [] })
  expect(mergeSiteConfig(apagada, {})).toEqual(apagada)
  expect(ofertaSoloPrimaria(apagada)).toBe(false)
  expect(mergeSiteConfig(CONFIG, {})).toEqual(JSON.parse(JSON.stringify(CONFIG)))
})

test('S6. las dos landings apagan la validez oficial en Solo-Primaria', () => {
  expect(leer('src/components/landing/animada/LandingAnimada.tsx')).toContain('const validezActiva = Boolean(VALIDEZ.activa) && !soloPrimaria')
  const clasica = leer('src/components/landing/LandingClient.tsx')
  expect(clasica).toContain('const validezActiva = VALIDEZ.activa && !soloPrimaria')
  expect(clasica).toContain('{validezActiva && (')
})

// ─── SEP e INEA: documentos legales ──────────────────────────────────────────

const TERMINOS = leer('src/app/(legal)/terminos-y-condiciones/page.tsx')
const AVISO = leer('src/app/(legal)/aviso-de-privacidad/page.tsx')
/** El trozo de fuente entre dos marcas. */
const entre = (s: string, desde: string, hasta: string) => {
  const i = s.indexOf(desde)
  expect(i, desde).toBeGreaterThan(-1)
  const j = s.indexOf(hasta, i + desde.length)
  expect(j, hasta).toBeGreaterThan(-1)
  return s.slice(i, j)
}

test('S7. Solo-Primaria usa la rama sin garantía, en los dos documentos', () => {
  for (const pagina of [TERMINOS, AVISO]) {
    expect(pagina).toContain('const CERTIFICA = CONFIG.ofreceCertificacion && !SOLO_PRIMARIA')
  }
})

test('S8. en términos, la rama de Solo-Primaria no nombra a la SEP y la mixta la acota', () => {
  expect(entre(TERMINOS, '{SOLO_PRIMARIA ? (', ') : (')).not.toMatch(/SEP|Secretar|Secundaria|Preparatoria/)
  const alcances = entre(TERMINOS, '{SOLO_PRIMARIA && CONFIG.ofreceCertificacion ? (', ') : (\n                <p>\n                  <strong style={{ color: \'#fff\' }}>Alcance')
  expect(alcances).not.toMatch(/SEP|Secretar/)
  // Lo que sí la nombra con otros niveles lleva a qué niveles aplica.
  expect(TERMINOS).toContain('acreditación ante la SEP, en {NIVELES_ACOTADOS}.')
  expect(TERMINOS).toContain('certificado oficial de {NIVELES_ACOTADOS} causadas por los plazos de la SEP')
  expect(TERMINOS).toContain('{CON_PRIMARIA && <p>Esta sección aplica solo a los programas de {NIVELES_ACOTADOS}.</p>}')
})

test('S9. en el aviso, Solo-Primaria no transfiere a la SEP y el mixto lo acota', () => {
  // La fila de autoridades solo vive en la rama CERTIFICA, apagada en Solo-Primaria.
  expect(entre(AVISO, '{CERTIFICA && (', '{CON_MENORES && CONFIG.ofreceCertificacion')).toContain('Autoridades educativas (SEP / instituciones convenio)')
  expect(AVISO).toContain('exclusivamente los datos de alumnos de {NIVELES_ACOTADOS} necesarios')
  expect(AVISO).toContain('ante la SEP, en {NIVELES_ACOTADOS}.')
  // Con Primaria, «No transferimos» no nombra a la Secretaría.
  expect(entre(AVISO, '{!CONFIG.ofreceCertificacion && CON_MENORES && (', ')}')).not.toMatch(/SEP|Secretar/)
})

test('S10. sin Primaria, los dos documentos conservan su texto de siempre', () => {
  for (const original of [
    '<li>Gestión y trámite del proceso de acreditación ante la SEP.</li>',
    '<li>Emisión de constancias de avance y certificado oficial al término del programa.</li>',
    'trámites de acreditación ante la Secretaría de Educación Pública ni ante ninguna otra',
    'Demoras en la emisión del certificado oficial causadas por los plazos de la SEP',
  ]) expect(TERMINOS, original).toContain(original)
  for (const original of [
    'CURP, acta de nacimiento, certificados de estudios previos, identificación oficial, fotografía.</li>',
    '<li>Brindar acompañamiento durante el proceso de acreditación ante la SEP.</li>',
    '<li>Emitir constancias de avance académico y gestionar el certificado oficial.</li>',
    '</strong> — exclusivamente los datos necesarios para el trámite de certificación oficial.</li>',
    'de Educación Pública ni ante ninguna otra autoridad, de modo que tu documentación académica',
  ]) expect(AVISO, original).toContain(original)
  // Apagada, Solo-Primaria nunca es verdad: `CERTIFICA` queda igual que `ofreceCertificacion`.
  expect(esSoloPrimaria()).toBe(false)
  expect(esSoloPrimaria([])).toBe(false)
})

// ─── Aviso de privacidad ─────────────────────────────────────────────────────

test('P1. el aviso declara el comprobante y no pide certificados donde no aplican', () => {
  const solo = entre(AVISO, '{SOLO_PRIMARIA ? (\n                <li><strong', ') : CON_MENORES ? (')
  expect(solo).toContain('comprobante de domicilio')
  expect(solo).not.toContain('certificados de estudios previos')
  const mixto = entre(AVISO, ') : CON_MENORES ? (', ') : (\n              <li><strong')
  expect(mixto).toContain('comprobante de domicilio en Primaria')
  expect(mixto).toContain('certificados de estudios previos y fotografía en {NIVELES_ACOTADOS}')
})

test('P2. el párrafo de menores dice quién da el consentimiento y no cita artículos', () => {
  expect(AVISO_MENORES_FABRICA).toContain('consentimiento')
  expect(AVISO_MENORES_FABRICA).toContain('declara ser su madre, padre o tutor')
  expect(AVISO_MENORES_FABRICA.length).toBeLessThanOrEqual(LIMITES_PRI.avisoMenoresMax)
  expect(AVISO_MENORES_FABRICA).not.toMatch(/art[ií]culo|SEP|INEA/i)
})

// ─── La portada cobra lo que anuncia ─────────────────────────────────────────

const GENERAL = 599
const SUYA = 450
const PRECIOS = { ...CONFIG.precios, inscripcion: GENERAL } as unknown as Record<string, unknown>
const TABLA = { activa: true, inscripcion: SUYA, certificacion: 3000 }
const preciosPri = (n: string) => (n === 'primaria' ? preciosDePrimaria(PRECIOS, TABLA) : PRECIOS)
const fmt = (n: number) => `$${n}`

test('I1. combo mixto con inscripciones distintas: cada tarjeta anuncia la suya', () => {
  const ins = inscripcionEnLanding(['primaria', 'secundaria', 'preparatoria'], PRECIOS, fmt, preciosPri)
  expect(ins.textoDe('primaria')).toBe('$450')
  expect(ins.textoDe('secundaria')).toBe('$599')
  expect(ins.comun).toBe(false)
  expect(ins.textoPorNivel).toBe('de $450 en Primaria, de $599 en Secundaria y de $599 en Preparatoria')
  // «Inscripción única $599» ya no se puede afirmar.
  expect(ins.subtituloVale('Inscripción única {inscripcion}')).toBe(false)
  expect(subtituloProgramasClasica(['primaria', 'preparatoria', 'secundaria'], PRECIOS, 'Inscripción única {inscripcion} · Elige', () => 'NO', fmt, preciosPri))
    .toBe('Inscripción de $450 en Primaria, de $599 en Preparatoria y de $599 en Secundaria · Elige tu nivel y plan')
})

test('I2. el total de la tarjeta suma la misma inscripción que anuncia', () => {
  const plan = { id: '3_meses_pri', meses: 3, mensualidad: 2000, materiasPorMes: 6, activa: true, label: '3 Meses' }
  expect(totalPlanDe('primaria', plan, preciosPri('primaria'))).toBe(SUYA + 3 * 2000)
  expect(totalPlanDe('secundaria', plan, preciosPri('secundaria'))).not.toBe(SUYA + 3 * 2000)
})

test('I3. Solo-Primaria: la bajada y {inscripcion} dicen la de Primaria', () => {
  const precios = preciosDePrimaria(PRECIOS, TABLA)
  const ins = inscripcionEnLanding(['primaria'], precios, fmt, n => (n === 'primaria' ? preciosDePrimaria(precios, TABLA) : precios))
  expect(ins.comun).toBe(true)
  expect(ins.textoComun).toBe('$450')
  expect(ins.subtituloVale('Inscripción única {inscripcion}')).toBe(true)
  expect(textoInscripcion(precios.inscripcion as number, { minusculas: true })).toBe(textoInscripcion(SUYA, { minusculas: true }))
  expect(certificacionDe('primaria', precios)).toBe(3000)
  // La clásica, con la misma regla.
  expect(subtituloProgramasClasica(['primaria'], precios, 'Inscripción única {inscripcion}', s => (s ?? '').replace('{inscripcion}', fmt(precios.inscripcion as number)), fmt,
    n => (n === 'primaria' ? preciosDePrimaria(precios, TABLA) : precios))).toBe('Inscripción única $450')
})

test('I4. sin Primaria, la inscripción de las portadas sale igual que siempre', () => {
  const p = { inscripcion: GENERAL }
  const ins = inscripcionEnLanding(['secundaria', 'preparatoria'], p, fmt)
  expect(ins.comun).toBe(true)
  expect(ins.textoComun).toBe('$599')
  expect(ins.subtituloVale('Inscripción única {inscripcion}')).toBe(true)
  expect(subtituloProgramasClasica(['preparatoria', 'secundaria'], p, 'X', () => 'X', fmt)).toBe('X')
})

test('I5. las dos portadas usan esas cifras, y el mismo cálculo en toda la página', () => {
  const animada = leer('src/components/landing/animada/LandingAnimada.tsx')
  for (const linea of [
    'const precios = soloPrimaria ? preciosDePrimaria(preciosGenerales, tablaPri) : preciosGenerales',
    'const ins = inscripcionEnLanding(nivelesTarjeta, precios, undefined, preciosDe)',
    '+ inscripción {ins.textoDe(nivel)}',
    'const totalesPorNivel = nivelesTarjeta.map(n => planesDe(n).map(m => totalPlanDe(n, m, preciosDe(n))))',
    'listaConY(nivelesTarjeta.map(etiquetaNivelConArticulo))',
    '...nivelesTarjeta.map(n => ({',
    '{nivelesCertificacion.map(n => (',
    'dinero(certificacionDe(n, preciosDe(n)))',
    '{certifica && (!conPrimaria || nivelesCertificacion.length > 0) && (',
  ]) expect(animada, linea).toContain(linea)
  const clasica = leer('src/components/landing/LandingClient.tsx')
  expect(clasica).toContain('const p = soloPrimaria ? preciosDePrimaria(config.precios, tablaPri) : config.precios')
  expect(clasica).toContain('Inscripción: {fmt(Number(tablaPri?.inscripcion ?? 0))}')
  expect(clasica).toContain('getTotalPlan({ ...m, activa: true }, Number(tablaPri?.inscripcion ?? 0))')
})

test('I6. el panel ve lo mismo: la vista previa de Solo-Primaria usa la inscripción de Primaria', () => {
  conPrimaria(() => {
    const cifras = inscripcionesDeBorrador({ precios: PRECIOS }, { primaria: { inscripcion: SUYA } })
    expect(cifras).toEqual({ inscripcion: SUYA, inscripcionSecundaria: SUYA, inscripcionPreparatoria: SUYA })
  }, { niveles: ['primaria'] })
  // Mixto y apagado: la general, como siempre.
  conPrimaria(() => {
    expect(inscripcionesDeBorrador({ precios: PRECIOS }, {}).inscripcion).toBe(GENERAL)
  })
  expect(inscripcionesDeBorrador({ precios: PRECIOS }, {}).inscripcion).toBe(GENERAL)
  expect(leer('src/components/admin/personalizar/PestanaPrecios.tsx')).toContain('const soloPri = esSoloPrimaria()')
})

// ─── Corregir plan y datos del tutor ─────────────────────────────────────────

const MODS = CONFIG.modalidades
const CUMPLE = { fecha_nacimiento: '2012-03-10', ...TUTOR }

test('C1. con el add-on apagado, «Corregir plan» sigue igual', () => {
  const plan = { nivel: 'secundaria', carrera: null, modalidad: MODS[0].id }
  expect(validarCorreccionPlan(plan, MODS)).toEqual({ ok: true, plan })
  const r = validarCorreccionPlan({ ...plan, fecha_nacimiento: '2012-03-10' }, MODS)
  expect(r).toEqual({ ok: false, error: 'Campo no permitido: fecha_nacimiento. Solo se aceptan nivel, carrera y modalidad.' })
})

test('C2. pasar a Primaria exige fecha y tutor, con la regla del registro', () => {
  conPrimaria(() => {
    const plan = { nivel: 'primaria', carrera: null, modalidad: '3_meses_pri' }
    expect(validarCorreccionPlan(plan, MODS)).toEqual({ ok: false, error: M.sinFecha })
    expect(validarCorreccionPlan({ ...plan, fecha_nacimiento: '2012-03-10' }, MODS)).toEqual({ ok: false, error: M.sinTutorNombre })
    // Menor de 12: el mismo rechazo que en el registro.
    const hace11 = `${Number(hoyEnMexico().slice(0, 4)) - 11}-01-01`
    expect(validarCorreccionPlan({ ...plan, ...TUTOR, fecha_nacimiento: hace11 }, MODS)).toEqual({ ok: false, error: M.menorDeDoce })
    const ok = validarCorreccionPlan({ ...plan, ...CUMPLE }, MODS)
    expect(ok.ok && ok.plan.edadTutor).toEqual({ fecha_nacimiento: '2012-03-10', tutor_nombre: 'Rosa López', tutor_telefono: '3312345678', tutor_parentesco: 'Madre' })
  })
})

test('C3. Secundaria con el add-on también lo exige; Preparatoria no', () => {
  conPrimaria(() => {
    const sec = { nivel: 'secundaria', carrera: null, modalidad: MODS[0].id }
    expect(validarCorreccionPlan(sec, MODS)).toEqual({ ok: false, error: M.sinFecha })
    expect(validarCorreccionPlan({ ...sec, ...CUMPLE }, MODS).ok).toBe(true)
    const prepa = { nivel: 'preparatoria', carrera: null, modalidad: MODS[0].id }
    expect(validarCorreccionPlan(prepa, MODS)).toEqual({ ok: true, plan: prepa })
  })
})

test('C4. corregir desde la ficha: lo guardado más lo que llega, con la misma regla', () => {
  const fila = { nivel: 'primaria', ...CUMPLE }
  const soloTelefono = revisarEdicionEdadTutor({ tutor_telefono: '5512345678' }, fila, HOY)
  expect(soloTelefono).toEqual({ ok: true, datos: { fecha_nacimiento: '2012-03-10', tutor_nombre: 'Rosa López', tutor_telefono: '5512345678', tutor_parentesco: 'Madre' } })
  expect(revisarEdicionEdadTutor({ tutor_nombre: '' }, fila, HOY)).toEqual({ ok: false, error: M.sinTutorNombre })
  expect(revisarEdicionEdadTutor({ fecha_nacimiento: '2016-01-01' }, fila, HOY)).toEqual({ ok: false, error: M.menorDeDoce })
  expect(revisarEdicionEdadTutor({ tutor_nombre: 'Ana' }, { nivel: 'preparatoria' }, HOY)).toEqual({ ok: false, error: M.noAplica })
})

test('C5. las rutas: datos valida antes de Auth y solo con el add-on; corregir-plan guarda tras los candados', () => {
  const datos = leer('src/app/api/admin/alumnos/[id]/datos/route.ts')
  expect(datos).toContain('if (primariaActiva() && CAMPOS_EDAD_TUTOR.some(campo => campo in body)) {')
  expect(datos.indexOf('revisarEdadTutorDelAlumno(admin')).toBeGreaterThan(-1)
  expect(datos.indexOf('revisarEdadTutorDelAlumno(admin')).toBeLessThan(datos.indexOf('admin.auth.admin.updateUserById'))
  // El módulo que escribe solo conoce las cuatro columnas: el plan sigue sin pasar por aquí.
  expect(leer('src/lib/admin/edad-tutor-alumno.ts')).toContain('.update(datos)')
  const corregir = leer('src/app/api/admin/alumnos/[id]/corregir-plan/route.ts')
  expect(corregir.indexOf("admin.rpc('corregir_plan_estudio'")).toBeGreaterThan(-1)
  expect(corregir.indexOf("admin.rpc('corregir_plan_estudio'")).toBeLessThan(corregir.indexOf('guardarEdadTutor(admin'))
})

test('C6. la ficha ofrece capturarlos y corregirlos, y solo con el add-on', () => {
  const ficha = leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx')
  expect(ficha).toContain('{pideEdadYTutor(corregirForm.nivel, primariaActiva()) && (')
  expect(ficha).toContain("{primariaActiva() && pideEdadYTutor(alumno.nivel, true) && alumno.viewer_rol === 'ADMIN' && (")
  expect(ficha).toContain('<EditarEdadTutor alumnoId={id}')
  // Sin Primaria, el cuerpo de «Corregir plan» no lleva estas claves.
  expect(ficha).toContain('...(revisionEdad?.ok ? revisionEdad.datos : {}),')
})

// ─── Instalación ─────────────────────────────────────────────────────────────

const MIGRACION = leer('supabase/migrations/20261104120000_nivel_primaria.sql')
const SETUP_PRI = leer('scripts/setup-primaria.sql')
const SETUP_MD = leer('SETUP.md')

test('G1. setup-primaria exige la marca que solo deja la última migración', () => {
  const marca = "nivel_primaria:20261104120000"
  expect(MIGRACION).toContain(`COMMENT ON CONSTRAINT materias_nivel_check ON public.materias IS '${marca}'`)
  expect(SETUP_PRI).toContain("obj_description(oid, 'pg_constraint')")
  expect(SETUP_PRI).toContain(`IS DISTINCT FROM '${marca}'`)
  // Mirar el CHECK no sirve: schema.sql ya admite 'primaria'.
  expect(leer('scripts/schema.sql')).toMatch(/materias_nivel_check[\s\S]{0,200}primaria/)
  for (const f of ['scripts/schema.sql', 'supabase/schema.sql']) expect(leer(f), f).not.toContain(marca)
  // Y la comparación de instaladores no mira comentarios: la marca no la rompe.
  expect(leer('scripts/verificar-schema/foto-esquema.sql')).not.toMatch(/obj_description|pg_description/)
})

test('G2. la guarda va antes de sembrar', () => {
  expect(SETUP_PRI.indexOf('IS DISTINCT FROM')).toBeLessThan(SETUP_PRI.indexOf('\\i seed-primaria.sql'))
})

test('G3. SETUP documenta qué pasa al reejecutar B1, 20260812 y 20260820, y qué hacer', () => {
  const seccion = SETUP_MD.slice(SETUP_MD.indexOf('### Solo si el combo vende PRIMARIA'))
  for (const texto of ['B1 (`20260730120000`)', '`20260812120000`', '`20260820120000`', 'instala Cursos antes de sembrar Primaria', 'copia TEMPORAL', 'vuelve a correr `20261104120000_nivel_primaria.sql`']) {
    expect(seccion, texto).toContain(texto)
  }
  // La fila de Cursos de 7bis avisa antes de que corran B1.
  const filaCursos = SETUP_MD.slice(SETUP_MD.indexOf('7bis. **Línea Solo-Cursos'), SETUP_MD.indexOf('### Solo si el combo vende PRIMARIA'))
  expect(filaCursos).toContain('¿La base ya tiene Primaria sembrada?')
  // Y las migraciones ya aplicadas siguen idénticas.
  expect(leer('supabase/migrations/20260812120000_licenciaturas.sql')).not.toContain('primaria')
})

test('G4. la auditoría detecta un CHECK que perdió Primaria', () => {
  const c = leer('scripts/post-setup-primaria-check.sql')
  expect(c.indexOf('P0: Los CHECK')).toBeLessThan(c.indexOf('P1: Materias'))
  expect(c).toContain('correr supabase/migrations/20261104120000_nivel_primaria.sql')
})

test('G5. la migración aborta si algo cuelga de duracion_meses, en vez de perderlo', () => {
  const guarda = MIGRACION.indexOf('FROM pg_depend d')
  expect(guarda).toBeGreaterThan(-1)
  expect(guarda).toBeLessThan(MIGRACION.indexOf('ALTER TABLE public.alumnos DROP COLUMN duracion_meses'))
  expect(MIGRACION).toContain("d.classid <> 'pg_attrdef'::regclass")
  expect(MIGRACION).toContain('ES PARA COMBOS NUEVOS')
})

test('G6. SETUP dice que Primaria no tiene cobro semanal y que mev-tools aborta ese combo', () => {
  const seccion = SETUP_MD.slice(SETUP_MD.indexOf('### Solo si el combo vende PRIMARIA'))
  expect(seccion).toContain('**Cobro semanal:** Primaria no tiene calendario de cuotas semanales')
  expect(seccion).toContain('mev-tools aborta')
})
