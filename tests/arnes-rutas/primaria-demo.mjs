/**
 * Quién ve la materia demo, con las rutas REALES contra el Supabase falso y el tablero
 * real pintado con lo que esas rutas responden:
 *
 *   node tests/arnes-rutas/primaria-demo.mjs   → JSON por combo y alumno
 *
 * Un alumno de Primaria no la ve ni entra por ninguna vía. Sec y Prepa, igual que hoy.
 * `ARNES_RAIZ=<otro árbol>` corre lo mismo sobre main: con el add-on apagado y alumnos
 * de Sec/Prepa, la respuesta tiene que salir idéntica.
 */
import './hooks.mjs'
import './hooks-portal.mjs'
import { RAIZ } from './hooks.mjs'
import { crearEscenario } from './supabase-falso.mjs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { NextRequest } from 'next/server.js'

const imp = (rel) => import(pathToFileURL(path.join(RAIZ, rel)).href)
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk-del-arnes'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-del-arnes'

const { CONFIG } = await imp('src/lib/config.ts')
const rutas = {
  materias: await imp('src/app/api/alumno/materias/route.ts'),
  meses: await imp('src/app/api/alumno/meses/route.ts'),
  materia: await imp('src/app/api/alumno/materia/[id]/route.ts'),
  glosario: await imp('src/app/api/alumno/glosario/[materiaId]/route.ts'),
  quiz: await imp('src/app/api/alumno/quiz/[semanaId]/route.ts'),
  evaluacion: await imp('src/app/api/alumno/evaluacion/[id]/route.ts'),
  enviar: await imp('src/app/api/alumno/evaluacion/[id]/enviar/route.ts'),
  semana: await imp('src/app/api/alumno/progreso/semana/route.ts'),
  tiempo: await imp('src/app/api/alumno/progreso/tiempo/route.ts'),
  material: await imp('src/app/api/material/[id]/route.ts'),
  calificaciones: await imp('src/app/api/alumno/calificaciones/route.ts'),
  constancia: await imp('src/app/api/alumno/constancia/route.ts'),
}
const { renderToStaticMarkup } = await imp('node_modules/react-dom/server.node.js').catch(() => imp('node_modules/react-dom/server.js'))
const { createElement } = await import('react')
globalThis.__espiarAvance = true
const paginaMateria = await imp('src/app/(dashboard)/alumno/materia/[id]/page.tsx')
globalThis.__espiarAvance = false
const avance = await imp('src/components/alumno/ReadingProgress.tsx')
const tablero = await imp('src/app/(dashboard)/alumno/page.tsx')
const misMaterias = await imp('src/app/(dashboard)/alumno/materias/page.tsx')
const paginaCalificaciones = await imp('src/app/(dashboard)/alumno/calificaciones/page.tsx')
const paginaConstancia = await imp('src/app/(dashboard)/alumno/constancia/page.tsx')
const acceso = await imp('src/lib/acceso-materias.ts')

const DEMO = 'f0551b82-1c3e-4286-bfb4-878842bc6eff'
const TUT_PREPA = '22222222-0000-4000-8000-000000000002'
const PREPA = '33333333-0000-4000-8000-000000000003'
const SEC = '44444444-0000-4000-8000-000000000004'
const PRI = '55555555-0000-4000-8000-000000000005'
const PRI_8 = '56000006-0000-4000-8000-000000000000'
const ID = {
  primaria: 'aaaaaaaa-0000-4000-8000-00000000000a',
  secundaria: 'bbbbbbbb-0000-4000-8000-00000000000b',
  preparatoria: 'cccccccc-0000-4000-8000-00000000000c',
}
const SEM_DEMO = 'cc000001-0000-4000-a000-000000000001'
const EV_DEMO = 'bb000000-0000-4000-a000-000000000001'
const MAT_DEMO = 'dd000000-0000-4000-a000-000000000001'

function materia(id, nombre, nivel, orden) {
  return { id, nombre, descripcion: null, nivel, icono: null, color: '#123456', activa: true, orden, cuaderno_pdf_url: null,
    meses_contenido: [{ id: `mes-${id}`, numero_mes: 1, titulo: 'Mes 1', activa: true, semanas: [{ id: `sem-${id}`, activa: true }] }] }
}
function mes(m, semanaId = `sem-${m.id}`) {
  return { id: `mes-${m.id}`, materia_id: m.id, numero_mes: 1, titulo: 'Mes 1', descripcion: null, activa: true,
    materias: { id: m.id, nombre: m.nombre, nivel: m.nivel, color: m.color },
    semanas: [{ id: semanaId, numero_semana: 1, titulo: 'Semana 1', descripcion: null, contenido: 'x', video_url: null, video_url_2: null, video_url_3: null,
      tiempo_estimado_minutos: 60, activa: true, semana_materiales: [], actividades: null, actividades_pdf_url: null }] }
}

