'use client'

/**
 * Controles de texto y de entero del editor.
 *
 * Los dos comparten cabecera (etiqueta + contador + "Restaurar") y el mismo
 * contrato: el valor que se pinta es el EFECTIVO (override si lo hay, si no el
 * de fábrica) y `onChange` escribe siempre en el borrador de overrides. El
 * `placeholder` lleva el default, que es lo que se verá si el admin borra el
 * campo y pulsa "Restaurar".
 */
import { useEffect, useState } from 'react'
import {
  BotonRestaurar,
  Contador,
  INPUT_STYLE,
  ROJO,
  TXT_SUAVE,
  TXT_TENUE,
  focoHandlers,
  idDeCampo,
} from './Comunes'

interface Base {
  /** Ruta con puntos (`landing.hero_titulo`). Da el id del control. */
  clave: string
  etiqueta: string
  ayuda?: string
  deshabilitado?: boolean
  sobrescrito?: boolean
  /** El servidor rechazó este campo en el último intento de publicar. */
  resaltado?: boolean
  onRestaurar?: () => void
}

export interface CampoTextoProps extends Base {
  valor: string
  placeholder?: string
  /** Límite REAL del valor: lo que mide el contador y lo que valida el servidor. */
  max: number
  /**
   * `maxlength` del control cuando NO debe ser `max`. `null` lo quita del todo.
   *
   * Es para los campos que NORMALIZAN lo que se escribe (hoy solo el WhatsApp,
   * que se queda con los dígitos). El navegador corta al pegar, ANTES de que
   * `onChange` pueda normalizar: con `maxlength=13`, pegar '+5219991234567'
   * dejaba '+521999123456' y de ahí salía un número de 12 dígitos que encima
   * pasaba la validación. En esos campos el tope lo pone `onChange` y el
   * `maxlength` solo estorba — el valor pintado ya viene normalizado.
   */
  maxEntrada?: number | null
  multilinea?: boolean
  filas?: number
  tipo?: 'text' | 'email' | 'tel' | 'url'
  /** La ayuda en rojo: el valor de ahora no pasaría la validación al publicar. */
  ayudaEsError?: boolean
  onChange: (v: string) => void
}

function Cabecera({
  clave,
  etiqueta,
  derecha,
}: {
  clave: string
  etiqueta: string
  derecha?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={idDeCampo(clave)} className="text-sm font-medium" style={{ color: TXT_SUAVE }}>
        {etiqueta}
      </label>
      <div className="flex items-center gap-2">{derecha}</div>
    </div>
  )
}

export function CampoTexto({
  clave,
  etiqueta,
  ayuda,
  valor,
  placeholder,
  max,
  maxEntrada,
  multilinea = false,
  filas = 3,
  tipo = 'text',
  ayudaEsError = false,
  deshabilitado = false,
  sobrescrito = false,
  resaltado = false,
  onChange,
  onRestaurar,
}: CampoTextoProps) {
  const id = idDeCampo(clave)
  // El contador mide SIEMPRE el valor que se va a publicar contra su límite
  // real (`max`): 13 dígitos de WhatsApp, no los caracteres que se pegaron.
  const topeEntrada: number | undefined = maxEntrada === undefined ? max : (maxEntrada ?? undefined)
  const marcado = resaltado || ayudaEsError
  const estilo = {
    ...INPUT_STYLE,
    ...(marcado ? { border: `1px solid ${ROJO}` } : {}),
    ...(deshabilitado ? { opacity: 0.6 } : {}),
  }
  const foco = focoHandlers(marcado)

  return (
    <div className="space-y-1.5">
      <Cabecera
        clave={clave}
        etiqueta={etiqueta}
        derecha={
          <>
            <Contador largo={valor.length} max={max} />
            {sobrescrito && onRestaurar && !deshabilitado && (
              <BotonRestaurar onClick={onRestaurar} etiqueta={etiqueta} />
            )}
          </>
        }
      />
      {multilinea ? (
        <textarea
          id={id}
          rows={filas}
          // `maxLength` es la misma medida que aplica el servidor
          // (String.length en unidades UTF-16), así que el navegador corta
          // antes de que el PUT pueda fallar por longitud.
          maxLength={topeEntrada}
          value={valor}
          placeholder={placeholder}
          disabled={deshabilitado}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all resize-y"
          style={estilo}
          {...foco}
        />
      ) : (
        <input
          id={id}
          type={tipo}
          maxLength={topeEntrada}
          value={valor}
          placeholder={placeholder}
          disabled={deshabilitado}
          aria-invalid={ayudaEsError || undefined}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={estilo}
          {...foco}
        />
      )}
      {ayuda && (
        <p className="text-xs leading-relaxed" style={{ color: ayudaEsError ? ROJO : TXT_TENUE }}>{ayuda}</p>
      )}
    </div>
  )
}

