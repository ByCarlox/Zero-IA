"""Canonical academic review adapters; no separate scoring implementation."""
from core.engine_bridge import call_engine

def split_bibliography(text):
    result=call_engine('bibliography',text)
    return result['body'],result['bibliography'],result['hasBibliography']

def syllables(word):
    return call_engine('syllables',word)

def readability(text):
    return academic_review(text)['readability']

def academic_review(text,current_year=None):
    return call_engine('academic',text,**({'year':current_year} if current_year is not None else {}))

def review_citations(body,bibliography,has_bibliography,current_year=None):
    text=body+('\nReferencias\n'+bibliography if has_bibliography else '')
    return academic_review(text,current_year)['citations']

def academic_summary(review):
    return call_engine('academicSummary',analysis=review)