function bd(alumno) {
  const catalogo = [
    materia(DEMO, 'Tutoría de Ingreso I', 'demo', 0),
    materia(TUT_PREPA, 'Tutoría de ingreso I', 'preparatoria', 1),
    materia(PREPA, 'Matemáticas Prepa', 'preparatoria', 2),
    materia(SEC, 'Matemáticas Sec', 'secundaria', 13),
    materia(PRI, 'Lectura y comprensión I', 'primaria', 25),
    ...Array.from({ length: 17 }, (_, i) => materia(`56${String(i).padStart(6, '0')}-0000-4000-8000-000000000000`, `Primaria ${i + 2}`, 'primaria', 26 + i)),
  ]
  const meses = catalogo.map((m) => mes(m, m.id === DEMO ? SEM_DEMO : `sem-${m.id}`))
  return {
    usuarios: [{ id: alumno.id, rol: 'alumno', email: 'x@qa.mx', nombre: 'Ana', apellidos: 'Prueba', telefono: '5500000000' }],
    alumnos: [{
      matricula: 'QA-0001', carrera: null, activo: true, contactado_whatsapp: false, duracion_meses: 3,
      created_at: '2026-09-01T00:00:00Z', usuarios: { id: alumno.id, nombre: 'Ana', apellidos: 'Prueba', email: 'x@qa.mx', telefono: '5500000000' }, planes_estudio: null, ...alumno,
    }],
    materias: catalogo,
    meses_contenido: meses,
    semanas: meses.flatMap((m) => m.semanas.map((s) => ({ ...s, mes_id: m.id }))),
    glosario_materia: [{ id: 'g-1', materia_id: DEMO, termino: 'Bachillerato', definicion: 'x' }],
    quiz_semana: [{ id: 'q-1', semana_id: SEM_DEMO, pregunta: '¿?', opcion_a: 'a', opcion_b: 'b', opcion_c: 'c', opcion_d: null, respuesta_correcta: 'a', orden: 1, explicacion: 'x', activa: true }],
    quiz_respuestas: [],
    evaluaciones: [{ id: EV_DEMO, titulo: 'Examen Final', intentos_permitidos: 3, activa: true, materia_id: DEMO, mes_id: null, duracion_minutos: 60 }],
    preguntas: [],
    intentos_evaluacion: [],
    semana_materiales: [{ id: MAT_DEMO, semana_id: SEM_DEMO, path: 'demo/x.pdf', nombre: 'x.pdf' }],
    calificaciones: alumno.calificaciones ?? [],
    progreso_semanas: [],
    logros_alumno: [],
    racha_actividad: [],
    documentos_alumno: [],
    constancias: [],
    site_config: [],
    ajustes: [],
  }
}

const req = (url, cuerpo, metodo = 'GET') => new NextRequest(`http://localhost${url}`, {
  method: metodo, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo), headers: { 'content-type': 'application/json' },
})

async function llamar(fn) {
  const res = await fn()
  const cuerpo = res.status >= 300 && res.status < 400 ? null : await res.json().catch(() => null)
  return { status: res.status, cuerpo }
}

