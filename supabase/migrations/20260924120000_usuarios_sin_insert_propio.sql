-- ============================================================
-- Bug 220 — escalada a admin por INSERT de la fila propia en usuarios
--
-- La política "usuarios: admin puede insertar" aceptaba id = auth.uid() y el
-- rol authenticated tenía INSERT (incluida la columna rol). Donde el trigger
-- on_auth_user_created no existe (el setup.sql de julio lo borra), un signUp
-- con la anon key deja al usuario SIN fila y puede crearla con rol='admin'
-- (POST /rest/v1/usuarios). Verificado en MEDERI (24-sep-2026): ahí estaba
-- abierto. Ningún flujo legítimo inserta usuarios ni documentos_alumno con la
-- sesión del usuario: todo va con service_role.
-- Idempotente; un solo bloque; conexión directa (nunca el pooler).
-- ============================================================
BEGIN;
DROP POLICY IF EXISTS "usuarios: admin puede insertar" ON public.usuarios;
CREATE POLICY "usuarios: admin puede insertar"
  ON public.usuarios FOR INSERT
  WITH CHECK (public.es_admin());
REVOKE INSERT ON public.usuarios FROM anon, authenticated;
REVOKE INSERT ON public.documentos_alumno FROM anon, authenticated;
COMMIT;

-- Verificación (las dos deben dar f):
-- SELECT has_table_privilege('authenticated','public.usuarios','INSERT'),
--        has_table_privilege('authenticated','public.documentos_alumno','INSERT');
