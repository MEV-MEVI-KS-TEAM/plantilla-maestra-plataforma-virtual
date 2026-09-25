-- ============================================================================
-- PLAN DE 6 MESES DE LICENCIATURA — id propio '6_meses_lic' (Bloque B, B5)
-- ============================================================================
--
-- POR QUÉ UN ID PROPIO. '6_meses' ya es el plan de Secundaria/Preparatoria y
-- `buscarModalidad` consulta primero esa tabla: un alumno de licenciatura en
-- '6_meses' heredaría el ritmo y el precio de preparatoria (Bug 121). El plan de
-- 6 meses de licenciatura se llama '6_meses_lic' (13 clones ya lo usan con una
-- migración propia, 20260917120000/20260918120000_modalidad_6_meses_lic.sql;
-- este archivo lleva otro nombre a propósito para no pisar el suyo).
--
-- QUÉ HACE. Solo amplía el CHECK de `alumnos.modalidad`. Sin él, dar de alta a
-- un alumno en '6_meses_lic' falla con 23514 y la ruta de alta borra el usuario
-- de Auth que acababa de crear (Bug 68).
--
-- ADITIVO, POR UNIÓN. El CHECK nuevo admite lo que la base YA admitía (hay
-- clones con '4_meses', 'acceso_completo', '3_meses_dip', '6_meses_dip'…) más
-- los 7 ids canónicos más '6_meses_lic'. Nunca estrecha: recrearlo con una lista
-- cerrada dejaría a esos clientes sin poder dar de alta (y si ya tienen filas,
-- el ADD fallaría).
--
-- POR CATÁLOGO, NO POR NOMBRE (Bug 72). Se buscan los CHECK de UNA columna sobre
-- `modalidad` por `conkey`, se llamen como se llamen. Fail-closed: si alguno no
-- tiene la forma «lista de literales» (una regex, un NOT VALID, otra columna),
-- aborta sin tocar nada. Un CHECK de VARIAS columnas que mencione `modalidad` no
-- se toca: se avisa con WARNING. Si no había NINGÚN CHECK, se crea con los
-- canónicos más los ids que ya usan los alumnos (y WARNING).
--
-- `duracion_meses` NO se toca: su expresión (20260812) termina en ELSE 6, así
-- que '6_meses_lic' ya vale 6. El instalador nuevo (scripts/schema.sql) lo
-- declara explícito.
--
-- Idempotente (la segunda corrida recrea el mismo CHECK) y atómica.
-- Conexión: directa o pooler en MODO SESIÓN, puerto 5432 (Bug 228). Nunca 6543.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_attnum smallint;
  v_ids    text[] := ARRAY['3_meses','6_meses','6_meses_lic','9_meses','12_meses','18_meses','24_meses','36_meses'];
  v_lista  text;
  v_n      integer := 0;
  c        record;
BEGIN
  SELECT attnum INTO v_attnum
    FROM pg_attribute
   WHERE attrelid = 'public.alumnos'::regclass AND attname = 'modalidad' AND NOT attisdropped;
  IF v_attnum IS NULL THEN
    RAISE EXCEPTION 'public.alumnos no tiene la columna modalidad';
  END IF;

  FOR c IN
    SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
     WHERE conrelid = 'public.alumnos'::regclass
       AND contype = 'c'
       AND conkey = ARRAY[v_attnum]
  LOOP
    -- Fail-closed: solo se reescribe la forma «lista de literales de texto».
    IF regexp_replace(regexp_replace(c.def, '''[^'']*''::text', 'L', 'g'), '[()[:space:]]', '', 'g')
       !~ '^CHECK(modalidadISNULLOR)?modalidad=ANYARRAY\[L(,L)*\]$' THEN
      RAISE EXCEPTION 'CHECK % sobre alumnos.modalidad con forma desconocida: %', c.conname, c.def;
    END IF;
    -- Unión: lo que ya admitía + los canónicos.
    SELECT array_agg(DISTINCT x) INTO v_ids
      FROM (SELECT unnest(v_ids) AS x
            UNION
            SELECT (regexp_matches(c.def, '''([^'']+)''', 'g'))[1]) s;
    RAISE NOTICE 'quitando CHECK %: %', c.conname, c.def;
    EXECUTE format('ALTER TABLE public.alumnos DROP CONSTRAINT %I', c.conname);
    v_n := v_n + 1;
  END LOOP;

  -- Sin ningún CHECK (p. ej. una re-corrida de la 20260812 que falló a medias:
  -- su DROP pasó y su ADD no): se crea con los canónicos MÁS los ids que ya usan
  -- los alumnos, para no dejar fuera a nadie. Un id que el config.ts venda y
  -- ningún alumno use todavía quedaría fuera: por eso el WARNING.
  IF v_n = 0 THEN
    SELECT array_agg(DISTINCT x) INTO v_ids
      FROM (SELECT unnest(v_ids) AS x
            UNION
            SELECT modalidad FROM public.alumnos WHERE modalidad IS NOT NULL) s;
    RAISE WARNING 'alumnos.modalidad no tenía CHECK: se crea con los canónicos y los ids en uso. Revisa que incluya todos los planes de config.ts.';
  END IF;

  SELECT string_agg(quote_literal(x), ', ' ORDER BY x) INTO v_lista FROM unnest(v_ids) AS t(x);
  EXECUTE format(
    'ALTER TABLE public.alumnos ADD CONSTRAINT alumnos_modalidad_check CHECK (modalidad IS NULL OR modalidad IN (%s))',
    v_lista);
  RAISE NOTICE 'alumnos_modalidad_check admite: %', v_lista;

  FOR c IN
    SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
     WHERE conrelid = 'public.alumnos'::regclass
       AND contype = 'c'
       AND v_attnum = ANY (conkey)
       AND conkey <> ARRAY[v_attnum]
  LOOP
    RAISE WARNING 'CHECK % también restringe modalidad y NO se amplió: %', c.conname, c.def;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
