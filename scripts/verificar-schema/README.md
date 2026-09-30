# Verificar que los instaladores de esquema son equivalentes

`comparar-instaladores.mjs` contesta, con un Postgres de verdad: **¿una base
instalada con `supabase/schema.sql` es la misma que aplicar todas las
migraciones?** y **¿los dos instaladores (`supabase/schema.sql` y
`scripts/schema.sql`) acaban en la misma base?** Nació en el Bloque E3
(29-sep-2026), cuando `supabase/schema.sql` resultó 9 puntos atrás de las
migraciones sin que ningún guardián lo viera (sembrar sobre él fallaba con 42P10).

Arma cuatro bases en un cluster **local y desechable** y compara la foto de su
catálogo (`foto-esquema.sql`: tablas, columnas, restricciones, índices, cuerpos
de función, permisos de ejecución, triggers, políticas —también las de
`storage.objects`—, permisos por tabla y por columna, vistas, tipos y buckets):

| Base | Cómo se arma |
|---|---|
| `B` | `supabase/schema.sql` |
| `BS` | `B` + `scripts/setup.sql` (los seeds, corridos desde `scripts/`) |
| `BM` | `B` + `scripts/migracion-cursos-diplomados.sql` + todas las `supabase/migrations/*.sql` en orden de nombre |
| `SM` | `scripts/schema.sql` + `scripts/setup.sql` + lo mismo que `BM` (la ruta del combo: TAREA 3 y 3.9 de PROMPTS-MAESTROS) |
| `SS` | `scripts/schema.sql` + `scripts/setup.sql` (para comparar datos con `BS`) |

Comparaciones (sale con 1 si alguna tiene una diferencia no prevista):

1. `B` vs `BM`, sin el módulo Cursos (que `supabase/schema.sql` no trae a
   propósito). Las pocas excepciones están en `EXENTO_1` con su porqué (B1 y B6
   leen tablas del módulo); una excepción que ya no hace falta también es error.
2. `BM` vs `SM`: los dos instaladores con las migraciones encima.
3. `B` vs `BS`: `setup.sql` corre limpio sobre `B` y no le cambia el esquema.
4. `BS` vs `SS` (= `scripts/schema.sql` + `setup.sql`): los dos instaladores dejan
   los **mismos datos** sembrados (materias, meses, semanas, evaluaciones,
   preguntas, quiz) y **ninguna evaluación sin preguntas** (Bug D). Nació en la
   Fase 6 del Bloque E: `supabase/schema.sql` sembraba una materia demo vieja que
   recibía un examen vacío.

`harness-supabase.sql` emula lo que Supabase da por hecho y Postgres pelado no
(roles `anon`/`authenticated`/`service_role`, `auth.users`, `auth.uid()`,
`storage.buckets`, `storage.objects`, `storage.foldername()`) y, sobre todo, los
**privilegios de fábrica** de Supabase (`ALTER DEFAULT PRIVILEGES … GRANT ALL ON
TABLES/SEQUENCES/FUNCTIONS TO anon, authenticated, service_role`). Sin ellos,
todo `REVOKE … FROM anon, authenticated` sería invisible y el comparador daría
verde con un cierre de seguridad perdido (D22c, D22d, #185); por eso el
comparador aborta si la foto de `B` no trae ningún permiso de escritura para
`authenticated` (canario). Parte del de mev-tools
`scripts/verificar-migraciones/harness.sql`.

Prueba de mutación (29-sep-2026): quitar de `supabase/schema.sql` el `REVOKE
INSERT ON public.usuarios FROM anon, authenticated` hace que la comparación 1
marque `grant|usuarios.anon` y `grant|usuarios.authenticated`.

## Uso

Solo hace falta PostgreSQL instalado (`initdb`, `pg_ctl`, `psql`); nada de Docker
ni del CLI de Supabase. **Nunca** lo apuntes a una base de Supabase: borra y crea
bases. Por eso se niega a correr en los puertos 5432 y 6543.

```bash
PG="/c/Program Files/PostgreSQL/18/bin"
D="$TEMP/pg-verif"
"$PG/initdb" -D "$D" -U postgres --auth=trust --encoding=UTF8 --locale=C
"$PG/pg_ctl" -D "$D" -o "-p 55440" -l "$D.log" start
# esperar a que acepte conexiones (sondea; no duermas un número fijo)
until "$PG/psql" -h 127.0.0.1 -p 55440 -U postgres -tAc "select 1" >/dev/null 2>&1; do sleep 2; done

PG_BIN="$PG" PGPORT=55440 node scripts/verificar-schema/comparar-instaladores.mjs

"$PG/pg_ctl" -D "$D" stop && rm -rf "$D" "$D.log"
```

Opciones: `VERIF_SALIDA=<carpeta>` guarda las cuatro fotos (`foto-B.txt`…);
`VERIF_CONSERVAR=1` deja las bases `verif_*` para inspeccionarlas.

Salida esperada:

```
armando B… · BS… · BM… · SM…
== 1. … 0 diferencia(s) no prevista(s), 0 exención(es) zombi
== 2. … 0 diferencia(s) no prevista(s), 0 exención(es) zombi
== 3. … 0 diferencia(s) no prevista(s), 0 exención(es) zombi
✔ los instaladores son equivalentes
```

Control: contra `main` @4cef3d0 (antes del Bloque E3) la base `BS` no se arma
(`seed-preguntas-evaluaciones-universal.sql:38: there is no unique or exclusion
constraint matching the ON CONFLICT specification`) y las comparaciones 1 y 2
dan decenas de diferencias.

## Cuándo correrlo

Cada vez que agregues una migración o toques un `schema.sql`. La parte estática
(que corre en cada `pnpm test:unit`) es
`tests/unit/e3-instaladores-equivalentes.spec.ts`: todo objeto de una migración
fuera del módulo Cursos está en `supabase/schema.sql`, los UNIQUE que usan los
seeds y la app, la S2 y que los buckets que crean los instaladores sean
exactamente los que usa el código.
