"""One canonical engine for Python and the browser (Node.js 22+ required).
Text travels only to a local subprocess via stdin. No server, network or model download.
"""
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def call_engine(action, text='', **kwargs):
    node = shutil.which('node')
    if not node:
        for candidate in ['/opt/homebrew/bin/node', '/usr/local/bin/node', '/usr/bin/node']:
            if Path(candidate).is_file():
                node = candidate
                break
    if not node:
        raise RuntimeError('La aplicación local requiere Node.js 22 o posterior para usar el mismo motor que la web.')
    try:
        result = subprocess.run([node, str(ROOT / 'js/engine-cli.cjs')],
                                input=json.dumps({'action': action, 'text': text, **kwargs}, ensure_ascii=False),
                                text=True, capture_output=True, timeout=30, check=False)
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError('Se agotó el tiempo de análisis. Divide el documento por secciones.') from exc
    if result.returncode:
        raise RuntimeError('El motor local no pudo completar la operación: ' + result.stderr[:300])
    return json.loads(result.stdout)
