# Entrega final — PDF y mensaje de WhatsApp

**Es el ÚLTIMO paso del proceso de desarrollo MEV.** Cuando la plataforma ya está
en producción con su dominio definitivo, esto produce los dos entregables que
recibe el cliente:

```
entrega/<NOMBRE>_Entrega_Oficial.pdf
entrega/ENTREGA-WHATSAPP.txt
```

## Prerrequisitos

El generador corre en la máquina del desarrollador, no en Vercel. Antes de la
primera corrida en un repo:

| Qué | Por qué |
|---|---|
| **Node ≥ 23.6** (`node --version`) | Importa `src/lib/config.ts` tal cual, con el type stripping nativo de Node. Con un Node anterior falla con `Unknown file extension ".ts"`; el script lo detecta y lo dice claro. |
| `pnpm install` | Trae `@supabase/supabase-js` (inventario) y `@playwright/test` (impresión a PDF). |
| `npx playwright install chromium` | Descarga el Chromium con el que Playwright imprime el PDF. Una vez por máquina; si falta, el error es `Executable doesn't exist`. |
| `entrega.local.json` en la raíz | Credenciales del admin, del alumno de prueba y de las cuentas del cliente (correo, Supabase y GoDaddy). Parte de `scripts/entrega/entrega.local.ejemplo.json`. Git lo ignora. |
| `.env.local` en la raíz | Lo mismo que usa la app (`vercel env pull .env.local`, del ambiente de PRODUCCIÓN de la escuela). De aquí salen lo publicado en «Personalizar mi página», el inventario de contenido y la URL del proyecto de Supabase. **Sin él el script aborta** (D12): el documento tiene que decir lo mismo que la página. Solo si sabes que la escuela no ha publicado nada, `--solo-config` genera con `config.ts` y lo deja escrito en «REVISA ANTES DE ENVIAR». |

Verificación rápida: `node --version` da 23.6 o más, y
`ls entrega.local.json .env.local` encuentra los dos archivos.

## Uso

```bash
cp scripts/entrega/entrega.local.ejemplo.json entrega.local.json   # una vez
# …editar con los datos del cliente…
pnpm entrega
```

El mensaje también se imprime en la terminal entre marcas de corte, listo para
copiar y pegar en WhatsApp.

| Flag | Efecto |
|---|---|
| `--solo-pdf` | No genera el mensaje |
| `--datos otro.json` | Usa otro archivo de datos |
| `--solo-config` | No lee lo publicado en el panel: todo sale de `config.ts`, y queda escrito en «REVISA ANTES DE ENVIAR». Solo si sabes que la escuela no ha publicado nada |
| `--forzar-proyecto` | Genera aunque el nombre publicado en el panel (`nombre` o `nombreCompleto`) no sea el de `config.ts`, o aunque `supabaseUrl` de `entrega.local.json` sea de otro proyecto que `.env.local`. Queda escrito en «REVISA ANTES DE ENVIAR». Úsalo solo si la escuela cambió su nombre a propósito |

Al leer lo publicado, el script dice en consola **de qué proyecto de Supabase
leyó** (el ref de `NEXT_PUBLIC_SUPABASE_URL` de `.env.local`) y **qué escuela
está publicada ahí**, y lo repite como primera línea de «⚠ REVISA ANTES DE
ENVIAR», que ahora sale siempre. Si el `nombre` o el `nombreCompleto` publicados
no son los de `config.ts` (sin distinguir mayúsculas, acentos, espacios ni caracteres invisibles),
**aborta** antes de generar nada: casi siempre es un `.env.local` de otra
escuela. Con `--solo-config` no se compara nada.

## De dónde sale cada dato

Casi todo se lee solo. **No hay que capturar dos veces lo que ya está en el
config**, porque un documento de entrega que contradice a la plataforma es peor
que no tenerlo.

**Lo publicado en «Personalizar mi página» manda** (D12): el script lee
`site_config` y fusiona con la MISMA función que la app (`mergeSiteConfig` de
`src/lib/site-config-core.ts`, cargada con el hook `scripts/entrega/alias-src.mjs`
que resuelve `@/…` a `src/`). Así el documento dice lo mismo que la página de la
escuela: precios, planes, WhatsApp, textos, colores y logo. Sin `.env.local`, sin
llaves o si la lectura falla, **aborta**; `--solo-config` genera solo con
`config.ts` a sabiendas y lo deja en «⚠ REVISA ANTES DE ENVIAR». Sin fila o con una
base sin `site_config`, sale de `config.ts` (no hay nada publicado). La lectura y
la política viven en `scripts/entrega/publicado.mjs`.

