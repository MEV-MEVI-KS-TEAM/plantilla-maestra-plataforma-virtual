/**
 * Primaria con las rutas REALES (arnés de #187), contra el Supabase falso:
 *
 *   node tests/arnes-rutas/primaria-rutas.mjs   → JSON con cada caso
 *
 * Lo que aquí se comprueba es lo que queda ESCRITO, no el texto del fuente:
 *   - registro público y alta del admin guardan edad y tutor;
 *   - «Corregir plan» guarda el tutor con el plan, y lo devuelve a como estaba si el
 *     plan no se corrige; sin el tutor guardado, el plan no se toca;
 *   - la ficha no gana claves sin el add-on;
 *   - un alumno de Primaria pide los documentos de Primaria y conserva su ritmo aunque
 *     se apague el plan o el add-on.
 *
 * El add-on se enciende mutando CONFIG, como hace la plantilla al leerlo en cada llamada.
 * Lo que solo se ve con Postgres (CHECK, columna generada, seeds) no está aquí.
 */
import './hooks.mjs'
import { RAIZ } from './hooks.mjs'
import { crearEscenario } from './supabase-falso.mjs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { NextRequest } from 'next/server.js'

const imp = (rel) => import(pathToFileURL(path.join(RAIZ, rel)).href)
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk-del-arnes'

const { CONFIG } = await imp('src/lib/config.ts')
const registro = await imp('src/app/api/auth/register-complete/route.ts')
const altas = await imp('src/app/api/admin/alumnos/route.ts')
const corregir = await imp('src/app/api/admin/alumnos/[id]/corregir-plan/route.ts')
const ficha = await imp('src/app/api/admin/alumnos/[id]/route.ts')
const documentos = await imp('src/app/api/alumno/documentos/route.ts')
const desbloquear = await imp('src/app/api/admin/alumnos/[id]/desbloquear-mes/route.ts')
const modalidades = await imp('src/lib/modalidades.ts')
const acceso = await imp('src/lib/acceso-materias.ts')

const ADMIN = 'aaaaaaaa-0000-4000-8000-00000000000a'
const NUEVO = 'bbbbbbbb-0000-4000-8000-00000000000b'
const ALUMNO = 'eeeeeeee-0000-4000-8000-00000000000e'
const TUTOR = { tutor_nombre: 'Rosa López', tutor_telefono: '33 1234 5678', tutor_parentesco: 'Madre' }
const LIMPIO = { fecha_nacimiento: '2012-03-10', tutor_nombre: 'Rosa López', tutor_telefono: '3312345678', tutor_parentesco: 'Madre' }

const original = { primaria: CONFIG.primaria, niveles: CONFIG.niveles, modalidades: CONFIG.modalidades }
function conAddOn(cambios = {}) {
  Object.assign(CONFIG, original)
  CONFIG.primaria = { ...original.primaria, activa: true }
  CONFIG.niveles = ['primaria', 'secundaria', 'preparatoria']
  Object.assign(CONFIG, cambios)
}
const sinAddOn = () => Object.assign(CONFIG, original)

function bd(alumno = {}) {
  return {
    usuarios: [
      { id: ADMIN, rol: 'admin', email: 'a@qa.mx', nombre: 'Admin', apellidos: 'QA', telefono: '5500000000' },
      { id: ALUMNO, rol: 'alumno', email: 'x@qa.mx', nombre: 'Ana', apellidos: 'QA', telefono: '5500000001' },
    ],
    alumnos: [{
      id: ALUMNO, matricula: 'QA-0001', nivel: 'secundaria', modalidad: '3_meses', carrera: null,
      meses_desbloqueados: 0, activo: true, inscripcion_pagada: false, contactado_whatsapp: false,
      fecha_nacimiento: null, tutor_nombre: null, tutor_telefono: null, tutor_parentesco: null,
      created_at: '2026-09-01T00:00:00Z', ...alumno,
    }],
    ajustes: [],
    documentos_alumno: [],
    alumno_mes_eventos: [],
    site_config: [],
    pagos: [],
    calificaciones: [],
    intentos_evaluacion: [],
    curso_inscripciones: [],
  }
}

