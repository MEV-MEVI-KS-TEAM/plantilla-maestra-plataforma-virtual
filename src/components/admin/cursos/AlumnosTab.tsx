'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, UserMinus, UserPlus, Users } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import type { AlumnoAdminRow, CursoInscrito } from '@/types/cursos'
import type { AperturaAlAsignar } from '@/lib/cursos/acceso'

interface AlumnosTabProps {
  cursoId: string
  inscritos: CursoInscrito[]
  /**
   * Qué abre «Asignar» en ESTE curso, con su precio de hoy (aperturaAlAsignar):
   * 'total' si es de pago único, 'mes1' si es mensual o no tiene precio. Es el
   * aviso bajo el buscador ANTES del clic; la decisión la toma curso_inscribir
   * en SQL y el toast dice lo que de verdad abrió.
   */
  apertura: AperturaAlAsignar
  /** El candado exige curso publicado: en borrador nadie ve nada todavía. */
  publicado: boolean
  onChanged: (mensaje?: string) => void | Promise<void>
  onError: (mensaje: string, duracion?: number) => void
}

/** Un aviso que hay que leer (se abrió menos de lo cobrado) no se va en 4 s. */
const AVISO_MS = 10000

/**
 * ¿La inscripción concede hoy lo que tiene abierto? Los mismos filtros del
 * candado (curso_ventana_limite): inscripción activa o completada, vigente, y
 * curso publicado.
 */
function accesoVigente(i: CursoInscrito, publicado: boolean): boolean {
  if (!publicado) return false
  if (i.estado !== 'activa' && i.estado !== 'completada') return false
  if (i.fecha_vencimiento && i.fecha_vencimiento < new Date().toISOString().slice(0, 10)) return false
  return true
}

