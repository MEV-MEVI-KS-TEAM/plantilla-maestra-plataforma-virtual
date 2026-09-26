import { test, expect } from '@playwright/test'
import { NextRequest } from 'next/server'
import { rebotaConSesion, updateSession } from '@/lib/supabase/middleware'

/**
 * #211 — con sesión abierta, una API PÚBLICA no se redirige al panel.
 *
 * /admin/alumnos pide el catálogo a /api/catalogo-publico. El middleware
 * mandaba a quien tiene sesión y abre una ruta pública a su panel, API
 * incluida: el fetch recibía el HTML de /admin, `r.json()` lanzaba y el alta
 * del admin se quedaba sin «Curso o diplomado».
 */

test('la regla: landing, catálogo y APIs no rebotan; login y compañía sí', () => {
  for (const r of ['/api/catalogo-publico', '/api/validar/MEV-2026-0001', '/', '/diplomados', '/diplomados/abc']) {
    expect(rebotaConSesion(r), r).toBe(false)
  }
  for (const r of ['/login', '/register', '/forgot-password', '/reset-password',
    '/aviso-de-privacidad', '/terminos-y-condiciones', '/validar']) {
    expect(rebotaConSesion(r), r).toBe(true)
  }
})

// ── updateSession de verdad, con Supabase simulado por fetch ─────────────────
// La sesión va en la cookie que lee @supabase/ssr; `getUser()` y la lectura del
// rol en `usuarios` salen por fetch y se contestan aquí. Sin red ni base.
const URL_SB = 'https://qaunitariomiddleware.supabase.co'
const USUARIO = { id: '11111111-2222-4333-8444-555555555555', aud: 'authenticated', role: 'authenticated', email: 'admin@example.com' }

function peticionConSesion(ruta: string): NextRequest {
  const sesion = {
    access_token: 'token-de-prueba', refresh_token: 'refresh-de-prueba', token_type: 'bearer',
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: USUARIO,
  }
  const valor = 'base64-' + Buffer.from(JSON.stringify(sesion)).toString('base64url')
  return new NextRequest(new URL(ruta, 'http://localhost:3000'), {
    headers: { cookie: `sb-qaunitariomiddleware-auth-token=${valor}` },
  })
}

test.describe('updateSession con sesión de admin', () => {
  const fetchReal = globalThis.fetch
  test.beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = URL_SB
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-de-prueba'
    globalThis.fetch = (async (entrada: RequestInfo | URL) => {
      const url = String(entrada instanceof Request ? entrada.url : entrada)
      if (url.startsWith(`${URL_SB}/auth/v1/user`)) return Response.json(USUARIO)
      if (url.startsWith(`${URL_SB}/rest/v1/usuarios`)) return Response.json({ rol: 'ADMIN' })
      return new Response('inesperado: ' + url, { status: 599 })
    }) as typeof fetch
  })
  test.afterEach(() => { globalThis.fetch = fetchReal })

  test('/api/catalogo-publico y /api/validar pasan a la ruta (no 307 al panel)', async () => {
    for (const ruta of ['/api/catalogo-publico', '/api/validar/MEV-2026-0001']) {
      const res = await updateSession(peticionConSesion(ruta))
      expect(res.headers.get('location'), ruta).toBeNull()
      expect(res.status, ruta).toBe(200)
    }
  })

  test('/login sigue mandando al admin a su panel (la sesión simulada sí se lee)', async () => {
    const res = await updateSession(peticionConSesion('/login'))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location') ?? '', 'http://x').pathname).toBe('/admin')
  })
})
