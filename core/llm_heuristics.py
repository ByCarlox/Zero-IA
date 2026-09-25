"""Compatibility helpers exposing editorial expressions, not signatures of a model."""
from core.engine_bridge import call_engine

def detect_cliches_in_sentence(sentence):
    result = call_engine('analyze', sentence)
    return [{'type':'editorial_expression', 'match':f['excerpt'], 'advice':f['advice'], 'lang':'es'}
            for f in result.get('findings', []) if f['rule'].startswith('generic_expression:')]

def analyze_document_heuristics(sentences):
    result = call_engine('analyze', '\n\n'.join(sentences))
    return {'findings':result.get('findings', []), 'authorship':'not_determined'}
