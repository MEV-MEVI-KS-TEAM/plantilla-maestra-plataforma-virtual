-- ============================================================
-- POST-SETUP CHECK — Plataforma Virtual MEV
-- ============================================================
-- Ejecutar DESPUÉS de correr todos los SQLs de setup.
-- Reporta en la última columna ✅ (OK) o ❌ (FAIL) para cada check.
-- Si TODO sale ✅, la plataforma virtual está lista para entregar.
-- 
-- USO desde Claude Code Desktop:
--   psql -f scripts/post-setup-check.sql
-- ============================================================

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo '  POST-SETUP CHECK — Plataforma Virtual'
\echo '════════════════════════════════════════════════════════'
\echo ''

-- ─── CHECK 1: Materias cargadas ─────────────────────────────
SELECT 
  'Materias cargadas (debe ser >= 25)' AS check_name,
  COUNT(*) AS valor,
  CASE WHEN COUNT(*) >= 25 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM materias;

-- ─── CHECK 2: Materia DEMO existe con UUID correcto ─────────
SELECT
  'Materia DEMO (UUID f0551b82-...)' AS check_name,
  COUNT(*)::text AS valor,
  CASE WHEN COUNT(*) = 1 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM materias
WHERE id = 'f0551b82-1c3e-4286-bfb4-878842bc6eff'
  AND nivel = 'demo';

-- ─── CHECK 3: Semanas DEMO con video ────────────────────────
SELECT
  'Semanas demo con video (debe ser 8)' AS check_name,
  COUNT(*) AS valor,
  CASE WHEN COUNT(*) = 8 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM semanas s
JOIN meses_contenido mc ON s.mes_id = mc.id
JOIN materias m ON mc.materia_id = m.id
WHERE m.nivel = 'demo'
  AND s.video_url IS NOT NULL;

-- ─── CHECK 4: Quiz inline en semanas demo (16 filas) ────────
SELECT
  'quiz_semana en demo (debe ser 16)' AS check_name,
  COUNT(*) AS valor,
  CASE WHEN COUNT(*) >= 16 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM quiz_semana qs
JOIN semanas s ON qs.semana_id = s.id
JOIN meses_contenido mc ON s.mes_id = mc.id
JOIN materias m ON mc.materia_id = m.id
WHERE m.nivel = 'demo';

-- ─── CHECK 5: Evaluación tutorial existe ────────────────────
SELECT
  'Evaluación tutorial bb000000-...' AS check_name,
  COUNT(*)::text AS valor,
  CASE WHEN COUNT(*) = 1 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM evaluaciones
WHERE id = 'bb000000-0000-4000-a000-000000000001';

-- ─── CHECK 6: preguntas del tutorial (>= 15) ────────────────
-- Era `= 15` y el seed demo creció: hoy siembra 26 preguntas reales y distintas
-- (VARK, Pomodoro, Active Recall, Eisenhower, SMART, Feynman…), así que TODO
-- cliente nuevo terminaba con un ❌ falso aquí. Se pasa a `>=`, como ya hacen
-- los checks 9 y 10: lo que este check protege es que la evaluación del tutorial
-- NO nazca vacía ni a medias, no que tenga un número exacto que el seed puede
-- volver a mover mañana.
SELECT
  'Preguntas evaluación tutorial (>=15)' AS check_name,
  COUNT(*) AS valor,
  CASE WHEN COUNT(*) >= 15 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM preguntas
WHERE evaluacion_id = 'bb000000-0000-4000-a000-000000000001';

-- ─── CHECK 7: Constraint UNIQUE calificaciones ──────────────
-- 🛑 SE BUSCA POR DEFINICIÓN, NO POR NOMBRE (Bug 96b).
-- Buscaba `conname = 'calificaciones_alumno_materia_unique'`, un nombre que
-- scripts/schema.sql NO usa: crea ese mismo UNIQUE (alumno_id, materia_id) con
-- el nombre que Postgres genera solo, `calificaciones_alumno_id_materia_id_key`.
-- La semántica estaba cumplida y el check salía ❌ en todo cliente nuevo. El
-- peligro no era el ❌ sino la reacción: que el operador lo "arregle" agregando
-- un segundo constraint idéntico, y con él un índice redundante sobre las mismas
-- dos columnas.
SELECT
  'Constraint UNIQUE calificaciones' AS check_name,
  COUNT(*)::text AS valor,
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM pg_constraint c
WHERE c.conrelid = 'public.calificaciones'::regclass
  AND c.contype  = 'u'
  -- Las columnas del constraint, por NOMBRE y ordenadas: así da igual en qué
  -- orden se declararan (`UNIQUE (alumno_id, materia_id)` o al revés) y da igual
  -- cómo se llame el constraint.
  AND (
    SELECT array_agg(a.attname::text ORDER BY a.attname)
    FROM pg_attribute a
    WHERE a.attrelid = c.conrelid
      AND a.attnum = ANY (c.conkey)
  ) = ARRAY['alumno_id', 'materia_id'];

-- ─── CHECK 8: Admin user creado ─────────────────────────────
SELECT
  'Admin user en tabla usuarios' AS check_name,
  COUNT(*)::text AS valor,
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM usuarios
WHERE rol = 'admin';

-- ─── CHECK 9: Total preguntas (>= 240) ──────────────────────
SELECT
  'Total preguntas evaluaciones (>=240)' AS check_name,
  COUNT(*) AS valor,
  CASE WHEN COUNT(*) >= 240 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM preguntas;

-- ─── CHECK 10: 200 semanas totales ──────────────────────────
SELECT
  'Total semanas plataforma (>=200)' AS check_name,
  COUNT(*) AS valor,
  CASE WHEN COUNT(*) >= 200 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
FROM semanas;

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo '  Si TODO sale ✅, la plataforma virtual está lista.'
\echo '  Si algo sale ❌, REVISAR antes de avanzar.'
\echo '════════════════════════════════════════════════════════'
\echo ''

-- ─── CHECK 11: RLS SELECT policy en tabla usuarios ──────────
-- Sin esta policy el frontend recibe null silenciosamente al
-- consultar rol → fallback ALUMNO → admin entra como alumno.
-- Bug detectado en cliente Santa Barbara (28-abr-2026).
-- Solo cuentan las PERMISIVAS: un techo RESTRICTIVE (D22c) no concede filas por
-- sí solo; con solo el techo, el admin volvería a leer su rol como NULL.
SELECT
  'RLS SELECT policy en usuarios' AS check_name,
  COUNT(*)::text AS valor,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ FAIL — admin entrará como alumno (ver fix/rls-usuarios-select-policy)'
  END AS resultado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
  AND cmd = 'SELECT'
  AND permissive = 'PERMISSIVE';

-- ─── CHECK 12: Función is_admin() existe (evita recursión RLS) ──
-- La política "admin lee todos" en usuarios necesita is_admin() con
-- SECURITY DEFINER para evitar recursión infinita (error 500 en login).
-- Bug detectado en cliente Santa Barbara (28-abr-2026).
SELECT
  'Funcion is_admin() con SECURITY DEFINER' AS check_name,
  COUNT(*)::text AS valor,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ OK'
    ELSE '❌ FALTA is_admin() — riesgo de recursion RLS infinita'
  END AS resultado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'is_admin';

