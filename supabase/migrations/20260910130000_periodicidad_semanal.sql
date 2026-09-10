-- ============================================================================
-- PERIODICIDAD SEMANAL — calendario de cuotas por semana.
--
-- Tres clientes de la flota cobran por SEMANA, no por mes: RHEMA #193
-- (13×$470 o 26×$250), EDUHCO #197 (12×$250 secundaria, 24×$250 preparatoria)
-- y CAU #200. Los tres lo parchearon a mano en su clon; esto lo sube a la
-- plantilla. El diseño se hereda de RHEMA y el endurecimiento de EDUHCO.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- EL INVARIANTE, y no es negociable:
--
--   Con `periodicidad: 'mensual'` (el default) esta migración es INERTE. La
--   tabla queda vacía, ninguna función se invoca y la app se comporta
--   exactamente igual que antes. Son ~144 clientes compartiendo esta
--   plantilla y actualizarla no puede moverles nada.
--
-- Por eso aquí NO se toca lo que ya existe:
--   · `pagos.concepto` conserva su DEFAULT 'mensualidad'.
--   · NO se añade un CHECK a `pagos.concepto`. Hoy es TEXT libre en toda la
--     flota; imponerle una lista cerrada a 144 bases con datos que nadie ha
--     inventariado es la forma más rápida de reventar una migración en
--     producción. 'cuota_semanal' ya es un valor válido sin tocar nada.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- DISEÑO. `public.pagos` es el LIBRO DE PAGOS REALES: cada fila es dinero que
-- entró, y todos los reportes de la plantilla (KPIs, Excel, reporte_ingresos_*,
-- estado_cuenta) suman `pagos.monto` SIN filtrar por estado. Meter ahí 12 o 24
-- filas "pendientes" por alumno inflaría los ingresos de todos ellos. El
-- CALENDARIO vive en su propia tabla y se enlaza al pago real cuando la semana
-- se cobra.
--
-- Idempotente. Correr por conexión DIRECTA (5432), nunca el pooler.
-- ============================================================================

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
