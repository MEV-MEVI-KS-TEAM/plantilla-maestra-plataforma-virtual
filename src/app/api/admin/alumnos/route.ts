import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStaff } from '@/lib/supabase/verify-admin'
import { CONFIG } from '@/lib/config'
import { getMesesByModalidad, getDefaultModalidadId } from '@/lib/modalidades'
import { nivelForzadoDeRegistro } from '@/lib/modo'
import { getCarreras, getPlanNombre } from '@/lib/licenciatura-utils'
import { catalogoDeRegistro, nivelesPermitidos } from '@/lib/niveles'
import { MENSAJES_PLAN_ADMIN, motivoPlanInvalido } from '@/lib/registro-reglas'
import { sincronizarPrefijoMatricula } from '@/lib/matricula'
import { generarCalendarioSemanal } from '@/lib/plan-semanal'
import { getOfertaIngreso } from '@/lib/cursos/oferta'
import { limiteVentana, hayModuloVisible } from '@/lib/cursos/acceso'
import { conAccesoTotal } from '@/lib/cursos/acceso-total'
import { porActivar } from '@/lib/cursos/bitacora'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'
import { precioCursoNumerico } from '@/lib/cursos/precio-curso'
import { esRolAlumno } from '@/lib/admin-alumno'
import { ROL_ALTA, datosAltaDesdeCuerpo, deshacerAlta, filaUsuarioAlta, mensajeAltaAMedias, opcionesAuthAlta, revertirAltaSinCursos } from '@/lib/alta-alumno'

/**
 * Un alumno de CURSO (`nivel = 'diplomado'`) o sin nivel no cursa el programa
 * escolar: su duración no sale de las modalidades de secundaria o preparatoria.
 *
 * ⚠️ `getMesesByModalidad(null)` NO devuelve null: cae al fallback «primera
 * modalidad activa». Sin esta guarda el listado le anuncia «0 de 3 meses» de un
 * plan que ese alumno no tiene, que es justo lo que ve la escuela en cuanto
 * empieza a inscribir gente a sus cursos.
 */
function sinPlanEscolar(nivel: string | null | undefined): boolean {
  return !nivel || nivel === 'diplomado'
}

// ─── «Por activar» (D8) ────────────────────────────────────────────────────────
// El registro público («¿Cuál?») crea la inscripción con 0 meses y aquí no se
// veía: la escuela tenía que adivinar a quién abrirle el curso (D0, obs-b). La
// lista la calcula la base (curso_inscripciones_por_activar), con el MISMO
// predicado que la función que activa: sin traer ids a la URL ni cortarse en
// 1000 filas. Sin la migración D8 nadie sale «por activar» (el botón daría 503).
type CursoPorActivar = { id: string; nombre: string }
async function anexarPorActivar<T extends { id: string }>(
  admin: ReturnType<typeof createAdminClient>,
  filas: T[],
): Promise<Array<T & { cursos_por_activar: CursoPorActivar[] }>> {
  const porAlumno = new Map<string, CursoPorActivar[]>()
  if (filas.length > 0) {
    for (const p of (await porActivar(admin)) ?? []) {
      if (!porAlumno.has(p.alumno_id)) porAlumno.set(p.alumno_id, [])
      porAlumno.get(p.alumno_id)!.push({ id: p.curso_id, nombre: p.curso_nombre })
    }
  }
  return filas.map(f => ({ ...f, cursos_por_activar: porAlumno.get(f.id) ?? [] }))
}

