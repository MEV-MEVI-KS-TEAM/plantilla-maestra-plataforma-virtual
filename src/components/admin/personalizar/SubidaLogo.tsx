'use client'

/**
 * Tarjeta de un logo (claro u oscuro).
 *
 * EL LOGO NO ES PARTE DEL BORRADOR. Sube y borra por su propia ruta
 * (/api/admin/configuracion/logo), que es la única que toca `logo` /
 * `logoOscuro`: el PUT del editor las ignora y repone las de la fila (ver el
 * encabezado de la API). Así dos pestañas abiertas no se pisan el logo. La
 * consecuencia para esta pantalla es que subir NO marca "cambios sin
 * publicar" — ya está publicado — y por eso se avisa en la tarjeta.
 *
 * Se previsualiza sobre fondo claro Y sobre fondo oscuro porque el logo se
 * pinta en los dos: cabecera clara de la landing y menú lateral oscuro. Un PNG
 * con letras negras sin variante oscura desaparece, y eso hay que verlo aquí y
 * no en producción.
 */
import { useRef, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import type { ConfigEditable } from '@/lib/site-config-validacion'
import type { SiteConfigOverrides } from '@/lib/site-config-core'
import { BORDE, FIELD_BG, ROJO, TXT, TXT_SUAVE, TXT_TENUE } from './Comunes'

/** Lo que la ruta de subida acepta a la entrada (después lo rasteriza). */
const ACEPTA = 'image/png,image/jpeg,image/webp,image/svg+xml'

/**
 * Los mismos límites que /api/admin/configuracion/logo, comprobados aquí antes
 * de gastar la subida. Un logo de 6 MB por una red de escuela tarda en irse
 * para volver con un 400 que ya se sabía: el mensaje es idéntico al del
 * servidor a propósito, para que el admin no distinga quién se lo dijo.
 *
 * NO sustituye a la validación del servidor, que además contrasta la FIRMA de
 * bytes: aquí solo se ve lo que declara el navegador.
 */
const MAX_BYTES = 2 * 1024 * 1024
const ERR_PESO = 'El logo pesa más de 2 MB'
const ERR_FORMATO = 'Formato no permitido (png, jpg, webp o svg)'

/** `image/jpg` es un alias frecuente; el servidor también lo acepta. */
const TIPOS_ACEPTADOS: ReadonlySet<string> = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml',
])

/** El motivo por el que este archivo ni se manda, o `null` si puede subir. */
function motivoRechazo(archivo: File): string | null {
  if (archivo.size > MAX_BYTES) return ERR_PESO
  // Un MIME VACÍO se deja pasar: hay navegadores y sistemas que no lo ponen, y
  // el servidor decide por los bytes en ese caso. Rechazarlo aquí bloquearía
  // logos que la API sí acepta.
  const tipo = (archivo.type ?? '').split(';')[0].trim().toLowerCase()
  if (tipo !== '' && !TIPOS_ACEPTADOS.has(tipo)) return ERR_FORMATO
  return null
}

/** Lo que devuelven POST y DELETE de /api/admin/configuracion/logo. */
export interface RespuestaLogo {
  merged: ConfigEditable
  /** La fila tal cual queda: de aquí sale si cada variante tiene override propio. */
  overrides: SiteConfigOverrides
}

export interface SubidaLogoProps {
  variante: 'claro' | 'oscuro'
  etiqueta: string
  ayuda: string
  /**
   * URL efectiva de esta variante (de `merged`, no del borrador). Llega YA
   * RESUELTA por el merge (`resolverLogos`): con solo el logo claro subido, la
   * variante oscura trae ese mismo logo. Es lo que se pinta, sin fallback.
   */
  url: string
  /** URL de fábrica: lo que se ve si no hay nada subido. */
  urlDefault: string
  /**
   * Si ESTA variante tiene override propio en la fila. No se deduce de `url`
   * (resuelta, coincidiría con la otra variante); lo decide el padre con
   * `estaSobrescrito(overrides, 'logo' | 'logoOscuro')`.
   */
  personalizado: boolean
  /**
   * Solo para la variante oscura: el logo claro resuelto (`merged.logo`). El
   * aviso "Ahora mismo se usa el logo principal." se muestra cuando la oscura
   * ES el claro de verdad — no basta con que no tenga override: un config.ts
   * de cliente puede traer su propia variante oscura de fábrica.
   */
  urlLogoClaro?: string
  nombre: string
  puedeEditar: boolean
  onLogo: (respuesta: RespuestaLogo) => void
  onMensaje: (texto: string, tipo: 'success' | 'error') => void
}

