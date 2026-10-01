-- ============================================================================
-- #255 — LA VENTANA DE CURSOS CUENTA POSICIONES, NO EL `orden` CRUDO
-- ============================================================================
-- EL PROBLEMA (#255, Bug 238 y Nota 251 del PLAYBOOK, #204 en la flota).
--   B2 abría un módulo si `orden < meses_desbloqueados × modulos_por_mes`. El
--   límite es una CANTIDAD de módulos y el `orden` se comparaba CRUDO, dando por
--   hecho que va de 0 a N-1, seguido. No siempre:
--     · los seeds de banco-cursos-ingreso (antes de b321d8f) y de
--       banco-acuerdo-286 (antes de 5301b3b), hasta el 25-sep-2026, lo
--       escribieron en BASE 1 (1..N);
--     · un borrado a mano (fuera de curso_borrar_modulo) deja HUECOS.
--   Con eso cada mes abría un módulo menos y, al tope, el último no se abría
--   nunca (10 módulos a 2 por mes: tope 5, límite 10, `10 < 10` es falso). El
--   examen final, que compara el límite con el CONTEO, sí se abría: el alumno lo
--   presentaba sin ver el último módulo. Y el reporte decía 10/10.
--
-- LA REGLA NUEVA (decisión de Kevin, 30-sep-2026: opción 3 con «dense»).
--   La POSICIÓN de un módulo es cuántos `orden` DISTINTOS de su curso hay por
--   debajo del suyo (public.curso_modulo_posicion). Un módulo se ve si
--     posición < meses_desbloqueados × modulos_por_mes
--   con la comparación ESTRICTA de siempre. NO se cambia `<` por `<=` (regla del
--   Bug 238): eso les regalaría un módulo por mes a los cursos creados desde el
--   panel.
--
-- POR QUÉ NADIE PIERDE NADA.
--   · Con `orden` 0..N-1 seguidos (lo que escriben la app y los bancos de hoy) la
--     posición ES el `orden`: un curso sano no cambia en nada.
--   · Con `orden` ≥ 0, debajo de un `orden` k hay a lo más k valores distintos:
--     la posición nunca pasa del `orden`, así que nadie ve MENOS que antes.
--   · Dos módulos con el mismo `orden` comparten posición y se abren juntos,
--     como antes («dense»; «rank» los separaba y a alguien le quitaba uno).
--   · Un `orden` NULL no tiene posición: queda BLOQUEADO, también con acceso
--     total (antes: COALESCE(orden, 2147483647), el mismo resultado).
--   La compuerta del paso 5 lo comprueba sobre las inscripciones REALES de la
--   base: si alguna viera menos módulos que antes, aborta y no cambia nada.
--   Solo podría pasar con un `orden` NEGATIVO (nada lo escribe: ni la app, ni
--   los seeds, ni el reordenador); ese curso es «RARO» y lo revisa Kevin.
--
-- QUÉ SE REDEFINE.
--   1. public.curso_modulo_posicion(uuid) — NUEVA. El único lugar de la regla
--      en SQL; su espejo en TypeScript es posicionesVentana()
--      (src/lib/cursos/acceso.ts), con prueba de paridad.
--   2. public.curso_modulo_en_ventana(uuid) — de B2. De ella cuelgan
--      curso_leccion_en_ventana, curso_leccion_en_ventana_txt (Storage) y las
--      políticas de curso_modulos, curso_lecciones y curso_progreso: heredan el
--      cambio solas. Misma firma y mismos permisos.
--   3. public.reporte_curso_inscripciones() — de B6/C3b. `modulos_visibles`
--      cuenta con la misma posición: el reporte dice lo que el alumno ve.
--   curso_ventana_limite (el techo), curso_tope_meses y las funciones de abrir,
--   cerrar, asignar y cobrar NO cambian.
--
-- RE-CORRER B2, B6 O C3b DESPUÉS NO LA REVIERTE (familia del Bug 239).
--   B2 y C3b guardan la versión de esta migración (la huella es que el cuerpo
--   llame a curso_modulo_posicion) y la restauran al final. B6 ya conserva el
--   reporte vigente porque trae `acceso_total` en el cuerpo (el criterio de su
--   prólogo de C3b). El CHECK 31 de scripts/post-setup-check.sql falla si la
--   ventana o el reporte vuelven a la versión cruda.
--
-- NOMBRE Y FECHA. 20260930120000_fix255_*: corre después de todo lo del
--   30-sep (E3 es 20260929120000). La migración que venga con #287 (rol del
--   alumno en las funciones curso_*) debe tomar una fecha POSTERIOR
--   (20261001… o después) y otro prefijo; no toca estas funciones.
--
-- IDEMPOTENTE Y RE-EJECUTABLE. En transacción. Requiere B1, B2, B3, B6 y C3b.
-- Aplicar por conexión directa o pooler en MODO SESIÓN (5432, NUNCA 6543).
-- ============================================================================

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.curso_modulos') IS NULL OR to_regclass('public.curso_inscripciones') IS NULL THEN
    RAISE EXCEPTION 'Falta el módulo de cursos. Corre antes scripts/migracion-cursos-diplomados.sql.';
  END IF;
  IF to_regprocedure('public.curso_ventana_limite(uuid,uuid)') IS NULL
     OR to_regprocedure('public.curso_modulo_en_ventana(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B2 (20260730130000_b2_gate_ventana_cursos.sql).';
  END IF;
  IF to_regprocedure('public.curso_tope_meses(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B3 (20260730140000_b3_abrir_mes_y_pagos_curso.sql).';
  END IF;
  IF to_regprocedure('public.reporte_curso_inscripciones()') IS NULL THEN
    RAISE EXCEPTION 'Falta la migración B6 (20260730160000_b6_reportes_por_vertical.sql).';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'curso_inscripciones'
                    AND column_name = 'acceso_total') THEN
    RAISE EXCEPTION 'Falta la migración C3b (20260926120000_c3b_acceso_total_cursos.sql): corre antes toda la cadena 20260730* y C3b.';
  END IF;
END
$preflight$;

-- ── Foto ANTES (para la compuerta del paso 5) ───────────────────────────────
-- Por inscripción: cuántos módulos ve hoy con la regla vieja (el `orden` crudo,
-- el cuerpo de B2), con el mismo techo de siempre.
DROP TABLE IF EXISTS pg_temp.f255_antes;
CREATE TEMP TABLE f255_antes AS
SELECT ci.id AS inscripcion_id,
       (SELECT count(*) FROM public.curso_modulos m
         WHERE m.curso_id = ci.curso_id
           AND COALESCE(m.orden, 2147483647) < public.curso_ventana_limite(ci.curso_id, ci.alumno_id))::int AS ve
  FROM public.curso_inscripciones ci;


-- ════════════════════════════════════════════════════════════════════════════
-- 1) La posición de un módulo dentro de su curso («dense», base 0)
-- ════════════════════════════════════════════════════════════════════════════
-- SECURITY DEFINER + STABLE + SET search_path, como las funciones de B2: corre
-- como el dueño, así que leer curso_modulos aquí NO vuelve a disparar la RLS de
-- curso_modulos (la recursión del Bug 16). NULL si el módulo no existe o no
-- tiene `orden`: NULL < límite no es verdadero, así que queda bloqueado.
CREATE OR REPLACE FUNCTION public.curso_modulo_posicion(p_modulo_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- #255: cuántos `orden` DISTINTOS de su curso hay por debajo del suyo.
  -- Espejo: posicionesVentana() en src/lib/cursos/acceso.ts.
  SELECT CASE
           WHEN m.orden IS NULL THEN NULL
           ELSE (SELECT count(DISTINCT m2.orden)
                   FROM public.curso_modulos m2
                  WHERE m2.curso_id = m.curso_id
                    AND m2.orden < m.orden)::integer
         END
    FROM public.curso_modulos m
   WHERE m.id = p_modulo_id;
$$;

COMMENT ON FUNCTION public.curso_modulo_posicion(UUID) IS
  '#255: posición base 0 del módulo en su curso = cuántos orden DISTINTOS hay '
  'por debajo del suyo. Es el eje de la ventana (curso_modulo_en_ventana) y de '
  'modulos_visibles en reporte_curso_inscripciones. NULL si no tiene orden.';

-- La ventana la llama como el dueño (SECURITY DEFINER): authenticated no la
-- necesita. El reporte la llama con service_role.
REVOKE ALL ON FUNCTION public.curso_modulo_posicion(UUID) FROM PUBLIC;
DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_modulo_posicion(UUID) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.curso_modulo_posicion(UUID) FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.curso_modulo_posicion(UUID) TO service_role';
  END IF;
END
$grants$;


-- ════════════════════════════════════════════════════════════════════════════
-- 2) La ventana: posición < techo (ESTRICTO)
-- ════════════════════════════════════════════════════════════════════════════
-- Misma firma, mismo SECURITY DEFINER y mismos permisos que la de B2 (CREATE OR
-- REPLACE los conserva). ⚠️ NO MIRA curso_progreso (Bug 61): un módulo
-- completado sigue ocupando su posición.
CREATE OR REPLACE FUNCTION public.curso_modulo_en_ventana(p_modulo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- #255: la POSICIÓN del módulo (curso_modulo_posicion), no su `orden` crudo.
  -- Comparación ESTRICTA: `<=` regalaría un módulo por mes (Bug 238).
  SELECT EXISTS (
    SELECT 1
      FROM public.curso_modulos m
     WHERE m.id = p_modulo_id
       AND public.curso_modulo_posicion(m.id)
           < public.curso_ventana_limite(m.curso_id, auth.uid())
  );
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 3) El reporte cuenta lo que el alumno ve
-- ════════════════════════════════════════════════════════════════════════════
-- Mismo cuerpo y firma que C3b. Solo cambia modulos_visibles: los módulos cuya
-- posición queda por debajo del techo de la inscripción (con acceso total,
-- 2147483647: todos los que tienen orden). Antes era LEAST(techo, total), que
-- en base 1 decía 10/10 cuando el alumno veía 9.
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
         -- #255: la misma posición que la ventana (curso_modulo_posicion).
         (SELECT COUNT(*) FROM public.curso_modulos m
           WHERE m.curso_id = c.id
             AND public.curso_modulo_posicion(m.id) <
                 CASE WHEN i.acceso_total THEN 2147483647
                      ELSE i.meses_desbloqueados * GREATEST(c.modulos_por_mes, 0) END
         )::integer,
         (SELECT COUNT(*) FROM public.curso_modulos m WHERE m.curso_id = c.id)::integer,
         i.fecha_vencimiento
    FROM public.curso_inscripciones i
    JOIN public.cursos   c ON c.id = i.curso_id
    JOIN public.alumnos  a ON a.id = i.alumno_id
    JOIN public.usuarios u ON u.id = a.id
   ORDER BY c.nombre, u.nombre, u.apellidos;
