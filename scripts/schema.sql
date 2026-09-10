-- ============================================================================
-- SCHEMA CANÓNICO PLANTILLA MAESTRA MEV - PLATAFORMA VIRTUAL
-- ============================================================================
-- Generado a partir de IVS Virtual (schema base más maduro de la plantilla)
-- 
-- USO:
--   1. Crear proyecto Supabase nuevo
--   2. Ir a SQL Editor
--   3. Pegar este archivo completo
--   4. Ejecutar (tarda ~10-30 segundos)
--   5. Después ejecutar scripts/setup.sql para datos seed
--
-- ESTE ARCHIVO ES IDEMPOTENTE: puede re-ejecutarse sin romper.
-- 
-- Tablas creadas: 19
-- Constraints: 72
-- Políticas RLS: 47
-- Triggers: 2
-- ============================================================================

--
--

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;

--
-- Name: actualizar_racha(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_racha() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  hoy        DATE := CURRENT_DATE;
  ult_act    DATE;
  racha_cur  INTEGER;
  racha_max  INTEGER;
BEGIN
  -- Solo actuar cuando se completa una semana
  IF NEW.completada = true AND (OLD.completada IS DISTINCT FROM true) THEN

    SELECT ultima_actividad, racha_actual, racha_maxima
      INTO ult_act, racha_cur, racha_max
      FROM public.racha_actividad
     WHERE alumno_id = NEW.alumno_id;

    IF NOT FOUND THEN
      -- Primera actividad
      INSERT INTO public.racha_actividad (alumno_id, racha_actual, racha_maxima, ultima_actividad)
        VALUES (NEW.alumno_id, 1, 1, hoy);
    ELSE
      IF ult_act = hoy THEN
        -- Misma d├¡a, no sumar
        NULL;
      ELSIF ult_act = hoy - INTERVAL '1 day' THEN
        -- D├¡a consecutivo
        racha_cur := racha_cur + 1;
        racha_max := GREATEST(racha_max, racha_cur);
        UPDATE public.racha_actividad
           SET racha_actual = racha_cur,
               racha_maxima = racha_max,
               ultima_actividad = hoy,
               updated_at = NOW()
         WHERE alumno_id = NEW.alumno_id;
      ELSE
        -- Racha rota
        UPDATE public.racha_actividad
           SET racha_actual = 1,
               ultima_actividad = hoy,
               updated_at = NOW()
         WHERE alumno_id = NEW.alumno_id;
      END IF;
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

--
-- Name: es_admin(); Type: FUNCTION; Schema: public; Owner: -
--

-- Cuerpo post-S2 (20260729121000_fix_s2_es_admin.sql): LOWER(rol) — un rol
-- guardado en mayusculas dejaba el panel muerto (Bug 67).
CREATE FUNCTION public.es_admin() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
       AND LOWER(rol) = 'admin'
  );
END;
$$;

--
-- Name: es_staff(); Type: FUNCTION; Schema: public; Owner: -
-- Staff = admin O secretario. Solo para lectura básica de alumnos/usuarios
-- y registro de pagos; es_admin() se mantiene intacto para todo lo demás.
--

-- Cuerpo post-S2: mismo LOWER que es_admin().
CREATE FUNCTION public.es_staff() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
       AND LOWER(rol) IN ('admin', 'secretario')
  );
END;
$$;

--
-- Name: generar_matricula(); Type: FUNCTION; Schema: public; Owner: -
--

-- SECURITY DEFINER porque public.ajustes tiene RLS sin politicas: sin esto
-- la lectura del prefijo devolveria vacio y todo saldria 'MEV-'.
CREATE FUNCTION public.generar_matricula() RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  anio     TEXT := TO_CHAR(NOW(), 'YYYY');
  prefijo  TEXT;
  contador INTEGER;
  nueva    TEXT;
BEGIN
  SELECT valor INTO prefijo FROM public.ajustes WHERE clave = 'prefijo_matricula';
  -- 'MEV' solo aplica mientras el servidor no haya sembrado el ajuste. Es
  -- neutro a proposito: si vuelve a aparecer el prefijo de otro cliente en una
  -- matricula, el culpable es un literal, no este default.
  prefijo := NULLIF(TRIM(COALESCE(prefijo, '')), '');
  IF prefijo IS NULL THEN
    prefijo := 'MEV';
  END IF;

  SELECT COUNT(*) + 1 INTO contador FROM public.alumnos;
  nueva := prefijo || '-' || anio || '-' || LPAD(contador::TEXT, 4, '0');
  -- evitar colisiones en caso de concurrencia
  WHILE EXISTS (SELECT 1 FROM public.alumnos WHERE matricula = nueva) LOOP
    contador := contador + 1;
    nueva := prefijo || '-' || anio || '-' || LPAD(contador::TEXT, 4, '0');
  END LOOP;
  RETURN nueva;
END;
$$;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

-- Cuerpo post-S1 (20260729120000_fix_s1_rol_alta.sql, Bug 66): el rol del alta
-- es SIEMPRE 'alumno', literal. raw_user_meta_data->>'rol' lo controla quien
-- llama a signUp — leerlo aqui era escalada de privilegios inmediata y total.
CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- rol FIJO. No se lee raw_user_meta_data->>'rol' bajo ninguna circunstancia.
  INSERT INTO public.usuarios (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    'alumno'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

--
-- Name: trigger_asignar_matricula(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_asignar_matricula() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
    NEW.matricula := public.generar_matricula();
  END IF;
  RETURN NEW;
END;
$$;

--
-- Name: alumnos; Type: TABLE; Schema: public; Owner: -
--

--
-- Name: ajustes; Type: TABLE; Schema: public; Owner: -
--
-- Valores de config que la BD necesita por su cuenta, porque corren en
-- triggers y funciones sin acceso a src/lib/config.ts. Hoy solo el prefijo de
-- matricula, que consume generar_matricula(). Lo siembra el servidor desde
-- CONFIG.prefijoMatricula al dar de alta un alumno (src/lib/matricula.ts): no
-- hay que capturarlo a mano al aprovisionar.
--
-- RLS activo y SIN politicas: en Supabase toda tabla de `public` sale por
-- PostgREST, asi que sin RLS quedaria legible por cualquier visitante.
--

CREATE TABLE IF NOT EXISTS public.ajustes (
    clave text NOT NULL,
    valor text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ajustes_pkey PRIMARY KEY (clave)
);

ALTER TABLE public.ajustes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alumnos (
    id uuid NOT NULL,
    matricula text,
    nivel text,
    modalidad text,
    -- Slug de la carrera (CONFIG.licenciaturas.carreras[].slug). Solo
    -- licenciatura; NULL en el resto. Sin esto el alumno de licenciatura entra
    -- a un catalogo vacio — y el alta/registro (que SIEMPRE mandan carrera en
    -- el payload) truenan con "column does not exist" y borran el usuario de
    -- Auth recien creado. Espejo de 20260812120000_licenciaturas.sql.
    carrera text,
    es_sindicalizado boolean DEFAULT false NOT NULL,
    sindicato text,
    inscripcion_pagada boolean DEFAULT false NOT NULL,
    meses_desbloqueados integer DEFAULT 0 NOT NULL,
    -- Expresion COMPLETA (20260812): con la vieja (3 o 6) un alumno de
    -- licenciatura en 12_meses quedaba con duracion 6 y su avance se calculaba
    -- contra un plan que no cursa.
    duracion_meses integer GENERATED ALWAYS AS (
CASE modalidad
    WHEN '3_meses'::text THEN 3
    WHEN '6_meses'::text THEN 6
    WHEN '9_meses'::text THEN 9
    WHEN '12_meses'::text THEN 12
    WHEN '18_meses'::text THEN 18
    WHEN '24_meses'::text THEN 24
    WHEN '36_meses'::text THEN 36
    ELSE 6
END) STORED,
    fecha_inscripcion timestamp with time zone,
    fecha_inicio timestamp with time zone,
    activo boolean DEFAULT true NOT NULL,
    notas_admin text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    contactado_whatsapp boolean DEFAULT false NOT NULL,
    -- Que curso de ingreso pidio al registrarse, para que el admin sepa que
    -- activarle. Guarda el id de la OFERTA (src/lib/cursos/oferta.ts), no un
    -- UUID de `cursos`: hay clientes que venden varios como paquete unico.
    curso_solicitado text,
    -- Con los planes de licenciatura (20260812): sin ampliarlo, dar de alta un
    -- alumno en '9_meses'+ falla con 23514 y la ruta de alta borra el usuario
    -- de Auth que acababa de crear (Bug 68).
    CONSTRAINT alumnos_modalidad_check CHECK ((modalidad IS NULL OR modalidad = ANY (ARRAY['3_meses'::text, '6_meses'::text, '9_meses'::text, '12_meses'::text, '18_meses'::text, '24_meses'::text, '36_meses'::text]))),
    -- 'diplomado' habilita la línea Solo-Cursos (B1). Debe coincidir con
    -- supabase/migrations/20260730120000_b1_fundacion_solo_cursos.sql
    -- ⚠️ NO copiar el CHECK de 20260812120000_licenciaturas.sql, que lo recrea
    -- SIN 'diplomado' (Bug 98 del playbook).
    CONSTRAINT alumnos_nivel_check CHECK ((nivel = ANY (ARRAY['secundaria'::text, 'preparatoria'::text, 'licenciatura'::text, 'diplomado'::text])))
);

--
-- Name: calificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calificaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    materia_id uuid NOT NULL,
    evaluacion_id uuid,
    acreditado boolean DEFAULT false NOT NULL,
    fecha_acreditacion timestamp with time zone,
    folio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: constancias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.constancias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    folio text NOT NULL,
    fecha_emision timestamp with time zone DEFAULT now() NOT NULL,
    url_pdf text,
    materia_id uuid
);

--
-- Name: documentos_alumno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_alumno (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    tipo_documento text NOT NULL,
    nombre_archivo text,
    url_archivo text,
    verificado boolean DEFAULT false NOT NULL,
    fecha_subida timestamp with time zone DEFAULT now() NOT NULL,
    verificado_por uuid,
    fecha_verificacion timestamp with time zone,
    notas text
);

--
-- Name: evaluaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materia_id uuid,
    mes_id uuid,
    titulo text NOT NULL,
    descripcion text,
    tiempo_limite_minutos integer DEFAULT 60 NOT NULL,
    intentos_permitidos integer DEFAULT 3 NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: glosario_materia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.glosario_materia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materia_id uuid NOT NULL,
    termino text NOT NULL,
    definicion text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: intentos_evaluacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intentos_evaluacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    evaluacion_id uuid NOT NULL,
    numero_intento integer DEFAULT 1 NOT NULL,
    puntaje integer,
    acreditado boolean DEFAULT false NOT NULL,
    fecha_intento timestamp with time zone DEFAULT now() NOT NULL,
    respuestas jsonb
);

