'use client'

/**
 * "Personalizar mi página" (F5) — el editor.
 *
 * El admin de cada escuela cambia aquí su logo, sus colores, sus textos y sus
 * precios, y se publican al instante: sin ticket, sin código y sin redeploy.
 * Es la pantalla que absorbe ~80 % de los tickets de soporte ("cámbiame el
 * logo", "sube el costo") y, de paso, el argumento de venta de la plataforma.
 *
 * CÓMO ESTÁ ARMADA
 *
 *   GET /api/admin/configuracion  →  defaults + overrides + merged
 *        defaults  = config.ts del cliente. Es el fallback de TODO campo sin
 *                    override y lo que se ve al pulsar "Restaurar".
 *        overrides = el BORRADOR editable (`overrides` en el estado). Es
 *                    exactamente lo que se manda de vuelta en el PUT.
 *        merged    = lo publicado. Aquí solo se usa para los LOGOS, que el PUT
 *                    no toca (los sube y borra su propia ruta).
 *
 * `dirty` compara el borrador con la copia tal como se cargó, con las claves
 * ordenadas (`mismoContenido`): sin eso, el mismo objeto en distinto orden de
 * inserción se leería como "cambios sin publicar" nada más abrir.
 *
 * ANTES DE MANDAR NADA se valida en el navegador con `validarOverrides`, LA
 * MISMA función que aplica el servidor. No es una comodidad: el 400 del
 * servidor devuelve un solo error, y sin prevalidación el admin descubre sus
 * cinco campos malos de uno en uno, con un viaje de red cada vez.
 *
 * SOLO LECTURA. El SECRETARIO entra (el layout deja pasar a staff) pero la API
 * le devuelve `puedeEditar: false`: se pinta todo deshabilitado y sin barra de
 * publicar. La seguridad la impone el servidor; esto solo evita que descubra
 * que no puede después de escribir media página.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { useToast, ToastContainer } from '@/components/ui/toast'
import type { SiteConfig, SiteConfigOverrides } from '@/lib/site-config-core'
import type { ConfigEditable } from '@/lib/site-config-validacion'
import { validarOverrides } from '@/lib/site-config-validacion'
import { SITE_CONFIG_SIN_MIGRAR } from '@/lib/site-config-errores'
import { campoPorClave } from '@/lib/site-config-campos'
import type { TokensColores } from '@/lib/site-config-paletas'
import {
  coloresEfectivos,
  hayCambiosDePrecio,
  mismoContenido,
  modalidadesEfectivas,
  prepararParaPublicar,
  sincronizarLogos,
  valorEfectivo,
} from '@/lib/site-config-editor'
import type { RespuestaLogo } from '@/components/admin/personalizar/SubidaLogo'
import { BarraPublicar } from '@/components/admin/personalizar/BarraPublicar'
import { ModalConfirmar } from '@/components/admin/personalizar/ModalConfirmar'
import { PestanaColores } from '@/components/admin/personalizar/PestanaColores'
import { PestanaCuenta } from '@/components/admin/personalizar/PestanaCuenta'
import { PestanaIdentidad } from '@/components/admin/personalizar/PestanaIdentidad'
import { PestanaPrecios } from '@/components/admin/personalizar/PestanaPrecios'
import { PestanaTextos } from '@/components/admin/personalizar/PestanaTextos'
import { VistaPrevia } from '@/components/admin/personalizar/VistaPrevia'
import {
  BORDE,
  TXT,
  TXT_SUAVE,
  TXT_TENUE,
  idDeCampo,
  type Actualizar,
} from '@/components/admin/personalizar/Comunes'

type IdPestana = 'identidad' | 'colores' | 'textos' | 'precios' | 'cuenta'

const PESTANAS: ReadonlyArray<{ id: IdPestana; etiqueta: string }> = [
  { id: 'identidad', etiqueta: 'Identidad' },
  { id: 'colores', etiqueta: 'Colores' },
  { id: 'textos', etiqueta: 'Textos de mi página' },
  { id: 'precios', etiqueta: 'Precios' },
  { id: 'cuenta', etiqueta: 'Cuenta' },
]

/** Texto EXACTO del modal de precios: se confirma lo que se va a mover. */
const CONFIRMA_PRECIOS =
  'Estos precios se actualizarán en tu página pública, en el registro de alumnos y en los montos sugeridos del sistema. ¿Confirmar?'

