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
