"""
Generador de informes de auditoría y exportación de documentos Word (.docx)
con resaltado y comentarios de huellas de IA.
"""

import io
from typing import Dict, Any
import docx
from docx.shared import RGBColor, Pt
from docx.enum.text import WD_COLOR_INDEX


def export_annotated_docx(analysis_result: Dict[str, Any]) -> bytes:
    """
    Crea un nuevo documento Word con las oraciones coloreadas según su nivel de riesgo
    y un apartado final con las sugerencias para eliminar huellas.
    """
    doc = docx.Document()

    # Título del reporte
    doc.add_heading("Reporte de Auditoría de Huellas de IA", level=0)

    # Resumen ejecutivo
    p_meta = doc.add_paragraph()
    p_meta.add_run(f"Veredicto: {analysis_result.get('verdict_badge', '')} - {analysis_result.get('classification', '')}\n").bold = True
    p_meta.add_run(f"Probabilidad Global de IA: {analysis_result.get('global_ai_percentage', 0)}%\n")
    p_meta.add_run(f"Total de Palabras: {analysis_result.get('total_words', 0)} | Oraciones: {analysis_result.get('total_sentences', 0)}\n")
    p_meta.add_run(f"🔴 Huellas Críticas: {analysis_result.get('high_risk_sentences', 0)} | 🟡 Huellas Medias: {analysis_result.get('medium_risk_sentences', 0)} | 🟢 Oraciones Humanas: {analysis_result.get('low_risk_sentences', 0)}\n")

    doc.add_heading("Texto Anotado con Huellas Detectadas", level=1)

    # Reconstruir párrafos con oraciones coloreadas
    current_p_idx = -1
    active_paragraph = None

    for s_info in analysis_result.get("sentences", []):
        p_idx = s_info.get("paragraph_idx", 0)
        if p_idx != current_p_idx:
            current_p_idx = p_idx
            active_paragraph = doc.add_paragraph()

        run = active_paragraph.add_run(s_info["text"] + " ")
        risk = s_info.get("risk_level", "low")

        if risk == "high":
            run.font.highlight_color = WD_COLOR_INDEX.PINK
        elif risk == "medium":
            run.font.highlight_color = WD_COLOR_INDEX.YELLOW

    # Sección de Recomendaciones de Humanización
    doc.add_heading("Plan de Acción para Quitar Huellas de IA", level=1)
    doc.add_paragraph("A continuación se detallan las oraciones con mayor índice de predictibilidad y sus sugerencias de reescritura:")

    for s_info in analysis_result.get("sentences", []):
        risk = s_info.get("risk_level", "low")
        if risk in ["high", "medium"]:
            p_rec = doc.add_paragraph()
            prefix = "🔴 [ALTO]" if risk == "high" else "🟡 [MEDIO]"
            p_rec.add_run(f"{prefix} Oración: \"{s_info['text']}\"\n").bold = True
            for reason in s_info.get("reasons", []):
                p_rec.add_run(f"  • Diagnóstico: {reason}\n")

            sugg = s_info.get("suggestions", {})
            for tip in sugg.get("tips", []):
                p_rec.add_run(f"  ✓ Recomendación: {tip}\n")

            if sugg.get("suggested_rewrite"):
                p_rec.add_run(f"  ➜ Propuesta de reescritura: \"{sugg['suggested_rewrite']}\"\n").italic = True

    out_stream = io.BytesIO()
    doc.save(out_stream)
    return out_stream.getvalue()


def export_markdown_report(analysis_result: Dict[str, Any]) -> str:
    """Genera un informe completo en formato Markdown."""
    lines = [
        "# Auditoría de Detección de Huellas de IA",
        "",
        f"- **Veredicto:** {analysis_result.get('verdict_badge')} {analysis_result.get('classification')}",
        f"- **Probabilidad de IA:** {analysis_result.get('global_ai_percentage')}%",
        f"- **Palabras analizadas:** {analysis_result.get('total_words')}",
        f"- **Oraciones analizadas:** {analysis_result.get('total_sentences')}",
        f"- **Oraciones en Rojo (Alta IA):** {analysis_result.get('high_risk_sentences')}",
        f"- **Oraciones en Amarillo (Riesgo medio):** {analysis_result.get('medium_risk_sentences')}",
        f"- **Oraciones en Verde (Humano):** {analysis_result.get('low_risk_sentences')}",
        "",
        "## Detalle de Oraciones Marcadas y Guía de Reescritura",
        ""
    ]

    for s in analysis_result.get("sentences", []):
        if s.get("risk_level") in ["high", "medium"]:
            risk_icon = "🔴" if s["risk_level"] == "high" else "🟡"
            lines.append(f"### {risk_icon} Oración ({s['risk_level'].upper()})")
            lines.append(f"> \"{s['text']}\"")
            lines.append("")
            lines.append(f"- **Perplejidad:** `{s['perplexity']}` | **Score IA:** `{int(s['ai_score']*100)}%`")
            for r in s.get("reasons", []):
                lines.append(f"- **Motivo:** {r}")
            sugg = s.get("suggestions", {})
            for tip in sugg.get("tips", []):
                lines.append(f"- **Acción sugerida:** {tip}")
            if sugg.get("suggested_rewrite"):
                lines.append(f"- **Propuesta alternativa:** *\"{sugg['suggested_rewrite']}\"*")
            lines.append("")

    return "\n".join(lines)
