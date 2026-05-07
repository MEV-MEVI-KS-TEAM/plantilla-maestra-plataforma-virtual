-- ============================================================
-- setup.sql — Seed inicial completo para un nuevo cliente MEV
--
-- Prerequisito: schema.sql ya aplicado en la BD.
--
-- Uso desde la raíz del proyecto:
--   psql "$DATABASE_URL" -f scripts/setup.sql
--
-- O desde el directorio scripts/:
--   psql "$DATABASE_URL" -f setup.sql
--
-- Orden de ejecución (respeta dependencias FK):
--   1. seed-contenido-ivs.sql                    — INSERT materias/meses/semanas base
--   2. seed-demo-materia.sql                     — UPDATE demo + INSERT meses/semanas/quiz demo
--   3. seed-contenido-semanas.sql                — UPDATE semanas.contenido (texto didáctico)
--   [seed-materias-ejemplo.sql eliminado — ver nota más abajo]
--   4. seed-crear-evaluaciones.sql               — INSERT 1 evaluación por materia (Bug 21)
--   [seed-evaluaciones-y-quiz.sql DEPRECATED — ver nota Bug 33 abajo]
--   5. seed-preguntas-evaluaciones-universal.sql — 265 preguntas reales (canónico, cierra Bug C)
--
-- Pasos manuales POSTERIORES a este script:
--   - create-admin.sql            — Crear usuario administrador (requiere UUID real)
--   - node scripts/update-videos.mjs   — Poblar video_url via YouTube API
-- ============================================================

\echo '=== PASO 1/4: seed-contenido-ivs.sql ==='
\i seed-contenido-ivs.sql

\echo '=== PASO 2/4: seed-demo-materia.sql ==='
\i seed-demo-materia.sql

\echo '=== PASO 3/4: seed-contenido-semanas.sql ==='
\i seed-contenido-semanas.sql

-- ============================================================================
-- DEPRECATED: seed-materias-ejemplo.sql — NO ejecutar
-- ============================================================================
-- Bug detectado durante deploy MARSEA INSTITUTE (26-abr-2026):
-- Este seed insertaba 12 materias placeholder por nivel (secundaria +
-- preparatoria) con orden 1-12, desplazando las materias REALES a orden 13-24.
-- Impacto: alumnos con meses_desbloqueados < 12 NUNCA accedían a contenido
-- real — solo veían placeholders vacíos (0 semanas, 0 evaluaciones).
--
-- La materia tutorial (nivel='demo') del seed-demo-materia.sql ya cubre
-- el caso de uso de demostración. Los placeholders son redundantes.
--
-- \i seed-materias-ejemplo.sql
-- ============================================================================

\echo '=== PASO 4/5: seed-crear-evaluaciones.sql ==='
\echo '── Creando 1 evaluación tipo Examen Final por cada materia activa (Bug 21) ──'
\i seed-crear-evaluaciones.sql

-- ============================================================================
-- DEPRECATED: seed-evaluaciones-y-quiz.sql — NO ejecutar (Bug 33)
-- ============================================================================
-- Bug detectado durante deploy ONCA ACADEMY (5-may-2026):
-- Este seed insertaba 250 preguntas universales que YA están cubiertas
-- (mejor estructuradas, dump validado en producción) por
-- seed-preguntas-evaluaciones-universal.sql (265 preguntas, canónico).
--
-- Overlap entre ambos: 221 preguntas en común.
-- Resultado al ejecutar ambos: 515 filas en lugar de 265 esperadas
-- (el ON CONFLICT del seed canónico era letra muerta sin la UNIQUE
-- constraint de schema.sql, que ya está agregada como Bug 33 fix).
--
-- El archivo se mantiene en /scripts/ con header DEPRECATED como histórico.
-- Migration para clientes existentes ya desplegados:
--   scripts/migrations/2026-05-bug33-dedupe-preguntas.sql
--
-- \i seed-evaluaciones-y-quiz.sql
-- ============================================================================

\echo '=== PASO 5/5: seed-preguntas-evaluaciones-universal.sql ==='
\echo '── Sembrando 265 preguntas reales por evaluación (cierra Bug C, canónico) ──'
\i seed-preguntas-evaluaciones-universal.sql

\echo '============================================================'
\echo 'Setup completo. Próximos pasos:'
\echo '  1. Edita src/lib/config.ts con los datos del cliente'
\echo '  2. Ejecuta create-admin.sql manualmente (requiere UUID real)'
\echo '  3. node scripts/update-videos.mjs --nivel demo   (videos demo)'
\echo '  4. node scripts/update-videos.mjs                (todos los videos)'
\echo '============================================================'

-- ============================================================================
-- CONSTRAINTS ADICIONALES (idempotentes)
-- ============================================================================

ALTER TABLE documentos_alumno ADD COLUMN IF NOT EXISTS tipo_documento TEXT;
ALTER TABLE documentos_alumno ADD COLUMN IF NOT EXISTS url_archivo TEXT;
ALTER TABLE documentos_alumno ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'documentos_alumno_alumno_tipo_unique'
  ) THEN 
    ALTER TABLE documentos_alumno 
    ADD CONSTRAINT documentos_alumno_alumno_tipo_unique 
    UNIQUE (alumno_id, tipo_documento); 
  END IF; 
EXCEPTION WHEN undefined_column THEN
  RAISE NOTICE 'Skipping: tipo_documento column not found';
END $$;

-- ============================================================================
-- LIMPIEZA FINAL
-- ============================================================================

NOTIFY pgrst, 'reload schema';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- PASO 6: Quiz semanal universal (576 preguntas balanceadas)
-- ============================================================================
\echo '=== PASO 6: seed-quiz-semanal-universal.sql ==='
\echo '── Sembrando 576 preguntas pedagógicas (3/semana × 8 semanas × 24 materias) ──'
\i seed-quiz-semanal-universal.sql

-- ============================================================================
-- PASO 7: Migration opción-d quiz_semana (CHECK a/b/c/d + explicacion)
-- ============================================================================
\echo '=== PASO 7: migrations/2026-05-add-opcion-d-quiz-semana.sql ==='
\echo '── Idempotente: opcion_d + explicacion + CHECK a/b/c/d (no-op si schema canónico) ──'
\i migrations/2026-05-add-opcion-d-quiz-semana.sql
