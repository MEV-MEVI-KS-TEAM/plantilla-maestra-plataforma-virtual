-- ============================================================================
-- C3b — ACCESO TOTAL (PAGO ÚNICO) Y «ASIGNAR» QUE ABRE ACCESO (#183)
-- ============================================================================
-- EL PROBLEMA (#183, Nota 152 del PLAYBOOK). «Asignar» insertaba la inscripción
-- con meses_desbloqueados = 0: el alumno que ya había pagado un curso de PAGO
-- ÚNICO no veía nada hasta que el admin pulsaba «Abrir mes» 5 o 6 veces. Y un
-- cobro con concepto 'curso_inscripcion' nunca abre nada.
--
-- LA DECISIÓN (Kevin, D1–D3, 25-sep-2026):
--   · curso_inscripciones.acceso_total: una FOTO del contrato que se toma AL
--     ASIGNAR, según el precio del curso en ese momento. NO se deriva del precio
--     al leer: cambiar el precio después NO cambia el acceso de los ya inscritos
--     (ni se lo da ni se lo quita), y un prospecto del registro público no ve
--     nada por el solo hecho de que el curso sea de pago único.
--   · La regla al asignar es LA MISMA del catálogo (precioCatalogo, en
--     src/lib/cursos/precio-curso.ts), con prueba de paridad:
--       mensualidad > 0                → mensual  → se abre el MES 1
--       solo inscripción > 0           → PAGO ÚNICO → ACCESO TOTAL
--       ninguno (0/0, «Pide informes») → se abre el MES 1   (D2, lo conservador)
--   · Solo el ADMIN asigna con regla (curso_inscribir, con SU sesión: es_admin()
--     usa auth.uid()). El registro público (register-complete) sigue creando la
--     inscripción con 0 meses y sin acceso total: no pasa por aquí.
--
-- EL CANDADO SIGUE FALLANDO CERRADO. acceso_total solo cuenta DENTRO de los
-- mismos filtros de siempre: inscripción 'activa' o 'completada', vigente, y
-- curso publicado. Suspendida, cancelada, vencida o en borrador → 0, igual que
-- antes. El techo de acceso total es 2147483647 (max int4): un `orden` NULL
-- sigue BLOQUEADO (COALESCE(orden, 2147483647) < 2147483647 es falso).
--
-- CON DEFAULT false NINGUNA FILA EXISTENTE CAMBIA DE TECHO: la foto de
-- curso_ventana_limite antes y después de esta migración es idéntica (probado en
-- el cluster scratch sobre todas las inscripciones, cursos y diplomados).
--
-- NO SE TOCA NINGUNA POLÍTICA. Las de curso_modulos, curso_lecciones,
-- curso_progreso y storage.objects llaman a curso_ventana_limite (B2) y heredan
-- el cambio solas.
--
-- IDEMPOTENTE Y RE-EJECUTABLE. En transacción. Requiere B1–B4 y B6.
-- Aplicar por conexión directa o pooler en MODO SESIÓN (5432, NUNCA 6543).
-- ============================================================================

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.cursos') IS NULL OR to_regclass('public.curso_inscripciones') IS NULL THEN
    RAISE EXCEPTION 'Falta el módulo de cursos. Corre antes scripts/migracion-cursos-diplomados.sql.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'curso_inscripciones'
                    AND column_name = 'meses_desbloqueados')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'cursos'
                    AND column_name = 'precio_inscripcion') THEN
    RAISE EXCEPTION 'Falta la migración B1 (20260730120000_b1_fundacion_solo_cursos.sql).';
  END IF;
  IF to_regproc('public.curso_ventana_limite') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B2 (20260730130000_b2_gate_ventana_cursos.sql).';
  END IF;
  IF to_regproc('public.curso_tope_meses') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B3 (20260730140000_b3_abrir_mes_y_pagos_curso.sql).';
  END IF;
  IF to_regclass('public.curso_inscripcion_eventos') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B4 (20260730150000_b4_constancia_y_eventos.sql).';
  END IF;
  IF to_regproc('public.reporte_curso_inscripciones') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B6 (20260730160000_b6_reportes_por_vertical.sql).';
  END IF;
  IF to_regproc('public.es_admin') IS NULL THEN
    RAISE EXCEPTION 'Falta public.es_admin().';
  END IF;
  -- curso_inscribir usa ON CONFLICT (curso_id, alumno_id): sin ese UNIQUE,
  -- Postgres lo rechazaría a media transacción.
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
     WHERE i.indrelid = 'public.curso_inscripciones'::regclass
       AND i.indisunique
       AND i.indnkeyatts = 2
       AND (SELECT array_agg(a.attname::text ORDER BY a.attname)
              FROM pg_attribute a
             WHERE a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey::int2[]))
           = ARRAY['alumno_id', 'curso_id']
  ) THEN
    RAISE EXCEPTION 'Falta el UNIQUE (curso_id, alumno_id) de public.curso_inscripciones.';
  END IF;
