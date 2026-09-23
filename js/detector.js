/**
 * Zero-IA: Motor de Detección y Análisis de Huellas de IA en JavaScript (Client-side)
 * Implementa cálculo de Perplejidad probabilística, Ráfaga (Burstiness),
 * Estilometría forense (TTR, Entropía de Shannon) y Heurística de LLMs.
 */

// Abreviaturas académicas comunes en español e inglés
const ABBREVIATIONS = [
  "pág", "págs", "vol", "núm", "no", "dr", "dra", "lic", "ing", "prof",
  "sr", "sra", "srta", "ej", "etc", "aprox", "cap", "art", "vs",
  "al", "fig", "ibid", "op", "cit", "cf", "e.g", "i.e", "ed", "eds"
];

// Clichés y muletillas de LLMs (Español)
const LLM_PATTERNS_ES = [
  { regex: /\ben el ámbito de\b/gi, match: "en el ámbito de", advice: "Expresión frecuente; revisar su precisión. Sustitúyela por 'En' o 'Dentro de'." },
  { regex: /\ben el panorama actual\b/gi, match: "en el panorama actual", advice: "Fórmula de relleno. Usa 'Actualmente' o 'Hoy en día'." },
  { regex: /\ben la era digital\b/gi, match: "en la era digital", advice: "Expresión genérica. Sé más específico o elimínalo." },
  { regex: /\ba lo largo de la historia\b/gi, match: "a lo largo de la historia", advice: "Apertura genérica. Comienza directamente con el objeto de estudio." },
  { regex: /\bes importante destacar que\b/gi, match: "es importante destacar que", advice: "Expresión introductoria. Usa 'Conviene notar que' o 'Nótese que'." },
  { regex: /\bes fundamental señalar que\b/gi, match: "es fundamental señalar que", advice: "Poco natural. Elimínalo o usa 'Debe considerarse que'." },
  { regex: /\bcabe destacar que\b/gi, match: "cabe destacar que", advice: "Marcador de relleno. Cámbialo por 'Particularmente,' o 'Específicamente,'." },
  { regex: /\bcabe mencionar que\b/gi, match: "cabe mencionar que", advice: "Conector frecuente. Usa 'Asimismo,' o reestructura la frase." },
  { regex: /\bes crucial recordar que\b/gi, match: "es crucial recordar que", advice: "Típica solemnidad artificial. Usa 'Importa recordar que'." },
  { regex: /\bes menester señalar\b/gi, match: "es menester señalar", advice: "Formalismo arcaico frecuente en respuestas de ChatGPT." },
  { regex: /\ben conclusión[,:]?\b/gi, match: "en conclusión", advice: "Conclusión de plantilla. Usa 'Por consiguiente,' o 'En suma,'." },
  { regex: /\ben resumen[,:]?\b/gi, match: "en resumen", advice: "Fórmula fija. Usa 'En síntesis,' o 'De este modo,'." },
  { regex: /\bjuega un papel fundamental\b/gi, match: "juega un papel fundamental", advice: "Metáfora trillada de IA. Usa 'influye decisivamente' o 'es determinante'." },
  { regex: /\bdesempeña un papel crucial\b/gi, match: "desempeña un papel crucial", advice: "Expresión formulaica. Usa 'resulta clave' o 'es central'." },
  { regex: /\bes un testimonio de\b/gi, match: "es un testimonio de", advice: "Traducción literal de 'a testament to'. Usa 'evidencia' o 'demuestra'." },
  { regex: /\bun tapiz de\b/gi, match: "un tapiz de", advice: "Traducción literal de 'a rich tapestry'. Sustitúyelo por 'un conjunto de'." },
  { regex: /\buna piedra angular\b/gi, match: "una piedra angular", advice: "Metáfora fija de IA. Usa 'un pilar esencial' o 'la base'." },
  { regex: /\bde manera holística\b/gi, match: "de manera holística", advice: "Adjetivación vacía frecuente en IA." }
];

