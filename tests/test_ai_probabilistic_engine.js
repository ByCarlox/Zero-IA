const assert = require('node:assert/strict');
const fs = require('node:fs');

// Cargar librerías
require('../js/editorial-rules.js');
require('../js/text-structure.js');
require('../js/ai-probabilistic-engine.js');

const S = globalThis.ZeroIAStructure;
const Engine = globalThis.ZeroIAProbabilisticEngine;

// 1. Caso Real PFM (Elvin Borges)
const pfmText = fs.readFileSync('tests/fixtures/authorship/caso_pfm_elvin_borges.txt', 'utf8');
const pfmBlocks = S.blocks(pfmText);
const pfmBody = pfmBlocks.filter(b => b.kind === 'body').flatMap(b => S.sentenceSpans(b.text, b.start).map(s => ({ ...s, wordCount: S.words(s.text).length })));

const pfmResult = Engine.evaluate(pfmBody, pfmText);
console.log(`[TEST] PFM Borges AI Percentage: ${pfmResult.aiPercentage}% | Classification: ${pfmResult.classification}`);
assert.ok(pfmResult.aiPercentage >= 60, `El porcentaje de IA del PFM (${pfmResult.aiPercentage}%) debe ser >= 60%`);
assert.equal(pfmResult.verdictColor, 'red');
assert.ok(pfmResult.metrics.highRiskSentences >= 20);

// 1b. Caso Real PFM (Carlos Ferreira - Turnitin 84%)
const carlosText = fs.readFileSync('tests/fixtures/authorship/caso_pfm_carlos_ferreira.txt', 'utf8');
const carlosBlocks = S.blocks(carlosText);
const carlosBody = carlosBlocks.filter(b => b.kind === 'body').flatMap(b => S.sentenceSpans(b.text, b.start).map(s => ({ ...s, wordCount: S.words(s.text).length })));

const carlosResult = Engine.evaluate(carlosBody, carlosText);
console.log(`[TEST] PFM Carlos Ferreira AI Percentage: ${carlosResult.aiPercentage}% | Classification: ${carlosResult.classification}`);
assert.ok(carlosResult.aiPercentage >= 70, `El porcentaje de IA de Carlos Ferreira (${carlosResult.aiPercentage}%) debe ser >= 70% (Turnitin 84%)`);
assert.equal(carlosResult.verdictColor, 'red');
assert.ok(carlosResult.metrics.highRiskSentences >= 20);

// 2. Controles Humanos Históricos (Cervantes & Ramón y Cajal)
const humanData = JSON.parse(fs.readFileSync('tests/fixtures/authorship/human.json', 'utf8'));
for (const h of humanData) {
  const blocks = S.blocks(h.text);
  const body = blocks.filter(b => b.kind === 'body').flatMap(b => S.sentenceSpans(b.text, b.start).map(s => ({ ...s, wordCount: S.words(s.text).length })));
  const res = Engine.evaluate(body, h.text);
  console.log(`[TEST] Human Control ${h.id}: ${res.aiPercentage}% | Expected < 15%`);
  assert.ok(res.aiPercentage < 15, `El porcentaje del texto humano ${h.id} (${res.aiPercentage}%) debe ser < 15%`);
  assert.equal(res.verdictColor, 'green');
}

// 3. Controles Generados por IA
const genData = JSON.parse(fs.readFileSync('tests/fixtures/authorship/generated.json', 'utf8'));
for (const g of genData) {
  const blocks = S.blocks(g.text);
  const body = blocks.filter(b => b.kind === 'body').flatMap(b => S.sentenceSpans(b.text, b.start).map(s => ({ ...s, wordCount: S.words(s.text).length })));
  const res = Engine.evaluate(body, g.text);
  console.log(`[TEST] AI Generated Control ${g.id}: ${res.aiPercentage}% | Risk: ${res.verdictBadge}`);
}

console.log('✔ All ZeroIAProbabilisticEngine tests passed successfully.');
