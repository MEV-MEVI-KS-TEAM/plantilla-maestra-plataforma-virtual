import { test, expect } from '@playwright/test'
import { parseVideoUrl } from '@/lib/cursos/parse-video-url'

/**
 * Contenido HTML de la escuela dentro de una lección (TICKET-2026-09-28-13).
 *
 * Sénderi aloja sus lecciones en semillas.senderi.mx y quiere pegarlas en
 * «URL de video» como hace con YouTube. `parseVideoUrl` es la ÚNICA puerta al
 * iframe: si deja pasar un host ajeno, cualquier admin podría incrustar una
 * página de terceros dentro de la plataforma.
 */
const DOMINIOS = ['senderi.mx'] as const

test('una página del dominio de la escuela (o subdominio) se muestra como HTML', () => {
  const p = parseVideoUrl('https://semillas.senderi.mx/admc/a01/i01/', DOMINIOS)
  expect(p).toEqual({ provider: 'html', embedUrl: 'https://semillas.senderi.mx/admc/a01/i01/' })
  expect(parseVideoUrl('https://senderi.mx/leccion', DOMINIOS)?.provider).toBe('html')
  expect(parseVideoUrl('  https://SEMILLAS.Senderi.MX/a  ', DOMINIOS)?.provider).toBe('html')
})

test('sin dominios configurados NO hay contenido HTML (comportamiento de siempre)', () => {
  expect(parseVideoUrl('https://semillas.senderi.mx/admc/a01/i01/')).toBeNull()
  expect(parseVideoUrl('https://semillas.senderi.mx/admc/a01/i01/', [])).toBeNull()
})

test('hosts parecidos o ajenos NO pasan', () => {
  expect(parseVideoUrl('https://otrosenderi.mx/x', DOMINIOS)).toBeNull()
  expect(parseVideoUrl('https://senderi.mx.evil.com/x', DOMINIOS)).toBeNull()
  expect(parseVideoUrl('https://evil.com/senderi.mx', DOMINIOS)).toBeNull()
  expect(parseVideoUrl('https://evil.com/?u=https://senderi.mx', DOMINIOS)).toBeNull()
})

test('solo https, sin credenciales en la URL, y nunca javascript:/data:', () => {
  expect(parseVideoUrl('http://semillas.senderi.mx/a', DOMINIOS)).toBeNull()
  expect(parseVideoUrl('https://user:pw@semillas.senderi.mx/a', DOMINIOS)).toBeNull()
  expect(parseVideoUrl('javascript:alert(1)//senderi.mx', DOMINIOS)).toBeNull()
  expect(parseVideoUrl('data:text/html,<script>1</script>', DOMINIOS)).toBeNull()
})

test('los proveedores de video siguen ganando sobre el HTML', () => {
  expect(parseVideoUrl('https://youtu.be/Nyts_ereM4Y', DOMINIOS)?.provider).toBe('youtube')
  expect(parseVideoUrl('https://vimeo.com/123456789', DOMINIOS)?.provider).toBe('vimeo')
})