-- ─── CHECK 13: Cobertura de SELECT policies en todas las tablas ─
-- Detecta el bug historico donde el setup aplica politicas incompletas.
-- Afecto a Santa Barbara (28-abr-2026): 10 tablas con RLS sin SELECT.
--
-- Dos correcciones, las dos por falsos positivos medidos en clientes SANOS:
--
-- 1. `polcmd IN ('r','*')`. Una política `FOR ALL` (`polcmd = '*'`) cubre SELECT
--    igual que una `FOR SELECT`, y el filtro contaba solo las segundas. Con eso,
--    `curso_examen_preguntas` —que tiene una sola política `ALL` con
--    `is_admin()`, correcta por diseño: el alumno no debe leer las claves del
--    examen— salía como tabla sin lectura.
--
-- 2. `ajustes` se excluye igual que `keep_alive_log`. Tiene RLS sin políticas A
--    PROPÓSITO (deny-all): todo acceso real va por service role
--    (`sincronizarPrefijoMatricula`, `sincronizarPlanSemanal`,
--    `/api/admin/cobranza`) o por `generar_matricula()`, que es SECURITY
--    DEFINER. Lo documenta la propia plantilla en src/lib/matricula.ts. El check
--    excluía solo a keep_alive_log, así que `ajustes` aparecía como defecto en
--    TODO cliente nuevo.
--
-- Las dos juntas eran los 2 ❌ que cerraban cada FASE 2 de la flota. Un script
-- de verificación que miente a favor del error entrena al operador a ignorarlo,
-- que es justo lo que este script existe para evitar.
WITH tablas_sin_policy AS (
  SELECT c.relname AS tabla
  FROM pg_class c
  -- Solo permisivas: un techo RESTRICTIVE (D22c) no concede filas y taparía una tabla sin lectura.
  LEFT JOIN pg_policy p ON p.polrelid = c.oid AND p.polcmd IN ('r', '*') AND p.polpermissive
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    -- RLS deny-all POR DISEÑO: el acceso va por service role o SECURITY DEFINER.
    --   keep_alive_log → solo anon INSERT, sin SELECT (keep-alive, Bug 46)
    --   ajustes        → ver src/lib/matricula.ts
    AND c.relname NOT IN ('keep_alive_log', 'ajustes')
  GROUP BY c.relname
  HAVING COUNT(p.oid) = 0
)
SELECT
  CASE
    WHEN COUNT(*) = 0
      THEN 'CHECK 13: Todas las tablas con RLS tienen SELECT policy'
    ELSE 'FAIL CHECK 13: ' || COUNT(*) || ' tablas sin SELECT: ' || string_agg(tabla, ', ')
  END AS resultado
FROM tablas_sin_policy;

