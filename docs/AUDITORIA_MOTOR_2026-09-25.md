# Auditoría técnica y metodológica del motor Zero-IA

Fecha: 25 de septiembre de 2026. Versión revisada: `7e1b654`.

## Dictamen

La observación del usuario es consistente con el funcionamiento real del motor: un texto generado con IA puede obtener un índice muy bajo porque el sistema reconoce principalmente una lista de expresiones y combina esas coincidencias con estadísticas superficiales. La puntuación no representa la probabilidad de autoría, la proporción de contenido generado ni una estimación del resultado de Turnitin.

El motor necesita una revisión de su definición de éxito, cálculo, segmentación y evaluación antes de utilizarlo como validador confiable. Aumentar pesos o ampliar indiscriminadamente las listas produciría más alertas, sin demostrar menos errores. La dirección más útil para este producto es un asistente editorial que explique qué hace repetitivo, genérico, impreciso o innecesariamente complejo un texto y proponga cambios verificables que preserven su contenido.

Esta auditoría incorpora evidencia reproducible y una propuesta de implementación. No modifica las reglas de producción ni atribuye una mejora de precisión a cambios que todavía no se han realizado.

## Alcance y método

Se revisaron ambos detectores, perplejidad, estilometría, expresiones regulares, segmentación, extracción DOCX/PDF, revisión bibliográfica, Unicode, sugerencias, interfaz, exportación y pruebas. Se ejecutaron las 21 pruebas Python y la suite JavaScript existentes: pasan. Esto verifica algunos comportamientos de software; no valida la precisión del detector.

Se añadieron 29 casos diagnósticos con sus entradas y salidas completas, una simulación de fallo neuronal y mediciones de rendimiento. Todos los textos de prueba fueron construidos para esta auditoría. No son un corpus representativo ni contienen controles de autoría humana verificada. No se deben calcular sensibilidad, especificidad o falsos positivos de autoría a partir de esta colección.

- [Resultados legibles](engine-audit/results.md).
- [Entradas y salidas completas](engine-audit/results.json).
- [Programa reproducible](../tools/audit_engine.py).
- Ejecución desde la raíz: `venv/bin/python tools/audit_engine.py`.

No se recibieron durante esta revisión los documentos concretos del usuario. No se enviaron textos a detectores comerciales, no se descargaron modelos y no se probaron sus servicios. La rama neuronal se inspeccionó y se simuló un fallo; no se validó su inferencia real. La extracción se revisó en código y mediante las pruebas existentes, sin un corpus nuevo de PDF de distintas maquetaciones.

## Resultados que explican el problema

| Prueba diagnóstica | Python /100 | Web /100 | Qué demuestra |
|---|---:|---:|---|
| Prosa genérica generada para la auditoría, 109 palabras | 12 | 14 | Un texto de origen conocido como generado puede recibir un resultado bajo. |
| El mismo bloque repetido cuatro veces, 436 palabras | 12 | 14 | La repetición entre bloques no aumenta el índice. No son cuatro textos independientes. |
| La misma oración repetida doce veces, 168 palabras | 12 | 15 | Una repetición literal extrema no produce frases prioritarias. |
| Oración que critica dos expresiones, citándolas literalmente | 100 | 100 | Las coincidencias se penalizan sin interpretar el contexto. |
| «Medimos temperatura, presión y humedad durante el ensayo.» | 62 | 65 | Una enumeración funcional recibe un índice alto en una muestra de una sola oración. |
| «En resumen, los resultados no permiten aceptar la hipótesis inicial.» | 12 | 65 | Las listas de reglas divergen entre implementaciones. |
| La misma oración comenzando con «En síntesis» | 62 | 15 | La divergencia también ocurre en la dirección contraria. |
| «Electroencefalografía» | 57 | 30 | Una palabra obtiene un dictamen numérico aunque no haya muestra suficiente. |
| Un texto idéntico visualmente, Unicode NFC frente a NFD | 100 → 62 | 100 → 65 | La codificación de tildes altera el análisis sin cambiar la redacción. |

