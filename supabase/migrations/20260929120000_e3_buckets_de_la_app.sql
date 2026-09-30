-- Bloque E3: los buckets que la app USA y que ninguna migración creaba.
--
-- Contados en el código (29-sep-2026), la app usa 6 buckets: avatars,
-- documentos, recibos, materias, branding y cursos. Las migraciones creaban 4
-- (recibos, materias, branding; cursos en scripts/migracion-cursos-diplomados.sql).
-- Un combo instalado por la ruta de la TAREA 3 + 3.9 (scripts/schema.sql, que no
-- trae storage, más las migraciones) nacía SIN:
--   * 'avatars'    — src/app/api/alumno/avatar/route.ts sube la foto del alumno
--                    y guarda getPublicUrl: sin el bucket, la subida da 500.
--                    Público por eso mismo; escribe solo el servidor (service
--                    role), así que no lleva políticas. (Bug 103: el esquema viejo
--                    creaba 'avatares', que nadie usa.)
--   * 'documentos' — «Mis documentos» (src/app/api/alumno/documentos/route.ts):
--                    sin el bucket, el alumno no puede subir nada.
-- Y 'materias' (20260819130000) se creaba sin tipo permitido: aquí toma el mismo
-- que supabase/schema.sql y la app (MATERIAL_MIMES = solo PDF), SOLO si no tenía.
--
-- Idempotente y conservadora: ON CONFLICT DO NOTHING (un bucket que ya existe no
-- se toca, aunque su configuración sea otra) y el UPDATE de 'materias' solo
-- llena lo que está vacío. Igual que las demás migraciones con storage: si el
-- rol no es dueño de storage.objects, las políticas se corren en el SQL Editor.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',    'avatars',    true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('documentos', 'documentos', false, 10485760, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['application/pdf']
 WHERE id = 'materias' AND allowed_mime_types IS NULL;

-- Documentos: el dueño (carpeta = su id) y el admin. La app firma con service
-- role, pero son las mismas políticas que supabase/schema.sql (sección 7).
DROP POLICY IF EXISTS "documentos: ver propio" ON storage.objects;
CREATE POLICY "documentos: ver propio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos' AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.es_admin()
    )
  );

DROP POLICY IF EXISTS "documentos: subir propio" ON storage.objects;
CREATE POLICY "documentos: subir propio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
