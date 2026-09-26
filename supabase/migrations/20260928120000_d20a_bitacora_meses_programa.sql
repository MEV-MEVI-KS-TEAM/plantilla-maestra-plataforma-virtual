-- ============================================================================
-- D20a — ABRIR Y CERRAR MES DEL PROGRAMA: CON BITÁCORA, ACTOR E IDEMPOTENCIA
-- (Bloque D, remate c; decisión 6: el secretario también abre y cierra)
-- ============================================================================
-- EL PROBLEMA. «Abrir Mes N» y «Quitar último mes» de la ficha (Secundaria,
-- Preparatoria y licenciatura) movían alumnos.meses_desbloqueados con un
-- UPDATE leído-y-escrito desde la ruta:
--   · sin bitácora: nadie sabía quién abrió o cerró qué mes, ni cuándo;
--   · sin protección de doble clic: dos clics (o dos pestañas) leían el mismo
--     valor y cada uno sumaba o restaba por su cuenta;
--   · desde D7b lo hace también el secretario, así que «quién» importa más.
--
-- LA SOLUCIÓN. Un solo escritor, public.alumno_mover_mes(), que llama SOLO el
-- servidor (service_role), como corregir_plan_estudio (Bug 83): el tope del
-- plan sale de la config en el servidor, así que nadie debe poder llamarla por
-- PostgREST con un tope inventado. La ruta verifica la sesión (verifyStaff) y
-- pasa al actor (p_actor); la función lo revalida contra usuarios (admin o
-- secretario) antes de tocar nada:
--   · candado de fila (FOR UPDATE) sobre el alumno ANTES de mirar nada;
--   · idempotente por p_operacion_id (uno por apertura del modal): repetir la
--     misma operación devuelve lo que hizo la primera, sin mover nada;
--   · p_antes = lo que la pantalla vio; si el alumno cambió en medio, 40001 y
--     nada (dos pestañas no suman dos meses);
--   · el tope (duración del plan) lo manda el servidor desde su config, que es
--     donde vive; aquí solo se valida el rango;
--   · a un alumno de diplomado no se le ABRE un mes de PROGRAMA (B7): 22023.
--     Quitarlo sí se puede (limpia un dato sucio de antes de B7);
--   · la bitácora (alumno_mes_eventos) guarda acción, mes, antes → después,
--     actor con su nombre y su rol DEL MOMENTO, y la fecha. La escribe solo
--     esta función: por PostgREST nadie puede fabricar eventos ni mover meses.
--
-- APLICA A TODA ESCUELA (no solo a la línea de cursos): también va en
-- scripts/schema.sql, el instalador de clientes nuevos (lo exige el guardián
-- tests/unit/guardian-schema-onboarding.spec.ts). Sin esta migración la ruta
-- sigue funcionando sin bitácora (con un UPDATE condicionado a p_antes).
--
-- IDEMPOTENTE Y TRANSACCIONAL: re-correrla no duplica nada ni borra eventos.
-- No toca las funciones de cursos (curso_ventana_limite queda idéntica).
-- Conexión en modo sesión (puerto 5432), nunca el pooler 6543.
-- ============================================================================

BEGIN;

