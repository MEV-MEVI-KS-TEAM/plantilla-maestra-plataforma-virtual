-- ============================================================================
-- D22d — LA RESPUESTA CORRECTA SOLO LA LEE EL SERVIDOR (BD)
-- (Bloque D; decisiones K-d4 a K-d10 de Kevin, 28-sep-2026)
-- ============================================================================
-- ⚠️ CÓRRELA SOLO DESPUÉS DE DESPLEGAR LA APP DE D22d (PR #273) EN ESE CLIENTE.
-- Con la app anterior, el quiz semanal y el examen mensual se quedan sin
-- preguntas y no guardan, sin avisar: la app vieja las leía con la sesión.
--
-- EL PROBLEMA. Con su propia sesión y la anon key (pública), por /rest/v1/…:
--   H1. Cualquier sesión leía la clave del quiz semanal (quiz_semana:
--       respuesta_correcta y la explicacion, que la delata) y las filas y el
--       texto de los tres bancos de preguntas, también de meses no pagados. #186
--       (Bug 221) cerró solo la columna respuesta_correcta de preguntas, en una
--       capa y sin CHECK.
--   H2. curso_examen_preguntas (el examen de la constancia) tenía una sola capa:
--       el GRANT SELECT de tabla a authenticated vuelve cada vez que se corre el
--       paso 6, y anon conserva el GRANT de fábrica.
--   H3. curso_examen_resultados.respuestas guarda el ✓/✗ por pregunta de cada
--       envío y el dueño lo leía: con reintento pendiente, es la eliminación
--       a → b → c que la revisión diferida (K-d3) quitó de la pantalla.
--   H4. Una sesión INSERTABA su propio intento aprobado (intentos_evaluacion,
--       100 y acreditado) y sus respuestas de quiz con correcta=true
--       (quiz_respuestas): la tarjeta, la ficha y el candado del quiz se forjaban.
--   H5. Donde quiz_respuestas no tenía RLS (serie CEEVA) o una permisiva de drift
--       la abría, una sesión leía las respuestas AJENAS del quiz: las marcadas
--       correcta=true dan la clave de cada pregunta.
--
-- LA SOLUCIÓN, en dos capas como D22c (K-d4):
--   · Filas: RLS encendida (K-d8: la serie CEEVA la traía apagada) + techo
--     RESTRICTIVE solo-admin, para toda operación, en preguntas, quiz_semana y
--     curso_examen_preguntas. Ninguna permisiva vieja o de drift (K-d9: se dejan
--     y se listan) lo ensancha. Se borra «lectura autenticados».
--   · Privilegios: REVOKE de tabla (quita también los GRANT por columna) + GRANT
--     SELECT de una LISTA BLANCA de columnas (K-d5): ninguna sesión lee
--     respuesta_correcta, explicacion, retroalimentacion ni una columna nueva.
--     Converge con #186: quien ya lo corrió, la corre encima. En
--     curso_examen_resultados, todo menos `respuestas` (la constancia lee
--     `porcentaje` con la sesión).
--   · K4 (K-d6): sin INSERT/UPDATE/DELETE con sesión en intentos_evaluacion y
--     quiz_respuestas (de tabla y de columna); el SELECT propio se queda. Se
--     borran «intentos: registrar propio intento» y «quiz_respuestas: registrar
--     propia».
--   · H5: RLS encendida y techo RESTRICTIVE de lectura «propio o admin» en
--     intentos_evaluacion y quiz_respuestas: cada quien lee lo suyo.
-- La app de D22d lee los bancos y escribe intentos y respuestas con el service
-- role DESPUÉS del gate; el editor admin, igual (verifyAdmin + service role).
--
-- Aplica a TODA base. Un cliente nuevo ya nace así (scripts/schema.sql,
-- supabase/schema.sql y 20260728120000_examen_final_cursos.sql corregidos).
-- Idempotente y transaccional. Córrela AL FINAL de 7bis (fila 23): una copia
-- vieja del paso 6 o de un schema reabre los privilegios, y los CHECK 28, 29 y
-- 30 lo marcan. Conexión en modo sesión (5432), nunca el pooler 6543 (Bug 228).
--
-- REVERSA DE EMERGENCIA (solo para un cliente que se quedó con la app anterior;
-- reabre las claves: vuelve a correr esta migración en cuanto despliegues D22d).
-- Reabre SOLO lo que la app anterior lee o escribe con la sesión: los bancos del
-- examen mensual y del quiz, y la escritura propia de intentos y respuestas (la
-- forma JSONB del quiz hace upsert: también UPDATE). El examen de curso no se
-- toca: la app anterior ya lo leía con el service role (y así corre igual en una
-- base sin módulo Cursos). Las cuatro partes juntas, en una transacción; sin la
-- (1) el techo sigue dando 0 filas aunque vuelvan las políticas:
--   (1) DROP POLICY IF EXISTS "preguntas: techo solo admin (D22d)" ON public.preguntas;
--       DROP POLICY IF EXISTS "quiz_semana: techo solo admin (D22d)" ON public.quiz_semana;
--   (2) CREATE POLICY "preguntas: lectura autenticados" ON public.preguntas FOR SELECT USING (auth.role() = 'authenticated');
--       CREATE POLICY "quiz_semana: lectura autenticados" ON public.quiz_semana FOR SELECT USING (auth.role() = 'authenticated');
--   (3) GRANT SELECT ON public.preguntas, public.quiz_semana TO authenticated;
--   (4) CREATE POLICY "intentos: registrar propio intento" ON public.intentos_evaluacion FOR INSERT WITH CHECK (alumno_id = auth.uid());
--       CREATE POLICY "quiz_respuestas: registrar propia" ON public.quiz_respuestas FOR INSERT WITH CHECK (alumno_id = auth.uid());
--       GRANT INSERT ON public.intentos_evaluacion, public.quiz_respuestas TO authenticated;
--       GRANT UPDATE ON public.quiz_respuestas TO authenticated;
-- ============================================================================

BEGIN;

DO $d22d$
DECLARE
  r        RECORD;
  v_t      TEXT;
  v_cols   TEXT;
  v_malas  TEXT;
  v_n      INTEGER;
  -- K-d5: lo ÚNICO que una sesión puede leer de cada banco (∩ columnas existentes).
  -- `opciones` es la forma JSONB del quiz (clave INTEGER aparte, que no entra).
  c_preguntas   CONSTANT TEXT[] := ARRAY['id', 'evaluacion_id', 'pregunta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'orden', 'activa', 'created_at'];
  c_quiz        CONSTANT TEXT[] := ARRAY['id', 'semana_id', 'pregunta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'opciones', 'orden', 'activa'];
  c_curso       CONSTANT TEXT[] := ARRAY['id', 'curso_id', 'orden', 'tema', 'enunciado', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d'];
  -- Nombres que delatan la respuesta: nunca legibles con sesión, estén donde estén.
  c_reveladoras CONSTANT TEXT[] := ARRAY['respuesta_correcta', 'explicacion', 'retroalimentacion'];
  c_bancos      CONSTANT TEXT[] := ARRAY['preguntas', 'quiz_semana', 'curso_examen_preguntas'];
  c_k4          CONSTANT TEXT[] := ARRAY['intentos_evaluacion', 'quiz_respuestas'];
  c_todas       CONSTANT TEXT[] := ARRAY['preguntas', 'quiz_semana', 'curso_examen_preguntas',
                                         'curso_examen_resultados', 'intentos_evaluacion', 'quiz_respuestas'];
BEGIN
  -- ── Preflight ─────────────────────────────────────────────────────────────
  IF to_regclass('public.preguntas') IS NULL OR to_regclass('public.quiz_semana') IS NULL THEN
    RAISE EXCEPTION 'D22d: falta public.preguntas o public.quiz_semana → corre primero scripts/schema.sql (o supabase/schema.sql)';
  END IF;
  -- es_admin() con S2: los techos la llaman; si no fuera SECURITY DEFINER con
  -- LOWER(rol), un admin con rol='ADMIN' dejaría de ver los bancos y una
  -- política que lea usuarios entraría en recursión (Bug 16).
  IF to_regprocedure('public.es_admin()') IS NULL
     OR NOT (SELECT p.prosecdef AND p.prosrc ~* 'lower\s*\(\s*rol\s*\)'
               FROM pg_proc p WHERE p.oid = to_regprocedure('public.es_admin()')) THEN
    RAISE EXCEPTION 'D22d: public.es_admin() falta o no tiene S2 (LOWER(rol) + SECURITY DEFINER) → corre supabase/migrations/20260729121000_fix_s2_es_admin.sql (cliente ya desplegado: scripts/fix-s1-s2-roles.sql) y vuelve a correr esta';
  END IF;
  -- FORCE RLS haría que las funciones SECURITY DEFINER que leen estas tablas
  -- (curso_emitir_constancia, candado_corregir_plan) pasaran por las políticas.
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO v_malas
    FROM pg_class c
   WHERE c.oid IN (SELECT to_regclass('public.' || x) FROM unnest(c_todas) AS x) AND c.relforcerowsecurity;
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22d: % tiene FORCE ROW LEVEL SECURITY; las funciones SECURITY DEFINER dejarían de ver. Quítalo (ALTER TABLE … NO FORCE ROW LEVEL SECURITY) o revisa a mano antes de correr esta', v_malas;
  END IF;
  -- Toda función SECURITY DEFINER que lea estas tablas y que una sesión pueda
  -- ejecutar tiene que ser del dueño de la tabla, o de un rol con BYPASSRLS o
  -- superusuario: si no, los techos y el REVOKE la frenarían. Si solo la ejecuta
  -- el servidor (candado_corregir_plan), basta un aviso.
  FOR r IN
    SELECT p.oid::regprocedure AS fn,
           bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')
                   OR has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS con_sesion
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles o ON o.oid = p.proowner
      JOIN pg_class t ON t.oid IN (SELECT to_regclass('public.' || x) FROM unnest(c_todas) AS x)
     WHERE n.nspname = 'public' AND p.prosecdef
       AND p.prosrc ~ ('\m' || t.relname || '\M')
       AND p.proowner <> t.relowner AND NOT (o.rolbypassrls OR o.rolsuper)
     GROUP BY p.oid
  LOOP
    IF r.con_sesion THEN
      RAISE EXCEPTION 'D22d: % es SECURITY DEFINER, la puede ejecutar una sesión y su dueño no es el de las tablas ni tiene BYPASSRLS: con el cierre dejaría de leer. Revisa su dueño (ALTER FUNCTION … OWNER TO <dueño de la tabla>) y vuelve a correr esta', r.fn;
    END IF;
    RAISE NOTICE 'D22d: % es SECURITY DEFINER con otro dueño, pero solo la ejecuta el servidor: no se toca.', r.fn;
  END LOOP;

  -- ── Capa 1: filas (RLS + techo solo-admin) en los tres bancos ─────────────
  FOREACH v_t IN ARRAY c_bancos LOOP
    CONTINUE WHEN to_regclass('public.' || v_t) IS NULL;   -- sin módulo Cursos
    IF NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.' || v_t)) THEN
      RAISE NOTICE 'D22d: % tenía la RLS APAGADA (serie CEEVA): se enciende (K-d8).', v_t;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_t);
    END IF;
    -- El admin gestiona el banco con una permisiva; si falta (CEEVA), se crea. Un
    -- techo solo no concede filas (y el CHECK 13 no lo cuenta).
    -- (Por nombre también: una política ya llamada así con otro texto haría abortar el CREATE.)
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                    WHERE schemaname = 'public' AND tablename = v_t
                      AND (policyname = v_t || ': admin gestiona'
                           OR (permissive = 'PERMISSIVE' AND cmd = 'ALL' AND coalesce(qual, '') ~* '(es_admin|is_admin)\s*\('))) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I USING (public.es_admin())', v_t || ': admin gestiona', v_t);
      RAISE NOTICE 'D22d: % — se creó «%: admin gestiona».', v_t, v_t;
    END IF;
  END LOOP;

  DROP POLICY IF EXISTS "preguntas: lectura autenticados" ON public.preguntas;
  DROP POLICY IF EXISTS "preguntas: techo solo admin (D22d)" ON public.preguntas;
  CREATE POLICY "preguntas: techo solo admin (D22d)" ON public.preguntas
    AS RESTRICTIVE FOR ALL TO anon, authenticated
    USING (public.es_admin()) WITH CHECK (public.es_admin());

  DROP POLICY IF EXISTS "quiz_semana: lectura autenticados" ON public.quiz_semana;
  DROP POLICY IF EXISTS "quiz_semana: techo solo admin (D22d)" ON public.quiz_semana;
  CREATE POLICY "quiz_semana: techo solo admin (D22d)" ON public.quiz_semana
    AS RESTRICTIVE FOR ALL TO anon, authenticated
    USING (public.es_admin()) WITH CHECK (public.es_admin());

  -- curso_examen_preguntas solo existe con el paso 6: dinámico para no abortar
  -- en una base sin módulo Cursos.
  IF to_regclass('public.curso_examen_preguntas') IS NOT NULL THEN
    EXECUTE $p$DROP POLICY IF EXISTS "curso_examen_preguntas: techo solo admin (D22d)" ON public.curso_examen_preguntas$p$;
    EXECUTE $p$CREATE POLICY "curso_examen_preguntas: techo solo admin (D22d)" ON public.curso_examen_preguntas
      AS RESTRICTIVE FOR ALL TO anon, authenticated
      USING (public.es_admin()) WITH CHECK (public.es_admin())$p$;
  END IF;

  -- K-d9: las permisivas de drift se dejan (el techo las frena) y se listan.
  SELECT string_agg(tablename || ' → «' || policyname || '»', ', ' ORDER BY tablename, policyname) INTO v_malas
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = ANY (c_bancos) AND permissive = 'PERMISSIVE'
     AND cmd IN ('SELECT', 'ALL') AND coalesce(qual, '') !~* '(es_admin|is_admin)\s*\(';
  IF v_malas IS NOT NULL THEN
    RAISE NOTICE 'D22d: permisivas de lectura sin admin (las frena el techo; se dejan, K-d9): %', v_malas;
  END IF;

  -- ── Capa 2: privilegios por lista blanca (K-d5) ────────────────────────────
  -- El REVOKE de tabla quita también los GRANT por columna (el de #186, uno
  -- viejo); después solo vuelve la lista blanca ∩ columnas existentes.
  FOR r IN SELECT * FROM (VALUES ('preguntas', c_preguntas), ('quiz_semana', c_quiz),
                                 ('curso_examen_preguntas', c_curso)) AS b(tabla, lista) LOOP
    CONTINUE WHEN to_regclass('public.' || r.tabla) IS NULL;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, PUBLIC', r.tabla);
    EXECUTE format('REVOKE SELECT ON public.%I FROM authenticated', r.tabla);
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum) INTO v_cols
      FROM pg_attribute a
     WHERE a.attrelid = to_regclass('public.' || r.tabla) AND a.attnum > 0 AND NOT a.attisdropped
       AND a.attname = ANY (r.lista);
    IF v_cols IS NOT NULL THEN
      EXECUTE format('GRANT SELECT (%s) ON public.%I TO authenticated', v_cols, r.tabla);
    END IF;
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tabla);
    RAISE NOTICE 'D22d: % — con sesión solo se leen: %', r.tabla, coalesce(v_cols, '(nada)');
  END LOOP;

  -- K-d3: el ✓/✗ guardado de cada envío no se lee con sesión; lo demás sí (la
  -- constancia lee `porcentaje` con la sesión del alumno).
  IF to_regclass('public.curso_examen_resultados') IS NOT NULL THEN
    REVOKE ALL ON public.curso_examen_resultados FROM anon, PUBLIC;
    REVOKE SELECT ON public.curso_examen_resultados FROM authenticated;
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum) INTO v_cols
      FROM pg_attribute a
     WHERE a.attrelid = 'public.curso_examen_resultados'::regclass AND a.attnum > 0 AND NOT a.attisdropped
       AND a.attname <> 'respuestas';
    EXECUTE format('GRANT SELECT (%s) ON public.curso_examen_resultados TO authenticated', v_cols);
    GRANT ALL ON public.curso_examen_resultados TO service_role;
    RAISE NOTICE 'D22d: curso_examen_resultados — «respuestas» ya no se lee con sesión.';
  END IF;

  -- ── K4 (K-d6): intentos y respuestas del quiz solo los escribe el servidor ─
  IF to_regclass('public.intentos_evaluacion') IS NOT NULL THEN
    DROP POLICY IF EXISTS "intentos: registrar propio intento" ON public.intentos_evaluacion;
  END IF;
  IF to_regclass('public.quiz_respuestas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "quiz_respuestas: registrar propia" ON public.quiz_respuestas;
  END IF;
  FOREACH v_t IN ARRAY c_k4 LOOP
    CONTINUE WHEN to_regclass('public.' || v_t) IS NULL;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, PUBLIC', v_t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', v_t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', v_t);
    -- H5: cada quien lee lo suyo. Sin RLS (CEEVA) una sesión leía las respuestas
    -- ajenas del quiz, y las marcadas correcta=true dan la clave.
    IF NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.' || v_t)) THEN
      RAISE NOTICE 'D22d: % tenía la RLS APAGADA (serie CEEVA): se enciende.', v_t;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_t);
    END IF;
    -- (Por nombre también, y «uid()» sin esquema: pg_policies omite «auth.» si está en el search_path.)
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                    WHERE schemaname = 'public' AND tablename = v_t
                      AND (policyname = CASE v_t WHEN 'intentos_evaluacion' THEN 'intentos: ver propios intentos' ELSE 'quiz_respuestas: ver propias' END
                           OR (permissive = 'PERMISSIVE' AND cmd IN ('SELECT', 'ALL') AND coalesce(qual, '') ~* '(\m|\.)uid\s*\('))) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (alumno_id = auth.uid() OR public.es_admin())',
                     CASE v_t WHEN 'intentos_evaluacion' THEN 'intentos: ver propios intentos' ELSE 'quiz_respuestas: ver propias' END, v_t);
      RAISE NOTICE 'D22d: % — se creó la lectura propia (o admin).', v_t;
    END IF;
  END LOOP;
  IF to_regclass('public.intentos_evaluacion') IS NOT NULL THEN
    DROP POLICY IF EXISTS "intentos: techo propio o admin (D22d)" ON public.intentos_evaluacion;
    CREATE POLICY "intentos: techo propio o admin (D22d)" ON public.intentos_evaluacion
      AS RESTRICTIVE FOR SELECT TO anon, authenticated
      USING (alumno_id = auth.uid() OR public.es_admin());
  END IF;
  IF to_regclass('public.quiz_respuestas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "quiz_respuestas: techo propio o admin (D22d)" ON public.quiz_respuestas;
    CREATE POLICY "quiz_respuestas: techo propio o admin (D22d)" ON public.quiz_respuestas
      AS RESTRICTIVE FOR SELECT TO anon, authenticated
      USING (alumno_id = auth.uid() OR public.es_admin());
  END IF;
  SELECT string_agg(tablename || ' → «' || policyname || '»', ', ' ORDER BY tablename, policyname) INTO v_malas
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = ANY (c_k4) AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
     AND coalesce(qual, with_check, '') !~* '(es_admin|is_admin)\s*\(';
  IF v_malas IS NOT NULL THEN
    RAISE NOTICE 'D22d: políticas de escritura sin admin que quedan inertes (sin privilegio): %', v_malas;
  END IF;

  -- ── Epílogo: nada quedó abierto ────────────────────────────────────────────
  -- (a) Ninguna sesión lee una columna reveladora ni una fuera de la lista blanca.
  SELECT string_agg(DISTINCT ro.rol || ' → ' || c.relname || '.' || a.attname, ', ') INTO v_malas
    FROM unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
   CROSS JOIN pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
   WHERE c.oid IN (SELECT to_regclass('public.' || x) FROM unnest(c_bancos) AS x)
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ro.rol)
     AND has_column_privilege(ro.rol, c.oid, a.attnum, 'SELECT')
     AND (a.attname = ANY (c_reveladoras)
          OR NOT (a.attname = ANY (CASE c.relname WHEN 'preguntas' THEN c_preguntas
                                                   WHEN 'quiz_semana' THEN c_quiz
                                                   ELSE c_curso END))
          OR ro.rol = 'anon');
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22d: tras el REVOKE una sesión todavía lee (%): ¿un rol hereda de otro? Revisa los GRANT a mano.', v_malas;
  END IF;
  IF to_regclass('public.curso_examen_resultados') IS NOT NULL THEN
    IF has_any_column_privilege('anon', 'public.curso_examen_resultados', 'SELECT')
       OR (EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = 'public.curso_examen_resultados'::regclass
                      AND a.attname = 'respuestas' AND NOT a.attisdropped)
           AND has_column_privilege('authenticated', 'public.curso_examen_resultados', 'respuestas', 'SELECT')) THEN
      RAISE EXCEPTION 'D22d: curso_examen_resultados.respuestas sigue legible con sesión.';
    END IF;
  END IF;
  -- (b) RLS encendida y techo en cada banco existente.
  SELECT string_agg(x, ', ') INTO v_malas
    FROM unnest(c_bancos) AS x
   WHERE to_regclass('public.' || x) IS NOT NULL
     AND (NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.' || x))
          OR NOT EXISTS (SELECT 1 FROM pg_policies p
                          WHERE p.schemaname = 'public' AND p.tablename = x AND p.permissive = 'RESTRICTIVE'
                            AND p.cmd IN ('ALL', 'SELECT') AND p.roles @> ARRAY['anon', 'authenticated']::name[]
                            AND lower(regexp_replace(coalesce(p.qual, ''), '[\s()]|public\.', '', 'g')) IN ('es_admin', 'is_admin')));
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22d: sin RLS o sin techo solo-admin: %.', v_malas;
  END IF;
  -- (c) K4: ni de tabla ni de columna.
  SELECT string_agg(ro.rol || ' ' || lower(pv.p) || ' ' || x, ', ') INTO v_malas
    FROM unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
   CROSS JOIN unnest(ARRAY['INSERT', 'UPDATE', 'DELETE']) AS pv(p)
   CROSS JOIN unnest(c_k4) AS x
   WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ro.rol)
     AND CASE WHEN to_regclass('public.' || x) IS NULL THEN false
              ELSE has_table_privilege(ro.rol, to_regclass('public.' || x), pv.p)
                   OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, to_regclass('public.' || x), pv.p)) END;
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22d: intentos o respuestas del quiz siguen escribibles con sesión (%).', v_malas;
  END IF;
  -- (d) H5: RLS y techo «propio o admin» en las dos.
  SELECT string_agg(x, ', ') INTO v_malas
    FROM unnest(c_k4) AS x
   WHERE to_regclass('public.' || x) IS NOT NULL
     AND (NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.' || x))
          OR NOT EXISTS (SELECT 1 FROM pg_policies p
                          WHERE p.schemaname = 'public' AND p.tablename = x AND p.permissive = 'RESTRICTIVE'
                            AND p.cmd IN ('ALL', 'SELECT') AND p.roles @> ARRAY['anon', 'authenticated']::name[]
                            AND lower(regexp_replace(coalesce(p.qual, ''), '[\s()]|public\.', '', 'g')) = 'alumno_id=auth.uidores_admin'));
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'D22d: sin RLS o sin techo de lectura propio o admin: %.', v_malas;
  END IF;
  SELECT count(*) INTO v_n FROM pg_policies
   WHERE schemaname = 'public' AND permissive = 'RESTRICTIVE' AND policyname LIKE '%: techo solo admin (D22d)';
  RAISE NOTICE 'D22d: listo — % techos; los bancos solo los lee el servidor y el admin; intentos y respuestas del quiz solo los escribe el servidor.', v_n;
END
$d22d$;

NOTIFY pgrst, 'reload schema';

COMMIT;
