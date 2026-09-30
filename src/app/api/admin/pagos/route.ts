import { CONFIG } from '@/lib/config'
import { codigoMoneda, tipoCambioValido } from '@/lib/moneda'
import { getSiteConfig } from '@/lib/site-config'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cargarAlumnoObjetivo, respuestaObjetivo } from '@/lib/admin-alumno'
import { getUserRol, verifyStaff } from '@/lib/supabase/verify-admin'
import { CONCEPTOS_LECTURA, CONCEPTOS_PROGRAMA, totalesPorVertical } from '@/lib/pagos/conceptos'
import { leerPagosConCurso } from '@/lib/pagos/con-curso'

// El dominio del modal del PROGRAMA: fuente única en src/lib/pagos/conceptos.ts (D4).
const CONCEPTOS = CONCEPTOS_PROGRAMA
// El FILTRO del historial acepta todo lo que puede haber en la tabla, cursos
// incluidos (D14): antes un «curso_mensualidad» daba 400.
const CONCEPTOS_FILTRO = CONCEPTOS_LECTURA
const VERTICALES = ['programa', 'curso'] as const
const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'] as const

/**
 * GET /api/admin/pagos
 * Historial GLOBAL de pagos + KPIs, para /admin/pagos. Staff: admin y
 * secretario (el mismo alcance que el POST de abajo; el DELETE sigue
 * admin-only en [id]/route.ts).
 *
 * Query: ?q= (nombre, matrícula o referencia) &concepto= &vertical=programa|curso &desde= &hasta=
 *
 * D14 (#207-3): cada pago trae su curso (null = programa, por la FK) y los KPIs
 * se parten por vertical.
 *
 * El filtro por texto se resuelve EN EL SERVIDOR sobre las filas ya unidas y
 * no con un `.or()` de PostgREST: `alumnos.nombre.ilike.%x%` dentro de un
 * `.or()` no filtra la tabla embebida, devuelve la fila con el embed en null y
 * el resultado sale plagado de pagos "sin alumno". El volumen de una escuela
 * (miles de pagos, no millones) hace que traerlos y filtrarlos aquí sea
 * correcto y predecible.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied
    // D22a (decisión 4): el secretario ve el historial y «Pagos registrados», no
    // los ingresos (por eso Informes no está en su menú). Condición POSITIVA.
    const conIngresos = (await getUserRol(supabase, user.id)) === 'ADMIN'

    const { searchParams } = new URL(request.url)
    const q        = (searchParams.get('q') ?? '').trim().toLowerCase()
    const concepto = searchParams.get('concepto') || undefined
    const desde    = searchParams.get('desde')    || undefined
    const hasta    = searchParams.get('hasta')    || undefined
    const vertical = searchParams.get('vertical') || undefined

    if (concepto && !CONCEPTOS_FILTRO.includes(concepto as typeof CONCEPTOS_FILTRO[number])) {
      return NextResponse.json({ error: `Concepto inválido. Usa: ${CONCEPTOS_FILTRO.join(', ')}` }, { status: 400 })
    }
    if (vertical && !VERTICALES.includes(vertical as typeof VERTICALES[number])) {
      return NextResponse.json({ error: `Vertical inválida. Usa: ${VERTICALES.join(', ')}` }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: leidos, error, sinB1 } = await leerPagosConCurso<{ alumno_id: string; monto: number | string; fecha_pago: string | null; referencia: string | null }>(
      (select) => {
        let query = admin
          .from('pagos')
          .select(select)
          .order('fecha_pago', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(2000)
        if (concepto) query = query.eq('concepto', concepto)
        if (desde)    query = query.gte('fecha_pago', desde)
        if (hasta)    query = query.lte('fecha_pago', hasta)
        // La vertical va por la FK; sin B1 (la segunda lectura) no existe la columna.
        if (vertical && select.includes('curso_inscripcion_id')) {
          query = vertical === 'curso'
            ? query.not('curso_inscripcion_id', 'is', null)
            : query.is('curso_inscripcion_id', null)
        }
        return query
      },
      'id, alumno_id, monto, concepto, mes_desbloqueado, metodo_pago, referencia, fecha_pago, created_at',
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Sin B1 todos los pagos son del programa: «solo cursos» es la lista vacía.
    const pagos = sinB1 && vertical === 'curso' ? [] : leidos

    // Datos del alumno en una sola pasada, no un join por fila.
    const ids = [...new Set(pagos.map(p => p.alumno_id))]
    const [{ data: usuarios }, { data: alumnos }] = ids.length
      ? await Promise.all([
          admin.from('usuarios').select('id, nombre, apellidos, telefono').in('id', ids),
          admin.from('alumnos').select('id, matricula, nivel').in('id', ids),
        ])
      : [{ data: [] }, { data: [] }]

    const porUsuario = new Map((usuarios ?? []).map(u => [u.id, u]))
    const porAlumno  = new Map((alumnos  ?? []).map(a => [a.id, a]))

    let filas = pagos.map(p => {
      const u = porUsuario.get(p.alumno_id)
      const a = porAlumno.get(p.alumno_id)
      return {
        ...p,
        monto: Number(p.monto),
        alumno_nombre: [u?.nombre, u?.apellidos].filter(Boolean).join(' ') || 'Alumno',
        // `nivel` viaja porque la mensualidad correcta depende de él: en este
        // cliente prepa y secundaria no cuestan lo mismo.
        alumno_nivel: a?.nivel ?? null,
        matricula: a?.matricula ?? null,
        tiene_telefono: Boolean(u?.telefono),
      }
    })

    if (q) {
      filas = filas.filter(f =>
        f.alumno_nombre.toLowerCase().includes(q)
        || (f.matricula  ?? '').toLowerCase().includes(q)
        || (f.referencia ?? '').toLowerCase().includes(q)
      )
    }

    // KPIs sobre lo que el usuario está viendo, no sobre la tabla entera: si
    // filtró por marzo, "Ingresos del mes" de todo el histórico sería un dato
    // que no corresponde a nada de la pantalla.
    const hoy = new Date()
    const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
    const suma = (xs: typeof filas) => xs.reduce((acc, f) => acc + f.monto, 0)
    const delMes = filas.filter(f => (f.fecha_pago ?? '') >= inicioMes)
    const vMes = totalesPorVertical(delMes), vTotal = totalesPorVertical(filas)

    return NextResponse.json({
      pagos: filas,
      kpis: conIngresos
        ? {
            ingresosMes:      suma(delMes),
            ingresosTotales:  suma(filas),
            pagosRegistrados: filas.length,
            // D14: el subtítulo «Programa · Cursos» de cada tarjeta.
            porVertical: {
              mes:   { programa: vMes.programa,   cursos: vMes.cursos },
              total: { programa: vTotal.programa, cursos: vTotal.cursos },
            },
          }
        : { pagosRegistrados: filas.length },
    })
  } catch (err) {
    console.error('[GET /api/admin/pagos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * POST /api/admin/pagos
 * Registra un pago manual de un alumno (siempre capturado por admin).
 * Body: { alumno_id, monto, concepto?, mes_desbloqueado?, metodo_pago, referencia? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Staff: el secretario también registra pagos (el DELETE sigue admin-only)
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const body = await request.json()
    const { alumno_id, monto, referencia } = body
    const concepto = body.concepto ?? 'mensualidad'
    const metodo_pago = body.metodo_pago

    // fecha_pago editable (YYYY-MM-DD). Si no viene, la BD usa CURRENT_DATE por
    // default. Permite registrar pagos con fecha real/retroactiva. Se valida que
    // sea una fecha REAL (el regex solo no basta: new Date('2026-02-30') hace
    // roll-over y Postgres la rechazaría con un 500 críptico).
    let fechaPago: string | undefined
    if (body.fecha_pago !== undefined && body.fecha_pago !== null && body.fecha_pago !== '') {
      const f = String(body.fecha_pago)
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f)
      const d = m ? new Date(`${f}T12:00:00`) : null
      const esFechaReal = !!m && !!d && !Number.isNaN(d.getTime())
        && d.getFullYear() === Number(m[1])
        && d.getMonth() + 1 === Number(m[2])
        && d.getDate() === Number(m[3])
      if (!esFechaReal) {
        return NextResponse.json({ error: 'fecha_pago inválida. Usa una fecha real en formato YYYY-MM-DD' }, { status: 400 })
      }
      fechaPago = f
    }

    if (typeof alumno_id !== 'string' || !alumno_id) {
      return NextResponse.json({ error: 'El campo alumno_id es requerido' }, { status: 400 })
    }
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return NextResponse.json({ error: 'El monto debe ser un número mayor a 0' }, { status: 400 })
    }
    if (!CONCEPTOS.includes(concepto)) {
      return NextResponse.json({ error: `Concepto inválido. Usa: ${CONCEPTOS.join(', ')}` }, { status: 400 })
    }
    if (typeof metodo_pago !== 'string' || !METODOS.includes(metodo_pago.toUpperCase() as typeof METODOS[number])) {
      return NextResponse.json({ error: `Método de pago inválido. Usa: ${METODOS.join(', ')}` }, { status: 400 })
    }

    // mes_desbloqueado solo aplica a mensualidades; NULL para inscripción/otro
    let mesDesbloqueado: number | null = null
    if (concepto === 'mensualidad' && body.mes_desbloqueado !== undefined && body.mes_desbloqueado !== null && body.mes_desbloqueado !== '') {
      const mes = Number(body.mes_desbloqueado)
      if (!Number.isInteger(mes) || mes <= 0) {
        return NextResponse.json({ error: 'mes_desbloqueado debe ser un entero mayor a 0' }, { status: 400 })
      }
      mesDesbloqueado = mes
    }

    const admin = createAdminClient()
    // El tipo de cambio se edita desde el panel, así que sale de la config
    // fusionada (BD + config.ts), no del config.ts a secas.
    const cfgSitio = await getSiteConfig()

    // #187: que exista Y que sea una cuenta de ALUMNO (no personal, no uno mismo),
    // con el rol leído de la BD, antes de insertar.
    const objetivo = await cargarAlumnoObjetivo(admin, alumno_id, user.id)
    if (!objetivo.ok) return respuestaObjetivo(objetivo)

    const { data: pago, error } = await admin
      .from('pagos')
      .insert({
        alumno_id: objetivo.alumno.id,
        monto: montoNum,
        concepto,
        mes_desbloqueado: mesDesbloqueado,
        metodo_pago: metodo_pago.toUpperCase(),
        referencia: typeof referencia === 'string' && referencia.trim() !== '' ? referencia.trim() : null,
        registrado_por: user.id,
        ...(fechaPago ? { fecha_pago: fechaPago } : {}),
        // La moneda y el tipo de cambio SOLO se escriben si la escuela no cobra
        // en pesos. En una escuela en MXN el insert queda byte a byte como
        // antes de #198, así que los ~144 clientes ya desplegados no necesitan
        // la migración 20260910120000 para seguir registrando pagos.
        //
        // Se guarda el tipo de cambio VIGENTE HOY, no se deriva al leer: es lo
        // que congela el recibo. Si el admin lo actualiza mañana, este pago
        // conserva la equivalencia que se le enseñó al alumno.
        // D15: el CÓDIGO ISO (codigoMoneda), no el valor crudo: un config.ts con
        // la moneda como objeto ({ codigo: 'USD', … }) tronaba el CHECK
        // pagos_moneda_iso con un 500.
        ...(codigoMoneda(CONFIG.moneda) !== 'MXN'
          ? { moneda: codigoMoneda(CONFIG.moneda), tipo_cambio_aplicado: tipoCambioValido(cfgSitio.tipoCambioMXN) }
          : {}),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, pago }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/pagos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
