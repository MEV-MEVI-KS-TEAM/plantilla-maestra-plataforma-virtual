# 🚀 Setup Nuevo Cliente LMS — Tiempo estimado: 2 horas

## Paso 1 — Crear repo desde template (5 min)
1. Ir a github.com/MEV-MEVI-KS-TEAM/plantilla-maestra-plataforma-virtual
2. Clic en "Use this template" → "Create a new repository"
3. Nombre del repo: nombre-cliente-plataforma
4. Clone local: git clone [url]
5. `pnpm install` — este repo usa **pnpm** (hay `pnpm-lock.yaml`). No uses npm.

## Paso 2 — Personalizar cliente (10 min)
Editar SOLO este archivo: src/lib/config.ts
- nombre, nombreCompleto
- whatsapp: `52` + 10 dígitos (12 en total). `whatsappDisplay` se deja vacío: la
  app lo arma a partir del número (Bloque A3)
- email / contactoEmail: el correo PÚBLICO de la escuela (el que ven alumnos y
  landing); el del admin es su usuario, no va aquí
- logo (subir archivo a /public/)
- colores (primary, secondary, accent)
- dominio

## Paso 3 — Supabase nuevo proyecto (30 min)

> El orden respeta dependencias de FK y de funciones. No lo alteres.
> Correr por conexión **directa** (puerto 5432) o por el pooler en **modo sesión**
> (también 5432, usuario `postgres.<ref>`; la directa es solo IPv6), o el SQL
> Editor. **Nunca el 6543** (modo transacción): regla del Bug 228 de mev-tools.
>
> ✅ **LA CADENA COMPLETA ES RE-EJECUTABLE** (desde B8.1): la prueba original se
> hizo con 19 migraciones y las 19 pasaron el replay — dos pasadas limpias
> contra un proyecto Supabase real. `supabase/migrations/` ha crecido desde
> entonces (45 archivos el 29-sep-2026; el número no es estático,
> verificar con `ls supabase/migrations | wc -l`). (Hubo una época
> en que no: B6 amplió dos funciones de ingresos y el replay moría en
> `20260716150000` y `20260717120000` con `cannot change return type` — es el
> Bug 80 del PLAYBOOK; B8.1 lo corrigió con `DROP FUNCTION IF EXISTS` en esas
> dos migraciones. Coherente con `SOLO-CURSOS-ARQUITECTURA.md`.)

1. supabase.com → New project
2. **Schema base** → ejecutar `scripts/schema.sql` completo

   > **Hay DOS instaladores de esquema y no son intercambiables.** Desde
   > `20260819120000_bootstrap_drift_semanas.sql` ya no divergen en columnas,
   > pero siguen sirviendo a rutas distintas:
   >
   > | Archivo | Para qué | Quién lo usa |
   > |---|---|---|
   > | `scripts/schema.sql` | **Línea tradicional.** Se mantiene a mano. | `mev-onboarding.py` (TAREA 3, paso 1), este documento, `INSTRUCCIONES-NUEVO-CLIENTE.md`, `scripts/README.md` |
   > | `supabase/schema.sql` | **Línea Solo-Cursos** y desarrollo local con la cadena de migraciones. | `INSTRUCCIONES-SOLO-CURSOS.md`, `supabase db reset` |
   >
   > **Los dos acaban en la MISMA base** (Bloque E3, 29-sep-2026):
   > - `supabase/schema.sql` solo = aplicar TODAS las migraciones, salvo el módulo
   >   Cursos (que instalan `scripts/migracion-cursos-diplomados.sql` y sus
   >   migraciones). Trae además los 5 buckets base con sus políticas
   >   (`avatars`, `documentos`, `recibos`, `materias`, `branding`).
   > - `scripts/schema.sql` no trae storage (con el rol del onboarding el DDL de
   >   `storage.objects` aborta el script): los buckets llegan con las migraciones
   >   (paso 9).
   > - Con las migraciones encima, los dos caminos dan el mismo catálogo: tablas,
   >   columnas, restricciones, índices, cuerpos de función, políticas, permisos
   >   por columna y buckets.
   >
   > Lo prueba **`scripts/verificar-schema/comparar-instaladores.mjs`** en un
   > Postgres local (ver su README) y lo vigilan, sin Postgres,
   > **`tests/unit/e3-instaladores-equivalentes.spec.ts`** (todo objeto de las
   > migraciones está en `supabase/schema.sql`; UNIQUE de preguntas y documentos;
   > S2; los buckets que crean los instaladores son exactamente los que usa el
   > código) y **`tests/unit/guardian-schema-onboarding.spec.ts`** (todo `CREATE`
   > de las migraciones llega a `scripts/schema.sql`). Si agregas algo a uno, los
   > guardianes te exigen el otro.
   >
   > *Antes del Bloque E3* `supabase/schema.sql` se había quedado atrás en 9
   > puntos (es_admin sin S2 #253, sin `contactado_whatsapp`, sin columnas de
   > licenciatura ni `6_meses_lic`, sin periodicidad semanal, sin
   > `idx_pagos_fecha_pago`, sin los UNIQUE de preguntas y de documentos, CHECK de
   > moneda con otro nombre): sembrar sobre él fallaba con 42P10.
   >
   > *Historia:* hasta ago-2026 `supabase/schema.sql` no traía
   > `semanas.contenido`, `video_url_2` ni `video_url_3`, y usarlo aquí hacía
   > reventar el seed del paso 3 con *column "video_url_2" does not exist*.
   > **Esa advertencia ya no aplica.** Ver **Bug 99** del PLAYBOOK.

