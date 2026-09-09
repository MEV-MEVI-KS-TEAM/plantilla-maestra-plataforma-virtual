import { CONFIG } from './config'

/**
 * Helpers de modalidades para plantilla MEV.
 *
 * Toda la lógica de "cuántos meses dura, cuánto cuesta, cuáles están activas"
 * se centraliza aquí. Los 11 archivos de API y las páginas de UI consumen estas
 * funciones en lugar de tener ternarios duplicados tipo:
 *
 *   modalidad === '3_meses' ? 3 : 6   ← bug latente para clientes con configuración no binaria
 *
 * Uso típico:
 *   const meses = getMesesByModalidad(alumno.modalidad)
 *   const mensualidad = getMensualidadByModalidad(alumno.modalidad)
 *   const opciones = getModalidadesActivas()
 *
 * ─── F3B: "precios con fuente única" ────────────────────────────────────────
 *
 * Desde "Personalizar mi página" el admin puede cambiar `mensualidad` y
 * `activa` de cada modalidad sin redeploy (ver src/lib/site-config-core.ts).
 * Esos cambios viven en la BD, NO en config.ts, así que los helpers de abajo
 * aceptan un parámetro opcional FINAL `mods` con la tabla de modalidades ya
 * fusionada:
 *
 *   getModalidadesActivas(cfg.modalidades)   ← selector del panel / landing
 *   getModalidadesActivas()                  ← igual que siempre (CONFIG)
 *
 * El parámetro va al final y con default `CONFIG.modalidades` para que los
 * llamadores de siempre compilen y se comporten EXACTAMENTE igual.
 *
 * ─── REGLA DE ALCANCE (decisión del coordinador, no la cambies sin él) ──────
 *
 * Apagar una modalidad desde el panel (`activa: false`) la OCULTA en:
 *   - la landing pública (LandingClient),
 *   - el registro público (/register),
 *   - las altas nuevas del panel (admin/alumnos) y la corrección de plan.
 *
 * Pero NO altera la ventana académica de un alumno YA INSCRITO. Un alumno de
 * '6_meses' sigue estudiando 6 meses a 2 materias por mes aunque el admin
 * retire ese plan del catálogo comercial; lo contrario le cerraría materias
 * que ya pagó, a mitad del programa y sin aviso.
 *
 * Por eso los helpers que consume la LÓGICA ACADÉMICA de las APIs
 * (getMesesByModalidad, getMateriasPorMesByModalidad, getDefaultModalidadId y
 * el buscarModalidad interno, usados por acceso/cerrar-mes/desbloquear-mes/
 * constancia/perfil/meses y src/lib/acceso-materias.ts) se llaman SIN el
 * parámetro: leen `CONFIG.modalidades`, que es la definición del PRODUCTO
 * (id, meses, materiasPorMes) y no se edita desde el panel.
 */

export type ModalidadId = typeof CONFIG.modalidades[number]['id']

export type Modalidad = typeof CONFIG.modalidades[number]

/**
 * Forma ESTRUCTURAL de una modalidad del programa (Sec/Prepa). Es el tipo del
 * parámetro `mods` de los helpers de abajo.
 *
 * Deliberadamente más ANCHO que `Modalidad` (que son los literales de
 * `CONFIG.modalidades` bajo `as const`): tiene que aceptar tanto
 * `CONFIG.modalidades` como `PublicSiteConfig['modalidades']` — la tabla ya
 * fusionada con los overrides del admin, cuyos valores son `string`/`number`/
 * `boolean` cualesquiera y llegan `readonly` en profundidad. El `readonly` de
 * las propiedades no afecta la asignabilidad, así que las dos entran sin cast.
 *
 * `activa` es OBLIGATORIA aquí (a diferencia de `ModalidadBase`, la forma
 * laxa que comparten programa y licenciatura): en la tabla del programa
 * siempre está declarada.
 */
export type ModalidadPrograma = {
  id: string
  label: string
  meses: number
  mensualidad: number
  materiasPorMes: number
  activa: boolean
}

