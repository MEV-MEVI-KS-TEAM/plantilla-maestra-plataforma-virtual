/**
 * "Personalizar mi página" (F4) — API del editor: leer, guardar y restaurar
 * los overrides de `public.site_config`.
 *
 *   GET    → lo que el editor pinta: defaults, overrides guardados y el
 *            resultado fusionado, recortados a las claves editables.
 *            ADMIN y SECRETARIO (el secretario ve el editor en solo lectura).
 *   PUT    → valida el cuerpo COMPLETO de overrides (reemplazo, no merge),
 *            hace upsert de la fila id=1 y purga la caché. Solo ADMIN.
 *            IGNORA `logo` / `logoOscuro` del cuerpo y conserva los de la fila
 *            (ver CLAVES_LOGO): esas dos claves solo las cambia
 *            /api/admin/configuracion/logo, que es quien sube y borra el
 *            archivo. Mandarlas no falla; la respuesta lo avisa.
 *   DELETE → vuelve a los defaults: vacía el bucket de logos (ya nadie los
 *            referencia) y deja `data = {}`. Solo ADMIN.
 *
 * ESCRITURA SOLO CON SERVICE ROLE. La tabla no tiene política de INSERT/UPDATE
 * para `authenticated` a propósito (ver la migración): la única vía de
 * escritura es este handler, que valida con `validarOverrides` antes de tocar
 * la fila. Por eso el upsert va con `createAdminClient()` y la sesión del
 * admin solo sirve para decidir SI puede escribir.
 *
 * LECTURA TAMBIÉN CON ADMIN CLIENT: el editor tiene que ver la fila tal cual
 * está en la BD, no la copia que `getSiteConfig()` tiene cacheada (que es la
 * que ven las páginas y puede ir hasta una purga por detrás).
 *
 * La respuesta del GET ya NO trae `escuela` / `sistema`: la página vieja de
 * "Configuración" (solo lectura) la reemplaza el editor de Fase 5.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, verifyStaff, getUserRol } from '@/lib/supabase/verify-admin'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig, revalidateSiteConfig } from '@/lib/site-config'
import { recortarAEditables, recortarOverrides, validarOverrides } from '@/lib/site-config-validacion'
import { limpiarBucketBranding } from '@/lib/site-config-storage'
import {
  MENSAJE_SITE_CONFIG_SIN_MIGRAR,
  SITE_CONFIG_SIN_MIGRAR,
  esErrorTablaInexistente,
} from '@/lib/site-config-errores'

// La fila se lee y escribe en cada petición: nada de esto se puede prerender.
export const dynamic = 'force-dynamic'

/**
 * Tope del cuerpo del PUT. La config editable completa, con todos los textos
 * al máximo de su descriptor, no llega ni a 40 kB; 256 kB deja margen de sobra
 * y evita que un cuerpo enorme se parsee entero antes de rechazarlo.
 */
const MAX_CUERPO_BYTES = 262144

/**
 * Las dos claves que el PUT NO toca: son EXCLUSIVAS de la ruta de subida
 * (POST/DELETE /api/admin/configuracion/logo).
 *
 * POR QUÉ. El editor manda el objeto COMPLETO de overrides, así que su PUT
 * lleva el logo que tenía cargado al abrir el formulario. Si mientras tanto se
 * subió otro (en otra pestaña, o por otro admin), guardar ese cuerpo
 * REVERTIRÍA el logo a una URL vieja — y el objeto nuevo se quedaría huérfano
 * en el bucket. Ignorarlas aquí hace imposible esa carrera: el logo solo
 * cambia por la ruta que además sube o borra el archivo.
 *
 * Mandarlas NO es un error (el editor no tiene que filtrar su propio estado):
 * se descartan y la respuesta lo dice con `logosIgnorados`.
 */
const CLAVES_LOGO = ['logo', 'logoOscuro'] as const

const NOTA_LOGOS =
  'logo y logoOscuro no se guardan desde este PUT: se cambian con POST o DELETE /api/admin/configuracion/logo'

type FilaSiteConfig = { data: unknown; updated_at: string | null; updated_by: string | null }

