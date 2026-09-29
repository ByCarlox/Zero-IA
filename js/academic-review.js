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
  function splitBibliography(text, structure) {
    return root.ZeroIAStructure.splitBibliography(text, structure);
  }
  function academicReview(text, currentYear = new Date().getFullYear(), options = {}) {
    text = text.normalize("NFC");
    const bibData = splitBibliography(text, options.structure);
    const body = bibData.body;
    const bibliography = bibData.bibliography;
    const heading = bibData.hasBibliography;
    const prose = root.ZeroIAStructure.blocks(text, options.structure).filter(b => b.kind === "body").map(b => b.text).join("\n");
    const words = prose.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
    const sentences = root.ZeroIADetector.splitSentences(prose).filter(s => /[a-záéíóúüñ]/i.test(s));
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
    const pattern = new RegExp(`(${name})(?:\\s+et\\s+al\\.|(?:,\\s*${name})*(?:,?\\s+(?:y|and|&)\\s+${name})?)\\s*(?:,\\s*|\\(\\s*)(${year})`, 'g');
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
    return {version:'2.0', notice, readability, citations:{has_bibliography:!!heading, references:refs, citations, findings, externally_verified:false,
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
  function preflight(text, options = {}) {
    const stage = ['proposal','progress','final'].includes(options.stage) ? options.stage : 'progress';
    const review = options.review || academicReview(text, new Date().getFullYear(), options);
    const findings = [], parts = root.ZeroIAStructure.blocks(text, options.structure);
    const add = (code,severity,category,message,evidence,start) => {
      start = start === undefined ? text.indexOf(evidence) : start;
      findings.push({code,severity,category,message,evidence,start:start < 0 ? null : start,end:start < 0 ? null : start + evidence.length});
    };
    const c = review.citations;
    if(c.references.length === 0 && (c.citations.length || stage === 'final')) {
      const evidence = c.citations[0]?.text || parts.find(b=>/bibliograf|referencias/i.test(b.text))?.text || '';
      add(c.has_bibliography ? 'empty_bibliography' : 'missing_bibliography', 'high','references',
        'No hay referencias bibliográficas reconocidas. Completa la bibliografía y comprueba cada fuente; un formato no compatible requiere revisión manual.',evidence);
    }
    for(const item of c.findings.filter(f=>['missing_reference','ambiguous_reference','invalid_doi','future_year'].includes(f.code)))
      add(item.code,'medium','references',item.message,item.evidence);
    const headings=parts.filter(b=>b.kind==='heading');
    const deferred=/resumen|abstract|resultados|discusión|conclusiones|anexos|apéndices/i;
    headings.forEach((heading,i)=>{
      if(/bibliograf|referencias/i.test(heading.text)) return;
      const next=headings.slice(i+1).find(candidate=>(candidate.level||1)<=(heading.level||1))?.start ?? text.length;
      const content=parts.filter(b=>b.start>=heading.end && b.start<next && !['heading','toc'].includes(b.kind));
      if(!content.length) add('empty_section',stage==='final'?'high':deferred.test(heading.text)?'info':'medium','structure',
        stage==='final'?'Sección sin desarrollo: comprobar si es obligatoria para la entrega final.':'Sección sin desarrollo: puede estar pendiente según el alcance autorizado de este avance.',heading.text,heading.start);
    });
    // Targeted rules identify a question to review, not a semantic verdict or authorship signal.
    const prose=parts.filter(b=>b.kind==='body'||b.kind==='list');
    const syntheticContext=prose.find(b=>/sintétic|simulad|simulación/i.test(b.text));
    for(const block of prose) {
      const t=block.text;
      if(/\bCLV\b|customer lifetime value|valor de vida del cliente/i.test(t) && /anual|un año|12 meses|doce meses/i.test(t))
        add('clv_horizon','medium','methodology','Justifica el horizonte del CLV y distingue valor de vida, CLV truncado y margen anual; documenta retención y descuento cuando proceda.',t,block.start);
      if(syntheticContext && /validez empírica|validación empírica|demostra\w*.*(?:validez|efectividad)|generaliza/i.test(t)) {
        add('synthetic_validation','medium','methodology','El documento menciona simulación o datos sintéticos y contiene esta afirmación de validación. Comprueba si están relacionados y justifica el alcance, los supuestos y la evidencia independiente. La coincidencia de expresiones no demuestra una contradicción.',t,block.start);
        findings[findings.length-1].related_evidence={text:syntheticContext.text,start:syntheticContext.start,end:syntheticContext.end};
      }
      if(/p\s*[<≤]\s*0[.,]05|significaci[oó]n estad[ií]stica|estad[ií]sticamente significativ/i.test(t) && /garantiza|demostra|lograr|alcanzar|deberá|objetivo|se exige/i.test(t))
        add('predetermined_significance','medium','methodology','Formula el contraste de modo que admita resultados no significativos; distingue una hipótesis de un resultado exigido.',t,block.start);
      if(/silueta|silhouette|(?:cuatro|4)\s+(?:grupos|cl[uú]steres)/i.test(t) && /superior|mayor|al menos|m[ií]nimo|garantiza/i.test(t))
        add('predetermined_clusters','medium','methodology','Justifica el número de grupos y el umbral de silueta; compara alternativas y estabilidad antes de fijar el resultado.',t,block.start);
      if(/ANOVA\s+(?:o|y\s*\/\s*o)\s+(?:Chi|Ji)[-\s]?cuadrado/i.test(t))
        add('test_variable_alignment','medium','methodology','Asocia cada contraste a la pregunta, tipo de variable y supuestos; ANOVA y chi-cuadrado no son intercambiables.',t,block.start);
    }
    const rubric = Array.isArray(options.rubric) ? options.rubric.filter(x=>typeof x==='string') : typeof options.rubric==='string' ? options.rubric.split(/\r?\n/).filter(x=>x.trim()) : [];
    rubric.forEach(requirement=>add('rubric_manual_check','info','requirements','Requisito proporcionado: verificar manualmente su cumplimiento.',requirement,-1));
    return {version:'1.0',stage,status:findings.some(f=>f.severity==='high')?'pending':findings.some(f=>f.severity==='medium')?'review':'no_automatic_findings',
      ready:null,findings,checks:{bibliography:true,empty_sections:true,targeted_methodology:true,rubric_supplied:rubric.length>0},
      limitations:'Controles orientativos basados en reglas, sin evaluación semántica general. No certifican que el trabajo esté listo para entregar, no verifican fuentes externas ni predicen autoría o Turnitin. La rúbrica requiere revisión humana.'};
  }
  root.ZeroIAAcademic = {academicReview, preflight, summary, syllables, splitBibliography};
})(typeof window === 'undefined' ? globalThis : window);
