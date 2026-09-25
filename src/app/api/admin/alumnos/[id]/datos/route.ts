import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { cargarAlumnoObjetivo } from '@/lib/admin-alumno'

/**
 * PATCH /api/admin/alumnos/[id]/datos — edición de los datos del alumno.
 *
 * POR QUÉ EXISTE: hasta ahora el panel solo tenía endpoints de UN campo
 * (`activo`, `contactado_whatsapp`, `notas_admin`, `inscripcion_pagada`…), así
 * que un dato mal capturado en el alta no se podía corregir desde la
 * plataforma. Lo han pedido varios clientes; el que lo destrabó fue Instituto
 * 10 de Agosto: «poder editar datos de alumnos por favor, por cualquier error»
 * (TICKET-2026-09-16-10).
 *
 * LOS DATOS VIVEN EN DOS SITIOS, Y EL CORREO EN TRES:
 *   usuarios   -> nombre, apellidos, email, telefono
 *   alumnos    -> nivel, modalidad, carrera
 *   auth.users -> email  ← ES CON EL QUE SE INICIA SESIÓN
 *
 * 🛑 EL CORREO ES LA LLAVE DE ACCESO. Cambiarlo solo en `usuarios` deja al
 * alumno entrando con el viejo y viendo el nuevo en pantalla: parece que
 * funcionó y no funcionó. Por eso el orden es Auth PRIMERO y la tabla después,
 * con reversión si la tabla falla: si Auth se queda con el correo nuevo y
 * `usuarios` con el viejo, el alumno pierde el acceso sin que nadie lo note.
 *
 * NO se editan aquí, a propósito:
 *   - `matricula`: es la identidad del alumno en constancias y pagos ya
 *     emitidos, y la genera un trigger. Cambiarla rompe el historial.
 *   - `meses_desbloqueados`: tiene su propio endpoint con las reglas de avance.
 *   - `rol`: un alta de alumno no debe poder convertirse en admin desde aquí.
 *
 * Y solo opera sobre cuentas con rol 'alumno' (`cargarAlumnoObjetivo`).
 */

/** Campos de `usuarios`. El email se trata aparte por lo de Auth. */
const CAMPOS_USUARIO = ['nombre', 'apellidos', 'telefono'] as const
/** Campos de `alumnos`. */
const CAMPOS_ALUMNO = ['nivel', 'modalidad', 'carrera'] as const

type Cuerpo = Partial<Record<
  (typeof CAMPOS_USUARIO)[number] | (typeof CAMPOS_ALUMNO)[number] | 'email',
  string | null
>>

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyAdmin(supabase, user.id)
    if (denied) return denied

    const body = (await request.json()) as Cuerpo
    const admin = createAdminClient()

    // ── Estado previo: hace falta para revertir y para el registro ───────────
    // 🛑 Y la guarda: solo cuentas de ALUMNO. Sin ella este endpoint cambiaba
    // el correo de acceso de otro admin o de un secretario (secuestro de la
    // cuenta: el nuevo correo recibe el «olvidé mi contraseña»).
    const objetivo = await cargarAlumnoObjetivo(admin, params.id)
    if ('error' in objetivo) return objetivo.error

    const anterior = objetivo.usuario

    // ── Correo: validar y comprobar que no lo tenga otra cuenta ─────────────
    const emailNuevo = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    const cambiaEmail = !!emailNuevo && emailNuevo !== (anterior.email ?? '').toLowerCase()

    if (emailNuevo !== null && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNuevo)) {
      return NextResponse.json({ error: 'El correo no tiene un formato válido.' }, { status: 400 })
    }

    if (cambiaEmail) {
      const { data: ocupado } = await admin
        .from('usuarios')
        .select('id')
        .eq('email', emailNuevo)
        .neq('id', params.id)
        .maybeSingle()

      if (ocupado) {
        return NextResponse.json(
          { error: 'Ese correo ya pertenece a otra cuenta de la plataforma.' },
          { status: 409 },
        )
      }

      // Auth PRIMERO: es la llave de acceso. Si esto falla, no se toca nada más.
      const { error: errAuth } = await admin.auth.admin.updateUserById(params.id, {
        email: emailNuevo,
      })
      if (errAuth) {
        console.error('[admin/alumnos/datos] Auth rechazó el correo:', errAuth.message)
        return NextResponse.json(
          { error: 'No se pudo cambiar el correo de acceso. Puede que ya esté registrado.' },
          { status: 409 },
        )
      }
    }

    // ── usuarios ────────────────────────────────────────────────────────────
    const parcheUsuario: Record<string, string | null> = {}
    for (const campo of CAMPOS_USUARIO) {
      if (campo in body) parcheUsuario[campo] = body[campo] ?? null
    }
    if (cambiaEmail) parcheUsuario.email = emailNuevo

    if (Object.keys(parcheUsuario).length > 0) {
      const { error } = await admin.from('usuarios').update(parcheUsuario).eq('id', params.id)
      if (error) {
        // Reversión: Auth ya tiene el correo nuevo y la tabla no. Sin esto el
        // alumno queda entrando con un correo que la plataforma no reconoce.
        if (cambiaEmail && anterior.email) {
          await admin.auth.admin.updateUserById(params.id, { email: anterior.email })
        }
        console.error('[admin/alumnos/datos] update usuarios:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // ── alumnos ─────────────────────────────────────────────────────────────
    const parcheAlumno: Record<string, string | null> = {}
    for (const campo of CAMPOS_ALUMNO) {
      if (campo in body) parcheAlumno[campo] = body[campo] ?? null
    }

    if (Object.keys(parcheAlumno).length > 0) {
      const { error } = await admin.from('alumnos').update(parcheAlumno).eq('id', params.id)
      if (error) {
        console.error('[admin/alumnos/datos] update alumnos:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // ── Registro de quién editó y cuándo ────────────────────────────────────
    // El esquema base no trae tabla de auditoría ni columnas `updated_by`, así
    // que por ahora queda en el log del servidor (consultable en Vercel). Crear
    // esa tabla es un cambio de esquema y va aparte.
    console.info('[admin/alumnos/datos]', JSON.stringify({
      alumno: params.id,
      editado_por: user.id,
      cuando: new Date().toISOString(),
      campos: [...Object.keys(parcheUsuario), ...Object.keys(parcheAlumno)],
    }))

    return NextResponse.json({ success: true, email_de_acceso_actualizado: cambiaEmail })
  } catch (err) {
    console.error('[PATCH /api/admin/alumnos/[id]/datos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
