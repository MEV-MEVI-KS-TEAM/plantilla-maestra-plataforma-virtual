import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { refDeProyecto, proyectoLeido, revisarProyecto, revisarProyectoInfra } from '../../scripts/entrega/publicado.mjs'
import { conNombresPublicados } from '../../scripts/entrega/licenciaturas.mjs'
import { cursos, personalizar, licenciaturas, paleta } from '../../scripts/entrega/documento.mjs'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig, interpolar } from '@/lib/site-config-core'
import { whatsappEscuelaDisponible } from '@/lib/contacto-ui'
import { resolverTextosLicenciaturas, textosAutoLicenciaturas } from '@/components/landing/animada/textos-licenciatura'
import type { DesgloseLicenciatura } from '@/lib/licenciatura-utils'

/**
 * Bloque D · D20c — remates d y e del script de entrega.
 *
 * d) El script dice DE QUÉ proyecto de Supabase leyó y qué escuela está
 *    publicada ahí (consola y primera línea de «REVISA»), y aborta si el nombre
 *    publicado no es el de config.ts (un .env.local de otra escuela), salvo
 *    --forzar-proyecto. Los nombres de carrera editados en el panel llegan al PDF
 *    y al WhatsApp, y «sin WhatsApp» usa la regla de las portadas
 *    (whatsappEscuelaDisponible), no «el campo no está vacío».
 * e) El PDF y el WhatsApp explican «Activar según la ficha», «Cobrar» (con su
 *    casilla) y que el secretario también lo hace.
 */

const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const texto = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const GEN = sinComentarios(leer('scripts/entrega/generar-entrega.mjs'))

type Lectura = NonNullable<Parameters<typeof revisarProyecto>[0]['lectura']>
const ok = (data: Record<string, unknown>) => ({ estado: 'ok', data }) as Lectura
const TS = { nombre: 'Instituto Álamo', nombreCompleto: 'Instituto Álamo de Estudios en Línea' }

// ─── d · 1. el proyecto leído ────────────────────────────────────────────────

test('d1. refDeProyecto y proyectoLeido: el ref del subdominio; con dominio propio, el host; sin URL, null', () => {
  expect(refDeProyecto('https://abcd1234.supabase.co')).toBe('abcd1234')
  expect(refDeProyecto('https://abcd1234.supabase.co/')).toBe('abcd1234')
  expect(refDeProyecto('  https://abcd1234.supabase.in  ')).toBe('abcd1234')
  expect(refDeProyecto('https://api.escuela.mx')).toBeNull()
  expect(refDeProyecto(undefined)).toBeNull()
  expect(refDeProyecto(null)).toBeNull()
  expect(proyectoLeido({ NEXT_PUBLIC_SUPABASE_URL: 'https://abcd1234.supabase.co' })).toBe('abcd1234')
  expect(proyectoLeido({ NEXT_PUBLIC_SUPABASE_URL: 'https://api.escuela.mx' })).toBe('api.escuela.mx')
  expect(proyectoLeido({})).toBeNull()
  expect(proyectoLeido(null)).toBeNull()
  expect(proyectoLeido(undefined)).toBeNull()
})

// ─── d · 2. ¿lo publicado es de esta escuela? ────────────────────────────────