const CONFIRMA_RESTAURAR =
  'Se borrarán todos tus cambios y tu logo; tu página volverá al diseño de la plantilla. ¿Continuar?'

/**
 * En qué pestaña vive la clave que el servidor rechazó. Primero el catálogo
 * (que ya dice la sección de cada clave editable) y, si la clave es de las que
 * el validador compone al vuelo (`modalidades.3_meses`), por prefijo.
 */
function pestanaDeClave(clave: string): IdPestana {
  const seccion = campoPorClave(clave)?.seccion
  if (seccion === 'colores') return 'colores'
  if (seccion === 'landing') return 'textos'
  if (seccion === 'precios' || seccion === 'modalidades') return 'precios'
  if (seccion) return 'identidad'

  if (clave.startsWith('colores.')) return 'colores'
  if (clave.startsWith('landing.')) return 'textos'
  if (clave.startsWith('precios.') || clave.startsWith('modalidades')) return 'precios'
  return 'identidad'
}

export default function PersonalizarPage() {
  const { toasts, showToast, removeToast } = useToast()

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  /**
   * `codigo` del cuerpo de error, cuando la API lo manda. Hoy solo existe uno,
   * `SITE_CONFIG_SIN_MIGRAR` (503): el cliente todavía no corrió la migración
   * de F1. Se guarda aparte del mensaje para poder dar la instrucción exacta en
   * vez del "avisa a soporte" genérico — que en este caso es un rodeo, porque
   * lo que hay que hacer cabe en una línea.
   */
  const [codigoError, setCodigoError] = useState<string | null>(null)
  const [defaults, setDefaults] = useState<ConfigEditable | null>(null)
  const [merged, setMerged] = useState<ConfigEditable | null>(null)
  const [overrides, setOverrides] = useState<SiteConfigOverrides>({})
  /** Los overrides tal como se cargaron (o como quedaron al publicar). */
  const [overridesBase, setOverridesBase] = useState<SiteConfigOverrides>({})
  const [puedeEditar, setPuedeEditar] = useState(false)

  const [pestana, setPestana] = useState<IdPestana>('identidad')
  /**
   * Acordeón "Ajustes avanzados" de la pestaña de Colores. Vive AQUÍ y no en
   * la pestaña porque cambiar de pestaña desmonta el componente: si el estado
   * fuera suyo, el 400 de un `colores.*` traería al admin a la pestaña con el
   * acordeón otra vez cerrado y sin nada resaltado que ver.
   */
  const [avanzado, setAvanzado] = useState(false)
  const [claveConError, setClaveConError] = useState<string | null>(null)
  const [publicando, setPublicando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [publicado, setPublicado] = useState(false)
  const [modal, setModal] = useState<null | 'precios' | 'restaurar'>(null)

  const dirty = !mismoContenido(overrides, overridesBase)
  // La barra fija tapa el final del formulario; el padding se reserva aquí y
  // no en el layout, que es común a todo el admin.
  const espacioBarra = puedeEditar ? 'pb-24' : 'pb-6'

  // ─── Carga ─────────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/configuracion')
      // El cuerpo manda: la API explica QUÉ falla (p. ej. el 503 de la tabla
      // sin migrar). `catch` por si la respuesta ni siquiera es JSON — un 502
      // del borde no lo es — para no perder el motivo real en un TypeError.
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        setErrorCarga(
          typeof data.error === 'string' ? data.error : 'No se pudo cargar la configuración',
        )
        setCodigoError(typeof data.codigo === 'string' ? data.codigo : null)
        return
      }
      setDefaults(data.defaults as ConfigEditable)
      setMerged(data.merged as ConfigEditable)
      setOverrides(data.overrides as SiteConfigOverrides)
      setOverridesBase(data.overrides as SiteConfigOverrides)
      setPuedeEditar(Boolean(data.puedeEditar))
    } catch {
      setErrorCarga('No se pudo cargar la configuración')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  // Aviso del navegador al cerrar con cambios sin publicar. El borrador vive
  // solo en memoria: al recargar se pierde entero.
  useEffect(() => {
    if (!dirty) return
    function alSalir(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [dirty])

  // ─── Edición ───────────────────────────────────────────────────────────────

  /**
   * Único camino por el que las pestañas escriben en el borrador. Además de
   * guardar, APAGA el resalte rojo del campo que el servidor rechazó: si no,
   * el admin corrige lo que se le pidió y el campo se queda en rojo hasta el
   * siguiente intento de publicar, diciéndole que sigue mal.
   */
  const actualizar = useCallback<Actualizar>((fn) => {
    setOverrides(fn)
    setClaveConError((actual) => (actual === null ? actual : null))
  }, [])

  /**
   * Subir o quitar un logo ya escribió la fila (no pasa por "Publicar"). Se
   * toma el `merged` nuevo y se copian `logo` / `logoOscuro` de la fila al
   * borrador Y a su base, para que la tarjeta de cada variante sepa si tiene
   * override propio sin que cambie "cambios sin publicar".
   */
  const alCambiarLogo = useCallback(({ merged: m, overrides: fila }: RespuestaLogo) => {
    setMerged(m)
    setOverrides((prev) => sincronizarLogos(prev, fila))
    setOverridesBase((prev) => sincronizarLogos(prev, fila))
  }, [])

  // ─── Errores del servidor ──────────────────────────────────────────────────

  /** Lleva al admin al campo que falló: cambia de pestaña, enfoca y desplaza. */
  const irAlCampo = useCallback((clave: string) => {
    setClaveConError(clave)
    setPestana(pestanaDeClave(clave))
    // Los doce colores sueltos viven detrás de un acordeón cerrado: sin abrirlo
    // no hay control que enfocar ni borde rojo que ver, y el admin aterriza en
    // una pestaña que, aparentemente, no tiene ningún error.
    if (clave.startsWith('colores.')) setAvanzado(true)
    // En el siguiente frame: el control puede estar en una pestaña que aún no
    // se ha pintado.
    window.setTimeout(() => {
      const el = document.getElementById(idDeCampo(clave))
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el?.focus({ preventScroll: true })
    }, 0)
  }, [])

  // ─── Publicar ──────────────────────────────────────────────────────────────

  const publicar = useCallback(async () => {
    if (!defaults) return
    setModal(null)
    setPublicando(true)
    setClaveConError(null)
    try {
      const cuerpo = prepararParaPublicar(overrides)

      // Misma validación que el servidor, aquí para no gastar un viaje de red
      // por cada campo mal escrito. `defaults` es la config recortada a las
      // claves editables, que es todo lo que el validador consulta de la base
      // (los logos, lo único que necesitaría más, ya no viajan en el cuerpo).
      const previo = validarOverrides(cuerpo, defaults as unknown as SiteConfig)
      if (!previo.ok) {
        showToast(previo.error, 'error', 6000)
        if (previo.clave) irAlCampo(previo.clave)
        return
      }

      const res = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        // El `error` del cuerpo, tal cual: es el que dice si falló un campo, si
        // el cuerpo era enorme o si a este cliente le falta la migración (503).
        // Un texto genérico aquí obliga a mirar los logs para saberlo.
        showToast(
          typeof data.error === 'string' ? data.error : 'No se pudieron publicar los cambios',
          'error',
          6000,
        )
        if (data.clave) irAlCampo(String(data.clave))
        return
      }

      // La respuesta manda: trae los overrides ya limpios (texto con trim, hex
      // en mayúsculas, whatsappUrl derivada) y los logos repuestos de la fila.
      // Adoptarlos deja el borrador y lo publicado idénticos, que es lo que
      // apaga "cambios sin publicar".
      setMerged(data.merged as ConfigEditable)
      setOverrides(data.overrides as SiteConfigOverrides)
      setOverridesBase(data.overrides as SiteConfigOverrides)
      setPublicado(true)
      showToast('Cambios publicados. Pueden tardar unos segundos en verse.', 'success', 6000)
    } catch {
      showToast('No se pudieron publicar los cambios', 'error')
    } finally {
      setPublicando(false)
    }
  }, [defaults, overrides, showToast, irAlCampo])

  /**
   * Teclado del tablist, según el patrón ARIA de pestañas: las flechas mueven
   * la selección (Home/End a los extremos) y solo la pestaña activa está en el
   * orden de tabulación, así que Tab salta del tablist al formulario en vez de
   * recorrer las cinco pestañas una por una.
   */
  function alTeclearPestana(e: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    const salto = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    let destino: IdPestana | null = null
    if (salto !== 0) destino = PESTANAS[(indice + salto + PESTANAS.length) % PESTANAS.length].id
    else if (e.key === 'Home') destino = PESTANAS[0].id
    else if (e.key === 'End') destino = PESTANAS[PESTANAS.length - 1].id
    if (!destino) return

    e.preventDefault()
    setPestana(destino)
    // El botón ya está montado (las cinco pestañas se pintan siempre), así que
    // el foco puede moverse en el mismo evento.
    document.getElementById(`tab-${destino}`)?.focus()
  }

  function alPulsarPublicar() {
    if (hayCambiosDePrecio(overridesBase, overrides)) {
      setModal('precios')
      return
    }
    void publicar()
  }

  // ─── Restaurar todo ────────────────────────────────────────────────────────

  const restaurarTodo = useCallback(async () => {
    setModal(null)
    setRestaurando(true)
    try {
      const res = await fetch('/api/admin/configuracion', { method: 'DELETE' })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        showToast(
          typeof data.error === 'string' ? data.error : 'No se pudo restaurar el diseño',
          'error',
        )
        return
      }
      setMerged(data.merged as ConfigEditable)
      setOverrides({})
      setOverridesBase({})
      setClaveConError(null)
      setPublicado(true)
      showToast('Tu página volvió al diseño original', 'success')
    } catch {
      showToast('No se pudo restaurar el diseño', 'error')
    } finally {
      setRestaurando(false)
    }
  }, [showToast])

  // ─── Datos derivados para la vista previa ──────────────────────────────────

  const previa = useMemo(() => {
    if (!defaults || !merged) return null
    const txt = (ruta: string) => String(valorEfectivo(defaults, overrides, ruta) ?? '')
    const inscripcion = valorEfectivo(defaults, overrides, 'precios.inscripcion')
    return {
      colores: coloresEfectivos(defaults.colores as TokensColores, overrides),
      // El logo NO es parte del borrador: se publica al subirlo, así que la
      // vista previa enseña el publicado.
      logo: merged.logo,
      nombre: txt('nombre'),
      nombreCompleto: txt('nombreCompleto'),
      tagline: txt('tagline'),
      whatsapp: txt('whatsapp'),
      heroTitulo: txt('landing.hero_titulo'),
      heroHighlight: txt('landing.hero_highlight'),
      heroSubtitulo: txt('landing.hero_subtitulo'),
      heroCtaPrimario: txt('landing.hero_cta_primario'),
      inscripcion: typeof inscripcion === 'number' ? inscripcion : 0,
      modalidades: modalidadesEfectivas(defaults.modalidades, overrides.modalidades),
    }
  }, [defaults, merged, overrides])

  // ─── Render ────────────────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-acento)' }} />
      </div>
    )
  }

  if (errorCarga || !defaults || !merged || !previa) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 min-h-[400px] text-center px-4">
        <p className="text-sm" style={{ color: '#EF4444' }}>{errorCarga ?? 'Error al cargar'}</p>
        <p className="text-xs text-gray-500">
          {codigoError === SITE_CONFIG_SIN_MIGRAR
            ? 'Es un paso pendiente del despliegue, no una falla: hay que correr esa migración en la base de datos de esta escuela (conexión directa, puerto 5432) y volver a entrar.'
            : 'Si el problema sigue, avisa a soporte: la personalización necesita la última versión de la base de datos.'}
        </p>
      </div>
    )
  }

  const propsPestana = { defaults, overrides, actualizar, puedeEditar, claveConError }

  return (
    <div className={espacioBarra}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Personalizar mi página</h2>
        <p className="text-sm mt-0.5 text-gray-500">
          Tu logo, colores, textos y precios; se publican al instante sin tocar código.
        </p>
      </div>

      {!puedeEditar && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} aria-hidden="true" />
          <p className="text-xs leading-relaxed" style={{ color: TXT_SUAVE }}>
            <strong>Solo lectura:</strong> pide a un administrador que publique los cambios.
          </p>
        </div>
      )}

      {/* Pestañas */}
      <div
        role="tablist"
        aria-label="Secciones de personalización"
        className="flex gap-1 overflow-x-auto mb-5 pb-1"
        style={{ borderBottom: `1px solid ${BORDE}` }}
      >
        {PESTANAS.map((p, i) => {
          const activa = pestana === p.id
          return (
            <button
              key={p.id}
              role="tab"
              type="button"
              id={`tab-${p.id}`}
              aria-selected={activa}
              // Solo hay UN panel montado, el de la pestaña activa: apuntar a
              // `panel-precios` desde una pestaña inactiva sería una referencia
              // a un id que no existe, y el lector de pantalla la anuncia rota.
              aria-controls={activa ? `panel-${p.id}` : undefined}
              tabIndex={activa ? 0 : -1}
              onKeyDown={(e) => alTeclearPestana(e, i)}
              onClick={() => setPestana(p.id)}
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors"
              style={{
                color: activa ? TXT : TXT_TENUE,
                background: activa ? '#181C26' : 'transparent',
                borderBottom: activa ? '2px solid var(--color-acento)' : '2px solid transparent',
              }}
            >
              {p.etiqueta}
            </button>
          )
        })}
      </div>

      <div
        className={
          // La pestaña de Cuenta no lleva vista previa: sin ella, la columna
          // de 340 px dejaría un hueco a la derecha.
          pestana === 'cuenta'
            ? 'grid grid-cols-1 gap-5'
            : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5'
        }
      >
        {/* El PANEL VA PRIMERO EN EL DOM. Es lo que la pestaña acaba de abrir:
            quien navega con teclado o lector de pantalla tiene que llegar al
            formulario justo después del tablist, no a una vista previa que solo
            refleja lo que se escriba más abajo. El orden VISUAL no cambia: en
            móvil la previa se sube con `order` (primero se ve el efecto, luego
            se busca el control) y en escritorio la coloca su columna. */}
        <div
          role="tabpanel"
          id={`panel-${pestana}`}
          aria-labelledby={`tab-${pestana}`}
          className="min-w-0 lg:col-start-1 lg:row-start-1"
        >
          {pestana === 'identidad' && (
            <PestanaIdentidad
              {...propsPestana}
              merged={merged}
              onLogo={alCambiarLogo}
              onMensaje={showToast}
            />
          )}
          {pestana === 'colores' && (
            <PestanaColores {...propsPestana} avanzado={avanzado} onAvanzado={setAvanzado} />
          )}
          {pestana === 'textos' && <PestanaTextos {...propsPestana} />}
          {pestana === 'precios' && <PestanaPrecios {...propsPestana} />}
          {pestana === 'cuenta' && <PestanaCuenta puedeEditar={puedeEditar} onMensaje={showToast} />}
        </div>

        {pestana !== 'cuenta' && (
          <aside className="order-first lg:order-none lg:col-start-2 lg:row-start-1">
            <div
              className="rounded-xl p-4 lg:sticky lg:top-4"
              style={{ background: '#181C26', border: `1px solid ${BORDE}` }}
            >
              <VistaPrevia {...previa} />
            </div>
          </aside>
        )}
      </div>

      {puedeEditar && (
        <BarraPublicar
          dirty={dirty}
          publicando={publicando}
          restaurando={restaurando}
          publicado={publicado}
          onPublicar={alPulsarPublicar}
          onRestaurar={() => setModal('restaurar')}
        />
      )}

      <ModalConfirmar
        abierto={modal === 'precios'}
        titulo="Vas a cambiar precios"
        mensaje={CONFIRMA_PRECIOS}
        etiquetaConfirmar="Publicar cambios"
        ocupado={publicando}
        onConfirmar={() => void publicar()}
        onCancelar={() => setModal(null)}
      />

      <ModalConfirmar
        abierto={modal === 'restaurar'}
        titulo="Restaurar diseño original"
        mensaje={CONFIRMA_RESTAURAR}
        etiquetaConfirmar="Sí, restaurar"
        peligro
        ocupado={restaurando}
        onConfirmar={() => void restaurarTodo()}
        onCancelar={() => setModal(null)}
      />
    </div>
  )
}
