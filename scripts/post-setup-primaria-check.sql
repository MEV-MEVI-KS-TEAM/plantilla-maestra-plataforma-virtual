-- ============================================================
-- POST-SETUP CHECK — PRIMARIA
-- ============================================================
-- Se corre al final de scripts/setup-primaria.sql, y solo en combos con Primaria.
-- Reporta ✅ o ❌ por renglón. Si algo sale ❌, Primaria no está lista para entregar.
-- Los 144 videos de Bunny vienen en seed-primaria.sql desde la F5 del banco (6-nov-2026,
-- plantilla f3df046): una semana sin video es FAIL (P12), igual que en el smoke 9.12.
-- Un clon sembrado antes no los recibe volviendo a correr setup-primaria.sql (su
-- ON CONFLICT DO NOTHING no pisa video_url): van con scripts/videos_primaria_cliente.py
-- del banco de Sec/Prepa, cliente por cliente.
-- ============================================================

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo '  POST-SETUP CHECK — Primaria'
\echo '════════════════════════════════════════════════════════'

-- ─── P0: Los CHECK ───────────────────────────────────────
-- Volver a correr B1 o 20260820 sin alumnos de Primaria no aborta: le quita el valor
-- al CHECK de alumnos en silencio, y el siguiente registro daría 23514.
SELECT 'CHECK de nivel y modalidad admiten Primaria (deben ser 3)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 3 THEN '✅ OK' ELSE '❌ FAIL → correr supabase/migrations/20261104120000_nivel_primaria.sql' END AS resultado
  FROM pg_constraint
 WHERE (conrelid, conname, strpos(pg_get_constraintdef(oid), CASE conname WHEN 'alumnos_modalidad_check' THEN '''3_meses_pri''' ELSE '''primaria''' END) > 0)
       IN (('public.alumnos'::regclass, 'alumnos_nivel_check', true),
           ('public.materias'::regclass, 'materias_nivel_check', true),
           ('public.alumnos'::regclass, 'alumnos_modalidad_check', true));

-- ─── P1: Materias ──────────────────────────────────────────
SELECT 'Materias de Primaria (debe ser 18)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 18 THEN '✅ OK' ELSE '❌ FAIL → correr seed-primaria.sql' END AS resultado
  FROM public.materias WHERE nivel = 'primaria';

-- ─── P2: La lista única de apertura ────────────────────────
-- La ventana abre por `materias.orden`: de este orden salen las tablas de 3, 6 y 9 meses.
WITH lista AS (
  SELECT array_agg(nombre ORDER BY orden) AS nombres FROM public.materias WHERE nivel = 'primaria'
)
SELECT 'Orden de apertura de Primaria (lista única del plan)' AS check_name,
       CASE WHEN nombres = ARRAY[
         'Lectura y comprensión I', 'Números y operaciones I', 'Salud y cuidado personal',
         'Escritura I', 'Números y operaciones II', 'Tecnología y vida digital',
         'Lectura y comprensión II', 'Fracciones y decimales', 'Ciencias naturales y medio ambiente',
         'Escritura II', 'Figuras y medidas', 'Historia de México',
         'Comunicación oral y documentos personales', 'Cuentas útiles: dinero y economía familiar', 'Geografía de México y mi comunidad',
         'Información y gráficas', 'Derechos, ciudadanía y convivencia', 'Trabajo y emprendimiento'
       ] THEN 'igual al plan' ELSE 'distinto' END AS valor,
       CASE WHEN nombres = ARRAY[
         'Lectura y comprensión I', 'Números y operaciones I', 'Salud y cuidado personal',
         'Escritura I', 'Números y operaciones II', 'Tecnología y vida digital',
         'Lectura y comprensión II', 'Fracciones y decimales', 'Ciencias naturales y medio ambiente',
         'Escritura II', 'Figuras y medidas', 'Historia de México',
         'Comunicación oral y documentos personales', 'Cuentas útiles: dinero y economía familiar', 'Geografía de México y mi comunidad',
         'Información y gráficas', 'Derechos, ciudadanía y convivencia', 'Trabajo y emprendimiento'
       ] THEN '✅ OK' ELSE '❌ FAIL → las tablas de apertura no darían las del plan' END AS resultado
  FROM lista;