export function AlumnosTab({ cursoId, inscritos, apertura, publicado, onChanged, onError }: AlumnosTabProps) {
  const [alumnos, setAlumnos] = useState<AlumnoAdminRow[] | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)
  const [confirmTodos, setConfirmTodos] = useState<0 | 1 | 2>(0) // doble confirmación
  const [asignandoTodos, setAsignandoTodos] = useState(false)
  // Lo que la masiva haría, contado por el SERVIDOR (D3): cuántos nuevos y con
  // qué regla. La confirmación muestra esto, y la ejecución lo manda de vuelta.
  const [simulacion, setSimulacion] = useState<{ nuevos: number; totalActivos: number; regla: string | null; sinPrecio?: boolean } | null>(null)

  // El buscador usa el endpoint admin existente (usuarios con rol alumno)
  useEffect(() => {
    let cancelled = false
    async function cargar() {
      try {
        const res = await fetch('/api/admin/alumnos')
        if (!res.ok) throw new Error()
        const json = await res.json()
        if (!cancelled) setAlumnos(Array.isArray(json) ? json : [])
      } catch {
        if (!cancelled) {
          setAlumnos([])
          onError('No se pudo cargar la lista de alumnos')
        }
      }
    }
    cargar()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inscritosIds = useMemo(() => new Set(inscritos.map(i => i.alumno_id)), [inscritos])

  /**
   * Abre o cierra un mes de la inscripcion.
   *
   * `meses_esperados` viaja con el valor que esta pantalla tiene a la vista: es
   * el candado contra el doble clic. Si otro admin (u otra pestaña) ya lo movio,
   * el servidor responde 409 y se pide recargar, en vez de incrementar dos veces.
   * El boton tambien se deshabilita, pero eso es cortesia: el candado esta en el
   * servidor.
   */
  const moverMes = async (
    inscripcionId: string,
    accion: 'abrir-mes' | 'cerrar-mes',
    mesesActuales: number,
    nombre: string
  ) => {
    if (accion === 'cerrar-mes') {
      const ok = window.confirm(
        `Cerrar un mes de ${nombre}.

Esto REVOCA acceso que el alumno ya tenia: ` +
        `los modulos de ese mes dejaran de verse.

¿Continuar?`
      )
      if (!ok) return
    }
    setOcupadoId(inscripcionId)
    try {
      const res = await fetch(`/api/admin/inscripciones/${inscripcionId}/${accion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meses_esperados: mesesActuales }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo actualizar')
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo actualizar')
    } finally {
      setOcupadoId(null)
    }
  }

  /**
   * Emite la constancia de una inscripción.
   *
   * ⚠️ Este botón faltaba. El endpoint, la función SQL con sus guards, el folio
   * permanente, la bitácora con actor y la vista del alumno YA existían — pero
   * nada en la UI llamaba a POST /api/admin/inscripciones/[id]/constancia, así
   * que la emisión era imposible y el alumno que aprobaba se quedaba para
   * siempre en "Tu constancia está en emisión" (TICKET-2026-09-07-51).
   *
   * Los guards viven en la función SQL: sin examen aprobado responde 422, y si
   * la constancia ya existe devuelve la existente sin quemar un folio nuevo.
   * Por eso aquí no se comprueba nada: preguntarle al cliente si el alumno
   * aprobó sería confiar en el caller justo en el dato que decide el folio.
   */
  /**
   * Abre el curso completo (pago único cobrado a quien entró por meses) o quita
   * el acceso total (corrección). Las dos dejan evento con actor en la
   * bitácora. Quitarlo REVOCA acceso: se confirma antes.
   */
  const cambiarAccesoTotal = async (
    inscripcion: CursoInscrito,
    accion: 'abrir-todo' | 'quitar-acceso-total'
  ) => {
    const { inscripcion_id: inscripcionId, nombre } = inscripcion
    const ok = window.confirm(accion === 'abrir-todo'
      ? `Abrir TODO el curso a ${nombre}.

Tendrá acceso total (pago único): todos los módulos, también los que se agreguen después.

¿Continuar?`
      : `Quitar el acceso total a ${nombre}.

Esto REVOCA acceso: vuelve a ver solo los meses que tenga abiertos (0 si entró por pago único).

¿Continuar?`)
    if (!ok) return
    setOcupadoId(inscripcionId)
    try {
      const res = await fetch(`/api/admin/inscripciones/${inscripcionId}/${accion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo actualizar')
      onChanged(accion === 'abrir-todo'
        ? `${nombre}: acceso total al curso${sinEfectoHoy(inscripcion)}`
        : `${nombre}: se quitó el acceso total`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo actualizar')
    } finally {
      setOcupadoId(null)
    }
  }

  const emitirConstancia = async (inscripcionId: string, nombre: string) => {
    const ok = window.confirm(
      `Emitir la constancia de ${nombre}.

El folio es PERMANENTE e irrepetible, y congela nombre, curso, horas y ` +
      `calificación tal como están hoy.

¿Continuar?`
    )
    if (!ok) return
    setOcupadoId(inscripcionId)
    try {
      const res = await fetch(`/api/admin/inscripciones/${inscripcionId}/constancia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo emitir la constancia')
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo emitir la constancia')
    } finally {
      setOcupadoId(null)
    }
  }

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return []
    return (alumnos ?? [])
      .filter(a =>
        !inscritosIds.has(a.id) &&
        (a.nombre_completo.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [busqueda, alumnos, inscritosIds])

  // El número de la confirmación masiva lo da el servidor (simulación): la
  // lista de /api/admin/alumnos no sirve para contar (tope de 1000 filas, omite
  // a quien no tiene usuario, y sale en 0 si falla la carga). Por eso el botón
  // ya no muestra un conteo propio.
  const nuevosActivos = simulacion?.nuevos ?? 0
  const esPagoUnico = simulacion?.regla === 'total'

  /** Lo que se abrió no se ve hoy si el curso está en borrador o la inscripción no está vigente. */
  function sinEfectoHoy(i?: CursoInscrito): string {
    if (!publicado) return ' (lo verá cuando publiques el curso)'
    if (i && !accesoVigente(i, publicado)) return ' (sin efecto hasta que su inscripción esté activa y vigente)'
    return ''
  }

  async function abrirMasiva() {
    setAsignandoTodos(true)
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}/inscripciones?simular=todos`)
      const json = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo contar a los alumnos activos')
      if (!json.totalActivos) {
        onError('No hay alumnos activos que asignar')
        return
      }
      if (!json.nuevos) {
        onError(`Nadie nuevo que asignar: los ${json.totalActivos} alumnos activos ya están en el curso`)
        return
      }
      setSimulacion(json)
      setConfirmTodos(1)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo contar a los alumnos activos')
    } finally {
      setAsignandoTodos(false)
    }
  }

  async function asignar(alumnoId: string, nombre: string) {
    setOcupadoId(alumnoId)
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}/inscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: alumnoId }),
      })
      const json = await res.json().catch(() => ({} as { error?: string; acceso_total?: boolean; sin_precio?: boolean }))
      if (res.status === 409) {
        onError(json.error ?? 'Este alumno ya está asignado al curso')
        return
      }
      if (!res.ok) throw new Error(json.error ?? 'Error al asignar')
      // Lo que se abrió lo decide el servidor con el precio del curso: se dice tal cual.
      onChanged(json.acceso_total
        ? `${nombre} asignado: acceso total al curso (pago único)${sinEfectoHoy()}`
        : `${nombre} asignado: mes 1 abierto${sinEfectoHoy()}`)
      // Ficha sin precio: se abrió el mes 1 aunque el registro anuncie un pago
      // único con el precio de config.ts. Es un aviso, no un éxito: en rojo y
      // con tiempo para leerlo.
      if (json.sin_precio) {
        onError(`Ojo: este curso no tiene precio en su ficha y a ${nombre} se le abrió solo el mes 1. Si cobraste un pago único, usa «Abrir todo» en su fila y ponle precio al curso.`, AVISO_MS)
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al asignar')
    } finally {
      setOcupadoId(null)
    }
  }

  async function quitar(alumnoId: string, nombre: string) {
    // Borra la inscripción (y con ella su acceso y su bitácora): se confirma,
    // sobre todo ahora que «Quitar acceso total» vive en la misma fila.
    if (!window.confirm(`Quitar a ${nombre} de este curso.

Se borra su inscripción y deja de ver el curso.

¿Continuar?`)) return
    setOcupadoId(alumnoId)
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}/inscripciones/${alumnoId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Error al quitar')
      }
      onChanged(`${nombre} quitado del curso`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al quitar')
    } finally {
      setOcupadoId(null)
    }
  }

  async function asignarTodosActivos() {
    setAsignandoTodos(true)
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}/inscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos_activos: true, esperados: simulacion?.nuevos, regla_esperada: simulacion?.regla }),
      })
      const json = await res.json().catch(() => ({} as { agregados?: number; totalActivos?: number; regla?: string; error?: string }))
      if (!res.ok) throw new Error(json.error ?? 'Error en la asignación masiva')
      onChanged(json.agregados
        ? `${json.agregados} alumno(s) nuevos asignados (de ${json.totalActivos} activos): ${
          json.regla === 'total' ? 'acceso total al curso' : 'mes 1 abierto'}`
        : `Nadie nuevo que asignar: los ${json.totalActivos} alumnos activos ya estaban en el curso`)
      setConfirmTodos(0)
      setSimulacion(null)
    } catch (e) {
      setConfirmTodos(0)
      setSimulacion(null)
      onError(e instanceof Error ? e.message : 'Error en la asignación masiva')
    } finally {
      setAsignandoTodos(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Buscador + asignación masiva */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: 'var(--color-superficie)', border: '1px solid #E8F0F7', boxShadow: '0 2px 8px rgba(27,58,87,0.06)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-primario)' }}>Asignar alumnos</h2>
          <button
            onClick={abrirMasiva}
            disabled={asignandoTodos}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
            style={{ border: '1px solid rgba(27,48,104,0.3)', color: 'var(--color-primario)', background: '#fff' }}
          >
            <Users className="w-3.5 h-3.5" />
            Asignar a todos los alumnos activos
          </button>
        </div>

        {/* Qué abre «Asignar» ANTES del clic (C3b): en pago único, todo el curso. */}
        <p className="text-xs px-1" style={{ color: 'var(--color-texto-secundario)' }}>
          {apertura === 'total'
            ? <>Este curso es de <strong>pago único</strong>: «Asignar» le abre <strong>todo el curso</strong> (acceso total).</>
            : <>«Asignar» le abre el <strong>mes 1</strong>. Si cobraste un pago único, usa «Abrir todo» en su fila.</>}
          {!publicado && <> El curso está en <strong>borrador</strong>: nadie lo ve hasta que lo publiques.</>}
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={alumnos === null ? 'Cargando alumnos…' : 'Buscar por nombre o email…'}
            disabled={alumnos === null}
            className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none"
            style={{ border: '1px solid var(--color-borde)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
            aria-label="Buscar alumnos por nombre o email"
          />
        </div>

        {busqueda.trim() && (
          <div className="space-y-1.5">
            {resultados.length === 0 && (
              <p className="text-xs px-1" style={{ color: '#9CA3AF' }}>
                Sin resultados (los ya asignados no aparecen aquí).
              </p>
            )}
            {resultados.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: 'var(--color-fondo)', border: '1px solid #EEF2F6' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-primario)' }}>{a.nombre_completo}</p>
                  <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{a.email}</p>
                </div>
                {!a.activo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: 'rgba(156,163,175,0.15)', color: '#6B7280' }}>
                    Inactivo
                  </span>
                )}
                <button
                  onClick={() => asignar(a.id, a.nombre_completo)}
                  disabled={ocupadoId === a.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                  style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Asignar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de asignados */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--color-superficie)', border: '1px solid #E8F0F7', boxShadow: '0 2px 8px rgba(27,58,87,0.06)' }}
      >
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--color-primario)' }}>
          Alumnos asignados ({inscritos.length})
        </h2>
        {inscritos.length === 0 ? (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Nadie asignado todavía. Usa el buscador de arriba. ☝️
          </p>
        ) : (
          <div className="space-y-1.5">
            {inscritos.map(i => (
              <div
                key={i.alumno_id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2"
                style={{ background: 'var(--color-fondo)', border: '1px solid #EEF2F6' }}
              >
                {/* flex-wrap: a 360 px las acciones bajan a otra línea en vez de
                    aplastar el nombre. */}
                <div className="flex-1 min-w-[10rem]">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-primario)' }}>{i.nombre}</p>
                  <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                    {i.email}{i.matricula ? ` · ${i.matricula}` : ''}
                  </p>
                </div>
                {!i.activo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: 'rgba(156,163,175,0.15)', color: '#6B7280' }}>
                    Inactivo
                  </span>
                )}

                {i.estado !== 'activa' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#B45309' }}>
                    {i.estado}
                  </span>
                )}

                {/* Ventana de pago: lo que el alumno ve hoy */}
                {i.acceso_total ? (
                  // Solo cuenta con la inscripción activa o completada y vigente,
                  // y el curso publicado, como el candado (curso_ventana_limite):
                  // si no, se dice.
                  accesoVigente(i, publicado) ? (
                    <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}
                      title="Pago único: ve el curso completo, también los módulos que se agreguen">
                      Acceso total
                    </span>
                  ) : (
                    <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(148,163,184,0.15)', color: '#475569' }}
                      title={publicado
                        ? 'Tiene acceso total, pero su inscripción no está vigente: hoy no ve nada'
                        : 'Tiene acceso total, pero el curso está en borrador: lo verá cuando lo publiques'}>
                      Acceso total (sin efecto)
                    </span>
                  )
                ) : (
                  <span className="text-xs font-semibold flex-shrink-0 tabular-nums"
                    style={{ color: 'var(--color-primario)' }}
                    title="Meses abiertos de esta inscripción">
                    {i.meses_desbloqueados} {i.meses_desbloqueados === 1 ? 'mes' : 'meses'}
                  </span>
                )}

                {/* flex-wrap también aquí: con «Abrir todo» son 4 botones y a
                    360 px no caben en una línea. */}
                <div className="flex flex-wrap items-center gap-1">
                  {i.acceso_total ? (
                    <button
                      onClick={() => cambiarAccesoTotal(i, 'quitar-acceso-total')}
                      disabled={ocupadoId === i.inscripcion_id}
                      title="Quitar el acceso total (revoca acceso)"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                      style={{ border: '1px solid rgba(27,48,104,0.2)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                    >
                      Quitar acceso total
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => moverMes(i.inscripcion_id, 'cerrar-mes', i.meses_desbloqueados, i.nombre)}
                        disabled={ocupadoId === i.inscripcion_id || i.meses_desbloqueados <= 0}
                        title="Cerrar un mes (revoca acceso)"
                        className="px-2 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ border: '1px solid rgba(27,48,104,0.2)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => moverMes(i.inscripcion_id, 'abrir-mes', i.meses_desbloqueados, i.nombre)}
                        disabled={ocupadoId === i.inscripcion_id || i.estado !== 'activa'}
                        title={i.estado !== 'activa' ? `Inscripción ${i.estado}: reactívala para abrir meses` : 'Abrir el siguiente mes'}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
                      >
                        + Abrir mes
                      </button>
                      <button
                        onClick={() => cambiarAccesoTotal(i, 'abrir-todo')}
                        disabled={ocupadoId === i.inscripcion_id || i.estado !== 'activa'}
                        title={i.estado !== 'activa' ? `Inscripción ${i.estado}: reactívala primero` : 'Acceso total: todo el curso (pago único)'}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ border: '1px solid rgba(27,48,104,0.3)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                      >
                        Abrir todo
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => emitirConstancia(i.inscripcion_id, i.nombre)}
                    disabled={ocupadoId === i.inscripcion_id}
                    title="Emitir la constancia (requiere examen aprobado; el folio es permanente)"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{ border: '1px solid rgba(27,48,104,0.2)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                  >
                    Constancia
                  </button>
                </div>

                <button
                  onClick={() => quitar(i.alumno_id, i.nombre)}
                  disabled={ocupadoId === i.alumno_id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                  style={{ border: '1px solid rgba(220,38,38,0.3)', color: '#EF4444', background: 'var(--color-superficie)' }}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doble confirmación para asignación masiva. Dice CUÁNTOS y QUÉ se abre
          (D3): en un curso de pago único, es acceso total para todos ellos. */}
      <ConfirmDialog
        open={confirmTodos === 1}
        title="Asignar a todos los alumnos activos"
        message={
          <>
            Se asignará este curso a <strong>{nuevosActivos}</strong> alumno(s) activo(s) nuevo(s)
            ({(simulacion?.totalActivos ?? 0) - nuevosActivos} ya estaban asignados y no se tocan).{' '}
            {esPagoUnico
              ? <>Como el curso es de <strong>pago único</strong>, cada uno tendrá <strong>ACCESO TOTAL</strong> al curso completo.</>
              : <>A cada uno se le abre el <strong>mes 1</strong>.</>}
            {simulacion?.sinPrecio && <> El curso <strong>no tiene precio</strong> en su ficha: si cobraste un pago único, ponle precio antes de asignar.</>}
            {!publicado && <> El curso está en <strong>borrador</strong>: lo verán cuando lo publiques.</>}
            {' '}¿Continuar?
          </>
        }
        confirmLabel="Sí, continuar"
        onConfirm={() => setConfirmTodos(2)}
        onCancel={() => { setConfirmTodos(0); setSimulacion(null) }}
      />
      <ConfirmDialog
        open={confirmTodos === 2}
        danger
        title="¿Seguro? Segunda confirmación"
        message={
          <>
            Esta es una asignación masiva a <strong>{nuevosActivos}</strong> alumno(s) activo(s).{' '}
            {esPagoUnico
              ? <><strong>Los {nuevosActivos} verán TODO el curso (acceso total).</strong> </>
              : <>Los {nuevosActivos} verán el mes 1. </>}
            Confirma una vez más para ejecutarla.
          </>
        }
        confirmLabel="Asignar a todos"
        busy={asignandoTodos}
        onConfirm={asignarTodosActivos}
        onCancel={() => setConfirmTodos(0)}
      />
    </div>
  )
}
