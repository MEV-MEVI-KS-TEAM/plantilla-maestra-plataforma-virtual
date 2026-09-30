-- ============================================================
-- Crear usuario administrador (después de schema.sql)
-- ============================================================
-- Todo este archivo es comentario: es una referencia, correrlo no hace nada.
-- 1) Supabase Dashboard → Authentication → Users → "Add user" → Create new user
--    (correo y contraseña del admin, con «Auto Confirm User»).
-- 2) En el SQL Editor, la receta recomendada de abajo (por correo, sin UUID).
-- ============================================================

-- Recomendado (equivale a la TAREA 5 de PROMPTS-MAESTROS; sin copiar el UUID):
--   INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
--   SELECT id, email, 'Administrador', '<Nombre de la escuela>', 'admin'
--     FROM auth.users WHERE email = lower(btrim('<correo del admin>'))
--   ON CONFLICT (id) DO UPDATE SET rol = 'admin', email = EXCLUDED.email,
--     nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos
--   RETURNING id, email, nombre, apellidos, rol;
-- Debe devolver 1 fila con rol admin y el nombre; 0 filas = ese correo no está
-- en Auth. Si el admin se creó después del esquema, el trigger handle_new_user
-- ya le creó la fila (rol 'alumno', nombre vacío): por eso se pisan también
-- nombre y apellidos.
--
-- Otra forma, por UUID (el usuario DEBE existir ya en auth.users):

/*
INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- ← UUID real de auth.users
  'admin@cliente.com',
  'Administrador',
  '<Nombre de la escuela>',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'admin',
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre,
  apellidos = EXCLUDED.apellidos
RETURNING id, email, nombre, apellidos, rol;
*/

-- Nota: no insertar directamente en auth.users desde SQL sin el flujo
-- oficial de Supabase (hash de contraseña). Usa el Dashboard o la API Admin.
