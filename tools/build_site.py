"""Build a public static distribution for Kriterion Academic Suite."""
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '3.2.0'
DEST = ROOT / 'dist' / f'Kriterion-{VERSION}'
DEST.mkdir(parents=True, exist_ok=True)

# Assets permitidos para distribución pública (client-side runtime)
assets = [
    ROOT / 'index.html',
    ROOT / 'favicon.svg',
    ROOT / 'README.md',
    ROOT / 'LICENSE'
]
if (ROOT / '_headers').exists():
    assets.append(ROOT / '_headers')

assets += list((ROOT / 'css').glob('*.css'))
assets += list((ROOT / 'js').glob('*.js'))

for source in assets:
    if source.exists():
        target = DEST / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

# Script de arranque local para macOS / Linux
(DEST / 'Iniciar.command').write_text('''#!/bin/sh
cd "$(dirname "$0")"
python3 -m webbrowser http://127.0.0.1:8765 &
python3 -m http.server 8765 --bind 127.0.0.1
''')
(DEST / 'Iniciar.command').chmod(0o755)

archive = ROOT / 'dist' / f'Kriterion-{VERSION}.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
    for source in sorted(DEST.rglob('*')):
        if source.is_file():
            output.write(source, source.relative_to(DEST.parent))

print(f"Build completado: {DEST}")
print(f"Paquete distribuible: {archive}")
