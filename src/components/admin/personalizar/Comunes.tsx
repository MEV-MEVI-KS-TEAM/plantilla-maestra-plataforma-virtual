'use client'

/**
 * "Personalizar mi página" (F5) — piezas compartidas del editor.
 *
 * Estilos, tipos y microcomponentes que usan las cinco pestañas. Vive aparte
 * para que ninguna pestaña tenga que importar a otra solo por una constante de
 * color (y para que cambiar el lenguaje visual del módulo sea un archivo, no
 * once).
 *
 * LENGUAJE VISUAL. Tarjetas oscuras sobre el fondo claro del panel: es lo que
 * ya hacía la pantalla de "Configuración" que este editor reemplaza y lo que
 * usa el resto del admin. No se inventa un tema nuevo aquí.
 */
import type { CSSProperties, ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import type { SiteConfigOverrides } from '@/lib/site-config-core'
import type { ConfigEditable } from '@/lib/site-config-validacion'

// ─── Paleta del propio editor (no es la del cliente) ────────────────────────

export const CARD: CSSProperties = { background: '#181C26', border: '1px solid #2A2F3E' }
export const FIELD_BG: CSSProperties = { background: '#0D1017', border: '1px solid #2A2F3E' }
/** Mismo input que el card "Cambiar Contraseña" de alumno/perfil. */
export const INPUT_STYLE: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#F1F5F9',
}

export const TXT = '#F1F5F9'
export const TXT_SUAVE = '#94A3B8'
export const TXT_TENUE = '#64748B'
export const BORDE = '#2A2F3E'
export const ROJO = '#EF4444'
export const AMBAR = '#F59E0B'

/** Botón de acción principal, con los colores de la escuela. */
export const BOTON_PRIMARIO: CSSProperties = {
  background: 'var(--color-acento)',
  color: 'var(--color-texto-sobre-acento)',
}

export const BOTON_SECUNDARIO: CSSProperties = {
  background: 'transparent',
  border: '1px solid #2A2F3E',
  color: TXT_SUAVE,
}

// ─── Tipos compartidos ───────────────────────────────────────────────────────

/** Actualiza el borrador de overrides. Siempre con función: el admin teclea rápido. */
export type Actualizar = (fn: (prev: SiteConfigOverrides) => SiteConfigOverrides) => void

export interface PropsPestana {
  /** Config de fábrica del cliente. Es el fallback de todo campo sin override. */
  defaults: ConfigEditable
  /** Borrador: lo que el admin lleva cambiado y aún no publica. */
  overrides: SiteConfigOverrides
  actualizar: Actualizar
  puedeEditar: boolean
  /** Clave que el servidor rechazó en el último PUT, para resaltarla. */
  claveConError: string | null
}

// ─── Utilidades de la interfaz ───────────────────────────────────────────────

/**
 * Id del control de una clave. Tiene que ser DETERMINISTA: cuando el servidor
 * devuelve un 400 con `clave`, la página cambia de pestaña y hace
 * `getElementById(idDeCampo(clave))?.focus()` para llevar al admin al campo
 * exacto en vez de dejarlo buscando el error.
 */
export function idDeCampo(clave: string): string {
  return `pmp-${clave.replace(/[^A-Za-z0-9]+/g, '-')}`
}

// ─── Microcomponentes ────────────────────────────────────────────────────────

export function Tarjeta({
  titulo,
  icono,
  descripcion,
  children,
}: {
  titulo: string
  icono?: ReactNode
  descripcion?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl p-5 space-y-4" style={CARD}>
      <div>
        <div className="flex items-center gap-2">
          {icono}
          <h3 className="text-sm font-semibold" style={{ color: TXT }}>{titulo}</h3>
        </div>
        {descripcion && (
          <p className="text-xs mt-1" style={{ color: TXT_TENUE }}>{descripcion}</p>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * "Restaurar" de un campo: quita el override y el valor vuelve al de fábrica.
 * Solo aparece cuando hay algo que restaurar, para que la pantalla no se llene
 * de botones que no hacen nada.
 */
export function BotonRestaurar({ onClick, etiqueta }: { onClick: () => void; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-colors"
      style={{ color: TXT_TENUE, border: `1px solid ${BORDE}` }}
      title="Volver al valor original"
      aria-label={`Restaurar ${etiqueta}`}
    >
      <RotateCcw className="w-3 h-3" aria-hidden="true" />
      Restaurar
    </button>
  )
}

/** Contador n/max. Se pone ámbar al acercarse al límite y rojo al pasarse. */
export function Contador({ largo, max }: { largo: number; max: number }) {
  const color = largo > max ? ROJO : largo > max * 0.9 ? AMBAR : TXT_TENUE
  return (
    <span className="text-xs tabular-nums" style={{ color }}>
      {largo}/{max}
    </span>
  )
}

export function Ayuda({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed" style={{ color: TXT_TENUE }}>{children}</p>
}

/** Aviso en caja (info / advertencia). */
export function Aviso({
  tono = 'info',
  children,
}: {
  tono?: 'info' | 'alerta'
  children: ReactNode
}) {
  const estilo =
    tono === 'alerta'
      ? { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }
      : { background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.2)' }
  return (
    <div className="px-4 py-3 rounded-xl text-xs leading-relaxed" style={{ ...estilo, color: TXT_SUAVE }}>
      {children}
    </div>
  )
}

/**
 * Realce de foco de los inputs, el mismo del resto del admin.
 *
 * Se genera con el estado del campo porque al soltar el foco hay que devolver
 * el borde que le toca: el normal, o el ROJO del campo que el servidor acaba
 * de rechazar. Con un handler fijo, enfocar y salir de un campo con error
 * borraría la única pista de dónde está el problema.
 */
export function focoHandlers(resaltado: boolean) {
  const bordeBase = resaltado ? `1px solid ${ROJO}` : '1px solid rgba(255,255,255,0.1)'
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.border = '1px solid rgba(21,101,192,0.6)'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21,101,192,0.1)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.border = bordeBase
      e.currentTarget.style.boxShadow = 'none'
    },
  }
}
