import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { leerSiteConfig, politicaPublicado } from '../../scripts/entrega/publicado.mjs'
import { CONFIG } from '@/lib/config'
import { mergeSiteConfig } from '@/lib/site-config-core'

/**
 * Bloque D · D12 — #201 (decisiones 17-19): el Documento de Entrega usa TODO lo
 * publicado en «Personalizar mi página» (precios, planes, WhatsApp, textos,
 * colores y logo) con la MISMA fusión que la app, y ABORTA si no puede leerlo,
 * salvo con --solo-config (que queda escrito en «REVISA ANTES DE ENVIAR»).
 * Antes solo aplicaba la licenciatura y el PDF no coincidía con la página.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const GEN = leer('scripts/entrega/generar-entrega.mjs')

type Resp = { data?: unknown; error?: { code?: string; message?: string } | null; status?: number }
/** Un cliente de Supabase falso: .from().select().eq().maybeSingle() → la respuesta dada (200 si no dice). */
const cliente = (r: Resp | (() => never)) => async () => ({
  from: () => ({ select: () => ({ eq: () => ({
    maybeSingle: async () => (typeof r === 'function' ? r() : { status: 200, ...r }),
  }) }) }),
})
const VARS = { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon' }

test('1. leerSiteConfig: cada situación de la base da su estado, y nunca lanza', async () => {
  const est = async (o: Parameters<typeof leerSiteConfig>[0]) => (await leerSiteConfig(o)).estado
  expect(await est({ soloConfig: true, vars: VARS, crearCliente: cliente({ data: null }) })).toBe('solo-config')
  expect(await est({ soloConfig: false, vars: null, crearCliente: cliente({ data: null }) })).toBe('sin-env')
  expect(await est({ soloConfig: false, vars: { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' }, crearCliente: cliente({ data: null }) })).toBe('sin-llaves')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: async () => { throw new Error('Invalid supabaseUrl') } })).toBe('url-invalida')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente(() => { throw new Error('fetch failed') }) })).toBe('error')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: null, error: { code: 'PGRST205', message: 'no table' } }) })).toBe('sin-tabla')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: null, error: { code: '42P01', message: 'no table' } }) })).toBe('sin-tabla')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } }) })).toBe('error')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: null, error: null }) })).toBe('sin-fila')
  const ok = await leerSiteConfig({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: { data: { whatsapp: '5215512345678' } }, error: null }) })
  expect(ok).toEqual({ estado: 'ok', data: { whatsapp: '5215512345678' } })
  // Un `data` que no es objeto no se fusiona.
  expect((await leerSiteConfig({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: { data: [1] }, error: null }) })).data).toEqual({})
  // Respuestas malas que postgrest-js entrega «sin error» (404 vacío → 204, 404 con [] →
  // arreglo, 500 con null): NO son «nada publicado», son error (abortan).
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: null, error: null, status: 204 }) })).toBe('error')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: [], error: null, status: 200 }) })).toBe('error')
  expect(await est({ soloConfig: false, vars: VARS, crearCliente: cliente({ data: null, error: null, status: 500 }) })).toBe('error')
  // Sin la dependencia no se culpa a la URL.
  const sinDep = await leerSiteConfig({ soloConfig: false, vars: VARS, crearCliente: async () => { throw new Error("Cannot find package '@supabase/supabase-js'") } })
  expect(sinDep.estado).toBe('error')
  expect(sinDep.detalle).toContain('pnpm install')
  // La service role también sirve (la anon basta: site_config se lee en abierto).
  expect(await est({ soloConfig: false, vars: { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sr' }, crearCliente: cliente({ data: null }) })).toBe('sin-fila')
})

test('2. la política: sigue si leyó (o no hay nada publicado); aborta si no pudo leer; --solo-config avisa', () => {
  for (const e of ['ok', 'sin-fila', 'sin-tabla'] as const) {
    const p = politicaPublicado({ estado: e, data: {} })
    expect(p.abortar, e).toBeUndefined()
    expect(p.aviso, e).toBeUndefined()
    expect(p.log, e).toBeTruthy()
  }
  const solo = politicaPublicado({ estado: 'solo-config', data: {} })
  expect(solo.abortar).toBeUndefined()
  expect(solo.aviso).toContain('--solo-config')
  expect(solo.aviso).toContain('NO refleja lo publicado')
  for (const e of ['sin-env', 'sin-llaves', 'url-invalida', 'error'] as const) {
    const p = politicaPublicado({ estado: e, data: {}, detalle: 'x' })
    expect(p.abortar, e).toBeTruthy()
    expect(p.abortar!.ayuda).toContain('vercel env pull .env.local')
    expect(p.abortar!.ayuda).toContain('--solo-config')
  }
  expect(politicaPublicado({ estado: 'sin-env', data: {} }).abortar!.msg).toContain('Sin .env.local')
  // Un estado desconocido también aborta (falla cerrado).
  expect(politicaPublicado(undefined as never).abortar).toBeTruthy()
})

test('3. el generador: lee, aplica la política ANTES de fusionar, y fusiona con mergeSiteConfig', () => {
  const lectura = GEN.indexOf('const LECTURA_PUBLICADO = await leerSiteConfig({')
  const politica = GEN.indexOf('const pol = politicaPublicado(LECTURA_PUBLICADO)')
  const fusion = GEN.indexOf('const CONFIG = mergeSiteConfig(CONFIG_TS, PUBLICADO)')
  expect(lectura).toBeGreaterThan(0)
  expect(politica).toBeGreaterThan(lectura)
  expect(fusion).toBeGreaterThan(politica)
  expect(GEN).toContain('if (pol.abortar) abortar(pol.abortar.msg, pol.abortar.ayuda)')
  expect(GEN).toContain("soloConfig: flag('solo-config'),")
  // El hook del alias se carga ANTES de importar site-config-core.
  expect(GEN.indexOf("await import('./alias-src.mjs')")).toBeGreaterThan(0)
  expect(GEN.indexOf("await import('./alias-src.mjs')")).toBeLessThan(GEN.indexOf("'src/lib/site-config-core.ts'"))
  // Lo que se decide sobre el REPO sigue leyendo config.ts (si la escuela puede publicar licenciatura).
  expect(GEN).toContain('const PUEDE_PUBLICAR_LIC = bloqueLicEditable(CONFIG_TS.licenciaturas)')
  // Ya no hay una segunda lectura suelta de site_config.
  expect(GEN.match(/from\('site_config'\)/g)).toBeNull()
})

test('4. el logo: sin publicar, el de siempre; publicado, se descarga y si no baja va el de config.ts CON aviso', () => {
  const f = GEN.slice(GEN.indexOf('async function logoDelDocumento()'), GEN.indexOf('const LOGO_DATA = await logoDelDocumento()'))
  // Qué logo es el del banner: el que la fusión deja para fondo oscuro, contra el del repo.
  expect(f).toContain('const ref = CONFIG.logoOscuro || CONFIG.logo')
  expect(f).toContain('const refRepo = CONFIG_TS.logoOscuro || CONFIG_TS.logo')
  expect(f).toContain("const publicado = typeof ref === 'string' && ref !== refRepo && /^https?:\\/\\//i.test(ref)")
  // Sin publicar: EXACTAMENTE lo de antes de D12 (el oscuro de public/ o el claro).
  expect(f).toContain('if (!publicado) return CONFIG_TS.logoListo === false ? null : (b64(refRepo) || b64(CONFIG_TS.logo))')
  // Publicado: solo ESE se descarga (nada de caer al claro en silencio); si falla, aviso.
  expect(f.match(/await imagenData\(/g)?.length).toBe(1)
  expect(f).toContain('const bajado = await imagenData(ref)')
  expect(f).toMatch(/const deRepo[\s\S]*?\n  avisar\(`El logo publicado en el panel no se pudo descargar/)
  // Con tope de tiempo, igual que la lectura de site_config.
  expect(GEN).toContain('const res = await fetch(ref, { signal: AbortSignal.timeout(20000) })')
  expect(GEN).toContain('global: { fetch: (u, o = {}) => fetch(u, { ...o, signal: o.signal ?? AbortSignal.timeout(20000) }) },')
  const img = GEN.slice(GEN.indexOf('async function imagenData(ref)'))
  expect(img).toContain('if (!/^https?:\\/\\//i.test(ref)) return b64(ref)')
  expect(img).toContain('return /^image\\//.test(tipo)')
  expect(GEN).toContain('logoData: LOGO_DATA,')
})

test('5. el hook del alias y la fusión, en Node puro: el MISMO resultado que la app', () => {
  const raiz = process.cwd()
  const url = (p: string) => pathToFileURL(join(raiz, p)).href
  const publicado = {
    precios: { inscripcion: 650 },
    whatsapp: '5215512345678',
    tagline: 'Tu futuro empieza hoy / Estudia en línea',
    colores: { primario: '#123456' },
  }
  const codigo = `
    const { resolverAlias } = await import(${JSON.stringify(url('scripts/entrega/alias-src.mjs'))})
    const { CONFIG } = await import(${JSON.stringify(url('src/lib/config.ts'))})
    const { mergeSiteConfig } = await import(${JSON.stringify(url('src/lib/site-config-core.ts'))})
    const r = mergeSiteConfig(CONFIG, ${JSON.stringify(publicado)})
    console.log(JSON.stringify({
      alias: resolverAlias('@/lib/site-config-core'), noAlias: resolverAlias('react'), falta: resolverAlias('@/lib/no-existe'),
      r,
    }))`
  const salida = execFileSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', codigo], { cwd: raiz, encoding: 'utf8' })
  const o = JSON.parse(salida.trim().split('\n').pop()!)
  expect(o.alias).toBe(url('src/lib/site-config-core.ts'))
  expect(o.noAlias).toBeNull()
  expect(o.falta).toBeNull()
  // Lo publicado entra, y la fusión en Node puro es la de la app, campo por campo.
  expect(o.r.precios.inscripcion).toBe(650)
  expect(o.r.tagline).toBe(publicado.tagline)
  expect(o.r.colores.primario).toBe('#123456')
  expect(o.r).toEqual(JSON.parse(JSON.stringify(mergeSiteConfig(CONFIG, publicado as never))))
})
