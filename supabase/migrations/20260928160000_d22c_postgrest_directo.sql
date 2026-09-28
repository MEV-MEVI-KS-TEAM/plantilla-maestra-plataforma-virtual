-- ============================================================================
-- D22c — POR POSTGREST NADIE ESCRIBE PAGOS NI LEE EL DIRECTORIO DEL PERSONAL
-- (Bloque D; decisiones K1-K4, K6 y K7 de Kevin, 28-sep-2026)
-- ============================================================================
-- EL PROBLEMA. Con su propia sesión y la anon key (pública), por /rest/v1/…:
--   H1. Una sesión de personal INSERTABA en `pagos` sin las validaciones de
--       /api/admin/pagos (concepto, método, mes, fecha) y a nombre de otro
--       (registrado_por libre); el admin además actualizaba y borraba sin pasar
--       por D10. Supabase da ALL a anon/authenticated sobre toda tabla nueva y
--       las políticas «staff registra / admin actualiza / admin elimina» lo
--       permitían.
--   H2. registrar_cuota_semanal deja fijar p_registrado_por, p_monto y
--       p_fecha_pago (D22b ya le quitó el EXECUTE; aquí va la guarda INTERNA, K4).
--   H3. curso_registrar_pago (legado de B3, sin uso desde D16) seguía con
--       EXECUTE para authenticated: otro escritor de `pagos` con monto libre.
--   H4. Borrar un pago suelto de una semana devolvía a 'pendiente' la semana
--       pagada por OTRO pago (el trigger la localizaba por alumno + semana; K6).
--   H5. «usuarios: ver propio perfil» con es_staff(): el secretario leía nombre,
--       correo, teléfono y rol de TODO el personal y de todos los alumnos (K1, K7).
--   H6. «pagos: ver propios» con es_staff(): el secretario leía todos los pagos
--       (su historial le llega por /api/admin/pagos con el service role; K2).
--
-- LA SOLUCIÓN. Privilegios (no dependen del nombre de ninguna política ni del
-- orden de SETUP) + políticas RESTRICTIVE de techo (ninguna permisiva vieja o
-- de drift las ensancha):
--   · pagos: REVOKE INSERT/UPDATE/DELETE/TRUNCATE a authenticated (tabla y
--     columnas) y ALL a anon; SELECT se queda. Las políticas «staff registra»,
--     «admin actualiza» y «admin elimina» quedan inertes para PostgREST y se
--     conservan a propósito (R2).
--   · curso_registrar_pago: EXECUTE solo service_role (todas sus firmas).
--   · registrar_cuota_semanal: 42501 si la llamada trae un JWT que no es de
--     service_role (se inserta en la función instalada; marca «D22c (K4)»).
--   · calendario_pagos_revertir_al_borrar: solo la semana del pago borrado.
--   · usuarios y pagos: SELECT propio o admin + techo RESTRICTIVE.
-- Nada de la app lo usaba con la sesión: toda lectura de filas ajenas y toda
-- escritura de pagos va con el service role o por funciones SECURITY DEFINER
-- (curso_cobrar, curso_emitir_constancia), que se saltan la RLS como dueñas de
-- la tabla (lo comprueba el preflight, R1).
--
-- Aplica a TODA base (venda o no diplomados). Un cliente nuevo ya nace así
-- (scripts/schema.sql, supabase/schema.sql y las migraciones de origen
-- corregidas). Idempotente y transaccional. Córrela AL FINAL de 7bis (fila 22):
-- una copia vieja de B3, rol_secretario o periodicidad corrida después reabre
-- lo que no protegen los techos, y el CHECK 26/27 lo marca. Conexión en modo
-- sesión (5432), nunca el pooler 6543 (Bug 228).
-- ============================================================================

BEGIN;

DO $d22c$
DECLARE
  r        RECORD;
  v_def    TEXT;
  v_i      INTEGER;
  v_firma  REGPROCEDURE;
  v_malas  TEXT;
  v_guarda CONSTANT TEXT :=
$g$-- D22c (K4): quien llama fija p_registrado_por, p_monto y p_fecha_pago, así que
  -- solo el servidor la invoca (service_role, después de verifyStaff en
  -- /api/admin/cobranza) o una conexión directa. Con sesión de usuario, 42501
  -- aunque un GRANT viejo le devuelva EXECUTE a authenticated.
  IF COALESCE(current_setting('request.jwt.claims', true), '') <> ''
     AND (current_setting('request.jwt.claims', true)::jsonb ->> 'role') IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'permiso denegado: registrar_cuota_semanal solo la llama el servidor'
      USING ERRCODE = '42501';
  END IF;
  $g$;
