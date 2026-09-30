/**
 * Matriz de #187: cada ruta de gestión de alumnos × actor (admin, secretario) ×
 * cuenta objetivo, ejecutando los route.ts REALES contra el Supabase falso.
 *
 *   node tests/arnes-rutas/matriz-187.mjs            → JSON con cada caso
 *   ARNES_RAIZ=<otro árbol> node …/matriz-187.mjs     → la misma matriz sobre otro código
 *
 * Por cada caso devuelve el status, el error y TODAS las escrituras, RPC y
 * operaciones de Auth que hizo la ruta (la bitácora del Supabase falso).
 *
 * Dos clases de ruta:
 *   - por ALUMNO: el id del alumno llega en el path o en el cuerpo;
 *   - por FILA: llega el id de una inscripción a un curso o de un documento, y
 *     la ruta resuelve de quién es.
 */
import { RAIZ } from './hooks.mjs'
import { crearEscenario, metodosDesconocidos } from './supabase-falso.mjs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { NextRequest } from 'next/server.js'

export const ID = {
  adminA: 'aaaaaaaa-0000-4000-8000-00000000000a',
  adminB: 'bbbbbbbb-0000-4000-8000-00000000000b',
  secretarioS: 'cccccccc-0000-4000-8000-00000000000c',
  secretarioT: 'dddddddd-0000-4000-8000-00000000000d',
  alumnoX: 'eeeeeeee-0000-4000-8000-00000000000e',
  adminConFila: 'ffffffff-0000-4000-8000-00000000000f',
  huerfano: '99999999-0000-4000-8000-000000000009',
  alumnoNuevo: '88888888-0000-4000-8000-000000000008',
}
const CURSO = '77777777-0000-4000-8000-000000000007'
// Drift: una fila de alumno (e inscripción) sin fila en `usuarios`. No es personal:
// la lista de inscritos del curso la sigue enseñando (con «—»), como antes de #187.
const SIN_USUARIO = '66666666-0000-4000-8000-000000000006'
const INS_SIN_USUARIO = '12345678-6666-4000-8000-000000000006'

/** Una inscripción y un documento por cuenta: el id de la fila se deriva del de la cuenta. */
const FILA = {}
for (const id of Object.values(ID)) {
  FILA[id] = {
    ins: `12345678-${id.slice(9, 13)}-4000-8000-${id.slice(-12)}`,
    doc: `87654321-${id.slice(9, 13)}-4000-8000-${id.slice(-12)}`,
  }
}

function bdInicial() {
  const u = (id, rol, email) => ({ id, rol, email, nombre: `Nombre ${email}`, apellidos: 'Prueba', telefono: '5500000000' })
  const alumno = (id) => ({
    id, matricula: `QA-${id.slice(0, 4)}`, nivel: 'secundaria', modalidad: '3_meses', carrera: null,
    meses_desbloqueados: 1, activo: true, inscripcion_pagada: false, contactado_whatsapp: false,
    created_at: '2026-09-01T00:00:00Z',
  })
  const cuentas = [
    u(ID.adminA, 'admin', 'a@qa.mx'), u(ID.adminB, 'admin', 'b@qa.mx'),
    u(ID.secretarioS, 'secretario', 's@qa.mx'), u(ID.secretarioT, 'secretario', 't@qa.mx'),
    u(ID.alumnoX, 'alumno', 'x@qa.mx'), u(ID.adminConFila, 'admin', 'h@qa.mx'),
    u(ID.huerfano, 'alumno', 'o@qa.mx'), u(ID.alumnoNuevo, 'alumno', 'n@qa.mx'),
  ]
  // Toda cuenta tiene una inscripción y un documento: así la ruta por FILA
  // siempre encuentra la fila y lo que decide es de QUIÉN es.
  return {
    usuarios: cuentas,
    // El admin «con fila» es el drift: ascendido desde alumno, o una fila fabricada por PostgREST.
    alumnos: [alumno(ID.alumnoX), alumno(ID.adminConFila), alumno(SIN_USUARIO)],
    cursos: [{ id: CURSO, nombre: 'Curso QA', estado: 'publicado', precio_inscripcion: 2490, precio_mensualidad: 0 }],
    curso_inscripciones: [
      ...cuentas.map((c) => ({ id: FILA[c.id].ins, curso_id: CURSO, alumno_id: c.id, estado: 'activa', meses_desbloqueados: 1 })),
      { id: INS_SIN_USUARIO, curso_id: CURSO, alumno_id: SIN_USUARIO, estado: 'activa', meses_desbloqueados: 1 },
    ],
    documentos_alumno: cuentas.map((c) => ({ id: FILA[c.id].doc, alumno_id: c.id, tipo: 'acta', estado: 'pendiente' })),
    curso_constancias: [],
    pagos: [],
    calendario_pagos: [],
    site_config: [],
  }
}

