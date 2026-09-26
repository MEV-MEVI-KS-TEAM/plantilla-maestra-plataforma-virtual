-- ============================================================================
-- D7b — EL SECRETARIO TAMBIÉN ABRE (Bloque D, decisión 6 de Kevin, 26-sep-2026)
-- ============================================================================
-- LA DECISIÓN. El secretario (usuarios.rol = 'secretario', es_staff()) puede,
-- igual que el admin:
--   · asignar cursos con la regla de la ficha (curso_inscribir, y a todos:
--     curso_inscribir_todos), abrir un mes (curso_abrir_mes), abrir el curso
--     completo (curso_abrir_todo) y cobrar abriendo el mes
--     (curso_registrar_pago con p_abrir_mes);
--   · corregir: cerrar un mes (curso_cerrar_mes) y quitar el acceso total
--     (curso_quitar_acceso_total).
-- SIGUE SIENDO SOLO DEL ADMIN (no se tocan aquí): cambiar el estado o cancelar
-- una inscripción (curso_cambiar_estado), borrar módulos (curso_borrar_modulo)
-- y emitir constancias (curso_emitir_constancia), además de lo que se decide en
-- las rutas (precios y fichas, Personalizar, borrar pagos, borrar inscripciones,
-- «Corregir plan», alta y baja de staff).
--
-- CADA EVENTO YA GUARDA SU ACTOR. Las siete funciones escriben en
-- curso_inscripcion_eventos con actor = auth.uid() (C3b/B4): la bitácora dice
-- quién abrió, sea admin o secretario. Esta migración no cambia qué se escribe.
--
-- CÓMO. No se copian los cuerpos: la regla vive en UN solo lugar,
-- public.d7b_staff_abre(), que toma la definición INSTALADA de cada función y
-- cambia SOLO su guarda de permiso (es_admin() → es_staff()) y el mensaje del
-- 42501. Exige la versión vigente (la de C3b, que conoce el acceso total; la de
-- B3 para el cobro) con la guarda exactamente una vez: si no, aborta sin tocar
-- nada y dice qué migración correr (que al final ya re-aplica esta).
--
-- RE-CORRER B3, B4 O C3b DESPUÉS YA NO LE QUITA AL SECRETARIO LA APERTURA: las
-- tres terminan llamando a public.d7b_staff_abre() si existe (epílogo). B2 y B6
-- no redefinen ninguna de estas funciones. El CHECK 16 de
-- scripts/post-setup-check.sql lo comprueba.
--
-- NO CAMBIA NINGUNA POLÍTICA, NINGUNA TABLA NI EL CANDADO: la foto de
-- curso_ventana_limite es idéntica antes y después (probado en el cluster
-- scratch sobre todas las inscripciones del fixture).
--
-- IDEMPOTENTE Y RE-EJECUTABLE. En transacción. Requiere C3b.
-- Aplicar por conexión directa o pooler en MODO SESIÓN (5432, NUNCA 6543).
-- ============================================================================

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.curso_inscripciones') IS NULL THEN
    RAISE EXCEPTION 'Falta el módulo de cursos. Corre antes scripts/migracion-cursos-diplomados.sql.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'curso_inscripciones'
                    AND column_name = 'acceso_total')
     OR to_regprocedure('public.curso_inscribir(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración C3b (20260926120000_c3b_acceso_total_cursos.sql).';
  END IF;
  IF to_regprocedure('public.curso_registrar_pago(uuid,numeric,text,text,text,date,boolean,integer)') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B3 (20260730140000_b3_abrir_mes_y_pagos_curso.sql).';
  END IF;
  -- es_staff() tiene que normalizar el rol: con la versión vieja (rol IN
  -- ('admin','secretario') exacto) un 'SECRETARIO' guardado en mayúsculas no abriría.
  IF to_regprocedure('public.es_staff()') IS NULL
     OR pg_get_functiondef('public.es_staff()'::regprocedure) !~* 'lower\s*\(\s*rol\s*\)' THEN
    RAISE EXCEPTION 'public.es_staff() falta o no normaliza el rol (LOWER). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
END
$preflight$;


-- ════════════════════════════════════════════════════════════════════════════
-- La regla, en UN lugar
-- ════════════════════════════════════════════════════════════════════════════
-- Devuelve cuántas funciones reescribió (0 si ya estaban). La marca «D7b:» en la
-- guarda nueva es la que buscan esta función (para no repetir), el CHECK 16 y
-- las pruebas. Va SIN acentos a propósito: la busca strpos, y una base que
-- guardó el texto con otra codificación no la encontraría.
CREATE OR REPLACE FUNCTION public.d7b_staff_abre()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  r       RECORD;
  v_def   TEXT;
  v_nueva TEXT;
  v_n     INTEGER := 0;
  v_veces INTEGER;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('public.curso_inscribir(uuid,uuid)', 'acceso_total', 'C3b (20260926120000_c3b_acceso_total_cursos.sql)',
       'IF NOT public.es_admin() THEN',
       'IF NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Solo un administrador puede asignar cursos.',
       'Solo el personal de la escuela (administración o secretaría) puede asignar cursos.'),
      ('public.curso_inscribir_todos(uuid,integer,text,boolean)', 'acceso_total', 'C3b (20260926120000_c3b_acceso_total_cursos.sql)',
       'IF NOT public.es_admin() THEN',
       'IF NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Solo un administrador puede asignar cursos.',
       'Solo el personal de la escuela (administración o secretaría) puede asignar cursos.'),
      ('public.curso_abrir_todo(uuid)', 'acceso_total', 'C3b (20260926120000_c3b_acceso_total_cursos.sql)',
       'IF NOT public.es_admin() THEN',
       'IF NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Solo un administrador puede abrir el curso completo.',
       'Solo el personal de la escuela (administración o secretaría) puede abrir el curso completo.'),
      ('public.curso_quitar_acceso_total(uuid,text)', 'acceso_total', 'C3b (20260926120000_c3b_acceso_total_cursos.sql)',
       'IF NOT public.es_admin() THEN',
       'IF NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Solo un administrador puede quitar el acceso total.',
       'Solo el personal de la escuela (administración o secretaría) puede quitar el acceso total.'),
      ('public.curso_abrir_mes(uuid,integer)', 'acceso_total', 'C3b (20260926120000_c3b_acceso_total_cursos.sql)',
       'IF NOT public.es_admin() THEN',
       'IF NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Solo un administrador puede abrir meses.',
       'Solo el personal de la escuela (administración o secretaría) puede abrir meses.'),
      ('public.curso_cerrar_mes(uuid,integer)', 'acceso_total', 'C3b (20260926120000_c3b_acceso_total_cursos.sql)',
       'IF NOT public.es_admin() THEN',
       'IF NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Solo un administrador puede cerrar meses.',
       'Solo el personal de la escuela (administración o secretaría) puede cerrar meses.'),
      ('public.curso_registrar_pago(uuid,numeric,text,text,text,date,boolean,integer)', 'p_abrir_mes', 'B3 (20260730140000_b3_abrir_mes_y_pagos_curso.sql)',
       'IF p_abrir_mes AND NOT public.es_admin() THEN',
       'IF p_abrir_mes AND NOT public.es_staff() THEN  -- D7b: tambien el secretario (decision 6)',
       'Puedes registrar el pago, pero abrir el mes es cosa de un administrador. Regístralo sin abrir mes y pide que lo abran.',
       'Solo el personal de la escuela (administración o secretaría) puede registrar el pago y abrir el mes.')
    ) AS t(firma, exige, corre, guarda_vieja, guarda_nueva, msg_viejo, msg_nuevo)
  LOOP
    IF to_regprocedure(r.firma) IS NULL THEN
      RAISE EXCEPTION 'D7b: falta %.', r.firma;
    END IF;
    v_def := pg_get_functiondef(to_regprocedure(r.firma));
    -- Ya abre el secretario: nada que hacer (idempotente).
    CONTINUE WHEN strpos(v_def, r.guarda_nueva) > 0;

    -- Tiene que ser la versión vigente (C3b para las de acceso total, B3 para el
    -- cobro): las de B3/B4 de abrir/cerrar mes traen la MISMA guarda, pero no
    -- conocen el acceso total. Darle el secretario a una versión revertida
    -- escondería el problema (CHECK 15 en rojo): primero se corre esa migración,
    -- que al final ya llama a esta función.
    IF strpos(v_def, r.exige) = 0 THEN
      RAISE EXCEPTION 'D7b: % no es la versión vigente (falta «%»): corre % y ella misma re-aplica D7b al final.',
        r.firma, r.exige, r.corre;
    END IF;
    v_veces := (length(v_def) - length(replace(v_def, r.guarda_vieja, ''))) / length(r.guarda_vieja);
    IF v_veces <> 1 THEN
      RAISE EXCEPTION 'D7b: % trae % veces la guarda «%» (se esperaba 1): corre % y ella misma re-aplica D7b al final.',
        r.firma, v_veces, r.guarda_vieja, r.corre;
    END IF;
    -- El mensaje se cambia si está una vez. Si no está (una base que guardó los
    -- acentos con otra codificación), la guarda —que es lo que decide— sí cambia.
    v_veces := (length(v_def) - length(replace(v_def, r.msg_viejo, ''))) / length(r.msg_viejo);
    IF v_veces > 1 THEN
      RAISE EXCEPTION 'D7b: % trae % veces el mensaje «%» (se esperaba 1).', r.firma, v_veces, r.msg_viejo;
    END IF;

    v_nueva := replace(replace(v_def, r.guarda_vieja, r.guarda_nueva), r.msg_viejo, r.msg_nuevo);
    -- CREATE OR REPLACE conserva dueño y permisos (GRANT/REVOKE) de la función.
    EXECUTE v_nueva;
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$fn$;

