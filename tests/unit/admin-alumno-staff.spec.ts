import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  MENSAJE_A_SI_MISMO, MENSAJE_NO_ENCONTRADO, MENSAJE_SIN_VERIFICAR, MENSAJE_SOLO_ALUMNOS,
  cargarAlumnoObjetivo, esRolAlumno, mismaCuenta, uuidCanonico, veredictoObjetivoAlumno,
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
 *   3. guardianes de código: todo handler que escribe bajo /api/admin/alumnos/[id]
 *      llama a la guarda antes de su primera escritura.
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

// ── 2. La matriz con los route.ts reales ──────────────────────────────────────

type Escritura = { op: string; tabla?: string; ids?: string[]; id?: string; campos?: string[] }
type Caso = { ruta: string; quien: string; actor: string; objetivo: string; clase: string; status: number | string; error: string | null; escrituras: Escritura[] }

const [mayor, menor] = process.versions.node.split('.').map(Number)
const nodeSirve = mayor > 23 || (mayor === 23 && menor >= 6)

let matriz: { casos: Caso[]; metodosDesconocidos: string[] } | null = null
function correrMatriz() {
  if (!matriz) {
    const salida = execFileSync(process.execPath, ['tests/arnes-rutas/matriz-187.mjs'], {
      cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    })
    matriz = JSON.parse(salida)
  }
  return matriz!
}

/** Escrituras que de verdad tocaron algo (un update de 0 filas no cuenta). */
function efectivas(c: Caso): Escritura[] {
  return (c.escrituras ?? []).filter((e) => !(['update', 'delete', 'insert', 'upsert'].includes(e.op) && !(e.ids ?? []).length))
}

test.describe('matriz ruta × actor × objetivo (route.ts reales, Supabase falso)', () => {
  test.skip(!nodeSirve, `hace falta Node ≥ 23.6 (type stripping + module.registerHooks); hay ${process.versions.node}`)
  test.describe.configure({ mode: 'serial' })

  test('6. el arnés cubre las 13 rutas × 2 actores × 10 objetivos + register-complete, sin métodos desconocidos', () => {
    const m = correrMatriz()
    expect(m.metodosDesconocidos).toEqual([])
    expect(m.casos.length).toBe(13 * 2 * 10 + 3)
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
    expect(casos.length).toBe(13 * 2 * 2)
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

test('13. guardián: TODO handler que escribe bajo /api/admin/alumnos/[id] llama a la guarda antes de su primera escritura', () => {
  const faltan: string[] = []
  let conGuarda = 0
  for (const archivo of rutasBajo(DIR)) {
    for (const [metodo, cuerpo] of handlers(leer(archivo))) {
      const primera = cuerpo.search(ESCRITURA)
      if (primera < 0) continue
      const g = cuerpo.indexOf(GUARDA)
      if (g < 0 || g > primera) faltan.push(`${archivo} ${metodo}`)
      else {
        conGuarda++
        // y lo que no pasa la guarda sale antes de seguir
        expect(cuerpo.slice(g, g + 200), `${archivo} ${metodo}`).toContain('if (!objetivo.ok) return respuestaObjetivo(objetivo)')
      }
    }
  }
  expect(faltan).toEqual([])
  expect(conGuarda).toBe(12)
})

test('14. la ficha (GET [id]) también pasa por la guarda: el secretario no lee por ahí a un admin', () => {
  const get = handlers(leer(`${DIR}/route.ts`)).find(([m]) => m === 'GET')![1]
  const g = get.indexOf(GUARDA)
  expect(g).toBeGreaterThan(0)
  expect(g).toBeLessThan(get.indexOf(".from('alumnos')"))
})

test('15. después de la guarda las escrituras usan el id DE LA BD, no el del path', () => {
  for (const archivo of rutasBajo(DIR)) {
    for (const [metodo, cuerpo] of handlers(leer(archivo))) {
      const g = cuerpo.indexOf(GUARDA)
      if (g < 0) continue
      const despues = cuerpo.slice(g + GUARDA.length)
      // En las escrituras y en Auth ya no aparece params.id (la ficha GET solo lee).
      if (metodo !== 'GET') expect(despues, `${archivo} ${metodo}`).not.toContain('params.id')
    }
  }
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

test('17. la lista de alumnos no incluye personal y la ficha muestra el motivo del servidor', () => {
  const lista = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  const get = lista.slice(lista.indexOf('export async function GET'))
  expect(get).toMatch(/usuarios!inner\([^)]*\brol\b[^)]*\)/)
  expect(get).toContain('esRolAlumno(u?.rol)')
  expect(get.indexOf('const soloAlumnos')).toBeLessThan(get.indexOf('const result = soloAlumnos.map('))
  const ficha = leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx')
  expect(ficha).toContain("typeof motivo?.error === 'string' ? motivo.error : 'Alumno no encontrado'")
})
