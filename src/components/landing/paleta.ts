/**
 * Paleta de la portada clásica (`LandingClient`).
 *
 * Vive en su propio módulo, y no dentro del componente, por la misma razón que
 * `animada/tokens.ts`: es lógica PURA —hex a hex, sin estado ni DOM— y decide
 * los 18 colores con los que se pinta la página entera de una escuela. Dentro
 * de `LandingClient.tsx` era imposible de probar: ese archivo llama a
 * `Playfair_Display()` y `DM_Sans()` en el cuerpo del módulo y `next/font/google`
 * solo existe dentro del build de Next, así que una prueba unitaria no puede ni
 * importarlo. Aquí sí, y de eso vive `tests/unit/landing-paleta.spec.ts`.
 */
import { aclarar, oscurecer, luminanciaRelativa, colorLegibleSobre, colorLegibleConAlpha, oscurecerHasta } from '@/lib/contraste'
import { esPaletaPersonalizada } from '@/lib/landing-textos'
import type { LandingConfig } from '@/lib/site-config-core'

/**
 * Paleta de la landing. Los siete tonos base (hero…white) son los de siempre;
 * los siete derivados eran hex sueltos en el JSX y ahora salen de aquí para
 * que, cuando el admin cambie los colores desde el editor, se muevan con ellos.
 */
export type Paleta = {
  hero: string; navy: string; royal: string
  bright: string; azure: string; ice: string; white: string
  /** '#90caf9': segundo tono de los gradientes de texto (hero, dolor, CTA). */
  textoClaro: string
  /** '#0d2060': tercer blob de aurora del hero. */
  aurora3: string
  /** '#0a1020': arranque del degradado de la sección Dolor. */
  dolorInicio: string
  /** '#091830': cierre del degradado de la tarjeta Preparatoria. */
  prepaFin: string
  /** '#0a1f4a': cierre del degradado de la columna "Con". */
  conFin: string
  /** '#0d3080': cierre del degradado del CTA final. */
  ctaFin: string
  /** '#050a14': fondo del footer. */
  footer: string
  /**
   * '#FFFFFF': el color que va ENCIMA del acento (el avatar del testimonio).
   * Es lo único que necesita contrastar con `royal`, no con el papel.
   */
  sobreAcento: string
  /**
   * '#0D1B3E88': el tono de los textos SECUNDARIOS sobre el papel. Con la
   * paleta original es el literal de siempre; con una personalizada se garantiza
   * que cumpla AA, porque `navy` a media opacidad sobre blanco se queda corto en
   * cuanto el color de marca no es un azul muy oscuro.
   */
  navySuave: string
  /**
   * '#1565C0': cierre del degradado del numerito 01..04 del proceso. Arranca en
   * `navy` (oscuro), así que este extremo tiene que admitir el MISMO color de
   * texto: con una paleta personalizada se oscurece el acento hasta lograrlo.
   */
  stepFin: string
  /** '#ffffff': el texto de ese numerito, legible en los dos extremos. */
  sobreStep: string
  /**
   * El fondo oscuro MÁS CLARO que llega a pintar la landing (las secciones
   * apilan capas translúcidas sobre `navy`). Es contra el que hay que medir un
   * texto secundario, no contra el hero.
   */
  refOscuro: string
  /** `false` en la paleta de fábrica: ahí no se ajusta nada y el pixel no cambia. */
  personalizada: boolean
  /**
   * '#1565C0': el acento AJUSTADO para servir de color de texto sobre el papel.
   * Idéntico a `royal` cuando el acento ya cumple AA sobre blanco, que es el
   * caso del azul de fábrica.
   */
  royalTexto: string
}

/**
 * La paleta de SIEMPRE, literal por literal (los derivados en minúsculas tal
 * cual estaban en el JSX). Es la que ve todo cliente cuya site_config no toque
 * los colores — incluido el que elija la paleta "Original" del editor, que
 * escribe los mismos valores que trae CONFIG.
 */
