import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoDeFila, respuestaObjetivo } from '@/lib/admin-alumno'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'

// ─── POST /api/admin/inscripciones/[id]/abrir-mes ────────────────────────────
// Abre un mes de una inscripción a curso: +1 en curso_inscripciones.meses_desbloqueados.
// El gate de B2 reacciona solo — aquí no se toca ninguna regla de acceso.
//
// ⚠️ SE LLAMA CON LA SESIÓN DEL USUARIO, NO con el cliente admin. La función
// curso_abrir_mes() es SECURITY DEFINER y comprueba es_staff() adentro (admin o
// secretario, D7b), y es_staff() se apoya en auth.uid(): con service_role ese uid
// es NULL y la función rechazaría a todo el personal. La escritura la puede hacer igual
// porque, al ser DEFINER, corre como el dueño y la RLS no la frena.
//
// body { meses_esperados?: number } — el valor que tenía a la vista quien pulsó.
// Es el candado contra el doble clic: si alguien ya lo movió, la función
// devuelve PT409 (409) en vez de incrementar dos veces.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const esperados =
      typeof body?.meses_esperados === 'number' && Number.isInteger(body.meses_esperados)
        ? body.meses_esperados
        : null

    // #187: la inscripción es de un ALUMNO. Sobre la de personal (o la propia)
    // → 403, con el rol leído de la BD, antes de la RPC.
    const objetivo = await cargarAlumnoDeFila(createAdminClient(), 'curso_inscripciones', params.id, user.id, 'Inscripción no encontrada')
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    const { data, error } = await supabase.rpc('curso_abrir_mes', {
      p_inscripcion_id: params.id,
      p_meses_esperados: esperados,
    })

    if (error) {
      const { status, mensaje } = errorDeRpcCurso(error)
      // Curso de 1 mes (pago único que libera TODO el curso de una vez): la
      // función dice «llega hasta 1 meses … no hay más contenido que liberar»,
      // que la escuela leyó como «el curso está mal, debería durar 3 meses»
      // mientras la alumna ya tenía los módulos abiertos (TICKET-2026-10-15-07).
      const tope = /llega hasta (\d+) mes/.exec(mensaje)?.[1]
      if (tope === '1') {
        return NextResponse.json({
          error:
            'Este curso se libera COMPLETO con su primer mes: esta inscripción ya tiene abiertos todos los módulos y el examen. ' +
            'No hay más meses que abrir. El alumno lo ve en «Cursos y Diplomados», en su menú.',
        }, { status })
      }
      return NextResponse.json({ error: mensaje }, { status })
    }

    const fila = Array.isArray(data) ? data[0] : data
    return NextResponse.json({
      ok: true,
      meses_desbloqueados: fila?.meses_desbloqueados ?? null,
      tope: fila?.tope ?? null,
    })
  } catch (err) {
    console.error('[POST /api/admin/inscripciones/[id]/abrir-mes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