3. **Seed de contenido** → ejecutar `scripts/setup.sql`
   ⚠️ **Desde dentro de `scripts/`**, no desde la raíz del repo: usa `\i` con
   rutas relativas al *directorio de trabajo*, así que `psql -f scripts/setup.sql`
   falla con *No such file or directory*. Correcto:
   `cd scripts && psql "$DATABASE_URL" -f setup.sql`
   (En el SQL Editor de Supabase no aplica: ahí se pega el contenido de cada
   archivo por separado.)
   Es el orquestador único del seed (materias, meses, semanas, evaluaciones y las
   preguntas universales: el archivo trae 265 y entran las de las evaluaciones que
   existen). Reemplaza a los antiguos `seed-materias.sql` y
   `distribuir-meses.sql`, que **ya no existen en el repo**.
   Ajustar nombres de materias según el cliente después de sembrar.
   Resultado esperado: 25 materias, 266 preguntas (240 universales + 26 del demo;
   lo avisa el propio `setup.sql`), 592 del quiz semanal.
4. **Admin** → `scripts/create-admin.sql` está **comentado entero** (todo
   el archivo es comentario): es plantilla de referencia, no un script
   ejecutable — correrlo es un no-op. El admin se crea así: Supabase
   Dashboard → Authentication → Add user (con el correo del admin del
   cliente y «Auto Confirm User») y luego, en el SQL Editor (equivale a la
   TAREA 5 de PROMPTS-MAESTROS; la misma receta está en `scripts/README.md`):
   ```sql
   INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
   SELECT id, email, 'Administrador', '<Nombre de la escuela>', 'admin'
     FROM auth.users WHERE email = lower(btrim('<correo del admin>'))
   ON CONFLICT (id) DO UPDATE SET rol = 'admin', email = EXCLUDED.email,
     nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos
   RETURNING id, email, nombre, apellidos, rol;
   ```
   Como el admin se crea después del esquema, el trigger `handle_new_user` ya le creó su fila en `usuarios` (rol `alumno`, nombre vacío): por eso se pisan también nombre y apellidos. Sin nombre, el encabezado del panel y la bitácora muestran el correo del admin. Debe devolver **1 fila** con rol `admin` y el nombre (en psql además sale `INSERT 0 1`); 0 filas = ese correo no está en Auth (la receta ya ignora mayúsculas y espacios). Un apóstrofo en el nombre va doble (`O''Higgins`).
5. **Módulo Cursos y Diplomados** → ejecutar `scripts/migracion-cursos-diplomados.sql`
   (crea 5 tablas `curso_*` + el bucket privado `cursos`). Corre DESPUÉS de schema.sql.
   Si las políticas de storage fallan por ownership, crearlas desde la UI
   (Storage → Policies; ver el comentario del archivo).
