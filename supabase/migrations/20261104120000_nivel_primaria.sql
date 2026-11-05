-- ============================================================================
-- NIVEL PRIMARIA (4-nov-2026)
-- ============================================================================
--
-- QUÉ HACE. Deja que una base admita alumnos y materias de Primaria:
--   1. amplía los CHECK de `alumnos.nivel`, `materias.nivel` y `alumnos.modalidad`;
--   2. enseña a `alumnos.duracion_meses` los tres planes de Primaria
--      ('3_meses_pri', '6_meses_pri', '9_meses_pri');
--   3. agrega las columnas nulas de edad y tutor: `fecha_nacimiento`,
--      `tutor_nombre`, `tutor_telefono` y `tutor_parentesco`.
--
-- ADITIVO, CON UNA EXCEPCIÓN. No toca filas. La única columna existente que toca es
-- `alumnos.duracion_meses`, que se DROPEA y se recrea (ver abajo). En un combo sin
-- Primaria los CHECK solo admiten un valor más que nadie usa, las columnas nuevas quedan
-- en NULL y `duracion_meses` da lo mismo para todo id que ya existía. El contenido de
-- Primaria NO se siembra aquí: va en scripts/setup-primaria.sql, que corre después
-- de esta migración y solo en los combos que venden Primaria.
--
-- POR QUÉ IDS PROPIOS. '3_meses' y '6_meses' abren 4 y 2 materias por mes en
-- Sec/Prepa; Primaria abre 6, 3 y 2. Con los mismos ids su ventana se cerraría en
-- la materia 12 de 18 (la clase del Bug 121).
--
-- POR QUÉ POR UNIÓN Y POR CATÁLOGO (la regla de 20260925120000). Se buscan los
-- CHECK de UNA columna por `conkey`, se llamen como se llamen (Bug 72), y el nuevo
-- admite lo que ya admitían (hay clones con '4_meses', 'acceso_completo',
-- '3_meses_dip'…) más lo canónico. Fail-closed: un CHECK que no tenga la forma
-- «lista de literales» aborta sin tocar nada. Un CHECK de varias columnas no se
-- toca: se avisa con WARNING.
--
-- 🛑 DEBE IR DESPUÉS DE B1, 20260812 Y 20260820: esas tres recrean los CHECK de
-- nivel con una lista cerrada. Por eso el seed de Primaria tampoco puede ir en
-- scripts/setup.sql (corre ANTES de esa cadena): el ADD CONSTRAINT abortaría con
-- 23514, y sin filas le quitaría 'primaria' al CHECK en silencio.
--
-- `duracion_meses`: no se puede alterar la expresión de una columna generada; hay
-- que dropearla y recrearla (igual que 20260812). Se INYECTAN los WHEN en la
-- expresión VIGENTE en lugar de recrearla con la de la plantilla: un clon con WHEN
-- propios regresaría. Sin `ELSE 6` aborta: es una forma que este archivo no conoce.
-- La columna es derivada y ninguna función SQL la lee.
--
-- ES PARA COMBOS NUEVOS. Recrear la columna la deja al final de la tabla y se
-- llevaría lo que dependa de ella: un clon con un índice, una vista o una política
-- sobre `duracion_meses` aborta aquí con la lista, sin tocar nada. Quien la corra en
-- un combo ya en producción primero recrea eso por su cuenta y decide; la plantilla
-- no trae ningún objeto así.
--
-- LA MARCA. `schema.sql` ya admite 'primaria' en los CHECK, así que mirar el CHECK no
-- dice si la cadena corrió. Al final se deja un COMMENT en `materias_nivel_check` que
-- solo pone este archivo, y scripts/setup-primaria.sql lo exige antes de sembrar. Si
-- B1, 20260812 o 20260820 se vuelven a correr, el CHECK se recrea y la marca se va:
-- es justo cuando hay que volver a correr este archivo (ver SETUP.md).
--
-- Idempotente (la segunda corrida recrea los mismos CHECK y no toca la columna) y
-- atómica. Conexión: directa o pooler en MODO SESIÓN, puerto 5432 (Bug 228).
--
-- LOCK_TIMEOUT. Toma `alumnos` al primer ALTER y después puede esperar `materias`: con el
-- candado puesto, toda la plataforma esperaría con ella. A los 10 s sin un candado aborta
-- completa; se reintenta tal cual.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '10s';

ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS fecha_nacimiento date;
ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS tutor_nombre text;
ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS tutor_telefono text;
ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS tutor_parentesco text;

COMMENT ON COLUMN public.alumnos.fecha_nacimiento IS
  'Solo se pide en combos con Primaria, a alumnos de Primaria y Secundaria: decide si hacen falta los datos del tutor.';
COMMENT ON COLUMN public.alumnos.tutor_nombre IS
  'Padre, madre o tutor del alumno menor de 18 años. NULL si es mayor de edad o la escuela no vende Primaria.';

