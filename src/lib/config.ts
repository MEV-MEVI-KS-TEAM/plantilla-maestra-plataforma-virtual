import type { Moneda } from './moneda'

export const CONFIG = {
  // === MODO DE PRODUCTO (línea Solo-Cursos, B7) ===
  // 'tradicional' → secundaria/preparatoria con materias, meses y evaluaciones.
  //                 Cursos y Diplomados sigue disponible como COMPLEMENTO,
  //                 exactamente igual que hoy.
  // 'solo_cursos' → el instituto solo vende diplomados: la superficie principal
  //                 son los cursos y desaparece el programa académico.
  //
  // ⚠️ DEFAULT 'tradicional' A PROPÓSITO: 144 clientes comparten esta plantilla
  // y con este valor la app es IDÉNTICA a la de antes de B7.
  //
  // ⚠️ EL `as ModoPlataforma` NO SOBRA. El objeto entero lleva `as const` (línea
  // final), que estrecharía el tipo de esta clave al literal 'tradicional'. Con
  // ese tipo, `CONFIG.modo === 'solo_cursos'` no compila: TypeScript lo marca
  // como comparación imposible (TS2367) porque los dos literales no se solapan.
  // Es el mismo escape que ya usa `landing.testimonios` con `as Array<…>`.
  modo:            'tradicional' as ModoPlataforma,

  // === IDENTIDAD DEL CLIENTE ===
  nombre:          'MEV',                    // nombre corto: 'IVS', 'CJVB', 'ADE'
  nombreCompleto:  'Mi Escuela Virtual',     // nombre completo legal
  prefijoMatricula:'MEV',                    // prefijo de matrícula SIN guion; formato real PREFIJO-AAAA-0001 (el guion y el año los pone generar_matricula(); vive en public.ajustes)
  tagline:         'Tu certificación con apoyo desde casa',  // subtítulo hero

  // === ASSETS ===
  // REEMPLAZAR /public/logo.png con el logo del cliente. Ver public/README.md
  logo:            '/logo.png',              // logo principal (público)
  logoOscuro:      '/logo.png',              // logo para fondo oscuro

  // === CONTACTO ===
  whatsapp:        '5212345678901',
  whatsappUrl:     'https://wa.me/5212345678901',
  whatsappDisplay: '521 234-567-8901',         // formato legible para UI
  email:           'contacto@mev.com',
  contactoEmail:   'contacto@mev.com',         // alias para footer y perfil
  contactoTelefono:'5212345678901',            // número completo para wa.me

  // === DOMINIO ===
  dominio:         'mev-edu.online',
  urlBase:         'https://mev-edu.online',

  // === BRANDING (cliente personaliza con sus colores) ===
  // Bug 31 fix (5-may-2026): estos colores se inyectan en globals.css via
  // CSS variables (--color-primario, --color-acento, etc.) desde layout.tsx.
  // Las páginas auth + dashboard alumno + admin leen var(--color-*) en lugar
  // de hex hardcoded para que el cliente solo configure aquí y la plataforma
  // tome su paleta automáticamente.
  colores: {
    primario:          '#0F172A',  // slate-900 — sidebar, headings, fondos oscuros
    secundario:        '#1E293B',  // slate-800
    acento:            '#3B82F6',  // blue-500 — botones primarios, links, highlights
    acentoClaro:       '#DBEAFE',  // blue-100
    acentoHover:       '#2563EB',  // blue-600 — hover de botones primarios
    textoSobreAcento:  '#FFFFFF',  // texto contrastante sobre el acento. Override a '#0A0A0A' si acento es claro (ej: amarillo)
    texto:             '#0F172A',  // texto sobre fondos claros
    textoSecundario:   '#525252',  // labels, placeholders, captions
    fondo:             '#F8FAFC',  // slate-50 — fondo de página
    superficie:        '#FFFFFF',  // cards, modales, inputs
    borde:             '#E5E7EB',  // gray-200 — bordes sutiles
    // Color de la barra del navegador en móvil (<meta name="theme-color">).
    // Debe coincidir con el fondo REAL que ve el alumno; si no, la barra queda
    // de un color que no aparece en ninguna pantalla. Por defecto sigue a
    // `fondo` (tema claro). Cliente con landing/app oscura: poner aquí su
    // fondo oscuro (ej. '#0B0D11').
    themeColor:        '#F8FAFC',
  },

  // === NIVELES ACADÉMICOS ===
  niveles: ['secundaria', 'preparatoria', 'licenciatura'] as const,

  // === MODALIDADES (cliente activa/desactiva) ===
  // Si solo 3 meses: poner activa:false en 6meses
  // Si solo 6 meses: poner activa:false en 3meses
  // Si ambas: ambas activa:true
  modalidades: [
    { id: '3_meses', label: '3 meses — Express',  meses: 3, mensualidad: 2000, materiasPorMes: 4, activa: true  },
    { id: '6_meses', label: '6 meses — Estándar', meses: 6, mensualidad: 1000, materiasPorMes: 2, activa: true  },
  ] as const,

  // === MONEDA DE COBRO ===
  // ⚠️ DEFAULT 'MXN' A PROPÓSITO: con este valor toda la app formatea el dinero
  // EXACTAMENTE igual que antes de #198, no se pinta ninguna equivalencia y no
  // aparece ningún aviso. La personalización es aditiva o no es.
  //
  // 'USD' → los importes SON dólares: la landing, el registro, el estado de
  // cuenta, el recibo y los reportes los formatean como tales y, si hay tipo de
  // cambio, muestran debajo la equivalencia aproximada en pesos.
  //
  // ⚠️ EL `as Moneda` NO SOBRA, por lo mismo que el `as ModoPlataforma` de
  // arriba: sin él, el `as const` del objeto estrecha esta clave al literal
  // 'MXN' y `CONFIG.moneda === 'USD'` deja de compilar (TS2367).
  //
  // 🛑 La moneda NO se edita desde el panel: cambiarla no es cambiar la marca,
  // es cambiar lo que se le cobra al alumno. Vive aquí y la fija el operador.
  moneda:          'MXN' as Moneda,

  // Pesos por unidad de `moneda`. Solo se usa para MOSTRAR equivalencias; el
  // cargo real siempre es en `moneda`. `0` = no mostrar ninguna equivalencia,
  // que es lo correcto para una escuela que ya cobra en pesos.
  //
  // Este SÍ es editable desde el panel (se mueve a diario): el admin lo cambia
  // en Personalizar mi página → Precios. Cada pago guarda además el tipo de
  // cambio que estaba vigente ese día en `pagos.tipo_cambio_aplicado`, para que
  // actualizarlo no reescriba los recibos ya emitidos.
  tipoCambioMXN:   0 as number,

  // === PRECIOS ===
  precios: {
    inscripcion:                       599,
    plan6mMensualidad:                 1000, // @deprecated — usar modalidad.mensualidad via getModalidadesActivas()
    plan3mMensualidad:                 2000, // @deprecated — usar modalidad.mensualidad via getModalidadesActivas()
    certificacionSecundaria:           4900,
    certificacionPreparatoria:         5900,
    preparatoria_6meses_normal:        1000,
    preparatoria_6meses_sindicalizado: 1000,
    preparatoria_3meses_normal:        2000,
    preparatoria_3meses_sindicalizado: 2000,
    secundaria_6meses_normal:          1000,
    secundaria_6meses_sindicalizado:   1000,
    secundaria_3meses_normal:          2000,
    secundaria_3meses_sindicalizado:   2000,
    certificacion_preparatoria:        5900,
    certificacion_secundaria:          4900,
  },

  // === DOCUMENTOS REQUERIDOS POR NIVEL ===
  // ⚠️ ESTA LISTA NO LA LEE NADIE HOY. Es documental: la pantalla de documentos
  // del alumno lleva sus propias listas (TIPOS_SECUNDARIA / TIPOS_PREPA /
  // TIPOS_DIPLOMADO en src/app/(dashboard)/alumno/documentos/page.tsx) y son
  // las que mandan.
  //
  // Y NO COINCIDEN: aquí figura «Acta de Nacimiento» y la app no la pide. Por
  // eso no basta con enchufar esta lista a la pantalla — a las ~144 escuelas
  // ya sembradas les aparecería de golpe un documento obligatorio nuevo, con
  // alumnos a medio expediente. Unificarlas es un cambio de producto, no de
  // config: hay que decidir primero cuál de las dos listas es la buena.
  //
  // Se mantiene, y se le agrega `licenciatura`, para que el día que se unifique
  // el catálogo esté completo y nadie tenga que reconstruirlo.
  documentosRequeridos: {
    secundaria:   ['Certificado de Primaria', 'CURP', 'Acta de Nacimiento', 'Identificación Oficial', 'Foto de Perfil (fondo blanco)'],
    preparatoria: ['Certificado de Secundaria', 'CURP', 'Acta de Nacimiento', 'Identificación Oficial', 'Foto de Perfil (fondo blanco)'],
    // El aspirante a licenciatura acredita BACHILLERATO, no secundaria. La
    // pantalla ya lo etiqueta así (deriva el nivel de `plan_nombre`).
    licenciatura: ['Certificado de Bachillerato', 'CURP', 'Acta de Nacimiento', 'Identificación Oficial', 'Foto de Perfil (fondo blanco)'],
  },

  // === LANDING ===
  landing: {
    // ⚠️ hero_titulo / hero_highlight / hero_subtitulo existían pero la landing
    // NO las leía: eran letra muerta y el hero pintaba sus propios literales.
    // Desde F3 (Personalizar mi página) la landing SÍ las lee, así que el
    // default pasa a ser el texto que siempre se vio en producción. Con la BD
    // vacía la página sigue pixel-idéntica; cambiar estos valores aquí es lo
    // mismo que cambiar el JSX de antes.
    //
    // El '\n' de hero_subtitulo marca el <br className="hidden sm:block" /> que
    // hoy parte el párrafo en dos líneas. Al pintar hay que partir por '\n' y
    // meter ese mismo <br> ENTRE líneas; en el JSX original la segunda línea
    // llevaba un espacio delante del texto (`<br /> Con apoyo…`), que en
    // móvil (br oculto) separa "trabajo." de "Con": ese espacio debe conservarse.
    hero_titulo:                'Tu Secundaria o Preparatoria',
    hero_highlight:             'desde donde estés',
    hero_subtitulo:             'Sin ir a la escuela. Sin perder tu trabajo.\nCon apoyo en tu certificado SEP.',
    // Sigue existiendo pero la landing NO la pinta (no hay sección de badges
    // bajo el hero). Editable, para no romper overrides ya guardados.
    hero_badges:                ['Acompañamiento Certificado', 'Sin salir de casa', '100% en línea'],
    // Ciudad que se muestra en el badge del hero. VACÍO = se omite el segmento
    // por completo (correcto para un instituto 100% en línea sin domicilio).
    // Antes esto era el literal '[Ciudad, México]' escrito en el JSX y llegaba
    // así, entre corchetes, a producción: no rompía el build ni el smoke test
    // por HTTP, solo se veía abriendo la página.
    ciudad:                     '',
    // convenios / respaldo_titulo / respaldo_badges: siguen existiendo pero la
    // landing NO los pinta (no hay sección "Respaldo"). No se inventa una
    // sección nueva por F3; se documenta y ya. `convenios` no es editable.
    convenios:                  [],
    respaldo_titulo:            'Respaldados por instituciones educativas de confianza',
    respaldo_badges:            [],
    testimonios: [] as Array<{ name: string; age: string; nivel: string; initials: string; quote: string }>,
    certificacion_secundaria:   4900,
    certificacion_preparatoria: 5900,
    cct:                        '',

    // === CATÁLOGO DE CURSOS Y DIPLOMADOS ===
    // DEFAULT true. Antes venía en `false` "para no cambiar la landing de los
    // clientes de secundaria/preparatoria", pero ese resguardo era innecesario:
    // la sección está gateada por `catalogo.length > 0`, así que una escuela sin
    // cursos publicados no ve ni un pixel de diferencia. Lo único que cambia con
    // el flag encendido es que `src/app/page.tsx` consulta la tabla `cursos` en
    // el build.
    //
    // Lo que sí provocaba el `false` era deuda: la escuela creaba su curso desde
    // el panel, lo publicaba, y no aparecía en ninguna parte del sitio. El
    // cliente daba por hecho que estaba a la venta y no lo estaba. Pasó al menos
    // dos veces (SICOVIP y Luis Saenz Arroyo, TICKET-2026-09-04-38) y las dos
    // veces se descubrió porque el cliente reclamó, no por una revisión.
    //
    // Apagarlo sigue siendo válido para una escuela que quiera vender sus cursos
    // solo por fuera del sitio.
    mostrarCatalogoCursos:      true,

    // ¿La tabla de precios enseña el TOTAL del plan (inscripción + todas las
    // mensualidades)?
    //
    // ⚠️ DEFAULT false A PROPÓSITO: añadir una fila a la tabla de precios de
    // ~144 landings en producción no es un cambio invisible, y en una escuela
    // donde el plan largo sale más caro el total no ayuda a vender.
    //
    // Se enciende donde el total ES el argumento: GRATIA (#198) cobra 3×300 o
    // 6×150 y las dos rutas suman 950, así que el alumno elige ritmo y no
    // precio — pero eso no se ve hasta que alguien pone los dos totales lado a
    // lado.
    mostrarTotalPlan:           false,
    catalogoTitulo:             'Nuestros diplomados',
    // Texto NEUTRO: igual que en el diploma (B4), el default NO dice "validez
    // oficial", "SEP" ni "RVOE". Eso solo lo agrega quien acredite su registro.
    catalogoSubtitulo:          'Programas especializados, con acompañamiento y material descargable.',

    // === TEXTOS DE LA LANDING (F3, "Personalizar mi página") ===
    // Cada default es el literal EXACTO que LandingClient.tsx tenía escrito en
    // el JSX antes de F3: con la BD vacía la página no cambia ni una letra.
    //
    // PLACEHOLDERS: {duracion} → getDuracionLabel() con las modalidades del
    // config fusionado; {nombre}, {nombreCompleto}, {whatsapp} → esas claves;
    // {inscripcion} → precio de inscripción formateado como hoy (fmt). Se
    // sustituyen al pintar con `interpolar()` (site-config-core.ts); un
    // placeholder desconocido se deja tal cual.
    //
    // Lo que NO está aquí se queda literal en la landing a propósito (etiquetas
    // de interfaz: nav, 'Preparatoria'/'Secundaria', 'Inscripción:', '/mes',
    // 'Ver temario →', footer legal, aria-labels…).
    //
    // Los arreglos de objetos van con `as Array<…>` para que `as const` no
    // estreche cada campo a su literal (mismo truco que `testimonios`).

    // — Hero —
    // Badge superior. El sufijo ' · {ciudad}' sigue siendo dinámico con
    // `landing.ciudad`; no forma parte de este texto.
    hero_badge_superior:        'Centro de Apoyo para la Acreditación de Conocimientos',
    hero_cta_primario:          'Comenzar ahora →',
    hero_cta_whatsapp:          'WhatsApp',
    // Contadores animados bajo el hero. `valor` es el número al que sube el
    // contador; `sufijo` se pega sin espacio ('%', 'h').
    contadores: [
      { valor: 2,   sufijo: '',  etiqueta: 'Niveles',  sub: 'Sec · Prepa' },
      { valor: 100, sufijo: '%', etiqueta: 'En línea', sub: 'A tu ritmo' },
      { valor: 24,  sufijo: 'h', etiqueta: 'Acceso',   sub: 'Plataforma' },
    ] as Array<{ valor: number; sufijo: string; etiqueta: string; sub: string }>,

    // — Dolor / PAS —
    dolor_kicker:               'Sabemos lo que sientes',
    dolor_titulo:               '¿Te identificas con alguna de estas situaciones?',
    dolor_items: [
      { icono: '⏰', titulo: 'Sin tiempo para asistir',      desc: 'Tu trabajo o familia no te dejan ir a la escuela en horario normal.' },
      { icono: '💼', titulo: 'No puedes dejar de trabajar',  desc: 'Necesitas el certificado, pero no puedes darte el lujo de dejar de ingresar.' },
      { icono: '📅', titulo: 'Crees que ya es tarde',        desc: 'Llevas años pensando en terminar pero nunca encontraste la forma.' },
    ] as Array<{ icono: string; titulo: string; desc: string }>,
    // Va seguido de ' ' + nombreCompleto con gradiente (misma estructura que hoy).
    dolor_cierre:               'Para eso existe',
    dolor_cierre_sub:           'Estudia a tu ritmo, desde tu celular, sin horarios fijos. Con certificado oficial.',

    // — Programas (precios) —
    programas_kicker:           'Programas',
    programas_titulo:           'Secundaria y Preparatoria',
    programas_subtitulo:        'Inscripción única {inscripcion} · Elige tu nivel y plan',
    programas_popular:          '★ Popular',
    programas_cta:              'Inscribirme →',

    // — Transformación (antes / después) —
    // Las cabeceras 'Sin {nombre}' / 'Con {nombre}' de cada columna siguen
    // siendo literales de interfaz con CONFIG.nombre; no se editan.
    transformacion_kicker:      'Transformación',
    transformacion_titulo:      'Tu vida, antes y después',
    transformacion_sin: [
      'Sin acceso a tu certificado para avanzar profesionalmente.',
      'Bloqueado por horarios que no se adaptan a tu vida.',
      'Años postergando tu sueño de terminar tus estudios.',
      'Oportunidades de trabajo que se te escapan sin el papel.',
    ],
    transformacion_con: [
      'Te apoyamos en la gestión de tu certificado oficial SEP.',
      'Estudias a tu ritmo, desde tu celular, sin salir de casa.',
      'En {duracion} terminas lo que llevas años posponiendo.',
      'Abre puertas: trabajo, universidad, trámites oficiales.',
    ],

    // — Proceso (cómo funciona) —
    // El número 01..04 se deriva del índice, no se guarda.
    proceso_kicker:             'Proceso',
    proceso_titulo:             'Cómo funciona',
    proceso_pasos: [
      { titulo: 'Registro',                  desc: 'Crea tu cuenta y elige tu nivel: Secundaria o Preparatoria.' },
      { titulo: 'Inscripción',               desc: 'Realiza el pago de inscripción y sube los documentos requeridos.' },
      { titulo: 'Acceso a la plataforma',    desc: 'Obtén acceso inmediato a tus materias según el plan contratado.' },
      { titulo: 'Certificación oficial SEP', desc: 'Concluye tu nivel y recibe el certificado con validez nacional.' },
    ] as Array<{ titulo: string; desc: string }>,

    // — Testimonios (la sección solo se pinta si `testimonios` no está vacío) —
    testimonios_kicker:         'Testimonios',
    testimonios_titulo:         'Personas reales, resultados reales',
    testimonios_subtitulo:      'Miles de alumnos ya obtuvieron su certificado con nosotros.',

    // — Beneficios —
    // Sin campo `icono`: hoy todas las tarjetas llevan el mismo CheckIcon.
    beneficios_titulo:          'Todo lo que necesitas',
    beneficios_subtitulo:       'Diseñado para quien trabaja, tiene familia y quiere superarse.',
    beneficios_items: [
      { titulo: 'Gestión de tu certificado SEP', desc: 'Validez nacional reconocida por el sistema educativo mexicano.' },
      // Bug 105: el default nombraba la ciudad de UN cliente (dato colado en la plantilla); neutro y alineado con el hero ('desde donde estés').
      { titulo: '100% en línea',                 desc: 'Estudia desde donde estés, sin trasladarte.' },
      { titulo: 'Materias estructuradas',        desc: 'Contenidos organizados por meses con progresión clara y alcanzable.' },
      { titulo: 'Acompañamiento directo',        desc: 'Seguimiento personalizado y canal de atención por WhatsApp.' },
      { titulo: 'Planes flexibles',              desc: 'Elige entre planes de {duracion} según tu disponibilidad.' },
      { titulo: 'Plataforma moderna',            desc: 'Accede a tu constancia y avance desde cualquier dispositivo, 24 h.' },
    ] as Array<{ titulo: string; desc: string }>,

    // — FAQ —
    faq_kicker:                 'FAQ',
    faq_titulo:                 'Preguntas frecuentes',
    faq_items: [
      { q: '¿Cuánto tiempo tengo para terminar?',                    a: 'Depende del plan elegido: tienes acceso a tus materias durante el período contratado ({duracion}) y puedes estudiar a tu ritmo, sin horarios fijos.' },
      { q: '¿El certificado tiene validez oficial en todo México?',  a: 'Te acompañamos en el proceso para obtener tu certificado oficial SEP, el cual es reconocido a nivel nacional para trámites laborales, universitarios y gubernamentales. Fungimos como Centro de Apoyo para la Acreditación de Conocimientos: facilitamos el camino, mientras la validez oficial corresponde a la SEP.' },
      { q: '¿Qué documentos necesito para inscribirme?',             a: 'Secundaria: Certificado de Primaria, CURP, Acta de Nacimiento, Identificación Oficial y foto de perfil fondo blanco. Preparatoria: los mismos más Certificado de Secundaria.' },
      { q: '¿Puedo estudiar desde mi celular?',                      a: 'Sí, la plataforma está optimizada para móvil. Puedes acceder desde cualquier dispositivo con conexión a internet, en cualquier momento del día o de la noche.' },
      { q: '¿Qué pasa si tengo dudas durante el curso?',             a: 'Contamos con canal directo de atención por WhatsApp al {whatsapp}. Nuestro equipo te responde para orientarte en cualquier momento del proceso.' },
    ] as Array<{ q: string; a: string }>,

    // — CTA final —
    // cta_titulo va seguido de <br /> + cta_highlight con gradiente.
    cta_titulo:                 'Tu futuro empieza',
    cta_highlight:              'hoy mismo',
    cta_subtitulo:              'Registro en minutos. Equipo listo para orientarte.',
    cta_boton:                  'Crear cuenta gratis →',
    cta_whatsapp:               'WhatsApp',
  },

  cct: '',

  // === DIPLOMAS DE LA LINEA SOLO-CURSOS (B4) ===
  // El folio de la constancia es CONSECUTIVO y sale de una secuencia de Postgres
  // (curso_folio_seq). El prefijo es de NIVEL CLIENTE, no por curso: la secuencia
  // es global, asi que prefijos distintos por curso darian numeraciones salteadas
  // dentro de cada prefijo — y un libro de folios con huecos no sirve para
  // verificar nada. B7 lo fija al provisionar.
  diploma: {
    /** Prefijo del folio. Resultado: `${folioPrefijo}-00001`, `-00002`, ... */
    folioPrefijo: 'CONST',
    /**
     * Etiqueta del documento. NEUTRA a proposito: 'Constancia' / 'Diploma' /
     * 'Certificado'. NO poner aqui "con validez oficial", "SEP" ni "RVOE" —
     * eso solo lo agrega un cliente que acredite su propio registro, y ponerlo
     * por default seria afirmar algo legalmente falso en nombre de todos.
     */
    etiqueta: 'Constancia',
    /** Ruta de la firma escaneada (PNG con alfa). Vacio = sin firma. */
    firma: '',
    /** Cargo bajo la firma. */
    firmaCargo: 'Dirección Académica',
  },

  redes: {
    facebook:  '',
    instagram: '',
  },

  // === ADD-ON CURSOS DE INGRESO (opcional) =================================
  // Cursos de preparación a examen de admisión, vendidos como producto de PAGO
  // ÚNICO aparte del plan de Sec/Prepa/Lic. No es el modo 'solo_cursos': aquí
  // la plataforma sigue siendo la de siempre y el curso es un extra que el
  // alumno puede llevar solo o encima de su plan.
  //
  // Con `activa: false` el bloque del registro y la columna de /admin/alumnos
  // no se dibujan. Para encenderlo en un cliente: poner `activa: true` y una
  // entrada por curso vendido.
  //
  //   cursoIds → UUID del curso en la tabla `cursos`. Los seeds del banco usan
  //              UUID v5 deterministas, así que el mismo curso tiene el mismo
  //              UUID en todos los clientes. Van en arreglo porque una oferta
  //              puede ser un paquete de varios cursos.
  //   precio   → pago único en MXN. El módulo no tiene checkout: el alumno paga
  //              por fuera y el admin le activa el curso desde /admin/alumnos.
  //
  // Para vender varios cursos como PAQUETE ÚNICO en vez de sueltos, usar
  // `precioPaquete: <monto>` en lugar de `precio` por curso: src/lib/cursos/
  // oferta.ts los colapsa en una sola oferta que inscribe a todos.
  // === ADD-ON LICENCIATURAS =================================================
  // Tercer programa, junto a Secundaria y Preparatoria.
  //
  // ⚠️ DEFAULT `activas: false` A PROPÓSITO, igual que `cursosIngreso` y
  // `landing.mostrarCatalogoCursos`: los clientes que solo venden Sec/Prepa
  // comparten esta plantilla y con este valor la app es IDÉNTICA a antes del
  // add-on — no se dibuja la opción en el registro, ni la tarjeta del panel,
  // ni la sección de la landing, y ninguna consulta extra se ejecuta.
  //
  // Para encenderlo en un cliente: `activas: true` + una entrada por carrera
  // vendida + los planes de duración. Requiere además la migración
  // `20260812120000_licenciaturas.sql` (columnas `carrera` / `modalidad`).
  //
  // ⚠️ `modalidades` es una tabla APARTE de `CONFIG.modalidades`. Los planes de
  // licenciatura no son los del programa: pueden durar 9 o 12 meses, que no
  // existen en Sec/Prepa. `src/lib/modalidades.ts` resuelve las dos.
  //
  // ⚠️ `materiasPorMes` es lo ÚNICO que cambia entre planes de una misma
  // carrera. El catálogo de materias es el mismo y se filtra SOLO por carrera
  // (ver `cargarContextoAcceso` en src/lib/acceso-materias.ts): filtrar además
  // por modalidad deja sin materias a todo alumno cuyo plan no sea aquel con
  // el que se sembró el catálogo.
  licenciaturas: {
    activas: false,
    /** Pago único al inscribirse. */
    inscripcion: 0,
    /** Título y cédula profesional, con gestión administrativa. */
    certificacion: 0,
    carreras: [] as ReadonlyArray<{
      /** Slug estable. Es el valor que se guarda en `alumnos.carrera`. */
      slug: string
      nombre: string
      cuatrimestres: number
      totalMaterias: number
      /** Nombre de un icono de lucide-react (ej. 'Scale', 'Briefcase'). */
      icono: string
      desc: string
      incluye: readonly string[]
    }>,
    modalidades: [] as ReadonlyArray<{
      id: string
      label: string
      /** Etiqueta corta para las tarjetas de precio (ej. '9 meses'). */
      sublabel: string
      meses: number
      mensualidad: number
      activa: boolean
      /** Ritmo de desbloqueo: materias nuevas por mes. */
      materiasPorMes: number
    }>,
  },

  // === ENLACES DE COBRO ===
  // DESACTIVADO por defecto: una escuela sin enlaces no ve ningún cambio — ni el
  // item "Pagos" en el menú del alumno, ni el botón del aviso de inscripción.
  //
  // Se enciende poniendo `activo: true` y cargando los enlaces que la escuela
  // emita desde SU pasarela (Clip, Mercado Pago, el que use). La plataforma NO
  // cobra ni confirma nada: abre el enlace, y el pago lo sigue registrando el
  // admin a mano en /admin/pagos cuando recibe el comprobante.
  //
  // `niveles` decide a quién se le muestra cada enlace. Vacío = no se muestra a
  // nadie, útil para dejar cargado un cobro que todavía no aplica.
  pagos: {
    activo: false,
    /** Marca con la que la pasarela emite los enlaces, si no es la de la escuela.
     *  Se le avisa al alumno para que no dude al llegar al checkout. */
    emisor: '',
    enlaces: [] as ReadonlyArray<{
      id: string
      concepto: string
      detalle: string
      /** null = el monto lo confirma el asesor; no se pinta cifra. */
      monto: number | null
      /** Vacío = no se le muestra a nadie todavía. */
      niveles: readonly string[]
      url: string
    }>,
  },

  cursosIngreso: {
    activa: false,
    pagoUnico: true,
    cursos: [] as ReadonlyArray<{
      /** Id estable de la oferta. Se guarda en alumnos.curso_solicitado. */
      id: string
      nombre: string
      /** Examen al que prepara, para el subtítulo del registro. */
      examen?: string
      precio: number
      cursoIds: readonly string[]
    }>,
  },
} as const

// === COMPATIBILIDAD ===
export const ESCUELA_CONFIG = CONFIG
export const config = CONFIG
export default CONFIG

export type Nivel = typeof CONFIG.niveles[number]
export type Modalidad = typeof CONFIG.modalidades[number]

/**
 * Modo de producto del cliente (B7).
 *
 * Se declara aquí abajo y se usa arriba en `CONFIG.modo`: los tipos de
 * TypeScript se elevan, así que el orden del archivo no importa.
 *
 * Los helpers para preguntar por el modo NO viven aquí — están en
 * `src/lib/modo.ts`, junto con lo que cada modo oculta.
 */
export type ModoPlataforma = 'tradicional' | 'solo_cursos'
