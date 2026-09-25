"""Descriptive vocabulary statistics; not used to infer authorship."""

import math
import re
import unicodedata
from typing import List, Dict, Any
import numpy as np


def clean_words(text: str) -> List[str]:
    """Extrae palabras en minúsculas ignorando puntuación."""
    return re.findall(r"[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9]+", unicodedata.normalize("NFC", text).lower())


def compute_sentence_length_stats(sentences: List[str]) -> Dict[str, float]:
    """
    Calcula estadísticas sobre la longitud de las oraciones en número de palabras.
    La variación de longitud no identifica autoría.
    """
    if not sentences:
        return {"mean": 0.0, "std": 0.0, "cv": 0.0, "min": 0, "max": 0}

    lengths = [len(clean_words(s)) for s in sentences if len(clean_words(s)) > 0]
    if not lengths:
        return {"mean": 0.0, "std": 0.0, "cv": 0.0, "min": 0, "max": 0}

    arr = np.array(lengths, dtype=float)
    mean_val = float(np.mean(arr))
    std_val = float(np.std(arr))
    # Coeficiente de variación: desviación estándar relativa
    cv_val = std_val / (mean_val + 1e-6)

    return {
        "mean": round(mean_val, 2),
        "std": round(std_val, 2),
        "cv": round(cv_val, 3),
        "min": int(np.min(arr)),
        "max": int(np.max(arr)),
        "lengths": lengths
    }


def compute_ttr(words: List[str]) -> float:
    """
    Type-Token Ratio (Riqueza léxica).
    Proporción de palabras únicas frente al total.
    """
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def compute_shannon_entropy(words: List[str]) -> float:
    """
    Calcula la entropía de información de Shannon sobre la distribución de palabras.
    Textos con menor entropía tienen mayor predictibilidad y redundancia léxica.
    """
    if not words:
        return 0.0

    counts: Dict[str, int] = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1

    total = len(words)
    entropy = 0.0
    for count in counts.values():
        p = count / total
        entropy -= p * math.log2(p)

    return round(entropy, 3)


def analyze_stylometrics(sentences: List[str], full_text: str) -> Dict[str, Any]:
    """
    Ejecuta el análisis estilométrico completo del documento.
    """
    words = clean_words(full_text)
    length_stats = compute_sentence_length_stats(sentences)
    ttr = compute_ttr(words)
    entropy = compute_shannon_entropy(words)

    return {
        "total_words": len(words),
        "total_sentences": len(sentences),
        "sentence_length": length_stats,
        "type_token_ratio": round(ttr, 3),
        "entropy": entropy
    }
