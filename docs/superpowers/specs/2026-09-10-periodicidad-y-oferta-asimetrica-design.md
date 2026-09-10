# Periodicidad de cobro y oferta asimétrica — diseño

Fecha: 2026-09-10 · Autor: sesión Claude Code (Lalo) · Estado: aprobado

## Por qué

Tres clientes de la flota venden algo que la plantilla no sabe expresar:

| Cliente | Qué vende | Qué hizo |
|---|---|---|
| RHEMA #193 (8-sep) | cobro **semanal**: 13×$470 o 26×$250 | parche a mano en su clon |
| EDUHCO #197 (9-sep) | semanal **+ asimétrico**: Sec solo 3m, Prepa solo 6m | parche a mano, endurecido |
| CAU #200 (10-sep) | semanal + asimétrico + planes solo-UI | pendiente |

Cada uno pagó el mismo parche por separado y los tres divergen del `main`.
Este diseño lo sube a la plantilla en **dos PRs encadenados** para que CAU sea
el primero que no parchea nada.

El costo de no hacerlo no es teórico: si la plantilla no sabe que una cuota es
semanal, el módulo de pagos la trata como mensualidad y **la escuela cobra una
cuarta parte** de lo que vendió.

## Invariante que gobierna todo el diseño

> Con `periodicidad: 'mensual'` (el default) y sin `modalidades[].nivel`, la
> plataforma es **idéntica** a la de hoy. Mismos menús, mismas rutas, mismas
> cifras.

Es el mismo invariante que `src/lib/modo.ts` escribió para B7 y el que
`docs/personalizar-mi-pagina.md` llama «la personalización es aditiva o no es».
Son ~144 clientes compartiendo esta plantilla: actualizarla no puede moverles
nada.

---

## PR 1 — Oferta asimétrica (`feat/modalidades-por-nivel`)

### Problema

`CONFIG.modalidades` es una lista plana y todo consumidor asume el producto
cartesiano `niveles × modalidades`. Una escuela que vende Secundaria solo en 3
meses y Preparatoria solo en 6 no se puede declarar: la landing y `/register`
pintan cuatro combinaciones, y dos no existen.

⚠️ El JSON del onboarding trae esas combinaciones inexistentes como `0`. **No
son precios**: copiarlas al config anuncia «$0» en dos planes que no se venden.

### Cambio

`ModalidadPrograma` gana una clave opcional:

```ts
/** A qué nivel aplica este plan. Sin declararlo, aplica a todos. */
nivel?: Nivel
```

En `src/lib/modalidades.ts`, junto a los helpers actuales:

| Función | Qué hace |
|---|---|
| `planesPorNivel(nivel, mods?)` | las modalidades activas que ese nivel vende |
| `modalidadPorNivel(nivel, mods?)` | la única, cuando hay exactamente una |
| `getDuracionLabelPorNivel(nivel, mods?)` | «3 meses» / «3 o 6 meses» del nivel |

`modalidadPorNivel` devuelve `undefined` si hay 0 o 2+: quien llama decide si
muestra un selector o deduce el plan. No adivina.

### Consumidores

- **Landing** y **`/register`** iteran sobre `planesPorNivel()` en vez del
  cartesiano, así que es **imposible pintar un plan que no existe**.
- Cuando un nivel tiene una sola modalidad, `/register` **pierde el selector de
  plan** para ese nivel y la deduce.

### Regla de alcance (heredada, no se toca)

`modalidades.ts` ya distingue helpers **académicos** (se llaman SIN `mods`, leen
`CONFIG` porque son la definición del producto) de helpers de **precio** (se
llaman CON `mods`, la tabla fusionada con los overrides del panel). Los tres
helpers nuevos son de catálogo comercial → llevan `mods` opcional al final, con
default `CONFIG.modalidades`.

### Invariante verificable

Sin ningún `nivel` declarado, `planesPorNivel(n)` devuelve
`getModalidadesActivas()` para todo `n` — la conducta de hoy, byte por byte.

---

## PR 2 — Periodicidad de cobro (`feat/periodicidad-semanal`), sobre el PR 1

### Config (aditivo)

```ts
periodicidad: 'mensual' as Periodicidad,   // 'semanal' | 'mensual'
modalidades: [
  { id, label, meses, materiasPorMes, mensualidad, activa,
    semanas?, cuotaSemanal? },             // solo las escuelas semanales
]
```

`meses` y `materiasPorMes` **siguen gobernando el acceso académico** y no
cambian de significado. La periodicidad describe **cómo se cobra**, no cuánto
dura el programa. En CAU, Secundaria son 3 meses académicos **y** 12 semanas de
cobro: cuatro semanas por mes, y las dos cifras conviven.

El `as Periodicidad` no sobra: sin él el `as const` del objeto estrecha la clave
al literal `'mensual'` y `CONFIG.periodicidad === 'semanal'` deja de compilar
(TS2367). Mismo motivo que el `as Moneda` y el `as ModoPlataforma`.

