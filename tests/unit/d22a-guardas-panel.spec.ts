import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { SECCIONES_PANEL, INICIO_SECRETARIO, destinoSinPermiso, type SeccionPanel } from '@/lib/permisos-panel'

/**
 * Bloque D · D22a — el secretario ya no abre por URL lo que no es suyo.
 *
 * Dos guardianes que fallan con cualquier ruta NUEVA sin clasificar:
 *  - PÁGINAS: toda page.tsx de /admin cae en una sección de SECCIONES_PANEL, y
 *    las de nivel 'admin' tienen su guarda de servidor (exigirSeccion).
 *  - API: la tabla de abajo lista los 102 handlers de /api/admin con su nivel, y
 *    cada uno lo revisa en su cuerpo (verifyAdmin/verifyStaff/…, o la función
 *    SQL con es_staff() llamada con la sesión).
 */
const raiz = process.cwd()
const leer = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const ADMIN_DIR = join('src', 'app', '(dashboard)', 'admin')
const recorrer = (dir: string, archivo: string): string[] => readdirSync(join(raiz, dir), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? recorrer(join(dir, e.name), archivo) : e.name === archivo ? [join(dir, e.name)] : [])

test('1. destinoSinPermiso: admin pasa a todo; secretario solo a lo de staff; lo demás fuera', () => {
  for (const r of ['admin', 'ADMIN', ' Admin ']) {
    expect(destinoSinPermiso('admin', r)).toBeNull()
    expect(destinoSinPermiso('staff', r)).toBeNull()
  }
  for (const r of ['secretario', 'SECRETARIO']) {
    expect(destinoSinPermiso('staff', r)).toBeNull()
    expect(destinoSinPermiso('admin', r)).toBe(INICIO_SECRETARIO)
  }
  expect(INICIO_SECRETARIO).toBe('/admin/alumnos')
  expect(destinoSinPermiso('staff', 'alumno')).toBe('/alumno')
  for (const r of [null, undefined, '', 'tutor']) expect(destinoSinPermiso('staff', r)).toBe('/login')
})

test('2. la tabla de secciones fija las decisiones de Kevin (D22)', () => {
  const esperado: Record<string, 'admin' | 'staff'> = {
    '/admin': 'admin', '/admin/alumnos': 'staff', '/admin/estado-cuenta': 'staff', '/admin/pagos': 'staff',
    '/admin/cobranza': 'staff', '/admin/cursos': 'staff', '/admin/cursos/nuevo': 'admin', '/admin/contenido': 'admin',
    '/admin/documentos': 'admin', '/admin/reportes': 'admin', '/admin/usuarios': 'admin', '/admin/configuracion': 'admin',
  }
  expect(SECCIONES_PANEL).toEqual(esperado)
})

test('3. guardián de PÁGINAS: cada página cae en una sección y las de admin tienen su guarda de servidor', () => {
  const paginas = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'].flatMap(n => recorrer(ADMIN_DIR, n))
  expect(paginas.length).toBeGreaterThanOrEqual(15)
  const secciones = Object.keys(SECCIONES_PANEL) as SeccionPanel[]
  for (const p of paginas) {
    const dir = relative(ADMIN_DIR, join(p, '..')).split(sep).filter(Boolean)
    const ruta = '/admin' + (dir.length ? '/' + dir.join('/') : '')
    const seccion = secciones.filter(s => ruta === s || ruta.startsWith(s + '/')).sort((a, b) => b.length - a.length)[0]
    expect(seccion, `${ruta}: sin sección en SECCIONES_PANEL`).toBeTruthy()
    // Solo el Dashboard cae en '/admin': una sección nueva tiene que declararse en la tabla.
    if (seccion === '/admin') expect(ruta, `${ruta}: declara su sección en SECCIONES_PANEL`).toBe('/admin')
    if (SECCIONES_PANEL[seccion] !== 'admin') continue
    // La guarda: en la página o en un layout entre la carpeta de la sección y la de la página.
    const baseSeccion = seccion.split('/').slice(2)
    const candidatos = [p]
    for (let i = dir.length; i >= baseSeccion.length; i--) {
      const l = join(ADMIN_DIR, ...dir.slice(0, i), 'layout.tsx')
      if (existsSync(join(raiz, l))) candidatos.push(l)
    }
    const guardado = candidatos.some(c => {
      const t = sinComentarios(readFileSync(join(raiz, c), 'utf8'))
      return t.includes(`await exigirSeccion('${seccion}')`)
        // /admin/cursos/nuevo conserva su guarda de D7b (devuelve a la lista de cursos).
        || (seccion === '/admin/cursos/nuevo' && t.includes("!== 'admin') redirect('/admin/cursos')"))
    })
    expect(guardado, `${ruta} (sección ${seccion}, nivel admin) sin guarda de servidor`).toBe(true)
  }
})

