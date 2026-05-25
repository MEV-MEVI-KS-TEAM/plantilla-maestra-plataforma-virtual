import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Alumno: nivel + meses desbloqueados ──────────────────────────────────
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('nivel, meses_desbloqueados, modalidad, duracion_meses')
      .eq('id', user.id)
      .single()

    if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })

    const row = alumno as {
      nivel: string
      meses_desbloqueados: number
      modalidad?: string | null
      duracion_meses?: number | null
    }
    const nivel              = row.nivel
    const mesesDesbloqueados = row.meses_desbloqueados ?? 0

    // ── Materias del nivel del alumno con meses y semanas ───────────────────
    const { data: materias, error } = await supabase
      .from('materias')
      .select(`
        id,
        nombre,
        descripcion,
        nivel,
        orden,
        icono,
        color,
        activa,
        meses_contenido (
          id,
          numero_mes,
          titulo,
          semanas ( id )
        )
      `)
      .or(`nivel.eq.${nivel},nivel.eq.demo`)
      .eq('activa', true)
      .order('orden')

    if (error) {
      console.error('[api/alumno/materias] query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    type MesRow    = { id: string; numero_mes: number; titulo: string; semanas: { id: string }[] }
    type MateriaRow = {
      id: string; nombre: string; descripcion: string | null
      nivel: string; orden: number | null; icono: string | null; color: string | null
      activa: boolean; meses_contenido: MesRow[]
    }

    const sorted = ([...((materias ?? []) as unknown as MateriaRow[])] as MateriaRow[]).sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
    )

    const result = sorted.map(mat => {
      const meses        = mat.meses_contenido ?? []
      const totalSemanas = meses.reduce((acc, mes) => acc + (mes.semanas?.length ?? 0), 0)
      const esTutorial   = mat.nivel === 'demo' || mat.nombre.toLowerCase().includes('tutor')
      const numeroMes    = meses.length > 0 ? Math.min(...meses.map(m => m.numero_mes)) : 1

      // Tutoría: siempre visible (estándar MEV)
      if (esTutorial) {
        return {
          id:             mat.id,
          nombre:         mat.nombre,
          descripcion:    mat.descripcion ?? null,
          icono:          mat.icono       ?? '📚',
          color:          mat.color       ?? '#1565C0',
          orden:          mat.orden       ?? 0,
          numero_mes:     numeroMes,
          total_meses:    meses.length,
          total_semanas:  totalSemanas,
          disponible:     true,
        }
      }

      // Materia regular: gating por mes (numero_mes <= meses_desbloqueados)
      const disponible = numeroMes <= mesesDesbloqueados

      return {
        id:             mat.id,
        nombre:         mat.nombre,
        descripcion:    mat.descripcion ?? null,
        icono:          mat.icono       ?? '📚',
        color:          mat.color       ?? '#1565C0',
        orden:          mat.orden       ?? 0,
        numero_mes:     numeroMes,
        total_meses:    meses.length,
        total_semanas:  totalSemanas,
        disponible,
      }
    })

    return NextResponse.json({
      materias:            result,
      meses_desbloqueados: mesesDesbloqueados,
      nivel,
    })
  } catch (err) {
    console.error('[api/alumno/materias]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