/**
 * Forma mínima que comparten las modalidades del programa (Sec/Prepa) y las de
 * licenciatura. Las de licenciatura viven aparte en CONFIG.licenciaturas porque
 * tienen su propia tabla de precios y duraciones ('9_meses' no existe en el
 * plan de Prepa), pero los helpers de abajo deben resolver AMBAS: un alumno de
 * licenciatura en '9_meses' que no se encuentre aquí cae al fallback y estudia
 * con el ritmo de otro plan.
 */
type ModalidadBase = {
  id: string
  label: string
  meses: number
  mensualidad: number
  materiasPorMes: number
  activa?: boolean
}

function modalidadesLic(): readonly ModalidadBase[] {
  const lic = (CONFIG as { licenciaturas?: { activas?: boolean; modalidades?: readonly ModalidadBase[] } }).licenciaturas
  if (!lic?.activas) return []
  return lic.modalidades ?? []
}

/** Modalidades de licenciatura activas, para los selectores de carrera. */
export function getModalidadesLicenciatura(): readonly ModalidadBase[] {
  return modalidadesLic().filter(m => m.activa !== false)
}

/**
 * materiasPorMes de una modalidad DE LICENCIATURA, sin pasar por buscarModalidad().
 *
 * ⚠️ Existe porque los ids de las dos tablas COLISIONAN. `buscarModalidad()`
 * consulta primero `CONFIG.modalidades` (el programa de Sec/Prepa) y solo cae a
 * licenciaturas si no encuentra nada. Como los programas del banco declaran
 * '3_meses' y '6_meses' en AMBAS tablas, la de licenciatura nunca gana: un
 * alumno de un programa de 24 materias en '6_meses' hereda el materiasPorMes
 * del plan de prepa (2) y su ventana queda en 6 × 2 = 12 materias. Se detiene a
 * la mitad del temario, con 403 al abrir cualquier materia posterior, y subirle
 * los meses desbloqueados no ayuda: el tope es un producto. Ver Bug 121.
 *
 * Devuelve undefined si la modalidad no está declarada en licenciaturas, para
 * que quien llama conserve su fallback de siempre.
 */
export function getMateriasPorMesLicenciatura(id: string | null | undefined): number | undefined {
  if (!id) return undefined
  const m = modalidadesLic().find(x => x.id === id && x.activa !== false)
  return m && Number.isFinite(m.materiasPorMes) && m.materiasPorMes > 0
    ? m.materiasPorMes
    : undefined
}

/**
 * Busca una modalidad en el plan del programa y, si no está, en el de
 * licenciatura. Este es el único punto que conoce las dos tablas.
 */
function buscarModalidad(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): ModalidadBase | undefined {
  if (!id) return undefined
  const base = mods.find(m => m.id === id && m.activa)
  if (base) return base
  return modalidadesLic().find(m => m.id === id && m.activa !== false)
}

/**
 * Obtiene la modalidad por ID. Solo devuelve modalidades ACTIVAS.
 * Si el ID no existe o está desactivado, devuelve undefined.
 *
 * Devuelve `ModalidadPrograma` (estructural) y no `Modalidad` (los literales
 * de CONFIG): con `mods` la modalidad puede venir del config fusionado.
 */
export function getModalidad(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): ModalidadPrograma | undefined {
  if (!id) return undefined
  return mods.find(m => m.id === id && m.activa)
}

/**
 * Obtiene la duración en meses por ID de modalidad.
 * Fallback inteligente: si el ID no existe o está desactivado,
 * devuelve los meses de la primera modalidad activa configurada.
 * Si no hay modalidades activas (config rota), devuelve 3 como último recurso.
 *
 * ⚠️ LÓGICA ACADÉMICA: los llamadores (APIs de acceso, cerrar-mes,
 * desbloquear-mes, constancia, perfil, meses) lo llaman SIN `mods` a
 * propósito. Ver la regla de alcance en la cabecera del archivo.
 */
export function getMesesByModalidad(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): number {
  const found = buscarModalidad(id, mods)
  if (found) return found.meses

  const firstActive = mods.find(m => m.activa)
  return firstActive?.meses ?? 3
}

