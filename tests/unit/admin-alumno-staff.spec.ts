import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  MENSAJE_A_SI_MISMO, MENSAJE_NO_ENCONTRADO, MENSAJE_SIN_VERIFICAR, MENSAJE_SOLO_ALUMNOS,
  cargarAlumnoDeFila, cargarAlumnoObjetivo, esRolAlumno, mismaCuenta, uuidCanonico, veredictoObjetivoAlumno,
} from '@/lib/admin-alumno'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * #187 (Bugs 229/230) — las rutas de gestión de ALUMNOS solo tocan cuentas de
 * alumno. Sobre personal (admin o secretario) o sobre uno mismo → 403, con el
 * rol leído de la BD y ANTES de cualquier escritura u operación de Auth.
 *
 * Tres capas:
 *   1. la regla pura (lib/admin-alumno);
 *   2. la MATRIZ: los route.ts reales ejecutados en Node puro contra un
 *      Supabase falso (tests/arnes-rutas), ruta × actor × objetivo, con la
 *      bitácora de TODO lo que se escribió;
 *   3. guardianes de código: todo handler que escribe sobre un alumno (bajo
 *      /api/admin/alumnos/[id], y pagos, cobranza, cursos, inscripciones y
 *      documentos) llama a la guarda antes de su primera escritura o RPC.
 */