-- ─── P3: Semanas ───────────────────────────────────────────
SELECT 'Semanas de Primaria (debe ser 144)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 144 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
 WHERE m.nivel = 'primaria';

-- ─── P4: Lecciones con texto ───────────────────────────────
SELECT 'Semanas de Primaria con lección (debe ser 144)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 144 THEN '✅ OK' ELSE '❌ FAIL: una semana sin video y sin lección queda vacía' END AS resultado
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
 WHERE m.nivel = 'primaria' AND COALESCE(trim(s.contenido), '') <> '';

-- ─── P5: Quiz semanal ──────────────────────────────────────
SELECT 'Preguntas de quiz de Primaria (debe ser 432)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 432 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
  FROM public.quiz_semana q
  JOIN public.semanas s ON s.id = q.semana_id
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
 WHERE m.nivel = 'primaria';

-- ─── P6: Exámenes finales ──────────────────────────────────
SELECT 'Exámenes finales de Primaria (debe ser 18)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 18 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
  FROM public.evaluaciones e
  JOIN public.materias m ON m.id = e.materia_id
 WHERE m.nivel = 'primaria';

-- ─── P7: Preguntas de examen ───────────────────────────────
SELECT 'Preguntas de examen de Primaria (debe ser 180)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 180 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
  FROM public.preguntas p
  JOIN public.evaluaciones e ON e.id = p.evaluacion_id
  JOIN public.materias m ON m.id = e.materia_id
 WHERE m.nivel = 'primaria';

-- ─── P8: Ningún examen en 0/0 (Bug D) ──────────────────────
SELECT 'Exámenes de Primaria sin 10 preguntas (Bug D; debe ser 0)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FAIL: el alumno vería un examen 0/0' END AS resultado
  FROM (
    SELECT e.id
      FROM public.evaluaciones e
      JOIN public.materias m ON m.id = e.materia_id
      LEFT JOIN public.preguntas p ON p.evaluacion_id = e.id
     WHERE m.nivel = 'primaria'
     GROUP BY e.id
    HAVING COUNT(p.id) <> 10
  ) x;

-- ─── P9: Actividades ───────────────────────────────────────
SELECT 'Semanas de Primaria con actividades y PDF (debe ser 144)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 144 THEN '✅ OK' ELSE '❌ FAIL → correr seed-actividades-primaria.sql' END AS resultado
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
 WHERE m.nivel = 'primaria' AND s.actividades IS NOT NULL AND s.actividades_pdf_url IS NOT NULL;

-- ─── P10: Cuadernos ────────────────────────────────────────
SELECT 'Materias de Primaria con cuaderno (debe ser 18)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 18 THEN '✅ OK' ELSE '❌ FAIL → correr seed-actividades-primaria.sql' END AS resultado
  FROM public.materias WHERE nivel = 'primaria' AND cuaderno_pdf_url IS NOT NULL;

-- ─── P11: Sec/Prepa no se movieron ─────────────────────────
-- Sembrar Primaria no toca lo de los demás niveles: los conteos de TAREA 3 siguen ahí.
SELECT 'Materias de Secundaria y Preparatoria (debe ser 24)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 24 THEN '✅ OK' ELSE '❌ FAIL' END AS resultado
  FROM public.materias WHERE nivel IN ('secundaria', 'preparatoria');

-- ─── P12: Videos ───────────────────────────────────────────
-- Cuenta solo URLs que la app reproduce: el mismo criterio que parseBunnyUrl y que el
-- smoke 9.12 (host player/iframe, biblioteca numérica y GUID completo).
SELECT 'Semanas de Primaria con video de Bunny (debe ser 144)' AS check_name, COUNT(*)::text AS valor,
       CASE WHEN COUNT(*) = 144 THEN '✅ OK' ELSE '❌ FAIL → el seed trae los 144; un clon sembrado antes de f3df046 los recibe con videos_primaria_cliente.py del banco' END AS resultado
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
 WHERE m.nivel = 'primaria'
   AND s.video_url ~* '^https://(player|iframe)\.mediadelivery\.net/embed/[0-9]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/?$';