// Clichés en Inglés
const LLM_PATTERNS_EN = [
  { regex: /\bin conclusion[,:]?\b/gi, match: "in conclusion", advice: "Standard AI transition. Consider 'Ultimately,' or 'In summary,'." },
  { regex: /\bit is important to note that\b/gi, match: "it is important to note that", advice: "ChatGPT filler phrase. Use 'Notably,' or start directly." },
  { regex: /\bit is crucial to\b/gi, match: "it is crucial to", advice: "High frequency in AI. Rephrase with direct active verbs." },
  { regex: /\bdelve into\b/gi, match: "delve into", advice: "Overused hallmark of ChatGPT. Use 'examine', 'analyze' or 'investigate'." },
  { regex: /\ba testament to\b/gi, match: "a testament to", advice: "Generic LLM metaphor. Use 'evidence of' or 'demonstrates'." },
  { regex: /\brich tapestry\b/gi, match: "rich tapestry", advice: "Formulaic expression; not evidence of authorship. Use 'complex system' or 'diverse array'." },
  { regex: /\bplays a pivotal role\b/gi, match: "plays a pivotal role", advice: "Formulaic AI expression. Use 'is central to' or 'drives'." }
];

// Reemplazos sugeridos para humanización rápida
const REPLACEMENTS_MAP = {
  "en el ámbito de": "En",
  "en el panorama actual": "Hoy en día",
  "en la era digital": "En los últimos años",
  "es importante destacar que": "Conviene notar que",
  "es fundamental señalar que": "Debe considerarse que",
  "cabe destacar que": "Específicamente,",
  "cabe mencionar que": "Asimismo,",
  "en conclusión": "Por consiguiente,",
  "en resumen": "En síntesis,",
  "juega un papel fundamental": "influye decisivamente",
  "desempeña un papel crucial": "es determinante",
  "es un testimonio de": "demuestra",
  "un tapiz de": "una combinación de",
  "una piedra angular": "un pilar esencial",
  "delve into": "examine",
  "a testament to": "evidence of",
  "rich tapestry": "diverse set",
  "plays a pivotal role": "is essential"
};

/**
 * Segmenta el texto en párrafos
 */
function splitParagraphs(text) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

/**
 * Segmenta oraciones respetando abreviaturas y puntuación
 */
