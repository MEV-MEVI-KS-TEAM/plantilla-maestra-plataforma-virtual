import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoDeFila, respuestaObjetivo } from '@/lib/admin-alumno'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { aplicarDocEstado, type DocEstadoAdmin } from '@/lib/admin/documentos-admin'

/**
 * PUT /api/admin/documentos/[id]/verificar
 * Actualiza el estado de un documento (aprobado | rechazado | pendiente).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const body = await request.json()
    const { estado, comentario } = body

    const estadosValidos: DocEstadoAdmin[] = ['pendiente', 'aprobado', 'rechazado']
    if (!estado || !estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const admin = createAdminClient()
    // #187: el documento es de un ALUMNO. Sobre el de personal (o el propio) → 403.
    const objetivo = await cargarAlumnoDeFila(admin, 'documentos_alumno', params.id, user.id, 'Documento no encontrado')
    if (!objetivo.ok) return respuestaObjetivo(objetivo)
    // aprobado ⇒ verificado = true: híbrido → nuevo → legacy, y solo se pasa a la
    // forma siguiente si la columna no existe (42703 / PGRST204). Ver aplicarDocEstado.
    const { error } = await aplicarDocEstado(estado, comentario ?? null, payload =>
      admin
        .from('documentos_alumno')
        .update(payload)
        .eq('id', params.id))

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/admin/documentos/[id]/verificar]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
