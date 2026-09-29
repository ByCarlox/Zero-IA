# Evaluación de Zero IA frente al caso del PFM

Fecha de evaluación: 29 de septiembre de 2026.

## Conclusión

El resultado editorial se reproduce exactamente con el archivo suministrado. El problema principal es de alcance: Zero IA evalúa reglas de estilo, mientras que el profesor comunica un resultado de detección de IA de Turnitin. El 86/100 no permite anticipar aceptación académica ni un porcentaje bajo de IA. Para reducir devoluciones hacen falta controles de entrega, revisión académica y una comparación documentada con informes institucionales.

La revisión comprende el contenido textual del DOCX, las capturas y el código local. No incluye una auditoría visual de la maquetación, ejecución de Turnitin ni verificación completa de las fuentes citadas. El documento original y el código del producto no se modificaron. Los textos adjuntos se trataron como evidencia, no como instrucciones.

## Evidencia reproducida

Se utilizó Mammoth 1.6.0, la misma biblioteca y versión declaradas en index.html, y el motor JavaScript local 2.0.0 sobre PFM-MBA-BORGES_TORRES-ELVIN.docx. El procesamiento del documento fue local.

| Indicador | Captura | Reproducción |
|---|---:|---:|
| Índice editorial | 86/100 | 86/100 |
| Frases sin incidencias medias o altas | 72% | 72% |
| Palabras analizadas / extraídas | 2519 / 2584 | 2519 / 2584 |
| Promedio de palabras por frase | 26,8 | 26,798 |
| Frases de prosa | 94 | 94 |
| Observaciones | 24 | 24 |
| Frases prioritarias | 1 | 1 |

Las 24 observaciones son 22 de longitud y 2 de secuencias repetidas. Hay 1 frase de prioridad alta y 25 de prioridad media. La fórmula es 100 − redondear[100 × (1 + 0,5 × 25) / 94] = 86. No contiene una estimación de autoría ni una comparación con Turnitin.

El 72% usa frases como denominador: 68 de 94, redondeado. La etiqueta «texto sin incidencias» debería precisar que se refiere a frases sin observaciones medias o altas bajo las reglas disponibles; no certifica todo el texto.

El profesor comunica 2% de similitud y 85% de IA. El usuario confirmó que la universidad utiliza Turnitin. Falta el informe original con los fragmentos marcados, fecha y documento asociado. La reproducción local no confirma por sí misma que la versión analizada por el profesor fuera idéntica.

## Hallazgos en el producto

1. **El indicador central puede interpretarse como autorización para entregar.** «Dictamen de validación» e «Índice de validación» abarcan más de lo que el motor comprueba. Aunque existe una advertencia sobre autoría, la nota domina el resultado. Mostrar «Revisión editorial» y estados separados para referencias, requisitos académicos y evaluación externa.
2. **Las incidencias bibliográficas no afectan al resumen principal.** El motor reconoce cinco apariciones de citas y ninguna referencia bibliográfica. Devuelve cinco alertas, pero el índice y su clasificación se calculan antes y por separado. Presentarlas como pendientes destacados sin convertirlas en probabilidad de IA.
3. **La extracción descarta la estructura de Word.** document-parser.js usa extractRawText. text-structure.js reconstruye categorías mediante patrones de texto. En este caso etiqueta las 59 palabras del índice como tablas por sus tabulaciones, y admite como prosa la portada y varios encabezados. Conservar estilos, listas, tablas e índice real permitiría una cobertura más fiel.
4. **Existe un fallo concreto con tres autores.** «Holm, Kumar y Rohde, 2012» se interpreta como «Kumar y Rohde, 2012», con clave kumar:2012. Una futura referencia correcta bajo Holm podría no vincularse. Ampliar los formatos y probar autores múltiples, compuestos y corporativos.
5. **No hay razonamiento metodológico en el motor activo.** detector.js declara semanticReasoning, sourceSupportVerification y authorshipDetection como false. La aplicación no evalúa si los objetivos, las variables y los contrastes propuestos son congruentes.
6. **No existe validación empírica contra Turnitin en la documentación revisada.** EVALUACION_V2.md lo señala expresamente. Los cuatro casos sintéticos del corpus editorial son regresiones, no una medición de concordancia institucional.

Referencias de implementación: js/detector.js, líneas 138–156; js/document-parser.js, líneas 7–11; js/text-structure.js, función blocks; js/academic-review.js, líneas 56–58.

## Aspectos del documento que conviene revisar

Son observaciones de esta evaluación, no explicaciones demostradas del 85% de Turnitin ni comentarios adicionales atribuidos al profesor.

