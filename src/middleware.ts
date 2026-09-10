import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // `api/health` queda FUERA del matcher a proposito. El middleware redirige a
  // /login todo lo que no este en `publicRoutes`, asi que sin esta exclusion la
  // sonda de vida devolveria 200 con el HTML del login en vez de su JSON — el
  // monitor la leeria como "el cliente no tiene el endpoint" y la sonda seria
  // invisible. Ademas, saltarse el middleware le ahorra a cada sondeo la llamada
  // de red de `auth.getUser()`, que es justo lo que una ruta de salud publica y
  // consultada a diario no debe pagar.
  //
  // 🐞 La lista de extensiones solo traía imágenes, así que cualquier otro
  // archivo estático servido desde `public/` se tomaba por una ruta de la app:
  // el middleware no lo encontraba en `publicRoutes` y respondía 307 a /login.
  // Se vio en SÉNDERI con un video de ambiente (`/nodos-albor.mp4`) y con una
  // demo interactiva en HTML embebida por iframe (`/demo/impulso-01.html`), que
  // devolvían la pantalla de acceso en lugar del archivo. Afecta igual a
  // cualquier cliente que suba un PDF, una fuente propia, un `robots.txt` o un
  // `sitemap.xml`.
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|ogg|mp3|wav|pdf|html|txt|xml|woff|woff2|ttf)$).*)'],
}
