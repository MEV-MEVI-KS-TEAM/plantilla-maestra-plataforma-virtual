import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import {
  avisoAlBorrarPago, faltaFkCurso, faltaTabla, idInvalido,
  type AperturaDelPago, type InscripcionHoy,
} from '@/lib/pagos/borrar-pago'

/**
 * DELETE /api/admin/pagos/[id]
 * Elimina un pago mal capturado (hard delete, solo admin).
 *
 * D10 (#207-2a):
 *  - Sin B1 no existe `pagos.curso_inscripcion_id`: pedirla tumbaba el select
 *    entero y el pago salía «no encontrado» (404 falso) — no se podía borrar.
 *    Ahora se lee sin ella.
 *  - El aviso de «este pago abrió acceso» sale de la BITÁCORA, no de
 *    `mes_desbloqueado` (que pasa a ser el mes que el pago CUBRE, D0 decisión 5):
 *    el evento de apertura que el cobro dejó en su misma transacción tiene su
 *    mismo `created_at` (now() es el inicio de la transacción). Y solo se
 *    avisa si eso SIGUE abierto hoy: si el admin ya cerró el mes, el consejo
 *    «usa Cerrar mes» le quitaría al alumno un mes que sí pagó.
 *  - Un id que no es UUID es «no encontrado» (404), no un 500.
 */

type FilaPago = {
  id: string
  curso_inscripcion_id?: string | null
  mes_desbloqueado: number | null
  concepto: string | null
  created_at: string | null
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()

    let lectura = await admin
      .from('pagos')
      .select('id, curso_inscripcion_id, mes_desbloqueado, concepto, created_at')
      .eq('id', params.id)
      .maybeSingle()
    // Sin B1 (sin la columna de curso) se lee sin ella: un pago del programa.
    if (faltaFkCurso(lectura.error)) {
      lectura = await admin
        .from('pagos')
        .select('id, mes_desbloqueado, concepto, created_at')
        .eq('id', params.id)
        .maybeSingle()
    }
    if (idInvalido(lectura.error)) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }
    if (lectura.error) {
      console.error('[DELETE /api/admin/pagos/[id]] leer:', lectura.error.message)
      return NextResponse.json({ error: 'No se pudo leer el pago.' }, { status: 500 })
    }
    if (!lectura.data) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const p = lectura.data as FilaPago
    const inscripcionId = p.curso_inscripcion_id ?? null

    // ⚠️ Borrar el pago NO cierra el mes ni quita el acceso total (deliberado;
    // ver lib/pagos/borrar-pago.ts). Pero el admin tiene que ENTERARSE si lo que
    // ese pago abrió sigue abierto. Qué abrió lo dice la bitácora: el evento de
    // apertura de su misma transacción (mismo created_at). Sin bitácora (sin B4)
    // no se afirma nada. Cómo está hoy lo dice la inscripción: se LEE, no se toca
    // (select * para no depender de que exista acceso_total, que llega con C3b).
    let abrio: AperturaDelPago | null = null
    let hoy: InscripcionHoy | null = null
    if (inscripcionId && p.created_at) {
      const [ev, ins] = await Promise.all([
        admin
          .from('curso_inscripcion_eventos')
          .select('tipo, meses_despues')
          .eq('inscripcion_id', inscripcionId)
          .eq('created_at', p.created_at)
          .in('tipo', ['abrir_mes', 'abrir_todo']),
        admin
          .from('curso_inscripciones')
          .select('*')
          .eq('id', inscripcionId)
          .maybeSingle(),
      ])
      if (!ev.error) abrio = ((ev.data ?? []) as AperturaDelPago[])[0] ?? null
      else if (!faltaTabla(ev.error)) console.error('[DELETE /api/admin/pagos/[id]] bitácora:', ev.error.message)
      if (!ins.error) hoy = (ins.data ?? null) as InscripcionHoy | null
      else console.error('[DELETE /api/admin/pagos/[id]] inscripción:', ins.error.message)
    }

    const { error } = await admin
      .from('pagos')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      id: params.id,
      curso_inscripcion_id: inscripcionId,
      mes_afectado: p.mes_desbloqueado,
      abrio: abrio?.tipo ?? null,
      aviso: avisoAlBorrarPago(abrio, hoy),
    })
  } catch (err) {
    console.error('[DELETE /api/admin/pagos/[id]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