--
-- Name: logros_alumno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logros_alumno (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    tipo_logro text NOT NULL,
    fecha_obtenido timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: materias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    nivel text,
    orden integer,
    icono text,
    color text,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    -- 20260812 (licenciaturas): `carrera` = a que carrera pertenece la materia
    -- (NULL en Sec/Prepa/demo); `modalidad` = plan de REFERENCIA con el que se
    -- sembro el escalonamiento — metadato del seed, NO filtrar el catalogo del
    -- alumno por esta columna (Bugs 59/91).
    carrera text,
    modalidad text,
    CONSTRAINT materias_nivel_check CHECK ((nivel = ANY (ARRAY['secundaria'::text, 'preparatoria'::text, 'demo'::text, 'licenciatura'::text])))
);

CREATE INDEX IF NOT EXISTS idx_materias_carrera
  ON public.materias (carrera) WHERE carrera IS NOT NULL;

--
-- Name: meses_contenido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meses_contenido (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materia_id uuid,
    numero_mes integer NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: notas_alumno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notas_alumno (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    semana_id uuid NOT NULL,
    contenido text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: preguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preguntas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evaluacion_id uuid NOT NULL,
    pregunta text NOT NULL,
    opcion_a text NOT NULL,
    opcion_b text NOT NULL,
    opcion_c text NOT NULL,
    opcion_d text NOT NULL,
    respuesta_correcta text NOT NULL,
    orden integer,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT preguntas_respuesta_correcta_check CHECK ((respuesta_correcta = ANY (ARRAY['a'::text, 'b'::text, 'c'::text, 'd'::text])))
);

--
-- Name: progreso_semanas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progreso_semanas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    semana_id uuid NOT NULL,
    completada boolean DEFAULT false NOT NULL,
    fecha_completada timestamp with time zone,
    tiempo_visto_minutos integer DEFAULT 0 NOT NULL
);

--
-- Name: quiz_respuestas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_respuestas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    quiz_id uuid NOT NULL,
    respuesta text,
    correcta boolean,
    fecha timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: quiz_semana; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_semana (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    semana_id uuid NOT NULL,
    pregunta text NOT NULL,
    opcion_a text NOT NULL,
    opcion_b text NOT NULL,
    opcion_c text NOT NULL,
    opcion_d text,
    respuesta_correcta text NOT NULL,
    orden integer,
    explicacion text,
    activa boolean DEFAULT true NOT NULL,
    CONSTRAINT quiz_semana_respuesta_correcta_check CHECK ((respuesta_correcta = ANY (ARRAY['a'::text, 'b'::text, 'c'::text, 'd'::text])))
);

--
-- Name: racha_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.racha_actividad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alumno_id uuid NOT NULL,
    racha_actual integer DEFAULT 0 NOT NULL,
    racha_maxima integer DEFAULT 0 NOT NULL,
    ultima_actividad date,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: semana_materiales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.semana_materiales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    semana_id uuid NOT NULL,
    nombre text NOT NULL,
    path text NOT NULL,
    tamano_bytes bigint,
    orden integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: semanas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.semanas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mes_id uuid,
    numero_semana integer NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    video_url text,
    tiempo_estimado_minutos integer DEFAULT 60 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    contenido text,
    video_url_2 text,
    video_url_3 text,
    activa boolean DEFAULT true NOT NULL
);

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    email text NOT NULL,
    nombre text,
    apellidos text,
    telefono text,
    foto_url text,
    rol text DEFAULT 'alumno'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_rol_check CHECK ((rol = ANY (ARRAY['alumno'::text, 'admin'::text, 'secretario'::text])))
);

--
-- Name: alumnos alumnos_matricula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_matricula_key UNIQUE (matricula);

--
-- Name: alumnos alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id);

--
-- Name: calificaciones calificaciones_alumno_id_materia_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_alumno_id_materia_id_key UNIQUE (alumno_id, materia_id);

--
-- Name: calificaciones calificaciones_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_folio_key UNIQUE (folio);

--
-- Name: calificaciones calificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_pkey PRIMARY KEY (id);

--
-- Name: constancias constancias_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constancias
    ADD CONSTRAINT constancias_folio_key UNIQUE (folio);

--
-- Name: constancias constancias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constancias
    ADD CONSTRAINT constancias_pkey PRIMARY KEY (id);

--
-- Name: documentos_alumno documentos_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_alumno
    ADD CONSTRAINT documentos_alumno_pkey PRIMARY KEY (id);

--
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);

--
-- Name: glosario_materia glosario_materia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.glosario_materia
    ADD CONSTRAINT glosario_materia_pkey PRIMARY KEY (id);

--
-- Name: intentos_evaluacion intentos_evaluacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentos_evaluacion
    ADD CONSTRAINT intentos_evaluacion_pkey PRIMARY KEY (id);

--
-- Name: logros_alumno logros_alumno_alumno_id_tipo_logro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logros_alumno
    ADD CONSTRAINT logros_alumno_alumno_id_tipo_logro_key UNIQUE (alumno_id, tipo_logro);

--
-- Name: logros_alumno logros_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logros_alumno
    ADD CONSTRAINT logros_alumno_pkey PRIMARY KEY (id);

--
-- Name: materias materias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materias
    ADD CONSTRAINT materias_pkey PRIMARY KEY (id);

--
-- Name: meses_contenido meses_contenido_materia_id_numero_mes_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meses_contenido
    ADD CONSTRAINT meses_contenido_materia_id_numero_mes_key UNIQUE (materia_id, numero_mes);

--
-- Name: meses_contenido meses_contenido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meses_contenido
    ADD CONSTRAINT meses_contenido_pkey PRIMARY KEY (id);

--
-- Name: notas_alumno notas_alumno_alumno_id_semana_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_alumno
    ADD CONSTRAINT notas_alumno_alumno_id_semana_id_key UNIQUE (alumno_id, semana_id);

--
-- Name: notas_alumno notas_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_alumno
    ADD CONSTRAINT notas_alumno_pkey PRIMARY KEY (id);

--
-- Name: preguntas preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_pkey PRIMARY KEY (id);

--
-- Name: progreso_semanas progreso_semanas_alumno_id_semana_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_semanas
    ADD CONSTRAINT progreso_semanas_alumno_id_semana_id_key UNIQUE (alumno_id, semana_id);

--
-- Name: progreso_semanas progreso_semanas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_semanas
    ADD CONSTRAINT progreso_semanas_pkey PRIMARY KEY (id);

--
-- Name: quiz_respuestas quiz_respuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_respuestas
    ADD CONSTRAINT quiz_respuestas_pkey PRIMARY KEY (id);

--
-- Name: quiz_semana quiz_semana_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_semana
    ADD CONSTRAINT quiz_semana_pkey PRIMARY KEY (id);

--
-- Name: racha_actividad racha_actividad_alumno_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.racha_actividad
    ADD CONSTRAINT racha_actividad_alumno_id_key UNIQUE (alumno_id);

--
-- Name: racha_actividad racha_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.racha_actividad
    ADD CONSTRAINT racha_actividad_pkey PRIMARY KEY (id);

--
-- Name: semana_materiales semana_materiales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semana_materiales
    ADD CONSTRAINT semana_materiales_pkey PRIMARY KEY (id);

--
-- Name: semanas semanas_mes_id_numero_semana_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semanas
    ADD CONSTRAINT semanas_mes_id_numero_semana_key UNIQUE (mes_id, numero_semana);

--
-- Name: semanas semanas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semanas
    ADD CONSTRAINT semanas_pkey PRIMARY KEY (id);

--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

--
-- Name: idx_alumnos_matricula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_matricula ON public.alumnos USING btree (matricula);

--
-- Name: idx_alumnos_nivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_nivel ON public.alumnos USING btree (nivel);

--
-- Name: idx_calificaciones_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calificaciones_alumno ON public.calificaciones USING btree (alumno_id);

--
-- Name: idx_documentos_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_alumno ON public.documentos_alumno USING btree (alumno_id);

--
-- Name: idx_intentos_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intentos_alumno ON public.intentos_evaluacion USING btree (alumno_id);

--
-- Name: idx_intentos_evaluacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intentos_evaluacion ON public.intentos_evaluacion USING btree (evaluacion_id);

--
-- Name: idx_meses_contenido_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_meses_contenido_activa ON public.meses_contenido USING btree (materia_id) WHERE activa;

--
-- Name: idx_meses_materia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meses_materia ON public.meses_contenido USING btree (materia_id);

--
-- Name: idx_notas_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_alumno ON public.notas_alumno USING btree (alumno_id);

--
-- Name: idx_preguntas_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_preguntas_activa ON public.preguntas USING btree (evaluacion_id) WHERE activa;

--
-- Name: idx_progreso_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progreso_alumno ON public.progreso_semanas USING btree (alumno_id);

--
-- Name: idx_progreso_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progreso_semana ON public.progreso_semanas USING btree (semana_id);

--
-- Name: idx_quiz_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_semana ON public.quiz_semana USING btree (semana_id);

--
-- Name: idx_quiz_semana_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_quiz_semana_activa ON public.quiz_semana USING btree (semana_id) WHERE activa;

--
-- Name: idx_semana_materiales_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_semana_materiales_semana ON public.semana_materiales USING btree (semana_id);

--
-- Name: idx_semanas_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_semanas_activa ON public.semanas USING btree (mes_id) WHERE activa;

--
-- Name: idx_semanas_mes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_semanas_mes ON public.semanas USING btree (mes_id);

--
-- Name: progreso_semanas trg_actualizar_racha; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_actualizar_racha AFTER INSERT OR UPDATE ON public.progreso_semanas FOR EACH ROW EXECUTE FUNCTION public.actualizar_racha();

--
-- Name: alumnos trg_asignar_matricula; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_asignar_matricula BEFORE INSERT ON public.alumnos FOR EACH ROW EXECUTE FUNCTION public.trigger_asignar_matricula();

--
-- Name: alumnos alumnos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_id_fkey FOREIGN KEY (id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

--
-- Name: calificaciones calificaciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: calificaciones calificaciones_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id) ON DELETE SET NULL;

