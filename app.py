"""Local Streamlit interface to the same editorial engine used by the static web app."""
import streamlit as st
import json
from datetime import date
from core.detector import AIDetector
from core.document_parser import parse_document
from core.engine_bridge import call_engine
from export.report_generator import export_markdown_report, export_annotated_docx

st.set_page_config(page_title='Zero-IA · Validador Académico', page_icon='✦', layout='wide')
st.title('Zero-IA · Revisión antes de entregar')
st.caption('Resultado externo de IA, referencias y pendientes académicos. Sin informe externo, IA no determinada.')
for key, value in {'report': None, 'history': [], 'original': '', 'manuscript': '', 'extraction': None, 'external_report': None}.items():
    if key not in st.session_state:
        st.session_state[key] = value


def review(text, remember=True):
    try:
        with st.spinner('Validando documento…'):
            report = AIDetector().analyze_document(text, extraction=st.session_state.extraction, stage=stage, rubric=rubric, external_report=st.session_state.external_report)
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

stage = st.selectbox('Etapa de entrega', ['progress', 'proposal', 'final'], format_func=lambda x: {'progress':'Avance', 'proposal':'Propuesta', 'final':'Entrega final'}[x])
rubric = st.text_area('Requisitos de la entrega (revisión manual)', max_chars=10000)
st.text_area('Texto del documento', key='manuscript', height=300)
if st.button('Validar documento', type='primary'):
    review(st.session_state.manuscript)
report = st.session_state.report
if report:
    delivery = call_engine('delivery', analysis=report, options={'stage': stage, 'rubric': rubric, 'externalReport': st.session_state.external_report})
    report['deliveryReview'] = delivery
    ai = delivery['authorship']
    dirty = st.session_state.manuscript != report['sourceText']
    st.metric('Porcentaje de IA · resultado externo', 'No determinado' if dirty else ai['label'])
    st.caption('Hay cambios sin revisar; el resultado anterior no corresponde al editor.' if dirty else ai['notice'])
    with st.expander('Registrar resultado externo de Turnitin'):
        st.caption('Dato declarado por el usuario, sin verificación de autenticidad. Se vincula al texto de la última revisión.')
        with st.form('external_result'):
            hidden_score = st.checkbox('El informe muestra *% (sin valor numérico)')
            ai_value = st.number_input('IA (%)', min_value=0.0, max_value=100.0, value=0.0)
            has_similarity = st.checkbox('Registrar también similitud')
            similarity = st.number_input('Similitud (%)', min_value=0.0, max_value=100.0, value=0.0)
            report_date = st.date_input('Fecha del informe', max_value=date.today())
            submitted = st.form_submit_button('Registrar para este texto', disabled=dirty)
        if submitted:
            try:
                st.session_state.external_report = call_engine('external', record={'provider':'Turnitin','date':report_date.isoformat(),'aiStatus':'below_threshold' if hidden_score else 'reported','aiPercentage':None if hidden_score else ai_value,'similarityPercentage':similarity if has_similarity else None}, sourceSHA256=report['sourceSHA256'])
                st.rerun()
            except RuntimeError as error:
                st.error(str(error))
        imported = st.file_uploader('Importar registro Zero-IA JSON', type=['json'])
        if st.button('Importar registro', disabled=imported is None):
            try:
                if imported.size > 1000000:
                    raise ValueError('El límite del informe es 1 MB.')
                st.session_state.external_report = call_engine('externalImport', imported.getvalue().decode('utf-8'))
                st.rerun()
            except (RuntimeError, ValueError) as error:
                st.error(str(error))
        if st.session_state.external_report:
            st.download_button('Exportar registro externo', json.dumps(st.session_state.external_report, ensure_ascii=False, indent=2), 'resultado-externo.json')
            if st.button('Retirar registro externo'):
                st.session_state.external_report = None
                st.rerun()
    st.subheader('Pendientes antes de entregar')
    st.write(delivery['summary'])
    for finding in delivery['findings']:
        with st.expander(f"{finding['severity']} · {finding['title']}"):
            st.write(finding['message'])
            st.text(str(finding.get('evidence', '')))
            st.write(finding['action'])
    st.subheader(report['classification'])
    st.write(report['verdictSummary'])
    cols = st.columns(4)
    val_score = f"{report['validationScore']}/100" if report.get('validationScore') is not None else "N/D"
    clean_pct = f"{report.get('cleanPercentage', 0)}% frases sin incidencias medias/altas" if report.get('cleanPercentage') is not None else ""
    cols[0].metric('Índice editorial', val_score, delta=clean_pct or None)
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