-- ─── CHECK 14: un solo CHECK sobre alumnos.modalidad, y qué planes admite ─────
-- Se busca por CATÁLOGO (conkey), no por nombre (Bug 72). ❌ solo cuando SIEMPRE
-- es defecto: ningún CHECK, o más de uno. Si el CHECK no admite algún plan
-- canónico (p. ej. '6_meses_lic', el de 6 meses de licenciatura del Bloque B),
-- lo LISTA sin marcar ❌: solo importa si config.ts VENDE ese plan (sin él, esa
-- alta falla con 23514 y la ruta borra el usuario de Auth que acababa de crear,
-- Bug 68), y este script no puede leer config.ts. Compáralo contra los ids de
-- `modalidades` y `licenciaturas.modalidades`. Un clon anterior a B5 está sano.
WITH col AS (
  SELECT attnum FROM pg_attribute
   WHERE attrelid = 'public.alumnos'::regclass AND attname = 'modalidad' AND NOT attisdropped
), checks AS (
  SELECT pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c, col
   WHERE c.conrelid = 'public.alumnos'::regclass AND c.contype = 'c' AND c.conkey = ARRAY[col.attnum]
), faltan AS (
  -- strpos y no LIKE: en LIKE el '_' de los ids es comodín.
  SELECT (SELECT COUNT(*) FROM checks) AS n,
         string_agg(x, ', ' ORDER BY o) AS ids
    FROM unnest(ARRAY['3_meses','6_meses','6_meses_lic','9_meses','12_meses','18_meses','24_meses','36_meses'])
         WITH ORDINALITY AS t(x, o)
   WHERE NOT EXISTS (SELECT 1 FROM checks WHERE strpos(def, '''' || x || '''') > 0)
)
SELECT
  'CHECK de alumnos.modalidad (uno solo)' AS check_name,
  n::text AS valor,
  CASE
    WHEN n = 0 THEN '❌ FALTA el CHECK de alumnos.modalidad → correr supabase/migrations/20260925120000_licenciatura_plan_6_meses.sql (lo crea con los planes canónicos y los que ya usan los alumnos; revisa su WARNING contra config.ts)'
    WHEN n > 1 THEN '❌ HAY ' || n || ' CHECK sobre modalidad (Bug 72): consolidar con supabase/migrations/20260925120000_licenciatura_plan_6_meses.sql'
    WHEN ids IS NULL THEN '✅ OK (admite los 8 planes canónicos, 6_meses_lic incluido)'
    ELSE '✅ OK (no admite ' || ids || ': solo hace falta si config.ts vende alguno → correr supabase/migrations/20260925120000_licenciatura_plan_6_meses.sql de la plantilla maestra)'
  END AS resultado
FROM faltan;

-- ─── CHECK 15: acceso total de cursos (C3b) ─────────────────────────────────
-- Solo aplica si la base tiene el módulo de cursos. Sin esta migración, el código
-- de hoy no puede asignar un curso («Asignar», la asignación masiva y el alta con
-- cursos llaman a curso_inscribir) y el candado no conoce el pago único.
-- No basta con que existan la columna y la función: una copia VIEJA de B2, B3,
-- B4 o B6 (o una corrida a medias) la pisa en silencio (el pago único deja de ver el
-- curso, abrir mes vuelve a moverse, el reporte cuenta mal, y cualquiera lee el
-- techo de otro alumno). Por eso se revisan también los cuerpos y el REVOKE.
WITH c3b AS (
  SELECT
    to_regclass('public.curso_inscripciones') IS NOT NULL AS hay_cursos,
    EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'curso_inscripciones'
               AND column_name = 'acceso_total') AS columna,
    to_regproc('public.curso_inscribir') IS NOT NULL AS asignar,
    (SELECT string_agg(f, ', ' ORDER BY f)
       FROM unnest(ARRAY['curso_ventana_limite(uuid,uuid)', 'curso_abrir_mes(uuid,integer)',
                         'curso_cerrar_mes(uuid,integer)', 'reporte_curso_inscripciones()']) AS f
      WHERE to_regprocedure('public.' || f) IS NULL
         OR strpos(pg_get_functiondef(to_regprocedure('public.' || f)), 'acceso_total') = 0) AS revertidas,
    CASE WHEN to_regprocedure('public.curso_ventana_limite(uuid,uuid)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         THEN has_function_privilege('authenticated', 'public.curso_ventana_limite(uuid,uuid)', 'EXECUTE')
         ELSE false END AS techo_legible
)
SELECT
  'Acceso total de cursos (C3b)' AS check_name,
  CASE WHEN NOT hay_cursos THEN 'sin módulo de cursos'
       ELSE 'columna ' || columna::text || ' / curso_inscribir ' || asignar::text
            || ' / sin C3b: ' || COALESCE(revertidas, 'ninguna') || ' / techo legible ' || techo_legible::text
  END AS valor,
  CASE
    WHEN NOT hay_cursos THEN '✅ OK (esta base no vende cursos)'
    WHEN NOT columna OR NOT asignar
      THEN '❌ FALTA → correr supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql (después de los 20260730*)'
    WHEN revertidas IS NOT NULL OR techo_legible
      THEN '❌ C3b REVERTIDO (' || COALESCE(revertidas, 'el techo volvió a ser legible') || '): se corrió después una copia vieja o una corrida a medias de B2/B3/B4/B6 → vuelve a correr supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql'
    ELSE '✅ OK (acceso_total, curso_inscribir, candado, abrir/cerrar mes, reporte y techo privado)'
  END AS resultado
FROM c3b;

-- ─── CHECK 16: el secretario también abre (D7b) ──────────────────────────────
-- Solo aplica si la base tiene el módulo de cursos. Las siete funciones de
-- apertura (asignar, asignar a todos, abrir mes, abrir todo, cobrar abriendo el
-- mes, cerrar mes y quitar el acceso total) tienen que aceptar al secretario
-- (guarda «es_staff() … D7b:»), y las de SOLO ADMIN (cambiar estado/cancelar y
-- borrar módulos) seguir pidiendo es_admin(). Emitir constancias ya es del
-- personal (D20b): lo vigila el CHECK 20. Una corrida
-- vieja de B3, B4 o C3b sin su epílogo le quita la apertura al secretario en
-- silencio: por eso se revisan los cuerpos, no solo los nombres.
WITH d7b AS (
  SELECT
    to_regclass('public.curso_inscripciones') IS NOT NULL AS hay_cursos,
    to_regprocedure('public.d7b_staff_abre()') IS NOT NULL AS instalada,
    (SELECT string_agg(f, ', ' ORDER BY f)
       FROM unnest(ARRAY['curso_inscribir(uuid,uuid)', 'curso_inscribir_todos(uuid,integer,text,boolean)',
                         'curso_abrir_todo(uuid)', 'curso_quitar_acceso_total(uuid,text)',
                         'curso_abrir_mes(uuid,integer)', 'curso_cerrar_mes(uuid,integer)',
                         'curso_registrar_pago(uuid,numeric,text,text,text,date,boolean,integer)']) AS f
      WHERE to_regprocedure('public.' || f) IS NULL
         OR strpos(pg_get_functiondef(to_regprocedure('public.' || f)), 'NOT public.es_staff() THEN  -- D7b:') = 0) AS sin_secretario,
    (SELECT string_agg(f, ', ' ORDER BY f)
       FROM unnest(ARRAY['curso_cambiar_estado(uuid,text,text)', 'curso_borrar_modulo(uuid)']) AS f
      WHERE to_regprocedure('public.' || f) IS NOT NULL
        AND strpos(pg_get_functiondef(to_regprocedure('public.' || f)), 'IF NOT public.es_admin() THEN') = 0
        -- «Abierta» = sin la guarda de admin Y ejecutable con la sesión.
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
        AND has_function_privilege('authenticated', 'public.' || f, 'EXECUTE')) AS admin_abiertas,
    CASE WHEN to_regprocedure('public.d7b_staff_abre()') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         THEN has_function_privilege('authenticated', 'public.d7b_staff_abre()', 'EXECUTE')
         ELSE false END AS herramienta_expuesta
  FROM (SELECT 1) AS x
)
SELECT
  'El secretario abre cursos (D7b)' AS check_name,
  CASE WHEN NOT hay_cursos THEN 'sin módulo de cursos'
       ELSE 'd7b_staff_abre ' || instalada::text || ' / sin el secretario: ' || COALESCE(sin_secretario, 'ninguna')
            || ' / solo admin abiertas: ' || COALESCE(admin_abiertas, 'ninguna')
            || ' / herramienta expuesta ' || herramienta_expuesta::text
  END AS valor,
  CASE
    WHEN NOT hay_cursos THEN '✅ OK (esta base no vende cursos)'
    WHEN NOT instalada
      THEN '❌ FALTA → correr supabase/migrations/20260927120000_d7b_secretario_abre_cursos.sql (después de C3b)'
    WHEN sin_secretario IS NOT NULL
      THEN '❌ D7b REVERTIDO (' || sin_secretario || '): se corrió después una copia vieja de B3/B4/C3b → si el CHECK 15 también falla, corre primero supabase/migrations/20260926120000_c3b_acceso_total_cursos.sql (al final re-aplica D7b); si no, vuelve a correr supabase/migrations/20260927120000_d7b_secretario_abre_cursos.sql'
    WHEN admin_abiertas IS NOT NULL
      THEN '❌ SOLO ADMIN ABIERTO (' || admin_abiertas || '): estas funciones ya no piden es_admin() → revisa quién las cambió'
    WHEN herramienta_expuesta
      THEN '❌ d7b_staff_abre() ejecutable por authenticated → vuelve a correr la migración D7b'
    ELSE '✅ OK (asignar, abrir, cerrar, abrir todo y cobrar abriendo: admin y secretario; estado y módulos: solo admin)'
  END AS resultado
FROM d7b;

-- ─── CHECK 17: «Activar según la ficha» (D8) ────────────────────────────────
-- Solo aplica si la base tiene el módulo de cursos. Sin la función, el botón
-- «Activar según la ficha» (y el «Por activar» de /admin/alumnos) responde 503:
-- el registro público deja inscripciones con 0 meses que solo se abren a mano.
WITH d8 AS (
  SELECT
    to_regclass('public.curso_inscripciones') IS NOT NULL AS hay_cursos,
    to_regprocedure('public.curso_activar_segun_ficha(uuid,text)') IS NOT NULL AS instalada,
    CASE WHEN to_regprocedure('public.curso_activar_segun_ficha(uuid,text)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_activar_segun_ficha(uuid,text)')), 'IF NOT public.es_staff() THEN') > 0
         ELSE false END AS guarda_staff,
    CASE WHEN to_regprocedure('public.curso_activar_segun_ficha(uuid,text)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
         THEN has_function_privilege('anon', 'public.curso_activar_segun_ficha(uuid,text)', 'EXECUTE')
         ELSE false END AS anon_ejecuta,
    (SELECT count(*) FROM pg_proc WHERE proname = 'curso_activar_segun_ficha') AS versiones
)
SELECT
  'Activar según la ficha (D8)' AS check_name,
  CASE WHEN NOT hay_cursos THEN 'sin módulo de cursos'
       ELSE 'función ' || instalada::text || ' / guarda staff ' || guarda_staff::text
            || ' / anon ejecuta ' || anon_ejecuta::text || ' / versiones ' || versiones::text
  END AS valor,
  CASE
    WHEN NOT hay_cursos THEN '✅ OK (esta base no vende cursos)'
    WHEN NOT instalada
      THEN '❌ FALTA → correr supabase/migrations/20260927130000_d8_activar_segun_ficha.sql (después de C3b y D7b)'
    WHEN NOT guarda_staff OR anon_ejecuta OR versiones <> 1
      THEN '❌ D8 ALTERADO (guarda, permisos o sobrecargas) → vuelve a correr supabase/migrations/20260927130000_d8_activar_segun_ficha.sql'
    ELSE '✅ OK (una sola versión, admin y secretario, anon sin EXECUTE)'
  END AS resultado
FROM d8;

-- ─── CHECK 18: el cobro de cursos (D16) ─────────────────────────────────────
-- Solo aplica si la base tiene el módulo de cursos. Sin la función, «Cobrar» en
-- la ficha y en la pestaña Alumnos responde 503 «corre la migración D16» y el
-- cobro de un curso solo se podría capturar en el modal del PROGRAMA (Bug 73).
WITH d16 AS (
  SELECT
    to_regclass('public.curso_inscripciones') IS NOT NULL AS hay_cursos,
    to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)') IS NOT NULL AS instalada,
    CASE WHEN to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)')), 'IF NOT public.es_staff() THEN') > 0
         ELSE false END AS guarda_staff,
    CASE WHEN to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)')), 'FOR UPDATE') > 0
         ELSE false END AS candado,
    CASE WHEN to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
         THEN has_function_privilege('anon', 'public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)', 'EXECUTE')
         ELSE false END AS anon_ejecuta,
    -- La ruta llama con la sesión: sin EXECUTE para authenticated, «Cobrar» da 403.
    CASE WHEN to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         THEN has_function_privilege('authenticated', 'public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)', 'EXECUTE')
         ELSE true END AS auth_ejecuta,
    -- SECURITY DEFINER: con INVOKER la RLS le escondería la inscripción al secretario.
    COALESCE((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = to_regprocedure('public.curso_cobrar(uuid,uuid,text,numeric,text,integer,boolean,integer,text,text,numeric,text,date)')), false) AS definer,
    -- La red de seguridad del borrado (una inscripción con pagos no se borra).
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_curso_inscripcion_no_borrar_con_pagos' AND NOT tgisinternal) AS trigger_borrado,
    (SELECT count(*) FROM pg_proc WHERE proname = 'curso_cobrar') AS versiones,
    -- B3 intacta: una sola curso_registrar_pago (la de 8 argumentos).
    (SELECT count(*) FROM pg_proc WHERE proname = 'curso_registrar_pago') AS registrar
)
SELECT
  'Cobro de cursos (D16)' AS check_name,
  CASE WHEN NOT hay_cursos THEN 'sin módulo de cursos'
       ELSE 'función ' || instalada::text || ' / guarda staff ' || guarda_staff::text || ' / candado ' || candado::text
            || ' / anon ejecuta ' || anon_ejecuta::text || ' / authenticated ' || auth_ejecuta::text
            || ' / definer ' || definer::text || ' / trigger ' || trigger_borrado::text || ' / versiones ' || versiones::text
            || ' / curso_registrar_pago ' || registrar::text
  END AS valor,
  CASE
    WHEN NOT hay_cursos THEN '✅ OK (esta base no vende cursos)'
    WHEN NOT instalada
      THEN '❌ FALTA → correr supabase/migrations/20260927140000_d16_curso_cobrar.sql (después de C3b, D7b y D8)'
    WHEN NOT guarda_staff OR NOT candado OR anon_ejecuta OR NOT auth_ejecuta OR NOT definer OR NOT trigger_borrado OR versiones <> 1
      THEN '❌ D16 ALTERADO (guarda, candado, permisos, definer, trigger o sobrecargas) → vuelve a correr supabase/migrations/20260927140000_d16_curso_cobrar.sql'
    WHEN registrar <> 1
      THEN '❌ curso_registrar_pago con ' || registrar::text || ' versiones: PostgREST no sabe cuál llamar → deja solo la de B3'
    ELSE '✅ OK (una sola versión, admin y secretario, con candado, anon sin EXECUTE)'
  END AS resultado
