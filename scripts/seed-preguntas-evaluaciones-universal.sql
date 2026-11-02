-- ============================================================
-- seed-preguntas-evaluaciones-universal.sql
-- ============================================================
-- GENERADO desde banco-materias-sec-prepa (scripts/aplicar_reactivos.py --plantilla).
-- NO editar aquí: se corrige reactivos/ en el banco, se regenera y se vuelve a copiar.
--
-- 240 preguntas (24 materias × 10), con al menos 1 de cada semana con tema.
-- Más las 25 del demo, que no se generan: se conservan tal cual.
-- ============================================================
-- IDEMPOTENTE en 2 capas:
--   1. DELETE inicial elimina preguntas con patrón Bug C
--      (opcion_a idéntica en >=3 preguntas de la misma evaluación).
--   2. ON CONFLICT (evaluacion_id, pregunta) DO NOTHING — requiere la
--      UNIQUE constraint preguntas_evaluacion_pregunta_unique definida
--      en schema.sql (Bug 33 fix). Sin esa constraint el ON CONFLICT
--      sería letra muerta y este seed duplicaría en cada re-ejecución.
-- Seguro re-ejecutar en cualquier cliente nuevo.
-- ============================================================

BEGIN;

-- 1. Eliminar preguntas placeholder con patrón Bug C
--    (opcion_a idéntica en ≥3 preguntas de la misma evaluación)
DELETE FROM preguntas
WHERE evaluacion_id IN (
  SELECT evaluacion_id FROM preguntas
  GROUP BY evaluacion_id
  HAVING COUNT(DISTINCT opcion_a) < 3
    AND COUNT(*) >= 3
);

