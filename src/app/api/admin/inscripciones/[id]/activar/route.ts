import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

// ─── POST /api/admin/inscripciones/[id]/activar ──────────────────────────────
// «Activar según la ficha» (D8): abre lo que dice la ficha HOY a una inscripción
// POR ACTIVAR — pago único → acceso total; mensual o sin precio → mes 1. Lo hace
// curso_activar_segun_ficha(), con FOR UPDATE y un evento con actor.
//
// ⚠️ CON LA SESIÓN DEL USUARIO, como abrir-mes: la función comprueba es_staff()
// adentro (admin o secretario, decisión 6), que usa auth.uid().
//
// Body opcional: { regla_esperada: 'total' | 'mes1' } — lo que la pantalla le
// dijo a quien activa. Si la ficha cambió en medio, 409 y nada.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as { regla_esperada?: unknown }
    const esperada = body.regla_esperada
    if (esperada !== undefined && esperada !== null && esperada !== 'total' && esperada !== 'mes1') {
      return NextResponse.json({ error: "regla_esperada debe ser 'total' o 'mes1'" }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('curso_activar_segun_ficha', {
      p_inscripcion_id: params.id,
      p_regla_esperada: esperada ?? null,
    })
    if (error) {
      if (error.code === 'PGRST202') {
        return NextResponse.json({
          error: 'A esta base le falta la migración de «Activar según la ficha»: supabase/migrations/20260927130000_d8_activar_segun_ficha.sql (lista 7bis de SETUP.md).',
        }, { status: 503 })
      }
      const { status, mensaje } = errorDeRpcCurso(error)
      return NextResponse.json({ error: mensaje }, { status })
    }
    const fila = (Array.isArray(data) ? data[0] : data) as { regla?: string; acceso_total?: boolean; meses_desbloqueados?: number } | null
    return NextResponse.json({
      ok: true,
      regla: fila?.regla ?? null,
      acceso_total: fila?.acceso_total === true,
      meses_desbloqueados: fila?.meses_desbloqueados ?? null,
    })
  } catch (err) {
    console.error('[POST /api/admin/inscripciones/[id]/activar]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
