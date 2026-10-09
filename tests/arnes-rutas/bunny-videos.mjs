/**
 * Bunny Stream con las rutas REALES (arnés de #187): GET /api/alumno/materia/[id]
 * y la lectura de lecciones de cursos (lib/cursos/alumno-data), contra el
 * Supabase falso en memoria.
 *
 *   BUNNY_LIBRARY_ID=… BUNNY_TOKEN_KEY=… BUNNY_VIDEO_ID=<guid real> \
 *     node tests/arnes-rutas/bunny-videos.mjs [salida.json]
 *
 * Casos:
 *   1. alumno con acceso y BUNNY_* → 200, el video de Bunny sale firmado (6 h) y
 *      el de YouTube de la misma semana sale intacto;
 *   2. sin BUNNY_* → 200, sale la canónica SIN token y el servidor registra un
 *      error claro que no contiene la llave;
 *   3. alumno sin acceso → 403 y la respuesta no trae ninguna URL de video;
 *   4. lección de curso → firmada con BUNNY_*, canónica sin ellas;
 *   5. /api/health/video: 401 sin token; con token firma un video del contenido
 *      y Bunny responde 200 firmada / 403 sin firmar; sin BUNNY_* → 503 config:false.
 *
 * Imprime un resumen sin tokens; las URLs firmadas solo van al archivo de salida
 * (si se pasa) para la prueba de reproducción en el navegador.
 */
import './hooks.mjs'
import { RAIZ } from './hooks.mjs'
import { crearEscenario } from './supabase-falso.mjs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { NextRequest } from 'next/server.js'

const LIB = process.env.BUNNY_LIBRARY_ID
const LLAVE = process.env.BUNNY_TOKEN_KEY
const VIDEO = process.env.BUNNY_VIDEO_ID
if (!LIB || !LLAVE || !VIDEO) {
  console.error('faltan BUNNY_LIBRARY_ID, BUNNY_TOKEN_KEY o BUNNY_VIDEO_ID')
  process.exit(2)
}
const CANONICA = `https://player.mediadelivery.net/embed/${LIB}/${VIDEO}`
const YOUTUBE = 'https://www.youtube.com/watch?v=Nyts_ereM4Y'

const ALUMNO = 'eeeeeeee-0000-4000-8000-00000000000e'
const SIN_MESES = 'dddddddd-0000-4000-8000-00000000000d'
const MATERIA = '11111111-0000-4000-8000-000000000001'
const CURSO = '77777777-0000-4000-8000-000000000007'

function bd() {
  const alumno = (id, meses) => ({ id, nivel: 'secundaria', modalidad: '3_meses', carrera: null, meses_desbloqueados: meses, activo: true })
  return {
    usuarios: [{ id: ALUMNO, rol: 'alumno', email: 'x@qa.mx' }, { id: SIN_MESES, rol: 'alumno', email: 'y@qa.mx' }],
    alumnos: [alumno(ALUMNO, 1), alumno(SIN_MESES, 0)],
    materias: [{
      id: MATERIA, nombre: 'Matemáticas I', descripcion: null, nivel: 'secundaria', icono: null, color: null,
      activa: true, orden: 1, meses_contenido: [{ numero_mes: 1, activa: true }],
    }],
    calificaciones: [],
    // El route pide meses_contenido con las semanas embebidas: el Supabase falso
    // devuelve la fila tal cual, así que el embed va dentro.
    meses_contenido: [{
      id: 'mes-1', materia_id: MATERIA, numero_mes: 1, titulo: 'Mes 1', descripcion: null, activa: true,
      semanas: [{
        id: 'sem-1', numero_semana: 1, titulo: 'Semana 1', descripcion: null, contenido: 'x',
        video_url: CANONICA, video_url_2: YOUTUBE, video_url_3: null,
        tiempo_estimado_minutos: 60, activa: true, semana_materiales: [],
      }],
    }],
    evaluaciones: [],
    intentos_evaluacion: [],
    curso_modulos: [{ id: 'mod-1', curso_id: CURSO, nombre: 'Módulo 1', orden: 0 }],
    curso_lecciones: [
      { id: 'lec-1', modulo_id: 'mod-1', titulo: 'Lección 1', video_url: CANONICA, contenido_texto: null, material_path: null, orden: 0 },
      { id: 'lec-2', modulo_id: 'mod-1', titulo: 'Lección 2', video_url: YOUTUBE, contenido_texto: null, material_path: null, orden: 1 },
    ],
    curso_progreso: [],
  }
}

const imp = (rel) => import(pathToFileURL(path.join(RAIZ, rel)).href)
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk-del-arnes'
const ruta = await imp('src/app/api/alumno/materia/[id]/route.ts')
const salud = await imp('src/app/api/health/video/route.ts')
const { createHash } = await import('node:crypto')
const TOKEN_SMOKE = createHash('sha256').update('mev-health-video:srk-del-arnes').digest('hex')
const datosCursos = await imp('src/lib/cursos/alumno-data.ts')

const errores = []
const errorOriginal = console.error
console.error = (...a) => { errores.push(a.map(String).join(' ')) }

async function materia(actor) {
  const esc = crearEscenario({ bd: bd(), auth: [{ id: ALUMNO, email: 'x@qa.mx' }, { id: SIN_MESES, email: 'y@qa.mx' }], actorId: actor })
  globalThis.__arnes = esc
  const res = await ruta.GET(new NextRequest(`http://localhost/api/alumno/materia/${MATERIA}`), { params: { id: MATERIA } })
  return { status: res.status, cuerpo: await res.json() }
}
async function curso() {
  const esc = crearEscenario({ bd: bd(), auth: [{ id: ALUMNO, email: 'x@qa.mx' }], actorId: ALUMNO })
  const r = await datosCursos.modulosConProgreso(esc.clienteSesion(), ALUMNO, CURSO)
  return r.modulos[0].lecciones.map((l) => l.video_url)
}

