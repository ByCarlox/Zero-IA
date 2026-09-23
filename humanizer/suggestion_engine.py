"""
Módulo de Humanización y Generación de Sugerencias.
Proporciona recomendaciones prácticas y alternativas de reescritura para eliminar
las huellas sintéticas detectadas y aumentar la naturalidad del texto académico.
"""

import re
from typing import Dict, Any, List

# Diccionario de reemplazos académicos para muletillas y clichés de ChatGPT/Claude
CLICHE_REPLACEMENTS = {
    # Español
    "en el ámbito de": ["En", "Dentro de", "Tratándose de", "En relación con"],
    "en el panorama actual": ["Hoy en día", "En la actualidad", "En el contexto contemporáneo"],
    "en la era digital": ["Con el desarrollo tecnológico reciente", "En los últimos años"],
    "es importante destacar que": ["Conviene notar que", "Obsérvese que", "Resulta relevante que", ""],
    "es fundamental señalar que": ["Debe considerarse que", "Nótese que", ""],
    "cabe destacar que": ["Particularmente,", "Específicamente,", ""],
    "cabe mencionar que": ["Asimismo,", "Por otra parte,", ""],
    "es crucial recordar que": ["Importa recordar que", "Téngase presente que"],
    "en conclusión": ["Por consiguiente,", "Finalmente,", "En suma,"],
    "en resumen": ["En síntesis,", "Globalmente,", "De este modo,"],
    "juega un papel fundamental": ["influye decisivamente", "resulta determinante", "constituye un factor clave"],
    "desempeña un papel crucial": ["es determinante", "incide de manera crítica", "es central"],
    "es un testimonio de": ["demuestra", "evidencia", "ilustra claramente"],
    "un tapiz de": ["una combinación de", "un conjunto de", "una red de"],
    "una piedra angular": ["un pilar esencial", "la base fundamental", "el fundamento"],

    # Inglés
    "in conclusion": ["Ultimately,", "To conclude,", "In summary,"],
    "it is important to note that": ["Notably,", "Importantly,", ""],
    "it is crucial to": ["We must", "It is necessary to"],
    "delve into": ["examine", "investigate", "explore", "analyze"],
    "a testament to": ["evidence of", "proof of", "demonstrates"],
    "rich tapestry": ["complex array", "diverse set", "multifaceted system"],
    "plays a pivotal role": ["is essential", "is central", "acts as a key driver"]
}


def generate_suggestions_for_sentence(
    sentence: str,
    risk_level: str,
    perplexity: float,
    length_words: int,
    cliches: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Genera un paquete de sugerencias específicas para transformar una oración marcada
    y eliminar sus huellas de IA.
    """
    tips: List[str] = []
    rewritten_candidates: List[str] = []

    # 1. Sugerencias basadas en clichés detectados
    modified_sentence = sentence
    for c in cliches:
        match_text = c.get("match", "").lower()
        tips.append(c.get("advice", "Evita frases predecibles de IA."))

        for key, replacements in CLICHE_REPLACEMENTS.items():
            if key in match_text:
                rep = replacements[0]
                if rep:
                    # Reemplazar con mayúscula si estaba al inicio
                    pattern = re.compile(re.escape(match_text), re.IGNORECASE)
                    modified_sentence = pattern.sub(lambda m: rep if m.start() == 0 else rep.lower(), modified_sentence)
                else:
                    # Si el reemplazo es vacío, quitarlo
                    pattern = re.compile(re.escape(match_text) + r"\s*", re.IGNORECASE)
                    modified_sentence = pattern.sub("", modified_sentence)
                    modified_sentence = modified_sentence.capitalize()

    # 2. Sugerencias basadas en longitud y monotonía sintáctica
    if length_words > 32:
        tips.append("Oración muy extensa y densa. Divídela en dos oraciones conectadas con una idea principal para crear cadencia natural.")
    elif length_words < 6 and risk_level != "low":
        tips.append("Frase muy breve y aislada. Considérala integrar con la oración siguiente para aportar mayor profundidad.")

    # 3. Sugerencias basadas en Perplejidad
    if perplexity < 40:
        tips.append("Revisa claridad y precisión. Añade ejemplos o fuentes solo cuando sean pertinentes y verificables; no para modificar el índice.")

    modified_sentence = re.sub(r",\s*,", ",", modified_sentence)

    # Si hubo modificación de clichés, ofrecerla como candidato de reescritura
    if modified_sentence != sentence:
        rewritten_candidates.append(modified_sentence)

    return {
        "original": sentence,
        "risk_level": risk_level,
        "tips": tips,
        "suggested_rewrite": rewritten_candidates[0] if rewritten_candidates else None
    }
