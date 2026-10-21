import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoAcceso, cargarContextoAcceso, tieneAccesoMateria } from '@/lib/acceso-materias'
import { firmarVideoUrl } from '@/lib/video/bunny-firma'
import { faltanColumnasActividades, leerActividades, urlPdf } from '@/components/actividades/datos'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar sesión con el cliente de usuario
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

    // Usar admin client para todas las queries de BD (bypassa RLS)
    const admin = createAdminClient()

    // ── 1. Alumno: nivel + meses desbloqueados ────────────────────────────────
    const alumno = await cargarAlumnoAcceso(admin, user.id)

    if (!alumno) return Response.json({ error: 'Alumno no encontrado' }, { status: 404 })

    // ── 2. Materia ────────────────────────────────────────────────────────────
    // `cuaderno_pdf_url` (actividades, 20261021120000) se pide aparte del resto:
    // una base sin esa migración responde 42703 y la materia se lee como antes.
    const COLUMNAS_MATERIA = 'id, nombre, descripcion, nivel, icono, color, activa'
    const leerMateria = (columnas: string) => admin
      .from('materias')
      .select(columnas)
      .eq('id', params.id)
      .single()
    const conCuaderno = await leerMateria(`${COLUMNAS_MATERIA}, cuaderno_pdf_url`)
    const materiaData = faltanColumnasActividades(conCuaderno.error)
      ? (await leerMateria(COLUMNAS_MATERIA)).data
      : conCuaderno.data

    if (!materiaData) return Response.json({ error: 'Materia no encontrada' }, { status: 404 })

    const materia = materiaData as unknown as {
      id: string; nombre: string; descripcion: string | null
      nivel: string; icono: string | null; color: string | null; activa: boolean
      cuaderno_pdf_url?: string | null
    }

    // ── 3. Control de acceso ──────────────────────────────────────────────────
    // Criterio canon único (lib/acceso-materias): el MISMO que decide
    // `disponible` en /api/alumno/materias, para que lista y gate no diverjan.
    const { materias: catalogo, acreditadas } = await cargarContextoAcceso(
      admin, user.id, alumno
    )
    const acceso = tieneAccesoMateria(alumno, materia, catalogo, acreditadas)

    if (!acceso.acceso) {
      const mensaje =
        acceso.motivo === 'nivel_distinto'
          ? 'Esta materia no corresponde a tu nivel'
          : acceso.motivo === 'sin_meses'
            ? 'Aún no tienes meses desbloqueados. Contacta a tu administrador.'
            : 'Esta materia aún no está disponible en tu progreso mensual.'
      return Response.json({ error: mensaje }, { status: 403 })
    }

    // ── 4. Meses del contenido → Semanas ──────────────────────────────────────
    // Solo lo ACTIVO: un mes o una semana archivados dejan de servirse al
    // alumno, aunque su progreso, sus notas y sus respuestas sigan intactos.
    // El nivel de meses se filtra en la propia query (es el select raíz); el de
    // semanas, en el .map() de abajo — filtrar un embed anidado con .eq()
    // haría desaparecer el mes ENTERO en cuanto una de sus semanas se archive.
    //
    // Las actividades interactivas y su PDF (20261021120000) viajan con la
    // semana: ya pasaron el control de acceso del paso 3. Sin la migración
    // (42703) se reintenta sin ellas y la materia se ve exactamente como antes.
    const leerMeses = (conActividades: boolean) => admin
      .from('meses_contenido')
      .select(`
        id, numero_mes, titulo, descripcion,
        semanas ( id, numero_semana, titulo, descripcion, contenido, video_url, video_url_2, video_url_3, tiempo_estimado_minutos, activa,${conActividades ? ' actividades, actividades_pdf_url,' : ''} semana_materiales ( id, nombre, tamano_bytes, orden, created_at ) )
      `)
      .eq('materia_id', params.id)
      .eq('activa', true)
      .order('numero_mes')
    const conActividades = await leerMeses(true)
    const mesesData = faltanColumnasActividades(conActividades.error)
      ? (await leerMeses(false)).data
      : conActividades.data

    type SemanaRow = {
      id: string; numero_semana: number; titulo: string
      descripcion: string | null; contenido: string | null
      video_url: string | null; video_url_2: string | null; video_url_3: string | null
      tiempo_estimado_minutos: number
      activa: boolean
      actividades?: unknown
      actividades_pdf_url?: string | null
      semana_materiales: { id: string; nombre: string; tamano_bytes: number | null; orden: number | null; created_at: string }[]
    }
    type MesRow = {
      id: string; numero_mes: number; titulo: string; descripcion: string | null
      semanas: SemanaRow[]
    }

    const meses = ((mesesData ?? []) as unknown as MesRow[]).map(mes => ({
      ...mes,
      semanas: (mes.semanas ?? [])
        .filter(s => s.activa !== false)
        .sort((a, b) => a.numero_semana - b.numero_semana),
    }))

    // Aplanar: todas las semanas de todos los meses en orden
    const semanas = meses.flatMap(mes =>
      mes.semanas.map(s => ({
        id:          s.id,
        // Compatibilidad con la página (usa .numero y .titulo)
        numero:      s.numero_semana,
        titulo:      s.titulo,
        titulo_en:   s.titulo,
        contenido:   s.contenido ?? s.descripcion ?? '',
        contenido_en: s.contenido ?? s.descripcion ?? '',
        url_en:      '',
        // Un video NO es la semana: no heredan ni su titulo ni su tiempo estimado.
        // Antes se copiaba `s.titulo` a los tres (tres tarjetas con el mismo nombre,
        // escondiendo videos distintos) y `s.tiempo_estimado_minutos` a cada uno,
        // que el encabezado sumaba: 3 videos x 60 min = "180 min de videos" para
        // una semana estimada en 60. El titulo real lo muestra el propio reproductor.
        // Bunny Stream se firma AQUÍ, después del control de acceso del paso 3:
        // la URL firmada es la llave del video por 6 horas. YouTube/Vimeo/Loom
        // salen tal cual. Sin BUNNY_* en el servidor sale la canónica sin firma
        // y VideoEmbed pinta "Video no disponible por el momento".
        videos:      [s.video_url, s.video_url_2, s.video_url_3]
          .filter(Boolean)
          .map((url, i, arr) => {
            const firmada = firmarVideoUrl(url as string, 'api/alumno/materia')
            return {
              titulo:    arr.length > 1 ? `Video ${i + 1} de ${arr.length}` : 'Video de la semana',
              titulo_en: arr.length > 1 ? `Video ${i + 1} of ${arr.length}` : 'Week video',
              url:       firmada,
              url_en:    firmada,
              duracion:  '',
            }
          }),
        materiales: (s.semana_materiales ?? [])
          .slice()
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || String(a.created_at).localeCompare(String(b.created_at)))
          .map(m => ({ id: m.id, nombre: m.nombre, tamano_bytes: m.tamano_bytes })),
        // null = no hay (o no tiene la forma «actividades/1» / no es https): la
        // página no pinta nada. Ver src/components/actividades/datos.ts.
        actividades:         leerActividades(s.actividades),
        actividades_pdf_url: urlPdf(s.actividades_pdf_url),
      }))
    )

    // ── 5. Evaluaciones + intentos del alumno ─────────────────────────────────
    const { data: evalData } = await admin
      .from('evaluaciones')
      .select('id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa')
      .eq('materia_id', params.id)
      .eq('activa', true)

    type EvalRow = {
      id: string; titulo: string; descripcion: string | null
      tiempo_limite_minutos: number; intentos_permitidos: number; activa: boolean
    }

    const evaluaciones = await Promise.all(
      ((evalData ?? []) as unknown as EvalRow[]).map(async ev => {
        const { count: intentosUsados } = await admin
          .from('intentos_evaluacion')
          .select('id', { count: 'exact', head: true })
          .eq('alumno_id', user.id)
          .eq('evaluacion_id', ev.id)

        const { data: aprobado } = await admin
          .from('intentos_evaluacion')
          .select('puntaje')
          .eq('alumno_id', user.id)
          .eq('evaluacion_id', ev.id)
          .eq('acreditado', true)
          .limit(1)
          .single()

        return {
          id:                       ev.id,
          titulo:                   ev.titulo,
          titulo_en:                ev.titulo,
          tipo:                     'final',
          intentos_max:             ev.intentos_permitidos,
          intentos_usados:          intentosUsados ?? 0,
          aprobada:                 !!aprobado,
          calificacion_aprobatoria: aprobado?.puntaje ?? null,
          activa:                   ev.activa,
        }
      })
    )

    // ── 6. Respuesta con forma compatible con la página ───────────────────────
    return Response.json({
      id:              materia.id,
      nivel:           materia.nivel,
      codigo:          '',
      nombre:          materia.nombre,
      nombre_en:       materia.nombre,
      color_hex:       materia.color ?? '#1565C0',
      descripcion:     materia.descripcion ?? '',
      descripcion_en:  materia.descripcion ?? '',
      objetivo:        materia.descripcion ?? '',
      objetivo_en:     materia.descripcion ?? '',
      temario:         [],
      temario_en:      [],
      bibliografia:    [],
      bibliografia_en: [],
      semanas,
      evaluaciones,
      // Licenciaturas: la misma URL del cuaderno de la carrera en todas sus materias.
      cuaderno_pdf_url: urlPdf(materia.cuaderno_pdf_url),
    })
  } catch (err) {
    console.error('[api/alumno/materia/[id]]', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