test('d2. revisarProyecto: sin nombre publicado, con --solo-config o con el mismo nombre (caja, acentos, espacios), sigue', () => {
  for (const lectura of [ok({}), { estado: 'sin-fila', data: {} } as Lectura, { estado: 'sin-tabla', data: {} } as Lectura, ok({ whatsapp: '5215512345678' })]) {
    const r = revisarProyecto({ lectura, configTs: TS, proyecto: 'abcd1234' })
    expect(r.abortar, lectura.estado).toBeUndefined()
    expect(r.aviso, lectura.estado).toBeUndefined()
    expect(r.revisa).toContain('abcd1234')
    expect(r.revisa).toContain('nada publicado')
    expect(r.log).toBe(`  · ${r.revisa}`)
  }
  // --solo-config: no se leyó nada, no se compara nada.
  const solo = revisarProyecto({ lectura: { estado: 'solo-config', data: {} } as Lectura, configTs: TS, proyecto: 'abcd1234' })
  expect(solo.abortar).toBeUndefined()
  expect(solo.revisa).toContain('no se leyó')
  // Mismo nombre escrito distinto.
  const igual = revisarProyecto({ lectura: ok({ nombre: '  INSTITUTO   alamo ', nombreCompleto: 'instituto álamo de estudios en línea' }), configTs: TS, proyecto: 'abcd1234' })
  expect(igual.abortar).toBeUndefined()
  expect(igual.aviso).toBeUndefined()
  expect(igual.revisa).toContain('«  INSTITUTO   alamo »')
  // Solo el nombre completo publicado: es el que se dice.
  const soloCompleto = revisarProyecto({ lectura: ok({ nombreCompleto: 'Instituto Álamo de Estudios en Línea' }), configTs: TS, proyecto: 'abcd1234' })
  expect(soloCompleto.abortar).toBeUndefined()
  expect(soloCompleto.revisa).toContain('«Instituto Álamo de Estudios en Línea»')
  // Un nombre que no es texto se ignora (la fusión también lo ignora).
  expect(revisarProyecto({ lectura: ok({ nombre: 42, nombreCompleto: null }), configTs: TS, proyecto: 'abcd1234' }).abortar).toBeUndefined()
})

test('d2. revisarProyecto: otro nombre publicado ABORTA (con el ref y los dos nombres); con --forzar-proyecto, avisa', () => {
  const r = revisarProyecto({ lectura: ok({ nombre: 'Otra Escuela' }), configTs: TS, proyecto: 'abcd1234' })
  expect(r.abortar).toBeTruthy()
  expect(r.abortar!.msg).toContain('abcd1234')
  expect(r.abortar!.msg).toContain('Otra Escuela')
  expect(r.abortar!.msg).toContain('Instituto Álamo')
  expect(r.abortar!.ayuda).toContain('--forzar-proyecto')
  expect(r.abortar!.ayuda).toContain('vercel env pull')
  expect(r.revisa).toContain('abcd1234')
  expect(r.revisa).toContain('«Otra Escuela»')
  // Solo el nombre completo distinto también aborta.
  const completo = revisarProyecto({ lectura: ok({ nombre: 'Instituto Álamo', nombreCompleto: 'Colegio Ajeno' }), configTs: TS, proyecto: 'abcd1234' })
  expect(completo.abortar!.msg).toContain('nombreCompleto publicado «Colegio Ajeno»')
  expect(completo.abortar!.msg).not.toContain('nombre publicado «Instituto Álamo»')
  // Forzado: sigue, y queda escrito para REVISA.
  const forzado = revisarProyecto({ lectura: ok({ nombre: 'Otra Escuela' }), configTs: TS, proyecto: 'abcd1234', forzar: true })
  expect(forzado.abortar).toBeUndefined()
  expect(forzado.aviso).toContain('--forzar-proyecto')
  expect(forzado.aviso).toContain('Otra Escuela')
  // Sin .env.local, el renglón lo dice.
  expect(revisarProyecto({ lectura: { estado: 'solo-config', data: {} } as Lectura, configTs: TS, proyecto: null }).revisa).toContain('sin .env.local')
})

test('d2. revisarProyectoInfra: la página de Infraestructura no puede nombrar otro proyecto que el leído', () => {
  expect(revisarProyectoInfra({ urlDatos: undefined, urlEnv: 'https://aaaa.supabase.co' })).toEqual({})
  expect(revisarProyectoInfra({ urlDatos: 'https://aaaa.supabase.co/', urlEnv: 'https://aaaa.supabase.co' })).toEqual({})
  expect(revisarProyectoInfra({ urlDatos: 'https://aaaa.supabase.co', urlEnv: undefined })).toEqual({})
  const otro = revisarProyectoInfra({ urlDatos: 'https://aaaa.supabase.co', urlEnv: 'https://bbbb.supabase.co' })
  expect(otro.abortar!.msg).toContain('aaaa')
  expect(otro.abortar!.msg).toContain('bbbb')
  expect(otro.abortar!.ayuda).toContain('--forzar-proyecto')
  const forzado = revisarProyectoInfra({ urlDatos: 'https://aaaa.supabase.co', urlEnv: 'https://bbbb.supabase.co', forzar: true })
  expect(forzado.abortar).toBeUndefined()
  expect(forzado.aviso).toContain('--forzar-proyecto')
})

