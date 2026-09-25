-- ============================================================================
-- MIGRACIÓN: guardas de «Corregir plan de estudio» (Bug 231)
-- ============================================================================
-- Sube a la plantilla dos endurecimientos hechos en el port de MEDERI
-- (commit a65f601 del clon del cliente) sobre 20260817120000:
--
--   1. corregir_plan_estudio() rechaza una corrección que NO cambia nada
--      ('sin_cambios'). Antes: el mismo plan pasaba, BORRABA las notas del
--      alumno y dejaba un evento vacío (antes = después) en la bitácora.
--      La comparación va DESPUÉS del FOR UPDATE (sobre la fila candada) y
--      ANTES de los candados y de cualquier escritura.
--   2. alumno_plan_eventos: REVOKE ALL a authenticated antes del GRANT SELECT.
--      El GRANT solo AGREGA; si el rol ya traía INSERT/UPDATE/DELETE (default
--      privileges de Supabase sobre public), seguían vivos. Hoy los frena la
--      RLS (no hay política de escritura), pero la bitácora debe quedar
--      cerrada también por privilegios, no por una sola capa.
--
-- La tercera guarda (el id de la URL debe ser un ALUMNO) vive en la ruta
-- POST /api/admin/alumnos/[id]/corregir-plan, no aquí.
--
-- Solo CREATE OR REPLACE + REVOKE/GRANT: idempotente, sin tocar datos.
-- Un solo bloque (regla 19). Conexión DIRECTA puerto 5432, NUNCA el 6543.
-- ============================================================================

BEGIN;

-- ── 1. corregir_plan_estudio con 'sin_cambios' ──────────────────────────────
CREATE OR REPLACE FUNCTION public.corregir_plan_estudio(
  p_alumno    UUID,
  p_nivel     TEXT,
  p_carrera   TEXT,
  p_modalidad TEXT,
  p_actor     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_antes   RECORD;
  v_candado TEXT;
  v_notas   INTEGER := 0;
BEGIN
  SELECT id, matricula, nivel, carrera, modalidad
    INTO v_antes
    FROM public.alumnos
   WHERE id = p_alumno
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'candado', 'no_existe');
  END IF;

  -- Sin cambios: el plan pedido es el mismo que ya tiene. No se borran notas
  -- ni se escribe un evento vacío en la bitácora (Bug 231).
  IF v_antes.nivel     IS NOT DISTINCT FROM p_nivel
     AND v_antes.carrera   IS NOT DISTINCT FROM p_carrera
     AND v_antes.modalidad IS NOT DISTINCT FROM p_modalidad THEN
    RETURN jsonb_build_object('ok', false, 'candado', 'sin_cambios');
  END IF;

  v_candado := public.candado_corregir_plan(p_alumno);
  IF v_candado IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'candado', v_candado);
  END IF;

  WITH borradas AS (
    DELETE FROM public.notas_alumno WHERE alumno_id = p_alumno RETURNING id
  )
  SELECT COUNT(*) INTO v_notas FROM borradas;

  UPDATE public.alumnos
     SET nivel     = p_nivel,
         carrera   = p_carrera,
         modalidad = p_modalidad
   WHERE id = p_alumno;

  INSERT INTO public.alumno_plan_eventos
    (alumno_id, tipo, nivel_antes, carrera_antes, modalidad_antes,
     nivel_despues, carrera_despues, modalidad_despues, notas_borradas, actor)
  VALUES
    (p_alumno, 'correccion_plan', v_antes.nivel, v_antes.carrera, v_antes.modalidad,
     p_nivel, p_carrera, p_modalidad, v_notas, p_actor);

  RETURN jsonb_build_object(
    'ok', true,
    'matricula', v_antes.matricula,
    'notas_borradas', v_notas,
    'antes',   jsonb_build_object('nivel', v_antes.nivel, 'carrera', v_antes.carrera, 'modalidad', v_antes.modalidad),
    'despues', jsonb_build_object('nivel', p_nivel, 'carrera', p_carrera, 'modalidad', p_modalidad)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.corregir_plan_estudio(uuid, text, text, text, uuid)  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.corregir_plan_estudio(uuid, text, text, text, uuid)  TO service_role;

-- ── 2. Bitácora: solo SELECT para authenticated ─────────────────────────────
DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.alumno_plan_eventos FROM authenticated';
    EXECUTE 'GRANT SELECT ON public.alumno_plan_eventos TO authenticated';
  END IF;
END
$g$;

COMMIT;

NOTIFY pgrst, 'reload schema';
