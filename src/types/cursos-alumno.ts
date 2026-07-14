/** Tipos del visor del alumno (respuestas de las API /api/alumno/cursos). */
import type { CursoTipo } from './cursos'

export interface CursoCatalogoItem {
  id: string
  nombre: string
  descripcion: string | null
  tipo: CursoTipo
  portadaUrl: string | null
  totalLecciones: number
  completadas: number
  porcentaje: number
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
}
