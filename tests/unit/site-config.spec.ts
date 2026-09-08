import { test, expect } from '@playwright/test'
import { CONFIG } from '@/lib/config'
import {
  CLAVES_EDITABLES,
  CLAVES_PUBLICAS,
  SITE_CONFIG_TAG,
  esClaveEditable,
  mergeSiteConfig,
  derivarAliasPrecios,
  toPublicSiteConfig,
  normalizarArreglo,
  congelarProfundo,
  type SiteConfig,
} from '@/lib/site-config-core'

/**
 * F1 — "Personalizar mi página": merge de config.ts con los overrides de la BD.
 *
 * El invariante que protegen estas pruebas: con la tabla `site_config` VACÍA
 * (el estado de los ~144 clientes el día que se despliegue esto) el resultado
 * del merge es deep-equal a CONFIG. Ni una clave distinta. Todo lo demás —
 * lista blanca, arreglos completos, modalidades por id, alias de precios — se
 * prueba con overrides de laboratorio sobre el CONFIG real de la plantilla.
 *
 * ⚠️ Se importa de '@/lib/site-config-core', NUNCA de '@/lib/site-config':
 * aquél lleva `import 'server-only'`, que lanza fuera de un Server Component.
 */

/** CONFIG como JSON plano: sin `readonly` de tipo y sin referencias compartidas. */
const esperado = () => JSON.parse(JSON.stringify(CONFIG)) as SiteConfig

test('1. overrides {} → deep-equal a CONFIG y sin referencias compartidas', () => {
  const r = mergeSiteConfig(CONFIG, {})
  expect(r).toEqual(esperado())

  // No es la misma referencia, ni en la raíz ni en lo anidado.
  expect(r).not.toBe(CONFIG)
  expect(r.colores).not.toBe(CONFIG.colores)
  expect(r.landing).not.toBe(CONFIG.landing)
  expect(r.modalidades).not.toBe(CONFIG.modalidades)
  expect(r.modalidades[0]).not.toBe(CONFIG.modalidades[0])

  // Mutar el resultado no toca CONFIG.
  const antes = esperado()
  r.nombre = 'MUTADO'
  r.colores.acento = '#000000'
  r.landing.hero_badges.push('mutado')
  r.modalidades[0].mensualidad = 1
  expect(JSON.parse(JSON.stringify(CONFIG))).toEqual(antes)
})

test('2. override parcial { nombre } solo cambia esa clave', () => {
  const r = mergeSiteConfig(CONFIG, { nombre: 'X' })
  expect(r.nombre).toBe('X')
  const e = esperado()
  e.nombre = 'X'
  expect(r).toEqual(e)
})

test('3. un arreglo en override reemplaza el arreglo completo', () => {
  const r = mergeSiteConfig(CONFIG, { landing: { hero_badges: ['a'] } })
  expect(r.landing.hero_badges).toEqual(['a'])
  const e = esperado()
  e.landing.hero_badges = ['a']
  expect(r).toEqual(e)
})

