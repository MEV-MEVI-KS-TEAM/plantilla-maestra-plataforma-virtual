import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoDeFila, respuestaObjetivo } from '@/lib/admin-alumno'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

// ─── POST /api/admin/inscripciones/[id]/cerrar-mes ───────────────────────────
// Decrementa meses_desbloqueados para corregir un error de captura.
//
// ⚠️ REVOCA acceso que el alumno YA TENÍA: módulos que veía dejan de verse en
// cuanto el gate de B2 relee el contador. La UI pide confirmación explícita y
// la respuesta lo repite, para que quien lo pulse sepa lo que hizo.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const esperados =
      typeof body?.meses_esperados === 'number' && Number.isInteger(body.meses_esperados)
        ? body.meses_esperados
        : null

    // #187: la inscripción es de un ALUMNO. Sobre la de personal (o la propia)
    // → 403, con el rol leído de la BD, antes de la RPC.
    const objetivo = await cargarAlumnoDeFila(createAdminClient(), 'curso_inscripciones', params.id, user.id, 'Inscripción no encontrada')
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    const { data, error } = await supabase.rpc('curso_cerrar_mes', {
      p_inscripcion_id: params.id,
      p_meses_esperados: esperados,
    })

    if (error) {
      const { status, mensaje } = errorDeRpcCurso(error)
      return NextResponse.json({ error: mensaje }, { status })
    }

    const fila = Array.isArray(data) ? data[0] : data
    return NextResponse.json({
      ok: true,
      meses_desbloqueados: fila?.meses_desbloqueados ?? null,
      tope: fila?.tope ?? null,
      aviso: 'Se revocó el acceso a los módulos de ese mes. El alumno ya no los ve.',
    })
  } catch (err) {
    console.error('[POST /api/admin/inscripciones/[id]/cerrar-mes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
