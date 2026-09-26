-- ============================================================================
-- D20b — EL SECRETARIO TAMBIÉN EMITE CONSTANCIAS; EL FOLIO GUARDA QUIÉN LO
-- EMITIÓ; UNA INSCRIPCIÓN CANCELADA NO RECIBE FOLIO (Bloque D, remate a)
-- ============================================================================
-- DECISIÓN DE KEVIN (respuesta a la parada del Bloque D): el secretario emite
-- constancias con folio. La emisión sigue siendo MANUAL y con sus guardas de
-- B8.2 (sin examen aprobado no hay diploma; la calificación la calcula la
-- función). Cambia:
--
--   (1) PERMISO: es_staff() en vez de es_admin(). La llamada sigue siendo con
--       la SESIÓN (auth.uid() = quien emite; con service_role falla 42501).
--       La marca «-- D20b:» (ASCII) es la que buscan el CHECK 20 y los
--       epílogos de B4 y B8.2.
--   (2) EL FOLIO GUARDA SU AUTOR: curso_constancias.emitida_por (uuid),
--       emitida_por_nombre y emitida_por_rol, como FOTO del momento (igual que
--       alumno_nombre): si luego lo renombran o lo dan de baja, el diploma dice
--       quién lo emitió entonces. El evento 'constancia_emitida' también lleva
--       folio, nombre y rol en su detalle.
--   (4) EL PREFIJO NO LO INVENTA QUIEN LLAMA: el secretario puede llamar la
--       función directo (PostgREST, con su sesión) y el folio es PERMANENTE.
--       Para todos, el prefijo tiene la forma de la flota (MAYÚSCULAS y dígitos,
--       con guiones entre bloques, hasta 20); y quien NO es admin solo usa el
--       prefijo que ya trae el libro de folios (estrenar uno es del admin).
--   (3) CANCELADA = SIN FOLIO, EN EL SERVIDOR: la inscripción se lee con
--       FOR UPDATE (serializa con «Cancelar inscripción», que también la
--       bloquea) y una cancelada responde 22023 antes de sacar folio. El folio
--       se saca DESPUÉS de todas las guardas: nextval no se deshace con el
--       rollback y cada rechazo dejaría un hueco en la numeración.
--       Una constancia YA emitida se sigue devolviendo tal cual aunque la
--       inscripción se haya cancelado después: el folio es permanente.
--
-- MISMA FIRMA Y MISMO RETURNS TABLE que B4/B8.2 (cambiarlos haría que
-- re-correr B4 o B8.2 abortara con «cannot change return type»).
--
-- RE-CORRER B4 O B8.2 YA NO LA REVIERTE: B4 guarda la versión vigente (la de
-- B8.2 o esta) y la restaura al final; B8.2 guarda esta y la restaura. El
-- CHECK 20 de scripts/post-setup-check.sql vigila el resultado.
--
-- IDEMPOTENTE Y TRANSACCIONAL. Conexión en modo sesión (puerto 5432), nunca
-- el pooler 6543. No toca curso_ventana_limite ni ninguna función de acceso.
-- ============================================================================

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.curso_constancias') IS NULL THEN
    RAISE EXCEPTION 'Falta public.curso_constancias. Corre antes B1 (20260730120000_b1_fundacion_solo_cursos.sql).';
  END IF;
  IF to_regclass('public.curso_inscripcion_eventos') IS NULL THEN
    RAISE EXCEPTION 'Falta public.curso_inscripcion_eventos. Corre antes B4 (20260730150000_b4_constancia_y_eventos.sql).';
  END IF;
  IF to_regclass('public.curso_examen_resultados') IS NULL THEN
    RAISE EXCEPTION 'Falta public.curso_examen_resultados. Corre antes 20260728120000_examen_final_cursos.sql.';
  END IF;
  IF to_regprocedure('public.generar_folio_constancia(text)') IS NULL THEN
    RAISE EXCEPTION 'Falta public.generar_folio_constancia(). Corre antes B1.';
  END IF;
  -- La emisión manual de B8.2 tiene que estar: esta migración la amplía.
  IF to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NULL
     OR strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'IF v_mejor < v_minima THEN') = 0 THEN
    RAISE EXCEPTION 'curso_emitir_constancia no es la de B8.2 (emisión manual con guarda de aprobación). Corre antes supabase/migrations/20260730180000_b82_emision_manual_con_actor.sql.';
  END IF;
  -- es_staff() tiene que normalizar el rol. Sin cast constante (#241).
  IF to_regprocedure('public.es_staff()') IS NULL THEN
    RAISE EXCEPTION 'Falta public.es_staff(). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
  IF pg_get_functiondef(to_regprocedure('public.es_staff()')) !~* 'lower\s*\(\s*rol\s*\)' THEN
    RAISE EXCEPTION 'public.es_staff() no normaliza el rol (LOWER). Corre antes supabase/migrations/20260729121000_fix_s2_es_admin.sql.';
  END IF;
END
$preflight$;

-- ── (2) El autor del folio ───────────────────────────────────────────────────
-- Un ALTER por columna (el guardián del onboarding toma uno por sentencia).
ALTER TABLE public.curso_constancias ADD COLUMN IF NOT EXISTS emitida_por UUID;
ALTER TABLE public.curso_constancias ADD COLUMN IF NOT EXISTS emitida_por_nombre TEXT;
ALTER TABLE public.curso_constancias ADD COLUMN IF NOT EXISTS emitida_por_rol TEXT;

-- Las ya emitidas: el autor sale de su evento 'constancia_emitida' (B8.2 guarda
-- auth.uid()); nombre y rol, los de HOY (no hay foto de entonces). Las de la
-- era B4 (service_role) no tienen actor y se quedan sin autor.
UPDATE public.curso_constancias c
   SET emitida_por        = e.actor,
       emitida_por_nombre = COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellidos)), ''), u.email),
       emitida_por_rol    = LOWER(BTRIM(u.rol))
  FROM (SELECT DISTINCT ON (ev.inscripcion_id) ev.inscripcion_id, ev.actor
          FROM public.curso_inscripcion_eventos ev
         WHERE ev.tipo = 'constancia_emitida' AND ev.actor IS NOT NULL
         ORDER BY ev.inscripcion_id, ev.created_at) e
  LEFT JOIN public.usuarios u ON u.id = e.actor
 WHERE c.inscripcion_id = e.inscripcion_id
   AND c.emitida_por IS NULL;

