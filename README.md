# Zero-IA: Sistema Inteligente de Auditoría, Detección y Mitigación de Huellas de Modelos de Lenguaje en Documentos Académicos

[![Python](https://img.shields.io/badge/Python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12%20%7C%203.14-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework](https://img.shields.io/badge/Interface-Streamlit-red.svg)](https://streamlit.io/)
[![NLP](https://img.shields.io/badge/NLP-Transformers%20%26%20Stylometrics-green.svg)](https://huggingface.co/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20(9%2F9)-brightgreen.svg)]()

---

## 📌 Resumen Ejecutivo (Abstract)

**Zero-IA** es una plataforma integral de auditoría forense textual diseñada para el análisis de autoría y detección de huellas generadas por Modelos Masivos de Lenguaje (LLMs, por sus siglas en inglés, tales como ChatGPT, Claude o Gemini) en documentos académicos de posgrado, tesis doctorales y publicaciones científicas.

El sistema procesa directamente documentos en formatos **Microsoft Word (`.docx`)** y **Adobe PDF (`.pdf`)**, analizando de forma granular cada oración mediante una arquitectura híbrida que combina:
1. **Perplejidad y Entropía Cruzada Condicional** basada en modelos de lenguaje autorregresivos.
2. **Análisis de Ráfaga (*Burstiness*) y Monotonía Sintáctica**.
3. **Estilometría Cuantitativa** (Varianza de longitud, *Type-Token Ratio* y Entropía de Shannon).
4. **Heurística de Marcadores Discursivos y Clichés Sintéticos**.

Además de señalar visualmente las secciones y oraciones con alta probabilidad de generación artificial, el sistema incorpora un **módulo asistente de mitigación y humanización** que formula sugerencias de reestructuración sintáctica y léxica para devolver al manuscrito la cadencia y riqueza características de la redacción humana experta.

---

## 🔬 Fundamentos Metodológicos

### 1. Perplejidad ($PPL$)
La perplejidad cuantifica la sorpresa o incertidumbre que experimenta un modelo de lenguaje probabilístico ante una secuencia de palabras $W = (w_1, w_2, \dots, w_N)$. En los modelos generativos por decodificación probabilística (greedy, nucleus sampling o top-k), las palabras seleccionadas corresponden invariablemente a distribuciones de alta probabilidad condicionada, lo que produce valores de perplejidad inusualmente bajos y estables:

$$PPL(W) = \exp \left( -\frac{1}{N} \sum_{i=1}^{N} \ln P(w_i \mid w_{<i}) \right)$$

- **$PPL < 40$**: Alta predictibilidad; fuerte indicio de generación sintética por LLM.
- **$PPL > 70$**: Elevada riqueza y sorpresa estadística; característico de redacción humana académica.

### 2. Ráfaga (*Burstiness*) y Coeficiente de Variación Sintáctica
Los seres humanos redactamos alternando naturalmente cláusulas breves e incisivas con construcciones subordinadas extensas y densas. En contraste, los modelos de lenguaje tienden a mantener una longitud de oración y una perplejidad homogéneas a lo largo de todo el texto. La ráfaga evalúa la desviación estándar y el coeficiente de variación ($CV$) de las longitudes y perplejidades a nivel inter-oracional:

$$CV = \frac{\sigma}{\mu} = \frac{\sqrt{\frac{1}{M}\sum_{j=1}^M (L_j - \bar{L})^2}}{\bar{L}}$$

Donde $L_j$ representa la longitud de la $j$-ésima oración en tokens y $\bar{L}$ la longitud media del documento. Un valor de $CV < 0.25$ indica cadencia monótona y sintomática de generación artificial.

### 3. Riqueza Léxica (*Type-Token Ratio* y Entropía de Shannon)
La distribución de vocabulario se analiza mediante el ratio entre lemas únicos ($V$) y el total de palabras ($N$), junto con la entropía de información de primer orden sobre la distribución de frecuencia de términos:

$$H(X) = -\sum_{k=1}^{|V|} p(w_k) \log_2 p(w_k)$$

### 4. Detección Forense de Marcadores Discursivos
Identificación sistemática de sesgos de alineamiento y plantillas sintácticas recurrentes en LLMs:
- **Aperturas formularia:** *"En el ámbito de"*, *"En el panorama actual"*, *"Es importante destacar que"*, *"A lo largo de la historia"*.
- **Conectores sobreutilizados y conclusiones redundantes:** *"En conclusión,"*, *"En resumen,"*, *"Por consiguiente,"*, *"desempeña un papel crucial"*.
- **Construcciones tripartitas forzadas:** Simetría adjetival no justificada (ej. *"eficiente, escalable y robusto"*).

---

## 🏛️ Arquitectura del Sistema

```
Zero-IA/
├── app.py                      # Interfaz web principal de auditoría (Streamlit)
├── run.sh                      # Script de inicialización y despliegue automatizado
├── requirements.txt            # Dependencias del entorno de ejecución
├── .streamlit/
│   └── config.toml             # Configuración optimizada de servidor para archivos pesados
├── core/
│   ├── document_parser.py      # Extractor estructurado para archivos Word (.docx) y PDF (.pdf)
│   ├── sentence_tokenizer.py   # Segmentador robusto con reconocimiento de abreviaturas académicas
│   ├── perplexity_engine.py    # Motor dual de perplejidad (Transformers + Motor Estadístico N-Gram)
│   ├── stylometrics.py         # Análisis de uniformidad, varianza sintáctica y entropía léxica
│   ├── llm_heuristics.py       # Detector de patrones de alineamiento y clichés de LLMs
│   └── detector.py             # Orquestador del análisis y clasificación probabilística global
├── humanizer/
│   └── suggestion_engine.py    # Motor de diagnóstico y alternativas de reescritura humana
├── export/
│   └── report_generator.py     # Generador de Word (.docx) anotado y dictamen en Markdown (.md)
└── tests/
    ├── test_tokenizer_and_parser.py    # Pruebas de extracción y tokenización
    ├── test_detector_and_humanizer.py  # Pruebas del motor heurístico y sugerencias
    └── test_end_to_end.py              # Validación del flujo completo de auditoría
```

---

## 💻 Instalación y Despliegue

### Requisitos del Sistema
- **Sistema Operativo:** macOS, Linux o Windows.
- **Entorno:** Python 3.9 o superior.
- **Git** instalado.

### Despliegue Automatizado (Recomendado)
Ejecute el script de arranque en la raíz del proyecto:

```bash
./run.sh
```

El script se encargará automáticamente de:
1. Crear el entorno virtual aislado (`venv`).
2. Resolver e instalar las dependencias requeridas.
3. Iniciar la aplicación web localmente en `http://localhost:8501`.

### Despliegue Manual
Si prefiere configurar el entorno paso a paso:

```bash
# 1. Crear y activar el entorno virtual
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Lanzar el servidor de auditoría
streamlit run app.py
```

---

## 📊 Salidas y Entregables del Sistema

1. **Visor Editorial Interactivo**: El manuscrito se presenta en un visor tipográfico con código de colores según nivel de riesgo:
   - 🔴 **Rojo:** Huella crítica de IA (baja perplejidad, estructura monótona o muletillas de LLM).
   - 🟡 **Amarillo:** Zona sospechosa / posible asistencia de IA.
   - 🟢 **Sin resaltar:** Redacción fluida, orgánica y consistente con autoría humana.
2. **Métricas Ejecutivas**:
   - Probabilidad Global de IA (0% a 100%).
   - Puntuación de Perplejidad Media.
   - Índice de Ráfaga (*Burstiness*).
   - Conteo y proporción de oraciones en riesgo.
3. **Editor de Mitigación en Vivo**: Pestaña para reescribir frases observadas y recalcular el porcentaje de IA en tiempo real.
4. **Exportación Formal**:
   - Archivo **Microsoft Word (`.docx`)** con el texto resaltado y apéndice de recomendaciones.
   - Dictamen técnico en formato **Markdown (`.md`)**.

---

## 🧪 Validación y Pruebas Automatizadas

El proyecto incluye un conjunto exhaustivo de pruebas unitarias y de integración end-to-end:

```bash
python3 -m unittest discover tests/
```

| Prueba | Componente Evaluado | Estado |
| :--- | :--- | :---: |
| `test_sentence_splitting_with_abbreviations` | Segmentación académica (*pág.*, *Dr.*, citas) | ✅ PASSED |
| `test_split_into_paragraphs` | Extracción de estructura de párrafos | ✅ PASSED |
| `test_extract_from_docx` | Ingesta de archivos Word y tablas | ✅ PASSED |
| `test_extract_from_txt` | Extracción de texto plano | ✅ PASSED |
| `test_detect_ai_cliches` | Detección de marcadores discursivos de LLM | ✅ PASSED |
| `test_suggestion_generation` | Generación de sugerencias de humanización | ✅ PASSED |
| `test_detector_chatgpt_sample` | Calificación de muestra sintética de IA | ✅ PASSED |
| `test_detector_human_sample` | Calificación de muestra de autoría humana | ✅ PASSED |
| `test_end_to_end` | Pipeline completo (Word ➔ Auditoría ➔ Exportación) | ✅ PASSED |

---

## 📄 Licencia

Este software se distribuye bajo los términos de la **Licencia MIT**. Consulte el archivo `LICENSE` para mayores detalles.
