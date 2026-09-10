import { CONFIG } from '@/lib/config'

/**
 * ¿Este repo es la PLANTILLA MAESTRA, o el clon de una escuela?
 *
 * Las mismas ~144 escuelas que clonan la plantilla corren `pnpm test:unit` en
 * su repo, y ahí `CONFIG` ya no es el de fábrica: es el suyo. Los guardianes
 * que comparan algo contra `CONFIG` —«la paleta original calca CONFIG.colores»,
 * «COLORES_DE_FABRICA sigue sincronizada»— protegen la sincronía DE LA
 * PLANTILLA y no significan nada en el clon de un cliente, donde solo sirven
 * para dejar la suite en rojo y enseñar a ignorarla.
 *
 * 🛑 Esto NO se usa para saltar una prueba de comportamiento. Solo para los
 * guardianes de "el config de fábrica sigue diciendo lo que estas constantes
 * dan por hecho", que por definición solo pueden comprobarse aquí. Todo lo
 * demás tiene que pasar en los 144 repos.
 *
 * ⚠️ El `as string` NO SOBRA: `CONFIG` lleva `as const`, así que estas claves
 * son tipos literales ('SAMEX', 'SAM'…) y compararlas con 'MEV' en el repo de
 * un cliente es un TS2367 ("no overlap") que rompería su `tsc --noEmit`. Es el
 * mismo escape que usan `modo` y `moneda` en config.ts.
 */
export const ES_PLANTILLA =
  (CONFIG.nombre as string) === 'MEV' || (CONFIG.prefijoMatricula as string) === 'MEV'
