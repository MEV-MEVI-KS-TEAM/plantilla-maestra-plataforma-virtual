-- ============================================================================
-- D16 — COBRAR UN CURSO: UN SOLO ESCRITOR (Bloque D, #207-5; decisiones 1, 2,
-- 3, 5, 6 y 10)
-- ============================================================================
-- EL PROBLEMA. El único cobro con pantalla era el modal del PROGRAMA de la
-- ficha: un cobro de curso capturado ahí contaba como ingreso del programa y,
-- como «Mensualidad» con mes, entraba en «meses con pago» (Bug 73 por la UI).
-- La ruta de curso (curso_registrar_pago, B3) no la llamaba ninguna pantalla,
-- guardaba el pago sin moneda y abría el mes POR DEFECTO.
--
-- LA DECISIÓN (Kevin, D0):
--   · Un escritor NUEVO, curso_cobrar (decisión 3). B3 queda intacta: cambiar
--     la firma de curso_registrar_pago dejaría dos sobrecargas al re-correr B3.
--   · Concepto nuevo 'curso_pago_unico' (decisión 2); los de siempre:
--     curso_inscripcion, curso_mensualidad y curso_otro. La vertical va por la
--     FK pagos.curso_inscripcion_id (sin columnas nuevas ni CHECK de concepto).
--   · pagos.mes_desbloqueado = el mes que el pago CUBRE (decisión 5).
--   · ¿Pagar abre? Opción 3 acotada (decisión 1): SOLO si quien cobra lo pide
--     (p_abrir) y SOLO en tres casos, revalidados aquí contra la ficha:
--       - la primera activación de una inscripción «por activar» (el registro
--         público, 0 meses): curso_activar_segun_ficha (D8), con la regla que
--         la pantalla vio (p_regla_esperada);
--       - la mensualidad del mes SIGUIENTE al último abierto (meses + 1):
--         curso_abrir_mes;
--       - el pago único de un curso cuya ficha ES de pago único: curso_abrir_todo.
--     Nunca abre todo un curso mensual. p_meses_esperados es OBLIGATORIO para
--     abrir: lo que la pantalla vio; si cambió en medio, 40001 y nada.
--   · Admin Y secretario cobran y abren (decisión 6, nueva): es_staff().
--   · Guarda la moneda y el tipo de cambio del pago.
--   · El pago y su apertura quedan en la MISMA transacción: el evento de la
--     bitácora y el pago comparten created_at (now() = inicio de la
--     transacción). Así se vinculan, sin UPDATE a la bitácora.
--
-- IDEMPOTENCIA (doble envío). p_pago_id lo genera la pantalla una vez por
-- cobro. La fila de la inscripción se bloquea (FOR UPDATE) ANTES de buscar el
-- pago: un segundo envío con el mismo p_pago_id espera al primero y, cuando
-- éste confirma, ve el pago y devuelve «repetido» sin cobrar ni abrir otra vez.
--
-- UNA INSCRIPCIÓN CON PAGOS NO SE BORRA (red de seguridad de D11). D11 cuenta
-- los pagos y luego borra, en dos llamadas: un cobro que entra en medio (con la
-- fila bloqueada por curso_cobrar) quedaba con la FK en NULL (ON DELETE SET
-- NULL) y contaba como ingreso del PROGRAMA. Un trigger BEFORE DELETE lo impide
-- en la base (23001), también en la cascada al borrar un CURSO. Al borrar al
-- ALUMNO sus pagos se van con él (cascada): ahí no estorba.
--
-- SOLO LLAMA a funciones de C3b/D8 (curso_regla_apertura, curso_tope_meses,
-- curso_abrir_mes, curso_abrir_todo, curso_activar_segun_ficha); no redefine
-- ninguna. No toca curso_registrar_pago, políticas ni el candado.
--
-- IDEMPOTENTE Y RE-EJECUTABLE. En transacción. Requiere B1, B4, la moneda del
-- pago (#198), C3b, D7b y D8.
-- Aplicar por conexión directa o pooler en MODO SESIÓN (5432, NUNCA 6543).
-- ============================================================================

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.curso_inscripciones') IS NULL THEN
    RAISE EXCEPTION 'Falta el módulo de cursos. Corre antes scripts/migracion-cursos-diplomados.sql.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'pagos' AND column_name = 'curso_inscripcion_id') THEN
    RAISE EXCEPTION 'Falta la migración B1 (20260730120000_b1_fundacion_solo_cursos.sql): pagos.curso_inscripcion_id.';
  END IF;
  IF to_regclass('public.curso_inscripcion_eventos') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B4 (20260730150000_b4_constancia_y_eventos.sql).';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'pagos' AND column_name = 'moneda')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'pagos' AND column_name = 'tipo_cambio_aplicado') THEN
    RAISE EXCEPTION 'Falta la migración de la moneda del pago (20260910120000_moneda_pago.sql).';
  END IF;
  IF to_regprocedure('public.curso_regla_apertura(numeric,numeric)') IS NULL
     OR to_regprocedure('public.curso_abrir_todo(uuid)') IS NULL
     OR to_regprocedure('public.curso_abrir_mes(uuid,integer)') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración C3b (20260926120000_c3b_acceso_total_cursos.sql).';
  END IF;
  IF to_regprocedure('public.curso_activar_segun_ficha(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración D8 (20260927130000_d8_activar_segun_ficha.sql).';
  END IF;
  IF strpos(pg_get_functiondef(to_regprocedure('public.curso_abrir_mes(uuid,integer)')), 'NOT public.es_staff() THEN  -- D7b:') = 0 THEN
    RAISE EXCEPTION 'Falta la migración D7b (20260927120000_d7b_secretario_abre_cursos.sql): el secretario no podría abrir al cobrar.';
  END IF;
  IF to_regprocedure('public.es_staff()') IS NULL
     OR pg_get_functiondef(to_regprocedure('public.es_staff()')) !~* 'lower\s*\(\s*rol\s*\)' THEN
    RAISE EXCEPTION 'public.es_staff() falta o no normaliza el rol (LOWER). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
END
$preflight$;


CREATE OR REPLACE FUNCTION public.curso_cobrar(
  p_inscripcion_id  UUID,
  p_pago_id         UUID,
  p_concepto        TEXT,
  p_monto           NUMERIC,
  p_metodo_pago     TEXT,
  p_mes             INTEGER DEFAULT NULL,
  p_abrir           BOOLEAN DEFAULT false,
  p_meses_esperados INTEGER DEFAULT NULL,
  p_regla_esperada  TEXT    DEFAULT NULL,
  p_moneda          TEXT    DEFAULT 'MXN',
  p_tipo_cambio     NUMERIC DEFAULT NULL,
  p_referencia      TEXT    DEFAULT NULL,
  p_fecha_pago      DATE    DEFAULT NULL
)
RETURNS TABLE (pago_id UUID, repetido BOOLEAN, abrio TEXT, meses_desbloqueados INTEGER, acceso_total BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alumno   UUID;
  v_curso    UUID;
  v_estado   TEXT;
  v_meses    INTEGER;
  v_total    BOOLEAN;
  v_prev_ins UUID;
  v_ins      NUMERIC;
  v_men      NUMERIC;
  v_regla    TEXT;
  v_abrio    TEXT := NULL;
  v_tope     INTEGER;
  v_prev     RECORD;
BEGIN
  -- Admin y secretario (decisión 6): cobrar Y abrir. Con la sesión de quien cobra.
  IF NOT public.es_staff() THEN
    RAISE EXCEPTION 'Solo el personal de la escuela puede cobrar.' USING ERRCODE = '42501';
  END IF;

  IF p_pago_id IS NULL THEN
    RAISE EXCEPTION 'Falta el identificador del cobro. Recarga la página y vuelve a intentarlo.' USING ERRCODE = '22023';
  END IF;
  IF p_concepto IS NULL OR p_concepto NOT IN ('curso_pago_unico', 'curso_inscripcion', 'curso_mensualidad', 'curso_otro') THEN
    RAISE EXCEPTION 'Concepto de cobro de curso inválido: %. Usa curso_pago_unico, curso_inscripcion, curso_mensualidad o curso_otro.', p_concepto
      USING ERRCODE = '22023';
  END IF;
  -- NUMERIC admite 'NaN' y en Postgres NaN es MAYOR que todo: se rechaza aparte.
  IF p_monto IS NULL OR p_monto = 'NaN'::numeric OR p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.' USING ERRCODE = '22023';
  END IF;
  IF p_metodo_pago IS NULL OR UPPER(BTRIM(p_metodo_pago)) NOT IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO') THEN
    RAISE EXCEPTION 'Método de pago inválido. Usa EFECTIVO, TRANSFERENCIA, TARJETA u OTRO.' USING ERRCODE = '22023';
  END IF;
  IF p_moneda IS NULL OR p_moneda !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Moneda inválida: %. Usa el código ISO de tres letras (MXN, USD…).', p_moneda USING ERRCODE = '22023';
  END IF;
  IF p_tipo_cambio IS NOT NULL AND (p_tipo_cambio = 'NaN'::numeric OR p_tipo_cambio <= 0) THEN
    RAISE EXCEPTION 'El tipo de cambio debe ser mayor a 0.' USING ERRCODE = '22023';
  END IF;
  IF p_concepto = 'curso_mensualidad' THEN
    IF p_mes IS NULL OR p_mes < 1 THEN
      RAISE EXCEPTION 'Una mensualidad dice qué mes del curso cubre (1 o más).' USING ERRCODE = '22023';
    END IF;
  ELSIF p_mes IS NOT NULL THEN
    RAISE EXCEPTION 'Solo la mensualidad lleva mes.' USING ERRCODE = '22023';
  END IF;

  -- El candado ANTES de todo lo demás: dos cobros de la misma inscripción (o un
  -- doble envío) se forman uno detrás del otro.
  SELECT ci.alumno_id, ci.curso_id, ci.estado, COALESCE(ci.meses_desbloqueados, 0), COALESCE(ci.acceso_total, false)
    INTO v_alumno, v_curso, v_estado, v_meses, v_total
    FROM public.curso_inscripciones ci
   WHERE ci.id = p_inscripcion_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotencia: el MISMO cobro ya se registró (doble clic, reintento de red).
  -- Con otros datos no es un reintento: 23505 (no se pierde el cobro nuevo en
  -- silencio). El reintento dice lo que el primero abrió.
  SELECT p.curso_inscripcion_id, p.concepto, p.monto, p.mes_desbloqueado, p.created_at
    INTO v_prev
    FROM public.pagos p WHERE p.id = p_pago_id;
  IF FOUND THEN
    v_prev_ins := v_prev.curso_inscripcion_id;
    IF v_prev_ins IS DISTINCT FROM p_inscripcion_id
       OR v_prev.concepto IS DISTINCT FROM p_concepto
       OR v_prev.monto IS DISTINCT FROM round(p_monto, 2)  -- la columna guarda centavos
       OR v_prev.mes_desbloqueado IS DISTINCT FROM (CASE WHEN p_concepto = 'curso_mensualidad' THEN p_mes END) THEN
      RAISE EXCEPTION 'Ese identificador de cobro ya se usó en otro pago. Recarga la página y vuelve a intentarlo.'
        USING ERRCODE = '23505';
    END IF;
    RETURN QUERY SELECT p_pago_id, true,
      (SELECT CASE WHEN bool_or(e.tipo = 'abrir_todo') THEN 'todo' WHEN bool_or(e.tipo = 'abrir_mes') THEN 'mes' END
         FROM public.curso_inscripcion_eventos e
        WHERE e.inscripcion_id = p_inscripcion_id AND e.created_at = v_prev.created_at
          AND e.tipo IN ('abrir_mes', 'abrir_todo')),
      v_meses, v_total;
    RETURN;
  END IF;

  -- El mes que cubre, dentro del curso (con tope conocido): un «mes 99» en un
  -- curso de 3 dejaría «Pagado · falta abrir» encendido para siempre.
  v_tope := public.curso_tope_meses(v_curso);
  IF p_concepto = 'curso_mensualidad' AND v_tope > 0 AND p_mes > v_tope THEN
    RAISE EXCEPTION 'Este curso llega hasta el mes %: una mensualidad no puede cubrir el mes %.', v_tope, p_mes USING ERRCODE = '22023';
  END IF;

  IF p_abrir THEN
    IF v_estado IS DISTINCT FROM 'activa' THEN
      RAISE EXCEPTION 'La inscripción no está activa: registra el cobro sin abrir, o reactívala primero.' USING ERRCODE = '22023';
    END IF;
    IF p_meses_esperados IS NULL THEN
      RAISE EXCEPTION 'Para abrir hace falta lo que la pantalla vio (p_meses_esperados).' USING ERRCODE = '22023';
    END IF;
    IF p_meses_esperados <> v_meses THEN
      RAISE EXCEPTION 'Mientras cobrabas, el acceso de esta inscripción cambió (tiene % mes(es) abiertos; la pantalla decía %). Recarga y vuelve a intentarlo.',
        v_meses, p_meses_esperados USING ERRCODE = '40001';
    END IF;

    SELECT c.precio_inscripcion, c.precio_mensualidad INTO v_ins, v_men FROM public.cursos c WHERE c.id = v_curso;
    v_regla := public.curso_regla_apertura(v_ins, v_men);

    IF NOT v_total AND v_meses = 0 AND NOT EXISTS (
         SELECT 1 FROM public.curso_inscripcion_eventos e
          WHERE e.inscripcion_id = p_inscripcion_id
            AND e.tipo IN ('abrir_mes', 'cerrar_mes', 'abrir_todo', 'quitar_acceso_total')) THEN
      -- «Por activar» (D8): lo que dice la ficha HOY, con la regla que la pantalla vio.
      IF p_regla_esperada IS NULL THEN
        RAISE EXCEPTION 'Para activar hace falta la regla que la pantalla vio (p_regla_esperada).' USING ERRCODE = '22023';
      END IF;
      IF v_regla = 'total' AND p_concepto NOT IN ('curso_pago_unico', 'curso_inscripcion') THEN
        RAISE EXCEPTION 'La ficha de este curso es de pago único: activarla abre TODO el curso. Cóbrala como pago único.'
          USING ERRCODE = '22023';
      END IF;
      IF p_concepto = 'curso_pago_unico' AND v_regla <> 'total' THEN
        RAISE EXCEPTION 'La ficha de este curso no es de pago único: activarla abre el mes 1, no todo el curso. Cobra la inscripción o la mensualidad del mes 1.'
          USING ERRCODE = '22023';
      END IF;
      IF p_concepto = 'curso_mensualidad' AND p_mes <> 1 THEN
        RAISE EXCEPTION 'Al activar se abre el mes 1: esta mensualidad tiene que cubrir el mes 1 (dice el %).', p_mes USING ERRCODE = '22023';
      END IF;
      PERFORM public.curso_activar_segun_ficha(p_inscripcion_id, p_regla_esperada);
      v_abrio := CASE WHEN v_regla = 'total' THEN 'todo' ELSE 'mes' END;
    ELSIF p_concepto = 'curso_mensualidad' THEN
      IF v_total THEN
        RAISE EXCEPTION 'Ya tiene acceso total: no hay mes que abrir. Registra el cobro sin abrir.' USING ERRCODE = '22023';
      END IF;
      IF p_mes <> v_meses + 1 THEN
        RAISE EXCEPTION 'Solo se abre el mes siguiente al último abierto (el %). Esta mensualidad cubre el mes %: regístrala sin abrir.',
          v_meses + 1, p_mes USING ERRCODE = '22023';
      END IF;
      PERFORM public.curso_abrir_mes(p_inscripcion_id, p_meses_esperados);
      v_abrio := 'mes';
    ELSIF p_concepto = 'curso_pago_unico' THEN
      IF v_total THEN
        RAISE EXCEPTION 'Ya tiene acceso total: no hay nada que abrir. Registra el cobro sin abrir.' USING ERRCODE = '22023';
      END IF;
      IF v_regla <> 'total' THEN
        RAISE EXCEPTION 'La ficha de este curso no es de pago único: un cobro no abre todo el curso. Si de verdad corresponde, usa «Abrir todo» en su fila.'
          USING ERRCODE = '22023';
      END IF;
      PERFORM public.curso_abrir_todo(p_inscripcion_id);
      v_abrio := 'todo';
    ELSE
      RAISE EXCEPTION 'Este cobro no abre nada: solo abren la primera activación, la mensualidad del mes siguiente o el pago único. Regístralo sin abrir.'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.pagos (
    id, alumno_id, monto, concepto, mes_desbloqueado, metodo_pago, referencia,
    registrado_por, curso_inscripcion_id, fecha_pago, moneda, tipo_cambio_aplicado
  ) VALUES (
    p_pago_id,
    v_alumno,
    p_monto,
    p_concepto,
    -- El mes que CUBRE (decisión 5); solo la mensualidad lo lleva.
    CASE WHEN p_concepto = 'curso_mensualidad' THEN p_mes ELSE NULL END,
    UPPER(BTRIM(p_metodo_pago)),
    NULLIF(BTRIM(COALESCE(p_referencia, '')), ''),
    auth.uid(),
    p_inscripcion_id,
    COALESCE(p_fecha_pago, CURRENT_DATE),
    p_moneda,
    p_tipo_cambio
  );

  RETURN QUERY
    SELECT p_pago_id, false, v_abrio, COALESCE(ci.meses_desbloqueados, 0), COALESCE(ci.acceso_total, false)
      FROM public.curso_inscripciones ci
     WHERE ci.id = p_inscripcion_id;
END;
$$;

COMMENT ON FUNCTION public.curso_cobrar(UUID, UUID, TEXT, NUMERIC, TEXT, INTEGER, BOOLEAN, INTEGER, TEXT, TEXT, NUMERIC, TEXT, DATE) IS
  'D16: el ÚNICO escritor de cobros de curso. Staff (admin y secretario). Idempotente por p_pago_id (FOR UPDATE de la '
  'inscripción antes de buscarlo). Abre SOLO si p_abrir y solo: la primera activación de una inscripción por activar '
  '(curso_activar_segun_ficha), la mensualidad del mes meses+1 (curso_abrir_mes) o el pago único de una ficha de pago '
  'único (curso_abrir_todo); p_meses_esperados obligatorio. mes_desbloqueado = el mes que el pago CUBRE.';

REVOKE ALL ON FUNCTION public.curso_cobrar(UUID, UUID, TEXT, NUMERIC, TEXT, INTEGER, BOOLEAN, INTEGER, TEXT, TEXT, NUMERIC, TEXT, DATE) FROM PUBLIC;
DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_cobrar(UUID, UUID, TEXT, NUMERIC, TEXT, INTEGER, BOOLEAN, INTEGER, TEXT, TEXT, NUMERIC, TEXT, DATE) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_cobrar(UUID, UUID, TEXT, NUMERIC, TEXT, INTEGER, BOOLEAN, INTEGER, TEXT, TEXT, NUMERIC, TEXT, DATE) TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_cobrar(UUID, UUID, TEXT, NUMERIC, TEXT, INTEGER, BOOLEAN, INTEGER, TEXT, TEXT, NUMERIC, TEXT, DATE) TO service_role';
  END IF;
END
$grants$;

-- ════════════════════════════════════════════════════════════════════════════
-- Una inscripción CON PAGOS no se borra (la red de seguridad de D11)
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.curso_inscripcion_no_borrar_con_pagos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- La consulta ve lo CONFIRMADO al momento (lectura confirmada): si un cobro
  -- tenía la fila bloqueada, este DELETE esperó y aquí ya ve su pago.
  -- Al borrar al ALUMNO (cascada) su fila ya no está: sus pagos se van con él.
  IF EXISTS (SELECT 1 FROM public.pagos p WHERE p.curso_inscripcion_id = OLD.id)
     AND EXISTS (SELECT 1 FROM public.alumnos a WHERE a.id = OLD.alumno_id) THEN
    RAISE EXCEPTION 'Esta inscripción tiene pagos registrados y no se borra: los pagos perderían su curso y se contarían como del programa. Cancélala para darla de baja conservando el historial.'
      USING ERRCODE = '23001';
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.curso_inscripcion_no_borrar_con_pagos() IS
  'D16: BEFORE DELETE en curso_inscripciones. Con pagos ligados y el alumno vivo, 23001 (la FK de pagos es SET NULL: '
  'el pago contaría como del programa). Cubre la carrera cobro/borrado de D11 y la cascada al borrar un curso.';

REVOKE ALL ON FUNCTION public.curso_inscripcion_no_borrar_con_pagos() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_curso_inscripcion_no_borrar_con_pagos ON public.curso_inscripciones;
CREATE TRIGGER trg_curso_inscripcion_no_borrar_con_pagos
  BEFORE DELETE ON public.curso_inscripciones
  FOR EACH ROW EXECUTE FUNCTION public.curso_inscripcion_no_borrar_con_pagos();

NOTIFY pgrst, 'reload schema';

COMMIT;
