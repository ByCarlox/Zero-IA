import math
import sys
import types
import unittest
from unittest.mock import patch
from contextlib import nullcontext
import numpy as np
from core.perplexity_engine import PerplexityEngine

class Tensor:
    def __init__(self, data):self.data=np.array(data)
    def to(self, device):return self
    def size(self, axis):return self.data.shape[axis]
    def clone(self):return Tensor(self.data.copy())
    def __getitem__(self, item):return Tensor(self.data[item])
    def __setitem__(self, item, value):self.data[item]=value
    def __ne__(self, value):return Tensor(self.data!=value)
    def sum(self):return self.data.sum()

class NeuralContract(unittest.TestCase):
    def test_windows_count_each_predicted_token_once(self):
        engine=PerplexityEngine();calls=[]
        engine._tokenizer=lambda *a,**kw:types.SimpleNamespace(input_ids=Tensor([range(9)]))
        class Model:
            config=types.SimpleNamespace(max_position_embeddings=4)
            def __call__(self, inputs, labels):
                calls.append(labels.data.tolist())
                return types.SimpleNamespace(loss=np.array(float(len(calls))))
        engine._model=Model()
        with patch.dict(sys.modules,torch=types.SimpleNamespace(no_grad=nullcontext)):
            result=engine.analyze_document('test')
        self.assertEqual(result['scored_tokens'],8)
        self.assertAlmostEqual(result['perplexity'],math.exp(17/8))
        self.assertEqual(result['engine_mode'],'neural_experimental')
    def test_inference_failure_is_unavailable(self):
        engine=PerplexityEngine();engine._model=object();engine._tokenizer=lambda *a,**k:None
        with patch.dict(sys.modules,torch=types.SimpleNamespace(no_grad=nullcontext)):
            result=engine.analyze_document('test')
        self.assertIsNone(result['perplexity'])
        self.assertEqual(result['engine_mode'],'unavailable')
