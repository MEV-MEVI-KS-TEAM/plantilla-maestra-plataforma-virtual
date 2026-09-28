-- ============================================================================
-- D22b — COBRANZA SEMANAL: CONDONAR, REGENERAR Y PLAN A MEDIDA SON DEL ADMIN
-- (Bloque D; decisión 5 y K5 de Kevin, 28-sep-2026)
-- ============================================================================
-- EL PROBLEMA. Las cuatro funciones del calendario semanal
-- (registrar_cuota_semanal, condonar_semana, generar_calendario_pagos y
-- generar_calendario_por_nivel) tenían EXECUTE para authenticated, y su guardia
-- común, calendario_pagos_autorizado(), dejaba pasar a cualquier sesión con
-- es_staff(). El secretario podía condonar semanas, regenerar el calendario
-- (con una semana 1 posterior, las vencidas dejan de serlo) o fijar un plan a
-- medida con semanas y CUOTA arbitrarias llamando /rest/v1/rpc/… con su propia
-- sesión y la anon key, sin pasar por /api/admin/cobranza. Y registrar un pago
-- a nombre de otra persona (p_registrado_por, p_monto y p_fecha_pago libres).
--
-- LA SOLUCIÓN, en dos capas:
--   1. EXECUTE solo para service_role (K5). La app llama las cuatro SIEMPRE
--      con el service role (api/admin/cobranza/[alumnoId]/route.ts y
--      lib/plan-semanal.ts: alta, registro y «Regenerar»), así que nada
--      legítimo pasa por PostgREST con sesión.
--   2. La guardia común pide es_admin() fuera de service_role. Si una copia
--      vieja de 20260910130000_periodicidad_semanal.sql vuelve a dar el GRANT,
--      el secretario sigue sin poder (el CHECK 25 lo marca en rojo).
-- «Marcar pagada» sigue siendo de todo el personal: la API la ejecuta con el
-- service role después de verifyStaff. Condonar, quitar la condonación,
-- regenerar y el plan a medida los decide verifyAdmin en la misma API.
--
-- Solo cambia privilegios y el cuerpo de la guardia: los cuerpos de las cuatro
-- funciones no se tocan (CREATE OR REPLACE conserva su ACL; la guardia se
-- recrea igual salvo es_staff() → es_admin()). La migración de periodicidad y
-- scripts/schema.sql ya traen las dos capas: una base nueva nace cerrada.
--
-- Aplica a toda base CON cobro semanal instalado (calendario_pagos_autorizado);
-- en una base sin él avisa y no hace nada. Idempotente y transaccional.
-- Conexión en modo sesión (puerto 5432), nunca el pooler 6543 (Bug 228).
-- ============================================================================

BEGIN;

DO $d22b$
DECLARE
  v_fn     TEXT;
  v_firma  REGPROCEDURE;
  v_n      INTEGER;
BEGIN
  IF to_regprocedure('public.calendario_pagos_autorizado()') IS NULL THEN
    RAISE NOTICE 'D22b: esta base no tiene el cobro semanal (no existe calendario_pagos_autorizado()); no hay nada que cerrar.';
    RETURN;
  END IF;

  -- Preflight: la guardia nueva se apoya en es_admin() con S2 (CHECK 22).
  IF to_regprocedure('public.es_admin()') IS NULL THEN
    RAISE EXCEPTION 'D22b: falta public.es_admin() → corre supabase/migrations/20260729121000_fix_s2_es_admin.sql y vuelve a correr esta';
  END IF;
  IF NOT (SELECT p.prosecdef AND p.prosrc ~* 'lower\s*\(\s*rol\s*\)'
            FROM pg_proc p WHERE p.oid = to_regprocedure('public.es_admin()')) THEN
    RAISE EXCEPTION 'D22b: es_admin() sin S2 (LOWER(rol) + SECURITY DEFINER): un admin con el rol en mayúsculas perdería la cobranza → corre supabase/migrations/20260729121000_fix_s2_es_admin.sql (cliente ya desplegado: scripts/fix-s1-s2-roles.sql) y vuelve a correr esta';
  END IF;

  -- 2ª capa: la guardia común, con sesión de usuario, solo deja pasar al admin.
  EXECUTE $guarda$
CREATE OR REPLACE FUNCTION public.calendario_pagos_autorizado()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claims text := current_setting('request.jwt.claims', true);
  v_role   text;
BEGIN
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN TRUE;                              -- conexión directa (psql / migraciones)
  END IF;
  v_role := (v_claims::jsonb ->> 'role');
  IF v_role = 'service_role' THEN RETURN TRUE; END IF;
  RETURN public.es_admin();                   -- D22b: con sesión, solo el admin
END;
$$
$guarda$;

  -- 1ª capa: EXECUTE solo para service_role, en TODAS las firmas de las cuatro
  -- (una sobrecarga vieja o de drift con GRANT a authenticated también se cierra).
  FOREACH v_fn IN ARRAY ARRAY['registrar_cuota_semanal', 'condonar_semana',
                               'generar_calendario_pagos', 'generar_calendario_por_nivel'] LOOP
    v_n := 0;
    FOR v_firma IN
      SELECT p.oid::regprocedure
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = v_fn
    LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_firma);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_firma);
      v_n := v_n + 1;
    END LOOP;
    IF v_n = 0 THEN
      RAISE EXCEPTION 'D22b: falta public.%() pero la guardia del calendario sí existe (cobro semanal a medias) → vuelve a correr supabase/migrations/20260910130000_periodicidad_semanal.sql y después esta', v_fn;
    END IF;
    RAISE NOTICE 'D22b: %() — EXECUTE solo para service_role (% firma/s).', v_fn, v_n;
  END LOOP;

  -- Epílogo: nada quedó abierto.
  IF EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     CROSS JOIN unnest(ARRAY['anon', 'authenticated']) AS r(rol)
     WHERE n.nspname = 'public'
       AND p.proname IN ('registrar_cuota_semanal', 'condonar_semana',
                         'generar_calendario_pagos', 'generar_calendario_por_nivel')
       AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.rol)
       AND has_function_privilege(r.rol, p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'D22b: después del REVOKE, anon o authenticated todavía ejecutan una función del calendario (¿un rol hereda de otro?). Revisa los GRANT a mano.';
  END IF;
  IF (SELECT p.prosrc ~ 'es_staff\s*\(' OR p.prosrc !~ 'es_admin\s*\('
        FROM pg_proc p WHERE p.oid = to_regprocedure('public.calendario_pagos_autorizado()')) THEN
    RAISE EXCEPTION 'D22b: la guardia calendario_pagos_autorizado() no quedó con es_admin().';
  END IF;
  RAISE NOTICE 'D22b: cobranza cerrada — las cuatro funciones solo por el servidor; la guardia pide es_admin() con sesión.';
END
$d22b$;

NOTIFY pgrst, 'reload schema';

COMMIT;