/** Un escenario y la llamada: status, cuerpo, lo escrito en `alumnos` y la fila final. */
async function correr({ base, actor, auth, rpc, llamar, fallaEscritura, relecturaFalla }) {
  const esc = crearEscenario({ bd: base, auth, actorId: actor, rpc })
  const desde = errores.length
  if (relecturaFalla) {
    // A partir de que la RPC la encienda, la lectura del plan de la fila falla.
    const original = esc.clienteServicio
    esc.clienteServicio = () => {
      const c = original()
      const from = c.from.bind(c)
      c.from = (tabla) => {
        const q = from(tabla)
        if (tabla !== 'alumnos') return q
        return new Proxy(q, {
          get(o, p) {
            if (p !== 'select' || !base.__relecturaFalla) return Reflect.get(o, p)
            return () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: 'XX000', message: 'falla simulada' } }) }) })
          },
        })
      }
      return c
    }
  }
  if (fallaEscritura) {
    const original = esc.clienteServicio
    esc.clienteServicio = () => {
      const c = original()
      const from = c.from.bind(c)
      c.from = (tabla) => {
        const q = from(tabla)
        return tabla === 'alumnos' ? new Proxy(q, {
          get(o, p) {
            if (p !== 'update') return Reflect.get(o, p)
            return () => ({ eq: async () => ({ data: null, error: { code: 'XX000', message: 'falla simulada' } }) })
          },
        }) : q
      }
      return c
    }
  }
  globalThis.__arnes = esc
  const res = await llamar()
  const cuerpo = await res.json().catch(() => null)
  return {
    status: res.status,
    cuerpo,
    rpc: esc.bitacora.filter((e) => e.op === 'rpc').map((e) => e.nombre),
    escrituras: esc.bitacora.filter((e) => e.tabla === 'alumnos').map((e) => ({ op: e.op, valores: e.valores })),
    alumno: base.alumnos.find((a) => a.id === ALUMNO) ?? null,
    nuevo: base.alumnos.find((a) => a.id !== ALUMNO) ?? null,
    log: errores.slice(desde).join('\n'),
  }
}

const req = (url, cuerpo, metodo = 'POST') => new NextRequest(`http://localhost${url}`, {
  method: metodo, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo), headers: { 'content-type': 'application/json' },
})

