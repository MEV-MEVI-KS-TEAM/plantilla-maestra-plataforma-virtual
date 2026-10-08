import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoAcceso, tieneAccesoEvaluacion } from '@/lib/acceso-materias'
import { calificarEvaluacion, leerPreguntasEvaluacion, validarEnvio } from '@/lib/evaluaciones/examen-mensual'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Obtener alumno (schema nuevo: alumnos.id = user.id)
    const alumno = await cargarAlumnoAcceso(supabase, user.id)

    if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })

    // FIX #4: usar intentos_permitidos (no intentos_max), sin acceso por numero_mes
    const { data: evaluacion, error: evalError } = await supabase
      .from('evaluaciones')
      .select('id, titulo, intentos_permitidos, activa, materia_id, mes_id')
      .eq('id', params.id)
      .single()

    if (evalError || !evaluacion) {
      return NextResponse.json({ error: 'Evaluación no encontrada' }, { status: 404 })
    }

    const ev = evaluacion as {
      id: string; titulo: string; intentos_permitidos: number; activa: boolean
      materia_id: string | null; mes_id: string | null
    }

    if (!ev.activa) {
      return NextResponse.json({ error: 'Esta evaluación no está disponible' }, { status: 403 })
    }

    // ── Gate canon idéntico al GET de evaluacion/[id] (misma función en
    // lib/acceso-materias) — bloquear la vista pero no el submit dejaría el
    // hueco vivo: POST directo a evaluaciones no desbloqueadas.
    const acceso = await tieneAccesoEvaluacion(supabase, alumno, ev)
    if (!acceso) {
      return NextResponse.json({ error: 'No tienes acceso a esta evaluación' }, { status: 403 })
    }

    // D22d-1: intentos, preguntas (con la clave) y el INSERT del intento con el
    // service role, DESPUÉS del gate. D22d-2 le quita al alumno la escritura de
    // intentos_evaluacion por /rest/v1: con su sesión se fabricaba un «100».
    const admin = createAdminClient()
    const { data: previos, error: prevErr } = await admin
      .from('intentos_evaluacion')
      .select('acreditado')
      .eq('alumno_id', alumno.id)
      .eq('evaluacion_id', params.id)
    if (prevErr) return NextResponse.json({ error: 'Error al leer tus intentos' }, { status: 500 })

    // Aprobar CIERRA el examen (K-d2): un envío más no se califica ni trae revisión.
    if ((previos ?? []).some(r => (r as { acreditado: boolean }).acreditado)) {
      return NextResponse.json(
        { error: 'Ya aprobaste este examen: no se puede volver a presentar.' },
        { status: 409 }
      )
    }
    const usados = (previos ?? []).length
    if (usados >= ev.intentos_permitidos) {
      return NextResponse.json({ error: 'No tienes más intentos disponibles' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)

    // SIN filtro de `activa` a propósito: esto CALIFICA lo que el alumno ya
    // respondió. Si el admin archiva una pregunta con el examen abierto,
    // filtrar aquí le cambiaría la nota.
    const leidas = await leerPreguntasEvaluacion(admin, params.id, { soloActivas: false })
    if (leidas.error) {
      return NextResponse.json({ error: 'Error al obtener preguntas' }, { status: 500 })
    }
    const pregs = leidas.preguntas
    if (!pregs.some(p => p.activa !== false)) {
      return NextResponse.json({ error: 'Esta evaluación no tiene preguntas' }, { status: 409 })
    }
    const numeroIntento = usados + 1

    // R2 (soporte IVS, Bug 69): el envío se valida ANTES de calificar y de gastar
    // el intento, y tiene que venir COMPLETO (todas las preguntas activas, ids de
    // este examen, índices válidos). Un envío vacío era el oráculo; uno parcial,
    // con 3 intentos, sacaba «bits» de la clave. La pantalla ya lo exigía.
    const validado = validarEnvio(pregs, (body as { respuestas?: unknown } | null)?.respuestas)
    if (!validado.ok) {
      return NextResponse.json({ error: validado.error }, { status: 400 })
    }
    const respuestasAlumno: Record<string, unknown> = validado.respuestas

    // Primera pasada SIN revelar, solo para saber si aprobó. Se revela (✓/✗ y la
    // clave de lo contestado) solo si este envío CIERRA el examen: aprobó o era
    // su último intento (K-d2 + K-d3). Mientras pueda volver a presentar, ve su
    // puntaje y nada más.
    const previo = calificarEvaluacion(pregs, respuestasAlumno, { revelar: false })

    const revelar = previo.acreditado || numeroIntento >= ev.intentos_permitidos
    const { correctas, total: totalPregs, puntaje, acreditado, detalle } =
      revelar ? calificarEvaluacion(pregs, respuestasAlumno, { revelar: true }) : previo

    // FIX #4: insertar con columnas IVS — acreditado + puntaje + numero_intento
    const { error: intentoError } = await admin
      .from('intentos_evaluacion')
      .insert({
        alumno_id:     alumno.id,
        evaluacion_id: params.id,
        puntaje,
        acreditado,
        numero_intento: numeroIntento,
      })

    if (intentoError) {
      // 23505 = índice único (alumno, evaluación, numero_intento) de la R2: otro
      // envío simultáneo ya registró este intento. Nada de un intento de regalo.
      if (intentoError.code === '23505') {
        return NextResponse.json({ error: 'Este intento ya se registró. Recarga la página.' }, { status: 409 })
      }
      return NextResponse.json({ error: intentoError.message }, { status: 500 })
    }

    if (ev.materia_id) {
      console.log('[evaluacion/enviar] actualizando calificacion materia:', ev.materia_id, 'acreditado:', acreditado)

      const { data: existingCalif, error: califCheckErr } = await admin
        .from('calificaciones')
        .select('id, acreditado')
        .eq('alumno_id', alumno.id)
        .eq('materia_id', ev.materia_id)
        .maybeSingle()

      if (califCheckErr) {
        console.error('[evaluacion/enviar] calificaciones check falló:', califCheckErr.message)
      } else if (!existingCalif) {
        const { error: califInsErr } = await admin.from('calificaciones').insert({
          alumno_id:          alumno.id,
          materia_id:         ev.materia_id,
          evaluacion_id:      params.id,
          acreditado,
          fecha_acreditacion: acreditado ? new Date().toISOString() : null,
        })
        if (califInsErr) {
          console.error('[evaluacion/enviar] calificaciones insert falló:', califInsErr.code, califInsErr.message)
        } else {
          console.log('[evaluacion/enviar] calificaciones insert OK acreditado:', acreditado)
        }
      } else {
        const row = existingCalif as { id: string; acreditado: boolean }
        if (!row.acreditado && acreditado) {
          const { error: califUpdErr } = await admin.from('calificaciones')
            .update({ acreditado: true, evaluacion_id: params.id, fecha_acreditacion: new Date().toISOString() })
            .eq('id', row.id)
          if (califUpdErr) {
            console.error('[evaluacion/enviar] calificaciones update falló:', califUpdErr.code, califUpdErr.message)
          } else {
            console.log('[evaluacion/enviar] calificaciones actualizada a acreditado: true')
          }
        } else {
          console.log('[evaluacion/enviar] calificaciones sin cambio, acreditado existente:', row.acreditado)
        }
      }
    }

    // Logros: con el service role (R2: el alumno ya no inserta logros_alumno por /rest/v1).
    // Logro: primer examen
    if (usados === 0) {
      await admin
        .from('logros_alumno')
        .upsert(
          { alumno_id: alumno.id, tipo_logro: 'primer_examen' },
          { onConflict: 'alumno_id,tipo_logro', ignoreDuplicates: true }
        )
    }

    // Logro: examen perfecto
    if (puntaje === 100) {
      await admin
        .from('logros_alumno')
        .upsert(
          { alumno_id: alumno.id, tipo_logro: 'examen_perfecto' },
          { onConflict: 'alumno_id,tipo_logro', ignoreDuplicates: true }
        )
    }

    // ── Logros "Mes completado" y "Mitad del camino" ──────────────────────────
    // Existían en el catálogo de BadgesGrid pero NINGUNA ruta los otorgaba: eran
    // insaculables por diseño. Se calculan aquí, que es el único punto donde una
    // materia pasa a acreditada, con el mismo criterio que usa la palomita del
    // dashboard: acreditación real de las materias del mes.
    if (acreditado) {
      try {
        // `admin` de arriba es local a otro bloque; aqui se crea el propio.
        const adminLogros = createAdminClient()
        const { data: acreditadasRows } = await adminLogros
          .from('calificaciones')
          .select('materia_id')
          .eq('alumno_id', alumno.id)
          .eq('acreditado', true)
        const acreditadasSet = new Set((acreditadasRows ?? []).map(r => (r as { materia_id: string }).materia_id))

        // Materias del MISMO mes que la materia recién acreditada.
        const { data: mesDeEsta } = await adminLogros
          .from('meses_contenido')
          .select('numero_mes')
          .eq('materia_id', ev.materia_id)
        const numerosMes = (mesDeEsta ?? []).map(r => (r as { numero_mes: number }).numero_mes)

        if (numerosMes.length > 0) {
          // OJO: `meses_contenido` numera meses para TODOS los niveles a la vez,
          // así que hay que filtrar por el nivel del alumno. Sin ese filtro, el
          // mes 1 incluiría materias de secundaria, prepa y licenciatura y el
          // every() no se cumpliría nunca.
          // Y también por CARRERA: todas las de licenciatura comparten
          // `nivel`, así que sin este filtro el mes 1 de un alumno de un
          // programa incluiría las materias de los otros y el every() no se
          // cumpliría nunca. Mismo criterio que `cargarContextoAcceso()`.
          let hermanasQuery = adminLogros
            .from('meses_contenido')
            .select('materia_id, materias!inner(nivel, activa, carrera)')
            .in('numero_mes', numerosMes)
            .eq('materias.nivel', alumno.nivel)
            .eq('materias.activa', true)

          if (alumno.nivel === 'licenciatura' && alumno.carrera) {
            hermanasQuery = hermanasQuery.eq('materias.carrera', alumno.carrera)
          }

          const { data: hermanas } = await hermanasQuery
          const idsMes = [...new Set((hermanas ?? []).map(r => (r as { materia_id: string }).materia_id))]
          if (idsMes.length > 0 && idsMes.every(id => acreditadasSet.has(id))) {
            await adminLogros.from('logros_alumno').upsert(
              { alumno_id: alumno.id, tipo_logro: 'mes_completado' },
              { onConflict: 'alumno_id,tipo_logro', ignoreDuplicates: true })
          }
        }

        // Mitad del camino: la mitad de las materias regulares de SU plan.
        // Acotado por carrera además de por nivel: con dos programas de
        // licenciatura el conteo salía sobre el doble de materias, así que el
        // logro exigía el doble de acreditadas y no llegaba nunca.
        let totalQuery = adminLogros
          .from('materias')
          .select('id', { count: 'exact', head: true })
          .eq('nivel', alumno.nivel)
          .eq('activa', true)

        if (alumno.nivel === 'licenciatura' && alumno.carrera) {
          totalQuery = totalQuery.eq('carrera', alumno.carrera)
        }

        const { count: totalNivel } = await totalQuery
        if (totalNivel && acreditadasSet.size >= Math.ceil(totalNivel / 2)) {
          await adminLogros.from('logros_alumno').upsert(
            { alumno_id: alumno.id, tipo_logro: 'mitad_carrera' },
            { onConflict: 'alumno_id,tipo_logro', ignoreDuplicates: true })
        }
      } catch (e) {
        // Un logro no debe tumbar el envío del examen.
        console.error('[evaluacion/enviar] logros mes/mitad:', e)
      }
    }

    // Respuesta backward-compatible con el componente EDVEX
    return NextResponse.json({
      calificacion:    puntaje / 10, // escala 0-10 para compatibilidad
      aprobado:        acreditado,
      total_preguntas: totalPregs,
      correctas,
      intento_numero:  numeroIntento,
      intentos_restantes: Math.max(0, ev.intentos_permitidos - numeroIntento),
      // true = el examen se cerró con este envío: el detalle trae el ✓/✗ y la
      // clave de lo contestado. false = revisión diferida (solo el puntaje).
      revision_completa: revelar,
      detalle,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
