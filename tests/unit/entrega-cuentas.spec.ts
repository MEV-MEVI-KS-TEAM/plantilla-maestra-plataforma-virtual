import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { cuentasDeEntrega, secretosEn, nombresDeCuentas } from '../../scripts/entrega/cuentas.mjs'
import { infraestructura } from '../../scripts/entrega/documento.mjs'

/**
 * Las cuentas del cliente en el Documento de Entrega Oficial.
 *
 * Desde el 11-sep-2026 el PDF lleva el correo, la cuenta de Supabase y la de
 * GoDaddy con su contraseña: son del cliente, y sin ellas no puede renovar su
 * dominio ni entrar a su base de datos. Lo que protegen estas pruebas:
 *   - que cada cuenta salga en la página de Infraestructura, junto al servicio que abre;
 *   - que el access token, las llaves y la cadena de conexión NO lleguen nunca al
 *     papel, aunque alguien los pegue en entrega.local.json.
 */

// Valores FALSOS armados al correr: un token con forma real escrito en el repo
// lo marca el escáner de secretos.
const TOKEN = 'sbp_' + 'a1'.repeat(20)
const JWT = ['eyJhbGciOiJIUzI1NiJ9', 'eyJyb2xlIjoiYW5vbiJ9', 'firmafalsa'].join('.')
const CONEXION = 'postgresql://postgres:' + 'x'.repeat(12) + '@db.ejemplo.supabase.co:5432/postgres'

const CORREO = 'escuela@outlook.com'
const CLAVE_CORREO = 'Correo2026$Xy1!'
const CLAVE_CUENTAS = 'Cuentas_2026'

const cuentas = {
  correo: { email: CORREO, password: CLAVE_CORREO },
  supabase: { email: CORREO, password: CLAVE_CUENTAS },
  godaddy: { email: CORREO, password: CLAVE_CUENTAS },
}

const infra = {
  dominio: 'escuela.online',
  registrador: 'GoDaddy',
  dns: 'Apunta a Vercel, donde se aloja la plataforma',
  url: 'https://escuela.online',
  supabaseRef: 'abcdefghijklmnopqrst',
  supabaseUrl: 'https://abcdefghijklmnopqrst.supabase.co',
  supabaseDashboard: 'https://supabase.com/dashboard/project/abcdefghijklmnopqrst',
}

/** El HTML partido por encabezado: { 'Correo de tus cuentas': '…', 'Dominio': '…' }. */
function bloques(html: string) {
  return Object.fromEntries(
    html.split('<h3>').slice(1).map((b) => [b.slice(0, b.indexOf('</h3>')), b]),
  ) as Record<string, string>
}

test('las tres cuentas salen con su contraseña, cada una junto al servicio que abre', () => {
  const b = bloques(infraestructura({ infra, cuentas: cuentasDeEntrega(cuentas) }))
  expect(Object.keys(b)).toEqual(['Correo de tus cuentas', 'Dominio', 'Base de datos y usuarios (Supabase)'])

  expect(b['Correo de tus cuentas']).toContain(CORREO)
  expect(b['Correo de tus cuentas']).toContain(CLAVE_CORREO)
  expect(b['Correo de tus cuentas']).toContain('https://outlook.live.com')
  // El mismo correo abre las otras dos: el documento lo dice.
  expect(b['Correo de tus cuentas']).toContain('Supabase y GoDaddy')

  expect(b['Dominio']).toContain('Cuenta de GoDaddy')
  expect(b['Dominio']).toContain(CLAVE_CUENTAS)
  expect(b['Base de datos y usuarios (Supabase)']).toContain('Cuenta de Supabase')
  expect(b['Base de datos y usuarios (Supabase)']).toContain(CLAVE_CUENTAS)
})

test('sin cuentas, la página de Infraestructura dice lo mismo que antes', () => {
  const html = infraestructura({ infra })
  expect(html).not.toContain('Correo de tus cuentas')
  expect(html).not.toContain('Cuenta de')
  expect(html).not.toContain('Contraseña')
  expect(html).toContain('canal seguro')
})

