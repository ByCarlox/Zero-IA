# Zero IA 3

Revisión académica antes de entregar: resultado externo de IA, pendientes con evidencia, referencias y revisión editorial.

## Qué muestra el porcentaje de IA

El primer resultado es IA. Sin un informe externo aparece **No determinado**, nunca un cero inventado. Puedes registrar el porcentaje de Turnitin comunicado por el profesor o importar un registro JSON de Zero IA. El dato se identifica como declarado o importado sin verificar: la app no autentica informes de Turnitin.

El resultado se vincula mediante SHA-256 al texto exacto extraído. Si cambias el texto, deja de presentarse como aplicable a la nueva versión. Esta huella no verifica el archivo Word binario, la procedencia ni quién escribió el contenido. Un asterisco se conserva sin convertirlo en un porcentaje.

**Esta versión no incluye un clasificador calibrado de autoría ni predice Turnitin.** El índice editorial de 0 a 100 mide incidencias de redacción y se presenta por separado. Ninguna pantalla certifica aprobación académica.

## Uso

1. Abre la aplicación, selecciona propuesta, avance o entrega final y añade requisitos del profesor si los tienes.
2. Adjunta Word, PDF o texto, o pega el manuscrito. Comprueba las advertencias de extracción.
3. Revisa los pendientes de bibliografía, estructura y metodología junto a la evidencia textual. Las reglas metodológicas plantean preguntas concretas; no sustituyen una revisión experta.
4. Si cuentas con un resultado externo, registra proveedor, fecha, porcentaje y procedencia. Confirma que corresponde a esta versión.
5. Edita, recalcula y exporta el informe Markdown o JSON. Las sugerencias editoriales se aceptan individualmente y pueden deshacerse.

Los requisitos escritos por el usuario se presentan como lista manual. Marcar una casilla no verifica automáticamente su cumplimiento. La autenticidad y el respaldo de las fuentes requieren consultar los originales.

## Abrir localmente

Requiere Python 3 para servir archivos; la aplicación web no necesita instalar paquetes Python ni Node para utilizarse.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abre http://127.0.0.1:8765 en el navegador. También puedes ejecutar `./run.sh`. El lector de Word y PDF y las tipografías se descargan de CDN; se necesita conexión para cargarlos. Para documentos extensos, usa el servidor local o HTTPS, no el protocolo file.

Para generar la distribución pública y su ZIP:

```sh
python3 tools/build_site.py
```

La carpeta `dist/Zero-IA-3.0.0` contiene solo los archivos públicos del producto. Excluye manuscritos, informes internos, corpus de pruebas y datos del repositorio. El paquete incluye `Iniciar.command` para macOS con Python 3. Puedes alojar esa carpeta en un servicio de archivos estáticos con HTTPS.

## Privacidad

La versión web procesa el documento en el navegador. No sube el manuscrito a Turnitin ni a otros detectores. La consulta opcional a Crossref envía el DOI elegido; no verifica que el artículo respalde la afirmación. Las bibliotecas y fuentes externas implican conexiones de carga a sus proveedores.

El historial local es opcional y guarda fecha, huella y puntuaciones, no el manuscrito. Puede borrarse en la interfaz. Los informes exportados sí contienen fragmentos del documento y deben tratarse como documentos del usuario. Cerrar o recargar la página descarta la revisión en memoria.

## Pruebas y límites

```sh
python -m unittest discover tests/ -v
python tools/build_rules.py --check
node tests/test_browser.js
node tests/test_academic_v3.js
node tests/test_authorship.cjs
node tools/evaluate_authorship.cjs
```

Las pruebas Python requieren Node.js 22+, numpy, python-docx y pypdf. El corpus independiente incluye controles históricos humanos y controles expresamente generados por IA, con variantes aleatorias reproducibles. Comprueba abstención, integridad de resultados externos y regresiones; **no demuestra precisión predictiva**. La concordancia con Turnitin no se ha medido. Consulta `docs/QA_INDEPENDIENTE_2026-09-29.md`.

Para añadir un detector propio se requiere un corpus español representativo, procedencia verificable, separación por autor/documento, evaluación independiente, calibración y métricas de error publicadas. El resultado de otro detector no equivale a una etiqueta cierta de autoría.

## Interfaz Python opcional

`./run.sh --streamlit` inicia la alternativa Streamlit con las dependencias de `requirements.txt` ya instaladas. Procesa el texto en el servidor donde se ejecuta, no en el navegador. La web estática es la interfaz principal de esta entrega.
