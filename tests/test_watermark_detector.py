import unittest
from core.watermark_detector import (
    detect_invisible_watermarks,
    strip_invisible_characters,
    analyze_watermark_provenance
)

class UnicodeForensicWatermarkTests(unittest.TestCase):
    def test_clean(self):
        report = detect_invisible_watermarks('Texto completamente limpio')
        self.assertFalse(report['hasFormatting'])
        self.assertFalse(report['hasWatermark'])
        self.assertEqual(report['covertWatermarksCount'], 0)
        self.assertEqual(report['watermarkScoreContribution'], 0)

    def test_legitimate_format_is_not_watermark(self):
        # Emojis (with ZWJ) and soft hyphens are legitimate formatting, not AI watermarks
        report = detect_invisible_watermarks('👩‍💻 texto y\u00adguion')
        self.assertTrue(report['hasFormatting'])
        self.assertFalse(report['hasWatermark'])
        self.assertFalse(report['steganographyDetected'])
        self.assertEqual(report['covertWatermarksCount'], 0)
        self.assertEqual(report['watermarkScoreContribution'], 0)

    def test_covert_ai_watermark_detected(self):
        # Covert ZWSP and WJ injected into text (Claude/LLM style)
        text = 'Texto con marca\u200Boculta y otra\u2060señal'
        report = detect_invisible_watermarks(text)
        self.assertTrue(report['hasFormatting'])
        self.assertTrue(report['hasWatermark'])
        self.assertTrue(report['steganographyDetected'])
        self.assertEqual(report['covertWatermarksCount'], 2)
        self.assertGreaterEqual(report['watermarkScoreContribution'], 70)
        self.assertIn('alert', report['status'])

        summary = analyze_watermark_provenance(text)
        self.assertTrue(summary['has_watermark'])
        self.assertEqual(summary['covert_count'], 2)

    def test_preserve_emoji_and_direction(self):
        text = '👩‍💻\u200e árabe\u200f con\u00adguion'
        self.assertEqual(strip_invisible_characters(text), text)
        self.assertEqual(strip_invisible_characters('\ufeff' + text), text)

    def test_strip_covert_watermarks(self):
        text = '\ufeffTexto con\u200Bmarca\u2060oculta'
        cleaned = strip_invisible_characters(text)
        self.assertEqual(cleaned, 'Texto conmarcaoculta')
        self.assertNotIn('\ufeff', cleaned)
        self.assertNotIn('\u200b', cleaned)
        self.assertNotIn('\u2060', cleaned)

if __name__ == '__main__':
    unittest.main()
