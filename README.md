# Zero-IA · Validador Académico y Asistente Editorial

Validador de manuscritos, tesis y textos académicos. Evalúa la pulcritud editorial, detecta repeticiones literales y de apertura, mide legibilidad (Flesch-Szigriszt / INFLESZ) y comprueba la coherencia entre citas y bibliografía (APA/Harvard e IEEE). Proporciona un **Índice de Validación porcentual (0–100%)** que refleja la proporción del texto libre de incidencias y observaciones. No ofrece porcentajes especulativos de autoría ni promete resultados frente a Turnitin.

## Uso

La aplicación estática procesa el texto en el navegador. Para ejecutarla desde esta carpeta:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Abre http://127.0.0.1:8765. Para archivos abiertos mediante `file://` hay un modo limitado de compatibilidad; el servidor local permite análisis en segundo plano, cancelación y documentos extensos. Se admiten DOCX, PDF, TXT y MD, hasta 20 MB y 500.000 caracteres. Los PDF escaneados requieren OCR externo. Las advertencias describen posibles omisiones de extracción.

La interfaz Python requiere **Node.js 22+** y Python 3.11+ para ejecutar exactamente el mismo motor editorial:

```bash
./run.sh
```

Streamlit procesa los documentos en el equipo donde se ejecuta su servidor. La versión estática carga fuentes y bibliotecas desde CDN, pero no envía el manuscrito a un servicio de análisis. La consulta opcional de Crossref envía el DOI solicitado, no el documento.

## Resultados y edición

- **Índice de Validación (0–100%)**: Proporción ponderada del texto libre de incidencias y observaciones editoriales.
- Observaciones por repetición, estructura, precisión y claridad, con prioridad y fragmentos.
- Cobertura explícita y estados de muestra breve, idioma no compatible o ausencia de prosa. Español es el idioma seleccionado; el control de idioma es una comprobación básica, no un clasificador multilingüe.
- Citas, títulos, bibliografía, listas y tablas reciben tratamiento conservador. La detección de estructura sobre texto extraído es heurística y debe comprobarse.
- Propuestas individuales limitadas a introducciones de énfasis; no reescribe automáticamente todo el texto ni altera citas, cifras o negaciones.
- Hasta 20 revisiones deshacibles durante la sesión; descarga independiente del original, texto editado e informe. No hay almacenamiento persistente del historial.
- Unicode se informa como formato, no como marca de IA; solo puede retirarse automáticamente un BOM inicial.
- Word anotado en Streamlit; informe Markdown y vista de impresión en la web. El Word exportado reproduce texto extraído, no el diseño del archivo original.

## Motor y evaluación

`config/editorial-rules.json` contiene las reglas versionadas; `python3 tools/build_rules.py` genera su versión web. `js/detector.js` es el motor único; Python lo invoca por stdin en un proceso Node local, con tiempo máximo. Los desplazamientos de evidencia utilizan unidades UTF-16.

```bash
venv/bin/python -m unittest discover tests/ -v
node tests/test_browser.js
python3 tools/build_rules.py --check
venv/bin/python tools/evaluate_editorial.py tests/fixtures/editorial-cases.jsonl
```

Las pruebas sintéticas comprueban regresiones, **no precisión real ni origen humano/IA**. El evaluador mide presencia de reglas por documento y rechaza documentos o grupos compartidos entre particiones. Protocolo y pendientes: [evaluación](docs/EVALUACION_V2.md). Diagnóstico histórico: [auditoría](docs/AUDITORIA_MOTOR_2026-09-25.md). Cambios y límites: [implementación](docs/IMPLEMENTACION_V2.md).

El módulo neuronal opcional (`requirements-neural.txt`) exige elegir un modelo explícitamente, utiliza ventanas y pérdida ponderada por tokens, y devuelve indisponibilidad ante fallos. No descarga modelos salvo autorización explícita en su API; no participa en el informe editorial ni en una predicción de autoría. Su cálculo se basa en la [documentación de Transformers](https://huggingface.co/docs/transformers/perplexity).
