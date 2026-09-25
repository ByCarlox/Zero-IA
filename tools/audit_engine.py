"""Diagnostic audit, not an accuracy benchmark. No model downloads or network calls.
Run from anywhere: venv/bin/python tools/audit_engine.py
All prose cases are synthetic probes authored for this audit, not human controls.
"""
import sys
if __name__ == '__main__':
    sys.exit('Auditoría histórica de v1: resultados conservados en docs/engine-audit. Para v2 usa tools/evaluate_editorial.py; este programa requiere el checkout histórico 7e1b654.')
import json
from pathlib import Path
import subprocess
import sys
import time
import unicodedata
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.detector import AIDetector
from core.perplexity_engine import PerplexityEngine
from core.sentence_tokenizer import split_into_sentences
from core.llm_heuristics import detect_cliches_in_sentence

GENERIC = (
    'La transformación de las organizaciones requiere una visión que integre personas y procesos. '
    'Las herramientas tecnológicas permiten adaptar las operaciones a las necesidades del entorno. '
    'La coordinación entre equipos favorece la continuidad de las iniciativas y facilita su seguimiento. '
    'Una estrategia flexible ayuda a responder a los cambios sin perder de vista los objetivos. '
    'El desarrollo de capacidades internas fortalece la participación de quienes intervienen en cada etapa. '
    'La evaluación periódica proporciona información relevante para ajustar las decisiones y orientar los recursos. '
    'La comunicación entre las áreas contribuye a establecer acuerdos sobre los resultados esperados. '
    'La mejora de los procedimientos requiere revisar las prácticas existentes y reconocer sus limitaciones.'
)
REPEAT = 'La coordinación entre equipos favorece la continuidad de las iniciativas y facilita su seguimiento.'
BASE = 'El sensor registró valores normales durante el experimento. Repetimos la medición al día siguiente.'
CLICHE = 'En el ámbito de la ciencia, es importante destacar que este método desempeña un papel crucial.'
CASES = {
    'generic_generated': GENERIC,
    'generic_generated_400_words': ' '.join([GENERIC] * 4),
    'verbatim_repeat_12': ' '.join([REPEAT] * 12),
    'plain_control': BASE,
    'cliche_dense': CLICHE,
    'quoted_cliche': 'El manual prohíbe las fórmulas «en el ámbito de» y «es importante destacar que» porque resultan imprecisas.',
    'enumeration': 'Medimos temperatura, presión y humedad durante el ensayo.',
    'summary_connector': 'En resumen, los resultados no permiten aceptar la hipótesis inicial.',
    'synthesis_connector': 'En síntesis, los resultados no permiten aceptar la hipótesis inicial.',
    'legitimate_short': 'El resultado fue negativo.',
    'one_word': 'Electroencefalografía',
    'normal_order': 'Los técnicos analizaron cuidadosamente los registros del sensor durante la mañana.',
    'reversed_words': 'Mañana la durante sensor del registros los cuidadosamente analizaron técnicos los.',
    'no_punctuation': GENERIC.replace('.', ''),
    'nfc': CLICHE,
    'nfd': unicodedata.normalize('NFD', CLICHE),
    'bibliography_added': BASE + '\n\nReferencias\nGarcía, M. (2020). En el ámbito de los sensores, es importante destacar que los datos requieren revisión.',
    'bibliography_only': 'Referencias\nGarcía, M. (2020). En el ámbito de los sensores, es importante destacar que los datos requieren revisión.',
    'numbered_bibliography': BASE + '\n\n5. Referencias\nGarcía, M. (2020). En el ámbito de los sensores, es importante destacar que los datos requieren revisión.',
    'appendix_after_bibliography': BASE + '\n\nReferencias\nGarcía, M. (2020). Sensores.\n\nAnexos\n' + CLICHE,
    'closing_quote': 'Dijo «El resultado es estable.» Luego repitió la medición.',
    'lowercase_after_period': 'La primera medición terminó. la segunda comenzó.',
    'initial_author': 'A. García midió la señal. B. Pérez revisó los datos.',
    'newline_paragraphs': 'Primer párrafo completo.\n \nSegundo párrafo completo.',
    'non_latin': '研究方法需要根据具体情况进行调整。结果不能证明作者身份。',
    'emoji_family': 'La familia 👨‍👩‍👧‍👦 visitó el museo. La familia 👨‍👩‍👧‍👦 volvió a casa.',
    'connector_rewrite': 'En conclusión, cabe destacar que el sensor falló.',
    'negative_rewrite': 'No es importante destacar que el sensor falló.',
    'quoted_rewrite': 'El título original dice «En conclusión» y debe conservarse literalmente.',
}
NODE_SCRIPT = r'''
const fs = require('fs'), vm = require('vm');
global.window = global;
vm.runInThisContext(fs.readFileSync('js/academic-review.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/detector.js', 'utf8'));
const cases = JSON.parse(fs.readFileSync(0,'utf8'));
const out = Object.fromEntries(Object.entries(cases).map(([name,text]) => {
 const start = performance.now();
 const result = ZeroIADetector.analyzeDocument(text);
 return [name, {result,elapsed_ms:performance.now()-start,segments:splitSentences(text),
   cliches:detectCliches(text),lexical:computePerplexity(text)}];
}));
console.log(JSON.stringify(out));
'''

