"""
Módulo heurístico para detectar patrones, muletillas, conectores sobreutilizados
y giros discursivos característicos de LLMs (ChatGPT, Claude, etc.) tanto en español como en inglés.
"""

import re
from typing import List, Dict, Any, Tuple

# Patrones típicos de inicio de párrafo / oración en LLMs (Español)
LLM_OPENERS_ES = [
    r"\ben el ámbito de\b",
    r"\ben el panorama actual\b",
    r"\ben la era digital\b",
    r"\ba lo largo de la historia\b",
    r"\bes importante destacar que\b",
    r"\bes fundamental señalar que\b",
    r"\bcabe destacar que\b",
    r"\bcabe mencionar que\b",
    r"\bes crucial recordar que\b",
    r"\bes menester señalar\b",
    r"\ben este orden de ideas\b",
    r"\ben resumidas cuentas\b",
    r"\ben conclusión[,:]?\b",
    r"\ben síntesis[,:]?\b",
    r"\bcomo resultado de esto[,:]?\b",
    r"\bpor consiguiente[,:]?\b",
    r"\bes imperativo que\b",
    r"\bjuega un papel fundamental\b",
    r"\bdesempeña un papel crucial\b",
    r"\bes un testimonio de\b",
    r"\bun tapiz de\b",
    r"\buna piedra angular\b",
    r"\ben última instancia[,:]?\b",
    r"\bde manera holística\b"
]

# Patrones típicos en Inglés
LLM_PATTERNS_EN = [
    r"\bin conclusion[,:]?\b",
    r"\bto sum up[,:]?\b",
    r"\bit is important to note that\b",
    r"\bit is crucial to\b",
    r"\bdelve into\b",
    r"\ba testament to\b",
    r"\brich tapestry\b",
    r"\bcornerstone of\b",
    r"\bin today's fast-paced world\b",
    r"\bin the realm of\b",
    r"\bfosters a sense of\b",
    r"\bplays a pivotal role\b",
    r"\bnavigating the complexities\b",
    r"\bseamlessly integrated\b",
    r"\bholistic approach\b"
]

# Detección de trío de adjetivos o elementos (muy común en LLM: "es X, Y y Z")
TRIPLET_PATTERN_ES = re.compile(
    r"\b([a-záéíóúñ]+),\s+([a-záéíóúñ]+)\s+y\s+([a-záéíóúñ]+)\b",
    re.IGNORECASE
)
TRIPLET_PATTERN_EN = re.compile(
    r"\b([a-z]+),\s+([a-z]+),?\s+and\s+([a-z]+)\b",
    re.IGNORECASE
)


def detect_cliches_in_sentence(sentence: str) -> List[Dict[str, str]]:
    """
    Busca patrones de frases cliché y muletillas de IA en una oración específica.
    """
    found = []
    lower_s = sentence.lower()

    # Chequear español
    for pat in LLM_OPENERS_ES:
        m = re.search(pat, lower_s)
        if m:
            found.append({
                "type": "cliche_llm",
                "match": m.group(0),
                "lang": "es",
                "advice": f"Frase típica de ChatGPT ('{m.group(0)}'). Reemplázala o bórrala para sonar más natural."
            })

    # Chequear inglés
    for pat in LLM_PATTERNS_EN:
        m = re.search(pat, lower_s)
        if m:
            found.append({
                "type": "cliche_llm",
                "match": m.group(0),
                "lang": "en",
                "advice": f"Common AI phrasing ('{m.group(0)}'). Rephrase to sound more organic."
            })

    # Chequear estructuras tripartitas forzadas
    triplet_es = TRIPLET_PATTERN_ES.findall(sentence)
    if triplet_es:
        for t in triplet_es[:1]:
            found.append({
                "type": "triplet_structure",
                "match": f"{t[0]}, {t[1]} y {t[2]}",
                "lang": "es",
                "advice": "Estructura tripartita simétrica común en IA. Varía la subordinación o el ritmo."
            })

    return found


def analyze_document_heuristics(sentences: List[str]) -> Dict[str, Any]:
    """
    Evalúa la densidad heurística de huellas de IA a lo largo de todo el texto.
    """
    total_sentences = len(sentences)
    if total_sentences == 0:
        return {
            "cliche_count": 0,
            "affected_sentences_pct": 0.0,
            "density_score": 0.0,
            "details": []
        }

    cliche_sentences = 0
    all_findings = []

    for idx, s in enumerate(sentences):
        findings = detect_cliches_in_sentence(s)
        if findings:
            cliche_sentences += 1
            all_findings.append({
                "sentence_idx": idx,
                "sentence_text": s,
                "findings": findings
            })

    pct_affected = round((cliche_sentences / total_sentences) * 100, 1)

    # Puntuación de densidad (0.0 a 1.0)
    density_score = min(1.0, (cliche_sentences / max(1, total_sentences)) * 2.5)

    return {
        "cliche_count": len(all_findings),
        "affected_sentences_pct": pct_affected,
        "density_score": round(density_score, 2),
        "details": all_findings
    }