function cuentasAuth(bd) {
  return bd.usuarios.map((u) => ({ id: u.id, email: u.email }))
}

const FILA_RPC = { data: [{ acceso_total: true, meses_desbloqueados: 2, mes: 2, folio: 'QA-1', ok: true, pago_id: 'x', abierto: true }], error: null }
const RPC = {
  alumno_mover_mes: (args) => ({
    data: [{ meses_antes: 1, meses_ahora: args.p_accion === 'abrir' ? 2 : 0, mes_movido: args.p_accion === 'abrir' ? 2 : 1,
      repetido: false, quien: 'QA', quien_rol: 'admin', cuando: '2026-09-30T00:00:00Z' }],
    error: null,
  }),
  corregir_plan_estudio: () => ({ data: { ok: true, matricula: 'QA-0001', notas_borradas: 0 }, error: null }),
  candado_corregir_plan: () => ({ data: null, error: null }),
  registrar_cuota_semanal: () => ({ data: [{ ok: true, pago_id: 'p1' }], error: null }),
  curso_inscribir: () => FILA_RPC,
  curso_abrir_mes: () => FILA_RPC,
  curso_cerrar_mes: () => FILA_RPC,
  curso_abrir_todo: () => FILA_RPC,
  curso_quitar_acceso_total: () => FILA_RPC,
  curso_activar_segun_ficha: () => FILA_RPC,
  curso_emitir_constancia: () => ({ data: [{ folio: 'QA-2026-0001', emitida: true }], error: null }),
  curso_cobrar: () => ({ data: [{ pago_id: 'x', abierto: false, meses_desbloqueados: 1, acceso_total: false }], error: null }),
  curso_cambiar_estado: () => FILA_RPC,
  curso_tope_meses: () => ({ data: 3, error: null }),
}

const A = 'src/app/api/admin/alumnos/[id]'
const PAGO_ID = '5a5a5a5a-0000-4000-8000-00000000005a'

/**
 * Cada ruta: nombre, archivo, método, quién puede (admin | staff), clase (alumno | fila)
 * y cómo se arma la petición para un objetivo `t` ({ id, canon }).
 */