def main():
    target = ROOT / 'docs' / 'engine-audit'
    target.mkdir(parents=True, exist_ok=True)
    detector = AIDetector(use_transformers=False)
    node = json.loads(subprocess.check_output(['node', '-e', NODE_SCRIPT], input=json.dumps(CASES).encode(), cwd=ROOT))
    rows = []
    evidence = {}
    for name, text in CASES.items():
        start = time.perf_counter()
        py = detector.analyze_document(text)
        elapsed = (time.perf_counter() - start) * 1000
        js = node[name]['result']
        evidence[name] = {'text':text, 'python':py, 'javascript':js,
                          'python_segments':split_into_sentences(text), 'javascript_segments':node[name]['segments'],
                          'python_elapsed_ms':elapsed, 'javascript_elapsed_ms':node[name]['elapsed_ms'],
                          'python_lexical':detector.perplexity_engine.compute_sentence_perplexity(text),
                          'javascript_lexical':node[name]['lexical'],
                          'python_cliches':detect_cliches_in_sentence(text), 'javascript_cliches':node[name]['cliches']}
        rows.append({'case':name, 'py_score':py.get('global_ai_percentage'), 'js_score':js.get('globalPercentage'),
                     'py_sentences':py.get('total_sentences'), 'js_sentences':js.get('totalSentences'),
                     'py_words':py.get('total_words'), 'js_words':js.get('totalWords'),
                     'py_high':py.get('high_risk_sentences'), 'js_high':js.get('highRiskSentences'),
                     'py_mean':py.get('perplexity_metrics',{}).get('mean_perplexity'), 'js_mean':js.get('meanPerplexity')})
    # Failure injection: test mode labelling without installing/loading a model.
    fallback = PerplexityEngine(use_transformers=False)
    fallback._has_transformers = True
    fallback._tokenizer = lambda *a, **kw: (_ for _ in ()).throw(RuntimeError('simulated tokenizer failure'))
    with patch.dict(sys.modules, {'torch': object()}):
        mixed = fallback.analyze_document([BASE])
    evidence['neural_failure_injection'] = mixed
    cleanup_script = r'''
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('js/app.js','utf8');
let click;
const context=vm.createContext({
 document:{getElementById:()=>({addEventListener:(_,fn)=>click=fn})},
 currentRawText:'Un texto\u200B de ejemplo.', promptTextarea:{value:''}, alert:()=>{},
 window:{ZeroIADetector:{stripInvisibleCharacters:s=>s.replaceAll('\u200B','')}}
});
vm.runInContext(source.slice(source.indexOf('// Botón de Purga'),source.indexOf('// Botón Imprimir')),context);
let error=null;
try {click()} catch(e) {error=e.name+': '+e.message}
console.log(JSON.stringify({error,text_after:context.currentRawText}));
'''
    cleanup = json.loads(subprocess.check_output(['node', '-e', cleanup_script], cwd=ROOT))
    evidence['cleanup_ui_probe'] = cleanup
    # Algorithm timing only, excludes DOM, file parsing and model initialization.
    performance = []
    for count in (100, 1000, 5000):
        text = ' '.join([REPEAT]*count)
        start = time.perf_counter()
        detector.analyze_document(text)
        py_ms = (time.perf_counter()-start)*1000
        data = json.loads(subprocess.check_output(['node','-e',NODE_SCRIPT],input=json.dumps({'large':text}).encode(),cwd=ROOT))
        performance.append({'sentences':count,'words':len(text.split()),'python_ms':round(py_ms,2), 'javascript_ms':round(data['large']['elapsed_ms'],2)})
    report = {'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
              'purpose':'Diagnostic synthetic probes. Not a labelled authorship benchmark; not accuracy or external-detector validation.',
              'summary':rows,'cases':evidence,'performance':performance}
    (target/'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    lines = ['# Resultados de diagnóstico del motor', '', 'Casos sintéticos: no equivalen a precisión de detección de autoría.', '',
             '| Caso | Python /100 | Web /100 | Frases Python/web | Palabras Python/web | Prioridad alta Python/web |',
             '|---|---:|---:|---|---|---|']
    for r in rows:
        lines.append(f"| {r['case']} | {r['py_score']} | {r['js_score']} | {r['py_sentences']}/{r['js_sentences']} | {r['py_words']}/{r['js_words']} | {r['py_high']}/{r['js_high']} |")
    lines.extend(['','Tiempos del motor (sin interfaz, extracción ni arranque de Node):','',json.dumps(performance,ensure_ascii=False,indent=2),'',
                  'Fallo neuronal simulado (comprobar engine_mode):','',json.dumps(mixed,ensure_ascii=False,indent=2),
                  '', 'Limpieza Unicode (controlador aislado):', '', json.dumps(cleanup,ensure_ascii=False,indent=2)])
    (target/'results.md').write_text('\n'.join(lines)+'\n')
    print('\n'.join(lines))

if __name__ == '__main__':
    main()
