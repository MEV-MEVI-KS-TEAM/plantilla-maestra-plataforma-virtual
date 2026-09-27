/** Tipos del visor del alumno (respuestas de las API /api/alumno/cursos). */
import type { CursoTipo } from './cursos'
import type { MotivoBloqueo } from '@/lib/cursos/acceso'

export interface CursoCatalogoItem {
  id: string
  nombre: string
  descripcion: string | null
  tipo: CursoTipo
  portadaUrl: string | null
  totalLecciones: number
  completadas: number
  porcentaje: number
  /**
   * D19 (#207-8; decisión 8): lo que el alumno ha pagado a ESTE curso y su
   * último pago. null si no hay pagos legibles (sin B1, o sin pagos).
   */
  pagos?: { pagado: number; ultimo: { fecha: string; monto: number } | null } | null
}

/**
 * D20d (remate f): un curso cuya inscripción se canceló y al que el alumno SÍ
 * pagó, o (D20f) del que ya tiene su constancia emitida. Nombre, tipo, lo pagado
 * y si hay constancia: el curso no se abre (el visor solo diría «no está
 * activa»), así que no lleva progreso ni portada; la constancia sí se ve.
 */
export interface CursoCanceladoAlumno {
  id: string
  nombre: string
  tipo: CursoTipo
  pagos: CursoCatalogoItem['pagos']
  /** D20f: tiene constancia emitida → enlace a /cursos/[id]/constancia (solo verla; no se emite otra). */
  constancia: boolean
}

/** Respuesta de GET /api/alumno/cursos (desde D20d; antes era el arreglo solo). */
export interface CatalogoAlumno {
  cursos: CursoCatalogoItem[]
  cancelados: CursoCanceladoAlumno[]
}

export interface LeccionAlumno {
  id: string
  titulo: string
  video_url: string | null
  contenido_texto: string | null
  materialUrl: string | null
  tieneMaterial: boolean
  orden: number
  completada: boolean
}

export interface ModuloAlumno {
  id: string
  nombre: string
  orden: number
  lecciones: LeccionAlumno[]
}

/**
 * Resumen de la ventana de pago.
 *
 * ⚠️ SOLO NÚMEROS, a propósito. Sirve para que la UI diga "quedan 4 módulos,
 * disponibles al abrir el mes 2" sin filtrar NADA del contenido bloqueado: ni
 * nombres de módulo, ni títulos de lección, ni URLs. Una respuesta de "sin
 * acceso" que igual manda los títulos no es una respuesta de sin acceso.
 */
export interface VentanaCurso {
  meses_desbloqueados: number
  modulos_por_mes: number
  /** Techo: cuántos módulos, desde `orden` 0, están liberados. */
  limite: number
  modulos_totales: number
  modulos_bloqueados: number
  /**
   * Mes (1-based) que hay que abrir para liberar el siguiente. null si no queda
   * ninguno, o si ese mes no se puede abrir (inscripción no activa, o pasa del
   * tope del curso): entonces el visor no promete ningún pago.
   */
  proximo_mes: number | null
  estado_inscripcion: string | null
  /**
   * Por qué no ve (todo) el contenido; null si tiene acceso. Ver
   * `motivoBloqueo` en src/lib/cursos/acceso.ts. Sin esto el visor le decía
   * «no tiene lecciones» a quien esperaba su pago (#183).
   */
  motivo: MotivoBloqueo | null
}

export interface CursoDetalleAlumno {
  curso: {
    id: string
    nombre: string
    descripcion: string | null
    tipo: CursoTipo
    estado: string
    portadaUrl: string | null
  }
  modoPreview: boolean
  modulos: ModuloAlumno[]
  totalLecciones: number
  completadas: number
  porcentaje: number
  completado: boolean
  primeraLeccionPendienteId: string | null
  ventana: VentanaCurso | null
}
