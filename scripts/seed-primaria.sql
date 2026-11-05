-- =============================================================
-- SEED PRIMARIA — GENERADO por banco-materias-sec-prepa (scripts/generar_primaria.py).
-- NO editar aquí: se corrige primaria/ o reactivos/primaria/ y se regenera.
--
-- 18 materias · 144 semanas · 432 preguntas de quiz · 180 de examen · 431 términos de glosario.
-- Requiere la migración 20261104120000_nivel_primaria.sql de la plantilla: `materias.nivel` debe admitir
-- 'primaria'. Se corre DESPUÉS de la cadena de migraciones, nunca dentro de setup.sql.
-- Idempotente: ON CONFLICT DO NOTHING, y los ids son deterministas.
-- =============================================================

BEGIN;

INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Lectura y comprensión I', 'Aprenderás a leer con más seguridad avisos, recados, etiquetas, noticias, cuentos e instrucciones. Te sirve para entender lo que lees en el trabajo, en la calle y en tu casa.', 'primaria', 25, '', '#F59E0B', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Números y operaciones I', 'Aprenderás a leer, escribir, comparar y redondear números grandes, y a sumar y restar con ellos. Te sirve para revisar cuentas, precios y cambio, y para leer calendarios y relojes.', 'primaria', 26, '', '#10B981', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Salud y cuidado personal', 'Conoce cómo funciona tu cuerpo, cómo comer mejor, cómo prevenir enfermedades y cómo cuidar tus emociones. Aprende primeros auxilios básicos y dónde pedir ayuda en tu comunidad.', 'primaria', 27, '', '#EF4444', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('ad8652d6-df38-57f8-8149-eba7c766532c', 'Escritura I', 'Aprende a escribir con orden y sin dudas: mayúsculas, signos, oraciones, recados, ortografía básica, acentos y párrafos. Te sirve para tus mensajes, notas y trámites de todos los días.', 'primaria', 28, '', '#F97316', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Números y operaciones II', 'Aprenderás a multiplicar y dividir, a usar el residuo y a resolver problemas de compras, repartos y gastos. También verás múltiplos, divisores y el orden de las operaciones.', 'primaria', 29, '', '#059669', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('5cb0f9bc-8801-52fe-b909-707966d42435', 'Tecnología y vida digital', 'Aprenderás a usar la computadora y el celular, buscar información, escribir correos y hacer trámites en línea. También verás cómo cuidar tus datos, convivir en redes sociales y organizarte con mapas y calendario.', 'primaria', 30, '', '#3B82F6', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Lectura y comprensión II', 'Aprenderás a distinguir hechos de opiniones, leer entre líneas, entender recibos y contratos sencillos, y resumir lo que lees. Te sirve para revisar documentos, tablas y mensajes de tu vida diaria.', 'primaria', 31, '', '#D97706', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('d86645e5-326f-553b-8586-7199b6e3e75b', 'Fracciones y decimales', 'Aprenderás qué es una fracción, cómo compararla, sumarla y restarla, y cómo usar los decimales. Te sirve para el dinero, las recetas, las medidas y los precios de todos los días.', 'primaria', 32, '', '#14B8A6', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('2084297c-54dc-5483-935c-275357b40b53', 'Ciencias naturales y medio ambiente', 'Conoce cómo viven las plantas y los animales, cómo se mueve el agua y cómo cuidar tu entorno. Te ayuda a entender lo que pasa a tu alrededor y a decidir mejor en tu casa y tu comunidad.', 'primaria', 33, '', '#22C55E', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('55da446c-3b60-50cd-8e41-db9deafb1109', 'Escritura II', 'Aprende a escribir cartas, correos y avisos, llenar formatos, unir ideas con claridad, contar una experiencia y revisar tus textos. Te sirve para tus trámites, tu trabajo y tus mensajes de todos los días.', 'primaria', 34, '', '#EA580C', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Figuras y medidas', 'Aprenderás a reconocer figuras y cuerpos geométricos, y a medir longitud, perímetro, área, peso, capacidad y volumen. Sirve para comprar material, cercar un terreno o calcular cuánto cabe en una caja.', 'primaria', 35, '', '#0D9488', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Historia de México', 'Recorre la historia de México desde los pueblos originarios hasta el siglo XX, con fechas y hechos claros. Te ayuda a entender las fiestas cívicas, los símbolos patrios y el país donde vives.', 'primaria', 36, '', '#8B5CF6', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Comunicación oral y documentos personales', 'Aprende a escuchar, presentarte y explicar tus ideas con claridad. Conoce tus documentos de identidad, cómo preguntar en un trámite, resolver desacuerdos y prepararte para una entrevista de trabajo.', 'primaria', 37, '', '#EC4899', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('dd65a559-31b8-5ec2-9574-5b28222860ab', 'Cuentas útiles: dinero y economía familiar', 'Aprenderás a calcular el cambio, armar un presupuesto, sacar porcentajes y descuentos, fijar metas de ahorro y entender créditos y recibos. Son cuentas que usas en la casa, en la tienda y en el mercado.', 'primaria', 38, '', '#84CC16', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('f7644c3f-af6d-512c-99f3-1427e053077b', 'Geografía de México y mi comunidad', 'Aprende a leer mapas, conocer las 32 entidades de México, sus climas, recursos y culturas, y entender cómo se organiza tu comunidad. Te ayuda a ubicarte y a participar mejor donde vives.', 'primaria', 39, '', '#0EA5E9', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Información y gráficas', 'Aprenderás a juntar datos, leer tablas y gráficas, sacar el promedio y la moda, y entender qué tan posible es que algo pase. Te sirve para revisar recibos, noticias y cuentas de tu casa.', 'primaria', 40, '', '#65A30D', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('518e09bc-0345-519b-a865-e8d367fe69d0', 'Derechos, ciudadanía y convivencia', 'Conoce tus derechos, cómo se organiza el gobierno de México y cómo participar en tu comunidad. Aprende a convivir en paz y a pedir ayuda cuando la necesites.', 'primaria', 41, '', '#6366F1', true) ON CONFLICT DO NOTHING;
INSERT INTO public.materias (id, nombre, descripcion, nivel, orden, icono, color, activa) VALUES ('0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Trabajo y emprendimiento', 'Aprenderás a reconocer lo que sabes hacer, preparar tu currículum, conocer tus derechos laborales y calcular costos, precio y ganancia de un negocio pequeño, para decidir con más claridad en tu vida diaria.', 'primaria', 42, '', '#0284C7', true) ON CONFLICT DO NOTHING;

INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('1c8b6401-b892-51aa-b6b0-a3897c32e61c', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 1, 'Mes 1 — Lectura y comprensión I', 'Contenido del mes 1') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('b6731eae-45bb-567b-9700-6764785f3da9', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 1, 'Mes 1 — Números y operaciones I', 'Contenido del mes 1') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 2, 'Mes 2 — Salud y cuidado personal', 'Contenido del mes 2') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('cb082a92-b294-5294-8f2d-8dfb079403ad', 'ad8652d6-df38-57f8-8149-eba7c766532c', 2, 'Mes 2 — Escritura I', 'Contenido del mes 2') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('614a7590-00a0-5066-8fda-7fd112f630e8', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 3, 'Mes 3 — Números y operaciones II', 'Contenido del mes 3') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('190e803a-7183-5166-9cb8-851c4bcf2bdf', '5cb0f9bc-8801-52fe-b909-707966d42435', 3, 'Mes 3 — Tecnología y vida digital', 'Contenido del mes 3') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 4, 'Mes 4 — Lectura y comprensión II', 'Contenido del mes 4') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('ef2356a7-9ab9-5a39-ae09-3a540c434001', 'd86645e5-326f-553b-8586-7199b6e3e75b', 4, 'Mes 4 — Fracciones y decimales', 'Contenido del mes 4') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('2898d0bb-ad12-56db-91e8-54d521923ba9', '2084297c-54dc-5483-935c-275357b40b53', 5, 'Mes 5 — Ciencias naturales y medio ambiente', 'Contenido del mes 5') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('974e8f72-0af9-5772-98e3-19c4571ac6d6', '55da446c-3b60-50cd-8e41-db9deafb1109', 5, 'Mes 5 — Escritura II', 'Contenido del mes 5') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('1ed3053e-2aae-5c2b-b239-f77b5708dc77', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 6, 'Mes 6 — Figuras y medidas', 'Contenido del mes 6') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('f2e98415-87d6-5337-a3ca-5623cc720a84', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 6, 'Mes 6 — Historia de México', 'Contenido del mes 6') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('f8ae7b30-0bda-5623-87f9-a6a587ede078', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 7, 'Mes 7 — Comunicación oral y documentos personales', 'Contenido del mes 7') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('d83a5528-2564-5fb6-a7ee-92ceecfe8a23', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 7, 'Mes 7 — Cuentas útiles: dinero y economía familiar', 'Contenido del mes 7') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('8966fd85-c111-55b6-8335-5c52d025c3a1', 'f7644c3f-af6d-512c-99f3-1427e053077b', 8, 'Mes 8 — Geografía de México y mi comunidad', 'Contenido del mes 8') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('06be62fe-d3f1-5840-a36b-d5ca4cfbb656', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 8, 'Mes 8 — Información y gráficas', 'Contenido del mes 8') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('f2e33029-3df3-5dd7-8375-f33bcf0dadc6', '518e09bc-0345-519b-a865-e8d367fe69d0', 9, 'Mes 9 — Derechos, ciudadanía y convivencia', 'Contenido del mes 9') ON CONFLICT DO NOTHING;
INSERT INTO public.meses_contenido (id, materia_id, numero_mes, titulo, descripcion) VALUES ('0e86d4ba-f7bf-5616-b479-8aafba99a83e', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 9, 'Mes 9 — Trabajo y emprendimiento', 'Contenido del mes 9') ON CONFLICT DO NOTHING;

INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('2b0f1a6b-79b3-5dc9-9e5b-a342954dc7ea', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 1, 'Para qué leemos: avisos, recados y etiquetas', 'Descubre para qué sirve leer en la vida diaria y aprende a entender avisos, recados y etiquetas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir para qué sirve un texto y entender un aviso, un recado y una etiqueta.

Rosa llega a la parada del camión. Hay un papel pegado en el poste. Lo lee y se entera de que hoy no pasa su ruta. Gracias a ese papel, busca otro camino.

**¿Para qué leemos?**

Leemos para saber qué pasa, qué hacer o qué comprar. Cada texto tiene un propósito. El propósito es la razón por la que alguien lo escribió.

Antes de leer, pregúntate dos cosas. ¿Quién lo escribió? ¿Para qué lo escribió?

**Tres textos de todos los días:**

- **El aviso** informa algo a mucha gente. Dice qué pasa, dónde y cuándo.
- **El recado** es un mensaje corto para una persona. Dice quién lo manda y qué necesita.
- **La etiqueta** va pegada a un producto. Dice qué es, cuánto trae y hasta cuándo sirve.

**Ejemplo resuelto:**

Luis lee este aviso en su edificio: «Mañana no habrá agua de 9 de la mañana a 2 de la tarde. Guarda agua hoy».

1. Busca el tema: no habrá agua.
2. Busca cuándo: mañana, de 9 de la mañana a 2 de la tarde.
3. Busca qué hacer: guardar agua hoy.

**Ejemplo del recado:** «Rosa, vino el plomero. Vuelve a las 5». Quién lo manda: alguien de la casa. Qué dice: vino el plomero. Cuándo: vuelve a las 5.

**Ejemplo de la etiqueta:** «Leche 1 litro. Caduca 12/03». Qué es: leche. Cuánto trae: 1 litro. Hasta cuándo sirve: hasta el 12 de marzo.

**Lo importante:**

- Cada texto se escribe con un propósito.
- El aviso informa, el recado pide algo y la etiqueta describe un producto.
- Busca en cada uno los datos clave: qué, quién, cuándo o cuánto.

**Palabras nuevas:**

- **Propósito:** la razón por la que se escribe un texto.
- **Aviso:** texto que informa algo a muchas personas.
- **Recado:** mensaje corto que se deja para otra persona.
- **Etiqueta:** papel pegado a un producto con datos sobre él.
- **Caducar:** dejar de servir después de una fecha.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ffeb142f-dc44-5afe-ae84-2c0ae386208c', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 2, 'Letras, sílabas y palabras: leer con fluidez', 'Aprende cómo las letras forman sílabas y palabras, y practica para leer con más soltura.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás separar palabras en sílabas y leerlas con más soltura.

Doña Carmen ve en la tienda una palabra larga: «mantequilla». Al principio se detiene. Luego la lee por partes: man-te-qui-lla. Así la palabra deja de ser difícil. Leer por partes es un buen truco.

**¿Cómo se forma una palabra?**

Las letras son los dibujos que usamos para escribir. En español hay vocales y consonantes. Las vocales son a, e, i, o, u. Las demás letras son consonantes.

Una consonante sola no se puede decir; necesita una vocal. Se juntan y forman una sílaba. Por ejemplo, m y a forman «ma». Las sílabas se juntan y forman palabras.

**Cómo separar en sílabas:**

Cada sílaba lleva por lo menos una vocal. La consonante puede ir antes de la vocal, como en «ma». También puede ir después, como en «man» o «tor».

Cuenta los golpes de voz. Da un aplauso por cada uno. «Casa» tiene dos aplausos: ca-sa. Ojo con la «ll»: son dos signos, pero cuentan como una sola letra. Por eso «tortilla» se separa tor-ti-lla.

**¿Qué es leer con fluidez?**

Es leer sin trabarse, con un ritmo parejo. Se logra con práctica. Lee en voz alta un aviso o una etiqueta cada día.

**Ejemplo resuelto:**

Luis quiere leer la palabra «medicina».

1. Busca las vocales: e, i, i, a.
2. Junta cada consonante con su vocal: me-di-ci-na.
3. Lee cada sílaba despacio.
4. Dila completa: medicina.

**Lo importante:**

- Las letras forman sílabas y las sílabas forman palabras.
- Cada sílaba tiene por lo menos una vocal.
- La consonante puede ir antes o después de la vocal.
- Leer en voz alta mejora la fluidez.

**Palabras nuevas:**

- **Sílaba:** cada golpe de voz con el que se dice una palabra.
- **Vocal:** una de las letras a, e, i, o, u.
- **Fluidez:** leer sin trabarse y con ritmo parejo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('e59cb85a-5c84-54a3-8109-9d173b6378fb', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 3, 'Idea principal y detalles', 'Aprende a encontrar la idea más importante de un texto y a distinguirla de los detalles.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás encontrar la idea principal de un texto corto y sus detalles.

Rosa le cuenta a una vecina: «Ayer fui al mercado. Compré tomates, cebolla y chiles. Quiero hacer salsa para la comida del domingo». La vecina entiende de inmediato lo central. Rosa va a hacer salsa. Lo demás son datos que lo explican.

**¿Qué es la idea principal?**

La idea principal es lo más importante que dice un texto. Si quitas esa idea, el texto pierde su sentido. Muchas veces se puede decir en una sola oración.

**¿Qué son los detalles?**

Los detalles son los datos que acompañan a la idea principal. Dan más información. Responden preguntas como quién, qué, dónde, cuándo y cómo.

**Cómo encontrar la idea principal:**

1. Lee el texto completo una vez.
2. Pregúntate: ¿de qué trata casi todo el texto?
3. Di la respuesta en una oración corta.
4. Revisa que los demás datos expliquen esa oración.

**Ejemplo resuelto:**

Lee este texto: «La señora Lupe vende tamales en la esquina. Abre a las siete de la mañana. Tiene tamales de rajas, de dulce y de pollo. Todos los días se acaban temprano».

1. El texto habla de la señora Lupe y sus tamales.
2. Idea principal: la señora Lupe vende tamales en la esquina.
3. Detalles: abre a las siete, hay tres sabores y se acaban temprano.

**Lo importante:**

- La idea principal es lo más importante del texto.
- Los detalles explican o dan más datos.
- Pregúntate de qué trata casi todo el texto.
- Di la idea principal con tus propias palabras.

**Palabras nuevas:**

- **Idea principal:** lo más importante que dice un texto.
- **Detalle:** dato que acompaña a la idea principal y la explica.
- **Texto:** conjunto de oraciones que dicen algo completo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('94e748ac-d6cf-5d82-b7bb-0d8ee23162dd', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 4, 'Textos informativos: noticias y avisos', 'Aprende a leer noticias y avisos para encontrar los datos principales que cuentan.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás encontrar los datos principales de una noticia y de un aviso.

Luis escucha en el trabajo: «Cerraron una calle por una obra». Él quiere saber más. ¿Qué calle? ¿Hasta cuándo? Si lee la noticia, encuentra las respuestas. Un texto informativo sirve para eso.

**¿Qué es un texto informativo?**

Es un texto que da datos reales sobre algo. No busca contar un cuento. Busca que sepas qué pasó o qué va a pasar. Las noticias y los avisos son textos informativos.

**Las preguntas de la noticia:**

Una noticia suele responder estas preguntas:

- ¿Qué pasó?
- ¿Quién participó?
- ¿Dónde ocurrió?
- ¿Cuándo ocurrió?
- ¿Cómo y por qué ocurrió?

El titular es el título de la noticia. Léelo primero, junto con el primer párrafo.

**Las preguntas del aviso:**

Un aviso responde otras cuatro: ¿qué pasa?, ¿dónde?, ¿cuándo? y ¿qué debo hacer?

Ejemplo: «Cerrado el sábado por inventario». Qué pasa: la tienda cierra. Cuándo: el sábado. Por qué: inventario. Qué debo hacer: comprar otro día.

**Ejemplo resuelto:**

Noticia: «El sábado, vecinos de la colonia Centro limpiaron el parque. Participaron 40 personas. Querían tener un lugar limpio para los niños».

1. ¿Qué pasó? Limpiaron el parque.
2. ¿Quién? Vecinos de la colonia Centro.
3. ¿Cuándo? El sábado.
4. ¿Por qué? Querían un lugar limpio para los niños.

**Lo importante:**

- Un texto informativo da datos reales.
- La noticia responde qué, quién, dónde, cuándo, cómo y por qué.
- El aviso dice qué pasa, dónde, cuándo y qué debes hacer.

**Palabras nuevas:**

- **Informativo:** que da datos para que sepas algo.
- **Noticia:** texto que cuenta un hecho reciente.
- **Titular:** título corto que dice de qué trata la noticia.
- **Inventario:** conteo de todo lo que hay en una tienda.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('63790875-086c-5b0c-96b3-d32b6c947997', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 5, 'Textos narrativos: inicio, desarrollo y final', 'Aprende las tres partes de una historia y cómo reconocer personajes, lugar y problema en un cuento.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer el inicio, el desarrollo y el final de una historia.

Doña Carmen cuenta una anécdota en la comida. Dice dónde estaba, qué le pasó y cómo terminó todo. Todos la siguen sin perderse. Una buena historia tiene un orden. Ese orden también existe en los cuentos que lees.

**¿Qué es un texto narrativo?**

Es un texto que cuenta una historia. La historia puede ser real o inventada. Un cuento, una leyenda y una anécdota son textos narrativos.

Una anécdota es un hecho de la vida que alguien cuenta. Una leyenda es una historia antigua que se transmite de boca en boca.

**Las tres partes de una historia:**

- **Inicio:** presenta a los personajes y el lugar. Dice cómo estaban las cosas.
- **Desarrollo:** aparece un problema. Los personajes hacen algo para resolverlo.
- **Final:** el problema se resuelve o queda un resultado.

**Los personajes y el lugar**

Los personajes son quienes viven la historia. El lugar es donde ocurre. Al leer, busca quiénes son y dónde están.

**Ejemplo resuelto:**

Lee este cuento corto: «Pedro tenía una tienda en su pueblo. Un día se fue la luz y no pudo cobrar. Pidió ayuda a una vecina, que le prestó una vela y una calculadora. Pedro vendió todo el día y le dio las gracias».

1. Inicio: Pedro tiene una tienda en su pueblo.
2. Desarrollo: se va la luz y busca ayuda.
3. Final: vende todo el día y agradece.

**Lo importante:**

- Un texto narrativo cuenta una historia.
- Sus partes son inicio, desarrollo y final.
- Busca quiénes son los personajes y dónde ocurre.
- Cuenta la historia en orden con tus palabras.

**Palabras nuevas:**

- **Narrativo:** que cuenta una historia.
- **Personaje:** persona o animal que vive la historia.
- **Desarrollo:** parte de la historia donde aparece el problema.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('8f5b8122-57c5-580a-b502-d536ec9206ae', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 6, 'Vocabulario: sinónimos, antónimos y diccionario', 'Aprende qué son los sinónimos y los antónimos, y cómo buscar una palabra en el diccionario.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás encontrar sinónimos y antónimos y buscar una palabra en el diccionario.

Luis lee en un recibo la palabra «vencimiento». No la conoce. Se pregunta si es la fecha de pago. Para salir de dudas, la busca en un diccionario. Aprendió una palabra nueva y ya puede usarla.

**¿Qué son los sinónimos?**

Los sinónimos son palabras distintas que significan casi lo mismo. «Grande» y «enorme» son sinónimos. «Comenzar» y «empezar» también. Sirven para no repetir la misma palabra.

**¿Qué son los antónimos?**

Los antónimos son palabras que significan lo contrario. «Caliente» es antónimo de «frío». «Subir» es antónimo de «bajar».

**¿Cómo se usa el diccionario?**

El diccionario ordena las palabras como el abecedario. Sigue estos pasos:

1. Mira la primera letra de la palabra.
2. Busca esa letra en el diccionario.
3. Fíjate en la segunda letra, y luego en la tercera.
4. Lee el significado que aparece junto a la palabra.

**Ejemplo resuelto:**

Rosa quiere buscar la palabra «rápido».

1. Empieza con r. Va a la parte de la r.
2. La segunda letra es á. Busca «ra».
3. Encuentra «rápido» y lee: que se hace en poco tiempo.
4. Un sinónimo es «veloz». Un antónimo es «lento».

**Lo importante:**

- Los sinónimos significan casi lo mismo.
- Los antónimos significan lo contrario.
- El diccionario ordena las palabras como el abecedario.
- Busca una palabra nueva cada día y úsala.

**Palabras nuevas:**

- **Sinónimo:** palabra que significa casi lo mismo que otra.
- **Antónimo:** palabra que significa lo contrario de otra.
- **Diccionario:** libro que explica el significado de las palabras.
- **Significado:** lo que quiere decir una palabra.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ff7ede3f-3bef-5d8f-8b8b-762ecf5fc34b', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 7, 'Leer instrucciones y seguir pasos', 'Aprende a leer instrucciones con cuidado y a seguir los pasos en el orden correcto.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer una instrucción y seguir sus pasos en orden.

Doña Carmen compra un sobre de gelatina. Atrás vienen unas instrucciones. Si las lee con cuidado, la gelatina queda bien. Si se salta un paso, queda aguada. Leer instrucciones es una forma de evitar errores.

**¿Qué es una instrucción?**

Una instrucción es un texto que explica cómo hacer algo. Las encuentras en recetas, medicinas, aparatos y formularios. Un formulario es una hoja que se llena con tus datos. Casi siempre vienen en pasos numerados.

**Cómo seguir instrucciones:**

1. Lee todo antes de empezar.
2. Revisa qué materiales necesitas.
3. Haz un paso a la vez, en el orden que dice.
4. Fíjate en las palabras de orden: primero, después, luego, al final.
5. Revisa al terminar que no falte nada.

**Las palabras de advertencia**

Algunas instrucciones traen palabras como «cuidado» o «no mezclar». Léelas con atención. Avisan de algo importante para tu seguridad.

**Ejemplo resuelto:**

Luis lee las instrucciones de un jabón en polvo: «1. Llena la tina con agua. 2. Agrega una taza de jabón. 3. Remoja la ropa por 30 minutos. 4. Enjuaga y exprime».

1. Luis lee los cuatro pasos antes de empezar.
2. Luis reúne la tina, el agua, el jabón y una taza.
3. Luis hace el paso 1, luego el 2 y así hasta el 4.
4. Al final, Luis revisa que no quede jabón.

**Lo importante:**

- Lee toda la instrucción antes de empezar.
- Sigue los pasos en el orden que se indica.
- Las palabras de advertencia cuidan tu seguridad.
- Si algo no queda claro, vuelve a leer ese paso.

**Palabras nuevas:**

- **Instrucción:** texto que explica cómo hacer algo paso a paso.
- **Paso:** cada acción que se hace en un orden.
- **Advertencia:** aviso sobre un riesgo o algo que debes cuidar.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('493ebe1a-d3ed-520e-894d-d4fa74789ccb', '1c8b6401-b892-51aa-b6b0-a3897c32e61c', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Para qué leemos:** Cada texto tiene un propósito. El aviso informa, el recado pide algo y la etiqueta describe un producto.

**Semana 2 — Letras, sílabas y palabras:** Las letras forman sílabas y las sílabas forman palabras. Cada sílaba tiene por lo menos una vocal.

**Semana 3 — Idea principal y detalles:** La idea principal es lo más importante del texto. Los detalles dan más datos sobre ella.

**Semana 4 — Textos informativos:** La noticia responde qué, quién, dónde, cuándo, cómo y por qué. El aviso dice qué pasa y qué debes hacer.

**Semana 5 — Textos narrativos:** Una historia tiene inicio, desarrollo y final. Busca a los personajes y el lugar.

**Semana 6 — Vocabulario:** Los sinónimos significan casi lo mismo y los antónimos significan lo contrario. El diccionario ordena las palabras como el abecedario.

**Semana 7 — Instrucciones:** Lee todo antes de empezar y sigue los pasos en orden. Pon atención a las advertencias.

**Ejercicios de repaso:**

1. Un papel en el portón dice: «Mañana se corta la luz de 10 a 12 horas». ¿Es un aviso o un recado? Respuesta: es un aviso. Informa a todos los vecinos.
2. Separa en sílabas la palabra «tortilla». Respuesta: tor-ti-lla.
3. Texto: «Ana vende flores en el mercado. Llega temprano y trae rosas rojas». ¿Cuál es la idea principal? Respuesta: Ana vende flores en el mercado. Lo demás son detalles.
4. Noticia: «El domingo, 30 vecinos pintaron la escuela para recibir a los niños». ¿Qué pasó, quién y cuándo? Respuesta: pintaron la escuela. Fueron 30 vecinos. Fue el domingo.
5. Cuento: «Luis perdió su llave. Buscó en su mochila y en la calle. La encontró en su bolsa». ¿Cuáles son el inicio, el desarrollo y el final? Respuesta: inicio, Luis perdió su llave. Desarrollo, la buscó en la mochila y en la calle. Final, la encontró en su bolsa.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f3904e90-4032-55cc-853c-30f0712276a5', 'b6731eae-45bb-567b-9700-6764785f3da9', 1, 'Leer y escribir números hasta millones', 'Aprende a leer y escribir con cifras y con letra números grandes, hasta los millones.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer y escribir números de hasta siete cifras.

Rosa ve en el papel de un terreno el número 1,250,000. No sabe cómo se lee. Los números grandes parecen difíciles. Se leen fácil si los separas en grupos.

**¿Cómo se agrupan las cifras?**

Las cifras se cuentan de tres en tres, de derecha a izquierda. Cada grupo se separa con una coma. El grupo de la derecha es el de las unidades. Le sigue el grupo de los miles. Después va el grupo de los millones.

Un millón se escribe con un 1 y seis ceros: 1,000,000. Con eso ya puedes leer el número de Rosa: 1,000,000 + 250,000 = 1,250,000. Se lee «un millón doscientos cincuenta mil».

**¿Qué hace el cero?**

El cero guarda un lugar que está vacío. Sin él, 2,015 sería 215.

**Ejemplo resuelto:**

Lee el número 3,450,208.

1. Separa los grupos: 3 | 450 | 208.
2. El grupo de los millones dice «tres millones».
3. El de los miles dice «cuatrocientos cincuenta mil»: se lee el 450 y se agrega «mil».
4. El de las unidades se lee tal cual: «doscientos ocho».
5. Comprueba: 3,000,000 + 450,000 + 208 = 3,450,208.

Ahora escribe «dos millones ochocientos mil quince».

1. Dos millones se escribe con un 2 en el grupo de los millones.
2. Ochocientos mil se escribe 800 en el grupo de los miles.
3. Quince se escribe 015 en el grupo de las unidades. El cero guarda el lugar.
4. Junta los grupos: 2,000,000 + 800,000 + 15 = 2,800,015.

**Lo importante:**

- Las cifras se agrupan de tres en tres, de derecha a izquierda.
- Los grupos se llaman unidades, miles y millones.
- Un millón se escribe con un 1 y seis ceros.
- El cero guarda un lugar vacío.

**Palabras nuevas:**

- **Cifra:** cada uno de los símbolos del 0 al 9 con que se escribe un número.
- **Millón:** el número 1,000,000, que se escribe con un 1 y seis ceros.
- **Miles:** el grupo de tres cifras que está después de las unidades.
- **Cero:** la cifra que guarda un lugar vacío.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('73517621-87cf-5968-ba8e-f1f30ef18963', 'b6731eae-45bb-567b-9700-6764785f3da9', 2, 'Valor posicional', 'Entiende por qué una misma cifra vale distinto según el lugar donde está dentro del número.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir cuánto vale cada cifra de un número según su lugar.

Luis cobra $252 por un trabajo. Ve que el número tiene dos veces la cifra 2. ¿Valen lo mismo? No. El primer 2 vale doscientos pesos. El último 2 vale solo dos pesos. Cada cifra vale según el lugar donde está: 200 + 50 + 2 = 252.

**¿Cuáles son los lugares?**

De derecha a izquierda, los lugares son:

- Unidades.
- Decenas: grupos de 10.
- Centenas: grupos de 100.
- Unidades de millar: grupos de 1,000.
- Decenas de millar: grupos de 10,000.
- Centenas de millar: grupos de 100,000.

Cada lugar es un grupo de 10 del lugar que está a su derecha. Por eso el valor de una cifra depende de su lugar.

**Ejemplo resuelto:**

Descompón el número 5,372.

1. El 5 está en las unidades de millar. Vale 5,000.
2. El 3 está en las centenas. Vale 300.
3. El 7 está en las decenas. Vale 70.
4. El 2 está en las unidades. Vale 2.
5. Suma los valores: 5,000 + 300 + 70 + 2 = 5,372.

Ahora descompón 60,408.

1. El 6 está en las decenas de millar. Vale 60,000.
2. El 0 está en las unidades de millar. Vale 0.
3. El 4 está en las centenas. Vale 400.
4. El 0 está en las decenas. Vale 0.
5. El 8 está en las unidades. Vale 8.
6. Suma: 60,000 + 400 + 8 = 60,408.

El cero no suma nada, pero guarda el lugar.

**Lo importante:**

- Una cifra vale según el lugar donde está.
- Cada lugar es un grupo de 10 del lugar de su derecha.
- Para descomponer un número, escribe el valor de cada cifra y suma.
- El cero no suma, pero guarda su lugar.

**Palabras nuevas:**

- **Valor posicional:** lo que vale una cifra por el lugar donde está.
- **Decena:** un grupo de 10 unidades.
- **Centena:** un grupo de 100 unidades.
- **Descomponer:** separar un número en el valor de cada una de sus cifras.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('87c37fbc-3132-55b9-b92b-4a651ead35e0', 'b6731eae-45bb-567b-9700-6764785f3da9', 3, 'Suma y resta con números grandes', 'Aprende a sumar y restar números de varias cifras en columnas, y a comprobar tu resultado.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sumar y restar números de varias cifras y comprobar tu resultado.

Doña Carmen vende tamales. El sábado ganó $2,485 y el domingo ganó $1,376. Quiere saber cuánto juntó en total. Conviene trabajar por columnas. Escribe un número debajo del otro. Alinea las unidades con las unidades y las decenas con las decenas.

**¿Cómo se suma y se resta?**

Empieza siempre por la derecha. En la suma, si una columna pasa de 9, escribes la cifra de la derecha y llevas la otra a la siguiente columna. En la resta, si arriba hay menos que abajo, pides una unidad prestada a la columna de la izquierda.

**Ejemplo resuelto:**

Suma 2,485 + 1,376.

1. Unidades: 5 + 6 = 11. Escribe 1 y llevas 1.
2. Decenas: 8 + 7 + 1 = 16. Escribe 6 y llevas 1.
3. Centenas: 4 + 3 + 1 = 8.
4. Unidades de millar: 2 + 1 = 3.
5. Resultado: 2,485 + 1,376 = 3,861. Doña Carmen juntó $3,861.

Ahora resta 6,425 − 2,873.

1. Unidades: 5 − 3 = 2.
2. Decenas: 2 es menor que 7. Pides 1 centena. Esa centena vale 10 decenas; 10 + 2 = 12. Ahora 12 − 7 = 5.
3. Centenas: ahora tienes 3, menor que 8. Pides 1 unidad de millar, que vale 10 centenas: 13 − 8 = 5.
4. Unidades de millar: te quedan 5, y 5 − 2 = 3.
5. Resultado: 6,425 − 2,873 = 3,552.

**¿Cómo se comprueba?**

Suma el resultado de la resta con el número que restaste: 3,552 + 2,873 = 6,425. Sale el número del inicio, así que la resta está bien.

**Lo importante:**

- Alinea las columnas y empieza por la derecha.
- En la suma, llevas cuando una columna pasa de 9.
- En la resta, pides prestado cuando arriba hay menos.
- Comprueba la resta sumando.

**Palabras nuevas:**

- **Llevar:** pasar una cantidad a la siguiente columna al sumar.
- **Pedir prestado:** quitar una unidad a la columna de la izquierda para poder restar.
- **Comprobar:** revisar que un resultado esté bien.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ce201e9b-185f-5427-8b0e-7ef6805df614', 'b6731eae-45bb-567b-9700-6764785f3da9', 4, 'Problemas de suma y resta de la vida diaria', 'Aprende a leer un problema, elegir si sumar o restar y revisar que la respuesta tenga sentido.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás resolver problemas de suma y resta de tu vida diaria.

Rosa va al mercado. Compra jitomate, cebolla y aguacate. Quiere saber cuánto gastó y cuánto cambio le deben. Esa es una situación común. Para resolverla, sigue unos pasos fijos.

**¿Cuándo sumo y cuándo resto?**

Algunas frases te dan una pista.

- Sumas cuando juntas, agregas o buscas el total.
- Restas cuando quitas, pagas de lo que tienes, o buscas cuánto falta, cuánto sobra o cuál es la diferencia.

**Los pasos para resolver un problema:**

1. Lee el problema completo.
2. Anota los datos.
3. Mira qué te pregunta.
4. Escoge la operación y haz la cuenta.
5. Revisa si la respuesta tiene sentido.

**Ejemplo resuelto:**

Rosa compra jitomate de $38, cebolla de $22 y aguacate de $45. Paga con un billete de $200. ¿Cuánto cambio le dan?

1. Datos: $38, $22, $45 y un pago de $200.
2. El total gastado se busca sumando los precios: 38 + 22 + 45 = 105. Gastó $105.
3. Luego busca el cambio: 200 − 105 = 95. Le dan $95.
4. Revisa: 105 + 95 = 200. La cuenta cierra.

Otro problema con dos pasos. Luis tiene $3,500 ahorrados. Le pagan $1,250 extra y paga una renta de $2,100.

1. Lo que le pagan se agrega: 3,500 + 1,250 = 4,750.
2. La renta se quita: 4,750 − 2,100 = 2,650.
3. Le quedan $2,650.

Si su meta es juntar $5,000, le faltan 5,000 − 2,650 = 2,350 pesos.

**Lo importante:**

- Lee, anota los datos y mira qué se pregunta.
- Juntar o agregar es sumar. Quitar o buscar lo que falta es restar.
- Un problema puede tener más de un paso.
- Revisa la respuesta con la operación contraria.

**Palabras nuevas:**

- **Total:** lo que resulta de juntar todas las cantidades.
- **Cambio:** el dinero que te regresan cuando pagas de más.
- **Diferencia:** lo que una cantidad tiene de más que la otra.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('131e2ac8-64ae-51ae-b404-1432c5ec766a', 'b6731eae-45bb-567b-9700-6764785f3da9', 5, 'Comparar y ordenar números', 'Aprende a decir cuál número es mayor o menor y a ordenar varios números de menor a mayor.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás comparar números y ordenarlos de menor a mayor.

Luis quiere comprar un celular. Una tienda lo vende en $4,899 y otra en $4,989. ¿Cuál cuesta menos? Para saberlo, necesitas comparar los dos números.

**¿Cómo se comparan dos números?**

Sigue estos pasos.

1. Cuenta las cifras. El número con más cifras es el mayor.
2. Si tienen las mismas cifras, compara de izquierda a derecha.
3. Detente en la primera cifra distinta. La que sea mayor decide.

Los signos ayudan a escribirlo. El signo > se lee «mayor que». El signo < se lee «menor que». Su punta siempre apunta al número más pequeño.

**Ejemplo resuelto:**

Compara $4,899 y $4,989.

1. Los dos tienen cuatro cifras.
2. El primer 4 es igual en los dos.
3. En las centenas, 8 es menor que 9.
4. Entonces 4,899 < 4,989. El celular de $4,899 es más barato.
5. La diferencia es 4,989 − 4,899 = 90. Ahorra $90.

Otro caso: compara 987 y 1,050. El primero tiene tres cifras y el segundo tiene cuatro. Entonces 987 < 1,050. Entre ellos hay 1,050 − 987 = 63.

**¿Cómo se ordenan varios números?**

Escoge primero el menor. Luego el siguiente, y así hasta el mayor.

Ordena de menor a mayor: 9,870; 987; 10,200 y 9,807.

1. El de menos cifras es 987.
2. Los de cuatro cifras son 9,870 y 9,807. Compara las decenas: 0 es menor que 7. Va primero 9,807.
3. El de cinco cifras es 10,200, y va al final.

El orden es 987; 9,807; 9,870 y 10,200. Entre los dos últimos hay 10,200 − 9,870 = 330.

**Lo importante:**

- Más cifras quiere decir un número mayor.
- Con las mismas cifras, compara de izquierda a derecha.
- El signo > es «mayor que» y el signo < es «menor que».
- Para ordenar, busca siempre el menor que falte.

**Palabras nuevas:**

- **Comparar:** ver cuál de dos números es mayor, menor o igual.
- **Mayor que:** quiere decir que una cantidad es más grande que otra.
- **Menor que:** quiere decir que una cantidad es más pequeña que otra.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('45fdce63-05d7-5383-9702-73d963606c05', 'b6731eae-45bb-567b-9700-6764785f3da9', 6, 'Redondeo y estimación', 'Aprende a redondear números a la decena, la centena y el millar, y a estimar resultados.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás redondear números y estimar el resultado de una cuenta.

Rosa va a pagar en la caja. Lleva en la canasta cosas de $198, $302 y $97. Antes de pagar, quiere saber más o menos cuánto le van a cobrar. No necesita la cuenta exacta. Le basta una cuenta rápida con números redondos.

**¿Cómo se redondea?**

Redondear es cambiar un número por otro cercano que termina en ceros. Sigue estos pasos.

1. Decide a qué lugar redondeas: decena, centena o millar.
2. Mira la cifra que está justo a su derecha.
3. Si es 5 o más, el lugar sube una unidad. Si es 4 o menos, se queda igual.
4. Las cifras de la derecha se vuelven ceros.

**Ejemplo resuelto:**

Redondea 4,862 a la centena.

1. La cifra de la centena es 8.
2. La cifra de su derecha es 6. Como 6 es 5 o más, el 8 sube a 9.
3. Quedan ceros a la derecha: 4,900.

Otros casos:

- 3,417 a la centena: la cifra de la derecha es 1, así que queda 3,400.
- 487 a la decena: la cifra de la derecha es 7, así que queda 490.
- 7,450 al millar: la cifra de la derecha es 4, así que queda 7,000.

**¿Para qué sirve estimar?**

Estimar es calcular un resultado cercano, sin hacer la cuenta exacta. Redondeas los números y haces la cuenta fácil.

Rosa redondea sus compras a la centena. El 97 está cerca de 100, así que se redondea a 100: 200 + 300 + 100 = 600. La cuenta exacta es 198 + 302 + 97 = 597. La estimación estuvo muy cerca.

**Lo importante:**

- Mira la cifra a la derecha del lugar que redondeas.
- Con 5 o más, sube. Con 4 o menos, se queda igual.
- Estimar sirve para revisar que una cuenta tenga sentido.

**Palabras nuevas:**

- **Redondear:** cambiar un número por otro cercano que termina en ceros.
- **Estimar:** calcular un resultado cercano, sin hacer la cuenta exacta.
- **Millar:** un grupo de 1,000 unidades.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1ba9ee9b-1a03-56be-a845-b83723e972f9', 'b6731eae-45bb-567b-9700-6764785f3da9', 7, 'Números romanos, calendario y hora', 'Aprende a leer números romanos, a usar el calendario y a calcular cuánto tiempo pasa entre dos horas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer números romanos, usar el calendario y calcular un lapso de tiempo.

Luis ve un reloj de pared con letras en lugar de números. Son números romanos.

**¿Cómo se leen los números romanos?**

Usan letras: I es 1, V es 5, X es 10, L es 50, C es 100, D es 500 y M es 1,000.
- Si una letra va a la derecha de otra mayor, se suma. VI es 5 + 1 = 6.
- Si una letra menor va a la izquierda, se resta. IV es 5 − 1 = 4.
- Las letras I, X, C y M se repiten hasta tres veces. III es 3.

**El calendario y la hora:**

La semana tiene 7 días y el año, 12 meses. Abril, junio, septiembre y noviembre tienen 30 días; febrero, 28; los demás, 31. Cada cuatro años, casi siempre, febrero tiene 29 días. Ese año es bisiesto y tiene 365 + 1 = 366 días.

La hora tiene 60 minutos y el día tiene 24 horas. En el reloj de 24 horas, las 14:30 son las 2:30 de la tarde, porque 14 − 12 = 2.

**Ejemplo resuelto:**

Lee XLVII.

1. XL es una X antes de una L. Se resta: 50 − 10 = 40.
2. VII es 5 + 1 + 1 = 7.
3. Junta: 40 + 7 = 47.

Rosa sale a las 7:45 y llega al trabajo a las 9:10. ¿Cuánto dura el camino?

1. De 7:45 a 8:00 pasan 15 minutos.
2. De 8:00 a 9:00 pasan 60 minutos.
3. De 9:00 a 9:10 pasan 10 minutos.
4. Suma: 15 + 60 + 10 = 85. Son 85 minutos: 1 hora con 25 minutos.

**Lo importante:**

- Las letras menores a la derecha suman y a la izquierda restan.
- El año tiene 12 meses, y febrero tiene 28 días.
- Para un lapso, ve de hora en hora y suma.

**Palabras nuevas:**

- **Número romano:** número escrito con letras, como X o XLVII.
- **Año bisiesto:** año con un día más en febrero.
- **Lapso:** el tiempo que pasa entre dos momentos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('5bba9f77-22d2-5cca-8ffe-4c76a1b91860', 'b6731eae-45bb-567b-9700-6764785f3da9', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Leer y escribir números hasta millones:** Las cifras se agrupan de tres en tres, de derecha a izquierda. Los grupos son unidades, miles y millones. Un millón es 1,000,000.

**Semana 2 — Valor posicional:** Una cifra vale según su lugar. En 5,372, el 5 vale 5,000 y el 3 vale 300. El cero guarda el lugar.

**Semana 3 — Suma y resta con números grandes:** Alinea las columnas y empieza por la derecha. Llevas al sumar y pides prestado al restar. Comprueba la resta con una suma.

**Semana 4 — Problemas de suma y resta de la vida diaria:** Lee, anota los datos y mira qué te preguntan. Juntar es sumar. Quitar o buscar lo que falta es restar.

**Semana 5 — Comparar y ordenar números:** Más cifras es un número mayor. Con las mismas cifras, compara de izquierda a derecha.

**Semana 6 — Redondeo y estimación:** Mira la cifra a la derecha del lugar. Con 5 o más, sube. Con 4 o menos, se queda.

**Semana 7 — Números romanos, calendario y hora:** La letra menor a la derecha suma y a la izquierda resta. El año tiene 12 meses. Un día tiene 24 horas.

**Ejercicios de repaso:**

1. Escribe con cifras «tres millones doscientos mil cincuenta». Es 3,000,000 + 200,000 + 50 = 3,200,050.
2. Una vecina vendió $1,845 un día y $2,760 al siguiente. Suma: 1,845 + 2,760 = 4,605. Vendió $4,605. Tiene $5,000 ahorrados y paga un gasto de $4,605. Resta: 5,000 − 4,605 = 395. Le sobran $395.
3. Redondea 3,462 a la centena. La cifra de la derecha es 6, así que sube: 3,500.
4. ¿Cuál es mayor, 9,807 o 9,870? Las dos tienen cuatro cifras. En las decenas, 0 es menor que 7. Entonces 9,870 es mayor.
5. Lee XIV. XIV es X y IV: 10 + 4 = 14.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('12de90a2-74ca-56d7-a55c-095dbbb1bdc6', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 1, 'El cuerpo humano: aparatos y sistemas', 'Conoce los principales aparatos y sistemas del cuerpo y para qué sirve cada uno.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar los principales aparatos y sistemas del cuerpo y decir para qué sirve cada uno.

Después de subir una escalera, tu corazón late más rápido y respiras más hondo. Tu cuerpo respondió a la subida sin que se lo pidieras. Eso lo hacen varias partes que trabajan juntas.

**¿Qué es un aparato o un sistema?**

Un órgano es una parte del cuerpo con una tarea. El corazón y el estómago son órganos. Varios órganos que trabajan juntos forman un aparato o un sistema.

**Los principales aparatos y sistemas:**

- **Aparato digestivo.** Convierte la comida en energía. Lo forman la boca, el estómago y los intestinos.
- **Aparato respiratorio.** Lleva aire al cuerpo. Lo forman la nariz y los pulmones.
- **Sistema circulatorio.** Mueve la sangre por todo el cuerpo. El corazón es su bomba.
- **Sistema nervioso.** Manda y recibe mensajes. Lo forman el cerebro y los nervios.
- **Sistema óseo.** Los huesos sostienen el cuerpo.
- **Sistema muscular.** Los músculos mueven el cuerpo.
- **Aparato urinario.** Limpia la sangre y saca el agua que sobra. Los riñones hacen ese trabajo.

Hay otros, como el aparato reproductor y el sistema de defensa.

**Ejemplo:**

Luis come una torta a la hora del almuerzo. Así trabajan sus aparatos y sistemas:

1. La boca muerde y el estómago mezcla la comida.
2. Los intestinos toman lo útil de los alimentos.
3. La sangre lleva esa energía a los músculos.
4. El cerebro avisa cuándo ya no tiene hambre.

**Lo importante:**

- Un aparato junta órganos distintos. Un sistema junta órganos parecidos.
- Cada aparato y cada sistema tiene una tarea.
- Todos trabajan en equipo para mantenerte vivo y con energía.

**Palabras nuevas:**

- **Órgano:** parte del cuerpo que hace una tarea, como el corazón.
- **Aparato:** órganos distintos que hacen juntos una tarea, como el digestivo.
- **Sistema:** órganos del mismo tipo que hacen una tarea, como el muscular.
- **Nervio:** hilo delgado que lleva mensajes entre el cerebro y el cuerpo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('17abce22-d27d-582c-884a-905bdb9cf0ad', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 2, 'Alimentación correcta: el Plato del Bien Comer', 'Aprende los tres grupos de alimentos del Plato del Bien Comer y cómo armar comidas variadas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar los tres grupos del Plato del Bien Comer y armar una comida variada.

Doña Carmen prepara la comida del día. Pone arroz, frijoles y un poco de pollo. Después agrega calabacitas y una naranja de postre. Sin saberlo, usó los tres grupos de alimentos.

**¿Qué es el Plato del Bien Comer?**

Es una guía gráfica de México. Divide los alimentos en tres grupos. Te ayuda a combinarlos. Una alimentación correcta tiene seis características.

**Los tres grupos:**

- **Verduras y frutas.** Dan vitaminas y fibra. Ejemplos: jitomate, nopales, plátano y guayaba.
- **Cereales.** Dan energía para moverte. Ejemplos: maíz, tortilla, avena y arroz.
- **Leguminosas y alimentos de origen animal.** Ayudan al cuerpo a crecer y repararse. Ejemplos: frijol, lenteja, huevo y pescado.

**Las seis características:**

- **Completa:** lleva los tres grupos.
- **Equilibrada:** cada grupo va en su justa medida.
- **Inocua:** es segura, sin contaminantes.
- **Suficiente:** la cantidad que tu cuerpo necesita.
- **Variada:** cambias de alimentos.
- **Adecuada:** va con tus gustos, tu cultura y tu economía.

**Ejemplo:**

Rosa quiere mejorar su desayuno. Antes solo tomaba café con pan. Ahora hace esto:

1. Elige un cereal: dos tortillas o avena.
2. Agrega una leguminosa o algo de origen animal: frijoles o un huevo.
3. Suma una fruta: papaya o manzana.

Con eso su desayuno tiene los tres grupos.

**Lo importante:**

- El Plato del Bien Comer tiene tres grupos de alimentos.
- Comer bien cumple seis características, de la completa a la adecuada.
- Si tienes dudas, acude a tu centro de salud.

**Palabras nuevas:**

- **Alimentación correcta:** la que cumple las seis características: completa, equilibrada, inocua, suficiente, variada y adecuada.
- **Inocua:** que no hace daño porque no tiene contaminantes.
- **Fibra:** parte de las plantas que ayuda a digerir.
- **Leguminosa:** semilla que crece en vaina, como el frijol o la lenteja.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('db59ed62-1a82-5a81-8279-1de735beb5d2', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 3, 'Higiene y prevención de enfermedades', 'Aprende hábitos de higiene que evitan contagios y cómo cuidar tu casa, tus alimentos y tu agua.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué hábitos de higiene evitan enfermedades y cuándo debes aplicarlos.

Una persona toca el pasamanos del camión y luego se come un taco sin lavarse las manos. Los gérmenes del pasamanos pasan a su boca. Un gesto tan simple puede enfermarla.

**¿Qué es la higiene?**

La higiene son los hábitos que mantienen limpio tu cuerpo y tu entorno. Prevenir es actuar antes de enfermar. Muchas enfermedades se contagian por gérmenes que no vemos.

**Hábitos que protegen:**

- **Lavarte las manos** con agua y jabón. Frota palmas, dorso, dedos y uñas hasta hacer espuma, sin prisa.
- **Cuidar los alimentos.** Lava las frutas y verduras. Cocina bien la carne y guarda en el refrigerador lo que sobra.
- **Beber agua segura.** Hierve el agua 5 minutos desde que burbujea y guárdala tapada. Si no puedes hervirla, pregunta en tu centro de salud cómo desinfectarla.
- **Bañarte y cepillarte los dientes** todos los días.
- **Mantener limpia la casa** y tapar la basura.

**¿Cuándo lavarte las manos?**

Lávate antes de comer o cocinar. Hazlo también después de ir al baño, de toser o estornudar, y de tocar basura o animales.

**Ejemplo:**

Luis llega del trabajo y quiere cenar. Antes hace lo siguiente:

1. Moja sus manos y usa jabón.
2. Frota palmas, dedos y uñas.
3. Enjuaga con agua limpia.
4. Seca con una toalla limpia.

**Lo importante:**

- Los gérmenes son pequeños y no se ven, pero pueden enfermarte.
- Lavar tus manos es el hábito más sencillo para prevenir contagios.
- Si te sientes mal, acude a tu centro de salud.

**Palabras nuevas:**

- **Germen:** ser muy pequeño que puede causar una enfermedad.
- **Contagio:** paso de una enfermedad de una persona a otra.
- **Prevenir:** actuar antes de que ocurra un problema.
- **Potable:** agua que es segura para beber.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('d210d9bb-b1c4-53c7-a0bc-90fbff574466', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 4, 'Vacunas y servicios de salud', 'Entiende para qué sirven las vacunas y cómo encontrar servicios de salud cerca de ti.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar para qué sirven las vacunas y dónde pedir servicios de salud.

Una vecina quiere saber si su familia tiene sus vacunas al día. Busca la cartilla de vacunación y no sabe qué revisar. Después va al centro de salud y allí le explican.

**¿Qué es una vacuna?**

Una vacuna prepara las defensas del cuerpo. Así, si el germen llega, el cuerpo ya sabe cómo responder. Las vacunas ayudan a evitar enfermedades graves, como el sarampión, el tétanos y la influenza.

**Por qué importan:**

- Protegen a quien se vacuna.
- Protegen a los demás, porque hay menos contagios.
- Se aplican a niños, jóvenes y adultos.

Es importante tener tu cartilla de vacunación o de salud. Allí se anotan las vacunas que has recibido.

**¿Dónde pedir servicios de salud?**

El primer lugar es el centro de salud de tu colonia o comunidad. Allí te atienden por revisiones, vacunas y dudas. Si el caso lo requiere, el centro de salud te refiere a un hospital.

**Ejemplo:**

Rosa quiere revisar las vacunas de su familia. Hace lo siguiente:

1. Reúne las cartillas de todos.
2. Va al centro de salud más cercano.
3. Pregunta cuáles vacunas faltan y cuáles les tocan.
4. Anota la fecha de su próxima cita.

**Lo importante:**

- Las vacunas preparan las defensas del cuerpo.
- Guarda tu cartilla en un lugar seguro.
- Para saber qué vacunas te tocan, pregunta en tu centro de salud.

**Palabras nuevas:**

- **Vacuna:** medicina que prepara las defensas del cuerpo contra una enfermedad.
- **Defensas:** parte del cuerpo que lucha contra los gérmenes.
- **Cartilla:** documento donde se anotan tus vacunas.
- **Centro de salud:** lugar donde te dan atención médica básica.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('988e2f6f-ae9f-580b-8859-ad1c54459ce8', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 5, 'Salud emocional y manejo del estrés', 'Aprende a reconocer el estrés y las emociones difíciles, y qué hacer para sentirte mejor.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer señales de estrés y practicar acciones sencillas para sentirte mejor.

Luis tiene mucho trabajo y varias cuentas por pagar. Duerme poco y se enoja con facilidad. Su cuerpo y sus emociones le avisan que algo pesa demasiado.

**¿Qué es la salud emocional?**

La salud emocional es cómo manejas lo que sientes. Todas las personas sienten tristeza, enojo o miedo. Son emociones normales. Cuidarlas es parte de cuidar la salud, igual que el cuerpo.

**¿Qué es el estrés?**

El estrés es la respuesta del cuerpo ante una presión. Un poco ayuda a actuar. Mucho tiempo seguido cansa. Algunas señales son:

- Dolor de cabeza o de estómago.
- Cansancio o falta de sueño.
- Irritación o tristeza frecuente.

**Acciones que ayudan:**

- **Respira hondo.** Inhala despacio y suelta el aire más despacio.
- **Muévete.** Una caminata ayuda al cuerpo y a la mente.
- **Habla.** Cuenta lo que sientes a alguien de confianza.
- **Descansa.** Duerme y haz pausas durante el día.

**Ejemplo:**

Rosa se siente agobiada. Hace esto:

1. Se detiene un momento y nota que está tensa.
2. Respira hondo varias veces.
3. Anota lo que le preocupa.
4. Llama a una amiga para platicar.

**Cuándo pedir ayuda:**

Si la tristeza o la angustia duran mucho, acude a tu centro de salud. También puedes llamar a la Línea de la Vida: 800 911 2000. La llamada es gratuita y atienden las 24 horas, todos los días. Si sientes que no puedes más o piensas en hacerte daño, llama ya a la Línea de la Vida o al 911.

**Lo importante:**

- Sentir emociones difíciles es normal.
- Respirar, moverte, hablar y descansar ayudan.
- No estás sola ni solo: pide ayuda cuando la necesites.

**Palabras nuevas:**

- **Emoción:** lo que sientes ante algo que pasa, como alegría o miedo.
- **Estrés:** respuesta del cuerpo ante una presión.
- **Angustia:** sensación de preocupación y de ahogo que no se va.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('707d4035-38e9-5423-9ed1-05c5bf4092ef', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 6, 'Prevención de adicciones', 'Entiende qué es una adicción, cómo prevenirla y dónde buscar ayuda sin juzgar a nadie.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es una adicción, cómo prevenirla y dónde buscar ayuda.

Un compañero de trabajo dice que ya no puede dejar de usar algo, aunque le causa problemas. Quiere cambiar, pero le cuesta mucho. Esto le puede pasar a cualquier persona. Hablar del tema con respeto ayuda a prevenirlo.

**¿Qué es una adicción?**

La adicción es una condición de salud. Una persona siente necesidad fuerte de usar una sustancia o de repetir una conducta. Aunque quiera parar, le resulta muy difícil. Afecta el cerebro, el cuerpo, la familia y el trabajo.

Algunas sustancias son el alcohol, el tabaco y otras drogas. También puede haber adicción a conductas, como el juego de apuestas.

**Cómo prevenirla:**

- **Infórmate** con fuentes confiables, como tu centro de salud.
- **Aprende a decir no** con calma y sin dar explicaciones largas.
- **Cuida tus emociones.** Habla con alguien cuando algo te pese.
- **Ocupa tu tiempo** en deporte, estudio, trabajo o convivencia sana.
- **Rodéate de personas** que te respeten.

**Ejemplo:**

Rosa recibe una invitación a una fiesta donde habrá alcohol. No quiere tomar. Hace lo siguiente:

1. Piensa su decisión antes de llegar.
2. Responde con calma: «No, gracias».
3. Se queda cerca de personas que la respetan.

**¿Dónde pedir ayuda?**

Una adicción se puede tratar. Acude a tu centro de salud. También puedes llamar a la Línea de la Vida: 800 911 2000. La llamada es gratuita y atienden las 24 horas, todos los días. En una emergencia, llama al 911.

**Lo importante:**

- La adicción es una condición de salud, no una falta de carácter.
- Informarte y cuidar tus emociones ayuda a prevenirla.
- Pedir ayuda a tiempo es una decisión valiente.

**Palabras nuevas:**

- **Adicción:** necesidad fuerte de usar algo, aunque cause daño.
- **Sustancia:** producto que cambia cómo funciona el cuerpo o la mente.
- **Prevención:** acciones que se toman antes de que aparezca un problema.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('7d1799ef-2315-551a-90fd-a570df92540d', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 7, 'Primeros auxilios básicos', 'Aprende acciones básicas y seguras ante accidentes comunes y cuándo llamar al 911.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás aplicar acciones básicas ante un accidente común y saber cuándo llamar al 911.

Una vecina se corta la mano mientras prepara la comida. La herida sangra y todos se ponen nerviosos. Saber qué hacer en esos primeros minutos ayuda mucho. Esa ayuda se llama primeros auxilios.

**¿Qué son los primeros auxilios?**

Son las acciones básicas que haces mientras llega ayuda médica. No sustituyen al médico. Sirven para evitar que la situación empeore.

**Antes de ayudar:**

1. Mantén la calma.
2. Revisa que el lugar sea seguro para ti y para la persona.
3. Si es grave, llama al 911.

**Acciones básicas:**

- **Cortada pequeña.** Lava con agua y jabón. Cubre con una gasa o tela limpia.
- **Sangrado.** Presiona con una tela limpia sobre la herida. No la retires si se empapa: pon otra encima.
- **Quemadura leve.** Pon la zona bajo agua fría corriente. No uses pasta dental, mantequilla ni otros remedios.
- **Golpe fuerte o caída fuerte,** sobre todo en cabeza, cuello o espalda: no muevas a la persona y llama al 911, salvo que haya peligro inmediato, como fuego.

**Llama al 911 si la persona:**

- No responde o no respira bien.
- Tiene un sangrado que no para.
- Tiene una quemadura grande o dolor fuerte en el pecho.
- Sufre convulsiones o se ahoga.

**Ejemplo:**

Luis ve que Rosa se quemó la mano con agua caliente. La quemadura es pequeña. Él pone su mano bajo el chorro de agua fría. La cubre con una tela limpia y la lleva al centro de salud.

**Lo importante:**

- Primero mantén la calma y revisa que el lugar sea seguro.
- En una emergencia grave, llama al 911.
- Evita medicinas y remedios caseros: pide indicaciones en el centro de salud.

**Palabras nuevas:**

- **Primeros auxilios:** ayuda básica que se da mientras llega atención médica.
- **Gasa:** tela suave y limpia para cubrir heridas.
- **Convulsión:** movimientos fuertes del cuerpo que la persona no controla.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('75a8efde-bb52-54ab-a989-b98eb69969f6', 'a18f0c2e-3dd0-52d2-8d9b-0f80a6aa4233', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — El cuerpo humano: aparatos y sistemas:** Varios órganos que trabajan juntos forman un aparato o un sistema. El digestivo procesa la comida. El respiratorio lleva aire. El circulatorio mueve la sangre. El nervioso manda mensajes.

**Semana 2 — Alimentación correcta: el Plato del Bien Comer:** Tiene tres grupos: verduras y frutas, cereales, y leguminosas con alimentos de origen animal. Una alimentación correcta es completa, equilibrada, inocua, suficiente, variada y adecuada.

**Semana 3 — Higiene y prevención de enfermedades:** Lava tus manos con agua y jabón antes de comer y después de ir al baño. Cuida tus alimentos y bebe agua segura.

**Semana 4 — Vacunas y servicios de salud:** Las vacunas preparan las defensas del cuerpo. Guarda tu cartilla. El centro de salud es el primer lugar para pedir atención.

**Semana 5 — Salud emocional y manejo del estrés:** Sentir emociones difíciles es normal. Respirar, moverte, hablar y descansar ayudan. Puedes llamar a la Línea de la Vida: 800 911 2000.

**Semana 6 — Prevención de adicciones:** La adicción es una condición de salud que se puede tratar. Informarte y cuidar tus emociones ayuda a prevenirla.

**Semana 7 — Primeros auxilios básicos:** Mantén la calma, revisa que el lugar sea seguro y llama al 911 si es grave. Para una herida, lava y cubre con tela limpia.

**Ejercicios de repaso:**

1. Arroz, frijoles y una naranja. ¿Qué grupos tiene? Los tres.
2. ¿Para qué sirve la cartilla? Para anotar tus vacunas y revisar cuáles faltan.
3. Una persona siente angustia por mucho tiempo. ¿Qué puede hacer? Acudir a su centro de salud o llamar a la Línea de la Vida.
4. ¿Una adicción se puede tratar? Sí, pide ayuda en tu centro de salud.
5. Una persona no responde después de una caída. ¿Qué haces? No la muevas y llama al 911.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('d95163f9-a8be-521f-99b6-547893e277d4', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 1, 'Mayúsculas, punto y coma', 'Aprende cuándo escribir con mayúscula y cómo usar el punto, la coma y el punto y coma.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás usar las mayúsculas, el punto, la coma y el punto y coma al escribir.

Rosa le manda este mensaje a una vecina: «mañana voy al mercado compro frutas verduras y pan». La vecina lo lee dos veces. No sabe dónde termina cada idea. Las mayúsculas y los signos ponen orden en lo que escribes.

**¿Cuándo uso mayúscula?**

Se escribe con mayúscula inicial en estos casos:

- La primera palabra de un texto y la que va después de un punto.
- Los nombres de personas y de lugares: Rosa, Luis, Puebla, México.

Las mayúsculas también llevan tilde (la rayita sobre la vocal): Ángel, África. Los días y los meses se escriben con minúscula: lunes, enero.

**¿Para qué sirven los signos?**

- **El punto** marca el final de una oración. Después de un punto se usa mayúscula.
- **La coma** marca una pausa corta. Separa los elementos de una lista: frutas, verduras y pan. Antes de la «y» no se pone coma.
- **El punto y coma** (;) marca una pausa más larga que la coma, pero más corta que el punto. Une dos ideas que se relacionan.

**Ejemplo resuelto:**

Rosa corrige su mensaje.

1. Pone mayúscula en la primera palabra: Mañana.
2. Separa las ideas con punto: mercado. Compro...
3. Separa la lista con comas: frutas, verduras y pan.
4. Agrega una idea relacionada, únela con punto y coma y cierra con punto.

Queda así: «Mañana voy al mercado. Compro frutas, verduras y pan; después paso a la farmacia».

**Lo importante:**

- Usa mayúscula al empezar y después de un punto.
- Los nombres de personas y de lugares llevan mayúscula.
- La coma separa los elementos de una lista.
- El punto y coma une dos ideas cercanas.

**Palabras nuevas:**

- **Mayúscula:** letra grande con la que empiezan los textos y los nombres propios.
- **Coma:** signo (,) que marca una pausa corta.
- **Punto y coma:** signo (;) que marca una pausa más larga que la coma.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c431580b-079b-5337-922e-fcbf4ac443e2', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 2, 'La oración: sujeto y predicado', 'Aprende a reconocer una oración completa y a separar el sujeto del predicado.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer una oración y separar su sujeto y su predicado.

Luis encuentra un papel en la mesa. Solo dice «tortillas». No sabe quién las compró ni qué pasó con ellas. Después encuentra otro papel: «Rosa compró tortillas». Ahora sí entiende. La segunda frase es una oración.

**¿Qué es una oración?**

Una oración es un grupo de palabras con sentido completo. Empieza con mayúscula y termina con punto. En una oración sencilla hay dos partes: el sujeto y el predicado.

**El sujeto**

El sujeto es la persona, el animal o la cosa de quien se habla. Para encontrarlo, pregunta: ¿quién hace la acción o de quién se habla? En «El camión llegó tarde», el sujeto es «El camión».

**El predicado**

El predicado es todo lo que se dice del sujeto. Siempre incluye el verbo. En el ejemplo anterior, el predicado es «llegó tarde». En «Rosa es alta», el predicado es «es alta».

A veces el sujeto no se escribe, pero se entiende. En «Compramos pan» se habla de nosotros.

**Ejemplo resuelto:**

Analizamos esta oración: «La vecina de Rosa vende tamales en la esquina».

1. Busca la acción: vende.
2. Pregunta quién vende: la vecina de Rosa. Ese es el sujeto.
3. Lo demás es el predicado: vende tamales en la esquina.

**Lo importante:**

- Una oración tiene sentido completo.
- El sujeto dice de quién se habla.
- El predicado dice lo que hace o cómo es el sujeto.
- Para hallar el sujeto, pregunta quién hace la acción.

**Palabras nuevas:**

- **Oración:** grupo de palabras con sentido completo.
- **Sujeto:** persona, animal o cosa de quien se habla.
- **Predicado:** lo que se dice del sujeto, con su acción.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('401765fd-0cb6-52e2-a166-7a86dcb04d46', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 3, 'Sustantivos, adjetivos y verbos', 'Aprende a reconocer las palabras que nombran, las que describen y las que dicen una acción.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer sustantivos, adjetivos y verbos en una oración.

Doña Carmen cuenta: «Rosa vende tamales calientes». Cada palabra hace un trabajo distinto. Unas nombran, otras dicen cómo es algo y otra dice qué se hace. Conocer ese trabajo te ayuda a escribir mejor.

**El sustantivo**

El sustantivo nombra personas, animales, cosas, lugares o ideas. Rosa, tamales, casa y mercado son sustantivos. Los nombres de personas y lugares se escriben con mayúscula: son nombres propios.

**El adjetivo**

El adjetivo dice cómo es un sustantivo. En «tamales calientes», la palabra calientes es el adjetivo. Cambia según el género y el número del sustantivo: casa blanca, patios blancos.

**El verbo**

El verbo dice una acción o un estado. Estado es cómo está o cómo es algo (ser, estar). Así terminan los verbos en su forma base: comprar, comer, vivir. El verbo cambia para indicar cuándo pasa algo: compro, compré, compraré.

**Ejemplo resuelto:**

Analizamos la oración «Luis compra pan fresco».

1. Busca la acción: compra. Es el verbo.
2. Busca los nombres: Luis y pan. Son sustantivos.
3. Busca cómo es el pan: fresco. Es el adjetivo.

**Lo importante:**

- El sustantivo nombra.
- El adjetivo dice cómo es el sustantivo.
- El verbo dice la acción o el estado.

**Palabras nuevas:**

- **Sustantivo:** palabra que nombra personas, animales, cosas o lugares.
- **Adjetivo:** palabra que dice cómo es un sustantivo.
- **Verbo:** palabra que dice una acción o un estado.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6bd652d0-96a2-5f8c-aa1b-e2533f7aa31c', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 4, 'Escribir recados y notas', 'Aprende a escribir un recado claro y corto, con los datos que la otra persona necesita.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás escribir un recado claro con los datos que la otra persona necesita.

Rosa sale de casa antes de que llegue Luis. Quiere avisarle dónde está la comida y a qué hora regresa. Deja un papel en la mesa. Ese papel es un recado. Un recado es un mensaje corto para una persona.

**¿Qué lleva un recado?**

Un buen recado responde a cuatro preguntas:

1. ¿Para quién es? Escribe el nombre al inicio.
2. ¿Qué necesita saber? Pon el mensaje en pocas oraciones.
3. ¿Cuándo y dónde? Agrega la hora, el día o el lugar.
4. ¿Quién lo manda? Firma al final.

**Consejos para escribirlo**

Usa oraciones cortas y palabras sencillas. Escribe con letra legible. Después del saludo con dos puntos, se usa mayúscula: «Luis: Salí...». Si el recado es importante, agrega la fecha.

Una nota es parecida, pero puede ser para ti. Escribe lo esencial y la fecha: «Jueves 14: pagar la luz».

**Ejemplo resuelto:**

Rosa escribe su recado paso a paso.

1. Para quién: Luis.
2. Mensaje: «Salí al mercado y los frijoles están en la estufa».
3. Cuándo: «regreso a las 3 de la tarde».
4. Firma: Rosa.

Queda así: «Luis: Salí al mercado y regreso a las 3 de la tarde. Los frijoles están en la estufa. Rosa».

**Lo importante:**

- Escribe el nombre de quien lo recibe.
- Di lo necesario en pocas oraciones.
- Incluye hora, día o lugar si hacen falta.
- Firma para que sepan quién lo escribió.

**Palabras nuevas:**

- **Recado:** mensaje corto que se deja a otra persona.
- **Firma:** nombre escrito al final para decir quién manda el mensaje.
- **Legible:** que se puede leer con facilidad.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('5a0c7f90-004e-592f-be5f-bfb2d24ff23a', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 5, 'Ortografía básica: b/v, c/s/z, h', 'Conoce reglas sencillas para escribir bien las letras b y v, c, s y z, y la h.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás aplicar reglas sencillas para escribir b y v, c, s y z, y h.

Luis quiere invitar a Rosa y escribe «imbitar». Algo no le suena bien. La ortografía es la forma correcta de escribir las palabras. Las reglas te ayudan cuando dos letras suenan igual.

**Reglas para b y v**

- Antes de b va m: hombre, también, cambio.
- Después de n va v: invitar, envolver, invierno.
- Los verbos terminados en -bir llevan b: escribir, recibir, subir. Excepto hervir, servir y vivir.
- Los verbos en -ar que en pasado terminan en -aba (yo caminaba, él trabajaba) llevan b.

**Reglas para c, s y z**

- Si la palabra lleva la letra c o z, antes de a, o, u se escribe z (zapato, zona, azúcar) y antes de e, i se escribe c (cena, cine).
- Pero muchas palabras llevan s con ese mismo sonido (sapo, semana, sol): se aprenden leyendo.
- Si una palabra termina en z, su plural lleva c: lápiz, lápices; luz, luces.
- Mira la familia de la palabra. Si lleva s, se escribe -sión (pasivo, pasión; televisor, televisión). Si lleva t, se escribe -ción (canto, canción; estar, estación).

**Reglas para h**

La h no suena, pero se escribe. Se usa en las palabras que empiezan con hue-, hie- y hui-: huevo, hueso, hielo, huir. También se usa en las formas del verbo haber: Rosa ha llegado.

**Ejemplo resuelto:**

Luis duda con «invitar».

1. Mira la letra anterior: es n.
2. Recuerda la regla: después de n va v.
3. Escribe invitar.

**Lo importante:**

- Antes de b va m, y después de n va v.
- Entre c y z: z antes de a, o, u; c antes de e, i.
- La h no suena, pero se escribe.

**Palabras nuevas:**

- **Ortografía:** forma correcta de escribir las palabras.
- **Plural:** forma de la palabra que habla de más de uno.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('003b09f1-4ff5-5c35-8fad-0fed65a4a92b', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 6, 'Acentuación: agudas, graves y esdrújulas', 'Aprende a clasificar las palabras por su sílaba fuerte y a saber cuándo llevan tilde.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás saber si una palabra es aguda, grave o esdrújula y si lleva tilde.

Rosa dice «camión» y Luis dice «camion». Al hablar suenan igual, pero al escribir una lleva tilde. La tilde es la rayita (´) que va sobre una vocal. Para saber cuándo se pone, hay que oír la sílaba fuerte de cada palabra.

**La sílaba fuerte**

Las palabras se dividen en sílabas, como ca-mión. En cada palabra, una sílaba suena con más fuerza. Esa es la sílaba tónica. Di la palabra en voz alta y marca con la voz la sílaba que suena más fuerte.

**Los tres tipos de palabras**

- **Agudas:** la fuerza cae en la última sílaba: ca-fé, ja-más, pa-pel. Llevan tilde si terminan en n, s o vocal: camión, café, jamás. Papel no lleva tilde.
- **Graves:** la fuerza cae en la penúltima sílaba: ár-bol, fá-cil, me-sa. Llevan tilde si no terminan en n, s o vocal: árbol, fácil. Mesa no lleva tilde.
- **Esdrújulas:** la fuerza cae en la antepenúltima sílaba: te-lé-fo-no, mú-si-ca. Siempre llevan tilde.

**Ejemplo resuelto:**

Luis duda con «lapiz».

1. Divide en sílabas: la-piz.
2. La fuerza cae en la penúltima: es grave.
3. Termina en z, no en n, s ni vocal. Lleva tilde: lápiz.

**Lo importante:**

- Busca la sílaba fuerte de la palabra.
- Aguda: última sílaba. Grave: penúltima. Esdrújula: antepenúltima.
- Las esdrújulas siempre llevan tilde.

**Palabras nuevas:**

- **Sílaba:** cada golpe de voz al decir una palabra (ca-mión tiene dos).
- **Tilde:** rayita que se escribe sobre una vocal.
- **Sílaba tónica:** la sílaba que suena con más fuerza.
- **Esdrújula:** palabra con la fuerza en la antepenúltima sílaba.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c1d168ef-ac04-57b1-b6fb-3e9a8dfe69b6', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 7, 'Escribir un párrafo con orden', 'Aprende a escribir un párrafo con una idea principal, detalles en orden y un cierre.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás escribir un párrafo con una idea principal, detalles en orden y un cierre.

Luis tiene que explicar en un formato cómo es su sábado. Escribe todo mezclado y nadie lo entiende. Un párrafo es un grupo de oraciones sobre un mismo tema. Si sigue un orden, se lee con facilidad.

**Las partes de un párrafo**

En Lectura y comprensión I viste la idea principal y los detalles. Un párrafo bien escrito las usa.

1. **Idea principal:** la primera oración dice de qué trata el párrafo.
2. **Detalles:** las siguientes oraciones dan datos sobre esa idea.
3. **Cierre:** una última oración termina el tema.

**Palabras que ordenan**

Unas palabras ayudan a seguir el orden: primero, luego, después, al final. Se llaman conectores. Un párrafo empieza con mayúscula y termina con punto y aparte. Eso quiere decir que sigues en otro renglón.

**Ejemplo resuelto:**

Luis escribe sobre su sábado.

1. Elige el tema: su sábado.
2. Escribe la idea principal: «Mi sábado empieza temprano».
3. Agrega los detalles con conectores.
4. Escribe un cierre.
5. Revisa mayúsculas y puntos.

Queda así: «Mi sábado empieza temprano. Primero barro la casa. Luego voy al mercado por frutas y verduras. Al final preparo la comida. Es un día muy ocupado».

**Lo importante:**

- La primera oración dice el tema.
- Los detalles van en orden.
- El cierre termina la idea.
- Revisa mayúsculas, comas y puntos.

**Palabras nuevas:**

- **Párrafo:** grupo de oraciones sobre un mismo tema.
- **Conector:** palabra que ayuda a seguir el orden de las ideas.
- **Punto y aparte:** punto que cierra un párrafo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9d4dbaf5-0f75-5cd8-b020-93b04fd49e13', 'cb082a92-b294-5294-8f2d-8dfb079403ad', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Mayúsculas, punto y coma:** Se escribe mayúscula al empezar y después de un punto. El punto cierra la oración; la coma separa una lista; el punto y coma une dos ideas cercanas.

**Semana 2 — La oración: sujeto y predicado:** Una oración tiene sentido completo. El sujeto dice de quién se habla. El predicado dice lo que se cuenta de él.

**Semana 3 — Sustantivos, adjetivos y verbos:** El sustantivo nombra, el adjetivo dice cómo es y el verbo dice la acción.

**Semana 4 — Escribir recados y notas:** Un recado lleva para quién es, el mensaje, la hora o el lugar y la firma.

**Semana 5 — Ortografía básica: b/v, c/s/z, h:** Antes de b va m. Después de n va v. Los plurales de las palabras en z llevan c.

**Semana 6 — Acentuación: agudas, graves y esdrújulas:** Busca la sílaba fuerte. Las esdrújulas siempre llevan tilde.

**Semana 7 — Escribir un párrafo con orden:** Un párrafo tiene idea principal, detalles en orden y cierre.

**Ejercicios de repaso:**

1. Corrige: «el lunes rosa compra pan leche y huevos; después va a casa».
   - Solución: «El lunes Rosa compra pan, leche y huevos; después va a casa».
2. Analiza: «Rosa compra frutas frescas».
   - Solución: el sujeto es Rosa. Compra es verbo, frutas es sustantivo y frescas es adjetivo.
3. Un recado dice: «Salí al banco y regreso a las 5». ¿Qué le falta?
   - Solución: le falta el nombre de quien lo recibe y la firma.
4. Completa y acentúa: tam_ién, _apato, _ielo, cancion.
   - Solución: también (después de m se escribe b), zapato, hielo y canción (aguda que termina en n).
5. Ordena con conectores: «Preparo la comida. Barro la casa. Mi sábado empieza temprano».
   - Solución: «Mi sábado empieza temprano. Primero barro la casa. Al final preparo la comida».

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('5be1633e-994a-5a2c-a00b-a9890397824c', '614a7590-00a0-5066-8fda-7fd112f630e8', 1, 'La multiplicación y las tablas', 'Entiende la multiplicación como una suma que se repite y aprende a usar las tablas para calcular más rápido.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás usar la multiplicación y las tablas cuando una cantidad se repite.

Rosa compra 4 bolsas de tortillas. Cada bolsa cuesta $15. Puede sumar 15 + 15 + 15 + 15 = 60. Pero hay un camino más corto.

**¿Qué es multiplicar?**

Multiplicar es sumar la misma cantidad varias veces. El signo es ×. Se lee «por». La cuenta 4 × 15 se lee «4 por 15».

Los números que se multiplican se llaman factores. El resultado se llama producto.

**Las tablas de multiplicar:**

Una tabla es la lista de resultados de un número por 1, por 2, por 3 y así hasta el 10. Si te sabes las tablas, calculas más rápido. La tabla del 6 va de 6 en 6: 6, 12, 18, 24, 30, 36, 42, 48, 54, 60.

**Reglas que ayudan:**

- El orden no cambia el producto: 3 × 7 = 21 y 7 × 3 = 21.
- Un número por 1 queda igual: 9 × 1 = 9.
- Un número por 0 da 0: 9 × 0 = 0.
- Por 10 se agrega un cero al final: 8 × 10 = 80.

**Ejemplo resuelto:**

Rosa quiere saber cuánto paga por las 4 bolsas de $15.

1. Separa el 15 en 10 y 5.
2. Multiplica cada parte: 4 × 10 = 40 y 4 × 5 = 20.
3. Suma los resultados: 40 + 20 = 60.

Rosa paga $60. Luis compra 7 cajas con 6 huevos cada una. Para saber cuántos huevos lleva, calcula 7 × 6 = 42.

**Lo importante:**

- Multiplicar es sumar la misma cantidad varias veces.
- Las tablas te ayudan a calcular sin sumar una por una.
- El orden de los factores no cambia el producto.
- Por 1 queda igual y por 0 da 0.

**Palabras nuevas:**

- **Factor:** cada número que se multiplica.
- **Producto:** el resultado de una multiplicación.
- **Tabla de multiplicar:** lista de resultados de un número por 1, 2, 3 y hasta 10.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('3dd3b890-1013-5d2c-b913-4a690cfa24ed', '614a7590-00a0-5066-8fda-7fd112f630e8', 2, 'Multiplicar por varias cifras', 'Aprende a multiplicar números de dos y tres cifras separándolos por su valor posicional y sumando las partes.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás multiplicar números de varias cifras por una o dos cifras.

Luis vende 35 vasos de jugo cada día. Trabaja 24 días al mes. ¿Cuántos vasos vende en total? La cuenta es 35 × 24. Tiene dos cifras en cada lado, pero se resuelve por partes.

**Multiplicar por una cifra**

Ya viste el valor posicional: cada cifra vale según su lugar. Usa esa idea. Separa el número grande en centenas, decenas y unidades.

Para 3 × 125, separa 125 = 100 + 20 + 5. Luego multiplica cada parte por 3: 3 × 100 = 300, 3 × 20 = 60 y 3 × 5 = 15. Al final suma: 300 + 60 + 15 = 375.

**Multiplicar por 10, 100 y 1,000**

Cada vez agregas ceros al número. Por 10, un cero. Por 100, dos ceros. Por 1,000, tres ceros. Así, 12 × 100 = 1,200.

**Multiplicar por dos cifras**

Se multiplica primero por las unidades. Después se multiplica por las decenas. Al final se suman los dos resultados.

**Ejemplo resuelto:**

Luis quiere saber cuántos vasos vende en 24 días. Calcula 35 × 24.

1. Multiplica por las unidades, que son 4: 35 × 4 = 140.
2. Multiplica por las decenas. El 2 vale 20: 35 × 20 = 700.
3. Suma los dos resultados: 140 + 700 = 840.

Luis vende 840 vasos en 24 días.

**Lo importante:**

- Separa el número por su valor posicional y multiplica cada parte.
- Después suma los resultados.
- Con dos cifras, multiplica por las unidades y luego por las decenas.
- Por 10, 100 o 1,000 solo agregas ceros.

**Palabras nuevas:**

- **Unidades:** las cifras que valen de 1 en 1, como el 4 en 24.
- **Decenas:** las cifras que valen de 10 en 10, como el 2 en 24.
- **Cifra:** cada número que forma una cantidad, como el 3, el 5 y el 7 en 357.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('d70f12e6-c106-5e3f-92f9-b50a46275236', '614a7590-00a0-5066-8fda-7fd112f630e8', 3, 'La división: repartir y agrupar', 'Aprende a dividir para repartir cantidades en partes iguales o formar grupos, y a comprobar con la multiplicación.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás dividir para repartir y para agrupar, y comprobar el resultado.

Cuatro compañeros de trabajo comparten una comida de $480. Cada uno debe pagar lo mismo. Para saber cuánto paga cada quien, necesitas dividir.

**¿Qué es dividir?**

Dividir es partir una cantidad en partes iguales. El signo es ÷. Se lee «entre». Sirve de dos maneras.

- **Repartir:** conoces cuántas partes hay y buscas cuánto toca a cada una. 480 ÷ 4 = 120. Cada compañero paga $120.
- **Agrupar:** conoces el tamaño del grupo y buscas cuántos grupos salen. Si tienes 36 tortillas y haces paquetes de 6, calculas 36 ÷ 6 = 6. Salen 6 paquetes.

**La división y la multiplicación**

Son operaciones contrarias. Una deshace a la otra. Por eso la tabla del 6 te ayuda a dividir: como 6 × 6 = 36, entonces 36 ÷ 6 = 6.

También puedes comprobar. Multiplica el resultado por el número entre el que dividiste (el divisor). Debes llegar a la cantidad del principio (el dividendo): 4 × 120 = 480.

**Ejemplo resuelto:**

Rosa reparte $1,250 en partes iguales entre 5 personas.

1. Divide por partes: 1,000 ÷ 5 = 200.
2. Divide lo que falta: 250 ÷ 5 = 50.
3. Suma los dos resultados: 200 + 50 = 250.
4. Comprueba: 5 × 250 = 1,250.

A cada persona le tocan $250.

**Lo importante:**

- Dividir es partir una cantidad en partes iguales.
- Se puede repartir o se puede agrupar.
- La división es la operación contraria de la multiplicación.
- Para comprobar, multiplica el resultado por el divisor.

**Palabras nuevas:**

- **Dividendo:** la cantidad que se divide, como el 480.
- **Divisor:** el número entre el que se divide, como el 4.
- **Cociente:** el resultado de dividir.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('e3ac081e-f40f-544b-80e1-9f495dd69d40', '614a7590-00a0-5066-8fda-7fd112f630e8', 4, 'División con residuo', 'Aprende a dividir cuando sobra algo, a escribir el residuo y a decidir qué hacer con lo que sobra.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás dividir con residuo, comprobar la cuenta y decidir qué hacer con lo que sobra.

Rosa tiene 23 huevos. Quiere guardarlos en cajas de 6. Llena 3 cajas, pero le sobran 5 huevos. No alcanzan para otra caja completa. Eso que sobra se llama residuo.

**¿Qué es el residuo?**

No todas las divisiones salen exactas. A veces queda una parte que no se puede repartir. Esa parte es el residuo.

La cuenta de Rosa se escribe así: 23 ÷ 6 = 3 con residuo 5. El 3 es el cociente. El 5 es el residuo.

**Dos reglas del residuo:**

- El residuo siempre es menor que el divisor. Aquí 5 es menor que 6.
- Si el residuo es 0, la división es exacta. No sobra nada.

**¿Cómo se comprueba?**

Multiplica el cociente por el divisor. Después suma el residuo. Debes llegar al dividendo: 6 × 3 = 18 y 18 + 5 = 23.

**¿Qué hago con lo que sobra?**

Depende de la pregunta. Si preguntan cuántas cajas llenas, la respuesta es 3. Si preguntan cuántas cajas necesitas para guardar todo, necesitas 4.

**Ejemplo resuelto:**

Luis acomoda 47 sillas en filas de 8.

1. Divide: 47 ÷ 8 = 5 con residuo 7.
2. Comprueba: 8 × 5 = 40 y 40 + 7 = 47.
3. Responde: son 5 filas completas y sobran 7 sillas.

Ahora, 47 personas viajan en autobuses de 10 lugares. Como 47 ÷ 10 = 4 con residuo 7, necesitan 5 autobuses.

**Lo importante:**

- El residuo es lo que sobra al dividir.
- Siempre es menor que el divisor.
- Comprueba con cociente × divisor + residuo.
- Lee la pregunta para decidir qué hacer con el residuo.

**Palabras nuevas:**

- **Residuo:** lo que sobra cuando una división no es exacta.
- **División exacta:** la que no deja residuo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1bbf3f9e-4e50-5f01-a35f-30e7c669c0ba', '614a7590-00a0-5066-8fda-7fd112f630e8', 5, 'Problemas de multiplicación y división', 'Aprende a elegir entre multiplicar y dividir en problemas de compras, repartos y ahorro, y a comprobar la respuesta.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás resolver problemas de compras, repartos y ahorro con multiplicación y división.

Rosa compra 6 cajas de refresco. Cada caja cuesta $48. Paga con un billete de $500. ¿Cuánto le regresan? Para resolverlo, necesitas elegir bien las operaciones.

**Pasos para resolver un problema**

1. Lee con calma y busca la pregunta.
2. Subraya los datos que sirven.
3. Decide la operación.
4. Calcula y comprueba.
5. Escribe la respuesta completa.

**¿Cómo elijo la operación?**

- Si una cantidad se repite, multiplica. Pistas: «veces» y «cada semana» o «cada caja» con un precio.
- Si repartes en partes iguales, divide, aunque diga «cada uno». Otra pista es «entre».
- Si juntas o quitas, recuerda la suma y la resta de Números y operaciones I.

Muchos problemas usan dos operaciones. Resuelve una a la vez.

**Ejemplo resuelto:**

Rosa compra 6 cajas de $48 y paga con $500.

1. Cuánto cuestan las cajas: 6 × $48 = $288.
2. Cuánto le regresan: $500 − $288 = $212.

Le regresan $212.

Otro caso. Tres amigos comparten una renta de $1,260. Cada uno paga lo mismo: 1,260 ÷ 3 = 420. Cada amigo paga $420.

Y otro más. Luis ahorra $150 cada semana durante 8 semanas. Junta 8 × $150 = $1,200. Quiere una bicicleta de $1,500. Le faltan $1,500 − $1,200 = $300.

**Lo importante:**

- Busca la pregunta antes de calcular.
- Si algo se repite, multiplica. Si repartes o agrupas, divide.
- En problemas de dos pasos, resuelve una operación a la vez.
- Escribe la respuesta con palabras.

**Palabras nuevas:**

- **Dato:** información del problema que sirve para calcular.
- **Ahorrar:** guardar dinero para usarlo después.
- **Renta:** dinero que se paga por usar una casa o un cuarto.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('d7fecf1b-80a0-5039-9cc5-77045a8f7f26', '614a7590-00a0-5066-8fda-7fd112f630e8', 6, 'Múltiplos, divisores, pares e impares', 'Aprende a reconocer múltiplos, divisores, números pares y números impares con ejemplos sencillos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás encontrar múltiplos y divisores de un número y reconocer pares e impares.

Rosa tiene 12 sillas. Quiere hacer filas iguales, sin que sobre ninguna. Puede hacer filas de 1, de 2, de 3, de 4, de 6 o de 12. En cambio, no puede hacer filas de 5.

**Múltiplos**

Un múltiplo es lo que sale al multiplicar un número por 1, 2, 3 y así. Los múltiplos de 3 son los que salen al contar de 3 en 3: 3, 6, 9, 12, 15, 18.

**Divisores**

Un divisor es un número que divide a otro sin dejar residuo. Si una división es exacta, el divisor y el cociente son divisores del número. Por eso 1, 2, 3, 4, 6 y 12 son divisores de 12.

**Pares e impares**

Un número par se puede repartir en dos partes iguales. Termina en 0, 2, 4, 6 u 8. Un número impar siempre deja residuo 1. Termina en 1, 3, 5, 7 o 9.

**Ejemplo resuelto:**

Luis quiere saber si 5 es divisor de 12. Divide 12 ÷ 5 = 2 con residuo 2. Sobran 2, así que no lo es.

Sigue con 1, 2 y 3.

1. 12 ÷ 1 = 12
2. 12 ÷ 2 = 6
3. 12 ÷ 3 = 4

El 4 y el 6 ya salieron como cocientes. Del 7 al 11 dejan residuo, así que no sirven. Los divisores de 12 son 1, 2, 3, 4, 6 y 12.

El 35 termina en 5, así que es impar. Compruébalo: 35 ÷ 2 = 17 con residuo 1.

**Lo importante:**

- Un múltiplo sale de una tabla.
- Un divisor divide a otro número sin dejar residuo.
- Los pares terminan en 0, 2, 4, 6 u 8.
- Los impares terminan en 1, 3, 5, 7 o 9.

**Palabras nuevas:**

- **Múltiplo:** lo que sale al multiplicar un número por 1, 2, 3 y así.
- **Divisor:** número que divide a otro sin dejar residuo.
- **Par:** número que se puede repartir en dos partes iguales.
- **Impar:** número que al repartirlo entre 2 deja residuo 1.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('5a1e76f6-e442-5484-861a-433f940c48ac', '614a7590-00a0-5066-8fda-7fd112f630e8', 7, 'Orden de las operaciones', 'Aprende en qué orden se resuelven las sumas, restas, multiplicaciones, divisiones y paréntesis de una cuenta.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás resolver cuentas con varias operaciones en el orden correcto.

Luis compra un pan de $10 y 3 tamales de $15 cada uno. Escribe la cuenta 10 + 3 × 15. Si suma primero, saca 13 × 15 y se equivoca. Hay un orden que todos usamos para que la respuesta sea la misma.

**El orden**

1. Primero resuelve lo que está dentro de los paréntesis.
2. Después resuelve las multiplicaciones y las divisiones, de izquierda a derecha.
3. Al final resuelve las sumas y las restas, de izquierda a derecha.

Un paréntesis es un par de signos ( ) que encierra una parte de la cuenta. Esa parte se hace antes.

**Ejemplos cortos**

- 2 + 3 × 4 = 2 + 12 = 14. Primero se multiplica.
- 20 − 8 + 5 = 12 + 5 = 17. Se avanza de izquierda a derecha.
- 24 ÷ 4 × 3 = 6 × 3 = 18. Se avanza de izquierda a derecha.
- 20 − (8 + 5) = 20 − 13 = 7. Primero el paréntesis.

**Ejemplo resuelto:**

Rosa compra 2 kilos de frijol a $30 cada uno y 3 kilos de arroz a $22 cada uno. La cuenta es 2 × 30 + 3 × 22.

1. Resuelve las multiplicaciones: 2 × 30 = 60 y 3 × 22 = 66.
2. Suma los resultados: 60 + 66 = 126.

Rosa paga $126.

Con el pan y los tamales de Luis: 3 × 15 = 45, y después 10 + 45 = 55. Luis paga $55. Si hubiera escrito (10 + 3) × 15, el resultado sería 195, que es otra cuenta.

**Lo importante:**

- Primero los paréntesis.
- Después multiplicar y dividir, de izquierda a derecha.
- Al final sumar y restar, de izquierda a derecha.
- Otro orden puede dar otro resultado.

**Palabras nuevas:**

- **Paréntesis:** signos ( ) que encierran la parte de la cuenta que se hace primero.
- **Operación:** una cuenta como sumar, restar, multiplicar o dividir.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9746c070-a3f1-5132-a42d-992776643199', '614a7590-00a0-5066-8fda-7fd112f630e8', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios resueltos antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego revisa los ejercicios.

**Semana 1 — La multiplicación y las tablas:** Multiplicar es sumar la misma cantidad varias veces. El orden de los factores no cambia el producto.

**Semana 2 — Multiplicar por varias cifras:** Separa el número por su valor posicional, multiplica cada parte y suma. Por 10, 100 o 1,000 agregas ceros.

**Semana 3 — La división: repartir y agrupar:** Dividir es partir en partes iguales. Se comprueba multiplicando el cociente por el divisor.

**Semana 4 — División con residuo:** El residuo es lo que sobra y siempre es menor que el divisor. Comprueba con cociente × divisor + residuo.

**Semana 5 — Problemas de multiplicación y división:** Busca la pregunta. Si algo se repite, multiplica. Si repartes, divide.

**Semana 6 — Múltiplos, divisores, pares e impares:** Un divisor no deja residuo. Los pares terminan en 0, 2, 4, 6 u 8.

**Semana 7 — Orden de las operaciones:** Primero paréntesis, luego × y ÷, al final + y −.

**Ejercicios de repaso:**

1. Una caja trae 12 lápices. ¿Cuántos hay en 9 cajas? 9 × 12 = 108. Hay 108 lápices.
2. Reparte $960 entre 4 personas. 960 ÷ 4 = 240. A cada una le tocan $240.
3. Hay 50 sillas para filas de 8. 50 ÷ 8 = 6 con residuo 2. Son 6 filas completas y sobran 2 sillas.
4. ¿Es 7 divisor de 12? 12 ÷ 7 = 1 con residuo 5, así que no.
5. Luis vende 28 vasos al día durante 15 días. 28 × 10 = 280 y 28 × 5 = 140. Luego 280 + 140 = 420. Vende 420 vasos.
Antes del examen, vuelve a leer lo que te costó más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('660e4c70-7fe2-553f-865f-3d87f18863f9', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 1, 'La computadora y el celular: partes y uso', 'Conoce las partes de la computadora y del celular, y aprende los pasos básicos para usarlos con seguridad.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar las partes de una computadora y de un celular, y usarlos con pasos sencillos.

Rosa recibe una foto de su hermana en el celular. Quiere verla más grande en una computadora. Antes de tocar algo, le conviene saber qué es cada parte del equipo.

**¿Qué partes tiene una computadora?**

La computadora tiene partes que ves y tocas. La pantalla muestra lo que haces. El teclado sirve para escribir. El ratón mueve una flecha en la pantalla. Las bocinas dan el sonido.

Dentro hay otras piezas. El procesador hace funcionar los programas, y el disco guarda tus archivos.

**¿Y el celular?**

El celular junta casi todo en una sola pieza. Su pantalla es táctil: la usas tocando o deslizando el dedo. Tiene cámara para fotos, micrófono para tu voz y bocina para el sonido. Tiene botones para encender y para el volumen. Su batería se carga con un cable.

**Pasos básicos de uso:**

1. Enciende el equipo y espera a que termine de abrir.
2. Elige una aplicación y ábrela.
3. Haz lo que necesitas, por ejemplo ver una foto.
4. Guarda tu trabajo.
5. Cierra la aplicación y apaga el equipo.

**Ejemplo:**

Luis escribe una lista del mercado en la computadora. Antes de apagar, guarda el archivo con el nombre «Lista del mercado». Así lo encuentra mañana.

**Lo importante:**

- Pantalla, teclado y ratón son partes que usas todo el tiempo.
- El celular tiene pantalla táctil, cámara y micrófono.
- Guarda tu trabajo antes de cerrar y apagar.

**Palabras nuevas:**

- **Pantalla táctil:** pantalla que responde cuando la tocas con el dedo.
- **Aplicación:** programa que sirve para una tarea, como escribir o ver fotos.
- **Archivo:** un documento, una foto o un video guardado en el equipo.
- **Procesador:** pieza que hace funcionar los programas.
- **Disco:** pieza que guarda tus archivos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('a4520f5c-d86e-5e91-8587-89eda07c26e3', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 2, 'Internet y buscadores', 'Aprende qué es internet, cómo buscar información con un buscador y cómo saber si un resultado es confiable.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás buscar información en internet y revisar si un resultado es confiable.

Luis tiene una mancha de aceite en su camisa de trabajo. Quiere saber cómo quitarla. En lugar de preguntar a varias personas, puede buscar la respuesta en internet.

**¿Qué es internet?**

Internet es una red que conecta millones de equipos en todo el mundo. Gracias a ella puedes ver páginas, mandar mensajes y consultar información. Para entrar necesitas conexión. Puede venir del plan de datos de tu celular o de una red wifi, la que te da el aparato de internet de tu casa.

Para entrar a internet abres un navegador, una aplicación con una barra arriba. Ahí escribes la dirección de una página o tus palabras clave.

**¿Qué es un buscador?**

Un buscador es un servicio que te ayuda a encontrar páginas. Escribes unas palabras en el cuadro de búsqueda y te muestra una lista de resultados. Esas palabras se llaman palabras clave.

**Ejemplo resuelto:**

Luis quiere quitar la mancha. Sigue estos pasos.

1. Abre el buscador.
2. Escribe palabras clave claras: «quitar mancha de aceite de la ropa».
3. Lee varios resultados, no solo el primero.
4. Revisa quién publicó la página y qué fecha tiene.
5. Compara dos o tres páginas. Si dicen lo mismo, la información es más confiable.

**Cuidado con los anuncios:**

Algunos resultados son anuncios. Suelen tener una marca que dice «anuncio». Quieren venderte algo, y no siempre dan la mejor respuesta.

**Lo importante:**

- Internet conecta equipos; el buscador te ayuda a encontrar páginas.
- Usa palabras clave cortas y claras.
- Compara varias fuentes antes de creer algo.
- Revisa quién publica la información y cuándo.

**Palabras nuevas:**

- **Internet:** red que conecta equipos de todo el mundo.
- **Buscador:** servicio que muestra páginas según las palabras que escribes.
- **Palabra clave:** palabra importante que escribes para encontrar algo.
- **Navegador:** aplicación con una barra arriba para entrar a páginas de internet.
- **Fuente:** persona o institución que dio la información.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1f15a688-5e2c-58ff-80a6-e891bd25e6cb', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 3, 'Correo electrónico', 'Aprende a leer tu bandeja, escribir un correo con asunto claro, adjuntar un archivo y cuidarte de mensajes dudosos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás escribir y enviar un correo electrónico con un archivo adjunto.

Rosa quiere mandar su currículum a una vacante. Le piden que lo envíe por correo. Con un correo electrónico puede mandar un mensaje y un documento en pocos minutos.

**¿Qué es un correo electrónico?**

Es un mensaje escrito que viaja por internet. Para recibir uno necesitas una dirección de correo. Tiene tres partes: tu nombre de usuario, el signo @ y el nombre del servicio de correo. Por ejemplo: rosa.hernandez@ejemplo.com. Cada dirección es única, como el domicilio de una casa.

**Partes de un correo:**

- **Para:** aquí escribes la dirección de quien recibirá el mensaje.
- **Asunto:** una frase corta que dice de qué trata.
- **Mensaje:** el texto, con saludo y despedida.
- **Adjunto:** un archivo que envías junto con el texto.

**Ejemplo resuelto:**

Rosa envía su currículum.

1. Abre su correo y elige escribir un mensaje nuevo.
2. En «Para» escribe con cuidado la dirección de la empresa.
3. En «Asunto» escribe: «Currículum de Rosa Hernández».
4. En el mensaje saluda, explica para qué escribe y se despide.
5. Adjunta el archivo, revisa que esté y envía.

**Mensajes dudosos:**

En tu bandeja de entrada llegan los mensajes nuevos. Algunos son publicidad o engaños. Si no conoces a quien escribe, no abras archivos adjuntos.

**Lo importante:**

- Una dirección de correo tiene nombre de usuario, @ y servicio.
- Escribe un asunto claro y revisa la dirección antes de enviar.
- No abras archivos de personas desconocidas.

**Palabras nuevas:**

- **Bandeja de entrada:** lugar donde llegan tus mensajes nuevos.
- **Asunto:** frase corta que dice de qué trata el correo.
- **Adjunto:** archivo que se manda junto con el mensaje.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('43f4190f-4b0f-53dd-b949-0235776c810d', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 4, 'Trámites y servicios en línea', 'Aprende a reconocer un sitio oficial, seguir los pasos de un trámite en línea y guardar tu comprobante.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer un sitio oficial y seguir los pasos de un trámite en línea.

Luis necesita sacar una cita para un trámite. Podría ir a la oficina y formarse desde temprano. Muchas instituciones permiten hacer parte del trámite en línea. Así ahorra tiempo y viajes.

**¿Cómo reconocer un sitio oficial?**

No todas las páginas que parecen oficiales lo son. Algunas copian el diseño para engañar. Para cuidarte:

- Busca la dirección en un documento oficial, en un cartel de la oficina o pregunta en la ventanilla.
- Escribe la dirección tú mismo. No entres desde un mensaje que te llegó.
- Revisa que el nombre de la institución esté escrito completo y sin errores.
- Recuerda que muchos sitios del gobierno terminan en .gob.mx, pero no todos.

**Pasos de un trámite en línea:**

1. Reúne tus documentos y datos, como tu nombre completo y tu identificación.
2. Entra al sitio oficial y busca el trámite que necesitas.
3. Lee los requisitos. Revisa los requisitos actuales en el sitio oficial, porque pueden cambiar.
4. Llena el formulario con letra clara y revisa cada dato.
5. Guarda el comprobante o el número de folio.

**Ejemplo:**

Luis pide una cita. Al terminar, el sitio le da un folio. Luis toma una foto de la pantalla y anota el folio en un papel. Si algo falla, ese número le permite aclararlo.

**Lo importante:**

- Confirma que el sitio sea oficial antes de dar tus datos.
- Si un trámite tiene costo, el pago se hace en el sitio oficial o con los datos que da la institución. Nunca a una cuenta personal ni por mensaje.
- Guarda siempre tu comprobante.

**Palabras nuevas:**

- **Trámite:** serie de pasos para pedir un servicio o un documento.
- **Folio:** número que identifica tu solicitud.
- **Comprobante:** papel o imagen que prueba que hiciste el trámite.
- **Requisito:** documento o dato que te piden para hacerlo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ee702ff3-ce45-597e-9c7a-a2f96a0c45f1', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 5, 'Seguridad digital: contraseñas y fraudes', 'Aprende a crear contraseñas seguras, reconocer mensajes de fraude y saber qué hacer si recibes uno.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás crear una contraseña segura y reconocer un mensaje de fraude.

A Rosa le llega un mensaje: «Tu cuenta del banco se bloqueará hoy. Entra y confirma tus datos». Siente prisa y miedo. Esa prisa es justo lo que busca quien quiere engañarla.

**¿Cómo es una contraseña segura?**

La contraseña es la llave de tus cuentas. Una llave fácil de adivinar deja la puerta abierta. Para que sea segura:

- Que tenga doce caracteres o más. Un carácter es una letra, un número o un signo.
- Que sea una frase que solo tú recuerdes, con letras, números y signos.
- Que sea distinta en cada cuenta.
- No la compartas con nadie. Es personal.

Puedes activar la verificación en dos pasos. Además de la contraseña, la cuenta pide un código que llega a tu celular.

**¿Qué es un fraude digital?**

Es un engaño para quitarte datos o dinero. Llega por mensaje, correo o llamada. Quien lo envía se hace pasar por un banco o una tienda. Pide que toques un enlace y escribas tus datos en una página falsa.

**Señales de alerta:**

1. Te mete prisa o te amenaza.
2. Te pide contraseñas, claves o códigos que llegan a tu celular.
3. Promete premios que no pediste.
4. Trae faltas de ortografía o un enlace raro.

**Ejemplo resuelto:**

Rosa no responde ni toca el enlace. Llama al número que viene en su tarjeta del banco. Ahí le confirman que no enviaron ningún aviso. Después lo marca como fraude en su aplicación y lo borra.

**Lo importante:**

- Usa contraseñas largas y distintas, y no las compartas.
- Un banco no pide tus claves por mensaje.
- Ante la duda, no toques enlaces y pregunta por otro medio.

**Palabras nuevas:**

- **Contraseña:** clave secreta que protege tu cuenta.
- **Fraude:** engaño para quitarte datos o dinero.
- **Verificación en dos pasos:** segundo paso para entrar a tu cuenta, como un código que te llega al celular.
- **Enlace:** texto o botón que, al tocarlo, te lleva a otra página.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('dbe124f9-b534-5128-af23-5f796172d350', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 6, 'Redes sociales con responsabilidad', 'Aprende a cuidar tu privacidad, publicar con respeto, revisar noticias dudosas y reportar el mal trato en redes.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás usar una red social cuidando tu privacidad y tratando bien a los demás.

Luis publica una foto de su casa donde se ve el nombre de la calle y el número. Días después recibe llamadas de números desconocidos. Una publicación puede llegar más lejos de lo que imaginas.

**¿Qué es una red social?**

Es un servicio donde las personas comparten fotos, mensajes y videos. Cada persona tiene un perfil. Tus amigos y otras personas pueden ver lo que publicas, comentarlo y compartirlo.

**Cuida tu privacidad:**

La privacidad es lo que decides mantener solo para ti. Antes de publicar, pregúntate quién lo va a ver.

- Revisa en la configuración quién puede ver tus publicaciones.
- No publiques tu domicilio, tus documentos ni tus claves.
- No compartas dónde estás en este momento.
- Pide permiso antes de subir la foto de otra persona.

**Publica con respeto:**

Escribir detrás de una pantalla no quita la responsabilidad. Si no lo dirías de frente, no lo escribas. Si alguien te falta al respeto, no respondas con insultos. Puedes bloquearlo y reportar el mensaje.

**Revisa antes de compartir:**

Una noticia falsa puede esparcirse rápido si la gente la comparte sin leerla. Mira quién las publica y busca la misma noticia en otra fuente.

**Lo importante:**

- Lo que publicas puede quedarse mucho tiempo.
- Configura tu privacidad y no des datos personales.
- Trata a los demás con respeto y reporta el mal trato.
- Revisa una noticia antes de compartirla.

**Palabras nuevas:**

- **Perfil:** tu página personal en una red social.
- **Privacidad:** lo que decides mantener solo para ti.
- **Bloquear:** impedir que una persona te escriba o vea tu perfil.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('396a37fc-a9ed-52ed-88ff-9f5c3ba51578', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 7, 'Mapas, calendario y documentos', 'Aprende a buscar una ruta en una aplicación de mapas, anotar citas con recordatorio y guardar documentos en orden.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás buscar una ruta, anotar una cita en el calendario y guardar un documento con orden.

Rosa tiene cita en una clínica que no conoce. Debe llegar el martes a las 10:00. No quiere llegar tarde ni perderse. Tres herramientas del celular le ayudan.

**¿Cómo usar una aplicación de mapas?**

Una aplicación de mapas te muestra calles y lugares. Escribes el nombre del lugar o su dirección. Después eliges cómo viajarás: a pie, en transporte o en auto. La aplicación dibuja la ruta y calcula cuánto tarda. Ese tiempo es aproximado, porque el tráfico cambia.

**¿Cómo usar el calendario?**

El calendario guarda tus fechas importantes. Cada una es un evento. Puedes agregar un recordatorio, que es un aviso antes de la hora.

**¿Cómo cuidar tus documentos?**

Un documento digital es un archivo que escribes o guardas. Ponle un nombre claro y guárdalo en una carpeta. Haz una copia de respaldo en otro lugar, como una memoria USB o en internet (la nube). Así no pierdes nada si el equipo se descompone.

**Ejemplo resuelto:**

Rosa se prepara para su cita.

1. Escribe la dirección de la clínica en el mapa.
2. Elige transporte público y revisa la ruta.
3. Agrega el evento «Cita en la clínica», martes a las 10:00.
4. Pone un recordatorio una hora antes.
5. Escribe en un documento sus preguntas para el médico, lo guarda como «Preguntas cita» en la carpeta «Salud» y hace un respaldo.

**Lo importante:**

- El mapa te muestra una ruta y un tiempo aproximado.
- El calendario y sus recordatorios te ayudan a no olvidar citas.
- Usa nombres claros, carpetas y copias de respaldo.

**Palabras nuevas:**

- **Ruta:** camino que sigues para ir de un lugar a otro.
- **Evento:** una cita o actividad anotada en el calendario.
- **Recordatorio:** aviso que te llega antes de la hora de un evento.
- **Respaldo:** copia de un archivo guardada en otro lugar.
- **Nube:** espacio en internet donde puedes guardar archivos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ec4afa0b-d12a-51ee-8cb4-f11ed50f40cb', '190e803a-7183-5166-9cb8-851c4bcf2bdf', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — La computadora y el celular: partes y uso:** La pantalla muestra, el teclado escribe y el ratón mueve la flecha. El celular tiene pantalla táctil y batería. Guarda tu trabajo antes de apagar.

**Semana 2 — Internet y buscadores:** Internet conecta equipos. En el buscador escribes palabras clave. Compara varias fuentes antes de creer algo.

**Semana 3 — Correo electrónico:** Una dirección tiene nombre de usuario, @ y servicio. Escribe un asunto claro y no abras archivos de desconocidos.

**Semana 4 — Trámites y servicios en línea:** Confirma que el sitio sea oficial y escribe tú la dirección. Guarda tu folio o comprobante.

**Semana 5 — Seguridad digital: contraseñas y fraudes:** Usa contraseñas largas y distintas. Si un mensaje te mete prisa o pide claves, es señal de fraude.

**Semana 6 — Redes sociales con responsabilidad:** Cuida tu privacidad y no publiques datos personales. Trata bien a los demás y revisa una noticia antes de compartirla.

**Semana 7 — Mapas, calendario y documentos:** El mapa da una ruta aproximada. El calendario avisa con recordatorios. Guarda tus archivos con nombre claro y respaldo.

**Ejercicios de repaso:**

1. Luis escribe «quitar mancha de aceite» en el buscador. ¿Cómo se llaman esas palabras? Son palabras clave.
2. Rosa recibe un mensaje que dice «Tu cuenta se bloquea hoy, manda tu clave». ¿Qué hace? No responde, no abre enlaces y llama al número de su tarjeta.
3. Una vecina quiere mandar un documento por correo. ¿Qué parte del correo usa? Usa el adjunto.
4. Un amigo quiere publicar su domicilio en una red social. ¿Qué le recomiendas? Cuidar su privacidad y no publicarlo.
5. Rosa tiene cita el martes. ¿Cómo evita olvidarla? Agrega un evento en el calendario con recordatorio.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('514e38d2-9e32-523b-868b-05eb69428cd2', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 1, 'Tipos de texto y su propósito', 'Aprende a reconocer si un texto informa, cuenta, explica pasos o busca convencer.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer el tipo de un texto y decir para qué fue escrito.

Rosa recibe tres papeles en un día. Uno es una receta. Otro es un cuento que le prestó una vecina. El tercero es un volante que dice: «Compra aquí, es lo mejor». Los tres son textos, pero cada uno busca algo distinto.

**¿Qué es el propósito de un texto?**

El propósito es lo que el autor quiere lograr. Antes viste que los avisos informan y los recados piden algo. Ahora verás más tipos de texto. Saber el propósito te ayuda a leer con más atención.

**Cuatro tipos de texto:**

- **Informativo:** da datos reales. Ejemplo: una noticia.
- **Narrativo:** cuenta una historia con personajes. Ejemplo: un cuento.
- **Instructivo:** explica pasos para hacer algo. Ejemplo: una receta.
- **De opinión o publicidad:** quiere convencerte de algo. Ejemplo: un volante de oferta.

Un texto puede mezclar tipos. Aun así, casi siempre domina uno.

**Ejemplo resuelto:**

Lee este texto: «Mezcla la harina con agua. Amasa durante cinco minutos. Deja reposar la masa».

1. Fíjate en cómo está escrito. Las palabras «mezcla», «amasa» y «deja» son órdenes.
2. Pregunta: ¿qué quiere lograr? Quiere que alguien haga algo en orden.
3. Conclusión: es un texto instructivo.

Ahora el volante: «Compra aquí, es lo mejor». No da datos que se puedan comprobar. Quiere que compres. Es publicidad.

**Lo importante:**

- El propósito es lo que el autor quiere lograr.
- Informar, contar, dar pasos y convencer son propósitos distintos.
- Pregúntate siempre: ¿para qué fue escrito esto?

**Palabras nuevas:**

- **Propósito:** lo que alguien quiere lograr con lo que escribe.
- **Instructivo:** texto que explica pasos para hacer algo.
- **Publicidad:** texto que busca que compres o uses algo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c2d89ff6-6864-5c9d-bc3c-ba1b05d3b19b', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 2, 'Hechos y opiniones', 'Aprende a distinguir lo que se puede comprobar de lo que una persona piensa o siente.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás separar los hechos de las opiniones en un texto.

Luis escucha a dos compañeros. Uno dice: «El camión llegó a las ocho». El otro dice: «Ese camión es el peor de todos». Los dos hablan del mismo camión. Pero no dicen la misma clase de cosa.

**¿Qué es un hecho?**

Un hecho es algo que se puede comprobar. Puedes revisarlo en un reloj, en un papel o con tus propios ojos. «El camión llegó a las ocho» es un hecho. Alguien puede verificar la hora.

**¿Qué es una opinión?**

Una opinión es lo que una persona piensa o siente. Dos personas pueden pensar distinto y las dos tener razón desde su punto de vista. «Ese camión es el peor» es una opinión. No hay forma de comprobarla.

**Pistas para reconocer una opinión:**

- Palabras como «creo», «me parece» o «pienso».
- Palabras que juzgan: «mejor», «peor», «bonito», «feo», «aburrido».
- Frases como «todos saben que».

**Ejemplo resuelto:**

Decide si cada frase es un hecho o una opinión.

1. «La tienda de doña Carmen abre a las siete.» Se puede comprobar. Es un hecho.
2. «Su pan es el más rico del barrio.» Depende del gusto. Es una opinión.
3. «Me parece que el mercado queda muy lejos.» Dice «me parece» y juzga. Es una opinión.
4. «El mercado tiene cuatro entradas.» Puedes contarlas. Es un hecho.

**Lo importante:**

- Un hecho se puede comprobar.
- Una opinión expresa lo que alguien piensa o siente.
- Una opinión no es falsa por ser opinión, pero tampoco es una prueba.
- Antes de decidir algo, separa qué es hecho y qué es opinión.

**Palabras nuevas:**

- **Hecho:** algo que se puede comprobar.
- **Opinión:** lo que una persona piensa o siente sobre algo.
- **Comprobar:** revisar que algo sea cierto.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('b2406ebf-79d2-5a5e-8691-da808c1c2c13', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 3, 'Inferencias: leer entre líneas', 'Aprende a descubrir lo que un texto no dice con palabras, usando pistas y lo que ya sabes.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sacar conclusiones de un texto usando las pistas que da.

Rosa llega a su casa y huele a quemado. En la cocina hay humo y la olla está negra. Nadie le dijo «se quemó la comida». Ella lo supo con las pistas. Eso se llama hacer una inferencia.

**¿Qué es una inferencia?**

Una inferencia es una conclusión que tú sacas. El texto no la dice con palabras. La descubres al unir dos cosas: las pistas del texto y lo que tú ya sabes.

**La fórmula sencilla:**

- Pistas del texto + lo que ya sé = inferencia.

Leer entre líneas quiere decir eso: entender lo que está escondido entre las palabras.

**Cómo hacer una inferencia:**

1. Lee con atención y subraya las pistas.
2. Pregunta: ¿qué sé yo sobre esto?
3. Une las dos cosas y saca tu conclusión.
4. Revisa que el texto la apoye. Si no hay pistas, solo estás adivinando.

**Ejemplo resuelto:**

Texto: «Luis llegó al trabajo con el paraguas escurriendo. Se sacudió los zapatos mojados en la entrada».

1. Pistas: el paraguas escurre y los zapatos están mojados.
2. Lo que sé: el paraguas se moja cuando llueve.
3. Inferencia: afuera estaba lloviendo o acababa de llover.

El texto nunca dice la palabra «lluvia». Tú la descubriste con las pistas.

**Lo importante:**

- Una inferencia es una conclusión basada en pistas.
- Une lo que dice el texto con lo que ya sabes.
- Una buena inferencia siempre se apoya en el texto.
- Adivinar sin pistas no es inferir.

**Palabras nuevas:**

- **Inferencia:** conclusión que sacas al unir pistas con lo que ya sabes.
- **Pista:** dato del texto que te ayuda a descubrir algo.
- **Conclusión:** idea a la que llegas después de pensar.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9cceabd0-a0b4-5858-b9d8-4eb7c5e42daf', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 4, 'Recibos, facturas y contratos sencillos', 'Aprende a leer un recibo, una factura y un contrato sencillo antes de pagar o firmar.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer un recibo y un contrato sencillo y encontrar sus datos clave.

Luis paga en una papelería y le dan un papel con números. Él lo guarda sin leerlo. Después hay una duda con el cobro y ya no recuerda qué compró.

**¿Qué son estos documentos?**

- **Recibo:** comprueba que pagaste. Dice qué compraste y cuánto costó.
- **Factura:** comprobante de una venta con datos del vendedor y del comprador.
- **Contrato:** acuerdo por escrito entre dos personas. Dice qué hará cada una.

Una factura trae también el nombre del vendedor, el RFC (clave del contribuyente), la fecha, el folio y el impuesto (IVA). La pides cuando necesitas comprobar un gasto.

**Qué buscar en un contrato:**

- Los nombres de las dos partes.
- Qué se acuerda y cuánto se paga.
- Por cuánto tiempo dura.
- Las firmas. Pide siempre una copia.

Cada punto que se acuerda es una cláusula.

**Ejemplo resuelto:**

Recibo ficticio de una papelería: 3 cuadernos a $20 cada uno y 2 lápices a $5 cada uno.

1. Cuadernos: 3 × $20 = $60.
2. Lápices: 2 × $5 = $10.
3. Total: $60 + $10 = $70.

Contrato ficticio: «Rosa renta un cuarto a don Pedro por $2,500 al mes, durante 12 meses. Ambos firman».

1. Las partes son Rosa y don Pedro.
2. Lo acordado es la renta de un cuarto.
3. El pago es $2,500 cada mes.
4. Dura 12 meses.

**Lo importante:**

- El recibo comprueba un pago.
- Revisa que el total coincida con lo que compraste.
- Lee todo el contrato antes de firmar.
- Pregunta lo que no entiendas y guarda tu copia.

**Palabras nuevas:**

- **Recibo:** papel que comprueba que pagaste.
- **Factura:** comprobante de una venta con datos de las dos partes.
- **Contrato:** acuerdo por escrito entre dos personas.
- **Cláusula:** cada punto que se acuerda en un contrato.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('34eaee7c-8465-52f5-8c45-7339aea6d286', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 5, 'Poemas, refranes y dichos', 'Aprende a leer poemas, refranes y dichos y a entender su sentido más allá de las palabras.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer un poema, un refrán y un dicho, y explicar qué quieren decir.

Doña Carmen le dice a su vecino: «Al que madruga, Dios lo ayuda». No habla solo de despertar temprano. Habla de que el esfuerzo cuenta. Así funcionan los refranes. Dicen una cosa y quieren decir otra.

**¿Qué es un refrán?**

Un refrán es una frase corta y tradicional. Guarda un consejo que la gente repite desde hace mucho. Un dicho es una expresión popular que no siempre da un consejo. Por ejemplo: «Estar en las nubes» quiere decir estar distraído.

**Sentido literal y sentido figurado:**

- El sentido literal es lo que dicen las palabras.
- El sentido figurado es lo que quieren decir de verdad.

**¿Qué es un poema?**

Un poema se escribe en renglones llamados versos. Un grupo de versos es una estrofa. Muchos poemas usan rima, que es cuando las palabras suenan igual al final.

**Ejemplo resuelto:**

Lee esta estrofa de cuatro versos:

- El río baja cantando
- con su voz de piedra y sal,
- y al pasar va dibujando
- un camino de cristal.

1. Rima: «cantando» con «dibujando», y «sal» con «cristal».
2. El río no canta de verdad. Es sentido figurado.
3. Lo que dice: el agua suena y deja un rastro brillante.

Refrán: «Camarón que se duerme se lo lleva la corriente». Quiere decir que quien se descuida pierde su oportunidad.

**Lo importante:**

- Un refrán guarda un consejo tradicional.
- Un poema usa versos, estrofas y, a veces, rima.
- Pregunta qué dicen las palabras y qué quieren decir de verdad.

**Palabras nuevas:**

- **Refrán:** frase tradicional que da un consejo.
- **Verso:** cada renglón de un poema.
- **Rima:** sonido igual al final de dos palabras.
- **Sentido figurado:** lo que algo quiere decir más allá de las palabras.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('50859a10-b2bc-5bd0-a302-15930183eb27', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 6, 'Leer tablas, horarios y mapas', 'Aprende a encontrar datos en una tabla, un horario y un mapa sencillo.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás encontrar datos en una tabla, un horario y un croquis.

Rosa quiere llegar al hospital. En la parada hay un papel con filas y columnas. Si aprende a leerlo, encuentra la hora de salida.

**¿Cómo se lee una tabla?**

Una tabla ordena datos en filas y columnas. Las filas van de lado a lado. Las columnas van de arriba hacia abajo. Para buscar un dato, lee el encabezado de la columna. Luego busca la fila que necesitas.

**Ejemplo resuelto:**

Horario ficticio de una ruta de camión:

| Destino | Sale | Llega |
|---|---|---|
| Centro | 7:00 | 7:40 |
| Mercado | 7:30 | 8:05 |
| Hospital | 8:00 | 8:50 |

Pregunta: ¿a qué hora llega el camión que sale a las 7:30?

1. Busca en la columna «Sale» la hora 7:30.
2. Esa fila dice «Mercado».
3. Ve a la columna «Llega»: 8:05.

¿Cuánto dura el viaje? De 7:30 a 8:00 pasan 30 minutos. De 8:00 a 8:05, 5 minutos más. En total son 35 minutos.

**¿Cómo se lee un mapa?**

Un croquis es un mapa sencillo. El norte queda arriba, el sur abajo, el este a la derecha y el oeste a la izquierda. La leyenda explica los símbolos.

Ejemplo: la escuela queda al norte de la plaza. La farmacia queda al sur. La iglesia queda al este de la plaza.

**Lo importante:**

- Lee primero el título y los encabezados.
- Cruza la fila con la columna para hallar el dato.
- En un mapa busca el norte y las referencias.

**Palabras nuevas:**

- **Columna:** línea de datos que va de arriba hacia abajo.
- **Fila:** línea de datos que va de lado a lado.
- **Croquis:** mapa sencillo de un lugar.
- **Leyenda:** explicación de los símbolos de un mapa.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('41071924-5b97-5080-9b92-89e5638b6330', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 7, 'Resumen y esquema', 'Aprende a resumir un texto con tus palabras y a ordenar sus ideas en un esquema.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás hacer el resumen y el esquema de un texto corto.

Luis lee un aviso largo del trabajo. Al día siguiente quiere contarle a un compañero lo más importante. Si recuerda todo, se enreda. Si recuerda solo las ideas clave, lo explica en pocas palabras. Eso es resumir.

**¿Qué es un resumen?**

Un resumen cuenta lo más importante de un texto, con tus palabras y más corto. Antes viste cómo sacar la idea principal y los detalles. Aquí la usarás. El resumen lleva la idea principal y solo los detalles necesarios.

**¿Qué es un esquema?**

Un esquema ordena las ideas en forma visual. Lleva el tema arriba. Debajo van las ideas principales. Debajo de cada una, los detalles.

**Pasos para resumir:**

1. Lee todo el texto una vez.
2. Subraya la idea principal de cada párrafo.
3. Quita los ejemplos y lo repetido.
4. Escribe lo que quedó con tus palabras.

**Ejemplo resuelto:**

Texto: «El mercado sobre ruedas llega los martes. Vende frutas y verduras frescas. Los precios son más bajos que en las tiendas. Los vecinos van temprano para encontrar de todo».

Esquema:

- Tema: el mercado sobre ruedas
  - Cuándo llega: los martes
  - Qué vende: frutas y verduras frescas
  - Precios: más bajos que en las tiendas

Resumen: Cada martes llega el mercado sobre ruedas, con frutas y verduras frescas a buen precio.

**Lo importante:**

- Resumir es decir lo esencial con tus palabras.
- Un esquema ordena tema, ideas y detalles.
- Quita lo repetido y los ejemplos.

**Palabras nuevas:**

- **Resumen:** versión corta de un texto con lo más importante.
- **Esquema:** dibujo de ideas ordenadas por importancia.
- **Esencial:** lo más importante.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('3e5fabdb-f539-56b5-a4ca-4bb7480a2f73', 'e37ff3ae-24ee-5b95-bedf-e2346579a2b2', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Tipos de texto y su propósito:** El propósito es lo que el autor quiere lograr. Informar, contar, dar pasos y convencer son propósitos distintos.

**Semana 2 — Hechos y opiniones:** Un hecho se puede comprobar. Una opinión dice lo que alguien piensa o siente.

**Semana 3 — Inferencias:** Une las pistas del texto con lo que ya sabes. Así descubres lo que no se dice con palabras.

**Semana 4 — Recibos, facturas y contratos:** Revisa que el total del recibo sea correcto. Lee todo el contrato antes de firmar y guarda tu copia.

**Semana 5 — Poemas, refranes y dichos:** Los poemas usan versos y rima. Los refranes tienen un sentido figurado.

**Semana 6 — Tablas, horarios y mapas:** Cruza la fila con la columna para hallar un dato. En un mapa busca el norte.

**Semana 7 — Resumen y esquema:** Resume con tus palabras la idea principal. El esquema ordena el tema, las ideas y los detalles.

**Ejercicios de repaso:**

1. «Bate los huevos y fríelos» es un texto instructivo, porque da pasos. «Ese cuaderno es el más bonito» es una opinión. «El cuaderno tiene 100 hojas» es un hecho.
2. Ana llega con las manos llenas de harina y el delantal blanco. Puedes inferir que estuvo amasando o cocinando.
3. Un recibo dice: 2 refrescos a $15 cada uno. 2 × $15 = $30. El total es $30. El refrán «En boca cerrada no entran moscas» quiere decir que callar a veces evita problemas.
4. Un camión sale a las 8:00 y llega a las 8:50. El viaje dura 50 minutos.
5. Aviso de una farmacia: «Este sábado la farmacia abre solo de 9 a 2 por inventario». Resumen en una frase: el sábado la farmacia abre un horario corto.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('125accbf-cf5c-55c6-9cd7-e27b96367f5e', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 1, 'Qué es una fracción', 'Aprende a leer una fracción, a entender sus dos números y a sacar una fracción de una cantidad.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer una fracción, decir qué significa cada número y sacar una fracción de una cantidad.

Rosa compra una pizza y la corta en 4 partes iguales. Ella se come 1 parte. ¿Qué parte de la pizza se comió? Se comió una de cuatro partes. Eso se escribe con una fracción.

**¿Qué es una fracción?**

Una fracción dice cuántas partes tomas de un entero. El entero es la pizza completa, sin partir. La fracción de Rosa es 1/4 y se lee «un cuarto».

Una fracción tiene dos números:

- El de abajo es el denominador. Dice en cuántas partes iguales se partió el entero.
- El de arriba es el numerador. Dice cuántas partes tomaste.

Las partes deben ser iguales. Si una rebanada es mucho más grande que las demás, ya no es un cuarto.

**¿Cómo se leen?**

Si el denominador es 2, se lee «medios». Con 3 se lee «tercios» y con 4, «cuartos». Con 5 son quintos, con 6 sextos, con 8 octavos y con 10 décimos. Con 12 se dice «doceavos».

Así, 1/2 es un medio, 2/3 son dos tercios y 3/4 son tres cuartos. Si partes la pizza en 4 y tomas las 4 partes, tienes 4/4. Eso es un entero completo.

**Ejemplo resuelto:**

Luis tiene 20 huevos. Usa 3/4 de ellos para un pedido. ¿Cuántos huevos usa?

1. El denominador es 4. Reparte los 20 huevos en 4 grupos iguales: 20 ÷ 4 = 5.
2. Cada grupo tiene 5 huevos.
3. El numerador es 3. Toma 3 grupos: 3 × 5 = 15.
4. Luis usa 15 huevos.

**Lo importante:**

- Una fracción tiene numerador arriba y denominador abajo.
- Las partes del entero deben ser iguales.
- Para sacar una fracción de una cantidad, divide entre el denominador y multiplica por el numerador.

**Palabras nuevas:**

- **Fracción:** número que dice cuántas partes iguales tomas de un entero.
- **Numerador:** el número de arriba; dice cuántas partes tomas.
- **Denominador:** el número de abajo; dice en cuántas partes iguales se partió el entero.
- **Entero:** la cosa completa, sin partir.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f6e8150f-9c3b-5128-ab3e-dc0255b325f5', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 2, 'Fracciones equivalentes y comparación', 'Aprende a encontrar fracciones que valen lo mismo y a decidir cuál de dos fracciones es mayor.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer fracciones equivalentes y decir cuál de dos fracciones es mayor.

Luis y Rosa piden dos pizzas del mismo tamaño. Luis se come 1/2 de la suya. Rosa corta la suya en 4 partes y se come 2. ¿Quién comió más? Los dos comieron lo mismo. Sus fracciones se ven distintas, pero valen igual.

**¿Qué son las fracciones equivalentes?**

Dos fracciones son equivalentes cuando valen lo mismo. Por ejemplo, 1/2 = 2/4. También 1/2 = 3/6.

Para encontrar una equivalente, multiplica el numerador y el denominador por el mismo número. También puedes dividir los dos entre el mismo número. A eso se le llama simplificar. Así, 6/8 = 3/4, porque dividiste entre 2.

**¿Cómo se comparan?**

- Con el mismo denominador, es mayor la que tiene el numerador más grande. 3/5 es mayor que 2/5.
- Con el mismo numerador, es mayor la que tiene el denominador más chico, porque sus partes son más grandes. 1/2 es mayor que 1/4.
- Si todo es distinto, busca equivalentes con el mismo denominador.

**Ejemplo resuelto:**

Quieres saber qué es mayor: 2/3 o 3/4 de un litro de agua.

1. Busca un denominador común: 3 × 4 = 12.
2. Convierte 2/3. Multiplica arriba y abajo por 4. Queda 2/3 = 8/12.
3. Convierte 3/4. Multiplica arriba y abajo por 3. Queda 3/4 = 9/12.
4. Compara 8/12 con 9/12. Es mayor 9/12.
5. Entonces 3/4 es mayor que 2/3.

**Lo importante:**

- Las fracciones equivalentes valen lo mismo, aunque se escriban distinto.
- Para encontrarlas, multiplica o divide arriba y abajo por el mismo número.
- Para comparar fracciones distintas, ponles el mismo denominador.

**Palabras nuevas:**

- **Fracciones equivalentes:** fracciones que valen lo mismo.
- **Simplificar:** dividir numerador y denominador entre el mismo número.
- **Denominador común:** un denominador igual en dos o más fracciones.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1fd5c0a9-130f-5e97-9c0e-ce9fa210f71b', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 3, 'Suma y resta de fracciones con igual denominador', 'Aprende a sumar y restar fracciones que tienen el mismo denominador y a simplificar el resultado.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sumar y restar fracciones que tienen el mismo denominador.

Doña Carmen corta un pastel en 8 rebanadas iguales. El sábado se comen 3 rebanadas. El domingo se comen 2 más. ¿Qué parte del pastel se comió en total? Juntas las rebanadas: son 5 de las 8 partes.

**¿Cómo se suman?**

Cuando el denominador es igual, las partes son del mismo tamaño. Entonces solo sumas los numeradores. El denominador se queda igual.

Por ejemplo, 1/4 + 2/4 = 3/4. Se juntan 1 parte y 2 partes de cuartos, y resultan 3 cuartos.

**¿Cómo se restan?**

Es lo mismo, pero restas los numeradores. El denominador tampoco cambia. Por ejemplo, 5/6 − 2/6 = 3/6.

Muchas veces puedes simplificar el resultado. Divide arriba y abajo entre el mismo número. En 3/6, divide entre 3. Así, 3/6 = 1/2.

**Ejemplo resuelto:**

Luis pinta una barda en dos días. El lunes pinta 2/8 de la barda. El martes pinta 3/8. ¿Cuánto lleva y cuánto le falta?

1. Suma lo pintado: 2/8 + 3/8 = 5/8.
2. La barda completa es 8/8.
3. Resta lo pintado: 8/8 − 5/8 = 3/8.
4. Luis lleva 5/8 de la barda y le faltan 3/8.

**Lo importante:**

- Con igual denominador, suma o resta solo los numeradores.
- El denominador se queda igual.
- Un entero se escribe con el mismo número arriba y abajo, como 8/8.
- Si puedes, simplifica el resultado.

**Palabras nuevas:**

- **Sumar fracciones:** juntar partes del mismo tamaño.
- **Restar fracciones:** quitar partes del mismo tamaño.
- **Resultado simplificado:** fracción que ya no se puede dividir entre un mismo número.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f8447bb3-ad2b-5675-916d-5c1195ad26ef', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 4, 'Los decimales y el dinero', 'Aprende a leer y escribir números decimales, a compararlos y a relacionarlos con el dinero y las fracciones.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer y comparar números decimales y relacionarlos con el dinero.

Rosa paga una bolsa de pan con $12.50. Ese número tiene un punto. Antes del punto están los pesos. Después del punto están los centavos. Un peso se parte en 100 centavos, así que el dinero ya usa decimales.

**¿Qué es un decimal?**

Un decimal es un número con una parte entera y otra parte menor que un entero. El punto decimal las separa.

Después del punto, cada lugar vale la décima parte del anterior:

- El primer lugar son los décimos. El número 0.1 es un décimo, o sea 1/10.
- El segundo lugar son los centésimos. El número 0.01 es un centésimo, o sea 1/100.

**Decimales y fracciones**

Para pasar una fracción a decimal, busca una fracción equivalente con denominador 10 o 100, como viste en la semana 2. Después escribe el decimal.

Por ejemplo, 1/2 = 5/10 = 0.5. También 3/4 = 75/100 = 0.75. Una moneda de 50 centavos es medio peso, o sea $0.50.

**Ejemplo resuelto:**

Luis ve dos precios: $7.05 y $7.50. ¿Cuál es mayor?

1. Compara los enteros: los dos tienen 7 pesos.
2. Compara los décimos: $7.05 tiene 0 y $7.50 tiene 5.
3. Como 5 es mayor que 0, $7.50 es mayor.
4. La diferencia es 7.50 − 7.05 = 0.45. Son 45 centavos.

Ahora piensa en tres cuartos de peso: 3/4 = 75/100 = 0.75. Son 75 centavos.

**Lo importante:**

- El punto decimal separa los enteros de las partes menores que uno.
- Los primeros lugares después del punto son los décimos y los centésimos.
- Para pasar una fracción a decimal, busca una equivalente con denominador 10 o 100.
- Para comparar decimales, empieza por los enteros y sigue con los décimos.

**Palabras nuevas:**

- **Decimal:** número con una parte entera y una parte menor que un entero.
- **Décimo:** una de 10 partes iguales de un entero.
- **Centésimo:** una de 100 partes iguales de un entero.
- **Centavo:** la centésima parte de un peso.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('e39702a8-e919-529d-b9cd-6e25fec0e5d9', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 5, 'Suma y resta de decimales', 'Aprende a sumar y restar números decimales alineando el punto, con ejemplos de compras y cambio.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sumar y restar números decimales alineando el punto.

Rosa compra pan de $18.50 y leche de $24.75. Quiere saber cuánto debe pagar. También quiere saber cuánto cambio le darán si paga con un billete de $50. Son una suma y una resta con decimales.

**¿Cómo se suman y se restan decimales?**

Escribe un número debajo del otro. Alinea el punto decimal: décimos con décimos y centésimos con centésimos.

Si a un número le faltan lugares, agrega ceros a la derecha. Eso no cambia su valor. Así, 5.2 vale lo mismo que 5.20.

Después suma o resta como con números enteros. Pon el punto del resultado en la misma columna.

**Ejemplo resuelto:**

1. Suma lo que cuesta todo: 18.50 + 24.75 = 43.25.
2. Rosa debe pagar $43.25.
3. Escribe el billete como 50.00 y resta: 50.00 − 43.25 = 6.75.
4. Le dan $6.75 de cambio.

Luis quiere sumar 5.2 y 3.45. Primero agrega un cero a 5.2 y queda 5.20. Luego suma:

- 5.20 + 3.45 = 8.65.

Después Luis resta 7.35 de 20. Escribe 20 como 20.00:

- 20.00 − 7.35 = 12.65.

**Lo importante:**

- Alinea siempre el punto decimal.
- Agrega ceros para que los dos números tengan los mismos lugares.
- Suma o resta como con enteros y baja el punto en su columna.

**Palabras nuevas:**

- **Alinear:** poner los números de modo que queden en la misma columna.
- **Punto decimal:** el punto que separa los enteros de las partes menores que uno.
- **Cambio:** el dinero que te regresan cuando pagas con más de lo que cuesta.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ed25511f-015c-51ef-aa58-8e19b35a86d4', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 6, 'Multiplicar y dividir decimales entre 10, 100 y 1000', 'Aprende a multiplicar y dividir números decimales entre 10, 100 y 1,000 moviendo el punto decimal.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás multiplicar y dividir un decimal entre 10, 100 y 1000 moviendo el punto.

En una tienda venden 10 listones iguales. Cada uno cuesta $12.35. Para saber el total no hace falta una cuenta larga. Basta con mover el punto decimal.

**Multiplicar por 10, 100 y 1,000**

Al multiplicar, el número se hace más grande. El punto se mueve a la derecha:

- Por 10, un lugar.
- Por 100, dos lugares.
- Por 1,000, tres lugares.

Un número entero tiene el punto al final: 85 es 85. Si faltan lugares, agrega ceros. Por ejemplo, 3.45 × 10 = 34.5. También 3.45 × 100 = 345. Y 2.5 × 1000 = 2,500.

**Dividir entre 10, 100 y 1,000**

Al dividir, el número se hace más pequeño. El punto se mueve a la izquierda, los mismos lugares. Por ejemplo, 56.7 ÷ 10 = 5.67. Con 100, el punto se mueve dos lugares: 56.7 ÷ 100 = 0.567.

Al dividir, si faltan lugares, pon ceros a la izquierda: 85 → .85 → 0.85.

**Ejemplo resuelto:**

Rosa compra 10 listones de $12.35 cada uno.

1. Multiplicar por 10 mueve el punto un lugar a la derecha.
2. 12.35 × 10 = 123.5.
3. Rosa paga $123.50.

Luis compra un paquete de 100 tornillos en $85. ¿Cuánto cuesta uno?

1. Dividir entre 100 mueve el punto dos lugares a la izquierda.
2. 85 ÷ 100 = 0.85.
3. Cada tornillo cuesta $0.85, o sea 85 centavos.

**Lo importante:**

- Al multiplicar por 10, 100 o 1,000, el punto va a la derecha.
- Al dividir entre 10, 100 o 1,000, el punto va a la izquierda.
- Si faltan lugares, agrega ceros.

**Palabras nuevas:**

- **Mover el punto:** recorrerlo a la derecha o a la izquierda, según la operación.
- **Cero de relleno:** cero que se agrega para completar los lugares que faltan.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('7cc366c8-8238-57cb-99ec-5d98326ff736', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 7, 'Fracciones y decimales en recetas y medidas', 'Aprende a usar fracciones y decimales para leer recetas, duplicar cantidades y cambiar medidas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás usar fracciones y decimales para leer una receta y cambiar medidas.

Doña Carmen prepara atole para toda la familia. La receta pide 3/4 de litro de leche y 1/2 taza de masa. En la cocina, en la ferretería y en la costura aparecen fracciones y decimales. Se leen igual que en la cocina.

**Fracciones en las recetas**

Doble: multiplica el numerador por 2 (2 × 1/4 = 2/4 = 1/2). Mitad: multiplica el denominador por 2 (la mitad de 1/2 es 1/4).

Por ejemplo, 1/4 de kilo de harina alcanza para 4 personas. Para 8 personas necesitas 2/4, o sea 1/2 kilo.

**Medidas que valen lo mismo**

Estas cuentas te ayudan a cambiar de una medida a otra:

- 1 kilogramo son 1,000 gramos.
- 1 litro son 1,000 ml, que es la forma corta de mililitros.
- 1 metro son 100 centímetros.

**Ejemplo resuelto:**

La receta pide 3/4 de litro de leche, pero tu jarra mide en ml. ¿Cuántos ml necesitas?

1. Un litro son 1,000 ml.
2. Divide entre el denominador 4: 1,000 ÷ 4 = 250.
3. Multiplica por el numerador 3: 250 × 3 = 750.
4. Necesitas 750 ml.

Rosa corta 3 tiras de listón de 2.5 metros cada una. Suma: 2.5 + 2.5 + 2.5 = 7.5. Usa 7.5 metros en total.

Con decimales: 1.5 L × 1,000 = 1,500 ml. También 2.5 m × 100 = 250 cm.

Medio litro es la mitad de 1,000 ml: 1,000 ÷ 2 = 500.

**Lo importante:**

- Para duplicar una receta, multiplica el numerador por 2. Para sacar la mitad, multiplica el denominador por 2.
- Una fracción de una medida se saca dividiendo y multiplicando.
- Aprende cuántos gramos tiene un kilo y cuántos ml tiene un litro.

**Palabras nuevas:**

- **Receta:** lista de ingredientes y cantidades para preparar un platillo.
- **Equivalencia:** dos medidas distintas que valen lo mismo.
- **Mililitro:** una milésima parte de un litro.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('49ce5213-acc5-5993-bced-ce92dbb8612d', 'ef2356a7-9ab9-5a39-ae09-3a540c434001', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Qué es una fracción:** El denominador dice en cuántas partes iguales se partió el entero. El numerador dice cuántas partes tomas. Para sacar una fracción de una cantidad, divide entre el denominador y multiplica por el numerador.

**Semana 2 — Fracciones equivalentes y comparación:** Dos fracciones equivalentes valen lo mismo. Se encuentran multiplicando o dividiendo arriba y abajo por el mismo número. Para comparar, ponles el mismo denominador.

**Semana 3 — Suma y resta de fracciones con igual denominador:** Suma o resta los numeradores. El denominador se queda igual.

**Semana 4 — Los decimales y el dinero:** El punto separa los enteros de los décimos y centésimos. Para pasar una fracción a decimal, busca una equivalente con denominador 10 o 100.

**Semana 5 — Suma y resta de decimales:** Alinea el punto decimal y agrega ceros si hacen falta.

**Semana 6 — Multiplicar y dividir decimales entre 10, 100 y 1,000:** Al multiplicar, el punto va a la derecha. Al dividir, va a la izquierda.

**Semana 7 — Fracciones y decimales en recetas y medidas:** Para el doble, multiplica el numerador por 2. Para la mitad, multiplica el denominador por 2. Usa las equivalencias para cambiar medidas.

**Ejercicios de repaso:**

1. ¿Cuánto es 3/4 de 12?
2. ¿Son equivalentes 2/3 y 4/6?
3. Suma 3/8 + 4/8.
4. Pasa 3/4 a decimal.
5. ¿Cuánto es 3/4 de litro en ml?

**Respuestas:**

1. 12 ÷ 4 = 3. Luego 3 × 3 = 9. Son 9.
2. 2 × 2 = 4 y 3 × 2 = 6. Sí, 2/3 = 4/6.
3. 3/8 + 4/8 = 7/8.
4. 3/4 = 75/100 = 0.75.
5. 1,000 ÷ 4 = 250. Luego 250 × 3 = 750. Son 750 ml.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9650faeb-8ef1-5ca4-8acc-5851ecd0ebc0', '2898d0bb-ad12-56db-91e8-54d521923ba9', 1, 'Seres vivos y su clasificación', 'Aprende qué tienen en común los seres vivos y cómo se agrupan en plantas, animales y hongos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir qué es un ser vivo y ubicarlo en su grupo.

Luis llega al mercado y ve un jitomate, un pollo, un champiñón y una piedra en el piso. Todos están ahí, pero no todos son iguales. La piedra no es un ser vivo. Los otros tres sí lo son.

**¿Qué es un ser vivo?**

Un ser vivo nace, crece, se alimenta, respira, se reproduce y muere. Reproducirse es dar origen a otros seres parecidos a él. Una piedra no hace nada de eso.

**¿Cómo se clasifican?**

Clasificar es juntar en grupos lo que se parece. Los seres vivos se agrupan así:

- **Plantas:** fabrican su alimento con la luz del Sol. Ejemplos: el jitomate y el maíz.
- **Animales:** buscan su alimento y casi todos se mueven. Ejemplos: el pollo y el pez.
- **Hongos:** no fabrican su alimento. Lo toman de restos de plantas y de animales. Ejemplo: el champiñón.
- **Seres muy pequeños:** no se ven a simple vista. Hace falta un microscopio, que es un aparato que muestra grandes las cosas pequeñas.

Los animales se dividen en dos grupos. Los vertebrados tienen huesos por dentro, como el perro y la rana. Los invertebrados no tienen huesos, como el caracol y la mariposa.

**Ejemplo resuelto:**

Rosa quiere saber qué es una rana.

1. Nace, crece, respira y se reproduce. Es un ser vivo.
2. No fabrica su alimento con la luz del Sol. No es una planta.
3. Se mueve y busca su alimento. Es un animal.
4. Tiene huesos por dentro. Es un vertebrado.

**Lo importante:**

- Los seres vivos nacen, crecen, se alimentan, respiran, se reproducen y mueren.
- Se agrupan en plantas, animales, hongos y seres muy pequeños.
- Los animales pueden ser vertebrados o invertebrados.

**Palabras nuevas:**

- **Ser vivo:** el que nace, crece, se reproduce y muere.
- **Clasificar:** juntar en grupos lo que se parece.
- **Vertebrado:** animal que tiene huesos por dentro.
- **Hongo:** ser vivo que no fabrica su alimento, como el champiñón.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('b9d50c91-1f61-5333-b1b3-2dca4a3317f6', '2898d0bb-ad12-56db-91e8-54d521923ba9', 2, 'Las plantas: partes y funciones', 'Conoce las partes de una planta, para qué sirve cada una y cómo la planta fabrica su alimento.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar las partes de una planta y decir para qué sirve cada una.

Doña Carmen deja olvidada una planta cerca de la ventana. Días después, las hojas se voltean hacia la luz. La planta no se mueve de lugar, pero sabe buscar lo que necesita. Veamos cómo funciona.

**¿Qué partes tiene una planta?**

- **Raíz:** sostiene la planta en la tierra y toma agua del suelo.
- **Tallo:** sostiene la planta y lleva el agua hacia arriba.
- **Hojas:** reciben la luz del Sol y fabrican el alimento.
- **Flor:** ayuda a que la planta se reproduzca.
- **Fruto:** protege las semillas.
- **Semilla:** de ella nace una planta nueva.

**¿Cómo fabrica su alimento?**

Las hojas toman luz del Sol y aire. La raíz toma agua. Con todo eso, la planta fabrica su alimento. A este proceso se le llama fotosíntesis. Al terminar, la planta suelta oxígeno, un gas que respiramos las personas y los animales.

**Ejemplo resuelto:**

Luis prepara una comida con zanahoria, espinaca, calabaza y frijol. ¿Qué parte de la planta come en cada caso?

1. La zanahoria es una raíz.
2. La espinaca son hojas.
3. La calabaza es un fruto, porque guarda semillas.
4. El frijol es una semilla.

Así, una sola comida puede traer cuatro partes distintas de plantas.

**Lo importante:**

- Las partes de la planta son raíz, tallo, hojas, flor, fruto y semilla.
- Las hojas fabrican el alimento con luz, aire y agua.
- Las plantas sueltan oxígeno, que necesitamos para respirar.

**Palabras nuevas:**

- **Raíz:** parte de la planta que va bajo la tierra y toma agua.
- **Fotosíntesis:** proceso con el que la planta fabrica su alimento usando la luz.
- **Semilla:** parte de la que nace una planta nueva.
- **Oxígeno:** gas del aire que necesitamos para respirar.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('bdb2e6b5-6a26-5429-b6ea-7a0f9cea59bc', '2898d0bb-ad12-56db-91e8-54d521923ba9', 3, 'Animales y cadenas alimenticias', 'Descubre qué comen los animales y cómo se pasa la energía de un ser vivo a otro en una cadena alimenticia.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es una cadena alimenticia y armar una con tres seres vivos.

En el campo, un conejo come pasto. Más tarde, un águila caza al conejo. Nadie planeó esto, pero así se alimentan los seres vivos: unos comen a otros. Ese orden se llama cadena alimenticia.

**¿Qué comen los animales?**

- **Herbívoros:** comen solo plantas. Ejemplos: el conejo y la vaca.
- **Carnívoros:** comen otros animales. Ejemplos: el águila y la serpiente.
- **Omnívoros:** comen plantas y animales. Ejemplos: el cerdo y las personas.

**¿Qué es una cadena alimenticia?**

Es una fila que muestra quién come a quién. Se escribe con flechas que van del alimento a quien lo come. Tiene tres tipos de seres vivos:

1. **Productores:** son las plantas, porque fabrican su alimento.
2. **Consumidores:** son los animales, porque se alimentan de otros seres vivos.
3. **Descomponedores:** son los hongos y otros seres muy pequeños. Se alimentan de restos y devuelven al suelo los nutrientes, que son las sustancias que sirven de alimento a las plantas.

**Ejemplo resuelto:**

Rosa arma una cadena con pasto, conejo y águila.

1. Busca al productor: el pasto.
2. Busca al que come pasto: el conejo.
3. Busca al que come conejos: el águila.
4. Escribe: pasto → conejo → águila.

Si desaparecen los conejos, el águila tiene menos alimento. Todos dependemos de los demás.

**Lo importante:**

- Hay animales herbívoros, carnívoros y omnívoros.
- Una cadena alimenticia muestra quién come a quién.
- Las cadenas tienen productores, consumidores y descomponedores.

**Palabras nuevas:**

- **Herbívoro:** animal que come solo plantas.
- **Carnívoro:** animal que come otros animales.
- **Productor:** ser vivo que fabrica su alimento, como una planta.
- **Descomponedor:** ser vivo que se alimenta de restos, como un hongo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9b0e3e1f-fdae-5458-b046-aad0254a6a2c', '2898d0bb-ad12-56db-91e8-54d521923ba9', 4, 'El agua y su ciclo', 'Conoce el camino que sigue el agua entre el mar, el cielo y la tierra, y por qué conviene cuidarla.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar el ciclo del agua y decir por qué conviene cuidarla.

Piensa en ropa mojada en un tendedero. Después de unas horas está seca. ¿A dónde se fue el agua? Subió al aire, aunque no la viste. Lo mismo pasa con el agua de los ríos, los lagos y el mar.

**¿Qué es el ciclo del agua?**

Un ciclo es algo que se repite una y otra vez. El agua del planeta no se queda en un solo lugar. Cambia de lugar y de forma. El camino que sigue se llama ciclo del agua.

**Los pasos del ciclo:**

1. **Evaporación.** El Sol calienta el agua de los mares, los ríos y los lagos. Parte de esa agua se vuelve vapor y sube al aire.
2. **Condensación.** Arriba hace más frío. El vapor se enfría y forma gotas muy pequeñas. Esas gotas forman las nubes.
3. **Precipitación.** Las gotas se juntan y pesan más. Entonces caen como lluvia. Si en la nube hace mucho frío, cae nieve. En tormentas fuertes puede caer granizo, que son bolitas de hielo.
4. **Escurrimiento e infiltración.** Parte del agua corre por la tierra hasta los ríos y el mar. Otra parte entra al suelo y llega a los mantos acuíferos, que guardan agua bajo la tierra.

Después, el ciclo empieza otra vez.

**¿Por qué conviene cuidarla?**

Casi toda el agua de la Tierra es salada. El agua dulce que podemos usar es muy poca. Por eso conviene cuidarla en la casa y en otros lugares.

**Ejemplo:**

Doña Carmen encuentra una llave que gotea. Pide que la reparen. También cierra la llave mientras se enjabona las manos. Así gasta menos agua.

**Lo importante:**

- El agua cambia de lugar y de forma, y el ciclo se repite.
- Sus pasos son evaporación, condensación, precipitación, escurrimiento e infiltración.
- El agua dulce que podemos usar es poca.

**Palabras nuevas:**

- **Ciclo:** algo que se repite una y otra vez.
- **Vapor:** agua en forma de gas, que sube al aire.
- **Precipitación:** agua que cae de las nubes como lluvia, granizo o nieve.
- **Manto acuífero:** agua guardada bajo la tierra.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('58f587ba-d667-5755-8de1-a136c61445f4', '2898d0bb-ad12-56db-91e8-54d521923ba9', 5, 'Estados de la materia', 'Reconoce los estados sólido, líquido y gaseoso y los cambios que ocurren con el calor y el frío.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer los tres estados de la materia y explicar cómo cambian.

Rosa saca hielo del congelador y lo pone en un vaso. Poco a poco se vuelve agua. Si pone esa agua a calentar, sale vapor. Era la misma sustancia en tres formas distintas.

**¿Qué es la materia?**

Materia es todo lo que ocupa un lugar y tiene masa, es decir, cantidad de materia. El hielo, el aire, una mesa y tu cuerpo son materia. La materia se presenta en tres estados.

**Los tres estados:**

- **Sólido:** tiene forma propia y no cambia si lo pasas a otro recipiente. Ejemplo: una piedra.
- **Líquido:** toma la forma del recipiente que lo guarda. Ejemplo: el aceite.
- **Gaseoso:** se expande y llena todo el espacio. Ejemplo: el gas de la estufa.

**¿Cómo cambia de estado?**

El calor y el frío hacen que la materia cambie:

1. **Fusión:** de sólido a líquido, con calor. El hielo se derrite.
2. **Evaporación:** de líquido a gas, con calor. El agua se evapora. La ropa mojada se seca, y el agua que hierve suelta vapor.
3. **Condensación:** de gas a líquido, con frío. El vapor forma gotas.
4. **Solidificación:** de líquido a sólido, con frío. El agua se vuelve hielo.

**Ejemplo resuelto:**

Luis pone mantequilla en un sartén caliente y se deshace. ¿Qué cambio ocurrió?

1. Antes, la mantequilla era sólida.
2. Con el calor, quedó líquida.
3. De sólido a líquido es fusión.

**Lo importante:**

- La materia puede ser sólida, líquida o gaseosa.
- El calor y el frío cambian el estado de la materia.
- Los cambios son fusión, evaporación, condensación y solidificación.

**Palabras nuevas:**

- **Materia:** todo lo que ocupa un lugar y tiene masa, es decir, cantidad de materia.
- **Fusión:** cambio de sólido a líquido por el calor.
- **Condensación:** cambio de gas a líquido por el frío.
- **Solidificación:** cambio de líquido a sólido por el frío.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('136a66df-5f10-5d72-9e28-fd42cfc3a205', '2898d0bb-ad12-56db-91e8-54d521923ba9', 6, 'Reducir, reusar y reciclar', 'Aprende qué son las tres erres y cómo aplicarlas en casa para producir menos basura.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar las tres erres y dar un ejemplo de cada una.

Una vecina vacía su bote de basura cada día. Se da cuenta de que casi todo es envase, papel y restos de comida. Si cambia algunos hábitos, el bote se llenará más despacio. Para eso sirven las tres erres.

**¿Cuáles son las tres erres?**

- **Reducir:** usar menos cosas que se vuelven basura. Llevar tu bolsa de tela al mercado es un ejemplo.
- **Reusar:** volver a usar un objeto antes de tirarlo. Un frasco de vidrio sirve para guardar frijoles.
- **Reciclar:** convertir un material usado en un material nuevo. El papel y el cartón, el vidrio y el metal se pueden reciclar.

**¿Cómo separar la basura?**

Los residuos orgánicos vienen de seres vivos: cáscaras, restos de comida y hojas. Los inorgánicos no vienen de seres vivos: plástico, vidrio y metal. Separarlos ayuda a reciclar mejor. El papel y el cartón también se separan como residuos que se pueden reciclar. Pregunta en tu localidad cómo se recoge la basura separada.

**Ejemplo resuelto:**

Rosa revisa lo que va a tirar y decide qué hacer con cada cosa.

1. Una botella de vidrio: la separa para reciclar.
2. Un frasco limpio: lo reusa para guardar azúcar.
3. Cáscaras de naranja: son orgánicas y las pone aparte.
4. Una bolsa nueva de plástico: la rechaza y usa su bolsa de tela. Así reduce.

**Lo importante:**

- Reducir es usar menos cosas que se vuelven basura.
- Reusar es darle otro uso a un objeto.
- Reciclar es convertir un material usado en uno nuevo.

**Palabras nuevas:**

- **Residuo:** lo que sobra y ya no usamos.
- **Orgánico:** que viene de seres vivos, como una cáscara.
- **Inorgánico:** que no viene de seres vivos, como el vidrio.
- **Reciclar:** convertir un material usado en un material nuevo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6aac4f6d-be6b-5c35-b562-d993f4392a5a', '2898d0bb-ad12-56db-91e8-54d521923ba9', 7, 'Fenómenos naturales y protección civil', 'Conoce qué son los fenómenos naturales y qué acciones básicas ayudan ante un sismo, un huracán o una inundación.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar tres fenómenos naturales y las acciones básicas para cuidarte.

Luis está en su casa cuando todo empieza a moverse. Él sabe qué hacer, porque antes lo habló con su familia.

**¿Qué es un fenómeno natural?**

Es un cambio que ocurre en la naturaleza sin que lo provoque una persona. La lluvia y el viento son fenómenos naturales. Algunos pueden causar daños. La protección civil es el trabajo de las autoridades y de la gente para cuidar la vida de las personas.

**¿Qué hacer en cada caso?**

- **Sismo.** Mantén la calma. Sal sin correr ni empujar hasta el punto de reunión. No uses el elevador. Si no puedes salir, ve a una zona segura: un lugar lejos de ventanas y de objetos que puedan caerte, por ejemplo junto a un muro firme. Agáchate y cubre tu cabeza.
- **Huracán.** Quédate en un lugar cerrado y firme, lejos de las ventanas. Si las autoridades piden salir de la zona, hazlo.
- **Inundación.** Sube a un lugar alto. No cruces corrientes de agua a pie ni en auto.

En una emergencia, llama al 911.

**Ejemplo resuelto:**

Rosa hace un plan para su casa.

1. Elige un punto de reunión fuera de casa, lejos de cables y árboles grandes.
2. Busca la salida y las zonas seguras de cada cuarto.
3. Comenta el plan con quienes viven con ella.

**Lo importante:**

- Un fenómeno natural ocurre sin que una persona lo provoque.
- Ante un sismo, sal con calma al punto de reunión.
- Ante una inundación, sube a un lugar alto y no cruces el agua.
- En una emergencia, llama al 911.

**Palabras nuevas:**

- **Sismo:** movimiento fuerte de la tierra.
- **Huracán:** ciclón tropical con vientos muy fuertes y lluvia.
- **Inundación:** terreno cubierto de agua que normalmente no la tiene.
- **Punto de reunión:** lugar seguro donde se junta la familia.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1a6dc91d-53e0-52f9-8423-409619973c29', '2898d0bb-ad12-56db-91e8-54d521923ba9', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Seres vivos y su clasificación:** Un ser vivo nace, crece, se alimenta, respira, se reproduce y muere. Se agrupa en plantas, animales, hongos o seres muy pequeños.

**Semana 2 — Las plantas:** Sus partes son raíz, tallo, hojas, flor, fruto y semilla. Con la fotosíntesis, las hojas fabrican el alimento con luz, aire y agua.

**Semana 3 — Animales y cadenas alimenticias:** Hay herbívoros, carnívoros y omnívoros. Una cadena alimenticia tiene productores, consumidores y descomponedores.

**Semana 4 — El agua y su ciclo:** Sus pasos son evaporación, condensación, precipitación, escurrimiento e infiltración. El agua dulce es poca y hay que cuidarla.

**Semana 5 — Estados de la materia:** Los estados son sólido, líquido y gaseoso. Los cambios son fusión, evaporación, condensación y solidificación.

**Semana 6 — Reducir, reusar y reciclar:** Reducir es usar menos. Reusar es volver a usar. Reciclar es hacer un material nuevo con uno usado.

**Semana 7 — Fenómenos naturales y protección civil:** Ante un sismo, sal con calma al punto de reunión. Ante una inundación, sube a un lugar alto. En una emergencia, llama al 911.

**Ejercicios de repaso:**

1. ¿El champiñón es planta? No. No fabrica su alimento, así que es un hongo.
2. Arma una cadena con pasto, conejo y águila. Pasto → conejo → águila. El pasto es el productor.
3. ¿Cómo se llama el cambio de gas a líquido? Es condensación. Pasa con las gotas en un vaso frío.
4. Un frasco limpio se usa para guardar azúcar. Eso es reusar.
5. Empieza a temblar. Mantén la calma, aléjate de las ventanas y sal sin correr al punto de reunión.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6b4e0236-dfea-5d57-a562-6df9ac3669dc', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 1, 'La carta y el correo electrónico', 'Aprende las partes de una carta y de un correo, y cómo escribir cada una con claridad.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás escribir una carta y un correo electrónico con todas sus partes.

Luis quiere avisar a la administración de su edificio que una lámpara del pasillo no funciona. Puede llevar un papel o mandar un mensaje. En los dos casos necesita ordenar lo que dice. Así lo entenderán a la primera.

**Las partes de una carta**

Una carta lleva estas partes, en este orden:

1. **Lugar y fecha**, arriba: «Puebla, 12 de marzo».
2. **Saludo:** En carta o correo, el saludo lleva dos puntos: «Buenas tardes:».
3. **Cuerpo:** el mensaje, en párrafos cortos.
4. **Despedida:** «Atentamente» o «Saludos».
5. **Firma:** tu nombre.

Con alguien que no conoces, escribe una carta formal. Trátalo de usted y despídete con «Atentamente». Con un familiar o un amigo, la carta puede ser informal: usa tú y un saludo cercano.

**El correo electrónico**

El correo tiene las mismas partes. Además lleva datos arriba:

- **Para:** la dirección de quien lo recibe, como nombre@ejemplo.com.
- **Asunto:** una frase corta que dice de qué trata.
- **Adjunto:** un archivo que mandas junto con el mensaje, como una foto.

Revisa la dirección letra por letra antes de enviar. Un error y el mensaje llega a otra persona.

**Ejemplo resuelto:**

Luis escribe su correo paso a paso.

1. Para: nombre@ejemplo.com.
2. Asunto: Lámpara descompuesta en el pasillo.
3. Saludo: «Buenas tardes:».
4. Mensaje: «La lámpara del segundo piso no funciona desde el lunes. ¿Pueden repararla?»
5. Despedida y firma: «Atentamente, Luis Ramírez».

**Lo importante:**

- La carta lleva lugar y fecha, saludo, cuerpo, despedida y firma.
- Con personas que no conoces, usa trato formal.
- El correo agrega destinatario, asunto y, si hace falta, un adjunto.

**Palabras nuevas:**

- **Destinatario:** persona que recibe la carta o el correo.
- **Asunto:** frase corta que dice de qué trata el correo.
- **Adjunto:** archivo que se manda junto con el correo.
- **Formal:** que usa un trato respetuoso, como el de usted.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('3264b284-6e73-5026-8184-5c9d7bcd66f8', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 2, 'Llenar formatos y solicitudes', 'Aprende a leer un formato, llenar cada campo con datos claros y revisar todo antes de entregarlo.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás llenar un formato o una solicitud completa y sin errores.

Rosa quiere sacar su credencial de la biblioteca del barrio. La encargada le da una hoja con espacios vacíos. Esa hoja es un formato. Si Rosa lo llena mal, tendrá que repetirlo. Por eso conviene hacerlo con calma.

**Antes de escribir**

Lee todo el formato primero. Fíjate en las instrucciones, como «con letra de molde» o «tinta negra». Letra de molde es la que se escribe separada y sin enlazar, como la de imprenta.

**Cómo llenar cada campo**

Un campo es cada espacio donde se anota un dato. Sigue estos consejos:

- Escribe con letra clara y sin tachaduras.
- Anota tu nombre completo, como aparece en tus documentos.
- Si un campo no se aplica a ti, escribe «No aplica». No lo dejes vacío.
- Escribe la fecha con día, mes y año.
- Firma al final, solo si el formato lo pide.

Una solicitud es un formato donde pides algo, como un servicio o un permiso.

**Ejemplo resuelto:**

Rosa llena su solicitud de credencial.

| Campo | Rosa escribe |
| --- | --- |
| Nombre completo | Rosa Martínez López |
| Domicilio | Calle Morelos 25, Centro |
| Correo | nombre@ejemplo.com |
| Trabajo | No aplica |

Después lee todo otra vez. Revisa que cada letra se entienda. Al final pone la fecha y su firma.

**Lo importante:**

- Lee todo el formato y sus instrucciones antes de escribir.
- Llena cada campo con letra clara y datos correctos.
- Escribe «No aplica» en lo que no te toca.
- Revisa antes de entregar.

**Palabras nuevas:**

- **Formato:** hoja con espacios vacíos para llenar con tus datos.
- **Campo:** espacio del formato donde se anota un dato.
- **Solicitud:** formato donde pides un servicio o un permiso.
- **Letra de molde:** letra separada y sin enlazar, fácil de leer.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('acb6d781-87fa-597f-a054-a92c9cd397ee', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 3, 'Conectores y signos de puntuación', 'Aprende a unir ideas con conectores y a usar punto, coma, dos puntos y signos de pregunta.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás unir ideas con conectores y usar bien los signos de puntuación.

Leer esto es difícil: «Llegué al mercado estaba cerrado volví a casa». Faltan señales que separen y unan las ideas. Esas señales son los conectores y los signos de puntuación.

**Los conectores**

Un conector es una palabra que une ideas y dice cómo se relacionan.

- **y, además:** suman una idea a otra.
- **pero, aunque:** muestran una diferencia.
- **porque, por eso:** dan una causa o un resultado.
- **primero, después, por último:** ponen las ideas en orden.

**Los signos de puntuación**

- **El punto** cierra una idea completa. Después va mayúscula.
- **La coma** separa los elementos de una lista y va antes de «pero». No se pone solo porque hagas una pausa al leer.
- **Los dos puntos** anuncian una lista o una explicación.
- **Los signos de interrogación** abren con ¿ y cierran con ?.
- **Los signos de exclamación** abren con ¡ y cierran con !.

**Ejemplo resuelto:**

Arreglamos el texto del principio paso a paso.

1. Separa las ideas con puntos: «Llegué al mercado. Estaba cerrado. Volví a casa».
2. Une las dos primeras con un conector: «Llegué al mercado, pero estaba cerrado».
3. Agrega otro conector para el final: «Por eso volví a casa».

Queda así: «Llegué al mercado, pero estaba cerrado. Por eso volví a casa».

**Lo importante:**

- Los conectores unen ideas y muestran su relación.
- El punto cierra una idea. La coma separa una lista y va antes de «pero».
- Los dos puntos anuncian una lista o una explicación.
- Pregunta y exclamación se encierran entre dos signos.

**Palabras nuevas:**

- **Conector:** palabra que une ideas, como «pero» o «porque».
- **Signo de puntuación:** marca escrita que ordena el texto, como el punto o la coma.
- **Lista:** serie de cosas una tras otra, como «pan, leche y huevos».', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('47508186-6fd6-5048-9bba-377f4e41c265', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 4, 'Narrar una experiencia personal', 'Aprende a contar algo que viviste con orden: cómo empezó, qué pasó y cómo terminó.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás contar por escrito una experiencia que viviste, con inicio, desarrollo y final.

Todos tenemos historias: el primer día en un trabajo, un viaje en camión o una fiesta en el barrio. Cuando las cuentas en voz alta, las ideas salen solas. Al escribirlas, hay que ponerles orden para que otros las entiendan.

**¿Qué es narrar?**

Narrar es contar lo que pasó, en el orden en que pasó. Una experiencia personal la cuentas tú, en primera persona: «salí», «vi», «aprendí».

**Las tres partes**

- **Inicio:** dices quién, cuándo y dónde.
- **Desarrollo:** cuentas lo que pasó, paso a paso.
- **Final:** dices cómo terminó y qué aprendiste.

Usa el pasado, porque la historia ya ocurrió. Por ejemplo: «caminé», «llegué», «esperé». Los conectores de orden ayudan: primero, después, al final.

**Ejemplo resuelto:**

Luis cuenta el día que perdió el camión.

1. **Inicio:** «El lunes salí temprano a una cita».
2. **Desarrollo:** «El camión no llegaba. Esperé un rato y decidí caminar. Después tomé un atajo por el parque».
3. **Final:** «Llegué a tiempo, pero muy cansado. Desde entonces salgo con más tiempo».

Luis no escribió todo lo que ocurrió ese día. Eligió solo lo que importa para su historia.

**Lo importante:**

- Narrar es contar lo que pasó, en orden.
- Una historia tiene inicio, desarrollo y final.
- Usa el pasado y cuenta solo lo que importa.

**Palabras nuevas:**

- **Narrar:** contar una historia en orden.
- **Experiencia:** algo que te pasó o que viviste.
- **Primera persona:** forma de contar con «yo», como «salí» o «vi».
- **Desarrollo:** parte de la historia donde pasan las cosas.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('37ff0a7a-30ea-58d5-b1b8-790e9a19380a', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 5, 'Redactar un aviso o anuncio', 'Aprende a escribir un aviso corto que diga qué pasa, cuándo, dónde y con quién informarse.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás redactar un aviso o un anuncio claro y corto.

En la entrada de un edificio hay un papel pegado. La gente lo lee de pie, en pocos segundos. Si el papel es largo o confuso, nadie lo termina. Un buen aviso se entiende de un vistazo.

**Aviso y anuncio**

Un aviso informa algo a un grupo, como una reunión o un corte de agua. Un anuncio ofrece algo, como una venta o un servicio. Los dos se escriben igual de cortos.

**Qué datos lleva**

- **Título:** dice de qué se trata, en pocas palabras y con letra grande.
- **Qué:** el hecho principal.
- **Cuándo:** día y hora.
- **Dónde:** el lugar.
- **Contacto:** con quién preguntar, si hace falta.

Usa palabras sencillas y oraciones cortas. Quita lo que sobra.

**Ejemplo resuelto:**

Doña Carmen quiere avisar a sus vecinos de una reunión.

1. **Título:** Reunión de vecinos.
2. **Qué:** Hablaremos del cuidado de la escalera.
3. **Cuándo:** Sábado, a las 6 de la tarde.
4. **Dónde:** En el patio del edificio.
5. **Contacto:** Dudas con doña Carmen, departamento 3.

También puede ser un anuncio. Rosa escribe: «Se vende bicicleta. Buen estado. Informes (para más información) con Rosa, local 4».

**Lo importante:**

- El aviso informa y el anuncio ofrece.
- Lleva título, qué, cuándo, dónde y contacto.
- Debe ser corto y fácil de leer de lejos.

**Palabras nuevas:**

- **Aviso:** texto corto que informa algo a varias personas.
- **Anuncio:** texto corto que ofrece un producto o un servicio.
- **Contacto:** persona o dato para preguntar más.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('7fc84a0d-58b4-509a-bdb8-ccc581b99c1c', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 6, 'Revisar y corregir lo que escribimos', 'Aprende a releer un texto y a corregir sus errores de mayúsculas, puntuación, ortografía y claridad.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás revisar un texto y corregir sus errores.

Luis escribe un mensaje importante y lo manda de inmediato. Después ve que una palabra salió mal escrita. Ya no puede arreglarlo. Una lectura más, antes de entregar, evita ese problema.

**¿Por qué revisar?**

Casi nadie escribe perfecto la primera vez. Revisar es leer lo escrito con ojos de lector y mejorarlo. Corregir es cambiar lo que está mal.

**Una lista para revisar**

Lee tu texto varias veces, una por cada punto:

1. **Ideas:** ¿se entiende lo que quiero decir?
2. **Orden:** ¿las ideas van una tras otra?
3. **Mayúsculas y puntos:** ¿cada oración empieza con mayúscula y termina con punto o con su signo de cierre?
4. **Ortografía:** ¿las palabras están bien escritas? Si dudas, busca en un diccionario.
5. **Repeticiones:** ¿se repite mucho una palabra?

Leer en voz alta ayuda mucho. Si tropiezas al leer, ahí hay algo que arreglar.

**Ejemplo resuelto:**

Texto original: «ayer fui al mercado compre jitomates y cebolla pero no encontre cilantro».

1. Mayúscula al inicio: «Ayer».
2. Punto para separar dos ideas: «Ayer fui al mercado. Compré...».
3. Tilde (acento escrito) en «compré» y en «encontré».
4. Coma antes de «pero».

Queda así: «Ayer fui al mercado. Compré jitomates y cebolla, pero no encontré cilantro».

**Lo importante:**

- Revisa siempre antes de entregar o enviar.
- Lee varias veces, fijándote en un punto cada vez.
- Leer en voz alta te ayuda a encontrar errores.

**Palabras nuevas:**

- **Revisar:** leer de nuevo un texto para buscar errores.
- **Corregir:** cambiar lo que está mal para dejarlo bien.
- **Ortografía:** forma correcta de escribir las palabras.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('b63ff696-da12-5ece-9950-ad4fa86c5325', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 7, 'Mensajes digitales con claridad y cortesía', 'Aprende a escribir mensajes de texto y de correo que se entiendan bien y traten con respeto.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás escribir mensajes digitales claros y corteses.

La señora Carmen recibe un mensaje en su celular: «oye ya mandame el recibo». No sabe quién lo manda ni qué recibo necesita. Además, el tono suena a orden. Lo mandó Luis. En un mensaje no se ve la cara de nadie. Por eso las palabras deben cuidar el trato.

**Claridad**

Un buen mensaje se entiende sin preguntas. Para lograrlo:

- Di quién eres, si la otra persona no te conoce.
- Escribe una idea por oración.
- Pide una sola cosa a la vez y di para cuándo la necesitas.
- Evita abreviaturas que otros no conocen.

**Cortesía**

Cortesía es tratar bien a los demás con tus palabras.

- Empieza con un saludo y termina con «gracias».
- Usa «por favor» cuando pidas algo.
- No escribas todo en mayúsculas. Parece que gritas.
- Respeta el horario de los demás. No pidas respuesta urgente de noche.

**Cuidado con tus datos**

Nunca mandes contraseñas ni números de tu tarjeta por mensaje.

**Ejemplo resuelto:**

Mejoramos el mensaje del principio.

1. Agrega un saludo: «Buenas tardes, señora Carmen».
2. Di quién eres y qué necesitas: «Soy Luis. ¿Me puede enviar el recibo de mi pago antes del viernes?».
3. Cierra con gracias: «Gracias por su ayuda».

En mensajes digitales basta una coma tras el saludo. Los dos puntos son para cartas y correos.

**Lo importante:**

- Un mensaje claro se entiende sin preguntas.
- Saluda, pide por favor y da las gracias.
- No uses mayúsculas en todo el mensaje.

**Palabras nuevas:**

- **Cortesía:** buen trato hacia los demás al hablar o escribir.
- **Tono:** la forma en que suena un mensaje, amable o seco.
- **Abreviatura:** palabra escrita en forma corta.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6d2c1430-a5a9-5296-9a56-1bc6979a49e5', '974e8f72-0af9-5772-98e3-19c4571ac6d6', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — La carta y el correo electrónico:** La carta lleva lugar y fecha, saludo, cuerpo, despedida y firma. El correo agrega destinatario, asunto y, si hace falta, un adjunto.

**Semana 2 — Llenar formatos y solicitudes:** Lee todo antes de escribir. Llena cada campo con letra clara. Escribe «No aplica» en lo que no te toca y revisa al final.

**Semana 3 — Conectores y signos de puntuación:** Los conectores unen ideas. El punto cierra una idea. La coma separa una lista y va antes de «pero», no por una pausa al leer.

**Semana 4 — Narrar una experiencia personal:** Una historia tiene inicio, desarrollo y final. Se cuenta en orden y en pasado.

**Semana 5 — Redactar un aviso o anuncio:** Lleva título, qué, cuándo, dónde y contacto. Debe ser corto y claro.

**Semana 6 — Revisar y corregir lo que escribimos:** Lee varias veces, fijándote en un punto cada vez. Leer en voz alta ayuda.

**Semana 7 — Mensajes digitales con claridad y cortesía:** Saluda, pide por favor y da las gracias. No escribas todo en mayúsculas.

**Ejercicios de repaso:**

1. ¿Qué parte de una carta va al final? La firma, después de la despedida.
2. Une con un conector: «Quería ir. Llovía mucho». Respuesta: «Quería ir, pero llovía mucho».
3. Un formato pide «Segundo apellido» y no tienes. Escribes «No aplica».
4. Ordena: 1) Al final llegué a tiempo. 2) Salí temprano. 3) El camión no llegaba. Respuesta: «Salí temprano. El camión no llegaba. Al final llegué a tiempo». Así lo corriges al revisar.
5. Corrige: «hola necesito el recibo». Respuesta: «Hola, buenas tardes. ¿Me puede enviar el recibo, por favor?».

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('b8da219e-092f-5b33-8d2f-ef6c4598adfc', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 1, 'Líneas, ángulos y figuras planas', 'Reconoce líneas rectas y curvas, ángulos y figuras planas en los objetos que ves todos los días.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer líneas, ángulos y figuras planas en los objetos de tu casa.

Mira la puerta de tu casa. Sus orillas son rectas y sus esquinas parecen cuadros. La llanta de una bicicleta, en cambio, es redonda. Las formas están por todas partes y tienen nombre.

**¿Qué son las líneas?**

Una línea recta va siempre hacia el mismo lado, como el borde de una regla. Una línea curva se va doblando, como el borde de un plato.

Dos líneas son paralelas si nunca se juntan, como las vías del tren. Son perpendiculares si se cruzan y forman una esquina, como las orillas de una hoja.

**¿Qué es un ángulo?**

Un ángulo se forma cuando dos líneas se juntan en un punto. Se mide en grados, y su símbolo es °.

- El ángulo recto mide 90°. Es la esquina de una hoja.
- El ángulo agudo mide menos de 90°. Es más cerrado.
- El ángulo obtuso mide más de 90°.

Dos ángulos rectos juntos forman una línea recta: 90° + 90° = 180°.

**Figuras planas**

Una figura plana se dibuja sobre una superficie, como una hoja. El círculo es redondo, como una moneda. El triángulo tiene tres lados. El cuadrado tiene cuatro lados iguales, como un azulejo. El rectángulo tiene cuatro lados, y los opuestos son iguales, como una puerta.

**Ejemplo resuelto:**

Luis abre una puerta hasta formar un ángulo de 90° con la pared. Luego la abre 30° más. ¿Qué ángulo tiene ahora? Después la abre hasta 180°. ¿Cuánto le falta?

1. Suma los dos ángulos: 90° + 30° = 120°.
2. Compara con 90°: 120 es mayor, así que el ángulo es obtuso.
3. Resta lo que ya abrió de 180°: 180° − 120° = 60°.

**Lo importante:**

- Las líneas pueden ser rectas o curvas.
- Las paralelas nunca se juntan. Las perpendiculares forman una esquina.
- Un ángulo recto mide 90°.

**Palabras nuevas:**

- **Ángulo:** abertura que forman dos líneas que se juntan en un punto.
- **Grado:** unidad con la que se mide un ángulo.
- **Paralelas:** líneas que van lado a lado y nunca se juntan.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1b2dafcb-2054-5bdf-a36a-eb99414a9dfc', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 2, 'Triángulos y cuadriláteros', 'Distingue los tipos de triángulos y de cuadriláteros y calcula el ángulo que falta en cada uno.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar triángulos y cuadriláteros y calcular un ángulo que falta.

Una tienda de campaña tiene el frente en forma de triángulo. Una mesa del mercado tiene la tapa de cuatro lados. Los dos son figuras que verás seguido, y cada una tiene varios tipos.

**Los triángulos**

Un triángulo tiene tres lados y tres ángulos. Se nombra por sus lados:

- Equilátero: sus tres lados miden lo mismo.
- Isósceles: dos lados miden lo mismo.
- Escaleno: ningún lado mide lo mismo.

Si uno de sus ángulos mide 90°, es un triángulo rectángulo. Los tres ángulos de cualquier triángulo suman 180°.

**Los cuadriláteros**

Un cuadrilátero tiene cuatro lados. Sus cuatro ángulos suman 360°.

- Cuadrado: cuatro lados iguales y cuatro esquinas rectas.
- Rectángulo: cuatro esquinas rectas y lados opuestos iguales.
- Rombo: cuatro lados iguales, pero las esquinas no son rectas.
- Paralelogramo o romboide: lados opuestos paralelos e iguales, sin esquinas rectas.
- Trapecio: solo dos de sus lados son paralelos.

**Ejemplo resuelto:**

Un triángulo tiene un ángulo de 90° y otro de 35°. ¿Cuánto mide el tercero?

1. Suma los ángulos que conoces: 90° + 35° = 125°.
2. Resta de 180°: 180° − 125° = 55°.
3. El tercer ángulo mide 55°.

Un cuadrilátero tiene ángulos de 90°, 90° y 100°. ¿Cuánto mide el cuarto?

1. Suma: 90° + 90° + 100° = 280°.
2. Resta de 360°: 360° − 280° = 80°.

**Lo importante:**

- Los ángulos de un triángulo suman 180°.
- Los ángulos de un cuadrilátero suman 360°.
- El cuadrado y el rectángulo tienen cuatro esquinas rectas.

**Palabras nuevas:**

- **Equilátero:** triángulo con los tres lados iguales.
- **Cuadrilátero:** figura de cuatro lados.
- **Trapecio:** cuadrilátero con un solo par de lados paralelos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1b68d6f3-92f8-5c97-b4d7-81bacf61a68b', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 3, 'Perímetro', 'Aprende a calcular el perímetro de triángulos, cuadrados y rectángulos sumando sus lados.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás calcular el perímetro de un triángulo, un cuadrado y un rectángulo.

Don Pedro quiere cercar su terreno con alambre. Antes de comprar, necesita saber cuántos metros de alambre usará. Para eso mide el contorno completo del terreno.

**¿Qué es el perímetro?**

El perímetro es la medida del contorno de una figura. Es lo que recorrerías si dieras una vuelta por la orilla. Se obtiene sumando todos los lados.

Se mide en unidades de longitud, como centímetros (cm) o metros (m).

**Atajos para sumar**

- En un cuadrado los cuatro lados son iguales. Multiplica el lado por 4.
- En un rectángulo hay dos lados largos y dos cortos. Suma el largo y el ancho, y multiplica por 2.
- En un triángulo suma sus tres lados.

**Ejemplo resuelto:**

El terreno de don Pedro es un rectángulo de 12 m de largo y 8 m de ancho. ¿Cuánto alambre necesita para una vuelta?

1. Suma los cuatro lados: 12 m + 8 m + 12 m + 8 m = 40 m.
2. Con el atajo: 12 m + 8 m = 20 m, y 20 m × 2 = 40 m.
3. Necesita 40 m de alambre.

Un marco de foto cuadrado mide 5 cm de lado. Su perímetro es 4 × 5 cm = 20 cm.

Un letrero con forma de triángulo tiene lados de 6 cm, 7 cm y 9 cm. Su perímetro es 6 cm + 7 cm + 9 cm = 22 cm.

**Lo importante:**

- El perímetro es la suma de todos los lados.
- En un cuadrado, multiplica el lado por 4.
- Se escribe con unidad de longitud: cm o m.

**Palabras nuevas:**

- **Perímetro:** medida del contorno de una figura.
- **Contorno:** línea que rodea una figura por fuera.
- **Lado:** cada una de las líneas que forman una figura.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c06821a9-4c0b-54fa-b6c8-da07064f9a32', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 4, 'Área de cuadrados, rectángulos y triángulos', 'Aprende a calcular cuánta superficie cubren un cuadrado, un rectángulo y un triángulo.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás calcular el área de un cuadrado, un rectángulo y un triángulo.

Rosa quiere poner loseta en el piso de su cocina. Necesita saber cuánto piso hay que cubrir. Eso no es el contorno, sino toda la superficie de adentro.

**¿Qué es el área?**

El área es la medida de la superficie que cubre una figura. Se cuenta en cuadritos. Si cada cuadrito mide 1 m por 1 m, su área es 1 m². Se lee «un metro cuadrado».

También hay centímetros cuadrados: cm².

**Las tres fórmulas**

- Cuadrado: lado × lado.
- Rectángulo: base × altura. En un rectángulo, el largo es la base y el ancho es la altura.
- Triángulo: base × altura ÷ 2. Es la mitad de un rectángulo con la misma base y altura.

La base es el lado donde se apoya la figura. La altura es la distancia desde la base hasta el punto más alto de la figura. Se mide en línea recta hacia arriba, formando esquina con la base, como una plomada.

**Ejemplo resuelto:**

El piso de la cocina de Rosa mide 4 m de largo y 3 m de ancho.

1. Es un rectángulo. Multiplica base por altura.
2. 4 m × 3 m = 12 m².
3. Necesita loseta para 12 m².

Un azulejo cuadrado mide 6 cm de lado. Su área es 6 cm × 6 cm = 36 cm².

Una bandera triangular tiene base de 10 cm y altura de 6 cm.

1. Primero como rectángulo: 10 cm × 6 cm = 60 cm².
2. Después la mitad: 60 cm² ÷ 2 = 30 cm².

**Lo importante:**

- El área mide la superficie de adentro de una figura.
- Se escribe con unidades cuadradas: cm² o m².
- El triángulo es la mitad de un rectángulo.

**Palabras nuevas:**

- **Área:** medida de la superficie que cubre una figura.
- **Base:** lado sobre el que se apoya una figura.
- **Altura:** distancia recta desde la base hasta arriba.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('babda7cb-6e2d-5630-ac18-3f4633700335', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 5, 'Longitud: metro, centímetro y kilómetro', 'Aprende a medir longitudes y a cambiar entre metros, centímetros y kilómetros.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás medir longitudes y cambiar entre metros, centímetros y kilómetros.

Doña Carmen compra 2 m de tela. Para coser necesita saber cuántos centímetros son. En la tienda la tela se mide en metros, pero la cinta de costura trae centímetros.

**¿Qué es la longitud?**

La longitud es qué tan largo es algo. Hay tres unidades muy comunes:

- El centímetro (cm) sirve para cosas pequeñas, como un lápiz.
- El metro (m) sirve para cosas medianas, como una mesa o una pared.
- El kilómetro (km) sirve para distancias largas, como la que hay entre dos pueblos.

**Equivalencias**

- 1 m = 100 cm.
- 1 km = 1000 m.

Para pasar de una unidad grande a una chica, multiplica. Para pasar de una chica a una grande, divide.

**Ejemplo resuelto:**

Doña Carmen compra 2 m de tela y usa 75 cm. ¿Cuánta le queda?

1. Pasa los metros a centímetros: 2 × 100 = 200 cm.
2. Resta lo que usó: 200 − 75 = 125 cm.
3. Le quedan 125 cm.

Luis camina 3 km para ir al trabajo. Ida y vuelta son 3 km + 3 km = 6 km. En metros, 6 × 1000 = 6000 m.

Una cuerda mide 450 cm. Para pasarla a metros, divide: 450 ÷ 100 = 4, y sobran 50. Son 4 m con 50 cm.

**Lo importante:**

- 1 m es igual a 100 cm.
- 1 km es igual a 1000 m.
- Al pasar a una unidad más chica, multiplica. Al pasar a una más grande, divide.

**Palabras nuevas:**

- **Longitud:** qué tan largo es algo.
- **Equivalencia:** dos medidas distintas que valen lo mismo.
- **Kilómetro:** unidad que vale 1000 metros.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('45f2e278-74e9-5068-b204-c278623b6c99', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 6, 'Peso y capacidad: kilo, gramo, litro y mililitro', 'Aprende a medir peso y capacidad y a cambiar entre kilos y gramos, y entre litros y mililitros.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás medir peso y capacidad y cambiar entre kilos y gramos, y entre litros y mililitros.

Rosa compra 2 kg de frijol en el mercado. Su receta pide 500 g. También compra una botella de agua de 1 L y quiere llenar vasos pequeños. Para esto necesita unidades de peso y de capacidad.

**Peso**

El peso dice qué tan pesado es algo. El kilogramo (kg) se llama también kilo. El gramo (g) sirve para cosas ligeras.

- 1 kg = 1000 g.

**Capacidad**

La capacidad dice cuánto líquido cabe en un recipiente. El litro (L) sirve para botellas y garrafones. El mililitro (ml) sirve para cantidades pequeñas, como una cucharada.

- 1 L = 1000 ml.

Para pasar a la unidad más chica, multiplica por 1000. Para pasar a la más grande, divide entre 1000.

**Ejemplo resuelto:**

Rosa compra 2 kg de frijol y usa 500 g en una receta. ¿Cuánto le queda?

1. Pasa los kilos a gramos: 2 × 1000 = 2000 g.
2. Resta lo que usó: 2000 − 500 = 1500 g.
3. Le quedan 1500 g, es decir, 1 kg con 500 g.

Ahora llena vasos de 250 ml con una botella de 1 L.

1. Pasa a mililitros: 1 × 1000 = 1000 ml.
2. Divide entre lo que cabe en cada vaso: 1000 ÷ 250 = 4.
3. Llena 4 vasos.

**Lo importante:**

- 1 kg es igual a 1000 g.
- 1 L es igual a 1000 ml.
- Peso y capacidad no son lo mismo: uno es qué tan pesado, y el otro cuánto cabe.

**Palabras nuevas:**

- **Gramo:** unidad pequeña de peso. Mil gramos son un kilo.
- **Capacidad:** cantidad de líquido que cabe en un recipiente.
- **Mililitro:** unidad pequeña de capacidad. Mil mililitros son un litro.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('581175bb-8f06-5b13-94d8-881589809cca', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 7, 'Cuerpos geométricos y volumen sencillo', 'Reconoce cuerpos geométricos en objetos comunes y calcula el volumen de una caja multiplicando sus medidas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer cuerpos geométricos y calcular el volumen de una caja.

Una caja de zapatos, una lata de atún y un balón tienen forma distinta. No son figuras planas, porque tienen espacio por dentro. Se llaman cuerpos geométricos.

**Algunos cuerpos geométricos**

- Cubo: todas sus caras son cuadrados, como un dado.
- Prisma rectangular: parece una caja de zapatos.
- Cilindro: parece una lata.
- Esfera: es redonda, como un balón.
- Cono: parece un cono de tráfico.

Un cubo tiene 6 caras, 12 aristas y 8 vértices. La cara es cada superficie plana. La arista es la línea donde se juntan dos caras. El vértice es la esquina.

**¿Qué es el volumen?**

El volumen es el espacio que ocupa un cuerpo. Se cuenta en cubitos. Un cubito de 1 cm por lado tiene un volumen de 1 cm³. Se lee «un centímetro cúbico».

Para una caja, multiplica largo × ancho × alto.

**Ejemplo resuelto:**

Una caja mide 4 cm de largo, 3 cm de ancho y 2 cm de alto.

1. Multiplica el largo por el ancho: 4 × 3 = 12.
2. Multiplica por el alto: 12 × 2 = 24.
3. Su volumen es 24 cm³.

Un dado grande tiene 3 cm de lado. Su volumen es 3 cm × 3 cm × 3 cm = 27 cm³.

Una bodega mide 5 m de largo, 4 m de ancho y 2 m de alto. Su volumen es 5 × 4 × 2 = 40 m³.

**Lo importante:**

- Los cuerpos geométricos ocupan espacio.
- El volumen de una caja es largo × ancho × alto.
- Se escribe con unidades cúbicas: cm³ o m³.

**Palabras nuevas:**

- **Cuerpo geométrico:** objeto que ocupa espacio, como un cubo o una esfera.
- **Volumen:** espacio que ocupa un cuerpo.
- **Arista:** línea donde se juntan dos caras.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c0a33145-fca0-5da5-811e-48e683583d5c', '1ed3053e-2aae-5c2b-b239-f77b5708dc77', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Líneas, ángulos y figuras planas:** Las líneas pueden ser rectas o curvas. El ángulo recto mide 90°. El agudo mide menos y el obtuso mide más.

**Semana 2 — Triángulos y cuadriláteros:** Los ángulos de un triángulo suman 180°. Los de un cuadrilátero suman 360°.

**Semana 3 — Perímetro:** Es la suma de todos los lados. En un cuadrado, multiplica el lado por 4.

**Semana 4 — Área de cuadrados, rectángulos y triángulos:** Cuadrado: lado × lado. Rectángulo: base × altura. Triángulo: base × altura ÷ 2. Se escribe en cm² o m².

**Semana 5 — Longitud:** 1 m son 100 cm y 1 km son 1000 m. Para pasar a una unidad más chica, multiplica.

**Semana 6 — Peso y capacidad:** 1 kg son 1000 g y 1 L son 1000 ml.

**Semana 7 — Cuerpos geométricos y volumen:** Hay cubos, cilindros y esferas. El volumen de una caja es largo × ancho × alto. Se escribe en cm³ o m³.

**Ejercicios de repaso:**

1. Un ángulo mide 120°. ¿Es agudo, recto u obtuso? Es obtuso, porque mide más de 90°.
2. Un triángulo tiene ángulos de 60° y 50°. 60° + 50° = 110° y 180° − 110° = 70°. El tercero mide 70°.
3. Un patio mide 9 m por 6 m. Su perímetro es 9 m + 6 m + 9 m + 6 m = 30 m. Su área es 9 m × 6 m = 54 m².
4. ¿Cuántos gramos son 2 kg? 2 × 1000 = 2000 g.
5. Una caja mide 5 cm por 2 cm por 3 cm. Su volumen es 5 × 2 × 3 = 30 cm³.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1608d349-a6b4-556b-b19f-4081065b7ec4', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 1, 'Los pueblos originarios', 'Conoce a los pueblos que vivían en México antes de 1519 y qué dejaron en la vida de hoy.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar algunos pueblos originarios de México y decir qué aportan a la vida de hoy.

Piensa en una tortilla caliente con frijoles. Es comida de todos los días en muchas casas. Su origen está en los pueblos que vivían aquí hace muchos siglos. Esos pueblos siguen vivos hoy.

**¿Quiénes son los pueblos originarios?**

Son los pueblos que ya vivían en este territorio antes de que llegaran los españoles. Tenían su propia lengua, su comida, su arte y su forma de gobernar.

Hoy sus descendientes viven en todo el país. Muchos conservan su lengua y sus fiestas.

**Mesoamérica**

Una región donde varias culturas compartían rasgos se llama Mesoamérica. Ahí se sembraba maíz, frijol y calabaza. Se construían pirámides y ciudades. Se usaban calendarios para organizar las siembras y las fiestas.

**Algunos pueblos y su obra:**

- Los olmecas hicieron grandes cabezas de piedra.
- Los mayas escribieron con signos y estudiaron el cielo. Hoy hay pueblos mayas en el sureste del país.
- En Teotihuacan se levantaron la Pirámide del Sol y la Pirámide de la Luna.
- Los mexicas fundaron México-Tenochtitlan en medio de un lago. Hoy ahí está el centro de la Ciudad de México.

**Ejemplo:**

Rosa prepara una salsa con tomate, chile y aguacate. Esas palabras vienen del náhuatl. Rosa usa palabras de una lengua que sigue viva.

**Lo importante:**

- Los pueblos originarios vivían aquí antes de la llegada de los españoles.
- Mesoamérica fue una región con culturas parecidas.
- Olmecas, mayas y mexicas dejaron obras y saberes.
- Sus lenguas y costumbres siguen vivas hoy.

**Palabras nuevas:**

- **Pueblo originario:** pueblo que ya vivía en un lugar desde antes de que llegaran otros.
- **Mesoamérica:** región donde vivieron varias culturas con rasgos comunes.
- **Lengua:** idioma que habla un pueblo.
- **Herencia:** lo que recibimos de quienes vivieron antes.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('738cceb6-288c-5f9f-a36d-d8c3973bd57e', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 2, 'La Conquista y el Virreinato', 'Entiende qué pasó entre 1519 y 1821, cómo se formó la Nueva España y qué cambió.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué fue la Conquista, qué fue el Virreinato y qué mezclas dejó.

Cuando dices «buenos días», usas el español, que llegó de España hace siglos. En México también se hablan muchas lenguas de los pueblos originarios. Esa mezcla de idiomas tiene una historia.

**¿Qué fue la Conquista?**

En 1519 llegó a las costas de lo que hoy es México una expedición española. La dirigía Hernán Cortés. Con ayuda de pueblos originarios aliados, los españoles llegaron a México-Tenochtitlan.

En 1521 cayó esa ciudad. Fue un tiempo de guerra y de cambios muy duros para los pueblos originarios.

**¿Qué fue el Virreinato?**

Los españoles formaron la Nueva España. Era un territorio gobernado en nombre del rey de España. El rey enviaba a un virrey para mandar en su lugar. El primer virrey llegó en 1535, y el Virreinato duró hasta 1821.

Entre la caída de México-Tenochtitlan y la Independencia, 1821 − 1521 = 300 años, hubo dominio español.

**Cambios de esos años:**

- Llegaron el español y la religión católica.
- Llegaron animales como caballos, vacas y gallinas.
- Se fundaron ciudades y se construyeron iglesias.
- Se trabajaron minas de plata.
- Llegaron personas de África, traídas por la fuerza para trabajar como esclavizadas.
- Se mezclaron personas de distintos pueblos. A esa mezcla se le llama mestizaje.

Los pueblos originarios conservan sus lenguas y costumbres hasta hoy.

**Ejemplo:**

Luis dibuja una línea de tiempo con tres fechas: 1519, 1521 y 1821. Entre la llegada de Cortés y la caída de México-Tenochtitlan pasaron 1521 − 1519 = 2 años.

**Lo importante:**

- En 1519 llegó Cortés y en 1521 cayó México-Tenochtitlan.
- El primer virrey llegó en 1535 y el Virreinato duró hasta 1821.
- El virrey gobernaba en nombre del rey de España.
- De esos años quedó una mezcla de pueblos y culturas.

**Palabras nuevas:**

- **Conquista:** toma de un territorio por la fuerza.
- **Virrey:** persona que gobernaba en nombre del rey.
- **Mestizaje:** mezcla de personas y culturas distintas.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6834bbf8-eb19-58d0-a88d-522b8679ce91', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 3, 'La Independencia', 'Conoce cómo empezó la lucha de 1810, quiénes la encabezaron y cómo terminó en 1821.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás contar cómo empezó y cómo terminó la Independencia de México.

Cada 15 de septiembre por la noche, muchas plazas se llenan de gente. Alguien toca una campana y se da el Grito. Esta costumbre recuerda el inicio de la lucha por la Independencia.

**¿Qué es la Independencia?**

Ser independiente es no depender de otro. En 1810 la Nueva España dependía del rey de España. Muchas personas querían gobernarse por sí mismas.

**Cómo empezó**

El 16 de septiembre de 1810, el sacerdote Miguel Hidalgo llamó al pueblo a luchar. Lo hizo en Dolores, hoy Dolores Hidalgo, en Guanajuato. Mucha gente se unió a él. A ese llamado se le conoce como el Grito de Dolores.

**Cómo siguió**

La lucha continuó después de Hidalgo. Los insurgentes siguieron luchando. José María Morelos fue otro de sus grandes dirigentes. Vicente Guerrero siguió peleando en el sur.

**Cómo terminó**

Agustín de Iturbide y Vicente Guerrero se unieron. Su ejército entró a la Ciudad de México el 27 de septiembre de 1821. Ese año se logró la Independencia.

**Ejemplo:**

Rosa quiere saber cuánto duró la lucha. Resta el año en que terminó menos el año en que empezó: 1821 − 1810 = 11. La lucha duró 11 años.

**Lo importante:**

- La lucha empezó el 16 de septiembre de 1810, con Miguel Hidalgo.
- Morelos y Guerrero fueron figuras de la lucha.
- La Independencia se logró en 1821.
- El 15 de septiembre se da el Grito para recordarla.

**Palabras nuevas:**

- **Independencia:** libertad de un país para gobernarse a sí mismo.
- **Grito de Dolores:** llamado de Hidalgo para empezar la lucha.
- **Insurgente:** persona que luchó por la Independencia.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('d34a7323-71b9-503b-9cb9-517f329643cb', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 4, 'La Reforma y Benito Juárez', 'Conoce quién fue Benito Juárez, qué fue la Reforma y qué pasó en 1857, 1862 y 1867.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir quién fue Benito Juárez y qué fue la Reforma.

Muchas calles, escuelas y pueblos de México llevan el nombre de Benito Juárez. Seguro conoces alguna. Vale la pena saber quién fue y por qué se le recuerda.

**¿Quién fue Benito Juárez?**

Nació el 21 de marzo de 1806 en Guelatao, Oaxaca. Su familia era zapoteca. En su infancia habló zapoteco y aprendió español después. Estudió, llegó a ser abogado y después presidente de México.

**¿Qué fue la Reforma?**

Fue un periodo de cambios a mediados del siglo XIX. En 1857 se publicó una nueva Constitución, que reconoció derechos y libertades para las personas.

Después se aprobaron las Leyes de Reforma. Con ellas, los asuntos de la Iglesia y los del gobierno quedaron separados.

**La intervención francesa**

Francia mandó un ejército a México. El 5 de mayo de 1862, el ejército mexicano, al mando de Ignacio Zaragoza, venció a las tropas francesas en Puebla. Esa fecha se recuerda hasta hoy.

Maximiliano, un príncipe de Europa, gobernó como emperador unos años. En 1867 volvió la república y Juárez siguió como presidente. Juárez murió en 1872.

**Ejemplo:**

Luis compara dos fechas de la línea de tiempo. Entre la batalla de Puebla y el regreso de la república pasaron 1867 − 1862 = 5 años.

**Lo importante:**

- Benito Juárez nació en 1806 en Guelatao, Oaxaca.
- La Constitución de 1857 reconoció derechos y libertades.
- El 5 de mayo de 1862 el ejército mexicano, al mando de Ignacio Zaragoza, venció en Puebla.
- En 1867 volvió la república.

**Palabras nuevas:**

- **Constitución:** ley más importante de un país.
- **Reforma:** periodo de cambios en las leyes a mediados del siglo XIX.
- **República:** forma de gobierno donde el pueblo elige a sus gobernantes.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('e8e777ae-8977-520a-86a1-225685f90464', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 5, 'La Revolución Mexicana', 'Entiende por qué empezó la Revolución en 1910 y qué cambió con la Constitución de 1917.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar por qué empezó la Revolución Mexicana y qué pasó en 1917.

Cada 20 de noviembre hay desfiles en escuelas y plazas de todo el país. Recuerdan el inicio de la Revolución Mexicana. Veamos por qué empezó.

**¿Por qué empezó?**

Antes de 1910, Porfirio Díaz llevaba más de 30 años como presidente. Muchas personas pedían elecciones libres. En el campo, varios pueblos pedían que les devolvieran sus tierras.

**Los primeros pasos**

Francisco I. Madero llamó a levantarse en armas. La fecha fue el 20 de noviembre de 1910. Desde entonces se recuerda ese día como el inicio de la Revolución.

**Algunos personajes**

- Emiliano Zapata luchó en el sur. Pedía tierra para los campesinos. Su lema fue «Tierra y Libertad».
- Francisco Villa luchó en el norte del país.
- Madero encabezó el movimiento que dio inicio a la lucha.

**La Constitución de 1917**

El 5 de febrero de 1917 se publicó en Querétaro una nueva Constitución. Reconoció derechos para trabajadores y campesinos. Hoy sigue vigente, con reformas.

**Ejemplo:**

Rosa quiere saber cuántos años pasaron entre el inicio de la Revolución y la nueva Constitución. Resta: 1917 − 1910 = 7. Pasaron 7 años.

**Lo importante:**

- La Revolución empezó el 20 de noviembre de 1910.
- Se pedían elecciones libres y tierras para los pueblos.
- Madero, Zapata y Villa son personajes de esa etapa.
- La Constitución se publicó el 5 de febrero de 1917.

**Palabras nuevas:**

- **Revolución:** gran cambio en un país, que suele venir con una lucha.
- **Campesino:** persona que trabaja la tierra.
- **Lema:** frase corta que resume una idea.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('69963727-f013-5867-8946-27b59d176c20', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 6, 'El México del siglo XX', 'Conoce algunos hechos y cambios del siglo XX en México, con fechas claras y sin juicios.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás ubicar algunos hechos importantes del siglo XX en México.

Un siglo son 100 años. El siglo XX va de 1901 a 2000. Muchas personas hoy vivieron buena parte de esos años. Hoy veremos algunos hechos, uno por uno.

**Un país que cambió**

Durante esos años, el país vivió muchos cambios. Crecieron las ciudades. Llegaron el radio y la televisión a las casas. Se abrieron más escuelas y más caminos. Muchas familias se mudaron del campo a la ciudad.

**Algunas fechas para recordar**

- **1917:** se publicó la Constitución, que sigue vigente con reformas.
- **1938:** el gobierno tomó el control de la industria del petróleo. Se recuerda el 18 de marzo.
- **1953:** se reconoció el derecho de las mujeres a votar en elecciones federales.
- **1968:** la Ciudad de México fue sede de los Juegos Olímpicos.
- **1968:** también hubo un movimiento estudiantil. El 2 de octubre, en Tlatelolco, fue reprimido y murieron personas.
- **1985:** el 19 de septiembre hubo un fuerte sismo en la Ciudad de México.

**Ejemplo:**

Luis ordena los hechos en una línea de tiempo. Quiere saber cuántos años pasaron entre los Juegos Olímpicos y el sismo. Resta: 1985 − 1968 = 17. Pasaron 17 años.

**Lo importante:**

- Un siglo son 100 años.
- En el siglo XX crecieron las ciudades y llegaron nuevos medios de comunicación.
- En 1953 se reconoció el voto de las mujeres en elecciones federales.
- Para ubicar un hecho, ayuda ponerlo en una línea de tiempo.

**Palabras nuevas:**

- **Siglo:** periodo de 100 años.
- **Sismo:** movimiento fuerte de la tierra.
- **Línea de tiempo:** dibujo que ordena hechos según su fecha.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('947edbbb-8ab3-5597-a7f5-a7026edbec5b', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 7, 'Símbolos patrios y fechas cívicas', 'Reconoce la bandera, el escudo y el himno, y ubica las fechas cívicas que se recuerdan cada año.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer los símbolos patrios y decir qué se recuerda en algunas fechas cívicas.

En una ceremonia de tu escuela o de tu colonia, seguro viste una bandera. Quizá escuchaste el himno. Son símbolos que representan a todo el país.

**¿Cuáles son los símbolos patrios?**

Son tres: la bandera, el escudo y el himno.

- **La bandera** tiene tres franjas: verde, blanca y roja. En el centro de la franja blanca va el escudo.
- **El escudo** muestra un águila parada sobre un nopal. El águila sujeta una serpiente. Recuerda la historia de la fundación de México-Tenochtitlan.
- **El himno nacional** tiene letra de Francisco González Bocanegra y música de Jaime Nunó.

**Fechas cívicas**

Una fecha cívica recuerda un hecho importante para todo el país. Esta tabla junta las que viste y una nueva, el 24 de febrero. Algunas se descansan el lunes cercano.

| Fecha | Qué se recuerda |
|---|---|
| 5 de febrero | La Constitución de 1917 |
| 24 de febrero | Día de la Bandera: se honra a la bandera nacional |
| 21 de marzo | El nacimiento de Benito Juárez |
| 5 de mayo | La batalla de Puebla, en 1862 |
| 15 de septiembre | La noche del Grito |
| 16 de septiembre | El inicio de la Independencia, en 1810 |
| 20 de noviembre | El inicio de la Revolución, en 1910 |

**Ejemplo:**

Rosa ve un letrero que dice «20 de noviembre». Piensa en la tabla y recuerda que ese día se celebra el inicio de la Revolución.

**Lo importante:**

- Los símbolos patrios son la bandera, el escudo y el himno.
- La bandera es verde, blanca y roja, con el escudo al centro.
- Cada fecha cívica recuerda un hecho de la historia.

**Palabras nuevas:**

- **Símbolo patrio:** imagen o canto que representa a un país.
- **Himno:** canto que representa a un país o a un grupo.
- **Fecha cívica:** día en que se recuerda un hecho importante del país.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ab348e54-1cfa-5554-9c37-ea578cce41ab', 'f2e98415-87d6-5337-a3ca-5623cc720a84', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Los pueblos originarios:** Son los pueblos que vivían aquí antes de 1519. Olmecas, mayas y mexicas dejaron obras y saberes. Sus lenguas siguen vivas hoy.

**Semana 2 — La Conquista y el Virreinato:** En 1519 llegó Hernán Cortés. En 1521 cayó México-Tenochtitlan. El dominio español terminó en 1821 y dejó una mezcla de pueblos.

**Semana 3 — La Independencia:** Empezó el 16 de septiembre de 1810 con Miguel Hidalgo. Terminó en 1821. Morelos y Guerrero fueron figuras de la lucha.

**Semana 4 — La Reforma y Benito Juárez:** Juárez nació en 1806 en Guelatao. La Constitución de 1857 reconoció derechos. El 5 de mayo de 1862 el ejército mexicano, al mando de Ignacio Zaragoza, venció en Puebla.

**Semana 5 — La Revolución Mexicana:** Empezó el 20 de noviembre de 1910. Madero, Zapata y Villa son personajes de esa etapa. La Constitución se publicó en 1917.

**Semana 6 — El México del siglo XX:** Un siglo son 100 años. En 1953 se reconoció el voto de las mujeres en elecciones federales. Una línea de tiempo ayuda a ordenar los hechos.

**Semana 7 — Símbolos patrios y fechas cívicas:** Son la bandera, el escudo y el himno. Cada fecha cívica recuerda un hecho de la historia.

**Ejercicios de repaso:**

1. ¿Cuántos años pasaron de la caída de México-Tenochtitlan (1521) al fin del dominio español (1821)? 1821 − 1521 = 300. Pasaron 300 años.
2. ¿Cuántos años pasaron del inicio de la Independencia al fin de la lucha? 1821 − 1810 = 11. Pasaron 11 años.
3. ¿Cuántos años pasaron de la batalla de Puebla al regreso de la república? 1867 − 1862 = 5. Pasaron 5 años.
4. ¿Cuántos años pasaron del inicio de la Revolución a la Constitución? 1917 − 1910 = 7. Pasaron 7 años.
5. ¿Qué se recuerda el 16 de septiembre? El inicio de la Independencia, en 1810.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6f583295-e184-54f5-8392-ec251e1dd014', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 1, 'Escuchar y hablar con respeto', 'Aprende a escuchar con atención, esperar tu turno y decir lo que piensas sin ofender a nadie.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás escuchar con atención y hablar con respeto en una conversación.

En una junta de vecinos, Rosa explica un problema con el agua. Luis la interrumpe dos veces. Otra vecina mira su celular. Al final nadie entendió bien qué pasó. Una conversación funciona cuando todos escuchan y todos hablan por turnos.

**¿Qué es escuchar con atención?**

Escuchar no es solo oír. Oír es percibir sonidos. Escuchar es poner atención para entender lo que la otra persona quiere decir.

Para escuchar bien:

- Mira a quien habla.
- Guarda el celular.
- No interrumpas. Espera a que termine.
- Si no entendiste, pregunta.

**¿Cómo hablar con respeto?**

Hablar con respeto es decir lo que piensas sin burlarte ni gritar. Tu opinión importa y la de los demás también.

Estas frases ayudan:

- «Con permiso, quiero decir algo.»
- «Entiendo tu idea, pero yo pienso distinto.»
- «¿Me puedes explicar un poco más?»

**Ejemplo resuelto:**

Don Pedro y Ana no están de acuerdo sobre quién lava los trastes. Así puede ser su conversación:

1. Don Pedro dice lo que piensa y Ana lo deja terminar.
2. Ana repite con sus palabras: «Entonces tú sientes que yo no ayudo».
3. Don Pedro dice si es cierto o no.
4. Después habla Ana, y ahora él escucha.

Repetir lo que oíste confirma que entendiste bien.

**Lo importante:**

- Escuchar es poner atención, no solo oír.
- No interrumpas y espera tu turno.
- Habla con voz tranquila y sin burlas.
- Pregunta cuando no entiendas algo.

**Palabras nuevas:**

- **Turno:** el momento que te toca para hablar.
- **Interrumpir:** hablar cuando otra persona todavía no termina.
- **Opinión:** lo que una persona piensa sobre un tema.
- **Respeto:** tratar bien a los demás, aunque piensen distinto.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('1699f2a6-be0c-5eb4-a15a-d9557353697f', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 2, 'Presentarse y dar datos personales', 'Aprende a decir quién eres, qué datos compartir y cómo cuidar tu información personal.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás presentarte con claridad y dar tus datos personales de forma segura.

Rosa llega a un taller nuevo. Todos son desconocidos. Ella saluda, dice su nombre y cuenta algo breve sobre ella. En un minuto la gente ya la conoce un poco. Así se hace una presentación.

**¿Qué es una presentación?**

Presentarte es decir quién eres para que otros te conozcan. Una buena presentación es corta. Casi siempre lleva cuatro partes:

1. El saludo.
2. Tu nombre.
3. Algo sobre ti, como de dónde eres o qué te gusta hacer.
4. Una frase de cierre, como «mucho gusto».

**¿Qué son los datos personales?**

Son los datos que dicen quién eres. Por ejemplo, tu nombre completo, tu fecha de nacimiento, tu domicilio y tu teléfono.

Hay datos que se piden en un formulario. Eso es normal. Pero cuida tu información. No des tu domicilio ni tu teléfono a una persona que no conoces. Antes de darlos, pregunta para qué los necesitan.

**Ejemplo resuelto:**

Luis se presenta en un grupo nuevo.

1. Saluda: «Buenos días».
2. Dice su nombre: «Me llamo Luis Ramírez».
3. Cuenta algo sobre él: «Vivo en Puebla y me gusta cocinar».
4. Cierra: «Mucho gusto».

Más tarde, una persona le pide su teléfono por un mensaje. Luis no la conoce. Antes de responder, pregunta: «¿Para qué necesitas mi número?».

**Lo importante:**

- Una presentación es corta: saludo, nombre, algo sobre ti y cierre.
- Habla despacio y mira a las personas.
- Tus datos personales dicen quién eres.
- Antes de dar un dato, pregunta para qué lo piden.

**Palabras nuevas:**

- **Presentación:** lo que dices para que otros te conozcan.
- **Datos personales:** información que dice quién eres, como tu nombre o tu domicilio.
- **Domicilio:** el lugar donde vives.
- **Formulario:** hoja donde se escriben datos en los espacios que se piden.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ec8296c1-b0ba-5366-89fc-2da64ec20572', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 3, 'Exponer una idea ante otros', 'Aprende a preparar y explicar una idea ante un grupo, con orden, voz clara y seguridad.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás preparar y explicar una idea ante un grupo con orden y claridad.

En una reunión de la colonia, doña Carmen quiere proponer una limpieza del parque. Se pone nerviosa. Habla muy rápido y salta de un tema a otro. Nadie entiende su propuesta. Para exponer una idea, conviene prepararla antes.

**¿Qué es exponer una idea?**

Exponer es explicar algo a un grupo de personas. Puede ser una propuesta, un tema o una opinión. Se hace con un orden. Ese orden tiene tres partes:

1. **Inicio.** Di de qué vas a hablar.
2. **Desarrollo.** Explica tu idea con dos o tres razones o ejemplos.
3. **Cierre.** Repite lo más importante y di qué propones.

**¿Cómo hablar para que te entiendan?**

- Habla con voz fuerte, sin gritar.
- Ve despacio. Haz pausas cortas.
- Mira a las personas, no al piso.
- Usa notas con palabras clave, no un texto largo.

Sentir nervios es normal. Practicar en voz alta ayuda mucho.

**Ejemplo resuelto:**

Doña Carmen prepara su propuesta.

1. Inicio: «Quiero proponer una limpieza del parque».
2. Desarrollo: «Hay basura en las bancas. Los niños juegan ahí. Entre todos podemos limpiarlo en una mañana».
3. Cierre: «Les propongo juntarnos el sábado. ¿Quién puede venir?».

Antes de la reunión, ella lo practica frente al espejo.

**Lo importante:**

- Una exposición tiene inicio, desarrollo y cierre.
- Prepara notas cortas con palabras clave.
- Habla con voz clara y a buen ritmo.
- Practicar en voz alta quita parte del nervio.

**Palabras nuevas:**

- **Exponer:** explicar una idea a un grupo.
- **Propuesta:** idea que ofreces para resolver algo.
- **Pausa:** pequeño silencio para respirar y dar tiempo de entender.
- **Palabra clave:** palabra que te recuerda una idea importante.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('b504e197-a2b4-541d-b80e-0952d33f4c81', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 4, 'Documentos de identidad: acta de nacimiento, CURP, INE', 'Conoce qué son el acta de nacimiento, la CURP y la credencial del INE, y cómo cuidar tus documentos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir qué son el acta de nacimiento, la CURP y la credencial del INE.

Luis llena un formulario. Le piden su nombre completo, su fecha de nacimiento y su CURP. Él no recuerda qué es cada documento. Estos papeles se usan en muchos trámites, así que conviene conocerlos.

**¿Qué es el acta de nacimiento?**

Es el documento que registra que una persona nació. Dice su nombre, su fecha de nacimiento y el lugar donde nació. También trae los datos de quienes la registraron como su madre o su padre. Se guarda en el Registro Civil.

**¿Qué es la CURP?**

CURP quiere decir Clave Única de Registro de Población. Es una clave de 18 caracteres (letras y números). Cada persona tiene la suya. Parte de la clave sale de tu nombre y de tu fecha de nacimiento.

**¿Qué es la credencial del INE?**

INE es el nombre corto de la institución que organiza las elecciones federales. Esa institución expide la credencial para votar. Mucha gente también la usa para identificarse. Si una persona aún no tiene edad para votar, normalmente no la tiene todavía, y es normal.

**Ejemplo:**

Rosa revisa sus papeles antes de un trámite.

1. Compara su nombre en cada documento.
2. Revisa que se escriba igual.
3. Si encuentra un error, pregunta en el Registro Civil; ahí te orientan sobre cómo corregirlo.

**Lo importante:**

- El acta de nacimiento registra que naciste.
- La CURP es una clave de 18 caracteres.
- El INE expide la credencial para votar.
- Cuida tus documentos y guarda copias en un lugar seguro.

**Palabras nuevas:**

- **Acta de nacimiento:** documento que registra el nacimiento de una persona.
- **CURP:** clave de 18 caracteres que identifica a cada persona.
- **INE:** institución que organiza las elecciones federales y expide la credencial para votar.
- **Registro Civil:** oficina que guarda actas de nacimiento y otros registros.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('08620420-e577-5783-bd50-7eb2f3dc8197', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 5, 'Trámites comunes y cómo pedir información', 'Aprende a preparar un trámite, hacer preguntas claras en una oficina y anotar lo que te digan.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás preparar un trámite y pedir información con preguntas claras.

Rosa necesita una copia de su acta de nacimiento. Llega a la oficina sin saber qué documentos llevar. Hace fila mucho rato y al final le dicen que le falta un papel. Preguntar antes habría evitado el viaje.

**¿Qué es un trámite?**

Un trámite es una serie de pasos que haces ante una oficina para conseguir algo. Por ejemplo, pedir un documento o registrar un dato. Cada trámite tiene sus propias reglas. Esas reglas pueden cambiar.

**¿Cómo pedir información?**

Antes de ir, pregunta por teléfono, en la oficina o en el sitio de la institución. Pregunta siempre lo mismo:

- ¿Qué documentos debo llevar?
- ¿Dónde y en qué horario se hace?
- ¿Tiene algún costo?
- ¿Necesito cita?

No supongas la respuesta. Revisa siempre el dato vigente, porque los requisitos cambian con el tiempo.

**Ejemplo resuelto:**

Luis llama a una oficina para pedir una copia de su acta de nacimiento.

1. Saluda: «Buenos días».
2. Dice qué necesita: «Necesito una copia de mi acta de nacimiento».
3. Pregunta: «¿Qué documentos debo llevar?».
4. Anota la respuesta en una hoja.
5. Repite lo anotado para confirmar: «Entonces llevo estos documentos, ¿verdad?».
6. Da las gracias.

Si no sabe a qué oficina ir, llama al teléfono de la institución o pregunta en su sitio oficial.

**Lo importante:**

- Pregunta antes de ir, para no perder el viaje.
- Anota lo que te digan.
- Pide el dato vigente, porque los requisitos cambian.
- Lleva tus documentos y una copia de cada uno.

**Palabras nuevas:**

- **Trámite:** pasos que haces ante una oficina para lograr algo.
- **Requisito:** lo que te piden para poder hacer un trámite.
- **Cita:** día y hora que te dan para ser atendido.
- **Vigente:** que sigue valiendo hoy.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c30453c9-5761-514b-933b-4bcd55c00692', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 6, 'Diálogo y acuerdos ante un desacuerdo', 'Aprende a conversar cuando piensas distinto, escuchar al otro y llegar a un acuerdo en paz.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás dialogar ante un desacuerdo y llegar a un acuerdo.

Dos compañeros de un edificio no se ponen de acuerdo. Uno deja su basura en el pasillo y al otro le molesta el olor. Se enojan y dejan de hablarse. El problema sigue igual. Si conversan con calma, pueden resolverlo.

**¿Qué es un desacuerdo?**

Un desacuerdo ocurre cuando dos personas piensan o quieren cosas distintas. Es normal. Pasa en la casa, en el trabajo y en la calle. Lo importante es cómo lo resuelves.

**¿Cómo llegar a un acuerdo?**

Un acuerdo es una decisión en la que todos aceptan algo. Estos pasos ayudan:

1. Elige un momento tranquilo para hablar.
2. Escucha lo que la otra persona piensa.
3. Explica lo que tú sientes, sin acusar. Usa frases con «yo».
4. Busca ideas que sirvan a los dos.
5. Elijan una y repitan en voz alta lo acordado.

**Ejemplo resuelto:**

Ana y Luis comparten un pasillo.

1. Ana dice: «Yo me siento incómoda con el olor en el pasillo».
2. Luis responde: «Yo no tengo dónde dejar la bolsa por la tarde».
3. Ana propone: «¿Y si la sacas a la hora en que pasa el camión?».
4. Luis acepta y dice: «Quedamos así. Yo saco la bolsa a esa hora».

Los dos ganaron algo y la relación sigue en buen tono.

**Lo importante:**

- Pensar distinto es normal.
- Escucha antes de responder.
- Habla de lo que tú sientes, sin acusar.
- Busca una solución que sirva a los dos.

**Palabras nuevas:**

- **Desacuerdo:** cuando dos personas piensan o quieren cosas distintas.
- **Diálogo:** conversación en la que cada quien habla y escucha.
- **Acuerdo:** decisión que todos aceptan.
- **Acusar:** echarle la culpa a otra persona.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('a6cef619-23f2-5699-b438-bbba0c408f92', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 7, 'La entrevista de trabajo', 'Aprende a prepararte para una entrevista de trabajo y a responder con claridad y honestidad.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás prepararte para una entrevista de trabajo y responder con claridad.

Rosa tiene una cita para platicar sobre un puesto. Esa plática se llama entrevista de trabajo. Ella se pone nerviosa. Pero si se prepara, se sentirá más segura. Nadie puede asegurar el resultado, pero prepararte siempre ayuda.

**¿Qué es una entrevista de trabajo?**

Es una conversación con quien ofrece un puesto. Esa persona quiere conocerte y saber si tu perfil sirve para el trabajo. Tú también puedes preguntar sobre el puesto.

**¿Cómo prepararte?**

- Averigua a qué se dedica el lugar y qué puesto buscan.
- Lleva tus documentos y una hoja con tus datos.
- Elige ropa limpia y cómoda.
- Sal con tiempo para llegar unos minutos antes.
- Practica tus respuestas en voz alta.

**Ejemplo resuelto:**

La persona que entrevista a Rosa le dice: «Cuéntame de ti».

1. Rosa saluda y se presenta: «Soy Rosa Pérez».
2. Dice lo que sabe hacer: «Sé atender a las personas y llevar cuentas».
3. Cuenta algo que ya hizo: «Ayudé en la tienda de mi familia».
4. Cierra con una pregunta: «¿Cómo es un día normal en este puesto?».

Si aún no has trabajado, cuenta lo que has hecho en la escuela o en tu casa. Rosa dice solo cosas ciertas. Si no sabe algo, lo reconoce y dice que le gustaría aprenderlo.

**Lo importante:**

- Prepárate antes: conoce el lugar y practica tus respuestas.
- Habla con claridad y di siempre la verdad.
- Mira a quien te entrevista y escucha las preguntas completas.
- Haz tus propias preguntas sobre el puesto.

**Palabras nuevas:**

- **Entrevista:** conversación para conocer a una persona.
- **Puesto:** el trabajo que alguien hace en un lugar.
- **Perfil:** lo que una persona sabe hacer y ha vivido.
- **Honestidad:** decir siempre la verdad.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('0ab0a6c8-86c1-54ce-8544-6bba48e08bc3', 'f8ae7b30-0bda-5623-87f9-a6a587ede078', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Escuchar y hablar con respeto:** Escuchar es poner atención, no solo oír. No interrumpas, espera tu turno y habla sin burlas.

**Semana 2 — Presentarse y dar datos personales:** Una presentación lleva saludo, nombre, algo sobre ti y cierre. Antes de dar un dato personal, pregunta para qué lo piden.

**Semana 3 — Exponer una idea ante otros:** Una exposición tiene inicio, desarrollo y cierre. Habla con voz clara, a buen ritmo y con notas cortas.

**Semana 4 — Documentos de identidad:** El acta de nacimiento registra que naciste. La CURP es una clave de 18 caracteres. El INE expide la credencial para votar.

**Semana 5 — Trámites comunes y cómo pedir información:** Pregunta antes de ir qué documentos llevar, el horario y si necesitas cita. Anota la respuesta y revisa el dato vigente.

**Semana 6 — Diálogo y acuerdos ante un desacuerdo:** Escucha, explica lo que sientes sin acusar y busca una solución que sirva a los dos.

**Semana 7 — La entrevista de trabajo:** Prepárate, practica tus respuestas, di la verdad y haz tus propias preguntas.

**Ejercicios de repaso:**

1. Una persona te interrumpe cuando hablas. ¿Qué puedes decir? «Con permiso, déjame terminar». Así pides tu turno con respeto.
2. ¿Cuántos caracteres tiene la CURP? Tiene 18 caracteres.
3. ¿Qué institución expide la credencial para votar? El INE.
4. Vas a hacer un trámite. ¿Qué preguntas haces antes? Pregunta qué documentos llevar, el horario y si necesitas cita.
5. En una entrevista te piden «Cuéntame de ti». Saluda, di tu nombre, cuenta lo que sabes hacer y cierra con una pregunta sobre el puesto.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f2721ce6-2eaa-539f-87ca-bc30f2b5bc4f', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 1, 'Billetes, monedas y cambio', 'Aprende a sumar lo que compras, comparar con tu pago y calcular el cambio que te deben regresar.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás calcular el cambio de una compra y comprobar que sea correcto.

Luis compra en la tienda de la esquina. Paga con un billete y la encargada le da unas monedas. Luis se pregunta si el cambio está bien. Con una resta puede comprobarlo.

**¿Qué es el cambio?**

En México circulan monedas de 50 centavos y de 1, 2, 5, 10 y 20 pesos, y billetes de 20, 50, 100, 200, 500 y 1,000 pesos. A veces pagas con más dinero del que cuesta la compra. La parte que te regresan se llama cambio.

**Dos formas de calcular el cambio:**

1. **Restar.** Al dinero que entregaste le quitas el precio. Es la forma más directa.
2. **Contar hacia adelante.** Empiezas en el precio y sumas hasta llegar a lo que pagaste.

**Ejemplo resuelto:**

Luis compra una bolsa de pan de $48 y una leche de $35. Paga con un billete de $100.

1. Suma lo que compró: 48 + 35 = 83. La compra cuesta $83.
2. Resta el total del pago: 100 − 83 = 17.
3. El cambio es de $17.

Ahora cuenta hacia adelante. Una compra cuesta $135 y pagas con $200.

- De 135 a 140: 135 + 5 = 140.
- De 140 a 150: 140 + 10 = 150.
- De 150 a 200: 150 + 50 = 200.

Suma lo que agregaste: 5 + 10 + 50 = 65. El cambio es de $65. Te lo pueden dar con un billete de $50, una moneda de $10 y una de $5.

Si hay centavos, la cuenta es igual. Una cuenta de $87.50 pagada con $100 da 100 − 87.50 = 12.50. Te regresan $12.50.

**Lo importante:**

- El cambio es lo que sobra de tu pago.
- Para calcularlo, resta el precio al dinero que entregaste.
- También puedes contar hacia adelante desde el precio.

**Palabras nuevas:**

- **Cambio:** dinero que te regresan cuando pagas de más.
- **Total:** la suma de todo lo que compraste.
- **Centavo:** la centésima parte de un peso. Cien centavos son un peso.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f3a2805a-47ea-5d0f-bdba-20a4eceaa9b7', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 2, 'Presupuesto familiar: ingresos y gastos', 'Aprende a anotar lo que entra y lo que sale cada mes para saber cuánto dinero te queda.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás armar un presupuesto sencillo y saber si te sobra o te falta dinero.

Rosa llega a fin de mes y no sabe a dónde se fue su dinero. Decide anotar todo lo que recibe y todo lo que paga. Con esas dos listas puede ver el panorama completo. Esa idea se llama presupuesto.

**¿Qué es un presupuesto?**

Un presupuesto es un plan del dinero de un mes. Tiene dos partes. Los **ingresos** son el dinero que entra. Los **gastos** son el dinero que sale.

Los gastos fijos son los que pagas casi igual cada mes, como la renta. Los gastos variables cambian, como la comida o el transporte.

**Cómo armarlo:**

1. Anota todos los ingresos del mes y suma.
2. Anota todos los gastos del mes y suma.
3. Resta los gastos a los ingresos.

Si queda dinero, tienes un sobrante. Si el resultado es negativo, gastas más de lo que entra. Entonces conviene revisar qué gasto puedes bajar.

**Ejemplo resuelto:**

Los ingresos de Rosa en un mes son $5,800 de un trabajo y $2,200 de otro. Sus gastos son:

- Renta: $3,000
- Comida: $2,500
- Transporte: $900
- Luz y agua: $400
- Teléfono: $300

1. Suma los ingresos: 5,800 + 2,200 = 8,000.
2. Suma los gastos: 3,000 + 2,500 + 900 + 400 + 300 = 7,100.
3. Resta: 8,000 − 7,100 = 900.

A Rosa le sobran $900. Puede guardarlos para una meta o para una emergencia.

**Lo importante:**

- Un presupuesto compara lo que entra con lo que sale.
- Ingresos menos gastos te dice cuánto sobra o falta.
- Anotar los gastos ayuda a ver en qué se va el dinero.
- Revisa tu presupuesto cada mes.

**Palabras nuevas:**

- **Ingreso:** dinero que recibes.
- **Gasto:** dinero que pagas.
- **Presupuesto:** plan que compara tus ingresos con tus gastos.
- **Sobrante:** dinero que queda después de pagar los gastos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('af504194-020f-5190-adf9-2bdc42d69e13', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 3, 'Porcentajes básicos: 10 %, 25 % y 50 %', 'Aprende a sacar el 10 %, el 25 % y el 50 % de una cantidad con cuentas sencillas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sacar el 10 %, el 25 % y el 50 % de una cantidad.

Rosa quiere comprar unos zapatos de $600. En la tienda hay un letrero: «50 % de descuento». ¿Cuánto dinero le descuentan? Para saberlo, necesita entender los porcentajes.

**¿Qué es un porcentaje?**

El signo % se lee «por ciento». Quiere decir «de cada 100». Si tienes 100 pesos, el 10 % son 10 pesos. El 25 % son 25 pesos. El 50 % son 50 pesos.

Con otras cantidades, la idea es la misma. Cambia el total, pero no cambia la parte que tomas.

**Tres porcentajes muy útiles:**

- **El 50 % es la mitad.** Divide la cantidad entre 2.
- **El 25 % es la cuarta parte.** Divide la cantidad entre 4.
- **El 10 % es la décima parte.** Divide la cantidad entre 10.

No necesitas una fórmula larga. Con estas tres divisiones resuelves muchas cuentas de la casa y del trabajo.

**Ejemplo resuelto:**

Rosa quiere saber cuánto le descuentan en los zapatos de $600.

1. El letrero dice 50 %. Eso es la mitad.
2. Divide el precio entre 2: 600 ÷ 2 = 300.
3. Le descuentan $300.

Luis revisa una cuenta de $480 del mercado. Quiere saber cuánto es el 25 % y cuánto es el 10 %.

- El 25 %: 480 ÷ 4 = 120. Son $120.
- El 10 %: 480 ÷ 10 = 48. Son $48.

Otro caso: el 10 % de $350 se calcula con 350 ÷ 10 = 35. Son $35.

**Lo importante:**

- Por ciento quiere decir «de cada 100».
- El 50 % es la mitad: divide entre 2.
- El 25 % es la cuarta parte: divide entre 4.
- El 10 % es la décima parte: divide entre 10.

**Palabras nuevas:**

- **Porcentaje:** una parte de una cantidad, contada de cada 100.
- **Descuento:** dinero que te quitan del precio.
- **Décima parte:** lo que resulta al dividir algo en 10 partes iguales.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('e3942113-a6a9-503d-b00a-38adeed02042', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 4, 'Descuentos y ofertas', 'Aprende a calcular el precio final de un producto con descuento y a comparar dos ofertas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás calcular el precio final con descuento y decir qué oferta conviene más.

Doña Carmen ve dos letreros en dos tiendas. Uno dice «25 % de descuento». El otro dice «10 % de descuento». Parece que el primero conviene más. Pero los precios de cada tienda no son iguales. Hay que hacer la cuenta.

**¿Cómo se calcula el precio final?**

El descuento es una parte del precio que no pagas. Se calcula con los porcentajes de la semana pasada. Luego se resta.

1. Saca el descuento: 25 % es dividir entre 4. El 10 % es dividir entre 10.
2. Resta el descuento al precio.
3. El resultado es el precio final, lo que sí pagas.

**Comparar ofertas:**

Un porcentaje grande no siempre da el mejor precio. Mira el precio final de cada tienda. La oferta que conviene es la que te deja pagar menos.

**Ejemplo resuelto:**

Doña Carmen quiere una sudadera. En la tienda A cuesta $400 con 25 % de descuento. En la tienda B cuesta $320 con 10 % de descuento.

Tienda A:

1. Descuento: 400 ÷ 4 = 100.
2. Precio final: 400 − 100 = 300.

Tienda B:

1. Descuento: 320 ÷ 10 = 32.
2. Precio final: 320 − 32 = 288.

Compara: 300 − 288 = 12. En la tienda B pagas $12 menos, aunque su descuento sea más chico.

**Lo importante:**

- El descuento se resta del precio.
- Paga lo que dice el precio final, no el descuento.
- Compara siempre el precio final de cada oferta.
- Un descuento mayor no siempre es la mejor opción.

**Palabras nuevas:**

- **Oferta:** precio especial por un tiempo.
- **Precio final:** lo que pagas después de quitar el descuento.
- **Comparar:** ver dos cosas juntas para saber cuál conviene más.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('a6fae7fd-6a49-5468-9136-e61326b0ada1', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 5, 'Ahorro y metas', 'Aprende a poner una meta de ahorro y a dividirla en partes iguales para saber cuánto guardar.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás poner una meta de ahorro y calcular cuánto guardar en cada periodo.

Luis necesita $1,200 para arreglar su celular. No los tiene hoy. Si espera a juntarlos de golpe, quizá nunca llegue. Mejor decide guardar una cantidad pequeña cada semana. Así avanza poco a poco.

**¿Qué es ahorrar?**

Ahorrar es guardar una parte del dinero que recibes en lugar de gastarla toda. Es mejor guardarla en cuanto la recibes. Si esperas a ver qué sobra, a veces no queda nada.

**¿Qué es una meta de ahorro?**

Una meta dice dos cosas: cuánto quieres juntar y para qué. Con esos datos haces una división.

1. Escribe la cantidad de la meta.
2. Escribe en cuántas semanas o meses quieres juntarla.
3. Divide la meta entre ese número.

El resultado es lo que guardas cada vez, si es siempre la misma cantidad.

**Ejemplo resuelto:**

Luis quiere juntar $1,200 en 8 semanas.

1. Divide: 1,200 ÷ 8 = 150.
2. Debe guardar $150 cada semana.

Para comprobar, multiplica: 8 × 150 = 1,200. Sí llega a su meta.

Otro caso: Rosa quiere juntar $3,600 y puede guardar $600 al mes. La cuenta es 3,600 ÷ 600 = 6. Necesita 6 meses.

Si a mitad del camino Luis lleva $450, ve cuánto falta: 1,200 − 450 = 750. Le faltan $750.

**Lo importante:**

- Ahorrar es guardar una parte de lo que recibes.
- Una meta dice cuánto juntar y para qué.
- Meta entre número de semanas da lo que guardas cada vez.
- Revisa cuánto llevas y cuánto falta.

**Palabras nuevas:**

- **Ahorro:** dinero que guardas para usarlo después.
- **Meta:** lo que quieres lograr, con una cantidad clara.
- **Periodo:** cada tramo de tiempo, como una semana o un mes.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f1b48147-ae62-5050-a7c5-68fa58aedb70', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 6, 'Créditos e intereses: lo básico', 'Aprende qué es un crédito, qué es el interés y qué preguntar antes de aceptar dinero prestado.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es un crédito y calcular cuánto pagas de más.

Rosa quiere comprar un aparato y le ofrecen pagarlo en abonos. Los pagos chicos parecen cómodos. Pero hay una pregunta importante: ¿cuánto voy a pagar en total? Esa pregunta te protege.

**¿Qué es un crédito?**

Un crédito es dinero que alguien te presta. Tú te comprometes a devolverlo en pagos. Quien presta cobra algo extra por el servicio. Ese cobro extra se llama interés.

**¿Cómo saber cuánto interés pagas?**

1. Multiplica el pago por el número de pagos. Eso da el total que pagarás.
2. Resta lo que te prestaron.
3. El resultado es el interés.

**Ejemplo resuelto:**

Este es un ejemplo inventado, con números redondos. No es una oferta real.

Rosa pide prestados $1,000. Debe devolverlos en 5 pagos de $240.

1. Total a pagar: 5 × 240 = 1,200.
2. Interés: 1,200 − 1,000 = 200.

Rosa paga $200 de más por el préstamo. En un crédito real, el interés suele darse como un porcentaje; aquí solo calculamos cuánto pagas de más.

Ahora otra opción inventada. Los mismos $1,000, pero en 10 pagos de $130.

- Total: 10 × 130 = 1,300.
- Interés: 1,300 − 1,000 = 300.

Los pagos son más chicos, pero el interés es mayor. Por eso no basta con ver cuánto pagas cada vez.

**Antes de firmar, pregunta:**

- ¿Cuánto pagaré en total?
- ¿Cuánto es de interés?
- ¿Qué pasa si me atraso en un pago?

**Lo importante:**

- Un crédito es dinero prestado que se devuelve con interés.
- El interés es lo que pagas de más.
- Pagos más chicos pueden significar pagar más en total.
- Pregunta siempre cuánto pagarás en total.

**Palabras nuevas:**

- **Crédito:** dinero prestado que debes devolver.
- **Interés:** dinero extra que pagas por usar un préstamo.
- **Abono:** cada pago pequeño que haces para saldar una deuda.
- **Deuda:** dinero que debes.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('756e0903-b552-5f87-b04d-25d9e8cee32b', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 7, 'Recibos de luz, agua y teléfono', 'Aprende a leer un recibo, encontrar el total y la fecha límite, y revisar cuánto consumiste.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer un recibo, encontrar lo que debes pagar y comprobar el consumo.

Luis recibe un papel de la compañía de luz. Tiene muchos números y no sabe cuál importa. En casi todos los recibos hay cuatro datos clave. Si los encuentras, ya entiendes lo esencial.

**¿Qué buscar en un recibo?**

1. **Periodo:** el tiempo que cubre el recibo.
2. **Consumo:** cuánto usaste en ese periodo.
3. **Total a pagar:** lo que debes entregar.
4. **Fecha límite:** el último día para pagar sin cargos extra.

El consumo se calcula con dos lecturas del medidor. La lectura actual menos la lectura anterior da lo que usaste. La luz se mide en kilowatts-hora. El agua se mide en metros cúbicos.

**Ejemplo resuelto:**

Estos recibos son ficticios y genéricos. Los precios reales cambian y vienen en tu recibo.

Recibo de luz. Lectura anterior: 5,430. Lectura actual: 5,610.

- Consumo: 5,610 − 5,430 = 180 kilowatts-hora.

Recibo de agua. Lectura anterior: 120. Lectura actual: 138.

- Consumo: 138 − 120 = 18 metros cúbicos.
- Si en este recibo ficticio cada metro cúbico cuesta $3, el cobro es 18 × 3 = 54. Son $54.

Recibo de teléfono. El plan es de $250 y hay un cargo extra de $45.

- Total: 250 + 45 = 295. Debes pagar $295.

Si pagas tarde, pueden cobrarte un cargo extra. Mira la fecha límite.

**Lo importante:**

- Busca el periodo, el consumo, el total y la fecha límite.
- Consumo es lectura actual menos lectura anterior.
- Revisa que el total tenga sentido.
- Pagar a tiempo evita cargos extra.

**Palabras nuevas:**

- **Consumo:** lo que usaste de luz, agua o teléfono.
- **Kilowatt-hora:** unidad con la que se mide la luz que usas.
- **Medidor:** aparato que cuenta cuánto usas.
- **Lectura:** el número que marca el medidor.
- **Fecha límite:** último día para pagar sin cargo extra.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('4c9b02a3-2222-57e3-b202-230c089207ec', 'd83a5528-2564-5fb6-a7ee-92ceecfe8a23', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Billetes, monedas y cambio:** El cambio es lo que sobra de tu pago. Resta el precio al dinero que entregaste. Si pagas $200 por algo de $135, te regresan $65.

**Semana 2 — Presupuesto familiar: ingresos y gastos:** Un presupuesto compara lo que entra con lo que sale. Los ingresos son lo que entra. Los gastos son lo que sale. La resta dice cuánto sobra o falta.

**Semana 3 — Porcentajes básicos: 10 %, 25 % y 50 %:** Por ciento quiere decir «de cada 100». El 50 % es la mitad, el 25 % es la cuarta parte y el 10 % es la décima parte.

**Semana 4 — Descuentos y ofertas:** El descuento se resta del precio. Compara el precio final, no solo el letrero.

**Semana 5 — Ahorro y metas:** Una meta dice cuánto quieres juntar y para qué. Divide la meta entre las semanas o los meses que usarás.

**Semana 6 — Créditos e intereses: lo básico:** Un crédito es dinero prestado. El interés es lo que pagas de más. Antes de firmar, pregunta cuánto pagarás en total.

**Semana 7 — Recibos de luz, agua y teléfono:** Busca el periodo, el consumo, el total y la fecha límite. Pagar a tiempo evita cargos extra.

**Ejercicios de repaso:**

1. Pagas $500 por una compra de $365. ¿Cuánto te regresan? 500 − 365 = 135. Te regresan $135.
2. ¿Cuánto es el 25 % de $800? 800 ÷ 4 = 200. Son $200.
3. Una camisa de $300 tiene 10 % de descuento. El descuento es 300 ÷ 10 = 30. Pagas 300 − 30 = 270. Pagas $270.
4. Quieres juntar $1,200 en 8 semanas. 1,200 ÷ 8 = 150. Guardas $150 cada semana.
5. Un préstamo ficticio de $1,000 se paga con 5 abonos de $240. 5 × 240 = 1,200. El interés es 1,200 − 1,000 = 200. Pagas $200 de más.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('a94b9777-fedd-581a-aa05-9b8e6a824133', '8966fd85-c111-55b6-8335-5c52d025c3a1', 1, 'Mapas y puntos cardinales', 'Aprende a leer un mapa, usar los puntos cardinales y ubicar a México y sus vecinos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer un mapa y ubicar lugares con los puntos cardinales.

Luis llega a una colonia que no conoce. Busca una farmacia. Una vecina le dice: «Camina hacia el norte dos calles y la verás a tu derecha». Luis necesita saber dónde queda el norte. Para eso sirven los puntos cardinales.

**¿Qué son los puntos cardinales?**

Son cuatro direcciones que sirven para ubicarte. Son el norte, el sur, el este y el oeste. El este también se llama oriente. El oeste también se llama poniente.

El Sol sale más o menos por el este y se oculta más o menos por el oeste. Si extiendes el brazo derecho hacia donde sale el Sol, de frente queda el norte. Atrás queda el sur.

**¿Qué es un mapa?**

Un mapa es un dibujo de un lugar visto desde arriba. Casi todos tienen estas partes:

- **Título:** dice qué lugar muestra.
- **Rosa de los vientos:** una figura que señala el norte, el sur, el este y el oeste.
- **Simbología:** dibujos pequeños que explican qué significa cada marca.

**México y sus vecinos**

Al norte, México toca a Estados Unidos. Al sur, toca a Guatemala y Belice. Al oeste está el Océano Pacífico. Al este están el Golfo de México y el Mar Caribe.

**Ejemplo resuelto:**

Rosa mira el mapa de su colonia. Quiere ir del mercado a la escuela.

1. Busca la rosa de los vientos y encuentra el norte.
2. Ve que la escuela está arriba del mercado, hacia el norte.
3. Ve que el parque queda a la derecha de la escuela, hacia el este.

**Lo importante:**

- Los puntos cardinales son norte, sur, este y oeste.
- El Sol sale más o menos por el este y se oculta más o menos por el oeste.
- La rosa de los vientos y la simbología ayudan a leer un mapa.
- México tiene océanos y mares al este y al oeste.

**Palabras nuevas:**

- **Punto cardinal:** una de las cuatro direcciones para ubicarte.
- **Mapa:** dibujo de un lugar visto desde arriba.
- **Simbología:** dibujos que explican las marcas del mapa.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('21f33d24-b69f-5c33-a996-4ce54ce4fa56', '8966fd85-c111-55b6-8335-5c52d025c3a1', 2, 'Las 32 entidades federativas', 'Conoce cómo se divide México en 31 estados y la Ciudad de México, y cómo ubicarlos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir cómo se divide México y nombrar sus 32 entidades.

Doña Carmen tiene familia en varios lugares del país. Un sobrino vive en Yucatán. Una prima vive en Sonora. Una amiga vive en la Ciudad de México. Cada lugar es una parte distinta de México. Cada parte se llama entidad federativa.

**¿Qué es una entidad federativa?**

México es un país con partes. Cada parte tiene su gobierno y sus leyes locales. Son 32: 31 estados y la Ciudad de México. Todas forman un solo país.

Cada entidad tiene una ciudad principal. Se llama capital. Ahí trabaja su gobierno. Los estados se dividen en municipios.

**Las 32 entidades**

1. Aguascalientes
2. Baja California
3. Baja California Sur
4. Campeche
5. Chiapas
6. Chihuahua
7. Ciudad de México
8. Coahuila
9. Colima
10. Durango
11. Guanajuato
12. Guerrero
13. Hidalgo
14. Jalisco
15. México (también llamado Estado de México)
16. Michoacán
17. Morelos
18. Nayarit
19. Nuevo León
20. Oaxaca
21. Puebla
22. Querétaro
23. Quintana Roo
24. San Luis Potosí
25. Sinaloa
26. Sonora
27. Tabasco
28. Tamaulipas
29. Tlaxcala
30. Veracruz
31. Yucatán
32. Zacatecas

**Para ubicarlas**

Rosa vive en Puebla. Eso es en el centro. Su tío vive en Sonora. Eso es en el norte.

- **Norte:** Sonora, Chihuahua, Coahuila, Nuevo León y otras.
- **Centro:** Hidalgo, Puebla, Querétaro y otras.
- **Sur y sureste:** Oaxaca, Chiapas, Yucatán y otras.

**Lo importante:**

- México tiene 32 entidades: 31 estados y la Ciudad de México.
- Cada entidad tiene una capital y un gobierno local.
- Los estados se dividen en municipios.

**Palabras nuevas:**

- **Entidad federativa:** cada una de las 32 partes en que se divide México.
- **Capital:** ciudad principal donde trabaja el gobierno de una entidad.
- **Municipio:** parte de un estado con su propio gobierno local.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('afdee67d-63b5-5bb5-97ac-65be2a35c905', '8966fd85-c111-55b6-8335-5c52d025c3a1', 3, 'Relieve, climas y regiones', 'Conoce las formas del terreno, los climas de México y cómo influyen en la vida diaria.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás describir el relieve y los climas de México y explicar cómo influyen en la vida diaria.

Luis sale en autobús de la costa y llega a una ciudad en la sierra. En la costa sudaba de calor. En la sierra se pone una chamarra. Eso pasa porque México tiene lugares muy distintos.

**¿Qué es el relieve?**

El relieve es la forma que tiene el terreno. Tiene partes altas y partes planas. En México hay:

- **Sierras:** cadenas de montañas con subidas pronunciadas. La Sierra Madre Occidental queda al oeste. La Sierra Madre Oriental queda al este.
- **Altiplano:** una meseta amplia entre las dos sierras. Una meseta es un terreno alto y plano.
- **Volcanes:** montañas que pueden arrojar lava, ceniza y gases. Hay varios en el centro, como el Popocatépetl.
- **Llanuras:** terrenos bajos y planos en las costas.
- **Península de Yucatán:** tierra rodeada de mar por tres lados, al sureste.

**¿Qué es el clima?**

El clima es cómo suele ser el tiempo en un lugar durante muchos años. Depende del calor, la lluvia y la altura. Mientras más alto está un lugar, más frío suele hacer. Por eso en la sierra Luis necesita chamarra.

Los tres climas más extendidos son:

- **Cálido:** hace calor casi todo el año, como en las costas.
- **Seco:** llueve muy poco, como en gran parte del norte.
- **Templado:** ni mucho calor ni mucho frío, como en lugares altos.

En las cumbres de los volcanes hace frío todo el año.

**¿Qué es una región?**

Una región es una zona con rasgos parecidos. El norte es seco. El sureste es cálido y lluvioso. El centro es alto y templado.

**Lo importante:**

- El relieve es la forma del terreno.
- Mientras más alto un lugar, más frío suele hacer.
- Cada región tiene rasgos parecidos de relieve y clima.

**Palabras nuevas:**

- **Relieve:** forma que tiene el terreno.
- **Clima:** cómo suele ser el tiempo en un lugar durante muchos años.
- **Región:** zona con rasgos parecidos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('6f1dd0f9-a091-516b-9a66-985e9bda54c0', '8966fd85-c111-55b6-8335-5c52d025c3a1', 4, 'Recursos naturales', 'Aprende qué son los recursos naturales de México, cuáles se renuevan y cómo usarlos con cuidado.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás reconocer los recursos naturales de México y decir cómo cuidarlos.

Rosa prepara tortillas con maíz y las pone en un comal. Usa agua para lavar y gas para cocinar. Casi todo lo que usa en su cocina viene de la naturaleza. Esas cosas se llaman recursos naturales.

**¿Qué son los recursos naturales?**

Son todo lo que la naturaleza nos da y que usamos para vivir. El agua, el suelo, las plantas y los animales son recursos naturales. También lo son los minerales y el petróleo.

**Dos tipos de recursos**

- **Renovables:** vuelven a existir con el tiempo si los cuidamos. El agua y los bosques se renuevan. El Sol y el viento no se agotan al usarlos.
- **No renovables:** se acaban y no vuelven pronto. Por ejemplo, el petróleo y los minerales.

**Recursos de México**

Cada región tiene los suyos:

- **Petróleo:** en el Golfo de México, sobre todo en Tabasco y Campeche.
- **Plata:** en las minas de Zacatecas.
- **Bosques:** en la sierra, como en Durango y Chihuahua.
- **Pesca:** en las costas del Pacífico y del Golfo.
- **Maíz:** se siembra en gran parte del país.

**Cómo cuidarlos**

Usar un recurso no es malo. Lo que daña es usarlo sin cuidado. Algunas acciones ayudan:

- Cerrar la llave mientras te enjabonas.
- Separar la basura para reciclar.
- Sembrar un árbol cuando cortas otro.

**Lo importante:**

- Los recursos naturales vienen de la naturaleza.
- Unos se renuevan y otros no.
- Cada región de México tiene recursos distintos.

**Palabras nuevas:**

- **Recurso natural:** algo que da la naturaleza y que usamos para vivir.
- **Renovable:** recurso que vuelve a existir si se cuida.
- **No renovable:** recurso que se acaba y no vuelve pronto.
- **Reciclar:** volver a usar materiales para hacer cosas nuevas.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9880b69a-5275-5338-87f0-1ff95fb18a20', '8966fd85-c111-55b6-8335-5c52d025c3a1', 5, 'Diversidad cultural y lenguas indígenas', 'Conoce la riqueza cultural de México, sus pueblos y lenguas indígenas, y por qué merecen respeto.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es la diversidad cultural y por qué las lenguas indígenas merecen respeto.

Doña Carmen va a una fiesta en un pueblo. Escucha una música que no conocía. Prueba una comida distinta a la suya. Oye a unas señoras hablar en su lengua materna. Todo eso forma parte de la cultura de México.

**¿Qué es la diversidad cultural?**

Cultura es la forma de vivir de un grupo de personas. Incluye la comida, la música, la ropa, las fiestas y la lengua. Diversidad quiere decir que hay muchas formas distintas. En México conviven muchas culturas.

**Pueblos indígenas**

Los pueblos indígenas son comunidades con una historia que viene de antes de la llegada de los españoles. Conservan sus tradiciones, su forma de organizarse y su lengua. Viven en el campo y en las ciudades.

**Lenguas indígenas**

En México se reconocen 68 lenguas indígenas. Cada una guarda conocimientos y una manera de ver el mundo. Algunas muy conocidas son:

- **El náhuatl,** sobre todo en el centro del país.
- **El maya,** en la península de Yucatán.
- **El zapoteco y el mixteco,** en Oaxaca.

Algunas palabras del español vienen del náhuatl, como «tomate», «aguacate» y «chocolate».

**Respeto y convivencia**

Todas las personas tienen derecho a hablar su lengua y a vivir su cultura. Convivir con respeto significa escuchar, no burlarse y aprender del otro.

**Lo importante:**

- La cultura incluye comida, música, fiestas y lengua.
- México tiene muchos pueblos y lenguas indígenas.
- Todas las personas merecen respeto por su cultura.

**Palabras nuevas:**

- **Cultura:** forma de vivir de un grupo de personas.
- **Diversidad:** que hay muchas formas distintas.
- **Pueblo indígena:** comunidad con historia anterior a la llegada de los españoles.
- **Lengua materna:** la primera lengua que aprendes en tu casa.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('428ea9dd-ab83-5b8c-989d-3d063055e888', '8966fd85-c111-55b6-8335-5c52d025c3a1', 6, 'Mi comunidad: servicios y organización', 'Conoce los servicios públicos de tu comunidad y cómo se organizan sus habitantes y su gobierno.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar los servicios de tu comunidad y decir cómo se organiza.

Rosa abre la llave y sale agua. Prende el foco y hay luz. Saca la basura y pasa el camión. Todo eso parece normal. Pero detrás hay personas y reglas que lo hacen posible.

**¿Qué es una comunidad?**

Una comunidad es un grupo de personas que viven en un mismo lugar y comparten cosas. Puede ser un barrio, una colonia, un pueblo o una ciudad. Sus habitantes se ayudan y resuelven juntos sus problemas.

**Servicios públicos**

Son servicios que ayudan a todos los habitantes. Los más comunes son:

- Agua potable y drenaje.
- Luz eléctrica.
- Recolección de basura.
- Calles, banquetas y alumbrado.
- Transporte público.
- Escuelas y centros de salud.

**¿Quién se encarga?**

En cada municipio hay un gobierno local. Se llama ayuntamiento. Lo dirige la persona que preside el municipio. El ayuntamiento atiende muchos servicios de la comunidad. Algunos servicios, como la luz, los da una compañía del gobierno federal.

**Organización de los vecinos**

Los vecinos también se organizan. Hacen juntas, forman comités y reparten tareas. Así resuelven problemas que les afectan a todos.

**Ejemplo:**

En la calle de Luis hay un foco fundido desde hace días. Luis habla con sus vecinos. Juntos escriben un aviso y lo llevan al ayuntamiento. Piden que arreglen el alumbrado.

**Lo importante:**

- Una comunidad es un grupo que vive en el mismo lugar.
- Los servicios públicos ayudan a todos los habitantes.
- Los vecinos pueden organizarse para pedir mejoras.

**Palabras nuevas:**

- **Comunidad:** grupo de personas que viven en un mismo lugar.
- **Servicio público:** servicio que ayuda a todos los habitantes.
- **Ayuntamiento:** gobierno local de un municipio.
- **Comité:** grupo de vecinos que se reúne para una tarea.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f8284429-e576-5704-8d9a-4ce601598153', '8966fd85-c111-55b6-8335-5c52d025c3a1', 7, 'Población y migración', 'Entiende qué es la población, cómo se distribuye en México y por qué las personas migran.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es la población, cómo se reparte en México y por qué las personas migran.

Luis nació en un pueblo pequeño. Hoy trabaja en una ciudad grande. Rosa hizo lo contrario. Vivió en la ciudad y ahora vive en un pueblo cerca de la playa. Los dos cambiaron de lugar. Eso es parte de la vida de muchas personas.

**¿Qué es la población?**

La población es el conjunto de personas que viven en un lugar. Puede ser un pueblo, un estado o un país. El número de habitantes cambia. Cada 10 años, el censo cuenta a la población del país. Ahí se consulta el dato de hoy.

**¿Cómo se reparte en México?**

Las personas no viven repartidas por igual.

- **Zonas urbanas:** ciudades muy pobladas, como la Ciudad de México.
- **Zonas rurales:** pueblos y rancherías con menos habitantes y más campo. Las rancherías son pueblos muy pequeños.

Muchas personas viven donde hay agua, trabajo y servicios.

**¿Qué es la migración?**

Migrar es cambiar el lugar donde vives. Puede ser dentro del país o hacia otro país. Las razones son muy variadas:

- Buscar trabajo o estudiar.
- Reunirse con la familia.
- Buscar mayor seguridad.

Migrar es una decisión que toman las personas por muchas razones. Merece respeto, sin juicios.

**Lo importante:**

- La población es el conjunto de personas que viven en un lugar.
- El censo cuenta a la población cada 10 años.
- Migrar es cambiar el lugar donde vives.

**Palabras nuevas:**

- **Población:** conjunto de personas que viven en un lugar.
- **Migrar:** cambiar el lugar donde vives.
- **Zona rural:** lugar con menos habitantes y más campo.
- **Censo:** conteo de las personas que viven en el país.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('384e4193-1a66-53df-a7e2-370f089b0138', '8966fd85-c111-55b6-8335-5c52d025c3a1', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Mapas y puntos cardinales:** Los puntos cardinales son norte, sur, este y oeste. El Sol sale más o menos por el este. La rosa de los vientos y la simbología ayudan a leer un mapa.

**Semana 2 — Las 32 entidades federativas:** México tiene 31 estados y la Ciudad de México. Cada entidad tiene una capital. Los estados se dividen en municipios.

**Semana 3 — Relieve, climas y regiones:** El relieve es la forma del terreno. El clima es el tiempo que suele haber en un lugar. Los climas muy conocidos son el cálido, el seco y el templado.

**Semana 4 — Recursos naturales:** Los recursos naturales vienen de la naturaleza. Los renovables vuelven con el tiempo. Los no renovables se acaban.

**Semana 5 — Diversidad cultural y lenguas indígenas:** México tiene muchas culturas. Algunas lenguas muy conocidas son el náhuatl, el maya, el zapoteco y el mixteco. Todas merecen respeto.

**Semana 6 — Mi comunidad: servicios y organización:** Los servicios públicos ayudan a todos. El ayuntamiento es el gobierno de un municipio. Los vecinos pueden organizarse.

**Semana 7 — Población y migración:** La población es el conjunto de personas que viven en un lugar. Migrar es cambiar el lugar donde vives. Se hace por muchas razones.

**Ejercicios de repaso:**

1. Si miras hacia donde sale el Sol, ¿qué punto cardinal es? Es el este. El Sol sale más o menos por el este.
2. ¿Cuántas entidades tiene México? Tiene 32: 31 estados y la Ciudad de México.
3. ¿Dónde hace más frío, en la costa o en la sierra? En la sierra. Mientras más alto está un lugar, más frío suele hacer.
4. ¿El agua es un recurso renovable o no renovable? Es renovable, si la cuidamos.
5. ¿Qué es migrar? Es cambiar el lugar donde vives. Se hace por muchas razones y merece respeto.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('db2c9875-6008-5c31-a885-c5fe65ecd8ee', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 1, 'Tablas de conteo', 'Aprende a contar datos con rayitas y a ordenarlos en una tabla fácil de leer.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás anotar datos con rayitas y armar una tabla de conteo.

Rosa vende fruta en un puesto. En la mañana, 20 clientes le piden la fruta que prefieren. Si intenta recordar todo, se confunde. Mejor la anota en una hoja.

**¿Qué es una tabla de conteo?**

Una tabla de conteo sirve para anotar datos mientras pasan. Cada vez que alguien pide una fruta, haces una rayita. Cuentas de cinco en cinco y al final sumas.

| Fruta | Conteo | Total |
| --- | --- | --- |
| Mango | ///// // | 7 |
| Plátano | ///// //// | 9 |
| Papaya | //// | 4 |

**Ejemplo resuelto:**

Rosa quiere saber cuántos clientes hubo y cuál fruta se pidió más.

1. Cuenta las rayitas de cada fila: 7, 9 y 4.
2. Suma los totales: 7 + 9 + 4 = 20.
3. Hubo 20 clientes. Coincide con los que Rosa atendió.
4. El plátano se pidió más. Tuvo 9 − 4 = 5 pedidos más que la papaya.
5. Para saber cuántos no pidieron mango, resta: 20 − 7 = 13 clientes.

**Lo importante:**

- La tabla de conteo ordena los datos mientras los recibes.
- Cada rayita es un dato, y cada cinco rayitas forman un grupo.
- Sumas los totales para saber cuántos datos hay.

**Palabras nuevas:**

- **Dato:** un número o un nombre que anotas para saber algo.
- **Conteo:** la cuenta que haces con una rayita por cada dato.
- **Total:** el resultado de sumar todo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('781ad924-9d78-5bab-9f49-ccec56cf981f', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 2, 'Gráficas de barras', 'Aprende a leer una gráfica de barras y a sacar de ella el mayor, el menor y la diferencia.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer una gráfica de barras y comparar sus datos.

Una panadería anota cuántas cajas de pan vende cada día. Con los números sueltos cuesta trabajo comparar. Con una gráfica se ve de un vistazo. Los datos de este ejemplo son inventados.

**¿Cómo se lee una gráfica de barras?**

Una gráfica de barras muestra los datos con barras. Entre más larga es la barra, mayor es el dato. Cada barra tiene un nombre y un valor. Aquí cada ■ vale 1 caja.

Cajas de pan vendidas en una semana de ejemplo:

- Lunes: ■■■■ (4)
- Martes: ■■■■■■ (6)
- Miércoles: ■■■ (3)
- Jueves: ■■■■■■■■ (8)
- Viernes: ■■■■■■■ (7)

**La escala:**

La escala dice cuánto vale cada marca. Si cada ■ valiera 2 cajas, el lunes sería 4 × 2 = 8 cajas. Por eso, busca siempre la escala antes de leer.

**Ejemplo resuelto:**

Responde con la gráfica de arriba.

1. ¿Qué día se vendió más? El jueves, con la barra más larga: 8 cajas.
2. ¿Qué día se vendió menos? El miércoles, con 3 cajas.
3. ¿Cuánta diferencia hay? 8 − 3 = 5 cajas.
4. ¿Cuánto se vendió en total? 4 + 6 + 3 + 8 + 7 = 28 cajas.

**Lo importante:**

- La barra más larga es el dato mayor, y la más corta es el menor.
- Antes de leer, revisa el título y la escala.
- La diferencia entre dos datos se calcula con una resta.

**Palabras nuevas:**

- **Gráfica:** un dibujo que muestra datos para compararlos.
- **Escala:** lo que vale cada marca de la gráfica.
- **Diferencia:** lo que resulta al restar un dato de otro.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('04459f1a-58da-519b-a2b4-e3cd9bb96065', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 3, 'Pictogramas y gráficas de línea sencillas', 'Aprende a leer pictogramas y gráficas de línea para ver cuánto vale cada dibujo y cómo cambia un dato.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer un pictograma y una gráfica de línea sencilla.

Una tienda de la esquina anota los litros de leche que vende. En lugar de escribir números, dibuja círculos. Así ve rápido qué día vendió más. Los datos de este ejemplo son inventados.

**¿Qué es un pictograma?**

Un pictograma usa dibujos para mostrar datos. Cada dibujo vale una cantidad. Esa cantidad se llama clave. Aquí cada ● vale 10 litros.

- Lunes: ●●●
- Martes: ●●●●●
- Miércoles: ●●

**¿Qué es una gráfica de línea?**

Una gráfica de línea muestra cómo cambia un dato con el paso del tiempo. Cada punto es una medida. La línea une los puntos. Si va hacia arriba, el dato sube. Si va hacia abajo, baja.

| Hora | Temperatura |
| --- | --- |
| 8 de la mañana | 14 grados Celsius |
| 10 de la mañana | 18 grados |
| 12 del día | 24 grados |
| 2 de la tarde | 26 grados |

Si pones cada hora como un punto, más alto cuanto más grados, y unes los puntos, la línea sube de 14 a 26: eso es una gráfica de línea.

**Ejemplo resuelto:**

1. El lunes tiene 3 círculos: 3 × 10 = 30 litros.
2. El martes tiene 5 círculos: 5 × 10 = 50 litros.
3. El miércoles tiene 2 círculos: 2 × 10 = 20 litros.
4. En total: 30 + 50 + 20 = 100 litros.
5. En la tabla, de las 8 a las 10 la temperatura subió 18 − 14 = 4 grados.
6. Del principio al final subió 26 − 14 = 12 grados.

**Lo importante:**

- En un pictograma, cada dibujo vale lo que dice la clave.
- En una gráfica de línea, la línea muestra si el dato sube o baja.

**Palabras nuevas:**

- **Pictograma:** una gráfica hecha con dibujos.
- **Clave:** lo que vale cada dibujo del pictograma.
- **Gráfica de línea:** una gráfica que muestra cambios con una línea.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('39bf407e-39a0-5c0c-b09e-efb67e585246', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 4, 'El promedio', 'Aprende a sacar el promedio de varios datos sumando y dividiendo, y a entender qué significa.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sacar el promedio de varios datos.

Una vecina vende tamales. El lunes vendió 4 docenas, el martes 5 y el miércoles 9. Ella quiere saber cuánto vende en un día común. Para eso sirve el promedio.

**¿Qué es el promedio?**

El promedio es el valor que tendría cada dato si todos fueran iguales. Es un reparto parejo. Para sacarlo, sigues dos pasos:

1. Suma todos los datos.
2. Divide la suma entre cuántos datos son.

**Ejemplo resuelto:**

Los tamales de la vecina:

1. Suma: 4 + 5 + 9 = 18.
2. Cuenta los datos. Son 3 días.
3. Divide: 18 ÷ 3 = 6.
4. El promedio es 6 docenas al día.

Para comprobar, reparte parejo: 6 + 6 + 6 = 18. Sale la misma suma. Fíjate que ningún día vendió justo 6. El promedio no tiene que ser uno de los datos.

Otro caso: Luis gastó en pasajes $20, $30, $25 y $25 en cuatro días.

1. Suma: 20 + 30 + 25 + 25 = 100.
2. Divide: 100 ÷ 4 = 25.
3. Gastó en promedio $25 al día.

**Lo importante:**

- El promedio es un reparto parejo de todos los datos.
- Primero sumas, y luego divides entre cuántos datos hay.
- Puede ser un número que no está entre los datos.

**Palabras nuevas:**

- **Promedio:** el valor que tendría cada dato si todos fueran iguales.
- **Suma:** el resultado de juntar todos los datos.
- **Reparto parejo:** dividir algo en partes iguales.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ee8ea1c3-7059-5b35-b62e-ae9622e22b68', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 5, 'La moda: el dato más frecuente', 'Aprende a encontrar la moda de una lista de datos contando cuántas veces se repite cada uno.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás encontrar la moda de una lista de datos.

Una zapatería anota las tallas que vendió en un día: 25, 26, 25, 27, 25, 26 y 28. El dueño quiere pedir más zapatos de la talla que más se vende. Para decidir, busca la moda.

**¿Qué es la moda?**

La moda es el dato que más se repite. Para encontrarla no sumas ni divides. Solo cuentas cuántas veces sale cada dato. Los datos también pueden ser palabras, como colores o nombres.

**Ejemplo resuelto:**

1. Anota cada talla una sola vez: 25, 26, 27 y 28.
2. Cuenta cuántas veces sale cada una.

| Talla | Veces |
| --- | --- |
| 25 | 3 |
| 26 | 2 |
| 27 | 1 |
| 28 | 1 |

3. Busca el número mayor de la columna «Veces». Es el 3.
4. La moda es la talla 25.
5. Comprueba que contaste todo: 3 + 2 + 1 + 1 = 7 datos. Son los 7 pares vendidos.
6. La talla 25 se vendió 3 − 2 = 1 par más que la 26.

**Casos especiales:**

- Si dos datos se repiten igual de veces, hay dos modas.
- Si ningún dato se repite, o todos se repiten igual, no hay moda.
- Si en un grupo hay 4 camisas azules y 2 rojas, la moda es azul.

**Lo importante:**

- La moda es el dato que más se repite.
- Se encuentra contando, sin sumar ni dividir.
- Puede haber una moda, dos modas o ninguna.

**Palabras nuevas:**

- **Moda:** el dato que más veces se repite.
- **Frecuencia:** cuántas veces sale un dato.
- **Repetir:** aparecer más de una vez.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('3eb52459-090f-50e7-8fa1-336b2ee32fc2', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 6, 'Probabilidad sencilla: seguro, posible, imposible', 'Aprende a decir si algo es seguro, posible o imposible, y a comparar qué es más probable.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás decir si algo es seguro, posible o imposible.

Rosa va a sacar una canica de una bolsa sin ver. No sabe cuál saldrá. Pero sí puede decir qué cosas pueden pasar y cuáles no. Eso es hablar de probabilidad.

**¿Qué es la probabilidad?**

La probabilidad dice qué tan fácil es que algo pase. Usamos tres palabras:

- **Seguro:** va a pasar siempre.
- **Posible:** puede pasar o no pasar.
- **Imposible:** nunca va a pasar.

**Ejemplo resuelto:**

La bolsa A tiene 5 canicas rojas. Sacar una roja es seguro. Sacar una azul es imposible.

La bolsa B tiene 3 canicas rojas y 2 azules. Hay 3 + 2 = 5 canicas en total.

1. Sacar roja es posible.
2. Sacar azul también es posible.
3. Sacar roja es más probable, porque hay 3 − 2 = 1 roja más.

Ahora piensa en un dado de 6 caras, con los números del 1 al 6.

1. Sacar un número del 1 al 6 es seguro.
2. Sacar el 7 es imposible, porque no existe en el dado.
3. Sacar un número par es posible. Los pares son 2, 4 y 6. Son 3 caras de 6, es decir, la mitad: 6 ÷ 2 = 3.

**Lo importante:**

- Seguro pasa siempre, e imposible nunca pasa.
- Posible puede pasar o no.
- Es más probable lo que tiene más casos a favor.

**Palabras nuevas:**

- **Probabilidad:** qué tan fácil es que algo pase.
- **Seguro:** lo que va a pasar siempre.
- **Imposible:** lo que nunca va a pasar.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('b910ad40-ad39-54b1-9bb4-b605df1f4106', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 7, 'Leer gráficas en noticias y recibos', 'Aprende a leer con cuidado las gráficas de recibos y noticias, y a no dejarte engañar por la escala.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás leer una gráfica de un recibo o de una noticia con cuidado.

En muchos recibos de luz viene una gráfica con lo que usaste en cada periodo. En las noticias también hay gráficas. Leerlas bien te ayuda a revisar si algo subió o bajó.

**Cuatro pasos para leer una gráfica:**

1. Lee el título: dice de qué trata.
2. Busca la escala y las unidades.
3. Fíjate en la fecha y de dónde salen los datos.
4. Compara los datos con números, no solo con la vista.

**Ejemplo resuelto:**

Esta gráfica es de ejemplo, no tiene cifras reales. Muestra el consumo de luz en kilowatts-hora de cuatro periodos. Cada ■ vale 30.

- Periodo 1: ■■■■■■ (180)
- Periodo 2: ■■■■■■■ (210)
- Periodo 3: ■■■■■ (150)
- Periodo 4: ■■■■■■■■ (240)

1. El mayor consumo fue el del periodo 4.
2. Comparado con el periodo 3, subió 240 − 150 = 90.
3. El total es 180 + 210 + 150 + 240 = 780.
4. El promedio es 780 ÷ 4 = 195 por periodo.

**Cuidado con la escala:**

Una gráfica puede exagerar si su escala no empieza en cero. Dos barras de 50 y 55 se ven casi iguales. Pero si la escala empieza en 45, se dibujan de 50 − 45 = 5 y de 55 − 45 = 10. La segunda parece el doble.

**Lo importante:**

- Lee título, escala, fecha y fuente antes de opinar.
- Calcula con los números de la gráfica.
- Revisa dónde empieza la escala.
- En una noticia, revisa también quién publica los datos y de qué fecha son.

**Palabras nuevas:**

- **Consumo:** la cantidad que usaste de algo en un periodo.
- **Kilowatt-hora:** la medida de la energía eléctrica que usas.
- **Fuente:** el lugar de donde salen los datos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('7958f52e-0eb6-5567-87b0-86a2e818577e', '06be62fe-d3f1-5840-a36b-d5ca4cfbb656', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Tablas de conteo:** Anotas una rayita por cada dato y cuentas de cinco en cinco. Al final sumas los totales para saber cuántos datos hay.

**Semana 2 — Gráficas de barras:** La barra más larga es el dato mayor. Antes de leer, busca el título y la escala. La diferencia entre dos datos es una resta.

**Semana 3 — Pictogramas y gráficas de línea sencillas:** En un pictograma, cada dibujo vale lo que dice la clave. En una gráfica de línea, la línea muestra si el dato sube o baja.

**Semana 4 — El promedio:** Suma los datos y divide entre cuántos son. Es un reparto parejo.

**Semana 5 — La moda: el dato más frecuente:** La moda es el dato que más se repite. Se encuentra contando.

**Semana 6 — Probabilidad sencilla: seguro, posible, imposible:** Seguro pasa siempre. Imposible nunca pasa. Posible puede pasar o no.

**Semana 7 — Leer gráficas en noticias y recibos:** Lee título, escala, fecha y fuente. Revisa dónde empieza la escala.

**Ejercicios de repaso:**

1. Un puesto anotó 6 pedidos de mango, 3 de papaya y 5 de plátano. 6 + 3 + 5 = 14. Hubo 14 pedidos.
2. En una gráfica, cada ■ vale 2 cajas y una barra tiene 5 ■. 5 × 2 = 10. Son 10 cajas.
3. Promedio de 8, 10 y 12. Suma: 8 + 10 + 12 = 30. Divide: 30 ÷ 3 = 10. El promedio es 10.
4. Moda de 2, 3, 3, 4, 3 y 5. El 3 sale 3 veces y los demás una vez. La moda es 3.
5. Una bolsa tiene 4 canicas verdes. Sacar una verde es seguro. Sacar una roja es imposible.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('55f0c1f8-0f66-59d5-bc02-5a79aa00e6e4', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 1, 'Los derechos humanos', 'Aprende qué son los derechos humanos, cómo son y cuáles te protegen todos los días.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué son los derechos humanos y dar ejemplos de ellos.

Rosa vende fruta en el mercado. Nadie le impide trabajar y nadie la trata con violencia. Si se enferma, puede ir a un centro de salud. Todo eso es posible porque las personas tenemos derechos.

**¿Qué son los derechos humanos?**

Los derechos humanos son lo que toda persona necesita para vivir con dignidad. Dignidad quiere decir que mereces respeto por ser persona. Nadie te los regala. Los tienes desde que naces.

**¿Cómo son?**

- **Universales:** son para todas las personas, sin excepción.
- **Iguales:** todas las personas valemos lo mismo y tenemos los mismos derechos humanos.
- **Para todos los días:** sirven en la casa, en la calle y en el trabajo.

**Algunos ejemplos**

- El derecho a la vida y a la salud.
- El derecho a la educación.
- El derecho a un trabajo digno.
- El derecho a opinar y a expresar tus ideas.
- El derecho a un trato justo.

**Derechos y respeto**

Tus derechos terminan donde empiezan los de otra persona. Por eso, cuando exiges respeto, también respetas. Así se vive mejor en una comunidad.

**Ejemplo:**

Doña Carmen y Luis no coinciden en cómo arreglar el patio de su unidad. Cada quien dice su idea. Se escuchan sin gritos y después votan. Los dos ejercieron su derecho a opinar. Los dos respetaron el derecho del otro.

**Lo importante:**

- Los derechos humanos son para todas las personas.
- Se tienen por ser persona, desde el nacimiento.
- Todos tenemos los mismos derechos.
- Ejercer tus derechos incluye respetar los de los demás.
- Todos valemos lo mismo.

**Palabras nuevas:**

- **Derecho:** algo que puedes pedir y que te protege.
- **Dignidad:** el valor que tiene toda persona y que exige respeto.
- **Universal:** que es para todas las personas, sin excepción.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('07f95dda-f6ba-52c5-8fe4-4910e2be94ef', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 2, 'La Constitución y los tres poderes', 'Conoce qué es la Constitución y cómo se reparte el poder en tres partes para cuidar tus derechos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es la Constitución y qué hace cada uno de los tres poderes.

En una unidad de vecinos hay reglas. Se cuida la limpieza y se respetan los horarios. Sin reglas, habría muchos pleitos. Un país también necesita reglas, y la más importante se llama Constitución.

**¿Qué es la Constitución?**

La Constitución es la ley más importante del país. Todas las demás leyes deben respetarla. La que rige hoy en México es la de 1917. Ahí están tus derechos y se explica cómo se organiza el gobierno.

**Los tres poderes**

Si una sola persona tuviera todo el poder, podría abusar. Por eso el gobierno se divide en tres poderes:

1. **Ejecutivo.** Aplica las leyes y administra el país. Lo encabeza la presidencia de la República.
2. **Legislativo.** Hace y cambia las leyes. Lo forman diputados y senadores, que trabajan en el Congreso.
3. **Judicial.** Resuelve conflictos y revisa que se cumpla la ley. Lo forman jueces y tribunales.

Cada poder vigila a los otros dos. A esto se le llama equilibrio.

**Ejemplo:**

Una vecina cree que una multa que recibió fue injusta. Veamos quién participa en cada paso.

- El Legislativo escribió la ley que dice cuándo se puede poner una multa.
- El Ejecutivo aplicó esa ley y puso la multa.
- El Judicial puede revisar si la multa fue justa.

**Lo importante:**

- La Constitución es la ley más importante y protege tus derechos.
- Los tres poderes son Ejecutivo, Legislativo y Judicial.
- El Legislativo hace las leyes, el Ejecutivo las aplica y el Judicial resuelve conflictos.
- Los poderes se vigilan entre sí.

**Palabras nuevas:**

- **Constitución:** la ley más importante del país.
- **Poder:** una parte del gobierno con una tarea propia.
- **Congreso:** el lugar donde trabajan los diputados y los senadores.
- **Tribunal:** el lugar donde los jueces resuelven conflictos.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('f2ad4f65-6b21-505c-9a0d-3284ee5d9df4', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 3, 'Municipio, estado y federación', 'Distingue los tres niveles de gobierno y aprende a quién acudir según el problema.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás distinguir el municipio, el estado y la federación, y saber qué atiende cada uno.

Luis ve que la lámpara de su calle no prende. ¿A quién le avisa? Para saberlo, conviene conocer los tres niveles de gobierno. Cada uno atiende cosas distintas.

**El municipio**

Es el gobierno más cercano a ti. Lo encabeza una presidencia municipal junto con el ayuntamiento. Atiende servicios de tu colonia o pueblo: agua potable, basura, alumbrado de las calles y mercados.

**El estado**

México tiene 32 entidades: 31 estados y la Ciudad de México. La Ciudad de México tiene alcaldías. Cada estado tiene su gobierno, su congreso y sus tribunales. Hace leyes para su territorio y cuida los caminos estatales. También coordina servicios de salud y educación.

**La federación**

Es el gobierno de todo el país. Incluye el Poder Ejecutivo, el Congreso de la Unión y los tribunales federales. Se ocupa de asuntos que son de todos: las fronteras, la moneda y las carreteras federales.

**Ejemplo resuelto:**

Luis quiere saber a quién avisar de la lámpara descompuesta.

1. Identifica el problema: es alumbrado de una calle.
2. Piensa qué nivel lo atiende: el alumbrado es un servicio del municipio.
3. Avisa al ayuntamiento de su municipio.

Si el daño estuviera en una carretera federal, el aviso iría a la autoridad federal.

**Lo importante:**

- Los tres niveles de gobierno son municipio, estado y federación.
- El municipio es el más cercano y da servicios locales.
- México tiene 32 entidades.
- Saber quién atiende cada asunto te ahorra tiempo.

**Palabras nuevas:**

- **Municipio:** la parte del estado que tiene su propio gobierno local.
- **Ayuntamiento:** el grupo que gobierna un municipio.
- **Entidad:** cada una de las partes en que se divide el país.
- **Federación:** el gobierno de todo el país.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('608f2ef2-ab2c-5d51-9945-620b16eafaf3', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 4, 'Derechos de niñas, niños, adolescentes y personas mayores', 'Conoce los derechos de la niñez, la adolescencia y las personas mayores, y cómo la comunidad puede protegerlos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar derechos de la niñez, la adolescencia y las personas mayores.

Rosa lleva a su sobrina Ana a la escuela. Después acompaña a doña Carmen a su cita médica. Las dos reciben cuidados distintos. Eso es porque la niñez y las personas mayores necesitan una protección especial.

**Derechos de niñas, niños y adolescentes**

Niñas y niños: menores de 12 años. Adolescentes: de 12 a 17 años. Tienen los mismos derechos humanos y una protección especial por su edad:

- Vivir en familia y recibir cuidados.
- Estudiar y recibir atención de salud.
- Jugar y descansar.
- Opinar y ser escuchados, según su edad.
- Estar protegidos contra el maltrato.

Cuando una decisión les afecta, se piensa primero en su bienestar. A esto se le llama interés superior.

**Derechos de las personas mayores**

Persona mayor: persona de 60 años o más. Tiene los mismos derechos humanos y también protección especial:

- Recibir un trato digno y respetuoso.
- Recibir atención médica.
- Vivir sin abandono ni maltrato.
- Participar en la vida de su comunidad.
- Decidir sobre su propia vida.

La familia, la sociedad y el gobierno comparten el deber de cuidarlas.

**Ejemplo:**

Ana tiene 13 años y quiere seguir estudiando. En su casa le piden que trabaje todo el día. Su derecho a la educación debe cuidarse. Un adulto de confianza puede hablar con la familia. Si hay peligro, llama al 911.

**Lo importante:**

- Niñas, niños y adolescentes tienen protección especial.
- Las personas mayores tienen derecho a un trato digno.
- Cuidar a quien lo necesita es tarea de todos.

**Palabras nuevas:**

- **Niñez:** la etapa de la vida antes de ser adolescente.
- **Adolescente:** persona de 12 a 17 años.
- **Persona mayor:** persona de 60 años o más.
- **Maltrato:** daño que se hace a otra persona.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('606f2b32-7acc-556a-a268-318b81ad7bb0', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 5, 'Igualdad y no discriminación', 'Aprende qué es la igualdad, qué es la discriminación y qué puedes hacer para respetar a todas las personas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es la discriminación y cómo ayudar a evitarla.

Marta llega a una tienda con su bastón. Le dicen que no puede entrar porque estorba. Ella se siente mal y se va. Lo que le pasó no debería pasarle a nadie.

**¿Qué es la igualdad?**

La igualdad quiere decir que todas las personas tenemos los mismos derechos y la misma dignidad. Ser iguales no es ser idénticos. Somos distintos y valemos lo mismo.

**¿Qué es la discriminación?**

Discriminar es tratar peor a una persona por una característica suya. Con ese trato se le niegan o se le limitan sus derechos. Algunas características son:

- El origen étnico o nacional.
- El género.
- La edad.
- La discapacidad.
- La condición social.
- La salud.
- La religión.
- Las opiniones.
- Las preferencias sexuales.
- El estado civil.

La Constitución prohíbe discriminar por estas causas y por cualquier otra que dañe la dignidad.

**¿Qué puedes hacer?**

Escucha antes de opinar. Evita burlas y apodos que lastiman.

**Ejemplo resuelto:**

Luis ve que a una compañera le niegan un servicio por su lengua.

1. Se acerca con calma y pregunta a la compañera cómo está.
2. Anota qué pasó, dónde y cuándo.
3. Le sugiere pedir orientación en la comisión de derechos humanos de su estado.

Si vives discriminación, no es tu culpa. Si hay peligro, llama al 911.

**Lo importante:**

- Todas las personas tenemos los mismos derechos.
- Discriminar es tratar peor a alguien por una característica suya.
- Si te pasa, no es tu culpa y puedes pedir orientación.

**Palabras nuevas:**

- **Igualdad:** que todas las personas tienen los mismos derechos.
- **Discriminación:** trato peor hacia una persona por una característica suya.
- **Discapacidad:** una condición que dificulta hacer algunas actividades sin apoyo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('ffaa99d9-1fdd-5115-8931-f5f8e4c4c5e5', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 6, 'Participación ciudadana y el voto', 'Conoce qué es ser ciudadano, cómo participar en tu comunidad y cómo se ejerce el voto.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué es la participación ciudadana y cómo se vota.

En la unidad de Rosa, el agua falla seguido. Los vecinos hacen una junta. Escriben una petición firmada y la entregan a la autoridad. Así participaron en un asunto de su comunidad.

**¿Qué es ser ciudadano?**

Una persona mexicana que cumple 18 años es ciudadana. Con esa edad adquiere el derecho a votar y a participar en las decisiones del país. También tiene la responsabilidad de cuidar lo común.

**Formas de participar**

- Asistir a las juntas de vecinos.
- Hacer una petición por escrito.
- Cuidar los espacios comunes.
- Informarte antes de decidir.
- Votar.

**El voto**

Votar es elegir a quienes ocuparán algunos cargos públicos. Es un derecho y también una obligación ciudadana. El voto tiene tres cualidades. Es libre: nadie te puede obligar a elegir una opción. Es secreto: nadie debe saber por quién votaste. Es personal: solo tú puedes votar por ti.

**Ejemplo resuelto:**

Luis cumplió 18 años y quiere votar.

1. Lleva su credencial para votar, que tramitó antes.
2. Va a su casilla, que es el lugar donde se vota.
3. Recibe una boleta, que es el papel con las opciones.
4. Marca su elección en privado.
5. Deposita la boleta en la urna.

**Lo importante:**

- Es ciudadana toda persona mexicana de 18 años o más.
- Participar va más allá de votar.
- El voto es libre, secreto y personal.

**Palabras nuevas:**

- **Ciudadano:** persona con derecho a participar en las decisiones del país.
- **Casilla:** el lugar donde se vota.
- **Boleta:** el papel donde se marca el voto.
- **Urna:** la caja donde se depositan las boletas.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('598148e3-c04f-58b2-9cef-52ae0cc83581', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 7, 'Convivencia pacífica y prevención de la violencia', 'Aprende a resolver conflictos sin violencia, a reconocer sus tipos y a pedir ayuda cuando la necesites.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás resolver un conflicto sin violencia y saber dónde pedir ayuda.

Rosa y su vecino discuten por un lugar para estacionarse. Las voces suben. Los dos están molestos.

**Conflicto y violencia**

Un conflicto es un desacuerdo entre personas. Es normal y se puede resolver hablando. La violencia es distinta. Es un daño que alguien causa a otra persona. Puede ser física, emocional, sexual, económica (te quitan o controlan tu dinero) o digital (amenazas o burlas por celular o redes). Ninguna es aceptable.

**Cómo prevenir la violencia**

- Respira y haz una pausa antes de responder.
- Escucha lo que la otra persona dice.
- Habla de lo que sientes sin ofender.
- Busca un acuerdo que sirva a los dos.
- Pide apoyo de alguien neutral.

**Ejemplo resuelto:**

Rosa y su vecino quieren resolver el conflicto del lugar.

1. Hacen una pausa y se calman.
2. Cada quien cuenta cómo ve el problema.
3. Proponen un acuerdo: se turnan el lugar.

**Si vives violencia**

No es tu culpa. Nadie merece que lo traten así. Puedes pedir ayuda:

- Si estás en peligro ahora, llama al 911.
- Si eres menor de edad, cuéntale a un adulto de confianza.
- Acude a tu centro de salud.
- Si necesitas hablar con alguien, llama a la Línea de la Vida: 800 911 2000. Es gratuita y atiende las 24 horas, todos los días.

**Lo importante:**

- Un conflicto se resuelve hablando; la violencia nunca.
- Pausa, escucha y acuerdo ayudan a convivir.
- Pedir ayuda es válido y no es tu culpa.

**Palabras nuevas:**

- **Conflicto:** un desacuerdo entre personas.
- **Violencia:** daño que una persona causa a otra.
- **Acuerdo:** una solución en la que las dos partes están de acuerdo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('fb5f8b51-3c2e-5ceb-8c5d-6bade874426a', 'f2e33029-3df3-5dd7-8375-f33bcf0dadc6', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Los derechos humanos:** Son lo que toda persona necesita para vivir con dignidad. Son universales e iguales. Tus derechos terminan donde empiezan los de otra persona.

**Semana 2 — La Constitución y los tres poderes:** La Constitución es la ley más importante del país. El Legislativo hace las leyes, el Ejecutivo las aplica y el Judicial resuelve conflictos.

**Semana 3 — Municipio, estado y federación:** Son los tres niveles de gobierno. El municipio atiende los servicios cercanos. México tiene 32 entidades.

**Semana 4 — Derechos de niñas, niños, adolescentes y personas mayores:** La niñez y las personas mayores tienen protección especial. Cuidarlos es tarea de la familia, la sociedad y el gobierno.

**Semana 5 — Igualdad y no discriminación:** Todas las personas tenemos los mismos derechos. Discriminar es tratar peor a alguien por una característica suya. Si te pasa, no es tu culpa.

**Semana 6 — Participación ciudadana y el voto:** Es ciudadana toda persona mexicana de 18 años o más. El voto es libre, secreto y personal.

**Semana 7 — Convivencia pacífica y prevención de la violencia:** Un conflicto se resuelve hablando. Si vives violencia, no es tu culpa. En peligro, llama al 911 o acude a tu centro de salud.

**Ejercicios de repaso:**

1. ¿Qué poder hace las leyes? El Legislativo, que lo forman diputados y senadores.
2. Se rompe una tubería de agua de tu colonia. ¿Quién la atiende? El municipio, porque el agua potable es un servicio local.
3. ¿A partir de qué edad se puede votar? A partir de los 18 años.
4. ¿Qué tres cualidades tiene el voto? Es libre, secreto y personal.
5. Dos vecinos discuten y las voces suben. ¿Qué pueden hacer? Hacer una pausa, escucharse y buscar un acuerdo.
6. ¿Quiénes son adolescentes? Las personas de 12 a 17 años.
7. A una persona le niegan un servicio por su religión. ¿Qué es eso? Discriminación. No es su culpa y puede pedir orientación.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('bd770a6a-4798-5979-929f-fab052c4849b', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 1, 'Mis habilidades y mi plan de vida', 'Descubre qué sabes hacer y escribe una meta con pasos claros para avanzar.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás nombrar tus habilidades y escribir un plan sencillo para una meta.

Luis arregla las bicicletas de sus vecinos. Nadie se lo enseñó en una escuela. Aprendió viendo y practicando. Si le preguntan qué sabe hacer, responde «nada especial». Pero sí sabe hacer algo muy útil.

**¿Qué es una habilidad?**

Una habilidad es algo que sabes hacer bien. Puede ser cocinar, cuidar a una persona, vender, manejar o arreglar cosas. También escuchar con atención es una habilidad.

Ser puntual o paciente es una actitud. Una actitud es la forma en que te comportas. Las actitudes también cuentan cuando alguien te conoce.

**¿Qué es un plan de vida?**

Un plan de vida dice qué quieres lograr y cómo vas a avanzar. Empieza con una meta. Una meta es algo que quieres conseguir. Sirve más si es clara y posible.

Después escribes pasos pequeños. Cada paso debe ser algo que puedas hacer pronto.

**Ejemplo resuelto:**

Luis escribe su plan.

1. Mis habilidades: arreglar bicicletas y tratar bien a la gente.
2. Mi meta: tener un lugar fijo para trabajar.
3. Primer paso: anotar qué herramientas tengo y cuáles me faltan.
4. Segundo paso: preguntar a otros talleres cómo organizan su trabajo.
5. Posible obstáculo: me falta espacio. Idea: pedir ayuda a un familiar de confianza.
6. Revisar el plan de vez en cuando y cambiarlo si hace falta.

**Lo importante:**

- Todas las personas tienen habilidades, aunque no las hayan aprendido en una escuela.
- Una meta clara se divide en pasos pequeños.
- Estudiar también puede ser una meta.
- Un plan se puede cambiar cuando cambia tu vida.

**Palabras nuevas:**

- **Habilidad:** algo que sabes hacer bien.
- **Actitud:** la forma en que te comportas ante las cosas.
- **Meta:** algo que quieres lograr.
- **Obstáculo:** algo que te estorba para avanzar.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('9448c90e-f6d5-55c3-92e6-b22cb633500f', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 2, 'Buscar empleo: currículum y solicitud', 'Aprende a armar un currículum sencillo y a llenar una solicitud de empleo con datos verdaderos.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás armar un currículum sencillo y llenar una solicitud de empleo.

Rosa ve un letrero en una tienda: «Se solicita ayudante». Quiere presentarse, pero no sabe qué decir de ella. Necesita una hoja que cuente quién es y qué sabe hacer.

**¿Qué es un currículum?**

Un currículum es una hoja corta que presenta tu historia de trabajo y de estudio. Quien contrata la lee rápido. Por eso debe ser clara, ordenada y verdadera. Nunca pongas datos falsos.

**¿Qué es una solicitud de empleo?**

Es un formato que te da la empresa. Lo llenas con letra clara. Pide datos parecidos a los del currículum. Lee cada pregunta antes de responder.

**Cuidado con las ofertas falsas:**

Desconfía si te piden dinero por adelantado. Desconfía también si te piden tu contraseña, tu NIP o claves del banco. Un empleo real no te cobra por darte el trabajo.

**Si eres menor de edad:**

En México, los menores de 15 años no pueden trabajar. Entre 15 y 17 años hay reglas estrictas. Habla con un adulto de confianza.

**Ejemplo resuelto:**

Así arma Rosa su currículum.

1. Datos: su nombre, su teléfono y un correo.
2. Objetivo, en una línea: «Busco trabajo como ayudante en una tienda».
3. Experiencia: «Atendí un puesto de verduras en el mercado».
4. Estudios: lo que ha cursado hasta ahora.
5. Habilidades: trato amable y buena memoria para los precios.
6. Revisión: lee todo en voz alta y corrige las faltas.

**Lo importante:**

- El currículum cuenta quién eres, con datos verdaderos.
- La solicitud se llena con letra clara y completa.
- Ningún trabajo serio pide dinero para contratarte.

**Palabras nuevas:**

- **Currículum:** hoja que resume tus estudios, tu experiencia y tus habilidades.
- **Solicitud de empleo:** formato que llenas para pedir un trabajo.
- **Experiencia:** lo que ya has hecho en otros trabajos o actividades.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('61c35b55-39a7-5057-94f3-5150159b3bde', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 3, 'Derechos laborales: contrato, salario y seguridad social', 'Conoce qué es un contrato de trabajo, el salario y la seguridad social, y qué conviene preguntar.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás explicar qué son el contrato, el salario y la seguridad social.

Luis consigue un trabajo en una bodega. Le dicen: «Empiezas mañana, ya luego vemos los detalles». Luis se pregunta cuánto le pagarán.

**¿Qué es un contrato?**

Un contrato de trabajo es un acuerdo entre quien trabaja y quien contrata. Debe ser por escrito. Pide siempre una copia y guárdala.

**¿Qué es el salario?**

El salario es el pago por tu trabajo. Tienes derecho a que te paguen lo acordado y a tiempo. Debe estar claro cuánto te pagan y cada cuándo. En México existe un salario mínimo, que cambia con el tiempo. Pide el dato de hoy: pregunta en la oficina del trabajo o en la página del gobierno.

**¿Qué es la seguridad social?**

Es la protección que te da el trabajo con contrato y registro en el IMSS. Incluye atención médica y ayuda si te enfermas o te lastimas. El IMSS, la institución del seguro social, es una de las que la da. Para saber qué te toca, pregunta en la oficina del trabajo.

**Si eres menor de edad:**

En México, los menores de 15 años no pueden trabajar. Entre 15 y 17 años hay reglas estrictas. Habla con un adulto de confianza.

**Ejemplo resuelto:**

Antes de aceptar, Luis revisa su contrato.

1. Busca el nombre de quien contrata y su propio nombre.
2. Lee el puesto y qué trabajo hará.
3. Revisa el salario y cada cuándo se paga.
4. Lee el horario.
5. Pregunta: ¿me inscribirán en el IMSS?
6. Pide una copia firmada.

**Lo importante:**

- Pide el contrato por escrito y guarda tu copia.
- La seguridad social protege tu salud.
- Para cifras y requisitos, pide el dato de hoy en la oficina del trabajo o en la página del gobierno.

**Palabras nuevas:**

- **Contrato:** acuerdo escrito entre quien trabaja y quien contrata.
- **Salario:** dinero que recibes por tu trabajo.
- **Seguridad social:** protección de salud y apoyo que da el trabajo con contrato y registro en el IMSS.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('8b563749-b0fb-5cf8-9647-dcce41e80ca9', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 4, 'Trabajo en equipo y comunicación', 'Aprende a escuchar, dar mensajes claros y llegar a acuerdos cuando trabajas con otras personas.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás comunicarte con claridad y llegar a acuerdos en un equipo.

Rosa y dos vecinos atienden un puesto en el tianguis. Dos de ellos quieren abrir temprano. El tercero prefiere cerrar tarde. Si no hablan, cada quien hace lo que quiere y el puesto se desordena.

**¿Qué es un equipo?**

Un equipo es un grupo de personas que trabaja por un mismo fin. Cada una hace una parte. Todas dependen de las demás. Si una falla, el trabajo de todas se atrasa.

**¿Cómo comunicarte bien?**

- Escucha sin interrumpir.
- Habla con frases cortas y claras.
- Pregunta si no entendiste.
- Repite con tus palabras lo que te dijeron.

Un mensaje claro dice qué hay que hacer, quién lo hace y para cuándo.

**¿Qué haces si hay un desacuerdo?**

Un desacuerdo es normal. No significa que alguien sea malo. Se resuelve hablando con respeto, sin gritos y sin culpar.

**Ejemplo resuelto:**

Rosa y sus vecinos resuelven el desacuerdo.

1. Cada uno explica lo que quiere y por qué.
2. Los demás escuchan sin interrumpir.
3. Buscan lo que tienen en común: todos quieren vender más.
4. Proponen un acuerdo: abrir a la misma hora y turnarse para cerrar.
5. Lo anotan en una hoja.
6. Después revisan si el acuerdo funciona.

**Lo importante:**

- Un equipo funciona cuando cada quien cumple su parte.
- Escuchar es tan importante como hablar.
- Los acuerdos se anotan y se revisan.

**Palabras nuevas:**

- **Equipo:** grupo de personas que trabaja por un mismo fin.
- **Acuerdo:** decisión que todas las personas aceptan.
- **Desacuerdo:** cuando las personas piensan distinto sobre algo.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('c62fae2b-35da-5aab-b0a0-5668ac3fafa7', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 5, 'Ideas de negocio', 'Aprende a encontrar una necesidad de tu comunidad y a revisar si una idea de negocio es posible.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás revisar con preguntas sencillas si una idea de negocio es posible.

Doña Carmen nota que en su calle nadie vende desayunos para quienes salen temprano a trabajar. Piensa que podría preparar algo. Antes de gastar, quiere saber si la idea es buena.

**¿Qué es un negocio?**

Un negocio es una actividad donde ofreces un producto o un servicio a cambio de dinero. Un producto es algo que se puede tocar, como una gelatina. Un servicio es una ayuda, como cortar el cabello.

**¿De dónde salen las ideas?**

Salen de lo que ves a tu alrededor. Piensa en algo que la gente necesita y no encuentra cerca. También puedes partir de lo que sabes hacer, como en la semana 1.

**¿Cómo revisas una idea?**

- ¿Qué necesidad resuelve?
- ¿Quién lo compraría?
- ¿Qué sé hacer para ofrecerlo?
- ¿Qué necesito comprar para empezar?
- ¿Quién más ya lo vende cerca?

**Ejemplo resuelto:**

Doña Carmen revisa su idea de vender desayunos.

1. Necesidad: gente que sale temprano y no alcanza a desayunar.
2. Clientes: vecinos y personas que pasan por la calle.
3. Lo que sabe hacer: cocinar guisados.
4. Lo que necesita: una mesa, ollas y los ingredientes.
5. Competencia: pregunta qué venden ya otras personas cerca.
6. Decisión: prueba con pocas porciones antes de gastar mucho.

**Lo importante:**

- Una buena idea resuelve una necesidad real.
- Pregunta a posibles clientes antes de gastar.
- Ningún negocio tiene el éxito asegurado. Por eso conviene empezar poco a poco.
- Si eres menor de 15 años, esto es solo para aprender: la ley no permite que trabajes.

**Palabras nuevas:**

- **Negocio:** actividad donde ofreces algo a cambio de dinero.
- **Producto:** algo que se puede tocar y vender.
- **Servicio:** ayuda que das a otra persona a cambio de un pago.
- **Competencia:** otras personas que venden lo mismo cerca de ti.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('50d0f0a2-f5af-58d3-b0b5-9f0bfe28e50e', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 6, 'Costos, precio y ganancia', 'Aprende a sumar tus costos, poner un precio y calcular cuánto te queda con cada venta.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás sumar los costos de un producto, fijar su precio y calcular la ganancia.

Rosa prepara 20 gelatinas para vender en su colonia. Compra leche y azúcar. También paga el gas y las bolsas. Antes de poner un precio, quiere saber cuánto le costó todo.

**¿Qué es el costo?**

El costo es todo el dinero que gastas para hacer tu producto. Incluye lo que compras y lo que pagas por el gas o las bolsas. Si olvidas un gasto, la cuenta sale mal.

**¿Qué son el precio y la ganancia?**

El precio es lo que cobras al cliente. La ganancia es lo que te queda después de pagar los costos. Si cobras menos de lo que gastaste, hay pérdida: pierdes dinero.

**Ejemplo resuelto:**

Los gastos de Rosa son: leche $120, azúcar $45, gas y bolsas $35. Estos precios son inventados, solo para practicar.

1. Suma los costos: 120 + 45 + 35 = 200. El costo total es $200.
2. Divide entre las piezas: 200 ÷ 20 = 10. Cada gelatina cuesta $10.
3. Rosa pone un precio de $15. Ganancia por pieza: 15 − 10 = 5. Son $5.
4. Si vende las 20: 20 × 15 = 300. Cobra $300. Su ganancia es 300 − 200 = 100.
5. Si vende solo 16: 16 × 15 = 240. Su ganancia es 240 − 200 = 40.

Con menos ventas, la ganancia baja.

**Lo importante:**

- Suma todos los costos antes de poner un precio.
- El precio debe ser mayor que el costo de cada pieza.
- Si vendes menos piezas, ganas menos.
- Los precios cambian: revisa los tuyos con frecuencia.

**Palabras nuevas:**

- **Costo:** dinero que gastas para hacer o conseguir tu producto.
- **Precio:** dinero que cobras al cliente.
- **Ganancia:** dinero que te queda después de pagar los costos.
- **Pérdida:** cuando gastas más de lo que cobras.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('93a9c813-7352-5b80-9213-e629d318c160', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 7, 'Vender y atender clientes', 'Aprende a saludar, informar el precio, cobrar, dar cambio y atender una queja con respeto.', NULL, 60, '**Objetivo:** Al terminar esta semana podrás atender a un cliente, cobrar con claridad y dar el cambio correcto.

Luis entra a una papelería a comprar cuadernos. La persona que atiende lo saluda, lo escucha y le dice el precio. Luis se siente cómodo. Vuelve a comprar ahí.

**¿Qué es atender bien a un cliente?**

Un cliente es la persona que compra tu producto o servicio. Atenderla bien es tratarla con respeto. Tu actitud pesa tanto como el producto.

**Pasos de una buena venta:**

1. Saluda con amabilidad.
2. Escucha lo que necesita.
3. Explica qué ofreces y di el precio con claridad.
4. Cobra y cuenta el dinero a la vista.
5. Da el cambio y dale las gracias.

**¿Y si hay una queja?**

Una queja es cuando el cliente no queda conforme. Escúchalo sin discutir. Pide disculpas si hubo un error. Ofrece una solución justa.

**Ejemplo resuelto:**

Una clienta compra 3 gelatinas de $15 y paga con un billete de $50.

1. Calcula lo que debe pagar: 3 × 15 = 45. Son $45.
2. Recibe el billete y dice en voz alta: «Me paga con $50».
3. Calcula el cambio: 50 − 45 = 5. Le da $5.
4. Cuenta el cambio frente a ella.
5. Se despide con amabilidad.

**Lo importante:**

- Un cliente bien tratado suele volver.
- Di el precio con claridad y cuenta el cambio a la vista.
- Ante una queja, escucha primero.

**Palabras nuevas:**

- **Cliente:** persona que compra un producto o servicio.
- **Cambio:** dinero que regresas cuando te pagan con más de lo que cuesta.
- **Queja:** aviso de que algo no quedó bien.', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.semanas (id, mes_id, numero_semana, titulo, descripcion, video_url, tiempo_estimado_minutos, contenido, video_url_2, video_url_3) VALUES ('e478f71f-a6cb-50da-8a3b-c8cf65cc9be8', '0e86d4ba-f7bf-5616-b479-8aafba99a83e', 8, 'Repaso general y preparación para examen final', 'Repasa lo más importante de cada semana y practica con ejercicios antes del examen final.', NULL, 60, 'Esta semana repasas lo que viste en la materia. Lee cada apartado y luego resuelve los ejercicios.

**Semana 1 — Mis habilidades y mi plan de vida:** Una habilidad es algo que sabes hacer bien. Una meta se divide en pasos pequeños. Un plan se puede cambiar.

**Semana 2 — Buscar empleo:** El currículum cuenta quién eres, con datos verdaderos. La solicitud se llena con letra clara. Desconfía de quien pide dinero para darte trabajo.

**Semana 3 — Derechos laborales:** Pide el contrato por escrito. Revisa el salario y el horario. La seguridad social protege tu salud. Para cifras, pide el dato de hoy en la oficina del trabajo o en la página del gobierno.

**Semana 4 — Trabajo en equipo:** Escucha, habla con claridad y anota los acuerdos. Un desacuerdo se resuelve con respeto.

**Semana 5 — Ideas de negocio:** Una buena idea resuelve una necesidad real. Revisa quién compraría y qué necesitas. Ningún negocio tiene el éxito asegurado.

**Semana 6 — Costos, precio y ganancia:** Suma todos los costos. Divide entre las piezas. La ganancia es el precio menos el costo.

**Semana 7 — Vender y atender clientes:** Saluda, escucha, di el precio y da el cambio a la vista.

**Ejercicios de repaso:**

1. Los gastos de un puesto son $90, $60 y $50. 90 + 60 + 50 = 200. El costo total es $200.
2. Esos $200 se reparten en 20 piezas. 200 ÷ 20 = 10. Cada pieza cuesta $10.
3. Cada pieza se vende en $15. 15 − 10 = 5. La ganancia por pieza es $5.
4. Se venden 16 piezas a $15. 16 × 15 = 240. Cobras $240.
5. Un cliente paga $100 por una compra de $65. 100 − 65 = 35. Le das $35 de cambio.

Si eres menor de 15 años, esto es solo para aprender: la ley no permite que trabajes.

Antes del examen, vuelve a leer las partes que te costaron más trabajo.', NULL, NULL) ON CONFLICT DO NOTHING;

INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('a8a740e9-b618-55be-acc9-4772a12d766c', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', NULL, 'Examen Final — Lectura y comprensión I', 'Examen final de la materia Lectura y comprensión I. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('4fa81cbe-87cc-583a-a142-47860ffe82a6', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', NULL, 'Examen Final — Números y operaciones I', 'Examen final de la materia Números y operaciones I. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', NULL, 'Examen Final — Salud y cuidado personal', 'Examen final de la materia Salud y cuidado personal. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('88b9aacb-ff33-55a2-beee-1dc59b2311a1', 'ad8652d6-df38-57f8-8149-eba7c766532c', NULL, 'Examen Final — Escritura I', 'Examen final de la materia Escritura I. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', '4f739387-4313-5b07-847a-98c9e2dbe9c6', NULL, 'Examen Final — Números y operaciones II', 'Examen final de la materia Números y operaciones II. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '5cb0f9bc-8801-52fe-b909-707966d42435', NULL, 'Examen Final — Tecnología y vida digital', 'Examen final de la materia Tecnología y vida digital. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', NULL, 'Examen Final — Lectura y comprensión II', 'Examen final de la materia Lectura y comprensión II. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('9813b736-cf64-5cf2-8d68-1815106b1b8e', 'd86645e5-326f-553b-8586-7199b6e3e75b', NULL, 'Examen Final — Fracciones y decimales', 'Examen final de la materia Fracciones y decimales. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('40c17849-377b-5207-9b48-828def6401b6', '2084297c-54dc-5483-935c-275357b40b53', NULL, 'Examen Final — Ciencias naturales y medio ambiente', 'Examen final de la materia Ciencias naturales y medio ambiente. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('3c1b1cb0-4502-5425-b176-61a7205d30da', '55da446c-3b60-50cd-8e41-db9deafb1109', NULL, 'Examen Final — Escritura II', 'Examen final de la materia Escritura II. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('5ee6ffe6-a8e6-50de-beee-933b56303998', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', NULL, 'Examen Final — Figuras y medidas', 'Examen final de la materia Figuras y medidas. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('68907162-44f4-5b98-a881-ce73c6b3bfd7', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', NULL, 'Examen Final — Historia de México', 'Examen final de la materia Historia de México. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('d9f69973-5df7-5547-9611-5a24c95b8d52', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', NULL, 'Examen Final — Comunicación oral y documentos personales', 'Examen final de la materia Comunicación oral y documentos personales. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'dd65a559-31b8-5ec2-9574-5b28222860ab', NULL, 'Examen Final — Cuentas útiles: dinero y economía familiar', 'Examen final de la materia Cuentas útiles: dinero y economía familiar. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('9f630342-0af7-5a66-abb8-5793c6ed644f', 'f7644c3f-af6d-512c-99f3-1427e053077b', NULL, 'Examen Final — Geografía de México y mi comunidad', 'Examen final de la materia Geografía de México y mi comunidad. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', NULL, 'Examen Final — Información y gráficas', 'Examen final de la materia Información y gráficas. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', '518e09bc-0345-519b-a865-e8d367fe69d0', NULL, 'Examen Final — Derechos, ciudadanía y convivencia', 'Examen final de la materia Derechos, ciudadanía y convivencia. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;
INSERT INTO public.evaluaciones (id, materia_id, mes_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, activa) VALUES ('757c6feb-65a9-5c15-b712-2e88f0bf1d6b', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', NULL, 'Examen Final — Trabajo y emprendimiento', 'Examen final de la materia Trabajo y emprendimiento. Tienes 60 minutos y 3 intentos para aprobar.', 60, 3, true) ON CONFLICT DO NOTHING;

INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('202e976d-2ccd-528e-9a37-bd188cc04e82', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Una etiqueta de arroz dice: «Arroz 500 g. Caduca 20/08». ¿Qué dato da «500 g»?', 'Quién lo vendió', 'Cuánto trae el paquete', 'Cuánto cuesta el paquete', 'Hasta cuándo sirve el arroz', 'b', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('4ee63441-70da-501e-af03-9ff984c374bb', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Luis separa la palabra «medicina» juntando cada consonante con su vocal. ¿Cuántas sílabas tiene?', 'Dos', 'Cuatro', 'Tres', 'Cinco', 'b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3f8db6d6-97aa-52e1-b4e8-76295ad74d7d', 'a8a740e9-b618-55be-acc9-4772a12d766c', '¿Qué pasa con un texto si le quitas su idea principal?', 'El texto queda más corto, pero dice lo mismo', 'El texto se entiende mejor', 'Ya no se entiende de qué trata', 'El texto solo pierde detalles', 'c', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('6db46eb0-d1b2-5053-8086-9cf70e093c38', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Texto: «Don Raúl vende frutas en su triciclo. Pasa a las diez. Cobra $20 el kilo de plátano». ¿Cuál es la idea principal?', 'Don Raúl cobra $20 el kilo de plátano', 'Don Raúl pasa por la calle a las diez', 'Don Raúl vende solo plátanos baratos', 'Don Raúl vende frutas en su triciclo', 'd', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f51a558e-e496-5ab3-9de3-169bd4b03ef9', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Noticia: «El viernes, una panadería regaló 200 bolillos a un comedor. Quiso ayudar a las familias del barrio». ¿Por qué ocurrió?', 'Para vender más pan el viernes', 'Para pagar una deuda de la panadería', 'Para ayudar a las familias del barrio', 'Para celebrar el aniversario del comedor', 'c', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('fbafbd6e-3e10-5214-963d-2f01a9b768fb', 'a8a740e9-b618-55be-acc9-4772a12d766c', '¿Qué cuatro preguntas responde un aviso?', 'Qué es, cuánto trae, cuándo caduca y dónde', 'Quién, cómo, por qué y para quién', 'Qué pasó, quién, cuándo y por qué', 'Qué pasa, dónde, cuándo y qué debo hacer', 'd', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('8f4e959b-be54-51d9-9b5f-8c95b3587e3f', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Historia: «Marta iba al trabajo en su bici. Se ponchó una llanta. Un señor la ayudó y Marta llegó a tiempo». ¿Cuál es el inicio?', 'Marta iba al trabajo en su bici', 'Un señor ayudó a Marta con la llanta', 'Marta llegó a tiempo a su trabajo', 'Se ponchó una llanta en la calle', 'a', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('4be06886-1471-5c83-9cdd-c7017c09d7f4', 'a8a740e9-b618-55be-acc9-4772a12d766c', '¿Qué es una leyenda?', 'Una historia antigua que se cuenta de boca en boca', 'Un hecho de la vida diaria que una persona cuenta', 'Un mensaje corto que se deja para otra persona', 'Un texto que da datos reales sobre un hecho', 'a', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('c0984891-3c8c-5572-ab55-b91a4de85a90', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Para buscar «mesa» en el diccionario, ¿qué letra miras primero?', 'La s', 'La a', 'La m', 'La e', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3be9e5e7-e8dd-5896-b87d-2a84f4bbc3a9', 'a8a740e9-b618-55be-acc9-4772a12d766c', 'Doña Carmen ya leyó toda la instrucción y juntó los materiales. ¿Qué sigue?', 'Hacer primero el paso más fácil', 'Hacer dos pasos juntos para ahorrar tiempo', 'Empezar por el último paso', 'Hacer un paso a la vez, en orden', 'd', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('4817d4d3-8ce0-5d0e-8d8d-1db51805ed84', '4fa81cbe-87cc-583a-a142-47860ffe82a6', '¿Cómo se lee el número 4,300,000?', '43 millones', '430 mil', '4 millones 300 mil', '40 millones 300 mil', 'c', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('7810fdba-4408-5bf5-938f-4b24725ccbcf', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'En el número 52,704, ¿en qué lugar está el 5?', 'Centenas', 'Decenas de millar', 'Unidades de millar', 'Centenas de millar', 'b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('90e9fe1a-e8a7-5bf3-adae-99e26f2335e8', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Una tienda vende $5,468 y otra vende $3,795. ¿Cuánto vendieron entre las dos?', '$8,153', '$9,253', '$9,163', '$9,263', 'd', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('8cdf31f4-e5c1-541e-a90b-2d55e40120c6', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Resta 8,432 − 3,675.', '5,243', '4,767', '4,757', '4,857', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('cb945e11-82cf-5811-9204-aedd60e11bf5', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Ana tiene $2,800. Recibe $600 por un trabajo y paga una renta de $1,950. ¿Cuánto le queda?', '$850', '$250', '$5,350', '$1,450', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0cc99636-4e61-5b19-8b04-9667995f2e8a', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Marta compra frutas de $145 y verdura de $68. Paga con $500. ¿Cuánto cambio le dan?', '$287', '$713', '$297', '$213', 'a', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b9e99f58-e7b7-5350-acc7-0a7447e28c8f', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Rosa compara los precios $6,780; $6,708; $6,087 y $6,870. ¿Cuál es el más barato?', '$6,870', '$6,087', '$6,708', '$6,780', 'b', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('5c5dec62-fb17-5fb4-bb33-13f91995bded', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Redondea 8,376 a la decena.', '8,380', '8,370', '8,400', '8,300', 'a', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('7bbbb168-a2d3-5539-a81e-25e2516d2c0c', '4fa81cbe-87cc-583a-a142-47860ffe82a6', '¿Qué número es XXXIV?', '34', '44', '36', '26', 'a', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ec76fe01-609a-5a48-bb95-cacdd30cbb52', '4fa81cbe-87cc-583a-a142-47860ffe82a6', 'Un camión sale a las 6:40 y llega a las 8:15. ¿Cuánto dura el viaje?', '75 minutos', '115 minutos', '95 minutos', '85 minutos', 'c', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f28fb4f9-fe4a-5c84-87cd-ba1a514b5134', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Qué aparato limpia la sangre y saca el agua que sobra?', 'El sistema circulatorio', 'El aparato urinario', 'El aparato digestivo', 'El aparato respiratorio', 'b', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('92a7425c-73e1-53ff-aba9-c52f900a05bb', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Cuál de estas comidas lleva los tres grupos del Plato del Bien Comer?', 'Jitomate, nopales y plátano', 'Café con pan', 'Tortillas, frijoles y una naranja', 'Tortillas, arroz y avena', 'c', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('20f68139-f0e8-5c68-9ce7-b4bc67e22b3a', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Cuándo debes lavarte las manos?', 'Antes de ponerte los zapatos', 'Después de peinarte para salir', 'Después de ver un rato la televisión', 'Después de tocar basura o animales', 'd', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('eeb5e9e0-f3f4-50bc-80b1-524da56a168f', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Qué haces con la carne para cuidar tus alimentos?', 'Cocinarla bien', 'Dejarla fuera todo el día', 'Guardarla sin tapar', 'Comerla apenas cocida', 'a', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('035b4d15-27ee-5302-aaef-23274611500f', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Qué hace el centro de salud cuando tu caso necesita más atención?', 'Te pide volver el mes siguiente', 'Te manda a un hospital', 'Te da otra cartilla de vacunas', 'Te pide esperar a que se te pase', 'b', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('4a10fe9f-c3a3-5581-8a36-0aca064926b4', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', 'Tristeza, enojo y miedo. ¿Qué tipo de emociones son?', 'Emociones que solo sienten los adultos', 'Emociones que hay que esconder', 'Emociones que desaparecen si no piensas en ellas', 'Emociones normales', 'd', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('46c6a66d-78f9-5da5-9677-9a239f3f9816', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', 'Si la angustia dura mucho, ¿a dónde puedes llamar gratis y a cualquier hora?', 'A la Línea de la Vida: 800 911 2000', 'A la escuela más cercana', 'A la oficina del trabajo', 'A una tienda de tu colonia', 'a', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('738f6aef-6458-5ee8-8526-b7a282e77cac', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', 'Si te ofrecen alcohol y no quieres tomar, ¿cómo conviene responder?', 'Con un reclamo por la invitación', 'Con un «Quizás después»', 'Con un «No, gracias» dicho con calma', 'Con una explicación muy larga', 'c', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('957e2adc-bc81-501b-8f5f-9b3151c0b54c', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Qué haces para detener el sangrado de una herida?', 'Echarle un remedio casero encima', 'Dejar la herida al aire libre', 'Presionar con una tela limpia', 'Quitar la tela apenas se empape', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f0ec4149-4ffd-5192-aaae-16dc80dfccdb', '0e74ee69-1e2c-5022-ba2a-adbf0255d7e1', '¿Qué son los primeros auxilios?', 'Medicinas que sirven para cualquier accidente', 'Un tratamiento que sustituye al médico', 'Acciones que se hacen después de la consulta', 'Acciones básicas mientras llega ayuda médica', 'd', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('419a5e37-061c-541c-a333-f670de77e2f7', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', '¿Para qué sirve el punto y coma?', 'Para empezar un texto nuevo', 'Para unir dos ideas que se relacionan', 'Para separar los elementos de una lista', 'Para cerrar una oración por completo', 'b', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('6403f932-293d-5aae-9d51-0073f8395028', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', '¿Cuál lista está escrita correctamente?', 'Compro pan, leche, y huevos.', 'Compro pan leche y huevos.', 'Compro, pan, leche y huevos.', 'Compro pan, leche y huevos.', 'd', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('14252212-2db2-5a1e-95ad-7e3d6dda6fed', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', 'En la oración «Rosa es alta», ¿cuál es el predicado?', 'alta', 'es alta', 'Rosa', 'Rosa es', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f93b7ea8-a37b-5f67-86ab-0d8cc4d65974', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', 'En «Luis compra pan fresco», ¿cuál palabra es el verbo?', 'compra', 'pan', 'fresco', 'Luis', 'a', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b0a9f836-519a-57b5-b6bb-476cd036d88a', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', 'Rosa deja este recado: «Luis: Salí al mercado y regreso a las 3. Los frijoles están en la estufa.» ¿Qué le falta?', 'El nombre de quien lo recibe', 'La hora', 'El mensaje', 'La firma', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('05483440-140a-5542-aec7-253d8fcd9929', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', 'Rosa quiere decir que va a tomar lo que Luis le manda. ¿Cuál verbo se escribe bien?', 'resibir', 'recivir', 'recibir', 'resivir', 'c', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('64dccf0a-6701-51b5-9385-df4d4249252c', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', 'Los camiones se detienen en la «esta…» de la ciudad. Esa palabra es de la familia de «estar». ¿Cómo se escribe?', 'estasión', 'estazión', 'estación', 'estatión', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3d9b182c-3dfe-5d7a-8f3f-e77ba6cc76a3', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', '¿Cuál de estas palabras es aguda?', 'música', 'papel', 'mesa', 'árbol', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('28a3027a-b273-5d64-8638-dfd0e00bdcd1', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', '¿Por qué la palabra «lápiz» lleva tilde?', 'Es aguda y termina en la letra z', 'Es esdrújula y todas llevan tilde', 'Es grave y no termina en n, s ni vocal', 'Es aguda y termina en n, s o vocal', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('e589fa27-fc75-573d-b463-084ae5946dd4', '88b9aacb-ff33-55a2-beee-1dc59b2311a1', '¿Qué hace el cierre de un párrafo?', 'Termina el tema con una última oración', 'Da datos sobre la idea principal', 'Dice de qué trata el párrafo', 'Une dos ideas con una pausa larga', 'a', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('a18f64f3-bca4-548a-b3f6-e1e022ed0b0f', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', 'En 6 × 9 = 54, ¿cuál número es el producto?', '9', '6', '54', '15', 'c', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f46f85ca-a9e0-588f-96e7-84560980e9eb', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', '¿Cuánto es 26 × 14?', '260', '364', '104', '354', 'b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('efb14327-9d2f-592f-a7a9-fa635d5853ba', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', 'Tienes 72 panes y haces bolsas de 8 panes. ¿Cuántas bolsas salen?', '64', '9', '80', '576', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ad3f959a-05b2-57d4-baee-50ee5ea0ed86', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', 'Al dividir entre 7, ¿cuál de estos residuos es posible?', '10', '8', '7', '6', 'd', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3176e54a-d3da-590e-9104-5f4dbd4db8e5', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', 'Rosa tiene 40 huevos y llena cajas de 6. ¿Cuántas cajas llenas hace?', '6', '34', '7', '4', 'a', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('17c9b9e7-5951-557e-9959-c150db428f2c', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', 'Cuatro amigos comparten una renta de $2,400 en partes iguales. ¿Cuánto paga cada uno?', '$800', '$9,600', '$2,396', '$600', 'd', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('2458b221-d270-5ec3-ae18-fba335cbd947', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', 'Pedro ahorra $90 cada semana durante 5 semanas. Quiere una bicicleta de $600. ¿Cuánto le falta?', '$150', '$690', '$510', '$450', 'a', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('6a728e41-818f-5c3c-b403-e5765e56f69b', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', '¿Cuál de estos números es divisor de 18?', '4', '5', '6', '7', 'c', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('73b0ed0e-126c-5611-be53-173414f0da69', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', '¿Cuánto da 12 + 2 × 18?', '30', '252', '48', '36', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('c9f7153b-1e1b-5502-b383-3d8d026368c1', 'bad4ea06-2d3e-51e4-a9a8-22185fcb61c0', '¿Cuánto da (8 + 2) × 5?', '10', '50', '40', '18', 'b', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('4075f211-956f-5670-81c9-d4891dd4e6a7', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '¿Qué pieza guarda tus archivos?', 'El teclado', 'El procesador', 'La pantalla', 'El disco', 'd', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ba128127-43a9-505e-8ff8-c0d4d6d67aa2', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', 'Rosa ve un resultado con la marca «anuncio». ¿Qué debe saber?', 'Que es la respuesta más confiable', 'Que lo escribió un amigo', 'Que lo publicó una institución', 'Que quiere venderle algo', 'd', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('066bea1e-81c6-5cc4-8165-b3ce0248df85', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', 'Además de comparar páginas, ¿qué revisa Rosa para confiar en una información?', 'Cuántas fotos tiene', 'Quién la publicó y cuándo', 'Si el título tiene signos de exclamación', 'Si aparece primero en la lista', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('edd4af69-6aef-5085-b3e6-f407ddab9391', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '¿Qué debe decir el asunto de un correo?', 'Cuál es el servicio de correo', 'A quién va dirigido', 'De qué trata el mensaje', 'Qué saludo lleva el texto', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('13094d45-9af6-5112-8586-49977d679795', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', 'Luis quiere confirmar que una página de trámites es oficial. ¿Qué hace?', 'Pregunta la dirección en la ventanilla', 'Confía si el diseño parece oficial', 'Usa el primer anuncio del buscador', 'Entra desde un mensaje que le llegó', 'a', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('86b56e30-20fc-541c-9904-1d7b66a36bdd', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '¿Dónde revisa Luis los requisitos actuales de un trámite?', 'En lo que recuerda del año pasado', 'En un mensaje que le llegó', 'En un anuncio del buscador', 'En el sitio oficial', 'd', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('bedc3e1e-2a7a-5780-917c-b29f5c940454', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '¿Qué es la verificación en dos pasos?', 'Un aviso del banco con un enlace', 'Una segunda contraseña igual a la primera', 'Un código extra que llega a tu celular', 'Una copia de tu contraseña en papel', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('46045a8e-6810-5a1d-9f97-a82dd4837018', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '¿Cuál de estas es una señal de alerta de un fraude digital?', 'Pide el nombre completo del usuario', 'Promete premios que no pediste', 'Tiene un logotipo', 'Llega por la mañana', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('03c4c80e-355b-597e-9791-e1a239aafd3e', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', 'A Luis le llega una noticia sorprendente. ¿Qué hace antes de compartirla?', 'Busca la misma en otra fuente', 'Le pregunta a un desconocido en el chat', 'Cree la versión que tenga más fotos', 'La comparte para avisar pronto', 'a', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('8debda8d-f9e5-568a-824a-76bcb1038f32', 'dde64f17-1ae0-55fe-96e1-c90ef4ad78ba', '¿Qué sirve para avisarte antes de una cita?', 'Una ruta del mapa', 'Una carpeta con nombre', 'Un recordatorio', 'Un respaldo en la nube', 'c', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('12147fa2-ab05-5cf3-84bb-3a477f9ae3b8', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Un papel dice: «Ayer a las 6 hubo un apagón en tres colonias. La luz volvió a las 9». ¿Qué tipo de texto es?', 'Publicitario, porque quiere vender', 'Informativo, porque da datos reales', 'Instructivo, porque explica pasos', 'Narrativo, porque cuenta una historia', 'b', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b50a189d-97d3-5e00-bf7c-0ecdd5f97e7e', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Don Juan dice: «Todos saben que ese taller es el más caro». ¿Por qué es una opinión?', 'Porque juzga y no se puede comprobar', 'Porque tiene números y fechas', 'Porque lo dijo una sola persona', 'Porque habla de un taller real', 'a', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('fa8f982f-653f-517a-bacd-c2711b370d2b', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Texto: «Rosa abre el frasco de café y está vacío. En la mesa hay una taza sucia y todavía tibia». ¿Qué puedes inferir?', 'Que la taza es de un invitado nuevo', 'Que el café se acabó hace un mes', 'Que Rosa dejó el café en la tienda', 'Que alguien se tomó el café hace poco', 'd', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('90ff4608-76d4-59e9-9e2d-9ec2ca036bdc', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Texto: «Ana llega a la oficina con bufanda y las manos rojas de frío. Se frota los brazos y pide un café caliente». ¿Qué puedes inferir?', 'Que Ana tenía mucha prisa', 'Que Ana estaba enferma ese día', 'Que afuera hacía mucho frío', 'Que en la oficina hacía calor', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ecf5ec47-7d54-573f-bfab-0c5027e7690d', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Antes de firmar un contrato, ¿qué conviene hacer?', 'Leerlo todo y guardar tu copia', 'Pedir la copia solo si hay problemas', 'Firmar rápido y leerlo después', 'Leer solo la parte del pago', 'a', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('6224d190-9cbc-5f18-8535-9826ba8a1c6e', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'El refrán «Al que madruga, Dios lo ayuda» quiere decir:', 'Que hay que levantarse antes de que salga el sol', 'Que poner esfuerzo trae buenos resultados', 'Que quien duerme poco nunca se enferma', 'Que solo quien despierta temprano es buena persona', 'b', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('7d53f029-1b48-51ce-a86a-6f090eaccd52', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Estrofa: «El sol sale en el mercado, / la gente empieza a gritar; / el pan ya está horneado / y listo para llevar». ¿Qué palabras riman?', 'Gritar y mercado', 'Pan y gente', 'Mercado y horneado', 'Llevar y horneado', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('19999177-23ac-5981-8764-25af47dd6004', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'En un croquis, la farmacia queda al este de la plaza. ¿Dónde se dibuja la farmacia?', 'A la izquierda de la plaza', 'Arriba de la plaza', 'Abajo de la plaza', 'A la derecha de la plaza', 'd', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('d9bc1836-af35-5166-8bbc-19d05082d55e', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', 'Un camión sale a las 6:15 y llega a las 7:00. ¿Cuánto dura el viaje?', '15 minutos', '45 minutos', '75 minutos', '55 minutos', 'b', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('818d6b80-78cf-5185-94a8-659b5a72c480', 'c32acb22-aab4-5cc8-9109-d8762d58bbc4', '¿Cuál es el primer paso para resumir un texto?', 'Copiar el primer párrafo completo', 'Subrayar los ejemplos de cada párrafo', 'Leer todo el texto una vez', 'Escribir el resumen con tus palabras', 'c', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('d8cfc73d-5086-5849-8611-561588e28fc0', '9813b736-cf64-5cf2-8d68-1815106b1b8e', '¿Cómo se lee la fracción 5/8?', 'Cinco sextos', 'Ocho quintos', 'Cinco cuartos', 'Cinco octavos', 'd', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('d69eb3d6-2f10-5911-909e-0957c078366b', '9813b736-cf64-5cf2-8d68-1815106b1b8e', 'Van 40 personas en un camión y 3/8 bajan en la primera parada. ¿Cuántas personas bajan?', '120 personas', '25 personas', '5 personas', '15 personas', 'd', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('64009ff8-3067-5a36-9b4c-6eed6ac26838', '9813b736-cf64-5cf2-8d68-1815106b1b8e', '¿Cuál de estas fracciones es equivalente a 3/4?', '6/4', '3/8', '6/8', '4/6', 'c', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('22ad3bb0-d195-5aba-a327-ae948008ee01', '9813b736-cf64-5cf2-8d68-1815106b1b8e', 'Ana lee 2/12 de un libro el lunes y 5/12 el martes. ¿Qué parte del libro lleva?', '3/12', '7/24', '7/12', '10/12', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('46f917a1-3ba7-56ef-b4b9-89d275965b7e', '9813b736-cf64-5cf2-8d68-1815106b1b8e', '¿Cuántos centavos son 1/4 de un peso?', '25 centavos', '4 centavos', '40 centavos', '75 centavos', 'a', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('535d7089-91d6-576f-a722-67c144da133d', '9813b736-cf64-5cf2-8d68-1815106b1b8e', 'María tiene $48.90 y gasta $19.35 en el mercado. ¿Cuánto dinero le queda?', '$29.45', '$29.55', '$68.25', '$28.55', 'b', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3358a0e7-3bc4-53c7-9334-8d646b261b5d', '9813b736-cf64-5cf2-8d68-1815106b1b8e', 'Luis suma 6.4 y 2.75. ¿Cuánto da en total?', '8.79', '9.15', '9.25', '3.39', 'b', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('8864f55c-00ba-5b0b-b65f-591a4f3fc6b4', '9813b736-cf64-5cf2-8d68-1815106b1b8e', '¿Cuánto es 0.38 × 100?', '0.0038', '3.8', '38', '380', 'c', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('70809cea-051a-5e48-b8b6-ed0c79964daf', '9813b736-cf64-5cf2-8d68-1815106b1b8e', 'Rosa usa la mitad de 3/4 de kilo de masa. ¿Cuántos kilos usa?', '3/8 de kilo', '3/2 de kilo', '3/6 de kilo', '6/8 de kilo', 'a', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('96c770a2-8968-57da-803e-8f3d81c59828', '9813b736-cf64-5cf2-8d68-1815106b1b8e', 'Un listón mide 3.2 m. ¿Cuántos centímetros mide?', '3,200 cm', '32 cm', '302 cm', '320 cm', 'd', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('367fc96a-86c5-5bab-a119-45acc92cb0e3', '40c17849-377b-5207-9b48-828def6401b6', 'Una rana nace, crece, respira y se mueve. Además tiene huesos por dentro. ¿Qué es?', 'Un hongo del campo', 'Un animal vertebrado', 'Una planta pequeña', 'Un animal invertebrado', 'b', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b8bfb6f2-4cb7-5316-a7e4-f7c9a8127245', '40c17849-377b-5207-9b48-828def6401b6', '¿Cómo se llama el proceso con el que la planta fabrica su alimento?', 'Fotosíntesis', 'Reproducción', 'Clasificación', 'Respiración', 'a', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3e95a088-d359-5e26-a093-0017456bbd49', '40c17849-377b-5207-9b48-828def6401b6', '¿Qué hacen los descomponedores en una cadena alimenticia?', 'Se alimentan de restos y nutren el suelo', 'Comen solo plantas verdes vivas', 'Fabrican su alimento con luz solar', 'Cazan a los consumidores grandes', 'a', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('aa8bc7d7-b6f6-53e3-bf1c-46686e81736a', '40c17849-377b-5207-9b48-828def6401b6', 'Si desaparecen los conejos del campo, ¿qué le pasa al águila que los caza?', 'Tiene más alimento, porque hay menos animales', 'Nada, porque el águila no depende de los conejos', 'Se alimenta más de pasto', 'Tiene menos alimento', 'd', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('2a6e5806-5c6b-50b6-85df-f1fdbf406c1c', '40c17849-377b-5207-9b48-828def6401b6', '¿Qué le pasa al agua de un río cuando el Sol la calienta mucho?', 'Cae de las nubes como lluvia', 'Parte se vuelve vapor y sube al aire', 'Entra al suelo hasta el manto acuífero', 'Se enfría y forma gotas pequeñas', 'b', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b4d94082-d67f-5764-b1ad-a800904bfdcc', '40c17849-377b-5207-9b48-828def6401b6', 'La ropa mojada se seca en el tendedero. ¿Qué cambio de estado ocurre?', 'Fusión', 'Condensación', 'Solidificación', 'Evaporación', 'd', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('1e2e8452-7c0f-53ad-a0cb-adfeb766aaf6', '40c17849-377b-5207-9b48-828def6401b6', '¿Qué es la materia?', 'Solo lo que es duro y sólido', 'Todo lo que ocupa un lugar y tiene masa', 'Todo lo que tiene vida y se mueve', 'Todo lo que se ve a simple vista', 'b', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('33d847e5-a46c-5db0-b02a-9afcbd7668e9', '40c17849-377b-5207-9b48-828def6401b6', '¿Cuál de estas parejas tiene solo materiales que se pueden reciclar?', 'Cartón y vidrio', 'Papel y restos de comida', 'Hojas secas y vidrio', 'Cáscaras y metal', 'a', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('17b42bdf-8b71-520f-9541-425ce2f20be3', '40c17849-377b-5207-9b48-828def6401b6', '¿Qué es un fenómeno natural?', 'Un daño que la gente causa al campo', 'Un aparato que avisa de un peligro', 'Un cambio de la naturaleza que nadie provoca', 'Un cambio que hace una persona con las manos', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('39609f69-f132-5c9b-8efc-5f2505d366c4', '40c17849-377b-5207-9b48-828def6401b6', 'Llega un huracán y las autoridades no piden salir de la zona. ¿Qué haces?', 'Quedarte junto a las ventanas', 'Subirte al techo para pedir ayuda', 'Quedarte en un lugar cerrado y firme', 'Salir a la calle a ver el viento', 'c', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ade26511-9cfb-5c2c-8312-c1080c1f9f4a', '3c1b1cb0-4502-5425-b176-61a7205d30da', 'Quieres mandar una foto junto con tu correo. ¿Cómo se llama el archivo que se manda con el mensaje?', 'Cuerpo', 'Adjunto', 'Asunto', 'Destinatario', 'b', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('c16fa752-308c-543b-bd69-2d5184755cb9', '3c1b1cb0-4502-5425-b176-61a7205d30da', '¿Qué parte de una carta va arriba, antes del saludo?', 'La despedida', 'El cuerpo', 'La firma', 'El lugar y la fecha', 'd', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('05945b06-7c04-5426-93bf-884e75bf6f1b', '3c1b1cb0-4502-5425-b176-61a7205d30da', '¿Cómo se escribe la fecha en un formato?', 'Con día y mes, sin el año', 'Con mes y año, sin el día', 'Con el año y la hora', 'Con día, mes y año', 'd', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('c45a4612-f796-523b-84b1-24cf9f19eeea', '3c1b1cb0-4502-5425-b176-61a7205d30da', '¿Cuál de estas preguntas está bien escrita?', '¿Dónde vives?', 'Dónde vives?', '¿Dónde vives', '¡Dónde vives!', 'a', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f36845a4-56fc-5e35-ba7a-834ec9862038', '3c1b1cb0-4502-5425-b176-61a7205d30da', 'Escribes en una sola oración que compraste pan leche y huevos. ¿Qué signo debe ir después de «pan»?', 'Dos puntos', 'Un signo de pregunta', 'Un punto', 'Una coma', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3d2adafd-1aa3-5f63-a845-248f8f65c9ce', '3c1b1cb0-4502-5425-b176-61a7205d30da', 'Al contar una experiencia que viviste, ¿en qué persona la cuentas?', 'En primera persona, como «salí»', 'En tercera persona, como «salió»', 'En segunda persona, como «saliste»', 'En tercera persona del plural, como «salieron»', 'a', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('8a0378bd-05a1-53c2-a0bc-92698cd07707', '3c1b1cb0-4502-5425-b176-61a7205d30da', '¿Qué se hace en el desarrollo de una historia personal?', 'Decir quién, cuándo y dónde', 'Decir qué aprendiste de todo ello', 'Contar lo que pasó paso a paso', 'Decir cómo terminó todo', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('a73ecca6-d318-5840-bf7c-b0db5d5aca29', '3c1b1cb0-4502-5425-b176-61a7205d30da', '¿Qué dice el título de un aviso?', 'Quién lo escribió y para cuándo', 'De qué se trata el aviso', 'Con quién preguntar más datos', 'Dónde será y a qué hora', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('900c8b42-8f33-5f48-a2fb-e55a0c2da82c', '3c1b1cb0-4502-5425-b176-61a7205d30da', 'Dudas cómo se escribe una palabra mientras revisas tu texto. ¿Qué haces?', 'Dejarla como la escribí', 'Escribirla como suena', 'Buscarla en un diccionario', 'Quitar la palabra del texto', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('2683f195-d4cc-5a5c-af28-e2b2249bee3d', '3c1b1cb0-4502-5425-b176-61a7205d30da', 'Vas a pedir algo por mensaje. ¿Qué conviene hacer?', 'Pedir una cosa y decir cuándo', 'Pedir varias cosas sin fecha', 'Pedir con mayúsculas para urgir', 'Pedir respuesta urgente de noche', 'a', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('08003f1f-372a-5d5c-9d3d-0d0293e912c0', '5ee6ffe6-a8e6-50de-beee-933b56303998', '¿Cómo se llaman las líneas que se cruzan y forman una esquina, como las orillas de una hoja?', 'Perpendiculares', 'Curvas', 'Inclinadas', 'Paralelas', 'a', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('a969e04b-27c8-5bcf-aaeb-1b0cebcb1dd5', '5ee6ffe6-a8e6-50de-beee-933b56303998', 'Un cuadrilátero tiene ángulos de 90°, 80° y 100°. ¿Cuánto mide el cuarto?', '110°', '90°', '270°', '180°', 'b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('86f8a9d8-cdbc-5058-aa9a-e48c08802620', '5ee6ffe6-a8e6-50de-beee-933b56303998', '¿Cuál cuadrilátero tiene un solo par de lados paralelos?', 'Cuadrado', 'Trapecio', 'Romboide', 'Rombo', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0e98021e-b423-5e4e-bc08-1d88580f2196', '5ee6ffe6-a8e6-50de-beee-933b56303998', 'Un letrero triangular tiene lados de 5 cm, 8 cm y 10 cm. ¿Cuál es su perímetro?', '18 cm', '13 cm', '23 cm', '40 cm', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('87f33e6a-59aa-5bc1-b1db-7c4a6a18dd4d', '5ee6ffe6-a8e6-50de-beee-933b56303998', 'Un azulejo cuadrado mide 9 cm de lado. ¿Cuál es su área?', '81 cm²', '72 cm²', '36 cm²', '18 cm²', 'a', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('9f470228-87a6-5f31-b12e-0f14c908c427', '5ee6ffe6-a8e6-50de-beee-933b56303998', '¿Con qué tipo de unidades se escribe el área?', 'Unidades de peso, como kg', 'Unidades de longitud, como m', 'Unidades cuadradas, como m²', 'Unidades cúbicas, como m³', 'c', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('566b9402-5c3e-5586-be31-3173af92be1e', '5ee6ffe6-a8e6-50de-beee-933b56303998', 'Una cinta mide 700 cm. ¿Cuántos metros son?', '70 m', '7000 m', '700 m', '7 m', 'd', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b459ba2c-a56d-50cf-891d-e4b8bb1ae157', '5ee6ffe6-a8e6-50de-beee-933b56303998', '¿Cuántos mililitros hay en 3 L de agua?', '1000 ml', '3000 ml', '300 ml', '30 ml', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('a120ac10-9a16-541f-a7fe-93077d6d9863', '5ee6ffe6-a8e6-50de-beee-933b56303998', '¿Qué cuerpo geométrico es redondo, como un balón?', 'Esfera', 'Prisma rectangular', 'Cubo', 'Cono', 'a', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('32414a4c-1cab-595e-baab-c416899c0187', '5ee6ffe6-a8e6-50de-beee-933b56303998', 'Una bodega mide 6 m de largo, 3 m de ancho y 2 m de alto. ¿Cuál es su volumen?', '18 m³', '72 m³', '11 m³', '36 m³', 'd', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('47eb9e2b-7b38-57e0-931e-f515055287c0', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué sembraban los pueblos de Mesoamérica?', 'Trigo, arroz y cebada', 'Caña, café y plátano', 'Papa, uva y manzana', 'Maíz, frijol y calabaza', 'd', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('7b722ed5-d8a5-593f-8dde-d3c90497484e', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué fue la Conquista?', 'El llamado a luchar por la libertad', 'La toma de un territorio por la fuerza', 'El gobierno de un territorio en nombre del rey', 'La fundación de una ciudad en un lago', 'b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3d22a538-f111-58bb-9657-0cae2f03620c', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué ayudó a los españoles a llegar hasta México-Tenochtitlan?', 'El apoyo de otros reyes de Europa', 'La ayuda de pueblos originarios aliados', 'El permiso de los mexicas para entrar', 'Un tratado de paz firmado con los mexicas', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('291ffb0a-d291-5d43-aaec-74052f4546ff', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué es la Independencia?', 'El llamado del sacerdote Hidalgo en Dolores', 'Una ley que separa a la Iglesia del gobierno', 'La libertad de un país para gobernarse', 'El gobierno de un virrey en nombre del rey', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('326bfa0c-9b7d-51d0-90cc-9fdf7687f9c1', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué es un insurgente?', 'Una persona que luchó por la Independencia', 'Una persona que trabajaba la tierra', 'Una persona que gobernó en nombre del rey', 'Una persona que escribió el himno', 'a', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3e2551f9-faa3-53e7-b862-56b6c83fe9a4', '68907162-44f4-5b98-a881-ce73c6b3bfd7', 'Benito Juárez fue abogado. ¿Qué cargo tuvo después?', 'Jefe del ejército mexicano en Puebla', 'Presidente de Francia', 'Presidente de México', 'Emperador de México', 'c', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('42a196b4-269e-5e36-87cb-42353a2262cd', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Por qué se recuerda a Ignacio Zaragoza?', 'Por escribir la Constitución de 1857 en Oaxaca', 'Por mandar al ejército que venció en Puebla', 'Por gobernar el país como emperador unos años', 'Por nacer en Guelatao, en Oaxaca', 'b', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('31e9ae23-39be-51ce-8194-9fc8fc069564', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué hizo Francisco I. Madero el 20 de noviembre de 1910?', 'Llamó a levantarse en armas', 'Publicó la nueva Constitución', 'Dejó el cargo después de 30 años', 'Luchó por la tierra en el sur', 'a', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('9058b449-a729-557a-a36f-1913a66a07a6', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿Qué hecho ocurrió en 1953?', 'Se reconoció el voto de las mujeres', 'El gobierno tomó el control del petróleo', 'La capital fue sede de los Juegos Olímpicos', 'Hubo un fuerte sismo en la capital', 'a', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('900755f5-06d6-5f61-b677-ee6629e18600', '68907162-44f4-5b98-a881-ce73c6b3bfd7', '¿De qué colores son las franjas de la bandera de México?', 'Verde, amarilla y roja', 'Verde, blanca y azul', 'Azul, blanca y roja', 'Verde, blanca y roja', 'd', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('49f0a803-6872-5a7c-ae39-613008f5b14b', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Ana repite con sus propias palabras lo que dijo don Pedro. ¿Para qué sirve eso?', 'Para que don Pedro se calle y la escuche', 'Para que don Pedro cambie de opinión', 'Para confirmar que entendió bien lo que dijo', 'Para dar su propia opinión primero', 'c', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('5219bee3-e65d-5925-97d1-86e1177c8172', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Luis se presenta en un grupo nuevo. ¿Qué frase sirve como cierre de su presentación?', 'Mucho gusto', 'Buenos días', 'Vivo en Puebla y me gusta cocinar', 'Me llamo Luis Ramírez', 'a', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('10919bbe-9ef9-504d-9282-8ddfd78d094c', 'd9f69973-5df7-5547-9611-5a24c95b8d52', '¿Cuál de estos es un dato personal?', 'El color de tu ropa', 'La hora de la junta', 'Tu fecha de nacimiento', 'El precio de un viaje', 'c', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b5496917-2f86-5779-8ff3-e799c07a0cde', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Doña Carmen siente nervios antes de proponer la limpieza del parque. ¿Qué le ayuda más?', 'Pedir a otra persona que hable por ella', 'Practicar en voz alta antes de la reunión', 'Escribir todo el texto y leerlo sin pausas', 'Hablar rápido para terminar pronto', 'b', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('20014536-6809-52b6-9606-23765e654f03', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Rosa ve que su nombre está mal escrito en su acta de nacimiento. ¿Dónde pregunta cómo corregirlo?', 'En una papelería cercana', 'En la oficina de su colonia', 'En el lugar donde vota', 'En el Registro Civil', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('d6e938f7-e2d3-5dc3-8ce8-9c41d3153832', 'd9f69973-5df7-5547-9611-5a24c95b8d52', '¿De dónde sale parte de la clave de la CURP?', 'De tu domicilio y de tu teléfono', 'De tu credencial y tu estado civil', 'De tu trabajo y de tu escuela', 'De tu nombre y de tu fecha de nacimiento', 'd', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0c8e3ae4-2dda-5980-8ded-df502fda4c09', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Luis llama a una oficina para pedir una copia de su acta. Ya le dijeron qué documentos llevar. ¿Qué hace?', 'Cuelga y vuelve a llamar para preguntar otra vez', 'Pide a un familiar que la recuerde por él', 'Anota la respuesta en una hoja', 'Lo deja para recordarlo después', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('51e3c101-fdd2-50a0-943d-535ad4123e18', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Dos vecinos tienen un desacuerdo. ¿Qué conviene elegir para hablar del problema?', 'Un momento con mucha prisa', 'Un momento tranquilo', 'Un momento en que sigan enojados', 'Un momento en que uno de los dos va de salida', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('694ecfa0-dd2d-5b1d-b3a2-02bb0cf2c0e1', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'En un desacuerdo, ¿qué significa acusar?', 'Explicar lo que tú sientes con calma', 'Echarle la culpa a otra persona', 'Escuchar con atención a otra persona', 'Aceptar lo que decide la otra persona', 'b', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('cce3036a-56c8-5102-b9ed-96cf2a5799ff', 'd9f69973-5df7-5547-9611-5a24c95b8d52', 'Vas a una entrevista de trabajo. ¿Qué conviene llevar contigo?', 'Tus documentos y una hoja con tus datos', 'Una hoja con las respuestas de otra persona', 'Solo tu celular y tus audífonos', 'Solo una copia de tu acta de nacimiento', 'a', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('44213dc0-61b6-50e7-af78-72664aea501a', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Compras arroz de $28 y frijol de $37. Pagas con $100. ¿Cuánto cambio te regresan?', '$35', '$65', '$45', '$135', 'a', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('19fcb0e6-dcec-578a-bf98-3c7c72995672', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Una compra cuesta $72 y pagas con $100. Si cuentas hacia adelante desde el precio, ¿cuánto sumas en total?', '$28', '$172', '$18', '$38', 'a', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('31522821-060b-5690-9790-939311b2b58d', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Los ingresos del mes son $7,500. Los gastos son $3,200, $2,600 y $1,100. ¿Cuánto sobra?', '$6,900', '$600', '$700', '$1,600', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f7a03c83-ed9a-5ff6-b346-c9cf9773b7a0', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'En una tienda hay un letrero: «10 % de descuento». El producto cuesta $780. ¿Cuánto es el descuento?', '$195', '$78', '$390', '$7.80', 'b', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('5641c1f5-4edd-55a2-a53f-6e3db8856f86', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Unos tenis de $900 tienen un letrero de 50 % de descuento. ¿Cuánto es el descuento?', '$225', '$1,800', '$90', '$450', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('1f5bae52-c534-530d-8ac5-2ee7db6b6e8a', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Un pantalón cuesta $480 y tiene 25 % de descuento. ¿Cuánto pagas por él?', '$240', '$120', '$360', '$600', 'c', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0e8dce75-e783-5dd4-bc70-4c63ebaca9c0', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Tienda A: $400 con 25 % de descuento. Tienda B: $330 con 10 % de descuento. ¿Cuánto pagas de menos en la tienda B que en la tienda A?', '$70', '$13', '$3', '$30', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ab9ec1ef-85d9-5924-9de0-44509b90ebfa', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Quieres juntar $2,400 para un viaje en 6 meses. ¿Cuánto guardas cada mes?', '$480', '$400', '$14,400', '$300', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('97343bb8-ab60-5867-b560-8a2938ff1020', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'Pides $3,000 prestados y los pagas con 6 abonos de $550. ¿Cuánto es el interés?', '$250', '$3,300', '$550', '$300', 'd', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('52b5a42b-f3dc-55ed-9aa9-bee3bced4a57', '51c69d46-f7f9-58c3-8ed6-20140d8576d8', 'En un recibo de luz, la lectura anterior es 3,420 y la actual es 3,585. ¿Cuántos kilowatts-hora consumiste?', '7,005 kilowatts-hora', '175 kilowatts-hora', '165 kilowatts-hora', '155 kilowatts-hora', 'c', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('74a483a5-858a-507c-9bd7-24c92e8f5bf6', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Qué hay al este de México?', 'El Golfo de México y el Mar Caribe', 'Guatemala y el Océano Pacífico', 'El Océano Pacífico y el Mar Caribe', 'El Golfo de México y el Océano Pacífico', 'a', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('89d7754f-281b-55ec-96fa-c58f8493a685', '9f630342-0af7-5a66-abb8-5793c6ed644f', 'Rosa vive en Puebla. ¿En qué parte del país queda?', 'En el sur', 'En el centro', 'En el sur y sureste', 'En el norte', 'b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ff485452-c6bc-598d-b16f-6b8ee7e1a5b0', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Cómo se llama el terreno alto y plano que hay entre las dos sierras?', 'Península', 'Llanura', 'Altiplano', 'Volcán', 'c', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('6558bdb5-af6c-5fac-a232-a17faf376934', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Cómo es el sureste de México?', 'Cálido y con mucha lluvia', 'Frío casi todo el año', 'Alto y de clima templado', 'Seco y con poca lluvia', 'a', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('2e434f88-9258-5131-bc31-c5f1d81235a5', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Qué significa reciclar?', 'Sacar la basura de la casa cada día', 'Llevar la basura al camión de recolección', 'Comprar productos nuevos cada mes', 'Usar de nuevo materiales para hacer algo nuevo', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('28e870b3-dae7-5b59-b699-17f08ef73acf', '9f630342-0af7-5a66-abb8-5793c6ed644f', 'En la lección, ¿en qué estado están las minas de plata?', 'Zacatecas', 'Yucatán', 'Tabasco', 'Quintana Roo', 'a', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('cc196a75-8e17-5ad0-8df4-6a0494dfa4e5', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Qué lengua indígena se habla sobre todo en la península de Yucatán?', 'El zapoteco', 'El mixteco', 'El maya', 'El náhuatl', 'c', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('06721776-c05b-5e22-861a-f07b28973dad', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Qué es un comité de vecinos?', 'Un grupo de personas que viven en un lugar', 'Un grupo de vecinos que se reúne para una tarea', 'El gobierno local de un municipio', 'Un servicio que ayuda a todos los habitantes', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f5474940-0528-5119-894b-0adf21623226', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Quién da el servicio de luz eléctrica en las casas?', 'La escuela de la colonia', 'El ayuntamiento del municipio', 'Una compañía del gobierno federal', 'Un comité formado por los vecinos', 'c', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f9a8ac92-b3f8-5b82-b5dc-798cddf01dfd', '9f630342-0af7-5a66-abb8-5793c6ed644f', '¿Cómo se llaman las ciudades muy pobladas, como la Ciudad de México?', 'Rancherías', 'Zonas rurales', 'Zonas de costa', 'Zonas urbanas', 'd', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('093d3027-2265-5744-b7ff-29e5ee8b15d5', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', '¿Para qué sirve una tabla de conteo?', 'Para dibujar los datos con figuras', 'Para saber qué tan fácil es que algo pase', 'Para anotar datos mientras pasan', 'Para sacar el promedio de los datos', 'c', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f5af0175-8890-5c77-bcf4-c5249a69c93d', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'En una gráfica de barras, el lunes se vendieron 12 pasajes, el martes 9 y el miércoles 15. ¿Qué diferencia hay entre el día que más y el que menos se vendió?', '36 pasajes', '3 pasajes', '6 pasajes', '24 pasajes', 'c', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('d16066d3-585e-5c8a-97be-ab65a1cb9f40', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'Antes de leer una gráfica de barras, ¿qué dos cosas debes revisar?', 'El título y la escala', 'El color y el ancho de las barras', 'La barra más larga y la más corta', 'El nombre y el dibujo de cada barra', 'a', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('10b5dfd0-03dd-5d92-a4a5-50e764b5bfd8', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'En un pictograma, cada ● vale 20 litros. El lunes tiene ●●● y el martes ●●●●●. ¿Cuántos litros son entre los dos días?', '40 litros', '8 litros', '100 litros', '160 litros', 'd', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b9f654ba-98db-5398-81f3-f62c473d2958', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'Una gráfica de línea muestra la temperatura: 12 grados a las 8, 16 grados a las 10 y 22 grados a las 12. ¿Cuánto subió del principio al final?', '50 grados', '10 grados', '4 grados', '6 grados', 'b', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('de424550-eea1-5976-8328-cf0a8bb12f3b', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'Un taxista cobró $90, $60, $70 y $80 en cuatro viajes. ¿Cuál es el promedio por viaje?', '$70', '$75', '$90', '$300', 'b', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f9cbbbd6-6ab3-5491-984e-4e3c3a99a612', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'Una tienda anotó el color de las playeras vendidas: rojo, negro, negro, café, negro y rojo. ¿Cuál es la moda?', 'Negro', 'Café', 'Rojo', 'No hay moda', 'a', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('b2e159e4-5f1e-5b77-9914-cbb652397e95', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'En una tabla, la edad 20 sale 2 veces, la 21 sale 5 veces y la 22 sale 3 veces. ¿Cuál es la moda?', '21', '20', '22', '5', 'a', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0c2b224a-67c8-522f-832b-eae01f9477e8', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'En un dado de seis caras, ¿cómo es sacar un número par?', 'Imposible, porque el dado también tiene números impares', 'Seguro, porque la mitad de las caras son pares', 'Seguro, porque el 2, el 4 y el 6 son pares', 'Posible, porque puede salir un par o un impar', 'd', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('175643ef-3b94-5835-9cbc-1db046d30db5', 'c8cd370d-3be6-5aa0-a0c1-cc80f64b092d', 'Una gráfica de barras de ventas empieza su escala en 30 y no en cero. ¿Qué debes hacer antes de opinar?', 'Fijarte en el color de las barras', 'Revisar dónde empieza la escala y comparar con los números', 'Contar cuántas barras tiene la gráfica', 'Fijarte solo en cuál barra se ve más grande', 'b', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('45e8f5d4-5b2f-5b74-8280-8d772f97a36a', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Los derechos humanos son universales. ¿Qué quiere decir eso?', 'Que son para todas las personas, sin excepción', 'Que solo los tienen las personas adultas', 'Que cambian según el trabajo de cada quien', 'Que solo valen en el país donde naciste', 'a', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('2ed53233-4600-575a-8343-17a83ca9cb15', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Una vecina cree que su multa fue injusta. ¿Qué poder puede revisar si fue justa?', 'Ninguno, porque la multa ya se aplicó', 'El Poder Legislativo', 'El Poder Judicial', 'El Poder Ejecutivo', 'c', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('8fe2b603-b8a4-5cff-b010-fbb06c693617', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Entre los tres poderes hay equilibrio. ¿Qué quiere decir eso?', 'Que los tres poderes tienen igual número de personas', 'Que un poder manda sobre los otros dos', 'Que cada poder vigila a los otros dos', 'Que cada poder hace el trabajo de los otros', 'c', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ea0223a8-0a42-57b7-b2ab-1d9c40814f7b', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'En un municipio, la basura se acumula en tu colonia. ¿Quién atiende este servicio?', 'El gobierno federal', 'El ayuntamiento', 'El Congreso de la Unión', 'El gobierno estatal', 'b', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('c9297fbf-4dca-52f7-b05b-1a65801c4400', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'En México, ¿a partir de qué edad se es persona mayor?', '70 años o más', '65 años o más', '50 años o más', '60 años o más', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0845c8bb-2c00-505b-bf05-106063a93122', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', '¿Qué puedes hacer para ayudar a evitar la discriminación?', 'Evitar a las personas distintas a ti', 'Escuchar antes de opinar y evitar los apodos', 'Corregir en voz alta a quien se equivoca', 'Opinar de inmediato para aclarar las cosas', 'b', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('9f40e0be-2f22-5779-907f-2f1eee35fc1e', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Luis llegó a su casilla con su credencial para votar. ¿Qué recibe después?', 'Una constancia de ciudadanía', 'Una credencial nueva', 'Una urna', 'Una boleta', 'd', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('f28bfdef-4ece-51f7-a9c9-346fa0458e7f', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Los vecinos entregan a la autoridad una petición firmada sobre el agua. ¿Qué hicieron?', 'Participaron en su comunidad', 'Votaron por una autoridad nueva', 'Hicieron una votación en la casilla', 'Cambiaron una ley del país', 'a', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('30421dea-bdd5-564a-86fe-5207a47fd2d9', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Una persona controla el dinero de otra y no la deja usarlo. ¿Qué tipo de violencia es?', 'Digital', 'Emocional', 'Física', 'Económica', 'd', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('80071c0c-901b-536e-95b5-f9553785dcad', '1ce90067-69d2-5a4b-a8a1-ed3bf0cc8fac', 'Una persona vive violencia y está en peligro ahora mismo. ¿Qué puede hacer para pedir ayuda de inmediato?', 'Hablar del tema con la otra persona en ese momento', 'Llamar al 911', 'Esperar a ver si la situación cambia', 'Dejar la ayuda para otro día', 'b', 10) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('25519a77-282a-5dc7-9d30-eeb4f5b59304', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Para avanzar en una meta, ¿qué conviene hacer?', 'Esperar a tener todo el dinero para empezar', 'Guardarla en la memoria sin anotar pasos', 'Dividirla en pasos pequeños y posibles', 'Cambiarla cada día para no cansarse', 'c', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('4a8db8ef-9aa9-55b7-a17d-f2c562a2f0d7', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Marcos tiene 14 años y quiere trabajar. ¿Qué dice la ley en México?', 'Puede trabajar si en su casa lo aceptan', 'Puede trabajar siempre que sea medio tiempo', 'Puede trabajar con permiso de cualquier jefe', 'Los menores de 15 años no pueden trabajar', 'd', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('ffe6bf5e-7d1b-531f-a5e6-7564f87fd131', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Una oferta de trabajo te pide tu NIP del banco. ¿Qué haces?', 'Darlo si la oferta tiene buen sueldo', 'Desconfiar y no dar tus claves', 'Darlo solo si te llaman por teléfono', 'Darlo si dicen que es para pagarte', 'b', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('0fe59695-88c1-55b7-853a-30a57dc8e104', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', '¿Qué tienes derecho a recibir por tu trabajo?', 'Lo que alcance a pagar la empresa ese día', 'El pago que el jefe decida cada semana', 'El pago que se acordó, y a tiempo', 'Un pago distinto al que se acordó antes', 'c', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('19245062-a433-509b-8029-127ba5212cd4', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Para comunicarte bien en un equipo, ¿qué conviene hacer?', 'Callar aunque no hayas entendido', 'Hablar mucho para que se note quién sabe más', 'Dar órdenes sin explicar el motivo', 'Escuchar sin interrumpir y hacer preguntas', 'd', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('470c4bd9-53a6-5375-b00f-c2969c043fe8', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', '¿Por qué conviene empezar un negocio poco a poco?', 'Porque así los vecinos no se enteran del negocio', 'Porque con poco dinero siempre se gana más', 'Porque ningún negocio tiene el éxito asegurado', 'Porque los clientes prefieren los negocios pequeños', 'c', 6) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('de11618a-e8ad-5b15-988e-c7b85ae88a5b', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Un puesto gasta $200 en total y vende 25 piezas a $12 cada una. ¿Cuál es su ganancia?', '$100', '$212', '$500', '$300', 'a', 7) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('993b4112-00a4-5207-a8da-07a3d26f3db1', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Un puesto gastó $180 en hacer sus productos y cobró $150 por todas las ventas. ¿Cuánto dinero pierde?', '$150', '$30', '$330', '$180', 'b', 8) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('3c78581b-2a5a-56e5-be26-0f14b7e5ff01', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Un cliente compra 4 cuadernos de $18 y paga con $100. ¿Cuánto cambio le das?', '$82', '$28', '$118', '$72', 'b', 9) ON CONFLICT DO NOTHING;
INSERT INTO public.preguntas (id, evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES ('135128ca-9487-560f-ae02-1e8419ee1fb3', '757c6feb-65a9-5c15-b712-2e88f0bf1d6b', 'Un cliente se queja porque su pedido salió mal. ¿Qué haces primero?', 'Escucharlo sin discutir', 'Pedirle que regrese otro día', 'Explicarle que él se equivocó', 'Ofrecerle una solución sin oírlo', 'a', 10) ON CONFLICT DO NOTHING;

INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4f5fc8be-15b2-515a-b317-c0c270564605', '2b0f1a6b-79b3-5dc9-9e5b-a342954dc7ea', 'Rosa ve un papel pegado en un poste de la calle. ¿Para qué sirve un aviso?', 'Para decir qué trae un producto', 'Para informar algo a mucha gente', 'Para dejar un mensaje a una persona', 'Para saber cuándo caduca la leche', 'b', 1, 'El aviso se escribe para muchas personas y dice qué pasa, dónde y cuándo. El mensaje para una sola persona es el recado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('be4f8f8c-54bd-5ee2-b120-68ffd0d3aab4', '2b0f1a6b-79b3-5dc9-9e5b-a342954dc7ea', 'Un papel pegado a un frasco de miel dice qué es, cuánto trae y hasta cuándo sirve. ¿Qué texto es?', 'Una etiqueta', 'Un recado', 'Un aviso', 'Una noticia', 'a', 2, 'La etiqueta se pega al producto y da sus datos: qué es, cuánto trae y hasta cuándo sirve.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0522aae2-073d-5d84-9ed7-3930e758fa73', '2b0f1a6b-79b3-5dc9-9e5b-a342954dc7ea', '¿Qué es el propósito de un texto?', 'El lugar donde se pega el papel', 'La cantidad de palabras que tiene', 'El nombre de la persona que lo lee', 'La razón por la que alguien lo escribió', 'd', 3, 'Cada texto se escribe por algo: avisar, pedir o describir. Saber el propósito ayuda a entender mejor lo que se lee.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('74a65572-6f41-5927-ae35-f668c4b431fd', 'ffeb142f-dc44-5afe-ae84-2c0ae386208c', 'Doña Carmen da un aplauso por cada golpe de voz de la palabra «casa». ¿Cuántos aplausos da?', 'Uno', 'Cuatro', 'Tres', 'Dos', 'd', 1, 'Cada aplauso marca una sílaba. La palabra se separa así: ca-sa, y por eso tiene dos sílabas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b0e11656-35dd-5d5d-84e5-0a612c83b0c8', 'ffeb142f-dc44-5afe-ae84-2c0ae386208c', 'En español, ¿cuáles son las vocales?', 'e, i, o, u, n', 'a, e, i, u, y', 'a, e, i, o, u', 'a, o, u, m, s', 'c', 2, 'Solo cinco letras son vocales. Todas las demás son consonantes, que necesitan una vocal para formar una sílaba.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4d9c4ce5-7e23-5fe8-8b5a-68dae5d28a81', 'ffeb142f-dc44-5afe-ae84-2c0ae386208c', '¿Qué significa leer con fluidez?', 'Leer solo palabras cortas y fáciles', 'Leer sin trabarse, con ritmo parejo', 'Leer en voz baja y con muchas pausas', 'Leer lo más rápido que se pueda, aunque te equivoques', 'b', 3, 'La fluidez no es velocidad: es leer parejo y sin detenerse. Se logra con práctica, por ejemplo leyendo en voz alta cada día.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d808bcc2-6d08-52a6-be61-c25b831e6ce1', 'e59cb85a-5c84-54a3-8109-9d173b6378fb', '¿Qué es la idea principal de un texto?', 'Lo más importante que dice el texto', 'La parte más larga del texto', 'Los datos que acompañan al tema', 'La primera oración que aparece', 'a', 1, 'La idea principal no siempre es la primera ni la más larga. Es aquello de lo que trata casi todo el texto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e19ddf9a-2be0-53f1-83f3-799b0db7ae8e', 'e59cb85a-5c84-54a3-8109-9d173b6378fb', 'Texto: «Don Beto arregla zapatos en su local. Abre a las ocho. Cobra $50 por cambiar una suela». ¿Cuál es la idea principal?', 'Don Beto cobra $50 por cambiar suelas', 'Don Beto arregla zapatos en su local', 'Don Beto tiene clientes todos los días', 'Don Beto abre su local muy temprano', 'b', 2, 'Casi todo el texto habla de que Don Beto arregla zapatos. La hora y el precio solo dan más datos sobre eso.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('824c7709-3344-5006-b4fa-61e9d951b2f1', 'e59cb85a-5c84-54a3-8109-9d173b6378fb', '¿Para qué sirven los detalles de un texto?', 'Cambian la idea principal del texto', 'Dicen de qué trata casi todo el texto', 'Dan más información sobre la idea principal', 'Sustituyen a la idea principal', 'c', 3, 'Los detalles acompañan a la idea principal y responden preguntas como quién, dónde, cuándo y cómo. No la reemplazan.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e34d72d2-54bf-5904-9265-e2a873fd41bc', '94e748ac-d6cf-5d82-b7bb-0d8ee23162dd', '¿Qué es un texto informativo?', 'Un texto que da datos reales sobre algo', 'Un texto que pide algo a una persona', 'Un texto que explica cómo preparar algo', 'Un texto que cuenta un cuento inventado', 'a', 1, 'El texto informativo busca que sepas qué pasó o qué va a pasar. Las noticias y los avisos son ejemplos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6938ede0-64db-559f-9be2-28f8953ab5b5', '94e748ac-d6cf-5d82-b7bb-0d8ee23162dd', '¿Qué es el titular de una noticia?', 'El último párrafo que cierra la noticia', 'El título corto que dice de qué trata', 'La fecha en que ocurrió el hecho', 'El nombre de quien escribió la noticia', 'b', 2, 'El titular resume de qué habla la noticia. Conviene leerlo primero, junto con el primer párrafo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('deadd6ba-d995-5c04-8086-32e24327745d', '94e748ac-d6cf-5d82-b7bb-0d8ee23162dd', 'Un aviso dice: «Cerrado el sábado por inventario». ¿Qué debe hacer el cliente?', 'Llegar el sábado a la hora de siempre', 'Esperar afuera a que abran el sábado', 'Ir el sábado, pero más temprano', 'Comprar en otro día', 'd', 3, 'El aviso dice que la tienda cierra el sábado. Por eso lo que debe hacer quien quiera comprar es ir otro día.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('98eddab8-e7f9-5ff8-b910-fd624ef4ecb9', '63790875-086c-5b0c-96b3-d32b6c947997', '¿Cuáles son las tres partes de una historia?', 'Título, idea y detalles', 'Personajes, lugar y problema', 'Inicio, desarrollo y final', 'Título, desarrollo y despedida', 'c', 1, 'Una historia tiene un orden: se presenta, pasa algo y se cierra.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2e95b37d-080d-513a-8a1e-f132c016116b', '63790875-086c-5b0c-96b3-d32b6c947997', '¿En qué parte de una historia aparece el problema?', 'En el título', 'En el inicio', 'En el final', 'En el desarrollo', 'd', 2, 'En el desarrollo surge el problema y los personajes hacen algo para resolverlo. El inicio solo presenta personajes y lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4494bf30-8b7c-5448-af20-a8ef82a2f541', '63790875-086c-5b0c-96b3-d32b6c947997', '¿Quiénes son los personajes de una historia?', 'El lugar donde ocurre la historia', 'Las partes en que se divide', 'Quienes viven la historia', 'El problema que se resuelve', 'c', 3, 'Un personaje puede ser una persona o un animal. Al leer, conviene buscar quiénes son y dónde están.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c57af3f5-0ffc-56f1-ba5d-6850f88219c0', '8f5b8122-57c5-580a-b502-d536ec9206ae', '¿Cuál palabra es sinónimo de «empezar»?', 'Terminar', 'Comenzar', 'Esperar', 'Repetir', 'b', 1, 'Los sinónimos son palabras distintas con casi el mismo significado. Sirven para no repetir la misma palabra.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('86658705-cfc4-55f5-9dee-e306161b9739', '8f5b8122-57c5-580a-b502-d536ec9206ae', '¿Cuál palabra es antónimo de «subir»?', 'Bajar', 'Pasar', 'Llegar', 'Trepar', 'a', 2, 'Los antónimos significan lo contrario. Subir y bajar son movimientos opuestos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6197682e-0049-5d95-8770-484f4fe47422', '8f5b8122-57c5-580a-b502-d536ec9206ae', '¿En qué orden pone las palabras un diccionario?', 'De las más cortas a las más largas', 'Según la fecha en que se creó', 'Según el tema de cada palabra', 'Como el abecedario', 'd', 3, 'Por eso se busca por la primera letra, luego por la segunda y la tercera, hasta dar con la palabra.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4fad4ade-0cb4-5223-85c7-aa359e48664c', 'ff7ede3f-3bef-5d8f-8b8b-762ecf5fc34b', '¿Qué conviene hacer antes de empezar a seguir una instrucción?', 'Buscar solo los materiales', 'Saltar a los últimos pasos', 'Leerla completa', 'Hacer el primer paso de inmediato', 'c', 1, 'Leer todo primero evita errores, como saltarse un paso. Después se revisan los materiales y se avanza paso por paso.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c1f5248c-6c1c-5982-9ad3-60b2c4a89ffa', 'ff7ede3f-3bef-5d8f-8b8b-762ecf5fc34b', '¿Qué avisan palabras como «cuidado» o «no mezclar» en una instrucción?', 'Un paso que solo hacen los expertos', 'Un paso que se hace al final', 'Algo importante para tu seguridad', 'Un paso que se puede saltar', 'c', 2, 'Son palabras de advertencia. Hay que leerlas con atención porque hablan de un riesgo o de algo que se debe cuidar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3e135219-ba53-519a-a00b-1d54788c6236', 'ff7ede3f-3bef-5d8f-8b8b-762ecf5fc34b', '¿Cuáles son palabras de orden en una instrucción?', 'Cuidado, peligro, ojo, atención', 'Aviso, recado, etiqueta, noticia', 'Quién, qué, dónde, cuándo', 'Primero, después, luego, al final', 'd', 3, 'Estas palabras marcan en qué orden se hace cada paso. Fijarse en ellas ayuda a no equivocarse.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9fddf7bb-728a-5ffe-9fe4-1984b212aa69', '493ebe1a-d3ed-520e-894d-d4fa74789ccb', 'Un papel en el portón dice: «Mañana se corta el gas de 8 a 11 horas». ¿Qué texto es?', 'Un aviso, porque informa a todos los vecinos', 'Un recado, porque le habla a una sola persona', 'Una etiqueta, porque describe un producto', 'Una etiqueta, porque dice cuánto trae algo', 'a', 1, 'El aviso informa a mucha gente. El recado pide algo a una persona y la etiqueta describe un producto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('aef37a20-65bd-5e38-a929-8cf5fd9bb1ea', '493ebe1a-d3ed-520e-894d-d4fa74789ccb', '¿Cómo se separa en sílabas la palabra «tortilla»?', 'tor-ti-lla', 'tor-til-la', 'to-rti-lla', 'tort-il-la', 'a', 2, 'La «ll» son dos signos, pero cuenta como una sola letra. Por eso va junta en la última sílaba.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('737f5020-0fa1-58cd-9237-22b402e0966c', '493ebe1a-d3ed-520e-894d-d4fa74789ccb', 'Texto: «Ana vende flores en el mercado. Llega temprano y trae rosas rojas». ¿Cuál es la idea principal?', 'Ana compra flores en el mercado', 'Ana vende flores en el mercado', 'Ana llega temprano al mercado', 'Ana trae rosas rojas todos los días', 'b', 3, 'El texto trata de que Ana vende flores. Llegar temprano y traer rosas rojas son detalles.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1ae66c1f-dacf-521b-8193-2e4db6d64fa7', 'f3904e90-4032-55cc-853c-30f0712276a5', '¿Cómo se agrupan las cifras de un número grande?', 'De tres en tres, de derecha a izquierda', 'De tres en tres, de izquierda a derecha', 'De cuatro en cuatro, de derecha a izquierda', 'De dos en dos, de derecha a izquierda', 'a', 1, 'Las cifras se cuentan de tres en tres, empezando por la derecha. Cada grupo se separa con una coma.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('32a27a65-89a2-58d1-a581-267ae28020fd', 'f3904e90-4032-55cc-853c-30f0712276a5', '¿Cómo se escribe un millón con cifras?', '100,000', '10,000,000', '1,000,000', '1,000', 'c', 2, 'Un millón lleva un 1 y seis ceros. Se separa en tres grupos: millones, miles y unidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('033decc3-1ddb-5c46-8d33-af4f0fb93d55', 'f3904e90-4032-55cc-853c-30f0712276a5', '¿Para qué sirve el cero dentro de un número?', 'Ocupa un lugar que no tiene cifras', 'Marca el lugar de la coma', 'Separa un grupo de otro grupo', 'Sube el valor de la cifra anterior', 'a', 3, 'Sin el cero, 2,015 sería 215. El cero ocupa el lugar vacío para que cada cifra valga lo que debe.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9138728a-dc8c-5ed5-a491-3c9fe2b18706', '73517621-87cf-5968-ba8e-f1f30ef18963', 'En el número 6,314, ¿cuánto vale el 3?', '3', '30', '3,000', '300', 'd', 1, 'El 3 está en el lugar de las centenas. Una centena es un grupo de 100.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('10b4d559-d898-56e2-b04b-cd9d55e0bbee', '73517621-87cf-5968-ba8e-f1f30ef18963', '¿Qué es una centena?', 'Un grupo de 1,000 unidades', 'Un grupo de 100 unidades', 'Un grupo de 10,000 unidades', 'Un grupo de 10 unidades', 'b', 2, 'Una centena es un grupo de 100 unidades. Cada lugar es un grupo de 10 del lugar que está a su derecha.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('03116d5a-c0d7-5c7f-a30e-448c91651e09', '73517621-87cf-5968-ba8e-f1f30ef18963', 'En 60,408 hay un cero en las unidades de millar. ¿Cuánto suma ese cero?', 'Cien, porque está junto a las centenas', 'Diez, porque es un cero solo', 'Nada, porque solo guarda el lugar', 'Mil, porque está en los miles', 'c', 3, 'El cero no suma nada al número. Sirve para que el 6 y el 4 queden en su lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9a7a4e7a-c5b3-5484-b77c-c1bf1bc6c50b', '87c37fbc-3132-55b9-b92b-4a651ead35e0', 'Doña Carmen ganó $3,254 un día y $1,468 al siguiente. ¿Cuánto juntó en total?', '$4,622', '$4,722', '$4,712', '$3,712', 'b', 1, 'Unidades: 4 + 8 = 12, escribes 2 y llevas 1. Al seguir así en cada columna sale 3,254 + 1,468 = 4,722.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('00668e16-1853-57cd-81b3-b10082431e00', '87c37fbc-3132-55b9-b92b-4a651ead35e0', 'Resta 7,425 − 2,468.', '5,957', '4,947', '5,043', '4,957', 'd', 2, 'Arriba hay menos que abajo en las unidades, las decenas y las centenas, así que pides prestado en cada una. Así 7,425 − 2,468 = 4,957, y se comprueba con 4,957 + 2,468 = 7,425.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dadf469a-219d-5c09-8a52-935ff73b107b', '87c37fbc-3132-55b9-b92b-4a651ead35e0', '¿Cómo se comprueba una resta?', 'Restando otra vez los mismos dos números', 'Pidiendo prestado en cada columna', 'Sumando el resultado y el número que restaste', 'Sumando solo las unidades de cada número', 'c', 3, 'Al sumar el resultado con el número que restaste debe salir el número del inicio. Si no sale, la resta tiene un error.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('75b9f3aa-e941-52fd-9533-4efa2d5ebea0', 'ce201e9b-185f-5427-8b0e-7ef6805df614', 'Luis compra pan de $64, leche de $35 y huevo de $28. Paga con $200. ¿Cuánto cambio le dan?', '$127', '$63', '$83', '$73', 'd', 1, 'Primero se suma lo que gastó: 64 + 35 + 28 = 127. Después se resta del pago: 200 − 127 = 73.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('85bb37e0-eb51-5959-a5f7-8f5b681a00e0', 'ce201e9b-185f-5427-8b0e-7ef6805df614', 'En un problema, ¿qué paso sigue después de anotar los datos?', 'Leer el problema completo', 'Mirar qué te pregunta', 'Revisar si la respuesta tiene sentido', 'Escoger la operación y hacer la cuenta', 'b', 2, 'Los pasos tienen un orden: leer, anotar los datos, mirar qué te pregunta, hacer la cuenta y revisar. Así sabes qué buscas antes de calcular.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('402400e4-0f1e-52a9-bbb9-c7b846b77cff', 'ce201e9b-185f-5427-8b0e-7ef6805df614', 'Tu meta es juntar $6,000 y ya tienes $4,750. ¿Cuánto te falta?', '$2,250', '$1,350', '$1,250', '$10,750', 'c', 3, 'Lo que falta se busca restando: 6,000 − 4,750 = 1,250. Si sumaras, saldría 10,750, que no tiene sentido.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d2163243-affb-5386-8b19-6bb35219bf10', '131e2ac8-64ae-51ae-b404-1432c5ec766a', '¿Cuál de estos números es el mayor?', '987,400', '98,740', '98,470', '9,874', 'a', 1, 'Cuenta las cifras: 987,400 tiene seis y los demás tienen cinco o cuatro. El que tiene más cifras es el mayor.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('611b4ae7-e723-5574-98ae-1a3576ed44e9', '131e2ac8-64ae-51ae-b404-1432c5ec766a', '¿Cómo se lee el signo <?', 'Mayor que', 'Igual que', 'Menor que', 'Más que', 'c', 2, 'El signo < se lee «menor que». Su punta siempre apunta al número más pequeño.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e75cedef-e72c-5404-90f0-a6f2b16b357f', '131e2ac8-64ae-51ae-b404-1432c5ec766a', 'Ordena de menor a mayor: 8,150; 815; 8,105 y 18,000. ¿Cuál va primero?', '8,150', '18,000', '8,105', '815', 'd', 3, 'El 815 es el único con tres cifras, así que es el menor. Después siguen 8,105, 8,150 y 18,000.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('22855f2d-84f8-5ac6-8866-cab582fca7cf', '45fdce63-05d7-5383-9702-73d963606c05', 'Redondea 5,738 a la centena.', '5,700', '6,000', '5,740', '5,800', 'a', 1, 'La cifra a la derecha de la centena es 3. Como 3 es 4 o menos, la centena se queda igual.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('85c168a2-8f8e-5f64-bad7-b484194f01dd', '45fdce63-05d7-5383-9702-73d963606c05', 'Redondea 2,865 al millar.', '2,870', '2,900', '2,000', '3,000', 'd', 2, 'La cifra a la derecha del millar es 8, que es 5 o más. Por eso el 2 sube a 3 y quedan ceros.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0eeb65f6-7cf7-53db-b667-f715d83864af', '45fdce63-05d7-5383-9702-73d963606c05', 'Luis compra cosas de $403, $198 y $104. Si redondeas a la centena, ¿cuánto estimas que va a pagar?', '$800', '$600', '$690', '$700', 'd', 3, 'Redondeas a la centena: 403 queda en 400, 198 en 200 y 104 en 100. Entonces 400 + 200 + 100 = 700.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ed49f2f1-b9b8-5586-8be1-30672b261417', '1ba9ee9b-1a03-56be-a845-b83723e972f9', '¿Qué número es XXVI?', '16', '26', '24', '36', 'b', 1, 'XX es 10 + 10 = 20 y VI es 5 + 1 = 6. Junta: 20 + 6 = 26.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('601c3594-b691-55f4-99a7-651072749d60', '1ba9ee9b-1a03-56be-a845-b83723e972f9', '¿Cuántos días tiene un año bisiesto?', '366', '364', '365', '367', 'a', 2, 'En un año bisiesto febrero tiene un día más. Por eso el año suma 365 + 1 = 366 días.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5860a8a8-c412-54f8-acd4-c52cf4925b97', '1ba9ee9b-1a03-56be-a845-b83723e972f9', 'Ana sale a las 8:50 y llega a las 10:05. ¿Cuánto dura el camino?', '55 minutos', '75 minutos', '65 minutos', '85 minutos', 'b', 3, 'De 8:50 a 9:00 pasan 10 minutos, de 9:00 a 10:00 pasan 60 y de 10:00 a 10:05 pasan 5. Suma: 10 + 60 + 5 = 75.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ea360c25-9a70-56aa-a75a-43886f9ae52c', '5bba9f77-22d2-5cca-8ffe-4c76a1b91860', 'Escribe con cifras «dos millones trescientos mil cuarenta».', '2,300,004', '2,300,040', '2,030,040', '2,300,400', 'b', 1, 'Dos millones es 2,000,000, trescientos mil es 300,000 y cuarenta es 40. Juntos: 2,000,000 + 300,000 + 40 = 2,300,040.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6ce06f71-e733-5523-b83d-0f1a78080006', '5bba9f77-22d2-5cca-8ffe-4c76a1b91860', 'Redondea 6,451 a la centena.', '6,500', '6,400', '7,000', '6,450', 'a', 2, 'La cifra a la derecha de la centena es 5, y con 5 o más sube. El 4 pasa a 5 y quedan ceros.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5ec33738-f5e6-52ad-af3b-098e63e1028c', '5bba9f77-22d2-5cca-8ffe-4c76a1b91860', '¿Cuántas horas tiene un día completo?', '12 horas', '60 horas', '24 horas', '48 horas', 'c', 3, 'Un día tiene 24 horas, y el año tiene 12 meses. No se confunden: el 12 es de los meses y el 24 es de las horas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f56928ab-6ea3-53f9-847c-da9c911dde8d', '12de90a2-74ca-56d7-a55c-095dbbb1bdc6', '¿Qué es un órgano?', 'Un hilo que lleva mensajes al cerebro', 'Una parte del cuerpo con una tarea', 'Un grupo de huesos que sostiene el cuerpo', 'Un conjunto de aparatos que trabajan juntos', 'b', 1, 'Cada órgano hace una tarea, como el corazón o el estómago. Varios órganos que trabajan juntos forman un aparato o un sistema.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('57e0ac44-90cd-58a9-bd61-146693ce985e', '12de90a2-74ca-56d7-a55c-095dbbb1bdc6', '¿Qué aparato convierte la comida en energía?', 'El aparato urinario', 'El aparato respiratorio', 'El sistema circulatorio', 'El aparato digestivo', 'd', 2, 'La boca, el estómago y los intestinos forman el aparato digestivo. Toma lo útil de los alimentos y lo convierte en energía.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('fcaee0d8-9691-5550-bf83-58757eca7c7d', '12de90a2-74ca-56d7-a55c-095dbbb1bdc6', '¿Qué hace el sistema circulatorio?', 'Manda y recibe mensajes en el cuerpo', 'Limpia la sangre y saca el agua que sobra', 'Lleva el aire que respiras hasta el cuerpo', 'Mueve la sangre por todo el cuerpo', 'd', 3, 'El corazón es la bomba de este sistema y manda la sangre a todas partes. Limpiar la sangre le toca al aparato urinario.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0ec64000-02ec-5e32-b3a2-f49fc9a40b90', '17abce22-d27d-582c-884a-905bdb9cf0ad', '¿Cuántos grupos de alimentos tiene el Plato del Bien Comer?', 'Tres', 'Cuatro', 'Seis', 'Dos', 'a', 1, 'El Plato del Bien Comer divide los alimentos en tres grupos y ayuda a combinarlos. El número seis corresponde a las características de una alimentación correcta.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('633f5196-6203-505d-b97d-5e4200e071bc', '17abce22-d27d-582c-884a-905bdb9cf0ad', '¿Qué característica de la alimentación correcta significa que la comida lleva los tres grupos?', 'Equilibrada', 'Suficiente', 'Completa', 'Variada', 'c', 2, 'Una comida completa incluye los tres grupos del plato. Equilibrada habla de la medida de cada grupo y variada, de cambiar de alimentos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d85a4edc-9de0-59c4-95d2-f5982e7696e5', '17abce22-d27d-582c-884a-905bdb9cf0ad', '¿Cuál de estos alimentos es una leguminosa?', 'La tortilla', 'La lenteja', 'La guayaba', 'La avena', 'b', 3, 'La lenteja y el frijol son semillas que crecen en vaina. La avena y la tortilla son cereales, y la guayaba es una fruta.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d943690b-4a8d-5a5e-bbd9-2b815d7a80e8', 'db59ed62-1a82-5a81-8279-1de735beb5d2', '¿Qué debes hacer antes de comer o cocinar?', 'Lavarte las manos con agua y jabón', 'Frotarte las manos con una servilleta', 'Mojarte las manos solo con agua', 'Limpiarte las manos con la ropa', 'a', 1, 'Los gérmenes no se ven y pasan de las manos a la boca. El agua y el jabón los quitan.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a88ca96b-faea-5ae4-8244-6e516eba7f89', 'db59ed62-1a82-5a81-8279-1de735beb5d2', 'Según la lección, ¿cuánto tiempo se hierve el agua desde que burbujea para beberla con seguridad?', '5 minutos', '15 minutos', '30 segundos', '2 minutos', 'a', 2, 'El tiempo se cuenta desde que el agua burbujea. Hervirla ese tiempo mata los gérmenes que no se ven.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('66efafb2-1180-597f-982c-ab06b77b394e', 'db59ed62-1a82-5a81-8279-1de735beb5d2', '¿Qué es un contagio?', 'Un ser muy pequeño que puede causar una enfermedad', 'El paso de una enfermedad de una persona a otra', 'Las acciones que haces antes de que ocurra un problema', 'Un agua que es segura para beber, como la hervida', 'b', 3, 'El contagio es el paso de la enfermedad entre personas. El ser pequeño que la causa es el germen.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ffe1f7bd-c542-5eb8-87ab-5859399fa3b3', 'd210d9bb-b1c4-53c7-a0bc-90fbff574466', '¿Para qué sirve una vacuna?', 'Cura cualquier enfermedad que ya tienes', 'Prepara las defensas del cuerpo', 'Quita el cansancio y el estrés', 'Limpia la sangre de los gérmenes', 'b', 1, 'Con la vacuna, si el germen llega, el cuerpo ya sabe cómo responder. Así se evitan enfermedades graves.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c4affe73-d810-5cec-b26b-a0029386fddb', 'd210d9bb-b1c4-53c7-a0bc-90fbff574466', '¿Para qué sirve la cartilla de vacunación?', 'Para pagar las consultas del centro de salud', 'Para guardar las recetas de tus medicinas', 'Para anotar las vacunas que ya te pusieron', 'Para pedir las vacunas que te faltan', 'c', 2, 'En la cartilla se anotan las vacunas recibidas. Guárdala en un lugar seguro para revisar cuáles faltan.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8b09c669-5265-5a18-a4cd-527abe2ed5c0', 'd210d9bb-b1c4-53c7-a0bc-90fbff574466', '¿Cuál es el primer lugar para pedir servicios de salud?', 'La oficina del gobierno de tu municipio', 'Un hospital grande de tu ciudad', 'Una tienda de tu colonia', 'El centro de salud de tu colonia o comunidad', 'd', 3, 'Ahí te atienden por revisiones, vacunas y dudas. Si el caso lo requiere, te mandan a un hospital.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c29723ab-f0e2-5a73-8b14-6c01ed143c7f', '988e2f6f-ae9f-580b-8859-ad1c54459ce8', '¿Qué es el estrés?', 'El cansancio de un día de mucho trabajo', 'Una emoción que solo sienten los adultos', 'La respuesta del cuerpo ante una presión', 'Un dolor del cuerpo que dura varios días', 'c', 1, 'El cuerpo reacciona ante una presión. Un poco ayuda a actuar, pero mucho tiempo seguido cansa.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dafcd3d2-b71a-5287-bb1e-5827768822f3', '988e2f6f-ae9f-580b-8859-ad1c54459ce8', '¿Cuál es una señal de estrés?', 'Tener sed después de correr', 'Dolor de cabeza o de estómago', 'Sentir calor en un día soleado', 'Sentir hambre a la hora de comer', 'b', 2, 'El estrés puede notarse en el cuerpo. Otras señales son el cansancio, la falta de sueño y la tristeza o irritación frecuentes.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f332f267-00a1-5d89-bdda-c64dc94a948e', '988e2f6f-ae9f-580b-8859-ad1c54459ce8', '¿Qué acción ayuda al cuerpo y a la mente cuando sientes estrés?', 'Dormir menos para tener más tiempo', 'Quedarte sin moverte todo el día', 'Guardarte todo lo que sientes', 'Salir a caminar un rato', 'd', 3, 'Moverte ayuda a soltar la tensión. También ayudan respirar hondo, hablar con alguien de confianza y descansar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('63a5cb85-f032-5312-84ad-69e84b2cea48', '707d4035-38e9-5423-9ed1-05c5bf4092ef', '¿Qué es una adicción?', 'Una condición de salud', 'Una costumbre que solo tienen los jóvenes', 'Una enfermedad que se contagia por convivir', 'Un problema que solo afecta al cerebro', 'a', 1, 'La adicción es una condición de salud que afecta el cerebro, el cuerpo, la familia y el trabajo. Se puede tratar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c5f813a5-e187-56ad-84a3-c9d983446819', '707d4035-38e9-5423-9ed1-05c5bf4092ef', '¿Qué ayuda a prevenir una adicción?', 'Guardarte lo que te pesa', 'Evitar hablar del tema para no atraerlo', 'Informarte con fuentes confiables', 'Convivir con quien te presiona', 'c', 2, 'Saber del tema con ayuda de fuentes confiables, como tu centro de salud, te permite decidir mejor. Hablar de lo que sientes también protege.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('94390a42-a225-5a9e-9a17-50ed2402a6f6', '707d4035-38e9-5423-9ed1-05c5bf4092ef', '¿Qué puede hacer una persona que quiere dejar una adicción?', 'Acudir a su centro de salud', 'Aislarse para que nadie se entere', 'Resolverlo sin ayuda de nadie', 'Esperar a que se le quite sola', 'a', 3, 'Una adicción se puede tratar y pedir ayuda a tiempo es una decisión valiente. También existe la Línea de la Vida, gratuita y de 24 horas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('28f552fb-1053-5f43-bdcf-a077d64e555b', '7d1799ef-2315-551a-90fd-a570df92540d', '¿Qué haces primero cuando ocurre un accidente?', 'Mover a la persona de inmediato', 'Esperar a que llegue otra persona', 'Darle algún remedio casero', 'Mantener la calma', 'd', 1, 'Con calma piensas mejor, y un lugar seguro evita que haya más lesionados. Después decides si hay que llamar al 911.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5de8fa33-8d81-5155-908f-7c9cb04b2aae', '7d1799ef-2315-551a-90fd-a570df92540d', '¿Qué haces con una quemadura leve?', 'Ponerla bajo agua fría corriente', 'Cubrirla con mantequilla', 'Frotarla con una tela áspera', 'Ponerle pasta dental encima', 'a', 2, 'El agua fría corriente es la acción básica y segura. Los remedios caseros pueden empeorar la quemadura.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('342ac55f-8803-566c-bde4-63940abd4f09', '7d1799ef-2315-551a-90fd-a570df92540d', '¿En cuál caso debes llamar al 911?', 'Una quemadura leve de la estufa', 'Una cortada pequeña que ya lavaste', 'Una persona que no respira bien', 'Un raspón en la rodilla', 'c', 3, 'No respirar bien es una emergencia grave. Las heridas pequeñas se atienden con agua, jabón y una tela limpia.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('05f8858e-cca8-518e-9467-d37c465b9c05', '75a8efde-bb52-54ab-a989-b98eb69969f6', 'Arroz, frijoles y una naranja. ¿Qué grupos del Plato del Bien Comer tiene esta comida?', 'Cereales y leguminosas, sin frutas', 'Cereales y frutas, sin leguminosas', 'Cereales, leguminosas y frutas', 'Leguminosas y frutas, sin cereales', 'c', 1, 'El arroz es cereal, el frijol es leguminosa y la naranja es fruta. Por eso la comida lleva los tres grupos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0da7479b-6686-5dd7-8c03-0794aba80494', '75a8efde-bb52-54ab-a989-b98eb69969f6', 'Una persona siente angustia por mucho tiempo. ¿Qué puede hacer?', 'Tomar algún remedio casero y seguir con sus tareas', 'Acudir a su centro de salud o llamar a la Línea de la Vida', 'Esperar varias semanas y no contarle a nadie lo que siente', 'Dormir más horas y evitar hablar con otras personas', 'b', 2, 'La angustia que dura mucho necesita apoyo. El centro de salud y la Línea de la Vida pueden orientarla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6796f5c3-92df-5294-b735-2f81c57e6904', '75a8efde-bb52-54ab-a989-b98eb69969f6', 'Una persona no responde después de una caída. ¿Qué haces?', 'Sacúdela para que despierte', 'Dale agua y espera a que mejore', 'Levántala y llévala a su casa', 'No la muevas y llama al 911', 'd', 3, 'Moverla puede empeorar una lesión en cabeza, cuello o espalda. Lo seguro es llamar al 911 y esperar ayuda.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b0ed0b9b-3cb2-596f-904e-072fb32548e2', 'd95163f9-a8be-521f-99b6-547893e277d4', '¿Cuál de estas frases está bien escrita?', 'Luis vive en méxico.', 'Luis Vive en Oaxaca.', 'Luis vive en Puebla.', 'luis vive en Toluca.', 'c', 1, 'Los nombres de personas y de lugares llevan mayúscula, y las demás palabras van con minúscula. Solo la primera frase cumple esa regla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7e7a91d9-869b-5185-a7cf-44ca10ec9fe9', 'd95163f9-a8be-521f-99b6-547893e277d4', '¿Qué signo separa los elementos de una lista, como frutas, verduras y pan?', 'La coma', 'El punto', 'El punto y coma', 'Los dos puntos', 'a', 2, 'La coma marca una pausa corta y separa los elementos de una lista. El punto cierra una oración y el punto y coma marca una pausa más larga que la coma.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('498a5db8-680a-553c-9344-8ffbd3576bf7', 'd95163f9-a8be-521f-99b6-547893e277d4', '¿Cuál de estas frases con un día de la semana está bien escrita?', 'El sábado voy al Mercado.', 'el jueves voy al mercado.', 'El Martes voy al mercado.', 'El lunes voy al mercado.', 'd', 3, 'Los días de la semana se escriben con minúscula, y la frase empieza con mayúscula. Las otras opciones usan mayúscula donde no toca o la omiten al inicio.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('fddbff76-aed9-5afb-91fb-8335227fd2e0', 'c431580b-079b-5337-922e-fcbf4ac443e2', 'En la oración «El camión llegó tarde», ¿cuál es el sujeto?', 'llegó', 'tarde', 'El camión', 'llegó tarde', 'c', 1, 'El sujeto es de quien se habla, y se halla preguntando quién hace la acción. Aquí el camión llegó, y lo demás es el predicado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('241f3bb6-08ae-53b9-827b-2b77d16897e3', 'c431580b-079b-5337-922e-fcbf4ac443e2', '¿Qué es el predicado de una oración?', 'Lo que se dice del sujeto, con el verbo', 'El nombre de quien escribe la oración', 'La primera palabra, escrita con mayúscula', 'La persona o cosa de quien se habla', 'a', 2, 'El predicado es todo lo que se dice del sujeto y siempre incluye el verbo. El sujeto, en cambio, es la persona o cosa de quien se habla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2ea9e7e7-a639-53f4-9269-d8d878b86667', 'c431580b-079b-5337-922e-fcbf4ac443e2', '¿Cuál de estas opciones es una oración completa?', 'La vecina de Luis.', 'Rosa compró tortillas.', 'Las tortillas de Rosa.', 'Tortillas frescas y calientes.', 'b', 3, 'Una oración dice algo completo: aquí se sabe quién hizo qué. Las otras opciones solo nombran personas o cosas, y no dicen qué pasó.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e6b96685-6f90-5f18-90ac-c1c923c100cc', '401765fd-0cb6-52e2-a166-7a86dcb04d46', 'En «Rosa vende tamales calientes», ¿qué palabra es el adjetivo?', 'vende', 'tamales', 'calientes', 'Rosa', 'c', 1, 'El adjetivo dice cómo es un sustantivo, y aquí «calientes» dice cómo son los tamales. «Rosa» y «tamales» nombran, y «vende» es la acción.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('86d64eb1-880d-550d-8208-97bda14e6049', '401765fd-0cb6-52e2-a166-7a86dcb04d46', '¿Cuál de estas palabras es un verbo?', 'mercado', 'comer', 'casa', 'blanca', 'b', 2, 'El verbo dice una acción: comer. Casa y mercado nombran cosas o lugares, y blanca dice cómo es algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d3a6ba6a-ca0d-593e-9b6c-6178a0a0d50b', '401765fd-0cb6-52e2-a166-7a86dcb04d46', '¿Qué hace el sustantivo en una oración?', 'Nombra personas, animales, cosas o lugares', 'Marca el final de una oración con punto', 'Dice cómo es una persona, animal o cosa', 'Dice la acción que hace una persona', 'a', 3, 'El sustantivo nombra: Rosa, tamales, casa, mercado. Decir cómo es algo es trabajo del adjetivo, y decir la acción es trabajo del verbo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('546b3a30-f3c6-5140-8591-97a7500ed252', '6bd652d0-96a2-5f8c-aa1b-e2533f7aa31c', '¿Qué escribes al final de un recado para que sepan quién lo manda?', 'El saludo', 'La firma', 'El lugar', 'La hora', 'b', 1, 'La firma es tu nombre al final del recado, y dice quién lo escribió. La hora y el lugar dicen cuándo y dónde.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('eda0b027-e48e-5249-a4f0-5eb08dcae308', '6bd652d0-96a2-5f8c-aa1b-e2533f7aa31c', 'En un recado, ¿qué dato responde a la pregunta «¿Cuándo y dónde?»', 'El mensaje en pocas oraciones', 'El nombre de quien lo manda', 'La hora, el día o el lugar', 'El nombre de quien lo recibe', 'c', 2, 'Cuándo y dónde se contestan con la hora, el día o el lugar. El nombre de quien recibe va al inicio y la firma va al final.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('daef6d33-eede-5a37-9c4d-a049e2374beb', '6bd652d0-96a2-5f8c-aa1b-e2533f7aa31c', 'En un recado, después del saludo con dos puntos, como «Luis:», ¿cómo se escribe la primera palabra que sigue?', 'Con mayúscula inicial', 'Todo el renglón en mayúsculas', 'Con minúscula inicial', 'Con minúscula, como después de una coma', 'a', 3, 'Después del saludo con dos puntos se usa mayúscula. Por eso se escribe «Luis: Salí al mercado» y no «Luis: salí al mercado».') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bbd58b7e-ba1e-5123-8007-a117cf1fb1b1', '5a0c7f90-004e-592f-be5f-bfb2d24ff23a', 'Luis quiere escribir una palabra con el sonido «inbitar». ¿Cuál opción está bien escrita?', 'imbitar', 'invitar', 'imvitar', 'inbitar', 'b', 1, 'Después de n va v, por eso se escribe invitar. La regla de la m aplica solo antes de b, como en también.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('44917c71-14ec-59e6-b3ba-66683e7c8612', '5a0c7f90-004e-592f-be5f-bfb2d24ff23a', '¿Cómo se escribe el plural de la palabra «lápiz»?', 'lápizes', 'lápises', 'lápicez', 'lápices', 'd', 2, 'Si una palabra termina en z, su plural lleva c: lápiz se vuelve lápices, igual que luz se vuelve luces.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5ecff4eb-530a-5ab4-91d7-be95d6160b9b', '5a0c7f90-004e-592f-be5f-bfb2d24ff23a', '¿Cuál de estas palabras está bien escrita?', 'yelo', 'hielo', 'ielo', 'jelo', 'b', 3, 'Las palabras que empiezan con hie- llevan h, aunque no se oiga: hielo, hueso, huir.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e6ed1495-c845-5ef0-866a-96192e41113b', '003b09f1-4ff5-5c35-8fad-0fed65a4a92b', 'En una palabra esdrújula, ¿en qué sílaba cae la fuerza?', 'En la primera sílaba siempre', 'En la penúltima sílaba', 'En la última sílaba', 'En la antepenúltima sílaba', 'd', 1, 'En las esdrújulas la fuerza cae en la antepenúltima sílaba, la tercera contando desde el final. Por eso siempre llevan tilde.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('80c86a45-60a3-5dc6-a55e-124701c4c895', '003b09f1-4ff5-5c35-8fad-0fed65a4a92b', '¿Cuál de estas palabras es aguda y lleva tilde?', 'camión', 'papel', 'mesa', 'casa', 'a', 2, 'Camión es aguda: la fuerza cae en la última sílaba. Las agudas llevan tilde si terminan en n, s o vocal.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7ae551b4-54c9-5d9d-a347-8bf9e098c4bc', '003b09f1-4ff5-5c35-8fad-0fed65a4a92b', 'Una palabra grave, ¿cuándo lleva tilde?', 'Cuando la fuerza cae en la última sílaba', 'Cuando no termina en n, s ni vocal', 'Cuando termina en n, s o vocal', 'Siempre, sin importar cómo termine', 'b', 3, 'Las graves llevan tilde si no terminan en n, s ni vocal: árbol, fácil. Mesa no lleva tilde porque termina en vocal.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6a584d35-30fe-5ea9-a649-b338f8a9fd64', 'c1d168ef-ac04-57b1-b6fb-3e9a8dfe69b6', '¿Qué dice la primera oración de un párrafo?', 'El cierre que termina el tema', 'Un detalle sobre el tema del párrafo', 'La firma de quien escribe el texto', 'La idea principal: de qué trata el párrafo', 'd', 1, 'La primera oración presenta la idea principal. Después van los detalles, y al final una oración que cierra el tema.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8bb289fe-2eb7-52d3-921a-e5cc5f7ecacf', 'c1d168ef-ac04-57b1-b6fb-3e9a8dfe69b6', '¿Cuál de estas palabras sirve como conector para ordenar las ideas?', 'blanca', 'verdura', 'comer', 'luego', 'd', 2, 'Un conector ayuda a seguir el orden de las ideas: primero, luego, después, al final. Pan, mesa y verdura son sustantivos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('70e2581e-affc-5d1e-88fb-02084018dd20', 'c1d168ef-ac04-57b1-b6fb-3e9a8dfe69b6', '¿Qué quiere decir que un párrafo termina con punto y aparte?', 'Que la idea sigue en el mismo renglón', 'Que todo el texto se acaba por completo', 'Que el párrafo termina y sigues en otro renglón', 'Que la oración termina con una pausa corta', 'c', 3, 'El punto y aparte cierra un párrafo. Después de él empiezas otro renglón con mayúscula para escribir un párrafo nuevo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('aa8c6194-7c22-5e7e-b49a-6bdf63ad36e0', '9d4dbaf5-0f75-5cd8-b020-93b04fd49e13', 'Según el repaso, ¿cuándo se escribe con mayúscula?', 'Al empezar y después de un punto', 'Después de cada coma', 'Antes de cada verbo', 'Al final de cada renglón', 'a', 1, 'La mayúscula marca el inicio de un texto y el inicio de cada oración que sigue a un punto. La coma no cierra la oración.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ba50bcbb-eaba-5360-8ea4-23162dedcbdd', '9d4dbaf5-0f75-5cd8-b020-93b04fd49e13', '¿Qué le falta a este recado: «Salí al banco y regreso a las 5»?', 'Nada, el recado ya está completo', 'Solo la fecha del día', 'El nombre de quien lo recibe y la firma', 'Una oración más sobre el banco', 'c', 2, 'El recado ya tiene el mensaje, el lugar y la hora. Pero no dice para quién es ni quién lo manda.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2aeb97e8-8499-5116-99a0-aefbe5228c62', '9d4dbaf5-0f75-5cd8-b020-93b04fd49e13', '¿Cómo se completa «tam_ién» y por qué?', 'Con b, porque después de n va b', 'Con v, porque la v se oye más suave', 'Con v, porque antes de v va m', 'Con b, porque antes de b va m', 'd', 3, 'Antes de b va m, así que se escribe también con b. La regla de la v aplica después de n, y aquí hay una m.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('224a71fb-8833-5995-b177-9ff94544e9a2', '5be1633e-994a-5a2c-a00b-a9890397824c', '¿Qué es multiplicar?', 'Quitar una cantidad varias veces', 'Sumar cantidades que son distintas', 'Partir una cantidad en partes iguales', 'Sumar la misma cantidad varias veces', 'd', 1, 'Multiplicar acorta una suma que se repite. En lugar de sumar 15 + 15 + 15 + 15, se calcula 4 × 15.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f8becbce-996a-5028-9f04-d30276624527', '5be1633e-994a-5a2c-a00b-a9890397824c', 'Luis compra 8 cajas con 6 huevos cada una. ¿Cuántos huevos lleva?', '54', '42', '14', '48', 'd', 2, 'Cada caja trae la misma cantidad, así que se multiplica: 8 × 6 = 48. Sumar 8 + 6 solo daría 14.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('20cace15-658b-5cc7-be8a-5af276485d69', '5be1633e-994a-5a2c-a00b-a9890397824c', '¿Cuánto es 25 × 0?', '0', '250', '25', '1', 'a', 3, 'Un número por 0 siempre da 0, porque no hay nada que sumar. Por eso 25 × 0 = 0.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6517b4ad-862e-56e5-be49-57a3411ef64b', '3dd3b890-1013-5d2c-b913-4a690cfa24ed', '¿Cuánto es 12 × 1,000?', '1,212', '12,000', '120,000', '1,200', 'b', 1, 'Por 1,000 se agregan tres ceros al número. Así, 12 × 1,000 = 12,000.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cbea8522-da1b-5be1-ae69-d45349678ed1', '3dd3b890-1013-5d2c-b913-4a690cfa24ed', 'Según el método de la lección, al multiplicar 35 × 24, ¿por cuál parte de 24 se multiplica primero?', 'Por las unidades', 'Por el 35', 'Por las decenas', 'Por la suma de sus cifras', 'a', 2, 'Primero se multiplica por las unidades y después por las decenas. Al final se suman los dos resultados.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5f834bbf-35b4-5cbf-9968-fa8736c73d36', '3dd3b890-1013-5d2c-b913-4a690cfa24ed', 'Una tienda vende 45 bolsas cada día durante 12 días. ¿Cuántas bolsas vende en total?', '540', '90', '590', '450', 'a', 3, 'Se multiplica por las unidades y por las decenas: 45 × 2 = 90 y 45 × 10 = 450. Luego 90 + 450 = 540.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5ec53f01-af1b-5f6d-b03e-6b07d3d8293c', 'd70f12e6-c106-5e3f-92f9-b50a46275236', 'Cinco compañeros reparten $650 en partes iguales. ¿Cuánto le toca a cada uno?', '$3,250', '$130', '$120', '$645', 'b', 1, 'Repartir en partes iguales es dividir: 650 ÷ 5 = 130. Cada compañero recibe $130.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1ddfd622-22fa-57dd-98be-ab93f2739afe', 'd70f12e6-c106-5e3f-92f9-b50a46275236', 'En 54 ÷ 9 = 6, ¿cuál número es el divisor?', '9', '8', '54', '6', 'a', 2, 'El divisor es el número entre el que se divide. En 54 ÷ 9 = 6, el divisor es 9.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('79e1f8be-47b1-5477-8c89-56698a38a230', 'd70f12e6-c106-5e3f-92f9-b50a46275236', '¿Cómo se comprueba el resultado de una división?', 'Dividiendo el cociente entre el dividendo', 'Sumando el cociente con el divisor', 'Restando el divisor al dividendo', 'Multiplicando el cociente por el divisor', 'd', 3, 'La multiplicación deshace la división. El cociente por el divisor debe dar el dividendo; por ejemplo, 5 × 250 = 1,250.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('97538ab4-a0c3-5e2f-b8f9-6aecf98684bd', 'e3ac081e-f40f-544b-80e1-9f495dd69d40', '¿Qué es el residuo en una división?', 'El resultado final de la división', 'El número entre el que se divide', 'La cantidad que se quiere dividir', 'La parte que sobra cuando no sale exacta', 'd', 1, 'El residuo es la parte que no se alcanza a repartir. Si es 0, la división es exacta.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4cad0f0e-7d48-5550-882b-af99362e9093', 'e3ac081e-f40f-544b-80e1-9f495dd69d40', 'Al dividir 29 ÷ 6, el cociente es 4. ¿Cuál es el residuo?', '6', '5', '24', '4', 'b', 2, 'Se comprueba con 6 × 4 = 24 y 24 + 5 = 29. El residuo es lo que falta para llegar al dividendo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('03e23293-eafb-5179-a98a-73c98892a996', 'e3ac081e-f40f-544b-80e1-9f495dd69d40', 'Hay 38 personas y cada autobús lleva 10. ¿Cuántos autobuses se necesitan para llevar a todas?', '8', '5', '4', '3', 'c', 3, 'Como 38 ÷ 10 = 3 con residuo 8, sobran 8 personas. Ellas necesitan otro autobús, así que son 4.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1cb27d53-4467-5cdb-a1f6-c2a752dbf5fe', '1bbf3f9e-4e50-5f01-a35f-30e7c669c0ba', 'Según los pasos de la lección, ¿qué se hace primero al resolver un problema?', 'Sumar todos los números del texto', 'Elegir la operación sin leer todo', 'Leer con calma y buscar la pregunta', 'Escribir la respuesta completa', 'c', 1, 'Antes de calcular hay que saber qué se pregunta. Con eso se eligen los datos y la operación.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1275020c-0ff8-552e-9390-baab13e8c0e8', '1bbf3f9e-4e50-5f01-a35f-30e7c669c0ba', 'Mario ahorra $120 cada semana durante 6 semanas. ¿Cuánto junta?', '$700', '$720', '$20', '$126', 'b', 2, 'El ahorro se repite cada semana, así que se multiplica: 6 × $120 = $720.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d2b94198-18f8-592f-b5e4-24e718e5917f', '1bbf3f9e-4e50-5f01-a35f-30e7c669c0ba', 'Ana compra 4 bolsas de arroz a $35 cada una y paga con $200. ¿Cuánto le regresan?', '$165', '$60', '$140', '$235', 'b', 3, 'Primero se multiplica: 4 × $35 = $140. Después se resta: $200 − $140 = $60.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cb289690-484c-530c-9725-414b5e8c1ef1', 'd7fecf1b-80a0-5039-9cc5-77045a8f7f26', '¿Cuál de estos números es múltiplo de 3?', '16', '25', '18', '20', 'c', 1, 'Los múltiplos de 3 salen al contar de 3 en 3: 3, 6, 9, 12, 15, 18. Por eso 18 es múltiplo de 3.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b669bdcb-a531-5f4d-92e1-5fc98b9b8acd', 'd7fecf1b-80a0-5039-9cc5-77045a8f7f26', '¿Cuál de estos números es divisor de 12?', '8', '5', '4', '7', 'c', 2, 'Un divisor divide al número sin dejar residuo. Como 12 ÷ 4 = 3, el 4 es divisor de 12.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('99f00c8c-860c-5d5f-8539-721dba566684', 'd7fecf1b-80a0-5039-9cc5-77045a8f7f26', '¿Cuánto residuo deja un número impar al repartirlo entre 2?', '1', '3', '2', '0', 'a', 3, 'Un impar siempre deja residuo 1 al repartirlo entre 2. Por ejemplo, 35 ÷ 2 = 17 con residuo 1.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('468c2483-3291-50cf-ac60-9fd332b5a0fc', '5a1e76f6-e442-5484-861a-433f940c48ac', '¿Cuánto da 5 + 4 × 3?', '12', '24', '27', '17', 'd', 1, 'Primero se multiplica: 4 × 3 = 12. Después se suma: 5 + 12 = 17.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1e0b62d6-1623-5b28-8ed5-e41370863dd6', '5a1e76f6-e442-5484-861a-433f940c48ac', '¿Cuánto da 30 − (4 + 6)?', '20', '40', '26', '32', 'a', 2, 'Lo que está dentro del paréntesis se hace primero: 4 + 6 = 10. Luego 30 − 10 = 20.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e29643d7-7bab-505d-9aa5-19730d36f603', '5a1e76f6-e442-5484-861a-433f940c48ac', '¿Cuánto da 36 ÷ 6 × 2?', '8', '12', '14', '3', 'b', 3, 'Se avanza de izquierda a derecha: 36 ÷ 6 = 6 y después 6 × 2 = 12.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4f5284b3-33f9-53b2-ac22-4850f8758fa6', '9746c070-a3f1-5132-a42d-992776643199', 'Según el repaso, ¿cómo se comprueba una división con residuo?', 'Residuo × divisor + cociente', 'Cociente + divisor + residuo', 'Dividendo × divisor − residuo', 'Cociente × divisor + residuo', 'd', 1, 'El cociente por el divisor da la parte repartida. Al sumar el residuo se llega de nuevo al dividendo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('70577cde-384f-5458-b951-83a0935ac89b', '9746c070-a3f1-5132-a42d-992776643199', 'Hay 70 sillas para filas de 8. ¿Cuántas filas completas salen?', '6', '7', '8', '9', 'c', 2, '70 ÷ 8 = 8 con residuo 6. Solo cuentan las filas completas, así que salen 8 y sobran 6 sillas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('88e28b56-7189-5086-87de-c9cc84e2390b', '9746c070-a3f1-5132-a42d-992776643199', 'Se reparten $840 entre 4 personas en partes iguales. ¿Cuánto recibe cada una?', '$420', '$3,360', '$210', '$836', 'c', 3, 'Dividir es partir en partes iguales: 840 ÷ 4 = 210. Se comprueba con 4 × 210 = 840.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('08d617d3-b8f1-5e2c-a417-8cf0bd7ef8ee', '660e4c70-7fe2-553f-865f-3d87f18863f9', 'Rosa quiere escribir una carta en la computadora. ¿Qué parte sirve para escribir?', 'El ratón', 'El teclado', 'La bocina', 'La pantalla', 'b', 1, 'El teclado tiene las letras y los números para escribir. El ratón mueve una flecha y la pantalla muestra lo que haces.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d35665f4-b90b-54c5-9451-ec7b8db7c31a', '660e4c70-7fe2-553f-865f-3d87f18863f9', 'Rosa quiere tomar una foto con su celular. ¿Qué parte usa?', 'La cámara', 'La bocina', 'El micrófono', 'El botón del volumen', 'a', 2, 'La cámara es la parte del celular que toma fotos. El micrófono recoge tu voz y la bocina da el sonido.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2c27b2e4-6094-5138-ba7c-f814fbf48d26', '660e4c70-7fe2-553f-865f-3d87f18863f9', 'Rosa terminó de escribir su lista y va a apagar el equipo. ¿Qué debe hacer antes?', 'Subir el volumen', 'Mover el ratón', 'Guardar su trabajo', 'Abrir otra aplicación', 'c', 3, 'Si guardas el archivo antes de cerrar y apagar, lo encuentras al día siguiente. Si no, el trabajo se puede perder.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e787e3e0-f6d0-531d-b6fc-f8e63901f170', 'a4520f5c-d86e-5e91-8587-89eda07c26e3', '¿Qué es internet?', 'Una pieza que guarda los archivos del equipo', 'Un programa que sirve para escribir cartas', 'Una pantalla que muestra las páginas guardadas', 'Una red que conecta equipos de todo el mundo', 'd', 1, 'Internet une millones de equipos en una sola red. Gracias a ella puedes ver páginas, mandar mensajes y consultar información.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8fff337a-ec16-588f-8bba-c64e50d17125', 'a4520f5c-d86e-5e91-8587-89eda07c26e3', 'Rosa escribe «precio del pollo» en el cuadro del buscador. ¿Cómo se llaman esas palabras?', 'Palabras de ruta', 'Palabras clave', 'Palabras nuevas', 'Palabras de anuncio', 'b', 2, 'Las palabras que escribes en el buscador para encontrar algo se llaman palabras clave. Conviene que sean cortas y claras.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1f311cc1-3fed-5dfc-86be-ff0946bc6b49', 'a4520f5c-d86e-5e91-8587-89eda07c26e3', 'Luis encuentra una página con una receta. ¿Cómo puede saber si es confiable?', 'Leyendo solo el primer resultado', 'Confiando en la página que dice «anuncio»', 'Comparándola con otras páginas', 'Fijándose en cuántas fotos tiene', 'c', 3, 'Si dos o tres páginas dicen lo mismo, la información es más confiable. Salir primero en la lista no la hace mejor.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('51a1dc3e-e106-5efc-9331-a8e2c06d8f57', '1f15a688-5e2c-58ff-80a6-e891bd25e6cb', '¿Qué tres partes tiene una dirección de correo electrónico?', 'Asunto, mensaje y adjunto', 'Teléfono, domicilio y nombre del servicio', 'Nombre de usuario, @ y servicio de correo', 'Nombre completo, saludo y despedida', 'c', 1, 'La dirección junta el nombre de usuario, el signo @ y el servicio de correo. Cada dirección es única, como el domicilio de una casa.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('64ddaf75-f3d6-59bc-97bc-cea45fd814a2', '1f15a688-5e2c-58ff-80a6-e891bd25e6cb', 'Rosa quiere mandar su currículum junto con el texto del correo. ¿Qué parte usa?', 'La bandeja de entrada', 'El adjunto', 'El asunto', 'El campo «Para»', 'b', 2, 'El adjunto es el archivo que va junto con el mensaje. En «Para» va la dirección y en el asunto, de qué trata el correo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d672f647-fa60-5461-af4b-1eb3b8bec6e3', '1f15a688-5e2c-58ff-80a6-e891bd25e6cb', 'Luis recibe un correo de alguien que no conoce, con un archivo adjunto. ¿Qué hace?', 'Responde con sus datos personales', 'Abre el archivo para ver qué es', 'No abre el archivo adjunto', 'Reenvía el archivo a sus amigos', 'c', 3, 'Algunos mensajes son publicidad o engaños. Si no conoces a quien escribe, lo más seguro es no abrir sus archivos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5b62b32e-28cc-53aa-a793-ff418332e4d8', '43f4190f-4b0f-53dd-b949-0235776c810d', 'Luis recibe un mensaje con un enlace para sacar su cita. ¿Cómo entra al sitio oficial?', 'Toca el enlace del mensaje', 'Entra por un anuncio de redes', 'Elige la página más bonita', 'Escribe la dirección él mismo', 'd', 1, 'Algunas páginas copian el diseño oficial para engañar. Por eso conviene escribir la dirección y no entrar desde un mensaje.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0850d5fa-374c-5404-9b08-07dcdc4dbe1d', '43f4190f-4b0f-53dd-b949-0235776c810d', 'Al terminar un trámite en línea, el sitio da un folio. ¿Para qué sirve guardarlo?', 'Para abrir un correo nuevo', 'Para cambiar la contraseña', 'Para aclararlo si algo falla', 'Para pagar el trámite', 'c', 2, 'El folio identifica tu solicitud. Con ese número puedes aclarar el trámite si algo sale mal.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2591e786-42a5-58f5-b997-8be126821e04', '43f4190f-4b0f-53dd-b949-0235776c810d', 'Un trámite en línea tiene costo. ¿Dónde se debe pagar?', 'En el sitio oficial de la institución', 'Por mensaje a un número desconocido', 'En la página que te mandan por chat', 'En la cuenta de una persona que ofrece ayuda', 'a', 3, 'El pago se hace en el sitio oficial o con los datos que da la institución. Nunca se paga a una cuenta personal ni por mensaje.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('12e0a82d-9e51-57f3-b513-2027afb22113', 'ee702ff3-ce45-597e-9c7a-a2f96a0c45f1', 'Según la lección, ¿con cuántos caracteres o más conviene que cuente una contraseña segura?', 'Doce o más', 'Cuatro o más', 'Seis o más', 'Diez o menos', 'a', 1, 'Una contraseña larga es más difícil de adivinar. Un carácter puede ser una letra, un número o un signo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dc713757-8975-5628-bf6f-44530da9bef1', 'ee702ff3-ce45-597e-9c7a-a2f96a0c45f1', 'Rosa usa la misma contraseña en su correo y en otras cuentas. ¿Qué le conviene hacer?', 'Cambiar solo su nombre de usuario', 'Usar una distinta en cada cuenta', 'Usar una corta y fácil de recordar', 'Compartir la clave con un familiar', 'b', 2, 'Si una clave se repite y alguien la descubre, puede entrar a todas tus cuentas. Una contraseña distinta en cada una te protege mejor.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0a90a280-d1d7-5e21-9396-75c23a9dc013', 'ee702ff3-ce45-597e-9c7a-a2f96a0c45f1', 'Un compañero le pide a Luis su contraseña «para ayudarle». ¿Qué hace Luis?', 'Se la da si es su amigo', 'Se la manda por mensaje', 'Se la da solo por un día', 'No se la da a nadie', 'd', 3, 'La contraseña es la llave de tus cuentas y es personal. Compartirla deja la puerta abierta a otras personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4890aad4-8c67-551d-9876-8c0259cac188', 'dbe124f9-b534-5128-af23-5f796172d350', '¿Qué es la privacidad en una red social?', 'Lo que otros comparten sobre ti', 'Lo que te mandan tus amigos al perfil', 'Lo que publicas para todas las personas', 'Aquello que tú decides no mostrar a los demás', 'd', 1, 'La privacidad es lo que tú decides guardar para ti. Antes de publicar, conviene preguntarte quién lo va a ver.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('fb19efc3-46c7-543d-acd3-9c6658af6914', 'dbe124f9-b534-5128-af23-5f796172d350', 'Rosa quiere subir una foto donde sale su vecina. ¿Qué debe hacer antes?', 'Pedirle permiso a ella', 'Escribir el nombre de su calle', 'Publicar dónde están ahora', 'Bloquear el perfil de su vecina', 'a', 2, 'La foto es de otra persona y ella decide si se publica. Por eso se pide permiso antes de subirla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cb061e6c-94ed-5372-8e0e-d45c78d0567b', 'dbe124f9-b534-5128-af23-5f796172d350', 'Alguien desconocido insulta a Luis en un comentario. ¿Qué puede hacer?', 'Borrar su perfil y abrir otro', 'Bloquearlo y reportar el mensaje', 'Responderle con otros insultos', 'Compartir su comentario con todos', 'b', 3, 'Responder con insultos no ayuda. Bloquear a la persona evita que te escriba, y reportar el mensaje avisa del mal trato.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b7d740ca-bfa6-51ae-a803-41e8b7205758', '396a37fc-a9ed-52ed-88ff-9f5c3ba51578', 'Rosa ve que el mapa dice 30 minutos de ruta. ¿Por qué ese tiempo es solo aproximado?', 'Porque el mapa no conoce las calles', 'Porque el celular se mueve de lugar', 'Porque la ruta cambia cada semana', 'Porque el tráfico cambia', 'd', 1, 'La aplicación calcula cuánto tarda el camino, pero el tráfico cambia durante el día. Por eso conviene salir con tiempo de sobra.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('34bdda46-b234-5db1-ba11-b9a1a6becd61', '396a37fc-a9ed-52ed-88ff-9f5c3ba51578', 'Luis anota su cita del jueves en el calendario. ¿Cómo se llama cada fecha anotada?', 'Un evento', 'Una nube', 'Un respaldo', 'Una ruta', 'a', 2, 'Cada cita o actividad que anotas en el calendario es un evento. Después puedes agregarle un aviso.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('35d10d07-09ad-5b13-a6cd-af2bbada15ea', '396a37fc-a9ed-52ed-88ff-9f5c3ba51578', 'Rosa quiere proteger un documento por si su equipo se descompone. ¿Qué hace?', 'Lo guarda solo en el equipo', 'Hace una copia en otro lugar', 'Lo deja abierto en la pantalla', 'Cambia el nombre del archivo', 'b', 3, 'Una copia de respaldo en otra parte, como una memoria USB o la nube, evita que pierdas el documento si el equipo falla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ca3ddab8-37ef-5d6a-a0a9-36f2e48f4069', 'ec4afa0b-d12a-51ee-8cb4-f11ed50f40cb', 'Un mensaje te mete prisa y te pide tu clave. ¿Qué debes pensar?', 'Que es un aviso importante del banco', 'Que es un premio para ti', 'Que debes contestar rápido', 'Que puede ser un fraude', 'd', 1, 'Quien quiere engañarte busca que actúes con prisa. Pedir claves por mensaje es señal clara de fraude.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5017e4af-b905-5cca-9119-4f99cfa5e806', 'ec4afa0b-d12a-51ee-8cb4-f11ed50f40cb', 'Rosa quiere usar una red social con cuidado. ¿Qué debe cuidar?', 'Su privacidad', 'Qué tan rápido publica', 'Cuántas fotos sube', 'Cuántos amigos tiene', 'a', 2, 'En una red social lo que publicas puede llegar lejos. Por eso se cuida la privacidad y no se publican datos personales.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3ff690cb-8b7c-56f9-b9d5-c070df37bac6', 'ec4afa0b-d12a-51ee-8cb4-f11ed50f40cb', '¿Cómo debe guardar Luis sus archivos?', 'Sin nombre y en cualquier carpeta', 'Con nombre claro y sin copia', 'Con nombre claro y respaldo', 'Con un nombre largo y sin respaldo', 'c', 3, 'Un nombre claro te ayuda a encontrar el archivo. El respaldo evita perderlo si el equipo se descompone.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('741c64f8-787f-538f-bf82-f001b7266908', '514e38d2-9e32-523b-868b-05eb69428cd2', '¿Qué es el propósito de un texto?', 'El número de páginas del texto', 'Lo que quiere lograr el autor', 'El tema del que habla el texto', 'El lugar donde se publica', 'b', 1, 'El propósito responde a la pregunta «¿para qué fue escrito?». Saber lo que el autor busca ayuda a leer con más atención.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('edd59328-2be5-5f0e-99af-45d04cfd54b2', '514e38d2-9e32-523b-868b-05eb69428cd2', 'Un papel dice: «Corta la cebolla. Fríela con aceite. Agrega el jitomate». ¿Qué tipo de texto es?', 'Narrativo', 'Publicitario', 'Informativo', 'Instructivo', 'd', 2, 'Las palabras «corta», «fríela» y «agrega» son órdenes que se siguen en orden. Un texto que explica pasos para hacer algo es instructivo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d390d635-07fa-5215-a025-dcda48fd9182', '514e38d2-9e32-523b-868b-05eb69428cd2', 'Un volante dice: «Las mejores tortillas, ¡ven y compra hoy!». ¿Cuál es su propósito?', 'Darte datos reales como una noticia', 'Convencerte de comprar algo', 'Explicarte pasos para cocinar', 'Contarte una historia con personajes', 'b', 3, 'El volante no da datos que se puedan comprobar y te invita a comprar. Los textos que buscan convencer son de opinión o publicidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('508cd361-93ed-5711-b8ef-604425432e6a', 'c2d89ff6-6864-5c9d-bc3c-ba1b05d3b19b', '¿Cuál de estas frases es un hecho?', 'La farmacia es la mejor de la colonia.', 'Todos saben que ahí atienden mal.', 'La farmacia es muy cara para lo que vende.', 'La farmacia cerró a las ocho de la noche.', 'd', 1, 'La hora de cierre se puede revisar y comprobar. Las otras frases juzgan o dicen lo que alguien piensa, y eso no se puede comprobar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ef5d6d9d-f876-5102-a330-31244886bab0', 'c2d89ff6-6864-5c9d-bc3c-ba1b05d3b19b', '¿Qué pista indica que una frase es una opinión?', 'Dice «me parece que…»', 'Trae una fecha exacta', 'Se puede ver en un papel', 'Habla de un lugar real', 'a', 2, 'Palabras como «creo», «me parece» o «pienso» muestran lo que una persona siente o piensa. Una fecha o un lugar real sí se pueden comprobar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('fa379d72-43e4-5a27-97c3-021fe443f5ed', 'c2d89ff6-6864-5c9d-bc3c-ba1b05d3b19b', 'Ana dice: «Esa película es aburrida». ¿Qué es esa frase?', 'Un hecho, porque la película existe', 'Una opinión, porque juzga la película', 'Un hecho, porque Ana la vio completa', 'Un hecho, porque se puede comprobar que es aburrida', 'b', 3, '«Aburrida» es una palabra que juzga y depende del gusto de cada quien. Por eso no se puede comprobar y es una opinión.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5de0b79d-edbd-5d4b-9a3c-9e3621451043', 'b2406ebf-79d2-5a5e-8691-da808c1c2c13', '¿Qué es una inferencia?', 'Una frase que el texto dice tal cual', 'Un dato que se copia del texto', 'Una conclusión que sacas con pistas', 'Un resumen corto de todo el texto', 'c', 1, 'El texto no dice la inferencia con palabras. Tú la descubres al pensar en las pistas que da el texto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1de04023-cde1-59fe-8995-2e56cc6c77ae', 'b2406ebf-79d2-5a5e-8691-da808c1c2c13', '¿Qué se une para hacer una inferencia?', 'Las palabras difíciles y su definición', 'Las pistas del texto y lo que ya sabes', 'La opinión de otros y lo que ellos saben', 'El título del texto y el nombre del autor', 'b', 2, 'La fórmula es pistas del texto más lo que ya sabes. Con las dos cosas juntas llegas a una conclusión que el texto no escribe.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1e953699-fbb5-52a4-8855-58adb252a7cd', 'b2406ebf-79d2-5a5e-8691-da808c1c2c13', 'Texto: «Don Pedro llegó con el saco empapado y las botas llenas de lodo». ¿Qué se puede inferir?', 'Que afuera estaba lloviendo', 'Que don Pedro se bañó en su casa', 'Que hacía mucho calor afuera', 'Que don Pedro estaba muy cansado', 'a', 3, 'El saco empapado y el lodo son pistas. Si a eso le sumas que la lluvia moja y llena de lodo, concluyes que llovió.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cf788338-0e81-5b2b-a830-fc5503bd87e4', '9cceabd0-a0b4-5858-b9d8-4eb7c5e42daf', '¿Para qué sirve un recibo?', 'Para pedir que te devuelvan el dinero', 'Para comprobar que pagaste algo', 'Para anotar el nombre del vendedor', 'Para acordar qué hará cada persona', 'b', 1, 'El recibo dice qué compraste y cuánto costó. Por eso guardarlo ayuda si después hay una duda con el cobro.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e4f41536-e3d3-5e5e-9180-7f77111c0948', '9cceabd0-a0b4-5858-b9d8-4eb7c5e42daf', 'En un contrato, ¿qué es una cláusula?', 'La copia que se guarda', 'La firma de las dos personas', 'Cada punto que se acuerda', 'El nombre de las dos personas', 'c', 2, 'Un contrato junta varios acuerdos y cada uno es una cláusula. Por eso conviene leerlas todas antes de firmar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5cf24b47-42d6-5701-9d3b-e0977f7697ca', '9cceabd0-a0b4-5858-b9d8-4eb7c5e42daf', 'Un recibo dice: 4 cuadernos a $18 cada uno y 3 plumas a $6 cada una. ¿Cuál es el total?', '$18', '$72', '$90', '$24', 'c', 3, 'Los cuadernos cuestan 4 × $18 = $72 y las plumas 3 × $6 = $18. El total es $72 + $18 = $90.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0f712a05-a866-5540-b1dd-1abe970c976b', '34eaee7c-8465-52f5-8c45-7339aea6d286', '¿Qué es el sentido figurado?', 'Cada renglón de un poema', 'Lo que dicen las palabras tal cual', 'El sonido igual al final de dos palabras', 'Lo que algo quiere decir de verdad', 'd', 1, 'Los refranes y los dichos dicen una cosa y quieren decir otra. Ese significado escondido es el sentido figurado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('efaea8b1-f60e-54d5-bd20-6b5cac60578f', '34eaee7c-8465-52f5-8c45-7339aea6d286', '¿Cómo se llama cada renglón de un poema?', 'Estrofa', 'Refrán', 'Rima', 'Verso', 'd', 2, 'Cada renglón es un verso. Un grupo de versos forma una estrofa, y la rima es el sonido igual al final.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('eb7a3b73-9749-5ad4-b51b-3e663afb70b5', '34eaee7c-8465-52f5-8c45-7339aea6d286', 'El refrán «Camarón que se duerme se lo lleva la corriente» quiere decir:', 'Dormir mucho trae buena suerte', 'Quien trabaja mucho siempre gana dinero', 'Quien se descuida pierde su oportunidad', 'Los camarones nadan mejor con corriente', 'c', 3, 'No habla de camarones de verdad, sino de personas. Es sentido figurado: quien se distrae deja pasar su oportunidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a6ab0285-d94e-543c-b04e-1c9c23e32c5b', '50859a10-b2bc-5bd0-a302-15930183eb27', 'En una tabla, ¿hacia dónde van las columnas?', 'De lado a lado', 'De arriba hacia abajo', 'De derecha a izquierda', 'En diagonal por la hoja', 'b', 1, 'Las columnas bajan y las filas cruzan de lado a lado. Para buscar un dato, cruzas una fila con una columna.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('227a7dc6-248a-5e58-970d-93dcab8e1754', '50859a10-b2bc-5bd0-a302-15930183eb27', 'Un horario dice: Sur sale 6:00 y llega 6:45. Norte sale 6:30 y llega 7:20. Centro sale 7:00 y llega 7:30. ¿A qué hora llega el camión que sale a las 6:30?', 'A las 7:20', 'A las 6:30', 'A las 7:30', 'A las 6:45', 'a', 2, 'Se busca en la columna «Sale» la hora 6:30. Esa fila es Norte y su hora de llegada es 7:20.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4116660a-7dbc-5923-9c97-1391994d9910', '50859a10-b2bc-5bd0-a302-15930183eb27', 'En un croquis, ¿qué explica los símbolos?', 'La leyenda', 'El norte', 'La columna', 'El encabezado', 'a', 3, 'Los mapas usan dibujos pequeños para marcar lugares. La leyenda dice qué significa cada uno.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9b63e9a6-d147-5bb4-b152-9b111d687cdc', '41071924-5b97-5080-9b92-89e5638b6330', '¿Qué lleva un resumen?', 'Solo los detalles, sin idea principal', 'El texto completo con otras palabras', 'La idea principal y los detalles necesarios', 'Todos los ejemplos y lo repetido', 'c', 1, 'Un resumen es corto porque deja fuera lo que sobra. Conserva la idea principal y solo los detalles que hacen falta.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bf4014ff-78f8-5bef-8f07-33e7e92540e5', '41071924-5b97-5080-9b92-89e5638b6330', 'En un esquema, ¿qué va arriba?', 'Los detalles', 'Los ejemplos', 'El tema', 'Las ideas principales', 'c', 2, 'El esquema ordena de lo más general a lo más particular. Primero el tema, luego las ideas principales y al final los detalles.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('101b89a9-fbe4-5e5a-8280-c0b78024ee38', '41071924-5b97-5080-9b92-89e5638b6330', 'Después de subrayar la idea principal de cada párrafo, ¿qué paso sigue para resumir?', 'Quitar los ejemplos y lo repetido', 'Copiar cada párrafo completo', 'Agregar más detalles a cada idea', 'Cambiar el título del texto', 'a', 3, 'Resumir es dejar lo esencial. Por eso se quitan los ejemplos y lo repetido antes de escribir con tus palabras.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('62d08586-c3e1-5a38-a6ba-327cf9b75e9b', '3e5fabdb-f539-56b5-a4ca-4bb7480a2f73', 'Según el repaso, ¿cómo descubres lo que un texto no dice con palabras?', 'Leyendo solo el título del texto', 'Preguntando qué opina otra persona', 'Copiando la primera frase del texto', 'Uniendo las pistas con lo que ya sabes', 'd', 1, 'Esa unión de pistas del texto y de lo que ya sabes se llama inferencia. Así entiendes lo escondido entre líneas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ed0a88f5-e6fa-5f59-8669-54e08092bc6f', '3e5fabdb-f539-56b5-a4ca-4bb7480a2f73', 'El refrán «En boca cerrada no entran moscas» quiere decir:', 'Que callar a veces evita problemas', 'Que hablar a veces trae buena suerte', 'Que cerrar la puerta evita problemas', 'Que es mejor gritar para que te oigan', 'a', 2, 'Es sentido figurado: las moscas representan los problemas. Quien habla menos se ahorra algunos problemas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('94bda116-7080-59c9-a0c3-7185b36ae20d', '3e5fabdb-f539-56b5-a4ca-4bb7480a2f73', '«Bate los huevos y fríelos» es un texto instructivo. ¿Por qué?', 'Porque quiere que compres huevos', 'Porque da datos reales de una noticia', 'Porque cuenta una historia con personajes', 'Porque da pasos para hacer algo', 'd', 3, '«Bate» y «fríelos» son órdenes que se siguen en orden. Eso es lo que hace un texto instructivo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f012d2d4-5447-5759-91fc-b9abf0936e88', '125accbf-cf5c-55c6-9cd7-e27b96367f5e', 'En la fracción 3/5, ¿qué dice el número de abajo?', 'En cuántas partes iguales se partió el entero', 'Cuántas partes tomaste del entero', 'Cuántos enteros tienes en total', 'Cuántas partes sobraron sin tomar', 'a', 1, 'El número de abajo es el denominador. Dice en cuántas partes iguales se partió el entero; el de arriba dice cuántas partes tomas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9f2a6a87-bdd0-5079-970f-fe73c1056869', '125accbf-cf5c-55c6-9cd7-e27b96367f5e', 'Una pizza se corta en 8 partes iguales y Ana se come 3. ¿Qué fracción de la pizza se comió?', '3/5', '5/8', '8/3', '3/8', 'd', 2, 'El denominador es 8, porque son 8 partes iguales. El numerador es 3, porque Ana tomó 3 partes.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0f1a1ea2-7887-5075-996a-854168f11092', '125accbf-cf5c-55c6-9cd7-e27b96367f5e', 'Teresa tiene 30 tortillas y usa 2/5 de ellas. ¿Cuántas tortillas usa?', '60 tortillas', '6 tortillas', '18 tortillas', '12 tortillas', 'd', 3, 'Divide 30 entre 5: 30 ÷ 5 = 6. Luego multiplica por 2: 6 × 2 = 12.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e19dc468-441f-5ad2-8d14-57074cd68391', 'f6e8150f-9c3b-5128-ab3e-dc0255b325f5', '¿Cuál de estas fracciones es equivalente a 1/3?', '3/6', '1/6', '2/6', '2/3', 'c', 1, 'Se multiplica arriba y abajo por 2: 1 × 2 = 2 y 3 × 2 = 6. Por eso 1/3 = 2/6.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e2ec8809-dc07-51d4-afd4-388ec0303da4', 'f6e8150f-9c3b-5128-ab3e-dc0255b325f5', 'Todas estas fracciones tienen el mismo numerador, 1. ¿Cuál es la mayor?', '1/3', '1/5', '1/10', '1/8', 'a', 2, 'Con el mismo numerador, gana la de denominador más chico, porque sus partes son más grandes. Por eso 1/3 es mayor que 1/5.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('48714548-6d0e-5cd2-8ec1-b456a88a5e12', 'f6e8150f-9c3b-5128-ab3e-dc0255b325f5', 'Simplifica 10/15 dividiendo arriba y abajo entre 5. ¿Qué fracción queda?', '5/10', '10/3', '2/15', '2/3', 'd', 3, 'Se divide arriba y abajo entre 5: 10 ÷ 5 = 2 y 15 ÷ 5 = 3. Queda 2/3.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2a318ac7-35d4-5846-ab5a-6ec5e1a1e92c', '1fd5c0a9-130f-5e97-9c0e-ce9fa210f71b', '¿Cuánto es 2/9 + 5/9?', '3/9', '7/18', '7/9', '10/9', 'c', 1, 'Solo se suman los numeradores: 2 + 5 = 7. El denominador se queda en 9.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('54822fce-6c25-5c89-b174-35f687bf1404', '1fd5c0a9-130f-5e97-9c0e-ce9fa210f71b', 'Don Mario tenía 7/8 de litro de pintura y usó 4/8. ¿Cuánta pintura le queda?', '4/8 de litro', '3/8 de litro', '11/8 de litro', '3/16 de litro', 'b', 2, 'Se restan los numeradores: 7 − 4 = 3. El denominador no cambia, así que quedan 3/8 de litro.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('25c29b96-30b8-5e5c-b715-fedf1d08a21e', '1fd5c0a9-130f-5e97-9c0e-ce9fa210f71b', 'Rosa suma 3/10 + 5/10 y simplifica el resultado. ¿Cuál es el resultado simplificado?', '5/10', '4/5', '8/5', '8/20', 'b', 3, 'Primero 3/10 + 5/10 = 8/10. Luego se divide entre 2 arriba y abajo y queda 4/5.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cc2f7358-75ea-5ca8-91e0-c2dffd923e77', 'f8447bb3-ad2b-5675-916d-5c1195ad26ef', '¿Cómo se llama el segundo lugar después del punto decimal?', 'Los centésimos', 'Los pesos', 'Los enteros', 'Los décimos', 'a', 1, 'Después del punto, el primer lugar son los décimos y el segundo son los centésimos. Cada lugar vale la décima parte del anterior.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ac0d9632-e5b1-5815-95e4-05d3ccf3408b', 'f8447bb3-ad2b-5675-916d-5c1195ad26ef', '¿Cómo se escribe 3/5 como número decimal?', '0.8', '0.3', '0.06', '0.6', 'd', 2, 'Multiplica arriba y abajo por 2: 3/5 = 6/10. Seis décimos se escriben 0.6.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ca9e3303-3ea4-5dfc-8998-97dea415b3db', 'f8447bb3-ad2b-5675-916d-5c1195ad26ef', '¿Cuál de estos precios es el mayor?', '$4.60', '$6.40', '$6.04', '$5.99', 'b', 3, 'Primero se comparan los enteros y quedan $6.40 y $6.04. Luego se comparan los décimos: 4 es mayor que 0.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bff80f08-2543-572f-ad10-723ce1b0d05e', 'e39702a8-e919-529d-b9cd-6e25fec0e5d9', '¿Qué se debe alinear al sumar o restar números decimales?', 'El punto decimal', 'Los ceros del final', 'El número más grande', 'El último dígito', 'a', 1, 'Con el punto alineado, cada lugar queda en su columna. Así se suman décimos con décimos y centésimos con centésimos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c9ae1eec-26bd-5a3c-bd9c-cf2eaa0039ed', 'e39702a8-e919-529d-b9cd-6e25fec0e5d9', 'Ana compra jabón de $15.60 y arroz de $22.85. ¿Cuánto paga en total?', '$37.45', '$38.35', '$38.45', '$39.45', 'c', 2, 'Alinea el punto y suma: 15.60 + 22.85 = 38.45. Ana paga $38.45.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b965644d-c053-5e75-8f10-8c8eeaf4982d', 'e39702a8-e919-529d-b9cd-6e25fec0e5d9', 'Pablo paga con un billete de $100 una cuenta de $64.35. ¿Cuánto cambio recibe?', '$34.65', '$36.65', '$45.65', '$35.65', 'd', 3, 'Escribe 100 como 100.00 y resta: 100.00 − 64.35 = 35.65. Pablo recibe $35.65.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e5ee219a-ffa3-5eea-9f1a-7c07501aa0bf', 'ed25511f-015c-51ef-aa58-8e19b35a86d4', 'Al dividir un decimal entre 10, ¿cómo se mueve el punto?', 'Un lugar a la derecha', 'Dos lugares a la derecha', 'Un lugar a la izquierda', 'Dos lugares a la izquierda', 'c', 1, 'Al dividir, el número se hace más pequeño. Por eso el punto va a la izquierda, y con 10 se mueve un solo lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('57de511c-3da7-596e-b1c0-0dab6306a41b', 'ed25511f-015c-51ef-aa58-8e19b35a86d4', '¿Cuánto es 4.37 × 1000?', '43,700', '4,370', '43.7', '437', 'b', 2, 'Por 1,000 el punto va tres lugares a la derecha, con un cero de relleno: 4.37 × 1000 = 4,370.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a5c5680b-028a-573a-9649-92529f0863fb', 'ed25511f-015c-51ef-aa58-8e19b35a86d4', 'Una caja de 100 piezas cuesta $250. ¿Cuánto cuesta cada pieza?', '$250', '$0.25', '$2.50', '$25', 'c', 3, 'Dividir entre 100 mueve el punto dos lugares a la izquierda: 250 ÷ 100 = 2.50. Cada pieza cuesta $2.50.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('deafbd10-d96c-56a1-9ec6-a8b0e7fd7d7e', '7cc366c8-8238-57cb-99ec-5d98326ff736', 'Una receta usa 1/3 de taza de azúcar. ¿Cuánta azúcar lleva el doble de la receta?', '1/6 de taza', '2/3 de taza', '2/6 de taza', '3/3 de taza', 'b', 1, 'Para el doble, se multiplica el numerador por 2: 2 × 1/3 = 2/3. El denominador no cambia.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('705b8fb6-9620-530c-b547-d249a702e281', '7cc366c8-8238-57cb-99ec-5d98326ff736', 'La receta pide 2.5 L de agua. ¿Cuántos ml son?', '25 ml', '250 ml', '2,500 ml', '25,000 ml', 'c', 2, 'Un litro son 1,000 ml, así que se multiplica por 1,000: 2.5 × 1000 = 2,500.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('51b29706-f280-54f0-a123-a4f4f616dc56', '7cc366c8-8238-57cb-99ec-5d98326ff736', '¿Cuántos gramos son 3/5 de un kilo?', '600 gramos', '200 gramos', '3,000 gramos', '300 gramos', 'a', 3, 'Un kilo son 1,000 gramos. Se divide entre 5 y se multiplica por 3: 1000 ÷ 5 = 200 y 200 × 3 = 600.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b4e93c2a-7706-5109-8eba-e0009602295f', '49ce5213-acc5-5993-bced-ce92dbb8612d', 'Según el repaso, ¿cuál es la regla para sumar fracciones con igual denominador?', 'Suma los numeradores y deja igual el denominador', 'Suma los numeradores y también los denominadores', 'Multiplica los numeradores y deja igual el denominador', 'Suma los denominadores y deja igual el numerador', 'a', 1, 'Las partes son del mismo tamaño, por eso solo se juntan los numeradores. El denominador solo dice qué tamaño tienen las partes.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3d8d8020-4309-526d-a2aa-283a387907a2', '49ce5213-acc5-5993-bced-ce92dbb8612d', 'Siguiendo el repaso, ¿cuánto es 2/3 de 15?', '13', '5', '30', '10', 'd', 2, 'Divide entre el denominador: 15 ÷ 3 = 5. Luego multiplica por el numerador: 5 × 2 = 10.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dc2000c0-4019-5706-bd17-1d74d2bc7893', '49ce5213-acc5-5993-bced-ce92dbb8612d', 'Según el repaso, ¿qué se hace con el punto al dividir un decimal entre 10, 100 o 1,000?', 'Se queda en su lugar', 'Se mueve a la izquierda', 'Se coloca al final', 'Se mueve a la derecha', 'b', 3, 'Al dividir, el número se hace más pequeño. Por eso el punto se recorre hacia la izquierda.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3ab461fd-ce73-5ced-887c-a818c8f2b288', '9650faeb-8ef1-5ca4-8acc-5851ecd0ebc0', '¿Qué hace un ser vivo que una piedra no hace?', 'Pesa, se calienta y se mueve', 'Brilla, rueda y se desgasta', 'Nace, crece y se reproduce', 'Cambia de color y de forma', 'c', 1, 'Un ser vivo cumple todo un ciclo: nace, crece, se alimenta, respira, se reproduce y muere. La piedra no hace nada de eso, por eso no es un ser vivo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9a95c50d-cf1d-53d4-a60f-b1eca6044ea0', '9650faeb-8ef1-5ca4-8acc-5851ecd0ebc0', '¿Cómo consiguen su alimento los hongos, como el champiñón?', 'Lo buscan y lo persiguen por el campo', 'Lo toman de restos de plantas y animales', 'Lo toman solo del agua y del aire', 'Lo fabrican con la luz del Sol', 'b', 2, 'Los hongos no fabrican su alimento como las plantas. Lo toman de restos de plantas y de animales.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('372eb6db-52f3-5c8c-b3c7-0beabca12285', '9650faeb-8ef1-5ca4-8acc-5851ecd0ebc0', '¿Cuál de estos animales es invertebrado, es decir, no tiene huesos por dentro?', 'La rana', 'La mariposa', 'El perro', 'El pollo', 'b', 3, 'Los invertebrados no tienen huesos por dentro, como el caracol y la mariposa. El perro y la rana sí los tienen, por eso son vertebrados.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('74f41c05-3652-5176-9ec0-1f422ee0e177', 'b9d50c91-1f61-5333-b1b3-2dca4a3317f6', '¿Qué parte de la planta toma el agua del suelo?', 'El tallo', 'La hoja', 'La raíz', 'El fruto', 'c', 1, 'La raíz está bajo la tierra, sostiene la planta y toma el agua del suelo. El tallo solo lleva esa agua hacia arriba.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f9ff8ee9-9aa7-5f78-87d5-a1520b33b24b', 'b9d50c91-1f61-5333-b1b3-2dca4a3317f6', '¿Qué parte de la planta protege las semillas?', 'La flor', 'El fruto', 'El tallo', 'La raíz', 'b', 2, 'El fruto guarda y cuida las semillas. De cada semilla puede nacer una planta nueva.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dceba1c2-6f3b-5a31-9ad9-9e7a8a546c1a', 'b9d50c91-1f61-5333-b1b3-2dca4a3317f6', '¿Qué gas suelta la planta cuando termina de fabricar su alimento?', 'Gas de la estufa', 'Nitrógeno', 'Helio', 'Oxígeno', 'd', 3, 'Al terminar la fotosíntesis, la planta suelta oxígeno. Es el gas del aire que las personas y los animales necesitamos para respirar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('20d7b7cc-8e62-5bb5-b3a1-e2c7d58cec01', 'bdb2e6b5-6a26-5429-b6ea-7a0f9cea59bc', '¿Qué come un animal herbívoro, como la vaca?', 'Solo plantas', 'Restos de plantas y de animales', 'Plantas y animales', 'Solo otros animales', 'a', 1, 'Herbívoro quiere decir que come solo plantas. Si comiera plantas y animales sería omnívoro; si comiera solo animales, carnívoro.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f9b63bb5-9952-5d0f-8182-2fd7f5816777', 'bdb2e6b5-6a26-5429-b6ea-7a0f9cea59bc', 'En una cadena alimenticia, ¿quiénes son los productores?', 'Las plantas, porque fabrican su alimento', 'Los animales, porque comen plantas', 'Las personas, porque compran comida', 'Los hongos, porque comen restos', 'a', 2, 'Los productores fabrican su propio alimento. Por eso las plantas son el primer eslabón de la cadena y de ellas se alimentan los demás.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('24ff8d9e-ea64-5b5a-b1d6-8f5071817864', 'bdb2e6b5-6a26-5429-b6ea-7a0f9cea59bc', 'Al escribir una cadena alimenticia con flechas, ¿hacia dónde van las flechas?', 'Del animal grande al chico', 'De quien come a su alimento', 'Del alimento a quien lo come', 'Del animal más fuerte al más débil', 'c', 3, 'La flecha muestra quién come a quién. Parte del alimento y llega a quien se lo come, como en pasto → conejo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('287a07fc-32e8-5771-9bee-c36a979c923a', '9b0e3e1f-fdae-5458-b046-aad0254a6a2c', '¿Cómo se llama el paso del ciclo del agua en que el vapor se enfría y forma las nubes?', 'Condensación', 'Evaporación', 'Precipitación', 'Infiltración', 'a', 1, 'Arriba hace frío y el vapor se enfría, forma gotas muy pequeñas y esas gotas hacen las nubes. Eso es la condensación.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c6249ba1-c9d6-5d1b-8973-a73731112d17', '9b0e3e1f-fdae-5458-b046-aad0254a6a2c', '¿Qué es un manto acuífero?', 'Agua que sube al aire', 'Agua guardada bajo la tierra', 'Agua salada del mar', 'Agua que cae de las nubes', 'b', 2, 'Parte de la lluvia entra al suelo y se guarda abajo. Ese depósito subterráneo de agua se llama manto acuífero.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9292535a-cc96-5212-b0cc-5b5024e26256', '9b0e3e1f-fdae-5458-b046-aad0254a6a2c', '¿Por qué conviene cuidar el agua en la casa?', 'Porque el agua dulce que podemos usar es poca', 'Porque casi toda el agua del planeta es dulce', 'Porque el agua del mar se acaba pronto', 'Porque el Sol evapora toda el agua dulce', 'a', 3, 'Casi toda el agua de la Tierra es salada. El agua dulce que podemos usar es muy poca, por eso conviene no desperdiciarla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c279973d-96f6-58bf-90a8-289e2e018a03', '58f587ba-d667-5755-8de1-a136c61445f4', '¿Cuál de estas cosas se expande y llena todo el espacio?', 'El aceite de cocina', 'Una piedra del camino', 'El hielo de un vaso', 'El gas de la estufa', 'd', 1, 'Un gas no tiene forma propia: se expande hasta llenar el lugar donde está. El aceite es líquido y la piedra y el hielo son sólidos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9e2fafe7-f30b-5cc6-a096-345b5e072847', '58f587ba-d667-5755-8de1-a136c61445f4', '¿Cómo se llama el cambio de sólido a líquido con calor?', 'Evaporación', 'Solidificación', 'Condensación', 'Fusión', 'd', 2, 'Cuando un sólido recibe calor y se vuelve líquido, hay fusión. Es lo que le pasa a la mantequilla en un sartén caliente.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('df547be1-d61b-5102-9d23-23f5abdf7d66', '58f587ba-d667-5755-8de1-a136c61445f4', 'Rosa deja agua en el congelador y se convierte en hielo. ¿Qué cambio ocurrió?', 'Evaporación', 'Fusión', 'Solidificación', 'Condensación', 'c', 3, 'El frío hace que un líquido pase a sólido. A ese cambio se le llama solidificación.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0cee81c1-cd0e-580d-8c17-d267eb552771', '136a66df-5f10-5d72-9e28-fd42cfc3a205', 'Llevas tu bolsa de tela al mercado y así usas menos bolsas de plástico. ¿Qué erre aplicas?', 'Reciclar', 'Reparar', 'Reusar', 'Reducir', 'd', 1, 'Reducir es usar menos cosas que se vuelven basura. Con tu bolsa de tela no necesitas bolsas nuevas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a0566fc2-5597-51a4-a0fd-301d718d2a50', '136a66df-5f10-5d72-9e28-fd42cfc3a205', '¿Cuál de estos residuos es orgánico?', 'Un frasco de vidrio', 'Una lata de metal', 'Las cáscaras de naranja', 'Un envase de plástico', 'c', 2, 'Los residuos orgánicos vienen de seres vivos, como cáscaras y hojas. El plástico, el vidrio y el metal no vienen de seres vivos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('13faa167-2c94-5dba-8c1b-44b68848e630', '136a66df-5f10-5d72-9e28-fd42cfc3a205', '¿Qué quiere decir reciclar?', 'Convertir un material usado en uno nuevo', 'Usar menos cosas que se vuelven basura', 'Volver a usar un objeto antes de tirarlo', 'Separar la basura en dos grupos', 'a', 3, 'Reciclar es hacer un material nuevo con uno ya usado. Por ejemplo, el papel, el vidrio y el metal pueden reciclarse.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f1cd1639-993c-5653-b177-63c34a603372', '6aac4f6d-be6b-5c35-b562-d993f4392a5a', 'Empieza un sismo. ¿Cómo sales de tu casa?', 'Corriendo para llegar primero a la calle', 'Sin correr ni empujar, al punto de reunión', 'Usando el elevador para bajar más rápido', 'Esperando junto a la ventana del cuarto', 'b', 1, 'Hay que mantener la calma y salir sin correr ni empujar. Se evita el elevador y se camina hasta el punto de reunión.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('aad45d15-b6a5-5e52-a350-4c71df889cc5', '6aac4f6d-be6b-5c35-b562-d993f4392a5a', 'Hay una inundación en tu calle. ¿Qué debes hacer?', 'Subir a un lugar alto y no cruzar el agua', 'Cruzar la corriente en auto, que es más firme', 'Cruzar la corriente a pie para llegar a casa', 'Quedarte en el piso de abajo cuidando todo', 'a', 2, 'El agua en movimiento arrastra a las personas y a los autos. Lo más seguro es subir a un lugar alto y esperar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1211ae12-11a7-5999-85b4-a6ad897ac231', '6aac4f6d-be6b-5c35-b562-d993f4392a5a', 'En una emergencia, ¿a qué número llamas?', '555', '100', '123', '911', 'd', 3, 'El 911 es el número para pedir ayuda en una emergencia. Conviene saberlo de memoria y compartirlo con las personas con quienes vives.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5c2df8ed-0fc1-544e-b9c3-37d9b275178e', '1a6dc91d-53e0-52f9-8423-409619973c29', '¿El champiñón es una planta?', 'No, es un animal porque se mueve', 'Sí, es una planta porque es un ser vivo', 'Sí, es una planta porque crece en la tierra', 'No, es un hongo', 'd', 1, 'Las plantas fabrican su alimento con la luz. El champiñón no lo fabrica, por eso se clasifica como hongo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('af9df2de-1655-5f36-9a55-3074b0fd0671', '1a6dc91d-53e0-52f9-8423-409619973c29', 'En la cadena pasto → conejo → águila, ¿quién es el productor?', 'El conejo', 'El pasto', 'El Sol', 'El águila', 'b', 2, 'El productor es el que fabrica su alimento, y eso lo hacen las plantas. El conejo y el águila son consumidores.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('47ec3397-4c7e-5d1b-a6d2-1918c2acf7b9', '1a6dc91d-53e0-52f9-8423-409619973c29', 'Rosa guarda azúcar en un frasco limpio que ya había usado. ¿Qué erre aplica?', 'Reducir', 'Reparar', 'Reusar', 'Reciclar', 'c', 3, 'Volver a usar un objeto en lugar de tirarlo es reusar. El frasco no se transforma en otro material, solo se usa de nuevo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c174a301-f4ac-5819-b6b9-47dbb96ffee3', '6b4e0236-dfea-5d57-a562-6df9ac3669dc', '¿Qué signo lleva al final el saludo de una carta o de un correo?', 'Una coma', 'Dos puntos', 'Una raya larga', 'Un punto final', 'b', 1, 'En cartas y correos, el saludo se cierra con dos puntos y después empieza el mensaje, por ejemplo: «Buenas tardes:».') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7831e4b0-a388-5ba2-a491-e4348e2903c8', '6b4e0236-dfea-5d57-a562-6df9ac3669dc', 'Luis escribe una carta a la administración de su edificio, a quien no conoce. ¿Cómo debe despedirla?', 'Con «Nos vemos»', 'Con «Atentamente»', 'Con «Cuídate mucho»', 'Con «Hasta luego»', 'b', 2, 'Con alguien desconocido se escribe una carta formal. Se le trata de usted y se despide con «Atentamente».') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('667b2d9f-afeb-55c7-86ff-477f06282091', '6b4e0236-dfea-5d57-a562-6df9ac3669dc', 'En un correo electrónico, ¿cómo se llama la frase corta que dice de qué trata?', 'El cuerpo', 'El adjunto', 'El asunto', 'La firma', 'c', 3, 'El asunto es la frase corta que aparece arriba y adelanta el tema. El adjunto es un archivo, y la firma es tu nombre al final.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('797eabb0-70ad-5421-ad2d-c1acc295c3f6', '3264b284-6e73-5026-8184-5c9d7bcd66f8', 'Un formato pide «Teléfono fijo» y tú no tienes. ¿Qué haces con ese campo?', 'Anoto un número inventado', 'Escribo mi nombre en ese campo', 'Dejo el espacio vacío', 'Escribo «No aplica»', 'd', 1, 'Un campo vacío puede parecer olvido. Al escribir «No aplica» se ve que lo leíste y que ese dato no te corresponde.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f2457670-bace-50b5-9ed6-5bc3b275e08f', '3264b284-6e73-5026-8184-5c9d7bcd66f8', '¿Qué conviene hacer antes de escribir en un formato?', 'Firmar en la parte de abajo', 'Copiar un formato viejo', 'Llenar primero los datos', 'Leer todo el formato', 'd', 2, 'Al leer todo antes, conoces las instrucciones, como «letra de molde» o «tinta negra», y evitas errores que obligan a repetir la hoja.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2e0c2b7c-3d2d-5a36-a384-bb5e35541631', '3264b284-6e73-5026-8184-5c9d7bcd66f8', 'En un formato, ¿qué es un campo?', 'El espacio donde se anota un dato', 'La letra separada y sin enlazar', 'El formato donde pides un permiso', 'La hoja completa con espacios vacíos', 'a', 3, 'Cada espacio que hay que llenar, como nombre o domicilio, es un campo. La hoja completa es el formato.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4cb272aa-8de2-56bc-ab86-49d02b5b5c15', 'acb6d781-87fa-597f-a054-a92c9cd397ee', 'En «Llegué al mercado, pero estaba cerrado», ¿qué muestra la palabra «pero»?', 'Una suma', 'Una causa', 'Una diferencia', 'Un orden', 'c', 1, '«Pero» pone frente a frente dos ideas que no coinciden: llegar al mercado y encontrarlo cerrado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('71d5f835-1e0f-5e57-ae85-1b7c4c1c8796', 'acb6d781-87fa-597f-a054-a92c9cd397ee', '¿Qué conector sirve para dar una causa?', 'Porque', 'Además', 'Después', 'Aunque', 'a', 2, '«Porque» responde a la pregunta de por qué pasó algo. «Además» suma, «aunque» muestra diferencia y «después» ordena.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a6ec51d2-0106-5eb1-b8db-9a3f63b7f333', 'acb6d781-87fa-597f-a054-a92c9cd397ee', '¿Cuándo se pone una coma en una oración?', 'Antes de la palabra «porque»', 'Antes de la palabra «pero»', 'Cada vez que haces una pausa', 'Al terminar una idea completa', 'b', 3, 'La coma separa elementos de una lista y va antes de «pero», no por una pausa al leer. Al terminar una idea completa va punto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7d48bf86-b052-565b-ac41-9d69213c1ba5', '47508186-6fd6-5048-9bba-377f4e41c265', '¿Qué parte de una historia dice cómo terminó y qué aprendiste?', 'El desarrollo', 'El título', 'El final', 'El inicio', 'c', 1, 'El final cierra la historia: cuenta cómo acabó todo y qué te dejó. El inicio presenta quién, cuándo y dónde.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3aee29ec-eac7-5b72-b180-be17f7cdb0ca', '47508186-6fd6-5048-9bba-377f4e41c265', 'Luis cuenta algo que ya le pasó. ¿En qué tiempo escribe los verbos?', 'En presente', 'En futuro', 'En imperativo, como «camina»', 'En pasado', 'd', 2, 'Como la historia ya ocurrió, los verbos van en pasado: «caminé», «llegué», «esperé».') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ca49467d-fe3c-55c1-91ff-890513d6e6f8', '47508186-6fd6-5048-9bba-377f4e41c265', '¿Qué datos se dan en el inicio de una historia personal?', 'Cómo terminó todo', 'Quién, cuándo y dónde', 'Qué se aprendió al final', 'Qué pasó paso a paso', 'b', 3, 'El inicio ubica al lector: quién vive la historia, en qué momento y en qué lugar. Lo que pasa se cuenta después.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('185945a6-d0c0-59a3-9ed1-e55690a28ab9', '37ff0a7a-30ea-58d5-b1b8-790e9a19380a', '¿Qué hace un anuncio?', 'Pide un permiso en un formato', 'Informa algo a un grupo de personas', 'Cuenta una experiencia personal', 'Ofrece un producto o un servicio', 'd', 1, 'El anuncio ofrece algo, como una venta o un servicio. El aviso, en cambio, informa un hecho a un grupo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7be7ebef-d9bd-51d3-9017-9182a7e3771d', '37ff0a7a-30ea-58d5-b1b8-790e9a19380a', 'En un aviso, ¿qué dato dice con quién preguntar más?', 'El día', 'El lugar', 'El contacto', 'El título', 'c', 2, 'El contacto es la persona o el dato para resolver dudas. Se pone si hace falta, al final del aviso.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dd6338e6-0695-55d4-9eba-0f85974e4741', '37ff0a7a-30ea-58d5-b1b8-790e9a19380a', '¿Cuál de estos avisos se entiende mejor de un vistazo?', 'Un párrafo largo que explica todo y deja la fecha al final', 'Un texto con adornos y la hora escondida en medio', 'Reunión de vecinos. Sábado, 6 de la tarde, en el patio', 'Los mismos datos en letra pequeña para que quepan en media hoja', 'c', 3, 'Un aviso se lee de pie y en pocos segundos. Con título claro y datos a la vista se entiende de lejos; si la fecha está escondida o la letra es chica, la gente no la encuentra.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f9c1cd92-3f76-5d5f-a8a1-9440d0358b11', '7fc84a0d-58b4-509a-bdb8-ccc581b99c1c', '¿Qué significa corregir un texto?', 'Cambiar lo que está mal', 'Escribirlo por primera vez', 'Leerlo de nuevo para buscar errores', 'Mandarlo lo más pronto posible', 'a', 1, 'Corregir es arreglar el error que encontraste. Buscar los errores al releer se llama revisar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d34514d5-b7cf-5d07-ac7e-657de83b5708', '7fc84a0d-58b4-509a-bdb8-ccc581b99c1c', '¿Qué ayuda a encontrar errores al revisar un texto?', 'Quitar todos los puntos', 'Leer el texto en voz alta', 'Leer solo una vez y rápido', 'Escribirlo con letra grande', 'b', 2, 'Al leer en voz alta se nota dónde uno tropieza. Ese tropiezo señala algo que conviene arreglar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('646a2973-423e-577d-bb7c-fc8a273631d3', '7fc84a0d-58b4-509a-bdb8-ccc581b99c1c', 'Al revisar, ¿cómo debe empezar cada oración?', 'Con dos puntos', 'Con coma', 'Con minúscula', 'Con mayúscula', 'd', 3, 'Cada oración nueva empieza con mayúscula, y termina con punto o con su signo de cierre.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9c999dc9-622a-5a94-ab49-1f7dc1bf85fb', 'b63ff696-da12-5ece-9950-ad4fa86c5325', '¿Con qué debe empezar un mensaje digital cortés?', 'Con un saludo', 'Con una orden', 'Con mayúsculas', 'Con una abreviatura', 'a', 1, 'Saludar es la primera muestra de buen trato. Después se pide lo que se necesita y se cierra con «gracias».') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6653415b-3097-5902-a297-eebf924bb55a', 'b63ff696-da12-5ece-9950-ad4fa86c5325', 'En un mensaje, ¿qué parece cuando escribes todo en mayúsculas?', 'Que estás gritando', 'Que escribes de forma formal', 'Que eres muy amable', 'Que tienes mucha prisa', 'a', 2, 'En un mensaje no se oye la voz, y las mayúsculas en todo el texto suenan como grito. Mejor úsalas solo donde corresponde.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1a42d514-f88d-5c03-ae4b-bbc5a38e5415', 'b63ff696-da12-5ece-9950-ad4fa86c5325', '¿Qué datos nunca debes mandar por mensaje?', 'Una foto de un paisaje', 'Tu nombre y un saludo amable', 'La hora y el lugar de la reunión', 'Contraseñas y datos de tarjeta', 'd', 3, 'Las contraseñas y los números de tarjeta dan acceso a tu dinero y a tus cuentas. No se mandan por mensaje.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('923aa786-3861-5306-94f2-b4c4dcc0eea6', '6d2c1430-a5a9-5296-9a56-1bc6979a49e5', '¿Qué parte de una carta va al final?', 'El saludo', 'La firma', 'El lugar y la fecha', 'El cuerpo', 'b', 1, 'La carta cierra con la despedida y, después de ella, va tu firma, que es tu nombre.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9c9a971b-6171-5351-88f8-2aeb103fb90e', '6d2c1430-a5a9-5296-9a56-1bc6979a49e5', '¿Qué conector une bien estas ideas? «Quería ir. Llovía mucho».', 'Pero', 'Después', 'Además', 'Porque', 'a', 2, 'Las dos ideas chocan: había ganas de ir, pero la lluvia lo impedía. Por eso «pero» muestra la diferencia.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ec12395f-c3e1-5663-8f70-ee9f667ed890', '6d2c1430-a5a9-5296-9a56-1bc6979a49e5', '¿Cómo se corrige mejor el mensaje «hola necesito el recibo»?', 'Oye, ya mándame el recibo, por favor, es urgente y lo necesito hoy mismo.', 'HOLA, NECESITO EL RECIBO. MÁNDAMELO HOY, GRACIAS.', 'Hola, buenas tardes. ¿Me puede enviar el recibo, por favor?', 'Hola. Necesito el recibo y tú no me lo has enviado.', 'c', 3, 'La versión corregida lleva saludo, mayúscula inicial, puntuación, una petición clara y un «por favor». Así el mensaje se entiende y suena amable.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('24e5e382-d6c6-5f80-ad38-e80248e62781', 'b8da219e-092f-5b33-8d2f-ef6c4598adfc', '¿Cómo se llaman las líneas que nunca se juntan, como las vías del tren?', 'Curvas', 'Paralelas', 'Cruzadas', 'Perpendiculares', 'b', 1, 'Las paralelas van lado a lado, como las vías del tren, y nunca se tocan.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('01d1951d-b664-5073-a402-ab6373b16b61', 'b8da219e-092f-5b33-8d2f-ef6c4598adfc', '¿Cuánto mide un ángulo recto?', '45°', '90°', '60°', '180°', 'b', 2, 'El ángulo recto es la esquina de una hoja. Si mide menos de 90° es agudo, y si mide más de 90° es obtuso.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('09209365-8812-55bc-8047-d939e9df4c66', 'b8da219e-092f-5b33-8d2f-ef6c4598adfc', 'Un ángulo mide 130°. ¿Qué tipo de ángulo es?', 'Agudo', 'Recto', 'Perpendicular', 'Obtuso', 'd', 3, '130° es más que 90°, así que el ángulo es obtuso. Un ángulo agudo mide menos de 90°.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('861e887e-657d-5789-9167-1d96c7acdf9f', '1b2dafcb-2054-5bdf-a36a-eb99414a9dfc', '¿Cómo se llama el triángulo que tiene sus tres lados iguales?', 'Equilátero', 'Rectángulo', 'Escaleno', 'Isósceles', 'a', 1, 'Los triángulos se nombran por sus lados. Si los tres miden lo mismo es equilátero; si solo dos, isósceles; si ninguno, escaleno.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3ef38f3d-4512-5000-b913-550d2646664e', '1b2dafcb-2054-5bdf-a36a-eb99414a9dfc', 'Un triángulo tiene ángulos de 70° y 60°. ¿Cuánto mide el tercero?', '50°', '110°', '40°', '130°', 'a', 2, 'Los tres ángulos suman 180°. Primero 70° + 60° = 130° y luego 180° − 130° = 50°.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2dde541f-314c-55a3-8869-66cbbd8a3c1b', '1b2dafcb-2054-5bdf-a36a-eb99414a9dfc', '¿Cuántos grados suman los cuatro ángulos de un cuadrilátero?', '90°', '180°', '360°', '270°', 'c', 3, 'Un cuadrilátero tiene cuatro lados y sus ángulos suman 360°. Los de un triángulo suman solo 180°.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4c076a5e-3c53-5c57-9385-fb0192407d4d', '1b68d6f3-92f8-5c97-b4d7-81bacf61a68b', '¿Qué es el perímetro de una figura?', 'El espacio que ocupa', 'La medida de su superficie', 'La medida de sus ángulos', 'La medida de su contorno', 'd', 1, 'El perímetro es lo que recorrerías si dieras una vuelta por la orilla de la figura. Se obtiene sumando todos los lados.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9e49d089-ce3a-5736-b94c-66620973ac47', '1b68d6f3-92f8-5c97-b4d7-81bacf61a68b', 'Un marco cuadrado mide 7 cm de lado. ¿Cuál es su perímetro?', '21 cm', '49 cm', '28 cm', '14 cm', 'c', 2, 'Los cuatro lados de un cuadrado son iguales, así que se multiplica el lado por 4. Entonces 4 × 7 cm = 28 cm.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('548e44ff-4ea6-58a9-9ddb-1c35e0325a85', '1b68d6f3-92f8-5c97-b4d7-81bacf61a68b', 'Un terreno rectangular mide 15 m de largo y 10 m de ancho. ¿Cuántos metros de alambre hacen falta para una vuelta?', '150 m', '40 m', '50 m', '25 m', 'c', 3, 'Suma el largo y el ancho: 15 m + 10 m = 25 m. Luego multiplica por 2: 25 m × 2 = 50 m.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c9ef7d17-660b-5e99-ae1b-9a1c4325b22e', 'c06821a9-4c0b-54fa-b6c8-da07064f9a32', '¿Qué mide el área de una figura?', 'El largo de su lado mayor', 'La superficie que cubre por dentro', 'La suma de todos sus lados', 'El contorno que la rodea', 'b', 1, 'El área cuenta cuánto piso o cuánta hoja cubre la figura por dentro. El contorno es otra cosa: es el perímetro.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ce7c5014-a8dc-57ca-bc36-53053f11c07b', 'c06821a9-4c0b-54fa-b6c8-da07064f9a32', 'Un piso rectangular mide 5 m de largo y 4 m de ancho. ¿Cuál es su área?', '10 m²', '9 m²', '18 m²', '20 m²', 'd', 2, 'El área de un rectángulo es base × altura. Aquí, 5 m × 4 m = 20 m².') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e2271bf3-fb2d-55f0-b8b4-d5cc55b08c49', 'c06821a9-4c0b-54fa-b6c8-da07064f9a32', 'Una bandera triangular tiene base de 8 cm y altura de 7 cm. ¿Cuál es su área?', '28 cm²', '15 cm²', '30 cm²', '56 cm²', 'a', 3, 'El triángulo es la mitad de un rectángulo. Primero 8 cm × 7 cm = 56 cm² y luego 56 cm² ÷ 2 = 28 cm².') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6c9cdd74-1851-5747-8fc8-d9fc01203550', 'babda7cb-6e2d-5630-ac18-3f4633700335', '¿Cuántos centímetros tiene 1 metro?', '10 cm', '100 cm', '50 cm', '1000 cm', 'b', 1, 'Un metro equivale a 100 centímetros. Por eso, para pasar metros a centímetros se multiplica por 100.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e6db8567-a05a-59b6-bd08-10ba1a08afeb', 'babda7cb-6e2d-5630-ac18-3f4633700335', 'Una tela mide 3 m y se usan 120 cm. ¿Cuántos centímetros quedan?', '60 cm', '117 cm', '420 cm', '180 cm', 'd', 2, 'Primero pasa los metros a centímetros: 3 × 100 = 300 cm. Luego resta lo que se usó: 300 − 120 = 180 cm.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d41051d1-3d57-5f76-b95d-fe8c08567b74', 'babda7cb-6e2d-5630-ac18-3f4633700335', '¿Cuántos metros son 5 km?', '50000 m', '50 m', '5000 m', '500 m', 'c', 3, 'Un kilómetro tiene 1000 metros. Al pasar a una unidad más chica se multiplica: 5 × 1000 = 5000 m.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f6700017-bcab-55c1-bf85-b2db0db89264', '45f2e278-74e9-5068-b204-c278623b6c99', '¿Cuántos gramos tiene un kilo?', '500 g', '10 g', '100 g', '1000 g', 'd', 1, 'Un kilo es lo mismo que 1000 gramos. Para pasar kilos a gramos se multiplica por 1000.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d2bc1d9f-5d1e-5f1f-a127-825b30c0389b', '45f2e278-74e9-5068-b204-c278623b6c99', '¿Cuántos vasos de 200 ml se llenan con una botella de 1 L?', '5 vasos', '10 vasos', '2 vasos', '50 vasos', 'a', 2, 'Pasa 1 L a mililitros: son 1000 ml. Luego divide entre lo que cabe en cada vaso: 1000 ÷ 200 = 5.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bc39bfdd-b394-5ca2-8846-91753075cbab', '45f2e278-74e9-5068-b204-c278623b6c99', 'Rosa compra 3 kg de masa y usa 800 g. ¿Cuántos gramos le quedan?', '2200 g', '3800 g', '1800 g', '2000 g', 'a', 3, 'Pasa 3 kg a gramos: 3 × 1000 = 3000 g. Luego resta lo que usó: 3000 − 800 = 2200 g.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cc7b784a-b520-534f-9aa1-e7832e7ae106', '581175bb-8f06-5b13-94d8-881589809cca', '¿Qué cuerpo geométrico parece una lata?', 'Esfera', 'Cono', 'Cilindro', 'Cubo', 'c', 1, 'Una lata tiene dos tapas redondas y un lado curvo, como un cilindro. Un cubo parece un dado y un cono parece un cono de tráfico.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('721cf7d3-afd3-52bb-b983-e5c60d4894f5', '581175bb-8f06-5b13-94d8-881589809cca', 'Una caja mide 6 cm de largo, 2 cm de ancho y 5 cm de alto. ¿Cuál es su volumen?', '120 cm³', '60 cm³', '30 cm³', '13 cm³', 'b', 2, 'El volumen de una caja es largo × ancho × alto. Aquí, 6 × 2 × 5 = 60 cm³.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('75537a79-2874-5867-aed2-f7b6d96a0d5c', '581175bb-8f06-5b13-94d8-881589809cca', '¿Cuántas caras tiene un cubo?', '8', '4', '6', '12', 'c', 3, 'La cara es cada superficie plana del cuerpo. Un cubo tiene 6 caras, 12 aristas y 8 vértices.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('eca65c43-e0fa-5fb5-b936-fad1b0558eee', 'c0a33145-fca0-5da5-811e-48e683583d5c', 'Un patio mide 9 m por 6 m. ¿Cuál es su perímetro?', '30 m', '15 m', '24 m', '45 m', 'a', 1, 'Se suman los cuatro lados: 9 m + 6 m + 9 m + 6 m = 30 m. Con el atajo, 15 m × 2 = 30 m.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0b3deca5-1863-541f-8ac7-1710d8d3c1e5', 'c0a33145-fca0-5da5-811e-48e683583d5c', 'Una caja mide 5 cm por 2 cm por 3 cm. ¿Cuál es su volumen?', '15 cm³', '60 cm³', '10 cm³', '30 cm³', 'd', 2, 'El volumen de una caja se calcula con largo × ancho × alto. Entonces 5 × 2 × 3 = 30 cm³.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6f6ff0b7-3dc7-50c8-8bc9-13e935cbcec6', 'c0a33145-fca0-5da5-811e-48e683583d5c', 'Un triángulo tiene ángulos de 60° y 50°. ¿Cuánto mide el tercero?', '40°', '70°', '110°', '130°', 'b', 3, 'Los tres ángulos suman 180°. Primero 60° + 50° = 110° y luego 180° − 110° = 70°.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1737f235-96f6-50de-ac6a-f3c12e33ff64', '1608d349-a6b4-556b-b19f-4081065b7ec4', '¿Qué son los pueblos originarios de México?', 'Pueblos que se formaron después de la Independencia', 'Pueblos que ya vivían aquí antes de los españoles', 'Pueblos que solo vivían en las ciudades grandes', 'Pueblos que llegaron de España hace siglos', 'b', 1, 'Se llaman originarios porque ya vivían en este territorio cuando llegaron los españoles. Hoy sus descendientes viven en todo el país.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2004daf3-bfea-5449-bd2f-8e018d1d3f58', '1608d349-a6b4-556b-b19f-4081065b7ec4', 'Las culturas de Mesoamérica usaban calendarios. ¿Para qué les servían?', 'Para contar cuántas personas vivían en cada pueblo', 'Para medir la altura de las pirámides', 'Para cobrar las cosechas a otros pueblos', 'Para organizar las siembras y las fiestas', 'd', 2, 'Quien siembra necesita saber cuándo empieza la temporada. Por eso el calendario ordenaba el trabajo en el campo y también los días de fiesta.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1fd2affe-67e4-5175-9dec-645418078834', '1608d349-a6b4-556b-b19f-4081065b7ec4', 'Rosa prepara una salsa con tomate, chile y aguacate. ¿De qué lengua vienen esas palabras?', 'Del náhuatl, una lengua que sigue viva', 'Del inglés, que se usa en otros países', 'Del español, que trajeron los españoles', 'Del francés, que se habla en Europa', 'a', 3, 'Tomate, chile y aguacate son palabras del náhuatl. Esa lengua sigue viva, así que Rosa la usa cada vez que cocina.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('80437b19-5aca-58a7-87c7-106b2e0d741b', '738cceb6-288c-5f9f-a36d-d8c3973bd57e', 'El Virreinato tuvo virreyes. ¿Qué hacía un virrey?', 'Dirigía la expedición que llegó en 1519', 'Mandaba en lugar del rey de España', 'Elegía al rey desde la Nueva España', 'Mandaba en lugar de los pueblos aliados', 'b', 1, 'La Nueva España se gobernaba en nombre del rey, que vivía lejos. Por eso enviaba a un virrey para mandar en su lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4b41423d-c2e0-5ae3-9c58-d025e997d69b', '738cceb6-288c-5f9f-a36d-d8c3973bd57e', 'Del tiempo del Virreinato quedó el mestizaje. ¿Qué es?', 'Una ciudad que fundaron los españoles', 'Una religión que llegó de España', 'Un impuesto que cobraba el virrey', 'Una mezcla de personas y culturas distintas', 'd', 2, 'Mestizaje es la mezcla de personas y culturas de distintos pueblos. En esos años se mezclaron pueblos de América, de Europa y de África.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('16f2872a-8130-52fb-9e77-ef28f880ecd0', '738cceb6-288c-5f9f-a36d-d8c3973bd57e', 'México-Tenochtitlan cayó en 1521 y el primer virrey llegó en 1535. ¿Cuántos años pasaron entre esos dos hechos?', '14 años', '16 años', '286 años', '2 años', 'a', 3, 'Se resta el año más antiguo al más reciente: 1535 − 1521 = 14.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b2896d90-ab89-5af5-826c-63679f6ad454', '6834bbf8-eb19-58d0-a88d-522b8679ce91', 'En 1810, ¿de quién dependía la Nueva España?', 'Del presidente de México', 'Del emperador de Francia', 'Del rey de España', 'Del sacerdote de Dolores', 'c', 1, 'La Nueva España era un territorio gobernado en nombre del rey de España. Por eso muchas personas querían gobernarse por sí mismas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0fbf243d-5fe8-50d2-b067-bb2fe6af414c', '6834bbf8-eb19-58d0-a88d-522b8679ce91', 'Cada 15 de septiembre se da el Grito. ¿Qué recuerda esta costumbre?', 'La llegada del primer virrey a México', 'La entrada del ejército a la capital', 'El inicio de la lucha por la Independencia', 'La caída de México-Tenochtitlan', 'c', 2, 'El Grito recuerda el llamado de Hidalgo en Dolores, con el que empezó la lucha. La entrada del ejército a la capital fue al final, en 1821.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('33e40ee3-7094-5878-b147-c0510a1a2887', '6834bbf8-eb19-58d0-a88d-522b8679ce91', '¿Qué pasó cuando Agustín de Iturbide y Vicente Guerrero se unieron?', 'Cortés llegó a las costas del país', 'Su ejército entró a la Ciudad de México', 'Hidalgo llamó al pueblo en Dolores', 'Morelos empezó a gobernar la Nueva España', 'b', 3, 'Al unirse, su ejército entró a la capital el 27 de septiembre de 1821. Ese año se logró la Independencia.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f7a69b1a-bd04-56ef-8721-ea9536e5d9e3', 'd34a7323-71b9-503b-9cb9-517f329643cb', 'En 1857 se publicó una nueva Constitución. ¿Qué reconoció?', 'El derecho del rey de España a gobernar', 'Derechos y libertades para las personas', 'La entrega de tierras a los campesinos', 'El poder de un emperador sobre el país', 'b', 1, 'La Constitución es la ley más importante del país. La de 1857 puso por escrito los derechos y las libertades de las personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6d01d667-5109-5f88-8279-ca79e81d5050', 'd34a7323-71b9-503b-9cb9-517f329643cb', 'Después se aprobaron las Leyes de Reforma. ¿Qué lograron?', 'Separar a la Iglesia y al gobierno', 'Unir a la Iglesia y al gobierno', 'Traer a un ejército de Europa', 'Nombrar a un emperador para México', 'a', 2, 'Con estas leyes, los asuntos de la Iglesia y los del gobierno quedaron separados. Cada uno tiene su propio campo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c6ac298d-a016-53ec-aee9-a5692a1d917d', 'd34a7323-71b9-503b-9cb9-517f329643cb', 'La república volvió en 1867 y Juárez murió en 1872. ¿Cuántos años pasaron entre las dos fechas?', '15 años', '6 años', '4 años', '5 años', 'd', 3, 'Se resta la fecha más antigua a la más reciente: 1872 − 1867 = 5.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3bf42089-d342-5289-ad1f-536495155ca4', 'e8e777ae-8977-520a-86a1-225685f90464', 'Antes de 1910, Porfirio Díaz llevaba más de 30 años como presidente. ¿Qué pedían muchas personas?', 'Que hubiera elecciones libres', 'Que ya no hubiera elecciones', 'Que se cambiara la capital a otra ciudad', 'Que se cerraran las fronteras del país', 'a', 1, 'Después de tantos años con el mismo presidente, muchas personas querían poder elegir a sus gobernantes. Ese reclamo ayudó a que empezara la Revolución.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('646db857-437a-58be-bb79-d9071613288c', 'e8e777ae-8977-520a-86a1-225685f90464', 'Emiliano Zapata luchó en el sur del país. ¿Qué pedía?', 'Casas para los trabajadores', 'Dinero para los soldados', 'Una nueva bandera para el país', 'Tierra para los campesinos', 'd', 2, 'Un campesino es una persona que trabaja la tierra. Por eso el lema de Zapata fue «Tierra y Libertad».') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5d51d8a1-5180-50f8-83e8-b2d7f106ec87', 'e8e777ae-8977-520a-86a1-225685f90464', 'La Constitución de 1917 reconoció derechos para dos grupos. ¿Cuáles fueron?', 'Maestros y comerciantes', 'Dueños de tierras y de minas', 'Soldados y gobernantes', 'Trabajadores y campesinos', 'd', 3, 'La Constitución se publicó el 5 de febrero de 1917 en Querétaro. Reconoció derechos a quienes trabajaban y a quienes cultivaban la tierra.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4ce9e146-900f-5777-a27e-9d6b79a9a83d', '69963727-f013-5867-8946-27b59d176c20', 'Un siglo es un periodo de tiempo. ¿Cuántos años tiene?', '1,000 años', '10 años', '100 años', '50 años', 'c', 1, 'Un siglo son 100 años. Por eso el siglo XX va de 1901 a 2000.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('98d6de33-4e6e-5995-ba00-fa1a170aac4e', '69963727-f013-5867-8946-27b59d176c20', '¿Qué cambio vivieron muchas familias durante el siglo XX?', 'Se mudaron de una ciudad grande a una más pequeña', 'Se mudaron de la costa a la sierra', 'Se mudaron de la ciudad al campo', 'Se mudaron del campo a la ciudad', 'd', 2, 'En esos años crecieron las ciudades, y muchas familias dejaron el campo para vivir en ellas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bd63ba9d-c1ee-5ccb-a401-b973c235df63', '69963727-f013-5867-8946-27b59d176c20', 'En la línea de tiempo de Luis, un hecho está en 1938 y otro en 1968. ¿Cuántos años pasaron entre ellos?', '20 años', '40 años', '30 años', '29 años', 'c', 3, 'Para saber cuánto tiempo pasó entre dos hechos se resta: 1968 − 1938 = 30.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('570b87db-480a-57fc-8854-2ec02d30cc6a', '947edbbb-8ab3-5597-a7f5-a7026edbec5b', '¿Cuáles son los tres símbolos patrios de México?', 'La bandera, el escudo y el himno', 'La bandera, el escudo y el mapa', 'El escudo, el himno y la moneda', 'La bandera, el himno y la Constitución', 'a', 1, 'Los símbolos patrios son imágenes o cantos que representan a todo el país. Son la bandera, el escudo y el himno.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ae6d52eb-ff73-5969-8711-3c6fb2205c88', '947edbbb-8ab3-5597-a7f5-a7026edbec5b', 'En el escudo hay un águila sobre un nopal. ¿Qué historia recuerda?', 'El Grito de Dolores en 1810', 'La fundación de México-Tenochtitlan', 'La batalla de Puebla en 1862', 'La Constitución publicada en Querétaro', 'b', 2, 'El águila sobre el nopal, con una serpiente, recuerda cómo se fundó la ciudad en medio de un lago. Hoy ahí está el centro de la capital.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ce98bffd-a46d-5785-8f83-42ba9f49dade', '947edbbb-8ab3-5597-a7f5-a7026edbec5b', 'Un letrero dice «24 de febrero». ¿Qué se honra ese día?', 'La noche del Grito', 'La Constitución de 1917', 'La bandera nacional', 'El nacimiento de Benito Juárez', 'c', 3, 'El 24 de febrero es el Día de la Bandera. Cada fecha cívica recuerda un hecho o un símbolo importante para todo el país.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7e95b085-4f71-5ba3-aeef-2f4fe1c7d578', 'ab348e54-1cfa-5554-9c37-ea578cce41ab', '¿Cuántos años pasaron del inicio de la Independencia (1810) al fin de la lucha (1821)?', '11 años', '12 años', '10 años', '21 años', 'a', 1, 'Se resta el año en que empezó al año en que terminó: 1821 − 1810 = 11.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c72a7784-5eb7-5dce-8948-4f4730fa835e', 'ab348e54-1cfa-5554-9c37-ea578cce41ab', '¿Qué se recuerda el 16 de septiembre?', 'El inicio de la Revolución, en 1910', 'El inicio de la Independencia, en 1810', 'La caída de México-Tenochtitlan, en 1521', 'La batalla de Puebla, en 1862', 'b', 2, 'El 16 de septiembre de 1810, Hidalgo llamó al pueblo a luchar en Dolores. La Revolución se recuerda el 20 de noviembre.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5b8c8ce0-7d5d-55f2-ab18-a21224502711', 'ab348e54-1cfa-5554-9c37-ea578cce41ab', '¿Qué sirve para ordenar los hechos de la historia según su fecha?', 'Un mapa de la Nueva España', 'Un calendario de siembras', 'Una línea de tiempo', 'Una lista de palabras nuevas', 'c', 3, 'Una línea de tiempo pone los hechos en fila, del más antiguo al más reciente. Así se ve qué pasó antes y qué pasó después.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4b030f59-b30b-5a49-9c74-17be56e630b1', '6f583295-e184-54f5-8392-ec251e1dd014', '¿Qué quiere decir escuchar con atención?', 'Poner atención para entender lo que la otra persona quiere decir', 'Guardar silencio mientras piensas con calma lo que vas a responder', 'Mirar a la persona aunque no entiendas nada de lo que dice', 'Percibir todos los sonidos que hay en el lugar donde estás ahora', 'a', 1, 'Oír es solo percibir sonidos. Escuchar va más allá: pones atención para entender el mensaje de quien habla.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7fb11a5d-cd22-5456-8511-ebf9e4e46bbd', '6f583295-e184-54f5-8392-ec251e1dd014', 'En una junta de vecinos, Rosa explica un problema y Luis habla encima de ella. ¿Qué debió hacer Luis?', 'Esperar a que Rosa terminara de hablar para dar su opinión', 'Mirar su celular mientras ella hablaba y contestar después', 'Levantar la voz para pedir su turno antes de que termine', 'Hablar más fuerte para que todos alcanzaran a escuchar su idea', 'a', 2, 'Interrumpir impide que la otra persona termine su idea. Esperar tu turno permite entender el problema y luego opinar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f91faa96-a4f1-5fe3-842a-32ab8e1f17da', '6f583295-e184-54f5-8392-ec251e1dd014', '¿Qué significa hablar con respeto?', 'Callar tu opinión para evitar cualquier problema con alguien', 'Hablar con voz muy fuerte para que todos te escuchen', 'Decir lo que piensas sin burlarte ni gritar', 'Repetir solo lo que piensan las demás personas del grupo', 'c', 3, 'Tu opinión importa, pero también la de los demás. Por eso se dice con voz tranquila, sin burlas y sin gritos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8db34927-82b1-500f-8eec-1e740e3bec4e', '1699f2a6-be0c-5eb4-a15a-d9557353697f', '¿Qué partes lleva casi siempre una presentación?', 'Nombre, domicilio, teléfono y fecha de nacimiento completa', 'Saludo, opinión, propuesta y despedida', 'Saludo, nombre, algo sobre ti y cierre', 'Nombre, edad, trabajo y dirección de tu casa en detalle', 'c', 1, 'Una presentación es corta. Saludas, dices tu nombre, cuentas algo breve de ti y cierras con una frase amable.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('dce0037b-2730-57ae-9260-4ee2ddfb6759', '1699f2a6-be0c-5eb4-a15a-d9557353697f', 'Una persona que no conoces te pide tu teléfono por mensaje. ¿Qué haces antes de responder?', 'Mandarle también tu domicilio por si lo llega a necesitar', 'Dárselo enseguida para no parecer una persona grosera', 'Darle solo tu domicilio y no tu número de teléfono', 'Preguntar para qué necesita tu número de teléfono', 'd', 2, 'Tus datos dicen quién eres. Si preguntas para qué los piden, decides con información si los compartes o no.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9e4a0a5a-ef68-504d-a8a7-9c898c417b94', '1699f2a6-be0c-5eb4-a15a-d9557353697f', '¿Qué es el domicilio?', 'El lugar donde trabajas todos los días', 'La hoja donde se escriben los datos de una persona', 'El lugar donde naciste y te registraron', 'El lugar donde vives', 'd', 3, 'El domicilio es tu dirección: donde vives. Es un dato personal, así que se da solo cuando sabes para qué lo piden.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c03e1762-993e-54a9-9ee1-057c7ff8d275', 'ec8296c1-b0ba-5366-89fc-2da64ec20572', '¿Qué tres partes tiene una exposición?', 'Presentación, propuesta y respuesta', 'Inicio, desarrollo y cierre', 'Introducción, opinión y queja', 'Saludo, nombre y despedida', 'b', 1, 'Exponer con orden ayuda a que te entiendan. Primero dices el tema, luego lo explicas y al final repites lo importante.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7c33efc0-d9cd-5587-b755-fcf6c8218618', 'ec8296c1-b0ba-5366-89fc-2da64ec20572', 'Vas a exponer una idea ante tu grupo. ¿Qué debes llevar en tus notas?', 'Palabras clave que te recuerden las ideas', 'Solo el título del tema y nada más', 'Todo el texto escrito palabra por palabra', 'Una hoja con muchas frases largas para leerlas', 'a', 2, 'Las palabras clave te recuerdan cada idea y te dejan mirar al grupo. Leer un texto largo hace que dejes de mirar a las personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e6cbc447-3dc8-5824-a0c7-da01b75d963e', 'ec8296c1-b0ba-5366-89fc-2da64ec20572', 'En una exposición, ¿qué haces en el desarrollo?', 'Dices de qué vas a hablar antes de empezar', 'Explicas tu idea con dos o tres razones o ejemplos', 'Pides a todos que opinen antes de explicar nada', 'Repites lo más importante y dices qué propones', 'b', 3, 'El desarrollo es el centro de la exposición. Ahí das razones o ejemplos para que el grupo entienda tu idea.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f09cb17e-e88f-574e-9fb4-489a3ffca9a1', 'b504e197-a2b4-541d-b80e-0952d33f4c81', '¿Qué registra el acta de nacimiento?', 'Que una persona tiene una clave única', 'Que una persona nació', 'Que una persona ya puede votar', 'Que una persona vive en cierto lugar', 'b', 1, 'El acta dice el nombre, la fecha y el lugar de nacimiento de una persona. Por eso se pide en muchos trámites.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b7ec961f-e07d-5d09-ba90-44516f257b11', 'b504e197-a2b4-541d-b80e-0952d33f4c81', '¿De cuántos caracteres es la CURP?', 'De 18 caracteres, entre letras y números', 'De 12 caracteres, solo con letras', 'De 20 caracteres, entre letras y números', 'De 10 caracteres, solo con números', 'a', 2, 'La CURP es una clave que mezcla letras y números. Cada persona tiene la suya, y siempre mide lo mismo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('666b770d-fcc3-5a84-a991-5fb37e8226e8', 'b504e197-a2b4-541d-b80e-0952d33f4c81', '¿Qué documento expide el INE?', 'El comprobante de domicilio', 'El acta de nacimiento', 'La credencial para votar', 'La clave de la CURP', 'c', 3, 'El INE organiza las elecciones federales. Por eso expide la credencial para votar, que muchas personas usan para identificarse.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7e710f40-54a2-5f3a-b769-4ac62aadf192', '08620420-e577-5783-bd50-7eb2f3dc8197', '¿Qué es un trámite?', 'Una fila de personas que esperan su turno en una oficina', 'Una serie de pasos que haces ante una oficina para conseguir algo', 'Un día y una hora que te dan para ser atendido', 'Un papel que te dan al terminar una visita a la oficina', 'b', 1, 'Un trámite tiene varios pasos y reglas propias, por ejemplo pedir un documento. La cita es solo el día y la hora de atención.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b3d5c974-67b9-5a8a-bef3-55d82a820ec9', '08620420-e577-5783-bd50-7eb2f3dc8197', 'Rosa necesita un documento. ¿Por qué le conviene preguntar antes de ir a la oficina?', 'Porque solo atienden a quien llama antes', 'Porque sabe qué papeles llevar y no pierde el viaje', 'Porque así la atienden primero, sin hacer fila', 'Porque el trámite sale más barato si pregunta antes', 'b', 2, 'Si llegas sin saber qué llevar, puedes hacer fila y que te falte un papel. Preguntar antes te ahorra tiempo y gasto de pasaje.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bd3dcc36-b142-519b-b998-28ac7eabb710', '08620420-e577-5783-bd50-7eb2f3dc8197', '¿Por qué debes pedir el dato vigente de un trámite?', 'Porque las filas son más largas en algunos meses', 'Porque los documentos que llevas dejan de servir pronto', 'Porque cada persona hace el trámite en un orden distinto', 'Porque los requisitos cambian con el tiempo', 'd', 3, 'Vigente es lo que sigue valiendo hoy. Un dato que te dieron hace tiempo puede estar viejo, así que conviene confirmarlo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('53bee47f-f8d1-54f0-a71d-1b3d62e06d79', 'c30453c9-5761-514b-933b-4bcd55c00692', '¿Qué es un desacuerdo?', 'Cuando dos personas piensan o quieren cosas distintas', 'Cuando una persona le echa la culpa a otra', 'Cuando dos personas se enojan y dejan de hablarse', 'Cuando dos personas aceptan la misma decisión', 'a', 1, 'Pensar distinto es normal y pasa en todos lados. El problema no es el desacuerdo, sino cómo se resuelve.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c8477f97-4f3a-5929-bcfc-ac5287fcc374', 'c30453c9-5761-514b-933b-4bcd55c00692', 'Ana quiere hablar del olor en el pasillo sin acusar a Luis. ¿Qué frase le conviene decir?', 'Nadie aquí cuida el pasillo como se debe', 'Tú no respetas a nadie en este edificio', 'Tú siempre dejas la basura sucia en el pasillo', 'Yo me siento incómoda con el olor del pasillo', 'd', 2, 'Una frase con «yo» cuenta lo que sientes sin echar la culpa. Así la otra persona escucha y no se pone a la defensiva.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9b758ef6-69d6-5d9e-b8b5-4712934125f8', 'c30453c9-5761-514b-933b-4bcd55c00692', 'Dos personas ya eligieron una idea para resolver su desacuerdo. ¿Qué hacen al final?', 'Dejar de hablar del tema para siempre', 'Pedir a otra persona que decida por ellas', 'Repetir en voz alta lo acordado', 'Anotar quién tuvo la culpa del problema', 'c', 3, 'Repetir lo acordado confirma que ambos entendieron lo mismo. Así se evitan malos entendidos después.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cfabfebb-ecf2-5952-8a2d-b5e4bb8dc7ff', 'a6cef619-23f2-5699-b438-bbba0c408f92', '¿Qué es una entrevista de trabajo?', 'Una cita para llenar un formulario con tus datos', 'Una junta con las demás personas que ya trabajan ahí', 'Una conversación con quien ofrece un puesto', 'Un examen escrito sobre el trabajo que se ofrece', 'c', 1, 'En la entrevista la persona que ofrece el puesto quiere conocerte. Tú también puedes preguntar sobre el trabajo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a650ee1d-8d81-52a9-900a-34cd974a522a', 'a6cef619-23f2-5699-b438-bbba0c408f92', 'Nunca has tenido un empleo y te piden hablar de ti. ¿Qué puedes contar?', 'Que todavía no tienes nada que contar', 'Un trabajo que no hiciste, pero que suena bien', 'Lo que hacen otras personas en ese mismo puesto', 'Lo que has hecho en la escuela o en tu casa', 'd', 2, 'También se aprende en la escuela y en la casa. Contar cosas ciertas que sí hiciste muestra tu perfil con honestidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('64410fe5-12ad-557f-9747-ff217eeadfe3', 'a6cef619-23f2-5699-b438-bbba0c408f92', 'En una entrevista te preguntan algo que no sabes hacer. ¿Qué haces?', 'Lo reconoces y dices que te gustaría aprenderlo', 'Cambias de tema sin decir nada sobre la pregunta', 'Inventas una respuesta para quedar bien con quien entrevista', 'Dices que sí lo sabes y lo aprendes después', 'a', 3, 'Decir la verdad da confianza. Reconocer lo que no sabes y mostrar ganas de aprender es mejor que inventar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bd0638f6-3be7-52b5-88ca-2129afd064e8', '0ab0a6c8-86c1-54ce-8544-6bba48e08bc3', 'Una persona te interrumpe cuando hablas. ¿Qué puedes decir para pedir tu turno con respeto?', 'Mejor ya no digo nada, olvídalo', 'Ya, deja de interrumpir siempre', 'Con permiso, déjame terminar', 'Sigo hablando y no te hago caso', 'c', 1, 'Esta frase pide tu turno sin burlas ni gritos. Cuidas la conversación y tu opinión también se escucha.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2ea4f784-f022-51e5-9285-8e07b97e5c66', '0ab0a6c8-86c1-54ce-8544-6bba48e08bc3', 'Vas a hacer un trámite. ¿Qué preguntas haces antes de ir?', 'Qué ropa usar y con quién ir', 'Qué documentos llevar, el horario y si necesitas cita', 'Qué comer en el camino y a qué hora salir de casa', 'Quién dirige la oficina y cuántos años tiene', 'b', 2, 'Esas preguntas te dicen qué llevar, cuándo ir y si hace falta cita. Así evitas hacer el viaje en vano.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5fd4cb3a-eda1-5ea9-993a-aac7da38bc99', '0ab0a6c8-86c1-54ce-8544-6bba48e08bc3', 'En una entrevista te dicen «Cuéntame de ti». ¿Cómo cierras tu respuesta?', 'Con tu fecha de nacimiento completa', 'Con tu domicilio y tu teléfono', 'Con una queja del trabajo anterior', 'Con una pregunta sobre el puesto', 'd', 3, 'Cerrar con una pregunta muestra interés en el puesto. Además, tú también puedes conocer cómo es el trabajo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5336d407-4c91-5838-8606-5e7003b5f98a', 'f2721ce6-2eaa-539f-87ca-bc30f2b5bc4f', 'Una compra cuesta $73 y pagas con un billete de $100. ¿Cuánto cambio te deben regresar?', '$173', '$23', '$27', '$37', 'c', 1, 'El cambio es lo que sobra de tu pago. Se calcula restando el precio al dinero entregado: 100 − 73 = 27.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9586cbad-f4aa-559a-af24-60df202bab85', 'f2721ce6-2eaa-539f-87ca-bc30f2b5bc4f', 'Pagas una compra con más dinero del que cuesta. ¿Qué es el cambio?', 'El dinero que te regresan cuando pagas de más', 'El precio de un producto antes de pagarlo', 'El total de todo lo que compraste en la tienda', 'La suma de las monedas que traes en la bolsa', 'a', 2, 'Cuando entregas más de lo que cuesta la compra, la parte que sobra regresa a ti. Esa parte se llama cambio.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('056fb92b-b77f-59d0-86f9-bab5cdf23328', 'f2721ce6-2eaa-539f-87ca-bc30f2b5bc4f', 'Una cuenta es de $64.50 y pagas con $100. ¿Cuánto te regresan?', '$36.50', '$34.50', '$35.50', '$164.50', 'c', 3, 'Con centavos la resta es igual que con pesos enteros: 100 − 64.50 = 35.50. Cuida el punto decimal al restar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('71d33e01-183b-5b9e-a882-d0e86306cbc3', 'f3a2805a-47ea-5d0f-bdba-20a4eceaa9b7', 'Los ingresos del mes son $4,500 de un trabajo y $1,500 de otro. Los gastos suman $5,200. ¿Cuánto sobra?', '$700', '$800', '$1,800', '$11,200', 'b', 1, 'Primero se suman los ingresos: 4,500 + 1,500 = 6,000. Luego se restan los gastos: 6,000 − 5,200 = 800.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('91445fbc-52f1-563c-9558-5f34aab8fbf4', 'f3a2805a-47ea-5d0f-bdba-20a4eceaa9b7', 'En un presupuesto, ¿cómo son los gastos fijos?', 'Los que no se anotan en el presupuesto', 'Los que cambian mucho de un mes a otro', 'Los que solo pagas una vez al año', 'Los que pagas casi igual cada mes', 'd', 2, 'Un gasto fijo, como la renta, se paga casi igual cada mes. Los que cambian de un mes a otro son los gastos variables.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6695f3fc-8029-57c6-b90a-d726b62f217c', 'f3a2805a-47ea-5d0f-bdba-20a4eceaa9b7', 'Al restar los gastos a los ingresos, el resultado sale negativo. ¿Qué significa?', 'Gastas más de lo que entra', 'Gastas lo mismo que te entra', 'Te sobra dinero al final del mes', 'Tus ingresos subieron este mes', 'a', 3, 'Un resultado negativo quiere decir que salió más dinero del que entró. Conviene revisar qué gasto se puede bajar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4f634ec7-4c34-526b-aefe-0dfb4a953dc4', 'af504194-020f-5190-adf9-2bdc42d69e13', 'Una despensa cuesta $840 y tiene 50 % de descuento. ¿Cuánto dinero te descuentan?', '$1,680', '$210', '$84', '$420', 'd', 1, 'El 50 % es la mitad. Se divide la cantidad entre 2: 840 ÷ 2 = 420.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1aa00fa2-2468-5b50-b761-0feb650f0eb9', 'af504194-020f-5190-adf9-2bdc42d69e13', 'Una cuenta del mercado es de $360. ¿Cuánto es el 25 % de esa cuenta?', '$180', '$120', '$36', '$90', 'd', 2, 'El 25 % es la cuarta parte de la cantidad. Se divide entre 4: 360 ÷ 4 = 90.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('054fcf4b-55a1-55e0-98e7-9806a4a9ff50', 'af504194-020f-5190-adf9-2bdc42d69e13', 'En un letrero, el signo % se lee «por ciento». ¿Qué quiere decir?', 'De cada 1,000', 'De cada 100', 'De cada 50', 'De cada 10', 'b', 3, 'Por ciento significa «de cada 100». Por eso el 10 % de 100 pesos son 10 pesos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5b164393-80d8-5a91-9bd8-47cc2154b9e3', 'e3942113-a6a9-503d-b00a-38adeed02042', 'Una sudadera cuesta $200 y tiene 25 % de descuento. ¿Cuánto pagas?', '$180', '$150', '$50', '$250', 'b', 1, 'Primero se saca el descuento: 200 ÷ 4 = 50. Luego se resta al precio: 200 − 50 = 150.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2bc9bdea-d1f9-53f2-9557-f5dd2d17631b', 'e3942113-a6a9-503d-b00a-38adeed02042', 'Una cobija cuesta $450 y tiene 10 % de descuento. ¿Cuál es el precio final?', '$495', '$400', '$405', '$45', 'c', 2, 'El descuento es 450 ÷ 10 = 45. El precio final es lo que pagas: 450 − 45 = 405.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3baf79b1-6fa7-5235-a5aa-996b21608c41', 'e3942113-a6a9-503d-b00a-38adeed02042', 'Tienda A: $500 con 50 % de descuento. Tienda B: $280 con 10 % de descuento. ¿Cuánto pagas en la oferta que conviene más?', '$450', '$280', '$250', '$252', 'c', 3, 'En A pagas 500 − 250 = 250 y en B pagas 280 − 28 = 252, así que conviene la que deja pagar menos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('31474b62-17d4-5a47-83ea-ac180be978a8', 'a6fae7fd-6a49-5468-9136-e61326b0ada1', 'Quieres juntar $2,400 en 8 meses para pagar una deuda. ¿Cuánto guardas cada mes?', '$200', '$300', '$600', '$240', 'b', 1, 'La meta se divide entre el número de meses: 2,400 ÷ 8 = 300. Para comprobar, 8 × 300 = 2,400.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('905ce843-5572-564b-9061-93b6ea4ae9b7', 'a6fae7fd-6a49-5468-9136-e61326b0ada1', 'Quieres juntar $4,500 y puedes guardar $750 al mes. ¿Cuántos meses necesitas?', '6 meses', '9 meses', '7 meses', '5 meses', 'a', 2, 'Se divide la meta entre lo que guardas cada mes: 4,500 ÷ 750 = 6. Necesitas 6 meses.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a186b36b-d878-594b-abc1-f5e33f2a2fbd', 'a6fae7fd-6a49-5468-9136-e61326b0ada1', 'Tu meta es $2,000 y ya llevas $650. ¿Cuánto te falta?', '$2,650', '$1,350', '$1,450', '$1,250', 'b', 3, 'Para ver cuánto falta se resta lo que llevas a la meta: 2,000 − 650 = 1,350.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e56d280f-fc36-51bc-b0f7-44c2d573ef0c', 'f1b48147-ae62-5050-a7c5-68fa58aedb70', 'Alguien te presta dinero y te cobra algo extra por el servicio. ¿Cómo se llama ese cobro?', 'Interés', 'Cambio', 'Deuda', 'Abono', 'a', 1, 'El interés es el dinero extra que pagas por usar un préstamo. El abono es cada pago pequeño, y la deuda es lo que debes.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bf7aa5af-84af-50b2-81f0-9540cf1aa1d6', 'f1b48147-ae62-5050-a7c5-68fa58aedb70', 'Te prestan $2,000 y los devuelves en 4 pagos de $600. ¿Cuánto pagas en total?', '$2,000', '$1,400', '$2,600', '$2,400', 'd', 2, 'El total se calcula multiplicando el pago por el número de pagos: 4 × 600 = 2,400.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('547d3255-0405-5f6c-8c60-6bb8b495ced1', 'f1b48147-ae62-5050-a7c5-68fa58aedb70', 'Pides prestados $1,500 y los pagas con 6 abonos de $280. ¿Cuánto pagas de más?', '$180', '$280', '$120', '$1,680', 'a', 3, 'El total es 6 × 280 = 1,680. Al restar lo prestado queda el interés: 1,680 − 1,500 = 180.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('91d97c0d-4734-5d10-b925-073d68341387', '756e0903-b552-5f87-b04d-25d9e8cee32b', 'Un recibo de luz marca lectura anterior 8,215 y lectura actual 8,390. ¿Cuánto consumiste?', '165 kilowatts-hora', '16,605 kilowatts-hora', '175 kilowatts-hora', '185 kilowatts-hora', 'c', 1, 'El consumo es la lectura actual menos la anterior: 8,390 − 8,215 = 175. La luz se mide en kilowatts-hora.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('18a2f5a2-3239-5015-8589-1a78ce2f3b12', '756e0903-b552-5f87-b04d-25d9e8cee32b', 'En un recibo de agua ficticio, la lectura anterior es 240 y la actual es 262. Cada metro cúbico cuesta $4. ¿Cuánto es el cobro?', '$66', '$22', '$88', '$26', 'c', 2, 'Primero el consumo: 262 − 240 = 22 metros cúbicos. Luego el cobro: 22 × 4 = 88.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b96c5a46-bd40-531d-be93-0d68b8c7cbb1', '756e0903-b552-5f87-b04d-25d9e8cee32b', 'En un recibo, ¿qué es la fecha límite?', 'La cantidad total que debes entregar', 'El último día para pagar sin cargos extra', 'El primer día del periodo que cubre el recibo', 'El número que marca el medidor', 'b', 3, 'Si pagas después de esa fecha, pueden cobrarte un cargo extra. Por eso conviene revisarla en cuanto llega el recibo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d95eb682-ba44-5747-9ee0-3b1c596cfa07', '4c9b02a3-2222-57e3-b202-230c089207ec', 'Una compra cuesta $720 y pagas con $1,000. ¿Cuánto te regresan?', '$320', '$1,720', '$380', '$280', 'd', 1, 'Se resta el precio al dinero entregado: 1,000 − 720 = 280. Esa parte que sobra es el cambio.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2270f378-86aa-55ee-8013-edc8f27f7c20', '4c9b02a3-2222-57e3-b202-230c089207ec', 'Un recibo trae una cuenta de $600. ¿Cuánto es el 25 % de esa cantidad?', '$150', '$60', '$300', '$200', 'a', 2, 'El 25 % es la cuarta parte. Se divide entre 4: 600 ÷ 4 = 150.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('19c4c30a-ab4a-51a4-8bd9-f68355181dc9', '4c9b02a3-2222-57e3-b202-230c089207ec', 'Un préstamo de $800 se paga con 4 abonos de $230. ¿Cuánto es el interés?', '$230', '$920', '$60', '$120', 'd', 3, 'El total es 4 × 230 = 920. Al restar lo prestado queda el interés: 920 − 800 = 120.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7d4adc3e-ef2e-577f-b85f-ebd17a91b41a', 'a94b9777-fedd-581a-aa05-9b8e6a824133', 'En un mapa, ¿qué es la simbología?', 'Los dibujos que explican las marcas del mapa', 'El conjunto de calles que aparecen', 'El nombre que dice qué lugar muestra', 'El camino más corto entre dos lugares', 'a', 1, 'La simbología explica qué significa cada marca del mapa. Por eso conviene revisarla antes de buscar un lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('318a67d1-2328-51d7-9dff-daaa0ec7ecdd', 'a94b9777-fedd-581a-aa05-9b8e6a824133', 'Luis consulta un mapa de su colonia. ¿Qué es un mapa?', 'Un letrero con el nombre del lugar', 'Un dibujo de un lugar visto desde arriba', 'Una lista con los puntos cardinales', 'Una foto del lugar tomada de frente', 'b', 2, 'Un mapa muestra un lugar como si lo miraras desde arriba. Casi siempre trae título, rosa de los vientos y simbología.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9a69fdd1-0bc9-5036-a5d2-5d69369fa84d', 'a94b9777-fedd-581a-aa05-9b8e6a824133', '¿Qué país toca a México por el norte?', 'Belice', 'Guatemala', 'Estados Unidos', 'Canadá', 'c', 3, 'Al norte, México limita con Estados Unidos. Guatemala y Belice quedan al sur del país.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9b62f765-96a1-5b63-9d81-04394ca8b861', '21f33d24-b69f-5c33-a996-4ce54ce4fa56', '¿Cuántas entidades federativas tiene México?', '31', '32', '33', '30', 'b', 1, 'Son 31 estados más la Ciudad de México. Juntos forman las 32 entidades del país.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('359610ae-fc04-5eb5-8f79-e0abd8fafa61', '21f33d24-b69f-5c33-a996-4ce54ce4fa56', '¿Cómo se llama la ciudad principal de una entidad, donde trabaja su gobierno?', 'El municipio', 'La capital', 'La colonia', 'La región', 'b', 2, 'Cada entidad tiene una ciudad principal que se llama capital. Ahí trabaja el gobierno de esa entidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8be90a52-2f31-56bc-8e4e-2451326a2489', '21f33d24-b69f-5c33-a996-4ce54ce4fa56', '¿En qué partes se dividen los estados?', 'En entidades', 'En regiones', 'En capitales', 'En municipios', 'd', 3, 'Cada estado se reparte en municipios. Cada municipio tiene su propio gobierno local.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('016f4fe9-4282-5d3b-9c56-f365988d2ed9', 'afdee67d-63b5-5bb5-97ac-65be2a35c905', '¿Qué es el relieve?', 'Cómo suele ser el tiempo en un lugar', 'La forma que tiene el terreno', 'La cantidad de lluvia de cada año', 'Una zona con rasgos parecidos', 'b', 1, 'El relieve habla de la forma del suelo: partes altas y partes planas. El tiempo de un lugar es el clima.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('46a770ed-3dbe-58f6-bfbd-2602e48c3faa', 'afdee67d-63b5-5bb5-97ac-65be2a35c905', 'Luis sube de la costa a la sierra y necesita chamarra. ¿Por qué hace más frío allá?', 'Porque llueve más cada año', 'Porque queda más lejos del mar', 'Porque el lugar está más alto', 'Porque tiene menos árboles', 'c', 2, 'La altura cambia la temperatura. Mientras más sube un lugar sobre el nivel de la costa, más frío suele hacer.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('db543313-1385-542f-9ec7-bfa35ba91d90', 'afdee67d-63b5-5bb5-97ac-65be2a35c905', '¿Qué clima tiene gran parte del norte de México?', 'Cálido', 'Seco', 'Frío', 'Templado', 'b', 3, 'En el clima seco llueve muy poco, y así es gran parte del norte. El clima cálido es el de las costas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('cb20c472-f335-5551-9705-893e819ec327', '6f1dd0f9-a091-516b-9a66-985e9bda54c0', '¿Cuál de estos recursos se acaba y no vuelve pronto?', 'El petróleo', 'El Sol', 'El viento', 'Los bosques', 'a', 1, 'El petróleo es un recurso no renovable. El Sol y el viento no se agotan al usarlos, y los bosques vuelven si se cuidan.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a2ac5bd8-74e8-50cd-92dd-d6509edba809', '6f1dd0f9-a091-516b-9a66-985e9bda54c0', '¿En qué estados se saca petróleo sobre todo?', 'Yucatán y Quintana Roo', 'Oaxaca y Chiapas', 'Durango y Chihuahua', 'Tabasco y Campeche', 'd', 2, 'El petróleo se encuentra en el Golfo de México, sobre todo frente a Tabasco y Campeche.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('db689ad6-f0ca-571e-95cb-7b4bafd5d217', '6f1dd0f9-a091-516b-9a66-985e9bda54c0', '¿Qué es lo que daña a un recurso natural?', 'Usarlo con mucho cuidado', 'Usarlo sin cuidado', 'Usarlo solo cuando hace falta', 'Usarlo sabiendo cómo cuidarlo', 'b', 3, 'Usar un recurso no es malo. Lo que lo daña es gastarlo sin cuidado, por eso conviene cerrar la llave y separar la basura.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c8435f6f-dca4-510e-ab27-9a785cdc6acc', '9880b69a-5275-5338-87f0-1ff95fb18a20', '¿Qué es la cultura?', 'La forma de vivir de un grupo de personas', 'Las fiestas que hay en un pueblo', 'El lugar donde vive una familia', 'El conjunto de lenguas de un país', 'a', 1, 'La cultura incluye comida, música, ropa, fiestas y lengua. Por eso cada grupo de personas tiene la suya.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b190f219-cc4c-5ad5-9fb2-0195630fcdfe', '9880b69a-5275-5338-87f0-1ff95fb18a20', '¿Cuántas lenguas indígenas se reconocen en México?', '68', '86', '48', '32', 'a', 2, 'México reconoce 68 lenguas indígenas. Cada una guarda conocimientos y una manera de ver el mundo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1623a40e-5651-5696-826c-87060a1785dd', '9880b69a-5275-5338-87f0-1ff95fb18a20', '¿Cuál de estas palabras viene del náhuatl?', 'Camión', 'Mercado', 'Aguacate', 'Cocina', 'c', 3, 'Tomate, aguacate y chocolate son palabras del español que vienen del náhuatl. Así se ve cómo esa lengua sigue viva en lo que decimos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2f3f29c9-ff9f-5f29-a2d6-431f4bb60f72', '428ea9dd-ab83-5b8c-989d-3d063055e888', '¿Cómo se llama el gobierno local de un municipio?', 'La capital', 'El comité', 'El ayuntamiento', 'El censo', 'c', 1, 'Cada municipio tiene su gobierno local, que se llama ayuntamiento. Atiende muchos servicios de la comunidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('863c84e7-660e-5ff3-87d7-bd7e1d8c2717', '428ea9dd-ab83-5b8c-989d-3d063055e888', '¿Cuál de estos es un servicio público de la comunidad?', 'La tienda de abarrotes de la esquina', 'Un taller mecánico de la colonia', 'La fiesta de cumpleaños de un vecino', 'El alumbrado de las calles', 'd', 2, 'Los servicios públicos ayudan a todos los habitantes. El alumbrado, las calles y las banquetas son algunos de ellos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0a31a8fb-d6ee-5247-864d-72d2b51c3351', '428ea9dd-ab83-5b8c-989d-3d063055e888', 'Un foco de la calle lleva días fundido. ¿Qué pueden hacer los vecinos?', 'Hacer una junta y esperar a que alguien más lo pida', 'Llevar el aviso a una escuela de la colonia', 'Escribir juntos un aviso y llevarlo al ayuntamiento', 'Pedir a cada vecino que lleve su propio foco a la calle', 'c', 3, 'Los vecinos se organizan para resolver problemas de todos. Un aviso escrito juntos llega al ayuntamiento, que atiende el alumbrado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5c1f8d90-48d9-598f-b3a9-f2c5a9cef3ed', 'f8284429-e576-5704-8d9a-4ce601598153', '¿Qué es la población?', 'El cambio del lugar donde una persona vive', 'El conteo que se hace de las personas del país', 'Un pueblo con pocos habitantes y mucho campo', 'El conjunto de personas que viven en un lugar', 'd', 1, 'La población son las personas que viven en un pueblo, un estado o un país. Contarlas es trabajo del censo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ce06d121-af26-58cb-b762-55841a6918bc', 'f8284429-e576-5704-8d9a-4ce601598153', '¿Cada cuánto cuenta el censo a la población del país?', 'Cada 5 años', 'Cada año', 'Cada 10 años', 'Cada 20 años', 'c', 2, 'El número de habitantes cambia, por eso el censo se repite cada 10 años. Para saber el dato de hoy se consulta el último.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6cc6779a-69a6-5d58-9dfe-2063ec50daee', 'f8284429-e576-5704-8d9a-4ce601598153', 'Luis nació en un pueblo y hoy trabaja en una ciudad. ¿Cómo se llama cambiar el lugar donde vives?', 'Censar', 'Reciclar', 'Poblar', 'Migrar', 'd', 3, 'Migrar es cambiar de lugar de residencia, dentro del país o hacia otro país. Las razones son muy variadas y merecen respeto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('02e76eeb-af92-5099-bd0e-be1bc140af50', '384e4193-1a66-53df-a7e2-370f089b0138', 'Si miras hacia donde sale el Sol, ¿qué punto cardinal es?', 'El este', 'El norte', 'El sur', 'El oeste', 'a', 1, 'El Sol sale más o menos por el este y se oculta por el oeste. El este también se llama oriente.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('44a5bc8a-f3f4-5b0c-a56d-a7df16b81d56', '384e4193-1a66-53df-a7e2-370f089b0138', '¿En cuál de estos lugares suele hacer más frío?', 'En una sierra alta', 'En una playa del Golfo', 'En un pueblo junto al mar', 'En una llanura de la costa', 'a', 2, 'El frío aumenta con la altura. Las costas y las llanuras bajas suelen ser más cálidas que las sierras.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c8a3a3dc-4b1d-560e-be80-c36dcba382c3', '384e4193-1a66-53df-a7e2-370f089b0138', '¿Cuál de estos recursos es renovable si se cuida?', 'El petróleo', 'Los minerales', 'La plata', 'El agua', 'd', 3, 'El agua vuelve a existir con el tiempo si la cuidamos. El petróleo y los minerales, como la plata, se acaban y no vuelven pronto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d1d5d33b-bdb3-5b24-91bc-f9fa22ba87c0', 'db2c9875-6008-5c31-a885-c5fe65ecd8ee', 'En una tabla de conteo, ¿qué haces cada vez que alguien pide una fruta?', 'Anotas un grupo de cinco rayitas completo', 'Sumas todos los totales de la tabla', 'Borras una rayita de la fila de esa fruta', 'Haces una rayita en la fila de esa fruta', 'd', 1, 'Cada pedido es un dato y cada dato lleva una rayita. Al final cuentas las rayitas de cada fila.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('66879138-f3be-5840-a0e6-15dce1b4b7e3', 'db2c9875-6008-5c31-a885-c5fe65ecd8ee', 'Una tabla de conteo dice: mango 6, plátano 8 y papaya 5. ¿Cuántos clientes hubo?', '14 clientes', '19 clientes', '21 clientes', '17 clientes', 'b', 2, 'Se suman los totales de todas las filas: 6 + 8 + 5 = 19. Esa suma dice cuántos datos hay.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1a0aa362-2e8f-57c0-a5ad-2a83a89d5744', 'db2c9875-6008-5c31-a885-c5fe65ecd8ee', 'Una fila de la tabla tiene ///// ///// //. ¿Cuántos datos tiene esa fila?', '7 datos', '10 datos', '12 datos', '22 datos', 'c', 3, 'Cada grupo de cinco rayitas vale 5 datos, y quedan 2 sueltas: 5 + 5 + 2 = 12.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('047476f1-ba47-5d61-97d6-e8bfbc62e067', '781ad924-9d78-5bab-9f49-ccec56cf981f', 'En una gráfica de barras, ¿qué te dice la barra más larga?', 'Que ese dato se repite más veces', 'Que ese dato es el menor de todos', 'Que ese dato es el mayor de todos', 'Que ese dato es el primero de la lista', 'c', 1, 'Entre más larga es la barra, mayor es el dato. La barra más corta muestra el dato menor.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ea0aa2d6-787a-5e84-bde4-fc73c5e533dc', '781ad924-9d78-5bab-9f49-ccec56cf981f', 'En una gráfica de barras, el martes se vendieron 9 cajas y el miércoles 4 cajas. ¿Qué diferencia hay?', '5 cajas', '6 cajas', '13 cajas', '4 cajas', 'a', 2, 'La diferencia entre dos datos se saca con una resta: 9 − 4 = 5.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d3007ee4-5eb9-5ba2-95d7-a12d954406af', '781ad924-9d78-5bab-9f49-ccec56cf981f', 'En una gráfica, cada ■ vale 5 cajas. Una barra tiene 6 ■. ¿Cuántas cajas muestra?', '6 cajas', '25 cajas', '30 cajas', '11 cajas', 'c', 3, 'La escala dice cuánto vale cada ■. Se multiplica: 6 × 5 = 30 cajas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('826c5e91-3c05-5d85-8d65-9ccb9c406deb', '04459f1a-58da-519b-a2b4-e3cd9bb96065', 'En un pictograma, ¿qué dice la clave?', 'Lo que vale cada dibujo', 'Cuántos dibujos hay en total', 'Cuál dibujo se repite más veces', 'Cuánto tiempo pasó entre dos datos', 'a', 1, 'La clave indica la cantidad que representa cada dibujo. Sin ella no sabes cuánto vale un círculo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a885f36c-a290-5213-9f9d-84111f94333a', '04459f1a-58da-519b-a2b4-e3cd9bb96065', 'En un pictograma, cada ● vale 10 litros. El jueves tiene ●●●●●●●. ¿Cuántos litros son?', '17 litros', '60 litros', '70 litros', '7 litros', 'c', 2, 'Cada dibujo vale 10 litros y hay 7 dibujos: 7 × 10 = 70 litros.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bed3236e-5a41-558c-ad21-5130bc422283', '04459f1a-58da-519b-a2b4-e3cd9bb96065', 'En una gráfica de línea, la línea va hacia abajo entre dos puntos. ¿Qué pasa con el dato?', 'El dato se repite en esos dos puntos', 'El dato queda igual en esos dos puntos', 'El dato baja entre esos dos puntos', 'El dato sube entre esos dos puntos', 'c', 3, 'La línea muestra cómo cambia el dato. Si va hacia abajo, el dato baja.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('72d8a99c-2fbe-5132-ad11-44601a4d9346', '39bf407e-39a0-5c0c-b09e-efb67e585246', '¿Qué pasos sigues para sacar el promedio de varios datos?', 'Restas el menor al mayor y divides entre dos', 'Sumas todos los datos y multiplicas por cuántos son', 'Cuentas cuál dato sale más veces y lo anotas', 'Sumas todos los datos y divides entre cuántos son', 'd', 1, 'Primero sumas todos los datos. Luego divides esa suma entre cuántos datos son.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8e3a18b4-e92e-5e9b-982a-bfce4899a4cd', '39bf407e-39a0-5c0c-b09e-efb67e585246', 'Ana gastó en pasajes $12, $18 y $15 en tres días. ¿Cuánto gastó en promedio al día?', '$15', '$12', '$18', '$45', 'a', 2, 'Suma: 12 + 18 + 15 = 45. Divide entre los 3 días: 45 ÷ 3 = 15.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('447ddb1e-bc2a-51c6-b83e-94bde125a85c', '39bf407e-39a0-5c0c-b09e-efb67e585246', 'El promedio de unos datos es 7. ¿Qué significa ese 7?', 'El dato más grande de toda la lista', 'El dato que más veces se repite en la lista', 'La suma de todos los datos de la lista', 'Lo que valdría cada dato si todos fueran iguales', 'd', 3, 'El promedio es un reparto parejo de todos los datos. Es el valor que tendría cada uno si fueran iguales.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e4ca14e9-34e4-5a56-bb88-25ccde2180e0', 'ee8ea1c3-7059-5b35-b62e-ae9622e22b68', '¿Qué es la moda de una lista de datos?', 'El resultado de sumar y dividir los datos', 'El dato más grande de la lista', 'El dato que más veces se repite', 'El dato que queda en medio de la lista', 'c', 1, 'Para encontrar la moda solo cuentas cuántas veces sale cada dato. El que más veces sale es la moda.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('30c667a5-1f70-5e75-9414-0eb1cd662f94', 'ee8ea1c3-7059-5b35-b62e-ae9622e22b68', 'Una combi anotó cuántos pasajeros subieron en cada vuelta: 2, 3, 2, 5, 2 y 3. ¿Cuál es la moda?', '5 pasajeros', '2 pasajeros', '3 pasajeros', '6 pasajeros', 'b', 2, 'El 2 sale 3 veces, el 3 sale 2 veces y el 5 sale una vez. El dato que más se repite es el 2.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('2412b352-172d-5cfd-a2fa-04841f0d1668', 'ee8ea1c3-7059-5b35-b62e-ae9622e22b68', 'En un taller hay 6 sillas rojas, 4 negras y 2 blancas. ¿Cuál es la moda?', 'El color rojo', 'El color blanco', 'No hay moda', 'El color negro', 'a', 3, 'Rojo sale 6 veces, negro 4 y blanco 2. La moda es el dato que más se repite, así que es rojo.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ca069ec3-2343-5c5e-a8d8-6225e2fbcbe6', '3eb52459-090f-50e7-8fa1-336b2ee32fc2', 'Una bolsa solo tiene canicas verdes. Sacar una canica verde es...', 'Poco probable', 'Imposible', 'Posible', 'Seguro', 'd', 1, 'Si todas las canicas son verdes, siempre saldrá una verde. Lo que pasa siempre es seguro.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8640d608-98d1-5a25-977c-176fb7347d57', '3eb52459-090f-50e7-8fa1-336b2ee32fc2', 'Un dado tiene seis caras, con los números del 1 al 6. Sacar el 9 es...', 'Seguro', 'Imposible', 'Poco probable', 'Posible', 'b', 2, 'El dado solo tiene números del 1 al 6. Un número que no existe en el dado nunca va a salir.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ec9b75d1-bf87-5a19-992e-b2b491ab4c8f', '3eb52459-090f-50e7-8fa1-336b2ee32fc2', 'Una bolsa tiene 5 canicas azules y 2 amarillas. Sin ver, ¿cuál color es más probable que salga?', 'Los dos por igual, porque hay de cada color', 'El azul, porque hay más canicas azules', 'Ninguno, porque no se puede saber', 'El amarillo, porque hay menos canicas amarillas', 'b', 3, 'Hay 5 − 2 = 3 canicas azules más. Es más probable lo que tiene más casos a favor.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('07f77d82-c0f4-59ae-987e-1ec5dbdea3ea', 'b910ad40-ad39-54b1-9bb4-b605df1f4106', 'Antes de opinar sobre una gráfica, ¿qué debes leer?', 'El título, la escala, la fecha y la fuente', 'Solo el dato mayor y el dato menor', 'Solo el nombre de quien la publica', 'El color, el tamaño y la forma de las barras', 'a', 1, 'Esos datos dicen de qué trata la gráfica, cuánto vale cada marca, de cuándo es y de dónde salió.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9cc8812a-648a-5a2f-96cf-f5a63f24899e', 'b910ad40-ad39-54b1-9bb4-b605df1f4106', 'En una gráfica de consumo de luz, cada ■ vale 20 kilowatts-hora. El periodo 1 tiene 5 ■ y el periodo 2 tiene 8 ■. ¿Cuánto subió el consumo?', '3 kilowatts-hora', '160 kilowatts-hora', '100 kilowatts-hora', '60 kilowatts-hora', 'd', 2, 'Periodo 2: 8 × 20 = 160 y periodo 1: 5 × 20 = 100; subió 160 − 100 = 60.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ad9794cf-069b-540d-975e-43b4e9f965ef', 'b910ad40-ad39-54b1-9bb4-b605df1f4106', 'La escala de una gráfica de barras empieza en 45 y no en cero. ¿Qué puede pasar?', 'Las barras pueden quedar todas del mismo tamaño', 'Las barras pueden exagerar la diferencia', 'La gráfica puede mostrar datos de otra fecha', 'Las diferencias pueden verse más chicas de lo real', 'b', 3, 'Si la escala no empieza en cero, una barra puede parecer mucho mayor que otra. Por eso revisas dónde empieza.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('fe1f431e-b481-51f9-b008-3a1c62448b42', '7958f52e-0eb6-5567-87b0-86a2e818577e', 'En un pictograma, cada ● vale 3 cajas. Una fila tiene 4 ●. ¿Cuántas cajas son?', '15 cajas', '12 cajas', '9 cajas', '7 cajas', 'b', 1, 'Cada dibujo vale lo que dice la clave: 4 × 3 = 12 cajas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b4609694-e65e-5466-8697-9cb51cd8abb9', '7958f52e-0eb6-5567-87b0-86a2e818577e', 'En el repaso, ¿cuál es el promedio de 6, 9 y 12?', '27', '3', '12', '9', 'd', 2, 'Suma: 6 + 9 + 12 = 27. Divide: 27 ÷ 3 = 9.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('c89ff6a4-62a3-5d26-b7ae-947e282c55e6', '7958f52e-0eb6-5567-87b0-86a2e818577e', 'En el repaso, ¿cuál es la moda de 4, 5, 5, 6, 5 y 7?', '5', '4', '6', '7', 'a', 3, 'El 5 sale 3 veces y los demás una sola vez. La moda se encuentra contando.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('149db903-0f31-5a8d-ac0f-ca29dc085780', '55f0c1f8-0f66-59d5-bc02-5a79aa00e6e4', '¿Qué quiere decir dignidad?', 'Que merece respeto quien tiene estudios', 'Que merece respeto quien tiene un trabajo', 'Que toda persona merece respeto por ser persona', 'Que merece respeto según su edad', 'c', 1, 'La dignidad no depende del trabajo, de los estudios ni de la edad. Se tiene por ser persona, y por eso todos merecemos respeto.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b1cbc72d-5ab1-518e-9f14-e3b060e14d0f', '55f0c1f8-0f66-59d5-bc02-5a79aa00e6e4', '¿Desde cuándo tiene una persona sus derechos humanos?', 'Desde que empieza a trabajar', 'Desde que nace', 'Desde que termina la escuela', 'Desde que cumple 18 años', 'b', 2, 'Nadie te los regala ni los ganas con el tiempo. Los derechos humanos se tienen desde el nacimiento, por el solo hecho de ser persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('008f929e-635f-5a1f-906a-0cd8742d3488', '55f0c1f8-0f66-59d5-bc02-5a79aa00e6e4', 'Doña Carmen y Luis cuentan su idea para arreglar el patio, se escuchan sin gritos y votan. ¿Qué derecho ejercieron?', 'El derecho a la salud', 'El derecho a opinar', 'El derecho a la educación', 'El derecho a un trabajo digno', 'b', 3, 'Cada quien dijo su idea, y eso es opinar. Además se escucharon, así que también respetaron el derecho del otro.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ae11b59b-5fed-583c-befa-eaa883eea9f7', '07f95dda-f6ba-52c5-8fe4-4910e2be94ef', '¿Qué es la Constitución?', 'Una ley que se aplica solo en los tribunales', 'La ley que solo usa la presidencia', 'El reglamento de cada estado', 'La ley más importante del país', 'd', 1, 'Todas las demás leyes deben respetarla. En ella están tus derechos y se explica cómo se organiza el gobierno.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e644ac15-33f9-53f9-865f-33f838c595c1', '07f95dda-f6ba-52c5-8fe4-4910e2be94ef', '¿Quiénes forman el Poder Legislativo?', 'Diputados y senadores', 'La presidencia de la República', 'Presidencias municipales y regidores', 'Jueces y tribunales', 'a', 2, 'Diputados y senadores trabajan en el Congreso y se encargan de hacer y cambiar las leyes.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a51c878a-ac38-5a70-b215-3d9949a06d0e', '07f95dda-f6ba-52c5-8fe4-4910e2be94ef', '¿Por qué el gobierno se divide en tres poderes?', 'Para que haya más cargos en el gobierno', 'Para que las leyes cambien más rápido', 'Para que cada poder haga lo que quiera', 'Para evitar que una sola persona abuse del poder', 'd', 3, 'Repartir el poder lo limita. Si una sola persona lo tuviera todo, podría abusar de él.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('99e47383-aa47-545e-bbbd-068311a46082', 'f2ad4f65-6b21-505c-9a0d-3284ee5d9df4', 'A Luis no le prende la lámpara de su calle. ¿A quién le avisa?', 'A los tribunales federales, donde se resuelven juicios', 'Al gobierno de su estado', 'Al ayuntamiento, donde se atienden servicios locales', 'Al Congreso de la Unión', 'c', 1, 'El municipio es el gobierno más cercano y da los servicios locales. El alumbrado de las calles es uno de ellos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('e7115930-3bf4-5ede-82af-4863c525dfd2', 'f2ad4f65-6b21-505c-9a0d-3284ee5d9df4', '¿Cuántas entidades tiene México?', '33', '31', '32', '30', 'c', 2, 'México tiene 31 estados y la Ciudad de México, en total 32 entidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f0e81412-d0f4-58af-90ea-427308f73774', 'f2ad4f65-6b21-505c-9a0d-3284ee5d9df4', '¿De qué asuntos se ocupa la federación?', 'Los caminos estatales y las leyes del estado', 'El agua potable y la basura', 'Los mercados y el alumbrado', 'Las fronteras y la moneda', 'd', 3, 'La federación es el gobierno de todo el país. Atiende asuntos que son de todos, como las fronteras, la moneda y las carreteras federales.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5bcde12d-4d2c-56f1-a4b5-7fc304603cfc', '608f2ef2-ab2c-5d51-9945-620b16eafaf3', '¿Quiénes son adolescentes?', 'Las personas de 13 a 18 años', 'Las personas de 15 a 20 años', 'Las personas de 12 a 17 años', 'Las personas de 10 a 15 años', 'c', 1, 'Las niñas y los niños son menores de 12 años. A partir de los 12 y hasta los 17 años se es adolescente.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('4bbe2e47-e36f-59a8-8910-5484e7a799cc', '608f2ef2-ab2c-5d51-9945-620b16eafaf3', 'Cuando una decisión afecta a niñas, niños y adolescentes, ¿qué se piensa primero?', 'En su bienestar', 'En su obediencia', 'En su comodidad', 'En lo que cuesta atenderlos', 'a', 2, 'A esto se le llama interés superior. Lo primero es cuidar su bienestar, por encima de otros intereses.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6e8c6c68-1fda-57ad-9afc-8cc27d834808', '608f2ef2-ab2c-5d51-9945-620b16eafaf3', '¿Quiénes comparten el deber de cuidar a las personas mayores?', 'La familia, la escuela y el trabajo', 'La familia, la sociedad y el gobierno', 'La familia, los vecinos y la escuela', 'El gobierno, los jueces y los vecinos', 'b', 3, 'Cuidar a quien lo necesita es tarea de todos: de la familia, de la sociedad y también del gobierno.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('286797cf-a23a-53b6-91be-6104d334a881', '606f2b32-7acc-556a-a268-318b81ad7bb0', '¿Qué es discriminar?', 'Tener una opinión distinta a la de otra persona', 'Negarse a hacer un favor a un conocido', 'Tratar peor a una persona por una característica suya', 'Ser distinto a la mayoría de las personas', 'c', 1, 'Discriminar es dar un trato peor por quién es la persona. Con ese trato se le niegan o limitan sus derechos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('67a3b64f-747f-5a70-ba55-87093a7cd5b2', '606f2b32-7acc-556a-a268-318b81ad7bb0', 'Una persona vive discriminación y quiere pedir orientación. ¿A dónde puede acudir?', 'A la comisión de derechos humanos de su estado', 'Al Congreso de la Unión, donde se hacen las leyes', 'Al ayuntamiento, donde se atienden servicios locales', 'A los tribunales federales, donde se resuelven juicios', 'a', 2, 'La comisión de derechos humanos de cada estado orienta a quien vive discriminación. Además, no es culpa de la persona que la vive.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5237696b-ab9e-5053-a225-2105844e4eb3', '606f2b32-7acc-556a-a268-318b81ad7bb0', '¿Qué quiere decir igualdad?', 'Que todas las personas tenemos el mismo trabajo', 'Que todas las personas tenemos las mismas costumbres', 'Que todas las personas tenemos los mismos derechos', 'Que todas las personas somos idénticas en todo sentido', 'c', 3, 'Ser iguales no es ser idénticos. Somos distintos, pero valemos lo mismo y tenemos los mismos derechos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8d8872bc-860f-5d4f-9823-98a0504da42d', 'ffaa99d9-1fdd-5115-8931-f5f8e4c4c5e5', '¿A qué edad una persona mexicana es ciudadana?', 'A los 16 años', 'A los 18 años', 'A los 20 años', 'A los 21 años', 'b', 1, 'Con 18 años se adquiere el derecho a votar y a participar en las decisiones del país, y también la responsabilidad de cuidar lo común.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5175360c-e345-5a0e-b0d0-05f2ee484d17', 'ffaa99d9-1fdd-5115-8931-f5f8e4c4c5e5', 'El voto es secreto. ¿Qué quiere decir esa palabra?', 'Que nadie te puede obligar a elegir una opción', 'Que solo tú puedes votar por ti', 'Que el resultado no se da a conocer', 'Que nadie debe saber por quién votaste', 'd', 2, 'Por eso se marca la boleta en privado. Que nadie te obligue es ser libre, y que solo tú votes es ser personal.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5163b04c-bd22-5ff6-885e-f26aabf9d962', 'ffaa99d9-1fdd-5115-8931-f5f8e4c4c5e5', '¿Qué es la casilla?', 'El lugar donde se vota', 'La caja donde se depositan las boletas', 'El documento para poder votar', 'El papel donde se marca el voto', 'a', 3, 'La casilla es el lugar. El papel es la boleta, la caja es la urna y el documento es la credencial para votar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('5aecdcf8-d9d9-557b-bc22-dafaa91d52e9', '598148e3-c04f-58b2-9cef-52ae0cc83581', '¿Qué es la violencia?', 'Un desacuerdo entre dos personas', 'Una discusión con voces altas', 'Un enojo que se siente en el momento', 'Un daño que una persona causa a otra', 'd', 1, 'El desacuerdo es un conflicto y se puede resolver hablando. La violencia es distinta, porque implica causar un daño.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bcf538cc-d8a2-5a45-abab-4b12900f0d52', '598148e3-c04f-58b2-9cef-52ae0cc83581', 'Dos vecinos discuten y están muy molestos. ¿Qué ayuda a prevenir la violencia?', 'Respirar y hacer una pausa antes de responder', 'Responder de inmediato para aclarar todo', 'Hablar más fuerte para ser escuchado', 'Dejar de hablar con la otra persona', 'a', 2, 'La pausa permite calmarse. Después se escucha y se busca un acuerdo que sirva a los dos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b7e96c2c-c56d-5141-a667-65a8debede02', '598148e3-c04f-58b2-9cef-52ae0cc83581', 'Una persona que vive violencia quiere hablar con alguien. ¿Cómo es la Línea de la Vida?', 'Es gratuita y atiende solo de lunes a viernes', 'Es gratuita y atiende solo en horario de oficina', 'Tiene costo y atiende todos los días', 'Es gratuita y atiende las 24 horas, todos los días', 'd', 3, 'Se puede llamar a cualquier hora, sin pagar. Pedir ayuda es válido, y la violencia nunca es culpa de quien la vive.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3ab02e44-4849-5f05-8d41-2058ee2cda71', 'fb5f8b51-3c2e-5ceb-8c5d-6bade874426a', '¿Qué hace el Poder Ejecutivo?', 'Resuelve conflictos', 'Aplica las leyes', 'Hace las leyes', 'Escribe la Constitución', 'b', 1, 'Cada poder tiene su tarea. El Legislativo hace las leyes, el Ejecutivo las aplica y el Judicial resuelve conflictos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('67ce42d4-24c5-5a1f-8534-c7261b574759', 'fb5f8b51-3c2e-5ceb-8c5d-6bade874426a', '¿Hasta dónde llegan tus derechos?', 'Hasta donde llega tu trabajo diario', 'Hasta donde empiezan los de otra persona', 'Hasta donde alcanza tu opinión', 'Hasta donde termina tu casa o tu terreno', 'b', 2, 'Por eso, cuando exiges respeto, también respetas. Así se vive mejor en una comunidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('ac41aa52-f4e3-5952-b638-0fd700a3da6b', 'fb5f8b51-3c2e-5ceb-8c5d-6bade874426a', 'A una persona le niegan un servicio por su religión. ¿Qué es eso?', 'Discriminación', 'Un desacuerdo de opiniones', 'Un conflicto entre vecinos', 'Un acto de participación', 'a', 3, 'Negar un servicio por una característica de la persona es tratarla peor. No es culpa de quien lo vive, y puede pedir orientación.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('f16a003a-db83-532b-8821-6446c2c4390a', 'bd770a6a-4798-5979-929f-fab052c4849b', '¿Qué es una habilidad?', 'Un título que te da una escuela', 'Un trabajo que ya tienes seguro', 'Un dinero que te dan por ayudar', 'Algo que sabes hacer bien', 'd', 1, 'Una habilidad es algo que sabes hacer bien, como cocinar, vender o arreglar cosas. No depende de tener un título ni de que alguien te pague.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d4bee75a-0766-5c47-8649-3e93a9bba24c', 'bd770a6a-4798-5979-929f-fab052c4849b', 'Luis arregla bicicletas, pero dice que no sabe hacer «nada especial». ¿Qué dice la lección?', 'No tiene una habilidad, porque arreglar bicicletas lo hace mucha gente', 'No tiene una habilidad, porque no estudió para arreglar bicicletas', 'Sí tiene una habilidad, pero solo si alguien le da un título', 'Sí tiene una habilidad, aunque nadie se la enseñó en una escuela', 'd', 2, 'Las habilidades también se aprenden viendo y practicando. Luis sabe hacer algo muy útil, aunque nadie se lo haya enseñado en una escuela.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('d7aeeffb-1863-5e0a-8afe-a13d9094ac65', 'bd770a6a-4798-5979-929f-fab052c4849b', 'Ser puntual o paciente, ¿qué es?', 'Un plan, lo que quieres lograr y cómo', 'Un obstáculo, algo que te estorba', 'Una actitud, la forma en que te comportas', 'Una meta, algo que quieres conseguir', 'c', 3, 'Una actitud es la forma en que te comportas. Ser puntual o paciente muestra cómo actúas, muestra cómo actúas con los demás.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6a2bfa16-96d5-5d92-afbe-4df9ba696890', '9448c90e-f6d5-55c3-92e6-b22cb633500f', '¿Qué debe tener un currículum?', 'Una lista del sueldo que quieres ganar', 'Solo lo que hiciste en trabajos con contrato', 'Datos verdaderos de tus estudios y tu trabajo', 'Datos mejorados para parecer más preparado', 'c', 1, 'Quien contrata lee el currículum rápido, por eso debe ser claro, ordenado y verdadero. Nunca se ponen datos falsos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('0cd1526f-0c81-5548-9251-556bb85c2ca2', '9448c90e-f6d5-55c3-92e6-b22cb633500f', 'Una oferta de empleo te pide dinero por adelantado. ¿Qué haces?', 'Pagar poco, porque luego se descuenta del sueldo', 'Pagar la mitad, porque así se asegura el puesto', 'Pagar todo, porque así se aparta el lugar', 'No pagar, porque un empleo real no te cobra', 'd', 2, 'Pedir dinero por darte el trabajo es señal de oferta falsa. Un empleo serio no cobra para contratarte, así que conviene desconfiar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6cab6a99-536d-582e-828e-83066a9c2946', '9448c90e-f6d5-55c3-92e6-b22cb633500f', '¿Cómo se llena una solicitud de empleo?', 'Con letra clara, leyendo cada pregunta antes', 'Con letra rápida, para terminar antes que otros', 'Con la letra de siempre, sin leer todas las preguntas', 'Con letra bonita, aunque cueste leerla', 'a', 3, 'La solicitud se llena con letra clara para que se entienda. Leer cada pregunta antes de responder evita errores y datos mal puestos.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('052aa8a8-5f82-5384-9ec8-d8c21db0df16', '61c35b55-39a7-5057-94f3-5150159b3bde', '¿Qué es un contrato de trabajo?', 'Un papel que solo firma la persona que contrata', 'Un permiso del gobierno para trabajar cada año', 'Un pago extra que da la empresa cada mes', 'Un acuerdo por escrito entre quien trabaja y quien contrata', 'd', 1, 'El contrato es un acuerdo entre las dos partes y debe ser por escrito. Así queda claro el puesto, el pago y el horario.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7f17bf06-311d-590e-b2ce-190c4a1b5cff', '61c35b55-39a7-5057-94f3-5150159b3bde', 'Antes de aceptar un trabajo, ¿qué pides sobre el contrato?', 'Una promesa de palabra del jefe', 'Un aviso por mensaje sobre el horario', 'Una copia por escrito para guardarla', 'Que el jefe lo guarde en la oficina', 'c', 2, 'Con tu copia puedes revisar después lo acordado: pago, horario y puesto. Una promesa de palabra no deja nada por escrito para revisar.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bc8df59e-c23b-5e45-a8a9-c0b8fbdcee58', '61c35b55-39a7-5057-94f3-5150159b3bde', '¿Qué incluye la seguridad social?', 'Un préstamo para abrir tu propio negocio', 'Un descuento en comida en el mercado', 'Atención médica y ayuda si te enfermas', 'Un lugar para vivir cerca del trabajo', 'c', 3, 'La seguridad social protege tu salud. La da el trabajo con contrato y registro en el IMSS, e incluye atención médica y apoyo si te lastimas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7c211d73-7fee-5ea9-a3f8-3f23d75aea2b', '8b563749-b0fb-5cf8-9647-dcce41e80ca9', '¿Qué es un equipo?', 'Un grupo que hace siempre la misma tarea', 'Un grupo que trabaja por un mismo fin', 'Un grupo donde solo manda una persona', 'Un grupo que vive en la misma calle', 'b', 1, 'En un equipo cada persona hace una parte del trabajo y todas dependen de las demás. Lo que las une es el fin que buscan juntas.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('7baa8591-2ba5-5384-b0ae-dd9623cae03a', '8b563749-b0fb-5cf8-9647-dcce41e80ca9', '¿Qué dice un mensaje claro?', 'Qué hay que hacer, quién lo hace y para cuándo', 'Quién tuvo la culpa, cuándo pasó y por qué', 'Qué hizo cada quien ayer, hoy y mañana', 'Quién manda, cuánto gana y cuánto se tarda', 'a', 2, 'Un mensaje claro permite que todos sepan su tarea y su fecha. Sin esos tres datos, el trabajo se atrasa o se hace dos veces.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('9acd1cb6-e31d-5017-b0fc-6c25764297f4', '8b563749-b0fb-5cf8-9647-dcce41e80ca9', 'En el equipo hay un desacuerdo. ¿Qué conviene hacer?', 'Dejar que decida quien habla más fuerte', 'Hablar con respeto, sin gritos y sin culpar', 'Hacer cada quien lo que prefiera hacer', 'No hablar del tema para evitar problemas', 'b', 3, 'Un desacuerdo es normal y no significa que alguien sea malo; se resuelve hablando con respeto. Si nadie habla, el trabajo se desordena.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('6c470d83-f9a4-552a-a4a8-e63f22b967af', 'c62fae2b-35da-5aab-b0a0-5668ac3fafa7', '¿Cuál de estas actividades es un servicio?', 'Hacer un guisado en casa para vender', 'Comprar cuadernos en una papelería', 'Preparar gelatinas para vender', 'Arreglar la bicicleta de un vecino', 'd', 1, 'Un servicio es una ayuda que das a otra persona. Un producto, en cambio, se puede tocar, como una gelatina, un cuaderno o un guisado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('42f729ba-09a9-5374-a7ca-a0c05a124f69', 'c62fae2b-35da-5aab-b0a0-5668ac3fafa7', 'Antes de gastar mucho en una idea de negocio, ¿qué conviene hacer?', 'Esperar a que nadie más venda lo mismo', 'Preguntar a posibles clientes si la comprarían', 'Copiar el precio de otro negocio sin preguntar', 'Comprar mucho material para tener de sobra', 'b', 2, 'Preguntar antes de gastar te dice si de verdad hay quien compre. Así evitas perder dinero en una idea que nadie necesita.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('79b6b747-db80-56fd-b687-6b28ebdfd6be', 'c62fae2b-35da-5aab-b0a0-5668ac3fafa7', 'En un negocio, ¿qué es la competencia?', 'Los gastos que haces para empezar el negocio', 'Las personas que te compran cada semana', 'Los vecinos que te prestan dinero para empezar', 'Otras personas que venden lo mismo cerca', 'd', 3, 'La competencia son quienes ya ofrecen lo mismo cerca de ti. Conviene averiguar qué venden antes de empezar tu negocio.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('80a6ac5e-b14f-5fa4-8e36-c0c42c87ead8', '50d0f0a2-f5af-58d3-b0b5-9f0bfe28e50e', 'Para hacer pasteles, Rosa gasta $80 en harina, $60 en huevos y $30 en gas. ¿Cuál es el costo total?', '$170', '$90', '$140', '$110', 'a', 1, 'El costo incluye todos los gastos: 80 + 60 + 30 = 170. Si olvidas el gas, por ejemplo, la cuenta sale mal.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('8a128dba-a795-55bb-8444-49a1e7bfd825', '50d0f0a2-f5af-58d3-b0b5-9f0bfe28e50e', 'Un costo total de $240 se reparte en 30 piezas. ¿Cuánto cuesta cada pieza?', '$210', '$270', '$8', '$80', 'c', 2, 'Para el costo de cada pieza se divide el costo total entre las piezas: 240 ÷ 30 = 8. Cada pieza cuesta $8.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('bb175dbd-bb95-5047-9590-9dcaad222cfd', '50d0f0a2-f5af-58d3-b0b5-9f0bfe28e50e', 'Una pieza cuesta $8 y se vende en $14. ¿Cuál es la ganancia por pieza?', '$8', '$6', '$7', '$22', 'b', 3, 'La ganancia es el precio menos el costo: 14 − 8 = 6. Sumarlos o repetir el costo no dice cuánto te queda.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('369075b2-762f-5ee8-8551-ede4ba40cfff', '93a9c813-7352-5b80-9213-e629d318c160', 'Llega un cliente a tu puesto. ¿Qué haces primero?', 'Ofrecer lo más caro que tengas', 'Contar el dinero de la caja', 'Saludar con amabilidad', 'Cobrar antes de preguntar nada', 'c', 1, 'La venta empieza con un saludo amable. Después escuchas lo que necesita, dices el precio, cobras y das el cambio.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('1b256947-58f4-56cd-8c4d-b5a8a04e20ed', '93a9c813-7352-5b80-9213-e629d318c160', 'Un cliente compra 3 cuadernos de $22 y paga con un billete de $100. ¿Cuánto cambio recibe?', '$34', '$66', '$122', '$44', 'a', 2, 'Primero se calcula el total: 3 × 22 = 66; luego el cambio: 100 − 66 = 34. El cliente recibe $34.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('3e875390-26cd-58da-a1ae-022b7a4588f9', '93a9c813-7352-5b80-9213-e629d318c160', 'Al cobrar, ¿cómo cuentas el dinero?', 'A la vista del cliente, para dar confianza', 'Después, cuando se vaya el cliente', 'Dentro de la caja, para no perderlo', 'Aparte, para no distraerlo', 'a', 3, 'Contar a la vista da confianza y evita malentendidos sobre cuánto te pagaron y cuánto cambio toca.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('b93edcdc-ed02-516f-aaac-ff2dd6c25aa0', 'e478f71f-a6cb-50da-8a3b-c8cf65cc9be8', 'Los gastos de un puesto son $70, $45 y $60. ¿Cuál es el costo total?', '$105', '$175', '$115', '$130', 'b', 1, 'Se suman todos los gastos: 70 + 45 + 60 = 175. Si dejas uno fuera, el costo sale menor y el precio queda mal calculado.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('db9dab9c-3dbf-5642-b980-af5f3ee22688', 'e478f71f-a6cb-50da-8a3b-c8cf65cc9be8', 'Un cliente paga con $200 una compra de $135. ¿Cuánto cambio le das?', '$55', '$65', '$75', '$335', 'b', 2, 'El cambio es lo que pagó menos lo que compró: 200 − 135 = 65. Se cuenta frente al cliente.') ON CONFLICT DO NOTHING;
INSERT INTO public.quiz_semana (id, semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES ('a22293a4-2a5a-5363-8bc9-9a13860212ab', 'e478f71f-a6cb-50da-8a3b-c8cf65cc9be8', '¿Cómo se calcula la ganancia de cada pieza?', 'Precio menos costo de la pieza', 'Precio más costo de la pieza', 'Costo menos precio de la pieza', 'Costo entre precio de la pieza', 'a', 3, 'La ganancia es lo que queda del precio después de pagar el costo. Por eso se resta el costo al precio.') ON CONFLICT DO NOTHING;

INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a66cbd04-2065-5807-ad6a-a7579927cfcc', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Propósito', 'la razón por la que se escribe un texto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a3581795-d3a6-57a0-b55d-6d6b871dad49', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Aviso', 'texto que informa algo a muchas personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('79765039-aea6-5ab4-b7a5-a38bc6c11a78', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Recado', 'mensaje corto que se deja para otra persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1f5931b1-5aec-570f-a575-25dd213c4dc3', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Etiqueta', 'papel pegado a un producto con datos sobre él.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9aeda82b-c89b-5454-ac8e-bdd921ce86f0', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Caducar', 'dejar de servir después de una fecha.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a9881248-d602-5a7a-8155-9bd06af00c50', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Sílaba', 'cada golpe de voz con el que se dice una palabra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5fbfe630-d0f2-5202-a47e-d797d6c8654b', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Vocal', 'una de las letras a, e, i, o, u.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7ff8d33e-b418-5d39-9120-157f9db8e2ec', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Fluidez', 'leer sin trabarse y con ritmo parejo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('61276fc2-fd43-52de-81ef-6161d0c36097', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Idea principal', 'lo más importante que dice un texto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('dd5021d6-cfed-5f6d-ba2b-80095bfc05c1', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Detalle', 'dato que acompaña a la idea principal y la explica.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bf90b429-2ee7-5ef6-953a-d0df96467f8b', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Texto', 'conjunto de oraciones que dicen algo completo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4c41be44-ebf2-50d0-86a8-068f5c155a89', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Informativo', 'que da datos para que sepas algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('74729382-c1c5-56a0-a062-341792b60e63', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Noticia', 'texto que cuenta un hecho reciente.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d05741fd-5f82-5a30-8ef9-39cdc6a8b050', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Titular', 'título corto que dice de qué trata la noticia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('34927c65-f17b-5fe5-9157-ddf42377fce5', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Inventario', 'conteo de todo lo que hay en una tienda.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('34c36c93-9bf6-5f24-b1f3-5e0611956633', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Narrativo', 'que cuenta una historia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fc6d27eb-d112-56e9-ae48-e01a03d18364', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Personaje', 'persona o animal que vive la historia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f0fff27f-b4b6-56e7-863d-d01d5f623f83', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Desarrollo', 'parte de la historia donde aparece el problema.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('974c9ebd-f3b3-529d-9807-d784eb3f9b70', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Sinónimo', 'palabra que significa casi lo mismo que otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3ccffea7-617f-5a64-8cf0-e7239228358f', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Antónimo', 'palabra que significa lo contrario de otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f903b6dd-2fed-5ba8-9732-d8958554084b', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Diccionario', 'libro que explica el significado de las palabras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ba15614a-3ff2-53a7-811c-0f25809f933a', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Significado', 'lo que quiere decir una palabra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b4f911ae-acb9-55e6-bd72-9a2fb86a28d4', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Instrucción', 'texto que explica cómo hacer algo paso a paso.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c5fd43d6-9854-5098-955a-4edaba067809', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Paso', 'cada acción que se hace en un orden.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ae052cd2-801d-5080-a2ce-5d7227876ac6', '8fd788a6-b83d-555f-8afe-a3ef68ee6d2c', 'Advertencia', 'aviso sobre un riesgo o algo que debes cuidar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ed6629c4-142a-5eb0-8e56-bcf2abca8246', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Cifra', 'cada uno de los símbolos del 0 al 9 con que se escribe un número.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('13609c87-1756-5f30-a438-f904b746e129', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Millón', 'el número 1,000,000, que se escribe con un 1 y seis ceros.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c0e062f5-eb97-5ebc-9f85-f5668cd8482c', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Miles', 'el grupo de tres cifras que está después de las unidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e89e36b4-0596-5ef2-aa35-3bb11469c0d4', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Cero', 'la cifra que guarda un lugar vacío.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('461b050c-cb15-5c2b-a0fb-75bb18872cce', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Valor posicional', 'lo que vale una cifra por el lugar donde está.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('66bcfd02-ec54-5397-9293-e87a6824bb5f', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Decena', 'un grupo de 10 unidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e50750f0-036e-5bc4-8a3e-4154b407f4fb', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Centena', 'un grupo de 100 unidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b9846166-98ce-50c4-a9aa-96583b42369e', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Descomponer', 'separar un número en el valor de cada una de sus cifras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6970a44d-7881-5648-bb9d-43cd996e5906', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Llevar', 'pasar una cantidad a la siguiente columna al sumar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c98d2d83-781f-51b0-a109-9e8caa070c77', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Pedir prestado', 'quitar una unidad a la columna de la izquierda para poder restar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0c777696-201e-591e-b976-ca2e67fe4abf', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Comprobar', 'revisar que un resultado esté bien.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('827c3b2b-278b-5bb6-a005-a62278ad43d1', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Total', 'lo que resulta de juntar todas las cantidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fc3c5273-5f55-5696-9dc6-eadc397a8cd6', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Cambio', 'el dinero que te regresan cuando pagas de más.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0a9ff283-f5b6-51e1-a2e5-390126e5591d', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Diferencia', 'lo que una cantidad tiene de más que la otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c622eee8-ff2a-5ca6-a64a-1150c84218f8', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Comparar', 'ver cuál de dos números es mayor, menor o igual.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3cd7e4fd-5eb8-59f5-ba85-f1937bb1c573', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Mayor que', 'quiere decir que una cantidad es más grande que otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5341b136-0864-537c-807c-111bcaedd393', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Menor que', 'quiere decir que una cantidad es más pequeña que otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fe27ef28-e12e-5302-b29f-e272d04391bb', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Redondear', 'cambiar un número por otro cercano que termina en ceros.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4d767b28-4b4a-513b-b5ba-d4e2079d641f', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Estimar', 'calcular un resultado cercano, sin hacer la cuenta exacta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0cd09f39-7cdb-5e1a-9106-cb3e45eef2cc', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Millar', 'un grupo de 1,000 unidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d054e69a-0e0d-5fcf-ad34-540744b7d3bc', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Número romano', 'número escrito con letras, como X o XLVII.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6de845c1-1954-52ec-9cd7-b46badbfeabe', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Año bisiesto', 'año con un día más en febrero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('796d6584-eaa9-5296-8eb2-f28effa18c69', '5f39fa31-ebcc-5582-9cc5-364a7b122c7e', 'Lapso', 'el tiempo que pasa entre dos momentos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('628807ff-3ef8-5186-a22b-bd8e2c42a433', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Órgano', 'parte del cuerpo que hace una tarea, como el corazón.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('94d6f20c-0872-58d7-ae77-5c36f0bec0ba', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Aparato', 'órganos distintos que hacen juntos una tarea, como el digestivo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('521c325a-8b18-5c05-b00e-55f23d3cd4da', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Sistema', 'órganos del mismo tipo que hacen una tarea, como el muscular.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5f884e73-5060-58b3-af3b-087d6288d528', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Nervio', 'hilo delgado que lleva mensajes entre el cerebro y el cuerpo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a06b8972-0b3c-5eb9-957c-81bd8259c0d3', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Alimentación correcta', 'la que cumple las seis características: completa, equilibrada, inocua, suficiente, variada y adecuada.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cc63fa57-3778-5074-a2b5-954e48fa98da', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Inocua', 'que no hace daño porque no tiene contaminantes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bc11b079-4a30-58f8-b49b-14a398e37630', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Fibra', 'parte de las plantas que ayuda a digerir.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3ea4109c-4edb-592c-bdf3-c1f71f530ea8', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Leguminosa', 'semilla que crece en vaina, como el frijol o la lenteja.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2abd6fee-0b03-55ec-a47b-15c082a86ec4', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Germen', 'ser muy pequeño que puede causar una enfermedad.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5f8c4cd4-aaed-5189-aea5-7ca933793992', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Contagio', 'paso de una enfermedad de una persona a otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7cb3d589-ac19-5ec4-bccd-62486299cb86', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Prevenir', 'actuar antes de que ocurra un problema.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('abbb2cd1-3be5-5419-bb59-37f2edcca9cb', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Potable', 'agua que es segura para beber.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ce837f7f-102d-51a1-868d-b3113927ee27', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Vacuna', 'medicina que prepara las defensas del cuerpo contra una enfermedad.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f97b9b01-6699-5f2f-b2ec-e0f6677897f2', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Defensas', 'parte del cuerpo que lucha contra los gérmenes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5589f819-2aa1-546d-b341-4eae45ba6edc', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Cartilla', 'documento donde se anotan tus vacunas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ac5758c2-a957-5b55-8295-1c0236ea10c0', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Centro de salud', 'lugar donde te dan atención médica básica.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0f48b03c-f8d6-5cf3-a851-811d5676196d', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Emoción', 'lo que sientes ante algo que pasa, como alegría o miedo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0beadf83-d57b-553f-8b23-92ee6579a690', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Estrés', 'respuesta del cuerpo ante una presión.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('176de103-9ba5-59c3-98ff-08888bfcdea0', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Angustia', 'sensación de preocupación y de ahogo que no se va.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cd8cf885-5f7a-5e77-a659-d3343879fae5', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Adicción', 'necesidad fuerte de usar algo, aunque cause daño.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('eb7ce490-b296-556e-8538-c1fee0588ebb', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Sustancia', 'producto que cambia cómo funciona el cuerpo o la mente.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a365bfdd-e0e7-57f7-bc29-44529ef60845', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Prevención', 'acciones que se toman antes de que aparezca un problema.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d896ef2d-a3a3-5890-9a4b-4d41d6963187', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Primeros auxilios', 'ayuda básica que se da mientras llega atención médica.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('51d6b713-a1c0-5afb-9f09-e6e7dfd768c2', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Gasa', 'tela suave y limpia para cubrir heridas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e9aa5429-b5d4-5c52-8263-e4f69401a046', 'dc9b7f17-afa8-5778-a3d0-f3b04c281234', 'Convulsión', 'movimientos fuertes del cuerpo que la persona no controla.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d913336a-34f8-51d1-8206-e6629579c08d', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Mayúscula', 'letra grande con la que empiezan los textos y los nombres propios.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4469681f-d579-594c-8446-93cedf7e38b9', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Coma', 'signo (,) que marca una pausa corta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c5a615a9-cb5a-5a4a-8afc-207f4614c0e2', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Punto y coma', 'signo (;) que marca una pausa más larga que la coma.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('96fa3241-f3ee-5fa6-b097-1944f8db913a', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Oración', 'grupo de palabras con sentido completo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bb0ffc2e-7dbc-5c42-9cb3-97f9c21a0f6c', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Sujeto', 'persona, animal o cosa de quien se habla.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('afcd4ec5-f9f6-5c81-93ec-f9849f79fcf9', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Predicado', 'lo que se dice del sujeto, con su acción.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('47cd1051-65b6-5150-b7cb-1a01cfb79572', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Sustantivo', 'palabra que nombra personas, animales, cosas o lugares.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c2ba5585-25ee-57d3-bf2c-007a67167d08', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Adjetivo', 'palabra que dice cómo es un sustantivo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('78d60039-8c16-5ec0-b81a-fd75af4989e0', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Verbo', 'palabra que dice una acción o un estado.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('56fc9262-d698-5eb5-91e3-71ed5105b35c', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Recado', 'mensaje corto que se deja a otra persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9b3b0ef1-a279-5f06-ab36-231298dec151', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Firma', 'nombre escrito al final para decir quién manda el mensaje.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1ed8e9db-72db-5554-8055-1a251032807c', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Legible', 'que se puede leer con facilidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8f444625-24e4-55ac-a236-cb6c895edbfe', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Ortografía', 'forma correcta de escribir las palabras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('dd282904-b28a-5726-bfea-a2ad6972854b', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Plural', 'forma de la palabra que habla de más de uno.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9f8ff1b0-53bc-50be-9e47-6ca454f0c663', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Sílaba', 'cada golpe de voz al decir una palabra (ca-mión tiene dos).') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3fa40070-15a8-5d35-99e8-cc8306ea1439', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Tilde', 'rayita que se escribe sobre una vocal.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8410670f-6b26-542e-9522-85534a10639b', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Sílaba tónica', 'la sílaba que suena con más fuerza.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bbfd53b5-b787-55e3-b724-ec7618c504d6', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Esdrújula', 'palabra con la fuerza en la antepenúltima sílaba.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('67a75c49-e259-53a9-ab1a-6cf388f915f2', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Párrafo', 'grupo de oraciones sobre un mismo tema.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2ec497b8-ea39-5db4-a1cb-75363abd838a', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Conector', 'palabra que ayuda a seguir el orden de las ideas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('32d347a4-4178-53db-a605-563b58c7f10b', 'ad8652d6-df38-57f8-8149-eba7c766532c', 'Punto y aparte', 'punto que cierra un párrafo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('69cc1989-11e9-58ca-984e-e5a172a2b574', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Factor', 'cada número que se multiplica.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('85b2cc8d-f045-5384-90d3-6d7356ff15e5', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Producto', 'el resultado de una multiplicación.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ee1c7e31-4603-5622-b257-b51d0153310a', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Tabla de multiplicar', 'lista de resultados de un número por 1, 2, 3 y hasta 10.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('29a8ee87-e489-5eb3-b513-c99c524df953', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Unidades', 'las cifras que valen de 1 en 1, como el 4 en 24.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('350ddb8a-e59c-5041-8005-783ab7988431', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Decenas', 'las cifras que valen de 10 en 10, como el 2 en 24.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7a4bad01-8975-5fac-add0-77162924256b', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Cifra', 'cada número que forma una cantidad, como el 3, el 5 y el 7 en 357.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cbbb6729-cd26-5100-b57e-89f34724506d', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Dividendo', 'la cantidad que se divide, como el 480.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4b751174-c495-5c83-ac4d-18de9f5f02c6', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Divisor', 'el número entre el que se divide, como el 4.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('19f848f6-275e-5697-b142-e82ef35a94bc', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Cociente', 'el resultado de dividir.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cc2a2a7b-5ea3-5464-a8fe-cd1f37a628c6', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Residuo', 'lo que sobra cuando una división no es exacta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0f6375ef-07c1-5159-a8d9-562e7eba98c4', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'División exacta', 'la que no deja residuo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('01dc35de-15ed-57a7-bfd6-ab6f2de37681', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Dato', 'información del problema que sirve para calcular.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d788a148-2c78-5056-b984-c4297773638d', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Ahorrar', 'guardar dinero para usarlo después.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c825ff82-1536-58b4-90e9-ffe72caa993f', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Renta', 'dinero que se paga por usar una casa o un cuarto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('85b3bade-c303-52ec-bae9-880b90fb1e3d', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Múltiplo', 'lo que sale al multiplicar un número por 1, 2, 3 y así.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('451b7313-2625-573a-a9d3-6ee49752e44b', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Par', 'número que se puede repartir en dos partes iguales.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f729b93a-c5f1-562c-879c-6de8d70c16a2', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Impar', 'número que al repartirlo entre 2 deja residuo 1.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a938bd77-7305-5bc6-842b-1430f0faf4ce', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Paréntesis', 'signos ( ) que encierran la parte de la cuenta que se hace primero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('47bf1510-2624-55e2-b780-208bdae922fa', '4f739387-4313-5b07-847a-98c9e2dbe9c6', 'Operación', 'una cuenta como sumar, restar, multiplicar o dividir.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b721ea2d-e44d-531c-8036-ae3015f56a82', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Pantalla táctil', 'pantalla que responde cuando la tocas con el dedo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6a6827b6-1135-5afb-ae7c-c0305b4390a5', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Aplicación', 'programa que sirve para una tarea, como escribir o ver fotos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ea33689a-911d-5146-b21a-0f17096d1839', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Archivo', 'un documento, una foto o un video guardado en el equipo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2a2535e4-bf2c-52eb-bef6-5fe6321c19d6', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Procesador', 'pieza que hace funcionar los programas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6a1d7c1c-6c8a-5fc5-9925-fb79d7e7eade', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Disco', 'pieza que guarda tus archivos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d81bd944-2e23-5701-971c-804f6d341592', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Internet', 'red que conecta equipos de todo el mundo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8e4ef86f-e309-53d3-8eb4-94fad82bb5d6', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Buscador', 'servicio que muestra páginas según las palabras que escribes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9f5a59f3-a55f-5301-a952-2733073cf268', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Palabra clave', 'palabra importante que escribes para encontrar algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('007d6c45-7014-52ab-92a6-4ec13b4f13aa', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Navegador', 'aplicación con una barra arriba para entrar a páginas de internet.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('688e1fce-31f4-5854-913d-85e099caf0ea', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Fuente', 'persona o institución que dio la información.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('962f8780-3852-5bd0-97a1-12faeaf63d63', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Bandeja de entrada', 'lugar donde llegan tus mensajes nuevos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('db35df0d-666b-5873-b303-c180f3560952', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Asunto', 'frase corta que dice de qué trata el correo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('839f0e2f-c478-5628-986c-7e4ef2a918da', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Adjunto', 'archivo que se manda junto con el mensaje.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('355de492-cf32-56ef-9642-194b97a6c981', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Trámite', 'serie de pasos para pedir un servicio o un documento.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2ac9636e-7f80-5658-a345-1e61fad583e5', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Folio', 'número que identifica tu solicitud.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ee49aff5-81e6-51ad-96ae-a9f3b48da6f2', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Comprobante', 'papel o imagen que prueba que hiciste el trámite.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9be4f44b-fbea-5600-a81b-648d905949e3', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Requisito', 'documento o dato que te piden para hacerlo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('efec13c2-8a93-5c3d-a57c-aea8c2037304', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Contraseña', 'clave secreta que protege tu cuenta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7544fd90-a390-55cf-aba8-830de0a0befa', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Fraude', 'engaño para quitarte datos o dinero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d38bb2e5-ed66-5222-a810-3a7e08bddce8', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Verificación en dos pasos', 'segundo paso para entrar a tu cuenta, como un código que te llega al celular.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fb591d5c-3b1e-53d4-8c7d-31297ef4381b', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Enlace', 'texto o botón que, al tocarlo, te lleva a otra página.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c2109410-9efa-5769-8713-d46e714b49ba', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Perfil', 'tu página personal en una red social.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('65e6368b-767f-551c-b50f-c0a3a6434cf2', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Privacidad', 'lo que decides mantener solo para ti.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d0615c6f-971d-57a2-9e33-93f5c806c144', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Bloquear', 'impedir que una persona te escriba o vea tu perfil.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('56d6db46-1325-5284-bec0-02a2ea65f627', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Ruta', 'camino que sigues para ir de un lugar a otro.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c8858888-83d5-5a23-8fad-37428a8a5016', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Evento', 'una cita o actividad anotada en el calendario.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('42014194-4699-5cd8-a2d4-6b5d6426a204', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Recordatorio', 'aviso que te llega antes de la hora de un evento.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ec4dcf9f-a85d-599e-98b2-3f31b269c4fd', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Respaldo', 'copia de un archivo guardada en otro lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('93a4587f-4050-5a5c-be69-3fb12494ae6e', '5cb0f9bc-8801-52fe-b909-707966d42435', 'Nube', 'espacio en internet donde puedes guardar archivos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d402df30-942f-55d3-858f-de0e0f6f77eb', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Propósito', 'lo que alguien quiere lograr con lo que escribe.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cef848ca-a4d1-548d-8b24-492c63b21854', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Instructivo', 'texto que explica pasos para hacer algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c2c41a6a-de0f-59e8-8e6f-b16ae6f42891', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Publicidad', 'texto que busca que compres o uses algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8063e078-d6dd-58b3-ad54-a335a1c1c819', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Hecho', 'algo que se puede comprobar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2995258f-4fe9-5aba-ba83-bec2bec76071', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Opinión', 'lo que una persona piensa o siente sobre algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('675b14f8-4816-5f0a-bba8-78ea52adc37a', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Comprobar', 'revisar que algo sea cierto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f4b7f1cd-e24e-5ea6-9af8-7e09274953a7', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Inferencia', 'conclusión que sacas al unir pistas con lo que ya sabes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('335c5a71-83ad-5b91-a2de-c285b47bd75a', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Pista', 'dato del texto que te ayuda a descubrir algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4a9b22e5-a858-5617-848a-7ccb49633808', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Conclusión', 'idea a la que llegas después de pensar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('71079a71-fdab-54dc-a060-73593af3bc70', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Recibo', 'papel que comprueba que pagaste.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('247f2ca7-dda8-59ec-8d8f-ff51e3fe9e74', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Factura', 'comprobante de una venta con datos de las dos partes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7232548b-b737-58fd-b973-f6c2189273b9', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Contrato', 'acuerdo por escrito entre dos personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e35f0b12-a625-5245-97e5-13370858664c', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Cláusula', 'cada punto que se acuerda en un contrato.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4ae1cb40-b37d-53b3-b47b-2d33aa5d9e76', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Refrán', 'frase tradicional que da un consejo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bee2387a-7bea-5f3c-b166-e00c1336660e', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Verso', 'cada renglón de un poema.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0ff75f15-0072-5b64-b5bc-5574b6074cd1', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Rima', 'sonido igual al final de dos palabras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e4462d57-21f7-5790-8535-6873a10e8734', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Sentido figurado', 'lo que algo quiere decir más allá de las palabras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('03c375b5-8f1c-5928-bc44-41f69a88d45f', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Columna', 'línea de datos que va de arriba hacia abajo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('544e1a63-49a7-5cfc-a376-16b05740b9ae', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Fila', 'línea de datos que va de lado a lado.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ca9148fb-fb23-5430-8c19-e75a833bef68', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Croquis', 'mapa sencillo de un lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3d741fe2-e55f-5ec9-93da-284be2cf8786', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Leyenda', 'explicación de los símbolos de un mapa.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('72229247-c739-54c9-978c-6d064be88aea', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Resumen', 'versión corta de un texto con lo más importante.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ec038054-717d-557f-a400-f30db5c0bf03', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Esquema', 'dibujo de ideas ordenadas por importancia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d51554cb-5d2c-5719-b576-b351ae97d1bd', 'ea2eee7b-cb9a-5927-a329-e4d9484861d8', 'Esencial', 'lo más importante.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ff077945-303e-5e1b-8596-5ba8b87f3b10', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Fracción', 'número que dice cuántas partes iguales tomas de un entero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b92f85db-ef20-5bca-b548-65fa6a88cef5', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Numerador', 'el número de arriba; dice cuántas partes tomas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('424d33d1-c6d9-55ba-8acf-cf4541d74611', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Denominador', 'el número de abajo; dice en cuántas partes iguales se partió el entero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d902d8b6-6ef6-589f-b2d4-dd18a8ab15d9', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Entero', 'la cosa completa, sin partir.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('39450596-175c-5f8e-be87-d9289588c6d8', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Fracciones equivalentes', 'fracciones que valen lo mismo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6ffb7aac-5bee-5b04-a48c-4999d92ac9fc', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Simplificar', 'dividir numerador y denominador entre el mismo número.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f25bb353-ab59-5d58-966a-59f56e13c54a', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Denominador común', 'un denominador igual en dos o más fracciones.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('13a09bc1-68d4-52fe-b3ee-7ee7ce5b1913', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Sumar fracciones', 'juntar partes del mismo tamaño.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9f66f72e-8a1d-5264-8830-ad904ba9feb0', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Restar fracciones', 'quitar partes del mismo tamaño.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b9a987d0-46b0-5255-841f-907489d7412b', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Resultado simplificado', 'fracción que ya no se puede dividir entre un mismo número.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('18b7dc97-508e-5a35-af43-e331a96b898b', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Decimal', 'número con una parte entera y una parte menor que un entero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9409c063-5c75-55e7-aa88-a9220d6eef90', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Décimo', 'una de 10 partes iguales de un entero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('aa40f111-db10-5836-94cd-de66f6f4862f', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Centésimo', 'una de 100 partes iguales de un entero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d8360bcd-f21e-5e30-ae8e-c9f95c2ef7ba', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Centavo', 'la centésima parte de un peso.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ade59c39-4d73-5d4d-93a5-a6a6d958c190', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Alinear', 'poner los números de modo que queden en la misma columna.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1504ac9b-0570-5504-a225-52a26b7bb2aa', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Punto decimal', 'el punto que separa los enteros de las partes menores que uno.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8f5a044e-abab-5e44-9392-beb31402f765', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Cambio', 'el dinero que te regresan cuando pagas con más de lo que cuesta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e0b2eff1-a3ef-505a-8367-dc02436c1810', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Mover el punto', 'recorrerlo a la derecha o a la izquierda, según la operación.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a23073fc-1485-5d55-bcaf-2e196a2b07d8', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Cero de relleno', 'cero que se agrega para completar los lugares que faltan.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9eaf1844-29a8-585e-8950-a466b8aee04c', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Receta', 'lista de ingredientes y cantidades para preparar un platillo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f2bed1b0-15ac-54bc-9203-9ef3a4614f12', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Equivalencia', 'dos medidas distintas que valen lo mismo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bc668f91-e3fb-513f-888a-4b3cf84ebf91', 'd86645e5-326f-553b-8586-7199b6e3e75b', 'Mililitro', 'una milésima parte de un litro.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d64662ba-5624-591e-a035-a4b0983eaf58', '2084297c-54dc-5483-935c-275357b40b53', 'Ser vivo', 'el que nace, crece, se reproduce y muere.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('98237780-7e4b-53f3-8ab3-a4aa6bb9cd46', '2084297c-54dc-5483-935c-275357b40b53', 'Clasificar', 'juntar en grupos lo que se parece.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('09105612-d1fe-572b-af00-36516b3835e8', '2084297c-54dc-5483-935c-275357b40b53', 'Vertebrado', 'animal que tiene huesos por dentro.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7fbede1a-687b-52b7-9270-89cd39bfde36', '2084297c-54dc-5483-935c-275357b40b53', 'Hongo', 'ser vivo que no fabrica su alimento, como el champiñón.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e885828d-a826-5c09-95e1-4c990672ad9a', '2084297c-54dc-5483-935c-275357b40b53', 'Raíz', 'parte de la planta que va bajo la tierra y toma agua.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('af78288f-3bc6-5465-a1cc-62a230c31e17', '2084297c-54dc-5483-935c-275357b40b53', 'Fotosíntesis', 'proceso con el que la planta fabrica su alimento usando la luz.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7f636a78-cdef-5f1a-9320-a2f9c6348dd2', '2084297c-54dc-5483-935c-275357b40b53', 'Semilla', 'parte de la que nace una planta nueva.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7b669f69-6fde-58da-a391-c271d60622a2', '2084297c-54dc-5483-935c-275357b40b53', 'Oxígeno', 'gas del aire que necesitamos para respirar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('50b76cd0-21a4-5749-a4f6-6d00a6f4a586', '2084297c-54dc-5483-935c-275357b40b53', 'Herbívoro', 'animal que come solo plantas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b5ef24e2-73ff-55dd-8e41-4c290ed36ef9', '2084297c-54dc-5483-935c-275357b40b53', 'Carnívoro', 'animal que come otros animales.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('67e5f715-fe70-51cd-a047-7b6e2417c6c2', '2084297c-54dc-5483-935c-275357b40b53', 'Productor', 'ser vivo que fabrica su alimento, como una planta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('15fb3033-22ea-5446-8e70-6418260619b3', '2084297c-54dc-5483-935c-275357b40b53', 'Descomponedor', 'ser vivo que se alimenta de restos, como un hongo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('827a48e4-e9a8-5404-b8b1-c3b516e3f7bb', '2084297c-54dc-5483-935c-275357b40b53', 'Ciclo', 'algo que se repite una y otra vez.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('aa99833d-9e7f-5095-b9c3-d0ca2afd7373', '2084297c-54dc-5483-935c-275357b40b53', 'Vapor', 'agua en forma de gas, que sube al aire.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('af021055-4a59-5b32-af79-7afb82e88338', '2084297c-54dc-5483-935c-275357b40b53', 'Precipitación', 'agua que cae de las nubes como lluvia, granizo o nieve.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('654bdbc7-6874-5758-b5ed-af2720e700ff', '2084297c-54dc-5483-935c-275357b40b53', 'Manto acuífero', 'agua guardada bajo la tierra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('02e743b0-7573-5e30-83fc-46d4406c6d7b', '2084297c-54dc-5483-935c-275357b40b53', 'Materia', 'todo lo que ocupa un lugar y tiene masa, es decir, cantidad de materia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('44a782c3-7d87-52f7-8596-e8146bf824bc', '2084297c-54dc-5483-935c-275357b40b53', 'Fusión', 'cambio de sólido a líquido por el calor.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a15ef3f3-5fcf-5e66-97d8-4c42febac7e6', '2084297c-54dc-5483-935c-275357b40b53', 'Condensación', 'cambio de gas a líquido por el frío.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('10742529-1baa-5ef9-80da-17daac7edd58', '2084297c-54dc-5483-935c-275357b40b53', 'Solidificación', 'cambio de líquido a sólido por el frío.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('39954539-e1b7-5aff-b3c4-251716699763', '2084297c-54dc-5483-935c-275357b40b53', 'Residuo', 'lo que sobra y ya no usamos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('51de727d-ba4b-5928-a58d-e16b260b8cba', '2084297c-54dc-5483-935c-275357b40b53', 'Orgánico', 'que viene de seres vivos, como una cáscara.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4382a616-c3c0-5908-8dca-f3253c0fdf78', '2084297c-54dc-5483-935c-275357b40b53', 'Inorgánico', 'que no viene de seres vivos, como el vidrio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4fed8ef0-eb99-5703-be0c-daa0419b7c4a', '2084297c-54dc-5483-935c-275357b40b53', 'Reciclar', 'convertir un material usado en un material nuevo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('29e23b59-ce5d-5126-85de-7dd0ae5ecb49', '2084297c-54dc-5483-935c-275357b40b53', 'Sismo', 'movimiento fuerte de la tierra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('78c3372b-3a77-5459-82e5-d6d28e1ecf84', '2084297c-54dc-5483-935c-275357b40b53', 'Huracán', 'ciclón tropical con vientos muy fuertes y lluvia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('04285204-b58a-5ee0-b628-4da3a4d07bb8', '2084297c-54dc-5483-935c-275357b40b53', 'Inundación', 'terreno cubierto de agua que normalmente no la tiene.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a77f3646-0377-5c11-a199-406cbe47680c', '2084297c-54dc-5483-935c-275357b40b53', 'Punto de reunión', 'lugar seguro donde se junta la familia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e6f60344-c84d-5a98-b151-d70e797e49d8', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Destinatario', 'persona que recibe la carta o el correo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8a47f9b3-54e4-595a-801d-3271539ba101', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Asunto', 'frase corta que dice de qué trata el correo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2ea9522d-2f46-5d82-b5cf-d6a484d901a6', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Adjunto', 'archivo que se manda junto con el correo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b2b671af-31d3-5cd3-9692-f6098908afc0', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Formal', 'que usa un trato respetuoso, como el de usted.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0ea43b93-251a-54c3-9436-eb74e3b29fed', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Formato', 'hoja con espacios vacíos para llenar con tus datos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ccfc6ece-aef3-565d-9e30-365a2ba8b35a', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Campo', 'espacio del formato donde se anota un dato.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('79bb5316-c23a-5510-a9eb-8ef1b0943e10', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Solicitud', 'formato donde pides un servicio o un permiso.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('77a115e3-7805-5a84-966f-efca57e6050c', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Letra de molde', 'letra separada y sin enlazar, fácil de leer.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('67976798-5a56-5381-854b-ecc6074a4408', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Conector', 'palabra que une ideas, como «pero» o «porque».') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cfd93e83-8940-5a15-8f3e-98df81eec119', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Signo de puntuación', 'marca escrita que ordena el texto, como el punto o la coma.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8802597c-ff0c-5f36-b98d-5c8f3e60a668', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Lista', 'serie de cosas una tras otra, como «pan, leche y huevos».') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6fc769cc-bfa7-599b-a84c-67bbf6e91cbe', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Narrar', 'contar una historia en orden.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e58f7982-48ab-5c96-abc8-1af3fbadedfe', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Experiencia', 'algo que te pasó o que viviste.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('16c0419f-a9d5-5ee5-b8f1-fc242bd9c23b', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Primera persona', 'forma de contar con «yo», como «salí» o «vi».') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5fbbdf2a-6b59-5bba-bf2f-333f30e48e14', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Desarrollo', 'parte de la historia donde pasan las cosas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('96e5078d-5f26-5781-a35b-67f2943d5214', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Aviso', 'texto corto que informa algo a varias personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b04bd4a6-14be-5a3e-99fb-32fc926f91ca', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Anuncio', 'texto corto que ofrece un producto o un servicio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5c114dba-7193-5cda-b9b1-7bc4ecf3c8e0', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Contacto', 'persona o dato para preguntar más.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8dc2ca0e-6257-517d-a3f0-348f9303cf36', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Revisar', 'leer de nuevo un texto para buscar errores.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1383b284-9ba9-5b7c-a730-9cdcb4d6c9c1', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Corregir', 'cambiar lo que está mal para dejarlo bien.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f811e0d2-13f7-5161-bbba-af4c09eb1ae6', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Ortografía', 'forma correcta de escribir las palabras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('973f0ecc-4005-5220-b104-1371fd7abc12', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Cortesía', 'buen trato hacia los demás al hablar o escribir.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4f6d729f-9f12-56bf-bb43-2671a2507105', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Tono', 'la forma en que suena un mensaje, amable o seco.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3b48cf51-1d4a-5e4d-ac22-d8ffd5f90938', '55da446c-3b60-50cd-8e41-db9deafb1109', 'Abreviatura', 'palabra escrita en forma corta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('21791bdb-fd92-5972-ab45-14f5a3f6eeb3', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Ángulo', 'abertura que forman dos líneas que se juntan en un punto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b6ec3999-1b3f-56e8-968c-a82d1d30c2b2', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Grado', 'unidad con la que se mide un ángulo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('115804c8-e40a-58f9-aa67-535db30a2027', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Paralelas', 'líneas que van lado a lado y nunca se juntan.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('614986fd-8fbb-560d-b6c6-b238e9649b45', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Equilátero', 'triángulo con los tres lados iguales.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f0b0a580-a25d-5ac4-8cca-4f8fdf504c01', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Cuadrilátero', 'figura de cuatro lados.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7cdf4050-d606-54e6-b652-5c74eeebc85b', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Trapecio', 'cuadrilátero con un solo par de lados paralelos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5c106a8d-fa5f-500d-ada6-5d3b38ded739', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Perímetro', 'medida del contorno de una figura.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9fd2be22-0cd1-5758-8b4d-6a07b8946706', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Contorno', 'línea que rodea una figura por fuera.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8a4e6a86-4b5b-5690-837f-835c34ca321b', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Lado', 'cada una de las líneas que forman una figura.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('44d044a3-4a79-5e7b-bc94-c524b632a7fe', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Área', 'medida de la superficie que cubre una figura.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e01b8765-7bcc-5ad4-bf86-5d15dd2aef29', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Base', 'lado sobre el que se apoya una figura.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1eeb6b62-ee14-55b3-8199-391df5eb564e', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Altura', 'distancia recta desde la base hasta arriba.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e0fc72b0-ea90-5622-acc2-4f101769725b', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Longitud', 'qué tan largo es algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6d74fd46-0587-5bb2-877a-e9ccd2b9e26a', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Equivalencia', 'dos medidas distintas que valen lo mismo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e3b48c4c-d53c-5df4-a43e-06c81a0ff5c5', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Kilómetro', 'unidad que vale 1000 metros.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('15fe1446-d70c-5a2e-8434-7d5a317fed82', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Gramo', 'unidad pequeña de peso. Mil gramos son un kilo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fc91cc79-8cf2-5f49-9de9-8cb840df7a94', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Capacidad', 'cantidad de líquido que cabe en un recipiente.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('18852851-b900-569e-b38a-0bbb8833d85c', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Mililitro', 'unidad pequeña de capacidad. Mil mililitros son un litro.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f8c425d7-a447-5f5f-8ca7-b116560f1bb9', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Cuerpo geométrico', 'objeto que ocupa espacio, como un cubo o una esfera.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5db6bd8e-e365-5284-8e01-9d54b768e11f', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Volumen', 'espacio que ocupa un cuerpo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4fd8fdf2-ddb5-5348-aa61-ecac8ccacf73', 'b7bd6cba-0186-569e-9aae-9658b1cd8678', 'Arista', 'línea donde se juntan dos caras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1a1b6a80-82da-5c91-8d06-63f15420a9ec', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Pueblo originario', 'pueblo que ya vivía en un lugar desde antes de que llegaran otros.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('efa3c29f-9f31-57ed-91cc-95116f641087', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Mesoamérica', 'región donde vivieron varias culturas con rasgos comunes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e5836d15-a865-5956-8df6-d2a1531a8e8b', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Lengua', 'idioma que habla un pueblo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5a93c364-26f6-5d5c-af78-b17807ee1a47', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Herencia', 'lo que recibimos de quienes vivieron antes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2514c266-e76d-51b0-9942-48a91682dd23', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Conquista', 'toma de un territorio por la fuerza.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bae89beb-94dd-580a-a00d-20810dbcf499', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Virrey', 'persona que gobernaba en nombre del rey.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('dcfd6816-0421-5d35-a081-a4bd06822803', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Mestizaje', 'mezcla de personas y culturas distintas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8f12d17c-5f21-51c2-b478-ed9ee88cc20c', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Independencia', 'libertad de un país para gobernarse a sí mismo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2aaa546a-9d8b-5fae-a6cf-73c36ad32cfe', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Grito de Dolores', 'llamado de Hidalgo para empezar la lucha.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5d3e117a-53de-5994-8103-90281b290988', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Insurgente', 'persona que luchó por la Independencia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ef00768b-2dff-5504-813e-3c31deead082', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Constitución', 'ley más importante de un país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('caab4cca-c237-58ce-8efb-8a9b58804995', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Reforma', 'periodo de cambios en las leyes a mediados del siglo XIX.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1697f351-a47a-5d2d-b50f-adfd106360e9', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'República', 'forma de gobierno donde el pueblo elige a sus gobernantes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('58ab723f-9d0d-5f7d-8116-dde4e919002a', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Revolución', 'gran cambio en un país, que suele venir con una lucha.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('42696f08-d4be-570d-9e8e-224e61b0d300', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Campesino', 'persona que trabaja la tierra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ddc5c1af-92fd-5b9c-9d11-e5d6ff4658be', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Lema', 'frase corta que resume una idea.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c3cde585-7aaf-54d5-a1ba-989f5464a353', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Siglo', 'periodo de 100 años.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7d0fb8d0-6b7c-5324-acab-37d0214f40f0', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Sismo', 'movimiento fuerte de la tierra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c5599f52-44d0-559e-96e8-c90d178b7853', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Línea de tiempo', 'dibujo que ordena hechos según su fecha.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('22e3d151-ad15-571a-921f-3bf9a04907b2', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Símbolo patrio', 'imagen o canto que representa a un país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b5f8c46a-d0b0-5e9d-bd4f-6e57744ccc2f', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Himno', 'canto que representa a un país o a un grupo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d3be9863-32fb-5234-a9c8-cdd71d28fbba', '76f9bd1f-31ba-5e83-a81b-5544c75f816a', 'Fecha cívica', 'día en que se recuerda un hecho importante del país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('afed083c-5217-5fd1-96eb-ec6edd3c5a4f', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Turno', 'el momento que te toca para hablar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('61c7229c-d6c3-593a-ac96-bf922b51bd7c', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Interrumpir', 'hablar cuando otra persona todavía no termina.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0d699b59-ce02-5f61-aed8-4ee322bd24f6', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Opinión', 'lo que una persona piensa sobre un tema.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('77a027cb-a9ef-58c1-9379-182434ecf310', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Respeto', 'tratar bien a los demás, aunque piensen distinto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ae3ea49c-5829-5ff4-ab25-dcced7f0133e', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Presentación', 'lo que dices para que otros te conozcan.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e7719832-b98e-5552-8546-1db6229aa668', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Datos personales', 'información que dice quién eres, como tu nombre o tu domicilio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b93d551c-2694-5de3-9688-6da45156f3a0', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Domicilio', 'el lugar donde vives.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f0b0b2e4-b6f8-5379-97d6-7d25ce8adda2', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Formulario', 'hoja donde se escriben datos en los espacios que se piden.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ddd30b55-ab81-5027-953e-5ae9a2c1040e', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Exponer', 'explicar una idea a un grupo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0f8d4b24-cd3c-5fc8-8f62-c6f78f6dbdf6', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Propuesta', 'idea que ofreces para resolver algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0aac1b20-77aa-5f03-bf47-bbcfca25cfe5', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Pausa', 'pequeño silencio para respirar y dar tiempo de entender.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8023298d-0d2d-5b14-9c08-9b5b671dc9b4', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Palabra clave', 'palabra que te recuerda una idea importante.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2a3dc032-fe35-5592-800b-880092391adb', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Acta de nacimiento', 'documento que registra el nacimiento de una persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('58e8782c-f589-547f-9205-44ac766b512c', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'CURP', 'clave de 18 caracteres que identifica a cada persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ecb0e40c-b933-5303-b110-3b69e01c097f', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'INE', 'institución que organiza las elecciones federales y expide la credencial para votar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8360364f-e68e-5b6d-b5bf-72066bc9bbb6', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Registro Civil', 'oficina que guarda actas de nacimiento y otros registros.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('49c13606-a51b-54b7-ba0a-da457628cfc7', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Trámite', 'pasos que haces ante una oficina para lograr algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('04ff1b70-9c07-5c55-81e6-529b8cfc1e8d', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Requisito', 'lo que te piden para poder hacer un trámite.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0779ca27-0a58-5444-b83a-a287cb69d960', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Cita', 'día y hora que te dan para ser atendido.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('38f87413-2a7a-5f52-a3fd-1f157ad390b2', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Vigente', 'que sigue valiendo hoy.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0013adc1-227c-531b-a428-b84c6045e49f', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Desacuerdo', 'cuando dos personas piensan o quieren cosas distintas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a7ba5c7d-b29b-5b6e-a54a-9b77a6c4a6e0', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Diálogo', 'conversación en la que cada quien habla y escucha.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0564a2c6-89cd-506e-b090-e979f8a1267c', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Acuerdo', 'decisión que todos aceptan.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('35c95bf1-b2c0-5469-98df-45e4017f79c3', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Acusar', 'echarle la culpa a otra persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2cfd6477-7767-58f0-8ebf-439f6e1077bc', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Entrevista', 'conversación para conocer a una persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c06b7e61-172c-5c5a-b694-d2e1d72aa2af', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Puesto', 'el trabajo que alguien hace en un lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('13f88e7d-fe87-566a-acbc-a040b5f8cc84', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Perfil', 'lo que una persona sabe hacer y ha vivido.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ddfa3195-607e-55d8-bbd1-7b5e87b808c3', 'e38240dc-8c38-5250-b2c5-c8d34e29f058', 'Honestidad', 'decir siempre la verdad.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fdd582c0-075a-5c63-a69c-b56bc5e7a593', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Cambio', 'dinero que te regresan cuando pagas de más.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('bdc19c1e-321b-56d6-a430-1b9bc0188f24', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Total', 'la suma de todo lo que compraste.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('21b57a6c-2cdd-5270-afd8-3b4bd2cabca8', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Centavo', 'la centésima parte de un peso. Cien centavos son un peso.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('440a4397-87fb-54e9-82cb-7b02d44ebbb2', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Ingreso', 'dinero que recibes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8bac042c-4061-5cde-b0f3-c556d671f98f', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Gasto', 'dinero que pagas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1c39fa40-f425-5eb6-b098-e296b234fa98', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Presupuesto', 'plan que compara tus ingresos con tus gastos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3a560489-a7fb-5421-8c25-6ab53c9ef3c3', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Sobrante', 'dinero que queda después de pagar los gastos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9fb32eeb-9d32-5b1e-9264-4895fa62ef3f', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Porcentaje', 'una parte de una cantidad, contada de cada 100.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4131db46-d9d3-5e6c-919e-693c5246bb45', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Descuento', 'dinero que te quitan del precio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('42365fc8-c5fc-519a-ba3a-00f2d19f38a9', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Décima parte', 'lo que resulta al dividir algo en 10 partes iguales.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1987f0c0-51c5-5c6c-bb92-b4ab3f6fcb4c', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Oferta', 'precio especial por un tiempo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8fedb290-8434-583c-ada4-9bb1bad5da9c', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Precio final', 'lo que pagas después de quitar el descuento.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a04f9de0-7cef-5cd2-bf4e-ddca31beea15', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Comparar', 'ver dos cosas juntas para saber cuál conviene más.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('518c5248-4b69-5ab4-ae7f-d6e409d80363', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Ahorro', 'dinero que guardas para usarlo después.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('10a63985-dcf5-570d-a465-eb61e9928ba1', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Meta', 'lo que quieres lograr, con una cantidad clara.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3ead93da-a35f-509b-9d98-ec989bce19b5', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Periodo', 'cada tramo de tiempo, como una semana o un mes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f18dfa71-754b-5a74-9915-3052fa2ec4c2', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Crédito', 'dinero prestado que debes devolver.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d91bd5c8-cbce-5fb2-9c05-17fa48ff0351', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Interés', 'dinero extra que pagas por usar un préstamo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8521faaf-df6a-5a15-82ef-e6069be27310', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Abono', 'cada pago pequeño que haces para saldar una deuda.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0adaadf6-4481-52ec-8a2e-91e7eedaf367', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Deuda', 'dinero que debes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('106830e7-1c91-5dec-817b-77375021abcf', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Consumo', 'lo que usaste de luz, agua o teléfono.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6ac92089-93b5-5932-af9b-9d00ecff8392', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Kilowatt-hora', 'unidad con la que se mide la luz que usas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('452a7489-168f-517a-9e59-8b108fdb2cb5', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Medidor', 'aparato que cuenta cuánto usas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2084c325-1cef-5ba0-b82b-d1ee75a01e41', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Lectura', 'el número que marca el medidor.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('369ffcc6-5403-595a-a01d-d2a2d320bc28', 'dd65a559-31b8-5ec2-9574-5b28222860ab', 'Fecha límite', 'último día para pagar sin cargo extra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('83faa928-7e49-52e2-ae0a-5e82f92909af', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Punto cardinal', 'una de las cuatro direcciones para ubicarte.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fee0d02d-1f52-550e-b4f8-4d3ab20dd08d', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Mapa', 'dibujo de un lugar visto desde arriba.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('222934b3-af4d-5195-be62-5317993541dd', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Simbología', 'dibujos que explican las marcas del mapa.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('97db97ff-e136-5edf-b861-16ac54ab80df', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Entidad federativa', 'cada una de las 32 partes en que se divide México.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9b71b0dc-7a90-54e1-bf23-00ddb697ecfd', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Capital', 'ciudad principal donde trabaja el gobierno de una entidad.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4d9ebf55-7810-599d-8d30-d4a00cc1ae4c', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Municipio', 'parte de un estado con su propio gobierno local.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('364187be-2389-5e29-8512-0e219aeffa92', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Relieve', 'forma que tiene el terreno.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('74195405-601a-5be8-b68e-9e2d2cd99599', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Clima', 'cómo suele ser el tiempo en un lugar durante muchos años.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c9111f8a-19e2-5e82-9846-515d65590a66', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Región', 'zona con rasgos parecidos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0e48a2aa-22af-587a-b0c1-4298a3ae7a3f', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Recurso natural', 'algo que da la naturaleza y que usamos para vivir.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a05ef876-e4cd-5464-b19c-beb62d2cd169', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Renovable', 'recurso que vuelve a existir si se cuida.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('62e43c13-036a-5531-8357-92815faeff0c', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'No renovable', 'recurso que se acaba y no vuelve pronto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8a8071d1-aef2-593f-a8b5-c3a61a2c6fce', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Reciclar', 'volver a usar materiales para hacer cosas nuevas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a0a488dd-6bfa-5c24-82d1-6a1ff5adadde', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Cultura', 'forma de vivir de un grupo de personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('33f0c0e7-0d4b-5e9c-b097-d5a1da8e5f00', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Diversidad', 'que hay muchas formas distintas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('fae6a61d-5dec-54a9-b442-575105e6aa04', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Pueblo indígena', 'comunidad con historia anterior a la llegada de los españoles.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a69ae422-ee8c-5371-a268-3bebd133b933', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Lengua materna', 'la primera lengua que aprendes en tu casa.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d2845406-c3db-53b6-a308-9fb1e974dae4', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Comunidad', 'grupo de personas que viven en un mismo lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c4534ba2-ae07-5de6-86ed-71640a8cb1c8', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Servicio público', 'servicio que ayuda a todos los habitantes.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ec6ac9e5-da9f-5322-bd4e-8e625266f5a4', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Ayuntamiento', 'gobierno local de un municipio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7908e6af-38b8-584b-9f7b-1dcb8fcb3459', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Comité', 'grupo de vecinos que se reúne para una tarea.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f52357e8-54fd-571c-b9af-303cc9f1d82e', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Población', 'conjunto de personas que viven en un lugar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('25cbfdca-3472-5663-a5f3-db31d2a26da9', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Migrar', 'cambiar el lugar donde vives.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('0721b7c9-ef86-56fd-b538-7ced049ec74d', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Zona rural', 'lugar con menos habitantes y más campo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e011e93d-7abc-584f-8aa2-c1437367967e', 'f7644c3f-af6d-512c-99f3-1427e053077b', 'Censo', 'conteo de las personas que viven en el país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('26d65d54-c73a-566e-bc15-b6172dbb4395', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Dato', 'un número o un nombre que anotas para saber algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2939ca44-ce89-5903-9643-9a42d5bb027a', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Conteo', 'la cuenta que haces con una rayita por cada dato.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('9b350969-8998-5554-b7b4-594b50dfd0e5', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Total', 'el resultado de sumar todo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8a902847-446e-5f46-9c09-09fa218369b5', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Gráfica', 'un dibujo que muestra datos para compararlos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1c6669e7-3a6e-575e-b8ba-a948e7dfa42b', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Escala', 'lo que vale cada marca de la gráfica.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('383dd02a-1241-5266-8aca-1d80ff889b41', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Diferencia', 'lo que resulta al restar un dato de otro.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('17d7bdca-c6b7-514a-ab12-475410b00ac5', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Pictograma', 'una gráfica hecha con dibujos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('89a3dc02-af55-5091-a3c2-d98b3be817fa', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Clave', 'lo que vale cada dibujo del pictograma.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f0bd2dca-e681-5ab6-8f3e-6def668ecbae', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Gráfica de línea', 'una gráfica que muestra cambios con una línea.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4949cf00-194e-57e6-b184-ec8d4b2c0314', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Promedio', 'el valor que tendría cada dato si todos fueran iguales.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('af49e22b-6ffe-5722-be6d-8ceade66c091', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Suma', 'el resultado de juntar todos los datos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('74ec6425-a2eb-5da9-8603-20ab1b090fe8', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Reparto parejo', 'dividir algo en partes iguales.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b48041d8-cfd4-5b1d-b1cc-cdf1af61cec3', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Moda', 'el dato que más veces se repite.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ac6e767f-a97c-558c-a67f-4a8b47441009', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Frecuencia', 'cuántas veces sale un dato.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ef30f896-e2a1-5fbf-add9-a43758f1d08d', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Repetir', 'aparecer más de una vez.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e797de3a-621d-504e-aedf-f0294e8d8b3a', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Probabilidad', 'qué tan fácil es que algo pase.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a6f1c56e-8fbe-54c9-aa26-3291288cb1ca', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Seguro', 'lo que va a pasar siempre.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a70443c7-c22c-50fb-b27a-f278b5e6455f', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Imposible', 'lo que nunca va a pasar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('50cb6b01-0caf-5246-97dc-974913fa4937', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Consumo', 'la cantidad que usaste de algo en un periodo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1dd5bba7-1efc-5d90-9382-f5b992d95a3d', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Kilowatt-hora', 'la medida de la energía eléctrica que usas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c7e5c343-e3c7-5f77-ae66-ff86fbe2c1f2', '29085ff3-9af7-5978-8e0a-9d8b2ac274be', 'Fuente', 'el lugar de donde salen los datos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('383040a9-eb74-58d5-963e-5076796e2169', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Derecho', 'algo que puedes pedir y que te protege.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('58a4fd5d-2f88-5c0c-bd33-0dded03e13a0', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Dignidad', 'el valor que tiene toda persona y que exige respeto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e7b4dc8f-3bec-5ac3-a665-0d0e9d8c6db5', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Universal', 'que es para todas las personas, sin excepción.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('be1f2cb6-8a9e-58e4-be6c-6da27f6c5141', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Constitución', 'la ley más importante del país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('5a0f6015-3c53-5478-b456-7a9c105ad8cd', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Poder', 'una parte del gobierno con una tarea propia.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7eba3ebc-8e27-5989-a107-b93eeb4b59c6', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Congreso', 'el lugar donde trabajan los diputados y los senadores.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('21f4b357-57b9-5e45-901b-a40287d239e1', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Tribunal', 'el lugar donde los jueces resuelven conflictos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7c95573a-8d5c-5de7-ac4a-527b9d2ef984', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Municipio', 'la parte del estado que tiene su propio gobierno local.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('4fe5b706-aeb9-5a40-95fa-435d0cf8e1a5', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Ayuntamiento', 'el grupo que gobierna un municipio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('39f1346e-c283-5799-b560-d6d4fb19c1fd', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Entidad', 'cada una de las partes en que se divide el país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a55b05ff-2d1d-5c55-a958-af6b011f4694', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Federación', 'el gobierno de todo el país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('cc7b3339-f968-5d9b-bc53-f4c752f7a50c', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Niñez', 'la etapa de la vida antes de ser adolescente.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('517771c5-e4be-56cc-a073-7b2b6fde9e61', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Adolescente', 'persona de 12 a 17 años.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('17841384-14c9-5725-8d5e-6bceea48bfad', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Persona mayor', 'persona de 60 años o más.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('64a3bba1-1ff2-59e4-99ae-0aa5dd10c4e0', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Maltrato', 'daño que se hace a otra persona.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('07c36ae5-cb41-599f-95ca-f8c13091f910', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Igualdad', 'que todas las personas tienen los mismos derechos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3f54cdf9-f695-5a69-a64a-fb4a0949f350', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Discriminación', 'trato peor hacia una persona por una característica suya.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('8ae79f51-c30b-5c97-8d35-a671fc5e1279', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Discapacidad', 'una condición que dificulta hacer algunas actividades sin apoyo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('c82eb237-33b6-5a37-b22b-ef12272bf6c8', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Ciudadano', 'persona con derecho a participar en las decisiones del país.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ff7964cc-2dfa-59e9-b11b-38c827672c95', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Casilla', 'el lugar donde se vota.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('67c3f8df-9ea4-5596-a763-c71cd79b9766', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Boleta', 'el papel donde se marca el voto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('86986250-a17d-5897-b97f-3c2c88581273', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Urna', 'la caja donde se depositan las boletas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('805487d4-6cce-5aab-bfd4-290d42842477', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Conflicto', 'un desacuerdo entre personas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('452443c5-a1d4-585a-880a-e31fffd236aa', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Violencia', 'daño que una persona causa a otra.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('657bee57-4c1a-5d32-bdfd-4898bb5df13c', '518e09bc-0345-519b-a865-e8d367fe69d0', 'Acuerdo', 'una solución en la que las dos partes están de acuerdo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('404516f7-1ed4-57d4-bab4-09dada88b3fb', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Habilidad', 'algo que sabes hacer bien.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('542c9d7f-c821-521c-bbc0-5eb105dc101b', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Actitud', 'la forma en que te comportas ante las cosas.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6e6c2fa6-2d9e-519f-9609-9c5984945f24', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Meta', 'algo que quieres lograr.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('d5c59cf0-ff27-5cc3-8ff7-3439ce5b59b0', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Obstáculo', 'algo que te estorba para avanzar.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('2f02b6ff-0c06-5b1d-9a5e-92195cf6e2fa', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Currículum', 'hoja que resume tus estudios, tu experiencia y tus habilidades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ae9747a0-8108-5a01-884b-8f96a2674638', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Solicitud de empleo', 'formato que llenas para pedir un trabajo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7bf14733-637c-5856-8b20-6206b41626aa', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Experiencia', 'lo que ya has hecho en otros trabajos o actividades.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('1bb026f6-1491-57fe-9004-4eca56c45d58', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Contrato', 'acuerdo escrito entre quien trabaja y quien contrata.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('3c2465b1-e5af-5710-95ef-747e3a6bc641', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Salario', 'dinero que recibes por tu trabajo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('08296536-2b47-5230-b156-4d744e9dfa92', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Seguridad social', 'protección de salud y apoyo que da el trabajo con contrato y registro en el IMSS.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('32223d71-d5f3-5a8a-8b61-cb8400af0608', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Equipo', 'grupo de personas que trabaja por un mismo fin.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('ca37fe26-b0f2-53e6-9274-7fcb37f7d1f5', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Acuerdo', 'decisión que todas las personas aceptan.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('6dca7fbc-34d9-58b9-b4ef-cdef9a560ce2', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Desacuerdo', 'cuando las personas piensan distinto sobre algo.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a254eb46-2049-5614-ba7d-03c3a424a170', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Negocio', 'actividad donde ofreces algo a cambio de dinero.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('e41fbb1f-a513-582d-89ee-a50c05bcefc1', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Producto', 'algo que se puede tocar y vender.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('39efe487-09ac-5f55-96e5-d0104ea77fed', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Servicio', 'ayuda que das a otra persona a cambio de un pago.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('7d3ef21b-ec31-5e9c-a2cb-6a5998815668', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Competencia', 'otras personas que venden lo mismo cerca de ti.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('a8065f52-3697-5343-9546-f5fc76ab984c', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Costo', 'dinero que gastas para hacer o conseguir tu producto.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f9393db5-7e11-5ee8-92f3-84ab0498950d', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Precio', 'dinero que cobras al cliente.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f10430d1-e8dc-5085-af04-d8c06542387a', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Ganancia', 'dinero que te queda después de pagar los costos.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('b2686c33-2b75-58e0-bbd9-95f242aba09a', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Pérdida', 'cuando gastas más de lo que cobras.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('48725041-c200-5dc2-9841-01fff20e3eff', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Cliente', 'persona que compra un producto o servicio.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('79488d19-f1a8-5d5b-b4d4-46a72be5d7c7', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Cambio', 'dinero que regresas cuando te pagan con más de lo que cuesta.') ON CONFLICT DO NOTHING;
INSERT INTO public.glosario_materia (id, materia_id, termino, definicion) VALUES ('f7c42a94-e1d9-533f-9a74-98d27ad73999', '0ca2857f-b555-528a-8e28-4b09b9bf7b97', 'Queja', 'aviso de que algo no quedó bien.') ON CONFLICT DO NOTHING;

COMMIT;

NOTIFY pgrst, 'reload schema';
