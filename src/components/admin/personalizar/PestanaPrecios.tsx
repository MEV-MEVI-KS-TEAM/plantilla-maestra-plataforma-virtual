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
 *
 * PRECIOS POR NIVEL (Fase 2, F2-9). En una escuela que vende Secundaria y
 * Preparatoria, la inscripción y la mensualidad de los planes de 3 y 6
 * meses se pueden fijar por nivel. Son OPCIONALES: un campo vacío sigue la
 * general de hoy, y con los seis vacíos la escuela cobra exactamente lo de
 * antes. No hay campo por nivel en los planes con `nivel` (ya son de uno
 * solo), en los de otra duración ni en una escuela semanal.
 *
 * LICENCIATURAS (Bloque B, B3). Solo si la escuela las vende
 * (`ofreceLicenciaturas`: add-on encendido con carreras, NUNCA `CONFIG.niveles`).
 * Entonces las tres tarjetas de arriba se rotulan «· Secundaria y
 * Preparatoria» y aparece la tarjeta «Licenciaturas»: inscripción, titulación
 * y la mensualidad de cada plan, cada una OPCIONAL (vacío = la cifra de
 * config.ts, con el marcador «Vacío: usa el de fábrica, $X»). Sin interruptor
 * ni `activa`: los planes de licenciatura son el producto. Las claves son
 * `licenciaturas.*`, así que sus ids en la página nunca chocan con los de
 * `modalidades.<id>` (hay clones con '6_meses' en las dos tablas). Las
 * etiquetas de los campos de Sec/Prepa NO cambian: la e2e las busca ancladas.
 */
import Link from 'next/link'
import { ArrowLeftRight, BadgeDollarSign, ExternalLink, GraduationCap, Landmark, Layers } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { esSoloCursos } from '@/lib/modo'
import { esSemanal } from '@/lib/periodicidad'
import { equivalenteMXN, type Moneda } from '@/lib/moneda'
import { LIMITES, campoPorClave } from '@/lib/site-config-campos'
import {
  AVISO_LIC_FORMA_PROPIA,
  AYUDA_CUOTA_SEMANAL,
  AYUDA_INSCRIPCION_SEC_PREPA,
  AYUDA_INSCRIPCION_SEC_PREPA_SIN_CAMPO,
  AYUDA_LIC_INSCRIPCION,
  AYUDA_LIC_MENSUALIDAD,
  AYUDA_LIC_MENSUALIDAD_CERO,
  AYUDA_LIC_PLANES_FORMA_PROPIA,
  AYUDA_LIC_SIN_PLANES,
  AYUDA_LIC_TITULACION,
  AYUDA_NIVEL_CIFRA_PROPIA,
  AYUDA_NIVEL_DE_FABRICA,
  NOTA_PRECIOS,
  NOTA_PRECIOS_POR_NIVEL,
  notaPreciosLicenciatura,
} from '@/lib/site-config-textos'
import {
  bloqueLicEditable,
  inscripcionLicEditable,
  planesLicEditables,
  titulacionLicEditable,
} from '@/lib/precios-licenciatura'
import { landingAnimadaActiva } from '@/lib/landing-estilo'
import { unirConO } from '@/components/landing/animada/textos-licenciatura'
import { CLAVE_INSCRIPCION_POR_NIVEL, CLAVE_MENSUALIDAD_POR_NIVEL, type NivelConPrecio } from '@/lib/precios-nivel'
import {
  clavesPorNivelDePlan,
  escribirModalidad,
  ofreceLicenciaturas,
  precioLicenciaturaEfectivo,
  seccionLicenciaturaVisible,
  rutaLicenciatura,
  textoVacioErrorLicenciatura,
  textoVacioLicenciatura,
  tituloSecPrepa,
  type CampoLicenciatura,
  escribirRuta,
  estaSobrescrito,
  formatoDinero,
  modalidadesEfectivas,
  planSobrescrito,
  precioNivelEfectivo,
  precioNivelSobrescrito,
  preciosPorNivelVisibles,
  puedeDesactivar,
  quitarRuta,
  restaurarPlan,
  textoVacioError,
  textoVacioNivel,
  valorEfectivo,
} from '@/lib/site-config-editor'
import { CampoDecimal, CampoEntero, CampoPrecioNivel } from './CampoTexto'
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