END
$preflight$;


-- ════════════════════════════════════════════════════════════════════════════
-- 1) La foto del contrato
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.curso_inscripciones
  ADD COLUMN IF NOT EXISTS acceso_total BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.curso_inscripciones.acceso_total IS
  'FOTO del contrato al asignar: true = pago único → ve el curso completo, '
  'dentro de los mismos filtros de siempre (activa/completada, vigente, curso '
  'publicado). NO se deriva del precio al leer: cambiar el precio del curso no '
  'cambia a los ya inscritos. Solo la escriben curso_inscribir, '
  'curso_inscribir_todos, curso_abrir_todo y curso_quitar_acceso_total, '
  'siempre con evento en curso_inscripcion_eventos.';


-- ════════════════════════════════════════════════════════════════════════════
-- 2) La regla al asignar — UNA sola, la del catálogo
-- ════════════════════════════════════════════════════════════════════════════
-- Espejo EXACTO de aperturaAlAsignar() en src/lib/cursos/acceso.ts, que a su vez
-- sale de precioCursoNumerico() (precio-curso.ts). La prueba de paridad de
-- tests/unit/c3b-acceso-total.spec.ts compara este CASE con el TypeScript; si
-- cambias uno, cambia el otro.
CREATE OR REPLACE FUNCTION public.curso_regla_apertura(p_inscripcion NUMERIC, p_mensualidad NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    -- NUMERIC admite 'NaN' y en Postgres NaN es MAYOR que todo: sin esta rama,
    -- un precio 'NaN' abría acceso total mientras la página (Number('NaN') > 0
    -- es falso) decía «Pide informes».
    WHEN p_inscripcion = 'NaN' OR p_mensualidad = 'NaN' THEN 'mes1'
    WHEN COALESCE(p_mensualidad, 0) > 0 THEN 'mes1'
    WHEN COALESCE(p_inscripcion, 0) > 0 THEN 'total'
    ELSE 'mes1'
  END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 3) El candado: acceso total DENTRO de los mismos filtros
-- ════════════════════════════════════════════════════════════════════════════
-- Mismo cuerpo que B2 salvo el CASE. Misma firma: CREATE OR REPLACE conserva los
-- GRANT y las políticas que la llaman.
CREATE OR REPLACE FUNCTION public.curso_ventana_limite(p_curso_id UUID, p_alumno UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT CASE
             -- Pago único (foto al asignar): todo el curso, incluidos los
             -- módulos que se agreguen después. 2147483647 deja un orden NULL
             -- bloqueado, igual que ORDEN_SIN_DEFINIR en acceso.ts.
             WHEN ci.acceso_total THEN 2147483647
             ELSE ci.meses_desbloqueados * c.modulos_por_mes
           END
      FROM public.curso_inscripciones ci
      JOIN public.cursos c ON c.id = ci.curso_id
     WHERE ci.curso_id  = p_curso_id
       AND ci.alumno_id = p_alumno
       -- 'activa' concede. 'completada' CONSERVA lo ya liberado y no abre más:
       -- meses_desbloqueados deja de moverse, así que el techo queda congelado.
       -- 'suspendida' y 'cancelada' NO conceden, tampoco con acceso total.
       AND ci.estado IN ('activa', 'completada')
       -- NULL = sin vencimiento. Fecha pasada = sin acceso.
       AND (ci.fecha_vencimiento IS NULL OR ci.fecha_vencimiento >= CURRENT_DATE)
       AND c.estado = 'publicado'
     LIMIT 1
  ), 0);
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 4) La bitácora acepta los tipos nuevos
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.curso_inscripcion_eventos
  DROP CONSTRAINT IF EXISTS curso_inscripcion_eventos_tipo_check;
