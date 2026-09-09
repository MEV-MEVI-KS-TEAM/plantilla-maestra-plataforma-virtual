/**
 * "Personalizar mi página" — reconocer el fallo ESPERADO de la flota: la tabla
 * `public.site_config` todavía no existe en ese cliente.
 *
 * Son ~144 escuelas ya desplegadas. Ninguna tiene la tabla hasta que alguien
 * corre `supabase/migrations/20260908120000_site_config.sql` en su Supabase, y
 * mientras tanto la API del editor respondía 500 "Error interno del servidor":
 * el admin veía un error de plataforma cuando lo que falta es un paso del
 * despliegue. Con esto responde 503 y el propio mensaje dice qué correr.
 *
 * (La landing NO usa esto: `getSiteConfig()` degrada a los defaults sin avisar
 * a nadie, que es lo correcto para una página pública.)
 *
 * MÓDULO PURO. Sin imports: lo consumen las dos rutas de la API (servidor), el
 * editor `/admin/configuracion` (componente CLIENTE, que solo compara el
 * código) y las pruebas unitarias. Si esto viviera en site-config-storage.ts
 * —que importa el cliente de Supabase con service role— el editor arrastraría
 * ese módulo al bundle del navegador.
 */

/** Código de la respuesta 503. El editor lo compara para dar la pista exacta. */
export const SITE_CONFIG_SIN_MIGRAR = 'SITE_CONFIG_SIN_MIGRAR'

/** Cuerpo del 503. Nombra el archivo a correr: es lo único que hay que hacer. */
export const MENSAJE_SITE_CONFIG_SIN_MIGRAR =
  'Falta ejecutar la migración 20260908120000_site_config.sql en este cliente'

/** El `message` de un error, venga como Error, como PostgrestError o como texto. */
function mensajeDe(err: unknown): string {
  if (typeof err === 'string') return err
  if (typeof err !== 'object' || err === null) return ''
  const m = (err as { message?: unknown }).message
  return typeof m === 'string' ? m : ''
}

/** El `code` de un PostgrestError. Vacío si el error no lo trae. */
function codigoDe(err: unknown): string {
  if (typeof err !== 'object' || err === null) return ''
  const c = (err as { code?: unknown }).code
  return typeof c === 'string' ? c : ''
}

/**
 * ¿El fallo es "la tabla no existe"? Reconoce los tres formatos con los que
 * llega, porque cada capa lo envuelve distinto:
 *
 *   1. El `PostgrestError` crudo del SDK: `{ code: 'PGRST205', message: "Could
 *      not find the table 'public.site_config' in the schema cache" }`.
 *      PostgREST responde PGRST205 cuando la tabla no está en su caché de
 *      esquema — el caso real de un cliente sin la migración.
 *   2. El `PostgrestError` con el código de Postgres: `{ code: '42P01',
 *      message: 'relation "public.site_config" does not exist' }`, que es lo
 *      que sale cuando la consulta llega al motor (RPC, `execute_sql`).
 *   3. Un `Error` con el mensaje ya compuesto por los helpers de las rutas
 *      (`throw new Error(\`${code}: ${message}\`)`), que es la forma en la que
 *      esto llega de verdad al `catch` de cada handler.
 *
 * Se comprueban código Y mensaje: el 3 no tiene `code`, y el 1 podría llegar
 * algún día con otro código si PostgREST lo renombra, pero el texto seguiría
 * nombrando `site_config`.
 *
 * FALSO POSITIVO ACEPTADO: un "column site_config.x does not exist" (cliente
 * que corrió una versión vieja del SQL) también cae aquí. Da igual — la
 * respuesta es la misma y la cura también: correr la migración de nuevo.
 * Lo que NO se quiere es al revés, tragarse un fallo real de red o de permisos
 * como si fuera un despliegue a medias; por eso el `42501` de RLS, un
 * `duplicate key` o un `fetch failed` siguen dando 500.
 */
export function esErrorTablaInexistente(err: unknown): boolean {
  const texto = `${codigoDe(err)} ${mensajeDe(err)}`.toLowerCase()
  if (texto.includes('pgrst205') || texto.includes('42p01')) return true
  return (
    texto.includes('site_config') &&
    (texto.includes('does not exist') || texto.includes('could not find the table'))
  )
}
