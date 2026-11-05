-- ============================================================
-- setup-primaria.sql — Contenido de PRIMARIA para un combo que la vende
--
-- 🛑 CUÁNDO: DESPUÉS de scripts/setup.sql y de TODA la cadena de migraciones. No va
-- dentro de setup.sql: ese corre antes que B1, 20260812 y 20260820, que recrean los
-- CHECK de nivel con una lista cerrada y abortarían con 23514 al encontrar filas
-- 'primaria'. Un combo sin Primaria nunca corre este archivo.
--
-- Uso SIEMPRE desde el directorio scripts/ (los \i resuelven las rutas contra el
-- directorio de trabajo):
--   cd scripts && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f setup-primaria.sql
--
-- Orden:
--   1. seed-primaria.sql             18 materias, 144 semanas, 432 de quiz, 18 exámenes,
--                                    180 preguntas y su glosario.
--   2. seed-actividades-primaria.sql UPDATE de semanas.actividades/_pdf_url y
--                                    materias.cuaderno_pdf_url.
--   3. La materia demo: quita «la misma validez oficial» de la Tutoría de Ingreso.
--   4. post-setup-primaria-check.sql Conteos: todo tiene que salir ✅.
--
-- Los dos seeds son COPIA EXACTA de banco-materias-sec-prepa (seed-primaria-data-only.sql
-- y actividades/seed-actividades-primaria.sql): NO editar aquí, se regeneran allá.
-- Idempotente: los INSERT llevan ON CONFLICT DO NOTHING y los ids son deterministas.
-- ============================================================

\set ON_ERROR_STOP on

-- La guarda de orden. Mirar si el CHECK admite 'primaria' no sirve: `schema.sql` ya lo
-- admite, y B1, 20260812 y 20260820 (que corren después) lo recrearían con lista
-- cerrada y abortarían al ver estas filas. La marca solo la deja la última migración.
DO $$
DECLARE
  v_marca text;
BEGIN
  SELECT obj_description(oid, 'pg_constraint') INTO v_marca
    FROM pg_constraint
   WHERE conrelid = 'public.materias'::regclass AND conname = 'materias_nivel_check';
  IF v_marca IS DISTINCT FROM 'nivel_primaria:20261104120000' THEN
    RAISE EXCEPTION 'Falta terminar la cadena de migraciones: no encuentro la marca de supabase/migrations/20261104120000_nivel_primaria.sql. Corre setup.sql y TODA la cadena de SETUP.md, y luego este archivo. No se sembró nada.';
  END IF;
END $$;

\echo '=== PRIMARIA 1/4: seed-primaria.sql ==='
\i seed-primaria.sql

\echo '=== PRIMARIA 2/4: seed-actividades-primaria.sql ==='
\i seed-actividades-primaria.sql

-- La materia demo la alcanza todo alumno, también en modo demo (acceso-materias.ts,
-- `nivel.eq.demo`, y /api/alumno/meses), y su semana 1 promete «la misma validez
-- oficial». Va aquí y no en seed-contenido-semanas.sql: un combo sin Primaria no corre
-- este archivo. El texto instalado sale de ese seed; seed-demo-materia.sql trae otra
-- variante, por si se reaplica. Solo toca la materia demo: la Tutoría de Preparatoria
-- no la ve Primaria. Idempotente: la segunda corrida ya no encuentra la frase.
\echo '=== PRIMARIA 3/4: materia demo sin validez oficial ==='
UPDATE public.semanas s
   SET contenido = regexp_replace(
         s.contenido,
         '(E|e)s (la misma preparatoria|el mismo programa que en el sistema presencial), con la misma validez oficial, pero (en formato )?100% en línea',
         '\1s estudiar sin ir a la escuela, en formato 100% en línea',
         'g')
  FROM public.meses_contenido mc
  JOIN public.materias m ON m.id = mc.materia_id
 WHERE s.mes_id = mc.id
   AND m.nivel = 'demo'
   AND s.contenido LIKE '%validez oficial%';

\echo '=== PRIMARIA 4/4: post-setup-primaria-check.sql ==='
\i post-setup-primaria-check.sql
