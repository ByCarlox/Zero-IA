# Kriterion · Academic Preflight & Integrity Suite (v3.2 Pro)

Suite independiente de integridad, preflight y revisión académica editorial para tesis, artículos científicos y entregas universitarias.

**Garantía de Soberanía y Privacidad:** Análisis 100% en el entorno local de tu navegador (*Client-Side Processing*). Los manuscritos nunca se envían ni almacenan en servidores externos, ni se utilizan para entrenar inteligencias artificiales de terceros.

---

## 🌟 Características Principales

1. **Auditoría Editorial y Estilo Prosa:**
   - Índice de Pulcritud Editorial (0-100%) y porcentaje de texto sin incidencias.
   - Detección de clichés, redundancias sintácticas y longitud oracional excesiva.
   - Sugerencias editoriales aplicables de forma individual con capacidad de deshacer.

2. **Detección Forense de Marcas de Agua IA y Esteganografía Unicode:**
   - Análisis a nivel de punto de código Unicode para detectar rastros esteganográficos y caracteres de ancho cero (ZWSP, ZWNJ, BOM no estándar).
   - Botón de desinfección en un clic para limpiar caracteres encubiertos sin corromper el contenido.

3. **Correspondencia Bibliográfica y Citas Académicas:**
   - Comprobación cruzada entre autores citados en el texto y la sección formal de referencias (normas APA e IEEE).
   - Detección de citas huérfanas, discrepancias de fecha/año y consulta opcional de metadatos vía DOI a Crossref.

4. **Integridad de Evidencia y Registro Externo:**
   - Huella criptográfica SHA-256 vinculada al texto exacto analizado.
   - Opción para registrar resultados externos declarados (ej. informe de cátedra de Turnitin) vinculados de forma inalterable a la versión auditada.
   - Deslinde explícito: Kriterion no emite certificaciones dogmáticas de autoría ni garantiza calificaciones universitarias.

---

## 🚀 Uso Rápido en Local

La aplicación web estática no requiere instalar paquetes Python ni Node.js para utilizarse en el navegador:

```sh
# Servidor local estándar
python3 -m http.server 8765 --bind 127.0.0.1
```

O simplemente ejecuta:
```sh
./run.sh
```

Abre [http://127.0.0.1:8765](http://127.0.0.1:8765) en tu navegador preferido (Chrome, Safari, Firefox, Edge).

---

## 📦 Compilación para Producción (Deploy Low-Cost)

Para compilar la versión distribuible lista para producción:

```sh
python3 tools/build_site.py
```

Esto generará:
- **Carpeta de producción:** `dist/Kriterion-3.2.0/`
- **Paquete comprimido:** `dist/Kriterion-3.2.0.zip`

Puedes publicar la carpeta directamente en **Cloudflare Pages** o **GitHub Pages** con costo **$0.00 / mes**. Consulta la guía completa en [`docs/DEPLOYMENT_GUIDE_LOW_COST.md`](docs/DEPLOYMENT_GUIDE_LOW_COST.md).

---

## 🧪 Pruebas Automatizadas y Calidad

Para verificar la integridad del motor y los contratos de navegador:

```sh
# Pruebas en Python (requiere dependencias del venv)
./venv/bin/python -m unittest discover tests/ -v

# Pruebas en Node.js (contratos de navegador, preflight, motor probabilístico y autoría)
node tests/test_browser.js
node tests/test_academic_v3.js
node tests/test_authorship.cjs
node tests/test_ai_probabilistic_engine.js
node tools/evaluate_authorship.cjs
```

---

## ⚖️ Marco Legal y Transparencia

- **Deslinde:** Kriterion es un proyecto de software independiente. No está afiliado, respaldado ni patrocinado por Turnitin LLC, OpenAI ni ninguna institución educativa.
- **Licencia:** Distribuido bajo Licencia MIT.
