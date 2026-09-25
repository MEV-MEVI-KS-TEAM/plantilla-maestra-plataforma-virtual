-- ============================================================
-- Bug 221 — la clave del examen mensual se podía leer por REST
-- (GET /rest/v1/preguntas?select=respuesta_correcta con la sesión de cualquier
-- alumno). Idempotente; un solo bloque; conexión directa.
-- ============================================================
BEGIN;
DO $clave$
DECLARE cols text;
BEGIN
  -- La clave del examen mensual no es legible por REST: se re-otorgan todas las
  -- columnas de preguntas MENOS respuesta_correcta (el servidor califica con
  -- service_role). Bug 221 (MEDERI, 24-sep-2026).
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'preguntas' AND column_name <> 'respuesta_correcta';
  EXECUTE 'REVOKE SELECT ON public.preguntas FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.preguntas TO authenticated', cols);
END
$clave$;
COMMIT;
-- Verificación: has_column_privilege('authenticated','public.preguntas','respuesta_correcta','SELECT') = f
