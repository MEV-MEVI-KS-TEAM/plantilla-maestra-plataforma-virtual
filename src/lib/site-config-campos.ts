/**
 * "Personalizar mi página" (F3) — catálogo DECLARATIVO de los campos editables.
 *
 * Una entrada por clave de `CLAVES_EDITABLES` (ni una más ni una menos; lo
 * vigila tests/unit/site-config-campos.spec.ts). Lo consumen:
 *   - la API del editor (Fase 4): límites de longitud, rango de los enteros,
 *     máximo de elementos por lista, forma de cada elemento;
 *   - el editor (Fase 5): sección, etiqueta, ayuda, tipo de control y los
 *     placeholders que puede ofrecer.
 *
 * ISOMORFO: sin `server-only`, sin `next/cache`, sin Supabase. Solo tipos de
 * site-config-core.ts. Puede importarse desde un componente cliente sin
 * engordar el bundle con nada de servidor.
 *
 * QUÉ VALIDA Y QUÉ NO. Aquí se declaran LÍMITES (cuánto), no FORMA (qué): la
 * forma de cada elemento de lista la exige `normalizarArreglo` (core) y la
 * validez de un hex, una URL o un email es de la API. Los dos catálogos deben
 * coincidir en qué claves son listas y qué campos lleva cada elemento (una
 * prueba cruza `campos` con CONFIG).
 *
 * LOS DEFAULTS CABEN. Todo default de config.ts respeta el límite de su
 * campo (prueba unitaria). Si no fuera así, el editor prellenado con los
 * defaults no dejaría guardar un formulario sin tocar — el admin vería "no
 * guarda" en un campo que nunca editó.
 *
 * `max` se mide en unidades UTF-16 (`String.prototype.length`), que es lo que
 * miden el navegador (`maxlength`) y la API sin dependencias. Un emoji cuenta
 * 2; por eso `icono` admite 8.
 */
import { PLACEHOLDERS, type ClaveEditable, type Placeholder } from '@/lib/site-config-core'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SeccionCampo =
  | 'identidad'
  | 'contacto'
  | 'redes'
  | 'colores'
  | 'landing'
  | 'precios'
  | 'modalidades'

export type TipoCampo =
  | 'texto'
  | 'textarea'
  | 'hex'
  | 'url'
  | 'telefono'
  | 'email'
  | 'entero'
  | 'lista-texto'
  | 'lista-objetos'
  | 'modalidades'

export type TipoSubcampo = 'texto' | 'textarea' | 'entero'

/** Un campo de cada elemento de una lista de objetos (`faq_items[].q`…). */
export interface Subcampo {
  clave: string
  etiqueta: string
  tipo: TipoSubcampo
  /** texto/textarea: máx. de caracteres. entero: valor máximo. */
  max: number
  /** entero: valor mínimo (default 0). */
  min?: number
}

export interface Campo {
  clave: ClaveEditable
  seccion: SeccionCampo
  /** Etiqueta del control, en español. */
  etiqueta: string
  /** Texto de ayuda bajo el control. */
  ayuda?: string
  tipo: TipoCampo
  /**
   * texto/textarea/hex/url/telefono/email: máx. de caracteres.
   * lista-texto: máx. de caracteres POR ELEMENTO.
   * entero: valor máximo. modalidades: valor máximo de `mensualidad`.
   */
  max?: number
  /** entero / modalidades: valor mínimo. */
  min?: number
  /** Listas: máximo de elementos. Obligatorio en toda lista (lo vigila una prueba). */
  maxItems?: number
  /**
   * Listas: mínimo de elementos. Se fija en 1 en las listas cuya sección se
   * pinta SIEMPRE (una lista vacía dejaría un título con nada debajo). Las que
   * gatean su sección (`testimonios`) o no se pintan admiten `[]`.
   */
  minItems?: number
  /** lista-objetos: los campos de cada elemento, en el orden del editor. */
  campos?: Subcampo[]
  /** Los `{x}` que el texto admite (ver `interpolar` en core). */
  placeholders?: Placeholder[]
  /**
   * La clave existe y es editable, pero la landing actual NO la pinta
   * (hero_badges, respaldo_*). El editor la muestra con ese aviso o la esconde.
   */
  noVisibleEnLanding?: boolean
}

