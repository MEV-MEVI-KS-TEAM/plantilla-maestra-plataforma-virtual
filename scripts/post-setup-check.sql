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
  AND cmd = 'SELECT';

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
  LEFT JOIN pg_policy p ON p.polrelid = c.oid AND p.polcmd IN ('r', '*')
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

-- ─── CHECK 14: el CHECK de alumnos.modalidad admite los planes de la escuela ──
-- Sin '6_meses_lic' (u otro id de config.ts), dar de alta a un alumno en ese
-- plan falla con 23514 y la ruta de alta borra el usuario de Auth que acababa
-- de crear (Bug 68). Se busca por CATÁLOGO (conkey), no por nombre (Bug 72):
-- tiene que haber UN solo CHECK de una columna sobre `modalidad`, y admitir el
-- plan de 6 meses de licenciatura (migración 20260925120000).
WITH col AS (
  SELECT attnum FROM pg_attribute
   WHERE attrelid = 'public.alumnos'::regclass AND attname = 'modalidad' AND NOT attisdropped
), checks AS (
  SELECT pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c, col
   WHERE c.conrelid = 'public.alumnos'::regclass AND c.contype = 'c' AND c.conkey = ARRAY[col.attnum]
)
SELECT
  'CHECK de alumnos.modalidad (uno solo, con 6_meses_lic)' AS check_name,
  COUNT(*)::text AS valor,
  CASE
    WHEN COUNT(*) = 1 AND bool_and(def LIKE '%''6_meses_lic''%') THEN '✅ OK'
    WHEN COUNT(*) = 0 THEN '❌ FALTA el CHECK de alumnos.modalidad'
    WHEN COUNT(*) > 1 THEN '❌ HAY ' || COUNT(*) || ' CHECK sobre modalidad (Bug 72): consolidar con 20260925120000'
    ELSE '❌ El CHECK no admite 6_meses_lic: correr 20260925120000_licenciatura_plan_6_meses.sql'
  END AS resultado
FROM checks;
