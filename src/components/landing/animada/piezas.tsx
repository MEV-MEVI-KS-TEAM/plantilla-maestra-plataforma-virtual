'use client'

/**
 * Piezas compartidas de la landing animada: el encabezado de sección y los
 * botones. Las usan la landing y la sección de Licenciaturas, así que viven
 * aparte en vez de copiarse.
 *
 * 🛑 CERO HEXADECIMALES: los colores llegan en `TokensSeccion` desde tokens.ts.
 */

import { retraso, variable } from './animacion'
import type { TokensSeccion } from './tokens'

export const BOTON =
  'la-btn inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 font-semibold ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto'

export const CONTENEDOR = 'max-w-6xl mx-auto px-4 sm:px-8 py-20 sm:py-24'

/**
 * El rótulo de un botón sin la flecha escrita a mano.
 *
 * Varios textos por defecto terminan en «→» («Comenzar ahora →», «Inscribirme
 * →») porque la portada anterior no dibujaba ninguna. Esta sí pone su propio
 * ícono, así que sin esto el botón sale con DOS flechas. Se limpia al pintar y
 * no en el config: el texto es del cliente y puede volver a traerla el día que
 * la escriba desde «Personalizar mi página».
 */
export function sinFlecha(rotulo: string): string {
  // 🛑 Sin la bandera `u`: el target de TypeScript del proyecto no la admite
  // (TS1501) y el build se cae, no el editor.
  return rotulo.replace(/[\s\u00A0]*[→>»›-]+\s*$/, '').trim()
}

export function Encabezado({ t, kicker, titulo, bajada, centrado = true }: {
  t: TokensSeccion; kicker?: string; titulo: string; bajada?: string; centrado?: boolean
}) {
  const filete = <span aria-hidden className="la-filete" style={{ background: t.decorativo }} />
  return (
    <div className={centrado ? 'text-center max-w-2xl mx-auto' : 'max-w-xl'}>
      {kicker && (
        <p data-la-reveal className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] ${centrado ? 'justify-center' : ''}`}
          style={{ color: t.titulo }}>
          {filete}{kicker}{centrado && filete}
        </p>
      )}
      <h2 data-la-reveal className="mt-4 font-bold"
        style={{ ...retraso(1), color: t.titulo, fontSize: 'clamp(2rem, 3.6vw, 2.75rem)', lineHeight: 1.15 }}>
        {titulo}
      </h2>
      {bajada && (
        <p data-la-reveal className="mt-4 text-base sm:text-lg leading-relaxed" style={{ ...retraso(2), color: t.textoSuave }}>{bajada}</p>
      )}
    </div>
  )
}

/** Botón con su hover pintado por variable CSS (`.la-btn-color:hover`). */
export function estiloBoton(fondo: string, texto: string, borde: string, hover?: string) {
  return {
    background: fondo, color: texto, border: `2px solid ${borde}`, outlineColor: borde,
    ...(hover ? variable('--la-hover', hover) : {}),
  }
}
