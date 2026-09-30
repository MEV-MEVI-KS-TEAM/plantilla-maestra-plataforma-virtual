# PROVISIÓN DE UN CLIENTE SOLO-CURSOS

Receta para dar de alta un instituto que **solo vende diplomados** — sin
secundaria ni preparatoria. Complementa a `SETUP.md` y a
`INSTRUCCIONES-NUEVO-CLIENTE.md`: aquí solo va **lo que cambia** respecto a un
cliente tradicional.

> **Qué hace distinto este modo.** No apaga módulos: cambia cuál es la
> superficie principal. El alumno entra directo a sus diplomados, el panel
> pierde las secciones del programa académico y el registro público da de alta
> con `nivel = 'diplomado'`. Un cliente tradicional puede seguir vendiendo
> diplomados como complemento sin tocar nada de esto.

---

## 1. Las llaves de `src/lib/config.ts`

Todas viven en ese archivo. No hay variables de entorno nuevas.

### 1.1 El interruptor

```ts
modo: 'solo_cursos' as ModoPlataforma,   // default: 'tradicional'
```

Es lo único obligatorio. Con eso ya cambian menús, aterrizaje y registro.

### 1.2 Catálogo público en la landing (B5)

```ts
landing: {
  mostrarCatalogoCursos: true,                      // default: false
  catalogoTitulo:        'Nuestros diplomados',
  catalogoSubtitulo:     'Programas especializados, con acompañamiento y material descargable.',
},
```

Sin `mostrarCatalogoCursos: true` la landing no lista nada y el prospecto no
tiene por dónde entrar. Los dos textos son libres.

> ⚠️ El subtítulo por defecto **no afirma validez oficial**. No escribas «con
> validez oficial», «SEP» ni «RVOE» salvo que el cliente acredite su propio
> registro: lo que se escriba aquí sale publicado en su nombre.

### 1.3 Folio de la constancia (B4)

```ts
diploma: {
  folioPrefijo: 'IFC',                  // default: 'CONST'
  etiqueta:     'Constancia',           // 'Constancia' | 'Diploma' | 'Certificado'
  firma:        '/firma-director.png',  // PNG con alfa. Vacío = sin firma
  firmaCargo:   'Dirección Académica',
},
```

El folio es **consecutivo y global** (sale de la secuencia `curso_folio_seq`),
así que el prefijo es de nivel cliente, no por curso. Se fija **antes** de
emitir la primera constancia: cambiarlo después parte el libro de folios en dos
numeraciones y deja de servir para verificar un diploma impreso.

### 1.4 Lo de siempre

`nombre`, `nombreCompleto`, `prefijoMatricula`, `whatsapp*`, `colores`,
`dominio`, `logo`. Igual que cualquier cliente.

`niveles`, `modalidades`, `precios` y `documentosRequeridos` **se ignoran** en
este modo: son del programa académico. Déjalos como estén.

---

## 2. Base de datos

Igual que `SETUP.md`, **más el módulo de Cursos, que aquí no es opcional**:

| Paso | Archivo |
|---|---|
| Schema base | `supabase/schema.sql` (desde el Bloque E3 ya trae todo lo de las migraciones fuera del módulo Cursos, los 5 buckets base y el UNIQUE que usan los seeds) |
| Módulo de Cursos | `scripts/migracion-cursos-diplomados.sql` (bucket `cursos`) |
| Examen final | `supabase/migrations/20260728120000_examen_final_cursos.sql` |
| Parches de seguridad | los cuatro del paso 7 de `SETUP.md`: los tres `20260729*` y `20260924120000_usuarios_sin_insert_propio.sql` (en una instalación nueva S1, S2 y #185 ya vienen en `supabase/schema.sql`; en un cliente desplegado son el retrofit). Los vigilan los CHECK 22, 23 y 24 |
| Tabla 7bis de `SETUP.md`, **filas 1 a 23, en orden** | ver la tabla de abajo |

La tabla 7bis completa, en el orden en que se corre (la misma de `SETUP.md`, paso
7bis). En una base instalada con `supabase/schema.sql` las filas 1-6 y 18
re-aplican lo que el schema ya trae (son idempotentes), las 21-23 además cierran
lo del módulo y las demás son solo del módulo:

| Fila | Migración | CHECK |
|---|---|---|
| 1 | `20260716120000_pagos.sql` | — |
| 2 | `20260716130000_rol_secretario.sql` | 22 |
| 3 | `20260716140000_bucket_recibos.sql` | — |
| 4 | `20260716150000_reporte_ingresos.sql` | — |
| 5 | `20260716160000_estado_cuenta.sql` | — |
| 6 | `20260717120000_pagos_fecha_pago.sql` | — |
| 7 | `20260730120000_b1_fundacion_solo_cursos.sql` (B1) | — |
| 8 | `20260730130000_b2_gate_ventana_cursos.sql` (B2) | — |
| 9 | `20260730140000_b3_abrir_mes_y_pagos_curso.sql` (B3) | — |
| 10 | `20260730150000_b4_constancia_y_eventos.sql` (B4) | — |
| 11 | `20260730160000_b6_reportes_por_vertical.sql` (B6) | — |
| 12 | `20260730170000_b7_estado_cuenta_excluye_diplomado.sql` (B7) | — |
| 13 | `20260730180000_b82_emision_manual_con_actor.sql` (B8.2) | 20 |
| 14 | `20260926120000_c3b_acceso_total_cursos.sql` (C3b: «Asignar» abre el curso completo si es de pago único y el mes 1 si no) | 15 |
| 15 | `20260927120000_d7b_secretario_abre_cursos.sql` (D7b) | 16 |
| 16 | `20260927130000_d8_activar_segun_ficha.sql` (D8) | 17 |
| 17 | `20260927140000_d16_curso_cobrar.sql` (D16) | 18 |
| 18 | `20260928120000_d20a_bitacora_meses_programa.sql` (D20a) | 19 |
| 19 | `20260928130000_d20b_constancia_staff.sql` (D20b) | 20 |
| 20 | `20260928140000_d20e_conflicto_pt409.sql` (D20e) | 21 |
| 21 | `20260928150000_d22b_cobranza_solo_admin.sql` (D22b) | 25 |
| 22 | `20260928160000_d22c_postgrest_directo.sql` (D22c), **después** de las filas 2 y 9 | 26 y 27 |
| 23 | `20260928170000_d22d_claves_solo_servidor.sql` (D22d) | 28, 29 y 30 |

> ⚠️ **Fila 23 (D22d): SOLO después de desplegar la app de D22d** (`main` con
> D22d-1 `fe00225` o posterior; verifícalo como dice el Paso 6, punto 5, de `SETUP.md`).
> Con una app anterior, la clave del examen final de curso (el de la constancia)
> y la del quiz y el examen mensual dejan de leerse y esas pantallas se quedan
> sin preguntas, sin avisar. Córrela **al final**: una copia vieja del paso 6 o
> de un schema reabre los privilegios.

Buckets: `supabase/schema.sql` crea 5 (`avatars`, `documentos`, `recibos`,
`materias`, `branding`) y el módulo crea `cursos`: son los **6** que usa el
código (paso 9 de `SETUP.md`).

> **El schema base de esta línea es `supabase/schema.sql`, a propósito** — no lo
> cambies por `scripts/schema.sql` aunque `SETUP.md` use ese otro. Solo
> `supabase/schema.sql` declara los buckets y sus políticas de storage
> (`avatars`, `documentos`, `recibos`, `materias`, `branding`); por la otra ruta
> llegan con las migraciones (paso 9 de `SETUP.md`).
> Las tablas `cursos` y `curso_inscripciones` no salen de ningún schema base:
> las crea `scripts/migracion-cursos-diplomados.sql`, el paso siguiente.
>
> Hasta ago-2026 este archivo además no traía `semanas.contenido`,
> `video_url_2` ni `video_url_3`; ya no es el caso
> (`20260819120000_bootstrap_drift_semanas.sql`, Bug 99 del PLAYBOOK).

**Puedes saltarte** `scripts/setup.sql` (el seed de materias, meses y las 265
preguntas del programa). Un cliente Solo-Cursos no usa nada de eso, y sembrarlo
solo deja tablas llenas que nadie consulta. Si lo corres, ya no falla: desde el
Bloque E3 `supabase/schema.sql` trae el UNIQUE `(evaluacion_id, pregunta)` que usa
su `ON CONFLICT` (antes: 42P10) y el de `documentos_alumno`, que antes solo creaba
`setup.sql` («Mis Documentos» necesita ese UNIQUE; ahora llega con el schema).
Sin seed, los CHECK 1-6, 9 y 10 de `scripts/post-setup-check.sql` salen ❌ a
propósito.

---

## 3. Los 3 pasos después de provisionar

### Paso 1 — Crear los diplomados

`/admin/cursos` → **Nuevo curso**. Por cada uno:

1. Nombre, descripción y tipo (`diplomado`).
2. Portada (JPG/PNG/WebP, máx 5 MB).
3. **Precios y ritmo** — la sección que hace que el cliente no nos necesite:

   | Campo | Qué controla |
   |---|---|
   | Inscripción | Cuota única al inscribirse. 0 = no se cobra |
   | Mensualidad | Lo que paga cada mes; es el monto propuesto al registrar el pago |
   | Horas | Sale en la constancia y en el catálogo público |
   | **Módulos por mes** | **Cuántos módulos abre cada mes pagado — el ritmo del curso** |
   | Duración (meses) | Tope de meses que se pueden abrir. Vacío = sin tope |
   | Intentos del examen | Cuántas veces puede presentarlo cada alumno |

4. Módulos y lecciones, en orden.
5. Preguntas del examen final, si lo va a tener.

> ⚠️ **Módulos por mes y Duración son retroactivos.** El acceso se recalcula en
> cada lectura a partir de los meses pagados, no se congela al inscribir.
> Cambiarlos con alumnos dentro les mueve lo que ven: bajarlos oculta módulos
> que ya tenían abiertos. El panel avisa antes de guardar cuando hay
> inscripciones activas. Déjalos definidos **antes** de inscribir al primero.

### Paso 2 — Publicar

Pestaña **Publicación** → `publicado`.

Un curso en **borrador** no existe para nadie fuera del panel: no aparece en el
catálogo y su página pública da 404 — el mismo 404 que un curso inexistente, a
propósito, para que no se pueda enumerar lo que está en preparación.

### Paso 3 — Verificar el catálogo

1. Abre la landing sin sesión: la sección de diplomados debe listar los
   publicados.
2. Entra a uno: temario (títulos de módulo), precios y el botón de WhatsApp.
3. Comprueba que el botón abre WhatsApp con el nombre del diplomado precargado.
4. En móvil: las tarjetas van en una columna y el botón ocupa el ancho.

Si la sección no sale: o `mostrarCatalogoCursos` sigue en `false`, o no hay
ningún curso en `publicado`.

---

## 4. Cómo entra un alumno

No hay autoinscripción ni pasarela de pago: **la conversión es por WhatsApp**.

```
Prospecto → landing → /diplomados/[id] → WhatsApp → el admin o el secretario lo inscribe
```

1. El alumno se registra en `/register`, o el admin o el secretario lo da de
   alta desde `/admin/alumnos` (D21a). **Las dos puertas producen la misma fila**: el servidor
   pone `nivel = 'diplomado'` y `modalidad = NULL`, ignorando lo que venga en la
   petición. No se pide nivel ni modalidad en ninguna de las dos.
2. El admin o el secretario lo inscribe al diplomado desde `/admin/cursos/[id]`
   → Alumnos (D7b).
3. Registra el pago. Si es mensualidad, **Abrir mes** libera el siguiente bloque
   de módulos.
4. Al aprobar el examen, **el admin o el secretario emite la constancia** con
   «Constancia» en la fila del alumno (curso → Alumnos); el folio guarda quién
   lo emitió y una inscripción cancelada no recibe folio (D20b).
   **La emisión es manual a propósito** (B8.2): el folio es
   permanente e irrepetible, así que un humano verifica antes de congelar el
   documento. No es un paso que falte automatizar — no lo "arregles" de vuelta:
   el sistema rechaza emitir sin examen aprobado, no duplica folios, y el
   alumno aprobado ve «constancia en emisión» mientras tanto.

---

## 5. Qué NO va a ver el cliente en este modo

Para que nadie lo reporte como un error:

- **Alumno**: sin Mis Materias, Calificaciones, Logros ni la constancia del
  programa. Solo Mis Diplomados y Mis Documentos. Aterriza en `/alumno/cursos`.
- **Admin**: sin Contenido (materias y meses) ni Estado de Cuenta. Quedan
  Dashboard, Alumnos, Diplomados, Reportes, Documentos, Usuarios y Configuración.
- **Secretario**: Alumnos y Diplomados. Da de alta alumnos y los marca como
  contactados (D21a); los inscribe («Asignar», «Activar según la ficha»), cobra,
  abre meses y emite la constancia (D7b, D20b). Precios y fichas de los cursos,
  cancelar, reactivar o quitar una inscripción, borrar pagos o alumnos, el
  personal (Usuarios) y «Personalizar mi página» son solo del admin.

Las URLs del programa siguen existiendo pero redirigen: un enlace viejo a
`/alumno/materias` lleva a `/alumno/cursos`, no a una pantalla rota.

---

## 6. Limitaciones conocidas

Cosas que están así **a propósito**, para que nadie las reporte como defectos ni
las "arregle" sin saber por qué existen.

### `materias.nivel` no admite `'diplomado'` — y no debe

El CHECK de `materias.nivel` acepta `secundaria`, `preparatoria`, `demo` y
`licenciatura`. **No** `diplomado`, aunque `alumnos.nivel` sí lo acepte desde B1.

No es un olvido. `materias` es el temario del PROGRAMA académico: meses, semanas,
evaluaciones, quiz semanal. Un alumno de diplomado no cursa nada de eso — su
contenido vive en `curso_modulos` y `curso_lecciones`, que son otras tablas con
otro gate (B2). Agregar `'diplomado'` al CHECK abriría un valor que **ningún
consumidor lee**: no habría forma de crear una materia de diplomado desde el
panel, ni pantalla que la mostrara. Sería un permisivo sin destinatario, y la
próxima persona que lo viera tendría que averiguar para qué sirve.

Consecuencia práctica: si un alumno de diplomado llegara a `/alumno/materias`, la
lista saldría vacía. En modo `solo_cursos` esa ruta está redirigida (ver §5), y
en un cliente híbrido el alumno de diplomado no tiene por qué entrar ahí.

### `alumnos.nivel` es de una sola escritura

Se fija al dar de alta —por registro público o por el panel— y **no hay pantalla
ni endpoint para cambiarlo después**. El `PATCH` de `/api/admin/alumnos/[id]`
solo acepta `contactado_whatsapp`.

En modo `solo_cursos` no duele: las dos puertas fuerzan `'diplomado'`, así que no
hay forma de equivocarse. Donde sí importa es en un cliente **híbrido**, donde el
admin elige el nivel a mano: si se equivoca, la corrección hoy es un `UPDATE`
directo en la base.

Queda registrado como deuda operativa. Cerrarla es una pantalla de edición de
nivel con su propia validación — no entró en esta línea porque ningún flujo de
Solo-Cursos la necesita.

---

## 7. Checklist de entrega

- [ ] `modo: 'solo_cursos'` en `config.ts`
- [ ] `landing.mostrarCatalogoCursos: true` + los dos textos
- [ ] `diploma.folioPrefijo` fijado **antes** de la primera constancia
- [ ] Identidad, colores, logo y WhatsApp del cliente
- [ ] Tabla 7bis aplicada, filas 1 a 23 (la 23 después de desplegar la app de D22d) y `post-setup-check.sql` con los CHECK 15-30 en ✅
- [ ] Los 6 buckets (`SELECT id FROM storage.buckets ORDER BY id`)
- [ ] El deploy de producción es de `main` con `fe00225` (D22d-1) o posterior
- [ ] Al menos un diplomado **publicado**, con precios y ritmo
- [ ] Catálogo visible en la landing sin sesión, y en móvil
- [ ] Un alumno de prueba: registro → inscripción → pago → abrir mes → ve el módulo
- [ ] El admin sabe crear un diplomado él solo — **es la promesa comercial**
