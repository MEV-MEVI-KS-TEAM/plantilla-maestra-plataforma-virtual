import { CONFIG } from '@/lib/config'

/**
 * Ofertas de Cursos de Ingreso, normalizadas.
 *
 * Existe porque los clientes describen el add-on de tres formas distintas en
 * CONFIG.cursosIngreso y el registro necesita UNA sola forma:
 *
 *   ANGELOPOLIS  { activa, pagoUnico, cursos:[{ id, precio, cursoIds }] }      1 curso
 *   CENTROEVM    { activa, pagoUnico, cursos:[{ id, precio, cursoIds }] }      2 cursos sueltos
 *   EVOCONTUCER  { activos, precioPaquete, cursos:[{ slug }] }                 6 como PAQUETE ÚNICO
 *
 * El caso del paquete es el que obliga a que la oferta NO sea un curso: ahí una
 * sola oferta ('paquete') se traduce a los 6 UUID que hay que inscribir. Por eso
 * `cursoIds` es un arreglo y `alumnos.curso_solicitado` guarda el id de la
 * OFERTA y no un UUID.
 *
 * Los UUID viven en el config y no se consultan a la BD porque /register es
 * público: la RLS de `cursos` es solo para `authenticated`, así que un visitante
 * anónimo no puede listarlos.
 */
export interface OfertaIngreso {
  /** Id estable de la oferta. Es lo que se guarda en alumnos.curso_solicitado. */
  id: string
  /** Etiqueta para el registro y para el panel del admin. */
  nombre: string
  /** Detalle corto (examen o destino). Vacío si el config no lo trae. */
  detalle: string
  /**
   * Pago único de config.ts, en la moneda de la escuela. 0 si el config no lo
   * declara. Es el RESPALDO: el registro anuncia el precio de la ficha del
   * curso cuando la tiene (ver resolverPrecioOferta en precio-curso.ts). En el
   * paquete es `precioPaquete`, que la tabla no tiene.
   */
  precio: number
  /** UUID(s) de `cursos` a inscribir al asignar. El paquete trae varios. */
  cursoIds: string[]
  /** true = los cursos se venden juntos por `precioPaquete` (una sola oferta). */
  esPaquete: boolean
}

type CursoConfig = {
  id?: string
  slug?: string
  nombre?: string
  examen?: string
  destino?: string
  desc?: string
  precio?: number
  cursoIds?: readonly string[]
}

/**
 * Lista de ofertas activas. Vacía si el cliente no vende cursos de ingreso, lo
 * que hace que el bloque del registro simplemente no se muestre.
 */
export function getOfertasIngreso(): OfertaIngreso[] {
  return normalizarOfertas((CONFIG as { cursosIngreso?: Record<string, unknown> }).cursosIngreso)
}

/** El normalizador, puro: recibe el bloque `cursosIngreso` tal como venga. */
export function normalizarOfertas(ing: Record<string, unknown> | null | undefined): OfertaIngreso[] {
  if (!ing) return []

  // 'activa' (Angelópolis/CENTROEVM) y 'activos' (EVOCONTUCER) son la misma
  // bandera con distinto nombre. Ausente = no activo.
  const activa = Boolean(ing.activa ?? ing.activos)
  if (!activa) return []

  const cursos = (ing.cursos ?? []) as readonly CursoConfig[]
  const precioPaquete = Number(ing.precioPaquete ?? 0)

  // PAQUETE: un solo pago da acceso a todos. Se colapsa en UNA oferta.
  if (precioPaquete > 0) {
    const ids = cursos.flatMap(c => (c.cursoIds ?? []) as string[])
    if (!ids.length) return []
    return [{
      id: 'paquete',
      nombre: `Paquete completo de cursos de ingreso (${cursos.length} cursos)`,
      detalle: cursos.map(c => c.examen ?? c.slug ?? '').filter(Boolean).join(' · '),
      precio: precioPaquete,
      cursoIds: ids,
      esPaquete: true,
    }]
  }

  // CURSOS SUELTOS: cada entrada es su propia oferta. Se omite la que no tenga
  // id o UUID — sin ellos no se puede ni guardar la solicitud ni activarla.
  return cursos.flatMap<OfertaIngreso>(c => {
    const id = c.id ?? c.slug
    const cursoIds = (c.cursoIds ?? []) as string[]
    if (!id || !cursoIds.length) return []
    return [{
      id,
      nombre: c.nombre ?? c.examen ?? id,
      detalle: c.examen ?? c.destino ?? c.desc ?? '',
      precio: Number(c.precio ?? 0),
      cursoIds,
      esPaquete: false,
    }]
  })
}

/** Busca una oferta por id. `null` si no existe: sirve de whitelist en la API. */
export function getOfertaIngreso(id: string | null | undefined): OfertaIngreso | null {
  if (!id) return null
  return getOfertasIngreso().find(o => o.id === id) ?? null
}

/** true si el cliente vende al menos una oferta. */
export function hayOfertasIngreso(): boolean {
  return getOfertasIngreso().length > 0
}
