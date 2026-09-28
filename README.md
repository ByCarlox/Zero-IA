# Zero-IA · Validador Académico y Asistente Editorial

> **Plataforma web de auditoría editorial, legibilidad y coherencia académica para tesis, manuscritos y artículos científicos.**

Zero-IA es una herramienta analítica diseñada para elevar el rigor y la calidad de la prosa académica. A diferencia de los detectores opacos tradicionales, Zero-IA no emite acusaciones basadas en porcentajes probabilísticos arbitrarios de autoría: proporciona una **auditoría transparente, determinista y fundamentada** con indicadores reproducibles para autores, investigadores y comités académicos.

---

## 🏛️ Fundamentos y Filosofía

### 1. La falacia de los "detectores de porcentaje de IA"
Las herramientas que afirman clasificar un texto con etiquetas binarias o porcentajes absolutos ("80% generado por IA") presentan problemas metodológicos insalvables:
- **Tasas inaceptables de falsos positivos:** Afectan desproporcionadamente a autores no nativos de una lengua, escritores técnicos o textos con alta densidad conceptual.
- **Opacidad algorítmica:** No ofrecen explicaciones accionables sobre por qué una frase específica fue marcada.
- **Inseguridad jurídica y académica:** Ninguna institución rigurosa acepta hoy en día un porcentaje probabilístico como prueba fehaciente de mala conducta o autoría.

### 2. El enfoque de Zero-IA: Evidencia objetiva y reproducible
Zero-IA transforma la revisión en un **proceso pedagógico y editorial**:
- **Diagnóstico basado en reglas y lingüística computacional:** Cada observación está vinculada a una evidencia textual concreta (repetición léxica, desbalance de cadencia, oraciones excesivamente complejas, apertura repetitiva de párrafos).
- **Tratamiento contextual de la prosa académica:** Se aísla el cuerpo del texto para no penalizar citas bibliográficas, títulos, tablas o listas formales.
- **Auditoría de integridad bibliográfica:** Validación estructural de referencias y correspondencia interna entre menciones en texto y fuentes bibliográficas (APA, Harvard, IEEE) con consulta voluntaria a Crossref para DOIs.

---

## 📊 Arquitectura de Métricas e Indicadores

### 1. Índice de Pulcritud Editorial (Puntuación 0–100)
*El indicador central de calidad y pulcritud de la prosa académica.*

| Rango | Calificación | Interpretación |
| :--- | :--- | :--- |
| **90 – 100 pts** | **Excelente pulcritud** | Prosa fluida, léxico variado, estructuras bien equilibradas y mínima redundancia. |
| **75 – 89 pts** | **Buena calidad (con observaciones)** | El texto es sólido, pero presenta focos específicos de mejora (ej. oraciones sobrecargadas o repeticiones léxicas localizadas). |
| **< 75 pts** | **Revisión recomendada** | Presencia recurrente de patrones mecánicos, monotonía sintáctica o problemas de legibilidad que dificultan la lectura fluida. |

> **Nota para autores:** Este índice funciona como una calificación de examen de estilo (donde 100 pts es el estado óptimo libre de incidencias); no representa en ningún caso una probabilidad o porcentaje de autoría por IA.

---

### 2. Legibilidad Objetiva (Flesch-Szigriszt & Escala INFLESZ)
Mide el esfuerzo cognitivo que demanda el manuscrito, adaptado a la morfología y fonética del idioma español:
- Evalúa la relación entre sílabas por palabra y palabras por oración.
- Permite detectar secciones con densidad innecesaria o sintaxis sobrecargada sin sacrificar la precisión terminológica de la disciplina.

### 3. Coherencia Sintáctica y Monotonía de Estilo
- **Longitud y variabilidad de oraciones:** La escritura académica natural alterna oraciones cortas con oraciones complejas. La uniformidad artificial (muchas frases seguidas con idéntica longitud) suele ser síntoma de traducción automática, redacción apresurada o generación mecánica.
- **Aperturas idénticas y solapamiento léxico:** Detección de oraciones o párrafos consecutivos que inician con las mismas estructuras o comparten excesivo vocabulario sin aportar nueva información conceptual.

### 4. Cobertura del Texto
Diferenciación automática entre la prosa argumentativa y los elementos paratextuales:
- **Prosa evaluable:** Se analiza con las reglas de estilo y sintaxis.
- **Elementos excluidos del cálculo de estilo:** Bibliografía, encabezados de tablas, leyendas de figuras y citas en bloque se conservan pero no penalizan la calificación de prosa.

### 5. Escudo de Caracteres Invisibles y Sanitización
Inspección profunda de texto en busca de:
- Caracteres de ancho cero (Zero-Width Space `U+200B`, Joiners `U+200D`, etc.).
- Espacios no separables anómalos y caracteres de control que pueden corromper la maquetación o indicar copiado no sanitizado.

---

## 🔍 Guía de Interpretación: ¿Cómo trabajar con el informe?

1. **Atender primero las Frases Prioritarias:**
   El motor destaca las oraciones con incidencias de mayor impacto (repeticiones notorias o estructuras confusas). Ajustar estas pocas oraciones suele elevar el índice significativamente.
2. **Revisar la correspondencia de citas:**
   Comprobar que cada autor citado en el texto tenga su referencia completa en la bibliografía final y viceversa.
3. **Equilibrar el ritmo de la prosa:**
   Si el promedio de palabras por frase supera las 30–35 palabras, evalúa dividir párrafos o introducir pausas mediante oraciones directas.
4. **Respetar la voz del autor:**
   Las sugerencias son guías de optimización editorial. El criterio del autor e investigador siempre prevalece sobre cualquier recomendación automática.

---

## 🔒 Privacidad y Procesamiento en Cliente

- **Sin almacenamiento de manuscritos:** El análisis se ejecuta directamente en el navegador del usuario utilizando JavaScript moderno. El contenido de tu investigación no se envía a servidores de almacenamiento, bases de datos externas ni plataformas de entrenamiento de modelos.
- **Confidencialidad absoluta:** Adecuado para tesis en curso, artículos bajo revisión por pares (*peer-review*) y documentos protegidos por acuerdos de confidencialidad institucional.

---

## 🎓 Uso Ético para Docentes y Comités Académicos

Zero-IA está concebido como una **herramienta formativa y de apoyo a la corrección de estilo**:
- **No es una herramienta punitiva:** El software no dictamina "culpabilidad" ni reemplaza el criterio del docente.
- **Base para tutorías:** Permite a los evaluadores señalar puntos objetivos de mejora en la redacción de los estudiantes de posgrado y pregrado, fomentando un aprendizaje constructivo de la escritura académica.

---

*Desarrollado para una comunidad académica que valora la transparencia, la precisión y la honestidad intelectual.*
