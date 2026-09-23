'use client'

/**
 * Pestaña "Precios": inscripción y mensualidad de cada plan. La tarjeta de las
 * dos certificaciones solo aparece si la escuela las ofrece
 * (`CONFIG.ofreceCertificacion`, que nace en `true`).
 *
 * DE UN PLAN SOLO SE EDITAN DOS COSAS: la mensualidad y si está activo. La
 * duración y las materias por mes definen el PRODUCTO (cuántas materias se
 * abren cada mes, cuántos pagos hay) y viven en config.ts; cambiarlas desde
 * aquí dejaría a los alumnos ya inscritos con un ritmo distinto del que
 * compraron. Ver `OverrideModalidad` en site-config-core.ts.
 *
 * Y NO SE PUEDE APAGAR EL ÚLTIMO PLAN ACTIVO: sin ninguno, la landing se queda
 * sin tarjetas de precio y el registro sin nada que elegir.
 *
 * Además: el tipo de cambio, solo si la escuela no cobra en pesos, y una
 * tarjeta que lleva a /admin/cursos, porque el precio de cada curso o
 * diplomado se edita en su ficha (Fase 2, F2-3).
 */
import Link from 'next/link'
import { ArrowLeftRight, BadgeDollarSign, ExternalLink, GraduationCap, Layers } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { esSoloCursos } from '@/lib/modo'
import { esSemanal } from '@/lib/periodicidad'
import { equivalenteMXN, type Moneda } from '@/lib/moneda'
import { LIMITES, campoPorClave } from '@/lib/site-config-campos'
import { AYUDA_CUOTA_SEMANAL, NOTA_PRECIOS } from '@/lib/site-config-textos'
import {
  escribirModalidad,
  escribirRuta,
  estaSobrescrito,
  formatoDinero,
  modalidadesEfectivas,
  puedeDesactivar,
  quitarRuta,
  valorEfectivo,
} from '@/lib/site-config-editor'
import { CampoDecimal, CampoEntero } from './CampoTexto'
import {
  Ayuda,
  BOTON_SECUNDARIO,
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

/**
 * Las cifras semanales de un plan.
 *
 * Se leen con un cast porque `SiteConfig` se deriva del `CONFIG` de FÁBRICA,
 * que es mensual y no declara estas claves. En el clon de una escuela semanal
 * sí existen. Es el mismo recurso que usa `aplicarModalidades` en core.
 */
function cuotaDe(m: unknown): number {
  return Number((m as { cuotaSemanal?: number }).cuotaSemanal ?? 0)
}
function semanasDe(m: unknown): number {
  return Number((m as { semanas?: number }).semanas ?? 0)
}

/** El mismo número, ya formateado, junto al input. */
function EnPesos({ valor, moneda }: { valor: number; moneda: Moneda }) {
  return (
    <span className="text-sm font-semibold tabular-nums" style={{ color: '#10B981' }}>
      {formatoDinero(valor, moneda)}
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
  // Fijo por config, no editable: la periodicidad no la cambia el admin desde
  // aquí (ver la nota de `periodicidad` en config.ts).
  const semanal = esSemanal()

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
        sufijo={<EnPesos valor={numero} moneda={CONFIG.moneda} />}
        deshabilitado={!puedeEditar}
        sobrescrito={estaSobrescrito(overrides, clave)}
        resaltado={claveConError === clave}
        onChange={(n) => actualizar((prev) => escribirRuta(prev, clave, n))}
        onRestaurar={() => actualizar((prev) => quitarRuta(prev, clave))}
      />
    )
  }

  function campoTipoCambio() {
    const clave = 'tipoCambioMXN'
    const campo = campoPorClave(clave)
    const valor = valorEfectivo(defaults, overrides, clave)
    const tipoCambio = typeof valor === 'number' ? valor : 0
    // El ejemplo sale de `equivalenteMXN`, la MISMA función que pinta las
    // equivalencias que ve el alumno: con 0 devuelve null y no se muestra nada.
    const ejemplo = equivalenteMXN(100, { moneda: CONFIG.moneda, tipoCambioMXN: tipoCambio })
    return (
      <CampoDecimal
        clave={clave}
        etiqueta={campo?.etiqueta ?? clave}
        ayuda={campo?.ayuda}
        valor={tipoCambio}
        min={campo?.min ?? LIMITES.tipoCambioMin}
        max={campo?.max ?? LIMITES.tipoCambioMax}
        sufijo={
          <p className="text-xs tabular-nums" style={{ color: TXT_SUAVE }}>
            {ejemplo
              ? `Ejemplo: ${formatoDinero(100, CONFIG.moneda)} ${ejemplo}`
              : 'No se mostrará equivalencia en pesos.'}
          </p>
        }
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
                      {semanal && semanasDe(m) > 0 && ` · ${semanasDe(m)} pagos semanales`}
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
                  {/* 🛑 En una escuela SEMANAL este campo edita `cuotaSemanal`,
                      no `mensualidad`. Antes rotulaba "Mensualidad" y escribía
                      en una clave que su app no lee para cobrar: el admin
                      publicaba un precio nuevo y no cambiaba absolutamente nada.
                      Pasó en RHEMA #193 y EDUHCO #197, los dos en producción. */}
                  <CampoEntero
                    clave={semanal ? `modalidades.${m.id}.cuotaSemanal` : claveMensualidad}
                    etiqueta={semanal ? 'Cuota semanal' : 'Mensualidad'}
                    valor={semanal ? cuotaDe(m) : m.mensualidad}
                    // La cuota semanal tiene sus propios límites
                    // (`LIMITES.cuotaSemanalMin/Max`), los mismos que usa el validador.
                    min={semanal ? LIMITES.cuotaSemanalMin : LIMITES.precioMin}
                    max={semanal ? LIMITES.cuotaSemanalMax : LIMITES.precioMax}
                    sufijo={<EnPesos valor={semanal ? cuotaDe(m) : m.mensualidad} moneda={CONFIG.moneda} />}
                    deshabilitado={!puedeEditar}
                    resaltado={errorAqui}
                    onChange={(n) => actualizar((prev) => escribirModalidad(
                      prev, m.id, semanal ? { cuotaSemanal: n } : { mensualidad: n },
                    ))}
                  />
                  {override && puedeEditar && (
                    <BotonRestaurar
                      onClick={() => actualizar((prev) => escribirModalidad(
                        prev, m.id, { mensualidad: null, cuotaSemanal: null, activa: null },
                      ))}
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
        {/* Antes prometía que la cuota de un alumno inscrito nunca cambia: no
            es cierto después de "Regenerar" en Cobranza, que rehace las
            semanas pendientes y vencidas con la cuota vigente. */}
        {semanal && <Ayuda>{AYUDA_CUOTA_SEMANAL}</Ayuda>}
      </Tarjeta>

      {/* 🛑 GATEADA POR `ofreceCertificacion` (Bug P-8). Una escuela que no
          certifica no debe ver en su panel una tarjeta que le pide ponerle
          precio a la certificación: es la vía más corta para que alguien teclee
          una cifra y dé por hecho que el servicio existe.

          Las DOS CLAVES siguen en `CLAVES_EDITABLES` y en el catálogo de
          `site-config-campos.ts` a propósito — quitarlas de ahí dejaría huérfano
          cualquier override ya guardado y rompería "Restaurar diseño original".
          Lo único que cambia es que esta tarjeta no se dibuja.

          Con la bandera en `true`, que es el default, la pestaña se ve
          exactamente igual que antes de este cambio. */}
      {CONFIG.ofreceCertificacion && (
        <Tarjeta titulo="Certificación" icono={<BadgeDollarSign {...ICONO} aria-hidden="true" />}>
          {campoPrecio('precios.certificacionSecundaria')}
          {campoPrecio('precios.certificacionPreparatoria')}
        </Tarjeta>
      )}

      {/* 🛑 Solo si la escuela NO cobra en pesos. La clave es editable desde
          siempre (CLAVES_EDITABLES) y config.ts decía que el admin la cambia
          aquí, pero ninguna pestaña la pintaba: una escuela en USD no tenía
          forma de mantener al día sus equivalencias en pesos. */}
      {CONFIG.moneda !== 'MXN' && (
        <Tarjeta titulo="Tipo de cambio" icono={<ArrowLeftRight {...ICONO} aria-hidden="true" />}>
          {campoTipoCambio()}
        </Tarjeta>
      )}

      {/* Los cursos y diplomados tienen su precio en su propia ficha, no aquí.
          Solo con permiso de edición: la ruta de cursos exige ADMIN.
          Se abre en OTRA pestaña: el borrador del editor vive solo en memoria
          y la navegación interna no dispara el aviso de `beforeunload`, así
          que un clic aquí perdería los cambios sin publicar. */}
      {puedeEditar && (
        <Tarjeta
          titulo={esSoloCursos() ? 'Diplomados' : 'Cursos y diplomados'}
          icono={<GraduationCap {...ICONO} aria-hidden="true" />}
        >
          <p className="text-xs leading-relaxed" style={{ color: TXT_SUAVE }}>
            El precio de cada curso o diplomado (inscripción y mensualidad) se edita en su propia ficha, no aquí.
          </p>
          <Link
            href="/admin/cursos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={BOTON_SECUNDARIO}
          >
            {esSoloCursos() ? 'Ir a Diplomados' : 'Ir a Gestionar cursos'}
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </Tarjeta>
      )}

      <div className="px-4 py-3 rounded-xl text-xs leading-relaxed"
        style={{ background: 'rgba(21,101,192,0.08)', border: `1px solid rgba(21,101,192,0.2)`, color: TXT_SUAVE }}>
        {NOTA_PRECIOS}
      </div>
    </div>
  )
}