export const RUTAS = [
  // ── por ALUMNO: /api/admin/alumnos/[id]/** ──
  { n: 'DELETE [id] (desactivar)', f: `${A}/route.ts`, m: 'DELETE', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id } }) },
  { n: 'DELETE [id]?definitivo=true', f: `${A}/route.ts`, m: 'DELETE', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, query: '?definitivo=true' }) },
  { n: 'PUT [id] (activo)', f: `${A}/route.ts`, m: 'PUT', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { activo: false } }) },
  { n: 'PATCH [id] (contactado)', f: `${A}/route.ts`, m: 'PATCH', q: 'staff', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { contactado_whatsapp: true } }) },
  { n: 'GET [id] (ficha)', f: `${A}/route.ts`, m: 'GET', q: 'staff', c: 'alumno', arma: (t) => ({ params: { id: t.id } }) },
  { n: 'PATCH [id]/datos', f: `${A}/datos/route.ts`, m: 'PATCH', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { nombre: 'Cambiado', email: 'nuevo-correo@qa.mx' } }) },
  { n: 'POST [id]/reset-password', f: `${A}/reset-password/route.ts`, m: 'POST', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { newPassword: 'secreta-nueva-123' } }) },
  { n: 'PATCH [id]/activar', f: `${A}/activar/route.ts`, m: 'PATCH', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { activo: true } }) },
  { n: 'PUT [id]/notas', f: `${A}/notas/route.ts`, m: 'PUT', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { notas: 'nota de QA' } }) },
  { n: 'PATCH [id]/inscripcion', f: `${A}/inscripcion/route.ts`, m: 'PATCH', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: {} }) },
  { n: 'POST [id]/desbloquear-mes', f: `${A}/desbloquear-mes/route.ts`, m: 'POST', q: 'staff', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: {} }) },
  { n: 'POST [id]/cerrar-mes', f: `${A}/cerrar-mes/route.ts`, m: 'POST', q: 'staff', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: {} }) },
  { n: 'POST [id]/corregir-plan', f: `${A}/corregir-plan/route.ts`, m: 'POST', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { nivel: 'secundaria', modalidad: '6_meses' } }) },
  // ── por ALUMNO, fuera de alumnos/[id] ──
  { n: 'POST /api/admin/pagos', f: 'src/app/api/admin/pagos/route.ts', m: 'POST', q: 'staff', c: 'alumno', arma: (t) => ({ params: {}, body: { alumno_id: t.id, monto: 100, metodo_pago: 'EFECTIVO', concepto: 'mensualidad' } }) },
  { n: 'POST /api/admin/cobranza/[alumnoId]', f: 'src/app/api/admin/cobranza/[alumnoId]/route.ts', m: 'POST', q: 'staff', c: 'alumno', arma: (t) => ({ params: { alumnoId: t.id }, body: { accion: 'pagar', numero_semana: 1, metodo_pago: 'EFECTIVO' } }) },
  { n: 'POST /api/admin/cursos/[id]/inscripciones', f: 'src/app/api/admin/cursos/[id]/inscripciones/route.ts', m: 'POST', q: 'staff', c: 'alumno', arma: (t) => ({ params: { id: CURSO }, body: { alumno_id: t.id } }) },
  { n: 'DELETE /api/admin/cursos/[id]/inscripciones/[alumnoId]', f: 'src/app/api/admin/cursos/[id]/inscripciones/[alumnoId]/route.ts', m: 'DELETE', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: CURSO, alumnoId: t.id } }) },
  { n: 'PATCH /api/admin/documentos/[id]', f: 'src/app/api/admin/documentos/[id]/route.ts', m: 'PATCH', q: 'admin', c: 'alumno', arma: (t) => ({ params: { id: t.id }, body: { documentoId: FILA[t.canon]?.doc ?? t.id, estado: 'aprobado' } }) },
  // ── por FILA: una inscripción a un curso o un documento ──
  { n: 'PATCH /api/admin/inscripciones/[id]', f: 'src/app/api/admin/inscripciones/[id]/route.ts', m: 'PATCH', q: 'admin', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: { fecha_inscripcion: '2026-09-01' } }) },
  { n: 'POST inscripciones/[id]/abrir-mes', f: 'src/app/api/admin/inscripciones/[id]/abrir-mes/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: { meses_esperados: 1 } }) },
  { n: 'POST inscripciones/[id]/abrir-todo', f: 'src/app/api/admin/inscripciones/[id]/abrir-todo/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: {} }) },
  { n: 'POST inscripciones/[id]/activar', f: 'src/app/api/admin/inscripciones/[id]/activar/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: { regla_esperada: 'mes1' } }) },
  { n: 'POST inscripciones/[id]/cerrar-mes', f: 'src/app/api/admin/inscripciones/[id]/cerrar-mes/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: { meses_esperados: 1 } }) },
  { n: 'POST inscripciones/[id]/constancia', f: 'src/app/api/admin/inscripciones/[id]/constancia/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: {} }) },
  { n: 'POST inscripciones/[id]/pago', f: 'src/app/api/admin/inscripciones/[id]/pago/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: { pago_id: PAGO_ID, concepto: 'curso_mensualidad', monto: 100, metodo_pago: 'EFECTIVO' } }) },
  { n: 'POST inscripciones/[id]/quitar-acceso-total', f: 'src/app/api/admin/inscripciones/[id]/quitar-acceso-total/route.ts', m: 'POST', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins }, body: { motivo: 'QA' } }) },
  { n: 'GET /api/admin/inscripciones/[id]', f: 'src/app/api/admin/inscripciones/[id]/route.ts', m: 'GET', q: 'staff', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].ins } }) },
  { n: 'PUT /api/admin/documentos/[id]/verificar', f: 'src/app/api/admin/documentos/[id]/verificar/route.ts', m: 'PUT', q: 'admin', c: 'fila', arma: (t) => ({ params: { id: FILA[t.canon].doc }, body: { estado: 'aprobado' } }) },
]

