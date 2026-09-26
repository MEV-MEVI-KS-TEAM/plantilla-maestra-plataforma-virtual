'use client'

/**
 * "Textos de mi página" → tarjeta Licenciaturas (TICKET-2026-09-22-08).
 *
 * Solo se pinta con `CONFIG.licenciaturas.activas` (lo decide PestanaTextos).
 *
 * Por qué no usa la `ListaObjetos` genérica: las dos listas de la sección
 * tienen FILAS FIJAS —una por carrera del config, casada por `slug`, y los 4
 * pasos de "Cómo funciona"—. Con la lista genérica el admin podría añadir una
 * carrera que no existe, borrar una fila o reescribir el slug. Aquí cada fila
 * sale del config y el admin solo escribe los textos.
 *
 * VACÍO = AUTOMÁTICO. Cada campo enseña de placeholder el texto que la landing
 * pinta hoy (`textosAutoLicenciaturas`, con los precios calculados); dejarlo
 * vacío lo conserva. Las filas que quedan vacías no se guardan y, si no queda
 * ninguna, la clave entera se quita de los overrides.
 *
 * 🛑 El "nombre visible" solo cambia la tarjeta de la landing. El nombre real y
 *    el slug de la carrera (registro, panel, materias, constancias) viven en
 *    `CONFIG.licenciaturas` y no se tocan desde aquí.
 */
import { CONFIG } from '@/lib/config'
import type { Campo } from '@/lib/site-config-campos'
import { formatearMoneda } from '@/lib/moneda'
import { textoInscripcion } from '@/lib/precios-ui'
import {
  getCarrerasLicenciatura,
  getDesglosesLicenciatura,
  getEtiquetaLicenciatura,
} from '@/lib/licenciatura-utils'
import {
  escribirRuta,
  estaSobrescrito,
  licenciaturaDeBorrador,
  quitarRuta,
  valorEfectivo,
} from '@/lib/site-config-editor'
import type { SiteConfigOverrides } from '@/lib/site-config-core'
import {
  PASOS_LICENCIATURA,
  textosAutoLicenciaturas,
  usaInscripcionGeneral,
  varsLicenciatura,
  type OverrideCarreraLanding,
  type OverridePasoLanding,
  type OverridesLicenciaturasLanding,
} from '@/components/landing/animada/textos-licenciatura'
import { CampoTexto } from './CampoTexto'
import { Aviso, Ayuda, TXT_SUAVE, type PropsPestana } from './Comunes'

const CLAVE_CARRERAS = 'landing.licenciaturas_carreras'
const CLAVE_PASOS = 'landing.licenciaturas_pasos'

/**
 * Los textos automáticos de la sección, para los placeholders. Con el
 * BORRADOR de precios de licenciatura (Bloque B): el paso «Inscripción única
 * de $X» dice la cifra que el admin está por publicar, no la de config.ts.
 */
export function autoLicenciaturas(overrides: SiteConfigOverrides = {}) {
  return textosAutoLicenciaturas(
    getCarrerasLicenciatura(),
    getDesglosesLicenciatura(licenciaturaDeBorrador(overrides) as Parameters<typeof getDesglosesLicenciatura>[0]),
    getEtiquetaLicenciatura(),
    (n) => formatearMoneda(n, CONFIG),
  )
}

/**
 * Arriba de la tarjeta «Licenciaturas»: los comodines de la sección (#195), con
 * la cifra que darían hoy (el BORRADOR de precios), y un aviso si algún texto de
 * la sección usa `{inscripcion}`, que aquí es la de Secundaria/Preparatoria.
 */