### `src/lib/periodicidad.ts` — gemelo de `modo.ts`

Un solo lugar decide qué significa cada periodicidad. Si la lógica se repartiera
entre el sidebar, el middleware y los dashboards, en tres meses habría tres
respuestas a «¿este cliente cobra por semana?».

```ts
export function esSemanal(): boolean
export const RUTAS_PAGO_SEMANAL: string[]   // /alumno/pagos, /admin/cobranza
export const RUTAS_PAGO_MENSUAL: string[]   // /alumno/pagar, /admin/estado-cuenta
export function destinoSiEsRutaDePagoAjena(pathname: string): string | null
```

Gating en **dos capas**, como B7: sidebar para UX y **middleware** para que un
enlace pegado por WhatsApp no aterrice en una pantalla inaplicable. Se
**redirige**, no se da 404: la ruta no es inválida, es inaplicable a este
cliente.

### Base de datos

`supabase/migrations/20260911120000_periodicidad_semanal.sql`, portada de
EDUHCO (491 líneas) y reflejada al final de `scripts/schema.sql` para el
guardián de onboarding.

- **`calendario_pagos`** — una fila por semana por alumno, con el `monto`
  **congelado** al generarse.
  🛑 El calendario **no** son filas pendientes en `pagos`: todos los reportes de
  la plantilla suman `pagos.monto` sin filtrar por estado, así que 24 filas
  pendientes por alumno inflarían ingresos, KPIs y el Excel. La semana se enlaza
  al pago real (`pago_id`) cuando se cobra.
- `pagos.numero_semana`, concepto `cuota_semanal` en el CHECK.
- **`generar_calendario_por_nivel(alumno, fecha)`** — **no recibe el plan**. Lee
  semanas y cuota de `public.ajustes`, igual que `generar_matricula()` lee el
  prefijo de matrícula.
  🛑 `DROP FUNCTION` de la firma que sí lo recibía: en EDUHCO una llamada con
  los valores cruzados le generó a un alumno de preparatoria un calendario de 12
  semanas en vez de 24 — **$3,000 menos, sin ningún error**. La guardia de rol
  impedía que lo hiciera un alumno, no que lo hiciera un servidor mal
  configurado. Si la firma sigue existiendo, sigue siendo invocable.

  ⚠️ **Precisión hecha al implementar.** La firma que se elimina es la de **6
  argumentos de `generar_calendario_por_nivel`**. `generar_calendario_pagos(alumno,
  semanas, cuota, fecha)` **se conserva**: es la del ALTA MANUAL, para un alumno
  con plan fuera del catálogo — CAU gestiona así sus planes de 2 y 4 meses. Ahí
  las cifras vienen de fuera porque ese es justo el caso de uso. Se expone como
  una acción propia del panel (`plan_a_medida`), no como parámetro opcional de
  `regenerar`, para que las dos no se confundan nunca.
- `registrar_cuota_semanal`, `condonar_semana`, `estado_cuenta_semanal`.
- Guardia `calendario_pagos_autorizado()` (staff o service_role): un alumno
  recibe **42501** en las cuatro RPCs.
- Trigger que devuelve la semana a `pendiente` si se borra el pago.
- `'vencido'` se **deriva** (pendiente + fecha pasada), no se persiste: no hace
  falta cron y nunca queda desactualizado.

**⚠️ Hallazgo al implementar: la migración NO añade un CHECK a
`pagos.concepto`.** El diseño lo daba por hecho copiando de EDUHCO, pero la
plantilla **no tiene** ese CHECK — `concepto` es `TEXT NOT NULL DEFAULT
'mensualidad'` sin restricción. EDUHCO pudo imponerlo porque su BD nacía vacía;
aplicárselo a 144 bases con datos que nadie ha inventariado es la forma más
rápida de reventar una migración en producción. `'cuota_semanal'` ya es válido
sin tocar nada, y el default tampoco se mueve. Lo vigila la prueba `6b`.

La migración corre en **todos** los clientes. En uno mensual la tabla queda
vacía e inerte; hacerla condicional obligaría a un `DO $$` que la vuelve
imposible de leer. Es idempotente (`IF NOT EXISTS` / `CREATE OR REPLACE`) para
que RHEMA y EDUHCO, que ya tienen su propia versión con otro timestamp, la
apliquen sin conflicto.

### `src/lib/plan-semanal.ts`

`sincronizarPlanSemanal(admin)` refleja el plan de `config.ts` en
`public.ajustes`. Se llama desde `register-complete` y `admin/alumnos`, en el
mismo punto donde ya se llama `sincronizarPrefijoMatricula()` — antes de generar
el calendario, no en un paso de despliegue, para que no exista un paso manual
que se pueda olvidar. Nunca lanza: si `ajustes` no existe todavía, la RPC falla
con un mensaje claro y el alta del alumno no debe caerse por esto.