test('4. el Dashboard revisa el rol ANTES de leer con service role; los 5 layouts nuevos', () => {
  const dash = sinComentarios(leer(ADMIN_DIR, 'page.tsx'))
  const cuerpo = dash.slice(dash.indexOf('export default async function AdminDashboardPage()'))
  expect(cuerpo.indexOf("await exigirSeccion('/admin')")).toBeGreaterThan(0)
  expect(cuerpo.indexOf("await exigirSeccion('/admin')")).toBeLessThan(cuerpo.indexOf('getServiceClient()'))
  for (const s of ['configuracion', 'contenido', 'documentos', 'reportes', 'usuarios']) {
    const l = sinComentarios(leer(ADMIN_DIR, s, 'layout.tsx'))
    expect(l, s).toContain(`await exigirSeccion('/admin/${s}')`)
    expect(l, s).toContain('return <>{children}</>')
  }
  // El layout de /admin no se toca: sigue dejando pasar a todo el personal.
  expect(leer(ADMIN_DIR, 'layout.tsx')).not.toContain('exigirSeccion')
})

// ─── Guardián de API ───────────────────────────────────────────────────────────
// 'mixto': entra el personal y, en el MISMO handler, algunas acciones piden además
// verifyAdmin (D22b: en cobranza solo «pagar» es de todo el personal). La regla
// fina de qué acción pide qué la fija d22b-cobranza-solo-admin.spec.ts.
type Nivel = 'admin' | 'staff' | 'mixto' | `rpc:${string}`
const A = 'admin' as const, S = 'staff' as const, M = 'mixto' as const
const API: Record<string, Nivel> = {
  'alumnos/[id]/activar PATCH': A, 'alumnos/[id]/avance GET': S, 'alumnos/[id]/cerrar-mes POST': S,
  'alumnos/[id]/corregir-plan POST': A, 'alumnos/[id]/cursos GET': S, 'alumnos/[id]/datos PATCH': A,
  'alumnos/[id]/desbloquear-mes POST': S, 'alumnos/[id]/inscripcion PATCH': A, 'alumnos/[id]/notas PUT': A,
  'alumnos/[id]/pagos GET': S, 'alumnos/[id]/reset-password POST': A,
  'alumnos/[id] GET': S, 'alumnos/[id] PUT': A, 'alumnos/[id] PATCH': S, 'alumnos/[id] DELETE': A,
  'alumnos/pendientes-count GET': S, 'alumnos GET': S, 'alumnos POST': S,
  'cambiar-password POST': S,                       // D22a (decisión 6): cada quien la suya
  'cobranza/[alumnoId] GET': S, 'cobranza/[alumnoId] POST': M, 'cobranza GET': S,   // D22b
  'configuracion/logo POST': A, 'configuracion/logo DELETE': A,
  'configuracion GET': A,                            // D22a: antes staff (solo lectura)
  'configuracion PUT': A, 'configuracion DELETE': A,
  'contenido/[id] GET': A, 'contenido/orden PATCH': A, 'contenido GET': A,
  'cursos/[id]/examen/preguntas/[preguntaId] PATCH': A, 'cursos/[id]/examen/preguntas/[preguntaId] DELETE': A,
  'cursos/[id]/examen/preguntas GET': A, 'cursos/[id]/examen/preguntas POST': A,
  'cursos/[id]/examen/resultados GET': A,           // decisión 7
  'cursos/[id]/inscripciones/[alumnoId] DELETE': A,
  'cursos/[id]/inscripciones GET': S, 'cursos/[id]/inscripciones POST': S,
  'cursos/[id]/lecciones/[leccionId]/material POST': A, 'cursos/[id]/lecciones/[leccionId]/material DELETE': A,
  'cursos/[id]/lecciones/[leccionId] PATCH': A, 'cursos/[id]/lecciones/[leccionId] DELETE': A,
  'cursos/[id]/lecciones POST': A,
  'cursos/[id]/modulos/[moduloId] PATCH': A, 'cursos/[id]/modulos/[moduloId] DELETE': A, 'cursos/[id]/modulos POST': A,
  'cursos/[id]/portada POST': A, 'cursos/[id]/portada DELETE': A,
  'cursos/[id] GET': S, 'cursos/[id] PATCH': A, 'cursos/[id] DELETE': A,
  'cursos GET': S, 'cursos POST': A,
  'documentos/[id] GET': A, 'documentos/[id] PATCH': A, 'documentos/[id]/verificar PUT': A, 'documentos GET': A,
  'estado-cuenta GET': S,
  'evaluaciones/[id]/preguntas GET': A, 'evaluaciones/[id]/preguntas POST': A,
  'evaluaciones/[id] PATCH': A, 'evaluaciones/[id] DELETE': A,
  'inscripciones/[id]/abrir-mes POST': 'rpc:curso_abrir_mes',
  'inscripciones/[id]/abrir-todo POST': 'rpc:curso_abrir_todo',
  'inscripciones/[id]/activar POST': 'rpc:curso_activar_segun_ficha',
  'inscripciones/[id]/cerrar-mes POST': 'rpc:curso_cerrar_mes',
  'inscripciones/[id]/quitar-acceso-total POST': 'rpc:curso_quitar_acceso_total',
  'inscripciones/[id]/constancia POST': S, 'inscripciones/[id]/pago POST': S,
  'inscripciones/[id] GET': S, 'inscripciones/[id] PATCH': A,
  'materias/[id] PATCH': A, 'materias/[id] DELETE': A, 'materias POST': A,
  'meses/[id]/evaluaciones GET': A, 'meses/[id]/evaluaciones POST': A,
  'meses/[id] PATCH': A, 'meses/[id] DELETE': A, 'meses POST': A,
  'pagos/[id]/recibo GET': S, 'pagos/[id] DELETE': A, 'pagos GET': S, 'pagos POST': S,
  'planes GET': A,
  'preguntas/[id] PATCH': A, 'preguntas/[id] DELETE': A, 'quiz/[id] PATCH': A, 'quiz/[id] DELETE': A,
  'reportes/excel GET': A, 'reportes/export GET': A, 'reportes GET': A,
  'semanas/[id]/materiales/[materialId] DELETE': A,
  'semanas/[id]/materiales GET': A, 'semanas/[id]/materiales POST': A,
  'semanas/[id]/quiz GET': A, 'semanas/[id]/quiz POST': A,
  'semanas/[id] PATCH': A, 'semanas/[id] DELETE': A, 'semanas POST': A,
  'stats GET': A, 'usuarios GET': A, 'usuarios POST': A,
}
const T_ADMIN = ['verifyAdmin(', 'authAdmin(', 'autorizar(true)', 'autorizarAdmin(', "?.toUpperCase() !== 'ADMIN'"]
const T_STAFF = ['verifyStaff(', 'autorizar(false)', "viewerRol !== 'ADMIN' && viewerRol !== 'SECRETARIO'", 'reglaPatchAlumno(']

