# Resultados de diagnóstico del motor

Casos sintéticos: no equivalen a precisión de detección de autoría.

| Caso | Python /100 | Web /100 | Frases Python/web | Palabras Python/web | Prioridad alta Python/web |
|---|---:|---:|---|---|---|
| generic_generated | 12.0 | 14 | 8/8 | 109/109 | 0/0 |
| generic_generated_400_words | 12.0 | 14 | 32/32 | 436/436 | 0/0 |
| verbatim_repeat_12 | 12.0 | 15 | 12/12 | 168/168 | 0/0 |
| plain_control | 12.0 | 12 | 2/2 | 14/14 | 0/0 |
| cliche_dense | 100.0 | 100 | 1/1 | 16/16 | 1/1 |
| quoted_cliche | 100.0 | 100 | 1/1 | 17/17 | 1/1 |
| enumeration | 62.0 | 65 | 1/1 | 8/8 | 0/0 |
| summary_connector | 12.0 | 65 | 1/1 | 10/10 | 0/0 |
| synthesis_connector | 62.0 | 15 | 1/1 | 10/10 | 0/0 |
| legitimate_short | 12.0 | 15 | 1/1 | 4/4 | 0/0 |
| one_word | 57.0 | 30 | 1/1 | 1/1 | 0/0 |
| normal_order | 12.0 | 15 | 1/1 | 11/11 | 0/0 |
| reversed_words | 12.0 | 15 | 1/1 | 11/11 | 0/0 |
| no_punctuation | 12.0 | 15 | 1/1 | 109/109 | 0/0 |
| nfc | 100.0 | 100 | 1/1 | 16/16 | 1/1 |
| nfd | 62.0 | 65 | 1/1 | 19/19 | 0/0 |
| bibliography_added | 12.0 | 12 | 2/2 | 32/14 | 0/0 |
| bibliography_only | 51.9 | 41 | 3/3 | 18/18 | 1/1 |
| numbered_bibliography | 32.1 | 23 | 6/6 | 33/33 | 1/1 |
| appendix_after_bibliography | 12.0 | 12 | 2/2 | 36/14 | 0/0 |
| closing_quote | 12.0 | 13 | 2/2 | 9/9 | 0/0 |
| lowercase_after_period | 12.0 | 15 | 1/1 | 7/7 | 0/0 |
| initial_author | 17.0 | 10 | 4/3 | 10/10 | 0/0 |
| newline_paragraphs | 12.0 | 15 | 2/2 | 6/6 | 0/0 |
| non_latin | None | None | None/None | None/None | None/None |
| emoji_family | 12.0 | 15 | 2/2 | 10/10 | 0/0 |
| connector_rewrite | 100.0 | 100 | 1/1 | 8/8 | 1/1 |
| negative_rewrite | 62.0 | 65 | 1/1 | 8/8 | 0/0 |
| quoted_rewrite | 62.0 | 65 | 1/1 | 10/10 | 0/0 |

Tiempos del motor (sin interfaz, extracción ni arranque de Node):

[
  {
    "sentences": 100,
    "words": 1400,
    "python_ms": 8.96,
    "javascript_ms": 5.25
  },
  {
    "sentences": 1000,
    "words": 14000,
    "python_ms": 88.28,
    "javascript_ms": 22.84
  },
  {
    "sentences": 5000,
    "words": 70000,
    "python_ms": 444.61,
    "javascript_ms": 84.9
  }
]

Fallo neuronal simulado (comprobar engine_mode):

{
  "mean_perplexity": 89.38,
  "burstiness": 0.0,
  "max_perplexity": 89.38,
  "min_perplexity": 89.38,
  "sentence_perplexities": [
    89.38
  ],
  "engine_mode": "neural"
}

Limpieza Unicode (controlador aislado):

{
  "error": "ReferenceError: runAnalysis is not defined",
  "text_after": "Un texto de ejemplo."
}