test('4. modalidades[3_meses].mensualidad deriva los alias de 3 meses y deja los de 6 intactos', () => {
  const r = mergeSiteConfig(CONFIG, { modalidades: { '3_meses': { mensualidad: 2500 } } })
  const base = esperado()

  // La modalidad tocada.
  const m3 = r.modalidades.find((m) => m.id === '3_meses')!
  expect(m3.mensualidad).toBe(2500)
  // Y solo `mensualidad`: el resto del producto no se toca desde la BD.
  const m3base = base.modalidades.find((m) => m.id === '3_meses')!
  expect(m3.id).toBe(m3base.id)
  expect(m3.meses).toBe(m3base.meses)
  expect(m3.materiasPorMes).toBe(m3base.materiasPorMes)
  expect(m3.label).toBe(m3base.label)
  expect(m3.activa).toBe(m3base.activa)

  // Alias de 3 meses sincronizados.
  expect(r.precios.plan3mMensualidad).toBe(2500)
  expect(r.precios.secundaria_3meses_normal).toBe(2500)
  expect(r.precios.secundaria_3meses_sindicalizado).toBe(2500)
  expect(r.precios.preparatoria_3meses_normal).toBe(2500)
  expect(r.precios.preparatoria_3meses_sindicalizado).toBe(2500)

  // 6 meses intacto, en la modalidad y en sus alias.
  expect(r.modalidades.find((m) => m.id === '6_meses')).toEqual(
    base.modalidades.find((m) => m.id === '6_meses'),
  )
  expect(r.precios.plan6mMensualidad).toBe(base.precios.plan6mMensualidad)
  expect(r.precios.secundaria_6meses_normal).toBe(base.precios.secundaria_6meses_normal)
  expect(r.precios.secundaria_6meses_sindicalizado).toBe(base.precios.secundaria_6meses_sindicalizado)
  expect(r.precios.preparatoria_6meses_normal).toBe(base.precios.preparatoria_6meses_normal)
  expect(r.precios.preparatoria_6meses_sindicalizado).toBe(base.precios.preparatoria_6meses_sindicalizado)

  // Sigue siendo un arreglo con el mismo orden y longitud.
  expect(Array.isArray(r.modalidades)).toBe(true)
  expect(r.modalidades.length).toBe(base.modalidades.length)
  expect(r.modalidades.map((m) => m.id)).toEqual(base.modalidades.map((m) => m.id))
})

test('5. modalidades[6_meses].activa=false solo apaga esa modalidad, sin derivar precios', () => {
  const r = mergeSiteConfig(CONFIG, { modalidades: { '6_meses': { activa: false } } })
  const e = esperado()
  const m6 = e.modalidades.find((m) => m.id === '6_meses')!
  m6.activa = false
  // Todo lo demás — incluida la mensualidad y TODOS los precios — igual.
  expect(r).toEqual(e)
})

test('6. un id de modalidad desconocido se ignora', () => {
  const r = mergeSiteConfig(CONFIG, { modalidades: { inventada: { mensualidad: 1 } } })
  expect(r).toEqual(esperado())
  // Y no se puede colar una modalidad nueva por ningún lado.
  expect(r.modalidades.length).toBe(CONFIG.modalidades.length)
})

test('7. precios.certificacionSecundaria sincroniza sus dos alias y no toca preparatoria', () => {
  const r = mergeSiteConfig(CONFIG, { precios: { certificacionSecundaria: 5555 } })
  expect(r.precios.certificacionSecundaria).toBe(5555)
  expect(r.precios.certificacion_secundaria).toBe(5555)
  expect(r.landing.certificacion_secundaria).toBe(5555)

  const base = esperado()
  expect(r.precios.certificacionPreparatoria).toBe(base.precios.certificacionPreparatoria)
  expect(r.precios.certificacion_preparatoria).toBe(base.precios.certificacion_preparatoria)
  expect(r.landing.certificacion_preparatoria).toBe(base.landing.certificacion_preparatoria)

  // Deep-equal al esperado con exactamente esas tres claves cambiadas.
  base.precios.certificacionSecundaria = 5555
  base.precios.certificacion_secundaria = 5555
  base.landing.certificacion_secundaria = 5555
  expect(r).toEqual(base)
})

test('8. claves fuera de la lista blanca se ignoran en silencio', () => {
  const r = mergeSiteConfig(CONFIG, {
    modo: 'solo_cursos',
    prefijoMatricula: 'ZZZ',
    licenciaturas: { activas: true },
    landing: { mostrarCatalogoCursos: false },
    // Y un intento de meter una modalidad como arreglo, que es la forma prohibida.
    modalidades: [{ id: 'nueva', meses: 9, mensualidad: 1 }],
  })
  expect(r).toEqual(esperado())
})

test('9. overrides que no son objeto plano → defaults, sin lanzar', () => {
  for (const raro of [null, undefined, 'texto', 42, [], true, () => {}]) {
    expect(() => mergeSiteConfig(CONFIG, raro)).not.toThrow()
    expect(mergeSiteConfig(CONFIG, raro)).toEqual(esperado())
  }
})

