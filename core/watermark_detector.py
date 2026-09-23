"""
Zero-IA: Detector de Marcas de Agua Invisibles, Caracteres de Ancho Cero (Zero-Width)
y Esteganografía Unicode en Textos Generados por IA.
"""

from typing import Dict, Any, List

# Catálogo de caracteres invisibles y de ancho cero frecuentemente inyectados
# por interfaces web de LLMs (ChatGPT, Claude), extensiones de marcado o esteganografía
INVISIBLE_CHARS_MAP = {
    "\u200B": {
        "name": "Zero Width Space (ZWSP)",
        "hex": "U+200B",
        "description": "Espacio de ancho cero. Usado en marcas de agua esteganográficas o copias web de IA."
    },
    "\u200C": {
        "name": "Zero Width Non-Joiner (ZWNJ)",
        "hex": "U+200C",
        "description": "Separador de ancho cero. Frecuente en inyección oculta de firmas de IA."
    },
    "\u200D": {
        "name": "Zero Width Joiner (ZWJ)",
        "hex": "U+200D",
        "description": "Unión de ancho cero. Rara vez presente de forma natural en español salvo inserción artificial."
    },
    "\u2060": {
        "name": "Word Joiner",
        "hex": "U+2060",
        "description": "Unión de palabras de ancho cero."
    },
    "\uFEFF": {
        "name": "Zero Width No-Break Space (BOM)",
        "hex": "U+FEFF",
        "description": "Marca de orden de bytes/espacio no divisible invisible."
    },
    "\u00AD": {
        "name": "Soft Hyphen (SHY)",
        "hex": "U+00AD",
        "description": "Guion invisible que solo se muestra al final de línea; común en copias de PDF de LLMs."
    },
    "\u200E": {
        "name": "Left-to-Right Mark (LRM)",
        "hex": "U+200E",
        "description": "Marca direccional invisible introducida por navegadores en bloques de chat de IA."
    },
    "\u200F": {
        "name": "Right-to-Left Mark (RLM)",
        "hex": "U+200F",
        "description": "Marca direccional invisible."
    }
}


def detect_invisible_watermarks(text: str) -> Dict[str, Any]:
    """
    Analiza exhaustivamente un texto en busca de marcas de agua invisibles,
    caracteres de ancho cero y patrones de esteganografía de LLMs.
    """
    if not text:
        return {
            "has_watermark": False,
            "total_invisible_chars": 0,
            "detected_types": [],
            "steganography_detected": False,
            "status": "clean",
            "message": "Documento sin caracteres invisibles."
        }

    counts: Dict[str, int] = {}
    positions: List[int] = []
    consecutive_run = 0
    max_consecutive = 0

    for i, ch in enumerate(text):
        if ch in INVISIBLE_CHARS_MAP:
            counts[ch] = counts.get(ch, 0) + 1
            positions.append(i)
            consecutive_run += 1
            if consecutive_run > max_consecutive:
                max_consecutive = consecutive_run
        else:
            consecutive_run = 0

    total_chars = sum(counts.values())
    steganography = max_consecutive >= 3 or total_chars >= 5

    detected_types = []
    for ch, count in counts.items():
        info = INVISIBLE_CHARS_MAP[ch]
        detected_types.append({
            "name": info["name"],
            "hex": info["hex"],
            "count": count,
            "description": info["description"]
        })

    has_watermark = total_chars > 0

    if steganography:
        status = "critical"
        message = (
            f"Alerta crítica: Se detectaron {total_chars} caracteres invisibles de ancho cero "
            f"con patrones de esteganografía/marca de agua digital. Esto indica copia directa "
            f"desde una interfaz de IA o inyección deliberada de firma invisible."
        )
    elif total_chars > 0:
        status = "warning"
        message = (
            f"Aviso: Se detectaron {total_chars} caracteres invisibles de ancho cero. "
            f"Podrían proceder del copiado de herramientas web de IA o generadores automáticos."
        )
    else:
        status = "clean"
        message = "No se detectaron marcas de agua invisibles ni caracteres de ancho cero. Texto limpio a nivel de codificación."

    return {
        "has_watermark": has_watermark,
        "total_invisible_chars": total_chars,
        "max_consecutive_chain": max_consecutive,
        "steganography_detected": steganography,
        "status": status,
        "message": message,
        "detected_types": detected_types
    }


def strip_invisible_characters(text: str) -> str:
    """
    Limpia y purga cualquier carácter invisible o de ancho cero del texto.
    """
    clean_text = text
    for ch in INVISIBLE_CHARS_MAP.keys():
        clean_text = clean_text.replace(ch, "")
    return clean_text
