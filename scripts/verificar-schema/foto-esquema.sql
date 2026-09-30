-- Foto normalizada del esquema: una línea por objeto, «tipo|clave|definición».
-- La usa comparar-instaladores.mjs para comparar dos bases armadas por caminos
-- distintos (supabase/schema.sql, scripts/schema.sql, migraciones). Solo lee el
-- catálogo: no escribe nada. Cubre `public` y lo de `storage` que crea el repo
-- (buckets y políticas de storage.objects).
--
-- Los cuerpos de función se comparan sin comentarios `--` y con los espacios
-- colapsados: dos copias del mismo código con otros comentarios son la misma
-- función; un cambio de lógica, no.
\pset tuples_only on
\pset format unaligned
\pset footer off
WITH
tablas AS (
  SELECT 'tabla|' || c.relname || '|kind=' || c.relkind::text || ' rls=' || c.relrowsecurity || ' force=' || c.relforcerowsecurity AS l
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S')
),
columnas AS (
  SELECT 'columna|' || c.relname || '.' || a.attname || '|' || format_type(a.atttypid, a.atttypmod)
         || ' notnull=' || a.attnotnull
         || ' default=' || coalesce(pg_get_expr(d.adbin, d.adrelid), '')
         || ' identity=' || a.attidentity::text || ' generated=' || a.attgenerated::text AS l
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m') AND a.attnum > 0 AND NOT a.attisdropped
),
restricciones AS (
  SELECT 'restriccion|' || c.relname || '.' || k.conname || '|' || pg_get_constraintdef(k.oid, true) AS l
  FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
),
indices AS (
  SELECT 'indice|' || i.tablename || '.' || i.indexname || '|' || i.indexdef AS l
  FROM pg_indexes i WHERE i.schemaname = 'public'
),
funciones AS (
  SELECT 'funcion|' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')|'
         || 'returns=' || pg_get_function_result(p.oid)
         || ' lang=' || l.lanname
         || ' secdef=' || p.prosecdef
         || ' vol=' || p.provolatile::text
         || ' config=' || coalesce(array_to_string(p.proconfig, ','), '')
         || ' body=' || md5(btrim(regexp_replace(regexp_replace(p.prosrc, '--[^\n]*', '', 'g'), '\s+', ' ', 'g'))) AS l
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'
),
permisos_funcion AS (
  SELECT 'exec|' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')|'
         || coalesce((SELECT string_agg(g, ',' ORDER BY g) FROM (
              SELECT CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS g
              FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
              WHERE a.privilege_type = 'EXECUTE'
                AND (a.grantee = 0 OR pg_get_userbyid(a.grantee) IN ('anon','authenticated','service_role'))) x), '') AS l
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
),
disparadores AS (
  SELECT 'trigger|' || c.relname || '.' || t.tgname || '|' || pg_get_triggerdef(t.oid, true) || ' enabled=' || t.tgenabled::text AS l
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal AND (n.nspname = 'public' OR (n.nspname = 'auth' AND c.relname = 'users'))
),
politicas AS (
  SELECT 'politica|' || p.schemaname || '.' || p.tablename || '.' || p.policyname || '|'
         || p.permissive || ' ' || p.cmd || ' roles=' || array_to_string(p.roles, ',')
         || ' using=' || coalesce(p.qual, '') || ' check=' || coalesce(p.with_check, '') AS l
  FROM pg_policies p
  WHERE p.schemaname = 'public' OR (p.schemaname = 'storage' AND p.tablename = 'objects')
),
permisos_tabla AS (
  SELECT 'grant|' || g.table_name || '.' || g.grantee || '|' || string_agg(g.privilege_type, ',' ORDER BY g.privilege_type) AS l
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public' AND g.grantee IN ('anon','authenticated','service_role','PUBLIC')
  GROUP BY g.table_name, g.grantee
),
permisos_columna AS (
  -- Solo las columnas con un permiso que la tabla NO da entero: es lo que
  -- dibuja una lista blanca por columnas (D22d, site_config).
  SELECT 'grantcol|' || cp.table_name || '.' || cp.grantee || '.' || cp.privilege_type || '|'
         || string_agg(cp.column_name, ',' ORDER BY cp.column_name) AS l
  FROM information_schema.column_privileges cp
  WHERE cp.table_schema = 'public' AND cp.grantee IN ('anon','authenticated','service_role','PUBLIC')
    AND NOT EXISTS (SELECT 1 FROM information_schema.role_table_grants g
                    WHERE g.table_schema = cp.table_schema AND g.table_name = cp.table_name
                      AND g.grantee = cp.grantee AND g.privilege_type = cp.privilege_type)
  GROUP BY cp.table_name, cp.grantee, cp.privilege_type
),
vistas AS (
  SELECT 'vista|' || c.relname || '|' || md5(pg_get_viewdef(c.oid, true)) AS l
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
),
tipos AS (
  SELECT 'tipo|' || t.typname || '|' || coalesce((SELECT string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid = t.oid), t.typtype::text) AS l
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype IN ('e','d','c')
    AND NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.reltype = t.oid)
),
buckets AS (
  SELECT 'bucket|' || b.id || '|public=' || coalesce(b.public::text, '') || ' limite=' || coalesce(b.file_size_limit::text, '')
         || ' mime=' || coalesce(array_to_string(b.allowed_mime_types, ','), '') AS l
  FROM storage.buckets b
)
-- Una definición de varias líneas (CHECK, política) queda en una sola.
SELECT regexp_replace(l, '\s+', ' ', 'g') FROM (
  SELECT l FROM tablas UNION ALL SELECT l FROM columnas UNION ALL SELECT l FROM restricciones
  UNION ALL SELECT l FROM indices UNION ALL SELECT l FROM funciones UNION ALL SELECT l FROM permisos_funcion
  UNION ALL SELECT l FROM disparadores UNION ALL SELECT l FROM politicas UNION ALL SELECT l FROM permisos_tabla
  UNION ALL SELECT l FROM permisos_columna UNION ALL SELECT l FROM vistas UNION ALL SELECT l FROM tipos
  UNION ALL SELECT l FROM buckets
) x ORDER BY 1;