test('10. toPublicSiteConfig expone exactamente las 17 claves públicas', () => {
  const pub = toPublicSiteConfig(mergeSiteConfig(CONFIG, {}))
  const claves = Object.keys(pub).sort()

  const esperadas = [
    'nombre', 'nombreCompleto', 'tagline', 'cct', 'logo', 'logoOscuro', 'colores',
    'whatsapp', 'whatsappUrl', 'whatsappDisplay', 'email', 'contactoEmail',
    'contactoTelefono', 'redes', 'landing', 'precios', 'modalidades',
  ]
  expect(esperadas.length).toBe(17)
  expect(claves).toEqual([...esperadas].sort())
  expect([...CLAVES_PUBLICAS].sort()).toEqual([...esperadas].sort())

  // Nada sensible ni no editable sale al navegador por aquí.
  for (const prohibida of ['pagos', 'licenciaturas', 'prefijoMatricula', 'dominio', 'urlBase', 'modo', 'niveles', 'cursosIngreso', 'diploma', 'documentosRequeridos']) {
    expect(pub).not.toHaveProperty(prohibida)
  }
})

test('11. CLAVES_EDITABLES no contiene ninguna clave prohibida en F1', () => {
  const prohibidas = [
    'modo', 'niveles', 'prefijoMatricula', 'dominio', 'urlBase',
    'licenciaturas', 'pagos', 'cursosIngreso', 'diploma', 'documentosRequeridos',
    'landing.mostrarCatalogoCursos', 'landing.convenios',
  ]
  for (const p of prohibidas) {
    expect(CLAVES_EDITABLES).not.toContain(p)
    // Ni como raíz de una ruta anidada ('pagos.activo', 'diploma.etiqueta'…).
    expect(CLAVES_EDITABLES.some((c) => c === p || c.startsWith(`${p}.`))).toBe(false)
    expect(esClaveEditable(p)).toBe(false)
  }
  expect(esClaveEditable('nombre')).toBe(true)
  expect(esClaveEditable('colores.acento')).toBe(true)
  expect(esClaveEditable('modalidades')).toBe(true)
  expect(SITE_CONFIG_TAG).toBe('site-config')
})

// ─── Complementarias (no pedidas en el brief, pero clavan decisiones del merge) ──

test('cada ruta de CLAVES_EDITABLES existe en CONFIG (guardia de typos en runtime)', () => {
  // El `satisfies` de site-config-core.ts ya lo comprueba en compilación;
  // esto lo hace visible en la salida de pruebas y cubre un `as const` mal
  // tipado que dejara pasar algo.
  const cfg = esperado() as unknown as Record<string, unknown>
  for (const ruta of CLAVES_EDITABLES) {
    let actual: unknown = cfg
    for (const seg of ruta.split('.')) actual = (actual as Record<string, unknown>)[seg]
    expect(actual, `la ruta '${ruta}' no existe en CONFIG`).not.toBeUndefined()
  }
})

test('un override de tipo distinto al default se ignora', () => {
  const r = mergeSiteConfig(CONFIG, {
    nombre: 42,                       // string esperado
    colores: { acento: ['#fff'] },    // string esperado
    precios: { inscripcion: '599' },  // number esperado
    landing: { hero_badges: 'a' },    // arreglo esperado
    modalidades: { '3_meses': { mensualidad: '2500', activa: 'no' } },
  })
  expect(r).toEqual(esperado())
})

test('precios negativos o no finitos se ignoran (también en modalidades)', () => {
  const r = mergeSiteConfig(CONFIG, {
    precios: { inscripcion: -1, certificacionSecundaria: Number.NaN, certificacionPreparatoria: Number.POSITIVE_INFINITY },
    modalidades: { '3_meses': { mensualidad: -5 } },
  })
  expect(r).toEqual(esperado())
})

test('null en un override = sin override (no borra el default)', () => {
  const r = mergeSiteConfig(CONFIG, { nombre: null, colores: { acento: null }, landing: { hero_badges: null } })
  expect(r).toEqual(esperado())
})