const ACTORES = { admin: ID.adminA, secretario: ID.secretarioS }

/** Los objetivos: [etiqueta, id tal como llega, id canónico, clase esperada]. */
function objetivosDe(actor, claseRuta) {
  const yo = ACTORES[actor]
  const base = [
    ['alumno', ID.alumnoX, ID.alumnoX, 'alumno'],
    ['admin B', ID.adminB, ID.adminB, 'personal'],
    ['secretario T', ID.secretarioT, ID.secretarioT, 'personal'],
    ['admin con fila en alumnos', ID.adminConFila, ID.adminConFila, 'personal'],
    ['él mismo', yo, yo, 'personal'],
    ['cuenta huérfana (alumno sin fila)', ID.huerfano, ID.huerfano, 'huerfano'],
  ]
  if (claseRuta === 'fila') return base
  return [
    ...base,
    ['alumno (UUID en MAYÚSCULAS)', ID.alumnoX.toUpperCase(), ID.alumnoX, 'alumno'],
    ['admin B (UUID en MAYÚSCULAS)', ID.adminB.toUpperCase(), ID.adminB, 'personal'],
    ['él mismo (UUID en MAYÚSCULAS)', yo.toUpperCase(), yo, 'personal'],
    ['él mismo ({llaves} sin guiones)', `{${yo.replace(/-/g, '')}}`, yo, 'personal'],
  ]
}

const cache = new Map()
async function modulo(rel) {
  const url = pathToFileURL(path.join(RAIZ, rel)).href
  if (!cache.has(url)) cache.set(url, await import(url))
  return cache.get(url)
}

const ESCRITURAS = new Set(['update', 'delete', 'insert', 'upsert', 'rpc', 'auth.updateUserById', 'auth.deleteUser', 'auth.createUser', 'storage.remove', 'storage.upload'])
// Lecturas que las rutas hacen por RPC y que no escriben nada.
const RPC_DE_LECTURA = new Set(['candado_corregir_plan', 'curso_tope_meses', 'curso_inscripciones_por_activar'])

async function ejecutar({ rel, metodo, actorId, params, body, query = '', conCuerpo = false, ajustarBd = null }) {
  const bd = bdInicial()
  if (ajustarBd) ajustarBd(bd)
  const esc = crearEscenario({ bd, auth: cuentasAuth(bd), actorId, rpc: RPC })
  globalThis.__arnes = esc
  const mod = await modulo(rel)
  const handler = mod[metodo]
  if (typeof handler !== 'function') return { status: 'SIN-HANDLER' }
  const url = `http://localhost/api/x${query}`
  const init = { method: metodo }
  if (body !== undefined && body !== null && metodo !== 'GET') {
    init.body = JSON.stringify(body)
    init.headers = { 'content-type': 'application/json' }
  }
  let res
  try {
    res = await handler(new NextRequest(url, init), { params })
  } catch (e) {
    return { status: 'EXCEPCION', error: String(e?.message ?? e), escrituras: esc.bitacora.filter((b) => ESCRITURAS.has(b.op)) }
  }
  let json = null
  try { json = await res.json() } catch { /* sin cuerpo */ }
  return {
    status: res.status,
    error: json && typeof json.error === 'string' ? json.error : null,
    ...(conCuerpo ? { cuerpo: json } : {}),
    escrituras: esc.bitacora.filter((b) => ESCRITURAS.has(b.op) && !(b.op === 'rpc' && RPC_DE_LECTURA.has(b.nombre))),
  }
}