function handlers(): Map<string, string> {
  const out = new Map<string, string>()
  const base = join('src', 'app', 'api', 'admin')
  for (const f of recorrer(base, 'route.ts')) {
    const s = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    const ruta = relative(base, join(f, '..')).split(sep).join('/') || '.'
    const idx = [...s.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g)].map(m => [m[1], m.index ?? 0] as const)
    idx.forEach(([met, i], k) => out.set(`${ruta} ${met}`, s.slice(i, k + 1 < idx.length ? idx[k + 1][1] : s.length)))
  }
  return out
}

test('5. guardián de API: los 102 handlers están en la tabla, y cada uno revisa el rol que dice', () => {
  // Solo se admite la forma que el guardián sabe leer: `export async function MÉTODO`.
  const base = join('src', 'app', 'api', 'admin')
  for (const n of ['route.js', 'route.tsx', 'route.jsx']) expect(recorrer(base, n), n).toEqual([])
  for (const f of recorrer(base, 'route.ts')) {
    const s = sinComentarios(readFileSync(join(raiz, f), 'utf8'))
    // Lista blanca: cualquier otra forma (export const { GET }, export *, export { GET },
    // export function sin async, HEAD/OPTIONS, espacios raros) hace fallar la prueba.
    // (Por línea: la palabra «export» también sale en cadenas, p. ej. '/api/admin/reportes/export'.)
    for (const m of s.matchAll(/^[ \t]*export\b.*$/gm)) {
      expect(m[0].trim(), `${f}: export que el guardián no sabe leer`).toMatch(
        /^export async function (GET|POST|PUT|PATCH|DELETE)\b|^export const (dynamic|runtime|revalidate|maxDuration|fetchCache|preferredRegion)\b/)
    }
  }
  const h = handlers()
  expect([...h.keys()].sort()).toEqual(Object.keys(API).sort())
  expect(h.size).toBe(102)
  for (const [clave, cuerpo] of h) {
    const nivel = API[clave]
    const adm = T_ADMIN.some(t => cuerpo.includes(t)), stf = T_STAFF.some(t => cuerpo.includes(t))
    if (nivel === 'admin') expect(adm && !stf, `${clave}: debería revisar ADMIN`).toBe(true)
    else if (nivel === 'staff') expect(stf && !adm, `${clave}: debería revisar staff`).toBe(true)
    else if (nivel === 'mixto') expect(stf && adm, `${clave}: debería revisar staff Y, por acción, ADMIN`).toBe(true)
    else {
      // La función SQL decide, llamada con la SESIÓN (no con el service role).
      const fn = nivel.slice(4)
      expect(cuerpo, clave).toContain(`await supabase.rpc('${fn}'`)
      expect(cuerpo, clave).not.toContain(`admin.rpc('${fn}'`)
    }
  }
})

