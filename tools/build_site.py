"""Build a public static distribution from an explicit asset allowlist."""
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'dist' / 'Zero-IA-3.0.0'
DEST.mkdir(parents=True, exist_ok=True)
# Only public runtime assets; no manuscripts, QA corpora, internal reports or git data.
assets = [ROOT / 'index.html', ROOT / 'README.md', ROOT / 'LICENSE']
assets += list((ROOT / 'css').glob('*.css'))
assets += list((ROOT / 'js').glob('*.js'))
for source in assets:
    target = DEST / source.relative_to(ROOT)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
(DEST / 'Iniciar.command').write_text('''#!/bin/sh
cd "$(dirname "$0")"
python3 -m webbrowser http://127.0.0.1:8765 &
python3 -m http.server 8765 --bind 127.0.0.1
''')
(DEST / 'Iniciar.command').chmod(0o755)
archive = ROOT / 'dist' / 'Zero-IA-3.0.0.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
    for source in sorted(DEST.rglob('*')):
        if source.is_file():
            output.write(source, source.relative_to(DEST.parent))
print(archive)
