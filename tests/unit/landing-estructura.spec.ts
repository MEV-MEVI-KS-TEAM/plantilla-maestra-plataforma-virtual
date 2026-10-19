import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  agruparCatalogo, extrasLanding, iconoServicio, indicadoresPortada, menuPortada, mensajeWhatsAppGeneral,
  mensajeWhatsAppServicio, seccionesOmitidas, tarjetasHeroPortada,
} from '@/components/landing/animada/estructura'
import {
  ORDEN_SECCIONES, ORDEN_SECCIONES_SOLO_CURSOS, SECCIONES_OPCIONALES, paletaDesde, secuenciaSecciones,
  secuenciaValida, tokensDe, type SeccionOpcional,
} from '@/components/landing/animada/tokens'
import { FONDOS_OSCUROS_PANEL, variablesPanel } from '@/lib/colores-panel'
import { ratioContraste } from '@/lib/contraste'

/**
 * La portada animada en modo `solo_cursos` (encontrado en CAAIV #288).
 *
 * 🛑 El grupo «tradicional» compara contra los LITERALES que estaban escritos en
 *    el JSX de LandingAnimada antes del arreglo: si alguno falla, una escuela de
 *    Secundaria/Preparatoria cambió de portada al redesplegar.
 */

const RAIZ = join(__dirname, '..', '..')
const LANDING = readFileSync(join(RAIZ, 'src/components/landing/animada/LandingAnimada.tsx'), 'utf8')
const sec = (presentes: Partial<Record<SeccionOpcional, boolean>>, o?: Parameters<typeof secuenciaSecciones>[1]) =>
  secuenciaSecciones(presentes, o).map(s => `${s.id}:${s.variante}`)
const todas = (sin: SeccionOpcional[] = []) =>
  Object.fromEntries(SECCIONES_OPCIONALES.map(id => [id, !sin.includes(id)])) as Record<SeccionOpcional, boolean>