ALTER TABLE public.curso_inscripcion_eventos
  ADD CONSTRAINT curso_inscripcion_eventos_tipo_check
  CHECK (tipo IN ('abrir_mes', 'cerrar_mes', 'cambio_estado', 'constancia_emitida',
                  'inscripcion', 'abrir_todo', 'quitar_acceso_total'));


-- ════════════════════════════════════════════════════════════════════════════
-- 5) Asignar con la regla — individual
-- ════════════════════════════════════════════════════════════════════════════
-- SE LLAMA CON LA SESIÓN DEL ADMIN (igual que curso_abrir_mes): es_admin() usa
-- auth.uid(), que con service_role es NULL. Por eso ni el registro público ni un
-- curl con la anon key pueden abrirse acceso.
CREATE OR REPLACE FUNCTION public.curso_inscribir(p_curso_id UUID, p_alumno_id UUID)
RETURNS TABLE (inscripcion_id UUID, acceso_total BOOLEAN, meses_desbloqueados INTEGER, regla TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ins    NUMERIC;
  v_men    NUMERIC;
  v_regla  TEXT;
  v_total  BOOLEAN;
  v_meses  INTEGER;
  v_id     UUID;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede asignar cursos.' USING ERRCODE = '42501';
  END IF;

  SELECT c.precio_inscripcion, c.precio_mensualidad INTO v_ins, v_men
    FROM public.cursos c WHERE c.id = p_curso_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El curso no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.alumnos a WHERE a.id = p_alumno_id) THEN
    RAISE EXCEPTION 'El alumno no existe.' USING ERRCODE = 'P0002';
  END IF;

  v_regla := public.curso_regla_apertura(v_ins, v_men);
  v_total := v_regla = 'total';
  v_meses := CASE WHEN v_total THEN 0 ELSE 1 END;

  INSERT INTO public.curso_inscripciones AS ci (curso_id, alumno_id, meses_desbloqueados, acceso_total)
  VALUES (p_curso_id, p_alumno_id, v_meses, v_total)
  ON CONFLICT (curso_id, alumno_id) DO NOTHING
  RETURNING ci.id INTO v_id;

  -- Ya estaba inscrito: NO se toca su acceso (ni se le da ni se le quita).
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Este alumno ya está asignado al curso.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, meses_antes, meses_despues, detalle, actor)
  VALUES (
    v_id, 'inscripcion', 0, v_meses,
    jsonb_build_object('regla', v_regla, 'acceso_total', v_total,
                       'precio_inscripcion', v_ins, 'precio_mensualidad', v_men, 'masiva', false),
    auth.uid()
  );

  RETURN QUERY SELECT v_id, v_total, v_meses, v_regla;
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 6) Asignar con la regla — a todos los alumnos activos (D3)
-- ════════════════════════════════════════════════════════════════════════════
-- La misma regla para todos, en una sola sentencia. La pantalla confirma DOS
-- veces y dice cuántos alumnos y, si el curso es de pago único, que es ACCESO
-- TOTAL. Los ya inscritos no se tocan.
--   p_simular = true  → no inscribe: devuelve cuántos serían (el número que la
--                        confirmación muestra lo da el servidor, no la pantalla);
--   p_esperados       → el número que el admin confirmó: si hoy son otros (otro
--                        admin asignó, se dio de alta a alguien…), 40001 y nada;
--   p_regla_esperada  → la regla que la confirmación le dijo ('total' o 'mes1'):
--                        si alguien cambió el precio en medio, 40001 y nada.
DROP FUNCTION IF EXISTS public.curso_inscribir_todos(UUID);
DROP FUNCTION IF EXISTS public.curso_inscribir_todos(UUID, INTEGER, BOOLEAN);
CREATE OR REPLACE FUNCTION public.curso_inscribir_todos(
  p_curso_id       UUID,
  p_esperados      INTEGER DEFAULT NULL,
  p_regla_esperada TEXT    DEFAULT NULL,
  p_simular        BOOLEAN DEFAULT false
)
RETURNS TABLE (agregados INTEGER, total_activos INTEGER, regla TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ins    NUMERIC;
  v_men    NUMERIC;
  v_regla  TEXT;
  v_total  BOOLEAN;
  v_meses  INTEGER;
  v_n      INTEGER;
  v_act    INTEGER;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede asignar cursos.' USING ERRCODE = '42501';
  END IF;

  SELECT c.precio_inscripcion, c.precio_mensualidad INTO v_ins, v_men
    FROM public.cursos c WHERE c.id = p_curso_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El curso no existe.' USING ERRCODE = 'P0002';
  END IF;

  v_regla := public.curso_regla_apertura(v_ins, v_men);
  v_total := v_regla = 'total';
  v_meses := CASE WHEN v_total THEN 0 ELSE 1 END;

  SELECT count(*)::integer INTO v_act FROM public.alumnos a WHERE a.activo = true;

  -- Lo mismo que insertaría el INSERT de abajo (activos sin inscripción).
  SELECT count(*)::integer INTO v_n
    FROM public.alumnos a
   WHERE a.activo = true
     AND NOT EXISTS (SELECT 1 FROM public.curso_inscripciones ci
                      WHERE ci.curso_id = p_curso_id AND ci.alumno_id = a.id);

  IF p_simular THEN
    RETURN QUERY SELECT v_n, v_act, v_regla;
    RETURN;
  END IF;

  IF p_regla_esperada IS NOT NULL AND p_regla_esperada <> v_regla THEN
    RAISE EXCEPTION
      'La confirmación decía que se abriría «%» y el curso hoy abre «%» (alguien cambió su precio). Vuelve a abrir la asignación masiva.',
      p_regla_esperada, v_regla USING ERRCODE = '40001';
  END IF;

  IF p_esperados IS NOT NULL AND p_esperados <> v_n THEN
    RAISE EXCEPTION
      'La confirmación decía % alumno(s) nuevo(s) y hoy son %. Vuelve a abrir la asignación masiva para ver el número actual.',
      p_esperados, v_n USING ERRCODE = '40001';
  END IF;

  WITH nuevas AS (
    INSERT INTO public.curso_inscripciones AS ci (curso_id, alumno_id, meses_desbloqueados, acceso_total)
    SELECT p_curso_id, a.id, v_meses, v_total
      FROM public.alumnos a
     WHERE a.activo = true
    ON CONFLICT (curso_id, alumno_id) DO NOTHING
    RETURNING ci.id
  ), eventos AS (
    INSERT INTO public.curso_inscripcion_eventos
      (inscripcion_id, tipo, meses_antes, meses_despues, detalle, actor)
    SELECT n.id, 'inscripcion', 0, v_meses,
           jsonb_build_object('regla', v_regla, 'acceso_total', v_total,
                              'precio_inscripcion', v_ins, 'precio_mensualidad', v_men, 'masiva', true),
           auth.uid()
      FROM nuevas n
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_n FROM eventos;

  RETURN QUERY SELECT v_n, v_act, v_regla;
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 7) Abrir todo / quitar el acceso total (correcciones del admin, con rastro)
-- ════════════════════════════════════════════════════════════════════════════
-- Idempotentes: si ya está como se pide, devuelven el estado sin evento (como
-- curso_cambiar_estado con el mismo estado).
CREATE OR REPLACE FUNCTION public.curso_abrir_todo(p_inscripcion_id UUID)
RETURNS TABLE (acceso_total BOOLEAN, meses_desbloqueados INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total  BOOLEAN;
  v_meses  INTEGER;
  v_estado TEXT;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede abrir el curso completo.' USING ERRCODE = '42501';
  END IF;

  SELECT ci.acceso_total, ci.meses_desbloqueados, ci.estado INTO v_total, v_meses, v_estado
    FROM public.curso_inscripciones ci WHERE ci.id = p_inscripcion_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF v_total THEN
    RETURN QUERY SELECT true, v_meses;   -- ya lo tenía: sin cambio, sin evento
    RETURN;
  END IF;

  IF v_estado <> 'activa' THEN
    RAISE EXCEPTION
      'No se puede abrir el curso en una inscripción %. Reactívala primero (estado = activa).',
      v_estado USING ERRCODE = '22023';
  END IF;

  UPDATE public.curso_inscripciones ci SET acceso_total = true WHERE ci.id = p_inscripcion_id;

  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, meses_antes, meses_despues, detalle, actor)
  VALUES (p_inscripcion_id, 'abrir_todo', v_meses, v_meses,
          jsonb_build_object('acceso_total', true), auth.uid());

  RETURN QUERY SELECT true, v_meses;
END;
$$;

CREATE OR REPLACE FUNCTION public.curso_quitar_acceso_total(p_inscripcion_id UUID, p_motivo TEXT DEFAULT NULL)
RETURNS TABLE (acceso_total BOOLEAN, meses_desbloqueados INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total BOOLEAN;
  v_meses INTEGER;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede quitar el acceso total.' USING ERRCODE = '42501';
  END IF;

  SELECT ci.acceso_total, ci.meses_desbloqueados INTO v_total, v_meses
    FROM public.curso_inscripciones ci WHERE ci.id = p_inscripcion_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_total THEN
    RETURN QUERY SELECT false, v_meses;  -- no lo tenía: sin cambio, sin evento
    RETURN;
  END IF;

  -- Vuelve a la ventana por meses con los que ya tenía abiertos (0 si entró por
  -- pago único). Revoca acceso: la pantalla lo confirma antes.
  UPDATE public.curso_inscripciones ci SET acceso_total = false WHERE ci.id = p_inscripcion_id;

  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, meses_antes, meses_despues, detalle, actor)
  VALUES (p_inscripcion_id, 'quitar_acceso_total', v_meses, v_meses,
          jsonb_build_object('acceso_total', false, 'motivo', p_motivo), auth.uid());

  RETURN QUERY SELECT false, v_meses;
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 8) Abrir/cerrar mes: no tienen sentido con acceso total
-- ════════════════════════════════════════════════════════════════════════════
-- Mismos cuerpos que B4, más una guarda. Sin ella, «Abrir mes» movería un
-- contador que no cambia nada y «−» daría «no tiene meses abiertos» a quien ve
-- todo el curso. Mismas firmas: se conservan los GRANT.
CREATE OR REPLACE FUNCTION public.curso_abrir_mes(
  p_inscripcion_id  UUID,
  p_meses_esperados INTEGER DEFAULT NULL
)
RETURNS TABLE (meses_desbloqueados INTEGER, tope INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_curso   UUID;
  v_actual  INTEGER;
  v_estado  TEXT;
  v_total   BOOLEAN;
  v_tope    INTEGER;
  v_nuevo   INTEGER;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede abrir meses.' USING ERRCODE = '42501';
  END IF;

  SELECT ci.curso_id, ci.meses_desbloqueados, ci.estado, ci.acceso_total
    INTO v_curso, v_actual, v_estado, v_total
    FROM public.curso_inscripciones ci
   WHERE ci.id = p_inscripcion_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF v_total THEN
    RAISE EXCEPTION
      'Esta inscripción tiene acceso total (pago único): ya ve el curso completo. No hay meses que abrir.'
      USING ERRCODE = '22023';
  END IF;

  IF v_estado <> 'activa' THEN
    RAISE EXCEPTION
      'No se pueden abrir meses en una inscripción %. Reactívala primero (estado = activa).',
      v_estado USING ERRCODE = '22023';
  END IF;

  IF p_meses_esperados IS NOT NULL AND p_meses_esperados <> v_actual THEN
    RAISE EXCEPTION
      'La inscripción ya tiene % meses abiertos (esperabas %). Recarga la pantalla: alguien más la movió o el botón se pulsó dos veces.',
      v_actual, p_meses_esperados USING ERRCODE = '40001';
  END IF;

  v_tope := public.curso_tope_meses(v_curso);

  IF v_actual >= v_tope THEN
    RAISE EXCEPTION
      'Este curso llega hasta % meses y la inscripción ya los tiene todos abiertos. No hay más contenido que liberar.',
      v_tope USING ERRCODE = '22023';
  END IF;

  v_nuevo := v_actual + 1;

  UPDATE public.curso_inscripciones ci
     SET meses_desbloqueados = v_nuevo
   WHERE ci.id = p_inscripcion_id;

  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, meses_antes, meses_despues, actor)
  VALUES (p_inscripcion_id, 'abrir_mes', v_actual, v_nuevo, auth.uid());

  RETURN QUERY SELECT v_nuevo, v_tope;
