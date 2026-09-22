"""
Plataforma Web Open Source de Validación, Detección y Humanización de Huellas de IA
para Trabajos Académicos, TFM y Tesis (Word, PDF y Texto).
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import io

from core.document_parser import parse_document
from core.detector import AIDetector
from export.report_generator import export_annotated_docx, export_markdown_report

# Configuración de página de Streamlit
st.set_page_config(
    page_title="Validador de Huellas de IA - TFM",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilos CSS personalizados para el mapa de calor y tarjetas
st.markdown("""
<style>
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 15px;
        border-left: 5px solid #0d6efd;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .badge-high {
        background-color: #ffebe9;
        color: #cf222e;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        border: 1px solid #ff8182;
    }
    .badge-med {
        background-color: #fff8c5;
        color: #9a6700;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        border: 1px solid #d4a72c;
    }
    .badge-low {
        background-color: #dafbe1;
        color: #1a7f37;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        border: 1px solid #4ac26b;
    }
    /* Resaltado de texto */
    .hl-high {
        background-color: #ffcccc;
        border-bottom: 2px solid #e03131;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        display: inline;
    }
    .hl-medium {
        background-color: #fff3bf;
        border-bottom: 2px solid #f59f00;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        display: inline;
    }
    .hl-low {
        background-color: transparent;
        padding: 2px 0;
        display: inline;
    }
    .sentence-box {
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 8px;
        background-color: #ffffff;
        border: 1px solid #e9ecef;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_detector():
    """Inicializa el detector en memoria caché para evitar recargas lentas."""
    return AIDetector(use_transformers=True, model_name="gpt2")


detector = get_detector()

# Encabezado principal
st.title("🛡️ Validador & Auditor de Huellas de IA")
st.caption("Herramienta Open Source colaborativa para detectar, señalar y eliminar huellas de IA en documentos académicos (.docx, .pdf y texto plano).")

# Sidebar: Configuración y Guía rápida
with st.sidebar:
    st.header("⚙️ Configuración")
    st.info(
        f"**Motor activo:** {'Transformers (Neuronal)' if detector.perplexity_engine.is_neural_active() else 'Estadístico Rápido (N-Gram)'}\n\n"
        "100% gratuito y ejecutado de forma local y privada."
    )
    st.markdown("---")
    st.subheader("📖 Código de Señalización")
    st.markdown("""
    - <span class="badge-high">🔴 Alta Huella de IA</span>: Oración con perplejidad muy baja, monotonía o clichés explícitos de ChatGPT.
    - <span class="badge-med">🟡 Sospechosa / Mixta</span>: Estructura repetitiva o frase que amerita revisión.
    - <span class="badge-low">🟢 Humana / Orgánica</span>: Variación léxica y ritmo natural.
    """, unsafe_allow_html=True)
    st.markdown("---")
    st.caption("Desarrollado para proyectos de Máster y Tesis. Uso libre para tu equipo.")

# Pestañas de entrada
tab_upload, tab_paste, tab_sample = st.tabs(["📁 Subir Documento (.docx / .pdf)", "✍️ Pegar Texto Directo", "🧪 Probar Muestras"])

input_text = ""
document_name = "documento"

with tab_upload:
    uploaded_file = st.file_uploader(
        "Arrastra o selecciona un archivo Word (.docx) o PDF (.pdf):",
        type=["docx", "pdf", "txt"]
    )
    if uploaded_file is not None:
        try:
            parsed = parse_document(uploaded_file.getvalue(), uploaded_file.name)
            input_text = parsed["full_text"]
            document_name = uploaded_file.name
            st.success(f"Archivo cargado con éxito: **{uploaded_file.name}** ({parsed['word_count']} palabras, {parsed['paragraph_count']} párrafos).")
        except Exception as e:
            st.error(f"Error al procesar el archivo: {e}")

with tab_paste:
    pasted_text = st.text_area(
        "Pega aquí el contenido de tu sección o artículo:",
        height=220,
        placeholder="Pega aquí el texto que deseas auditar para quitar huellas de IA..."
    )
    if pasted_text.strip():
        input_text = pasted_text
        document_name = "texto_pegado"

with tab_sample:
    st.markdown("Selecciona un ejemplo predefinido para probar la herramienta rápidamente:")
    col_s1, col_s2 = st.columns(2)
    with col_s1:
        if st.button("Ejemplo 1: Texto de ChatGPT (Con huellas marcadas)"):
            input_text = (
                "En el ámbito de la inteligencia artificial, es importante destacar que los modelos de lenguaje desempeñan un papel crucial. "
                "En el panorama actual, estas herramientas transforman la investigación científica de manera holística, eficiente y escalable. "
                "En conclusión, el desarrollo tecnológico constituye una piedra angular para las futuras generaciones."
            )
            document_name = "ejemplo_chatgpt"
    with col_s2:
        if st.button("Ejemplo 2: Redacción Humana Académica"):
            input_text = (
                "Durante los ensayos realizados en el laboratorio en octubre de 2023, observamos anomalías notables en la tasa de convergencia. "
                "¿A qué se debía esto? Principalmente a fluctuaciones imprevistas en los datos de entrada, tal como sugiere Gómez (2021). "
                "Pese a los ajustes manuales, el comportamiento persistió dos días más."
            )
            document_name = "ejemplo_humano"

# Botón de análisis
if st.button("🚀 Iniciar Auditoría de Huellas de IA", type="primary", use_container_width=True):
    if not input_text or len(input_text.strip()) < 30:
        st.warning("Por favor, introduce o sube un texto con al menos 30 caracteres para un análisis significativo.")
    else:
        with st.spinner("Analizando perplejidad, ráfaga sintáctica y huellas discursivas..."):
            st.session_state["analysis"] = detector.analyze_document(input_text)
            st.session_state["doc_name"] = document_name
            st.session_state["current_text"] = input_text

# Mostrar resultados si están en session_state
if "analysis" in st.session_state:
    res = st.session_state["analysis"]
    doc_n = st.session_state.get("doc_name", "documento")

    st.markdown("---")
    st.header("📊 Diagnóstico General del Documento")

    # Fila de métricas clave
    m_col1, m_col2, m_col3, m_col4 = st.columns(4)
    with m_col1:
        st.metric(
            label="Índice Global de IA",
            value=f"{res['global_ai_percentage']}%",
            delta=res['verdict_badge']
        )
    with m_col2:
        st.metric(
            label="Perplejidad Media",
            value=f"{res['perplexity_metrics']['mean_perplexity']}",
            help="Menor a 40 indica muy alta predictibilidad (IA). Mayor a 70 indica variedad humana."
        )
    with m_col3:
        st.metric(
            label="Ráfaga (Burstiness)",
            value=f"{res['perplexity_metrics']['burstiness']}",
            help="Variabilidad de perplejidad entre oraciones. Los humanos alternan mucho más este valor."
        )
    with m_col4:
        st.metric(
            label="Huellas Críticas (Rojo)",
            value=f"{res['high_risk_sentences']} de {res['total_sentences']} oraciones",
            delta=f"{(res['high_risk_sentences']/max(1, res['total_sentences'])*100):.1f}% del texto"
        )

    st.markdown(f"**Veredicto:** {res['verdict_badge']} — *{res['classification']}*")

    # Gráfico de distribución de perplejidad por oración
    if res["sentences"]:
        fig = go.Figure()
        sent_indices = list(range(1, len(res["sentences"]) + 1))
        ppl_vals = [s["perplexity"] for s in res["sentences"]]
        colors = ["#cf222e" if s["risk_level"] == "high" else "#d4a72c" if s["risk_level"] == "medium" else "#1a7f37" for s in res["sentences"]]

        fig.add_trace(go.Bar(
            x=sent_indices,
            y=ppl_vals,
            marker_color=colors,
            name="Perplejidad por Oración"
        ))
        fig.add_hline(y=40, line_dash="dash", line_color="#cf222e", annotation_text="Umbral de Alerta IA (<40)")
        fig.add_hline(y=70, line_dash="dash", line_color="#1a7f37", annotation_text="Umbral Estilo Humano (>70)")
        fig.update_layout(
            title="Distribución de Perplejidad por Oración (Ráfaga)",
            xaxis_title="Número de Oración",
            yaxis_title="Perplejidad (PPL)",
            height=300,
            margin=dict(l=20, r=20, t=40, b=20)
        )
        st.plotly_chart(fig, use_container_width=True)

    # Pestañas de detalle: Mapa de Calor y Asistente de Humanización
    st.subheader("🔍 Señalización de Huellas y Asistente para Eliminarlas")
    v_tab1, v_tab2, v_tab3 = st.tabs(["🗺️ Mapa Visual Resaltado", "🛠️ Asistente Oración por Oración", "📥 Exportar Reporte & Word"])

    with v_tab1:
        st.markdown("Pasa el cursor o revisa los colores del texto:")
        highlighted_html = ""
        current_p = -1

        for s in res["sentences"]:
            if s["paragraph_idx"] != current_p:
                if current_p != -1:
                    highlighted_html += "</p><p style='line-height:1.8;'>"
                else:
                    highlighted_html += "<p style='line-height:1.8;'>"
                current_p = s["paragraph_idx"]

            risk = s["risk_level"]
            cls_name = "hl-high" if risk == "high" else "hl-medium" if risk == "medium" else "hl-low"
            reason_str = " | ".join(s["reasons"])
            highlighted_html += f"<span class='{cls_name}' title='{risk.upper()}: {reason_str}'>{s['text']}</span> "

        highlighted_html += "</p>"
        st.markdown(f"<div style='background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;'>{highlighted_html}</div>", unsafe_allow_html=True)

    with v_tab2:
        st.markdown("### Guía para Quitar las Huellas de IA")
        flagged_sentences = [s for s in res["sentences"] if s["risk_level"] in ["high", "medium"]]

        if not flagged_sentences:
            st.success("🎉 ¡Excelente trabajo! No se detectaron oraciones con huellas críticas de IA. El estilo se percibe orgánico y humano.")
        else:
            st.write(f"Se encontraron **{len(flagged_sentences)}** oraciones que conviene reescribir para eliminar sospechas:")

            for idx, s in enumerate(flagged_sentences):
                badge_html = "<span class='badge-high'>🔴 Alta Huella</span>" if s["risk_level"] == "high" else "<span class='badge-med'>🟡 Huella Media</span>"
                with st.expander(f"Oración {s['sentence_idx']+1} (Párrafo {s['paragraph_idx']+1}): \"{s['text'][:70]}...\"", expanded=(idx < 3)):
                    st.markdown(f"**Nivel de Riesgo:** {badge_html} | **Perplejidad:** `{s['perplexity']}` | **Longitud:** `{s['word_count']} palabras`", unsafe_allow_html=True)
                    st.markdown(f"**Texto original:**\n> *\"{s['text']}\"*")

                    st.markdown("**Motivos por los que fue señalada:**")
                    for r in s["reasons"]:
                        st.markdown(f"- ⚠️ {r}")

                    sugg = s.get("suggestions", {})
                    if sugg.get("tips"):
                        st.markdown("**Acciones recomendadas para humanizarla:**")
                        for t in sugg["tips"]:
                            st.markdown(f"- 💡 {t}")

                    if sugg.get("suggested_rewrite"):
                        st.markdown("**Propuesta de reescritura inmediata:**")
                        st.info(f"✨ *\"{sugg['suggested_rewrite']}\"*")

    with v_tab3:
        st.markdown("### Descargar Resultados")
        c_exp1, c_exp2 = st.columns(2)

        # Generar Word anotado
        docx_bytes = export_annotated_docx(res)
        with c_exp1:
            st.download_button(
                label="📄 Descargar Documento Word (.docx) Anotado",
                data=docx_bytes,
                file_name=f"auditado_{doc_n}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True
            )

        # Generar Reporte Markdown
        md_report = export_markdown_report(res)
        with c_exp2:
            st.download_button(
                label="📝 Descargar Informe de Auditoría (.md)",
                data=md_report,
                file_name=f"reporte_auditoria_{doc_n}.md",
                mime="text/markdown",
                use_container_width=True
            )
