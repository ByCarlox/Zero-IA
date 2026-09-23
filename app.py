from html import escape
from core.academic_review import academic_summary
"""
Zero-IA: Plataforma Avanzada de Auditoría, Detección y Mitigación de Huellas de IA
Diseño de alto nivel para Evaluación Académica, TFM y Publicaciones Científicas.
"""

import streamlit as st
import plotly.graph_objects as go
import io

from core.document_parser import parse_document
from core.detector import AIDetector
from export.report_generator import export_annotated_docx, export_markdown_report

# Configuración de página
st.set_page_config(
    page_title="Zero-IA · Academic AI Footprint Auditor",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Estética UI Premium Moderna
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #0f172a;
        background-color: #f8fafc;
    }

    /* Ocultar elementos innecesarios de Streamlit */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    .block-container {
        padding-top: 1.5rem;
        padding-bottom: 2.5rem;
        max-width: 1440px;
    }

    /* Barra Superior Premium */
    .top-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 14px 24px;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .brand-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .brand-icon {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #ffffff;
        font-weight: 800;
        font-size: 1.1rem;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .brand-title {
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: #090d16;
        line-height: 1.1;
    }
    .brand-sub {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 500;
    }
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 20px;
    }
    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    /* Tarjetas de Entrada */
    .input-section-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px 24px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        margin-bottom: 1.5rem;
    }

    /* Dashboard de Métricas */
    .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 1.5rem;
    }
    .metric-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px 20px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .metric-box::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
    }
    .border-danger::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .border-warning::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .border-success::before { background: linear-gradient(90deg, #10b981, #059669); }
    .border-primary::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }

    .metric-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #64748b;
        margin-bottom: 6px;
    }
    .metric-value {
        font-size: 2.1rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
        color: #0f172a;
    }
    .metric-desc {
        font-size: 0.78rem;
        color: #64748b;
        margin-top: 6px;
    }

    /* Hoja de Documento Académico */
    .document-sheet {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 36px 44px;
        box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
        font-family: 'Newsreader', Georgia, serif;
        font-size: 1.18rem;
        line-height: 2.1;
        color: #1e293b;
        max-height: 740px;
        overflow-y: auto;
    }

    /* Resaltadores Visuales */
    .hl-critical {
        background: rgba(239, 68, 68, 0.16);
        border-bottom: 2.5px solid #dc2626;
        color: #991b1b;
        padding: 2px 5px;
        border-radius: 4px;
        transition: all 0.2s ease;
        cursor: pointer;
    }
    .hl-critical:hover {
        background: rgba(239, 68, 68, 0.28);
    }

    .hl-warning {
        background: rgba(245, 158, 11, 0.18);
        border-bottom: 2.5px solid #d97706;
        color: #92400e;
        padding: 2px 5px;
        border-radius: 4px;
        transition: all 0.2s ease;
        cursor: pointer;
    }
    .hl-warning:hover {
        background: rgba(245, 158, 11, 0.3);
    }

    .hl-clean {
        color: #1e293b;
    }

    /* Tarjetas de Acción de Humanización */
    .action-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .action-card:hover {
        border-color: #cbd5e1;
        transform: translateY(-1px);
    }
    .chip-badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        display: inline-block;
    }
    .chip-red { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .chip-yellow { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
    .chip-green { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

    .diff-original {
        background: #fff5f5;
        border-left: 3px solid #ef4444;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 0.92rem;
        color: #7f1d1d;
        margin: 8px 0;
        font-style: italic;
    }
    .diff-suggestion {
        background: #f0fdf4;
        border-left: 3px solid #10b981;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 0.92rem;
        color: #14532d;
        margin: 8px 0;
        font-weight: 500;
    }

    /* Estilo del botón principal */
    div.stButton > button:first-child {
        font-weight: 600;
        border-radius: 10px;
        padding: 0.6rem 1.2rem;
        transition: all 0.2s ease;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_detector():
    return AIDetector(use_transformers=False, model_name="gpt2")


detector = get_detector()

# Barra Superior
st.markdown("""
<div class="top-navbar">
    <div class="brand-group">
        <div class="brand-icon">Z</div>
        <div>
            <div class="brand-title">Zero-IA</div>
            <div class="brand-sub">Academic Footprint Validator & Content Humanizer</div>
        </div>
    </div>
    <div class="status-badge">
        <div class="status-dot"></div>
        Motor heurístico de estilo · no certifica autoría
    </div>
</div>
""", unsafe_allow_html=True)

# Sección de Carga con diseño card
with st.expander("📂 Ingesta de Documentos (Word / PDF / Texto)", expanded=("analysis" not in st.session_state)):
    tab_doc, tab_paste = st.tabs(["📄 Cargar Archivo .docx / .pdf", "✏️ Pegar Manuscrito"])

    doc_text = ""
    doc_label = "Manuscrito Académico"

    with tab_doc:
        up_file = st.file_uploader(
            "Selecciona tu trabajo de máster o tesis:",
            type=["docx", "pdf", "txt"],
            label_visibility="collapsed"
        )
        if up_file:
            try:
                parsed = parse_document(up_file.getvalue(), up_file.name)
                doc_text = parsed["full_text"]
                doc_label = up_file.name
                st.success(f"Documento cargado correctamente: **{up_file.name}** ({parsed['word_count']} palabras detectadas).")
            except Exception as e:
                st.error(f"Error en extracción: {e}")

    with tab_paste:
        direct_text = st.text_area(
            "Texto directo:",
            height=130,
            label_visibility="collapsed",
            placeholder="Pega aquí el contenido de tu sección, capítulo o artículo científico..."
        )
        if direct_text.strip():
            doc_text = direct_text
            doc_label = "Texto Directo"

    c_btn1, c_btn2 = st.columns([0.35, 0.65])
    with c_btn1:
        trigger_audit = st.button("🚀 Ejecutar Auditoría Completa", type="primary", use_container_width=True)
    with c_btn2:
        if st.button("🧪 Cargar Muestra Demostrativa de IA", type="secondary"):
            doc_text = (
                "En el ámbito de la inteligencia artificial, es importante destacar que los modelos de lenguaje desempeñan un papel crucial. "
                "En el panorama actual, estas tecnologías transforman la investigación de manera holística, eficiente y escalable. "
                "Durante los ensayos realizados en el laboratorio en octubre de 2023, observamos ciertas variaciones manuales imprevistas. "
                "En conclusión, el desarrollo tecnológico constituye una piedra angular para las futuras generaciones académicas."
            )
            doc_label = "Muestra de Demostración"
            trigger_audit = True

    if trigger_audit:
        if not doc_text or len(doc_text.strip()) < 25:
            st.warning("Introduce al menos 25 caracteres para analizar.")
        else:
            with st.spinner("Analizando perplejidad, ráfaga, homogeneidad sintáctica y patrones de LLM..."):
                st.session_state["analysis"] = detector.analyze_document(doc_text)
                st.session_state["doc_name"] = doc_label
                st.session_state["raw_text"] = doc_text


# Render de Resultados
if "analysis" in st.session_state:
    res = st.session_state["analysis"]
    if res.get("error"):
        st.warning(res["error"])
        st.stop()
    st.info("Índice heurístico sin calibración: no representa una probabilidad de autoría por IA.")
    with st.expander("Legibilidad y coherencia de citas", expanded=True):
        st.text(academic_summary(res["academic_review"]))
    ai_score = res["global_ai_percentage"]
    d_title = st.session_state.get("doc_name", "Documento")

    # Clasificación y Estilos
    if ai_score >= 65:
        badge_style = "border-danger"
        verdict_color = "#dc2626"
        verdict_title = "Alta concentración de señales de estilo"
        verdict_desc = "Varias reglas de estilo se activaron; revisar su pertinencia."
    elif ai_score >= 35:
        badge_style = "border-warning"
        verdict_color = "#d97706"
        verdict_title = "Concentración media de señales de estilo"
        verdict_desc = "Algunas reglas de estilo se activaron."
    else:
        badge_style = "border-success"
        verdict_color = "#10b981"
        verdict_title = "Baja concentración de señales de estilo"
        verdict_desc = "Pocas señales según estas reglas; no permite inferir autoría."

    # 4 Tarjetas de Métricas Principales
    st.markdown(f"""
    <div class="metric-grid">
        <div class="metric-box {badge_style}">
            <div class="metric-label">Índice de estilo · no probabilidad</div>
            <div class="metric-value" style="color: {verdict_color};">{ai_score}/100</div>
            <div class="metric-desc"><b>{verdict_title}</b></div>
        </div>
        <div class="metric-box border-primary">
            <div class="metric-label">Índice léxico medio</div>
            <div class="metric-value">{res['perplexity_metrics']['mean_perplexity']}</div>
            <div class="metric-desc">Aproximación heurística; no perplejidad neuronal</div>
        </div>
        <div class="metric-box border-primary">
            <div class="metric-label">Ráfaga (Burstiness)</div>
            <div class="metric-value">{res['perplexity_metrics']['burstiness']}</div>
            <div class="metric-desc">Variabilidad de ritmo entre frases</div>
        </div>
        <div class="metric-box {badge_style}">
            <div class="metric-label">Huellas Críticas</div>
            <div class="metric-value">{res['high_risk_sentences']} <span style="font-size: 1.1rem; font-weight:500; color:#64748b;">/ {res['total_sentences']}</span></div>
            <div class="metric-desc">{round((res['high_risk_sentences']/max(1, res['total_sentences']))*100, 1)}% oraciones en riesgo alto</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Gráfico interactivo estilizado de Ráfaga / Índice léxico por Oración
    if res["sentences"] and len(res["sentences"]) > 1:
        with st.expander("📈 Curva de Ráfaga y Índice léxico Oración por Oración", expanded=False):
            sent_nums = [f"O{i+1}" for i in range(len(res["sentences"]))]
            ppls = [s["perplexity"] for s in res["sentences"]]
            bar_colors = ["#ef4444" if s["risk_level"] == "high" else "#f59e0b" if s["risk_level"] == "medium" else "#10b981" for s in res["sentences"]]

            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=sent_nums,
                y=ppls,
                marker=dict(color=bar_colors, opacity=0.85, line=dict(width=1, color="#e2e8f0")),
                name="Índice léxico",
                hovertemplate="Oración %{x}<br>Índice léxico: %{y}<extra></extra>"
            ))
            fig.update_layout(
                paper_bgcolor="#ffffff",
                plot_bgcolor="#fafafa",
                height=260,
                margin=dict(l=30, r=30, t=20, b=30),
                xaxis=dict(showgrid=False),
                yaxis=dict(showgrid=True, gridcolor="#f1f5f9"),
                font=dict(family="Inter, sans-serif", size=12, color="#475569")
            )
            st.plotly_chart(fig, use_container_width=True)

    # Vista Dividida: Documento a la Izquierda (60%) | Panel de Humanización a la Derecha (40%)
    col_left, col_right = st.columns([0.60, 0.40], gap="large")

    with col_left:
        st.markdown(f"**Manuscrito Anotado** · *{d_title}*")

        # Construcción del visor de documento
        doc_html = ""
        last_pid = -1

        for s in res["sentences"]:
            if s["paragraph_idx"] != last_pid:
                if last_pid != -1:
                    doc_html += "</p><p style='margin-bottom: 1.3rem;'>"
                else:
                    doc_html += "<p style='margin-bottom: 1.3rem;'>"
                last_pid = s["paragraph_idx"]

            r_level = s["risk_level"]
            cls = "hl-critical" if r_level == "high" else "hl-warning" if r_level == "medium" else "hl-clean"
            info = f"Estilo: {int(s['ai_score']*100)}% | PPL: {s['perplexity']} | {' ; '.join(s['reasons'])}"

            doc_html += f"<span class='{cls}' title='{escape(info, quote=True)}'>{escape(s['text'])}</span> "

        doc_html += "</p>"

        st.markdown(f'<div class="document-sheet">{doc_html}</div>', unsafe_allow_html=True)

        # Acciones de Exportación
        st.markdown("<div style='height: 14px;'></div>", unsafe_allow_html=True)
        col_d1, col_d2 = st.columns(2)
        docx_data = export_annotated_docx(res)
        with col_d1:
            st.download_button(
                label="📄 Descargar Word (.docx) Auditado",
                data=docx_data,
                file_name=f"ZeroIA_{d_title}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True
            )
        with col_d2:
            md_data = export_markdown_report(res)
            st.download_button(
                label="📑 Descargar Reporte Técnico (.md)",
                data=md_data,
                file_name=f"Informe_Auditoria_{d_title}.md",
                mime="text/markdown",
                use_container_width=True
            )

    with col_right:
        tab_suggestions, tab_editor = st.tabs(["💡 Plan de Mitigación de Huellas", "✍️ Editor de Humanización en Vivo"])

        with tab_suggestions:
            filter_mode = st.segmented_control(
                "Filtro:",
                options=["Todas las Huellas", "Críticas (Rojo)", "Revisión (Amarillo)"],
                default="Todas las Huellas",
                label_visibility="collapsed"
            )

            flagged_list = [s for s in res["sentences"] if s["risk_level"] in ["high", "medium"]]
            if filter_mode == "Críticas (Rojo)":
                flagged_list = [s for s in flagged_list if s["risk_level"] == "high"]
            elif filter_mode == "Revisión (Amarillo)":
                flagged_list = [s for s in flagged_list if s["risk_level"] == "medium"]

            if not flagged_list:
                st.success("✨ No existen oraciones con este nivel de alerta. El manuscrito mantiene un estilo natural y orgánico.")
            else:
                st.caption(f"Se identificaron **{len(flagged_list)}** oraciones con huellas detectables:")

                for idx, s in enumerate(flagged_list):
                    c_badge = "chip-red" if s["risk_level"] == "high" else "chip-yellow"
                    c_title = f"{int(s['ai_score']*100)}/100 estilo"

                    with st.expander(f"Frase #{s['sentence_idx']+1} (Párrafo {s['paragraph_idx']+1}) · {c_title}", expanded=(idx == 0)):
                        st.markdown(f"<span class='chip-badge {c_badge}'>{c_title}</span> <span style='font-size: 0.8rem; color:#64748b; margin-left:8px;'>Índice léxico: <b>{s['perplexity']}</b> · Longitud: <b>{s['word_count']} palabras</b></span>", unsafe_allow_html=True)

                        st.markdown(f'<div class="diff-original">"{escape(s["text"])}"</div>', unsafe_allow_html=True)

                        st.markdown("<div style='font-size: 0.78rem; font-weight:700; color:#475569; text-transform:uppercase;'>Diagnóstico Forense:</div>", unsafe_allow_html=True)
                        for r in s["reasons"]:
                            st.markdown(f"<div style='font-size: 0.84rem; color: #dc2626;'>• {escape(r)}</div>", unsafe_allow_html=True)

                        sugg = s.get("suggestions", {})
                        if sugg.get("tips"):
                            st.markdown("<div style='font-size: 0.78rem; font-weight:700; color:#475569; margin-top:8px; text-transform:uppercase;'>Estrategia para Eliminar la Huella:</div>", unsafe_allow_html=True)
                            for t in sugg["tips"]:
                                st.markdown(f"<div style='font-size: 0.84rem; color: #1e293b;'>✓ {escape(t)}</div>", unsafe_allow_html=True)

                        if sugg.get("suggested_rewrite"):
                            st.markdown("<div style='font-size: 0.78rem; font-weight:700; color:#059669; margin-top:8px; text-transform:uppercase;'>Propuesta de Reescritura Humana:</div>", unsafe_allow_html=True)
                            st.markdown(f'<div class="diff-suggestion">"{escape(sugg["suggested_rewrite"])}"</div>', unsafe_allow_html=True)

        with tab_editor:
            st.markdown("<div style='font-size: 0.86rem; color: #475569; margin-bottom: 6px;'>Aplica las sugerencias directamente sobre tu texto y pulsa el botón para re-evaluar la índice de estilo al instante:</div>", unsafe_allow_html=True)

            text_draft = st.text_area(
                "Editor interactivo:",
                value=st.session_state.get("raw_text", ""),
                height=420,
                label_visibility="collapsed"
            )

            if st.button("🔄 Recalcular Índice de estilo", type="primary", use_container_width=True):
                with st.spinner("Reevaluando métricas en tiempo real..."):
                    st.session_state["analysis"] = detector.analyze_document(text_draft)
                    st.session_state["raw_text"] = text_draft
                    st.rerun()
