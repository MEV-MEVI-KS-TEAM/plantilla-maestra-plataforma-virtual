import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ES_PLANTILLA } from './es-plantilla'
import { interpolar } from '@/lib/site-config-core'
import { etiquetaNivel } from '@/lib/niveles-ui'
import { inscripcionEnLanding, subtituloProgramasClasica, textoInscripcion } from '@/lib/precios-ui'

/**
 * F2-6b y el subtítulo de la landing clásica.
 *
 * - «Mis pagos» (escuelas semanales) pinta la inscripción que le da la API: la
 *   del NIVEL del alumno en la config PUBLICADA. Antes pintaba la de fábrica
 *   (`CONFIG.precios.inscripcion`): lo publicado desde el panel no llegaba.
 * - La clásica ya pinta en cada tarjeta la inscripción de su nivel (F2-6); su
 *   subtítulo de fábrica, «Inscripción única {inscripcion}», no puede decir otra
 *   cifra encima de ellas.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')

const MIS_PAGOS = 'src/app/(dashboard)/alumno/pagos/page.tsx'

test('1. «Mis pagos» pinta la inscripción que devuelve la API, con el formato de la plataforma', () => {
  const pagina = leer(MIS_PAGOS)
  expect(pagina).toContain('{textoInscripcion(datos.inscripcion)}')
  expect(pagina).toMatch(/\n\s+inscripcion: number\n/)
  // Ya no lee la de fábrica (ni ninguna otra del config).
  expect(sinComentarios(pagina)).not.toMatch(/\bprecios\.inscripcion\b/)
  // Y la API sigue dándole ese campo: la del nivel, de lo PUBLICADO (F2-6). Se
  // fija de dónde sale `precios`: si volviera a ser el config de fábrica, «Mis
  // pagos» regresaría al defecto que F2-6b cierra (K5 del diseño).
  const ruta = sinComentarios(leer('src/app/api/alumno/pagos/route.ts'))
  expect(ruta).toContain('const inscripcion = inscripcionDelAlumno(nivel, precios, cfg.licenciaturas)')
  expect(ruta).toMatch(/const cfg = await getSiteConfig\(\)/)
  expect(ruta).toContain('const precios = cfg.precios as unknown as Record<string, unknown>')
  expect(ruta.match(/\bprecios\s*=/g)).toHaveLength(1)
  expect(ruta).not.toMatch(/\bCONFIG\.precios\b/)
  // El formato de la plataforma: 0 es «Sin costo» (antes, «Gratis»).
  expect(textoInscripcion(0)).toBe('Sin costo')
  expect(textoInscripcion(750)).not.toBe('Sin costo')
})

const FABRICA = 'Inscripción única {inscripcion} · Elige tu nivel y plan'
const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
/** Lo que hace la clásica: `interpolar` con {inscripcion} = la GENERAL. */
const subtitulo = (p: Record<string, unknown>, s = FABRICA, niveles = ['preparatoria', 'secundaria']) =>
  subtituloProgramasClasica(niveles, p, s, (x) => interpolar(x ?? '', { inscripcion: fmt(Number(p.inscripcion)) }), fmt)

test('2. clásica sin claves por nivel: el subtítulo del admin sale tal cual (la flota no cambia)', () => {
  for (const general of [599, 0, 1500]) {
    const p = { inscripcion: general, inscripcionSecundaria: null, inscripcionPreparatoria: null }
    expect(subtitulo(p)).toBe(interpolar(FABRICA, { inscripcion: fmt(general) }))
    expect(subtitulo(p, 'Elige tu nivel')).toBe('Elige tu nivel')
  }
  // Una escuela sin Prepa ni Secundaria tampoco lo toca, aunque traiga claves.
  expect(subtitulo({ inscripcion: 599, inscripcionPreparatoria: 1500 }, FABRICA, [])).toBe('Inscripción única $599 · Elige tu nivel y plan')
})

test('3. clásica con los dos niveles en 1,500 y la general en 599: NO dice «Inscripción única $599»', () => {
  const p = { inscripcion: 599, inscripcionSecundaria: 1500, inscripcionPreparatoria: 1500 }
  const s = subtitulo(p)
  expect(s).not.toContain('$599')
  expect(s).not.toContain('única')
  expect(s).toBe('Inscripción de $1,500 · Elige tu nivel y plan')
})

test('4. clásica con inscripciones distintas: una frase por nivel, en el orden de las tarjetas', () => {
  const p = { inscripcion: 599, inscripcionSecundaria: 1000, inscripcionPreparatoria: 1500 }
  expect(subtitulo(p)).toBe(
    `Inscripción de $1,500 en ${etiquetaNivel('preparatoria')} y de $1,000 en ${etiquetaNivel('secundaria')} · Elige tu nivel y plan`)
  // La general en 0 y un nivel con la suya: «sin costo», nunca «$0» ni «de sin costo».
  const cero = subtitulo({ inscripcion: 0, inscripcionPreparatoria: 1500 })
  expect(cero).toBe(`Inscripción de $1,500 en ${etiquetaNivel('preparatoria')} y sin costo en ${etiquetaNivel('secundaria')} · Elige tu nivel y plan`)
  // El PRIMER nivel de las tarjetas paga la general y el otro tiene la suya: tampoco
  // es una inscripción única (iguales entre sí NO; y aunque la primera sea la general).
  expect(subtitulo({ inscripcion: 599, inscripcionSecundaria: 1000, inscripcionPreparatoria: null })).toBe(
    `Inscripción de $599 en ${etiquetaNivel('preparatoria')} y de $1,000 en ${etiquetaNivel('secundaria')} · Elige tu nivel y plan`)
  // Un subtítulo propio que no afirma una inscripción única se respeta.
  expect(subtitulo(p, 'Prepa {inscripcionPreparatoria} · Sec {inscripcionSecundaria}'))
    .toBe('Prepa {inscripcionPreparatoria} · Sec {inscripcionSecundaria}') // (aquí sin vars por nivel: solo se mide que no se reemplace)
})

test('5. la clásica usa esa función con sus niveles de tarjeta, su `texto` y su `fmt`', () => {
  const fuente = leer('src/components/landing/LandingClient.tsx')
  if (!ES_PLANTILLA && !fuente.includes('planesSec.map')) test.skip()
  expect(fuente).toContain("const nivelesTarjetas = ['preparatoria', 'secundaria'].filter(n => (CONFIG.niveles as readonly string[]).includes(n))")
  expect(fuente).toContain('const subtituloProgramas = subtituloProgramasClasica(nivelesTarjetas, p, L.programas_subtitulo, texto, fmt)')
  expect(fuente).toContain('{subtituloProgramas}')
  // El subtítulo ya no se pinta directo en ningún otro sitio.
  expect(sinComentarios(fuente)).not.toContain('{texto(L.programas_subtitulo)}')
})

test('6. el formateador de la clásica no cambia la animada: su default es el de siempre', () => {
  const p = { inscripcion: 0, inscripcionPreparatoria: 1500 }
  const animada = inscripcionEnLanding(['secundaria', 'preparatoria'], p)
  expect(animada.textoDe('preparatoria')).toBe(textoInscripcion(1500, { minusculas: true }))
  expect(animada.textoDe('secundaria')).toBe('sin costo')
  // Con formateador propio, solo cambian los montos > 0; el 0 sigue siendo «sin costo».
  const clasica = inscripcionEnLanding(['preparatoria', 'secundaria'], p, (n) => `${n} USD`)
  expect(clasica.textoDe('preparatoria')).toBe('1500 USD')
  expect(clasica.textoDe('secundaria')).toBe('sin costo')
})