export const PALETA_ORIGINAL: Paleta = {
  hero: '#080F1E', navy: '#0D1B3E', royal: '#1565C0',
  bright: '#1E88E5', azure: '#42A5F5', ice: '#E3F2FD', white: '#FFFFFF',
  textoClaro: '#90caf9',
  aurora3: '#0d2060',
  dolorInicio: '#0a1020',
  prepaFin: '#091830',
  conFin: '#0a1f4a',
  ctaFin: '#0d3080',
  footer: '#050a14',
  // El azul de fábrica ya cumple AA sobre blanco (4.6), así que `royalTexto`
  // ES `royal`: con la paleta original no cambia ni un byte de lo pintado.
  sobreAcento: '#FFFFFF',
  royalTexto: '#1565C0',
  navySuave: '#0D1B3E88',
  stepFin: '#1565C0',
  sobreStep: '#ffffff',
  refOscuro: '#0D1B3E',
  personalizada: false,
}

/**
 * Paleta que pinta la landing para una config dada.
 *
 * Se compara contra CONFIG (el config.ts del cliente), NO contra un azul fijo:
 * hoy la landing ignora CONFIG.colores (viste su propio azul) y eso no cambia.
 * Solo cuando el admin cambió algún color desde el editor la landing se viste
 * con la marca; si no tocó nada — o eligió la paleta "Original", que escribe
 * los mismos valores — conserva sus hex de siempre.
 *
 * MAPEO con paleta personalizada:
 *   hero   ← colores.primario          navy   ← colores.secundario
 *   royal  ← colores.acento            bright ← colores.acentoHover
 *   azure  ← aclarar(acento, 0.35)     ice    ← colores.acentoClaro
 *   white  ← colores.textoSobreAcento
 * Derivados (el factor conserva la relación que hoy guardan con el azul):
 *   textoClaro  ← aclarar(azure, 0.45)    #90caf9 ≈ azure un 45 % más claro
 *   dolorInicio ← oscurecer(navy, 0.48)   #0a1020 ≈ navy a la mitad
 *   prepaFin    ← oscurecer(navy, 0.22)   #091830 ≈ navy un quinto más oscuro
 *   footer      ← oscurecer(navy, 0.68)   #050a14 ≈ navy a un tercio
 *   aurora3     ← oscurecer(royal, 0.50)  #0d2060 ≈ royal a la mitad
 *   conFin      ← oscurecer(royal, 0.61)  #0a1f4a ≈ royal a dos quintos
 *   ctaFin      ← oscurecer(royal, 0.33)  #0d3080 ≈ royal a dos tercios
 * Los tres oscuros que hoy rondan el navy (dolor, prepa, footer) se derivan
 * de navy y los tres más azules (aurora, con, cta) de royal: cada uno queda
 * del lado del tono al que hoy se parece.
 * Los rgba sueltos (rgba(21,101,192,…), (66,165,245,…), (227,242,253,…),
 * (8,15,30,…)) van por `conAlpha` sobre royal / azure / ice / hero.
 * Los alfas por concatenación (`${C.royal}55`) siguen valiendo: aclarar /
 * oscurecer devuelven siempre #RRGGBB.
 *
 * El interruptor —`esPaletaPersonalizada`— vive en src/lib/landing-textos.ts:
 * es lógica pura, compara los hex NORMALIZADOS (trim + mayúsculas, para que
 * `#3b82f6` y `#3B82F6` cuenten como el mismo color) y así se prueba sin montar
 * el componente. Es el mismo interruptor que decide si se inyectan las
 * variables CSS de `variablesLanding`: uno solo, para que no puedan discrepar.
 */
