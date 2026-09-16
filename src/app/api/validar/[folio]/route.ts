import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CONFIG } from '@/lib/config'
import { getMesesByModalidad } from '@/lib/modalidades'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/validar/[folio] — comprobación pública de una constancia.
 *
 * Un tercero —una empresa que contrata, otra escuela— teclea el folio impreso y
 * confirma que el documento salió de esta institución (TICKET-2026-09-16-11).
 *
 * 🛑 ESTE ENDPOINT ES PÚBLICO Y SIN SESIÓN. Devuelve lo MÍNIMO para confirmar
 * que la constancia es auténtica:
 *      nombre del alumno · programa · fecha de emisión · válida sí/no
 * NUNCA correo, teléfono, matrícula, calificaciones, materias ni avance. Quien
 * valida ya tiene el papel delante; lo que necesita es confirmarlo, no obtener
 * el expediente de una persona.
 *
 * Usa `service_role` a propósito: `constancias` tiene RLS («ver propias» / admin)
 * y un visitante anónimo no puede leer nada. El filtro de qué se expone lo hace
 * este código, con una lista blanca de campos, no la política.
 *
 * Responde SIEMPRE 200, también cuando el folio no existe: un 404 distinto
 * convierte el endpoint en un oráculo para descubrir folios válidos a fuerza de
 * probar.
 */

const sinCache = { 'Cache-Control': 'no-store' } as const

export async function GET(
  _request: Request,
  { params }: { params: { folio: string } },
) {
  const folio = decodeURIComponent(params.folio ?? '').trim().toUpperCase()

  const noEncontrada = NextResponse.json(
    { valida: false, folio },
    { status: 200, headers: sinCache },
  )

  // Forma esperada: PREFIJO-AAAA-NNNNNN. Descartar aquí lo que ni siquiera
  // tiene forma de folio evita una consulta por cada cadena al azar.
  if (!/^[A-Z0-9]{2,10}-\d{4}-\d{4,8}$/.test(folio)) return noEncontrada

  try {
    const admin = createAdminClient()

    const { data: constancia } = await admin
      .from('constancias')
      .select('alumno_id, fecha_emision')
      .eq('folio', folio)
      .is('materia_id', null)
      .maybeSingle()

    if (!constancia) return noEncontrada

    const fila = constancia as { alumno_id: string; fecha_emision: string }

    const { data: alumno } = await admin
      .from('alumnos')
      .select('nivel, modalidad, activo')
      .eq('id', fila.alumno_id)
      .maybeSingle()

    const { data: usuario } = await admin
      .from('usuarios')
      .select('nombre, apellidos')
      .eq('id', fila.alumno_id)
      .maybeSingle()

    const a = alumno as { nivel?: string | null; modalidad?: string | null; activo?: boolean } | null
    const u = usuario as { nombre?: string | null; apellidos?: string | null } | null

    const nombre = [u?.nombre, u?.apellidos].filter(Boolean).join(' ').trim()
    const nivel = a?.nivel ?? null
    const meses = getMesesByModalidad(a?.modalidad)

    const programa = nivel
      ? `${nivel.charAt(0).toUpperCase()}${nivel.slice(1)}${meses ? ` · Plan de ${meses} meses` : ''}`
      : 'Programa no especificado'

    return NextResponse.json(
      {
        valida: true,
        folio,
        alumno: nombre || 'Alumno',
        programa,
        fecha_emision: fila.fecha_emision,
        institucion: CONFIG.nombre,
      },
      { status: 200, headers: sinCache },
    )
  } catch (err) {
    console.error('[api/validar]', err)
    return noEncontrada
  }
}
