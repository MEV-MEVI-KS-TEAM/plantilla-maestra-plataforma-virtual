-- ============================================================
-- Migration: Bug 33 — dedupe preguntas duplicadas + UNIQUE constraint
-- ============================================================
-- Fecha: 5-may-2026
-- Aplicable a: clientes desplegados ANTES del 5-may-2026 que tengan
--              preguntas duplicadas por overlap entre
--              seed-evaluaciones-y-quiz.sql y
--              seed-preguntas-evaluaciones-universal.sql.
--
-- Auditoría — verificar si el cliente está afectado:
--
--   SELECT COUNT(*) FROM (
--     SELECT evaluacion_id, pregunta, COUNT(*) c
--     FROM preguntas GROUP BY 1,2 HAVING COUNT(*) > 1
--   ) sub;
--   -- 0  = sano (igual conviene aplicar la UNIQUE constraint)
--   -- >0 = afectado, ejecutar este script
--
-- Idempotente: re-ejecutar no rompe nada.
-- Bug 33 documentado en mev-tools/PLAYBOOK-BUGS-CONOCIDOS.md.
-- ============================================================

BEGIN;

-- 1. Eliminar duplicados (conserva la primera ocurrencia por id)
DELETE FROM public.preguntas WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY evaluacion_id, pregunta
             ORDER BY id
           ) AS rn
    FROM public.preguntas
  ) t WHERE rn > 1
);

-- 2. Verificar 0 duplicados remanentes (defensivo, falla la transacción si quedan)
DO $$
DECLARE
  remanentes int;
BEGIN
  SELECT COUNT(*) INTO remanentes FROM (
    SELECT evaluacion_id, pregunta, COUNT(*) c
    FROM public.preguntas GROUP BY 1,2 HAVING COUNT(*) > 1
  ) s;

  IF remanentes > 0 THEN
    RAISE EXCEPTION 'Bug 33 dedupe FALLO: aún hay % grupos con duplicados', remanentes;
  END IF;

  RAISE NOTICE 'Bug 33 dedupe OK. 0 duplicados remanentes.';
END $$;

-- 3. Aplicar UNIQUE constraint para prevenir reocurrencia
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'preguntas_evaluacion_pregunta_unique'
  ) THEN
    ALTER TABLE public.preguntas
      ADD CONSTRAINT preguntas_evaluacion_pregunta_unique
      UNIQUE (evaluacion_id, pregunta);
    RAISE NOTICE 'UNIQUE constraint preguntas_evaluacion_pregunta_unique agregado.';
  ELSE
    RAISE NOTICE 'UNIQUE constraint ya existe, skip.';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- POST-CHECK (opcional, ejecutar fuera de la transacción):
-- ============================================================
-- SELECT COUNT(*) AS preguntas_total FROM preguntas;
-- SELECT 'esperado ~265 (no 515)' AS nota;
-- ============================================================