const errores = []
const errorOriginal = console.error
console.error = (...a) => { errores.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')) }

const casos = {}

// ── Registro público ─────────────────────────────────────────────────────────
const registrar = (cuerpo) => correr({
  base: bd(), actor: NUEVO, auth: [{ id: NUEVO, email: 'nuevo@qa.mx' }],
  llamar: () => registro.POST(req('/api/auth/register-complete', cuerpo)),
})
const DATOS_REGISTRO = { nombre: 'Luis', apellidos: 'QA', telefono: '5512345678', nivel: 'primaria', modalidad: '9_meses_pri', fecha_nacimiento: '2012-03-10', ...TUTOR }
conAddOn()
casos.registroMenor = await registrar(DATOS_REGISTRO)
casos.registroSinTutor = await registrar({ ...DATOS_REGISTRO, tutor_nombre: '' })

// Un CHECK que rechaza la fila: `details` la trae completa, y con fecha y tutor no va a los logs.
{
  const base = bd()
  const esc = crearEscenario({ bd: base, auth: [{ id: NUEVO, email: 'nuevo@qa.mx' }], actorId: NUEVO })
  const cliente = esc.clienteServicio
  esc.clienteServicio = () => {
    const c = cliente()
    const from = c.from.bind(c)
    c.from = (tabla) => (tabla === 'alumnos'
      ? { insert: async () => ({ error: { code: '23514', message: 'viola CHECK', details: 'Failing row contains (Rosa López, 3312345678)' } }) }
      : from(tabla))
    return c
  }
  globalThis.__arnes = esc
  errores.length = 0
  const res = await registro.POST(req('/api/auth/register-complete', DATOS_REGISTRO))
  casos.registroCheckFalla = { status: res.status, log: errores.join('\n') }
}

sinAddOn()
casos.registroApagadoPrimaria = await registrar(DATOS_REGISTRO)
casos.registroApagadoSecundaria = await registrar({ nombre: 'Luis', nivel: 'secundaria', modalidad: '3_meses', fecha_nacimiento: '2012-03-10', ...TUTOR })

// ── Alta del admin ───────────────────────────────────────────────────────────
const alta = (cuerpo) => correr({
  base: bd(), actor: ADMIN, auth: [{ id: ADMIN, email: 'a@qa.mx' }],
  llamar: () => altas.POST(req('/api/admin/alumnos', cuerpo)),
})
const DATOS_ALTA = { email: 'alta@qa.mx', password: 'Prueba-12345', nombre_completo: 'Eva QA', telefono: '5512345678', nivel: 'primaria', modalidad: '6_meses_pri', fecha_nacimiento: '2012-03-10', ...TUTOR }
conAddOn()
casos.altaMenor = await alta(DATOS_ALTA)
casos.altaSinTutor = await alta({ ...DATOS_ALTA, tutor_telefono: '123' })
sinAddOn()
casos.altaApagadoSecundaria = await alta({ ...DATOS_ALTA, nivel: 'secundaria', modalidad: '3_meses' })

// ── «Corregir plan» ──────────────────────────────────────────────────────────
const RPC_OK = { corregir_plan_estudio: (args, base) => {
  const fila = base.alumnos.find((a) => a.id === args.p_alumno)
  Object.assign(fila, { nivel: args.p_nivel, modalidad: args.p_modalidad, carrera: args.p_carrera })
  return { data: { ok: true, matricula: fila.matricula, notas_borradas: 0 }, error: null }
} }
const corregirPlan = (cuerpo, { rpc = RPC_OK, alumno, fallaEscritura, relecturaFalla } = {}) => correr({
  base: bd(alumno), actor: ADMIN, auth: [{ id: ADMIN, email: 'a@qa.mx' }, { id: ALUMNO, email: 'x@qa.mx' }], rpc, fallaEscritura, relecturaFalla,
  llamar: () => corregir.POST(req(`/api/admin/alumnos/${ALUMNO}/corregir-plan`, cuerpo), { params: { id: ALUMNO } }),
})
const PLAN_PRI = { nivel: 'primaria', carrera: null, modalidad: '3_meses_pri', fecha_nacimiento: '2012-03-10', ...TUTOR }
const PREVIO = { fecha_nacimiento: '2000-01-01', tutor_nombre: 'Previo', tutor_telefono: '5500000000', tutor_parentesco: 'Padre' }
conAddOn()
casos.corregirOk = await corregirPlan(PLAN_PRI)
casos.corregirCandado = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO,
  rpc: { corregir_plan_estudio: { data: { ok: false, candado: 'pagos' }, error: null } },
})
casos.corregirRpcError = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO,
  rpc: { corregir_plan_estudio: { data: null, error: { code: 'XX000', message: 'falla' } } },
})
casos.corregirTutorFalla = await corregirPlan(PLAN_PRI, { fallaEscritura: true })

// El candado se mira antes de escribir: con uno puesto, la fila no se toca.
casos.corregirCandadoPrevio = await corregirPlan({ ...PLAN_PRI, fecha_nacimiento: '1990-01-01' }, {
  alumno: { ...PREVIO, fecha_nacimiento: '2012-03-10' },
  rpc: { candado_corregir_plan: { data: 'pagos', error: null }, ...RPC_OK },
})
casos.corregirCandadoPrevioError = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO,
  rpc: { candado_corregir_plan: { data: null, error: { code: 'XX000', message: 'falla' } }, ...RPC_OK },
})