export function paletaLanding(colores: LandingConfig['colores']): Paleta {
  if (!esPaletaPersonalizada(colores)) return PALETA_ORIGINAL
  const navy = colores.secundario
  const royal = colores.acento
  const azure = aclarar(royal, 0.35)

  // 🛑 `white` ES EL PAPEL DE LA LANDING, no "el texto sobre el acento".
  //
  // Aquí vivía el peor fallo de la personalización: `white` salía de
  // `colores.textoSobreAcento`. Ese token contrasta con el ACENTO, que es otra
  // pregunta. GRATIA (#198) lo tiene en verde petróleo —correcto: sobre su oro
  // el blanco da 2.67 y el verde 5.34— y la landing lo tomó como su blanco.
  // Resultado: `background: C.white` pintó la página entera de verde petróleo y
  // los títulos del hero, que van en `C.white` sobre ese mismo verde, quedaron
  // en **ratio 1.00**: texto invisible, no "poco contraste". Diez nodos, el
  // nombre de la escuela y el h1 entre ellos.
  //
  // El papel es `superficie` (blanco en la plantilla y en todo cliente en light
  // mode). Y como también sirve de texto sobre los fondos oscuros de la
  // landing, se garantiza que sea legible sobre el más claro de los dos.
  const white = colorLegibleSobre(colores.superficie, navy, 4.5)

  // 🛑 `bright` ES "EL ACENTO UN PASO MÁS CLARO", no el color de hover.
  //
  // Salía de `colores.acentoHover`, y por convención de la plantilla ese token
  // es el acento un paso más OSCURO (para el hover de un botón). Eso INVIERTE
  // la relación que tiene con `royal` en el diseño original (#1E88E5 es más
  // claro que #1565C0) y rompe los degradados `royal → bright`: en GRATIA el
  // botón "Crear cuenta" iba de oro a oro oscuro, y ningún color de texto sirve
  // para los dos extremos a la vez — el blanco falla en el oro y el verde falla
  // en el oro oscuro. Derivándolo se conserva la relación y el degradado entero
  // admite el mismo texto.
  const bright = aclarar(royal, 0.12)

  // El acento como TEXTO sobre el papel. Un acento de marca no siempre sirve:
  // el oro de GRATIA da 2.67 sobre blanco. Se oscurece lo justo y el token de
  // marca (`royal`) queda intacto para rellenos, bordes y barras.
  const royalTexto = colorLegibleSobre(royal, white, 5.2)

  // `ice` es texto claro sobre los fondos OSCUROS (hero, navy, footer), casi
  // siempre con alpha. `acentoClaro` puede ser cualquier cosa —el oro suave de
  // GRATIA es casi blanco y funciona, pero un cliente con acentoClaro medio
  // dejaría ilegible medio hero—, así que se exige que cumpla sobre `hero`.
  // `ice` nunca se pinta sólido: va con alpha entre .45 y .75 sobre los fondos
  // oscuros. Exigirle contraste en sólido no basta —el tono aguanta, la mezcla
  // no—, así que se comprueba ya mezclado al alpha MÁS BAJO que usa la landing.
  // El fondo de referencia NO es `hero`: la landing apila capas translúcidas
  // sobre `navy` y las secciones intermedias acaban bastante más claras que el
  // hero (medido: hasta un 20 % por encima). Se calibra contra ese peor caso o
  // el texto cumple en la portada y falla tres secciones más abajo.
  const candidatosOscuros = [aclarar(navy, 0.22), oscurecer(royal, 0.33), oscurecer(royal, 0.61)]
  const fondoOscuroMasClaro = candidatosOscuros.reduce((a, b) =>
    luminanciaRelativa(a) >= luminanciaRelativa(b) ? a : b)
  const ice = colorLegibleConAlpha(colores.acentoClaro, fondoOscuroMasClaro, 0.45, 4.5)

  return {
    hero: colores.primario, navy, royal,
    bright, azure, ice, white,
    textoClaro: aclarar(azure, 0.45),
    aurora3: oscurecer(royal, 0.5),
    dolorInicio: oscurecer(navy, 0.48),
    prepaFin: oscurecer(navy, 0.22),
    conFin: oscurecer(royal, 0.61),
    ctaFin: oscurecer(royal, 0.33),
    footer: oscurecer(navy, 0.68),
    sobreAcento: colores.textoSobreAcento,
    royalTexto,
    navySuave: colorLegibleSobre(navy, white, 4.5),
    // El degradado del numerito arranca en `navy`, que es oscuro. Se oscurece
    // el acento hasta que el mismo blanco que ya funciona sobre `navy` funcione
    // también en el cierre: un degradado que va de oscuro a claro no admite
    // ningún color de texto en todo su recorrido.
    stepFin: colorLegibleSobre(royal, white, 4.5) === royal
      ? royal
      : oscurecerHasta(royal, white, 4.5),
    sobreStep: white,
    refOscuro: fondoOscuroMasClaro,
    personalizada: true,
  }
}