const NIVELES_CON_PRECIO: readonly NivelConPrecio[] = ['secundaria', 'preparatoria']

/** El rótulo de un subbloque de campos por nivel. */
function Subtitulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide pt-1" style={{ color: TXT_TENUE }}>
      {children}
    </p>
  )
}

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

/**
 * Lo que cobra un precio de licenciatura, junto al input. Un 0 no es «$0»:
 * la inscripción o la titulación en 0 es «Sin costo», y una mensualidad en 0 es
 * un plan «Sin precio» todavía (la landing no lo muestra).
 */
function CobraLicenciatura({ valor, moneda, mensualidad }: { valor: number; moneda: Moneda; mensualidad: boolean }) {
  if (valor > 0) return <EnPesos valor={valor} moneda={moneda} />
  return (
    <span className="text-sm font-semibold" style={{ color: TXT_SUAVE }}>
      {mensualidad ? 'Sin precio' : 'Sin costo'}
    </span>
  )
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
  // Solo con Secundaria Y Preparatoria (y fuera de solo cursos): con un
  // nivel, «por nivel» y «general» serían el mismo campo dos veces.
  const porNivel = preciosPorNivelVisibles()
  // Licenciaturas: solo si la escuela las vende. Los precios se publican sobre
  // la forma estándar de la plantilla; con una forma propia, la tarjeta lo dice.
  const conLic = ofreceLicenciaturas()
  const tablaLic = (CONFIG as unknown as { licenciaturas?: unknown }).licenciaturas
  const licEditable = conLic && bloqueLicEditable(tablaLic)
  const planesLic = licEditable ? planesLicEditables(tablaLic) : []
  // ¿Hay planes, aunque ninguno se pueda editar? Entonces no es «sin planes».
  const hayPlanesLic = Array.isArray((tablaLic as { modalidades?: unknown } | undefined)?.modalidades)
    && ((tablaLic as { modalidades: unknown[] }).modalidades.length > 0)
  const inscripcionLicEnPanel = licEditable && inscripcionLicEditable(tablaLic)
  /** «12 o 18 meses», «6, 12 o 18 meses»: por su duración, nunca por periodos. */
  const ritmosLic = `${unirConO([...new Set(planesLic.map((p) => p.meses))].sort((a, b) => a - b).map(String))} meses`

  function campoPrecio(clave: string, etiqueta?: string) {
    const campo = campoPorClave(clave)
    const valor = valorEfectivo(defaults, overrides, clave)
    const numero = typeof valor === 'number' ? valor : 0
    return (
      <CampoEntero
        clave={clave}
        etiqueta={etiqueta ?? campo?.etiqueta ?? clave}
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

  /**
   * Un precio por nivel: vacío = sigue la general. El marcador y la cifra de
   * la derecha salen de `precioNivelEfectivo`, el MISMO resolver que la
   * landing, así que dicen lo que el nivel cobraría de verdad (incluido el
   * alias de secundaria de SAMEX o AULA RAÍZ, que `defaults` no trae).
   */
  function campoNivel(clave: string, nivel: NivelConPrecio, plan?: { id: string; mensualidad: number }) {
    const campo = campoPorClave(clave)
    const destino = { clave, nivel, planId: plan?.id }
    const siVacio = precioNivelEfectivo(overrides, destino, { vacio: true })
    const cobra = precioNivelEfectivo(overrides, destino)
    // Un clon cuyo config.ts ya trae la clave con cifra: vaciar el campo
    // vuelve a esa cifra, no a la general. Y la secundaria de SAMEX o AULA
    // RAÍZ no sigue la «Mensualidad general» del plan sino su alias.
    const origen = Number(valorEfectivo(defaults, {}, clave)) > 0 ? 'fabrica'
      : plan && siVacio !== plan.mensualidad ? 'hoy' : 'general'
    return (
      <CampoPrecioNivel
        key={clave}
        clave={clave}
        etiqueta={campo?.etiqueta ?? clave}
        ayuda={origen === 'fabrica' ? AYUDA_NIVEL_DE_FABRICA
          : origen === 'hoy' ? `${campo?.ayuda ?? ''} ${AYUDA_NIVEL_CIFRA_PROPIA}`.trim()
          : campo?.ayuda}
        valor={valorEfectivo({}, overrides, clave)}
        vacio={textoVacioNivel(siVacio, CONFIG.moneda, origen)}
        vacioError={textoVacioError(siVacio, CONFIG.moneda, origen)}
        min={campo?.min ?? LIMITES.precioNivelMin}
        max={campo?.max ?? LIMITES.precioMax}
        sufijo={<EnPesos valor={cobra} moneda={CONFIG.moneda} />}
        deshabilitado={!puedeEditar}
        sobrescrito={precioNivelSobrescrito(overrides, clave)}
        resaltado={claveConError === clave}
        onChange={(n) => actualizar((prev) => escribirRuta(prev, clave, n))}
        onVaciar={() => actualizar((prev) => quitarRuta(prev, clave))}
        onReponer={(crudo) => actualizar((prev) => escribirRuta(prev, clave, crudo))}
        onRestaurar={() => actualizar((prev) => quitarRuta(prev, clave))}
      />
    )
  }

  /**
   * Un precio de licenciatura: vacío = la cifra de config.ts. Gemelo de
   * `campoNivel`: el marcador y la cifra de la derecha salen de
   * `precioLicenciaturaEfectivo`, el mismo bloque efectivo que leen la landing,
   * la ficha y el PDF. Nunca escribe `null` ni 0: vaciar quita la clave.
   */
  function campoLic(campo: CampoLicenciatura, etiqueta: string, ayuda: string) {
    const ruta = rutaLicenciatura(campo)
    const catalogo = campoPorClave(campo.tipo === 'mensualidad' ? 'licenciaturas.modalidades' : campo.clave)
    const siVacio = precioLicenciaturaEfectivo(overrides, campo, { vacio: true })
    const cobra = precioLicenciaturaEfectivo(overrides, campo)
    const sobrescrito = precioNivelSobrescrito(overrides, ruta)
    return (
      <CampoPrecioNivel
        key={campo.clave}
        clave={campo.clave}
        etiqueta={etiqueta}
        ayuda={campo.tipo === 'mensualidad' && siVacio <= 0 && !sobrescrito ? `${ayuda} ${AYUDA_LIC_MENSUALIDAD_CERO}` : ayuda}
        valor={valorEfectivo({}, overrides, ruta)}
        vacio={textoVacioLicenciatura(siVacio, campo.tipo, CONFIG.moneda)}
        vacioError={textoVacioErrorLicenciatura(siVacio, campo.tipo, CONFIG.moneda)}
        min={catalogo?.min ?? LIMITES.precioMin}
        max={catalogo?.max ?? LIMITES.precioMax}
        sufijo={<CobraLicenciatura valor={cobra} moneda={CONFIG.moneda} mensualidad={campo.tipo === 'mensualidad'} />}
        deshabilitado={!puedeEditar}
        sobrescrito={sobrescrito}
        resaltado={claveConError === campo.clave}
        onChange={(n) => actualizar((prev) => escribirRuta(prev, ruta, n))}
        onVaciar={() => actualizar((prev) => quitarRuta(prev, ruta))}
        onReponer={(crudo) => actualizar((prev) => escribirRuta(prev, ruta, crudo))}
        onRestaurar={() => actualizar((prev) => quitarRuta(prev, ruta))}
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
      <Tarjeta
        titulo={tituloSecPrepa('Inscripción', conLic)}
        icono={<BadgeDollarSign {...ICONO} aria-hidden="true" />}
        descripcion={conLic ? (inscripcionLicEnPanel ? AYUDA_INSCRIPCION_SEC_PREPA : AYUDA_INSCRIPCION_SEC_PREPA_SIN_CAMPO) : undefined}
      >
        {campoPrecio('precios.inscripcion', porNivel ? 'Inscripción general' : undefined)}
        {porNivel && (
          <div className="space-y-3">
            <Subtitulo>Por nivel (opcional)</Subtitulo>
            {NIVELES_CON_PRECIO.map((n) => campoNivel(`precios.${CLAVE_INSCRIPCION_POR_NIVEL[n]}`, n))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta
        titulo={tituloSecPrepa('Planes', conLic)}
        icono={<Layers {...ICONO} aria-hidden="true" />}
        descripcion="La duración y las materias por mes no se editan: definen el programa."
      >
        <div className="space-y-3">
          {mods.map((m) => {
            const claveMensualidad = `modalidades.${m.id}.mensualidad`
            const sePuedeApagar = puedeDesactivar(mods, m.id)
            // El servidor rechaza los planes con la clave `modalidades.<id>`
            // (ver validarModalidades), así que ESA es la que hay que poder
            // enfocar: el contenedor la lleva y admite foco programático.
            const errorAqui = claveConError === 'modalidades' || claveConError === `modalidades.${m.id}`
            // Las claves por nivel de ESTE plan (vacío si otro plan de la misma
            // duración ya las lleva: la clave es por duración, no por plan).
            const clavesNivel = clavesPorNivelDePlan(m, mods)
            const conSubbloque = !semanal && porNivel && !m.nivel && clavesNivel.length > 0
            const restaurable = planSobrescrito(overrides, m, mods)
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
                    etiqueta={semanal ? 'Cuota semanal' : conSubbloque ? 'Mensualidad general' : 'Mensualidad'}
                    valor={semanal ? cuotaDe(m) : m.mensualidad}
                    // La cuota semanal tiene sus propios límites
                    // (`LIMITES.cuotaSemanalMin/Max`), los mismos que usa el validador.
                    min={semanal ? LIMITES.cuotaSemanalMin : LIMITES.precioMin}
                    max={semanal ? LIMITES.cuotaSemanalMax : LIMITES.precioMax}
                    sufijo={<EnPesos valor={semanal ? cuotaDe(m) : m.mensualidad} moneda={CONFIG.moneda} />}
                    deshabilitado={!puedeEditar}
                    resaltado={errorAqui}
                    // Sin botón propio (la caja ya tiene «Restaurar plan»), pero
                    // al salir con basura de un campo sin override se quita SU
                    // clave en vez de fijar la cifra de fábrica como override.
                    sobrescrito={overrides.modalidades?.[m.id]?.[semanal ? 'cuotaSemanal' : 'mensualidad'] !== undefined}
                    onChange={(n) => actualizar((prev) => escribirModalidad(
                      prev, m.id, semanal ? { cuotaSemanal: n } : { mensualidad: n },
                    ))}
                    onDescartar={() => actualizar((prev) => escribirModalidad(
                      prev, m.id, semanal ? { cuotaSemanal: null } : { mensualidad: null },
                    ))}
                  />
                  {/* Sale aunque solo haya una clave por nivel sobrescrita: sin
                      eso, un precio por nivel guardado no tendría forma de
                      deshacerse desde la caja que el escalón señala. */}
                  {restaurable && puedeEditar && (
                    <BotonRestaurar
                      onClick={() => actualizar((prev) => restaurarPlan(prev, m, mods))}
                      etiqueta={`el plan ${m.label}`}
                    />
                  )}
                </div>

                {conSubbloque && (
                  <div className="space-y-3">
                    <Subtitulo>Precio por nivel (opcional)</Subtitulo>
                    {NIVELES_CON_PRECIO.map((n) => campoNivel(
                      `precios.${CLAVE_MENSUALIDAD_POR_NIVEL[n][m.meses as 3 | 6]}`, n, m,
                    ))}
                  </div>
                )}
                {/* Otro plan de la misma duración ya lleva los campos (Habsburgo:
                    «6 Meses» y «Acceso completo»). La clave es por duración, así
                    que ese precio también se cobra aquí: se dice, no se esconde. */}
                {!semanal && porNivel && !m.nivel && clavesNivel.length === 0 && (m.meses === 3 || m.meses === 6) && (
                  <Ayuda>
                    El precio por nivel de {m.meses} meses se fija en el plan
                    «{mods.find((p) => p.meses === m.meses && !p.nivel)?.label}» y también se cobra en este.
                  </Ayuda>
                )}
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
        <Tarjeta titulo={tituloSecPrepa('Certificación', conLic)} icono={<BadgeDollarSign {...ICONO} aria-hidden="true" />}>
          {campoPrecio('precios.certificacionSecundaria')}
          {campoPrecio('precios.certificacionPreparatoria')}
        </Tarjeta>
      )}

      {/* Bloque B, B3. No va gateada por `ofreceCertificacion`: la titulación
          es parte del costo de la licenciatura y la landing la pinta siempre. */}
      {conLic && (
        <Tarjeta
          titulo="Licenciaturas"
          icono={<Landmark {...ICONO} aria-hidden="true" />}
          descripcion={planesLic.length > 0
            ? `Planes de ${ritmosLic}. La duración y las materias por mes no se editan: definen el programa.`
            : undefined}
        >
          {!licEditable ? (
            <Ayuda>{AVISO_LIC_FORMA_PROPIA}</Ayuda>
          ) : (
            <>
              {inscripcionLicEnPanel &&
                campoLic({ clave: 'licenciaturas.inscripcion', tipo: 'inscripcion' }, 'Inscripción de licenciatura', AYUDA_LIC_INSCRIPCION)}
              {titulacionLicEditable(tablaLic) &&
                campoLic({ clave: 'licenciaturas.certificacion', tipo: 'titulacion' }, 'Titulación', AYUDA_LIC_TITULACION)}
              {planesLic.length === 0 ? (
                <Ayuda>{hayPlanesLic ? AYUDA_LIC_PLANES_FORMA_PROPIA : AYUDA_LIC_SIN_PLANES}</Ayuda>
              ) : (
                <div className="space-y-3">
                  <Subtitulo>Mensualidad por plan</Subtitulo>
                  {planesLic.map((p) => (
                    <div key={p.id} className="rounded-xl p-4 space-y-3" style={FIELD_BG}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: TXT }}>{String(p.label ?? p.id)}</p>
                        <p className="text-xs mt-0.5" style={{ color: TXT_TENUE }}>
                          {p.meses} {p.meses === 1 ? 'mes' : 'meses'}
                          {typeof p.materiasPorMes === 'number' && ` · ${p.materiasPorMes} materias por mes`}
                        </p>
                      </div>
                      {campoLic(
                        { clave: `licenciaturas.modalidades.${p.id}`, tipo: 'mensualidad', planId: p.id },
                        `Mensualidad · ${String(p.label ?? p.id)}`,
                        AYUDA_LIC_MENSUALIDAD,
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
        {porNivel && ` ${NOTA_PRECIOS_POR_NIVEL}`}
        {conLic && ` ${notaPreciosLicenciatura(!landingAnimadaActiva() ? 'clasica' : seccionLicenciaturaVisible(overrides) ? 'animada' : 'sinSeccion')}`}
      </div>
    </div>
  )
}
