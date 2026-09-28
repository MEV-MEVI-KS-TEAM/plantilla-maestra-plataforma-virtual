import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoAcceso, tieneAccesoEvaluacion } from '@/lib/acceso-materias'
import { leerPreguntasEvaluacion, sanitizarPreguntaEvaluacion } from '@/lib/evaluaciones/examen-mensual'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const alumno = await cargarAlumnoAcceso(supabase, user.id)

    if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })

    const { data: evaluacion, error: evalError } = await supabase
      .from('evaluaciones')
      .select('id, titulo, intentos_permitidos, activa, materia_id, mes_id')
      .eq('id', params.id)
      .single()

    if (evalError || !evaluacion) {
      return NextResponse.json({ error: 'Evaluación no encontrada' }, { status: 404 })
    }

    const ev = evaluacion as {
      id: string
      titulo: string
      intentos_permitidos: number
      activa: boolean
      materia_id: string | null
      mes_id: string | null
    }

    if (!ev.activa) {
      return NextResponse.json({ error: 'Esta evaluación no está disponible' }, { status: 403 })
    }

    // ── Gate canon (lib/acceso-materias): el MISMO criterio que decide
    // `disponible` en /api/alumno/materias, para que lista y gate no diverjan.
    const acceso = await tieneAccesoEvaluacion(supabase, alumno, ev)
    if (!acceso) {
      return NextResponse.json({ error: 'No tienes acceso a esta evaluación' }, { status: 403 })
    }

    // D22d-1: intentos y preguntas con el service role, DESPUÉS del gate. La
    // clave nunca sale de aquí (lista blanca de lib/evaluaciones/examen-mensual) y
    // D22d-2 deja al alumno sin lectura directa de `preguntas`.
    const admin = createAdminClient()
    const { data: previos, error: prevErr } = await admin
      .from('intentos_evaluacion')
      .select('acreditado')
      .eq('alumno_id', alumno.id)
      .eq('evaluacion_id', params.id)
    if (prevErr) return NextResponse.json({ error: 'Error al leer tus intentos' }, { status: 500 })

    const usados = (previos ?? []).length
    // Aprobar CIERRA el examen (K-d2); sin intentos, también. Cerrado no se
    // sirve el banco: no hay nada que contestar.
    const estado: 'abierta' | 'aprobada' | 'sin_intentos' =
      (previos ?? []).some(r => (r as { acreditado: boolean }).acreditado) ? 'aprobada'
        : usados >= ev.intentos_permitidos ? 'sin_intentos'
          : 'abierta'

    let preguntas: ReturnType<typeof sanitizarPreguntaEvaluacion>[] = []
    if (estado === 'abierta') {
      // Solo las activas: una pregunta archivada deja de servirse, aunque lo
      // que el alumno ya respondió de ella se siga calificando igual.
      const leidas = await leerPreguntasEvaluacion(admin, params.id, { soloActivas: true })
      if (leidas.error) return NextResponse.json({ error: 'Error al cargar el examen' }, { status: 500 })
      preguntas = leidas.preguntas.map(sanitizarPreguntaEvaluacion)
    }

    return NextResponse.json({
      evaluacion: {
        id:            ev.id,
        titulo:        ev.titulo,
        titulo_en:     ev.titulo,
        tipo:          'final',
        intentos_max:  ev.intentos_permitidos,
      },
      intentos_usados: usados,
      estado,
      preguntas,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
