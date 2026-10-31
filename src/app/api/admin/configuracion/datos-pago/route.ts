import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { guardarDatosPago, leerDatosPago } from '@/lib/datos-pago'
import { validarDatosPago } from '@/lib/datos-pago-core'

/**
 * «Personalizar mi página» → Datos de pago (pedido de un cliente, #295). Solo ADMIN.
 *   GET → la fila tal cual (o vacía).
 *   PUT → valida (CLABE con su verificador, tarjeta con Luhn) y guarda.
 * 🛑 Va aparte del JSON de site_config a propósito: ese JSON es público.
 */
export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'no-store, max-age=0' }

async function autorizarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: SIN_CACHE })
  return verifyAdmin(supabase, user.id)
}

export async function GET() {
  const denegado = await autorizarAdmin()
  if (denegado) return denegado
  return NextResponse.json(await leerDatosPago(), { headers: SIN_CACHE })
}

export async function PUT(req: NextRequest) {
  const denegado = await autorizarAdmin()
  if (denegado) return denegado
  let cuerpo: unknown
  try { cuerpo = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400, headers: SIN_CACHE }) }
  const r = validarDatosPago(cuerpo)
  if (!r.ok) return NextResponse.json({ error: r.errores.join(' '), errores: r.errores }, { status: 400, headers: SIN_CACHE })
  try {
    await guardarDatosPago(r.datos)
  } catch (e) {
    console.error('[admin/datos-pago] guardar:', e)
    return NextResponse.json({ error: 'No se pudieron guardar los datos de pago. ¿Ya corrió la migración 20261030120000_datos_pago.sql?' }, { status: 500, headers: SIN_CACHE })
  }
  return NextResponse.json(r.datos, { headers: SIN_CACHE })
}
