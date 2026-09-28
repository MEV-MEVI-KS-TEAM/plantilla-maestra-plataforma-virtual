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

-- 2. es_staff(): admin O secretario. La MISMA definición que el fix S2
--    (20260729121000_fix_s2_es_admin.sql): plpgsql + STABLE + SECURITY DEFINER
--    + SET search_path = public + LOWER(rol) (validación lazy — Bug 21).
--    D20g: antes esta migración la creaba SIN LOWER y SIN search_path, y
--    SETUP.md la corre DESPUÉS del paso 7 (fila 2 de la tabla 7bis): revertía
--    S2 en silencio y la D7b (fila 15) abortaba con «public.es_staff() falta o
--    no normaliza el rol (LOWER)». Ahora correrla o re-correrla, antes o
--    después de S2, deja es_staff() igual que S2. Lo vigila el CHECK 22 de
--    scripts/post-setup-check.sql.
--    es_admin() no se toca aquí (la endurece S2).
CREATE OR REPLACE FUNCTION public.es_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
       AND LOWER(rol) IN ('admin', 'secretario')
  );
END;
$$;

-- Los mismos GRANT que S2 (idempotente).
GRANT EXECUTE ON FUNCTION public.es_staff() TO anon, authenticated;

-- 3. Lectura de usuarios: la propia fila o el admin (D22c, K1). Antes pasaba
--    es_staff() y el secretario leía por PostgREST el directorio completo del
--    personal (nombre, email, teléfono y rol de todos); nada de la app lo usaba:
--    las filas ajenas se leen siempre con el service role (/api/admin/*).
--    Escrituras (INSERT/UPDATE/DELETE) siguen admin-only.
--    IMPORTANTE: la policy SELECT de ALUMNOS se queda en es_admin() — RLS no
--    filtra columnas y alumnos.notas_admin es sensible; el secretario lee
--    alumnos solo vía /api/admin/* (service role, que filtra notas_admin).
--    documentos_alumno y demás tablas NO se tocan (siguen es_admin()).
DROP POLICY IF EXISTS "usuarios: ver propio perfil" ON public.usuarios;
CREATE POLICY "usuarios: ver propio perfil"
  ON public.usuarios FOR SELECT
  USING (id = auth.uid() OR public.es_admin());

-- D22c (K7): techo RESTRICTIVE. Se combina con AND con toda política permisiva
-- de SELECT: ni una copia vieja de 20260716130000_rol_secretario.sql re-corrida
-- después (la fila 2 de 7bis) ni una política de drift (p. ej. `usuarios_select`
-- de EDVEX) vuelven a abrir el directorio del personal a una sesión.
DROP POLICY IF EXISTS "usuarios: techo propio o admin (D22c)" ON public.usuarios;
CREATE POLICY "usuarios: techo propio o admin (D22c)"
  ON public.usuarios AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (id = auth.uid() OR public.es_admin());

-- 4. Policies de pagos (condicional: la tabla pagos llega con el PR del
--    módulo de pagos y puede no existir aún en esta BD; seguro en
--    cualquier orden de aplicación).
--    SELECT → propio o es_admin() + techo RESTRICTIVE (D22c, K2);
--    INSERT → es_staff() y UPDATE/DELETE → es_admin(), inertes para PostgREST
--    desde D22c (la tabla no da INSERT/UPDATE/DELETE a authenticated).
DO $$
BEGIN
  IF to_regclass('public.pagos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "pagos: ver propios"     ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin gestiona"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: staff registra"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin actualiza" ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin elimina"   ON public.pagos;

    -- D22c (K2): el SECRETARIO ya no lee todos los pagos por PostgREST; el
    -- historial que le toca le llega por /api/admin/pagos (service role).
    CREATE POLICY "pagos: ver propios" ON public.pagos
      FOR SELECT USING (alumno_id = auth.uid() OR public.es_admin());

    -- D22c: techo RESTRICTIVE. Se combina con AND con toda política permisiva:
    -- una copia vieja de esta migración o una política de drift no reabre el
    -- SELECT de pagos ajenos para una sesión que no sea del admin.
    DROP POLICY IF EXISTS "pagos: techo propio o admin (D22c)" ON public.pagos;
    CREATE POLICY "pagos: techo propio o admin (D22c)" ON public.pagos
      AS RESTRICTIVE FOR SELECT TO anon, authenticated
      USING (alumno_id = auth.uid() OR public.es_admin());

    CREATE POLICY "pagos: staff registra" ON public.pagos
      FOR INSERT WITH CHECK (public.es_staff());

    CREATE POLICY "pagos: admin actualiza" ON public.pagos
      FOR UPDATE USING (public.es_admin()) WITH CHECK (public.es_admin());

    CREATE POLICY "pagos: admin elimina" ON public.pagos
      FOR DELETE USING (public.es_admin());
  END IF;
END $$;
