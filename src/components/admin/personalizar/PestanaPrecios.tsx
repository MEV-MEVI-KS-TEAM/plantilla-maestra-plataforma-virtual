'use client'

/**
 * Pestaña "Precios": inscripción, mensualidad de cada plan y las dos
 * certificaciones.
 *
 * DE UN PLAN SOLO SE EDITAN DOS COSAS: la mensualidad y si está activo. La
 * duración y las materias por mes definen el PRODUCTO (cuántas materias se
 * abren cada mes, cuántos pagos hay) y viven en config.ts; cambiarlas desde
 * aquí dejaría a los alumnos ya inscritos con un ritmo distinto del que
 * compraron. Ver `OverrideModalidad` en site-config-core.ts.
 *
 * Y NO SE PUEDE APAGAR EL ÚLTIMO PLAN ACTIVO: sin ninguno, la landing se queda
 * sin tarjetas de precio y el registro sin nada que elegir.
 */
import { BadgeDollarSign, Layers } from 'lucide-react'
import { LIMITES, campoPorClave } from '@/lib/site-config-campos'
import {
  escribirModalidad,
  escribirRuta,
  estaSobrescrito,
  formatoMXN,
  modalidadesEfectivas,
  puedeDesactivar,
  quitarRuta,
  valorEfectivo,
} from '@/lib/site-config-editor'
import { CampoEntero } from './CampoTexto'
import {
  Ayuda,
  BotonRestaurar,
  FIELD_BG,
  TXT,
  TXT_SUAVE,
  TXT_TENUE,
  Tarjeta,
  idDeCampo,
  type PropsPestana,
} from './Comunes'

const ICONO = { className: 'w-4 h-4', style: { color: 'var(--color-acento)' } }

/** El mismo número, en pesos, junto al input. */
function EnPesos({ valor }: { valor: number }) {
  return (
    <span className="text-sm font-semibold tabular-nums" style={{ color: '#10B981' }}>
      {formatoMXN(valor)}
    </span>
  )
}

function Interruptor({
  id,
  activo,
  deshabilitado,
  titulo,
  onCambiar,
}: {
  id: string
  activo: boolean
  deshabilitado: boolean
  titulo: string
  onCambiar: (v: boolean) => void
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={titulo}
      title={titulo}
      disabled={deshabilitado}
      onClick={() => onCambiar(!activo)}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: activo ? 'var(--color-acento)' : '#334155' }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: activo ? '1.375rem' : '0.125rem' }}
        aria-hidden="true"
      />
    </button>
  )
}

export function PestanaPrecios({
  defaults, overrides, actualizar, puedeEditar, claveConError,
}: PropsPestana) {
  const mods = modalidadesEfectivas(defaults.modalidades, overrides.modalidades)

  function campoPrecio(clave: string) {
    const campo = campoPorClave(clave)
    const valor = valorEfectivo(defaults, overrides, clave)
    const numero = typeof valor === 'number' ? valor : 0
    return (
      <CampoEntero
        clave={clave}
        etiqueta={campo?.etiqueta ?? clave}
        ayuda={campo?.ayuda}
        valor={numero}
        min={campo?.min ?? LIMITES.precioMin}
        max={campo?.max ?? LIMITES.precioMax}
        sufijo={<EnPesos valor={numero} />}
        deshabilitado={!puedeEditar}
        sobrescrito={estaSobrescrito(overrides, clave)}
        resaltado={claveConError === clave}
        onChange={(n) => actualizar((prev) => escribirRuta(prev, clave, n))}
        onRestaurar={() => actualizar((prev) => quitarRuta(prev, clave))}
      />
    )
  }

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Inscripción" icono={<BadgeDollarSign {...ICONO} aria-hidden="true" />}>
        {campoPrecio('precios.inscripcion')}
      </Tarjeta>

      <Tarjeta
        titulo="Planes"
        icono={<Layers {...ICONO} aria-hidden="true" />}
        descripcion="La duración y las materias por mes no se editan: definen el programa."
      >
        <div className="space-y-3">
          {mods.map((m) => {
            const claveMensualidad = `modalidades.${m.id}.mensualidad`
            const override = overrides.modalidades?.[m.id]
            const sePuedeApagar = puedeDesactivar(mods, m.id)
            // El servidor rechaza los planes con la clave `modalidades.<id>`
            // (ver validarModalidades), así que ESA es la que hay que poder
            // enfocar: el contenedor la lleva y admite foco programático.
            const errorAqui = claveConError === 'modalidades' || claveConError === `modalidades.${m.id}`
            return (
              <div
                key={m.id}
                id={idDeCampo(`modalidades.${m.id}`)}
                tabIndex={-1}
                className="rounded-xl p-4 space-y-3"
                style={{ ...FIELD_BG, ...(errorAqui ? { border: '1px solid #EF4444' } : {}) }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: TXT }}>{m.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: TXT_TENUE }}>
                      {m.meses} {m.meses === 1 ? 'mes' : 'meses'} · {m.materiasPorMes} materias por mes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: TXT_SUAVE }}>
                      {m.activa ? 'Activo' : 'Apagado'}
                    </span>
                    <Interruptor
                      id={idDeCampo(`modalidades.${m.id}.activa`)}
                      activo={m.activa}
                      // Apagar el último activo se bloquea; encenderlo siempre
                      // se puede, así que solo se deshabilita en ese caso.
                      deshabilitado={!puedeEditar || (m.activa && !sePuedeApagar)}
                      titulo={
                        m.activa && !sePuedeApagar
                          ? 'Debe quedar al menos una modalidad activa'
                          : `${m.activa ? 'Apagar' : 'Encender'} el plan ${m.label}`
                      }
                      onCambiar={(v) => actualizar((prev) => escribirModalidad(prev, m.id, { activa: v }))}
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <CampoEntero
                    clave={claveMensualidad}
                    etiqueta="Mensualidad"
                    valor={m.mensualidad}
                    min={LIMITES.precioMin}
                    max={LIMITES.precioMax}
                    sufijo={<EnPesos valor={m.mensualidad} />}
                    deshabilitado={!puedeEditar}
                    resaltado={errorAqui}
                    onChange={(n) => actualizar((prev) => escribirModalidad(prev, m.id, { mensualidad: n }))}
                  />
                  {override && puedeEditar && (
                    <BotonRestaurar
                      onClick={() => actualizar((prev) => escribirModalidad(prev, m.id, { mensualidad: null, activa: null }))}
                      etiqueta={`el plan ${m.label}`}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {mods.filter((m) => m.activa).length === 1 && (
          <Ayuda>
            Solo queda un plan activo, por eso no se puede apagar. Enciende otro
            primero si necesitas cambiarlo.
          </Ayuda>
        )}
      </Tarjeta>

      <Tarjeta titulo="Certificación" icono={<BadgeDollarSign {...ICONO} aria-hidden="true" />}>
        {campoPrecio('precios.certificacionSecundaria')}
        {campoPrecio('precios.certificacionPreparatoria')}
      </Tarjeta>

      <div className="px-4 py-3 rounded-xl text-xs leading-relaxed"
        style={{ background: 'rgba(21,101,192,0.08)', border: `1px solid rgba(21,101,192,0.2)`, color: TXT_SUAVE }}>
        Estos precios se usan en tu página pública, en el registro y en los
        montos sugeridos del sistema.
      </div>
    </div>
  )
}
