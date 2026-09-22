# 🛡️ Validador & Auditor de Huellas de IA para TFM y Tesis

> **Plataforma Open Source y Gratuita** para auditar documentos académicos (**Word `.docx`**, **PDF `.pdf`** o texto directo), detectar y señalar huellas de Inteligencia Artificial (ChatGPT, Claude, etc.), y guiar la reescritura/humanización del texto para eliminar sospechas.

---

## 🎯 Objetivo del Proyecto

En el contexto académico actual (Trabajos de Fin de Máster, Artículos Científicos y Tesis), los detectores institucionales buscan patrones probabilísticos característicos de los modelos de lenguaje:
- **Perplejidad baja y uniforme**: oraciones altamente predecibles y sin sorpresas estadísticas.
- **Ráfaga (Burstiness) nula**: ritmo plano donde todas las frases tienen longitudes y estructuras similares.
- **Muletillas y conectores típicos de LLMs**: frases como *"En el ámbito de"*, *"Es importante destacar que"*, *"desempeña un papel crucial"*, estructuras tripartitas forzadas, etc.

Esta herramienta permite a ti y a tus compañeros:
1. **Leer directamente archivos `.docx` y `.pdf`** sin necesidad de copiar y pegar manualmente.
2. **Visualizar un mapa de calor** donde cada oración se marca según su nivel de huella (🔴 Alta huella, 🟡 Sospechosa, 🟢 Estilo natural/humano).
3. **Comprender exactamente por qué se marcó cada oración** (diagnóstico transparente).
4. **Obtener sugerencias de reescritura** para romper la predictibilidad y subir la perplejidad.
5. **Exportar el documento Word anotado** o un informe de auditoría completo.

---

## 🚀 Inicio Rápido (En 1 Comando)

### Requisitos previos
- Tener instalado **Python 3.9 o superior** y `git`.

### Ejecución
Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
./run.sh
```

El script configurará automáticamente el entorno virtual (`venv`), instalará las librerías necesarias y abrirá la aplicación en tu navegador web en `http://localhost:8501`.

---

## 🛠️ Instalación Manual

Si prefieres realizar los pasos de forma manual:

1. **Crear y activar un entorno virtual:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # En Linux/macOS
   # o en Windows: venv\Scripts\activate
   ```

2. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Iniciar la aplicación:**
   ```bash
   streamlit run app.py
   ```

---

## 🔒 Cómo subirlo a un Repositorio Privado en GitHub

Para compartir este proyecto de forma privada entre los miembros de tu equipo:

1. **Crear un repositorio vacío en GitHub:**
   - Ve a [github.com/new](https://github.com/new).
   - Nómbralo (por ejemplo `tfm-validador-ia`).
   - Selecciónalo como **Private** (Privado).
   - No marques inicializar con README ni .gitignore (ya los tenemos listos).

2. **Vincular tu repositorio local y subir el código:**
   ```bash
   git init
   git add .
   git commit -m "feat: Validador de huellas de IA para Word y PDF (Open Source)"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

3. **Invitar a tus compañeros:**
   - En tu repositorio de GitHub, ve a **Settings** > **Collaborators** > **Add people** e introduce los usuarios o correos de tus compañeros.

---

## 📐 Arquitectura del Sistema

```
├── app.py                      # Interfaz web interactiva (Streamlit)
├── run.sh                      # Script de inicio automático
├── requirements.txt            # Dependencias 100% open source
├── .gitignore                  # Protección de archivos privados y temporales
├── core/
│   ├── document_parser.py      # Extractor de texto desde Word (.docx) y PDF (.pdf)
│   ├── sentence_tokenizer.py   # Segmentador de oraciones con soporte para abreviaturas académicas
│   ├── perplexity_engine.py    # Motor dual de Perplejidad (Transformers + Estadístico N-Gram)
│   ├── stylometrics.py         # Análisis de monotonía sintáctica, longitud y entropía
│   ├── llm_heuristics.py       # Detección de patrones discursivos y clichés de ChatGPT/Claude
│   └── detector.py             # Orquestador y calificador de probabilidad de IA
├── humanizer/
│   └── suggestion_engine.py    # Generador de sugerencias y reescritura para eliminar huellas
├── export/
│   └── report_generator.py     # Generación de Word anotado (.docx) y reporte Markdown
└── tests/                      # Batería de pruebas unitarias automatizadas
```

---

## 🧪 Ejecutar Pruebas Automatizadas

Para validar que todos los módulos y algoritmos funcionan correctamente:

```bash
python3 -m unittest discover tests/
```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Uso completamente libre y sin costos de API para tu equipo académico.
