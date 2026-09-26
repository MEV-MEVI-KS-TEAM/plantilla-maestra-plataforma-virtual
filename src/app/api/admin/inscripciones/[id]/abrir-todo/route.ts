import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

// ─── POST /api/admin/inscripciones/[id]/abrir-todo ───────────────────────────
// Da ACCESO TOTAL a una inscripción (C3b): el alumno ve el curso completo,
// incluidos los módulos que se agreguen después. Es la corrección del admin para
// un pago único cobrado a alguien que entró por meses (o que se registró solo).
//
// ⚠️ CON LA SESIÓN DEL USUARIO, como abrir-mes: curso_abrir_todo() comprueba
// es_admin() adentro y es_admin() usa auth.uid(). Idempotente: si ya lo tenía,
// responde igual y no deja evento.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data, error } = await supabase.rpc('curso_abrir_todo', { p_inscripcion_id: params.id })
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
    console.error('[POST /api/admin/inscripciones/[id]/abrir-todo]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
