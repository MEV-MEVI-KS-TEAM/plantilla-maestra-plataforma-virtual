import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'
import { validarCorreccionPlan, mensajeCandado } from '@/lib/corregir-plan'
import { getSiteConfig } from '@/lib/site-config'
import { guardarEdadTutor, leerEdadTutor } from '@/lib/admin/edad-tutor-alumno'

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
  // Solo con edad y tutor en juego: vuelve a dejar las cuatro columnas como estaban.
  let restaurarEdadTutor: () => Promise<void> = async () => {}
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
    const { nivel, carrera, modalidad, edadTutor } = validacion.plan

    const admin = createAdminClient()
    // #187: esta ruta es de ALUMNOS. Sobre personal (admin o secretario) o sobre
    // uno mismo → 403, con el rol leído de la BD y ANTES de escribir nada.
    const objetivo = await cargarAlumnoObjetivo(admin, params.id, user.id)
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    // Plan y tutor no caben en una transacción sin una RPC nueva: PostgREST da una por
    // llamada. Este orden impide el estado malo, un menor en Primaria sin tutor: primero
    // el tutor; si no se guarda, el plan no se toca. Si después el plan no se corrige
    // (candado o error), las cuatro columnas vuelven a como estaban. Lo peor que queda, si
    // también falla esa vuelta, es el plan viejo con datos de tutor de más, y va al log.
    if (edadTutor) {
      const previa = await leerEdadTutor(admin, objetivo.alumno.id)
      if (!previa.ok) return NextResponse.json({ error: previa.error }, { status: 500 })
      const errorEdad = await guardarEdadTutor(admin, objetivo.alumno.id, edadTutor)
      if (errorEdad) {
        return NextResponse.json(
          { error: 'No se guardaron la fecha de nacimiento ni los datos del tutor, y el plan no se cambió. Intenta de nuevo.' },
          { status: 500 },
        )
      }
      restaurarEdadTutor = async () => {
        const errorVuelta = await guardarEdadTutor(admin, objetivo.alumno.id, previa.datos)
        if (errorVuelta) console.error('[corregir-plan] el plan no se corrigió y la edad y el tutor no volvieron a como estaban')
      }
    }

    const { data, error } = await admin.rpc('corregir_plan_estudio', {
      p_alumno:    objetivo.alumno.id,
      p_nivel:     nivel,
      p_carrera:   carrera,
      p_modalidad: modalidad,
      // El actor va como parámetro: la RPC corre con service_role, donde
      // auth.uid() es NULL (Bug 83).
      p_actor:     user.id,
    })

    if (error) {
      await restaurarEdadTutor()
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
      await restaurarEdadTutor()
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    if (!resultado.ok) {
      await restaurarEdadTutor()
      if (resultado.candado === 'no_existe') {
        return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
      }
      return NextResponse.json(
        { error: mensajeCandado(resultado.candado ?? ''), candado: resultado.candado },
        { status: 409 },
      )
    }

    return NextResponse.json(resultado)
  } catch (err) {
    await restaurarEdadTutor().catch(() => {})
    console.error('[POST /api/admin/alumnos/[id]/corregir-plan]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
