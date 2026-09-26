-- ============================================================================
-- D20e — «ALGUIEN LO CAMBIÓ EN MEDIO» RESPONDE 409 Y NO SE CUELGA
-- (Bloque D; hallazgo de la revisión de D20a)
-- ============================================================================
-- EL PROBLEMA. Las funciones de cursos avisaban «la pantalla vio otra cosa»
-- (doble clic, otra pestaña, alguien cambió el precio o la lista) con
-- RAISE … USING ERRCODE = '40001'. Para PostgREST, 40001 es serialization_failure,
-- una falla PASAJERA: vuelve a correr la transacción, y como la condición no
-- cambia de un intento al siguiente, la reintenta SIN FIN (Supabase lo
-- documenta: «SQLSTATE 40001 in an RPC function causes infinite retries»;
-- presente en PostgREST 14, arreglado en 16). La petición se cuelga, la
-- función de Vercel se agota, se queda una conexión del pool girando y, si
-- después alguien regresa el dato a lo que la pantalla vio, el ciclo tiene
-- éxito tarde y hace lo que nadie pidió en ese momento.
--
-- LA SOLUCIÓN. PT409: PostgREST lo traduce a HTTP 409 sin reintentar. Las
-- migraciones de origen (B3, B4, C3b, D8 y D16) ya lo traen; esta migración
-- reescribe las versiones INSTALADAS: toda función de public cuyo cuerpo
-- lance ERRCODE '40001' se vuelve a crear con 'PT409' (mismo cuerpo, misma
-- firma; CREATE OR REPLACE conserva el ACL y las marcas de D7b y D20b).
-- El CHECK 21 vigila que no quede ninguna.
--
-- IDEMPOTENTE Y TRANSACCIONAL. Conexión en modo sesión (puerto 5432), nunca
-- el pooler 6543. No toca curso_ventana_limite (no lanza 40001).
-- ============================================================================

BEGIN;

DO $pt409$
DECLARE
  r   RECORD;
  v_n INTEGER := 0;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS firma, pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND p.prolang = (SELECT l.oid FROM pg_language l WHERE l.lanname = 'plpgsql')
       AND strpos(p.prosrc, 'ERRCODE = ''40001''') > 0
  LOOP
    EXECUTE replace(r.def, 'ERRCODE = ''40001''', 'ERRCODE = ''PT409''');
    v_n := v_n + 1;
    RAISE NOTICE 'D20e: % ahora responde PT409 (409) en vez de 40001.', r.firma;
  END LOOP;
  IF v_n = 0 THEN
    RAISE NOTICE 'D20e: ninguna función lanzaba 40001 (ya estaba aplicada).';
  END IF;
END
$pt409$;

NOTIFY pgrst, 'reload schema';

COMMIT;