FROM d16;

-- ─── CHECK 19: abrir y cerrar mes del programa con bitácora (D20a) ─────────────
-- Aplica a TODA escuela (no solo a la línea de cursos). Sin la migración,
-- «Abrir Mes N» y «Quitar último mes» siguen funcionando, pero sin bitácora ni
-- «Último: …» en la ficha, y el doble clic solo lo frena el UPDATE condicionado.
WITH d20a AS (
  SELECT
    to_regclass('public.alumno_mes_eventos') IS NOT NULL AS tabla,
    to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)') IS NOT NULL AS instalada,
    CASE WHEN to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)')), 'FOR UPDATE') > 0
         ELSE false END AS candado,
    -- 409 con PT409: un 40001 lo reintenta PostgREST sin fin (la petición se cuelga).
    CASE WHEN to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)')), 'ERRCODE = ''PT409''') > 0
              AND strpos(pg_get_functiondef(to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)')), '''40001''') = 0
         ELSE false END AS conflicto_409,
    -- El actor se revalida adentro (admin o secretario de HOY).
    CASE WHEN to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)')), 'v_rol NOT IN (''admin'', ''secretario'')') > 0
         ELSE false END AS guarda_actor,
    -- Idempotencia: un evento por operacion_id.
    EXISTS (SELECT 1 FROM pg_indexes
             WHERE schemaname = 'public' AND tablename = 'alumno_mes_eventos'
               AND indexname = 'alumno_mes_eventos_operacion_uidx'
               AND indexdef ILIKE '%UNIQUE%') AS unico,
    -- Solo el servidor la llama: ni anon ni authenticated (un tope inventado
    -- por PostgREST abriría meses fuera del plan).
    CASE WHEN to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
         THEN has_function_privilege('anon', 'public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)', 'EXECUTE')
         ELSE false END AS anon_ejecuta,
    CASE WHEN to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         THEN has_function_privilege('authenticated', 'public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)', 'EXECUTE')
         ELSE false END AS auth_ejecuta,
    -- Nadie fabrica eventos por PostgREST.
    CASE WHEN to_regclass('public.alumno_mes_eventos') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         THEN has_table_privilege('authenticated', 'public.alumno_mes_eventos', 'INSERT')
           OR has_table_privilege('authenticated', 'public.alumno_mes_eventos', 'UPDATE')
           OR has_table_privilege('authenticated', 'public.alumno_mes_eventos', 'DELETE')
         ELSE false END AS auth_escribe,
    COALESCE((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = to_regprocedure('public.alumno_mover_mes(uuid,text,integer,integer,uuid,uuid)')), false) AS definer,
    (SELECT count(*) FROM pg_proc WHERE proname = 'alumno_mover_mes') AS versiones
)
SELECT
  'Meses del programa con bitácora (D20a)' AS check_name,
  'tabla ' || tabla::text || ' / función ' || instalada::text || ' / candado ' || candado::text
    || ' / guarda actor ' || guarda_actor::text || ' / 409 ' || conflicto_409::text || ' / único ' || unico::text
    || ' / anon ejecuta ' || anon_ejecuta::text || ' / authenticated ejecuta ' || auth_ejecuta::text
    || ' / authenticated escribe ' || auth_escribe::text || ' / definer ' || definer::text
    || ' / versiones ' || versiones::text AS valor,
  CASE
    WHEN NOT tabla OR NOT instalada
      THEN '❌ FALTA → correr supabase/migrations/20260928120000_d20a_bitacora_meses_programa.sql (sin ella abrir/cerrar mes no deja bitácora)'
    WHEN NOT candado OR NOT guarda_actor OR NOT conflicto_409 OR NOT unico OR anon_ejecuta OR auth_ejecuta OR auth_escribe OR NOT definer OR versiones <> 1
      THEN '❌ D20a ALTERADO (candado, guarda del actor, 409, índice único, permisos, definer o sobrecargas) → vuelve a correr supabase/migrations/20260928120000_d20a_bitacora_meses_programa.sql'
    ELSE '✅ OK (un solo escritor, con candado e idempotente; solo el servidor lo llama)'
  END AS resultado
FROM d20a;
-- ─── CHECK 20: constancias del personal (B8.2 + D20b) ───────────────────────
-- Solo aplica si la base tiene el módulo de cursos. La emisión es MANUAL
-- (B8.2: sin examen aprobado no hay folio) y desde D20b la hacen el admin y el
-- secretario con su sesión; una inscripción cancelada no recibe folio y el
-- folio guarda quién lo emitió. Una copia vieja de B4 (sin su prólogo) deja la
-- función sin guardas y sin EXECUTE para authenticated: nadie puede emitir
-- desde el panel y ningún otro CHECK lo ve.
WITH d20b AS (
  SELECT
    to_regclass('public.curso_inscripciones') IS NOT NULL AS hay_cursos,
    to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL AS instalada,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'IF v_mejor < v_minima THEN') > 0
         ELSE false END AS aprobacion,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'NOT public.es_staff() THEN  -- D20b:') > 0
         ELSE false END AS guarda_staff,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'IF v_estado = ''cancelada'' THEN') > 0
         ELSE false END AS cancelada,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'FOR UPDATE') > 0
         ELSE false END AS candado,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'emitida_por_rol') > 0
         ELSE false END AS autor,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
         THEN strpos(pg_get_functiondef(to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), 'estrenar un prefijo de folio nuevo') > 0
         ELSE false END AS prefijo,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'curso_constancias'
        AND column_name IN ('emitida_por', 'emitida_por_nombre', 'emitida_por_rol')) AS columnas,
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
         THEN has_function_privilege('anon', 'public.curso_emitir_constancia(uuid,text,numeric)', 'EXECUTE')
         ELSE false END AS anon_ejecuta,
    -- La ruta llama con la sesión: sin EXECUTE para authenticated nadie emite.
    CASE WHEN to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)') IS NOT NULL
               AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         THEN has_function_privilege('authenticated', 'public.curso_emitir_constancia(uuid,text,numeric)', 'EXECUTE')
         ELSE true END AS auth_ejecuta,
    COALESCE((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = to_regprocedure('public.curso_emitir_constancia(uuid,text,numeric)')), false) AS definer,
    (SELECT count(*) FROM pg_proc WHERE proname = 'curso_emitir_constancia') AS versiones
)
SELECT
  'Constancias del personal (B8.2 + D20b)' AS check_name,
  CASE WHEN NOT hay_cursos THEN 'sin módulo de cursos'
       ELSE 'función ' || instalada::text || ' / aprobación ' || aprobacion::text || ' / guarda staff ' || guarda_staff::text
            || ' / cancelada ' || cancelada::text || ' / candado ' || candado::text || ' / autor ' || autor::text || ' / prefijo ' || prefijo::text
            || ' / columnas ' || columnas::text || ' / anon ejecuta ' || anon_ejecuta::text
            || ' / authenticated ' || auth_ejecuta::text || ' / definer ' || definer::text || ' / versiones ' || versiones::text
  END AS valor,
  CASE
    WHEN NOT hay_cursos THEN '✅ OK (esta base no vende cursos)'
    WHEN NOT instalada
      THEN '❌ FALTA curso_emitir_constancia → correr B4, B8.2 y D20b (supabase/migrations/20260730150000, 20260730180000 y 20260928130000)'
    WHEN NOT aprobacion
      THEN '❌ B8.2 REVERTIDO (se corrió una copia vieja de B4: sin guarda de aprobación y sin EXECUTE para authenticated) → corre supabase/migrations/20260730180000_b82_emision_manual_con_actor.sql y después supabase/migrations/20260928130000_d20b_constancia_staff.sql'
    WHEN NOT guarda_staff OR NOT cancelada OR NOT autor OR NOT prefijo OR columnas <> 3
      THEN '❌ FALTA D20b (o una copia vieja de B8.2 la revirtió: solo el admin emite, una cancelada recibe folio, el folio no guarda su autor o el prefijo no se valida) → corre supabase/migrations/20260928130000_d20b_constancia_staff.sql'
    WHEN NOT candado OR anon_ejecuta OR NOT auth_ejecuta OR NOT definer OR versiones <> 1
      THEN '❌ EMISIÓN ALTERADA (candado, permisos, definer o sobrecargas) → vuelve a correr supabase/migrations/20260928130000_d20b_constancia_staff.sql'
    ELSE '✅ OK (admin y secretario emiten con su sesión; sin aprobación no hay folio; cancelada sin folio; el folio guarda su autor)'
  END AS resultado
FROM d20b;

-- ─── CHECK 21: «alguien lo cambió en medio» responde 409 (D20e) ─────────────
-- Aplica a toda base. Una función que lanza ERRCODE '40001' cuelga la petición:
-- PostgREST lo toma por una falla pasajera (serialization_failure) y reintenta
-- la transacción sin fin. Las funciones usan PT409 (HTTP 409). Una copia vieja
-- de B3, B4, C3b, D8 o D16 lo vuelve a meter: por eso se revisan los cuerpos.
WITH d20e AS (
  SELECT string_agg(p.oid::regprocedure::text, ', ' ORDER BY p.oid::regprocedure::text) AS con_40001
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     -- Lo mismo que reescribe D20e (y lo único que PostgREST llama por RPC).
     AND p.prokind = 'f'
     AND p.prolang = (SELECT l.oid FROM pg_language l WHERE l.lanname = 'plpgsql')
     AND strpos(p.prosrc, 'ERRCODE = ''40001''') > 0
)
SELECT
  'Conflictos sin reintentos infinitos (D20e)' AS check_name,
  COALESCE(con_40001, 'ninguna función lanza 40001') AS valor,
  CASE
    WHEN con_40001 IS NULL THEN '✅ OK («alguien lo cambió en medio» responde 409 con PT409)'
    ELSE '❌ ' || con_40001 || ' todavía lanza 40001: PostgREST reintenta sin fin y la petición se cuelga → corre supabase/migrations/20260928140000_d20e_conflicto_pt409.sql'
  END AS resultado
