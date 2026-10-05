'use client'

/**
 * Diplomados de PREPARACIÓN a estándares CONOCER en la portada (#212).
 *
 * Viajan por el riel de licenciaturas con `esDiplomado: true`, y la sección de
 * licenciaturas los filtra a propósito (no titulan). Esta sección ocupa su mismo
 * lugar en la página cuando la escuela tiene diplomados y ninguna licenciatura.
 *
 * 🛑 Marco CONOCER: se vende la PREPARACIÓN. La certificación la emite una ECE/OC
 *    acreditada, con trámite y costo aparte. Los textos legales vienen de
 *    `CONFIG.diplomadosConocer` y de cada carrera, nunca escritos aquí.
 * 🛑 El costo de la evaluación va con el MISMO peso visual que el precio de la
 *    preparación (contexto 03 §6.2): es lo que evita la queja y la devolución.
 * 🛑 Sin logos CONOCER/SEP y sin un solo hexadecimal: todo sale de los tokens.
 */
import { ArrowRight, CheckCircle2, Clock, HeartHandshake, HeartPulse, Sparkles, Stethoscope, Users, Waves, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { getCarrerasDiplomado, precioDiplomado, textosConocer } from '@/lib/licenciatura-utils'
import { getModalidadesDiplomado } from '@/lib/modalidades'
import { retraso } from './animacion'
import { BOTON, CONTENEDOR, Encabezado, estiloBoton, sinFlecha } from './piezas'
import { unirConO } from './textos-licenciatura'
import type { TokensSeccion } from './tokens'

type Dinero = (n: number) => string

const ICONOS: Record<string, LucideIcon> = { Sparkles, Waves, HeartPulse, HeartHandshake, Users, Stethoscope }
const COLUMNAS: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'lg:grid-cols-3' }

type CarreraDiplomado = ReturnType<typeof getCarrerasDiplomado>[number] & {
  estandar?: string
  estandarTitulo?: string
  practica?: string
  alcance?: string
}

/** ¿Hay diplomados que pintar? La portada lo usa para reservarles su lugar. */
export function hayDiplomadosConocer(): boolean {
  return getCarrerasDiplomado().length > 0 && textosConocer() !== null
}

export function SeccionDiplomados({ t, filete, fmt, cta, variante }: {
  t: TokensSeccion
  /** Color de los filetes superiores de las tarjetas (decorativo). */
  filete: string
  fmt: Dinero
  cta: string
  variante: string
}) {
  const textos = textosConocer()
  const diplomados = getCarrerasDiplomado() as readonly CarreraDiplomado[]
  if (!textos || diplomados.length === 0) return null

  // #222: precio por PROGRAMA (en un riel con licenciatura,
  // `inscripcion` es la de la licenciatura) y solo los planes del diplomado.
  const meses = Array.from(new Set(getModalidadesDiplomado().map(m => m.meses))).sort((a, b) => a - b)
  const ritmos = meses.length > 0 ? `${unirConO(meses.map(String))} meses` : ''

  return (
    <section id="diplomados-conocer" data-variant={variante} style={{ background: t.fondo, color: t.texto, scrollMarginTop: 80 }}>
      <div className={CONTENEDOR}>
        <Encabezado t={t} kicker="Diplomados" titulo={textos.titulo} bajada={textos.bajada} />

        <div className={`grid gap-6 mt-12 ${COLUMNAS[diplomados.length] ?? COLUMNAS[3]}`}>
          {diplomados.map((d, i) => {
            const precio = precioDiplomado(d.slug)
            const Icono = ICONOS[d.icono] ?? Sparkles
            return (
              <article key={d.slug} data-la-reveal="sube" className="la-card rounded-2xl flex flex-col overflow-hidden"
                style={{ ...retraso(i, 100), background: t.superficie, border: `1px solid ${t.borde}` }}>
                <div aria-hidden className="la-surco" style={{ height: 4, background: filete }} />
                <div className="p-7 flex flex-col flex-1">
                  <Icono size={28} aria-hidden style={{ color: t.acentoTexto }} />
                  <h3 className="mt-4 text-xl font-bold" style={{ color: t.titulo }}>{d.nombre}</h3>
                  {d.estandar && (
                    <p className="mt-1 text-sm font-semibold" style={{ color: t.acentoTexto }}>
                      Prepara para el estándar {d.estandar}
                    </p>
                  )}
                  {d.estandarTitulo && (
                    <p className="mt-0.5 text-sm" style={{ color: t.textoSuave }}>«{d.estandarTitulo}»</p>
                  )}
                  <p className="mt-3 text-base leading-relaxed" style={{ color: t.texto }}>{d.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {d.incluye.map(x => (
                      <li key={x} className="flex items-start gap-2 text-sm" style={{ color: t.texto }}>
                        <CheckCircle2 size={17} aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: t.titulo }} />{x}
                      </li>
                    ))}
                    {ritmos && (
                      <li className="flex items-start gap-2 text-sm" style={{ color: t.texto }}>
                        <Clock size={17} aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: t.titulo }} />Planes de {ritmos}
                      </li>
                    )}
                  </ul>

                  {/* Precio de la preparación y costo de la evaluación, con el MISMO peso. */}
                  <dl className="mt-6 pt-5 space-y-3 flex-1" style={{ borderTop: `1px solid ${t.borde}` }}>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm" style={{ color: t.texto }}>Preparación · pago único</dt>
                      <dd className="text-lg font-bold whitespace-nowrap" style={{ color: t.titulo }}>{precio > 0 ? fmt(precio) : 'Consúltalo'}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm" style={{ color: t.texto }}>Evaluación oficial · aparte</dt>
                      <dd className="text-lg font-bold whitespace-nowrap" style={{ color: t.titulo }}>{textos.costoEvaluacionEtiqueta ?? 'Con la entidad evaluadora'}</dd>
                    </div>
                  </dl>
                  {(d.practica || d.alcance) && (
                    <p className="mt-4 text-sm leading-relaxed" style={{ color: t.textoSuave }}>
                      {[d.practica, d.alcance].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <p data-la-reveal className="mt-10 max-w-3xl mx-auto text-center text-base leading-relaxed" style={{ color: t.texto }}>
          {textos.costoEvaluacion}
        </p>
        <p data-la-reveal className="mt-3 max-w-3xl mx-auto text-center text-sm leading-relaxed" style={{ color: t.textoSuave }}>
          {textos.disclaimer}
        </p>

        <div data-la-reveal className="mt-8 text-center">
          <Link href="/register" className={`${BOTON} la-btn-color`}
            style={estiloBoton(t.btnFondo, t.btnTexto, t.btnFondo, t.btnHover)}>
            {sinFlecha(cta)}<ArrowRight size={18} aria-hidden className="la-flecha" />
          </Link>
        </div>
      </div>
    </section>
  )
}
