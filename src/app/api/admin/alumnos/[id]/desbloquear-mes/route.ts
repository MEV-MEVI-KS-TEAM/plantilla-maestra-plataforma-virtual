import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'
import { getMesesByModalidad } from '@/lib/modalidades'
import {
  AVISO_CAMBIO_EN_MEDIO, errorRpcMes, leerCuerpoMes, sinRpcMes, type FilaMoverMes,
} from '@/lib/meses-programa'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── Verificar sesión ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Staff: admin o secretario (D7b, decisión 6: el secretario también abre) ─
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    // D20a: lo que la ficha vio (`antes`) y el id de la operación (uno por
    // apertura del modal). Una ficha vieja no los manda: se usa lo leído.
    const cuerpo = leerCuerpoMes(await request.json().catch(() => null))

    // ── Usar service role para saltarse RLS ───────────────────────────────────
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // #187: esta ruta es de ALUMNOS. Sobre personal (admin o secretario) o sobre
    // uno mismo → 403, con el rol leído de la BD y ANTES de escribir nada.
    const objetivo = await cargarAlumnoObjetivo(admin, params.id, user.id)
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    // ── Obtener alumno ────────────────────────────────────────────────────────
    const { data: alumno, error: fetchError } = await admin
      .from('alumnos')
      .select('id, meses_desbloqueados, modalidad, nivel')
      .eq('id', objetivo.alumno.id)
      .single()

    if (fetchError || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    const a = alumno as { id: string; meses_desbloqueados: number; modalidad?: string; nivel?: string }

    // B7 — `alumnos.meses_desbloqueados` es la ventana del PROGRAMA, una columna
    // DISTINTA de `curso_inscripciones.meses_desbloqueados`, que es la que
    // gobierna el acceso al diplomado. Abrir aquí un mes a un alumno de
    // diplomado no le libera ni un módulo: solo ensucia el dato y contamina el
    // promedio de meses del reporte. Se cierra en el servidor, no en la UI.
    if (a.nivel === 'diplomado') {
      return NextResponse.json(
        { error: 'Este alumno no cursa un programa. Los meses de su diplomado se abren desde la ficha del curso.' },
        { status: 400 }
      )
    }

    const duracion = getMesesByModalidad(a.modalidad)
    const actual = a.meses_desbloqueados ?? 0
    const antes = cuerpo.antes ?? actual

    // El gemelo de un doble clic que llega DESPUÉS del primero ve «ya todos»
    // aquí solo si era el último mes; si no, lo resuelve la RPC (repetido).
    if (actual >= duracion && cuerpo.operacionId === null) {
      return NextResponse.json({ error: 'Todos los meses ya están desbloqueados' }, { status: 400 })
    }

    // ── D20a: un solo escritor (solo el servidor; el actor es quien abre) ─────
    // Candado de fila, idempotente por operacion_id, 409 (PT409) si el alumno
    // cambió en medio, y el evento en la bitácora con nombre y rol.
    const { data, error: rpcError } = await admin.rpc('alumno_mover_mes', {
      p_alumno_id:    objetivo.alumno.id,
      p_accion:       'abrir',
      p_antes:        antes,
      p_tope:         duracion,
      p_operacion_id: cuerpo.operacionId ?? randomUUID(),
      p_actor:        user.id,
    })

    if (rpcError && sinRpcMes(rpcError)) {
      // Base sin la migración D20a: se abre como antes, pero SOLO si el alumno
      // sigue con lo que la ficha vio (un doble clic no suma dos meses). Sin
      // bitácora: la ficha no pinta «Último: …».
      if (actual >= duracion) {
        return NextResponse.json({ error: 'Todos los meses ya están desbloqueados' }, { status: 400 })
      }
      if (antes !== actual) {
        return NextResponse.json({ error: AVISO_CAMBIO_EN_MEDIO }, { status: 409 })
      }
      console.warn('[POST desbloquear-mes] sin la migración D20a (alumno_mover_mes): se abre sin bitácora')
      const nuevoMes = antes + 1
      const { data: filas, error: updateError } = await admin
        .from('alumnos')
        .update({ meses_desbloqueados: nuevoMes })
        .eq('id', objetivo.alumno.id)
        .eq('meses_desbloqueados', antes)
        .select('id')
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
      if (!filas || filas.length === 0) {
        return NextResponse.json({ error: AVISO_CAMBIO_EN_MEDIO }, { status: 409 })
      }
      return NextResponse.json({ success: true, meses_desbloqueados: nuevoMes, repetido: false, bitacora: false })
    }

    if (rpcError) {
      const { status, mensaje } = errorRpcMes(rpcError)
      if (status === 500) console.error('[POST desbloquear-mes] alumno_mover_mes:', rpcError.code, rpcError.message)
      return NextResponse.json({ error: mensaje }, { status })
    }

    const fila = (Array.isArray(data) ? data[0] : data) as FilaMoverMes | null
    if (!fila) return NextResponse.json({ error: 'No se pudo abrir el mes. Intenta de nuevo.' }, { status: 500 })

    return NextResponse.json({
      success:             true,
      meses_desbloqueados: fila.meses_ahora,
      mes:                 fila.mes_movido,
      // Doble clic (o reintento): la operación ya se había hecho y no se abrió otro mes.
      repetido:            fila.repetido,
      bitacora:            true,
      evento: {
        accion: 'abrir', mes: fila.mes_movido, antes: fila.meses_antes, despues: fila.meses_ahora,
        actor_nombre: fila.quien, actor_rol: fila.quien_rol, created_at: fila.cuando,
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/alumnos/[id]/desbloquear-mes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
