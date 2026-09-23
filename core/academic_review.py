"""Indicadores descriptivos; no infieren autoría ni autenticidad bibliográfica."""
import re
import unicodedata
from datetime import date
from core.sentence_tokenizer import split_into_sentences

NOTICE = ('Revisión orientativa: la legibilidad no mide calidad, nivel de posgrado ni autoría. '
          'La coherencia de citas no verifica la existencia de fuentes ni que respalden las afirmaciones. '
          'No se consultan catálogos externos.')
HEADING = r'^\s*(?:#{1,6}\s*)?(?:referencias(?: bibliográficas)?|bibliografía|references|bibliography)\s*:?\s*$'
YEAR = r'(?:18|19|20|21)\d{2}[a-z]?|s\.\s*f\.'
NAME = r'[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ’\-]+'
CITATION = rf'({NAME})(?:\s+et\s+al\.|\s+(?:y|and|&)\s+{NAME})?\s*(?:,\s*|\(\s*)({YEAR})'


def normalize(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower())
                   if unicodedata.category(c) != 'Mn').replace(' ', '')


def split_bibliography(text):
    match = re.search(HEADING, text, re.I | re.M)
    return (text[:match.start()], text[match.end():], True) if match else (text, '', False)


def syllables(word):
    """Aproximación con hiatos y diptongos; no es un silabeador lingüístico completo."""
    word = re.sub(r'qu(?=[eiéí])|gu(?=[eiéí])', lambda m: m[0][0], word.lower())
    word = re.sub(r'y$', 'i', word)
    groups = re.findall(r'[aeiouáéíóúü]+', word)
    total = 0
    for group in groups:
        total += 1
        for a, b in zip(group, group[1:]):
            if a in 'íú' or b in 'íú' or (a in 'aeoáéó' and b in 'aeoáéó') or a == b:
                total += 1
    return max(1, total)


def readability(text):
    words = re.findall(r'[a-záéíóúüñ]+', text.lower())
    sentences = [s for s in split_into_sentences(text) if re.search(r'[a-záéíóúüñ]', s, re.I)]
    n, f = len(words), len(sentences)
    count = sum(syllables(w) for w in words)
    score = round(206.835 - 62.3 * count / n - n / f, 2) if n and f else None
    label = ('Sin texto evaluable' if score is None else 'Muy difícil' if score < 40 else
             'Algo difícil' if score < 55 else 'Normal' if score < 65 else
             'Bastante fácil' if score < 80 else 'Muy fácil')
    return {'score': score, 'label': label, 'words': n, 'sentences': f, 'syllables': count,
            'short_sample': n < 100, 'syllables_estimated': True,
            'formula': '206.835 − 62.3 × sílabas/palabras − palabras/oraciones',
            'language': 'es (supuesto; no se detecta automáticamente)'}