// ─── Límites ─────────────────────────────────────────────────────────────────

/**
 * Límites nombrados, para que la API y el editor citen el mismo número. Los
 * marcados "(spec)" son los que fijó el brief de F3; el resto son sensatos
 * para el ancho de la landing.
 */
export const LIMITES = {
  nombre: 40,            // (spec)
  nombreCompleto: 80,    // (spec)
  tagline: 90,           // (spec)
  cct: 20,
  ciudad: 40,
  heroTitulo: 60,        // (spec)
  heroHighlight: 40,     // (spec)
  heroSubtitulo: 160,    // (spec)
  heroBadgeSuperior: 80,
  /** hero_badges / respaldo_badges: por elemento (spec). */
  badge: 30,
  /**
   * transformacion_sin / transformacion_con: por elemento. El brief pedía 30
   * como para un badge, pero estos son ORACIONES: los cuatro defaults de cada
   * columna miden entre 51 y 58 caracteres, y con 30 el editor no dejaría
   * guardar la landing tal como se ve hoy. 80 deja aire para una frase sin
   * romper el ancho de la columna.
   */
  bullet: 80,
  kicker: 30,
  tituloSeccion: 80,
  subtituloSeccion: 200,
  tituloItem: 60,
  descItem: 200,
  boton: 30,
  faqPregunta: 120,
  faqRespuesta: 500,
  testimonioQuote: 300,  // (spec)
  icono: 8,
  hex: 7,
  url: 300,
  telefono: 20,
  email: 120,
  /** Precios y mensualidades, en MXN enteros. */
  precioMin: 0,
  precioMax: 50000,
  /** Valor al que sube un contador del hero. */
  contadorValorMax: 100000,
  // Máximos de elementos por lista.
  maxHeroBadges: 4,      // (spec)
  maxRespaldoBadges: 6,
  maxTestimonios: 6,     // (spec)
  maxContadores: 4,
  maxDolorItems: 6,
  maxTransformacion: 6,
  maxProcesoPasos: 6,
  maxBeneficios: 6,
  maxFaq: 8,
} as const

/** Los textos de la landing admiten todos los placeholders; el resto ninguno. */
const TODOS: Placeholder[] = [...PLACEHOLDERS]

// ─── Catálogo ────────────────────────────────────────────────────────────────

/**
 * En el orden en que el editor los muestra: sección por sección y, dentro de
 * `landing`, de arriba abajo como se ve la página.
 */