### `src/lib/formato.ts`

Dos funciones, no una. La distinción no es cosmética:

- `formatoPrecio()` → PRECIOS de catálogo. `0` → «Gratis».
- `formatoMXN()` → MONTOS reales. `0` es una cifra legítima y se escribe.

Aplicar la regla de precios a un monto produjo en RHEMA
«Pagado: **Incluido** de $6,500» en la pantalla de un alumno que no había pagado
nada.

### Pantallas (solo con `periodicidad: 'semanal'`)

| Ruta | Qué muestra |
|---|---|
| `/alumno/pagos` | «Semana N de M», barra de avance, tabla semana/vence/monto/estado |
| `/admin/cobranza` | «Cobranza de la semana»: alumnos con semanas vencidas, ordenados por cuántas deben, botón de WhatsApp por alumno |
| recibo | «Semana N de M», nunca «Mensualidad» |

### Panel «Personalizar mi página» — lo que RHEMA y EDUHCO no hicieron

Hoy, en los dos clientes semanales, el admin ve un campo **«Mensualidad»** que
gobierna una cuota semanal. Si lo tocan, se cuadruplica el cobro. El PR lo cierra:

- `site-config-campos.ts`: etiqueta y ayuda del campo cambian con la
  periodicidad («Cuota semanal» / «Mensualidad»).
- `site-config-validacion.ts`: acepta `cuotaSemanal` junto a `mensualidad`, con
  su propio `LIMITE_CUOTA_SEMANAL` — aplicar un tope pensado para mensualidades
  a una cuota semanal deja pasar cifras absurdas.
- `semanas` **no** es editable, por la misma razón que `meses` y
  `materiasPorMes` no lo son: es estructura del programa, no precio.
  `site-config-campos.ts:394` ya lo dice para los otros dos.

**Cuota congelada.** Publicar una cuota nueva **no toca ningún calendario
existente**; rige para quien se inscriba después. Es lo que un alumno espera
(«me inscribí a $250») y evita que un cambio de precio reescriba deuda ya
firmada. Consecuencia asumida: dos alumnos del mismo plan pueden pagar distinto,
y la ficha del alumno muestra la cuota con la que se inscribió.

---

## Pruebas

`pnpm test:unit` (Playwright). Un archivo por PR, en el estilo de
`tests/unit/modo-b7.spec.ts`:

**PR 1 — `tests/unit/modalidades-por-nivel.spec.ts`**
- sin `nivel` declarado, `planesPorNivel(n)` ≡ `getModalidadesActivas()` para
  todo nivel
- con `nivel`, cada nivel ve solo lo suyo y `modalidadPorNivel` deduce la única
- `modalidadPorNivel` devuelve `undefined` con 0 y con 2+
- un plan apagado (`activa: false`) desaparece de `planesPorNivel`

**PR 2 — `tests/unit/periodicidad.spec.ts`**
- `CONFIG.periodicidad` viene en `'mensual'` (si esto cambia, se les mueve la
  app a 144 clientes)
- con el default, `esSemanal()` es false y `destinoSiEsRutaDePagoAjena()`
  devuelve `null` para toda ruta mensual
- las rutas semanales redirigen en modo mensual y viceversa
- `formatoPrecio(0)` = «Gratis» y `formatoMXN(0)` = «$0» — la lección de RHEMA
- la validación del panel rechaza una `cuotaSemanal` fuera de
  `LIMITE_CUOTA_SEMANAL` y acepta una válida
- **la firma vieja de la RPC no existe** en el SQL de la migración (grep sobre
  el archivo: es lo único que impide que vuelva a ser invocable)

Las pruebas de conducta semanal llaman a las funciones **con la ruta como dato**,
sin encender el flag: encenderlo dejaría `CONFIG` mutado para el resto del
archivo y las pruebas se contaminarían entre sí. Es la nota que `modo-b7.spec.ts`
ya dejó escrita.

---

## Fuera de estos PRs

**Hotfix inmediato en RHEMA y EDUHCO** — riesgo vivo en producción, va primero y
por separado: la pestaña de Precios rotula «Cuota semanal» y guarda donde debe.
Se sustituye por la versión de plantilla cuando el PR 2 aterrice.

**Documento de entrega** (`scripts/entrega/`) — hoy imprime «$250/mes» sobre una
cuota semanal y resucita las combinaciones que no existen. Queda para un tercer
PR; se anota en `contexto/03-PLANTILLA-VS-SUPER-PROMPT.md`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Un cliente mensual nota algún cambio | El invariante es la primera prueba de cada PR |
| RHEMA/EDUHCO chocan al hacer pull (ya tienen la tabla) | Migración idempotente; sus timestamps son anteriores |
| La firma vieja de la RPC sobrevive en un clon | `DROP FUNCTION` explícito + prueba que lo verifica |
| El admin baja la cuota y espera que aplique a todos | Decisión documentada: congelado. La ficha muestra la cuota de inscripción |
