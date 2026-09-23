'use client'

/**
 * Pestaña "Textos de mi página": todos los campos de la sección `landing` del
 * catálogo, en el orden en que se ven bajando por la página.
 *
 * Son los campos con `seccion: 'landing'` del catálogo, NO todas las
 * claves `landing.*`: `landing.cct` está catalogada en `identidad` y se edita
 * en esa pestaña, junto al CCT del sistema, porque son el mismo dato.
 *
 * El orden NO se decide aquí: se recorre `CAMPOS_POR_SECCION.landing` tal cual,
 * y los campos se agrupan en tarjetas por el prefijo de su clave (`hero_`,
 * `dolor_`, `faq_`…). Así, cuando F-siguiente añada un texto nuevo al
 * catálogo, aparece solo en su tarjeta y en su sitio, sin tocar este archivo.
 * Un campo con un prefijo que no reconozcamos cae en "Otros textos" en vez de
 * desaparecer, que es el fallo silencioso que sí importaría.
 *
 * LICENCIATURAS (TICKET-2026-09-22-08): la tarjeta solo existe si la escuela
 * tiene el add-on activo (`licenciaturasActivas()`). Sus tres textos sueltos se
 * pintan como cualquier otro, con el texto AUTOMÁTICO de placeholder; las
 * carreras y los 4 pasos tienen filas fijas (`ListasLicenciaturas`).
 */
import type { Campo } from '@/lib/site-config-campos'
import { CAMPOS_POR_SECCION } from '@/lib/site-config-campos'
import { PLACEHOLDERS } from '@/lib/site-config-core'
import { escribirRuta, estaSobrescrito, quitarRuta, valorEfectivo } from '@/lib/site-config-editor'
import { CampoEntero, CampoTexto } from './CampoTexto'
import { ListaObjetos, ListaTexto } from './ListaEditable'
import { Aviso, TXT_SUAVE, TXT_TENUE, Tarjeta, type PropsPestana } from './Comunes'
import { licenciaturasActivas } from '@/lib/licenciatura-utils'
import { ListasLicenciaturas, autoLicenciaturas } from './TextosLicenciaturas'

type Elemento = Record<string, string | number>

/**
 * Tarjetas de la pestaña, en orden. El primer grupo cuyo prefijo case con la
 * subclave se queda el campo, así que el orden de esta lista importa.
 */
const GRUPOS: ReadonlyArray<{ id: string; titulo: string; prefijos: string[] }> = [
  // Sin 'cct': la única clave que empieza así es `landing.cct`, y en el
  // catálogo vive en la sección `identidad` (el editor la pinta junto al CCT
  // del sistema, porque los dos campos son el mismo dato). Aquí nunca llegaba.
  { id: 'ubicacion', titulo: 'Ubicación', prefijos: ['ciudad'] },
  { id: 'hero', titulo: 'Portada', prefijos: ['hero_', 'contadores'] },
  { id: 'respaldo', titulo: 'Respaldo', prefijos: ['respaldo'] },
  { id: 'dolor', titulo: 'Situaciones', prefijos: ['dolor_'] },
  { id: 'programas', titulo: 'Programas', prefijos: ['programas_'] },
  { id: 'licenciaturas', titulo: 'Licenciaturas', prefijos: ['licenciaturas_'] },
  { id: 'transformacion', titulo: 'Antes y después', prefijos: ['transformacion_'] },
  { id: 'proceso', titulo: 'Cómo funciona', prefijos: ['proceso_'] },
  { id: 'testimonios', titulo: 'Testimonios', prefijos: ['testimonios'] },
  { id: 'beneficios', titulo: 'Beneficios', prefijos: ['beneficios_'] },
  { id: 'catalogo', titulo: 'Catálogo de cursos', prefijos: ['catalogo'] },
  { id: 'faq', titulo: 'Preguntas frecuentes', prefijos: ['faq_'] },
  { id: 'cta', titulo: 'Cierre', prefijos: ['cta_'] },
]

const OTROS = { id: 'otros', titulo: 'Otros textos', prefijos: [] as string[] }

/** Agrupa los campos de `landing` conservando el orden del catálogo. */
function agrupar(campos: ReadonlyArray<Campo>) {
  const porGrupo = new Map<string, Campo[]>()
  for (const campo of campos) {
    const subclave = campo.clave.replace(/^landing\./, '')
    const grupo = GRUPOS.find((g) => g.prefijos.some((p) => subclave.startsWith(p))) ?? OTROS
    const lista = porGrupo.get(grupo.id) ?? []
    lista.push(campo)
    porGrupo.set(grupo.id, lista)
  }
  return [...GRUPOS, OTROS]
    .map((g) => ({ ...g, campos: porGrupo.get(g.id) ?? [] }))
    .filter((g) => g.campos.length > 0)
}

function esListaTexto(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((el) => typeof el === 'string')
}

function esListaObjetos(v: unknown): v is Elemento[] {
  return Array.isArray(v) && v.every((el) => typeof el === 'object' && el !== null && !Array.isArray(el))
}

