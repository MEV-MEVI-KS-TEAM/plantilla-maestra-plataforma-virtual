/**
 * Paletas curadas para "Personalizar mi página".
 *
 * El admin de la escuela no elige 12 colores sueltos: elige UNA paleta de esta
 * lista y la plataforma aplica los 12 tokens de `CONFIG.colores` de golpe.
 * Así ningún cliente termina con botones ilegibles o un sidebar gris sobre
 * texto gris. Cada paleta viene verificada contra `PARES_CONTRASTE` en
 * tests/unit/paletas.spec.ts.
 *
 * Módulo PURO e isomorfo (sin imports): lo consumen el editor en cliente, el
 * server action que persiste la elección y las pruebas.
 *
 * Los 12 tokens son EXACTAMENTE los de `CONFIG.colores` (src/lib/config.ts),
 * en el mismo orden. Si allá se agrega uno, aquí hay que agregarlo también:
 * el spec compara la paleta original contra CONFIG y lo detecta.
 */

export type TokensColores = {
  /** Sidebar, headings, fondos oscuros. Lleva texto blanco encima. */
  primario: string
  /** Un paso más claro que primario (hover del sidebar, franjas). */
  secundario: string
  /** Botones primarios, links, highlights. */
  acento: string
  /** Tinte muy claro del acento: fondo de badges y avisos. */
  acentoClaro: string
  /** Acento un paso más oscuro: hover de botones primarios. */
  acentoHover: string
  /** Texto sobre botones de acento (blanco o casi negro). */
  textoSobreAcento: string
  /** Texto principal sobre fondos claros. */
  texto: string
  /** Labels, placeholders, captions. */
  textoSecundario: string
  /** Fondo de página. */
  fondo: string
  /** Cards, modales, inputs. */
  superficie: string
  /** Bordes sutiles. */
  borde: string
  /** Barra del navegador móvil. Debe ser igual a `fondo`. */
  themeColor: string
}

export interface Paleta {
  /** Slug estable; es lo que se guarda en la base. */
  id: string
  nombre: string
  descripcion: string
  /** true SOLO en la paleta que reproduce CONFIG.colores tal cual viene de fábrica. */
  original?: boolean
  colores: TokensColores
}

/** Los 12 nombres en el orden de CONFIG.colores. Sirve para iterar el editor. */
export const TOKENS_COLORES: readonly (keyof TokensColores)[] = [
  'primario',
  'secundario',
  'acento',
  'acentoClaro',
  'acentoHover',
  'textoSobreAcento',
  'texto',
  'textoSecundario',
  'fondo',
  'superficie',
  'borde',
  'themeColor',
] as const

/** Etiquetas cortas para el editor, en el lenguaje del admin, no del CSS. */
export const ETIQUETAS_TOKENS: Record<keyof TokensColores, string> = {
  primario:         'Primario (menú lateral y títulos)',
  secundario:       'Secundario (variante del primario)',
  acento:           'Acento (botones y enlaces)',
  acentoClaro:      'Acento claro (fondo de etiquetas)',
  acentoHover:      'Acento al pasar el cursor',
  textoSobreAcento: 'Texto sobre botones',
  texto:            'Texto principal',
  textoSecundario:  'Texto secundario (notas y etiquetas)',
  fondo:            'Fondo de la página',
  superficie:       'Tarjetas y formularios',
  borde:            'Bordes',
  themeColor:       'Barra del navegador en móvil',
}

/**
 * Pares que deben contrastar, con su mínimo WCAG. 4.5 es AA para texto
 * normal; 3.0 es AA para componentes de UI (un botón o link sobre una card,
 * donde además hay forma y subrayado que ayudan a distinguirlo).
 *
 * `'#FFFFFF'` como `a` es literal, no token: el sidebar pinta texto blanco
 * sobre `primario` y ese blanco no sale de la paleta.
 */
