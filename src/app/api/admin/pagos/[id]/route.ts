import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'

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
 *    mismo `created_at` (now() es el inicio de la transacción).
 */

type FilaPago = {
  id: string
  curso_inscripcion_id?: string | null
  mes_desbloqueado: number | null
  concepto: string | null
  created_at: string | null
}

/** «Esa columna no existe» (PostgREST 42703) por `curso_inscripcion_id`: base sin B1. */
function faltaFkCurso(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42703' || /curso_inscripcion_id/.test(error.message ?? '')
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
    if (lectura.error) {
      console.error('[DELETE /api/admin/pagos/[id]] leer:', lectura.error.message)
      return NextResponse.json({ error: 'No se pudo leer el pago.' }, { status: 500 })
    }
    if (!lectura.data) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const p = lectura.data as FilaPago
    const inscripcionId = p.curso_inscripcion_id ?? null

    // ⚠️ Borrar el pago NO cierra el mes ni quita el acceso total, y es
    // deliberado: el acceso solo se mueve por «Abrir mes» / «Cerrar mes» /
    // «Quitar acceso total», que aplican tope, estado y protección de doble clic.
    //
    // Pero el admin tiene que ENTERARSE: si no, borra el pago creyendo que
    // deshace la operación completa y el alumno conserva el acceso que compró
    // con un pago que ya no existe. Qué abrió ESTE pago lo dice la bitácora: el
    // evento de apertura de su misma transacción (mismo created_at). Sin
    // bitácora (sin B4) no se afirma nada.
    let abrio: { tipo: string; meses_despues: number | null } | null = null
    if (inscripcionId && p.created_at) {
      const { data: eventos, error: errEv } = await admin
        .from('curso_inscripcion_eventos')
        .select('tipo, meses_despues')
        .eq('inscripcion_id', inscripcionId)
        .eq('created_at', p.created_at)
        .in('tipo', ['abrir_mes', 'abrir_todo'])
      if (!errEv) abrio = ((eventos ?? []) as { tipo: string; meses_despues: number | null }[])[0] ?? null
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
      aviso: abrio?.tipo === 'abrir_todo'
        ? 'Se borró el pago, pero ese pago ABRIÓ TODO EL CURSO y el alumno conserva el acceso total. Si querías revocarlo, usa «Quitar acceso total» en su inscripción (pestaña Alumnos del curso).'
        : abrio?.tipo === 'abrir_mes'
          ? `Se borró el pago, pero ese pago abrió el mes ${abrio.meses_despues ?? '?'} del curso, que SIGUE ABIERTO: el alumno conserva el acceso. Si querías revocarlo, usa «Cerrar mes» en su inscripción (pestaña Alumnos del curso).`
          : null,
    })
  } catch (err) {
    console.error('[DELETE /api/admin/pagos/[id]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
