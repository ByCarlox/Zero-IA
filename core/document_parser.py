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
    pages = []
    for number, page in enumerate(reader.pages, 1):
        page_str = page.extract_text() or ""
        # Limpieza básica de saltos de línea innecesarios dentro de oraciones en PDFs
        lines = [line.strip() for line in page_str.splitlines() if line.strip()]
        cleaned_page = "\n".join(lines)
        pages.append({"page": number, "hasText": bool(cleaned_page), "characters": len(cleaned_page)})
        pages_text.append(cleaned_page)

    full_text = "\n\n".join(pages_text)
    paragraphs = split_into_paragraphs(full_text)

    return {
        "format": "pdf",
        "page_count": len(reader.pages),
        "pages": pages,
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
    if len(file_bytes) > 20 * 1024 * 1024:
        raise ValueError("El límite por archivo es 20 MB.")
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
    if len(res['full_text'].encode('utf-16-le')) // 2 > 500000:
        raise ValueError('El límite es 500.000 caracteres. Divide el documento por secciones.')
    warnings = []
    if res['format'] == 'pdf':
        empty = [p['page'] for p in res['pages'] if not p['hasText']]
        if empty:
            warnings.append('Páginas sin texto extraíble: ' + ', '.join(map(str, empty)) + '. Revisa si requieren OCR.')
        warnings.append('El orden de lectura, las columnas y las tablas del PDF requieren comprobación visual.')
    if res['format'] == 'docx':
        warnings.append('Se extraen párrafos y tablas del cuerpo. Notas, imágenes, encabezados y cuadros de texto pueden quedar fuera.')
    res['extraction'] = {'format': res['format'], 'pages': res.get('pages', []), 'warnings': warnings,
                         'coverage': 'La cobertura se refiere al texto extraído; comprueba su integridad frente al original.'}
    res["filename"] = filename
    return res
