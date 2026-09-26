import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AVISO_PAGO_UNICO, ofertaAbreTodo, precioCatalogo, precioCursoNumerico, resolverPrecioOferta } from '@/lib/cursos/precio-curso'
import { AVISO_PAGO_UNICO as AVISO_CATALOGO } from '@/lib/cursos/catalogo'
import { aperturaAlAsignar } from '@/lib/cursos/acceso'

/**
 * #208 — decisión de Kevin: el curso de PAGO ÚNICO no es reembolsable una vez
 * que el alumno ya tiene acceso.
 *  - Los Términos lo dicen como EXCEPCIÓN a la cancelación antes del inicio, sin
 *    tocar el reembolso de las demás inscripciones.
 *  - Antes de pagar, donde un curso se anuncia de pago único, va una línea:
 *    «Acceso completo inmediato · no reembolsable una vez activado».
 *  - La línea solo va donde es CIERTA: donde el pago único sale de la ficha del
 *    curso, que es lo que hace que «Asignar» abra todo (C3b).
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('el texto es el que pidió Kevin, y hay una sola fuente', () => {
  expect(AVISO_PAGO_UNICO).toBe('Acceso completo inmediato · no reembolsable una vez activado')
  expect(AVISO_CATALOGO).toBe(AVISO_PAGO_UNICO)
})

test('pago único en el catálogo ⇔ «Asignar» abre todo: el aviso nunca miente', () => {
  const fichas = [
    [2490, 0], [1500, 0], [0.01, 0], [2490, 900], [0, 900], [0, 0], [-5, 0], [0, -5],
    [2490, Number.NaN], [Number.NaN, 0], [Number.NaN, Number.NaN], [null, null], [2490, null],
  ] as const
  for (const [i, m] of fichas) {
    const ficha = { precio_inscripcion: i as number, precio_mensualidad: m as number }
    const anuncia = precioCatalogo(ficha).tipo === 'unico'
    expect(anuncia, `${i}/${m}`).toBe(aperturaAlAsignar(ficha) === 'total')
    expect(anuncia, `${i}/${m}`).toBe(precioCursoNumerico(ficha).tipo === 'unico')
  }
})

test('las cuatro superficies públicas lo pintan en su rama de pago único', () => {
  // /diplomados: la tarjeta del índice.
  const indice = sinComentarios(leer('src/app/diplomados/page.tsx'))
  expect(indice).toMatch(/if \(p\.tipo === 'unico'\) \{[\s\S]{0,400}\{AVISO_PAGO_UNICO\}/)
  // La ficha pública del curso, junto a «Pago único».
  const ficha = sinComentarios(leer('src/app/diplomados/[id]/page.tsx'))
  expect(ficha).toMatch(/>Pago único<\/p>\s*<p [^>]*>\{AVISO_PAGO_UNICO\}<\/p>/)
  // Portada clásica.
  const clasica = sinComentarios(leer('src/components/landing/LandingClient.tsx'))
  expect(clasica).toMatch(/>Pago único<\/p>\s*<p [^>]*>\{AVISO_PAGO_UNICO\}<\/p>/)
  // Portada animada: debajo de la línea de precio, solo si el catálogo dice pago único.
  const animada = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(animada).toMatch(/\{precioCatalogo\(c\)\.tipo === 'unico' && \(\s*<p [^>]*>\{AVISO_PAGO_UNICO\}<\/p>/)
})

test('el registro: con la ficha sí; con el respaldo de config.ts o un paquete, no', () => {
  const reg = sinComentarios(leer('src/app/(auth)/register/page.tsx'))
  // Tarjeta de la oferta de cursos de ingreso: ofertaAbreTodo, con la misma función y
  // los mismos datos que el precio que se pinta.
  expect(reg).toContain("const precioOferta = catalogoListo ? resolverPrecioOferta(o, preciosPublicados) : null")
  expect(reg).toContain('const avisoPagoUnico = precioOferta !== null && ofertaAbreTodo(o, precioOferta, preciosPublicados)')
  expect(reg).toMatch(/\{avisoPagoUnico && \(\s*<span [^>]*>\{AVISO_PAGO_UNICO\}<\/span>/)
  expect(reg).toContain('? <PrecioDeOferta p={resolverPrecioOferta(o, preciosPublicados)} />')
  // «¿Cuál?»: lo decide la ficha del curso elegido, no la cifra mostrada.
  expect(reg).toContain('const fichaElegida  = diplomadoId ? preciosPublicados.get(diplomadoId) ?? null : null')
  expect(reg).toMatch(/\{numElegido\.tipo === 'unico' && fichaElegida && aperturaAlAsignar\(fichaElegida\) === 'total' && \(\s*<p [^>]*>\{AVISO_PAGO_UNICO\}<\/p>/)
  // No aparece en ningún otro lugar del registro.
  expect(reg.match(/\{AVISO_PAGO_UNICO\}/g)).toHaveLength(2)
})

test('ofertaAbreTodo: el aviso de la oferta solo si «Asignar» abrirá TODO', () => {
  const fichas = new Map([
    ['u1', { precio_inscripcion: 2490, precio_mensualidad: 0 }],
    ['u2', { precio_inscripcion: 1500, precio_mensualidad: 0 }],
    ['m1', { precio_inscripcion: 0, precio_mensualidad: 900 }],
    ['c1', { precio_inscripcion: 1500, precio_mensualidad: 900 }],
    ['z1', { precio_inscripcion: 0, precio_mensualidad: 0 }],
  ])
  const oferta = (cursoIds: string[], precio: number, esPaquete = false) => ({ cursoIds, precio, esPaquete })
  const aviso = (o: ReturnType<typeof oferta>, pub: ReadonlyMap<string, { precio_inscripcion: number; precio_mensualidad: number }> | null = fichas) =>
    ofertaAbreTodo(o, resolverPrecioOferta(o, pub), pub)
  // Oferta de un curso con ficha de pago único (precio de la ficha): sí.
  expect(aviso(oferta(['u1'], 1999))).toBe(true)
  // Respaldo de config.ts con la ficha en 0/0: se anuncia pago único y abre el mes 1 → no.
  expect(aviso(oferta(['z1'], 1800))).toBe(false)
  // Ficha mensual o con inscripción + mensualidad: no.
  expect(aviso(oferta(['m1'], 1500))).toBe(false)
  expect(aviso(oferta(['c1'], 1500))).toBe(false)
  // Curso sin publicar (no está en el catálogo) o sin catálogo: no.
  expect(aviso(oferta(['x9'], 1800))).toBe(false)
  expect(aviso(oferta(['u1'], 1999), null)).toBe(false)
  // Paquete: sí solo si TODAS sus fichas son de pago único.
  expect(aviso(oferta(['u1', 'u2'], 3000, true))).toBe(true)
  expect(aviso(oferta(['u1', 'm1'], 3000, true))).toBe(false)
  expect(aviso(oferta(['u1', 'z1'], 3000, true))).toBe(false)
  // Paquete sin precio: «Pide informes», sin aviso.
  expect(aviso(oferta(['u1', 'u2'], 0, true))).toBe(false)
  // Una oferta suelta de un curso: aviso ⇔ aperturaAlAsignar(ficha) === 'total'.
  for (const [id, ficha] of fichas) {
    expect(aviso(oferta([id], 1000)), id).toBe(aperturaAlAsignar(ficha) === 'total')
  }
})

test('el «pago único» de licenciatura y de titulación NO lleva el aviso', () => {
  // Son otra cosa: la inscripción de licenciatura y la certificación al concluir.
  for (const f of ['src/lib/site-config-textos.ts', 'src/lib/site-config-campos.ts', 'src/lib/precios-ui.ts']) {
    expect(leer(f), f).not.toContain('AVISO_PAGO_UNICO')
    expect(leer(f), f).not.toContain('no reembolsable')
  }
  const animada = sinComentarios(leer('src/components/landing/animada/LandingAnimada.tsx'))
  expect(animada.match(/\{AVISO_PAGO_UNICO\}/g)).toHaveLength(1)
})

test('Términos: excepción para el pago único sin tocar el reembolso de las demás inscripciones', () => {
  const t = sinComentarios(leer('src/app/(legal)/terminos-y-condiciones/page.tsx')).replace(/\s+/g, ' ')
  // La viñeta de siempre, palabra por palabra.
  const cienPorCiento = 'Cancelación antes del inicio:</strong> reembolso del 100% de la inscripción si se solicita dentro de los 3 días hábiles siguientes al pago.'
  expect(t).toContain(cienPorCiento)
  const excepcion = 'Excepción — cursos y diplomados de pago único:</strong> los cursos y diplomados que se pagan en una sola exhibición dan acceso completo a todo su contenido en cuanto se asignan al alumno y no son reembolsables una vez dado ese acceso'
  expect(t).toContain(excepcion)
  // En la sección 5, justo después de la del 100 % y antes de la de «durante el programa».
  const i100 = t.indexOf(cienPorCiento)
  const iExc = t.indexOf(excepcion)
  const iDurante = t.indexOf('Cancelación durante el programa:')
  expect(t.indexOf('5. Pagos y Política de Reembolsos')).toBeLessThan(i100)
  expect(i100).toBeLessThan(iExc)
  expect(iExc).toBeLessThan(iDurante)
  // Las demás viñetas siguen iguales.
  expect(t).toContain('no se realizan reembolsos de mensualidades ya pagadas.')
})