-- 2. Insertar preguntas reales matcheando por título evaluación + nombre materia
--    Total: 240 preguntas en 24 evaluaciones

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una crónica dice: «Tras la sequía, la cosecha de maíz de la comunidad cayó a la mitad y varias familias dejaron el pueblo». ¿Qué afirmación es producto de una lectura inferencial?', 'Varias familias dejaron el pueblo después de la sequía', 'La cosecha de maíz cayó a la mitad tras la sequía', 'La mala cosecha pudo empujar a esas familias a irse', 'La crónica exagera y debería citar datos oficiales', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Karla necesita encontrar, en un informe de 40 páginas, el año en que se fundó una cooperativa. ¿Qué tipo de lectura le conviene?', 'Lectura extensiva', 'Scanning', 'Skimming', 'Lectura intensiva', 'b', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En una noticia sobre un nuevo tren, una reportera pone primero la fecha de arranque y la ruta, y deja para después los detalles del diseño de los vagones. ¿Qué principio sigue?', 'La jerarquía de fuentes', 'La estructura argumentativa', 'La pirámide invertida', 'Las 5W del periodismo', 'c', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En un texto argumentativo, ¿para qué menciona el autor posiciones contrarias a su tesis?', 'Para mostrar que no tiene una postura propia', 'Para aportar datos concretos a sus argumentos', 'Para cambiar su tesis por una más moderada', 'Para refutarlas dentro de su argumentación', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un comentarista de radio rechaza un estudio sobre el río Lerma diciendo: «¿Qué va a saber de agua esa investigadora, si ni siquiera es de aquí?». ¿Qué falacia comete?', 'Apelación a la autoridad', 'Pendiente resbaladiza', 'Ad hominem', 'Falso dilema', 'c', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una guía turística de Puebla dice: «El volcán vigila a la ciudad desde hace siglos». ¿Qué figura literaria aparece?', 'Símil o comparación', 'Personificación', 'Antítesis', 'Hipérbole', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una candidata promete «abrir las puertas del mañana». ¿Para qué le sirve a quien la escucha reconocer el recurso que usa?', 'Para darse cuenta de cómo busca persuadirlo', 'Para saber si la candidata cumplirá su promesa', 'Para convertir la frase en un dato verificable', 'Para decidir si el discurso es literario o político', 'a', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un vecino dice: «Toda la colonia usa ese remedio, así que debe funcionar». ¿Qué sesgo cognitivo muestra?', 'Sesgo de anclaje', 'Efecto halo', 'Sesgo de confirmación', 'Efecto bandwagon', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un reportaje presume cuántos jóvenes recibieron una beca, pero nunca dice cuántos la solicitaron. ¿Qué pregunta del pensador crítico conviene hacerse?', '¿Qué información falta?', '¿Quién dice esto?', '¿La lógica es correcta?', '¿Qué evidencia presenta?', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué distingue a la síntesis del resumen?', 'La síntesis integra varios textos; el resumen condensa uno', 'La síntesis copia frases del autor; el resumen las cambia', 'La síntesis omite las fuentes; el resumen siempre las cita', 'La síntesis condensa un texto; el resumen integra varios', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comprensión lectora I' AND e.titulo = 'Examen Final — Comprensión lectora I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué función cumple el sistema operativo en una computadora?', 'Es la placa que conecta sus componentes', 'Es el software principal que la controla', 'Es la pantalla con íconos y barra de tareas', 'Es la memoria que guarda lo que se usa', 'b', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Sandra tiene doce pestañas abiertas y quiere cerrar la que ya no usa sin tocar el ratón. ¿Qué atajo emplea?', 'Ctrl+L', 'Ctrl+D', 'Ctrl+W', 'Ctrl+T', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Tomás quiere resultados sobre Benito Juárez que provengan solo de Wikipedia. ¿Qué búsqueda escribe?', 'Benito Juárez -wikipedia.org', 'filetype:wikipedia.org Benito Juárez', '"wikipedia.org Benito Juárez"', 'site:wikipedia.org Benito Juárez', 'd', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Fernanda redacta un reclamo y pone todo en mayúsculas para que se note su molestia. ¿Qué indica la etiqueta digital?', 'Debe usarlo solo con personas de confianza', 'Debe evitarlo, porque equivale a gritar', 'Puede hacerlo si el tema es urgente de verdad', 'Puede hacerlo si antes revisa la ortografía', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Ana Ruiz abre una cuenta de correo para solicitar una beca. ¿Qué dirección sigue el consejo de usar un usuario profesional?', 'ana.ruiz.m@gmail.com', 'reina_ana99@gmail.com', 'lachida07@gmail.com', 'anita_bonita@gmail.com', 'a', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Marcos escribió los títulos de su ensayo con negritas a 18 puntos. ¿Qué debe hacer, según lo visto en la semana?', 'Aplicar los estilos de encabezado a sus títulos', 'Subir el tamaño hasta que se distingan mejor', 'Subrayarlos con Ctrl+U para que sobresalgan', 'Cambiarlos a una fuente distinta a la del texto', 'a', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un equipo revisa una presentación: títulos de 40 puntos, cuerpo de 20 puntos, texto negro sobre fondo blanco y una sola fuente. ¿Qué debe corregir?', 'La fuente, porque cada parte requiere otra', 'El fondo, porque el contraste pide uno oscuro', 'El cuerpo, porque el mínimo es de 24 puntos', 'Los títulos, porque el máximo es de 36 puntos', 'c', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Frente a guardar solo en su computadora, ¿qué ventaja obtiene Héctor al usar la nube?', 'Sus archivos solo abren en la computadora donde los creó', 'Abre sus archivos en cualquier lugar aunque no tenga internet', 'Sus archivos quedan dentro de la memoria RAM de su equipo', 'Abre sus archivos desde cualquier dispositivo con internet', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Antes de subir un comentario agresivo sobre un maestro, Sebastián aplica el consejo sobre la huella digital. ¿Qué se pregunta?', '¿Cuántos likes y comentarios podría conseguir con esto?', '¿Mi contraseña es distinta en este sitio?', '¿Se borrará esto cuando cierre mi sesión?', '¿Me sentiría cómodo si mi futuro jefe viera esto?', 'd', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Arturo pega en su ensayo dos párrafos de un sitio y los presenta como suyos, sin citar de dónde salieron. ¿Qué falta comete?', 'Ciberbullying', 'Phishing', 'Plagio', 'Spam', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Comunicación digital' AND e.titulo = 'Examen Final — Comunicación digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál de estos números no se puede escribir como fracción a/b?', '0.333...', '-3', '0.75', '√2', 'd', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuánto vale 20 - 12 ÷ 4 + 1?', '16', '3', '18', '17.6', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una cinta mide 5/6 de metro y se corta un pedazo de 1/4 de metro. ¿Cuánto queda?', '7/12 de metro', '2/3 de metro', '5/12 de metro', '7/24 de metro', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es el resultado de 4/7 × 2/3?', '6/10', '12/14', '8/21', '8/10', 'c', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la expresión 7x² - 4x + 5, ¿cuál es el coeficiente del término con exponente 2?', '5', '7', '-4', '2', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la solución de 3(x - 2) = x + 8?', 'x = 5', 'x = 7', 'x = 3.5', 'x = 1', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En 4x - 9 = 31, ¿qué paso deja sola a la expresión 4x sin romper la igualdad?', 'Restar 4 a ambos lados', 'Sumar 9 solo al lado izquierdo', 'Restar 9 a ambos lados', 'Sumar 9 a ambos lados', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Unos tenis de $800 tienen 15% de descuento. ¿Cuál es su precio final?', '$920', '$680', '$120', '$785', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál de estas igualdades forma una proporción?', '3/5 = 6/10', '3/5 = 5/10', '3/5 = 4/10', '3/5 = 6/15', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una jardinera con forma de trapecio tiene base mayor de 11 m, base menor de 7 m y altura de 4 m. ¿Cuál es su área?', '36 m²', '22 m²', '72 m²', '44 m²', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático I' AND e.titulo = 'Examen Final — Conocimiento matemático I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es el resultado de (5x + 7)(5x - 7)?', '25x² - 49', '5x² - 7', '25x² - 70x + 49', '25x² + 49', 'a', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se factoriza 36x² - 49?', '(18x + 7)(18x - 7)', '(6x - 7)²', '(36x + 7)(x - 7)', '(6x + 7)(6x - 7)', 'd', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Factoriza por completo 6x² - 54. ¿Qué resultado es correcto?', '6(x + 3)(x - 3)', '3(x + 3)(x - 3)', '6(x - 3)(x - 3)', '6(x + 9)(x - 9)', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué expresión se obtiene al simplificar 7 - (3x - 2)?', '5 + 3x', '9 - 3x', '9 + 3x', '5 - 3x', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una torta y un refresco cuestan $65; una torta y tres refrescos cuestan $105. ¿Cuánto cuesta un refresco?', '$40', '$35', '$20', '$45', 'c', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué intervalo es la solución de 1 ≤ 2x - 3 < 9?', '[2, 6]', '(2, 6]', '[2, 6)', '(2, 6)', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se representa x ≤ -1 en la recta numérica?', 'Círculo vacío en -1 y flecha a la izquierda', 'Círculo lleno en -1 y flecha a la izquierda', 'Círculo lleno en -1 y flecha a la derecha', 'Círculo vacío en -1 y flecha a la derecha', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué ecuación describe la recta de pendiente 4 que contiene al punto (2, -1)?', 'y = 4x + 7', 'y = 4x - 9', 'y = 4x + 9', 'y = 4x - 7', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Si una recta tiene pendiente 3/4, ¿qué pendiente tiene cualquier recta perpendicular a ella?', '-3/4', '4/3', '3/4', '-4/3', 'd', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué ecuación tiene la recta que une P(1, 6) con Q(3, 12)?', 'y = 2x + 4', 'y = 3x + 6', 'y = 3x + 3', 'y = 3x - 3', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Conocimiento matemático II' AND e.titulo = 'Examen Final — Conocimiento matemático II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué describe mejor la dimensión espiritual de la salud?', 'Tener propósito y valores, con o sin religión', 'Mantener relaciones sanas y redes de apoyo', 'Practicar una religión de manera constante', 'Manejar las emociones y pensar con claridad', 'a', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según el valor normal estudiado, ¿qué lectura de presión arterial está dentro de lo normal?', '118/85 mmHg', '120/80 mmHg', '118/76 mmHg', '132/78 mmHg', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué recomendación sobre el agua corresponde a lo estudiado?', '6 a 8 vasos diarios, más si hay ejercicio o calor', '6 a 8 vasos diarios, sin importar ejercicio ni calor', '3 a 4 vasos diarios, más si hay ejercicio o calor', '10 a 12 vasos diarios, sin importar ejercicio ni calor', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué lista reúne solo fuentes de grasas insaturadas?', 'Frituras, manteca, nueces y aceite de oliva', 'Aguacate, aceite de oliva, nueces y pescado', 'Aguacate, manteca, frituras y pescado', 'Comida ultraprocesada, frituras y manteca', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según lo estudiado, ¿qué suele provocar saltarse comidas para bajar de peso?', 'Dejar de sentir hambre con el paso de los días', 'Comer más después por hambre extrema', 'Quemar primero la grasa acumulada', 'Bajar de peso sin efecto sobre el hambre', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál de estas situaciones es una señal de que te estás excediendo con el ejercicio?', 'Mareo o náusea durante el ejercicio', 'Cansancio que se recupera al descansar', 'Frecuencia cardíaca elevada al correr', 'Molestia muscular normal tras entrenar', 'a', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué sistema activa la respiración profunda y qué efecto produce?', 'El digestivo, que procesa los alimentos', 'El endocrino, que libera hormonas', 'El simpático, que prepara para la acción', 'El parasimpático, que produce calma', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un compañero lleva tres semanas con síntomas de ansiedad que le impiden ir a clases. ¿Qué es lo más adecuado?', 'Pedir ayuda profesional solo si presenta síntomas físicos', 'Limitar sus redes sociales y esperar a que desaparezcan', 'Esperar a que se cumplan 2 meses antes de buscar ayuda', 'Buscar ayuda profesional, pues ya pasaron más de 2 semanas', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una estudiante lleva 25 minutos en la cama sin poder dormir. ¿Qué conviene hacer?', 'Quedarse acostada hasta que por fin llegue el sueño', 'Revisar el celular en la cama hasta sentir cansancio', 'Levantarse y hacer algo tranquilo hasta tener sueño', 'Hacer ejercicio intenso para cansar el cuerpo', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Mateo quiere ser enfermero, tiene planeados sus próximos años de estudio y evita el alcohol porque podría estorbarle. ¿Qué factor de protección muestra?', 'Información veraz sobre sustancias', 'Proyecto de vida claro', 'Redes de apoyo con familia y amigos', 'Manejo saludable del estrés', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Estilo de vida saludable' AND e.titulo = 'Examen Final — Estilo de vida saludable'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un joven mexica quiere dedicarse al canto y la danza. ¿Qué escuela estaba dedicada a lo que le interesa?', 'Calmécac', 'Telpochcalli', 'Cuicacalli', 'Colegio de Tlatelolco', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué muestra el Colegio de Santa Cruz de Tlatelolco sobre la educación superior en la colonia?', 'Se reservó a frailes franciscanos y dominicos', 'Se abrió a indígenas, pero solo a los nobles', 'Se abrió a indígenas de cualquier origen social', 'Se reservó a peninsulares y criollos', 'b', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué hecho permite reconocer la etapa de consumación de la Independencia?', 'Morelos escribe y convoca al Congreso de Chilpancingo', 'Iturbide se une a la causa y surge el Plan de Iguala', 'Guerrero sostiene la lucha mediante guerrillas', 'Hidalgo da el Grito y arranca un movimiento popular', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un criollo de 1810 lee textos que defienden la libertad y la igualdad. ¿Qué causa de la Independencia ilustra?', 'La desigualdad de las castas', 'La crisis económica en la colonia', 'Las ideas de la Ilustración', 'La invasión de Napoleón', 'c', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué describe mejor el panorama de México en los años previos a la Reforma?', 'Caos político: Benito Juárez gobernó 11 veces', 'Paz política: Santa Anna gobernó durante 35 años', 'Paz política: Benito Juárez gobernó durante 35 años', 'Caos político: Santa Anna gobernó 11 veces', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un historiador busca la norma de la Reforma en la que quedó la separación total entre la Iglesia y el Estado. ¿Cuál debe consultar?', 'La Ley de Nacionalización (1859)', 'La Ley Juárez (1855)', 'La Ley Lerdo (1856)', 'La Constitución de 1857', 'a', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué combinación resume las causas de la Revolución Mexicana?', 'Intervención francesa, castas y fueros eclesiásticos', 'Dictadura, desigualdad, represión y explotación laboral', 'Invasión extranjera, crisis agraria y pérdida de territorio', 'Reelección de Juárez, castas y analfabetismo', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'De las medidas educativas de la lección, ¿cuál cambió el enfoque educativo en lugar de extender la obligatoriedad de un nivel?', 'La Nueva Escuela Mexicana (2019)', 'La creación de la SEP (1921)', 'La secundaria obligatoria (1993)', 'El bachillerato obligatorio (2012)', 'a', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una alumna vive en una ranchería sin plantel cercano y trabaja por las tardes. Según la lección, ¿por qué le conviene el bachillerato virtual?', 'Supera barreras geográficas y de tiempo', 'Solo tiene validez para quienes ya trabajan', 'Es más barato que cualquier otra modalidad en todos los casos', 'No exige entregar tareas ni presentar exámenes', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En el extranjero, mucha gente identifica el mariachi, el tequila y la charrería como lo mexicano. ¿Qué ilustra esto según la lección?', 'Que son tradiciones recientes de la vida urbana', 'Que esos símbolos nacieron en la Ciudad de México colonial', 'Que Jalisco los adoptó de otras regiones del país', 'Que la cultura de Jalisco dio forma a esos símbolos', 'd', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Historia e identidad universitaria' AND e.titulo = 'Examen Final — Historia e identidad universitaria'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Llegas a las 9 de la noche a una cena familiar. ¿Cómo saludas en inglés?', 'Good afternoon', 'Good evening', 'See you later', 'Good night', 'b', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Convierte en pregunta la oración «You are from Mexico.»', 'Are you from Mexico?', 'Is you from Mexico?', 'Am you from Mexico?', 'You are from Mexico?', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué mes llega justo después de June?', 'January', 'August', 'May', 'July', 'd', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Hablas de una manzana específica, la que está en la mesa. ¿Qué frase usas?', 'An apple on the table', 'The apple on the table', 'A apple on the table', 'Apple on the table', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Escribes «dos pies» en inglés. ¿Cuál es la forma correcta?', 'two feet', 'two footes', 'two foots', 'two feets', 'a', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Completa con el verbo go: «Ana ___ to school on Mondays.»', 'goies', 'gos', 'go', 'goes', 'd', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿En cuál de estos casos se usa el presente simple?', 'Algo que ocurre justo ahora', 'Un plan para el próximo año', 'Una acción que hiciste ayer', 'Lo que haces todos los lunes', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Alguien pregunta «Do they like music?» y la respuesta es no. ¿Cuál es la respuesta corta correcta?', 'No, they doesn''t.', 'No, they don''t.', 'No, they aren''t.', 'No, they not.', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se dice en inglés «Nosotros no vivimos aquí»?', 'We aren''t live here.', 'We doesn''t live here.', 'We don''t live here.', 'We don''t lives here.', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Vas a tomar un avión. ¿A qué lugar vas?', 'Supermarket', 'Bus station', 'Airport', 'Library', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 1' AND e.titulo = 'Examen Final — Inglés nivel 1'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Convierte en pregunta la oración «They are sleeping.»', 'Are they sleep?', 'Do they are sleeping?', 'Are they sleeping?', 'Do they sleeping?', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres saber si Ana bailó ayer. ¿Qué pregunta es correcta?', 'Did Ana dance yesterday?', 'Danced Ana yesterday?', 'Did Ana danced yesterday?', 'Does Ana dance yesterday?', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿A qué verbo base y significado corresponde el pasado «thought»?', 'think: pensar', 'take: tomar', 'find: encontrar', 'tell: contar', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres decir que tú y tus amigos no estaban cansados ayer. ¿Qué oración es correcta?', 'We wasn''t tired yesterday.', 'We aren''t tired yesterday.', 'We didn''t tired yesterday.', 'We weren''t tired yesterday.', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la forma negativa de «We will open it.»?', 'We willn''t open it.', 'We will don''t open it.', 'We don''t will open it.', 'We won''t open it.', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Ya agendaste ver a Luis hoy a las 5. ¿Qué oración expresa ese plan confirmado?', 'I meet Luis at 5.', 'I was meeting Luis at 5.', 'I''m meeting Luis at 5.', 'I''m meet Luis at 5.', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Compara «Students must arrive on time» con «I have to work tomorrow». ¿Qué las distingue?', 'Must suele pedir algo con formalidad; have to, expresar algo ya terminado', 'Must suele venir de una regla escrita; have to, de las circunstancias', 'Must suele hablar de una habilidad; have to, de un permiso de quien habla', 'Must suele expresar un consejo amable; have to, una prohibición escrita', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres decir que sabías manejar cuando tenías 20 años. ¿Qué oración es correcta?', 'I could drive when I was 20.', 'I can drive when I was 20.', 'I should drive when I was 20.', 'I must drive when I was 20.', 'a', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la traducción correcta de «hombros, espalda y rodillas»?', 'shoulders, chest and knees', 'shoulders, back and knees', 'neck, back and legs', 'arms, stomach and knees', 'b', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Lees este fragmento: «I''m going to live in a small apartment near the campus. My parents said they will help me with the rent.» ¿Quién ayudará con la renta?', 'Los hermanos de quien escribe', 'Los amigos de quien escribe', 'Los padres de quien escribe', 'Los maestros de quien escribe', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés nivel 2' AND e.titulo = 'Examen Final — Inglés nivel 2'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un locutor de radio hace una pregunta al aire y una oyente le da su respuesta por teléfono. ¿Qué elemento de la comunicación es esa respuesta?', 'El código', 'El canal', 'La retroalimentación', 'El contexto', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una estudiante graba un podcast en el que explica un tema con sus propias palabras. ¿Qué tipo de lenguaje usa principalmente?', 'Verbal oral', 'No verbal kinésico', 'Verbal escrito', 'No verbal proxémico', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué diferencia principal hay entre un texto expositivo y uno argumentativo?', 'El expositivo narra una historia; el argumentativo describe con adjetivos', 'El expositivo detalla cómo es algo; el argumentativo cuenta unos hechos', 'El expositivo busca convencer; el argumentativo informa con objetividad', 'El expositivo informa con objetividad; el argumentativo busca convencer', 'd', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Para hallar la idea principal, Iván subraya de inmediato la primera oración del párrafo. ¿Qué debió hacer primero?', 'Anotar los datos más curiosos', 'Leer el texto completo una vez sin detenerse', 'Comprobar si la fuente es confiable', 'Reescribir el párrafo con sus palabras', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un alumno afirma que «mesa» carece de acento porque no lleva tilde. ¿Por qué se equivoca?', 'Olvida que «mesa» se escribe con tilde diacrítica', 'Confunde la tilde, que es fuerza de voz, con el acento', 'Olvida que toda palabra grave lleva tilde sin excepción', 'Confunde el acento, que es fuerza de voz, con la tilde', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Para decidir si una palabra esdrújula lleva tilde, ¿qué hay que revisar en su terminación?', 'Que no termine en N, S o vocal, como las graves', 'Que termine en N, S o vocal, como las agudas', 'Que exista otra palabra igual con otro significado', 'Nada, porque las esdrújulas siempre llevan tilde', 'd', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En «Los alumnos de segundo, entregaron la tarea», ¿qué error tiene la coma?', 'Separa el sujeto del verbo, algo que no se permite', 'Marca un vocativo, aunque nadie es llamado aquí', 'Cierra un inciso que no se abrió con otra coma', 'Enumera elementos sin colocar la conjunción final', 'a', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una alumna escribe sobre los volcanes de México y, al acabar una idea, quiere pasar a un tema distinto. ¿Qué signo debe poner al final de esa oración?', 'Punto y coma, porque une dos ideas relacionadas', 'Punto y aparte, porque empieza una idea diferente', 'Punto y seguido, porque sigue en el mismo párrafo', 'Punto final, porque con él termina el texto entero', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un alumno entrega este párrafo: «El café de Chiapas se cultiva en zonas de montaña. Sus granos se cosechan a mano. Mi primo juega beisbol en la escuela. Después, los granos se secan al sol». ¿Qué error tiene?', 'Es demasiado largo para ser un párrafo', 'Es demasiado corto para ser un párrafo', 'Cambia de tema sin avisar al lector', 'Repite varias veces la misma idea', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una alumna resume un artículo y agrega al final: «Me pareció exagerado». ¿Qué regla del resumen rompe?', 'Debe medir más de la mitad del original', 'No debe incluir opiniones personales', 'Debe cerrar reafirmando una postura', 'Debe copiar literal las ideas del texto', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Lengua y comunicación I' AND e.titulo = 'Examen Final — Lengua y comunicación I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una tiendita revisa sus ventas y nota que los refrescos se agotan cada quincena, así que decide pedir más antes de esas fechas. ¿Qué pilar le permitió detectarlo?', 'Reconocimiento de patrones', 'Abstracción', 'Descomposición', 'Diseño de algoritmos', 'a', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En el algoritmo del sándwich, ¿por qué no se puede agregar el jamón antes de sacar el pan?', 'Porque las mismas entradas dan el mismo resultado', 'Porque cada paso debe estar definido claramente', 'Porque los pasos van en una secuencia lógica', 'Porque el algoritmo debe tener un inicio y un fin', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Si x vale 9, ¿qué comparación devuelve verdadero?', 'x != 9', 'x >= 9', 'x < 9', 'x > 9', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Dentro de un SI hay que revisar si turno vale 2. ¿Qué operador se usa y por qué?', '==, porque guarda el valor 2 en turno', '=, porque guarda el valor 2 en turno', '=, porque compara turno con el valor 2', '==, porque compara turno con el valor 2', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'SI nota >= 9 ENTONCES ESCRIBIR «Excelente» SINO SI nota >= 7 ENTONCES ESCRIBIR «Bueno» FIN SI. Con nota 5, el programa no escribe nada. ¿Qué error común muestra?', 'Poner una condición que nunca se cumple', 'No cubrir todos los casos posibles', 'Confundir la asignación con la comparación', 'Repetir la misma condición dos veces', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la tabla de multiplicar con ciclo PARA, el usuario escribe 9. ¿Qué resultado se imprime cuando i vale 4?', '90', '13', '36', '45', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una app debe mostrar el mismo aviso 200 veces. ¿Qué ventaja da usar un ciclo?', 'Repite la acción sin duplicar la instrucción', 'Guarda los 200 avisos en una misma variable de texto', 'Decide entre dos acciones según una sola condición', 'Hace que cada aviso se muestre con un texto distinto', 'a', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la base de datos de la escuela que presenta el tema, ¿qué campo conecta la tabla Calificaciones con la tabla Alumnos?', 'email', 'materia_id', 'matrícula', 'alumno_id', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un rango tiene 5 celdas con números, 2 con texto y 3 vacías. ¿Qué valor da =CONTARA en ese rango?', '3', '10', '5', '7', 'd', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Frente a los cambios de la IA en el mercado laboral, ¿qué señala el tema como lo más importante?', 'Aprender a trabajar con la IA como herramienta', 'Aprender a programar IA para no depender de ella', 'Cambiar a un trabajo sin tareas repetitivas', 'Esperar a que llegue la IA General para adaptarse', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Pensamiento digital y programación básica' AND e.titulo = 'Examen Final — Pensamiento digital y programación básica'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un cantante usa falda y maquillaje en sus presentaciones. Con ese único dato, ¿qué se puede afirmar?', 'Que esa ropa indica un cambio en su sexo biológico', 'Que esa ropa forma parte de su expresión de género', 'Que esa ropa define cuál es su orientación sexual', 'Que esa ropa revela cuál es su identidad de género', 'b', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué estructuras del aparato reproductor masculino producen el líquido seminal?', 'Las vesículas seminales y la próstata', 'La uretra y el epidídimo', 'El epidídimo y los conductos deferentes', 'Los testículos y el escroto', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué doble función cumplen los ovarios?', 'Transportar los óvulos hacia el útero y recibir la fecundación', 'Alojar el embarazo y conectar las trompas con la vagina', 'Producir óvulos y hormonas como estrógeno y progesterona', 'Producir óvulos, pero ninguna hormona sexual', 'c', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un joven empieza a preguntarse quién es, qué le gusta y qué quiere para su vida. ¿A qué cambio emocional de la adolescencia corresponde?', 'Mayor necesidad de privacidad', 'Cambios de humor frecuentes', 'Inseguridad sobre la apariencia', 'Búsqueda de identidad propia', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué característica de la clamidia y la gonorrea complica detectarlas a tiempo?', 'Se curan solas sin necesidad de tratamiento', 'Solo aparecen en personas que ya tienen VIH', 'Los antibióticos no sirven para tratarlas', 'A menudo no presentan síntomas', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué infección es la ITS más común y cuenta con una vacuna?', 'Herpes genital', 'VPH', 'VIH', 'Sífilis', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Al revisar a dónde acudir, ¿qué instancia corresponde específicamente a las denuncias penales?', 'Un centro de salud público', 'El DIF', 'La Línea de la Vida', 'La Fiscalía del estado', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un jefe invita a salir a su empleada, quien teme perder el trabajo si se niega. ¿Por qué ese consentimiento no sería válido?', 'Porque existe una relación de poder desigual', 'Porque la persona está bajo efectos de sustancias', 'Porque aceptar una cosa implica aceptar todo', 'Porque falta información sobre lo que va a pasar', 'a', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Dos personas en pareja deben decidir si se mudan de ciudad por el trabajo de una de ellas. ¿Qué forma de decidir refleja una relación saludable?', 'Decide la persona que aporta más dinero para el hogar', 'Decide la persona con más experiencia para evitar discusiones', 'Lo platican y deciden juntos, con igual peso para cada opinión', 'Deciden por turnos, aunque en cada turno una persona no esté de acuerdo', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué la frase «el rosa es de niñas, el azul de niños» es un estereotipo de género?', 'Porque refleja la identidad interna de cada persona', 'Porque generaliza cómo deben ser niñas y niños', 'Porque la establece una ley mexicana de igualdad', 'Porque describe una diferencia biológica del sexo', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Sexualidad y género' AND e.titulo = 'Examen Final — Sexualidad y género'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según la semana, ¿por qué el bachillerato virtual requiere más autodisciplina que el presencial?', 'Porque sus exámenes se aplican en horarios fijos y sin aviso', 'Porque su plan incluye más materias que el presencial', 'Porque los tutores revisan a diario el avance de cada uno', 'Porque estudiar es responsabilidad total del alumno', 'd', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Karla aprende mejor con diagramas, aunque también le ayuda mucho tomar notas a mano. ¿Cómo se interpreta su caso según lo visto sobre VARK?', 'Su estilo real es el kinestésico, porque usa mucho las manos', 'Aún no descubre cuál es el único estilo que le corresponde', 'Tiene un estilo dominante y uno secundario, como la mayoría', 'Debe dejar uno de los dos estilos para no confundir lo aprendido', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según la semana, ¿para qué tipo de temas son excelentes los mapas mentales?', 'Para ideas que caben en una sola oración', 'Para temas con muchas conexiones entre sí', 'Para datos sueltos que solo se memorizan', 'Para ejercicios de cálculo paso por paso', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Ana y Brenda dedican 6 horas a un mismo tema: Ana las reparte en varios días cada vez más separados y Brenda las hace todas la noche antes del examen. ¿Quién retiene mejor y por qué?', 'Brenda, porque un maratón evita olvidar lo ya leído', 'Brenda, porque tiene todo fresco el día del examen', 'Ana, porque se retiene mejor con repasos espaciados', 'Ana, porque descansa más entre sesiones y se cansa menos', 'c', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué tarea corresponde al cuadrante de «Hacer YA» en la Matriz de Eisenhower?', 'Un examen importante de la próxima semana', 'Una revisión de redes sociales sin prisa alguna', 'Un mensaje de WhatsApp que pide respuesta', 'Un examen importante que se presenta mañana', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Pablo solo necesita una lista de pendientes para ir marcando lo que termina. ¿Qué herramienta de organización le sirve?', 'Google Calendar', 'Forest App', 'Todoist', 'Alarmas del celular', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Ximena no pudo estudiar ayer por un imprevisto. Para proteger su hábito de estudio, ¿qué le conviene hacer?', 'Cambiar cada día su hora de estudio para variar', 'Retomar hoy, para que no sean dos días seguidos', 'Esperar al lunes y volver a empezar su hábito', 'Duplicar hoy sus horas para pagar el día perdido', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Hugo nunca ha estudiado a diario y quiere crear el hábito. Según la semana, ¿con qué le conviene empezar?', 'Con solo 5 minutos de estudio', 'Con todo el temario de la semana', 'Con dos horas de estudio al día', 'Con una sesión larga cada domingo', 'a', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un equipo de estudio quiere ver en un tablero qué tareas están por hacer, en progreso y hechas. ¿Qué herramienta recomienda la semana?', 'Todoist', 'OneNote', 'Google Calendar', 'Trello', 'd', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Beto trabaja todo el día y se propone terminar todas sus materias en dos semanas. ¿Qué característica SMART incumple con más claridad?', 'Alcanzable, porque no parece realista', 'Específica, porque no dice qué lograr', 'Con plazo, porque no dice para cuándo', 'Medible, porque no se puede comprobar', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de ingreso I' AND e.titulo = 'Examen Final — Tutoría de ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué las células de tu cuerpo no tienen todas la misma forma?', 'Porque unas células son más viejas que otras', 'Porque cambian de forma según lo que comes', 'Porque cada órgano tiene un ADN diferente', 'Porque cada forma sirve para una función', 'd', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué trabajo hace el sistema urinario?', 'Produce hormonas que regulan las funciones', 'Procesa alimentos y absorbe sus nutrientes', 'Filtra la sangre y elimina desechos líquidos', 'Transporta oxígeno y nutrientes a las células', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se llaman los movimientos del esófago que empujan el alimento hacia abajo?', 'Agitación del estómago', 'Masticación', 'Mezcla de la lengua', 'Peristaltismo', 'd', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué comer y nutrirse no son lo mismo?', 'Porque se puede comer mucho y nutrirse mal', 'Porque comer es un proceso del cuerpo y nutrirse no', 'Porque nutrirse ocurre solo en el estómago', 'Porque nutrirse es comer solo frutas y verduras', 'a', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En el plato del bien comer, ¿en qué grupo conviene preferir los integrales?', 'Cereales y tubérculos', 'Leguminosas y origen animal', 'Verduras y leguminosas', 'Verduras y frutas', 'a', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué tiene la tráquea que la hace parecida a una manguera flexible?', 'Vellos nasales y moco', 'Pequeños sacos de aire', 'Anillos de cartílago', 'Cuerdas vocales', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿En qué parte del sistema respiratorio ocurre la infección de la neumonía?', 'En la laringe', 'En los alvéolos', 'En los bronquios', 'En la tráquea', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué componente de la sangre defiende al cuerpo contra las infecciones?', 'El plasma', 'Los glóbulos rojos', 'Los glóbulos blancos', 'Las plaquetas', 'c', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué parte del sistema circulatorio lleva la sangre del corazón hacia el cuerpo?', 'Los capilares', 'Las arterias', 'Las válvulas', 'Las venas', 'b', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué herramienta de salud pública ha eliminado o controlado enfermedades como la viruela, la polio y el sarampión?', 'Las revisiones médicas', 'Las vacunas', 'Los exámenes de laboratorio', 'El lavado de manos', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales I' AND e.titulo = 'Examen Final — Ciencias Naturales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En un lago, una alumna anota la temperatura, el pH y la luz solar que recibe. ¿A qué componentes del ecosistema corresponden?', 'Bióticos', 'Productores', 'Abióticos', 'Descomponedores', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una comunidad protege una especie aunque no le deje ganancias, porque cree que tiene derecho a existir. ¿Qué valor de la biodiversidad defiende?', 'Valor ético', 'Valor económico', 'Valor científico', 'Valor ecológico', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un maestro explica que la biodiversidad no es solo la cantidad de especies. ¿Qué más incluye?', 'La cantidad de agua y de minerales', 'La diversidad de genes y de ecosistemas', 'La extensión de las selvas y de los desiertos', 'La diversidad de climas y de suelos', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un búho caza ratones, lagartijas e insectos, y cada una de sus presas come varias cosas. ¿Qué describe mejor estas relaciones?', 'Un nivel trófico', 'Una especie clave', 'Una cadena simple', 'Una red trófica', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Como gran parte de la energía se pierde entre niveles tróficos, ¿qué grupo suele ser más abundante en un ecosistema?', 'Los herbívoros', 'Los carnívoros', 'Los depredadores tope', 'Las plantas', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según lo estudiado, ¿qué medidas ayudaron a reducir la contaminación del aire en la Ciudad de México?', 'La reforestación de bosques y la limpieza de los ríos', 'La restricción vehicular y la reconversión de combustibles', 'El racionamiento del agua y la separación de la basura', 'El reciclaje obligatorio y el ahorro de agua y electricidad', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué grupo reúne solo gases de efecto invernadero?', 'CO₂, metano y vapor de agua', 'CO₂, oxígeno y vapor de agua', 'Metano, oxígeno y nitrógeno', 'Oxígeno, nitrógeno y helio', 'a', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué tienen en común el petróleo, el carbón y la plata como recursos naturales?', 'Se regeneran si no se explotan de más', 'Se producen por fotosíntesis en las algas', 'Se renuevan con el agua de cada lluvia', 'Se formaron durante millones de años', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la idea central de la definición de desarrollo sustentable lanzada en 1987?', 'Proteger el futuro aunque hoy no se cubran las necesidades básicas', 'Detener todo crecimiento económico hasta cumplir con 2030', 'Cubrir el presente sin comprometer a las generaciones futuras', 'Cubrir el presente aunque se agoten los recursos del futuro', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'La energía contenida en los alimentos, como una tortilla, y en los combustibles, como la gasolina, se llama:', 'Energía térmica', 'Energía química', 'Energía cinética', 'Energía radiante', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Naturales II' AND e.titulo = 'Examen Final — Ciencias Naturales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué ciudad fue la más grande de toda América en su época?', 'Chichén Itzá', 'Palenque', 'Teotihuacán', 'Monte Albán', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué significa que la religión mexica era politeísta?', 'Que no tenían dioses ni ritos', 'Que solo los nobles tenían fe', 'Que adoraban solo a un dios', 'Que adoraban a muchos dioses', 'd', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Para qué formaron los mexicas una alianza con Texcoco y Tlacopan?', 'Para defenderse de los españoles', 'Para expandirse y conquistar territorio', 'Para volver juntos al lugar mítico de Aztlán', 'Para hacer chinampas en otros lagos', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué buscaba España en la época en que llegó la expedición de Cortés?', 'Riquezas y nuevas rutas comerciales', 'Aliarse con Portugal para repartirse América', 'Tierras para sus campesinos y fin de la monarquía', 'Expandir la religión y dejar el comercio de lado', 'a', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según lo que estudiaste, ¿qué tres grupos se mezclaron en la época colonial para dar origen a lo mexicano?', 'Españoles, africanos y portugueses', 'Españoles, indígenas y africanos', 'Españoles, indígenas y franceses', 'Indígenas, africanos y franceses', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Para qué fueron traídos los africanos a la Nueva España?', 'Para trabajar como esclavos en minas y haciendas', 'Para evangelizar a los pueblos originarios', 'Para estudiar en las universidades', 'Para ocupar cargos altos de gobierno', 'a', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué fue la Ilustración?', 'Un ejército de campesinos con machetes', 'Un plan de Napoleón para gobernar', 'Una corriente intelectual europea del siglo XVIII', 'Una conspiración de criollos en Querétaro', 'c', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué hizo el Ejército Trigarante el 27 de septiembre de 1821?', 'Organizó el Congreso de Chilpancingo', 'Tomó la Alhóndiga de Granaditas', 'Capturó y fusiló a Morelos', 'Entró triunfante a la Ciudad de México', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué pasó con la guerra en la etapa de resistencia (1815-1821)?', 'Se fragmentó, con Guerrero en el sur', 'Se unificó bajo el mando de Iturbide', 'Terminó cuando Guerrero se rindió en el sur', 'Se concentró en Guanajuato con nuevos líderes', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es el estado más pequeño de México?', 'Chihuahua', 'Morelos', 'Colima', 'Tlaxcala', 'd', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales I' AND e.titulo = 'Examen Final — Ciencias Sociales I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál fue el desenlace de la Intervención Francesa en 1867?', 'Hubo un acuerdo y Maximiliano compartió el poder con Juárez', 'Ganó Francia y Juárez siguió resistiendo desde el norte', 'Ganaron los republicanos y Juárez restableció la República', 'Ganaron los conservadores y Maximiliano siguió en el trono', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En 1908, Díaz dijo en una entrevista que México estaba listo para la democracia. ¿Qué efecto tuvo?', 'Logró que hubiera elecciones limpias ese año', 'Encendió el debate y alentó a la oposición', 'Acabó con la oposición y reforzó a su gobierno', 'Calmó el debate y debilitó a la oposición', 'b', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué líder comandó la División del Norte?', 'Francisco I. Madero', 'Venustiano Carranza', 'Emiliano Zapata', 'Pancho Villa', 'd', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál fue el papel de Madero en la Revolución?', 'Dirigió la lucha agraria del sur con el Plan de Ayala', 'Convocó al Congreso que redactó la Constitución', 'Comandó la División del Norte contra el gobierno', 'Inició la revolución, pero no controló lo que desató', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En 1994, México firmó un acuerdo con EE.UU. y Canadá que transformó su economía. ¿De qué tipo era?', 'Un tratado de libre comercio entre los tres países', 'Un acuerdo para cancelar la deuda externa de México', 'Un pacto de seguridad militar entre los tres países', 'Un plan para repartir el petróleo de PEMEX', 'a', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué ocurrió en la Plaza de Tlatelolco el 2 de octubre de 1968?', 'Una colecta popular para pagar la deuda petrolera', 'Una masacre de estudiantes que protestaban', 'La inauguración de los Juegos Olímpicos', 'Un mitin para festejar la alternancia', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿De qué movimiento histórico fue resultado la Constitución vigente?', 'La Guerra de Reforma', 'La Intervención Francesa', 'La Revolución Mexicana', 'La Independencia', 'c', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una comunidad reclama su derecho a un medio ambiente sano. ¿Qué artículo de la Constitución lo reconoce?', 'El Artículo 24', 'El Artículo 6.º', 'El Artículo 27', 'El Artículo 4.º', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la diferencia entre la queja y el amparo cuando una autoridad viola tus derechos?', 'La queja va a la CNDH y el amparo es la vía judicial', 'La queja la recibe el Congreso y el amparo es la vía política', 'La queja va a la ONU y el amparo es la vía internacional', 'La queja va al INE y el amparo es la vía electoral', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué significa el principio de sufragio universal?', 'Que solo votan quienes saben leer, escribir y pagan impuestos', 'Que todos los ciudadanos adultos tienen derecho a votar', 'Que cualquier persona del mundo puede votar aquí', 'Que el poder se renueva con elecciones limpias', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Ciencias Sociales II' AND e.titulo = 'Examen Final — Ciencias Sociales II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'El municipio publica en el periódico la fecha de una feria. ¿Qué elemento de la comunicación es el periódico?', 'El canal', 'El código', 'El contexto', 'El receptor', 'a', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué elementos tiene un texto narrativo?', 'Razones, evidencias, postura y punto de vista', 'Temas, definiciones, datos y explicaciones objetivas', 'Personajes, lugar, tiempo y secuencia de eventos', 'Pasos ordenados, instrucciones, materiales y resultados', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Al terminar un artículo sobre el transporte de tu ciudad, te preguntas si es objetivo y si estás de acuerdo con él. ¿Qué nivel de comprensión aplicas?', 'Comprensión crítica', 'Comprensión literal', 'Comprensión semántica', 'Comprensión inferencial', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué es lo más importante al leer un texto?', 'Memorizar el texto', 'Pronunciar bien cada palabra', 'Comprender lo que lees', 'Leer a gran velocidad', 'c', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál de estos casos se escribe con mayúscula inicial?', 'El nombre de un mes', 'El nombre de un día', 'El gentilicio de un estado', 'El título de una obra', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres buscar «tamal» en un diccionario impreso. ¿Qué haces primero?', 'Usas la segunda letra para abrir el diccionario', 'Lees las entradas desde el inicio del diccionario', 'Identificas la primera letra y vas a esa sección', 'Revisas las palabras guía de la primera página', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En un diccionario, ¿qué significa «s. m.» junto a una palabra?', 'Sinónimo más usado', 'Sílaba marcada', 'Significado múltiple', 'Sustantivo masculino', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En «El perro de mi tía ladra toda la noche», ¿cuál es el núcleo del sujeto?', 'tía', 'noche', 'ladra', 'perro', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué le falta a «El coche rojo de mi vecino» para ser una oración completa?', 'Una mayúscula', 'Un verbo', 'Un sustantivo', 'Un sujeto', 'b', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un párrafo de seis oraciones pasa de las lluvias a un partido de fútbol y luego al precio del gas. ¿Qué error tiene?', 'Empieza siempre con el mismo sujeto', 'Habla de muchas ideas sin conexión', 'No desarrolla su idea por ser corto', 'Le falta su oración de cierre', 'b', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español I' AND e.titulo = 'Examen Final — Español I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En el párrafo «Leer enriquece el vocabulario. Por ejemplo, quien lee novelas conoce palabras nuevas.», ¿qué es la segunda oración?', 'La idea principal, porque da un ejemplo', 'La idea principal, porque resume el tema', 'Una idea secundaria, porque da un ejemplo', 'Una idea secundaria, porque resume el tema', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Ya subrayaste las ideas de un texto y vas a redactar tu resumen. ¿Cómo debes escribirlas?', 'Con tus palabras y conectadas con enlaces', 'Con tu opinión al final de cada idea', 'Con todos los ejemplos que trae el texto', 'Con las frases exactas del autor', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Mariana toma una idea de un libro para su trabajo, la escribe con sus palabras y menciona al autor. ¿Qué logra al parafrasear así?', 'Reproducir las palabras exactas de ese autor', 'Añadir datos que el libro no incluye', 'Evitar el plagio al usar una idea ajena', 'Reducir a la mitad la extensión del libro', 'c', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres reproducir en tu trabajo una frase tal como la escribió una autora. ¿Cómo lo haces?', 'Reformulas su idea con otras palabras', 'Cambias una o dos palabras de su frase', 'Copias sus palabras sin dar su nombre', 'Copias sus palabras exactas entre comillas', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En «La directora, la maestra Luna, llegó temprano», ¿para qué sirven las comas?', 'Para separar el sujeto del verbo', 'Para añadir información no esencial', 'Para marcar a quién te diriges', 'Para separar una enumeración', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En «No sé si contarle a mi mamá...», ¿qué indican los puntos suspensivos?', 'Que terminó el texto por completo', 'Que se omitió una parte de una cita', 'Que sigue una enumeración de elementos', 'Una pausa expresiva o algo inconcluso', 'd', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Completa: «___ mochila está en el salón; ¿___ la dejaste ahí?»', 'Tú / tu', 'Tu / tú', 'Tu / tu', 'Tú / tú', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'La palabra «relámpago» se acentúa en la antepenúltima sílaba. ¿Qué tipo de palabra es y qué pasa con su tilde?', 'Grave; lleva tilde si no termina en vocal', 'Aguda; lleva tilde si termina en vocal', 'Esdrújula; siempre lleva tilde', 'Sobreesdrújula; siempre lleva tilde', 'c', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Ya escribiste el primer párrafo de una carta formal con tu presentación y tu propósito. ¿Qué va en el segundo párrafo?', 'El desarrollo del tema', 'La firma y el nombre completo', 'El lugar y la fecha de la carta', 'El saludo al destinatario', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Vas a empezar a redactar un informe. ¿En qué parte explicas el contexto y para qué se hizo?', 'En la introducción', 'En los anexos', 'En las conclusiones', 'En las recomendaciones', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español II' AND e.titulo = 'Examen Final — Español II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo debe ser la conclusión de un texto argumentativo?', 'Un cierre que retoma la tesis y la refuerza', 'Una lista de las fuentes consultadas', 'Una tesis nueva que abre otra discusión', 'Un resumen de cada argumento del texto', 'a', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Para defender que la escuela abra un taller de lectura, Sofía da una sola razón, verdadera y relacionada con el tema. ¿Qué le falta a sus argumentos?', 'Ser verificables', 'Ser suficientes', 'Ser relevantes', 'Ser más emotivos', 'b', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un texto sigue un formato rígido e incluye muchos datos y referencias, sin voz personal. ¿A qué tipo de texto corresponde?', 'Artículo académico', 'Noticia', 'Artículo de opinión', 'Ensayo', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Frente al ensayo, ¿cómo es un artículo de opinión?', 'Más largo y reflexivo', 'Más académico y extenso', 'Más breve y directo', 'Más neutral y objetivo', 'c', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se describen las fuentes terciarias?', 'Son opiniones personales, como un blog de internet', 'Son documentos originales, como las leyes', 'Son análisis de un estudio, como un artículo de revista', 'Son compilaciones, como las enciclopedias', 'd', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Estás tomando notas de un libro y un capítulo te parece muy útil. ¿Qué te conviene hacer?', 'Anotar su idea central, los datos que usarás y la referencia', 'Escribir tu opinión sobre el capítulo sin apuntar de qué libro salió', 'Copiar todo el capítulo en tu libreta para no perder nada', 'Anotar solo el título del capítulo y confiar en tu memoria', 'a', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Karla toma ideas de un artículo de internet y las entrega como suyas, sin decir de quién son. ¿Qué hizo?', 'Cita directa, porque usó ideas de otra autora', 'Paráfrasis, porque no usó comillas', 'Refutación, porque tomó postura ante un texto', 'Plagio, porque usó ideas ajenas sin dar crédito', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Gracias a tus citas, una lectora interesada en el tema pudo ir al libro original y leer más. ¿Qué razón para citar se cumplió?', 'Credibilidad', 'Honestidad', 'Utilidad', 'Ética académica', 'c', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según lo estudiado, ¿cómo conviene practicar una exposición oral antes de presentarla?', 'En silencio, solo leyendo tus notas una y otra vez', 'En voz alta, ante un espejo o con alguien de confianza', 'Frente a las diapositivas, memorizando palabra por palabra', 'Sin practicar, para que salga de forma más espontánea', 'b', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué conviene dejar pasar tiempo entre escribir el borrador y revisarlo?', 'Porque las ideas se ordenan solas', 'Porque así olvidas lo que escribiste', 'Porque así queda libre de errores', 'Porque con ojos frescos ves más errores', 'd', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Español III' AND e.titulo = 'Examen Final — Español III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Cuando te preguntan "How old are you?" y tienes 15 años, ¿qué contestas?', 'I''m 15 years', 'I have 15 age', 'I have 15 years', 'I''m 15 years old', 'd', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Te preguntan "Are they students?" y no lo son. ¿Cuál respuesta corta es correcta?', 'No, they aren''t.', 'No, they not.', 'No, are they.', 'No, they isn''t.', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Completa la oración negativa con su forma corta: "We ___ happy."', 'amn''t', 'aren''t', 'not are', 'isn''t', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se dice "cuñada" en inglés?', 'Son-in-law', 'Sister', 'Brother-in-law', 'Sister-in-law', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Completa para decir "Mi cumpleaños es en enero": My birthday is in ___.', 'March', 'January', 'July', 'June', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se pregunta en inglés si a alguien le gusta el mango?', 'Do like you mango?', 'You do like mango?', 'Do you like mango?', 'Are you like mango?', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿En cuál oración está bien colocada la palabra de frecuencia?', 'Always we eat dinner at home', 'We eat dinner always at home', 'We eat always dinner at home', 'We always eat dinner at home', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la pregunta correcta para saber si Laura vive en Monterrey?', 'Do Laura live in Monterrey?', 'Does Laura live in Monterrey?', 'Does Laura lives in Monterrey?', 'Is Laura live in Monterrey?', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué significa en español la pregunta "What do you do?"', '¿Dónde trabajas?', '¿Cómo te llamas?', '¿A qué te dedicas?', '¿Qué estás haciendo?', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se dice "Son las 8" en inglés?', 'It''s 8 o''clock', 'It''s 8 hours', 'Are 8 o''clock', 'I''m 8 o''clock', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Inglés Básico' AND e.titulo = 'Examen Final — Inglés Básico'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la recta numérica, ¿dónde queda el 9 respecto al 4?', 'A la derecha del 4, porque 9 es menor', 'A la izquierda del 4, porque 9 es mayor', 'A la izquierda del 4, porque 9 es menor', 'A la derecha del 4, porque 9 es mayor', 'd', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Si 59 ÷ 8 da 7 con residuo 3, ¿qué cuenta sirve para comprobarlo?', '7 × 8 − 3 = 53', '7 × 3 + 8 = 29', '7 × 8 + 3 = 59', '7 + 8 + 3 = 18', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la jerarquía de operaciones, ¿qué se resuelve justo después de los paréntesis?', 'Lo que esté más a la izquierda', 'Las potencias y las raíces', 'Las sumas y las restas', 'Las multiplicaciones y las divisiones', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuánto da (−8) × (+3)?', '−24', '−11', '−5', '+24', 'a', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la sierra de Chihuahua, el termómetro marca −5 °C y la temperatura baja 6 grados más. ¿Cuánto marca ahora?', '+11 °C', '−11 °C', '−1 °C', '+1 °C', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué 2 × 25 todavía no es la descomposición en factores primos de 50?', 'Porque los factores no se pueden repetir', 'Porque falta multiplicar por 1', 'Porque debe tener tres factores', 'Porque 25 no es primo', 'd', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Con cuál de estas sumas de dígitos un número es divisible entre 9?', '15', '27', '21', '24', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Para saber si 583 es divisible entre 11 se hace la resta alternada de sus dígitos. ¿Qué resulta?', 'Da 0, así que no es divisible', 'Da 16, así que no es divisible', 'Da 16, así que sí es divisible', 'Da 0, así que sí es divisible', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Don Beto tiene 32 mangos y 48 guayabas, y quiere armar canastas idénticas usando toda la fruta. ¿Cuántas canastas puede armar como máximo?', '16', '8', '4', '96', 'a', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'El MCD de 8 y 14 es 2. Usando la relación entre MCM y MCD, ¿cuánto vale el MCM de 8 y 14?', '16', '22', '56', '112', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas I' AND e.titulo = 'Examen Final — Matemáticas I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Al pasar estas fracciones a un denominador común, ¿cuál resulta la mayor?', '1/2', '3/4', '5/8', '7/16', 'b', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué fracción representa la misma cantidad que 3/7?', '3/14', '6/10', '9/21', '6/7', 'c', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'A un costal con 7/9 de kg de maíz se le saca 1/6 de kg. ¿Cuánto maíz queda?', '6/9 de kg', '4/9 de kg', '11/18 de kg', '17/18 de kg', 'c', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué número decimal corresponde a la fracción 2/5?', '0.4', '0.2', '0.25', '2.5', 'a', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Con 10% de descuento pagaste $360 por unos tenis. ¿Cuál era el precio original?', '$324', '$400', '$396', '$3,600', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'La renta de un local es de $5,000 y aumenta 6%. ¿Cuánto se paga ahora?', '$5,006', '$4,700', '$5,030', '$5,300', 'd', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En un taller hay 9 carpinteros y 2 ayudantes. ¿Cuál es la razón de ayudantes a carpinteros?', '2:9', '9:2', '9:11', '2:11', 'a', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Al repartir un mismo pastel, mientras más invitados hay, menos pastel le toca a cada uno. ¿Qué tipo de regla de tres aplica?', 'Directa, porque las dos cantidades aumentan', 'Directa, porque hay más invitados y más pastel', 'Compuesta, porque intervienen dos cantidades', 'Inversa, porque una aumenta y la otra disminuye', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un jardín circular tiene 7 m de radio. ¿Cuál es su área? Usa π ≈ 3.1416 y redondea a dos decimales.', '43.98 m²', '21.99 m²', '153.94 m²', '307.88 m²', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un depósito cilíndrico tiene 2 m de radio y 7 m de altura. ¿Cuál es su volumen? Usa π ≈ 3.1416 y redondea a dos decimales.', '87.96 m³', '175.93 m³', '43.98 m³', '29.32 m³', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas II' AND e.titulo = 'Examen Final — Matemáticas II'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué pareja está formada por términos semejantes?', '4a y 4b', '4a y 7a', '4a y 4a²', '4 y 4a', 'b', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuántos términos tiene la expresión 2a + 3b − c + 8?', '4', '3', '5', '2', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué x² + 5 = 9 no es una ecuación de primer grado?', 'Porque su variable tiene exponente 2', 'Porque el resultado es un número impar', 'Porque su variable está a la izquierda', 'Porque tiene dos números distintos', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Resuelve la ecuación 9x + 2 = 4x + 17.', 'x = 3.8', 'x = 5', 'x = 15', 'x = 3', 'd', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cómo se llama el punto donde se cruzan el eje X y el eje Y?', 'Coordenada', 'Cuadrante', 'Origen', 'Par ordenado', 'c', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Las tallas de calzado de ocho personas son 24, 26, 25, 24, 27, 24, 26 y 24. ¿Cuál es la frecuencia del dato 24?', '8', '4', '2', '24', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué medida conviene para representar los ingresos de un grupo con unos cuantos valores muy altos?', 'Todas dan el mismo resultado', 'Promedio', 'Mediana', 'Moda', 'c', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una tienda vendió gorras de estos colores: roja, azul, roja, negra, azul, roja. ¿Cuál es la moda?', 'Sin moda', 'Roja', 'Azul', 'Negra', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Al leer una gráfica de pastel, ¿qué debes verificar?', 'Que la línea suba mes con mes', 'Que todas las rebanadas sean del mismo tamaño', 'Que el eje Y empiece en 0', 'Que todas las rebanadas sumen 100%', 'd', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Al lanzar un dado una sola vez, ¿qué pareja de eventos es mutuamente excluyente?', 'Sacar un 2 y sacar un par', 'Sacar un par y sacar menor que 3', 'Sacar un 2 y sacar un 5', 'Sacar un 5 y sacar un impar', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Matemáticas III' AND e.titulo = 'Examen Final — Matemáticas III'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué componente es el «cerebro» de la computadora porque realiza los cálculos?', 'El procesador', 'El sistema operativo', 'El disco duro', 'La memoria RAM', 'a', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres pasar tus fotos a una memoria externa. ¿En qué puerto la conectas?', 'Ethernet', 'Auriculares / micrófono', 'HDMI', 'USB', 'd', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué pasa con un archivo que está en la papelera de reciclaje mientras no la vacías?', 'Todavía se puede recuperar', 'Se queda abierto en el escritorio', 'Se copia en una memoria USB', 'Ya se borró para siempre', 'a', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una página te pide tu dirección y tu teléfono solo para leer una noticia. ¿Qué señal de desconfianza es esa?', 'Pide datos personales sin justificación', 'Todavía no está guardada en tus marcadores', 'Se abrió en una pestaña aparte del navegador', 'Su dirección de internet lleva letras y números', 'a', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Quieres separar en tu correo los mensajes de la escuela y los de tu familia. ¿Qué usas?', 'La bandeja de enviados', 'La carpeta de spam', 'Etiquetas o carpetas', 'La copia oculta', 'c', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿En qué unidad se mide el tamaño de la fuente?', 'En gigabytes (GB)', 'En gigahertz (GHz)', 'En puntos (pt)', 'En centímetros (cm)', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En el nombre de la celda C10, ¿qué indica la letra C?', 'La fila', 'La columna', 'La fórmula', 'El rango', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Las celdas B1 a B3 tienen 6, 8 y 10. ¿Qué número muestra =PROMEDIO(B1:B3)?', '24', '6', '10', '8', 'd', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Alguien te llama, dice ser de soporte técnico y te pide tu contraseña. ¿Qué haces?', 'La mandas mejor por correo electrónico', 'No la compartes con nadie por llamada', 'La dictas si luego la vas a cambiar', 'La das si te llaman a tu celular', 'b', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuántos caracteres debe tener, como mínimo, una contraseña segura?', '10 caracteres', '8 caracteres', '6 caracteres', '12 caracteres', 'd', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tecnología y Vida Digital' AND e.titulo = 'Examen Final — Tecnología y Vida Digital'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

