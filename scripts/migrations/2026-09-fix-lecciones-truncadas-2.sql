-- =============================================================================
-- 2026-09-fix-lecciones-truncadas-2.sql
-- Retrofit para clientes YA sembrados — SEGUNDA Y ÚLTIMA TANDA.
--
-- QUÉ
--   Reescribe el contenido de las 8 lecciones (`public.semanas.contenido`) que
--   quedaron FUERA del retrofit anterior
--   (`2026-09-fix-lecciones-truncadas.sql`, PR #98).
--
-- POR QUÉ EXISTE ESTE SEGUNDO ARCHIVO
--   El defecto —el generador del seed no escapaba los apóstrofos, así que la
--   PRIMERA comilla simple del texto cerraba el literal SQL y el resto se
--   perdía— afectó a 60 lecciones. Se arreglaron en dos tiempos:
--
--     · PR #95 (`e553e48`) corrigió 8 (las que cabían en <200 caracteres)
--       **solo en el seed**. Los clientes NUEVOS quedaron sanos; los YA
--       SEMBRADOS conservaron esas 8 filas cortadas, porque nadie escribió el
--       retrofit.
--     · PR #98 (`4740128`) corrigió las 52 restantes en el seed **y** escribió
--       el retrofit de esas 52.
--
--   Resultado: tras aplicar el retrofit del PR #98 la auditoría NO daba 0, sino
--   8 por cliente. Este archivo cierra esas 8. Barrido del 8-sep-2026 sobre los
--   63 clientes alcanzables de la flota: 451 filas pendientes, exactamente
--   estos 8 títulos, una fila por título y por cliente (sin colisiones entre
--   materias, a diferencia del Bug 60).
--
-- FUENTE DEL TEXTO COMPLETO
--   `scripts/mev-content.json` (export íntegro del contenido MEV), la misma
--   fuente que usaron el PR #95 y el PR #98. Para los 8 se verificó que el
--   texto completo EXTIENDE LITERALMENTE al truncado que hay hoy en la base
--   (`full.startswith(truncado)` carácter a carácter, tras normalizar los
--   saltos de línea): no se inventó ni se reescribió una sola palabra.
--
-- IDEMPOTENTE
--   Mismo guardián que el retrofit anterior. Cada UPDATE solo toca la fila si
--   SIGUE truncada:
--     · `contenido LIKE '%'''`  → termina en apóstrofo (la marca del corte), y
--     · `length(contenido) < N` → es más corta que el texto completo.
--   Re-ejecutarlo no cambia nada (0 filas). El guardián usa AND, no OR, a
--   propósito: hay dos lecciones ("La Reforma y la educación laica" y "El
--   proceso de comunicación y tipos de lenguaje") que terminan LEGÍTIMAMENTE en
--   apóstrofo —cierran una cita— y con OR se reescribirían en cada corrida.
--   Ninguno de los 8 textos de este archivo termina en apóstrofo.
--
-- NOTA SOBRE `\r\n`
--   El contenido guarda los saltos de línea como la secuencia literal de dos
--   escapes `\r` `\n` (cuatro caracteres), no como saltos reales: así los
--   escribe el seed y así los normaliza `src/components/ContenidoMarkdown.tsx`.
--   `mev-content.json` los trae como saltos REALES, así que al generar este
--   archivo se convirtieron. Este script respeta la convención de la base.
--
-- CÓMO APLICAR
--   Un cliente:
--     psql "$CLIENT_DB_URL" -f scripts/migrations/2026-09-fix-lecciones-truncadas-2.sql
--   La flota (no tiene psql — se aplica por PostgREST):
--     mev-tools/scripts/campanas/2026-09-08-lecciones-truncadas.py --todos
--   Ese script parsea LAS DOS migraciones; ver mev-tools/scripts/campanas/README.md.
--
-- AUDITORÍA (antes y después)
--   Una lección cortada termina en apóstrofo SIN cerrar la frase; por eso no
--   basta `LIKE '%'''` y hay que mirar el carácter anterior.
--     SELECT count(*) FROM public.semanas
--      WHERE contenido LIKE '%'''
--        AND substring(contenido FROM length(contenido) - 1 FOR 1)
--            NOT IN ('.', '!', '?');
--   >0 = pendiente | 0 = sano
--   Con este archivo aplicado ADEMÁS del anterior, la cuenta debe quedar en 0.
-- =============================================================================

BEGIN;

-- 01/08 · Artículos, sustantivos y plurales
--        114 → 1607 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Los artículos y sustantivos son las piezas básicas para formar oraciones en inglés.\r\n\r\n**Artículos:**\r\n\r\n''A'' y ''An'' = Un/Una (artículo indefinido)\r\n- ''A'' se usa antes de consonantes: a book, a car, a dog\r\n- ''An'' se usa antes de vocales: an apple, an egg, an umbrella\r\n- Excepción: depende del SONIDO, no la letra. ''A university'' (suena ''yu''), ''An hour'' (la h es muda)\r\n\r\n''The'' = El/La/Los/Las (artículo definido)\r\n- Se usa cuando hablamos de algo específico: The book on the table (El libro que está en la mesa)\r\n- Solo hay UN artículo definido en inglés para todo (en español tenemos el, la, los, las)\r\n\r\n**Sustantivos — Plurales:**\r\n\r\nRegla general: se agrega -S\r\n- book → books, car → cars, dog → dogs\r\n\r\nTerminan en -s, -sh, -ch, -x, -z: se agrega -ES\r\n- bus → buses, dish → dishes, watch → watches, box → boxes\r\n\r\nTerminan en consonante + y: se cambia Y por -IES\r\n- city → cities, baby → babies, story → stories\r\n- Pero si hay vocal + y, solo agrega -S: boy → boys, day → days\r\n\r\nTerminan en -f o -fe: se cambia por -VES\r\n- knife → knives, wife → wives, leaf → leaves\r\n\r\n**Plurales irregulares (memorizar):**\r\n- man → men\r\n- woman → women\r\n- child → children\r\n- tooth → teeth\r\n- foot → feet\r\n- mouse → mice\r\n- person → people\r\n- fish → fish (no cambia)\r\n\r\n**Sustantivos contables vs incontables:**\r\n- Contables: cosas que puedes contar (a book, two books)\r\n- Incontables: no puedes contar con números (water, music, information, money)\r\n- Con incontables NO usas a/an ni plural: ''I need water'' (no ''a water'' ni ''waters'')'
 WHERE titulo = 'Artículos, sustantivos y plurales'
   AND contenido LIKE '%'''
   AND length(contenido) < 1607;

-- 02/08 · Desigualdades e intervalos
--        55 → 1377 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Las desigualdades son como ecuaciones, pero en vez de ''='' usan <, >, ≤, ≥. La solución no es un número sino un RANGO de números.\r\n\r\n**Símbolos:**\r\n< menor que | > mayor que | ≤ menor o igual | ≥ mayor o igual\r\n\r\n**Resolver desigualdades — mismas reglas que ecuaciones con UNA excepción:**\r\nSi multiplicas o divides por un número NEGATIVO, se INVIERTE el signo de desigualdad.\r\n\r\nEjemplo 1: 2x + 3 > 9\r\n2x > 6\r\nx > 3 (todos los números mayores que 3)\r\n\r\nEjemplo 2: -3x + 6 ≤ 12\r\n-3x ≤ 6\r\nx ≥ -2 (¡se invirtió el signo porque dividimos entre -3!)\r\n\r\n**Notación de intervalos:**\r\n- x > 3 → (3, ∞) — paréntesis = no incluye el 3\r\n- x ≥ 3 → [3, ∞) — corchete = sí incluye el 3\r\n- x < -2 → (-∞, -2)\r\n- -1 ≤ x < 5 → [-1, 5)\r\n- El infinito siempre lleva paréntesis (nunca se alcanza)\r\n\r\n**Representación en recta numérica:**\r\n- Círculo vacío ○ = no incluido (< o >)\r\n- Círculo lleno ● = incluido (≤ o ≥)\r\n- Flecha indica la dirección de los valores\r\n\r\n**Desigualdades compuestas:**\r\n-3 < 2x + 1 ≤ 7\r\nResolvemos las dos partes:\r\n-3 < 2x + 1 → -4 < 2x → -2 < x\r\n2x + 1 ≤ 7 → 2x ≤ 6 → x ≤ 3\r\nSolución: -2 < x ≤ 3 → (-2, 3]\r\n\r\n**Aplicación real:**\r\nUn plan de datos cuesta $100 base más $5 por cada GB extra. Si tu presupuesto máximo es $250:\r\n100 + 5g ≤ 250\r\n5g ≤ 150\r\ng ≤ 30\r\nPuedes usar máximo 30 GB extra.'
 WHERE titulo = 'Desigualdades e intervalos'
   AND contenido LIKE '%'''
   AND length(contenido) < 1377;

-- 03/08 · Ecuaciones lineales de primer grado
--        67 → 1232 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Una ecuación es como una balanza: lo que hay de un lado del signo ''='' debe pesar lo mismo que lo del otro lado. Resolver una ecuación significa encontrar el valor de la variable que hace que ambos lados sean iguales.\r\n\r\n**Ecuación lineal:** Es aquella donde la variable tiene exponente 1 (no hay x², x³, etc.).\r\n\r\nForma general: ax + b = c\r\n\r\n**Cómo resolver — El principio de la balanza:**\r\nLo que hagas de un lado, hazlo del otro. Puedes sumar, restar, multiplicar o dividir ambos lados por el mismo número.\r\n\r\n**Ejemplo 1: Ecuación simple**\r\n3x + 7 = 22\r\nPaso 1: Restar 7 de ambos lados → 3x = 15\r\nPaso 2: Dividir ambos lados entre 3 → x = 5\r\nComprobación: 3(5) + 7 = 15 + 7 = 22 ✓\r\n\r\n**Ejemplo 2: Variable en ambos lados**\r\n5x - 3 = 2x + 9\r\nPaso 1: Restar 2x de ambos lados → 3x - 3 = 9\r\nPaso 2: Sumar 3 a ambos lados → 3x = 12\r\nPaso 3: Dividir entre 3 → x = 4\r\nComprobación: 5(4) - 3 = 17 y 2(4) + 9 = 17 ✓\r\n\r\n**Ejemplo 3: Con paréntesis**\r\n2(x + 3) = 4x - 2\r\nPaso 1: Distribuir → 2x + 6 = 4x - 2\r\nPaso 2: Restar 2x → 6 = 2x - 2\r\nPaso 3: Sumar 2 → 8 = 2x\r\nPaso 4: Dividir → x = 4\r\n\r\n**Regla de oro:** SIEMPRE comprueba tu resultado sustituyendo en la ecuación original.'
 WHERE titulo = 'Ecuaciones lineales de primer grado'
   AND contenido LIKE '%'''
   AND length(contenido) < 1232;

-- 04/08 · El sueño y su impacto en la salud
--        14 → 1751 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Dormir no es ''perder el tiempo'' — es una necesidad biológica fundamental. Durante el sueño tu cuerpo se repara, tu cerebro consolida memorias y tu sistema inmune se fortalece.\r\n\r\n**¿Cuánto debes dormir?**\r\n- Adolescentes (14-17 años): 8-10 horas\r\n- Adultos jóvenes (18-25): 7-9 horas\r\n- Menos de 6 horas consistentemente se considera privación de sueño\r\n\r\n**¿Qué pasa cuando no duermes suficiente?**\r\n- Dificultad para concentrarte y aprender (la memoria se consolida durmiendo)\r\n- Mayor riesgo de accidentes\r\n- Sistema inmune debilitado\r\n- Mayor riesgo de obesidad (el cuerpo pide más comida como compensación)\r\n- Irritabilidad, ansiedad y depresión\r\n- Peor rendimiento académico\r\n\r\n**Higiene del sueño — cómo dormir mejor:**\r\n\r\n1. **Horario consistente:** Acuéstate y levántate a la misma hora, incluso fines de semana.\r\n2. **Evita pantallas 30-60 min antes de dormir:** La luz azul suprime la melatonina (hormona del sueño).\r\n3. **Ambiente oscuro y fresco:** Temperatura ideal 18-22°C.\r\n4. **Evita cafeína después de las 2 PM:** El café, refrescos de cola y bebidas energéticas interfieren con el sueño.\r\n5. **No hagas ejercicio intenso antes de dormir:** Hazlo al menos 3 horas antes.\r\n6. **Cena ligera:** Una cena pesada dificulta el sueño.\r\n7. **Usa la cama solo para dormir:** No estudies, comas ni veas TV en la cama.\r\n8. **Si no te duermes en 20 minutos:** Levántate y haz algo tranquilo hasta que tengas sueño.\r\n\r\n**Fases del sueño:**\r\n- Fase 1-2: Sueño ligero (te duermes)\r\n- Fase 3: Sueño profundo (reparación física)\r\n- Fase REM: Sueño con movimientos oculares rápidos (aquí sueñas y se consolida la memoria)\r\n- Un ciclo completo dura ~90 minutos y se repite 4-6 veces por noche'
 WHERE titulo = 'El sueño y su impacto en la salud'
   AND contenido LIKE '%'''
   AND length(contenido) < 1751;

-- 05/08 · Estructuras de control — ciclos (loops)
--        196 → 2015 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Los ciclos permiten repetir una acción varias veces sin escribir el mismo código una y otra vez. Son fundamentales en programación.\r\n\r\n**¿Por qué necesitamos ciclos?**\r\nSi quieres escribir ''Hola'' 100 veces, no vas a escribir la instrucción 100 veces. Un ciclo lo hace por ti.\r\n\r\n**Ciclo MIENTRAS (While):**\r\nRepite MIENTRAS una condición sea verdadera.\r\n```\r\ncontador = 1\r\nMIENTRAS contador <= 10 HACER\r\n  ESCRIBIR contador\r\n  contador = contador + 1\r\nFIN MIENTRAS\r\n```\r\nResultado: imprime 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\r\n\r\n**Ciclo PARA (For):**\r\nRepite un número específico de veces.\r\n```\r\nPARA i = 1 HASTA 10 HACER\r\n  ESCRIBIR i\r\nFIN PARA\r\n```\r\nResultado: igual, imprime del 1 al 10\r\n\r\n**Diferencia:**\r\n- MIENTRAS: cuando no sabes cuántas veces vas a repetir (depende de una condición)\r\n- PARA: cuando sabes exactamente cuántas repeticiones necesitas\r\n\r\n**Ejemplo práctico — Tabla de multiplicar:**\r\n```\r\nLEER numero\r\nPARA i = 1 HASTA 10 HACER\r\n  resultado = numero * i\r\n  ESCRIBIR numero + '' x '' + i + '' = '' + resultado\r\nFIN PARA\r\n```\r\nSi el usuario escribe 7, imprime: 7x1=7, 7x2=14, 7x3=21... 7x10=70\r\n\r\n**Ejemplo con MIENTRAS — Adivinar un número:**\r\n```\r\nnumero_secreto = 42\r\nadivinanza = 0\r\n\r\nMIENTRAS adivinanza != numero_secreto HACER\r\n  ESCRIBIR ''Adivina el número:''\r\n  LEER adivinanza\r\n  SI adivinanza < numero_secreto ENTONCES\r\n    ESCRIBIR ''Muy bajo''\r\n  SINO SI adivinanza > numero_secreto ENTONCES\r\n    ESCRIBIR ''Muy alto''\r\n  SINO\r\n    ESCRIBIR ''¡Correcto!''\r\n  FIN SI\r\nFIN MIENTRAS\r\n```\r\n\r\n**Peligro: Ciclos infinitos**\r\nSi la condición del MIENTRAS nunca se vuelve falsa, el programa se queda atrapado para siempre. Siempre asegúrate de que algo cambie dentro del ciclo para que eventualmente termine.\r\n\r\n**Ciclos en la vida real:**\r\n- Lavar los platos: MIENTRAS haya platos sucios → lavar uno → repetir\r\n- Estudiar: PARA cada materia del 1 al 6 → estudiar materia → siguiente'
 WHERE titulo = 'Estructuras de control — ciclos (loops)'
   AND contenido LIKE '%'''
   AND length(contenido) < 2015;

-- 06/08 · Jalisco — historia, cultura e identidad regional
--        131 → 1060 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Jalisco es uno de los estados más emblemáticos de México. Su cultura ha dado forma a muchos símbolos que el mundo identifica como ''mexicanos''.\r\n\r\n**Historia:** Habitado por caxcanes, cocas, tecuexes, huicholes. Conquistado por Nuño de Guzmán (1530-1531). Guadalajara fundada en 1542. Capital de la Nueva Galicia. Hidalgo abolió la esclavitud desde Guadalajara en 1810. Epicentro de la Guerra Cristera (1926-1929).\r\n\r\n**Guadalajara:** Segunda ciudad más grande de México. ''La Perla de Occidente''. Centro económico y cultural del occidente.\r\n\r\n**Cultura jalisciense = identidad nacional:**\r\n- **Mariachi:** Patrimonio Cultural Inmaterial de la Humanidad (UNESCO, 2011)\r\n- **Tequila:** Bebida de agave azul. El Paisaje Agavero es Patrimonio de la Humanidad.\r\n- **Charrería:** Deporte nacional surgido de las haciendas de Jalisco\r\n- **Gastronomía:** Birria, tortas ahogadas, tejuino\r\n\r\nEstudiar en Jalisco te conecta con esta historia. Eres parte de una tradición educativa que ha luchado siglos por hacer la educación accesible para todos.'
 WHERE titulo = 'Jalisco — historia, cultura e identidad regional'
   AND contenido LIKE '%'''
   AND length(contenido) < 1060;

-- 07/08 · Lectura de textos cortos y comprensión
--        173 → 1762 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'Es hora de poner todo junto leyendo textos cortos en inglés. No necesitas entender cada palabra — el objetivo es captar la idea general.\r\n\r\n**Texto 1 — Mi rutina:**\r\n''My name is Carlos. I am 17 years old and I live in Guadalajara. I wake up at 7 AM every day. I eat breakfast with my family — usually eggs and coffee. Then I study online for two hours. In the afternoon, I work at a small store. I usually get home at 6 PM. I watch TV or play video games, and I go to bed at 10 PM.''\r\n\r\nPreguntas: Where does Carlos live? What does he eat for breakfast? What does he do in the afternoon?\r\n\r\n**Texto 2 — Pasado:**\r\n''Last Saturday, Maria went to the beach with her friends. They swam in the ocean and played volleyball. Maria bought a coconut and drank the water. They didn''t want to leave, but it started to rain at 4 PM. They drove home and watched a movie together. It was a great day.''\r\n\r\nPreguntas: Where did Maria go? What happened at 4 PM? Did they have a good time?\r\n\r\n**Texto 3 — Planes futuros:**\r\n''Next month, I am going to start university. I will study engineering because I like math and science. I''m going to live in a small apartment near the campus. I think it will be difficult, but I''m excited. My parents said they will help me with the rent. I should study hard to get good grades.''\r\n\r\nPreguntas: What is he going to study? Why? Who will help with rent?\r\n\r\n**Estrategias para leer en inglés:**\r\n1. Lee el texto completo sin detenerte en cada palabra desconocida\r\n2. Intenta adivinar el significado por contexto\r\n3. Busca las palabras clave (sustantivos y verbos)\r\n4. Relee si necesitas\r\n5. Responde preguntas con información del texto\r\n6. No traduzcas palabra por palabra — busca el SENTIDO general'
 WHERE titulo = 'Lectura de textos cortos y comprensión'
   AND contenido LIKE '%'''
   AND length(contenido) < 1762;

-- 08/08 · ¿Qué es la salud? Dimensiones del bienestar
--        21 → 1882 caracteres  ·  fuente: mev-content.json
UPDATE public.semanas
   SET contenido = 'La salud no es solo ''no estar enfermo''. La Organización Mundial de la Salud (OMS) la define como un estado de completo bienestar físico, mental y social.\r\n\r\n**Las dimensiones de la salud:**\r\n\r\n1. **Física:** Tu cuerpo funciona bien. Buena alimentación, ejercicio, descanso, ausencia de enfermedades. Es la más visible.\r\n\r\n2. **Mental/Emocional:** Capacidad de manejar emociones, pensar con claridad, enfrentar problemas. No significa estar feliz todo el tiempo — significa tener herramientas para lidiar con lo difícil.\r\n\r\n3. **Social:** Relaciones sanas con familia, amigos, compañeros. Sentido de pertenencia. Redes de apoyo.\r\n\r\n4. **Espiritual:** No necesariamente religioso. Se refiere a tener propósito, valores, sentido de vida.\r\n\r\n**Factores que afectan tu salud:**\r\n\r\n- **Genética (10-15%):** Lo que heredas de tus padres. No lo puedes cambiar pero sí puedes anticipar.\r\n- **Ambiente (20%):** Contaminación, acceso a agua limpia, seguridad, vivienda.\r\n- **Sistema de salud (10%):** Acceso a médicos, hospitales, medicinas.\r\n- **Estilo de vida (50-55%):** LO QUE TÚ DECIDES. Alimentación, ejercicio, sueño, consumo de sustancias, manejo del estrés.\r\n\r\nEsto significa que MÁS DE LA MITAD de tu salud depende de tus decisiones diarias. Esa es la buena noticia: tienes mucho poder sobre tu bienestar.\r\n\r\n**Indicadores básicos de salud que debes conocer:**\r\n- Peso saludable: se mide con el IMC (Índice de Masa Corporal) = peso(kg) / estatura(m)²\r\n  - Normal: 18.5-24.9\r\n  - Sobrepeso: 25-29.9\r\n  - Obesidad: 30+\r\n- Presión arterial: normal es 120/80 mmHg\r\n- Frecuencia cardíaca en reposo: 60-100 latidos por minuto\r\n\r\n**México y la salud:**\r\nMéxico tiene tasas alarmantes de sobrepeso (75% de adultos), diabetes (12% de adultos) y enfermedades cardiovasculares. Muchas son prevenibles con cambios en el estilo de vida.'
 WHERE titulo = '¿Qué es la salud? Dimensiones del bienestar'
   AND contenido LIKE '%'''
   AND length(contenido) < 1882;

COMMIT;

-- Verificación post-migración (debe dar 0, contando también el retrofit de las 52):
--   SELECT count(*) FROM public.semanas
--    WHERE contenido LIKE '%'''
--      AND substring(contenido FROM length(contenido) - 1 FOR 1)
--          NOT IN ('.', '!', '?');