function esObjetoPlano(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Sesión + rol. Devuelve el 401/403 listo para responder, o el usuario y su
 * rol normalizado. `soloAdmin` decide si el SECRETARIO pasa (solo en GET).
 */
async function autorizar(soloAdmin: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { denied: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const denied = soloAdmin ? await verifyAdmin(supabase, user.id) : await verifyStaff(supabase, user.id)
  if (denied) return { denied }
  const rol = soloAdmin ? 'ADMIN' : await getUserRol(supabase, user.id)
  return { denied: null, user, rol }
}

/**
 * La fila id=1 tal cual está en la BD. `null` si no hay fila todavía (cliente
 * que corrió la migración y nunca guardó). Lanza si la consulta falla — el
 * caso típico es la tabla inexistente (cliente sin la migración de F1), y ahí
 * el editor debe decir "no se puede" y no fingir defaults que no podrá guardar.
 */
async function leerFila(admin: ReturnType<typeof createAdminClient>): Promise<FilaSiteConfig | null> {
  const { data, error } = await admin
    .from('site_config')
    .select('data, updated_at, updated_by')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(`${error.code ?? 'sin-codigo'}: ${error.message}`)
  return (data as FilaSiteConfig | null) ?? null
}

async function guardarFila(
  admin: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const { error } = await admin
    .from('site_config')
    .upsert(
      { id: 1, data, updated_at: new Date().toISOString(), updated_by: userId },
      { onConflict: 'id' },
    )
  if (error) throw new Error(`${error.code ?? 'sin-codigo'}: ${error.message}`)
}

const DEFAULTS = () => mergeSiteConfig(CONFIG, {})

/**
 * Traduce lo que se escapó del `try` a una respuesta.
 *
 * El fallo ESPERADO en la flota es que `public.site_config` no exista todavía
 * (~144 clientes ya desplegados que aún no corrieron la migración de F1). Eso
 * no es un error de la plataforma: es un paso del despliegue que falta, y
 * responder 500 "Error interno del servidor" mandaba al admin a abrir un ticket
 * en vez de decirle qué correr. 503 + el nombre del archivo lo resuelve solo.
 * Cualquier otra cosa sigue siendo un 500 opaco a propósito.
 */
function respuestaDeError(e: unknown): NextResponse {
  if (esErrorTablaInexistente(e)) {
    return NextResponse.json(
      { error: MENSAJE_SITE_CONFIG_SIN_MIGRAR, codigo: SITE_CONFIG_SIN_MIGRAR },
      { status: 503 },
    )
  }
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}

// ─── GET /api/admin/configuracion ────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await autorizar(false)
    if (auth.denied) return auth.denied

    const admin = createAdminClient()
    const fila = await leerFila(admin)
    // La fila la puede haber escrito cualquiera con la service role (un script
    // de alta, un arreglo a mano en el panel de Supabase), así que lo que se
    // devuelve va RECORTADO a la lista blanca: si no, el editor pintaría —y
    // reenviaría en su siguiente PUT— una clave que la validación rechaza.
    const overrides = recortarOverrides(fila?.data, DEFAULTS())

    return NextResponse.json({
      defaults: recortarAEditables(DEFAULTS()),
      overrides,
      merged: recortarAEditables(mergeSiteConfig(CONFIG, overrides)),
      puedeEditar: auth.rol === 'ADMIN',
      updatedAt: fila?.updated_at ?? null,
      updatedBy: fila?.updated_by ?? null,
    })
  } catch (e) {
    console.error('[configuracion]', e)
    return respuestaDeError(e)
  }
}

// ─── PUT /api/admin/configuracion ────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const auth = await autorizar(true)
    if (auth.denied) return auth.denied

    // Antes de parsear: un cuerpo desproporcionado no se lee entero para
    // acabar rechazándolo campo a campo.
    const declarado = Number(request.headers.get('content-length') ?? '')
    if (Number.isFinite(declarado) && declarado > MAX_CUERPO_BYTES) {
      return NextResponse.json({ error: 'Cuerpo demasiado grande' }, { status: 413 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Cuerpo inválido: se esperaba JSON' }, { status: 400 })
    }

    // Los logos se descartan ANTES de validar (ver CLAVES_LOGO): no son un
    // error del editor, simplemente no viajan por aquí.
    let logosIgnorados = false
    if (esObjetoPlano(body)) {
      const sinLogos = { ...body }
      logosIgnorados = CLAVES_LOGO.some((c) => c in sinLogos)
      for (const c of CLAVES_LOGO) delete sinLogos[c]
      body = sinLogos
    }

    // El origen del Storage decide qué URLs de logo se aceptan: solo las que
    // escribió la ruta de subida (mismo origen, mismo bucket). Ya no aplica a
    // lo que manda el cliente, pero sigue siendo la regla del resto de URLs.
    const resultado = validarOverrides(body, DEFAULTS(), {
      origenStorage: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error, clave: resultado.clave }, { status: 400 })
    }

    const admin = createAdminClient()
    // El cuerpo REEMPLAZA la fila, así que sin esto un PUT borraría el logo:
    // se reponen tal cual estaban guardados.
    const fila = await leerFila(admin)
    const guardado: Record<string, unknown> = esObjetoPlano(fila?.data) ? fila.data : {}
    const overrides = { ...(resultado.overrides as Record<string, unknown>) }
    for (const c of CLAVES_LOGO) {
      if (guardado[c] !== undefined) overrides[c] = guardado[c]
    }

    await guardarFila(admin, overrides, auth.user.id)
    // El dato nuevo y la purga viajan juntos: la siguiente lectura de
    // getSiteConfig() ya ve la fila recién escrita (ver site-config.ts).
    revalidateSiteConfig()

    return NextResponse.json({
      ok: true,
      merged: recortarAEditables(mergeSiteConfig(CONFIG, overrides)),
      overrides,
      logosIgnorados,
      nota: NOTA_LOGOS,
    })
  } catch (e) {
    console.error('[configuracion]', e)
    return respuestaDeError(e)
  }
}

// ─── DELETE /api/admin/configuracion — restaurar defaults ────────────────────
export async function DELETE() {
  try {
    const auth = await autorizar(true)
    if (auth.denied) return auth.denied

    const admin = createAdminClient()
    // Primero la fila (es lo que decide qué se ve), después los archivos: si
    // el borrado del bucket fallara a medias, quedarían huérfanos que nadie
    // referencia, no una landing apuntando a un logo que ya no existe.
    await guardarFila(admin, {}, auth.user.id)
    revalidateSiteConfig()
    await limpiarBucketBranding(admin)

    return NextResponse.json({
      ok: true,
      merged: recortarAEditables(DEFAULTS()),
      overrides: {},
    })
  } catch (e) {
    console.error('[configuracion]', e)
    return respuestaDeError(e)
  }
}