// La RPC confirma y su respuesta se pierde: por error, por una respuesta vacía o por una excepción.
const confirma = (args, base) => {
  Object.assign(base.alumnos.find((a) => a.id === args.p_alumno), { nivel: args.p_nivel, modalidad: args.p_modalidad, carrera: args.p_carrera })
}
const PERDIDA = { code: '', message: 'TypeError: fetch failed' }
casos.corregirPerdidaError = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO, rpc: { corregir_plan_estudio: (a, b) => { confirma(a, b); return { data: null, error: PERDIDA } } },
})
casos.corregirPerdidaVacia = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO, rpc: { corregir_plan_estudio: (a, b) => { confirma(a, b); return { data: null, error: null } } },
})
casos.corregirPerdidaExcepcion = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO, rpc: { corregir_plan_estudio: (a, b) => { confirma(a, b); throw new TypeError('fetch failed') } },
})
// No se puede releer: no se restaura, se registra y responde error.
casos.corregirSinRelectura = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO, relecturaFalla: true,
  rpc: { corregir_plan_estudio: (a, b) => { confirma(a, b); b.__relecturaFalla = true; return { data: null, error: PERDIDA } } },
})
// Otro plan distinto al pedido: alguien más la cambió. Tampoco se restaura.
casos.corregirOtroPlan = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO,
  rpc: { corregir_plan_estudio: (a, b) => { confirma({ ...a, p_modalidad: '6_meses_pri' }, b); return { data: null, error: PERDIDA } } },
})
// Sin respuesta y el plan sigue igual: no se corrigió, el tutor vuelve a como estaba.
casos.corregirPerdidaSinCambio = await corregirPlan(PLAN_PRI, {
  alumno: PREVIO, rpc: { corregir_plan_estudio: { data: null, error: PERDIDA } },
})
// Un CHECK que rechaza: `details` trae la fila, con el tutor.
const CHECK_23514 = { code: '23514', message: 'viola CHECK', details: 'Failing row contains (Rosa López, 3312345678)' }
casos.corregirCheck = await corregirPlan(PLAN_PRI, { alumno: PREVIO, rpc: { corregir_plan_estudio: { data: null, error: CHECK_23514 } } })
sinAddOn()
casos.corregirApagado = await corregirPlan({ nivel: 'secundaria', carrera: null, modalidad: '6_meses' })
casos.corregirApagadoCheck = await corregirPlan({ nivel: 'secundaria', carrera: null, modalidad: '6_meses' }, { rpc: { corregir_plan_estudio: { data: null, error: CHECK_23514 } } })

// ── Ficha ────────────────────────────────────────────────────────────────────
const verFicha = (alumno) => correr({
  base: bd(alumno), actor: ADMIN, auth: [{ id: ADMIN, email: 'a@qa.mx' }, { id: ALUMNO, email: 'x@qa.mx' }],
  rpc: { candado_corregir_plan: { data: { permitida: true, candado: null }, error: null } },
  llamar: () => ficha.GET(req(`/api/admin/alumnos/${ALUMNO}`, undefined, 'GET'), { params: { id: ALUMNO } }),
})
const clavesEdad = (r) => ['fecha_nacimiento', 'tutor_nombre', 'tutor_telefono', 'tutor_parentesco'].filter((k) => k in (r.cuerpo ?? {}))
{
  sinAddOn()
  const apagado = await verFicha()
  const apagadoConDatos = await verFicha({ nivel: 'primaria', modalidad: '9_meses_pri', ...LIMPIO })
  conAddOn()
  const encendido = await verFicha({ nivel: 'primaria', modalidad: '9_meses_pri', ...LIMPIO })
  casos.ficha = {
    apagado: { status: apagado.status, claves: clavesEdad(apagado) },
    apagadoConDatos: { status: apagadoConDatos.status, claves: clavesEdad(apagadoConDatos), tutor: apagadoConDatos.cuerpo?.tutor_nombre, duracion: apagadoConDatos.cuerpo?.duracion_meses },
    encendido: { status: encendido.status, claves: clavesEdad(encendido), tutor: encendido.cuerpo?.tutor_nombre },
  }
}