En 21 de los 28 casos con puntuación numérica las implementaciones devolvieron valores distintos. El caso restante de los 29, en escritura no latina, se rechazó como vacío. Algunas diferencias son de redondeo; otras cambian la categoría y superan 40 puntos. Esta frecuencia describe exclusivamente estas pruebas dirigidas, no el tráfico real del producto.

## Hallazgos, causas y correcciones propuestas

### 1. Crítico: el índice léxico no es perplejidad de un modelo de lenguaje

Ubicación: `core/perplexity_engine.py:85`, `js/detector.js:127`.

La fórmula efectiva del modo habitual es:

`25 + 8,5 × entropía de caracteres + 20 × proporción de palabras únicas + 2 × longitud media de palabra`.

No calcula probabilidades condicionales de tokens, no consulta un modelo y no analiza el significado. Tampoco calcula compresión o n-gramas, aunque comentarios del código lo sugieren. No encontré en el repositorio los datos o el procedimiento que sustenten la afirmación de calibración con GPTZero.

Prueba: «Los técnicos analizaron cuidadosamente los registros del sensor durante la mañana.» y la misma lista de palabras en orden inverso reciben exactamente el mismo índice: 89,27 en Python y 89,3 en JavaScript. La fórmula es insensible al orden cuando conserva palabras y caracteres.

