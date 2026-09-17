# La portada de la escuela

La plataforma trae **dos portadas** y se elige con una sola clave de
`src/lib/config.ts`:

```ts
estiloLanding: 'animada' as EstiloLanding,   // 'animada' | 'clasica'
```

| Valor | Qué sirve | Para quién |
| --- | --- | --- |
| `'animada'` | `src/components/landing/animada/` | **Todas las escuelas nuevas.** Es lo que trae la plantilla. |
| `'clasica'` | `src/components/landing/LandingClient.tsx` | Las escuelas entregadas antes de la portada animada. |

🛑 **Una escuela que NO declara la clave se queda con la clásica.** Las ~144
copias entregadas no tienen `estiloLanding` en su `config.ts`, y cambiarle la
portada a una escuela viva tiene que ser una decisión suya, no lo que pasa la
próxima vez que alguien redespliega por otra cosa. La regla vive en
`src/lib/landing-estilo.ts` y la vigila `tests/unit/landing-animada.spec.ts`.

Para encender la portada animada en una escuela ya entregada: agregar esa clave
a su `config.ts`, `pnpm build` y desplegar. No hay nada más que migrar — las dos
portadas leen exactamente lo mismo.

## Qué trae la portada animada

En este orden, y cada sección se pinta **solo si la escuela tiene ese dato**:

1. **Hero** — logo, nombre, eslogan y la línea de propuesta, con una escena a la
   derecha que sangra por el borde (arco del color de marca, tarjetas con lo que
   vende la escuela y un círculo del acento) y sigue al puntero.
2. **Franja de indicadores** — lo que resume la oferta, calculado de los precios.
3. **¿Te identificas?** — `landing.dolor_items`.
4. **Niveles** — una tarjeta por nivel que vende, con sus planes y su
   certificación; una tercera si tiene licenciaturas.
5. **Planes y precios** — con el total del plan, y un bloque por nivel cuando los
   niveles cuestan distinto.
6. **Licenciaturas** — carreras, cómo funciona, panel del costo completo con la
   titulación desglosada y sus preguntas frecuentes. Solo con el add-on activo.
7. **Validez oficial** — documentos y folio verificable. Solo con `validezOficial.activa`.
8. **Antes y después**, **cómo funciona**, **testimonios**, **beneficios**,
   **catálogo de cursos**, **preguntas frecuentes**, **cierre**, **contacto** y **pie**.

Todo el texto sale de `CONFIG.landing` y de lo que el admin publique en
«Personalizar mi página»: la portada no tiene un solo dato de ninguna escuela
escrito en el código.

## Los colores

La portada **no define colores**: los deriva de `CONFIG.colores` —lo mismo que el
cliente edita en su panel— midiendo el contraste con los helpers de
`src/lib/contraste.ts`. Cada sección declara su cara (`claro`, `suave` u
`oscuro`) y `src/components/landing/animada/tokens.ts` decide qué color lleva
cada cosa en esa cara.

Dos reglas que están cableadas ahí, y que vienen de haberlas roto antes:

- **Dentro de los bloques oscuros no entra ningún color de marca.** Dos colores
  de marca vivos pueden dar 1.4 de contraste entre ellos aunque los dos se lean
  sobre blanco: un botón de acento dentro de un bloque del primario se empasta.
  El botón de esos bloques es blanco con letra del propio fondo, y los realces se
  derivan del fondo, no del acento.
- **El acento se usa de dos formas distintas y se calcula dos veces:** como
  relleno de botón (con su letra medida encima) y como letra sobre el papel. Un
  acento que pasa AA por poco sirve para una cosa y no para la otra.

`tests/unit/landing-animada.spec.ts` verifica los mínimos con las paletas reales
de la flota (navy + rojo, navy + oro, azul + morado, celeste, monocromática,
dorada). **Si una marca nueva rompe un mínimo, se agrega su paleta a esa lista y
se corrige `tokens.ts`:** la portada tiene que aguantar la paleta, no al revés.

## El movimiento

- Solo se animan `transform`, `translate`, `scale` y `opacity`.
- **Nada depende del JavaScript para verse:** el HTML del servidor llega completo
  y el revelado al desplazar se enciende después.
- `prefers-reduced-motion: reduce` deja la página entera quieta.

## Las tipografías

La portada animada carga Playfair Display (títulos) y Manrope (cuerpo), y sus
variables solo se cuelgan del `<body>` cuando está encendida: una escuela con la
clásica conserva las suyas letra por letra.
