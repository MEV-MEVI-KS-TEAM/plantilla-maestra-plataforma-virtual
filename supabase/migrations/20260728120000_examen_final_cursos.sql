-- Examen Final de Curso (vertical "Cursos de Ingreso").
--
-- Agrega 2 tablas NUEVAS al módulo Cursos y Diplomados. Cero ALTER a tablas
-- existentes. Idempotente y re-ejecutable.
--
-- ORDEN: correr DESPUÉS de scripts/migracion-cursos-diplomados.sql, que es
-- quien crea public.cursos. Si esa migración no se ha aplicado, este script
-- se detiene con un mensaje claro en vez de fallar por una FK rota.
--
-- Aplicar por conexión directa (puerto 5432, NUNCA el pooler 6543):
--   psql "postgresql://postgres:<PASS>@db.<REF>.supabase.co:5432/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/migrations/20260728120000_examen_final_cursos.sql
--
-- Diseño de seguridad (el banco de preguntas ES el producto):
--   * curso_examen_preguntas: RLS solo-admin en TODAS las operaciones. El
--     alumno NUNCA lee esta tabla por PostgREST. La API server-side le entrega
--     las preguntas SANITIZADAS (sin respuesta_correcta ni explicacion) usando
--     el cliente admin, después de validar sesión y acceso al curso.
--     Es lo contrario del patrón del quiz semanal (Bug 59), que hace select('*')
--     y reenvía la respuesta correcta al cliente.
--   * La calificación es 100% server-side, como evaluacion/[id]/enviar.
--   * curso_examen_resultados: el alumno ve los suyos; escribe solo la API con
--     cliente admin al calificar.
--   * Ninguna política hace SELECT a su propia tabla en USING (regla anti-Bug 16).
--   * Se reutiliza public.is_admin() — NO se crea otra función de rol. El techo
--     de D22d usa public.es_admin(), la misma que los techos de los otros bancos.
--   * D22d: dos capas en el banco (techo RESTRICTIVE solo-admin + SELECT por
--     lista blanca de columnas, sin respuesta_correcta ni explicacion) y
--     `respuestas` de los resultados sin SELECT para la sesión: el ✓/✗ guardado
--     de un envío con reintento pendiente delataba la clave por eliminación.
--     Re-correr este archivo ya no reabre nada (CHECK 29).

BEGIN;

-- ── Preflight ──
DO $preflight$
BEGIN
  IF to_regclass('public.cursos') IS NULL THEN
    RAISE EXCEPTION 'Falta public.cursos. Corre antes scripts/migracion-cursos-diplomados.sql.';
  END IF;
  IF to_regclass('public.alumnos') IS NULL THEN
    RAISE EXCEPTION 'Falta public.alumnos (schema base).';
  END IF;
  IF to_regproc('public.is_admin') IS NULL OR to_regproc('public.es_admin') IS NULL THEN
    RAISE EXCEPTION 'Falta public.is_admin() o public.es_admin(). Corre antes supabase/schema.sql.';
  END IF;
END
$preflight$;

-- ── 1) Banco de preguntas del examen ──
CREATE TABLE IF NOT EXISTS public.curso_examen_preguntas (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id           UUID    NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  orden              INTEGER NOT NULL DEFAULT 0,
  tema               TEXT,
  enunciado          TEXT    NOT NULL,
  opcion_a           TEXT    NOT NULL,
  opcion_b           TEXT    NOT NULL,
  opcion_c           TEXT    NOT NULL,
  opcion_d           TEXT    NOT NULL,
  respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('a', 'b', 'c', 'd')),
  explicacion        TEXT
);

