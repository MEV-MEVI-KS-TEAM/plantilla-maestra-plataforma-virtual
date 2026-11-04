import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enlaceReciboValido } from '@/lib/pagos/recibo-enlace'

/**
 * GET /recibo/[id]?e=<expira>&t=<firma> — el PDF del recibo de pago desde el
 * dominio de la escuela (TICKET-2026-11-04-03). Es el enlace que viaja en el
 * WhatsApp del recibo; lo emite `/api/admin/pagos/[id]/recibo`.
 *
 * PÚBLICA a propósito (la abre el alumno desde WhatsApp, con o sin sesión): está
 * en `publicRoutes` y en las excepciones de `rebotaConSesion`. Lo que la protege
 * es la firma (ver `recibo-enlace.ts`). Sin firma válida, o si el PDF todavía
 * no se generó, responde 404 sin decir cuál de las dos.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const noEncontrado = () =>
  new NextResponse('Este enlace de recibo no es válido o ya caducó. Pide uno nuevo a tu escuela.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const secreto = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const q = request.nextUrl.searchParams
  if (!enlaceReciboValido(params.id, q.get('e'), q.get('t'), secreto)) return noEncontrado()

  try {
    const admin = createAdminClient()
    const { data: pago } = await admin.from('pagos').select('id, alumno_id').eq('id', params.id).maybeSingle()
    if (!pago?.alumno_id) return noEncontrado()

    const { data: pdf, error } = await admin.storage.from('recibos').download(`${pago.alumno_id}/${pago.id}.pdf`)
    if (error || !pdf) return noEncontrado()

    const folio = `REC-${String(pago.id).slice(0, 8).toUpperCase()}`
    return new NextResponse(await pdf.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="recibo-${folio}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (err) {
    console.error('[GET /recibo/[id]]', err)
    return new NextResponse('No se pudo abrir el recibo. Intenta de nuevo en un momento.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
}
