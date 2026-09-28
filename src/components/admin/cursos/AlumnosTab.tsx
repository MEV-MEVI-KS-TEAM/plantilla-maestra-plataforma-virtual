'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, UserMinus, UserPlus, Users } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import type { AlumnoAdminRow, CursoInscrito } from '@/types/cursos'
import type { AperturaAlAsignar } from '@/lib/cursos/acceso'
import { AVISO_PAGO_UNICO } from '@/lib/cursos/precio-regla'
import {
  comoReabrir, cuandoSePublique, cuandoVeraTodo, finalFichaSinPrecio, llevaAvisoNoReembolsable, precioAntesDeAsignar, textoAbrirTodoSinPagoUnico, tituloCerrarMes, tituloNoActiva, tituloTopeAlcanzado, type TipoPrecioCurso,
} from '@/lib/cursos/textos-alumnos'
import { textoUltimoMovimiento } from '@/lib/cursos/bitacora'
import { CobrarCursoModal } from '@/components/admin/alumnos/CobrarCursoModal'
import type { FilaCursoAlumno } from '@/lib/cursos/cobro'
import { CONFIG } from '@/lib/config'
import { codigoMoneda, formatearMoneda } from '@/lib/moneda'

const fmtCobro = (n: number) => formatearMoneda(n, CONFIG, { decimales: 2, conCodigo: true })

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
  /**
   * D21b: cómo cobra la ficha HOY (precioCursoNumerico(curso).tipo). Separa lo
   * que `apertura` junta en 'mes1': mensual y sin precio. Decide el texto de la
   * 2ª confirmación de «Abrir todo» (OS1) y la ayuda bajo el buscador (OS7).
   */
  tipoPrecio: TipoPrecioCurso
  /**
   * D21b (OS9): meses que se le pueden abrir como máximo en este curso (espejo de
   * curso_tope_meses). null = no se pudo calcular: decide el servidor.
   */
  tope: number | null
  /** D21b (OS8): aviso neutro (azul), p. ej. «no se aplicó dos veces». */
  onAviso?: (mensaje: string) => void
  /** El candado exige curso publicado: en borrador nadie ve nada todavía. */
  publicado: boolean
  onChanged: (mensaje?: string) => void | Promise<void>
  onError: (mensaje: string, duracion?: number) => void
  /**
   * D7b (decisión 6): el secretario asigna, abre, cierra, abre todo y quita el
   * acceso total, igual que el admin; desde D20b también emite la constancia.
   * Lo que sigue siendo SOLO del admin se esconde: quitar a un alumno del curso
   * (borra la inscripción), cancelarla y reactivarla. Las funciones SQL y las
   * rutas lo vuelven a comprobar.
   */
  esAdmin: boolean
}

/**
 * D20b (remate a): en una inscripción CANCELADA solo queda «Reactivar» (admin);
 * lo demás de la fila se apaga con este motivo. El servidor también rechaza
 * abrir y emitir la constancia de una cancelada.
 */
const CANCELADA_TITULO = 'Inscripción cancelada: reactívala primero'

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

