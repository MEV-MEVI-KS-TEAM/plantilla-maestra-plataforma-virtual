-- ============================================================================
-- D8 — «ACTIVAR SEGÚN LA FICHA» (Bloque D, obs-b; decisiones 11, 12 y 6)
-- ============================================================================
-- EL PROBLEMA. El registro público crea la inscripción con 0 meses y sin acceso
-- total (no cobra: el prospecto todavía no pagó). Cuando la escuela cobra, la
-- pantalla empujaba a «+ Abrir mes» aunque la ficha del curso fuera de PAGO
-- ÚNICO (se abría el mes 1 de un curso que se vendió completo), y «Asignar»
-- sobre una inscripción que ya existe responde 409.
--
-- LA DECISIÓN (Kevin, D0 11–12 y 6):
--   · Una función SQL NUEVA, curso_activar_segun_ficha(p_inscripcion_id), que
--     abre lo que dice la ficha HOY, con la MISMA regla del catálogo y de
--     «Asignar» (curso_regla_apertura, C3b):
--       pago único (solo inscripción > 0)  → ACCESO TOTAL
--       mensual o sin precio (0/0)          → MES 1
--   · Solo para una inscripción «POR ACTIVAR»: activa, sin acceso total, con 0
--     meses y SIN eventos de acceso en la bitácora (nunca se le abrió ni se le
--     cerró nada). Cualquier otra se abre con «+ Abrir mes» / «Abrir todo».
--   · Admin Y secretario (decisión 6): nace con es_staff().
--   · Deja UN evento en la bitácora: 'abrir_todo' o 'abrir_mes', con
--     detalle.origen = 'activar_segun_ficha', la regla, los precios de la ficha
--     y el actor. No toca el CHECK de tipos.
--   · p_regla_esperada: lo que la pantalla le dijo a quien activa ('total' o
--     'mes1'). Si alguien cambió el precio en medio, 40001 y nada: la
--     confirmación de «abre TODO» no se puede saltar con una ficha que cambió.
--
-- SOLO LEE FUNCIONES DE C3b (curso_regla_apertura, curso_tope_meses); no
-- redefine ninguna. No cambia políticas ni el candado: la foto de
-- curso_ventana_limite es idéntica antes y después (cluster scratch).
--
-- IDEMPOTENTE Y RE-EJECUTABLE. En transacción. Requiere C3b (y D7b para que el
-- resto de la apertura también sea del secretario).
-- Aplicar por conexión directa o pooler en MODO SESIÓN (5432, NUNCA 6543).
-- ============================================================================

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.curso_inscripciones') IS NULL THEN
    RAISE EXCEPTION 'Falta el módulo de cursos. Corre antes scripts/migracion-cursos-diplomados.sql.';
  END IF;
  IF to_regclass('public.curso_inscripcion_eventos') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B4 (20260730150000_b4_constancia_y_eventos.sql).';
  END IF;
  IF to_regprocedure('public.curso_regla_apertura(numeric,numeric)') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'curso_inscripciones'
                       AND column_name = 'acceso_total') THEN
    RAISE EXCEPTION 'Falta la migración C3b (20260926120000_c3b_acceso_total_cursos.sql).';
  END IF;
  IF to_regprocedure('public.es_staff()') IS NULL
     OR pg_get_functiondef('public.es_staff()'::regprocedure) !~* 'lower\s*\(\s*rol\s*\)' THEN
    RAISE EXCEPTION 'public.es_staff() falta o no normaliza el rol (LOWER). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
END
$preflight$;