FROM d20e;

-- ─── CHECK 22: es_admin() y es_staff() normalizan el rol (S2) ───────────────
-- Aplica a toda base. Las dos tienen que comparar con LOWER(rol), ser SECURITY
-- DEFINER y fijar search_path = public (fix S2, 20260729121000). Sin LOWER, un
-- admin o secretario con el rol en mayúsculas pierde el panel en silencio, y
-- D7b, D8, D16, D20a y D20b abortan en su preflight. Una copia de
-- 20260716130000_rol_secretario.sql anterior a D20g, corrida después del paso 7
-- (la fila 2 de 7bis), revertía es_staff() sin que ningún otro CHECK lo viera:
-- por eso se revisa el cuerpo, no solo el nombre.
WITH s2 AS (
  SELECT f,
         to_regprocedure('public.' || f) IS NOT NULL AS existe,
         COALESCE((SELECT p.prosrc ~* 'lower\s*\(\s*rol\s*\)'
                     FROM pg_proc p WHERE p.oid = to_regprocedure('public.' || f)), false) AS con_lower,
         COALESCE((SELECT EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=public%')
                     FROM pg_proc p WHERE p.oid = to_regprocedure('public.' || f)), false) AS con_search_path,
         COALESCE((SELECT p.prosecdef
                     FROM pg_proc p WHERE p.oid = to_regprocedure('public.' || f)), false) AS definer
    FROM unnest(ARRAY['es_admin()', 'es_staff()']) AS f
), resumen AS (
  SELECT string_agg(f, ', ' ORDER BY f) FILTER (WHERE NOT existe) AS faltan,
         string_agg(f || CASE WHEN NOT con_lower THEN ' sin LOWER' ELSE '' END
                       || CASE WHEN NOT con_search_path THEN ' sin search_path' ELSE '' END
                       || CASE WHEN NOT definer THEN ' sin SECURITY DEFINER' ELSE '' END, ', ' ORDER BY f)
           FILTER (WHERE existe AND NOT (con_lower AND con_search_path AND definer)) AS revertidas
    FROM s2
)
SELECT
  'es_admin() / es_staff() con LOWER (S2)' AS check_name,
  'faltan: ' || COALESCE(faltan, 'ninguna') || ' / sin S2: ' || COALESCE(revertidas, 'ninguna') AS valor,
  CASE
    WHEN faltan IS NOT NULL
      THEN '❌ FALTA ' || faltan || ' → corre supabase/migrations/20260716130000_rol_secretario.sql y después supabase/migrations/20260729121000_fix_s2_es_admin.sql'
    WHEN revertidas IS NOT NULL
      THEN '❌ S2 REVERTIDO (' || revertidas || '): un admin o secretario con el rol en mayúsculas pierde el panel → vuelve a correr supabase/migrations/20260729121000_fix_s2_es_admin.sql (cliente ya desplegado: scripts/fix-s1-s2-roles.sql)'
    ELSE '✅ OK (las dos con LOWER(rol), SECURITY DEFINER y search_path = public)'
  END AS resultado
