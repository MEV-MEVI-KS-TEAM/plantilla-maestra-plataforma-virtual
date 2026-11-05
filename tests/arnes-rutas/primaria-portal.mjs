/**
 * Primaria: lo que VE cada combo. Pinta con React las páginas reales (portadas, login,
 * registro, legales, constancia, documentos) y devuelve el HTML:
 *
 *   node tests/arnes-rutas/primaria-portal.mjs apagado|mixto|mixto-sec|solo|sin-cifras [con-validez]  → JSON
 *
 * Un proceso por combo: varias páginas calculan constantes al cargar (como en un build
 * de verdad), así que CONFIG se fija ANTES de importarlas y no cambia.
 *
 * `ARNES_RAIZ=<otro árbol>` pinta el mismo combo con otro código: con `apagado` sobre
 * main, el HTML de cada página tiene que salir igual byte a byte.
 */
import './hooks.mjs'
import './hooks-portal.mjs'
import { RAIZ } from './hooks.mjs'
import { crearEscenario } from './supabase-falso.mjs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const imp = (rel) => import(pathToFileURL(path.join(RAIZ, rel)).href)
const combo = process.argv[2] ?? 'apagado'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-del-arnes'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk-del-arnes'

const { CONFIG } = await imp('src/lib/config.ts')
const cfg = CONFIG

// CCT puesto a propósito: en Primaria no debe salir.
cfg.cct = 'CCT-DE-PRUEBA'
if (process.argv[3] === 'con-validez') cfg.landing.validezOficial = { ...cfg.landing.validezOficial, activa: true }
if (combo !== 'apagado') {
  // La suya distinta de la general: una tarjeta con la de otro nivel se nota.
  cfg.primaria = { ...cfg.primaria, activa: true, inscripcion: 450, certificacion: 3000 }
}
if (combo === 'mixto') cfg.niveles = ['primaria', 'secundaria', 'preparatoria']
if (combo === 'mixto-sec') cfg.niveles = ['primaria', 'secundaria']
if (combo === 'sin-cifras') {
  cfg.niveles = ['primaria', 'secundaria', 'preparatoria']
  cfg.primaria = { ...cfg.primaria, inscripcion: 0, certificacion: 0 }
}
if (combo === 'solo') {
  cfg.niveles = ['primaria']
  cfg.modalidades = cfg.modalidades.map((m) => ({ ...m, activa: false }))
}

globalThis.__arnes = crearEscenario({ bd: { site_config: [] }, auth: [], actorId: null })

const { renderToStaticMarkup } = await imp('node_modules/react-dom/server.node.js').catch(() => imp('node_modules/react-dom/server.js'))
const { createElement } = await import('react')
const { mergeSiteConfig, toLandingConfig } = await imp('src/lib/site-config-core.ts')

const pintar = (Componente, props = {}, estados = null) => {
  globalThis.__estados = estados ? [...estados] : null
  try {
    return renderToStaticMarkup(createElement(Componente, props))
  } finally {
    globalThis.__estados = null
  }
}

const errores = []
console.error = (...a) => errores.push(a.map(String).join(' '))
console.warn = () => {}

const salida = { combo }
const landingConfig = toLandingConfig(mergeSiteConfig(cfg, {}))
const { LandingAnimada } = await imp('src/components/landing/animada/LandingAnimada.tsx')
const { LandingClient } = await imp('src/components/landing/LandingClient.tsx')
salida.animada = pintar(LandingAnimada, { catalogo: [], config: landingConfig })
salida.clasica = pintar(LandingClient, { catalogo: [], config: landingConfig })

const login = await imp('src/app/(auth)/login/page.tsx')
const registro = await imp('src/app/(auth)/register/page.tsx')
salida.login = pintar(login.default)
salida.registro = pintar(registro.default)

// Los legales son Server Components asíncronos: se espera el árbol y se pinta.
const aviso = await imp('src/app/(legal)/aviso-de-privacidad/page.tsx')
const terminos = await imp('src/app/(legal)/terminos-y-condiciones/page.tsx')
salida.aviso = renderToStaticMarkup(await aviso.default())
salida.terminos = renderToStaticMarkup(await terminos.default())

// Constancia: [datos, loading, error]. Lo que la API le manda a un alumno.
const constancia = await imp('src/app/(dashboard)/alumno/constancia/page.tsx')
const datosConstancia = (nivel) => ({
  nombre_completo: 'Ana Prueba', nombre: 'Ana', apellidos: 'Prueba', matricula: 'QA-2026-0001', nivel, carrera: null,
  plan_nombre: 'Programa', meses_desbloqueados: 1, duracion_meses: 3, porcentaje_avance: 33, folio: 'F-1',
  materias_cursadas: [{ materia_id: 'm', codigo: 'X', nombre_materia: 'Materia', mes_numero: 1, estado: 'Pendiente' }],
})
salida.constanciaPrimaria = pintar(constancia.default, {}, [datosConstancia('primaria'), false, null])
salida.constanciaSecundaria = pintar(constancia.default, {}, [datosConstancia('secundaria'), false, null])

// Documentos del alumno: [toasts de useToast, documentos, planNombre, loading, uploading].
const docsAlumno = await imp('src/app/(dashboard)/alumno/documentos/page.tsx')
salida.documentosPrimaria = pintar(docsAlumno.default, {}, [[], [], 'Primaria', false, null])
salida.documentosSecundaria = pintar(docsAlumno.default, {}, [[], [], 'Secundaria', false, null])
salida.documentosPreparatoria = pintar(docsAlumno.default, {}, [[], [], 'Preparatoria', false, null])

// El filtro de tipos del panel: [documentos, loading, ...].
const docsAdmin = await imp('src/app/(dashboard)/admin/documentos/page.tsx')
salida.adminDocumentos = pintar(docsAdmin.default, {}, [[], false, null])

const avance = await imp('src/components/alumno/ReadingProgress.tsx')
// Con `ARNES_RAIZ` se corre también sobre main, que no los tiene, para comparar el HTML.
salida.mensajesAvance = avance.mensajesDeAvance?.('es', false) ?? []

salida.errores = errores
process.stdout.write(JSON.stringify(salida))