--
-- Name: calificaciones calificaciones_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE;

--
-- Name: constancias constancias_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constancias
    ADD CONSTRAINT constancias_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: constancias constancias_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constancias
    ADD CONSTRAINT constancias_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE SET NULL;

--
-- Name: documentos_alumno documentos_alumno_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_alumno
    ADD CONSTRAINT documentos_alumno_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: documentos_alumno documentos_alumno_verificado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_alumno
    ADD CONSTRAINT documentos_alumno_verificado_por_fkey FOREIGN KEY (verificado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;

--
-- Name: evaluaciones evaluaciones_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE;

--
-- Name: evaluaciones evaluaciones_mes_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_mes_id_fkey FOREIGN KEY (mes_id) REFERENCES public.meses_contenido(id) ON DELETE SET NULL;

--
-- Name: glosario_materia glosario_materia_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.glosario_materia
    ADD CONSTRAINT glosario_materia_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE;

--
-- Name: intentos_evaluacion intentos_evaluacion_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentos_evaluacion
    ADD CONSTRAINT intentos_evaluacion_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: intentos_evaluacion intentos_evaluacion_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentos_evaluacion
    ADD CONSTRAINT intentos_evaluacion_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id) ON DELETE CASCADE;

--
-- Name: logros_alumno logros_alumno_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logros_alumno
    ADD CONSTRAINT logros_alumno_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: meses_contenido meses_contenido_materia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meses_contenido
    ADD CONSTRAINT meses_contenido_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE;

--
-- Name: notas_alumno notas_alumno_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_alumno
    ADD CONSTRAINT notas_alumno_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: notas_alumno notas_alumno_semana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_alumno
    ADD CONSTRAINT notas_alumno_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semanas(id) ON DELETE CASCADE;

--
-- Name: preguntas preguntas_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id) ON DELETE CASCADE;

--
-- Name: progreso_semanas progreso_semanas_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_semanas
    ADD CONSTRAINT progreso_semanas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: progreso_semanas progreso_semanas_semana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_semanas
    ADD CONSTRAINT progreso_semanas_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semanas(id) ON DELETE CASCADE;

--
-- Name: quiz_respuestas quiz_respuestas_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_respuestas
    ADD CONSTRAINT quiz_respuestas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: quiz_respuestas quiz_respuestas_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_respuestas
    ADD CONSTRAINT quiz_respuestas_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz_semana(id) ON DELETE CASCADE;

--
-- Name: quiz_semana quiz_semana_semana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_semana
    ADD CONSTRAINT quiz_semana_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semanas(id) ON DELETE CASCADE;

--
-- Name: racha_actividad racha_actividad_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.racha_actividad
    ADD CONSTRAINT racha_actividad_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;

--
-- Name: semana_materiales semana_materiales_semana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semana_materiales
    ADD CONSTRAINT semana_materiales_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semanas(id) ON DELETE CASCADE;

--
-- Name: semanas semanas_mes_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semanas
    ADD CONSTRAINT semanas_mes_id_fkey FOREIGN KEY (mes_id) REFERENCES public.meses_contenido(id) ON DELETE CASCADE;

--
-- Name: usuarios usuarios_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: site_config; Type: TABLE; Schema: public; Owner: -
--
-- Overrides del módulo "Personalizar mi página" (F1): lo que el ADMIN cambia
-- desde su panel (logo, colores, textos, precios) sin redeploy. Se hace
-- deep-merge sobre src/lib/config.ts en getSiteConfig(); con la tabla vacía
-- la app es IDÉNTICA a la de antes (invariante de los ~144 clientes).
-- Fila única (CHECK id = 1) y overrides PARCIALES en JSONB: una columna por
-- campo sería un ALTER TABLE en 144 bases cada vez que cambie el config.
--
-- Va AQUÍ, después de las constraints, y no junto a ajustes: updated_by lleva
-- FK a usuarios(id) y en este archivo (estilo pg_dump) usuarios_pkey se agrega
-- por ALTER TABLE más arriba, no inline en el CREATE TABLE; una REFERENCES
-- antes de ese punto truena con "no unique constraint matching given keys".
-- Espejo de supabase/migrations/20260908120000_site_config.sql.
--
-- RLS con SELECT para anon y authenticated (la landing sin sesión lee logo y
-- colores) y SIN política de escritura: solo el service role escribe desde la
-- API del admin. USING (true) no consulta la propia tabla: sin recursión.
-- El nombre de la política va SIN acentos a propósito (como todo identificador
-- de este archivo): un desfase de encoding entre instalador y migración
-- dejaría dos políticas en vez de una.
--
-- ⚠️ El bucket de storage `branding` (PÚBLICO, 2 MB, guarda png/jpeg —el
-- editor acepta también webp y svg a la ENTRADA, pero la API los rasteriza a
-- PNG antes de subir—; lectura pública, escritura solo service role) NO va
-- aquí: este archivo no crea
-- NINGÚN bucket; los crea A MANO el operador en el pre-vuelo (scripts/README.md,
-- "Workflow de cliente nuevo", paso 2). No lleva ni una línea de storage a
-- propósito: el DDL sobre storage.objects exige ser dueño de la tabla y con el
-- rol del onboarding aborta el instalador ENTERO ("must be owner of table
-- objects").
--

CREATE TABLE IF NOT EXISTS public.site_config (
    id integer DEFAULT 1 NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT site_config_pkey PRIMARY KEY (id),
    CONSTRAINT site_config_id_check CHECK ((id = 1))
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_config: lectura abierta" ON public.site_config;
CREATE POLICY "site_config: lectura abierta" ON public.site_config FOR SELECT TO anon, authenticated USING (true);

-- GRANT por COLUMNAS: updated_by (el UUID del admin que guardo) no lo lee un
-- visitante anonimo; data si, que es lo que la landing necesita. El REVOKE va
-- antes porque un privilegio de TABLA gana sobre el de columna, asi que una
-- base que ya tenga el grant amplio (version anterior de la migracion) se
-- quedaria con el. Espejo de supabase/migrations/20260908120000_site_config.sql.
REVOKE SELECT ON public.site_config FROM anon, authenticated;
GRANT SELECT (id, data, updated_at) ON public.site_config TO anon, authenticated;

--
-- Name: alumnos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

--
-- Name: alumnos alumnos: admin puede actualizar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "alumnos: admin puede actualizar" ON public.alumnos FOR UPDATE USING (public.es_admin());

--
-- Name: alumnos alumnos: admin puede eliminar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "alumnos: admin puede eliminar" ON public.alumnos FOR DELETE USING (public.es_admin());

--
-- Name: alumnos alumnos: admin puede insertar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "alumnos: admin puede insertar" ON public.alumnos FOR INSERT WITH CHECK (public.es_admin());

--
-- Name: alumnos alumnos: ver propio registro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "alumnos: ver propio registro" ON public.alumnos FOR SELECT USING (((id = auth.uid()) OR public.es_admin()));

--
-- Name: calificaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: calificaciones calificaciones: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "calificaciones: admin gestiona" ON public.calificaciones USING (public.es_admin());

--
-- Name: calificaciones calificaciones: ver propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "calificaciones: ver propias" ON public.calificaciones FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: constancias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.constancias ENABLE ROW LEVEL SECURITY;

--
-- Name: constancias constancias: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "constancias: admin gestiona" ON public.constancias USING (public.es_admin());

--
-- Name: constancias constancias: ver propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "constancias: ver propias" ON public.constancias FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: documentos_alumno documentos: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "documentos: admin gestiona" ON public.documentos_alumno USING (public.es_admin());

--
-- Name: documentos_alumno documentos: subir propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "documentos: subir propios" ON public.documentos_alumno FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: documentos_alumno documentos: ver propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "documentos: ver propios" ON public.documentos_alumno FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: documentos_alumno; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_alumno ENABLE ROW LEVEL SECURITY;

--
-- Name: evaluaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: evaluaciones evaluaciones: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "evaluaciones: admin gestiona" ON public.evaluaciones USING (public.es_admin());

--
-- Name: evaluaciones evaluaciones: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "evaluaciones: lectura autenticados" ON public.evaluaciones FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: glosario_materia glosario: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "glosario: admin gestiona" ON public.glosario_materia USING (public.es_admin());

--
-- Name: glosario_materia glosario: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "glosario: lectura autenticados" ON public.glosario_materia FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: glosario_materia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.glosario_materia ENABLE ROW LEVEL SECURITY;

--
-- Name: intentos_evaluacion intentos: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "intentos: admin gestiona" ON public.intentos_evaluacion USING (public.es_admin());

--
-- Name: intentos_evaluacion intentos: registrar propio intento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "intentos: registrar propio intento" ON public.intentos_evaluacion FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: intentos_evaluacion intentos: ver propios intentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "intentos: ver propios intentos" ON public.intentos_evaluacion FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: intentos_evaluacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intentos_evaluacion ENABLE ROW LEVEL SECURITY;

--
-- Name: logros_alumno logros: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "logros: admin gestiona" ON public.logros_alumno USING (public.es_admin());

--
-- Name: logros_alumno logros: insertar propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "logros: insertar propios" ON public.logros_alumno FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: logros_alumno logros: ver propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "logros: ver propios" ON public.logros_alumno FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: logros_alumno; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.logros_alumno ENABLE ROW LEVEL SECURITY;

--
-- Name: materias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

--
-- Name: materias materias: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "materias: admin gestiona" ON public.materias USING (public.es_admin());

--
-- Name: materias materias: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "materias: lectura autenticados" ON public.materias FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: meses_contenido; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meses_contenido ENABLE ROW LEVEL SECURITY;

--
-- Name: meses_contenido meses_contenido: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "meses_contenido: admin gestiona" ON public.meses_contenido USING (public.es_admin());

--
-- Name: meses_contenido meses_contenido: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "meses_contenido: lectura autenticados" ON public.meses_contenido FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: notas_alumno notas: actualizar propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "notas: actualizar propias" ON public.notas_alumno FOR UPDATE USING ((alumno_id = auth.uid()));

--
-- Name: notas_alumno notas: gestionar propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "notas: gestionar propias" ON public.notas_alumno FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: notas_alumno notas: ver propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "notas: ver propias" ON public.notas_alumno FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: notas_alumno; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notas_alumno ENABLE ROW LEVEL SECURITY;

--
-- Name: preguntas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;

--
-- Name: preguntas preguntas: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "preguntas: admin gestiona" ON public.preguntas USING (public.es_admin());

--
-- Name: preguntas preguntas: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "preguntas: lectura autenticados" ON public.preguntas FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: progreso_semanas progreso: actualizar propio progreso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "progreso: actualizar propio progreso" ON public.progreso_semanas FOR UPDATE USING ((alumno_id = auth.uid()));

--
-- Name: progreso_semanas progreso: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "progreso: admin gestiona" ON public.progreso_semanas USING (public.es_admin());

--
-- Name: progreso_semanas progreso: registrar propio progreso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "progreso: registrar propio progreso" ON public.progreso_semanas FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: progreso_semanas progreso: ver propio progreso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "progreso: ver propio progreso" ON public.progreso_semanas FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: progreso_semanas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.progreso_semanas ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_respuestas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_respuestas ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_respuestas quiz_respuestas: registrar propia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "quiz_respuestas: registrar propia" ON public.quiz_respuestas FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: quiz_respuestas quiz_respuestas: ver propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "quiz_respuestas: ver propias" ON public.quiz_respuestas FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: quiz_semana; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_semana ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_semana quiz_semana: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "quiz_semana: admin gestiona" ON public.quiz_semana USING (public.es_admin());

--
-- Name: quiz_semana quiz_semana: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "quiz_semana: lectura autenticados" ON public.quiz_semana FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: racha_actividad racha: actualizar propia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "racha: actualizar propia" ON public.racha_actividad FOR UPDATE USING ((alumno_id = auth.uid()));

--
-- Name: racha_actividad racha: insertar propia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "racha: insertar propia" ON public.racha_actividad FOR INSERT WITH CHECK ((alumno_id = auth.uid()));

--
-- Name: racha_actividad racha: ver propia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "racha: ver propia" ON public.racha_actividad FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

--
-- Name: racha_actividad; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.racha_actividad ENABLE ROW LEVEL SECURITY;

--
-- Name: semana_materiales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.semana_materiales ENABLE ROW LEVEL SECURITY;

--
-- Name: semana_materiales semana_materiales: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "semana_materiales: admin gestiona" ON public.semana_materiales USING (public.es_admin());

--
-- Name: semana_materiales semana_materiales: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "semana_materiales: lectura autenticados" ON public.semana_materiales FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: semanas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.semanas ENABLE ROW LEVEL SECURITY;

--
-- Name: semanas semanas: admin gestiona; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "semanas: admin gestiona" ON public.semanas USING (public.es_admin());

--
-- Name: semanas semanas: lectura autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "semanas: lectura autenticados" ON public.semanas FOR SELECT USING ((auth.role() = 'authenticated'::text));

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios usuarios: actualizar propio perfil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "usuarios: actualizar propio perfil" ON public.usuarios FOR UPDATE USING ((id = auth.uid()));

--
-- Name: usuarios usuarios: admin puede insertar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "usuarios: admin puede insertar" ON public.usuarios FOR INSERT WITH CHECK ((public.es_admin() OR (id = auth.uid())));

--
-- Name: usuarios usuarios: ver propio perfil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "usuarios: ver propio perfil" ON public.usuarios FOR SELECT USING (((id = auth.uid()) OR public.es_staff()));

--
--



-- =============================================================
-- FIX Issue #15 — is_admin() wrapper para compatibilidad smoke test
-- =============================================================
-- post-setup-check.sql busca is_admin(), schema histórico crea es_admin().
-- Wrapper mantiene compatibilidad con ambos nombres sin duplicar lógica.
-- SECURITY DEFINER + STABLE evita recursión infinita en RLS policies.
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.es_admin();
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- =============================================================
-- Bug 33 fix — UNIQUE (evaluacion_id, pregunta) en preguntas
-- =============================================================
-- Causa: setup.sql invocaba 2 seeds con overlap de banco preguntas
-- universales (250 + 265, 221 en común). Sin esta UNIQUE, el
-- ON CONFLICT del seed canónico era letra muerta → duplicación 2x.
-- Idempotente: solo crea si no existe.
-- =============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'preguntas_evaluacion_pregunta_unique'
  ) THEN
    ALTER TABLE public.preguntas
      ADD CONSTRAINT preguntas_evaluacion_pregunta_unique
      UNIQUE (evaluacion_id, pregunta);
  END IF;
END $$;

-- =============================================================
-- MÓDULO DE PAGOS — Panel Admin Unificado (Fase 1)
-- =============================================================
-- Registro manual de pagos por Control Escolar (admin) dentro de
-- Plataforma Virtual. Sustituye al Sistema de Control Escolar para
-- clientes nuevos. Idempotente: IF NOT EXISTS / DROP POLICY IF EXISTS.
--
-- RLS base: admin gestiona todo vía es_admin(); alumno solo SELECT de
-- sus propios pagos (alumnos.id = usuarios.id = auth.uid()). El bloque
-- ROL SECRETARIO (más abajo) reemplaza estas policies por la versión
-- separada por operación con es_staff() para SELECT/INSERT.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pagos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id        UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  monto            NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  concepto         TEXT NOT NULL DEFAULT 'mensualidad',
    -- 'inscripcion' | 'mensualidad' | 'otro'
  mes_desbloqueado INTEGER CHECK (mes_desbloqueado IS NULL OR mes_desbloqueado > 0),
    -- NULL si concepto = 'inscripcion' u 'otro'
  metodo_pago      TEXT NOT NULL,
    -- 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'OTRO'
  referencia       TEXT,
  fecha_pago       DATE NOT NULL DEFAULT CURRENT_DATE,
    -- fecha real del pago (editable por el admin; puede ser retroactiva)
  registrado_por   UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Moneda REAL de este pago (ISO 4217) y tipo de cambio vigente el día que se
  -- registró. Con el default 'MXN' una escuela en pesos se comporta igual que
  -- antes de #198. El tipo de cambio se guarda POR PAGO para que actualizarlo
  -- desde el panel no reescriba los recibos ya emitidos. Ver la migración
  -- 20260910120000_moneda_pago.sql (retrofit de clientes ya desplegados).
  moneda               TEXT NOT NULL DEFAULT 'MXN' CHECK (moneda ~ '^[A-Z]{3}$'),
  tipo_cambio_aplicado NUMERIC(10,4) CHECK (tipo_cambio_aplicado IS NULL OR tipo_cambio_aplicado > 0)
);

