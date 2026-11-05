import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'
import { validarCorreccionPlan, mensajeCandado } from '@/lib/corregir-plan'
import { getSiteConfig } from '@/lib/site-config'
import { guardarEdadTutor, leerEdadTutor, leerPlanAlumno, mismoPlan } from '@/lib/admin/edad-tutor-alumno'
import { primariaActiva } from '@/lib/modalidades'

// Corrige la CAPTURA del plan de estudio (nivel/carrera/modalidad) de un
// alumno que aún no comienza. La UI esconde el botón cuando algún candado
// bloquea, pero la decisión real vive en public.corregir_plan_estudio():
// re-evalúa los seis candados DENTRO de la transacción del UPDATE, borra las
// notas del alumno (con conteo) y deja el evento en alumno_plan_eventos.
// Nunca confiar en que la UI escondió el botón.

/** La respuesta de un candado: la misma venga de la consulta previa o de la RPC. */
function respuestaCandado(candado: string | undefined): NextResponse {
  if (candado === 'no_existe') {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }
  return NextResponse.json({ error: mensajeCandado(candado ?? ''), candado }, { status: 409 })
}

/** Un error de RPC: el del plan o el de la consulta previa de candados. */
function respuestaErrorRpc(error: { code?: string; message: string }): NextResponse {
  // Cliente sin la migración 20260817120000: la función no existe.
  // Degrada con un mensaje accionable en vez de un 500 mudo.
  if (error.code === 'PGRST202' || /corregir_plan_estudio/.test(error.message)) {
    console.error('[corregir-plan] falta la migración 20260817120000_corregir_plan_estudio:', error.message)
    return NextResponse.json(
      { error: 'La corrección de plan no está habilitada en esta plataforma (falta la migración).' },
      { status: 501 },
    )
  }
  // `details` de un 23514 trae la fila: con Primaria, con fecha y tutor. No va a los logs.
  console.error('[corregir-plan] rpc error:', primariaActiva() ? { code: error.code, message: error.message } : error)
  return NextResponse.json({ error: error.message }, { status: 500 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Solo con edad y tutor en juego. La primera vuelve a dejar las cuatro columnas como
  // estaban; la segunda decide qué hacer si el plan no dio una respuesta clara.
  let restaurarEdadTutor: () => Promise<void> = async () => {}
  let revisarSinRespuesta: () => Promise<NextResponse | null> = async () => null
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
    // llamada. Este orden impide el estado malo, un menor en Primaria sin tutor:
    //   1. Los candados, ANTES de escribir: con uno puesto no se toca nada.
    //   2. El tutor; si no se guarda, el plan no se toca.
    //   3. El plan. Si responde que no (un candado que apareció en medio), las cuatro
    //      columnas vuelven a como estaban.
    //   4. Si no responde, puede haber confirmado y perderse la respuesta: se relee la
    //      fila. Si el plan ya cambió, se corrigió y el tutor se queda; si sigue igual, las
    //      columnas vuelven; si no se puede leer, no se toca nada y se avisa.
    // Lo peor que queda, si también falla esa vuelta, es el plan viejo con la fecha y el
    // tutor de ESTA petición (que pueden ser NULL, si se capturó como mayor de edad): va
    // al log y hace falta un candado o un error justo entre el paso 1 y el 3.
    if (edadTutor) {
      const { data: candado, error: errorCandado } = await admin
        .rpc('candado_corregir_plan', { p_alumno: objetivo.alumno.id })
      if (errorCandado) return respuestaErrorRpc(errorCandado)
      if (candado) return respuestaCandado(candado as string)

      const planPrevio = await leerPlanAlumno(admin, objetivo.alumno.id)
      if (!planPrevio.ok) return NextResponse.json({ error: planPrevio.error }, { status: 500 })
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
      revisarSinRespuesta = async () => {
        const ahora = await leerPlanAlumno(admin, objetivo.alumno.id)
        if (!ahora.ok) {
          console.error('[corregir-plan] el plan no respondió y no se pudo releer la fila: no se restaura nada')
          return NextResponse.json(
            { error: 'No se pudo confirmar si el plan se corrigió. Revisa la ficha del alumno antes de reintentar.' },
            { status: 500 },
          )
        }
        if (mismoPlan(ahora.plan, planPrevio.plan)) {
          await restaurarEdadTutor()
          return null
        }
        if (mismoPlan(ahora.plan, { nivel, modalidad, carrera })) {
          // La RPC confirmó y se perdió su respuesta: el plan y el tutor ya están juntos.
          return NextResponse.json({ ok: true })
        }
        console.error('[corregir-plan] el plan no respondió y la fila tiene otro plan: no se restaura nada')
        return NextResponse.json(
          { error: 'El plan de este alumno cambió mientras se corregía. Revisa la ficha.' },
          { status: 409 },
        )
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
      const revisada = await revisarSinRespuesta()
      if (revisada) return revisada
      return respuestaErrorRpc(error)
    }

    const resultado = data as { ok: boolean; candado?: string; matricula?: string; notas_borradas?: number } | null
    if (!resultado) {
      const revisada = await revisarSinRespuesta()
      if (revisada) return revisada
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    if (!resultado.ok) {
      await restaurarEdadTutor()
      return respuestaCandado(resultado.candado)
    }

    return NextResponse.json(resultado)
  } catch (err) {
    const revisada = await revisarSinRespuesta().catch(() => null)
    if (revisada) return revisada
    console.error('[POST /api/admin/alumnos/[id]/corregir-plan]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
