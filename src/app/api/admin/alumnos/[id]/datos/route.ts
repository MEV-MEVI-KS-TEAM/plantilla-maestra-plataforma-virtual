import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'

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
 *   auth.users -> email  ← ES CON EL QUE SE INICIA SESIÓN
 *   (alumnos -> nivel, modalidad, carrera: NO se editan aquí, ver abajo)
 *
 * 🛑 EL CORREO ES LA LLAVE DE ACCESO. Cambiarlo solo en `usuarios` deja al
 * alumno entrando con el viejo y viendo el nuevo en pantalla: parece que
 * funcionó y no funcionó. Por eso el orden es Auth PRIMERO y la tabla después,
 * con reversión si la tabla falla: si Auth se queda con el correo nuevo y
 * `usuarios` con el viejo, el alumno pierde el acceso sin que nadie lo note.
 *
 * NO se editan aquí, a propósito:
 *   - `nivel`, `modalidad` y `carrera` (D9, #199-admin): el plan de estudio se
 *     cambia SOLO con «Corregir plan», que tiene sus candados (pagos, meses
 *     abiertos, avance). Aquí se escribían sin validar nada. Ojo: «Corregir plan»
 *     todavía ofrece los planes activos de TODOS los niveles (decisión 16: filtrar
 *     esos modales por nivel solo si se venden escuelas asimétricas).
 *   - `matricula`: es la identidad del alumno en constancias y pagos ya
 *     emitidos, y la genera un trigger. Cambiarla rompe el historial.
 *   - `meses_desbloqueados`: tiene su propio endpoint con las reglas de avance.
 *   - `rol`: un alta de alumno no debe poder convertirse en admin desde aquí.
 *
 * #187 (Bug 229): SOLO cuentas de alumno. Antes bastaba con que el id existiera
 * en `usuarios`, donde también vive el personal: un admin le cambiaba el correo
 * de acceso a otro admin o a un secretario y, con «olvidé mi contraseña», se
 * quedaba con su cuenta. Sobre personal o sobre uno mismo → 403 antes de Auth.
 */

/** Campos de `usuarios`. El email se trata aparte por lo de Auth. */
const CAMPOS_USUARIO = ['nombre', 'apellidos', 'telefono'] as const
/** El plan de estudio: se rechaza (D9). Se cambia con «Corregir plan». */
const CAMPOS_PLAN = ['nivel', 'modalidad', 'carrera'] as const

type Cuerpo = Partial<Record<
  (typeof CAMPOS_USUARIO)[number] | (typeof CAMPOS_PLAN)[number] | 'email',
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
    // Antes de tocar nada (ni Auth): el plan no se edita por aquí.
    if (CAMPOS_PLAN.some(campo => campo in body)) {
      return NextResponse.json(
        { error: 'El plan de estudio (nivel, modalidad o carrera) se cambia con «Corregir plan», no aquí.' },
        { status: 400 },
      )
    }
    const admin = createAdminClient()

    // ── Objetivo (#187) y estado previo, que hace falta para revertir ───────
    const objetivo = await cargarAlumnoObjetivo(admin, params.id, user.id)
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    const anterior = objetivo.alumno
    // El id tal como está en la BD: con él van Auth y la tabla.
    const alumnoId = anterior.id

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
        .neq('id', alumnoId)
        .maybeSingle()

      if (ocupado) {
        return NextResponse.json(
          { error: 'Ese correo ya pertenece a otra cuenta de la plataforma.' },
          { status: 409 },
        )
      }

      // Auth PRIMERO: es la llave de acceso. Si esto falla, no se toca nada más.
      const { error: errAuth } = await admin.auth.admin.updateUserById(alumnoId, {
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
      const { error } = await admin.from('usuarios').update(parcheUsuario).eq('id', alumnoId)
      if (error) {
        // Reversión: Auth ya tiene el correo nuevo y la tabla no. Sin esto el
        // alumno queda entrando con un correo que la plataforma no reconoce.
        if (cambiaEmail && anterior.email) {
          await admin.auth.admin.updateUserById(alumnoId, { email: anterior.email })
        }
        console.error('[admin/alumnos/datos] update usuarios:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // ── Registro de quién editó y cuándo ────────────────────────────────────
    // El esquema base no trae tabla de auditoría ni columnas `updated_by`, así
    // que por ahora queda en el log del servidor (consultable en Vercel). Crear
    // esa tabla es un cambio de esquema y va aparte.
    console.info('[admin/alumnos/datos]', JSON.stringify({
      alumno: alumnoId,
      editado_por: user.id,
      cuando: new Date().toISOString(),
      campos: Object.keys(parcheUsuario),
    }))

    return NextResponse.json({ success: true, email_de_acceso_actualizado: cambiaEmail })
  } catch (err) {
    console.error('[PATCH /api/admin/alumnos/[id]/datos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