def review_citations(body, bibliography, has_bibliography, current_year=None):
    year_now = current_year or date.today().year
    entries, findings = [], []
    # Entradas por línea; se unen continuaciones. Los formatos no reconocidos se explicitan.
    for line in bibliography.splitlines():
        line = line.strip()
        if not line:
            continue
        if not entries or re.match(r'^\[?\d+[\].)]\s*', line) or re.match(rf'^{NAME}.*?(?:{YEAR})', line):
            entries.append(line)
        else:
            entries[-1] += ' ' + line
    refs = []
    for i, entry in enumerate(entries):
        number = re.match(r'^\[?(\d+)[\].)]\s*', entry)
        content = entry[number.end():] if number else entry
        author = re.match(NAME, content)
        year = re.search(YEAR, content)
        key = normalize(author[0]) + ':' + normalize(year[0]) if author and year else None
        refs.append({'text': entry, 'key': key, 'number': number[1] if number else None})
        if key is None:
            findings.append({'code': 'unparsed_reference', 'evidence': entry,
                             'message': 'Referencia no interpretable: revisar manualmente autor, fecha y formato.'})
        if year and year[0][:4].isdigit() and int(year[0][:4]) > year_now:
            findings.append({'code': 'future_year', 'evidence': entry,
                             'message': 'Año futuro: comprobar si está en prensa o es un error.'})
        doi = re.search(r'(?:doi\s*:\s*|https?://(?:dx\.)?doi\.org/)(\S+)', entry, re.I)
        if doi and not re.fullmatch(r'10\.\d{4,9}/\S+', doi[1].rstrip('.,;')):
            findings.append({'code': 'invalid_doi', 'evidence': doi[0],
                             'message': 'Sintaxis DOI no reconocida; comprobar el identificador.'})
    citations = []
    for match in re.finditer(CITATION, body):
        citations.append({'text': match[0], 'key': normalize(match[1]) + ':' + normalize(match[2]), 'number': None})
    for match in re.finditer(r'\[(\d+(?:\s*[,;–-]\s*\d+)*)\]', body):
        numbers = []
        for part in re.split(r'[,;]', match[1]):
            limits = re.split(r'[–-]', part.strip())
            if len(limits) == 2:
                lo, hi = map(int, limits)
                if hi < lo or hi - lo > 100:
                    findings.append({'code': 'unsupported_range', 'evidence': match[0], 'message': 'Rango numérico no interpretable.'})
                    continue
                numbers.extend(str(n) for n in range(lo, hi + 1))
            else:
                numbers.append(str(int(limits[0])))
        citations.extend({'text': match[0], 'key': None, 'number': n} for n in numbers)
    used = set()
    for citation in citations:
        matches = [i for i, ref in enumerate(refs) if
                   (citation['number'] is not None and citation['number'] == ref['number']) or
                   (citation['key'] is not None and citation['key'] == ref['key'])]
        used.update(matches)
        if not has_bibliography:
            status = 'not_checked'
        elif not matches:
            status = 'missing_reference'
        elif len(matches) > 1:
            status = 'ambiguous_reference'
        else:
            status = 'internal_match'
        citation['status'] = status
        if status in ('missing_reference', 'ambiguous_reference'):
            findings.append({'code': status, 'evidence': citation['text'], 'message':
                             'Sin correspondencia reconocida en bibliografía.' if not matches else
                             'Más de una referencia coincide: comprobar autores y sufijo a/b del año.'})
    for i, ref in enumerate(refs):
        if i not in used:
            findings.append({'code': 'not_cited', 'evidence': ref['text'],
                             'message': 'No se reconoció una cita a esta entrada; puede ser un formato no soportado.'})
    return {'has_bibliography': has_bibliography, 'references': refs, 'citations': citations,
            'findings': findings, 'externally_verified': False,
            'status': 'Revisión interna parcial' if has_bibliography else 'No evaluable: falta encabezado de bibliografía',
            'coverage': 'Autor-año APA/Harvard sencillo y numéricas entre corchetes (IEEE/Vancouver). '
                        'Apellidos compuestos, autores corporativos, notas y referencias sin saltos de línea requieren revisión manual.'}


def academic_review(text, current_year=None):
    body, bibliography, found = split_bibliography(text)
    return {'version': '1.0', 'notice': NOTICE, 'readability': readability(body),
            'citations': review_citations(body, bibliography, found, current_year)}


def academic_summary(review):
    r, c = review['readability'], review['citations']
    lines = ['Revisión académica', review['notice'],
             f"Flesch-Szigriszt: {r['score'] if r['score'] is not None else 'No evaluable'} · {r['label']}",
             r['formula'], f"Palabras: {r['words']} · Oraciones: {r['sentences']} · Sílabas estimadas: {r['syllables']}",
             'Muestra breve (<100 palabras): interpretar con cautela.' if r['short_sample'] else 'Idioma supuesto: español.',
             c['status'], c['coverage'],
             f"Citas reconocidas: {len(c['citations'])} · Referencias: {len(c['references'])} · Observaciones: {len(c['findings'])}"]
    lines.extend(f"[{item['code']}] {item['message']} Evidencia: {item['evidence']}" for item in c['findings'])
    lines.append('Una coincidencia interna no confirma autenticidad; contrastar autor, título, año y fuente original.')
    return '\n\n'.join(lines)
