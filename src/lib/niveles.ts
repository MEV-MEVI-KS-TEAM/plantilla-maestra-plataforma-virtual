import { CONFIG } from '@/lib/config'
import {
  licenciaturasActivas,
  getCarrerasLicenciatura,
  getCarrerasDiplomado,
  getEtiquetaLicenciatura,
} from '@/lib/licenciatura-utils'

/**
 * Cómo llama la escuela a su catálogo de cursos. Por defecto «Curso o
 * diplomado»; un cliente que solo venda cursos lo pone en
 * `CONFIG.landing.catalogoEtiquetaNivel` y el formulario lo llama igual.
 */
function getEtiquetaCursos(): string {
  const l = (CONFIG as { landing?: { catalogoEtiquetaNivel?: string } }).landing
  return l?.catalogoEtiquetaNivel?.trim() || 'Curso o diplomado'
}

/**
 * Las opciones del desplegable «¿qué desean estudiar?» del registro.
 *
 * ⚠️ POR QUÉ EXISTE ESTE ARCHIVO. Hasta el 7-sep-2026 las tres pantallas que
 * preguntan el nivel (registro público, alta manual del admin y corregir plan)
 * llevaban la MISMA lista escrita a mano:
 *
 *   <option value="secundaria">Secundaria</option>
 *   <option value="preparatoria">Preparatoria</option>
 *   {licenciaturasActivas() && <option value="licenciatura">Licenciatura</option>}
 *
 * Con eso el desplegable no refleja lo que la escuela vende: sus diplomados
 * quedaban escondidos dentro de «Licenciatura» y sus cursos no aparecían en
 * ninguna parte. Es el sexto cliente que lo pide (Edunova e IMN el 25-ago, SIE
 * el 27-ago, Instituto 10 de Agosto el 2-sep, Fili Cano el 4-sep y ahora
 * Búfalo — TICKET-2026-09-07-52), así que la lista deja de escribirse a mano y
 * se deriva de los productos que el cliente tiene activos.
 *
 * 🛑 NO volver a poner opciones a mano en un <select>. Si falta una, el arreglo
 * es que salga de aquí.
 *
 * ⚠️ `value` NO siempre es el `nivel` que se guarda. «Diplomados» es una
 * presentación distinta de `nivel='licenciatura'` (así es como el add-on tiene
 * montados sus diplomados: carrera con `esDiplomado: true`, con sus mismas
 * materias, modalidades y constancia). Traduce SIEMPRE con `nivelDeOpcion()`
 * antes de escribir en BD.
 */

/** Qué campo extra hay que pedirle al prospecto tras elegir esta opción. */
export type CampoOpcionNivel = 'modalidad' | 'carrera' | 'curso'

export interface OpcionNivel {
  /** Valor del <option>. Identifica la opción en la UI, no en la BD. */
  value: string
  label: string
  /** Lo que se persiste en `alumnos.nivel`. */
  nivel: string
  /** Campos que la UI debe pedir además del nivel. */
  campos: readonly CampoOpcionNivel[]
}

/** Traduce el valor del desplegable al nivel real de `alumnos.nivel`. */
export function nivelDeOpcion(value: string | null | undefined): string | null {
  if (!value) return null
  return OPCIONES_BASE.find(o => o.value === value)?.nivel ?? value
}

/** true si esa opción es un diplomado del riel de licenciaturas. */
export function esOpcionDiplomadoLic(value: string | null | undefined): boolean {
  return value === 'diplomado_lic'
}

/** true si esa opción es un curso del catálogo (tabla `cursos`). */
export function esOpcionCurso(value: string | null | undefined): boolean {
  return value === 'diplomado'
}

const OPCIONES_BASE: readonly OpcionNivel[] = [
  { value: 'secundaria',    label: 'Secundaria',    nivel: 'secundaria',    campos: ['modalidad'] },
  { value: 'preparatoria',  label: 'Preparatoria',  nivel: 'preparatoria',  campos: ['modalidad'] },
  { value: 'licenciatura',  label: 'Licenciatura',  nivel: 'licenciatura',  campos: ['modalidad', 'carrera'] },
  { value: 'diplomado_lic', label: 'Diplomados',    nivel: 'licenciatura',  campos: ['modalidad', 'carrera'] },
  // ⚠️ El value es 'diplomado', no 'curso': es el que la plantilla ya usaba
  // para el catálogo y el que `register/page.tsx` compara. Cambiarlo obligaría
  // a tocar el resto del formulario sin ganar nada.
  { value: 'diplomado',     label: 'Curso o diplomado', nivel: 'diplomado', campos: ['curso'] },
]

/**
 * Opciones que esta escuela ofrece hoy.
 *
 * @param hayCursosPublicados si el catálogo (`cursos` con estado='publicado')
 *   trae algo. Se pasa desde fuera porque leer esa tabla es asíncrono y del
 *   lado servidor; sin cursos publicados la opción «Cursos» NO se ofrece,
 *   porque llevaría a un selector vacío.
 */
export function getOpcionesNivel(hayCursosPublicados = false): OpcionNivel[] {
  const niveles = (CONFIG as { niveles?: readonly string[] }).niveles ?? []
  const out: OpcionNivel[] = []

  for (const base of OPCIONES_BASE) {
    if (base.value === 'secundaria' || base.value === 'preparatoria') {
      if (niveles.includes(base.value)) out.push({ ...base })
      continue
    }
    if (base.value === 'licenciatura') {
      // Solo si hay carreras que NO sean diplomados: si la escuela únicamente
      // montó diplomados sobre el riel, ofrecer «Licenciatura» sería mentir.
      if (licenciaturasActivas() && getCarrerasLicenciatura().length > 0) {
        out.push({ ...base, label: getEtiquetaLicenciatura() })
      }
      continue
    }
    if (base.value === 'diplomado_lic') {
      if (licenciaturasActivas() && getCarrerasDiplomado().length > 0) out.push({ ...base })
      continue
    }
    if (base.value === 'diplomado') {
      // Solo si la escuela tiene cursos publicados: si no, la opción llevaría
      // a un selector vacío.
      if (hayCursosPublicados) out.push({ ...base, label: getEtiquetaCursos() })
      continue
    }
  }
  return out
}

/**
 * Opciones para el ALTA MANUAL del admin (modal «Nuevo Alumno» y «Corregir
 * plan de estudio»).
 *
 * Se quedan fuera:
 * - «Cursos», porque el admin inscribe a un curso desde el módulo de Cursos
 *   (pestaña Alumnos), no dando de alta un alumno con nivel escolar.
 * - «Diplomados», porque en estas dos pantallas el admin ya ve la lista
 *   COMPLETA de carreras —diplomados incluidos— bajo la opción de licenciatura,
 *   que es como lleva funcionando y no hay razón para partirla.
 *
 * Lo que sí hereda es la ETIQUETA: si el cliente vende «Licenciatura ejecutiva»,
 * el panel debe llamarla igual que el formulario público.
 */
export function getOpcionesNivelAdmin(): OpcionNivel[] {
  return getOpcionesNivel(false).filter(o => o.value === o.nivel)
}

/** Los `nivel` de BD que este cliente acepta hoy. Para validar en el servidor. */
export function nivelesPermitidos(hayCursosPublicados = false): string[] {
  return [...new Set(getOpcionesNivel(hayCursosPublicados).map(o => o.nivel))]
}
