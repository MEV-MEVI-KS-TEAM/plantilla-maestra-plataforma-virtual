/**
 * Matriz de #187: cada ruta de gestión de alumnos × actor (admin, secretario) ×
 * cuenta objetivo, ejecutando los route.ts REALES contra el Supabase falso.
 *
 *   node tests/arnes-rutas/matriz-187.mjs            → JSON con cada caso
 *   ARNES_RAIZ=<otro árbol> node …/matriz-187.mjs     → la misma matriz sobre otro código
 *
 * Por cada caso devuelve el status, el error y TODAS las escrituras y
 * operaciones de Auth que hizo la ruta (la bitácora del Supabase falso).
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

function bdInicial() {
  const u = (id, rol, email) => ({ id, rol, email, nombre: `Nombre ${email}`, apellidos: 'Prueba', telefono: '5500000000' })
  const alumno = (id) => ({
    id, matricula: `QA-${id.slice(0, 4)}`, nivel: 'secundaria', modalidad: '3_meses', carrera: null,
    meses_desbloqueados: 1, activo: true, inscripcion_pagada: false, contactado_whatsapp: false,
    created_at: '2026-09-01T00:00:00Z',
  })
  return {
    usuarios: [
      u(ID.adminA, 'admin', 'a@qa.mx'), u(ID.adminB, 'admin', 'b@qa.mx'),
      u(ID.secretarioS, 'secretario', 's@qa.mx'), u(ID.secretarioT, 'secretario', 't@qa.mx'),
      u(ID.alumnoX, 'alumno', 'x@qa.mx'), u(ID.adminConFila, 'admin', 'h@qa.mx'),
      u(ID.huerfano, 'alumno', 'o@qa.mx'), u(ID.alumnoNuevo, 'alumno', 'n@qa.mx'),
    ],
    // El admin «con fila» es el drift: ascendido desde alumno, o una fila fabricada por PostgREST.
    alumnos: [alumno(ID.alumnoX), alumno(ID.adminConFila)],
    site_config: [],
  }
}

function cuentasAuth(bd) {
  return bd.usuarios.map((u) => ({ id: u.id, email: u.email }))
}

const RPC = {
  alumno_mover_mes: (args) => ({
    data: [{ meses_antes: 1, meses_ahora: args.p_accion === 'abrir' ? 2 : 0, mes_movido: args.p_accion === 'abrir' ? 2 : 1,
      repetido: false, quien: 'QA', quien_rol: 'admin', cuando: '2026-09-30T00:00:00Z' }],
    error: null,
  }),
  corregir_plan_estudio: () => ({ data: { ok: true, matricula: 'QA-0001', notas_borradas: 0 }, error: null }),
  candado_corregir_plan: () => ({ data: null, error: null }),
}

const A = 'src/app/api/admin/alumnos/[id]'
/** [nombre, archivo, método, query, cuerpo, quién puede (admin | staff)] */
export const RUTAS = [
  ['DELETE [id] (desactivar)', `${A}/route.ts`, 'DELETE', '', null, 'admin'],
  ['DELETE [id]?definitivo=true', `${A}/route.ts`, 'DELETE', '?definitivo=true', null, 'admin'],
  ['PUT [id] (activo)', `${A}/route.ts`, 'PUT', '', { activo: false }, 'admin'],
  ['PATCH [id] (contactado)', `${A}/route.ts`, 'PATCH', '', { contactado_whatsapp: true }, 'staff'],
  ['GET [id] (ficha)', `${A}/route.ts`, 'GET', '', null, 'staff'],
  ['PATCH [id]/datos', `${A}/datos/route.ts`, 'PATCH', '', { nombre: 'Cambiado', email: 'nuevo-correo@qa.mx' }, 'admin'],
  ['POST [id]/reset-password', `${A}/reset-password/route.ts`, 'POST', '', { newPassword: 'secreta-nueva-123' }, 'admin'],
  ['PATCH [id]/activar', `${A}/activar/route.ts`, 'PATCH', '', { activo: true }, 'admin'],
  ['PUT [id]/notas', `${A}/notas/route.ts`, 'PUT', '', { notas: 'nota de QA' }, 'admin'],
  ['PATCH [id]/inscripcion', `${A}/inscripcion/route.ts`, 'PATCH', '', {}, 'admin'],
  ['POST [id]/desbloquear-mes', `${A}/desbloquear-mes/route.ts`, 'POST', '', {}, 'staff'],
  ['POST [id]/cerrar-mes', `${A}/cerrar-mes/route.ts`, 'POST', '', {}, 'staff'],
  ['POST [id]/corregir-plan', `${A}/corregir-plan/route.ts`, 'POST', '', { nivel: 'secundaria', modalidad: '6_meses' }, 'admin'],
]