test.describe('1. tradicional: todo igual que antes', () => {
  test('1a. menú', () => {
    expect(menuPortada({ soloCursos: false, hayCatalogo: true, hayServicios: true, hayLicenciaturas: false, validez: false, hayFaq: true }))
      .toEqual([
        { href: '#niveles', etiqueta: 'Niveles' },
        { href: '#planes', etiqueta: 'Planes' },
        { href: '#preguntas', etiqueta: 'Preguntas' },
        { href: '#contacto', etiqueta: 'Contacto' },
      ])
    expect(menuPortada({ soloCursos: false, hayCatalogo: false, hayServicios: false, hayLicenciaturas: true, validez: true, hayFaq: false }))
      .toEqual([
        { href: '#niveles', etiqueta: 'Niveles' },
        { href: '#planes', etiqueta: 'Planes' },
        { href: '#licenciaturas', etiqueta: 'Licenciaturas' },
        { href: '#validez', etiqueta: 'Validez oficial' },
        { href: '#contacto', etiqueta: 'Contacto' },
      ])
  })

  test('1b. franja', () => {
    const base = { soloCursos: false, nivelesTexto: 'Secundaria y Preparatoria', programasTexto: 'Secundaria y Preparatoria', propios: ['no se usa'], cursos: 9 }
    expect(indicadoresPortada({ ...base, validez: true, mismoTotal: true, hayLicenciaturas: false })).toEqual([
      { icono: 'Laptop', dato: '100% en línea' },
      { icono: 'ShieldCheck', dato: 'Validez oficial' },
      { icono: 'BadgeCheck', dato: 'Mismo precio total en ambos planes' },
      { icono: 'GraduationCap', dato: 'Secundaria y Preparatoria' },
    ])
    expect(indicadoresPortada({ ...base, programasTexto: 'Secundaria, Preparatoria y Licenciaturas', validez: false, mismoTotal: true, hayLicenciaturas: true })).toEqual([
      { icono: 'Laptop', dato: '100% en línea' },
      { icono: 'BadgeCheck', dato: 'Mismo precio total en Secundaria y Preparatoria' },
      { icono: 'GraduationCap', dato: 'Secundaria, Preparatoria y Licenciaturas' },
    ])
  })

  test('1c. tarjetas del hero', () => {
    const niveles = [{ titulo: 'Secundaria', detalle: '3 o 6 meses · desde $1,000/mes' }, { titulo: 'Preparatoria', detalle: '3 o 6 meses' }]
    const otras = { propias: [{ titulo: 'x', detalle: 'y' }], catalogo: [{ titulo: 'c', detalle: 'd' }] }
    expect(tarjetasHeroPortada({ soloCursos: false, niveles, licenciatura: null, ...otras })).toEqual([
      { icono: 'BookOpen', titulo: 'Secundaria', detalle: '3 o 6 meses · desde $1,000/mes' },
      { icono: 'BookOpen', titulo: 'Preparatoria', detalle: '3 o 6 meses' },
      { icono: 'Laptop', titulo: '100% en línea', detalle: 'A tu ritmo, las 24 horas' },
    ])
    expect(tarjetasHeroPortada({ soloCursos: false, niveles, licenciatura: { titulo: 'Licenciaturas', detalle: 'Dos carreras · 6 o 12 meses' }, ...otras })[2])
      .toEqual({ icono: 'GraduationCap', titulo: 'Licenciaturas', detalle: 'Dos carreras · 6 o 12 meses' })
  })

  test('1d. WhatsApp general', () => {
    expect(mensajeWhatsAppGeneral({ soloCursos: false, nombre: 'ESCUELA', niveles: 'la Secundaria y la Preparatoria' }))
      .toBe('Hola, quiero información sobre la Secundaria y la Preparatoria en línea de ESCUELA.')
  })

  test('1e. sin omitir, la secuencia es la de antes (salida de la versión previa a #288)', () => {
    expect(sec(todas(['servicios']))).toEqual([
      'hero:claro', 'franja:oscuro', 'dolor:suave', 'niveles:claro', 'planes:suave', 'licenciaturas:claro', 'validez:oscuro',
      'transformacion:claro', 'proceso:suave', 'testimonios:claro', 'beneficios:oscuro', 'catalogo:claro', 'faq:suave',
      'cta:oscuro', 'contacto:claro', 'pie:oscuro',
    ])
    expect(sec({})).toEqual(['hero:claro', 'franja:oscuro', 'niveles:claro', 'planes:suave', 'cta:oscuro', 'contacto:claro', 'pie:oscuro'])
    expect(seccionesOmitidas(false)).toEqual([])
  })

  test('1f. sin llaves nuevas, extrasLanding devuelve todo vacío', () => {
    for (const entrada of [undefined, null, {}, { servicios_items: 'x', catalogoGrupos: null, indicadores: 3 }]) {
      const x = extrasLanding(entrada)
      expect(x.servicios_items).toEqual([])
      expect(x.catalogoGrupos).toEqual([])
      expect(x.tarjetasHero).toEqual([])
      expect(x.indicadores).toEqual([])
      expect([x.whatsapp2, x.whatsapp2Display, x.horario, x.servicios_titulo, x.catalogoGrupoResto]).toEqual(['', '', '', '', ''])
    }
  })
})

