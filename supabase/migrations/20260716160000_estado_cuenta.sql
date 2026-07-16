-- Panel Admin Unificado (Fase 5): estado de cuenta de alumnos activos.
-- Agregación server-side para /admin/estado-cuenta (staff: admin y secretario).
--
-- REGLA DE REDACCIÓN: esta vista reporta HECHOS, no conclusiones financieras.
-- "meses_sin_pago_registrado" = meses desbloqueados que no tienen un pago de
-- concepto 'mensualidad' capturado — puede ser pago no capturado, cortesía o
-- error de captura. El sistema no puede distinguirlos, así que la UI
-- presenta el dato sin interpretarlo.

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
         a.inscripcion_pagada,  -- fuente de verdad existente; NO se recalcula desde pagos
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
      SELECT p.alumno_id, MAX(p.created_at) AS fecha_ultimo_pago
        FROM public.pagos p
       GROUP BY p.alumno_id
    ) up ON up.alumno_id = a.id
   WHERE a.activo = true
   ORDER BY u.nombre, u.apellidos;
$$;

-- SECURITY INVOKER (default): el endpoint la llama con service role y ve todo;
-- un alumno que la invocara directo solo vería su propia fila (RLS de alumnos
-- y pagos filtran por auth.uid()).