FROM resumen;


-- ─── CHECK 23: el alta nunca toma el rol del metadata (S1) ──────────────────
-- Aplica a toda base. handle_new_user() crea la fila de usuarios de cada cuenta
-- nueva y es SECURITY DEFINER: si toma el rol de raw_user_meta_data (lo escribe
-- quien llama a signUp con la anon key), cualquiera se registra como admin
-- (Bug 66). El fix S1 (20260729120000) lo deja en 'alumno' literal; hasta el
-- 28-sep-2026, supabase/schema.sql y schema-02-funciones.sql traían el cuerpo
-- viejo. Se revisa el cuerpo SIN comentarios: el de S1 menciona
-- raw_user_meta_data->>'rol' en un comentario, y un ILIKE sobre prosrc crudo lo
-- marcaba como vulnerable. También se pide que el trigger de auth.users se
-- DISPARE en un signUp: de fila, en INSERT, y en modo origen ('O' o 'A'). 'D'
-- (apagado) y 'R' (solo réplica, tras un ENABLE REPLICA TRIGGER) no corren.
WITH f AS (
  SELECT p.oid,
         regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'g'), '--[^\n]*', '', 'g') AS cuerpo
    FROM pg_proc p
   WHERE p.oid = to_regprocedure('public.handle_new_user()')
), r AS (
  SELECT
    (SELECT count(*) FROM f) AS existe,
    -- ->>, ->, #>> '{rol}' (con cast ::jsonb o entre paréntesis) y jsonb_extract_path(_text).
    COALESCE((SELECT cuerpo ~* 'raw_user_meta_data\s*\)?\s*(::\s*jsonb\s*\)?\s*)?(->>?|#>>?)\s*''\{?rol\}?'''
                  OR cuerpo ~* 'jsonb_extract_path(_text)?\s*\(\s*(new\s*\.\s*)?raw_user_meta_data\s*(::\s*jsonb\s*)?,\s*''rol''' FROM f), false) AS lee_rol,
    COALESCE((SELECT cuerpo ~ '''alumno''' FROM f), false) AS con_alumno,
    COALESCE((SELECT EXISTS (
       SELECT 1 FROM pg_trigger t
        WHERE t.tgrelid = to_regclass('auth.users') AND NOT t.tgisinternal
          AND t.tgfoid = f.oid AND t.tgenabled IN ('O', 'A')
          AND (t.tgtype & 1) = 1 AND (t.tgtype & 4) = 4) FROM f), false) AS con_trigger
)
SELECT
  'handle_new_user() sin rol del metadata (S1)' AS check_name,
  CASE WHEN existe = 0 THEN 'no existe'
       ELSE 'lee el rol del metadata: ' || CASE WHEN lee_rol THEN 'sí' ELSE 'no' END
         || ' / rol ''alumno'' fijo: ' || CASE WHEN con_alumno THEN 'sí' ELSE 'no' END
         || ' / trigger en auth.users: ' || CASE WHEN con_trigger THEN 'sí' ELSE 'no' END
  END AS valor,
  CASE
    WHEN existe = 0 OR NOT con_trigger
      THEN '❌ FALTA handle_new_user() o su trigger en auth.users → corre supabase/migrations/20260729120000_fix_s1_rol_alta.sql (los recrea con el cuerpo S1)'
    WHEN lee_rol OR NOT con_alumno
      THEN '❌ S1 ABIERTO: el alta toma el rol del metadata y cualquiera se registra como admin con la anon key → corre supabase/migrations/20260729120000_fix_s1_rol_alta.sql (cliente ya desplegado: scripts/fix-s1-s2-roles.sql)'
    ELSE '✅ OK (rol ''alumno'' fijo; del metadata solo sale el nombre)'
  END AS resultado
FROM r;

