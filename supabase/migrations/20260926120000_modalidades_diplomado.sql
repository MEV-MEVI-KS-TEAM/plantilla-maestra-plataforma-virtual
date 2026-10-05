-- ============================================================================
-- Modalidades propias de los diplomados CONOCER (#222; en #254 con timestamp
-- posterior a 6_meses_lic y anterior a fix255, 5-oct-2026)
-- ============================================================================
-- Los diplomados viajan por el riel de licenciaturas (nivel 'licenciatura' +
-- carrera con esDiplomado) con planes propios '3_meses_dip' y '6_meses_dip'
-- (patrón #212 / SÉNDERI #194): su ritmo sale por carrera con
-- ceil(total / meses), no del '6_meses' de Prepa (2 por mes).
--
-- 🛑 CONSERVA '6_meses_lic' (Psicología, migración 20260918120000). La
--    migración de #212 recreaba el CHECK sin él: aquí se suman los tres valores.
-- 🛑 No toca el CHECK de nivel (Bug 98: 'diplomado' debe seguir ahí).
-- Idempotente. Todo en un solo bloque (regla 19).
BEGIN;

ALTER TABLE public.alumnos DROP CONSTRAINT IF EXISTS alumnos_modalidad_check;
ALTER TABLE public.alumnos ADD CONSTRAINT alumnos_modalidad_check
  CHECK (modalidad IS NULL OR modalidad = ANY (ARRAY[
    '3_meses', '6_meses', '6_meses_lic', '9_meses', '12_meses', '18_meses', '24_meses', '36_meses',
    '3_meses_dip', '6_meses_dip'
  ]));

ALTER TABLE public.alumnos ALTER COLUMN duracion_meses SET EXPRESSION AS (
  CASE modalidad
    WHEN '3_meses'     THEN 3
    WHEN '3_meses_dip' THEN 3
    WHEN '6_meses'     THEN 6
    WHEN '6_meses_lic' THEN 6
    WHEN '6_meses_dip' THEN 6
    WHEN '9_meses'     THEN 9
    WHEN '12_meses'    THEN 12
    WHEN '18_meses'    THEN 18
    WHEN '24_meses'    THEN 24
    WHEN '36_meses'    THEN 36
    ELSE 6
  END
);

NOTIFY pgrst, 'reload schema';
COMMIT;
