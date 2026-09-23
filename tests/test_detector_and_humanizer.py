"""
Tests unitarios para el motor de detección de huellas de IA y humanizador.
"""

import unittest
from core.detector import AIDetector
from core.llm_heuristics import detect_cliches_in_sentence
from core.stylometrics import analyze_stylometrics
from humanizer.suggestion_engine import generate_suggestions_for_sentence


class TestDetectorAndHumanizer(unittest.TestCase):
    def setUp(self):
        # Usar modo estadístico para tests unitarios rápidos
        self.detector = AIDetector(use_transformers=False)

    def test_detect_ai_cliches(self):
        sentence = "En el ámbito de la medicina, es importante destacar que la prevención juega un papel fundamental."
        cliches = detect_cliches_in_sentence(sentence)
        self.assertTrue(len(cliches) >= 2)
        matches = [c["match"].lower() for c in cliches]
        self.assertTrue(any("ámbito" in m for m in matches))
        self.assertTrue(any("destacar" in m for m in matches))

    def test_suggestion_generation(self):
        sentence = "En conclusión, es importante destacar que el modelo es eficiente."
        cliches = detect_cliches_in_sentence(sentence)
        suggestions = generate_suggestions_for_sentence(
            sentence=sentence,
            risk_level="high",
            perplexity=30.0,
            length_words=10,
            cliches=cliches
        )
        self.assertEqual(suggestions["risk_level"], "high")
        self.assertTrue(len(suggestions["tips"]) > 0)
        self.assertIsNotNone(suggestions["suggested_rewrite"])
        self.assertNotIn(",,", suggestions["suggested_rewrite"])
        # La sugerencia debe haber limpiado o reemplazado el cliché
        self.assertNotIn("en conclusión,", suggestions["suggested_rewrite"].lower())

    def test_detector_chatgpt_sample(self):
        chatgpt_text = (
            "En el ámbito de la tecnología moderna, es importante destacar que los modelos de lenguaje desempeñan un papel crucial. "
            "En el panorama actual, estas herramientas transforman los procesos educativos de manera holística, eficiente y escalable. "
            "En conclusión, el desarrollo tecnológico constituye una piedra angular para las futuras generaciones."
        )
        result = self.detector.analyze_document(chatgpt_text)
        self.assertGreater(result["global_ai_percentage"], 50.0)
        self.assertIn("ALTA PROBABILIDAD", result["verdict_badge"])
        self.assertTrue(result["high_risk_sentences"] >= 2)

    def test_detector_human_sample(self):
        human_text = (
            "Durante las pruebas que hicimos en el laboratorio el pasado mes de octubre, observamos anomalías claras. "
            "¿Por qué ocurrió esto? Principalmente por fluctuaciones en los datos suministrados por el sensor analógico. "
            "A pesar de reiniciar los calibradores, el desfase continuó presente durante cuarenta y ocho horas más."
        )
        result = self.detector.analyze_document(human_text)
        self.assertLess(result["global_ai_percentage"], 40.0)
        self.assertIn("ORIGINAL HUMANO", result["verdict_badge"])

    def test_detector_bibliography_isolation(self):
        text_with_bib = (
            "Durante las pruebas que hicimos en el laboratorio el pasado mes de octubre, observamos anomalías claras. "
            "El sensor registró variaciones significativas en la señal acústica.\n\n"
            "Referencias\n"
            "García, M. (2023). Estudio de sensores. Revista de Ingeniería, 12(3), 45-56. https://doi.org/10.1000/182\n"
            "López, J. (2022). Métodos acústicos. Editorial Ciencia."
        )
        result = self.detector.analyze_document(text_with_bib)
        self.assertLess(result["global_ai_percentage"], 40.0)
        bib_sentences = [s for s in result["sentences"] if s.get("is_bibliography")]
        self.assertTrue(len(bib_sentences) >= 1)
        for bs in bib_sentences:
            self.assertEqual(bs["risk_level"], "low")
            self.assertEqual(bs["ai_score"], 0.0)
            self.assertIn("bibliográfica", bs["reasons"][0])


if __name__ == "__main__":
    unittest.main()
