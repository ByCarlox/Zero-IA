/** Descriptive academic review. No authorship or source authenticity inference. */
(function (root) {
  'use strict';
  const notice = 'Revisión orientativa: la legibilidad no mide calidad, nivel de posgrado ni autoría. La coherencia de citas no verifica la existencia de fuentes ni que respalden las afirmaciones. No se consultan catálogos externos.';
  const name = '[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ’\\-]+';
  const year = '(?:18|19|20|21)\\d{2}[a-z]?|s\\.\\s*f\\.';
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '');
  function syllables(word) {
    word = word.toLowerCase().replace(/qu(?=[eiéí])|gu(?=[eiéí])/g, m => m[0]).replace(/y$/, 'i');
    let total = 0;
    for (const group of word.match(/[aeiouáéíóúü]+/g) || []) {
      total++;
      for (let i = 1; i < group.length; i++) {
        const a = group[i - 1], b = group[i];
        if ('íú'.includes(a) || 'íú'.includes(b) || ('aeoáéó'.includes(a) && 'aeoáéó'.includes(b)) || a === b) total++;
      }
    }
    return Math.max(1, total);
  }
  function splitBibliography(text) {
    const heading = /^\s*(?:#{1,6}\s*)?(?:referencias(?: bibliográficas)?|bibliografía|references|bibliography)\s*:?\s*$/im.exec(text);
    if (!heading) return { body: text, bibliography: '', hasBibliography: false };
    return {
      body: text.slice(0, heading.index),
      bibliography: text.slice(heading.index + heading[0].length),
      hasBibliography: true
    };
  }
  function academicReview(text, currentYear = new Date().getFullYear()) {
    const bibData = splitBibliography(text);
    const body = bibData.body;
    const bibliography = bibData.bibliography;
    const heading = bibData.hasBibliography;
    const words = body.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
    const sentences = root.ZeroIADetector.splitSentences(body).filter(s => /[a-záéíóúüñ]/i.test(s));
    const n = words.length, f = sentences.length, count = words.reduce((sum, w) => sum + syllables(w), 0);
    const score = n && f ? Number((206.835 - 62.3 * count / n - n / f).toFixed(2)) : null;
    const readability = {
      score, label: score === null ? 'Sin texto evaluable' : score < 40 ? 'Muy difícil' : score < 55 ? 'Algo difícil' : score < 65 ? 'Normal' : score < 80 ? 'Bastante fácil' : 'Muy fácil',
      words: n, sentences: f, syllables: count, short_sample: n < 100, syllables_estimated: true,
      formula: '206.835 − 62.3 × sílabas/palabras − palabras/oraciones',
      language: 'es (supuesto; no se detecta automáticamente)'
    };
    const entries = [], findings = [];
    for (const line of bibliography.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
      if (!entries.length || /^\[?\d+[\].)]\s*/.test(line) || new RegExp(`^${name}.*?(?:${year})`).test(line)) entries.push(line);
      else entries[entries.length - 1] += ' ' + line;
    }
    const refs = entries.map(entry => {
      const number = /^\[?(\d+)[\].)]\s*/.exec(entry);
      const content = number ? entry.slice(number[0].length) : entry;
      const author = new RegExp(`^${name}`).exec(content), y = new RegExp(year).exec(content);
      const key = author && y ? normalize(author[0]) + ':' + normalize(y[0]) : null;
      if (!key) findings.push({code:'unparsed_reference', evidence:entry, message:'Referencia no interpretable: revisar manualmente autor, fecha y formato.'});
      if (y && /^\d{4}/.test(y[0]) && Number(y[0].slice(0,4)) > currentYear) findings.push({code:'future_year', evidence:entry, message:'Año futuro: comprobar si está en prensa o es un error.'});
      const doi = /(?:doi\s*:\s*|https?:\/\/(?:dx\.)?doi\.org\/)(\S+)/i.exec(entry);
      if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi[1].replace(/[.,;]+$/, ''))) findings.push({code:'invalid_doi', evidence:doi[0], message:'Sintaxis DOI no reconocida; comprobar el identificador.'});
      return {text:entry, key, number:number ? number[1] : null};
    });
    const citations = [];
    const pattern = new RegExp(`(${name})(?:\\s+et\\s+al\\.|\\s+(?:y|and|&)\\s+${name})?\\s*(?:,\\s*|\\(\\s*)(${year})`, 'g');
    for (const m of body.matchAll(pattern)) citations.push({text:m[0], key:normalize(m[1]) + ':' + normalize(m[2]), number:null});
    for (const m of body.matchAll(/\[(\d+(?:\s*[,;–-]\s*\d+)*)\]/g)) {
      const numbers = [];
      for (const part of m[1].split(/[,;]/)) {
        const limits = part.trim().split(/[–-]/).map(Number);
        if (limits.length === 2) {
          if (limits[1] < limits[0] || limits[1] - limits[0] > 100) {
            findings.push({code:'unsupported_range', evidence:m[0], message:'Rango numérico no interpretable.'});
            continue;
          }
          for (let i = limits[0]; i <= limits[1]; i++) numbers.push(String(i));
        } else numbers.push(String(limits[0]));
      }
      numbers.forEach(number => citations.push({text:m[0], key:null, number}));
    }
    const used = new Set();
    citations.forEach(c => {
      const matches = refs.map((r,i) => ((c.number !== null && c.number === r.number) || (c.key !== null && c.key === r.key)) ? i : -1).filter(i => i >= 0);
      matches.forEach(i => used.add(i));
      c.status = !heading ? 'not_checked' : !matches.length ? 'missing_reference' : matches.length > 1 ? 'ambiguous_reference' : 'internal_match';
      if (c.status === 'missing_reference' || c.status === 'ambiguous_reference') findings.push({code:c.status, evidence:c.text, message:!matches.length ? 'Sin correspondencia reconocida en bibliografía.' : 'Más de una referencia coincide: comprobar autores y sufijo a/b del año.'});
    });
    refs.forEach((r,i) => { if (!used.has(i)) findings.push({code:'not_cited', evidence:r.text, message:'No se reconoció una cita a esta entrada; puede ser un formato no soportado.'}); });
    return {version:'1.0', notice, readability, citations:{has_bibliography:!!heading, references:refs, citations, findings, externally_verified:false,
      status:heading ? 'Revisión interna parcial' : 'No evaluable: falta encabezado de bibliografía',
      coverage:'Autor-año APA/Harvard sencillo y numéricas entre corchetes (IEEE/Vancouver). Apellidos compuestos, autores corporativos, notas y referencias sin saltos de línea requieren revisión manual.'}};
  }
  function summary(review) {
    const r = review.readability, c = review.citations;
    return ['Revisión académica', review.notice,
      `Flesch-Szigriszt: ${r.score ?? 'No evaluable'} · ${r.label}`, r.formula,
      `Palabras: ${r.words} · Oraciones: ${r.sentences} · Sílabas estimadas: ${r.syllables}`,
      r.short_sample ? 'Muestra breve (<100 palabras): interpretar con cautela.' : 'Idioma supuesto: español.', c.status, c.coverage,
      `Citas reconocidas: ${c.citations.length} · Referencias: ${c.references.length} · Observaciones: ${c.findings.length}`,
      ...c.findings.map(i => `[${i.code}] ${i.message} Evidencia: ${i.evidence}`),
      'Una coincidencia interna no confirma autenticidad; contrastar autor, título, año y fuente original.'].join('\n\n');
  }
  root.ZeroIAAcademic = {academicReview, summary, syllables, splitBibliography};
})(typeof window === 'undefined' ? globalThis : window);
