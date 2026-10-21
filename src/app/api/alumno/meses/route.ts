import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMesesByModalidad, getMateriasPorMesByModalidad } from '@/lib/modalidades'
import {
  cargarContextoAcceso, esTutorial, materiasPorMesDePlan, ordenarCanonico, rangoMateriasDelMes,
} from '@/lib/acceso-materias'

const DEMO_MATERIA_ID = 'f0551b82-1c3e-4286-bfb4-878842bc6eff' // nivel='demo' — Tutoría de Ingreso I

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Resolver datos del alumno (schema antiguo o nuevo) ────────────────────
    let mesesDesbloqueados = 0
    let inscripcionPagada  = false
    let duracionMeses      = 0
    let alumnoEncontrado   = false

    let nivelAlumno: string | null = null
    let modalidadAlumno: string | undefined
    // Solo licenciatura: sin esto los meses salen de las materias de TODAS las
    // carreras y el alumno de Derecho ve los meses de Administración.
    let carreraAlumno: string | null = null

    // Intento 1: schema antiguo (alumnos.usuario_id)
    const { data: a1 } = await supabase
      .from('alumnos')
      .select('meses_desbloqueados, inscripcion_pagada, nivel, planes_estudio(duracion_meses)')
      .eq('usuario_id', user.id)
      .single()

    if (a1) {
      alumnoEncontrado  = true
      const row = a1 as unknown as {
        meses_desbloqueados: number
        inscripcion_pagada: boolean
        nivel?: string | null
        planes_estudio: { duracion_meses: number } | null
      }
      mesesDesbloqueados = row.meses_desbloqueados ?? 0
      inscripcionPagada  = row.inscripcion_pagada  ?? false
      duracionMeses      = row.planes_estudio?.duracion_meses ?? 6
      nivelAlumno        = row.nivel ?? null
    }

    // Intento 2: schema nuevo (alumnos.id = user.id)
    if (!alumnoEncontrado) {
      const { data: a2 } = await supabase
        .from('alumnos')
        .select('meses_desbloqueados, inscripcion_pagada, modalidad, nivel, carrera, duracion_meses')
        .eq('id', user.id)
        .single()

      if (a2) {
        alumnoEncontrado = true
        const row = a2 as unknown as {
          meses_desbloqueados: number
          inscripcion_pagada: boolean
          modalidad?: string
          nivel?: string | null
          carrera?: string | null
          duracion_meses?: number | null
        }
        mesesDesbloqueados = row.meses_desbloqueados ?? 0
        inscripcionPagada  = row.inscripcion_pagada  ?? false
        duracionMeses      = row.duracion_meses ?? getMesesByModalidad(row.modalidad)
        nivelAlumno        = row.nivel ?? null
        modalidadAlumno    = row.modalidad
        carreraAlumno      = row.carrera ?? null
      }
    }

    // Sin perfil → modo demo
    if (!alumnoEncontrado) {
      return NextResponse.json({ demo: true, materia_demo_id: DEMO_MATERIA_ID })
    }

    // Sin pago y sin meses → modo demo
    if (!inscripcionPagada && mesesDesbloqueados === 0) {
      return NextResponse.json({ demo: true, materia_demo_id: DEMO_MATERIA_ID })
    }

    // ── Schema nuevo: el mes sale de la POSICIÓN de la materia en el plan ────
    // Mismo índice que la ventana de acceso (calcularDisponibilidad): el seed
    // reparte meses_contenido.numero_mes para el plan de REFERENCIA (6 meses en
    // Sec/Prepa, el más largo en licenciatura). Con el plan corto, el corte
    // `numero_mes <= duración` de abajo dejaba fuera la mitad del programa
    // aunque la ventana lo tuviera abierto: el alumno de 3 meses solo veía las
    // materias 1-6 en su tablero (TICKET-2026-10-12-08, EDUCOOP).
    if (nivelAlumno && modalidadAlumno) {
      const alumnoAcc = {
        nivel: nivelAlumno, modalidad: modalidadAlumno, carrera: carreraAlumno,
        duracion_meses: duracionMeses, meses_desbloqueados: mesesDesbloqueados,
      }
      const { materias } = await cargarContextoAcceso(supabase, user.id, alumnoAcc)
      const delNivel   = ordenarCanonico(materias.filter(m => m.nivel === nivelAlumno))
      const regulares  = delNivel.filter(m => !esTutorial(m))
      const tutoriales = delNivel.filter(m => esTutorial(m))

      if (regulares.length > 0) {
        const mpm = materiasPorMesDePlan(alumnoAcc, regulares.length)
        const { data: colores } = await supabase
          .from('materias').select('id, color').in('id', delNivel.map(m => m.id))
        const colorDe = new Map(((colores ?? []) as { id: string; color: string | null }[]).map(x => [x.id, x.color]))
        const item = (m: { id: string; nombre: string }) =>
          ({ id: m.id, codigo: '', nombre: m.nombre, color_hex: colorDe.get(m.id) ?? '#1565C0' })

        const total = duracionMeses || 6
        return NextResponse.json(Array.from({ length: total }, (_, i) => {
          const n = i + 1
          const { desde, hasta } = rangoMateriasDelMes(n, mpm)
          // El último mes se queda con el remanente si el reparto no es exacto.
          const mats = regulares.slice(desde, n === total ? regulares.length : hasta + 1).map(item)
          if (n === 1) mats.unshift(...tutoriales.map(item))
          return {
            id:           mats[0]?.id ?? `mes-resumen-${n}`,
            numero:       n,
            numero_mes:   n,
            titulo:       `Mes ${n}`,
            materias:     mats,
            desbloqueado: n <= mesesDesbloqueados,
          }
        }))
      }
    }

    const materiasPorMes = getMateriasPorMesByModalidad(modalidadAlumno)

    // ── Obtener meses del contenido (filtrado por nivel del alumno) ───────────
    // Los meses ARCHIVADOS no se listan: esta es la ruta de meses del alumno, y
    // retirar un mes tiene que quitarlo también de aquí, no solo del detalle de
    // la materia. (No estaba en la tabla del plan F4 —que enumeraba los que leen
    // `semanas`—, pero es el mismo listado y la misma regla.)
    let mesesQuery = supabase
      .from('meses_contenido')
      .select('id, numero_mes, titulo, materias!inner(id, nombre, color)')
      .lte('numero_mes', duracionMeses)
      .eq('activa', true)
      .order('numero_mes')

    if (nivelAlumno) {
      mesesQuery = mesesQuery.eq('materias.nivel', nivelAlumno)
    }
    // El join es !inner, así que esto acota los meses a la carrera del alumno.
    if (nivelAlumno === 'licenciatura' && carreraAlumno) {
      mesesQuery = mesesQuery.eq('materias.carrera', carreraAlumno)
    }

    const { data: mesesRows, error: mesesError } = await mesesQuery

    // Si la tabla no existe o no hay filas → placeholders con conteo por modalidad
    if (mesesError || !mesesRows || mesesRows.length === 0) {
      const ficticios = Array.from({ length: duracionMeses || 6 }, (_, i) => {
        const n = i + 1
        return {
          id:           `mes-ficticio-${n}`,
          numero:       n,
          numero_mes:   n,
          titulo:       `Mes ${n}`,
          materias:     Array.from({ length: materiasPorMes }, (_, j) => ({
            id:        `ficticio-${n}-${j}`,
            codigo:    '',
            nombre:    '',
            color_hex: '#1565C0',
          })),
          desbloqueado: n <= mesesDesbloqueados,
        }
      })
      return NextResponse.json(ficticios)
    }

    type Row = {
      id: string
      numero_mes: number
      titulo: string
      materias: { id: string; nombre: string; color: string | null }
    }

    // Un registro = un mes de una materia; agrupar por numero_mes para el dashboard
    const porNumero = new Map<number, { titulo: string; materias: { id: string; codigo: string; nombre: string; color_hex: string }[] }>()

    for (const raw of mesesRows as unknown as Row[]) {
      const nm = raw.numero_mes
      const mat = raw.materias
      if (!porNumero.has(nm)) {
        porNumero.set(nm, { titulo: raw.titulo || `Mes ${nm}`, materias: [] })
      }
      const bucket = porNumero.get(nm)!
      if (raw.titulo) bucket.titulo = raw.titulo
      bucket.materias.push({
        id:        mat.id,
        codigo:    '',
        nombre:    mat.nombre,
        color_hex: mat.color ?? '#1565C0',
      })
    }

    const result = Array.from({ length: duracionMeses || 6 }, (_, i) => {
      const n = i + 1
      const agg = porNumero.get(n)
      return {
        id:           agg?.materias[0]?.id ?? `mes-resumen-${n}`,
        numero:       n,
        numero_mes:   n,
        titulo:       agg?.titulo ?? `Mes ${n}`,
        materias:     agg?.materias ?? [],
        desbloqueado: n <= mesesDesbloqueados,
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/alumno/meses] error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