// ─── Curso de ingreso solicitado ──────────────────────────────────────────────
// Se resuelve APARTE de la consulta principal, no dentro de su `select`, y se
// aplica a los tres retornos. Los tres intentos consultan schemas distintos y
// no se sabe de antemano cuál responderá en un cliente dado; añadir el campo
// solo al primero deja la columna vacía en los demás sin que nada falle. Eso
// pasó de verdad: el intento 1 pedía una columna inexistente, todos los
// clientes servían por el fallback, y el campo nuevo nunca llegó a la UI.
// Si el cliente aún no corrió la migración de `curso_solicitado`, el select
// falla, `solicitudes` viene null y todos salen sin curso: degrada, no rompe.
async function anexarCursoIngreso<T extends { id: string }>(
  admin: ReturnType<typeof createAdminClient>,
  filas: T[],
  // Asignar (POST inscripciones) y abrir meses: todo el staff desde D7b
  // (decisión 6). Queda el parámetro por si un rol futuro solo mira.
  puedeGestionar: boolean,
) {
  const sinCurso = {
    curso_solicitado:        null as string | null,
    curso_solicitado_nombre: null as string | null,
    curso_solicitado_ids:    [] as string[],
    curso_activado:          false,
    curso_acceso_pendiente:  false,
    curso_puede_gestionar:   false,
  }
  if (filas.length === 0) return filas.map(f => ({ ...f, ...sinCurso }))

  const { data: solicitudes } = await admin
    .from('alumnos')
    .select('id, curso_solicitado')
    .not('curso_solicitado', 'is', null)

  const pedido = new Map<string, string>()
  for (const s of (solicitudes ?? []) as { id: string; curso_solicitado: string | null }[]) {
    if (s.curso_solicitado) pedido.set(s.id, s.curso_solicitado)
  }
  if (pedido.size === 0) return filas.map(f => ({ ...f, ...sinCurso }))

  // El estado se DERIVA de curso_inscripciones en vez de guardarse como flag:
  // un flag se desincroniza en cuanto el admin quita al alumno desde /admin/cursos.
  // Y «activado» exige ACCESO REAL (la misma ventana que la RLS, limiteVentana),
  // no solo que exista la fila: una inscripción con 0 meses abiertos salía
  // «Activado» mientras el alumno veía «no tiene lecciones» (#183, Bug 106).
  type FilaIns = { alumno_id: string; curso_id: string; meses_desbloqueados: number | null; estado: string | null; fecha_vencimiento: string | null; acceso_total?: boolean | null }
  const inscritos = new Map<string, Map<string, FilaIns>>()
  const { data: ins } = await conAccesoTotal<FilaIns[]>('alumno_id, curso_id, meses_desbloqueados, estado, fecha_vencimiento',
    campos => admin
      .from('curso_inscripciones')
      .select(campos)
      .in('alumno_id', [...pedido.keys()]))
  for (const r of (ins ?? []) as FilaIns[]) {
    if (!inscritos.has(r.alumno_id)) inscritos.set(r.alumno_id, new Map())
    inscritos.get(r.alumno_id)!.set(r.curso_id, r)
  }
  // Solo los cursos de las ofertas pedidas: son los únicos que se evalúan, y así
  // la consulta de módulos no crece con todo lo inscrito (PostgREST corta en 1000).
  const idsCursos = [...new Set([...pedido.values()].flatMap(o => getOfertaIngreso(o)?.cursoIds ?? []))]
  const cursos = new Map<string, { modulos_por_mes: number | null; estado: string | null }>()
  if (idsCursos.length > 0) {
    const { data: cs } = await admin.from('cursos').select('id, modulos_por_mes, estado').in('id', idsCursos)
    for (const c of (cs ?? []) as { id: string; modulos_por_mes: number | null; estado: string | null }[]) cursos.set(c.id, c)
  }
  // Los `orden` de TODOS sus módulos: «activado» exige ver al menos uno (su
  // posición < límite, #255), el mismo eje que la RLS, no solo que la ventana sea > 0.
  const ordenes = new Map<string, (number | null)[]>()
  if (idsCursos.length > 0) {
    const { data: ms } = await admin.from('curso_modulos').select('curso_id, orden').in('curso_id', idsCursos)
    for (const m of (ms ?? []) as { curso_id: string; orden: number | null }[]) {
      if (!ordenes.has(m.curso_id)) ordenes.set(m.curso_id, [])
      ordenes.get(m.curso_id)!.push(m.orden)
    }
  }

  return filas.map(f => {
    const oferta = getOfertaIngreso(pedido.get(f.id))
    if (!oferta) return { ...f, ...sinCurso }
    const ya = inscritos.get(f.id) ?? new Map<string, FilaIns>()
    const inscritoEnTodos = oferta.cursoIds.every(id => ya.has(id))
    const conAcceso = oferta.cursoIds.every(id =>
      hayModuloVisible(ordenes.get(id) ?? [], limiteVentana(ya.get(id), cursos.get(id))))
    return {
      ...f,
      curso_solicitado:        pedido.get(f.id) ?? null,
      curso_solicitado_nombre: oferta.nombre,
      curso_solicitado_ids:    oferta.cursoIds,
      // Para el paquete, "activado" exige TODOS sus cursos: con uno solo seguiría incompleto.
      curso_activado:          inscritoEnTodos && conAcceso,
      // Inscrito en todos, pero sin acceso abierto todavía (0 meses, suspendida…).
      curso_acceso_pendiente:  inscritoEnTodos && !conAcceso,
      curso_puede_gestionar:   puedeGestionar,
    }
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Lectura de la lista: staff (ADMIN o SECRETARIO)
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied
    // D7b (decisión 6): asignar y abrir cursos es de todo el staff, no solo del admin.
    const puedeGestionarCursos = true

    const admin = createAdminClient()

    // Los tres intentos de abajo van de más a menos específico. Ojo al pedir
    // columnas: si UNA no existe, PostgREST tumba la consulta entera y se cae
    // al siguiente intento en silencio. Eso llevaba pasando con `sindicalizado`
    // —la columna real de schema-01-tablas.sql es `es_sindicalizado`—, así que
    // ningún cliente llegaba al intento 1 y todos servían por el fallback, que
    // hace una consulta a `usuarios` POR ALUMNO. Peor: cualquier campo nuevo
    // que se agregara solo al intento 1 quedaba como código muerto.
    // Antes de sumar una columna aquí, confirmar que existe en el schema.

    // ── Intento 1: nuevo schema — alumnos.id = usuarios.id ───────────────────
    const { data, error } = await admin
      .from('alumnos')
      .select(`
        id,
        matricula,
        nivel,
        modalidad,
        carrera,
        es_sindicalizado,
        activo,
        meses_desbloqueados,
        inscripcion_pagada,
        contactado_whatsapp,
        created_at,
        usuarios!inner(
          nombre,
          apellidos,
          email,
          foto_url,
          telefono,
          rol
        )
      `)
      .order('created_at', { ascending: false })

    console.log('[GET /api/admin/alumnos] error schema nuevo:', error?.message ?? null)
    console.log('[GET /api/admin/alumnos] data count:', data?.length ?? 0)

    if (!error && data && data.length > 0) {
      type Row = {
        id: string; matricula?: string; nivel?: string; modalidad?: string; carrera?: string | null
        es_sindicalizado?: boolean; sindicalizado?: boolean; activo?: boolean; meses_desbloqueados?: number
        inscripcion_pagada?: boolean; contactado_whatsapp?: boolean; created_at: string
        usuarios: { nombre?: string; apellidos?: string; email?: string; foto_url?: string | null; telefono?: string | null; rol?: string | null } | null
      }
      // #187: una cuenta de PERSONAL con fila en `alumnos` (un admin ascendido
      // desde alumno, o una fila fabricada) no se lista como alumno: la lista
      // no le ofrece acciones de alumno. Sus rutas responden 403 de todos modos.
      const soloAlumnos = (data as unknown as Row[]).filter(a => {
        const u = Array.isArray(a.usuarios) ? a.usuarios[0] : a.usuarios
        return esRolAlumno(u?.rol)
      })
      const result = soloAlumnos.map(a => {
        const u = Array.isArray(a.usuarios) ? a.usuarios[0] : a.usuarios
        return {
          id:                   a.id,
          matricula:            a.matricula ?? `${CONFIG.nombre}-0000`,
          nivel:                a.nivel ?? null,
          carrera:              a.carrera ?? null,
          plan_nombre:          getPlanNombre(a.nivel, a.carrera),
          modalidad:            a.modalidad ?? (sinPlanEscolar(a.nivel) ? null : getDefaultModalidadId()),
          sindicalizado:        a.es_sindicalizado ?? a.sindicalizado ?? false,
          activo:               a.activo ?? false,
          meses_desbloqueados:  a.meses_desbloqueados ?? 0,
          duracion_meses:       sinPlanEscolar(a.nivel) ? 0 : getMesesByModalidad(a.modalidad),
          inscripcion_pagada:   a.inscripcion_pagada ?? false,
          contactado_whatsapp:  a.contactado_whatsapp ?? false,
          created_at:           a.created_at,
          nombre_completo:      [u?.nombre, u?.apellidos].filter(Boolean).join(' ') || '—',
          email:                u?.email ?? '—',
          foto_url:             u?.foto_url ?? null,
          telefono:             u?.telefono ?? null,
        }
      })
      return NextResponse.json(await anexarPorActivar(admin, await anexarCursoIngreso(admin, result, puedeGestionarCursos)))
    }

    // ── Intento 2: schema antiguo — alumnos.usuario_id → usuarios.id ─────────
    const { data: data2, error: error2 } = await admin
      .from('alumnos')
      .select(`
        id,
        matricula,
        nivel,
        modalidad,
        carrera,
        es_sindicalizado,
        activo,
        meses_desbloqueados,
        inscripcion_pagada,
        contactado_whatsapp,
        created_at,
        usuario_id,
        usuarios!alumnos_usuario_id_fkey(
          nombre,
          apellidos,
          email,
          foto_url,
          telefono,
          rol
        )
      `)
      .order('created_at', { ascending: false })

    console.log('[GET /api/admin/alumnos] error schema antiguo:', error2?.message ?? null)
    console.log('[GET /api/admin/alumnos] data2 count:', data2?.length ?? 0)

    if (!error2 && data2 && data2.length > 0) {
      type Row2 = {
        id: string; matricula?: string; nivel?: string; modalidad?: string; carrera?: string | null
        es_sindicalizado?: boolean; sindicalizado?: boolean; activo?: boolean; meses_desbloqueados?: number
        inscripcion_pagada?: boolean; contactado_whatsapp?: boolean; created_at: string; usuario_id?: string
        usuarios: { nombre?: string; apellidos?: string; email?: string; foto_url?: string | null; telefono?: string | null; rol?: string | null } | null
      }
      // #187: sin personal, igual que el intento 1 (aquí la cuenta puede faltar).
      const result2 = (data2 as unknown as Row2[]).filter(a => {
        const u = Array.isArray(a.usuarios) ? a.usuarios[0] : a.usuarios
        return !u || esRolAlumno(u.rol)
      }).map(a => {
        const u = Array.isArray(a.usuarios) ? a.usuarios[0] : a.usuarios
        return {
          id:                   a.id,
          matricula:            a.matricula ?? `${CONFIG.nombre}-0000`,
          nivel:                a.nivel ?? null,
          carrera:              a.carrera ?? null,
          plan_nombre:          getPlanNombre(a.nivel, a.carrera),
          modalidad:            a.modalidad ?? (sinPlanEscolar(a.nivel) ? null : getDefaultModalidadId()),
          sindicalizado:        a.es_sindicalizado ?? a.sindicalizado ?? false,
          activo:               a.activo ?? false,
          meses_desbloqueados:  a.meses_desbloqueados ?? 0,
          duracion_meses:       sinPlanEscolar(a.nivel) ? 0 : getMesesByModalidad(a.modalidad),
          inscripcion_pagada:   a.inscripcion_pagada ?? false,
          contactado_whatsapp:  a.contactado_whatsapp ?? false,
          created_at:           a.created_at,
          nombre_completo:      [u?.nombre, u?.apellidos].filter(Boolean).join(' ') || '—',
          email:                u?.email ?? '—',
          foto_url:             u?.foto_url ?? null,
          telefono:             u?.telefono ?? null,
        }
      })
      return NextResponse.json(await anexarPorActivar(admin, await anexarCursoIngreso(admin, result2, puedeGestionarCursos)))
    }

    // ── Fallback: alumnos sin join + usuarios por separado ────────────────────
    console.log('[GET /api/admin/alumnos] usando fallback sin join')
    const { data: alumnos, error: errorFallback } = await admin
      .from('alumnos')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[GET /api/admin/alumnos] fallback error:', errorFallback?.message ?? null)
    console.log('[GET /api/admin/alumnos] fallback alumnos count:', alumnos?.length ?? 0)
    if (alumnos?.[0]) console.log('[GET /api/admin/alumnos] sample row keys:', Object.keys(alumnos[0]))

    const resultFallback = []
    for (const a of (alumnos ?? []) as {
      id: string; matricula?: string; nivel?: string; modalidad?: string; carrera?: string | null
      es_sindicalizado?: boolean; sindicalizado?: boolean; activo?: boolean; meses_desbloqueados?: number
      inscripcion_pagada?: boolean; contactado_whatsapp?: boolean; created_at: string
    }[]) {
      const { data: u } = await admin
        .from('usuarios')
        .select('nombre, apellidos, email, foto_url, telefono, rol')
        .eq('id', a.id)
        .single()
      // #187: sin personal, igual que el intento 1.
      if (u && !esRolAlumno((u as { rol?: unknown }).rol)) continue
      resultFallback.push({
        id:                   a.id,
        matricula:            a.matricula ?? `${CONFIG.nombre}-0000`,
        nivel:                a.nivel ?? null,
        carrera:              a.carrera ?? null,
        plan_nombre:          getPlanNombre(a.nivel, a.carrera),
        modalidad:            a.modalidad ?? (sinPlanEscolar(a.nivel) ? null : getDefaultModalidadId()),
        sindicalizado:        a.es_sindicalizado ?? a.sindicalizado ?? false,
        activo:               a.activo ?? false,
        meses_desbloqueados:  a.meses_desbloqueados ?? 0,
        duracion_meses:       sinPlanEscolar(a.nivel) ? 0 : getMesesByModalidad(a.modalidad),
        inscripcion_pagada:   a.inscripcion_pagada ?? false,
        contactado_whatsapp:  a.contactado_whatsapp ?? false,
        created_at:           a.created_at,
        nombre_completo:      [(u as {nombre?:string}|null)?.nombre, (u as {apellidos?:string}|null)?.apellidos].filter(Boolean).join(' ') || '—',
        email:                (u as {email?:string}|null)?.email ?? '—',
        foto_url:             (u as {foto_url?:string|null}|null)?.foto_url ?? null,
        telefono:             (u as {telefono?:string|null}|null)?.telefono ?? null,
      })
    }
    return NextResponse.json(await anexarPorActivar(admin, await anexarCursoIngreso(admin, resultFallback, puedeGestionarCursos)))

  } catch (err) {
    console.error('[GET /api/admin/alumnos] excepción:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // D21a (decisión de Kevin, 27-sep-2026): el alta la da el PERSONAL, admin o
    // secretario. Va ANTES de leer el cuerpo y de crear nada. Lo que sale de
    // aquí es siempre un alumno (ROL_ALTA): el personal se crea solo en
    // /api/admin/usuarios, que sigue siendo del admin.
    const denied = await verifyStaff(supabase, user.id)
    if (denied) return denied

    const body = await request.json()
    const { nivel, modalidad, carrera } = body
    // Nombre, correo, contraseña y teléfono: campo por campo (lib/alta-alumno).
    // El `rol` del cuerpo, o cualquier otra clave, no llega a Auth ni a usuarios.
    const datos = datosAltaDesdeCuerpo(body)
    const { nombre, password } = datos
    // Cursos a los que se inscribe al alumno en el mismo alta. Llega solo
    // cuando el nivel elegido es el del catálogo ('diplomado').
    const cursosIds: string[] = Array.isArray(body.cursos_ids)
      ? (body.cursos_ids as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
      : []

    const correoCapturado = typeof body.email === 'string' ? body.email.trim() : ''
    if (!nombre || !correoCapturado || !password) {
      return NextResponse.json({ error: 'nombre, email y password son requeridos' }, { status: 400 })
    }
    // Se crea una cuenta YA CONFIRMADA: con un correo sin forma de correo nadie
    // podría entrar, y ese correo quedaría ocupado.
    const email = datos.email
    if (!email) {
      return NextResponse.json({ error: 'El correo no tiene un formato válido.' }, { status: 400 })
    }
    // ── B7: en solo_cursos el nivel lo decide el SERVIDOR ─────────────────────
    // Esta es la SEGUNDA puerta que escribe alumnos.nivel (la otra es el
    // registro público). B7 cerró aquella y sin esto dejaba esta abierta: el
    // admin que diera de alta a mano en un instituto de diplomados creaba un
    // alumno 'preparatoria', y `nivel` es write-once — no hay pantalla ni
    // endpoint para corregirlo después. Las dos puertas tienen que producir
    // exactamente la misma fila.
    const nivelForzado = nivelForzadoDeRegistro()   // 'diplomado' | null

    // Los valores deben coincidir EXACTAMENTE con alumnos_nivel_check
    // (supabase/schema.sql:30). Aceptar aquí un nivel que la BD rechaza hace
    // que el INSERT falle y que la ruta borre el usuario de Auth recién creado.
    // La lista sale de los productos activos del cliente y ya no está escrita a
    // mano aquí (TICKET-2026-09-07-52): con la whitelist fija, cualquier opción
    // nueva del desplegable moría con un 400 en esta línea.
    const nivelesOk = nivelesPermitidos(true)
    if (!nivelForzado && (!nivel || !nivelesOk.includes(nivel))) {
      return NextResponse.json(
        { error: `nivel es requerido (${nivelesOk.join(', ')})` },
        { status: 400 },
      )
    }

    // Un alumno de curso sin curso no existe: entraría con nivel 'diplomado' y
    // sin nada que ver, y `nivel` es write-once. Se corta aquí, ANTES de crear
    // el usuario de Auth, para no dejar cuentas huérfanas.
    const nivelElegido = nivelForzado ?? nivel
    if (nivelElegido === 'diplomado' && cursosIds.length === 0) {
      return NextResponse.json(
        { error: 'Selecciona al menos un curso o diplomado' },
        { status: 400 },
      )
    }

    // ⚠️ NO se confía del cliente el id que manda: se valida contra los cursos
    // realmente PUBLICADOS, igual que en /api/auth/register-complete. Un POST a
    // mano con el UUID de un curso en borrador no debe inscribir a nadie.
    const admin = createAdminClient()

    let cursosValidados: { id: string; nombre: string; precio_inscripcion: number | null; precio_mensualidad: number | null }[] = []
    if (cursosIds.length > 0) {
      const { data: publicados } = await admin
        .from('cursos')
        .select('id, nombre, precio_inscripcion, precio_mensualidad')
        .in('id', cursosIds)
        .eq('estado', 'publicado')
      cursosValidados = (publicados ?? []) as typeof cursosValidados
      if (cursosValidados.length === 0) {
        return NextResponse.json(
          { error: 'Los cursos seleccionados ya no están disponibles. Elige otros.' },
          { status: 400 },
        )
      }
    }

    // La carrera decide QUÉ catálogo ve el alumno (lib/acceso-materias) y, como
    // `nivel`, no hay pantalla para corregirla después: un alumno de
    // licenciatura sin carrera se queda sin materias. Se valida contra el
    // catálogo real, no contra texto libre.
    const carreraNormalizada =
      (nivelForzado ?? nivel) === 'licenciatura' ? String(carrera ?? '').trim() : ''
    if ((nivelForzado ?? nivel) === 'licenciatura') {
      const validas = getCarreras().map(c => c.slug)
      if (!carreraNormalizada || !validas.includes(carreraNormalizada)) {
        return NextResponse.json(
          { error: `carrera es requerida para licenciatura (${validas.join(', ')})` },
          { status: 400 },
        )
      }
    }

    // D9 (#199-admin): el plan tiene que ser uno que config.ts declara PARA ESE
    // nivel —la misma regla estructural del registro público—, y se comprueba
    // ANTES de crear la cuenta de Auth. Antes el alta guardaba cualquier id del
    // CHECK para cualquier nivel (Secundaria con el ritmo de licenciatura). El
    // modal ya solo ofrece los del nivel (planesPorNivel). Se guarda lo MISMO que
    // se validó (recortado): «3_meses » pasaba aquí y tronaba en el CHECK de la base.
    const modalidadLimpia = typeof modalidad === 'string' && modalidad.trim() ? modalidad.trim() : null
    if (!nivelForzado && nivelElegido !== 'diplomado') {
      const motivo = motivoPlanInvalido({
        nivel:     nivelElegido,
        modalidad: modalidadLimpia,
        carrera:   carreraNormalizada || null,
      }, catalogoDeRegistro())
      if (motivo) return NextResponse.json({ error: MENSAJES_PLAN_ADMIN[motivo] }, { status: 400 })
    }

    // Crear usuario en Supabase Auth: exactamente correo, contraseña y
    // confirmación, sin metadata (lib/alta-alumno).
    const { data: authData, error: authError } = await admin.auth.admin.createUser(opcionesAuthAlta(email, password))

    if (authError) {
      if (authError.message.includes('already')) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const newUserId = authData.user.id

    // La matrícula NO se arma aquí: la pone el trigger trg_asignar_matricula,
    // igual que en el alta por /register. Antes esta ruta la fabricaba con
    // `CONFIG.nombre` y un número al azar, así que en la misma plataforma
    // convivían 'ANGELOPOLIS-2026-0483' (alta por admin) e 'IVS-2026-0005'
    // (alta por registro), y el azar podía chocar con una existente.
    await sincronizarPrefijoMatricula(admin)

    // Upsert en usuarios — upsert porque un trigger de Auth puede haberla creado ya
    // sin nombre. El rol es ROL_ALTA y se RELEE: si la fila no quedó como alumno
    // (un trigger raro, una política cambiada), se deshace el alta completa.
    const { data: filaUsuario, error: usuarioError } = await admin
      .from('usuarios')
      .upsert(filaUsuarioAlta(newUserId, { ...datos, email }), { onConflict: 'id' })
      .select('rol')
      .single()

    if (usuarioError) {
      const deshecha = await deshacerAlta(admin, newUserId)
      return NextResponse.json({ error: deshecha ? usuarioError.message : mensajeAltaAMedias(newUserId) }, { status: 500 })
    }
    if ((filaUsuario as { rol?: string } | null)?.rol !== ROL_ALTA) {
      console.error('[POST /api/admin/alumnos] la fila de usuarios no quedó como alumno; se deshace el alta')
      const deshecha = await deshacerAlta(admin, newUserId)
      return NextResponse.json({
        error: deshecha ? 'No se pudo dar de alta: la cuenta no quedó como alumno. Avisa a soporte.' : mensajeAltaAMedias(newUserId),
      }, { status: 500 })
    }

    // Insertar en alumnos. En solo_cursos el nivel lo pone el servidor y la
    // modalidad va a NULL: es la duración del PROGRAMA (3 o 6 meses de
    // secundaria/prepa), no del diplomado, cuyo ritmo lo fija el curso con
    // `modulos_por_mes`. Dejarle `getDefaultModalidadId()` le fabricaría una
    // `duracion_meses` (columna GENERATED) de un programa que no cursa.
    const { data: alumnoData, error: alumnoError } = await admin
      .from('alumnos')
      .insert({
        id:                  newUserId,
        nivel:               nivelForzado ?? (nivel as 'secundaria' | 'preparatoria' | 'licenciatura' | 'diplomado'),
        // ⚠️ Sin la guarda por 'diplomado', un alumno de curso se llevaba
        // `getDefaultModalidadId()` y su ficha anunciaba «0 de 3 meses» de un
        // programa que no cursa: `duracion_meses` es GENERATED a partir de la
        // modalidad, y `getMesesByModalidad(null)` cae al fallback «primera
        // modalidad activa» en vez de devolver null.
        modalidad:           (nivelForzado || nivelElegido === 'diplomado')
                               ? null
                               : (modalidadLimpia ?? getDefaultModalidadId()),
        carrera:             carreraNormalizada || null,
        meses_desbloqueados: 0,
      })
      .select()
      .single()

    if (alumnoError) {
      const deshecha = await deshacerAlta(admin, newUserId)
      return NextResponse.json({ error: deshecha ? alumnoError.message : mensajeAltaAMedias(newUserId) }, { status: 500 })
    }

    // `alumnoData` ya trae la matrícula que puso el trigger — no hay que
    // pisarla con una calculada aquí, que era justo la que salía mal.
    //
    // Red de seguridad para el cliente que despliegue este código sin haber
    // corrido 20260811120000_prefijo_matricula_configurable.sql: sin trigger la
    // columna admite NULL y los alumnos entrarían sin matrícula, en silencio.
    let alumno = alumnoData as { matricula?: string | null } | null
    if (alumno && !alumno.matricula) {
      console.error('[POST /api/admin/alumnos] alumno sin matrícula: falta trg_asignar_matricula. Correr la migración del prefijo.')
      const anio = new Date().getFullYear()
      const { count } = await admin.from('alumnos').select('id', { count: 'exact', head: true })
      const respaldo = `${CONFIG.prefijoMatricula}-${anio}-${String((count ?? 0)).padStart(4, '0')}`
      const { data: reparado } = await admin
        .from('alumnos')
        .update({ matricula: respaldo })
        .eq('id', newUserId)
        .select()
        .single()
      if (reparado) alumno = reparado
    }

    // Calendario de cuotas semanales. Inerte en una escuela mensual.
    //
    // El admin puede además regenerarlo desde la ficha del alumno con otra
    // fecha de inicio, y dar de alta a un alumno con un plan a medida (fuera
    // del catálogo) desde /admin/cobranza.
    await generarCalendarioSemanal(admin, newUserId)

    // ── Inscripción a los cursos marcados ────────────────────────────────────
    // Va DESPUÉS del alta porque `curso_inscripciones` referencia `alumnos(id)`,
    // y en la MISMA llamada para que el alumno no quede a medias si el admin
    // cierra la pestaña.
    //
    // Con la MISMA regla que «Asignar» (C3b): curso_inscribir, con la SESIÓN de
    // quien da el alta (es_staff() usa auth.uid(); D7b), abre todo en un curso de
    // pago único y el mes 1 en uno mensual o sin precio, y deja el evento con
    // actor. Es el personal dando de alta a alguien que ya pagó; el registro
    // público, en cambio, sigue creando la inscripción con 0 meses (register-complete).
    //
    // La respuesta dice qué abrió cada curso y si su ficha está sin precio (0/0:
    // se abrió el mes 1 aunque la escuela haya cobrado un pago único), igual que
    // «Asignar». Y si alguno falló, el porqué (p. ej. la migración que falta).
    let cursosAsignados = 0
    let cursosError: string | null = null
    let cursosErrorStatus: number | null = null
    const cursosResultado: { curso_id: string; nombre: string; acceso_total: boolean; sin_precio: boolean }[] = []
    for (const curso of cursosValidados) {
      const { data: insData, error: insError } = await supabase.rpc('curso_inscribir', {
        p_curso_id: curso.id, p_alumno_id: newUserId,
      })
      if (insError && insError.code !== '23505') {
        // Para un alumno del programa no es fatal: su alta vale y se le inscribe
        // después desde la ficha. Un alumno DE CURSO sin ningún curso sí se
        // deshace abajo (revertirAltaSinCursos). Se registra para que quede rastro.
        console.error('[POST /api/admin/alumnos] curso_inscribir:', insError.message)
        cursosError ??= errorDeRpcCurso(insError).mensaje
        cursosErrorStatus ??= errorDeRpcCurso(insError).status
        continue
      }
      cursosAsignados++
      const fila = (Array.isArray(insData) ? insData[0] : insData) as { acceso_total?: boolean } | null
      cursosResultado.push({
        curso_id: curso.id,
        nombre: curso.nombre,
        acceso_total: fila?.acceso_total === true,
        sin_precio: precioCursoNumerico(curso).tipo === 'informes',
      })
    }

    // D21a: un alumno DE CURSO al que no se le pudo inscribir NINGÚN curso (p. ej.
    // una base sin la migración D7b, donde el secretario no puede inscribir) no se
    // queda «de curso sin curso» con `nivel` write-once: se deshace el alta
    // completa (la cuenta de Auth arrastra a usuarios y alumnos en cascada), para
    // los dos roles, y se dice por qué.
    if (revertirAltaSinCursos(nivelElegido, cursosAsignados)) {
      const deshecha = await deshacerAlta(admin, newUserId)
      if (!deshecha) return NextResponse.json({ error: mensajeAltaAMedias(newUserId) }, { status: 500 })
      return NextResponse.json({
        error: `No se dio de alta: no se pudo inscribir a ningún curso. ${cursosError ?? 'Intenta de nuevo.'}`,
      }, { status: cursosErrorStatus ?? 500 })
    }

    return NextResponse.json({
      ...(alumno ?? {}),
      cursos_asignados: cursosAsignados,
      cursos_resultado: cursosResultado,
      cursos_error: cursosError,
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/alumnos]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
