'use client'

/**
 * Controles de texto, entero y decimal del editor.
 *
 * Comparten cabecera (etiqueta + contador + "Restaurar") y el mismo
 * contrato: el valor que se pinta es el EFECTIVO (override si lo hay, si no el
 * de fábrica) y `onChange` escribe siempre en el borrador de overrides. El
 * `placeholder` lleva el default, que es lo que se verá si el admin borra el
 * campo y pulsa "Restaurar".
 */
import { useEffect, useRef, useState } from 'react'
import { parseDecimal } from '@/lib/site-config-validacion'
import { alSalirConBasura, parseEntero } from '@/lib/site-config-editor'
import {
  BotonRestaurar,
  Contador,
  INPUT_STYLE,
  ROJO,
  TXT_SUAVE,
  TXT_TENUE,
  estiloBorde,
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
  /**
   * Quita la clave del borrador SIN pintar un botón «Restaurar» (la
   * mensualidad de un plan ya tiene el «Restaurar plan» de su caja). Se usa
   * al salir con basura de un campo que no tenía override al entrar; si no
   * se pasa, se usa `onRestaurar`.
   */
  onDescartar?: () => void
}

/**
 * Entero con estado de TEXTO propio.
 *
 * Lo tecleado se lee con `parseEntero`, que tolera lo que el admin ve en
 * pantalla (espacios, comas de miles, «$»): «1,500» es 1500. Antes, al
 * teclearlo carácter a carácter, el prefijo «1» era un entero válido, se
 * propagaba, y la coma dejaba el campo en rojo; al salir se reponía ese 1 y
 * se publicaba $1. Con basura al salir se repone lo que había AL ENTRAR
 * (y se devuelve al borrador), nunca el último prefijo: «60000» con tope
 * 50,000 se rechaza, no se trunca a 6000.
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
  onDescartar,
}: CampoEnteroProps) {
  const id = idDeCampo(clave)
  const [texto, setTexto] = useState(String(valor))
  /** Lo que valía el campo al entrar: es lo que se repone si sale con basura. */
  const alEntrar = useRef<number>(valor)
  /** ¿Tenía override al entrar? Si no, reponer es QUITAR la clave, no escribir el default. */
  const sobrescritoAlEntrar = useRef(sobrescrito)

  // Cuando el valor cambia desde fuera (Restaurar, restaurar todo, recarga
  // tras publicar) el input tiene que seguirlo; mientras el admin teclea, no.
  useEffect(() => {
    setTexto((actual) => (parseEntero(actual) === valor ? actual : String(valor)))
  }, [valor])

  const numero = parseEntero(texto)
  const invalido = numero === null || numero < min || numero > max
  // El foco va en el estado, no en el DOM: así el rojo del error gana al azul
  // del foco (ver `estiloBorde`).
  const [enfocado, setEnfocado] = useState(false)

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
            const n = parseEntero(e.target.value)
            if (n !== null && n >= min && n <= max) onChange(n)
          }}
          onBlur={() => {
            // Con basura: el borrador y la pantalla vuelven a como estaban AL
            // ENTRAR (ver `alSalirConBasura`).
            if (invalido) {
              const descartar = onDescartar ?? onRestaurar
              const r = alSalirConBasura({
                alEntrar: alEntrar.current,
                actual: valor,
                sobrescritoAlEntrar: sobrescritoAlEntrar.current,
                puedeDescartar: Boolean(descartar),
              })
              if (r.accion === 'descartar') descartar?.()
              else if (r.accion === 'escribir' && typeof r.valor === 'number') onChange(r.valor)
              setTexto(r.texto)
            }
            setEnfocado(false)
          }}
          onFocus={() => {
            alEntrar.current = valor
            sobrescritoAlEntrar.current = sobrescrito
            setEnfocado(true)
          }}
          className="w-40 px-3 py-2.5 rounded-lg text-sm outline-none transition-all tabular-nums"
          style={{
            ...INPUT_STYLE,
            ...estiloBorde(resaltado || invalido, enfocado),
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

export interface CampoPrecioNivelProps extends Base {
  /**
   * El override TAL CUAL: `undefined` = vacío. Puede no ser un entero válido
   * (un 0 escrito a mano en la fila): se pinta, se marca inválido y el botón
   * "Restaurar" queda a la vista para quitarlo.
   */
  valor: unknown
  /** El marcador del campo vacío: lo que cobraría el nivel sin precio propio. */
  vacio: string
  /**
   * Cómo termina el error «…o déjalo vacío para usar ___.». Por defecto «el
   * precio general»; donde vacío NO da la general (alias de secundaria, clave
   * sembrada en config.ts) la pestaña pasa la cifra real.
   */
  vacioError?: string
  min: number
  max: number
  /** Se pinta a la derecha del input: el precio que de verdad cobra el nivel. */
  sufijo?: React.ReactNode
  onChange: (v: number) => void
  /** El admin dejó el campo vacío: se quita la clave del borrador. */
  onVaciar: () => void
  /**
   * Devuelve al borrador lo que el campo tenía AL ENTRAR, tal cual (puede no
   * ser un número: una fila escrita a mano). Se usa al salir con basura.
   */
  onReponer: (crudo: unknown) => void
}

const textoDe = (v: unknown): string => (v === undefined || v === null ? '' : String(v))

/**
 * Quita lo que el admin ve en pantalla y teclea por costumbre: espacios,
 * comas de miles y el signo de pesos (lo mismo que ignora `parseEntero`).
 * Sin esto, «1,500» tecleado carácter a carácter dejaba en el borrador el
 * prefijo válido «1» (y se publicaba $1). Aquí solo decide si el campo está
 * VACÍO; el número lo lee `parseEntero`, igual que en CampoEntero.
 */
const normalizar = (s: string) => s.replace(/[\s,$]/g, '')

/**
 * Precio por nivel (Fase 2, F2-9): un entero OPCIONAL.
 *
 * Mismo contrato que `CampoEntero`, con una diferencia: VACÍO ES VÁLIDO y
 * significa «sin precio propio» (el nivel sigue la general de hoy). Por eso
 * no escribe `null` ni `0` en el borrador: quita la clave, que es lo único que
 * hace que el merge caiga al valor de fábrica (ver `quitarRuta`).
 */
export function CampoPrecioNivel({
  clave,
  etiqueta,
  ayuda,
  valor,
  vacio,
  vacioError = 'el precio general',
  min,
  max,
  sufijo,
  deshabilitado = false,
  sobrescrito = false,
  resaltado = false,
  onChange,
  onVaciar,
  onReponer,
  onRestaurar,
}: CampoPrecioNivelProps) {
  const id = idDeCampo(clave)
  const [texto, setTexto] = useState(textoDe(valor))
  /** Lo que valía el campo al entrar: es lo que se repone si sale con basura. */
  const alEntrar = useRef<unknown>(valor)

  // Como en CampoEntero: se sigue el valor de fuera (Restaurar, recarga tras
  // publicar), pero no se pisa lo que el admin teclea si ya equivale a lo mismo.
  useEffect(() => {
    setTexto((actual) => {
      const limpio = normalizar(actual)
      if (limpio === '' && (valor === undefined || valor === null)) return actual
      return parseEntero(actual) === valor ? actual : textoDe(valor)
    })
  }, [valor])

  const limpio = normalizar(texto)
  const numero = parseEntero(texto)
  const invalido = limpio !== '' && (numero === null || numero < min || numero > max)
  // Como en CampoEntero: el foco va en el estado para que el rojo gane.
  const [enfocado, setEnfocado] = useState(false)

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
      {/* El marcador («Vacío: usa la general, $2,000») tiene que leerse
          COMPLETO: un input no parte su placeholder en dos líneas. Por eso el
          campo ocupa el renglón hasta `max-w-xs` (20rem: 340 px con la raíz
          del admin a 17 px) y, si no queda sitio para la cifra verde (móvil,
          o la columna angosta de 1024 px), ésta baja de renglón en vez de
          comerse el ancho del campo. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={texto}
          placeholder={vacio}
          disabled={deshabilitado}
          aria-invalid={invalido}
          onChange={(e) => {
            setTexto(e.target.value)
            const t = normalizar(e.target.value)
            if (t === '') return onVaciar()
            const n = parseEntero(e.target.value)
            if (n !== null && n >= min && n <= max) onChange(n)
          }}
          onBlur={() => {
            // Con basura, se repone lo que había AL ENTRAR (y se devuelve al
            // borrador), no el último prefijo válido que se propagó al teclear.
            // Vacío al entrar = sin override: reponer es quitar la clave.
            if (invalido) {
              const r = alSalirConBasura({
                alEntrar: alEntrar.current,
                actual: valor,
                sobrescritoAlEntrar: alEntrar.current !== undefined && alEntrar.current !== null,
                puedeDescartar: true,
              })
              if (r.accion === 'descartar') onVaciar()
              else if (r.accion === 'escribir') onReponer(r.valor)
              setTexto(r.texto)
            } else if (limpio === '' && texto !== '') {
              // Solo espacios o «$»: ya es vacío; se limpia para que se vea el marcador.
              setTexto('')
            }
            setEnfocado(false)
          }}
          onFocus={() => {
            alEntrar.current = valor
            setEnfocado(true)
          }}
          className="w-full max-w-xs px-3 py-2.5 rounded-lg text-sm outline-none transition-all tabular-nums"
          style={{
            ...INPUT_STYLE,
            ...estiloBorde(resaltado || invalido, enfocado),
            ...(deshabilitado ? { opacity: 0.6 } : {}),
          }}
        />
        {sufijo}
      </div>
      {invalido && (
        <p className="text-xs" style={{ color: ROJO }}>
          Escribe un entero entre {min.toLocaleString('es-MX')} y {max.toLocaleString('es-MX')}, o déjalo vacío para usar {vacioError}.
        </p>
      )}
      {ayuda && !invalido && <p className="text-xs" style={{ color: TXT_TENUE }}>{ayuda}</p>}
    </div>
  )
}

export interface CampoDecimalProps extends Base {
  valor: number
  min: number
  max: number
  /** Se pinta debajo del input (p. ej. un ejemplo de la equivalencia). */
  sufijo?: React.ReactNode
  onChange: (v: number) => void
}

/**
 * Decimal con estado de TEXTO propio (hoy solo el tipo de cambio).
 *
 * Mismo contrato que `CampoEntero`, pero lo tecleado se interpreta con
 * `parseDecimal`, la MISMA función con la que valida el servidor: acepta la
 * coma decimal ("16,90"). Si el editor leyera los números de otra forma,
 * podría dar por bueno lo que el servidor rechaza, o al revés.
 */
export function CampoDecimal({
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
}: CampoDecimalProps) {
  const id = idDeCampo(clave)
  const [texto, setTexto] = useState(String(valor))

  // Igual que en CampoEntero: se sigue el valor de fuera (Restaurar, recarga),
  // pero no se pisa lo que el admin está tecleando si ya equivale a lo mismo.
  useEffect(() => {
    setTexto((actual) => (parseDecimal(actual) === valor ? actual : String(valor)))
  }, [valor])

  const numero = parseDecimal(texto)
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
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={texto}
        disabled={deshabilitado}
        aria-invalid={invalido}
        onChange={(e) => {
          setTexto(e.target.value)
          const n = parseDecimal(e.target.value)
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
      {invalido && (
        <p className="text-xs" style={{ color: ROJO }}>
          Escribe un número entre {min} y {max} (con punto o coma decimal).
        </p>
      )}
      {!invalido && sufijo}
      {ayuda && !invalido && <p className="text-xs" style={{ color: TXT_TENUE }}>{ayuda}</p>}
    </div>
  )
}
