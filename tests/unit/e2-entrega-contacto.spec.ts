import { test, expect } from '@playwright/test'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { construirHTML } from '../../scripts/entrega/documento.mjs'
import { leerEnvLocal, urlSupabaseDesdeEnv, rutaEnvLocal } from '../../scripts/entrega/env-local.mjs'

/**
 * Bloque E2 en la entrega (pnpm entrega):
 *  - el correo PÚBLICO de la escuela (el que ven alumnos y landing) sale en el
 *    PDF y en el mensaje, con lo publicado encima; el de fábrica no;
 *  - #165-A: sin certificación, la licenciatura dice «Titulación», no
 *    «Certificación profesional»;
 *  - #197: una sola lectura del .env.local, que aguanta CRLF y BOM también para
 *    la página de Infraestructura;
 *  - #256: un aborto después de leer site_config sale con código 1, sin
 *    process.exit con una conexión abierta.
 */

const leer = (p: string) => readFileSync(p, 'utf8')

function documento(extra: object) {
  return construirHTML({
    nombre: 'Escuela E', nombreCompleto: 'ESCUELA E', marcaEncabezado: '<b>Escuela E</b>',
    tagline: '', taglineCierre: '', colores: { primario: '#1B2F6E', acento: '#1B2F6E' },
    url: 'https://escuela-e.online', adminNombre: 'Dir', adminEmail: 'admin@escuela-e.test', adminPassword: 'x',
    contenido: [], incluye: ['Programa'], frasePrograma: 'tu escuela en línea', fraseIntro: '', frasePrecios: '',
    notaPrecios: '', preciosCols: ['Concepto'], preciosFilas: [], funcionalidad: [], modalidadesCols: ['Modalidad'],
    modalidadesFilas: [], notaModalidades: '', cursosPublicados: 0, validez: false,
    soporte: { horario: '', respuesta: '', canal: '' }, tutoriales: [], primerosPasos: [],
    palabraInstitucion: 'escuela', logoData: null, isotipoData: null, infra: null,
    fuentes: { tituloCSS: 'serif', cuerpoCSS: 'sans-serif', link: '' }, licenciaturas: { activas: false },
    ...extra,
  })
}

test('el PDF dice el correo público de la escuela, aparte del usuario administrador', () => {
  const html = documento({ whatsappDisplay: '55 1122 3344', correoPublico: 'informes@escuela-e.test' })
  expect(html).toContain('Correo de contacto')
  expect(html).toContain('informes@escuela-e.test')
  expect(html).toContain('admin@escuela-e.test')
  expect(documento({})).not.toContain('Correo de contacto')
})

test('el generador toma el correo por el camino de la app, con lo publicado, y no el de fábrica', () => {
  const g = leer('scripts/entrega/generar-entrega.mjs')
  const bloque = g.slice(g.indexOf('const CORREO_PUBLICO = '), g.indexOf('})()', g.indexOf('const CORREO_PUBLICO = ')))
  // CONFIG es la fusión con lo publicado (mergeSiteConfig), no CONFIG_TS.
  expect(bloque).toContain('CONFIG.contactoEmail || CONFIG.email')
  expect(bloque).not.toContain('CONFIG_TS')
  expect(bloque).toMatch(/@mev\\\.com\$/)
  expect(g.indexOf('const CORREO_PUBLICO = ')).toBeGreaterThan(g.indexOf('const CONFIG = mergeSiteConfig(CONFIG_TS, PUBLICADO)'))
  expect(g).toContain('correoPublico: CORREO_PUBLICO,')
  // El mensaje de WhatsApp también lo dice, junto al WhatsApp que ven los alumnos.
  const wa = g.slice(g.indexOf("L.push('📞 ASÍ TE CONTACTAN TUS ALUMNOS')") - 200, g.indexOf("L.push('💳 TUS PRECIOS"))
  expect(wa).toContain('if (CORREO_PUBLICO) L.push(`Correo: ${CORREO_PUBLICO}`)')
  expect(wa).toContain('datos.whatsappDisplay')
})

