# Zero-IA · Validador Académico y Asistente de Estilo

[![Demo Online](https://img.shields.io/badge/Demo%20Online-GitHub%20Pages-2563eb.svg)](https://bycarlox.github.io/Zero-IA/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()

Plataforma de auditoría textual diseñada para revisar manuscritos académicos, tesis y Trabajos de Fin de Máster (TFM). Permite evaluar el estilo de redacción, detectar huellas sintéticas de modelos de lenguaje (LLM), calcular índices de legibilidad en español y comprobar la coherencia entre citas y bibliografía en documentos **Word (`.docx`)** y **PDF (`.pdf`)**.

> 🌐 **Acceso Web Inmediato (100% Gratuito y Privado):**  
> 👉 **[https://bycarlox.github.io/Zero-IA/](https://bycarlox.github.io/Zero-IA/)**  
> *(El análisis se ejecuta íntegramente en tu navegador. Ningún documento se transmite a servidores externos).*

---

## ⚡ Características Principales

- **Auditoría de Huellas de IA:** Cálculo de perplejidad estadística, ráfaga (*burstiness*), uniformidad sintáctica y detección de clichés discursivos habituales de LLMs (ChatGPT, Claude).
- **Legibilidad Flesch-Szigriszt (Escala INFLESZ):** Evaluación objetiva de la claridad del texto antes de la bibliografía, adaptada a la métrica silábica del español.
- **Chequeo de Citas y Referencias:** Reconocimiento de sistemas Autor-Año (APA/Harvard) y numéricos (IEEE/Vancouver), identificando citas huérfanas o entradas bibliográficas no citadas.
- **Ingesta Nativa de Documentos:** Carga directa de archivos `.docx` y `.pdf` preservando la estructura de párrafos sin necesidad de copiar y pegar a mano.
- **Asistente de Humanización:** Diagnóstico explicativo oración por oración con sugerencias de reescritura natural y editor en vivo para reevaluar cambios en tiempo real.
- **Exportación de Resultados:** Descarga del manuscrito anotado en Word (`.docx`), informe técnico en Markdown (`.md`) o guardado directo en PDF mediante vista de impresión.

---

## 🚀 Modos de Uso

### 1. En la Web (GitHub Pages)
No requiere instalación. Solo accede a **[https://bycarlox.github.io/Zero-IA/](https://bycarlox.github.io/Zero-IA/)**, arrastra tu documento `.docx` o `.pdf` y pulsa **Analizar**.

### 2. En Local con Python / Streamlit
Si prefieres ejecutar el entorno localmente en tu equipo:

```bash
# Clonar el repositorio
git clone https://github.com/ByCarlox/Zero-IA.git
cd Zero-IA

# Opción A: Script automático (crea venv e instala dependencias)
./run.sh

# Opción B: Arranque manual
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

---

## 📐 Estructura del Proyecto

```
Zero-IA/
├── index.html                  # Aplicación web nativa (GitHub Pages)
├── css/styles.css              # Interfaz minimalista estilo Gemini / ChatGPT
├── js/
│   ├── app.js                  # Controlador de interacción y editor en vivo
│   ├── detector.js             # Motor de perplejidad y heurísticas en JavaScript
│   ├── academic-review.js      # Legibilidad Flesch-Szigriszt y chequeo de citas
│   └── document-parser.js      # Extracción client-side de Word (Mammoth) y PDF (PDF.js)
├── core/
│   ├── detector.py             # Orquestador del análisis en Python
│   ├── document_parser.py      # Extractor de documentos Word y PDF
│   ├── perplexity_engine.py    # Motor dual de perplejidad (Transformers + Estadístico)
│   ├── stylometrics.py         # Análisis de longitud y entropía
│   ├── llm_heuristics.py       # Detección de conectores y plantillas sintéticas
│   └── academic_review.py      # Módulo Python de legibilidad INFLESZ y citas
├── humanizer/
│   └── suggestion_engine.py    # Sugerencias de reescritura académica
├── export/
│   └── report_generator.py     # Generador de Word (.docx) anotado y reportes
├── tests/                      # Suite de pruebas unitarias y de paridad
├── app.py                      # Servidor local con Streamlit
└── requirements.txt            # Dependencias del entorno Python
```

---

## 🧪 Pruebas Automatizadas

Para validar los motores de análisis y la paridad entre módulos:

```bash
# Pruebas en Python
python3 -m unittest discover tests/ -v

# Pruebas de paridad navegador (Node.js)
node tests/test_browser.js
```

---

## ⚖️ Nota de Uso Académico

Zero-IA es una herramienta analítica y de asistencia en redacción. Sus resultados tienen **carácter técnico y orientativo**, basándose en modelos estadísticos y patrones sintácticos. No constituye una prueba determinista de autoría ni sustituye el criterio cualitativo de docentes o comités de evaluación académica.
