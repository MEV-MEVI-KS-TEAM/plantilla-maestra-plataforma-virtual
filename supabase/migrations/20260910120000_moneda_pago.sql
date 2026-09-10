-- ============================================================================
-- MIGRACIÓN: moneda y tipo de cambio histórico en cada pago (#198 · GRATIA)
-- ============================================================================
-- Hasta GRATIA la flota entera cobraba en pesos y la moneda no hacía falta
-- guardarla: era siempre la misma. Con la primera escuela que cobra en dólares
-- aparecen dos problemas que solo la BD puede resolver.
--
-- 1. QUÉ MONEDA ERA ESTE PAGO. `pagos.monto` es un número pelado. Si mañana la
--    escuela cambia de moneda —o si alguien audita la tabla dentro de dos
--    años—, no hay forma de saber si aquel 300 eran pesos o dólares. La columna
--    lo deja escrito EN LA FILA, que es donde sobrevive a cualquier cambio de
--    config.ts.
--
-- 2. LOS RECIBOS VIEJOS NO PUEDEN REESCRIBIRSE SOLOS. La equivalencia en pesos
--    que se le enseña al alumno sale del tipo de cambio, y el tipo de cambio se
--    edita desde el panel. Sin guardar el que estaba vigente el día del pago,
--    cada vez que el admin lo actualiza cambiarían TODOS los recibos ya
--    emitidos, incluidos los que el alumno tiene descargados. Un recibo es un
--    documento: dice lo que decía el día que se emitió.
--
-- INVARIANTE: aditiva y re-ejecutable. Las dos columnas son NULLABLE y el
-- default de `moneda` es 'MXN', así que las filas que ya existen quedan
-- exactamente como estaban y una escuela en pesos no nota nada. Un pago con
-- `tipo_cambio_aplicado` NULL simplemente no pinta equivalencia.
-- ============================================================================

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'MXN';

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS tipo_cambio_aplicado NUMERIC(10,4);

-- Solo códigos ISO de 3 letras en mayúscula. No se restringe a una lista
-- cerrada: la plantilla no tiene por qué saber hoy en qué moneda cobrará el
-- cliente 200, y un CHECK con lista obligaría a una migración por moneda nueva.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pagos_moneda_iso'
  ) THEN
    ALTER TABLE public.pagos
      ADD CONSTRAINT pagos_moneda_iso CHECK (moneda ~ '^[A-Z]{3}$');
  END IF;
END $$;

-- Un tipo de cambio de 0 o negativo no es "sin equivalencia", es un dato roto:
-- para "sin equivalencia" está el NULL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pagos_tipo_cambio_positivo'
  ) THEN
    ALTER TABLE public.pagos
      ADD CONSTRAINT pagos_tipo_cambio_positivo
      CHECK (tipo_cambio_aplicado IS NULL OR tipo_cambio_aplicado > 0);
  END IF;
END $$;

COMMENT ON COLUMN public.pagos.moneda IS
  'Moneda REAL de este pago (ISO 4217). Se escribe desde CONFIG.moneda al registrarlo; no se deriva del config al leer, porque el config puede cambiar y la fila no.';

COMMENT ON COLUMN public.pagos.tipo_cambio_aplicado IS
  'Pesos por unidad de `moneda` el día del pago. NULL = sin equivalencia que mostrar. Congela el recibo: actualizar el tipo de cambio del panel no reescribe los ya emitidos.';