// ─── d · 3. nombres de carrera publicados ────────────────────────────────────

type Carrera = { slug: string; nombre: string; desc: string; tipo?: string; esDiplomado?: boolean; nombreConfig?: string }
const CARRERAS: Carrera[] = [
  { slug: 'derecho', nombre: 'Licenciatura en Derecho', desc: 'D.', tipo: 'licenciatura' },
  { slug: 'administracion', nombre: 'Licenciatura en Administración', desc: 'A.', tipo: 'licenciatura' },
  { slug: 'dip-rh', nombre: 'Diplomado en Recursos Humanos', desc: 'R.', tipo: 'diplomado', esDiplomado: true },
]
const nombres = (xs: Carrera[]) => xs.map(c => c.nombre)

test('d3. conNombresPublicados: por slug y recortado; vacío, slug ajeno o diplomado del riel no cambian; tipo y slug se conservan', () => {
  const r = conNombresPublicados(CARRERAS, [
    { slug: 'derecho', nombre: '  Derecho Corporativo  ', desc: '' },
    { slug: 'administracion', nombre: '   ', desc: 'x' },
    { slug: 'no-existe', nombre: 'Fantasma', desc: '' },
    { slug: 'dip-rh', nombre: 'Diplomado renombrado', desc: '' },
  ]) as Carrera[]
  expect(nombres(r)).toEqual(['Derecho Corporativo', 'Licenciatura en Administración', 'Diplomado en Recursos Humanos'])
  expect(r[0]).toEqual({ ...CARRERAS[0], nombre: 'Derecho Corporativo', nombreConfig: 'Licenciatura en Derecho' })
  expect(r[1]).toBe(CARRERAS[1])
  expect(r[2]).toBe(CARRERAS[2])
  // El tipo no se recalcula con el nombre nuevo.
  const curso = conNombresPublicados([{ slug: 'x', nombre: 'Licenciatura en X', desc: '', tipo: 'licenciatura' }], [{ slug: 'x', nombre: 'Curso intensivo de X', desc: '' }]) as Carrera[]
  expect(curso[0].tipo).toBe('licenciatura')
  // El mismo nombre publicado otra vez no es un cambio.
  expect((conNombresPublicados(CARRERAS, [{ slug: 'derecho', nombre: 'Licenciatura en Derecho', desc: '' }]) as Carrera[])[0].nombreConfig).toBeUndefined()
  // Lo que no es lista, o elementos sin forma, se ignora.
  for (const raro of [undefined, null, 'x', {}, [null, 'x', { slug: 3, nombre: 'N' }]]) {
    expect(nombres(conNombresPublicados(CARRERAS, raro) as Carrera[]), JSON.stringify(raro)).toEqual(nombres(CARRERAS))
  }
  // Con comodines, el interpolador de quien llama.
  const interp = (s: string) => interpolar(s, { nombre: 'Álamo' })
  expect((conNombresPublicados(CARRERAS, [{ slug: 'derecho', nombre: 'Derecho {nombre}', desc: '' }], interp) as Carrera[])[0].nombre).toBe('Derecho Álamo')
})

const PLAN = { modalidadId: '12_meses', etiqueta: '12 meses', meses: 12, mensualidad: 1200, inscripcion: 1500, colegiatura: 14400, titulacion: 0, total: 15900 } as unknown as DesgloseLicenciatura

