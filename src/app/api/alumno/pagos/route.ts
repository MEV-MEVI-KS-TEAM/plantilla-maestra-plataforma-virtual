/**
 * Calendario de cuotas semanales del alumno que está en sesión.
 *
 * Solo tiene sentido con `CONFIG.periodicidad === 'semanal'`. El calendario
 * vive en `calendario_pagos` (una fila por semana) y NO en `pagos`, que es el
 * libro de dinero real: meter ahí las semanas pendientes inflaría todos los
 * reportes de ingresos, que suman `pagos.monto` sin filtrar por estado.
 *
 * La sesión sirve para IDENTIFICAR al alumno; los datos se leen con
 * service_role SIEMPRE filtrando por `user.id`. Es como funciona el resto de
 * `/api/alumno/*`: en esta plantilla `authenticated` no tiene privilegios de
 * tabla sobre `alumnos` ni `pagos`, y ningún componente de cliente lee tablas
 * por PostgREST. La política RLS del calendario queda como defensa en
 * profundidad.
 *
 * 'vencido' NO está guardado: se deriva (pendiente + fecha ya pasada). Así no
 * hace falta un cron y el estado nunca queda desactualizado.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteConfig } from '@/lib/site-config'
import { esSemanal } from '@/lib/periodicidad'
import { modalidadPorNivel, getTotalPlan } from '@/lib/modalidades'

export const dynamic = 'force-dynamic'

type Fila = {
  numero_semana: number
  total_semanas: number
  fecha_vencimiento: string
  monto: number
  estado: 'pendiente' | 'pagado' | 'vencido' | 'condonado'
  condonado_motivo: string | null
}

/** Hoy en horario de México, que es el que ve la escuela. */
function hoyMX(): string {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    .toISOString().slice(0, 10)
}

/** La certificación del nivel, con los alias que conviven en `precios`. */
function certificacionDe(nivel: string | null, p: Record<string, unknown>): number {
  if (nivel === 'secundaria')   return Number(p.certificacionSecundaria ?? p.certificacion_secundaria ?? 0)
  if (nivel === 'preparatoria') return Number(p.certificacionPreparatoria ?? p.certificacion_preparatoria ?? 0)
  return 0
}

export async function GET() {
  try {
    // La ruta no se monta en una escuela mensual (el middleware la redirige),
    // pero la API se responde igual: un 404 silencioso es más difícil de
    // diagnosticar que un cuerpo que dice qué pasa.
    if (!esSemanal()) {
      return NextResponse.json({ periodicidad: 'mensual', semanas: [] })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // service_role, acotado por `user.id`: nunca se recibe el id desde fuera.
    const admin = createAdminClient()
    const cfg = await getSiteConfig()

    const { data: alumno } = await admin
      .from('alumnos')
      .select('nivel, modalidad, inscripcion_pagada, matricula')
      .eq('id', user.id)
      .single()

    const nivel = alumno?.nivel ?? null
    // Precios del config FUSIONADO: si el admin cambió la cuota en su panel, el
    // alumno ve la vigente en el resumen del plan. Las semanas ya generadas
    // conservan su monto congelado, que es lo que de verdad debe.
    const plan = modalidadPorNivel(nivel, cfg.modalidades)

    const { data, error } = await admin
      .from('calendario_pagos')
      .select('numero_semana, total_semanas, fecha_vencimiento, monto, estado, condonado_motivo')
      .eq('alumno_id', user.id)
      .order('numero_semana', { ascending: true })

    if (error) {
      console.error('[alumno/pagos] error:', error)
      return NextResponse.json({ error: 'No se pudo leer el calendario' }, { status: 500 })
    }

    const hoy = hoyMX()
    const semanas = (data ?? []).map((f: Fila) => ({
      ...f,
      monto: Number(f.monto),
      // Se deriva aquí, no en la BD.
      estado: f.estado === 'pendiente' && f.fecha_vencimiento < hoy ? 'vencido' as const : f.estado,
    }))

    const pagadas    = semanas.filter(s => s.estado === 'pagado')
    const condonadas = semanas.filter(s => s.estado === 'condonado')
    const vencidas   = semanas.filter(s => s.estado === 'vencido')
    const proxima    = semanas.find(s => s.estado === 'pendiente' || s.estado === 'vencido') ?? null

    const precios = cfg.precios as unknown as Record<string, unknown>

    return NextResponse.json({
      // `null` cuando el alumno no lleva calendario semanal (diplomado o sin
      // nivel): la pantalla lo explica en vez de pintar una tabla vacía.
      periodicidad:  plan ? 'semanal' : null,
      nivel,
      matricula:     alumno?.matricula ?? null,
      inscripcion_pagada: alumno?.inscripcion_pagada ?? false,
      moneda:        cfg.moneda,
      // El total del calendario manda sobre el del catálogo: un alumno con plan
      // a medida tiene las semanas que le generó el admin, no las del plan.
      semanas_total: semanas.length || plan?.semanas || 0,
      cuota:         plan?.cuotaSemanal ?? 0,
      total_plan:    plan ? getTotalPlan(plan, Number(precios.inscripcion ?? 0)) : 0,
      certificacion: certificacionDe(nivel, precios),
      resumen: {
        pagadas:     pagadas.length,
        condonadas:  condonadas.length,
        vencidas:    vencidas.length,
        monto_pagado:   pagadas.reduce((a, s) => a + s.monto, 0),
        monto_vencido:  vencidas.reduce((a, s) => a + s.monto, 0),
        saldo_pendiente: semanas
          .filter(s => s.estado === 'pendiente' || s.estado === 'vencido')
          .reduce((a, s) => a + s.monto, 0),
        proxima_semana: proxima?.numero_semana ?? null,
        proxima_fecha:  proxima?.fecha_vencimiento ?? null,
      },
      semanas,
    })
  } catch (e) {
    console.error('[alumno/pagos] error inesperado:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