export function SubidaLogo({
  variante, etiqueta, ayuda, url, urlDefault, personalizado, urlLogoClaro, nombre,
  puedeEditar, onLogo, onMensaje,
}: SubidaLogoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  // Lo que se PINTA es lo resuelto; el default solo por si la fila trae algo
  // que el merge no pudo resolver (nunca debería).
  const mostrada = url || urlDefault

  async function subir(archivo: File) {
    const rechazo = motivoRechazo(archivo)
    if (rechazo) {
      onMensaje(rechazo, 'error')
      // Igual que tras una subida: sin esto, corregir el archivo y volver a
      // elegir EL MISMO nombre no dispara `change`.
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setOcupado(true)
    try {
      const cuerpo = new FormData()
      cuerpo.append('file', archivo)
      const res = await fetch(`/api/admin/configuracion/logo?variante=${variante}`, {
        method: 'POST',
        body: cuerpo,
      })
      const data = await res.json()
      if (!res.ok) {
        onMensaje(data.error ?? 'No se pudo subir el logo', 'error')
        return
      }
      onLogo({ merged: data.merged as ConfigEditable, overrides: (data.overrides ?? {}) as SiteConfigOverrides })
      onMensaje('Logo actualizado y publicado', 'success')
    } catch {
      onMensaje('No se pudo subir el logo', 'error')
    } finally {
      setOcupado(false)
      // Sin esto, volver a elegir EL MISMO archivo no dispara `change`.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function quitar() {
    setOcupado(true)
    try {
      const res = await fetch(`/api/admin/configuracion/logo?variante=${variante}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        onMensaje(data.error ?? 'No se pudo quitar el logo', 'error')
        return
      }
      onLogo({ merged: data.merged as ConfigEditable, overrides: (data.overrides ?? {}) as SiteConfigOverrides })
      onMensaje('Logo restaurado al original', 'success')
    } catch {
      onMensaje('No se pudo quitar el logo', 'error')
    } finally {
      setOcupado(false)
      setConfirmando(false)
    }
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={FIELD_BG}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: TXT }}>{etiqueta}</p>
        {personalizado && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
            Personalizado
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { fondo: '#FFFFFF', pie: 'Sobre fondo claro' },
          { fondo: '#0B0B0F', pie: 'Sobre fondo oscuro' },
        ].map(({ fondo, pie }) => (
          <div key={pie}>
            <div
              className="h-20 rounded-lg flex items-center justify-center p-3"
              style={{ background: fondo, border: `1px solid ${BORDE}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mostrada}
                alt={`Logo ${etiqueta.toLowerCase()} de ${nombre}`}
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <p className="text-[11px] mt-1 text-center" style={{ color: TXT_TENUE }}>{pie}</p>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: TXT_TENUE }}>{ayuda}</p>
      {variante === 'oscuro' && !personalizado && urlLogoClaro !== undefined && url === urlLogoClaro && (
        <p className="text-xs" style={{ color: TXT_TENUE }}>
          Ahora mismo se usa el logo principal.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACEPTA}
        className="hidden"
        aria-label={`Subir ${etiqueta.toLowerCase()}`}
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) void subir(archivo)
        }}
      />

      {confirmando ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: TXT_SUAVE }}>¿Quitar este logo?</span>
          <button
            type="button" onClick={() => void quitar()} disabled={ocupado}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
            style={{ background: ROJO, color: '#FFFFFF' }}
          >
            Sí, quitar
          </button>
          <button
            type="button" onClick={() => setConfirmando(false)} disabled={ocupado}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ border: `1px solid ${BORDE}`, color: TXT_SUAVE }}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!puedeEditar || ocupado}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-acento)', color: 'var(--color-texto-sobre-acento)' }}
          >
            {ocupado ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
            Subir
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            disabled={!puedeEditar || ocupado || !personalizado}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: `1px solid ${BORDE}`, color: TXT_SUAVE }}
            title={personalizado ? 'Volver al logo original' : 'Ya está el logo original'}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Quitar
          </button>
          <span className="text-[11px]" style={{ color: TXT_TENUE }}>
            El logo se publica al subirlo.
          </span>
        </div>
      )}
    </div>
  )
}
