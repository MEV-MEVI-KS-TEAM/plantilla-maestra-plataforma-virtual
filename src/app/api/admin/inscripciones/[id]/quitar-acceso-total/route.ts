import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

// ─── POST /api/admin/inscripciones/[id]/quitar-acceso-total ──────────────────
// Revoca el ACCESO TOTAL de una inscripción (C3b): vuelve a la ventana por meses
// con los que ya tenía abiertos (0 si entró por pago único). Es la corrección
// de un error del admin; REVOCA acceso, así que la pantalla lo confirma antes.
//
// body { motivo?: string } — queda en la bitácora junto con el actor.
//
// ⚠️ CON LA SESIÓN DEL USUARIO: curso_quitar_acceso_total() comprueba es_admin().
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const motivo = typeof body?.motivo === 'string' && body.motivo.trim() ? body.motivo.trim().slice(0, 500) : null

    const { data, error } = await supabase.rpc('curso_quitar_acceso_total', {
      p_inscripcion_id: params.id,
      p_motivo: motivo,
    })
    if (error) {
      const { status, mensaje } = errorDeRpcCurso(error)
      return NextResponse.json({ error: mensaje }, { status })
    }
    const fila = (Array.isArray(data) ? data[0] : data) as { acceso_total?: boolean; meses_desbloqueados?: number } | null
    return NextResponse.json({
      ok: true,
      acceso_total: fila?.acceso_total === true,
      meses_desbloqueados: fila?.meses_desbloqueados ?? null,
    })
  } catch (err) {
    console.error('[POST /api/admin/inscripciones/[id]/quitar-acceso-total]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