/** Todas las vías a la materia demo, y lo que el alumno lista. */
async function vias(alumno) {
  const base = bd(alumno)
  globalThis.__arnes = crearEscenario({
    bd: base, auth: [{ id: alumno.id, email: 'x@qa.mx' }], actorId: alumno.id,
    rpc: { emitir_constancia: { data: 'F-1', error: null }, alumno_marcar_semana: { data: { ok: true }, error: null } },
  })
  const abrir = (id) => llamar(() => rutas.materia.GET(req(`/api/alumno/materia/${id}`), { params: { id } }))
  const resumen = (r) => ({ status: r.status, error: r.status >= 400 ? (r.cuerpo?.error ?? null) : null })

  const lista = await llamar(() => rutas.materias.GET(req('/api/alumno/materias')))
  const meses = await llamar(() => rutas.meses.GET())
  const calif = await llamar(() => rutas.calificaciones.GET())
  const constancia = await llamar(() => rutas.constancia.GET())
  const { materias: catalogo } = await acceso.cargarContextoAcceso(globalThis.__arnes.clienteServicio(), alumno.id, alumno)
  const salida = {
    catalogo: catalogo.map((m) => m.nombre),
    lista: (lista.cuerpo?.materias ?? []).map((m) => m.nombre),
    disponibles: (lista.cuerpo?.materias ?? []).filter((m) => m.disponible).map((m) => m.nombre),
    meses: Array.isArray(meses.cuerpo)
      ? { demo: false, total: meses.cuerpo.length, abiertos: meses.cuerpo.filter((m) => m.desbloqueado).length, nombres: meses.cuerpo.flatMap((m) => m.materias.map((x) => x.nombre)) }
      : { demo: meses.cuerpo?.demo === true, materia_demo_id: meses.cuerpo?.materia_demo_id ?? null },
    materiaDemo: resumen(await abrir(DEMO)),
    materiaTutoriaPrepa: resumen(await abrir(TUT_PREPA)),
    materiaAjena: resumen(await abrir(alumno.nivel === 'preparatoria' ? SEC : PREPA)),
    respuestaPropia: (await abrir(alumno.nivel === 'primaria' ? PRI : alumno.nivel === 'secundaria' ? SEC : PREPA)).cuerpo,
    glosarioDemo: resumen(await llamar(() => rutas.glosario.GET(req(`/api/alumno/glosario/${DEMO}`), { params: { materiaId: DEMO } }))),
    quizVer: resumen(await llamar(() => rutas.quiz.GET(req(`/api/alumno/quiz/${SEM_DEMO}`), { params: { semanaId: SEM_DEMO } }))),
    quizEnviar: resumen(await llamar(() => rutas.quiz.POST(req(`/api/alumno/quiz/${SEM_DEMO}`, { respuestas: {} }, 'POST'), { params: { semanaId: SEM_DEMO } }))),
    examenVer: resumen(await llamar(() => rutas.evaluacion.GET(req(`/api/alumno/evaluacion/${EV_DEMO}`), { params: { id: EV_DEMO } }))),
    examenEnviar: resumen(await llamar(() => rutas.enviar.POST(req(`/api/alumno/evaluacion/${EV_DEMO}/enviar`, { respuestas: {} }, 'POST'), { params: { id: EV_DEMO } }))),
    marcarSemana: resumen(await llamar(() => rutas.semana.POST(req('/api/alumno/progreso/semana', { semana_id: SEM_DEMO }, 'POST')))),
    tiempoSemana: resumen(await llamar(() => rutas.tiempo.POST(req('/api/alumno/progreso/tiempo', { semana_id: SEM_DEMO, minutos: 1 }, 'POST')))),
    material: resumen(await llamar(() => rutas.material.GET(req(`/api/material/${MAT_DEMO}`), { params: { id: MAT_DEMO } }))),
    boletinMeses: (calif.cuerpo?.materias ?? []).map((m) => [m.nombre_materia, m.mes_numero, m.estado]),
    constanciaFilas: (constancia.cuerpo?.materias_cursadas ?? []).map((m) => [m.nombre_materia, m.mes_numero, m.codigo]),
    respuestaCalificaciones: calif.cuerpo,
    respuestaConstancia: constancia.cuerpo,
    boletin: (calif.cuerpo?.materias ?? []).map((m) => m.nombre_materia ?? m.nombre).filter((n) => /Tutor/i.test(n ?? '')),
    constancia: (constancia.cuerpo?.materias_cursadas ?? []).map((m) => m.nombre_materia).filter((n) => /Tutor/i.test(n ?? '')),
    respuestaLista: lista.cuerpo,
    respuestaMeses: meses.cuerpo,
  }
  return salida
}

/** El tablero y «Mis Materias» pintados con lo que dicen las rutas reales. */
function pantallas(alumno, v) {
  const perfil = { id: alumno.id, nombre_completo: 'Ana Prueba', nombre: 'Ana', matricula: 'QA-0001', nivel: alumno.nivel, carrera: null,
    plan_nombre: alumno.nivel, modalidad: alumno.modalidad, duracion_meses: 3, meses_desbloqueados: alumno.meses_desbloqueados, inscripcion_pagada: alumno.inscripcion_pagada, programa: null }
  const esDemo = v.respuestaMeses?.demo === true
  const pintar = (Componente, estados) => {
    globalThis.__estados = [...estados]
    try { return renderToStaticMarkup(createElement(Componente)) } finally { globalThis.__estados = null }
  }
  // La página real de la materia: lo que le pasa a la barra de lectura, con su mensaje de avance.
  // [materia, loading, error, tab, semana, alumnoId, completadas, materiaCompletada, glosario, guía, guardando]
  let mensajesDeLaMateria = null
  const materia = v.respuestaPropia
  if (materia?.semanas?.length) {
    globalThis.__propsAvance = []
    pintar(paginaMateria.default, [materia, false, null, 'contenido', materia.semanas[0].id, alumno.id, new Set(), false, [], false, false])
    const props = globalThis.__propsAvance.at(-1)
    mensajesDeLaMateria = props ? (avance.mensajesDeAvance?.('es', props.esPrimaria === true) ?? []) : null
  }
  return {
    mensajesDeLaMateria,
    // [materias, resumen, loading, error]: lo que respondió la ruta real.
    calificaciones: pintar(paginaCalificaciones.default, [v.respuestaCalificaciones?.materias ?? [], v.respuestaCalificaciones?.resumen ?? null, false, null]),
    // [datos, loading, error]. El folio es único en cada emisión: fuera, para poder comparar.
    constanciaPagina: pintar(paginaConstancia.default, [{ ...v.respuestaConstancia, folio: 'F-ARNES' }, false, null]),
    // [toasts, perfil, meses, demo, acreditadas, acreditadasIds, logros, ahora, racha, loading, primera, cursos]
    tablero: pintar(tablero.default, [[], perfil, esDemo ? [] : v.respuestaMeses, esDemo, 0, new Set(), [], null, 0, false, null, null]),
    // [data, loading, error]
    misMaterias: pintar(misMaterias.default, [v.respuestaLista, false, null]),
  }
}

