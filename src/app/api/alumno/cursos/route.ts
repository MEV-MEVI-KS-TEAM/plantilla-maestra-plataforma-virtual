import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { porcentajeProgreso } from '@/lib/cursos/progreso'
import { leccionesDeCurso, completadasDe, portadaFirmada, totalLeccionesDelCurso } from '@/lib/cursos/alumno-data'
import type { CatalogoAlumno, CursoCanceladoAlumno, CursoCatalogoItem } from '@/types/cursos-alumno'
import type { CursoTipo } from '@/types/cursos'
import {
  cursosConConstancia,
  pagosPorCurso as resumirPagos,
  repartirInscripciones,
  type InscripcionAlumno,
  type PagoCursoAlumno,
} from '@/lib/cursos/pagos-alumno'

// ─── GET /api/alumno/cursos — catálogo del alumno (RLS: publicados + inscrito) ─
// Responde { cursos, cancelados } (D20d, remate f): la cuadrícula SIN las
// inscripciones canceladas y, aparte, las canceladas a las que pagó algo.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Cursos a los que el alumno está inscrito (RLS select propio en inscripciones).
    // D20d: `*` y no 'id, curso_id, estado': `estado` llega con B1 y pedirla por
    // nombre tumbaría el catálogo en una base sin B1 (mismo precedente que D11).
    const { data: inscripciones } = await supabase
      .from('curso_inscripciones')
      .select('*')
      .eq('alumno_id', user.id)

    const admin = createAdminClient()
    const filas = (inscripciones ?? []) as InscripcionAlumno[]
    if (filas.length === 0) return NextResponse.json({ cursos: [], cancelados: [] } satisfies CatalogoAlumno)

    // D19 (#207-8, decisión 8): sus pagos de curso, por la FK (cliente admin y
    // SIEMPRE filtrando por el alumno de la sesión). Sin B1 (sin la columna) o si
    // falla, sin resumen: el catálogo sale como siempre.
    const cursoDeInscripcion = new Map(filas.map(i => [i.id, i.curso_id]))
    const { data: pagosCurso, error: errPagos } = await admin
      .from('pagos')
      .select('curso_inscripcion_id, monto, fecha_pago, created_at')
      .eq('alumno_id', user.id)
      .not('curso_inscripcion_id', 'is', null)
    // Sin la columna (42703, base sin B1) no hay pagos de curso; otro error se
    // registra (el alumno se vería como si no hubiera pagado).
    if (errPagos && errPagos.code !== '42703') console.error('[GET /api/alumno/cursos] pagos:', errPagos.message)
    const pagosPorCurso = errPagos
      ? new Map()
      : resumirPagos(cursoDeInscripcion, (pagosCurso ?? []) as PagoCursoAlumno[])

    // D20d (remate f): la cancelada sale de la cuadrícula; con pagos va al bloque
    // «Cursos cancelados». Si falló la lectura de pagos el mapa está vacío: la
    // cancelada sin constancia no sale en ninguno de los dos (falla hacia
    // ocultar); con constancia sale sin «Pagado», igual que las vigentes.
    // D20f: las canceladas con constancia YA emitida también van al bloque (con
    // enlace para verla). Se lee con la SESIÓN: la RLS «select propias» da solo
    // las suyas. Sin la tabla, ninguna.
    let conConstancia = new Set<string>()
    const idsCanceladas = filas.filter(f => f.estado === 'cancelada').map(f => f.id)
    if (idsCanceladas.length > 0) {
      const { data: consts, error: errConst } = await supabase
        .from('curso_constancias')
        .select('inscripcion_id')
        .in('inscripcion_id', idsCanceladas)
      if (!errConst) conConstancia = cursosConConstancia(filas, (consts ?? []) as Array<{ inscripcion_id: string | null }>)
      else if (errConst.code !== '42P01' && errConst.code !== 'PGRST205') console.error('[GET /api/alumno/cursos] constancias:', errConst.message)
    }

    const { vigentes, canceladas } = repartirInscripciones(filas, pagosPorCurso, conConstancia)

    // De las vigentes, la RLS "cursos: select inscritos o admin" devuelve solo los publicados
    const { data: cursos } = vigentes.length === 0
      ? { data: [] }
      : await supabase
        .from('cursos')
        .select('id, nombre, descripcion, tipo, portada_path, orden, created_at')
        .in('id', vigentes)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true })

    // D20d: nombre y tipo de las canceladas con el cliente ADMIN. La RLS de
    // `cursos` exige `publicado` y un curso con pagos puede volver a borrador
    // (el camino que D11 ofrece): con la sesión, lo pagado desaparecería. Es
    // seguro: los ids salen de SUS inscripciones y solo se leen nombre y tipo.
    const cancelados: CursoCanceladoAlumno[] = []
    if (canceladas.length > 0) {
      const { data: filasCanceladas, error: errCanceladas } = await admin
        .from('cursos')
        .select('id, nombre, tipo')
        .in('id', canceladas)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true })
      if (errCanceladas) console.error('[GET /api/alumno/cursos] cancelados:', errCanceladas.message)
      for (const c of filasCanceladas ?? []) {
        const pagos = pagosPorCurso.get(c.id as string) ?? null
        const constancia = conConstancia.has(c.id as string)
        if (!pagos && !constancia) continue
        cancelados.push({ id: c.id as string, nombre: c.nombre as string, tipo: c.tipo as CursoTipo, pagos, constancia })
      }
    }

    const items: CursoCatalogoItem[] = await Promise.all(
      (cursos ?? []).map(async curso => {
        const lecciones = await leccionesDeCurso(supabase, curso.id as string)
        const leccionIds = lecciones.map(l => l.leccionId)
        const completadas = await completadasDe(supabase, user.id, leccionIds)
        // Denominador = curso completo (ver totalLeccionesDelCurso). Contar solo
        // lo visible haría que la barra del catálogo llegara al 100 % con un mes
        // pagado.
        const total = await totalLeccionesDelCurso(admin, curso.id as string)
        return {
          id: curso.id as string,
          nombre: curso.nombre as string,
          descripcion: (curso.descripcion as string | null) ?? null,
          tipo: curso.tipo as CursoTipo,
          portadaUrl: await portadaFirmada(supabase, curso.portada_path as string | null),
          totalLecciones: total,
          completadas: completadas.size,
          porcentaje: porcentajeProgreso(completadas.size, total),
          pagos: pagosPorCurso.get(curso.id as string) ?? null,
        }
      })
    )

    return NextResponse.json({ cursos: items, cancelados } satisfies CatalogoAlumno)
  } catch (err) {
    console.error('[GET /api/alumno/cursos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