BEGIN
  -- ── Preflight ─────────────────────────────────────────────────────────────
  -- es_admin() y es_staff() con S2: las políticas nuevas llaman es_admin(); si no
  -- fuera SECURITY DEFINER, la política de usuarios que la llama entraría en
  -- recursión (Bug 16).
  FOR r IN SELECT f FROM unnest(ARRAY['es_admin()', 'es_staff()']) AS f LOOP
    IF to_regprocedure('public.' || r.f) IS NULL
       OR NOT (SELECT p.prosecdef AND p.prosrc ~* 'lower\s*\(\s*rol\s*\)'
                 FROM pg_proc p WHERE p.oid = to_regprocedure('public.' || r.f)) THEN
      RAISE EXCEPTION 'D22c: public.% falta o no tiene S2 (LOWER(rol) + SECURITY DEFINER) → corre supabase/migrations/20260729121000_fix_s2_es_admin.sql (cliente ya desplegado: scripts/fix-s1-s2-roles.sql) y vuelve a correr esta', r.f;
    END IF;
  END LOOP;
  IF to_regclass('public.usuarios') IS NULL THEN
    RAISE EXCEPTION 'D22c: falta public.usuarios → corre primero scripts/schema.sql (o supabase/schema.sql)';
  END IF;
  -- FORCE RLS haría que las funciones SECURITY DEFINER (curso_cobrar, la constancia)
  -- también pasaran por las políticas nuevas y dejaran de funcionar.
  SELECT string_agg(c.relname, ', ') INTO v_malas
    FROM pg_class c WHERE c.oid IN (to_regclass('public.pagos'), to_regclass('public.usuarios')) AND c.relforcerowsecurity;
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22c: % tiene FORCE ROW LEVEL SECURITY; las funciones SECURITY DEFINER dejarían de ver/escribir. Quítalo (ALTER TABLE … NO FORCE ROW LEVEL SECURITY) o revisa a mano antes de correr esta', v_malas;
  END IF;
  -- R1: toda función SECURITY DEFINER que lea o escriba pagos/usuarios tiene que
  -- ser del dueño de esas tablas, o de un rol con BYPASSRLS o superusuario; si no,
  -- las políticas nuevas la frenarían (p. ej. curso_cobrar o la constancia).
  SELECT string_agg(DISTINCT p.oid::regprocedure::text, ', ') INTO v_malas
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles o ON o.oid = p.proowner
    JOIN pg_class t ON t.oid IN (to_regclass('public.pagos'), to_regclass('public.usuarios'))
   WHERE n.nspname = 'public' AND p.prosecdef
     AND p.prosrc ~ ('\m' || t.relname || '\M')
     AND p.proowner <> t.relowner AND NOT (o.rolbypassrls OR o.rolsuper);
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22c: estas funciones SECURITY DEFINER no son del dueño de pagos/usuarios ni tienen BYPASSRLS: %. Con las políticas nuevas dejarían de funcionar. Revisa sus dueños (ALTER FUNCTION … OWNER TO <dueño de la tabla>) y vuelve a correr esta', v_malas;
  END IF;

  -- ── H1 + H6: pagos ─────────────────────────────────────────────────────────
  IF to_regclass('public.pagos') IS NOT NULL THEN
    REVOKE ALL ON public.pagos FROM anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pagos FROM authenticated;
    -- También los privilegios POR COLUMNA (un GRANT de columna sobrevive al REVOKE de tabla).
    FOR r IN SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = 'public.pagos'::regclass AND a.attnum > 0 AND NOT a.attisdropped LOOP
      EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.pagos FROM anon, authenticated', r.attname);
    END LOOP;
    GRANT SELECT ON public.pagos TO authenticated;
    GRANT ALL    ON public.pagos TO service_role;

    -- K2: propio o admin, más el techo.
    DROP POLICY IF EXISTS "pagos: ver propios" ON public.pagos;
    CREATE POLICY "pagos: ver propios" ON public.pagos
      FOR SELECT USING (alumno_id = auth.uid() OR public.es_admin());
    DROP POLICY IF EXISTS "pagos: techo propio o admin (D22c)" ON public.pagos;
    CREATE POLICY "pagos: techo propio o admin (D22c)" ON public.pagos
      AS RESTRICTIVE FOR SELECT TO anon, authenticated
      USING (alumno_id = auth.uid() OR public.es_admin());
    RAISE NOTICE 'D22c: pagos — sin INSERT/UPDATE/DELETE por PostgREST; SELECT propio o admin, con techo.';
  END IF;

  -- ── H3: curso_registrar_pago, todas sus firmas ─────────────────────────────
  FOR v_firma IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'curso_registrar_pago'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_firma);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_firma);
    RAISE NOTICE 'D22c: % — EXECUTE solo para service_role.', v_firma;
  END LOOP;

  -- ── K4: guarda interna de registrar_cuota_semanal ──────────────────────────
  -- Se inserta en la función INSTALADA (misma técnica que D7b y D20e: CREATE OR
  -- REPLACE conserva el ACL), justo antes de su guardia de rol. Idempotente por
  -- la marca «D22c (K4)».
  FOR r IN
    SELECT p.oid, p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'registrar_cuota_semanal'
  LOOP
    IF strpos(r.prosrc, 'D22c (K4)') > 0 THEN CONTINUE; END IF;
    v_def := pg_get_functiondef(r.oid);
    v_i := strpos(v_def, 'IF NOT public.calendario_pagos_autorizado() THEN');
    IF v_i = 0 THEN
      RAISE EXCEPTION 'D22c: % no tiene la guardia esperada (IF NOT public.calendario_pagos_autorizado() THEN); revísala a mano', r.oid::regprocedure;
    END IF;
    EXECUTE substr(v_def, 1, v_i - 1) || v_guarda || substr(v_def, v_i);
    RAISE NOTICE 'D22c: % — guarda interna: solo el servidor.', r.oid::regprocedure;
  END LOOP;

  -- ── K6: el trigger solo revierte la semana del pago borrado ────────────────
  IF to_regprocedure('public.calendario_pagos_revertir_al_borrar()') IS NOT NULL THEN
    EXECUTE $t$
