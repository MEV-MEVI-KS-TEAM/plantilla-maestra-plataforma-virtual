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
| `.env.local` en la raíz | Lo mismo que usa la app (`vercel env pull .env.local`). De aquí salen el inventario de contenido y la URL del proyecto de Supabase. Sin él, el documento sale sin inventario y sin proyecto de Supabase. |

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

## De dónde sale cada dato

Casi todo se lee solo. **No hay que capturar dos veces lo que ya está en el
config**, porque un documento de entrega que contradice a la plataforma es peor
que no tenerlo.

| Dato | Origen |
|---|---|
| Nombre, dominio, colores, logo | `src/lib/config.ts` |
| Niveles, modalidades, precios | `src/lib/config.ts` |
| Inscripción y mensualidad **por nivel** | `precios.inscripcion<Nivel>` y `precios.<nivel>_<n>meses_normal`, las mismas claves que usa el registro. Un cliente con precios diferenciados los cobra bien en la plataforma; sin consultarlas, el documento anunciaba otra cosa |
| Licenciaturas, cursos de ingreso | `src/lib/config.ts` |
| Materias, semanas, preguntas, matrícula | consulta real a Supabase vía `.env.local` |
| Nombre del admin y contraseñas | `entrega.local.json` (ignorado por git) |
| Cuentas del cliente con su contraseña: correo, Supabase y GoDaddy (Infraestructura) | `entrega.local.json` → `cuentas`: `{ "correo": { "email", "password" }, "supabase": {…}, "godaddy": {…} }`. En MEV salen de la ficha de `credenciales-clientes` (`outlook_*`, `supabase_*`, `godaddy_*`) |
| Dominio y URL de la plataforma (Infraestructura) | `CONFIG.dominio` |
| Registrador del dominio (Infraestructura) | `entrega.local.json` → `registrador`; si falta, **GoDaddy** |
| Proyecto de Supabase: ref, URL y panel (Infraestructura) | `NEXT_PUBLIC_SUPABASE_URL` de `.env.local` (o `supabaseUrl` en `entrega.local.json` si no hay `.env.local`). El ref es el subdominio; el panel es `https://supabase.com/dashboard/project/<ref>`. |

Si no hay `.env.local` o le faltan credenciales, el inventario se omite y el
resto del documento se genera igual. La página de Infraestructura avisa en
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
- **Inscripción por nivel** (`inscripcion: {secundaria, preparatoria}`) → una
  columna por nivel. También acepta el número plano de siempre.
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
`.env.local` solo se usa `NEXT_PUBLIC_SUPABASE_URL`; la service_role se lee
únicamente para contar filas del inventario y nunca llega al documento.

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