test('d3. paridad: el nombre del documento es EXACTAMENTE el de la tarjeta de la landing', () => {
  const lic = CARRERAS.filter(c => !c.esDiplomado)
  const valores: unknown[] = ['Derecho Corporativo', '  Derecho  ', '', '   ', undefined, null, 42, 'Lic. {nombre}', 'Con {desconocido}']
  const interp = (s: string) => interpolar(s, { nombre: 'Álamo', nombreCompleto: 'Instituto Álamo' })
  let n = 0
  for (const a of valores) for (const b of valores) {
    const publicadas = [{ slug: 'derecho', nombre: a, desc: '' }, { slug: 'administracion', nombre: b, desc: '' }, { slug: 'otra', nombre: 'X', desc: '' }]
    const landing = resolverTextosLicenciaturas(textosAutoLicenciaturas(lic, [PLAN], 'Licenciatura', String), { licenciaturas_carreras: publicadas } as never, interp)
    const doc = conNombresPublicados(lic, publicadas, interp) as Carrera[]
    for (const c of doc) expect(c.nombre, JSON.stringify([a, b, c.slug])).toBe(landing.carreras[c.slug].nombre)
    n++
  }
  expect(n).toBe(valores.length ** 2)
  // Un slug repetido: gana el último en los dos.
  const rep = [{ slug: 'derecho', nombre: 'Primero', desc: '' }, { slug: 'derecho', nombre: 'Segundo', desc: '' }]
  expect((conNombresPublicados(lic, rep) as Carrera[])[0].nombre)
    .toBe(resolverTextosLicenciaturas(textosAutoLicenciaturas(lic, [PLAN], 'Licenciatura', String), { licenciaturas_carreras: rep } as never).carreras.derecho.nombre)
})

test('d3. el PDF: la página de programas lleva el nombre publicado, no el de config.ts', () => {
  const carreras = conNombresPublicados([{ slug: 'derecho', nombre: 'Licenciatura en Derecho', desc: 'Forma abogados.', tipo: 'licenciatura' }],
    [{ slug: 'derecho', nombre: 'Derecho Corporativo', desc: '' }])
  const html = texto([licenciaturas({
    url: 'https://escuela.mx', etiquetaProgramas: 'Licenciaturas',
    licenciaturas: { activas: true, inscripcion: 1000, carreras, modalidades: [{ id: '12_meses', label: '12 meses', meses: 12, mensualidad: 1200, activa: true }] },
  })].flat().join(' '))
  expect(html).toContain('Derecho Corporativo')
  expect(html).not.toContain('Licenciatura en Derecho')
})

// ─── d · 4. sin WhatsApp = la regla de las portadas ──────────────────────────

test('d4. sinWhatsApp con la fusión real: el marcador de ceros o un número inválido son «sin WhatsApp»', () => {
  for (const whatsapp of ['520000000000', '', 'abc', '0000000000']) {
    const m = mergeSiteConfig(CONFIG, { whatsapp } as never)
    expect(whatsappEscuelaDisponible(m.whatsapp), whatsapp).toBe(false)
  }
  // El caso que la regla vieja («el campo no está vacío») dejaba pasar.
  const ceros = mergeSiteConfig(CONFIG, { whatsapp: '520000000000' } as never)
  expect(String(ceros.whatsapp ?? '').trim()).not.toBe('')
  for (const whatsapp of ['3312345678', '5215512345678']) {
    expect(whatsappEscuelaDisponible(mergeSiteConfig(CONFIG, { whatsapp } as never).whatsapp), whatsapp).toBe(true)
  }
  const BASE = { url: 'https://escuela.mx', P: paleta(undefined) }
  expect(personalizar({ ...BASE, sinWhatsApp: true })).toContain('sin botones de WhatsApp')
  expect(personalizar({ ...BASE, sinWhatsApp: false })).not.toContain('sin botones de WhatsApp')
  // Y el generador decide «sin WhatsApp» con ESA regla, sobre la config fusionada.
  expect(GEN).toContain('const SIN_WHATSAPP = !whatsappEscuelaDisponible(CONFIG.whatsapp)')
})

