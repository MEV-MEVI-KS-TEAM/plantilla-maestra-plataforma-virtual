#!/usr/bin/env node
/**
 * ¿`supabase/schema.sql` deja la base igual que aplicar TODAS las migraciones?
 *
 * Arma bases en un Postgres LOCAL desechable (nunca uno de Supabase) por tres
 * caminos y compara la foto de su esquema (`foto-esquema.sql`):
 *
 *   B    = supabase/schema.sql solo
 *   BM   = B + scripts/migracion-cursos-diplomados.sql + supabase/migrations/*.sql
 *          en orden de nombre (lo que queda en una base instalada con B cuando
 *          se le aplica todo lo que existe hoy)
 *   SM   = scripts/schema.sql + scripts/setup.sql + lo mismo que BM (la ruta del
 *          combo: TAREA 3 y TAREA 3.9 de PROMPTS-MAESTROS)
 *   BS   = B + scripts/setup.sql (los seeds sobre B, como la línea Solo-Cursos
 *          cuando siembra sobre supabase/schema.sql)
 *
 * Comparaciones (sale con 1 si alguna tiene diferencias NO previstas):
 *   1. B  vs BM, sin el módulo Cursos: lo que BM trae y B no es algo que una
 *      instalación nueva con B se queda sin tener hasta correr migraciones.
 *   2. BM vs SM: los dos instaladores tienen que acabar en la MISMA base.
 *   3. B  vs BS: setup.sql corre limpio sobre B (sus seeds usan el UNIQUE de
 *      preguntas) y no le cambia el esquema.
 *
 * Lo que se exime está en `EXENTO_*` con su porqué; una exención que ya no
 * aparece en la diferencia también es error (no se acumulan exenciones zombi).
 *
 * Uso (PowerShell o bash; solo lee el repo):
 *   PG_BIN="C:/Program Files/PostgreSQL/18/bin" PGPORT=55440 \
 *     node scripts/verificar-schema/comparar-instaladores.mjs
 * Necesita un cluster local ya arriba en 127.0.0.1:$PGPORT con usuario
 * `postgres` sin contraseña (ver scripts/verificar-schema/README.md). Crea y
 * borra las bases `verif_b`, `verif_bs`, `verif_bm` y `verif_sm`.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '../..')
const PSQL = path.join(process.env.PG_BIN || '', process.platform === 'win32' ? 'psql.exe' : 'psql')
const PUERTO = process.env.PGPORT || ''
const HOST = '127.0.0.1'
const SALIDA = process.env.VERIF_SALIDA || ''

if (!process.env.PG_BIN || !/^\d+$/.test(PUERTO)) {
  console.error('Falta PG_BIN (carpeta de psql) o PGPORT (puerto del cluster LOCAL desechable).')
  process.exit(2)
}
// Los puertos de Supabase (5432 sesión, 6543 transacción) no se usan aquí: este
// script BORRA bases y solo debe tocar un cluster que armaste tú en tu máquina.
if (PUERTO === '5432' || PUERTO === '6543') {
  console.error(`PGPORT=${PUERTO}: usa un cluster local desechable en otro puerto (p. ej. 55440).`)
  process.exit(2)
}

function psql(db, args, { cwd = RAIZ, entrada } = {}) {
  const r = spawnSync(PSQL, ['-h', HOST, '-p', PUERTO, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-X', '-q', ...args],
    { cwd, encoding: 'utf8', input: entrada, env: { ...process.env, PGCLIENTENCODING: 'UTF8', PGOPTIONS: '-c client_min_messages=warning' }, maxBuffer: 1 << 28 })
  if (r.status !== 0) {
    const err = new Error(`psql ${args.join(' ')} en ${db} salió con ${r.status}:\n${(r.stderr || '').slice(-3000)}`)
    err.stderr = r.stderr
    throw err
  }
  return r.stdout
}

const MIGRACIONES = fs.readdirSync(path.join(RAIZ, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => path.join('supabase/migrations', f))
const CURSOS_BASE = 'scripts/migracion-cursos-diplomados.sql'
const HARNESS = path.relative(RAIZ, path.join(AQUI, 'harness-supabase.sql'))

const CAMINOS = {
  B: [['supabase/schema.sql']],
  // Los seeds de setup.sql sobre B: las 265 preguntas entran con
  // ON CONFLICT (evaluacion_id, pregunta) y sin el UNIQUE fallan con 42P10.
  BS: [['supabase/schema.sql'], ['setup.sql', path.join(RAIZ, 'scripts')]],
  BM: [['supabase/schema.sql'], [CURSOS_BASE], ...MIGRACIONES.map((m) => [m])],
  // setup.sql usa `\i` con rutas relativas a scripts/: se corre desde ahí.
  SM: [['scripts/schema.sql'], ['setup.sql', path.join(RAIZ, 'scripts')], [CURSOS_BASE], ...MIGRACIONES.map((m) => [m])],
}

function armar(nombre) {
  const db = `verif_${nombre.toLowerCase()}`
  psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
  psql('postgres', ['-c', `CREATE DATABASE ${db}`])
  psql(db, ['-f', HARNESS])
  for (const [archivo, cwd] of CAMINOS[nombre]) {
    try { psql(db, ['-f', archivo], { cwd: cwd || RAIZ }) }
    catch (e) { throw new Error(`[${nombre}] falló ${archivo}\n${e.message}`) }
  }
  const foto = psql(db, ['-f', path.join(AQUI, 'foto-esquema.sql')]).split(/\r?\n/).filter(Boolean)
  // VERIF_CONSERVAR=1 deja las bases para inspeccionarlas (se borran en la siguiente corrida).
  if (!process.env.VERIF_CONSERVAR) psql('postgres', ['-c', `DROP DATABASE IF EXISTS ${db}`])
  if (SALIDA) fs.writeFileSync(path.join(SALIDA, `foto-${nombre}.txt`), foto.join('\n') + '\n')
  return foto
}

/** Diferencia simétrica, agrupada por clave (tipo|nombre): la definición que cambia sale con los dos lados. */
function diferencia(a, b) {
  const clave = (l) => l.split('|').slice(0, 2).join('|')
  const ma = new Map(a.map((l) => [clave(l), l])), mb = new Map(b.map((l) => [clave(l), l]))
  const out = []
  for (const k of new Set([...ma.keys(), ...mb.keys()])) {
    if (ma.get(k) === mb.get(k)) continue
    out.push({ clave: k, a: ma.get(k) ?? null, b: mb.get(k) ?? null })
  }
  return out.sort((x, y) => x.clave.localeCompare(y.clave))
}

