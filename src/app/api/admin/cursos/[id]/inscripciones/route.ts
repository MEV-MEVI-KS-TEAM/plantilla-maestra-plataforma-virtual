import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

// ─── POST /api/admin/cursos/[id]/inscripciones ────────────────────────────────
// body { alumno_id }            → asignar un alumno
// body { todos_activos: true }  → asignar a todos los alumnos activos
//
// Asignar ABRE ACCESO con la regla del curso (C3b, #183): pago único → acceso
// total; mensual o sin precio → el mes 1. La decisión vive en SQL
// (curso_inscribir / curso_inscribir_todos) para que sea atómica, deje el evento
// con actor y sea UNA regla para todas las puertas del admin.
//
// ⚠️ SE LLAMA CON LA SESIÓN DEL ADMIN, NO con el cliente admin: las funciones
// comprueban es_admin(), que usa auth.uid() (con service_role sería NULL y
// rechazaría al propio administrador). El registro público no pasa por aquí.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const body = await request.json().catch(() => ({}))

    // ── Asignación masiva a alumnos activos ──────────────────────────────────
    if (body.todos_activos === true) {
      const { data, error } = await supabase.rpc('curso_inscribir_todos', { p_curso_id: params.id })
      if (error) {
        const { status, mensaje } = errorDeRpcCurso(error)
        return NextResponse.json({ error: mensaje }, { status })
      }
      const fila = (Array.isArray(data) ? data[0] : data) as
        { agregados?: number; total_activos?: number; regla?: string } | null
      return NextResponse.json({
        agregados: fila?.agregados ?? 0,
        totalActivos: fila?.total_activos ?? 0,
        regla: fila?.regla ?? null,
      })
    }

    // ── Asignación individual ─────────────────────────────────────────────────
    const alumnoId = body.alumno_id as string | undefined
    if (!alumnoId) return NextResponse.json({ error: 'alumno_id es requerido' }, { status: 400 })

    const { data, error } = await supabase.rpc('curso_inscribir', {
      p_curso_id: params.id,
      p_alumno_id: alumnoId,
    })
    if (error) {
      // 23505 = ya estaba asignado (409), P0002 = curso o alumno inexistente (404).
      const { status, mensaje } = errorDeRpcCurso(error)
      return NextResponse.json({ error: mensaje }, { status })
    }
    const fila = (Array.isArray(data) ? data[0] : data) as
      { inscripcion_id?: string; acceso_total?: boolean; meses_desbloqueados?: number; regla?: string } | null
    return NextResponse.json({
      inscripcion_id: fila?.inscripcion_id ?? null,
      acceso_total: fila?.acceso_total === true,
      meses_desbloqueados: fila?.meses_desbloqueados ?? 0,
      regla: fila?.regla ?? null,
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/cursos/[id]/inscripciones]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
