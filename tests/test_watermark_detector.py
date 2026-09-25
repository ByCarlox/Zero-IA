import unittest
from core.watermark_detector import detect_invisible_watermarks, strip_invisible_characters

class UnicodeTests(unittest.TestCase):
    def test_clean(self):
        self.assertFalse(detect_invisible_watermarks('Texto')['hasFormatting'])
    def test_format_is_not_watermark(self):
        report=detect_invisible_watermarks('👩‍💻 texto\u200b y\u00ad')
        self.assertTrue(report['hasFormatting'])
        self.assertFalse(report['hasWatermark'])
        self.assertFalse(report['steganographyDetected'])
        self.assertEqual(report['totalInvisibleChars'],3)
    def test_preserve_emoji_and_direction(self):
        text='👩‍💻\u200e árabe\u200f con\u00adguion'
        self.assertEqual(strip_invisible_characters(text),text)
        self.assertEqual(strip_invisible_characters('\ufeff'+text),text)
