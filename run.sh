#!/usr/bin/env bash
# Script de inicio rápido para el Validador de Huellas de IA

echo "=========================================================="
echo "  Validador & Auditor de Huellas de IA para TFM / Tesis   "
echo "  100% Open Source y Privado                              "
echo "=========================================================="

# Comprobar si existe un entorno virtual, si no crearlo
if [ ! -d "venv" ]; then
    echo "[1/3] Creando entorno virtual Python (venv)..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "[2/3] Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "[3/3] Comprobando e instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt

# Iniciar la aplicación web
echo "=========================================================="
echo "  Iniciando aplicación web en Streamlit...                "
echo "  Se abrirá automáticamente en tu navegador.              "
echo "=========================================================="
streamlit run app.py