test.describe('2. solo_cursos: sin programa académico', () => {
  test('2a. el menú no enlaza Niveles ni Planes', () => {
    const menu = menuPortada({ soloCursos: true, hayCatalogo: true, hayServicios: true, hayLicenciaturas: true, validez: false, hayFaq: true })
    expect(menu.map(e => e.href)).toEqual(['#diplomados', '#servicios', '#preguntas', '#contacto'])
    expect(menu.map(e => e.etiqueta)).toEqual(['Cursos', 'Servicios', 'Preguntas', 'Contacto'])
  })

  test('2b. la secuencia no trae niveles ni planes, el catálogo sube y no hay fondos iguales pegados', () => {
    const o = { omitir: seccionesOmitidas(true), orden: ORDEN_SECCIONES_SOLO_CURSOS }
    const s = sec(todas(), o)
    expect(s.some(x => x.startsWith('niveles:') || x.startsWith('planes:'))).toBe(false)
    expect(s.slice(0, 4)).toEqual(['hero:claro', 'franja:oscuro', 'catalogo:claro', 'servicios:suave'])
    const n = SECCIONES_OPCIONALES.length
    for (let m = 0; m < (1 << n); m++) {
      const presentes = Object.fromEntries(SECCIONES_OPCIONALES.map((id, i) => [id, Boolean(m & (1 << i))])) as Record<SeccionOpcional, boolean>
      expect(secuenciaValida(secuenciaSecciones(presentes, o)), `máscara ${m}`).toBe(true)
    }
  })

  test('2c. las dos listas de orden tienen las mismas secciones', () => {
    expect([...ORDEN_SECCIONES_SOLO_CURSOS].sort()).toEqual([...ORDEN_SECCIONES].sort())
  })

  test('2d. la FAQ de planes, licenciaturas, Niveles y Planes van detrás de esSoloCursos()', () => {
    expect(LANDING).toContain('esSoloCursos()')
    expect(LANDING).toContain('!soloCursos && planes.length >= 2')
    expect(LANDING).toContain('const hayLicenciaturas = !soloCursos &&')
    expect(LANDING).toMatch(/\{!soloCursos && \(\s*<section id="niveles"/)
    expect(LANDING).toMatch(/\{!soloCursos && \(\s*<section id="planes"/)
  })

  test('2e. WhatsApp de cursos y de servicios', () => {
    expect(mensajeWhatsAppGeneral({ soloCursos: true, nombre: 'ACME', niveles: 'la Secundaria' }))
      .toBe('Hola, quiero información sobre los cursos de ACME.')
    expect(mensajeWhatsAppServicio('Escuela para padres', 'ACME')).toBe('Hola, quiero informes sobre Escuela para padres de ACME.')
  })

  test('2f. franja y tarjetas automáticas', () => {
    const base = { soloCursos: true, validez: false, mismoTotal: true, hayLicenciaturas: false, nivelesTexto: 'Secundaria', programasTexto: 'Secundaria', propios: [] }
    expect(indicadoresPortada({ ...base, cursos: 6 }).map(i => i.dato)).toEqual(['100 % en línea', '6 cursos', 'A tu ritmo, las 24 horas'])
    expect(indicadoresPortada({ ...base, cursos: 0 }).map(i => i.dato)).toEqual(['100 % en línea', 'A tu ritmo, las 24 horas'])
    const cat = [1, 2, 3, 4].map(i => ({ titulo: `C${i}`, detalle: `$${i}` }))
    expect(tarjetasHeroPortada({ soloCursos: true, niveles: [{ titulo: 'Secundaria', detalle: '' }], licenciatura: null, propias: [], catalogo: cat }).map(t => t.titulo))
      .toEqual(['C1', 'C2', 'C3'])
    expect(tarjetasHeroPortada({ soloCursos: true, niveles: [], licenciatura: null, propias: [], catalogo: [] }).map(t => t.titulo))
      .toEqual(['100% en línea'])
  })
})

test.describe('3. solo_cursos con llaves propias: mandan', () => {
  test('3a. tarjetasHero e indicadores', () => {
    const propias = [{ titulo: 'Universidad', detalle: 'EXANI-II' }, { titulo: 'Prepa', detalle: 'EXANI-I' }]
    expect(tarjetasHeroPortada({ soloCursos: true, niveles: [], licenciatura: null, propias, catalogo: [{ titulo: 'x', detalle: 'y' }] }).map(t => t.titulo))
      .toEqual(['Universidad', 'Prepa'])
    expect(indicadoresPortada({ soloCursos: true, validez: false, mismoTotal: false, hayLicenciaturas: false, nivelesTexto: '', programasTexto: '', propios: ['A', 'B'], cursos: 6 }).map(i => i.dato))
      .toEqual(['A', 'B'])
  })

  test('3b. servicios: ícono de lista cerrada, sin emojis', () => {
    expect(iconoServicio('Users')).toBe('Users')
    expect(iconoServicio('⏰')).toBe('Sparkles')
    expect(iconoServicio(undefined)).toBe('Sparkles')
    const x = extrasLanding({ servicios_items: [{ icono: 'Nope', titulo: ' Asesorías ', desc: 'd', puntos: ['a', '', 3] }, { titulo: '' }] })
    expect(x.servicios_items).toEqual([{ icono: 'Sparkles', titulo: 'Asesorías', desc: 'd', puntos: ['a'] }])
  })

  test('3c. catálogo agrupado: orden del grupo, sin grupos vacíos, el resto al final', () => {
    const cat = ['a', 'b', 'c', 'd'].map(id => ({ id }))
    const g = agruparCatalogo(cat, [
      { titulo: 'G1', subtitulo: 's', ids: ['c', 'a'] },
      { titulo: 'Vacío', subtitulo: '', ids: ['zz'] },
      { titulo: 'G2', subtitulo: '', ids: ['a', 'b'] },
    ], 'Lo demás')
    expect(g.map(x => [x.titulo, x.cursos.map(c => c.id)])).toEqual([['G1', ['c', 'a']], ['G2', ['b']], ['Lo demás', ['d']]])
    expect(agruparCatalogo(cat, [], 'x')).toEqual([{ titulo: '', subtitulo: '', cursos: cat }])
    expect(agruparCatalogo([], [], 'x')).toEqual([])
  })
})

test.describe('4. letras de marca opcionales (paletaDesde)', () => {
  const CAAIV = { primario: '#002458', secundario: '#002458', acento: '#FCCC60', texto: '#002458', textoSecundario: '#476187', fondo: '#F5F6F8', borde: '#E0E5EB' }

  test('4a. sin las llaves, la paleta es la de antes (salida de la versión previa a #288)', () => {
    const p = paletaDesde(CAAIV)
    expect(p).toEqual({
      marca: '#002458', marcaProfunda: '#002458', accion: '#FCCC60', accionTexto: '#0A0A0A', accionHover: '#D9AF53',
      acentoTexto: '#7E6630', realceOscuro: '#9EACC0', suaveOscuro: '#C7CFDA', tinta: '#002458', grisTexto: '#476187',
      superficie: '#F5F6F8', blanco: '#FFFFFF', bordeClaro: '#E0E5EB', bordeOscuro: '#38547D', marcaYAccionIguales: false,
    })
    expect(tokensDe('claro', p).decorativo).toBe('#7E6630')
    expect(tokensDe('suave', p).decorativo).toBe('#002458')
  })

  test('4b. con las llaves de CAAIV mandan', () => {
    const p = paletaDesde({ ...CAAIV, letraSobreAccion: '#002458', acentoLetra: '#0058BE', decorativoClaro: '#00843C' })
    expect(p.accion).toBe('#FCCC60')
    expect(p.accionTexto).toBe('#002458')
    expect(p.acentoTexto).toBe('#0058BE')
    expect(tokensDe('claro', p).decorativo).toBe('#00843C')
    expect(tokensDe('suave', p).decorativo).toBe('#00843C')
  })

  test('4c. 🛑 la variante oscura no lee ninguna', () => {
    const sin = tokensDe('oscuro', paletaDesde(CAAIV))
    const con = tokensDe('oscuro', paletaDesde({ ...CAAIV, letraSobreAccion: '#002458', acentoLetra: '#0058BE', decorativoClaro: '#00843C' }))
    expect(con).toEqual(sin)
    expect(Object.values(con)).not.toContain('#0058BE')
    expect(Object.values(con)).not.toContain('#00843C')
  })

  test('4d. una letra bajo su piso se ignora: nunca se publica', () => {
    const p = paletaDesde({ ...CAAIV, letraSobreAccion: '#FFFFFF', acentoLetra: '#FCCC60', decorativoClaro: '#F5F6F8' })
    expect(p).toEqual(paletaDesde(CAAIV))
  })
})

test.describe('5. acento del panel (coloresPanel)', () => {
  test('5a. sin la llave, nada', () => {
    expect(variablesPanel(undefined, '#FFFFFF')).toEqual({})
    expect(variablesPanel({ acento: 'navy' }, '#FFFFFF')).toEqual({})
  })
  test('5b. con la llave, el acento y sus derivados', () => {
    const v = variablesPanel({ acento: '#002458', acentoHover: '#1F3E6C', textoSobreAcento: '#FFFFFF', acentoClaro: '#EBEDF2' }, '#FFFFFF')
    expect(v['--color-acento']).toBe('#002458')
    expect(v['--color-acento-hover']).toBe('#1F3E6C')
    expect(v['--color-texto-sobre-acento']).toBe('#FFFFFF')
    expect(v['--color-acento-claro']).toBe('#EBEDF2')
    expect(v['--color-fondo-alt']).toBe('#EBEDF2')
    expect(v['--color-acento-texto']).toBe('#002458')
  })
  test('5c. dentro de los fondos oscuros del panel la letra de acento se lee (≥ 4.5 en todos)', () => {
    const v = variablesPanel({ acento: '#002458' }, '#FFFFFF')
    for (const f of FONDOS_OSCUROS_PANEL) {
      expect(ratioContraste(v['--color-acento-en-oscuro'], f), f).toBeGreaterThanOrEqual(4.5)
      // botón: fondo = realce, letra = el acento
      expect(ratioContraste(v['--color-texto-sobre-acento-en-oscuro'], v['--color-acento-en-oscuro']), f).toBeGreaterThanOrEqual(4.5)
    }
  })
  test('5d. globals.css cubre cada fondo oscuro, en sus dos formas (hex y rgb)', () => {
    const css = readFileSync(join(RAIZ, 'src/app/globals.css'), 'utf8')
    for (const h of FONDOS_OSCUROS_PANEL) {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
      expect(css, h).toContain(`.panel-acento-propio [style*="${h}" i]`)
      expect(css, h).toContain(`.panel-acento-propio [style*="rgb(${r}, ${g}, ${b})"]`)
    }
  })
})