-- Demo: Tutoría de Ingreso I (conservadas tal cual)

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la principal ventaja del bachillerato virtual?', 'Es más fácil que el presencial', 'Tiene flexibilidad de horarios y acceso 24/7', 'No tiene exámenes', 'No requiere estudiar', 'b', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la principal ventaja del bachillerato virtual respecto al presencial?', 'Solo se estudia los fines de semana', 'No requiere ningún esfuerzo ni disciplina personal', 'Permite organizar el tiempo de estudio según las necesidades de cada estudiante', 'Los profesores están disponibles en tiempo real las 24 horas', 'c', 1
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Verdadero o Falso? Una persona con estilo de aprendizaje auditivo aprende mejor con diagramas y mapas mentales.', 'Verdadero', 'Falso', '', '', 'b', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Según el modelo VARK, ¿cuáles son los cuatro estilos de aprendizaje principales?', 'Visual, Auditivo, Lecto-escritor y Kinestésico', 'Lento, rápido, mixto y selectivo', 'Teórico, práctico, social e individual', 'Básico, intermedio, avanzado y experto', 'a', 2
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿En qué consiste la técnica de estudio Pomodoro?', 'Leer el texto completo subrayando todo el contenido', 'Hacer resúmenes con diferentes colores por tema', 'Copiar el texto del libro palabra por palabra en un cuaderno', 'Estudiar en bloques de aproximadamente 25 minutos con descansos breves para mantener la concentración', 'd', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'La técnica Pomodoro consiste en estudiar bloques de:', '10 minutos con 2 de descanso', '25 minutos con 5 de descanso', '45 minutos con 15 de descanso', '60 minutos con 10 de descanso', 'b', 3
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué es el ''Active Recall'' (Recuerdo activo)?', 'Releer el material muchas veces', 'Cerrar el material e intentar recordar sin ver', 'Subrayar las ideas importantes', 'Copiar textualmente los apuntes', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿En qué consiste el Active Recall como técnica de estudio?', 'Releer los apuntes repetidamente hasta memorizarlos', 'Intentar recordar la información sin mirarla para fortalecer la memoria a largo plazo', 'Escuchar música relacionada con el tema mientras estudias', 'Copiar textualmente los apuntes en limpio varias veces', 'b', 4
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Verdadero o Falso? Subrayar todo el texto es una técnica de estudio muy efectiva.', 'Verdadero', 'Falso', '', '', 'b', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Para qué sirve la Matriz de Eisenhower en la gestión del tiempo?', 'Para clasificar las tareas según su urgencia e importancia y priorizar eficientemente', 'Para elaborar un horario de clases semanal fijo', 'Para calcular el promedio de calificaciones del semestre', 'Para medir la velocidad de lectura del estudiante', 'a', 5
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la diferencia entre motivación intrínseca y extrínseca?', 'La intrínseca viene de premios externos y la extrínseca de factores internos', 'Son términos completamente sinónimos en psicología educativa', 'La intrínseca surge del interés y satisfacción personal; la extrínseca viene de recompensas externas como el título o la aprobación', 'La extrínseca siempre es más duradera y confiable que la intrínseca', 'c', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'En la Matriz de Eisenhower, una tarea IMPORTANTE pero NO URGENTE se debe:', 'Hacer inmediatamente', 'Planificar para después', 'Eliminar', 'Delegar a alguien más', 'b', 6
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Por qué la disciplina es más valiosa que la motivación en la educación a distancia?', 'Porque la motivación nunca sirve de nada en el aprendizaje virtual', 'Porque la disciplina se puede desarrollar en solo un día de práctica', 'Porque ambas son exactamente iguales y no hay diferencia real entre ellas', 'Porque la motivación varía con el estado de ánimo, mientras la disciplina permite cumplir compromisos aunque no haya ganas', 'd', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es la diferencia entre motivación y disciplina?', 'Son lo mismo', 'La motivación te hace empezar, la disciplina te hace continuar', 'La disciplina es para el trabajo, la motivación para el estudio', 'La motivación es más importante que la disciplina', 'b', 7
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál de las siguientes herramientas digitales es útil para organizar y tomar apuntes de estudio?', 'Photoshop', 'Google Docs o Notion', 'AutoCAD', 'Adobe Premiere', 'b', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Verdadero o Falso? En promedio, un hábito tarda unos dos meses de práctica diaria en volverse automático, y el plazo varía de persona a persona.', 'Verdadero', 'Falso', '', '', 'a', 8
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué significa que una meta académica sea SMART?', 'Que sea ambiciosa sin importar si es actualmente alcanzable', 'Que la definan los profesores en lugar del propio alumno', 'Que sea Específica, Medible, Alcanzable, Relevante y con Tiempo definido', 'Que involucre exclusivamente actividades académicas sin vida personal', 'c', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué es la ''mentalidad de crecimiento'' de Carol Dweck?', 'Creer que la inteligencia es fija y no cambia', 'Creer que puedes mejorar tus habilidades con esfuerzo y práctica', 'Pensar que solo los genios tienen éxito', 'Crecer físicamente durante la adolescencia', 'b', 9
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Qué herramienta usa tarjetas de memoria (flashcards) con repetición espaciada?', 'Google Docs', 'Canva', 'Anki', 'Trello', 'c', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Un estudiante nuevo en el bachillerato virtual se siente abrumado en su primera semana. ¿Qué actitud es más recomendable?', 'Aplicar técnicas de organización del tiempo, identificar su estilo de aprendizaje y comunicarse con su tutor', 'Esperar a que la situación mejore sola sin hacer cambios', 'Estudiar todo el día sin descansos hasta ponerse completamente al día', 'Abandonar inmediatamente y buscar otra modalidad educativa', 'a', 10
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Verdadero o Falso? La técnica Feynman consiste en explicar un tema como si se lo enseñaras a un niño.', 'Verdadero', 'Falso', '', '', 'a', 11
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Una meta SMART debe ser específica, medible, alcanzable, relevante y:', 'Total', 'Técnica', 'Con plazo definido (Time-bound)', 'Teórica', 'c', 12
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Cuál es el principal enemigo de la concentración al estudiar en línea?', 'Los libros', 'Las distracciones digitales (celular, redes sociales)', 'La falta de libros físicos', 'El horario de clases', 'b', 13
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, '¿Verdadero o Falso? En la educación virtual, la responsabilidad del aprendizaje es 100% del alumno.', 'Verdadero', 'Falso', '', '', 'a', 14
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

INSERT INTO preguntas (evaluacion_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
SELECT e.id, 'Si un día no tienes ganas de estudiar, ¿qué es lo mejor que puedes hacer?', 'No estudiar y esperar a que regrese la motivación', 'Comprometerte a solo 5 minutos y empezar', 'Estudiar 4 horas para compensar', 'Dejar la materia para el mes siguiente', 'b', 15
FROM evaluaciones e JOIN materias m ON m.id = e.materia_id
WHERE m.nombre = 'Tutoría de Ingreso I' AND e.titulo = 'Examen Final — Tutoría de Ingreso I'
ON CONFLICT (evaluacion_id, pregunta) DO NOTHING;

COMMIT;
