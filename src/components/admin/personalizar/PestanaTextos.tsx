'use client'

/**
 * Pestaña "Textos de mi página": todos los campos de la sección `landing` del
 * catálogo, en el orden en que se ven bajando por la página.
 *
 * Son los campos con `seccion: 'landing'` del catálogo (hoy 45), NO todas las
 * claves `landing.*`: `landing.cct` está catalogada en `identidad` y se edita
 * en esa pestaña, junto al CCT del sistema, porque son el mismo dato.
 *
 * El orden NO se decide aquí: se recorre `CAMPOS_POR_SECCION.landing` tal cual,
 * y los campos se agrupan en tarjetas por el prefijo de su clave (`hero_`,
 * `dolor_`, `faq_`…). Así, cuando F-siguiente añada un texto nuevo al
 * catálogo, aparece solo en su tarjeta y en su sitio, sin tocar este archivo.
 * Un campo con un prefijo que no reconozcamos cae en "Otros textos" en vez de
 * desaparecer, que es el fallo silencioso que sí importaría.
 */
import type { Campo } from '@/lib/site-config-campos'
import { CAMPOS_POR_SECCION } from '@/lib/site-config-campos'
import { PLACEHOLDERS } from '@/lib/site-config-core'
import { escribirRuta, estaSobrescrito, quitarRuta, valorEfectivo } from '@/lib/site-config-editor'
import { CampoEntero, CampoTexto } from './CampoTexto'
import { ListaObjetos, ListaTexto } from './ListaEditable'
import { Aviso, TXT_SUAVE, TXT_TENUE, Tarjeta, type PropsPestana } from './Comunes'

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
  const grupos = agrupar(CAMPOS_POR_SECCION.landing)

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
            placeholder={typeof porDefecto === 'string' ? porDefecto : undefined}
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
          Por ejemplo, <code>{'{duracion}'}</code> escribe los meses de tus planes activos y{' '}
          <code>{'{inscripcion}'}</code> el precio de inscripción.
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
