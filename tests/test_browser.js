const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
global.window = global;
vm.runInThisContext(fs.readFileSync('js/academic-review.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/detector.js', 'utf8'));
const sample = 'En el ámbito de la medicina, es importante destacar que la evidencia requiere revisión. En conclusión, el estudio debe replicarse.';
const first = ZeroIADetector.analyzeDocument(sample);
for (let i = 0; i < 5; i++) assert.deepEqual(ZeroIADetector.analyzeDocument(sample), first);
assert.deepEqual(extractWords('Árbol pingüino acción'), ['árbol','pingüino','acción']);
assert.match(ZeroIADetector.analyzeDocument('!!!').error, /vacío/);
assert.equal(ZeroIADetector.splitSentences('El Dr. Gómez llegó. Luego salió.')[0], 'El Dr. Gómez llegó.');
// Isolate the exact escaping function used by the UI.
const ui = fs.readFileSync('js/app.js','utf8');
vm.runInThisContext(ui.slice(0, ui.indexOf('/**')));
assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.ok(!ui.includes('onclick="copySuggestion('));
assert.ok(ui.includes('${escapeHTML(s.text)}'));
assert.ok(ui.includes('${escapeHTML(s.suggestedRewrite)}'));
console.log('Browser regressions passed: repeatability, Unicode, empty input, abbreviation, HTML escaping.');

assert.ok(first.sentences.every(s => !s.suggestedRewrite || !s.suggestedRewrite.includes(',,')));
assert.equal(first.score_kind, 'uncalibrated_heuristic');

// Regresión de marcas de agua invisibles en JS
assert.equal(typeof ZeroIADetector.detectInvisibleWatermarks, 'function');
assert.equal(typeof ZeroIADetector.stripInvisibleCharacters, 'function');
const dirty = 'Texto\u200B con\uFEFF marcas\u00AD.';
const dirtyRes = ZeroIADetector.detectInvisibleWatermarks(dirty);
assert.equal(dirtyRes.totalInvisibleChars, 3);
assert.equal(ZeroIADetector.stripInvisibleCharacters(dirty), 'Texto con marcas.');

// Regresión de aislamiento de bibliografía en JS
const withBib = 'El sensor acústico registró valores normales durante el experimento.\n\nReferencias\nGómez, A. (2020). Métodos. Editorial Ciencia.';
const resBib = ZeroIADetector.analyzeDocument(withBib);
assert.ok(resBib.sentences.some(s => s.isBibliography));
assert.equal(resBib.classification, 'Baja concentración de patrones de IA');

// Los destinos DOM del controlador deben existir en la página real.
const html = fs.readFileSync('index.html', 'utf8');
for (const [, id] of ui.matchAll(/document\.getElementById\("([^"]+)"\)/g)) {
  assert.ok(html.includes(`id="${id}"`) || ui.includes(`id="${id}"`), `Falta el elemento de interfaz ${id}`);
}

// Una excepción del motor o del render no debe bloquear futuros análisis.
const startSource = ui.slice(ui.indexOf('function startAnalysis()'), ui.indexOf('function extractDOI('));
for (const failure of ['engine', 'render', 'validation']) {
  const callbacks = [], alerts = [];
  let shouldFail = true;
  const context = vm.createContext({
    analysisInProgress: false,
    promptTextarea: { value: sample },
    sendBtn: { innerHTML: 'Analizar', disabled: false },
    heroContainer: { style: { display: 'flex' } },
    resultsContainer: { style: { display: 'none' } },
    currentRawText: '', currentAnalysis: null,
    setTimeout: callback => callbacks.push(callback),
    alert: message => alerts.push(message),
    console: { error() {} },
    window: { scrollTo() {}, ZeroIADetector: { analyzeDocument() {
      if (shouldFail && failure === 'engine') throw new Error('Fallo simulado');
      if (shouldFail && failure === 'validation') return { error: 'Sin palabras' };
      return first;
    } } },
    renderResults() {
      if (shouldFail && failure === 'render') throw new Error('Fallo simulado');
    }
  });
  vm.runInContext(startSource, context);
  context.startAnalysis();
  context.startAnalysis();
  assert.equal(callbacks.length, 1, 'No duplicar análisis en curso');
  callbacks.shift()();
  assert.equal(alerts.length, 1);
  assert.equal(context.sendBtn.disabled, false);
  assert.equal(context.sendBtn.innerHTML, 'Analizar');
  assert.equal(context.analysisInProgress, false);
  assert.equal(context.promptTextarea.value, sample);
  assert.equal(context.heroContainer.style.display, 'flex');
  shouldFail = false;
  context.startAnalysis();
  callbacks.shift()();
  assert.equal(context.resultsContainer.style.display, 'block');
  assert.equal(context.currentAnalysis, first);
  assert.equal(context.sendBtn.disabled, false);
}
console.log('UI regressions passed: DOM targets, error recovery, retry, duplicate analysis.');
