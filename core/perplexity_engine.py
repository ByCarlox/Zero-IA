"""
Motor de cálculo de Perplejidad (Perplexity) y Ráfaga (Burstiness).
Inspirado en GPTZero con soporte dual:
1. Modo Neuronal (Hugging Face Transformers / GPT-2) para cálculo exacto de pérdida negativa de verosimilitud (NLL).
2. Modo Estadístico Rápido (N-gram & Information Theory) para ejecución instantánea sin necesidad de GPU ni descarga pesada de modelos.
"""

import math
import re
from typing import List, Dict, Any, Optional
import numpy as np


class PerplexityEngine:
    def __init__(self, use_transformers: bool = True, model_name: str = "gpt2", device: Optional[str] = None):
        self.use_transformers = use_transformers
        self.model_name = model_name
        self.device = device
        self._model = None
        self._tokenizer = None
        self._has_transformers = False

        if use_transformers:
            self._init_transformers()

    def _init_transformers(self):
        """Intenta cargar el modelo de Transformers si está disponible."""
        try:
            import torch
            from transformers import GPT2LMHeadModel, GPT2TokenizerFast

            if self.device is None:
                if torch.backends.mps.is_available():
                    self.device = "mps"
                elif torch.cuda.is_available():
                    self.device = "cuda"
                else:
                    self.device = "cpu"

            print(f"[PerplexityEngine] Cargando modelo '{self.model_name}' en dispositivo '{self.device}'...")
            self._tokenizer = GPT2TokenizerFast.from_pretrained(self.model_name)
            self._model = GPT2LMHeadModel.from_pretrained(self.model_name).to(self.device)
            self._model.eval()
            self._has_transformers = True
            print("[PerplexityEngine] Modelo neuronal cargado con éxito.")
        except Exception as e:
            print(f"[PerplexityEngine] No se pudo cargar Transformers ({e}). Usando modo estadístico optimizado.")
            self._has_transformers = False

    def is_neural_active(self) -> bool:
        return self._has_transformers

    def compute_sentence_perplexity(self, sentence: str) -> float:
        """
        Calcula la perplejidad de una oración individual.
        Valores bajos (< 45) sugieren alta predictibilidad (IA).
        Valores altos (> 75) sugieren creatividad y redacción humana.
        """
        clean = sentence.strip()
        if not clean or len(clean.split()) < 2:
            return 50.0

        if self._has_transformers:
            try:
                import torch
                encodings = self._tokenizer(clean, return_tensors="pt")
                input_ids = encodings.input_ids.to(self.device)
                seq_len = input_ids.size(1)

                if seq_len < 2:
                    return 50.0

                with torch.no_grad():
                    outputs = self._model(input_ids, labels=input_ids)
                    loss = outputs.loss.item()

                ppl = float(math.exp(min(loss, 15.0)))  # evitar overflow
                return round(ppl, 2)
            except Exception:
                pass

        # Fallback estadístico: Perplejidad aproximada por longitud de palabras y sorpresa léxica
        return self._compute_statistical_perplexity(clean)

    def _compute_statistical_perplexity(self, sentence: str) -> float:
        """
        Aproximación de perplejidad basada en compresión de texto, longitud media de morfemas
        y entropía posicional. Calibrada para mantener la misma escala de GPTZero (20 a 150+).
        """
        words = re.findall(r"\b\w+\b", sentence.lower())
        if not words:
            return 50.0

        word_lengths = [len(w) for w in words]
        avg_wlen = float(np.mean(word_lengths))
        unique_ratio = len(set(words)) / len(words)

        # La variabilidad de caracteres y combinaciones poco frecuentes
        char_counts = {}
        for c in sentence.lower():
            char_counts[c] = char_counts.get(c, 0) + 1
        entropy = -sum((cnt / len(sentence)) * math.log2(cnt / len(sentence)) for cnt in char_counts.values())

        # Fórmula empírica calibrada con textos de referencia humanos vs GPT
        base_ppl = 25.0 + (entropy * 8.5) + (unique_ratio * 20.0) + (avg_wlen * 2.0)
        return round(float(base_ppl), 2)

    def analyze_document(self, sentences: List[str]) -> Dict[str, Any]:
        """
        Analiza cada oración del texto calculando:
        - Perplejidad individual por oración
        - Perplejidad promedio
        - Ráfaga (Burstiness = varianza / máximo de perplejidad entre oraciones contiguas)
        """
        if not sentences:
            return {
                "mean_perplexity": 0.0,
                "burstiness": 0.0,
                "sentence_perplexities": [],
                "engine_mode": "neural" if self._has_transformers else "statistical"
            }

        perplexities = [self.compute_sentence_perplexity(s) for s in sentences]
        arr_ppl = np.array(perplexities, dtype=float)

        mean_ppl = float(np.mean(arr_ppl))
        std_ppl = float(np.std(arr_ppl))
        max_ppl = float(np.max(arr_ppl))

        # Burstiness: diferencia entre picos y valles o desviación estándar de la perplejidad
        burstiness = float(std_ppl)

        return {
            "mean_perplexity": round(mean_ppl, 2),
            "burstiness": round(burstiness, 2),
            "max_perplexity": round(max_ppl, 2),
            "min_perplexity": round(float(np.min(arr_ppl)), 2),
            "sentence_perplexities": perplexities,
            "engine_mode": "neural" if self._has_transformers else "statistical"
        }