test('las llaves de servicio y la contraseña de la BD siguen yendo por canal seguro', () => {
  const html = infraestructura({ infra, cuentas: cuentasDeEntrega(cuentas) })
  expect(html).toContain('se entregan por canal seguro')
})

test('con «infraestructura: false» las cuentas se entregan igual', () => {
  const b = bloques(infraestructura({ infra: null, registrador: 'GoDaddy', cuentas: cuentasDeEntrega(cuentas) }))
  expect(Object.keys(b)).toEqual(['Correo de tus cuentas', 'Dominio', 'Base de datos y usuarios (Supabase)'])
  expect(b['Dominio']).toContain('Cuenta de GoDaddy')
  expect(b['Dominio']).not.toContain('DNS')
})

test('el correo de un proveedor conocido dice dónde entrar; uno propio no se inventa', () => {
  expect(cuentasDeEntrega({ correo: { email: 'a@gmail.com', password: 'x' } })?.correo.acceso).toBe('https://mail.google.com')
  expect(cuentasDeEntrega({ correo: { email: 'a@escuela.mx', password: 'x' } })?.correo.acceso).toBeUndefined()
})

test('una cuenta vacía se omite y sin cuentas no hay nada que imprimir', () => {
  expect(cuentasDeEntrega(undefined)).toBeNull()
  expect(cuentasDeEntrega({ correo: { email: '', password: '' } })).toBeNull()
  expect(Object.keys(cuentasDeEntrega({ supabase: cuentas.supabase, godaddy: null }) ?? {})).toEqual(['supabase'])
})

test('una cuenta a medias, desconocida o con un campo de más aborta sin repetir el valor', () => {
  expect(() => cuentasDeEntrega({ supabase: { email: CORREO } })).toThrow(/a medias: falta password/)
  // Vercel no se entrega: el hosting se queda en MEV.
  expect(() => cuentasDeEntrega({ vercel: { email: CORREO, password: 'x' } })).toThrow(/no es una cuenta que vaya en la entrega/)
  let mensaje = ''
  try {
    cuentasDeEntrega({ supabase: { email: CORREO, password: CLAVE_CUENTAS, accessToken: TOKEN } })
  } catch (e) {
    mensaje = (e as Error).message
  }
  expect(mensaje).toContain('"accessToken"')
  expect(mensaje).not.toContain(TOKEN)
})

test('el token, un JWT o la cadena de conexión se detectan por forma en cualquier campo, sin repetir el valor', () => {
  const hallados = secretosEn({
    adminPassword: 'NormalYSegura_1',
    cuentas: { supabase: { email: CORREO, password: TOKEN } },
    notas: ['anon: ' + JWT],
    db: CONEXION,
  })
  expect(hallados).toHaveLength(3)
  const texto = hallados.join('\n')
  expect(texto).toContain('cuentas.supabase.password (access token de Supabase)')
  expect(texto).toContain('notas[0]')
  expect(texto).toContain('db (cadena de conexión')
  for (const s of [TOKEN, JWT, CONEXION]) expect(texto).not.toContain(s)
})

test('las contraseñas normales y el archivo de ejemplo no tienen forma de secreto', () => {
  expect(secretosEn(cuentas)).toEqual([])
  const ejemplo = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'entrega', 'entrega.local.ejemplo.json'), 'utf8'))
  expect(secretosEn(ejemplo)).toEqual([])
  // El ejemplo documenta las tres cuentas…
  expect(Object.keys(ejemplo.cuentas)).toEqual(['correo', 'supabase', 'godaddy'])
  // …pero copiado sin llenar no imprime puntos en lugar de contraseñas.
  expect(() => cuentasDeEntrega(ejemplo.cuentas)).toThrow(/marcador del ejemplo/)
})

test('el mensaje nombra las cuentas entregadas en una frase', () => {
  expect(nombresDeCuentas(cuentasDeEntrega(cuentas))).toBe('tu correo, Supabase y GoDaddy')
  expect(nombresDeCuentas(cuentasDeEntrega({ supabase: cuentas.supabase }))).toBe('Supabase')
  expect(nombresDeCuentas(null)).toBe('')
})
