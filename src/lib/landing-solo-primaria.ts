/**
 * Los textos de fábrica de la landing en un combo SOLO Primaria.
 *
 * La plantilla nace vendiendo Secundaria y Preparatoria con acompañamiento para el
 * certificado: esos textos nombran a la autoridad educativa y hablan de validez
 * oficial. Un combo que no vende Sec ni Prepa no puede decir nada de eso: la
 * plataforma no puede sugerir afiliación ni validez oficial en Primaria.
 *
 * La regla: un texto IGUAL AL DE FÁBRICA se cambia por su versión neutral; uno que el
 * cliente editó, en su config.ts o desde «Personalizar mi página», se respeta. Por eso
 * se compara el texto completo y no se busca una palabra dentro. Vive en el merge, así
 * que la landing y los valores de fábrica del editor ven lo mismo.
 *
 * Con cualquier otra oferta no hace nada: `aplicarLandingSoloPrimaria` devuelve el
 * mismo objeto. Es PURO, sin imports: lo usa también el generador del PDF de entrega.
 *
 * En un combo MIXTO (Primaria con Secundaria o Preparatoria) esos textos siguen siendo
 * ciertos, pero solo de esos niveles, y junto a la tarjeta de Primaria se leerían como
 * si también le aplicaran. `aplicarLandingMixtoPrimaria` les pone a qué niveles aplican,
 * con la misma regla: solo el texto de fábrica exacto, y sin el add-on, nada.
 */

type Plano = Record<string, unknown>

const esPlano = (v: unknown): v is Plano => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * La leyenda de Primaria sobre la constancia y la certificación (Kevin, 7-nov-2026).
 *
 * Primaria trae un precio sugerido de certificación que el cliente edita, porque las escuelas
 * sí la ofrecen. La leyenda anterior («Entrega constancia de avance; no incluye certificado
 * oficial») contradecía ese precio. Esta dice qué acredita la constancia y que la
 * certificación va aparte, con la institución: sin nombrar autoridades ni prometer validez.
 * Viven aquí porque este módulo ya es puro y lo leen las dos portadas y el PDF de entrega.
 */
export const CERTIFICACION_APARTE_PRIMARIA =
  'No sustituye al certificado de estudios; la certificación se tramita por separado con la institución.'

/** Al pie de la constancia del alumno de Primaria: el texto exacto de Kevin, en dos piezas (la segunda va en negritas). */
export const AVANCE_CONSTANCIA_PRIMARIA = 'Esta constancia acredita el avance del alumno en la plataforma.'
export const LEYENDA_CONSTANCIA_PRIMARIA = `${AVANCE_CONSTANCIA_PRIMARIA} ${CERTIFICACION_APARTE_PRIMARIA}`

/** Junto a la cifra de Primaria en las portadas. «La» y no «Esta»: ahí no hay constancia a la vista. */
export const NOTA_PRECIOS_PRIMARIA =
  `La constancia acredita el avance del alumno en la plataforma. ${CERTIFICACION_APARTE_PRIMARIA}`

const primeraMinuscula = (s: string) => `${s.charAt(0).toLowerCase()}${s.slice(1)}`

/** La misma nota cuando la caja habla de varios niveles: dice que es de Primaria. */
export const NOTA_PRECIOS_PRIMARIA_ACOTADA = `En Primaria, ${primeraMinuscula(NOTA_PRECIOS_PRIMARIA)}`

/**
 * Al final de la respuesta de fábrica sobre validez en un combo mixto. Sin «del alumno en la
 * plataforma»: el editor admite 500 caracteres por respuesta y con la nota completa esa
 * respuesta llegaba a 516 (Sec + Prepa), así que «Restaurar» no la podría volver a publicar.
 */
export const NOTA_FAQ_MIXTO_PRIMARIA = `En Primaria, la constancia acredita el avance y ${primeraMinuscula(CERTIFICACION_APARTE_PRIMARIA)}`

