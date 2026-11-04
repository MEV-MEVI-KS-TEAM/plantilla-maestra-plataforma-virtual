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
--   3. post-setup-primaria-check.sql Conteos: todo tiene que salir ✅.
--
-- Los dos seeds son COPIA EXACTA de banco-materias-sec-prepa (seed-primaria-data-only.sql
-- y actividades/seed-actividades-primaria.sql): NO editar aquí, se regeneran allá.
-- Idempotente: los INSERT llevan ON CONFLICT DO NOTHING y los ids son deterministas.
-- ============================================================

\set ON_ERROR_STOP on

-- Sin la migración, el primer INSERT fallaría con un 23514 poco claro: se dice aquí.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.materias'::regclass AND contype = 'c'
       AND strpos(pg_get_constraintdef(oid), '''primaria''') > 0
  ) THEN
    RAISE EXCEPTION 'materias.nivel no admite primaria: corre primero supabase/migrations/20261104120000_nivel_primaria.sql';
  END IF;
END $$;

\echo '=== PRIMARIA 1/3: seed-primaria.sql ==='
\i seed-primaria.sql

\echo '=== PRIMARIA 2/3: seed-actividades-primaria.sql ==='
\i seed-actividades-primaria.sql

\echo '=== PRIMARIA 3/3: post-setup-primaria-check.sql ==='
\i post-setup-primaria-check.sql
