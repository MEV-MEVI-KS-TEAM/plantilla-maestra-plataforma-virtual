import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leerDatosPago } from '@/lib/datos-pago'

/**
 * GET /api/alumno/datos-pago — los datos para pagar por transferencia o depósito
 * (pedido de un cliente, #295). Sesión OBLIGATORIA: sin ella, 401 y nada más. Nunca se
 * cachea (ni en el navegador ni en un proxy): es dato bancario.
 */
export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: SIN_CACHE })

  const datos = await leerDatosPago()
  if (!datos.activo) return NextResponse.json({ activo: false }, { headers: SIN_CACHE })
  return NextResponse.json(datos, { headers: SIN_CACHE })
}