CREATE OR REPLACE FUNCTION public.calendario_pagos_revertir_al_borrar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.concepto = 'cuota_semanal' AND OLD.numero_semana IS NOT NULL THEN
    UPDATE public.calendario_pagos
       SET estado = 'pendiente', pago_id = NULL, updated_at = NOW()
     WHERE alumno_id = OLD.alumno_id
       AND numero_semana = OLD.numero_semana
       AND estado = 'pagado'
       AND (pago_id IS NULL OR pago_id = OLD.id);   -- D22c (K6)
  END IF;
  RETURN OLD;
END;
$$
$t$;
    RAISE NOTICE 'D22c: calendario_pagos_revertir_al_borrar — solo la semana del pago borrado.';
  END IF;

  -- ── H5: usuarios (K1 + K7) ─────────────────────────────────────────────────
  DROP POLICY IF EXISTS "usuarios: ver propio perfil" ON public.usuarios;
  CREATE POLICY "usuarios: ver propio perfil"
    ON public.usuarios FOR SELECT
    USING (id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "usuarios: techo propio o admin (D22c)" ON public.usuarios;
  CREATE POLICY "usuarios: techo propio o admin (D22c)"
    ON public.usuarios AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (id = auth.uid() OR public.es_admin());
  RAISE NOTICE 'D22c: usuarios — SELECT propio o admin, con techo.';

  -- ── Epílogo: nada quedó abierto ────────────────────────────────────────────
  IF to_regclass('public.pagos') IS NOT NULL THEN
    SELECT string_agg(ro.rol || ' ' || pv.p, ', ') INTO v_malas
      FROM unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
     CROSS JOIN unnest(ARRAY['INSERT', 'UPDATE', 'DELETE']) AS pv(p)
     WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ro.rol)
       AND (has_table_privilege(ro.rol, 'public.pagos', pv.p)
            OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, 'public.pagos', pv.p)));
    IF v_malas IS NOT NULL THEN
      RAISE EXCEPTION 'D22c: tras el REVOKE, pagos sigue abierto (%): ¿un rol hereda de otro? Revisa los GRANT a mano.', v_malas;
    END IF;
  END IF;
  SELECT string_agg(DISTINCT p.proname || ' → ' || ro.rol, ', ') INTO v_malas
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   CROSS JOIN unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
   WHERE n.nspname = 'public' AND p.proname = 'curso_registrar_pago'
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ro.rol)
     AND has_function_privilege(ro.rol, p.oid, 'EXECUTE');
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22c: curso_registrar_pago sigue abierta (%).', v_malas;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'registrar_cuota_semanal' AND strpos(p.prosrc, 'D22c (K4)') = 0) THEN
    RAISE EXCEPTION 'D22c: registrar_cuota_semanal quedó sin la guarda interna.';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND permissive = 'RESTRICTIVE'
         AND policyname IN ('usuarios: techo propio o admin (D22c)', 'pagos: techo propio o admin (D22c)'))
     <> CASE WHEN to_regclass('public.pagos') IS NULL THEN 1 ELSE 2 END THEN
    RAISE EXCEPTION 'D22c: falta un techo RESTRICTIVE.';
  END IF;
  RAISE NOTICE 'D22c: listo — pagos solo por el servidor; usuarios y pagos, propio o admin.';
END
$d22c$;

NOTIFY pgrst, 'reload schema';

COMMIT;
