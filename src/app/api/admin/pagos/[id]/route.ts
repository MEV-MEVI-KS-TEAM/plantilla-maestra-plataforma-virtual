import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'

/**
 * DELETE /api/admin/pagos/[id]
 * Elimina un pago mal capturado (hard delete, solo admin).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const admin = createAdminClient()

    const { data: pago, error: pagoErr } = await admin
      .from('pagos')
      .select('id')
      .eq('id', params.id)
      .single()
    if (pagoErr || !pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const { error } = await admin
      .from('pagos')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: params.id })
  } catch (err) {
    console.error('[DELETE /api/admin/pagos/[id]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
