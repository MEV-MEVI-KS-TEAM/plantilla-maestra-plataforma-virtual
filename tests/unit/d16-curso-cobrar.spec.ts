import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONCEPTOS_CURSO_LECTURA } from '@/lib/pagos/conceptos'
import {
  AVISO_SIN_PRECIO, AVISO_YA_PAGADO, cubreElCobro, precargaCobro, reglaDeFicha, resumenCobro, type EstadoCobro,
} from '@/lib/cursos/cobro'
import { aperturaAlAsignar } from '@/lib/cursos/acceso'

/**
 * Bloque D · D16 — #207-5: el cobro de cursos con UN solo escritor
 * (curso_cobrar, migración nueva; B3 intacta), el GET de los cursos del alumno
 * y la precarga pura (lib/cursos/cobro.ts). Decisiones 1, 2, 3, 5, 6 y 10.
 *
 * El comportamiento real (secretario, doble envío, concurrencia, re-correr las
 * migraciones viejas, foto del candado) está en el cluster scratch
 * (prueba-d16.sh: 86/86).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentariosSql = (s: string) => s.replace(/--[^\n]*/g, '')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const MIG = '20260927140000_d16_curso_cobrar.sql'
const SQL = sinComentariosSql(leer(`supabase/migrations/${MIG}`))

test('1. la función: staff, candado ANTES de la idempotencia, validación, los tres casos que abren y el pago con su moneda', () => {
  expect(SQL.trimStart().startsWith('BEGIN;')).toBe(true)
  expect(SQL.trimEnd().endsWith('COMMIT;')).toBe(true)
  expect(SQL).toContain('CREATE OR REPLACE FUNCTION public.curso_cobrar(')
  expect(SQL).toContain('SECURITY DEFINER')
  expect(SQL).toContain('SET search_path = public')
  expect(SQL).toContain('IF NOT public.es_staff() THEN')
  expect(SQL).not.toContain('public.es_admin()')
  // Solo define curso_cobrar: B3 (curso_registrar_pago) y C3b/D8 no se redefinen.
  expect(SQL.match(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)).toEqual([
    'CREATE OR REPLACE FUNCTION public.curso_cobrar',
    'CREATE OR REPLACE FUNCTION public.curso_inscripcion_no_borrar_con_pagos',
  ])
  expect(SQL).not.toContain('curso_registrar_pago')
  // El candado va ANTES de buscar el pago: el doble envío espera y sale «repetido».
  const candado = SQL.indexOf('FOR UPDATE;')
  const idem = SQL.indexOf('FROM public.pagos p WHERE p.id = p_pago_id;')
  expect(candado).toBeGreaterThan(0)
  expect(idem).toBeGreaterThan(candado)
  expect(SQL).toMatch(/RETURN QUERY SELECT p_pago_id, true,[\s\S]{0,400}?v_meses, v_total;/)
  // NaN es mayor que todo en Postgres: se rechaza aparte.
  expect(SQL).toContain("p_monto = 'NaN'::numeric OR p_monto <= 0")
  expect(SQL).toContain("p_moneda !~ '^[A-Z]{3}$'")
  // Abrir: solo si se pide, con lo que la pantalla vio, y en tres casos.
  expect(SQL).toContain('IF p_meses_esperados IS NULL THEN')
  expect(SQL).toContain('IF p_meses_esperados <> v_meses THEN')
  expect(SQL).toContain('PERFORM public.curso_activar_segun_ficha(p_inscripcion_id, p_regla_esperada);')
  expect(SQL).toContain('IF p_mes <> v_meses + 1 THEN')
  expect(SQL).toContain('PERFORM public.curso_abrir_mes(p_inscripcion_id, p_meses_esperados);')
  expect(SQL).toContain("IF v_regla <> 'total' THEN")
  expect(SQL).toContain('PERFORM public.curso_abrir_todo(p_inscripcion_id);')
  // El pago: su id (idempotencia), el mes que CUBRE (solo la mensualidad), moneda y tipo de cambio.
  expect(SQL).toContain("CASE WHEN p_concepto = 'curso_mensualidad' THEN p_mes ELSE NULL END,")
  expect(SQL).toMatch(/INSERT INTO public\.pagos \(\s*id, alumno_id, monto, concepto, mes_desbloqueado, metodo_pago, referencia,\s*registrado_por, curso_inscripcion_id, fecha_pago, moneda, tipo_cambio_aplicado\s*\)/)
  // Permisos y recarga.
  expect(SQL).toContain('REVOKE ALL ON FUNCTION public.curso_cobrar(UUID, UUID, TEXT, NUMERIC, TEXT, INTEGER, BOOLEAN, INTEGER, TEXT, TEXT, NUMERIC, TEXT, DATE) FROM PUBLIC;')
  expect(SQL).toContain('FROM anon')
  expect(SQL).toContain('TO authenticated')
  expect(SQL).toContain("NOTIFY pgrst, 'reload schema';")
})