export function ComodinesLicenciatura({
  defaults, overrides = {},
}: Pick<PropsPestana, 'defaults'> & { overrides?: SiteConfigOverrides }) {
  const planes = getDesglosesLicenciatura(licenciaturaDeBorrador(overrides) as Parameters<typeof getDesglosesLicenciatura>[0])
  // Los mismos formatos que la página: {inscripcion} («sin costo» si no se cobra)
  // y las cifras de la sección para la titulación.
  const hoy = varsLicenciatura(planes, (n) => textoInscripcion(n, { minusculas: true }), (n) => formatearMoneda(n, CONFIG))
  // Los textos EFECTIVOS de la sección (config.ts con el borrador encima): el
  // {inscripcion} puede venir del config.ts del clon, no solo de lo escrito aquí.
  const efectivo = (k: string) => valorEfectivo(defaults, overrides, `landing.${k}`)
  const landing = {
    licenciaturas_kicker: efectivo('licenciaturas_kicker'),
    licenciaturas_titulo: efectivo('licenciaturas_titulo'),
    licenciaturas_subtitulo: efectivo('licenciaturas_subtitulo'),
    licenciaturas_pasos: efectivo('licenciaturas_pasos'),
    licenciaturas_carreras: efectivo('licenciaturas_carreras'),
  } as OverridesLicenciaturasLanding
  return (
    <div className="space-y-2">
      <Ayuda>
        En esta sección también puedes usar <code style={{ color: TXT_SUAVE }}>{'{inscripcionLicenciatura}'}</code>
        {hoy.inscripcionLicenciatura ? ` (hoy ${hoy.inscripcionLicenciatura})` : ''} y{' '}
        <code style={{ color: TXT_SUAVE }}>{'{titulacion}'}</code>
        {hoy.titulacion ? ` (hoy ${hoy.titulacion})` : ''}. Aquí <code>{'{inscripcion}'}</code> sigue siendo la
        inscripción general de Secundaria y Preparatoria.
      </Ayuda>
      {usaInscripcionGeneral(landing) && (
        <Aviso tono="alerta">
          Uno de tus textos de licenciatura usa <code>{'{inscripcion}'}</code>: esa es la inscripción general
          (Secundaria y Preparatoria), no la de licenciatura. Para la de licenciatura escribe{' '}
          <code>{'{inscripcionLicenciatura}'}</code>.
        </Aviso>
      )}
    </div>
  )
}

function comoLista<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === 'object' && x !== null) as T[]) : []
}

const lleno = (s: string | undefined) => typeof s === 'string' && s.trim() !== ''

type Props = Pick<PropsPestana, 'defaults' | 'overrides' | 'actualizar' | 'puedeEditar' | 'claveConError'> & {
  campoCarreras?: Campo
  campoPasos?: Campo
}

