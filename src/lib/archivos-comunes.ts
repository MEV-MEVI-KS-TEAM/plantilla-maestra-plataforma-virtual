/**
 * Reglas de archivo compartidas entre módulos (Cursos y los materiales de
 * semana de Contenido). Son funciones PURAS y sin bucket dentro: el bucket lo
 * decide quien llama, en storage-comun.ts.
 *
 * Salieron de lib/cursos/archivos.ts al aparecer el segundo consumidor. Ese
 * archivo las reexporta, así que ningún consumidor de Cursos cambia.
 */

export const MATERIAL_MAX_BYTES = 10 * 1024 * 1024 // 10MB (== límite del bucket)
export const MATERIAL_MIMES = ['application/pdf'] as const
export const MATERIAL_EXTS = ['pdf'] as const

/** Nombre seguro para storage: sin acentos, espacios → guiones, solo [a-z0-9._-] */
export function sanitizeFilename(nombre: string): string {
  const raw = (nombre || 'archivo').trim()
  const dot = raw.lastIndexOf('.')
  const base = dot > 0 ? raw.slice(0, dot) : raw
  const ext = dot > 0 ? raw.slice(dot + 1) : ''
  const clean = (s: string) =>
    s
      .normalize('NFD')
      // quitar diacríticos combinantes (acentos) tras NFD
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'archivo'
  return ext ? `${clean(base)}.${clean(ext)}` : clean(base)
}

/**
 * El nombre de una escuela convertido en slug para un nombre de archivo.
 *
 * ⚠️ NORMALIZA LOS ACENTOS ANTES DE LIMPIAR. Sin el paso NFD, un
 * `replace(/[^a-z0-9]+/g, '-')` no convierte la «í» en «i»: la BORRA, y el
 * Excel de «Aula Raíz» se descargaba como `reportes-aula-ra-z-…xlsx`. El
 * cliente lo ve cada vez que baja su reporte.
 *
 * Es el mismo criterio de normalización que ya usaba `sanitizeFilename` para
 * los archivos que sube el alumno, extraído para que quien necesite un slug de
 * nombre de escuela no se vuelva a escribir el suyo. Lo que cambia respecto a
 * aquél: aquí no hay extensión que conservar, así que el punto también es
 * separador, y un nombre que se queda sin nada usable cae en `escuela` para no
 * producir `reportes--2026-09-15.xlsx`.
 */
export function slugDeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    // quitar diacríticos combinantes (acentos) tras NFD
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'escuela'
}

export function extensionDe(nombre: string): string {
  const dot = nombre.lastIndexOf('.')
  return dot > 0 ? nombre.slice(dot + 1).toLowerCase() : ''
}

export type ValidacionArchivo = { ok: true } | { ok: false; error: string }

export function validarMaterial(file: { name: string; size: number; type: string }): ValidacionArchivo {
  if (!MATERIAL_MIMES.includes(file.type as (typeof MATERIAL_MIMES)[number]) ||
      !MATERIAL_EXTS.includes(extensionDe(file.name) as (typeof MATERIAL_EXTS)[number])) {
    return { ok: false, error: 'El material debe ser un archivo PDF.' }
  }
  if (file.size > MATERIAL_MAX_BYTES) {
    return { ok: false, error: 'El PDF no puede pesar más de 10MB.' }
  }
  return { ok: true }
}
