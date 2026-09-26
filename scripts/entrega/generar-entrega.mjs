#!/usr/bin/env node
/**
 * generar-entrega.mjs — ÚLTIMO PASO del proceso de desarrollo MEV.
 *
 * Produce los dos entregables finales de cualquier cliente de la plantilla:
 *   entrega/<SLUG>_Entrega_Oficial.pdf
 *   entrega/ENTREGA-WHATSAPP.txt
 *
 * Uso:
 *   pnpm entrega                    # PDF + mensaje
 *   pnpm entrega --solo-pdf         # solo el PDF
 *   pnpm entrega --datos otro.json  # otro archivo de datos
 *   pnpm entrega --solo-config      # sin leer lo publicado en el panel
 *   pnpm entrega --forzar-proyecto  # genera aunque el nombre publicado no sea el de config.ts
 *
 * TODO lo que sabe del cliente lo saca de `src/lib/config.ts` y de la base de
 * datos: nombre, dominio, colores, logo, niveles, modalidades, precios,
 * licenciaturas y conteo real de contenido. Lo único que no vive en el config
 * son las credenciales, que van en `entrega.local.json` (ignorado por git).
 *
 * REGLA DEL DOMINIO: el documento se emite SIEMPRE con el dominio definitivo
 * del cliente. Si `CONFIG.dominio` está vacío o apunta a un host provisional
 * (vercel.app, netlify.app, localhost), el script ABORTA. Un documento de
 * entrega oficial con una URL temporal envejece mal: el cliente lo guarda, lo
 * reenvía, y meses después el enlace ya no existe.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { construirHTML, mxn, cap, fijarMoneda } from './documento.mjs'
import { repartirPaginas } from './paginar.mjs'
import {
  esSemanal, planesSemanales, tablaPrecios, colsModalidades, filasModalidades,
  frasesSemanales, lineasPreciosWhatsApp, ofertaInformativa,
  problemaDePrecios, nivelesSinPlanes, tablaPreciosMensual, filasModalidadesMensual, frasesMensuales,
  lineasPreciosMensualWhatsApp, ofreceCertificacion, certificacionEntrega,
} from './planes.mjs'
import { cuentasDeEntrega, secretosEn, nombresDeCuentas } from './cuentas.mjs'
import {
  unirConY, soloLicenciaturas, desglosesLicenciatura, porcentajeTitulacionTexto, nombrarProgramas,
  ritmoDeApertura, planLicVendible, planesLicSinMensualidad, conNombresPublicados,
} from './licenciaturas.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// El import directo de `src/lib/config.ts` depende del type stripping nativo
// de Node (sin flag desde 23.6). Con un Node anterior el error es críptico
// ("Unknown file extension .ts"); mejor decirlo claro y antes de nada.
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number)
if (NODE_MAJOR < 23 || (NODE_MAJOR === 23 && NODE_MINOR < 6)) {
  console.error(`\n✖ Este script necesita Node >= 23.6 (tienes ${process.versions.node}).`)
  console.error('Usa nvm/fnm para cambiar de versión y vuelve a correr `pnpm entrega`.')
  process.exit(1)
}
const args = process.argv.slice(2)
const flag = (n) => args.includes(`--${n}`)
const opt = (n, def) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : def }

const log = (...a) => console.log(...a)
// Lo que el operador tiene que revisar antes de enviar: se imprime al momento y
// otra vez al final, junto al «✓», para que no quede enterrado arriba del
// volcado del WhatsApp.
const AVISOS = []
const avisar = (msg) => { AVISOS.push(msg); log(`  ⚠ ${msg}`) }
const abortar = (msg, ayuda) => {
  console.error(`\n✖ ${msg}`)
  if (ayuda) console.error(`\n${ayuda}`)
  process.exit(1)
}

/* ── Constantes de la línea MEV ──────────────────────────────────────────── */
const TUTORIALES = {
  playlist: 'https://www.youtube.com/playlist?list=PLWcWYoZvoCwk',
  alumno: 'https://youtu.be/yWtejlC2t_U',
}
const SOPORTE = {
  horario: 'Lunes a viernes · 9:00 — 18:00 (hora de México)',
  respuesta: 'Hasta 24 horas hábiles',
  canal: 'WhatsApp o correo electrónico',
}
const HOSTS_PROVISIONALES = ['vercel.app', 'netlify.app', 'localhost', '127.0.0.1', 'onrender.com', 'pages.dev']

/* ── 1. Config del cliente: config.ts + lo publicado en el panel ──────────── */
// config.ts tal cual está en el repo: solo para lo que se decide sobre él (si la
// escuela PUEDE publicar precios de licenciatura, la tabla base de licenciatura,
// el logo de respaldo). Todo lo demás sale de CONFIG, la fusión de abajo.
const { CONFIG: CONFIG_TS } = await import(pathToFileURL(path.join(RAIZ, 'src/lib/config.ts')).href)
// D12 (#201; decisiones 17-19): el documento usa TODO lo publicado en «Personalizar
// mi página», con la MISMA fusión que la app (getSiteConfig → mergeSiteConfig).
// site-config-core importa con el alias '@/…': el hook lo resuelve a src/ sin
// tocar el tsconfig de la app.
await import('./alias-src.mjs')
const { mergeSiteConfig, interpolar } = await import(pathToFileURL(path.join(RAIZ, 'src/lib/site-config-core.ts')).href)
const { leerSiteConfig, politicaPublicado, revisarProyecto, proyectoLeido, revisarProyectoInfra } = await import('./publicado.mjs')
log('· Leyendo lo publicado en el panel…')
const LECTURA_PUBLICADO = await leerSiteConfig({
  soloConfig: flag('solo-config'),
  vars: leerEnvLocal(),
  // Con tope de tiempo: una base que no responde no debe colgar la entrega.
  crearCliente: async (url, key) => (await import('@supabase/supabase-js')).createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (u, o = {}) => fetch(u, { ...o, signal: o.signal ?? AbortSignal.timeout(20000) }) },
  }),
})
{
  const pol = politicaPublicado(LECTURA_PUBLICADO)
  if (pol.abortar) abortar(pol.abortar.msg, pol.abortar.ayuda)
  if (pol.log) log(pol.log)
  if (pol.aviso) avisar(pol.aviso)
}
// D20c: de QUÉ proyecto se leyó y qué escuela está publicada ahí, en consola y
// como primera línea de «REVISA». Un .env.local de otra escuela daba un
// documento con los precios, el WhatsApp y el logo de otra escuela sin decir
// nada: si el nombre publicado no es el de config.ts, se aborta ANTES de fusionar
// y de contar nada (salvo --forzar-proyecto, que queda en «REVISA»).
const PROYECTO = proyectoLeido(leerEnvLocal())
const IDENTIDAD = revisarProyecto({ lectura: LECTURA_PUBLICADO, configTs: CONFIG_TS, proyecto: PROYECTO, forzar: flag('forzar-proyecto') })
log(IDENTIDAD.log)
if (IDENTIDAD.abortar) abortar(IDENTIDAD.abortar.msg, IDENTIDAD.abortar.ayuda)
if (IDENTIDAD.aviso) avisar(IDENTIDAD.aviso)
const PUBLICADO = LECTURA_PUBLICADO.data
/** La config de la escuela como la ve su página: config.ts con lo publicado encima. */
const CONFIG = mergeSiteConfig(CONFIG_TS, PUBLICADO)
// ¿La escuela tiene un WhatsApp REAL? La MISMA regla con la que las dos portadas
// encienden sus botones (urlWhatsAppEscuela → whatsappEscuelaDisponible). Antes
// bastaba con que el campo no estuviera vacío: el marcador `520000000000` salía
// en el PDF como «WhatsApp de contacto» y sin el aviso de cómo encender los
// botones, que en la página no aparecen.
const { whatsappEscuelaDisponible } = await import(pathToFileURL(path.join(RAIZ, 'src/lib/contacto-ui.ts')).href)
const SIN_WHATSAPP = !whatsappEscuelaDisponible(CONFIG.whatsapp)
// El precio de cada NIVEL sale del mismo resolver que usa la plataforma
// (landing, estado de cuenta, ficha). Es puro —solo un `import type`— y por eso
// se importa igual que config.ts. Ver la Fase 2 en precios-nivel.ts.
const { inscripcionDe, mensualidadDe, certificacionDe } =
  await import(pathToFileURL(path.join(RAIZ, 'src/lib/precios-nivel.ts')).href)
// Los precios de LICENCIATURA publicados en el panel se aplican con la MISMA
// regla que usa la plataforma al fusionar (Bloque B): también es puro.
const { licenciaturaEfectiva, bloqueLicEditable, planLicEditable } =
  await import(pathToFileURL(path.join(RAIZ, 'src/lib/precios-licenciatura.ts')).href)
// Los CURSOS (Bloque C): cómo se leen, qué precio se pinta y si el documento
// contradice al registro, con las MISMAS reglas que la página (precio-regla.ts y
// oferta-regla.ts, sin imports). Se importa aquí, después de revisar la versión
// de Node, porque arrastra .ts. Antes el PDF decía «Lo defines tú» donde la
// página ya decía «Pide informes».
const { leerCursosPublicados, precioDeCurso: precioDeCursoCon, revisarCursos, filaResumenCursos, cursosParaDocumento, registroPideIngreso } =
  await import('./cursos-entrega.mjs')


