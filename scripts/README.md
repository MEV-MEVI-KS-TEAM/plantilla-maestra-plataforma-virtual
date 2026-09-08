# Scripts SQL — Plantilla Maestra MEV

Esta carpeta contiene los scripts SQL para inicializar una plataforma cliente nueva.

## Inicialización rápida de cliente nuevo

Asume que ya tienes:
- Proyecto Supabase nuevo creado para el cliente
- DB password del proyecto Supabase
- psql instalado localmente (viene con PostgreSQL)

```bash
# 1. Exportar connection string del cliente nuevo
export CLIENT_DB_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# 2. Ejecutar schema canónico (estructura de BD)
#    ⚠️ setup.sql (paso 3) usa `\i` con rutas relativas: hay que correr psql
#    PARADO DENTRO de scripts/, nunca desde la raíz del repo — `psql ... -f
#    scripts/setup.sql` desde la raíz falla con "No such file or directory"
#    (ver SETUP.md:63-67).
cd scripts
psql "$CLIENT_DB_URL" -f schema.sql

# 3. Ejecutar setup completo (seeds + constraints + tutorial demo)
psql "$CLIENT_DB_URL" -f setup.sql
```

Tiempo total: ~30-60 segundos.

## Archivos principales

### schema.sql (ejecutar PRIMERO)
DDL completo extraído de IVS Virtual:
- 18 tablas
- 72 constraints
- 12 índices
- 46 políticas RLS
- 2 triggers

### setup.sql (ejecutar SEGUNDO)
Combina vía `\i` los seeds esenciales:
- seed-demo-materia.sql → Tutorial Demo (CRÍTICO para modo prueba)
- seed-contenido-ivs.sql → Estructura de meses + semanas
- seed-contenido-semanas.sql → Contenido académico

Más constraints adicionales y limpieza (NOTIFY pgrst, DROP TRIGGER).

## Archivos NO incluidos automáticamente

| Archivo | Razón |
|---------|-------|
| seed-materias-ejemplo.sql | **DEPRECATED** — Bug: desplazaba materias reales a orden 13-24, bloqueando acceso a contenido (26-abr-2026) |
| seed-evaluaciones-y-quiz.sql | **DEPRECATED** — Bug 33: overlap 221 preguntas con seed canónico → 515 filas en lugar de 265 (5-may-2026) |
| videos-update.sql | Usa columna 'videos' JSONB no presente en schema canónico |
| quiz-data.sql | Usa columnas 'opciones' JSONB no presentes en schema canónico |
| add-bilingual-columns.sql | Migration EDVEX |
| migration-documentos.sql | Tabla ya está en schema.sql |
| create-admin.sql | Template manual — admin se crea desde Dashboard |
| verificar-*.sql | SELECTs de diagnóstico (no DDL) |

## Migrations (clientes existentes)

`scripts/migrations/` contiene scripts para clientes ya desplegados que necesitan
catch-up con cambios de la plantilla. Idempotentes, seguros de re-ejecutar.

| Migration | Aplica a | Para qué |
|-----------|----------|----------|
| `2026-05-add-opcion-d-quiz-semana.sql` | Clientes pre-mayo 2026 | Habilita columna `opcion_d` en `quiz_semana` |
| `2026-05-bug33-dedupe-preguntas.sql` | Clientes con duplicados de preguntas | DELETE duplicados + UNIQUE constraint (Bug 33) |
| `2026-09-fix-lecciones-truncadas.sql` | Clientes sembrados antes de sep-2026 | Reescribe 52 lecciones que el seed dejaba cortadas en la primera comilla simple del texto |

Auditoría rápida lecciones truncadas:
```sql
-- Una lección cortada termina en apóstrofo SIN cerrar la frase.
-- (Dos lecciones terminan en apóstrofo de forma legítima, cerrando una cita:
--  por eso no basta con LIKE '%''' y se mira el carácter anterior.)
SELECT COUNT(*) FROM public.semanas
WHERE contenido LIKE '%'''
  AND substring(contenido FROM length(contenido) - 1 FOR 1) NOT IN ('.', '!', '?');
-- 0 = sano | >0 = ejecutar 2026-09-fix-lecciones-truncadas.sql
```

El seed ya no genera lecciones truncadas, así que un cliente **nuevo** no necesita
esta migration: aplica solo a los que se sembraron con un seed anterior.

Auditoría rápida Bug 33:
```sql
SELECT COUNT(*) FROM (
  SELECT evaluacion_id, pregunta, COUNT(*) c
  FROM preguntas GROUP BY 1,2 HAVING COUNT(*) > 1
) sub;
-- 0 = sano | >0 = ejecutar migration
```

## Workflow de cliente nuevo (paso a paso)

1. Crear proyecto Supabase desde dashboard
2. Crear los 7 buckets de Storage que usa la plantilla — `scripts/schema.sql`
   **no crea ninguno**, hay que crearlos a mano y verificar que existan:
   `avatares` y `avatars` (ambos **públicos**: el código sube la foto de
   perfil a `avatars`, ver `src/app/api/alumno/avatar/route.ts:28` y
   `SETUP.md:137`), `documentos`, `constancias`, `recibos` y `materias`
   (privados), `cursos` (privado, lo declara `migracion-cursos-diplomados.sql`
   pero conviene tenerlo listo desde aquí)
3. Ejecutar setup:
```bash
   export CLIENT_DB_URL="..."
   # ⚠️ setup.sql usa `\i` con rutas relativas: parado DENTRO de scripts/
   cd scripts
   psql "$CLIENT_DB_URL" -f schema.sql
   psql "$CLIENT_DB_URL" -f setup.sql
```
4. Módulo Cursos y Diplomados (prerrequisito de varias migraciones de
   `supabase/migrations/` — Bug 102):
```bash
   psql "$CLIENT_DB_URL" -f migracion-cursos-diplomados.sql
```
5. Aplicar `supabase/migrations/*.sql` en orden cronológico (desde la raíz del repo)
6. Crear admin desde Supabase Dashboard → Authentication → Add user
7. Marcar usuario como admin:
```sql
   UPDATE public.usuarios SET rol = 'admin' WHERE email = 'admin@cliente.com';
```
8. Configurar Auth: desactivar "Confirm email" en Authentication → Providers → Email
9. Verificar con `scripts/post-setup-check.sql` (desde la raíz del repo; ver
   `SETUP.md` paso 8) — reporta ✅/❌ por check

## Troubleshooting

**Error: "permission denied for schema public"**
→ Connection string incorrecta. Verificar password del DB.

**Error: "duplicate key value violates unique constraint"**
→ Setup ya se ejecutó. Es seguro re-ejecutar (los seeds tienen ON CONFLICT).

**Error: "could not translate host name"**
→ Host mal escrito en CLIENT_DB_URL. Copiar de nuevo desde Supabase Dashboard.