export const PARES_CONTRASTE: ReadonlyArray<{
  a: keyof TokensColores | '#FFFFFF'
  b: keyof TokensColores
  minimo: number
  etiqueta: string
}> = [
  { a: 'acento',          b: 'textoSobreAcento', minimo: 4.5, etiqueta: 'Texto sobre botones' },
  { a: 'texto',           b: 'fondo',            minimo: 4.5, etiqueta: 'Texto sobre el fondo' },
  { a: 'texto',           b: 'superficie',       minimo: 4.5, etiqueta: 'Texto sobre tarjetas' },
  { a: 'textoSecundario', b: 'fondo',            minimo: 4.5, etiqueta: 'Texto secundario sobre el fondo' },
  { a: 'textoSecundario', b: 'superficie',       minimo: 4.5, etiqueta: 'Texto secundario sobre tarjetas' },
  { a: '#FFFFFF',         b: 'primario',         minimo: 4.5, etiqueta: 'Texto blanco del menú lateral' },
  { a: 'acento',          b: 'superficie',       minimo: 3.0, etiqueta: 'Enlaces y botones sobre tarjetas' },
  { a: 'acentoHover',     b: 'textoSobreAcento', minimo: 4.5, etiqueta: 'Texto sobre botones al pasar el cursor' },
]

/**
 * Las 12 paletas. La primera es la ORIGINAL y sus valores son copia literal
 * de CONFIG.colores: una escuela que "restaura" vuelve exactamente a fábrica.
 *
 * Criterio de cada familia: primario = tono profundo (fondo de sidebar con
 * texto blanco), secundario = un paso más claro, acento = color vivo de botón
 * con ratio ≥ 4.5 contra su texto, acentoClaro = tinte -100 del acento,
 * acentoHover = acento un paso más oscuro, fondo = casi blanco con matiz de la
 * familia, superficie = blanco, borde = gris claro con el mismo matiz.
 *
 * Varios acentos NO son el -500 de Tailwind sino el -600/-700: el -500 de
 * azul, verde esmeralda, cielo y turquesa queda entre 3.6 y 4.1 contra blanco
 * y no llega a AA. Todos en MAYÚSCULAS #RRGGBB para que `detectarPaleta`
 * compare como texto.
 */
