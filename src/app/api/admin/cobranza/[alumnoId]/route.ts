/**
 * Calendario semanal de UN alumno, y las acciones que el staff puede ejecutar
 * sobre él.
 *
 * Todas las escrituras van por las funciones SECURITY DEFINER de la migración
 * (`registrar_cuota_semanal`, `condonar_semana`, `generar_calendario_*`), nunca
 * por UPDATE directo a `calendario_pagos`: esa tabla tiene REVOKE de
 * INSERT/UPDATE/DELETE para `authenticated`, y las funciones son las que llevan
 * la guardia de rol y mantienen `pagos` y el calendario en la misma
 * transacción.
 *
 * ⚠️ `regenerar` usa la variante POR NIVEL, que NO recibe la duración: la
 * deduce del nivel real del alumno y la lee de `public.ajustes`. Un alumno de
 * preparatoria no puede terminar con el calendario corto de secundaria ni por
 * un error de este panel — que es exactamente lo que pasó en EDUHCO con la
 * versión que sí recibía las cifras.
 *
 * `plan_a_medida` es la excepción DELIBERADA: el admin teclea semanas y cuota
 * para un alumno cuyo plan no está en el catálogo. Ahí las cifras vienen de
 * fuera porque ese es el caso de uso, y por eso va en una acción aparte con su
 * propio nombre en vez de colarse como parámetro opcional de `regenerar`.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { CONFIG } from '@/lib/config'
import { getSiteConfig } from '@/lib/site-config'
import { tipoCambioValido } from '@/lib/moneda'
import { sincronizarPlanSemanal } from '@/lib/plan-semanal'

export const dynamic = 'force-dynamic'

/** Tope de seguridad, el mismo que valida la RPC. Dos años de semanas. */
const MAX_SEMANAS = 104

export async function GET(_req: Request, { params }: { params: { alumnoId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const denied = await verifyStaff(supabase, user.id)
  if (denied) return denied

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('calendario_pagos')
    .select('numero_semana, total_semanas, fecha_vencimiento, monto, estado, condonado_motivo, pago_id')
    .eq('alumno_id', params.alumnoId)
    .order('numero_semana', { ascending: true })

  if (error) {
    console.error('[GET /api/admin/cobranza/:id]', error.message)
    return NextResponse.json({ error: 'No se pudo leer el calendario' }, { status: 500 })
  }
  return NextResponse.json({ semanas: (data ?? []).map(s => ({ ...s, monto: Number(s.monto) })) })
}

export async function POST(req: Request, { params }: { params: { alumnoId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const denied = await verifyStaff(supabase, user.id)
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const accion = String(body.accion ?? '')
  const admin = createAdminClient()

  if (accion === 'pagar') {
    // La moneda y el tipo de cambio SOLO se escriben si la escuela no cobra en
    // pesos, igual que /api/admin/pagos: así una escuela en MXN genera filas
    // idénticas a las de siempre.
    const cfgSitio = await getSiteConfig()
    const extraMoneda = CONFIG.moneda !== 'MXN'
      ? { p_moneda: CONFIG.moneda, p_tipo_cambio: tipoCambioValido(cfgSitio.tipoCambioMXN) }
      : {}

    const { data, error } = await admin.rpc('registrar_cuota_semanal', {
      p_alumno_id:      params.alumnoId,
      p_numero_semana:  Number(body.numero_semana),
      p_metodo_pago:    String(body.metodo_pago ?? 'EFECTIVO'),
      p_registrado_por: user.id,
      p_referencia:     body.referencia ? String(body.referencia) : null,
      ...extraMoneda,
    })
    if (error) {
      // 'ya está pagada' es un choque legítimo (dos personas cobrando a la vez),
      // no un fallo del servidor: se responde 409 para que la UI lo explique.
      const duplicado = /ya está pagada/i.test(error.message)
      return NextResponse.json({ error: error.message }, { status: duplicado ? 409 : 400 })
    }
    return NextResponse.json({ ok: true, pago_id: data })
  }

  if (accion === 'condonar') {
    const { error } = await admin.rpc('condonar_semana', {
      p_alumno_id:     params.alumnoId,
      p_numero_semana: Number(body.numero_semana),
      p_actor:         user.id,
      p_motivo:        body.motivo ? String(body.motivo) : null,
      p_condonar:      body.condonar !== false,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'regenerar') {
    await sincronizarPlanSemanal(admin)
    const { data, error } = await admin.rpc('generar_calendario_por_nivel', {
      p_alumno_id:    params.alumnoId,
      ...(body.fecha_inicio ? { p_fecha_inicio: String(body.fecha_inicio) } : {}),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, semanas: data })
  }

  if (accion === 'plan_a_medida') {
    const semanas = Number(body.semanas)
    const cuota   = Number(body.cuota)
    // Se valida aquí ADEMÁS de en la RPC: el mensaje de Postgres es correcto
    // pero no está escrito para que lo lea una persona en un formulario.
    if (!Number.isInteger(semanas) || semanas < 1 || semanas > MAX_SEMANAS) {
      return NextResponse.json(
        { error: `Las semanas deben ser un número entero entre 1 y ${MAX_SEMANAS}.` },
        { status: 400 },
      )
    }
    if (!Number.isFinite(cuota) || cuota <= 0) {
      return NextResponse.json({ error: 'La cuota semanal debe ser mayor que cero.' }, { status: 400 })
    }
    const { data, error } = await admin.rpc('generar_calendario_pagos', {
      p_alumno_id: params.alumnoId,
      p_semanas:   semanas,
      p_cuota:     cuota,
      ...(body.fecha_inicio ? { p_fecha_inicio: String(body.fecha_inicio) } : {}),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, semanas: data })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