// ── Documentos ───────────────────────────────────────────────────────────────
conAddOn()
{
  const verDocs = (nivel) => correr({
    base: bd({ nivel, modalidad: '3_meses_pri' }), actor: ALUMNO, auth: [{ id: ALUMNO, email: 'x@qa.mx' }],
    llamar: () => documentos.GET(),
  })
  casos.documentosPrimaria = (await verDocs('primaria')).cuerpo?.plan_nombre ?? null
  casos.documentosSecundaria = (await verDocs('secundaria')).cuerpo?.plan_nombre ?? null
}

// ── El ritmo de quien ya está inscrito ───────────────────────────────────────
function ventana(modalidad, meses) {
  const materias = Array.from({ length: 18 }, (_, i) => ({ id: `PRI${i + 1}`, nombre: `PRI${i + 1}`, nivel: 'primaria', orden: 25 + i, numero_mes: Math.ceil((i + 1) / 2) }))
  const disp = acceso.calcularDisponibilidad({ nivel: 'primaria', modalidad, duracion_meses: null, meses_desbloqueados: meses }, materias, new Set())
  return [...disp.values()].filter(Boolean).length
}
const ritmo = (id) => ({
  meses: modalidades.getMesesByModalidad(id),
  porMes: modalidades.getMateriasPorMesByModalidad(id),
  abreTodo: ventana(id, modalidades.getMesesByModalidad(id)),
  etiqueta: modalidades.getLabelByModalidad(id),
})
const planApagado = (id) => ({ ...original.primaria, activa: true, modalidades: original.primaria.modalidades.map((m) => (m.id === id ? { ...m, activa: false } : m)) })
conAddOn({ primaria: planApagado('9_meses_pri') })
casos.ritmoPlanApagado = { ...ritmo('9_meses_pri'), oferta: modalidades.getModalidadesPrimaria().map((m) => m.id) }
sinAddOn()
casos.ritmoAddOnApagado = {
  '3_meses_pri': ritmo('3_meses_pri'), '6_meses_pri': ritmo('6_meses_pri'), '9_meses_pri': ritmo('9_meses_pri'),
  oferta: modalidades.getModalidadesPrimaria().map((m) => m.id),
  secundaria: { meses: modalidades.getMesesByModalidad('3_meses'), porMes: modalidades.getMateriasPorMesByModalidad('3_meses') },
  desconocido: { meses: modalidades.getMesesByModalidad('x'), porMes: modalidades.getMateriasPorMesByModalidad('x'), etiqueta: modalidades.getLabelByModalidad('x') },
  defecto: modalidades.getDefaultModalidadId(),
}

// El tope real del panel: con el add-on apagado, «Abrir mes» sigue abriendo hasta el mes 9.
{
  let tope = null
  const abrir = await correr({
    base: bd({ nivel: 'primaria', modalidad: '9_meses_pri', meses_desbloqueados: 3, inscripcion_pagada: true }),
    actor: ADMIN, auth: [{ id: ADMIN, email: 'a@qa.mx' }, { id: ALUMNO, email: 'x@qa.mx' }],
    rpc: { alumno_mover_mes: (args) => { tope = args.p_tope; return { data: [{ meses_ahora: 4, mes_movido: 4, repetido: false }], error: null } } },
    llamar: () => desbloquear.POST(req(`/api/admin/alumnos/${ALUMNO}/desbloquear-mes`, { antes: 3 }), { params: { id: ALUMNO } }),
  })
  casos.abrirMesApagado = { status: abrir.status, tope }
}

console.error = errorOriginal
process.stdout.write(JSON.stringify(casos))