test('6. las funciones SQL de esas cinco rutas revisan es_staff() en su definición VIGENTE', () => {
  const mig = join('supabase', 'migrations')
  const archivos = readdirSync(join(raiz, mig)).filter(f => f.endsWith('.sql')).sort()
  const textos = archivos.map(f => leer(mig, f))
  const iD7b = archivos.findIndex(f => f.includes('_d7b_secretario_abre_cursos'))
  expect(iD7b).toBeGreaterThan(0)
  for (const nivel of Object.values(API).filter(n => n.startsWith('rpc:'))) {
    const fn = nivel.slice(4)
    // La última migración (en orden) que CREA la función.
    let ultima = -1, pos = -1
    textos.forEach((t, k) => {
      const i = Math.max(t.lastIndexOf(`CREATE OR REPLACE FUNCTION public.${fn}(`), t.lastIndexOf(`CREATE FUNCTION public.${fn}(`))
      if (i >= 0) { ultima = k; pos = i }
    })
    expect(ultima, fn).toBeGreaterThanOrEqual(0)
    const cuerpo = textos[ultima].slice(pos, textos[ultima].indexOf('$$;', pos) > 0 ? textos[ultima].indexOf('$$;', pos) : pos + 6000)
    if (cuerpo.includes('public.es_staff()')) continue   // nace con es_staff() (D8)
    // Si no, D7b le cambia la guarda DESPUÉS de esa definición: su fila existe y va más tarde.
    expect(ultima, `${fn}: la última definición (${archivos[ultima]}) es posterior a D7b y no trae es_staff()`).toBeLessThan(iD7b)
    const d7b = textos[iD7b]
    const i = d7b.indexOf(`('public.${fn}(`)
    expect(i, `${fn}: sin fila en d7b_staff_abre()`).toBeGreaterThan(0)
    expect(d7b.slice(i, i + 400), fn).toContain("'IF NOT public.es_staff() THEN")
  }
})