export function AlumnosTab({ cursoId, inscritos, apertura, tipoPrecio, tope, onAviso, publicado, onChanged, onError, esAdmin }: AlumnosTabProps) {
  const [alumnos, setAlumnos] = useState<AlumnoAdminRow[] | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)
  // D18 (#207-7): el atajo «Cobrar» abre el mismo modal que la ficha (D17).
  const [cobrando, setCobrando] = useState<{ fila: FilaCursoAlumno; nombre: string } | null>(null)
  // La última «Cobrar» pedida: una respuesta vieja (otra fila, más lenta) no abre el modal.
  const ultimoCobro = useRef(0)
  // D21b (OS8): guarda SÍNCRONA de «+ Abrir mes» / «−», POR FILA. `ocupadoId` es
  // estado de React y no alcanza a frenar el segundo clic de un doble clic; una
  // guarda única para toda la lista descartaría en silencio el clic en otra fila.
  const moviendoMes = useRef<Set<string>>(new Set())
  // Reactivar es del admin: al secretario no se le pide «reactívala».
  const canceladaTitulo = esAdmin ? CANCELADA_TITULO : tituloNoActiva('cancelada', false)
  const [confirmTodos, setConfirmTodos] = useState<0 | 1 | 2>(0) // doble confirmación
  // «Abrir todo» abre el curso completo: doble confirmación para admin y
  // secretario (D7b). Con ficha de pago único lleva el aviso «no reembolsable»
  // (#208); con otra ficha, el texto neutro (D21b · OS1).
  const [confirmAbrirTodo, setConfirmAbrirTodo] = useState<{ i: CursoInscrito; paso: 1 | 2 } | null>(null)
  // «Activar según la ficha» (D8) cuando la ficha es de pago único (abre TODO):
  // la misma doble confirmación con el aviso. Con mes 1 no se confirma (decisión 12).
  const [confirmActivar, setConfirmActivar] = useState<{ i: CursoInscrito; paso: 1 | 2 } | null>(null)
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
   * Abre o cierra un mes de la inscripción.
   *
   * `meses_esperados` viaja con el valor que esta pantalla tiene a la vista: es
   * el candado contra el doble clic. Si alguien más del personal (u otra pestaña)
   * ya lo movió, el servidor responde 409 y no se mueve dos veces.
   * D21b (OS8): el segundo clic de un doble clic ni pregunta ni envía (guarda
   * síncrona); si aun así llega un 409, se recarga la lista y se avisa en neutro:
   * lo más probable es que el cambio ya esté hecho.
   */
  const moverMes = async (
    inscripcionId: string,
    accion: 'abrir-mes' | 'cerrar-mes',
    mesesActuales: number,
    nombre: string
  ) => {
    if (moviendoMes.current.has(inscripcionId)) return
    if (accion === 'cerrar-mes') {
      const fila = inscritos.find(x => x.inscripcion_id === inscripcionId)
      const ok = window.confirm(
        `Cerrar el mes ${mesesActuales} de ${nombre}.

Esto le quita acceso que ya tenía: los módulos de ese mes dejarán de verse. ` +
        `${comoReabrir(fila?.estado ?? 'activa', mesesActuales - 1, tope)}

¿Continuar?`
      )
      if (!ok) return
    }
    // Sin await entre el confirm y aquí: el 2º clic de un doble clic ya encuentra la guarda.
    moviendoMes.current.add(inscripcionId)
    setOcupadoId(inscripcionId)
    try {
      const res = await fetch(`/api/admin/inscripciones/${inscripcionId}/${accion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meses_esperados: mesesActuales }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 409) {
        await onChanged()
        const aviso = `${nombre}: no se aplicó dos veces. Ya tenía ese cambio o alguien más lo movió; la lista ya muestra lo actual.`
        if (onAviso) onAviso(aviso)
        else onError(aviso)
        return
      }
      if (!res.ok) throw new Error(json.error ?? 'No se pudo actualizar')
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo actualizar')
    } finally {
      moviendoMes.current.delete(inscripcionId)
      setOcupadoId(prev => (prev === inscripcionId ? null : prev))
    }
  }

  /**
   * Abre el curso completo (pago único cobrado a quien entró por meses) o quita
   * el acceso total (corrección). Las dos dejan evento con actor en la
   * bitácora. Quitarlo REVOCA acceso: se confirma antes. Abrir todo llega aquí
   * DESPUÉS de su doble confirmación (ver `confirmAbrirTodo`).
   */
  const cambiarAccesoTotal = async (
    inscripcion: CursoInscrito,
    accion: 'abrir-todo' | 'quitar-acceso-total'
  ) => {
    const { inscripcion_id: inscripcionId, nombre } = inscripcion
    if (accion === 'quitar-acceso-total') {
      const ok = window.confirm(`Quitar el acceso total a ${nombre}.

Esto REVOCA acceso: vuelve a ver solo los meses que tenga abiertos (0 si entró por pago único).

¿Continuar?`)
      if (!ok) return
    }
    setConfirmAbrirTodo(null)
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

  /**
   * «Activar según la ficha» (D8): a quien está POR ACTIVAR (registro público, 0
   * meses, sin eventos) le abre lo que dice la ficha HOY, con la misma regla que
   * «Asignar»: pago único → todo; mensual o sin precio → mes 1. La pantalla manda
   * lo que le dijo al usuario (`regla_esperada`): si la ficha cambió, 409 y nada.
   */
  const pedirActivar = (i: CursoInscrito) => {
    if (apertura === 'total') setConfirmActivar({ i, paso: 1 })
    else void activar(i)
  }
  const activar = async (inscripcion: CursoInscrito) => {
    const { inscripcion_id: inscripcionId, nombre } = inscripcion
    setConfirmActivar(null)
    setOcupadoId(inscripcionId)
    try {
      const res = await fetch(`/api/admin/inscripciones/${inscripcionId}/activar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regla_esperada: apertura }),
      })
      const json = await res.json().catch(() => ({} as { error?: string; acceso_total?: boolean; sin_precio?: boolean }))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo activar')
      onChanged(json.acceso_total
        ? `${nombre}: acceso total al curso, según su ficha (pago único)${sinEfectoHoy(inscripcion)}`
        : `${nombre}: mes 1 abierto, según su ficha${sinEfectoHoy(inscripcion)}`)
      // El mismo aviso de «Asignar»: la ficha sin precio abre el mes 1, aunque el
      // registro le haya anunciado un pago único con el precio de config.ts.
      if (json.sin_precio && !json.acceso_total) {
        onError(`Ojo: este curso no tiene precio en su ficha y a ${nombre} se le abrió solo el mes 1. Si cobraste un pago único, usa «Abrir todo» en su fila ${finalFichaSinPrecio(esAdmin)}`, AVISO_MS)
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo activar')
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
   * Los guards viven en la función SQL: sin examen aprobado responde 422, una
   * inscripción cancelada también (D20b), y si la constancia ya existe devuelve
   * la existente sin quemar un folio nuevo. Por eso aquí no se comprueba nada:
   * preguntarle al cliente si el alumno aprobó sería confiar en el caller justo
   * en el dato que decide el folio. Desde D20b la emite también el secretario.
   */
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
      // D20b: el folio en el aviso (antes no se decía nada).
      onChanged(json.ya_existia
        ? (json.aviso ?? `${nombre} ya tenía constancia (folio ${json.folio}).`)
        : `${nombre}: constancia emitida, folio ${json.folio}`)
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
    if (!publicado) return ` (lo verá ${cuandoSePublique(esAdmin)})`
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
        // «Asignar» sobre una inscripción que ya existe NO activa nada (decisión 12):
        // si está por activar, su fila ofrece «Activar según la ficha».
        onError(`${json.error ?? 'Este alumno ya está asignado al curso'} Si está «por activar», usa «Activar según la ficha» en su fila.`)
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
      if (json.sin_precio && !json.acceso_total) {
        onError(`Ojo: este curso no tiene precio en su ficha y a ${nombre} se le abrió solo el mes 1. Si cobraste un pago único, usa «Abrir todo» en su fila ${finalFichaSinPrecio(esAdmin)}`, AVISO_MS)
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al asignar')
    } finally {
      setOcupadoId(null)
    }
  }

  /**
   * «Cancelar inscripción» (D11, solo admin): la baja que CONSERVA el historial
   * (pagos, bitácora, meses pagados). Pasa por curso_cambiar_estado, que deja el
   * evento con actor. Es lo que se usa cuando la inscripción tiene pagos o
   * diploma y «Quitar» la rechaza.
   */
  async function cancelar(i: CursoInscrito) {
    if (!window.confirm(`Cancelar la inscripción de ${i.nombre}.

Deja de ver el curso. Se conservan sus pagos, su bitácora y los meses que ya tenía («Reactivar» los recupera).

¿Continuar?`)) return
    setOcupadoId(i.inscripcion_id)
    try {
      const res = await fetch(`/api/admin/inscripciones/${i.inscripcion_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelada', motivo: 'Cancelada desde la pestaña Alumnos' }),
      })
      const json = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cancelar')
      onChanged(`${i.nombre}: inscripción cancelada (se conservan sus pagos y su historial)`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo cancelar')
    } finally {
      setOcupadoId(null)
    }
  }

  /**
   * «Reactivar» (D11, solo admin): deshace «Cancelar inscripción». Sin esto la
   * cancelación era un callejón: «Abrir mes» y «Abrir todo» se apagan en filas no
   * activas, «Asignar» no la ofrece (ya está inscrito) y «Quitar» la rechaza
   * por los pagos. También pasa por curso_cambiar_estado (evento con actor).
   */
  async function reactivar(i: CursoInscrito) {
    if (!window.confirm(`Reactivar la inscripción de ${i.nombre}.

Vuelve a ver el curso con los meses que ya tenía.

¿Continuar?`)) return
    setOcupadoId(i.inscripcion_id)
    try {
      const res = await fetch(`/api/admin/inscripciones/${i.inscripcion_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'activa', motivo: 'Reactivada desde la pestaña Alumnos' }),
      })
      const json = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo reactivar')
      onChanged(`${i.nombre}: inscripción reactivada`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo reactivar')
    } finally {
      setOcupadoId(null)
    }
  }

  /**
   * «Cobrar» (D18, admin y secretario): lee los cursos del alumno (el mismo GET
   * de la ficha, con la precarga de lib/cursos/cobro.ts) y abre el modal para
   * ESTA inscripción. Escribe por curso_cobrar (D16).
   */
  async function cobrarDe(i: CursoInscrito) {
    const peticion = ++ultimoCobro.current
    setOcupadoId(i.inscripcion_id)
    try {
      const res = await fetch(`/api/admin/alumnos/${i.alumno_id}/cursos`)
      const json = await res.json().catch(() => ({} as { cursos?: FilaCursoAlumno[]; error?: string }))
      if (peticion !== ultimoCobro.current) return
      const fila = (json.cursos ?? []).find((c: FilaCursoAlumno) => c.inscripcion_id === i.inscripcion_id)
      if (!res.ok || !fila) throw new Error(json.error ?? 'No se pudo preparar el cobro de este alumno')
      setCobrando({ fila, nombre: i.nombre })
    } catch (e) {
      if (peticion === ultimoCobro.current) onError(e instanceof Error ? e.message : 'No se pudo preparar el cobro de este alumno')
    } finally {
      if (peticion === ultimoCobro.current) setOcupadoId(null)
    }
  }

  async function quitar(i: CursoInscrito) {
    const { alumno_id: alumnoId, nombre } = i
    // Borra la inscripción (y con ella su acceso y su bitácora): se confirma,
    // sobre todo ahora que «Quitar acceso total» vive en la misma fila.
    if (!window.confirm(`Quitar a ${nombre} de este curso.

Se borra su inscripción y deja de ver el curso.

¿Continuar?`)) return
    // La misma llave que los demás botones de la fila: mientras corre uno, la
    // fila entera espera (no se cruzan «Cancelar» y «Quitar»).
    setOcupadoId(i.inscripcion_id)
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}/inscripciones/${alumnoId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        // Con pagos o diploma no se borra (409): el mensaje ya dice «Cancelar
        // inscripción», y se deja leer con calma.
        const duracion = res.status === 409 ? AVISO_MS : undefined
        onError((json as { error?: string }).error ?? 'Error al quitar', duracion)
        return
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
          json.regla === 'total' ? 'acceso total al curso' : 'mes 1 abierto'}${sinEfectoHoy()}`
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
            : tipoPrecio === 'mensual'
              ? <>«Asignar» le abre el <strong>mes 1</strong>. Los meses siguientes se abren con «+ Abrir mes» o al registrar su mensualidad con «Cobrar». Si te pagó el curso completo de una vez, usa «Abrir todo» en su fila.</>
              : <>Este curso no tiene precio en su ficha: «Asignar» le abre el <strong>mes 1</strong>. Si cobraste un pago único, usa «Abrir todo» en su fila {finalFichaSinPrecio(esAdmin)}</>}
          {!publicado && <> El curso está en <strong>borrador</strong>: nadie lo ve hasta {esAdmin ? 'que lo publiques' : 'que el administrador lo publique'}.</>}
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
                  {/* Bitácora (D7b): el último movimiento y QUIÉN lo hizo, con su rol. */}
                  {i.ultimo_movimiento && (
                    <p className="text-[11px] line-clamp-2 break-words" style={{ color: '#64748B' }}
                      title={textoUltimoMovimiento(i.ultimo_movimiento)}>
                      {textoUltimoMovimiento(i.ultimo_movimiento)}
                    </p>
                  )}
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
                      title="Acceso total: ve el curso completo, también los módulos que se agreguen">
                      Acceso total
                    </span>
                  ) : (
                    <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(148,163,184,0.15)', color: '#475569' }}
                      title={publicado
                        ? 'Tiene acceso total, pero su inscripción no está vigente: hoy no ve nada'
                        : `Tiene acceso total, pero el curso está en borrador: lo verá ${cuandoSePublique(esAdmin)}`}>
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

                {/* D18: pagó algo que abre y no se le ha abierto (la cola de «falta abrir»). */}
                {i.pagado_falta_abrir && (
                  <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#B45309' }}
                    title="Registró un pago que abre acceso y todavía no se le abre: ábrelo con «+ Abrir mes», «Abrir todo» o «Activar según la ficha»">
                    Pagado · falta abrir
                  </span>
                )}

                {/* flex-wrap también aquí: con «Abrir todo» son 4 botones y a
                    360 px no caben en una línea. */}
                <div className="flex flex-wrap items-center gap-1">
                  {/* D18: el atajo «Cobrar» (admin y secretario). */}
                  <button
                    onClick={() => cobrarDe(i)}
                    disabled={ocupadoId === i.inscripcion_id || i.estado === 'cancelada'}
                    title={i.estado === 'cancelada' ? canceladaTitulo : 'Registrar un cobro de este curso (y, si corresponde, abrir)'}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                    style={{ border: '1px solid rgba(16,185,129,0.35)', color: '#047857', background: 'var(--color-superficie)' }}
                  >
                    Cobrar
                  </button>
                  {i.acceso_total ? (
                    <button
                      onClick={() => cambiarAccesoTotal(i, 'quitar-acceso-total')}
                      disabled={ocupadoId === i.inscripcion_id || i.estado === 'cancelada'}
                      title={i.estado === 'cancelada' ? canceladaTitulo : 'Quitar el acceso total (revoca acceso)'}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                      style={{ border: '1px solid rgba(27,48,104,0.2)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                    >
                      Quitar acceso total
                    </button>
                  ) : (
                    <>
                      {/* D8: a quien está POR ACTIVAR, el botón principal abre lo que dice la
                          ficha; «+ Abrir mes» queda como opción secundaria. */}
                      {i.por_activar && (
                        <button
                          onClick={() => pedirActivar(i)}
                          disabled={ocupadoId === i.inscripcion_id || i.estado === 'cancelada'}
                          title={i.estado === 'cancelada' ? canceladaTitulo : apertura === 'total'
                            ? 'Según su ficha (pago único): abre TODO el curso'
                            : 'Según su ficha: abre el mes 1'}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                          style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
                        >
                          Activar según la ficha
                        </button>
                      )}
                      <button
                        onClick={() => moverMes(i.inscripcion_id, 'cerrar-mes', i.meses_desbloqueados, i.nombre)}
                        disabled={ocupadoId === i.inscripcion_id || i.meses_desbloqueados <= 0 || i.estado === 'cancelada'}
                        title={i.estado === 'cancelada' ? canceladaTitulo : tituloCerrarMes(i.meses_desbloqueados)}
                        aria-label="Cerrar mes"
                        className="px-2 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ border: '1px solid rgba(27,48,104,0.2)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => moverMes(i.inscripcion_id, 'abrir-mes', i.meses_desbloqueados, i.nombre)}
                        disabled={ocupadoId === i.inscripcion_id || i.estado !== 'activa' || (tope !== null && i.meses_desbloqueados >= tope)}
                        title={i.estado !== 'activa' ? tituloNoActiva(i.estado, esAdmin, true)
                          : tope !== null && tope <= 0 ? 'El curso todavía no tiene meses que abrir (sin módulos o sin ritmo en su ficha)'
                          : tope !== null && i.meses_desbloqueados >= tope ? tituloTopeAlcanzado(tope)
                          : 'Abrir el siguiente mes'}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={i.por_activar
                          ? { border: '1px solid rgba(27,48,104,0.3)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }
                          : { background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
                      >
                        + Abrir mes
                      </button>
                      <button
                        onClick={() => setConfirmAbrirTodo({ i, paso: 1 })}
                        disabled={ocupadoId === i.inscripcion_id || i.estado !== 'activa'}
                        title={i.estado !== 'activa' ? tituloNoActiva(i.estado, esAdmin)
                          : tipoPrecio === 'unico' ? 'Acceso total: todo el curso (pago único)' : 'Acceso total: todo el curso, sin depender de los meses'}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ border: '1px solid rgba(27,48,104,0.3)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                      >
                        Abrir todo
                      </button>
                    </>
                  )}
                  {/* D20b: admin y secretario. El folio es permanente; una cancelada no recibe folio. */}
                  <button
                      onClick={() => emitirConstancia(i.inscripcion_id, i.nombre)}
                      disabled={ocupadoId === i.inscripcion_id || i.estado === 'cancelada'}
                      title={i.estado === 'cancelada' ? canceladaTitulo : 'Emitir la constancia (requiere examen aprobado; el folio es permanente)'}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                      style={{ border: '1px solid rgba(27,48,104,0.2)', color: 'var(--color-primario)', background: 'var(--color-superficie)' }}
                    >
                      Constancia
                    </button>
                </div>

                {/* Solo admin (D11): reactivar deshace la cancelación. */}
                {esAdmin && i.estado === 'cancelada' && (
                  <button
                    onClick={() => reactivar(i)}
                    disabled={ocupadoId === i.inscripcion_id}
                    title="Deshacer la cancelación: vuelve a ver el curso con los meses que ya tenía"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                    style={{ border: '1px solid rgba(16,185,129,0.35)', color: '#047857', background: 'var(--color-superficie)' }}
                  >
                    Reactivar
                  </button>
                )}

                {/* Solo admin (D11): cancelar conserva pagos e historial. */}
                {esAdmin && i.estado !== 'cancelada' && (
                  <button
                    onClick={() => cancelar(i)}
                    disabled={ocupadoId === i.inscripcion_id}
                    title="Dar de baja conservando pagos, bitácora y meses pagados"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                    style={{ border: '1px solid rgba(245,158,11,0.35)', color: '#B45309', background: 'var(--color-superficie)' }}
                  >
                    Cancelar inscripción
                  </button>
                )}

                {/* Solo admin (D7b): quitar borra la inscripción. */}
                {esAdmin && (
                  <button
                    onClick={() => quitar(i)}
                    disabled={ocupadoId === i.inscripcion_id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                    style={{ border: '1px solid rgba(220,38,38,0.3)', color: '#EF4444', background: 'var(--color-superficie)' }}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    Quitar
                  </button>
                )}
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
            {simulacion?.sinPrecio && !esPagoUnico && <> El curso <strong>no tiene precio</strong> en su ficha: si cobraste un pago único, {precioAntesDeAsignar(esAdmin)}</>}
            {!publicado && <> El curso está en <strong>borrador</strong>: lo verán {cuandoSePublique(esAdmin)}.</>}
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
              ? <><strong>Los {nuevosActivos} verán TODO el curso (acceso total){publicado ? '' : ` ${cuandoSePublique(esAdmin)}`}.</strong> </>
              : <>Los {nuevosActivos} verán el mes 1{publicado ? '' : ` ${cuandoSePublique(esAdmin)}`}. </>}
            Confirma una vez más para ejecutarla.
          </>
        }
        confirmLabel="Asignar a todos"
        busy={asignandoTodos}
        onConfirm={asignarTodosActivos}
        onCancel={() => setConfirmTodos(0)}
      />

      {cobrando && (
        <CobrarCursoModal
          key={cobrando.fila.inscripcion_id}
          fila={cobrando.fila}
          alumnoNombre={cobrando.nombre}
          moneda={codigoMoneda(CONFIG.moneda)}
          fmt={fmtCobro}
          onClose={() => setCobrando(null)}
          onCobrado={(mensaje) => { setCobrando(null); onChanged(mensaje) }}
        />
      )}

      {/* «Activar según la ficha» de un pago único (D8): abre TODO, doble confirmación. */}
      <ConfirmDialog
        open={confirmActivar?.paso === 1}
        title="Activar según la ficha"
        message={
          <>
            La ficha de este curso es de <strong>pago único</strong>: a{' '}
            <strong>{confirmActivar?.i.nombre}</strong> se le abrirá <strong>TODO el curso</strong> (acceso
            total).{' '}
            {!publicado && <>El curso está en <strong>borrador</strong>: lo verá {cuandoSePublique(esAdmin)}. </>}
            ¿Continuar?
          </>
        }
        confirmLabel="Sí, continuar"
        onConfirm={() => setConfirmActivar(c => (c ? { ...c, paso: 2 } : null))}
        onCancel={() => setConfirmActivar(null)}
      />
      <ConfirmDialog
        open={confirmActivar?.paso === 2}
        danger
        title="¿Seguro? Segunda confirmación"
        message={
          <>
            <strong>{AVISO_PAGO_UNICO}.</strong> <strong>{confirmActivar?.i.nombre}</strong> verá todo el curso{' '}
            {confirmActivar ? cuandoVeraTodo(publicado, accesoVigente(confirmActivar.i, publicado), esAdmin) : 'desde ya'}.
            Confirma una vez más para activarlo.
          </>
        }
        confirmLabel="Activar todo el curso"
        busy={confirmActivar ? ocupadoId === confirmActivar.i.inscripcion_id : false}
        onConfirm={() => { if (confirmActivar) void activar(confirmActivar.i) }}
        onCancel={() => setConfirmActivar(null)}
      />

      {/* «Abrir todo»: doble confirmación (D7b). El aviso «no reembolsable» solo con
          ficha de pago único con precio (D21b · OS1); si no, el texto neutro. */}
      <ConfirmDialog
        open={confirmAbrirTodo?.paso === 1}
        title="Abrir todo el curso"
        message={
          <>
            Se le abrirá <strong>TODO el curso</strong> a <strong>{confirmAbrirTodo?.i.nombre}</strong> (acceso
            total): todos los módulos, también los que se agreguen después.{' '}
            {!publicado && <>El curso está en <strong>borrador</strong>: lo verá {cuandoSePublique(esAdmin)}. </>}
            ¿Continuar?
          </>
        }
        confirmLabel="Sí, continuar"
        onConfirm={() => setConfirmAbrirTodo(c => (c ? { ...c, paso: 2 } : null))}
        onCancel={() => setConfirmAbrirTodo(null)}
      />
      <ConfirmDialog
        open={confirmAbrirTodo?.paso === 2}
        danger
        title="¿Seguro? Segunda confirmación"
        message={
          <>
            {llevaAvisoNoReembolsable(tipoPrecio)
              ? <><strong>{AVISO_PAGO_UNICO}.</strong> <strong>{confirmAbrirTodo?.i.nombre}</strong> verá todo el curso{' '}
                {confirmAbrirTodo ? cuandoVeraTodo(publicado, accesoVigente(confirmAbrirTodo.i, publicado), esAdmin) : 'desde ya'}.</>
              : <><strong>{confirmAbrirTodo?.i.nombre}</strong>: {textoAbrirTodoSinPagoUnico(tipoPrecio === 'mensual' ? 'mensual' : 'informes')}</>}
            {' '}Confirma una vez más para abrirlo.
          </>
        }
        confirmLabel="Abrir todo"
        busy={confirmAbrirTodo ? ocupadoId === confirmAbrirTodo.i.inscripcion_id : false}
        onConfirm={() => { if (confirmAbrirTodo) void cambiarAccesoTotal(confirmAbrirTodo.i, 'abrir-todo') }}
        onCancel={() => setConfirmAbrirTodo(null)}
      />
    </div>
  )
}