export const PALETAS: readonly Paleta[] = [
  {
    id: 'azul-institucional',
    nombre: 'Azul institucional',
    descripcion: 'La paleta de fábrica: azul marino con acento azul brillante.',
    original: true,
    colores: {
      primario:         '#0F172A',
      secundario:       '#1E293B',
      acento:           '#3B82F6',
      acentoClaro:      '#DBEAFE',
      acentoHover:      '#2563EB',
      textoSobreAcento: '#FFFFFF',
      texto:            '#0F172A',
      textoSecundario:  '#525252',
      fondo:            '#F8FAFC',
      superficie:       '#FFFFFF',
      borde:            '#E5E7EB',
      themeColor:       '#F8FAFC',
    },
  },
  {
    id: 'verde-esmeralda',
    nombre: 'Verde esmeralda',
    descripcion: 'Verde profundo y fresco, con acento esmeralda.',
    colores: {
      primario:         '#064E3B',
      secundario:       '#065F46',
      acento:           '#047857',
      acentoClaro:      '#D1FAE5',
      acentoHover:      '#065F46',
      textoSobreAcento: '#FFFFFF',
      texto:            '#022C22',
      textoSecundario:  '#4A5D55',
      fondo:            '#ECFDF5',
      superficie:       '#FFFFFF',
      borde:            '#D3E4DC',
      themeColor:       '#ECFDF5',
    },
  },
  {
    id: 'guinda',
    nombre: 'Guinda',
    descripcion: 'Vino profundo, sobrio, con acento guinda.',
    colores: {
      primario:         '#4A1024',
      secundario:       '#651733',
      acento:           '#9F1239',
      acentoClaro:      '#FFE4E6',
      acentoHover:      '#881337',
      textoSobreAcento: '#FFFFFF',
      texto:            '#2A0A17',
      textoSecundario:  '#5C4A52',
      fondo:            '#FDF7F9',
      superficie:       '#FFFFFF',
      borde:            '#E8D9DE',
      themeColor:       '#FDF7F9',
    },
  },
  {
    id: 'naranja',
    nombre: 'Naranja',
    descripcion: 'Cálida y enérgica, con acento naranja quemado.',
    colores: {
      primario:         '#7C2D12',
      secundario:       '#9A3412',
      acento:           '#C2410C',
      acentoClaro:      '#FFEDD5',
      acentoHover:      '#9A3412',
      textoSobreAcento: '#FFFFFF',
      texto:            '#2A1509',
      textoSecundario:  '#6B5548',
      fondo:            '#FFF7ED',
      superficie:       '#FFFFFF',
      borde:            '#F0DED0',
      themeColor:       '#FFF7ED',
    },
  },
  {
    id: 'morado',
    nombre: 'Morado',
    descripcion: 'Violeta profundo con acento morado vivo.',
    colores: {
      primario:         '#4C1D95',
      secundario:       '#5B21B6',
      acento:           '#7C3AED',
      acentoClaro:      '#EDE9FE',
      acentoHover:      '#6D28D9',
      textoSobreAcento: '#FFFFFF',
      texto:            '#1F1235',
      textoSecundario:  '#5B5670',
      fondo:            '#F8F5FF',
      superficie:       '#FFFFFF',
      borde:            '#E4DDF3',
      themeColor:       '#F8F5FF',
    },
  },
  {
    id: 'turquesa',
    nombre: 'Turquesa',
    descripcion: 'Verde azulado, limpio, con acento turquesa.',
    colores: {
      primario:         '#134E4A',
      secundario:       '#115E59',
      acento:           '#0F766E',
      acentoClaro:      '#CCFBF1',
      acentoHover:      '#115E59',
      textoSobreAcento: '#FFFFFF',
      texto:            '#042F2E',
      textoSecundario:  '#4A5F5D',
      fondo:            '#F0FDFA',
      superficie:       '#FFFFFF',
      borde:            '#CFE3E0',
      themeColor:       '#F0FDFA',
    },
  },
  {
    // ÚNICA paleta oscura. `texto` es casi blanco y `textoSobreAcento` casi
    // negro (el dorado es claro). `acentoClaro` aquí es un dorado APAGADO y
    // oscuro: un tinte pastel sobre negro se vería como un parche. Ojo:
    // `primario` sigue siendo oscuro (lleva texto blanco en el sidebar), así
    // que un heading pintado con primario sobre `fondo` casi no contrasta;
    // en tema oscuro los headings deben usar `texto`.
    id: 'dorado-sobre-negro',
    nombre: 'Dorado sobre negro',
    descripcion: 'Tema oscuro: fondo negro, texto claro y acento dorado.',
    colores: {
      primario:         '#3F2E06',
      secundario:       '#5A4310',
      acento:           '#D4A017',
      acentoClaro:      '#332808',
      acentoHover:      '#B8880F',
      textoSobreAcento: '#0A0A0A',
      texto:            '#F5F1E6',
      textoSecundario:  '#B3AC9C',
      fondo:            '#0B0B0F',
      superficie:       '#16161D',
      borde:            '#2E2A22',
      themeColor:       '#0B0B0F',
    },
  },
  {
    id: 'gris-corporativo',
    nombre: 'Gris corporativo',
    descripcion: 'Neutra y formal: grises con acento gris azulado.',
    colores: {
      primario:         '#1F2937',
      secundario:       '#374151',
      acento:           '#475569',
      acentoClaro:      '#E2E8F0',
      acentoHover:      '#334155',
      textoSobreAcento: '#FFFFFF',
      texto:            '#171717',
      textoSecundario:  '#595959',
      fondo:            '#F5F5F5',
      superficie:       '#FFFFFF',
      borde:            '#D4D4D4',
      themeColor:       '#F5F5F5',
    },
  },
  {
    id: 'rojo',
    nombre: 'Rojo',
    descripcion: 'Rojo intenso con base granate.',
    colores: {
      primario:         '#7F1D1D',
      secundario:       '#991B1B',
      acento:           '#DC2626',
      acentoClaro:      '#FEE2E2',
      acentoHover:      '#B91C1C',
      textoSobreAcento: '#FFFFFF',
      texto:            '#2A0F0F',
      textoSecundario:  '#5E4B4B',
      fondo:            '#FEF6F6',
      superficie:       '#FFFFFF',
      borde:            '#EEDADA',
      themeColor:       '#FEF6F6',
    },
  },
  {
    id: 'verde-bosque',
    nombre: 'Verde bosque',
    descripcion: 'Verde natural, más cálido que el esmeralda.',
    colores: {
      primario:         '#14532D',
      secundario:       '#166534',
      acento:           '#15803D',
      acentoClaro:      '#DCFCE7',
      acentoHover:      '#166534',
      textoSobreAcento: '#FFFFFF',
      texto:            '#052E16',
      textoSecundario:  '#4B5E50',
      fondo:            '#F4FBF5',
      superficie:       '#FFFFFF',
      borde:            '#D5E6D8',
      themeColor:       '#F4FBF5',
    },
  },
  {
    id: 'azul-cielo',
    nombre: 'Azul cielo',
    descripcion: 'Azul claro y luminoso, más ligero que el institucional.',
    colores: {
      primario:         '#0C4A6E',
      secundario:       '#075985',
      acento:           '#0369A1',
      acentoClaro:      '#E0F2FE',
      acentoHover:      '#075985',
      textoSobreAcento: '#FFFFFF',
      texto:            '#082F49',
      textoSecundario:  '#4A5B66',
      fondo:            '#F0F9FF',
      superficie:       '#FFFFFF',
      borde:            '#CFE4EF',
      themeColor:       '#F0F9FF',
    },
  },
  {
    id: 'rosa',
    nombre: 'Rosa',
    descripcion: 'Rosa intenso con base magenta profunda.',
    colores: {
      primario:         '#831843',
      secundario:       '#9D174D',
      acento:           '#DB2777',
      acentoClaro:      '#FCE7F3',
      acentoHover:      '#BE185D',
      textoSobreAcento: '#FFFFFF',
      texto:            '#2B0A1B',
      textoSecundario:  '#5F4C55',
      fondo:            '#FDF5F9',
      superficie:       '#FFFFFF',
      borde:            '#EED9E3',
      themeColor:       '#FDF5F9',
    },
  },
]

export function paletaPorId(id: string): Paleta | undefined {
  return PALETAS.find(p => p.id === id)
}

/**
 * Id de la paleta cuyos 12 tokens coinciden EXACTAMENTE con los dados
 * (comparación en mayúsculas), o null. Sirve para que el editor marque cuál
 * está activa al abrir, y para detectar que el cliente tiene una paleta a
 * mano que no es ninguna de las curadas (→ no se marca ninguna).
 *
 * Con un token faltante o inválido no hay coincidencia posible: 11 de 12 no
 * es "la misma paleta".
 */
export function detectarPaleta(colores: Partial<TokensColores>): string | null {
  const normal: Partial<Record<keyof TokensColores, string>> = {}
  for (const token of TOKENS_COLORES) {
    const v = colores[token]
    if (typeof v !== 'string') return null
    normal[token] = v.trim().toUpperCase()
  }
  const encontrada = PALETAS.find(p =>
    TOKENS_COLORES.every(token => p.colores[token].toUpperCase() === normal[token]),
  )
  return encontrada ? encontrada.id : null
}
