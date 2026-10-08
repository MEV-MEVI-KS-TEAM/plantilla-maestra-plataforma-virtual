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

## Paridad de la ventana de cursos (#255)

`paridad-ventana-255.mjs` contesta, con un Postgres de verdad: **¿la ventana por
posición abre lo que debe, sin quitarle nada a nadie?** Usa el mismo cluster
local desechable y `harness-supabase.sql`, y arma dos bases:

| Base | Cómo se arma |
|---|---|
| `ventana_antes` | la cadena de `VENTANA_ANTES_REF` (por omisión `bf7fd7f`, el `main` anterior a #255), leída con `git show`: la ventana con el `orden` crudo |
| `ventana_despues` | la cadena de este árbol: la ventana por posición «dense» |

En las dos siembra la misma matriz con el flujo real: «Asignar» es
`curso_inscribir` con la sesión del admin y «Abrir mes» es `curso_abrir_mes`. La
matriz cruza 1, 2, 9, 10, 11 y 12 módulos, 1, 2 y N módulos por mes, `orden` en
base 0, base 1, con huecos y repetidos, y tres tipos de cobro: mensual (mes 1,
mitad y tope), «Pide informes» 0/0 (mes 1, mitad y tope) y pago único (acceso
total). Agrega estados (suspendida, cancelada, completada, vencida), 0 meses y
un curso en borrador, uno con `duracion_meses` y uno sin módulos. Dentro va completa la matriz de 216 del diagnóstico de
#255. Por cada inscripción cuenta lo que el alumno ve con SU sesión (rol
`authenticated`, RLS real) y exige:

1. nadie ve menos que antes, comparando el conjunto de módulos y no solo la cuenta;
2. en base 0 nada cambia;
3. lo que ve son exactamente las posiciones por debajo del techo, con un oráculo propio que no usa el TypeScript;
4. con todo abierto (tope o acceso total) ve el curso completo, el último incluido;
5. el reporte dice lo que ve, en inscripciones vigentes de cursos publicados;
6. re-correr B2, B6 y C3b no revierte nada (Bug 239), ni siquiera el comentario de `curso_modulos.orden`; una copia VIEJA de B2 o de C3b sí lo revierte, el CHECK 31 lo ve y volver a correr #255 lo repara.

