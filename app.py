"""Local Streamlit interface to the same editorial engine used by the static web app."""
import streamlit as st
from core.detector import AIDetector
from core.document_parser import parse_document
from core.engine_bridge import call_engine
from export.report_generator import export_markdown_report, export_annotated_docx

st.set_page_config(page_title='Zero-IA · Validador Académico', page_icon='✦', layout='wide')
st.title('Validador Académico para tu manuscrito.')
st.caption('Pulcritud editorial, repetición, legibilidad y coherencia de referencias. Autoría no determinada; sin porcentajes de IA.')
for key, value in {'report': None, 'history': [], 'original': '', 'manuscript': '', 'extraction': None}.items():
    if key not in st.session_state:
        st.session_state[key] = value


def review(text, remember=True):
    try:
        with st.spinner('Validando documento…'):
            report = AIDetector().analyze_document(text, extraction=st.session_state.extraction)
        if report.get('error'):
            st.error(report['error'])
            return False
        if remember and st.session_state.report:
            st.session_state.history = (st.session_state.history + [st.session_state.report])[-20:]
        if not st.session_state.original:
            st.session_state.original = text
        st.session_state.report = report
        return True
    except (ValueError, RuntimeError) as error:
        st.error(str(error))
        return False


def replace_text(text):
    st.session_state.pending_text = text
    st.rerun()


if 'pending_text' in st.session_state:
    st.session_state.manuscript = st.session_state.pop('pending_text')

upload = st.file_uploader('Word, PDF o texto · hasta 20 MB', type=['docx', 'pdf', 'txt', 'md'])
if st.button('Cargar archivo', disabled=upload is None):
    try:
        parsed = parse_document(upload.getvalue(), upload.name)
        st.session_state.extraction = parsed['extraction']
        st.session_state.report = None
        st.session_state.original = parsed['full_text']
        st.session_state.history = []
        replace_text(parsed['full_text'])
    except Exception as error:
        st.error(f'No se pudo extraer el documento: {error}')

st.text_area('Texto del documento', key='manuscript', height=300)
if st.button('Validar documento', type='primary'):
    review(st.session_state.manuscript)
report = st.session_state.report
if report:
    st.subheader(report['classification'])
    st.write(report['verdictSummary'])
    cols = st.columns(4)
    val_score = f"{report['validationScore']}%" if report.get('validationScore') is not None else "N/D"
    clean_pct = f"{report.get('cleanPercentage', 0)}% texto limpio" if report.get('cleanPercentage') is not None else ""
    cols[0].metric('Índice de validación', val_score, delta=clean_pct or None)
    cols[1].metric('Observaciones', len(report['findings']))
    cols[2].metric('Palabras por frase', report['metrics']['meanSentenceWords'])
    cols[3].metric('Frases prioritarias', f"{report['highRiskSentences']} / {report['totalSentences']}")
    st.caption(f"Motor {report['version']} · {report['coverage']['excludedWords']} palabras excluidas · {report['sourceFingerprint']}")
    for warning in report['extraction'].get('warnings', []):
        st.warning(warning)
    st.info('No se evalúan autoría, exactitud factual ni respaldo semántico de fuentes. Pocas observaciones no certifican una entrega.')
    if st.session_state.manuscript != report['sourceText']:
        st.warning('Hay cambios sin revisar. El informe corresponde a la última revisión completada.')
    if st.button('Deshacer revisión', disabled=not st.session_state.history):
        st.session_state.report = st.session_state.history.pop()
        replace_text(st.session_state.report['sourceText'])
    with st.expander('Observaciones y evidencia', expanded=True):
        if not report['findings']:
            st.write('Sin incidencias detectadas con las reglas disponibles.')
        for finding in report['findings']:
            with st.expander(f"{finding['severity']} · {finding['message']}"):
                st.write(finding['advice'])
                st.caption(f"Regla: {finding['rule']}")
                for evidence in finding['evidence']:
                    st.text(f"Fragmento {evidence['sentenceId'] + 1}: {evidence['text']}")
    with st.expander('Propuestas individuales'):
        suggestions = [s for s in report['sentences'] if s['suggestion']]
        if not suggestions:
            st.write('No hay sustituciones conservadoras disponibles. Revisa las observaciones en su contexto.')
        for sentence in suggestions:
            st.text(sentence['text'])
            st.text(sentence['suggestedRewrite'])
            st.caption(sentence['suggestion']['reason'])
            if st.button('Aceptar este cambio', key=f"apply_{sentence['globalIdx']}"):
                try:
                    text = call_engine('apply', st.session_state.manuscript, analysis=report, sentenceId=sentence['globalIdx'])
                    if review(text):
                        replace_text(text)
                except RuntimeError as error:
                    st.error(str(error))
    with st.expander('Legibilidad y referencias'):
        st.text(call_engine('report', analysis=report).split('## Formato Unicode')[1])
    with st.expander('Formato Unicode'):
        st.write(report['watermark_analysis']['message'])
        st.dataframe(report['watermark_analysis']['positions'])
    st.download_button('Informe Markdown', export_markdown_report(report), 'revision.md')
    st.download_button('Word anotado', export_annotated_docx(report), 'revision.docx')
    st.download_button('Texto original', st.session_state.original, 'original.txt')
    st.download_button('Texto revisado', st.session_state.manuscript, 'revisado.txt')

st.caption('El manuscrito se procesa en el servidor donde ejecutes Streamlit. Usa la versión web estática para procesamiento en tu navegador.')
