import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { DATOS_PAGO_VACIOS, type DatosPago } from '@/lib/datos-pago-core'

/**
 * Lectura y escritura de `public.datos_pago` (pedido de un cliente, #295). SOLO SERVIDOR:
 * la tabla no tiene políticas ni GRANTs, así que todo va con el service role.
 * Quien llame decide antes SI puede (sesión para leer, admin para escribir).
 */

/** Sin tabla (cliente sin la migración), sin fila o con error: sin datos, sin bloque. */
export async function leerDatosPago(): Promise<DatosPago> {
  const { data, error } = await createAdminClient()
    .from('datos_pago')
    .select('activo, banco, titular, clabe, tarjeta, cuenta, nota')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error('[datos-pago] lectura:', error.code ?? '', error.message)
    return DATOS_PAGO_VACIOS
  }
  return data ? { ...DATOS_PAGO_VACIOS, ...(data as Partial<DatosPago>) } : DATOS_PAGO_VACIOS
}

export async function guardarDatosPago(datos: DatosPago): Promise<void> {
  const { error } = await createAdminClient()
    .from('datos_pago')
    .upsert({ id: 1, ...datos, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw new Error(`${error.code ?? 'sin-codigo'}: ${error.message}`)
}
