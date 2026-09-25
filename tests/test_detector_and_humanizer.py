"""Editorial contracts, not assertions that invented samples prove authorship."""
import unittest
import unicodedata
from core.detector import AIDetector
from core.engine_bridge import call_engine
from core.perplexity_engine import PerplexityEngine

class EditorialTests(unittest.TestCase):
    def analyze(self, text):
        return AIDetector().analyze_document(text)

    def test_no_authorship_percentage(self):
        report = self.analyze('En conclusión, el procedimiento terminó sin incidencias.')
        self.assertIsNone(report['authorship']['probability'])
        self.assertNotIn('global_ai_percentage', report)
        self.assertEqual(report['findings'], [])
        self.assertEqual(report['validationScore'], 100)
        self.assertEqual(report['cleanPercentage'], 100)
        self.assertEqual(report['issuePercentage'], 0)

    def test_repetition_detected_without_cliches(self):
        text = 'El sensor acústico registró variaciones significativas durante toda la noche. '
        report = self.analyze(text * 12)
        self.assertEqual(report['highRiskSentences'], 12)
        self.assertIn('exact_repetition', [f['rule'] for f in report['findings']])
        self.assertEqual(report['cleanPercentage'], 0)
        self.assertEqual(report['validationScore'], 0)

    def test_protected_quotes_and_negation(self):
        for text in ['El autor escribió «es importante destacar que».', 'No es importante destacar que esto ocurrió.']:
            self.assertEqual(self.analyze(text)['findings'], [])

    def test_unicode_equivalence(self):
        text = 'Es importante destacar que la metodología requiere revisión.'
        first, second = [self.analyze(t) for t in [text, unicodedata.normalize('NFD', text)]]
        self.assertEqual(first['dimensions'], second['dimensions'])
        self.assertEqual(first['metrics'], second['metrics'])
        self.assertEqual(first['academic_review'], second['academic_review'])

    def test_short_and_unsupported(self):
        self.assertEqual(self.analyze('Texto breve.')['status'], 'limited_sample')
        self.assertIsNone(self.analyze('这是一个中文文本。')['validationScore'])
        self.assertIsNone(self.analyze('!!!')['validationScore'])
        self.assertIsNone(self.analyze('')['validationScore'])

    def test_bibliography_and_annex(self):
        text='1. Referencias\nGómez, A. (2020). Método.\n2. Anexos\nEl sensor acústico registró valores normales durante todo el experimento.'
        report=self.analyze(text)
        self.assertEqual(report['totalSentences'], 1)
        self.assertEqual(len(report['academic_review']['citations']['references']),1)
        self.assertEqual(report['coverage']['totalWords'], report['coverage']['analyzedWords']+report['coverage']['excludedWords'])

    def test_bibliography_only_abstains(self):
        report=self.analyze('Referencias\nGómez, A. (2020). Método.')
        self.assertEqual(report['status'], 'no_body')
        self.assertEqual(report['findings'], [])

    def test_suggestion_guard_and_source(self):
        text='  Es importante destacar que el sistema requiere revisión.\n\nOtro texto.'
        report=self.analyze(text)
        revised=call_engine('apply',text,analysis=report,sentenceId=0)
        self.assertEqual(revised,'  El sistema requiere revisión.\n\nOtro texto.')
        with self.assertRaises(RuntimeError):
            call_engine('apply',text+' editado',analysis=report,sentenceId=0)
        for protected in ['Es importante destacar que no funciona.', 'Es importante destacar que costó 30 euros.', 'Es importante destacar que dijo «sí».']:
            self.assertIsNone(call_engine('suggest',protected))

    def test_source_offsets(self):
        text='😀 El Dr. Gómez dijo: «Hola». luego salió.\n\nTexto final.'
        report=self.analyze(text)
        raw=text.encode('utf-16-le')
        for sentence in report['sentences']:
            self.assertEqual(raw[2*sentence['start']:2*sentence['end']].decode('utf-16-le'),sentence['text'])

    def test_limit(self):
        self.assertEqual(self.analyze('a'*500001)['status'],'too_large')

    def test_neural_does_not_fake_fallback(self):
        report=PerplexityEngine().analyze_document(['Texto'])
        self.assertEqual(report['engine_mode'],'unavailable')
        self.assertIsNone(report['perplexity'])
        self.assertIsNone(PerplexityEngine(use_transformers=True).compute_sentence_perplexity('Texto'))
