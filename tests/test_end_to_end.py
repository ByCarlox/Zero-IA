"""
Prueba end-to-end completa del pipeline:
Creación de documento Word -> Parseo -> Detección -> Humanización -> Exportación Word Anotado
"""

import unittest
import io
import docx
from core.document_parser import parse_document
from core.detector import AIDetector
from export.report_generator import export_annotated_docx, export_markdown_report


class TestEndToEndPipeline(unittest.TestCase):
    def test_full_flow(self):
        # 1. Crear documento Word simulado
        doc = docx.Document()
        doc.add_heading("Capítulo 1: Introducción", level=1)
        doc.add_paragraph(
            "En el ámbito de la ciencia de datos, es importante destacar que los modelos de lenguaje desempeñan un papel crucial. "
            "En el panorama actual, estas tecnologías transforman la investigación de manera holística, eficiente y escalable."
        )
        doc.add_paragraph(
            "En conclusión, el desarrollo tecnológico constituye una piedra angular para las futuras generaciones."
        )

        doc_buffer = io.BytesIO()
        doc.save(doc_buffer)
        raw_docx = doc_buffer.getvalue()

        # 2. Parsear el archivo Word
        parsed = parse_document(raw_docx, "tesis_capitulo1.docx")
        self.assertEqual(parsed["format"], "docx")
        self.assertGreater(parsed["word_count"], 25)

        # 3. Detectar huellas de IA
        detector = AIDetector(use_transformers=False)
        analysis = detector.analyze_document(parsed["full_text"])

        self.assertGreater(len(analysis["findings"]), 0)
        self.assertIsNone(analysis["authorship"]["probability"])

        # 4. Exportar Word anotado
        annotated_docx_bytes = export_annotated_docx(analysis)
        self.assertGreater(len(annotated_docx_bytes), 1000)

        # Verificar que el docx generado es válido abriéndolo
        read_back_doc = docx.Document(io.BytesIO(annotated_docx_bytes))
        headings = [p.text for p in read_back_doc.paragraphs if p.text]
        self.assertTrue(any("Validador" in h or "Revisión" in h for h in headings))

        self.assertIn(parsed["full_text"], [p.text for p in read_back_doc.paragraphs])

        # 5. Exportar reporte Markdown
        md_report = export_markdown_report(analysis)
        self.assertIn("Validador Académico", md_report)
        self.assertIn("Flesch-Szigriszt", md_report)


if __name__ == "__main__":
    unittest.main()