-- ── 2) Resultados de cada envío ──
-- Un renglón por envío: el historial y el "mejor puntaje" salen gratis, sin
-- estados de intento ni autosave.
CREATE TABLE IF NOT EXISTS public.curso_examen_resultados (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id        UUID          NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  -- Misma referencia de alumno que intentos_evaluacion.
  alumno_id       UUID          NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  aciertos        INTEGER       NOT NULL,
  total           INTEGER       NOT NULL,
  porcentaje      NUMERIC(5, 2) NOT NULL,
  desglose_temas  JSONB,                     -- [{tema, aciertos, total}]
  respuestas      JSONB         NOT NULL,    -- [{pregunta_id, respuesta, es_correcta}]
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Índices en FKs ──
CREATE INDEX IF NOT EXISTS idx_curso_examen_preguntas_curso
  ON public.curso_examen_preguntas (curso_id, orden);
CREATE INDEX IF NOT EXISTS idx_curso_examen_resultados_curso
  ON public.curso_examen_resultados (curso_id);
CREATE INDEX IF NOT EXISTS idx_curso_examen_resultados_alumno
  ON public.curso_examen_resultados (alumno_id, created_at DESC);

-- ── RLS ──
ALTER TABLE public.curso_examen_preguntas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_examen_resultados ENABLE ROW LEVEL SECURITY;

-- preguntas: SOLO admin, en todas las operaciones. Sin excepciones.
-- El alumno recibe las preguntas sanitizadas por la API, nunca por PostgREST.
DROP POLICY IF EXISTS "curso_examen_preguntas: solo admin" ON public.curso_examen_preguntas;
CREATE POLICY "curso_examen_preguntas: solo admin" ON public.curso_examen_preguntas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- D22d: techo RESTRICTIVE solo-admin. Se combina con AND con toda permisiva:
-- ni una política de drift ni una copia vieja la ensanchan.
DROP POLICY IF EXISTS "curso_examen_preguntas: techo solo admin (D22d)" ON public.curso_examen_preguntas;
CREATE POLICY "curso_examen_preguntas: techo solo admin (D22d)" ON public.curso_examen_preguntas
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (public.es_admin()) WITH CHECK (public.es_admin());

-- resultados: el alumno ve los propios; admin ve todos.
DROP POLICY IF EXISTS "curso_examen_resultados: ver propios o admin" ON public.curso_examen_resultados;
CREATE POLICY "curso_examen_resultados: ver propios o admin" ON public.curso_examen_resultados
  FOR SELECT TO authenticated
  USING (alumno_id = auth.uid() OR public.is_admin());

-- Escrituras solo admin: los INSERT los hace la API con cliente admin al
-- calificar, para que el alumno no pueda fabricarse un resultado.
DROP POLICY IF EXISTS "curso_examen_resultados: admin escribe" ON public.curso_examen_resultados;
CREATE POLICY "curso_examen_resultados: admin escribe" ON public.curso_examen_resultados
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Grants ──
-- El acceso real a las filas lo decide la RLS; sin GRANT, PostgREST responde 401
-- antes siquiera de evaluar las políticas. D22d: el SELECT va por LISTA BLANCA de
-- columnas (el REVOKE de tabla quita antes cualquier GRANT viejo, también los de
-- columna): ninguna sesión lee respuesta_correcta ni explicacion del banco, ni
-- `respuestas` (el ✓/✗ de cada envío) de los resultados. anon, nada. La app lee y
-- escribe todo con el service role.
REVOKE ALL    ON public.curso_examen_preguntas  FROM anon, PUBLIC;
REVOKE SELECT ON public.curso_examen_preguntas  FROM authenticated;
GRANT  INSERT, UPDATE, DELETE ON public.curso_examen_preguntas TO authenticated;
GRANT  SELECT (id, curso_id, orden, tema, enunciado, opcion_a, opcion_b, opcion_c, opcion_d)
  ON public.curso_examen_preguntas TO authenticated;
GRANT  ALL    ON public.curso_examen_preguntas  TO service_role;

REVOKE ALL    ON public.curso_examen_resultados FROM anon, PUBLIC;
REVOKE SELECT ON public.curso_examen_resultados FROM authenticated;
GRANT  INSERT, UPDATE, DELETE ON public.curso_examen_resultados TO authenticated;
GRANT  SELECT (id, curso_id, alumno_id, aciertos, total, porcentaje, desglose_temas, created_at)
  ON public.curso_examen_resultados TO authenticated;
GRANT  ALL    ON public.curso_examen_resultados TO service_role;

COMMIT;