test('#165-A: sin certificación, la licenciatura dice «Titulación»', () => {
  const lic = {
    activas: true, inscripcion: 1500, certificacion: 38000,
    carreras: [{ slug: 'derecho', nombre: 'Licenciatura en Derecho', cuatrimestres: 8, totalMaterias: 32, tipo: 'licenciatura' }],
    modalidades: [], titulacionIncluida: true,
  }
  const sin = documento({ licenciaturas: lic, certifica: false })
  expect(sin).not.toMatch(/certificaci/i)
  expect(sin).toContain('<td>Titulación</td>')
  // Con certificación (o sin la clave) sale como siempre.
  expect(documento({ licenciaturas: lic, certifica: true })).toContain('Certificación profesional')
  expect(documento({ licenciaturas: lic })).toContain('Certificación profesional')
})

test('#197: una sola lectura del .env.local, con CRLF y BOM, también para Infraestructura', () => {
  const dir = mkdtempSync(join(tmpdir(), 'e2-env-'))
  try {
    writeFileSync(join(dir, '.env.local'),
      '\uFEFFNEXT_PUBLIC_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co"\r\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=anon\r\n  SUPABASE_SERVICE_ROLE_KEY = serv \r\n')
    const vars = leerEnvLocal(dir) as Record<string, string>
    expect(vars.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abcdefghijklmnopqrst.supabase.co')
    expect(vars.SUPABASE_SERVICE_ROLE_KEY).toBe('serv')
    expect(urlSupabaseDesdeEnv(dir)).toBe('https://abcdefghijklmnopqrst.supabase.co')
    expect(leerEnvLocal(join(dir, 'no-existe'))).toBeNull()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  const g = leer('scripts/entrega/generar-entrega.mjs')
  // Ninguna lectura propia del .env.local fuera del módulo.
  expect(g).not.toMatch(/readFileSync\(env/)
  expect(g).toContain('return urlSupabaseDe(RAIZ)')
  expect(g).toContain('return leerEnvLocalDe(RAIZ)')
})

test('ENTREGA_ENV_LOCAL cambia el archivo que se lee (para probar sin tocar el repo)', () => {
  const antes = process.env.ENTREGA_ENV_LOCAL
  process.env.ENTREGA_ENV_LOCAL = '/tmp/otro.env'
  try {
    expect(rutaEnvLocal('/repo')).toBe('/tmp/otro.env')
  } finally {
    if (antes === undefined) delete process.env.ENTREGA_ENV_LOCAL
    else process.env.ENTREGA_ENV_LOCAL = antes
  }
})

test('#256: abortar ya no llama a process.exit; el aborto tras leer site_config sale con 1', async () => {
  const g = leer('scripts/entrega/generar-entrega.mjs')
  const ab = g.slice(g.indexOf('const abortar = '), g.indexOf('\n}', g.indexOf('const abortar = ')) + 2)
  expect(ab).not.toMatch(/process\.exit\(/)
  expect(ab).toContain('process.exitCode = 1')
  expect(ab).toContain('throw new AbortoEntrega(msg)')

  // De verdad: un Supabase falso publica OTRA escuela → se aborta DESPUÉS del
  // fetch (conexión keep-alive abierta), por el nombre publicado.
  const srv = http.createServer((_q, r) => {
    r.writeHead(200, { 'content-type': 'application/json', connection: 'keep-alive' })
    r.end(JSON.stringify({ data: { nombre: 'Otra Escuela', nombreCompleto: 'Otra Escuela Distinta' } }))
  })
  await new Promise<void>(res => srv.listen(0, '127.0.0.1', () => res()))
  const dir = mkdtempSync(join(tmpdir(), 'e2-256-'))
  try {
    const env = join(dir, 'env.local')
    const { port } = srv.address() as { port: number }
    writeFileSync(env, `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${port}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=anon\n`)
    const corrida = await new Promise<{ code: number | null; err: string }>((res) => {
      const hijo = spawn(process.execPath, ['scripts/entrega/generar-entrega.mjs'],
        { cwd: process.cwd(), env: { ...process.env, ENTREGA_ENV_LOCAL: env } })
      let err = ''
      hijo.stderr.on('data', d => { err += d })
      hijo.stdout.on('data', () => {})
      hijo.on('close', code => res({ code, err }))
    })
    expect(corrida.code).toBe(1)
    expect(corrida.err).toContain('no es de esta escuela')
    expect(corrida.err).not.toContain('Assertion failed')
    expect(corrida.err).not.toContain('AbortoEntrega')
  } finally {
    srv.close()
    rmSync(dir, { recursive: true, force: true })
  }
})
