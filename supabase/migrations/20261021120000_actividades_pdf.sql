-- ============================================================================
-- Actividades interactivas + PDF por semana / lección, y cuaderno completo
-- ============================================================================
-- QUÉ AGREGA. Seis columnas, TODAS NULL por defecto (ninguna fila cambia):
--
--   public.semanas.actividades           jsonb  — unidad «actividades/1» de la
--   public.semanas.actividades_pdf_url   text     semana (Sec/Prepa) o de la
--                                                 materia de licenciatura (1
--                                                 semana por materia) + su PDF
--   public.materias.cuaderno_pdf_url     text   — cuaderno completo de la
--                                                 materia (licenciaturas: la
--                                                 MISMA URL, la de la carrera,
--                                                 en todas sus materias)
--   public.curso_lecciones.actividades           jsonb — lo mismo por lección
--   public.curso_lecciones.actividades_pdf_url   text    de curso
--   public.cursos.cuaderno_pdf_url               text  — cuaderno del curso
--
-- Las llenan los bancos (sus seeds generan UPDATE por id): Sec/Prepa con
-- scripts/seed-actividades-sec-prepa.sql (incluido en scripts/setup.sql);
-- cursos y licenciaturas desde sus propios bancos. Los PDF viven en
-- https://aula-recursos.b-cdn.net/actividades/<nivel>/<slug>/<clave>.pdf.
-- Con todo en NULL la app se ve EXACTAMENTE igual que antes: la pantalla no
-- pinta nada (src/components/actividades/datos.ts).
--
-- ACCESO (RLS). NO SE AGREGA NI SE CAMBIA NINGUNA POLÍTICA. Las columnas
-- heredan el RLS de su tabla:
--   · semanas / materias: lectura para `authenticated`, escritura solo admin
--     (es_admin()). El alumno NO las lee directo: las recibe de
--     GET /api/alumno/materia/[id], que ya valida su acceso a la materia
--     (tieneAccesoMateria, lib/acceso-materias.ts) ANTES de leer las semanas
--     con service role — la misma puerta que el contenido y los videos.
--   · curso_lecciones / cursos: el visor las lee con la SESIÓN del alumno, así
--     que la RLS del módulo (inscripción + ventana de pago, B2/#255) decide
--     también quién ve las actividades de cada lección.
--   No hay políticas de escritura nuevas: solo el admin (y los seeds) escriben.
--   Límite conocido, el mismo de semanas.contenido hoy: cualquier sesión
--   `authenticated` puede pedir semanas.actividades por REST. Ver el PR para
--   la propuesta de cerrarlo (REVOKE por columna, patrón Bug 221).
--
-- MÓDULO CURSOS OPCIONAL: curso_lecciones y cursos solo existen donde se
-- instaló scripts/migracion-cursos-diplomados.sql (que ya trae estas columnas
-- para instalaciones nuevas). Sin el módulo, esa parte se salta sola.
--
-- IDEMPOTENTE Y RE-EJECUTABLE (ADD COLUMN IF NOT EXISTS). En transacción.
-- Espejo obligatorio: scripts/schema.sql y supabase/schema.sql (semanas,
-- materias) y scripts/migracion-cursos-diplomados.sql (cursos, lecciones).
-- Aplicar por conexión directa o pooler en MODO SESIÓN (5432, NUNCA 6543).
-- ============================================================================

BEGIN;

ALTER TABLE public.semanas ADD COLUMN IF NOT EXISTS actividades jsonb NULL;
ALTER TABLE public.semanas ADD COLUMN IF NOT EXISTS actividades_pdf_url text NULL;
ALTER TABLE public.materias ADD COLUMN IF NOT EXISTS cuaderno_pdf_url text NULL;

COMMENT ON COLUMN public.semanas.actividades IS
  'Actividades interactivas de la semana (JSON «actividades/1»). NULL = sin actividades.';
COMMENT ON COLUMN public.semanas.actividades_pdf_url IS
  'PDF imprimible de las actividades de la semana (https). NULL = sin PDF.';
COMMENT ON COLUMN public.materias.cuaderno_pdf_url IS
  'Cuaderno completo de actividades de la materia (https; en licenciatura, el de la carrera). NULL = sin cuaderno.';

DO $cursos$
BEGIN
  IF to_regclass('public.curso_lecciones') IS NOT NULL THEN
    ALTER TABLE public.curso_lecciones ADD COLUMN IF NOT EXISTS actividades jsonb NULL;
    ALTER TABLE public.curso_lecciones ADD COLUMN IF NOT EXISTS actividades_pdf_url text NULL;
    COMMENT ON COLUMN public.curso_lecciones.actividades IS
      'Actividades interactivas de la lección (JSON «actividades/1»). NULL = sin actividades.';
    COMMENT ON COLUMN public.curso_lecciones.actividades_pdf_url IS
      'PDF imprimible de las actividades de la lección (https). NULL = sin PDF.';
  ELSE
    RAISE NOTICE 'Sin módulo de Cursos: se omiten curso_lecciones.actividades / actividades_pdf_url.';
  END IF;
  IF to_regclass('public.cursos') IS NOT NULL THEN
    ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS cuaderno_pdf_url text NULL;
    COMMENT ON COLUMN public.cursos.cuaderno_pdf_url IS
      'Cuaderno completo de actividades del curso (https). NULL = sin cuaderno.';
  ELSE
    RAISE NOTICE 'Sin módulo de Cursos: se omite cursos.cuaderno_pdf_url.';
  END IF;
END
$cursos$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verificación (debe dar 6 filas con el módulo de Cursos, 3 sin él):
--   SELECT table_name, column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_schema = 'public'
--      AND (table_name, column_name) IN (('semanas','actividades'), ('semanas','actividades_pdf_url'),
--           ('materias','cuaderno_pdf_url'), ('curso_lecciones','actividades'),
--           ('curso_lecciones','actividades_pdf_url'), ('cursos','cuaderno_pdf_url'))
--    ORDER BY 1, 2;
