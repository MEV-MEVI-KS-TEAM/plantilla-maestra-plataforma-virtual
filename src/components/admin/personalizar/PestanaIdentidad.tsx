'use client'

/**
 * Pestaña "Identidad": cómo se llama la escuela, cómo se la contacta y con qué
 * logo se presenta.
 *
 * TRES CAMPOS ESCRIBEN DOS CLAVES. config.ts arrastra pares que siempre han
 * significado lo mismo y que un admin no distingue: `cct` / `landing.cct`,
 * `whatsapp` / `contactoTelefono`, `email` / `contactoEmail`. Enseñarlos por
 * separado garantizaba el ticket "cambié el teléfono y el pie de página sigue
 * con el viejo", así que el editor muestra UN control y escribe los dos. Lo
 * mismo al restaurar. El del WhatsApp escribe además `whatsappDisplay` con el
 * número formateado (`escribirNumeroWhatsApp`), que el admin puede retocar.
 *
 * `whatsappUrl` no se edita: lo deriva el servidor del número (ver
 * `validarOverrides`), y por eso el editor ni siquiera lo manda.
 */
import { AtSign, Building2, Image as ImageIcon, Share2 } from 'lucide-react'
import { mensajeWhatsAppInvalido, normalizarWhatsApp } from '@/lib/contacto-ui'
import { LIMITES } from '@/lib/site-config-campos'
import type { ConfigEditable } from '@/lib/site-config-validacion'
import {
  CLAVES_NUMERO_WHATSAPP,
  MAX_DIGITOS_TELEFONO,
  escribirNumeroWhatsApp,
  estaSobrescrito,
  quitarRuta,
  escribirRuta,
  valorEfectivo,
} from '@/lib/site-config-editor'
import { CampoTexto } from './CampoTexto'
import { SubidaLogo, type RespuestaLogo } from './SubidaLogo'
import { Ayuda, Tarjeta, TXT_SUAVE, type PropsPestana } from './Comunes'

const ICONO = { className: 'w-4 h-4', style: { color: 'var(--color-acento)' } }

export interface PropsIdentidad extends PropsPestana {
  /** Config publicada. De aquí salen los logos, que el PUT no toca. */
  merged: ConfigEditable
  /** Subir o quitar un logo escribió la fila: `merged` y la fila nuevos. */
  onLogo: (respuesta: RespuestaLogo) => void
  onMensaje: (texto: string, tipo: 'success' | 'error') => void
}