| Dato | Origen |
|---|---|
| Nombre, colores, logo | `src/lib/config.ts` con lo publicado encima. El logo publicado (una URL) se descarga e incrusta; si no se puede, va el de `config.ts` y se avisa en REVISA |
| Dominio, niveles | `src/lib/config.ts` (no se editan en el panel) |
| Modalidades, precios, WhatsApp | `src/lib/config.ts` con lo publicado encima. Un WhatsApp que la página no enciende (vacío, el marcador `520000000000` o un número que no se puede normalizar: la regla `whatsappEscuelaDisponible` de `src/lib/contacto-ui.ts`, la misma de las dos portadas) cuenta como **sin WhatsApp**: el documento no imprime «WhatsApp de contacto» y explica cómo encender los botones |
| Correo de contacto (el que ven alumnos y landing) | El MISMO camino que la app (`canalEscuela` de `src/lib/contacto-ui.ts`): `contactoEmail` y, si está vacío, `email`, de `config.ts` con lo publicado encima. Sale en la página de accesos («Correo de contacto», aparte del usuario administrador) y en el WhatsApp («📞 ASÍ TE CONTACTAN TUS ALUMNOS», junto al WhatsApp). El de fábrica de la plantilla (`…@mev.com`) no es de la escuela: no se imprime y se avisa en REVISA (Bloque E2) |
| Nombre de cada carrera (licenciaturas, diplomados, cursos del riel) | El de `config.ts` con el publicado en «Personalizar mi página» encima (`landing.licenciaturas_carreras[].nombre`, casado por `slug`), con la MISMA regla que la tarjeta de la landing. Cada nombre cambiado se avisa en REVISA: el registro, el panel y las constancias siguen diciendo el de `config.ts`. Un nombre publicado con un comodín que el documento no resuelve (p. ej. `{duracion}`) no se usa: queda el de `config.ts` y se avisa en REVISA. El tipo de programa (licenciatura, diplomado, curso) se decide con el de `config.ts` |
| Inscripción y mensualidad **por nivel** | El MISMO resolver de la plataforma (`src/lib/precios-nivel.ts`), con las mismas claves que leen la landing, el estado de cuenta y la ficha del alumno: `precios.inscripcionSecundaria` / `precios.inscripcionPreparatoria` y `precios.mensualidadSecundaria3Meses`, `…6Meses`, `precios.mensualidadPreparatoria3Meses`, `…6Meses`. Vacías (`null`) = la general. Sin mensualidad propia, Secundaria usa su alias `precios.secundaria_<n>meses_normal` si es mayor que 0 y Preparatoria, la del plan. Con lo publicado en «Personalizar mi página» encima (D12) |
| Licenciaturas | `src/lib/config.ts` con lo publicado en «Personalizar mi página» encima: inscripción, titulación y la mensualidad de cada plan (`site_config` → `licenciaturas`, con la MISMA regla de la plataforma, `src/lib/precios-licenciatura.ts`). Sin fila o con `--solo-config`, solo `config.ts` |
| Cursos de ingreso | La tabla `cursos` (los **publicados**, con su precio) vía `.env.local` con la service role, y con la MISMA regla de la página (`src/lib/cursos/precio-regla.ts`): sin precio dice «Pide informes». Lo hace `scripts/entrega/cursos-entrega.mjs`. Si la consulta falla (proyecto pausado, llave de otro proyecto, red: antes salía como «0 cursos»), **aborta** en una escuela que vende cursos (`CONFIG.cursosIngreso` encendido, o modo `solo_cursos`) y en las demás avisa. **Aborta** también si la base no tiene las columnas de precio (B1), o si `CONFIG.cursosIngreso` está encendido y no hay inventario o no hay cursos publicados. `CONFIG.cursosIngreso` se revisa con la MISMA regla del registro (`normalizarOfertas` y `resolverPrecioOferta`): el registro anuncia el precio de la ficha y, si la ficha está en 0/0, el de `config.ts` como pago único. Por eso **aborta** si una oferta de un curso tiene la ficha en 0/0 y precio en `config.ts` (el documento diría «Pide informes» y «Asignar» abriría solo el mes 1) o si apunta a un curso que no está publicado. Con la ficha con precio distinto al de `config.ts`, con paquete o con una oferta de varios cursos (el registro anuncia la oferta, no cada curso), solo avisa, y dice qué cursos abren solo el mes 1 o salen «Pide informes». Los avisos se repiten al final, en «⚠ REVISA ANTES DE ENVIAR» |
| Materias, semanas, preguntas, matrícula | consulta real a Supabase vía `.env.local` |
| Nombre del admin y contraseñas | `entrega.local.json` (ignorado por git) |
| Cuentas del cliente con su contraseña: correo, Supabase y GoDaddy (Infraestructura) | `entrega.local.json` → `cuentas`: `{ "correo": { "email", "password" }, "supabase": {…}, "godaddy": {…} }`. En MEV salen de la ficha de `credenciales-clientes` (`outlook_*`, `supabase_*`, `godaddy_*`) |
| Dominio y URL de la plataforma (Infraestructura) | `CONFIG.dominio` |
| Registrador del dominio (Infraestructura) | `entrega.local.json` → `registrador`; si falta, **GoDaddy** |
| Proyecto de Supabase: ref, URL y panel (Infraestructura) | `NEXT_PUBLIC_SUPABASE_URL` de `.env.local` (o `supabaseUrl` en `entrega.local.json` si no hay `.env.local`). El ref es el subdominio; el panel es `https://supabase.com/dashboard/project/<ref>`. El ref y el nombre de la escuela publicada salen en consola y en REVISA; un nombre publicado distinto del de `config.ts`, o un `supabaseUrl` de otro proyecto que `.env.local`, **aborta** salvo con `--forzar-proyecto` |