/** Texto de fábrica (config.ts) → texto neutral. Lo vigila tests/unit/primaria-revision.spec.ts. */
export const TEXTOS_SOLO_PRIMARIA: Readonly<Record<string, string>> = {
  // Lema y hero
  'Tu certificación con apoyo desde casa': 'Tu Primaria con apoyo desde casa',
  'Tu Secundaria o Preparatoria': 'Tu Primaria',
  'Sin ir a la escuela. Sin perder tu trabajo.\nCon apoyo en tu certificado SEP.':
    'Sin ir a la escuela. Sin perder tu trabajo.\nCon acompañamiento en cada materia.',
  'Acompañamiento Certificado': 'Acompañamiento en cada materia',
  'Centro de Apoyo para la Acreditación de Conocimientos': 'Primaria 100% en línea',
  // Dolor
  'Necesitas el certificado, pero no puedes darte el lujo de dejar de ingresar.':
    'Quieres terminar tu primaria, pero no puedes darte el lujo de dejar de ingresar.',
  'Estudia a tu ritmo, desde tu celular, sin horarios fijos. Con certificado oficial.':
    'Estudia a tu ritmo, desde tu celular, sin horarios fijos.',
  // Programas
  'Secundaria y Preparatoria': 'Primaria',
  'Inscripción única {inscripcion} · Elige tu nivel y plan': 'Inscripción única {inscripcion} · Elige tu plan',
  // Antes y después
  'Sin acceso a tu certificado para avanzar profesionalmente.': 'Sin haber terminado la primaria que te hace falta.',
  'Oportunidades de trabajo que se te escapan sin el papel.': 'Oportunidades que se te escapan por no haber terminado tus estudios.',
  'Te apoyamos en la gestión de tu certificado oficial SEP.': 'Te acompañamos en cada materia hasta terminar el programa.',
  'Abre puertas: trabajo, universidad, trámites oficiales.': 'Das el primer paso para seguir estudiando.',
  // Cómo funciona
  'Crea tu cuenta y elige tu nivel: Secundaria o Preparatoria.': 'Crea tu cuenta y elige tu plan de Primaria.',
  'Certificación oficial SEP': 'Concluye tu programa',
  'Concluye tu nivel y recibe el certificado con validez nacional.': 'Termina tus materias y recibe tu constancia de avance.',
  // Testimonios y beneficios
  'Miles de alumnos ya obtuvieron su certificado con nosotros.': 'Personas que decidieron terminar lo que empezaron.',
  'Gestión de tu certificado SEP': 'Programa completo de Primaria',
  'Validez nacional reconocida por el sistema educativo mexicano.': '18 materias organizadas por meses, con lecciones, actividades y evaluaciones.',
  // Preguntas
  '¿El certificado tiene validez oficial en todo México?': '¿Qué recibo al terminar?',
  'Te acompañamos en el proceso para obtener tu certificado oficial SEP, el cual es reconocido a nivel nacional para trámites laborales, universitarios y gubernamentales. Fungimos como Centro de Apoyo para la Acreditación de Conocimientos: facilitamos el camino, mientras la validez oficial corresponde a la SEP.':
    'Al concluir tus materias, la plataforma emite tu constancia de avance, que acredita lo que estudiaste dentro del programa. Si te interesa la certificación de tu nivel, la escuela te informa las condiciones antes de inscribirte.',
  'Secundaria: Certificado de Primaria, CURP, Acta de Nacimiento, Identificación Oficial y foto de perfil fondo blanco. Preparatoria: los mismos más Certificado de Secundaria.':
    'Acta de Nacimiento, CURP, Identificación Oficial y Comprobante de Domicilio. Si el alumno es menor de 18 años, también pedimos los datos de su madre, padre o tutor.',
}

/** Los campos de `landing` que traen estos textos: uno por uno o dentro de una lista. */
const CAMPOS = [
  'hero_titulo', 'hero_subtitulo', 'hero_badges', 'hero_badge_superior', 'dolor_items', 'dolor_cierre_sub',
  'programas_titulo', 'programas_subtitulo', 'transformacion_sin', 'transformacion_con', 'proceso_pasos',
  'testimonios_subtitulo', 'beneficios_items', 'faq_items',
] as const

const neutral = (v: unknown): unknown => {
  if (typeof v === 'string') return Object.prototype.hasOwnProperty.call(TEXTOS_SOLO_PRIMARIA, v) ? TEXTOS_SOLO_PRIMARIA[v] : v
  if (Array.isArray(v)) return v.map(neutral)
  if (esPlano(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, neutral(x)]))
  return v
}

/** El contador de fábrica «2 niveles, Sec · Prepa»: en este combo son las 18 materias. */
const contadorNeutral = (c: unknown): unknown =>
  esPlano(c) && c.valor === 2 && c.etiqueta === 'Niveles' && c.sub === 'Sec · Prepa'
    ? { ...c, valor: 18, etiqueta: 'Materias', sub: 'Primaria' }
    : c

/** ¿Vende Primaria y ninguno de los dos niveles con trámite ante la autoridad? */
export function ofertaSoloPrimaria(cfg: { readonly niveles?: unknown; readonly primaria?: unknown }): boolean {
  if (!esPlano(cfg.primaria) || cfg.primaria.activa !== true) return false
  const niveles = Array.isArray(cfg.niveles) ? cfg.niveles : []
  return !niveles.some((n) => n === 'secundaria' || n === 'preparatoria')
}

