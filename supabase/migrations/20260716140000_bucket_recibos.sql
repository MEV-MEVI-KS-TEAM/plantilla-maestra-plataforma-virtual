-- Panel Admin Unificado (Fase 3): bucket 'recibos' para PDFs de recibo de pago.
-- Privado, 2MB (los recibos son pequeños). Clientes nuevos lo crean junto con
-- avatares/documentos/constancias (sección 7 de supabase/schema.sql).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recibos', 'recibos', false, 2097152, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "recibos: ver propio" ON storage.objects;
CREATE POLICY "recibos: ver propio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recibos' AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.es_staff()
    )
  );

DROP POLICY IF EXISTS "recibos: staff sube" ON storage.objects;
CREATE POLICY "recibos: staff sube"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recibos' AND public.es_staff());
