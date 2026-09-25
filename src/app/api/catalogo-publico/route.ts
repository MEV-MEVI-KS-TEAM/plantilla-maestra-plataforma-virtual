import { NextResponse } from 'next/server'
import { listarCatalogoPublico } from '@/lib/cursos/catalogo'

/**
 * Catálogo de diplomados publicados, para el formulario de registro.
 *
 * ⚠️ POR QUÉ UN ENDPOINT Y NO UNA CONSULTA DESDE EL CLIENTE. El invariante de
 * B2 es que ningún componente cliente lee tablas `curso_*`: el navegador tiene
 * la anon key y podría repetir la consulta a mano pidiendo campos que no le
 * tocan. `/register` es 'use client', así que la lectura se hace aquí, en el
 * servidor, con `listarCatalogoPublico()` — la misma lista blanca de campos que
 * usa la landing. No sale nada de lecciones, videos, material ni exámenes.
 *
 * Es información pública: es exactamente lo que ya se ve en /diplomados.
 */
/**
 * ⚠️ DYNAMIC OBLIGATORIO. Sin esto Next prerenderiza el handler en el build
 * —salía como `○` estático— y congela su respuesta: en producción devolvía `[]`
 * para siempre, aunque la escuela publicara diplomados después. El selector del
 * registro nunca se dibujaba. En local no se nota, porque `pnpm start` sirve el
 * mismo build recién hecho contra la base ya poblada.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const catalogo = await listarCatalogoPublico()
    // Lista EXPLÍCITA, nunca `...c`: el select del registro necesita id, nombre y
    // tipo, y el precio de la ficha (Bloque C) para anunciar lo mismo que la
    // portada y /diplomados, que ya lo publican. Sin rebuild: la ruta es dinámica.
    return NextResponse.json(catalogo.map(c => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      precio_inscripcion: c.precio_inscripcion,
      precio_mensualidad: c.precio_mensualidad,
    })))
  } catch {
    // Un fallo aquí no debe tumbar el registro: el formulario simplemente no
    // ofrecerá la opción de diplomado.
    return NextResponse.json([])
  }
}