const conTramite = (niveles: unknown): string[] =>
  (Array.isArray(niveles) ? niveles : []).filter((n): n is string => n === 'secundaria' || n === 'preparatoria')

const nombreNiveles = (niveles: readonly string[]): string =>
  niveles.length > 1 ? 'Secundaria y Preparatoria' : niveles[0] === 'secundaria' ? 'Secundaria' : 'Preparatoria'

/** Lo que un combo mixto dice de cada texto de fábrica. Lo vigila tests/unit/primaria-revision.spec.ts. */
export function textosMixtoPrimaria(nivelesConTramite: readonly string[]): Readonly<Record<string, string>> {
  const N = nombreNiveles(nivelesConTramite)
  const dos = nivelesConTramite.length > 1
  const lista = dos ? 'Primaria, Secundaria o Preparatoria' : `Primaria o ${N}`
  const listaY = dos ? 'Primaria, Secundaria y Preparatoria' : `Primaria y ${N}`
  return {
    // Lema y hero
    'Tu certificación con apoyo desde casa': 'Tu educación con apoyo desde casa',
    'Tu Secundaria o Preparatoria': `Tu ${lista}`,
    'Sin ir a la escuela. Sin perder tu trabajo.\nCon apoyo en tu certificado SEP.':
      `Sin ir a la escuela. Sin perder tu trabajo.\nCon apoyo en tu certificado SEP en ${N}.`,
    'Acompañamiento Certificado': 'Acompañamiento en cada materia',
    'Centro de Apoyo para la Acreditación de Conocimientos': `Centro de Apoyo para la Acreditación en ${N}`,
    // Dolor
    'Necesitas el certificado, pero no puedes darte el lujo de dejar de ingresar.':
      'Quieres terminar tus estudios, pero no puedes darte el lujo de dejar de ingresar.',
    'Estudia a tu ritmo, desde tu celular, sin horarios fijos. Con certificado oficial.':
      `Estudia a tu ritmo, desde tu celular, sin horarios fijos. Con certificado oficial en ${N}.`,
    // Programas
    'Secundaria y Preparatoria': listaY,
    // Antes y después
    'Sin acceso a tu certificado para avanzar profesionalmente.': 'Sin terminar tus estudios para avanzar profesionalmente.',
    'Oportunidades de trabajo que se te escapan sin el papel.': 'Oportunidades que se te escapan por no haber terminado tus estudios.',
    'Te apoyamos en la gestión de tu certificado oficial SEP.': `Te apoyamos con tu certificado oficial SEP en ${N}.`,
    'Abre puertas: trabajo, universidad, trámites oficiales.': `En ${N}: trabajo, universidad, trámites oficiales.`,
    // Cómo funciona
    'Crea tu cuenta y elige tu nivel: Secundaria o Preparatoria.': `Crea tu cuenta y elige tu nivel: ${lista}.`,
    'Certificación oficial SEP': `Certificación oficial SEP en ${N}`,
    'Concluye tu nivel y recibe el certificado con validez nacional.':
      `En ${N}, concluye tu nivel y recibe el certificado con validez nacional. En Primaria recibes tu constancia de avance.`,
    // Testimonios y beneficios
    'Miles de alumnos ya obtuvieron su certificado con nosotros.': 'Personas que decidieron terminar lo que empezaron.',
    'Gestión de tu certificado SEP': `Gestión de tu certificado SEP en ${N}`,
    'Validez nacional reconocida por el sistema educativo mexicano.': `En ${N}, validez nacional reconocida por el sistema educativo mexicano.`,
    // Preguntas
    '¿El certificado tiene validez oficial en todo México?': `¿El certificado de ${N} tiene validez oficial en todo México?`,
    'Te acompañamos en el proceso para obtener tu certificado oficial SEP, el cual es reconocido a nivel nacional para trámites laborales, universitarios y gubernamentales. Fungimos como Centro de Apoyo para la Acreditación de Conocimientos: facilitamos el camino, mientras la validez oficial corresponde a la SEP.':
      `En ${N}, te acompañamos en el proceso para obtener tu certificado oficial SEP, el cual es reconocido a nivel nacional para trámites laborales, universitarios y gubernamentales. Fungimos como Centro de Apoyo para la Acreditación de Conocimientos: facilitamos el camino, mientras la validez oficial corresponde a la SEP. ${NOTA_FAQ_MIXTO_PRIMARIA}`,
    'Secundaria: Certificado de Primaria, CURP, Acta de Nacimiento, Identificación Oficial y foto de perfil fondo blanco. Preparatoria: los mismos más Certificado de Secundaria.':
      'Primaria: Acta de Nacimiento, CURP, Identificación Oficial y Comprobante de Domicilio; si el alumno es menor de 18 años, también los datos de su madre, padre o tutor. Secundaria: Certificado de Primaria, CURP, Acta de Nacimiento, Identificación Oficial y foto de perfil fondo blanco. Preparatoria: los mismos más Certificado de Secundaria.',
  }
}