DO $$
DECLARE
  r         record;
  c         record;
  v_attnum  smallint;
  v_ids     text[];
  v_lista   text;
  v_n       integer;
  v_expr    text;
  v_forma   text;
  v_deps    text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('alumnos',  'nivel',     'alumnos_nivel_check',     ARRAY['secundaria','preparatoria','licenciatura','diplomado','primaria'], 'CHECK (nivel IN (%s))'),
      ('materias', 'nivel',     'materias_nivel_check',    ARRAY['secundaria','preparatoria','demo','licenciatura','primaria'],      'CHECK (nivel IN (%s))'),
      ('alumnos',  'modalidad', 'alumnos_modalidad_check', ARRAY['3_meses','3_meses_pri','6_meses','6_meses_lic','6_meses_pri','9_meses','9_meses_pri','12_meses','18_meses','24_meses','36_meses'], 'CHECK (modalidad IS NULL OR modalidad IN (%s))')
    ) AS t(tabla, columna, nombre, ids, plantilla)
  LOOP
    v_ids := r.ids;
    v_n := 0;
    SELECT attnum INTO v_attnum
      FROM pg_attribute
     WHERE attrelid = format('public.%I', r.tabla)::regclass AND attname = r.columna AND NOT attisdropped;
    IF v_attnum IS NULL THEN
      RAISE EXCEPTION 'public.% no tiene la columna %', r.tabla, r.columna;
    END IF;

    v_forma := '^CHECK(' || r.columna || 'ISNULLOR)?' || r.columna || '=ANYARRAY\[L(,L)*\]$';
    FOR c IN
      SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
       WHERE conrelid = format('public.%I', r.tabla)::regclass
         AND contype = 'c'
         AND conkey = ARRAY[v_attnum]
    LOOP
      -- Fail-closed: solo se reescribe la forma «lista de literales de texto».
      IF regexp_replace(regexp_replace(c.def, '''[^'']*''::text', 'L', 'g'), '[()[:space:]]', '', 'g') !~ v_forma THEN
        RAISE EXCEPTION 'CHECK % sobre %.% con forma desconocida: %', c.conname, r.tabla, r.columna, c.def;
      END IF;
      SELECT array_agg(DISTINCT x) INTO v_ids
        FROM (SELECT unnest(v_ids) AS x
              UNION
              SELECT (regexp_matches(c.def, '''([^'']*)''::text', 'g'))[1]) s;
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tabla, c.conname);
      v_n := v_n + 1;
    END LOOP;

    -- Sin ningún CHECK: se crea con lo canónico MÁS lo que ya usan las filas.
    IF v_n = 0 THEN
      EXECUTE format(
        'SELECT array_agg(DISTINCT x) FROM (SELECT unnest($1) AS x UNION SELECT %1$I FROM public.%2$I WHERE %1$I IS NOT NULL) s',
        r.columna, r.tabla) INTO v_ids USING v_ids;
      RAISE WARNING '%.% no tenía CHECK: se crea con lo canónico y lo que ya está en uso.', r.tabla, r.columna;
    END IF;

    SELECT string_agg(quote_literal(x), ', ' ORDER BY x COLLATE "C") INTO v_lista FROM unnest(v_ids) AS t(x);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I ', r.tabla, r.nombre) || format(r.plantilla, v_lista);
    RAISE NOTICE '% admite: %', r.nombre, v_lista;

    FOR c IN
      SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
       WHERE conrelid = format('public.%I', r.tabla)::regclass
         AND contype = 'c'
         AND v_attnum = ANY (conkey)
         AND conkey <> ARRAY[v_attnum]
    LOOP
      RAISE WARNING 'CHECK % también restringe %.% y NO se amplió: %', c.conname, r.tabla, r.columna, c.def;
    END LOOP;
  END LOOP;

  -- ── duracion_meses ────────────────────────────────────────────────────────
  SELECT pg_get_expr(d.adbin, d.adrelid) INTO v_expr
    FROM pg_attribute a
    JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
   WHERE a.attrelid = 'public.alumnos'::regclass
     AND a.attname = 'duracion_meses'
     AND a.attgenerated = 's'
     AND NOT a.attisdropped;
  IF v_expr IS NULL THEN
    RAISE EXCEPTION 'public.alumnos.duracion_meses no existe o no es una columna generada';
  END IF;
  IF strpos(v_expr, '''3_meses_pri''') = 0 THEN
    IF strpos(v_expr, 'ELSE 6') = 0 THEN
      RAISE EXCEPTION 'alumnos.duracion_meses con expresión desconocida (sin ELSE 6): %', v_expr;
    END IF;
    v_expr := replace(v_expr, 'ELSE 6',
      'WHEN ''3_meses_pri''::text THEN 3 WHEN ''6_meses_pri''::text THEN 6 WHEN ''9_meses_pri''::text THEN 9 ELSE 6');
    -- Lo que cuelgue de la columna (índice, vista, política, restricción): se dice en
    -- vez de perderlo. Su propia expresión generada no cuenta.
    SELECT string_agg(pg_describe_object(d.classid, d.objid, d.objsubid), '; ') INTO v_deps
      FROM pg_depend d
      JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
     WHERE d.refclassid = 'pg_class'::regclass
       AND d.refobjid = 'public.alumnos'::regclass
       AND a.attname = 'duracion_meses'
       AND d.classid <> 'pg_attrdef'::regclass;
    IF v_deps IS NOT NULL THEN
      RAISE EXCEPTION 'alumnos.duracion_meses tiene objetos que dependen de ella y se perderían al recrearla: %. Esta migración es para combos nuevos; revisa esos objetos antes de correrla.', v_deps;
    END IF;
    ALTER TABLE public.alumnos DROP COLUMN duracion_meses;
    EXECUTE format('ALTER TABLE public.alumnos ADD COLUMN duracion_meses integer GENERATED ALWAYS AS (%s) STORED', v_expr);
  END IF;
END $$;

-- La marca que exige scripts/setup-primaria.sql. No tiene espejo en los schema.sql.
COMMENT ON CONSTRAINT materias_nivel_check ON public.materias IS 'nivel_primaria:20261104120000';

NOTIFY pgrst, 'reload schema';

COMMIT;
