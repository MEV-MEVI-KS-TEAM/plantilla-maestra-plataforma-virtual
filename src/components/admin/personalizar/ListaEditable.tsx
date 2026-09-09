'use client'

/**
 * Listas de la landing: badges, bullets, contadores, tarjetas, testimonios y
 * preguntas frecuentes.
 *
 * Las listas se editan ENTERAS y se guardan enteras (el merge reemplaza el
 * arreglo completo, nunca "el segundo badge"), así que aquí se manejan como un
 * arreglo local que se reescribe en cada operación: cambiar un texto, agregar,
 * quitar, subir y bajar.
 *
 * POR QUÉ EL ELEMENTO NUEVO NO SALE VACÍO. El servidor rechaza la cadena vacía
 * en cualquier elemento de lista (`validarListaTexto` / `validarListaObjetos`),
 * y con razón: un badge en blanco es un hueco en la página. Si "Agregar"
 * dejara campos vacíos, el admin escribiría todo lo demás, pulsaría Publicar y
 * se comería un 400 por el elemento que acaba de crear. Se duplica el último
 * elemento (o el primero de fábrica) y él lo reescribe encima.
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { Campo, Subcampo } from '@/lib/site-config-campos'
import { CampoEntero, CampoTexto } from './CampoTexto'
import {
  BORDE,
  BotonRestaurar,
  Contador,
  FIELD_BG,
  INPUT_STYLE,
  ROJO,
  TXT,
  TXT_SUAVE,
  TXT_TENUE,
  focoHandlers,
  idDeCampo,
} from './Comunes'

type Elemento = Record<string, string | number>

interface BaseLista {
  campo: Campo
  sobrescrito: boolean
  puedeEditar: boolean
  resaltado: boolean
  onRestaurar: () => void
}

// ─── Cabecera y botonera comunes ─────────────────────────────────────────────

function CabeceraLista({
  campo,
  total,
  sobrescrito,
  puedeEditar,
  onRestaurar,
  onAgregar,
}: {
  campo: Campo
  total: number
  sobrescrito: boolean
  puedeEditar: boolean
  onRestaurar: () => void
  onAgregar: () => void
}) {
  const max = campo.maxItems ?? Number.POSITIVE_INFINITY
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium" style={{ color: TXT_SUAVE }}>{campo.etiqueta}</p>
        <p className="text-xs" style={{ color: TXT_TENUE }}>
          {total} de {campo.maxItems} máximo
        </p>
      </div>
      <div className="flex items-center gap-2">
        {sobrescrito && puedeEditar && <BotonRestaurar onClick={onRestaurar} etiqueta={campo.etiqueta} />}
        <button
          type="button"
          onClick={onAgregar}
          disabled={!puedeEditar || total >= max}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ border: `1px solid ${BORDE}`, color: TXT_SUAVE }}
          title={total >= max ? `Máximo ${campo.maxItems} elementos` : 'Agregar elemento'}
        >
          <Plus className="w-3 h-3" aria-hidden="true" />
          Agregar
        </button>
      </div>
    </div>
  )
}

function BotonesFila({
  indice,
  total,
  minItems,
  puedeEditar,
  onSubir,
  onBajar,
  onQuitar,
}: {
  indice: number
  total: number
  minItems: number
  puedeEditar: boolean
  onSubir: () => void
  onBajar: () => void
  onQuitar: () => void
}) {
  const btn = 'p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed'
  const estilo = { border: `1px solid ${BORDE}`, color: TXT_SUAVE }
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        type="button" className={btn} style={estilo} onClick={onSubir}
        disabled={!puedeEditar || indice === 0} aria-label={`Subir el elemento ${indice + 1}`}
      >
        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button
        type="button" className={btn} style={estilo} onClick={onBajar}
        disabled={!puedeEditar || indice === total - 1} aria-label={`Bajar el elemento ${indice + 1}`}
      >
        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button
        type="button" className={btn} style={{ ...estilo, color: ROJO }} onClick={onQuitar}
        disabled={!puedeEditar || total <= minItems}
        title={total <= minItems ? `Debe quedar al menos ${minItems}` : 'Quitar'}
        aria-label={`Quitar el elemento ${indice + 1}`}
      >
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

/** Mueve un elemento de sitio y devuelve un arreglo nuevo. */
function mover<T>(lista: T[], desde: number, hasta: number): T[] {
  if (hasta < 0 || hasta >= lista.length) return lista
  const copia = [...lista]
  const [el] = copia.splice(desde, 1)
  copia.splice(hasta, 0, el)
  return copia
}

// ─── Lista de textos ─────────────────────────────────────────────────────────

export interface ListaTextoProps extends BaseLista {
  valor: string[]
  /** La lista de fábrica: de ahí sale el elemento nuevo si la actual quedó a cero. */
  base: string[]
  onChange: (v: string[]) => void
}