const fallas = []
const ok = (cond, msg) => { if (!cond) fallas.push(msg) }
const firmadaRe = new RegExp(`^${CANONICA.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\?token=[0-9a-f]{64}&expires=(\\d{10})$`)

// 1. con BUNNY_*
const ahora = Math.floor(Date.now() / 1000)
const c1 = await materia(ALUMNO)
const v1 = c1.cuerpo.semanas?.[0]?.videos ?? []
ok(c1.status === 200, `1: status ${c1.status}`)
const m1 = v1[0]?.url?.match(firmadaRe)
ok(!!m1, '1: el video de Bunny no salió firmado')
ok(m1 && Math.abs(Number(m1[1]) - (ahora + 6 * 3600)) <= 5, '1: expires no es ahora + 6 h')
ok(v1[1]?.url === YOUTUBE, '1: el de YouTube cambió')
ok(!JSON.stringify(c1.cuerpo).includes(LLAVE), '1: la llave aparece en la respuesta')
const cursoCon = await curso()
ok(firmadaRe.test(cursoCon[0] ?? ''), '4: la lección de Bunny no salió firmada')
ok(cursoCon[1] === YOUTUBE, '4: la lección de YouTube cambió')

// 5. smoke /api/health/video (va a Bunny de verdad desde el «servidor»)
async function smoke(token, qs = '') {
  globalThis.__arnes = crearEscenario({ bd: bd(), auth: [], actorId: null })
  const h = token ? { authorization: `Bearer ${token}` } : {}
  const res = await salud.GET(new NextRequest(`http://localhost/api/health/video${qs}`, { headers: h }))
  return { status: res.status, cuerpo: await res.json() }
}
const s5a = await smoke(null)
ok(s5a.status === 401 && JSON.stringify(s5a.cuerpo) === '{"ok":false}', `5: sin token ${s5a.status}`)
const s5b = await smoke('0'.repeat(64))
ok(s5b.status === 401, `5: token malo ${s5b.status}`)
const s5c = await smoke(TOKEN_SMOKE)
ok(s5c.status === 200 && s5c.cuerpo.ok === true && s5c.cuerpo.firmada === 200 && s5c.cuerpo.sin_firma === 403, `5: smoke ${JSON.stringify(s5c.cuerpo)}`)
ok(!JSON.stringify(s5c.cuerpo).includes('mediadelivery') && !JSON.stringify(s5c.cuerpo).includes(LLAVE), '5: el smoke devuelve URL o llave')
const s5d = await smoke(TOKEN_SMOKE, `?video=${VIDEO}`)
ok(s5d.status === 200 && s5d.cuerpo.fuente === 'parametro', `5: smoke con ?video ${JSON.stringify(s5d.cuerpo)}`)

// 3. sin acceso
const c3 = await materia(SIN_MESES)
ok(c3.status === 403, `3: status ${c3.status}`)
ok(!JSON.stringify(c3.cuerpo).includes('mediadelivery') && !JSON.stringify(c3.cuerpo).includes('youtube'), '3: el 403 trae URLs')

// 2. sin BUNNY_*
delete process.env.BUNNY_LIBRARY_ID
delete process.env.BUNNY_TOKEN_KEY
errores.length = 0
const c2 = await materia(ALUMNO)
const v2 = c2.cuerpo.semanas?.[0]?.videos ?? []
ok(c2.status === 200, `2: status ${c2.status}`)
ok(v2[0]?.url === CANONICA, '2: sin config no salió la canónica sin token')
ok(v2[1]?.url === YOUTUBE, '2: el de YouTube cambió')
const errSin = errores.find((e) => e.includes('[bunny]'))
ok(!!errSin && errSin.includes('BUNNY_LIBRARY_ID') && errSin.includes('BUNNY_TOKEN_KEY'), '2: no hubo error claro en el servidor')
ok(!errores.some((e) => e.includes(LLAVE)), '2: el error contiene la llave')
const cursoSin = await curso()
ok(cursoSin[0] === CANONICA, '4: sin config la lección no salió canónica')
const s5e = await smoke(TOKEN_SMOKE)
ok(s5e.status === 503 && s5e.cuerpo.config === false, `5: smoke sin config ${JSON.stringify(s5e.cuerpo)}`)

console.error = errorOriginal
const resumen = {
  casos: {
    '1 con config': { status: c1.status, bunny: m1 ? 'firmada (token 64 hex, expires = ahora + 6 h)' : v1[0]?.url, youtube: v1[1]?.url === YOUTUBE ? 'intacto' : v1[1]?.url },
    '2 sin config': { status: c2.status, bunny: v2[0]?.url === CANONICA ? 'canónica sin token' : 'OTRA', error_servidor: errSin ?? null },
    '3 sin acceso': { status: c3.status, error: c3.cuerpo.error },
    '5 smoke /api/health/video': { sin_token: s5a.status, con_token: s5c.cuerpo, con_parametro: s5d.cuerpo.ok, sin_config: s5e.cuerpo },
    '4 curso': { con_config: firmadaRe.test(cursoCon[0] ?? '') ? 'firmada' : cursoCon[0], sin_config: cursoSin[0] === CANONICA ? 'canónica sin token' : cursoSin[0] },
  },
  fallas,
}
console.log(JSON.stringify(resumen, null, 2))
if (process.argv[2]) {
  fs.writeFileSync(process.argv[2], JSON.stringify({ firmada: v1[0]?.url, canonica: CANONICA, cursoFirmada: cursoCon[0] }, null, 2))
}
process.exit(fallas.length ? 1 : 0)
