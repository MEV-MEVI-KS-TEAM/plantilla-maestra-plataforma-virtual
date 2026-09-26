import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { CONFIG } from '@/lib/config'
import { getSiteConfig } from '@/lib/site-config'
import { codigoMoneda, tipoCambioValido } from '@/lib/moneda'
import { errorDeRpcCurso, esMetodoPago, fechaValida } from '@/lib/cursos/inscripciones'
import { CONCEPTOS_CURSO_LECTURA } from '@/lib/pagos/conceptos'

// ─── POST /api/admin/inscripciones/[id]/pago — COBRAR un curso (D16) ────────
// El único escritor de cobros de curso es la función curso_cobrar (migración
// D16): pago ligado a la inscripción, con su moneda y el mes que CUBRE, y —solo
// si se pide y la ficha lo permite— la apertura en la MISMA transacción. Desde
// el cliente de Supabase no hay transacciones multi-tabla: hacerlo en dos
// llamadas dejaría la puerta a cobrar sin abrir, o abrir sin cobrar.
//
// Staff: admin y secretario cobran Y abren (decisión 6). La función lo vuelve a
// comprobar con la sesión.
//
// body {
//   pago_id: uuid (lo genera la pantalla UNA vez por cobro: el doble envío no cobra dos veces),
//   concepto: curso_pago_unico | curso_inscripcion | curso_mensualidad | curso_otro,
//   monto, metodo_pago, mes? (el mes que cubre; solo la mensualidad),
//   abrir?: boolean (default false), meses_esperados?: number (obligatorio si abrir),
//   regla_esperada?: 'total' | 'mes1' (lo que la pantalla vio al activar),
//   referencia?, fecha_pago?
// }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MIG = 'supabase/migrations/20260927140000_d16_curso_cobrar.sql'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const body = await request.json().catch(() => ({}))

    if (typeof body?.pago_id !== 'string' || !UUID.test(body.pago_id)) {
      return NextResponse.json({ error: 'Falta el identificador del cobro. Recarga la página y vuelve a intentarlo.' }, { status: 400 })
    }
    const concepto = body?.concepto
    if (!(CONCEPTOS_CURSO_LECTURA as readonly string[]).includes(concepto)) {
      return NextResponse.json({ error: `Concepto inválido. Usa: ${CONCEPTOS_CURSO_LECTURA.join(', ')}` }, { status: 400 })
    }
    const monto = Number(body?.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'El monto debe ser un número mayor a 0' }, { status: 400 })
    }
    if (!esMetodoPago(body?.metodo_pago)) {
      return NextResponse.json({ error: 'Método de pago inválido. Usa: EFECTIVO, TRANSFERENCIA, TARJETA, OTRO' }, { status: 400 })
    }
    const mes = body?.mes === undefined || body?.mes === null || body?.mes === '' ? null : Number(body.mes)
    if (mes !== null && (!Number.isInteger(mes) || mes < 1)) {
      return NextResponse.json({ error: 'El mes que cubre debe ser un número entero de 1 en adelante' }, { status: 400 })
    }
    if (body?.fecha_pago !== undefined && body.fecha_pago !== null && body.fecha_pago !== '' && !fechaValida(body.fecha_pago)) {
      return NextResponse.json({ error: 'fecha_pago inválida. Usa una fecha real en formato YYYY-MM-DD' }, { status: 400 })
    }
    const abrir = body?.abrir === true
    const esperados = typeof body?.meses_esperados === 'number' && Number.isInteger(body.meses_esperados) ? body.meses_esperados : null
    const regla = body?.regla_esperada === 'total' || body?.regla_esperada === 'mes1' ? body.regla_esperada : null

    // La moneda REAL del cobro, por su código (un config con la moneda como
    // objeto rompía el CHECK). El tipo de cambio vigente HOY congela el recibo.
    const moneda = codigoMoneda(CONFIG.moneda)
    const tipoCambio = moneda !== 'MXN' ? tipoCambioValido((await getSiteConfig()).tipoCambioMXN) : null

    const { data, error } = await supabase.rpc('curso_cobrar', {
      p_inscripcion_id: params.id,
      p_pago_id: body.pago_id,
      p_concepto: concepto,
      p_monto: monto,
      p_metodo_pago: String(body.metodo_pago).toUpperCase(),
      p_mes: mes,
      p_abrir: abrir,
      p_meses_esperados: esperados,
      p_regla_esperada: regla,
      p_moneda: moneda,
      p_tipo_cambio: tipoCambio,
      p_referencia: typeof body?.referencia === 'string' && body.referencia.trim() !== '' ? body.referencia.trim() : null,
      p_fecha_pago: body?.fecha_pago ? body.fecha_pago : null,
    })

    if (error) {
      if (error.code === 'PGRST202') {
        return NextResponse.json({ error: `A esta base le falta la migración del cobro de cursos. Corre ${MIG} (lista 7bis de SETUP.md).` }, { status: 503 })
      }
      const { status, mensaje } = errorDeRpcCurso(error)
      return NextResponse.json({ error: mensaje }, { status })
    }

    const fila = (Array.isArray(data) ? data[0] : data) as {
      pago_id?: string; repetido?: boolean; abrio?: string | null; meses_desbloqueados?: number; acceso_total?: boolean
    } | null
    return NextResponse.json({
      ok: true,
      pago_id: fila?.pago_id ?? body.pago_id,
      repetido: fila?.repetido === true,
      abrio: fila?.abrio ?? null,
      meses_desbloqueados: fila?.meses_desbloqueados ?? null,
      acceso_total: fila?.acceso_total === true,
    }, { status: fila?.repetido ? 200 : 201 })
  } catch (err) {
    console.error('[POST /api/admin/inscripciones/[id]/pago]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
