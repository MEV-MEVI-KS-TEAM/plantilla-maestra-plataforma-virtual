-- =============================================================
-- SEED UNIVERSAL QUIZ_SEMANA — MEV Plataforma Virtual
-- =============================================================
-- GENERADO desde banco-materias-sec-prepa (scripts/aplicar_reactivos.py --plantilla).
-- NO editar aquí: se corrige reactivos/ en el banco, se regenera y se vuelve a copiar.
--
-- 576 preguntas (3 por semana × 8 semanas × 24 materias), cada una sostenida por el
-- contenido de SU semana. Claves 6/6/6/6 por materia.
--
-- Cadena de match (3 niveles):
--   materias.nombre + materias.nivel + semanas.numero_semana
--   JOIN: materias → meses_contenido → semanas → quiz_semana
--
-- Si una semana no existe en la BD, imprime aviso y se salta.
-- Idempotente: borra preguntas previas de la semana antes de insertar.
-- Demo: NO TOCA (gestionada por seed-demo-materia.sql).
--
-- Requisitos schema (ya en plantilla maestra):
--   - quiz_semana.opcion_d TEXT
--   - constraint respuesta_correcta IN ('a','b','c','d')
-- =============================================================

BEGIN;

-- ----------- Comprensión lectora I (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una nota dice: «La feria del libro de Puebla recibió a 8 mil visitantes en 2024, el doble que en 2023». ¿Qué pregunta se contesta con lectura literal?', '¿Es confiable la cifra que da la nota?', '¿Cuántos visitantes recibió la feria en 2024?', '¿Por qué la nota compara los dos años?', '¿Qué se concluye sobre el interés del público?', 'b', 1, 'La lectura literal extrae lo que está escrito directamente; la cifra de visitantes aparece tal cual en la nota.'),
      (v_semana_id, 'Al leer un reportaje, Diego deduce para qué eligió el autor ciertas cifras, aunque el texto no lo explica. ¿Qué nivel de lectura usa?', 'Crítica, porque opina si está de acuerdo con el autor del texto', 'Literal, porque las cifras que analiza sí aparecen en el reportaje', 'Crítica, porque juzga si las cifras del reportaje son confiables', 'Inferencial, porque deduce una intención que no está escrita', 'd', 2, 'El nivel inferencial deduce lo que no está escrito a partir del contexto, como las intenciones del autor.'),
      (v_semana_id, 'Tras leer una columna sobre el celular en clase, Fernanda anota: «Se apoya en un solo estudio, pagado por una empresa de telefonía; por eso dudo de su conclusión». ¿Qué está haciendo?', 'Extrae de la columna la información explícita', 'Reconstruye la secuencia de hechos que narra la columna', 'Deduce el sentido figurado de una frase de la columna', 'Evalúa la validez del texto y fundamenta su juicio', 'd', 3, 'La lectura crítica evalúa y juzga con fundamento: Fernanda da una razón concreta para dudar de la conclusión.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Antes de abrir un reportaje sobre la falta de agua en Monterrey, Paola se pregunta qué sabe ya de ese problema. ¿Qué estrategia aplica?', 'Activar conocimientos previos', 'Revisar la estructura', 'Hacer predicciones con el título', 'Establecer su propósito', 'a', 1, 'Preguntarse qué se sabe ya sobre un tema, antes de empezar a leer, es activar los conocimientos previos.'),
      (v_semana_id, 'En vacaciones, Emiliano lee varias novelas de misterio sin apuro y solo por gusto. ¿Qué tipo de lectura hace?', 'Scanning', 'Lectura extensiva', 'Skimming', 'Lectura intensiva', 'b', 2, 'La lectura extensiva abarca mucho material de forma relajada y es la que se hace por placer.'),
      (v_semana_id, 'Al cerrar un capítulo de historia, Lucía revisa si consiguió lo que buscaba y si entendió lo principal. ¿Qué estrategia usa y en qué momento?', 'Aplicar, después de leer', 'Evaluar, después de leer', 'Conectar, durante la lectura', 'Predecir, antes de leer', 'b', 3, 'Evaluar ocurre al terminar la lectura: revisas si lograste tu propósito y si entendiste lo principal.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una nota abre con este párrafo: «La Secretaría de Cultura de Jalisco abrió ayer en Guadalajara una biblioteca pública para acercar la lectura al oriente de la ciudad». ¿Qué parte de la noticia es?', 'El cuerpo, porque lo desarrolla', 'El cierre, porque da contexto', 'El lead, porque responde las 5W', 'El titular, porque resume el hecho', 'c', 1, 'El lead es el primer párrafo y responde qué, quién, cuándo, dónde y por qué: este párrafo contesta todo eso.'),
      (v_semana_id, 'En una noticia sobre la inauguración de una planta de agua, ¿qué frase es un juicio de valor impropio de ese género?', 'La planta abastecerá de agua a doce colonias del municipio', 'El alcalde la inauguró ayer ante cerca de 300 vecinos', 'La obra costó 20 millones de pesos, según el municipio', 'La obra es una muestra de torpeza del gobierno municipal', 'd', 2, 'La noticia informa hechos de forma objetiva; llamar torpeza a una obra es valorarla, no informar sobre ella.'),
      (v_semana_id, 'Saúl compartió el titular «Prohíben los útiles escolares en todo el estado». Al abrir la nota, vio que solo se ajustó una lista sugerida. ¿Qué verificación se saltó?', 'Leer más allá del titular', 'Revisar la fecha', 'Consultar sitios de fact-checking', 'Revisar las imágenes', 'a', 3, 'Muchos titulares distorsionan el contenido; por eso hay que leer la nota completa antes de creerla o compartirla.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un ensayo defiende que las escuelas ofrezcan desayuno gratuito y dice: «En un plantel de Chiapas, la asistencia subió 12% tras iniciar el programa». ¿Qué papel cumple esa oración?', 'Evidencia: un dato concreto a favor de un argumento', 'Tesis: la postura central que defiende quien escribe', 'Conclusión: reafirma lo que ya se argumentó antes', 'Contraargumento: una posición contraria por refutar', 'a', 1, 'La evidencia son datos concretos que respaldan cada argumento, y una estadística de asistencia es uno de ellos.'),
      (v_semana_id, 'Un comerciante afirma: «Colgué esta herradura en la tienda y después subieron mis ventas; la herradura me las trajo». ¿Qué falacia comete?', 'Ad hominem', 'Pendiente resbaladiza', 'Falsa causa', 'Falso dilema', 'c', 2, 'Supone que una cosa provocó la otra solo porque ocurrió primero, y ese es el error lógico de esta falacia.'),
      (v_semana_id, 'Lee: «Deberían plantarse más árboles en las escuelas. Reducen el calor en los salones y mejoran el ánimo de los alumnos». ¿Cuál es la tesis?', 'Las escuelas tienen salones demasiado calurosos', 'Los árboles mejoran el ánimo de los alumnos', 'Deberían plantarse más árboles en las escuelas', 'Los árboles reducen el calor en los salones', 'c', 3, 'La tesis es la postura central que el autor quiere que creas; las otras ideas del fragmento son razones para apoyarla.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'La maestra entra al salón, lo ve lleno de basura y comenta: «Qué limpios son ustedes, de verdad». ¿Qué recurso usa?', 'Antítesis', 'Hipérbole', 'Anáfora', 'Ironía', 'd', 1, 'Este recurso consiste en decir lo contrario de lo que se quiere comunicar: elogia la limpieza para señalar la suciedad.'),
      (v_semana_id, 'En un mitin, una líder vecinal dice: «Exigimos agua. Exigimos luz. Exigimos respeto». ¿Qué recurso predomina?', 'Hipérbole', 'Símil o comparación', 'Antítesis', 'Anáfora', 'd', 2, 'La anáfora repite una palabra al inicio de varias frases, y aquí cada frase arranca con «Exigimos».'),
      (v_semana_id, '¿Qué diferencia hay entre «Tu risa es música» y «Tu risa suena como música»?', 'Las dos son símiles, porque comparan la risa con música', 'La primera compara y la segunda dice que es otra cosa', 'La primera dice que es otra cosa y la segunda compara', 'Las dos son metáforas; solo cambia el verbo de la frase', 'c', 3, 'La metáfora afirma que algo es otra cosa sin usar «como»; el símil sí emplea esa palabra para comparar.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una página con datos sobre vitaminas termina invitando a comprar los suplementos de su propia marca. ¿Qué criterio del método CRAAP te obliga a revisar esto?', 'Propósito', 'Exactitud', 'Relevancia', 'Actualidad', 'a', 1, 'Este criterio pregunta si la fuente informa, persuade, vende o entretiene; aquí la página parece querer vender.'),
      (v_semana_id, 'Aldo admira a su maestro de música y por eso da por cierto todo lo que dice sobre economía. ¿Qué sesgo muestra?', 'Efecto bandwagon', 'Sesgo de anclaje', 'Sesgo de confirmación', 'Efecto halo', 'd', 2, 'El efecto halo hace asumir que todo lo que dice una persona es correcto solo porque esa persona te cae bien.'),
      (v_semana_id, 'Sofía reunió fuentes para un trabajo de Biología. Según la jerarquía de fuentes, ¿cuál ocupa el último lugar en confiabilidad?', 'Una revista reconocida', 'Un hilo en un foro de internet', 'Un blog de un experto identificable', 'Un artículo de divulgación', 'b', 3, 'En la jerarquía de fuentes, las redes sociales y los foros quedan al final: son lo menos confiable de la lista.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Original de Ruiz (2021): «La contaminación del aire es uno de los principales problemas de salud en las grandes ciudades». ¿Cuál es una paráfrasis correcta?', 'Según Ruiz (2021), la contaminación del aire es uno de los principales problemas de salud urbanos', 'La contaminación del aire es uno de los principales problemas de salud en las metrópolis', 'Según Ruiz (2021), respirar aire sucio es de los mayores riesgos sanitarios en las metrópolis', 'Según Ruiz (2021), las grandes ciudades deberían prohibir los autos para cuidar la salud', 'c', 1, 'Parafrasear es usar tus propias palabras sin alterar el significado, cambiar la estructura y citar siempre la fuente.'),
      (v_semana_id, 'Rocío ya leyó sus fuentes, identificó sus ideas principales y encontró coincidencias y diferencias. ¿Qué paso de la síntesis sigue?', 'Organizar las ideas en un esquema', 'Volver a leer todas las fuentes', 'Redactar el texto que integre todo', 'Identificar las ideas de cada fuente', 'a', 2, 'Antes de redactar, las ideas ya comparadas se ordenan en un esquema; ese es el cuarto paso de la síntesis.'),
      (v_semana_id, 'Según lo visto esta semana, ¿en qué momento y para qué conviene elaborar un mapa conceptual?', 'Antes de leer las fuentes, para predecir de qué tratarán', 'Tras redactar el texto, para revisar lo que ya se escribió', 'Tras leer las fuentes, para ordenar ideas antes de escribir', 'Durante la redacción, para encontrar sinónimos de cada idea', 'c', 3, 'El mapa conceptual es una herramienta de síntesis: se hace tras leer varias fuentes y ayuda a organizar las ideas.');
  END IF;
END $$;

-- ----------- Comprensión lectora I (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comprensión lectora I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comprensión lectora I" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Antes de decidir si un reportaje le sirve para su tarea, Itzel lo hojea para captar de qué trata en general. ¿Qué tipo de lectura hace?', 'Scanning', 'Skimming', 'Lectura extensiva', 'Lectura intensiva', 'b', 1, 'Esta lectura rápida sirve para captar la idea general de un texto, justo lo que Itzel necesita para decidir.'),
      (v_semana_id, 'Un cartel de campaña vecinal dice: «Riqueza en las palabras, pobreza en los hechos». ¿Qué recurso usa?', 'Personificación', 'Antítesis', 'Hipérbole', 'Anáfora', 'b', 2, 'Este recurso pone ideas contrarias juntas: el cartel enfrenta riqueza con pobreza y palabras con hechos.'),
      (v_semana_id, 'Gerardo redacta con sus palabras una idea de la autora García (2022), pero en ningún lugar de su ensayo la menciona. ¿Qué ocurre con su trabajo?', 'Es plagio, porque omitió citar a la autora', 'Es una paráfrasis correcta, porque cambió la redacción', 'Es un resumen válido, porque condensó la idea de ella', 'Es una síntesis válida, porque usó palabras propias', 'a', 3, 'Usar la idea de otra persona sin darle crédito es plagio, sin importar que el texto esté redactado de otra manera.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al revisar el inventario de la sala de cómputo, Daniela separa lo que es software. ¿Qué grupo pertenece a esa categoría?', 'Windows, ratón y Chrome', 'Windows, Word y Chrome', 'Teclado, ratón y pantalla', 'Word, teclado y pantalla', 'b', 1, 'El software son los programas y las aplicaciones; en este grupo todos lo son, y ninguno es una parte física que se pueda tocar.'),
      (v_semana_id, 'Sofía tiene fotos guardadas desde hace años y un editor de textos abierto en este momento. ¿Dónde está cada uno, según la función de cada componente?', 'Las fotos en el disco; el editor en uso, en la RAM', 'Las fotos en la RAM; el editor en uso, en el disco', 'Las fotos en la tarjeta madre; el editor, en la CPU', 'Las fotos en la CPU; el editor en uso, en la RAM', 'a', 2, 'El disco guarda los archivos de forma permanente, y la RAM es la memoria temporal de lo que se usa en ese momento.'),
      (v_semana_id, 'Don Ramón quiere que la computadora de su papelería le entregue documentos en papel. ¿Qué dispositivo necesita y de qué tipo es?', 'Una impresora, de entrada', 'Un escáner, de salida', 'Una tarjeta SD, de almacenamiento', 'Una impresora, de salida', 'd', 3, 'El aparato que imprime en papel aparece en la lista de dispositivos de salida, junto con el monitor, las bocinas y los audífonos.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Iván quiere páginas donde aparezca tal cual la frase Grito de Dolores, y no esas palabras sueltas. ¿Qué escribe en el buscador?', 'Grito -de -Dolores', '"Grito de Dolores"', 'site:Grito de Dolores', 'Grito de Dolores filetype:pdf', 'b', 1, 'Las comillas hacen que el buscador localice esa frase exacta y no las palabras por separado.'),
      (v_semana_id, 'Valeria compara dos páginas sobre los mayas. La primera muestra autor, fecha reciente y referencias; la segunda es un blog anónimo sin fecha. ¿Qué concluye con los criterios de la semana?', 'La segunda, porque no depende de ninguna otra fuente', 'Las dos, porque las dos tratan el tema de los mayas', 'La segunda, porque tiene más comentarios de lectores', 'La primera, porque identifica a su autor y cita fuentes', 'd', 2, 'Un autor identificable, una fecha reciente y las referencias dan confianza, mientras que un blog anónimo figura entre las fuentes no confiables.'),
      (v_semana_id, 'Mateo vio ayer una página útil, pero no la guardó en favoritos. ¿Qué parte del navegador le ayuda a encontrarla?', 'El botón de recargar', 'Las pestañas', 'Los marcadores', 'El historial', 'd', 3, 'El historial es el registro de las páginas visitadas, así que ahí queda lo que vio aunque no lo haya guardado.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué diferencia hay entre recibir un correo en CC y recibirlo en CCO?', 'En CCO, los demás no saben que esa persona recibió copia', 'En CCO, la persona recibe el asunto, pero no el cuerpo', 'En CC, la persona recibe el cuerpo, pero no los adjuntos', 'En CC, los demás no saben que esa persona recibió copia', 'a', 1, 'La copia oculta llega a sus destinatarios sin que el resto lo sepa; la copia normal es para quienes deben estar informados.'),
      (v_semana_id, 'Karla le escribe a control escolar para pedir una constancia de estudios. ¿Qué asunto cumple con la etiqueta digital?', 'Mensaje de Karla para la escuela', 'Hola, buen día, espero que esté bien', 'Solicitud de constancia de estudios', 'URGENTE: RESPONDER HOY MISMO', 'c', 2, 'Un asunto descriptivo resume el tema del correo, así que quien lo recibe sabe de qué trata antes de abrirlo.'),
      (v_semana_id, 'Ricardo escribe un correo formal y, justo después del saludo, quiere decir en una oración quién es y por qué escribe. ¿Qué parte de la estructura redacta?', 'La introducción', 'El cuerpo', 'El cierre', 'La despedida', 'a', 3, 'En la estructura de un correo formal, después del saludo va una oración con la identidad de quien escribe y su motivo.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Jorge quiere redactar sin pagar ni instalar nada, y le preocupa perder su avance si olvida guardar. ¿Qué herramienta le conviene?', 'Google Chrome', 'Google Docs', 'Microsoft Word de pago', 'LibreOffice Writer', 'b', 1, 'Este procesador es gratuito, funciona en el navegador y guarda automáticamente en la nube, por lo que cubre las tres necesidades.'),
      (v_semana_id, 'La tarea de Gael usa Arial de 12 puntos, interlineado 1.5, márgenes de 1 cm y texto justificado. ¿Qué debe corregir según el formato académico?', 'El interlineado, que debe ser sencillo', 'La fuente, que debe ser Times New Roman', 'El tamaño, que debe ser de 14 puntos', 'Los márgenes, que deben medir 2.5 cm', 'd', 2, 'El formato académico básico admite los demás datos de su tarea, pero pide 2.5 cm en lugar de 1 cm en cada margen.'),
      (v_semana_id, 'Ximena quiere mover un párrafo a otra página del documento, quitándolo de su lugar original. ¿Qué atajos usa y en qué orden?', 'Ctrl+C y después Ctrl+Z', 'Ctrl+V y después Ctrl+X', 'Ctrl+X y después Ctrl+V', 'Ctrl+A y después Ctrl+P', 'c', 3, 'Cortar quita el texto de su lugar y pegar lo coloca en el sitio nuevo, por eso se empieza con el atajo de cortar.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una diapositiva tiene 5 líneas con 9 palabras cada una. ¿Cómo queda frente a la regla 6×6?', 'Cumple la regla, porque tiene menos de 6 líneas', 'Se pasa tanto en líneas como en palabras por línea', 'Cumple en palabras por línea, pero se pasa en líneas', 'Cumple en líneas, pero se pasa en palabras por línea', 'd', 1, 'La regla permite máximo 6 líneas y 6 palabras por línea: 5 líneas están dentro del límite y 9 palabras lo rebasan.'),
      (v_semana_id, 'Julio quiere que, justo después de la portada, su público sepa qué temas va a exponer. ¿Qué parte de la estructura agrega?', 'El desarrollo', 'Las conclusiones del tema', 'El índice o agenda', 'Las referencias', 'c', 2, 'Esta parte va después de la portada y anuncia qué se va a presentar, antes de entrar al contenido.'),
      (v_semana_id, 'Un equipo pegó en sus diapositivas párrafos completos de su trabajo para leerlos en voz alta. ¿Qué idea central contradice?', 'Que las imágenes deben aportar algo', 'Que el contraste debe facilitar la lectura', 'Que todas lleven la misma fuente y color', 'Que las diapositivas son un apoyo visual', 'd', 3, 'La regla de oro es menos es más: las diapositivas acompañan la exposición y no funcionan como un documento para leer.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Paty comparte su borrador con su maestra para que deje observaciones sin poder cambiar el texto. ¿Qué permiso le asigna?', 'Un enlace para cualquiera', 'Editar', 'Comentar', 'Solo ver', 'c', 1, 'Al compartir se elige un permiso, y el que deja escribir observaciones sin modificar el documento es el de comentarios.'),
      (v_semana_id, '¿Qué nombre de archivo sigue mejor la buena práctica de nombrar de forma descriptiva?', 'documento_nuevo_version2.docx', 'Ensayo_Hist202_Semana5_Ana.docx', 'mi_tarea_que_ya_termine_hoy.docx', 'archivo_para_la_maestra.docx', 'b', 2, 'Un nombre descriptivo permite saber qué contiene el archivo, porque indica datos como el trabajo, la materia, la semana y el autor.'),
      (v_semana_id, 'César enviará su trabajo final y no quiere que quien lo reciba pueda editarlo. ¿En qué tipo de archivo lo comparte?', '.docx', '.zip', '.pdf', '.pptx', 'c', 3, 'Esta extensión corresponde a un documento no editable, pensado precisamente para compartir.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según las recomendaciones de la semana, ¿cuál de estas contraseñas es segura?', 'Gat0_Luna$Mx2026', 'mariposaazulcielo', 'Carlos19052008', '123456789012', 'a', 1, 'Tiene más de 12 caracteres, mezcla mayúsculas, minúsculas, números y símbolos, y no usa nombre ni fecha de nacimiento.'),
      (v_semana_id, 'Recibes un aviso de Spotify enviado desde ayuda@sp0tify-avisos.com. Al revisar el remitente, ¿qué concluyes?', 'Es falso: tras la @ no aparece el dominio oficial', 'Es falso solo si además trae un enlace sospechoso', 'Es auténtico: tras la @ aparece casi el mismo nombre', 'Es auténtico: antes de la @ dice ayuda, como en soporte', 'a', 2, 'Lo que va después de la @ debe ser el dominio oficial de la empresa; una dirección parecida, pero distinta, delata el phishing.'),
      (v_semana_id, 'A tu primo le publican burlas repetidas en un grupo de mensajes. ¿Qué conjunto de acciones le recomiendas?', 'Borrar los mensajes, bloquear y no decirle a nadie', 'Guardar capturas, bloquear y reportar en la plataforma', 'Contestar, borrar los mensajes y salir del grupo', 'Contestar, guardar capturas y reportar en la plataforma', 'b', 3, 'Ante el ciberbullying se conserva la evidencia, se bloquea y se reporta, sin responder al agresor y hablando con un adulto de confianza.');
  END IF;
END $$;

-- ----------- Comunicación digital (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Comunicación digital'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Comunicación digital" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un cibercafé de Puebla necesita una pieza para guardar los archivos de sus clientes y su prioridad es gastar menos, aunque sea más lenta. ¿Cuál le conviene?', 'La memoria RAM', 'Un disco SSD', 'Un disco HDD', 'La tarjeta madre', 'c', 1, 'Este disco mecánico guarda los archivos de forma permanente y es el más barato, a cambio de ser más lento.'),
      (v_semana_id, 'Emilia necesita guardar 10 GB en la nube sin pagar. ¿Qué servicio le alcanza?', 'Google Drive', 'iCloud', 'Dropbox', 'OneDrive', 'a', 2, 'De los servicios vistos, solo este ofrece más de 10 GB gratis, con sus 15 GB.'),
      (v_semana_id, 'Elsa necesita una imagen para su presentación y quiere respetar los derechos de autor. ¿Qué hace?', 'Descarga cualquiera y le cambia el nombre', 'Usa un banco gratuito como Pexels', 'Toma la primera imagen del buscador', 'Copia una foto de la página de alguien', 'b', 3, 'No todo lo de internet es gratis para usar, por eso las imágenes se toman de bancos gratuitos como los que nombra la guía.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un termómetro en Toluca marca -4 °C. ¿Cuál es el conjunto más pequeño, de los estudiados, al que pertenece ese número?', 'Números racionales', 'Números irracionales', 'Números naturales', 'Números enteros', 'd', 1, '-4 es negativo, y los enteros son el primer conjunto de la cadena que ya incluye a los negativos.'),
      (v_semana_id, '¿Por qué 0.333... es un número racional y no uno irracional?', 'Porque se repite de forma periódica y se puede escribir como fracción', 'Porque es infinito, y todo decimal infinito se puede escribir como fracción', 'Porque su expansión decimal es exacta y termina en la tercera cifra', 'Porque es menor que 1, y los irracionales siempre son mayores que 1', 'a', 2, 'Es un decimal periódico, y los decimales periódicos se pueden escribir como fracción; eso es lo que define a un racional.'),
      (v_semana_id, 'Según la relación entre los conjuntos numéricos, ¿qué afirmación es verdadera?', 'Todo número racional es también entero', 'Todo número real es también racional', 'Todo número irracional es también racional', 'Todo número entero es también racional', 'd', 3, 'Los conjuntos son como cajas dentro de cajas: los enteros quedan dentro de los racionales, porque 3 = 3/1.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto vale 40 - 2 × (3 + 1)²?', '608', '32', '8', '-24', 'c', 1, 'Primero el paréntesis y el exponente: 4² = 16. Luego se multiplica por 2 y al final se resta de 40, lo que da 8.'),
      (v_semana_id, 'Mariana resuelve 24 ÷ 4 × 2 multiplicando primero y obtiene 3. ¿Qué debió hacer?', 'Nada, porque multiplicar va antes que dividir: se queda con 3', 'Dividir primero, porque dividir va antes que multiplicar: obtiene 12', 'Dividir primero, porque se va de izquierda a derecha: obtiene 12', 'Nada, porque se resuelve de derecha a izquierda: se queda con 3', 'c', 2, 'La multiplicación y la división tienen la misma prioridad, así que se resuelven como se lee: 24 ÷ 4 = 6 y 6 × 2 = 12.'),
      (v_semana_id, 'En 3 × (2 + (7 - 4)), ¿qué operación se resuelve primero?', '3 × 2', '2 + 4', '2 + 7', '7 - 4', 'd', 3, 'Con paréntesis anidados se empieza por el más interno, que aquí contiene la resta.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Don Beto usa 1/4 de litro de salsa verde y 1/6 de litro de salsa roja. ¿Cuánta salsa usa en total?', '2/12 de litro', '2/10 de litro', '5/12 de litro', '1/24 de litro', 'c', 1, 'El MCM de 4 y 6 es 12, así que 1/4 = 3/12 y 1/6 = 2/12. Con el mismo denominador se suman los numeradores y da 5/12.'),
      (v_semana_id, '¿Cuál es el resultado de 3/4 ÷ 2/5?', '8/15', '15/8', '6/20', '5/9', 'b', 2, 'Dividir es multiplicar por el recíproco de la segunda fracción: 3/4 × 5/2 = 15/8.'),
      (v_semana_id, '¿Qué fracción simplificada equivale a 0.24?', '12/25', '6/25', '3/5', '24/10', 'b', 3, 'Dos decimales dan denominador 100: 24/100. Al simplificar entre 4 queda 6/25.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál expresión traduce al álgebra «el doble de un número menos tres»?', '2x - 3', '3 - 2x', '3x - 2', 'x² - 3', 'a', 1, 'El doble de un número se escribe 2x y después se le resta 3, igual que en el ejemplo de tres veces un número menos siete.'),
      (v_semana_id, '¿Cuál de estas parejas está formada por términos semejantes?', '4x² y 9x²', '7x² y 7y²', '4x² y 4x³', '3xy y 3x²', 'a', 2, 'Son semejantes porque tienen la misma variable con el mismo exponente; el coeficiente puede ser distinto.'),
      (v_semana_id, '¿Cómo queda simplificada la expresión 6a + 2b - a + 4b?', '7a + 6b', '6a + 6b', '5a + 2b', '5a + 6b', 'd', 3, 'Se agrupan los términos semejantes: (6a - a) + (2b + 4b) = 5a + 6b.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál de estas es una ecuación lineal?', 'x³ = 27', '3x + 2 = 8', 'x² + 2 = 11', '2x² - x = 3', 'b', 1, 'En una ecuación lineal la variable tiene exponente 1; en esta no aparece ningún exponente mayor.'),
      (v_semana_id, 'Resuelve la ecuación 6x - 4 = 2x + 16.', 'x = 5', 'x = 2.5', 'x = 3', 'x = 1.5', 'a', 2, 'Restar 2x de ambos lados da 4x - 4 = 16; sumar 4 da 4x = 20; dividir entre 4 da x = 5.'),
      (v_semana_id, 'Renata resolvió 2(x + 1) = 3x - 4 y obtuvo x = 6. Al comprobar su resultado, ¿qué concluye?', 'Está bien: al sustituir, ambos lados valen 12', 'Está mal: al sustituir, un lado vale 14 y el otro 18', 'Está mal: al sustituir, un lado vale 13 y el otro 14', 'Está bien: al sustituir, ambos lados valen 14', 'd', 3, '2(6 + 1) da 14 y 3(6) - 4 también da 14: la igualdad se cumple al sustituir en la ecuación original.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En una carpintería de Morelia hay 16 mesas y 28 sillas. ¿Cuál es la razón simplificada de mesas a sillas?', '2:7', '4:7', '4:11', '7:4', 'b', 1, 'La razón 16:28 se simplifica dividiendo entre 4: hay 4 mesas por cada 7 sillas.'),
      (v_semana_id, 'Si 4 metros de tela cuestan $180, ¿cuánto cuestan 7 metros al mismo precio?', '$315', '$183', '$45', '$1,260', 'a', 2, 'Con regla de tres: x = (7 × 180) / 4 = $315.'),
      (v_semana_id, 'De 120 aspirantes a una preparatoria de Puebla, 42 aprobaron el examen. ¿Qué porcentaje aprobó?', '42%', '65%', '35%', '78%', 'c', 3, 'Se aplica (parte / total) × 100: (42 / 120) × 100 = 35%.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Para delimitar una cancha rectangular de 15 m por 8 m se pintará una línea por todo su borde. ¿Cuántos metros mide esa línea?', '23 m', '46 m', '38 m', '120 m', 'b', 1, 'La línea recorre la distancia alrededor, que es el perímetro: 2(15 + 8) = 46 m.'),
      (v_semana_id, '¿Cuál es el área de un triángulo de cartón con base de 10 cm y altura de 7 cm?', '70 cm²', '17 cm²', '35 cm²', '8.5 cm²', 'c', 2, 'El área del triángulo es base por altura entre 2: (10 × 7) / 2 = 35 cm².'),
      (v_semana_id, 'Un aro tiene 6 cm de radio. Expresada con π, ¿cuánto mide su circunferencia?', '6π cm', '36π cm', '24π cm', '12π cm', 'd', 3, 'La circunferencia es 2πr; con r = 6 queda 2 × 6 × π = 12π cm.');
  END IF;
END $$;

-- ----------- Conocimiento matemático I (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático I" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto vale 10 - 6 ÷ 2 × 3?', '9', '1', '6', '12', 'b', 1, 'De izquierda a derecha, primero se resuelve 6 ÷ 2 y ese resultado se multiplica por 3; al final se resta de 10 y da 1.'),
      (v_semana_id, '¿Cuál es el resultado de 1/3 ÷ 2/5?', '6/5', '2/15', '5/6', '3/8', 'c', 2, 'Se voltea la segunda fracción y se multiplica: 1/3 × 5/2 = 5/6.'),
      (v_semana_id, 'De 40 alumnos de un plantel en Oaxaca, 26 aprobaron un examen. ¿Qué porcentaje aprobó?', '65%', '26%', '35%', '154%', 'a', 3, 'Se aplica (parte / total) × 100: (26 / 40) × 100 = 65%.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál es el resultado de simplificar (t⁴)⁵?', 't²⁰', 't⁹', '20t', '4t⁵', 'a', 1, 'Al elevar una potencia a otra potencia los exponentes se multiplican: 4 × 5 = 20.'),
      (v_semana_id, '¿Cuál es el desarrollo de (4x + 3)²?', '16x² + 9', '4x² + 24x + 9', '16x² + 24x + 9', '16x² + 12x + 9', 'c', 2, 'En el binomio al cuadrado, a = 4x y b = 3: se suman el cuadrado de 4x, el doble producto de 4x por 3 y el cuadrado de 3.'),
      (v_semana_id, '¿Qué resultado da el producto (x - 3)(x + 8)?', 'x² + 11x - 24', 'x² + 5x + 24', 'x² - 5x - 24', 'x² + 5x - 24', 'd', 3, 'En binomios con término común, el coeficiente de x es la suma -3 + 8 y el último término es el producto de -3 por 8.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al sacar el mayor factor común de 8x³ - 12x², ¿qué expresión resulta?', '4x²(2x - 3)', '2x²(4x - 6)', '4x(2x² - 3x)', '4x²(2x + 3)', 'a', 1, 'El mayor número que divide a 8 y a 12 es 4, y la variable con menor exponente es x²; dentro del paréntesis queda lo que falta de cada término.'),
      (v_semana_id, '¿Cuál es la factorización de x² - 2x - 24?', '(x + 6)(x - 4)', '(x - 6)(x - 4)', '(x - 6)(x + 4)', '(x - 8)(x + 3)', 'c', 2, 'Se buscan dos números cuyo producto sea -24 y cuya suma sea -2: son -6 y 4, y cada uno forma un factor con x.'),
      (v_semana_id, '¿Por qué x² + 12x + 20 no es un trinomio cuadrado perfecto?', 'Porque 20 no es un cuadrado perfecto', 'Porque el término del medio es positivo', 'Porque 12 no es un cuadrado perfecto', 'Porque 20 no es múltiplo de 12', 'a', 3, 'Para ser trinomio cuadrado perfecto, el primer y el tercer término deben ser cuadrados perfectos, y el tercer término de esta expresión no lo es.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto vale x en 4(x - 2) + 3 = 2(x + 5)?', 'x = 2.5', 'x = 7.5', 'x = 4.5', 'x = 5', 'b', 1, 'Al distribuir queda 4x - 8 + 3 = 2x + 10; al agrupar resulta 2x = 15, y de ahí sale el valor de x.'),
      (v_semana_id, '¿Cuánto vale x en x/3 + x/6 = 9?', 'x = 3', 'x = 9', 'x = 18', 'x = 27', 'c', 2, 'El MCM de 3 y 6 es 6; al multiplicar todos los términos, incluido el 9, queda 2x + x = 54.'),
      (v_semana_id, '¿Qué se obtiene al despejar h de la fórmula V = b×h/3?', 'h = 3V/b', 'h = 3b/V', 'h = V/(3b)', 'h = V - 3b', 'a', 3, 'Se multiplica todo por 3, lo que da 3V = b×h, y después se divide entre b para dejar sola a la h.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Para resolver por sustitución x + y = 11 y 3x - 2y = 3, tomas y = 11 - x. ¿Cómo queda la segunda ecuación?', '3x - 2(x - 11) = 3', '3x - 2(11 - x) = 3', '3x - 11 - x = 3', '3x - 2(11 + x) = 3', 'b', 1, 'La expresión despejada reemplaza a y en la otra ecuación, y por eso va completa entre paréntesis, multiplicada por el coeficiente de y.'),
      (v_semana_id, '¿Qué valores satisfacen al mismo tiempo 5x + 3y = 21 y 2x + y = 8?', 'x = 1, y = 6', 'x = 0, y = 7', 'x = 4, y = 0', 'x = 3, y = 2', 'd', 2, 'La solución de un sistema debe cumplir las dos ecuaciones a la vez: 5(3) + 3(2) = 21 y 2(3) + 2 = 8.'),
      (v_semana_id, 'Al graficar un sistema, sus dos rectas resultan paralelas. ¿Qué se concluye?', 'Tiene una solución: es dependiente', 'No tiene solución: es inconsistente', 'Tiene una solución: es consistente', 'Tiene infinitas soluciones: es dependiente', 'b', 3, 'Las líneas paralelas nunca se cruzan, así que ningún punto cumple las dos ecuaciones.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al resolver -4x + 7 < 19, ¿qué solución se obtiene?', 'x < 3', 'x < -3', 'x > 3', 'x > -3', 'd', 1, 'Se resta 7 y queda -4x < 12; al dividir entre -4, que es negativo, se invierte el signo de la desigualdad.'),
      (v_semana_id, '¿Cómo se escribe 0 < x ≤ 8 en notación de intervalos?', '(0, 8)', '[0, 8]', '(0, 8]', '[0, 8)', 'c', 2, 'El 0 no se incluye, por eso lleva paréntesis; el 8 sí se incluye, por eso lleva corchete.'),
      (v_semana_id, 'Un gimnasio cobra $300 de inscripción más $50 por clase. Con un presupuesto máximo de $800, ¿cuántas clases como máximo puedes tomar?', '22 clases', '16 clases', '6 clases', '10 clases', 'd', 3, 'Se plantea 300 + 50c ≤ 800 y se resuelve como una ecuación: se resta 300 y se divide entre 50, que es positivo, así que el signo no cambia.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una recta pasa por (2, 7) y (6, -1). ¿Cuánto vale su pendiente y cómo se comporta la línea?', 'm = -2; la línea sube', 'm = 2; la línea sube', 'm = -2; la línea baja', 'm = -1/2; la línea baja', 'c', 1, 'La pendiente es el cambio en Y entre el cambio en X: (-1 - 7)/(6 - 2) = -8/4. Una pendiente negativa indica que la línea desciende de izquierda a derecha.'),
      (v_semana_id, 'Un plomero cobra según y = 250 + 120x, donde x son las horas trabajadas. ¿Qué es el 250 en esta función?', 'La ordenada al origen: el cobro fijo', 'La pendiente: el cobro por hora', 'La ordenada al origen: el cobro por hora', 'La pendiente: el cobro fijo', 'a', 2, 'En y = mx + b, b es la ordenada al origen, donde la recta cruza el eje Y. Aquí son $250 que se pagan aunque x valga 0.'),
      (v_semana_id, 'Al graficar y = 3x - 2 con los pasos de la semana, ¿qué dos puntos marcas?', '(0, 3) y (1, 1)', '(0, -2) y (1, 1)', '(0, -2) y (1, 3)', '(-2, 0) y (1, 1)', 'b', 3, 'El valor de b indica el primer punto sobre el eje Y; desde ahí se suben 3 unidades, que es m, y se avanza 1 a la derecha.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál es la distancia entre R(-3, 4) y S(5, 19)?', '23', '√229', '17', '289', 'c', 1, 'Las diferencias son 8 y 15: se elevan al cuadrado, se suman y al final se saca la raíz cuadrada del resultado.'),
      (v_semana_id, '¿Cuál es el punto medio del segmento que une A(-3, 8) con B(7, -2)?', '(-5, 5)', '(2, 3)', '(4, 6)', '(5, -5)', 'b', 2, 'Cada coordenada es la mitad de la suma de las coordenadas de los extremos: (-3 + 7)/2 para x y (8 - 2)/2 para y.'),
      (v_semana_id, 'Un segmento tiene extremos en (-7, -3) y (1, 9). ¿En qué cuadrante cae su punto medio?', 'Cuadrante IV', 'Cuadrante II', 'Cuadrante III', 'Cuadrante I', 'b', 3, 'El punto medio es (-3, 3); la combinación de signos (-, +) corresponde al cuadrante de arriba a la izquierda.');
  END IF;
END $$;

-- ----------- Conocimiento matemático II (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Conocimiento matemático II'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Conocimiento matemático II" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al simplificar 6a + 5b - 2a + b, ¿qué expresión resulta?', '10ab', '8a + 6b', '4a + 5b', '4a + 6b', 'd', 1, 'Se agrupan por separado los términos con la misma variable: 6a - 2a por un lado y 5b + b por el otro.'),
      (v_semana_id, '¿Qué valores resuelven el sistema 4x + 3y = 18 y x - 3y = -3?', 'x = 2, y = 3', 'x = 3, y = 3', 'x = 5, y = 1', 'x = 3, y = 2', 'd', 2, 'Al sumar las ecuaciones se elimina y, queda 5x = 15; con ese valor de x se sustituye en la segunda para hallar y.'),
      (v_semana_id, '¿Cuál de estas rectas es paralela a y = 5x + 1?', 'y = 5x - 7', 'y = -(1/5)x + 1', 'y = (1/5)x + 1', 'y = -5x + 1', 'a', 3, 'Las rectas paralelas conservan la misma pendiente, y la recta dada tiene pendiente 5.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un compañero asegura que goza de salud plena porque no tiene ninguna enfermedad. Según la definición de la OMS, ¿qué le falta considerar?', 'Su bienestar físico, mental y social en conjunto', 'Su herencia genética y sus antecedentes familiares', 'Su acceso a médicos, hospitales y medicinas', 'Sus resultados recientes de peso y presión arterial', 'a', 1, 'La OMS define la salud como un estado de completo bienestar físico, mental y social; no basta con no estar enfermo.'),
      (v_semana_id, '¿Cuál de los factores que afectan la salud tiene el mayor peso?', 'El ambiente, como agua limpia y vivienda', 'El sistema de salud, como médicos y medicinas', 'El estilo de vida, lo que decides a diario', 'La genética, lo que heredas de tus padres', 'c', 2, 'El estilo de vida tiene el porcentaje más alto (50-55 %): alimentación, ejercicio, sueño, sustancias y estrés dependen de tus decisiones.'),
      (v_semana_id, 'Un adulto pesa 63 kg y mide 1.50 m. ¿Cuál es su IMC y en qué categoría queda?', '28, obesidad', '28, sobrepeso', '42, obesidad', '21, normal', 'b', 3, 'El IMC es el peso entre la estatura al cuadrado: 63 / 2.25 = 28, y el rango de 25 a 29.9 corresponde a sobrepeso.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un menú diario reparte la alimentación en 70 % de carbohidratos, 15 % de proteínas y 15 % de grasas. ¿Qué indica al compararlo con los rangos estudiados?', 'Sobran carbohidratos y faltan grasas', 'Sobran grasas y faltan proteínas', 'Cumple con los tres rangos indicados', 'Sobran proteínas y faltan carbohidratos', 'a', 1, 'Los carbohidratos deben ser 45-65 % y las grasas 20-35 %; con 70 % y 15 % ambos quedan fuera, mientras que las proteínas sí entran en 10-35 %.'),
      (v_semana_id, 'En una comida, la mayor parte del plato es carne y frijol, con algo de tortilla y muy poca verdura. Según el Plato del Bien Comer, ¿qué ajuste conviene?', 'Más cereales y menos del grupo verde', 'Más verduras y menos del grupo rojo', 'Más leguminosas y menos del grupo verde', 'Más del grupo rojo y menos cereales', 'b', 2, 'Frutas y verduras deben ocupar la mayor parte del plato; el grupo rojo, de leguminosas y origen animal, va en menor cantidad.'),
      (v_semana_id, 'Una estudiante cubre sus calorías, pero casi nunca come cítricos ni guayaba. ¿Qué micronutriente le falta y para qué sirve?', 'Vitamina C, para el sistema inmune', 'Vitamina C, para la absorción de calcio', 'Calcio, para la formación de la sangre', 'Hierro, para el sistema inmune', 'a', 3, 'Los cítricos y la guayaba aportan vitamina C, un micronutriente esencial que apoya el sistema inmune, aunque se necesite en poca cantidad.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una publicación en redes dice que hay que eliminar los carbohidratos porque engordan. ¿Cuál es la respuesta correcta según lo estudiado?', 'Lo que engorda es el exceso de cualquier alimento', 'Solo engordan los carbohidratos complejos', 'Se pueden sustituir con suplementos y vitaminas', 'Solo engordan si se comen durante la noche', 'a', 1, 'Los carbohidratos son la principal fuente de energía; el problema es el exceso de cualquier alimento, por lo que conviene elegir los complejos.'),
      (v_semana_id, 'Por cada 100 g, la barra A trae 4 g de azúcar, 1 g de grasa saturada y 6 g de fibra; la B trae 12 g, 5 g y 2 g. ¿Cuál conviene y por qué?', 'La A, pero solo por su menor contenido de grasa saturada', 'La A: menos azúcar y grasa saturada, más fibra', 'La B: más energía por su azúcar y su grasa saturada', 'La B: tiene menos fibra, y en fibra entre menos, mejor', 'b', 2, 'Menos de 5 g de azúcar por 100 g es bajo; además, en grasa saturada entre menos es mejor y en fibra entre más es mejor.'),
      (v_semana_id, 'Una estudiante hace 20 comidas a la semana y quiere aplicar la regla 80/20. ¿Cómo se reparten?', '18 comidas saludables y 2 gustos', '10 comidas saludables y 10 gustos', '16 comidas saludables y 4 gustos', '4 comidas saludables y 16 gustos', 'c', 3, 'La regla pide comer saludable el 80 % del tiempo: el 80 % de 20 comidas son 16, y las otras 4 quedan para darse gustos.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una rutina incluye sentadillas, lagartijas y planchas. ¿Qué tipo de ejercicio es y qué busca?', 'Aeróbico, para elevar la frecuencia cardíaca', 'Fuerza, para fortalecer los músculos', 'Equilibrio, para ganar más estabilidad', 'Flexibilidad, para ampliar el movimiento', 'b', 1, 'Sentadillas, lagartijas y planchas son ejercicios de fuerza o resistencia, cuyo objetivo es fortalecer los músculos.'),
      (v_semana_id, 'Un joven de 15 años corre 30 minutos diarios y hace lagartijas una vez por semana. ¿Qué le falta para cumplir la recomendación de la OMS?', 'Solo 30 minutos más al día, con la misma fuerza semanal', 'Nada, porque ya cumple con las dos recomendaciones', '30 minutos más al día y 2 sesiones más de fuerza', 'Solo 2 sesiones más de fuerza, con los mismos minutos', 'c', 2, 'La OMS pide mínimo 60 minutos diarios y fortalecimiento al menos 3 veces por semana: le faltan 30 minutos al día y 2 sesiones semanales.'),
      (v_semana_id, 'Una persona que no hace ejercicio quiere empezar. ¿Qué plan sigue mejor lo estudiado?', 'Entrenar muy fuerte solo durante el fin de semana', 'Esperar hasta poder inscribirse en un gimnasio', 'Correr una hora diaria desde el primer día', 'Caminar 20 minutos e ir aumentando poco a poco', 'd', 3, 'Se recomienda empezar con 15-20 minutos e ir aumentando; caminar cuenta como ejercicio y la consistencia importa más que la intensidad.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Antes de exponer ante su grupo, Lupita siente nervios que la mantienen alerta y desaparecen al terminar. ¿Cómo se interpreta según lo estudiado?', 'Estrés crónico, que daña la salud', 'Ansiedad que interfiere con la vida diaria', 'Depresión, por una tristeza profunda y prolongada', 'Estrés en pequeña dosis, útil para reaccionar', 'd', 1, 'El estrés es la respuesta ante una demanda; en pequeñas dosis es útil porque ayuda a reaccionar. Solo cuando se vuelve crónico daña la salud.'),
      (v_semana_id, '¿Qué grupo de señales apunta a depresión?', 'Preocupación constante, sudoración y taquicardia', 'Tensión muscular, irritabilidad y dolor de cabeza', 'Pérdida de interés, fatiga y sentimiento de vacío', 'Sensación de peligro, respiración acelerada y sudoración', 'c', 2, 'La depresión es una tristeza profunda y prolongada; entre sus señales están perder el interés por lo que antes se disfrutaba, la fatiga constante y el vacío.'),
      (v_semana_id, 'Si sigues la técnica de respiración profunda completa, ¿cuánto tiempo te toma?', '60 segundos, a razón de 12 por repetición', '40 segundos, a razón de 8 por repetición', '2 minutos, a razón de 24 por repetición', '20 segundos, a razón de 4 por repetición', 'a', 3, 'Inhalar, retener y exhalar 4 segundos cada uno suma 12 segundos; al repetirlo 5 veces se completan 60 segundos.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un joven de 22 años duerme 5 horas de lunes a viernes y así lleva varios meses. ¿Cómo se clasifica?', 'Sueño normal, porque su rango es de 5 a 7 horas', 'Privación de sueño, por dormir menos de 6 horas', 'Sueño suficiente, si repone horas el fin de semana', 'Privación de sueño, solo si es menor de 18 años', 'b', 1, 'Dormir menos de 6 horas de manera consistente se considera privación de sueño; a su edad se recomiendan de 7 a 9 horas.'),
      (v_semana_id, 'Una estudiante se acuesta a las 11 PM. ¿Qué horario respeta lo estudiado sobre cafeína y pantallas?', 'Cafeína hasta las 8 PM y pantallas hasta las 10:15 PM', 'Cafeína hasta las 2 PM y pantallas hasta las 10:55 PM', 'Cafeína hasta las 2 PM y pantallas hasta las 10:15 PM', 'Cafeína hasta las 8 PM y pantallas hasta las 10:55 PM', 'c', 2, 'La higiene del sueño pide evitar cafeína después de las 2 PM y dejar las pantallas de 30 a 60 minutos antes de dormir.'),
      (v_semana_id, 'Una estudiante de 16 años completa 6 ciclos de sueño en una noche. ¿Cuánto durmió aproximadamente y cómo queda frente a lo recomendado?', 'Unas 9 horas, por encima del rango de 7 a 8', 'Unas 12 horas, por encima del rango de 8 a 10', 'Unas 9 horas, dentro del rango de 8 a 10', 'Unas 6 horas, por debajo del rango de 8 a 10', 'c', 3, 'Cada ciclo dura unos 90 minutos: 6 ciclos son 540 minutos, es decir, 9 horas; a los 14-17 años se recomiendan de 8 a 10 horas.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según la definición estudiada, ¿qué caracteriza a una adicción?', 'Consumo frecuente de una sustancia, aunque no cause daños', 'Dependencia solo a sustancias ilegales, pese a sus daños', 'Cualquier hábito diario, aunque no traiga consecuencias', 'Dependencia a una sustancia o comportamiento, pese a sus daños', 'd', 1, 'Una adicción es la dependencia física y/o psicológica a una sustancia o comportamiento, a pesar de sus consecuencias negativas.'),
      (v_semana_id, '¿Por qué el alcohol resulta especialmente riesgoso durante la adolescencia?', 'Es una droga legal y por eso daña más que las ilegales', 'Su cerebro termina de desarrollarse hacia los 25 años', 'El daño hepático crónico aparece desde la primera copa', 'Genera dependencia desde el primer consumo', 'b', 2, 'El cerebro adolescente es especialmente vulnerable al alcohol porque no termina de desarrollarse hasta alrededor de los 25 años.'),
      (v_semana_id, 'Un amigo dice que vapear no tiene riesgo porque no es un cigarro tradicional. ¿Qué le respondes según lo estudiado?', 'No daña si el aparato es de una marca reconocida', 'El riesgo es solo para quienes ya fuman cigarros', 'Daña menos porque no tiene nicotina, solo sabor', 'También lo expone a la nicotina y a químicos dañinos', 'd', 3, 'Los vapeadores y cigarros electrónicos no son seguros, porque contienen nicotina y sustancias tóxicas.');
  END IF;
END $$;

-- ----------- Estilo de vida saludable (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Estilo de vida saludable'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Estilo de vida saludable" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Dos adultos tienen un IMC de 23 y de 31. ¿En qué categorías quedan, en ese orden?', 'Normal y obesidad', 'Sobrepeso y obesidad', 'Normal y sobrepeso', 'Bajo peso y obesidad', 'a', 1, 'El rango normal va de 18.5 a 24.9, así que 23 entra en él; desde 30 se considera obesidad, por lo que ahí queda 31.'),
      (v_semana_id, 'Un yogur dice light en su empaque. ¿Qué conviene hacer antes de elegirlo?', 'Asumir que su fibra aumentó al reducirse la grasa', 'Revisar solo la grasa, pues el azúcar baja junto con ella', 'Elegirlo, porque light implica menos azúcar y menos sodio', 'Leer la etiqueta, porque puede llevar más azúcar', 'd', 2, 'Muchos productos light compensan la reducción de grasa con más azúcar, o viceversa, así que hay que revisar la etiqueta.'),
      (v_semana_id, '¿Qué grupo reúne efectos inmediatos del alcohol?', 'Pérdida de coordinación y dependencia', 'Daño hepático y problemas cerebrales', 'Desinhibición y dependencia', 'Pérdida de coordinación y juicio alterado', 'd', 3, 'Al momento de beber, el alcohol provoca pérdida de coordinación, altera el juicio y produce desinhibición; la dependencia y los daños llegan con el uso prolongado.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una museógrafa reúne en una sala el calendario, el juego de pelota y las cabezas colosales. ¿Qué civilización debe rotular esa sala?', 'Teotihuacanos', 'Olmecas', 'Mayas', 'Mexicas', 'b', 1, 'El calendario, el juego de pelota y las cabezas colosales son aportes de los olmecas, la civilización considerada la cultura madre.'),
      (v_semana_id, 'Una estudiante compara los aportes de varias civilizaciones de Mesoamérica. ¿Cuál corresponde a los mayas?', 'La fundación de una ciudad sobre un lago', 'Las cabezas colosales y el juego de pelota', 'La ciudad más grande de Mesoamérica y sus pirámides', 'El concepto del cero y la escritura jeroglífica', 'd', 2, 'Los mayas desarrollaron la escritura jeroglífica y el concepto del cero, además de una astronomía precisa y una arquitectura monumental.'),
      (v_semana_id, '¿Qué pareja une correctamente una escuela mexica con lo que se enseñaba en ella?', 'Telpochcalli: oficios y artes de guerra', 'Telpochcalli: religión, astronomía y escritura', 'Cuicacalli: religión, astronomía y leyes', 'Calmécac: música, canto y danza', 'a', 3, 'El Telpochcalli era la escuela del pueblo, donde se enseñaban oficios, artes de guerra, música y valores comunitarios.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un compañero explica la caída del imperio mexica solo por las armas de fuego y los caballos. ¿Qué factores le faltó considerar?', 'Alianzas, viruela y la interpretación de Malintzin', 'La llegada constante de miles de soldados más desde España', 'La falta de resistencia de los pueblos del Valle de México', 'La rendición pacífica de Tenochtitlán sin combatir', 'a', 1, 'La conquista fue posible por varios factores a la vez: alianzas con pueblos enemigos de los mexicas, enfermedades europeas, la interpretación de Malintzin y la superioridad tecnológica.'),
      (v_semana_id, 'Un fraile franciscano abre una escuela para indígenas en la Nueva España. Según la lección, ¿qué propósito central persigue?', 'Prepararlos para gobernar la colonia', 'Convertirlos al cristianismo', 'Entrenarlos en las armas de fuego', 'Conservar las enseñanzas del Calmécac', 'b', 2, 'La educación colonial tenía como objetivo principal la evangelización, es decir, llevar a los indígenas a la fe cristiana.'),
      (v_semana_id, '¿Qué relación establece la lección entre el sistema de castas y la lucha por la independencia?', 'El sistema de castas no tuvo relación alguna con la independencia', 'Las castas bajas tenían acceso preferente a las escuelas coloniales', 'La desigualdad en el acceso a la educación alimentó el descontento', 'La educación estaba prohibida para todas las castas por igual', 'c', 3, 'El acceso a la educación dependía de la posición de cada persona en el sistema de castas, y esa desigualdad sentó las bases del descontento independentista.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál de estos hechos, ocurrido fuera de la Nueva España, fue una causa de la Independencia?', 'La desigualdad del sistema de castas', 'La invasión de Napoleón a España', 'La crisis económica de la colonia', 'La unión de Iturbide a la causa', 'b', 1, 'La invasión de Napoleón a España, en 1808, ocurrió en Europa y es una de las causas que señala la lección.'),
      (v_semana_id, 'Un ensayo destaca la etapa en la que el movimiento se dio un documento político y un congreso. ¿De cuál se trata?', 'Resistencia, con Guerrero al frente', 'Inicio, con Hidalgo al frente', 'Consumación, con Iturbide al frente', 'Organización, con Morelos al frente', 'd', 2, 'En la etapa de organización, Morelos tomó el liderazgo, escribió ''Sentimientos de la Nación'' y convocó al Congreso de Chilpancingo.'),
      (v_semana_id, 'En una escuela del México recién independizado, una alumna avanzada explica la lección a sus compañeros. ¿Qué modelo educativo ilustra?', 'Colegio de Santa Cruz de Tlatelolco', 'Compañía Lancasteriana', 'Sentimientos de la Nación', 'Reforma de Valentín Gómez Farías', 'b', 3, 'En la Compañía Lancasteriana, un alumno avanzado enseña a otros: justo lo que hace esta alumna.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué pareja distingue correctamente lo que trataron la Ley Lerdo y la Constitución de 1857?', 'Ley Lerdo: fueros militares; Constitución: bienes de la Iglesia', 'Ley Lerdo: libertad de enseñanza; Constitución: fueros militares', 'Ley Lerdo: libertad de enseñanza; Constitución: bienes de la Iglesia', 'Ley Lerdo: bienes de la Iglesia; Constitución: libertad de enseñanza', 'd', 1, 'La Ley Lerdo (1856) se ocupó de la desamortización de bienes de la Iglesia; la Constitución de 1857, de garantías individuales y de la libertad de enseñanza.'),
      (v_semana_id, '¿Cuál de estas situaciones contradice el principio de educación laica?', 'Una escuela pública que enseña una sola doctrina religiosa', 'Una escuela pública que exige la asistencia de todos sus alumnos', 'Una escuela pública que enseña ciencias y civismo', 'Una escuela pública que no cobra colegiatura a sus alumnos', 'a', 2, 'Laica significa sin influencia religiosa, un principio que estableció la Reforma; impartir una doctrina religiosa va en su contra.'),
      (v_semana_id, 'Durante la Intervención Francesa, ¿qué desenlace tuvo el pulso entre la república de Juárez y el imperio de Maximiliano?', 'Juárez cedió el poder y Maximiliano siguió gobernando', 'Juárez fue derrotado y la Constitución de 1857 quedó anulada', 'Juárez resistió y triunfó; Maximiliano fue fusilado', 'Maximiliano abdicó en paz y regresó a Europa en 1867', 'c', 3, 'Durante la Intervención Francesa, Juárez resistió hasta vencer, y en 1867 el emperador impuesto por Francia fue fusilado.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un manifestante de 1910 repite el lema «Sufragio efectivo, no reelección». ¿Con qué líder de la Revolución se asocia?', 'Madero', 'Carranza', 'Zapata', 'Villa', 'a', 1, 'Madero se asocia con la democracia y con el lema ''Sufragio efectivo, no reelección''; su causa era la democracia.'),
      (v_semana_id, 'Una comunidad debate a quién corresponden las tierras y los recursos de su región. ¿Qué respuesta da la Constitución de 1917?', 'Art. 123°: pertenecen a la nación', 'Art. 27°: pertenecen a la nación', 'Art. 123°: pertenecen a los trabajadores', 'Art. 27°: son de quien los trabaja', 'b', 2, 'El artículo 27° de la Constitución de 1917 establece que la tierra y los recursos pertenecen a la nación.'),
      (v_semana_id, 'Un familiar le dice a una joven que estudiar el bachillerato es un lujo y no un derecho. ¿Qué dato de la lección lo desmiente?', 'Desde 2012 el bachillerato es obligatorio', 'Desde 1917 el bachillerato ya es obligatorio', 'Desde 2012 la universidad es obligatoria', 'Desde 1993 el bachillerato es gratuito', 'a', 3, 'En 2012 se hizo obligatorio el bachillerato, por lo que estudiarlo es un derecho constitucional y no un lujo.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué medidas de José Vasconcelos respondieron al reto de llevar educación a millones?', 'Educación socialista, IPN y educación rural', 'Libros de texto gratuitos y miles de escuelas', 'Bibliotecas, maestros rurales y muralismo', 'Educación a distancia y bachillerato virtual', 'c', 1, 'Como primer Secretario de Educación Pública, Vasconcelos envió maestros rurales, creó bibliotecas y promovió el muralismo de Rivera, Orozco y Siqueiros.'),
      (v_semana_id, 'Una estudiante del IPN investiga quién creó su institución y cuándo. ¿Qué respuesta da la lección?', 'José Vasconcelos, en 1936', 'Lázaro Cárdenas, en 1921', 'José Vasconcelos, en 1921', 'Lázaro Cárdenas, en 1936', 'd', 2, 'Durante su periodo de 1934 a 1940, Lázaro Cárdenas creó el IPN en 1936 e impulsó la educación socialista.'),
      (v_semana_id, 'Una persona terminó la primaria en 1985 y no siguió estudiando. Según las reformas de la lección, ¿qué era cierto en ese año?', 'El bachillerato ya era obligatorio desde la creación del IPN en 1936', 'La secundaria ya era obligatoria desde el libro de texto gratuito de 1959', 'La secundaria aún no era obligatoria: lo sería hasta 1993', 'La secundaria ya era obligatoria desde la creación de la SEP en 1921', 'c', 3, 'La secundaria se hizo obligatoria en 1993, así que en 1985 todavía no lo era.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué distingue al mariachi de otros símbolos de Jalisco, como la birria o el tequila?', 'Es el deporte nacional surgido de las haciendas', 'Es una bebida tradicional hecha de agave azul', 'Es un paisaje reconocido por sus campos de agave', 'Es Patrimonio Cultural Inmaterial de la UNESCO', 'd', 1, 'El mariachi es Patrimonio Cultural Inmaterial de la Humanidad, reconocido por la UNESCO en 2011.'),
      (v_semana_id, 'Guadalajara se fundó en 1542. ¿Qué proceso de la historia de Jalisco ocurrió poco antes?', 'La abolición de la esclavitud', 'La conquista de Nuño de Guzmán', 'El reconocimiento del mariachi', 'La Guerra Cristera en la región', 'b', 2, 'Nuño de Guzmán conquistó la región en 1530-1531, unos años antes de la fundación de Guadalajara en 1542.'),
      (v_semana_id, 'Un alumno arma una línea del tiempo de Jalisco solo con hechos del siglo XX. ¿Cuál debe incluir?', 'La fundación de Guadalajara', 'La abolición de la esclavitud', 'La conquista de Nuño de Guzmán', 'La Guerra Cristera en Jalisco', 'd', 3, 'La Guerra Cristera ocurrió de 1926 a 1929 y tuvo a Jalisco como epicentro, por lo que pertenece al siglo XX.');
  END IF;
END $$;

-- ----------- Historia e identidad universitaria (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Historia e identidad universitaria'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Historia e identidad universitaria" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué secuencia de líderes corresponde a las cuatro etapas de la Independencia, de la primera a la última?', 'Morelos, Hidalgo, Guerrero e Iturbide', 'Hidalgo, Morelos, Iturbide y Guerrero', 'Hidalgo, Morelos, Guerrero e Iturbide', 'Hidalgo, Guerrero, Morelos e Iturbide', 'c', 1, 'La guía ordena las etapas así: inicio con Hidalgo, organización con Morelos, resistencia con Guerrero y consumación con Iturbide.'),
      (v_semana_id, '¿Qué par relaciona correctamente a un líder de la Revolución con su causa?', 'Villa: justicia para los pobres del norte', 'Zapata: orden constitucional en todo el país', 'Madero: justicia para los pobres del norte', 'Carranza: tierra para los campesinos', 'a', 2, 'La guía asocia a Villa con la justicia para los pobres del norte, y a cada uno de los otros líderes con una causa distinta.'),
      (v_semana_id, 'Según las fechas de la guía, ¿qué hecho ocurrió antes de que Cárdenas creara el IPN?', 'La llegada del libro de texto gratuito', 'La reforma de la secundaria obligatoria', 'La llegada de Vasconcelos a la SEP', 'La reforma del bachillerato obligatorio', 'c', 3, 'Vasconcelos fue primer Secretario de Educación Pública en 1921, quince años antes de que se creara el IPN en 1936.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Deletreas en inglés el nombre EVA. ¿Qué secuencia de sonidos es la correcta?', 'éi – vi – i', 'i – vi – éi', 'e – vi – a', 'i – bi – éi', 'b', 1, 'En inglés las letras se pronuncian diferente, sobre todo las vocales: la E se dice «i», la V «vi» y la A «éi».'),
      (v_semana_id, '¿Cómo se escribe en inglés el número 34?', 'forty-three', 'three-four', 'thirteen-four', 'thirty-four', 'd', 2, 'Del 21 al 99 se nombra la decena y luego la unidad con guion, como en twenty-one: 30 es thirty y 4 es four.'),
      (v_semana_id, 'Una compañera nueva te dice: «My name is Ana.» ¿Qué respondes al conocerla?', 'I''m fine, thank you.', 'Good night!', 'Nice to meet you!', 'See you later!', 'c', 3, 'Al conocer a alguien se dice Nice to meet you, que significa «mucho gusto».');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Estás hablando con dos compañeras y les dices: «¿Están cansadas?». ¿Cómo lo preguntas en inglés?', 'Are they tired?', 'Are you tired?', 'Am you tired?', 'Is you tired?', 'b', 1, 'Les hablas directamente, y you sirve para tú, usted y ustedes. Con you el verbo es are, y en la pregunta va primero.'),
      (v_semana_id, 'Cambia el sujeto de «I am a student» por She. ¿Cómo queda la oración?', 'She are a student.', 'She is a student.', 'She am a student.', 'She be a student.', 'b', 2, 'El verbo TO BE cambia según el pronombre, y con she su forma en presente es is: ella es o está.'),
      (v_semana_id, 'Convierte a negativa la oración «They are from Mexico.»', 'They is not from Mexico.', 'Not they are from Mexico.', 'They are not from Mexico.', 'They not are from Mexico.', 'c', 3, 'En la forma negativa de TO BE, NOT se agrega después del verbo, y con they el verbo sigue siendo are.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cómo llamas en inglés al hijo de tu tío?', 'Brother', 'Uncle', 'Cousin', 'Son', 'c', 1, 'El hijo de tu tío es tu primo, y primo o prima se dice Cousin.'),
      (v_semana_id, 'Hoy es lunes. ¿Cómo se escribe en inglés el día de mañana?', 'Wednesday', 'Sunday', 'Thursday', 'Tuesday', 'd', 2, 'Después del lunes viene el martes, que en inglés es Tuesday.'),
      (v_semana_id, 'Completa la frase «Mi color favorito es gris»: My favorite color is ___.', 'black', 'gray', 'green', 'brown', 'b', 3, 'En la lista de colores, Gray significa gris.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué artículos completan «___ hour» y «___ university», en ese orden?', 'an / a', 'a / an', 'an / an', 'a / a', 'a', 1, 'Se elige por el sonido, no por la letra: en hour la h es muda, y university suena «yu».'),
      (v_semana_id, 'Escribes «dos días» en inglés. ¿Cuál es la forma correcta?', 'two day', 'two daies', 'two dayes', 'two days', 'd', 2, 'Day termina en vocal + y, así que su plural conserva la y y solo agrega -S.'),
      (v_semana_id, '¿Qué oración usa bien el sustantivo money?', 'I need money.', 'I need a money.', 'I need an money.', 'I need moneys.', 'a', 3, 'Money es incontable, y los incontables no llevan artículo indefinido ni plural.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Completa con el verbo study: «Diego ___ English at night.»', 'studyes', 'study', 'studys', 'studies', 'd', 1, 'Diego equivale a he, y este verbo termina en consonante + y: la Y cambia por -IES.'),
      (v_semana_id, '¿Qué oración coloca bien el adverbio always?', 'She reads at night always.', 'Always she reads at night.', 'She always reads at night.', 'She reads always at night.', 'c', 2, 'Los adverbios de frecuencia van antes del verbo, así que always se coloca justo antes de reads.'),
      (v_semana_id, '¿Qué oración usa bien el verbo have para hablar de Marta?', 'Marta haves two dogs.', 'Marta has two dogs.', 'Marta have two dogs.', 'Marta is have two dogs.', 'b', 3, 'Have es irregular: con he, she o it cambia a has, y Marta equivale a she.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Convierte a negativa la oración «My brother studies English.»', 'My brother doesn''t study English.', 'My brother don''t study English.', 'My brother not study English.', 'My brother doesn''t studies English.', 'a', 1, 'My brother equivale a he, así que se usa does not, y con does el verbo regresa a su forma base.'),
      (v_semana_id, 'Quieres saber si tus amigos hablan inglés. ¿Qué pregunta es correcta?', 'Are they speak English?', 'Do they speaks English?', 'Does they speak English?', 'Do they speak English?', 'd', 2, 'La pregunta sigue el orden auxiliar + sujeto + verbo en forma base; con they el auxiliar es Do.'),
      (v_semana_id, '¿Cómo se pregunta en inglés «¿Cuándo come ella?»?', 'When does she eat?', 'When do she eat?', 'When does she eats?', 'Where does she eat?', 'a', 3, 'When pregunta por el momento; con she el auxiliar es does y el verbo queda en forma base.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Luis trabaja en un restaurante y lleva la comida a las mesas. ¿Cuál es su profesión en inglés?', 'Driver', 'Accountant', 'Waiter', 'Cook', 'c', 1, 'Quien atiende y lleva la comida a las mesas es el mesero: Waiter en masculino y Waitress en femenino.'),
      (v_semana_id, 'El reloj marca la 1:45. ¿Cómo se dice la hora en inglés?', 'It''s a quarter to one.', 'It''s a quarter past one.', 'It''s half past one.', 'It''s a quarter to two.', 'd', 2, 'A quarter to indica que falta un cuarto de hora para la hora siguiente: a la 1:45 le faltan 15 minutos para las 2.'),
      (v_semana_id, 'Completa: «I work ___ night and she works ___ the morning.»', 'in / at', 'at / in', 'at / at', 'in / in', 'b', 3, 'Night es la excepción y lleva AT; morning es una parte del día y lleva IN.');
  END IF;
END $$;

-- ----------- Inglés nivel 1 (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 1'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 1" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según la regla de plurales, ¿cómo se escribe el plural de bus?', 'buses', 'buss', 'bus', 'busies', 'a', 1, 'La palabra termina en -s, y las que tienen esa terminación forman el plural con -es.'),
      (v_semana_id, 'Convierte en pregunta la oración «She likes pizza.»', 'Does she like pizza?', 'Does she likes pizza?', 'Is she like pizza?', 'Do she like pizza?', 'a', 2, 'Con she se usa does, y con does el verbo regresa a su forma base, sin -s.'),
      (v_semana_id, '¿Cómo se dicen las 4:30 en inglés?', 'It''s half past five.', 'It''s a quarter to five.', 'It''s half past four.', 'It''s a quarter past four.', 'c', 3, 'Half past indica la hora y media: si half past three es 3:30, las 4:30 se dicen con four.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Lees esta oración: «She teaches math, but she is watching TV right now.» ¿Qué expresa cada verbo?', '«teaches» indica su profesión; «is watching», lo que hace en este momento', '«teaches» indica una acción ya terminada; «is watching», lo que hará mañana', '«teaches» indica un plan ya decidido; «is watching», un hábito de siempre', '«teaches» indica lo que hace en este momento; «is watching», su profesión', 'a', 1, 'El presente simple puede indicar una profesión, y el presente continuo, lo que está pasando en este momento.'),
      (v_semana_id, '¿Qué pareja sigue la misma regla de -ING que make → making?', 'write → writing', 'lie → lying', 'study → studying', 'sit → sitting', 'a', 2, 'Make y write terminan en -e muda, y esa e se quita antes de agregar -ING.'),
      (v_semana_id, '¿Qué forma completa «Listen! She ___ English.» según la palabra clave?', 'are speaking', 'is speak', 'speaks', 'is speaking', 'd', 3, 'Listen! es palabra clave del presente continuo, que con she se forma con is + verbo-ING.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Por qué study y play forman su pasado de manera distinta?', 'Antes de la y, study lleva vocal y play lleva consonante', 'Study es un verbo irregular y play es un verbo regular', 'Study es un verbo largo y play es un verbo de una sílaba', 'Antes de la y, study lleva consonante y play lleva vocal', 'd', 1, 'Con consonante + y se cambia la y por -IED (studied); con vocal + y solo se agrega -ED (played).'),
      (v_semana_id, 'Un compañero escribe «She didn''t danced yesterday.» ¿Qué debe corregir?', 'Dejar solo la -D, porque el verbo base termina en -e', 'Cambiar didn''t por wasn''t, porque la acción ya terminó', 'Quitar la -ED, porque didn''t pide el verbo base', 'Cambiar didn''t por doesn''t, porque el sujeto es she', 'c', 2, 'Con did o didn''t el verbo va en forma base, sin -ED: la oración correcta es She didn''t dance yesterday.'),
      (v_semana_id, '¿Cómo se dice en inglés «Ellos jugaron hace dos días»?', 'They played ago two days.', 'They play two days ago.', 'They played last two days.', 'They played two days ago.', 'd', 3, 'Ago significa hace y va después del tiempo; además, play forma su pasado con -ED.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Cuentas lo que hiciste ayer. ¿Qué oración tiene bien los dos verbos en pasado?', 'We comed home and ate breakfast.', 'We came home and ate breakfast.', 'We came home and eated breakfast.', 'We comed home and eated breakfast.', 'b', 1, 'Come y eat son irregulares: no llevan -ED y sus pasados son came y ate.'),
      (v_semana_id, '¿Cómo se completa «___ he at school? Yes, he ___.»?', 'Was / were', 'Was / was', 'Did / did', 'Were / was', 'b', 2, 'Con he se usa was tanto en la pregunta como en la respuesta corta.'),
      (v_semana_id, '¿Cuál es la forma negativa correcta de «They sent the letter»?', 'They weren''t send the letter.', 'They don''t sent the letter.', 'They didn''t sent the letter.', 'They didn''t send the letter.', 'd', 3, 'Después de didn''t el verbo regresa a su forma base: sent vuelve a ser send, como en el ejemplo de la carta.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Tu hermano no puede con la tarea y, en este instante, decides ayudarlo. ¿Qué le dices?', 'I''ll help you.', 'I help you.', 'I''m going to help you.', 'I helped you.', 'a', 1, 'Una decisión tomada en el momento es una decisión espontánea, y esas se expresan con will.'),
      (v_semana_id, '¿Qué distingue a «Look at those clouds! It''s going to rain» de «I think it will rain»?', 'La primera es una promesa; la segunda, un plan', 'La primera es una decisión espontánea; la segunda, un plan', 'La primera se apoya en evidencia; la segunda, no', 'La segunda se apoya en evidencia; la primera, no', 'c', 2, 'Going to sirve para predecir con evidencia, como las nubes que se ven; will, para predecir sin ella.'),
      (v_semana_id, '¿Qué oración negativa está bien escrita para un plan ya decidido?', 'She isn''t going to traveling next month.', 'She isn''t going to travel next month.', 'She won''t going to travel next month.', 'She doesn''t going to travel next month.', 'b', 3, 'Going to se niega con am/is/are + not, y después va el verbo en forma base.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un letrero del salón prohíbe comer adentro. ¿Qué oración expresa esa prohibición?', 'You mustn''t eat here.', 'You couldn''t eat here.', 'You must eat here.', 'You shouldn''t eat here.', 'a', 1, 'Must not, en su forma corta mustn''t, es el negativo de must que expresa prohibición.'),
      (v_semana_id, 'Un maestro le recomienda a una alumna estudiar más, sin imponerle una obligación. ¿Qué le dice?', 'You must study more.', 'You should study more.', 'You have to study more.', 'You can study more.', 'b', 2, 'Should expresa un consejo; por eso es la forma para recomendar algo sin obligar.'),
      (v_semana_id, '¿Qué oración respeta las reglas de los verbos modales?', 'He should going now.', 'He should goes now.', 'He should go now.', 'He shoulds go now.', 'c', 3, 'Un modal no lleva -S en tercera persona y siempre va seguido del verbo en forma base.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué grupo contiene solo verduras?', 'rice, bread, cheese', 'grape, strawberry, apple', 'onion, lettuce, carrot', 'beef, pork, fish', 'c', 1, 'Las tres palabras están en la lista de verduras: cebolla, lechuga y zanahoria.'),
      (v_semana_id, '¿Cómo dices en inglés «Ella lleva puesta una falda y una chamarra»?', 'She''s wearing a t-shirt and a jacket.', 'She''s wearing a skirt and a jacket.', 'She''s wearing a skirt and a coat.', 'She''s wearing a dress and a jacket.', 'b', 2, 'Skirt significa falda y jacket significa chamarra.'),
      (v_semana_id, 'Alguien te pregunta «What''s the weather like?» y afuera hace mucho viento. ¿Qué respondes?', 'It''s windy.', 'It''s cloudy.', 'It''s snowing.', 'It''s sunny.', 'a', 3, '«Hace viento» se dice con la palabra windy, y esa frase responde a la pregunta por el clima.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según el Texto 1, ¿qué afirmación sobre la rutina de Carlos es correcta?', 'He works at a small store in the afternoon.', 'He studies online for two hours in the afternoon.', 'He goes to bed at 6 PM after he plays video games.', 'He works at a small store at 7 AM every day.', 'a', 1, 'El texto dice que Carlos estudia en línea primero y que por la tarde trabaja en una tienda pequeña.'),
      (v_semana_id, 'Según el Texto 2, ¿por qué Maria y sus amigos se fueron de la playa?', 'Because they wanted to watch a movie.', 'Because Maria bought a coconut.', 'Because it started to rain.', 'Because they played volleyball.', 'c', 2, 'Aunque no querían irse, empezó a llover a las 4 PM y por eso volvieron a casa.'),
      (v_semana_id, 'Un compañero traduce cada palabra de un texto y pierde la idea. ¿Qué estrategia le recomiendas?', 'Responder las preguntas antes de leer el texto completo', 'Buscar el sentido general sin traducir palabra por palabra', 'Buscar cada palabra desconocida antes de seguir con el texto', 'Detenerse en cada palabra hasta memorizar su traducción', 'b', 3, 'La estrategia de la semana es no traducir palabra por palabra, sino captar la idea general del texto.');
  END IF;
END $$;

-- ----------- Inglés nivel 2 (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés nivel 2'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés nivel 2" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Completa con el pasado irregular: «Yesterday, she ___ some bread.»', 'buied', 'buyed', 'buy', 'bought', 'd', 1, 'Buy es irregular: no sigue la regla de -ED y su pasado se memoriza como bought.'),
      (v_semana_id, 'Le prometes a un amigo que lo vas a llamar más tarde. ¿Qué oración usas?', 'I was calling you later.', 'I called you later.', 'I call you later.', 'I''ll call you later.', 'd', 2, 'Will expresa promesas, y con I se contrae en I''ll.'),
      (v_semana_id, '¿Qué palabra del vocabulario del cuerpo significa «cuello»?', 'back', 'head', 'neck', 'chest', 'c', 3, 'En el vocabulario del cuerpo, neck significa cuello.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Por teléfono, Rosa y Mateo se oyen perfectamente, pero ella habla solo tsotsil y él solo español, así que no se entienden. ¿Qué elemento de la comunicación les está fallando?', 'El código', 'El canal', 'El mensaje', 'El contexto', 'a', 1, 'El código es el sistema de signos que deben compartir emisor y receptor. Aquí la voz sí llega, pero no usan el mismo idioma.'),
      (v_semana_id, '¿Cuál de estas situaciones es un ejemplo de lenguaje paralingüístico?', 'Un vendedor se acerca demasiado a su cliente', 'Una alumna asiente con la cabeza durante la clase', 'Una reportera redacta su nota desde el celular', 'Un locutor acelera la voz al narrar un gol', 'd', 2, 'Lo paralingüístico comunica con el tono, el volumen o la velocidad de la voz; acelerar al narrar cambia justo esa velocidad.'),
      (v_semana_id, 'Durante una llamada con mala señal, ¿qué frase cumple la función fática del lenguaje?', '¡Qué coraje me da esta señal!', '¿Bueno? ¿Sigues en la línea?', 'La señal falla en esta colonia.', '¡Cuelga y márcame en un rato!', 'b', 3, 'La función fática sirve para verificar que el canal funciona; preguntar si la otra persona sigue en la línea hace exactamente eso.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Dos textos hablan de la presa de una ciudad. El primero explica cómo funciona, sin opinar; el segundo defiende que debe ampliarse y da razones. ¿Cómo se clasifican, en ese orden?', 'Descriptivo y argumentativo', 'Expositivo y argumentativo', 'Expositivo y narrativo', 'Argumentativo y expositivo', 'b', 1, 'Se clasifican por su intención: explicar de forma objetiva es propio del primero y defender una postura con razones, del segundo.'),
      (v_semana_id, 'Un editorial abre con esta frase: «La ciudad debe prohibir los popotes de plástico». Después da datos y razones. ¿Qué parte de la estructura argumentativa es esa frase?', 'El contraargumento', 'El desenlace', 'La tesis', 'La conclusión', 'c', 2, 'La tesis es la postura que el autor defiende; abre el texto y las razones que siguen la respaldan.'),
      (v_semana_id, '¿Qué rasgo comparten un cuento y una biografía?', 'Detallan cómo es algo con adjetivos', 'Cuentan una secuencia de hechos', 'Explican un tema sin dar opiniones', 'Defienden una postura con razones', 'b', 3, 'Son ejemplos de texto narrativo, cuyo propósito es contar una historia o una serie de hechos, con inicio, desarrollo y desenlace.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Lee el párrafo: «El maíz es la base de la cocina mexicana. Con él se preparan tortillas y tamales. También se usa en atoles y pozoles. Hasta los sopes y los totopos se hacen con su masa». ¿Cuál es la idea principal?', 'Los sopes y los totopos se hacen con masa', 'Con maíz se preparan tortillas y tamales', 'Los atoles y los pozoles también llevan maíz', 'El maíz es la base de la cocina mexicana', 'd', 1, 'Es la oración que resume todo el párrafo; las demás solo dan ejemplos de ella y, si se quitan, el sentido general se conserva.'),
      (v_semana_id, 'Un texto afirma que cuidar el agua es urgente y agrega que una llave abierta desperdicia muchos litros. ¿Qué papel cumple el dato de la llave?', 'Es una deducción que el texto nunca afirma', 'Es una opinión crítica de quien lee el texto', 'Es la idea principal, porque aporta un dato', 'Es una idea secundaria que apoya a la principal', 'd', 2, 'Las ideas secundarias apoyan, ejemplifican o amplían la principal; sin ese dato se perdería un detalle, pero el mensaje central seguiría.'),
      (v_semana_id, 'Un cuento dice: «Valeria cerró el paraguas y se secó los zapatos al entrar a casa». Si concluyes que afuera llovía, ¿qué nivel de comprensión usas y por qué?', 'Inferencial: deduces lo que el texto no dice', 'Literal: lees un dato que el texto dice tal cual', 'Crítico: opinas si estás de acuerdo con la autora', 'Crítico: juzgas si la fuente es confiable', 'a', 3, 'Inferir es deducir lo que no está escrito pero se entiende; el texto nunca menciona la lluvia, aunque sus pistas la sugieren.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Las tres palabras de cada serie son agudas. ¿En qué serie están bien escritas, según la regla de la tilde?', 'jardín, papel, sofá', 'jardín, papél, sofá', 'jardin, papél, sofa', 'jardin, papel, sofá', 'a', 1, 'En las agudas, la tilde aparece solo si terminan en N, S o vocal; por eso la llevan las que terminan en N y en vocal, pero no la que termina en L.'),
      (v_semana_id, 'Una palabra tiene la fuerza de voz en la penúltima sílaba y termina en R. ¿Qué pasa con su tilde?', 'No la lleva, porque las graves solo la usan si acaban en vocal', 'La lleva, porque es grave y no termina en N, S o vocal', 'No la lleva, porque es grave y termina en consonante', 'La lleva, porque toda palabra terminada en consonante la necesita', 'b', 2, 'Con el acento en la penúltima sílaba la palabra es grave, y las graves llevan tilde cuando su terminación es distinta de N, S o vocal.'),
      (v_semana_id, '¿En qué oración están bien usadas «si» y «sí»?', 'Si terminas la tarea, te digo que si.', 'Sí terminas la tarea, te digo que sí.', 'Si terminas la tarea, te digo que sí.', 'Sí terminas la tarea, te digo que si.', 'c', 3, 'La tilde diacrítica distingue el si condicional, sin tilde, del sí de afirmación, con tilde; la condición va primero y la afirmación al final.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Compara estas oraciones: «Pedro, ven pronto» y «Pedro, mi primo, vino pronto». ¿Qué función cumple la coma en cada una, en ese orden?', 'Enumeración e inciso', 'Vocativo y enumeración', 'Inciso y vocativo', 'Vocativo e inciso', 'd', 1, 'En la primera se llama a alguien; en la segunda, las comas encierran un dato que aclara quién es Pedro.'),
      (v_semana_id, '¿Para qué sirve el punto y coma en «Cerró la tienda temprano; nadie entró en toda la tarde»?', 'Separa dos párrafos con ideas diferentes', 'Introduce una cita textual de otra persona', 'Anuncia una enumeración de varios elementos', 'Separa ideas relacionadas pero independientes', 'd', 2, 'Las dos partes se sostienen solas y tratan del mismo asunto, y ese es el uso que tiene este signo.'),
      (v_semana_id, 'Una alumna empieza su carta a la directora con «Estimada directora,». ¿Qué debe corregir en ese saludo?', 'Cambiar la coma por puntos suspensivos', 'Dejar la coma y escribir el saludo en mayúsculas', 'Cambiar la coma por dos puntos', 'Cambiar la coma por punto y coma', 'c', 3, 'En las cartas, el signo que va después del saludo son los dos puntos, como en el modelo de la semana.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un párrafo presenta su idea al inicio, la desarrolla y la cierra, sin salirse del tema, pero sus oraciones van sueltas, sin ningún conector. ¿Qué le falta?', 'Coherencia, porque sus ideas carecen de lógica', 'Oración temática, porque falta presentar la idea', 'Cohesión, porque sus oraciones no están conectadas', 'Oración de cierre, porque falta resumir lo dicho', 'c', 1, 'Sus ideas tienen lógica, pero la unión entre oraciones se logra con conectores temporales, causales, de contraste o de adición.'),
      (v_semana_id, '¿Qué serie reúne solamente conectores de adición?', 'además, también, incluso', 'asimismo, después, también', 'además, aunque, asimismo', 'también, ya que, incluso', 'a', 2, 'Estos conectores suman una idea a la anterior; los tres pertenecen al grupo de adición estudiado esta semana.'),
      (v_semana_id, 'Una alumna escribe: «El ajolote está en peligro. Su hábitat se ha contaminado. Otras especies compiten con él por alimento. Por eso, urge proteger sus canales». ¿Qué papel cumplen la segunda y la tercera oración?', 'Son temáticas: presentan la idea central', 'Son de desarrollo: explican la idea central', 'Rompen la coherencia: cambian de tema sin aviso', 'Son de cierre: resumen todo el párrafo', 'b', 3, 'Después de la oración que presenta el tema, estas dos explican por qué el ajolote está en peligro; la última es la que concluye.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Marco debe resumir un capítulo de 900 palabras. ¿Qué extensión cumple la regla del resumen?', '250 palabras', '450 palabras', '350 palabras', '150 palabras', 'a', 1, 'Un resumen mide entre 1/4 y 1/3 del original: de 900 palabras salen entre 225 y 300, y esta cifra queda dentro de ese rango.'),
      (v_semana_id, 'Paola escribió «Sin más por el momento, quedo de usted» antes de exponer el motivo de su carta formal. ¿Qué parte colocó fuera de lugar?', 'La firma, que va antes de la despedida', 'El saludo, que va antes del destinatario', 'La despedida, que va después del cuerpo', 'El destinatario, que va después del saludo', 'c', 2, 'Esa frase cierra la carta; se escribe al terminar la exposición del motivo, justo antes del nombre completo de quien firma.'),
      (v_semana_id, 'Karla redacta un ensayo breve para defender el uso de la bicicleta. Su introducción ya presenta el tema y su postura. ¿Qué debe contener la parte siguiente?', 'La reafirmación de su postura y el cierre', 'Una exposición del motivo de su trámite', 'De dos a tres argumentos con evidencia', 'Un resumen sin opiniones personales', 'c', 3, 'Tras la introducción viene el desarrollo, donde el ensayo breve sostiene la postura con razones respaldadas.');
  END IF;
END $$;

-- ----------- Lengua y comunicación I (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Lengua y comunicación I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Lengua y comunicación I" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un texto dice: «Cada año los huracanes golpean la costa del Golfo y dejan miles de familias sin casa. Por eso, el gobierno debe construir más refugios». ¿Qué tipo de texto es?', 'Argumentativo, porque busca convencer de actuar', 'Descriptivo, porque dice cómo es un huracán', 'Narrativo, porque cuenta hechos en orden', 'Expositivo, porque explica el tema sin opinar', 'a', 1, 'El argumentativo busca convencer; el texto no solo informa, sino que defiende que el gobierno debe actuar.'),
      (v_semana_id, '¿Por qué «ventana» va sin tilde?', 'Es grave y termina en consonante', 'Es esdrújula y termina en vocal', 'Es aguda y termina en vocal', 'Es grave y termina en vocal', 'd', 2, 'Su acento cae en la penúltima sílaba, y estas palabras llevan tilde solo cuando su terminación es distinta de N, S o vocal.'),
      (v_semana_id, 'En un ensayo breve, ¿en qué parte se presenta la tesis?', 'En la conclusión', 'En la introducción', 'En la oración de cierre', 'En el desarrollo', 'b', 3, 'La tesis es la postura de quien escribe y se presenta desde el inicio del ensayo; lo que sigue la sostiene y la cierra.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una familia quiere remodelar su cocina y separa el proyecto en presupuesto, compra de material, pintura e instalación de muebles. ¿Qué pilar del pensamiento computacional está aplicando?', 'Descomposición', 'Reconocimiento de patrones', 'Diseño de algoritmos', 'Abstracción', 'a', 1, 'La descomposición consiste en dividir un problema grande en partes más pequeñas y manejables, como esas cuatro tareas de la remodelación.'),
      (v_semana_id, 'La app de un camión muestra a la usuaria solo la parada, la ruta y la hora de llegada, sin datos del motor ni de la carrocería. ¿Qué pilar aplica esa pantalla y por qué?', 'Patrones, porque encuentra similitudes entre varios recorridos', 'Algoritmos, porque ordena los pasos de un recorrido completo', 'Descomposición, porque reparte el viaje en partes más pequeñas', 'Abstracción, porque deja lo importante y omite lo irrelevante', 'd', 2, 'Abstraer es enfocarse en lo importante e ignorar los detalles irrelevantes: la pantalla solo conserva lo que la usuaria necesita para su viaje.'),
      (v_semana_id, '¿Qué describe mejor al pensamiento computacional según el tema?', 'Habilidades mentales para resolver problemas de forma estructurada', 'Conocimientos de tecnología reservados para quienes programan', 'Reglas para memorizar los comandos de varios lenguajes de código', 'Técnicas de programación que solo se aplican con una computadora', 'a', 3, 'Es un conjunto de habilidades mentales para resolver problemas con estructura y eficiencia; se inspira en las computadoras, pero no necesitas una para usarlo.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un procedimiento de descuentos tiene pasos claros, en orden y siempre termina, pero con el mismo pedido da un total distinto cada vez que se ejecuta. ¿Qué característica de un buen algoritmo incumple?', 'Preciso', 'Ordenado', 'Definido', 'Finito', 'c', 1, 'Un algoritmo definido, ante las mismas entradas, siempre da el mismo resultado; aquí el mismo pedido produce totales diferentes.'),
      (v_semana_id, 'Al dibujar el diagrama de flujo de una taquilla, llega el paso «¿Quedan boletos disponibles?», que se contesta con sí o no. ¿Qué símbolo le corresponde?', 'Óvalo', 'Rombo', 'Paralelogramo', 'Rectángulo', 'b', 2, 'Ese símbolo representa una decisión con respuesta de sí o no, y la pregunta sobre los boletos divide el flujo en dos caminos.'),
      (v_semana_id, 'Un equipo describe su solución así: INICIO, LEER edad, SI edad > 17 ENTONCES ESCRIBIR «Adulto», FIN SI, FIN. ¿En qué forma de representación está escrito ese algoritmo?', 'Diagrama de flujo', 'Lenguaje natural', 'Lenguaje de programación', 'Pseudocódigo', 'd', 3, 'Ese texto combina palabras como LEER, SI y ESCRIBIR con frases humanas, y esa mezcla es lo que define al pseudocódigo.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué tipo de dato es "Hola Mundo"?', 'Entero (int)', 'Decimal (float)', 'Cadena de texto (string)', 'Booleano', 'c', 1, 'El texto entre comillas es una cadena (string). Los strings pueden contener letras, números, símbolos y espacios, y se manipulan con operaciones específicas como concatenación o búsqueda.'),
      (v_semana_id, 'Si total = 29 y grupo = 6, ¿cuánto vale total % grupo?', '23', '5', '4.83', '4', 'b', 2, 'El operador % devuelve el residuo de la división: 6 cabe en 29 hasta llegar a 24 y sobran 5.'),
      (v_semana_id, 'Si a = 4 y b = 3, ¿qué resultado da (a > 2) AND (b > 5)?', 'Falso, porque AND exige que las dos partes sean verdaderas', 'Verdadero, porque las dos comparaciones se cumplen con esos valores', 'Verdadero, porque AND exige que al menos una parte lo sea', 'Falso, porque AND invierte el valor de la primera comparación', 'a', 3, 'a > 2 se cumple, pero b > 5 no; con AND los dos valores deben ser verdaderos, así que el resultado es falso.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'SI pasos >= 10000 ENTONCES ESCRIBIR «Meta lograda» SINO SI pasos >= 5000 ENTONCES ESCRIBIR «Vas bien» SINO ESCRIBIR «Muévete más» FIN SI. Si pasos vale 7500, ¿qué escribe el programa?', 'Vas bien', 'Meta lograda', 'Meta lograda y Vas bien', 'Muévete más', 'a', 1, '7500 no cumple la primera condición, pero sí la del SINO SI, así que el programa ejecuta esa acción y salta las demás ramas.'),
      (v_semana_id, 'SI promedio >= 8 AND debe_materias == falso ENTONCES ESCRIBIR «Con beca» SINO ESCRIBIR «Sin beca» FIN SI. Una alumna tiene promedio 9 y debe_materias vale verdadero. ¿Qué escribe el programa y por qué?', 'Sin beca, porque el bloque SINO se ejecuta en todos los casos', 'Con beca, porque con AND basta con que se cumpla una condición', 'Sin beca, porque con AND deben cumplirse las dos condiciones', 'Con beca, porque el promedio se revisa antes que las materias', 'c', 2, 'El promedio cumple, pero debe_materias == falso no se cumple; la condición compuesta con AND queda sin cumplirse y se ejecuta la otra acción.'),
      (v_semana_id, 'En un condicional, ¿cuándo se ejecuta el bloque que va después de SINO?', 'Cuando el programa termina de leer los datos', 'Cuando la condición del SI resulta falsa', 'Cuando la condición del SI resulta verdadera', 'Siempre, después de ejecutar el bloque del SI', 'b', 3, 'El SINO indica qué hacer si la condición es falsa; por eso olvidarlo es un error común: el programa no tendría una acción para ese caso.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una bomba debe seguir llenando un tinaco hasta que el sensor indique que está lleno, y no se sabe cuántas repeticiones tomará. ¿Qué conviene usar en el programa?', 'Un ciclo MIENTRAS, porque el número de repeticiones es fijo', 'Un ciclo MIENTRAS, porque depende de una condición', 'Un ciclo PARA, porque el número de repeticiones es fijo', 'Un condicional SI, porque revisa la condición una sola vez', 'b', 1, 'No se sabe cuántas repeticiones tomará llenar el tinaco, y ese es el caso del MIENTRAS: repite de acuerdo con una condición.'),
      (v_semana_id, 'contador = 2; MIENTRAS contador <= 8 HACER ESCRIBIR contador; contador = contador + 2; FIN MIENTRAS. ¿Qué imprime este programa?', '4, 6, 8', '2, 4, 6', '2, 4, 6, 8, 10', '2, 4, 6, 8', 'd', 2, 'El ciclo repite mientras la condición sea verdadera: empieza en 2, sube de dos en dos y se detiene cuando contador ya rebasa 8.'),
      (v_semana_id, 'saldo = 100; MIENTRAS saldo > 0 HACER ESCRIBIR saldo; FIN MIENTRAS. ¿Qué ocurre al ejecutar este programa?', 'Escribe 100 una vez, porque la condición se revisa una sola vez', 'No escribe nada, porque la condición es falsa desde el inicio', 'Escribe del 100 al 1, porque el ciclo le resta solo a saldo', 'Se queda atrapado, porque saldo nunca cambia dentro del ciclo', 'd', 3, 'Nada modifica a saldo dentro del ciclo, así que la condición del MIENTRAS nunca se vuelve falsa: es un ciclo infinito.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En una hoja de cálculo aparece solo el número 18. ¿Qué hace falta para que se convierta en información?', 'Repetirlo en varias celdas de la misma columna de la hoja', 'Escribirlo entre comillas para guardarlo como un texto', 'Agregarle contexto y significado sobre lo que representa', 'Sumarlo con otros números aunque no se diga qué miden', 'c', 1, 'Un número suelto es un dato aislado; se vuelve información cuando está procesado y tiene contexto y significado.'),
      (v_semana_id, 'En las celdas A1 a A4 hay 14, 20, 11 y 15. ¿Qué valor da =PROMEDIO(A1:A4)?', '60', '11', '15', '20', 'c', 2, '=PROMEDIO calcula el promedio de los valores del rango: (14 + 20 + 11 + 15) / 4 = 15.'),
      (v_semana_id, 'Una preparatoria quiere mostrar cómo evolucionó su número de inscritos mes por mes durante dos años. ¿Qué gráfica comunica mejor esa tendencia?', 'Líneas', 'Dispersión', 'Circular (pastel)', 'Barras', 'a', 3, 'La gráfica de líneas sirve para mostrar tendencias en el tiempo, y eso es lo que se quiere ver con los inscritos mes por mes.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Google Translate traduce idiomas con mucha precisión, pero no recomienda música ni reconoce rostros. ¿Por qué se considera IA Estrecha?', 'Porque puede hacer cualquier tarea intelectual humana', 'Porque aprende sin necesidad de recibir ejemplos', 'Porque se especializa en una sola tarea', 'Porque supera a las personas en todos los aspectos', 'c', 1, 'La IA Estrecha, la que existe hoy, está especializada en una tarea; por eso ese traductor hace bien su función, pero no otras distintas.'),
      (v_semana_id, 'Una empresa quiere que su sistema distinga en fotos los mangos maduros de los verdes usando Machine Learning. ¿Cómo lo prepara?', 'Escribiéndole una regla específica para cada caso posible', 'Mostrándole muchos ejemplos para que halle los patrones solo', 'Copiando las decisiones de un empleado en tiempo real', 'Conectándolo a internet para que busque la definición', 'b', 2, 'En Machine Learning no se programan reglas una por una: la máquina recibe muchas fotos etiquetadas y encuentra por sí misma los patrones.'),
      (v_semana_id, 'Un sistema de becas se entrena con registros que favorecían a alumnos de una sola colonia y ahora repite esa preferencia. ¿Qué riesgo de la IA ilustra este caso?', 'Sesgo', 'Privacidad', 'Desinformación', 'Dependencia', 'a', 3, 'Si los datos de entrenamiento traen prejuicios, la IA los replica: eso es un sesgo, y aquí el sistema repite la preferencia de sus registros.');
  END IF;
END $$;

-- ----------- Pensamiento digital y programación básica (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Pensamiento digital y programación básica'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Pensamiento digital y programación básica" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un instructivo para armar un mueble indica los pasos en un orden determinado. ¿A qué pilar del pensamiento computacional corresponde?', 'Abstracción', 'Diseño de algoritmos', 'Descomposición', 'Reconocimiento de patrones', 'b', 1, 'Crear pasos ordenados para resolver algo es el diseño de algoritmos; una receta de cocina y este instructivo siguen la misma idea.'),
      (v_semana_id, 'Un programa guarda codigo = ''507''. ¿Qué tipo de dato tiene esa variable?', 'Entero (int)', 'Booleano (bool)', 'Decimal (float)', 'Texto (string)', 'd', 2, 'El valor va entre comillas, y lo que va entre comillas es texto aunque esté formado por dígitos, como ocurre con ''123''.'),
      (v_semana_id, 'Una empresa maneja conjuntos de datos tan grandes y complejos que necesita herramientas especiales para procesarlos. ¿Cómo se les llama?', 'Base de datos', 'Machine Learning', 'Hoja de cálculo', 'Big Data', 'd', 3, 'Ese término nombra a los conjuntos de datos cuyo tamaño y complejidad exigen herramientas especiales para procesarlos.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Hace 100 años se consideraba que las mujeres no debían estudiar y hoy eso ha cambiado. ¿Qué muestra este ejemplo sobre el género?', 'Que coincide siempre con la identidad de cada persona', 'Que se define por los órganos con los que cada quien nace', 'Que depende de los cromosomas que tiene cada persona', 'Que varía con el tiempo por ser una construcción social', 'd', 1, 'El género es una construcción social: los roles y expectativas varían entre culturas y cambian con el tiempo, como lo muestra el cambio de ideas sobre el estudio de las mujeres.'),
      (v_semana_id, 'Para su exposición, Mariana busca el concepto que describe hacia quién siente atracción una persona, y no cómo se percibe a sí misma. ¿Cuál es?', 'Identidad de género', 'Expresión de género', 'Sexo biológico', 'Orientación sexual', 'd', 2, 'La orientación sexual es la atracción emocional, romántica y/o sexual hacia otras personas; no describe la manera en que alguien se percibe.'),
      (v_semana_id, 'En un debate escolar, Luis quiere citar la norma mexicana que protege el derecho a la no discriminación. Según el tema, ¿cuál debe mencionar?', 'El Artículo 4° de la Constitución Mexicana', 'El Artículo 1° de la Constitución Mexicana', 'El Artículo 3° de la Constitución Mexicana', 'El Artículo 123 de la Constitución Mexicana', 'b', 3, 'El tema señala que la Constitución Mexicana protege la no discriminación en su primer artículo; nadie debería ser discriminado por su identidad u orientación.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En un esquema del aparato reproductor femenino, ¿qué estructura debe señalarse como el lugar donde ocurre la fecundación?', 'La superficie del ovario', 'El canal de la vagina', 'La trompa de Falopio', 'La cavidad del útero', 'c', 1, 'La fecundación, cuando un espermatozoide se une con un óvulo, ocurre en la trompa de Falopio, que conecta los ovarios con el útero.'),
      (v_semana_id, '¿Qué secuencia describe correctamente lo que ocurre con el óvulo a lo largo del ciclo menstrual?', 'Madura en la fase folicular y se libera en la ovulación', 'Madura en la fase lútea y se libera en la menstruación', 'Madura en la ovulación y se libera en la fase folicular', 'Madura en la menstruación y se libera en la fase lútea', 'a', 2, 'Durante la fase folicular un óvulo madura en el ovario; cerca del día 14, en la ovulación, ese óvulo se libera y comienza el periodo de mayor fertilidad.'),
      (v_semana_id, 'Un alumno confunde en qué órganos se producen y en cuáles maduran los espermatozoides. ¿Qué afirmación corrige la confusión?', 'Se producen en el epidídimo y maduran en los testículos', 'Se producen en los testículos y maduran en los conductos deferentes', 'Se producen en los testículos y maduran en el epidídimo', 'Se producen en la próstata y maduran en las vesículas seminales', 'c', 3, 'Los testículos producen los espermatozoides y estos maduran en el epidídimo; los conductos deferentes solo se encargan de transportarlos.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿En qué se distingue la pubertad de la adolescencia?', 'La pubertad ocurre en la infancia; la adolescencia inicia después de los cambios físicos', 'La adolescencia son cambios físicos; la pubertad es un periodo psicosocial más amplio', 'La pubertad son cambios físicos; la adolescencia es un periodo psicosocial más amplio', 'La pubertad es un periodo emocional; la adolescencia se limita a los cambios del cuerpo', 'c', 1, 'La pubertad es el periodo de cambios físicos que da capacidad reproductiva; la adolescencia es el periodo psicosocial más amplio que incluye esos cambios.'),
      (v_semana_id, 'Al revisar una lista de preocupaciones sobre la pubertad, ¿cuál situación amerita atención médica?', 'No tener ningún signo de pubertad después de los 14 años', 'Llevar un ritmo de cambios distinto al de sus amistades', 'Sentir confusión o incomodidad con los cambios del cuerpo', 'Que los cambios de la pubertad no ocurran al mismo tiempo', 'a', 2, 'Entre los casos que requieren atención médica, el tema incluye la ausencia de todo signo de pubertad después de los 14 años; ese retraso merece revisión.'),
      (v_semana_id, 'Al comparar los cambios físicos de la pubertad, ¿cuál es un cambio que el tema señala en los hombres y no en las mujeres?', 'Inicio de la menstruación', 'Ensanchamiento de hombros', 'Ensanchamiento de caderas', 'Desarrollo de senos', 'b', 3, 'El tema enumera en los hombres el ensanchamiento de hombros; los otros cambios mencionados en las opciones corresponden a las mujeres.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una pareja adulta ya usa implante subdérmico para evitar un embarazo. ¿Qué necesita para protegerse también de las ITS?', 'Usar condón, porque es el único tipo que protege de ITS', 'Agregar pastillas, porque refuerzan la protección contra ITS', 'Cambiar al DIU, porque también bloquea el paso de las ITS', 'Nada más, porque el implante ya previene también las ITS', 'a', 1, 'Los condones, masculino y femenino, son los únicos métodos que también protegen contra ITS; un método hormonal por sí solo no da esa protección.'),
      (v_semana_id, 'A un joven le diagnostican VIH. Según el tema, ¿qué es cierto sobre esta infección?', 'Se previene con una vacuna que ya existe', 'No tiene cura, pero existe tratamiento para controlarla', 'Se transmite solo por relaciones sexuales', 'Se cura con antibióticos si se detecta a tiempo', 'b', 2, 'Según el tema, el VIH no tiene cura pero sí tratamiento; se transmite también por sangre y de madre a hijo, y la vacuna existe para el VPH.'),
      (v_semana_id, 'Entre estos métodos no definitivos, ¿cuál tiene la mayor duración según los datos del tema?', 'El DIU, colocado en el útero', 'La pastilla de toma diaria', 'El implante, colocado en el brazo', 'La inyección de aplicación trimestral', 'a', 3, 'El DIU, colocado por un médico, dura de 5 a 10 años; es la mayor duración entre los métodos no definitivos que describe el tema.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según lo estudiado, ¿qué derecho establece el artículo 4° constitucional?', 'Decidir libremente cuántos hijos tener y con qué espaciamiento', 'Recibir educación obligatoria y laica en las escuelas', 'Regular los servicios públicos de planificación familiar en el país', 'Vivir sin discriminación por orientación o identidad de género', 'a', 1, 'El artículo 4° constitucional establece el derecho a decidir de manera libre y responsable el número y espaciamiento de los hijos.'),
      (v_semana_id, 'En una charla, un padre de familia afirma que un centro de salud no puede atender a adolescentes en salud sexual sin permiso de los padres. ¿Es correcto?', 'Sí, todo menor necesita permiso escrito de sus padres o tutores', 'No, aunque solo pueden recibir información, nunca atención médica directa', 'Sí, salvo que el DIF lo autorice mediante una solicitud previa', 'No, tienen derecho a esos servicios sin autorización de sus padres', 'd', 2, 'El tema señala que en México los adolescentes tienen derecho a recibir servicios de salud sexual sin que sus padres deban autorizarlo.'),
      (v_semana_id, 'Una clínica entrega a jóvenes folletos llenos de mitos y rumores sobre la sexualidad. ¿Qué derecho sexual deja de atender?', 'A decidir sobre su propio cuerpo', 'A la privacidad sexual', 'A la información sexual basada en ciencia', 'A la atención de salud sexual', 'c', 3, 'Entre los derechos sexuales está el de recibir información basada en ciencia; unos folletos de mitos y rumores no atienden ese derecho.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una persona le dice a su pareja: «Si sales con tus amigas, es que no me quieres». ¿Qué señales de relación tóxica combina esa frase?', 'Control económico y críticas constantes', 'Manipulación emocional y aislamiento', 'Humillación pública y violencia física', 'Amenazas y presión sexual', 'b', 1, 'La frase usa culpa y chantaje, que son manipulación emocional, y además busca alejar a la pareja de sus amistades, que es aislamiento.'),
      (v_semana_id, 'Una campaña escolar explica: «no basta con que no diga no; debe decir sí». ¿Qué característica del consentimiento ilustra?', 'Específico', 'Informado', 'Libre de presión', 'Entusiasta', 'd', 2, 'El consentimiento debe ser entusiasta: la ausencia de una negativa no alcanza, porque la persona tiene que expresar que sí quiere participar.'),
      (v_semana_id, 'En un grupo de redes sociales, varias personas acosan a un compañero con mensajes insistentes. ¿Qué tipo de violencia es, según el tema?', 'Violencia económica', 'Violencia física', 'Violencia digital', 'Violencia sexual', 'c', 3, 'El acoso en redes y la difusión de imágenes íntimas son las formas de violencia digital que distingue el tema.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En un grupo, la escuela entrega el examen con letra más grande a quien tiene baja visión, para que lo conteste en las mismas condiciones. ¿Qué principio aplica?', 'Equidad, porque da a cada quien lo que necesita', 'Equidad, porque a todos les da el mismo examen', 'Igualdad, porque todos reciben lo que necesitan', 'Igualdad, porque da a todos exactamente lo mismo', 'a', 1, 'Adaptar el examen a quien lo requiere es equidad: se atiende la necesidad de cada estudiante para que tenga las mismas oportunidades.'),
      (v_semana_id, '¿Qué daño atribuye el tema a la creencia de que los hombres no lloran?', 'Limita sus oportunidades académicas y laborales', 'Limita la expresión personal en la vida diaria', 'Presiona a ser el único proveedor del hogar', 'Reprime emociones y daña la salud mental', 'd', 2, 'El tema explica que este estereotipo lleva a reprimir las emociones, lo cual perjudica la salud mental de los hombres.'),
      (v_semana_id, 'Para su línea de tiempo, un equipo ubica la Ley General de Acceso de las Mujeres a una Vida Libre de Violencia. ¿En qué año la sitúa, según el tema?', '2006', '2007', '2019', '2011', 'b', 3, 'Según el tema, la Ley General de Acceso de las Mujeres a una Vida Libre de Violencia es de 2007; la de Igualdad es de 2006 y la reforma de paridad, de 2019.');
  END IF;
END $$;

-- ----------- Sexualidad y género (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Sexualidad y género'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Sexualidad y género" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué grupo reúne solo prácticas que la guía considera no confiables para evitar un embarazo?', 'Ritmo calendario, anillo hormonal y duchas vaginales', 'Ritmo calendario, coito interrumpido y duchas vaginales', 'Ritmo calendario, coito interrumpido e inyección mensual', 'Coito interrumpido, parche hormonal y duchas vaginales', 'b', 1, 'La guía señala estas tres prácticas como no confiables; los métodos hormonales y de barrera sí forman parte de los anticonceptivos estudiados.'),
      (v_semana_id, 'Según la guía, ¿qué significa que el consentimiento sea reversible?', 'Que aceptar una cosa no implica aceptar todo', 'Que debe darse sin presión, amenazas ni chantaje', 'Que las personas saben qué va a pasar', 'Que puede retirarse en cualquier momento', 'd', 2, 'La guía define el consentimiento como reversible porque se puede retirar en cualquier momento, aunque antes se haya aceptado.'),
      (v_semana_id, 'Según la guía, ¿qué diferencia hay entre identidad y expresión de género?', 'La identidad es cómo se muestra; la expresión, cómo se siente', 'La identidad es cómo se ve la persona; la expresión, el sexo con el que nace', 'La identidad es cómo se siente; la expresión, cómo se muestra', 'La identidad es la atracción hacia otras personas; la expresión, cómo se siente', 'c', 3, 'La guía distingue el concepto interno del externo: la identidad de género es lo que siente cada persona y la expresión es lo que deja ver a los demás.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿En qué se distingue el bachillerato virtual de la preparatoria presencial?', 'En el horario, porque hay sesiones fijas todos los días', 'En el contenido, porque se trata de otra preparatoria', 'En la validez, porque su certificado tiene menor nivel', 'En el formato, porque la validez oficial es la misma', 'd', 1, 'La semana lo define como la misma preparatoria, con la misma validez oficial; lo que cambia es que se cursa 100% en línea.'),
      (v_semana_id, 'Lorena lleva días atorada con una duda de su materia y no avanza. Según los retos de la semana, ¿qué le conviene hacer?', 'Aplicar técnicas para administrar mejor su tiempo', 'Apartar en casa un espacio dedicado al estudio', 'Crear una rutina diaria de estudio más larga', 'Usar los canales de comunicación con tutores', 'd', 2, 'Para el reto de las dudas sin resolver, la semana indica recurrir a los tutores por los medios de comunicación disponibles.'),
      (v_semana_id, 'Arturo trabaja en turnos que cambian cada semana y no puede comprometerse con un horario fijo de clases. ¿Qué ventaja del bachillerato virtual le ayuda más?', 'Mantener contacto con sus tutores', 'Decidir él mismo cuándo estudiar', 'Ahorrar el dinero de los traslados', 'Recibir material de apoyo cada semana', 'b', 3, 'La flexibilidad de horarios permite elegir el momento de estudiar, así que los turnos cambiantes de Arturo no le impiden avanzar.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'A Daniel le cuesta estar quieto en una sesión larga y solo entiende un tema cuando lo practica con un ejemplo concreto. ¿Qué estilo sugieren estas señales?', 'Lectura/Escritura', 'Visual', 'Kinestésico', 'Auditivo', 'c', 1, 'Costarle estar quieto, aprender haciendo y necesitar ejemplos concretos son señales que la semana asigna a este estilo.'),
      (v_semana_id, 'Fátima aprende mejor escuchando. ¿Qué estrategia le conviene para preparar un tema?', 'Hacer resúmenes y reescribir los conceptos con sus palabras', 'Resolver ejercicios prácticos con ejemplos de la vida real', 'Leer en voz alta y explicarle el tema a alguien más', 'Usar marcadores de colores y crear mapas conceptuales', 'c', 2, 'Quien tiene estilo auditivo aprende al oír los temas, ya sea en su propia voz o al contárselos a otra persona.'),
      (v_semana_id, '¿Qué plantea Howard Gardner con las inteligencias múltiples?', 'Que cada persona nace con un solo tipo y no puede tener otro', 'Que existen 4 tipos de inteligencia, uno por cada estilo VARK', 'Que la escuela tradicional ya evalúa los 8 tipos por igual', 'Que la inteligencia no es una sola cosa: hay al menos 8 tipos', 'd', 3, 'Gardner sostiene que se es inteligente de diferentes maneras: lingüística, musical, interpersonal y otras, hasta sumar al menos 8.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Antes de dormir, Sofía cierra sus apuntes de Historia y se hace preguntas sobre lo que acaba de leer para ver cuánto recuerda. ¿Qué técnica aplica?', 'Técnica Pomodoro', 'Técnica Feynman', 'Repetición espaciada', 'Recuerdo activo', 'd', 1, 'Esta técnica consiste en cerrar el material e intentar recordar lo leído, haciéndote preguntas en lugar de releer.'),
      (v_semana_id, 'Rodrigo acaba de terminar su cuarto bloque seguido de la técnica Pomodoro. ¿Qué descanso le corresponde ahora?', 'Uno largo, de 15 a 30 minutos', 'Uno de 10 minutos antes de otra ronda', 'Uno de una hora para recuperar energía', 'Uno corto, de 5 minutos como los anteriores', 'a', 2, 'Al completar cuatro pomodoros se hace una pausa mayor, de entre 15 y 30 minutos, para que el cerebro recupere la atención.'),
      (v_semana_id, 'Julián marca con color casi todos los renglones de su libro. ¿Por qué esa práctica no le ayuda a estudiar?', 'Porque le toma más tiempo que copiar sus apuntes', 'Porque si todo parece importante, nada resalta', 'Porque marcar con color solo sirve en libros de texto', 'Porque el color del marcador lo distrae de la lectura', 'b', 3, 'La semana la incluye entre las técnicas populares que no funcionan: si todo se señala como importante, se pierde la jerarquía.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Cada tarde, Renata pasa una hora viendo publicaciones en redes sociales, sin fecha ni relación con sus metas. Según la Matriz de Eisenhower, ¿qué le conviene hacer con esa actividad?', 'Planificar cuándo hacerla', 'Hacerla ya, antes de estudiar', 'Resolverla rápido y seguir', 'Eliminarla o reducir su tiempo', 'd', 1, 'Lo que no es importante ni urgente ocupa el último cuadrante de la matriz: se quita de la agenda o se le da mucho menos tiempo.'),
      (v_semana_id, '¿Qué anotación sigue la recomendación de la planificación semanal?', 'Martes de 6 a 7 PM: repasar Química', 'Química: repasar antes del fin de semana', 'Martes: Química en algún rato libre', 'Esta semana: Química cuando se pueda', 'a', 2, 'La planificación semanal pide asignar día y hora concretos a cada materia, no dejarlo a lo que vaya saliendo.'),
      (v_semana_id, 'Óscar lleva días sin abrir su materia. Decide sentarse solo un ratito, confiando en que, ya empezado, seguirá estudiando. ¿Qué recurso contra la procrastinación usa?', 'Regla de los 2 minutos', 'Técnica Pomodoro', 'Regla de los 5 minutos', 'Matriz de Eisenhower', 'c', 3, 'Este recurso pide comprometerse con muy poco tiempo de estudio, porque lo difícil es arrancar: una vez que empiezas, generalmente sigues.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Mariana estudia porque le interesa entender los temas y le da satisfacción aprender. ¿Qué motivación tiene y cómo la describe la semana?', 'Extrínseca, que suele ser más duradera', 'Intrínseca, que suele ser más duradera', 'Intrínseca, que solo sirve a corto plazo', 'Extrínseca, que solo sirve a corto plazo', 'b', 1, 'Estudiar por interés y satisfacción personal nace de uno mismo, y por eso la semana señala que se sostiene por más tiempo.'),
      (v_semana_id, 'Luis ya sabe que, al levantar los platos de la cena, le toca estudiar; al acabar, ve un capítulo de su serie. En ese hábito, ¿qué papel tiene levantar los platos?', 'Recompensa', 'Motivación', 'Señal', 'Rutina', 'c', 2, 'Es lo que dispara la acción: levantar los platos le avisa a Luis que ya es hora de sentarse a estudiar.'),
      (v_semana_id, 'Sebastián dice: «No soy bueno para Física». ¿Qué mentalidad refleja esa frase y a qué lleva, según la semana?', 'Fija, que lleva a seguir intentando', 'Fija, que lleva a rendirse', 'De crecimiento, que lleva a rendirse', 'De crecimiento, que lleva a seguir intentando', 'b', 3, 'Afirmar que no eres bueno, sin el «todavía», es la mentalidad que la semana asocia con darse por vencido.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según la semana, ¿qué ofrece Anki que lo hace excelente para memorizar?', 'Videos y ejercicios de matemáticas y ciencias', 'Práctica diaria de inglés con lecciones breves', 'Tarjetas de memoria con repetición espaciada', 'Tarjetas más visuales, con juegos para repasar', 'c', 1, 'Anki combina tarjetas de memoria (flashcards) con repetición espaciada, y por eso la semana lo recomienda para memorizar.'),
      (v_semana_id, 'Gerardo necesita una tutoría en vivo, por videollamada. ¿Qué herramienta de comunicación propone la semana para eso?', 'Canva o Google Slides', 'Google Meet o Zoom', 'Gmail o WhatsApp', 'Google Docs o Notion', 'b', 2, 'Para la comunicación, la semana reserva estas plataformas a las videollamadas cuando hace falta una tutoría.'),
      (v_semana_id, 'Mientras Emma estudia en la computadora, cada aviso de mensaje nuevo la saca del tema. ¿Qué medida atiende ese problema?', 'Bloquear las notificaciones mientras estudia', 'Llevar sus tareas en un tablero Kanban', 'Repasar con las tarjetas de Quizlet', 'Programar recordatorios en Google Calendar', 'a', 3, 'Entre los consejos para que la tecnología no distraiga está apagar los avisos durante la sesión de estudio.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Karen necesita Historia para terminar su bachillerato y escribe esta meta: «Voy a aprobar Historia con mínimo 8.0». ¿Qué le falta para que sea SMART?', 'Decir para cuándo la va a cumplir', 'Decir qué materia quiere aprobar', 'Decir cómo va a medir su resultado', 'Explicar por qué le importa la meta', 'a', 1, 'Toda meta SMART necesita plazo: la de Karen ya precisa qué quiere y con qué calificación, pero no responde «¿para cuándo?».'),
      (v_semana_id, 'Al revisar su proyecto académico, Rubén ve que anotó su meta y su horario, pero nada sobre qué podría impedirle avanzar y cómo lo resolvería. ¿Qué parte le falta?', 'Mi sistema de apoyo', 'Mis obstáculos posibles', 'Mi recompensa', 'Mi motivación', 'b', 2, 'Esa parte del proyecto pide anticipar lo que podría frenarte y dejar escrito cómo vas a enfrentarlo.'),
      (v_semana_id, 'Al terminar el bachillerato, Joel quiere tener ingresos propios mientras avanza en su formación profesional. ¿Qué opción de la semana describe su plan?', 'Combinar trabajar y estudiar', 'Emprender un negocio propio', 'Cursar una carrera técnica', 'Conseguir un empleo formal', 'a', 3, 'Entre las opciones posteriores al bachillerato, la semana incluye juntar empleo y estudios, que es justo lo que Joel plantea.');
  END IF;
END $$;

-- ----------- Tutoría de ingreso I (preparatoria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tutoría de ingreso I'
    AND m.nivel = 'preparatoria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tutoría de ingreso I" (preparatoria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En un bloque de Pomodoro, ¿cómo se reparte el tiempo?', '25 minutos de estudio y 5 de descanso', '30 minutos de estudio y 5 de descanso', '5 minutos de estudio y 25 de descanso', '25 minutos de estudio y 15 de descanso', 'a', 1, 'La guía recuerda que cada bloque alterna un periodo largo de concentración con una pausa breve.'),
      (v_semana_id, '¿Qué diferencia marca la guía entre la motivación extrínseca y la intrínseca?', 'Las dos funcionan a corto plazo, pero la extrínseca rinde mucho más', 'Las dos son duraderas, pero la intrínseca cuesta mucho más trabajo', 'La extrínseca funciona a corto plazo; la intrínseca es más duradera', 'La intrínseca funciona a corto plazo; la extrínseca es más duradera', 'c', 2, 'Según la guía, la motivación que viene de fuera sirve por poco tiempo, mientras que la que nace de ti se sostiene más.'),
      (v_semana_id, 'Diana escribe: «Voy a sacar mejores notas en Matemáticas». Tomando en cuenta el ejercicio de la guía, ¿por qué esa meta no es SMART?', 'Porque falta que sea específica y alcanzable', 'Porque falta que sea alcanzable y relevante', 'Porque falta que sea específica y relevante', 'Porque falta cómo se medirá y para cuándo', 'd', 3, 'Una meta SMART debe ser medible y tener plazo; la frase de Diana no da ninguno de esos dos datos.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Si el ADN es el manual de instrucciones del cuerpo, ¿en qué parte de la célula se guarda?', 'En los ribosomas', 'En las mitocondrias', 'En la membrana celular', 'En el núcleo', 'd', 1, 'El núcleo es el centro de control de la célula y contiene el ADN, el manual de instrucciones de todo el cuerpo.'),
      (v_semana_id, '¿Qué trabajo hacen las mitocondrias dentro de la célula?', 'Fabrican las proteínas del cuerpo', 'Convierten los nutrientes en energía', 'Controlan lo que entra y lo que sale', 'Guardan las instrucciones del ADN', 'b', 2, 'Las mitocondrias son las plantas de energía de la célula: convierten los nutrientes de la comida en energía que puede usar.'),
      (v_semana_id, '¿Cuál es el orden correcto de organización del cuerpo, de lo más simple a lo más complejo?', 'Células, tejidos, órganos, sistemas, organismo', 'Tejidos, células, órganos, sistemas, organismo', 'Células, órganos, tejidos, sistemas, organismo', 'Células, tejidos, sistemas, órganos, organismo', 'a', 3, 'Las células forman tejidos, los tejidos forman órganos, los órganos forman parte de sistemas y los sistemas integran al organismo.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué órgano aparece tanto en el sistema digestivo como en el sistema endocrino?', 'El páncreas', 'La tiroides', 'El hígado', 'El estómago', 'a', 1, 'El páncreas forma parte del sistema digestivo y también del endocrino, por eso aparece en la lista de órganos de los dos.'),
      (v_semana_id, '¿De qué dos maneras se comunican entre sí los sistemas del cuerpo?', 'Con oxígeno y con nutrientes', 'Con hormonas y con glóbulos blancos', 'Con señales eléctricas y con oxígeno', 'Con hormonas y señales eléctricas', 'd', 2, 'El sistema nervioso se comunica con señales eléctricas y el sistema endocrino, con hormonas que viajan en la sangre.'),
      (v_semana_id, '¿Qué sistema lleva el oxígeno y los nutrientes a todo el cuerpo?', 'El sistema digestivo', 'El sistema endocrino', 'El sistema circulatorio', 'El sistema respiratorio', 'c', 3, 'El sistema circulatorio transporta sangre, oxígeno y nutrientes a todo el cuerpo.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Dónde comienza la digestión de los alimentos?', 'En el estómago, al recibir el alimento', 'En la boca, al masticar el alimento', 'En el intestino delgado, al absorber', 'En el intestino grueso, al formar heces', 'b', 1, 'La digestión empieza en la boca: los dientes trituran el alimento y la saliva empieza a digerir los almidones.'),
      (v_semana_id, '¿Cuál es el trabajo del intestino grueso?', 'Mezcla el alimento con ácido', 'Produce la bilis para las grasas', 'Absorbe casi todos los nutrientes', 'Absorbe agua y forma las heces', 'd', 2, 'En el intestino grueso se absorbe el agua y se forman las heces, que después se eliminan por el recto y el ano.'),
      (v_semana_id, 'Mario toma poca agua y casi no come fibra. ¿Qué problema digestivo puede tener?', 'Diarrea', 'Estreñimiento', 'Gastritis', 'Acidez', 'b', 3, 'El estreñimiento se relaciona con tomar poco líquido o comer poca fibra, que es justo lo que le pasa a Mario.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué pasa con la energía que dan el azúcar y el refresco?', 'No aporta energía, solo regula procesos', 'Llega rápido, pero también baja rápido', 'Llega lento y se mantiene todo el día', 'Se guarda como reserva en los órganos', 'b', 1, 'El azúcar y el refresco son carbohidratos simples: dan energía rápida, pero esa energía también baja rápidamente.'),
      (v_semana_id, '¿Qué nutriente forma músculos, piel, enzimas y hormonas?', 'Las vitaminas', 'Los minerales', 'Los carbohidratos', 'Las proteínas', 'd', 2, 'Las proteínas construyen y reparan tejidos, y con ellas se forman músculos, piel, enzimas y hormonas.'),
      (v_semana_id, '¿En cuál de estos alimentos hay grasas saludables?', 'Frituras', 'Aguacate', 'Embutidos', 'Manteca', 'b', 3, 'Entre las grasas saludables de la semana están las del aguacate, las nueces, el aceite de oliva y el pescado.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué ocurre con los gases en los alvéolos?', 'El O₂ y el CO₂ salen juntos al aire', 'El O₂ y el CO₂ pasan juntos a la sangre', 'El O₂ pasa a la sangre y el CO₂ pasa al aire', 'El CO₂ pasa a la sangre y el O₂ pasa al aire', 'c', 1, 'En los alvéolos ocurre el intercambio gaseoso: el oxígeno entra a la sangre y el dióxido de carbono sale hacia el aire.'),
      (v_semana_id, '¿Qué enfermedad inflama y estrecha los bronquios y causa silbidos al respirar?', 'COVID-19', 'Neumonía', 'Asma', 'EPOC', 'c', 2, 'En el asma los bronquios se inflaman y se estrechan, lo que causa dificultad para respirar y silbidos.'),
      (v_semana_id, '¿Qué pasa cuando el diafragma sube?', 'Comprime y el aire sale', 'Comprime y el aire entra', 'Crea espacio y el aire entra', 'Crea espacio y el aire sale', 'a', 3, 'El diafragma es el músculo que hace posible la respiración: cuando sube, comprime y por eso el aire sale.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué hace el ventrículo izquierdo del corazón?', 'Bombea sangre a todo el cuerpo', 'Recibe sangre de los pulmones', 'Envía sangre a los pulmones', 'Recibe sangre de todo el cuerpo', 'a', 1, 'El ventrículo izquierdo, la cavidad más fuerte del corazón, bombea la sangre hacia todo el cuerpo.'),
      (v_semana_id, '¿Para qué tienen válvulas las venas?', 'Para filtrar desechos de la sangre', 'Para aumentar la fuerza del latido', 'Para evitar que la sangre retroceda', 'Para mezclar el oxígeno con la sangre', 'c', 2, 'Las venas llevan la sangre al corazón, y sus válvulas impiden que esa sangre regrese en sentido contrario.'),
      (v_semana_id, '¿Para qué sirve la circulación menor o pulmonar?', 'Para que la sangre deje desechos en los riñones', 'Para que la sangre recoja oxígeno en los pulmones', 'Para que la sangre reciba hormonas en las glándulas', 'Para que la sangre recoja nutrientes en el intestino', 'b', 3, 'En la circulación menor la sangre va del corazón a los pulmones y regresa al corazón ya oxigenada.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según la OMS, ¿qué es la salud?', 'Buena condición física y peso saludable', 'Ausencia total de enfermedades y de dolor', 'Resultados normales en las revisiones médicas', 'Completo bienestar físico, mental y social', 'd', 1, 'La OMS explica que la salud va más allá de no estar enfermo: es un estado de completo bienestar físico, mental y social.'),
      (v_semana_id, '¿Qué busca la prevención secundaria?', 'Detectar la enfermedad antes de que avance', 'Curar la enfermedad con rehabilitación', 'Controlar una enfermedad ya diagnosticada', 'Evitar que la enfermedad llegue a aparecer', 'a', 2, 'La prevención secundaria busca encontrar la enfermedad a tiempo, con revisiones y exámenes, antes de que avance.'),
      (v_semana_id, '¿Por qué a la hipertensión se le llama «el asesino silencioso»?', 'Porque solo da en la vejez', 'Porque se contagia fácil', 'Porque no tiene cura', 'Porque no duele', 'd', 3, 'La hipertensión no causa dolor, así que puede pasar sin notarse; por eso conviene revisar la presión periódicamente.');
  END IF;
END $$;

-- ----------- Ciencias Naturales I (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales I" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué parte de la célula fabrica las proteínas?', 'Las mitocondrias', 'La membrana', 'Los ribosomas', 'El núcleo', 'c', 1, 'Como repasaste en la semana 1, los ribosomas son la parte de la célula que fabrica las proteínas.'),
      (v_semana_id, '¿Para qué produce bilis el hígado?', 'Para digerir las grasas', 'Para absorber el agua', 'Para formar las heces', 'Para deshacer las proteínas', 'a', 2, 'Como repasaste en la semana 3, el hígado produce bilis, y esa bilis sirve para digerir las grasas.'),
      (v_semana_id, 'Una persona sana se pone una vacuna. ¿Qué busca con esa acción?', 'Controlar una enfermedad ya diagnosticada', 'Detectar la enfermedad a tiempo', 'Evitar que la enfermedad aparezca', 'Curar una enfermedad que ya tiene', 'c', 3, 'La vacuna es prevención primaria: se aplica a una persona sana para evitar que la enfermedad aparezca.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Dos especies de aves de un bosque buscan las mismas semillas para alimentarse. ¿Qué interacción hay entre ellas?', 'Mutualismo', 'Competencia', 'Comensalismo', 'Parasitismo', 'b', 1, 'Hay competencia cuando dos especies compiten por el mismo recurso; en este caso, las semillas.'),
      (v_semana_id, '¿Por qué se dice que las plantas y las algas son la base de todo en un ecosistema?', 'Porque descomponen la materia muerta del suelo', 'Porque obtienen su energía de otros seres vivos', 'Porque convierten la energía solar en alimento', 'Porque determinan qué puede vivir en cada lugar', 'c', 2, 'Las plantas y las algas son los productores: con la fotosíntesis convierten la energía solar en alimento.'),
      (v_semana_id, 'El bosque cercano a un pueblo ayuda a polinizar sus cultivos y a mantener limpia el agua. ¿Cómo se llaman estos beneficios?', 'Interacciones mutualistas', 'Componentes bióticos', 'Componentes abióticos', 'Servicios ecosistémicos', 'd', 3, 'Lo que los ecosistemas nos dan, como agua limpia o polinización de cultivos, se conoce como servicios ecosistémicos.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una bióloga encuentra una especie que vive en México y en ningún otro lugar del mundo. ¿Cómo se le llama?', 'Especie protegida', 'Especie silvestre', 'Especie invasora', 'Especie endémica', 'd', 1, 'Las especies que solo existen en México, y en ningún otro lugar del mundo, son endémicas.'),
      (v_semana_id, '¿Qué rasgo de la ubicación de México ayuda a explicar su enorme biodiversidad?', 'Está aislado de todas las regiones biogeográficas vecinas', 'Se ubica dentro de una sola región biogeográfica', 'Está en el encuentro de dos regiones biogeográficas', 'Tiene un clima igual en todo su territorio', 'c', 2, 'México está ubicado donde se encuentran las regiones Neártica y Neotropical, una de las razones de su biodiversidad.'),
      (v_semana_id, 'De las amenazas a la biodiversidad, ¿cuál es la principal causa en México?', 'Urbanización', 'Deforestación', 'Contaminación', 'Especies invasoras', 'b', 3, 'Entre las amenazas estudiadas, la deforestación se señala como la principal causa en México.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En un pastizal, los productores tienen 5,000 unidades de energía. ¿Cuántas pasan aproximadamente a los herbívoros que los comen?', '4,500 unidades', '50 unidades', '1,000 unidades', '500 unidades', 'd', 1, 'Solo el 10% de la energía pasa de un nivel al siguiente, y el 10% de 5,000 es 500.'),
      (v_semana_id, 'En la cadena Hierba → Saltamontes → Lagartija → Halcón, ¿qué nivel trófico ocupa la lagartija?', 'Descomponedor', 'Consumidor secundario', 'Consumidor primario', 'Consumidor terciario', 'b', 2, 'La lagartija come saltamontes, que son herbívoros, y quien come herbívoros es consumidor secundario.'),
      (v_semana_id, 'Al reintroducir los lobos en Yellowstone, los ciervos dejaron de pastar en las riberas y regresaron castores, peces y aves. ¿Qué ejemplifican esos lobos?', 'Una especie clave', 'Una especie endémica', 'Una especie invasora', 'Una especie productora', 'a', 3, 'Una especie clave tiene un impacto desproporcionado en su ecosistema, como muestran los lobos de Yellowstone.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un campo de cultivo recibió pesticidas y un derrame de petróleo, y ahora la tierra ya no produce. ¿Qué tipo de contaminación sufrió?', 'Contaminación por residuos sólidos', 'Contaminación del aire', 'Contaminación del suelo', 'Contaminación del agua', 'c', 1, 'Los pesticidas y los derrames de petróleo contaminan el suelo, y uno de sus efectos es la tierra infértil.'),
      (v_semana_id, '¿Qué es la eutrofización?', 'La lluvia ácida que cae sobre ríos, lagos y suelos', 'La formación de islas de plástico en los océanos', 'La acumulación de smog sobre una ciudad o una región', 'La proliferación de algas que asfixia el ecosistema', 'd', 2, 'Es un efecto de la contaminación del agua: las algas proliferan y asfixian el ecosistema.'),
      (v_semana_id, '¿Por qué el plástico es uno de los problemas más graves entre los residuos sólidos?', 'Tarda entre 4 y 10 años en degradarse', 'Tarda entre 400 y 1000 años en degradarse', 'Tarda entre 40 y 100 años en degradarse', 'Se degrada en pocos días, pero se genera mucho', 'b', 3, 'El plástico tarda siglos en degradarse: entre 400 y 1000 años, según lo estudiado.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En el efecto invernadero natural, ¿qué hace la atmósfera?', 'Deja pasar la luz solar y retiene parte del calor', 'Deja pasar la luz solar y produce su propio calor', 'Refleja parte de la luz solar y no retiene calor', 'Deja pasar el calor y bloquea parte de la luz solar', 'a', 1, 'La atmósfera actúa como una cobija: deja entrar la luz del Sol y conserva parte del calor, y así la Tierra es habitable.'),
      (v_semana_id, '¿Qué actividad humana ha elevado la concentración de CO₂ en la atmósfera desde la Revolución Industrial?', 'El riego de los cultivos', 'La quema de combustibles fósiles', 'La construcción de presas', 'El uso de abonos naturales', 'b', 2, 'Desde 1750 se han quemado enormes cantidades de carbón, petróleo y gas, y eso aumentó el CO₂ en la atmósfera.'),
      (v_semana_id, '¿Qué consecuencia directa tiene el derretimiento de glaciares y casquetes polares?', 'Se enfrían los océanos', 'Baja el nivel del mar', 'Aumenta el nivel del mar', 'Disminuyen los huracanes intensos', 'c', 3, 'El derretimiento de glaciares y casquetes polares provoca un aumento del nivel del mar.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué condición debe cumplirse para que un recurso renovable se siga regenerando?', 'Que se deje de usar por completo durante un siglo', 'Que se guarde en depósitos cerrados para que nadie lo use', 'Que se explote lo más rápido posible mientras haya demanda', 'Que no se explote más rápido de lo que se recupera', 'd', 1, 'Un recurso renovable se regenera por sí solo siempre que su explotación no sea más rápida que su recuperación.'),
      (v_semana_id, '¿Qué tipo de recurso natural aprovecha México gracias a sus más de 11,000 km de litoral?', 'Ríos como el Grijalva y el Bravo', 'Peces como el atún y la sardina', 'Minerales como la plata y el cobre', 'Bosques y selvas de las montañas', 'b', 2, 'El largo litoral de México le da recursos pesqueros enormes, como el atún, la sardina y el camarón.'),
      (v_semana_id, 'Una cooperativa solo tala los árboles que el bosque puede reponer, para que sus nietos también tengan madera. ¿Qué idea aplica?', 'La extracción no renovable', 'El crecimiento sin límites', 'La explotación intensiva', 'El desarrollo sustentable', 'd', 3, 'Explotar los recursos sin destruirlos para las generaciones futuras es la esencia del desarrollo sustentable.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un tinaco lleno de agua está en la azotea de una casa, sin que el agua se mueva. ¿Qué tipo de energía tiene esa agua?', 'Energía potencial', 'Energía térmica', 'Energía radiante', 'Energía cinética', 'a', 1, 'El agua en alto tiene energía almacenada, igual que una roca en lo alto de un cerro o el agua en una presa.'),
      (v_semana_id, 'Un municipio abre clínicas y escuelas para que todas las familias tengan las mismas oportunidades. ¿Qué pilar del desarrollo sustentable fortalece?', 'Ambiental', 'Tecnológico', 'Social', 'Económico', 'c', 2, 'El pilar social incluye equidad, justicia, salud y educación, justo lo que atiende ese municipio.'),
      (v_semana_id, 'Una central produce electricidad con el calor del interior de la Tierra. ¿De qué fuente de energía se trata?', 'Geotérmica', 'Eólica', 'Hidroeléctrica', 'Biomasa', 'a', 3, 'La energía geotérmica aprovecha el calor del interior de la Tierra y es una fuente renovable.');
  END IF;
END $$;

-- ----------- Ciencias Naturales II (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Naturales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Naturales II" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un colibrí toma néctar de una flor y, al hacerlo, la poliniza. ¿Qué interacción hay entre ellos?', 'Competencia', 'Comensalismo', 'Mutualismo', 'Parasitismo', 'c', 1, 'Los dos se benefician: el colibrí se alimenta y la flor queda polinizada. Eso es mutualismo.'),
      (v_semana_id, 'Un alumno escribió la cadena Ratón → Maíz → Víbora → Halcón. ¿Qué error cometió?', 'Debió empezar con el productor', 'Debió poner al herbívoro al final', 'Debió empezar con el depredador tope', 'Debió terminar con el productor', 'a', 2, 'Toda cadena alimentaria empieza con los productores; aquí, el maíz debía ir antes que el ratón.'),
      (v_semana_id, '¿Cuáles son los tres pilares del desarrollo sustentable?', 'Económico, social y ambiental', 'Social, ambiental y tecnológico', 'Económico, social y político', 'Energético, económico y ambiental', 'a', 3, 'El desarrollo sustentable se apoya en tres pilares: el económico, el social y el ambiental.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué unía a culturas tan distintas como las de Mesoamérica?', 'Rasgos compartidos como el maíz y el calendario ritual', 'Una frontera que las separaba de los demás países', 'Una lengua común que hablaban en toda la región', 'Un solo gobierno que mandaba sobre todos sus pueblos y ciudades', 'a', 1, 'Mesoamérica es una región cultural: sus pueblos eran distintos, pero compartían rasgos como la agricultura del maíz, el calendario ritual y el juego de pelota.'),
      (v_semana_id, '¿Por qué se consideran tan importantes los olmecas en Mesoamérica?', 'Conquistaron a todos los pueblos de la región', 'Construyeron la ciudad más grande de toda América en su época', 'Fundaron las ciudades de Palenque, Uxmal y Tikal', 'Influyeron en casi todas las culturas posteriores', 'd', 2, 'Los olmecas, la cultura madre, fueron la primera gran civilización mesoamericana y dejaron su huella en casi todas las culturas que vinieron después.'),
      (v_semana_id, '¿Qué lograban los mayas gracias a su astronomía precisa?', 'Predecir eclipses y los movimientos de Venus', 'Medir la altura exacta de sus pirámides', 'Trazar rutas seguras para navegar por el Golfo', 'Anticipar los sismos y las erupciones de volcanes', 'a', 3, 'Los mayas observaban el cielo con tanta exactitud que podían anunciar eclipses y seguir el recorrido de Venus.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según la leyenda, ¿qué señal vieron los mexicas en la isla del lago Texcoco?', 'Un águila volando sobre un cerro con una flor en el pico', 'Un águila parada sobre un nopal devorando una serpiente', 'Una serpiente enroscada en un nopal junto a un águila', 'Un jaguar bebiendo agua en la orilla de un lago tranquilo', 'b', 1, 'Según la leyenda, esa fue la señal que los mexicas buscaban, y la vieron en la isla del lago Texcoco donde se asentaron.'),
      (v_semana_id, '¿A qué grupo de la sociedad mexica pertenecía un sacerdote?', 'Tlatoani', 'Pipiltin', 'Esclavos', 'Macehuales', 'b', 2, 'En la organización social mexica, la nobleza y los sacerdotes formaban el mismo grupo: los pipiltin.'),
      (v_semana_id, '¿Qué característica tenía el sistema educativo de los mexicas?', 'Era voluntario y cada familia lo pagaba', 'Era solo para quienes serían guerreros', 'Era obligatorio para todos los jóvenes', 'Era solo para los hijos de los nobles', 'c', 3, 'La educación mexica era obligatoria y universal: los jóvenes nobles iban al Calmécac y los del pueblo, al Telpochcalli.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Por qué pueblos como los tlaxcaltecas y los totonacas se aliaron con Cortés?', 'Para obtener caballos y armas de fuego de los españoles', 'Para destruir a su enemigo común, los mexicas', 'Para convertirse al cristianismo antes de la guerra', 'Para repartirse el oro de Tenochtitlán con los españoles', 'b', 1, 'Estos pueblos se unieron a Cortés contra quienes los dominaban. Sin esas alianzas, los 500 españoles jamás habrían vencido.'),
      (v_semana_id, '¿Qué le permitió a la Malinche ser intérprete de Cortés?', 'Hablaba maya y estudió en Extremadura', 'Hablaba español y náhuatl desde su infancia', 'Hablaba náhuatl y maya, y aprendió español', 'Hablaba solo náhuatl y usaba señas', 'c', 2, 'Malintzin conocía las lenguas de la región y aprendió rápido la de los españoles; por eso fue intérprete y consejera de Cortés.'),
      (v_semana_id, '¿Qué hizo Cortés después de la Noche Triste?', 'Firmó la paz con los mexicas y se quedó en Veracruz', 'Se rindió ante Cuauhtémoc en la ciudad', 'Volvió a Cuba y renunció a la conquista', 'Regresó con más aliados y sitió Tenochtitlán', 'd', 3, 'Tras ser expulsado, Cortés volvió con más aliados; el sitio dejó a la ciudad sin agua ni comida hasta que cayó.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué causaba la frustración de los criollos en la Nueva España?', 'Trabajar por la fuerza en las minas', 'Ser traídos de África como esclavos', 'Tener riqueza, pero no poder político', 'Tener poder político, pero no riqueza', 'c', 1, 'Los criollos, hijos de españoles nacidos en América, eran ricos, pero los cargos más altos eran solo para los peninsulares.'),
      (v_semana_id, 'En la encomienda, ¿qué recibía un español?', 'Tierras para cultivar, a cambio de pagar impuestos', 'Indígenas para trabajar, a cambio de evangelizarlos', 'Plata de las minas, a cambio de construir sus conventos', 'Africanos para evangelizar, a cambio de liberarlos', 'b', 2, 'La encomienda entregaba indígenas a un español para que trabajaran a cambio de evangelizarlos; en la práctica fue esclavitud.'),
      (v_semana_id, '¿Por qué se recuerda a fray Bartolomé de las Casas?', 'Porque dirigió las minas de Zacatecas', 'Porque defendió los derechos de los indígenas', 'Porque gobernó la Nueva España desde la capital', 'Porque trajo esclavos desde África', 'b', 3, 'En la evangelización, la Iglesia Católica tuvo un papel enorme, y frailes como él salieron en defensa de los pueblos originarios.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según lo que estudiaste, ¿cómo se explica el inicio de la Independencia de México?', 'Solo por la pobreza de los campesinos', 'Solo por la invasión de Napoleón a España', 'Solo por la decisión de Hidalgo de actuar', 'Por décadas de descontento acumulado', 'd', 1, 'La Independencia no llegó de golpe: varias causas se sumaron durante décadas hasta que el descontento explotó en 1810.'),
      (v_semana_id, '¿Cuál de estos personajes participó en la conspiración de Querétaro?', 'Napoleón Bonaparte', 'Carlos IV', 'Montesquieu', 'Ignacio Allende', 'd', 2, 'Un grupo de criollos ideó la conspiración en Querétaro; entre ellos estaban el corregidor Miguel Domínguez, Josefa Ortiz de Domínguez y el capitán Allende.'),
      (v_semana_id, '¿A qué llamó Hidalgo en su discurso conocido como el Grito de Dolores?', 'A esperar en paz las órdenes de Querétaro', 'A defender a los peninsulares', 'A levantarse contra el mal gobierno', 'A obedecer sin dudar a Carlos IV', 'c', 3, 'Aunque el discurso no fue exactamente como lo conocemos hoy, su mensaje fue un llamado contra el mal gobierno, y miles de personas siguieron a Hidalgo.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué hizo Hidalgo al llegar a las puertas de la Ciudad de México?', 'Entró con su ejército y tomó la capital', 'Retrocedió sin entrar a la capital', 'Sitió la capital durante varios meses', 'Firmó la paz con los realistas y se retiró', 'b', 1, 'El ejército insurgente llegó hasta las puertas de la capital, pero Hidalgo dio marcha atrás; hasta hoy se debate por qué.'),
      (v_semana_id, '¿Cómo se llama el primer documento constitucional mexicano?', 'La Constitución de Apatzingán', 'El Plan de Iguala', 'La Declaración de Dolores', 'La Constitución de Chilpancingo', 'a', 2, 'En la etapa de Morelos se redactó, en 1814, el primer documento constitucional de México, que lleva el nombre de Apatzingán.'),
      (v_semana_id, '¿Cuál de estas propuestas formaba parte del Plan de Iguala?', 'La libertad para practicar cualquier religión', 'La separación por castas', 'La religión católica como única', 'Un gobierno solo de criollos', 'c', 3, 'El Plan de Iguala proponía tres puntos: independencia de México, religión católica como única y unión de todos los mexicanos.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿A qué región de México pertenecen Guanajuato, Querétaro, Jalisco y Michoacán?', 'Centro', 'Norte', 'Bajío', 'Golfo', 'c', 1, 'Esos cuatro estados forman el Bajío, una región de tierra fértil, industria y agricultura.'),
      (v_semana_id, '¿Con qué países colinda México en el sur?', 'Guatemala y Honduras', 'Belice y El Salvador', 'Honduras y El Salvador', 'Guatemala y Belice', 'd', 2, 'Las fronteras del sur de México son con Guatemala y Belice; al norte colinda con Estados Unidos.'),
      (v_semana_id, 'Según lo que estudiaste, ¿qué representa el color verde de la bandera de México?', 'La esperanza', 'La unidad', 'La sangre de los héroes', 'La leyenda de Tenochtitlán', 'a', 3, 'En la bandera, cada color tiene un significado, y el verde es el de la esperanza.');
  END IF;
END $$;

-- ----------- Ciencias Sociales I (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales I" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál es la diferencia entre los dos calendarios de los mayas?', 'El solar tenía 365 días y el ritual, 260', 'El solar tenía 365 días y el ritual, 300', 'Los dos tenían 365 días, con distinto nombre', 'El solar tenía 260 días y el ritual, 365', 'a', 1, 'Los mayas usaban dos calendarios: uno solar, de 365 días, y otro ritual, de 260.'),
      (v_semana_id, '¿Quién fue el último tlatoani, capturado al caer Tenochtitlán?', 'Ahuízotl', 'Moctezuma II', 'Itzcóatl', 'Cuauhtémoc', 'd', 2, 'Cuando Tenochtitlán cayó, el 13 de agosto de 1521, fue capturado Cuauhtémoc, el último tlatoani.'),
      (v_semana_id, '¿Quiénes se aliaron en 1821 para consumar la Independencia?', 'Iturbide y Guerrero', 'Morelos y Guerrero', 'Hidalgo y Josefa Ortiz', 'Allende e Hidalgo', 'a', 3, 'Iturbide, que era militar realista, se alió con Guerrero en 1821, y así se consumó la Independencia.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué relación transformó principalmente La Reforma?', 'La de los hacendados con los peones del campo', 'La de los presidentes de México con el ejército', 'La del gobierno de México con el de Francia', 'La del Estado mexicano con la Iglesia Católica', 'd', 1, 'La Reforma fue un conjunto de leyes e ideas que cambiaron el vínculo entre el Estado y la Iglesia, y que modernizaron las instituciones del país.'),
      (v_semana_id, 'Hacia 1856, la Iglesia tenía terrenos que no usaba para el culto. ¿Qué ley la obligó a venderlos?', 'La Ley Lerdo', 'La Constitución de 1857', 'La ley del Registro Civil', 'La Ley Juárez', 'a', 2, 'La Ley Lerdo de 1856 obligó a la Iglesia, entonces el mayor terrateniente del país, a vender las propiedades que no usaba directamente para el culto.'),
      (v_semana_id, '¿Qué grupos se enfrentaron en la Guerra de Reforma?', 'Los juaristas y los porfiristas', 'Los republicanos y los franceses', 'Los conservadores y los liberales', 'Los liberales y las tropas de Maximiliano', 'c', 3, 'Unos querían mantener el poder de la Iglesia y los otros apoyaban las reformas. Se enfrentaron armados y el triunfo fue para el bando liberal.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cómo llegó Porfirio Díaz al poder en 1876?', 'Por la fuerza, con el Plan de Tuxtepec', 'Por elección, con apoyo de Juárez', 'Por acuerdo del Congreso, al morir Juárez', 'Por la fuerza, con el Plan de San Luis', 'a', 1, 'Díaz, militar oaxaqueño, tomó el poder en 1876 con un levantamiento apoyado en el Plan de Tuxtepec y gobernó casi sin interrupción hasta 1911.'),
      (v_semana_id, '¿A qué grupo llegaron los beneficios de la modernización del Porfiriato?', 'A la élite criolla y extranjera', 'A los campesinos con ejidos', 'A los peones de las haciendas', 'A las comunidades indígenas', 'a', 2, 'La modernización tuvo un costo social: hubo exclusión, porque sus beneficios se quedaron en la élite criolla y extranjera.'),
      (v_semana_id, '¿Cómo eran las elecciones durante el Porfiriato?', 'Periódicas, con alternancia', 'Limpias, con un árbitro autónomo', 'Libres, pero solo en las ciudades', 'Una farsa, sin democracia real', 'd', 3, 'Aunque hubo estabilidad política, el régimen fue autoritario: votar no decidía quién gobernaba, y por eso no había democracia real.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Con qué plan llamó Francisco I. Madero a la rebelión en 1910?', 'El Plan de Ayala', 'El Plan de San Luis', 'El Plan de Tuxtepec', 'El Plan de Guadalupe', 'b', 1, 'Madero, hacendado del norte, convocó a la rebelión con el Plan de San Luis y su llamado: «Sufragio efectivo, no reelección».'),
      (v_semana_id, '¿Qué buscaba Emiliano Zapata con su lucha en Morelos?', 'Terminar con la reelección del presidente', 'Devolver las tierras a los campesinos', 'Crear un ejército en el norte', 'Separar al Estado y la Iglesia', 'b', 2, 'Zapata, líder agrario del sur, tuvo como lema «Tierra y Libertad» y, con el Plan de Ayala, luchó para que los campesinos recuperaran sus tierras.'),
      (v_semana_id, 'Una obrera reclama su derecho a huelga. ¿Qué artículo de la Constitución de 1917 lo reconoce?', 'El Artículo 24', 'El Artículo 3.º', 'El Artículo 27', 'El Artículo 123', 'd', 3, 'El Artículo 123 reúne los derechos de los trabajadores: jornada de 8 horas, salario mínimo y derecho a huelga.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué hizo Lázaro Cárdenas el 18 de marzo de 1938?', 'Vendió a empresas extranjeras el petróleo de México', 'Repartió entre los estados las ganancias del petróleo', 'Firmó un tratado de libre comercio con EE.UU.', 'Nacionalizó las empresas petroleras extranjeras', 'd', 1, 'La expropiación petrolera de 1938 pasó esas empresas a manos de la nación y creó PEMEX; fue un acto de soberanía que el pueblo apoyó con una colecta.'),
      (v_semana_id, '¿Qué distinguió a la economía mexicana durante el llamado Milagro Mexicano?', 'Repartió la riqueza de manera equitativa', 'Creció a tasas de hasta 6-7% anuales', 'Cayó por una deuda externa impagable', 'Se estancó por la inflación y el desempleo', 'b', 2, 'Entre 1940 y 1970, México se industrializó, se urbanizó y se modernizó con un crecimiento alto, y la clase media se expandió.'),
      (v_semana_id, 'Tras la crisis económica de los 80, ¿hacia dónde cambió el modelo económico de México?', 'Hacia la apertura comercial y el libre mercado', 'Hacia la nacionalización de las grandes industrias', 'Hacia el cierre de las fronteras al comercio', 'Hacia el reparto de tierras mediante ejidos', 'a', 3, 'La deuda externa, la devaluación del peso y la inflación llevaron a un nuevo modelo, basado en abrir el comercio y en el libre mercado.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué significa el principio de supremacía constitucional?', 'Que la Suprema Corte está por encima de la Constitución', 'Que el presidente puede modificar la Constitución por decreto', 'Que ninguna ley puede estar por encima de la Constitución', 'Que las leyes de cada estado valen más que la Constitución', 'c', 1, 'La Constitución es la ley suprema del país: toda otra ley, decreto o disposición debe ser compatible con ella.'),
      (v_semana_id, '¿Para qué sirve el juicio de amparo?', 'Para defender derechos constitucionales ante un juez federal', 'Para reformar artículos de la Constitución mediante una votación', 'Para presentar quejas ante el INE contra los partidos políticos', 'Para elegir a los ministros de la Suprema Corte de Justicia', 'a', 2, 'El amparo es el instrumento más poderoso de un ciudadano: si una autoridad le viola un derecho constitucional, puede pedirlo ante un juez federal.'),
      (v_semana_id, '¿Qué libertad protege el Artículo 24 de la Constitución?', 'La libertad de expresión', 'La libertad de culto', 'La libertad de tránsito', 'La libertad de prensa', 'b', 3, 'La Constitución enumera los derechos fundamentales artículo por artículo; el 24 es el que establece la libertad de culto.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué significa que los derechos humanos sean indivisibles?', 'Que no se puede elegir cuáles respetar y cuáles no', 'Que nadie puede quitarlos, aunque sí es posible violarlos', 'Que son para todas las personas del mundo', 'Que no caducan con el paso del tiempo', 'a', 1, 'Ser indivisibles quiere decir que los derechos humanos van juntos: no se puede elegir cuáles respetar y cuáles no.'),
      (v_semana_id, '¿Qué derechos forman la segunda generación?', 'Los colectivos de los pueblos', 'Los civiles y políticos', 'Los económicos, sociales y culturales', 'Los electorales y los de libre reunión', 'c', 2, 'La segunda generación incluye los derechos económicos, sociales y culturales, como el trabajo, la salud, la educación, la vivienda y la seguridad social.'),
      (v_semana_id, '¿Qué hechos llevaron a la ONU a proclamar en 1948 la Declaración Universal de los Derechos Humanos?', 'La Revolución Mexicana y sus muertes', 'La Primera Guerra Mundial y sus consecuencias', 'La Intervención Francesa en México', 'El Holocausto y la Segunda Guerra Mundial', 'd', 3, 'Tras el Holocausto y la Segunda Guerra Mundial (1939-1945), la humanidad decidió que algo así no podía repetirse; en 1948 llegó la Declaración Universal.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un gobernador tiene que cumplir la ley igual que cualquier otra persona. ¿Qué principio democrático se cumple?', 'Separación de poderes', 'Estado de derecho', 'Respeto a las minorías', 'Sufragio universal', 'b', 1, 'En un Estado de derecho, todos, incluidos los gobernantes, están sujetos a la ley; nadie queda por encima de ella.'),
      (v_semana_id, 'Se propone crear una ley nueva para todo el país. ¿Qué poder del gobierno se encarga de crearla?', 'El Instituto Nacional Electoral', 'El Poder Judicial', 'El Poder Legislativo', 'El Poder Ejecutivo', 'c', 2, 'El Congreso de la Unión, formado por el Senado y la Cámara de Diputados, es el Poder Legislativo, y su tarea central es crear las leyes.'),
      (v_semana_id, '¿Cuál es la unidad más pequeña de gobierno en México?', 'La federación', 'El municipio', 'El estado', 'La región', 'b', 3, 'México es una federación: cada entidad tiene autonomía y gobierno propio, y dentro de ella los municipios son la unidad más pequeña de gobierno.');
  END IF;
END $$;

-- ----------- Ciencias Sociales II (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Ciencias Sociales II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Ciencias Sociales II" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué idea resume el lema «Orden y progreso» del Porfiriato?', 'Primero el reparto de tierras, luego la paz', 'Primero la democracia, luego la riqueza', 'Primero la estabilidad, luego el desarrollo', 'Primero las elecciones, luego las grandes obras', 'c', 1, 'El lema de Porfirio Díaz ponía la estabilidad por delante: solo después de asegurarla vendría el desarrollo del país.'),
      (v_semana_id, '¿Qué presidente hizo el reparto agrario y la expropiación petrolera?', 'Porfirio Díaz', 'Vicente Fox', 'Venustiano Carranza', 'Lázaro Cárdenas', 'd', 2, 'Lázaro Cárdenas entregó tierras a los campesinos con el reparto agrario y, con la expropiación petrolera de 1938, dio origen a PEMEX.'),
      (v_semana_id, '¿Qué significa que los derechos humanos sean universales?', 'Que valen en los países que firman la Declaración', 'Que duran para siempre, sin caducar', 'Que son para todos, en todo el mundo', 'Que solo los reconoce la ONU', 'c', 3, 'Los derechos humanos son universales porque corresponden a toda persona, sea quien sea y esté donde esté.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un compañero te deja una nota con la letra tan enredada que no alcanzas a leerla. ¿Qué elemento de la comunicación está dificultando el mensaje?', 'El ruido', 'El código', 'El canal', 'El contexto', 'a', 1, 'Cualquier interferencia que dificulta comprender un mensaje es ruido, y la letra ilegible es uno de sus ejemplos.'),
      (v_semana_id, 'Desde la otra acera, una vecina te saluda moviendo la mano, sin decir nada. ¿Qué tipo de comunicación usa?', 'Verbal escrita', 'Verbal oral', 'No verbal', 'Paraverbal', 'c', 2, 'Mover la mano es un gesto, y los gestos pertenecen a la comunicación que no usa palabras.'),
      (v_semana_id, 'En clase, Iván pregunta: «¿Qué quiere decir la palabra trueque?». ¿Qué función del lenguaje cumple su pregunta?', 'Metalingüística', 'Fática', 'Emotiva', 'Referencial', 'a', 3, 'Preguntar qué significa una palabra es usar el lenguaje para hablar del lenguaje mismo.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un folleto del municipio indica, paso a paso, cómo separar la basura en casa. ¿Qué tipo de texto es?', 'Expositivo', 'Instructivo', 'Descriptivo', 'Narrativo', 'b', 1, 'El folleto indica pasos para realizar algo y responde a la pregunta ¿cómo se hace?'),
      (v_semana_id, '¿Cuál de estos textos es literario?', 'La noticia de una feria en Puebla', 'Un contrato de renta de una casa', 'La receta de unos tamales de elote', 'Un poema sobre el mar de Veracruz', 'd', 2, 'Los textos literarios tienen valor estético y creatividad, y los poemas están entre sus ejemplos.'),
      (v_semana_id, 'Al final de su artículo sobre el cuidado del agua, Marisol resume lo que explicó. ¿Qué parte del texto está escribiendo?', 'El título', 'El desarrollo', 'La conclusión', 'La introducción', 'c', 3, 'La parte final de un texto bien escrito es la que cierra, resume o resuelve lo que se trató.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un cuento dice: «Don Beto cerró la tienda y suspiró frente a la caja vacía». Entiendes que le fue mal en las ventas, aunque el cuento no lo mencione. ¿Qué nivel de comprensión usaste?', 'Semántico', 'Literal', 'Crítico', 'Inferencial', 'd', 1, 'Usaste las pistas del texto para deducir algo que no dice de forma directa: lo que se entiende entre líneas.'),
      (v_semana_id, 'Acabas de terminar de leer un artículo. ¿Qué estrategia corresponde a este momento?', 'Preguntarte de qué crees que trata el texto', 'Resumir en tus propias palabras de qué trató', 'Subrayar o anotar las ideas importantes del texto', 'Observar el título, las imágenes y los subtítulos', 'b', 2, 'Después de leer conviene contar con tus palabras de qué trató el texto y preguntarte quién, qué, cuándo y dónde.'),
      (v_semana_id, 'Lees: «El río estaba turbio: el agua sucia no dejaba ver el fondo». Sin usar el diccionario, ¿qué significa «turbio»?', 'Rápido y con mucha fuerza', 'Sucio y sin transparencia', 'Hondo y con muchas piedras', 'Frío y con poca corriente', 'b', 3, 'La misma oración da las pistas: habla de agua sucia que no deja ver el fondo. Eso es usar el contexto semántico.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En «Mis tíos regresan a Mérida en Marzo», ¿qué palabra tiene un error de mayúscula?', 'Marzo', 'tíos', 'Mis', 'Mérida', 'a', 1, 'Los meses del año no se escriben con mayúscula, así que esa palabra debe ir con minúscula inicial.'),
      (v_semana_id, '¿En qué pareja las dos palabras están bien escritas?', 'enbase y cambio', 'enbase y camvio', 'envase y camvio', 'envase y cambio', 'd', 2, 'Después de n se escribe v, como en enviar, y después de m se escribe b, como en también.'),
      (v_semana_id, 'Elena le deja un recado a su hermano. ¿En qué versión está bien escrito el verbo haber?', 'Tu papá a salido y abrá cena a las ocho.', 'Tu papá ha salido y abrá cena a las ocho.', 'Tu papá ha salido y habrá cena a las ocho.', 'Tu papá a salido y habrá cena a las ocho.', 'c', 3, 'Las formas del verbo haber siempre llevan h, aunque no suene: ha, había, habrá.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué es el significado denotativo de una palabra?', 'El significado directo que da el diccionario', 'El sentido simbólico que le da un autor', 'El origen histórico que tiene la palabra', 'El significado emocional que le da una cultura', 'a', 1, 'El significado denotativo, también llamado literal, es el directo que trae el diccionario.'),
      (v_semana_id, '¿Cuál es el antónimo de «frío»?', 'Templado', 'Caliente', 'Helado', 'Fresco', 'b', 2, 'Los antónimos son palabras con significado contrario, y frío se opone a caliente.'),
      (v_semana_id, '¿Cómo se forma la palabra «sacapuntas»?', 'Cambiando la raíz de la palabra punta', 'Uniendo dos palabras: saca y puntas', 'Usando el significado figurado de punta', 'Agregando un sinónimo a la palabra punta', 'b', 3, 'Es una palabra compuesta: se forma con dos palabras, igual que para y aguas forman paraguas.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En «Los vecinos de la calle Morelos limpian el parque», ¿cuál es el predicado?', 'de la calle Morelos', 'el parque', 'Los vecinos de la calle Morelos', 'limpian el parque', 'd', 1, 'El predicado es lo que se dice del sujeto, y aquí se dice qué hacen los vecinos.'),
      (v_semana_id, '«Tal vez mañana vaya al tianguis.» ¿Qué tipo de oración es por su propósito?', 'Exclamativa', 'Declarativa', 'Imperativa', 'Dubitativa', 'd', 2, 'La frase «tal vez» muestra que la persona no está segura, y las oraciones que expresan duda son de este tipo.'),
      (v_semana_id, '¿Qué forma del verbo completa bien la oración «Las maestras de la escuela ___ temprano»?', 'llega', 'llegas', 'llegan', 'llego', 'c', 3, 'El sujeto, las maestras, está en plural, y el sujeto y el verbo deben coincidir en persona y número.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Rubén revisa su párrafo y une las ideas con palabras como «además» y «por último». ¿Qué cualidad del párrafo está cuidando?', 'La coherencia', 'La cohesión', 'La concordancia', 'La unidad', 'b', 1, 'Las palabras de enlace conectan las ideas entre sí, y esa cualidad del párrafo se llama cohesión.'),
      (v_semana_id, 'Karla escribe «Mi colonia tiene buenos servicios» y después agrega oraciones con ejemplos de esos servicios. ¿Qué tipo de oraciones agregó?', 'Oraciones de cierre', 'Oraciones temáticas', 'Oraciones de enlace', 'Oraciones de desarrollo', 'd', 2, 'Las oraciones que explican, dan ejemplos o argumentan la idea principal forman el cuerpo del párrafo.'),
      (v_semana_id, '¿Qué conector completa bien la frase «Quería ir al partido; ___, tuve que trabajar»?', 'sin embargo', 'además', 'en resumen', 'por ejemplo', 'a', 3, 'La segunda idea se opone a la primera, así que hace falta un conector que sirva para contrastar.');
  END IF;
END $$;

-- ----------- Español I (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español I" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuándo se convierte el receptor en emisor?', 'Cuando interpreta el mensaje', 'Cuando recibe el mensaje', 'Cuando responde al mensaje', 'Cuando cambia de canal', 'c', 1, 'La comunicación es un proceso circular: quien recibía el mensaje pasa a emitir en el momento en que contesta.'),
      (v_semana_id, '¿Antes de qué vocales suena la c como s?', 'Antes de a y de o', 'Antes de a y de i', 'Antes de e y de i', 'Antes de o y de u', 'c', 2, 'La regla de ortografía dice que la c suena como s antes de e y de i, como en las palabras cena y circo.'),
      (v_semana_id, '¿Qué oración de la estructura del párrafo es opcional?', 'La oración de cierre', 'La oración temática', 'La oración de enlace', 'La oración de desarrollo', 'a', 3, 'En la estructura del párrafo, la de cierre es la que se marca como opcional.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Lee: «Las bicicletas ayudan a cuidar el ambiente de la ciudad. No sueltan humo al circular. Casi no hacen ruido. Además, ocupan poco espacio en las calles.» ¿Cuál es la idea principal?', 'Las bicicletas ayudan a cuidar el ambiente de la ciudad', 'Las bicicletas ocupan poco espacio en la calle', 'Las bicicletas casi no hacen ruido al pasar', 'Las bicicletas no sueltan humo al circular', 'a', 1, 'Esa oración es el mensaje más importante del párrafo: resume el tema central y las demás solo la apoyan con datos.'),
      (v_semana_id, 'Un párrafo da primero varios ejemplos y hasta la última oración presenta la idea principal. ¿Cómo se llama este tipo de párrafo?', 'Párrafo inductivo', 'Párrafo central', 'Párrafo secundario', 'Párrafo deductivo', 'a', 2, 'Cuando la idea principal aparece al final, el párrafo es inductivo, porque los ejemplos llevan hasta ella.'),
      (v_semana_id, 'Ya resumiste en una oración lo que crees que es la idea principal de un texto. ¿Qué haces para asegurarte de que sí lo es?', 'Revisar que sea la primera oración del párrafo', 'Buscar si esa oración trae datos o estadísticas', 'Comprobar que sea la oración más larga del texto', 'Comprobar que el resto del texto apoya esa idea', 'd', 3, 'El último paso es verificar: si lo demás del texto apoya esa idea, entonces es la principal.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un texto dice que el torneo se pospuso por la lluvia. En su resumen, Lucía escribe que el torneo se canceló. ¿Qué característica del buen resumen no cumple?', 'Tus propias palabras', 'Coherencia', 'Brevedad', 'Fidelidad', 'd', 1, 'Un buen resumen no cambia el sentido del original; al escribir que se canceló, Lucía alteró lo que dice el texto.'),
      (v_semana_id, 'Ya leíste una vez el texto completo, sin subrayar, para entenderlo. ¿Qué sigue para hacer tu resumen?', 'Escribir las ideas con tus propias palabras', 'Releerlo y subrayar la idea principal de cada párrafo', 'Elegir las ideas secundarias más importantes', 'Revisar que no añadiste información nueva', 'b', 2, 'Después de la primera lectura global, el segundo paso es volver a leer y subrayar la idea principal de cada párrafo.'),
      (v_semana_id, 'Beto resume un capítulo de historia y escribe cada ejemplo y cada detalle para que no falte nada. ¿Por qué no es un buen resumen?', 'Un resumen usa solo las palabras exactas del autor', 'Un resumen conserva solo las ideas más importantes', 'Un resumen debe incluir la opinión de quien escribe', 'Un resumen conserva solo las ideas secundarias', 'b', 3, 'El resumen es una versión abreviada: se queda con lo esencial y deja fuera varios detalles y ejemplos.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un libro de la maestra Ruiz dice: «El repaso diario fortalece la memoria». Karla escribe en su tarea: Según la maestra Ruiz, repasar cada día ayuda a recordar mejor. ¿Qué hizo Karla?', 'Una paráfrasis', 'Una cita directa', 'Un resumen', 'Un plagio', 'a', 1, 'Karla reformuló la idea con otras palabras y reconoció a la autora; mantuvo el significado sin copiar la frase original.'),
      (v_semana_id, 'Original: «Los vecinos del barrio organizaron una kermés». Julián escribe, sin mencionar la fuente: «Los vecinos del barrio prepararon una kermés». ¿Por qué eso no es una paráfrasis?', 'Cambió el significado de la oración', 'Usó más palabras que la oración original', 'Solo cambió una palabra: sigue siendo plagio', 'Añadió información que no estaba', 'c', 2, 'Parafrasear pide reformular de verdad; cambiar una o dos palabras no basta y el texto sigue siendo una copia.'),
      (v_semana_id, 'Sofía convierte «Cuando terminó la clase, los alumnos salieron al patio» en «Los alumnos salieron al patio cuando terminó la clase». ¿Qué técnica usó?', 'Cambiar el punto de vista gramatical', 'Cambiar la estructura de la oración', 'Simplificar el lenguaje técnico', 'Cambiar el vocabulario con sinónimos', 'b', 3, 'Sofía reordenó las ideas de la oración sin cambiar su significado ni sus palabras: eso es modificar cómo está construida.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál de estas oraciones tiene un error porque la coma separa el sujeto del verbo?', 'Para el festival traje sillas, mesas y manteles.', 'Además, las maestras de tercero harán el festival.', 'Maestras, ya está preparado el festival de tercero.', 'Las maestras de tercero, preparan el festival.', 'd', 1, 'Entre sujeto y verbo nunca se pone coma; aquí el sujeto es «Las maestras de tercero» y el verbo es «preparan».'),
      (v_semana_id, 'Completa con un signo: «Ganaron tres jugadores: la capitana, Sofía Ruiz___ el portero, Luis Mora___ y la defensa, Ana Díaz.» ¿Cuál va en los espacios?', 'Punto y coma', 'Puntos suspensivos', 'Dos puntos', 'Coma', 'a', 2, 'Cuando los elementos de una lista ya llevan comas, se separan entre sí con punto y coma.'),
      (v_semana_id, 'Escribes una carta formal a la directora de tu escuela. ¿Qué signo va después de «Estimada directora»?', 'Punto y coma', 'Punto seguido', 'Dos puntos', 'Coma', 'c', 3, 'En cartas y correos formales, el saludo se escribe con dos puntos al final.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Por qué lleva tilde la palabra «sillón», que se acentúa en la última sílaba?', 'Es grave y no termina en vocal', 'Es aguda y termina en n', 'Tiene un hiato en la última sílaba', 'Es esdrújula, por eso siempre la lleva', 'b', 1, 'La última sílaba es la acentuada, así que es aguda; las agudas llevan tilde si terminan en n, s o vocal.'),
      (v_semana_id, 'La palabra «joven» se acentúa en la penúltima sílaba. ¿Cómo se escribe y por qué?', 'Con tilde, porque es grave y termina en n', 'Con tilde, porque es aguda y termina en n', 'Sin tilde, porque es aguda y termina en n', 'Sin tilde, porque es grave y termina en n', 'd', 2, 'Se acentúa en la penúltima, así que es grave; las graves solo llevan tilde si no terminan en n, s o vocal, y esta acaba en n.'),
      (v_semana_id, '¿Por qué lleva tilde la palabra «tía»?', 'Es esdrújula, por eso siempre lleva tilde', 'Tiene diptongo y vocal débil tónica', 'Tiene hiato y su vocal débil es tónica', 'Es grave y termina en vocal', 'c', 3, 'La i y la a suenan en sílabas separadas (tí-a); en esos casos, la vocal débil tónica lleva tilde aunque no lo pida la regla.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Terminas un correo formal para tu maestra. ¿Cuál de estas frases usas como cierre?', 'Saludos cordiales', 'Buenos días, maestra:', 'Estimada maestra:', 'Asunto: Entrega de tarea', 'a', 1, 'En el correo formal, frases como «Saludos cordiales» o «Atentamente» despiden con respeto antes de la firma.'),
      (v_semana_id, 'Un correo a la directora empieza: «Qué onda, maestra, le pido mi constancia de estudios». ¿Qué error frecuente comete?', 'Dejar el asunto vacío', 'Usar lenguaje coloquial', 'Mezclar temas en el mismo texto', 'No especificar el propósito', 'b', 2, '«Qué onda» es una expresión informal; los textos formales piden un trato respetuoso y evitan ese tipo de lenguaje.'),
      (v_semana_id, 'Valeria escribe un correo formal para pedir una reunión con su escuela. ¿Cómo debe redactar el cuerpo?', 'Con todos sus temas pendientes', 'Con muchos párrafos largos', 'Con lenguaje coloquial y cercano', 'De forma breve y directa', 'd', 3, 'El cuerpo de un correo formal va al grano: los correos formales no deben ser muy largos.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En su informe de actividades, Diana escribe: «Yo creo que el taller estuvo padrísimo». ¿Qué error tiene esa oración?', 'Usa un verbo en pasado, que no va en informes', 'Está escrita en segunda persona', 'Da una opinión personal con lenguaje informal', 'Es demasiado larga para un informe', 'c', 1, 'El informe es objetivo y evita la jerga; «Yo creo» y «padrísimo» no van en este tipo de documento.'),
      (v_semana_id, 'En su solicitud, Óscar escribe: «Pido permiso para faltar a clases el viernes 12 de mayo». ¿Qué parte de la solicitud es?', 'La exposición', 'La petición concreta', 'El fundamento legal', 'Los datos del solicitante', 'b', 2, 'Esa parte dice exactamente qué se pide; aquí Óscar señala el permiso y la fecha, sin explicar sus motivos.'),
      (v_semana_id, 'Un equipo quiere agregar a su informe las tablas y gráficas que usó como apoyo. ¿En qué parte las coloca?', 'En los anexos', 'En las conclusiones', 'En la portada', 'En la introducción', 'a', 3, 'Los anexos reúnen el material de apoyo del informe, como tablas, gráficas y documentos de soporte.');
  END IF;
END $$;

-- ----------- Español II (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español II" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Te piden reescribir un texto de una página con otras palabras, con el mismo significado y sin acortarlo. ¿Qué vas a hacer?', 'Una cita directa', 'Un resumen', 'Una paráfrasis', 'Un plagio', 'c', 1, 'Parafrasear es reformular con tus palabras sin cambiar el significado, y no necesariamente reduce la extensión.'),
      (v_semana_id, 'Completa: «Yo no ___ la respuesta de la tarea». ¿Qué palabra va y por qué?', 'se, porque es verbo', 'sé, porque es pronombre', 'sé, porque es verbo', 'se, porque es pronombre', 'c', 2, 'Aquí la palabra es una forma del verbo saber, y esa forma se distingue con tilde diacrítica.'),
      (v_semana_id, '¿Qué escribes en las conclusiones de un informe?', 'Qué hacer con base en los resultados', 'Las tablas y gráficas de soporte', 'El contexto y el propósito del informe', 'Lo más importante que se encontró', 'd', 3, 'Las conclusiones recogen el hallazgo central del informe: dicen qué fue lo más importante de lo que se encontró.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En un texto que pide más áreas verdes en Puebla, la autora afirma: «Cada colonia de la ciudad debería tener un parque público». Después da razones para probarlo. ¿Qué parte del texto es esa afirmación?', 'Un argumento de hecho', 'La conclusión', 'La refutación', 'La tesis del texto', 'd', 1, 'Es la posición que se defiende: la afirmación central que las razones del texto buscan probar.'),
      (v_semana_id, 'Para defender que los adolescentes duerman más horas, Diego cita lo que dice un especialista del IMSS sobre el sueño. ¿Qué tipo de argumento usa?', 'Argumento de autoridad', 'Argumento de causa-efecto', 'Argumento de hecho', 'Argumento de ejemplo', 'a', 2, 'Apoyarse en lo que dice un experto o una institución reconocida es lo que define a este tipo de argumento.'),
      (v_semana_id, '¿Qué hace la refutación en un texto argumentativo?', 'Da datos y cifras que prueban la postura', 'Anticipa los contraargumentos y los rebate', 'Presenta la afirmación que se quiere probar', 'Retoma la tesis y la refuerza al cierre', 'b', 3, 'La refutación se adelanta a lo que diría alguien en contra y le responde; es opcional, pero hace más efectivo el texto.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al leer un ensayo encuentras frases como «Considero que…» y «Desde mi perspectiva…». ¿Qué rasgo del ensayo muestran?', 'Su voz personal y subjetiva', 'Su tema amplio y general', 'Su formato rígido y formal', 'Su lenguaje frío y técnico', 'a', 1, 'En el ensayo hay un «yo» presente: el autor expresa abiertamente lo que piensa y no teme dar su opinión.'),
      (v_semana_id, 'Un alumno abre su ensayo así: «Recuerdo la tarde en que mi abuela, sentada en la mesa de su cocina, me pidió que le enseñara a leer. Tenía 60 años». ¿Qué recurso usó para empezar?', 'Un dato sorprendente', 'Una cita de un autor', 'Una pregunta al lector', 'Una anécdota personal', 'd', 2, 'Contar un hecho breve de la vida real es una de las formas de captar la atención al abrir un ensayo.'),
      (v_semana_id, 'En su ensayo, Renata escribe: «Aprender es como subir una escalera: cada peldaño te deja ver un poco más lejos». ¿Qué recurso del estilo del ensayo está usando?', 'Una oración pasiva', 'Una cita de otro autor', 'Un lenguaje burocrático', 'Una analogía', 'd', 3, 'Comparar aprender con subir una escalera explica una idea con una imagen vívida, un recurso propio del estilo del ensayo.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una columna firmada sobre el transporte público explica en lenguaje sencillo los dos lados del tema, pero su autora nunca dice qué piensa. ¿Qué le falta para ser un artículo de opinión?', 'Dar solo datos objetivos', 'Incluir una refutación', 'Tomar una postura clara', 'Seguir la pirámide invertida', 'c', 1, 'El artículo de opinión no es neutral: quien lo firma debe decir de qué lado está y defenderlo con argumentos.'),
      (v_semana_id, 'Un reportero escribe sobre la inauguración de una biblioteca pública: cuenta qué pasó, sin dar su punto de vista. ¿Qué texto escribió y con qué propósito?', 'Un artículo de opinión, para informar', 'Una noticia, para informar', 'Una noticia, para convencer', 'Un artículo de opinión, para convencer', 'b', 2, 'La escribe un reportero, es objetiva y su propósito es dar a conocer un hecho, no que el lector adopte una postura.'),
      (v_semana_id, '¿Qué parte de un artículo de opinión es la conclusión contundente que deja pensando al lector?', 'El cierre', 'La argumentación', 'La entrada', 'La exposición del tema', 'a', 3, 'Es la última parte del artículo: remata la postura del autor y busca que el lector siga reflexionando.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Para investigar sobre la diabetes en tu comunidad, entrevistas directamente a una doctora de tu clínica. ¿Qué tipo de fuente es esa entrevista?', 'Fuente secundaria', 'Fuente primaria', 'Fuente de opinión', 'Fuente terciaria', 'b', 1, 'La entrevista directa cuenta como documento original: no te llega a través de la interpretación de otra persona.'),
      (v_semana_id, 'Encuentras una página sobre becas escolares publicada hace quince años. ¿Qué pregunta de evaluación te alerta sobre esa fuente?', '¿Quién la publicó?', '¿Cita otras fuentes?', '¿Cuándo fue publicada?', '¿Está firmada por alguien?', 'c', 2, 'Antes de usar una fuente conviene saber si está actualizada, y un texto de hace tantos años quizá ya no lo esté.'),
      (v_semana_id, '¿Qué es la investigación documental?', 'Buscar, seleccionar, organizar y analizar información de fuentes confiables', 'Reunir opiniones personales sobre un tema sin revisar de dónde provienen', 'Copiar párrafos completos de internet y acomodarlos en un solo trabajo final', 'Escribir un borrador y corregirlo varias veces antes de publicarlo en internet', 'a', 3, 'Es un proceso con pasos claros para responder una pregunta o desarrollar un tema a partir de documentos confiables.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Vas a copiar textualmente un fragmento largo de un libro. ¿Cómo lo escribes en tu trabajo?', 'En párrafo aparte, con sangría y sin comillas', 'Dentro del párrafo, sin comillas y con sangría', 'En párrafo aparte, sin sangría, con comillas', 'Dentro del párrafo, entre comillas y sin sangría', 'a', 1, 'Cuando la cita directa es larga se separa del resto del texto en su propio párrafo; la sangría la distingue y ya no lleva comillas.'),
      (v_semana_id, 'Quieres usar la idea de una autora sin copiar sus palabras exactas. ¿Cómo la escribes?', 'Con tus palabras, sin comillas y sin la referencia', 'Con sus palabras, entre comillas y con la referencia', 'Con tus palabras, sin comillas y con la referencia', 'Con sus palabras, sin comillas y sin la referencia', 'c', 2, 'Eso es una cita indirecta o paráfrasis: reformulas la idea y, aunque no pongas comillas, indicas de quién es.'),
      (v_semana_id, '¿Cuál de estas referencias de libro sigue el formato APA que estudiaste?', 'Pedro Páramo. Rulfo, J. (1955). Fondo de Cultura Económica.', 'Rulfo, J. Fondo de Cultura Económica. (1955). Pedro Páramo.', '(1955). Rulfo, J. Pedro Páramo. Fondo de Cultura Económica.', 'Rulfo, J. (1955). Pedro Páramo. Fondo de Cultura Económica.', 'd', 3, 'En APA, el libro se anota en este orden: autor, año entre paréntesis, título y editorial.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Mauricio expone leyendo sus notas, sin levantar la mirada del papel. ¿Qué aspecto del lenguaje no verbal está descuidando?', 'El tono de la voz', 'Los gestos naturales', 'El contacto visual', 'La postura corporal', 'c', 1, 'Al exponer debes mirar a tu público; si solo ves el papel, pierdes la conexión con quienes te escuchan.'),
      (v_semana_id, '¿Qué debes hacer en la conclusión de una exposición oral?', 'Explicar ideas nuevas con ejemplos cercanos', 'Presentar el tema y anunciar los puntos a tratar', 'Resumir las ideas principales y cerrar con un mensaje', 'Repetir lo que dijiste en la introducción', 'c', 2, 'La conclusión recoge lo más importante de lo que expusiste y deja al público algo que recordar.'),
      (v_semana_id, 'Después de decir una idea importante, guardas silencio unos segundos. ¿Qué logras con esa pausa?', 'Pides al público que pregunte', 'Das peso a lo que acabas de decir', 'Indicas que ya terminaste', 'Avisas que olvidaste algo', 'b', 3, 'En una exposición, las pausas son aliadas: el silencio no es un error, sino una manera de reforzar lo dicho.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Luisa ya corrigió su texto y ahora ajusta los márgenes y la tipografía, y le agrega una portada. ¿En qué etapa del proceso de escritura está?', 'Corrección', 'Edición final', 'Preescritura', 'Revisión global', 'b', 1, 'Dar formato al texto es lo último del proceso: se hace cuando el contenido ya está listo.'),
      (v_semana_id, '¿Qué se revisa en la etapa de corrección de un borrador?', 'Márgenes, tipografía, espaciado y portada del trabajo', 'Qué falta investigar y quién será el lector del texto', 'El objetivo, la estructura y la lógica del texto completo', 'Ortografía y concordancia, oración por oración', 'd', 2, 'La corrección es la etapa de detalle: se revisa párrafo por párrafo y oración por oración la ortografía, la puntuación y la concordancia.'),
      (v_semana_id, '¿Por qué conviene leer tu texto en voz alta antes de terminarlo?', 'Porque así compruebas que el texto es suficientemente largo', 'Porque el oído detecta torpezas que el ojo no ve', 'Porque así memorizas mejor el texto', 'Porque así calculas cuánto tardarás en exponerlo', 'b', 3, 'Al escuchar tu propio texto notas frases torpes que se te pasan al leer en silencio; es uno de los consejos prácticos de la semana.');
  END IF;
END $$;

-- ----------- Español III (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Español III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Español III" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Según la guía de repaso, ¿qué debe hacer la conclusión de un ensayo?', 'Presentar el tema y enunciar la tesis', 'Repetir la introducción casi igual', 'Agregar datos y referencias nuevas', 'Elevar la reflexión a un nivel más amplio', 'd', 1, 'El ensayo cierra el pensamiento sin volver a decir lo mismo que al inicio: lleva la reflexión más lejos.'),
      (v_semana_id, 'Vas a exponer ante tu grupo y empiezas con un dato curioso. ¿Para qué te sirve ese inicio?', 'Para cerrar con un mensaje final', 'Para resumir las ideas principales', 'Para captar la atención del público', 'Para invitar a que te hagan preguntas', 'c', 2, 'Un dato curioso, una pregunta o una anécdota son formas de ganarte a tu público desde la introducción.'),
      (v_semana_id, '¿Qué haces en la etapa del primer borrador?', 'Escribes sin detenerte a corregir', 'Revisas ortografía y puntuación', 'Planificas el tema y a tu lector', 'Das formato y agregas una portada', 'a', 3, 'El primer borrador sirve para sacar las ideas; lo que haya que arreglar se atiende en las etapas siguientes.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué letra del abecedario en inglés se pronuncia "uai"?', 'I', 'U', 'W', 'Y', 'd', 1, 'En el abecedario en inglés esta letra se nombra "uai", así que al deletrear una palabra que la lleva dices "uai".'),
      (v_semana_id, '¿Cuál es la escritura correcta del número 40 en inglés?', 'forty', 'fifty', 'fourty', 'fourteen', 'a', 2, 'El número 40 se escribe forty, sin la letra u, aunque el número 4 sea four.'),
      (v_semana_id, 'Son las 8 de la noche y llegas a casa de tu tía. ¿Qué saludo usas al llegar?', 'Good afternoon', 'Good morning', 'Good night', 'Good evening', 'd', 3, 'Good evening significa buenas noches y se usa al llegar a un lugar. La otra forma de decir buenas noches se guarda para despedirse a dormir.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'What is the correct form of "to be" for the subject "they"?', 'be', 'are', 'is', 'am', 'b', 1, 'Con they (ellos o ellas) el verbo to be siempre es are: I am, you are, he/she/it is, we are, they are.'),
      (v_semana_id, '¿Cuál oración negativa está bien escrita?', 'She is not happy', 'She is no happy', 'She no is happy', 'She not is happy', 'a', 2, 'Para negar con to be se agrega not después del verbo. Por eso not va justo después de is.'),
      (v_semana_id, 'Quieres preguntar en inglés si ella es maestra. ¿Qué dices?', 'She is a teacher?', 'Are she a teacher?', 'Is a teacher she?', 'Is she a teacher?', 'd', 3, 'En las preguntas con to be se invierte el orden: el verbo va primero y el sujeto va en seguida. Con she se usa is.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cómo se dice "Soy de México" en inglés?', 'I am from Mexico', 'Is from Mexico', 'I from Mexico', 'Am from Mexico', 'a', 1, 'El pronombre sujeto es obligatorio en inglés y no se puede omitir, aunque en español sí. Por eso la oración empieza con I y lleva el verbo am.'),
      (v_semana_id, 'Un grupo de puras alumnas quiere decir "nosotras" en inglés. ¿Qué pronombre usa?', 'We', 'They', 'She', 'You', 'a', 2, 'En inglés no hay diferencia entre nosotros y nosotras: para el grupo del que formas parte siempre se usa we.'),
      (v_semana_id, 'La hija de tu tía es tu prima. ¿Cómo se dice "prima" en inglés?', 'Aunt', 'Sister', 'Cousin', 'Daughter', 'c', 3, 'Cousin significa primo o prima: es la misma palabra para hombre y para mujer.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cómo se dice "verde oscuro" en inglés?', 'Green dark', 'Light green', 'Dark green', 'Dark blue', 'c', 1, 'En inglés, dark (oscuro) va antes del color: la lista de colores de la semana da verde oscuro como dark green.'),
      (v_semana_id, 'Tu clase de inglés es el Thursday. ¿Qué día te toca?', 'Martes', 'Jueves', 'Miércoles', 'Viernes', 'b', 2, 'Thursday es jueves. Suena parecido a otro día de la semana, así que fíjate en que empieza con Th.'),
      (v_semana_id, '¿Qué palabras van siempre con mayúscula en inglés?', 'Los colores y los números', 'Los días y los colores', 'Los días y los meses', 'Los meses y los colores', 'c', 3, 'Los nombres de los días de la semana y de los meses del año van con mayúscula en inglés, por ejemplo Monday y March.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué fruta es "pineapple"?', 'Sandía', 'Piña', 'Manzana', 'Fresa', 'b', 1, 'Pineapple significa piña. Es una sola palabra y no tiene que ver con la fruta que se dice apple.'),
      (v_semana_id, 'En un restaurante quieres saber el precio de un platillo. ¿Qué preguntas?', 'How much is it?', 'Can I have the menu?', 'I''ll have the chicken', 'It''s delicious!', 'a', 2, 'How much is it? significa ¿Cuánto cuesta? y es la frase de la semana para preguntar un precio en el restaurante.'),
      (v_semana_id, '¿Cómo se dice "Tengo sed" en inglés?', 'I have thirst', 'I have hungry', 'I''m hungry', 'I''m thirsty', 'd', 3, 'Tener sed se dice con I''m + thirsty, sin usar el verbo tener. Es la misma forma que se usa para decir que tienes hambre.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Completa la oración: "My father ___ every day." Usa el verbo trabajar.', 'working', 'workes', 'work', 'works', 'd', 1, 'My father equivale a he, y con he, she o it el verbo agrega -s o -es. Este verbo solo agrega -s, según la regla general.'),
      (v_semana_id, '¿Cómo se escribe "study" con "she" en presente simple?', 'studys', 'studies', 'studyes', 'studyies', 'b', 2, 'Study termina en consonante más y, así que la y cambia por -ies. Con she el verbo queda escrito con esa terminación.'),
      (v_semana_id, '¿Cómo se dice "Mi papá no toma café" en inglés?', 'My father not drink coffee', 'My father doesn''t drink coffee', 'My father don''t drink coffee', 'My father isn''t drink coffee', 'b', 3, 'Con he, she o it la negativa usa doesn''t y el verbo queda sin -s, como en She doesn''t drink coffee.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Quieres saber por qué una compañera estudia inglés. ¿Con qué palabra empiezas la pregunta?', 'Who', 'What', 'Why', 'When', 'c', 1, 'Why significa por qué y sirve para preguntar el motivo de algo. Se contesta con because, como en Because I want to learn.'),
      (v_semana_id, 'Completa la pregunta: "___ books do you have?"', 'How much', 'What many', 'How many', 'How old', 'c', 2, 'Los libros se pueden contar, y para cosas contables se usa how many.'),
      (v_semana_id, '¿Qué significa la frase "Can you write it down?"', '¿Puede escribirlo?', '¿Puede hablar más despacio?', '¿Qué significa eso?', '¿Puede repetirlo?', 'a', 3, 'Es una de las frases útiles para cuando no entiendes: con ella pides que te escriban lo que te acaban de decir.');
  END IF;
END $$;

-- ----------- Inglés Básico (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Inglés Básico'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Inglés Básico" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuándo se dice "Good night" en inglés?', 'Al llegar de noche', 'Al saludar en la mañana', 'Al despedirte para dormir', 'Al saludar por la tarde', 'c', 1, 'Good night significa buenas noches, pero solo se dice al despedirse para dormir, como indica la semana 1 de tu repaso.'),
      (v_semana_id, 'En una pregunta de sí o no con to be, como Are they from Mexico?, ¿dónde va el verbo?', 'Después de la palabra not', 'Al final de la pregunta', 'Después del sujeto', 'Al inicio de la pregunta', 'd', 2, 'En las preguntas de sí o no con to be se invierte el orden: primero va el verbo y luego el sujeto, como en Are they from Mexico?'),
      (v_semana_id, '¿Cuál oración está bien escrita en presente simple?', 'He watchs TV every day', 'He watches TV every day', 'He watching TV every day', 'He watch TV every day', 'b', 3, 'Con he, she o it el verbo agrega -s o -es, y tu repaso muestra la forma he watches para este verbo.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿En cuál de estos números el dígito 4 vale 40?', '245', '452', '405', '524', 'a', 1, 'En 245 el 4 ocupa el lugar de las decenas, y cada posición tiene un valor: 245 = 200 + 40 + 5.'),
      (v_semana_id, '¿A cuánto se redondea 657 a la decena más cercana?', '650', '700', '660', '600', 'c', 2, 'El dígito a la derecha de las decenas es 7, que es 5 o más: por eso las decenas suben de 5 a 6 y el número queda en 660.'),
      (v_semana_id, '¿Qué indica un número ordinal?', 'Cuánto vale cada dígito', 'Cuántos hay de algo', 'Qué número es el mayor', 'El orden que ocupa algo', 'd', 3, 'Los ordinales dicen el orden: primero, segundo, tercero. Por eso se usan para decir qué lugar ocupa alguien en una fila.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al dividir 38 entre 5, ¿cuánto es el residuo?', '5', '2', '7', '3', 'd', 1, 'Como 5 × 7 = 35, de 38 quedan 3 sin repartir: lo que sobra cuando la división no es exacta es el residuo.'),
      (v_semana_id, '¿Cuál de estas igualdades muestra que la suma es conmutativa?', '8 + 6 = 6 + 8', '8 + 6 = 7 + 7', '8 + 6 = 8 × 6', '8 − 6 = 6 − 8', 'a', 2, 'Conmutativa significa que el orden no importa: si cambias de lugar los números que sumas, el resultado es el mismo.'),
      (v_semana_id, 'Compras 8 paquetes de tortillas a $14 cada uno. ¿Cuánto pagas en total?', '$122', '$112', '$102', '$22', 'b', 3, 'Multiplicar es una suma repetida: en lugar de sumar 14 ocho veces, haces 8 × 14 = 112 pesos.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto da 9 + 4 × 3?', '21', '16', '39', '31', 'a', 1, 'La multiplicación va antes que la suma: 4 × 3 = 12 y luego 9 + 12 = 21.'),
      (v_semana_id, '¿Cuánto da (5 + 3) × 6?', '48', '21', '23', '14', 'a', 2, 'Lo que está entre paréntesis se resuelve primero: 5 + 3 = 8 y luego 8 × 6 = 48.'),
      (v_semana_id, '¿Cuánto da 42 ÷ 7 × 2?', '84', '12', '3', '21', 'b', 3, 'La división y la multiplicación están al mismo nivel y van de izquierda a derecha: 42 ÷ 7 = 6 y luego 6 × 2 = 12.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto da (−13) + (+6)?', '−19', '+19', '−7', '+7', 'c', 1, 'Los signos son diferentes: se restan los valores, 13 − 6 = 7, y se conserva el signo del mayor, que es el negativo.'),
      (v_semana_id, '¿Cuánto da 9 − (−4)?', '13', '−13', '−5', '5', 'a', 2, 'Restar un número es sumar su opuesto: el opuesto de −4 es +4, así que queda 9 + 4 = 13.'),
      (v_semana_id, '¿Qué pareja de números está a la misma distancia del cero?', '−6 y −5', '−6 y +5', '+6 y +5', '−6 y +6', 'd', 3, 'El valor absoluto es la distancia al cero sin importar el signo: |−6| = 6 y |+6| = 6.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Cada bolsa trae 8 bolillos. ¿Cuál de estas cantidades se completa solo con bolsas llenas?', '58', '60', '56', '52', 'c', 1, 'La cantidad debe ser múltiplo de 8, es decir, resultado de multiplicarlo por 1, 2, 3...: 8 × 7 = 56.'),
      (v_semana_id, '¿Cuál de estos números tiene al 6 como divisor?', '62', '16', '42', '26', 'c', 2, 'Un divisor divide al número exactamente, sin residuo: 42 ÷ 6 = 7.'),
      (v_semana_id, '¿Por qué el 11 es un número primo?', 'Solo lo dividen el 1 y el 11', 'No es múltiplo de 2', 'Tiene más de dos divisores', 'Todos los impares son primos', 'a', 3, 'Un primo solo tiene dos divisores, 1 y él mismo, y así pasa con el 11: ningún otro número lo divide exactamente.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Es divisible entre 3 el número 5,127?', 'No, porque sus dígitos suman 15', 'Sí, porque sus dígitos suman 15', 'No, porque termina en 7', 'Sí, porque termina en 7', 'b', 1, 'Para el 3 se suman los dígitos: 5 + 1 + 2 + 7 = 15, y 15 ÷ 3 = 5, así que el número sí es divisible.'),
      (v_semana_id, 'Para saber si 7,132 es divisible entre 4, ¿qué número revisas?', '7', '13', '2', '32', 'd', 2, 'Se miran los últimos dos dígitos, que forman 32; como 32 ÷ 4 = 8, el número sí es divisible entre 4.'),
      (v_semana_id, 'Un número es par y sus dígitos suman 21. ¿Entre cuál de estos números es divisible con seguridad?', '5', '9', '4', '6', 'd', 3, 'Al ser par es divisible entre 2, y como 21 es divisible entre 3, también lo es entre 3: quien cumple los dos criterios es divisible entre 6.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál es el número más grande que divide exactamente a 24 y a 40?', '4', '8', '2', '120', 'b', 1, 'Ese número es el MCD: 24 = 2³ × 3 y 40 = 2³ × 5 comparten 2³, que es 8.'),
      (v_semana_id, '¿Cuál es el número más pequeño que es múltiplo de 4 y de 10?', '2', '40', '20', '14', 'c', 2, 'Ese número es el MCM: 4 × 5 = 20 y 10 × 2 = 20, y antes de ese no hay otro múltiplo común.'),
      (v_semana_id, 'En la terminal de Puebla, un camión sale cada 15 minutos y otro cada 20. Si salen juntos a las 7:00, ¿a qué hora vuelven a salir juntos?', '7:05', '7:35', '8:00', '12:00', 'c', 3, 'Salen en ciclos distintos, así que se usa el MCM de 15 y 20, que es 60: coinciden 60 minutos después de las 7:00.');
  END IF;
END $$;

-- ----------- Matemáticas I (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas I'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas I" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto da 50 − 4 × 8?', '38', '18', '42', '368', 'b', 1, 'La multiplicación va antes que la resta: 4 × 8 = 32 y luego 50 − 32 = 18.'),
      (v_semana_id, '¿Cuánto da (−6) × (−9)?', '−54', '+54', '+15', '−15', 'b', 2, 'Los dos tienen signo negativo, y al multiplicar signos iguales dan positivo: 6 × 9 = 54.'),
      (v_semana_id, 'Para una posada hay 18 tamales y 30 buñuelos. Quieres armar platos idénticos con toda la comida, sin que sobre nada. ¿Cuántos platos puedes armar como máximo?', '90', '3', '2', '6', 'd', 3, 'Repartir sin que sobre nada pide el MCD: 18 = 2 × 3² y 30 = 2 × 3 × 5 comparten 2 × 3 = 6.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En la fracción 5/9, ¿qué indica el número 9?', 'En cuántas partes está dividido el todo', 'Cuántas partes tomaste de ese todo entero', 'Cuántas partes faltan para completar el todo', 'Cuántos enteros completos hay en total', 'a', 1, 'El 9 es el denominador, el número de abajo: señala en cuántas partes se dividió el todo.'),
      (v_semana_id, '¿Qué fracción impropia equivale a la fracción mixta 2 y 3/7?', '13/7', '12/7', '14/7', '17/7', 'd', 2, 'Se multiplica el entero por el denominador y se suma el numerador: (2 × 7) + 3 = 17. El denominador se conserva y queda 17/7.'),
      (v_semana_id, 'Si simplificas 16/28 dividiendo entre su MCD, ¿qué fracción queda?', '7/4', '4/28', '4/7', '2/7', 'c', 3, 'El MCD de 16 y 28 es 4; al dividir el numerador y el denominador entre 4 queda 4/7.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto es 3/4 + 1/5?', '11/20', '4/9', '19/20', '4/20', 'c', 1, 'Se usa el MCM de los denominadores, que es 20: 3/4 se vuelve 15/20 y a 1/5 le corresponde numerador 4. Como 15 + 4 = 19, el resultado es 19/20.'),
      (v_semana_id, 'Una receta pide 3/5 de kg de frijol y solo vas a preparar 1/2 de la receta. ¿Cuánto frijol necesitas?', '11/10 de kg', '6/5 de kg', '1/10 de kg', '3/10 de kg', 'd', 2, 'Se multiplica numerador por numerador y denominador por denominador: 3/5 × 1/2 = (3 × 1)/(5 × 2) = 3/10 de kg.'),
      (v_semana_id, '¿Cuánto es 1/6 ÷ 3/5?', '18/5', '4/11', '3/30', '5/18', 'd', 3, 'Se da la vuelta a la segunda fracción y se multiplica: 1/6 × 5/3 = 5/18.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En el número 2.947, ¿qué lugar ocupa el 4?', 'Unidades', 'Centésimos', 'Milésimos', 'Décimos', 'b', 1, 'El 4 es la segunda cifra después del punto, y esa posición corresponde a los centésimos.'),
      (v_semana_id, '¿Cuánto es 1.3 × 0.4?', '1.7', '5.2', '0.52', '0.052', 'c', 2, 'Sin el punto, 13 × 4 = 52. Cada factor tiene un decimal, así que el resultado lleva 2 decimales: 0.52.'),
      (v_semana_id, '¿Cuánto es 2.8 ÷ 0.7?', '4', '40', '1.96', '0.4', 'a', 3, 'Se multiplican los dos números por 10 para que el divisor sea entero: 28 ÷ 7 = 4.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuánto es el 30% de $260?', '$230', '$7.80', '$78', '$182', 'c', 1, 'Se divide el porcentaje entre 100 y se multiplica por el total: 0.30 × 260 = $78.'),
      (v_semana_id, 'De 20 mangos de una caja, 7 están verdes. ¿Qué porcentaje de los mangos está verde?', '7%', '35%', '13%', '65%', 'b', 2, 'Se divide la parte entre el total y se multiplica por 100: (7 ÷ 20) × 100 = 0.35 × 100 = 35%.'),
      (v_semana_id, 'Una mochila de $420 tiene 25% de descuento. ¿Cuánto pagas por ella?', '$105', '$525', '$395', '$315', 'd', 3, 'Con 25% de descuento se multiplica el precio original por (1 − 0.25): 420 × 0.75 = $315.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿En cuál de estos casos las dos razones forman una proporción?', '4/6 y 15/18', '5/8 y 15/18', '5/6 y 15/18', '5/6 y 14/18', 'c', 1, 'Sus productos cruzados son iguales: 5 × 18 = 90 y 6 × 15 = 90, por eso las dos razones son proporcionales.'),
      (v_semana_id, 'Si 3 metros de tela cuestan $96, ¿cuánto cuestan 8 metros de la misma tela?', '$256', '$36', '$288', '$101', 'a', 2, 'Más metros cuestan más, así que es una regla de tres directa: x = (8 × 96) ÷ 3 = $256.'),
      (v_semana_id, 'Para armar unas despensas, 8 voluntarios tardan 12 horas. Al mismo ritmo, ¿cuántas horas tardan 16 voluntarios?', '20 horas', '6 horas', '24 horas', '4 horas', 'b', 3, 'Con más voluntarios se tarda menos, así que es una regla de tres inversa: x = (8 × 12) ÷ 16 = 6 horas.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué mide el perímetro de una figura?', 'La longitud del lado más largo que tiene', 'El espacio que queda dentro de ella', 'La distancia entre su base y su punto alto', 'La distancia total alrededor de ella', 'd', 1, 'El perímetro recorre todo el contorno de la figura: es la suma de todos sus lados y se mide en unidades lineales.'),
      (v_semana_id, 'Una cancha rectangular mide 18 m de largo y 13 m de ancho. ¿Cuál es su perímetro?', '62 m', '49 m', '234 m', '31 m', 'a', 2, 'En el rectángulo se suman el largo y el ancho y se multiplica por 2: 2 × (18 + 13) = 62 m.'),
      (v_semana_id, 'Un letrero triangular tiene 22 cm de base y 3 cm de altura. ¿Cuál es su área?', '33 cm²', '132 cm²', '66 cm²', '25 cm²', 'a', 3, 'El área del triángulo es base por altura entre 2: (22 × 3) ÷ 2 = 33 cm².');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un contenedor con forma de prisma rectangular mide 12 m de largo, 2.5 m de ancho y 2 m de alto. ¿Cuál es su volumen?', '16.5 m³', '60 m³', '600 m³', '30 m³', 'b', 1, 'El volumen del prisma rectangular es largo por ancho por alto: 12 × 2.5 × 2 = 60 m³.'),
      (v_semana_id, 'Un cono mide 40 m³ de volumen. ¿Qué volumen tiene un cilindro con su mismo radio y su misma altura?', '13.33 m³', '160 m³', '120 m³', '80 m³', 'c', 2, 'El cono es la tercera parte del cilindro del mismo radio y altura, así que el cilindro vale tres conos: 40 × 3 = 120 m³.'),
      (v_semana_id, 'Una cisterna tiene un volumen de 3.5 m³. ¿Cuántos litros le caben?', '35,000 litros', '350 litros', '35 litros', '3,500 litros', 'd', 3, 'Cada metro cúbico equivale a 1,000 litros: 3.5 × 1,000 = 3,500 litros.');
  END IF;
END $$;

-- ----------- Matemáticas II (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas II'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas II" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál de estas cantidades representa menos de 1?', '2 y 1/3', '6/11', '11/6', '8/8', 'b', 1, 'Es una fracción propia: su numerador, 6, es menor que su denominador, 11, y las propias representan menos de 1.'),
      (v_semana_id, 'Con 4 impresoras se hacen 100 copias en 2 horas. ¿Cuántas copias se hacen con 6 impresoras en 4 horas?', '150 copias', '300 copias', '600 copias', '200 copias', 'b', 2, 'Hay más de dos variables y las dos razones son directas, así que se multiplica el dato por cada una: 100 × (6/4) × (4/2) = 300 copias.'),
      (v_semana_id, 'Un patio con forma de trapecio tiene bases de 11 m y 7 m, y 6 m de altura. ¿Cuál es su área?', '54 m²', '108 m²', '231 m²', '24 m²', 'a', 3, 'Se suman las bases, se multiplica por la altura y se divide entre 2: [(11 + 7) × 6] ÷ 2 = 54 m².');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Al simplificar 8y + 3y − 2, ¿qué expresión se obtiene?', '5y − 2', '9y', '11y² − 2', '11y − 2', 'd', 1, 'Para simplificar se suman los términos semejantes, 8y y 3y. El −2 no lleva variable, así que se queda igual.'),
      (v_semana_id, 'En la expresión 9m + 4, ¿cuál es el coeficiente?', '13', '9', 'm', '4', 'b', 2, 'El coeficiente es el número que multiplica a la variable; en este caso es el número que acompaña a la letra m.'),
      (v_semana_id, 'Un cerrajero cobra $150 fijos más $60 por cada hora de trabajo. ¿Cuánto cobra por 4 horas?', '$840', '$600', '$210', '$390', 'd', 3, 'El cobro se modela con la expresión 150 + 60h. Con h = 4 queda 150 + 240, y el resultado es el cobro total en pesos.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Qué significa resolver una ecuación?', 'Sumar todos los números que aparecen en la igualdad', 'Escribir la igualdad con otra letra como variable', 'Encontrar el valor que hace verdadera la igualdad', 'Pasar todos los términos al lado izquierdo del igual', 'c', 1, 'Resolver es hallar el valor de la variable con el que la igualdad se cumple.'),
      (v_semana_id, 'Resuelve la ecuación 4x − 6 = 18.', 'x = 20', 'x = 24', 'x = 6', 'x = 3', 'c', 2, 'Lo que se hace de un lado se hace del otro: se suma 6 en los dos lados y después se divide entre 4.'),
      (v_semana_id, 'Resuelve la ecuación 4(x + 3) = 28.', 'x = 16', 'x = 10', 'x = 7', 'x = 4', 'd', 3, 'Con paréntesis primero se distribuye: el 4 multiplica a la x y también al 3. Después se despeja x como en cualquier ecuación.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Desde el origen, ¿cómo llegas al punto (6, −2)?', '6 a la derecha y 2 hacia arriba', '2 a la derecha y 6 hacia abajo', '6 a la derecha y 2 hacia abajo', '6 a la izquierda y 2 hacia abajo', 'c', 1, 'El primer número indica el movimiento horizontal y el segundo, el vertical. Un valor positivo de x avanza a la derecha y uno negativo de y baja.'),
      (v_semana_id, '¿En qué cuadrante está el punto (−6, −1)?', 'Cuadrante III', 'Cuadrante II', 'Cuadrante I', 'Cuadrante IV', 'a', 2, 'El punto tiene x negativo y y negativo, y esa combinación de signos (−, −) corresponde al tercer cuadrante.'),
      (v_semana_id, 'En la ecuación y = 2x + 5, ¿qué punto le corresponde a x = −1?', '(−1, 7)', '(−1, 3)', '(3, −1)', '(1, 3)', 'b', 3, 'Se cambia x por −1 y se calcula 2(−1) + 5. El par ordenado lleva primero el valor de x y después el de y.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En una lista de 40 edades, los 13 años aparecen 12 veces. ¿Cuál es la frecuencia relativa de ese dato?', '40%', '30%', '12%', '70%', 'b', 1, 'La frecuencia relativa es el porcentaje que representa un dato del total: en este caso son 3 de cada 10 datos.'),
      (v_semana_id, 'Una ferretería quiere comparar cuántos martillos, clavos y brochas vendió en un mes. ¿Qué gráfica es ideal?', 'Gráfica de pastel', 'Gráfica de línea', 'Gráfica de barras', 'Histograma', 'c', 2, 'La gráfica de barras sirve para comparar categorías: cada barra es un producto y su altura es la frecuencia.'),
      (v_semana_id, '¿Qué distingue a un histograma de una gráfica de barras común?', 'Sus rebanadas representan porcentajes del total', 'Usa datos continuos y sus barras van pegadas', 'Su línea muestra cambios a lo largo del tiempo', 'Usa categorías y sus barras van separadas por espacio', 'b', 3, 'El histograma se parece a la gráfica de barras, pero se usa con datos como edades o pesos, y no deja espacio entre una barra y otra.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Una panadería vendió 14, 8, 6, 10 y 7 cajas de pan en cinco días. ¿Cuál es el promedio de cajas vendidas por día?', '9', '6', '8', '45', 'a', 1, 'El promedio suma todos los valores y divide el total entre los 5 días: el resultado es 9 cajas por día.'),
      (v_semana_id, '¿Cuál es la mediana de los datos 11, 4, 8 y 6?', '14', '6', '7.25', '7', 'd', 2, 'Con cantidad par de datos se ordenan de menor a mayor y se promedian los dos del centro; así la mediana es 7.'),
      (v_semana_id, 'En la lista 3, 5, 5, 8, 8, 9, ¿qué se puede decir de la moda?', 'Tiene dos modas: 5 y 8', 'Su única moda es el 9', 'No tiene moda', 'Su única moda es el 5', 'a', 3, 'El 5 y el 8 se repiten con la misma frecuencia y más que los demás datos, por eso la lista es bimodal.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En una gráfica de barras, el eje Y empieza en 500 y no en 0. ¿Qué efecto puede causar?', 'Una diferencia grande se ve muy pequeña', 'Una diferencia pequeña parece enorme', 'La fuente de los datos queda oculta', 'Las barras dejan de sumar el 100%', 'b', 1, 'Es un eje truncado: al no partir de 0, exagera lo que se ve aunque el cambio real sea poco.'),
      (v_semana_id, 'En una gráfica de línea de la asistencia a una biblioteca, la línea se mantiene pareja de enero a junio. ¿Qué indica?', 'Que la asistencia disminuyó', 'Que la gráfica no es confiable', 'Que la asistencia aumentó', 'Que la asistencia es estable', 'd', 2, 'Al leer una gráfica de línea se observa su forma: una línea que ni sube ni baja indica que lo medido se mantiene estable.'),
      (v_semana_id, 'Una gráfica tiene título, ejes y escala clara. ¿Qué más se necesita para confiar en ella?', 'La fuente de los datos', 'Más datos en el eje X', 'Una escala más grande', 'Un título más largo', 'a', 3, 'Una gráfica sin fuente no es confiable, aunque esté bien presentada: la fuente permite saber de dónde vienen los datos.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En una bolsa hay 15 dulces y 6 son de limón. Si sacas uno sin ver, ¿qué probabilidad hay de que sea de limón?', '2/5', '2/3', '3/5', '1/6', 'a', 1, 'Se dividen los casos favorables entre el total de casos posibles: 6 de 15, que al simplificar queda 2/5.'),
      (v_semana_id, 'La probabilidad de que un camión llegue tarde es 15%. ¿Cuál es la probabilidad de que llegue a tiempo?', '15%', '100%', '75%', '85%', 'd', 2, 'La probabilidad de un evento y la de su complemento suman 1: si llegar tarde es 0.15, llegar a tiempo es 0.85.'),
      (v_semana_id, 'Un jugador lleva varios tiros de dado sin sacar 6 y asegura que ahora sí le toca. ¿Cómo se llama ese error?', 'Eventos excluyentes', 'Evento seguro', 'Falacia del jugador', 'Evento complementario', 'c', 3, 'Cada tiro es independiente, así que los resultados anteriores no cambian la probabilidad del siguiente; pensar lo contrario es esta falacia.');
  END IF;
END $$;

-- ----------- Matemáticas III (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Matemáticas III'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Matemáticas III" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿En qué cuadrante está el punto (−7, 3)?', 'Cuadrante II', 'Cuadrante III', 'Cuadrante I', 'Cuadrante IV', 'a', 1, 'Con x negativo y y positivo, los signos (−, +) corresponden al cuadrante II.'),
      (v_semana_id, 'Si una lista ordenada tiene cantidad par de datos, ¿cómo se obtiene la mediana?', 'Se suman los datos y se dividen', 'Se promedian los dos del centro', 'Se toma el mayor de los dos del centro', 'Se toma el valor que más se repite', 'b', 2, 'La mediana es el valor del centro con los datos ordenados; con cantidad par quedan dos valores en el centro y se saca su promedio.'),
      (v_semana_id, 'En la escala de la probabilidad, ¿qué valor le corresponde a un evento seguro?', '0.5', '10', '1', '0', 'c', 3, 'La escala tiene como valor más alto el del evento que siempre ocurre: el evento seguro vale 1.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 1 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 1
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 1;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Escribías una tarea sin guardarla y la computadora se apagó de golpe. ¿Por qué se perdió lo que no guardaste?', 'Estaba en el disco duro, que se borra al apagar', 'Estaba en la RAM, que se borra al apagar', 'Estaba en el monitor, que se vacía al apagarse', 'Estaba en el procesador, que guarda lo último hecho', 'b', 1, 'Lo que usas en este momento está en la RAM, la memoria de trabajo, y esa memoria se borra cuando la computadora se apaga.'),
      (v_semana_id, 'En el salón conectan un monitor nuevo e instalan el programa Zoom. ¿Qué es cada uno?', 'El monitor es hardware y Zoom es software', 'Los dos son software porque se ven en la pantalla', 'Los dos son hardware porque están en la computadora', 'El monitor es software y Zoom es hardware', 'a', 2, 'El hardware se puede tocar, como la pantalla; el software son los programas, como las aplicaciones que instalas.'),
      (v_semana_id, '¿Qué tipo de computadora tiene torre, monitor, teclado y ratón separados?', 'Laptop', 'Teléfono inteligente', 'De escritorio', 'Tableta', 'c', 3, 'La computadora de escritorio es la clásica: sus piezas van separadas, a diferencia de los equipos que traen todo integrado.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 2 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 2
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 2;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuál de estos es un sistema operativo?', 'Chrome', 'Zoom', 'Linux', 'Word', 'c', 1, 'Linux es uno de los sistemas operativos más comunes, junto con Windows y macOS: el software principal que controla la computadora.'),
      (v_semana_id, 'Terminaste de usar un programa y quieres cerrar su ventana con el teclado. ¿Qué atajo usas?', 'Alt + F4', 'Ctrl + V', 'Ctrl + Z', 'Ctrl + X', 'a', 2, 'Alt + F4 es el atajo de teclado que cierra una ventana.'),
      (v_semana_id, 'Ana tiene su proyecto solo en la computadora y teme perderlo si el equipo se descompone. ¿Qué buena práctica le ayuda?', 'Guardarlo más seguido en la misma carpeta', 'Hacer una copia en USB o en la nube', 'Cambiarle el nombre por uno más descriptivo', 'Dejar un icono de acceso en el escritorio', 'b', 3, 'Una copia de seguridad fuera de la computadora conserva los archivos importantes aunque el equipo falle.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 3 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 3
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 3;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Vas en el camión, no hay WiFi cerca y necesitas abrir una página en tu celular. ¿Qué conexión usas?', 'Datos móviles', 'Cable HDMI', 'Cable Ethernet', 'WiFi de un router', 'a', 1, 'Los datos móviles se conectan a través de la red celular (4G, 5G), así que no dependen de una red de tu casa.'),
      (v_semana_id, 'La página de tu escuela acaba de cambiar y quieres ver la versión nueva sin cerrarla. ¿Qué usas?', 'El botón de atrás', 'La barra de direcciones', 'El botón de recarga', 'El botón de marcadores', 'c', 2, 'El botón de recarga sirve para actualizar la página que tienes abierta.'),
      (v_semana_id, 'Quieres aprender a preparar pozole rojo. ¿Qué búsqueda es la más efectiva?', 'cómo se hace la comida', 'receta pozole rojo', 'receta', 'comida mexicana rica', 'b', 3, 'Las palabras clave específicas dan mejores resultados que una palabra suelta o una frase general.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 4 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 4
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 4;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'En la dirección ana.ruiz@ejemplo.com, ¿cuál es el nombre de usuario?', '.com', 'ejemplo.com', 'ejemplo', 'ana.ruiz', 'd', 1, 'La dirección tiene la forma usuario@dominio.extensión: el usuario es lo que va antes de la arroba.'),
      (v_semana_id, 'Mandas un correo con Pedro en Para, Lucía en CC y Raúl en CCO. ¿De quién no saben los otros que recibió copia?', 'De Pedro', 'De Lucía y de Raúl', 'De Raúl', 'De Lucía', 'c', 2, 'Quien va en CCO (Con Copia Oculta) recibe copia, pero los otros destinatarios no lo saben.'),
      (v_semana_id, 'Tu primo recibió un correo a nombre de su banco que le pide su contraseña, y piensa contestarlo. ¿Qué le adviertes?', 'Que la mande solo si el correo trae logo', 'Que la escriba mejor en un archivo adjunto', 'Que la envíe con copia oculta para protegerla', 'Que los bancos nunca la piden por correo', 'd', 3, 'Ni los bancos ni el gobierno piden tu contraseña por correo; un mensaje así es señal de phishing.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 5 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 5
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 5;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Quieres que tu reporte formal tenga los dos márgenes parejos. ¿Qué alineación eliges?', 'Texto a la izquierda', 'Texto centrado', 'Texto justificado', 'Texto a la derecha', 'c', 1, 'La alineación justificada deja parejos los dos márgenes y es la más formal.'),
      (v_semana_id, 'Quieres dejar más espacio entre una línea y la siguiente de tu texto. ¿Qué ajustas?', 'El interlineado', 'La alineación', 'El tamaño de fuente', 'El tipo de letra', 'a', 2, 'El interlineado es el espacio entre líneas; en documentos formales se usan 1.5 o 2.0.'),
      (v_semana_id, 'Terminaste tu tarea y quieres imprimirla. ¿Qué atajo inicia la impresión?', 'Ctrl + U', 'Ctrl + B', 'Ctrl + I', 'Ctrl + P', 'd', 3, 'Ctrl + P abre la impresión, donde eliges la impresora y el número de copias.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 6 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 6
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 6;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, '¿Cuántas celdas abarca el rango B2:B6?', '5 celdas', '6 celdas', '4 celdas', '2 celdas', 'a', 1, 'Un rango incluye todas las celdas de la primera a la última: B2, B3, B4, B5 y B6.'),
      (v_semana_id, '¿Cuál de estas fórmulas está bien escrita?', 'PROMEDIO=(C2:C9)', '=PROMEDIO(C2:C9)', '(C2:C9)=PROMEDIO', 'PROMEDIO(C2:C9)=', 'b', 2, 'Toda fórmula empieza con el signo =, y después van la función y el rango entre paréntesis.'),
      (v_semana_id, 'Las celdas E1 a E4 tienen 12, 30, 8 y 25. ¿Qué número muestra =MAX(E1:E4)?', '25', '75', '8', '30', 'd', 3, '=MAX muestra el número más alto del rango, y entre esos cuatro valores el más alto es 30.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 7 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 7
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 7;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Un mensaje a nombre del IMSS dice que, si no contestas hoy, perderás tu servicio. ¿Qué señal de alarma de phishing muestra?', 'Usa una dirección de remitente extraña', 'Te amenaza con consecuencias urgentes', 'Trae un enlace ajeno a la institución', 'Te pide contraseñas o datos bancarios', 'b', 1, 'El phishing suele presionarte con una amenaza para que respondas de prisa y sin revisar; esa presión es una señal de alarma.'),
      (v_semana_id, '¿Cuál de estos es un tipo de malware?', 'Troyano', 'Spam', 'Antivirus', 'Phishing', 'a', 2, 'Malware significa software malicioso; los virus, los troyanos y el ransomware son sus ejemplos.'),
      (v_semana_id, 'Te llega por chat un aviso alarmante sobre tu escuela y no sabes si es cierto. ¿Qué haces?', 'Lo compartes aclarando que puede ser falso', 'Lo verificas antes de compartirlo', 'Lo reenvías para avisar a todos rápido', 'Lo publicas un rato y luego lo borras', 'b', 3, 'Compartir sin comprobar ayuda a difundir noticias falsas; por eso primero se revisa si la información es cierta.');
  END IF;
END $$;

-- ----------- Tecnología y Vida Digital (secundaria) - Semana 8 -----------
DO $$
DECLARE v_semana_id UUID;
BEGIN
  SELECT s.id INTO v_semana_id
  FROM public.semanas s
  JOIN public.meses_contenido mc ON mc.id = s.mes_id
  JOIN public.materias m ON m.id = mc.materia_id
  WHERE m.nombre = 'Tecnología y Vida Digital'
    AND m.nivel = 'secundaria'
    AND s.numero_semana = 8
  LIMIT 1;
  
  IF v_semana_id IS NULL THEN
    RAISE NOTICE 'Semana % de "Tecnología y Vida Digital" (secundaria) no encontrada, saltando', 8;
  ELSE
    DELETE FROM public.quiz_semana WHERE semana_id = v_semana_id;
    INSERT INTO public.quiz_semana (semana_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden, explicacion) VALUES
      (v_semana_id, 'Necesitas tener abiertas al mismo tiempo varias páginas en el navegador. ¿Qué usas?', 'Los marcadores', 'El botón de recarga', 'La barra de direcciones', 'Las pestañas', 'd', 1, 'Las pestañas del navegador sirven para abrir varias páginas a la vez.'),
      (v_semana_id, 'Las celdas C1 a C3 tienen 150, 200 y 50. ¿Qué número muestra =SUMA(C1:C3)?', '200', '50', '400', '350', 'c', 2, '=SUMA suma todos los números del rango: 150 + 200 + 50 da 400.'),
      (v_semana_id, '¿Qué acción cuida tu privacidad en redes sociales?', 'Publicar tus horarios solo de vez en cuando', 'Compartir tus datos solo en tu foto de perfil', 'Aceptar a cualquiera que te envíe solicitud', 'Configurar quién puede ver tus publicaciones', 'd', 3, 'Elegir quién ve lo que publicas, sin poner tu dirección ni datos de tu rutina, protege tu privacidad.');
  END IF;
END $$;

COMMIT;