/** Las filas fijas de carreras y de pasos. Los 3 textos sueltos los pinta PestanaTextos. */
export function ListasLicenciaturas({
  defaults, overrides, actualizar, puedeEditar, claveConError, campoCarreras, campoPasos,
}: Props) {
  const auto = autoLicenciaturas(overrides)
  const carreras = getCarrerasLicenciatura()

  // ── Carreras: una fila por carrera del config, casada por slug ──────────
  const carrerasGuardadas = comoLista<OverrideCarreraLanding>(valorEfectivo(defaults, overrides, CLAVE_CARRERAS))
  const porSlug = new Map(carrerasGuardadas.map((c) => [c.slug, c]))

  function escribirCarrera(slug: string, campo: 'nombre' | 'desc', valor: string) {
    actualizar((prev) => {
      const actuales = comoLista<OverrideCarreraLanding>(valorEfectivo(defaults, prev, CLAVE_CARRERAS))
      const mapa = new Map(actuales.map((c) => [c.slug, { ...c }]))
      const fila = mapa.get(slug) ?? { slug, nombre: '', desc: '' }
      fila[campo] = valor
      mapa.set(slug, fila)
      // Orden del config; solo carreras que existen; sin filas vacías.
      const lista = carreras
        .map((c) => mapa.get(c.slug))
        .filter((c): c is OverrideCarreraLanding => !!c && (lleno(c.nombre) || lleno(c.desc)))
      return lista.length > 0 ? escribirRuta(prev, CLAVE_CARRERAS, lista) : quitarRuta(prev, CLAVE_CARRERAS)
    })
  }

  // ── Pasos: 4 filas fijas por posición ────────────────────────────────────
  const pasosGuardados = comoLista<OverridePasoLanding>(valorEfectivo(defaults, overrides, CLAVE_PASOS))

  function escribirPaso(i: number, campo: 'titulo' | 'desc', valor: string) {
    actualizar((prev) => {
      const actuales = comoLista<OverridePasoLanding>(valorEfectivo(defaults, prev, CLAVE_PASOS))
      const lista: OverridePasoLanding[] = Array.from({ length: PASOS_LICENCIATURA }, (_, k) => ({
        titulo: actuales[k]?.titulo ?? '',
        desc: actuales[k]?.desc ?? '',
      }))
      lista[i] = { ...lista[i], [campo]: valor }
      // La posición es el número de paso: se conservan los vacíos intermedios
      // y solo se recortan los del final.
      while (lista.length > 0 && !lleno(lista[lista.length - 1].titulo) && !lleno(lista[lista.length - 1].desc)) {
        lista.pop()
      }
      return lista.length > 0 ? escribirRuta(prev, CLAVE_PASOS, lista) : quitarRuta(prev, CLAVE_PASOS)
    })
  }

  const maxNombre = campoCarreras?.campos?.find((c) => c.clave === 'nombre')?.max ?? 80
  const maxDescCarrera = campoCarreras?.campos?.find((c) => c.clave === 'desc')?.max ?? 300
  const maxTituloPaso = campoPasos?.campos?.find((c) => c.clave === 'titulo')?.max ?? 60
  const maxDescPaso = campoPasos?.campos?.find((c) => c.clave === 'desc')?.max ?? 200

  return (
    <div className="space-y-6">
      {carreras.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: TXT_SUAVE }}>Tarjetas de carrera</p>
            {campoCarreras?.ayuda && <Ayuda>{campoCarreras.ayuda}</Ayuda>}
          </div>
          {carreras.map((c) => {
            const fila = porSlug.get(c.slug)
            const a = auto.carreras[c.slug] ?? { nombre: c.nombre, desc: c.desc }
            return (
              <div key={c.slug} className="space-y-3 rounded-lg p-3" style={{ border: '1px solid #2A2F3E' }}>
                <p className="text-xs" style={{ color: TXT_SUAVE }}>{c.nombre} <code>({c.slug})</code></p>
                <CampoTexto
                  clave={`${CLAVE_CARRERAS}.${c.slug}.nombre`}
                  etiqueta="Nombre visible"
                  valor={fila?.nombre ?? ''}
                  placeholder={a.nombre}
                  max={maxNombre}
                  deshabilitado={!puedeEditar}
                  resaltado={claveConError === CLAVE_CARRERAS}
                  onChange={(v) => escribirCarrera(c.slug, 'nombre', v)}
                />
                <CampoTexto
                  clave={`${CLAVE_CARRERAS}.${c.slug}.desc`}
                  etiqueta="Descripción"
                  valor={fila?.desc ?? ''}
                  placeholder={a.desc}
                  max={maxDescCarrera}
                  multilinea
                  deshabilitado={!puedeEditar}
                  resaltado={claveConError === CLAVE_CARRERAS}
                  onChange={(v) => escribirCarrera(c.slug, 'desc', v)}
                />
              </div>
            )
          })}
          {estaSobrescrito(overrides, CLAVE_CARRERAS) && puedeEditar && (
            <button type="button" className="text-xs underline" style={{ color: TXT_SUAVE }}
              onClick={() => actualizar((prev) => quitarRuta(prev, CLAVE_CARRERAS))}>
              Restaurar los textos automáticos de las carreras
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: TXT_SUAVE }}>Cómo funciona (4 pasos)</p>
          {campoPasos?.ayuda && <Ayuda>{campoPasos.ayuda}</Ayuda>}
        </div>
        {auto.pasos.map((p, i) => (
          <div key={i} className="space-y-3 rounded-lg p-3" style={{ border: '1px solid #2A2F3E' }}>
            <p className="text-xs" style={{ color: TXT_SUAVE }}>Paso {i + 1}</p>
            <CampoTexto
              clave={`${CLAVE_PASOS}.${i}.titulo`}
              etiqueta="Título"
              valor={pasosGuardados[i]?.titulo ?? ''}
              placeholder={p.titulo}
              max={maxTituloPaso}
              deshabilitado={!puedeEditar}
              resaltado={claveConError === CLAVE_PASOS}
              onChange={(v) => escribirPaso(i, 'titulo', v)}
            />
            <CampoTexto
              clave={`${CLAVE_PASOS}.${i}.desc`}
              etiqueta="Texto"
              valor={pasosGuardados[i]?.desc ?? ''}
              placeholder={p.desc}
              max={maxDescPaso}
              multilinea
              deshabilitado={!puedeEditar}
              resaltado={claveConError === CLAVE_PASOS}
              onChange={(v) => escribirPaso(i, 'desc', v)}
            />
          </div>
        ))}
        {estaSobrescrito(overrides, CLAVE_PASOS) && puedeEditar && (
          <button type="button" className="text-xs underline" style={{ color: TXT_SUAVE }}
            onClick={() => actualizar((prev) => quitarRuta(prev, CLAVE_PASOS))}>
            Restaurar los pasos automáticos
          </button>
        )}
      </div>
    </div>
  )
}