const dominio = String(CONFIG.dominio || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
if (!dominio) abortar('CONFIG.dominio está vacío.',
  'El documento de entrega se emite con el dominio definitivo del cliente.\nDefínelo en src/lib/config.ts antes de generar la entrega.')
if (HOSTS_PROVISIONALES.some(h => dominio.includes(h)))
  abortar(`CONFIG.dominio apunta a un host provisional: ${dominio}`,
    'El documento de entrega NO se emite con URLs temporales.\nRegistra y conecta el dominio definitivo, ponlo en src/lib/config.ts y vuelve a correr.')
const URL_BASE = `https://${dominio}`

// Todos los importes del PDF y del mensaje salen en la moneda REAL de la
// escuela. Se fija ANTES de construir nada.
fijarMoneda(CONFIG.moneda)

/**
 * ¿La escuela tiene un folio de validación propio y publicado?
 *
 * 🛑 NO ES LO MISMO QUE `validez`. Esa bandera dice si la escuela vende su
 * certificado con validez oficial; esto dice si además tiene un FOLIO que un
 * prospecto pueda teclear en el portal SIGED. Son cosas distintas y la landing
 * ya las separa: gatea el bloque «Verifícalo tú mismo» por `folio !== ''`.
 *
 * El documento no lo hacía, y anunciaba «con folio verificable en el portal
 * SIGED de la SEP» en TODAS las escuelas. En una que entrega sin folio propio
 * —AULA RAÍZ #208, cuya red comparte una acreditación que no es suya y que por
 * eso NO se copia a su config— eso es un documento oficial que promete algo que
 * su propia página no muestra: el cliente lo reenvía, un prospecto pide
 * verificar y no hay nada que teclear.
 *
 * Sale de CONFIG, no del archivo de datos: es el mismo criterio del README —lo
 * que ya está en el config no se captura dos veces— y así no se puede quedar
 * desincronizado con la página.
 */
const FOLIO_VERIFICABLE =
  String(CONFIG.landing?.validezOficial?.folio ?? '').trim() !== ''

/* ── 2. Credenciales (fuera del repo) ────────────────────────────────────── */
const rutaDatos = path.join(RAIZ, opt('datos', 'entrega.local.json'))
if (!fs.existsSync(rutaDatos)) abortar(`No encuentro ${path.basename(rutaDatos)}`, [
  'Crea ese archivo en la raíz del repo (git lo ignora) con esta forma:',
  '',
  JSON.stringify({
    adminNombre: 'Nombre del administrador',
    adminGenero: 'f',
    adminEmail: 'admin@cliente.com',
    adminPassword: '••••••',
    alumnoEmail: 'prueba@gmail.com',
    alumnoPassword: '12345678',
    cuentas: {
      correo: { email: 'cuentas@cliente.com', password: '••••••' },
      supabase: { email: 'cuentas@cliente.com', password: '••••••' },
      godaddy: { email: 'cuentas@cliente.com', password: '••••••' },
    },
  }, null, 2),
].join('\n'))
const D = JSON.parse(fs.readFileSync(rutaDatos, 'utf8'))
for (const k of ['adminNombre', 'adminEmail', 'adminPassword'])
  if (!D[k]) abortar(`Falta "${k}" en ${path.basename(rutaDatos)}`)
// D20c: la página de Infraestructura nombra el proyecto de `supabaseUrl` (si
// viene en el archivo de datos); lo publicado y el inventario salen del de
// .env.local. Si son dos proyectos distintos, el PDF diría uno y reflejaría otro.
{
  const infraProyecto = revisarProyectoInfra({
    urlDatos: D.infraestructura === false ? null : D.supabaseUrl,
    urlEnv: leerEnvLocal()?.NEXT_PUBLIC_SUPABASE_URL,
    forzar: flag('forzar-proyecto'),
  })
  if (infraProyecto.abortar) abortar(infraProyecto.abortar.msg, infraProyecto.abortar.ayuda)
  if (infraProyecto.aviso) avisar(infraProyecto.aviso)
}

// 🛑 Un token o una llave en el archivo de datos acabaría en un PDF que se
// reenvía y se guarda en cualquier parte. Se busca por forma en TODO el archivo
// y se nombra el campo, nunca el valor.
const SECRETOS = secretosEn(D)
if (SECRETOS.length) abortar(`${path.basename(rutaDatos)} trae secretos que nunca van en la entrega:\n  ${SECRETOS.join('\n  ')}`,
  'El access token de Supabase (sbp_…), las llaves anon/service_role y la cadena de conexión de la\nbase de datos se entregan por canal seguro, nunca en el documento. Quítalos del archivo y vuelve a correr.')

/**
 * Cuentas del cliente —su correo, Supabase y el registrador del dominio— que van
 * con su contraseña en la página de Infraestructura (`cuentas` en
 * entrega.local.json). Son suyas: sin ellas no puede renovar el dominio ni
 * entrar a su base de datos.
 */
const REGISTRADOR = D.registrador || 'GoDaddy'
let CUENTAS_CLIENTE = null
try { CUENTAS_CLIENTE = cuentasDeEntrega(D.cuentas) } catch (e) { abortar(`${path.basename(rutaDatos)}: ${e.message}`) }
if (!CUENTAS_CLIENTE)
  log(`  ⚠ sin "cuentas" en ${path.basename(rutaDatos)} — el PDF sale sin los accesos del correo, Supabase y ${REGISTRADOR} del cliente`)

/**
 * Alumnos de prueba que se entregan: uno, como siempre (`alumnoEmail`), o varios
 * con `alumnosPrueba: [{ email, password }]`. Una escuela que vende cada nivel con
 * otra duración entrega uno por nivel, porque sus calendarios no se parecen
 * (CAU #200: 12 semanas en secundaria, 24 en preparatoria).
 */
const ALUMNOS_PRUEBA = Array.isArray(D.alumnosPrueba) && D.alumnosPrueba.length
  ? D.alumnosPrueba.filter(a => a?.email)
  : (D.alumnoEmail ? [{ email: D.alumnoEmail, password: D.alumnoPassword }] : [])

/* ── 2b. Licenciatura con lo publicado ────────────────────────────────────── */
/**
 * Los precios de LICENCIATURA publicados se aplican con `licenciaturaEfectiva`,
 * la regla de la plataforma, sobre la tabla de config.ts (la fusión de arriba no
 * la toca dos veces). Si la escuela PUEDE publicarlos lo decide config.ts.
 */
const PUEDE_PUBLICAR_LIC = bloqueLicEditable(CONFIG_TS.licenciaturas)
/** La tabla de licenciatura con lo publicado encima (la de config.ts si no hay nada). */
const LIC = licenciaturaEfectiva(CONFIG_TS.licenciaturas, PUBLICADO.licenciaturas)
if (JSON.stringify(LIC) !== JSON.stringify(CONFIG_TS.licenciaturas)) log('  · licenciatura: con los precios publicados en el panel')

/** .env.local del repo (lo publicado y el inventario). Aguanta CRLF y BOM. */
function leerEnvLocal() {
  const env = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(env)) return null
  // `\r?\n`: un .env.local guardado en Windows (CRLF) también se lee; sin BOM.
  return Object.fromEntries(fs.readFileSync(env, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)
    .map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean)
    .map(m => [m[1], m[2].trim().replace(/^["']|["']$/g, '')]))
}

/* ── 3. Conteo real de contenido ─────────────────────────────────────────── */
async function inventario() {
  // leerEnvLocal: la misma lectura que lo publicado, que aguanta un .env.local
  // guardado en Windows (CRLF) y con BOM.
  const vars = leerEnvLocal()
  if (!vars) { log('  · sin .env.local — se omite el inventario'); return {} }
  const url = vars.NEXT_PUBLIC_SUPABASE_URL, key = vars.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { log('  · .env.local sin credenciales — se omite el inventario'); return {} }
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const n = async (tabla, filtro) => {
    let q = sb.from(tabla).select('*', { count: 'exact', head: true })
    if (filtro) q = filtro(q)
    const { count, error } = await q
    return error ? null : (count ?? 0)
  }
  const inv = {}
  for (const nivel of CONFIG.niveles) {
    if (nivel === 'licenciatura') continue
    inv[`materias_${nivel}`] = await n('materias', q => q.eq('nivel', nivel).eq('activa', true))
  }

  // Programas de licenciatura: se cuenta POR CARRERA, no en bloque. Todas
  // comparten `nivel = 'licenciatura'`, así que un conteo por nivel sumaría los
  // programas entre sí y el documento diría "48 materias" donde el alumno de
  // cada uno cursa 24. Ver Bug 59 del playbook.
  inv.porCarrera = {}
  for (const c of (LIC?.activas ? (LIC.carreras || []) : [])) {
    const materias = await n('materias', q => q.eq('carrera', c.slug).eq('activa', true))
    if (materias == null) continue
    const { data: ids } = await sb.from('materias').select('id').eq('carrera', c.slug).eq('activa', true)
    const materiaIds = (ids || []).map(x => x.id)
    let evaluaciones = 0, preguntas = 0, quiz = 0, semanas = 0
    if (materiaIds.length) {
      const { data: ev } = await sb.from('evaluaciones').select('id').in('materia_id', materiaIds)
      const evIds = (ev || []).map(x => x.id)
      evaluaciones = evIds.length
      if (evIds.length) preguntas = await n('preguntas', q => q.in('evaluacion_id', evIds)) ?? 0
      const { data: mc } = await sb.from('meses_contenido').select('id').in('materia_id', materiaIds)
      const mesIds = (mc || []).map(x => x.id)
      if (mesIds.length) {
        const { data: sem } = await sb.from('semanas').select('id').in('mes_id', mesIds)
        const semIds = (sem || []).map(x => x.id)
        semanas = semIds.length
        if (semIds.length) quiz = await n('quiz_semana', q => q.in('semana_id', semIds)) ?? 0
      }
    }
    inv.porCarrera[c.slug] = { materias, semanas, evaluaciones, preguntas, quiz }
  }
  inv.materias_demo = await n('materias', q => q.eq('nivel', 'demo'))
  inv.semanas = await n('semanas')
  inv.evaluaciones = await n('evaluaciones')
  inv.preguntas = await n('preguntas')
  inv.quiz = await n('quiz_semana')
  inv.cursos = await n('cursos', q => q.eq('estado', 'publicado'))
  /**
   * Los cursos publicados, con nombre y precio.
   *
   * ⚠️ NO BASTA EL CONTEADOR. Un cliente que compró el add-on de Cursos de
   * Ingreso los tiene publicados y a la venta el día de la entrega, y el
   * documento decía «módulo vacío, crea tu primer curso»: el papel contradecía
   * lo que el cliente acababa de pagar y lo que su propia página ya mostraba.
   *
   * `precio_inscripcion`, `duracion_meses` y compañía las añade la migración B1:
   * si esas columnas no existen en este clon, se lee solo el nombre y el tipo,
   * y la revisión de abajo lo detiene (el documento los pintaría sin precio).
   */
  // leerCursosPublicados distingue «no se pudo leer» (null) de «no hay cursos»
  // ([]): antes un error de lectura salía como 0 cursos.
  inv.cursosLectura = await leerCursosPublicados(sb)
  const { data: al } = await sb.from('alumnos').select('matricula')
    .not('matricula', 'is', null).order('created_at').limit(1)
  inv.matricula = al?.[0]?.matricula ?? null
  // La matrícula que se imprime es la DEL ALUMNO DE PRUEBA, no la del primer
  // alumno de la base. En CAU (#200) el primero dado de alta era el de
  // preparatoria, y el documento le ponía su matrícula al de secundaria.
  inv.alumnos = {}
  for (const a of ALUMNOS_PRUEBA) {
    const { data: u } = await sb.from('usuarios').select('id').eq('email', a.email).maybeSingle()
    if (!u) { log(`  ⚠ ${a.email} no está en usuarios: sale sin matrícula`); continue }
    const { data: fila } = await sb.from('alumnos').select('matricula, nivel').eq('id', u.id).maybeSingle()
    inv.alumnos[a.email] = { matricula: fila?.matricula ?? null, nivel: fila?.nivel ?? null }
  }
  return inv
}
log('· Leyendo inventario de contenido…')
const INV = await inventario()

/** El menú de cursos del panel: en solo_cursos se llama «Diplomados». */
const MENU_CURSOS = CONFIG.modo === 'solo_cursos' ? 'Diplomados' : 'Gestionar Cursos'

/**
 * Los cursos vendidos no se niegan en silencio, y el documento no contradice al
 * registro: revisarCursos (cursos-entrega.mjs) aborta si una escuela que vende
 * cursos (add-on de cursos de ingreso, o solo_cursos) no los pudo leer, si el
 * add-on está encendido y no hay cursos publicados, o si el registro vende una
 * oferta de un curso que este documento pintaría distinta (ficha en 0/0 con
 * precio en config.ts, curso sin publicar). En las demás escuelas, una lectura
 * fallida se avisa en «REVISA ANTES DE ENVIAR».
 */
{
  const r = revisarCursos({ lectura: INV.cursosLectura ?? null, ing: CONFIG.cursosIngreso, mxn, menu: MENU_CURSOS, modo: CONFIG.modo })
  for (const a of r.avisos) avisar(a)
  if (r.abortar) abortar(r.abortar.msg, r.abortar.ayuda)
}

/**
 * Los cursos que el cliente YA TIENE publicados y a la venta el día de la
 * entrega. Vacío en un combo normal; con contenido cuando compró el add-on de
 * Cursos de Ingreso, y entonces el documento y el mensaje los nombran con su
 * precio en vez de invitarle a crear su primer curso.
 */
const CURSOS_PUBLICADOS = cursosParaDocumento(INV.cursosLectura)
/** ¿El registro tiene el camino «pide un curso de preparación y se le asigna»? */
const VENDE_INGRESO = registroPideIngreso(CONFIG.cursosIngreso, CONFIG.modo)
const precioDeCurso = (c) => precioDeCursoCon(c, mxn)

/* ── 4. Modalidades y precios, adaptados a lo CONTRATADO ─────────────────── */
/**
 * Un cliente puede vender un CURSO, un DIPLOMADO o una LICENCIATURA por los
 * mismos rieles internos. Llamarlos a todos "licenciatura" en el documento de
 * entrega es decirle al cliente algo que no vendió — y "cuatrimestres" donde
 * su temario habla de módulos. Se infiere del nombre y se puede fijar a mano
 * con `tipo` en la carrera si algún día hace falta.
 */
const tipoDePrograma = (c) => {
  if (c.tipo) return c.tipo
  const n = String(c.nombre || '').toLowerCase()
  if (n.startsWith('curso')) return 'curso'
  if (n.startsWith('diplomado')) return 'diplomado'
  return 'licenciatura'
}
// D20c: cada carrera con el nombre que el admin le puso en «Personalizar mi
// página» (la tarjeta de la landing), con la MISMA regla que la landing. El
// `tipo` se decide ANTES, con el nombre de config.ts: un nombre publicado no
// convierte una licenciatura en curso.
const CARRERAS = conNombresPublicados(
  (LIC?.activas ? (LIC.carreras || []) : [])
    .map(c => ({ ...c, tipo: tipoDePrograma(c), inv: INV.porCarrera?.[c.slug] ?? null })),
  CONFIG.landing?.licenciaturas_carreras,
  (s) => interpolar(s, { nombre: CONFIG.nombre, nombreCompleto: CONFIG.nombreCompleto }),
)
for (const c of CARRERAS.filter(x => x.nombreConfig))
  avisar(`Carreras: el documento usa el nombre publicado en el panel, «${c.nombre}» (config.ts: «${c.nombreConfig}»). El registro, el panel y las constancias siguen diciendo «${c.nombreConfig}».`)
for (const c of CARRERAS.filter(x => x.comodinSinResolver))
  avisar(`Carreras: el nombre publicado «${c.comodinSinResolver}» usa un comodín que el documento no resuelve; se usó el de config.ts «${c.nombre}».`)
const TIPOS = [...new Set(CARRERAS.map(c => c.tipo))]

/**
 * Lo hecho a medida se detecta mirando el repo, no declarándolo a mano: una
 * lista escrita a mano en el generador envejece a la primera entrega.
 */
const existe = (rel) => { try { return fs.existsSync(path.join(RAIZ, rel)) } catch { return false } }
const RUTAS_TITULACION = (LIC?.rutas || []).filter(r => r.activa !== false)
const FORMULARIO_DIAGNOSTICO = existe('src/app/(dashboard)/admin/prospectos/page.tsx')
  || existe('src/app/api/admin/prospectos/route.ts')
/**
 * Página institucional con demostración embebida, si el cliente la tiene.
 *
 * No se busca por nombre —cada cliente llama a la suya como quiere— sino por lo
 * que la hace distinta: una página pública que embebe algo servido desde
 * `public/demo`. Se devuelve su ruta para poder enlazarla.
 */
const PAGINA_INSTITUCIONAL = (() => {
  if (!existe('public/demo')) return null
  const base = path.join(RAIZ, 'src/app')
  const buscar = (dir, rel = '') => {
    let hallado = null
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (hallado) break
      const abs = path.join(dir, e.name)
      if (e.isDirectory()) {
        // Los grupos de rutas de Next, `(auth)` y compañía, no van en la URL.
        const salto = /^\(.*\)$/.test(e.name)
        hallado = buscar(abs, salto ? rel : `${rel}/${e.name}`)
      } else if (e.name === 'page.tsx') {
        try {
          if (/["'`]\/demo\//.test(fs.readFileSync(abs, 'utf8'))) hallado = rel || '/'
        } catch { /* ilegible */ }
      }
    }
    return hallado
  }
  try { return buscar(base) } catch { return null }
})()
// Lo que el panel de Pagos e Informes hace de verdad, leído del código: el
// mensaje decía «generar el recibo» sin decir que se le manda al alumno, y
// «reportes» donde el menú dice «Informes» y hay un Excel para descargar.
const RECIBO_POR_CORREO = (() => {
  try { return fs.readFileSync(path.join(RAIZ, 'src/app/(dashboard)/admin/pagos/page.tsx'), 'utf8').includes("'correo'") }
  catch { return false }
})()
const INFORMES_EXCEL = existe('src/app/api/admin/reportes/excel/route.ts')
// Verificación pública de constancias por folio (PR #130).
const VALIDAR_CONSTANCIAS = existe('src/app/validar/page.tsx')

const PAGINAS_LEGALES = [
  ['src/app/terminos/page.tsx', 'Términos y Condiciones'],
  ['src/app/privacidad/page.tsx', 'Aviso de Privacidad'],
  ['src/app/carta-responsiva/page.tsx', 'Carta Responsiva'],
].filter(([f]) => existe(f)).map(([, n]) => n)

/** Título de la sección y palabra para el bloque, según lo que el cliente vende. */
// El documento enlaza a la sección de los programas en la página pública. El id
// se LEE de la landing en vez de darlo por hecho: estaba escrito '#programas' y
// el id real es 'diplomados', asi que el enlace del PDF no llevaba a ninguna
// parte. Si no se encuentra ninguno, no se promete el enlace.
// El texto de TODA la landing, no solo `LandingClient.tsx`: una landing propia
// pinta sus secciones desde sus propios componentes (UVEP #209 tiene
// `id="licenciaturas"` en `landing/uvep/Licenciaturas.tsx`), y buscar en un solo
// archivo dejaba el PDF y el mensaje sin el enlace a la sección.
const TEXTO_LANDING = (() => {
  const leer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).map(e => {
    const abs = path.join(dir, e.name)
    if (e.isDirectory()) return leer(abs)
    return /\.(tsx?|jsx?)$/.test(e.name) ? fs.readFileSync(abs, 'utf8') : ''
  }).join('\n')
  try { return leer(path.join(RAIZ, 'src/components/landing')) } catch { return '' }
})()

const anclaProgramas = (() => {
  if (!CARRERAS.length) return null
  try {
    const landing = TEXTO_LANDING
    // Solo la sección de los programas. `diplomados` NO sirve: es el catálogo
    // de cursos propios del cliente y se renderiza únicamente si publicó
    // alguno, así que enlazar ahí manda al vacío.
    for (const id of ['programas', 'carreras', 'licenciaturas']) {
      if (landing.includes(`id="${id}"`)) return id
    }
  } catch { /* sin landing legible, se omite el enlace */ }
  return null
})()

// El rótulo nombra lo que el cliente vende de verdad. «Cursos y diplomados»
// para cuatro licenciaturas y dos diplomados no describe ninguna de las dos
// cosas, y es el título de la página que el cliente va a enseñar.
const NOMBRE_TIPO = { curso: 'Cursos de preparación', diplomado: 'Diplomados', licenciatura: 'Licenciaturas' }
const ETIQUETA_PROGRAMAS = TIPOS.length === 0 ? 'Programas'
  : ['licenciatura', 'diplomado', 'curso']
      .filter(t => TIPOS.includes(t))
      .map(t => NOMBRE_TIPO[t])
      .join(' y ')
// 🛑 «Cuatrimestre» no se le dice al cliente ni al alumno: es palabra prohibida
// en todo material de entrega. La llave `cuatrimestres` del banco la consume el
// seeder y ninguna pantalla la enseña, así que el documento tampoco la nombra
// (se decía «8 módulos», que el cliente no encuentra en su panel).

// Titulación con precio propio: cada plan con su costo completo. `[]` si no aplica.
const DESGLOSES_LIC = LIC?.activas ? desglosesLicenciatura(LIC, CARRERAS) : []
// #194: un plan sin mensualidad no sale en el documento ni en la página, pero el
// registro lo sigue ofreciendo. El cliente tiene que saberlo antes de entregar.
// Solo se sugiere el panel si ESE plan se puede publicar ahí (la misma regla que
// el panel: bloque editable y plan con forma estándar); si no, es de soporte.
if (LIC?.activas) {
  for (const m of planesLicSinMensualidad(LIC)) {
    const deConfig = (CONFIG_TS.licenciaturas?.modalidades || []).find((x) => x && x.id === m.id)
    const enPanel = PUEDE_PUBLICAR_LIC && planLicEditable(deConfig)
    avisar(`Licenciaturas: el plan «${m.label || m.id}» no tiene mensualidad. El documento y la página no lo muestran, pero el registro aún lo ofrece. ${enPanel
      ? 'Si se vende, ponle precio en «Personalizar mi página»; si no, apágalo en config.ts (activa: false).'
      : 'Su precio no se edita desde el panel: revísalo con soporte en config.ts.'}`)
  }
}

const nivelesPrograma = CONFIG.niveles.filter(n => n !== 'licenciatura')
const modalidadesActivas = (CONFIG.modalidades || []).filter(m => m && typeof m === 'object' && m.activa)
if (!modalidadesActivas.length && CONFIG.modo !== 'solo_cursos')
  abortar('CONFIG.modalidades no tiene ninguna modalidad activa.',
    'Revisa que sea un array de OBJETOS completos ({id,label,meses,mensualidad,materiasPorMes,activa}),\nno un array de cadenas.')

/*
 * 🛑 UN SOLO RESOLVER DE PRECIOS: el de la plataforma. Aquí vivían `porNivel`,
 * `insc`, `cert` y `mens` propios, sin pruebas, que leían cosas que la app no
 * lee: la forma de objeto de `inscripcion`, la grafía `inscripcion_<nivel>`, el
 * alias `<nivel>_<n>meses_normal` de CUALQUIER nivel (preparatoria incluida) y
 * hasta un 0. El papel podía anunciar una cifra que la plataforma no cobra.
 * (SÉNDERI, que motivó la lectura por nivel, usa `inscripcionSecundaria` e
 * `inscripcionPreparatoria`: son justo las claves del resolver.)
 */
const problemaPrecios = nivelesPrograma.length ? problemaDePrecios(CONFIG.precios, esSemanal(CONFIG) ? [] : modalidadesActivas) : null
if (problemaPrecios) abortar(problemaPrecios)
const insc = (nivel) => inscripcionDe(nivel, CONFIG.precios)
// 🛑 Una escuela que NO certifica (`ofreceCertificacion: false`) no anuncia
// certificación: ni fila, ni «(con certificación)», ni línea en el WhatsApp
// (#165). Sus precios de certificación siguen en el config a propósito.
const CERTIFICA = ofreceCertificacion(CONFIG)
const cert = certificacionEntrega(CONFIG, certificacionDe)
// La sección de validez habla del CERTIFICADO («un certificado, dos países»,
// folio SIGED de la SEP): en una escuela que no certifica no va, diga lo que
// diga entrega.local.json. En las demás, igual que siempre (`!== false`).
const VALIDEZ = D.validez !== false && CERTIFICA
const mens = (nivel, m) => mensualidadDe(nivel, m, CONFIG.precios)
const PRECIOS = { insc, mens, cert }
// Un nivel del programa sin NINGÚN plan mensual no se puede contar: la tabla
// saldría vacía. (La semanal ya se detiene más abajo si no hay planes semanales.)
const SIN_PLANES = esSemanal(CONFIG) || !modalidadesActivas.length ? [] : nivelesSinPlanes(CONFIG, nivelesPrograma)
if (SIN_PLANES.length)
  abortar(`${SIN_PLANES.map(cap).join(' y ')} no ${SIN_PLANES.length > 1 ? 'venden' : 'vende'} ningún plan: ninguna modalidad activa aplica a ${SIN_PLANES.length > 1 ? 'esos niveles' : 'ese nivel'}.`,
    'Una modalidad sin `nivel` aplica a todos los niveles; con `nivel`, solo a ese (secundaria, preparatoria o licenciatura).\n' +
    "Un valor que no es un nivel del programa (p. ej. nivel: 'media') deja al nivel sin planes.")


/* ── Cobro SEMANAL ───────────────────────────────────────────────────────────
 * Todo lo de arriba es mensual y cruza niveles × modalidades. En una escuela que
 * cobra por semana eso imprimía «$250/mes», totales de meses × cuota y planes que
 * el nivel no vende (EDUHCO #197, CAU #200). Sus tablas y frases salen de
 * `planes.mjs`, que las prueba; la rama mensual no cambia ni un carácter.
 */
const SEMANAL = esSemanal(CONFIG)
const PLANES_SEMANALES = SEMANAL ? planesSemanales(CONFIG, nivelesPrograma, { insc, cert }) : []
if (SEMANAL && !PLANES_SEMANALES.length)
  abortar('CONFIG.periodicidad es "semanal", pero ninguna modalidad activa trae semanas y cuotaSemanal.',
    'Cada plan semanal necesita { semanas, cuotaSemanal } en CONFIG.modalidades.')
const FRASES_SEMANALES = SEMANAL ? frasesSemanales(PLANES_SEMANALES, nivelesPrograma) : null
// Lo que la página anuncia sin venderlo en línea (planes por WhatsApp, catálogo
// informativo). Solo existe en los clones que lo declaran en CONFIG.ofertaPublica.
const OFERTA_INFORMATIVA = ofertaInformativa(CONFIG)
const anclaEnLanding = (id) => TEXTO_LANDING.includes(`id="${id}"`)

// Tabla de precios. La mensual sale de planes.mjs (pura y probada): cada nivel
// con SUS planes; en la oferta simétrica, fila por fila la de siempre.
const FRASES_MENSUALES = SEMANAL ? null : frasesMensuales(CONFIG, nivelesPrograma, PRECIOS)
const tablaMensual = SEMANAL ? null : tablaPreciosMensual(CONFIG, nivelesPrograma, PRECIOS)
const preciosCols = SEMANAL ? [] : [...tablaMensual.cols]
const preciosFilas = SEMANAL ? [] : [...tablaMensual.filas]

// En una escuela semanal, la tabla de arriba se sustituye entera por la de sus
// planes reales: con un plan por nivel, una columna por nivel; con varios, una
// fila por plan.
if (SEMANAL) {
  const t = tablaPrecios(PLANES_SEMANALES, nivelesPrograma)
  preciosCols.splice(0, preciosCols.length, ...t.cols)
  preciosFilas.splice(0, preciosFilas.length, ...t.filas)
}

// Tabla de modalidades contratadas: una fila por plan que el nivel VENDE.
const modalidadesCols = ['Modalidad', 'Duración', 'Mensualidad', 'Ritmo de apertura']
const modalidadesFilas = SEMANAL ? [] : filasModalidadesMensual(CONFIG, nivelesPrograma, { mens, ritmo: ritmoDeApertura })
// Escuela semanal: una fila por plan REAL, con su cuota a la semana.
if (SEMANAL) {
  modalidadesCols.splice(0, modalidadesCols.length, ...colsModalidades)
  modalidadesFilas.splice(0, modalidadesFilas.length, ...filasModalidades(PLANES_SEMANALES))
}
// Los programas de pago único: se nombran por lo que son. Decir "Licenciatura"
// a un curso de preparación es anunciarle al cliente algo que no vendió.
//
// 🐞 Cada plan se nombra por SU RUTA cuando el programa tiene varias, y los que
// no llevan mensualidad en esta tabla se omiten: el plan de los diplomados
// aparecía como «$0/mes» porque su precio no vive aquí, y una fila que anuncia
// un plan gratis en el documento de entrega es una promesa que nadie quiso
// hacer.
if (CARRERAS.length) {
  const rutasLic = (LIC.rutas || []).filter(r => r.activa !== false)
  const deRuta = new Map()
  for (const r of rutasLic)
    for (const m of (r.modalidades || [])) deRuta.set(m.id, r)

  for (const m of (LIC.modalidades || []).filter(planLicVendible)) {
    const r = deRuta.get(m.id)
    const nombre = r && rutasLic.length > 1
      ? `${r.nombre} — ${m.label || m.id}`
      : CARRERAS.length === 1 ? `${CARRERAS[0].nombre} — ${m.label || m.id}`
                              : `${ETIQUETA_PROGRAMAS} — ${m.label || m.id}`
    modalidadesFilas.push([nombre, `${m.meses} meses`, `${mxn(m.mensualidad)}/mes`,
      ritmoDeApertura(m.materiasPorMes)])
  }

  // Los diplomados llevan su plan y su precio en su propio bloque del config.
  const modsDip = (LIC.modalidadesDiplomado || []).filter(x => x.activa !== false)
  for (const c of CARRERAS.filter(x => x.tipo === 'diplomado' && x.precio)) {
    const m = modsDip[0]
    if (!m) continue
    modalidadesFilas.push([`${c.nombre} — ${m.label || m.id}`, `${m.meses} meses`,
      `${mxn(c.precio.mensual)}/mes`,
      ritmoDeApertura(m.materiasPorMes)])
  }
}
// El módulo para que el cliente cargue SUS propios cursos, distinto de los
// programas ya entregados: se etiqueta para que no se confundan.
//
// 🛑 «módulo vacío» solo si LO ESTÁ. Con el add-on de Cursos de Ingreso el
// cliente entrega con cursos publicados y a la venta, y ponerle «vacío» en la
// tabla resumen le niega por escrito lo que acaba de comprar.
//
// Y con la regla del precio de CADA curso: uno de pago único no tiene
// mensualidad y se abre completo al asignarlo (C3b), no «por módulos».
modalidadesFilas.push(filaResumenCursos(CURSOS_PUBLICADOS))

/* ── Infraestructura (dominio, registrador, proyecto de Supabase) ──────── */
// Solo direcciones e identificadores públicos: de .env.local se toma únicamente
// NEXT_PUBLIC_SUPABASE_URL (si el repo no lo tiene, vale `supabaseUrl` en
// entrega.local.json). La service_role y la contraseña de BD nunca llegan al
// documento. Registrador: entrega.local.json → `registrador` (default GoDaddy,
// donde MEV registra todos los dominios). `"infraestructura": false` omite la página,
// salvo que haya `cuentas`: esas se entregan siempre (CUENTAS_CLIENTE, arriba).
function urlSupabaseDesdeEnv() {
  const env = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(env)) return ''
  const m = fs.readFileSync(env, 'utf8').match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\n]+)["']?\s*$/m)
  return m ? m[1].trim() : ''
}
const supabaseUrl = String(D.supabaseUrl || urlSupabaseDesdeEnv()).trim().replace(/\/$/, '')
const supabaseRef = (supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.(?:co|in)$/i) || [])[1] || null
if (D.infraestructura !== false && !supabaseRef)
  log('  ⚠ sin NEXT_PUBLIC_SUPABASE_URL — la página de Infraestructura sale sin el proyecto de Supabase (añade "supabaseUrl" a entrega.local.json)')
const infra = D.infraestructura === false ? null : {
  dominio,
  registrador: REGISTRADOR,
  dns: D.dns || 'Apunta a Vercel, donde se aloja la plataforma',
  url: URL_BASE,
  supabaseRef,
  supabaseUrl: supabaseRef ? supabaseUrl : null,
  supabaseDashboard: supabaseRef ? `https://supabase.com/dashboard/project/${supabaseRef}` : null,
}

/* ── 5. Datos del documento ──────────────────────────────────────────────── */
const b64 = (rel) => {
  if (typeof rel !== 'string' || !rel || /^https?:\/\//i.test(rel)) return null
  const p = path.join(RAIZ, 'public', rel.replace(/^\//, ''))
  if (!fs.existsSync(p)) return null
  const buf = fs.readFileSync(p)
  if (buf.length < 200) return null   // placeholder 1x1
  return `data:image/png;base64,${buf.toString('base64')}`
}
/**
 * Una imagen para incrustar en el documento. D12: el logo publicado en el panel
 * es una URL (el bucket `branding`): se descarga. Lo del repo, de public/ como
 * siempre. null si no se pudo (y quien llama cae al de config.ts y avisa).
 */
async function imagenData(ref) {
  if (typeof ref !== 'string' || !ref) return null
  if (!/^https?:\/\//i.test(ref)) return b64(ref)
  try {
    const res = await fetch(ref, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 200) return null
    const tipo = (res.headers.get('content-type') || 'image/png').split(';')[0].trim()
    return /^image\//.test(tipo) ? `data:${tipo};base64,${buf.toString('base64')}` : null
  } catch {
    return null
  }
}
/**
 * El logo del banner (fondo oscuro), como la página: el que la fusión deja para
 * fondo oscuro (`resolverLogos`: solo el claro publicado vale para los dos).
 *  - Sin nada publicado: el de siempre, de public/ (el oscuro o, si falta, el claro).
 *  - Publicado: se descarga; si no baja, el de config.ts y un aviso en REVISA
 *    (nunca otro logo en silencio, ni el claro sobre el fondo oscuro).
 * `logoListo: false` en config.ts apaga solo el logo del REPO: uno publicado se usa.
 */
async function logoDelDocumento() {
  const ref = CONFIG.logoOscuro || CONFIG.logo
  const refRepo = CONFIG_TS.logoOscuro || CONFIG_TS.logo
  const publicado = typeof ref === 'string' && ref !== refRepo && /^https?:\/\//i.test(ref)
  if (!publicado) return CONFIG_TS.logoListo === false ? null : (b64(refRepo) || b64(CONFIG_TS.logo))
  const bajado = await imagenData(ref)
  if (bajado) return bajado
  const deRepo = CONFIG_TS.logoListo === false ? null : (b64(refRepo) || b64(CONFIG_TS.logo))
  avisar(`El logo publicado en el panel no se pudo descargar (${ref}): el documento lleva ${deRepo ? 'el de config.ts' : 'ningún logo'}. Revisa que el archivo exista y vuelve a generar.`)
  return deRepo
}
const LOGO_DATA = await logoDelDocumento()
const [tag1, tag2] = String(CONFIG.tagline || '').split(' / ')
const taglineCierre = CONFIG.taglineSecundario || tag2 || tag1 || CONFIG.tagline


const contenido = []
for (const n of nivelesPrograma)
  if (INV[`materias_${n}`]) contenido.push([`Materias de ${cap(n)}`, INV[`materias_${n}`]])
if (INV.materias_demo) contenido.push(['Materia tutorial (demostración)', INV.materias_demo])
// Los totales de la base incluyen TODO, programas de pago único incluidos. Si
// además se desglosa cada programa abajo, el cliente lee 746 preguntas y luego
// 360 + 360 y parece que se suman. Se resta lo que ya se detalla aparte.
const sumaCarreras = (k) => CARRERAS.reduce((a, c) => a + (c.inv?.[k] || 0), 0)
const soloPrograma = (total, k) => Math.max(0, (total || 0) - sumaCarreras(k))
if (INV.semanas) contenido.push(['Semanas de contenido', soloPrograma(INV.semanas, 'semanas')])
if (INV.evaluaciones) contenido.push(['Evaluaciones del programa', soloPrograma(INV.evaluaciones, 'evaluaciones')])
if (INV.preguntas) contenido.push(['Preguntas de examen', soloPrograma(INV.preguntas, 'preguntas')])
if (INV.quiz) contenido.push(['Preguntas de quiz semanal', soloPrograma(INV.quiz, 'quiz')])
// Cada programa aparte, con su conteo real: es lo que el cliente compró y lo
// que quiere ver confirmado en el documento.
for (const c of CARRERAS) {
  if (!c.inv?.materias) continue
  contenido.push([`${c.nombre} — materias`, c.inv.materias])
  if (c.inv.preguntas || c.inv.quiz)
    contenido.push([`${c.nombre} — reactivos`, (c.inv.preguntas || 0) + (c.inv.quiz || 0)])
}

const listaNiveles = nivelesPrograma.map(cap).join(' y ')

const datos = {
  nombre: CONFIG.nombre,
  nombreCompleto: CONFIG.nombreCompleto || CONFIG.nombre,
  // Evita "Horizontes — Horizontes Instituto Digital" en el encabezado cuando
  // el nombre corto ya está contenido en el completo.
  marcaEncabezado: (() => {
    const corto = CONFIG.nombre, largo = CONFIG.nombreCompleto || CONFIG.nombre
    return largo.toLowerCase().includes(corto.toLowerCase())
      ? `<b>${largo}</b>` : `<b>${corto}</b> — ${largo}`
  })(),
  tagline: tag1 || CONFIG.tagline,
  taglineCierre,
  colores: CONFIG.colores,
  url: URL_BASE,
  adminNombre: D.adminNombre, adminGenero: D.adminGenero || 'o',
  adminEmail: D.adminEmail, adminPassword: D.adminPassword,
  alumnoEmail: D.alumnoEmail, alumnoPassword: D.alumnoPassword,
  matricula: D.alumnoEmail && INV.alumnos ? (INV.alumnos[D.alumnoEmail]?.matricula ?? null) : INV.matricula,
  alumnosPrueba: ALUMNOS_PRUEBA.length > 1
    ? ALUMNOS_PRUEBA.map(a => ({ ...a, ...(INV.alumnos?.[a.email] || {}) }))
    : null,
  // Sin WhatsApp real no se imprime ningún «WhatsApp de contacto»: ni el
  // marcador de ceros ni el número de la plantilla.
  whatsappDisplay: SIN_WHATSAPP ? '' : CONFIG.whatsappDisplay,
  // Una escuela puede entregar SIN WhatsApp a propósito (el intake no trajo
  // número, o trajo un placeholder que no existe). En ese caso la página se
  // entrega con los botones apagados y la única forma de encenderlos es que el
  // cliente capture el suyo en «Personalizar mi página»: el documento se lo
  // dice, porque si no se queda sin su canal principal sin saber por qué.
  sinWhatsApp: SIN_WHATSAPP,
  infra,
  cuentas: CUENTAS_CLIENTE,
  registrador: REGISTRADOR,
  logoData: LOGO_DATA,
  isotipoData: CONFIG.isotipo ? b64(CONFIG.isotipo) : null,
  // Usa la palabra que el cliente eligió para su institución —academia,
  // instituto, centro— en lugar de "instituto" en duro, y nombra también los
  // programas de pago único: son parte de lo que se le está entregando.
  frasePrograma: `tu ${D.palabraInstitucion || 'instituto'} en línea — ${listaNiveles}${
    CARRERAS.length ? `, ${unirConY(CARRERAS.map(c => c.nombre))}` : ''}`,
  fraseIntro: `Una sola plataforma que atiende tus ${nivelesPrograma.length === 1 ? 'alumnos' : `${nivelesPrograma.length} niveles`}: ${listaNiveles}${
    CARRERAS.length ? `, más ${nombrarProgramas(CARRERAS)}` : ''
  }. El alumno se registra, elige ${CARRERAS.length ? 'qué quiere estudiar' : 'su nivel'} y avanza mes a mes; tú lo administras todo desde un único panel.`,
  frasePrecios: (SEMANAL ? FRASES_SEMANALES : FRASES_MENSUALES).frasePrecios,
  notaPrecios: (SEMANAL ? FRASES_SEMANALES : FRASES_MENSUALES).notaPrecios,
  contenido,
  preciosCols, preciosFilas, modalidadesCols, modalidadesFilas,
  notaModalidades: (SEMANAL ? FRASES_SEMANALES : FRASES_MENSUALES).notaModalidades,
  // Se enriquece con el conteo REAL de la base y con el tipo de cada programa,
  // para que el documento no repita el `totalMaterias` declarado en el config
  // sin comprobarlo, ni llame "licenciatura" a un curso de preparación.
  licenciaturas: LIC?.activas
    ? { ...LIC, carreras: CARRERAS }
    : LIC,
  anclaProgramas,
  etiquetaProgramas: ETIQUETA_PROGRAMAS,
  incluirCursos: true,
  cursosPublicados: CURSOS_PUBLICADOS.length,
  cursosLista: CURSOS_PUBLICADOS.map(c => ({ ...c, precio: precioDeCurso(c) })),
  menuCursos: MENU_CURSOS,
  vendeIngreso: VENDE_INGRESO,
  validez: VALIDEZ,
  folioVerificable: FOLIO_VERIFICABLE,
  soporte: D.soporte || SOPORTE,
  tutoriales: [
    `Playlist completa: ${TUTORIALES.playlist}`,
    `"Así se estudia en tu plataforma" — compártelo con tus alumnos nuevos: ${TUTORIALES.alumno}`,
  ],
  primerosPasos: [
    SEMANAL
      ? 'Entra al panel y recorre el menú con calma: Alumnos, Cobranza, Estado de Cuenta y Reportes'
      : 'Entra al panel y recorre el menú con calma: Alumnos, Estado de Cuenta y Reportes',
    ALUMNOS_PRUEBA.length > 1
      ? 'Inicia sesión con los alumnos de prueba para ver la plataforma desde su lado'
      : ALUMNOS_PRUEBA.length === 1 && 'Inicia sesión con el alumno de prueba para ver la plataforma desde su lado',
    'Da de alta a tu primer alumno real y registra su inscripción',
    'Comparte tu dirección y el video "Así se estudia" con cada nuevo estudiante',
  ].filter(Boolean),
  incluye: [
    `Programa académico de ${listaNiveles}`,
    (SEMANAL ? FRASES_SEMANALES : FRASES_MENSUALES).incluye,
    // Lo que el cliente ya tiene cargado va ANTES del módulo vacío: es lo que
    // acaba de comprar y lo primero que quiere ver confirmado.
    ...(CARRERAS.length ? [CARRERAS.length === 1
      ? `${CARRERAS[0].nombre}, con su contenido cargado`
      : `${CARRERAS.length} ${soloLicenciaturas(CARRERAS) ? 'licenciaturas ya cargadas' : 'programas ya cargados'}: ${unirConY(CARRERAS.map(c => c.nombre))}`] : []),
    CURSOS_PUBLICADOS.length
      ? `Módulo de Cursos y Diplomados con ${CURSOS_PUBLICADOS.length} ${CURSOS_PUBLICADOS.length === 1 ? 'curso ya publicado' : 'cursos ya publicados'} y a la venta`
      : 'Módulo de Cursos y Diplomados listo para tu propio contenido',
    VALIDEZ && 'Sección de Validez Oficial México + Estados Unidos',
    'Panel de pagos, reportes y estado de cuenta',
  ].filter(Boolean),
  palabraInstitucion: D.palabraInstitucion || 'instituto',
  fuentes: {
    tituloCSS: "'Playfair Display',serif",
    cuerpoCSS: "'Manrope',system-ui,sans-serif",
    link: '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">',
  },
  funcionalidad: [
    `Registro público de alumnos con matrícula automática (prefijo ${CONFIG.prefijoMatricula}-)`,
    'Desbloqueo progresivo del contenido, mes a mes, a tu ritmo de cobro',
    'Video, quiz semanal y examen final en cada materia',
    VALIDEZ && (FOLIO_VERIFICABLE
      ? 'Sección de Validez Oficial México + Estados Unidos, con folio verificable en el portal SIGED de la SEP'
      : 'Sección de Validez Oficial México + Estados Unidos, con los dos documentos oficiales que recibe el alumno'),
    'Módulo de pagos: recibo en PDF con tu marca y envío por WhatsApp',
    'Estado de cuenta por alumno',
    SEMANAL && 'Cobro semanal: calendario de pagos por alumno con la fecha de cada semana, «Mis Pagos» para el alumno y «Cobranza» para ti, con quién trae semanas vencidas',
    INFORMES_EXCEL ? 'Informes de ingresos por semana y por mes, con descarga a Excel' : 'Reportes de ingresos por semana y por mes, con descarga',
    'Gestión de documentos del alumno con validación del administrador',
    ...(CARRERAS.length ? [
      `${ETIQUETA_PROGRAMAS} ya ${soloLicenciaturas(CARRERAS) ? 'cargadas y listas' : 'cargados y listos'} para inscribir: ${unirConY(CARRERAS.map(c => c.nombre))}`,
    ] : []),
    CURSOS_PUBLICADOS.length
      ? `Módulo de Cursos y Diplomados con ${CURSOS_PUBLICADOS.length} ${CURSOS_PUBLICADOS.length === 1 ? 'curso publicado' : 'cursos publicados'}: al asignar a un alumno, un curso de pago único se le abre completo; a quien se registró desde tu página eligiendo el curso, con «Activar según la ficha»; y «Cobrar» registra cada pago y, con su casilla marcada, le abre lo que pagó, también desde una cuenta de secretario`
      : 'Módulo de Cursos y Diplomados, listo para cargar tu propio contenido',
    'Rol de secretario con accesos delimitados: registra pagos, abre meses del programa y de los cursos y emite constancias; precios, borrado de pagos, «Personalizar mi página» y alta de usuarios quedan solo en tu cuenta',

    // ── Lo que se construyó a medida para este cliente ────────────────
    // El documento listaba solo lo que trae la plantilla, así que todo lo
    // hecho a medida —que suele ser lo que el cliente pidió y por lo que
    // pagó— no aparecía por ninguna parte. Estas entradas se encienden solas
    // según lo que el config declare.
    ...(CONFIG.comunidad?.activa ? [
      `${CONFIG.comunidad.etiqueta || 'Comunidad'}: ${CONFIG.comunidad.descripcion || ''} Se valida con matrícula y correo desde el propio registro`.trim(),
    ] : []),
    ...(FORMULARIO_DIAGNOSTICO ? [
      'Formulario de diagnóstico en la página pública: los prospectos entran a tu panel con su programa y su modalidad de interés',
    ] : []),
    ...(RUTAS_TITULACION.length > 1 ? [
      `Dos rutas de titulación distintas (${RUTAS_TITULACION.map(r => r.nombre).join(' y ')}), con su propio plan, su propio precio y su propio aviso legal`,
    ] : []),
    ...(PAGINAS_LEGALES.length ? [
      `Páginas legales publicadas: ${PAGINAS_LEGALES.join(', ')}`,
    ] : []),
    ...(OFERTA_INFORMATIVA?.personalizados.length ? [
      `Planes con atención personalizada anunciados en tu página, con botón directo a tu WhatsApp: ${OFERTA_INFORMATIVA.personalizados.join(' · ')}`,
    ] : []),
    ...(OFERTA_INFORMATIVA?.programas ? [
      `Catálogo informativo de ${OFERTA_INFORMATIVA.programas} licenciaturas en ${OFERTA_INFORMATIVA.areas} áreas, sin registro en línea`,
    ] : []),
    ...(PAGINA_INSTITUCIONAL ? [
      'Página institucional con el manifiesto de la marca y una demostración interactiva de un curso real, abierta sin registro',
    ] : []),
  ].filter(Boolean),
}

/* ── 6. PDF ──────────────────────────────────────────────────────────────── */
const SALIDA = path.join(RAIZ, 'entrega')
fs.mkdirSync(SALIDA, { recursive: true })
// Sin tildes antes de filtrar: «CENTRO ACADÉMICO UNIÓN» salía como
// CENTRO_ACAD_MICO_UNI_N_Entrega_Oficial.pdf, el nombre que el cliente ve adjunto.
const slug = (CONFIG.nombre || 'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
const htmlPath = path.join(SALIDA, '.entrega.html')
const pdfPath = path.join(SALIDA, `${slug}_Entrega_Oficial.pdf`)

fs.writeFileSync(htmlPath, construirHTML(datos), 'utf8')
log('· Imprimiendo el PDF…')
const { chromium } = await import('@playwright/test')
const nav = await chromium.launch()
const pag = await nav.newPage()
await pag.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
await pag.evaluate(() => document.fonts.ready)
await pag.waitForTimeout(2000)
// Paginado de verdad: lo que no cabe en sus once pulgadas pasa a una página
// nueva (ver `paginar.mjs`, y por qué se pasa la función sin envolverla).
const reparto = await pag.evaluate(repartirPaginas)
log(`· Paginado: ${reparto.paginas} páginas${reparto.movidos ? `, ${reparto.movidos} bloque(s) pasados a página nueva` : ''}`)
if (reparto.rebeldes.length) {
  log('🛑 SIGUE SIN CABER, y el PDF lo recorta:')
  for (const x of reparto.rebeldes) log(`   Pág. ${x.pagina} «${x.titulo}» — sobran ${x.sobra} px`)
  log('   Es un bloque que no entra ni en una página vacía: hay que acortarlo o partirlo a mano.')
}

await pag.pdf({ path: pdfPath, format: 'Letter', printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' } })
await nav.close()
fs.unlinkSync(htmlPath)
log(`✓ PDF   → entrega/${path.basename(pdfPath)}`)

/* ── 7. Mensaje de WhatsApp ──────────────────────────────────────────────── */
if (!flag('solo-pdf')) {
  const L = []
  L.push(`¡Hola ${D.adminNombre.split(' ')[0]}! 🎉 Tu plataforma de ${datos.nombreCompleto} ya está lista.`, '')
  L.push('🌐 TU PLATAFORMA', URL_BASE, '')
  L.push('👤 ACCESO ADMINISTRADOR', `Usuario: ${D.adminEmail}`, `Contraseña: ${D.adminPassword}`, `Panel: ${URL_BASE}/admin`, '')
  if (ALUMNOS_PRUEBA.length > 1) {
    L.push('🎓 ACCESO ALUMNOS DE PRUEBA', '(para que veas la plataforma tal como la ve un alumno de cada nivel)')
    for (const a of datos.alumnosPrueba)
      L.push(`${a.nivel ? cap(a.nivel) : 'Alumno'}: ${a.email} · Contraseña: ${a.password}`)
    L.push('')
  } else if (D.alumnoEmail) L.push('🎓 ACCESO ALUMNO DE PRUEBA',
    '(para que veas la plataforma tal como la ve un alumno)',
    `Usuario: ${D.alumnoEmail}`, `Contraseña: ${D.alumnoPassword}`, '')
  if (contenido.length) {
    L.push('📚 LO QUE YA ESTÁ CARGADO')
    for (const [c, n] of contenido) L.push(`• ${c}: ${n}`)
    L.push('')
  }
  L.push('💳 TUS PRECIOS, YA CONFIGURADOS')
  if (SEMANAL) {
    // Cada plan con su cuota a la semana: «$250/mes» aquí le cobraría al cliente
    // una cuarta parte de lo que vende.
    L.push(...lineasPreciosWhatsApp(PLANES_SEMANALES, nivelesPrograma))
  } else {
    // Cada nivel con SUS planes: en una oferta asimétrica no se inventan combinaciones.
    L.push(...lineasPreciosMensualWhatsApp(CONFIG, nivelesPrograma, PRECIOS))
  }

  // Los programas de pago único van con su propio bloque: son otro producto,
  // con otro precio y —normalmente— sin la inscripción del programa escolar.
  // Sin esto, el mensaje de entrega no mencionaba ni una vez lo que el cliente
  // acababa de comprar.
  if (CARRERAS.length) {
    // Los programas de pago único se listan por TIPO, no en un montón.
    //
    // 🐞 Antes salían los seis juntos bajo «Cursos y diplomados», con los
    // precios de todas las rutas en una sola línea plana. En un cliente con
    // licenciaturas y diplomados a la vez eso mezcla dos productos que legalmente
    // no son lo mismo: la licenciatura titula, el diplomado prepara para una
    // evaluación que hace un tercero. Y colaba planes de otro producto: el de
    // los diplomados aparecía como «6 meses: $0/mes», porque su mensualidad no
    // vive en `licenciaturas.modalidades`.
    const grupos = [
      ['licenciatura', 'LICENCIATURAS'],
      ['diplomado',    'DIPLOMADOS'],
      ['curso',        'CURSOS DE PREPARACIÓN'],
    ].map(([tipo, titulo]) => [titulo, CARRERAS.filter(c => c.tipo === tipo)])
      .filter(([, cs]) => cs.length)

    for (const [titulo, carreras] of grupos) {
    // «Precio:» con la regla de la página: sin «Gratis/mes» (#194).
    const modsLic = (LIC.modalidades || []).filter(planLicVendible)
    L.push(`🎓 ${grupos.length > 1 ? titulo : ETIQUETA_PROGRAMAS.toUpperCase()}`)
    for (const c of carreras) {
      const partes = []
      if (c.inv?.materias) partes.push(`${c.inv.materias} materias`)
      const reactivos = (c.inv?.preguntas || 0) + (c.inv?.quiz || 0)
      if (reactivos) partes.push(`${reactivos} reactivos`)
      L.push(`• ${c.nombre}${partes.length ? ` — ${partes.join(' · ')}` : ''}`)
    }
    // ── Los planes, cada uno con su ruta ─────────────────────────────
    // Un cliente puede vender el mismo programa por caminos que se titulan
    // distinto. Listar sus planes en una sola línea borra la diferencia, que
    // es justo lo que el cliente tiene que poder explicar a un prospecto.
    const RUTAS = (LIC.rutas || []).filter(r => r.activa !== false)
    const esDip = titulo === 'DIPLOMADOS'
    // El desglose con titulación es de las licenciaturas, no de los cursos de
    // preparación que comparten los mismos rieles.
    const desgloses = carreras.every(c => c.tipo === 'licenciatura') ? DESGLOSES_LIC : []

    if (esDip) {
      // El diplomado tiene su propio plan y su propio precio, y ninguno de los
      // dos vive en `licenciaturas.modalidades`.
      const modsDip = (LIC.modalidadesDiplomado || []).filter(m => m.activa !== false)
      for (const c of carreras) {
        if (!c.precio) continue
        const p = c.precio
        const linea = [`${c.nombre}: ${mxn(p.publico)}`]
        if (p.mensual && modsDip.length) linea.push(`${mxn(p.mensual)}/mes durante ${modsDip[0].meses} meses`)
        if (p.exhibiciones && p.montoExhibicion) linea.push(`o ${p.exhibiciones} pagos de ${mxn(p.montoExhibicion)}`)
        // `alumnoSenderi` es como lo llamó el primer cliente que tuvo tarifa
        // preferente; `alumnoActivo` es el nombre neutro. Se admiten los dos.
        const preferente = p.alumnoActivo ?? p.alumnoSenderi
        if (preferente) linea.push(`${mxn(preferente)} para quien ya cursa otro programa`)
        L.push(`Precio · ${linea.join(' · ')}`)
      }
      // El marco legal del diplomado: lo que se vende es la preparación.
      const aviso = LIC.avisoCostoDiplomado
      const dis = LIC.disclaimerDiplomado
      if (aviso) L.push(`⚠️ ${aviso}`)
      if (dis) L.push(`⚠️ ${dis}`)
    } else if (RUTAS.length > 1) {
      // Cada ruta lleva sus propias modalidades dentro, con su propio precio.
      for (const r of RUTAS) {
        const mods = (r.modalidades || []).filter(m => m.activa !== false)
        L.push(`Ruta ${r.nombre} — el documento lo otorga: ${r.titulaQuien || 'la institución'}`)
        if (mods.length)
          L.push(`   Planes: ${mods.map(m => `${m.label || m.id}: ${mxn(m.mensualidad)}/mes`).join(' · ')}`)
        if (r.certificacion) {
          L.push(`   Titulación: ${mxn(r.certificacion)}${
            r.aportaciones && r.montoAportacion
              ? ` en ${r.aportaciones} aportaciones de ${mxn(r.montoAportacion)}` : ''}`)
        }
        // 🛑 El aviso legal de una ruta que NO titula va en el mensaje de
        // entrega, no solo en la landing: el cliente tiene que poder explicarlo
        // igual que lo explica su página, y este es el papel al que va a volver.
        if (r.disclaimer) L.push(`   ⚠️ ${r.disclaimer}`)
      }
    } else if (desgloses.length) {
      // El costo completo, igual que la página y el registro del cliente:
      // «$2,200/mes» sin la titulación dejaba fuera más de la mitad de lo que
      // paga el alumno (INSPIRA #203, UVEP #209).
      for (const p of desgloses)
        L.push(`${p.label}: ${mxn(p.inscripcion)} de inscripción + ${p.meses} × ${mxn(p.mensualidad)} + ${mxn(p.titulacion)} de titulación = ${mxn(p.total)}`)
      L.push(`La titulación es ${porcentajeTitulacionTexto(desgloses)} del costo total.`)
    } else if (modsLic.length) {
      const precios = modsLic.map(m => `${m.label || m.id}: ${mxn(m.mensualidad)}/mes`).join(' · ')
      L.push(`Precio: ${precios}`)
    }

    const inscLic = LIC.inscripcion
    // Con el desglose, la inscripción ya va dentro de cada plan.
    if (!esDip && !desgloses.length) L.push(inscLic ? `Inscripción: ${mxn(inscLic)}` : 'Sin inscripción adicional.')
    L.push('Se inscriben desde tu misma página, eligiendo el programa al registrarse.', '')
    }
  }
  L.push('⚙️ LO QUE PUEDES HACER DESDE TU PANEL',
    '• Dar de alta alumnos y abrirles el contenido mes a mes',
    `• Registrar pagos, generar el recibo en PDF con tu logo y enviárselo al alumno por WhatsApp${RECIBO_POR_CORREO ? ' o por correo' : ''}`,
    ...(SEMANAL ? ['• Marcar cada semana pagada y ver en Cobranza quién trae semanas vencidas'] : []),
    '• Ver el estado de cuenta de cada alumno',
    INFORMES_EXCEL ? '• Consultar tus Informes de ingresos por semana y por mes, y descargarlos en Excel' : '• Consultar reportes de ingresos por semana y por mes',
    '• Revisar y validar los documentos que suben tus alumnos',
    // Con cursos: asignar, activar al que se registró solo, cobrar (con su
    // casilla) y quién más puede hacerlo. Una línea por cosa: en una sola, el
    // «Cobrar» se perdía entre paréntesis.
    ...(CURSOS_PUBLICADOS.length ? [
      `• Asignar alumnos a ${CURSOS_PUBLICADOS.length === 1 ? 'tu curso' : `tus ${CURSOS_PUBLICADOS.length} cursos`} en ${MENU_CURSOS} → el curso → Alumnos (en uno de pago único se les abre completo; en uno mensual o sin precio, el mes 1), seguir su avance y crear todos los que quieras`,
      `• Abrir el curso a quien ya se registró desde tu página eligiendo el curso, con «Activar según la ficha» en su fila${
        VENDE_INGRESO ? '; a quien pidió un curso de preparación para examen, con «Asignar» en Alumnos' : ''}`,
      '• Registrar cada pago del curso con «Cobrar» (en su fila o en la tarjeta «Cursos» de la ficha del alumno): con la casilla marcada, ese mismo cobro le abre lo que pagó',
      // En positivo y con la misma lista que el PDF: «todo esto» incluía crear cursos,
      // que el secretario no puede.
      `• Quien tenga el rol de secretario también asigna, activa y cobra los cursos, abre meses y emite constancias${CONFIG.modo === 'solo_cursos' ? '' : ' (en su menú, «Cursos»)'}; crear cursos, cambiar precios, cancelar, reactivar o quitar una inscripción y borrar pagos quedan solo en tu cuenta`,
    ] : ['• Crear tus propios Cursos y Diplomados cuando quieras']),
    ...(CARRERAS.length
      ? [`• Gestionar a los alumnos de ${CARRERAS.length === 1 ? 'tu programa' : 'tus programas'} igual que a los de ${listaNiveles}`]
      : []),
    // Lo hecho a medida también se opera desde el panel, y si no se nombra el
    // cliente no sabe que lo tiene.
    ...(FORMULARIO_DIAGNOSTICO
      ? ['• Ver los prospectos que dejan sus datos en tu página, con el programa que les interesa']
      : []),
    ...(CONFIG.comunidad?.activa
      ? [`• Marcar a quien concluye un programa como ${(CONFIG.comunidad.etiqueta || 'parte de tu comunidad').split(' · ')[0]}, para que su siguiente inscripción salga en $0`]
      : []), '')

  // ── Lo que ya está publicado de cara a sus prospectos ──────────────────
  // El mensaje hablaba del panel y de los precios, pero no de las páginas que
  // el visitante ve. Son parte de lo entregado y el cliente tiene que saber
  // que existen para poder enseñarlas.
  const publicas = [
    VALIDEZ && (FOLIO_VERIFICABLE
      ? `• Validez oficial México y Estados Unidos, con folio verificable en el portal SIGED de la SEP: ${URL_BASE}/#validez`
      : `• Validez oficial México y Estados Unidos, con los dos documentos oficiales que recibe el alumno: ${URL_BASE}/#validez`),
    PAGINA_INSTITUCIONAL && `• Manifiesto de tu marca, con una demostración de un curso real que se prueba sin registro: ${URL_BASE}${PAGINA_INSTITUCIONAL}`,
    FORMULARIO_DIAGNOSTICO && `• Formulario de diagnóstico para captar prospectos: ${URL_BASE}/#diagnostico`,
    OFERTA_INFORMATIVA?.personalizados.length && `• Planes con atención personalizada, que se contratan por WhatsApp: ${OFERTA_INFORMATIVA.personalizados.join(' · ')}${anclaEnLanding('planes') ? ` — ${URL_BASE}/#planes` : ''}`,
    OFERTA_INFORMATIVA?.programas && `• Catálogo informativo de ${OFERTA_INFORMATIVA.programas} licenciaturas, sin registro en línea${anclaEnLanding('licenciaturas') ? `: ${URL_BASE}/#licenciaturas` : ''}`,
    // Las secciones de la oferta, si la landing las tiene: el cliente las enseña
    // a sus prospectos y el mensaje solo nombraba la validez.
    !OFERTA_INFORMATIVA?.personalizados.length && anclaEnLanding('planes') && `• Tus niveles y planes, con sus precios: ${URL_BASE}/#planes`,
    CARRERAS.length && !OFERTA_INFORMATIVA?.programas && anclaProgramas && `• ${ETIQUETA_PROGRAMAS}${DESGLOSES_LIC.length ? ', con su costo completo y la titulación desglosada' : ''}: ${URL_BASE}/#${anclaProgramas}`,
    VALIDAR_CONSTANCIAS && `• Verificación de constancias: quien reciba una constancia de tu escuela confirma su folio en ${URL_BASE}/validar`,
    PAGINAS_LEGALES.length && `• ${PAGINAS_LEGALES.join(', ')}, redactados y publicados`,
    // 🛑 Los cursos que el cliente compró y que YA están a la venta se nombran
    // con su precio. Sin esto, el mensaje de entrega del add-on de Cursos de
    // Ingreso no mencionaba en ninguna línea lo que el cliente acababa de pagar.
    ...CURSOS_PUBLICADOS.map(c => `• ${c.nombre} — ${precioDeCurso(c)}: ${URL_BASE}/diplomados`),
  ].filter(Boolean)
  if (publicas.length) L.push('🌐 LO QUE YA VE TU PROSPECTO', ...publicas, '')
  // ── El módulo que el cliente opera solo ────────────────────────────────
  // ⚠️ El mensaje no lo mencionaba. Es lo único que el cliente puede cambiar
  // sin pedirnos nada, y en una escuela sin WhatsApp es además el camino para
  // encender sus propios botones: callarlo le cuesta su canal principal.
  L.push('🎨 TU PÁGINA LA CAMBIAS TÚ',
    `Desde «Personalizar mi página» en tu panel (${URL_BASE}/admin/configuracion) cambias tus textos, tu eslogan, tus colores y tu logo, y se publican en unos segundos. «Restaurar diseño original» devuelve todo a como se te entregó, así que puedes probar sin miedo.`, '')
  if (SIN_WHATSAPP) {
    L.push('⭐ LO PRIMERO QUE TE RECOMIENDO HACER',
      'Tu página se entregó *sin botones de WhatsApp* porque no tenemos tu número, y preferimos no publicar uno que no lleve a ningún lado.',
      'Entra a «Personalizar mi página», escribe tu WhatsApp y pulsa Publicar: los botones *aparecen solos* en tu portada, en tus planes y en el pie. Es el cambio de más impacto que puedes hacer hoy.', '')
  }
  L.push('📄 Te adjunto el Documento de Entrega Oficial con todo el detalle.',
    // Las contraseñas de las cuentas van SOLO en el PDF: el mensaje dice que están ahí.
    CUENTAS_CLIENTE
      ? `Guárdalo: ahí tienes tus accesos, también los de ${nombresDeCuentas(CUENTAS_CLIENTE, REGISTRADOR)}, y el resumen completo de tu plataforma.`
      : 'Guárdalo, ahí tienes tus accesos y el resumen completo de tu plataforma.', '')
  L.push('🎬 ACADEMIA MEV — TUS TUTORIALES', '',
    'Antes de empezar, dedica unos minutos a nuestros micro-tutoriales oficiales:',
    `▶️ ${TUTORIALES.playlist}`, '',
    'Y este compártelo con cada alumno nuevo — le explica cómo estudiar en la plataforma:',
    `▶️ ${TUTORIALES.alumno}`, '')
  L.push('Cualquier duda, quedo al pendiente 🙌')

  const txt = path.join(SALIDA, 'ENTREGA-WHATSAPP.txt')
  fs.writeFileSync(txt, L.join('\n'), 'utf8')
  log('✓ Mensaje → entrega/ENTREGA-WHATSAPP.txt')
  log('\n──────── copia desde aquí ────────\n')
  log(L.join('\n'))
  log('\n──────── hasta aquí ────────')
}
// Siempre, con el proyecto y la escuela leídos en la primera línea: aunque no
// haya nada más que revisar, el operador ve de dónde salió el documento (y la
// cuenta la incluye: también es algo que revisar).
log(`\n⚠ REVISA ANTES DE ENVIAR (${AVISOS.length + 1}):`)
log(`  · ${IDENTIDAD.revisa}`)
for (const a of AVISOS) log(`  · ${a}`)
log(`\n✓ Entrega lista para ${datos.nombreCompleto} · ${URL_BASE}`)
