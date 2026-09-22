"""
Segmentador de oraciones y párrafos inteligente con soporte para textos académicos
en español e inglés, reconociendo abreviaturas comunes para evitar fragmentaciones erróneas.
"""

import re
from typing import List, Tuple

# Abreviaturas académicas comunes en español e inglés que no deben dividir una oración
ABBREVIATIONS = [
    r"pág", r"págs", r"vol", r"núm", r"no", r"dr", r"dra", r"lic", r"ing", r"prof",
    r"sr", r"sra", r"srta", r"ej", r"etc", r"aprox", r"cap", r"art", r"vs",
    r"al", r"fig", r"ibid", r"op", r"cit", r"cf", r"e\.g", r"i\.e", r"ed", r"eds"
]

ABBR_PATTERN = re.compile(
    r"\b(" + "|".join(ABBREVIATIONS) + r")\.",
    re.IGNORECASE
)

# Patrón para proteger temporalmente los puntos de abreviaturas
PLACEHOLDER_DOT = "___DOT___"


def protect_abbreviations(text: str) -> str:
    """Reemplaza puntos de abreviaturas reconocidas por un marcador temporal."""
    def repl(match):
        return match.group(0)[:-1] + PLACEHOLDER_DOT
    return ABBR_PATTERN.sub(repl, text)


def restore_abbreviations(text: str) -> str:
    """Restaura los puntos de abreviaturas."""
    return text.replace(PLACEHOLDER_DOT, ".")


def split_into_paragraphs(raw_text: str) -> List[str]:
    """Divide el texto en párrafos no vacíos preservando el formato original."""
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    if not paragraphs and raw_text.strip():
        paragraphs = [raw_text.strip()]
    return paragraphs


def split_into_sentences(text: str) -> List[str]:
    """
    Divide un texto o párrafo en oraciones completas de manera robusta.
    Maneja citas, signos de interrogación y exclamación dobles (¿?, ¡!) y abreviaturas.
    """
    if not text or not text.strip():
        return []

    # Proteger abreviaturas y números decimales (ej. 3.14)
    protected = protect_abbreviations(text)
    protected = re.sub(r"(\d)\.(\d)", r"\1___DECIMAL___\2", protected)

    # Expresión regular para separar por fin de oración (. ! ? ...)
    # Respeta comillas de cierre o paréntesis tras el punto
    sentence_delimiters = re.compile(r'(?<=[.!?…])["\'»\)\]]?\s+(?=[A-ZÁÉÍÓÚÑ¿¡"\'«\(])')
    raw_sentences = sentence_delimiters.split(protected)

    sentences = []
    for s in raw_sentences:
        clean_s = s.replace("___DECIMAL___", ".").strip()
        clean_s = restore_abbreviations(clean_s)
        if clean_s:
            sentences.append(clean_s)

    return sentences


def tokenize_document_structure(raw_text: str) -> List[Tuple[int, int, str]]:
    """
    Retorna una lista de tuplas (paragraph_idx, sentence_idx, sentence_text)
    para rastrear la ubicación exacta de cada oración dentro del documento.
    """
    paragraphs = split_into_paragraphs(raw_text)
    structured_sentences = []

    for p_idx, p in enumerate(paragraphs):
        sentences = split_into_sentences(p)
        for s_idx, s in enumerate(sentences):
            structured_sentences.append((p_idx, s_idx, s))

    return structured_sentences
