"""Optional research-only neural likelihood. Never an authorship classifier.
Sliding context: https://huggingface.co/docs/transformers/perplexity
No fabricated lexical fallback; models must already exist locally by default.
"""
import math


class PerplexityEngine:
    def __init__(self, use_transformers=False, model_name=None, device='cpu', allow_download=False):
        self.model_name, self.device = model_name, device
        self._model = self._tokenizer = None
        self.error = 'Módulo neuronal no activado.'
        if use_transformers:
            if not model_name:
                self.error = 'Selecciona explícitamente un modelo y valida su idioma y dominio.'
                return
            try:
                from transformers import AutoModelForCausalLM, AutoTokenizer
                self._tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=not allow_download)
                self._model = AutoModelForCausalLM.from_pretrained(model_name, local_files_only=not allow_download).to(device)
                self._model.eval()
                self.error = None
            except Exception as error:
                self._model = None
                self.error = f'Modelo no disponible: {type(error).__name__}. No se calculó perplejidad.'

    def is_neural_active(self):
        return self._model is not None

    def analyze_document(self, sentences):
        base = {'engine_mode': 'unavailable', 'model': self.model_name, 'perplexity': None,
                'authorship_probability': None, 'scored_tokens': 0, 'error': self.error}
        if not self.is_neural_active():
            return base
        try:
            import torch
            text = sentences if isinstance(sentences, str) else '\n'.join(sentences)
            ids = self._tokenizer(text, return_tensors='pt').input_ids.to(self.device)
            length = ids.size(1)
            if length < 2:
                return {**base, 'error': 'No hay suficientes tokens.'}
            context = getattr(self._model.config, 'max_position_embeddings', None) or getattr(self._model.config, 'n_positions', 1024)
            stride = max(1, context // 2)
            total_loss, total_tokens, previous_end = 0., 0, 0
            for start in range(0, length, stride):
                end = min(start + context, length)
                inputs = ids[:, start:end]
                labels = inputs.clone()
                new_tokens = end - previous_end
                labels[:, :-new_tokens] = -100
                # Causal shift removes index zero, not an arbitrary unmasked token.
                count = int((labels[:, 1:] != -100).sum().item())
                if count:
                    with torch.no_grad():
                        loss = float(self._model(inputs, labels=labels).loss.item())
                    if not math.isfinite(loss):
                        raise ValueError('Non-finite model loss')
                    total_loss += loss * count
                    total_tokens += count
                previous_end = end
                if end == length:
                    break
            average = total_loss / total_tokens
            return {**base, 'engine_mode': 'neural_experimental', 'error': None,
                    'mean_nll': average, 'perplexity': math.exp(average), 'scored_tokens': total_tokens}
        except Exception as error:
            return {**base, 'error': f'Inferencia incompleta: {type(error).__name__}. Sin sustitución heurística.'}

    def compute_sentence_perplexity(self, sentence):
        return self.analyze_document(sentence)['perplexity']