test('d4. en Node puro, como corre el generador: contacto-ui.ts, interpolar y conNombresPublicados cargan', () => {
  const raiz = process.cwd()
  const url = (p: string) => pathToFileURL(join(raiz, p)).href
  const codigo = `
    await import(${JSON.stringify(url('scripts/entrega/alias-src.mjs'))})
    const { interpolar } = await import(${JSON.stringify(url('src/lib/site-config-core.ts'))})
    const { whatsappEscuelaDisponible } = await import(${JSON.stringify(url('src/lib/contacto-ui.ts'))})
    const { conNombresPublicados } = await import(${JSON.stringify(url('scripts/entrega/licenciaturas.mjs'))})
    console.log(JSON.stringify({
      ceros: whatsappEscuelaDisponible('520000000000'), real: whatsappEscuelaDisponible('5215512345678'),
      nombre: conNombresPublicados([{ slug: 'd', nombre: 'Lic. D' }], [{ slug: 'd', nombre: ' {nombre} D ' }], (s) => interpolar(s, { nombre: 'Álamo' }))[0].nombre,
    }))`
  const salida = execFileSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', codigo], { cwd: raiz, encoding: 'utf8' })
  expect(JSON.parse(salida.trim().split('\n').pop()!)).toEqual({ ceros: false, real: true, nombre: 'Álamo D' })
})

// ─── d · 5. el cableado del generador ────────────────────────────────────────

test('d5. el generador: revisa la identidad DESPUÉS de la política y ANTES de fusionar y de contar', () => {
  const forzar = GEN.indexOf("flag('forzar-proyecto')")
  expect(forzar).toBeGreaterThan(GEN.indexOf('politicaPublicado(LECTURA_PUBLICADO)'))
  expect(forzar).toBeLessThan(GEN.indexOf('mergeSiteConfig(CONFIG_TS, PUBLICADO)'))
  expect(forzar).toBeLessThan(GEN.indexOf('await inventario()'))
  expect(GEN).toContain('const PROYECTO = proyectoLeido(leerEnvLocal())')
  expect(GEN).toContain('const IDENTIDAD = revisarProyecto({ lectura: LECTURA_PUBLICADO, configTs: CONFIG_TS, proyecto: PROYECTO, forzar: flag(\'forzar-proyecto\') })')
  expect(GEN).toContain('log(IDENTIDAD.log)')
  expect(GEN).toContain('if (IDENTIDAD.abortar) abortar(IDENTIDAD.abortar.msg, IDENTIDAD.abortar.ayuda)')
  expect(GEN).toContain('if (IDENTIDAD.aviso) avisar(IDENTIDAD.aviso)')
  // Infraestructura: el proyecto de entrega.local.json contra el de .env.local, antes del inventario.
  expect(GEN.indexOf('revisarProyectoInfra({')).toBeGreaterThan(GEN.indexOf('const D = JSON.parse('))
  expect(GEN.indexOf('revisarProyectoInfra({')).toBeLessThan(GEN.indexOf('await inventario()'))
  // «REVISA» sale SIEMPRE, con la identidad primero y todos los avisos después.
  const fin = GEN.slice(GEN.indexOf('hasta aquí'), GEN.indexOf('✓ Entrega lista'))
  expect(fin).not.toContain('if (AVISOS.length)')
  expect(fin.indexOf('REVISA ANTES DE ENVIAR')).toBeGreaterThan(-1)
  expect(fin.indexOf('log(`  · ${IDENTIDAD.revisa}`)')).toBeGreaterThan(fin.indexOf('REVISA ANTES DE ENVIAR'))
  expect(fin.indexOf('for (const a of AVISOS) log(')).toBeGreaterThan(fin.indexOf('IDENTIDAD.revisa'))
})