export interface CampoEnteroProps extends Base {
  valor: number
  min: number
  max: number
  /** Se pinta a la derecha del input (p. ej. el mismo número en pesos). */
  sufijo?: React.ReactNode
  onChange: (v: number) => void
}

/**
 * Entero con estado de TEXTO propio.
 *
 * Un `<input type="number">` atado directo al número no deja borrar para
 * reescribir (un campo vacío no es un número y volvería a pintar el valor
 * viejo en mitad de la captura). Aquí se guarda lo tecleado tal cual, se
 * propaga solo cuando es un entero dentro del rango, y al salir del campo se
 * repone el último valor válido si quedó basura.
 */
export function CampoEntero({
  clave,
  etiqueta,
  ayuda,
  valor,
  min,
  max,
  sufijo,
  deshabilitado = false,
  sobrescrito = false,
  resaltado = false,
  onChange,
  onRestaurar,
}: CampoEnteroProps) {
  const id = idDeCampo(clave)
  const [texto, setTexto] = useState(String(valor))

  // Cuando el valor cambia desde fuera (Restaurar, restaurar todo, recarga
  // tras publicar) el input tiene que seguirlo; mientras el admin teclea, no.
  useEffect(() => {
    setTexto((actual) => (Number(actual.replace(/[\s,$]/g, '')) === valor ? actual : String(valor)))
  }, [valor])

  const numero = /^\d+$/.test(texto.trim()) ? Number(texto.trim()) : null
  const invalido = numero === null || numero < min || numero > max
  const foco = focoHandlers(resaltado || invalido)

  return (
    <div className="space-y-1.5">
      <Cabecera
        clave={clave}
        etiqueta={etiqueta}
        derecha={
          sobrescrito && onRestaurar && !deshabilitado ? (
            <BotonRestaurar onClick={onRestaurar} etiqueta={etiqueta} />
          ) : null
        }
      />
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={texto}
          disabled={deshabilitado}
          aria-invalid={invalido}
          onChange={(e) => {
            setTexto(e.target.value)
            const n = /^\d+$/.test(e.target.value.trim()) ? Number(e.target.value.trim()) : null
            if (n !== null && n >= min && n <= max) onChange(n)
          }}
          onBlur={(e) => {
            if (invalido) setTexto(String(valor))
            foco.onBlur(e)
          }}
          onFocus={foco.onFocus}
          className="w-40 px-3 py-2.5 rounded-lg text-sm outline-none transition-all tabular-nums"
          style={{
            ...INPUT_STYLE,
            ...(resaltado || invalido ? { border: `1px solid ${ROJO}` } : {}),
            ...(deshabilitado ? { opacity: 0.6 } : {}),
          }}
        />
        {sufijo}
      </div>
      {invalido && (
        <p className="text-xs" style={{ color: ROJO }}>
          Escribe un número entero entre {min} y {max}.
        </p>
      )}
      {ayuda && !invalido && <p className="text-xs" style={{ color: TXT_TENUE }}>{ayuda}</p>}
    </div>
  )
}
