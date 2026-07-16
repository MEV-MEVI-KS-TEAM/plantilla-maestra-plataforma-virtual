-- Panel Admin Unificado (Fase 2): rol 'secretario' (staff acotado).
-- Puede: registrar pagos y ver alumnos en modo lectura. NO puede: gestionar
-- usuarios, eliminar/editar pagos, contenido, documentos, configuración,
-- reportes, ni ver notas internas / documentos de alumnos.
-- Convención existente respetada: roles en minúsculas en BD
-- ('alumno' | 'admin' | 'secretario'); la app normaliza con toUpperCase().

-- 1. CHECK constraint de usuarios.rol: agregar 'secretario' (idempotente)
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol = ANY (ARRAY['alumno'::text, 'admin'::text, 'secretario'::text]));

-- 2. es_staff(): admin O secretario. Mismo patrón que es_admin()
--    (SECURITY DEFINER + STABLE + plpgsql con validación lazy — Bug 21).
--    es_admin() se mantiene EXACTAMENTE igual.
CREATE OR REPLACE FUNCTION public.es_staff() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
     WHERE id = auth.uid() AND rol IN ('admin', 'secretario')
  );
END;
$$;

-- 3. Lectura básica de usuarios/alumnos pasa a es_staff().
--    Escrituras (INSERT/UPDATE/DELETE) siguen admin-only.
--    documentos_alumno y demás tablas NO se tocan (siguen es_admin()).
DROP POLICY IF EXISTS "usuarios: ver propio perfil" ON public.usuarios;
CREATE POLICY "usuarios: ver propio perfil"
  ON public.usuarios FOR SELECT
  USING (id = auth.uid() OR public.es_staff());

DROP POLICY IF EXISTS "alumnos: ver propio registro" ON public.alumnos;
CREATE POLICY "alumnos: ver propio registro"
  ON public.alumnos FOR SELECT
  USING (id = auth.uid() OR public.es_staff());

-- 4. Policies de pagos (condicional: la tabla pagos llega con el PR del
--    módulo de pagos y puede no existir aún en esta BD; seguro en
--    cualquier orden de aplicación).
--    SELECT/INSERT → es_staff() ; UPDATE/DELETE → es_admin().
DO $$
BEGIN
  IF to_regclass('public.pagos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "pagos: ver propios"     ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin gestiona"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: staff registra"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin actualiza" ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin elimina"   ON public.pagos;

    CREATE POLICY "pagos: ver propios" ON public.pagos
      FOR SELECT USING (alumno_id = auth.uid() OR public.es_staff());

    CREATE POLICY "pagos: staff registra" ON public.pagos
      FOR INSERT WITH CHECK (public.es_staff());

    CREATE POLICY "pagos: admin actualiza" ON public.pagos
      FOR UPDATE USING (public.es_admin()) WITH CHECK (public.es_admin());

    CREATE POLICY "pagos: admin elimina" ON public.pagos
      FOR DELETE USING (public.es_admin());
  END IF;
END $$;
