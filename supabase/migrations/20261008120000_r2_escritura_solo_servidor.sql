-- ============================================================================
-- R2 — LO QUE DA AVANCE, LOGROS, CALIFICACIÓN O ACCESO SOLO LO ESCRIBE EL SERVIDOR
-- (soporte IVS ronda 2, 8-oct-2026: el mismo cierre que IVS 02-migracion-seguridad
-- y 02c, portado de vuelta a la plantilla)
-- ============================================================================
-- ⚠️ CÓRRELA SOLO DESPUÉS DE DESPLEGAR LA APP DE ESTA RAMA EN ESE CLIENTE.
-- Con la app anterior, «Marcar semana como completada», el tiempo de estudio y
-- los logros se escribían con la sesión del alumno: dejan de guardarse (500 en
-- /api/alumno/progreso/semana y /tiempo; los logros fallan en silencio).
--
-- EL PROBLEMA. Con su propia sesión y la anon key (pública), por /rest/v1/…:
--   H1. Un alumno se INSERTABA o ACTUALIZABA progreso_semanas de cualquier
--       semana (completada=true), también de meses no pagados: la fila es la que
--       abre la semana siguiente en el roadmap (goteo), cuenta «semanas
--       trabajadas» en la ficha y dispara el logro «materia completada».
--   H2. Se insertaba logros_alumno y escribía racha_actividad a su gusto.
--   H3. calificaciones, constancias, alumnos (INSERT/DELETE) y documentos_alumno
--       (UPDATE/DELETE) tenían UNA sola capa: la RLS («admin gestiona»); los
--       GRANT de fábrica de Supabase seguían dando INSERT/UPDATE/DELETE/TRUNCATE.
--       Un GRANT o una permisiva de drift bastaban para que un alumno se
--       acreditara o se aprobara su propio documento.
--   H4. Sin índice único (alumno_id, quiz_id) en quiz_respuestas, 4 POST
--       simultáneos al quiz (uno por opción) guardaban los 4 y cada uno recibía
--       su veredicto: oráculo de la clave por carrera. Igual con el último
--       intento del examen mensual: dos envíos simultáneos con el mismo
--       numero_intento pasaban los dos (un intento de regalo).
--   H5. generar_matricula() (SECURITY DEFINER) la ejecutaba anon por
--       /rest/v1/rpc: el conteo de alumnos y el prefijo, sin sesión.
--   H6. anon conservaba INSERT/UPDATE/DELETE/TRUNCATE de fábrica en casi todas
--       las tablas de public (solo la RLS lo frenaba; TRUNCATE ni eso), y
--       authenticated TRUNCATE en todas.
--   H7. El fix de Bug 52 (UPDATE del propio rol) solo vivía en los instaladores y
--       en scripts/fix-escalada-rol.sql: una base vieja sin ese retrofit seguía
--       abierta y ningún CHECK lo veía.
--
-- LA SOLUCIÓN (privilegios + techos RESTRICTIVE, como D22c y D22d):
--   · intentos_evaluacion, calificaciones, quiz_respuestas, progreso_semanas,
--     logros_alumno, racha_actividad, alumnos, documentos_alumno y constancias:
--     sin INSERT/UPDATE/DELETE/TRUNCATE con sesión (de tabla y de columna); el
--     SELECT se queda y un techo RESTRICTIVE «propio o admin» lo acota (ninguna
--     permisiva vieja o de drift lo ensancha). Se borran las políticas de
--     escritura propia que quedan inertes.
--   · notas_alumno: el alumno SÍ escribe sus apuntes (decisión de IVS: no dan
--     acceso ni calificación), con techo «propio o admin» para toda operación y
--     sin DELETE/TRUNCATE.
--   · usuarios: sin INSERT/DELETE con sesión; UPDATE solo de nombre, apellidos,
--     teléfono y foto (Bug 52/220), con WITH CHECK explícito.
--   · Contenido (materias, meses, semanas, materiales, evaluaciones, glosario y
--     los dos bancos): sin escritura con sesión (el panel escribe con el service
--     role desde verifyAdmin).
--   · Índices únicos quiz_respuestas (alumno_id, quiz_id) e intentos_evaluacion
--     (alumno_id, evaluacion_id, numero_intento). La app trata el 23505.
--   · generar_matricula() solo service_role; las funciones de trigger sin
--     EXECUTE para sesiones (el trigger no lo necesita para dispararse).
--   · anon sin INSERT/UPDATE/DELETE/TRUNCATE en public, salvo el INSERT que una
--     política TO anon permite a propósito (keep_alive_log, Bug 46); nadie con
--     sesión hace TRUNCATE.
-- La app de esta rama escribe progreso, tiempo y logros con el service role
-- DESPUÉS del gate (tieneAccesoSemana / tieneAccesoEvaluacion); la racha la
-- sigue moviendo trg_actualizar_racha.
--
-- Aplica a TODA base. Un cliente nuevo ya nace así (supabase/schema.sql y
-- scripts/schema.sql corregidos). Idempotente y transaccional. Córrela AL FINAL
-- de 7bis: una copia vieja de un schema o de 20260402140000 reabre los
-- privilegios, y los CHECK 32, 33 y 34 lo marcan. Conexión en modo sesión
-- (5432), nunca el pooler 6543 (Bug 228). Lo prueba con RLS real
-- scripts/verificar-schema/explotaciones-r2.mjs.
--
-- SI ABORTA POR DRIFT DE ALUMNOS (alumnos.usuario_id ≠ alumnos.id, p. ej. EDVEX):
-- esa base no es de la plantilla tal cual; sus techos tendrían que ir por el
-- puente usuario_id. No la fuerces.
--
-- SI ABORTA POR DUPLICADOS (quiz_respuestas o intentos_evaluacion): NO se borra
-- nada de alumnos aquí. Para verlos:
--   SELECT alumno_id, quiz_id, count(*) FROM public.quiz_respuestas
--    GROUP BY 1, 2 HAVING count(*) > 1;
--   SELECT alumno_id, evaluacion_id, numero_intento, count(*) FROM public.intentos_evaluacion
--    GROUP BY 1, 2, 3 HAVING count(*) > 1;
-- La app ya califica con la MÁS ANTIGUA de cada pregunta (fecha, id): depurar
-- dejando esa fila no cambia ningún veredicto. Respaldar, depurar a mano y
-- volver a correr esta.
--
-- REVERSA DE EMERGENCIA (solo si se corrió con la app anterior desplegada;
-- reabre H1/H2: vuelve a correr esta migración en cuanto despliegues la app):
--   GRANT INSERT, UPDATE ON public.progreso_semanas TO authenticated;
--   GRANT INSERT ON public.logros_alumno TO authenticated;
--   CREATE POLICY "progreso: registrar propio progreso" ON public.progreso_semanas FOR INSERT WITH CHECK (alumno_id = auth.uid());
--   CREATE POLICY "progreso: actualizar propio progreso" ON public.progreso_semanas FOR UPDATE USING (alumno_id = auth.uid());
--   CREATE POLICY "logros: insertar propios" ON public.logros_alumno FOR INSERT WITH CHECK (alumno_id = auth.uid());
--   (la racha la escribe el trigger con los privilegios de quien inserta el
--    progreso: con la app anterior también hace falta
--    GRANT INSERT, UPDATE ON public.racha_actividad TO authenticated y sus dos
--    políticas «racha: insertar propia» / «racha: actualizar propia».)
-- ============================================================================