END;
$$;

CREATE OR REPLACE FUNCTION public.curso_cerrar_mes(
  p_inscripcion_id  UUID,
  p_meses_esperados INTEGER DEFAULT NULL
)
RETURNS TABLE (meses_desbloqueados INTEGER, tope INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_curso  UUID;
  v_actual INTEGER;
  v_total  BOOLEAN;
  v_nuevo  INTEGER;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede cerrar meses.' USING ERRCODE = '42501';
  END IF;

  SELECT ci.curso_id, ci.meses_desbloqueados, ci.acceso_total
    INTO v_curso, v_actual, v_total
    FROM public.curso_inscripciones ci
   WHERE ci.id = p_inscripcion_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF v_total THEN
    RAISE EXCEPTION
      'Esta inscripción tiene acceso total (pago único): no se cierra por meses. Para revocarlo usa «Quitar acceso total» o suspende la inscripción.'
      USING ERRCODE = '22023';
  END IF;

  IF p_meses_esperados IS NOT NULL AND p_meses_esperados <> v_actual THEN
    RAISE EXCEPTION
      'La inscripción ya tiene % meses abiertos (esperabas %). Recarga la pantalla.',
      v_actual, p_meses_esperados USING ERRCODE = '40001';
  END IF;

  IF v_actual <= 0 THEN
    RAISE EXCEPTION 'La inscripción no tiene meses abiertos: no hay nada que cerrar.'
      USING ERRCODE = '22023';
  END IF;

  v_nuevo := v_actual - 1;

  UPDATE public.curso_inscripciones ci
     SET meses_desbloqueados = v_nuevo
   WHERE ci.id = p_inscripcion_id;

  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, meses_antes, meses_despues, actor)
  VALUES (p_inscripcion_id, 'cerrar_mes', v_actual, v_nuevo, auth.uid());

  RETURN QUERY SELECT v_nuevo, public.curso_tope_meses(v_curso);
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 9) Reporte: con acceso total, visibles = todos
-- ════════════════════════════════════════════════════════════════════════════
-- Mismo cuerpo y firma que B6 (se conservan el REVOKE y el GRANT a
-- service_role). Solo cambia modulos_visibles.
CREATE OR REPLACE FUNCTION public.reporte_curso_inscripciones()
RETURNS TABLE (
  inscripcion_id uuid,
  alumno text,
  matricula text,
  email text,
  diplomado text,
  tipo text,
  estado text,
  fecha_inscripcion timestamptz,
  meses_abiertos integer,
  tope_meses integer,
  modulos_visibles integer,
  modulos_totales integer,
  fecha_vencimiento date
)
LANGUAGE sql STABLE
AS $$
  SELECT i.id,
         COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellidos)), ''), u.email, '—'),
         a.matricula,
         u.email,
         c.nombre,
         c.tipo,
         i.estado,
         i.fecha_inscripcion,
         i.meses_desbloqueados,
         public.curso_tope_meses(c.id),
         CASE
           WHEN i.acceso_total THEN
             (SELECT COUNT(*) FROM public.curso_modulos m WHERE m.curso_id = c.id)
           ELSE LEAST(
             i.meses_desbloqueados * GREATEST(c.modulos_por_mes, 0),
             (SELECT COUNT(*) FROM public.curso_modulos m WHERE m.curso_id = c.id)
           )
         END::integer,
         (SELECT COUNT(*) FROM public.curso_modulos m WHERE m.curso_id = c.id)::integer,
         i.fecha_vencimiento
    FROM public.curso_inscripciones i
    JOIN public.cursos   c ON c.id = i.curso_id
    JOIN public.alumnos  a ON a.id = i.alumno_id
    JOIN public.usuarios u ON u.id = a.id
   ORDER BY c.nombre, u.nombre, u.apellidos;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 10) Permisos de las funciones nuevas