6. **Examen final de curso** → ejecutar `supabase/migrations/20260728120000_examen_final_cursos.sql`
   Añade `curso_examen_preguntas` y `curso_examen_resultados` (banco de preguntas
   con RLS solo-admin + resultados). **Obligatorio si se va a usar el examen:** el
   código de `/api/alumno/cursos/[id]/examen/**` ya está en la plantilla y sin estas
   tablas responde error. Tiene preflight y aborta solo si falta el paso 5.
7. **Parches de seguridad (obligatorios)** — correr los cuatro, en este orden:
   - `supabase/migrations/20260729120000_fix_s1_rol_alta.sql`
     Cierra la escalada de rol en el alta (S1). Sin esto, cualquiera puede
     registrarse como `admin` con solo la anon key.
     Lo vigila el CHECK 23 de `scripts/post-setup-check.sql`.
   - `supabase/migrations/20260729121000_fix_s2_es_admin.sql`
     `es_admin()` / `es_staff()` en plpgsql con `LOWER(rol)` y `search_path` (S2).
     Sin esto, un admin con `rol='ADMIN'` en mayúsculas no puede administrar cursos.
     Los dos `schema.sql` ya la traen (desde el Bloque E3 también
     `supabase/schema.sql`, #253): en una instalación nueva es un no-op.
     Lo vigila el CHECK 22 de `scripts/post-setup-check.sql`.
   - `supabase/migrations/20260729122000_fix_portadas_storage_policy.sql`
     Corrige la política del bucket para que el alumno vea las portadas.
     Corre DESPUÉS del paso 5.
   - `supabase/migrations/20260924120000_usuarios_sin_insert_propio.sql`
     Nadie inserta con su sesión en `usuarios` ni en `documentos_alumno` (Bug 220,
     #185): sin esto, un alumno sube un documento ya «verificado» y, donde falte
     el trigger de alta, una cuenta nueva se crea su fila con rol `admin`. Una
     instalación nueva ya lo trae en `schema.sql`; en un cliente ya desplegado es
     el retrofit (idempotente). Lo vigila el CHECK 24.
   > **También en toda base:** después de 7bis corre su **fila 22**
   > (`20260928160000_d22c_postgrest_directo.sql`, D22c): cierra la escritura directa
   > de `pagos` y el directorio del personal por PostgREST. No va en este paso porque
   > las filas 2 y 9 de 7bis corren después y una copia vieja reabriría una parte
   > (CHECK 26 y 27).
   > **Y en toda base, después de desplegar la app de D22d:** su **fila 23**
   > (`20260928170000_d22d_claves_solo_servidor.sql`): la respuesta correcta de los
   > tres exámenes solo la lee el servidor; intentos y respuestas del quiz solo los
   > escribe él, y cada quien lee los suyos. Con la app anterior, el quiz y el
   > examen mensual se quedan sin preguntas (CHECK 28, 29 y 30).
   > **Y en toda base, después de desplegar la app de la R2:** su **fila 25**
   > (`20261008120000_r2_escritura_solo_servidor.sql`): progreso, logros, racha,
   > calificaciones, documentos y contenido solo los escribe el servidor; índices
   > únicos contra los envíos simultáneos del quiz y del examen; `anon` sin
   > escritura. Con la app anterior, «Marcar semana» y el tiempo de estudio dan
   > 500 (CHECK 32, 33 y 34).
   > Para clientes **ya desplegados**, el retrofit equivalente de S1+S2 es
   > `scripts/fix-s1-s2-roles.sql`, y sigue haciendo falta `scripts/fix-escalada-rol.sql`
   > (Bug 47/52): son vectores distintos, hay que correr los dos.
7bis. **Línea Solo-Cursos (diplomados)** — obligatoria si el cliente vende
   diplomados, y **obligatoria también en modo tradicional** si quiere ofrecerlos
   como complemento. Correr en este orden, después del paso 7:

   | Orden | Migración | Qué trae |
   |---|---|---|
   | 1 | `20260716120000_pagos.sql` | tabla `pagos` |
   | 2 | `20260716130000_rol_secretario.sql` | rol acotado. Su `es_staff()` es la misma de S2 (`LOWER(rol)` + `search_path`): correrla después del paso 7 ya no revierte S2 (**D20g**, CHECK 22) |
   | 3 | `20260716140000_bucket_recibos.sql` | bucket de recibos |
   | 4 | `20260716150000_reporte_ingresos.sql` | ingresos por semana/mes |
   | 5 | `20260716160000_estado_cuenta.sql` | estado de cuenta |
   | 6 | `20260717120000_pagos_fecha_pago.sql` | `fecha_pago` editable (Bug 57) |
   | 7 | `20260730120000_b1_fundacion_solo_cursos.sql` | **B1** — columnas de curso, `nivel='diplomado'`, `curso_constancias`, `curso_folio_seq` |
   | 8 | `20260730130000_b2_gate_ventana_cursos.sql` | **B2** — el gate de acceso por mes pagado, en RLS |
   | 9 | `20260730140000_b3_abrir_mes_y_pagos_curso.sql` | **B3** — Abrir Mes + pagos por inscripción |
   | 10 | `20260730150000_b4_constancia_y_eventos.sql` | **B4** — folio consecutivo + bitácora |
   | 11 | `20260730160000_b6_reportes_por_vertical.sql` | **B6** — ingresos programa vs diplomados |
   | 12 | `20260730170000_b7_estado_cuenta_excluye_diplomado.sql` | **B7** — el estado de cuenta ignora a los de diplomado |
   | 13 | `20260730180000_b82_emision_manual_con_actor.sql` | **B8.2** — emisión manual con actor + guard de aprobación |
   | 14 | `20260926120000_c3b_acceso_total_cursos.sql` | **C3b** — pago único = acceso total al asignar; «Asignar» abre acceso con la regla del curso (sin ella, el código de hoy no puede asignar) |
   | 15 | `20260927120000_d7b_secretario_abre_cursos.sql` | **D7b** — el secretario también asigna, abre (mes o todo), cobra abriendo, cierra mes y quita el acceso total; estado y módulos siguen siendo solo del admin (las constancias pasaron al personal con D20b). Re-correr B3/B4/C3b ya no se lo quita (CHECK 16) |
   | 16 | `20260927130000_d8_activar_segun_ficha.sql` | **D8** — «Activar según la ficha»: a una inscripción por activar (registro público, 0 meses) le abre lo que dice la ficha hoy —pago único → todo; mensual o sin precio → mes 1—; admin y secretario (CHECK 17) |
   | 17 | `20260927140000_d16_curso_cobrar.sql` | **D16** — el cobro de cursos con un solo escritor (`curso_cobrar`): pago ligado a la inscripción, con su moneda, el mes que CUBRE e idempotente por `p_pago_id`; abre SOLO si se pide y solo la primera activación, la mensualidad del mes siguiente o el pago único de una ficha de pago único; admin y secretario (CHECK 18) |
   | 18 | `20260928120000_d20a_bitacora_meses_programa.sql` | **D20a** — abrir y cerrar mes del **programa** (Secundaria, Preparatoria, licenciatura) con un solo escritor (`alumno_mover_mes`, solo el servidor): candado de fila, idempotente por operación (el doble clic no mueve dos meses) y bitácora `alumno_mes_eventos` con actor, nombre y rol; la ficha muestra «Último: … · Nombre (Secretario)». **Aplica a TODA escuela**, venda o no diplomados: un cliente nuevo ya la trae en `scripts/schema.sql`; uno ya desplegado la corre aquí (CHECK 19) |
   | 19 | `20260928130000_d20b_constancia_staff.sql` | **D20b** — el secretario también emite constancias (con su sesión; las guardas de B8.2 intactas: sin examen aprobado no hay folio); el folio guarda quién lo emitió (`emitida_por`, nombre y rol) y una inscripción **cancelada** no recibe folio. Re-correr B4 o B8.2 ya no revierte la emisión (prólogo/epílogo) (CHECK 20) |
   | 20 | `20260928140000_d20e_conflicto_pt409.sql` | **D20e** — «alguien lo cambió en medio» (doble clic, otra pestaña, precio o lista que cambió) responde **409** con `PT409` y no con `40001`, que PostgREST reintenta sin fin (la petición se colgaba). Reescribe las funciones instaladas; las migraciones de origen ya lo traen. Aplica a toda base; córrela al final (CHECK 21) |
   | 21 | `20260928150000_d22b_cobranza_solo_admin.sql` | **D22b** — cobranza semanal: condonar, quitar la condonación, regenerar el calendario y el plan a medida son solo del **admin**. Las cuatro funciones del calendario (`registrar_cuota_semanal`, `condonar_semana`, `generar_calendario_pagos`, `generar_calendario_por_nivel`) se ejecutan solo con el service role, y su guardia pide `es_admin()` con sesión: el secretario ya no las llama por `/rest/v1/rpc/…`. «Marcar pagada» sigue siendo de todo el personal (por la API). **Aplica a toda base con cobro semanal** (en las demás avisa y no hace nada): un cliente nuevo ya lo trae en `scripts/schema.sql`; uno ya desplegado la corre aquí, al final (CHECK 25) |
   | 22 | `20260928160000_d22c_postgrest_directo.sql` | **D22c** — por PostgREST nadie escribe `pagos` (sin INSERT/UPDATE/DELETE para `anon`/`authenticated`, ni de tabla ni de columna: toda escritura va por la API con el service role o por funciones `SECURITY DEFINER`); `curso_registrar_pago` (legado) solo con el service role; `registrar_cuota_semanal` con guarda interna (solo el servidor); el trigger de reversión solo toca la semana del pago borrado; `usuarios` y `pagos` se leen **propio o admin**, con techo `RESTRICTIVE` (el secretario ya no lee el directorio del personal ni todos los pagos). **Aplica a TODA base, venda o no diplomados**: un cliente nuevo ya lo trae en `scripts/schema.sql`; uno ya desplegado la corre aquí, **al final** (las filas 2 y 9, si son copias viejas, reabrirían lo que el techo no cubre) (CHECK 26 y 27) |
   | 23 | `20260928170000_d22d_claves_solo_servidor.sql` | **D22d** — la respuesta correcta del examen mensual, del quiz semanal y del examen final de curso solo la lee el servidor: por `/rest/v1` ninguna sesión lee `respuesta_correcta` ni `explicacion` (privilegios por **lista blanca** de columnas), y el alumno y el secretario no ven filas de esos bancos (techo `RESTRICTIVE` solo-admin; la RLS se enciende donde estaba apagada); el ✓/✗ guardado de cada envío del examen de curso (`curso_examen_resultados.respuestas`) tampoco sale con sesión; `intentos_evaluacion` y `quiz_respuestas` solo los escribe el servidor, y cada quien lee solo los suyos (RLS encendida y techo «propio o admin»: con las respuestas ajenas marcadas correctas se sacaba la clave del quiz). Incluye lo de #186 (Bug 221): quien ya lo corrió, la corre encima. **Aplica a TODA base.** ⚠️ **Desplegar la app de D22d ANTES**: con el código anterior, el quiz y el examen mensual se quedan sin preguntas y no guardan, sin avisar. Córrela **al final**: una copia vieja del paso 6 o de un schema reabre los privilegios (CHECK 28, 29 y 30) |
   | 24 | `20260930120000_fix255_ventana_por_posicion.sql` | **#255** — la ventana de cursos cuenta la **posición** del módulo (cuántos `orden` distintos hay por debajo del suyo), no el `orden` crudo: un curso sembrado en base 1 (bancos anteriores al 25-sep-2026) o con huecos ya no abre un módulo menos por mes ni esconde el último; el examen final se abre solo con el curso completo a la vista y el reporte cuenta lo que el alumno ve. En un curso sano (0..N-1) no cambia nada y nadie ve menos (compuerta: si alguien viera menos, aborta sin cambiar nada). Requiere C3b. Va después de la 23 (no toca sus privilegios). Re-correr B2, B6 o C3b ya no la revierte (CHECK 31) |
   | 25 | `20261008120000_r2_escritura_solo_servidor.sql` | **R2** (soporte IVS, 8-oct-2026) — lo que da avance, logros, calificación o acceso solo lo escribe el servidor: sin INSERT/UPDATE/DELETE/TRUNCATE con sesión (de tabla ni de columna) en `progreso_semanas`, `logros_alumno`, `racha_actividad`, `calificaciones`, `intentos_evaluacion`, `quiz_respuestas`, `alumnos`, `documentos_alumno` y `constancias`, ni en el contenido; techo `RESTRICTIVE` «propio o admin» en su lectura; `notas_alumno` sin DELETE; `usuarios` con el UPDATE solo de perfil (Bug 52, que hasta hoy solo traían los instaladores); índices únicos `quiz_respuestas (alumno_id, quiz_id)` e `intentos_evaluacion (alumno_id, evaluacion_id, numero_intento)` (sin ellos, 4 POST simultáneos al quiz daban la clave); `generar_matricula()` solo el servidor; `anon` sin escritura en `public` (salvo el latido, Bug 46). **Aplica a TODA base.** ⚠️ **Desplegar ANTES la app de la R2** (progreso, tiempo y logros con el service role): con la app anterior, «Marcar semana» y el tiempo de estudio dan 500. Si aborta por respuestas o intentos repetidos, su encabezado dice cómo verlos: no borra nada. Córrela **al final** (CHECK 32, 33 y 34) |

   > No hay migración de B5 ni de B7/T1–T3: son cambios de código, no de esquema.

   Para un cliente **Solo-Cursos** (solo diplomados), ver
   **`INSTRUCCIONES-SOLO-CURSOS.md`**: la configuración del modo, el catálogo
   público y los 3 pasos posteriores.

8. **Verificación** → ejecutar `scripts/post-setup-check.sql` (CHECK 1 a 31)
   Reporta ✅/❌ por check. Si todo sale ✅, la plataforma está lista para entregar.
   Sin seed (línea Solo-Cursos) los CHECK 1-6, 9 y 10 salen ❌ a propósito, y el
   CHECK 8 sale ❌ hasta crear el admin.
9. **Buckets de Storage — son 6, los que usa el código** (Bloque E3; lo vigila
   `tests/unit/e3-instaladores-equivalentes.spec.ts`). `scripts/schema.sql` no
   crea ninguno: por la ruta de este documento corre las cuatro migraciones de
   storage (idempotentes; si una política falla por ownership, córrela en el SQL
   Editor), también en una escuela que no corre 7bis:
   `supabase/migrations/20260716140000_bucket_recibos.sql` (`recibos`; es la fila 3
   de 7bis, sin ella «Recibo» del pago da 500),
   `supabase/migrations/20260819130000_cms_contenido_materiales.sql` (`materias`),
   `supabase/migrations/20260908120000_site_config.sql` (`branding`) y
   `supabase/migrations/20260929120000_e3_buckets_de_la_app.sql` (`avatars` y
   `documentos`). `cursos` viene con el paso 5.
   (La ruta de PROMPTS-MAESTROS, TAREA 3.9 A1, corre todas las migraciones y ya
   los trae.) Verificar:

   ```sql
   SELECT id, public, file_size_limit FROM storage.buckets ORDER BY id;
   -- 6 filas: avatars t 5242880 · branding t 2097152 · cursos f 10485760 ·
   --          documentos f 10485760 · materias f 10485760 · recibos f 2097152
   ```

   | Bucket | Privacidad | Límite | Lo crea | Notas |
   |---|---|---|---|---|
   | `avatars` | **público** | 5 MB | `supabase/schema.sql` · `migrations/20260929120000` | foto de perfil del alumno (`src/app/api/alumno/avatar/route.ts`, `getPublicUrl`). Escribe solo el servidor. Antes el schema creaba `avatares`, que nadie usa (Bug 103) |
   | `documentos` | privado | 10 MB | `supabase/schema.sql` · `migrations/20260929120000` | «Mis documentos» del alumno |
   | `recibos` | privado | 2 MB | `supabase/schema.sql` · `migrations/20260716140000` | recibos de pago |
   | `materias` | privado | 10 MB, solo PDF | `supabase/schema.sql` · `migrations/20260819130000` | material por semana; solo admin en storage |
   | `branding` | **público** | 2 MB | `supabase/schema.sql` · `migrations/20260908120000_site_config.sql` | logo que sube el admin desde "Personalizar mi página". El bucket solo guarda **png/jpeg/webp** (sin `image/svg+xml`): el editor acepta SVG a la *entrada*, pero la API lo rasteriza a PNG antes de subir. Escritura solo service role |
   | `cursos` | privado | 10 MB | `scripts/migracion-cursos-diplomados.sql` | portadas y PDF de Cursos y Diplomados |

   > `avatares` y `constancias` ya no se crean: ningún código los usa. En un
   > cliente ya instalado pueden existir; no estorban (no se borran por inercia).
10. Copiar: Project URL, anon key, service_role key

## Paso 4 — Variables de entorno (5 min)
Copiar .env.example → .env.local y llenar con datos de Supabase

## Paso 5 — Probar local (10 min)
`pnpm dev`
- Login como admin
- Crear alumno de prueba
- Abrir mes 1
- Verificar materias disponibles

## Paso 6 — Vercel (15 min)
1. vercel.com → Add New Project
2. Importar repo GitHub del cliente
3. Environment Variables → pegar las 3 variables de .env.local
4. Deploy
5. **Verifica el commit desplegado** (Bloque E3): el deploy de producción tiene
   que traer el código de **D22d-1** (plantilla `fe00225`, #273) o posterior. La
   fila 23 de 7bis (D22d) deja el quiz y el examen mensual sin preguntas con una
   app anterior.
   - El commit desplegado: Vercel → Deployments → el de Production muestra su
     commit; o por la API
     `curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v13/deployments/<dominio-o-url>?teamId=<team>"`
     → `meta.githubCommitSha` (el proyecto vive en un team: sin `teamId` responde 404). Tiene que ser la cabeza de `main` del repo del
     cliente (`git fetch && git rev-parse origin/main`).
   - Que ese commit trae D22d-1. El repo de un cliente nace de la plantilla SIN
     su historia, así que no se compara contra `fe00225`: se busca el código que
     D22d-1 agregó, en el repo del cliente:
     `git cat-file -e <sha-desplegado>:src/lib/evaluaciones/examen-mensual.ts && git cat-file -e <sha-desplegado>:src/lib/quiz/quiz-semana.ts && echo OK`
     (en la plantilla misma sirve `git merge-base --is-ancestor fe00225 <sha> && echo OK`).
   Si no sale OK: actualiza el repo con la plantilla y redeploy desde `main` antes
   de correr la fila 23.

## Paso 7 — Dominio (10 min)
1. Vercel → Settings → Domains → Add
2. Configurar DNS en el registrador del dominio

## Paso 8 — Entrega al cliente (ÚLTIMO PASO, obligatorio)

Con la plataforma ya en producción **y el dominio definitivo conectado**:

```bash
cp scripts/entrega/entrega.local.ejemplo.json entrega.local.json
# …llenar con nombre del admin, correo y contraseñas…
pnpm entrega
```

Genera los dos entregables del cliente:

| Archivo | Qué es |
|---|---|
| `entrega/<NOMBRE>_Entrega_Oficial.pdf` | Documento de entrega con la marca del cliente |
| `entrega/ENTREGA-WHATSAPP.txt` | Mensaje listo para copiar y pegar |

Ambos se arman solos desde `src/lib/config.ts` y de la base: niveles,
modalidades, precios, licenciaturas y conteo real de contenido. **Se adaptan a lo
que el cliente contrató** — un plan o varios, inscripción plana o por nivel, con
licenciaturas o sin ellas.

> ⚠️ **El comando aborta si el dominio no es el definitivo.** No se emite un
> documento oficial con una URL de `vercel.app`: el cliente lo guarda y lo
> reenvía, y meses después el enlace ya no existe. Si el dominio no está listo,
> el paso pendiente es conectarlo.

Detalle completo en `scripts/entrega/README.md`.

## Qué cambiar por cliente
| Archivo | Qué cambiar |
|---|---|
| src/lib/config.ts | Todo |
| public/logo.png | Logo del cliente |
| .env.local | Credenciales Supabase |
| (tras el seed del Paso 3) | Nombres de materias del cliente, por SQL |

## Qué NO tocar
- Toda la lógica de meses/materias
- Panel admin
- Dashboard alumno
- Sistema de logros y badges
- Constancias