BEGIN;

DO $r2$
DECLARE
  r        RECORD;
  v_t      TEXT;
  v_malas  TEXT;
  v_cols   TEXT;
  -- Solo las escribe el servidor (service role) o una función SECURITY DEFINER.
  c_srv       CONSTANT TEXT[] := ARRAY['intentos_evaluacion', 'calificaciones', 'quiz_respuestas',
                                       'progreso_semanas', 'logros_alumno', 'racha_actividad',
                                       'alumnos', 'documentos_alumno', 'constancias'];
  -- Contenido: lo edita el panel con el service role.
  c_contenido CONSTANT TEXT[] := ARRAY['materias', 'meses_contenido', 'semanas', 'semana_materiales',
                                       'evaluaciones', 'glosario_materia', 'preguntas', 'quiz_semana'];
  c_perfil    CONSTANT TEXT[] := ARRAY['nombre', 'apellidos', 'telefono', 'foto_url'];
BEGIN
  -- ── Preflight ─────────────────────────────────────────────────────────────
  SELECT string_agg(x, ', ') INTO v_malas
    FROM unnest(c_srv || ARRAY['usuarios', 'preguntas', 'quiz_semana', 'notas_alumno']) AS x
   WHERE to_regclass('public.' || x) IS NULL;
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'R2: faltan tablas base (%) → corre primero scripts/schema.sql (o supabase/schema.sql)', v_malas;
  END IF;
  -- Drift de alumnos (puente usuario_id, p. ej. EDVEX): ahí alumnos.id ≠ auth.uid()
  -- y los techos «propio o admin» (alumno_id = auth.uid()) dejarían a cada alumno
  -- sin ver lo suyo. Esta migración es para bases con alumnos.id = auth.uid().
  IF EXISTS (SELECT 1 FROM pg_attribute
              WHERE attrelid = 'public.alumnos'::regclass AND attname = 'usuario_id' AND NOT attisdropped) THEN
    EXECUTE 'SELECT count(*)::text FROM public.alumnos WHERE usuario_id IS NOT NULL AND usuario_id <> id'
       INTO v_malas;
    IF v_malas <> '0' THEN
      RAISE EXCEPTION 'R2: % alumno(s) con alumnos.usuario_id distinto de alumnos.id (drift: alumnos.id no es auth.uid()). Los techos «propio o admin» los dejarían sin ver lo suyo. No se toca nada: esta base necesita su propia migración.', v_malas;
    END IF;
  END IF;
  -- es_admin() con S2: los techos la llaman; sin SECURITY DEFINER una política que
  -- lea usuarios entraría en recursión (Bug 16) y un admin con rol='ADMIN' dejaría de ver.
  IF to_regprocedure('public.es_admin()') IS NULL
     OR NOT (SELECT p.prosecdef AND p.prosrc ~* 'lower\s*\(\s*rol\s*\)'
               FROM pg_proc p WHERE p.oid = to_regprocedure('public.es_admin()')) THEN
    RAISE EXCEPTION 'R2: public.es_admin() falta o no tiene S2 (LOWER(rol) + SECURITY DEFINER) → corre supabase/migrations/20260729121000_fix_s2_es_admin.sql (cliente ya desplegado: scripts/fix-s1-s2-roles.sql) y vuelve a correr esta';
  END IF;
  -- FORCE RLS haría que las funciones SECURITY DEFINER (alumno_mover_mes,
  -- corregir_plan_estudio, la constancia de cursos) pasaran por los techos.
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO v_malas
    FROM pg_class c
   WHERE c.oid IN (SELECT to_regclass('public.' || x) FROM unnest(c_srv || ARRAY['usuarios', 'notas_alumno']) AS x)
     AND c.relforcerowsecurity;
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'R2: % tiene FORCE ROW LEVEL SECURITY; las funciones SECURITY DEFINER dejarían de ver/escribir. Quítalo (ALTER TABLE … NO FORCE ROW LEVEL SECURITY) o revisa a mano antes de correr esta', v_malas;
  END IF;
  -- Toda función SECURITY DEFINER que toque estas tablas y que una sesión pueda
  -- ejecutar tiene que ser del dueño de la tabla, o de un rol con BYPASSRLS o
  -- superusuario: si no, el cierre la frenaría.
  FOR r IN
    SELECT p.oid::regprocedure AS fn,
           bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')
                   OR has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS con_sesion
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles o ON o.oid = p.proowner
      JOIN pg_class t ON t.oid IN (SELECT to_regclass('public.' || x) FROM unnest(c_srv || ARRAY['usuarios']) AS x)
     WHERE n.nspname = 'public' AND p.prosecdef
       AND p.prosrc ~ ('\m' || t.relname || '\M')
       AND p.proowner <> t.relowner AND NOT (o.rolbypassrls OR o.rolsuper)
     GROUP BY p.oid
  LOOP
    IF r.con_sesion THEN
      RAISE EXCEPTION 'R2: % es SECURITY DEFINER, la ejecuta una sesión y su dueño no es el de las tablas ni tiene BYPASSRLS: con el cierre dejaría de escribir. Revisa su dueño (ALTER FUNCTION … OWNER TO <dueño de la tabla>) y vuelve a correr esta', r.fn;
    END IF;
    RAISE NOTICE 'R2: % es SECURITY DEFINER con otro dueño, pero solo la ejecuta el servidor: no se toca.', r.fn;
  END LOOP;
  -- Duplicados que impedirían los índices únicos: se aborta sin borrar nada.
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.quiz_respuestas'::regclass AND attname = 'quiz_id' AND NOT attisdropped) THEN
    EXECUTE 'SELECT string_agg(DISTINCT alumno_id::text, '', '') FROM (SELECT alumno_id FROM public.quiz_respuestas GROUP BY alumno_id, quiz_id HAVING count(*) > 1) d'
       INTO v_malas;
    IF v_malas IS NOT NULL THEN
      RAISE EXCEPTION 'R2: quiz_respuestas tiene respuestas repetidas (alumno, pregunta) de los alumnos %. No se borra nada: depúralas a mano dejando la más antigua de cada pregunta (la que la app ya califica; ver el encabezado) y vuelve a correr esta.', left(v_malas, 400);
    END IF;
  END IF;
  SELECT string_agg(DISTINCT alumno_id::text, ', ') INTO v_malas
    FROM (SELECT alumno_id FROM public.intentos_evaluacion
           GROUP BY alumno_id, evaluacion_id, numero_intento HAVING count(*) > 1) d;
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'R2: intentos_evaluacion tiene intentos con el mismo número (alumno, evaluación, intento) de los alumnos %. No se borra nada: revísalos a mano (ver el encabezado) y vuelve a correr esta.', left(v_malas, 400);
  END IF;

  -- ── H1-H3: escritura solo por el servidor ─────────────────────────────────
  FOREACH v_t IN ARRAY c_srv LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, PUBLIC', v_t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', v_t);
    -- También los privilegios POR COLUMNA (un GRANT de columna sobrevive al REVOKE de tabla).
    FOR r IN SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = to_regclass('public.' || v_t) AND a.attnum > 0 AND NOT a.attisdropped LOOP
      EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.%2$I FROM anon, authenticated', r.attname, v_t);
    END LOOP;
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', v_t);
    IF NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.' || v_t)) THEN
      RAISE NOTICE 'R2: % tenía la RLS APAGADA: se enciende.', v_t;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_t);
    END IF;
  END LOOP;

  -- Políticas de escritura propia que quedan inertes sin privilegio: se borran
  -- para que nadie las «arregle» devolviendo el GRANT. (Nombres canónicos y los de
  -- migration-progreso-logros.sql / migration-quiz-notas.sql de la raíz.)
  DROP POLICY IF EXISTS "progreso: registrar propio progreso"  ON public.progreso_semanas;
  DROP POLICY IF EXISTS "progreso: actualizar propio progreso" ON public.progreso_semanas;
  DROP POLICY IF EXISTS "alumno_insert_own_progreso"           ON public.progreso_semanas;
  DROP POLICY IF EXISTS "logros: insertar propios"             ON public.logros_alumno;
  DROP POLICY IF EXISTS "alumno_insert_own_logros"             ON public.logros_alumno;
  DROP POLICY IF EXISTS "racha: insertar propia"               ON public.racha_actividad;
  DROP POLICY IF EXISTS "racha: actualizar propia"             ON public.racha_actividad;
  DROP POLICY IF EXISTS "documentos: subir propios"            ON public.documentos_alumno;
  DROP POLICY IF EXISTS "alumno_insert_quiz_resp"              ON public.quiz_respuestas;
  DROP POLICY IF EXISTS "alumno_update_quiz_resp"              ON public.quiz_respuestas;

  -- Lectura propia (o admin): se crea solo si falta (la de la plantilla ya está).
  FOR r IN SELECT * FROM (VALUES
      ('calificaciones',    'alumno_id', 'calificaciones: ver propias'),
      ('progreso_semanas',  'alumno_id', 'progreso: ver propio progreso'),
      ('logros_alumno',     'alumno_id', 'logros: ver propios'),
      ('racha_actividad',   'alumno_id', 'racha: ver propia'),
      ('documentos_alumno', 'alumno_id', 'documentos: ver propios'),
      ('constancias',       'alumno_id', 'constancias: ver propias'),
      ('alumnos',           'id',        'alumnos: ver propio registro')
    ) AS t(tabla, col, lectura) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = r.tabla AND policyname = r.lectura) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (%I = auth.uid() OR public.es_admin())',
                     r.lectura, r.tabla, r.col);
      RAISE NOTICE 'R2: % — se creó «%».', r.tabla, r.lectura;
    END IF;
  END LOOP;

  -- Techos RESTRICTIVE de lectura «propio o admin» (intentos, quiz_respuestas y
  -- usuarios ya tienen los de D22c/D22d).
  DROP POLICY IF EXISTS "calificaciones: techo propio o admin (R2)" ON public.calificaciones;
  CREATE POLICY "calificaciones: techo propio o admin (R2)" ON public.calificaciones
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "progreso: techo propio o admin (R2)" ON public.progreso_semanas;
  CREATE POLICY "progreso: techo propio o admin (R2)" ON public.progreso_semanas
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "logros: techo propio o admin (R2)" ON public.logros_alumno;
  CREATE POLICY "logros: techo propio o admin (R2)" ON public.logros_alumno
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "racha: techo propio o admin (R2)" ON public.racha_actividad;
  CREATE POLICY "racha: techo propio o admin (R2)" ON public.racha_actividad
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "documentos: techo propio o admin (R2)" ON public.documentos_alumno;
  CREATE POLICY "documentos: techo propio o admin (R2)" ON public.documentos_alumno
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "constancias: techo propio o admin (R2)" ON public.constancias;
  CREATE POLICY "constancias: techo propio o admin (R2)" ON public.constancias
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin());
  DROP POLICY IF EXISTS "alumnos: techo propio o admin (R2)" ON public.alumnos;
  CREATE POLICY "alumnos: techo propio o admin (R2)" ON public.alumnos
    AS RESTRICTIVE FOR SELECT TO anon, authenticated
    USING (id = auth.uid() OR public.es_admin());

  -- ── notas_alumno: el alumno escribe SUS apuntes, nada más ──────────────────
  REVOKE ALL ON public.notas_alumno FROM anon, PUBLIC;
  REVOKE DELETE, TRUNCATE ON public.notas_alumno FROM authenticated;
  GRANT SELECT, INSERT, UPDATE ON public.notas_alumno TO authenticated;
  GRANT ALL ON public.notas_alumno TO service_role;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.notas_alumno'::regclass) THEN
    RAISE NOTICE 'R2: notas_alumno tenía la RLS APAGADA: se enciende.';
    ALTER TABLE public.notas_alumno ENABLE ROW LEVEL SECURITY;
  END IF;
  DROP POLICY IF EXISTS "notas: actualizar propias" ON public.notas_alumno;
  CREATE POLICY "notas: actualizar propias" ON public.notas_alumno
    FOR UPDATE USING (alumno_id = auth.uid()) WITH CHECK (alumno_id = auth.uid());
  DROP POLICY IF EXISTS "notas: techo propio o admin (R2)" ON public.notas_alumno;
  CREATE POLICY "notas: techo propio o admin (R2)" ON public.notas_alumno
    AS RESTRICTIVE FOR ALL TO anon, authenticated
    USING (alumno_id = auth.uid() OR public.es_admin())
    WITH CHECK (alumno_id = auth.uid() OR public.es_admin());

  -- ── H7: usuarios (Bug 52 + Bug 220) ────────────────────────────────────────
  REVOKE ALL ON public.usuarios FROM anon, PUBLIC;
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.usuarios FROM authenticated;
  FOR r IN SELECT a.attname FROM pg_attribute a
            WHERE a.attrelid = 'public.usuarios'::regclass AND a.attnum > 0 AND NOT a.attisdropped LOOP
    EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.usuarios FROM anon, authenticated', r.attname);
  END LOOP;
  SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum) INTO v_cols
    FROM pg_attribute a
   WHERE a.attrelid = 'public.usuarios'::regclass AND a.attnum > 0 AND NOT a.attisdropped
     AND a.attname = ANY (c_perfil);
  IF v_cols IS NOT NULL THEN
    EXECUTE format('GRANT UPDATE (%s) ON public.usuarios TO authenticated', v_cols);
  END IF;
  GRANT SELECT ON public.usuarios TO authenticated;
  GRANT ALL ON public.usuarios TO service_role;
  DROP POLICY IF EXISTS "usuarios: actualizar propio perfil" ON public.usuarios;
  CREATE POLICY "usuarios: actualizar propio perfil" ON public.usuarios
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

  -- ── Contenido: sin escritura con sesión (el panel usa el service role) ──────
  FOREACH v_t IN ARRAY c_contenido LOOP
    CONTINUE WHEN to_regclass('public.' || v_t) IS NULL;
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', v_t);
    FOR r IN SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = to_regclass('public.' || v_t) AND a.attnum > 0 AND NOT a.attisdropped LOOP
      EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.%2$I FROM anon, authenticated', r.attname, v_t);
    END LOOP;
    EXECUTE format('GRANT ALL ON public.%I TO service_role', v_t);
  END LOOP;

  -- ── H4: índices únicos contra los envíos simultáneos ──────────────────────
  -- (La forma JSONB de quiz_respuestas —una fila por semana, sin quiz_id— ya es
  -- única por (alumno_id, semana_id).)
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.quiz_respuestas'::regclass AND attname = 'quiz_id' AND NOT attisdropped) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS quiz_respuestas_alumno_quiz_uniq
      ON public.quiz_respuestas (alumno_id, quiz_id);
  ELSE
    RAISE NOTICE 'R2: quiz_respuestas es de la forma JSONB (sin quiz_id): sin índice por pregunta.';
  END IF;
  CREATE UNIQUE INDEX IF NOT EXISTS intentos_evaluacion_alumno_eval_num_uniq
    ON public.intentos_evaluacion (alumno_id, evaluacion_id, numero_intento);

  -- ── H5: funciones que ninguna sesión llama por RPC ─────────────────────────
  IF to_regprocedure('public.generar_matricula()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.generar_matricula() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.generar_matricula() TO service_role;
  END IF;
  -- Las de trigger: el trigger se dispara sin EXECUTE de quien escribe.
  FOR r IN SELECT p.oid::regprocedure AS fn FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.prorettype = 'trigger'::regtype LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.fn);
  END LOOP;

  -- ── H6: anon no escribe en public; nadie con sesión hace TRUNCATE ─────────
  -- keep_alive_log conserva el INSERT de anon por NOMBRE, aunque su política sea
  -- TO public (DDL de rescate a mano, Bug 65): sin latido Supabase pausa y borra
  -- el proyecto. Sin política de INSERT, la RLS lo sigue frenando.
  FOR r IN
    SELECT c.relname,
           c.relname = 'keep_alive_log'
           OR EXISTS (SELECT 1 FROM pg_policies p
                       WHERE p.schemaname = 'public' AND p.tablename = c.relname
                         AND p.permissive = 'PERMISSIVE' AND p.cmd IN ('INSERT', 'ALL')
                         AND p.roles @> ARRAY['anon']::name[]) AS insert_anon
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    IF r.insert_anon THEN
      -- Una política TO anon lo permite a propósito (keep_alive_log, Bug 46).
      EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon', r.relname);
      RAISE NOTICE 'R2: % conserva el INSERT de anon (lo pide una política TO anon).', r.relname;
    ELSE
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon', r.relname);
    END IF;
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated', r.relname);
  END LOOP;

  -- ── Epílogo: nada quedó abierto (si algo falla, ROLLBACK de todo) ─────────
  -- (a) Escritura con sesión en las tablas del servidor: ni de tabla ni de columna.
  SELECT string_agg(ro.rol || ' ' || lower(pv.p) || ' ' || x, ', ') INTO v_malas
    FROM unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
   CROSS JOIN unnest(ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) AS pv(p)
   CROSS JOIN unnest(c_srv || c_contenido) AS x
   WHERE to_regclass('public.' || x) IS NOT NULL
     AND (has_table_privilege(ro.rol, to_regclass('public.' || x), pv.p)
          OR (pv.p IN ('INSERT', 'UPDATE') AND has_any_column_privilege(ro.rol, to_regclass('public.' || x), pv.p)));
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'R2: tras el REVOKE siguen escribibles con sesión: % (¿un rol hereda de otro? Revisa los GRANT a mano).', v_malas;
  END IF;
  -- (b) usuarios: ni INSERT ni el UPDATE de id/email/rol.
  IF has_table_privilege('authenticated', 'public.usuarios', 'INSERT')
     OR has_any_column_privilege('authenticated', 'public.usuarios', 'INSERT')
     OR has_table_privilege('authenticated', 'public.usuarios', 'DELETE')
     OR has_column_privilege('authenticated', 'public.usuarios', 'rol', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.usuarios', 'id', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.usuarios', 'email', 'UPDATE')
     OR has_any_column_privilege('anon', 'public.usuarios', 'INSERT')
     OR has_any_column_privilege('anon', 'public.usuarios', 'UPDATE') THEN
    RAISE EXCEPTION 'R2: usuarios sigue con INSERT, DELETE o UPDATE de id/email/rol con sesión.';
  END IF;
  -- (c) Techos presentes.
  SELECT string_agg(x, ', ') INTO v_malas
    FROM unnest(ARRAY['calificaciones', 'progreso_semanas', 'logros_alumno', 'racha_actividad',
                      'documentos_alumno', 'constancias', 'alumnos', 'notas_alumno']) AS x
   WHERE NOT EXISTS (SELECT 1 FROM pg_policies p
                      WHERE p.schemaname = 'public' AND p.tablename = x AND p.permissive = 'RESTRICTIVE'
                        AND p.policyname LIKE '%: techo propio o admin (R2)');
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'R2: falta el techo RESTRICTIVE en %.', v_malas;
  END IF;
  -- (d) Índices únicos.
  IF to_regclass('public.intentos_evaluacion_alumno_eval_num_uniq') IS NULL
     OR (EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.quiz_respuestas'::regclass AND attname = 'quiz_id' AND NOT attisdropped)
         AND to_regclass('public.quiz_respuestas_alumno_quiz_uniq') IS NULL) THEN
    RAISE EXCEPTION 'R2: falta un índice único contra los envíos simultáneos.';
  END IF;
  -- (e) generar_matricula y anon.
  IF to_regprocedure('public.generar_matricula()') IS NOT NULL
     AND (has_function_privilege('anon', 'public.generar_matricula()', 'EXECUTE')
          OR has_function_privilege('authenticated', 'public.generar_matricula()', 'EXECUTE')) THEN
    RAISE EXCEPTION 'R2: generar_matricula() sigue ejecutable con sesión.';
  END IF;
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO v_malas
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
     AND (has_table_privilege('anon', c.oid, 'UPDATE') OR has_table_privilege('anon', c.oid, 'DELETE')
          OR has_table_privilege('anon', c.oid, 'TRUNCATE') OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
          OR (has_table_privilege('anon', c.oid, 'INSERT') AND c.relname <> 'keep_alive_log'
              AND NOT EXISTS (SELECT 1 FROM pg_policies p
                               WHERE p.schemaname = 'public' AND p.tablename = c.relname
                                 AND p.permissive = 'PERMISSIVE' AND p.cmd IN ('INSERT', 'ALL')
                                 AND p.roles @> ARRAY['anon']::name[])));
  IF v_malas IS NOT NULL THEN
    RAISE EXCEPTION 'R2: anon sigue escribiendo (o alguien con sesión hace TRUNCATE) en: %.', v_malas;
  END IF;
  -- (f) Aviso: permisivas de escritura sin admin que quedan inertes.
  SELECT string_agg(tablename || ' → «' || policyname || '» (' || cmd || ')', ', ' ORDER BY tablename, policyname) INTO v_malas
    FROM pg_policies
   WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
     AND tablename = ANY (c_srv || ARRAY['usuarios'])
     AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
     AND coalesce(qual, with_check, '') !~* '(es_admin|is_admin)\s*\('
     AND NOT (tablename = 'usuarios' AND policyname = 'usuarios: actualizar propio perfil');
  IF v_malas IS NOT NULL THEN
    RAISE NOTICE 'R2: políticas de escritura sin admin que quedan INERTES (sin privilegio): %', v_malas;
  END IF;
  RAISE NOTICE 'R2: listo — progreso, logros, racha, calificaciones, intentos, respuestas del quiz, alumnos, documentos y constancias solo los escribe el servidor; cada quien lee lo suyo.';
END
$r2$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Verificación (todas deben dar f):
-- SELECT has_table_privilege('authenticated','public.progreso_semanas','INSERT'),
--        has_table_privilege('authenticated','public.logros_alumno','INSERT'),
--        has_table_privilege('authenticated','public.documentos_alumno','UPDATE'),
--        has_column_privilege('authenticated','public.usuarios','rol','UPDATE'),
--        has_function_privilege('anon','public.generar_matricula()','EXECUTE'),
--        has_table_privilege('anon','public.materias','TRUNCATE');
-- Y en post-setup-check.sql, los CHECK 32, 33 y 34 en ✅.
