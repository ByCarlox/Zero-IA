"""
Módulo para la ingesta y extracción de texto estructurado desde archivos
Word (.docx), PDF (.pdf) y texto plano (.txt, .md).
"""

import io
from typing import Dict, Any, List
import docx
from docx.text.paragraph import Paragraph
from docx.table import Table
import pypdf
from core.sentence_tokenizer import split_into_paragraphs


def extract_from_docx(file_bytes: bytes) -> Dict[str, Any]:
    """Extrae texto estructurado desde un archivo Word (.docx)."""
    doc_stream = io.BytesIO(file_bytes)
    doc = docx.Document(doc_stream)

    paragraphs_text: List[str] = []
    # Preserve the original interleaving of paragraphs and tables.
    for element in doc.element.body:
        if element.tag.endswith('}p'):
            txt = Paragraph(element, doc).text.strip()
            if txt:
                paragraphs_text.append(txt)
        elif element.tag.endswith('}tbl'):
            for row in Table(element, doc).rows:
                cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if cells:
                    paragraphs_text.append(" | ".join(cells))

    full_text = "\n\n".join(paragraphs_text)

    return {
        "format": "docx",
        "paragraphs": paragraphs_text,
        "full_text": full_text,
        "word_count": len(full_text.split()),
        "paragraph_count": len(paragraphs_text)
    }


def extract_from_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """Extrae texto estructurado desde un archivo PDF (.pdf)."""
    pdf_stream = io.BytesIO(file_bytes)
    reader = pypdf.PdfReader(pdf_stream)

    pages_text: List[str] = []
    for page in reader.pages:
        page_str = page.extract_text() or ""
        # Limpieza básica de saltos de línea innecesarios dentro de oraciones en PDFs
        lines = [line.strip() for line in page_str.splitlines() if line.strip()]
        cleaned_page = "\n".join(lines)
        if cleaned_page:
            pages_text.append(cleaned_page)

    full_text = "\n\n".join(pages_text)
    paragraphs = split_into_paragraphs(full_text)

    return {
        "format": "pdf",
        "page_count": len(reader.pages),
        "paragraphs": paragraphs,
        "full_text": full_text,
        "word_count": len(full_text.split()),
        "paragraph_count": len(paragraphs)
    }


def extract_from_txt(file_bytes: bytes) -> Dict[str, Any]:
    """Extrae texto estructurado desde un archivo de texto plano."""
    try:
        text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = file_bytes.decode("latin-1", errors="replace")

    paragraphs = split_into_paragraphs(text)
    return {
        "format": "txt",
        "paragraphs": paragraphs,
        "full_text": text,
        "word_count": len(text.split()),
        "paragraph_count": len(paragraphs)
    }


def parse_document(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Función unificada que detecta la extensión del archivo y extrae el texto estructurado.
    """
    lower_name = filename.lower()
    if lower_name.endswith(".docx"):
        res = extract_from_docx(file_bytes)
    elif lower_name.endswith(".pdf"):
        res = extract_from_pdf(file_bytes)
    elif lower_name.endswith((".txt", ".md")):
        res = extract_from_txt(file_bytes)
    else:
        raise ValueError(f"Formato no soportado para '{filename}'. Usa archivos .docx, .pdf o .txt")

    if not res["full_text"].strip():
        raise ValueError("No se extrajo texto. Si es un PDF escaneado, necesita OCR antes de analizarse.")
    res["filename"] = filename
    return res