COMMENT ON FUNCTION public.d7b_staff_abre() IS
  'D7b: reescribe la guarda de permiso de las funciones de apertura de cursos '
  '(es_admin → es_staff: el secretario también abre). Idempotente. La llaman esta '
  'migración y el epílogo de B3, B4 y C3b, para que re-correrlas no se la quite al '
  'secretario. Solo para migraciones: sin EXECUTE para anon/authenticated/service_role.';

-- Es una herramienta de migración, no una API.
REVOKE ALL ON FUNCTION public.d7b_staff_abre() FROM PUBLIC;
DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.d7b_staff_abre() FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.d7b_staff_abre() FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.d7b_staff_abre() FROM service_role';
  END IF;
END
$grants$;

DO $aplicar$
DECLARE
  v_n INTEGER;
BEGIN
  v_n := public.d7b_staff_abre();
  RAISE NOTICE 'D7b: % función(es) de apertura ahora aceptan al secretario (0 = ya estaban).', v_n;
END
$aplicar$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── Verificación manual ─────────────────────────────────────────────────────
--   -- Las siete con la guarda nueva:
--   SELECT p.oid::regprocedure, strpos(pg_get_functiondef(p.oid), 'D7b:') > 0 AS staff
--     FROM pg_proc p WHERE p.proname IN ('curso_inscribir','curso_inscribir_todos',
--       'curso_abrir_todo','curso_quitar_acceso_total','curso_abrir_mes',
--       'curso_cerrar_mes','curso_registrar_pago');
--   -- Y las de solo admin, intactas:
--   SELECT strpos(pg_get_functiondef('public.curso_cambiar_estado(uuid,text,text)'::regprocedure),
--                 'IF NOT public.es_admin() THEN') > 0;
