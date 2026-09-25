# Protocolo de validación pendiente

No se ha establecido una tasa de error de población. Los cuatro casos incluidos son pruebas sintéticas de regresión; sus resultados no se deben anunciar como precisión del producto.

## Corpus editorial

Reunir documentos con permiso de uso, de distintos géneros, longitudes y disciplinas, incluyendo documentos humanos, generados y editados con IA. Dos revisores independientes deben marcar problemas editoriales y resolver discrepancias sin conocer el origen. Conservar casos negativos: citas literales, fórmulas disciplinares, lenguaje técnico, listas y paralelismo deliberado.

Formato JSONL del evaluador: `id`, `group`, `split` (train/dev/test), `text`, `expected_rules` y `provenance`. `expected_rules` necesita una lista exhaustiva de reglas presentes; una etiqueta ausente se considera negativa. `group` debe unir variantes del mismo documento, autor, tema/prompt o fuente que puedan filtrar información. El evaluador detecta grupos y duplicados exactos entre particiones; no detecta por sí mismo autores comunes ni paráfrasis.

Congelar reglas antes de abrir el conjunto de prueba. Publicar por regla y por dominio: verdaderos positivos, falsos positivos, falsos negativos, precisión, sensibilidad, cobertura y abstenciones. El evaluador actual cuenta presencia por documento, no calidad de cada posición de evidencia. Revisar posiciones separadamente. Estimar incertidumbre mediante remuestreo por grupos cuando exista un corpus representativo suficiente; no tratar frases del mismo documento como muestras independientes.

## Autoría, semántica y servicios externos

Son evaluaciones distintas y aún no implementadas como capacidades del producto. Para un clasificador de origen se necesitan etiquetas verificables de procedencia, versiones y fechas de modelos, documentos mixtos y un conjunto externo no usado en ajustes. Una etiqueta editorial no sirve como etiqueta de origen.

Para coherencia argumental y respaldo de citas hacen falta anotaciones semánticas y acceso al contenido de las fuentes, no solo metadatos DOI. No se habilitarán afirmaciones de detección por incorporar un modelo sin evaluarlo.

Comparar servicios externos requiere acceso autorizado, registrar versiones/fecha/configuración y ejecutar el mismo corpus bajo condiciones comparables. No se han ejecutado pruebas de Turnitin ni servicios pagos. Los resultados de Zero-IA no los predicen.
