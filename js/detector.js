/* Zero-IA 2: evidence-based editorial review. One engine for browser and Python. */
(function(root) {
  'use strict';
  const R=root.ZeroIARules, S=root.ZeroIAStructure;
  const severityRank={info:0,medium:1,high:2};
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const round=n=>Math.round((n+Number.EPSILON)*1000)/1000;
  const avg=a=>a.length?sum(a)/a.length:0;
  const std=a=>Math.sqrt(avg(a.map(n=>(n-avg(a))**2)));
  function fingerprint(text) {
    let hash=2166136261;
    for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return 'fnv1a32:'+ (hash>>>0).toString(16).padStart(8,'0');
  }
  const normalize=text=>S.words(text).join(' ');
  function detectInvisibleWatermarks(text) {
    const types={'\u200B':'Espacio de ancho cero','\u200C':'Separador de unión','\u200D':'Unión de caracteres','\u2060':'Unión de palabras','\uFEFF':'Marca de orden de bytes','\u00AD':'Guion discrecional','\u200E':'Dirección izquierda-derecha','\u200F':'Dirección derecha-izquierda'};
    const positions=[];
    for(let i=0;i<text.length;i++) if(types[text[i]]) positions.push({start:i,end:i+1,hex:'U+'+text.charCodeAt(i).toString(16).toUpperCase().padStart(4,'0'),name:types[text[i]],removable:i===0&&text[i]==='\uFEFF',context:text.slice(Math.max(0,i-16),i+17)});
    return {hasWatermark:false,hasFormatting:positions.length>0,totalInvisibleChars:positions.length,
      steganographyDetected:false,status:positions.length?'info':'clean',positions,
      detectedTypes:[...new Set(positions.map(p=>p.hex))].map(hex=>({hex,count:positions.filter(p=>p.hex===hex).length,name:positions.find(p=>p.hex===hex).name})),
      message:positions.length?'Se encontraron caracteres de formato. Su presencia no identifica IA ni demuestra una marca de agua. Solo se propone retirar un BOM inicial; las uniones, direcciones y guiones se conservan.':'No se encontraron caracteres de formato de los tipos revisados.'};
  }
  function safeSuggestion(text) {
    // Only one removable introductory prefix. Never edit quotations or protected data.
    if(/[«»“”"'‘’\d]/u.test(text)||/\b(?:no|nunca|jamás|sin|ni)\b/iu.test(text)||/https?:|\bdoi\b/iu.test(text)) return null;
    const prefix=R.safePrefixes.find(p=>text.startsWith(p));
    if(!prefix) return null;
    const tail=text.slice(prefix.length);
    if(!/^[a-záéíóúüñ]/u.test(tail)) return null;
    const rewritten=tail[0].toUpperCase()+tail.slice(1);
    return {original:text,replacement:rewritten,removed:prefix,reason:'Omitir una introducción de énfasis. Comprueba que deseas conservar el mismo énfasis antes de aceptar.',requiresReview:true};
  }
  function analyzeDocument(rawText,options={}) {
    if(typeof rawText!=='string'||!rawText.trim()) return {error:'El documento está vacío.',status:'empty',validationScore:null,cleanPercentage:null,issuePercentage:null};
    if(rawText.length>R.maxCharacters) return {error:`El límite es ${R.maxCharacters.toLocaleString('es')} caracteres. Divide el documento por secciones.`,status:'too_large',validationScore:null,cleanPercentage:null,issuePercentage:null};
    const blocks=S.blocks(rawText), sentences=[];
    for(const block of blocks) {
      let sentenceIndex=0;
      const spans=block.kind==='body'?S.sentenceSpans(block.text,block.start):[{text:block.text,start:block.start,end:block.end}];
      for(const span of spans) sentences.push({...span,globalIdx:sentences.length,paragraphIdx:block.id,sentenceIdx:sentenceIndex++,kind:block.kind,isBibliography:block.kind==='bibliography',wordCount:S.words(span.text).length,findings:[],tips:[],reasons:[],riskLevel:'low',suggestedRewrite:null,suggestion:null});
    }
    const body=sentences.filter(s=>s.kind==='body'&&s.wordCount>0);
    const bodyWords=body.flatMap(s=>S.words(s.text));
    const allWords=S.words(rawText);
    const nonLatin=(rawText.match(/[^\p{Script=Latin}\p{M}\p{N}\p{P}\p{Z}\p{S}\p{C}]/gu)||[]).length;
    const latin=(rawText.match(/\p{Script=Latin}/gu)||[]).length;
    const unsupported=nonLatin>latin;
    const englishWords=new Set(['the','and','with','for','this','that','from','which','are','was','were']);
    const spanishCount=bodyWords.filter(w=>R.stopwords.includes(w)).length;
    const englishCount=bodyWords.filter(w=>englishWords.has(w)).length;
    const languageMismatch=bodyWords.length>=30&&englishCount>spanishCount*2&&englishCount>=5;
    const status=!allWords.length?'no_prose':unsupported||languageMismatch?'unsupported_language':!body.length?'no_body':bodyWords.length<R.minWords||body.length<R.minSentences?'limited_sample':'review_available';
    const findings=[];
    const maskedSource=S.maskProtected(rawText);
    const add=(rule,dimension,severity,ids,message,advice,evidence)=>{
      const valid=[...new Set(ids)];
      const item={id:`${rule}:${findings.length}`,rule,dimension,severity,sentenceIds:valid,message,advice,
        evidence:valid.map(id=>({sentenceId:id,start:sentences[id].start,end:sentences[id].end,text:sentences[id].text})),excerpt:evidence||null};
      findings.push(item);valid.forEach(id=>sentences[id].findings.push(item.id));
    };
    if(!['unsupported_language','no_body','no_prose'].includes(status)) {
      const normalized=new Map(),openings=new Map(),ngrams=new Map();
      const usable=body.map(s=>({...s,words:S.words(maskedSource.slice(s.start,s.end))}));
      const stop=new Set(R.stopwords);
      for(const s of usable) {
        const key=s.words.join(' ');
        if(s.words.length>=6) {if(!normalized.has(key)) normalized.set(key,[]);normalized.get(key).push(s.globalIdx);}
        if(s.words.length>=8) {
          const opener=s.words.slice(0,3).join(' ');if(!openings.has(opener)) openings.set(opener,[]);openings.get(opener).push(s.globalIdx);
          for(let i=0;i<=s.words.length-R.ngramSize;i++) {
            const gram=s.words.slice(i,i+R.ngramSize);if(gram.filter(w=>!stop.has(w)).length<2) continue;
            const k=gram.join(' '); if(!ngrams.has(k)) ngrams.set(k,new Set());ngrams.get(k).add(s.globalIdx);
          }
        }
        if(s.words.length>R.longSentenceWords) add('long_sentence','clarity',s.wordCount>R.veryLongSentenceWords?'high':'medium',[s.globalIdx],`Oración de ${s.wordCount} palabras.`, 'Revisa si puedes separar ideas sin romper citas ni relaciones lógicas.');
      }
      const duplicates=new Set();
      for(const [key,ids] of normalized) if(ids.length>=2) {
        ids.forEach(id=>duplicates.add(id));
        add('exact_repetition','repetition','high',ids,`Una misma formulación aparece ${ids.length} veces.`, 'Comprueba si la repetición es necesaria por el género o si puedes consolidar la explicación.',key);
      }
      for(const [key,ids] of openings) if(ids.length>=R.repeatedOpeningCount&&ids.some(id=>!duplicates.has(id))) add('repeated_opening','structure','medium',ids,`La misma apertura aparece en ${ids.length} frases.`, 'Revisa la organización de las ideas; conserva el paralelismo si es deliberado.',key);
      const gramGroups=new Set();
      for(const [key,set] of ngrams) {
        const ids=[...set];const group=ids.join(',');
        if(ids.length>=R.repeatedNgramCount&&!gramGroups.has(group)&&ids.some(id=>!duplicates.has(id))) {
          gramGroups.add(group);add('repeated_phrase','repetition','medium',ids,`Una secuencia de palabras se repite en ${ids.length} frases.`, 'Revisa la repetición; la terminología técnica necesaria no debe sustituirse por sinónimos imprecisos.',key);
        }
      }
      for(const phrase of R.phrases) {
        const ids=[];
        for(const s of usable) {
          const visible=maskedSource.slice(s.start,s.end).normalize('NFC').toLowerCase();
          let at=visible.indexOf(phrase.text);
          if(at<0 || /(?:no|nunca|jamás)\s+$/u.test(visible.slice(Math.max(0,at-12),at))) continue;
          if(at>0&&/\p{L}/u.test(visible[at-1]))continue;
          if(/\p{L}/u.test(visible[at+phrase.text.length]||''))continue;
          ids.push(s.globalIdx);
        }
        if(ids.length) add('generic_expression:'+phrase.text,'specificity',ids.length>=3?'medium':'info',ids,`Expresión que conviene contextualizar${ids.length>1?` (${ids.length} apariciones)`:''}.`,phrase.advice,phrase.text);
      }
      const recent=[];
      for(const s of usable) {
        const tokens=new Set(s.words.filter(w=>!stop.has(w)));
        if(tokens.size>=8&&!duplicates.has(s.globalIdx)) {
          const previous=recent.find(p=>{
            if(p.tokens.size<8||p.paragraphIdx!==s.paragraphIdx||duplicates.has(p.id)) return false;
            const common=[...tokens].filter(w=>p.tokens.has(w)).length;
            return common>=8 && common/(tokens.size+p.tokens.size-common)>=R.similarityThreshold;
          });
          if(previous) add('lexical_overlap','repetition','medium',[previous.id,s.globalIdx],'Dos frases cercanas comparten gran parte del vocabulario.', 'Comprueba si aportan información distinta. La similitud de palabras no demuestra equivalencia de significado.');
        }
        recent.unshift({id:s.globalIdx,tokens,paragraphIdx:s.paragraphIdx});recent.length=Math.min(recent.length,R.similarityWindow);
      }
      if(body.length>=R.uniformityWindow&&bodyWords.length>=R.minWords) {
        for(let i=0;i+R.uniformityWindow<=body.length;i+=R.uniformityWindow) {
          const group=body.slice(i,i+R.uniformityWindow),lengths=group.map(s=>s.wordCount),cv=std(lengths)/avg(lengths);
          if(cv<R.uniformityCV&&!group.every(s=>duplicates.has(s.globalIdx))) add('uniform_length','structure','info',group.map(s=>s.globalIdx),'Varias frases tienen longitudes muy parecidas.', 'Comprueba si la estructura sirve al argumento. La uniformidad no identifica autoría.');
        }
      }
    }
    const byId=new Map(findings.map(f=>[f.id,f]));
    for(const s of sentences) {
      const own=s.findings.map(id=>byId.get(id));
      s.riskLevel=own.some(f=>f.severity==='high')?'high':own.some(f=>f.severity==='medium')?'medium':'low';
      s.reasons=own.map(f=>f.message);
      s.tips=[...new Set(own.map(f=>f.advice))];
      if(!own.length)s.reasons=[s.kind==='body'?'No se observaron incidencias con las reglas disponibles.':'Bloque excluido de la revisión de estilo: '+s.kind+'.'];
      s.suggestion=s.kind==='body'&&maskedSource.slice(s.start,s.end)===s.text&&!['unsupported_language','no_prose'].includes(status)?safeSuggestion(s.text):null;
      s.suggestedRewrite=s.suggestion?s.suggestion.replacement:null;
    }
    const dimensions=['repetition','structure','specificity','clarity'].map(id=>({id,count:findings.filter(f=>f.dimension===id).length,sentenceCount:new Set(findings.filter(f=>f.dimension===id).flatMap(f=>f.sentenceIds)).size}));
    const lengths=body.map(s=>s.wordCount);
    const coverage={totalWords:allWords.length,analyzedWords:['unsupported_language','no_prose'].includes(status)?0:bodyWords.length,excludedWords:allWords.length-(['unsupported_language','no_prose'].includes(status)?0:bodyWords.length),byKind:Object.fromEntries(['body','heading','bibliography','table','list'].map(k=>[k,sum(sentences.filter(s=>s.kind===k).map(s=>s.wordCount))])),language:'es',languageStatus:status==='unsupported_language'?'unsupported':'selected_not_certified'};
    const classification= status==='unsupported_language'?'Idioma no compatible':status==='no_body'||status==='no_prose'?'Sin prosa evaluable':status==='limited_sample'?'Muestra breve: validación parcial':findings.length?'Observaciones para revisar':'Sin incidencias detectadas por estas reglas';
    const highCount=body.filter(s=>s.riskLevel==='high').length;
    const medCount=body.filter(s=>s.riskLevel==='medium').length;
    const cleanCount=body.filter(s=>s.riskLevel==='low').length;
    const isEvaluable=!['unsupported_language','no_prose','no_body','empty'].includes(status)&&body.length>0;
    const cleanPercentage=isEvaluable?Math.round((cleanCount/body.length)*100):null;
    const issuePercentage=isEvaluable?Math.max(0,100-cleanPercentage):null;
    const penalty=isEvaluable?Math.min(100,Math.round(((highCount*1.0+medCount*0.5)/body.length)*100)):null;
    const validationScore=isEvaluable?Math.max(0,100-penalty):null;
    const summary=`${findings.length} observaciones en ${body.length} frases de prosa. ${coverage.analyzedWords} de ${coverage.totalWords} palabras incluidas. Índice de validación: ${validationScore!==null?validationScore+'%':'N/D'}. ${status==='limited_sample'?'La muestra es breve; no se emite una conclusión general. ':''}La autoría y la respuesta de detectores externos no están determinadas.`;
    const academic=root.ZeroIAAcademic?root.ZeroIAAcademic.academicReview(rawText):null;
    if(academic&&status==='unsupported_language') {academic.readability.score=null;academic.readability.label='Idioma no compatible';}
    return {version:R.version,ruleVersion:R.version,sourceText:rawText,sourceFingerprint:fingerprint(rawText),offsetEncoding:'UTF-16',status,classification,
      score_kind:'editorial_observations',authorship:{status:'not_determined',probability:null,externalDetectorPrediction:null},
      capabilities:{semanticReasoning:false,sourceSupportVerification:false,authorshipDetection:false},
      validationScore,cleanPercentage,issuePercentage,
      coverage,findings,dimensions,sentences,blocks,metrics:{meanSentenceWords:round(avg(lengths)),sentenceLengthCV:lengths.length>1?round(std(lengths)/avg(lengths)):null},
      totalWords:coverage.analyzedWords,totalSentences:body.length,highRiskSentences:highCount,mediumRiskSentences:medCount,
      verdictColor:findings.some(f=>f.severity==='high')?'red':findings.length?'yellow':'neutral',verdictSummary:summary,verdictBadge:classification,
      academic_review:academic,watermark_analysis:detectInvisibleWatermarks(rawText),
      externalChecks:[],
      extraction:options.extraction||{format:'text',warnings:[],coverage:'Texto proporcionado; no se verifica el documento de origen.'}};
  }
  function applySuggestion(text,analysis,sentenceId) {
    if(text!==analysis.sourceText) throw new Error('El texto cambió. Recalcula antes de aplicar una propuesta.');
    const s=analysis.sentences.find(s=>s.globalIdx===sentenceId);
    if(!s||!s.suggestion||text.slice(s.start,s.end)!==s.text) throw new Error('Propuesta no disponible o posición desactualizada.');
    return text.slice(0,s.start)+s.suggestion.replacement+text.slice(s.end);
  }
  function summary(report) {
    const lines=['# Validador Académico · Zero-IA', '',`Motor: ${report.version} · Reglas: ${report.ruleVersion}`,`Identificador de contenido (no criptográfico): ${report.sourceFingerprint}`,`Estado: ${report.classification}`,`Índice de validación: ${report.validationScore!==null?report.validationScore+'%':'N/D'} (${report.cleanPercentage!==null?report.cleanPercentage+'% texto libre de incidencias':'no evaluable'})`,'',report.verdictSummary,'','Autoría: no determinada. No predice Turnitin ni otros detectores.',`Cobertura: ${report.coverage.analyzedWords}/${report.coverage.totalWords} palabras; excluidas: ${report.coverage.excludedWords}.`,...report.extraction.warnings.map(w=>'Extracción: '+w),'','## Observaciones'];
    for(const f of report.findings) {lines.push('',`### ${f.rule} · ${f.severity}`,f.message, f.advice);for(const e of f.evidence)lines.push(`- Frase ${e.sentenceId+1} [${e.start}, ${e.end}): ${e.text}`);}
    lines.push('','## Formato Unicode',report.watermark_analysis.message);
    for(const position of report.watermark_analysis.positions)lines.push(`${position.hex} · posición ${position.start} · ${position.name}: ${position.context}`);
    if(report.academic_review&&root.ZeroIAAcademic)lines.push('',root.ZeroIAAcademic.summary(report.academic_review));
    for(const check of report.externalChecks||[]) lines.push('', '## Consulta DOI', JSON.stringify(check));
    return lines.join('\n');
  }
  root.ZeroIADetector={analyzeDocument,splitSentences:text=>S.sentenceSpans(text).map(s=>s.text),splitParagraphs:text=>text.split(/\r?\n\s*\r?\n/).map(s=>s.trim()).filter(Boolean),detectInvisibleWatermarks,stripInvisibleCharacters:text=>text.startsWith('\uFEFF')?text.slice(1):text,safeSuggestion,applySuggestion,summary,fingerprint};
  if(typeof module!=='undefined')module.exports=root.ZeroIADetector;
})(globalThis);
