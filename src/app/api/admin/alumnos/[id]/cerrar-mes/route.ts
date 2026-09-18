import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMateriasPorMesByModalidad, getMateriasPorMesLicenciatura } from '@/lib/modalidades'
import { rangoMateriasDelMes } from '@/lib/acceso-materias'

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
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── Verificar sesión ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Verificar rol ADMIN (case-insensitive, igual que desbloquear-mes) ─────
    const { data: usuarioAdmin } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const esAdmin = (usuarioAdmin?.rol as string | undefined)?.toLowerCase() === 'admin'
    if (!esAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

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

    if (alumno.meses_desbloqueados <= 0) {
      return NextResponse.json(
        { error: 'No hay meses que quitar' },
        { status: 400 }
      )
    }

    const mesAQuitar = alumno.meses_desbloqueados

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

    // ── Única escritura: bajar el contador de meses pagados ───────────────────
    const nuevoMes = alumno.meses_desbloqueados - 1

    const { error: updateErr } = await admin
      .from('alumnos')
      .update({ meses_desbloqueados: nuevoMes })
      .eq('id', alumnoId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success:                    true,
      mes_quitado:                mesAQuitar,
      mes_cerrado:                mesAQuitar, // compat con clientes viejos
      materias_del_mes:           materiasDelMes,
      materias_cerradas:          materiasDelMes, // compat
      avance_conservado:          true,
      meses_desbloqueados_actual: nuevoMes,
    })
  } catch (err) {
    console.error('[POST /api/admin/alumnos/[id]/cerrar-mes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
