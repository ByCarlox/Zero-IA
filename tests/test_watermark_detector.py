"""
Tests unitarios para el detector de marcas de agua invisibles y caracteres de ancho cero.
"""

import unittest
from core.watermark_detector import detect_invisible_watermarks, strip_invisible_characters


class TestWatermarkDetector(unittest.TestCase):
    def test_clean_text(self):
        text = "Este es un documento académico completamente normal sin marcas ocultas."
        res = detect_invisible_watermarks(text)
        self.assertFalse(res["has_watermark"])
        self.assertEqual(res["total_invisible_chars"], 0)
        self.assertEqual(res["status"], "clean")

    def test_detect_zero_width_spaces(self):
        # Inyectar espacios de ancho cero (ZWSP \u200B)
        text_with_zwsp = "El\u200B modelo\u200B de lenguaje\u200B genera texto."
        res = detect_invisible_watermarks(text_with_zwsp)
        self.assertTrue(res["has_watermark"])
        self.assertEqual(res["total_invisible_chars"], 3)
        self.assertTrue(any(t["hex"] == "U+200B" for t in res["detected_types"]))

    def test_detect_steganography_sequence(self):
        # Secuencia consecutiva de caracteres invisibles para codificar bits
        stego_text = "Texto con firma oculta\u200B\u200C\u200D\u200B invisible."
        res = detect_invisible_watermarks(stego_text)
        self.assertTrue(res["has_watermark"])
        self.assertTrue(res["steganography_detected"])
        self.assertEqual(res["status"], "critical")
        self.assertIn("esteganografía", res["message"])

    def test_strip_invisible_characters(self):
        dirty_text = "Párrafo\u200B con\uFEFF marcas\u00AD invisibles\u200E."
        cleaned = strip_invisible_characters(dirty_text)
        self.assertEqual(cleaned, "Párrafo con marcas invisibles.")
        res_after = detect_invisible_watermarks(cleaned)
        self.assertFalse(res_after["has_watermark"])
        self.assertEqual(res_after["total_invisible_chars"], 0)


if __name__ == "__main__":
    unittest.main()