export function PestanaIdentidad({
  defaults, overrides, actualizar, puedeEditar, claveConError, merged, onLogo, onMensaje,
}: PropsIdentidad) {
  const txt = (ruta: string) => String(valorEfectivo(defaults, overrides, ruta) ?? '')

  /** Escribe el mismo valor en varias claves (los pares históricos). */
  const escribirVarias = (rutas: string[], valor: string) =>
    actualizar((prev) => rutas.reduce((acc, ruta) => escribirRuta(acc, ruta, valor), prev))

  const quitarVarias = (rutas: string[]) =>
    actualizar((prev) => rutas.reduce((acc, ruta) => quitarRuta(acc, ruta), prev))

  const sobrescritaAlguna = (rutas: string[]) => rutas.some((r) => estaSobrescrito(overrides, r))

  const whatsapp = txt('whatsapp')
  // La MISMA regla con la que el servidor lo guarda: la ayuda enseña el enlace
  // que de verdad se va a publicar (con el 52 si se capturaron 10 dígitos).
  const whatsappNormalizado = normalizarWhatsApp(whatsapp)
  const ayudaWhatsApp =
    whatsappNormalizado === null
      ? mensajeWhatsAppInvalido('WhatsApp (número)')
      : whatsappNormalizado === ''
        ? 'Vacío = la escuela no usa WhatsApp.'
        : `Enlace: https://wa.me/${whatsappNormalizado}` +
          (whatsappNormalizado !== whatsapp ? ' (al guardar se agrega la lada 52 de México)' : '')

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Nombre de la escuela" icono={<Building2 {...ICONO} aria-hidden="true" />}>
        <CampoTexto
          clave="nombre" etiqueta="Nombre corto" max={LIMITES.nombre}
          ayuda="Siglas o nombre breve. Es lo que se ve en el menú y en la cabecera."
          valor={txt('nombre')} placeholder={defaults.nombre}
          deshabilitado={!puedeEditar} resaltado={claveConError === 'nombre'}
          sobrescrito={estaSobrescrito(overrides, 'nombre')}
          onChange={(v) => actualizar((prev) => escribirRuta(prev, 'nombre', v))}
          onRestaurar={() => actualizar((prev) => quitarRuta(prev, 'nombre'))}
        />
        <CampoTexto
          clave="nombreCompleto" etiqueta="Nombre completo" max={LIMITES.nombreCompleto}
          valor={txt('nombreCompleto')} placeholder={defaults.nombreCompleto}
          deshabilitado={!puedeEditar} resaltado={claveConError === 'nombreCompleto'}
          sobrescrito={estaSobrescrito(overrides, 'nombreCompleto')}
          onChange={(v) => actualizar((prev) => escribirRuta(prev, 'nombreCompleto', v))}
          onRestaurar={() => actualizar((prev) => quitarRuta(prev, 'nombreCompleto'))}
        />
        <CampoTexto
          clave="tagline" etiqueta="Lema" max={LIMITES.tagline}
          ayuda="Frase corta de la marca."
          valor={txt('tagline')} placeholder={defaults.tagline}
          deshabilitado={!puedeEditar} resaltado={claveConError === 'tagline'}
          sobrescrito={estaSobrescrito(overrides, 'tagline')}
          onChange={(v) => actualizar((prev) => escribirRuta(prev, 'tagline', v))}
          onRestaurar={() => actualizar((prev) => quitarRuta(prev, 'tagline'))}
        />
        <CampoTexto
          clave="cct" etiqueta="CCT" max={LIMITES.cct}
          ayuda="Clave de Centro de Trabajo. Se usa en el sistema y en la página. Vacío = no se muestra."
          valor={txt('cct')} placeholder={defaults.cct}
          deshabilitado={!puedeEditar}
          resaltado={claveConError === 'cct' || claveConError === 'landing.cct'}
          sobrescrito={sobrescritaAlguna(['cct', 'landing.cct'])}
          onChange={(v) => escribirVarias(['cct', 'landing.cct'], v)}
          onRestaurar={() => quitarVarias(['cct', 'landing.cct'])}
        />
      </Tarjeta>

      <Tarjeta titulo="Contacto" icono={<AtSign {...ICONO} aria-hidden="true" />}>
        <CampoTexto
          clave="whatsapp" etiqueta="WhatsApp (número)" tipo="tel"
          // El contador cuenta DÍGITOS (15, que es lo que se guarda) y el
          // control va SIN `maxlength`: el navegador lo aplicaría al pegar,
          // antes de que `normalizarTelefono` quite los separadores, y
          // '+52 1 (999) 123-45-67' se convertiría en un número a medias. Aquí
          // sobra: lo que se pinta ya viene normalizado a 15 dígitos como mucho.
          max={MAX_DIGITOS_TELEFONO} maxEntrada={null}
          valor={whatsapp} placeholder={defaults.whatsapp}
          ayudaEsError={whatsappNormalizado === null}
          ayuda={ayudaWhatsApp}
          deshabilitado={!puedeEditar}
          resaltado={claveConError === 'whatsapp' || claveConError === 'contactoTelefono'}
          sobrescrito={sobrescritaAlguna(['whatsapp', 'contactoTelefono'])}
          // Capturar el número también llena «como se muestra» con el número
          // formateado: si no, el texto se quedaba con el número viejo.
          onChange={(v) => actualizar((prev) => escribirNumeroWhatsApp(prev, v))}
          onRestaurar={() => quitarVarias([...CLAVES_NUMERO_WHATSAPP])}
        />
        <CampoTexto
          clave="whatsappDisplay" etiqueta="WhatsApp (como se muestra)" max={LIMITES.kicker}
          ayuda="Se llena solo al capturar el número; puedes ajustarlo antes de publicar. Si sus dígitos no son los del número, la página enseña el número."
          valor={txt('whatsappDisplay')} placeholder={defaults.whatsappDisplay}
          deshabilitado={!puedeEditar} resaltado={claveConError === 'whatsappDisplay'}
          sobrescrito={estaSobrescrito(overrides, 'whatsappDisplay')}
          onChange={(v) => actualizar((prev) => escribirRuta(prev, 'whatsappDisplay', v))}
          onRestaurar={() => actualizar((prev) => quitarRuta(prev, 'whatsappDisplay'))}
        />
        <CampoTexto
          clave="email" etiqueta="Correo de contacto" max={LIMITES.email} tipo="email"
          ayuda="Correo público de la escuela: sale en la página, en el pie del portal, en el perfil del alumno y en las legales, y es el contacto cuando no hay WhatsApp. No es el remitente de los correos automáticos."
          valor={txt('email')} placeholder={defaults.email}
          deshabilitado={!puedeEditar}
          resaltado={claveConError === 'email' || claveConError === 'contactoEmail'}
          sobrescrito={sobrescritaAlguna(['email', 'contactoEmail'])}
          onChange={(v) => escribirVarias(['email', 'contactoEmail'], v)}
          onRestaurar={() => quitarVarias(['email', 'contactoEmail'])}
        />
      </Tarjeta>

      <Tarjeta titulo="Redes sociales" icono={<Share2 {...ICONO} aria-hidden="true" />}>
        <CampoTexto
          clave="redes.facebook" etiqueta="Facebook" max={LIMITES.url} tipo="url"
          ayuda="URL completa de la página. Vacío = no se muestra el icono."
          valor={txt('redes.facebook')} placeholder={defaults.redes.facebook}
          deshabilitado={!puedeEditar} resaltado={claveConError === 'redes.facebook'}
          sobrescrito={estaSobrescrito(overrides, 'redes.facebook')}
          onChange={(v) => actualizar((prev) => escribirRuta(prev, 'redes.facebook', v))}
          onRestaurar={() => actualizar((prev) => quitarRuta(prev, 'redes.facebook'))}
        />
        <CampoTexto
          clave="redes.instagram" etiqueta="Instagram" max={LIMITES.url} tipo="url"
          ayuda="URL completa del perfil. Vacío = no se muestra el icono."
          valor={txt('redes.instagram')} placeholder={defaults.redes.instagram}
          deshabilitado={!puedeEditar} resaltado={claveConError === 'redes.instagram'}
          sobrescrito={estaSobrescrito(overrides, 'redes.instagram')}
          onChange={(v) => actualizar((prev) => escribirRuta(prev, 'redes.instagram', v))}
          onRestaurar={() => actualizar((prev) => quitarRuta(prev, 'redes.instagram'))}
        />
      </Tarjeta>

      <Tarjeta
        titulo="Logo"
        icono={<ImageIcon {...ICONO} aria-hidden="true" />}
        descripcion="PNG, JPG, WebP o SVG de hasta 2 MB. Se recorta a 512 px y se guarda como imagen."
      >
        {/* `merged.logo` / `merged.logoOscuro` llegan RESUELTOS por el merge:
            con solo el claro subido, el oscuro es ese mismo logo. Por eso el
            badge "Personalizado" se decide con la FILA (`overrides`), no con
            la URL. Un `logoOscuro: ''` en la fila ("sin variante oscura", solo
            datos viejos: la API ya no lo escribe) NO cuenta como propio. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SubidaLogo
            variante="claro" etiqueta="Logo claro"
            ayuda="El principal. Se usa en la cabecera, los recibos y las constancias. Mientras no subas uno para fondo oscuro, también se usa ahí."
            url={merged.logo} urlDefault={defaults.logo}
            personalizado={estaSobrescrito(overrides, 'logo')}
            nombre={txt('nombre')} puedeEditar={puedeEditar}
            onLogo={onLogo} onMensaje={onMensaje}
          />
          <SubidaLogo
            variante="oscuro" etiqueta="Logo para fondo oscuro"
            ayuda="Opcional. Si solo subes tu logo principal, se usará también en fondos oscuros."
            url={merged.logoOscuro} urlDefault={defaults.logoOscuro}
            personalizado={estaSobrescrito(overrides, 'logoOscuro') && String(overrides.logoOscuro ?? '').trim() !== ''}
            urlLogoClaro={merged.logo}
            nombre={txt('nombre')} puedeEditar={puedeEditar}
            onLogo={onLogo} onMensaje={onMensaje}
          />
        </div>
        <Ayuda>
          <span style={{ color: TXT_SUAVE }}>El logo se publica en cuanto lo subes</span>, no
          hace falta pulsar &ldquo;Publicar cambios&rdquo;.
        </Ayuda>
      </Tarjeta>
    </div>
  )
}