/**
 * Obtiene la mensualidad por ID de modalidad. Mismo fallback que getMesesByModalidad.
 *
 * Es un PRECIO: quien lo muestre debe pasarle las modalidades del config
 * fusionado (`getMensualidadByModalidad(id, cfg.modalidades)`), o enseñará el
 * precio de config.ts en lugar del que el admin puso en su panel.
 */
export function getMensualidadByModalidad(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): number {
  const found = getModalidad(id, mods)
  if (found) return found.mensualidad

  const firstActive = mods.find(m => m.activa)
  return firstActive?.mensualidad ?? 0
}

/**
 * Devuelve solo las modalidades activas, en el orden en que están definidas.
 * Para usar en <select>, <option> y mapeos de UI.
 *
 * Todo selector o listado que VEA el usuario debe pasarle las modalidades del
 * config fusionado: apagar un plan desde el panel tiene que quitarlo del
 * catálogo comercial.
 */
export function getModalidadesActivas(
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): readonly ModalidadPrograma[] {
  return mods.filter(m => m.activa)
}

/**
 * Verifica si un ID de modalidad está activo.
 */
export function isModalidadActiva(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): boolean {
  if (!id) return false
  return mods.some(m => m.id === id && m.activa)
}

/**
 * Devuelve el label legible de una modalidad por ID.
 * Si no existe, devuelve el ID tal cual (para no romper UI).
 */
export function getLabelByModalidad(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): string {
  if (!id) return ''
  const found = mods.find(m => m.id === id)
  return found?.label ?? id
}

/**
 * Obtiene materias por mes de una modalidad. Crítico para calcular
 * la densidad académica del alumno (cuántas materias ve cada mes).
 *
 * ⚠️ LÓGICA ACADÉMICA: se llama SIN `mods` (ver regla de alcance arriba).
 */
export function getMateriasPorMesByModalidad(
  id: string | null | undefined,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): number {
  // Resuelve también las modalidades de licenciatura: sin esto, un alumno en
  // '9_meses' caía al fallback y desbloqueaba materias al ritmo de otro plan.
  const found = buscarModalidad(id, mods)
  if (found) return found.materiasPorMes

  const firstActive = mods.find(m => m.activa)
  return firstActive?.materiasPorMes ?? 2
}

/**
 * Devuelve el ID de la modalidad por defecto (primera activa).
 * Para usar como fallback cuando BD devuelve null en columnas modalidad.
 *
 * ⚠️ LÓGICA ACADÉMICA: se llama SIN `mods` (ver regla de alcance arriba).
 */
export function getDefaultModalidadId(
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): string {
  const firstActive = mods.find(m => m.activa)
  return firstActive?.id ?? '6_meses'
}

/**
 * Construye una frase legible con los meses de las modalidades activas.
 * Auto-adapta singular/plural y conjunción "o" para 2+ modalidades.
 *
 * @example
 *   modalidades activas [3 meses] → "3 meses"
 *   modalidades activas [3, 6 meses] → "3 o 6 meses"
 *   modalidades activas [3, 6, 12 meses] → "3, 6 o 12 meses"
 *   modalidades vacías → ""
 */
export function getDuracionLabel(
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): string {
  const activas = mods.filter(m => m.activa)
  if (activas.length === 0) return ''
  if (activas.length === 1) return `${activas[0].meses} meses`

  const numeros = activas.map(m => m.meses).sort((a, b) => a - b)
  if (numeros.length === 2) return `${numeros[0]} o ${numeros[1]} meses`

  const ultimo = numeros.pop()
  return `${numeros.join(', ')} o ${ultimo} meses`
}

/**
 * Construye una frase legible con los niveles académicos del cliente.
 * Capitaliza la primera letra y maneja singular/plural.
 *
 * @example
 *   niveles ['preparatoria'] → "Preparatoria"
 *   niveles ['secundaria'] → "Secundaria"
 *   niveles ['secundaria', 'preparatoria'] → "Prepa o Secundaria"
 *   niveles vacíos → ""
 */