test('los alias legacy divergentes de un cliente se respetan si el canónico NO viene en overrides', () => {
  // Un cliente puede tener en su config.ts un alias distinto del canónico a
  // propósito. Con la BD vacía (o tocando OTRA clave) el alias no se "corrige".
  const base = mergeSiteConfig(CONFIG, {})
  base.precios.certificacion_secundaria = 1234
  base.precios.secundaria_3meses_sindicalizado = 1500
  const r = mergeSiteConfig(base, { nombre: 'Otro' })
  expect(r.precios.certificacion_secundaria).toBe(1234)
  expect(r.precios.secundaria_3meses_sindicalizado).toBe(1500)
  expect(r.nombre).toBe('Otro')
})

test('derivarAliasPrecios elige los alias por `meses`, no por id, y no deriva nada para otros meses', () => {
  const cfg = mergeSiteConfig(CONFIG, {})
  const base = esperado()
  derivarAliasPrecios(cfg, { mensualidades: [{ meses: 9, mensualidad: 777 }] })
  expect(cfg).toEqual(base)

  derivarAliasPrecios(cfg, { mensualidades: [{ meses: 6, mensualidad: 888 }] })
  expect(cfg.precios.plan6mMensualidad).toBe(888)
  expect(cfg.precios.preparatoria_6meses_sindicalizado).toBe(888)
  expect(cfg.precios.plan3mMensualidad).toBe(base.precios.plan3mMensualidad)
})

test('el override no comparte referencias con el resultado', () => {
  // La fila leída puede reutilizarse entre renders (unstable_cache); un
  // componente que mutara el resultado no debe contaminar la siguiente.
  const badges = ['a', 'b']
  const testimonios = [{ name: 'N', age: '30', nivel: 'Prepa', initials: 'N', quote: 'q' }]
  const r = mergeSiteConfig(CONFIG, { landing: { hero_badges: badges, testimonios } })
  expect(r.landing.hero_badges).toEqual(badges)
  expect(r.landing.hero_badges).not.toBe(badges)
  expect(r.landing.testimonios[0]).not.toBe(testimonios[0])
  r.landing.hero_badges.push('c')
  expect(badges).toEqual(['a', 'b'])
})

// ─── Revisión adversarial F2: forma de los elementos, vacíos, alias, público ──

test('un elemento malformado rechaza el arreglo ENTERO (no se filtra)', () => {
  // El caso que tiraría la landing: `testimonios.map(t => t.name)` con un null.
  const r = mergeSiteConfig(CONFIG, {
    landing: {
      testimonios: [
        { name: 'Ok', age: '30', nivel: 'Prepa', initials: 'O', quote: 'bien' },
        null,
      ],
      hero_badges: ['ok', 1],
      respaldo_badges: [{ a: 1 }],
    },
  })
  expect(r).toEqual(esperado())

  // Cada forma inválida de testimonio, por separado.
  const invalidos = [
    ['x'],                                                                  // string
    [42],                                                                   // número
    [[]],                                                                   // arreglo
    [{ name: 1, age: '30', nivel: 'P', initials: 'N', quote: 'q' }],        // campo no string
    [{ name: 'N', age: '30', nivel: 'P', initials: 'N' }],                  // falta quote
    [{ name: 'N', age: null, nivel: 'P', initials: 'N', quote: 'q' }],      // null en campo
  ]
  for (const testimonios of invalidos) {
    expect(mergeSiteConfig(CONFIG, { landing: { testimonios } }), JSON.stringify(testimonios)).toEqual(esperado())
  }
  // Y un arreglo vacío sí se acepta: es "sin testimonios", que es un estado válido.
  const vacio = mergeSiteConfig(CONFIG, { landing: { testimonios: [], hero_badges: [] } })
  expect(vacio.landing.testimonios).toEqual([])
  expect(vacio.landing.hero_badges).toEqual([])
})

