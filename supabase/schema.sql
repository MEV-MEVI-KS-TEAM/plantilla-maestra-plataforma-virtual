-- ============================================================
--  IVS VIRTUAL — SCHEMA COMPLETO
--  Ejecutar en Supabase SQL Editor (en orden)
--
--  Bloque E3 (29-sep-2026): este archivo solo = aplicar TODAS las migraciones de
--  supabase/migrations, salvo el módulo Cursos (scripts/migracion-cursos-
--  diplomados.sql y sus migraciones). Con las migraciones encima acaba en la
--  misma base que scripts/schema.sql. Lo prueba
--  scripts/verificar-schema/comparar-instaladores.mjs (Postgres local) y lo
--  vigila tests/unit/e3-instaladores-equivalentes.spec.ts: si agregas una
--  migración, refléjala aquí.
-- ============================================================

-- ── EXTENSIONES ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  1. TABLAS BASE
-- ============================================================

-- ── USUARIOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  nombre      TEXT,
  apellidos   TEXT,
  telefono    TEXT,
  foto_url    TEXT,
  rol         TEXT        NOT NULL DEFAULT 'alumno'
                          CONSTRAINT usuarios_rol_check CHECK (rol IN ('alumno', 'admin', 'secretario')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ALUMNOS ─────────────────────────────────────────────────
-- ── AJUSTES ─────────────────────────────────────────────────
-- Valores de config que la BD necesita por su cuenta, porque corren en
-- triggers y funciones sin acceso a src/lib/config.ts. Hoy solo el prefijo de
-- matrícula, que consume generar_matricula(). Lo siembra el servidor desde
-- CONFIG.prefijoMatricula al dar de alta un alumno (src/lib/matricula.ts).
-- RLS activo y SIN políticas: en Supabase toda tabla de `public` sale por
-- PostgREST, así que sin RLS quedaría legible por cualquier visitante.
CREATE TABLE IF NOT EXISTS public.ajustes (
  clave       TEXT        PRIMARY KEY,
  valor       TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ajustes ENABLE ROW LEVEL SECURITY;

-- ── SITE_CONFIG ─────────────────────────────────────────────
-- Overrides del módulo "Personalizar mi página" (F1): lo que el ADMIN cambia
-- desde su panel (logo, colores, textos, precios) sin redeploy. Se hace
-- deep-merge sobre src/lib/config.ts en getSiteConfig(); con la tabla vacía
-- la app es IDÉNTICA a la de antes (invariante de los ~144 clientes).
-- Fila única (CHECK id = 1) y overrides PARCIALES en JSONB: una columna por
-- campo sería un ALTER TABLE en 144 bases cada vez que cambie el config.
-- RLS con SELECT público (la landing sin sesión lee logo y colores) y SIN
-- política de escritura: solo el service role escribe desde la API del admin.
-- Espejo de supabase/migrations/20260908120000_site_config.sql.
CREATE TABLE IF NOT EXISTS public.site_config (
  id          INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL
);
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.alumnos (
  id                   UUID        PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  matricula            TEXT        UNIQUE,
  -- 'diplomado' habilita la línea Solo-Cursos (B1). Agregar un valor a este
  -- CHECK es estrictamente permisivo: ningún dato existente deja de ser válido.
  -- Debe coincidir con supabase/migrations/20260730120000_b1_fundacion_solo_cursos.sql
  nivel                TEXT        CHECK (nivel IN ('secundaria', 'preparatoria', 'licenciatura', 'diplomado')),
  -- Bloque E3: el CHECK tal como lo deja 20260925120000_licenciatura_plan_6_meses.sql
  -- (los planes de licenciatura de 20260812120000 más '6_meses_lic', Bug 121), en
  -- el orden en que esa migración lo escribe. Antes solo admitía 3 y 6 meses: una
  -- base instalada con este archivo no podía dar de alta a un alumno de licenciatura.
  modalidad            TEXT        CONSTRAINT alumnos_modalidad_check CHECK (modalidad IS NULL OR modalidad IN (
                                     '12_meses', '18_meses', '24_meses', '36_meses',
                                     '3_meses', '6_meses', '6_meses_lic', '9_meses')),
  -- Slug de la carrera (CONFIG.licenciaturas.carreras[].slug). Solo licenciatura;
  -- NULL en el resto. Espejo de 20260812120000_licenciaturas.sql (Bloque E3).
  carrera              TEXT,
  es_sindicalizado     BOOLEAN     NOT NULL DEFAULT false,
  sindicato            TEXT,
  inscripcion_pagada   BOOLEAN     NOT NULL DEFAULT false,
  meses_desbloqueados  INTEGER     NOT NULL DEFAULT 0,
  -- Expresión COMPLETA, la misma de scripts/schema.sql (Bloque E3): con la de
  -- antes (3 o 6) un alumno de licenciatura en 12_meses quedaba con duración 6.
  duracion_meses       INTEGER     GENERATED ALWAYS AS (
                          CASE modalidad
                            WHEN '3_meses'     THEN 3
                            WHEN '6_meses'     THEN 6
                            WHEN '6_meses_lic' THEN 6
                            WHEN '9_meses'     THEN 9
                            WHEN '12_meses'    THEN 12
                            WHEN '18_meses'    THEN 18
                            WHEN '24_meses'    THEN 24
                            WHEN '36_meses'    THEN 36
                            ELSE 6
                          END
                        ) STORED,
  fecha_inscripcion    TIMESTAMPTZ,
  fecha_inicio         TIMESTAMPTZ,
  activo               BOOLEAN     NOT NULL DEFAULT true,
  notas_admin          TEXT,
  -- Qué curso de ingreso pidió al registrarse. Guarda el id de la OFERTA
  -- (src/lib/cursos/oferta.ts), no un UUID de `cursos`: hay clientes que
  -- venden varios cursos como paquete único.
  curso_solicitado     TEXT,
  -- Control Escolar ya contactó por WhatsApp al alumno pendiente de pago.
  -- Espejo de 20260403150000_alumnos_contactado_whatsapp.sql (Bloque E3): sin
  -- ella el listado de /admin/alumnos falla y el contador de pendientes da 0.
  contactado_whatsapp  BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumnos_curso_solicitado
  ON public.alumnos (curso_solicitado)
  WHERE curso_solicitado IS NOT NULL;

-- ── MATERIAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  nivel       TEXT        CHECK (nivel IN ('secundaria', 'preparatoria', 'demo', 'licenciatura')),
  orden       INTEGER,
  icono       TEXT,
  color       TEXT,
  activa      BOOLEAN     NOT NULL DEFAULT true,
  -- Licenciaturas (20260812120000, Bloque E3): la carrera de la materia y el
  -- plan con el que se sembró. `modalidad` es metadato del seed: NO filtrar el
  -- catálogo del alumno por ella.
  carrera     TEXT,
  modalidad   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materias_carrera
  ON public.materias (carrera) WHERE carrera IS NOT NULL;

-- ── MESES_CONTENIDO ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meses_contenido (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id    UUID        REFERENCES public.materias(id) ON DELETE CASCADE,
  numero_mes    INTEGER     NOT NULL,
  titulo        TEXT        NOT NULL,
  descripcion   TEXT,
  activa        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (materia_id, numero_mes)
);

-- ── SEMANAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.semanas (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_id                   UUID        REFERENCES public.meses_contenido(id) ON DELETE CASCADE,
  numero_semana            INTEGER     NOT NULL,
  titulo                   TEXT        NOT NULL,
  descripcion              TEXT,
  video_url                TEXT,
  -- Cuerpo de la leccion. El lector cae a `descripcion` si viene NULL.
  contenido                TEXT,
  -- Videos de apoyo opcionales; los edita el panel de contenido del admin.
  video_url_2              TEXT,
  video_url_3              TEXT,
  tiempo_estimado_minutos  INTEGER     NOT NULL DEFAULT 60,
  activa                   BOOLEAN     NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mes_id, numero_semana)
);

-- ── SEMANA_MATERIALES ───────────────────────────────────────
-- Los PDF que el admin sube a cada semana (F2 del CMS de contenido). TABLA y
-- no una columna en `semanas`: una clase reparte varios archivos y con una
-- columna el segundo borraría al primero sin avisar.
-- `path` apunta al bucket privado 'materias'; el alumno NUNCA lo lee directo,
-- pasa por /api/material/[id]. Ver
-- supabase/migrations/20260819130000_cms_contenido_materiales.sql.
CREATE TABLE IF NOT EXISTS public.semana_materiales (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_id     UUID        NOT NULL REFERENCES public.semanas(id) ON DELETE CASCADE,
  nombre        TEXT        NOT NULL,
  path          TEXT        NOT NULL,
  tamano_bytes  BIGINT,
  orden         INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PROGRESO_SEMANAS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progreso_semanas (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id             UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  semana_id             UUID        NOT NULL REFERENCES public.semanas(id) ON DELETE CASCADE,
  completada            BOOLEAN     NOT NULL DEFAULT false,
  fecha_completada      TIMESTAMPTZ,
  tiempo_visto_minutos  INTEGER     NOT NULL DEFAULT 0,
  UNIQUE (alumno_id, semana_id)
);

-- ── EVALUACIONES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id              UUID        REFERENCES public.materias(id) ON DELETE CASCADE,
  mes_id                  UUID        REFERENCES public.meses_contenido(id) ON DELETE SET NULL,
  titulo                  TEXT        NOT NULL,
  descripcion             TEXT,
  tiempo_limite_minutos   INTEGER     NOT NULL DEFAULT 60,
  intentos_permitidos     INTEGER     NOT NULL DEFAULT 3,
  activa                  BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PREGUNTAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preguntas (
  id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id       UUID  NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  pregunta            TEXT  NOT NULL,
  opcion_a            TEXT  NOT NULL,
  opcion_b            TEXT  NOT NULL,
  opcion_c            TEXT  NOT NULL,
  opcion_d            TEXT  NOT NULL,
  respuesta_correcta  TEXT  NOT NULL CHECK (respuesta_correcta IN ('a','b','c','d')),
  orden               INTEGER,
  activa              BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INTENTOS_EVALUACION ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intentos_evaluacion (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id        UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  evaluacion_id    UUID        NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  numero_intento   INTEGER     NOT NULL DEFAULT 1,
  puntaje          INTEGER,
  acreditado       BOOLEAN     NOT NULL DEFAULT false,
  fecha_intento    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respuestas       JSONB
);

-- ── CALIFICACIONES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calificaciones (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id           UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  materia_id          UUID        NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  evaluacion_id       UUID        REFERENCES public.evaluaciones(id) ON DELETE SET NULL,
  acreditado          BOOLEAN     NOT NULL DEFAULT false,
  fecha_acreditacion  TIMESTAMPTZ,
  folio               TEXT        UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alumno_id, materia_id)
);

-- ── QUIZ_SEMANA ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_semana (
  id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_id           UUID  NOT NULL REFERENCES public.semanas(id) ON DELETE CASCADE,
  pregunta            TEXT  NOT NULL,
  opcion_a            TEXT  NOT NULL,
  opcion_b            TEXT  NOT NULL,
  opcion_c            TEXT  NOT NULL,
  opcion_d            TEXT,
  respuesta_correcta  TEXT  NOT NULL CHECK (respuesta_correcta IN ('a','b','c','d')),
  orden               INTEGER,
  explicacion         TEXT,
  activa              BOOLEAN     NOT NULL DEFAULT true
);

-- ── QUIZ_RESPUESTAS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_respuestas (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id  UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  quiz_id    UUID        NOT NULL REFERENCES public.quiz_semana(id) ON DELETE CASCADE,
  respuesta  TEXT,
  correcta   BOOLEAN,
  fecha      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTAS_ALUMNO ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notas_alumno (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id   UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  semana_id   UUID        NOT NULL REFERENCES public.semanas(id) ON DELETE CASCADE,
  contenido   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alumno_id, semana_id)
);

-- ── LOGROS_ALUMNO ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logros_alumno (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id        UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  tipo_logro       TEXT        NOT NULL,
  fecha_obtenido   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alumno_id, tipo_logro)
);

-- ── RACHA_ACTIVIDAD ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.racha_actividad (
  id               UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id        UUID   NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE UNIQUE,
  racha_actual     INTEGER NOT NULL DEFAULT 0,
  racha_maxima     INTEGER NOT NULL DEFAULT 0,
  ultima_actividad DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── GLOSARIO_MATERIA ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.glosario_materia (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id  UUID        NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  termino     TEXT        NOT NULL,
  definicion  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCUMENTOS_ALUMNO ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documentos_alumno (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id            UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  tipo_documento       TEXT        NOT NULL,
  nombre_archivo       TEXT,
  url_archivo          TEXT,
  verificado           BOOLEAN     NOT NULL DEFAULT false,
  fecha_subida         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verificado_por       UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  fecha_verificacion   TIMESTAMPTZ,
  notas                TEXT
);

-- ── CONSTANCIAS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.constancias (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id    UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  folio        TEXT        UNIQUE NOT NULL,
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url_pdf      TEXT,
  materia_id   UUID        REFERENCES public.materias(id) ON DELETE SET NULL
);

-- ── PAGOS ───────────────────────────────────────────────────
-- Registro manual de pagos por Control Escolar (admin).
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
  moneda               TEXT NOT NULL DEFAULT 'MXN'
                       CONSTRAINT pagos_moneda_iso CHECK (moneda ~ '^[A-Z]{3}$'),
  tipo_cambio_aplicado NUMERIC(10,4)
                       CONSTRAINT pagos_tipo_cambio_positivo CHECK (tipo_cambio_aplicado IS NULL OR tipo_cambio_aplicado > 0)
);


-- ============================================================
--  2. FUNCIÓN: GENERAR MATRÍCULA
-- ============================================================

-- SECURITY DEFINER porque public.ajustes tiene RLS sin políticas: sin esto
-- la lectura del prefijo devolvería vacío y todo saldría 'MEV-'.
CREATE OR REPLACE FUNCTION public.generar_matricula()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Trigger: asignar matrícula automáticamente al insertar alumno
CREATE OR REPLACE FUNCTION public.trigger_asignar_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
    NEW.matricula := public.generar_matricula();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asignar_matricula ON public.alumnos;
CREATE TRIGGER trg_asignar_matricula
  BEFORE INSERT ON public.alumnos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_asignar_matricula();


-- ============================================================
--  3. FUNCIÓN: ACTUALIZAR RACHA
-- ============================================================

CREATE OR REPLACE FUNCTION public.actualizar_racha()
RETURNS TRIGGER
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
        -- Misma día, no sumar
        NULL;
      ELSIF ult_act = hoy - INTERVAL '1 day' THEN
        -- Día consecutivo
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

DROP TRIGGER IF EXISTS trg_actualizar_racha ON public.progreso_semanas;
CREATE TRIGGER trg_actualizar_racha
  AFTER INSERT OR UPDATE ON public.progreso_semanas
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_racha();


-- ============================================================
--  4. FUNCIÓN: CREAR PERFIL AL REGISTRARSE
-- ============================================================

-- Cuerpo post-S1 (20260729120000_fix_s1_rol_alta.sql, Bug 66): el rol del alta
-- es SIEMPRE 'alumno', literal. raw_user_meta_data lo escribe quien llama a
-- signUp con la anon key; leer de ahí el rol era registrarse como admin. Este
-- archivo conservó el cuerpo viejo hasta el 28-sep-2026 (lo vigilan el
-- guardián de tests/unit/guardian-schema-onboarding.spec.ts y el CHECK 23).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- rol FIJO. No se lee raw_user_meta_data->>'rol' bajo ninguna circunstancia:
  -- ese campo lo controla quien llama a signUp.
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

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
--  5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meses_contenido       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semanas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semana_materiales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso_semanas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos_evaluacion   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_semana           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_respuestas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_alumno          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logros_alumno         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racha_actividad       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glosario_materia      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_alumno     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constancias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos                 ENABLE ROW LEVEL SECURITY;

-- Helper: detectar si el usuario autenticado es admin.
-- Bloque E3 (#253): IGUAL a supabase/migrations/20260729121000_fix_s2_es_admin.sql
-- (S2): plpgsql, LOWER(rol) y search_path fijo. Antes este archivo traía la
-- versión previa (LANGUAGE sql, rol = 'admin' exacto, sin search_path) y una
-- base instalada solo con él fallaba los preflights de C3b en adelante.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
       AND LOWER(rol) = 'admin'
  );
END;
$$;

-- Helper: detectar si el usuario autenticado es staff (admin O secretario).
-- Lo usan las funciones del personal (cursos, constancias, cobranza por la API).
-- Desde D22c ya no abre por PostgREST la lectura de usuarios ni de pagos ajenos
-- (propio o es_admin(), con techo RESTRICTIVE). es_admin() para todo lo demás.
-- Bloque E3 (#253): igual a la S2, como es_admin().
CREATE OR REPLACE FUNCTION public.es_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
       AND LOWER(rol) IN ('admin', 'secretario')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.es_staff() TO anon, authenticated;

-- ── POLÍTICAS: USUARIOS ──────────────────────────────────────
CREATE POLICY "usuarios: ver propio perfil"
  ON public.usuarios FOR SELECT
  USING (id = auth.uid() OR public.es_admin());   -- D22c (K1)

-- D22c (K7): techo RESTRICTIVE. Se combina con AND con toda política permisiva
-- de SELECT: ni una copia vieja de 20260716130000_rol_secretario.sql re-corrida
-- después (la fila 2 de 7bis) ni una política de drift (p. ej. `usuarios_select`
-- de EDVEX) vuelven a abrir el directorio del personal a una sesión.
DROP POLICY IF EXISTS "usuarios: techo propio o admin (D22c)" ON public.usuarios;
CREATE POLICY "usuarios: techo propio o admin (D22c)"
  ON public.usuarios AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (id = auth.uid() OR public.es_admin());

-- R2: WITH CHECK explícito (la fila no se «muda» a otro id). Las columnas que
-- puede tocar la sesión las fija el GRANT por columna (Bug 52, más abajo).
CREATE POLICY "usuarios: actualizar propio perfil"
  ON public.usuarios FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios: admin puede insertar"
  ON public.usuarios FOR INSERT
  WITH CHECK (public.es_admin());

-- ── POLÍTICAS: ALUMNOS ───────────────────────────────────────
-- SELECT directo de alumnos: SOLO es_admin(). El secretario lee alumnos
-- únicamente vía /api/admin/* (service role, filtra notas_admin) — RLS no
-- filtra columnas y esta tabla contiene notas_admin (sensible), así que
-- NO se abre a es_staff().
CREATE POLICY "alumnos: ver propio registro"
  ON public.alumnos FOR SELECT
  USING (id = auth.uid() OR public.es_admin());

CREATE POLICY "alumnos: admin puede insertar"
  ON public.alumnos FOR INSERT
  WITH CHECK (public.es_admin());

CREATE POLICY "alumnos: admin puede actualizar"
  ON public.alumnos FOR UPDATE
  USING (public.es_admin());

CREATE POLICY "alumnos: admin puede eliminar"
  ON public.alumnos FOR DELETE
  USING (public.es_admin());

-- ── POLÍTICAS: MATERIAS (lectura pública para alumnos activos) ─
CREATE POLICY "materias: lectura autenticados"
  ON public.materias FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "materias: admin gestiona"
  ON public.materias FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: MESES_CONTENIDO ───────────────────────────────
CREATE POLICY "meses_contenido: lectura autenticados"
  ON public.meses_contenido FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "meses_contenido: admin gestiona"
  ON public.meses_contenido FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: SEMANAS ───────────────────────────────────────
CREATE POLICY "semanas: lectura autenticados"
  ON public.semanas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "semanas: admin gestiona"
  ON public.semanas FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: SEMANA_MATERIALES ─────────────────────────────
-- Metadatos (nombre, tamaño) legibles por cualquier autenticado, igual que
-- `semanas`. El ARCHIVO no se abre con esto: el bucket 'materias' es privado
-- y admin-only, y el alumno lo pide por /api/material/[id].
CREATE POLICY "semana_materiales: lectura autenticados"
  ON public.semana_materiales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "semana_materiales: admin gestiona"
  ON public.semana_materiales FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: PROGRESO_SEMANAS ──────────────────────────────
CREATE POLICY "progreso: ver propio progreso"
  ON public.progreso_semanas FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

-- R2 (soporte IVS, 8-oct-2026): sin «progreso: registrar propio progreso» ni
-- «progreso: actualizar propio progreso». El progreso lo escribe el servidor
-- (service role, después del gate); con la sesión un alumno marcaba completa
-- cualquier semana, también de meses no pagados. Ver el bloque R2 al final.

CREATE POLICY "progreso: admin gestiona"
  ON public.progreso_semanas FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: EVALUACIONES ──────────────────────────────────
CREATE POLICY "evaluaciones: lectura autenticados"
  ON public.evaluaciones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "evaluaciones: admin gestiona"
  ON public.evaluaciones FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: PREGUNTAS ─────────────────────────────────────
-- D22d: techo RESTRICTIVE solo-admin, para toda operación. Una sesión que no
-- es admin no lee ni escribe filas del banco del examen mensual; la app lo lee
-- con el service role DESPUÉS del gate. Reemplaza a «preguntas: lectura
-- autenticados» (cualquier sesión leía todas las claves por /rest/v1). Ninguna
-- permisiva vieja o de drift lo ensancha.
DROP POLICY IF EXISTS "preguntas: techo solo admin (D22d)" ON public.preguntas;
CREATE POLICY "preguntas: techo solo admin (D22d)" ON public.preguntas
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "preguntas: admin gestiona"
  ON public.preguntas FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: INTENTOS_EVALUACION ──────────────────────────
CREATE POLICY "intentos: ver propios intentos"
  ON public.intentos_evaluacion FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

-- D22d (K4): sin «intentos: registrar propio intento». El intento lo inserta el
-- servidor (service role) al calificar; con la sesión, un alumno se fabricaba
-- uno aprobado con 100.

CREATE POLICY "intentos: admin gestiona"
  ON public.intentos_evaluacion FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: CALIFICACIONES ────────────────────────────────
CREATE POLICY "calificaciones: ver propias"
  ON public.calificaciones FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

CREATE POLICY "calificaciones: admin gestiona"
  ON public.calificaciones FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: QUIZ ──────────────────────────────────────────
-- D22d: techo RESTRICTIVE solo-admin, para toda operación (quiz semanal). La
-- app lee el banco con el service role DESPUÉS del gate y califica en el
-- servidor pregunta por pregunta. Reemplaza a «quiz_semana: lectura
-- autenticados» (cualquier sesión leía la clave y la explicación que la delata).
DROP POLICY IF EXISTS "quiz_semana: techo solo admin (D22d)" ON public.quiz_semana;
CREATE POLICY "quiz_semana: techo solo admin (D22d)" ON public.quiz_semana
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "quiz_semana: admin gestiona"
  ON public.quiz_semana FOR ALL
  USING (public.es_admin());

CREATE POLICY "quiz_respuestas: ver propias"
  ON public.quiz_respuestas FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

-- D22d (K4): sin «quiz_respuestas: registrar propia». La respuesta la guarda el
-- servidor (service role) con `correcta` calculada por él; con la sesión, un
-- alumno se fabricaba respuestas con correcta=true.

-- ── POLÍTICAS: NOTAS_ALUMNO ──────────────────────────────────
CREATE POLICY "notas: ver propias"
  ON public.notas_alumno FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

CREATE POLICY "notas: gestionar propias"
  ON public.notas_alumno FOR INSERT
  WITH CHECK (alumno_id = auth.uid());

CREATE POLICY "notas: actualizar propias"
  ON public.notas_alumno FOR UPDATE
  USING (alumno_id = auth.uid()) WITH CHECK (alumno_id = auth.uid());

-- ── POLÍTICAS: LOGROS ────────────────────────────────────────
CREATE POLICY "logros: ver propios"
  ON public.logros_alumno FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

CREATE POLICY "logros: admin gestiona"
  ON public.logros_alumno FOR ALL
  USING (public.es_admin());

-- R2: sin «logros: insertar propios». Los logros los otorga el servidor (service
-- role) al marcar semanas y al calificar; con la sesión se insertaban a gusto.

-- ── POLÍTICAS: RACHA ─────────────────────────────────────────
CREATE POLICY "racha: ver propia"
  ON public.racha_actividad FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

-- R2: sin «racha: insertar propia» ni «racha: actualizar propia». La racha la
-- mueve trg_actualizar_racha con los privilegios de quien escribe el progreso
-- (el servidor).

-- ── POLÍTICAS: GLOSARIO ──────────────────────────────────────
CREATE POLICY "glosario: lectura autenticados"
  ON public.glosario_materia FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "glosario: admin gestiona"
  ON public.glosario_materia FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: DOCUMENTOS ────────────────────────────────────
CREATE POLICY "documentos: ver propios"
  ON public.documentos_alumno FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

-- R2: sin «documentos: subir propios» (inerte desde #185: la subida va con el
-- service role por /api/alumno/documentos; con la sesión, un alumno se subía un
-- documento ya verificado).

CREATE POLICY "documentos: admin gestiona"
  ON public.documentos_alumno FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: CONSTANCIAS ───────────────────────────────────
CREATE POLICY "constancias: ver propias"
  ON public.constancias FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

CREATE POLICY "constancias: admin gestiona"
  ON public.constancias FOR ALL
  USING (public.es_admin());

-- ── POLÍTICAS: PAGOS ─────────────────────────────────────────
-- Alumno: solo SELECT de sus propios pagos (alumnos.id = auth.uid()).
-- Admin: gestiona todo. Los pagos SIEMPRE los registra el admin;
-- ningún INSERT/UPDATE/DELETE para alumno.
CREATE POLICY "pagos: ver propios"
  ON public.pagos FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

CREATE POLICY "pagos: admin gestiona"
  ON public.pagos FOR ALL
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

-- D22c: `pagos` solo se ESCRIBE desde el servidor (service_role) y desde las
-- funciones SECURITY DEFINER (curso_cobrar, registrar_cuota_semanal). Supabase le
-- da ALL a anon y authenticated sobre toda tabla nueva: sin este REVOKE, una
-- sesión de personal insertaba pagos por /rest/v1/pagos sin las validaciones de
-- la API y a nombre de otro, y el admin borraba sin pasar por D10. SELECT se queda
-- (la RLS decide qué filas). Va DESPUÉS del CREATE TABLE: los GRANT de fábrica solo
-- se aplican al crear la tabla, así que re-correr el CREATE no los devuelve.
REVOKE ALL ON public.pagos FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pagos FROM authenticated;
GRANT  SELECT ON public.pagos TO authenticated;
GRANT  ALL    ON public.pagos TO service_role;

-- ── POLÍTICAS: SITE_CONFIG ───────────────────────────────────
-- Lectura para anon y authenticated: la landing PÚBLICA (sin sesión) necesita
-- logo, colores y textos, y nada de esto es secreto (ya va en el HTML).
-- SIN política de escritura A PROPÓSITO: solo el service role, que salta la
-- RLS, escribe desde la API del admin. USING (true) no consulta la propia
-- tabla: no hay recursión posible.
CREATE POLICY "site_config: lectura abierta"
  ON public.site_config FOR SELECT TO anon, authenticated
  USING (true);
-- GRANT por COLUMNAS: `updated_by` (el UUID del admin que guardó) no lo lee un
-- visitante anónimo; `data` sí, que es lo que la landing necesita. El REVOKE va
-- antes porque un privilegio de TABLA gana sobre el de columna, así que una
-- base que ya tenga el grant amplio (versión anterior de la migración) se
-- quedaría con él. Espejo de supabase/migrations/20260908120000_site_config.sql.
REVOKE SELECT ON public.site_config FROM anon, authenticated;
GRANT SELECT (id, data, updated_at) ON public.site_config TO anon, authenticated;


-- ============================================================
--  6. ÍNDICES (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_alumnos_matricula        ON public.alumnos (matricula);
CREATE INDEX IF NOT EXISTS idx_alumnos_nivel            ON public.alumnos (nivel);
CREATE INDEX IF NOT EXISTS idx_progreso_alumno          ON public.progreso_semanas (alumno_id);
CREATE INDEX IF NOT EXISTS idx_progreso_semana          ON public.progreso_semanas (semana_id);
CREATE INDEX IF NOT EXISTS idx_intentos_alumno          ON public.intentos_evaluacion (alumno_id);
CREATE INDEX IF NOT EXISTS idx_intentos_evaluacion      ON public.intentos_evaluacion (evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_alumno    ON public.calificaciones (alumno_id);
CREATE INDEX IF NOT EXISTS idx_documentos_alumno        ON public.documentos_alumno (alumno_id);
CREATE INDEX IF NOT EXISTS idx_notas_alumno             ON public.notas_alumno (alumno_id);
CREATE INDEX IF NOT EXISTS idx_semanas_mes              ON public.semanas (mes_id);
CREATE INDEX IF NOT EXISTS idx_semanas_activa           ON public.semanas (mes_id) WHERE activa;
CREATE INDEX IF NOT EXISTS idx_meses_materia            ON public.meses_contenido (materia_id);
CREATE INDEX IF NOT EXISTS idx_meses_contenido_activa   ON public.meses_contenido (materia_id) WHERE activa;
CREATE INDEX IF NOT EXISTS idx_quiz_semana              ON public.quiz_semana (semana_id);
CREATE INDEX IF NOT EXISTS idx_quiz_semana_activa       ON public.quiz_semana (semana_id) WHERE activa;
CREATE INDEX IF NOT EXISTS idx_preguntas_activa         ON public.preguntas (evaluacion_id) WHERE activa;
CREATE INDEX IF NOT EXISTS idx_semana_materiales_semana ON public.semana_materiales (semana_id);
CREATE INDEX IF NOT EXISTS idx_pagos_alumno             ON public.pagos (alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_created_at         ON public.pagos (created_at DESC);
-- 20260717120000_pagos_fecha_pago.sql (Bloque E3): los reportes filtran por fecha_pago.
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago         ON public.pagos (fecha_pago DESC);

-- ── UNIQUE que necesitan los seeds y la app (Bloque E3) ─────
-- preguntas (evaluacion_id, pregunta), Bug 33: las 265 preguntas de
-- seed-preguntas-evaluaciones-universal.sql entran con
-- ON CONFLICT (evaluacion_id, pregunta). Sin este UNIQUE, sembrar sobre una base
-- instalada con este archivo fallaba con 42P10. Mismo bloque que scripts/schema.sql.
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

-- documentos_alumno (alumno_id, tipo_documento): la subida de «Mis documentos»
-- hace upsert con onConflict 'alumno_id,tipo_documento'
-- (src/app/api/alumno/documentos/route.ts). Hasta hoy solo lo creaba
-- scripts/setup.sql, y la línea Solo-Cursos puede no correrlo.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documentos_alumno_alumno_tipo_unique'
  ) THEN
    ALTER TABLE public.documentos_alumno
      ADD CONSTRAINT documentos_alumno_alumno_tipo_unique
      UNIQUE (alumno_id, tipo_documento);
  END IF;
END $$;


-- ============================================================
--  7. STORAGE BUCKETS
--  (Ejecutar en SQL Editor de Supabase o desde el Dashboard)
-- ============================================================

-- NOTA CLIENTES NUEVOS: estos 5 buckets son necesarios desde el día 1, y con
-- 'cursos' son los 6 que usa la app (Bloque E3: se contaron en el código, ver
-- scripts/verificar-schema/README.md). 'cursos' NO está aquí a propósito: es
-- del módulo opcional de Diplomados y vive en
-- scripts/migracion-cursos-diplomados.sql.
-- 'avatars' (Bug 103): el nombre que usa src/app/api/alumno/avatar/route.ts.
-- Antes aquí se creaba 'avatares' (que nadie usa) y el avatar del alumno iba a
-- un bucket que no existía. Público porque la ruta guarda getPublicUrl; escribe
-- solo el servidor (service role), así que no lleva políticas.
-- 'constancias' ya no se crea: las constancias se generan al vuelo y ningún
-- código lee ni escribe ese bucket.
-- 'recibos' guarda los PDF de recibo de pago (Fase 3 Panel Admin Unificado);
-- son archivos pequeños, de ahí el límite de 2MB.
-- Lo mismo para una base ya instalada: 20260929120000_e3_buckets_de_la_app.sql.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',     'avatars',     true,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  ('documentos',  'documentos',  false, 10485760,  ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('recibos',     'recibos',     false, 2097152,   ARRAY['application/pdf']),
  -- F2: PDF de material por semana. Privado y SIN lectura para el alumno: se
  -- sirve por GET /api/material/[id], que comprueba el acceso en TypeScript.
  ('materias',    'materias',    false, 10485760,  ARRAY['application/pdf']),
  -- F1 "Personalizar mi página": el logo que sube el admin. PÚBLICO porque la
  -- landing lo pinta con <img src> sin sesión (como 'avatars'); 2 MB y solo
  -- imágenes porque es un logo. Escritura solo service role, vía la API.
  -- SIN 'image/svg+xml' aunque el editor acepte SVG a la ENTRADA: la API lo
  -- rasteriza a PNG antes de subir (FORMATO_SALIDA en
  -- src/app/api/admin/configuracion/logo/route.ts), así que en el bucket no hay
  -- ni puede haber un SVG — y este bucket es público, donde un SVG es código.
  ('branding',    'branding',    true,  2097152,   ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
-- (avatars no lleva: es público y solo escribe el servidor.)
-- Documentos: solo el dueño y admins
CREATE POLICY "documentos: ver propio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos' AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.es_admin()
    )
  );

CREATE POLICY "documentos: subir propio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- Materias (F2): SOLO admin, en las cuatro operaciones.
-- El alumno NUNCA lee de este bucket. Pide GET /api/material/[id], que reusa
-- tieneAccesoSemana() y firma con service role. Reproducir aquí la regla de
-- acceso del alumno es exactamente lo que rompió las portadas de Cursos: la
-- política y el path divergieron y la imagen salía en blanco SOLO para él.
CREATE POLICY "materias: solo admin lee"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'materias' AND public.es_admin());

CREATE POLICY "materias: solo admin escribe"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materias' AND public.es_admin());

CREATE POLICY "materias: solo admin actualiza"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'materias' AND public.es_admin());

CREATE POLICY "materias: solo admin borra"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'materias' AND public.es_admin());

-- Recibos de pago: el dueño (alumno) y el staff pueden verlos;
-- solo el staff los sube (en la práctica los genera el servidor con
-- service role; el alumno los recibe vía signed URL por WhatsApp).
CREATE POLICY "recibos: ver propio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recibos' AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.es_staff()
    )
  );

CREATE POLICY "recibos: staff sube"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recibos' AND public.es_staff());

-- Branding (F1): lectura pública del logo; escritura SOLO service role. No hay
-- política de INSERT/UPDATE/DELETE para anon ni authenticated a propósito:
-- ni un admin con sesión sube directo desde el navegador, pasa por la API que
-- valida tipo y tamaño antes de escribir.
CREATE POLICY "branding: lectura abierta"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'branding');


-- ============================================================
--  8. DATOS INICIALES — MATERIA DEMO
-- ============================================================

-- Bloque E3 (Fase 6): aquí se sembraba una materia «Tutoría de Ingreso» (sin el
-- «I», UUID al azar) que scripts/schema.sql no trae. Con el seed de setup.sql
-- encima, seed-crear-evaluaciones.sql le creaba un «Examen Final — Tutoría de
-- Ingreso» SIN preguntas (Bug D: un examen vacío a la vista del alumno) y la base
-- quedaba con 26 materias en vez de 25. La materia demo de verdad es «Tutoría de
-- Ingreso I» (UUID fijo f0551b82-…) y la siembra scripts/seed-demo-materia.sql.
-- Los dos instaladores ya no difieren en datos: lo compara
-- scripts/verificar-schema/comparar-instaladores.mjs (comparación 4).


-- ============================================================
--  FIN DEL SCHEMA
-- ============================================================
-- Para verificar que todo quedó bien:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;


-- =============================================================
-- FIX Issue #15 — is_admin() wrapper para compatibilidad smoke test
-- =============================================================
-- post-setup-check.sql busca is_admin(), schema histórico crea es_admin().
-- Wrapper mantiene compatibilidad con ambos nombres sin duplicar lógica.
-- SECURITY DEFINER + STABLE evita recursión infinita en RLS policies.
-- =============================================================

-- Bloque E3: la misma definición que scripts/schema.sql (los dos instaladores
-- acaban en la misma base; lo comprueba scripts/verificar-schema/).
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
-- KEEP-ALIVE HEARTBEAT (Bug 46)
-- =============================================================
-- Tabla mínima usada por .github/workflows/keep-alive.yml para
-- generar actividad REAL de DB. Los GET con anon responden 200
-- pero NO cuentan como actividad → Supabase free pausa a 7d aunque
-- el workflow esté verde. Un INSERT sí cuenta.
--
-- RLS: anon SOLO puede INSERT. Sin SELECT/UPDATE/DELETE.
-- Mínimo privilegio formal — la tabla no es legible desde el cliente.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.keep_alive_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now()
);

-- Columna `source`: quien mando el latido ("central-YYYY-MM-DD", "rescate-manual-...").
-- Va por ALTER idempotente y NO en el CREATE, porque los clientes ya desplegados
-- tienen la tabla sin ella. El keep-alive central manda {source} y reintenta con {}
-- si la columna no existe (PostgREST responde 400 PGRST204), asi que ambos esquemas
-- funcionan; con la columna presente se puede auditar quien latio y cuando.
-- Nullable a proposito: el INSERT `{}` del workflow per-repo legacy sigue siendo valido.
ALTER TABLE public.keep_alive_log ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.keep_alive_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.keep_alive_log FROM anon;

DROP POLICY IF EXISTS keep_alive_anon_insert ON public.keep_alive_log;
CREATE POLICY keep_alive_anon_insert ON public.keep_alive_log
  FOR INSERT TO anon WITH CHECK (true);

GRANT INSERT ON public.keep_alive_log TO anon;

-- =============================================================
-- ROL SECRETARIO — ajuste condicional de policies de pagos
-- =============================================================
-- Si el módulo de pagos (feature/panel-admin-pagos) está aplicado
-- en esta BD, separa la policy ALL de admin en policies por operación:
--   SELECT        → propio o es_admin() (D22c, K2) + techo RESTRICTIVE
--   INSERT        → es_staff()   (inerte para PostgREST desde D22c: sin GRANT)
--   UPDATE/DELETE → es_admin()   (ídem)
-- Idempotente y seguro en cualquier orden de merge.
-- =============================================================
DO $$
BEGIN
  IF to_regclass('public.pagos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "pagos: ver propios"     ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin gestiona"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: staff registra"  ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin actualiza" ON public.pagos;
    DROP POLICY IF EXISTS "pagos: admin elimina"   ON public.pagos;

    -- D22c (K2): el SECRETARIO ya no lee todos los pagos por PostgREST; el
    -- historial que le toca le llega por /api/admin/pagos (service role).
    CREATE POLICY "pagos: ver propios" ON public.pagos
      FOR SELECT USING (alumno_id = auth.uid() OR public.es_admin());

    -- D22c: techo RESTRICTIVE. Se combina con AND con toda política permisiva:
    -- una copia vieja de esta migración o una política de drift no reabre el
    -- SELECT de pagos ajenos para una sesión que no sea del admin.
    DROP POLICY IF EXISTS "pagos: techo propio o admin (D22c)" ON public.pagos;
    CREATE POLICY "pagos: techo propio o admin (D22c)" ON public.pagos
      AS RESTRICTIVE FOR SELECT TO anon, authenticated
      USING (alumno_id = auth.uid() OR public.es_admin());

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
     -- 'diplomado' (línea 33). No depende del módulo opcional de Cursos, así
     -- que este archivo sigue pudiendo correrse solo. Verificado sobre una
     -- base limpia.
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

-- Bug 220 (MEDERI, 24-sep-2026): el alta de la fila propia en usuarios/documentos
-- NO va con la sesión del usuario. register-complete, /api/admin/* y la subida de
-- documentos escriben con service_role. Sin este REVOKE, un signUp con la anon key
-- (sin trigger on_auth_user_created) podía insertar su propia fila con rol='admin'.
REVOKE INSERT ON public.usuarios FROM anon, authenticated;
REVOKE INSERT ON public.documentos_alumno FROM anon, authenticated;

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
-- CORREGIR PLAN DE ESTUDIO — bitácora + candados + corrección
-- =============================================================
-- Corrección de CAPTURA del alta (nivel/carrera/modalidad), solo si el alumno
-- no ha comenzado: seis candados (pagos+inscripción, meses, calificaciones,
-- progreso, intentos, quiz — los cuatro de contenido excluyendo materias
-- TUTORIAL: nivel='demo' o nombre con 'tutor', es_materia_tutorial()). El gate
-- de acceso (tieneAccesoMateria, acceso-materias.ts:186) abre los tutoriales
-- sin pago, así que su avance nunca es evidencia de plan iniciado; los
-- candados de dinero NO tienen excepción. La matrícula no se regenera. Las
-- notas del alumno se borran en la misma transacción y su conteo queda en la
-- bitácora.
-- Espejo de supabase/migrations/20260817120000_corregir_plan_estudio.sql.

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

CREATE TABLE IF NOT EXISTS public.alumno_plan_eventos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id          UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  tipo               TEXT        NOT NULL DEFAULT 'correccion_plan'
                                 CONSTRAINT alumno_plan_eventos_tipo_check CHECK (tipo IN ('correccion_plan')),
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
-- Copia LITERAL del bloque de scripts/schema.sql (Bloque E3): sin él, una base
-- instalada con este archivo (Solo-Cursos, `supabase db reset`) nacía sin el
-- calendario, D22b no tenía nada que cerrar y D22c se saltaba K4 y K6. Que los
-- dos instaladores acaben iguales lo comprueba scripts/verificar-schema/ y lo
-- vigila tests/unit/guardian-schema-onboarding.spec.ts.
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

-- ⚠️ Este bloque debe correr DESPUÉS de los GRANT genéricos del esquema. Si
-- alguien recrea `public` a mano (DROP SCHEMA + volver a pasar este archivo),
-- hay que restaurar antes los privilegios de fábrica de Supabase o la aplicación
-- entera responde "permission denied": esta plantilla protege con RLS, no
-- quitando privilegios. Re-ejecutar este archivo sobre un esquema que ya existe
-- NO necesita ese DROP — el `CREATE SCHEMA IF NOT EXISTS` de arriba lo deja
-- pasar y los GRANT de fábrica siguen en su sitio.

-- ── 3. Guardia común: ¿quién puede escribir el calendario? ──────────────────
-- Permitido: (a) el service_role del servidor, (b) un usuario con rol admin,
-- (c) una conexión directa a la BD (psql como postgres, sin claims de
-- PostgREST). El SECRETARIO y el ALUMNO reciben 42501: estas funciones son
-- SECURITY DEFINER y sin esta guardia podrían reescribir los pagos de otro.
-- D22b: antes pasaba es_staff(), y el secretario condonaba, regeneraba o fijaba
-- un plan a medida llamando /rest/v1/rpc/… con su sesión. Ahora, además, las
-- cuatro funciones de abajo tienen EXECUTE solo para service_role: la app las
-- llama siempre con él (el secretario cobra por /api/admin/cobranza, que revisa
-- su rol antes). Esta guardia es la segunda capa, por si vuelve un GRANT viejo.
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
  RETURN public.es_admin();                   -- D22b: con sesión, solo el admin
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

-- D22b: solo el servidor (service_role). Nada de la app la llama con sesión.
REVOKE ALL ON FUNCTION public.generar_calendario_pagos(UUID, INTEGER, NUMERIC, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generar_calendario_pagos(UUID, INTEGER, NUMERIC, DATE) TO service_role;

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

-- D22b: solo el servidor (service_role). Nada de la app la llama con sesión.
REVOKE ALL ON FUNCTION public.generar_calendario_por_nivel(UUID, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generar_calendario_por_nivel(UUID, DATE) TO service_role;

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
  -- D22c (K4): quien llama fija p_registrado_por, p_monto y p_fecha_pago, así que
  -- solo el servidor la invoca (service_role, después de verifyStaff en
  -- /api/admin/cobranza) o una conexión directa. Con sesión de usuario, 42501
  -- aunque un GRANT viejo le devuelva EXECUTE a authenticated.
  IF COALESCE(current_setting('request.jwt.claims', true), '') <> ''
     AND (current_setting('request.jwt.claims', true)::jsonb ->> 'role') IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'permiso denegado: registrar_cuota_semanal solo la llama el servidor'
      USING ERRCODE = '42501';
  END IF;
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

-- D22b: solo el servidor (service_role). Nada de la app la llama con sesión.
REVOKE ALL ON FUNCTION public.registrar_cuota_semanal(UUID, INTEGER, TEXT, UUID, TEXT, DATE, NUMERIC, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_cuota_semanal(UUID, INTEGER, TEXT, UUID, TEXT, DATE, NUMERIC, TEXT, NUMERIC) TO service_role;

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

-- D22b: solo el servidor (service_role). Nada de la app la llama con sesión.
REVOKE ALL ON FUNCTION public.condonar_semana(UUID, INTEGER, UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.condonar_semana(UUID, INTEGER, UUID, TEXT, BOOLEAN) TO service_role;

-- ── 7. Borrar un pago de cuota devuelve la semana a 'pendiente' ─────────────
-- El FK pago_id ya está en NULL cuando corre este trigger (ON DELETE SET NULL
-- actúa antes), así que se localiza por alumno + semana, no por pago_id.
-- D22c (K6): y SOLO si la semana no está ligada a OTRO pago que sigue vivo
-- (pago_id IS NULL tras el SET NULL, o el propio OLD.id). Sin esto, borrar un
-- pago suelto de la misma semana devolvía a 'pendiente' una semana pagada.
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
       AND estado = 'pagado'
       AND (pago_id IS NULL OR pago_id = OLD.id);   -- D22c (K6)
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

-- ═══════════════════════════════════════════════════════════════════════════
-- BITÁCORA DE MESES DEL PROGRAMA (reflejo de
-- supabase/migrations/20260928120000_d20a_bitacora_meses_programa.sql, D20a)
--
-- «Abrir Mes N» y «Quitar último mes» de la ficha escriben por
-- alumno_mover_mes() (solo el servidor): candado de fila, idempotente por
-- operacion_id y con el evento (acción, mes, antes → después, actor con nombre
-- y rol, fecha). Aplica a TODA escuela; lo vigila
-- tests/unit/guardian-schema-onboarding.spec.ts, y
-- tests/unit/d20a-bitacora-meses.spec.ts exige que este bloque sea idéntico al
-- de la migración, en los dos instaladores.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── BITÁCORA: alumno_mes_eventos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alumno_mes_eventos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id     UUID        NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  accion        TEXT        NOT NULL,
  mes           INTEGER     NOT NULL,
  antes         INTEGER     NOT NULL,
  despues       INTEGER     NOT NULL,
  -- Uno por apertura del modal: el doble clic repite el MISMO id.
  operacion_id  UUID        NOT NULL,
  -- Quién lo hizo, con su nombre y su rol del momento (si luego lo renombran o
  -- lo dan de baja, la bitácora dice quién era entonces).
  actor         UUID,
  actor_nombre  TEXT,
  actor_rol     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alumno_mes_eventos
  DROP CONSTRAINT IF EXISTS alumno_mes_eventos_accion_check;
ALTER TABLE public.alumno_mes_eventos
  ADD CONSTRAINT alumno_mes_eventos_accion_check
  CHECK (accion IN ('abrir', 'cerrar'));

-- Coherencia: abrir sube uno y el mes es el nuevo; cerrar baja uno y el mes es
-- el que se quitó.
ALTER TABLE public.alumno_mes_eventos
  DROP CONSTRAINT IF EXISTS alumno_mes_eventos_coherencia_check;
ALTER TABLE public.alumno_mes_eventos
  ADD CONSTRAINT alumno_mes_eventos_coherencia_check
  CHECK (
    (accion = 'abrir'  AND despues = antes + 1 AND mes = despues)
    OR (accion = 'cerrar' AND despues = antes - 1 AND mes = antes AND despues >= 0)
  );

CREATE UNIQUE INDEX IF NOT EXISTS alumno_mes_eventos_operacion_uidx
  ON public.alumno_mes_eventos (operacion_id);

CREATE INDEX IF NOT EXISTS idx_alumno_mes_eventos_alumno
  ON public.alumno_mes_eventos (alumno_id, created_at DESC);

ALTER TABLE public.alumno_mes_eventos ENABLE ROW LEVEL SECURITY;

-- Lee el personal (el secretario también ve la ficha). Nadie escribe por
-- PostgREST: sin política de INSERT/UPDATE/DELETE la bitácora la escribe
-- alumno_mover_mes() o nadie.
DROP POLICY IF EXISTS "alumno_mes_eventos: staff lee" ON public.alumno_mes_eventos;
CREATE POLICY "alumno_mes_eventos: staff lee" ON public.alumno_mes_eventos
  FOR SELECT TO authenticated
  USING (public.es_staff());

DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.alumno_mes_eventos FROM authenticated';
    EXECUTE 'GRANT SELECT ON public.alumno_mes_eventos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT ALL ON public.alumno_mes_eventos TO service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.alumno_mes_eventos FROM anon';
  END IF;
END
$g$;

-- ── ESCRITOR ÚNICO: alumno_mover_mes(...) ───────────────────────────────────
-- Las columnas de salida NO se llaman como las de las tablas (plpgsql las
-- confundiría con las columnas en los WHERE).
CREATE OR REPLACE FUNCTION public.alumno_mover_mes(
  p_alumno_id    UUID,
  p_accion       TEXT,
  p_antes        INTEGER,
  p_tope         INTEGER,
  p_operacion_id UUID,
  p_actor        UUID
)
RETURNS TABLE (
  meses_ahora  INTEGER,
  mes_movido   INTEGER,
  meses_antes  INTEGER,
  repetido     BOOLEAN,
  quien        TEXT,
  quien_rol    TEXT,
  cuando       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nivel   TEXT;
  v_actual  INTEGER;
  v_ev      RECORD;
  v_nuevo   INTEGER;
  v_mes     INTEGER;
  v_nombre  TEXT;
  v_rol     TEXT;
  v_creado  TIMESTAMPTZ;
BEGIN
  -- Permiso primero (D20a): el actor que manda el servidor tiene que ser admin
  -- o secretario HOY (defensa en profundidad además de verifyStaff).
  SELECT COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellidos)), ''), u.email),
         LOWER(BTRIM(u.rol))
    INTO v_nombre, v_rol
    FROM public.usuarios u
   WHERE u.id = p_actor;
  IF p_actor IS NULL OR v_rol IS NULL OR v_rol NOT IN ('admin', 'secretario') THEN
    RAISE EXCEPTION 'Solo el personal de la escuela puede abrir o cerrar meses.'
      USING ERRCODE = '42501';
  END IF;

  IF p_operacion_id IS NULL THEN
    RAISE EXCEPTION 'Falta el identificador de la operación. Recarga la página y vuelve a intentarlo.'
      USING ERRCODE = '22023';
  END IF;
  IF p_accion IS NULL OR p_accion NOT IN ('abrir', 'cerrar') THEN
    RAISE EXCEPTION 'Acción inválida: usa abrir o cerrar.' USING ERRCODE = '22023';
  END IF;
  IF p_antes IS NULL OR p_antes < 0 THEN
    RAISE EXCEPTION 'Falta cuántos meses tenía abiertos el alumno. Recarga la página.' USING ERRCODE = '22023';
  END IF;

  -- Candado de fila ANTES de mirar la bitácora: el gemelo de un doble clic
  -- espera aquí y, al pasar, ya ve el evento del primero.
  SELECT a.nivel, COALESCE(a.meses_desbloqueados, 0)
    INTO v_nivel, v_actual
    FROM public.alumnos a
   WHERE a.id = p_alumno_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumno no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotencia: la misma operación devuelve lo que hizo, sin mover nada.
  SELECT e.alumno_id, e.accion, e.mes, e.antes, e.despues, e.actor_nombre, e.actor_rol, e.created_at
    INTO v_ev
    FROM public.alumno_mes_eventos e
   WHERE e.operacion_id = p_operacion_id;
  IF FOUND THEN
    IF v_ev.alumno_id <> p_alumno_id OR v_ev.accion <> p_accion THEN
      RAISE EXCEPTION 'Ese identificador de operación ya se usó para otra cosa. Recarga la página.'
        USING ERRCODE = '22023';
    END IF;
    RETURN QUERY SELECT v_ev.despues, v_ev.mes, v_ev.antes, TRUE, v_ev.actor_nombre, v_ev.actor_rol, v_ev.created_at;
    RETURN;
  END IF;

  -- B7: meses_desbloqueados de un alumno de diplomado no es su curso. Abrir,
  -- no; quitar sí (limpia un dato sucio de antes de B7).
  IF v_nivel = 'diplomado' AND p_accion = 'abrir' THEN
    RAISE EXCEPTION 'Este alumno no cursa un programa. Los meses de su diplomado se abren desde la ficha del curso.'
      USING ERRCODE = '22023';
  END IF;

  -- Lo que la pantalla vio. Si cambió (otra pestaña, otro usuario), nada.
  -- PT409 y NO 40001: PostgREST toma 40001 (serialization_failure) por una falla
  -- pasajera y reintenta la transacción sin fin (Supabase lo documenta; se
  -- arregla hasta PostgREST 16). PT409 le llega a la ruta como HTTP 409.
  IF v_actual <> p_antes THEN
    RAISE EXCEPTION 'El alumno cambió mientras tanto: ahora tiene % mes(es) abierto(s). Recarga la ficha y vuelve a intentarlo.', v_actual
      USING ERRCODE = 'PT409';
  END IF;

  IF p_accion = 'abrir' THEN
    IF p_tope IS NULL OR p_tope < 1 OR p_tope > 600 THEN
      RAISE EXCEPTION 'La duración del plan no es válida (%).', p_tope USING ERRCODE = '22023';
    END IF;
    IF v_actual >= p_tope THEN
      RAISE EXCEPTION 'Todos los meses ya están desbloqueados.' USING ERRCODE = '22023';
    END IF;
    v_nuevo := v_actual + 1;
    v_mes   := v_nuevo;
  ELSE
    IF v_actual <= 0 THEN
      RAISE EXCEPTION 'No hay meses que quitar.' USING ERRCODE = '22023';
    END IF;
    v_nuevo := v_actual - 1;
    v_mes   := v_actual;
  END IF;

  UPDATE public.alumnos SET meses_desbloqueados = v_nuevo WHERE id = p_alumno_id;

  INSERT INTO public.alumno_mes_eventos
    (alumno_id, accion, mes, antes, despues, operacion_id, actor, actor_nombre, actor_rol)
  VALUES
    (p_alumno_id, p_accion, v_mes, v_actual, v_nuevo, p_operacion_id, p_actor, v_nombre, v_rol)
  RETURNING created_at INTO v_creado;

  RETURN QUERY SELECT v_nuevo, v_mes, v_actual, FALSE, v_nombre, v_rol, v_creado;
END;
$$;

-- SOLO el servidor (service_role): SECURITY DEFINER con EXECUTE abierto sería
-- mover meses por PostgREST con un tope inventado (Bug 77: nombrar los tres roles).
REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM PUBLIC;
DO $gf$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.alumno_mover_mes(UUID, TEXT, INTEGER, INTEGER, UUID, UUID) TO service_role';
  END IF;
END
$gf$;


-- =============================================================
-- MÓDULOS OPCIONALES (no viven en este archivo)
-- =============================================================
-- schema.sql define el esquema BASE y debe poder correrse solo. Estos módulos
-- se aplican aparte, en este orden, y solo en los clientes que los contratan:
--
--   1. Cursos y Diplomados  → scripts/migracion-cursos-diplomados.sql
--      Crea cursos, curso_modulos, curso_lecciones, curso_inscripciones,
--      curso_progreso y el bucket privado 'cursos'.
--
--   2. Examen Final de Curso → supabase/migrations/20260728120000_examen_final_cursos.sql
--      Crea curso_examen_preguntas y curso_examen_resultados. Depende de (1)
--      porque ambas tienen FK a public.cursos, y por eso NO se declaran aquí:
--      hacerlo dejaría este archivo con una FK a una tabla que él no crea.
--      Requerido por la vertical "Cursos de Ingreso" (banco-cursos-ingreso).
-- =============================================================

-- ── D22d: la respuesta correcta solo la lee el servidor (privilegios) ───────
-- Supabase da ALL a anon y authenticated sobre toda tabla nueva. Va DESPUÉS de
-- todos los CREATE TABLE (los GRANT de fábrica llegan al crear) y sustituye al
-- bloque de #186 (Bug 221): el REVOKE de tabla quita también cualquier GRANT por
-- columna, y solo vuelve una LISTA BLANCA (K-d5). Ninguna sesión lee
-- respuesta_correcta, explicacion ni una columna que se agregue después. El
-- techo RESTRICTIVE (arriba) ya deja en 0 las filas de quien no es admin: son
-- dos capas, como D22c. Lo vigila el CHECK 28.
REVOKE ALL    ON public.preguntas FROM anon, PUBLIC;
REVOKE SELECT ON public.preguntas FROM authenticated;
GRANT  SELECT (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, orden, activa, created_at)
  ON public.preguntas TO authenticated;
GRANT  ALL    ON public.preguntas TO service_role;

REVOKE ALL    ON public.quiz_semana FROM anon, PUBLIC;
REVOKE SELECT ON public.quiz_semana FROM authenticated;
GRANT  SELECT (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, orden, activa)
  ON public.quiz_semana TO authenticated;
GRANT  ALL    ON public.quiz_semana TO service_role;

-- K4 (K-d6): los intentos del examen mensual y las respuestas del quiz solo los
-- ESCRIBE el servidor (service role, después del gate y calificando él). Con
-- INSERT propio, una sesión se fabricaba un intento aprobado con 100 o
-- respuestas con correcta=true. El SELECT propio se queda (la RLS decide qué
-- filas). Lo vigila el CHECK 30.
REVOKE ALL ON public.intentos_evaluacion FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.intentos_evaluacion FROM authenticated;
GRANT  SELECT ON public.intentos_evaluacion TO authenticated;
GRANT  ALL    ON public.intentos_evaluacion TO service_role;

REVOKE ALL ON public.quiz_respuestas FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.quiz_respuestas FROM authenticated;
GRANT  SELECT ON public.quiz_respuestas TO authenticated;
GRANT  ALL    ON public.quiz_respuestas TO service_role;

-- D22d (H5): techo RESTRICTIVE de lectura «propio o admin». Una permisiva de drift
-- que abriera las respuestas AJENAS del quiz delataría la clave (las marcadas
-- correcta=true); los intentos ajenos, la nota de otros. Lo vigila el CHECK 30.
DROP POLICY IF EXISTS "intentos: techo propio o admin (D22d)" ON public.intentos_evaluacion;
CREATE POLICY "intentos: techo propio o admin (D22d)" ON public.intentos_evaluacion
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "quiz_respuestas: techo propio o admin (D22d)" ON public.quiz_respuestas;
CREATE POLICY "quiz_respuestas: techo propio o admin (D22d)" ON public.quiz_respuestas
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());

-- ── R2 (soporte IVS, 8-oct-2026): lo que da avance, logros, calificación o ─────
-- acceso solo lo escribe el servidor. Igual a
-- supabase/migrations/20261008120000_r2_escritura_solo_servidor.sql (allí está el
-- porqué de cada parte). Va AL FINAL: los GRANT de fábrica de Supabase llegan al
-- crear cada tabla y el bloque recorre las que existen. Lo vigilan los CHECK 32,
-- 33 y 34; lo prueba con RLS real scripts/verificar-schema/explotaciones-r2.mjs.
DROP POLICY IF EXISTS "progreso: registrar propio progreso"  ON public.progreso_semanas;
DROP POLICY IF EXISTS "progreso: actualizar propio progreso" ON public.progreso_semanas;
DROP POLICY IF EXISTS "logros: insertar propios"             ON public.logros_alumno;
DROP POLICY IF EXISTS "racha: insertar propia"               ON public.racha_actividad;
DROP POLICY IF EXISTS "racha: actualizar propia"             ON public.racha_actividad;
DROP POLICY IF EXISTS "documentos: subir propios"            ON public.documentos_alumno;

DO $r2$
DECLARE
  r   RECORD;
  v_t TEXT;
BEGIN
  -- Solo las escribe el servidor: sin INSERT/UPDATE/DELETE/TRUNCATE con sesión
  -- (de tabla y de columna); el SELECT se queda y lo acota el techo de abajo.
  FOREACH v_t IN ARRAY ARRAY['intentos_evaluacion', 'calificaciones', 'quiz_respuestas',
                             'progreso_semanas', 'logros_alumno', 'racha_actividad',
                             'alumnos', 'documentos_alumno', 'constancias'] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, PUBLIC', v_t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', v_t);
    FOR r IN SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = to_regclass('public.' || v_t) AND a.attnum > 0 AND NOT a.attisdropped LOOP
      EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.%2$I FROM anon, authenticated', r.attname, v_t);
    END LOOP;
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', v_t);
  END LOOP;
  -- Contenido: lo edita el panel con el service role.
  FOREACH v_t IN ARRAY ARRAY['materias', 'meses_contenido', 'semanas', 'semana_materiales',
                             'evaluaciones', 'glosario_materia', 'preguntas', 'quiz_semana'] LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', v_t);
    FOR r IN SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = to_regclass('public.' || v_t) AND a.attnum > 0 AND NOT a.attisdropped LOOP
      EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.%2$I FROM anon, authenticated', r.attname, v_t);
    END LOOP;
    EXECUTE format('GRANT ALL ON public.%I TO service_role', v_t);
  END LOOP;
  -- usuarios (Bug 52 + 220): sin INSERT/DELETE; UPDATE solo de las columnas de perfil.
  FOR r IN SELECT a.attname FROM pg_attribute a
            WHERE a.attrelid = 'public.usuarios'::regclass AND a.attnum > 0 AND NOT a.attisdropped LOOP
    EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I) ON public.usuarios FROM anon, authenticated', r.attname);
  END LOOP;
  -- Las funciones de trigger no necesitan EXECUTE de quien escribe para dispararse.
  FOR r IN SELECT p.oid::regprocedure AS fn FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.prorettype = 'trigger'::regtype LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.fn);
  END LOOP;
  -- anon no escribe en public (salvo el INSERT que una política TO anon pide a
  -- propósito: keep_alive_log, Bug 46); nadie con sesión hace TRUNCATE.
  FOR r IN
    SELECT c.relname,
           EXISTS (SELECT 1 FROM pg_policies p
                    WHERE p.schemaname = 'public' AND p.tablename = c.relname
                      AND p.permissive = 'PERMISSIVE' AND p.cmd IN ('INSERT', 'ALL')
                      AND p.roles @> ARRAY['anon']::name[]) AS insert_anon
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    IF r.insert_anon THEN
      EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon', r.relname);
    ELSE
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon', r.relname);
    END IF;
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated', r.relname);
  END LOOP;
END
$r2$;

REVOKE ALL ON public.usuarios FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.usuarios FROM authenticated;
GRANT  UPDATE (nombre, apellidos, telefono, foto_url) ON public.usuarios TO authenticated;
GRANT  SELECT ON public.usuarios TO authenticated;
GRANT  ALL    ON public.usuarios TO service_role;

-- notas_alumno: el alumno escribe SUS apuntes (no dan acceso ni calificación).
REVOKE ALL ON public.notas_alumno FROM anon, PUBLIC;
REVOKE DELETE, TRUNCATE ON public.notas_alumno FROM authenticated;
GRANT  SELECT, INSERT, UPDATE ON public.notas_alumno TO authenticated;
GRANT  ALL ON public.notas_alumno TO service_role;

-- generar_matricula() solo la llama el trigger de alta (con el service role).
REVOKE EXECUTE ON FUNCTION public.generar_matricula() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.generar_matricula() TO service_role;

-- Contra los envíos simultáneos: 4 POST al quiz (uno por opción) o dos envíos
-- del último intento del examen. La app trata el 23505.
CREATE UNIQUE INDEX IF NOT EXISTS quiz_respuestas_alumno_quiz_uniq
  ON public.quiz_respuestas (alumno_id, quiz_id);
CREATE UNIQUE INDEX IF NOT EXISTS intentos_evaluacion_alumno_eval_num_uniq
  ON public.intentos_evaluacion (alumno_id, evaluacion_id, numero_intento);

-- Techos RESTRICTIVE de lectura «propio o admin»: ninguna permisiva vieja o de
-- drift ensancha lo que una sesión lee (intentos, quiz_respuestas y usuarios ya
-- tienen los de D22c/D22d).
DROP POLICY IF EXISTS "calificaciones: techo propio o admin (R2)" ON public.calificaciones;
CREATE POLICY "calificaciones: techo propio o admin (R2)" ON public.calificaciones
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "progreso: techo propio o admin (R2)" ON public.progreso_semanas;
CREATE POLICY "progreso: techo propio o admin (R2)" ON public.progreso_semanas
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "logros: techo propio o admin (R2)" ON public.logros_alumno;
CREATE POLICY "logros: techo propio o admin (R2)" ON public.logros_alumno
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "racha: techo propio o admin (R2)" ON public.racha_actividad;
CREATE POLICY "racha: techo propio o admin (R2)" ON public.racha_actividad
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "documentos: techo propio o admin (R2)" ON public.documentos_alumno;
CREATE POLICY "documentos: techo propio o admin (R2)" ON public.documentos_alumno
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "constancias: techo propio o admin (R2)" ON public.constancias;
CREATE POLICY "constancias: techo propio o admin (R2)" ON public.constancias
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "alumnos: techo propio o admin (R2)" ON public.alumnos;
CREATE POLICY "alumnos: techo propio o admin (R2)" ON public.alumnos
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "notas: techo propio o admin (R2)" ON public.notas_alumno;
CREATE POLICY "notas: techo propio o admin (R2)" ON public.notas_alumno
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (alumno_id = auth.uid() OR public.es_admin())
  WITH CHECK (alumno_id = auth.uid() OR public.es_admin());
