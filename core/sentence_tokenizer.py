"""Lossless segmentation through the same engine used in the browser."""
from core.engine_bridge import call_engine

def split_into_paragraphs(raw_text):
    return call_engine('paragraphs', raw_text)

def split_into_sentences(text):
    return call_engine('sentences', text)

def tokenize_document_structure(raw_text):
    return [(pi, si, sentence) for pi, paragraph in enumerate(split_into_paragraphs(raw_text))
            for si, sentence in enumerate(split_into_sentences(paragraph))]
