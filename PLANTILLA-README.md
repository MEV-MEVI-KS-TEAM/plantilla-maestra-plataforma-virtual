# Plantilla LMS — Bachillerato Virtual

Plataforma de educación media superior 100% en línea.  
Arquitectura single-tenant: una instancia por escuela, deploy independiente por cliente.

---

## Personalización para nuevo cliente

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/bachillerato-virtual.git nombre-cliente
cd nombre-cliente
pnpm install
```

---

### Paso 2: Crear nuevo proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `nombre-cliente-lms`
3. Copiar las credenciales: `Project URL`, `anon key`, `service_role key`

---

### Paso 3: Crear nuevo proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → New Project
2. Importar el repositorio
3. Agregar variables de entorno (ver Paso 4)

---

### Paso 4: Configurar variables de entorno

Crea `.env.local` (para desarrollo) y configura en Vercel (para producción):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

### Paso 5: Modificar `src/lib/config.ts` con datos del cliente

```typescript
export const ESCUELA_CONFIG: ConfigEscuela = {
  nombre: 'Nombre de la Escuela',        // Nombre completo de la institución
  slug: 'nombre-escuela',                // URL amigable (sin espacios)
  logoUrl: null,                         // URL del logo o null
  colorPrimario: '#5B6CFF',             // Color principal de la marca
  colorSecundario: '#1E40AF',           // Color secundario
  contactoEmail: 'contacto@escuela.mx', // Email de contacto público
  contactoTelefono: '+52 33 1234 5678', // Teléfono o null
}
```

---

### Paso 6: Configurar Resend para emails de recuperación de contraseña

1. Crear cuenta en [resend.com](https://resend.com)
2. Verificar el dominio del cliente (DNS)
3. Obtener el API Key de Resend
4. En Supabase → **Authentication → Settings → SMTP Settings**:
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **User**: `resend`
   - **Password**: tu API Key de Resend
   - **Sender name**: Nombre de la escuela
   - **Sender email**: `no-reply@dominio-cliente.mx`
5. Esto habilita:
   - Recuperación de contraseña (`/forgot-password`)
   - Confirmación de email al registrarse

---

### Paso 7: Ejecutar los scripts SQL en Supabase

En Supabase → **SQL Editor**, ejecutar en orden:

1. `sql/01-schema.sql` — Crea todas las tablas
2. `sql/02-rls.sql` — Políticas de seguridad Row Level Security
3. `sql/03-functions.sql` — Funciones y triggers
4. `sql/04-seed-planes.sql` — Planes de estudio del cliente
5. `sql/05-seed-contenido.sql` — Meses, materias, semanas, evaluaciones

---

### Paso 8: Crear usuario admin inicial

En Supabase → **Authentication → Users** → Add user → Create new user, con «Auto Confirm User»:
- Email del administrador de la escuela
- Luego en **SQL Editor**:

```sql
INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
SELECT id, email, 'Administrador', '<Nombre de la escuela>', 'admin'
  FROM auth.users WHERE email = lower(btrim('<correo del admin>'))
ON CONFLICT (id) DO UPDATE SET rol = 'admin', email = EXCLUDED.email,
  nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos
RETURNING id, email, nombre, apellidos, rol;
```

Como el admin se crea después del esquema, el trigger `handle_new_user` ya le creó su fila en `usuarios` (rol `alumno`, nombre vacío): por eso se pisan también nombre y apellidos. Sin nombre, el encabezado del panel y la bitácora muestran el correo del admin. Debe devolver **1 fila** con rol `admin` y el nombre (en psql además sale `INSERT 0 1`); 0 filas = ese correo no está en Auth (la receta ya ignora mayúsculas y espacios). Un apóstrofo en el nombre va doble (`O''Higgins`). El rol va en minúsculas: el CHECK de `usuarios.rol` solo acepta
`alumno`, `admin` y `secretario` (`usuarios` no tiene `nombre_completo` ni `activo`).

---

### Paso 9: Deploy en Vercel

```bash
git push origin main
# Vercel despliega automáticamente
```

---

## Estructura de archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/lib/config.ts` | **Configuración de la escuela** — CAMBIAR POR CLIENTE |
| `.env.local` | Variables de Supabase — CAMBIAR POR CLIENTE |
| `src/types/index.ts` | Interfaces TypeScript globales |
| `src/lib/constants.ts` | Roles y redirecciones |
| `src/lib/supabase/verify-admin.ts` | Helper de verificación de rol admin |

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page pública |
| `/login` | Inicio de sesión |
| `/forgot-password` | Recuperar contraseña |
| `/reset-password` | Nueva contraseña |
| `/admin` | Dashboard del administrador |
| `/admin/alumnos` | Gestión de alumnos |
| `/admin/contenido` | Visualización del contenido |
| `/admin/reportes` | Estadísticas y reportes |
| `/admin/configuracion` | Configuración del sistema |
| `/alumno` | Dashboard del alumno |
| `/alumno/mes/[numero]` | Materias de un mes |
| `/alumno/materia/[id]` | Contenido de una materia |
| `/alumno/evaluacion/[id]` | Motor de evaluaciones |
| `/alumno/calificaciones` | Estado de acreditación |
| `/alumno/constancia` | Constancia de estudios + PDF |

## Contenido académico

El contenido (materias, semanas, videos, evaluaciones, preguntas) se carga **únicamente vía SQL seeds**.  
No existe interfaz de administración de contenido en la plataforma — esto es por diseño para mantener el sistema simple y estable.

Para actualizar contenido, editar los seeds SQL y re-ejecutar en Supabase.

---

## Tecnologías

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **PDF**: jsPDF
- **Deploy**: Vercel + Supabase