test('2. paridad: los conceptos del SQL = CONCEPTOS_CURSO_LECTURA; la regla de la ficha = la de «Asignar»', () => {
  const lista = SQL.match(/p_concepto NOT IN \(([^)]*)\)/)![1]
  expect([...lista.matchAll(/'(\w+)'/g)].map(m => m[1]).sort()).toEqual([...CONCEPTOS_CURSO_LECTURA].sort())
  for (const ins of [0, 500, 2490]) for (const men of [0, 900]) {
    const c = { precio_inscripcion: ins, precio_mensualidad: men }
    expect(reglaDeFicha(c), `${ins}/${men}`).toBe(aperturaAlAsignar(c))
  }
})

const base = (o: Partial<EstadoCobro> = {}): EstadoCobro => ({
  estado: 'activa', meses: 0, acceso_total: false, por_activar: false,
  ficha: { precio_inscripcion: 2490, precio_mensualidad: 0 },
  referencia: { precios: { precio_inscripcion: 2490, precio_mensualidad: 0 }, origen: 'inscripcion' },
  pagos: [], ...o,
})
const mensual = (o: Partial<EstadoCobro> = {}) => base({
  meses: 1,
  ficha: { precio_inscripcion: 500, precio_mensualidad: 1500 },
  referencia: { precios: { precio_inscripcion: 500, precio_mensualidad: 1500 }, origen: 'inscripcion' }, ...o,
})

test('3. pago único: precarga el saldo; abre solo si la ficha es de pago único y lo acumulado cubre', () => {
  const porActivar = base({ por_activar: true })
  expect(precargaCobro(porActivar)).toEqual({
    concepto: 'curso_pago_unico', monto: 2490, mes: null, puedeAbrir: true, abrirPorDefecto: true, regla: 'total', aviso: null,
  })
  // Abono: queda el saldo; la casilla sale marcada porque el saldo completo cubre.
  const abono = base({ pagos: [{ monto: 1000, concepto: 'curso_pago_unico', mes_desbloqueado: null }] })
  expect(resumenCobro(abono)).toMatchObject({ pagado: 1000, saldo: 1490, pagadoFaltaAbrir: false })
  expect(precargaCobro(abono)).toMatchObject({ monto: 1490, abrirPorDefecto: true })
  expect(cubreElCobro(abono, 'curso_pago_unico', 500)).toBe(false)
  expect(cubreElCobro(abono, 'curso_pago_unico', 1490)).toBe(true)
  // Pagado completo sin abrir: insignia «Pagado · falta abrir»; el monto ya es libre.
  const pagado = base({ pagos: [{ monto: 2490, concepto: 'curso_pago_unico', mes_desbloqueado: null }] })
  expect(resumenCobro(pagado)).toMatchObject({ saldo: 0, pagadoFaltaAbrir: true })
  expect(precargaCobro(pagado)).toMatchObject({ monto: null, aviso: AVISO_YA_PAGADO, abrirPorDefecto: false })
  // Con acceso total no hay nada que abrir ni pendiente.
  expect(precargaCobro(base({ acceso_total: true })).puedeAbrir).toBe(false)
  expect(resumenCobro(base({ acceso_total: true, pagos: [{ monto: 2490, concepto: 'curso_pago_unico', mes_desbloqueado: null }] })).pagadoFaltaAbrir).toBe(false)
  // Vendido como pago único pero la ficha HOY es mensual: la casilla no aparece (la base lo rechazaría).
  expect(precargaCobro(base({ ficha: { precio_inscripcion: 0, precio_mensualidad: 900 } })).puedeAbrir).toBe(false)
})