-- ════════════════════════════════════════════════════════════════════════════
-- authenticated: las de admin se llaman con la sesión (comprueban es_admin()
-- adentro). anon: nunca.
REVOKE ALL ON FUNCTION public.curso_regla_apertura(NUMERIC, NUMERIC)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curso_inscribir(UUID, UUID)                   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curso_inscribir_todos(UUID, INTEGER, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curso_abrir_todo(UUID)                        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curso_quitar_acceso_total(UUID, TEXT)         FROM PUBLIC;

DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_inscribir(UUID, UUID) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_inscribir_todos(UUID, INTEGER, TEXT, BOOLEAN) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_abrir_todo(UUID) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_quitar_acceso_total(UUID, TEXT) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_regla_apertura(NUMERIC, NUMERIC) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_regla_apertura(NUMERIC, NUMERIC) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_inscribir(UUID, UUID) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_inscribir_todos(UUID, INTEGER, TEXT, BOOLEAN) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_abrir_todo(UUID) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_quitar_acceso_total(UUID, TEXT) TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_regla_apertura(NUMERIC, NUMERIC) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_inscribir(UUID, UUID) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_inscribir_todos(UUID, INTEGER, TEXT, BOOLEAN) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_abrir_todo(UUID) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_quitar_acceso_total(UUID, TEXT) TO service_role';
  END IF;
END
$grants$;

-- El techo de CUALQUIER alumno no se lee por RPC (antes, anon o un alumno
-- podían consultar el de otro y, con C3b, saber quién compró de pago único). Las
-- políticas lo usan por los ayudantes SECURITY DEFINER de B2, que corren como el
-- dueño: no necesitan este EXECUTE. service_role lo conserva.
REVOKE EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) FROM PUBLIC;
DO $techo$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_ventana_limite(UUID, UUID) TO service_role';
  END IF;
END
$techo$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── Verificación manual ─────────────────────────────────────────────────────
--   SELECT public.curso_regla_apertura(2490, 0);   -- total
--   SELECT public.curso_regla_apertura(0, 900);    -- mes1
--   SELECT public.curso_regla_apertura(0, 0);      -- mes1 (D2)
--   -- con la sesión del admin:
--   SELECT * FROM public.curso_inscribir('<curso>', '<alumno>');