export function getNivelLabel(): string {
  const niveles = CONFIG.niveles as readonly string[]
  if (niveles.length === 0) return ''

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  if (niveles.length === 1) {
    return capitalize(niveles[0])
  }

  const tienePrepa = niveles.includes('preparatoria')
  const tieneSecu  = niveles.includes('secundaria')
  if (tienePrepa && tieneSecu && niveles.length === 2) {
    return 'Prepa o Secundaria'
  }

  const capitalizadas = niveles.map(capitalize)
  if (capitalizadas.length === 2) return `${capitalizadas[0]} o ${capitalizadas[1]}`

  const ultimo = capitalizadas[capitalizadas.length - 1]
  const resto = capitalizadas.slice(0, -1).join(', ')
  return `${resto} o ${ultimo}`
}

/**
 * Devuelve el label de plan adaptado al contexto de modalidades activas.
 * Si solo hay 1 modalidad activa, omite el sufijo descriptivo (ej: "— Express").
 * Si hay múltiples, conserva el label completo de CONFIG.
 *
 * @example
 *   1 modalidad activa: { id: '3_meses', label: '3 meses — Express' }
 *     → "3 meses"   (sin sufijo, no hay competencia)
 *   2 modalidades activas:
 *     → "3 meses — Express" / "6 meses — Estándar"  (label completo)
 */
export function getPlanLabel(
  modalidad: ModalidadPrograma,
  mods: readonly ModalidadPrograma[] = CONFIG.modalidades,
): string {
  const activas = mods.filter(m => m.activa)
  if (activas.length <= 1) {
    return modalidad.label.split(' — ')[0].trim()
  }
  return modalidad.label
}

// ─── Desglose de precio por nivel ────────────────────────────────────────────

/** Los dos niveles del programa que tienen tabla de precios propia. */
export type NivelPrograma = 'secundaria' | 'preparatoria'

/**
 * Forma mínima de `CONFIG.precios` que necesita `desglosePlan`. Laxa a
 * propósito: acepta tanto `CONFIG.precios` (literales bajo `as const`) como el
 * objeto ya fusionado con los overrides del admin.
 */
export type PreciosPrograma = {
  inscripcion: number
  inscripcionSecundaria?: number
  inscripcionPreparatoria?: number
  secundaria_3meses_normal?: number
  secundaria_6meses_normal?: number
}

export interface DesglosePlan {
  inscripcion: number
  mensualidad: number
  meses: number
  /** inscripción + meses × mensualidad. Sin la certificación, que es aparte. */
  total: number
}

/**
 * Lo que le cuesta a un aspirante un plan concreto, por NIVEL.
 *
 * DE DÓNDE SALE CADA CIFRA. La plantilla resuelve el precio por nivel en dos
 * sitios distintos, y esta función es la única definición de esa mezcla:
 *
 *   inscripción   `inscripcionSecundaria` / `inscripcionPreparatoria`, con
 *                 fallback a `inscripcion` para la escuela de tarifa única.
 *   mensualidad   preparatoria toma `modalidad.mensualidad` —es la que pinta su
 *                 tarjeta en la landing—; secundaria toma los alias
 *                 `secundaria_Nmeses_normal`, que es donde vive su tarifa
 *                 cuando difiere. Sin alias declarado cae a la mensualidad.
 *
 * El TOTAL importa: en una escuela donde la preparatoria cuesta 3.3× la
 * secundaria (Moreta IED, #196), el aspirante tiene que ver la cifra completa
 * ANTES de inscribirse y no descubrirla en el primer recibo.
 */
export function desglosePlan(
  nivel: NivelPrograma,
  modalidad: Pick<ModalidadPrograma, 'id' | 'meses' | 'mensualidad'>,
  precios: PreciosPrograma,
): DesglosePlan {
  const porNivel = nivel === 'secundaria'
    ? precios.inscripcionSecundaria
    : precios.inscripcionPreparatoria
  const inscripcion = typeof porNivel === 'number' ? porNivel : precios.inscripcion

  let mensualidad = modalidad.mensualidad
  if (nivel === 'secundaria') {
    const alias = modalidad.meses === 3
      ? precios.secundaria_3meses_normal
      : modalidad.meses === 6
        ? precios.secundaria_6meses_normal
        : undefined
    if (typeof alias === 'number') mensualidad = alias
  }

  return {
    inscripcion,
    mensualidad,
    meses: modalidad.meses,
    total: inscripcion + modalidad.meses * mensualidad,
  }
}