// ── Módulo Cursos: B no lo trae a propósito (lo instala migracion-cursos-
// diplomados.sql y las migraciones 20260728*/20260730*/C3b/D7b/D8/D16/D20b/
// D20e solo para los clientes que lo usan). Todo objeto cuyo nombre sea del
// módulo, o que viva en una de sus tablas, sale de la comparación 1.
const TABLAS_CURSOS = /^(cursos|curso_[a-z_]+)$/
const FUNCIONES_CURSOS = /^(curso_[a-z_]+|d7b_[a-z_]+|generar_folio_constancia|reporte_curso_[a-z_]+|reporte_coherencia_pagos|curso_folio_seq)\(/
function esDeCursos(clave, linea) {
  const [tipo, nombre] = clave.split('|')
  if (tipo === 'bucket') return nombre === 'cursos'
  if (tipo === 'politica') {
    const [esquema, tabla] = nombre.split('.')
    if (esquema === 'storage') return /bucket_id = 'cursos'::text/.test(linea || '')
    return TABLAS_CURSOS.test(tabla)
  }
  if (tipo === 'funcion' || tipo === 'exec') return FUNCIONES_CURSOS.test(nombre)
  if (tipo === 'tabla') return TABLAS_CURSOS.test(nombre)
  if (tipo === 'grant' || tipo === 'grantcol' || tipo === 'columna' || tipo === 'restriccion' || tipo === 'indice' || tipo === 'trigger')
    return TABLAS_CURSOS.test(nombre.split('.')[0])
  return false
}

// ── Excepciones de la comparación 1 (B vs BM), cada una con su porqué.
const EXENTO_1 = [
  // B1 conecta pagos con el módulo Cursos: la columna apunta a una tabla de Cursos.
  ['columna|pagos.curso_inscripcion_id', 'B1: FK a curso_inscripciones (módulo Cursos)'],
  ['restriccion|pagos.pagos_curso_inscripcion_id_fkey', 'B1: FK a curso_inscripciones (módulo Cursos)'],
  ['indice|pagos.idx_pagos_curso_inscripcion', 'B1: índice de la FK a Cursos'],
  // B6 reescribe los reportes de ingresos y el estado de cuenta con columnas por
  // vertical que leen pagos.curso_inscripcion_id y curso_inscripciones: B guarda
  // a propósito la versión anterior a B6 (no depende del módulo).
  ['funcion|reporte_ingresos_semanales(', 'B6: versión por vertical, lee tablas de Cursos'],
  ['funcion|reporte_ingresos_mensuales(', 'B6: versión por vertical, lee tablas de Cursos'],
  ['funcion|estado_cuenta_alumnos(', 'B6: filtra pagos.curso_inscripcion_id (módulo Cursos)'],
]
const EXENTO_2 = []

function filtrar(difs, exentos, conCursos) {
  const usados = new Set()
  const quedan = difs.filter((d) => {
    const linea = d.a || d.b
    if (conCursos && esDeCursos(d.clave, linea)) return false
    const ex = exentos.find(([pref]) => d.clave === pref || d.clave.startsWith(pref))
    if (ex) { usados.add(ex[0]); return false }
    return true
  })
  const zombis = exentos.filter(([pref]) => !usados.has(pref)).map(([pref, porque]) => `${pref}  (${porque})`)
  return { quedan, zombis }
}

function imprimir(titulo, { quedan, zombis }, nombreA, nombreB) {
  console.log(`\n== ${titulo}: ${quedan.length} diferencia(s) no prevista(s), ${zombis.length} exención(es) zombi`)
  for (const d of quedan) {
    console.log(`  • ${d.clave}`)
    console.log(`      ${nombreA}: ${d.a ? d.a.split('|').slice(2).join('|') : '(no está)'}`)
    console.log(`      ${nombreB}: ${d.b ? d.b.split('|').slice(2).join('|') : '(no está)'}`)
  }
  for (const z of zombis) console.log(`  • exención que ya no hace falta: ${z}`)
  return quedan.length + zombis.length
}

const fotos = {}
for (const c of Object.keys(CAMINOS)) {
  process.stdout.write(`armando ${c}… `)
  fotos[c] = armar(c)
  console.log(`${fotos[c].length} objetos`)
}
let fallas = 0
fallas += imprimir('1. supabase/schema.sql vs schema.sql + todas las migraciones (sin módulo Cursos)',
  filtrar(diferencia(fotos.B, fotos.BM), EXENTO_1, true), 'B ', 'BM')
fallas += imprimir('2. instalador B + migraciones vs instalador S (combo) + migraciones',
  filtrar(diferencia(fotos.BM, fotos.SM), EXENTO_2, false), 'BM', 'SM')
fallas += imprimir('3. supabase/schema.sql vs supabase/schema.sql + setup.sql (seeds)',
  filtrar(diferencia(fotos.B, fotos.BS), [], false), 'B ', 'BS')
console.log(fallas ? `\n✖ ${fallas} problema(s)` : '\n✔ los instaladores son equivalentes')
process.exit(fallas ? 1 : 0)
