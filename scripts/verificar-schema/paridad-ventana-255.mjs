/**
 * #255 — La ventana de cursos por POSICIÓN, contra un Postgres de verdad.
 *
 * Arma dos bases en un cluster LOCAL y desechable, con la misma matriz de cursos
 * y alumnos sembrada por el flujo real («Asignar» = curso_inscribir con la sesión
 * del admin; «Abrir mes» = curso_abrir_mes):
 *
 *   antes   = la cadena de la plantilla en `VENTANA_ANTES_REF` (por omisión
 *             bf7fd7f, el main anterior a #255): el `orden` crudo.
 *   despues = la cadena de este árbol: la posición «dense».
 *
 * Por cada inscripción cuenta lo que el alumno VE con su sesión (rol
 * authenticated, RLS real) y lo que dice reporte_curso_inscripciones, y exige:
 *   1. nadie ve menos que antes (el conjunto de módulos, no solo la cuenta);
 *   2. en base 0 nada cambia;
 *   3. lo que ve = las posiciones por debajo del techo (independiente del TS);
 *   4. con todo abierto (tope o acceso total) ve el curso COMPLETO, el último
 *      incluido;
 *   5. el reporte dice lo que ve (inscripciones vigentes de cursos publicados);
 *   6. re-correr B2, B6 o C3b NO devuelve la ventana ni el reporte al `orden`
 *      crudo (Bug 239), y el CHECK 31 lo nota si una copia vieja lo hace.
 *
 * Escribe la foto en tests/unit/fixtures/ventana-255.json. La prueba de paridad
 * TS↔SQL (tests/unit/fix255-ventana-posicion.spec.ts) corre en cada
 * `pnpm test:unit` contra esa foto, sin base de datos, y exige que la foto sea
 * de la migración vigente (sha256).
 *
 * Uso (ver scripts/verificar-schema/README.md):
 *   PG_BIN="C:/Program Files/PostgreSQL/18/bin" PGPORT=55440 \
 *     node scripts/verificar-schema/paridad-ventana-255.mjs
 * Crea y borra las bases `ventana_antes` y `ventana_despues`. Se niega a correr
 * en los puertos de Supabase (5432, 6543).
 */
import { spawnSync, execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '../..')
const PSQL = path.join(process.env.PG_BIN || '', process.platform === 'win32' ? 'psql.exe' : 'psql')
const PUERTO = process.env.PGPORT || ''
const HOST = '127.0.0.1'
const REF_ANTES = process.env.VENTANA_ANTES_REF || 'bf7fd7f'
const MIG_255 = 'supabase/migrations/20260930120000_fix255_ventana_por_posicion.sql'
const FOTO = path.join(RAIZ, 'tests/unit/fixtures/ventana-255.json')
// La foto vale mientras no cambie ninguna de las migraciones que deciden la
// ventana (techo, tope, reporte y posición). Misma lista en la prueba unitaria.
const DE_LA_VENTANA = [
  'supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql',
  'supabase/migrations/20260730140000_b3_abrir_mes_y_pagos_curso.sql',
  'supabase/migrations/20260730160000_b6_reportes_por_vertical.sql',
  'supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql',
  MIG_255,
]

if (!process.env.PG_BIN || !/^\d+$/.test(PUERTO)) {
  console.error('Falta PG_BIN (carpeta de psql) o PGPORT (puerto del cluster LOCAL desechable).')
  process.exit(2)
}
if (PUERTO === '5432' || PUERTO === '6543') {
  console.error(`PGPORT=${PUERTO}: usa un cluster local desechable en otro puerto (p. ej. 55440).`)
  process.exit(2)
}