CREATE OR REPLACE FUNCTION public.curso_activar_segun_ficha(
  p_inscripcion_id UUID,
  p_regla_esperada TEXT DEFAULT NULL
)
RETURNS TABLE (regla TEXT, acceso_total BOOLEAN, meses_desbloqueados INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_curso  UUID;
  v_estado TEXT;
  v_meses  INTEGER;
  v_total  BOOLEAN;
  v_ins    NUMERIC;
  v_men    NUMERIC;
  v_regla  TEXT;
  v_tope   INTEGER;
BEGIN
  -- Admin y secretario (D0 decisión 6): con la sesión de quien activa.
  IF NOT public.es_staff() THEN
    RAISE EXCEPTION 'Solo el personal de la escuela (administración o secretaría) puede activar un curso.'
      USING ERRCODE = '42501';
  END IF;

  SELECT ci.curso_id, ci.estado, ci.meses_desbloqueados, ci.acceso_total
    INTO v_curso, v_estado, v_meses, v_total
    FROM public.curso_inscripciones ci
   WHERE ci.id = p_inscripcion_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF v_estado <> 'activa' THEN
    RAISE EXCEPTION
      'No se puede activar una inscripción %. Reactívala primero (estado = activa).',
      v_estado USING ERRCODE = '22023';
  END IF;

  -- «Por activar»: nunca tuvo acceso. Si ya se le abrió (o cerró) algo, la
  -- ficha de HOY ya no dice qué le toca: eso lo decide quien cobra, a mano.
  -- (Un doble clic cae aquí: el primero ya dejó su evento.)
  IF v_total OR COALESCE(v_meses, 0) > 0 OR EXISTS (
       SELECT 1 FROM public.curso_inscripcion_eventos e
        WHERE e.inscripcion_id = p_inscripcion_id
          AND e.tipo IN ('abrir_mes', 'cerrar_mes', 'abrir_todo', 'quitar_acceso_total')) THEN
    RAISE EXCEPTION
      'Esta inscripción ya tuvo acceso: ábrela con «+ Abrir mes» o «Abrir todo». Recarga la pantalla si no lo ves.'
      USING ERRCODE = '40001';
  END IF;

  SELECT c.precio_inscripcion, c.precio_mensualidad INTO v_ins, v_men
    FROM public.cursos c WHERE c.id = v_curso;
  v_regla := public.curso_regla_apertura(v_ins, v_men);
  IF p_regla_esperada IS NOT NULL AND p_regla_esperada <> v_regla THEN
    RAISE EXCEPTION
      'La ficha del curso cambió: hoy abre %, no %. Recarga la pantalla y vuelve a confirmar.',
      CASE v_regla WHEN 'total' THEN 'TODO el curso (pago único)' ELSE 'el mes 1' END,
      CASE p_regla_esperada WHEN 'total' THEN 'todo el curso' ELSE 'el mes 1' END
      USING ERRCODE = '40001';
  END IF;

  IF v_regla = 'total' THEN
    UPDATE public.curso_inscripciones ci SET acceso_total = true WHERE ci.id = p_inscripcion_id;
    INSERT INTO public.curso_inscripcion_eventos
      (inscripcion_id, tipo, meses_antes, meses_despues, detalle, actor)
    VALUES (p_inscripcion_id, 'abrir_todo', 0, 0,
            jsonb_build_object('origen', 'activar_segun_ficha', 'regla', v_regla, 'acceso_total', true,
                               'precio_inscripcion', v_ins, 'precio_mensualidad', v_men),
            auth.uid());
    RETURN QUERY SELECT v_regla, true, 0;
    RETURN;
  END IF;

  -- Mes 1: el mismo tope que «+ Abrir mes». Un curso sin módulos no tiene mes 1.
  v_tope := public.curso_tope_meses(v_curso);
  IF v_tope < 1 THEN
    RAISE EXCEPTION
      'Este curso todavía no tiene módulos: no hay un mes 1 que abrir. Agrega contenido primero.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.curso_inscripciones ci SET meses_desbloqueados = 1 WHERE ci.id = p_inscripcion_id;
  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, meses_antes, meses_despues, detalle, actor)
  VALUES (p_inscripcion_id, 'abrir_mes', 0, 1,
          jsonb_build_object('origen', 'activar_segun_ficha', 'regla', v_regla,
                             'precio_inscripcion', v_ins, 'precio_mensualidad', v_men),
          auth.uid());
  RETURN QUERY SELECT v_regla, false, 1;
END;
$$;

COMMENT ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) IS
  'D8: abre lo que dice la ficha HOY (curso_regla_apertura: pago único → acceso total; '
  'mensual o sin precio → mes 1) a una inscripción POR ACTIVAR (activa, sin acceso total, '
  '0 meses y sin eventos de acceso). Staff (admin o secretario). Un evento con '
  'detalle.origen = activar_segun_ficha, regla, precios y actor.';

REVOKE ALL ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) FROM PUBLIC;
DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_activar_segun_ficha(UUID, TEXT) TO service_role';
  END IF;
END
$grants$;

NOTIFY pgrst, 'reload schema';

COMMIT;
