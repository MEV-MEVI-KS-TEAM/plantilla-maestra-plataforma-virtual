# La escuela cobra en otra moneda (#198)

## 1. Qué resuelve

Hasta GRATIA (#198) las ~144 escuelas de la flota cobraban en pesos, así que el
formateo del dinero estaba escrito a mano allí donde hiciera falta: veintiún
archivos con `Intl.NumberFormat('es-MX', { currency: 'MXN' })`,
`toLocaleString('es-MX', …)`, un `precioMXN()` en el catálogo de diplomados, un
`formatoMXN()` en el editor de personalización y once encabezados `"(MXN)"`
escritos como literales en el `.xlsx` de reportes.

Con una escuela que cobra en dólares eso deja de ser un detalle de formato:
**un plan de 300 USD anunciado como "$300" se lee como 300 pesos, casi 17 veces
menos de lo que el alumno va a pagar.** Y basta olvidar uno de los veintiún
sitios para que ocurra en esa pantalla.

Ahora todo el dinero pasa por `src/lib/moneda.ts`, y la moneda es un dato de la
config.

## 2. Cómo se enciende en un cliente

En su `src/lib/config.ts`:

```ts
moneda:        'USD' as Moneda,   // default 'MXN'
tipoCambioMXN: 16.90,             // pesos por dólar; 0 = no mostrar equivalencia
```

Y se corre `supabase/migrations/20260910120000_moneda_pago.sql` en su Supabase
(conexión directa, **puerto 5432, nunca el pooler 6543**). En un cliente NUEVO
no hace falta: las dos columnas ya vienen en `scripts/schema.sql`.

Eso es todo. La landing, el registro, el estado de cuenta, el módulo de pagos,
el recibo PDF, el mensaje de WhatsApp y el Excel de reportes pasan a dólares.

## 3. El invariante

**Con `moneda: 'MXN'` la app es idéntica a antes de #198.** No es una intención,
es una prueba: `tests/unit/moneda.spec.ts` compara carácter a carácter la salida
de `formatearMoneda(n, cfg)` contra el `Intl.NumberFormat` que sustituyó, para
diez importes y las dos precisiones. Además:

- `conCodigo: true` no añade nada en MXN — nadie escribe "$300 MXN" en una
  landing mexicana.
- `equivalenteMXN()` y `avisoMoneda()` devuelven `null`, así que
  `<Equivalencia>` y `<AvisoMoneda>` **no pintan ni un nodo**. Por eso se pueden
  dejar puestos en la plantilla: cuando llegue el siguiente cliente en otra
  moneda ya están, y nadie tiene que acordarse de añadirlos.
- El `INSERT` de un pago no escribe `moneda` ni `tipo_cambio_aplicado` si la
  escuela cobra en pesos, así que **los clientes ya desplegados no necesitan la
  migración** para seguir registrando pagos.

## 4. El tipo de cambio se edita desde el panel

`tipoCambioMXN` está en `CLAVES_EDITABLES`: el admin lo cambia en
**Personalizar mi página → Precios**. Es deliberado — el dólar osciló entre
16.85 y 18.78 en las últimas 52 semanas, y un valor que solo vive en `config.ts`
se vuelve mentira en semanas.

`moneda` **no** es editable, por la misma razón que `niveles` o
`prefijoMatricula`: cambiarla no es cambiar la marca, es cambiar lo que se le
cobra al alumno. Vive en `config.ts` y la fija el operador. Los componentes del
editor que necesitan la moneda para *formatear* la leen de `CONFIG`
directamente; **no viaja en `ConfigEditable`**, porque lo que sale de
`recortarAEditables` es exactamente lo que el editor puede reenviar en su `PUT`,
y una clave fuera de la lista blanca se rechaza con "Clave no editable"
(fail-closed). Lo vigila el guardián 21 de `site-config-validacion.spec.ts`.

## 5. Por qué cada pago guarda su propio tipo de cambio

`pagos.tipo_cambio_aplicado` es el tipo de cambio vigente **el día en que se
registró el pago**, no el de hoy.

Sin esa columna, cada vez que el admin actualizara el tipo de cambio se
reescribirían las equivalencias de **todos los recibos ya emitidos**, incluidos
los que el alumno tiene descargados. Un recibo es un documento: dice lo que
decía el día que se emitió. Por eso `equivalenteMXN()` acepta un tipo de cambio
explícito que gana sobre el vigente, y `<Equivalencia tipoCambio={…} />` lo
propaga.

Lo mismo vale para los acumulados de reportes: un total histórico se suma con el
tipo de cambio de cada pago, nunca con `total × tipo_de_cambio_de_hoy`, o los
reportes del trimestre pasado cambian solos cada vez que alguien toca el panel.

## 6. Decisiones que no hay que "arreglar"

- **En USD se formatea con locale `en-US`.** `Intl` con `es-MX` y
  `currency: 'USD'` produce `"USD 1,500.00"` — el código delante y sin símbolo —,
  que no es como se lee un precio en dólares en ningún lado.
- **La coma es SIEMPRE decimal**, nunca separador de miles: `'16,90'` es 16.90 y
  `'1,690'` es 1.69, no mil seiscientos noventa. `tipoCambioValido()` y
  `validarDecimal()` hacen la misma lectura a propósito; si divergieran, el
  admin vería guardado un número distinto del que tecleó. Un tipo de cambio de
  cuatro cifras no cabe en el rango admitido (0–1000), así que interpretar los
  miles solo serviría para colar un dedazo.
- **El techo de 1000 en el tipo de cambio** no es una moneda imposible: es el
  freno a que un 16.90 mal tecleado como 1690 multiplique por cien todos los
  precios que ve el alumno.
- **`Widen<T>` tiene una excepción para `Moneda`.** Ensanchar `'MXN' | 'USD'` a
  `string` haría que `SiteConfig['moneda']` fuese un string cualquiera:
  `formatearMoneda(n, cfg)` dejaría de compilar y el tipo ya no impediría colar
  `'usd'` o `'pesos'` en la config. Los corchetes de `[T] extends [Moneda]` son
  necesarios para que la condición no se distribuya sobre la unión.
- **El precio real va primero y más grande; la equivalencia debajo, más chica.**
  Al revés es exactamente la lectura que hace que un alumno crea que va a pagar
  950 pesos cuando va a pagar 950 dólares.
- **El aviso es obligatorio** junto a los precios de la landing, en `/register` y
  en el estado de cuenta. Sin él, un alumno puede sostener que se le cotizó en
  pesos.

## 7. Qué NO cubre todavía

- El PDF del recibo imprime el importe con su código de moneda, pero **no** la
  equivalencia en pesos. Cuando se añada, tiene que leer
  `pagos.tipo_cambio_aplicado` de esa fila, no el vigente (§5).
- Los acumulados del Excel de reportes salen en la moneda de cobro, con los
  encabezados ya parametrizados; **no** hay una columna de equivalencia.
- No hay conversión automática de tarifas: `precios.*` y
  `modalidades[].mensualidad` son números en la moneda de la escuela. Cambiar
  `moneda` no reconvierte nada, y no debe hacerlo.