test('7. las API que cambian: configuración, cursos, pagos, ficha y contraseñas', () => {
  const conf = sinComentarios(leer('src', 'app', 'api', 'admin', 'configuracion', 'route.ts'))
  expect(conf).not.toContain('autorizar(false)')
  // Cursos: el rol del visor cae CERRADO (null ya no vale ADMIN).
  for (const f of [['cursos', 'route.ts'], ['cursos', '[id]', 'route.ts']]) {
    const t = sinComentarios(leer('src', 'app', 'api', 'admin', ...f))
    expect(t, f.join('/')).toContain("const viewerRol = (await getUserRol(supabase, user.id)) === 'ADMIN' ? 'ADMIN' : 'SECRETARIO'")
    expect(t, f.join('/')).not.toContain("=== 'SECRETARIO' ? 'SECRETARIO' : 'ADMIN'")
  }
  expect(leer(ADMIN_DIR, 'cursos', 'page.tsx')).toContain("setEsAdmin(res.headers.get('x-rol-visor') === 'ADMIN')")
  expect(leer(ADMIN_DIR, 'cursos', '[id]', 'page.tsx')).toContain("const esAdmin = detalle.viewer_rol === 'ADMIN'")
  // Pagos: los ingresos solo al admin; el secretario, «Pagos registrados».
  const pagos = sinComentarios(leer('src', 'app', 'api', 'admin', 'pagos', 'route.ts'))
  expect(pagos).toContain("const conIngresos = (await getUserRol(supabase, user.id)) === 'ADMIN'")
  expect(pagos).toContain(': { pagosRegistrados: filas.length },')
  const pagina = sinComentarios(leer(ADMIN_DIR, 'pagos', 'page.tsx'))
  // Sin tarjetas hasta la primera respuesta (ni «$0» al secretario ni 1→3 al admin).
  expect(pagina).toContain('useState<Kpis | null>(null)')
  expect(pagina).toContain('{KPI.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">')
  expect(pagina).toContain('const verIngresos = kpis?.ingresosMes !== undefined && kpis?.ingresosTotales !== undefined')
  expect(pagina).toContain('...(verIngresos ? [')
  // El «Total» del pie es la misma cifra que «Ingresos totales»: solo con verIngresos.
  const pie = pagina.slice(pagina.indexOf('<tfoot>'), pagina.indexOf('</tfoot>'))
  expect(pie).toMatch(/\{verIngresos \? \(\s*<>[\s\S]*\{mxn\(totalFiltrado\)\}[\s\S]*<\/>\s*\) : <td colSpan=\{6\} \/>\}/)
  expect(pagina.match(/mxn\(totalFiltrado\)/g)?.length).toBe(1)
  // La ficha pide documentos solo si quien la ve es admin.
  const ficha = sinComentarios(leer(ADMIN_DIR, 'alumnos', '[id]', 'page.tsx'))
  expect(ficha).toContain("const docsRes = alumnoData.viewer_rol === 'ADMIN' ? await fetch(`/api/admin/documentos/${id}`) : null")
  expect(ficha.slice(ficha.indexOf('await Promise.all(['), ficha.indexOf('await Promise.all([') + 300)).not.toContain('/api/admin/documentos/')
  // Contraseña propia: el personal por /api/admin (su cuenta), los alumnos por /api/alumno.
  const adm = sinComentarios(leer('src', 'app', 'api', 'admin', 'cambiar-password', 'route.ts'))
  expect(adm).toContain('const denied = await verifyStaff(supabase, user.id)')
  expect(adm).toContain('await supabase.auth.updateUser({ password: newPassword })')
  expect(adm).not.toContain('updateUserById')
  const alu = sinComentarios(leer('src', 'app', 'api', 'alumno', 'cambiar-password', 'route.ts'))
  expect(alu).toMatch(/if \(\(await getUserRol\(supabase, user\.id\)\) !== 'ALUMNO'\) \{\s*return NextResponse\.json\(\{ error: 'Esta ruta es solo para alumnos\.' \}, \{ status: 403 \}\)/)
  expect(alu.indexOf("!== 'ALUMNO'")).toBeLessThan(alu.indexOf('signInWithPassword'))
})