const RAIZ = process.cwd()
const leer = (p: string) => readFileSync(join(RAIZ, p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

// ── 1. La regla pura ─────────────────────────────────────────────────────────

test('1. esRolAlumno: solo «alumno» (con espacios o mayúsculas); null, personal y basura → no', () => {
  for (const r of ['alumno', 'ALUMNO', ' Alumno ']) expect(esRolAlumno(r), r).toBe(true)
  for (const r of ['admin', 'secretario', 'ADMIN', '', ' ', null, undefined, 0, {}, ['alumno'], 'alumnos', 'alumno-x']) {
    expect(esRolAlumno(r), JSON.stringify(r)).toBe(false)
  }
})

test('2. mismaCuenta: el mismo UUID en mayúsculas, con llaves o sin guiones es la misma cuenta', () => {
  for (const v of [A, A.toUpperCase(), `{${A}}`, A.replace(/-/g, ''), ` ${A} `, `{${A.toUpperCase().replace(/-/g, '')}}`]) {
    expect(mismaCuenta(A, v), v).toBe(true)
  }
  expect(mismaCuenta(A, B)).toBe(false)
  expect(mismaCuenta('', '')).toBe(false)
  expect(mismaCuenta(undefined, undefined)).toBe(false)
  expect(uuidCanonico(`{${A.toUpperCase()}}`)).toBe(A.replace(/-/g, ''))
})

test('3. veredicto: uno mismo → 403; personal → 403 (tenga o no fila en alumnos); sin cuenta o sin fila → 404; alumno → ok', () => {
  const alumno = { existeUsuario: true, rol: 'alumno', tieneFilaAlumno: true }
  expect(veredictoObjetivoAlumno(A, B, alumno)).toEqual({ ok: true })
  // uno mismo, aunque su rol fuera de alumno
  expect(veredictoObjetivoAlumno(A, A.toUpperCase(), alumno)).toEqual({ ok: false, status: 403, error: MENSAJE_A_SI_MISMO })
  for (const rol of ['admin', 'secretario', 'ADMIN', null, undefined, '']) {
    for (const tieneFilaAlumno of [true, false]) {
      expect(veredictoObjetivoAlumno(A, B, { existeUsuario: true, rol, tieneFilaAlumno }), `${rol}/${tieneFilaAlumno}`)
        .toEqual({ ok: false, status: 403, error: MENSAJE_SOLO_ALUMNOS })
    }
  }
  expect(veredictoObjetivoAlumno(A, B, { existeUsuario: false, rol: undefined, tieneFilaAlumno: false }))
    .toEqual({ ok: false, status: 404, error: MENSAJE_NO_ENCONTRADO })
  expect(veredictoObjetivoAlumno(A, B, { existeUsuario: true, rol: 'alumno', tieneFilaAlumno: false }))
    .toEqual({ ok: false, status: 404, error: MENSAJE_NO_ENCONTRADO })
  expect(veredictoObjetivoAlumno(A, B, { existeUsuario: false, rol: undefined, tieneFilaAlumno: true }))
    .toEqual({ ok: false, status: 404, error: MENSAJE_NO_ENCONTRADO })
})

// ── cargarAlumnoObjetivo con un cliente mínimo ────────────────────────────────

function clienteDe(respuestas: Record<string, { data: unknown; error: unknown }>) {
  const lecturas: string[] = []
  const cliente = {
    from(tabla: string) {
      const q = {
        select() { return q },
        eq() { return q },
        maybeSingle() { lecturas.push(tabla); return Promise.resolve(respuestas[tabla]) },
        update() { throw new Error('la guarda no escribe') },
        delete() { throw new Error('la guarda no escribe') },
      }
      return q
    },
    auth: { admin: new Proxy({}, { get() { throw new Error('la guarda no toca Auth') } }) },
  }
  return { cliente: cliente as unknown as SupabaseClient, lecturas }
}

test('4. cargarAlumnoObjetivo: lee usuarios y alumnos con el cliente dado, nunca escribe; devuelve el id DE LA BD', async () => {
  const { cliente, lecturas } = clienteDe({
    usuarios: { data: { id: B, email: 'b@x.mx', nombre: 'Be', apellidos: 'Ce', telefono: null, rol: 'alumno' }, error: null },
    alumnos: { data: { id: B }, error: null },
  })
  const r = await cargarAlumnoObjetivo(cliente, B.toUpperCase(), A)
  expect(r).toEqual({ ok: true, alumno: { id: B, email: 'b@x.mx', nombre: 'Be', apellidos: 'Ce', telefono: null } })
  expect(lecturas.sort()).toEqual(['alumnos', 'usuarios'])
})

test('5. cargarAlumnoObjetivo: uno mismo → 403 SIN leer; 22P02 → 404; otro error → 500 (falla cerrado)', async () => {
  const yo = clienteDe({})
  expect(await cargarAlumnoObjetivo(yo.cliente, A.toUpperCase(), A)).toEqual({ ok: false, status: 403, error: MENSAJE_A_SI_MISMO })
  expect(yo.lecturas).toEqual([])

  const noUuid = clienteDe({ usuarios: { data: null, error: { code: '22P02', message: 'invalid uuid' } }, alumnos: { data: null, error: { code: '22P02', message: 'x' } } })
  expect(await cargarAlumnoObjetivo(noUuid.cliente, 'no-es-uuid', A)).toEqual({ ok: false, status: 404, error: MENSAJE_NO_ENCONTRADO })

  const caida = clienteDe({ usuarios: { data: null, error: { code: '57014', message: 'timeout' } }, alumnos: { data: { id: B }, error: null } })
  expect(await cargarAlumnoObjetivo(caida.cliente, B, A)).toEqual({ ok: false, status: 500, error: MENSAJE_SIN_VERIFICAR })

  const personal = clienteDe({ usuarios: { data: { id: B, rol: 'admin' }, error: null }, alumnos: { data: { id: B }, error: null } })
  expect(await cargarAlumnoObjetivo(personal.cliente, B, A)).toEqual({ ok: false, status: 403, error: MENSAJE_SOLO_ALUMNOS })
})

test('5b. cargarAlumnoDeFila: sin fila o id no UUID → 404 con el mensaje de la fila; error → 500; con fila aplica la misma regla', async () => {
  const sinFila = clienteDe({ curso_inscripciones: { data: null, error: null } })
  expect(await cargarAlumnoDeFila(sinFila.cliente, 'curso_inscripciones', B, A, 'Inscripción no encontrada'))
    .toEqual({ ok: false, status: 404, error: 'Inscripción no encontrada' })
  const noUuid = clienteDe({ documentos_alumno: { data: null, error: { code: '22P02', message: 'x' } } })
  expect(await cargarAlumnoDeFila(noUuid.cliente, 'documentos_alumno', 'zz', A, 'Documento no encontrado'))
    .toEqual({ ok: false, status: 404, error: 'Documento no encontrado' })
  const caida = clienteDe({ curso_inscripciones: { data: null, error: { code: '57014', message: 'timeout' } } })
  expect(await cargarAlumnoDeFila(caida.cliente, 'curso_inscripciones', B, A, 'x'))
    .toEqual({ ok: false, status: 500, error: MENSAJE_SIN_VERIFICAR })
  // La fila es de uno mismo: 403 sin leer la cuenta.
  const propia = clienteDe({ curso_inscripciones: { data: { alumno_id: A.toUpperCase() }, error: null } })
  expect(await cargarAlumnoDeFila(propia.cliente, 'curso_inscripciones', B, A, 'x'))
    .toEqual({ ok: false, status: 403, error: MENSAJE_A_SI_MISMO })
  expect(propia.lecturas).toEqual(['curso_inscripciones'])
  // La fila es de personal: 403.
  const dePersonal = clienteDe({
    curso_inscripciones: { data: { alumno_id: B }, error: null },
    usuarios: { data: { id: B, rol: 'secretario' }, error: null },
    alumnos: { data: { id: B }, error: null },
  })
  expect(await cargarAlumnoDeFila(dePersonal.cliente, 'curso_inscripciones', 'fila', A, 'x'))
    .toEqual({ ok: false, status: 403, error: MENSAJE_SOLO_ALUMNOS })
})

// ── 2. La matriz con los route.ts reales ──────────────────────────────────────

type Escritura = { op: string; tabla?: string; ids?: string[]; id?: string; campos?: string[] }
type Caso = { ruta: string; quien: string; claseRuta: string; actor: string; objetivo: string; clase: string; status: number | string; error: string | null; escrituras: Escritura[] }
type Ruta = { n: string; q: string; c: string }

const [mayor, menor] = process.versions.node.split('.').map(Number)
const nodeSirve = mayor > 23 || (mayor === 23 && menor >= 6)

let matriz: { casos: Caso[]; rutas: Ruta[]; metodosDesconocidos: string[] } | null = null
function correrMatriz() {
  if (!matriz) {
    const salida = execFileSync(process.execPath, ['tests/arnes-rutas/matriz-187.mjs'], {
      cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    })
    matriz = JSON.parse(salida)
  }
  return matriz!
}

const RUTAS_ESPERADAS = [
  'DELETE [id] (desactivar)', 'DELETE [id]?definitivo=true', 'PUT [id] (activo)', 'PATCH [id] (contactado)', 'GET [id] (ficha)',
  'PATCH [id]/datos', 'POST [id]/reset-password', 'PATCH [id]/activar', 'PUT [id]/notas', 'PATCH [id]/inscripcion',
  'POST [id]/desbloquear-mes', 'POST [id]/cerrar-mes', 'POST [id]/corregir-plan',
  'POST /api/admin/pagos', 'POST /api/admin/cobranza/[alumnoId]', 'POST /api/admin/cursos/[id]/inscripciones',
  'DELETE /api/admin/cursos/[id]/inscripciones/[alumnoId]', 'PATCH /api/admin/documentos/[id]',
  'PATCH /api/admin/inscripciones/[id]', 'POST inscripciones/[id]/abrir-mes', 'POST inscripciones/[id]/abrir-todo',
  'POST inscripciones/[id]/activar', 'POST inscripciones/[id]/cerrar-mes', 'POST inscripciones/[id]/constancia',
  'POST inscripciones/[id]/pago', 'POST inscripciones/[id]/quitar-acceso-total', 'GET /api/admin/inscripciones/[id]',
  'PUT /api/admin/documentos/[id]/verificar',
]

/** Escrituras que de verdad tocaron algo (un update de 0 filas no cuenta). */
function efectivas(c: Caso): Escritura[] {
  return (c.escrituras ?? []).filter((e) => !(['update', 'delete', 'insert', 'upsert'].includes(e.op) && !(e.ids ?? []).length))
}

test.describe('matriz ruta × actor × objetivo (route.ts reales, Supabase falso)', () => {
  test.skip(!nodeSirve, `hace falta Node ≥ 23.6 (type stripping + module.registerHooks); hay ${process.versions.node}`)
  test.describe.configure({ mode: 'serial' })

  test('6. el arnés cubre las 28 rutas de gestión de alumnos × 2 actores × sus objetivos + register-complete', () => {
    const m = correrMatriz()
    expect(m.metodosDesconocidos).toEqual([])
    expect(m.rutas.map((r) => r.n)).toEqual(RUTAS_ESPERADAS)
    const porAlumno = m.rutas.filter((r) => r.c === 'alumno').length
    const porFila = m.rutas.filter((r) => r.c === 'fila').length
    expect([porAlumno, porFila]).toEqual([18, 10])
    // 10 objetivos por ruta de alumno (con las formas raras del UUID), 6 por ruta de fila.
    expect(m.casos.length).toBe(porAlumno * 2 * 10 + porFila * 2 * 6 + 3)
    expect(m.casos.filter((c) => c.status === 'EXCEPCION' || c.status === 'SIN-HANDLER')).toEqual([])
  })

  test('7. sobre PERSONAL o uno mismo: 403 en TODA ruta, las llame el admin o el secretario, y nada escrito ni en Auth', () => {
    const malos = correrMatriz().casos
      .filter((c) => c.clase === 'personal')
      .filter((c) => c.status !== 403 || efectivas(c).length > 0)
    expect(malos.map((c) => `${c.ruta} | ${c.actor} → ${c.objetivo} | ${c.status} | ${JSON.stringify(efectivas(c))}`)).toEqual([])
  })

  test('8. sobre un ALUMNO: quien tiene permiso pasa (2xx) y escribe; quien no, 403 sin escribir', () => {
    const casos = correrMatriz().casos.filter((c) => c.clase === 'alumno' && c.quien !== 'sesion')
    expect(casos.length).toBe(18 * 2 * 2 + 10 * 2)
    for (const c of casos) {
      const permitido = c.quien === 'staff' || c.actor === 'admin'
      if (permitido) {
        expect(typeof c.status === 'number' && c.status >= 200 && c.status < 300, `${c.ruta} | ${c.actor} → ${c.objetivo}: ${c.status} ${c.error}`).toBe(true)
        if (!c.ruta.startsWith('GET')) expect(efectivas(c).length, `${c.ruta} ${c.actor}`).toBeGreaterThan(0)
      } else {
        expect(c.status, `${c.ruta} | ${c.actor}`).toBe(403)
        expect(efectivas(c), `${c.ruta} | ${c.actor}`).toEqual([])
      }
    }
  })

  test('9. borrado definitivo de un alumno: borra alumnos, usuarios y Auth con el id DE LA BD (aunque llegue en MAYÚSCULAS)', () => {
    const casos = correrMatriz().casos.filter((c) => c.ruta === 'DELETE [id]?definitivo=true' && c.actor === 'admin' && c.clase === 'alumno')
    expect(casos.length).toBe(2)
    for (const c of casos) {
      expect(c.status, c.objetivo).toBe(200)
      const ops = efectivas(c)
      expect(ops.map((e) => `${e.op}:${e.tabla ?? ''}`), c.objetivo).toEqual(['delete:alumnos', 'delete:usuarios', 'auth.deleteUser:'])
      expect(ops.find((e) => e.op === 'auth.deleteUser')?.id, c.objetivo).toBe('eeeeeeee-0000-4000-8000-00000000000e')
    }
  })

  test('10. /datos y reset-password sobre un alumno: Auth recibe el id de la BD y solo los campos esperados', () => {
    const casos = correrMatriz().casos.filter((c) => c.actor === 'admin' && c.clase === 'alumno' && (c.ruta === 'PATCH [id]/datos' || c.ruta === 'POST [id]/reset-password'))
    expect(casos.length).toBe(4)
    for (const c of casos) {
      const auth = efectivas(c).filter((e) => e.op === 'auth.updateUserById')
      expect(auth.length, `${c.ruta} ${c.objetivo}`).toBe(1)
      expect(auth[0].id).toBe('eeeeeeee-0000-4000-8000-00000000000e')
      expect(auth[0].campos).toEqual(c.ruta === 'PATCH [id]/datos' ? ['email'] : ['password'])
    }
  })

  test('11. cuenta huérfana (rol alumno sin fila en alumnos): 404 (o 403 si el actor no tiene permiso), sin escribir', () => {
    for (const c of correrMatriz().casos.filter((x) => x.clase === 'huerfano')) {
      const permitido = c.quien === 'staff' || c.actor === 'admin'
      expect(c.status, `${c.ruta} ${c.actor}`).toBe(permitido ? 404 : 403)
      expect(efectivas(c)).toEqual([])
    }
  })

  test('12b. la lista de inscritos de un curso (GET cursos/[id]) no trae al personal, la pida el admin o el secretario', () => {
    const r = correrMatriz() as unknown as { cursoInscritos: Record<string, { status: number; alumnos: string[]; escrituras: Escritura[] }> }
    for (const actor of ['admin', 'secretario']) {
      const x = r.cursoInscritos[actor]
      expect(x.status, actor).toBe(200)
      // Todas las cuentas de la BD están inscritas: solo quedan las de rol alumno y
      // la fila de alumno SIN usuario (drift: no es personal, se sigue viendo).
      expect(x.alumnos, actor).toEqual([
        '66666666-0000-4000-8000-000000000006', '88888888-0000-4000-8000-000000000008',
        '99999999-0000-4000-8000-000000000009', 'eeeeeeee-0000-4000-8000-00000000000e',
      ])
      expect(x.escrituras, actor).toEqual([])
    }
  })

  test('12c. caso (4): un alumno con el correo de alguien del personal nunca lleva a la cuenta del personal', () => {
    const r = correrMatriz() as unknown as { caso4: { caso: string; status: number; tocadas: string[] }[] }
    expect(r.caso4.map((c) => [c.caso, c.status])).toEqual([
      ['datos: al alumno se le pone el correo del admin B', 409],
      ['borrado definitivo del alumno que ya trae el correo del admin B', 200],
      ['reset-password del alumno que ya trae el correo del admin B', 200],
    ])
    // Lo único que se toca es el alumno (por su id); el admin B, nunca.
    for (const c of r.caso4) expect(c.tocadas.every((id) => id === 'eeeeeeee-0000-4000-8000-00000000000e'), c.caso).toBe(true)
    expect(r.caso4[0].tocadas).toEqual([])
  })

  test('12. register-complete (#263): el personal NO se degrada a alumno; un alumno nuevo sí se registra', () => {
    const casos = correrMatriz().casos.filter((c) => c.ruta === 'POST /api/auth/register-complete')
    expect(casos.length).toBe(3)
    for (const c of casos) {
      if (c.clase === 'personal') {
        expect(c.status, c.actor).toBe(403)
        expect(efectivas(c), c.actor).toEqual([])
      } else {
        expect(c.status, c.actor).toBe(200)
        expect(efectivas(c).map((e) => `${e.op}:${e.tabla}`)).toEqual(expect.arrayContaining(['upsert:usuarios', 'insert:alumnos']))
      }
    }
  })
})

// ── 3. Guardianes de código ───────────────────────────────────────────────────

const DIR = 'src/app/api/admin/alumnos/[id]'
function rutasBajo(dir: string): string[] {
  const out: string[] = []
  for (const n of readdirSync(join(RAIZ, dir))) {
    const p = `${dir}/${n}`
    if (statSync(join(RAIZ, p)).isDirectory()) out.push(...rutasBajo(p))
    else if (n === 'route.ts') out.push(p)
  }
  return out.sort()
}

function handlers(fuente: string): Array<[string, string]> {
  const s = sinComentarios(fuente)
  const re = /export async function (GET|POST|PUT|PATCH|DELETE)\b/g
  const marcas = [...s.matchAll(re)].map((m) => [m[1], m.index!] as [string, number])
  return marcas.map(([nombre, i], k) => [nombre, s.slice(i, k + 1 < marcas.length ? marcas[k + 1][1] : undefined)])
}

const ESCRITURA = /\.(update|delete|insert|upsert|rpc)\(|auth\.admin\.|\.storage\./
const GUARDA = 'await cargarAlumnoObjetivo(admin, params.id, user.id)'
const GUARDA_CUALQUIERA = /await cargarAlumno(Objetivo|DeFila)\(/

/** Las rutas de gestión de alumnos FUERA de /api/admin/alumnos/[id]. */
const OTRAS = [
  'src/app/api/admin/pagos/route.ts',
  'src/app/api/admin/cobranza/[alumnoId]/route.ts',
  'src/app/api/admin/cursos/[id]/inscripciones/route.ts',
  'src/app/api/admin/cursos/[id]/inscripciones/[alumnoId]/route.ts',
  ...rutasBajo('src/app/api/admin/inscripciones/[id]'),
  'src/app/api/admin/documentos/[id]/route.ts',
  'src/app/api/admin/documentos/[id]/verificar/route.ts',
]

/**
 * La ÚNICA escritura que puede ir antes de la guarda: «Asignar a todos los
 * alumnos activos» (curso_inscribir_todos) no tiene un alumno objetivo; la
 * función elige a los alumnos en SQL. Queda como pendiente de la capa SQL.
 */
function primeraEscrituraGuardable(cuerpo: string): number {
  const sinMasiva = cuerpo.replace(/supabase\.rpc\('curso_inscribir_todos'/, "supabase.XXX('curso_inscribir_todos'")
  return sinMasiva.search(ESCRITURA)
}

test('13. guardián: TODO handler que escribe sobre un alumno llama a la guarda antes de su primera escritura o RPC', () => {
  const faltan: string[] = []
  let conGuarda = 0
  for (const archivo of [...rutasBajo(DIR), ...OTRAS]) {
    for (const [metodo, cuerpo] of handlers(leer(archivo))) {
      // Los GET solo leen (URLs firmadas, RPC de lectura); la ficha la cubre la prueba 14.
      if (metodo === 'GET') continue
      const primera = primeraEscrituraGuardable(cuerpo)
      if (primera < 0) continue
      const g = cuerpo.search(GUARDA_CUALQUIERA)
      if (g < 0 || g > primera) faltan.push(`${archivo} ${metodo}`)
      else {
        conGuarda++
        // y lo que no pasa la guarda sale antes de seguir
        expect(cuerpo.slice(g, g + 260), `${archivo} ${metodo}`).toContain('if (!objetivo.ok) return respuestaObjetivo(objetivo)')
      }
    }
  }
  expect(faltan).toEqual([])
  // 11 bajo alumnos/[id] (sin el GET de la ficha) + pagos, cobranza, cursos (2),
  // inscripciones (8) y documentos (2).
  expect(conGuarda).toBe(11 + 14)
})

test('13b. en todo el API, cualquier handler que reciba un alumno por id y escriba, está en el inventario guardado', () => {
  // Detector grueso: rutas que leen alumno_id del cuerpo o alumnoId del path y escriben.
  const sospechosas: string[] = []
  const todas = rutasBajo('src/app/api')
  const guardadas = new Set([...rutasBajo(DIR), ...OTRAS])
  for (const archivo of todas) {
    if (guardadas.has(archivo)) continue
    for (const [metodo, cuerpo] of handlers(leer(archivo))) {
      if (metodo === 'GET') continue
      const recibeAlumno = /params\.alumnoId|body\.alumno_id|\{\s*alumno_id\b[^}]*\}\s*=\s*body/.test(cuerpo)
      if (recibeAlumno && primeraEscrituraGuardable(cuerpo) >= 0) sospechosas.push(`${archivo} ${metodo}`)
    }
  }
  expect(sospechosas).toEqual([])
})

test('14. la ficha (GET [id]) también pasa por la guarda: el secretario no lee por ahí a un admin', () => {
  const get = handlers(leer(`${DIR}/route.ts`)).find(([m]) => m === 'GET')![1]
  const g = get.indexOf(GUARDA)
  expect(g).toBeGreaterThan(0)
  expect(g).toBeLessThan(get.indexOf(".from('alumnos')"))
})

test('14b. la vista de una inscripción (GET inscripciones/[id]) pasa por la guarda ANTES de leer el nombre y el correo', () => {
  const get = handlers(leer('src/app/api/admin/inscripciones/[id]/route.ts')).find(([m]) => m === 'GET')![1]
  const g = get.indexOf("await cargarAlumnoDeFila(admin, 'curso_inscripciones', params.id, user.id,")
  expect(g).toBeGreaterThan(0)
  expect(get.slice(g, g + 260)).toContain('if (!objetivo.ok) return respuestaObjetivo(objetivo)')
  expect(g).toBeLessThan(get.indexOf(".from('usuarios')"))
})

test('15. después de la guarda las escrituras usan el id DE LA BD, no el que llegó', () => {
  for (const archivo of [...rutasBajo(DIR), 'src/app/api/admin/documentos/[id]/route.ts']) {
    for (const [metodo, cuerpo] of handlers(leer(archivo))) {
      const g = cuerpo.indexOf(GUARDA)
      if (g < 0) continue
      const despues = cuerpo.slice(g + GUARDA.length)
      // En las escrituras y en Auth ya no aparece params.id (la ficha GET solo lee).
      if (metodo !== 'GET') expect(despues, `${archivo} ${metodo}`).not.toContain('params.id')
    }
  }
  for (const archivo of ['src/app/api/admin/cobranza/[alumnoId]/route.ts', 'src/app/api/admin/cursos/[id]/inscripciones/[alumnoId]/route.ts']) {
    const cuerpo = handlers(leer(archivo)).find(([m]) => m !== 'GET')![1]
    const g = cuerpo.indexOf('await cargarAlumnoObjetivo(admin, params.alumnoId, user.id)')
    expect(g, archivo).toBeGreaterThan(0)
    expect(cuerpo.slice(g + 60), archivo).not.toContain('params.alumnoId')
  }
  const pagos = handlers(leer('src/app/api/admin/pagos/route.ts')).find(([m]) => m === 'POST')![1]
  expect(pagos).toContain('alumno_id: objetivo.alumno.id,')
  const cursos = handlers(leer('src/app/api/admin/cursos/[id]/inscripciones/route.ts')).find(([m]) => m === 'POST')![1]
  expect(cursos).toContain('p_alumno_id: objetivo.alumno.id,')
})

test('16. register-complete lee el rol de la sesión y corta con 403 ANTES del upsert que pone rol alumno', () => {
  const r = sinComentarios(leer('src/app/api/auth/register-complete/route.ts'))
  const lee = r.indexOf(".from('usuarios')\n      .select('rol')")
  const corta = r.indexOf('!esRolAlumno(')
  const upsert = r.indexOf(".upsert(\n        { id: user.id, email: user.email, nombre, apellidos, telefono, rol: 'alumno' }")
  expect(lee).toBeGreaterThan(0)
  expect(corta).toBeGreaterThan(lee)
  expect(upsert).toBeGreaterThan(corta)
  expect(r.slice(corta, corta + 200)).toContain('status: 403')
})

test('17. la lista de alumnos no incluye personal (en sus TRES intentos), el contador de pendientes tampoco, y la ficha muestra el motivo', () => {
  const lista = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  const get = lista.slice(lista.indexOf('export async function GET'))
  expect(get).toMatch(/usuarios!inner\([^)]*\brol\b[^)]*\)/)
  expect(get).toContain('esRolAlumno(u?.rol)')
  expect(get.indexOf('const soloAlumnos')).toBeLessThan(get.indexOf('const result = soloAlumnos.map('))
  // intento 2 (esquema antiguo) y fallback
  expect(get).toMatch(/usuarios!alumnos_usuario_id_fkey\([^)]*\brol\b[^)]*\)/)
  expect(get).toContain('return !u || esRolAlumno(u.rol)')
  expect(get).toContain(".select('nombre, apellidos, email, foto_url, telefono, rol')")
  expect(get).toContain('if (u && !esRolAlumno((u as { rol?: unknown }).rol)) continue')
  const pendientes = sinComentarios(leer('src/app/api/admin/alumnos/pendientes-count/route.ts'))
  expect(pendientes).toContain(".select('id, usuarios!inner(rol)', { count: 'exact', head: true })")
  // sin distinguir mayúsculas (como esRolAlumno) y, si el embed falla, el conteo de antes en vez de 0
  expect(pendientes).toContain(".ilike('usuarios.rol', 'alumno')")
  expect(pendientes).not.toContain(".eq('usuarios.rol'")
  const respaldo = pendientes.slice(pendientes.indexOf('if (error) {'))
  expect(respaldo).toContain(".select('id', { count: 'exact', head: true })")
  expect(respaldo).toContain('return NextResponse.json({ count: previo.count ?? 0 })')
  const cursoGet = handlers(leer('src/app/api/admin/cursos/[id]/route.ts')).find(([m]) => m === 'GET')![1]
  expect(cursoGet).toContain(".select('id, nombre, apellidos, email, rol')")
  expect(cursoGet).toContain('.filter(i => !esPersonal(i.alumno_id))')
  const ficha = leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx')
  expect(ficha).toContain("typeof motivo?.error === 'string' ? motivo.error : 'Alumno no encontrado'")
})
