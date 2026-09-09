'use client'

/**
 * Pestaña "Colores".
 *
 * PALETAS PRIMERO, NUNCA SOLO EL PICKER. El admin de una escuela no sabe (ni
 * tiene por qué) qué es un ratio de contraste; si la pantalla empezara con
 * doce cuadritos de color libres, la mitad de la flota acabaría con botones
 * ilegibles. Las 12 paletas están verificadas contra `PARES_CONTRASTE` en
 * tests/unit/paletas.spec.ts: elegir una es siempre seguro. El picker libre
 * existe, pero detrás de un acordeón y con el validador en vivo al lado.
 *
 * La paleta "Original" no escribe colores: los QUITA (ver `aplicarPaleta`).
 * Por eso también es la única sin advertencias: son los colores con los que el
 * cliente lleva meses en producción, no una elección de esta pantalla. Y por
 * eso mismo sus muestras se pintan con `defaults.colores` y no con las de
 * `PALETAS[0]`, que son las de la plantilla: enseñarle a un cliente guinda tres
 * cuadritos azules como "lo original" es enseñarle lo que NO va a pasar.
 *
 * El acordeón "Ajustes avanzados" NO guarda su estado aquí: vive en la página,
 * junto a la pestaña activa. Si viviera aquí, cambiar de pestaña lo cerraría, y
 * es justo lo que hace la página cuando el servidor rechaza un `colores.*` y
 * tiene que traer al admin hasta el campo.
 */
import { useEffect, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Palette, Wand2 } from 'lucide-react'
import {
  ETIQUETAS_TOKENS,
  PALETAS,
  TOKENS_COLORES,
  type TokensColores,
} from '@/lib/site-config-paletas'
import { esHexValido } from '@/lib/contraste'
import {
  ID_PALETA_ORIGINAL,
  advertenciasContraste,
  aplicarPaleta,
  coloresEfectivos,
  escribirRuta,
  estaSobrescrito,
  paletaActiva,
  quitarRuta,
} from '@/lib/site-config-editor'
import {
  Ayuda,
  BORDE,
  BotonRestaurar,
  FIELD_BG,
  INPUT_STYLE,
  ROJO,
  TXT,
  TXT_SUAVE,
  TXT_TENUE,
  Tarjeta,
  idDeCampo,
  type PropsPestana,
} from './Comunes'

/** Hex que se le puede dar a `<input type="color">` sin que se queje. */
function hexSeguro(v: string): string {
  return esHexValido(v) ? v : '#000000'
}

function CampoColor({
  token,
  valor,
  sobrescrito,
  deshabilitado,
  resaltado,
  onChange,
  onRestaurar,
}: {
  token: keyof TokensColores
  valor: string
  sobrescrito: boolean
  deshabilitado: boolean
  resaltado: boolean
  onChange: (v: string) => void
  onRestaurar: () => void
}) {
  const clave = `colores.${token}`
  const id = idDeCampo(clave)
  const [texto, setTexto] = useState(valor)

  // Sigue al valor cuando cambia desde fuera (paleta, sugerencia, restaurar).
  useEffect(() => {
    setTexto((actual) => (actual.toUpperCase() === valor.toUpperCase() ? actual : valor))
  }, [valor])

  const invalido = !esHexValido(texto)

  function escribir(v: string) {
    setTexto(v)
    // Solo se propaga un #RRGGBB completo: a media captura ('#3B8') el color
    // no existe todavía y pintarlo haría parpadear la vista previa.
    if (esHexValido(v)) onChange(v.toUpperCase())
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={hexSeguro(valor)}
        disabled={deshabilitado}
        aria-label={`Selector de color: ${ETIQUETAS_TOKENS[token]}`}
        onChange={(e) => escribir(e.target.value.toUpperCase())}
        className="w-10 h-10 rounded-lg flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
        style={{ background: 'transparent', border: `1px solid ${BORDE}`, padding: 2 }}
      />
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="block text-xs font-medium mb-1" style={{ color: TXT_SUAVE }}>
          {ETIQUETAS_TOKENS[token]}
        </label>
        <input
          id={id}
          type="text"
          value={texto}
          maxLength={7}
          spellCheck={false}
          disabled={deshabilitado}
          aria-invalid={invalido}
          onChange={(e) => escribir(e.target.value.toUpperCase())}
          onBlur={() => { if (invalido) setTexto(valor) }}
          className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
          style={{
            ...INPUT_STYLE,
            ...(invalido || resaltado ? { border: `1px solid ${ROJO}` } : {}),
            ...(deshabilitado ? { opacity: 0.6 } : {}),
          }}
        />
      </div>
      <div className="w-[86px] flex-shrink-0 flex justify-end">
        {sobrescrito && !deshabilitado && (
          <BotonRestaurar onClick={onRestaurar} etiqueta={ETIQUETAS_TOKENS[token]} />
        )}
      </div>
    </div>
  )
}

export interface PropsColores extends PropsPestana {
  /** Acordeón "Ajustes avanzados". Lo gobierna la página (ver el encabezado). */
  avanzado: boolean
  onAvanzado: (abierto: boolean) => void
}