$$;

-- Los mismos permisos que B6: solo el service role (el endpoint del panel).
REVOKE EXECUTE ON FUNCTION public.reporte_curso_inscripciones() FROM PUBLIC;
DO $grants_rep$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.reporte_curso_inscripciones() FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.reporte_curso_inscripciones() FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.reporte_curso_inscripciones() TO service_role';
  END IF;
END
$grants_rep$;


-- ════════════════════════════════════════════════════════════════════════════
-- 4) Índice para la posición
-- ════════════════════════════════════════════════════════════════════════════
-- La posición cuenta los `orden` del curso por cada módulo que se lee. Con el
-- índice es una lectura acotada al curso; los cursos tienen decenas de módulos.
CREATE INDEX IF NOT EXISTS idx_curso_modulos_curso_orden
  ON public.curso_modulos (curso_id, orden);


-- ════════════════════════════════════════════════════════════════════════════
-- 5) Compuerta: nadie ve menos que antes
-- ════════════════════════════════════════════════════════════════════════════
-- Misma cuenta DESPUÉS, por inscripción, con la regla nueva. Si alguna ve menos
-- que antes, error: la transacción se deshace entera y la base queda como
-- estaba. En una base sin inscripciones (un combo nuevo) no hay nada que comparar.
DO $compuerta$
DECLARE
  v_menos INTEGER;
  v_mas   INTEGER;