export const CAMPOS: ReadonlyArray<Campo> = [
  // ── Identidad ──
  { clave: 'nombre', seccion: 'identidad', etiqueta: 'Nombre corto', tipo: 'texto', max: LIMITES.nombre,
    ayuda: 'Siglas o nombre breve. Es la marca de agua del hero y las cabeceras "Sin / Con …".' },
  { clave: 'nombreCompleto', seccion: 'identidad', etiqueta: 'Nombre completo', tipo: 'texto', max: LIMITES.nombreCompleto },
  { clave: 'tagline', seccion: 'identidad', etiqueta: 'Lema', tipo: 'texto', max: LIMITES.tagline,
    ayuda: 'Frase corta de la marca.' },
  { clave: 'cct', seccion: 'identidad', etiqueta: 'CCT', tipo: 'texto', max: LIMITES.cct,
    ayuda: 'Clave de Centro de Trabajo. Vacío = no se muestra.' },
  { clave: 'landing.cct', seccion: 'identidad', etiqueta: 'CCT (landing)', tipo: 'texto', max: LIMITES.cct,
    ayuda: 'Clave que se muestra en la landing. Vacío = se omite.' },
  { clave: 'logo', seccion: 'identidad', etiqueta: 'Logo', tipo: 'url', max: LIMITES.url,
    ayuda: 'Ruta o URL de la imagen. No puede quedar vacío.' },
  { clave: 'logoOscuro', seccion: 'identidad', etiqueta: 'Logo para fondo oscuro', tipo: 'url', max: LIMITES.url,
    ayuda: 'Vacío = se usa el logo principal forzado a blanco.' },

  // ── Contacto ──
  { clave: 'whatsapp', seccion: 'contacto', etiqueta: 'WhatsApp (número)', tipo: 'telefono', max: LIMITES.telefono,
    ayuda: 'Solo dígitos con lada de país, p. ej. 5219991234567. Es lo que sale como {whatsapp}.' },
  { clave: 'whatsappUrl', seccion: 'contacto', etiqueta: 'Enlace de WhatsApp', tipo: 'url', max: LIMITES.url,
    ayuda: 'https://wa.me/… No puede quedar vacío.' },
  { clave: 'whatsappDisplay', seccion: 'contacto', etiqueta: 'WhatsApp (como se muestra)', tipo: 'texto', max: LIMITES.kicker },
  { clave: 'contactoTelefono', seccion: 'contacto', etiqueta: 'Teléfono de contacto', tipo: 'telefono', max: LIMITES.telefono },
  { clave: 'email', seccion: 'contacto', etiqueta: 'Correo', tipo: 'email', max: LIMITES.email },
  { clave: 'contactoEmail', seccion: 'contacto', etiqueta: 'Correo de contacto', tipo: 'email', max: LIMITES.email,
    ayuda: 'El que aparece en el pie de página y en el perfil.' },

  // ── Redes ──
  { clave: 'redes.facebook', seccion: 'redes', etiqueta: 'Facebook', tipo: 'url', max: LIMITES.url,
    ayuda: 'URL completa. Vacío = no se muestra el icono.' },
  { clave: 'redes.instagram', seccion: 'redes', etiqueta: 'Instagram', tipo: 'url', max: LIMITES.url,
    ayuda: 'URL completa. Vacío = no se muestra el icono.' },

  // ── Colores ──
  { clave: 'colores.primario', seccion: 'colores', etiqueta: 'Primario', tipo: 'hex', max: LIMITES.hex,
    ayuda: 'Barra lateral, encabezados y fondos oscuros.' },
  { clave: 'colores.secundario', seccion: 'colores', etiqueta: 'Secundario', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.acento', seccion: 'colores', etiqueta: 'Acento', tipo: 'hex', max: LIMITES.hex,
    ayuda: 'Botones primarios, enlaces y resaltados.' },
  { clave: 'colores.acentoClaro', seccion: 'colores', etiqueta: 'Acento claro', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.acentoHover', seccion: 'colores', etiqueta: 'Acento (hover)', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.textoSobreAcento', seccion: 'colores', etiqueta: 'Texto sobre acento', tipo: 'hex', max: LIMITES.hex,
    ayuda: 'Oscuro si el acento es claro (amarillo, por ejemplo).' },
  { clave: 'colores.texto', seccion: 'colores', etiqueta: 'Texto', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.textoSecundario', seccion: 'colores', etiqueta: 'Texto secundario', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.fondo', seccion: 'colores', etiqueta: 'Fondo', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.superficie', seccion: 'colores', etiqueta: 'Superficie', tipo: 'hex', max: LIMITES.hex,
    ayuda: 'Tarjetas, modales e inputs.' },
  { clave: 'colores.borde', seccion: 'colores', etiqueta: 'Borde', tipo: 'hex', max: LIMITES.hex },
  { clave: 'colores.themeColor', seccion: 'colores', etiqueta: 'Barra del navegador (móvil)', tipo: 'hex', max: LIMITES.hex,
    ayuda: 'Debe coincidir con el fondo real de la página.' },

  // ── Landing: hero ──
  { clave: 'landing.ciudad', seccion: 'landing', etiqueta: 'Ciudad', tipo: 'texto', max: LIMITES.ciudad,
    ayuda: 'Se añade al badge superior como " · Ciudad". Vacío = se omite.' },
  { clave: 'landing.hero_badge_superior', seccion: 'landing', etiqueta: 'Badge superior del hero', tipo: 'texto',
    max: LIMITES.heroBadgeSuperior, placeholders: TODOS },
  { clave: 'landing.hero_titulo', seccion: 'landing', etiqueta: 'Título del hero', tipo: 'texto',
    max: LIMITES.heroTitulo, placeholders: TODOS },
  { clave: 'landing.hero_highlight', seccion: 'landing', etiqueta: 'Título del hero (línea resaltada)', tipo: 'texto',
    max: LIMITES.heroHighlight, placeholders: TODOS },
  { clave: 'landing.hero_subtitulo', seccion: 'landing', etiqueta: 'Subtítulo del hero', tipo: 'textarea',
    max: LIMITES.heroSubtitulo, placeholders: TODOS,
    ayuda: 'Un salto de línea parte el texto en dos líneas en pantallas grandes.' },
  { clave: 'landing.hero_cta_primario', seccion: 'landing', etiqueta: 'Botón principal del hero', tipo: 'texto',
    max: LIMITES.boton, placeholders: TODOS },
  { clave: 'landing.hero_cta_whatsapp', seccion: 'landing', etiqueta: 'Botón de WhatsApp del hero', tipo: 'texto',
    max: LIMITES.boton, placeholders: TODOS },
  { clave: 'landing.contadores', seccion: 'landing', etiqueta: 'Contadores del hero', tipo: 'lista-objetos',
    maxItems: LIMITES.maxContadores, minItems: 1,
    ayuda: 'El número sube animado hasta "valor"; el sufijo se pega sin espacio (%, h).',
    campos: [
      { clave: 'valor', etiqueta: 'Valor', tipo: 'entero', min: 0, max: LIMITES.contadorValorMax },
      { clave: 'sufijo', etiqueta: 'Sufijo', tipo: 'texto', max: 5 },
      { clave: 'etiqueta', etiqueta: 'Etiqueta', tipo: 'texto', max: LIMITES.kicker },
      { clave: 'sub', etiqueta: 'Texto secundario', tipo: 'texto', max: LIMITES.kicker },
    ] },
  { clave: 'landing.hero_badges', seccion: 'landing', etiqueta: 'Badges del hero', tipo: 'lista-texto',
    max: LIMITES.badge, maxItems: LIMITES.maxHeroBadges, noVisibleEnLanding: true,
    ayuda: 'La landing actual no los muestra.' },
  { clave: 'landing.respaldo_titulo', seccion: 'landing', etiqueta: 'Título de respaldo', tipo: 'texto',
    max: LIMITES.tituloSeccion, noVisibleEnLanding: true, ayuda: 'La landing actual no lo muestra.' },
  { clave: 'landing.respaldo_badges', seccion: 'landing', etiqueta: 'Badges de respaldo', tipo: 'lista-texto',
    max: LIMITES.badge, maxItems: LIMITES.maxRespaldoBadges, noVisibleEnLanding: true,
    ayuda: 'La landing actual no los muestra.' },

  // ── Landing: dolor ──
  { clave: 'landing.dolor_kicker', seccion: 'landing', etiqueta: 'Situaciones: etiqueta', tipo: 'texto',
    max: LIMITES.kicker, placeholders: TODOS },
  { clave: 'landing.dolor_titulo', seccion: 'landing', etiqueta: 'Situaciones: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.dolor_items', seccion: 'landing', etiqueta: 'Situaciones: tarjetas', tipo: 'lista-objetos',
    maxItems: LIMITES.maxDolorItems, minItems: 1, placeholders: TODOS,
    campos: [
      { clave: 'icono', etiqueta: 'Icono (emoji)', tipo: 'texto', max: LIMITES.icono },
      { clave: 'titulo', etiqueta: 'Título', tipo: 'texto', max: LIMITES.tituloItem },
      { clave: 'desc', etiqueta: 'Descripción', tipo: 'textarea', max: LIMITES.descItem },
    ] },
  { clave: 'landing.dolor_cierre', seccion: 'landing', etiqueta: 'Situaciones: cierre', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS,
    ayuda: 'Va seguido del nombre completo de la escuela.' },
  { clave: 'landing.dolor_cierre_sub', seccion: 'landing', etiqueta: 'Situaciones: texto de cierre', tipo: 'textarea',
    max: LIMITES.subtituloSeccion, placeholders: TODOS },

  // ── Landing: programas ──
  { clave: 'landing.programas_kicker', seccion: 'landing', etiqueta: 'Programas: etiqueta', tipo: 'texto',
    max: LIMITES.kicker, placeholders: TODOS },
  { clave: 'landing.programas_titulo', seccion: 'landing', etiqueta: 'Programas: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.programas_subtitulo', seccion: 'landing', etiqueta: 'Programas: subtítulo', tipo: 'textarea',
    max: LIMITES.subtituloSeccion, placeholders: TODOS,
    ayuda: '{inscripcion} se sustituye por el precio de inscripción.' },
  { clave: 'landing.programas_popular', seccion: 'landing', etiqueta: 'Programas: etiqueta "popular"', tipo: 'texto',
    max: LIMITES.boton, placeholders: TODOS },
  { clave: 'landing.programas_cta', seccion: 'landing', etiqueta: 'Programas: botón', tipo: 'texto',
    max: LIMITES.boton, placeholders: TODOS },

  // ── Landing: transformación ──
  { clave: 'landing.transformacion_kicker', seccion: 'landing', etiqueta: 'Transformación: etiqueta', tipo: 'texto',
    max: LIMITES.kicker, placeholders: TODOS },
  { clave: 'landing.transformacion_titulo', seccion: 'landing', etiqueta: 'Transformación: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.transformacion_sin', seccion: 'landing', etiqueta: 'Transformación: columna "Sin"', tipo: 'lista-texto',
    max: LIMITES.bullet, maxItems: LIMITES.maxTransformacion, minItems: 1, placeholders: TODOS },
  { clave: 'landing.transformacion_con', seccion: 'landing', etiqueta: 'Transformación: columna "Con"', tipo: 'lista-texto',
    max: LIMITES.bullet, maxItems: LIMITES.maxTransformacion, minItems: 1, placeholders: TODOS,
    ayuda: '{duracion} se sustituye por los meses de los planes activos.' },

  // ── Landing: proceso ──
  { clave: 'landing.proceso_kicker', seccion: 'landing', etiqueta: 'Proceso: etiqueta', tipo: 'texto',
    max: LIMITES.kicker, placeholders: TODOS },
  { clave: 'landing.proceso_titulo', seccion: 'landing', etiqueta: 'Proceso: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.proceso_pasos', seccion: 'landing', etiqueta: 'Proceso: pasos', tipo: 'lista-objetos',
    maxItems: LIMITES.maxProcesoPasos, minItems: 1, placeholders: TODOS,
    ayuda: 'El número de cada paso se pone solo.',
    campos: [
      { clave: 'titulo', etiqueta: 'Título', tipo: 'texto', max: LIMITES.tituloItem },
      { clave: 'desc', etiqueta: 'Descripción', tipo: 'textarea', max: LIMITES.descItem },
    ] },

  // ── Landing: testimonios ──
  { clave: 'landing.testimonios_kicker', seccion: 'landing', etiqueta: 'Testimonios: etiqueta', tipo: 'texto',
    max: LIMITES.kicker, placeholders: TODOS },
  { clave: 'landing.testimonios_titulo', seccion: 'landing', etiqueta: 'Testimonios: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.testimonios_subtitulo', seccion: 'landing', etiqueta: 'Testimonios: subtítulo', tipo: 'textarea',
    max: LIMITES.subtituloSeccion, placeholders: TODOS },
  { clave: 'landing.testimonios', seccion: 'landing', etiqueta: 'Testimonios', tipo: 'lista-objetos',
    maxItems: LIMITES.maxTestimonios,
    ayuda: 'Sin testimonios, la sección no se muestra.',
    campos: [
      { clave: 'name', etiqueta: 'Nombre', tipo: 'texto', max: LIMITES.tituloItem },
      { clave: 'age', etiqueta: 'Edad', tipo: 'texto', max: 10 },
      { clave: 'nivel', etiqueta: 'Nivel', tipo: 'texto', max: LIMITES.ciudad },
      { clave: 'initials', etiqueta: 'Iniciales', tipo: 'texto', max: 4 },
      { clave: 'quote', etiqueta: 'Testimonio', tipo: 'textarea', max: LIMITES.testimonioQuote },
    ] },

  // ── Landing: beneficios ──
  { clave: 'landing.beneficios_titulo', seccion: 'landing', etiqueta: 'Beneficios: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.beneficios_subtitulo', seccion: 'landing', etiqueta: 'Beneficios: subtítulo', tipo: 'textarea',
    max: LIMITES.subtituloSeccion, placeholders: TODOS },
  { clave: 'landing.beneficios_items', seccion: 'landing', etiqueta: 'Beneficios: tarjetas', tipo: 'lista-objetos',
    maxItems: LIMITES.maxBeneficios, minItems: 1, placeholders: TODOS,
    campos: [
      { clave: 'titulo', etiqueta: 'Título', tipo: 'texto', max: LIMITES.tituloItem },
      { clave: 'desc', etiqueta: 'Descripción', tipo: 'textarea', max: LIMITES.descItem },
    ] },

  // ── Landing: catálogo de cursos ──
  { clave: 'landing.catalogoTitulo', seccion: 'landing', etiqueta: 'Catálogo: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS, ayuda: 'Solo se ve si hay cursos publicados.' },
  { clave: 'landing.catalogoSubtitulo', seccion: 'landing', etiqueta: 'Catálogo: subtítulo', tipo: 'textarea',
    max: LIMITES.subtituloSeccion, placeholders: TODOS },

  // ── Landing: FAQ ──
  { clave: 'landing.faq_kicker', seccion: 'landing', etiqueta: 'FAQ: etiqueta', tipo: 'texto',
    max: LIMITES.kicker, placeholders: TODOS },
  { clave: 'landing.faq_titulo', seccion: 'landing', etiqueta: 'FAQ: título', tipo: 'texto',
    max: LIMITES.tituloSeccion, placeholders: TODOS },
  { clave: 'landing.faq_items', seccion: 'landing', etiqueta: 'FAQ: preguntas', tipo: 'lista-objetos',
    maxItems: LIMITES.maxFaq, minItems: 1, placeholders: TODOS,
    campos: [
      { clave: 'q', etiqueta: 'Pregunta', tipo: 'texto', max: LIMITES.faqPregunta },
      { clave: 'a', etiqueta: 'Respuesta', tipo: 'textarea', max: LIMITES.faqRespuesta },
    ] },

  // ── Landing: CTA final ──
  { clave: 'landing.cta_titulo', seccion: 'landing', etiqueta: 'Cierre: título', tipo: 'texto',
    max: LIMITES.heroTitulo, placeholders: TODOS },
  { clave: 'landing.cta_highlight', seccion: 'landing', etiqueta: 'Cierre: título (línea resaltada)', tipo: 'texto',
    max: LIMITES.heroHighlight, placeholders: TODOS },
  { clave: 'landing.cta_subtitulo', seccion: 'landing', etiqueta: 'Cierre: subtítulo', tipo: 'textarea',
    max: LIMITES.subtituloSeccion, placeholders: TODOS },
  { clave: 'landing.cta_boton', seccion: 'landing', etiqueta: 'Cierre: botón', tipo: 'texto',
    max: LIMITES.boton, placeholders: TODOS },
  { clave: 'landing.cta_whatsapp', seccion: 'landing', etiqueta: 'Cierre: botón de WhatsApp', tipo: 'texto',
    max: LIMITES.boton, placeholders: TODOS },

  // ── Precios (canónicos; los alias legacy se derivan en el merge) ──
  { clave: 'precios.inscripcion', seccion: 'precios', etiqueta: 'Inscripción', tipo: 'entero',
    min: LIMITES.precioMin, max: LIMITES.precioMax,
    ayuda: 'MXN, sin centavos. Es la cifra que usa el texto {inscripcion} y la que se cobra en el nivel que no tenga la suya.' },
  { clave: 'precios.inscripcionSecundaria', seccion: 'precios', etiqueta: 'Inscripción de Secundaria', tipo: 'entero',
    min: LIMITES.precioMin, max: LIMITES.precioMax,
    ayuda: 'Solo si la secundaria se inscribe con otra cifra. Igual a la de arriba = se cobra lo mismo.' },
  { clave: 'precios.inscripcionPreparatoria', seccion: 'precios', etiqueta: 'Inscripción de Preparatoria', tipo: 'entero',
    min: LIMITES.precioMin, max: LIMITES.precioMax,
    ayuda: 'Solo si la preparatoria se inscribe con otra cifra. Igual a la de arriba = se cobra lo mismo.' },
  { clave: 'precios.certificacionSecundaria', seccion: 'precios', etiqueta: 'Certificación de Secundaria', tipo: 'entero',
    min: LIMITES.precioMin, max: LIMITES.precioMax },
  { clave: 'precios.certificacionPreparatoria', seccion: 'precios', etiqueta: 'Certificación de Preparatoria', tipo: 'entero',
    min: LIMITES.precioMin, max: LIMITES.precioMax },

  // ── Modalidades (semántica especial: objeto por id, solo mensualidad y activa) ──
  { clave: 'modalidades', seccion: 'modalidades', etiqueta: 'Planes', tipo: 'modalidades',
    min: LIMITES.precioMin, max: LIMITES.precioMax,
    ayuda: 'Por plan: mensualidad (MXN) y si está activo. Duración y materias por mes no se editan.' },
]

// ─── Índices ─────────────────────────────────────────────────────────────────

/** Orden y etiqueta de las secciones del editor. */
export const SECCIONES: ReadonlyArray<{ id: SeccionCampo; etiqueta: string }> = [
  { id: 'identidad', etiqueta: 'Identidad' },
  { id: 'colores', etiqueta: 'Colores' },
  { id: 'contacto', etiqueta: 'Contacto' },
  { id: 'redes', etiqueta: 'Redes sociales' },
  { id: 'landing', etiqueta: 'Página de inicio' },
  { id: 'precios', etiqueta: 'Precios' },
  { id: 'modalidades', etiqueta: 'Planes' },
]

const POR_CLAVE: ReadonlyMap<string, Campo> = new Map(CAMPOS.map((c) => [c.clave, c]))

/**
 * Descriptor de una clave, o `undefined` si no es editable. Acepta `string`
 * porque la API recibe rutas arbitrarias del cliente.
 */
export function campoPorClave(clave: string): Campo | undefined {
  return POR_CLAVE.get(clave)
}

/** Los campos agrupados por sección, en el mismo orden que `CAMPOS`. */
export const CAMPOS_POR_SECCION: Readonly<Record<SeccionCampo, ReadonlyArray<Campo>>> = (() => {
  const grupos: Record<SeccionCampo, Campo[]> = {
    identidad: [], contacto: [], redes: [], colores: [], landing: [], precios: [], modalidades: [],
  }
  for (const c of CAMPOS) grupos[c.seccion].push(c)
  return grupos
})()
