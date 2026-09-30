-- ============================================================
-- Crear usuario administrador (después de schema.sql)
-- ============================================================
-- Opción A (recomendada): Supabase Dashboard → Authentication → Users
--   → "Add user" → email y contraseña. Copia el UUID del usuario.
-- Opción B: SQL con extensión pgcrypto (ver documentación Supabase Auth).
--
-- CAMBIAR antes de ejecutar la parte de public.usuarios:
--   - UUID del usuario creado en Auth
--   - admin@cliente.com
--   - Nombre del admin si lo deseas
-- ============================================================

-- Recomendado (TAREA 5 de PROMPTS-MAESTROS; no hace falta copiar el UUID):
--   INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
--   SELECT id, email, 'Administrador', '<Nombre de la escuela>', 'admin'
--     FROM auth.users WHERE email = '<correo del admin>'
--   ON CONFLICT (id) DO UPDATE SET rol = 'admin', email = EXCLUDED.email,
--     nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos;
-- El trigger handle_new_user ya creó la fila (rol 'alumno', nombre vacío): por
-- eso se pisan también nombre y apellidos.
--
-- Ejemplo por UUID: enlazar perfil en public.usuarios con rol admin
-- (el usuario DEBE existir ya en auth.users)

/*
INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- ← UUID real de auth.users
  'admin@cliente.com',
  'Admin',
  'Sistema',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'admin',
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre,
  apellidos = EXCLUDED.apellidos;
*/

-- Nota: no insertar directamente en auth.users desde SQL sin el flujo
-- oficial de Supabase (hash de contraseña). Usa el Dashboard o la API Admin.