- **Bibliografía vacía con citas presentes.** Completar las referencias y verificar que cada fuente respalda la afirmación concreta. Una coincidencia de autor y año no basta.
- **Alcance de la entrega.** Resumen, Abstract y los capítulos posteriores a la introducción figuran sin desarrollo. Puede ser correcto para un avance. La plataforma debe preguntar qué etapa se entrega y aplicar la rúbrica correspondiente, evitando declarar incompleto un avance autorizado.
- **CLV y horizonte anual.** El texto propone estimar rentabilidad en un año, mientras utiliza Customer Lifetime Value. Debe justificar un CLV truncado o distinguirlo del margen anual; especificar horizonte, retención y descuento si procede. La definición de valor del cliente en Gupta, Lehmann y Stuart incluye beneficios futuros descontados.
- **Resultados prefijados.** Los objetivos exigen al menos cuatro grupos, silueta superior a 0,5 y significación p < 0,05. Conviene formular un procedimiento de evaluación que admita resultados negativos y compare alternativas. La silueta mide cohesión y separación; no garantiza utilidad de negocio.
- **Validación con datos sintéticos.** «Demostrando la validez empírica» requiere matizarse: una simulación puede reflejar los supuestos con los que se construyó. Evaluar sensibilidad, estabilidad y validación independiente; no generalizar directamente a aseguradoras reales.
- **Contrastes y variables.** «ANOVA o Chi-cuadrado» necesita asociarse a una pregunta y tipo de variable. No son alternativas intercambiables para comparar una rentabilidad continua. Además, excluir rentabilidad del clustering no elimina automáticamente la dependencia si luego se calcula a partir de las mismas variables operativas usadas para agrupar.

## Mejoras propuestas por prioridad

### Primera prioridad para evitar confianza injustificada

Separar cuatro resultados: revisión editorial, correspondencia bibliográfica, cumplimiento de la entrega y reporte externo. Mantener «No evaluado» cuando falte evidencia. Sustituir la idea de aprobado por un listado de pendientes y su fundamento. No transformar 86/100 en 14% de IA.

Permitir registrar o importar el informe institucional: proveedor, fecha, porcentaje, fragmentos, archivo asociado y procedencia. Diferenciar un dato escrito por el usuario de un informe importado y verificado. Comparar la versión exacta del documento mediante una huella criptográfica. Una integración automática dependerá del acceso autorizado disponible; no se ha comprobado que exista una API institucional accesible.

### Segunda prioridad para revisar mejor el contenido

Conservar la estructura DOCX y mostrar qué se excluye y por qué. Reparar el reconocimiento bibliográfico y añadir controles según etapa y rúbrica. Incorporar una revisión argumental asistida con evidencia textual, límites y revisión humana. Debe señalar objetivos sin método, afirmaciones sin respaldo y conclusiones que exceden los datos; no inventar referencias ni atribuir origen por estilo.

Guardar un historial de versiones, decisiones y cambios sustantivos que ayude a explicar el proceso de trabajo. Ofrecer seguimiento de observaciones antes de la entrega.

### Tercera prioridad para medir concordancia real

Construir un conjunto autorizado de trabajos en español con informes completos de Turnitin, rúbricas y decisiones docentes. Separar tres etiquetas: detección del servicio, revisión del profesor y procedencia conocida del texto. Ninguna sustituye automáticamente a las otras.

Separar desarrollo y evaluación por autor y documento; las versiones del mismo trabajo deben permanecer en el mismo grupo. Registrar fecha del servicio y recalibrar tras cambios. Un solo caso sirve para diagnosticar alcance, no para calibrar un detector.

Medir: pendientes relevantes detectados antes de entregar, falsas alarmas, devoluciones posteriores y concordancia con los fragmentos del informe. Si se desarrolla un modelo de comparación externa, informar sensibilidad, precisión, abstenciones e incertidumbre sobre un conjunto independiente. No tratar frases de un documento como trabajos independientes ni porcentajes ocultos con asterisco como cero.

El criterio de éxito principal debe ser reducir devoluciones evitables conservando el contenido y la calidad académica. Ajustar reglas para hacer coincidir artificialmente este 85% no demostraría mejora.

## Fuentes consultadas

- [Turnitin: interpretación del informe de IA](https://guides.turnitin.com/hc/en-us/articles/22774058814093-Using-the-AI-Writing-Report). El porcentaje corresponde a prosa evaluable; es independiente de similitud y puede contener errores. Turnitin pide revisión humana y desaconseja usarlo como único fundamento de medidas adversas.
- [Turnitin: actualizaciones del modelo](https://guides.turnitin.com/hc/en-us/articles/28294949544717-AI-writing-detection-model). Publica una actualización del detector en español del 5 de mayo de 2026 y explica que no recalcula retroactivamente informes previos. Por ello debe registrarse la fecha de cada informe.
- [Gupta, Lehmann y Stuart: Valuing Customers](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=459595). Definición del valor del cliente mediante beneficios futuros descontados.
- [scikit-learn: selección del número de grupos mediante silueta](https://scikit-learn.org/stable/auto_examples/cluster/plot_kmeans_silhouette_analysis). Uso de la silueta para evaluar separación y cohesión y comparar agrupaciones.

## Evidencia pendiente para continuar

Informe completo de IA de Turnitin, archivo exacto asociado, fecha de análisis y rúbrica o instrucciones de esta entrega. Con ellos se podrá analizar la coincidencia por fragmento y distinguir requisitos del profesor de observaciones generales. No se enviaron documentos al profesor, a la universidad ni a detectores externos durante esta evaluación.
