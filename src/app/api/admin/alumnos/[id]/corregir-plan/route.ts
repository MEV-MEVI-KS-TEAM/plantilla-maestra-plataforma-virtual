import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { validarCorreccionPlan, mensajeCandado, MENSAJE_SIN_CAMBIOS } from '@/lib/corregir-plan'
import { getSiteConfig } from '@/lib/site-config'

// Corrige la CAPTURA del plan de estudio (nivel/carrera/modalidad) de un
// alumno que aún no comienza. La UI esconde el botón cuando algún candado
// bloquea, pero la decisión real vive en public.corregir_plan_estudio():
// re-evalúa los seis candados DENTRO de la transacción del UPDATE, borra las
// notas del alumno (con conteo) y deja el evento en alumno_plan_eventos.
// Nunca confiar en que la UI escondió el botón.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const body = await request.json().catch(() => null)
    // F3B: se valida contra las mismas modalidades que arma el selector del
    // panel (config.ts fusionado con "Personalizar mi página"), no contra el
    // literal de config.ts.
    const cfg = await getSiteConfig()
    const validacion = validarCorreccionPlan(body, cfg.modalidades)
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }
    const { nivel, carrera, modalidad } = validacion.plan

    const admin = createAdminClient()

    // El id de la URL debe ser un ALUMNO (rol 'alumno' + fila en alumnos)
    // antes de tocar la RPC. La función SQL solo mira `alumnos`; esta guarda
    // impide que el endpoint opere sobre la cuenta de un admin o secretario
    // que por cualquier motivo tenga fila en `alumnos` (Bug 231).
    const [{ data: objetivo }, { data: filaAlumno }] = await Promise.all([
      admin.from('usuarios').select('id, rol').eq('id', params.id).maybeSingle(),
      admin.from('alumnos').select('id').eq('id', params.id).maybeSingle(),
    ])
    if (!objetivo || !filaAlumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    if (String((objetivo as { rol?: string | null }).rol ?? '').toLowerCase() !== 'alumno') {
      return NextResponse.json({ error: 'Esta acción solo aplica a cuentas de alumno.' }, { status: 403 })
    }

    const { data, error } = await admin.rpc('corregir_plan_estudio', {
      p_alumno:    params.id,
      p_nivel:     nivel,
      p_carrera:   carrera,
      p_modalidad: modalidad,
      // El actor va como parámetro: la RPC corre con service_role, donde
      // auth.uid() es NULL (Bug 83).
      p_actor:     user.id,
    })

    if (error) {
      // Cliente sin la migración 20260817120000: la función no existe.
      // Degrada con un mensaje accionable en vez de un 500 mudo.
      if (error.code === 'PGRST202' || /corregir_plan_estudio/.test(error.message)) {
        console.error('[corregir-plan] falta la migración 20260817120000_corregir_plan_estudio:', error.message)
        return NextResponse.json(
          { error: 'La corrección de plan no está habilitada en esta plataforma (falta la migración).' },
          { status: 501 },
        )
      }
      console.error('[corregir-plan] rpc error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const resultado = data as { ok: boolean; candado?: string; matricula?: string; notas_borradas?: number } | null
    if (!resultado) {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    if (!resultado.ok) {
      if (resultado.candado === 'no_existe') {
        return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
      }
      // Mismo plan que ya tiene: no es un candado (409), es una petición que
      // no corrige nada (400). La RPC no escribió nada (Bug 231).
      if (resultado.candado === 'sin_cambios') {
        return NextResponse.json({ error: MENSAJE_SIN_CAMBIOS, candado: 'sin_cambios' }, { status: 400 })
      }
      return NextResponse.json(
        { error: mensajeCandado(resultado.candado ?? ''), candado: resultado.candado },
        { status: 409 },
      )
    }

    return NextResponse.json(resultado)
  } catch (err) {
    console.error('[POST /api/admin/alumnos/[id]/corregir-plan]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