/** ¿Vende Primaria junto con Secundaria o Preparatoria? */
export function ofertaMixtaPrimaria(cfg: { readonly niveles?: unknown; readonly primaria?: unknown }): boolean {
  if (!esPlano(cfg.primaria) || cfg.primaria.activa !== true) return false
  return conTramite(cfg.niveles).length > 0
}

const reemplazar = (v: unknown, mapa: Readonly<Record<string, string>>): unknown => {
  if (typeof v === 'string') return Object.prototype.hasOwnProperty.call(mapa, v) ? mapa[v] : v
  if (Array.isArray(v)) return v.map((x) => reemplazar(x, mapa))
  if (esPlano(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, reemplazar(x, mapa)]))
  return v
}

/**
 * La sección de validez oficial, si la escuela la enciende, y la etiqueta con la que el
 * menú y la franja la nombran. La portada la lee de CONFIG (no se edita desde el panel),
 * así que no pasa por el merge: se llama desde ahí. Sin combo mixto devuelve lo mismo.
 */
export function validezDeLaOferta<T>(cfg: { readonly niveles?: unknown; readonly primaria?: unknown }, validez: T): T {
  if (!ofertaMixtaPrimaria(cfg)) return validez
  const niveles = conTramite(cfg.niveles)
  const N = nombreNiveles(niveles)
  return reemplazar(validez, {
    'Validez oficial': `Validez oficial en ${niveles.length > 1 ? 'Sec y Prepa' : N}`,
    'Tu certificado vale en México y USA': `Tu certificado de ${N} vale en México y USA`,
    'Al terminar recibes DOS documentos oficiales': `Al terminar ${N.replace(' y ', ' o ')} recibes DOS documentos oficiales`,
  }) as T
}

/** El contador de fábrica «2 niveles, Sec · Prepa», con Primaria. */
const contadorMixto = (niveles: readonly string[]) => (c: unknown): unknown =>
  esPlano(c) && c.valor === 2 && c.etiqueta === 'Niveles' && c.sub === 'Sec · Prepa'
    ? niveles.length > 1
      ? { ...c, valor: 3, sub: 'Pri · Sec · Prepa' }
      : { ...c, sub: niveles[0] === 'secundaria' ? 'Pri · Sec' : 'Pri · Prepa' }
    : c

/**
 * Pone a qué niveles aplica cada texto de fábrica en un combo mixto. Se llama sobre el
 * clon del merge: con una oferta que no es mixta, y siempre con el add-on apagado,
 * devuelve el mismo objeto sin escribir nada.
 */
export function aplicarLandingMixtoPrimaria<T>(cfg: T): T {
  const c = cfg as unknown as Plano & { niveles?: unknown; primaria?: unknown }
  if (!ofertaMixtaPrimaria(c) || !esPlano(c.landing)) return cfg
  const niveles = conTramite(c.niveles)
  const mapa = textosMixtoPrimaria(niveles)
  const landing = c.landing
  for (const campo of CAMPOS) landing[campo] = reemplazar(landing[campo], mapa)
  if (Array.isArray(landing.contadores)) landing.contadores = landing.contadores.map(contadorMixto(niveles))
  if (esPlano(landing.validezOficial)) landing.validezOficial = validezDeLaOferta(c, landing.validezOficial)
  c.tagline = reemplazar(c.tagline, mapa)
  return cfg
}

/**
 * Deja los textos neutrales en `cfg` y lo devuelve. Se llama sobre el clon del merge:
 * con una oferta que no es Solo-Primaria no escribe nada.
 */
export function aplicarLandingSoloPrimaria<T>(cfg: T): T {
  const c = cfg as unknown as Plano & { niveles?: unknown; primaria?: unknown }
  if (!ofertaSoloPrimaria(c) || !esPlano(c.landing)) return cfg
  const landing = c.landing
  for (const campo of CAMPOS) landing[campo] = neutral(landing[campo])
  if (Array.isArray(landing.contadores)) landing.contadores = landing.contadores.map(contadorNeutral)
  // La acreditación de la red es de Sec/Prepa: aquí ni se pinta ni viaja al navegador.
  landing.validezOficial = { activa: false }
  c.tagline = neutral(c.tagline)
  return cfg
}