test('4. mensual: inscripción primero; luego la mensualidad del primer mes SIN pago; abre solo el mes siguiente', () => {
  // Por activar y sin inscripción pagada: la inscripción, y activar abre el mes 1.
  expect(precargaCobro(mensual({ meses: 0, por_activar: true }))).toMatchObject({ concepto: 'curso_inscripcion', monto: 500, mes: null, puedeAbrir: true, regla: 'mes1' })
  // Tras asignar (1 mes abierto, nada de mensualidades): se cobra el mes 1 y NO se abre el 2.
  const tras = mensual({ pagos: [{ monto: 500, concepto: 'curso_inscripcion', mes_desbloqueado: null }] })
  expect(precargaCobro(tras)).toMatchObject({ concepto: 'curso_mensualidad', monto: 1500, mes: 1, puedeAbrir: false, abrirPorDefecto: false })
  // Pagado el mes 1: el siguiente es el 2 = meses + 1 → se puede abrir, marcado.
  const mes1 = mensual({ pagos: [
    { monto: 500, concepto: 'curso_inscripcion', mes_desbloqueado: null },
    { monto: 1500, concepto: 'curso_mensualidad', mes_desbloqueado: 1 },
  ] })
  expect(precargaCobro(mes1)).toMatchObject({ concepto: 'curso_mensualidad', mes: 2, puedeAbrir: true, abrirPorDefecto: true })
  expect(resumenCobro(mes1)).toMatchObject({ mesesCubiertos: [1], pagadoFaltaAbrir: false, saldo: null })
  // Pagó el mes 2 sin abrirlo: «Pagado · falta abrir».
  const mes2 = mensual({ pagos: [...mes1.pagos, { monto: 1500, concepto: 'curso_mensualidad', mes_desbloqueado: 2 }] })
  expect(resumenCobro(mes2).pagadoFaltaAbrir).toBe(true)
  // Una mensualidad que no cubre: la casilla no se marca sola.
  expect(cubreElCobro(mes1, 'curso_mensualidad', 1000)).toBe(false)
  expect(cubreElCobro(mes1, 'curso_mensualidad', 1500)).toBe(true)
  // Sin inscripción en la ficha y por activar: la mensualidad del mes 1 activa.
  const sinIns = mensual({ meses: 0, por_activar: true, referencia: { precios: { precio_inscripcion: 0, precio_mensualidad: 900 }, origen: 'ficha' }, ficha: { precio_inscripcion: 0, precio_mensualidad: 900 } })
  expect(precargaCobro(sinIns)).toMatchObject({ concepto: 'curso_mensualidad', mes: 1, puedeAbrir: true })
  // Cancelada o suspendida: se cobra, pero no se abre.
  expect(precargaCobro(mensual({ estado: 'cancelada', pagos: mes1.pagos })).puedeAbrir).toBe(false)
})

test('5. sin precio (0/0): monto libre, «curso_otro», aviso; abre solo la primera activación y sin marcar', () => {
  const z = base({
    ficha: { precio_inscripcion: 0, precio_mensualidad: 0 },
    referencia: { precios: { precio_inscripcion: 0, precio_mensualidad: 0 }, origen: 'ficha' },
  })
  expect(precargaCobro({ ...z, por_activar: true })).toEqual({
    concepto: 'curso_otro', monto: null, mes: null, puedeAbrir: true, abrirPorDefecto: false, regla: 'mes1', aviso: AVISO_SIN_PRECIO,
  })
  expect(precargaCobro({ ...z, meses: 1 }).puedeAbrir).toBe(false)
  expect(resumenCobro({ ...z, por_activar: true, pagos: [{ monto: 300, concepto: 'curso_otro', mes_desbloqueado: null }] }).pagadoFaltaAbrir).toBe(true)
})