El `.env.local` se lee UNA sola vez y con la misma regla para todo (lo publicado,
el inventario y la página de Infraestructura): aguanta CRLF, BOM, espacios y
comillas (`scripts/entrega/env-local.mjs`, #197). `ENTREGA_ENV_LOCAL=<archivo>`
lee otro archivo en vez de `<repo>/.env.local` (lo usan las pruebas).

Cuando el script **aborta**, sale con código **1** y sin generar nada. Antes, en
Windows con Node 24, un aborto con una conexión todavía cerrándose terminaba con
una aserción de libuv y el código `3221226505` (#256): ya no llama a
`process.exit` al abortar, deja `exitCode = 1` y Node sale solo.

Sin `.env.local`, o sin su URL o su llave, el script **aborta** antes de todo
esto (D12: no puede leer lo publicado). Con `--solo-config` sigue sin lo
publicado; entonces el inventario se omite y el resto del documento se genera
igual, salvo con `CONFIG.cursosIngreso` encendido o en modo `solo_cursos` (el
documento negaría los cursos vendidos: aborta). La página de Infraestructura avisa en
consola si no encontró la URL de Supabase o si faltan las `cuentas`. Se puede
omitir con `"infraestructura": false` en `entrega.local.json`; si hay `cuentas`,
la página sale igual, con ellas solas.

## El documento se pagina solo

Cada página mide once pulgadas y **recortaba en silencio** lo que no cabía: una
sección que crecía se llevaba por delante lo último escrito y el PDF salía con
una frase cortada a media línea, sin que nadie se enterara hasta que lo leía el
cliente.

Ahora lo que no cabe pasa a una página nueva con su misma cabecera y su mismo
pie, los números se renumeran al final, un encabezado nunca se queda solo al pie
de una página, y una página de continuación que no empiece por título se rotula.

Si algo sigue sin caber —un bloque que no entra ni en una página vacía— el
generador lo dice en consola con la página y los píxeles que sobran:

```
🛑 SIGUE SIN CABER, y el PDF lo recorta:
   Pág. 7 «Catálogo» — sobran 210 px
```

Eso es una tabla o una nota demasiado larga: hay que acortarla o partirla a mano.

## Se adapta a lo contratado

El documento **no es una plantilla fija**: cambia según lo que el cliente compró.

- **Una modalidad** → "plan único de N meses", y el registro no ofrece selector.
- **Varias modalidades** → una fila de precio y una de costo total por plan.
- **Precio por nivel** (`precios.inscripcionSecundaria`, `precios.mensualidadSecundaria3Meses`…)
  → cada columna con la cifra de su nivel. `precios.inscripcion` tiene que ser un
  número (la general), y también la `mensualidad` de cada plan mensual: la forma
  de objeto `{ secundaria, preparatoria }` ya no se lee y el script se detiene
  diciendo qué claves usar. También se detiene si un nivel no vende ningún plan.
- **Oferta asimétrica** (planes con `nivel`, p. ej. Secundaria solo 3 meses y
  Preparatoria solo 6) → cada nivel con SUS planes; nunca combinaciones que nadie vende.
- **Licenciaturas activas** → se añade una página con carreras y planes.
- **Varias rutas de titulación** (`licenciaturas.rutas`) → cada una con su
  bloque: quién otorga el documento, para quién es, sus planes con el total, su
  titulación y su aviso legal. Cuando hay rutas, la certificación NO se anuncia
  suelta arriba: cada ruta tiene la suya.
- **Licenciaturas y diplomados a la vez** → se cuentan y se listan por separado.
  No son el mismo producto: uno titula y el otro prepara para una evaluación que
  hace un tercero.
- **Textos legales de los diplomados** (`avisoCostoDiplomado` y
  `disclaimerDiplomado` en `CONFIG.licenciaturas`) → van al PDF y al mensaje. Es
  la fuente única: la landing los lee de ahí, así que el papel y la web dicen lo
  mismo palabra por palabra.
- **Lo hecho a medida** → se detecta mirando el repo, no con una lista escrita a
  mano: comunidad con inscripción $0, formulario de diagnóstico, páginas legales
  y página institucional con demostración embebida.
- **Cursos y Diplomados** → siempre presente; dice si va vacío o con contenido.
- **Cobro semanal** (`periodicidad: 'semanal'`) → los planes salen de
  `modalidades[].nivel`, no del cruce niveles × modalidades; la cuota se escribe
  a la semana, el total suma inscripción + todas las cuotas + certificación, y
  el mensaje explica el calendario de pagos y Cobranza. Vive en `planes.mjs` y
  lo prueba `tests/unit/entrega-semanal.spec.ts`.
- **Varios alumnos de prueba** → `alumnosPrueba: [{ "email", "password" }]` en
  `entrega.local.json`: una fila por alumno, con su nivel y su matrícula. Con un
  solo `alumnoEmail`, la matrícula es la de ese alumno, no la del primero de la base.
- **Oferta solo informativa** (`CONFIG.ofertaPublica`, en los clones que la
  declaran) → los planes atendidos por WhatsApp y el catálogo de licenciaturas
  se nombran en la funcionalidad y en «Lo que ya ve tu prospecto».
- **Sin eslogan** → no se imprimen comillas vacías; el pie lleva el nombre.

## La regla del dominio

El script **aborta** si `CONFIG.dominio` está vacío o apunta a `vercel.app`,
`netlify.app`, `localhost` y similares.

Un documento de entrega oficial con una URL provisional envejece mal: el cliente
lo guarda, lo reenvía a su equipo, y meses después el enlace ya no existe. Si el
dominio todavía no está listo, **el paso es conectar el dominio**, no generar el
documento con una dirección temporal.

## Qué SÍ va en el documento: la página de Infraestructura

Va justo después de "Tu plataforma", en el mismo estilo. Es la página que
necesitará cualquier técnico que en el futuro dé soporte al cliente:

- **Correo de tus cuentas**: correo, contraseña y dónde entrar (Outlook, Gmail o
  Yahoo; con un correo de dominio propio no se inventa la dirección)
- Dominio, registrador (GoDaddy), **cuenta de GoDaddy con su contraseña** y a
  dónde apunta el DNS (Vercel)
- Dirección pública de la plataforma
- Proyecto de Supabase: ref, URL del proyecto, URL del panel de control y
  **cuenta de Supabase con su contraseña**
- Nota fija: *las llaves de servicio y la contraseña de la base de datos se
  entregan por canal seguro, nunca por chat*

**Las cuentas van con su contraseña desde el 11-sep-2026** (antes iban por canal
seguro). Son del cliente, porque lo que se le entrega es su dominio y su
Supabase, y sin ellas no puede renovar el dominio ni entrar a su base de datos.
Solo van en el PDF: el mensaje de WhatsApp dice que están ahí, sin repetirlas.

Fuera de las cuentas, todo lo que imprime es una dirección o un identificador público. De
`.env.local` solo se usa `NEXT_PUBLIC_SUPABASE_URL`; la anon key (o, si falta, la
service_role) se usa para leer lo publicado en el panel (`site_config`), y la
service_role para contar filas del inventario y leer el nombre y el precio de
los cursos publicados. Ninguna llega al documento.

## Qué NO va en el documento

Por política de entrega, nunca se incluye:

- Llaves de servicio, `service_role`, anon key ni contraseñas de base de datos
- El access token de Supabase (`sbp_…`), aunque se tenga a mano: abre la cuenta
  entera sin contraseña ni segundo factor
- Credenciales de Vercel: el hosting se queda en MEV
- Datos del repositorio de código ni identificadores internos de Vercel
  (project id, team id)
- Recomendaciones de cambiar contraseñas

**El generador lo hace cumplir.** Si `entrega.local.json` trae algo con forma de
access token (`sbp_…`), llave (`sb_secret_…`, un JWT anon o service_role),
cadena de conexión `postgresql://…@` o token de GitHub en cualquier campo,
también en un `password`, aborta y nombra el campo sin repetir el valor. Cada
cuenta de `cuentas` acepta solo `email` y `password`: un `accessToken` de más
también aborta, igual que una contraseña que siga con el marcador `••••` del
ejemplo. Lo prueba `tests/unit/entrega-cuentas.spec.ts`.

## Referencia visual

Toma el logo y la paleta de `CONFIG` del cliente, así que cada documento sale con
su propia marca. La superficie del papel es **siempre clara** aunque el sitio sea
dark mode: las bandas usan el color primario y los acentos el de acento, con el
contraste del texto calculado sobre cada fondo.