const ACTORES = { admin: ID.adminA, secretario: ID.secretarioS }

/** Los objetivos: [etiqueta, id (como llega en el path), clase esperada] */
function objetivosDe(actor) {
  const yo = ACTORES[actor]
  return [
    ['alumno', ID.alumnoX, 'alumno'],
    ['alumno (UUID en MAYÚSCULAS)', ID.alumnoX.toUpperCase(), 'alumno'],
    ['admin B', ID.adminB, 'personal'],
    ['secretario T', ID.secretarioT, 'personal'],
    ['admin con fila en alumnos', ID.adminConFila, 'personal'],
    ['admin B (UUID en MAYÚSCULAS)', ID.adminB.toUpperCase(), 'personal'],
    ['él mismo', yo, 'personal'],
    ['él mismo (UUID en MAYÚSCULAS)', yo.toUpperCase(), 'personal'],
    ['él mismo ({llaves} sin guiones)', `{${yo.replace(/-/g, '')}}`, 'personal'],
    ['cuenta huérfana (alumno sin fila)', ID.huerfano, 'huerfano'],
  ]
}

const cache = new Map()
async function modulo(rel) {
  const url = pathToFileURL(path.join(RAIZ, rel)).href
  if (!cache.has(url)) cache.set(url, await import(url))
  return cache.get(url)
}

const ESCRITURAS = new Set(['update', 'delete', 'insert', 'upsert', 'rpc', 'auth.updateUserById', 'auth.deleteUser', 'auth.createUser', 'storage.remove', 'storage.upload'])

async function ejecutar({ rel, metodo, query, cuerpo, actorId, idPath }) {
  const bd = bdInicial()
  const esc = crearEscenario({ bd, auth: cuentasAuth(bd), actorId, rpc: RPC })
  globalThis.__arnes = esc
  const mod = await modulo(rel)
  const handler = mod[metodo]
  if (typeof handler !== 'function') return { status: 'SIN-HANDLER' }
  const url = `http://localhost/api/x/${encodeURIComponent(idPath)}${query}`
  const init = { method: metodo }
  if (cuerpo !== null && metodo !== 'GET') {
    init.body = JSON.stringify(cuerpo)
    init.headers = { 'content-type': 'application/json' }
  }
  let res
  try {
    res = await handler(new NextRequest(url, init), { params: { id: idPath } })
  } catch (e) {
    return { status: 'EXCEPCION', error: String(e?.message ?? e), escrituras: esc.bitacora.filter((b) => ESCRITURAS.has(b.op)) }
  }
  let json = null
  try { json = await res.json() } catch { /* sin cuerpo */ }
  return {
    status: res.status,
    error: json && typeof json.error === 'string' ? json.error : null,
    escrituras: esc.bitacora.filter((b) => ESCRITURAS.has(b.op)),
  }
}

export async function correrMatriz() {
  const casos = []
  for (const [nombre, rel, metodo, query, cuerpo, quien] of RUTAS) {
    for (const actor of Object.keys(ACTORES)) {
      for (const [etiqueta, idPath, clase] of objetivosDe(actor)) {
        const r = await ejecutar({ rel, metodo, query, cuerpo, actorId: ACTORES[actor], idPath })
        casos.push({ ruta: nombre, quien, actor, objetivo: etiqueta, clase, ...r })
      }
    }
  }
  // register-complete: la sesión ES el objetivo (#263).
  for (const [etiqueta, actorId, clase] of [
    ['admin se registra como alumno', ID.adminA, 'personal'],
    ['secretario se registra como alumno', ID.secretarioS, 'personal'],
    ['alumno nuevo (fila del trigger, sin alumnos)', ID.alumnoNuevo, 'alumno'],
  ]) {
    const r = await ejecutar({
      rel: 'src/app/api/auth/register-complete/route.ts', metodo: 'POST', query: '',
      cuerpo: { nombre: 'QA', apellidos: 'Registro', telefono: '5511111111', nivel: 'secundaria', modalidad: '3_meses' },
      actorId, idPath: actorId,
    })
    casos.push({ ruta: 'POST /api/auth/register-complete', quien: 'sesion', actor: etiqueta, objetivo: 'su propia cuenta', clase, ...r })
  }
  return { raiz: RAIZ, casos, metodosDesconocidos: metodosDesconocidos() }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  // Los console.log/info de las rutas van a stderr: stdout es solo el JSON.
  console.log = (...a) => console.error(...a)
  console.info = (...a) => console.error(...a)
  const r = await correrMatriz()
  process.stdout.write(JSON.stringify(r))
}