export function PestanaColores({
  defaults, overrides, actualizar, puedeEditar, claveConError, avanzado, onAvanzado,
}: PropsColores) {
  const deFabrica = defaults.colores as TokensColores
  const colores = coloresEfectivos(deFabrica, overrides)
  const activa = paletaActiva(overrides, { colores: deFabrica })
  const esOriginal = activa === ID_PALETA_ORIGINAL
  const avisos = advertenciasContraste(colores, esOriginal)

  return (
    <div className="space-y-5">
      <Tarjeta
        titulo="Paletas"
        icono={<Palette className="w-4 h-4" style={{ color: 'var(--color-acento)' }} aria-hidden="true" />}
        descripcion="Elige una y se aplican los doce colores de la plataforma de una vez. Todas están revisadas para que los textos se lean."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {PALETAS.map((p) => {
            const seleccionada = activa === p.id
            // La "Original" no aplica los colores de la plantilla: quita los
            // overrides y deja los del cliente. Se anuncia por lo que hace.
            const muestras = p.original ? deFabrica : p.colores
            const nombre = p.original ? 'Original (tus colores de fábrica)' : p.nombre
            const descripcion = p.original
              ? 'Los colores con los que salió tu página. Elegirla deshace todo lo que hayas cambiado aquí.'
              : p.descripcion
            return (
              <button
                key={p.id}
                type="button"
                disabled={!puedeEditar}
                aria-pressed={seleccionada}
                onClick={() => actualizar((prev) => aplicarPaleta(prev, p))}
                className="text-left rounded-xl p-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  ...FIELD_BG,
                  border: seleccionada ? '2px solid var(--color-acento)' : `1px solid ${BORDE}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {(['primario', 'acento', 'fondo'] as const).map((token) => (
                    <span
                      key={token}
                      className="w-6 h-6 rounded-md flex-shrink-0"
                      style={{ background: muestras[token], border: '1px solid rgba(255,255,255,0.12)' }}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-auto flex items-center gap-1">
                    {seleccionada && (
                      <Check className="w-4 h-4" style={{ color: 'var(--color-acento)' }} aria-hidden="true" />
                    )}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: TXT }}>{nombre}</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: TXT_TENUE }}>{descripcion}</p>
              </button>
            )
          })}
        </div>

        {activa === null && (
          <Ayuda>
            Ahora mismo tienes una combinación <strong style={{ color: TXT_SUAVE }}>personalizada</strong>:
            no coincide con ninguna paleta. Elige una para volver a un conjunto revisado.
          </Ayuda>
        )}
      </Tarjeta>

      <section className="rounded-xl overflow-hidden" style={{ background: '#181C26', border: `1px solid ${BORDE}` }}>
        <button
          type="button"
          onClick={() => onAvanzado(!avanzado)}
          aria-expanded={avanzado}
          className="w-full flex items-center justify-between gap-3 px-5 py-4"
        >
          <span className="text-sm font-semibold" style={{ color: TXT }}>Ajustes avanzados</span>
          <span className="flex items-center gap-2">
            {avisos.length > 0 && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', color: ROJO }}
              >
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                {avisos.length}
              </span>
            )}
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ color: TXT_SUAVE, transform: avanzado ? 'rotate(180deg)' : 'none' }}
              aria-hidden="true"
            />
          </span>
        </button>

        {avanzado && (
          <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${BORDE}` }}>
            <Ayuda>
              Cada color por separado. Si tocas uno, la paleta deja de estar
              &ldquo;completa&rdquo; y aparecen aquí abajo los avisos de legibilidad.
            </Ayuda>

            <div className="space-y-3 pt-1">
              {TOKENS_COLORES.map((token) => (
                <CampoColor
                  key={token}
                  token={token}
                  valor={colores[token]}
                  deshabilitado={!puedeEditar}
                  resaltado={claveConError === `colores.${token}`}
                  sobrescrito={estaSobrescrito(overrides, `colores.${token}`)}
                  onChange={(v) => actualizar((prev) => escribirRuta(prev, `colores.${token}`, v))}
                  onRestaurar={() => actualizar((prev) => quitarRuta(prev, `colores.${token}`))}
                />
              ))}
            </div>

            {avisos.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-semibold" style={{ color: ROJO }}>
                  {avisos.length === 1 ? 'Un texto no se lee bien' : `${avisos.length} textos no se leen bien`}
                </p>
                {avisos.map((a) => (
                  <div
                    key={`${a.par.a}-${a.par.b}`}
                    className="rounded-xl p-3 flex items-start justify-between gap-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: TXT }}>{a.par.etiqueta}</p>
                      <p className="text-xs mt-0.5" style={{ color: TXT_SUAVE }}>
                        Contraste actual {a.ratio}:1 — hace falta {a.minimo}:1.
                      </p>
                    </div>
                    {a.sugerencia && puedeEditar && (
                      <button
                        type="button"
                        onClick={() => {
                          const s = a.sugerencia!
                          actualizar((prev) => escribirRuta(prev, `colores.${s.token}`, s.valor))
                        }}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 font-medium"
                        style={{ border: `1px solid ${BORDE}`, color: TXT_SUAVE }}
                        title={`Cambia ${ETIQUETAS_TOKENS[a.sugerencia.token]} a ${a.sugerencia.valor}`}
                      >
                        <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Aplicar sugerencia
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