test('los testimonios se proyectan a sus 5 campos (las claves extra no viajan al navegador)', () => {
  const r = mergeSiteConfig(CONFIG, {
    landing: {
      testimonios: [
        { name: 'N', age: '30', nivel: 'Prepa', initials: 'N', quote: 'q', foto: 'x.png', admin: true },
      ],
    },
  })
  expect(r.landing.testimonios).toEqual([{ name: 'N', age: '30', nivel: 'Prepa', initials: 'N', quote: 'q' }])
  expect(Object.keys(r.landing.testimonios[0]).sort()).toEqual(['age', 'initials', 'name', 'nivel', 'quote'])
})

test('toda ruta editable que sea arreglo en CONFIG tiene normalizador (fail-closed para las demás)', () => {
  // Si la Fase 3 añade un arreglo a la lista blanca sin normalizador, el merge
  // lo rechazaría siempre y el campo quedaría ineditable en silencio. Esta
  // prueba lo hace ruidoso.
  const cfg = esperado() as unknown as Record<string, unknown>
  const rutasArreglo = CLAVES_EDITABLES.filter((ruta) => {
    if (ruta === 'modalidades') return false
    let actual: unknown = cfg
    for (const seg of ruta.split('.')) actual = (actual as Record<string, unknown>)[seg]
    return Array.isArray(actual)
  })
  expect(rutasArreglo.sort()).toEqual(['landing.hero_badges', 'landing.respaldo_badges', 'landing.testimonios'])
  for (const ruta of rutasArreglo) {
    expect(normalizarArreglo(ruta, []), `'${ruta}' sin normalizador`).toEqual([])
  }
  // Una ruta que NO es arreglo no admite arreglos, aunque el override lo mande.
  expect(normalizarArreglo('nombre', ['x'])).toBeUndefined()
  expect(normalizarArreglo('landing.hero_badges', ['a', 'b'])).toEqual(['a', 'b'])
  expect(normalizarArreglo('landing.hero_badges', ['a', 2])).toBeUndefined()
})

test("'' se rechaza en logo y whatsappUrl, pero se acepta donde vacío significa algo", () => {
  const r = mergeSiteConfig(CONFIG, {
    logo: '',
    whatsappUrl: '   ',
    logoOscuro: '',          // "sin variante oscura": LandingClient cae a `logo` + invert
    cct: '',
    landing: { ciudad: '', cct: '' },
  })
  const base = esperado()
  expect(r.logo).toBe(base.logo)
  expect(r.whatsappUrl).toBe(base.whatsappUrl)
  expect(r.logoOscuro).toBe('')
  expect(r.cct).toBe('')
  expect(r.landing.ciudad).toBe('')
  expect(r.landing.cct).toBe('')
})

test('base con hoja ausente o null acepta un override primitivo pero no un objeto', () => {
  // config.ts de un cliente viejo al que le falta `landing.ciudad`, o que
  // tiene `logoOscuro: null` a propósito.
  const base = mergeSiteConfig(CONFIG, {}) as unknown as Record<string, unknown>
  delete (base.landing as Record<string, unknown>).ciudad
  base.logoOscuro = null
  delete base.redes

  const r = mergeSiteConfig(base as unknown as SiteConfig, {
    landing: { ciudad: 'Mérida' },
    logoOscuro: '/oscuro.png',
    redes: { facebook: 'https://fb.com/x', instagram: { handle: 'no' } },
  })
  expect(r.landing.ciudad).toBe('Mérida')
  expect(r.logoOscuro).toBe('/oscuro.png')
  expect(r.redes.facebook).toBe('https://fb.com/x')
  // Un objeto donde se espera hoja abriría claves fuera de la lista: fuera.
  expect(r.redes).not.toHaveProperty('instagram')
})

