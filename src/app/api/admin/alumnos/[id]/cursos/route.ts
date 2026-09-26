import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { EVENTOS_DE_ACCESO } from '@/lib/cursos/bitacora'
import { precargaCobro, resumenCobro, type EstadoCobro, type PagoDeCurso } from '@/lib/cursos/cobro'
import type { PreciosCurso } from '@/lib/cursos/precio-regla'

/**
 * GET /api/admin/alumnos/[id]/cursos — los cursos del alumno, para COBRAR
 * (Bloque D · D16, #207-5). Staff: admin y secretario (decisiones 4 y 6).
 *
 * Una fila por inscripción con: el curso, su acceso, el precio de REFERENCIA y
 * de dónde salió (la foto del evento 'inscripcion' o la ficha de hoy), lo
 * pagado, el saldo, «Pagado · falta abrir» y la precarga de «Cobrar». Las
 * reglas viven en lib/cursos/cobro.ts (puro), las mismas que revalida
 * curso_cobrar.
 *
 * Con el cliente admin y SIEMPRE filtrando por el alumno de la URL: la RLS de
 * las tablas de cursos es de admin o del propio alumno, y el secretario
 * también cobra. Sin el módulo de cursos (o sin B1) responde una lista vacía o
 * sin pagos, nunca un 500.
 */
type Inscripcion = {
  id: string; curso_id: string; estado?: string | null; meses_desbloqueados?: number | null
  acceso_total?: boolean | null; fecha_inscripcion?: string | null; created_at?: string | null
}
type Curso = { id: string; nombre: string; tipo: string | null; precio_inscripcion: number | null; precio_mensualidad: number | null }
type Evento = { inscripcion_id: string; tipo: string; detalle: Record<string, unknown> | null; created_at: string }

const cifra = (v: unknown): number | null => {
  const n = Number(v)
  return v !== null && v !== undefined && Number.isFinite(n) ? n : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()
    // select('*'): acceso_total (C3b) y estado (B1) no existen en toda base.
    const { data: insRaw, error: errIns } = await admin
      .from('curso_inscripciones')
      .select('*')
      .eq('alumno_id', params.id)
      .order('created_at', { ascending: true })
    if (errIns) {
      // Sin el módulo de cursos: el alumno no tiene cursos que cobrar.
      if (errIns.code === '42P01' || errIns.code === 'PGRST205') return NextResponse.json({ cursos: [] })
      console.error('[GET /api/admin/alumnos/[id]/cursos] inscripciones:', errIns.message)
      return NextResponse.json({ error: 'No se pudieron leer sus cursos.' }, { status: 500 })
    }
    const inscripciones = (insRaw ?? []) as Inscripcion[]
    if (inscripciones.length === 0) return NextResponse.json({ cursos: [] })

    const insIds = inscripciones.map(i => i.id)
    const cursoIds = [...new Set(inscripciones.map(i => i.curso_id))]
    const [{ data: cursosRaw }, { data: eventosRaw, error: errEv }, { data: pagosRaw, error: errPag }] = await Promise.all([
      admin.from('cursos').select('id, nombre, tipo, precio_inscripcion, precio_mensualidad').in('id', cursoIds),
      admin.from('curso_inscripcion_eventos').select('inscripcion_id, tipo, detalle, created_at')
        .in('inscripcion_id', insIds).in('tipo', ['inscripcion', ...EVENTOS_DE_ACCESO]),
      admin.from('pagos').select('curso_inscripcion_id, monto, concepto, mes_desbloqueado').in('curso_inscripcion_id', insIds),
    ])
    const cursos = new Map(((cursosRaw ?? []) as Curso[]).map(c => [c.id, c]))
    // Sin bitácora (sin B4) no se puede saber quién está «por activar» ni la foto del precio.
    const eventos = errEv ? null : ((eventosRaw ?? []) as Evento[])
    // Sin B1 no hay pagos de curso.
    const pagos = errPag ? [] : ((pagosRaw ?? []) as Array<PagoDeCurso & { curso_inscripcion_id: string }>)

    const filas = inscripciones.map(i => {
      const c = cursos.get(i.curso_id)
      const ficha: PreciosCurso = { precio_inscripcion: c?.precio_inscripcion ?? 0, precio_mensualidad: c?.precio_mensualidad ?? 0 }
      const suyos = eventos?.filter(e => e.inscripcion_id === i.id) ?? []
      // La foto del precio al ASIGNAR (C3b): el evento 'inscripcion' más reciente con precios.
      const foto = suyos.filter(e => e.tipo === 'inscripcion' && e.detalle)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(e => ({ ins: cifra(e.detalle?.precio_inscripcion), men: cifra(e.detalle?.precio_mensualidad) }))
        .find(p => p.ins !== null || p.men !== null)
      const meses = Number(i.meses_desbloqueados ?? 0)
      const accesoTotal = i.acceso_total === true
      const estado: EstadoCobro = {
        estado: i.estado ?? 'activa',
        meses,
        acceso_total: accesoTotal,
        // El MISMO predicado de D8: activa, sin acceso total, 0 meses y sin eventos de acceso.
        por_activar: eventos !== null && (i.estado ?? 'activa') === 'activa' && !accesoTotal && meses === 0
          && !suyos.some(e => (EVENTOS_DE_ACCESO as readonly string[]).includes(e.tipo)),
        ficha,
        referencia: foto
          ? { precios: { precio_inscripcion: foto.ins ?? 0, precio_mensualidad: foto.men ?? 0 }, origen: 'inscripcion' }
          : { precios: ficha, origen: 'ficha' },
        pagos: pagos.filter(p => p.curso_inscripcion_id === i.id),
      }
      return {
        inscripcion_id: i.id,
        curso_id: i.curso_id,
        curso_nombre: c?.nombre ?? 'Curso',
        curso_tipo: c?.tipo ?? 'curso',
        estado: estado.estado,
        meses_desbloqueados: meses,
        acceso_total: accesoTotal,
        por_activar: estado.por_activar,
        precio_referencia: {
          inscripcion: Number(estado.referencia.precios.precio_inscripcion ?? 0),
          mensualidad: Number(estado.referencia.precios.precio_mensualidad ?? 0),
          origen: estado.referencia.origen,
        },
        resumen: resumenCobro(estado),
        precarga: precargaCobro(estado),
      }
    })

    return NextResponse.json({ cursos: filas })
  } catch (err) {
    console.error('[GET /api/admin/alumnos/[id]/cursos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
