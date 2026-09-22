"""
Zero-IA: Plataforma Minimalista de Auditoría y Detección de Huellas de IA
Diseño de alto nivel para Trabajos de Fin de Máster y Publicaciones Académicas.
"""

import streamlit as st
import plotly.graph_objects as go
import io

from core.document_parser import parse_document
from core.detector import AIDetector
from export.report_generator import export_annotated_docx, export_markdown_report

# Configuración de página minimalista
st.set_page_config(
    page_title="Zero-IA | Validador Académico",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Estética CSS de Alto Nivel (Minimalista, Editorial, Académica)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #0f172a;
        background-color: #fcfcfd;
    }

    /* Ocultar elementos sobrantes de Streamlit */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Contenedor principal estilizado */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1400px;
    }

    /* Encabezado */
    .header-title {
        font-size: 2.1rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: #090d16;
        margin-bottom: 0.2rem;
    }
    .header-subtitle {
        font-size: 0.98rem;
        color: #64748b;
        margin-bottom: 1.8rem;
    }

    /* Hero Metric Box */
    .hero-metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }
    .hero-stat-label {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        color: #64748b;
    }
    .hero-stat-value {
        font-size: 2.4rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
        margin-top: 4px;
    }

    /* Indicadores de riesgo sutiles */
    .score-high { color: #dc2626; }
    .score-med { color: #d97706; }
    .score-low { color: #16a34a; }

    /* Visor de Documento tipo Manuscrito */
    .paper-viewer {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 32px 36px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        font-family: 'Newsreader', Georgia, serif;
        font-size: 1.14rem;
        line-height: 2.0;
        color: #1e293b;
        max-height: 720px;
        overflow-y: auto;
    }

    /* Resaltados elegantes y minimalistas */
    .hl-ai-high {
        background-color: #fee2e2;
        border-bottom: 2px solid #ef4444;
        color: #991b1b;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    .hl-ai-high:hover {
        background-color: #fecaca;
    }

    .hl-ai-med {
        background-color: #fef3c7;
        border-bottom: 2px solid #f59e0b;
        color: #92400e;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    .hl-ai-med:hover {
        background-color: #fde68a;
    }

    .hl-ai-low {
        color: #1e293b;
    }

    /* Tarjetas de auditoría lateral */
    .audit-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 12px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .audit-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .pill-badge {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 9999px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
    .pill-high { background: #fee2e2; color: #b91c1c; }
    .pill-med { background: #fef3c7; color: #b45309; }
    .pill-low { background: #dcfce7; color: #15803d; }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_detector():
    return AIDetector(use_transformers=True, model_name="gpt2")


detector = get_detector()

# Barra Superior / Brand Minimalista
col_h1, col_h2 = st.columns([0.7, 0.3])
with col_h1:
    st.markdown('<div class="header-title">Zero-IA <span style="font-size: 0.95rem; font-weight: 500; color: #64748b; margin-left: 8px;">Validador Académico</span></div>', unsafe_allow_html=True)
    st.markdown('<div class="header-subtitle">Detección y señalización precisa de huellas sintéticas para TFM, Tesis y Artículos.</div>', unsafe_allow_html=True)

with col_h2:
    st.markdown("<div style='text-align: right; padding-top: 10px;'><span style='background:#f1f5f9; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight:600; color:#475569;'>Motor Local Privado</span></div>", unsafe_allow_html=True)

# Sección de Entrada Limpia
with st.expander("📥 Cargar Documento o Pegar Texto", expanded=("analysis" not in st.session_state)):
    tab_doc, tab_direct = st.tabs(["📄 Archivo Word (.docx) o PDF (.pdf)", "✏️ Pegar Texto"])

    uploaded_doc_text = ""
    doc_name = "Manuscrito"

    with tab_doc:
        uploaded_file = st.file_uploader(
            "Arrastra tu archivo aquí:",
            type=["docx", "pdf", "txt"],
            label_visibility="collapsed"
        )
        if uploaded_file is not None:
            try:
                parsed = parse_document(uploaded_file.getvalue(), uploaded_file.name)
                uploaded_doc_text = parsed["full_text"]
                doc_name = uploaded_file.name
                st.caption(f"✓ **{uploaded_file.name}** cargado ({parsed['word_count']} palabras detectadas).")
            except Exception as e:
                st.error(f"Error al leer archivo: {e}")

    with tab_direct:
        pasted_input = st.text_area(
            "Pega aquí el fragmento a validar:",
            height=140,
            label_visibility="collapsed",
            placeholder="Pega aquí el texto de tu tesis, capítulo o artículo para detectar huellas..."
        )
        if pasted_input.strip():
            uploaded_doc_text = pasted_input
            doc_name = "Texto Pegado"

    col_btn, col_sample = st.columns([0.3, 0.7])
    with col_btn:
        run_analysis = st.button("Analizar Documento", type="primary", use_container_width=True)
    with col_sample:
        if st.button("Cargar Texto de Ejemplo para Probar", type="secondary"):
            uploaded_doc_text = (
                "En el ámbito de la inteligencia artificial, es importante destacar que los modelos de lenguaje desempeñan un papel crucial. "
                "En el panorama actual, estas tecnologías transforman la investigación de manera holística, eficiente y escalable. "
                "Durante los ensayos realizados en el laboratorio en octubre de 2023, observamos ciertas variaciones manuales. "
                "En conclusión, el desarrollo tecnológico constituye una piedra angular para las futuras generaciones."
            )
            doc_name = "Muestra de Prueba"
            run_analysis = True

    if run_analysis:
        if not uploaded_doc_text or len(uploaded_doc_text.strip()) < 25:
            st.warning("Introduce un texto con al menos 25 caracteres.")
        else:
            with st.spinner("Analizando perplejidad, ráfaga sintáctica y huellas discursivas..."):
                st.session_state["analysis"] = detector.analyze_document(uploaded_doc_text)
                st.session_state["doc_name"] = doc_name
                st.session_state["raw_text"] = uploaded_doc_text


# Panel Principal de Resultados (Si hay análisis)
if "analysis" in st.session_state:
    res = st.session_state["analysis"]
    ai_pct = res["global_ai_percentage"]
    d_name = st.session_state.get("doc_name", "Documento")

    # Determinar estilo según severidad
    if ai_pct >= 60:
        score_class = "score-high"
        verdict_text = "Huella de IA Elevada"
        verdict_sub = "Se detectó un patrón de redacción predominantemente generado por IA."
    elif ai_pct >= 30:
        score_class = "score-med"
        verdict_text = "Texto Mixto / Posible Asistencia de IA"
        verdict_sub = "Partes del texto presentan alta uniformidad o frases cliché de modelos LLM."
    else:
        score_class = "score-low"
        verdict_text = "Autoría Natural / Humana"
        verdict_sub = "El texto presenta ritmo variado, riqueza léxica y ausencia de muletillas de IA."

    # Hero Metrics Card
    st.markdown(f"""
    <div class="hero-metric-card">
        <div>
            <div class="hero-stat-label">Probabilidad Global de IA</div>
            <div class="hero-stat-value {score_class}">{ai_pct}%</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #1e293b; margin-top: 4px;">{verdict_text}</div>
            <div style="font-size: 0.82rem; color: #64748b;">{verdict_sub}</div>
        </div>
        <div style="display: flex; gap: 32px; text-align: right;">
            <div>
                <div class="hero-stat-label">Total Oraciones</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">{res['total_sentences']}</div>
                <div style="font-size: 0.78rem; color: #64748b;">{res['total_words']} palabras</div>
            </div>
            <div>
                <div class="hero-stat-label">Señaladas en Rojo</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">{res['high_risk_sentences']}</div>
                <div style="font-size: 0.78rem; color: #64748b;">Alta probabilidad IA</div>
            </div>
            <div>
                <div class="hero-stat-label">Señaladas en Amarillo</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #d97706;">{res['medium_risk_sentences']}</div>
                <div style="font-size: 0.78rem; color: #64748b;">Sospechosas</div>
            </div>
            <div>
                <div class="hero-stat-label">Naturales (Verde)</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #16a34a;">{res['low_risk_sentences']}</div>
                <div style="font-size: 0.78rem; color: #64748b;">Estilo orgánico</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Layout en 2 Columnas: Izquierda Visor (62%) | Derecha Auditoría y Sugerencias (38%)
    col_viewer, col_audit = st.columns([0.62, 0.38], gap="large")

    with col_viewer:
        st.markdown(f"**Visor del Manuscrito** · *{d_name}*", help="Cada oración está señalada según su probabilidad de IA. Pasa el ratón sobre cualquier frase para ver su índice individual.")

        # Construir el HTML del Visor Editorial
        paper_html = ""
        current_p = -1

        for s in res["sentences"]:
            if s["paragraph_idx"] != current_p:
                if current_p != -1:
                    paper_html += "</p><p style='margin-bottom: 1.2rem;'>"
                else:
                    paper_html += "<p style='margin-bottom: 1.2rem;'>"
                current_p = s["paragraph_idx"]

            risk = s["risk_level"]
            cls_name = "hl-ai-high" if risk == "high" else "hl-ai-med" if risk == "medium" else "hl-ai-low"
            reason_tooltip = f"Riesgo: {int(s['ai_score']*100)}% IA | Perplejidad: {s['perplexity']} | {' ; '.join(s['reasons'])}"

            paper_html += f"<span class='{cls_name}' title='{reason_tooltip}'>{s['text']}</span> "

        paper_html += "</p>"

        st.markdown(f'<div class="paper-viewer">{paper_html}</div>', unsafe_allow_html=True)

        # Barra inferior de exportación
        st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)
        exp_col1, exp_col2 = st.columns(2)
        docx_bytes = export_annotated_docx(res)
        with exp_col1:
            st.download_button(
                label="Descargar Word (.docx) Anotado",
                data=docx_bytes,
                file_name=f"ZeroIA_{d_name}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True
            )
        with exp_col2:
            md_report = export_markdown_report(res)
            st.download_button(
                label="Descargar Reporte de Auditoría (.md)",
                data=md_report,
                file_name=f"Auditoria_{d_name}.md",
                mime="text/markdown",
                use_container_width=True
            )

    with col_audit:
        tab_cards, tab_live_edit = st.tabs(["📋 Huellas Señaladas", "✏️ Editor en Vivo (Humanizar)"])

        with tab_cards:
            # Filtro de severidad
            filter_opt = st.segmented_control(
                "Filtrar:",
                options=["Todas las Huellas", "Solo Críticas (Rojo)", "Revisión (Amarillo)"],
                default="Todas las Huellas",
                label_visibility="collapsed"
            )

            flagged = [s for s in res["sentences"] if s["risk_level"] in ["high", "medium"]]
            if filter_opt == "Solo Críticas (Rojo)":
                flagged = [s for s in flagged if s["risk_level"] == "high"]
            elif filter_opt == "Revisión (Amarillo)":
                flagged = [s for s in flagged if s["risk_level"] == "medium"]

            if not flagged:
                st.success("No se encontraron oraciones con este nivel de alerta. El texto es estilísticamente limpio.")
            else:
                st.caption(f"Mostrando **{len(flagged)}** oraciones que contienen patrones detectables de IA:")

                for idx, s in enumerate(flagged):
                    pill_class = "pill-high" if s["risk_level"] == "high" else "pill-med"
                    pill_label = f"{int(s['ai_score']*100)}% IA"

                    with st.expander(f"Frase {s['sentence_idx']+1} (Párrafo {s['paragraph_idx']+1}) · {pill_label}", expanded=(idx == 0)):
                        st.markdown(f"<span class='pill-badge {pill_class}'>{pill_label}</span> <span style='font-size: 0.8rem; color:#64748b;'>Perplejidad: {s['perplexity']} | {s['word_count']} palabras</span>", unsafe_allow_html=True)
                        st.markdown(f"<div style='font-size: 0.95rem; font-style: italic; color:#334155; margin: 8px 0; background:#f8fafc; padding:10px; border-radius:6px;'>\"{s['text']}\"</div>", unsafe_allow_html=True)

                        st.markdown("<div style='font-size: 0.82rem; font-weight:600; color:#475569;'>¿POR QUÉ FUE SEÑALADA?</div>", unsafe_allow_html=True)
                        for r in s["reasons"]:
                            st.markdown(f"<div style='font-size: 0.84rem; color: #dc2626;'>• {r}</div>", unsafe_allow_html=True)

                        sugg = s.get("suggestions", {})
                        if sugg.get("tips"):
                            st.markdown("<div style='font-size: 0.82rem; font-weight:600; color:#475569; margin-top:8px;'>CÓMO QUITAR LA HUELLA:</div>", unsafe_allow_html=True)
                            for t in sugg["tips"]:
                                st.markdown(f"<div style='font-size: 0.84rem; color: #1e293b;'>✓ {t}</div>", unsafe_allow_html=True)

                        if sugg.get("suggested_rewrite"):
                            st.markdown("<div style='font-size: 0.82rem; font-weight:600; color:#0d9488; margin-top:8px;'>PROPUESTA DE REESCRITURA NATURAL:</div>", unsafe_allow_html=True)
                            st.markdown(f"<div style='background: #f0fdfa; border: 1px solid #ccfbf1; padding: 10px; border-radius: 6px; font-size: 0.9rem; color: #115e59; font-weight: 500;'>\"{sugg['suggested_rewrite']}\"</div>", unsafe_allow_html=True)

        with tab_live_edit:
            st.markdown("<div style='font-size: 0.88rem; color: #475569; margin-bottom: 8px;'>Edita el texto a continuación aplicando las sugerencias para eliminar las huellas de IA y comprueba el nuevo porcentaje:</div>", unsafe_allow_html=True)
            edited_text = st.text_area(
                "Editor de Humanización:",
                value=st.session_state.get("raw_text", ""),
                height=380,
                label_visibility="collapsed"
            )
            if st.button("🔄 Recalcular % de IA del Texto Editado", type="primary", use_container_width=True):
                with st.spinner("Reevaluando métricas y perplejidad del texto editado..."):
                    st.session_state["analysis"] = detector.analyze_document(edited_text)
                    st.session_state["raw_text"] = edited_text
                    st.rerun()
