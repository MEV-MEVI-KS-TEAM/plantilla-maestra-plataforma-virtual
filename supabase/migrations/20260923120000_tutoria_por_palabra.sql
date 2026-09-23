-- ============================================================
-- es_materia_tutorial(): tutorial por la PALABRA «tutoría», no por «tutor»
--
-- Antes: p_nombre ILIKE '%tutor%'. Las materias de consentimiento de los
-- diplomados CONOCER (micropigmentación, dermapen) dicen «padre o tutor» en
-- su nombre: el gate las abría sin pago, fuera de la ventana, y los candados
-- de corregir-plan no las contaban como avance (MEDERI, 23-sep-2026:
-- micropigmentación abría 5/21 en el mes 1 en vez de 4; dermapen 8/33 en vez de 6).
--
-- ⚠️ Espejo de esTutorial() (src/lib/acceso-materias.ts): si cambia uno,
-- cambia el otro. \m = inicio de palabra en las regex de Postgres.
-- Idempotente (CREATE OR REPLACE); un solo bloque.
-- ============================================================
CREATE OR REPLACE FUNCTION public.es_materia_tutorial(p_nivel TEXT, p_nombre TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_nivel = 'demo', false)
      OR COALESCE(p_nombre ~* '\mtutor[ií]a', false);
$$;
