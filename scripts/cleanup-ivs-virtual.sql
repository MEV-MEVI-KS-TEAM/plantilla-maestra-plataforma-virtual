-- ============================================================
-- Cleanup: reemplazar 'IVS Virtual' en descripcion de materias
-- Ejecutar en clientes legacy (pre-Avantix, ~14 clientes)
-- SOLO bajo demanda: cuando el cliente reporte el error visual
-- ============================================================
-- Bug 44: seed-contenido-ivs.sql tenía hardcodeado 'IVS Virtual'
-- en el campo descripcion de las materias preparatoria.
-- Este script corrige la BD de clientes ya desplegados.
--
-- INSTRUCCIONES:
--   1. Sustituir 'NOMBRE_DEL_CLIENTE' con el nombre real antes de ejecutar
--   2. Ejecutar en el SQL Editor del proyecto Supabase del cliente
--   3. Verificar con la query SELECT al final
-- ============================================================

-- PASO 1: Actualizar descripciones (reemplaza 'NOMBRE_DEL_CLIENTE' antes de ejecutar)
UPDATE public.materias
SET descripcion = REPLACE(descripcion, 'IVS Virtual', 'NOMBRE_DEL_CLIENTE')
WHERE descripcion LIKE '%IVS Virtual%'
  AND nivel = 'preparatoria';

-- PASO 2: Verificar — debe regresar 0 filas
SELECT id, nombre, descripcion
FROM public.materias
WHERE descripcion LIKE '%IVS Virtual%';