CREATE INDEX IF NOT EXISTS idx_pagos_alumno     ON public.pagos (alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_created_at ON public.pagos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON public.pagos (fecha_pago DESC);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos: ver propios" ON public.pagos;
CREATE POLICY "pagos: ver propios" ON public.pagos FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_admin()));

DROP POLICY IF EXISTS "pagos: admin gestiona" ON public.pagos;
CREATE POLICY "pagos: admin gestiona" ON public.pagos USING (public.es_admin()) WITH CHECK (public.es_admin());

-- =============================================================
-- ROL SECRETARIO — ajuste condicional de policies de pagos
-- =============================================================
-- Con la tabla pagos ya creada arriba, separa la policy ALL de admin
-- en policies por operación:
--   SELECT/INSERT → es_staff()   (secretario consulta y registra)
--   UPDATE/DELETE → es_admin()   (el secretario NO edita ni borra)
-- Idempotente; el to_regclass() lo mantiene seguro también en BDs
-- donde el módulo de pagos aún no se aplica.
-- =============================================================
DO $$
BEGIN
  IF to_regclass('public.pagos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "pagos: ver propios"     ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin gestiona"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: staff registra"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin actualiza" ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin elimina"   ON public.pagos;

    CREATE POLICY "pagos: ver propios" ON public.pagos
      FOR SELECT USING (((alumno_id = auth.uid()) OR public.es_staff()));

    CREATE POLICY "pagos: staff registra" ON public.pagos
      FOR INSERT WITH CHECK (public.es_staff());

    CREATE POLICY "pagos: admin actualiza" ON public.pagos
      FOR UPDATE USING (public.es_admin()) WITH CHECK (public.es_admin());

    CREATE POLICY "pagos: admin elimina" ON public.pagos
      FOR DELETE USING (public.es_admin());
  END IF;
END $$;

-- =============================================================
-- ESTADO DE CUENTA — vista agregada de pagos por alumno (Fase 5)
-- =============================================================
-- Para /admin/estado-cuenta (staff). Reporta HECHOS, no conclusiones:
-- "meses_sin_pago_registrado" = meses desbloqueados sin pago de
-- mensualidad capturado (puede ser pago no capturado, cortesía o error).
-- inscripcion_pagada viene de la columna existente (fuente de verdad).
-- =============================================================

-- ⚠️ B6 REEMPLAZA ESTA FUNCIÓN cuando el cliente tiene el módulo de Cursos.
-- La versión de B6 (supabase/migrations/20260730160000_b6_reportes_por_vertical.sql)
-- filtra `fecha_ultimo_pago` a los pagos del PROGRAMA con
-- `WHERE p.curso_inscripcion_id IS NULL`, para que el estado de cuenta no diga
-- «Último pago: hoy» por un diplomado en la misma fila que dice «meses sin pago».
--
-- Esa versión NO puede vivir aquí: `pagos.curso_inscripcion_id` la crea B1, que
-- es parte del módulo opcional de Cursos (ver MÓDULOS OPCIONALES al final), y
-- este archivo "debe poder correrse solo". Postgres valida el cuerpo de una
-- función SQL al crearla, así que copiar la versión de B6 aquí aborta schema.sql
-- con "column p.curso_inscripcion_id does not exist" en todo cliente que no
-- contrate Cursos. Verificado sobre una base limpia, no supuesto.
--
-- Orden real en un cliente CON cursos: schema.sql (esta versión) →
-- migracion-cursos-diplomados.sql → B1 → … → B6 (la reemplaza). Sin cursos,
-- esta versión es la correcta y definitiva: no hay pagos de curso que separar.
CREATE OR REPLACE FUNCTION public.estado_cuenta_alumnos()
RETURNS TABLE (
  alumno_id uuid,
  nombre text,
  apellidos text,
  email text,
  matricula text,
  nivel text,
  modalidad text,
  meses_desbloqueados integer,
  meses_con_pago integer,
  meses_sin_pago_registrado integer,
  inscripcion_pagada boolean,
  fecha_ultimo_pago timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT a.id,
         u.nombre,
         u.apellidos,
         u.email,
         a.matricula,
         a.nivel,
         a.modalidad,
         a.meses_desbloqueados,
         COALESCE(mp.meses_con_pago, 0)::integer,
         GREATEST(a.meses_desbloqueados - COALESCE(mp.meses_con_pago, 0), 0)::integer,
         a.inscripcion_pagada,
         up.fecha_ultimo_pago
    FROM public.alumnos a
    JOIN public.usuarios u ON u.id = a.id
    LEFT JOIN (
      SELECT p.alumno_id, COUNT(DISTINCT p.mes_desbloqueado)::integer AS meses_con_pago
        FROM public.pagos p
       WHERE p.concepto = 'mensualidad'
       GROUP BY p.alumno_id
    ) mp ON mp.alumno_id = a.id
    LEFT JOIN (
      SELECT p.alumno_id, MAX(p.fecha_pago)::timestamptz AS fecha_ultimo_pago
        FROM public.pagos p
       GROUP BY p.alumno_id
    ) up ON up.alumno_id = a.id
   WHERE a.activo = true
     -- B7/T4: fuera los alumnos que solo cursan diplomados. No tienen
     -- obligaciones del PROGRAMA, así que salían con «Al corriente» y
     -- «Sin pagos registrados» — datos ciertos, fila que no debería existir.
     -- El alumno HÍBRIDO (nivel de programa + inscrito a un diplomado) SIGUE
     -- apareciendo: su fila del programa es legítima.
     --
     -- Este filtro SÍ vive en el schema base, a diferencia de los de B6:
     -- `alumnos.nivel` es una columna del base y su CHECK ya admite
     -- 'diplomado' (alumnos_nivel_check). No depende del módulo opcional de
     -- Cursos, así que este archivo sigue pudiendo correrse solo. Verificado
     -- sobre una base limpia.
     --
     -- `IS DISTINCT FROM` y no `<>`: `nivel` es nullable y con `<>` una fila
     -- con NULL daría NULL, el WHERE la tomaría como falsa y el alumno sin
     -- nivel DESAPARECERÍA del reporte — justo al que hay que ver para notar
     -- que le falta el dato.
     AND a.nivel IS DISTINCT FROM 'diplomado'
   ORDER BY u.nombre, u.apellidos;
$$;
-- REPORTES DE INGRESOS — agregación por semana y mes (Fase 4)
-- =============================================================
-- Para /admin/reportes (admin-only vía API). GROUP BY date_trunc en
-- America/Mexico_City, semana ISO (lunes), rellena periodos sin pagos
-- con 0. SECURITY INVOKER: con service role ve todo; un alumno directo
-- solo agregaría sus propios pagos (RLS).
-- =============================================================

-- ⚠️ B6 REEMPLAZA ESTAS DOS FUNCIONES cuando el cliente tiene Cursos: agrega
-- las columnas `programa` y `cursos` al RETURNS TABLE para desglosar el ingreso
-- por vertical. `total` se conserva idéntico, así que quien ya lo lee no se
-- entera. Igual que arriba, la versión de B6 depende de
-- `pagos.curso_inscripcion_id` (módulo opcional) y no puede vivir en el schema
-- base. Nota para quien migre: B6 usa DROP + CREATE, no CREATE OR REPLACE,
-- porque Postgres no deja cambiar el tipo de retorno de una función existente —
-- y el DROP se lleva los grants, que B6 re-aplica.
CREATE OR REPLACE FUNCTION public.reporte_ingresos_semanales(num_semanas integer DEFAULT 8)
RETURNS TABLE (semana_inicio date, total numeric)
LANGUAGE sql STABLE
AS $$
  WITH semanas AS (
    SELECT generate_series(
      date_trunc('week', (now() AT TIME ZONE 'America/Mexico_City')) - make_interval(weeks => num_semanas - 1),
      date_trunc('week', (now() AT TIME ZONE 'America/Mexico_City')),
      interval '1 week'
    ) AS inicio
  )
  SELECT s.inicio::date AS semana_inicio,
         COALESCE(SUM(p.monto), 0)::numeric AS total
    FROM semanas s
    LEFT JOIN public.pagos p
      ON date_trunc('week', p.fecha_pago) = s.inicio
   GROUP BY s.inicio
   ORDER BY s.inicio;
$$;

CREATE OR REPLACE FUNCTION public.reporte_ingresos_mensuales(num_meses integer DEFAULT 6)
RETURNS TABLE (mes text, total numeric)
LANGUAGE sql STABLE
AS $$
  WITH meses AS (
    SELECT generate_series(
      date_trunc('month', (now() AT TIME ZONE 'America/Mexico_City')) - make_interval(months => num_meses - 1),
      date_trunc('month', (now() AT TIME ZONE 'America/Mexico_City')),
      interval '1 month'
    ) AS inicio
  )
  SELECT to_char(m.inicio, 'YYYY-MM') AS mes,
         COALESCE(SUM(p.monto), 0)::numeric AS total
    FROM meses m
    LEFT JOIN public.pagos p
      ON date_trunc('month', p.fecha_pago) = m.inicio
   GROUP BY m.inicio
   ORDER BY m.inicio;
$$;
-- Bug 52 — Cerrar escalada de privilegios de rol (usuarios/alumnos)
-- =============================================================
-- SÍNTOMA: un alumno autenticado se vuelve admin desde el navegador:
--   supabase.from('usuarios').update({ rol: 'admin' }).eq('id', suId)
-- CAUSA: Supabase otorga UPDATE de TABLA a `authenticated` sobre las
--   tablas de public (default privileges) y la policy RLS de UPDATE de
--   usuarios ("actualizar propio perfil") solo exige USING (id = auth.uid())
--   SIN WITH CHECK ni restricción de columna → el usuario reescribe su
--   propio `rol`. Este fix opera a nivel de GRANT de columna (capa
--   ortogonal a RLS): sin privilegio sobre `rol`, el UPDATE falla con 42501.
-- SEGURO: ningún flujo legítimo escribe usuarios/alumnos con la sesión del
--   usuario — perfil (SELECT), avatar/registro y panel admin usan
--   service_role. Se re-otorga UPDATE solo sobre columnas de perfil.
-- Retrofit de clientes ya desplegados: scripts/fix-escalada-rol.sql.
-- =============================================================
REVOKE UPDATE ON public.usuarios FROM anon, authenticated;
REVOKE UPDATE (id, email, rol, created_at) ON public.usuarios FROM anon, authenticated;
GRANT  UPDATE (nombre, apellidos, telefono, foto_url) ON public.usuarios TO authenticated;
REVOKE UPDATE ON public.alumnos  FROM anon, authenticated;

-- =============================================================
-- REVOKE EXECUTE — funciones de reporte solo vía service_role (Fase 4/5 hardening)
-- =============================================================
-- reporte_ingresos_* y estado_cuenta_alumnos son SECURITY INVOKER y el default
-- de Postgres otorga EXECUTE a PUBLIC (anon+authenticated). La RLS ya impide que
-- un alumno vea datos ajenos al invocarlas, pero como TODO acceso legítimo pasa
-- por /api/admin/* con service_role, se cierra el vector de defensa en profundidad:
-- si alguna función pasara a SECURITY DEFINER, el EXECUTE abierto sería fuga
-- inmediata. En Supabase las funciones reciben EXECUTE DIRECTO a anon/
-- authenticated vía ALTER DEFAULT PRIVILEGES (no solo vía PUBLIC), así que el
-- REVOKE debe nombrar los tres; luego se re-otorga solo a service_role.
-- =============================================================
REVOKE EXECUTE ON FUNCTION public.reporte_ingresos_semanales(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reporte_ingresos_mensuales(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.estado_cuenta_alumnos()             FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.reporte_ingresos_semanales(integer) TO service_role;
GRANT  EXECUTE ON FUNCTION public.reporte_ingresos_mensuales(integer) TO service_role;
GRANT  EXECUTE ON FUNCTION public.estado_cuenta_alumnos()             TO service_role;

-- =============================================================
-- KEEP-ALIVE HEARTBEAT (Bug 46 / regla 9)
-- =============================================================
-- Tabla minima usada por el latido central para generar actividad REAL de DB:
-- los GET con anon responden 200 pero NO cuentan como actividad y Supabase
-- free pausa a 7 dias. Sin esta tabla el POST del latido devuelve 404 y el
-- proyecto termina pausado — es el modo de fallo del incidente del 30-jul, y
-- ya mordio a Habsburgo y kas-kloud (combos nuevos nacian sin ella porque
-- solo vivia en supabase/schema.sql, que el onboarding no ejecuta).
-- RLS: anon SOLO puede INSERT. Sin SELECT/UPDATE/DELETE.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.keep_alive_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  -- Quien mando el latido ("central-YYYY-MM-DD", "rescate-manual-..."). Nullable:
  -- el INSERT `{}` del workflow per-repo legacy sigue siendo valido.
  source text
);

ALTER TABLE public.keep_alive_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.keep_alive_log FROM anon;

DROP POLICY IF EXISTS keep_alive_anon_insert ON public.keep_alive_log;
CREATE POLICY keep_alive_anon_insert ON public.keep_alive_log
  FOR INSERT TO anon WITH CHECK (true);

GRANT INSERT ON public.keep_alive_log TO anon;

-- =============================================================
-- TRIGGER trg_new_user (parte del efecto S1)
-- =============================================================
-- Crea la fila de public.usuarios al registrarse (con handle_new_user ya
-- endurecido: rol fijo 'alumno'). Re-crearlo es inocuo si ya existe y repara
-- el caso del cliente al que le falte — mismo racional de fix_s1.
DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- CORREGIR PLAN DE ESTUDIO — bitácora + candados + corrección
-- =============================================================
-- Espejo de supabase/migrations/20260817120000_corregir_plan_estudio.sql.
-- ⚠️ ESTE archivo (scripts/schema.sql) es el que instala mev-onboarding.py en
-- los combos nuevos: una migración que solo se refleje en supabase/schema.sql
-- nace ausente en todo cliente nuevo y el botón "Corregir plan de estudio"
-- jamás aparece (la ficha degrada a plan_correccion = null, sin error visible).
--
-- Corrección de CAPTURA del alta (nivel/carrera/modalidad), solo si el alumno
-- no ha comenzado: seis candados (pagos+inscripción, meses, calificaciones,
-- progreso, intentos, quiz — los cuatro de contenido excluyendo materias
-- TUTORIAL vía es_materia_tutorial()). La matrícula no se regenera. Las notas
-- del alumno se borran en la misma transacción y su conteo queda en bitácora.

CREATE TABLE IF NOT EXISTS public.alumno_plan_eventos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id          UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  tipo               TEXT        NOT NULL DEFAULT 'correccion_plan'
                                 CHECK (tipo IN ('correccion_plan')),
  nivel_antes        TEXT,
  carrera_antes      TEXT,
  modalidad_antes    TEXT,
  nivel_despues      TEXT,
  carrera_despues    TEXT,
  modalidad_despues  TEXT,
  notas_borradas     INTEGER     NOT NULL DEFAULT 0,
  detalle            JSONB,
  -- Actor como PARÁMETRO desde el servidor, no auth.uid(): la función corre
  -- con service_role, donde auth.uid() es NULL (Bug 83).
  actor              UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumno_plan_eventos_alumno
  ON public.alumno_plan_eventos (alumno_id, created_at DESC);

-- Solo admin lee; nadie escribe por PostgREST (sin política de INSERT los
-- eventos solo los fabrica la función SECURITY DEFINER, que salta la RLS).
ALTER TABLE public.alumno_plan_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alumno_plan_eventos: solo admin lee" ON public.alumno_plan_eventos;
CREATE POLICY "alumno_plan_eventos: solo admin lee" ON public.alumno_plan_eventos
  FOR SELECT TO authenticated
  USING (public.es_admin());

DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT SELECT ON public.alumno_plan_eventos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT ALL ON public.alumno_plan_eventos TO service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.alumno_plan_eventos FROM anon';
  END IF;
END
$g$;

-- ⚠️ es_materia_tutorial() debe mantenerse en sincronía con esTutorial()
-- (acceso-materias.ts:95-97) — si cambia uno, cambia el otro. COALESCE a
-- false: ante NULL la materia NO se da por tutorial y la fila bloquea.
CREATE OR REPLACE FUNCTION public.es_materia_tutorial(p_nivel TEXT, p_nombre TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_nivel = 'demo', false)
      OR COALESCE(p_nombre ILIKE '%tutor%', false);
$$;

-- Devuelve NULL si los seis candados están en cero, o el código del primero
-- que bloquea. Única fuente de verdad: la lee el GET de la ficha y la
-- re-ejecuta corregir_plan_estudio() dentro de su transacción. Los JOIN a
-- materias son LEFT: si el encadenamiento se rompe, es_materia_tutorial
-- recibe NULL, devuelve false y la fila bloquea (dirección segura).
CREATE OR REPLACE FUNCTION public.candado_corregir_plan(p_alumno UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_meses INTEGER;
  v_inscripcion BOOLEAN;
BEGIN
  SELECT meses_desbloqueados, inscripcion_pagada
    INTO v_meses, v_inscripcion
    FROM public.alumnos WHERE id = p_alumno;
  IF NOT FOUND THEN
    RETURN 'no_existe';
  END IF;

  IF COALESCE(v_inscripcion, false)
     OR EXISTS (SELECT 1 FROM public.pagos WHERE alumno_id = p_alumno) THEN
    RETURN 'pagos';
  END IF;

  IF COALESCE(v_meses, 0) <> 0 THEN
    RETURN 'meses_desbloqueados';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.calificaciones c
      LEFT JOIN public.materias m ON m.id = c.materia_id
     WHERE c.alumno_id = p_alumno
       AND NOT public.es_materia_tutorial(m.nivel, m.nombre)
  ) THEN
    RETURN 'calificaciones';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.progreso_semanas ps
      LEFT JOIN public.semanas         s  ON s.id  = ps.semana_id
      LEFT JOIN public.meses_contenido mc ON mc.id = s.mes_id
      LEFT JOIN public.materias        m  ON m.id  = mc.materia_id
     WHERE ps.alumno_id = p_alumno
       AND NOT public.es_materia_tutorial(m.nivel, m.nombre)
  ) THEN
    RETURN 'progreso';
  END IF;

  -- Un intento reprobado no deja calificación ni progreso: sin este candado
  -- pasaría los cuatro originales.
  IF EXISTS (
    SELECT 1
      FROM public.intentos_evaluacion ie
      LEFT JOIN public.evaluaciones e ON e.id = ie.evaluacion_id
      LEFT JOIN public.materias     m ON m.id = e.materia_id
     WHERE ie.alumno_id = p_alumno
       AND NOT public.es_materia_tutorial(m.nivel, m.nombre)
  ) THEN
    RETURN 'intentos';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.quiz_respuestas qr
      LEFT JOIN public.quiz_semana     qs ON qs.id = qr.quiz_id
      LEFT JOIN public.semanas         s  ON s.id  = qs.semana_id
      LEFT JOIN public.meses_contenido mc ON mc.id = s.mes_id
      LEFT JOIN public.materias        m  ON m.id  = mc.materia_id
     WHERE qr.alumno_id = p_alumno
       AND NOT public.es_materia_tutorial(m.nivel, m.nombre)
  ) THEN
    RETURN 'quiz';
  END IF;

  RETURN NULL;
END;
$$;

-- Todo o nada, en UNA transacción: candados → borrar notas → UPDATE del plan →
-- evento de bitácora. Si un candado bloquea devuelve {ok:false, candado} sin
-- haber escrito nada. La matrícula NO se toca.
CREATE OR REPLACE FUNCTION public.corregir_plan_estudio(
  p_alumno    UUID,
  p_nivel     TEXT,
  p_carrera   TEXT,
  p_modalidad TEXT,
  p_actor     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_antes   RECORD;
  v_candado TEXT;
  v_notas   INTEGER := 0;
BEGIN
  SELECT id, matricula, nivel, carrera, modalidad
    INTO v_antes
    FROM public.alumnos
   WHERE id = p_alumno
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'candado', 'no_existe');
  END IF;

  v_candado := public.candado_corregir_plan(p_alumno);
  IF v_candado IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'candado', v_candado);
  END IF;

  WITH borradas AS (
    DELETE FROM public.notas_alumno WHERE alumno_id = p_alumno RETURNING id
  )
  SELECT COUNT(*) INTO v_notas FROM borradas;

  UPDATE public.alumnos
     SET nivel     = p_nivel,
         carrera   = p_carrera,
         modalidad = p_modalidad
   WHERE id = p_alumno;

  INSERT INTO public.alumno_plan_eventos
    (alumno_id, tipo, nivel_antes, carrera_antes, modalidad_antes,
     nivel_despues, carrera_despues, modalidad_despues, notas_borradas, actor)
  VALUES
    (p_alumno, 'correccion_plan', v_antes.nivel, v_antes.carrera, v_antes.modalidad,
     p_nivel, p_carrera, p_modalidad, v_notas, p_actor);

  RETURN jsonb_build_object(
    'ok', true,
    'matricula', v_antes.matricula,
    'notas_borradas', v_notas,
    'antes',   jsonb_build_object('nivel', v_antes.nivel, 'carrera', v_antes.carrera, 'modalidad', v_antes.modalidad),
    'despues', jsonb_build_object('nivel', p_nivel, 'carrera', p_carrera, 'modalidad', p_modalidad)
  );
END;
$$;

-- SECURITY DEFINER + EXECUTE abierto sería fuga inmediata (mismo racional del
-- bloque REVOKE de arriba y Bug 77: nombrar los tres roles).
REVOKE EXECUTE ON FUNCTION public.candado_corregir_plan(uuid)                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.corregir_plan_estudio(uuid, text, text, text, uuid)  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.candado_corregir_plan(uuid)                          TO service_role;
GRANT  EXECUTE ON FUNCTION public.corregir_plan_estudio(uuid, text, text, text, uuid)  TO service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- PERIODICIDAD SEMANAL (reflejo de supabase/migrations/20260910130000_periodicidad_semanal.sql)
--
-- Va aquí porque este archivo es el que instala a un CLIENTE NUEVO: sin este
-- bloque, un combo recién aprovisionado nace sin la tabla del calendario y su
-- primer alumno de una escuela semanal no tendría dónde cobrarse. Lo vigila
-- tests/unit/guardian-schema-onboarding.spec.ts.
--
-- INERTE en una escuela mensual (el default): la tabla queda vacía y ninguna
-- de estas funciones se invoca.
--
-- Va AL FINAL porque referencia public.alumnos, public.pagos, public.ajustes y
-- public.es_staff(), que se crean más arriba.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. pagos: la semana que cubre este pago ─────────────────────────────────
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS numero_semana INTEGER
  CHECK (numero_semana IS NULL OR numero_semana > 0);

COMMENT ON COLUMN public.pagos.numero_semana IS
  'Semana del calendario que cubre este pago (concepto cuota_semanal). NULL en todos los demás conceptos.';

CREATE INDEX IF NOT EXISTS idx_pagos_alumno_semana
  ON public.pagos (alumno_id, numero_semana);

-- ── 2. calendario_pagos: una fila por semana por alumno ─────────────────────
CREATE TABLE IF NOT EXISTS public.calendario_pagos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id         UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  numero_semana     INTEGER NOT NULL CHECK (numero_semana > 0),
  total_semanas     INTEGER NOT NULL CHECK (total_semanas > 0),
  fecha_vencimiento DATE NOT NULL,
  -- El monto se CONGELA al generar el calendario. Si el admin sube la cuota
  -- desde "Personalizar mi página", las semanas ya generadas conservan la suya:
  -- el alumno se inscribió a un precio y un cambio de tarifa no reescribe deuda
  -- ya firmada. La cuota nueva rige para quien se inscriba después.
  monto             NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  -- 'vencido' se DERIVA (pendiente + fecha_vencimiento < hoy); no se persiste,
  -- así no hace falta un cron y nunca queda desactualizado.
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'condonado')),
  pago_id           UUID REFERENCES public.pagos(id) ON DELETE SET NULL,
  condonado_por     UUID REFERENCES auth.users(id),
  condonado_motivo  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT calendario_pagos_alumno_semana_key UNIQUE (alumno_id, numero_semana)
);

COMMENT ON TABLE public.calendario_pagos IS
  'Calendario de cuotas semanales por alumno. Vacía en las escuelas de cobro mensual (periodicidad por default).';

CREATE INDEX IF NOT EXISTS idx_calendario_pagos_alumno
  ON public.calendario_pagos (alumno_id, numero_semana);
CREATE INDEX IF NOT EXISTS idx_calendario_pagos_pendientes
  ON public.calendario_pagos (fecha_vencimiento) WHERE estado = 'pendiente';

ALTER TABLE public.calendario_pagos ENABLE ROW LEVEL SECURITY;

-- Lectura: el alumno ve SOLO su calendario; el staff ve todos. Sin
-- autorreferencia en el USING (Bug 16): es_staff() es SECURITY DEFINER STABLE.
DROP POLICY IF EXISTS "calendario_pagos: ver propio" ON public.calendario_pagos;
CREATE POLICY "calendario_pagos: ver propio" ON public.calendario_pagos
  FOR SELECT USING (alumno_id = auth.uid() OR public.es_staff());

-- Escritura: NADIE con sesión de usuario. Solo las funciones SECURITY DEFINER
-- de abajo (con guardia de rol) y el service_role del servidor.
REVOKE ALL    ON public.calendario_pagos FROM anon;
-- TRUNCATE entra en el GRANT ALL de fábrica de Supabase y NO respeta RLS.
-- PostgREST no lo expone, pero se revoca igual: vaciar esta tabla borraría el
-- calendario de cobro de toda la escuela.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.calendario_pagos FROM authenticated;
GRANT  SELECT ON public.calendario_pagos TO authenticated;
GRANT  ALL    ON public.calendario_pagos TO service_role;

-- ⚠️ Este bloque debe correr DESPUÉS de los GRANT genéricos del esquema. Si se
-- recrea `public` (scripts/schema.sql trae CREATE SCHEMA sin IF NOT EXISTS, así
-- que obliga a un DROP SCHEMA previo), hay que restaurar antes los privilegios
-- de fábrica de Supabase o la aplicación entera responde "permission denied":
-- esta plantilla protege con RLS, no quitando privilegios.

-- ── 3. Guardia común: ¿quién puede escribir el calendario? ──────────────────
-- Permitido: (a) el service_role del servidor, (b) un usuario con rol
-- admin/secretario, (c) una conexión directa a la BD (psql como postgres, sin
-- claims de PostgREST). Un ALUMNO autenticado recibe 42501: estas funciones son
-- SECURITY DEFINER y sin esta guardia podría reescribir los pagos de otro.
CREATE OR REPLACE FUNCTION public.calendario_pagos_autorizado()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claims text := current_setting('request.jwt.claims', true);
  v_role   text;
BEGIN
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN TRUE;                              -- conexión directa (psql / migraciones)
  END IF;
  v_role := (v_claims::jsonb ->> 'role');
  IF v_role = 'service_role' THEN RETURN TRUE; END IF;
  RETURN public.es_staff();
END;
$$;
REVOKE ALL ON FUNCTION public.calendario_pagos_autorizado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calendario_pagos_autorizado() TO authenticated, service_role;

-- ── 4. generar_calendario_pagos(): N semanas desde la fecha de inicio ───────
--
-- ⚠️ ESTA FIRMA RECIBE EL PLAN, y eso es DELIBERADO: es la del ALTA MANUAL, la
-- que usa el admin para un alumno con un plan a medida que no está en el
-- catálogo (CAU #200 gestiona así sus planes de 2 y 4 meses). El admin teclea
-- las semanas y la cuota porque ese es justo el caso de uso.
--
-- 🛑 El flujo AUTOMÁTICO del registro NO debe usar esta: usa
-- generar_calendario_por_nivel(), que no recibe cifras. Ver el aviso de ahí.
--
-- Regenerable: borra las semanas PENDIENTES y VENCIDAS y las vuelve a crear con
-- las fechas nuevas; las pagadas o condonadas se conservan tal cual.
CREATE OR REPLACE FUNCTION public.generar_calendario_pagos(
  p_alumno_id    UUID,
  p_semanas      INTEGER,
  p_cuota        NUMERIC,
  p_fecha_inicio DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_i     INTEGER;
  v_total INTEGER;
BEGIN
  IF NOT public.calendario_pagos_autorizado() THEN
    RAISE EXCEPTION 'permiso denegado: solo el personal administrativo genera calendarios'
      USING ERRCODE = '42501';
  END IF;
  IF p_alumno_id IS NULL THEN
    RAISE EXCEPTION 'alumno_id requerido';
  END IF;
  IF p_semanas IS NULL OR p_semanas < 1 OR p_semanas > 104 THEN
    RAISE EXCEPTION 'semanas fuera de rango: % (1..104)', p_semanas;
  END IF;
  IF p_cuota IS NULL OR p_cuota <= 0 THEN
    RAISE EXCEPTION 'cuota semanal inválida: %', p_cuota;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.alumnos WHERE id = p_alumno_id) THEN
    RAISE EXCEPTION 'Alumno % no encontrado', p_alumno_id;
  END IF;

  DELETE FROM public.calendario_pagos
   WHERE alumno_id = p_alumno_id
     AND estado IN ('pendiente', 'vencido');

  FOR v_i IN 1..p_semanas LOOP
    INSERT INTO public.calendario_pagos
      (alumno_id, numero_semana, total_semanas, fecha_vencimiento, monto, estado)
    VALUES
      (p_alumno_id, v_i, p_semanas, p_fecha_inicio + ((v_i - 1) * 7), p_cuota, 'pendiente')
    ON CONFLICT (alumno_id, numero_semana) DO UPDATE
      SET total_semanas = EXCLUDED.total_semanas,   -- semanas ya pagadas: solo se alinea el total
          updated_at    = NOW();
  END LOOP;

  -- Semanas pagadas/condonadas por encima del nuevo total se conservan: son
  -- dinero real. Solo se ajusta el total para el resumen.
  UPDATE public.calendario_pagos
     SET total_semanas = GREATEST(p_semanas, numero_semana), updated_at = NOW()
   WHERE alumno_id = p_alumno_id AND numero_semana > p_semanas;

  SELECT COUNT(*) INTO v_total FROM public.calendario_pagos WHERE alumno_id = p_alumno_id;
  RETURN v_total;
END;
$function$;

REVOKE ALL ON FUNCTION public.generar_calendario_pagos(UUID, INTEGER, NUMERIC, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generar_calendario_pagos(UUID, INTEGER, NUMERIC, DATE) TO authenticated, service_role;

-- ── 4b. generar_calendario_por_nivel(): el plan lo decide la BD ─────────────
--
-- 🛑 NO RECIBE EL PLAN, y esa es toda la razón de que exista. Lee el NIVEL REAL
-- del alumno en `alumnos` y saca las semanas y la cuota de `public.ajustes`.
--
-- ⚠️ POR QUÉ. En EDUHCO #197 una primera versión SÍ los recibía como argumentos
-- (validando el nivel, pero confiando en las cifras). Una llamada con los
-- valores cruzados le generó a un alumno de preparatoria un calendario de 12
-- semanas en vez de 24 —$3,000 menos— SIN NINGÚN ERROR. La guardia de rol
-- impedía que lo hiciera un alumno, no que lo hiciera un servidor mal
-- configurado. Con el plan en la BD no hay parámetro que falsificar.
--
-- Y por eso la firma vieja se ELIMINA abajo en vez de dejarla obsoleta:
-- mientras exista, sigue siendo invocable.
--
-- `ajustes` es el mismo puente config.ts → BD que ya usa el prefijo de
-- matrícula. La fuente de verdad sigue siendo `src/lib/config.ts`;
-- `sincronizarPlanSemanal()` lo refleja aquí antes de cada alta.
--
-- 🛑 Aquí NO se siembra ningún plan de fábrica. Un valor por defecto sería el
-- plan de OTRA escuela: si la sincronización no ha corrido, esto debe fallar
-- ruidosamente, no cobrar cifras inventadas.
DROP FUNCTION IF EXISTS public.generar_calendario_por_nivel(UUID, INTEGER, NUMERIC, INTEGER, NUMERIC, DATE);

CREATE OR REPLACE FUNCTION public.generar_calendario_por_nivel(
  p_alumno_id    UUID,
  p_fecha_inicio DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_nivel   TEXT;
  v_semanas INTEGER;
  v_cuota   NUMERIC;
BEGIN
  IF NOT public.calendario_pagos_autorizado() THEN
    RAISE EXCEPTION 'permiso denegado: solo el personal administrativo genera calendarios'
      USING ERRCODE = '42501';
  END IF;

  SELECT nivel INTO v_nivel FROM public.alumnos WHERE id = p_alumno_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumno % no encontrado', p_alumno_id;
  END IF;
  IF v_nivel IS NULL OR btrim(v_nivel) = '' THEN
    RETURN 0;                     -- alumno solo de curso: no lleva calendario
  END IF;

  -- Clave por nivel, no un IF/ELSIF cerrado: una escuela que mañana venda
  -- 'bachillerato' no obliga a tocar este SQL.
  SELECT valor::INTEGER INTO v_semanas
    FROM public.ajustes WHERE clave = 'plan_semanas_' || v_nivel;
  SELECT valor::NUMERIC INTO v_cuota
    FROM public.ajustes WHERE clave = 'plan_cuota_' || v_nivel;

  -- Sin plan declarado para este nivel NO es un error: es un nivel que no lleva
  -- calendario semanal (licenciatura y diplomado no lo llevan ni en las
  -- escuelas semanales). Devolver 0 y seguir.
  IF v_semanas IS NULL AND v_cuota IS NULL THEN
    RETURN 0;
  END IF;

  -- Media configuración SÍ es un error: alguien sincronizó a medias y el alumno
  -- se quedaría sin calendario o con uno gratis, en silencio.
  IF v_semanas IS NULL OR v_cuota IS NULL THEN
    RAISE EXCEPTION 'El plan semanal de % está incompleto en public.ajustes (semanas=%, cuota=%)',
      v_nivel, v_semanas, v_cuota;
  END IF;

  RETURN public.generar_calendario_pagos(p_alumno_id, v_semanas, v_cuota, p_fecha_inicio);
END;
$function$;

REVOKE ALL ON FUNCTION public.generar_calendario_por_nivel(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generar_calendario_por_nivel(UUID, DATE) TO authenticated, service_role;

-- ── 5. registrar_cuota_semanal(): cobra UNA semana (pago real + calendario) ─
-- `p_moneda` y `p_tipo_cambio` los pasa el servidor SOLO si la escuela no cobra
-- en pesos, igual que hace /api/admin/pagos: con NULL la fila toma el default
-- 'MXN' de la tabla y el recibo sale como en toda la flota.
CREATE OR REPLACE FUNCTION public.registrar_cuota_semanal(
  p_alumno_id      UUID,
  p_numero_semana  INTEGER,
  p_metodo_pago    TEXT,
  p_registrado_por UUID,
  p_referencia     TEXT DEFAULT NULL,
  p_fecha_pago     DATE DEFAULT CURRENT_DATE,
  p_monto          NUMERIC DEFAULT NULL,
  p_moneda         TEXT DEFAULT NULL,
  p_tipo_cambio    NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_cal   public.calendario_pagos%ROWTYPE;
  v_pago  UUID;
BEGIN
  IF NOT public.calendario_pagos_autorizado() THEN
    RAISE EXCEPTION 'permiso denegado: solo el personal administrativo registra cuotas'
      USING ERRCODE = '42501';
  END IF;
  IF p_metodo_pago IS NULL OR upper(p_metodo_pago) NOT IN ('EFECTIVO','TRANSFERENCIA','TARJETA','OTRO') THEN
    RAISE EXCEPTION 'Método de pago inválido: %', p_metodo_pago;
  END IF;

  SELECT * INTO v_cal
    FROM public.calendario_pagos
   WHERE alumno_id = p_alumno_id AND numero_semana = p_numero_semana
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La semana % no existe en el calendario de este alumno', p_numero_semana;
  END IF;
  IF v_cal.estado = 'pagado' THEN
    RAISE EXCEPTION 'La semana % ya está pagada', p_numero_semana;
  END IF;

  INSERT INTO public.pagos
    (alumno_id, monto, concepto, numero_semana, metodo_pago, referencia,
     registrado_por, fecha_pago, moneda, tipo_cambio_aplicado)
  VALUES
    (p_alumno_id, COALESCE(p_monto, v_cal.monto), 'cuota_semanal', p_numero_semana,
     upper(p_metodo_pago), NULLIF(btrim(p_referencia), ''), p_registrado_por,
     COALESCE(p_fecha_pago, CURRENT_DATE),
     COALESCE(NULLIF(btrim(p_moneda), ''), 'MXN'), p_tipo_cambio)
  RETURNING id INTO v_pago;

  UPDATE public.calendario_pagos
     SET estado = 'pagado', pago_id = v_pago,
         condonado_por = NULL, condonado_motivo = NULL,
         updated_at = NOW()
   WHERE id = v_cal.id;

  RETURN v_pago;
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_cuota_semanal(UUID, INTEGER, TEXT, UUID, TEXT, DATE, NUMERIC, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_cuota_semanal(UUID, INTEGER, TEXT, UUID, TEXT, DATE, NUMERIC, TEXT, NUMERIC) TO authenticated, service_role;

-- ── 6. condonar_semana(): perdona (o des-perdona) una semana ────────────────
CREATE OR REPLACE FUNCTION public.condonar_semana(
  p_alumno_id     UUID,
  p_numero_semana INTEGER,
  p_actor         UUID,
  p_motivo        TEXT DEFAULT NULL,
  p_condonar      BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_estado TEXT;
BEGIN
  IF NOT public.calendario_pagos_autorizado() THEN
    RAISE EXCEPTION 'permiso denegado' USING ERRCODE = '42501';
  END IF;

  SELECT estado INTO v_estado
    FROM public.calendario_pagos
   WHERE alumno_id = p_alumno_id AND numero_semana = p_numero_semana
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La semana % no existe en el calendario de este alumno', p_numero_semana;
  END IF;
  -- Condonar una semana ya pagada sería borrar dinero que entró: para eso se
  -- borra el pago, y el trigger de abajo devuelve la semana a pendiente.
  IF v_estado = 'pagado' THEN
    RAISE EXCEPTION 'La semana % ya está pagada; no se puede condonar', p_numero_semana;
  END IF;

  IF p_condonar THEN
    UPDATE public.calendario_pagos
       SET estado = 'condonado', condonado_por = p_actor,
           condonado_motivo = NULLIF(btrim(p_motivo), ''), updated_at = NOW()
     WHERE alumno_id = p_alumno_id AND numero_semana = p_numero_semana;
  ELSE
    UPDATE public.calendario_pagos
       SET estado = 'pendiente', condonado_por = NULL, condonado_motivo = NULL, updated_at = NOW()
     WHERE alumno_id = p_alumno_id AND numero_semana = p_numero_semana;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.condonar_semana(UUID, INTEGER, UUID, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.condonar_semana(UUID, INTEGER, UUID, TEXT, BOOLEAN) TO authenticated, service_role;

-- ── 7. Borrar un pago de cuota devuelve la semana a 'pendiente' ─────────────
-- El FK pago_id ya está en NULL cuando corre este trigger (ON DELETE SET NULL
-- actúa antes), así que se localiza por alumno + semana, no por pago_id.
CREATE OR REPLACE FUNCTION public.calendario_pagos_revertir_al_borrar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.concepto = 'cuota_semanal' AND OLD.numero_semana IS NOT NULL THEN
    UPDATE public.calendario_pagos
       SET estado = 'pendiente', pago_id = NULL, updated_at = NOW()
     WHERE alumno_id = OLD.alumno_id
       AND numero_semana = OLD.numero_semana
       AND estado = 'pagado';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_calendario_pagos_revertir ON public.pagos;
CREATE TRIGGER trg_calendario_pagos_revertir
  AFTER DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.calendario_pagos_revertir_al_borrar();

-- ── 8. estado_cuenta_semanal(): resumen por alumno para "Cobranza" ──────────
-- HECHOS, no conclusiones: "vencidas" = semanas pendientes cuya fecha de
-- vencimiento ya pasó. El sistema no distingue un pago sin capturar de una
-- cortesía, así que no dice "moroso": dice cuántas semanas van sin registrar.
--
-- ⚠️ La fecha se toma en America/Mexico_City, no en UTC: a las 18:00 de México
-- ya es el día siguiente en UTC y media escuela aparecería vencida una noche
-- antes de tiempo.
--
-- Devuelve TODOS los alumnos activos del programa, tengan o no calendario: los
-- que no lo tienen son justo a quienes hay que generárselo, y filtrarlos los
-- volvería invisibles en la única pantalla donde se arregla.
DROP FUNCTION IF EXISTS public.estado_cuenta_semanal();
CREATE OR REPLACE FUNCTION public.estado_cuenta_semanal()
RETURNS TABLE (
  alumno_id            uuid,
  nombre               text,
  apellidos            text,
  email                text,
  telefono             text,
  matricula            text,
  nivel                text,
  modalidad            text,
  inscripcion_pagada   boolean,
  semanas_total        integer,
  semanas_pagadas      integer,
  semanas_condonadas   integer,
  semanas_vencidas     integer,
  semanas_pendientes   integer,
  monto_pagado         numeric,
  monto_vencido        numeric,
  saldo_pendiente      numeric,
  proxima_semana       integer,
  proxima_fecha        date,
  fecha_ultimo_pago    date
)
LANGUAGE sql STABLE
SET search_path = public
AS $function$
  WITH hoy AS (
    SELECT (now() AT TIME ZONE 'America/Mexico_City')::date AS d
  ),
  cal AS (
    SELECT c.alumno_id,
           MAX(c.total_semanas)::integer AS semanas_total,
           COUNT(*) FILTER (WHERE c.estado = 'pagado')::integer    AS semanas_pagadas,
           COUNT(*) FILTER (WHERE c.estado = 'condonado')::integer AS semanas_condonadas,
           COUNT(*) FILTER (WHERE c.estado = 'pendiente' AND c.fecha_vencimiento <  hoy.d)::integer AS semanas_vencidas,
           COUNT(*) FILTER (WHERE c.estado = 'pendiente' AND c.fecha_vencimiento >= hoy.d)::integer AS semanas_pendientes,
           COALESCE(SUM(c.monto) FILTER (WHERE c.estado = 'pagado'), 0)::numeric AS monto_pagado,
           COALESCE(SUM(c.monto) FILTER (WHERE c.estado = 'pendiente' AND c.fecha_vencimiento < hoy.d), 0)::numeric AS monto_vencido,
           COALESCE(SUM(c.monto) FILTER (WHERE c.estado = 'pendiente'), 0)::numeric AS saldo_pendiente,
           MIN(c.numero_semana) FILTER (WHERE c.estado = 'pendiente')::integer AS proxima_semana,
           MIN(c.fecha_vencimiento) FILTER (WHERE c.estado = 'pendiente') AS proxima_fecha
      FROM public.calendario_pagos c, hoy
     GROUP BY c.alumno_id
  ),
  up AS (
    -- Último pago DEL PROGRAMA. Los `curso_*` son del módulo de Cursos y un
    -- diplomado recién pagado haría parecer al día a quien debe seis semanas.
    SELECT p.alumno_id, MAX(p.fecha_pago) AS fecha_ultimo_pago
      FROM public.pagos p
     WHERE p.concepto IS NULL OR p.concepto NOT LIKE 'curso%'
     GROUP BY p.alumno_id
  )
  SELECT a.id,
         u.nombre, u.apellidos, u.email, u.telefono,
         a.matricula, a.nivel, a.modalidad, a.inscripcion_pagada,
         COALESCE(cal.semanas_total, 0),
         COALESCE(cal.semanas_pagadas, 0),
         COALESCE(cal.semanas_condonadas, 0),
         COALESCE(cal.semanas_vencidas, 0),
         COALESCE(cal.semanas_pendientes, 0),
         COALESCE(cal.monto_pagado, 0),
         COALESCE(cal.monto_vencido, 0),
         COALESCE(cal.saldo_pendiente, 0),
         cal.proxima_semana,
         cal.proxima_fecha,
         up.fecha_ultimo_pago
    FROM public.alumnos a
    JOIN public.usuarios u ON u.id = a.id
    LEFT JOIN cal ON cal.alumno_id = a.id
    LEFT JOIN up  ON up.alumno_id  = a.id
   WHERE a.activo = true
     -- Un alumno de diplomado no lleva calendario semanal: su ritmo lo fija el
     -- curso. Se excluye por lo que NO es, para no hardcodear la lista de
     -- niveles de una escuela concreta.
     AND a.nivel IS DISTINCT FROM 'diplomado'
   ORDER BY COALESCE(cal.semanas_vencidas, 0) DESC,
            COALESCE(cal.monto_vencido, 0) DESC,
            u.nombre, u.apellidos;
$function$;

-- Solo el servidor: la vista de cobranza es de toda la escuela.
REVOKE EXECUTE ON FUNCTION public.estado_cuenta_semanal() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.estado_cuenta_semanal() TO service_role;

-- ── 9. PostgREST: recargar el schema cache ──────────────────────────────────
-- Sin esto, las RPC nuevas responden PGRST202 ("function not found") hasta que
-- alguien reinicia el proyecto desde el panel de Supabase.
NOTIFY pgrst, 'reload schema';
