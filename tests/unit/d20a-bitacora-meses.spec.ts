import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  errorRpcMes, etiquetaRol, faltaBitacoraMes, leerCuerpoMes, nuevoIdOperacion, sinRpcMes, textoUltimoMes,
  type EventoMes,
} from '@/lib/meses-programa'

/**
 * Bloque D · D20a (remate c) — abrir y cerrar mes del PROGRAMA con bitácora,
 * actor e idempotencia: un solo escritor (alumno_mover_mes, solo el servidor),
 * la bitácora alumno_mes_eventos, las rutas, la ficha («Último: …», un id por
 * operación y la guarda síncrona contra el doble clic) y el guardián.
 *
 * El comportamiento real (secretario, doble clic, dos pestañas, concurrencia,
 * re-correr la migración, CHECK 15 y la foto de curso_ventana_limite) está en
 * el cluster scratch (prueba-d20a.sh).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const MIG = '20260928120000_d20a_bitacora_meses_programa.sql'
const CRUDO = leer(`supabase/migrations/${MIG}`)
const SQL = sinComentariosSql(CRUDO)
const RUTA_ABRIR = 'src/app/api/admin/alumnos/[id]/desbloquear-mes/route.ts'
const RUTA_CERRAR = 'src/app/api/admin/alumnos/[id]/cerrar-mes/route.ts'
const FICHA = 'src/app/(dashboard)/admin/alumnos/[id]/page.tsx'

const EV: EventoMes = {
  accion: 'abrir', mes: 3, antes: 2, despues: 3,
  actor_nombre: 'María López', actor_rol: 'secretario', created_at: '2026-09-26T16:42:00Z',
}

test('1. el texto de la ficha: «Último: abrió el mes 3 (2 → 3) · fecha · María López (Secretario)»', () => {
  const fmt = () => '26 sep 2026, 10:42'
  expect(textoUltimoMes(EV, fmt)).toBe('Último: abrió el mes 3 (2 → 3) · 26 sep 2026, 10:42 · María López (Secretario)')
  expect(textoUltimoMes({ ...EV, accion: 'cerrar', mes: 3, antes: 3, despues: 2, actor_rol: 'admin' }, fmt))
    .toBe('Último: quitó el mes 3 (3 → 2) · 26 sep 2026, 10:42 · María López (Administrador)')
  // Sin nombre (usuario borrado): queda el rol; sin fecha legible, no se inventa.
  expect(textoUltimoMes({ ...EV, actor_nombre: null }, () => '')).toBe('Último: abrió el mes 3 (2 → 3) · Secretario')
  expect(etiquetaRol('SECRETARIO')).toBe('Secretario')
  expect(etiquetaRol(null)).toBe('')
})

test('2. el cuerpo, el mapeo de errores y el id de la operación', () => {
  const id = nuevoIdOperacion()
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  expect(nuevoIdOperacion()).not.toBe(id)
  expect(leerCuerpoMes({ antes: 2, operacion_id: id })).toEqual({ antes: 2, operacionId: id })
  // Una ficha vieja manda {}: la ruta usa lo leído y un id nuevo.
  expect(leerCuerpoMes({})).toEqual({ antes: null, operacionId: null })
  expect(leerCuerpoMes(null)).toEqual({ antes: null, operacionId: null })
  expect(leerCuerpoMes({ antes: -1, operacion_id: 'x' })).toEqual({ antes: null, operacionId: null })
  expect(leerCuerpoMes({ antes: 2.5 })).toEqual({ antes: null, operacionId: null })

  expect(errorRpcMes({ code: '40001', message: 'El alumno cambió mientras tanto' })).toEqual({ status: 409, mensaje: 'El alumno cambió mientras tanto' })
  expect(errorRpcMes({ code: '42501', message: 'x' }).status).toBe(403)
  expect(errorRpcMes({ code: '22023', message: 'Todos los meses ya están desbloqueados.' }).status).toBe(400)
  expect(errorRpcMes({ code: 'P0002', message: 'x' }).status).toBe(404)
  // Un error desconocido no filtra su texto técnico.
  expect(errorRpcMes({ code: 'XX000', message: 'detalle interno' })).toEqual({ status: 500, mensaje: 'No se pudo mover el mes. Intenta de nuevo.' })
  expect(sinRpcMes({ code: 'PGRST202' })).toBe(true)
  expect(sinRpcMes({ code: '42883' })).toBe(true)
  expect(sinRpcMes({ code: '40001' })).toBe(false)
  expect(faltaBitacoraMes({ code: '42P01' })).toBe(true)
  expect(faltaBitacoraMes({ code: 'PGRST205' })).toBe(true)
})

test('3. la migración: transaccional, un escritor con candado ANTES de la idempotencia, actor revalidado, solo el servidor', () => {
  expect(SQL.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(SQL.trimEnd().endsWith('COMMIT;')).toBe(true)
  expect(SQL).toContain("NOTIFY pgrst, 'reload schema';")
  // Solo crea lo suyo: nada de cursos (curso_ventana_limite intacta).
  expect(SQL.match(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)).toEqual(['CREATE OR REPLACE FUNCTION public.alumno_mover_mes'])
  expect(SQL).not.toContain('curso_')
  // Sin cast constante en el preflight (#241).
  expect(SQL).not.toContain("'::regprocedure")
  expect(SQL).toContain('SECURITY DEFINER')
  expect(SQL).toContain('SET search_path = public')
  // El actor se revalida primero; el candado va ANTES de buscar la operación.
  const guarda = SQL.indexOf("v_rol NOT IN ('admin', 'secretario')")
  const candado = SQL.indexOf('FOR UPDATE;')
  const busca = SQL.indexOf('WHERE e.operacion_id = p_operacion_id;')
  const cambio = SQL.indexOf('IF v_actual <> p_antes THEN')
  const escribe = SQL.indexOf('UPDATE public.alumnos SET meses_desbloqueados = v_nuevo')
  expect(guarda).toBeGreaterThan(0)
  expect(candado).toBeGreaterThan(guarda)
  expect(busca).toBeGreaterThan(candado)
  expect(cambio).toBeGreaterThan(busca)
  expect(escribe).toBeGreaterThan(cambio)
  expect(SQL).toContain("USING ERRCODE = '40001'")
  // Abrir a un alumno de diplomado no; quitar sí (limpia un dato sucio de antes de B7).
  expect(SQL).toContain("IF v_nivel = 'diplomado' AND p_accion = 'abrir' THEN")
  // La bitácora: id de operación ÚNICO, coherencia antes/después y solo lectura para el personal.
  expect(SQL).toContain('CREATE UNIQUE INDEX IF NOT EXISTS alumno_mes_eventos_operacion_uidx')
  expect(SQL).toContain("CHECK (accion IN ('abrir', 'cerrar'))")
  expect(SQL).toContain("(accion = 'abrir'  AND despues = antes + 1 AND mes = despues)")
  expect(SQL).toContain('CREATE POLICY "alumno_mes_eventos: staff lee"')
  expect(SQL).toContain("EXECUTE 'GRANT SELECT ON public.alumno_mes_eventos TO authenticated';")
  expect(SQL).not.toMatch(/GRANT (INSERT|UPDATE|DELETE|ALL) ON public\.alumno_mes_eventos TO authenticated/)
  // Solo el servidor ejecuta la función.
  expect(SQL).toContain("EXECUTE 'REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM authenticated';")
  expect(SQL).not.toMatch(/GRANT EXECUTE ON FUNCTION public\.alumno_mover_mes[^']*TO authenticated/)
  expect(SQL).toContain("EXECUTE 'GRANT EXECUTE ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) TO service_role';")
})

test('4. los dos instaladores traen el MISMO bloque que la migración (cliente nuevo = cliente migrado)', () => {
  const ini = CRUDO.indexOf('-- ── BITÁCORA: alumno_mes_eventos')
  const fin = CRUDO.indexOf('-- Sin esto la RPC nueva')
  const bloque = CRUDO.slice(ini, fin).trimEnd()
  expect(bloque.length).toBeGreaterThan(1000)
  for (const f of ['scripts/schema.sql', 'supabase/schema.sql']) {
    expect(leer(f), f).toContain(bloque)
  }
})

test('5. las rutas: un solo escritor por la RPC (solo el servidor, con el actor) y el respaldo condicionado', () => {
  for (const [ruta, accion] of [[RUTA_ABRIR, 'abrir'], [RUTA_CERRAR, 'cerrar']] as const) {
    const r = leer(ruta)
    // D7b: sigue siendo del personal.
    expect(r).toContain('const denied = await verifyStaff(supabase, user.id)')
    expect(r).toContain('leerCuerpoMes(await request.json().catch(() => null))')
    expect(r).toContain("admin.rpc('alumno_mover_mes', {")
    expect(r).toContain(`p_accion:       '${accion}',`)
    expect(r).toContain('p_antes:        antes,')
    expect(r).toContain('p_operacion_id: cuerpo.operacionId ?? randomUUID(),')
    expect(r).toContain('p_actor:        user.id,')
    expect(r).not.toContain("supabase.rpc('alumno_mover_mes'")
    // Sin la migración: el UPDATE solo si el alumno sigue con lo que la ficha vio.
    expect(r).toContain('if (rpcError && sinRpcMes(rpcError)) {')
    expect(r).toContain(".eq('meses_desbloqueados', antes)")
    expect(r).toContain('if (!filas || filas.length === 0) {')
    expect(r).toContain('errorRpcMes(rpcError)')
    expect(r).toContain('repetido:')
    // Un solo UPDATE en la ruta (el respaldo), siempre condicionado.
    expect(r.match(/\.update\(\{[^}]*\}\)/g) ?? []).toHaveLength(1)
  }
  // El tope del plan lo pone el servidor.
  expect(leer(RUTA_ABRIR)).toContain('p_tope:         duracion,')
  // B7 en la ruta de abrir, como antes.
  expect(leer(RUTA_ABRIR)).toContain("a.nivel === 'diplomado'")
})

test('6. la ficha: un id por apertura del modal, guarda síncrona, lo que vio, «Último: …» y el GET', () => {
  const f = leer(FICHA)
  expect(f).toContain('const moviendoMes = useRef(false)')
  expect(f).toContain('const [opMes, setOpMes] = useState<string>(() => nuevoIdOperacion())')
  expect(f.match(/if \(!alumno \|\| moviendoMes\.current\) return/g) ?? []).toHaveLength(2)
  expect(f.match(/body: JSON\.stringify\(\{ antes: alumno\.meses_desbloqueados, operacion_id: opMes \}\)/g) ?? []).toHaveLength(2)
  expect(f).toContain('onClick={() => { setOpMes(nuevoIdOperacion()); setModalPago(true); setDesbloquearError(null) }}')
  expect(f).toContain('onClick={() => { setOpMes(nuevoIdOperacion()); setModalCerrarMes(true); setCerrarMesError(null) }}')
  expect(f).toContain('{textoUltimoMes(alumno.ultimo_mes_evento)}')
  // Mientras vuela, tampoco se cierra el modal.
  expect(f.match(/setModalPago\(false\); setDesbloquearError\(null\) \}\}\n\s+disabled=\{submitting\}/g) ?? []).toHaveLength(2)
  expect(f.match(/setModalCerrarMes\(false\); setCerrarMesError\(null\) \}\}\n\s+disabled=\{cerrandoMes\}/g) ?? []).toHaveLength(2)
  // El toast usa lo que devolvió el servidor, no la cuenta del closure viejo.
  expect(f).not.toContain('const mesDesbloqueado = alumno.meses_desbloqueados + 1')

  const g = leer('src/app/api/admin/alumnos/[id]/route.ts')
  expect(g).toContain(".from('alumno_mes_eventos')")
  expect(g).toContain(".select('accion, mes, antes, despues, actor_nombre, actor_rol, created_at')")
  expect(g).toContain(".order('created_at', { ascending: false })")
  expect(g).toContain('ultimo_mes_evento:   ultimoMesEvento,')
  expect(g).toContain('faltaBitacoraMes(evError)')
})

test('7. el guardián: CHECK 19 para toda escuela, sin casts constantes, y la fila 18 de SETUP', () => {
  const check = leer('scripts/post-setup-check.sql')
  const c19 = check.slice(check.indexOf('CHECK 19'))
  expect(c19).toContain("to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)')")
  expect(c19).not.toContain("'::regprocedure")
  expect(c19).toContain("indexname = 'alumno_mes_eventos_operacion_uidx'")
  expect(c19).toContain("has_function_privilege('authenticated', 'public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)', 'EXECUTE')")
  expect(c19).toContain("has_table_privilege('authenticated', 'public.alumno_mes_eventos', 'INSERT')")
  expect(c19).not.toContain('hay_cursos')
  expect(leer('SETUP.md')).toContain(`| 18 | \`${MIG}\` | **D20a**`)
  // No es del módulo de cursos: no va en las excepciones del guardián del onboarding.
  expect(leer('tests/unit/guardian-schema-onboarding.spec.ts')).not.toContain(MIG)
})