-- ─── CHECK 24: nadie inserta con su sesión en usuarios ni en documentos (#185) ─
-- Aplica a toda base. Todo INSERT legítimo en usuarios y documentos_alumno va
-- con service_role (register-complete, /api/admin/usuarios, /api/admin/alumnos,
-- /api/alumno/documentos). Si anon o authenticated conservan INSERT (los GRANT
-- de fábrica de Supabase se lo dan a toda tabla nueva), un alumno sube un
-- documento ya «verificado» con su sesión, y donde falte el trigger de alta una
-- cuenta nueva se crea su fila con rol 'admin' (Bug 220). Se mira el privilegio
-- de tabla Y de columna, y que ninguna política de INSERT sobre usuarios acepte
-- id = auth.uid().
WITH p AS (
  SELECT r.rol, t.tabla,
         to_regclass('public.' || t.tabla) IS NOT NULL AS existe,
         CASE WHEN to_regclass('public.' || t.tabla) IS NULL THEN false
              ELSE has_any_column_privilege(r.rol, 'public.' || t.tabla, 'INSERT') END AS puede
    FROM unnest(ARRAY['anon', 'authenticated']) AS r(rol)
   CROSS JOIN unnest(ARRAY['usuarios', 'documentos_alumno']) AS t(tabla)
   WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.rol)
), pol AS (
  SELECT string_agg(policyname, ', ' ORDER BY policyname) AS con_uid
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'usuarios' AND cmd IN ('INSERT', 'ALL')
     AND COALESCE(with_check, qual, '') ~* 'auth\.uid\(\)'
), r AS (
  SELECT string_agg(rol || ' → ' || tabla, ', ' ORDER BY tabla, rol) FILTER (WHERE puede) AS abiertos,
         string_agg(DISTINCT tabla, ', ') FILTER (WHERE NOT existe) AS faltan,
         (SELECT con_uid FROM pol) AS con_uid
    FROM p
)
SELECT
  'Sin INSERT propio en usuarios ni documentos_alumno (#185)' AS check_name,
  'con INSERT: ' || COALESCE(abiertos, 'nadie') || ' / política con auth.uid(): ' || COALESCE(con_uid, 'ninguna')
    || CASE WHEN faltan IS NOT NULL THEN ' / faltan tablas: ' || faltan ELSE '' END AS valor,
  CASE
    WHEN faltan IS NOT NULL
      THEN '❌ FALTA la tabla ' || faltan || ' → corre supabase/schema.sql (o scripts/schema.sql) antes de este check'
    WHEN abiertos IS NOT NULL OR con_uid IS NOT NULL
      THEN '❌ INSERT PROPIO ABIERTO (' || COALESCE(abiertos, con_uid) || '): un alumno sube documentos ya verificados y una cuenta sin fila se crea como admin → corre supabase/migrations/20260924120000_usuarios_sin_insert_propio.sql (idempotente)'
    ELSE '✅ OK (anon y authenticated sin INSERT; la política de INSERT de usuarios solo acepta al admin)'
  END AS resultado
FROM r;

-- ─── CHECK 25: condonar, regenerar y el plan a medida son del admin (D22b) ─
-- Aplica a toda base con cobro semanal instalado (calendario_pagos_autorizado);
-- en una base sin él no aplica. Las cuatro funciones del calendario
-- (registrar_cuota_semanal, condonar_semana, generar_calendario_pagos y
-- generar_calendario_por_nivel) solo se ejecutan con service_role: la app las
-- llama siempre así. Si anon o authenticated conservan EXECUTE, el secretario
-- condona, regenera o fija semanas y cuota con /rest/v1/rpc/… y su sesión, y
-- cualquiera con sesión de personal registra un pago a nombre de otro. La
-- guardia común pide es_admin() con sesión (segunda capa; se lee su cuerpo SIN
-- comentarios). Una copia vieja de 20260910130000_periodicidad_semanal.sql
-- devuelve el GRANT y es_staff(): por eso se miran las dos cosas.
WITH g AS (
  SELECT to_regprocedure('public.calendario_pagos_autorizado()') AS oid
), f AS (
  SELECT fn,
         (SELECT count(*)
            FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = fn) AS firmas,
         (SELECT string_agg(DISTINCT r.rol, '+' ORDER BY r.rol)
            FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           CROSS JOIN unnest(ARRAY['anon', 'authenticated']) AS r(rol)
           WHERE n.nspname = 'public' AND p.proname = fn
             AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.rol)
             AND has_function_privilege(r.rol, p.oid, 'EXECUTE')) AS abierta_a
    FROM unnest(ARRAY['registrar_cuota_semanal', 'condonar_semana',
                      'generar_calendario_pagos', 'generar_calendario_por_nivel']) AS fn
), c AS (
  SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'g'), '--[^\n]*', '', 'g') AS cuerpo
    FROM pg_proc p WHERE p.oid = (SELECT oid FROM g)
), r AS (
  SELECT (SELECT oid FROM g) IS NOT NULL AS semanal,
         COALESCE((SELECT cuerpo ~ 'es_admin\s*\(' AND cuerpo !~ 'es_staff\s*\(' FROM c), false) AS guardia_admin,
         string_agg(fn, ', ' ORDER BY fn) FILTER (WHERE firmas = 0) AS faltan,
         string_agg(fn || ' → ' || abierta_a, ', ' ORDER BY fn) FILTER (WHERE abierta_a IS NOT NULL) AS abiertas
    FROM f
)
SELECT
  'Cobranza semanal: condonar/regenerar solo admin (D22b)' AS check_name,
  CASE WHEN NOT semanal THEN 'sin cobro semanal instalado'
       ELSE 'EXECUTE con sesión: ' || COALESCE(abiertas, 'nadie')
         || ' / guardia: ' || CASE WHEN guardia_admin THEN 'es_admin()' ELSE 'NO pide es_admin()' END
         || CASE WHEN faltan IS NOT NULL THEN ' / faltan: ' || faltan ELSE '' END
  END AS valor,
  CASE
    WHEN NOT semanal
      THEN '✅ OK (esta base no tiene el calendario semanal: no aplica)'
    WHEN faltan IS NOT NULL
      THEN '❌ COBRO SEMANAL A MEDIAS (falta ' || faltan || ') → vuelve a correr supabase/migrations/20260910130000_periodicidad_semanal.sql y después supabase/migrations/20260928150000_d22b_cobranza_solo_admin.sql'
    WHEN abiertas IS NOT NULL OR NOT guardia_admin
      THEN '❌ COBRANZA ABIERTA (' || COALESCE(abiertas, 'la guardia acepta al secretario') || '): el secretario condona, regenera o fija una cuota con /rest/v1/rpc/… y su sesión → corre supabase/migrations/20260928150000_d22b_cobranza_solo_admin.sql (idempotente); si reapareció tras re-correr la migración de periodicidad, esa copia es vieja'
    ELSE '✅ OK (las cuatro funciones solo por el servidor; con sesión, la guardia pide es_admin())'
  END AS resultado
FROM r;

