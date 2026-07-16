-- Panel Admin Unificado (Fase 1): tabla pagos — registro manual de pagos por admin.
-- Absorbe la función de pagos del Sistema de Control Escolar dentro de Plataforma Virtual.

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
  registrado_por   UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pagos IS 'Registro manual de pagos (inscripción/mensualidad) capturado por Control Escolar desde el panel admin.';

CREATE INDEX IF NOT EXISTS idx_pagos_alumno     ON public.pagos (alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_created_at ON public.pagos (created_at DESC);

-- RLS: admin gestiona todo (es_admin()); alumno solo SELECT de sus propios
-- pagos (alumnos.id = usuarios.id = auth.uid()). Ningún INSERT/UPDATE/DELETE
-- para alumno — los pagos siempre los registra el admin.
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos: ver propios" ON public.pagos;
CREATE POLICY "pagos: ver propios"
  ON public.pagos FOR SELECT
  USING (alumno_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "pagos: admin gestiona" ON public.pagos;
CREATE POLICY "pagos: admin gestiona"
  ON public.pagos FOR ALL
  USING (public.es_admin())
  WITH CHECK (public.es_admin());
