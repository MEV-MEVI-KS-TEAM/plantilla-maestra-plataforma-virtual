-- Panel Admin Unificado (Fase 4): agregación de ingresos por semana y por mes
-- para /admin/reportes. Server-side (GROUP BY date_trunc) — el endpoint ya no
-- necesita traer todos los pagos para sumarlos en JS.
-- Zona horaria: America/Mexico_City (los clientes MEV operan en México;
-- el server de Vercel corre en UTC y cortaría las semanas/meses 6h antes).
-- Semana inicia en lunes (date_trunc('week') es ISO). Rellena con 0 los
-- periodos sin pagos para que la serie siempre traiga num_semanas/num_meses filas.

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
      ON date_trunc('week', (p.created_at AT TIME ZONE 'America/Mexico_City')) = s.inicio
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
      ON date_trunc('month', (p.created_at AT TIME ZONE 'America/Mexico_City')) = m.inicio
   GROUP BY m.inicio
   ORDER BY m.inicio;
$$;

-- SECURITY INVOKER (default) a propósito: si un alumno la invocara directo,
-- RLS de pagos solo le agrega SUS propios pagos. El endpoint admin la llama
-- con service role y ve todo.