test('cct y landing.cct se aplican a la vez y por separado', () => {
  const r = mergeSiteConfig(CONFIG, { cct: '31PBH0001A', landing: { cct: '31PBH0002B' } })
  expect(r.cct).toBe('31PBH0001A')
  expect(r.landing.cct).toBe('31PBH0002B')
  const e = esperado()
  e.cct = '31PBH0001A'
  e.landing.cct = '31PBH0002B'
  expect(r).toEqual(e)

  // Tocar uno no arrastra al otro (son dos claves, no un alias).
  const solo = mergeSiteConfig(CONFIG, { cct: 'X' })
  expect(solo.cct).toBe('X')
  expect(solo.landing.cct).toBe(esperado().landing.cct)
})

test('las dos modalidades a la vez derivan cada una sus alias', () => {
  const r = mergeSiteConfig(CONFIG, {
    modalidades: { '3_meses': { mensualidad: 2500, activa: false }, '6_meses': { mensualidad: 1250 } },
  })
  const m3 = r.modalidades.find((m) => m.id === '3_meses')!
  const m6 = r.modalidades.find((m) => m.id === '6_meses')!
  expect(m3.mensualidad).toBe(2500)
  expect(m3.activa).toBe(false)
  expect(m6.mensualidad).toBe(1250)
  expect(m6.activa).toBe(true)
  expect(r.precios.plan3mMensualidad).toBe(2500)
  expect(r.precios.secundaria_3meses_sindicalizado).toBe(2500)
  expect(r.precios.preparatoria_3meses_normal).toBe(2500)
  expect(r.precios.plan6mMensualidad).toBe(1250)
  expect(r.precios.secundaria_6meses_normal).toBe(1250)
  expect(r.precios.preparatoria_6meses_sindicalizado).toBe(1250)
  expect(r.modalidades.map((m) => m.id)).toEqual(esperado().modalidades.map((m) => m.id))
})

test('toPublicSiteConfig transporta los VALORES sobreescritos, no solo las claves', () => {
  const pub = toPublicSiteConfig(
    mergeSiteConfig(CONFIG, {
      nombre: 'Escuela X',
      colores: { acento: '#123456' },
      landing: { hero_titulo: 'Hola', hero_badges: ['uno'] },
      precios: { inscripcion: 750, certificacionSecundaria: 4321 },
      modalidades: { '6_meses': { mensualidad: 999 } },
      redes: { instagram: 'https://instagram.com/x' },
    }),
  )
  expect(pub.nombre).toBe('Escuela X')
  expect(pub.colores.acento).toBe('#123456')
  expect(pub.landing.hero_titulo).toBe('Hola')
  expect(pub.landing.hero_badges).toEqual(['uno'])
  expect(pub.precios.inscripcion).toBe(750)
  expect(pub.precios.certificacionSecundaria).toBe(4321)
  expect(pub.precios.certificacion_secundaria).toBe(4321)
  expect(pub.landing.certificacion_secundaria).toBe(4321)
  expect(pub.modalidades.find((m) => m.id === '6_meses')!.mensualidad).toBe(999)
  expect(pub.precios.plan6mMensualidad).toBe(999)
  expect(pub.redes.instagram).toBe('https://instagram.com/x')
})

test('congelarProfundo congela recursivamente objetos y arreglos', () => {
  const obj = congelarProfundo(toPublicSiteConfig(mergeSiteConfig(CONFIG, {})))
  expect(Object.isFrozen(obj)).toBe(true)
  expect(Object.isFrozen(obj.colores)).toBe(true)
  expect(Object.isFrozen(obj.landing)).toBe(true)
  expect(Object.isFrozen(obj.landing.hero_badges)).toBe(true)
  expect(Object.isFrozen(obj.modalidades)).toBe(true)
  expect(Object.isFrozen(obj.modalidades[0])).toBe(true)
  // Los módulos ES son strict: mutar un congelado lanza en vez de fallar en silencio.
  expect(() => {
    ;(obj as unknown as { nombre: string }).nombre = 'X'
  }).toThrow()
  expect(() => {
    ;(obj.landing.hero_badges as unknown as string[]).push('X')
  }).toThrow()
  // Los primitivos pasan tal cual.
  expect(congelarProfundo(5)).toBe(5)
  expect(congelarProfundo('a')).toBe('a')
})
