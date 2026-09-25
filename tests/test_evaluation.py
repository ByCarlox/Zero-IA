import copy
import json
from pathlib import Path
import unittest
from tools.evaluate_editorial import evaluate
class EvaluationTests(unittest.TestCase):
    def setUp(self):
        self.rows=[json.loads(s) for s in Path('tests/fixtures/editorial-cases.jsonl').read_text().splitlines()]
    def test_synthetic_regressions(self):
        result=evaluate(self.rows)
        self.assertIsNone(result['authorship_accuracy'])
        for case in result['outcomes']:
            self.assertEqual(case['unexpected'],[])
            self.assertEqual(case['missed'],[])
    def test_leakage_rejected(self):
        duplicate=copy.deepcopy(self.rows[0]);duplicate.update(id='copy',split='train')
        with self.assertRaises(ValueError):evaluate(self.rows+[duplicate])