-- ─── CHECK 26: pagos solo por el servidor (D22c) ────────────────────────────
-- Aplica a toda base. Nadie con sesión (anon, authenticated) INSERTA, ACTUALIZA
-- ni BORRA `pagos` por /rest/v1 (ni por privilegio de tabla ni de columna): sin
-- esto, una sesión de personal registraba pagos sin las validaciones de la API y
-- a nombre de otro. curso_registrar_pago (legado de B3) y registrar_cuota_semanal
-- solo con service_role, y esta última con su guarda interna (K4). La lectura:
-- propio o admin, con un techo RESTRICTIVE (K2). El trigger de reversión solo
-- toca la semana del pago borrado (K6). Una copia vieja de B3, rol_secretario o
-- periodicidad corrida después devuelve parte de esto: por eso se miran los
-- privilegios reales y los cuerpos, no solo los nombres.
WITH t AS (
  SELECT to_regclass('public.pagos') AS oid
), priv AS (
  SELECT string_agg(ro.rol || ' ' || lower(pv.p), ', ' ORDER BY ro.rol, pv.p) AS abiertos
    FROM unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
   CROSS JOIN unnest(ARRAY['INSERT', 'UPDATE', 'DELETE']) AS pv(p)
   WHERE (SELECT oid FROM t) IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ro.rol)
     AND (has_table_privilege(ro.rol, 'public.pagos', pv.p)
          OR (pv.p <> 'DELETE' AND has_any_column_privilege(ro.rol, 'public.pagos', pv.p)))
), fn AS (
  SELECT string_agg(DISTINCT p.proname || ' → ' || ro.rol, ', ') AS abiertas
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   CROSS JOIN unnest(ARRAY['anon', 'authenticated']) AS ro(rol)
   WHERE n.nspname = 'public' AND p.proname IN ('curso_registrar_pago', 'registrar_cuota_semanal')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ro.rol)
     AND has_function_privilege(ro.rol, p.oid, 'EXECUTE')
), k4 AS (
  SELECT count(*) FILTER (WHERE regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'g'), '--[^\n]*', '', 'g')
                                  !~ 'request\.jwt\.claims.*IS DISTINCT FROM ''service_role''') AS sin_guarda
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'registrar_cuota_semanal'
), techo AS (
  SELECT count(*) AS n
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'pagos' AND permissive = 'RESTRICTIVE' AND cmd = 'SELECT'
     AND roles @> ARRAY['anon', 'authenticated']::name[]
     AND lower(regexp_replace(coalesce(qual, ''), '[\s()]|public\.', '', 'g')) IN ('alumno_id=auth.uidores_admin', 'alumno_id=auth.uid')
), perm AS (
  SELECT string_agg(policyname, ', ' ORDER BY policyname) AS con_staff
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'pagos' AND permissive = 'PERMISSIVE' AND cmd IN ('SELECT', 'ALL')
     AND coalesce(qual, '') ~* '(es_staff|is_staff)\s*\('
), k6 AS (
  SELECT to_regprocedure('public.calendario_pagos_revertir_al_borrar()') IS NULL
         OR COALESCE((SELECT p.prosrc ~ 'pago_id\s+IS\s+NULL\s+OR\s+pago_id\s*=\s*OLD\.id'
                        FROM pg_proc p WHERE p.oid = to_regprocedure('public.calendario_pagos_revertir_al_borrar()')), false) AS ok
), r AS (
  SELECT (SELECT oid FROM t) IS NOT NULL AS existe,
         COALESCE((SELECT relforcerowsecurity FROM pg_class WHERE oid = (SELECT oid FROM t)), false) AS forzada,
         (SELECT abiertos FROM priv) AS abiertos, (SELECT abiertas FROM fn) AS abiertas,
         (SELECT sin_guarda FROM k4) AS sin_guarda, (SELECT n FROM techo) AS techo,
         (SELECT con_staff FROM perm) AS con_staff, (SELECT ok FROM k6) AS k6
)
SELECT
  'Pagos solo por el servidor (D22c)' AS check_name,
  CASE WHEN NOT existe THEN 'no existe la tabla pagos'
       ELSE 'escritura con sesión: ' || COALESCE(abiertos, 'nadie')
         || ' / RPC con sesión: ' || COALESCE(abiertas, 'nadie')
         || ' / guarda K4: ' || CASE WHEN sin_guarda = 0 THEN 'sí' ELSE 'NO' END
         || ' / techo SELECT: ' || CASE WHEN techo > 0 THEN 'sí' ELSE 'NO' END
         || ' / trigger K6: ' || CASE WHEN k6 THEN 'sí' ELSE 'NO' END
         || CASE WHEN con_staff IS NOT NULL THEN ' / permisivas con es_staff (las frena el techo): ' || con_staff ELSE '' END
  END AS valor,
  CASE
    WHEN NOT existe
      THEN '❌ FALTA la tabla pagos → corre supabase/schema.sql (o scripts/schema.sql) antes de este check'
    WHEN forzada
      THEN '❌ pagos con FORCE ROW LEVEL SECURITY: las funciones SECURITY DEFINER (curso_cobrar) dejarían de escribir → quítalo y corre supabase/migrations/20260928160000_d22c_postgrest_directo.sql'
    WHEN abiertos IS NOT NULL OR abiertas IS NOT NULL OR sin_guarda > 0 OR techo = 0 OR NOT k6
      THEN '❌ ESCRITURA DIRECTA ABIERTA (' || COALESCE(abiertos, abiertas, CASE WHEN sin_guarda > 0 THEN 'registrar_cuota_semanal sin guarda interna' WHEN techo = 0 THEN 'sin techo de SELECT' ELSE 'trigger de reversión viejo' END)
           || ') → corre supabase/migrations/20260928160000_d22c_postgrest_directo.sql (idempotente); si reapareció tras re-correr B3, rol_secretario o periodicidad, esas copias son viejas'
    ELSE '✅ OK (pagos solo por el servidor y las funciones SECURITY DEFINER; se lee lo propio o, el admin, todo)'
  END AS resultado
FROM r;

-- ─── CHECK 27: sin directorio del personal (D22c) ───────────────────────────
-- Aplica a toda base. Una sesión solo lee SU fila de usuarios (el admin, todas):
-- nombre, correo, teléfono y rol del resto no salen por /rest/v1/usuarios. Lo
-- garantiza un techo RESTRICTIVE, que ninguna política permisiva ensancha: ni una
-- copia vieja de 20260716130000_rol_secretario.sql re-corrida después (su
-- «ver propio perfil» con es_staff()) ni una de drift. En el valor se listan las
-- permisivas que todavía mencionan es_staff (informativo: las frena el techo).
WITH techo AS (
  SELECT count(*) AS n
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'usuarios' AND permissive = 'RESTRICTIVE' AND cmd = 'SELECT'
     AND roles @> ARRAY['anon', 'authenticated']::name[]
     AND lower(regexp_replace(coalesce(qual, ''), '[\s()]|public\.', '', 'g')) IN ('id=auth.uidores_admin', 'id=auth.uid')
), perm AS (
  SELECT string_agg(policyname, ', ' ORDER BY policyname) AS con_staff
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'usuarios' AND permissive = 'PERMISSIVE' AND cmd IN ('SELECT', 'ALL')
     AND coalesce(qual, '') ~* '(es_staff|is_staff)\s*\(|\mtrue\M'
), r AS (
  SELECT (SELECT n FROM techo) AS techo, (SELECT con_staff FROM perm) AS con_staff,
         COALESCE((SELECT relforcerowsecurity FROM pg_class WHERE oid = to_regclass('public.usuarios')), false) AS forzada,
         to_regclass('public.usuarios') IS NOT NULL AS existe
)
SELECT
  'Sin directorio del personal (D22c)' AS check_name,
  CASE WHEN NOT existe THEN 'no existe la tabla usuarios'
       ELSE 'techo propio o admin: ' || CASE WHEN techo > 0 THEN 'sí' ELSE 'NO' END
         || ' / permisivas con es_staff: ' || COALESCE(con_staff, 'ninguna')
  END AS valor,
  CASE
    WHEN NOT existe
      THEN '❌ FALTA la tabla usuarios → corre supabase/schema.sql (o scripts/schema.sql) antes de este check'
    WHEN forzada
      THEN '❌ usuarios con FORCE ROW LEVEL SECURITY: es_admin()/es_staff() y la constancia dejarían de leer → quítalo y corre supabase/migrations/20260928160000_d22c_postgrest_directo.sql'
    WHEN techo = 0
      THEN '❌ DIRECTORIO ABIERTO: una sesión puede leer nombre, correo, teléfono y rol de todo el personal y los alumnos → corre supabase/migrations/20260928160000_d22c_postgrest_directo.sql (idempotente)'
    ELSE '✅ OK (cada sesión lee su fila; el admin, todas)'
  END AS resultado
FROM r;
