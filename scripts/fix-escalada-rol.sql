-- ============================================================================
-- fix-escalada-rol.sql — Bug 47: escalada de privilegios vía UPDATE de rol
-- ============================================================================
-- SÍNTOMA: cualquier alumno autenticado puede volverse admin con
--   supabase.from('usuarios').update({ rol: 'admin' }).eq('id', suId)
-- CAUSA: el rol `authenticated` tiene UPDATE de TABLA sobre public.usuarios
--   (todas las columnas, incluida `rol`) y la policy RLS de UPDATE solo exige
--   `id = auth.uid()` sin WITH CHECK → el usuario puede reescribir su propio
--   `rol`. En la plantilla MEV ningún flujo legítimo actualiza usuarios/alumnos
--   con la sesión del usuario (perfil/avatar/registro usan service_role).
--
-- FIX: revocar el UPDATE amplio y re-otorgar SOLO las columnas de perfil
--   inofensivas que existan. En alumnos se revoca UPDATE por completo (todas
--   sus columnas son gestionadas por el admin vía service_role).
--
-- Idempotente y reutilizable en cualquier cliente de la plantilla MEV.
-- Aplicar por conexión DIRECTA (puerto 5432) como rol postgres. NUNCA el pooler.
--   psql "postgresql://postgres:<PWD>@db.<REF>.supabase.co:5432/postgres" -f scripts/fix-escalada-rol.sql
--
-- ⚠️ REVISAR POR CLIENTE: si algún cliente permite que el alumno auto-edite
--   alguna columna de `alumnos` con su sesión (no es el caso en la plantilla),
--   re-otorgar esa columna puntual tras correr este script.
-- ============================================================================

DO $$
DECLARE
  -- Columnas de perfil que el usuario SÍ puede auto-editar (allowlist).
  -- Se cubren las variantes de la plantilla (foto_url / avatar_url / full_name).
  safe_cols  text[] := ARRAY['nombre','apellidos','telefono','foto_url','avatar_url','full_name'];
  col        text;
  grant_list text := '';
BEGIN
  -- ── public.usuarios ──────────────────────────────────────────────────────
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    -- 1) Quitar el UPDATE de tabla (cubre el caso grant-de-tabla)
    EXECUTE 'REVOKE UPDATE ON public.usuarios FROM anon, authenticated';

    -- 2) Revocar explícitamente columnas sensibles (cubre el caso grant-de-columna)
    FOR col IN
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'usuarios'
        AND column_name IN ('id','email','rol','created_at')
    LOOP
      EXECUTE format('REVOKE UPDATE (%I) ON public.usuarios FROM anon, authenticated', col);
    END LOOP;

    -- 3) Re-otorgar UPDATE solo sobre las columnas de perfil inofensivas existentes
    FOR col IN
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'usuarios'
        AND column_name = ANY(safe_cols)
      ORDER BY column_name
    LOOP
      grant_list := grant_list || quote_ident(col) || ', ';
    END LOOP;

    IF length(grant_list) > 0 THEN
      grant_list := left(grant_list, length(grant_list) - 2);
      EXECUTE format('GRANT UPDATE (%s) ON public.usuarios TO authenticated', grant_list);
      RAISE NOTICE 'usuarios: UPDATE de authenticated restringido a (%).', grant_list;
    ELSE
      RAISE NOTICE 'usuarios: sin columnas de perfil conocidas; UPDATE queda revocado por completo.';
    END IF;
  END IF;

  -- ── public.alumnos (defensa en profundidad) ──────────────────────────────
  -- La RLS de UPDATE debe ser admin-only (es_admin()); el admin escribe con
  -- service_role. Sin columnas auto-editables → revocar UPDATE por completo.
  IF to_regclass('public.alumnos') IS NOT NULL THEN
    EXECUTE 'REVOKE UPDATE ON public.alumnos FROM anon, authenticated';
    RAISE NOTICE 'alumnos: UPDATE revocado para anon/authenticated (admin usa service_role).';
  END IF;
END $$;

-- ── Verificación (debe: auth_rol=f, columnas usuarios = perfil, alumnos = 0) ──
-- SELECT has_column_privilege('authenticated','public.usuarios','rol','UPDATE') AS auth_rol;
-- SELECT column_name FROM information_schema.role_column_grants
--   WHERE table_name='usuarios' AND grantee='authenticated' AND privilege_type='UPDATE';
-- SELECT count(*) FROM information_schema.role_column_grants
--   WHERE table_name='alumnos' AND grantee='authenticated' AND privilege_type='UPDATE';

-- ── Detección en OTROS clientes (una sola query; hit = vulnerable) ────────────
-- SELECT current_database() AS cliente
-- WHERE has_column_privilege('authenticated','public.usuarios','rol','UPDATE')
--   AND EXISTS (
--     SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
--     WHERE c.relname='usuarios' AND p.polcmd IN ('w','*')
--       AND pg_get_expr(p.polwithcheck, p.polrelid) IS NULL
--   );
