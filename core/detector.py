"""Python adapter for the canonical, versioned editorial engine. No authorship score."""
from core.engine_bridge import call_engine

class AIDetector:
    def __init__(self, use_transformers=False, model_name=None):
        if use_transformers:
            raise ValueError('La inferencia neuronal es experimental y está separada del análisis editorial. Usa PerplexityEngine explícitamente.')

    def analyze_document(self, raw_text, extraction=None):
        return call_engine('analyze', raw_text, options={'extraction': extraction} if extraction else {})