Si todo pasa, escribe la foto en `tests/unit/fixtures/ventana-255.json` con el
sha256 de las cinco migraciones que deciden la ventana (B2, B3, B6, C3b y #255).
Si cambia cualquiera de ellas, la prueba unitaria pide volver a correr el arnés. `tests/unit/fix255-ventana-posicion.spec.ts` corre en
cada `pnpm test:unit` sin base de datos. Compara el TypeScript (`posicionesVentana`
y compañía, en `src/lib/cursos/acceso.ts`) contra esa foto, módulo por módulo.
Falla si la migración cambió y nadie volvió a correr el arnés.

```bash
PG_BIN="/c/Program Files/PostgreSQL/18/bin" PGPORT=55440 node scripts/verificar-schema/paridad-ventana-255.mjs
```

Salida esperada (30 s aprox.):

```
armando ventana_antes (bf7fd7f, 45 migraciones)…
armando ventana_despues (este árbol, 46 migraciones)…
sembrados 223 cursos y 523 inscripciones en cada base
== matriz: 523 inscripciones; 175 ven ahora lo que les faltaba; 0 falla(s)
== re-correr B2, B6 y C3b: revisado
== copias viejas de B2 y C3b: el CHECK 31 las ve y #255 las repara

✔ ventana por posición verificada; foto en tests/unit/fixtures/ventana-255.json (523 casos)
```

Córrelo cada vez que toques la ventana de cursos: `curso_modulo_posicion`,
`curso_modulo_en_ventana`, `curso_ventana_limite`, `reporte_curso_inscripciones`,
B2, B6, C3b o `src/lib/cursos/acceso.ts`. Crea y borra `ventana_antes` y
`ventana_despues`; con `VERIF_CONSERVAR=1` las deja para inspeccionarlas.

## Explotaciones de la R2 con RLS real (soporte IVS, 8-oct-2026)

`explotaciones-r2.mjs` contesta, con un Postgres de verdad: **¿lo que se cerró en
IVS en la ronda 2 está cerrado en la plantilla, y la migración
`20261008120000_r2_escritura_solo_servidor.sql` lo cierra en un cliente ya
desplegado?** Usa el mismo cluster local desechable y `harness-supabase.sql` (más
`ALTER ROLE service_role BYPASSRLS`, como en Supabase), y arma:

| Base | Cómo se arma |
|---|---|
| `r2_antes` | la cadena de `R2_ANTES_REF` (por omisión `260fb8a`, el `main` anterior a la R2), leída con `git show` |
| `r2_migrada` | `r2_antes` + la migración R2 de este árbol, **dos veces** (idempotente): un cliente ya desplegado que la corre |
| `r2_copia_vieja` | `r2_migrada` + una copia vieja de `20260402140000` (recrea las políticas de escritura propia de logros y racha) |
| `r2_despues` | la cadena de este árbol completa |
| `r2_instalador` / `r2_combo` | `supabase/schema.sql` solo / `scripts/schema.sql` solo (clientes nuevos) |
| `r2_duplicados` | `r2_antes` con dos respuestas del mismo alumno a la misma pregunta: la migración tiene que **abortar** sin borrar ni dejar nada a medias |
| `r2_drift` | `r2_antes` con `alumnos.usuario_id` distinto de `alumnos.id` (puente de EDVEX): la migración tiene que **abortar** sin dejar nada a medias (sus techos `alumno_id = auth.uid()` dejarían a cada alumno sin lo suyo) |
| `r2_latido_public` | `r2_antes` con la política del latido `TO public` (DDL de rescate a mano, Bug 65): tras la migración `anon` **sigue insertando** en `keep_alive_log` y los CHECK R2 dan ✅ |

En cada base siembra dos alumnos y un admin con el alta real (`auth.users` →
`handle_new_user`, uno con `rol: 'admin'` en el metadata) y, con la sesión de un
alumno (rol `authenticated`), sin sesión (`anon`) o con el service role, intenta
dentro de `BEGIN … ROLLBACK` cada explotación de la auditoría (intento y
calificación forjados, la clave de los bancos, la carrera del quiz y del último
intento, progreso, logros, racha, documento autoaprobado, constancia, alumnos,
notas, rol por UPDATE, `generar_matricula` por RPC, `TRUNCATE` con sesión…) y lo
legítimo (el servidor marca la semana y el trigger mueve la racha, el alta asigna
matrícula, el alumno lee lo suyo y escribe su nota y su perfil, el admin lee todo,
el latido de `anon`). Corre además los CHECK 32, 33 y 34 de `post-setup-check.sql`.

Exige: en `r2_antes` las explotaciones abiertas **pasan** (el arnés las ve) y los
CHECK marcan ❌; en las demás ninguna pasa (`42501` por privilegio, no solo por la
RLS; `23505` en las carreras), lo legítimo funciona y los tres CHECK dan ✅.
Escribe la foto en `tests/unit/fixtures/explotaciones-r2.json` con el sha256 de la
migración; `tests/unit/r2-escritura-solo-servidor.spec.ts` la lee en cada
`pnpm test:unit` y falla si la migración cambió y nadie volvió a correr el arnés.

```bash
PG_BIN="/c/Program Files/PostgreSQL/18/bin" PGPORT=55440 node scripts/verificar-schema/explotaciones-r2.mjs
```

Salida esperada (1-2 min):

```
armando r2_antes (48 archivos)… 11 explotación(es) PASAN (d_quiz_carrera, …); legítimas rotas: ninguna; CHECK R2: ❌ ❌ ❌
armando r2_migrada (50 archivos)… 0 explotación(es) PASAN; legítimas rotas: ninguna; CHECK R2: ✅ ✅ ✅
…
armando r2_duplicados… aborta: true; filas del quiz intactas: 2; nada aplicado a medias: true
armando r2_drift… aborta: true; nada aplicado a medias: true
armando r2_latido_public… latido de anon: PASA:1; CHECK R2: ✅ ✅ ✅

✔ R2 verificada con RLS real; foto en tests/unit/fixtures/explotaciones-r2.json
```

Prueba de mutación (8-oct-2026): quitar `progreso_semanas` de la lista del
servidor en la migración hace que `r2_migrada` marque `e_progreso_insert PASA` y
el CHECK 32 ❌ (en `r2_despues` no se ve porque el instalador ya trae la R2: por
eso existe `r2_migrada`).
