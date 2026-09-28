-- ============================================================================
-- fix-s1-s2-roles.sql — Retrofit de flota para S1 (escalada en el alta) y
--                       S2 (es_admin/es_staff sensibles a mayúsculas)
-- ============================================================================
-- Equivalente standalone de las migraciones:
--   supabase/migrations/20260729120000_fix_s1_rol_alta.sql
--   supabase/migrations/20260729121000_fix_s2_es_admin.sql
--
-- S1 — public.handle_new_user() copiaba raw_user_meta_data->>'rol' al alta.
--   Como la función es SECURITY DEFINER, cualquiera que llame a signUp con
--   options.data.rol = 'admin' se autoproclamaba admin usando solo la anon key.
--   El fix del Bug 47/52 (scripts/fix-escalada-rol.sql) NO cubre este vector:
--   aquél cierra el UPDATE de la columna `rol`; éste cierra el INSERT del alta.
--   Hay que correr LOS DOS.
--
-- S2 — public.es_admin() y public.es_staff() comparaban el rol de forma exacta.
--   Con usuarios.rol = 'ADMIN' el panel de cursos queda muerto. Añadir LOWER()
--   es estrictamente permisivo: nadie pierde acceso, solo dejan de perderlo
--   quienes lo tenían escrito en otra caja.
--
-- Idempotente y reutilizable en cualquier cliente de la plantilla MEV.
-- Solo reemplaza objetos que YA EXISTEN: nunca crea una función que el cliente
-- no tuviera (un cliente sin es_staff() no la gana por correr esto).
--
-- Aplicar como rol postgres por conexión directa (5432) o por el pooler en MODO
-- SESIÓN (también 5432, usuario postgres.<REF>; la directa es solo IPv6), o el
-- SQL Editor. NUNCA el 6543 (modo transacción): regla del Bug 228.
--   psql "postgresql://postgres.<REF>:<PWD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres" \
--        -v ON_ERROR_STOP=1 -f scripts/fix-s1-s2-roles.sql
--
-- ⚠️ Este script NO degrada a nadie. Si un cliente ya tiene cuentas con rol
--   elevado creadas por el vector S1, hay que revisarlas A MANO con la query de
--   auditoría del final: un admin legítimo creado por el panel también lleva el
--   rol en su metadata, así que esa query señala CANDIDATOS, no culpables.
-- ============================================================================

-- ── S1: handle_new_user() con rol fijo ──────────────────────────────────────
DO $outer$
BEGIN
  IF to_regproc('public.handle_new_user') IS NULL THEN
    RAISE NOTICE 'S1: public.handle_new_user() no existe en esta BD; nada que hacer.';
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      BEGIN
        INSERT INTO public.usuarios (id, email, nombre, rol)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
          'alumno'
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $body$;
    $fn$;
    RAISE NOTICE 'S1: handle_new_user() endurecida — el rol del alta es siempre alumno.';
  END IF;
END $outer$;

-- ── S2: es_admin() ──────────────────────────────────────────────────────────
DO $outer$
BEGIN
  IF to_regproc('public.es_admin') IS NULL THEN
    RAISE NOTICE 'S2: public.es_admin() no existe en esta BD; se omite.';
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.es_admin()
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.usuarios
           WHERE id = auth.uid()
             AND LOWER(rol) = 'admin'
        );
      END;
      $body$;
    $fn$;
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated';
    RAISE NOTICE 'S2: es_admin() endurecida (plpgsql + LOWER + search_path).';
  END IF;
END $outer$;

-- ── S2: es_staff() ──────────────────────────────────────────────────────────
DO $outer$
BEGIN
  IF to_regproc('public.es_staff') IS NULL THEN
    RAISE NOTICE 'S2: public.es_staff() no existe en esta BD (cliente anterior al rol SECRETARIO); se omite.';
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.es_staff()
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.usuarios
           WHERE id = auth.uid()
             AND LOWER(rol) IN ('admin', 'secretario')
        );
      END;
      $body$;
    $fn$;
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.es_staff() TO anon, authenticated';
    RAISE NOTICE 'S2: es_staff() endurecida (plpgsql + LOWER + search_path).';
  END IF;
END $outer$;

-- ── Detección en OTROS clientes (una sola query; hit = VULNERABLE a S1) ──────
-- Devuelve una fila si handle_new_user() todavía lee el rol del metadata. Se
-- quitan los comentarios del cuerpo ANTES de buscar: el cuerpo S1 dice
-- «No se lee raw_user_meta_data->>'rol'» en un comentario, y el ILIKE
-- '%raw_user_meta_data%rol%' sobre prosrc crudo marcaba como vulnerable a un
-- cliente YA corregido (verificado el 28-sep-2026). Es la misma regla del CHECK 23.
-- SELECT current_database() AS cliente, 'S1: rol desde metadata' AS hallazgo
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'g'), '--[^\n]*', '', 'g') AS cuerpo) c
--  WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
--    AND (c.cuerpo ~* 'raw_user_meta_data\s*\)?\s*(::\s*jsonb\s*\)?\s*)?(->>?|#>>?)\s*''\{?rol\}?'''
--      OR c.cuerpo ~* 'jsonb_extract_path(_text)?\s*\(\s*(new\s*\.\s*)?raw_user_meta_data\s*(::\s*jsonb\s*)?,\s*''rol''');
-- (Las dos regex del CHECK 23: ->>, ->, #>> '{rol}', con cast ::jsonb o entre
--  paréntesis, y jsonb_extract_path(_text).)
--
-- ── Detección S2 (hit = el panel muere con roles en mayúsculas) ──────────────
-- SELECT current_database() AS cliente, p.proname, 'S2: sin LOWER' AS hallazgo
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND p.proname IN ('es_admin','es_staff')
--    AND p.prosrc NOT ILIKE '%lower(%';
--
-- ── Auditoría post-fix: cuentas elevadas a revisar A MANO (no degradar solas) ─
-- SELECT u.id, u.email, u.rol, au.created_at
--   FROM public.usuarios u
--   JOIN auth.users au ON au.id = u.id
--  WHERE LOWER(u.rol) <> 'alumno'
--  ORDER BY au.created_at DESC;