export async function correrMatriz() {
  const casos = []
  for (const r of RUTAS) {
    for (const actor of Object.keys(ACTORES)) {
      for (const [etiqueta, id, canon, clase] of objetivosDe(actor, r.c)) {
        const { params, body, query } = r.arma({ id, canon })
        const x = await ejecutar({ rel: r.f, metodo: r.m, actorId: ACTORES[actor], params, body, query })
        casos.push({ ruta: r.n, quien: r.q, claseRuta: r.c, actor, objetivo: etiqueta, clase, ...x })
      }
    }
  }
  // register-complete: la sesión ES el objetivo (#263).
  for (const [etiqueta, actorId, clase] of [
    ['admin se registra como alumno', ID.adminA, 'personal'],
    ['secretario se registra como alumno', ID.secretarioS, 'personal'],
    ['alumno nuevo (fila del trigger, sin alumnos)', ID.alumnoNuevo, 'alumno'],
  ]) {
    const x = await ejecutar({
      rel: 'src/app/api/auth/register-complete/route.ts', metodo: 'POST', actorId, params: {},
      body: { nombre: 'QA', apellidos: 'Registro', telefono: '5511111111', nivel: 'secundaria', modalidad: '3_meses' },
    })
    casos.push({ ruta: 'POST /api/auth/register-complete', quien: 'sesion', claseRuta: 'sesion', actor: etiqueta, objetivo: 'su propia cuenta', clase, ...x })
  }
  // GET /api/admin/cursos/[id]: la lista de inscritos del curso (todas las cuentas
  // de la BD están inscritas) no trae al personal, lo pida el admin o el secretario.
  const cursoInscritos = {}
  for (const actor of Object.keys(ACTORES)) {
    const x = await ejecutar({ rel: 'src/app/api/admin/cursos/[id]/route.ts', metodo: 'GET', actorId: ACTORES[actor], params: { id: CURSO }, conCuerpo: true })
    cursoInscritos[actor] = {
      status: x.status,
      error: x.error,
      alumnos: (x.cuerpo?.inscritos ?? []).map((i) => i.alumno_id).sort(),
      escrituras: x.escrituras,
    }
  }
  // Caso (4) del encargo: un alumno con el correo de alguien del personal. Las rutas
  // identifican por id: nunca llegan a la cuenta del personal por el correo.
  const correoDeB = (bd) => { bd.usuarios.find((u) => u.id === ID.alumnoX).email = 'b@qa.mx' }
  const caso4 = []
  for (const [etiqueta, rel, metodo, body, query, ajustarBd] of [
    ['datos: al alumno se le pone el correo del admin B', `${A}/datos/route.ts`, 'PATCH', { email: 'b@qa.mx' }, '', null],
    ['borrado definitivo del alumno que ya trae el correo del admin B', `${A}/route.ts`, 'DELETE', undefined, '?definitivo=true', correoDeB],
    ['reset-password del alumno que ya trae el correo del admin B', `${A}/reset-password/route.ts`, 'POST', { newPassword: 'secreta-nueva-123' }, '', correoDeB],
  ]) {
    const x = await ejecutar({ rel, metodo, actorId: ID.adminA, params: { id: ID.alumnoX }, body, query, ajustarBd })
    const tocadas = x.escrituras.flatMap((e) => [e.id, ...(e.ids ?? [])]).filter(Boolean)
    caso4.push({ caso: etiqueta, status: x.status, error: x.error, tocadas: [...new Set(tocadas)] })
  }
  return { raiz: RAIZ, rutas: RUTAS.map((r) => ({ n: r.n, q: r.q, c: r.c })), casos, cursoInscritos, caso4, metodosDesconocidos: metodosDesconocidos() }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  // Los console.log/info de las rutas van a stderr: stdout es solo el JSON.
  console.log = (...a) => console.error(...a)
  console.info = (...a) => console.error(...a)
  const r = await correrMatriz()
  process.stdout.write(JSON.stringify(r))
}
