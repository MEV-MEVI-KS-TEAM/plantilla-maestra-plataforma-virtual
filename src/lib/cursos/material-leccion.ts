/**
 * Formatos del MATERIAL DE LECCIÓN del módulo Cursos.
 *
 * Antes solo se aceptaba PDF. Los diplomados técnicos (gestión de proyectos,
 * diseño, análisis de datos) entregan plantillas de Word/Excel, planos de
 * AutoCAD y tableros de Power BI que no tienen sentido convertidos a PDF
 * (TICKET-2026-10-12-06, SIE México).
 *
 * Los materiales de SEMANA de Contenido siguen solo en PDF: allá se leen
 * incrustados, aquí el alumno los descarga.
 *
 * Doble candado, igual que el resto de subidas:
 *  1. `validarMaterialLeccion` (cliente y servidor, antes de emitir la URL):
 *     extensión permitida + MIME del navegador coherente + tamaño.
 *  2. `firmaMaterialValida` (servidor, al confirmar): los primeros bytes del
 *     objeto ya subido. El MIME lo declara el navegador y la extensión la
 *     escribe el usuario; la firma es lo único que no se puede maquillar
 *     renombrando el archivo.
 */
import { extensionDe, MATERIAL_MAX_BYTES, type ValidacionArchivo } from '@/lib/archivos-comunes'

type Familia = 'pdf' | 'ooxml' | 'ole' | 'dwg' | 'dxf'

interface Formato {
  etiqueta: string
  familia: Familia
  /** Content-Type con el que se guarda en Storage (el navegador a veces no manda ninguno). */
  contentType: string
  /** MIME que los navegadores reportan para la extensión, además de los genéricos. */
  mimes: readonly string[]
}

const FORMATOS: Record<string, Formato> = {
  pdf:  { etiqueta: 'PDF',        familia: 'pdf',   contentType: 'application/pdf', mimes: ['application/pdf'] },
  docx: { etiqueta: 'Word',       familia: 'ooxml', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  doc:  { etiqueta: 'Word',       familia: 'ole',   contentType: 'application/msword', mimes: ['application/msword'] },
  xlsx: { etiqueta: 'Excel',      familia: 'ooxml', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
  xls:  { etiqueta: 'Excel',      familia: 'ole',   contentType: 'application/vnd.ms-excel', mimes: ['application/vnd.ms-excel'] },
  pptx: { etiqueta: 'PowerPoint', familia: 'ooxml', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
  ppt:  { etiqueta: 'PowerPoint', familia: 'ole',   contentType: 'application/vnd.ms-powerpoint', mimes: ['application/vnd.ms-powerpoint'] },
  dwg:  { etiqueta: 'AutoCAD',    familia: 'dwg',   contentType: 'application/acad', mimes: ['application/acad', 'application/x-acad', 'application/autocad_dwg', 'image/vnd.dwg', 'image/x-dwg', 'application/dwg', 'application/x-dwg'] },
  dxf:  { etiqueta: 'AutoCAD',    familia: 'dxf',   contentType: 'application/dxf', mimes: ['application/dxf', 'image/vnd.dxf', 'image/x-dxf', 'application/x-dxf', 'text/plain'] },
  // .pbix es un ZIP (OPC) como los de Office.
  pbix: { etiqueta: 'Power BI',   familia: 'ooxml', contentType: 'application/vnd.ms-powerbi', mimes: ['application/vnd.ms-powerbi'] },
}

/**
 * MIME que el navegador manda cuando no conoce la extensión (dwg/pbix casi
 * siempre, a veces los de Office en Windows sin Office instalado).
 */
const MIMES_GENERICOS = ['', 'application/octet-stream', 'application/zip', 'application/x-zip-compressed', 'application/x-zip'] as const

export const MATERIAL_LECCION_EXTS = Object.keys(FORMATOS)

/** Para el `accept` del <input type="file">: extensiones, porque los MIME de dwg/pbix no son estándar. */
export const MATERIAL_LECCION_ACCEPT = MATERIAL_LECCION_EXTS.map(e => `.${e}`).join(',')

export const MATERIAL_LECCION_DESCRIPCION = 'PDF, Word, Excel, PowerPoint, AutoCAD (DWG/DXF) o Power BI'

/** «Word», «Excel»… para el botón de descarga del alumno. null si la ruta no trae una extensión conocida. */
export function formatoMaterial(pathOrNombre: string | null | undefined): string | null {
  if (!pathOrNombre) return null
  return FORMATOS[extensionDe(pathOrNombre)]?.etiqueta ?? null
}

/** Content-Type con el que se sube el archivo (nunca vacío). */
export function contentTypeMaterial(nombre: string, tipoNavegador: string): string {
  const f = FORMATOS[extensionDe(nombre)]
  if (!f) return tipoNavegador || 'application/octet-stream'
  return f.mimes.includes(tipoNavegador) ? tipoNavegador : f.contentType
}

export function validarMaterialLeccion(file: { name: string; size: number; type: string }): ValidacionArchivo {
  const f = FORMATOS[extensionDe(file.name)]
  const tipo = (file.type || '').toLowerCase()
  if (!f || !(f.mimes.includes(tipo) || (MIMES_GENERICOS as readonly string[]).includes(tipo))) {
    return { ok: false, error: `El material debe ser ${MATERIAL_LECCION_DESCRIPCION}.` }
  }
  if (file.size > MATERIAL_MAX_BYTES) {
    return { ok: false, error: 'El archivo no puede pesar más de 10MB.' }
  }
  return { ok: true }
}

const empieza = (b: Uint8Array, firma: readonly number[]) =>
  b.length >= firma.length && firma.every((x, i) => b[i] === x)

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
const ZIP = [0x50, 0x4b, 0x03, 0x04] // PK\3\4
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
const DWG = [0x41, 0x43, 0x31, 0x30] // AC10 (AC1015, AC1018, AC1024, AC1032…)

/**
 * ¿Los primeros bytes del objeto corresponden a la extensión con la que se
 * subió? `inicio` = al menos los primeros 512 bytes del archivo.
 */
export function firmaMaterialValida(nombre: string, inicio: Uint8Array): boolean {
  const f = FORMATOS[extensionDe(nombre)]
  if (!f) return false
  switch (f.familia) {
    case 'pdf':   return empieza(inicio, PDF)
    case 'ooxml': return empieza(inicio, ZIP)
    case 'ole':   return empieza(inicio, OLE)
    case 'dwg':   return empieza(inicio, DWG)
    case 'dxf': {
      // DXF binario trae cabecera fija; el ASCII es texto plano que abre con
      // un código de grupo («0» y luego SECTION, o un comentario «999»).
      const cab = new TextDecoder('latin1').decode(inicio.slice(0, 512))
      if (cab.startsWith('AutoCAD Binary DXF')) return true
      if (/[\x00-\x08\x0e-\x1f]/.test(cab)) return false
      return /^\s*(0|999)\s*\r?\n/.test(cab)
    }
  }
}
