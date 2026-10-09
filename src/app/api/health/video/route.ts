import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseBunnyUrl } from '@/lib/video/bunny-url'
import { configBunnyDe, firmarUrlVideo } from '@/lib/video/bunny-firma-core'

/**
 * GET /api/health/video — smoke post-deploy de Bunny Stream (TAREA 9.10).
 *
 * Desde el SERVIDOR desplegado: toma un video de Bunny del contenido del
 * cliente (o el `?video=<GUID>` que se le pase), lo firma con BUNNY_LIBRARY_ID
 * y BUNNY_TOKEN_KEY y comprueba contra Bunny que la URL firmada responde 200 y
 * la canónica sin firmar 403. Así se sabe que las variables llegaron al deploy
 * y que la llave es la buena, sin que la llave salga del servidor.
 *
 *   200  { ok: true,  config: true, firmada: 200, sin_firma: 403, fuente }
 *   503  { ok: false, config: false }                       ← faltan BUNNY_*
 *   503  { ok: false, config: true, video: 'sin_videos' | 'otra_biblioteca', … }
 *   503  { ok: false, config: true, firmada: N, sin_firma: M, fuente }
 *   401  { ok: false }                                      ← sin el token del smoke
 *
 * Queda fuera del middleware como /api/health (el matcher excluye `api/health`).
 * NO es pública: pide `Authorization: Bearer <sha256_hex("mev-health-video:" +
 * SUPABASE_SERVICE_ROLE_KEY)>`, que el operador calcula con la service role que
 * ya tiene en .env.local. Nunca devuelve URLs, tokens ni la llave.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const sinCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate' } as const
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function autorizado(req: NextRequest): boolean {
  const srk = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!srk) return false
  const esperado = createHash('sha256').update('mev-health-video:' + srk).digest()
  const dado = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!/^[0-9a-f]{64}$/i.test(dado)) return false
  return timingSafeEqual(esperado, Buffer.from(dado, 'hex'))
}

async function primerVideoBunny(): Promise<{ url: string; fuente: string } | null> {
  const admin = createAdminClient()
  for (const [tabla, columnas] of [
    ['semanas', ['video_url', 'video_url_2', 'video_url_3']],
    ['curso_lecciones', ['video_url']],
  ] as const) {
    for (const col of columnas) {
      const { data } = await admin.from(tabla).select(col).ilike(col, '%mediadelivery.net/embed/%').limit(1)
      const url = (data?.[0] as Record<string, string | null> | undefined)?.[col]
      if (url && parseBunnyUrl(url)) return { url, fuente: `${tabla}.${col}` }
    }
  }
  return null
}

async function estado(url: string): Promise<number> {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15_000) })
    return r.status
  } catch {
    return 0
  }
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ ok: false }, { status: 401, headers: sinCache })
  try {
    const cfg = configBunnyDe(process.env)
    if (!cfg) {
      console.error('[health/video] faltan BUNNY_LIBRARY_ID o BUNNY_TOKEN_KEY en este deploy')
      return NextResponse.json({ ok: false, config: false }, { status: 503, headers: sinCache })
    }
    const pedido = req.nextUrl.searchParams.get('video')
    const elegido = pedido
      ? (GUID.test(pedido) ? { url: `https://player.mediadelivery.net/embed/${cfg.libraryId}/${pedido}`, fuente: 'parametro' } : null)
      : await primerVideoBunny()
    if (!elegido) {
      return NextResponse.json({ ok: false, config: true, video: 'sin_videos' }, { status: 503, headers: sinCache })
    }
    const r = firmarUrlVideo(elegido.url, cfg)
    if (r.error) {
      return NextResponse.json({ ok: false, config: true, video: r.error, fuente: elegido.fuente }, { status: 503, headers: sinCache })
    }
    const v = parseBunnyUrl(r.url)!
    const [firmada, sinFirma] = await Promise.all([
      estado(r.url),
      estado(`https://player.mediadelivery.net/embed/${v.libraryId}/${v.videoId}`),
    ])
    const ok = firmada === 200 && sinFirma === 403
    if (!ok) console.error(`[health/video] Bunny respondió firmada ${firmada}, sin firma ${sinFirma} (${elegido.fuente})`)
    return NextResponse.json(
      { ok, config: true, firmada, sin_firma: sinFirma, fuente: elegido.fuente },
      { status: ok ? 200 : 503, headers: sinCache }
    )
  } catch (e) {
    console.error('[health/video] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false }, { status: 503, headers: sinCache })
  }
}
