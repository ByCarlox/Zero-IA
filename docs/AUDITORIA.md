# Auditoría del proyecto Zero-IA

Fecha: 23 de septiembre de 2026.

## Evaluación

La herramienta sirve como apoyo a una revisión editorial y bibliográfica. No dispone de evidencia experimental que permita emplearla como detector de autoría ni como criterio automático de evaluación de estudiantes. La mayor incongruencia era presentar una suma de heurísticas como probabilidad de IA y un cálculo de longitud/diversidad/entropía como perplejidad neuronal.

## Hallazgos y acciones

| Prioridad | Hallazgo y efecto | Estado |
|---|---|---|
| Alta | El porcentaje global no está calibrado; las muestras de prueba escritas para activar clichés no miden precisión, sensibilidad ni falsos positivos. | Etiquetas y documentación corregidas: índice heurístico, no probabilidad. Validación empírica pendiente. |
| Alta | JavaScript reutilizaba expresiones regulares globales con `test`, conservando `lastIndex`; repetir el mismo análisis alteraba las detecciones. | Corregido y probado con cinco repeticiones. |
| Alta | Fragmentos y reescrituras del documento entraban en `innerHTML`; el botón de copia incluía texto en código de un evento. Streamlit también interpolaba texto sin escape. | Escape de texto y atributos; copia con evento registrado sin código construido desde el documento. |
| Alta | La interfaz presentaba origen humano o artificial como conclusión; README afirmaba calibración y capacidades no demostradas. | Clasificaciones descriptivas; documentación reescrita con alcance real. |
| Media | Streamlit usaba umbrales 60/30 y el motor 65/35, produciendo mensajes contradictorios. | Unificados en 65/35. Siguen siendo cortes heurísticos, no validados. |
| Media | La interfaz anunciaba motor neuronal activo aunque podía fallar su carga; GPT-2 se cargaba al abrirla. | Motor heurístico explícito por defecto, sin descarga neuronal al arrancar. |
| Media | La segmentación JavaScript cambiaba `Dr.` a `dr.` y su extracción de palabras dañaba vocales acentuadas/ü. | Conservación de abreviaturas y palabras españolas, con regresiones. |
| Media | Word extraía primero párrafos y luego tablas, cambiando el orden del documento. | Se conserva el orden entre párrafos y tablas del cuerpo principal. |
| Media | Texto vacío o sin palabras podía provocar errores en resultados; PDF escaneado carecía de explicación clara. | Validaciones y mensajes de OCR previo. No se añadió OCR. |
| Media | PDF del navegador aplanaba saltos de línea que necesita el análisis bibliográfico. | Conservación de `hasEOL`; maquetaciones complejas siguen requiriendo revisión. |
| Media | `st.segmented_control` se usaba con mínimo declarado de Streamlit 1.30. | Mínimo elevado a 1.40. |
| Media | No existía revisión bibliográfica ni legibilidad española. | Incorporadas en ambos motores e informes. |
| Baja | Licencia MIT anunciada sin archivo de licencia. | Retirada la afirmación visible; decisión del titular pendiente. |

## Mejoras incorporadas

Flesch-Szigriszt con escala INFLESZ, fórmula y conteos visibles, aviso por muestra breve y exclusión de bibliografía reconocida. Es una estimación de facilidad de lectura, no un índice de capacidad intelectual, contenido académico o autoría.

Auditoría interna parcial de citas APA/Harvard y numéricas entre corchetes. Detecta ausencia de correspondencia, ambigüedad autor-año, entradas sin cita reconocida, años futuros y sintaxis DOI dudosa. Cada observación conserva evidencia textual. No acusa fuentes inventadas ni emplea estos hallazgos para elevar el índice de estilo.

## Pendientes recomendados, en orden

1. **Verificación de fuentes opcional.** Resolver DOI y comparar autor, título, año y revista con metadatos de Crossref/DataCite o el editor. Diferenciar no encontrado, error de red, coincidencia parcial y referencia comprobada. Enviar únicamente la referencia necesaria, con información visible sobre el servicio externo. La existencia de una fuente no demuestra que respalde una afirmación: se requiere leer el original.
2. **Evaluación con trabajos reales y consentimiento.** Reunir un corpus representativo de español, disciplinas, extensión y edición humana/IA. Separar entrenamiento y evaluación por documento/autor, contar falsos positivos y publicar incertidumbre. Hasta entonces, no calificar ni sancionar usando el índice.
3. **Unificar los motores de estilo.** Python y JavaScript mantienen reglas y ponderaciones heredadas diferentes; los nuevos módulos académicos sí comparten pruebas de paridad. Añadir un contrato versionado y muestras comunes antes de comparar índices entre versiones.
4. **Aislar bibliografía y otras secciones en el análisis de estilo.** El índice heredado todavía analiza bibliografía y encabezados; solo la nueva legibilidad excluye la bibliografía reconocida. Esto puede distorsionar ritmo y longitudes.
5. **Sustituir recomendaciones automáticas demasiado categóricas.** Algunas reglas heredadas todavía asocian expresiones comunes con LLM. Las sustituciones pueden cambiar significado, registro o puntuación. Revisar cada alternativa y no optimizar un trabajo para bajar una cifra.
6. **Mejorar extracción y trazabilidad.** OCR opcional, columnas, notas al pie, encabezados, ecuaciones y apellidos compuestos. Conservar localización por página/párrafo y mostrar cobertura de extracción. El Word exportado reconstruye texto; no preserva el diseño original.
7. **Endurecer distribución y rendimiento.** Actualizar y fijar bibliotecas, revisar vulnerabilidades, empaquetar recursos para uso offline, limitar tamaños y usar un worker para documentos grandes. El despliegue actual publica la raíz del repositorio; conviene publicar solo los recursos web y exigir pruebas antes del despliegue. La nueva ejecución de pruebas es un flujo independiente, no bloquea Pages.
8. **Motor neuronal experimental.** Puede mezclar resultados neuronales y heurísticos si falla una oración; no fue validado ni habilitado en esta revisión. Debe declarar fallos por oración o invalidar el análisis completo antes de ofrecerse en producción.

## Comprobaciones realizadas

Las nueve pruebas originales pasaban antes de los cambios. Al finalizar, pasaron las 16 pruebas Python y las regresiones JavaScript; se comprobó el arranque y análisis de muestra de Streamlit con AppTest, y el flujo de citas y recomendaciones en el navegador. Se añadieron pruebas de regresión y paridad académica, además de pruebas JavaScript. Los tests de exportación reabren el Word y comprueban su contenido; no equivalen a verificar visualmente el diseño del DOCX. No se probaron descargas neuronales, OCR, todos los estilos bibliográficos ni todos los PDF existentes.

## Fuentes metodológicas

- [Validación de INFLESZ](https://scielo.isciii.es/scielo.php?pid=S1137-66272008000300004&script=sci_arttext).
- [Fórmula y aplicación de legibilidad en español](https://pmc.ncbi.nlm.nih.gov/articles/PMC8507699/).

La literatura citada se refiere a legibilidad; no valida este proyecto como detector de IA ni como rúbrica de nivel de posgrado.
