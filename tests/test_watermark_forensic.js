/**
 * Zero-IA Forensic Watermark & Steganography Test Suite
 * Reverse-engineered from Guillaume Meyer's watermarks-remover (Layer A & Layer B)
 */
const assert = require('node:assert');
require('../js/editorial-rules.js');
require('../js/text-structure.js');
require('../js/academic-review.js');
require('../js/ai-probabilistic-engine.js');
require('../js/detector.js');

const D = globalThis.ZeroIADetector;
const E = globalThis.ZeroIAProbabilisticEngine;

console.log('🧪 Iniciando batería de pruebas forenses de marcas de agua de IA...\n');

// 1. Texto limpio humano
{
  const text = 'Este es un ensayo puramente académico escrito por un autor humano sobre filosofía.';
  const report = D.detectInvisibleWatermarks(text);
  assert.strictEqual(report.hasWatermark, false, 'Texto limpio no debe tener marca de agua');
  assert.strictEqual(report.hasFormatting, false, 'Texto limpio no debe tener caracteres de formato');
  assert.strictEqual(report.covertWatermarksCount, 0);
  assert.strictEqual(report.watermarkScoreContribution, 0);
  assert.strictEqual(report.status, 'clean');
  console.log('✔ Test 1: Texto limpio humano clasificado correctamente como limpio.');
}

// 2. Formato legítimo de emojis (ZWJ y Variation Selectors)
{
  const text = 'Reunión de trabajo con 👩‍💻 y 👨‍👩‍👧 con balance justo ⚖️ en la oficina ❤️‍🔥.';
  const report = D.detectInvisibleWatermarks(text);
  assert.strictEqual(report.hasFormatting, true, 'Emojis estándar deben registrar formato');
  assert.strictEqual(report.hasWatermark, false, 'Emojis legítimos no deben considerarse marca de agua de IA');
  assert.strictEqual(report.covertWatermarksCount, 0, 'No deben contarse como marcas encubiertas');
  assert.strictEqual(report.watermarkScoreContribution, 0);
  assert.strictEqual(report.status, 'info');
  console.log('✔ Test 2: Secuencias de emojis válidas identificadas como formato legítimo sin falsos positivos.');
}

// 3. Ortografía legítima en escritura compleja (Persa/Árabe)
{
  const text = 'En persa la palabra می‌روم contiene un ZWNJ ortográfico legítimo.';
  const report = D.detectInvisibleWatermarks(text);
  assert.strictEqual(report.hasFormatting, true);
  assert.strictEqual(report.hasWatermark, false, 'ZWNJ ortográfico entre caracteres persas no es marca de agua');
  assert.strictEqual(report.covertWatermarksCount, 0);
  console.log('✔ Test 3: Caracteres ortográficos en escrituras complejas (Persa/Árabe) preservados sin alerta.');
}

// 4. Detección de marcas de agua encubiertas tipo Claude (Zero-Width Space steganography)
{
  const textWithClaudeWatermark = 'La inteligencia artificial\u200Bha revolucionado\u200Bel análisis textual\u2060académico.';
  const report = D.detectInvisibleWatermarks(textWithClaudeWatermark);
  assert.strictEqual(report.hasWatermark, true, 'Debe detectar las marcas de agua de Claude');
  assert.strictEqual(report.steganographyDetected, true);
  assert.strictEqual(report.covertWatermarksCount, 3, 'Debe encontrar exactamente 3 caracteres encubiertos');
  assert.ok(report.watermarkScoreContribution >= 90, '3 marcas encubiertas deben aportar >= 90%');
  assert.strictEqual(report.status, 'alert');
  assert.ok(report.vendorSignatures.some(v => v.includes('Claude') || v.includes('ZWSP')), 'Debe identificar firma Claude/ZWSP');
  console.log(`✔ Test 4: Marcas esteganográficas de Claude detectadas (${report.covertWatermarksCount} señales, aporte: +${report.watermarkScoreContribution}%).`);
}

// 5. Inyección en canal encubierto (Variation Selector o Tag plane)
{
  const textWithHiddenBits = 'Documento confidencial\uFE00con canal encubierto\uFE01de trazabilidad.';
  const report = D.detectInvisibleWatermarks(textWithHiddenBits);
  assert.strictEqual(report.hasWatermark, true);
  assert.strictEqual(report.covertWatermarksCount, 2);
  assert.ok(report.watermarkScoreContribution >= 70);
  console.log(`✔ Test 5: Canales encubiertos por Variation Selectors detectados exitosamente.`);
}

// 6. Integración End-to-End con el cálculo porcentual de IA
{
  // Muestra de texto humano
  const humanProse = 'El estudio de la historia antigua revela la complejidad de las primeras civilizaciones mediterráneas. Los intercambios marítimos facilitaron el comercio de metales y cerámicas entre pueblos diversos. La documentación arqueológica confirma la existencia de rutas comerciales consolidadas durante la Edad del Bronce.';
  
  // Análisis del texto limpio
  const cleanAnalysis = D.analyzeDocument(humanProse);
  assert.ok(cleanAnalysis.ai_probability.aiPercentage < 15, 'Texto humano limpio debe tener IA muy baja');
  assert.strictEqual(cleanAnalysis.watermark_analysis.hasWatermark, false);

  // Inyección de marcas forenses de IA en el mismo texto humano
  const watermarkedProse = 'El estudio de la historia\u200Bantigua revela la complejidad\u200Bde las primeras civilizaciones mediterráneas. Los intercambios marítimos\u2060facilitaron el comercio\u200Bde metales.';
  const watermarkedAnalysis = D.analyzeDocument(watermarkedProse);
  
  assert.strictEqual(watermarkedAnalysis.watermark_analysis.hasWatermark, true);
  assert.ok(watermarkedAnalysis.ai_probability.watermarkContribution >= 90, 'El aporte de marcas de agua debe ser >= 90%');
  assert.ok(watermarkedAnalysis.ai_probability.aiPercentage >= 95, 'La probabilidad global de IA debe elevarse a >= 95% debido a la evidencia física de marcas de agua');
  assert.strictEqual(watermarkedAnalysis.ai_probability.verdictBadge, '🔴 MARCAS DE AGUA IA DETECTADAS');
  console.log(`✔ Test 6: Integración porcentual verificada: texto humano limpio (${cleanAnalysis.ai_probability.aiPercentage}%) vs. texto marcado (${watermarkedAnalysis.ai_probability.aiPercentage}% con aporte +${watermarkedAnalysis.ai_probability.watermarkContribution}%).`);
}

// 7. Sanitización y desinfección forense (stripInvisibleCharacters)
{
  const sample = '\uFEFFTexto original con 👩‍💻 y marca\u200Boculta\u2060aquí.';
  const cleaned = D.stripInvisibleCharacters(sample);
  assert.strictEqual(cleaned.includes('\uFEFF'), false, 'BOM inicial debe ser eliminado');
  assert.strictEqual(cleaned.includes('\u200B'), false, 'ZWSP encubierto debe ser eliminado');
  assert.strictEqual(cleaned.includes('\u2060'), false, 'WJ encubierto debe ser eliminado');
  assert.ok(cleaned.includes('👩‍💻'), 'Emoji válido debe ser conservado');
  console.log('✔ Test 7: Desinfección forense correcta (elimina BOM y marcas de IA preservando emojis válidos).');
}

console.log('\n🎉 ¡TODAS LAS PRUEBAS FORENSES DE MARCAS DE AGUA PASARON EXITOSAMENTE!');