function psql(db, args, { cwd = RAIZ, entrada } = {}) {
  const r = spawnSync(PSQL, ['-h', HOST, '-p', PUERTO, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-X', '-q', ...args],
    { cwd, encoding: 'utf8', input: entrada, env: { ...process.env, PGCLIENTENCODING: 'UTF8', PGOPTIONS: '-c client_min_messages=warning' }, maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error(`psql ${args.join(' ').slice(0, 200)} en ${db} salió con ${r.status}:\n${(r.stderr || '').slice(-3000)}`)
  return r.stdout
}
const filas = (txt) => txt.split(/\r?\n/).filter(Boolean)

// ── Las cadenas ─────────────────────────────────────────────────────────────
const HARNESS = fs.readFileSync(path.join(AQUI, 'harness-supabase.sql'), 'utf8')
const git = (...a) => execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 28 })
const leerAhora = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8')
const leerAntes = (rel) => git('show', `${REF_ANTES}:${rel}`)
const migracionesAhora = fs.readdirSync(path.join(RAIZ, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => `supabase/migrations/${f}`)
const migracionesAntes = filas(git('ls-tree', '--name-only', `${REF_ANTES}`, 'supabase/migrations/')).filter((f) => f.endsWith('.sql')).sort()
if (migracionesAntes.includes(MIG_255)) throw new Error(`${REF_ANTES} ya trae ${MIG_255}: no sirve de «antes».`)

function armar(db, leer, migraciones) {
  psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
  psql('postgres', ['-c', `CREATE DATABASE ${db}`])
  psql(db, [], { entrada: HARNESS })
  for (const rel of ['supabase/schema.sql', 'scripts/migracion-cursos-diplomados.sql', ...migraciones]) {
    try { psql(db, [], { entrada: leer(rel) }) } catch (e) { throw new Error(`[${db}] falló ${rel}\n${e.message}`) }
  }
}

// ── La matriz ───────────────────────────────────────────────────────────────
// N × ritmo × forma del `orden` × (mensual: mes 1 / mitad / tope; «Pide
// informes» 0/0: mes 1 / mitad / tope; pago único: acceso total al asignar).
// El subconjunto base0/base1/hueco × (mensual ×3 + único) es la matriz de 216
// del diagnóstico de #255.
const uuid = (s) => { const h = crypto.createHash('md5').update(s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}` }
const FORMAS = {
  base0: (i) => i,
  base1: (i) => i + 1,
  hueco: (i) => (i === 0 ? 0 : i + 1),
  repetido: (i) => (i === 0 ? 0 : i - 1),
}
const PRECIOS = { mensual: [500, 300], informes: [0, 0], unico: [2490, 0] }
const ADMIN = uuid('f255-admin')

const cursos = []   // { id, n, pm, forma, precio, estado, ordenes, modulos: [{id, orden}] }
const casos = []    // { id, curso, alumno, momento, meses, estadoFinal, vence }
function curso(n, pm, forma, precio, estado = 'publicado', etiqueta = '', duracion = null) {
  const id = uuid(`f255-curso-${n}-${pm}-${forma}-${precio}-${estado}-${etiqueta}`)
  const ordenes = Array.from({ length: n }, (_, i) => FORMAS[forma](i))
  const modulos = ordenes.map((orden, i) => ({ id: uuid(`${id}-m${i}`), orden }))
  const c = { id, n, pm, forma, precio, estado, etiqueta, duracion, ordenes, modulos }
  cursos.push(c)
  return c
}
function caso(c, momento, extra = {}) {
  const id = `${c.n}|${c.pm}|${c.forma}|${c.precio}|${c.estado}|${c.etiqueta}|${momento}`
  casos.push({ id, curso: c, alumno: uuid(`f255-al-${id}`), momento, ...extra })
}
const tope = (n, pm) => Math.ceil(n / pm)
for (const n of [1, 2, 9, 10, 11, 12]) {
  // [1, 2, N] tal cual, con N = 1 o 2 repetido (cada uno es su propio curso):
  // así el subconjunto es exactamente la matriz de 216 del diagnóstico.
  for (const [j, pm] of [1, 2, n].entries()) {
    for (const forma of Object.keys(FORMAS)) {
      const t = tope(n, pm)
      for (const precio of ['mensual', 'informes']) {
        const c = curso(n, pm, forma, precio, 'publicado', `r${j}`)
        caso(c, 'mes1', { meses: 1 })
        caso(c, 'mitad', { meses: Math.max(1, Math.floor(t / 2)) })
        caso(c, 'tope', { meses: t })
      }
      caso(curso(n, pm, forma, 'unico', 'publicado', `r${j}`), 'asignado')
    }
  }
}
// Estados y casos raros, sobre 10 módulos a 2 por mes, en base 0 y en base 1.
for (const forma of ['base0', 'base1']) {
  const c = curso(10, 2, forma, 'mensual', 'publicado', 'estados')
  caso(c, 'sin-meses', { directo: 0 })                                 // registro público: 0 meses
  caso(c, 'suspendida', { meses: 3, estadoFinal: 'suspendida' })
  caso(c, 'cancelada', { meses: 3, estadoFinal: 'cancelada' })
  caso(c, 'completada-tope', { meses: 5, estadoFinal: 'completada' })
  caso(c, 'vencida', { meses: 5, vence: 'ayer' })
  caso(c, 'vigente-futura', { meses: 2, vence: 'futura' })
  const b = curso(10, 2, forma, 'mensual', 'borrador', 'borrador')
  caso(b, 'borrador', { directo: 5 })
  // duracion_meses manda sobre el tope (6 meses × 2 = 12 ≥ 10 módulos).
  const d = curso(10, 2, forma, 'mensual', 'publicado', 'duracion', 6)
  caso(d, 'mes1', { meses: 1 })
  caso(d, 'tope', { meses: 6 })
}
// Un curso sin módulos (solo examen).
caso(curso(0, 2, 'base0', 'mensual', 'publicado', 'vacio'), 'mes1', { meses: 1 })

function sqlSiembra() {
  const s = [
    `INSERT INTO auth.users (id, email) VALUES ('${ADMIN}', 'admin-f255@t.test');`,
    `INSERT INTO public.usuarios (id, email, rol) VALUES ('${ADMIN}', 'admin-f255@t.test', 'admin') ON CONFLICT (id) DO UPDATE SET rol = 'admin';`,
  ]
  for (const c of cursos) {
    const [ins, men] = PRECIOS[c.precio]
    s.push(`INSERT INTO public.cursos (id, nombre, tipo, estado, modulos_por_mes, precio_inscripcion, precio_mensualidad, duracion_meses) VALUES ('${c.id}', 'C ${c.n}/${c.pm} ${c.forma} ${c.precio} ${c.estado}', 'curso', '${c.estado}', ${c.pm}, ${ins}, ${men}, ${c.duracion ?? 'NULL'});`)
    for (const [i, m] of c.modulos.entries()) s.push(`INSERT INTO public.curso_modulos (id, curso_id, nombre, orden) VALUES ('${m.id}', '${c.id}', 'M${i + 1}', ${m.orden});`)
  }
  for (const k of casos) {
    s.push(`INSERT INTO auth.users (id, email) VALUES ('${k.alumno}', '${k.alumno}@t.test');`)
    s.push(`INSERT INTO public.usuarios (id, email, rol) VALUES ('${k.alumno}', '${k.alumno}@t.test', 'alumno') ON CONFLICT (id) DO NOTHING;`)
    s.push(`INSERT INTO public.alumnos (id, nivel) VALUES ('${k.alumno}', 'diplomado') ON CONFLICT (id) DO NOTHING;`)
    const fila = `(SELECT id FROM public.curso_inscripciones WHERE curso_id = '${k.curso.id}' AND alumno_id = '${k.alumno}')`
    if (k.directo !== undefined) {
      // Como el registro público o un curso en borrador: la fila sin «Asignar».
      s.push(`INSERT INTO public.curso_inscripciones (curso_id, alumno_id, meses_desbloqueados) VALUES ('${k.curso.id}', '${k.alumno}', ${k.directo});`)
      continue
    }
    // «Asignar» y «Abrir mes» con la sesión del admin, como el panel.
    s.push(`SELECT set_config('request.jwt.claim.sub', '${ADMIN}', false);`)
    s.push(`SELECT * FROM public.curso_inscribir('${k.curso.id}', '${k.alumno}');`)
    for (let j = 1; j < (k.meses ?? 0); j++) s.push(`SELECT * FROM public.curso_abrir_mes(${fila}, ${j});`)
    s.push(`SELECT set_config('request.jwt.claim.sub', '', false);`)
    if (k.estadoFinal) s.push(`UPDATE public.curso_inscripciones SET estado = '${k.estadoFinal}' WHERE id = ${fila};`)
    if (k.vence === 'ayer') s.push(`UPDATE public.curso_inscripciones SET fecha_vencimiento = CURRENT_DATE - 1 WHERE id = ${fila};`)
    if (k.vence === 'futura') s.push(`UPDATE public.curso_inscripciones SET fecha_vencimiento = CURRENT_DATE + 30 WHERE id = ${fila};`)
  }
  return s.join('\n')
}

// Lo que ve cada alumno con SU sesión (RLS real) y los números de la inscripción.
function foto(db) {
  const ve = new Map()
  const consulta = casos.map((k) => [
    `SELECT set_config('request.jwt.claim.sub', '${k.alumno}', false);`,
    'SET ROLE authenticated;',
    `SELECT '${k.alumno}', coalesce(string_agg(id::text, ',' ORDER BY id), '') FROM public.curso_modulos WHERE curso_id = '${k.curso.id}';`,
    'RESET ROLE;',
  ].join('\n')).join('\n')
  for (const l of filas(psql(db, ['-tA', '-F', '|'], { entrada: consulta }))) {
    const [al, ids] = l.split('|')
    if (!l.includes('|') || !/^[0-9a-f-]{36}$/.test(al)) continue   // las líneas de set_config
    ve.set(al, new Set(ids ? ids.split(',') : []))
  }
  const num = new Map()
  const q = `SELECT ci.alumno_id, ci.meses_desbloqueados, ci.acceso_total, ci.estado,
                    public.curso_ventana_limite(ci.curso_id, ci.alumno_id), public.curso_tope_meses(ci.curso_id),
                    r.modulos_visibles, r.modulos_totales
               FROM public.curso_inscripciones ci
               JOIN public.reporte_curso_inscripciones() r ON r.inscripcion_id = ci.id`
  for (const l of filas(psql(db, ['-tA', '-F', '|', '-c', q]))) {
    const [al, meses, total, estado, limite, tope, rep, tot] = l.split('|')
    num.set(al, { meses: +meses, acceso_total: total === 't', estado, limite: +limite, tope: +tope, reporte: +rep, totales: +tot })
  }
  return { ve, num }
}

const check = (db, nombre) => {
  const txt = psql(db, ['-tA', '-F', '|'], { entrada: leerAhora('scripts/post-setup-check.sql') })
  const l = filas(txt).find((x) => x.startsWith(nombre + '|'))
  if (!l) throw new Error(`[${db}] el post-setup-check no trajo «${nombre}»`)
  return l.split('|').pop()
}

// ── Correr ──────────────────────────────────────────────────────────────────
const fallas = []
const falla = (m) => { fallas.push(m); if (fallas.length <= 40) console.error('  ✗ ' + m) }

console.log(`armando ventana_antes (${REF_ANTES}, ${migracionesAntes.length} migraciones)…`)
armar('ventana_antes', leerAntes, migracionesAntes)
console.log(`armando ventana_despues (este árbol, ${migracionesAhora.length} migraciones)…`)
armar('ventana_despues', leerAhora, migracionesAhora)
const siembra = sqlSiembra()
for (const db of ['ventana_antes', 'ventana_despues']) psql(db, [], { entrada: siembra })
console.log(`sembrados ${cursos.length} cursos y ${casos.length} inscripciones en cada base`)

const A = foto('ventana_antes')
const D = foto('ventana_despues')
const VIGENTE = (k, num) => k.curso.estado === 'publicado' && ['activa', 'completada'].includes(num.estado) && k.vence !== 'ayer'
const salida = []
let ganan = 0
for (const k of casos) {
  const a = A.ve.get(k.alumno), d = D.ve.get(k.alumno), na = A.num.get(k.alumno), nd = D.num.get(k.alumno)
  if (!a || !d || !na || !nd) { falla(`${k.id}: sin datos`); continue }
  const idx = (set) => k.curso.modulos.map((m, i) => (set.has(m.id) ? i : -1)).filter((i) => i >= 0)
  for (const id of a) if (!d.has(id)) falla(`${k.id}: con #255 deja de ver un módulo que veía`)
  if (k.curso.forma === 'base0' && (a.size !== d.size)) falla(`${k.id}: base 0 cambió (${a.size} → ${d.size})`)
  // 3. Oráculo independiente del TS: posición dense = # de órdenes distintos menores.
  const distintos = [...new Set(k.curso.ordenes)].sort((x, y) => x - y)
  const pos = k.curso.ordenes.map((o) => distintos.filter((x) => x < o).length)
  const esperado = new Set(k.curso.modulos.filter((_, i) => pos[i] < nd.limite).map((m) => m.id))
  if (esperado.size !== d.size || [...esperado].some((id) => !d.has(id))) falla(`${k.id}: ve ${d.size}, la posición dice ${esperado.size}`)
  // 4. Con todo abierto, el curso completo.
  if (VIGENTE(k, nd) && (k.momento === 'tope' || k.momento === 'asignado' && k.curso.precio === 'unico' || k.momento === 'completada-tope') && d.size !== k.curso.n)
    falla(`${k.id}: con todo abierto ve ${d.size} de ${k.curso.n}`)
  // 5. El reporte dice lo que ve.
  if (VIGENTE(k, nd) && nd.reporte !== d.size) falla(`${k.id}: el reporte dice ${nd.reporte} y ve ${d.size}`)
  if (d.size > a.size) ganan++
  salida.push({
    id: k.id, n: k.curso.n, porMes: k.curso.pm, duracion: k.curso.duracion, forma: k.curso.forma, precio: k.curso.precio, cursoEstado: k.curso.estado,
    ordenes: k.curso.ordenes, meses: nd.meses, accesoTotal: nd.acceso_total, estado: nd.estado,
    vence: k.vence ?? null, limite: nd.limite, tope: nd.tope, reporte: nd.reporte, reporteAntes: na.reporte, totales: nd.totales,
    veAntes: idx(a), ve: idx(d),
  })
}
console.log(`== matriz: ${casos.length} inscripciones; ${ganan} ven ahora lo que les faltaba; ${fallas.length} falla(s)`)

// 6. Bug 239: re-correr B2, B6 y C3b no la revierte; una copia vieja sí, y el CHECK 31 lo ve.
const OK31 = (r) => r.startsWith('✅')
const r0 = check('ventana_despues', 'Ventana de cursos por posición (#255)')
if (!OK31(r0)) falla(`CHECK 31 recién armada: ${r0}`)
const igual = (f1, f2) => casos.every((k) => f1.ve.get(k.alumno).size === f2.ve.get(k.alumno).size && f1.num.get(k.alumno).reporte === f2.num.get(k.alumno).reporte)
for (const rel of ['supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql', 'supabase/migrations/20260730160000_b6_reportes_por_vertical.sql', 'supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql']) {
  psql('ventana_despues', [], { entrada: leerAhora(rel) })
  const r = check('ventana_despues', 'Ventana de cursos por posición (#255)')
  if (!OK31(r)) falla(`re-correr ${path.basename(rel)} revierte #255: ${r}`)
  if (!igual(D, foto('ventana_despues'))) falla(`re-correr ${path.basename(rel)} cambia lo que ven o el reporte`)
  const r15 = check('ventana_despues', 'Acceso total de cursos (C3b)')
  if (!r15.startsWith('✅')) falla(`re-correr ${path.basename(rel)} rompe el CHECK 15: ${r15}`)
}
console.log('== re-correr B2, B6 y C3b: revisado')
for (const rel of ['supabase/migrations/20260730130000_b2_gate_ventana_cursos.sql', 'supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql']) {
  // La copia VIEJA (la de antes de #255, sin el prólogo) sí pisa: el CHECK 31 tiene que verlo.
  psql('ventana_despues', [], { entrada: leerAntes(rel) })
  const r = check('ventana_despues', 'Ventana de cursos por posición (#255)')
  if (OK31(r)) falla(`una copia vieja de ${path.basename(rel)} revirtió y el CHECK 31 no lo vio`)
  psql('ventana_despues', [], { entrada: leerAhora(MIG_255) })
  const r2 = check('ventana_despues', 'Ventana de cursos por posición (#255)')
  if (!OK31(r2)) falla(`volver a correr #255 tras la copia vieja de ${path.basename(rel)} no la arregla: ${r2}`)
  if (!igual(D, foto('ventana_despues'))) falla(`tras la copia vieja de ${path.basename(rel)} y #255 la matriz cambió`)
}
console.log('== copias viejas de B2 y C3b: el CHECK 31 las ve y #255 las repara')
// La migración es re-ejecutable.
psql('ventana_despues', [], { entrada: leerAhora(MIG_255) })
if (!igual(D, foto('ventana_despues'))) falla('correr #255 dos veces cambió la matriz')

if (!process.env.VERIF_CONSERVAR) for (const db of ['ventana_antes', 'ventana_despues']) psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])

if (fallas.length) {
  console.error(`\n✗ ${fallas.length} falla(s). No se escribió la foto.`)
  process.exit(1)
}
const sha = crypto.createHash('sha256').update(DE_LA_VENTANA.map((rel) => leerAhora(rel).replace(/\r\n/g, '\n')).join('\n-- ──\n')).digest('hex')
fs.mkdirSync(path.dirname(FOTO), { recursive: true })
fs.writeFileSync(FOTO, JSON.stringify({
  generado: `scripts/verificar-schema/paridad-ventana-255.mjs (antes = ${REF_ANTES})`,
  migracionSha256: sha,
  deLaVentana: DE_LA_VENTANA,
  casos: salida,
}, null, 0).replace(/\},\{/g, '},\n{') + '\n')
console.log(`\n✔ ventana por posición verificada; foto en ${path.relative(RAIZ, FOTO)} (${salida.length} casos)`)
