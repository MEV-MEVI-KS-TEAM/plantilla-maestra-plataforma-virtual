import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { getMateriasPorMesByModalidad, getMateriasPorMesLicenciatura } from '@/lib/modalidades'
import { rangoMateriasDelMes } from '@/lib/acceso-materias'
import {
  AVISO_CAMBIO_EN_MEDIO, errorRpcMes, leerCuerpoMes, sinRpcMes, type FilaMoverMes,
} from '@/lib/meses-programa'

/**
 * Quita el último mes desbloqueado del alumno.
 *
 * NO BORRA NADA. Hasta este cambio hacía cuatro DELETE duros —quiz_respuestas,
 * progreso_semanas, intentos_evaluacion y calificaciones— sin respaldo, sin
 * bitácora y sin filtrar `acreditado`, así que se llevaba por delante materias
 * YA GANADAS. Medido en IVS con `pg_stat_statements`: 6 ejecuciones, 7
 * calificaciones y 7 intentos destruidos; el alumno IVS-2026-0020 perdió su
 * mes 2 completo y tuvo que rehacerlo tres meses después. Ese proyecto no
 * tenía PITR ni respaldos, así que no hubo nada que restaurar.
 *
 * Borrar nunca fue necesario para revocar el acceso: la ventana de
 * `lib/acceso-materias` ya oculta lo no pagado, y el canon del Bug 54 dice que
 * una acreditada ganada se respeta (sigue legible y conserva su constancia).
 * Bajar `meses_desbloqueados` basta.
 *
 * REGLA: ninguna acción de admin borra avance del alumno. Si algún día hace
 * falta un "reiniciar avance", va como acción aparte, con respaldo previo,
 * confirmación explícita y jamás sobre filas con `acreditado = true`.
 *
 * D20a: la única escritura va por public.alumno_mover_mes() (solo el servidor,
 * con quien cierra como actor): candado de fila, idempotente por
 * `operacion_id`, 40001 si el alumno cambió en medio y el evento en la
 * bitácora (alumno_mes_eventos).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── Verificar sesión ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Staff: admin o secretario, igual que desbloquear-mes (D7b, decisión 6) ─
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    // D20a: lo que la ficha vio y el id de la operación (uno por apertura del modal).
    const cuerpo = leerCuerpoMes(await request.json().catch(() => null))

    // ── Admin client con service role (bypassa RLS) ───────────────────────────
    const admin = createAdminClient()

    const alumnoId = params.id

    // ── Obtener alumno ────────────────────────────────────────────────────────
    const { data: alumnoData, error: alumnoErr } = await admin
      .from('alumnos')
      .select('id, nivel, carrera, modalidad, meses_desbloqueados')
      .eq('id', alumnoId)
      .single()

    if (alumnoErr || !alumnoData) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    const alumno = alumnoData as {
      id: string
      nivel: string
      /** Solo licenciatura. Acota las materias del mes a SU programa. */
      carrera: string | null
      modalidad: string | null
      meses_desbloqueados: number
    }

    const actual = alumno.meses_desbloqueados ?? 0
    const antes = cuerpo.antes ?? actual

    if (actual <= 0 && cuerpo.operacionId === null) {
      return NextResponse.json(
        { error: 'No hay meses que quitar' },
        { status: 400 }
      )
    }

    // El mes que la ficha pidió quitar (el último que vio abierto).
    const mesAQuitar = antes

    // ── Materias del mes: SOLO para nombrarlas en la respuesta ────────────────
    // Best-effort. Antes este bloque decidía QUÉ SE BORRABA y un rango vacío
    // devolvía 400 ("No se encontraron materias para este mes"); ahora no
    // bloquea nada: si los nombres no se resuelven, el mes se quita igual.
    let materiasDelMes: string[] = []
    try {
      const materiasPorMes = (alumno.nivel === 'licenciatura'
        ? getMateriasPorMesLicenciatura(alumno.modalidad)
        : undefined) ?? getMateriasPorMesByModalidad(alumno.modalidad)
      const { desde, hasta } = rangoMateriasDelMes(mesAQuitar, materiasPorMes)

      let materiasQuery = admin
        .from('materias')
        .select('id, nombre')
        .eq('nivel', alumno.nivel)
        .eq('activa', true)

      if (alumno.nivel === 'licenciatura' && alumno.carrera) {
        materiasQuery = materiasQuery.eq('carrera', alumno.carrera)
      }

      const { data: materias } = await materiasQuery
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true })
        .range(desde, hasta)

      materiasDelMes = ((materias ?? []) as { id: string; nombre: string }[]).map(m => m.nombre)
    } catch {
      materiasDelMes = []
    }

    // ── Única escritura: bajar el contador de meses pagados (D20a) ────────────
    const { data, error: rpcError } = await admin.rpc('alumno_mover_mes', {
      p_alumno_id:    alumnoId,
      p_accion:       'cerrar',
      p_antes:        antes,
      p_tope:         null,
      p_operacion_id: cuerpo.operacionId ?? randomUUID(),
      p_actor:        user.id,
    })

    if (rpcError && sinRpcMes(rpcError)) {
      // Base sin la migración D20a: se cierra como antes, pero SOLO si el
      // alumno sigue con lo que la ficha vio (un doble clic no quita dos meses).
      if (actual <= 0) {
        return NextResponse.json({ error: 'No hay meses que quitar' }, { status: 400 })
      }
      if (antes !== actual) {
        return NextResponse.json({ error: AVISO_CAMBIO_EN_MEDIO }, { status: 409 })
      }
      console.warn('[POST cerrar-mes] sin la migración D20a (alumno_mover_mes): se cierra sin bitácora')
      const nuevoMes = antes - 1
      const { data: filas, error: updateErr } = await admin
        .from('alumnos')
        .update({ meses_desbloqueados: nuevoMes })
        .eq('id', alumnoId)
        .eq('meses_desbloqueados', antes)
        .select('id')

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
      if (!filas || filas.length === 0) {
        return NextResponse.json({ error: AVISO_CAMBIO_EN_MEDIO }, { status: 409 })
      }

      return NextResponse.json({
        success:                    true,
        mes_quitado:                mesAQuitar,
        mes_cerrado:                mesAQuitar, // compat con clientes viejos
        materias_del_mes:           materiasDelMes,
        materias_cerradas:          materiasDelMes, // compat
        avance_conservado:          true,
        meses_desbloqueados_actual: nuevoMes,
        repetido:                   false,
        bitacora:                   false,
      })
    }

    if (rpcError) {
      const { status, mensaje } = errorRpcMes(rpcError)
      if (status === 500) console.error('[POST cerrar-mes] alumno_mover_mes:', rpcError.code, rpcError.message)
      return NextResponse.json({ error: mensaje }, { status })
    }

    const fila = (Array.isArray(data) ? data[0] : data) as FilaMoverMes | null
    if (!fila) return NextResponse.json({ error: 'No se pudo quitar el mes. Intenta de nuevo.' }, { status: 500 })

    return NextResponse.json({
      success:                    true,
      mes_quitado:                fila.mes_movido,
      mes_cerrado:                fila.mes_movido, // compat con clientes viejos
      materias_del_mes:           materiasDelMes,
      materias_cerradas:          materiasDelMes, // compat
      avance_conservado:          true,
      meses_desbloqueados_actual: fila.meses_ahora,
      // Doble clic (o reintento): ya se había quitado y no se quitó otro.
      repetido:                   fila.repetido,
      bitacora:                   true,
      evento: {
        accion: 'cerrar', mes: fila.mes_movido, antes: fila.meses_antes, despues: fila.meses_ahora,
        actor_nombre: fila.quien, actor_rol: fila.quien_rol, created_at: fila.cuando,
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/alumnos/[id]/cerrar-mes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