export function PestanaTextos({
  defaults, overrides, actualizar, puedeEditar, claveConError,
}: PropsPestana) {
  // Sin el add-on, los textos de licenciaturas no se enseñan: la sección no
  // existe en su página.
  const conLicenciaturas = licenciaturasActivas()
  const grupos = agrupar(
    CAMPOS_POR_SECCION.landing.filter((c) => conLicenciaturas || !c.clave.startsWith('landing.licenciaturas_')),
  )
  const autoLic = conLicenciaturas ? autoLicenciaturas() : null
  /** Placeholder = el texto automático que se ve hoy, para los tres sueltos. */
  const placeholderLic: Record<string, string | undefined> = {
    'landing.licenciaturas_kicker': autoLic?.kicker,
    'landing.licenciaturas_titulo': autoLic?.titulo,
    'landing.licenciaturas_subtitulo': autoLic?.bajada,
  }
  const campoCarreras = CAMPOS_POR_SECCION.landing.find((c) => c.clave === 'landing.licenciaturas_carreras')
  const campoPasos = CAMPOS_POR_SECCION.landing.find((c) => c.clave === 'landing.licenciaturas_pasos')

  function pintar(campo: Campo) {
    const clave = campo.clave
    const efectivo = valorEfectivo(defaults, overrides, clave)
    const porDefecto = valorEfectivo(defaults, {}, clave)
    const sobrescrito = estaSobrescrito(overrides, clave)
    const resaltado = claveConError === clave
    const escribir = (v: unknown) => actualizar((prev) => escribirRuta(prev, clave, v))
    const restaurar = () => actualizar((prev) => quitarRuta(prev, clave))

    // Los campos que la landing actual no pinta se editan igual (están en la
    // lista blanca y otro diseño podría usarlos), pero se dice claramente.
    const ayuda = [campo.ayuda, campo.noVisibleEnLanding ? '(no se muestra en el diseño actual de la página)' : '']
      .filter(Boolean)
      .join(' ')

    // Filas fijas (una por carrera, 4 pasos): se pintan juntas al llegar a la
    // primera de las dos listas.
    if (clave === 'landing.licenciaturas_pasos') return null
    if (clave === 'landing.licenciaturas_carreras') {
      return (
        <ListasLicenciaturas
          key={clave}
          defaults={defaults}
          overrides={overrides}
          actualizar={actualizar}
          puedeEditar={puedeEditar}
          claveConError={claveConError}
          campoCarreras={campoCarreras}
          campoPasos={campoPasos}
        />
      )
    }

    switch (campo.tipo) {
      case 'lista-texto':
        return (
          <ListaTexto
            key={clave}
            campo={campo}
            valor={esListaTexto(efectivo) ? efectivo : []}
            base={esListaTexto(porDefecto) ? porDefecto : []}
            sobrescrito={sobrescrito}
            puedeEditar={puedeEditar}
            resaltado={resaltado}
            onChange={escribir}
            onRestaurar={restaurar}
          />
        )
      case 'lista-objetos':
        return (
          <ListaObjetos
            key={clave}
            campo={campo}
            valor={esListaObjetos(efectivo) ? efectivo : []}
            base={esListaObjetos(porDefecto) ? porDefecto : []}
            sobrescrito={sobrescrito}
            puedeEditar={puedeEditar}
            resaltado={resaltado}
            onChange={escribir}
            onRestaurar={restaurar}
          />
        )
      case 'entero':
        return (
          <CampoEntero
            key={clave}
            clave={clave}
            etiqueta={campo.etiqueta}
            ayuda={ayuda || undefined}
            valor={typeof efectivo === 'number' ? efectivo : 0}
            min={campo.min ?? 0}
            max={campo.max ?? 100000}
            deshabilitado={!puedeEditar}
            sobrescrito={sobrescrito}
            resaltado={resaltado}
            onChange={escribir}
            onRestaurar={restaurar}
          />
        )
      default:
        return (
          <CampoTexto
            key={clave}
            clave={clave}
            etiqueta={campo.etiqueta}
            ayuda={
              clave === 'landing.hero_subtitulo'
                ? `${ayuda} Enter = salto de línea.`.trim()
                : ayuda || undefined
            }
            valor={typeof efectivo === 'string' ? efectivo : ''}
            placeholder={placeholderLic[clave] ?? (typeof porDefecto === 'string' ? porDefecto : undefined)}
            max={campo.max ?? 200}
            multilinea={campo.tipo === 'textarea'}
            deshabilitado={!puedeEditar}
            sobrescrito={sobrescrito}
            resaltado={resaltado}
            onChange={escribir}
            onRestaurar={restaurar}
          />
        )
    }
  }

  return (
    <div className="space-y-5">
      <Aviso>
        Puedes usar estas etiquetas en cualquier texto y se sustituyen solas al
        publicar:{' '}
        {PLACEHOLDERS.map((p, i) => (
          <span key={p}>
            {i > 0 && ', '}
            <code style={{ color: TXT_SUAVE }}>{`{${p}}`}</code>
          </span>
        ))}
        .{' '}
        <span style={{ color: TXT_TENUE }}>
          Por ejemplo, <code>{'{duracion}'}</code> escribe los meses de tus planes activos,{' '}
          <code>{'{inscripcion}'}</code> el precio de inscripción general y{' '}
          <code>{'{inscripcionSecundaria}'}</code> o <code>{'{inscripcionPreparatoria}'}</code> el de
          ese nivel (si no tiene precio propio, el general).
        </span>
      </Aviso>

      {grupos.map((grupo) => (
        <Tarjeta key={grupo.id} titulo={grupo.titulo}>
          <div className="space-y-5">{grupo.campos.map(pintar)}</div>
        </Tarjeta>
      ))}
    </div>
  )
}