function splitSentences(text) {
  if (!text || !text.trim()) return [];

  let protectedText = text;
  // Proteger abreviaturas
  ABBREVIATIONS.forEach(abbr => {
    const reg = new RegExp(`\\b${abbr}\\.`, "gi");
    protectedText = protectedText.replace(reg, m => m.slice(0, -1) + "___DOT___");
  });

  // Proteger decimales (ej 3.14)
  protectedText = protectedText.replace(/(\d)\.(\d)/g, "$1___DEC___$2");

  // Separar oraciones
  const rawSentences = protectedText.split(/(?<=[.!?…]["'»\)\]]?)\s+(?=[A-ZÁÉÍÓÚÑ¿¡"'«\(])/);

  return rawSentences
    .map(s => s.replace(/___DEC___/g, ".").replace(/___DOT___/g, ".").trim())
    .filter(s => s.length > 0);
}

/**
 * Extrae palabras en minúsculas
 */
function extractWords(text) {
  const matches = text.toLowerCase().match(/[a-záéíóúüñ0-9]+/gi);
  return matches || [];
}

/**
 * Entropía de Shannon de vocabulario
 */
function computeEntropy(words) {
  if (words.length === 0) return 0;
  const freqs = {};
  words.forEach(w => { freqs[w] = (freqs[w] || 0) + 1; });
  const total = words.length;
  let entropy = 0;
  Object.values(freqs).forEach(count => {
    const p = count / total;
    entropy -= p * Math.log2(p);
  });
  return parseFloat(entropy.toFixed(3));
}

/**
 * Perplejidad estadística calibrada para cliente
 */
function computePerplexity(sentence) {
  const words = extractWords(sentence);
  if (words.length < 2) return 50.0;

  const uniqueRatio = new Set(words).size / words.length;
  const avgLen = words.reduce((acc, w) => acc + w.length, 0) / words.length;

  const charCounts = {};
  for (let c of sentence.toLowerCase()) {
    charCounts[c] = (charCounts[c] || 0) + 1;
  }
  let charEntropy = 0;
  const sLen = sentence.length;
  Object.values(charCounts).forEach(cnt => {
    const p = cnt / sLen;
    charEntropy -= p * Math.log2(p);
  });

  const ppl = 25.0 + (charEntropy * 8.5) + (uniqueRatio * 20.0) + (avgLen * 2.0);
  return parseFloat(ppl.toFixed(1));
}

/**
 * Busca clichés en una oración
 */
function detectCliches(sentence) {
  const found = [];
  const allPatterns = [...LLM_PATTERNS_ES, ...LLM_PATTERNS_EN];

  allPatterns.forEach(item => {
    item.regex.lastIndex = 0; // Global regexes otherwise retain state across calls.
    if (item.regex.test(sentence)) {
      found.push({
        match: item.match,
        advice: item.advice
      });
    }
  });

  // Triplet pattern
  const triplet = sentence.match(/\b([a-záéíóúñ]+),\s+([a-záéíóúñ]+)\s+y\s+([a-záéíóúñ]+)\b/i);
  if (triplet) {
    found.push({
      match: `${triplet[1]}, ${triplet[2]} y ${triplet[3]}`,
      advice: "Estructura tripartita simétrica frecuente en IA. Varía la subordinación sintáctica."
    });
  }

  return found;
}

/**
 * Genera propuesta de reescritura humana
 */
function generateHumanizedRewrite(sentence, cliches) {
  let rewritten = sentence;
  cliches.forEach(c => {
    const key = c.match.toLowerCase();
    if (REPLACEMENTS_MAP[key]) {
      const reg = new RegExp(key, "gi");
      rewritten = rewritten.replace(reg, (match, offset) => offset === 0 ? REPLACEMENTS_MAP[key] : REPLACEMENTS_MAP[key].toLowerCase());
    }
  });

  rewritten = rewritten.replace(/,\s*,/g, ",");
  if (rewritten !== sentence) {
    // Asegurar mayúscula al inicio
    return rewritten.charAt(0).toUpperCase() + rewritten.slice(1);
  }
  return null;
}

/**
 * Función principal de análisis de documento
 */
function analyzeDocument(rawText) {
  if (!rawText || extractWords(rawText).length === 0) {
    return { error: "El documento está vacío." };
  }

  // Separar bibliografía para no distorsionar métricas de estilo ni perplejidad
  let bodyText = rawText;
  let bibText = "";
  let hasBib = false;
  if (window.ZeroIAAcademic && typeof window.ZeroIAAcademic.splitBibliography === "function") {
    const bibSplit = window.ZeroIAAcademic.splitBibliography(rawText);
    if (bibSplit.hasBibliography && extractWords(bibSplit.body).length > 0) {
      bodyText = bibSplit.body;
      bibText = bibSplit.bibliography;
      hasBib = true;
    }
  }

  const paragraphs = splitParagraphs(bodyText);
  const structuredSentences = [];
  const allSentencesText = [];

  paragraphs.forEach((pText, pIdx) => {
    const sList = splitSentences(pText);
    sList.forEach((sText, sIdx) => {
      allSentencesText.push(sText);
      structuredSentences.push({
        paragraphIdx: pIdx,
        sentenceIdx: sIdx,
        text: sText,
        isBibliography: false
      });
    });
  });

  // Si hay bibliografía, registrar sus párrafos sin mezclarlos en el análisis de IA
  if (hasBib && bibText.trim()) {
    const bibParagraphs = splitParagraphs(bibText);
    const startPIdx = paragraphs.length;
    bibParagraphs.forEach((bp, bpIdx) => {
      structuredSentences.push({
        paragraphIdx: startPIdx + bpIdx,
        sentenceIdx: 0,
        text: bp,
        isBibliography: true
      });
    });
  }

  if (allSentencesText.length === 0) {
    return { error: "No se identificaron oraciones legibles en el cuerpo del documento." };
  }

  const allWords = extractWords(bodyText);
  const wordCount = allWords.length;
  const ttr = wordCount > 0 ? parseFloat((new Set(allWords).size / wordCount).toFixed(3)) : 0;
  const entropy = computeEntropy(allWords);

  // Estadísticas de longitud de oraciones
  const sentLengths = allSentencesText.map(s => extractWords(s).length).filter(l => l > 0);
  const meanLen = sentLengths.reduce((a, b) => a + b, 0) / (sentLengths.length || 1);
  const variance = sentLengths.reduce((a, b) => a + Math.pow(b - meanLen, 2), 0) / (sentLengths.length || 1);
  const stdLen = Math.sqrt(variance);
  const cv = stdLen / (meanLen + 1e-6); // Coeficiente de variación

  // Perplejidades individuales
  const ppls = allSentencesText.map(s => computePerplexity(s));
  const meanPpl = parseFloat((ppls.reduce((a, b) => a + b, 0) / (ppls.length || 1)).toFixed(1));
  const pplVariance = ppls.reduce((a, b) => a + Math.pow(b - meanPpl, 2), 0) / (ppls.length || 1);
  const burstiness = parseFloat(Math.sqrt(pplVariance).toFixed(1));

  let highRiskCount = 0;
  let mediumRiskCount = 0;

  const analyzedSentences = structuredSentences.map((item, idx) => {
    const sText = item.text;
    const words = extractWords(sText);
    const wLen = words.length;

    if (item.isBibliography) {
      return {
        globalIdx: idx,
        paragraphIdx: item.paragraphIdx,
        sentenceIdx: item.sentenceIdx,
        text: sText,
        wordCount: wLen,
        perplexity: 100.0,
        aiScore: 0.0,
        riskLevel: "low",
        isBibliography: true,
        reasons: ["Entrada bibliográfica: excluida del análisis de estilo."],
        tips: [],
        suggestedRewrite: null
      };
    }

    const ppl = ppls[idx];
    const cliches = detectCliches(sText);

    let score = 0.0;
    const reasons = [];

    if (ppl < 35.0) {
      score += 0.50;
      reasons.push(`Baja perplejidad (${ppl}): estructura altamente predecible.`);
    } else if (ppl < 55.0) {
      score += 0.25;
      reasons.push(`Perplejidad moderadamente baja (${ppl}).`);
    } else if (ppl > 80.0) {
      score -= 0.20;
    }

    if (cliches.length > 0) {
      score += Math.min(0.45, cliches.length * 0.25);
      cliches.forEach(c => reasons.push(`Huella detectada: "${c.match}"`));
    }

    if (meanLen > 0 && Math.abs(wLen - meanLen) < 3 && wLen > 12) {
      score += 0.15;
      reasons.push("Longitud próxima a la media; no demuestra autoría.");
    }

    score = Math.max(0.0, Math.min(1.0, score));

    let riskLevel = "low";
    if (score >= 0.55 || cliches.length >= 2) {
      riskLevel = "high";
      highRiskCount++;
    } else if (score >= 0.30 || cliches.length === 1) {
      riskLevel = "medium";
      mediumRiskCount++;
    } else {
      riskLevel = "low";
      if (reasons.length === 0) {
        reasons.push("No se observaron señales destacadas con estas reglas.");
      }
    }

    // Sugerencias
    const tips = [];
    cliches.forEach(c => tips.push(c.advice));
    if (wLen > 32) tips.push("Oración muy densa. Divídela para crear cadencia.");
    if (ppl < 40) tips.push("Revisa claridad y precisión; añade citas únicamente cuando respalden una afirmación.");

    const rewrite = generateHumanizedRewrite(sText, cliches);

    return {
      globalIdx: idx,
      paragraphIdx: item.paragraphIdx,
      sentenceIdx: item.sentenceIdx,
      text: sText,
      wordCount: wLen,
      perplexity: ppl,
      aiScore: parseFloat(score.toFixed(2)),
      riskLevel: riskLevel,
      reasons: reasons,
      tips: tips,
      suggestedRewrite: rewrite
    };
  });

  const contentSentences = analyzedSentences.filter(s => !s.isBibliography);
  const totalS = contentSentences.length || 1;
  const pctHigh = highRiskCount / totalS;
  const pctMed = mediumRiskCount / totalS;
  let rawGlobal = (pctHigh * 0.70) + (pctMed * 0.30) + ((1.0 - Math.min(1.0, cv)) * 0.20);

  if (meanPpl < 45.0) rawGlobal += 0.15;
  if (burstiness < 15.0) rawGlobal += 0.10;

  const globalPercentage = Math.round(Math.max(0.0, Math.min(1.0, rawGlobal)) * 100);

  let classification = "Baja concentración de señales de estilo";
  let verdictColor = "green";
  if (globalPercentage >= 65) {
    classification = "Alta concentración de señales de estilo";
    verdictColor = "red";
  } else if (globalPercentage >= 35) {
    classification = "Concentración media de señales de estilo";
    verdictColor = "yellow";
  }

  return {
    academic_review: window.ZeroIAAcademic.academicReview(rawText),
    score_kind: "uncalibrated_heuristic",
    globalPercentage,
    classification,
    verdictColor,
    totalSentences: totalS,
    totalWords: wordCount,
    highRiskSentences: highRiskCount,
    mediumRiskSentences: mediumRiskCount,
    lowRiskSentences: totalS - (highRiskCount + mediumRiskCount),
    meanPerplexity: meanPpl,
    burstiness,
    ttr,
    entropy,
    sentences: analyzedSentences,
    paragraphs: hasBib && bibText.trim() ? [...paragraphs, ...splitParagraphs(bibText)] : paragraphs
  };
}

// Exportar globalmente
window.ZeroIADetector = {
  analyzeDocument,
  splitSentences,
  splitParagraphs
};