test('6. la ruta /pago: staff, el id del cobro, la moneda por su código y 503 sin la migración; nada de B3', () => {
  const r = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/pago/route.ts'))
  expect(r).toContain('const denied = await verifyStaff(supabase, user.id)')
  expect(r).toContain("if (typeof body?.pago_id !== 'string' || !UUID.test(body.pago_id)) {")
  expect(r).toContain('if (!(CONCEPTOS_CURSO_LECTURA as readonly string[]).includes(concepto)) {')
  expect(r).toContain('const moneda = codigoMoneda(CONFIG.moneda)')
  expect(r).toContain("supabase.rpc('curso_cobrar', {")
  expect(r).not.toContain('curso_registrar_pago')
  expect(r).toContain("if (error.code === 'PGRST202') {")
  expect(r).toContain(`const MIG = 'supabase/migrations/${MIG}'`)
  // Abrir es opt-in (antes abría el mes POR DEFECTO).
  expect(r).toContain('const abrir = body?.abrir === true')
})

test('7. el GET de cursos del alumno: staff, el MISMO «por activar» de D8, la foto del precio y la precarga pura', () => {
  const g = sinComentarios(leer('src/app/api/admin/alumnos/[id]/cursos/route.ts'))
  expect(g).toContain('const denied = await verifyStaff(supabase, user.id)')
  expect(g).toMatch(/\.from\('curso_inscripciones'\)\s*\.select\('\*'\)\s*\.eq\('alumno_id', params\.id\)/)
  expect(g).toContain(".in('tipo', ['inscripcion', ...EVENTOS_DE_ACCESO])")
  expect(g).toContain("&& !suyos.some(e => (EVENTOS_DE_ACCESO as readonly string[]).includes(e.tipo)),")
  expect(g).toContain("suyos.filter(e => e.tipo === 'inscripcion' && e.detalle)")
  expect(g).toContain("{ precios: ficha, origen: 'ficha' }")
  expect(g).toContain('resumen: resumenCobro(estado),')
  expect(g).toContain('precarga: precargaCobro(estado),')
  expect(g).toContain('cobro: estado,')
})

test('8. el guardián: CHECK 18 (una sola versión, candado, B3 intacta), SETUP 7bis y la excepción del onboarding', () => {
  const check = leer('scripts/post-setup-check.sql')
  const c18 = check.slice(check.indexOf('CHECK 18'))
  expect(c18).toContain("to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)')")
  expect(c18).not.toContain("'::regprocedure")
  expect(c18).toContain("(SELECT count(*) FROM pg_proc WHERE proname = 'curso_registrar_pago') AS registrar")
  expect(c18).toContain("strpos(pg_get_functiondef(to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)')), 'FOR UPDATE') > 0")
  expect(leer('SETUP.md')).toContain(`| 17 | \`${MIG}\` | **D16**`)
  expect(leer('tests/unit/guardian-schema-onboarding.spec.ts')).toContain(`'${MIG}':           'módulo Cursos: aplicación aparte'`)
})