test('d5. el generador: WhatsApp real con whatsappEscuelaDisponible y nombres de carrera del panel', () => {
  // contacto-ui.ts se importa como los demás .ts: después de revisar Node y de cargar el alias.
  const imp = GEN.indexOf("'src/lib/contacto-ui.ts'")
  expect(imp).toBeGreaterThan(GEN.indexOf('NODE_MAJOR < 23'))
  expect(imp).toBeGreaterThan(GEN.indexOf("await import('./alias-src.mjs')"))
  expect(GEN).not.toMatch(/^import[^\n]*contacto-ui/m)
  expect(GEN).toContain('const SIN_WHATSAPP = !whatsappEscuelaDisponible(CONFIG.whatsapp)')
  expect(GEN).not.toMatch(/String\(CONFIG\.whatsapp/)
  expect(GEN).toContain('sinWhatsApp: SIN_WHATSAPP,')
  expect(GEN).toContain("whatsappDisplay: SIN_WHATSAPP ? '' : CONFIG.whatsappDisplay,")
  expect(GEN).toContain('if (SIN_WHATSAPP) {')
  // Nombres: después de decidir el tipo, con los publicados en la landing.
  expect(GEN).toContain('const CARRERAS = conNombresPublicados(')
  expect(GEN.indexOf('tipo: tipoDePrograma(c)')).toBeLessThan(GEN.indexOf('CONFIG.landing?.licenciaturas_carreras'))
  expect(GEN.indexOf('const CARRERAS = conNombresPublicados(')).toBeLessThan(GEN.indexOf('const TIPOS = '))
  expect(GEN).toContain('avisar(`Carreras: el documento usa el nombre publicado en el panel,')
  expect(GEN).toContain('El registro, el panel y las constancias siguen diciendo')
  // La regla vive en licenciaturas.mjs, que sigue sin importar nada (documento.mjs lo importa).
  expect(leer('scripts/entrega/licenciaturas.mjs')).not.toMatch(/^\s*import\s/m)
})

test('d5. el README documenta --solo-config y --forzar-proyecto en la tabla de flags', () => {
  const r = leer('scripts/entrega/README.md')
  expect(r).toContain('| `--solo-config` |')
  expect(r).toContain('| `--forzar-proyecto` |')
  expect(r).toContain('landing.licenciaturas_carreras')
  expect(r).toContain('whatsappEscuelaDisponible')
  expect(leer('scripts/entrega/generar-entrega.mjs')).toContain('pnpm entrega --forzar-proyecto')
})

// ─── e. «Activar según la ficha», «Cobrar» y el secretario ───────────────────

const BASE_CURSOS = {
  url: 'https://escuela.mx',
  P: paleta(undefined),
  modalidadesCols: ['Modalidad', 'Duración'],
  modalidadesFilas: [['Plan 3 meses', '3 meses']],
}
const UNO = { cursosPublicados: 1, cursosLista: [{ nombre: 'EXANI-II', precio: '$2,490 de pago único' }] }

test('e1. «Cómo empezar» con cursos: Activar según la ficha, Cobrar con su casilla y el secretario', () => {
  const t = texto(cursos({ ...BASE_CURSOS, ...UNO, menuCursos: 'Gestionar Cursos' }))
  expect(t).toContain('pulsa Activar según la ficha en su fila')
  expect(t).toContain('Registra cada pago con Cobrar , en su fila o en la tarjeta Cursos de la ficha del alumno')
  expect(t).toContain('si aparece la casilla para abrir y la dejas marcada, ese mismo cobro le abre lo que pagó; sin marcar, solo queda registrado')
  expect(t).toContain('Abrir todo el curso pide doble confirmación')
  expect(t).toContain('Quien tenga el rol de secretario también asigna, activa, cobra, abre y emite constancias (en su menú, Cursos )')
  expect(t).toContain('cambiar precios, cancelar o reactivar una inscripción y borrar pagos quedan solo en tu cuenta')
  // El orden de siempre: el precio en la ficha, antes de asignar, y después el de preparación para examen.
  const ingreso = texto(cursos({ ...BASE_CURSOS, ...UNO, vendeIngreso: true }))
  expect(ingreso).toContain('antes de asignar. Si lo pidió como curso de preparación para examen, aparece en Alumnos con lo que solicitó: pulsa Asignar ahí')
  expect(ingreso.indexOf('curso de preparación para examen')).toBeLessThan(ingreso.indexOf('rol de secretario'))
})

test('e1. «(en su menú, Cursos)» solo con «Gestionar Cursos»; en solo_cursos nunca «Gestionar Cursos»', () => {
  const solo = texto(cursos({ ...BASE_CURSOS, ...UNO, menuCursos: 'Diplomados' }))
  expect(solo).toContain('asígnalo en Diplomados → el curso → Alumnos')
  expect(solo).toContain('rol de secretario también asigna, activa, cobra, abre y emite constancias;')
  expect(solo).not.toContain('en su menú')
  expect(solo).not.toContain('Gestionar Cursos')
  // Sin menú explícito vale «Gestionar Cursos», y entonces sí se dice el del secretario.
  expect(texto(cursos({ ...BASE_CURSOS, ...UNO }))).toContain('(en su menú, Cursos )')
})

test('e1b. «Qué te permite hacer»: Cobrar SIEMPRE, con o sin cursos, y sin contradecir el módulo vacío', () => {
  for (const d of [UNO, { cursosPublicados: 0, cursosLista: [] }]) {
    const t = texto(cursos({ ...BASE_CURSOS, ...d }))
    expect(t).toContain('Registrar cada pago con Cobrar —en la ficha del alumno (tarjeta Cursos ) o en la lista del curso— y abrirle en el mismo paso lo que pagó; también desde una cuenta de secretario')
  }
  const vacio = texto(cursos({ ...BASE_CURSOS, cursosPublicados: 0, cursosLista: [] }))
  expect(vacio).toContain('crea tu primer curso')
  expect(vacio).not.toContain('Activar según la ficha')
  const lleno = cursos({ ...BASE_CURSOS, cursosPublicados: 2, cursosLista: [UNO.cursosLista[0], { nombre: 'UNAM', precio: '$1 de pago único' }] })
  for (const no of ['vacío', 'crea tu primer curso', 'no se muestra en tu página pública', 'curso(s)']) expect(lleno).not.toContain(no)
})

test('e2/e3. funcionalidad y WhatsApp: Activar según la ficha, Cobrar con su casilla y el secretario (que también emite constancias)', () => {
  // Funcionalidad entregada (PDF).
  expect(GEN).toContain('a quien se registró desde tu página eligiendo el curso, con «Activar según la ficha»; y «Cobrar» registra cada pago y, con su casilla marcada, le abre lo que pagó, también desde una cuenta de secretario')
  expect(GEN).toContain("'Rol de secretario con accesos delimitados: registra pagos, abre meses del programa y de los cursos y emite constancias; precios, borrado de pagos, «Personalizar mi página» y alta de usuarios quedan solo en tu cuenta'")
  expect(GEN).not.toContain("'Rol de secretario con accesos delimitados',")
  // «LO QUE PUEDES HACER DESDE TU PANEL» (WhatsApp), una línea por cosa.
  expect(GEN).toContain('→ el curso → Alumnos (en uno de pago único se les abre completo; en uno mensual o sin precio, el mes 1), seguir su avance y crear todos los que quieras')
  expect(GEN).toContain('• Abrir el curso a quien ya se registró desde tu página eligiendo el curso, con «Activar según la ficha» en su fila')
  expect(GEN).toContain("'• Registrar cada pago del curso con «Cobrar» (en su fila o en la tarjeta «Cursos» de la ficha del alumno): con la casilla marcada, ese mismo cobro le abre lo que pagó'")
  expect(GEN).toContain("'• Todo esto también lo puede hacer quien tenga el rol de secretario, incluso emitir constancias; cambiar precios, cancelar o reactivar una inscripción y borrar pagos quedan solo en tu cuenta'")
  expect(GEN).toContain("] : ['• Crear tus propios Cursos y Diplomados cuando quieras']),")
  // Los botones viejos ya no se mandan como el camino de quien se registró solo.
  expect(GEN).not.toContain('con «Abrir todo» o «+ Abrir mes»')
  expect(GEN).not.toContain('con «Abrir todo» (pago único) o «+ Abrir mes» (mensual)')
})
