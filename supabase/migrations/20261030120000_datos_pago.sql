-- Datos bancarios para que el alumno pague por transferencia o depósito
-- (pedido de un cliente, #295: SOLO en el panel del alumno, /alumno/pagar).
--
-- SOLO SERVIDOR: RLS activa, ninguna política y ningún GRANT a anon/authenticated.
-- Los lee /api/alumno/datos-pago (sesión obligatoria) y los escribe
-- /api/admin/configuracion/datos-pago (solo admin), ambas con el service role.
-- 🛑 No van en config.ts (termina en el bundle) ni en site_config (lo lee anon).
-- Fila única. Sin fila (o activo = false) = sin bloque: nada cambia para la flota.
-- Idempotente.
BEGIN;

CREATE TABLE IF NOT EXISTS public.datos_pago (
  id          INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  activo      BOOLEAN     NOT NULL DEFAULT false,
  banco       TEXT        NOT NULL DEFAULT '',
  titular     TEXT        NOT NULL DEFAULT '',
  clabe       TEXT        NOT NULL DEFAULT '' CHECK (clabe = '' OR clabe ~ '^[0-9]{18}$'),
  tarjeta     TEXT        NOT NULL DEFAULT '' CHECK (tarjeta = '' OR tarjeta ~ '^[0-9]{16}$'),
  cuenta      TEXT        NOT NULL DEFAULT '' CHECK (cuenta = '' OR cuenta ~ '^[0-9]{8,20}$'),
  nota        TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.datos_pago ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.datos_pago FROM anon, authenticated;

COMMIT;
