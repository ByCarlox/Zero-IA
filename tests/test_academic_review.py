import io
import json
from pathlib import Path
import shutil
import subprocess
import unittest
import docx
from core.academic_review import academic_review, readability, syllables
from core.detector import AIDetector
from export.report_generator import export_annotated_docx, export_markdown_report

CASES = [
    '', '123 !!!', 'Mi casa es bonita.',
    'Gómez (2023) describe el método; (Pérez, 2022) lo discute.\nReferencias\nGómez, A. (2023). Método. Editorial.',
    '(Gómez y Pérez, 2023a; López et al., 2020).\nBibliografía\nGómez, A. y Pérez, B. (2023a). Método.\nLópez, A. (2020). Hallazgo.',
    'Texto [1–3].\nReferences\n[1] Smith, A. (2020). Study.\n[2] Jones, B. (2021). Report.',
    'Gómez (2023).\nReferencias\nGómez, A. (2023). Uno.\nGómez, B. (2023). Dos.',
    '(Gómez, 2023).',
    'Texto.\nReferencias\nGómez, A. (2099). Futuro. doi: falso\nPérez, A. (2022). Pasado. https://doi.org/10.1234/abc',
    '(Gómez, s. f.).\nReferencias\nGómez, A. (s. f.). Sin fecha.',
    'Texto [4-2] [1-99999].\nReferencias\n[1] Gómez, A. (2020). Uno.',
]

class AcademicReviewTests(unittest.TestCase):
    def test_formula_and_syllables(self):
        self.assertEqual([syllables(w) for w in ['casa','país','poeta','queso','guerra','pingüino']], [2,2,3,2,2,3])
        r = readability('Mi casa es bonita.')
        self.assertEqual(r['syllables'], 7)
        self.assertEqual(r['score'], round(206.835-62.3*7/4-4, 2))
        self.assertIsNone(readability('123 !!!')['score'])

    def test_missing_is_not_fabricated(self):
        r = academic_review(CASES[3])['citations']
        self.assertEqual([c['status'] for c in r['citations']], ['internal_match','missing_reference'])
        self.assertFalse(r['externally_verified'])
        self.assertEqual(academic_review(CASES[6])['citations']['citations'][0]['status'], 'ambiguous_reference')
        self.assertEqual(academic_review(CASES[7])['citations']['citations'][0]['status'], 'not_checked')

    def test_styles_and_year_suffixes(self):
        self.assertEqual([c['status'] for c in academic_review(CASES[4])['citations']['citations']], ['internal_match']*2)
        self.assertEqual([c['status'] for c in academic_review(CASES[5])['citations']['citations']], ['internal_match','internal_match','missing_reference'])
        self.assertEqual(academic_review(CASES[9])['citations']['citations'][0]['status'], 'internal_match')

    def test_dates_doi_and_excluded_bibliography(self):
        r = academic_review(CASES[8], 2026)
        self.assertEqual(r['readability']['words'], 1)
        codes = [i['code'] for i in r['citations']['findings']]
        self.assertEqual(codes.count('future_year'), 1)
        self.assertEqual(codes.count('invalid_doi'), 1)

    def test_exports_and_empty_input(self):
        detector = AIDetector(use_transformers=False)
        self.assertEqual(detector.analyze_document('!!!')['status'], 'no_prose')
        result = detector.analyze_document(CASES[3])
        self.assertEqual(result['score_kind'], 'editorial_observations')
        md = export_markdown_report(result)
        self.assertIn('missing_reference', md)
        document = docx.Document(io.BytesIO(export_annotated_docx(result)))
        content = '\n'.join(p.text for p in document.paragraphs)
        self.assertIn('Flesch-Szigriszt', content)
        self.assertIn('missing_reference', content)

    @unittest.skipUnless(shutil.which('node'), 'Node required for browser/Python parity')
    def test_academic_browser_python_parity(self):
        script = """
const fs = require('fs'), vm = require('vm');
global.window = global;
require('./js/editorial-rules.js'); require('./js/text-structure.js');
vm.runInThisContext(fs.readFileSync('js/academic-review.js','utf8'));
vm.runInThisContext(fs.readFileSync('js/detector.js','utf8'));
const cases = JSON.parse(fs.readFileSync(0,'utf8'));
console.log(JSON.stringify(cases.map(t => ZeroIAAcademic.academicReview(t, 2026))));
"""
        results = json.loads(subprocess.check_output(['node', '-e', script], input=json.dumps(CASES).encode()))
        for text, result in zip(CASES, results):
            with self.subTest(text=text):
                self.assertEqual(result, academic_review(text, 2026))
