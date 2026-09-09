# Personalizar mi página (F1)

## 1. Qué es y para quién

El **ADMIN** de la escuela entra a `/admin/configuracion` ("Personalizar mi página" en el menú) y
cambia, sin tocar código ni pedir un redeploy: **logo** claro y oscuro (se suben ahí, van al bucket
`branding`); **colores**, con 12 paletas curadas (`src/lib/site-config-paletas.ts`) y ajustes
avanzados token por token con validador de contraste que avisa qué par no llega a AA; los **textos
de la landing** (hero, situaciones, programas, transformación, proceso, testimonios, beneficios,
FAQ, cierre); los **precios** —inscripción, certificaciones y, por modalidad, `mensualidad` y
`activa`—; y **contacto y redes** (WhatsApp, teléfono, correos, Facebook, Instagram). Se publica al
instante: guardar escribe la fila y purga la caché en la misma petición. El **SECRETARIO** solo ve
(el `GET` lo deja pasar con `puedeEditar: false`; `PUT` y `DELETE` son solo ADMIN).

**Invariante que no se negocia:** con la tabla vacía —o inexistente— la app es idéntica a la
plantilla. `mergeSiteConfig(CONFIG, {})` es deep-equal a `CONFIG`, `config.ts` sigue siendo la
fuente por defecto y el onboarding de un cliente nuevo se personaliza igual que hoy. Son ~144
clientes clonando esto: la personalización es aditiva o no es.

## 2. Cómo funciona

`config.ts` da los defaults; la fila única `public.site_config` (`id = 1`, `data` JSONB) da los
overrides; `getSiteConfig()` los fusiona en el servidor y cachea la lectura con `unstable_cache`
bajo el tag `site-config`. El layout inyecta las variables CSS y monta `<SiteConfigProvider>` con
el recorte público; los Server Components llaman a `getSiteConfig()` y los Client Components a
`useSiteConfig()`. Guardar desde el admin llama a `revalidateSiteConfig()`, que hace
`revalidateTag('site-config')` **y** `revalidatePath('/', 'layout')` — sin lo segundo la landing
prerenderizada se queda con el logo viejo hasta el próximo deploy.

```
  src/lib/config.ts (defaults)
            ├── deep-merge ⟵ public.site_config.data (JSONB, fila id=1)
            ▼
   getSiteConfig()          [server-only · unstable_cache tag 'site-config']
            ├── layout.tsx ──► CSS vars + themeColor + <SiteConfigProvider>
            ├── Server Components / rutas API
            └── <SiteConfigProvider> ──► useSiteConfig()  [Client Components]

   PUT /api/admin/configuracion ─► upsert id=1 ─► revalidateTag + revalidatePath('/','layout')
```

**Editable**: identidad (nombre, nombreCompleto, tagline, CCT), logos, los 12 tokens de color,
contacto, redes, los textos de la landing, los tres precios canónicos y `modalidades`. La lista
exacta es `CLAVES_EDITABLES` en `src/lib/site-config-core.ts` — única fuente, no la copies a mano.

**NO editable en F1, a propósito**: `modo`, `niveles`, `prefijoMatricula`, `dominio`, `urlBase`,
`licenciaturas.*`, `pagos.*`, `cursosIngreso.*`, `diploma.*`, `documentosRequeridos` y
`landing.mostrarCatalogoCursos`. Eso es cambiar el producto, no la marca: arrastra migraciones,
rutas o lógica de cobro que un override en la BD no puede acompañar.

**Regla "claves editables solo vía `CLAVES_EDITABLES`"**: para volver editable una clave nueva hay
que (a) agregarla a la whitelist —comprobada en compilación contra `CONFIG` vía `RutasHoja`, así un
typo no compila—, (b) darle descriptor en el catálogo `CAMPOS` de `site-config-campos.ts` (sección,
etiqueta, límites) y (c) si es arreglo, darle normalizador en `ELEMENTOS_ARREGLO`, o el merge la
rechaza siempre (fail-closed). El editor y la API la leen de ahí; no hay una segunda lista.

## 3. Instalación en un cliente NUEVO

La tabla, su política de SELECT y el `GRANT` ya vienen en los tres instaladores
(`scripts/schema.sql`, `supabase/schema.sql`, `supabase/schema-01-tablas.sql`): nada que tocar en
el código. Lo único aparte es el **bucket `branding`** (público, 2 MB, `png/jpg/webp/svg`; lectura
pública, escritura solo service role), porque `scripts/schema.sql` no crea ni un bucket:

- lo crea el operador a mano en el pre-vuelo junto con los otros 8 (`scripts/README.md`, "Workflow
  de cliente nuevo", paso 2; `SETUP.md` paso 9), **o**
- se corre `supabase/migrations/20260908120000_site_config.sql` desde el SQL Editor, que lo inserta
  con `ON CONFLICT DO NOTHING`.

## 4. Cliente LEGACY (F-Flota, fuera de este PR)

Un cliente ya desplegado no tiene ni tabla ni bucket. `getSiteConfig()` lo tolera (degrada a
defaults y reintenta a lo sumo cada minuto). Para encenderle el editor:

1. Correr `supabase/migrations/20260908120000_site_config.sql` en su Supabase por **conexión
   directa, puerto 5432 — nunca el pooler 6543**. Si el DDL sobre `storage.objects` responde *"must
   be owner of table objects"*, crear esa política desde el Dashboard (Storage → Policies) con el
   mismo `USING (bucket_id = 'branding')`; el bloque de `public.site_config` sí aplica.
2. Verificar el bucket: `SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'branding';`
   → público y 2097152.
3. Portar el código de la plantilla a su repo y redesplegar.
4. **Antes de tocar nada**, con la tabla vacía, abrir su sitio y comprobar que se ve idéntico. Si
   algo cambió, el problema es el port, no la personalización.

> **Aviso**: `hero_titulo`, `hero_highlight` y `hero_subtitulo` existían en `config.ts` pero la
> landing **no las leía** (claves muertas). Si ese cliente las personalizó en su día con un texto
> que hoy no se ve, al portar la landing de F3 empezarán a pintarse. Revísalas antes del deploy.

## 5. Restaurar

En el editor, **"Restaurar diseño original"** (`DELETE /api/admin/configuracion`): deja
`data = '{}'` y vacía el bucket `branding` — primero la fila, después los archivos, para no dejar
nunca la landing apuntando a un logo ya borrado. A mano, si hiciera falta:
`UPDATE public.site_config SET data = '{}'::jsonb WHERE id = 1;`, borrar los objetos del bucket
desde el Dashboard y después forzar una petición al sitio para regenerar la landing (el SQL no
purga la caché de Next; eso solo lo hace la API).

## 6. Decisiones de diseño que no hay que "arreglar"

- **Alias legacy de precios** (`certificacion_secundaria`, los `*_3meses_*`, `plan3mMensualidad`…):
  solo se derivan del canónico **cuando el override está presente**. Un cliente puede tenerlos
  divergentes a propósito en su `config.ts`; normalizarlos siempre rompería el invariante.
- **`logo` / `logoOscuro` son exclusivos de la ruta de subida**: el `PUT` de `/configuracion` los
  ignora y repone los de la fila, para que el editor no pise con su estado viejo un logo subido en
  otra pestaña.
- **SVG y WebP se rasterizan a PNG**: un SVG es código y el bucket es público (abrir la URL directa
  lo ejecutaría en ese origen), y el `<Image>` de react-pdf del recibo solo lee PNG y JPEG.
- **`activa: false` es alcance comercial, no académico**: oculta el plan en la landing, el registro
  y las altas nuevas, pero **no** cambia la ventana de un alumno ya inscrito
  (`src/lib/modalidades.ts`) — le cerraría materias ya pagadas a mitad del programa.
- **La paleta "Original" no escribe colores, los borra** (calca `CONFIG.colores` y el cliente pudo
  salir de fábrica con otros), y por eso mismo se exenta del 4.5:1: llevan meses en producción.
- **La landing conserva sus hex literales** hasta que el admin cambie la paleta de verdad
  (`esPaletaPersonalizada` en `LandingClient.tsx`). Sin cambio, pixel-idéntica.

## 7. Auditoría RLS

- `public.site_config`: RLS activa y **una sola** política, `SELECT TO anon, authenticated USING
  (true)`. La landing pública la lee sin sesión y ahí no hay nada secreto: es lo que ya viaja en el HTML.
- **Sin política de escritura**: con RLS activa y ninguna de INSERT/UPDATE/DELETE, PostgREST rechaza
  toda escritura de `anon` y `authenticated`. Solo el service role, desde la API que valida antes.
- `storage.objects` para `branding`: `SELECT` filtrado por `bucket_id = 'branding'`, sin escritura;
  ni un admin con sesión sube directo desde el navegador.
- Ninguna política hace `SELECT` a su propia tabla en el `USING` (regla del equipo): sin recursión.

Commits en `feat/editor-personalizacion`: `023ab56` (tabla + bucket), `7ffa8f1` (merge y provider),
`1f0b9e7` (paletas y contraste), `efe82e1` / `6bb89bc` (textos de la landing), `b1cf20d` (API del
editor y subida de logo), `cbb56ca` (precios y modalidades con fuente única).