-- ── (1) y (3) La emisión ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.curso_emitir_constancia(
  p_inscripcion_id UUID,
  p_prefijo        TEXT,
  p_calificacion   NUMERIC DEFAULT NULL
)
RETURNS TABLE (id UUID, folio TEXT, emitido_en TIMESTAMPTZ, ya_existia BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existente   RECORD;
  v_alumno      UUID;
  v_curso       UUID;
  v_estado      TEXT;
  v_nombre      TEXT;
  v_curso_nom   TEXT;
  v_horas       INTEGER;
  v_mejor       NUMERIC;
  v_minima      NUMERIC;
  v_folio       TEXT;
  v_id          UUID;
  v_emitido     TIMESTAMPTZ;
  v_actor_nom   TEXT;
  v_actor_rol   TEXT;
  v_prefijo     TEXT := btrim(p_prefijo);
  v_libro       TEXT;
BEGIN
  -- (1) Permiso primero: admin o secretario, con SU sesión.
  IF NOT public.es_staff() THEN  -- D20b: tambien el secretario emite
    RAISE EXCEPTION 'Solo el personal de la escuela puede emitir constancias.'
      USING ERRCODE = '42501';
  END IF;

  -- La inscripción, BLOQUEADA: serializa con cancelarla (curso_cambiar_estado
  -- también la bloquea) y con otra emisión de la misma.
  SELECT ci.alumno_id, ci.curso_id, ci.estado INTO v_alumno, v_curso, v_estado
    FROM public.curso_inscripciones ci
   WHERE ci.id = p_inscripcion_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe.' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotencia: si ya existe, se devuelve la existente (también si la
  -- inscripción se canceló después: el folio emitido es permanente).
  SELECT c.id, c.folio, c.emitido_en INTO v_existente
    FROM public.curso_constancias c WHERE c.inscripcion_id = p_inscripcion_id;
  IF FOUND THEN
    RETURN QUERY SELECT v_existente.id, v_existente.folio, v_existente.emitido_en, TRUE;
    RETURN;
  END IF;

  -- (4) El prefijo, solo cuando va a salir un folio NUEVO (una ya emitida se
  -- devuelve arriba tal cual): la forma de la flota para todos; el del libro
  -- para el secretario.
  IF v_prefijo IS NULL OR length(v_prefijo) > 20 OR v_prefijo !~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' THEN
    RAISE EXCEPTION 'Prefijo de folio inválido: usa MAYÚSCULAS y dígitos (con guiones entre bloques), hasta 20.'
      USING ERRCODE = '22023';
  END IF;
  IF NOT public.es_admin() THEN
    SELECT regexp_replace(c.folio, '-[0-9]+$', '') INTO v_libro
      FROM public.curso_constancias c
     ORDER BY c.emitido_en DESC NULLS LAST, c.folio DESC
     LIMIT 1;
    IF v_libro IS NOT NULL AND v_libro <> v_prefijo THEN
      RAISE EXCEPTION 'Solo el administrador puede estrenar un prefijo de folio nuevo (el libro usa %).', v_libro
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- (3) Una inscripción cancelada no recibe folio.
  IF v_estado = 'cancelada' THEN
    RAISE EXCEPTION 'La inscripción está cancelada: no se emite constancia. Si fue un error, reactívala primero.'
      USING ERRCODE = '22023';
  END IF;

  -- Las guardas de B8.2, sin cambios: el mejor resultado REAL contra el umbral
  -- REAL del curso; p_calificacion se ignora.
  SELECT MAX(r.porcentaje) INTO v_mejor
    FROM public.curso_examen_resultados r
   WHERE r.curso_id = v_curso AND r.alumno_id = v_alumno;

  SELECT COALESCE(NULLIF(c.calificacion_minima, 0), 70) INTO v_minima
    FROM public.cursos c WHERE c.id = v_curso;

  IF v_mejor IS NULL THEN
    RAISE EXCEPTION 'El alumno no ha presentado el examen final: no hay nada que certificar.'
      USING ERRCODE = '22023';
  END IF;
  IF v_mejor < v_minima THEN
    RAISE EXCEPTION 'El alumno no ha aprobado el examen (mejor resultado: %, mínimo: %). No se emite constancia sin aprobación.',
      v_mejor, v_minima
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellidos)), ''), u.email, 'Alumno')
    INTO v_nombre FROM public.usuarios u WHERE u.id = v_alumno;

  SELECT c.nombre, c.horas INTO v_curso_nom, v_horas
    FROM public.cursos c WHERE c.id = v_curso;

  -- (2) Quién emite: foto de su nombre y su rol de HOY.
  SELECT COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellidos)), ''), u.email),
         LOWER(BTRIM(u.rol))
    INTO v_actor_nom, v_actor_rol
    FROM public.usuarios u WHERE u.id = auth.uid();

  -- El folio al FINAL, después de todas las guardas (nextval no se deshace).
  v_folio := public.generar_folio_constancia(v_prefijo);

  BEGIN
    INSERT INTO public.curso_constancias
      (inscripcion_id, folio, horas, alumno_nombre, curso_nombre, calificacion,
       emitida_por, emitida_por_nombre, emitida_por_rol)
    VALUES (p_inscripcion_id, v_folio, v_horas, v_nombre, v_curso_nom, v_mejor,
            auth.uid(), v_actor_nom, v_actor_rol)
    RETURNING curso_constancias.id, curso_constancias.emitido_en INTO v_id, v_emitido;
  EXCEPTION WHEN unique_violation THEN
    -- Con el candado de arriba no debería pasar; si pasa, gana la existente.
    SELECT c.id, c.folio, c.emitido_en INTO v_existente
      FROM public.curso_constancias c WHERE c.inscripcion_id = p_inscripcion_id;
    RETURN QUERY SELECT v_existente.id, v_existente.folio, v_existente.emitido_en, TRUE;
    RETURN;
  END;

  INSERT INTO public.curso_inscripcion_eventos
    (inscripcion_id, tipo, detalle, actor)
  VALUES (
    p_inscripcion_id, 'constancia_emitida',
    jsonb_build_object('folio', v_folio, 'calificacion', v_mejor,
                       'actor_nombre', v_actor_nom, 'actor_rol', v_actor_rol),
    auth.uid()
  );

  RETURN QUERY SELECT v_id, v_folio, v_emitido, FALSE;
END;
$$;

-- ── GRANTS (Bug 77: explícitos). `authenticated` entra (la sesión de quien
-- emite); la guarda es_staff() de adentro decide. anon fuera.
REVOKE ALL ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) FROM PUBLIC;
DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_emitir_constancia(UUID, TEXT, NUMERIC) TO service_role';
  END IF;
END
$g$;

NOTIFY pgrst, 'reload schema';

COMMIT;