test('9. revisión: el tope y el mes 1 en la precarga, el reintento que compara, y el borrado con pagos', () => {
  // Precarga: no ofrece abrir lo que la base rechazaría.
  const alTope = mensual({ meses: 3, tope: 3, pagos: [
    { monto: 500, concepto: 'curso_inscripcion', mes_desbloqueado: null },
    { monto: 1500, concepto: 'curso_mensualidad', mes_desbloqueado: 1 },
    { monto: 1500, concepto: 'curso_mensualidad', mes_desbloqueado: 2 },
    { monto: 1500, concepto: 'curso_mensualidad', mes_desbloqueado: 3 },
  ] })
  expect(precargaCobro(alTope)).toMatchObject({ mes: 4, puedeAbrir: false })
  const sinContenido = mensual({ meses: 0, por_activar: true, hayMes1: false })
  expect(precargaCobro(sinContenido).puedeAbrir).toBe(false)
  const z0 = base({ por_activar: true, hayMes1: false, ficha: { precio_inscripcion: 0, precio_mensualidad: 0 }, referencia: { precios: { precio_inscripcion: 0, precio_mensualidad: 0 }, origen: 'ficha' } })
  expect(precargaCobro(z0).puedeAbrir).toBe(false)
  // El pago único por activar no depende del mes 1 (abre todo).
  expect(precargaCobro(base({ por_activar: true, hayMes1: false })).puedeAbrir).toBe(true)

  // SQL: el reintento compara los datos y dice lo que abrió; el mes dentro del tope;
  // pago único por activar solo con pago único (o inscripción); el trigger de borrado.
  expect(SQL).toContain('OR v_prev.monto IS DISTINCT FROM p_monto')
  expect(SQL).toContain("WHEN bool_or(e.tipo = 'abrir_todo') THEN 'todo' WHEN bool_or(e.tipo = 'abrir_mes') THEN 'mes' END")
  expect(SQL).toContain("IF p_concepto = 'curso_mensualidad' AND v_tope > 0 AND p_mes > v_tope THEN")
  expect(SQL).toContain("IF v_regla = 'total' AND p_concepto NOT IN ('curso_pago_unico', 'curso_inscripcion') THEN")
  expect(SQL).toContain('BEFORE DELETE ON public.curso_inscripciones')
  expect(SQL).toContain("AND EXISTS (SELECT 1 FROM public.alumnos a WHERE a.id = OLD.alumno_id) THEN")
  expect(SQL).toContain("USING ERRCODE = '23001';")
  // (en la cadena va un «--»: se busca en el archivo tal cual, no en el SQL sin comentarios)
  expect(leer(`supabase/migrations/${MIG}`)).toContain("'NOT public.es_staff() THEN  -- D7b:') = 0 THEN")
  // Las rutas de borrado traducen el 23001 a 409 «tiene pagos».
  for (const f of ['src/app/api/admin/cursos/[id]/inscripciones/[alumnoId]/route.ts', 'src/app/api/admin/cursos/[id]/route.ts']) {
    expect(sinComentarios(leer(f)), f).toMatch(/if \(error\.code === '23001'\) \{[\s\S]{0,400}?tiene_pagos: true,?\s*\}?,? \{ status: 409 \}\)/)
  }
  // La ruta /pago valida lo que la base aceptaría (NUMERIC(10,2) > 0, mes razonable).
  const r = sinComentarios(leer('src/app/api/admin/inscripciones/[id]/pago/route.ts'))
  expect(r).toContain('monto < 0.01 || monto >= 1e8 || Math.abs(Math.round(monto * 100) - monto * 100) > 1e-6')
  expect(r).toContain('mes < 1 || mes > 600')
  // El GET: tope y mes 1 por curso; sin la ficha, error (no «Pide informes» inventado).
  const g = sinComentarios(leer('src/app/api/admin/alumnos/[id]/cursos/route.ts'))
  expect(g).toContain('tope: c ? topeMeses(c.duracion_meses ?? null, modulosPorCurso.get(c.id) ?? 0, c.modulos_por_mes ?? 0) : null,')
  expect(g).toContain("if (!UUID.test(params.id)) return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 })")
  expect(g).toMatch(/if \(errCursos\) \{[\s\S]{0,200}?status: 500 \}\)/)
  // CHECK 18: authenticated con EXECUTE, SECURITY DEFINER y el trigger.
  const c18 = leer('scripts/post-setup-check.sql').slice(leer('scripts/post-setup-check.sql').indexOf('CHECK 18'))
  expect(c18).toContain('AS auth_ejecuta,')
  expect(c18).toContain('AS definer,')
  expect(c18).toContain("tgname = 'trg_curso_inscripcion_no_borrar_con_pagos'")
})
