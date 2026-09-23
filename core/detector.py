"""
Orquestador central del detector de huellas de IA.
Integra Perplejidad, Burstiness, Estilometría y Heurísticas de LLM para calificar
cada oración y el documento completo con explicaciones transparentes.
"""

from typing import Dict, Any, List
import numpy as np

from core.academic_review import academic_review
from core.sentence_tokenizer import split_into_sentences, split_into_paragraphs
from core.perplexity_engine import PerplexityEngine
from core.stylometrics import analyze_stylometrics, clean_words
from core.llm_heuristics import detect_cliches_in_sentence, analyze_document_heuristics
from humanizer.suggestion_engine import generate_suggestions_for_sentence


class AIDetector:
    def __init__(self, use_transformers: bool = True, model_name: str = "gpt2"):
        self.perplexity_engine = PerplexityEngine(
            use_transformers=use_transformers,
            model_name=model_name
        )

    def analyze_document(self, raw_text: str) -> Dict[str, Any]:
        """
        Ejecuta el análisis completo del documento de texto.
        """
        if not raw_text or not clean_words(raw_text):
            return {
                "error": "El documento está vacío.",
                "ai_score": 0.0,
                "classification": "Sin contenido",
                "sentences": []
            }

        # Separar bibliografía para no distorsionar métricas de estilo y perplejidad
        from core.academic_review import split_bibliography
        body_text, bib_text, has_bib = split_bibliography(raw_text)
        analysis_text = body_text if (has_bib and clean_words(body_text)) else raw_text

        paragraphs = split_into_paragraphs(analysis_text)
        all_sentences: List[str] = []
        structured_info: List[Dict[str, Any]] = []

        for p_idx, p in enumerate(paragraphs):
            s_list = split_into_sentences(p)
            for s_idx, s in enumerate(s_list):
                all_sentences.append(s)
                structured_info.append({
                    "paragraph_idx": p_idx,
                    "sentence_idx": s_idx,
                    "text": s,
                    "is_bibliography": False
                })

        # Si hay bibliografía, registrar sus párrafos sin mezclarlos en el análisis de IA
        if has_bib and bib_text.strip():
            bib_paragraphs = split_into_paragraphs(bib_text)
            start_p_idx = len(paragraphs)
            for bp_idx, bp in enumerate(bib_paragraphs):
                structured_info.append({
                    "paragraph_idx": start_p_idx + bp_idx,
                    "sentence_idx": 0,
                    "text": bp,
                    "is_bibliography": True
                })

        if not all_sentences:
            return {
                "error": "No se encontraron oraciones legibles en el cuerpo del documento.",
                "ai_score": 0.0,
                "classification": "Sin oraciones",
                "sentences": []
            }

        # 1. Perplejidad y Burstiness sobre el cuerpo del documento
        ppl_result = self.perplexity_engine.analyze_document(all_sentences)
        sentence_ppls = ppl_result["sentence_perplexities"]
        mean_ppl = ppl_result["mean_perplexity"]
        burstiness = ppl_result["burstiness"]

        # 2. Estilometría y Monotonía
        stylo_result = analyze_stylometrics(all_sentences, raw_text)
        monotony = stylo_result["monotony_score"]
        ttr = stylo_result["type_token_ratio"]

        # 3. Heurísticas de LLM (Clichés y muletillas)
        heuristics_result = analyze_document_heuristics(all_sentences)

        # 4. Evaluación individual por oración
        analyzed_sentences = []
        high_risk_count = 0
        medium_risk_count = 0

        for i, item in enumerate(structured_info):
            s_text = item["text"]
            words = clean_words(s_text)
            w_len = len(words)

            if item.get("is_bibliography"):
                analyzed_sentences.append({
                    "paragraph_idx": item["paragraph_idx"],
                    "sentence_idx": item["sentence_idx"],
                    "text": s_text,
                    "word_count": w_len,
                    "perplexity": 100.0,
                    "cliches": [],
                    "ai_score": 0.0,
                    "risk_level": "low",
                    "is_bibliography": True,
                    "reasons": ["Entrada bibliográfica: excluida del análisis de estilo."],
                    "suggestions": {"original": s_text, "risk_level": "low", "tips": [], "suggested_rewrite": None}
                })
                continue

            ppl = sentence_ppls[i] if i < len(sentence_ppls) else 50.0

            # Detección de clichés en esta oración
            cliches = detect_cliches_in_sentence(s_text)

            # Cálculo de score de IA por oración (0.0 a 1.0)
            sentence_score = 0.0
            reasons = []

            # Factor A: Perplejidad
            if ppl < 35.0:
                sentence_score += 0.50
                reasons.append(f"Perplejidad muy baja ({ppl}): redacción altamente predecible para un modelo de lenguaje.")
            elif ppl < 55.0:
                sentence_score += 0.30
                reasons.append(f"Perplejidad moderadamente baja ({ppl}).")
            elif ppl > 85.0:
                sentence_score -= 0.20

            # Factor B: Clichés de IA
            if cliches:
                sentence_score += min(0.40, len(cliches) * 0.25)
                for c in cliches:
                    reasons.append(f"Huella detectada: {c['match']}.")

            # Factor C: Monotonía sintáctica (si está cerca de la longitud media sin variación)
            mean_len = stylo_result["sentence_length"]["mean"]
            if mean_len > 0 and abs(w_len - mean_len) < 3 and w_len > 12:
                sentence_score += 0.15
                reasons.append("Longitud próxima a la media; señal descriptiva, no evidencia de autoría.")

            # Normalizar score entre 0 y 1
            sentence_score = max(0.0, min(1.0, sentence_score))

            # Clasificación de riesgo
            if sentence_score >= 0.55 or len(cliches) >= 2:
                risk = "high"  # Rojo
                high_risk_count += 1
            elif sentence_score >= 0.30 or len(cliches) == 1:
                risk = "medium"  # Amarillo
                medium_risk_count += 1
            else:
                risk = "low"  # Verde
                if not reasons:
                    reasons.append("No se observaron señales destacadas con estas reglas.")

            # Sugerencias de humanización
            suggestions = generate_suggestions_for_sentence(
                sentence=s_text,
                risk_level=risk,
                perplexity=ppl,
                length_words=w_len,
                cliches=cliches
            )

            analyzed_sentences.append({
                "paragraph_idx": item["paragraph_idx"],
                "sentence_idx": item["sentence_idx"],
                "text": s_text,
                "word_count": w_len,
                "perplexity": ppl,
                "cliches": cliches,
                "ai_score": round(sentence_score, 2),
                "risk_level": risk,
                "reasons": reasons,
                "suggestions": suggestions
            })

        # 5. Puntuación Global del Documento (0% a 100%)
        total_s = len(all_sentences)
        pct_high = (high_risk_count / total_s)
        pct_med = (medium_risk_count / total_s)

        raw_global_score = (pct_high * 0.7) + (pct_med * 0.3) + (monotony * 0.2) + (heuristics_result["density_score"] * 0.2)
        if mean_ppl < 45.0:
            raw_global_score += 0.20
        elif mean_ppl > 80.0:
            raw_global_score -= 0.15

        if burstiness < 15.0:
            raw_global_score += 0.10
        elif burstiness > 35.0:
            raw_global_score -= 0.10

        # 6. Detección forense independiente de marcas de agua invisibles (no altera artificialmente el score de estilo)
        from core.watermark_detector import detect_invisible_watermarks
        watermark_result = detect_invisible_watermarks(raw_text)

        global_ai_score = round(max(0.0, min(1.0, raw_global_score)) * 100, 1)

        # 7. Veredicto Heurístico Descriptivo (no calibrado)
        if global_ai_score >= 65.0:
            classification = "Alta concentración de señales de estilo"
            verdict_badge = "🔴 ALTA CONCENTRACIÓN"
            verdict_summary = (
                f"El análisis heurístico identificó una concentración elevada de patrones sintéticos ({global_ai_score}%), "
                f"con baja perplejidad ({mean_ppl:.1f}), cadencia uniforme y {high_risk_count} oraciones críticas. "
                "Este índice es orientativo y no constituye una prueba concluyente de autoría."
            )
        elif global_ai_score >= 35.0:
            classification = "Concentración media de señales de estilo"
            verdict_badge = "🟡 CONCENTRACIÓN MEDIA"
            verdict_summary = (
                f"El texto presenta una combinación de pasajes con ritmo variado y secciones con estructuras sintácticas homogéneas o frases formulaicas ({global_ai_score}%). "
                "Se recomienda una revisión cualitativa de las oraciones señaladas."
            )
        else:
            classification = "Baja concentración de señales de estilo"
            verdict_badge = "🟢 POCAS SEÑALES"
            verdict_summary = (
                f"El documento muestra diversidad léxica, variabilidad rítmica natural ({burstiness:.1f} de ráfaga) "
                f"y baja presencia de fórmulas fijas de IA ({global_ai_score}%). "
                "Nota: La ausencia de señales no garantiza autoría humana, solo indica estilo variado según estas reglas heurísticas."
            )

        if watermark_result["has_watermark"]:
            verdict_summary += f" ⚠️ AVISO: Se detectaron {watermark_result['total_invisible_chars']} caracteres invisibles de ancho cero."

        return {
            "academic_review": academic_review(raw_text),
            "watermark_analysis": watermark_result,
            "score_kind": "uncalibrated_heuristic",
            "global_ai_percentage": global_ai_score,
            "classification": classification,
            "verdict_badge": verdict_badge,
            "verdict_summary": verdict_summary,
            "total_sentences": total_s,
            "total_words": stylo_result["total_words"],
            "high_risk_sentences": high_risk_count,
            "medium_risk_sentences": medium_risk_count,
            "low_risk_sentences": total_s - (high_risk_count + medium_risk_count),
            "perplexity_metrics": ppl_result,
            "stylometrics": stylo_result,
            "heuristics": heuristics_result,
            "sentences": analyzed_sentences,
            "paragraphs": paragraphs
        }
