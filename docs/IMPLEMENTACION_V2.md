# Implementación v2 · 25 septiembre 2026

## Correcciones de la auditoría

| Hallazgo | Cambio |
|---|---|
| 1, 2, 3: perplejidad falsa, topes y puntuaciones engañosas | Retirado el índice global. Hallazgos explicables por dimensión, sin inferir autoría. |
| 4: divergencia web/Python | Un motor JavaScript compartido mediante adaptador local Node. |
| 5: contexto | Protección de citas, URLs y referencias parentéticas; negación próxima; repetición documental y aperturas repetidas. No equivale a comprensión semántica. |
| 6: reescrituras dañinas | Solo cuatro introducciones conservadoras; aceptación individual, texto original, comprobación de versión y deshacer. |
| 7, 8: Unicode y botón roto | Diagnóstico de formato y posiciones; conserva uniones/direcciones; retirada exclusiva del BOM inicial. |
| 9: segmentación y Unicode | Comparación NFC y evidencia sobre los caracteres originales; desplazamientos UTF-16. |
| 10: bibliografía | Encabezados numerados y fin de sección en anexos; exclusiones explícitas. |
| 11: neuronal | Módulo experimental separado, sin sustitución silenciosa; ventanas y agregación ponderada por tokens. Modelo real no descargado ni validado. |
| 12, 13: muestra/idioma y explicaciones | Estados parciales, idioma seleccionado y promedios descriptivos sin significado de autoría. |
| 14: extracción/referencias | Advertencias de cobertura, páginas vacías en PDF, comparación orientativa de título/autor/año de DOI. No verifica afirmaciones. |
| 15: rendimiento/trazabilidad | Worker cancelable, límite de tiempo/tamaño, render incremental, reglas versionadas e informe común. |

## Verificación

Pruebas Python y JavaScript cubren contratos del motor, bibliografía, preservación de texto, propuestas, Unicode, exportación, metadatos, cancelación y recuperación. Pruebas de ventanas neuronales usan un modelo simulado, no demuestran funcionamiento o validez de un modelo real. Interfaz web y Streamlit verificadas con análisis, aceptación y deshacer. Una prueba local de 468.000 caracteres / 6.000 frases repetidas completó el motor en unos 340 ms; no es una garantía de rendimiento universal.

## Trabajo científico aún necesario

El arnés de evaluación y el protocolo están incluidos, pero falta recopilar y anotar el corpus independiente. No se ha reducido cuantitativamente un margen de error medido porque aún no existe esa medición. No se ha añadido un clasificador semántico de autoría ni se ha probado compatibilidad con detectores comerciales. Estas capacidades no aparecen como disponibles en la interfaz. Las reglas nuevas detectan problemas editoriales, no todos los textos generados por IA.

Los resultados históricos en `docs/engine-audit/results.*` se conservan sin modificar; corresponden al motor anterior. El programa `tools/audit_engine.py` es histórico y se impide su ejecución accidental contra v2. `editorial-v2-regressions.json` corresponde únicamente a los cuatro casos de regresión incluidos.
