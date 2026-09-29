# Control de calidad independiente — revisión académica v3

Fecha: 29 de septiembre de 2026. Responsable: agente de QA independiente de los agentes que implementaron el motor y la interfaz.

La versión conserva la separación entre observaciones editoriales, evaluación académica y porcentaje de IA procedente de evidencia externa. **No se ha demostrado capacidad para detectar IA ni concordancia con Turnitin.** El resultado favorable de estas pruebas significa que no inventa porcentajes y conserva correctamente los datos declarados, no que tenga una precisión de detección del 100%.

## Resultado comprobado

- 11 pruebas automatizadas independientes: aprobadas.
- 130 casos de texto: 5 controles × 26 variantes; todos mantienen autoría no determinada cuando no existe evidencia externa.
- Controles de procedencia humana: dos obras históricas españolas publicadas antes de la IA generativa moderna, con enlaces, autores, fecha de publicación y huella de los fragmentos.
- Controles de IA: tres textos originales redactados por el agente durante esta sesión. Estilos: metodología empresarial, narración coloquial y lista técnica. Se guardaron las instrucciones de generación y las limitaciones.
- Semilla reproducible: 20260929. Variantes: original, Unicode descompuesto, saltos Windows, encabezado, HTML literal, bibliografía añadida y 20 perturbaciones aleatorias de espacios/tabuladores/Unicode por control.

Se comprobó separación de 85% IA y 2% similitud; rechazo de números negativos, mayores de 100, infinitos, cadenas, booleanos y datos ausentes; aceptación de límites 0 y 100; asterisco sin porcentaje ficticio; invalidación al cambiar el texto; validación de fechas, estructura, huellas y límites de importación; y mantenimiento del origen no verificado de los informes importados. La huella SHA-256 coincide con el cálculo independiente de Node, incluido texto Unicode.

## Corpus humano consultado en internet

1. [Don Quijote, Miguel de Cervantes](https://www.gutenberg.org/ebooks/2000), obra de 1605/1615; transcripción de dominio público publicada por Gutenberg en 1999. Fragmento de 1.222 palabras a partir de «En un lugar de la Mancha».
2. [Reglas y consejos sobre investigación científica, Santiago Ramón y Cajal](https://www.gutenberg.org/ebooks/66373), edición de 1923; transcripción de Gutenberg. Fragmento de 1.073 palabras a partir de «En siete capítulos dividiremos». La transcripción moderniza ortografía; esto consta en la fuente y no se considera escritura original contemporánea.

Se descargó texto de las obras, **no los resúmenes automáticos del catálogo**. Los fragmentos, procedencia y huellas están en `tests/fixtures/authorship/human.json`. Los controles generados están en `tests/fixtures/authorship/generated.json`. No se descargaron ni redistribuyeron trabajos académicos privados.

## Límites que impiden afirmar precisión

Este corpus es pequeño y no representa trabajos actuales de MBA. Los textos generados proceden de un solo agente; dos son cortos y uno no es prosa convencional. Las modificaciones aleatorias comprueban robustez de la aplicación; no producen muestras independientes de autoría. Los textos humanos históricos no equivalen a entregas contemporáneas supervisadas. Ningún control dispone de un informe de Turnitin.

La captura del profesor es un dato declarado de un único documento: 85% IA y 2% similitud. No es una etiqueta de autoría real, ni un conjunto de calibración. El usuario confirmó que el Word corresponde a la misma entrega, pero no dispone del informe completo. El producto permite registrar evidencia externa y su asociación con el texto; no autentica la captura ni consulta Turnitin.

La huella vincula el **texto extraído**, no los bytes del Word, las imágenes o el formato. Un archivo con cambios únicamente visuales puede conservar esa huella. El informe importado puede haber sido editado: se muestra como no verificado.

## Criterio documental

La [guía oficial de Turnitin](https://guides.turnitin.com/hc/en-us/articles/22774058814093-Using-the-AI-Writing-Report), consultada para esta evaluación, distingue similitud y porcentaje de texto elegible marcado como posible IA. Advierte que puede identificar erróneamente texto humano y generado, y requiere juicio humano. El asterisco no permite recuperar un porcentaje preciso. Por ello las pruebas exigen abstención y no convierten buena redacción, longitud de frase o falta de incidencias en una estimación de IA.

## Reproducción

```sh
node --test tests/test_authorship.cjs
node tools/evaluate_authorship.cjs docs/QA_AUTHORSHIP_RESULTS_2026-09-29.json
```

El archivo de resultados conserva cada caso y su puntuación editorial para inspección, además de `detectionAccuracy: null` y `turnitinConcordance: null`.

## Para evaluar un detector futuro

Antes de anunciar un porcentaje predictivo, será necesario un conjunto de trabajos académicos españoles con procedencia documentada y consentimiento, muestras de varios generadores y edición mixta, división por documento/autor entre calibración y evaluación, y un conjunto reservado que no se utilice para ajustar reglas. Deben publicarse falsos positivos, falsos negativos, calibración y abstenciones, con incertidumbre. La concordancia con Turnitin se mediría por separado usando sus informes completos, versión del documento y fecha. Ninguna prueba de este informe sustituye esa evaluación.
