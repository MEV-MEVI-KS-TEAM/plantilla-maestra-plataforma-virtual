import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'
import { precioCursoNumerico } from '@/lib/cursos/precio-curso'

// ─── GET /api/admin/cursos/[id]/inscripciones?simular=todos ───────────────────
// Cuántos alumnos activos NUEVOS inscribiría la asignación masiva y con qué regla,
// sin inscribir a nadie. Es el número que la confirmación le muestra al admin
// (D3): lo cuenta el servidor con la misma consulta que después inserta.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied
    if (request.nextUrl.searchParams.get('simular') !== 'todos') {
      return NextResponse.json({ error: 'Usa ?simular=todos' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('curso_inscribir_todos', { p_curso_id: params.id, p_simular: true })
    if (error) {
      const { status, mensaje } = errorDeRpcCurso(error)
      return NextResponse.json({ error: mensaje }, { status })
    }
    const fila = (Array.isArray(data) ? data[0] : data) as
      { agregados?: number; total_activos?: number; regla?: string } | null
    return NextResponse.json({
      nuevos: fila?.agregados ?? 0,
      totalActivos: fila?.total_activos ?? 0,
      regla: fila?.regla ?? null,
    })
  } catch (err) {
    console.error('[GET /api/admin/cursos/[id]/inscripciones]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ─── POST /api/admin/cursos/[id]/inscripciones ────────────────────────────────
// body { alumno_id }                          → asignar un alumno
// body { todos_activos: true, esperados: n }  → asignar a todos los alumnos activos
//   (`esperados` = el número que el admin confirmó; si hoy son otros, 409)
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
      const esperados = typeof body.esperados === 'number' && Number.isInteger(body.esperados) ? body.esperados : null
      if (esperados === null) {
        return NextResponse.json({ error: 'Falta `esperados`: el número de alumnos que confirmaste' }, { status: 400 })
      }
      const reglaEsperada = body.regla_esperada === 'total' || body.regla_esperada === 'mes1' ? body.regla_esperada : null
      const { data, error } = await supabase.rpc('curso_inscribir_todos', {
        p_curso_id: params.id,
        p_esperados: esperados,
        p_regla_esperada: reglaEsperada,
      })
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
    // ¿La ficha del curso está sin precio (0/0)? Entonces se abrió el mes 1 aunque
    // el registro anuncie un pago único con el precio de config.ts: la pantalla
    // lo avisa y ofrece «Abrir todo».
    const { data: curso } = await supabase
      .from('cursos').select('precio_inscripcion, precio_mensualidad').eq('id', params.id).maybeSingle()
    const sinPrecio = precioCursoNumerico(curso ?? {}).tipo === 'informes'
    return NextResponse.json({
      inscripcion_id: fila?.inscripcion_id ?? null,
      acceso_total: fila?.acceso_total === true,
      meses_desbloqueados: fila?.meses_desbloqueados ?? 0,
      regla: fila?.regla ?? null,
      sin_precio: sinPrecio,
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/cursos/[id]/inscripciones]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