-- ── Preflight: lo que esta migración necesita ya instalado ───────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'alumnos'
                    AND column_name = 'meses_desbloqueados') THEN
    RAISE EXCEPTION 'Falta public.alumnos.meses_desbloqueados: corre antes scripts/schema.sql.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'usuarios'
                    AND column_name = 'rol') THEN
    RAISE EXCEPTION 'Falta public.usuarios.rol: corre antes scripts/schema.sql.';
  END IF;
  -- es_staff() (la política de lectura) tiene que existir y normalizar el rol
  -- (LOWER). Sin cast constante: con la función ausente, el mensaje es este y
  -- no el error crudo (#241).
  IF to_regprocedure('public.es_staff()') IS NULL THEN
    RAISE EXCEPTION 'Falta public.es_staff(). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
  IF pg_get_functiondef(to_regprocedure('public.es_staff()')) !~* 'lower\s*\(\s*rol\s*\)' THEN
    RAISE EXCEPTION 'public.es_staff() no normaliza el rol (LOWER). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
END
$preflight$;

-- ── BITÁCORA: alumno_mes_eventos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alumno_mes_eventos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id     UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  accion        TEXT        NOT NULL,
  mes           INTEGER     NOT NULL,
  antes         INTEGER     NOT NULL,
  despues       INTEGER     NOT NULL,
  -- Uno por apertura del modal: el doble clic repite el MISMO id.
  operacion_id  UUID        NOT NULL,
  -- Quién lo hizo, con su nombre y su rol del momento (si luego lo renombran o
  -- lo dan de baja, la bitácora dice quién era entonces).
  actor         UUID,
  actor_nombre  TEXT,
  actor_rol     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alumno_mes_eventos
  DROP CONSTRAINT IF EXISTS alumno_mes_eventos_accion_check;
ALTER TABLE public.alumno_mes_eventos
  ADD CONSTRAINT alumno_mes_eventos_accion_check
  CHECK (accion IN ('abrir', 'cerrar'));

-- Coherencia: abrir sube uno y el mes es el nuevo; cerrar baja uno y el mes es
-- el que se quitó.
ALTER TABLE public.alumno_mes_eventos
  DROP CONSTRAINT IF EXISTS alumno_mes_eventos_coherencia_check;
ALTER TABLE public.alumno_mes_eventos
  ADD CONSTRAINT alumno_mes_eventos_coherencia_check
  CHECK (
    (accion = 'abrir'  AND despues = antes + 1 AND mes = despues)
    OR (accion = 'cerrar' AND despues = antes - 1 AND mes = antes AND despues >= 0)
  );

CREATE UNIQUE INDEX IF NOT EXISTS alumno_mes_eventos_operacion_uidx
  ON public.alumno_mes_eventos (operacion_id);

CREATE INDEX IF NOT EXISTS idx_alumno_mes_eventos_alumno
  ON public.alumno_mes_eventos (alumno_id, created_at DESC);

ALTER TABLE public.alumno_mes_eventos ENABLE ROW LEVEL SECURITY;

-- Lee el personal (el secretario también ve la ficha). Nadie escribe por
-- PostgREST: sin política de INSERT/UPDATE/DELETE la bitácora la escribe
-- alumno_mover_mes() o nadie.
DROP POLICY IF EXISTS "alumno_mes_eventos: staff lee" ON public.alumno_mes_eventos;
CREATE POLICY "alumno_mes_eventos: staff lee" ON public.alumno_mes_eventos
  FOR SELECT TO authenticated
  USING (public.es_staff());

DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.alumno_mes_eventos FROM authenticated';
    EXECUTE 'GRANT SELECT ON public.alumno_mes_eventos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT ALL ON public.alumno_mes_eventos TO service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.alumno_mes_eventos FROM anon';
  END IF;
END
$g$;

-- ── ESCRITOR ÚNICO: alumno_mover_mes(...) ───────────────────────────────────
-- Las columnas de salida NO se llaman como las de las tablas (plpgsql las
-- confundiría con las columnas en los WHERE).
CREATE OR REPLACE FUNCTION public.alumno_mover_mes(
  p_alumno_id    UUID,
  p_accion       TEXT,
  p_antes        INTEGER,
  p_tope         INTEGER,
  p_operacion_id UUID,
  p_actor        UUID
)
RETURNS TABLE (
  meses_ahora  INTEGER,
  mes_movido   INTEGER,
  meses_antes  INTEGER,
  repetido     BOOLEAN,
  quien        TEXT,
  quien_rol    TEXT,
  cuando       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nivel   TEXT;
  v_actual  INTEGER;
  v_ev      RECORD;
  v_nuevo   INTEGER;
  v_mes     INTEGER;
  v_nombre  TEXT;
  v_rol     TEXT;
  v_creado  TIMESTAMPTZ;
BEGIN
  -- Permiso primero (D20a): el actor que manda el servidor tiene que ser admin
  -- o secretario HOY (defensa en profundidad además de verifyStaff).
  SELECT COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellidos)), ''), u.email),
         LOWER(BTRIM(u.rol))
    INTO v_nombre, v_rol
    FROM public.usuarios u
   WHERE u.id = p_actor;
  IF p_actor IS NULL OR v_rol IS NULL OR v_rol NOT IN ('admin', 'secretario') THEN
    RAISE EXCEPTION 'Solo el personal de la escuela puede abrir o cerrar meses.'
      USING ERRCODE = '42501';
  END IF;

  IF p_operacion_id IS NULL THEN
    RAISE EXCEPTION 'Falta el identificador de la operación. Recarga la página y vuelve a intentarlo.'
      USING ERRCODE = '22023';
  END IF;
  IF p_accion IS NULL OR p_accion NOT IN ('abrir', 'cerrar') THEN
    RAISE EXCEPTION 'Acción inválida: usa abrir o cerrar.' USING ERRCODE = '22023';
  END IF;
  IF p_antes IS NULL OR p_antes < 0 THEN
    RAISE EXCEPTION 'Falta cuántos meses tenía abiertos el alumno. Recarga la página.' USING ERRCODE = '22023';
  END IF;

  -- Candado de fila ANTES de mirar la bitácora: el gemelo de un doble clic
  -- espera aquí y, al pasar, ya ve el evento del primero.
  SELECT a.nivel, COALESCE(a.meses_desbloqueados, 0)
    INTO v_nivel, v_actual
    FROM public.alumnos a
   WHERE a.id = p_alumno_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumno no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotencia: la misma operación devuelve lo que hizo, sin mover nada.
  SELECT e.alumno_id, e.accion, e.mes, e.antes, e.despues, e.actor_nombre, e.actor_rol, e.created_at
    INTO v_ev
    FROM public.alumno_mes_eventos e
   WHERE e.operacion_id = p_operacion_id;
  IF FOUND THEN
    IF v_ev.alumno_id <> p_alumno_id OR v_ev.accion <> p_accion THEN
      RAISE EXCEPTION 'Ese identificador de operación ya se usó para otra cosa. Recarga la página.'
        USING ERRCODE = '22023';
    END IF;
    RETURN QUERY SELECT v_ev.despues, v_ev.mes, v_ev.antes, TRUE, v_ev.actor_nombre, v_ev.actor_rol, v_ev.created_at;
    RETURN;
  END IF;

  -- B7: meses_desbloqueados de un alumno de diplomado no es su curso. Abrir,
  -- no; quitar sí (limpia un dato sucio de antes de B7).
  IF v_nivel = 'diplomado' AND p_accion = 'abrir' THEN
    RAISE EXCEPTION 'Este alumno no cursa un programa. Los meses de su diplomado se abren desde la ficha del curso.'
      USING ERRCODE = '22023';
  END IF;

  -- Lo que la pantalla vio. Si cambió (otra pestaña, otro usuario), nada.
  IF v_actual <> p_antes THEN
    RAISE EXCEPTION 'El alumno cambió mientras tanto: ahora tiene % mes(es) abierto(s). Recarga la ficha y vuelve a intentarlo.', v_actual
      USING ERRCODE = '40001';
  END IF;

  IF p_accion = 'abrir' THEN
    IF p_tope IS NULL OR p_tope < 1 OR p_tope > 600 THEN
      RAISE EXCEPTION 'La duración del plan no es válida (%).', p_tope USING ERRCODE = '22023';
    END IF;
    IF v_actual >= p_tope THEN
      RAISE EXCEPTION 'Todos los meses ya están desbloqueados.' USING ERRCODE = '22023';
    END IF;
    v_nuevo := v_actual + 1;
    v_mes   := v_nuevo;
  ELSE
    IF v_actual <= 0 THEN
      RAISE EXCEPTION 'No hay meses que quitar.' USING ERRCODE = '22023';
    END IF;
    v_nuevo := v_actual - 1;
    v_mes   := v_actual;
  END IF;

  UPDATE public.alumnos SET meses_desbloqueados = v_nuevo WHERE id = p_alumno_id;

  INSERT INTO public.alumno_mes_eventos
    (alumno_id, accion, mes, antes, despues, operacion_id, actor, actor_nombre, actor_rol)
  VALUES
    (p_alumno_id, p_accion, v_mes, v_actual, v_nuevo, p_operacion_id, p_actor, v_nombre, v_rol)
  RETURNING created_at INTO v_creado;

  RETURN QUERY SELECT v_nuevo, v_mes, v_actual, FALSE, v_nombre, v_rol, v_creado;
END;
$$;

-- SOLO el servidor (service_role): SECURITY DEFINER con EXECUTE abierto sería
-- mover meses por PostgREST con un tope inventado (Bug 77: nombrar los tres roles).
REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM PUBLIC;
DO $gf$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) TO service_role';
  END IF;
END
$gf$;

-- Sin esto la RPC nueva responde PGRST202 hasta que alguien reinicie el proyecto.
NOTIFY pgrst, 'reload schema';

COMMIT;
