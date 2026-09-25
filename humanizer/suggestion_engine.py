"""Conservative editorial suggestions from the canonical engine; no bulk rewriting."""
from core.engine_bridge import call_engine

def generate_suggestions_for_sentence(sentence, risk_level='low', perplexity=None, length_words=None, cliches=None):
    suggestion = call_engine('suggest', sentence)
    return {'original': sentence, 'risk_level': risk_level,
            'tips': [suggestion['reason']] if suggestion else [],
            'suggested_rewrite': suggestion['replacement'] if suggestion else None,
            'suggestion': suggestion}