const original = { primaria: CONFIG.primaria, niveles: CONFIG.niveles }
const COMBOS = {
  mixto: () => { CONFIG.primaria = { ...original.primaria, activa: true }; CONFIG.niveles = ['primaria', 'secundaria', 'preparatoria'] },
  apagado: () => { Object.assign(CONFIG, original) },
}
const ALUMNOS = {
  primariaSinPagar: { id: ID.primaria, nivel: 'primaria', modalidad: '3_meses_pri', meses_desbloqueados: 0, inscripcion_pagada: false },
  primariaPagada: { id: ID.primaria, nivel: 'primaria', modalidad: '3_meses_pri', meses_desbloqueados: 1, inscripcion_pagada: true },
  // Pasó de Secundaria a Primaria con «Corregir plan» y traía la demo acreditada.
  primariaConDemo: { id: ID.primaria, nivel: 'primaria', modalidad: '3_meses_pri', meses_desbloqueados: 1, inscripcion_pagada: true,
    calificaciones: [{ alumno_id: ID.primaria, materia_id: DEMO, acreditado: true, calificacion_final: 90, materias: { id: DEMO, nombre: 'Tutoría de Ingreso I', nivel: 'demo', orden: 0, carrera: null, meses_contenido: [{ numero_mes: 1 }] } }] },
  primaria6Meses: { id: ID.primaria, nivel: 'primaria', modalidad: '6_meses_pri', duracion_meses: 6, meses_desbloqueados: 1, inscripcion_pagada: true,
    // Acreditadas con el `numero_mes` de referencia, que no es el de su plan.
    calificaciones: [
      { alumno_id: ID.primaria, materia_id: PRI, acreditado: true, calificacion_final: 90, materias: { id: PRI, nombre: 'Lectura y comprensión I', nivel: 'primaria', orden: 25, carrera: null, meses_contenido: [{ numero_mes: 5 }] } },
      { alumno_id: ID.primaria, materia_id: PRI_8, acreditado: true, calificacion_final: 90, materias: { id: PRI_8, nombre: 'Primaria 8', nivel: 'primaria', orden: 32, carrera: null, meses_contenido: [{ numero_mes: 9 }] } },
    ] },
  primaria9Meses: { id: ID.primaria, nivel: 'primaria', modalidad: '9_meses_pri', duracion_meses: 9, meses_desbloqueados: 1, inscripcion_pagada: true },
  secundariaSinPagar: { id: ID.secundaria, nivel: 'secundaria', modalidad: '3_meses', meses_desbloqueados: 0, inscripcion_pagada: false },
  secundariaPagada: { id: ID.secundaria, nivel: 'secundaria', modalidad: '3_meses', meses_desbloqueados: 1, inscripcion_pagada: true },
  preparatoriaSinPagar: { id: ID.preparatoria, nivel: 'preparatoria', modalidad: '3_meses', meses_desbloqueados: 0, inscripcion_pagada: false },
  preparatoriaPagada: { id: ID.preparatoria, nivel: 'preparatoria', modalidad: '3_meses', meses_desbloqueados: 1, inscripcion_pagada: true },
}

const salida = {}
console.error = () => {}
console.warn = () => {}
console.log = () => {}
for (const [combo, fijar] of Object.entries(COMBOS)) {
  fijar()
  salida[combo] = {}
  for (const [nombre, alumno] of Object.entries(ALUMNOS)) {
    const v = await vias(alumno)
    const p = pantallas(alumno, v)
    delete v.respuestaLista
    delete v.respuestaMeses
    delete v.respuestaPropia
    delete v.respuestaCalificaciones
    delete v.respuestaConstancia
    salida[combo][nombre] = { ...v, ...p }
  }
}
process.stdout.write(JSON.stringify(salida))
