-- ============================================================================
-- MIGRACIÓN: "Personalizar mi página" (F1) — overrides de CONFIG en la BD
-- ============================================================================
-- Hoy todo lo que identifica a una escuela (logo, colores, textos del hero,
-- precios) vive en src/lib/config.ts y cambiarlo exige tocar código y volver a
-- desplegar. Con esto el ADMIN lo edita desde su panel y el cambio aplica sin
-- redeploy.
--
-- ARQUITECTURA (no negociable):
--   config.ts (defaults)  ⟵ deep-merge ⟵  public.site_config.data (overrides)
--     └── getSiteConfig() [server-only, unstable_cache con tag 'site-config']
--
-- INVARIANTE: ~144 clientes clonan la plantilla. Con la tabla vacía o
-- inexistente la app renderiza IDÉNTICA a hoy: `data = '{}'` no pisa nada y
-- getSiteConfig() cae a CONFIG si la tabla falta. Todo aquí es aditivo.
--
-- FILA ÚNICA: el CHECK (id = 1) cierra la puerta a un segundo juego de
-- overrides entre los que el deep-merge tendría que "elegir". El servidor
-- hace UPSERT sobre id = 1 y punto.
--
-- OVERRIDES PARCIALES en JSONB y no una columna por campo: CONFIG tiene
-- decenas de claves anidadas (colores.*, landing.*, precios.*) y cada clave
-- nueva del config sería un ALTER TABLE en 144 bases. Con JSONB la tabla no
-- cambia cuando cambia el config; solo se guarda lo que el admin tocó.
--
-- RLS: SELECT para anon y authenticated porque la landing PÚBLICA (sin sesión)
-- necesita leer logo/colores/textos. NO hay política de escritura:
-- INSERT/UPDATE/DELETE solo con service role desde la API del admin, que
-- valida el payload antes de guardar. Nada de esto es secreto —es lo mismo que
-- ya se ve en el HTML de la landing—, así que abrir la lectura no fuga nada;
-- abrir la escritura sí sería dejar que cualquier visitante cambie el logo.
--
-- BUCKET `branding` PÚBLICO: el logo lo pinta un <img src> en la landing sin
-- sesión, así que necesita URL pública (como 'avatares'). 2 MB y solo
-- imágenes: es un logo, no un PDF. Escritura solo service role (sin política de
-- INSERT para roles públicos): el archivo lo sube la API tras validar tipo y
-- tamaño.
--
-- IDEMPOTENTE: IF NOT EXISTS + DROP POLICY IF EXISTS + ON CONFLICT DO NOTHING.
-- Re-ejecutable. Conexión DIRECTA puerto 5432, NUNCA el pooler 6543.
--
-- Si el DDL sobre storage.objects falla con "must be owner of table objects",
-- crear la política desde el Dashboard (Storage → Policies) con el mismo
-- USING — es la misma limitación de ownership que documentan F2
-- (20260819130000) y el módulo de Cursos. El bloque de public.site_config sí
-- aplica con cualquier rol dueño del schema public.
--
-- ESPEJOS: supabase/schema.sql, supabase/schema-01-tablas.sql y
-- scripts/schema.sql llevan la tabla + política + GRANT. El bucket NO va en
-- scripts/schema.sql: ese instalador no lleva ni una línea de storage (ningún
-- bucket lo crea; hoy los crea A MANO el operador en el pre-vuelo, ver
-- scripts/README.md, "Workflow de cliente nuevo", paso 2). Para un cliente
-- legacy lo crea esta migración.
-- ============================================================================

-- ── Tabla de overrides ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_config (
  -- Fila única (ver encabezado).
  id          INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Overrides PARCIALES de CONFIG (src/lib/config.ts). '{}' = sin cambios.
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Quién guardó por última vez. SET NULL: borrar al admin no borra la config.
  updated_by  UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- ── RLS: lectura pública, escritura solo service role ───────────────────────
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- USING (true) no consulta ninguna tabla, así que no hay recursión posible
-- (regla del equipo: ninguna política hace SELECT a su propia tabla en USING).
DROP POLICY IF EXISTS "site_config: lectura abierta" ON public.site_config;
CREATE POLICY "site_config: lectura abierta" ON public.site_config
  FOR SELECT TO anon, authenticated
  USING (true);

-- Sin políticas de escritura A PROPÓSITO: con RLS activa y ninguna política de
-- INSERT/UPDATE/DELETE, PostgREST rechaza toda escritura de anon y
-- authenticated. Solo el service role (que salta la RLS) escribe.
GRANT SELECT ON public.site_config TO anon, authenticated;

-- ── Bucket público `branding` (el logo que sube el admin) ───────────────────
-- ON CONFLICT DO NOTHING: si el operador ya lo creó a mano en el pre-vuelo, se
-- respeta tal cual.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 2097152,
        ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Lectura pública del bucket. Escritura SOLO service role: no hay política de
-- INSERT/UPDATE/DELETE para anon ni authenticated, así que ni un admin con
-- sesión sube directo desde el navegador — pasa por la API, que valida tipo y
-- tamaño antes de escribir.
DROP POLICY IF EXISTS "branding: lectura abierta" ON storage.objects;
CREATE POLICY "branding: lectura abierta" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'branding');

-- ── Verificación manual (no altera nada) ────────────────────────────────────
--   SELECT id, data, updated_at FROM public.site_config;
--   SELECT polname FROM pg_policy WHERE polrelid = 'public.site_config'::regclass;
--   SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'branding';
--   SELECT polname FROM pg_policy
--    WHERE polrelid = 'storage.objects'::regclass AND polname LIKE 'branding:%';
