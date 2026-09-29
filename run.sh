#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ "${1:-}" = "--streamlit" ]; then
  export PATH="$PATH:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin"
  if [ -f venv/bin/activate ]; then source venv/bin/activate; fi
  command -v node >/dev/null || { echo "La interfaz Python requiere Node.js 22+."; exit 1; }
  exec python -m streamlit run app.py
fi
printf 'Zero-IA 3 · Abre http://127.0.0.1:8765\nPulsa Ctrl+C para cerrar el servidor.\n'
exec python3 -m http.server 8765 --bind 127.0.0.1