export function ListaTexto({
  campo, valor, base, sobrescrito, puedeEditar, resaltado, onChange, onRestaurar,
}: ListaTextoProps) {
  const max = campo.max ?? 120
  const minItems = campo.minItems ?? 0
  const foco = focoHandlers(resaltado)

  function agregar() {
    const plantilla = valor[valor.length - 1] ?? base[0] ?? 'Nuevo'
    onChange([...valor, plantilla.slice(0, max)])
  }

  return (
    // El id va en el CONTENEDOR y no en el primer input: cuando el servidor
    // rechaza una lista devuelve la clave de la lista entera, y una lista
    // recién vaciada no tendría ningún input al que saltar.
    <div className="space-y-2" id={idDeCampo(campo.clave)} tabIndex={-1}>
      <CabeceraLista
        campo={campo} total={valor.length} sobrescrito={sobrescrito}
        puedeEditar={puedeEditar} onRestaurar={onRestaurar} onAgregar={agregar}
      />
      <div className="space-y-2">
        {valor.map((texto, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={max}
              value={texto}
              disabled={!puedeEditar}
              aria-label={`${campo.etiqueta}, elemento ${i + 1}`}
              onChange={(e) => onChange(valor.map((v, j) => (j === i ? e.target.value : v)))}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                ...INPUT_STYLE,
                ...(resaltado ? { border: `1px solid ${ROJO}` } : {}),
                ...(puedeEditar ? {} : { opacity: 0.6 }),
              }}
              {...foco}
            />
            <Contador largo={texto.length} max={max} />
            <BotonesFila
              indice={i} total={valor.length} minItems={minItems} puedeEditar={puedeEditar}
              onSubir={() => onChange(mover(valor, i, i - 1))}
              onBajar={() => onChange(mover(valor, i, i + 1))}
              onQuitar={() => onChange(valor.filter((_, j) => j !== i))}
            />
          </div>
        ))}
        {valor.length === 0 && (
          <p className="text-xs italic" style={{ color: TXT_TENUE }}>Sin elementos.</p>
        )}
      </div>
    </div>
  )
}

// ─── Lista de objetos ────────────────────────────────────────────────────────

/** Un elemento nuevo con todos los subcampos llenos (nunca vacíos, ver arriba). */
function elementoNuevo(campos: ReadonlyArray<Subcampo>, plantilla: Elemento | undefined): Elemento {
  const nuevo: Elemento = {}
  for (const sub of campos) {
    const dePlantilla = plantilla?.[sub.clave]
    if (dePlantilla !== undefined) {
      nuevo[sub.clave] = dePlantilla
      continue
    }
    nuevo[sub.clave] = sub.tipo === 'entero' ? sub.min ?? 0 : 'Nuevo'.slice(0, Math.max(1, sub.max))
  }
  return nuevo
}

export interface ListaObjetosProps extends BaseLista {
  valor: Elemento[]
  base: Elemento[]
  onChange: (v: Elemento[]) => void
}

export function ListaObjetos({
  campo, valor, base, sobrescrito, puedeEditar, resaltado, onChange, onRestaurar,
}: ListaObjetosProps) {
  const campos = campo.campos ?? []
  const minItems = campo.minItems ?? 0

  function agregar() {
    onChange([...valor, elementoNuevo(campos, valor[valor.length - 1] ?? base[0])])
  }

  function editar(i: number, subclave: string, v: string | number) {
    onChange(valor.map((el, j) => (j === i ? { ...el, [subclave]: v } : el)))
  }

  return (
    // Mismo criterio que en ListaTexto: el id lo lleva el contenedor.
    <div className="space-y-3" id={idDeCampo(campo.clave)} tabIndex={-1}>
      <CabeceraLista
        campo={campo} total={valor.length} sobrescrito={sobrescrito}
        puedeEditar={puedeEditar} onRestaurar={onRestaurar} onAgregar={agregar}
      />
      {valor.length === 0 && (
        <p className="text-xs italic" style={{ color: TXT_TENUE }}>Sin elementos.</p>
      )}
      {valor.map((el, i) => (
        <div
          key={i}
          className="rounded-xl p-4 space-y-3"
          style={{ ...FIELD_BG, ...(resaltado ? { border: `1px solid ${ROJO}` } : {}) }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold" style={{ color: TXT }}>#{i + 1}</span>
            <BotonesFila
              indice={i} total={valor.length} minItems={minItems} puedeEditar={puedeEditar}
              onSubir={() => onChange(mover(valor, i, i - 1))}
              onBajar={() => onChange(mover(valor, i, i + 1))}
              onQuitar={() => onChange(valor.filter((_, j) => j !== i))}
            />
          </div>
          {campos.map((sub) =>
            sub.tipo === 'entero' ? (
              <CampoEntero
                key={sub.clave}
                clave={`${campo.clave}.${i}.${sub.clave}`}
                etiqueta={sub.etiqueta}
                valor={typeof el[sub.clave] === 'number' ? (el[sub.clave] as number) : 0}
                min={sub.min ?? 0}
                max={sub.max}
                deshabilitado={!puedeEditar}
                onChange={(n) => editar(i, sub.clave, n)}
              />
            ) : (
              <CampoTexto
                key={sub.clave}
                clave={`${campo.clave}.${i}.${sub.clave}`}
                etiqueta={sub.etiqueta}
                valor={typeof el[sub.clave] === 'string' ? (el[sub.clave] as string) : ''}
                max={sub.max}
                multilinea={sub.tipo === 'textarea'}
                filas={2}
                deshabilitado={!puedeEditar}
                onChange={(v) => editar(i, sub.clave, v)}
              />
            ),
          )}
        </div>
      ))}
    </div>
  )
}