La perplejidad real usa la probabilidad de cada token condicionada al contexto y depende del modelo y su tokenización. Por ello, una escala inventada no es intercambiable con la perplejidad de GPT-2 ni con puntuaciones de otro detector. [Documentación de Transformers](https://huggingface.co/docs/transformers/en/perplexity).

**Propuesta:** retirar su contribución a cualquier inferencia de autoría. Si se conserva, identificarlo como descriptor léxico experimental y documentar su fórmula. Mantener separado cualquier resultado neuronal; sus cortes deben evaluarse para el idioma, modelo y dominio elegidos.

**Aceptación:** ninguna explicación lo presenta como probabilidad; no se combinan valores neuronales y heurísticos en una misma distribución; el resultado declara el método realmente ejecutado.

### 2. Crítico: la fórmula deja una zona extensa de textos prácticamente sin posibilidad de alerta

Ubicación: `core/detector.py:126`, `core/detector.py:190`, `js/detector.js:384`, `js/detector.js:462`.

Cuando no hay expresiones del catálogo y los índices por oración superan 55, la única aportación positiva individual restante es 0,15 por proximidad a la longitud media. No alcanza el corte de prioridad media, 0,30. Si además la media léxica supera 80, el índice global resta 15 puntos.

Bajo esas condiciones, el máximo global es **12/100 en Python** y **15/100 en JavaScript**, incluso con uniformidad máxima y con el incremento máximo por baja dispersión. Se obtiene de `0,2 × monotonía − 0,15 + 0,10`; la monotonía máxima es 0,85 en Python y 1 en JavaScript.

Esto explica matemáticamente la puntuación baja de los ejemplos. No es solamente que falten dos o tres palabras en un diccionario.

**Propuesta:** diseñar indicadores editoriales independientes con evidencia: repetición literal, repetición de aperturas, redundancia de ideas, acumulación de expresiones vagas y complejidad. Evitar que una característica léxica favorable cancele automáticamente una repetición objetiva. No prometer que estas características demuestran origen artificial.

**Aceptación:** doce oraciones idénticas generan una observación explícita de repetición con ubicación; el sistema no etiqueta el texto como natural por tener pocas coincidencias del catálogo.

### 3. Alta: las coincidencias cuentan varias veces y las categorías no corresponden al número mostrado

La misma expresión afecta al riesgo individual, a la proporción de frases medias/altas y a la densidad de clichés. Son señales correlacionadas contabilizadas repetidamente. Además, dos coincidencias bastan para marcar una frase como alta aunque su puntuación sea menor de 0,55.

El índice global pondera proporciones de oraciones y descriptores; no es una media de sus porcentajes ni una fracción de palabras generadas. Una sola enumeración puede dar 65/100 global y ninguna oración de prioridad alta. El usuario no puede reconstruir intuitivamente el resultado.

**Propuesta:** separar «cantidad de observaciones», «severidad editorial» y «cobertura analizada». Exponer contribuciones por dimensión. Una advertencia de estilo debe conservar la misma severidad y explicación en el panel, la frase y el informe.

### 4. Alta: la paridad Python/web anunciada no existe

Ubicación: `core/stylometrics.py:87`, `core/detector.py:128`, `js/detector.js:384`, `js/detector.js:452`.

Diferencias confirmadas:

- Monotonía Python por escalones de CV; JavaScript usa `1 − min(1, CV)`.
- Penalización léxica individual a partir de 85 en Python, 80 en JavaScript.
- Bonificación de perplejidad moderadamente baja: 0,30 frente a 0,25.
- Tope de contribución de clichés: 0,40 frente a 0,45.
- Catálogos distintos en español e inglés.
- Precisión y momentos de redondeo distintos.
- Segmentación, conteo de palabras y tratamiento de caracteres diferentes.

La prueba llamada de paridad compara el módulo académico, no las puntuaciones del detector completo.

**Propuesta:** una especificación versionada y catálogo único; contrato de entrada/salida compartido; fixtures comunes que comparen segmentación, evidencias, métricas, categoría y sugerencias. Si se conservan dos implementaciones, generar sus reglas desde el mismo origen y bloquear publicación ante divergencias.

### 5. Alta: falta contexto para distinguir una observación útil de una coincidencia inocua

Ubicación: `core/llm_heuristics.py:67`, `js/detector.js:152`.

Los patrones no distinguen citas, negación, títulos, ejemplos de expresiones criticadas, enumeraciones necesarias o función argumentativa del conector. Se detecta como hallazgo tanto usar una frase como mencionarla para explicar por qué no usarla. Una enumeración no demuestra por sí misma monotonía ni artificialidad.

**Propuesta:** marcar primero segmentos protegidos, analizar frecuencia contextual y reservar alertas fuertes para acumulación o repetición respaldada por ejemplos. Revisar una expresión por vaguedad o redundancia, no por una supuesta propiedad exclusiva de ChatGPT.

### 6. Alta: las sugerencias son sustituciones de cadenas y pueden empeorar la redacción

Ubicación: `humanizer/suggestion_engine.py:40`, `js/detector.js:181`, `js/app.js` en el controlador de alternativas automáticas.

Resultados reproducidos:

- «En conclusión, cabe destacar que el sensor falló.» → «Por consiguiente, particularmente, el sensor falló.» en Python.
- La web propone «Por consiguiente, específicamente, el sensor falló.».
- «El título original dice “En conclusión” y debe conservarse literalmente.» cambia la expresión dentro del título por «por consiguiente,».

Cambiar una fórmula por otra no garantiza naturalidad. Tampoco hay evaluación de concordancia, relación lógica, negación o preservación semántica. El botón de cambios globales mantiene otro diccionario independiente, con un tercer comportamiento potencialmente distinto.

**Propuesta:** conservar original y propuesta con diferencias visibles, aplicación por cambio y deshacer. Bloquear edición automática de citas, números, unidades, nombres, DOI, negaciones y referencias. Ofrecer eliminación de relleno o división de frases únicamente cuando preserve significado. Un modelo semántico opcional puede proponer alternativas, pero no debe inventar ejemplos, datos ni fuentes y requiere evaluación independiente.

**Aceptación:** las citas literales y datos protegidos permanecen idénticos; una alternativa no se presenta como mejor solo porque baja el índice del propio motor.

### 7. Alta: «marcas de agua» confunde formato Unicode con procedencia

Ubicación: `core/watermark_detector.py:85`, `js/detector.js:211`.

La regla declara esteganografía cuando hay tres caracteres invisibles seguidos o cinco en total. Dos emojis familiares contienen seis ZWJ y activan una alerta crítica de supuesto copiado desde IA. El estándar Unicode describe ZWJ como parte normal de secuencias de emoji. [Unicode UTS #51, §2.5](https://www.unicode.org/reports/tr51/#Emoji_ZWJ_Sequences).

Los caracteres ya no aumentan directamente el índice general, lo cual es positivo; sus mensajes siguen atribuyendo un origen que la regla no prueba. Eliminarlos indiscriminadamente puede cambiar cómo se muestran emojis o texto de otros sistemas de escritura.

**Propuesta:** «caracteres de formato detectados», con código, posición y contexto; distinguir usos válidos de anomalías. No declarar marca de agua o procedencia sin un esquema verificable. Ofrecer limpieza selectiva con vista previa.

### 8. Alta: la limpieza de caracteres contiene un fallo funcional independiente

Ubicación: `js/app.js:711` en la versión auditada.

El controlador llama `runAnalysis()`, que no está definido; la función existente es `startAnalysis()`. Reproduje el controlador en un entorno aislado y devolvió `ReferenceError: runAnalysis is not defined`. El texto ya se modificó antes de fallar, por lo que puede quedar desincronizado con el informe.

**Propuesta:** centralizar el análisis del texto actualizado, actualizar el estado solo cuando termine y añadir una prueba del botón completo, con recuperación de errores. Revisar que los cambios respeten la protección Unicode propuesta en el hallazgo anterior.

### 9. Alta: segmentación y normalización alteran tanto análisis como contenido

Ubicación: `core/sentence_tokenizer.py:45`, `js/detector.js:79`.

- Python consume la comilla de cierre al separar «Dijo “El resultado es estable.” Luego…»; JavaScript la conserva.
- «A. García… B. Pérez…» se fragmenta de forma distinta: cuatro segmentos en Python y tres en JavaScript.
- Un punto seguido de minúscula no separa oración.
- Unicode NFC/NFD cambia coincidencias y recuentos: 16 palabras pasan a 19 en un mismo texto visible.
- Los párrafos con una línea en blanco que contiene espacios no reciben idéntico tratamiento.
- `e.g` e `i.e` se interpolan sin escapar sus puntos en las expresiones JavaScript.

**Propuesta:** normalización NFC sobre una copia para análisis, con mapa hacia las posiciones originales; segmentación común; pruebas de iniciales, citas, decimales, listas, abreviaturas y finales de párrafo. El texto exportado debe preservar exactamente el contenido original salvo cambios aceptados.

### 10. Alta: aislamiento parcial o excesivo de bibliografía

Ubicación: `core/academic_review.py:10`, `core/detector.py:84`, `js/academic-review.js:20`.

- `5. Referencias` no se reconoce como encabezado.
- Todo lo que sigue a «Referencias» se considera bibliografía: también anexos o prosa posterior.
- Un documento que solo contiene bibliografía vuelve a analizarse como cuerpo; en Python además reaparece una entrada al añadir la bibliografía a los resultados.
- Python pasa `raw_text` a estilometría, pese a segmentar el cuerpo por separado. En una prueba el conteo es 32 palabras frente a 14 en web.
- El encabezado bibliográfico no se conserva como segmento del manuscrito reconstruido.

**Propuesta:** clasificar bloques y sus límites; distinguir cuerpo, citas, títulos, bibliografía, tablas y anexos. Informar palabras totales, analizadas y excluidas por motivo. Un documento sin cuerpo debe figurar como no evaluable para estilo.

### 11. Alta: el modo neuronal puede mezclar escalas sin declararlo

Ubicación: `core/perplexity_engine.py:63`.

Cualquier excepción por oración hace que el cálculo vuelva silenciosamente a la heurística; el informe sigue declarando `engine_mode: neural`. La simulación de un fallo del tokenizador reprodujo exactamente ese estado. No hay ventanas para secuencias que excedan el contexto ni cálculo agregado ponderado por número de tokens. Promediar perplejidades de oraciones no equivale a calcular la perplejidad del documento a partir de su pérdida total.

El modelo configurado por defecto es GPT-2, cuyo modelo publicado corresponde a inglés; activarlo no valida automáticamente documentos académicos en español. [Ficha del modelo](https://huggingface.co/openai-community/gpt2).

**Propuesta:** rama experimental separada, idioma y modelo explícitos, ventanas adecuadas, pérdidas agregadas por tokens, errores por segmento y prohibición de mezclar escalas. No adoptar un modelo hasta medir su beneficio frente a una línea base editorial sencilla.

### 12. Media/alta: no existe una política de muestra suficiente o idioma compatible

Hay clasificación con una sola palabra; un texto no latino se presenta como vacío. La legibilidad informa «español supuesto», pero la clasificación general continúa. Un aviso de menos de 100 palabras aparece en legibilidad; no limita la confianza del índice principal.

**Propuesta:** estados distintos: sin texto, idioma no compatible, extracción incompleta, muestra breve y análisis disponible. Los mínimos deben definirse por dimensión y validarse; no copiar el mínimo de otro proveedor como si validara este motor.

### 13. Media: las métricas descriptivas están mal explicadas o no se utilizan

`burstiness` es la desviación estándar de los índices por oración. No es la variación de longitudes ni mide directamente ritmo humano. La guía de la interfaz le atribuye esas propiedades y propone cortes sin evaluación demostrada. TTR depende de la extensión y se calcula, pero no alimenta directamente la puntuación global; la entropía del vocabulario tampoco. El conteo denominado `cliche_count` cuenta oraciones afectadas, no coincidencias individuales.

**Propuesta:** documentar unidad, fórmula y límites de cada indicador; mostrar solo los que ayudan a tomar una decisión. Medir diversidad en ventanas comparables y mantenerla descriptiva. No usar vocabulario largo como recompensa automática de calidad.

### 14. Media: extracción y referencias carecen de cobertura verificable

Los extractores trabajan principalmente con texto; no mantienen una representación completa de páginas, bloques, citas y tablas. PDF con columnas, notas o escaneo puede perder estructura. El navegador descarta los mensajes de extracción de Mammoth. En PDF una página sin texto puede quedar fuera del contenido sin una advertencia por página.

La comprobación bibliográfica interna usa apellido/año o número. Su éxito significa correspondencia parcial, no existencia de fuente ni respaldo de una afirmación. Crossref resuelve el DOI y muestra metadatos, pero el texto «Referencia comprobada» no demuestra que autor, título y año del manuscrito coincidan: falta compararlos. Una respuesta 404 solo expresa que no se encontró en ese catálogo.

**Propuesta:** cobertura por página y tipo de bloque, advertencias visibles y ubicación de cada observación. Comparar metadatos al consultar fuentes; separar «DOI resuelto», «metadatos coincidentes» y «afirmación respaldada». La última requiere revisar el pasaje de la fuente.

### 15. Media: resultado y rendimiento no tienen trazabilidad suficiente

La salida no contiene versión del detector de estilo, huella del documento, configuración de reglas o desglose de contribuciones. Los informes reconstruyen texto y no preservan la maquetación original. El informe puede conservar explicaciones distintas a las visibles en la interfaz.

El análisis web se ejecuta en el hilo principal tras un `setTimeout`; eso demora su inicio, pero no hace que el cálculo sea concurrente. Una prueba aislada de 70.000 palabras tardó aproximadamente 85 ms en JavaScript y 445 ms en Python en esta máquina. No incluye extracción ni renderizado y no prueba que el navegador sea fluido con documentos reales complejos. No hay progreso o cancelación durante el cálculo.

**Propuesta:** una salida canónica para interfaz y exportación, motor en Web Worker, cancelación, límites documentados y renderizado por bloques cuando sea necesario. Medir latencia p50/p95 en dispositivos objetivo y archivos representativos antes de fijar límites.

## Diseño recomendado para un motor útil

### Separar tres preguntas

1. **Calidad de redacción:** ¿qué fragmentos resultan repetitivos, vagos, densos o difíciles de seguir? Puede responderse con evidencia editorial concreta.
2. **Validez académica:** ¿hay correspondencia de citas, metadatos correctos y respaldo documental? Requiere reglas bibliográficas y revisión de fuentes; no debe confundirse con naturalidad.
3. **Origen del texto:** ¿fue generado o asistido por IA? Es una tarea diferente, incierta, que exige datos de autoría y evaluación específica.

El objetivo práctico de este producto puede cubrir las dos primeras y declarar la tercera como no determinada. Conocer que un texto viene de IA no implica que deba marcarse como mal redactado. Un texto humano también puede ser repetitivo o genérico.

### Flujo propuesto

`Extracción con cobertura → normalización con posiciones originales → clasificación de bloques → segmentación → señales editoriales por ventana y documento → evidencias y prioridades → propuestas con diferencias y protección de contenido → relectura y exportación trazable`.

Cada hallazgo debería registrar identificador de regla, versión, dimensión, ubicación, fragmento exacto, explicación, severidad y limitaciones. La interfaz debe distinguir «no se detectó con estas reglas» de «no evaluable»; ninguna de las dos equivale a aprobar autoría.

### Dimensiones que conviene añadir

| Dimensión | Implementación inicial razonable | Precaución |
|---|---|---|
| Repetición literal | Frecuencia de secuencias de palabras y frases, con ubicaciones | Excluir citas, terminología necesaria y encabezados repetidos. |
| Repetición de aperturas | Comparar inicios de frases y párrafos dentro de una sección | Una estructura metodológica repetida puede ser deliberada. |
| Uniformidad | Distribución de longitudes y estructuras sobre ventanas suficientes | No convertir uniformidad en prueba de IA. |
| Redundancia de ideas | Primera versión: similitud léxica; después, representación semántica evaluada | Explicar qué dos pasajes se solapan y admitir incertidumbre. |
| Vaguedad | Marcadores genéricos junto con contexto y falta de referente concreto | No exigir cifras ni ejemplos inventados para bajar el índice. |
| Complejidad | Densidad de cláusulas, frases extensas, nominalizaciones y referentes ambiguos | Adaptar al género; un texto técnico no debe simplificarse a costa de precisión. |
| Coherencia | Referentes y conexiones entre afirmaciones, método y conclusiones | Requiere revisión contextual; una lista de palabras no basta. |
| Consistencia | Terminología, cifras, nombres, unidades y citas | Conservar evidencia de discrepancia y ofrecer revisión manual. |

Un componente semántico opcional puede ayudar con redundancia y coherencia. Debe activarse por separado, tener coste y tratamiento de datos explícitos, recibir instrucciones de devolver evidencia localizada y abstenerse cuando no pueda sustentarla. Un LLM que opina «suena a IA» no constituye por sí mismo un detector validado.

## Evaluación necesaria para reducir el margen de error

### Dos conjuntos de evaluación distintos

**Editorial:** textos reales con observaciones marcadas por al menos dos revisores. Etiquetar el problema, localización, severidad y si la alternativa conserva significado. Evaluar aciertos por dimensión, alertas inútiles por documento, problemas omitidos y acuerdo entre revisores.

**Autoría, solo si se mantiene esa función:** textos humanos con procedencia verificable, textos de distintos modelos y versiones, textos editados, textos mixtos y usos de IA declarados. Cubrir español, disciplinas, regiones, extensiones y géneros. Separar entrenamiento y evaluación por autor/documento/familia de prompts; reservar modelos o versiones y dominios no vistos para evaluar generalización. No repartir fragmentos del mismo documento entre conjuntos.

M4 documenta problemas de generalización a dominios o generadores no vistos. MULTITuDE incluye español y permite estudiar evaluación multilingüe; puede servir como punto de partida histórico, pero no reemplaza un conjunto académico actual y representativo del uso del producto. [M4](https://aclanthology.org/2024.eacl-long.83/), [MULTITuDE](https://aclanthology.org/2023.emnlp-main.616/).

### Qué medir y publicar

- Precisión y exhaustividad por clase de observación; resultados desglosados por idioma, disciplina, longitud y fuente.
- Si se estima autoría: matriz de confusión, falsos positivos y falsos negativos, calibración y cobertura de abstención. La exactitud global sola puede ocultar fallos graves.
- Intervalos de incertidumbre agrupando por documento/autor; no tratar cada frase de un mismo trabajo como ejemplo independiente.
- Antes/después con evaluación ciega de claridad, fidelidad semántica y utilidad. No medir calidad solo como reducción del score propio.
- Resultados de ablación: comprobar qué aporta cada indicador y si introduce alertas innecesarias.
- Rendimiento de extremo a extremo: carga, extracción, análisis, renderizado y exportación; documentos válidos, corruptos y parcialmente escaneados.

No hay base hoy para declarar «95 % de precisión», «menos de 1 % de error» o cualquier cifra semejante. Un objetivo de error debe fijarse antes de evaluar, justificar el tamaño de muestra y comprobarse en un conjunto independiente. Por ejemplo, observar cero errores en unas pocas decenas de textos no demuestra un error poblacional cercano a cero.

## Orden de implementación y criterios de salida

| Etapa | Entregable | Criterio para avanzar |
|---|---|---|
| 1. Corrección y coherencia | Paridad completa, Unicode/segmentación, bibliografía, limpieza sin excepciones, modo neuronal explícito | Fixtures comunes pasan; no se pierde contenido; estados no evaluables explícitos. |
| 2. Revisión editorial | Hallazgos de repetición, aperturas, vaguedad contextual y complejidad; ubicación y desglose | Los problemas objetivos de este informe se detectan sin marcar citas protegidas como redacción propia. |
| 3. Sugerencias seguras | Diferencias visibles, preservación de datos, aceptación individual, deshacer y comparación | Citas, nombres, cifras, negaciones y conclusiones no cambian sin revisión; evaluación editorial favorable. |
| 4. Evaluación independiente | Corpus con procedencia, revisores, partición y métricas documentadas | Mejora medible por dimensión frente al motor anterior y una línea base simple. |
| 5. Semántica opcional | Revisión contextual con evidencias y abstención | Beneficio incremental demostrado, con privacidad, coste y latencia aceptables. |
| 6. Detección de origen opcional | Modelo específico y calibrado, separado del editor | Rendimiento externo documentado; resultado incierto cuando corresponde; ninguna equivalencia inventada con terceros. |

La siguiente entrega recomendable es un motor editorial versión 2 con reglas compartidas y evidencia por fragmento. Cambiar únicamente el nombre de las métricas o elevar umbrales no aborda los fallos encontrados.

## Relación con Turnitin y otros servicios

No existe en este repositorio una implementación, integración o validación emparejada que permita predecir el resultado de esos productos. Turnitin describe su porcentaje como proporción de prosa evaluable identificada por su modelo y lo distingue del porcentaje de similitud; también reconoce errores y desaconseja usarlo como única base de una decisión adversa. Por tanto, 14/100 en Zero-IA no se traduce en un porcentaje esperado en Turnitin. [Guía oficial](https://guides.turnitin.com/hc/en-us/articles/22774058814093-Using-the-AI-Writing-Report).

Si en el futuro se evalúa concordancia con un servicio externo, se necesitarían documentos autorizados, resultados reales con fecha y versión y un conjunto independiente. Esa concordancia mediría semejanza entre sistemas, no calidad, autoría verdadera ni garantía de superar futuras revisiones.

## Cambios realizados en esta entrega

Se añadieron el programa de diagnóstico, las entradas/salidas y este informe. Se mantuvo el motor de producción intacto para conservar la línea base y evitar introducir pesos arbitrarios durante una auditoría. Los defectos y las mejoras descritos quedan identificados como pendientes de implementación, no como correcciones ya publicadas.