BEGIN
  WITH despues AS (
    SELECT ci.id AS inscripcion_id,
           (SELECT count(*) FROM public.curso_modulos m
             WHERE m.curso_id = ci.curso_id
               AND public.curso_modulo_posicion(m.id) < public.curso_ventana_limite(ci.curso_id, ci.alumno_id))::int AS ve
      FROM public.curso_inscripciones ci
  )
  SELECT count(*) FILTER (WHERE d.ve < a.ve), count(*) FILTER (WHERE d.ve > a.ve)
    INTO v_menos, v_mas
    FROM pg_temp.f255_antes a
    JOIN despues d USING (inscripcion_id);

  IF v_menos > 0 THEN
    RAISE EXCEPTION '#255: % inscripción(es) verían MENOS módulos que antes (¿un curso con `orden` negativo?). No se cambió nada: pásaselo a Kevin.', v_menos;
  END IF;
  IF v_mas > 0 THEN
    RAISE NOTICE '#255: % inscripción(es) ven ahora los módulos que les faltaban (cursos en base 1 o con huecos).', v_mas;
  END IF;
END
$compuerta$;
DROP TABLE IF EXISTS pg_temp.f255_antes;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── Verificación manual (no altera nada) ────────────────────────────────────
-- 1) Posición de cada módulo de un curso (base 0, seguida aunque el orden no):
--   SELECT nombre, orden, public.curso_modulo_posicion(id) AS posicion
--     FROM public.curso_modulos WHERE curso_id = '<curso>' ORDER BY orden, id;
-- 2) Lo que ve un alumno, con su sesión (el admin ve todo: su vista no sirve).
-- 3) El CHECK 31 de scripts/post-setup-check.sql debe salir ✅.
