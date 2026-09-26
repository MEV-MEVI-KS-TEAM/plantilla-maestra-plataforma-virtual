import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  pagosPorCurso,
  repartirInscripciones,
  type InscripcionAlumno,
  type PagoCursoAlumno,
  type ResumenPagosCurso,
} from '@/lib/cursos/pagos-alumno'

// ─── GET /api/alumno/cursos/tiene — ¿el alumno tiene ≥1 curso accesible? ──────
// Alimenta la visibilidad del ítem de nav "Cursos y Diplomados" (solo si hay).
// La RLS "cursos: select inscritos o admin" hace que el SELECT de cursos devuelva
// solo cursos publicados en los que el alumno está inscrito.
//
// D20d (remate f): la MISMA regla que «Mis Diplomados» (GET /api/alumno/cursos).
// Una inscripción cancelada no cuenta como curso, salvo que tenga pagos: esa
// aparece en «Cursos cancelados» y el menú tiene que llevar ahí aunque el curso
// haya vuelto a borrador (el camino que D11 ofrece para retirar un curso con
// pagos). Sin esto, el menú llevaba a una página vacía o escondía lo pagado.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ tiene: false })

    // '*': `estado` llega con B1 (misma razón que en /api/alumno/cursos).
    const { data: filasRaw, error: errIns } = await supabase
      .from('curso_inscripciones')
      .select('*')
      .eq('alumno_id', user.id)
    if (errIns) {
      // Sin la tabla o sin permiso: como antes, lo que la RLS deje ver.
      const { data } = await supabase.from('cursos').select('id').limit(1)
      return NextResponse.json({ tiene: (data?.length ?? 0) > 0 })
    }
    const filas = (filasRaw ?? []) as InscripcionAlumno[]
    if (filas.length === 0) return NextResponse.json({ tiene: false })

    // Los pagos solo hacen falta si hay alguna cancelada (el caso común no los lee).
    let pagos: Map<string, ResumenPagosCurso> = new Map()
    if (filas.some(f => f.estado === 'cancelada')) {
      const admin = createAdminClient()
      const { data: pagosCurso, error: errPagos } = await admin
        .from('pagos')
        .select('curso_inscripcion_id, monto, fecha_pago, created_at')
        .eq('alumno_id', user.id)
        .not('curso_inscripcion_id', 'is', null)
      if (!errPagos) {
        pagos = pagosPorCurso(new Map(filas.map(i => [i.id, i.curso_id])), (pagosCurso ?? []) as PagoCursoAlumno[])
      }
    }

    const { vigentes, canceladas } = repartirInscripciones(filas, pagos)
    if (canceladas.length > 0) return NextResponse.json({ tiene: true })
    if (vigentes.length === 0) return NextResponse.json({ tiene: false })

    const { data } = await supabase.from('cursos').select('id').in('id', vigentes).limit(1)
    return NextResponse.json({ tiene: (data?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ tiene: false })
  }
}
